---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 BentoML 1.4.x（PyPI 最新 1.4.39，2026-05）官方文档 docs.bentoml.com 编写

## 速查

- 安装：`pip install bentoml`（Python 3.9+）
- 创建项目：`bentoml init ./my-service`（生成 `service.py` + `bentofile.yaml` + `requirements.txt`）
- 服务核心：`@bentoml.service` 装饰类，`@bentoml.api` 装饰方法即 API
- 本地运行：`bentoml serve service:ServiceName` → `http://localhost:3000`（默认端口，非 FastAPI 的 8000）
- 生产模式：`bentoml serve service:ServiceName --production --host 0.0.0.0 --port 3000`
- 打包：`bentoml build`（生成 Bento 到本地仓库 `~/.bentoml/bentos/`）
- 容器化：`bentoml containerize &lt;tag&gt;`（生成 OCI 镜像）
- 部署：`bentoml deploy &lt;bento_tag&gt; -n <deployment_name>`（接 BentoCloud / Yatai）
- IO 类型：`numpy`、`pandas.DataFrame`、`PIL.Image.Image`、`str`、`bytes`、Pydantic `BaseModel`、`bentoml.io.File / Multipart`
- 框架加载：`bentoml.pytorch.get("model:tag").to_runner()`、`bentoml.onnx.get(...)`、`bentoml.transformers.get(...)`
- 微批：`@bentoml.api(batchable=True)` + `batch_dim=0` 自动聚合并发请求为 batch
- 自带 Swagger：访问 `/`（根路径）即 Swagger UI，`/docs.json` 拿 OpenAPI schema
- 监控：默认暴露 Prometheus metrics（`--metrics-port`），含 QPS / 延迟 / worker 利用率

## 安装与首次启动

### 安装 + 创建项目

```bash
pip install bentoml

# 生成项目骨架
bentoml init ./summarize-service
cd summarize-service
```

生成的目录：

```
summarize-service/
├── service.py            # Service 定义
├── bentofile.yaml        # 打包配置
└── requirements.txt
```

### 写一个最简 Service

```python
# service.py
import bentoml

@bentoml.service
class Summarize:
    # 模型在 __init__ 加载，每个 worker 实例化一次
    def __init__(self) -> None:
        from transformers import pipeline
        self.pipe = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

    @bentoml.api
    def summarize(self, text: str) -> str:
        return self.pipe(text)[0]["summary_text"]
```

### 本地运行

```bash
bentoml serve service:Summarize
# 浏览器打开 http://localhost:3000 即 Swagger UI
```

调用：

```bash
curl -X POST http://localhost:3000/summarize \
     -H "Content-Type: application/json" \
     -d '{"text": "BentoML is a unified model serving framework..."}'
```

## 使用预训练模型（PyTorch 示例）

### 保存到 BentoML 模型仓库

```python
import bentoml
import torch
from transformers import pipeline

pipe = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
# 把 pipeline 保存为 BentoML 模型（带 tag）
saved = bentoml.transformers.save_model("distilbart_summarize", pipe)
print(saved.tag)   # distilbart_summarize:xxxxxx
```

### 在 Service 中加载

```python
import bentoml

@bentoml.service
class Summarize:
    _runner = bentoml.transformers.get("distilbart_summarize:latest").to_runner()

    @bentoml.api(batchable=True)
    def summarize(self, text: str) -> str:
        return self._runner.run([text])[0]["summary_text"]
```

`to_runner()` 把模型包装成多 worker 进程，避免 Python GIL 限制，吞吐显著提升。

## 打包成 Bento

`bentofile.yaml`：

```yaml
service: "service:Summarize"
labels:
  owner: ml-team
  stage: prod
include:
  - "*.py"
python:
  packages:
    - torch
    - transformers
    - numpy
docker:
  # 容器化时的基础镜像与系统包
  base_image: "nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04"
  system_packages:
    - ffmpeg
  cuda_version: "12.1"
models:
  - "distilbart_summarize:latest"
```

```bash
bentoml build
# 输出类似：Successfully built Bento(tag=summarize-service:xxxxxx) at ~/.bentoml/bentos/...
```

## 容器化 + 部署

### 容器化

```bash
bentoml containerize summarize-service:latest
docker run --rm -p 3000:3000 summarize-service:latest
```

### 部署到 BentoCloud

```bash
bentoml deploy summarize-service:latest -n summarize-prod --cluster default
```

部署后自动提供 Canary 发布、自动扩缩容、监控、日志聚合。

## 自带 Swagger 与监控

| 端点 | 用途 |
|---|---|
| `GET /` | Swagger UI |
| `GET /docs.json` | OpenAPI schema |
| `GET /metrics` | Prometheus metrics（QPS、延迟、worker 利用率） |
| `GET /healthz` | Liveness |
| `GET /livez` | Readiness |

## 下一步

- Service / Runner / IO Descriptor / 多 API 协调 / 自定义 IO 见 [指南](./guide-line.md)
- bentofile.yaml 全字段 / CLI 全命令 / Bento 结构 / 框架适配器速查见 [参考](./reference.md)
