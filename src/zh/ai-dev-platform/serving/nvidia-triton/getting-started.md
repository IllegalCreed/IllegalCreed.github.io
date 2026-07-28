---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 NVIDIA Triton Inference Server 26.06（仓库 v2.70.x）官方文档 docs.nvidia.com/deeplearning/triton-inference-server 编写

## 速查

- 容器获取：`docker pull nvcr.io/nvidia/tritonserver:26.06-py3`（NGC 上的官方镜像，10+ GB）
- 启动一条命令：`docker run --gpus=all -p 8000:8000 -p 8001:8001 -p 8002:8002 -v $(pwd)/model_repo:/models nvcr.io/nvidia/tritonserver:26.06-py3 tritonserver --model-repository=/models`
- 三端口：**8000 = HTTP/REST**、**8001 = gRPC**、**8002 = Prometheus Metrics**
- 模型仓库结构：`model_repo/&lt;model_name&gt;/config.pbtxt` + `model_repo/&lt;model_name&gt;/<version>/<model_file>`
- 配置三件套：`name`、`backend`/`platform`、`max_batch_size`、`input[]`、`output[]`
- 后端支持：`tensorrt`（plan）、`onnxruntime`（onnx）、`pytorch`（libtorch .pt）、`tensorflow`（savedmodel/graphdef/keras）、`python`、`openvino`、`fil`、`dali`、`tensorrt_llm`、`vllm`
- Dynamic Batching：`max_batch_size > 1` 时默认开启，调 `dynamic_batching { preferred_batch_size max_queue_delay_microseconds preserve_ordering }`
- Concurrent Model Execution：`instance_group { count kind gpus }` 让同一 GPU 跑多实例
- 客户端：Python `pip install tritonclient[all]`，C++ 共享内存（CUDA / system）加速
- 验证健康：`curl localhost:8000/v2/health/live`、`curl localhost:8000/v2/health/ready`、`curl localhost:8000/v2/models/&lt;name&gt;/ready`
- 性能压测：`perf_analyzer -m &lt;model_name&gt; -u localhost:8000`
- 模型分析：`model-analyzer profile --model-repository ./repo -m &lt;name&gt; --triton-launch-mode=docker`

## 安装与首次启动

### 拉镜像 + 跑空仓库

```bash
docker pull nvcr.io/nvidia/tritonserver:26.06-py3

# 起一个临时容器，挂载空目录
mkdir -p model_repo
docker run --rm --gpus=all \
  -p 8000:8000 -p 8001:8001 -p 8002:8002 \
  -v "$PWD/model_repo:/models" \
  nvcr.io/nvidia/tritonserver:26.06-py3 \
  tritonserver --model-repository=/models
```

启动后访问：

- HTTP/REST：`http://localhost:8000/v2/health/live`
- Prometheus：`http://localhost:8002/metrics`

### 最小模型仓库示例（ONNX + Dynamic Batching）

```
model_repo/
└── identity_onnx/
    ├── config.pbtxt
    └── 1/
        └── model.onnx
```

`config.pbtxt`：

```protobuf
name: "identity_onnx"
backend: "onnxruntime"
max_batch_size: 8
input [
  {
    name: "INPUT0"
    data_type: TYPE_FP32
    dims: [ 16 ]
  }
]
output [
  {
    name: "OUTPUT0"
    data_type: TYPE_FP32
    dims: [ 16 ]
  }
]
dynamic_batching {
  preferred_batch_size: [ 4, 8 ]
  max_queue_delay_microseconds: 100000   # 100ms 内凑不齐 8 就跑
  preserve_ordering: false
}
instance_group [
  {
    count: 2                              # 同 GPU 上两个执行实例
    kind: KIND_GPU
  }
]
```

放进仓库目录后，Triton **自动发现并加载**，无需重启（`--model-control-mode=poll` 是默认）。

## Python 客户端调用

```bash
pip install tritonclient[all] numpy
```

### gRPC（推荐生产，低延迟）

```python
import numpy as np
import tritonclient.grpc as grpcclient

client = grpcclient.InferenceServerClient(url="localhost:8001")
assert client.is_server_live()

inp = grpcclient.InferInput("INPUT0", [1, 16], "FP32")
inp.set_data_from_numpy(np.random.rand(1, 16).astype(np.float32))

out = grpcclient.InferRequestedOutput("OUTPUT0")

resp = client.infer("identity_onnx", inputs=[inp], outputs=[out])
print(resp.as_numpy("OUTPUT0").shape)   # (1, 16)
```

### HTTP/REST（调试方便）

```python
import tritonclient.http as httpclient

client = httpclient.InferenceServerClient(url="localhost:8000")
inp = httpclient.InferInput("INPUT0", [1, 16], "FP32")
inp.set_data_from_numpy(np.random.rand(1, 16).astype(np.float32))
out = httpclient.InferRequestedOutput("OUTPUT0")
resp = client.infer("identity_onnx", inputs=[inp], outputs=[out])
print(resp.as_numpy("OUTPUT0").shape)
```

## 性能压测

```bash
# 单模型吞吐 / 延迟
perf_analyzer -m identity_onnx -u localhost:8000 -i grpc

# 变 batch 找拐点
perf_analyzer -m identity_onnx -u localhost:8001 -b 1 -b 4 -b 8 -b 16
```

输出会给出 p50/p95/p99 延迟与吞吐曲线，用于决定 `preferred_batch_size`。

## 部署形态

| 形态 | 说明 |
|---|---|
| **Docker 单机** | `docker run --gpus=all` 开发 / 小规模生产 |
| **Kubernetes + KServe** | KServe 原生支持 Triton 作为 InferenceService 后端 |
| **NVIDIA NIM** | 商业封装的 Triton + 优化镜像（预置热门模型权重） |
| **Bare metal** | 直接跑 `tritonserver` 二进制，但缺容器隔离，不推荐 |

## 下一步

- Dynamic Batching / Concurrent Model Execution / Sequence Batching / Rate Limiter 调优细节见 [指南](./guide-line.md)
- `config.pbtxt` 全字段、各 backend 文件格式、客户端 API、Metrics 速查见 [参考](./reference.md)
