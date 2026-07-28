---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gradio 官方文档编写（gradio.app，2025.07）—— Blocks 高级 / 事件进阶 / State 与会话 / 流式技巧 / 主题 CSS / 性能队列 / HF 生态 / 生产化

## Blocks 高级布局

### Row / Column / scale

```python
with gr.Blocks() as demo:
    with gr.Row():
        # 不等宽：scale 控制比例
        with gr.Column(scale=1):       # 占 1 份
            img = gr.Image()
        with gr.Column(scale=2):       # 占 2 份
            out = gr.Textbox(lines=10)
            btn = gr.Button()
```

`scale` 类似 flex-grow，控制同行/同列的占比。`gr.Column(scale=1, min_width=300)` 还能设最小宽度。

### Tabs 标签页

```python
with gr.Blocks() as demo:
    with gr.Tabs():
        with gr.Tab("图像分类"):
            ...
        with gr.Tab("目标检测"):
            with gr.Tab("YOLO"): ...       # 可嵌套
            with gr.Tab("DETR"): ...
        with gr.Tab("图像分割"):
            ...
```

`gr.Tab("id").select()` 可监听标签切换。

### Accordion 折叠面板

```python
with gr.Blocks() as demo:
    with gr.Accordion("高级选项", open=False):   # 默认收起
        temperature = gr.Slider(0, 2, label="温度")
        top_p = gr.Slider(0, 1, label="top_p")
    btn = gr.Button("生成")
```

适合收纳次要参数，保持主界面清爽。

### Group / Box

```python
with gr.Group():       # 无边距，紧凑分组
    a = gr.Textbox()
    b = gr.Textbox()

with gr.Box():         # 带边框分组（部分版本已合并到 Group）
    ...
```

## 事件进阶

### 输入输出映射

```python
# 多输入 → 多输出，按位置对应
btn.click(fn=f, inputs=[a, b, c], outputs=[x, y])

# dict 形式：按组件对象映射，可跳过
btn.click(fn=f, inputs=[a], outputs={x: ..., y: ...})
```

### 事件参数

```python
btn.click(
    fn=f,
    inputs=a,
    outputs=b,
    every=2,            # 每 2 秒自动触发一次（定时）
    trigger_mode="once",# once（默认）/ multiple / always_last
    concurrency_limit=4,# 同时并发的该事件数（限流）
    concurrency_id="gpu",# 共享并发池
    show_progress="full",# full / hidden / minimal
    show_api=True,       # 是否暴露到 API
)
```

### Trigger Mode（重要）

`trigger_mode` 控制连续点击时是否取消上次未完成的执行：

| 模式 | 行为 |
|---|---|
| `once`（默认）| 上次未完成时新点击被忽略 |
| `multiple` | 每次点击都执行（可能堆积）|
| `always_last` | 取消之前的，只跑最后一次 |

对话型应用常用 `always_last`（用户狂点只响应最后输入）。

### .then() 链式与并发

```python
# 串行链
btn.click(fn=a, ...).then(fn=b, ...).then(fn=c, ...)

# 并发分支（gr.on 收集）
```

### cancels 取消

```python
event = btn.click(fn=long_task, inputs=x, outputs=y)
stop_btn.click(fn=None, inputs=None, outputs=None, cancels=[event])
```

`cancels` 可取消正在运行的事件（如停止 LLM 流式生成）。

## State 与会话管理

### gr.State 全局共享

```python
with gr.Blocks() as demo:
    state = gr.State(value=[])    # 全局状态
    btn = gr.Button()

    def add(state, item):
        state.append(item)
        return state, f"共 {len(state)} 项"

    btn.click(fn=add, inputs=[state, textbox], outputs=[state, out])
```

**关键**：`gr.State` 的值会作为函数**第一个参数**自动传入，函数也要把它作为**输出**返回（更新）。它是**全局共享**的——多用户并发会串状态。

### 会话隔离（session_state）

默认 `gr.State` 是全局的。要每会话独立用 `gr.State(..., time_to_live=...)` 或基于 `request: gr.Request` 的 session_id：

```python
def fn(x, request: gr.Request):
    session_id = request.session   # 每用户唯一
    sessions[session_id] = ...
```

::: warning 多用户并发状态污染
demo 性质的小工具用全局 gr.State 没问题。但若部署给多用户用（如 HF Space 公开访问），全局 State 会让用户互相看到对方数据——必须做会话隔离。
:::

## 流式输出技巧

### 增量 vs 累积

```python
# 累积式（LLM token 流常用）：每次 yield 完整累积结果
def stream_chat(msg, history):
    full = ""
    for token in llm.stream(msg):
        full += token
        yield history + [{"role":"assistant","content": full}]

# 增量式（图像逐帧）：每次 yield 下一帧
def stream_frames():
    for frame in video_gen():
        yield frame
```

### 流式 + 取消

```python
with gr.Blocks() as demo:
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    submit = gr.Button("发送")
    stop = gr.Button("停止")

    event = submit.click(fn=stream, inputs=[msg, chatbot], outputs=chatbot)
    stop.click(fn=None, cancels=[event])   # 取消流式
```

`cancels` 让用户能中止正在流的生成。

### 流式媒体

```python
# 音频流式（TTS 边生成边播）
gr.Audio(streaming=True)
```

组件支持 `streaming=True` 时，generator yield 的每个 chunk 实时推送播放。

## 自定义主题与 CSS

### 主题

```python
import gradio as gr

theme = gr.themes.Soft(              # Soft / Monochrome / Glass / Default
    primary_hue="blue",
    secondary_hue="cyan",
    neutral_hue="slate",
    font=[gr.themes.GoogleFont("Inter"), "sans-serif"],
)

demo = gr.Blocks(theme=theme)
```

### 自定义 CSS

```python
with gr.Blocks(css="""
    .gradio-container { max-width: 800px !important; }
    #my-btn { background: red !important; }
""") as demo:
    btn = gr.Button("x", elem_id="my-btn")
```

组件 `elem_id` / `elem_classes` 用于 CSS 选择器。

## 性能与队列

### demo.queue()

长耗时推理（模型推理几秒到几十秒）必须启用队列，否则请求超时或堆积：

```python
demo = gr.Interface(...)
demo.queue(
    max_size=100,                # 队列最大长度
    default_concurrency_limit=4, # 默认每事件并发
).launch()
```

队列模式下：
- 用户请求进队列，前端显示排队位置
- 按事件 `concurrency_limit` 控制并发
- 流式输出能在队列中实时推送

### 并发控制

```python
btn.click(fn=gpu_inference, concurrency_limit=1, concurrency_id="gpu")
```

`concurrency_id="gpu"` 让多个事件共享同一并发池（如都受 GPU 资源约束时，合计不超过限制）。

### API 模式

Gradio demo 自动暴露 API（`/api/predict` 或 `/run/predict`）。`show_api=False` 关闭某端点。可被 curl / Python client 调用：

```python
from gradio_client import Client
client = Client("user/space-name")
result = client.predict(input_text, api_name="/predict")
```

## 与 Hugging Face 生态集成

### Spaces 部署

git push 即上线，自动构建（基于 README.md 的 `sdk: gradio`）。

### gradio_client

```python
from gradio_client import Client

# 连远程 Space
client = Client("black-forest-labs/FLUX.1-schnell")
result = client.predict(prompt="a cat", api_name="/infer")
```

### transformers / diffusers 配合

```python
from transformers import pipeline
pipe = pipeline("text-generation", model="Qwen/Qwen2.5-0.5B")

gr.Interface(fn=lambda x: pipe(x)[0]["generated_text"], inputs="text", outputs="text").launch()
```

### 与 Ollama / vLLM 配合

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="x")

def chat(msg, history):
    resp = client.chat.completions.create(model="llama3.2", messages=history+[{"role":"user","content":msg}])
    return resp.choices[0].message.content

gr.ChatInterface(fn=chat).launch()
```

## 生产化注意

Gradio 定位是 demo / 原型，生产化要警惕：

| 问题 | 应对 |
|---|---|
| 无鉴权 | `launch(auth=...)`（弱）/ 前置 OAuth 反代 |
| 无限流 | `concurrency_limit` / 前置网关限流 |
| 无监控 | 接 Sentry / Prometheus（需自接）|
| 单进程并发弱 | 多副本 + LB，或迁 Streamlit + 后端 API |
| 多用户状态污染 | 会话隔离（session_id）|
| 资源泄漏 | 模型常驻、连接池 |
| 部署稳定性 | Docker + HF Spaces / 自建 K8s |

::: warning 何时该离开 Gradio
面向公众、高并发、需深度业务逻辑、需前后端分离 → 迁 Streamlit（数据应用）或 Next.js + FastAPI 后端（产品级）。Gradio 适合：内部 demo、黑客松、教学、模型验收、HF Spaces 分享。
:::
