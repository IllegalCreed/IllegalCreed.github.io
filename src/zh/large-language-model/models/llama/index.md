---
layout: doc
---

# Llama

Llama 是 Meta 开源的**大语言模型系列**，当前主线为 2025-04-05 发布的 **Llama 4 herd**——原生多模态、MoE（Mixture-of-Experts）架构的旗舰开源权重模型。Llama 4 一次发布三个尺寸：**Scout**（17B 激活 / 109B 总参 / 16 experts / 10M 上下文，Int4 量化可塞进单张 H100）、**Maverick**（17B 激活 / 400B 总参 / 128 routed + 1 shared experts / 1M 上下文，FP8 checkpoint 可塞进单台 8 卡 H100 DGX）、**Behemoth**（288B 激活 / 近 2T 总参 / 16 experts，仍在训练，作 Scout/Maverick 蒸馏教师，非完全开源权重）。架构关键点：alternating dense + MoE 层（所有参数常驻显存、每 token 仅激活一小部分专家）、原生多模态 **early fusion**（文本 + 图像 + 视频联合预训练，视觉编码器基于 MetaCLIP）、**iRoPE**（interleaved RoPE：无位置编码的 global attention 与带 RoPE 的 chunked local attention 1:3 交错，配合推理期 attention temperature scaling 实现 length generalization）。训练规模 >30T token（Llama 3 的 2 倍+）、200+ 语言、FP8 精度；后训练管线重构为 lightweight SFT → online RL（连续 + 自适应过滤）→ lightweight DPO，主动删除 >50% 标记为 easy 的 SFT 数据（Behemoth 删 95%）。生态全栈：权重走 HuggingFace `meta-llama` gated repo（需接受 Llama 4 Community License + AUP，700M MAU 以上实体需另授权），本地桌面级用 Ollama（`ollama run llama4`）或 LM Studio（GGUF + llama.cpp），生产服务用 vLLM v0.8.3+（Day 0 支持 FP8/INT4 量化、tensor-parallel、continuous batching + PagedAttention），托管 API 用 Meta Model API（dev.meta.ai，与 OpenAI/Anthropic SDK drop-in 兼容，新账户 $20 免费额度），微调走 HuggingFace PEFT 的 LoRA / QLoRA（冻结原权重 + 低秩矩阵，官方推荐 LoftQ 初始化）。tokenizer 基于 tiktoken、~200K 词表，知识截止 **2024-10**。

## 评价

**优点**

- **开源旗舰、生态默认**：Meta 出品、HuggingFace 官方权重、vLLM/Ollama/LM Studio Day 0 支持，是开源大模型的事实基准之一
- **MoE 性能/效率双优**：所有参数常驻显存但每 token 仅激活 17B，单 token 算力按激活参数算，能力却对标 GPT-4.5 / Claude Sonnet 3.7 / Gemini 2.0 Pro
- **超长上下文**：Scout 10M / Maverick 1M，配合 iRoPE + attention temperature tuning，长文档 / RAG / 大代码库友好
- **原生多模态 early fusion**：文本 + 图像 + 视频联合预训练，无需外挂视觉模块，多模态推理一步到位
- **多工具/多通路**：Ollama 桌面、vLLM 生产、Meta Model API 托管、PEFT 微调，覆盖从原型到生产全链路
- **drop-in 兼容**：Meta Model API 可直接用现有 OpenAI/Anthropic SDK，零迁移成本

**缺点**

- **open-weight ≠ MIT/Apache**：Llama 4 Community License 有 700M MAU 商用门槛，HF 是 gated repo（每小时批量审核），法律合规需自核
- **MoE 显存压力大**：虽然激活参数小，但**总参数 109B/400B 全部常驻显存**，按总参备显存，单机部署门槛高
- **10M 上下文是理论上限**：实际跑需要 INT4 量化 + 张量并行 + KV cache fp8，不开 attn_temperature_tuning 会掉精度
- **Behemoth 未完全开源**：仅作蒸馏教师、仍在训练，把它当生产模型会失实
- **知识截止 2024-10**：回答 2024-10 之后事件需联网 / RAG
- **Lab 与生产差距大**：Scout Maverick 在 benchmark 上对标闭源旗舰，但实际生产中稳定性、工具调用、对齐细节仍需自测

## 文档地址

- [Llama 官方总入口](https://www.llama.com/)
- [Llama 4 Model Cards（developer.meta.com）](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama4/)
- [Meta AI 官方博客《The Llama 4 herd》](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [Meta Model API（dev.meta.ai）](https://dev.meta.ai/)
- [HuggingFace meta-llama 组织](https://huggingface.co/meta-llama)
- [vLLM Day 0 Llama 4 支持公告](https://vllm.ai/blog/2025-04-05-llama4)
- [PEFT LoRA/QLoRA 概念指南](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)

## GitHub地址

[meta-llama/llama-models](https://github.com/meta-llama/llama-models) · [meta-llama/llama3](https://github.com/meta-llama/llama3) · [vllm-project/vllm](https://github.com/vllm-project/vllm) · [huggingface/peft](https://github.com/huggingface/peft)

## 幻灯片地址

<a href="/SlideStack/llama-slide/" target="_blank">Llama</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Llama 测试题</a>
