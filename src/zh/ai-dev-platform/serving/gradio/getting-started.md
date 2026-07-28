---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gradio 官方文档编写（gradio.app，2025.07 版本）

## 速查

- 系统要求：Python **3.10+**
- 安装：`pip install --upgrade gradio`
- 最简界面：`gr.Interface(fn, inputs, outputs).launch()`
- 默认端口：`http://localhost:7860`
- 临时公网：`demo.launch(share=True)` → `*.gradio.live`
- 三大入口类：`gr.Interface`（最快）/ `gr.Blocks`（最灵活）/ `gr.ChatInterface`（对话专用）
- 核心组件：Textbox / Image / Audio / Video / Chatbot / Slider / Dropdown / Checkbox / DataFrame / File / Markdown / HTML
- 事件：`.click()` / `.submit()` / `.change()` / `.select()` / `.then()` / `gr.on()`
- 流式：函数写成 generator，逐 yield 推送增量
- 布局：`gr.Row` / `gr.Column` / `gr.Tab` / `gr.Accordion` / `gr.Group`
- 状态：`gr.State`（跨事件共享）/ 函数参数 history（对话历史）
- 部署：Hugging Face Spaces（git push 上线）/ 自建（`demo.launch()` + 反代）
- 队列：`demo.queue()` 启用排队（处理长耗时推理，防超时）
- 主题：`gr.themes.Soft()` / `Monochrome()` / 自定义

## Gradio 是什么

Gradio 是**把 Python 函数秒变 Web UI** 的框架。与 Streamlit / Dash / Voila 对比：

| 维度 | Gradio | Streamlit | Dash | Voila |
|---|---|---|---|---|
| 目标 | **ML demo**（最快） | 数据应用 | 仪表板 | notebook 转应用 |
| 起界面速度 | **三行**（Interface） | 十几行 | 几十行 | notebook 即应用 |
| ML 组件 | **内置 Image/Audio/Chatbot** | 弱 | 需自己写 | 弱 |
| 流式 | **generator 原生** | 较弱 | 一般 | 弱 |
| 部署生态 | **Hugging Face Spaces** | Streamlit Cloud | Dash Enterprise | Binder |
| 对话 UI | **gr.ChatInterface** | 需手写 | 需手写 | 无 |
| 灵活布局 | gr.Blocks | 中 | 强（React）| 弱 |

**核心结论**：Gradio = 「**ML 组件全 + 起 demo 快 + HF Spaces 部署**」，ML demo 首选；数据仪表板用 Streamlit；复杂定制用 Dash/Next.js。

## 安装与第一个界面

```bash
pip install --upgrade gradio
```

### gr.Interface —— 三行起界面

```python
import gradio as gr

def greet(name):
    return "Hello " + name + "!"

demo = gr.Interface(
    fn=greet,
    inputs="text",
    outputs="text",
)

demo.launch()
```

运行 `python app.py`，浏览器打开 `http://localhost:7860`。`inputs="text"` 是 `gr.Textbox()` 的字符串简写。组件也可以传对象以定制：

```python
demo = gr.Interface(
    fn=greet,
    inputs=gr.Textbox(label="名字", placeholder="输入你的名字"),
    outputs=gr.Textbox(label="问候"),
    title="问候生成器",
    description="输入名字得到问候",
)
```

### Interface 三核心参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `fn` | callable | 包装的 Python 函数（含模型推理）|
| `inputs` | str / Component / list | 输入组件；多个用 list |
| `outputs` | str / Component / list | 输出组件；多个用 list |

**inputs/outputs 数量要和 fn 参数/返回值数量匹配**。

### 多输入多输出

```python
def process(name, age, is_student):
    role = "学生" if is_student else "在职"
    return f"{name}，{age}岁，{role}", age * 365

demo = gr.Interface(
    fn=process,
    inputs=[
        gr.Textbox(label="姓名"),
        gr.Slider(0, 120, label="年龄"),
        gr.Checkbox(label="是否学生"),
    ],
    outputs=[
        gr.Textbox(label="简介"),
        gr.Number(label="出生天数"),
    ],
)
```

## 常用组件

### 文本类

```python
gr.Textbox(label="输入", lines=3, placeholder="...")
gr.TextArea(label="多行")           # 别名
gr.Code(label="代码", language="python")
gr.Markdown(value="**粗体**")        # 渲染 Markdown
gr.HTML(value="<b>原始HTML</b>")
```

### 数值与选择

```python
gr.Slider(0, 100, value=50, step=1, label="温度")
gr.Number(value=0, label="数量")
gr.Checkbox(label="同意", value=False)
gr.CheckboxGroup(["A","B","C"], label="多选")
gr.Radio(["低","中","高"], label="优先级")
gr.Dropdown(["cat","dog"], label="类别", multiselect=False)
```

### 媒体类

```python
gr.Image(label="图片", type="filepath")   # 返回路径/PIL/numpy
gr.Image(sources=["upload", "webcam"])    # 上传/摄像头
gr.Audio(sources=["microphone"], type="filepath")
gr.Video(label="视频")
gr.File(label="任意文件")
gr.Gallery(label="图片网格")               # 多图
```

`Image` 的 `type` 参数决定 fn 收到什么：`"filepath"`（路径）/ `"pil"`（PIL 对象）/ `"numpy"`（ndarray）。

### 数据类

```python
import pandas as pd
gr.Dataframe(value=pd.DataFrame({...}), label="表格")
gr.JSON(value={"k":"v"}, label="JSON")
gr.Chatbot(label="对话", type="messages")  # 消息列表
```

### 状态与展示

```python
gr.State(value=[])              # 跨事件共享状态
gr.Plot(label="图表")           # matplotlib/plotly
gr.HighlightedText(label="高亮")
gr.Model3D(label="3D 模型")
```

## gr.Blocks —— 灵活布局

Interface 够快但不够灵活。复杂界面用 `gr.Blocks` 上下文管理器：

```python
import gradio as gr

with gr.Blocks() as demo:
    gr.Markdown("# 图像分类器")
    with gr.Row():                      # 横排
        with gr.Column():               # 竖排
            inp = gr.Image(label="图片")
            btn = gr.Button("预测")
        with gr.Column():
            out = gr.Label(label="结果")
            prob = gr.Textbox(label="概率")

    # 事件绑定
    btn.click(fn=predict, inputs=inp, outputs=[out, prob])

demo.launch()
```

### 布局组件

| 组件 | 用途 |
|---|---|
| `gr.Row` | 横排子组件 |
| `gr.Column` | 竖排子组件（可设 scale）|
| `gr.Tab` / `gr.Tabs` | 标签页切换 |
| `gr.Accordion` | 折叠面板（默认收起）|
| `gr.Group` | 无边距分组 |
| `gr.Box` | 带边框分组 |

```python
with gr.Blocks() as demo:
    with gr.Tabs():
        with gr.Tab("分类"):
            ...
        with gr.Tab("检测"):
            ...
        with gr.Tab("分割"):
            ...
```

## 事件系统

事件监听器把组件变化绑定到函数。

### 主要事件

| 事件 | 触发 | 典型组件 |
|---|---|---|
| `.click()` | 点击 | Button |
| `.submit()` | 回车提交 | Textbox |
| `.change()` | 值变化 | 大多数组件 |
| `.input()` | 输入（实时）| Textbox/Slider |
| `.select()` | 选中项 | Dropdown/Radio/Gallery |
| `.upload()` | 上传完成 | File/Image |
| `.play()` / `.stop()` | 播放控制 | Audio/Video |
| `.then()` | 上一个事件完成后链式 | 任意 |

### 装饰器写法

```python
with gr.Blocks() as demo:
    name = gr.Textbox(label="名字")
    out = gr.Textbox(label="输出")
    btn = gr.Button("打招呼")

    @btn.click(inputs=name, outputs=out)   # 装饰器自动绑定
    def greet(name):
        return "Hi " + name
```

### 多输入输出（dict 跳过部分输出）

```python
with gr.Blocks() as demo:
    food = gr.Number(value=10)
    status = gr.Textbox()

    def eat(food_val):
        if food_val > 0:
            return {food: food_val - 1, status: "饱"}   # 更新两个
        return {status: "饿"}                            # 跳过 food

    gr.Button("吃").click(fn=eat, inputs=food, outputs=[food, status])
```

dict 形式的 outputs 允许只更新部分组件，其余保持不变。

### gr.on —— 多触发器

```python
with gr.Blocks() as demo:
    name = gr.Textbox()
    out = gr.Textbox()
    btn = gr.Button()

    @gr.on(triggers=[name.submit, btn.click], inputs=name, outputs=out)
    def greet(name):
        return "Hi " + name
```

省略 triggers 时自动绑定到所有输入组件的 change 事件。

### .then() 链式

```python
with gr.Blocks() as demo:
    chatbot = gr.Chatbot()
    msg = gr.Textbox()

    msg.submit(user_fn, [msg, chatbot], [msg, chatbot]).then(
        bot_fn, chatbot, chatbot
    )
```

第一个事件（user_fn）完成后自动触发第二个（bot_fn）。

## 流式输出（generator）

函数写成 generator，逐 `yield` 推送增量到前端。LLM token 流、图像逐帧生成都适用。

```python
import gradio as gr
import time

def stream_greet(name):
    full = f"你好，{name}！欢迎来到 Gradio。"
    result = ""
    for char in full:
        result += char
        time.sleep(0.05)
        yield result           # 每次返回累积结果，前端实时更新

gr.Interface(fn=stream_greet, inputs="text", outputs="text").launch()
```

### Chatbot 流式

```python
with gr.Blocks() as demo:
    chatbot = gr.Chatbot(type="messages")
    msg = gr.Textbox()

    def respond(message, history):
        history = history + [{"role": "user", "content": message}]
        response = ""
        for token in my_llm.stream(message):
            response += token
            yield history + [{"role": "assistant", "content": response}]

    msg.submit(respond, [msg, chatbot], chatbot)

demo.launch()
```

每次 yield 整个更新后的 history，Gradio 自动 diff 推送。

## gr.ChatInterface —— 对话专用

一键生成 ChatGPT 式 UI（消息历史、流式、重试、清空、多轮）：

```python
import gradio as gr

def chat(message, history):
    # message 是当前用户输入，history 是对话历史
    return my_model.generate(message, history)

gr.ChatInterface(fn=chat).launch()
```

支持流式（fn 写成 generator）、system message、额外输入组件（如上传图片）：

```python
gr.ChatInterface(
    fn=vision_chat,
    multimodal=True,                    # 允许上传图片
    title="视觉对话",
    additional_inputs=[gr.Textbox("你是助手", label="system")],
)
```

## 启动与分享

```python
demo.launch()                              # 本地 127.0.0.1:7860
demo.launch(server_name="0.0.0.0")         # 监听所有网卡
demo.launch(server_port=8080)              # 改端口
demo.launch(share=True)                    # 生成 *.gradio.live 临时公网链接
demo.launch(auth=("user","pass"))          # 加登录
demo.queue().launch()                      # 启用队列（长耗时推理必加）
```

## 部署到 Hugging Face Spaces

HF Spaces 是 Gradio 的天然归宿：

```bash
# 1. 在 huggingface.co/new-space 创建 Space，选 Gradio SDK
# 2. 仓库结构：
#    app.py          ← 你的 Gradio 代码
#    requirements.txt ← 依赖
#    README.md       ← 含 YAML front matter
# 3. git push 即上线
```

README.md front matter：

```yaml
---
title: My Image Classifier
emoji: 🖼️
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: "5.0"
app_file: app.py
pinned: false
---
```

## 下一步

入门到此——你已经能起界面、用组件、绑事件、流式输出、部署。下一章 `guide-line.md` 深入讲 **Blocks 高级布局 / 事件进阶 / State 与会话 / 流式技巧 / 自定义主题与 CSS / 性能与队列 / 与 HF 生态集成 / 生产化注意**。
