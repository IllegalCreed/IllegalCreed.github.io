---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 BentoML 1.4.x（PyPI 最新 1.4.39，2026-05）官方文档 docs.bentoml.com 编写

## 速查

- Service 类：`@bentoml.service` 装饰；`__init__` 装载模型；每个方法用 `@bentoml.api` 即对外 API
- Runner：`bentoml.&lt;fw&gt;.get("tag").to_runner()` 把模型包成独立进程，绕开 GIL，支持多 worker
- IO 类型：原生 Python 类型（`str` / `int` / `dict` / `list`）会自动转 Pydantic schema；复杂场景用 Pydantic `BaseModel` / `numpy.ndarray` / `PIL.Image.Image` / `pd.DataFrame`
- 微批：`@bentoml.api(batchable=True, batch_dim=0)` 把并发请求自动聚合为 batch，调度器在 `max_latency_ms` 内凑批
- 资源声明：`@bentoml.service(resources={"gpu": 1, "memory": "4Gi"})` 提示调度器
- 镜像定制：`bentofile.yaml` 的 `docker.base_image` / `system_packages` / `setup_script` / `cuda_version`
- 模型管理：`bentoml models list` / `bentoml models pull` / `bentoml models push`（与 BentoCloud 同步）
- 异步 API：`@bentoml.api` 方法可声明为 `async def`，内部 await IO 时让出事件循环
- 流式响应：`@bentoml.api` 返回 `AsyncGenerator[str, None]` 自动 SSE / chunked
- 部署：BentoCloud（商业）原生；自建 Yatai 仍可用；纯容器可 push 到任意 registry + K8s 部署

## Service 与 Runner 关系

### Service = API 边界，Runner = 模型执行单元

```python
import bentoml

# Runner：把模型包成独立进程
runner = bentoml.pytorch.get("resnet50:latest").to_runner()
runner.init_local()  # 本地开发模式需要

# Service：对外 API
@bentoml.service(routes=[ bentoml.api.Route("/classify", "POST") ])
class ImageClassifier:
    def __init__(self):
        # Runner 在 Service 内通过 self 暴露
        self._runner = bentoml.pytorch.get("resnet50:latest").to_runner()

    @bentoml.api
    def classify(self, image: "PIL.Image.Image") -> str:
        tensor = preprocess(image)
        logits = self._runner.run(tensor)        # 跨进程调用
        return postprocess(logits)
```

为什么需要 Runner？

| 维度 | 直接在 Service 内加载 | 用 Runner |
|---|---|---|
| GIL | 受 Python GIL 限制，单 worker 串行 | 每个 Runner 是独立进程，真正并行 |
| 批处理 | 手写 | `batchable=True` 自动聚合 |
| 多 worker | 不支持 | `nworkers=N` 控制 |
| GPU 共享 | 不支持 | 多 Runner 共享 GPU |

## 微批（Dynamic Batching）

```python
@bentoml.api(batchable=True, batch_dim=0)
def classify(self, images: list["PIL.Image.Image"]) -> list[str]:
    # images 是被自动聚合的 batch
    tensors = [preprocess(im) for im in images]
    logits = self._runner.run(torch.stack(tensors))
    return [postprocess(l) for l in logits]
```

调度器行为：

- 默认 `max_latency_ms=10000`（10s 上限，可调）
- 在窗口内收集并发请求，凑到 `max_batch_size` 或超时即执行
- 适合 GPU 模型（吞吐敏感），CPU 模型一般不开启

## IO 类型与 Pydantic

### 复杂输入用 Pydantic

```python
from pydantic import BaseModel

class TextInput(BaseModel):
    text: str
    max_length: int = 128
    temperature: float = 0.7

class Result(BaseModel):
    summary: str
    tokens: int

@bentoml.api
def summarize(self, req: TextInput) -> Result:
    ...
```

Pydantic schema 自动生成 OpenAPI，Swagger UI 里可直接填表测试。

### 文件 / 多模态

```python
import bentoml
from typing import Annotated
from bentoml.io import File, Multipart

@bentoml.api
def upscale(self, image: "PIL.Image.Image") -> "PIL.Image.Image":
    return self._runner.run(image)
```

调用方直接 `multipart/form-data` 上传文件。

## 异步与流式

```python
@bentoml.api
async def stream(self, prompt: str):
    async for token in self._runner.async_stream(prompt):
        yield token    # SSE / chunked 自动启用
```

适合 LLM token 流式输出，客户端用 `text/event-stream` 接收。

## bentofile.yaml 高级用法

### 资源声明 + GPU 镜像

```yaml
service: "service:Summarize"
labels:
  owner: ml-team
include:
  - "service.py"
  - "utils/*.py"
python:
  lock_packages: true       # 用 requirements lock 保证可复现
  packages:
    - torch>=2.0
    - transformers==4.40.0
docker:
  base_image: "nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04"
  system_packages:
    - ffmpeg
    - libsndfile1
  setup_script: "install.sh"   # 容器内一次性 setup
  cuda_version: "12.1"
models:
  - "distilbart_summarize:latest"
```

### 多 Bento 共享代码

```yaml
# package_a/bentofile.yaml
service: "service:ServiceA"
include: [ "shared/*.py", "package_a/*.py" ]

# package_b/bentofile.yaml
service: "service:ServiceB"
include: [ "shared/*.py", "package_b/*.py" ]
```

## 部署形态对比

| 形态 | 适用 | 说明 |
|---|---|---|
| **本地 `bentoml serve`** | 开发 | 单进程，开发期调试 |
| **`--production` 模式** | 单机生产 | 多 worker + Uvicorn + gunicorn-style 管理 |
| **Docker 容器** | 任意 K8s | `bentoml containerize` → 推 registry → K8s deploy |
| **Yatai（社区版）** | 自建 K8s 平台 | 早期项目，部署 / 监控 / 模型仓库，社区维护 |
| **BentoCloud（商业）** | 托管生产 | Canary、CI/CD、自动扩缩容、监控一站式 |

## vs FastAPI：什么时候选 BentoML

| 维度 | BentoML | FastAPI |
|---|---|---|
| 定位 | ML 推理专用 | 通用 Web API |
| 微批 | `batchable=True` 自动 | 需手写调度 |
| 模型管理 | 内置 Bento 模型仓库 + tag | 无 |
| 框架适配 | PyTorch/ONNX/HF/TF/Sklearn 一致 API | 无 |
| 部署抽象 | `bentoml build/containerize/deploy` | 只到 uvicorn，需自行组织 |
| 性能 | 适合 ML 工作负载 | 适合 IO-bound |
| 学习成本 | 中（多层抽象） | 低 |
| 适合 | 模型推理 / 多模型组合 / 需要 Bento 化的团队 | CRUD / 业务 API / 混合负载 |

经验法则：**纯模型推理选 BentoML，业务逻辑多选 FastAPI，混合用 FastAPI 把 BentoML Service 当下游调用。**

## 与 Hugging Face / Diffusers 集成

```python
import bentoml
from diffusers import StableDiffusionPipeline

# 保存
pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
bentoml.diffusers.save_model("sd_v15", pipe)

# Service
@bentoml.service(resources={"gpu": 1})
class Txt2Img:
    def __init__(self):
        self._runner = bentoml.diffusers.get("sd_v15:latest").to_runner()

    @bentoml.api
    def generate(self, prompt: str) -> bytes:
        img = self._runner.run(prompt)
        return img.tobytes()
```

`resources={"gpu": 1}` 让 BentoCloud 调度到带 GPU 的节点。
