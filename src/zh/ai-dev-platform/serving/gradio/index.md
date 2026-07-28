---
layout: doc
---

# Gradio

Hugging Face 维护的**Python 快速 ML Demo UI 框架**——让 ML 工程师几行代码就能为模型搭一个可交互的 Web 界面，无需写 HTML/CSS/JS。Gradio 的核心抽象是「**Python 函数 → Web 组件 → 事件绑定**」：用 `gr.Interface(fn, inputs, outputs)` 三行就能把任意 Python 函数（含模型推理）包装成带输入框、按钮、输出区的网页；复杂布局用 `gr.Blocks` 上下文管理器灵活组合组件与事件。内置 30+ 组件覆盖 ML 常见输入输出形态——`Textbox`（文本）、`Image`（图像）、`Audio`（音频）、`Video`、`Chatbot`（对话）、`DataFrame`、`Slider`、`File`、`Markdown` 等，自动处理前端的文件上传、媒体编解码、类型转换。事件系统（`.click()` / `.submit()` / `.change()` / `.then()`）支持多组件联动、流式输出（generator 函数逐 token 推送）、多步骤链式调用。`gr.ChatInterface` 专为一问一答的对话型应用设计，几行实现 ChatGPT 式 UI。一键 `demo.launch(share=True)` 生成临时公网链接，或免费部署到 **Hugging Face Spaces**（Gradio 的天然归宿，全球 ML demo 的聚集地）。是模型 demo、内部演示、黑客松、教学的首选工具。

## 评价

**优点**

- **三行起界面**：`gr.Interface(fn, inputs, outputs)` 把任意 Python 函数秒变 Web UI，无需前端知识；ML 工程师最低成本的「让模型被人用上」方式
- **30+ 内置组件**：Textbox/Image/Audio/Video/Chatbot/DataFrame/Slider/Checkbox/HTML/Markdown/ColorPicker 等，自动处理文件上传、媒体编解码、类型转换，覆盖 ML 常见输入输出
- **gr.Blocks 灵活布局**：上下文管理器 + `gr.Row`/`gr.Column`/`gr.Tab` 自由排版，支持复杂多组件联动、表单、向导式界面；比 Interface 灵活十倍
- **事件系统强大**：`.click()` / `.submit()` / `.change()` / `.then()` / `gr.on()` 绑定函数；支持多输入输出（list/dict）、链式调用、generator 流式输出
- **流式输出原生支持**：函数写成 generator 逐 yield，Gradio 自动推送增量到前端；LLM token 流、图像逐帧生成都能丝滑呈现
- **ChatInterface 一键对话**：`gr.ChatInterface(fn)` 几行实现 ChatGPT 式 UI（消息历史、流式、重试、清空），对话型应用首选
- **Hugging Face Spaces 免费部署**：Gradio 的天然归宿，git push 即上线，全球 ML demo 聚集地，自带社区与分享生态
- **share=True 临时公网**：`demo.launch(share=True)` 生成 `*.gradio.live` 临时链接，本地 demo 秒变可分享，无需部署

**缺点**

- **不适合生产级应用**：定位是 demo / 原型，缺生产特性（鉴权、限流、监控、水平扩展）；要生产化需迁移到 Streamlit/Next.js + 后端 API
- **定制 UI 受限**：组件样式与布局在 Gradio 抽象内，深度定制（复杂 CSS/动效/自定义组件）不如纯前端框架灵活
- **Python 后端耦合**：界面逻辑与 Python 后端紧绑，前后端分离架构不友好；要 API 化需额外封装
- **并发能力弱**：默认单进程处理请求（queue 模式有限并发），高并发 demo 在 Spaces 易排队；不适合做面向公众的高 QPS 服务
- **首次加载资源重**：前端打包了 React + 大量组件，首屏 JS 体积大；冷启动慢
- **复杂状态管理繁琐**：`gr.State` 是全局共享，多用户并发会串状态；要 session 隔离得用 session_id 手动管理，心智成本高
- **调试反馈慢**：改代码需重启 demo（虽有 reload），不像前端 HMR 流畅；事件绑定错误信息有时不直观

## 文档地址

[Gradio Documentation](https://www.gradio.app/)

## GitHub 地址

[gradio-app/gradio](https://github.com/gradio-app/gradio)

## 幻灯片地址

<a href="/SlideStack/gradio-slide/" target="_blank">Gradio</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Gradio" target="_blank" rel="noopener noreferrer">Gradio 测试题</a>
