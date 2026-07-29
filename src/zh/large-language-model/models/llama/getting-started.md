---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Meta AI / llama.com / developer.meta.com 官方文档 + HuggingFace meta-llama + vLLM / Ollama / PEFT 官方文档编写，对照 2025-04-05 发布的 Llama 4 系列

## 速查

- **三模型**：Scout 17B 激活 / 109B 总参 / 16E / 10M 上下文；Maverick 17B 激活 / 400B 总参 / 128E+1 shared / 1M 上下文；Behemoth 288B 激活 / 近 2T 总参 / 16E（**仍在训练、非完全开源**，作蒸馏教师）
- **架构三件套**：alternating dense + MoE 层（参数常驻、按需激活）；原生多模态 **early fusion**（文本+图像+视频联合预训练，视觉编码器基于 MetaCLIP）；**iRoPE**（interleaved RoPE）+ 推理期 attention temperature scaling 支持超长上下文
- **训练**：>30T token（Llama 3 的 2x+）、200+ 语言、FP8；后训练为 SFT → online RL（连续+自适应过滤）→ lightweight DPO，删除 >50% easy SFT 数据（Behemoth 删 95%）
- **许可**：Llama 4 Community License，**open-weight 但非 MIT/Apache**；700M MAU 以上实体需另授权；HF gated repo（接受 license + AUP，每小时批量通过）
- **三种本地通路**：Ollama（`ollama run llama4`，桌面/原型）/ LM Studio（GUI + llama.cpp + GGUF）/ vLLM（生产服务，continuous batching + PagedAttention）
- **vLLM 关键参数**：`--tensor-parallel-size 8`、`--max-model-len`、`--limit-mm-per-prompt image=10`、`--kv-cache-dtype fp8`（翻倍上下文）、`--override-generation-config attn_temperature_tuning`（Scout 长上下文必需）
- **托管 API**：Meta Model API（dev.meta.ai），与 OpenAI/Anthropic SDK **drop-in 兼容**，新账户 $20 免费额度、按 1M token 计费、3000 RPM/团队
- **微调**：优先 LoRA / QLoRA（不全参），PEFT `LoraConfig(r, lora_alpha, target_modules)`；QLoRA = NF4 量化 + LoRA，**官方推荐 LoftQ 初始化**（`init_lora_weights='loftq'`）
- **tokenizer**：tiktoken、~200K 词表，多语言友好；**知识截止 2024-10**
- **选型口诀**：单卡 H100（Int4）→ Scout；单台 8 卡 H100/H200 主机 → Maverick FP8；vLLM 生产用 tensor-parallel-size 8 起步；Behemoth 仅作教师，别幻想本地跑

## Llama 是什么

Llama 是 Meta 开源的大语言模型系列，当前主线为 2025-04-05 发布的 **Llama 4 herd**。核心定位：

- **开源旗舰**：Meta 出品，权重走 HuggingFace `meta-llama` 官方组织，vLLM / Ollama / LM Studio Day 0 支持
- **MoE 多模态**：alternating dense + MoE 层，原生 early fusion 联合文本+图像+视频
- **生态完整**：本地桌面（Ollama/LM Studio）、生产服务（vLLM）、托管 API（Meta Model API）、微调（PEFT/LoRA/QLoRA）

> 「开源权重」≠「MIT/Apache 开源许可」。Llama 4 走 Llama 4 Community License，700M MAU 以上实体需另向 Meta 申请许可。

## 三模型参数表

| 模型 | 激活参数 | 总参数 | experts | 上下文 | 状态 |
| --- | --- | --- | --- | --- | --- |
| **Scout** | 17B | 109B | 16E（1 shared + routed） | **10M** | 开源权重 |
| **Maverick** | 17B | 400B | 128 routed + 1 shared | **1M** | 开源权重（含 FP8） |
| **Behemoth** | 288B | 近 2T | 16E | - | 仍在训练，作教师，非完全开源 |

> Scout 的 Int4 量化版可塞进**单张 H100**；Maverick FP8 可塞进**单台 8 卡 H100 DGX 主机**。Behemoth 是 Scout/Maverick 蒸馏教师，benchmark 上部分 STEM 超过 GPT-4.5 / Claude Sonnet 3.7 / Gemini 2.0 Pro，但**未完全开源**。

## MoE 与 dense 的区别

| 维度 | Dense | Llama 4 MoE |
| --- | --- | --- |
| 参数使用 | 全部参与每个 token | 每 token 仅激活一小部分专家 |
| 显存占用 | 按总参数 | **仍按总参数**（全部常驻） |
| 单 token 算力 | 按总参数 | **按激活参数**（17B） |
| 训练/推理效率 | 1x | 远高于同等能力 dense |

> Maverick 每个 token 进 shared expert + 1/128 routed expert；Scout 是 1 shared + 多个 routed。**关键陷阱**：按 17B 备显存会直接 OOM——总参 109B/400B 全部常驻显存。

## 三种本地部署工具

| 工具 | 定位 | 引擎 | 命令 |
| --- | --- | --- | --- |
| **Ollama** | 桌面 / 原型 | 自研 | `ollama run llama4` |
| **LM Studio** | GUI / 桌面 | llama.cpp + GGUF | 图形界面 + `lms` CLI |
| **vLLM** | 生产 / 服务化 | 自研 | `vllm serve <repo>` |

- **Ollama**：REST API 默认 `http://localhost:11434/api`，`POST /api/generate`（单轮 prompt）、`POST /api/chat`（messages 对话，含工具调用）、`/api/pull` `/api/show` `/api/list` 管理模型；多模态图像用 `images:[base64]` 数组传入 messages
- **LM Studio**：消费 GGUF 格式（`lmstudio-community/Llama-4-Scout-17B-16E-Instruct-GGUF`），可用 `lms` CLI 把本地 `.gguf` 导入模型目录
- **vLLM**：v0.8.3+ 原生支持，continuous batching + PagedAttention 才是高并发场景的吞吐关键

> 桌面级用 Ollama / LM Studio，生产服务用 vLLM；混用会导致踩坑（vLLM 的 PagedAttention 优势在桌面级用不上，Ollama 的易用性在生产无并发批处理能力）。

## vLLM 速跑

```bash
# Scout（10M 上下文，单机 8 卡 H100/H200）
vllm serve meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tensor-parallel-size 8 \
  --max-model-len 1000000 \
  --limit-mm-per-prompt image=10 \
  --kv-cache-dtype fp8 \
  --override-generation-config attn_temperature_tuning=true
```

**关键 flag**

| flag | 作用 |
| --- | --- |
| `--tensor-parallel-size` | 张量并行卡数（Scout/Maverick 起步 8） |
| `--max-model-len` | 最大上下文长度 |
| `--limit-mm-per-prompt image=N` | 多模态每 prompt 图像上限 |
| `--kv-cache-dtype fp8` | KV cache 量化，**翻倍可用上下文**（H100 1M → H200 3.6M） |
| `--override-generation-config attn_temperature_tuning` | **Scout 长上下文必需**，不开会掉精度 |

## Meta Model API（dev.meta.ai）

Meta 官方托管通路，与 OpenAI SDK / Anthropic SDK **drop-in 兼容**：

```ts
// 复用现有 OpenAI SDK，只改 base_url 和 api_key
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

- 新账户送 **$20 免费额度**
- 按 **1M token 计费**
- 限流 **3000 RPM / 团队**
- 前代 Llama 3.3 70B 仍可在 API 中使用

> 详细定价以 [dev.meta.ai/docs/getting-started/pricing-rate-limits](https://dev.meta.ai/docs/getting-started/pricing-rate-limits) 实时为准。

## 微调（LoRA / QLoRA）速跑

```ts
// PEFT LoRA 最小配置（伪代码）
import { LoraConfig, getPeftModel } from "@huggingface/peft";

const config = new LoraConfig({
  r: 16,                              // 秩
  lora_alpha: 32,                     // 有效 scale = alpha/r
  target_modules: ["q_proj", "k_proj", "v_proj", "o_proj"],
  lora_dropout: 0.05,
  bias: "none",
  task_type: "CAUSAL_LM",
});

const peftModel = getPeftModel(baseModel, config);
// 训练 ...
peftModel.merge_and_unload();         // 部署前熔成独立模型
```

- **LoRA**：冻结原权重 W，新增低秩矩阵 A、B 使 ΔW ≈ B×A；典型 256x 参数削减
- **QLoRA**：基础模型 NF4（4-bit NormalFloat）量化 + LoRA，16GB GPU 可微调 7B 级
- **官方推荐 LoftQ 初始化**：`init_lora_weights='loftq'` + `LoftQConfig(loftq_bits=4)`，让 A/B 补偿量化误差
- **部署前必须 `merge_and_unload()`**：熔成独立零延迟模型再上 vLLM/Ollama

> 详细原理与超参见 [核心架构与微调](./guide-line.md)。

## 下一步

- [核心架构与微调](./guide-line.md)：MoE/early fusion/iRoPE 深度、LoRA/QLoRA 原理与超参、vLLM/Ollama/API 深入、反模式
- [参考](./reference.md)：完整参数表、CLI/API 命令清单、许可条款、官方资源
