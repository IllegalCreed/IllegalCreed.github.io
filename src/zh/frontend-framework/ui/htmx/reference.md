---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTMX 2.0.x 整理 —— 完整 hx-* 属性、CSS class、请求/响应头、事件、JS API、扩展、配置项速查

## hx-* 属性完整列表

### HTTP 请求动词（5 个）

| 属性 | 等价 HTTP 方法 | 默认触发 |
|---|---|---|
| `hx-get="URL"` | GET | click（非 form） / submit（form） |
| `hx-post="URL"` | POST | 同上 |
| `hx-put="URL"` | PUT | 同上 |
| `hx-patch="URL"` | PATCH | 同上 |
| `hx-delete="URL"` | DELETE | 同上 |

### 目标与替换

| 属性 | 说明 | 示例 |
|---|---|---|
| `hx-target` | 响应替换到哪里 | `hx-target="#result"` |
| `hx-swap` | 替换策略 | `hx-swap="innerHTML"` |
| `hx-swap-oob` | 响应中此元素 OOB 替换 | `<div id="x" hx-swap-oob="true">` |
| `hx-select` | 从响应中选择子集 | `hx-select="#content"` |
| `hx-select-oob` | OOB 选择 | `hx-select-oob="#notification"` |

### 触发与交互

| 属性 | 说明 |
|---|---|
| `hx-trigger` | 自定义触发器（事件 + 修饰符） |
| `hx-confirm` | 弹 confirm 对话框 |
| `hx-prompt` | 弹 prompt 输入框 |
| `hx-indicator` | 加载指示器目标 |
| `hx-disabled-elt` | 请求期间禁用元素 |
| `hx-sync` | 并发请求同步策略 |
| `hx-preserve` | 跨交换保留元素 |
| `hx-disable` | 禁用 HTMX 处理 |

### 数据控制

| 属性 | 说明 |
|---|---|
| `hx-vals` | 附加请求值（JSON 或 `js:`） |
| `hx-headers` | 自定义请求头 |
| `hx-include` | 包含其他元素值 |
| `hx-params` | 参数白/黑名单 |
| `hx-encoding` | 编码方式（如 `multipart/form-data`） |
| `hx-validate` | 启用 HTML5 校验 |
| `hx-request` | 自定义请求配置（timeout / credentials） |

### URL 与历史

| 属性 | 说明 |
|---|---|
| `hx-push-url` | pushState 更新 URL（`true` / `false` / URL 字符串） |
| `hx-replace-url` | replaceState（不入历史栈） |
| `hx-history` | 是否启用 history 缓存（`false` 禁用） |
| `hx-history-elt` | 指定 history 快照元素 |
| `hx-boost` | 让 `<a>` `<form>` 走 AJAX |

### 扩展与继承

| 属性 | 说明 |
|---|---|
| `hx-ext` | 启用扩展（逗号分隔列表） |
| `hx-disinherit` | 阻止子元素继承指定属性 |
| `hx-inherit` | 显式继承属性（HTMX 2.0+） |
| `hx-on:event` | 内联事件处理器（HTMX 2.0 推荐语法） |
| `hx-on` | HTMX 1.x 兼容写法 |

## hx-swap 完整值

```text
innerHTML       —— 替换内部（默认）
outerHTML       —— 替换整个元素
textContent     —— 作为纯文本插入
beforebegin     —— 插入到目标前面（兄弟）
afterbegin      —— 插入到目标内最前
beforeend       —— 插入到目标内最后
afterend        —— 插入到目标后面（兄弟）
delete          —— 删除目标（忽略响应）
none            —— 不替换（OOB 仍生效）
```

### swap 修饰符

| 修饰符 | 说明 | 示例 |
|---|---|---|
| `swap:Xs` | 延迟交换 | `swap:1s` |
| `settle:Xs` | 延迟结算（动画用） | `settle:500ms` |
| `transition:true` | View Transitions API | `transition:true` |
| `ignoreTitle:true` | 不更新 title | `ignoreTitle:true` |
| `scroll:top/bottom` | 交换后滚动 | `scroll:top` |
| `scroll:#x:top` | 指定滚动元素 | `scroll:#log:bottom` |
| `show:top/bottom` | 确保可见 | `show:bottom` |
| `focus-scroll:true/false` | 自动滚动到聚焦输入 | `focus-scroll:false` |

## hx-trigger 完整修饰符

| 修饰符 | 说明 |
|---|---|
| `once` | 只触发一次 |
| `changed` | 值改变才触发 |
| `delay:Xs` | 防抖（重置计时） |
| `throttle:Xs` | 节流（限频） |
| `from:selector` | 从其他元素监听 |
| `target:selector` | 限定 event.target |
| `consume` | 阻止冒泡到祖先 trigger |
| `queue:策略` | 队列策略（`first` / `last` / `all` / `none`） |
| `every Xs` | 轮询（仅作为独立形式） |
| `[expr]` | 事件过滤（boolean JS 表达式） |
| `root:selector` | intersect 的 root 容器 |
| `threshold:0.5` | intersect 的阈值 |

### 特殊事件

| 事件 | 触发时机 |
|---|---|
| `load` | 元素进入 DOM 时 |
| `revealed` | 首次进入视口 |
| `intersect` | 每次进入/离开视口 |
| `every Xs` | 轮询 |

## CSS Class

HTMX 自动管理的 class（用于样式钩子）：

| Class | 应用时机 |
|---|---|
| `htmx-request` | 请求进行中（加在触发元素和 indicator 上） |
| `htmx-indicator` | 加载指示器（默认 opacity:0，请求时变 1） |
| `htmx-added` | 新插入元素的过渡 class |
| `htmx-swapping` | swap 阶段 |
| `htmx-settling` | settle 阶段（settle 结束后移除） |

```css
/* 默认 indicator 样式 */
.htmx-indicator{opacity:0;transition:opacity 200ms}
.htmx-request .htmx-indicator{opacity:1}
.htmx-request.htmx-indicator{opacity:1}
```

## 请求头（HTMX 自动发送）

| 请求头 | 含义 |
|---|---|
| `HX-Request` | 总是 `true` —— 标识 HTMX 请求 |
| `HX-Trigger` | 触发请求的元素 id |
| `HX-Trigger-Name` | 触发元素的 name 属性 |
| `HX-Target` | 目标元素 id |
| `HX-Current-URL` | 当前浏览器 URL |
| `HX-Prompt` | 用户在 `hx-prompt` 输入的值 |
| `HX-History-Restore-Request` | history 恢复请求时为 `true` |
| `HX-Boosted` | hx-boost 触发时为 `true` |

## 响应头（服务端可发送，HTMX 处理）

| 响应头 | 行为 |
|---|---|
| `HX-Location` | 客户端导航（无需完整刷新） |
| `HX-Push-Url` | pushState 指定 URL |
| `HX-Replace-Url` | replaceState 指定 URL |
| `HX-Redirect` | 整页跳转 |
| `HX-Refresh` | `true` 触发整页刷新 |
| `HX-Reswap` | 覆盖客户端 hx-swap |
| `HX-Retarget` | 覆盖客户端 hx-target |
| `HX-Reselect` | 覆盖客户端 hx-select |
| `HX-Trigger` | 客户端触发指定事件（响应交换后） |
| `HX-Trigger-After-Settle` | settle 后触发 |
| `HX-Trigger-After-Swap` | swap 后触发 |

### HX-Trigger 详细用法

```http
# 仅事件名
HX-Trigger: refresh-list

# 多事件
HX-Trigger: refresh-list, show-toast

# 事件 + 数据（JSON）
HX-Trigger: {"show-toast": {"level": "info", "message": "Saved"}}
```

```js
// 客户端监听
document.body.addEventListener('show-toast', e => {
  showToast(e.detail.level, e.detail.message)
})
```

## HTMX 事件（完整列表）

### 请求生命周期

| 事件 | 触发时机 |
|---|---|
| `htmx:configRequest` | 请求参数最后修改机会 |
| `htmx:beforeRequest` | 发送前（可 `preventDefault` 取消） |
| `htmx:beforeSend` | XHR send 前 |
| `htmx:afterRequest` | 请求完成（成功或失败） |
| `htmx:responseError` | 4xx / 5xx |
| `htmx:sendError` | 网络错误 |
| `htmx:timeout` | 超时 |
| `htmx:abort` | 请求被取消 |

### 交换生命周期

| 事件 | 触发时机 |
|---|---|
| `htmx:beforeSwap` | 交换前（可修改 swap 内容） |
| `htmx:beforeOnLoad` | 与 beforeSwap 同期，更底层 |
| `htmx:afterSwap` | 交换完成（settle 前） |
| `htmx:afterSettle` | settle 完成（动画结束） |
| `htmx:afterOnLoad` | XHR onload 完成 |
| `htmx:beforeCleanupElement` | 元素被替换前最后清理 |
| `htmx:oobBeforeSwap` | OOB 交换前 |
| `htmx:oobAfterSwap` | OOB 交换后 |

### 加载与处理

| 事件 | 触发时机 |
|---|---|
| `htmx:load` | 元素被 HTMX 处理（含初始页 + 交换插入） |
| `htmx:beforeProcessNode` | 处理新节点前 |
| `htmx:afterProcessNode` | 处理新节点后 |
| `htmx:noSSESourceError` | SSE 源未找到 |

### 历史

| 事件 | 触发时机 |
|---|---|
| `htmx:historyRestore` | history 恢复 |
| `htmx:historyCacheError` | history 缓存错误 |
| `htmx:beforeHistorySave` | 保存到 history 前 |

### 表单 / 验证

| 事件 | 触发时机 |
|---|---|
| `htmx:validation:validate` | 校验启动 |
| `htmx:validation:failed` | 校验失败 |
| `htmx:validation:halted` | 校验导致请求中止 |
| `htmx:confirm` | hx-confirm 触发 |
| `htmx:prompt` | hx-prompt 触发 |

### SSE

| 事件 | 触发时机 |
|---|---|
| `htmx:sseOpen` | SSE 连接打开 |
| `htmx:sseClose` | SSE 关闭 |
| `htmx:sseError` | SSE 错误 |
| `htmx:sseMessage` | SSE 接收消息 |

### WebSocket

| 事件 | 触发时机 |
|---|---|
| `htmx:wsOpen` | WS 打开 |
| `htmx:wsClose` | WS 关闭 |
| `htmx:wsError` | WS 错误 |
| `htmx:wsBeforeSend` | 发送前 |
| `htmx:wsAfterSend` | 发送后 |
| `htmx:wsBeforeMessage` | 收消息前 |
| `htmx:wsAfterMessage` | 收消息后 |

### 监听示例

```js
// 全局
document.body.addEventListener('htmx:afterRequest', e => {
  console.log('status', e.detail.xhr.status)
})

// 仅监听某元素
document.querySelector('#x').addEventListener('htmx:beforeRequest', e => {
  if (!confirm('Continue?')) e.preventDefault()
})

// 修改请求
document.body.addEventListener('htmx:configRequest', e => {
  e.detail.headers['X-Custom'] = 'foo'
  e.detail.parameters.extra = 'bar'
})

// 修改 swap 内容
document.body.addEventListener('htmx:beforeSwap', e => {
  if (e.detail.xhr.status === 422) {
    e.detail.shouldSwap = true   // 强制交换 422 响应
    e.detail.isError = false
  }
})
```

## JavaScript API

### 全局对象

```js
window.htmx
// 或 ESM
import htmx from 'htmx.org'
```

### 核心方法

| 方法 | 说明 |
|---|---|
| `htmx.ajax(verb, url, target)` | 手动发请求 |
| `htmx.process(el)` | 让 HTMX 处理动态插入的元素 |
| `htmx.find(sel)` | querySelector（HTMX 风格） |
| `htmx.findAll(sel)` | querySelectorAll |
| `htmx.closest(el, sel)` | 等价 el.closest() |
| `htmx.values(form)` | 收集表单值为对象 |
| `htmx.trigger(el, event, detail)` | 派发自定义事件 |
| `htmx.swap(target, content, swapSpec)` | 手动交换 |
| `htmx.on(eventName, listener)` | 添加全局监听 |
| `htmx.off(eventName, listener)` | 移除监听 |
| `htmx.takeClass(el, class)` | 接管元素 class（同名兄弟去掉） |
| `htmx.addClass(el, class, delay)` | 加 class（可延迟） |
| `htmx.removeClass(el, class, delay)` | 去 class（可延迟） |
| `htmx.toggleClass(el, class)` | 切换 |
| `htmx.logAll()` | 控制台打印全部事件 |
| `htmx.logNone()` | 关闭 logAll |
| `htmx.parseInterval(s)` | 解析 `"1s"` → `1000` |
| `htmx.createWebSocket(url)` | 创建 WS（ws 扩展用） |
| `htmx.createEventSource(url)` | 创建 EventSource（sse 扩展用） |
| `htmx.defineExtension(name, def)` | 定义扩展 |
| `htmx.removeExtension(name)` | 移除扩展 |

### 配置

| 字段 | 默认 | 说明 |
|---|---|---|
| `historyEnabled` | true | 是否启用 history |
| `historyCacheSize` | 10 | 缓存页数 |
| `defaultSwapStyle` | innerHTML | 默认 swap |
| `defaultSwapDelay` | 0 | 默认 swap 延迟 |
| `defaultSettleDelay` | 20 | 默认 settle 延迟 |
| `includeIndicatorStyles` | true | 注入默认 indicator CSS |
| `indicatorClass` | htmx-indicator | indicator class 名 |
| `requestClass` | htmx-request | 请求中 class 名 |
| `allowEval` | true | 允许 `hx-vals` 的 `js:` |
| `allowScriptTags` | true | 处理响应中的 `<script>` |
| `withCredentials` | false | XHR withCredentials |
| `timeout` | 0 | 默认超时（ms，0 = 不超时） |
| `wsReconnectDelay` | full-jitter | WS 重连延迟策略 |
| `selfRequestsOnly` | true | 只允许同源请求 |
| `globalViewTransitions` | false | 全局启用 View Transitions |
| `methodsThatUseUrlParams` | ['get'] | 走 URL 参数的方法 |
| `attributesToSettle` | ['class', 'style', 'width', 'height'] | settle 阶段过渡的属性 |
| `disableSelector` | `[hx-disable], [data-hx-disable]` | 禁用 HTMX 的选择器 |
| `scrollBehavior` | instant | 滚动行为 |
| `defaultFocusScroll` | false | 默认是否自动滚动到聚焦 |
| `ignoreTitle` | false | 默认是否忽略 title 更新 |
| `inlineScriptNonce` | '' | CSP nonce |

### 通过 meta 配置

```html
<meta name="htmx-config" content='{"defaultSwapStyle": "outerHTML", "timeout": 5000}'>
```

## 选择器扩展

HTMX 在 `hx-target` / `hx-include` / `hx-trigger from:` 等场景支持以下扩展选择器：

| 选择器 | 含义 |
|---|---|
| `this` | 元素自身 |
| `closest <sel>` | 向上查找最近的祖先 |
| `find <sel>` | 在子树内查找 |
| `next <sel>` | 后一个匹配的兄弟 |
| `previous <sel>` | 前一个匹配的兄弟 |
| `global <sel>` | 文档级查找（绕过相对选择器） |

```html
<button hx-target="closest .card">Click</button>
<button hx-include="closest form, #external">Click</button>
<div hx-trigger="click from:closest .row"></div>
```

## 扩展（hx-ext）

### 官方扩展（Big Sky 维护）

| 扩展 | 用途 | 引入 |
|---|---|---|
| `head-support` | 合并响应 `<head>` 内容 | `htmx-ext-head-support` |
| `htmx-1-compat` | HTMX 1.x 兼容 | `htmx-ext-1-compat` |
| `idiomorph` | 智能 DOM 合并 | `idiomorph` |
| `preload` | 悬停 prefetch | `htmx-ext-preload` |
| `response-targets` | 按状态码分发 target | `htmx-ext-response-targets` |
| `sse` | Server-Sent Events | `htmx-ext-sse` |
| `ws` | WebSocket | `htmx-ext-ws` |

### 常用社区扩展

| 扩展 | 用途 |
|---|---|
| `loading-states` | 声明式 loading UI |
| `class-tools` | 定时增删 class |
| `json-enc` | 发送 JSON 而非 form-urlencoded |
| `multi-swap` | 一次响应交换多个元素 |
| `alpine-morph` | 用 Alpine.morph 算法做 swap |
| `client-side-templates` | JSON 响应客户端模板 |
| `remove-me` | 定时移除元素 |
| `path-deps` | 声明 endpoint 间依赖 |
| `morphdom-swap` | morphdom 算法 swap |
| `signalr` | SignalR 实时通信 |
| `no-cache` | 禁用客户端缓存 |
| `form-json` | 类型保留 JSON |
| `event-header` | 把事件名传到请求头 |
| `disable-element` | 自动禁用元素 |
| `restored` | history 恢复触发 |

### 启用扩展

```html
<!-- body 上启用，子元素继承 -->
<body hx-ext="response-targets, sse">
  ...
</body>

<!-- 单元素启用 -->
<form hx-ext="json-enc" hx-post="/api">...</form>

<!-- 多个 -->
<body hx-ext="response-targets, preload, sse, ws, idiomorph">
```

## 常见模式 cheat-sheet

### 列表无限滚动

```html
<ul id="list">
  <li>1</li><li>2</li>
  <div hx-get="/items?page=2"
       hx-trigger="revealed"
       hx-target="#list"
       hx-swap="beforeend">
    Loading...
  </div>
</ul>
```

### 搜索（防抖 + 仅值变）

```html
<input hx-get="/search"
       hx-target="#results"
       hx-trigger="keyup changed delay:300ms, search"
       name="q">
<ul id="results"></ul>
```

### 删除自身

```html
<li>
  Item 1
  <button hx-delete="/items/1"
          hx-target="closest li"
          hx-swap="delete"
          hx-confirm="删除？">×</button>
</li>
```

### inline 编辑

```html
<!-- 显示态 -->
<div id="name" hx-get="/users/1/edit" hx-swap="outerHTML">
  Alice <button>Edit</button>
</div>

<!-- 服务端返回编辑表单 -->
<form id="name" hx-put="/users/1" hx-swap="outerHTML">
  <input name="name" value="Alice">
  <button>Save</button>
  <button hx-get="/users/1" hx-swap="outerHTML" hx-target="#name">Cancel</button>
</form>
```

### 表单提交 + URL 更新

```html
<form hx-post="/login"
      hx-target="#main"
      hx-push-url="true">
  <input name="email">
  <input name="password" type="password">
  <button>Login</button>
</form>
```

### 服务端触发刷新（多元素）

```http
HTTP/1.1 200 OK
HX-Trigger: refresh-stats, refresh-notifications
```

```html
<div hx-get="/stats" hx-trigger="refresh-stats from:body"></div>
<div hx-get="/notifications" hx-trigger="refresh-notifications from:body"></div>
```

### OOB 多区域更新

```html
<!-- 主交换 -->
<button hx-post="/like/1" hx-target="#likes-1">Like</button>
<span id="likes-1">10</span>

<!-- 服务端响应 -->
<!-- 主目标内容 -->
<span>11</span>

<!-- OOB 额外更新 -->
<div id="total-likes" hx-swap-oob="true">132</div>
<div id="recent-activity" hx-swap-oob="afterbegin">
  <li>Alice liked post 1</li>
</div>
```

### 上传文件

```html
<form hx-post="/upload"
      hx-encoding="multipart/form-data"
      hx-target="#status">
  <input type="file" name="file" multiple>
  <button>Upload</button>
</form>
<div id="status"></div>
```

### 轮询 + 条件停止

```html
<!-- 每 5 秒检查状态 -->
<div id="status"
     hx-get="/job/123/status"
     hx-trigger="every 5s">
  Pending...
</div>

<!-- 服务端响应（状态完成时停止轮询） -->
<div id="status" hx-trigger="none">
  ✓ Done
</div>
```

### 与 Alpine.js 共同

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Menu</button>
  <ul x-show="open">
    <li hx-get="/profile" hx-target="#main">Profile</li>
    <li hx-get="/settings" hx-target="#main">Settings</li>
  </ul>
</div>
```

## 调试快速参考

```js
// 打开全部日志
htmx.logAll()

// 自定义 logger
htmx.logger = (elt, event, data) => {
  console.log(event, elt, data)
}

// 关闭日志
htmx.logNone()

// 调试单元素
htmx.find('#x').addEventListener('htmx:beforeRequest', console.log)
htmx.find('#x').addEventListener('htmx:afterSwap', console.log)

// 配置 timeout（调试慢请求）
htmx.config.timeout = 3000
```

## 浏览器兼容

| 浏览器 | HTMX 2.x | HTMX 1.x |
|---|---|---|
| Chrome / Edge / Firefox / Safari 最新 | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ |
| IE 11 | ❌ | ✅ |
| 旧 Android WebView | ⚠️ 部分 | ✅ |

如必须支持 IE11，用 HTMX 1.9.x 或加上 `htmx-1-compat` 扩展。

## 引用资源

- **官网**：[htmx.org](https://htmx.org/)
- **文档**：[htmx.org/docs/](https://htmx.org/docs/) | [htmx.org/reference/](https://htmx.org/reference/)
- **扩展**：[htmx.org/extensions/](https://htmx.org/extensions/)
- **GitHub**：[bigskysoftware/htmx](https://github.com/bigskysoftware/htmx)
- **示例**：[htmx.org/examples/](https://htmx.org/examples/)
- **论文集**：[htmx.org/essays/](https://htmx.org/essays/) —— Carson Gross 系列文章
- **配套书**：[Hypermedia Systems](https://hypermedia.systems/)
- **作者 Twitter**：[@htmx_org](https://twitter.com/htmx_org)
- **Carson Gross 个人**：[@htmx_org](https://twitter.com/htmx_org) / [Carson 博客](https://intercoolerjs.org/) （HTMX 前身 intercooler.js）
- **Idiomorph**：[bigskysoftware/idiomorph](https://github.com/bigskysoftware/idiomorph)
- **\_hyperscript**：[hyperscript.org](https://hyperscript.org/)
- **Hyperview（HTMX 移动端）**：[hyperview.org](https://hyperview.org/)
