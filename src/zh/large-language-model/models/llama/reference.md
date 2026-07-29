---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Meta AI / llama.com / developer.meta.com 官方文档 + HuggingFace PEFT/Transformers + vLLM 官方文档编写，对照 2025-04-05 发布的 Llama 4 系列

## 速查

- 三模型：**Scout** 17B 激活 / 109B 总参 / 16E / 10M 上下文；**Maverick** 17B 激活 / 400B 总参 / 128E+1 shared / 1M 上下文；**Behemoth** 288B 激活 / 近 2T 总参 / 16E（仍在训练、非完全开源）
- 架构：alternating dense + MoE、原生多模态 early fusion（MetaCLIP）、iRoPE（1:3 交错 + attention temperature scaling）
- 训练：>30T token、200+ 语言、FP8 精度
- 后训练：SFT → online RL → lightweight DPO，删 >50% easy SFT 数据
- 许可：**Llama 4 Community License**（700M MAU 阈值）；HF gated repo
- vLLM 关键：`--tensor-parallel-size 8`、`--max-model-len`、`--limit-mm-per-prompt image=10`、`--kv-cache-dtype fp8`、`--override-generation-config attn_temperature_tuning`
- Ollama 速跑：`ollama run llama4`
- API：Meta Model API（dev.meta.ai），OpenAI/Anthropic SDK drop-in，$20 免费额度，3000 RPM/团队
- LoRA 必会：`r`、`lora_alpha`、`target_modules`、`use_rslora`、`init_lora_weights='loftq'`
- 推理期合并：`merge_and_unload()` 部署前必做
- tokenizer：tiktoken、~200K 词表；**知识截止 2024-10**
- 完整说明见 [入门](./getting-started.md) / [核心架构与微调](./guide-line.md)

## 三模型参数完整表

| 模型 | 激活参数 | 总参数 | experts | 上下文 | HF 仓库 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| **Scout** | 17B | 109B | 16E（1 shared + routed） | 10M | `meta-llama/Llama-4-Scout-17B-16E-Instruct` | 开源权重 |
| **Maverick** | 17B | 400B | 128 routed + 1 shared | 1M | `meta-llama/Llama-4-Maverick-17B-128E-Instruct` 及 `-FP8` | 开源权重 |
| **Behemoth** | 288B | 近 2T | 16E | - | - | 仍在训练，作教师，非完全开源 |

## 架构关键参数

| 项 | 取值 |
| --- | --- |
| 架构 | alternating dense + MoE layers |
| 多模态 | 原生 early fusion（文本+图像+视频） |
| 视觉编码器 | MetaCLIP（与冻结 Llama 联合训练） |
| 位置编码 | iRoPE（interleaved RoPE） |
| attention 交错比 | global : local = **1 : 3** |
| 推理期调参 | attention temperature scaling |
| 预训练图像上限 | 每 prompt ≤ 48 |
| 后训练测试图像上限 | 每 prompt ≤ 8 |
| tokenizer | tiktoken |
| 词表大小 | ~200K |
| 知识截止 | **2024-10** |
| 支持语言 | 200+（100+ 语言各 >1B token） |

## 训练关键数据

| 项 | 取值 |
| --- | --- |
| 预训练 token 量 | **>30T**（Llama 3 的 2x+） |
| 语言数 | 200+ |
| 多语言 token | Llama 3 的 10 倍 |
| 精度 | FP8 |
| Behemoth 算力峰值 | 390 TFLOPs/GPU（32K GPU） |
| 后训练 SFT 数据删除率 | >50%（标记为 easy），Behemoth 删 95% |

## vLLM 命令清单

### 基础启动

```bash
# Scout 单机 8 卡（10M 上下文，需量化）
vllm serve meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tensor-parallel-size 8 \
  --max-model-len 1000000 \
  --limit-mm-per-prompt image=10 \
  --kv-cache-dtype fp8 \
  --override-generation-config attn_temperature_tuning=true

# Maverick FP8（单台 8 卡 H100 DGX）
vllm serve meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 \
  --tensor-parallel-size 8 \
  --max-model-len 1000000
```

### 关键 flag

| flag | 作用 |
| --- | --- |
| `--tensor-parallel-size` | 张量并行卡数（Scout/Maverick 起步 8） |
| `--pipeline-parallel-size` | 流水线并行层数 |
| `--max-model-len` | 最大上下文长度 |
| `--limit-mm-per-prompt image=N` | 多模态每 prompt 图像上限 |
| `--kv-cache-dtype fp8` | KV cache 量化，**翻倍可用上下文**（H100 1M → H200 3.6M） |
| `--quantization fp8` | 模型权重 FP8 量化 |
| `--quantization int4` | 模型权重 INT4 量化（Scout 单卡 H100 必备） |
| `--override-generation-config attn_temperature_tuning=true` | **Scout 长上下文必需** |
| `--gpu-memory-utilization` | GPU 显存利用率上限（默认 0.9） |
| `--max-num-seqs` | 连续批处理最大序列数 |

### vLLM 版本要求

- v0.8.3+：Day 0 支持 Llama 4 Scout / Maverick
- 关键依赖：transformers、torch、xformers

## Ollama 命令清单

```bash
ollama run llama4                # 一行起服务
ollama pull llama4               # 拉模型
ollama list                       # 列已装模型
ollama show llama4                # 查模型信息
ollama rm llama4                  # 删模型
```

### REST API

| 端点 | 方法 | 用途 |
| --- | --- | --- |
| `/api/generate` | POST | 单轮 prompt |
| `/api/chat` | POST | messages 对话（含工具调用） |
| `/api/embeddings` | POST | 向量 |
| `/api/pull` | POST | 拉模型 |
| `/api/push` | POST | 推模型 |
| `/api/show` | POST | 查模型信息 |
| `/api/list` | GET | 列已装模型 |
| `/api/delete` | DELETE | 删模型 |

多模态图像：`messages` 内的 `content` 字段支持 `images: ["base64-string"]` 数组。

## Meta Model API（dev.meta.ai）

### drop-in 兼容示例

```ts
// OpenAI SDK
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.META_API_KEY,
  baseURL: "https://api.llama.com/compat/v1/",
});

const resp = await client.chat.completions.create({
  model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
  messages: [{ role: "user", content: "用一句话介绍 Llama 4" }],
});
```

### 关键参数

| 项 | 取值 |
| --- | --- |
| base_url | `https://api.llama.com/compat/v1/` |
| 鉴权 | API key（dev.meta.ai 一键生成） |
| 免费额度 | 新账户 $20 |
| 计费方式 | 按 1M token |
| 限流 | 3000 RPM / 团队 |
| 可用模型 | Llama 4 Maverick / Scout / Llama 3.3 70B |
| SDK 兼容 | OpenAI SDK / Anthropic SDK |

> 详细定价 / SLA 以 [dev.meta.ai/docs/getting-started/pricing-rate-limits](https://dev.meta.ai/docs/getting-started/pricing-rate-limits) 实时为准。

## LoRA / QLoRA 配置速查

### LoraConfig 字段

| 字段 | 类型 | 作用 | 常用值 |
| --- | --- | --- | --- |
| `r` | int | 秩，越低可训练参数越少 | 8 / 16 / 32 |
| `lora_alpha` | int | 缩放系数，有效 scale = alpha / r | 2 × r |
| `target_modules` | str[] | 挂载的线性层 | `["q_proj","k_proj","v_proj","o_proj"]` |
| `lora_dropout` | float | dropout 防过拟合 | 0.05 |
| `bias` | str | 是否训练 bias | `"none"` |
| `task_type` | str | 任务类型 | `"CAUSAL_LM"` / `"FEATURE_EXTRACTION"` |
| `use_rslora` | bool | 用 alpha/√r 缩放（高秩稳训练） | true（高 r 时） |
| `init_lora_weights` | str/bool | A/B 初始化方式 | `default` / `gaussian` / `loftq` / `False`（完全随机） |
| `layers_to_transform` | int[] | 只挂特定层 | None（全部） |
| `layers_pattern` | str | 层名匹配模式 | - |
| `modules_to_save` | str[] | 训练并保存原模块 | `["embed_tokens"]` 等 |
| `rank_pattern` | dict | 不同层用不同 r | `{}` |
| `alpha_pattern` | dict | 不同层用不同 alpha | `{}` |

### 推理期合并方法

| 方法 | 用途 |
| --- | --- |
| `merge_and_unload()` | **部署前熔成独立模型**，零额外延迟 |
| `merge_adapter()` | 临时熔（仍保留 adapter，可 unmerge） |
| `unmerge_adapter()` | 解熔，切回原 + LoRA 分离 |
| `add_weighted_adapter(adapters, weights, adapter_name)` | 多 LoRA 加权融合 |
| `delete_adapter(adapter_name)` | 删指定 adapter |
| `set_adapter(adapter_name)` | 切换当前活跃 adapter |

### QLoRA 完整流程

```ts
// 1. 用 LoftQ 初始化的 QLoRA（官方推荐）
import { LoraConfig, LoftQConfig, getPeftModel, prepare_model_for_kbit_training } from "@huggingface/peft";

// 基础模型加载时用 NF4 量化
const baseModel = await loadModelNF4("meta-llama/Llama-4-Scout-17B-16E-Instruct");
const preparedModel = prepare_model_for_kbit_training(baseModel);

const loftqConfig = new LoftQConfig({ loftq_bits: 4 });
const config = new LoraConfig({
  r: 16,
  lora_alpha: 32,
  target_modules: ["q_proj", "k_proj", "v_proj", "o_proj"],
  init_lora_weights: "loftq",
  loftq_config: loftqConfig,
  task_type: "CAUSAL_LM",
});

const peftModel = getPeftModel(preparedModel, config);
// 训练 ...
const merged = peftModel.merge_and_unload();  // 部署前熔
await merged.savePretrained("./merged-model");
```

## HuggingFace 加载速查

```ts
// 多模态（image-text-to-text）
import { AutoProcessor, AutoModelForImageTextToText } from "@huggingface/transformers";

const repo = "meta-llama/Llama-4-Scout-17B-16E-Instruct";
const processor = await AutoProcessor.from_pretrained(repo);
const model = await AutoModelForImageTextToText.from_pretrained(repo);

// gated repo：需先接受 Llama 4 Community License + AUP，每小时批量通过
// 用 HF token 鉴权：process.env.HF_TOKEN
```

## 许可与合规

| 项 | 取值 |
| --- | --- |
| 许可类型 | Llama 4 Community License |
| 是否 MIT/Apache | **否** |
| 商用门槛 | 700M MAU 以上实体需另向 Meta 申请许可 |
| 权重获取 | HuggingFace `meta-llama` gated repo |
| 审核机制 | 接受 license + AUP 后每小时批量处理 |
| 附带限制 | AUP（Acceptable Use Policy）禁止滥用场景 |
| 前代许可 | Llama 3.x 走 Llama 3 Community License（同样有 700M MAU 阈值） |

> 商用前先核 700M MAU 条款 + AUP，别把 Llama 4 当 MIT 随意二开商用。

## LM Studio（GGUF）

| 项 | 取值 |
| --- | --- |
| 引擎 | llama.cpp |
| 模型格式 | GGUF |
| 社区仓库 | `lmstudio-community/Llama-4-Scout-17B-16E-Instruct-GGUF` |
| CLI 工具 | `lms` |
| 导入本地 GGUF | `lms file add <path-to-gguf>` 把本地文件纳入 LM Studio 模型目录 |

## 官方资源

- Llama 官方总入口：[https://www.llama.com/](https://www.llama.com/)
- Llama 4 Model Cards：[https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama4/](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama4/)
- Meta AI 博客《The Llama 4 herd》：[https://ai.meta.com/blog/llama-4-multimodal-intelligence/](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- Meta Model API：[https://dev.meta.ai/](https://dev.meta.ai/)
- 定价与限流：[https://dev.meta.ai/docs/getting-started/pricing-rate-limits](https://dev.meta.ai/docs/getting-started/pricing-rate-limits)
- HuggingFace meta-llama：[https://huggingface.co/meta-llama](https://huggingface.co/meta-llama)
- HuggingFace PEFT LoRA 指南：[https://huggingface.co/docs/peft/main/en/conceptual_guides/lora](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)
- vLLM Day 0 公告：[https://vllm.ai/blog/2025-04-05-llama4](https://vllm.ai/blog/2025-04-05-llama4)
- vLLM 文档：[https://docs.vllm.ai](https://docs.vllm.ai)
- Ollama 官网：[https://ollama.com](https://ollama.com)
- LM Studio 官网：[https://lmstudio.ai](https://lmstudio.ai)
- GitHub：[meta-llama/llama-models](https://github.com/meta-llama/llama-models) · [meta-llama/llama3](https://github.com/meta-llama/llama3) · [vllm-project/vllm](https://github.com/vllm-project/vllm) · [huggingface/peft](https://github.com/huggingface/peft) · [ollama/ollama](https://github.com/ollama/ollama)
