---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vLLM 0.26.x 官方文档编写 —— Python API / CLI flag / 量化方案 / 采样参数 / 环境变量 / 指标 / 硬件支持矩阵

## Python API

### `LLM` —— 离线推理核心类

```python
from vllm import LLM, SamplingParams

llm = LLM(
    model="Qwen/Qwen2.5-1.5B-Instruct",   # 必填：HF repo / 本地路径
    tensor_parallel_size=1,                # TP 数
    pipeline_parallel_size=1,              # PP 数
    dtype="auto",                          # auto / float16 / bfloat16 / float32 / float8
    quantization=None,                     # gptq / awq / fp8 / bitsandbytes / gguf
    gpu_memory_utilization=0.9,            # 显存占用上限
    max_model_len=None,                    # 最大上下文长度
    enable_prefix_caching=False,           # 前缀缓存
    enforce_eager=False,                   # 禁用 CUDA Graph（调试用）
    kv_cache_dtype="auto",                 # auto / fp8
    swap_space=4,                          # CPU swap 空间（GB）
    max_num_seqs=256,                      # 最大并发请求数
    download_dir=None,                     # 自定义模型下载目录
    trust_remote_code=False,               # 是否执行模型自带代码
)
```

### `LLM` 主要方法

| 方法 | 用途 |
|---|---|
| `llm.generate(prompts, sampling_params)` | 文本补全式生成（不做 chat template） |
| `llm.chat(messages, sampling_params)` | 对话式生成（自动套 chat template） |
| `llm.embed(prompts)` | 文本向量化（需模型支持） |
| `llm.encode(image)` | 多模态图像编码 |

### `SamplingParams` —— 采样参数

```python
SamplingParams(
    n=1,                    # 每个 prompt 生成几条
    best_of=None,           # best-of-n 采样
    presence_penalty=0.0,
    frequency_penalty=0.0,
    repetition_penalty=1.0,
    temperature=1.0,
    top_p=1.0,
    top_k=-1,               # -1 表示禁用
    min_p=0.0,
    seed=None,
    stop=None,              # 停止字符串列表
    stop_token_ids=None,    # 停止 token id 列表
    max_tokens=16,          # 最大生成长度
    min_tokens=0,
    logprobs=None,          # 返回 top-N logprobs
    prompt_logprobs=None,
    guided_decoding=None,   # JSON / regex / choice 约束
)
```

### `RequestOutput` —— 输出结构

```python
@dataclass
class RequestOutput:
    request_id: str
    prompt: str
    prompt_token_ids: list[int]
    outputs: list[CompletionOutput]  # n 条结果
    finished: bool
    metrics: RequestMetrics          # TTFT / e2e / token 时间

@dataclass
class CompletionOutput:
    index: int
    text: str
    token_ids: list[int]
    cumulative_logprob: float
    logprobs: list[dict] | None
    finish_reason: str               # stop / length / ...
    stop_reason: int | str | None
```

## CLI flag 全表（vllm serve）

| Flag | 默认 | 说明 |
|---|---|---|
| `--model` | 必填 | 模型 repo 或路径 |
| `--served-model-name` | =model | 对外暴露名（多别名用逗号） |
| `--tokenizer` | =model | tokenizer 路径（与模型分离时用） |
| `--revision` | None | HF 模型版本 |
| `--code-revision` | None | HF code 版本 |
| `--download-dir` | 默认缓存 | 下载目录 |
| `--load-format` | auto | auto / pt / safetensors / npcache / dummy |
| `--dtype` | auto | auto / half / float16 / bfloat16 / float / float32 / float8 |
| `--kv-cache-dtype` | auto | auto / fp8 / fp8_e5m2 / fp8_e4m3 |
| `--quantization` | None | gptq / awq / fp8 / bitsandbytes / gguf / ... |
| `--quantization-fp8-dynamic` | False | FP8 动态量化（输入 FP16）|
| `--max-model-len` | 模型 config | 最大上下文 |
| `--guided-decoding-backend` | outlines | outlines / lm-format-enforcer / xgrammar |
| `--worker-use-ray` | False | 用 Ray 跑 worker（多节点）|
| `--pipeline-parallel-size` (`-pp`) | 1 | PP 数 |
| `--tensor-parallel-size` (`-tp`) | 1 | TP 数 |
| `--max-parallel-loading-workers` | 1 | 并行加载 worker |
| `--ray-workers-use-nsight` | False | Ray worker 用 nsight |
| `--block-size` | 16 | KV block 大小（8/16/32）|
| `--enable-prefix-caching` | False | 前缀缓存 |
| `--enable-chunked-prefill` | 模型相关 | chunked prefill |
| `--use-v2-block-manager` | True | 用 V2 block manager |
| `--num-lookahead-slots` | 0 | 推测解码 lookahead |
| `--seed` | None | 随机种子 |
| `--swap-space` | 4 | CPU swap 空间（GB）|
| `--gpu-memory-utilization` | 0.9 | 显存上限比例 |
| `--max-num-batched-tokens` | 模型相关 | 单步最大 token |
| `--max-num-seqs` | 256 | 最大并发 |
| `--max-logprobs` | 20 | 最大 logprobs 数 |
| `--disable-log-stats` | False | 关闭统计 |
| `--quantization-param-path` | None | 量化参数 yaml |
| `--host` | 127.0.0.1 | 监听 IP |
| `--port` | 8000 | 监听端口 |
| `--uvicorn-log-level` | info | uvicorn 日志级 |
| `--allow-credentials` | False | CORS credentials |
| `--allowed-origins` | `["*"]` | CORS origins |
| `--allowed-methods` | `["*"]` | CORS methods |
| `--allowed-headers` | `["*"]` | CORS headers |
| `--api-key` | None | API key |
| `--served-model-name` | =model | 对外名 |
| `--chat-template` | None | 自定义 chat template（覆盖）|
| `--response-role` | assistant | chat 响应 role |
| `--ssl-keyfile` | None | SSL 私钥 |
| `--ssl-certfile` | None | SSL 证书 |
| `--ssl-ca-certs` | None | SSL CA |
| `--enable-server-load-tracking` | False | 服务端负载追踪 |
| `--disable-server-load-tracking` | True | 关闭 |
| `--speculative-model` | None | draft model |
| `--num-speculative-tokens` | None | 推测 token 数 |
| `--speculative-draft-tensor-parallel-size` | None | draft 的 TP |
| `--generation-config` | auto | auto / vllm |
| `--enable-prompt-tokens-details` | False | 返回 cached_tokens |
| `--enable-auto-choices` | False | 自动 choice |
| `--enable-disable-log-requests` | False | 禁请求日志 |
| `--max-request-len` | 8192 | 最大请求长度 |
| `--disable-frontend-multiprocessing` | False | 单进程前端 |

## OpenAI 兼容 API

| 端点 | 方法 | 用途 |
|---|---|---|
| `/v1/models` | GET | 列出模型 |
| `/v1/chat/completions` | POST | 对话补全 |
| `/v1/completions` | POST | 文本补全 |
| `/v1/embeddings` | POST | 向量 |
| `/v1/audio/transcriptions` | POST | 语音识别 |
| `/v1/images/generations` | POST | 文生图 |
| `/v1/audio/speech` | POST | TTS |
| `/score` | POST | Cross-encoder 评分 |
| `/classify` | POST | 分类 |
| `/rerank` | POST | 重排序 |
| `/health` | GET | 健康检查 |
| `/metrics` | GET | Prometheus 指标 |
| `/load` | GET | 加载状态 |

## 量化方案支持矩阵

| 方案 | CLI 参数 | 硬件 | 来源 |
|---|---|---|---|
| FP16/BF16 | `--dtype float16` | 通用 | 基准 |
| GPTQ | `--quantization gptq` | NVIDIA / AMD | HF 已量化模型 |
| AWQ | `--quantization awq` | NVIDIA | HF 已量化模型 |
| FP8 | `--quantization fp8` | Hopper（H100/Ada） | 硬件原生 |
| BitsAndBytes | `--quantization bitsandbytes` | NVIDIA | 兜底 |
| GGUF | `--quantization gguf` | NVIDIA / CPU | llama.cpp 生态 |
| SqueezeLLM | `--quantization squeezellm` | NVIDIA | 研究 |
| DeepSpeedFP | `--quantization deepspeedfp` | NVIDIA | DeepSpeed |
| FBGEMM | `--quantization fbgemm` | NVIDIA | Meta |

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `VLLM_API_KEY` | None | 等价 `--api-key` |
| `VLLM_USE_MODELSCOPE` | false | 从 ModelScope 下载 |
| `VLLM_NO_USAGE_STATS` | false | 关闭使用统计上报 |
| `VLLM_DO_NOT_SHUTDOWN_ON_USAGE_ERROR` | false | 出错不退出 |
| `HF_TOKEN` / `HUGGING_FACE_HUB_TOKEN` | None | HF 私有模型访问 |
| `HF_HOME` | `~/.cache/huggingface` | HF 缓存目录 |
| `CUDA_VISIBLE_DEVICES` | 全部 | 限定可见 GPU |
| `NCCL_*` | - | NCCL 通信调优 |
| `VLLM_TARGET_DEVICE` | cuda | 调试用（cpu/xpu） |

## Prometheus 指标

| 指标 | 类型 | 含义 |
|---|---|---|
| `vllm:num_requests_running` | Gauge | 运行中请求数 |
| `vllm:num_requests_waiting` | Gauge | 队列请求数 |
| `vllm:num_requests_swapped` | Gauge | 被 swap 的请求数 |
| `vllm:gpu_cache_usage_perc` | Gauge | KV Cache 占用率 |
| `vllm:cpu_cache_usage_perc` | Gauge | CPU swap 占用率 |
| `vllm:time_to_first_token_seconds` | Histogram | TTFT |
| `vllm:time_per_output_token_seconds` | Histogram | 单 token 生成时间 |
| `vllm:e2e_request_latency_seconds` | Histogram | 端到端延迟 |
| `vllm:request_inference_time_seconds` | Histogram | 推理时间 |
| `vllm:request_prompt_tokens` | Histogram | prompt token 数 |
| `vllm:request_generation_tokens` | Histogram | 生成 token 数 |
| `vllm:request_max_num_generation_tokens` | Histogram | 最大生成长度 |

## 硬件支持矩阵

| 厂商 | 架构 | 支持程度 | 备注 |
|---|---|---|---|
| NVIDIA | Hopper（H100/H200） | **完整** | FP8 最佳 |
| NVIDIA | Ada（L40S/L4/RTX 4090） | **完整** | FP8 也支持 |
| NVIDIA | Ampere（A100/A10/A30） | **完整** | BF16 主力 |
| NVIDIA | Volta（V100） | 部分 | 无 BF16 |
| AMD | MI210/MI250/MI300 | 完整 | ROCm 6.x |
| Intel | Xeon CPU / Arc / PVC | 部分 | XPU backend |
| AWS | Inferentia2/Trainium | 部分 | Neuron |
| Google | TPU | 部分 | TPU backend |
| 其他 | 纯 CPU | 受限 | 仅推理，慢 |

## 版本里程碑

| 版本 | 时间 | 重点 |
|---|---|---|
| 0.1.x | 2023.06 | 首发，PagedAttention 论文配套 |
| 0.2.x | 2023.10 | AWQ 支持、Llama-2 优化 |
| 0.3.x | 2024.01 | TensorRT-LLM 部分对齐、streaming |
| 0.4.x | 2024.04 | Speculative Decoding、Pipeline Parallel |
| 0.5.x | 2024.07 | FP8 量化、多模态、Mistral/Mixtral 优化 |
| 0.6.x | 2024.09 | Chunked Prefill、v1 架构开始 |
| 0.7.x | 2024.12 | DeepSeek-V3/R1 优化 |
| 0.8.x | 2025.02 | v1 引擎稳定，性能大幅提升 |
| 0.9.x | 2025.04 | MTP（multi-token prediction）|
| 0.10+ | 2025.06+ | 更多非 Transformer 架构、extended thinking |

## 参考

- 官方文档：<https://docs.vllm.ai/>
- PagedAttention 论文（SOSP'23）：<https://arxiv.org/abs/2309.06180>
- GitHub：<https://github.com/vllm-project/vllm>
