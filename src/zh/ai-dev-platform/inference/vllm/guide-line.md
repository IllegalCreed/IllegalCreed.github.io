---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vLLM 0.26.x 官方文档编写（docs.vllm.ai）—— PagedAttention / Continuous Batching / 多卡并行 / 量化 / Speculative Decoding / 部署运维 / 性能调优

## 为什么 vLLM 快：PagedAttention

理解 vLLM 的第一性原理——**KV Cache 是 LLM 推理显存的主要消耗者，而传统连续分配方式浪费严重**。

### KV Cache 是什么

Transformer 自回归生成时，每生成一个 token，都要对「之前所有 token」做 attention。如果每步都重算所有历史 token 的 K/V 投影会非常慢。所以推理时把每层每头的 K、V 缓存下来——这就是 **KV Cache**。

对于一个 L 层、H 头、每头维度 D、序列长度 N 的模型，单个请求的 KV Cache 大小：

```
KV Cache 大小 = 2 × L × H × D × N × 2 bytes（FP16）
```

以 Llama-2-70B（L=80, H=64, D=128）为例，batch=32、N=2048 时 KV Cache 就要 ~**26 GB**，比 70B 模型权重（140GB FP16 / 70GB INT8）还吃显存。

### 传统连续分配的浪费

HuggingFace `transformers.generate` 把每个请求的 KV Cache 在显存里**连续分配**，导致两类浪费：

1. **内部碎片**：请求按最大长度预分配，实际生成比预期短，末尾空间浪费（最严重时浪费 60-80%）
2. **外部碎片**：请求不断进出，显存被切成不连续碎片，新请求分配不到大块连续空间

### PagedAttention：分页式 KV Cache

vLLM 借鉴操作系统**虚拟内存分页**机制：

- 把每个请求的逻辑 KV Cache 切成固定大小的 **block**（默认每 block 16 个 token 的 KV）
- 维护一张 **block table**（类似页表）：逻辑 block → 物理 block 映射
- 物理 block 在 GPU 显存里**按需分配、可任意离散存放**，不需要连续
- 物理 block 池共享给所有请求，请求结束立即归还

**收益**：

| 指标 | 传统连续分配 | PagedAttention |
|---|---|---|
| 显存碎片 | 严重（内部 + 外部） | 几乎为零 |
| 显存利用率 | ~20-40% | ~96% |
| 同卡可并发请求 | 少 | 多 3-10 倍 |
| 单卡吞吐 | 基准 | **2-24x 提升** |

### Copy-on-Write：Prefix Caching 的基础

由于 KV Cache 是分块离散管理的，多个请求**共享相同前缀**（如 system prompt）时，vLLM 用 Copy-on-Write 让它们**只读共享同一物理 block**，只有分叉后才各自复制——这就是 `--enable-prefix-caching` 的底层基础，能把 RAG / Agent 场景的 TTFT 砍掉一半以上。

## Continuous Batching（动态批处理）

第二个核心优化。理解它要先看传统批处理的痛点。

### 静态批处理（naive batching）

传统做法：凑齐 N 个请求组成一个 batch，一起前向，**等 batch 里最长的请求生成完**才整体结束。

问题：batch 内各请求长度差异大（一个生成 10 token，一个生成 500 token），短请求早早结束却要陪着长请求占着显存与算力——**GPU 大量时间在「空转」**。

### Continuous Batching（in-flight batching）

vLLM 在**每个 iteration（每生成一个 token）**都重新决定 batch 成员：

1. 某请求生成完 `&lt;eos&gt;` → 立即从 batch 移除，释放 KV Cache
2. 等待队列里有新请求 → 立即加入 batch
3. 每步 batch 大小动态变化

```
iteration 1: [req_A, req_B, req_C]  → 生成 token
iteration 2: [req_A, req_B, req_C]  → req_C 完成，剔除
iteration 3: [req_A, req_B, req_D]  → req_D 从队列加入
```

**收益**：GPU 几乎没有空转时间，吞吐量相比静态批处理提升 2-10 倍。这是 TGI / TensorRT-LLM / vLLM 都采用的核心技术（TRT-LLM 叫 in-flight batching）。

## 量化

vLLM 通过 `--quantization` 支持多种量化方案，用显存换吞吐（权重量化减半）或换吞吐（INT8/FP8 算力翻倍）。

| 方案 | bit | 显存 | 精度 | 速度 | 典型场景 |
|---|---|---|---|---|---|
| **FP16/BF16** | 16 | 1.0x | 基准 | 1.0x | 基准 |
| **GPTQ** | 4/8 | ~0.3x | 略损 | 1.1x | 显存吃紧，社区已量化好的模型多 |
| **AWQ** | 4 | ~0.3x | 优于 GPTQ | 1.2x | 4bit 精度更稳，推理略快 |
| **FP8**（H100） | 8 | 0.5x | 接近无损 | **2.0x** | H100/H200 首选，硬件原生支持 |
| **BitsAndBytes** | 8/4 | 0.5x/0.3x | 一般 | 0.7x | 兜底，跨硬件兼容 |
| **GGUF** | 多种 | 可变 | 可变 | 一般 | llama.cpp 生态复用 |
| **SqueezeLLM** | 3 | ~0.2x | 较好 | 慢 | 极致压缩研究 |

### 用法

```bash
# 直接加载已量化的 HF repo
vllm serve TheBloke/Llama-2-13B-AWQ --quantization awq

# FP8（需 H100/H200/Ada）
vllm serve meta-llama/Llama-3-70B --quantization fp8

# 动态量化：传 FP16 模型，让 vLLM 现场量化到 FP8
vllm serve meta-llama/Llama-3-70B --quantization fp8 \
  --quantization-fp8-dynamic
```

::: tip FP8 是 H100 时代首选
Hopper 架构（H100/H200/Ada L40S）硬件原生支持 FP8（E4M3/E5M2），vLLM 在这些卡上跑 FP8 既能砍一半显存又能近乎翻倍吞吐，且精度损失可忽略。生产部署优先考虑 FP8。
:::

## 多卡并行

大模型单卡装不下（如 70B FP16 需 140GB），必须切分到多卡。vLLM 支持三种并行。

### Tensor Parallelism（TP，张量并行）

把每一层的权重矩阵**按维度切开**分到多卡，每卡算一部分，用 NCCL all-reduce 同步。

```bash
# 4 卡张量并行（最常用）
vllm serve meta-llama/Llama-3-70B --tensor-parallel-size 4
```

特点：

- 通信开销大（每层都要 all-reduce），适合 NVLink / InfiniBand 高带宽互连
- 推理 batch 小时可能被通信拖累
- TP=N 需要 N 卡，且 N 必须能整除模型的头数

### Pipeline Parallelism（PP，流水线并行）

把模型**按层切**成 N 段，每段一张卡，请求像流水线一样穿过。

```bash
vllm serve <model> --tensor-parallel-size 2 --pipeline-parallel-size 2
```

特点：

- 通信量小（只在层段边界传 hidden state）
- 适合跨节点（互连带宽低）部署
- 会引入「气泡」（bubble），吞吐略低于纯 TP

### 组合：TP × PP

```
8 卡部署 405B：--tensor-parallel-size 4 --pipeline-parallel-size 2
```

### 多节点：Ray + Data Parallel

vLLM 支持用 Ray 跑多节点 Data Parallel（每节点一份模型副本，负载均衡）。详见官方 distributed 部署文档。

## Speculative Decoding（推测解码）

用一个小而快的 **draft model** 猜测接下来 K 个 token，再用大模型一次性验证——猜对的 token 直接接受，猜错的回退。在「接受率高」的场景（结构化输出、代码生成）能砍 30-70% 延迟。

```bash
# 用 n-gram（无需额外模型）推测
vllm serve <model> --speculative-model "[ngram]" \
  --num-speculative-tokens 5

# 用小模型作 draft
vllm serve meta-llama/Llama-3-70B \
  --speculative-model meta-llama/Llama-3-1B \
  --num-speculative-tokens 5
```

适用场景：

- 输出可预测（代码、JSON、重复结构）→ 接受率高，收益大
- 高温度随机生成 → 接受率低，收益小甚至负收益

## Chunked Prefill

传统 vLLM 把 prefill（处理 prompt）与 decode（生成 token）分开：prefill 一旦开始就霸占 GPU，正在 decode 的请求被卡住。

Chunked Prefill（`--enable-chunked-prefill`）把长 prompt 的 prefill **切成小块**，与 decode 交错调度，让 prefill 长请求不再阻塞 decode 短请求的 TTFT。对长 prompt（RAG / 长文档问答）效果显著。

## 部署运维

### gunicorn + uvicorn workers？不，vLLM 自己管

vLLM serve 内部已经基于 `uvicorn` + async 引擎处理并发，**不需要套 gunicorn**。多 worker 部署请用前面讲的 **Data Parallel**（每 worker 一个引擎实例 + 前置 L7 负载均衡）。

### 监控指标

vLLM 暴露 Prometheus metrics 端点（`/metrics`）：

| 指标 | 含义 |
|---|---|
| `vllm:num_requests_running` | 正在生成的请求数 |
| `vllm:num_requests_waiting` | 等待队列长度 |
| `vllm:gpu_cache_usage_perc` | KV Cache 使用率 |
| `vllm:time_to_first_token_seconds` | TTFT（首字延迟） |
| `vllm:time_per_output_token_seconds` | 每 token 生成时间 |
| `vllm:e2e_request_latency_seconds` | 端到端延迟 |

生产建议配 Grafana 监控 `gpu_cache_usage_perc`（接近 1 说明 KV Cache 满了，该加显存或限流）与 `num_requests_waiting`（队列堆积告警）。

### 健康检查

```bash
curl http://localhost:8000/health
# 返回 200 即健康
```

### OOM 排查清单

| 现象 | 排查方向 |
|---|---|
| 启动即 OOM | `--gpu-memory-utilization` 调低；`--max-model-len` 调小；换量化模型 |
| 跑一段时间 OOM | KV Cache 满，调 `--max-num-seqs`（并发上限）；启用 prefix caching |
| 多卡通信超时 | NCCL 未检测到 NVLink；检查 `nvidia-smi topo -m` 与 `NCCL_*` 环境变量 |

## 性能调优 Checklist

1. **硬件匹配**：H100/H200 优先 FP8；A100 用 BF16 或 AWQ；消费卡换 Ollama
2. **量化**：能 FP8 就 FP8；社区有 AWQ 模型直接用
3. **开 Prefix Caching**：RAG/Agent 场景必开（`--enable-prefix-caching`）
4. **开 Chunked Prefill**：长 prompt 场景必开
5. **`--max-model-len` 别设太大**：按真实业务最大长度设，留更多显存给 KV
6. **TP 选对**：单机 NVLink 用 TP；跨机用 PP 或 TP+PP
7. **Speculative Decoding**：结构化输出场景试 `--speculative-model "[ngram]"`
8. **监控**：必上 Prometheus + Grafana，盯 `gpu_cache_usage_perc` 与队列长度

## 与其他方案对比

| 需求 | 推荐 |
|---|---|
| 数据中心高吞吐 LLM serving | **vLLM** |
| 极致 NVIDIA 性能 + 工程预算 | TensorRT-LLM |
| 本地消费级 / CPU | Ollama / llama.cpp |
| 全栈 ML serving（含预处理、多模型路由） | BentoML / Triton Inference Server |
| 一键生产 + 量化 + 部署 | TGI（HuggingFace TGI）|
| 模型生态 + 最简服务 | vLLM（OpenAI 兼容）|
