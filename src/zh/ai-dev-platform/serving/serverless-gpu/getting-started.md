---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Modal（modal.com，2026）与 Replicate（replicate.com，cog 0.21+）官方文档编写

## 速查

- **Modal 安装**：`pip install modal`，`modal setup`（配置 token）
- **Modal 核心**：`modal.App("name")` + `@app.function(gpu=..., image=...)` + `modal.Image.debian_slim().pip_install(...)`
- **Modal 本地调试**：`modal serve app.py`（生成临时公网 URL + 热重载）
- **Modal 部署**：`modal deploy app.py`（持久化部署）
- **Modal 暴露 HTTP**：`@modal.fastapi_endpoint()`（旧名 `@modal.web_endpoint`，v0.73.82 前版本）/ `@modal.asgi_app()` / `@modal.wsgi_app()`
- **Modal GPU**：字符串如 `"T4"` `"L4"` `"A10"` `"L40S"` `"A100"` `"H100"` `"H200"` `"B200"`，或 `gpu=2` 表示数量
- **Modal 扩缩容**：`min_containers` / `max_containers` / `scaledown_window` / `target_concurrency_input`
- **Modal 冷启动**：Memory Snapshot（`enable_memory_snapshot=True`）+ 容器复用实现亚秒级
- **Replicate 安装 cog**：`pip install cog` 或 `curl ... | sh`，Python 3.8+
- **Replicate cog 配置**：仓库根放 `cog.yaml`（声明 GPU / Python / 依赖）+ `predict.py`（定义 `BaseRunner` 子类）
- **Replicate 本地调试**：`cog predict -i @input.json`
- **Replicate 部署**：`cog login` + `cog push r8.im/&lt;user&gt;/<model>`
- **Replicate 调用**：REST `POST https://api.replicate.com/v1/predictions` + 模型版本 ID
- **计费**：Modal 按秒（T4≈0.59 美元/小时、H100≈3.95 美元/小时）；Replicate 按秒按 GPU 型号

## Modal 快速上手

### 安装 + 第一个 function

```bash
pip install modal
modal setup      # 浏览器登录拿 token
```

```python
# app.py
import modal

app = modal.App("hello-gpu")

image = modal.Image.debian_slim().pip_install("torch", "transformers")

@app.function(image=image, gpu="T4")
def answer(question: str) -> str:
    from transformers import pipeline
    pipe = pipeline("text-generation", model="gpt2")
    return pipe(question, max_new_tokens=20)[0]["generated_text"]

@app.local_entrypoint()
def main(q: str = "What is serverless GPU?"):
    print(answer.remote(q))
```

```bash
modal run app.py              # 一次性运行
modal serve app.py            # 持续运行 + 热重载（开发）
```

### 暴露 HTTP endpoint

```python
import modal
from pydantic import BaseModel

app = modal.App("api")
image = modal.Image.debian_slim().pip_install("transformers", "torch")

class Q(BaseModel):
    text: str

@app.function(image=image, gpu="A100")
@modal.fastapi_endpoint(method="POST")
def classify(req: Q) -> dict:
    from transformers import pipeline
    pipe = pipeline("text-classification")
    return pipe(req.text)[0]

# 部署后用 modal deploy，再 .web_url 拿到 https URL
```

```bash
modal deploy app.py
modal app url     # 拿到持久化 URL
curl -X POST <url>/classify -H "Content-Type: application/json" -d '{"text": "I love Modal!"}'
```

### GPU 选型

| 字符串 | GPU | 约 $/小时（2026） | 适合 |
|---|---|---|---|
| `"T4"` | T4 16GB | 0.59 | 推理入门 / 低延迟小模型 |
| `"L4"` | L4 24GB | 0.80 | 中等模型、性价比好 |
| `"A10"` | A10 24GB | 1.10 | CV / 中等 LLM |
| `"L40S"` | L40S 48GB | 1.95 | 大模型推理 |
| `"A100"` | A100 40GB / 80GB | 2.10 / 2.50 | 通用大模型 |
| `"H100"` | H100 80GB | 3.95 | LLM 训练推理旗舰 |
| `"H200"` / `"B200"` / `"B300"` | 最新旗舰 | 4.54 / 6.25 / 7.10 | 极致性能 |

```python
@app.function(gpu="A100-80GB")          # 指定具体显存
@app.function(gpu=2)                    # 2 块默认 GPU
@app.function(gpu="H100:2")             # 2 块 H100
```

## Replicate（cog）快速上手

### 安装 cog + 初始化项目

```bash
sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_`uname -s`_`uname -m`
sudo chmod +x /usr/local/bin/cog

cog init       # 在当前目录生成 cog.yaml + predict.py
```

`cog.yaml`：

```yaml
build:
  gpu: true                       # 需要 GPU
  python_version: "3.11"
  python_packages:
    - "torch==2.2.0"
    - "transformers==4.40.0"
  system_packages:
    - "libgl1"
predict: "predict.py:Predictor"   # 指向 Predictor 类（旧）/ Runner（新）
```

### 写 predict.py（新 BaseRunner 风格）

```python
# predict.py
from cog import BaseRunner, Input, Path

class Runner(BaseRunner):
    def setup(self) -> None:
        """一次性加载模型权重，多次推理复用"""
        from transformers import pipeline
        self.pipe = pipeline("text-classification")

    def run(
        self,
        text: str = Input(description="待分类文本"),
    ) -> dict:
        """单次推理"""
        result = self.pipe(text)[0]
        return {"label": result["label"], "score": float(result["score"])}
```

> 旧的 `BasePredictor` / `Predictor` / `predict()` 仍兼容但已弃用，新代码用 `BaseRunner` + `run()`。

### 本地预测

```bash
cog predict -i text="Modal is great"
# 输出 JSON 结果
```

### 推送到 Replicate

```bash
cog login                            # 浏览器登录
cog push r8.im/<your-username>/<model-name>
# 返回版本 ID，如 r8.im/xxx/model:abc123
```

### 调用 Prediction API

```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "abc123...",
    "input": {"text": "Hello Replicate"}
  }'
```

返回 prediction ID，轮询 `GET /v1/predictions/&lt;id&gt;` 直到 status 为 `succeeded`，拿 output。

## Python SDK 调用 Replicate

```bash
pip install replicate
```

```python
import replicate
import os
os.environ["REPLICATE_API_TOKEN"] = "r8_xxx"

output = replicate.run(
    "your-username/your-model:abc123",
    input={"text": "Hello"},
)
print(output)
```

## 下一步

- Modal 扩缩容 / 冷启动优化 / 队列 / 异步 / 与传统 GPU 租赁 / SageMaker 对比见 [指南](./guide-line.md)
- cog.yaml 全字段 / Modal `@app.function` 参数 / Prediction API / 计费速查见 [参考](./reference.md)
