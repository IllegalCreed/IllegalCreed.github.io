---
layout: doc
---

# Ollama

2023 年开源的**本地 LLM 运行时**——目标是「**让在本地跑大模型像运行 Docker 一样简单**」。Ollama 把 llama.cpp 的 GGUF 量化推理、模型管理、CLI 交互、OpenAI 兼容 API 打包成一个单一二进制 + 一组 `ollama` 子命令：`ollama run llama3.2` 一行就能在 MacBook / Windows / Linux 上拉起一个可对话的 LLM，无需关心量化级别、显存分配、上下文长度这些细节。它用 **Modelfile**（类似 Dockerfile 的声明式模型描述）定义模型——`FROM` 指定基础权重、`PARAMETER` 调采样参数、`SYSTEM` 设系统提示、`TEMPLATE` 写 chat template，让用户能用一份文件复刻、定制、分发模型（`ollama create` / `ollama push` 到 ollama registry）。底层跑 **GGUF** 格式（llama.cpp 生态的量化格式，支持 Q4_K_M / Q5_K_M / Q8_0 等多档量化），跨 NVIDIA / AMD / Apple Silicon / Intel / 纯 CPU 通吃，是消费级与边缘部署的事实标准。OpenAI 兼容 API（默认 `http://localhost:11434`）让它能无缝接入 LangChain / LlamaIndex / Open WebUI / Dify 等生态。支持多模态（llava / Llama 3.2 Vision）、工具调用（tool calling）、结构化输出（JSON mode）。

## 评价

**优点**

- **零配置上手**：`ollama run llama3.2` 一行下载 + 量化 + 起服务，无需 CUDA、无需 Python 环境；MacBook M 系列原生 Metal 加速
- **跨硬件通吃**：底层 GGUF + llama.cpp，NVIDIA / AMD / Apple Silicon / Intel iGPU / 纯 CPU 都能跑；这是 vLLM/TensorRT-LLM 完全做不到的覆盖面
- **Modelfile 声明式**：FROM/TEMPLATE/SYSTEM/PARAMETER/ADAPTER，像 Dockerfile 一样版本化、复刻、分发模型；`ollama create` / `ollama push` 工作流与 Docker 高度一致
- **OpenAI 兼容 API**：默认 `:11434`，端点 `/v1/chat/completions` 完全兼容 OpenAI SDK，LangChain/LlamaIndex/Dify/Open WebUI 改 `base_url` 即用
- **模型仓库丰富**：官方 ollama registry 托管 Llama / Qwen / Mistral / DeepSeek / Gemma / Phi 等主流模型，多档量化按 tag 选择
- **资源占用友好**：4bit GGUF 让 8B 模型在 8GB 内存的笔记本上流畅运行；自动按硬件选量化级别
- **多模态与工具调用**：支持 llava/Llama 3.2 Vision 多模态、function calling、JSON mode、structured output

**缺点**

- **吞吐量低**：单请求 / 小 batch 为主，没有 vLLM 的 PagedAttention/Continuous Batching；高并发服务场景吞吐远不如 vLLM/TGI
- **不适合数据中心**：面向消费级/边缘，多卡并行（TP）支持弱；A100/H100 集群高并发请用 vLLM
- **GGUF 格式生态割裂**：与 HuggingFace 默认的 safetensors/PyTorch 格式不通用，新模型需先转 GGUF（社区 `llama.cpp/convert.py`）
- **Modelfile 调试反馈慢**：`ollama create` 每次都要重新打包，没有热重载；TEMPLATE 用 Go template 语法，错误信息不友好
- **首字延迟（TTFT）偏高**：相比 vLLM 的 prefix caching 与 chunked prefill，Ollama 长 prompt 的首字延迟明显
- **并发能力有限**：默认单请求串行处理多请求（OLLA_NUM_PARALLEL 可调但受内存约束），不适合做高并发 API 网关
- **GUI 依赖第三方**：自带只有 CLI，图形界面要装 Open WebUI / LM Studio 类工具

## 文档地址

[Ollama Documentation](https://ollama.readthedocs.io/)

## GitHub 地址

[ollama/ollama](https://github.com/ollama/ollama)

## 幻灯片地址

<a href="/SlideStack/ollama-slide/" target="_blank">Ollama</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Ollama" target="_blank" rel="noopener noreferrer">Ollama 测试题</a>
