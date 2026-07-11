---
layout: doc
outline: [2, 3]
---

# 参考：速查 / 对比 / 易错点

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **History 入口**：`window.history`（`History` 接口，仅主线程）；**Navigation 入口**：`window.navigation`（`Navigation` 接口，每窗口一个）。
- **History 改址**：`pushState(state, unused, url)` 推新条目 / `replaceState(...)` 替换当前；`unused`（title）**被忽略**、`url` **必须同源**。
- **History 移动**：`back()`=`go(-1)` / `forward()`=`go(1)` / `go(n)` / `go(0)` 刷新；越界静默无效。
- **History 属性**：`state`（当前 state）/ `length`（条目数，含当前）/ `scrollRestoration`（`"auto"`/`"manual"`）。
- **History 事件**：`popstate`（**仅前进后退触发，push/replace 不触发**）、`hashchange`。
- **Navigation 方法**：`navigate(url, {state,info,history})` / `reload({state,info})` / `back()` / `forward()` / `traverseTo(key,{info})`——**都返回 `{committed,finished}` Promise**。
- **Navigation 读栈**：`entries()`（完整同源栈）/ `currentEntry` / `canGoBack` / `canGoForward` / `updateCurrentEntry({state})`。
- **Navigation 事件**：`navigate`（可 `intercept`）/ `navigatesuccess` / `navigateerror` / `currententrychange`。
- **`intercept({handler, precommitHandler, focusReset, scroll})`**：handler 提交后换内容、precommitHandler 提交前取数/重定向。
- **NavigateEvent 属性**：`canIntercept` / `hashChange` / `downloadRequest` / `formData` / `userInitiated` / `navigationType` / `destination` / `info` / `signal`。
- **`navigationType`**：`"push"` / `"replace"` / `"reload"` / `"traverse"`。
- **NavigationHistoryEntry**：`getState()` / `url` / `key`（slot 标识，可 `traverseTo`）/ `id`（实例标识）/ `index` / `sameDocument` / `dispose` 事件。
- **`key` vs `id`**：key 认"位置/slot"（`traverseTo` 用）、id 认"这一次导航实例"（埋点/缓存键用）。
- **两 API state 都走结构化克隆**：函数/DOM 节点存不了；History 的 state 在 Firefox 约 16 MiB 上限。
- **Baseline**：Navigation API **2026-01 Newly Available**（Chrome/Edge/Firefox 147/Safari 26.2）；History API 2015 起全绿。
- **特性检测**：`"navigation" in window` → 用 Navigation；否则降级 History。
- **hash vs history 路由**：hash（`#/path`，`hashchange`，**无需后端**）/ history（真路径，`pushState`，**必须服务端 fallback 到 `index.html`**）。
- **头号坑清单**：`popstate` 不因 push/replace 触发、history 路由刷新 404（漏配 fallback）、state 存不下函数、`traverseTo` key 失效、拦截前忘查 `canIntercept`。

## 一、History 接口速查

### 1.1 方法

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `pushState` | `pushState(state, unused, url?)` | 推新历史条目；不刷页；`unused` 被忽略；`url` 同源否则 `SecurityError` |
| `replaceState` | `replaceState(state, unused, url?)` | 替换当前条目；参数同上 |
| `back` | `back()` | 后退一条（=`go(-1)`）；越界静默 |
| `forward` | `forward()` | 前进一条（=`go(1)`）；越界静默 |
| `go` | `go(delta?)` | 相对跳转；`go(0)`/`go()` 刷新当前页 |

### 1.2 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | any（只读） | 当前历史条目的 state；初始为 `null` |
| `length` | number（只读） | 会话历史条目数（含当前页）；新标签页首页为 1 |
| `scrollRestoration` | `"auto"` \| `"manual"` | 历史导航的滚动恢复策略；默认 `"auto"` |

### 1.3 事件（在 `window` 上）

| 事件 | 触发时机 | 关键属性 |
| --- | --- | --- |
| `popstate` | **前进/后退、`back`/`forward`/`go`**——**push/replace 不触发** | `event.state` |
| `hashchange` | URL 的 fragment（`#` 后）变化 | `event.oldURL` / `event.newURL` |

## 二、Navigation 接口速查

### 2.1 方法（均返回 `{ committed, finished }`）

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `navigate` | `navigate(url, options?)` | `options`：`state`（结构化克隆）、`info`（一次性）、`history`（`"auto"`/`"push"`/`"replace"`） |
| `reload` | `reload(options?)` | `options`：`state`、`info` |
| `back` | `back()` | 后退；`canGoBack` 为假则拒绝 |
| `forward` | `forward()` | 前进；`canGoForward` 为假则拒绝 |
| `traverseTo` | `traverseTo(key, options?)` | 跳到 key 指定条目；`options`：`info`；key 不存在抛 `InvalidStateError` |

### 2.2 属性与读栈

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `currentEntry` | `NavigationHistoryEntry` | 当前条目 |
| `entries()` | 方法 → 数组 | **完整同源历史栈** |
| `canGoBack` / `canGoForward` | boolean | 能否前进后退 |
| `updateCurrentEntry` | `updateCurrentEntry({ state })` | 只改当前 state、不导航、不入栈 |
| `transition` | `NavigationTransition` \| null | 进行中的导航（`navigationType`/`from`/`finished`） |

### 2.3 committed vs finished

| Promise | 兑现时机 |
| --- | --- |
| `committed` | 可见 URL 已变、新 `NavigationHistoryEntry` 已建立 |
| `finished` | `intercept()` 所有 handler 的 Promise 兑现（等价 `navigatesuccess`）；失败则拒绝 |

## 三、navigate 事件与 intercept

### 3.1 NavigateEvent 属性

| 属性 | 类型 | 用途 |
| --- | --- | --- |
| `canIntercept` | boolean | 能否拦截；`false` 时 `intercept()` 抛 `SecurityError`——拦前必查 |
| `hashChange` | boolean | 是否纯 fragment 变化 |
| `downloadRequest` | string \| null | 非 `null` 为下载链接（文件名） |
| `formData` | `FormData` \| null | 非 `null` 为表单提交 |
| `userInitiated` | boolean | 是否用户手势触发 |
| `navigationType` | string | `"push"`/`"replace"`/`"reload"`/`"traverse"` |
| `destination` | object | 目标：`url`/`getState()`/`index`/`sameDocument`/`key`/`id` |
| `info` | any | `navigate(url, { info })` 传入的一次性信息 |
| `signal` | `AbortSignal` | 导航被取消时 abort——透传给 `fetch` |

### 3.2 intercept 选项

| 选项 | 值 | 说明 |
| --- | --- | --- |
| `handler` | async fn | **提交后**运行，渲染新内容 |
| `precommitHandler` | async fn(controller) | **提交前**运行，可取数/校验/重定向；**仅 `cancelable` 导航可用**，否则 `SecurityError` |
| `focusReset` | `"after-transition"`（默认）/ `"manual"` | 默认聚焦 `autofocus` 元素或 `<body>` |
| `scroll` | `"after-transition"`（默认）/ `"manual"` | 默认 push/replace 滚到 fragment/顶部；traverse/reload 延迟到 handler 完成再恢复 |

`precommitHandler` 的 `controller`：`redirect(url, { state, history })` 提交前重定向；`addHandler(cb)` 追加提交后 handler。

### 3.3 Navigation 生命周期事件

| 事件 | 时机 | 能否拦截 |
| --- | --- | --- |
| `navigate` | 导航开始、提交前 | ✅ `intercept()` |
| `currententrychange` | 当前条目已切换后（或 `updateCurrentEntry` 后，`navigationType` 为 `null`） | ❌ 只读 |
| `navigatesuccess` | 所有 handler 成功、`finished` 兑现 | ❌ |
| `navigateerror` | 有 handler 失败、`finished` 拒绝 | ❌ |

## 四、NavigationHistoryEntry 字段

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `getState()` | 方法 | 读该条目的结构化克隆 state（任意条目均可，非仅当前） |
| `url` | string | 条目 URL |
| `key` | string | **slot 标识**——认"位置"，`traverseTo(key)` 用；前进后退不变 |
| `id` | string | **实例标识**——认"这一次导航"，每次新 entry 换新；埋点/缓存键用 |
| `index` | number | 在 `entries()` 中的位置 |
| `sameDocument` | boolean | 是否同文档导航（SPA 内 vs 跨文档加载） |
| `dispose`（事件） | event | 条目被移出历史栈时触发——回收其绑定资源 |

## 五、两套 API 对比

| 维度 | History API | Navigation API |
| --- | --- | --- |
| 入口 | `window.history` | `window.navigation` |
| 出身 / 兼容 | 2015 全绿 | **2026-01 Baseline**，需特性检测降级 |
| 改址方法 | `pushState`/`replaceState` | `navigate({ history })` |
| 只改 state | `replaceState(s,"",href)` | `updateCurrentEntry({ state })` |
| 监听导航 | `popstate`（**仅前进后退**）+`hashchange` | `navigate` 事件（**所有导航**） |
| 拦截换内容 | 全局 `click`+`preventDefault`+手动渲染 | `intercept({ handler })` |
| 读当前 state | `history.state` | `currentEntry.getState()` |
| 读完整历史栈 | **不能** | `entries()` |
| 改非当前 entry | **不能** | 任意 `entry.getState()` 可读 |
| 回到某页 | `go(-n)` 数步数 | `traverseTo(key)` 直达 |
| 能否前进后退 | 无法可靠预判 | `canGoBack`/`canGoForward` |
| 异步生命周期 | 无 | `committed`/`finished` + `navigatesuccess`/`error` |
| 竞态取消 | 自己实现 | `event.signal` |
| 滚动接管 | `scrollRestoration` | `intercept({ scroll })` 更精细 |
| 焦点/无障碍 | 自己管 | 默认 `focusReset` 代管 |
| 条目回收事件 | 无 | `entry.dispose` |

## 六、浏览器支持矩阵

| API / 能力 | Chrome/Edge | Firefox | Safari | 备注 |
| --- | --- | --- | --- | --- |
| History API（`pushState`/`popstate`/`state`） | ✅ 全绿 | ✅ | ✅ | 2015 起 Widely Available |
| `history.scrollRestoration` | ✅ | ✅ | ✅ | 2020 起 Widely Available |
| **Navigation API**（`navigate`/`entries`/`intercept`/`traverseTo`） | ✅ | ✅ **147** | ✅ **26.2** | **2026-01 Baseline Newly Available** |

判断口径：**Navigation API 用 `"navigation" in window` 特性检测**，未命中就走 History API。History API 的 `scrollRestoration` 用 `"scrollRestoration" in history` 检测（老环境极少缺）。Baseline "Newly Available" 意味着最新版全支持，但用户设备上的老版本仍可能缺——生产务必保留 History 降级。

## 七、易错点清单

- **以为 `pushState` 会触发 `popstate`**：不会——push 后要换 UI 必须**自己调渲染**；`popstate` 只管前进后退。
- **history 路由刷新 404**：漏配**服务端 fallback 到 `index.html`**——开发服务器帮你做了、生产没配就露馅（Nginx `try_files $uri $uri/ /index.html;`）。
- **`pushState` 第二参当标题传**：被浏览器忽略——改标题用 `document.title`。
- **`pushState` 传跨源 URL**：抛 `SecurityError`——只能同源。
- **把大对象/类实例/函数塞进 state**：结构化克隆存不了函数/DOM，类实例丢方法；Firefox state 约 16 MiB 上限——**history 只放 id，真数据放外部存储**。
- **首屏没 `replaceState` 灌初始 state**：一路后退回首屏时 `popstate` 的 state 为 `null`，还原不了——进应用先 `replaceState(initialState, "", location.href)`。
- **靠 `history.length` 判断"能否后退"**：`length` 含前进方向、且读不到具体条目——Navigation 用 `canGoBack`。
- **`intercept()` 前不查 `canIntercept`**：跨源等导航上直接 `intercept` 抛 `SecurityError`——先 `if (!event.canIntercept) return;`。
- **忘了放行 `hashChange`/`downloadRequest`**：把锚点跳转、下载链接也拦了——守卫里 `return` 放行。
- **在不可取消导航上用 `precommitHandler`**：`traverse` 等 `cancelable === false`，用 precommit 抛 `SecurityError`——那种场景逻辑放 `handler`。
- **鉴权在 `handler` 里再导航**：地址栏会先闪一下受限 URL——用 `precommitHandler` + `controller.redirect` 提交前改道。
- **异步 handler 不透传 `signal`**：快速切页时旧 `fetch` 晚回覆盖新内容（竞态）——`fetch(url, { signal: event.signal })`。
- **`traverseTo(key)` 不处理 key 失效**：key 被清出栈后抛 `InvalidStateError`——先 `entries().some(e => e.key === key)` 校验或 `try/catch` 降级。
- **用了框架路由还自己接管 `navigate`**：与框架导航逻辑打架——要么全交框架，要么只在无框架场景用原生。
- **混淆 `key` 与 `id`**：回某页用 `key`（认位置）、埋点/缓存键用 `id`（认这一次）——用反了逻辑就错。
- **误以为 `navigate` 事件能收到跨源/跨文档一切**：只覆盖**同源**导航；跨源、部分特殊导航 `canIntercept` 为假——安全边界与 History 一致。

## 八、权威链接

- [MDN: History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) —— History 接口总览
- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API) —— 官方 SPA 路由教程（popstate 不触发的说明）
- [MDN: History.scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration) —— 滚动恢复策略
- [MDN: Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) —— Navigation 接口总览与四大改进
- [MDN: Navigation.navigate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate) —— navigate 参数与 committed/finished
- [MDN: NavigateEvent.intercept()](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept) —— handler/precommitHandler/focusReset/scroll 语义
- [MDN: NavigationHistoryEntry](https://developer.mozilla.org/en-US/docs/Web/API/NavigationHistoryEntry) —— 条目字段（key/id/getState 等）
- [web.dev: The Navigation API is now Baseline Newly available](https://web.dev/blog/baseline-navigation-api) —— Baseline 公告与迁移动机
- [WICG/navigation-api](https://github.com/WICG/navigation-api) —— 设计提案与讨论仓库
- 本站相邻内容：[框架路由章](/zh/frontend-framework/router/)（Vue Router/React Router/TanStack Router 各专叶）｜ [元框架章](/zh/frontend-framework/meta/) ｜ [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)（大数据别塞 history state）
