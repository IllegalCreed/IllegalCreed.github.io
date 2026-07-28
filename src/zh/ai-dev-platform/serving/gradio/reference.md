---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gradio 官方文档编写 —— 三大入口类 / 组件全表 / 事件 / 布局 / 流式 / launch 参数 / 部署

## 三大入口类对照

| 类 | 定位 | 复杂度 | 适用 |
|---|---|---|---|
| `gr.Interface` | 最快，三行起界面 | 低 | 单函数 demo、教学 |
| `gr.Blocks` | 最灵活，自由布局 | 中高 | 复杂多组件联动、定制 UI |
| `gr.ChatInterface` | 对话专用 | 低 | LLM 对话、客服 |

### `gr.Interface` 签名

```python
gr.Interface(
    fn,                          # 包装函数
    inputs,                      # str / Component / list
    outputs,                     # str / Component / list
    examples=None,               # 示例列表
    title=None,                  # 标题
    description=None,            # 描述
    article=None,                # 底部 Markdown
    theme=None,                  # 主题
    live=False,                  # 输入变化自动执行（无需点按钮）
    allow_flagging="never",      # never / auto / manual
    cache_examples=False,        # 预算示例结果
    api_name="predict",          # API 端点名
    concurrency_limit=None,      # 并发
)
```

### `gr.Blocks` 签名

```python
gr.Blocks(
    title=None,
    theme=None,
    analytics_enabled=True,
    css=None,
    js=None,                     # 前端 JS
    delete_cache=None,           # (age, size) 清理缓存
)
```

### `gr.ChatInterface` 签名

```python
gr.ChatInterface(
    fn,                          # 对话函数
    multimodal=False,            # 允许上传图片
    type="tuples",               # tuples / messages
    additional_inputs=None,      # 额外输入（如 system prompt）
    additional_inputs_accordion=None,
    examples=None,
    title=None,
    description=None,
    chatbot=None,                # 自定义 Chatbot 组件
    retry_btn="Retry",           # 重试按钮
    undo_btn="Undo",
    clear_btn="Clear",
    concurrency_limit=None,
)
```

## 组件全表

### 输入输出通用

| 组件 | 简写 | 用途 |
|---|---|---|
| `gr.Textbox` | `"text"` | 文本 |
| `gr.Number` | `"number"` | 数值 |
| `gr.Slider` | `"slider"` | 滑块 |
| `gr.Checkbox` | `"checkbox"` | 复选 |
| `gr.CheckboxGroup` | `"checkboxgroup"` | 多选 |
| `gr.Radio` | `"radio"` | 单选 |
| `gr.Dropdown` | `"dropdown"` | 下拉 |
| `gr.TextArea` | - | 多行文本 |
| `gr.Code` | - | 代码 |
| `gr.ColorPicker` | `"colorpicker"` | 取色 |
| `gr.Dataframe` | `"dataframe"` | 表格 |
| `gr.File` | `"file"` | 文件 |
| `gr.JSON` | `"json"` | JSON |
| `gr.State` | `"state"` | 状态 |

### 媒体

| 组件 | 简写 | type 取值 |
|---|---|---|
| `gr.Image` | `"image"` | filepath / pil / numpy |
| `gr.Audio` | `"audio"` | filepath / numpy |
| `gr.Video` | `"video"` | filepath |
| `gr.Gallery` | `"gallery"` | - |
| `gr.Model3D` | `"model3d"` | - |
| `gr.Plot` | - | matplotlib/plotly/altair |
| `gr.ImageSlider` | - | 图像对比 |

### 展示

| 组件 | 用途 |
|---|---|
| `gr.Markdown` | 渲染 Markdown |
| `gr.HTML` | 原始 HTML |
| `gr.HighlightedText` | 高亮文本 |
| `gr.Label` | 分类标签 + 概率 |
| `gr.Chatbot` | 对话气泡 |
| `gr.ChatMessage` | 单条消息（type="messages"）|
| `gr.Image` | 图片 |
| `gr.AnnotatedImage` | 带标注图 |

### 布局与控制

| 组件 | 用途 |
|---|---|
| `gr.Row` | 横排 |
| `gr.Column` | 竖排 |
| `gr.Tabs` / `gr.Tab` | 标签页 |
| `gr.Accordion` | 折叠面板 |
| `gr.Group` | 紧凑分组 |
| `gr.Box` | 边框分组 |
| `gr.Button` | 按钮 |
| `gr.Link` | 链接 |
| `gr.LoginButton` | HF 登录按钮 |

## 事件全表

| 事件 | 触发 | 典型组件 |
|---|---|---|
| `.click()` | 点击 | Button |
| `.submit()` | 回车 | Textbox |
| `.change()` | 值变化 | 大多数 |
| `.input()` | 实时输入 | Textbox/Slider |
| `.select()` | 选中项 | Dropdown/Radio/Gallery/Dataset |
| `.upload()` | 上传完成 | File/Image/Audio |
| `.play()` / `.stop()` | 播放控制 | Audio/Video |
| `.clear()` | 清空 | Chatbot |
| `.like()` | 点赞 | Chatbot |
| `.then()` | 上一个完成后 | 任意（链式）|
| `.success()` / `.error()` | 成功/失败回调 | 任意 |
| `gr.on()` | 多触发器 | 任意 |

### 事件通用参数

| 参数 | 说明 |
|---|---|
| `fn` | 绑定函数 |
| `inputs` / `outputs` | 组件或 list |
| `trigger_mode` | once / multiple / always_last |
| `concurrency_limit` | 并发上限 |
| `concurrency_id` | 共享并发池 |
| `every` | 定时触发（秒）|
| `show_progress` | full / hidden / minimal |
| `show_api` | 是否暴露 API |
| `cancels` | 取消其他事件 |
| `preprocess` / `postprocess` | 是否预处理（API 模式）|
| `scroll_output` | 是否自动滚动 |
| `js` | 前端 JS 代码 |

## launch 参数全表

| 参数 | 默认 | 说明 |
|---|---|---|
| `inline` | None | 在 notebook 内联 |
| `inbrowser` | False | 自动开浏览器 |
| `share` | False | 生成 *.gradio.live 临时公网 |
| `debug` | False | 调试模式 |
| `auth` | None | (user,pass) 或回调 |
| `auth_message` | None | 登录提示 |
| `prevent_thread_lock` | False | 不阻塞主线程 |
| `server_name` | 127.0.0.1 | 监听 IP |
| `server_port` | 7860 | 端口 |
| `height` | None | 嵌入高度 |
| `width` | None | 嵌入宽度 |
| `favicon_path` | None | favicon |
| `ssl_keyfile` / `ssl_certfile` | None | HTTPS |
| `ssl_verify` | True | 校验 SSL |
| `allowed_paths` | None | 允许访问的本地路径 |
| `blocked_paths` | None | 禁止访问路径 |
| `app_kwargs` | None | FastAPI 额外参数 |
| `mcp_server` | False | 启用 MCP server |

## queue 参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `max_size` | None | 队列最大长度 |
| `default_concurrency_limit` | auto | 默认并发 |
| `api_open` | True | 队列 API 开放 |
| `max_threads` | 40 | 处理线程 |
| `status_rate` | auto | 状态更新频率 |

## Image 组件 type

| type | fn 收到 | 适用 |
|---|---|---|
| `"filepath"` | 文件路径字符串 | 通用，传给 CLI |
| `"pil"` | PIL.Image 对象 | PIL 处理 |
| `"numpy"` | numpy ndarray | CV 计算 |

## Chatbot type（重要）

| type | history 形式 | 推荐 |
|---|---|---|
| `"tuples"`（旧默认） | `[[user, assistant], ...]` 列表对 | 旧代码 |
| `"messages"`（新） | `[{"role":"user","content":...}, ...]` | **新代码推荐** |

```python
gr.Chatbot(type="messages")   # 显式推荐 messages
```

## HF Spaces 部署模板

```
my-space/
├── README.md          # YAML front matter
├── app.py             # Gradio 代码
├── requirements.txt   # 依赖
└── packages/          # 离线包（可选）
```

README.md：

```yaml
---
title: My Demo
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: "5.0"
app_file: app.py
pinned: false
license: mit
---
```

硬件升级（免费 CPU → 付费 GPU）：Space Settings → Hardware。

## gradio_client 速查

```python
from gradio_client import Client

# 连本地
client = Client("http://localhost:7860/")

# 连 HF Space
client = Client("user/space-name", hf_token="hf_xxx")

# 调用
result = client.predict(input, api_name="/predict")

# 流式
for chunk in client.submit(input).tuples():
    print(chunk)

# 查看 API 信息
client.view_api(return_format="dict")
```

## 主题预设

```python
gr.themes.Default()
gr.themes.Soft()
gr.themes.Monochrome()
gr.themes.Glass()
gr.themes.Origin()       # 复古
```

自定义：

```python
gr.themes.Soft(
    primary_hue="emerald",      # 任何 Tailwind 颜色名
    secondary_hue="sky",
    neutral_hue="zinc",
    font=[gr.themes.GoogleFont("Noto Sans SC"), "ui-sans-serif"],
    radius_size="lg",
)
```

## 参考

- 官方文档：<https://www.gradio.app/>
- Quickstart：<https://www.gradio.app/guides/quickstart>
- Blocks & Events：<https://www.gradio.app/guides/blocks-and-event-listeners>
- 组件大全：<https://www.gradio.app/docs>
- HF Spaces 部署：<https://huggingface.co/docs/hub/spaces-sdks-gradio>
- GitHub：<https://github.com/gradio-app/gradio>
