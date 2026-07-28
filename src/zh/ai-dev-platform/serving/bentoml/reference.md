---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 BentoML 1.4.x（PyPI 最新 1.4.39，2026-05）官方文档 docs.bentoml.com 编写 —— Service / Runner API、bentofile.yaml 全字段、CLI 全命令、Bento 结构、框架适配器速查

## Service 装饰器 API

```python
import bentoml

@bentoml.service(
    name="MyService",                          # 可选：覆盖类名
    routes=[ bentoml.api.Route("/predict", "POST") ],
    resources={"cpu": 2, "gpu": 1, "memory": "8Gi"},
    traffic={"timeout": 60, "max_concurrency": 100},
    workers=[],
    image=bentoml.images.Image(python_version="3.11")
                   .python_packages("torch", "transformers"),
)
class MyService:
    ...
```

| 参数 | 类型 | 用途 |
|---|---|---|
| `name` | str | Service 名（Bento 元数据） |
| `routes` | list[Route] | 显式路由（一般自动生成） |
| `resources` | dict | 资源声明（cpu/gpu/memory），调度器提示 |
| `traffic` | dict | timeout / max_concurrency |
| `workers` | list | Runner 列表（自动从 __init__ 提取） |
| `image` | Image | 运行时镜像定义（python_version + packages + system_packages） |

## API 装饰器

```python
@bentoml.api(
    route="/summarize",            # 自定义路径
    batchable=True,                # 启用微批
    batch_dim=0,                   # batch 在第 0 维
    max_batch_size=32,
    max_latency_ms=100,            # 微批调度窗口
    input_spec=None,               # IO 描述符（一般用类型提示自动生成）
    output_spec=None,
    retries=3,
    timeout=30,
)
def summarize(self, text: str) -> str:
    ...
```

| 参数 | 默认 | 用途 |
|---|---|---|
| `route` | `/&lt;method_name&gt;` | HTTP 路径 |
| `batchable` | `False` | 是否启用微批 |
| `batch_dim` | `0` | batch 维度位置 |
| `max_batch_size` | `1000` | 单次 batch 最大数 |
| `max_latency_ms` | `10000` | 凑批窗口上限 |
| `retries` | `0` | Runner 失败重试 |
| `timeout` | 服务级 | 单次调用超时 |

## 框架适配器（get / save / load）

| 框架 | save | get | to_runner |
|---|---|---|---|
| PyTorch | `bentoml.pytorch.save_model(name, model)` | `bentoml.pytorch.get("name:tag")` | `.to_runner()` |
| ONNX | `bentoml.onnx.save_model(name, onnx_bytes)` | `bentoml.onnx.get(...)` | `.to_runner()` |
| Hugging Face Transformers | `bentoml.transformers.save_model(name, pipeline)` | `bentoml.transformers.get(...)` | `.to_runner()` |
| Diffusers | `bentoml.diffusers.save_model(name, pipe)` | `bentoml.diffusers.get(...)` | `.to_runner()` |
| TensorFlow / Keras | `bentoml.tensorflow.save_model(...)` | `bentoml.tensorflow.get(...)` | `.to_runner()` |
| Scikit-learn | `bentoml.sklearn.save_model(...)` | `bentoml.sklearn.get(...)` | `.to_runner()` |
| XGBoost | `bentoml.xgboost.save_model(...)` | `bentoml.xgboost.get(...)` | `.to_runner()` |
| LightGBM | `bentoml.lightgbm.save_model(...)` | `bentoml.lightgbm.get(...)` | `.to_runner()` |
| PicklableModel（通用） | `bentoml.picklable_model.save_model(...)` | `bentoml.picklable_model.get(...)` | `.to_runner()` |

通用模式：

```python
saved = bentoml.<fw>.save_model("name", model_object)
model_ref = bentoml.<fw>.get("name:latest")
runner = model_ref.to_runner()
runner.init_local(quiet=True)   # 本地开发模式必需
result = runner.run(input)
```

## bentofile.yaml 完整字段

```yaml
service: "service:Summarize"          # 必填：导入路径
labels:                                # 可选：元数据
  owner: ml-team
  stage: prod
description: "Summarization service"
include:                               # 打包进 Bento 的代码文件
  - "*.py"
  - "utils/**/*.py"
exclude:                               # 排除
  - "tests/**"
  - "*.pyc"
python:                                # Python 依赖
  python_version: "3.11"              # 锁定 Python 版本
  lock_packages: true                  # 用 requirements lock 保证可复现
  packages:
    - torch>=2.0
    - transformers==4.40.0
  requirements_txt: "requirements.txt"   # 或直接引用文件
  index_url: "https://pypi.org/simple"   # 私有源
  trusted_host: null
  find_links: []
  extra_index_url: null
  no_index: false
  pip_args: []
  wheels: []                           # 离线 wheel
conda:                                 # 可选：conda 环境
  environment_yml: "environment.yml"
docker:                                # 容器化配置
  base_image: "nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04"
  system_packages:
    - ffmpeg
    - libsndfile1
  setup_script: "install.sh"
  cuda_version: "12.1"
  dockerfile_template: "Dockerfile.tmpl"
  distro: "debian"                    # 或 amazonlinux / ubi8
models:                                # 引用的 BentoML 模型 tag
  - "distilbart_summarize:latest"
  - "resnet50:20240101"
envs:                                  # 环境变量
  - name: "MODEL_NAME"
    value: "distilbart"
```

## BentoML CLI 全命令

| 命令 | 用途 |
|---|---|
| `bentoml init &lt;dir&gt;` | 生成项目骨架 |
| `bentoml serve &lt;import_path&gt;` | 本地运行 Service |
| `bentoml serve --production` | 生产模式（多 worker + uvicorn） |
| `bentoml build` | 打包当前目录为 Bento |
| `bentoml containerize &lt;tag&gt;` | 把 Bento 转 OCI 镜像 |
| `bentoml deploy &lt;tag&gt; -n <name>` | 部署到 BentoCloud / Yatai |
| `bentoml list` | 列出本地 Bento |
| `bentoml get &lt;tag&gt;` | 查看 Bento 详情 |
| `bentoml delete &lt;tag&gt;` | 删除本地 Bento |
| `bentoml models list` | 列出本地模型 |
| `bentoml models get &lt;tag&gt;` | 模型详情 |
| `bentoml models pull &lt;tag&gt;` | 从 BentoCloud 拉模型 |
| `bentoml models push &lt;tag&gt;` | 推模型到 BentoCloud |
| `bentoml models delete &lt;tag&gt;` | 删除模型 |
| `bentoml run &lt;import_path&gt;:<method>` | CLI 调用单方法 |
| `bentoml env` | 显示环境信息 |
| `bentoml info` | 显示版本与配置 |
| `bentoml deployment list` | 列出部署 |
| `bentoml deployment get &lt;name&gt;` | 部署详情 |
| `bentoml deployment update &lt;name&gt;` | 更新部署 |
| `bentoml deployment terminate &lt;name&gt;` | 终止部署 |
| `bentoml cloud login` | 登录 BentoCloud |
| `bentoml yatai login` | 登录自建 Yatai |

### serve 常用参数

```bash
bentoml serve service:Summarize \
  --host 0.0.0.0 \
  --port 3000 \
  --workers 4 \                  # worker 数（生产模式）
  --reload \                      # 代码改动自动重载（开发用）
  --backlog 2048 \                # 等待连接队列
  --production \                  # 生产模式
  --api-workers 1 \
  --working-dir . \
  --mc 1                          # 每实例最大并发
```

## Bento 文件结构（解包后）

```
<name>/
├── bento.yaml              # Bento 元数据（service / models / python / docker）
├── README.md
├── apis/                   # 自动生成的 OpenAPI schema
├── env/
│   ├── python/             # requirements.txt / lock
│   ├── conda/
│   └── docker/             # Dockerfile
├── src/                    # 源代码（include 的文件）
└── models/                 # 引用的模型（pull 后存在）
```

## 配置（bentoml.toml / 环境变量）

```toml
# ~/.bentoml/bentoml.toml 或项目根
[api_server]
port = 3000
host = "0.0.0.0"
workers = 4
cors = { enabled = true, access_control_allow_origins = ["*"] }

[tracing]
exporter_type = "otlp"          # OpenTelemetry
sample_rate = 0.1

[monitoring]
enabled = true

[yatai]
endpoint = "https://yatai.example.com"
```

常用环境变量：

| 变量 | 用途 |
|---|---|
| `BENTOML_HOME` | 本地仓库根（默认 `~/.bentoml`） |
| `BENTOML_DEBUG` | 调试日志 |
| `BENTOML_CONFIG` | 配置文件路径 |
| `BENTOML_PORT` | 覆盖端口 |
| `BENTOML_BUNDLE_LOCAL_BUILD` | 本地构建时是否启用 |
| `BENTOML_DO_NOT_TRACK` | 关闭遥测 |

## 版本与生态

- PyPI 包：`bentoml`，最新稳定 1.4.39（2026-05-07）
- Python 要求：3.9+
- 配套：BentoCloud（商业托管）、Yatai（自建 K8s 部署平台，社区）
- 客户端 SDK：Python 原生；其它语言通过生成的 OpenAPI / gRPC stub 接入
- 关键里程碑：1.0 引入 `Service` + Runner 重构；1.1 引入 `@bentoml.service` 装饰器（取代 1.0 `bentoml.Service` + `@svc.api`）；1.4 系列持续迭代 IO 类型与 BentoCloud 集成
