---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTMX 2.0.x 编写

## 速查

- 浏览器要求：HTMX 2.x **不再支持 IE11**（需 IE11 用 1.x 或 `htmx-1-compat` 扩展）
- 接入方式：
  - **CDN**：`<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js">`（开箱即用）
  - **npm**：`npm install htmx.org@2.0.10`（构建工具中 import）
- 体积：~14 KB（gzip）
- 核心：HTML 属性触发 AJAX → 服务端返回 HTML 片段 → 局部替换 DOM
- 必备属性：`hx-get` / `hx-post` / `hx-put` / `hx-patch` / `hx-delete`
- 目标与位置：`hx-target` + `hx-swap`
- 触发：`hx-trigger`（默认 form 是 submit，输入是 change，其他是 click）
- 表单数据：自动收集；扩展用 `hx-vals` / `hx-include` / `hx-encoding`
- URL 更新：`hx-push-url="true"` / `hx-replace-url="true"`
- 验证：`hx-confirm` / `hx-prompt` / 4xx-5xx 默认不交换（用 response-targets 扩展定制）
- 扩展：`hx-ext="response-targets,sse,ws,preload"` 启用
- 实时：`ws` / `sse` 扩展
- 与 Alpine.js 配合：HTMX 处理服务端通信 + Alpine 处理客户端状态
- 调试：`htmx.logAll()`

## HTMX 是「hypermedia 驱动」不是「SPA」

理解 HTMX 的关键定位差异——**前端不持有应用状态**：

| 维度 | HTMX | React / Vue SPA | Hotwire Turbo |
|---|---|---|---|
| 数据载体 | HTML 片段 | JSON | HTML 片段 |
| 应用状态 | 服务端 + URL | 客户端 store | 服务端 + URL |
| 路由 | 浏览器原生 + `hx-push-url` | client router | Turbo Drive |
| 渲染层 | 后端模板（Jinja/ERB/Blade） | 前端组件（JSX/SFC） | 后端模板 |
| 体积 | ~14 KB | 50-200 KB | ~40 KB |
| 构建 | 无 | Vite/Webpack | 通常配合 Rails |
| 类型同步 | 不需要 | 需要 OpenAPI / tRPC | 不需要 |
| 学习曲线 | 平缓（懂 HTML 即可） | 陡（JSX / hooks / state） | 平缓 |
| 心智 | 服务端为权威 | 客户端为权威 | 服务端为权威 |

**含义**：

- HTMX 不是「SPA 替代品」也不是「JSON+React 的丑陋后退」——它是**重新让 HTML 成为协议**的尝试
- 服务端永远是「**当前真相**」，前端只是渲染窗口；状态管理 = 数据库 + URL
- 与 Rails Turbo / Phoenix LiveView 路线接近，但 HTMX 是**框架无关**的——任何能输出 HTML 的后端都可以用
- 复杂度从「前端 SPA + JSON API + 状态同步」三层压回「**后端 + HTML**」一层

## 安装

### 推荐路径 A：CDN（最快上手）

```html
<!DOCTYPE html>
<html>
<head>
  <title>HTMX Demo</title>
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"></script>
</head>
<body>
  <button hx-get="/hello" hx-target="#result" hx-swap="innerHTML">
    Click me
  </button>
  <div id="result"></div>
</body>
</html>
```

服务端只要在 `/hello` 返回一段 HTML（如 `<p>Hello, world!</p>`），点击按钮后 `#result` 就会被替换。**整个流程无需写一行 JavaScript**。

::: tip 生产环境锁版本
CDN 用法务必锁版本号（`htmx.org@2.0.10`），避免主版本升级 breaking change 打挂线上。
:::

### 推荐路径 B：npm + 构建工具

```bash
npm install htmx.org@2.0.10
# 或
pnpm add htmx.org@2.0.10
```

```js
// main.js
import 'htmx.org'

// 如需访问全局 API
import htmx from 'htmx.org'
window.htmx = htmx
```

::: warning Webpack 全局变量
Webpack 默认不暴露 `htmx` 全局，HTMX 的 `htmx:*` 事件 / `hx-on:*` 内联脚本会依赖它，需要：

```js
// webpack.config.js
plugins: [new webpack.ProvidePlugin({ htmx: 'htmx.org' })]
```
:::

## 第一个交互：动态更新

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"></script>
</head>
<body>
  <h1>Counter</h1>
  <div id="counter">
    <span id="value">0</span>
    <button hx-post="/increment" hx-target="#value" hx-swap="innerHTML">+1</button>
  </div>
</body>
</html>
```

```js
// server.js (Express)
import express from 'express'
const app = express()

let count = 0
app.post('/increment', (req, res) => {
  count++
  res.send(`${count}`)   // 返回数字字符串，innerHTML 替换 #value
})

app.get('/', (req, res) => res.sendFile('index.html'))
app.listen(3000)
```

**关键点**：

1. 服务端**不返回 JSON**——返回纯字符串/HTML 片段
2. 客户端**不写 JavaScript**——所有交互都是 HTML 属性
3. 状态（count）在服务端，前端只是渲染

## 项目结构

HTMX 不强制项目结构——**它只在前端模板里加属性**，结构完全跟随后端框架。以 Django 为例：

```
my-django-app/
├── templates/
│   ├── base.html              # 引入 htmx.min.js
│   ├── todo_list.html         # 完整页面（含 base.html include）
│   └── partials/              # HTMX 用的 HTML 片段
│       ├── todo_item.html
│       ├── todo_form.html
│       └── todo_count.html
├── todos/
│   ├── models.py
│   ├── urls.py
│   └── views.py               # 区分 request.htmx 返回不同模板
├── static/
│   └── htmx.min.js
└── manage.py
```

**核心约定**：

- 全页路由（`/todos/`）返回 `todo_list.html`（完整 base + 页面）
- HTMX 局部路由（`/todos/<id>/toggle/`）返回 `partials/todo_item.html`（只一个 `<li>`）
- 通过请求头 `HX-Request: true` 区分两种调用方式

Rails / Laravel / FastAPI / Express 类似——HTMX 不约束结构，**复用后端原生的 partials/views 即可**。

## Django 完整示例

```python
# views.py
def todo_list(request):
    todos = Todo.objects.all()
    if request.headers.get('HX-Request'):
        return render(request, 'partials/todo_list.html', {'todos': todos})
    return render(request, 'todo_list.html', {'todos': todos})

def toggle_todo(request, pk):
    todo = Todo.objects.get(pk=pk)
    todo.done = not todo.done
    todo.save()
    return render(request, 'partials/todo_item.html', {'todo': todo})
```

```html
<!-- todo_list.html -->
{% extends "base.html" %}
{% block content %}
<ul id="todos">
  {% for todo in todos %}{% include "partials/todo_item.html" %}{% endfor %}
</ul>
<form hx-post="{% url 'add_todo' %}" hx-target="#todos" hx-swap="beforeend">
  <input name="title" required>
  <button>Add</button>
</form>
{% endblock %}
```

```html
<!-- partials/todo_item.html -->
<li id="todo-{{ todo.id }}" class="{% if todo.done %}done{% endif %}">
  <input type="checkbox"
         hx-post="{% url 'toggle_todo' todo.id %}"
         hx-target="#todo-{{ todo.id }}"
         hx-swap="outerHTML"
         {% if todo.done %}checked{% endif %}>
  {{ todo.title }}
</li>
```

## HTMX 核心：5 个 HTTP 动词属性

```html
<!-- GET：读 -->
<button hx-get="/users">Load users</button>

<!-- POST：创建 -->
<form hx-post="/users">...</form>

<!-- PUT：整体更新 -->
<button hx-put="/users/1">Replace</button>

<!-- PATCH：部分更新 -->
<button hx-patch="/users/1">Update name</button>

<!-- DELETE：删除 -->
<button hx-delete="/users/1">Delete</button>
```

::: tip 默认触发事件
- `<form>` 元素：默认 `submit`
- 输入框（`<input>` / `<textarea>` / `<select>`）：默认 `change`
- 其他元素：默认 `click`

修改默认行为用 `hx-trigger`。
:::

## hx-target + hx-swap：替换位置和方式

```html
<!-- 替换 #result 内部 -->
<button hx-get="/foo" hx-target="#result" hx-swap="innerHTML">Click</button>

<!-- 替换最近的父级 li -->
<button hx-get="/foo" hx-target="closest li" hx-swap="outerHTML">Click</button>

<!-- 列表追加 -->
<button hx-post="/items" hx-target="#list" hx-swap="beforeend">Add</button>

<!-- 删除自身 -->
<button hx-delete="/items/1" hx-target="closest li" hx-swap="delete">×</button>
```

8 种 swap 值：`innerHTML`（默认） / `outerHTML` / `textContent` / `beforebegin` / `afterbegin` / `beforeend` / `afterend` / `delete` / `none`。

详细使用见 [指南](./guide-line)。

## hx-trigger：触发器

```html
<!-- 鼠标悬停 -->
<div hx-get="/preview" hx-trigger="mouseenter"></div>

<!-- 元素加载时 -->
<div hx-get="/init" hx-trigger="load"></div>

<!-- 滚动到可视区域 -->
<div hx-get="/more" hx-trigger="revealed"></div>

<!-- 轮询：每 2 秒触发 -->
<div hx-get="/stats" hx-trigger="every 2s"></div>

<!-- 防抖搜索 -->
<input hx-get="/search" hx-trigger="keyup changed delay:500ms" name="q">
```

完整修饰符列表：`once` / `changed` / `delay:Xs` / `throttle:Xs` / `from:selector` / `consume` 等，见[指南](./guide-line) 和 [参考](./reference)。

## 表单与数据

### 表单自动收集

```html
<form hx-post="/login">
  <input name="email" type="email">
  <input name="password" type="password">
  <button>Login</button>
</form>
<!-- POST /login  body: email=xxx&password=xxx -->
```

### hx-vals / hx-include / hx-encoding

```html
<!-- 附加值 -->
<button hx-post="/track" hx-vals='{"source": "header"}'>Track</button>

<!-- 跨表单收集 -->
<input id="q" name="q">
<button hx-get="/search" hx-include="#q" hx-target="#list">Search</button>

<!-- 文件上传 -->
<form hx-post="/upload" hx-encoding="multipart/form-data">
  <input type="file" name="file">
  <button>Upload</button>
</form>
```

## URL 导航

```html
<!-- 点击后地址栏变为 /profile/123 -->
<button hx-get="/profile/123"
        hx-target="#main"
        hx-push-url="true">Profile</button>
```

::: tip 服务端配合
当用户**直接访问** `/profile/123` 或刷新页面时，服务端必须能返回完整页面（含外壳），通过 `HX-Request` 请求头区分。
:::

## 错误处理

HTMX **默认不交换 4xx/5xx 响应**——只触发 `htmx:responseError` 事件。处理错误用 `response-targets` 扩展：

```html
<body hx-ext="response-targets">
  <button hx-post="/login"
          hx-target="#result"
          hx-target-4xx="#error">Login</button>
  <div id="result"></div>
  <div id="error"></div>
</body>
```

`hx-confirm` / `hx-prompt` 用于确认 / 输入：

```html
<button hx-delete="/users/1" hx-confirm="确定删除？">Delete</button>
<button hx-post="/comments" hx-prompt="评论：">Add</button>
```

## 启用扩展

```html
<!-- 引入扩展 -->
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"></script>
<script src="https://unpkg.com/htmx-ext-response-targets@2.0.0"></script>
<script src="https://unpkg.com/htmx-ext-sse@2.2.2"></script>

<!-- body 上启用，子元素继承 -->
<body hx-ext="response-targets, sse">
  ...
</body>
```

## 调试

```js
htmx.logAll()   // 控制台打印所有 HTMX 事件
```

HTMX 请求带 `HX-Request: true` 请求头——浏览器 DevTools Network 过滤即可。

## 与 Alpine.js 配合

HTMX 处理服务端通信，Alpine 处理客户端状态：

```html
<script src="https://unpkg.com/alpinejs" defer></script>
<script src="https://unpkg.com/htmx.org@2.0.10"></script>

<div x-data="{ open: false }">
  <button @click="open = !open">Toggle menu</button>
  <ul x-show="open">
    <li hx-get="/profile" hx-target="#main">Profile</li>
  </ul>
</div>
```

**简单原则**：

- 涉及**服务端往返** → HTMX
- 涉及**仅前端状态**（弹窗 / 折叠 / 主题切换） → Alpine

## 下一步

- [指南](./guide-line) - 深入 HTMX 各属性、扩展、HATEOAS 设计、与各后端集成
- [参考](./reference) - 完整 hx-* 属性 / CSS class / 请求头 / 响应头 / 事件 / JS API 速查
- [Hypermedia Systems 书](https://hypermedia.systems/) - Carson Gross 系统化讲述 hypermedia / HATEOAS 工程哲学
