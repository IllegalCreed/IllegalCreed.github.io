---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 NVIDIA Triton Inference Server 26.06（仓库 v2.70.x）官方文档 docs.nvidia.com/deeplearning/triton-inference-server 编写

## 速查

- Dynamic Batching：`max_batch_size > 1` 时自动启用，靠 `preferred_batch_size` + `max_queue_delay_microseconds` 在「凑大 batch 提吞吐」与「等太久牺牲延迟」之间折中
- Concurrent Model Execution：`instance_group.count` 控制同 GPU 上的执行实例数，配合 CUDA streams 交错执行，可显著提升 SM 利用率
- 序列模型：`sequence_batcher` 把同一会话的请求粘连到同一实例，适合对话 / 视频流场景
- 速率限制：`rate_limiter` 跨模型实例公平调度，避免大模型饿死小模型
- 模型预热：`model_warmup` 在 READY 之前灌入合成请求，避免首请求冷路径抖动
- TensorRT 加速链路：PyTorch/TF → ONNX → `trtexec --fp16/--int8` → plan 文件
- 热更新：默认 `--model-control-mode=poll` 每 15s 扫描仓库，新增版本 / 新模型自动加载；`explicit` 模式下用 `load`/`unload` API
- Ensemble：`ensemble_scheduling` 把多模型串成流水线（如「预处理 → 推理 → 后处理」），单次 infer 调用完成全链路
- 共享内存：`cuda_shared_memory` / `system_shared_memory` 把大 tensor 零拷贝传到客户端，端到端延迟显著降低
- 跨框架迁移：`backend` 字段一改即可，仓库目录与客户端协议不变

## Dynamic Batching 调优

### 工作原理

请求到达 Triton 后，由「每个模型自己的调度器」决定何时把若干请求拼成一个 batch 再交给后端推理。核心字段：

```protobuf
dynamic_batching {
  preferred_batch_size: [ 4, 8, 16 ]   # 优先凑这些 batch 大小
  max_queue_delay_microseconds: 100000 # 队列最长等 100ms（100000μs）
  preserve_ordering: false             # true 时严格按到达顺序响应（牺牲吞吐）
  max_queue_delay_microseconds: 0      # 0 = 立即执行（关队列等待）
}
```

- **preferred_batch_size**：调度器优先凑到的尺寸；例如 `[4, 8]` 意味着「队列到 4 个就跑，否则等到 8 再跑」
- **max_queue_delay_microseconds**：兜底，凑不齐 batch 也得发出去；通常设 1–2 倍 SLA（如 50ms SLA → 50000μs）
- **preserve_ordering**：要求响应顺序与请求到达顺序一致，开启后吞吐下降（必须等慢请求完成才能回快请求）

### 选 batch 大小的方法

1. `perf_analyzer -b 1 -b 2 -b 4 ... -b 64` 跑延迟 / 吞吐曲线
2. 找「吞吐开始趋平」的 batch size 作为 `preferred_batch_size`
3. 设 `max_queue_delay_microseconds` 等于 p99 SLA

## Concurrent Model Execution

### instance_group 字段

```protobuf
instance_group [
  { count: 2  kind: KIND_GPU }                    # 默认 GPU 0 上 2 个实例
]
instance_group [
  { count: 1  kind: KIND_GPU  gpus: [ 0 ] }       # GPU 0
  { count: 1  kind: KIND_GPU  gpus: [ 1 ] }       # GPU 1
]
instance_group [
  { count: 4  kind: KIND_CPU }                    # CPU 后端
]
```

- 单实例 = 一条独立执行流；多个实例通过 CUDA streams 在同一 GPU 上交错
- count 越大并行度越高，但实例切换有内存开销，需根据显存 + 模型大小选
- 当 GPU 利用率没满而延迟高时，加 `count` 通常有效

## TensorRT 加速链路

```bash
# 1. PyTorch 导出 ONNX
torch.onnx.export(model, dummy, "model.onnx", opset_version=17,
                  input_names=["INPUT0"], output_names=["OUTPUT0"],
                  dynamic_axes={"INPUT0": {0: "batch"}, "OUTPUT0": {0: "batch"}})

# 2. trtexec 编译 plan
trtexec --onnx=model.onnx --saveEngine=model.plan --fp16 \
        --minShapes=INPUT0:1x16 --optShapes=INPUT0:8x16 --maxShapes=INPUT0:16x16

# 3. config.pbtxt
# backend: "tensorrt"
# 文件放 1/model.plan
```

| 精度 | 速度 | 精度损失 | 适用 |
|---|---|---|---|
| FP32 | 基线 | 无 | 校验 / 高精度场景 |
| FP16 | 2x 左右 | 极小 | 通用首选 |
| INT8 | 3–4x | 中等（需校准） | 已有校准数据集 |

## 热更新与版本管理

```protobuf
model_version_policy {
  specific { versions: [ 2 ] }     # 只加载版本 2
  # 或 latest { num_versions: 2 }  # 最近 2 个版本
  # 或 all { }                     # 全部
}
```

- 仓库目录下每个数字子目录是一个版本，新版本上线只需 `cp -r 2 3 && 替换权重`
- `--model-control-mode=explicit` + REST API：`POST /v2/repository/models/&lt;name&gt;/load`

## 多模型流水线（Ensemble）

```protobuf
name: "pipeline"
platform: "ensemble"
ensemble_scheduling {
  step [
    { model_name: "preprocess"  model_version: -1 input_map { key: "IMG" value: "RAW" } output_map { key: "TENSOR" value: "T" } },
    { model_name: "resnet50"    model_version: -1 input_map { key: "INPUT" value: "T" } output_map { key: "LOGITS" value: "L" } },
    { model_name: "postprocess" model_version: -1 input_map { key: "IN" value: "L" } output_map { key: "LABEL" value: "OUT" } }
  ]
}
```

客户端一次 infer 调用 `pipeline`，Triton 内部串起 3 个模型，中间 tensor 不出进程，端到端延迟比手工串联低 30%+。

## 共享内存（CUDA / System）

```bash
# 启动时声明共享内存池（容器内）
tritonserver --model-repository=/models \
  --cuda-memory-pool-byte-size=0:1073741824 \      # GPU 0 上 1GB 池
  --pinned-memory-pool-byte-size=1073741824        # 1GB pinned host 内存
```

```python
# 客户端注册共享内存区，避免大 tensor 走网络
import tritonclient.grpc as grpcclient
shm = grpcclient.cuda_shared_memory.Client(
    name="cuda_shm", raw_fd=...,  # 见官方 example
)
client.register_cuda_shared_memory(shm)
inp.set_shared_memory("cuda_shm", offset=0, byte_size=...)
```

## Model Analyzer 自动调优

```bash
model-analyzer profile \
  --model-repository ./repo \
  -m resnet50_onnx \
  --triton-launch-mode=docker \
  --output-model-repository ./result \
  --profile-models-configs-only \
  --metrics-interval 2000 \
  --concurrency 1,4,8,16
```

自动遍历 batch size / instance count 组合，输出对比表与 GPU 显存占用，省去手工 `perf_analyzer` 扫描。

## KServe 部署示例

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: triton-resnet
spec:
  predictor:
    triton:
      storageUri: gs://my-bucket/models
      runtimeVersion: 26.06-py3
      resources:
        limits:
          nvidia.com/gpu: 1
```

KServe 把 Triton 当作标准预测器，自动注入负载均衡、自动扩缩容与 Canary 发布能力。
