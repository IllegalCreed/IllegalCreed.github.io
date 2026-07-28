---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vLLM 0.26.x 官方文档编写（docs.vllm.ai）

## 速查

- 系统要求：Linux（推荐 Ubuntu 22.04+）、Python 3.9-3.12、CUDA 12.1+ / ROCm 6.x / Intel XPU / CPU（功能受限）
- 安装（NVIDIA）：`uv pip install vllm --torch-backend=auto`（官方推荐）或 `pip install vllm`
- 离线推理：`from vllm import LLM, SamplingParams` → `llm = LLM(model="...")` → `llm.chat(messages)`
- 起服务：`vllm serve Qwen/Qwen2.5-1.5B-Instruct` → 默认监听 `http://localhost:8000`
- OpenAI 兼容端点：`POST /v1/chat/completions` / `/v1/completions` / `/v1/embeddings` / `/v1/models`
- 关键 CLI flag：`--host` / `--port` / `--tensor-parallel-size` / `--gpu-memory-utilization` / `--max-model-len` / `--quantization` / `--api-key`
- 鉴权：`--api-key sk-xxx` 或环境变量 `VLLM_API_KEY`
- 多卡：`vllm serve &lt;model&gt; --tensor-parallel-size 4`（TP）+ `--pipeline-parallel-size 2`（PP）
- 量化：`--quantization gptq` / `awq` / `fp8` / `bitsandbytes` / `gguf`
- 流式：OpenAI 风格 `"stream": true`，响应为 SSE `data: {...}\n\ndata: [DONE]`
- 进阶特性：Speculative Decoding（`--speculative-model`）、Prefix Caching（`--enable-prefix-caching`）、Chunked Prefill（`--enable-chunked-prefill`）
- 客户端：直接 `curl` / OpenAI Python SDK / LangChain / LlamaIndex 均可

## vLLM 是什么

vLLM 是一个**为吞吐量与延迟同时优化**的开源 LLM 推理引擎。它的定位与 HuggingFace `transformers.generate` / Ollama / TensorRT-LLM 形成清晰对照：

| 维度 | vLLM | HF `transformers.generate` | Ollama | TensorRT-LLM |
|---|---|---|---|---|
| 目标场景 | **高吞吐服务**（数据中心） | 教学 / 实验 / 离线 | **本地消费级**运行 | 极致 NVIDIA 生产部署 |
| KV Cache 管理 | **PagedAttention**（分页） | 连续分配，碎片严重 | 连续（llama.cpp） | 连续 + Paged（v0.10+） |
| 批处理 | **Continuous Batching** | 静态批 | 单请求为主 | In-flight Batching |
| 显存利用率 | ~**96%** | ~20-40% | ~80% | ~90% |
| 相对吞吐 | **基准 1.0** | 0.05-0.1 | 0.3-0.5（单卡） | 1.0-1.3 |
| 硬件 | NVIDIA / AMD / Intel / CPU | 通用 | 通用（含消费级） | 仅 NVIDIA |
| OpenAI API | 原生兼容 | 无 | 兼容 | 需自己封装 |
| 易用性 | pip 装即用 | 最易 | 最易（跨平台） | 编译复杂 |

**核心结论**：vLLM = 「**PagedAttention + Continuous Batching + OpenAI API**」，在数据中心 GPU 上是开源 LLM serving 的默认选择；消费级 / CPU 场景请用 Ollama。

## 安装

### 推荐：uv（NVIDIA）

```bash
# 安装 uv（如未装）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建虚拟环境
uv venv .venv --python 3.11
source .venv/bin/activate

# 安装 vllm（自动选合适 torch + CUDA 后端）
uv pip install vllm --torch-backend=auto
```

`--torch-backend=auto` 会让 uv 自动识别机器上的 CUDA 版本，匹配对应的 PyTorch wheel，避免手动指定 `+cu121` 这类后缀。

### 备选：pip

```bash
pip install vllm
```

### 其他后端

| 后端 | 安装命令 | 备注 |
|---|---|---|
| AMD ROCm | `pip install vllm --rocm-version 6.2` | 需 ROCm 6.x |
| Intel GPU (XPU) | `pip install --pre vllm xpu` | 需 Intel oneAPI |
| CPU（功能受限） | `VLLM_TARGET_DEVICE=cpu pip install vllm` | 仅推理，性能差 |
| AWS Trainium/Inferentia | 见官方 Neuron 文档 | 特殊 wheel |

### Docker

```bash
# 官方镜像（含 CUDA runtime）
docker run --gpus all \
  -p 8000:8000 \
  --ipc=host \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-1.5B-Instruct
```

## 第一个例子：离线推理

vLLM 的 Python API 与服务化 API 共用同一引擎。离线批量推理（评测、数据合成）用 `LLM` 类：

```python
from vllm import LLM, SamplingParams

# 1. 加载模型（首次会从 HuggingFace 下载）
llm = LLM(model="Qwen/Qwen2.5-1.5B-Instruct")

# 2. 定义采样参数
sampling_params = SamplingParams(
    temperature=0.8,
    top_p=0.95,
    max_tokens=128,
)

# 3. 批量推理（连续传入多个 prompt，vLLM 自动 continuous batching）
prompts = [
    "请用一句话解释什么是 KV Cache。",
    "Write a Python function to reverse a string.",
    "PagedAttention 解决了什么问题？",
]
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    prompt = output.prompt
    generated = output.outputs[0].text
    print(f"Prompt: {prompt!r}\nGenerated: {generated!r}\n")
```

### 用 chat template：`llm.chat`

直接传 OpenAI 风格 messages，vLLM 自动套模型的 chat template：

```python
messages_list = [
    [{"role": "user", "content": "你好，请介绍一下你自己。"}],
    [{"role": "system", "content": "你是数学老师"},
     {"role": "user", "content": "1+1 等于几？"}],
]
outputs = llm.chat(messages_list, sampling_params)
print(outputs[0].outputs[0].text)
```

## 起一个 OpenAI 兼容服务

生产环境几乎都用 `vllm serve`：

```bash
# 最简：一行起服务
vllm serve Qwen/Qwen2.5-1.5B-Instruct

# 指定端口与鉴权
vllm serve Qwen/Qwen2.5-1.5B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --api-key sk-my-secret
```

启动后服务监听 `http://localhost:8000`，提供：

| 端点 | 用途 |
|---|---|
| `GET /v1/models` | 列出已加载模型 |
| `POST /v1/chat/completions` | 对话补全（最常用） |
| `POST /v1/completions` | 文本补全（基础模型） |
| `POST /v1/embeddings` | 文本向量化（需模型支持） |
| `POST /v1/audio/transcriptions` | 语音识别（Whisper 类） |
| `POST /score` / `/classify` | 评分 / 分类（Cross-Encoder） |

### 用 curl 调用

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-my-secret" \
  -d '{
    "model": "Qwen/Qwen2.5-1.5B-Instruct",
    "messages": [{"role": "user", "content": "你好"}],
    "temperature": 0.7,
    "stream": false
  }'
```

### 用 OpenAI Python SDK

只改 `base_url` 和 `api_key`，代码完全不动：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="sk-my-secret",
)

resp = client.chat.completions.create(
    model="Qwen/Qwen2.5-1.5B-Instruct",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

## 流式输出（SSE）

vLLM 流式完全兼容 OpenAI SSE 格式：

```python
stream = client.chat.completions.create(
    model="Qwen/Qwen2.5-1.5B-Instruct",
    messages=[{"role": "user", "content": "写一首关于秋天的诗"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

## 常用 CLI flag 速查

| Flag | 默认 | 说明 |
|---|---|---|
| `--model` | 必填 | HuggingFace repo 或本地路径 |
| `--host` / `--port` | `127.0.0.1` / `8000` | 监听地址 |
| `--api-key` | 无 | API key（鉴权） |
| `--tensor-parallel-size` (`-tp`) | 1 | 张量并行 GPU 数 |
| `--pipeline-parallel-size` (`-pp`) | 1 | 流水线并行层数 |
| `--gpu-memory-utilization` | 0.9 | 显存占用比例（留 10% 给其他） |
| `--max-model-len` | 模型 config | 最大上下文长度（token） |
| `--quantization` | None | `gptq` / `awq` / `fp8` / `bitsandbytes` / `gguf` |
| `--dtype` | auto | `auto` / `float16` / `bfloat16` / `float8` |
| `--swap-space` | 4（GB） | CPU 侧 KV swap 空间 |
| `--enable-prefix-caching` | False | 开启 prompt 前缀缓存 |
| `--enable-chunked-prefill` | 视模型 | prefill 与 decode 交错 |
| `--speculative-model` | None | 推测解码的 draft model |
| `--served-model-name` | =model | 对外暴露的模型名（覆盖真实名） |
| `--generation-config` | auto | 用 HF 的 generation_config 还是 vLLM 默认 |
| `--attention-backend` | auto | `FLASH_ATTN` / `FLASHINFER` / `XFORMERS` 等 |

## 模型从哪来

vLLM 默认从 HuggingFace Hub 下载。国内可用 ModelScope（魔搭）：

```bash
# 用 ModelScope 而非 HuggingFace
export VLLM_USE_MODELSCOPE=true
vllm serve Qwen/Qwen2.5-1.5B-Instruct
```

## 下一步

入门到此为止——你已经能起服务、调用 API、跑离线推理。下一章 `guide-line.md` 深入讲 **PagedAttention 原理 / Continuous Batching 调度 / 多卡并行 / 量化 / Speculative Decoding / 部署运维**等核心主题。
