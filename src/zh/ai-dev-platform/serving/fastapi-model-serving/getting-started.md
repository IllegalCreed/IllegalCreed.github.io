---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 FastAPI 官方文档编写（fastapi.tiangolo.com，2025.07 版本）

## 速查

- 安装：`pip install fastapi "uvicorn[standard]"`
- 启动开发服务器：`uvicorn main:app --reload`（默认 `http://localhost:8000`）
- 生产部署：`gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
- 模型加载：`lifespan` async context manager（启动加载、关闭释放），**取代已废弃的 `@app.on_event`**
- async 陷阱：CPU/GPU 密集推理用普通 `def`（FastAPI 自动丢线程池），或 `async def` + `run_in_threadpool`
- 流式输出：`StreamingResponse(generator, media_type="text/event-stream")`
- 批量端点：`def predict(items: list[Item])`，一次 forward
- 自动文档：`/docs`（Swagger UI）/ `/redoc`（ReDoc）
- 输入输出：Pydantic BaseModel（v2 用 `BaseModel` + 类型注解）
- 健康检查：`/health`（liveness）+ `/ready`（模型已加载的 readiness）
- 与推理库配合：直接 `import torch` / `onnxruntime` / `transformers` / `vllm`
- 常见错误：在 `async def` 里直接调 `model.predict()` 阻塞事件循环 → 全服务卡死

## 模型服务化的核心问题

把模型从 notebook 推到生产 API，要解决 4 个工程问题（通用 FastAPI 归后端章节，这里只讲模型特有）：

| 问题 | 通用 web | 模型服务化 |
|---|---|---|
| 资源初始化 | 无/连接池 | **模型加载到显存/内存（耗时 + 占资源）** |
| 单请求耗时 | ms 级（I/O 为主） | **百 ms 到秒级（CPU/GPU 计算为主）** |
| 并发模型 | async I/O 多路复用 | **CPU/GPU 密集，GIL 与显存约束** |
| 响应形式 | 一次性 JSON | **可能要流式（LLM token 流）** |

## lifespan 加载模型（核心模式）

**模型必须在应用启动时加载一次，常驻供所有请求复用**——不能每请求 load（每次几秒到几十秒，无法接受）。

### 正确写法：lifespan

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

# 全局模型容器（也可用 app.state）
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── 启动：加载模型到显存/内存 ──
    import torch
    ml_models["resnet"] = torch.jit.load("resnet.pt").to("cuda").eval()
    ml_models["tokenizer"] = load_tokenizer()
    print("模型加载完成")
    yield
    # ── 关闭：释放资源 ──
    ml_models.clear()

app = FastAPI(lifespan=lifespan)
```

**关键点**：

- `yield` 之前 = 启动逻辑；之后 = 关闭逻辑
- 模型加载是**同步阻塞**操作，但在 `async def lifespan` 里它发生在事件循环启动早期，阻塞是可接受的（应用还没开始接请求）
- 一个 app 只能有一个 lifespan（旧的 `@app.on_event("startup")` / `"shutdown"` 已废弃）

### 已废弃的旧写法

```python
# ❌ 已废弃（FastAPI 0.93+，但仍能跑）
@app.on_event("startup")
async def load_model():
    ...

@app.on_event("shutdown")
async def cleanup():
    ...
```

::: warning 不要用 on_event
官方明确推荐 lifespan。如果同时定义了 lifespan，`on_event` 不会被调用——「要么全 lifespan，要么全 events，不能混用」。
:::

## 第一个模型端点：CPU 密集推理

最常见也最容易踩坑。**核心原则：CPU/GPU 密集推理绝不能用 `async def`**。

### 正确写法 1：普通 `def`（推荐）

```python
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np

app = FastAPI()
model = ...  # 假设已加载

class Input(BaseModel):
    features: list[float]

class Output(BaseModel):
    label: str
    score: float

# ✅ 普通 def：FastAPI 自动丢进外部线程池执行，不阻塞事件循环
@app.post("/predict", response_model=Output)
def predict(inp: Input):
    x = np.array(inp.features)
    # 这里的 model() 是 CPU 密集（甚至阻塞几秒）
    result = model(x)
    return Output(label=result.label, score=result.score)
```

FastAPI 见到路径函数是 `def`（而非 `async def`），会**自动把它丢进外部 threadpool** 执行并 await，事件循环不被阻塞，其他请求（async 的）继续跑。

### 正确写法 2：`async def` + `run_in_threadpool`

如果端点里既有 async I/O（如查数据库）又有 CPU 密集推理：

```python
from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool

app = FastAPI()

@app.post("/predict")
async def predict(inp: Input):
    # async I/O 部分
    user = await fetch_user(inp.user_id)

    # CPU 密集部分：显式丢线程池
    result = await run_in_threadpool(model, inp.features)
    return {"label": result.label}
```

`run_in_threadpool` 来自 `fastapi.concurrency`（封装 anyio），把同步阻塞函数丢到线程池，返回可 await 的结果。

### ❌ 错误写法：async def 里直接推理

```python
# ❌ 会阻塞事件循环，全服务卡死
@app.post("/predict")
async def predict(inp: Input):
    result = model(inp.features)   # CPU 密集，阻塞整个事件循环
    return result
```

这是新手最常犯的错——`async def` 里直接调阻塞推理，事件循环被这一个调用占住，所有其他请求（含健康检查）都卡住，服务相当于单线程串行。

::: tip 一句话判断
- 函数里**有 `await`（I/O 操作）** → `async def`
- 函数是 **CPU/GPU 密集（无 await）** → 普通 `def`，让 FastAPI 自动丢线程池
- 两者都有 → `async def` + `run_in_threadpool` 包住 CPU 部分
:::

## SSE 流式输出（LLM token 流）

LLM 服务要逐 token 流式返回。FastAPI 用 `StreamingResponse` + async generator：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anyio

app = FastAPI()

async def token_stream(prompt: str):
    # 假设 generate_tokens 是 CPU 密集（用 run_in_threadpool 包）
    async for token in my_llm.stream(prompt):
        # SSE 格式：data: <json>\n\n
        yield f"data: {token}\n\n"
        # ⚠️ 关键：让事件循环有机会处理取消
        await anyio.sleep(0)
    yield "data: [DONE]\n\n"

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    return StreamingResponse(
        token_stream(req.prompt),
        media_type="text/event-stream",
    )
```

**关键点**：

- `media_type="text/event-stream"` 让浏览器/客户端识别为 SSE
- 每个 yield 是 `data: <内容>\n\n`（SSE 标准格式，OpenAI/vLLM/Ollama 同款）
- `await anyio.sleep(0)` 不可省——async 任务只有遇到 `await` 才能被取消，否则客户端断开后生成器仍可能继续跑

### 直接代理 vLLM/Ollama 流

如果后端是 vLLM（端口 8000），FastAPI 可作为业务层代理其 SSE 流：

```python
import httpx

@app.post("/chat/stream")
async def proxy_stream(req: ChatRequest):
    async def gen():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "http://localhost:8000/v1/chat/completions",
                json={**req.dict(), "stream": True},
            ) as r:
                async for line in r.aiter_lines():
                    if line:
                        yield f"{line}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
```

## 批量推理端点

单样本 forward 有固定开销（kernel launch、内存搬运）。把多个请求合成一个 batch 一次 forward，能摊薄开销，吞吐提升数倍。

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    id: str
    features: list[float]

class Result(BaseModel):
    id: str
    label: str

@app.post("/predict/batch", response_model=list[Result])
def predict_batch(items: list[Item]):
    # 一次 forward 处理整批
    batch = np.stack([np.array(i.features) for i in items])
    outputs = model(batch)   # batch_size = len(items)
    return [
        Result(id=item.id, label=o.label)
        for item, o in zip(items, outputs)
    ]
```

**注意**：

- 批量端点上限要限制（如 `len(items) <= 64`），防止单请求 OOM
- 这是「客户端攒批」，不是服务端 dynamic batching（后者需 Triton/Dynamo 或自己写攒批调度器）

## 与 PyTorch / ONNX / vLLM 配合

| 后端 | 加载方式 | 端点特征 |
|---|---|---|
| **PyTorch JIT** | `torch.jit.load("model.pt").to("cuda").eval()` | 普通 def，释放 GIL（C++ 后端）|
| **PyTorch eager** | `torch.load` + model.to | 普通 def；推理时 PyTorch 释放 GIL |
| **ONNX Runtime** | `ort.InferenceSession("model.onnx", providers=["CUDA"])` | 普通 def；onnxruntime 释放 GIL |
| **HuggingFace** | `AutoModelForSequenceClassification.from_pretrained` | 普通 def；transformers 释放 GIL |
| **vLLM**（后端引擎）| `from vllm import LLM` | LLM 自带 batching；FastAPI 反代或包业务 |
| **scikit-learn** | `joblib.load("model.joblib")` | 普通 def；纯 Python 受 GIL，靠多 worker |

## 部署：gunicorn + uvicorn workers

生产部署用 gunicorn 管理 uvicorn worker 进程：

```bash
# 安装
pip install gunicorn "uvicorn[standard]"

# 启动 4 个 worker（每 worker 一份模型）
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

**worker 数怎么定**：

- **CPU 模型**：worker 数 ≈ CPU 核数（每 worker 独占核）
- **GPU 模型**：worker 数受显存约束——每 worker 一份模型，4 worker 跑 7B（14GB）要 56GB 显存。通常 GPU 模型 worker 数 ≤ GPU 数
- **混合**：多 GPU + 每 GPU 多 worker（小模型）

::: warning GPU 模型慎用多 worker
每个 gunicorn worker 是独立进程，各自加载一份模型到显存。GPU 显存翻倍易 OOM。GPU 大模型生产建议：worker 数 = GPU 数，或改用 vLLM/Triton 这种支持单进程多 GPU 的引擎，FastAPI 仅作业务前置。
:::

## 健康检查：liveness vs readiness

模型服务要区分两种探针：

```python
app = FastAPI(lifespan=lifespan)
ready = False  # lifespan 里加载完后置 True

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ready
    load_model()
    ready = True
    yield
    ready = False

@app.get("/health")
async def health():
    # liveness：进程活着就 200
    return {"status": "alive"}

@app.get("/ready")
async def ready_check():
    # readiness：模型加载完才能接流量
    if not ready:
        from fastapi import HTTPException
        raise HTTPException(503, "model not loaded")
    return {"status": "ready"}
```

K8s 配 `livenessProbe → /health`，`readinessProbe → /ready`。滚动更新时新 pod 只有 `/ready` 返回 200 才接流量，避免模型加载期间的请求失败。

## 下一步

入门到此——你已经能加载模型、写非阻塞推理端点、流式输出、批量推理、多 worker 部署。下一章 `guide-line.md` 深入讲 **lifespan 高级用法 / async 与线程池深入 / 攒批调度 / 流式错误处理 / 性能调优 / serverless GPU / 与 Triton/vLLM/BentoML 对比**。
