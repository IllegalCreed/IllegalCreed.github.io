---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 NVIDIA Triton Inference Server 26.06（仓库 v2.70.x）官方文档 docs.nvidia.com/deeplearning/triton-inference-server 编写 —— config.pbtxt 全字段、各 backend 文件格式、客户端 API、CLI、Metrics 速查

## 启动参数（CLI）

| 参数 | 默认 | 用途 |
|---|---|---|
| `--model-repository=&lt;path&gt;` | 无（必填） | 模型仓库根目录，可重复指定多个 |
| `--model-control-mode=poll\|explicit\|none` | `poll` | 模型加载策略；poll 周期扫描，explicit 用 API 控制 |
| `--repository-poll-secs=&lt;s&gt;` | `15` | poll 模式扫描间隔 |
| `--http-port=&lt;port&gt;` | `8000` | HTTP/REST 端口 |
| `--grpc-port=&lt;port&gt;` | `8001` | gRPC 端口 |
| `--metrics-port=&lt;port&gt;` | `8002` | Prometheus metrics 端口 |
| `--allow-grpc=true\|false` | `true` | 启用 gRPC |
| `--allow-http=true\|false` | `true` | 启用 HTTP |
| `--strict-model-config=true\|false` | `true` | false 时自动补全缺省字段 |
| `--strict-readiness=true\|false` | `true` | 模型未 READY 时整个 server 不 READY |
| `--cuda-memory-pool-byte-size=&lt;gpu&gt;:<bytes>` | 0（禁用） | 预分配 GPU 内存池，避免运行时 cudaMalloc |
| `--pinned-memory-pool-byte-size=&lt;bytes&gt;` | 0（禁用） | pinned host 内存池 |
| `--exit-on-error=true\|false` | `true` | 模型加载出错时是否退出 |
| `--log-verbose=&lt;level&gt;` | `0` | 日志详细级别（1 最简，更多更啰嗦） |

## config.pbtxt 全字段

### 顶层必填

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | 是 | 模型名，必须与目录名一致 |
| `backend` 或 `platform` | 是 | 后端实现；二选一，新代码用 `backend` |
| `max_batch_size` | 是 | 0 = 不支持 batching；> 1 = 启用 dynamic_batching 默认行为 |

### backend / platform 取值

| backend | 模型文件 | 典型场景 |
|---|---|---|
| `tensorrt` | `model.plan` | 最高性能，需 `trtexec` 编译 |
| `onnxruntime` | `model.onnx` | 跨框架通用 |
| `pytorch`（libtorch） | `model.pt` | TorchScript |
| `tensorflow` | `model.savedmodel/`、`model.graphdef`、`model.keras` | TF 全形态 |
| `python` | `model.py` | 自定义逻辑 / 前后处理 |
| `openvino` | IR 文件 | Intel 硬件 |
| `fil` | forest 文件 | 树模型 |
| `dali` | pipeline 文件 | 数据预处理 |
| `tensorrt_llm` | checkpoint | LLM 推理引擎 |
| `vllm` | HF 目录 | LLM 推理引擎 |

### input / output

```protobuf
input [
  {
    name: "INPUT0"
    data_type: TYPE_FP32
    dims: [ 16 ]            # 不含 batch 维（由 max_batch_size 隐含）
    reshape { shape: [ 4, 4 ] }   # 可选：把 dims 重塑给模型
    allow_ragged_batch: false     # 可选：ragged input（不同样本不同长度）
  }
]
```

| data_type | C 类型 |
|---|---|
| `TYPE_BOOL` / `TYPE_UINT8` / `TYPE_INT8` / `TYPE_INT16` / `TYPE_INT32` / `TYPE_INT64` | 对应整型 |
| `TYPE_FP16` / `TYPE_FP32` / `TYPE_FP64` / `TYPE_BF16` | 对应浮点 |
| `TYPE_STRING` | bytes |

### dynamic_batching

| 字段 | 默认 | 说明 |
|---|---|---|
| `preferred_batch_size: [...]` | `[ 4 ]` | 优先凑这些尺寸 |
| `max_queue_delay_microseconds` | `0` | 兜底等待时长，0 = 立即发送 |
| `preserve_ordering` | `false` | 严格按到达顺序响应 |
| `priority_levels` | `0` | 启用优先级队列层数 |
| `default_priority_level` | `0` | 默认优先级 |
| `priority_queue_policy` | 无 | 每个优先级的 `ACCEPT` / `MAX_QUEUE_SIZE` |

### instance_group

```protobuf
instance_group [
  {
    count: 2                       # 实例数
    kind: KIND_GPU                 # 或 KIND_CPU
    gpus: [ 0, 1 ]                 # GPU ID 列表（kind=KIND_GPU 时）
    secondary_devices [ { kind: KIND_NVDLA device_id: 0 } ]   # 可选辅助设备
    host_policy: "policy_0"        # 可选绑定 host policy
    profile: "profile_default"     # 可选多配置 profile
    passive: false                 # true = 不接收推理，仅预热
  }
]
```

### sequence_batching

```protobuf
sequence_batching {
  max_sequence_batching_queue_microseconds: 1000
  batch_strategy: OLDEST            # 或 FIFO
  dynamic_batching { ... }          # 内嵌 dynamic batcher
}
```

### rate_limiter

```protobuf
rate_limiter {
  resources [ { name: "gpu0" count: 1 global: false } ]
  priority: 1
}
```

### model_warmup

```protobuf
model_warmup [
  {
    name: "warmup_fp32"
    batch_size: 1
    inputs: {
      map { key: "INPUT0" value: { fp32_contents: [ 0.0 ] dims: [ 16 ] } }
    }
  }
]
```

模型在 Triton 标记 READY 前必须先跑完所有 warmup。

### response_cache / 其他

| 字段 | 默认 | 说明 |
|---|---|---|
| `response_cache { enable: true }` | `false` | 同输入命中缓存 |
| `model_version_policy` | `latest { num_versions: 1 }` | 版本策略 |
| `optimization { execution_accelerators { ... } }` | 无 | 后端特定加速器配置（如 ORT EP） |

## REST API 关键端点

| 端点 | 方法 | 用途 |
|---|---|---|
| `/v2/health/live` | GET | 服务存活（进程在） |
| `/v2/health/ready` | GET | 服务就绪（含模型加载） |
| `/v2/models/&lt;name&gt;/ready` | GET | 单模型 READY |
| `/v2/models/&lt;name&gt;` | GET | 模型 metadata（输入输出形状 / 类型） |
| `/v2/models/&lt;name&gt;/infer` | POST | 推理调用 |
| `/v2/repository/models/&lt;name&gt;/load` | POST | explicit 模式加载 |
| `/v2/repository/models/&lt;name&gt;/unload` | POST | explicit 模式卸载 |
| `/v2/models/&lt;name&gt;/stats` | GET | 单模型统计 |

## Python 客户端 API

```python
import tritonclient.grpc as grpcclient   # 或 httpclient

client = grpcclient.InferenceServerClient(url="localhost:8001")

# 服务状态
client.is_server_live()         # bool
client.is_server_ready()        # bool
client.is_model_ready("identity_onnx")

# 推理
inp = grpcclient.InferInput("INPUT0", [1, 16], "FP32")
inp.set_data_from_numpy(np_arr)
out = grpcclient.InferRequestedOutput("OUTPUT0", class_count=0)
resp = client.infer("identity_onnx", [inp], outputs=[out])
resp.as_numpy("OUTPUT0")        # numpy array

# 异步
fut = client.infer(..., inputs=[inp], outputs=[out])
resp = fut.get()
```

## 关键 Metrics（Prometheus）

| 指标 | 含义 |
|---|---|
| `nv_inference_request_success` | 成功推理数（按模型） |
| `nv_inference_request_failure` | 失败数 |
| `nv_inference_inference_queue_duration_us` | 入队到执行的等待时间 |
| `nv_inference_inference_duration_us` | 单次推理耗时（含等待） |
| `nv_inference_compute_infer_duration_us` | 纯后端计算耗时 |
| `nv_inference_exec_count` | 已执行推理数 |
| `nv_inference_request_duration_us` | 端到端响应时间 |
| `nv_gpu_memory_used_bytes` | GPU 显存占用 |
| `nv_gpu_utilization` | GPU 利用率 |

## 版本与 NGC 镜像

- GitHub 仓库：`triton-inference-server/server`，最新稳定 v2.70.x（2026 年对应 NGC 26.06）
- 容器：`nvcr.io/nvidia/tritonserver:&lt;YY.MM&gt;-py3`，与仓库 tag 对应
- 关键里程碑：24.08 起 gRPC 流式支持错误码；23.10 起 Python gRPC 客户端支持取消 inflight 请求
