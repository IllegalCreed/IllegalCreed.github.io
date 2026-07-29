---
layout: doc
outline: [2, 3]
---

# 核心架构与微调

> 基于 Meta AI / llama.com / developer.meta.com 官方文档 + HuggingFace PEFT/Transformers + vLLM 官方文档编写，对照 2025-04-05 发布的 Llama 4 系列

## 速查

- **MoE**：alternating dense + MoE 层，所有参数常驻显存，每 token 仅激活 shared + 1/N routed expert；显存按总参算、算力按激活参数算
- **Early fusion**：文本+图像+视频联合预训练（不是外挂视觉模块），视觉编码器基于 MetaCLIP；预训练最多 48 图、后训练测试最多 8 图
- **iRoPE**：interleaved RoPE，无位置编码的 global attention 与带 RoPE 的 chunked local attention 按 **1:3** 交错，配合推理期 attention temperature scaling 实现 length generalization
- **训练规模**：>30T token（Llama 3 的 2x+）、200+ 语言、FP8 精度；Behemoth 在 32K GPU 上达 390 TFLOPs/GPU
- **后训练管线**：lightweight SFT → online RL（连续 + 自适应过滤）→ lightweight DPO；**删除 >50% 标记为 easy 的 SFT 数据**（Behemoth 删 95%）
- **LoRA**：ΔW ≈ B×A，A 用 Kaiming-uniform、B 全零（初始恒等映射）；典型 256x 参数削减
- **LoraConfig 必会**：`r`（秩）、`lora_alpha`（有效 scale=alpha/r）、`target_modules`（覆盖 q/k/v/o）、`use_rslora`（alpha/√r，高秩稳训练）、`init_lora_weights`（default/gaussian/loftq）
- **QLoRA**：基础模型 NF4（4-bit NormalFloat）量化 + LoRA；**官方推荐 LoftQ 初始化**让 A/B 补偿量化误差，16GB GPU 可微调 7B 级
- **推理期合并**：`merge_and_unload()` 熔独立模型零延迟；`merge_adapter()`/`unmerge_adapter()` 热切换；`add_weighted_adapter()` 多 LoRA 加权融合
- **vLLM 长上下文**：Scout 10M 必须开 `attn_temperature_tuning` + `--kv-cache-dtype fp8`；H100 1M、H200 3.6M
- **Meta Model API**：drop-in 兼容 OpenAI/Anthropic SDK，$20 免费额度，3000 RPM/团队
- **许可**：Llama 4 Community License，**700M MAU 阈值**；HF gated repo
- **反模式**：把 MoE 17B 激活等同 17B dense 显存；Behemoth 当生产模型；QLoRA 不用 LoftQ；微调不 merge 就上 vLLM；裸写 `<|image|>` 等特殊 token

## MoE 架构深度

### alternating dense + MoE 层

Llama 4 不是「全部 MoE」，而是**密集层与 MoE 层交错**（alternating）。每个 MoE 层内有：

- **1 个 shared expert**：每个 token 必经
- **N 个 routed experts**：每 token 进 1/N（Maverick 是 1/128）

**关键机制**

- 所有 experts 的权重**全部常驻显存**——不管激不激活
- 每个 token 的 forward pass 只读取 shared + 被路由到的那 1 个 expert 的权重做计算
- 训练 / 推理的**算力消耗**按 17B 激活参数算，**显存占用**按 109B / 400B 总参数算

| 模型 | shared | routed | 每 token 激活 expert |
| --- | --- | --- | --- |
| Scout | 1 | 15 | shared + 部分 routed |
| Maverick | 1 | 128 | shared + 1/128 routed |

> MoE 的核心 trade-off：用更多显存换更少算力——同样能力下，MoE 推理算力远低于等能力 dense。

### 总参 vs 激活参数（最易踩坑）

| 估算对象 | 用哪个 |
| --- | --- |
| 显存占用（能不能装下） | **总参数** 109B / 400B |
| 单 token 算力（FLOPs） | **激活参数** 17B |
| 训练算力 | 总参数 × 数据量 |

> 把「17B 激活」当 17B dense 模型算显存 = 直接 OOM。109B 总参 FP16 ≈ 218GB 显存，必须 INT4（~50GB）才能单卡 H100。

## 原生多模态 early fusion

### 与 late fusion 的区别

| 维度 | Late fusion（外挂） | Early fusion（Llama 4） |
| --- | --- | --- |
| 视觉模块 | 独立 vision encoder 后接 LLM | 联合预训练，视觉 token 进主干 |
| 训练 | 多阶段（先文本后对齐） | 单阶段联合 |
| 优势 | 模块解耦 | 跨模态理解更深 |

**Llama 4 实现**

- 视觉编码器基于 **MetaCLIP**，与**冻结的 Llama** 联合训练
- 预训练阶段：每 prompt 最多 **48 张图**
- 后训练测试：每 prompt 最多 **8 张图**

> Early fusion 让 Llama 4 在多模态推理上比传统「视觉编码器 + projector + LLM」三段式架构的模型表现更稳。

## iRoPE 与超长上下文

### iRoPE（interleaved RoPE）机制

Llama 4 用 **interleaved RoPE** 支持超长上下文：

- **Global attention**：无位置编码（noPE），负责跨距离依赖
- **Chunked local attention**：带 RoPE 的局部 attention，负责近距离细节
- 两者按 **1:3** 交错（每 1 层 global 配 3 层 local）
- 配合**推理期 attention temperature scaling**：随距离调整 attention logits 的温度，做 length generalization

### Scout 10M 上下文部署要点

| 项 | 取值 |
| --- | --- |
| 理论上限 | 10M token |
| H100 单机可用上下文 | ~1M |
| H200 单机可用上下文 | ~3.6M（开 KV cache fp8） |
| 必须开启 | `--override-generation-config attn_temperature_tuning=true` |
| 推荐开启 | `--kv-cache-dtype fp8`（翻倍上下文） |

> 10M 是理论上限。不开 attn_temperature_tuning 会**掉精度**；不量化 KV cache 会**爆显存**。

## 训练规模与后训练管线

### 预训练

- **数据量**：>30T token（Llama 3 的 2 倍+）
- **语言**：200+ 语言，100+ 语言各 >1B token（多语言 token 是 Llama 3 的 10 倍）
- **精度**：FP8
- **算力**：Behemoth 在 32K GPU 上达 **390 TFLOPs/GPU**

### 后训练管线（重构）

传统 SFT → DPO 单管线**被 Llama 4 推翻**：

```
lightweight SFT  →  online RL（连续 + 自适应数据过滤）  →  lightweight DPO
```

**关键改动**

- **删除 >50% 标记为 easy 的 SFT 数据**（Behemoth 删 95%）——与传统「数据越多越好」相反
- online RL 阶段做**连续训练** + **自适应过滤**
- DPO 只做 lightweight 微调

> 不要把 Llama 4 后训练说成「传统 SFT → DPO」——会失实。

## LoRA / QLoRA 深度

### LoRA 原理

冻结原权重 W，新增低秩矩阵 A、B 使权重更新 ΔW ≈ B × A：

```
原始前向：  y = W·x
LoRA 前向： y = W·x + B·A·x
```

- A 用 **Kaiming-uniform** 初始化
- B 全零初始化
- 保证初始时 B·A = 0，即恒等映射（不改变原模型行为）
- 训练时只更新 A、B，原权重 W 冻结

**参数削减示例**：4096 × 4096 矩阵（16.7M 参数），r=8 时 A 是 4096×8、B 是 8×4096，共 **65K 可训练参数**，削减 256x。

### LoraConfig 关键超参

| 字段 | 作用 | 经验值 |
| --- | --- | --- |
| `r` | 秩，越低参数越少 | 8 / 16 |
| `lora_alpha` | 缩放系数，有效 scale = alpha / r | 2 × r |
| `target_modules` | 挂载的线性层 | `["q_proj","k_proj","v_proj","o_proj"]` |
| `use_rslora` | 用 alpha/√r 而非 alpha/r（高秩稳训练） | true（高 r 时） |
| `init_lora_weights` | A/B 初始化方式 | `default` / `gaussian` / `loftq` |
| `bias` | 是否训练 bias | `"none"` |
| `layers_to_transform` | 只挂特定层 | 全部 |
| `modules_to_save` | 训练并保存原始模块 | `["embed_tokens"]` 等 |

> 官方起步经验：r=8/16、lora_alpha=2×r、target_modules 覆盖 q/k/v/o、bias='none'。高 r 时用 use_rslora=True（alpha/√r）数值更稳。

### QLoRA 与 LoftQ

**QLoRA = NF4 量化 + LoRA**

- 基础模型 NF4（4-bit NormalFloat）量化
- 在量化后的模型上挂 LoRA 训练
- 16GB 消费级 GPU 可微调 7B 级模型

**LoftQ 初始化（官方推荐）**

- 标准流程：先 bitsandbytes 量化，再挂 LoRA（默认初始化）→ **丢精度**
- LoftQ 流程：`init_lora_weights='loftq'` + `LoftQConfig(loftq_bits=4)`，A/B 初始化即**补偿量化误差**
- PEFT 官方明确推荐 LoftQ

> 不要先自行量化再挂默认初始化的 LoRA——会丢精度。

### 推理期合并（部署前必做）

```ts
// 把 LoRA 权重熔进基础权重，得独立模型
const merged = peftModel.merge_and_unload();
await merged.savePretrained("./merged-model");

// 其他工具方法（不熔）：
peftModel.merge_adapter();       // 临时熔，可 unmerge 切回
peftModel.unmerge_adapter();     // 解熔，切回原 + LoRA 分离
peftModel.add_weighted_adapter({ // 多 LoRA 加权融合
  adapters: ["lora-a", "lora-b"],
  weights: [0.7, 0.3],
  adapter_name: "merged-lora",
});
```

| 方法 | 用途 |
| --- | --- |
| `merge_and_unload()` | **部署前熔成独立模型**，零额外延迟 |
| `merge_adapter()` / `unmerge_adapter()` | 在 PeftModel 内热切换多适配器 |
| `add_weighted_adapter()` | 多 LoRA 加权融合成新适配器 |

> 保留未合并版本以便后续迭代；部署的版本必须 merge。

## 部署 / API 深度

### vLLM（生产服务）

| 场景 | 命令模板 |
| --- | --- |
| Scout 单机 8 卡 | `vllm serve meta-llama/Llama-4-Scout-17B-16E-Instruct --tensor-parallel-size 8 --max-model-len 1000000` |
| Maverick FP8 | `vllm serve meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 --tensor-parallel-size 8` |
| 多模态 | 加 `--limit-mm-per-prompt image=10` |
| 长上下文 | 加 `--kv-cache-dtype fp8` + `--override-generation-config attn_temperature_tuning=true` |

**为什么生产用 vLLM 不用 Ollama**

- vLLM 的 **continuous batching**：动态拼批，吞吐数倍于静态批
- vLLM 的 **PagedAttention**：KV cache 分页管理，显存利用率高
- Ollama / LM Studio 优化单机易用性，无连续批处理能力

### Ollama（桌面 / 原型）

```bash
ollama run llama4           # 一行起
```

REST API 默认 `http://localhost:11434/api`：

| 端点 | 用途 |
| --- | --- |
| `POST /api/generate` | 单轮 prompt |
| `POST /api/chat` | messages 对话（含工具调用） |
| `POST /api/embeddings` | 向量 |
| `POST /api/pull` | 拉模型 |
| `POST /api/show` | 查模型信息 |
| `GET /api/list` | 列已装模型 |

多模态图像用 `images: ["base64-string"]` 数组传入 messages。

### Meta Model API（dev.meta.ai 托管）

```ts
// OpenAI SDK drop-in
const client = new OpenAI({
  apiKey: process.env.META_API_KEY,
  baseURL: "https://api.llama.com/compat/v1/",
});

// 或 Anthropic SDK drop-in
import Anthropic from "anthropic";
const claude = new Anthropic({
  apiKey: process.env.META_API_KEY,
  baseURL: "https://api.llama.com/compat/v1/",
});
```

- 新账户送 **$20 免费额度**
- 按 **1M token 计费**
- 限流 **3000 RPM / 团队**
- 前代 **Llama 3.3 70B** 仍可在 API 中使用

## 反模式（避坑）

- **把「MoE 17B 激活」等同「17B dense 显存」**：总参 109B/400B 全部常驻显存，按总参备显存；按 17B 备会直接 OOM
- **Scout 默认拉到 10M 上下文却不开 attn_temperature_tuning / fp8 KV cache**：掉精度或爆显存，10M 是理论上限
- **把 Behemoth 当生产模型写进架构**：仍在训练、仅作教师、非完全开源权重
- **把后训练说成「传统 SFT → DPO 单管线」**：Llama 4 是 SFT → online RL → lightweight DPO，且主动删 >50% easy SFT 数据
- **QLoRA 先 bitsandbytes 量化再挂默认 LoRA**：丢精度，应用 LoftQ 初始化
- **LoRA 微调完不 merge 就上 vLLM/Ollama serve**：保留适配器热路径在生产推理引擎常不支持或掉性能，先 `merge_and_unload()`
- **LoRA target_modules 过窄（只挂 q_proj）**：欠拟合，应覆盖 q/k/v/o 等多个线性层
- **混淆「开源权重」与「开源许可」**：Llama 4 是 open-weight 但走 Llama 4 Community License，700M MAU 阈值，HF 是 gated repo
- **拿 Llama 4 回答 2024-10 之后事件却不联网 / RAG**：知识截止 2024-10，闭口不提 cutoff 会产出过时 / 幻觉
- **在 mustache / Jinja 模板里裸写 `<|image|>` / `<|begin_of_text|>` 特殊 token**：被 Vue / VitePress 当插值或 HTML 标签致 build 崩，用 `v-pre` 或围栏代码块包裹
- **以为 Maverick FP8 是无损**：FP8 在数值敏感场景仍有微小精度差异，关键业务需做回归对比

## 下一步

- [参考](./reference.md)：完整参数表、CLI/API 命令清单、许可条款、官方资源
