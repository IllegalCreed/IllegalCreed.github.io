---
layout: doc
---

# History 与 Navigation API

浏览器**会话历史（session history）的两套编程接口**，是所有 SPA 客户端路由的底座。**History API** 是 2015 年就全绿的老牌方案：`pushState`/`replaceState` 改地址栏而不刷页、`popstate` 监听前进后退、`history.state` 读当前 entry 的 state、`scrollRestoration` 接管滚动恢复——它撑起了整个 SPA 路由时代，但设计缺陷明确（读不到完整历史栈、改不了非当前 entry、`popstate` **不因** `pushState`/`replaceState` 触发、无法拦截所有导航来源）。**Navigation API** 是专为 SPA 重新设计的新一代方案，**2026-01 进入 Baseline Newly Available**（Chrome/Edge/Firefox 147/Safari 26.2）：`navigation.entries()` 读完整同源历史栈、`entry.getState()` 读任意 entry 的结构化 state、`traverseTo(key)` 直达指定 slot、一个 `navigate` 事件拦截**所有**导航并用 `intercept()` 统一接管内容更新、滚动与焦点。规范上两者都属 **WHATWG HTML 现行标准**的「导航与会话历史」章节，Navigation API 另有 [WICG/navigation-api](https://github.com/WICG/navigation-api) 提案仓库沉淀设计讨论。本叶讲**原生 API 机制**与 **hash-vs-history 路由原理**；Vue Router / React Router / TanStack Router 等框架路由只对比点到，展开见[框架路由章](/zh/frontend-framework/router/)。

## 评价

**优点**

- **History API：老牌全绿、心智极简**——两个方法（push/replace）+ 一个事件（popstate）+ 一个属性（state）就能实现"改址不刷页"，2015 年起全浏览器可用，是 SPA 路由二十年的事实底座，至今仍是最大公约数
- **Navigation API：为 SPA 从头设计**——一个 `navigate` 事件捕获点击链接、表单提交、`history.go()`、地址栏改 hash 等**所有**同源导航，`intercept({ handler })` 一处接管，告别"全局监听 click + preventDefault + 手动 pushState"的拼凑
- **完整历史栈可见**：`navigation.entries()` 返回当前同源会话历史的**全部 entry**，每个 `entry.getState()`/`url`/`key`/`index` 可读——History API 只能看到"当前一个" state，这是质变
- **导航即 Promise**：`navigate()`/`traverseTo()` 返回 `{ committed, finished }` 两个 Promise，URL 变更与内容就绪分别可 await；配 `navigatesuccess`/`navigateerror` 事件与 `signal` 取消，异步路由有了标准生命周期
- **与 View Transitions 天然协作**：`intercept()` 的 handler 里做 DOM 更新，配合视图过渡 API 即得"类原生 App"的路由动画，滚动与焦点恢复浏览器代管

**局限**

- **History API 的四宗罪**：读不到完整历史栈、改不了非当前 entry、`popstate` **不因** `pushState`/`replaceState` 触发（只前进后退才触发）、无法感知所有导航来源——SPA 里这些缺口全靠开发者手工补，是各家路由库存在的根因
- **hash 路由 vs history 路由要选对**：history 路由（`pushState` 真路径）**必须服务端把未知路径 fallback 到 `index.html`**，否则刷新即 404；hash 路由（`#/path`）无需后端配合但 URL 不美、SEO 弱——原理与取舍见 [History API 页](./guide-line/history-api)
- **Navigation API 兼容性刚达标**：2026-01 才进 Baseline，老设备/老浏览器仍需 History API 兜底；`"navigation" in window` 特性检测 + 降级是当前的工程现实
- **框架未必直接暴露**：Vue Router / React Router 等仍以自有 API 为主，Navigation API 的红利多在框架**内部**逐步采用，业务代码短期仍多写框架路由而非裸调
- **state 有序列化边界**：两套 API 的 state 都走**结构化克隆**，函数、DOM 节点、类实例方法存不了；History 的 state 在 Firefox 有约 16 MiB 上限，别把大对象塞进历史

一句话选型：**只需"改址不刷页 + 前进后退"、要最大兼容面**，History API 够用且全绿；**做严肃的 SPA 路由内核、要拦截所有导航 + 读写完整历史栈 + Promise 化生命周期**，Navigation API 是"我们一直想要的路由器"，用 `"navigation" in window` 特性检测后启用、以 History API 降级；而业务开发多数时候仍在框架路由层，两套原生 API 主要帮你**读懂路由库到底在替你做什么**。

## 本叶地图

- [入门](./getting-started) —— 两套 API 的定位（History 老牌 / Navigation 新一代）、SPA 客户端路由为何依赖浏览器历史、hash 路由与 history 路由的分野、何时用哪个、与框架路由章的分工
- [History API](./guide-line/history-api) —— `pushState`/`replaceState` 的 state-title-url 三参、`history.state`、`popstate` 事件与**不触发的坑**、`go`/`back`/`forward`/`length`、`scrollRestoration` 的 auto/manual、hash 路由 vs history 路由原理与服务端 fallback、结构化克隆序列化限制
- [Navigation API 基础](./guide-line/navigation-api-basics) —— `window.navigation` 入口、`navigate`/`reload`/`back`/`forward`/`traverseTo` 五方法、`traverseTo(key)` 的 key 语义、`currentEntry`/`entries()`/`updateCurrentEntry`、`NavigationHistoryEntry` 字段全解、相比 History API 的四大改进
- [navigate 事件与拦截](./guide-line/navigate-intercept) —— `navigate` 事件、`intercept({ handler, precommitHandler })` 分提交前后、`canIntercept`/`hashChange`/`downloadRequest`/`formData`/`userInitiated`/`navigationType`、SPA 路由完整实现、`scroll` 与 `focusReset` 行为、`navigatesuccess`/`navigateerror`、`signal` 取消
- [迁移与模式](./guide-line/migration-patterns) —— History→Navigation 迁移对照表、`"navigation" in window` 渐进增强、与框架路由的关系、`currententrychange` 事件、`entry.dispose`、`traverseTo` 断点续航、工程实践与降级
- [参考](./reference) —— History/Navigation 方法与事件速查、`NavigationHistoryEntry` 字段表、两套 API 对比表、浏览器支持矩阵、易错点清单、资源链接

## 文档地址

[MDN Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)

## GitHub 地址

[WICG/navigation-api](https://github.com/WICG/navigation-api)（Navigation API 设计提案与讨论仓库）

## 幻灯片地址

<a href="/SlideStack/history-navigation-slide/" target="_blank">History 与 Navigation API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=history-与-navigation-api" target="_blank" rel="noopener noreferrer">History 与 Navigation API 测试题</a>
