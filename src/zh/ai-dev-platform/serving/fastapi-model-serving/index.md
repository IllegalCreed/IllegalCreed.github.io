---
layout: doc
---

# FastAPI 模型服务化

将 ML/DL 模型（PyTorch、ONNX、scikit-learn、HuggingFace transformers）封装为**生产级 HTTP/gRPC 服务**的实践——FastAPI 因「原生 async、类型安全、文档自动、性能接近 Node/Go」成为 Python ML 服务化的首选框架。本文聚焦 AI 服务化场景：用 **lifespan** 在启动时把模型加载到显存/内存（避免每请求重复加载）、规避 **async 陷阱**（CPU/GPU 密集推理绝不能用 `async def`，要么普通 `def` 让 FastAPI 自动丢进线程池、要么显式 `run_in_threadpool`）、用 **SSE 流式输出**（`StreamingResponse` + `text/event-stream`）实现 LLM token 流、写**批量推理端点**摊薄单样本开销、与 PyTorch/ONNX Runtime/vLLM 配合做高性能推理。生产部署用 **gunicorn + uvicorn workers** 多进程榨干多核。通用 FastAPI（路由、依赖注入、Pydantic、认证）归「后端框架」章节，这里只讲模型服务化特有的工程问题——这是把模型从 Jupyter notebook 推到生产 API 的关键一公里。

## 评价

**优点**

- **启动加载模型避免重复开销**：`lifespan` async context manager 在应用启动时把模型加载到显存/内存，常驻供所有请求复用；免去每请求 load 的秒级开销
- **async 陷阱有清晰答案**：CPU/GPU 密集推理用普通 `def`（FastAPI 自动丢线程池），或在 `async def` 里显式 `run_in_threadpool`；不阻塞事件循环
- **SSE 流式原生支持**：`StreamingResponse(generator, media_type="text/event-stream")` 一行实现 LLM token 流，与 OpenAI/vLLM/Ollama 风格一致
- **批量推理端点易写**：单端点接收 List[Input]，一次 forward 摊薄单样本开销，吞吐提升数倍
- **类型安全 + 自动文档**：Pydantic 模型定义输入输出，`/docs` 自动生成 OpenAPI，前端/客户端零成本对接
- **多 worker 榨干多核**：gunicorn + uvicorn workers 多进程，每 worker 一份模型（注意显存），配合 GPU 多副本或 CPU 模型效果显著
- **与推理生态无缝**：直接 import torch / onnxruntime / transformers / vllm；也能反代 vLLM/Ollama 加业务逻辑层

**缺点**

- **GIL 限制 CPU 多核**：单 worker 内 CPU 密集推理受 GIL 约束，必须靠多 worker（多进程）或 run_in_threadpool（释放 GIL 的库如 onnxruntime）；纯 Python 推理多 worker 才有效
- **async 心智成本**：新手容易在 `async def` 里直接调阻塞推理，导致整个服务卡死；要理解「async 是给 I/O 的，CPU 密集用 def 或 threadpool」
- **每 worker 一份模型 = 显存翻倍**：多 worker 部署 GPU 模型时每进程独占一份显存，4 worker 跑 7B 模型要 4×显存；要权衡 worker 数与显存
- **模型加载阻塞启动**：lifespan 里加载大模型需几十秒到数分钟，健康检查、滚动更新要考虑 readiness probe 而非 liveness
- **冷启动慢**：相比无状态 web 服务，模型服务的容器冷启动慢，serverless GPU 场景需额外预热机制
- **没有内建批处理调度**：不像 Triton/NVIDIA Dynamo 那样有动态 batching 调度器，要自己写「攒批」逻辑或用外部组件
- **流式错误处理弱**：StreamingResponse 一旦开始流式输出，中途异常难以用标准 HTTP 状态码回传，需要自定义错误协议

## 文档地址

[FastAPI Documentation](https://fastapi.tiangolo.com/)

## GitHub 地址

[fastapi/fastapi](https://github.com/fastapi/fastapi)

## 幻灯片地址

<a href="/SlideStack/fastapi-model-serving-slide/" target="_blank">FastAPI 模型服务化</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=FastAPI 模型服务化" target="_blank" rel="noopener noreferrer">FastAPI 模型服务化 测试题</a>
