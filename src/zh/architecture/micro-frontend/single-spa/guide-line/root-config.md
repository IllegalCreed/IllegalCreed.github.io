---
layout: doc
outline: [2, 3]
---

# root config 与注册

> 基于 single-spa v6 · 核于 2026-07

## 速查

- **root config** 是整个 single-spa 应用的**启动壳**：一张共享 HTML + 一段调用 `registerApplication` 与 `start()` 的 JS——官方定位 **「exists only to start up（只为启动子应用而存在）」**
- **「最薄」哲学**：root config **不该有业务逻辑**，只做注册与启动；业务全在子应用里——root config 越薄，越不会成为团队间的耦合点
- **`registerApplication`** 有两种签名：**位置参数**版 `(name, app, activeWhen, customProps)` 和**配置对象**版 `{ name, app, activeWhen, customProps }`（推荐后者，可读）
- **`name`**：应用唯一名（约定与 import map 键一致）；**`app`**：加载函数 `() => import(...)` 或已解析的生命周期对象
- **`activeWhen`**：决定何时激活。可为**路径前缀字符串**（`"/app1"` 匹配 `/app1` 及 `/app1/**`）、**含参路径**（`"/users/:id/profile"`）、**activity function**、或三者**数组**（命中其一即激活）
- **activity function**：一个**纯函数** `location => 真值`，返回真时应用该活；single-spa 在 `hashchange`/`popstate`、被劫持的 `pushState`/`replaceState`、`triggerAppChange`、`checkActivityFunctions` 时重新求值
- **`start()` 必须调用**：在此之前应用只会被 `load`、**不会 bootstrap/mount/unmount**；把 `start()` 放在初始 AJAX 之后可**避免过早挂载**、同时让代码并行下载
- **`start({ urlRerouteOnly: true })`**（v6 默认真）：只在 URL 真正变化时 reroute，`pushState`/`replaceState` 到当前同一 URL 不触发——减少无谓重算
- **`customProps`**：透传给子应用生命周期的自定义数据，可为**对象**或 **`(name, location) => 对象`** 的函数（按应用/路由动态生成，如注入 token）
- 多应用同页：给每个应用准备一个容器 `<div id="single-spa-application:应用名"></div>`，single-spa 按名字找容器
- reroute 循环：URL 变 → 对每个应用跑 activity function → 该挂的 load/bootstrap/mount、该走的 unmount（生命周期细节见[生命周期协议](./lifecycle-protocol)）

## 一、root config：最薄的启动壳

single-spa 应用有且只有一个 **root config**。它由两块组成：一张所有子应用共享的 **HTML 外壳**（含 import map，声明子应用与共享依赖的 URL），和一段 **JavaScript**——后者的全部职责就是**注册应用**并**启动**。官方把这份克制写进了文档原话：

> Your root config exists only to start up the single-spa applications.（root config 只为把子应用启动起来而存在。）

这句话是一条设计纪律：**root config 里不放业务逻辑**。它不渲染页面内容、不管数据、不处理鉴权细节——那些都在子应用里。root config 越薄，它就越不会变成「所有团队都要改的那个文件」，微前端「独立部署」的承诺才立得住。一个典型 root config 的 JS 全文可能就十几行：

```js
import { registerApplication, start } from "single-spa";

registerApplication({
  name: "@org/navbar",
  app: () => System.import("@org/navbar"),
  activeWhen: () => true, // 导航栏：所有路由常驻
});

registerApplication({
  name: "@org/orders",
  app: () => System.import("@org/orders"),
  activeWhen: "/orders", // 只在 /orders 下激活
});

start(); // 启动
```

## 二、registerApplication：两种签名、四个参数

`registerApplication` 是注册子应用的唯一入口，支持两种写法，语义等价：

```js
// 写法 A：位置参数 (name, app, activeWhen, customProps)
registerApplication(
  "@org/app2",
  () => import("src/app2/main.js"), // 加载函数
  (location) => location.pathname.startsWith("/app2"), // activity function
  { some: "value" } // customProps
);

// 写法 B：配置对象（推荐——参数有名字，更可读）
registerApplication({
  name: "@org/app1",
  app: () => import("src/app1/main.js"),
  activeWhen: "/app1",
  customProps: { some: "value" },
});
```

四个参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| **`name`** | string | 应用唯一标识，约定与 import map 键一致 |
| **`app`** | 函数 / 对象 | **加载函数** `() => import(...)`（返回 resolve 出生命周期模块的 Promise），或**已解析的生命周期对象** `{ bootstrap, mount, unmount }` |
| **`activeWhen`** | 字符串 / 函数 / 数组 | 何时激活，见下节 |
| **`customProps`** | 对象 / 函数 | 透传给生命周期的自定义数据，见第五节 |

`app` 传**加载函数**是常态（这样才能懒加载）；传**已解析对象**则用于「代码已在手边、不需要额外加载」的场景：

```js
// app 直接给一个已解析的生命周期对象
const application = {
  bootstrap: () => Promise.resolve(),
  mount: () => Promise.resolve(),
  unmount: () => Promise.resolve(),
};
registerApplication("@org/inline", application, "/inline");
```

## 三、activity function：`location => 真值`

`activeWhen` 的本质是一个 **activity function**——**纯函数**，接收 `window.location`，**返回真值时应用该活**。single-spa 会在这些时刻重新求值它：`hashchange` / `popstate` 事件、被 single-spa 劫持的 `history.pushState` / `replaceState`、手动 `triggerAppChange()`、以及 `checkActivityFunctions()`。

`activeWhen` 有多种便捷写法，最终都归约成一个 activity function：

```js
// 1) 路径前缀字符串："/app1" 匹配 /app1 与 /app1/anything
activeWhen: "/app1",

// 2) 含参路径：":userId" 是动态段
activeWhen: "/users/:userId/profile",

// 3) activity function：完全自定义
activeWhen: (location) => location.pathname.startsWith("/app2"),

// 4) 数组：命中其中任意一个即激活（前缀 + hash 混用）
activeWhen: ["/pathname/#/hash", "/app1"],
```

写 activity function 有两条纪律：**必须是纯函数**（同样的 location 永远给同样的结果，不要在里面改状态或发请求），且**尽量便宜**（每次路由变化都会跑一遍）。字符串前缀 `pathToActiveWhen` 转出来的函数已经够用，只有前缀表达不了的判定（如按 query 参数激活）才手写函数。

## 四、start()：不调用就不挂载

`registerApplication` 只是**登记**，真正让应用开始挂载的开关是 **`start()`**。在 `start()` 被调用之前，single-spa 会**下载**（load）子应用代码，但**不会** bootstrap / mount / unmount 任何东西：

```js
import { start } from "single-spa";

// 常见模式：先发起首屏必须的初始化请求，请求回来再 start()
fetchInitialConfig().then(() => {
  start(); // 此刻才允许挂载——避免应用在配置就绪前就渲染
});
```

这个「先注册、后 `start()`」的设计有实际价值：应用代码可以**并行下载**（不等 `start()`），但**挂载时机由你控制**——把 `start()` 放在关键初始化（读配置、校验登录态）之后，能避免子应用在数据就绪前就抢先渲染出半成品。

`start()` 接受一个可选配置，其中 **`urlRerouteOnly`**（v6 默认 `true`）值得一提：为真时，只有 URL **真正变化**才触发 reroute——如果代码调用 `pushState`/`replaceState` 但目标 URL 和当前一致，single-spa 不会白跑一轮重算：

```js
start({ urlRerouteOnly: true }); // 只在 URL 实际改变时 reroute
```

## 五、customProps：往生命周期里递数据

`customProps` 是 root config 向子应用生命周期**单向传数据**的通道——挂载时 single-spa 会把它并进 props，子应用在 `mount(props)` 里就能拿到。它可以是**静态对象**，也可以是**根据应用名和当前 location 动态生成的函数**：

```js
// 静态对象：所有激活都传同一份
customProps: { authToken: getToken(), theme: "dark" },

// 函数：按 name / location 动态生成（例如给不同应用发不同 scope 的 token）
customProps: (name, location) => ({
  authToken: getTokenForApp(name),
  fromPath: location.pathname,
}),
```

子应用侧：

```js
export function mount(props) {
  // props 里有 name、singleSpa、mountParcel，以及你传的 customProps
  const { authToken, theme } = props;
  return renderApp({ authToken, theme });
}
```

`customProps` 适合传**启动期就确定、单向下发**的数据（token、主题、语言）。频繁双向通信不该走它——那是 utility module 或事件的领域（见[微前端核心机制·通信](../../mfe-mechanisms/guide-line/communication)）。

## 六、多应用同页：容器约定

多个应用同时激活时，各自需要一个挂载容器。single-spa 的默认约定是按 `single-spa-application:应用名` 找 `id`：

```html
<div id="single-spa-application:@org/navbar"></div>
<div id="single-spa-application:@org/orders"></div>
```

想要更结构化的多区域布局（顶栏 + 侧栏 + 主区各挂不同应用），官方提供 `single-spa-layout`（Layout Engine）用一段声明式模板描述「哪个应用挂在哪个区域」，比手写一堆容器 div 更好维护（见[框架适配器](./framework-adapters)与[参考](../reference)）。

## 小结

root config 是 single-spa 应用唯一的启动壳，信奉「最薄」哲学——只用 `registerApplication` 登记「谁在什么路由下活」、再用 `start()` 拉闸，不掺任何业务。`registerApplication` 的四个参数里，`activeWhen` 归约成一个纯 activity function 决定激活时机，`customProps` 单向下发启动期数据；`start()` 把「代码下载」与「挂载时机」解耦，`urlRerouteOnly` 避免无谓重算。root config 说清了「谁在哪活」，但这些子应用的代码从哪来、共享依赖怎么只下一份——那是 import maps 的工作：见 [import maps 工作流](./import-maps-workflow)。
