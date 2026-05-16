---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 HTMX 2.0.x 编写 —— 核心属性 / 触发器 / 替换策略 / 表单 / 历史导航 / 错误 / 扩展生态 / WebSocket / SSE / 与 Alpine 配合 / Hotwire 对比 / Idiomorph / 后端集成 / 测试 / 性能

## hypermedia 与 HATEOAS 复兴

理解 HTMX 必须先理解它的哲学定位——**HTML 自身就是「应用状态引擎」**。

### REST 与 HATEOAS 原意

Roy Fielding 2000 年博士论文里定义的 REST 包含 6 个约束，其中最有争议的是 **HATEOAS**（Hypermedia As The Engine Of Application State）：

> "REST is defined by four interface constraints: identification of resources; manipulation of resources through representations; **self-descriptive messages**; and, **hypermedia as the engine of application state**."

HATEOAS 要求：客户端只需要从服务端响应里**就能知道下一步能做什么**——不需要查 API 文档、不需要预先知道 endpoint。这在 HTML 里是天然的：

- `<a href="/profile">` 告诉客户端「**可以去 profile 页**」——是动作、是 URL、是 transition
- `<form action="/login" method="POST">` 告诉客户端「**可以 POST 到 /login**」+ 字段
- 服务端响应里**有这些链接 + 表单就代表能做**，没有就不能做

### JSON API 失去 HATEOAS

业界主流的 JSON API 范式（如 `GET /users/1` → `{ "id": 1, "name": "Alice" }`）**抛弃了 HATEOAS**：

```json
// JSON 响应：客户端不知道能做什么
{ "id": 1, "name": "Alice", "balance": -100 }
```

客户端必须**预先知道**：

- 余额负数时不能转账（要查文档）
- `/users/1/transfer` 是转账 endpoint（要查文档）
- 转账需要 `amount + target_user_id` 字段（要查文档）

这一切「文档」就是 OpenAPI / Swagger / GraphQL Schema / tRPC types——本质上是**用类型同步代替了 hypermedia 自描述**。

### HTML 版本：天然 HATEOAS

同样的余额场景，HTML 是这样的：

```html
<!-- 余额充足时 -->
<div>
  <span>余额：100</span>
  <form action="/transfer" method="POST">
    <input name="amount">
    <input name="target">
    <button>转账</button>
  </form>
</div>

<!-- 余额不足时 -->
<div>
  <span>余额：-100</span>
  <!-- 表单不存在，前端自然就不能转账 -->
</div>
```

客户端不需要文档：**有 form 就能转账，没有 form 就不能**。状态、可用动作、过渡条件全在一个 HTML 响应里。

### HTMX 的工程化贡献

Carson Gross 的 HTMX 论点是——**HATEOAS 不是被否决了，只是 HTML 表达力被低估了**。给 HTML 加 5 个 AJAX 属性（hx-get / hx-post / hx-put / hx-patch / hx-delete）+ 几个目标属性（hx-target / hx-swap），让浏览器原生就能处理「**局部更新 HTML**」，HATEOAS 立刻在工程层落地。

::: tip 思路转变
- SPA 心智：「**数据是状态，UI 是数据的函数**」
- HTMX 心智：「**HTML 就是状态，HTML 转换就是行为**」
:::

## HTMX 与同类技术对比

### vs SPA（React / Vue）

| 维度 | HTMX | React / Vue SPA |
|---|---|---|
| 数据载体 | HTML 片段 | JSON |
| 应用状态 | 服务端 + URL | 客户端 store |
| 类型同步 | 不需要 | OpenAPI / tRPC / GraphQL |
| 后端契合 | 任何 HTML 渲染框架 | API + 服务端 / BFF |
| 体积 | ~14 KB | 50-200 KB |
| 学习曲线 | 平缓 | 陡 |
| 离线能力 | 弱 | 强（PWA） |
| 复杂客户端交互 | 弱（拖拽 / 画布 / 协同） | 强 |

### vs Hotwire（Rails Turbo + Stimulus）

| 维度 | HTMX | Hotwire |
|---|---|---|
| 维护方 | Big Sky Software（Carson Gross） | 37signals（Basecamp / Rails） |
| 后端绑定 | 无（框架无关） | 偏向 Rails（也能用别的） |
| AJAX 模型 | 5 个 HTTP 动词属性 | Turbo Drive / Frames / Streams |
| WebSocket | 扩展（ws） | Turbo Streams（内置） |
| 客户端行为 | _hyperscript / Alpine | Stimulus（控制器范式） |
| HTMX 哲学 | hypermedia / HATEOAS | 服务端渲染 + 渐进增强 |

**何时选 Hotwire**：使用 Rails 全家桶、需要 Turbo Streams 服务端推送。
**何时选 HTMX**：使用非 Rails 后端（Django / Laravel / FastAPI / Express / ASP.NET）、需要框架无关方案。

### vs LiveView 类（Phoenix LiveView / Laravel Livewire / Blazor Server）

| 维度 | HTMX | LiveView |
|---|---|---|
| 协议 | 标准 HTTP | WebSocket（持续连接） |
| 服务端状态 | stateless（REST） | stateful（per-connection） |
| 网络要求 | 不需要常连 | 长连接 |
| 失联恢复 | 自然（HTTP 重试） | 需要 reconnect 协议 |
| 客户端体积 | ~14 KB | LiveView client ~50 KB |
| 扩展性 | 横向扩展简单 | 单连接服务端内存 |

**何时选 LiveView**：实时性要求极高、单页停留时间长、可接受 stateful 后端。
**何时选 HTMX**：常规 CRUD + 局部交互、希望保持 REST stateless。

## hx-get / hx-post / hx-put / hx-patch / hx-delete 全攻略

### 默认行为

5 个动词属性触发 AJAX 请求并交换响应：

```html
<!-- GET：默认 click 触发，innerHTML 替换自身 -->
<button hx-get="/users">Load</button>

<!-- POST：form 默认 submit 触发，innerHTML 替换 form -->
<form hx-post="/users">
  <input name="email">
  <button>Submit</button>
</form>

<!-- PUT：替换整体 -->
<button hx-put="/users/1">Replace user</button>

<!-- PATCH：部分更新 -->
<button hx-patch="/users/1">Update name</button>

<!-- DELETE：删除 -->
<button hx-delete="/users/1">Delete</button>
```

### 请求路径变量插值

HTMX 本身不做模板插值，但可以结合服务端模板：

```html
<!-- Django -->
<button hx-delete="{% url 'delete_user' user.id %}">Delete</button>

<!-- Rails -->
<button hx-delete="<%= user_path(user) %>">Delete</button>

<!-- Jinja2 / FastAPI -->
<button hx-delete="{{ url_for('delete_user', user_id=user.id) }}">Delete</button>
```

### 默认参数收集

| 动词 | 来源 |
|---|---|
| GET | form 内字段 → URL query string |
| POST/PUT/PATCH/DELETE | form 内字段 → request body（默认 `application/x-www-form-urlencoded`） |

HTMX **不会自动 JSON 序列化**——后端要么解析 form-urlencoded，要么用 `json-enc` 扩展。

### 自定义请求方法（hx-request）

```html
<!-- 自定义 timeout / credentials / noHeaders -->
<button hx-get="/x" hx-request='{"timeout": 5000, "credentials": true}'>
  Click
</button>
```

`hx-request` 支持的字段：`timeout`、`credentials`、`noHeaders`。

## hx-target 完整选择器语法

`hx-target` 接受**扩展 CSS 选择器**：

```html
<!-- 普通 CSS 选择器 -->
<button hx-get="/x" hx-target="#result">Click</button>
<button hx-get="/x" hx-target=".content">Click</button>
<button hx-get="/x" hx-target="body > main">Click</button>

<!-- 自身 -->
<button hx-get="/x" hx-target="this">Click</button>

<!-- 最近的祖先（向上找） -->
<button hx-get="/x" hx-target="closest li">Click</button>
<button hx-get="/x" hx-target="closest .card">Click</button>

<!-- 子树内查找（向下找） -->
<div>
  <button hx-get="/x" hx-target="find .preview">Click</button>
  <div class="preview"></div>
</div>

<!-- 兄弟（前向/后向） -->
<button hx-get="/x" hx-target="next .item">Click</button>
<button hx-get="/x" hx-target="previous .item">Click</button>

<!-- 全局选择器（root） -->
<button hx-get="/x" hx-target="global #app">Click</button>
```

### 继承

`hx-target` 会被子元素**自动继承**——除非用 `hx-disinherit="hx-target"` 阻止：

```html
<div hx-target="#result">
  <button hx-get="/x">替换 #result</button>  <!-- 继承 -->
  <button hx-get="/y">替换 #result</button>  <!-- 继承 -->
  <button hx-get="/z" hx-target="#other">替换 #other</button>  <!-- 覆盖 -->
  <div hx-disinherit="hx-target">
    <button hx-get="/a">替换自身（不继承）</button>
  </div>
</div>
```

## hx-swap 全部值与修饰符

### 8 种 swap 值

| 值 | 行为 | 典型场景 |
|---|---|---|
| `innerHTML`（默认） | 替换目标内部 | 替换列表内容、详情区域 |
| `outerHTML` | 替换整个目标元素 | 替换整张卡片、整个 row |
| `textContent` | 作为纯文本插入 | 防 XSS、显示用户输入 |
| `beforebegin` | 插入到目标前面 | 前置新元素 |
| `afterbegin` | 插入到目标内部最前 | 列表头部追加 |
| `beforeend` | 插入到目标内部最后 | 列表尾部追加（最常见） |
| `afterend` | 插入到目标后面 | 后置新元素 |
| `delete` | 删除目标（忽略响应） | 删除条目 |
| `none` | 不替换（但 OOB 仍生效） | 仅触发 OOB 更新 |

### swap 修饰符

```html
<!-- swap:延迟交换 -->
<button hx-get="/x" hx-swap="innerHTML swap:1s">Click</button>

<!-- settle:延迟结算（动画用） -->
<button hx-get="/x" hx-swap="innerHTML settle:500ms">Click</button>

<!-- transition:View Transitions API -->
<button hx-get="/x" hx-swap="innerHTML transition:true">Click</button>

<!-- ignoreTitle:不更新 document.title -->
<button hx-get="/x" hx-swap="innerHTML ignoreTitle:true">Click</button>

<!-- scroll:滚动到 top/bottom -->
<button hx-get="/x" hx-swap="innerHTML scroll:top">Click</button>
<button hx-get="/x" hx-swap="innerHTML scroll:bottom">Click</button>
<button hx-get="/x" hx-swap="innerHTML scroll:#anchor:top">Click</button>

<!-- show:确保元素可见 -->
<button hx-get="/x" hx-swap="innerHTML show:bottom">Click</button>

<!-- focus-scroll:输入聚焦时自动滚动 -->
<button hx-get="/x" hx-swap="innerHTML focus-scroll:true">Click</button>
```

可组合多个修饰符：

```html
<button hx-get="/x"
        hx-swap="innerHTML swap:500ms settle:1s scroll:top transition:true">
  Click
</button>
```

### Out-of-band swap

`hx-swap-oob` 让响应中的某个元素**额外**替换页面上的其他位置——超越 `hx-target` 限制：

```html
<!-- 客户端 -->
<button hx-post="/incr"
        hx-target="#counter"
        hx-swap="innerHTML">
  +1
</button>
<div id="counter">0</div>
<div id="message"></div>

<!-- 服务端响应 -->
<span>1</span>   <!-- 替换 #counter（主交换） -->
<div id="message" hx-swap-oob="true">已加 1</div>  <!-- OOB 额外替换 -->
```

OOB 可以指定 swap 策略：

```html
<div id="alerts" hx-swap-oob="beforeend">
  <p>新提醒</p>
</div>
```

::: tip OOB 必须有 id
OOB 元素必须有 `id` 属性才能被定位；HTMX 按 id 找到页面上同 id 元素并替换。
:::

## hx-trigger 全部修饰符

### 事件名

```html
<!-- 默认事件 -->
<button hx-get="/x">Click</button>  <!-- 默认 click -->
<form hx-post="/x">...</form>       <!-- 默认 submit -->
<input hx-get="/x" name="q">         <!-- 默认 change -->

<!-- 自定义事件名 -->
<div hx-get="/x" hx-trigger="mouseenter">Hover</div>
<div hx-get="/x" hx-trigger="keyup">Keyup</div>
<div hx-get="/x" hx-trigger="focus">Focus</div>
<div hx-get="/x" hx-trigger="contextmenu">Right-click</div>

<!-- 多个事件（逗号分隔） -->
<div hx-get="/x" hx-trigger="load, click, focus"></div>
```

### 特殊事件

| 事件 | 触发时机 |
|---|---|
| `load` | 元素首次进入 DOM 时（含 HTMX 交换插入） |
| `revealed` | 元素**首次**进入视口（IntersectionObserver） |
| `intersect` | 元素**每次**进入/离开视口 |

```html
<!-- 元素加载即触发（lazy load 占位常用） -->
<div hx-get="/data" hx-trigger="load">Loading...</div>

<!-- 滚动到可见时触发（无限滚动常用） -->
<div hx-get="/more" hx-trigger="revealed">More...</div>

<!-- 阈值控制（intersect 支持 threshold） -->
<div hx-get="/x" hx-trigger="intersect threshold:0.5">When 50% visible</div>

<!-- root 容器控制 -->
<div hx-get="/x" hx-trigger="intersect root:#scroll-container"></div>
```

### 修饰符完全列表

```html
<!-- once：只触发一次 -->
<button hx-get="/x" hx-trigger="click once">Click</button>

<!-- changed：值改变才触发 -->
<input hx-get="/search" hx-trigger="keyup changed">

<!-- delay:Xs/Xms：防抖 -->
<input hx-get="/search" hx-trigger="keyup changed delay:500ms">

<!-- throttle:Xs/Xms：节流 -->
<button hx-get="/x" hx-trigger="click throttle:1s">Click</button>

<!-- from:selector：从其他元素监听（事件代理） -->
<div hx-get="/refresh"
     hx-trigger="custom-event from:body"></div>

<!-- target:selector：限定 event.target 必须匹配 -->
<div hx-get="/x" hx-trigger="click target:.row">Bubbled</div>

<!-- consume：阻止冒泡（祖先 trigger 不接收） -->
<button hx-get="/x" hx-trigger="click consume">Click</button>

<!-- queue:策略 -->
<input hx-get="/search"
       hx-trigger="keyup changed delay:200ms queue:last">
<!-- queue 选项: first / last（默认） / all / none -->

<!-- 轮询：every Xs -->
<div hx-get="/stats" hx-trigger="every 2s"></div>

<!-- 轮询 + 修饰符 -->
<div hx-get="/stats" hx-trigger="every 5s [shouldPoll()]"></div>

<!-- 事件过滤（方括号 + boolean 表达式） -->
<button hx-get="/x" hx-trigger="click[ctrlKey]">Ctrl+Click</button>
<button hx-get="/x" hx-trigger="keydown[key=='Enter']">Enter</button>
```

### 触发器组合实战

```html
<!-- 搜索框：keyup 防抖 + 仅当值改变 -->
<input hx-get="/search"
       hx-target="#results"
       hx-trigger="keyup changed delay:500ms, search"
       name="q">

<!-- 无限滚动：底部哨兵元素 -->
<div hx-get="/items?page=2"
     hx-trigger="revealed"
     hx-target="#list"
     hx-swap="beforeend">
  Loading more...
</div>

<!-- 自动刷新：每 30s 拉一次 + 立即触发 -->
<div hx-get="/notifications"
     hx-trigger="load, every 30s"
     hx-target="#notif-list">
</div>

<!-- 多元素联动：x 变化导致 y 刷新（自定义事件） -->
<select name="city"
        hx-trigger="change"
        hx-get="/districts"
        hx-target="#district-select">
</select>
<select id="district-select" name="district">
  <option>请选择</option>
</select>
```

## 表单处理深入

### 默认收集规则

`<form hx-post>` 自动收集 form 内**有 name 属性**的字段：

```html
<form hx-post="/save">
  <input name="title">    <!-- 包含 -->
  <input>                  <!-- 不包含（无 name） -->
  <textarea name="body"></textarea>   <!-- 包含 -->
  <select name="cat">      <!-- 包含 -->
    <option>A</option>
  </select>
  <button>Save</button>
</form>
```

非 form 元素也可以触发——但**不会自动收集**，需要 `hx-include`。

### hx-include：跨表单收集

```html
<!-- 主表单 -->
<input id="q" name="q" placeholder="搜索">
<input id="filter" name="cat" placeholder="分类">

<!-- 搜索按钮在表单外 -->
<button hx-get="/search"
        hx-include="#q, #filter"
        hx-target="#results">
  搜索
</button>

<!-- 也可以用扩展选择器 -->
<div>
  <input name="a">
  <input name="b">
  <button hx-post="/x" hx-include="closest div">Submit</button>
</div>
```

### hx-vals：附加值

```html
<!-- 静态 JSON -->
<button hx-post="/track"
        hx-vals='{"source": "header", "campaign": "summer"}'>
  Track
</button>

<!-- 动态（js: 前缀，作为 JavaScript 表达式求值） -->
<button hx-post="/log"
        hx-vals='js:{"timestamp": Date.now(), "user": currentUser.id}'>
  Log
</button>
```

::: warning js: 安全提示
`hx-vals` 的 `js:` 等价于 `eval`——不要从用户输入拼接进去，会导致 XSS。
:::

### hx-headers：自定义请求头

```html
<!-- 静态 -->
<button hx-get="/api/x"
        hx-headers='{"X-API-Version": "2"}'>
  Click
</button>

<!-- 动态 -->
<button hx-get="/api/x"
        hx-headers='js:{"X-CSRF": getCsrfToken()}'>
  Click
</button>
```

### hx-encoding：文件上传

```html
<form hx-post="/upload"
      hx-encoding="multipart/form-data"
      hx-target="#preview">
  <input type="file" name="file">
  <input name="title">
  <button>Upload</button>
</form>
```

### hx-params：参数白名单/黑名单

```html
<!-- 只发送指定参数 -->
<form hx-post="/x" hx-params="name, email">
  <input name="name">
  <input name="email">
  <input name="password">   <!-- 不会发送 -->
</form>

<!-- 黑名单（not 关键字） -->
<form hx-post="/x" hx-params="not password">...</form>

<!-- 不发送任何参数 -->
<form hx-post="/x" hx-params="none">...</form>

<!-- 发送全部（默认） -->
<form hx-post="/x" hx-params="*">...</form>
```

### hx-validate：手动触发校验

非 form 元素默认不会跑 HTML5 校验。需要时显式开启：

```html
<input name="email" type="email" required>
<button hx-post="/save"
        hx-include="closest div"
        hx-validate="true">
  Save
</button>
```

## URL 与历史导航

### hx-push-url：pushState

```html
<!-- 用响应 URL 作为地址 -->
<button hx-get="/profile/123"
        hx-target="#main"
        hx-push-url="true">
  Profile
</button>

<!-- 自定义 URL（API URL 和地址栏 URL 分离） -->
<button hx-get="/api/profile/123"
        hx-target="#main"
        hx-push-url="/profile/123">
  Profile
</button>

<!-- 假装没改 URL -->
<button hx-get="/x"
        hx-push-url="false">
  Click
</button>
```

### hx-replace-url：replaceState

```html
<!-- 不入历史栈（用户按返回不会回到上一个状态） -->
<button hx-get="/x" hx-replace-url="true">Click</button>
```

### 服务端 HX-Push-Url 响应头

服务端可以**主动**控制 URL：

```python
# Django views.py
def my_view(request):
    response = render(request, 'partial.html', ctx)
    response['HX-Push-Url'] = '/new-url'
    return response
```

```js
// Express
res.setHeader('HX-Push-Url', '/new-url')
res.send(html)
```

### hx-history-elt：保存哪一块到 history

默认 HTMX 保存 `<body>` 到 history 缓存。如只想保存部分：

```html
<!-- 只把 #app 区域存进 history -->
<div id="app" hx-history-elt>
  ...
</div>
```

::: warning history 一致性
所有页面都必须有这个 `hx-history-elt` 元素，否则按返回会出错。
:::

### hx-history：禁用 history 缓存

```html
<!-- 此页不存入 history（敏感数据页常用） -->
<body hx-history="false">
  ...
</body>
```

## 错误处理

### 默认行为

HTMX **默认不交换 4xx/5xx 响应**——它认为非 2xx 是异常，不应该污染 DOM。会触发：

- `htmx:responseError` —— 4xx / 5xx
- `htmx:sendError` —— 网络错误（CORS / DNS / 断网）
- `htmx:timeout` —— 超时

```js
document.body.addEventListener('htmx:responseError', e => {
  console.error('error', e.detail.xhr.status, e.detail.xhr.responseText)
})
```

### response-targets 扩展

让 4xx/5xx 响应也能交换到指定元素：

```html
<script src="https://unpkg.com/htmx-ext-response-targets@2.0.0"></script>

<body hx-ext="response-targets">
  <button hx-post="/login"
          hx-target="#result"
          hx-target-401="#auth-error"
          hx-target-422="#validation-error"
          hx-target-500="#server-error"
          hx-target-error="#general-error">
    Login
  </button>

  <div id="result"></div>
  <div id="auth-error"></div>
  <div id="validation-error"></div>
  <div id="server-error"></div>
  <div id="general-error"></div>
</body>
```

`hx-target-*` 支持的形式：

- `hx-target-NNN`：指定状态码（如 `hx-target-404`）
- `hx-target-NXX`：指定状态码段（如 `hx-target-4xx`）
- `hx-target-error`：所有 4xx + 5xx

### hx-confirm：内置确认

```html
<button hx-delete="/users/1" hx-confirm="确定删除此用户？">
  Delete
</button>
```

`hx-confirm` 弹出原生 `window.confirm`。如需美化，监听 `htmx:confirm` 事件自定义：

```js
document.body.addEventListener('htmx:confirm', e => {
  e.preventDefault()  // 阻止默认 confirm
  showCustomDialog(e.detail.question, () => e.detail.issueRequest())
})
```

### hx-prompt：内置输入

```html
<button hx-post="/comments"
        hx-prompt="评论内容：">
  Add
</button>
<!-- 弹出 prompt，输入值作为 HX-Prompt 请求头发送 -->
```

服务端读取：

```python
# Django
prompt_value = request.headers.get('HX-Prompt')
```

## 加载指示器

### hx-indicator：显式控制

```html
<button hx-get="/slow" hx-indicator="#spinner">
  Load
</button>
<img id="spinner" class="htmx-indicator" src="/spinner.svg">
```

CSS（默认隐藏，请求时显示）：

```css
.htmx-indicator {
  opacity: 0;
  transition: opacity 200ms;
}
.htmx-request .htmx-indicator {
  opacity: 1;
}
.htmx-request.htmx-indicator {
  opacity: 1;   /* 自身也是 indicator 的情况 */
}
```

### htmx-request class

请求期间，HTMX 会给**触发元素**和 `hx-indicator` 元素加 `htmx-request` class，可用于任意样式：

```css
.htmx-request {
  pointer-events: none;   /* 禁止再次点击 */
  opacity: 0.6;
}

button.htmx-request::after {
  content: " loading...";
}
```

### hx-disabled-elt：禁用元素

请求期间禁用指定元素（避免重复点击）：

```html
<button hx-post="/save"
        hx-disabled-elt="this">
  Save
</button>

<!-- 禁用整个表单 -->
<form hx-post="/save" hx-disabled-elt="this">
  <input name="x">
  <button>Save</button>
</form>

<!-- 禁用同级元素 -->
<button hx-post="/x"
        hx-disabled-elt="find .submit">
  Click
</button>
```

### loading-states 扩展

更声明式地控制 loading UI：

```html
<script src="https://unpkg.com/htmx-ext-loading-states@2.0.0"></script>

<body hx-ext="loading-states">
  <button hx-post="/save"
          data-loading-disable
          data-loading-aria-busy>
    Save
  </button>

  <div data-loading data-loading-target="#save-status">
    保存中...
  </div>
</body>
```

支持的 `data-loading-*` 属性：

- `data-loading` —— 请求期间显示
- `data-loading-disable` —— 请求期间禁用
- `data-loading-aria-busy` —— 设置 aria-busy
- `data-loading-class` —— 请求期间加 class
- `data-loading-target` —— 关联到指定元素

## hx-boost：渐进增强

`hx-boost="true"` 让普通 `<a>` 和 `<form>` 也走 HTMX 流程（pushState + 局部交换）——**无需改链接**：

```html
<body hx-boost="true">
  <nav>
    <a href="/home">Home</a>     <!-- 自动变 AJAX -->
    <a href="/about">About</a>   <!-- 自动变 AJAX -->
  </nav>

  <form action="/search" method="GET">  <!-- 自动变 AJAX -->
    <input name="q">
    <button>Search</button>
  </form>
</body>
```

`hx-boost` 行为：

- 默认 `hx-target="body"` + `hx-swap="innerHTML"`
- 默认 `hx-push-url="true"`
- 支持禁用 JS 时降级（链接仍能工作）

```html
<!-- 单链接禁用 boost -->
<a href="/external" hx-boost="false">External link</a>
```

## hx-sync：请求同步策略

多个元素都触发请求时，控制并发行为：

```html
<!-- drop：丢弃后续请求（前一个还没完，新请求忽略） -->
<input hx-get="/search"
       hx-trigger="keyup changed delay:200ms"
       hx-sync="this:drop">

<!-- abort：取消前一个，发新的 -->
<input hx-get="/search"
       hx-sync="this:abort">

<!-- replace：abort 的别名 -->
<input hx-get="/search"
       hx-sync="this:replace">

<!-- queue:策略 -->
<input hx-get="/x" hx-sync="this:queue first">
<input hx-get="/x" hx-sync="this:queue last">
<input hx-get="/x" hx-sync="this:queue all">
<input hx-get="/x" hx-sync="this:queue none">

<!-- 跨元素同步 -->
<button hx-post="/x" hx-sync="closest form:abort">Submit</button>
```

## hx-preserve：跨交换保留状态

某些元素（媒体播放器、富文本编辑器）不能被替换——用 `hx-preserve` 标记：

```html
<div id="content">
  <p>会被替换的内容</p>
  <video id="player" hx-preserve controls>
    <source src="/video.mp4">
  </video>
</div>
```

交换 `#content` 时，`#player`（含播放状态、当前时间）会被原样保留。

::: warning 必须有 id
`hx-preserve` 元素必须有 `id`，HTMX 通过 id 识别同一元素并跳过交换。
:::

## hx-disable / hx-disinherit / hx-inherit

### hx-disable：禁用 HTMX

```html
<!-- 此元素及子元素的 hx-* 属性都不会被处理 -->
<div hx-disable>
  <button hx-get="/x">Won't work</button>
</div>
```

适合用户输入内容（防 XSS 注入 HTMX 属性触发请求）。

### hx-disinherit：阻止继承

```html
<!-- 默认子元素继承父级 hx-target / hx-swap / hx-confirm 等 -->
<div hx-target="#result" hx-swap="innerHTML">
  <button hx-get="/x">继承</button>
  <button hx-get="/y" hx-disinherit="hx-target">不继承 target</button>
  <button hx-get="/z" hx-disinherit="*">不继承所有</button>
</div>
```

### hx-inherit：显式继承（HTMX 2.0+）

HTMX 2.0 默认**不继承**某些属性（行为更严格）；用 `hx-inherit` 显式启用：

```html
<div hx-target="#x" hx-inherit="hx-target">
  <button hx-get="/y">继承 hx-target</button>
</div>
```

可在 `htmx.config.attributesToSettle` 中全局配置默认继承列表。

## 扩展生态详解

### 官方维护的扩展

#### head-support

合并响应中 `<head>` 内容（CSS / JS / meta / title 等）到当前页：

```html
<body hx-ext="head-support">
  <a hx-get="/page-with-its-own-css" hx-push-url="true">Go</a>
</body>
```

#### htmx-1-compat

恢复 HTMX 1.x 行为（适合 1.x → 2.x 迁移过渡期）。

#### idiomorph

智能合并 DOM，保留状态（聚焦输入、滚动位置、CSS 动画）：

```html
<script src="https://unpkg.com/idiomorph@0.7.4/dist/idiomorph-ext.min.js"></script>
<body hx-ext="morph">
  <button hx-get="/x" hx-swap="morph:innerHTML">Click</button>
  <!-- 也可以 morph:outerHTML -->
</body>
```

vs **morphdom**：

| 维度 | Idiomorph | Morphdom |
|---|---|---|
| 维护方 | Big Sky Software | patrick-steele-idem |
| 算法 | id + 内容相似度匹配 | 同级位置匹配 |
| 处理移动 | ✅ 智能（用 id 跟踪） | ❌ 容易把移动当增删 |
| 体积 | 较小 | 较小 |
| HTMX 推荐 | ✅ 是 | 备选 |

#### response-targets

按响应状态码分发到不同 target（见错误处理章节）。

#### sse

服务端推送事件（详见下文）。

#### ws

WebSocket（详见下文）。

#### preload

鼠标悬停时预加载（mouse-down 触发 prefetch）：

```html
<script src="https://unpkg.com/htmx-ext-preload@2.0.1"></script>
<body hx-ext="preload">
  <a hx-get="/heavy" preload>Open</a>  <!-- 悬停时预加载 -->
  <a hx-get="/x" preload="mouseover">Strong preload</a>
  <a hx-get="/y" preload="mousedown">Aggressive preload</a>
</body>
```

### 社区扩展

#### loading-states

声明式 loading UI（见上文）。

#### class-tools

定时增删 class：

```html
<script src="https://unpkg.com/htmx-ext-class-tools@2.0.0"></script>
<body hx-ext="class-tools">
  <div classes="add visible:500ms">Fade in</div>
  <div classes="remove fade:1s, add hidden:2s">Sequence</div>
</body>
```

#### json-enc

发送 JSON 而非 form-urlencoded：

```html
<script src="https://unpkg.com/htmx-ext-json-enc@2.0.0"></script>
<form hx-post="/api/users"
      hx-ext="json-enc">
  <input name="email">
  <input name="age" type="number">
</form>
<!-- POST /api/users  Content-Type: application/json
     {"email": "...", "age": 18} -->
```

#### multi-swap

一次响应交换多个元素：

```html
<body hx-ext="multi-swap">
  <button hx-get="/x"
          hx-swap="multi:#a:innerHTML, #b:outerHTML">
    Update both
  </button>
</body>
```

#### alpine-morph

用 Alpine `Alpine.morph` 算法做 swap（保留 Alpine x-data 状态）：

```html
<script src="https://unpkg.com/@alpinejs/morph"></script>
<body hx-ext="alpine-morph">
  <button hx-get="/x" hx-swap="morph">Click</button>
</body>
```

#### client-side-templates

从 JSON 响应客户端模板渲染（不破坏服务端 HTML 范式，仅作过渡）：

```html
<button hx-get="/api/users"
        mustache-template="user-list"
        hx-target="#list">
  Load
</button>
<template id="user-list">
  {{#users}}<li>{{name}}</li>{{/users}}
</template>
```

#### remove-me

定时移除元素：

```html
<div remove-me="3s">3 秒后消失</div>
```

#### path-deps

声明请求依赖（一个 endpoint 变化触发其他元素刷新）：

```html
<body hx-ext="path-deps">
  <ul id="todos" hx-get="/todos" path-deps="/todos"></ul>
  <form hx-post="/todos">...</form>   <!-- POST /todos 后 #todos 自动重新 GET -->
</body>
```

## WebSocket 内置支持（ws 扩展）

```html
<script src="https://unpkg.com/htmx-ext-ws@2.0.0"></script>

<div hx-ext="ws" ws-connect="/chat">
  <div id="messages"></div>
  <form ws-send>
    <input name="message">
    <button>Send</button>
  </form>
</div>
```

服务端：

```python
# FastAPI 例
@app.websocket("/chat")
async def chat_socket(ws: WebSocket):
    await ws.accept()
    while True:
        data = await ws.receive_json()
        # 服务端推送 HTML 片段
        await ws.send_text(f'<div hx-swap-oob="beforeend:#messages"><p>{data["message"]}</p></div>')
```

WebSocket 流程：

1. `ws-connect` 建立连接
2. `ws-send` 表单的提交事件不走 HTTP，转 WS 发送
3. 服务端推送的 HTML 用 `hx-swap-oob` 找到 DOM 位置交换

## SSE 内置支持（sse 扩展）

```html
<script src="https://unpkg.com/htmx-ext-sse@2.2.2"></script>

<div hx-ext="sse" sse-connect="/stream" sse-swap="message">
  <div id="output">等待消息...</div>
</div>
```

服务端推送 `text/event-stream`：

```python
# FastAPI
from sse_starlette.sse import EventSourceResponse

@app.get("/stream")
async def stream():
    async def event_gen():
        for i in range(10):
            yield {"event": "message", "data": f"<p>消息 {i}</p>"}
            await asyncio.sleep(1)
    return EventSourceResponse(event_gen())
```

更精细控制：

```html
<!-- 指定多个事件 -->
<div sse-connect="/stream" sse-swap="msg,alert,heartbeat"></div>

<!-- 自定义 target / swap -->
<div sse-connect="/stream">
  <div id="messages" sse-swap="msg"
       hx-target="#messages"
       hx-swap="beforeend"></div>
</div>

<!-- 通过 SSE 触发 HX-Trigger 风格事件 -->
<div sse-connect="/stream"
     hx-trigger="sse:refresh"
     hx-get="/refresh"></div>
```

## 与 Alpine.js 配合

HTMX + Alpine 是社区公认的「**hypermedia 全栈**」搭配。原则：

- **服务端往返** → HTMX
- **纯客户端 UI 状态** → Alpine
- **客户端事件 DSL** → \_hyperscript / Alpine 任选

### 完整示例：搜索 + 下拉过滤 + Modal 确认

```html
<script src="https://unpkg.com/alpinejs" defer></script>
<script src="https://unpkg.com/htmx.org@2.0.10"></script>

<div x-data="{ filterOpen: false, deleteId: null }">
  <!-- 搜索：HTMX 负责往返 -->
  <input hx-get="/search"
         hx-target="#results"
         hx-trigger="keyup changed delay:300ms"
         name="q"
         placeholder="搜索">

  <!-- 过滤下拉：Alpine 负责显隐 -->
  <button @click="filterOpen = !filterOpen">过滤</button>
  <div x-show="filterOpen" x-transition>
    <label><input type="checkbox" name="active" value="1"
                  hx-get="/search"
                  hx-trigger="change"
                  hx-target="#results"
                  hx-include="closest div"> 只看活跃</label>
  </div>

  <ul id="results"></ul>

  <!-- 删除确认：Alpine Modal + HTMX 提交 -->
  <button @click="deleteId = 123">删除 #123</button>
  <div x-show="deleteId !== null" class="modal">
    <p x-text="`确定删除 #${deleteId}?`"></p>
    <button @click="deleteId = null">取消</button>
    <button :hx-delete="`/items/${deleteId}`"
            hx-target="#results"
            @htmx:after-request="deleteId = null">
      确认
    </button>
  </div>
</div>
```

### hx-on:* 替代 Alpine（简单场景）

HTMX 2.0+ 提供 `hx-on:` 让 HTML 直接绑事件，**简单场景可不引 Alpine**：

```html
<!-- 监听 click 事件 -->
<button hx-on:click="alert('Clicked')">Click</button>

<!-- 监听 HTMX 自定义事件 -->
<div hx-get="/x"
     hx-on:htmx:after-request="this.classList.add('loaded')">
  Click
</div>

<!-- 监听键盘事件 -->
<input hx-on:keyup="console.log(this.value)">
```

::: tip hx-on vs hx-on:*
- HTMX 1.x：`hx-on="event-name: js"` 单属性
- HTMX 2.x：`hx-on:event-name="js"` 多属性（更清晰）

旧语法仍支持但官方推荐新语法。
:::

## 与 _hyperscript 配合

`_hyperscript` 是 Carson 另一项目——HTML 内嵌的事件 DSL（更可读的内联脚本）：

```html
<script src="https://unpkg.com/hyperscript.org"></script>

<button _="on click toggle .red on me">Toggle</button>

<button _="on click
            send refresh to #list
            then put 'Refreshed' into #status">
  Refresh
</button>

<div id="list"
     _="on refresh from anywhere
        fetch /items as html
        put it into me">
</div>
```

HTMX + \_hyperscript 是 Carson 推荐的「**纯 hypermedia 全栈**」组合——不引入 Alpine 也能写完整应用。

## 服务端集成

### Django

```python
# views.py
from django.shortcuts import render
from django.http import HttpResponse

def todo_list(request):
    todos = Todo.objects.all()
    template = 'partials/list.html' if request.htmx else 'list.html'
    return render(request, template, {'todos': todos})

# urls.py
urlpatterns = [
    path('', views.todo_list, name='todos'),
    path('toggle/<int:pk>/', views.toggle, name='toggle'),
]
```

社区库：

- [django-htmx](https://github.com/adamchainz/django-htmx) —— 提供 `request.htmx` 属性、CSRF 中间件、HX 响应头快捷方法
- [django-cotton](https://github.com/wrabit/django-cotton) —— 组件化 Django 模板

### Rails

```ruby
# Gemfile
gem 'turbo-rails'   # 也可以
gem 'requestjs-rails'

# controller
class TodosController < ApplicationController
  def update
    @todo = Todo.find(params[:id])
    @todo.update!(todo_params)
    render partial: 'todo', locals: { todo: @todo }
  end
end
```

社区库：

- [tailwindcss-rails](https://github.com/rails/tailwindcss-rails) + HTMX
- [htmx-rails](https://rubygems.org/gems/htmx-rails) —— Sprockets 引入 + 视图 helpers

### Laravel

```php
// routes/web.php
Route::post('/todos', fn (Request $r) => view('partials.todo-item', [
    'todo' => Todo::create($r->validate(['title' => 'required'])),
]));

// resources/views/partials/todo-item.blade.php
<li id="todo-{{ $todo->id }}">
  {{ $todo->title }}
  <button hx-delete="{{ route('todos.destroy', $todo) }}"
          hx-target="closest li"
          hx-swap="delete">×</button>
</li>
```

社区库：

- [Laravel Livewire](https://livewire.laravel.com/) —— Laravel 官方 LiveView 风格替代
- [protonemedia/laravel-htmx](https://github.com/protonemedia/laravel-htmx)

### FastAPI

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.post("/todos")
async def create_todo(request: Request, title: str = Form(...)):
    todo = await Todo.create(title=title)
    return templates.TemplateResponse(
        "partials/todo.html",
        {"request": request, "todo": todo}
    )
```

社区库：

- [fastapi-htmx](https://pypi.org/project/fastapi-htmx/) —— Decorator + Jinja2 集成

### Express

```js
import express from 'express'
import ejs from 'ejs'

const app = express()
app.set('view engine', 'ejs')

app.post('/todos', async (req, res) => {
  const todo = await db.createTodo(req.body)
  if (req.get('HX-Request')) {
    res.render('partials/todo', { todo })
  } else {
    res.redirect('/')
  }
})
```

### ASP.NET Core

```csharp
public IActionResult Create(string title) {
    var todo = _db.CreateTodo(title);
    if (Request.IsHtmx()) return PartialView("_TodoItem", todo);
    return RedirectToAction("Index");
}
```

社区库：[express-htmx](https://www.npmjs.com/package/express-htmx) / [htmx.NET](https://github.com/khalidabuhakmeh/Htmx.Net) / [Razor Components for HTMX](https://github.com/lvermeulen/RazorComponents.Htmx)。

## Idiomorph 深入

Idiomorph 是 HTMX 推荐的 DOM 合并算法。**核心思想**：用 **id 优先匹配**，再用**内容相似度匹配**，避免简单的位置 diff 导致的状态丢失。

### vs 默认 innerHTML 替换

```html
<!-- 原 DOM -->
<ul id="list">
  <li>A <input value="x"></li>
  <li>B <input value="y"></li>
</ul>

<!-- 服务端返回 -->
<ul id="list">
  <li>A <input value="x"></li>
  <li>新 <input></li>
  <li>B <input value="y"></li>
</ul>
```

**innerHTML 替换**：

- 整个 `<ul>` 内部被销毁重建
- 用户聚焦在 B 的 input 上 → 失焦
- input 的非受控值（`value="x"` 是初始值，用户改后）→ 重置

**Idiomorph**：

- 识别 A 的 `<li>` 没变 → 保留
- 新 `<li>` 插入到中间
- B 的 `<li>` 保留（含 input 焦点和值）

### 用法

```html
<script src="https://unpkg.com/idiomorph@0.7.4/dist/idiomorph-ext.min.js"></script>
<body hx-ext="morph">
  <button hx-get="/list"
          hx-target="#list"
          hx-swap="morph:innerHTML">
    Refresh
  </button>
  <ul id="list">...</ul>
</body>
```

支持 swap 值：

- `morph` —— 默认 outerHTML 风格
- `morph:innerHTML` —— inner morph
- `morph:outerHTML` —— outer morph

### Idiomorph 与表单焦点

Idiomorph 最常见的用途——**轮询表单时不丢焦点**：

```html
<form id="filter"
      hx-get="/items"
      hx-trigger="keyup changed delay:300ms from:input"
      hx-target="#list"
      hx-swap="innerHTML">
  <input name="q">    <!-- 即使列表重新拉取，输入框焦点保留 -->
</form>

<ul id="list" hx-ext="morph">
  ...
</ul>
```

## htmx.config 全局配置

```js
// 常用默认配置（部分）
htmx.config = {
  historyEnabled: true,
  historyCacheSize: 10,
  defaultSwapStyle: 'innerHTML',
  defaultSwapDelay: 0,
  defaultSettleDelay: 20,
  includeIndicatorStyles: true,
  indicatorClass: 'htmx-indicator',
  requestClass: 'htmx-request',
  allowEval: true,
  allowScriptTags: true,
  withCredentials: false,
  timeout: 0,
  wsReconnectDelay: 'full-jitter',
  scrollBehavior: 'instant',
  globalViewTransitions: false,
  methodsThatUseUrlParams: ['get'],
  selfRequestsOnly: true,
}
```

常见调整：

```html
<!-- 通过 meta 标签配置 -->
<meta name="htmx-config" content='{"defaultSwapStyle": "outerHTML"}'>
```

```js
// 通过 JS 配置
htmx.config.defaultSwapStyle = 'outerHTML'
htmx.config.timeout = 5000
htmx.config.allowEval = false   // 禁用 hx-vals 的 js: 前缀（安全）
htmx.config.includeIndicatorStyles = false   // 不注入默认 indicator CSS
```

## 测试

### 单元测试组件意义不大

HTMX 没有「组件」概念——每个 hx-* 属性都是声明式标记，测试 HTML 模板的字符串等价没有价值。**主要测两层**：

1. **后端**：返回的 HTML 是否正确（用后端框架原生测试工具）
2. **端到端**：浏览器实际行为（Cypress / Playwright）

### Cypress E2E 示例

```js
// cypress/e2e/todo.cy.ts
describe('Todo HTMX flow', () => {
  beforeEach(() => {
    cy.visit('/todos')
  })

  it('adds a todo', () => {
    cy.get('input[name="title"]').type('Buy milk')
    cy.get('button[type="submit"]').click()
    // 等 HTMX 完成（observe DOM 变化）
    cy.get('#list').should('contain.text', 'Buy milk')
  })

  it('toggles a todo', () => {
    cy.get('#todo-1 input[type="checkbox"]').click()
    cy.get('#todo-1').should('have.class', 'done')
  })

  it('deletes a todo', () => {
    cy.get('#todo-1 .delete-btn').click()
    cy.get('#todo-1').should('not.exist')
  })
})
```

### 后端单元测试（Django 为例）

```python
# tests.py
class TodoTests(TestCase):
    def test_partial_returns_partial(self):
        c = Client(headers={'HX-Request': 'true'})
        r = c.get('/todos/')
        self.assertContains(r, '<ul id="todos">')
        self.assertNotContains(r, '<html>')   # 不含完整页

    def test_full_page_returns_full(self):
        r = Client().get('/todos/')
        self.assertContains(r, '<html>')
```

## 性能优化

### 服务端 HTML 缓存

由于每次交换都是 HTML 片段，可以用 HTTP 缓存：

```python
# Django：用 cache_page 装饰器
from django.views.decorators.cache import cache_page

@cache_page(60)  # 1 分钟
def todo_count(request):
    return render(request, 'partials/count.html', {'count': Todo.objects.count()})
```

```http
GET /partials/count
HTTP/1.1 200 OK
Cache-Control: max-age=60
Content-Type: text/html

<span>42</span>
```

### preload 扩展

鼠标悬停 prefetch：

```html
<body hx-ext="preload">
  <a hx-get="/heavy-report" preload>Open report</a>
</body>
```

### 客户端 history 缓存

HTMX 默认缓存最近 10 个页面到 sessionStorage，按返回时**直接读缓存不发请求**。`htmx.config.historyCacheSize` 调整。

### 减少请求体积

```html
<!-- 用 hx-select 只取响应中的某部分（减少传输） -->
<button hx-get="/page" hx-select="#content" hx-target="#main">
  Click
</button>
<!-- 服务端返回整页，HTMX 只取 #content -->
```

### HTTP/2 多路复用

HTMX 应用通常发送大量小请求——必须在生产环境启用 HTTP/2 或 HTTP/3，否则 HOL（Head-of-Line）阻塞会拖慢。

## 心智模型对比：HTMX vs SPA

### 状态归属

| 场景 | HTMX | SPA |
|---|---|---|
| 用户信息 | 服务端 + 当前页 HTML | 客户端 store |
| 表单输入中 | DOM（form 内 input value） | 客户端 store |
| 列表筛选条件 | URL query string | 客户端 store |
| 错误信息 | HTML 中的错误段 | 客户端 store + Toast |
| 加载状态 | `htmx-request` class | 客户端 store + Spinner |

### 数据流

**HTMX**：

```
用户操作 → HTML 属性触发 → HTTP 请求 → 服务端处理 → 返回 HTML 片段 → DOM 替换
```

**SPA**：

```
用户操作 → 事件 handler → action → reducer/store → 重新渲染 → DOM diff/patch
                                ↓
                        （需要服务端数据时）
                                ↓
                            fetch JSON → store
```

### 错误 / 加载 / 复用

| 维度 | HTMX | SPA |
|---|---|---|
| 错误展示 | 服务端渲染错误 HTML 段 → 替换错误区域 | JSON 错误 → store → toast / 错误 UI |
| 加载状态 | `.htmx-request` class 自动管理 | 手动 `setLoading()` 或 React Query / SWR |
| 复用单位 | HTML 片段（服务端 partials） | 组件（JSX / Vue SFC） |

## 反模式与陷阱

### ❌ 在 HTMX 项目中重新搞 JSON API

把 HTMX 当 fetch 替代品——返回 JSON 然后客户端模板渲染——**失去了 hypermedia 的全部价值**。要么用 React/Vue，要么完整接受「**服务端返回 HTML**」。

### ❌ 滥用 hx-vals 的 js: 前缀

```html
<!-- 不要这样 -->
<button hx-vals="js:{evil: someUntrustedInput}">Click</button>
```

`js:` 是 `eval`——用户输入永远不要拼接进去。

### ❌ 用 HTMX 做复杂客户端状态

```html
<!-- 不要用 hx-* 实现纯前端的 modal 显隐 -->
<button hx-get="/modal-open" hx-target="#modal">Open</button>
<!-- 应该用 Alpine / _hyperscript -->
<button @click="open = true">Open</button>
```

### ❌ 不区分 HX-Request

```python
# 错误：所有请求都返回片段（直接访问 /todos/ 没有 <html> 外壳）
def todo_list(request):
    return render(request, 'partials/list.html', ctx)

# 正确：区分 HTMX 和直接访问
def todo_list(request):
    template = 'partials/list.html' if request.htmx else 'list.html'
    return render(request, template, ctx)
```

### ❌ 忘记 CSRF

POST/PUT/PATCH/DELETE 都需要 CSRF token（Django / Rails / Laravel 默认开启）：

```html
<!-- Django：用 meta 暴露 token -->
<meta name="csrf-token" content="{{ csrf_token }}">

<script>
  document.body.addEventListener('htmx:configRequest', e => {
    e.detail.headers['X-CSRFToken'] = document.querySelector('meta[name="csrf-token"]').content
  })
</script>
```

### ❌ 在 hx-get 上做敏感操作

GET 必须幂等。删除、转账等必须用 POST/DELETE：

```html
<!-- ❌ 错误：GET 不应该有副作用 -->
<a hx-get="/users/1/delete">Delete</a>

<!-- ✅ 正确 -->
<button hx-delete="/users/1" hx-confirm="确定？">Delete</button>
```

## 总结：何时选 HTMX

**选 HTMX**：

- 团队已有 Django / Rails / Laravel / FastAPI / Express 后端
- 业务是常规 CRUD + 表单 + 列表 + 详情（不是 IDE / 编辑器 / 游戏）
- 全栈或后端工程师为主——不想加 SPA + 类型同步复杂度
- 服务端 HTML 渲染层已存在，再写一遍 SPA 是浪费

**不选 HTMX**：

- 离线优先 / PWA / 长时间不联网的应用
- 高度本地状态的应用（画布、IDE、3D、协同编辑）
- 团队前端栈固定为 React/Vue，且后端是纯 JSON API（招聘市场也偏 SPA）
- 移动端原生 App（HTMX 无 Native 对应——参考 [Hyperview](https://hyperview.org/)）

最后送一句 Carson Gross 在 Hypermedia Systems 里的话：

> "Hypermedia is the simplest, most resilient distributed system we have."

如果业务能跑在「**HTML 即协议**」上，就不需要先把数据序列化为 JSON、再在前端反序列化为 DOM——HTMX 让这条原本就存在的捷径回到了视野。
