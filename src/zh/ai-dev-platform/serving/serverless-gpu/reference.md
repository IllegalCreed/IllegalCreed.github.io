---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Modal（modal.com，2026）与 Replicate（replicate.com，cog 0.21+）官方文档编写 —— Modal `@app.function` 参数 / cog.yaml 全字段 / Prediction API / 计费速查

## Modal API

### App 创建

```python
import modal
app = modal.App("my-app")    # 替代已弃用的 modal.Stub
```

> `modal.Stub()` 在 Modal 1.0 后已弃用，新代码统一用 `modal.App()`。

### Image 定义

```python
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("torch==2.2.0", "transformers==4.40.0")
    .apt_install("libgl1", "ffmpeg")
    .env({"HF_HOME": "/data/hf"})
    .run_commands("echo setup")
    .copy_local_file("./local.txt", "/root/local.txt")
    .copy_local_dir("./data", "/data")
)
```

| 方法 | 用途 |
|---|---|
| `debian_slim(python_version=...)` | 基础镜像 |
| `pip_install(*pkgs)` | pip 安装 |
| `apt_install(*pkgs)` | apt 系统包 |
| `env(dict)` | 环境变量 |
| `run_commands(*cmds)` | 任意 shell |
| `copy_local_file(src, dst)` | 拷贝本地文件 |
| `copy_local_dir(src, dst)` | 拷贝目录 |
| `from_dockerfile(path)` | 用 Dockerfile 构建 |
| `from_registry(image)` | 拉公共镜像 |

### @app.function 参数

```python
@app.function(
    image=image,
    gpu="A100",                    # 字符串 / 数量 / "A100:2"
    cpu=1,                          # CPU 核数
    memory=1024,                    # MiB
    timeout=3600,                   # 单次调用超时（秒）
    retries=3,                      # 失败重试
    scaledown_window=300,           # 闲时回收秒数
    min_containers=0,               # 保活容器数
    max_containers=10,              # 并发容器上限
    target_concurrency_input=1,     # 每容器目标并发
    container_idle_timeout=60,      # 单请求 idle 超时
    enable_memory_snapshot=False,   # Memory Snapshot
    volumes={"/data": volume},      # 挂载持久卷
    secrets=[modal.Secret.from_name("hf_token")],
    schedule=modal.Cron("0 * * * *"),   # 定时触发
    network_file_systems={...},
    blocking=False,                 # 是否阻塞主入口
)
def fn(...):
    ...
```

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `image` | Image | debian_slim | 容器镜像 |
| `gpu` | str/int/None | None | GPU 型号或数量 |
| `cpu` | float | 1 | CPU 核数 |
| `memory` | int | None | MiB 内存 |
| `timeout` | int | 3600 | 单次调用超时（秒） |
| `retries` | int | 0 | 失败重试次数 |
| `scaledown_window` | int | 60 | 闲时回收秒数 |
| `min_containers` | int | 0 | 保活容器数 |
| `max_containers` | int | None | 并发上限 |
| `target_concurrency_input` | int | 1 | 每容器目标并发 |
| `enable_memory_snapshot` | bool | False | 启用 Memory Snapshot |
| `volumes` | dict | {} | 持久卷挂载 |
| `secrets` | list | [] | 密钥注入 |
| `schedule` | Schedule | None | 定时触发 |

### GPU 字符串取值（2026）

| 值 | GPU | $/小时 | $/秒 |
|---|---|---|---|
| `"T4"` | T4 16GB | 0.59 | 0.000164 |
| `"L4"` | L4 24GB | 0.80 | 0.000222 |
| `"A10"` | A10 24GB | 1.10 | 0.000306 |
| `"L40S"` | L40S 48GB | 1.95 | 0.000542 |
| `"A100"` (默认 80GB) / `"A100-80GB"` / `"A100-40GB"` | A100 | 2.10 / 2.50 | — |
| `"RTX6000"` | RTX PRO 6000 | 3.03 | 0.000842 |
| `"H100"` | H100 80GB | 3.95 | 0.001097 |
| `"H200"` | H200 | 4.54 | 0.001261 |
| `"B200"` | B200 | 6.25 | 0.001736 |
| `"B300"` | B300 | 7.10 | 0.001972 |

指定数量：`gpu=2`（2 块默认）、`gpu="H100:2"`（2 块 H100）。

### Web endpoint 装饰器

```python
# FastAPI 风格（推荐新代码）
@app.function()
@modal.fastapi_endpoint(method="POST")
def api(req: dict) -> dict: ...

# ASGI / WSGI 整应用
@app.function()
@modal.asgi_app()
def web():
    from fastapi import FastAPI
    app = FastAPI()
    app.post("/x")(handler)
    return app

# 通用端口转发
@app.function()
@modal.web_server(port=8000)
def custom():
    # 启动任意监听 0.0.0.0:8000 的服务
    ...
```

| 装饰器 | 用途 | 备注 |
|---|---|---|
| `@modal.fastapi_endpoint()` | 单函数 → FastAPI | 旧名 `@modal.web_endpoint`（v0.73.82 前） |
| `@modal.asgi_app()` | 返回 ASGI app 对象 | FastAPI / Starlette |
| `@modal.wsgi_app()` | 返回 WSGI app 对象 | Flask / Django |
| `@modal.web_server(port)` | 转发任意端口 | 非 ASGI/WSGI 服务 |

### 持久化资源

```python
# Volume（块存储）
vol = modal.Volume.from_name("model-cache", create_if_missing=True)
@app.function(volumes={"/data": vol})
def fn(): ...

# NetworkFileSystem（POSIX 文件系统）
nfs = modal.NetworkFileSystem.from_name("shared", create_if_missing=True)

# Dict（KV 存储）
d = modal.Dict.from_name("state", create_if_missing=True)

# Queue（任务队列）
q = modal.Queue.from_name("tasks", create_if_missing=True)
```

### 部署 + 调用

```bash
modal deploy app.py      # 持久化部署
modal serve app.py       # 临时 + 热重载（开发）
modal app list           # 列出已部署
modal app logs <app_id>  # 查日志
```

```python
# 本地调用远端
result = fn.remote("input")
gen = fn.remote_gen(...)         # 生成器流式
result = await fn.remote.aio()   # 异步
fn.spawn(...)                    # fire-and-forget
```

## Replicate（cog）

### cog.yaml 完整字段

```yaml
build:
  gpu: true                    # 或 false（CPU only）
  cuda: "12.1"                 # CUDA 版本（可选）
  python_version: "3.11"       # Python 版本
  python_packages:
    - "torch==2.2.0"
    - "transformers==4.40.0"
  python_requirements: "requirements.txt"   # 或文件引用
  system_packages:
    - "libgl1"
    - "ffmpeg"
  run:
    - "echo setup"
predict: "predict.py:Predictor"     # 指向类（旧 Predictor / 新 BaseRunner）
image: "r8.im/your/base:tag"        # 自定义基础镜像（可选）
```

### predict.py：BaseRunner（新）

```python
from cog import BaseRunner, Input, Path

class Runner(BaseRunner):
    def setup(self) -> None:
        """一次性加载，多次 run 复用"""
        from transformers import pipeline
        self.pipe = pipeline("text-classification")

    def run(
        self,
        text: str = Input(description="输入文本"),
        max_tokens: int = Input(default=128, ge=1, le=512),
        image: Path = Input(description="可选图像", default=None),
    ) -> str:
        """单次推理，返回值序列化给客户端"""
        ...
        return result
```

### Input 验证参数

| 参数 | 类型 | 用途 |
|---|---|---|
| `description` | str | 客户端展示说明 |
| `default` | any | 默认值；省略则必填 |
| `ge` / `le` | int/float | 数值最小 / 最大 |
| `min_length` / `max_length` | int | 字符串长度限制 |
| `choices` | list | 枚举值 |
| `deprecated` | bool | 标记弃用 |

### 旧 Predictor 接口（已弃用）

```python
# 兼容但官方不推荐新代码用
from cog import BasePredictor, Input, Path

class Predictor(BasePredictor):
    def predict(self, text: str = Input()) -> str:
        ...
```

### CLI

```bash
cog init                  # 生成 cog.yaml + predict.py
cog build                 # 构建镜像（本地）
cog predict -i text="x"   # 本地推理
cog predict -i @in.json   # 从 JSON 文件读输入
cog login                 # 浏览器登录 Replicate
cog push r8.im/<user>/<model>   # 推送到 Replicate
cog push r8.im/<user>/<model>:<tag>   # 带版本 tag
```

## Replicate Prediction API

### 提交

```bash
POST https://api.replicate.com/v1/predictions
Authorization: Token $REPLICATE_API_TOKEN
Content-Type: application/json

{
  "version": "<model_owner>/<model_name>:<hash>",
  "input": {"text": "Hello"},
  "webhook": "https://your.app/cb",            # 可选
  "webhook_events_filter": ["completed"]         # 可选
}
```

返回 prediction 对象，含 `id`、`status`（starting/processing/succeeded/failed/canceled）、`output`、`urls.get`（轮询地址）。

### 轮询 / 取消

```bash
GET  https://api.replicate.com/v1/predictions/<id>
POST https://api.replicate.com/v1/predictions/<id>/cancel
```

### Python SDK

```python
import replicate
output = replicate.run("owner/model:hash", input={"text": "x"})

# 异步
pred = replicate.predictions.create(version="...", input={...})
pred.wait()
print(pred.output)
```

## 计费速查

| 维度 | Modal | Replicate |
|---|---|---|
| 单位 | 按秒 | 按秒 |
| 触发 | 容器运行 | prediction 运行 |
| 闲时 | 零（容器回收） | 零 |
| T4 价格 | 0.59 $/hr | 平台标定（视硬件） |
| H100 价格 | 3.95 $/hr | 平台标定 |
| 数据出口 | 免费 | 按 output 文件大小 |
| 预算控制 | max_containers / timeout | Prepaid credit |

## 版本与生态

- Modal Python SDK：`pip install modal`，配合 `modal` CLI；JS/TS/Go SDK 用于资源管理与函数调用
- Modal 1.0：`modal.App` 取代 `modal.Stub`，统一基础设施即代码心智
- Cog：开源工具 `cog`，最新 0.21+（引入 `@cog.concurrent` 装饰器，0.14+ 引入 async runners）
- Replicate：商业平台，模型库分 official / community / private 三类
