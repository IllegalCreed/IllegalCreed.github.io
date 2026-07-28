---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 FastAPI 官方文档编写 —— lifespan / async / StreamingResponse / run_in_threadpool / 部署 / 性能

## lifespan API

### 签名

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 启动逻辑（yield 前）
    ...
    yield
    # 关闭逻辑（yield 后）
    ...

app = FastAPI(lifespan=lifespan)
```

### 关键约束

| 约束 | 说明 |
|---|---|
| 一个 app 只能有一个 lifespan | 后注册的覆盖前者 |
| lifespan 与 on_event 互斥 | 设了 lifespan，on_event 不触发 |
| `yield` 前 = 启动 | 应用开始接请求前执行 |
| `yield` 后 = 关闭 | 应用停止时执行 |
| 异常处理 | startup 抛异常 → 应用不启动；shutdown 抛异常 → 仅日志 |

### app.state 存模型

```python
app = FastAPI(lifespan=lifespan)

async def lifespan(app: FastAPI):
    app.state.model = load_model()  # 存到 app.state
    yield

@app.post("/predict")
def predict(req: Request, inp: Input):
    model = req.app.state.model  # 取出
    return model(inp.features)
```

## async 与 def 对照

| 函数形式 | 执行位置 | 释放事件循环？ | 适用 |
|---|---|---|---|
| `async def` | 事件循环主线程 | 仅在 await 时 | I/O（DB/HTTP/Redis）|
| `def` | 外部 threadpool（默认 40 线程）| 是 | CPU/GPU 密集 |
| `async def` + `run_in_threadpool` | threadpool | 是 | 混合 |

### run_in_threadpool

```python
from fastapi.concurrency import run_in_threadpool

result = await run_in_threadpool(blocking_function, arg1, arg2, kw1=v1)
```

- 来自 `fastapi.concurrency`（封装 `anyio.to_thread.run_sync`）
- 默认 threadpool 40 线程（anyio 配置）
- 适合：在 async 路径里调同步阻塞函数（如 onnxruntime / sklearn / file I/O）

## StreamingResponse

```python
from fastapi.responses import StreamingResponse

async def event_generator():
    while True:
        data = await get_next()
        yield f"data: {data}\n\n"
        await anyio.sleep(0)  # 让事件循环处理取消

@app.get("/stream")
async def stream():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Nginx 不缓冲
        },
    )
```

### 关键点

| 要点 | 说明 |
|---|---|
| `media_type="text/event-stream"` | SSE 标准，浏览器/客户端识别 |
| `await anyio.sleep(0)` | 让事件循环处理客户端取消；不加则生成器无法被取消 |
| yield 格式 `data: &lt;content&gt;\n\n` | SSE 标准，与 OpenAI/vLLM 一致 |
| `X-Accel-Buffering: no` | 防 Nginx 缓冲（否则流变一次性） |
| 错误用 `event: error` | 已发 200 后无法改状态码，用 SSE event 类型 |

## 部署命令

### 开发

```bash
uvicorn main:app --reload --port 8000
```

### 生产（gunicorn + uvicorn workers）

```bash
pip install gunicorn uvicorn[standard]

gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --graceful-timeout 30 \
  --keep-alive 5
```

### 直接 uvicorn 多 worker

```bash
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

### Dockerfile 模板

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:8000/ready || exit 1

CMD ["gunicorn", "main:app", \
     "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", "--timeout", "120"]
```

## gunicorn 关键参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `-w, --workers` | 1 | worker 进程数 |
| `-k, --worker-class` | sync | `uvicorn.workers.UvicornWorker`（异步）|
| `--threads` | 1 | 每 worker 线程数（sync worker 用）|
| `--bind` | 127.0.0.1:8000 | 监听 |
| `--timeout` | 30 | worker 处理单请求超时（秒）|
| `--graceful-timeout` | 30 | 优雅关闭超时 |
| `--keep-alive` | 2 | HTTP keep-alive 秒数 |
| `--max-requests` | 0 | worker 处理 N 请求后重启（防内存泄漏）|
| `--max-requests-jitter` | 0 | 重启抖动（避免同时重启）|
| `--preload` | False | worker fork 前加载应用（省内存，但模型加载只一次）|

::: tip --preload 与模型加载
`--preload` 让 gunicorn 在 fork worker 前先加载应用（含模型），子进程 copy-on-write 共享内存——CPU 模型可省内存。但 GPU 显存不共享（每进程独立 CUDA context），GPU 模型慎用。
:::

## uvicorn 关键参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `--host` | 127.0.0.1 | 监听 IP |
| `--port` | 8000 | 端口 |
| `--workers` | 1 | worker 数 |
| `--loop` | asyncio | `asyncio` / `uvloop`（uvloop 快 2-4x）|
| `--http` | auto | `auto` / `h11` / `httptools`（httptools 快）|
| `--reload` | False | 代码改动重启（仅开发）|
| `--log-level` | info | 日志级 |
| `--access-log` | True | 访问日志 |
| `--timeout-keep-alive` | 5 | keep-alive 秒 |
| `--limit-concurrency` | None | 最大并发连接 |
| `--limit-max-requests` | None | 处理 N 请求后退出 |
| `--no-access-log` | - | 关访问日志（生产常用）|

## 响应类对照

| 类 | 用途 |
|---|---|
| `JSONResponse`（默认）| 标准 JSON |
| `ORJSONResponse` | orjson，快 2-5x |
| `UJSONResponse` | ujson，略快 |
| `HTMLResponse` | HTML |
| `PlainTextResponse` | 纯文本 |
| `StreamingResponse` | 流式（SSE/分块）|
| `FileResponse` | 文件（含 range 支持）|
| `RedirectResponse` | 重定向 |
| `Response` | 裸响应（自定义）|

```python
from fastapi.responses import ORJSONResponse
app = FastAPI(default_response_class=ORJSONResponse)
```

## 性能调优 Checklist

### 推理侧

- [ ] 模型半精度（FP16/BF16）
- [ ] torch.compile（PyTorch 2+）
- [ ] CUDA Graph（固定形状）
- [ ] batch > 1（攒批）
- [ ] 释放 GIL 的库（onnxruntime/torch）

### 服务侧

- [ ] worker 数匹配硬件（CPU=核数；GPU≤GPU 数）
- [ ] `--loop uvloop --http httptools`
- [ ] `ORJSONResponse`
- [ ] 连接池复用
- [ ] `--no-access-log`（生产）
- [ ] `--max-requests` 防内存泄漏

### 资源隔离

- [ ] `CUDA_VISIBLE_DEVICES` 分配 GPU
- [ ] `torch.cuda.set_per_process_memory_fraction` 限显存
- [ ] `taskset` / cgroup 绑核

## 健康检查端点模板

```python
app = FastAPI(lifespan=lifespan)
app.state.ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model()
    warmup(app.state.model)
    app.state.ready = True
    yield
    app.state.ready = False

@app.get("/health")          # liveness
async def health():
    return {"status": "alive"}

@app.get("/ready")           # readiness
async def ready():
    if not app.state.ready:
        raise HTTPException(503, "model not loaded")
    return {"status": "ready"}

@app.get("/startup")         # startup probe（K8s）
async def startup():
    return {"status": "ok"}
```

## 与推理库 import 对照

| 库 | 加载 | 端点建议 |
|---|---|---|
| PyTorch JIT | `torch.jit.load("m.pt").to("cuda").eval()` | `def` |
| PyTorch eager | `torch.load` + `model.to` | `def` |
| ONNX Runtime | `ort.InferenceSession("m.onnx", providers=["CUDAExecutionProvider"])` | `def` |
| HuggingFace | `AutoModel.from_pretrained(...)` | `def` |
| vLLM（嵌入式）| `from vllm import LLM; LLM(model=...)` | `def` 或反代 |
| scikit-learn | `joblib.load("m.joblib")` | `def`（多 worker）|
| Sentence-Transformers | `SentenceTransformer("...")` | `def` |

## 参考

- 官方文档：<https://fastapi.tiangolo.com/>
- lifespan：<https://fastapi.tiangolo.com/advanced/events/>
- async：<https://fastapi.tiangolo.com/async/>
- StreamingResponse：<https://fastapi.tiangolo.com/advanced/custom-response/>
- 部署：<https://fastapi.tiangolo.com/deployment/server-workers/>
- GitHub：<https://github.com/fastapi/fastapi>
