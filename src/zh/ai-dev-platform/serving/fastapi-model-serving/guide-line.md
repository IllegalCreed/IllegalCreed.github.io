---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 FastAPI 官方文档编写（fastapi.tiangolo.com，2025.07）—— lifespan 深入 / async 与线程池 / 攒批调度 / 流式错误处理 / 性能调优 / serverless GPU / 与 Triton/vLLM/BentoML 对比

## lifespan 深入

### 为什么必须 lifespan

模型加载是模型服务化与通用 web 服务的根本区别。一次 PyTorch 7B 模型加载到 GPU：

```
1. 读权重文件（~14GB，磁盘 I/O，10-60s）
2. 反序列化 + 转 tensor（CPU 计算，5-20s）
3. `.to("cuda")` 拷贝到显存（PCIe 传输，5-15s）
4. CUDA context 初始化 + 编译 kernel（首次，10-30s）
```

总计 30s 到 2min。若每请求加载，QPS 会塌到 < 1。lifespan 让这个开销**只在启动时发生一次**。

### lifespan 里能做什么

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── 启动 ──
    # 1. 加载模型
    app.state.model = load_model()
    # 2. 预热（避免首请求慢）
    warmup(app.state.model)
    # 3. 连接池、缓存、配置
    app.state.redis = await create_redis_pool()
    app.state.ready = True

    yield  # ← 应用运行期间

    # ── 关闭 ──
    app.state.ready = False
    await app.state.redis.close()
    del app.state.model  # 释放显存
    torch.cuda.empty_cache()
```

### 多模型管理

一个服务跑多个模型（如 embedding + reranker + LLM）：

```python
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    models["embed"] = SentenceTransformer("bge-small-zh")
    models["rerank"] = CrossEncoder("bge-reranker-base")
    models["llm"] = LLM(model="Qwen/Qwen2.5-1.5B")
    yield
    models.clear()
```

不同端点用不同模型，共享 lifespan 加载。

### 预热（warmup）

首次 forward 通常比后续慢（kernel 编译、缓存未命中）。lifespan 里跑一次 dummy forward：

```python
async def lifespan(app: FastAPI):
    model = load_model()
    # 预热：跑一次 dummy 输入
    with torch.no_grad():
        _ = model(torch.zeros(1, 3, 224, 224).to("cuda"))
    app.state.model = model
    yield
```

避免首请求的用户等到「额外编译延迟」。

## async 与线程池深入

### 三种执行上下文

| 函数声明 | 执行位置 | 阻塞事件循环？ | 适用 |
|---|---|---|---|
| `async def` | 事件循环主线程 | **是**（若无 await 释放）| I/O 密集（DB/HTTP/Redis）|
| 普通 `def` | 外部 threadpool | 否 | CPU/GPU 密集推理 |
| `async def` + `run_in_threadpool` | threadpool（在 async 内调用）| 否 | 混合场景 |

### threadpool 大小

FastAPI 的外部 threadpool 由 Starlette/anyio 管理，默认 **40 个线程**。CPU 密集端点全用 `def` 时，最多 40 个并发推理。可用 `anyio.to_thread.run_sync` 或调整 anyio 配置。

```python
# 监控线程池使用（Grafana）
# anyio 没有原生 metric，需自己埋点
```

### 何时该用 run_in_threadpool 而非 def

```python
# 场景：端点先 async 查 DB，再 CPU 推理
@app.post("/predict")
async def predict(req: Request):
    user = await db.fetch_user(req.user_id)     # async I/O
    # ❌ 若这里直接 model()，阻塞事件循环
    # ✅ 用 run_in_threadpool
    result = await run_in_threadpool(model, req.features)
    await db.log_prediction(req.user_id, result)  # async I/O
    return result
```

### 异步推理库

部分推理库原生 async（内部用 threadpool 或独立运行时）：

- **ONNX Runtime Async**：`session.run_async`
- **vLLM**：`engine.generate` 是 async
- **Triton Python client**：`asyncio_client`

这些可直接在 `async def` 里 await，无需手动 threadpool。

## 服务端攒批（dynamic batching）

客户端攒批（上一章）要求客户端把多请求合成一个 batch。**服务端攒批**让客户端照常发单请求，服务在短窗口内（如 50ms）攒到 N 个请求合成 batch——这是 Triton/Dynamo 的核心特性，FastAPI 自己写：

```python
import asyncio
from collections import deque

class Batcher:
    def __init__(self, model, max_batch=32, timeout=0.05):
        self.model = model
        self.max_batch = max_batch
        self.timeout = timeout
        self.queue = deque()
        self.lock = asyncio.Lock()

    async def submit(self, features):
        fut = asyncio.get_event_loop().create_future()
        async with self.lock:
            self.queue.append((features, fut))
            if len(self.queue) >= self.max_batch:
                self._flush()
        return await fut

    def _flush(self):
        # 取出当前 batch，丢线程池跑 model，回填 future
        batch = [self.queue.popleft() for _ in range(min(len(self.queue), self.max_batch))]
        # ... 跑 model，set_result 给各 future
```

::: warning 自写攒批复杂
正确处理超时、错误传播、背压很 tricky。生产建议直接用 **NVIDIA Triton**（dynamic batching 内建）或 **BentoML**，或后端用 **vLLM**（自带 continuous batching），FastAPI 仅作业务前置。
:::

## 流式输出的错误处理

`StreamingResponse` 一旦开始流式输出（已发 200 + 部分 body），**中途异常无法用 HTTP 状态码回传**——状态码已发。需自定义错误协议：

```python
async def token_stream(prompt):
    try:
        async for token in llm.stream(prompt):
            yield f"data: {json.dumps({'token': token})}\n\n"
    except Exception as e:
        # 用 SSE event 类型传错误
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
    yield "data: [DONE]\n\n"
```

客户端解析 SSE 时监听 `event: error` 分支。

### 客户端断开检测

```python
async def token_stream(prompt):
    try:
        async for token in llm.stream(prompt):
            yield f"data: {token}\n\n"
            await anyio.sleep(0)  # 让事件循环处理取消
    except anyio.get_cancelled_exc_class():
        # 客户端断开，停止生成、释放资源
        llm.cancel(prompt)
        raise
```

## 性能调优

### 推理侧

1. **释放 GIL 的库优先**：onnxruntime / torch（C++ 后端）/ vLLM 都释放 GIL，单 worker 多线程能并发
2. **半精度**：模型 `.half()`（FP16）或 bfloat16，显存减半、速度提升（精度可接受时）
3. **torch.compile**（PyTorch 2+）：编译图减少 Python 开销，首请求慢但后续快
4. **CUDA Graph**：固定输入形状时捕获 CUDA graph，减少 kernel launch 开销
5. **batch > 1**：单样本 forward 有固定开销，batch 摊薄

### 服务侧

1. **worker 数匹配硬件**：CPU 模型 = 核数；GPU 模型 ≤ GPU 数（显存约束）
2. **uvicorn --loop uvloop**：uvloop 比 asyncio 默认 loop 快 2-4x（仅 Linux/macOS）
3. **uvicorn --http httptools**：httptools 比 h11 快
4. **ORJSONResponse**：用 `pip install orjson`，响应序列化快 2-5x
5. **连接池**：DB/Redis/后端推理引擎都复用连接池，避免每请求建连

```python
from fastapi.responses import ORJSONResponse
app = FastAPI(default_response_class=ORJSONResponse)
```

```bash
uvicorn main:app --loop uvloop --http httptools --no-access-log
```

### 资源隔离

- GPU 模型：用 `CUDA_VISIBLE_DEVICES` 给不同 worker 分配不同 GPU
- 显存限额：`torch.cuda.set_per_process_memory_fraction(0.4)` 限单 worker 显存
- CPU 模型：`taskset` / cgroup 绑核

## serverless GPU 部署

模型服务的冷启动慢（加载几十秒），serverless GPU（如 Modal / Replicate / BentoCloud / AWS Lambda GPU）要特殊处理：

1. **预热实例（warm instance）**：保持至少一个实例常驻，避免冷启动
2. **模型放分布式存储/镜像层**：EFS / 镜像层缓存，避免每次从 HF 下载
3. **snapshot restore**：把加载好的进程内存快照恢复（CRIU）
4. **readiness gate**：函数就绪探针通过后才接流量

FastAPI 本身不改，部署平台提供这些机制。

## 与其他推理服务方案对比

| 方案 | 定位 | 适合 |
|---|---|---|
| **FastAPI 自写** | 业务层 + 简单推理 | 中小规模、需深度定制业务逻辑、CPU 模型 |
| **vLLM serve** | 高吞吐 LLM 推理 | 纯 LLM serving，OpenAI 兼容，数据中心 |
| **Triton Inference Server** | 通用 ML serving | 多框架（TF/PyTorch/ONNX/TensorRT）、dynamic batching、多模型 |
| **BentoML** | Python ML 服务化框架 | 类似 FastAPI 但 ML 原生（自带 batching/部署）|
| **Ray Serve** | 分布式 ML serving | 多副本、自动扩缩、与 Ray 训练统一 |
| **Seldon Core / KServe** | K8s ML serving | 云原生、金丝雀、A/B 测试 |

**经验法则**：
- 纯 LLM → vLLM（FastAPI 可作业务前置）
- 多框架多模型、要 dynamic batching → Triton
- Python ML、要快上手、深度业务定制 → FastAPI 或 BentoML
- 大规模分布式 → Ray Serve / KServe

## 何时 FastAPI 不够

FastAPI 自写适合**中小规模**。当出现以下情况，考虑切到专用推理服务：

1. **QPS 高到单机扛不住** → 上 Triton/Ray Serve 多副本
2. **需要 dynamic batching** → Triton/Dynamo 内建，FastAPI 自写易错
3. **纯 LLM 高并发** → vLLM/TGI，PagedAttention 优势碾压
4. **多模型多版本路由** → Triton model repository / KServe
5. **GPU 利用率优化** → TensorRT-LLM/Triton，比裸 PyTorch 快数倍

FastAPI 在这些场景仍可作**业务前置**（鉴权、限流、日志、A/B 路由），后端转发到 vLLM/Triton。
