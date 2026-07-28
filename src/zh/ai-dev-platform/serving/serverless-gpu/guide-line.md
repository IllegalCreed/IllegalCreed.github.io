---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Modal（modal.com，2026）与 Replicate（replicate.com，cog 0.21+）官方文档编写

## 速查

- Modal 扩缩容：`min_containers`（保活）+ `max_containers`（上限）+ `scaledown_window`（闲时回收秒数）+ `target_concurrency_input`（每容器目标并发）
- Modal 冷启动优化：Memory Snapshot（捕获进程状态）、容器复用、预热镜像层
- Modal 队列：`@app.function` 默认并发隔离；可用 `modal.Queue` 与 `@modal.concurrent` 处理 batch
- Modal 异步：`@app.function` + `async def`；调用方 `.remote.aio()`
- Modal 持久化：`modal.Dict` / `modal.NetworkFileSystem` / `modal.Volume` 跨容器共享状态
- Replicate 异步推理：Prediction API 是异步的，提交后轮询直到 succeeded / failed
- Replicate 模型管理：版本不可变（每次 push 生成新版本），支持 official / community / private 模型库
- Replicate webhook：`POST /v1/predictions` 带 `webhook` 字段，完成后回调
- vs 传统 GPU 租赁：按调用计费 vs 包月；自动扩缩容 vs 手动
- vs SageMaker Endpoint：Serverless 无需预置实例，零冷流量零成本；SageMaker 适合稳态高 QPS

## Modal 自动扩缩容

### 关键参数

```python
@app.function(
    gpu="A100",
    image=image,
    min_containers=2,             # 至少保 2 个容器常驻，避免冷启动
    max_containers=20,            # 上限 20 容器
    scaledown_window=300,         # 容器空闲 5 分钟后回收
    target_concurrency_input=8,   # 每容器目标并发 8，超过就扩容
    container_idle_timeout=60,    # 单请求 idle 60s 后视为可回收
)
def infer(...):
    ...
```

| 参数 | 含义 | 调参经验 |
|---|---|---|
| `min_containers` | 保活容器数 | 设 1–2 抵消冷启动；设 0 则完全按需（最省） |
| `max_containers` | 并发容器上限 | 防止失控成本；按预算定 |
| `scaledown_window` | 空闲回收秒数 | 短则省钱但易再冷启动；长则体验好但成本高 |
| `target_concurrency_input` | 每容器并发目标 | 高则单容器吞吐高、延迟敏感低；低则扩容更快 |

### 扩缩容流程

1. 请求到达 → 路由到现有容器（若 < target_concurrency）
2. 现有容器满 → 启动新容器（冷启动可能亚秒，大模型则数秒）
3. 流量回落 → 容器空闲 scaledown_window 后回收
4. min_containers 保活的容器始终在线，下一波流量零冷启动

## Modal 冷启动优化

### Memory Snapshot

```python
@app.function(
    gpu="A100",
    enable_memory_snapshot=True,    # 捕获进程内存快照
)
def infer(...):
    # 模型已在内存中（快照恢复）
    ...
```

Memory Snapshot 把已加载模型权重的进程状态捕获为快照，新容器启动时从快照恢复，跳过模型加载这一最耗时的步骤，实现亚秒级冷启动。适合大模型（70B LLM）场景。

### 容器复用 + 镜像预热

- `min_containers > 0` 保活容器，下一波请求零冷启动
- `modal.Image` 层缓存：相同 image 在多个 function 间复用，避免重复拉取
- `modal.Volume` 持久化模型权重，避免每次从 HuggingFace 下载

### 完整冷启动优化示例

```python
import modal

volume = modal.Volume.from_name("model-cache", create_if_missing=True)

image = (
    modal.Image.debian_slim()
    .pip_install("torch", "transformers")
    .env({"HF_HOME": "/data/hf"})
)

@app.function(
    gpu="A100-80GB",
    image=image,
    volumes={"/data": volume},
    min_containers=1,
    enable_memory_snapshot=True,
    scaledown_window=600,
)
@modal.concurrent()   # 单容器内并发执行
def generate(prompt: str) -> str:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tok = AutoTokenizer.from_pretrained("meta-llama/Llama-2-70b")
    model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-70b", device_map="auto")
    ...
```

## Modal 异步与队列

### 异步 function

```python
@app.function(gpu="A10")
async def async_infer(text: str) -> str:
    await some_async_op()
    return ...

# 调用方
result = await async_infer.remote.aio("hello")
```

### 批量队列

```python
@app.function(gpu="A100")
@modal.concurrent(max_inputs=4)   # 单容器最多 4 个并发
def process(item: dict) -> dict:
    ...

# 用 modal.Queue 解耦
queue = modal.Queue.from_name("batch-queue", create_if_missing=True)

@app.function()
def producer():
    for item in items:
        queue.put(item)

@app.function()
def consumer():
    while True:
        batch = queue.get_many(8)   # 一次取 8 个
        process.remote(batch)
```

## Replicate 异步推理 + Webhook

### 提交 + 轮询

```python
import replicate, time

prediction = replicate.predictions.create(
    version="abc123",
    input={"text": "Hello"},
)
while prediction.status not in ("succeeded", "failed", "canceled"):
    time.sleep(1)
    prediction.reload()
print(prediction.output)
```

### Webhook 回调

```python
prediction = replicate.predictions.create(
    version="abc123",
    input={"text": "Hello"},
    webhook="https://your.app/replicate-webhook",
    webhook_events_filter=["completed"],
)
# 完成后 Replicate POST 你的 webhook，body 含 prediction 结果
```

## vs 传统 GPU 租赁

| 维度 | Serverless（Modal/Replicate） | 传统 GPU 租赁（AWS p4d / 自建集群） |
|---|---|---|
| 计费 | 按秒（按调用） | 包月 / 按小时（开机即付费） |
| 闲时成本 | 零 | 高（实例一直跑） |
| 高 QPS 稳态成本 | 累加可能更高 | 固定，规模化更划算 |
| 运维 | 零（平台托管） | 高（Docker / K8s / 监控） |
| 冷启动 | 亚秒到数秒 | 无（实例常驻） |
| GPU 选型 | 平台档位 | 自由 |
| 数据合规 | 出域 | 完全自有 |
| 适合 | 低 QPS / 突发 / MVP | 稳态高 QPS / 数据敏感 |

经验法则：**QPS < 10 或流量波动大 → Serverless；QPS > 100 且稳定 → 自建或 SageMaker。**

## vs SageMaker Endpoint

| 维度 | Serverless（Modal/Replicate） | SageMaker Endpoint |
|---|---|---|
| 部署单位 | function / cog 模型 | 预置实例（ml.g4dn / ml.p4d） |
| 实例管理 | 无 | 需选 instance_type / instance_count |
| 闲时计费 | 零 | 实例常驻计费 |
| 自动扩缩容 | 平台默认 | 需配置 SageMaker AutoScaling 策略 |
| 冷启动 | 亚秒（Memory Snapshot） | 实例启动数十秒到数分钟 |
| 模型框架 | 任意（cog / Modal image） | 内置容器或 BYOC |
| 监控 | 平台面板 | CloudWatch |
| 适合 | MVP / 实验 / 突发 | 生产稳态 / AWS 生态深度集成 |

## 典型场景选型

| 场景 | 推荐 |
|---|---|
| 周末 hack 项目，快速上线 LLM 推理 | Modal（开发体验 + 按秒计费） |
| 公司要把开源模型做成 API 产品 | Replicate（标准 cog + Prediction API） |
| 数据敏感（医疗 / 金融），不能出域 | 自建 Triton / SageMaker（VPC 内） |
| 稳态 QPS 1000+，需极致优化 | 自建 GPU 集群 + Triton + TensorRT |
| 偶发批量推理（夜间跑批） | Modal（按调用计费，零闲时成本） |
| 大模型微调后快速验证 | Modal（modal.Volume 缓存权重） |
