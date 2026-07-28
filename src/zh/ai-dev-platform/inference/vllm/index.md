---
layout: doc
---

# vLLM

加州大学伯克利分校 Sky Computing Lab 2023 年开源的**高吞吐、低延迟 LLM 推理与服务引擎**——专为大模型部署而生的 Python 框架。vLLM 的核心创新是 **PagedAttention**：借鉴操作系统虚拟内存与分页机制管理 KV Cache，把每个请求的 KV Cache 拆成固定大小的「block」（类似内存页），按需分配、零碎片共享——这让显存利用率从传统 HuggingFace `generate` 的 ~20-40% 提升到 ~96%，单卡吞吐量提升 2-24 倍。配合 **Continuous Batching**（动态批处理，每个 step 都能加入/移除请求，打破传统「一个 batch 要等最慢请求」的痛点），vLLM 在 A100 / H100 / L40S 等 GPU 上成为开源 LLM 服务的事实标准。它原生兼容 OpenAI API（`vllm serve` 一行起服务）、支持 Tensor Parallelism / Pipeline Parallelism 多卡扩展、内置 GPTQ / AWQ / FP8 / SqueezeLLM 等量化方案、并集成 Speculative Decoding（推测解码）、Chunked Prefill、Prefix Caching 等高级优化。被 AnyScale / LMSys / Together AI / NVIDIA NIM / 阿里通义 / 百川等广泛采用，是 v0.26.x 时代开源 LLM serving 的首选。

## 评价

**优点**

- **PagedAttention 显存革命**：虚拟内存式 KV Cache 管理，显存利用率从 ~20-40% 提升到 ~96%，单卡吞吐比 HF `generate` 高 2-24 倍；这是 vLLM 一战成名的根本
- **Continuous Batching**：动态批处理，每个 step 可动态插入/剔除请求，不必等最慢的请求完成；首字延迟（TTFT）与吞吐同时优化
- **OpenAI API 零成本迁移**：`vllm serve &lt;model&gt;` 一行起服务，端点 `/v1/chat/completions` / `/v1/completions` / `/v1/embeddings` 完全兼容 OpenAI SDK，现有代码改 `base_url` 即可
- **多卡扩展成熟**：Tensor Parallel（`--tensor-parallel-size N`）+ Pipeline Parallel + Data Parallel；Ray / NCCL 底层，单机多卡到多机多卡都有官方支持
- **量化生态全**：GPTQ / AWQ / FP8（H100）/ SqueezeLLM / BitsAndBytes / GGUF 等，`--quantization` 一行切换；FP8 在 H100 上接近无损且吞吐翻倍
- **高级优化丰富**：Speculative Decoding（n-gram / draft model）、Chunked Prefill（prefill 与 decode 交错）、Prefix Caching（共享 system prompt 命中）、 guided decoding（JSON / regex / choice 约束输出）
- **Python 离线 API 同样好用**：`from vllm import LLM, SamplingParams` 离线批量推理，`llm.chat()` 自动套 chat template，适合离线评测 / 数据合成

**缺点**

- **显存门槛高**：要发挥 PagedAttention 优势需要较大 KV Cache 空间，小显存卡（如 8GB 4060）跑大模型容易 OOM；消费级场景 Ollama / llama.cpp 更合适
- **CPU / 消费级 GPU 支持弱**：主要面向数据中心 GPU（A100/H100/L40S/A10），消费级 AMD / Intel iGPU / 纯 CPU 支持远不如 llama.cpp
- **首次启动慢**：加载大模型 + 编译 CUDA graph 需几十秒到数分钟；冷启动比 Ollama 慢一个数量级
- **配置项爆炸**：`vllm serve` 有上百个 CLI flag（`--gpu-memory-utilization` / `--max-model-len` / `--swap-space` / `--block-size` ...），新手调优曲线陡
- **非 Transformer 架构支持滞后**：对 Mamba / RWKV / 状态空间模型等非 attention 架构支持不完整；新架构上线比 HF transformers 晚数月
- **版本迭代激进**：几乎每周一版，API 偶有 break；生产环境需锁定版本，跨大版本升级要测全量回归

## 文档地址

[vLLM Documentation](https://docs.vllm.ai/)

## GitHub 地址

[vllm-project/vllm](https://github.com/vllm-project/vllm)

## 幻灯片地址

<a href="/SlideStack/vllm-slide/" target="_blank">vLLM</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vLLM" target="_blank" rel="noopener noreferrer">vLLM 测试题</a>
