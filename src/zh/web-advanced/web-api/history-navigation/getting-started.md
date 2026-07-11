---
layout: doc
outline: [2, 3]
---

# 入门：两套 API 定位与 SPA 路由基础

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：History 与 Navigation 是**操作浏览器会话历史**的两套原生 API——本叶讲"改址不刷页"的底层机制与 hash/history 路由原理，框架路由（Vue Router/React Router）见[框架路由章](/zh/frontend-framework/router/)。
- **会话历史（session history）**：当前标签页访问过的页面栈；地址栏、前进后退按钮、`history.length` 都是它的外显——SPA 路由的本质就是"**改历史栈但不真正加载新文档**"。
- **History API 是什么**：`window.history`，2015 年起全绿；核心是 `pushState`/`replaceState`（改址 + 存 state）+ `popstate` 事件（听前进后退）+ `history.state`（读当前 state）。
- **Navigation API 是什么**：`window.navigation`，**2026-01 进 Baseline**（Chrome/Edge/Firefox 147/Safari 26.2）；核心是 `navigate` 事件（拦截**所有**导航）+ `entries()`（读完整历史栈）+ `traverseTo(key)`（直达任意 entry）。
- **SPA 路由三件事**：① 拦截导航（点链接/前进后退）不让浏览器真跳转；② 用 JS 换页面内容；③ 同步地址栏与历史栈让前进后退可用——两套 API 都是为这三件事服务。
- **hash 路由**：URL 形如 `example.com/#/users/1`，靠 `hashchange` 事件驱动；`#` 后的变化**不触发整页请求**，故**无需服务端配合**，代价是 URL 不美、SEO 弱。
- **history 路由**：URL 形如 `example.com/users/1`，靠 `pushState` 造真路径；URL 干净、可 SEO，但**刷新/直接访问会向服务端要该路径**——**服务端必须把未知路径 fallback 到 `index.html`**，否则 404。
- **History API 四宗罪**：读不到完整历史栈、改不了非当前 entry、`popstate` **不因** `pushState`/`replaceState` 触发、感知不到所有导航来源——路由库存在就是为补这些缺口。
- **Navigation 四大改进**：统一 `navigate` 事件拦截所有导航、`entries()` 读完整同源栈、每 entry 独立 state 可读写、`navigate()` 返回 Promise 化的 committed/finished。
- **`popstate` 关键坑**：**只在浏览器前进后退/`history.go()` 时触发，`pushState`/`replaceState` 时不触发**——push 完要更新 UI 得自己调渲染函数，别指望 popstate。
- **state 走结构化克隆**：两套 API 存的 state 都不能含函数、DOM 节点、类方法；History 的 state 在 Firefox 约 16 MiB 上限——大数据放外部存储，历史里只放 id/引用。
- **`scrollRestoration`**：`history.scrollRestoration = "manual"` 关掉浏览器自动滚动恢复，SPA 常用（自己控制滚动）；默认 `"auto"`。Navigation 的 `intercept({ scroll })` 更精细。
- **何时用 History API**：只要"改址 + 前进后退"、要最大兼容面、或维护存量路由库——够用且全绿。
- **何时用 Navigation API**：新建 SPA 路由内核、要拦截**所有**导航来源、要读写完整历史栈、要 Promise 化异步路由——特性检测后启用。
- **特性检测 + 降级**：`if ("navigation" in window) { /* Navigation */ } else { /* History 兜底 */ }`——这是 2026 年的工程现实。
- **别和框架路由抢活**：业务里用 Vue Router/React Router 就够，它们内部封装了这两套 API；本叶帮你**读懂路由库替你做了什么**，不是让你裸写路由。
- **同源约束**：`pushState`/`replaceState` 的 URL 必须同源（跨源抛 `SecurityError`）；Navigation 的 `entries()` 也只暴露同源 entry——安全边界一致。
- **进阶顺序**：本页 → [History API](./guide-line/history-api) → [Navigation API 基础](./guide-line/navigation-api-basics) → [navigate 事件与拦截](./guide-line/navigate-intercept) → [迁移与模式](./guide-line/migration-patterns) → [参考](./reference)。

## 一、先厘清：会话历史与"改址不刷页"

浏览器每个标签页维护一条**会话历史（session history）**——你访问过的页面按顺序排成一个栈，地址栏显示栈顶那个，前进/后退按钮在栈里移动，`history.length` 是栈的长度。传统多页应用（MPA）里，每次导航都向服务端要一个新 HTML 文档、整页重载，历史栈由浏览器自动维护，开发者不用管。

单页应用（SPA）打破了这个模型：整个应用只有**一个 HTML 文档**，"翻页"是用 JavaScript 换掉页面内容，**不向服务端要新文档**。问题随之而来——如果只换内容不动历史栈，地址栏不变、前进后退按钮失灵、刷新回到首页。**SPA 路由要解决的，就是"用 JS 换内容"和"浏览器历史栈"之间的同步**：

1. **拦截导航**：用户点了应用内链接、按了前进后退，别让浏览器真的去加载新文档。
2. **换内容**：用 JS 根据目标 URL 渲染对应视图。
3. **同步历史**：把这次"翻页"写进历史栈，让地址栏正确、前进后退可用、刷新能还原。

History API 和 Navigation API 就是完成这三件事的**浏览器原生工具**。理解它们，才能看懂 Vue Router、React Router、TanStack Router 这些库到底在替你做什么——它们的路由内核正是对这两套 API 的封装。

::: tip 与框架路由章的分工
本叶只讲**原生 API 机制**与**路由原理**。具体某个路由库怎么配路由表、怎么写守卫、怎么做懒加载，属于[框架路由章](/zh/frontend-framework/router/)（Vue Router / React Router / TanStack Router 各有专叶）与[元框架章](/zh/frontend-framework/meta/)。本叶提到框架只做"它们内部用了哪套 API"的对比点到，不展开任何一个库。
:::

## 二、两套 API 的定位

| 维度 | History API | Navigation API |
| --- | --- | --- |
| 入口 | `window.history` | `window.navigation` |
| 出身 | 2015 年全绿的老牌方案 | **2026-01 进 Baseline** 的新一代方案 |
| 改址不刷页 | `pushState`/`replaceState` | `navigate()` + `intercept()` |
| 监听导航 | `popstate`（**只前进后退**）+ `hashchange` | `navigate` 事件（**所有**导航来源） |
| 读历史栈 | 只能读当前 `history.state` 一个 | `entries()` 读**完整同源栈** |
| 改 entry state | 只能改当前 entry | 任意 entry `getState()`，`updateCurrentEntry` |
| 异步生命周期 | 无（回调式） | `navigate()` 返回 `{ committed, finished }` Promise |
| 兼容面 | 全绿 | 现代浏览器，需特性检测降级 |

**History API** 的心智极简：`pushState` 往历史栈里推一条"假页面"（改地址栏 + 存 state 但不刷新），`replaceState` 原地替换当前条，`popstate` 在用户前进后退时告诉你"栈顶变了、该换内容了"。二十年来所有 SPA 路由都建立在这三件套上。它的问题不在于不能用，而在于**缺口太多**（见下一节四宗罪），逼得每个路由库都要在上面糊一层。

**Navigation API** 是对"用 History API 做 SPA 路由"这件事的**系统性重做**。它不再让你"全局监听 click、`preventDefault`、手动 `pushState`、再手动渲染"，而是提供**一个** `navigate` 事件——无论用户点链接、提交表单、按前进后退、还是 JS 调 `navigation.navigate()`，都会触发它；你在事件里调 `intercept({ handler })`，浏览器就把地址栏更新、历史栈维护、滚动与焦点恢复都接管了，你只管在 handler 里渲染内容。

## 三、SPA 路由的两条路线：hash vs history

无论用哪套 API，SPA 路由在 URL 形态上都要在**两种模式**里选一种，这是必须先理解的分野：

### 3.1 hash 路由

URL 把路由信息放在 `#` 之后：

```
https://example.com/#/users/1
https://example.com/#/settings
```

关键机制：**URL 中 `#` 之后（fragment）的变化不会触发浏览器向服务端发请求**——`#` 本是"页内锚点"设计，改它只在客户端跳锚点。SPA 借这个特性：改 `location.hash` 换路由，监听 `hashchange` 事件驱动渲染，服务端永远只看到 `https://example.com/`，**无需任何后端配合**。

- **优点**：零服务端配置，刷新、直接访问、分享链接都不会 404，部署到纯静态托管（GitHub Pages 等）即可。
- **缺点**：URL 里挂个 `#` 不美观；传统上对 SEO 不友好（爬虫可能忽略 fragment）；与真正的锚点定位有潜在冲突。

### 3.2 history 路由

URL 是干净的真实路径，靠 `pushState` 制造：

```
https://example.com/users/1
https://example.com/settings
```

关键机制：`history.pushState` 能把地址栏改成任意**同源路径**且不刷新页面。URL 干净、可 SEO、语义清晰。但代价明确——**当用户刷新页面、或直接输入 `https://example.com/users/1` 访问时，浏览器会实实在在地向服务端请求 `/users/1` 这个路径**。如果服务端没有这个路由，就返回 404。

- **必须配置服务端 fallback**：把所有未匹配到静态资源的路径都**回退到 `index.html`**，让 SPA 的 JS 接手根据 `location.pathname` 渲染对应视图。Nginx 用 `try_files $uri $uri/ /index.html;`，其他服务器同理。
- **优点**：URL 美观、SEO 友好、符合直觉。
- **缺点**：需要后端/托管平台支持 fallback（原理与踩坑详见 [History API 页](./guide-line/history-api)）。

一句话：**hash 路由用兼容与零配置换 URL 美观，history 路由用一条服务端 fallback 规则换干净 URL 与 SEO**。现代项目多选 history 路由，静态托管无法配 fallback 时退回 hash 路由。Navigation API 本身工作在 history 路由模型上（操作真实路径），同样需要服务端 fallback。

## 四、三个最小示例：先建立手感

### 4.1 History API：改址不刷页

```js
// 推一条新历史条目：地址栏变成 /users/1，但页面不刷新
history.pushState({ userId: 1 }, "", "/users/1");

// 读当前条目的 state（无需等 popstate）
console.log(history.state); // { userId: 1 }

// 监听前进后退：注意——上面的 pushState 不会触发它！
window.addEventListener("popstate", (event) => {
  // 只有用户点前进/后退、或调 history.back()/go() 时才进这里
  console.log("导航到：", document.location.pathname, "state：", event.state);
  renderView(document.location.pathname); // 自己根据路径渲染
});
```

### 4.2 Navigation API：一处拦截所有导航

```js
// 特性检测：不支持就走 History API 分支（见迁移页）
if ("navigation" in window) {
  navigation.addEventListener("navigate", (event) => {
    // 只处理能拦截的、非下载、非跨文档的同源导航
    if (!event.canIntercept || event.hashChange || event.downloadRequest) return;

    const url = new URL(event.destination.url);
    event.intercept({
      async handler() {
        // 地址栏、历史栈、滚动、焦点都由浏览器代管，你只渲染
        const view = await loadView(url.pathname);
        render(view);
      },
    });
  });
}
```

### 4.3 读完整历史栈：Navigation 独有

```js
// History API 做不到——它只能读 history.state 一个
if ("navigation" in window) {
  for (const entry of navigation.entries()) {
    console.log(entry.index, entry.url, entry.getState());
  }
}
```

对比很直观：History API 需要你"全局监听 + 手动 push + 手动渲染 + 只能看当前 state"，Navigation API 把这套收敛成"一个事件 + 一次 intercept + 完整历史栈随手可读"。

## 五、何时用哪个

- **只需要"改址不刷页 + 前进后退"、要最大兼容面**：用 History API。它全绿、心智简单，是最保险的最大公约数；维护存量路由代码时也基本是它。
- **要做严肃的 SPA 路由内核**（拦截所有导航来源、读写完整历史栈、Promise 化异步路由、配 View Transitions 做路由动画）：用 Navigation API，`"navigation" in window` 特性检测后启用，以 History API 降级。
- **业务开发**：多数时候你在**框架路由层**（Vue Router / React Router），用它们的声明式路由表就够——它们内部已封装这两套 API。本叶的价值是让你**看懂路由库的底层**，排查"刷新 404""前进后退不对""滚动没恢复"这类问题时能定位到原生机制。

下一页从最基础也最普及的 [History API](./guide-line/history-api) 开始，把 `pushState`/`popstate`/`scrollRestoration` 与 hash/history 路由原理逐一拆开。
