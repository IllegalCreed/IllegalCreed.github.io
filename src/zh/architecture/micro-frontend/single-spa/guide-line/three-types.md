---
layout: doc
outline: [2, 3]
---

# 三种模块类型

> 基于 single-spa v6 · 核于 2026-07

## 速查

- single-spa 把「浏览器里的微服务」分成**三种模块类型**：**application**（应用）、**parcel**（包裹）、**utility module**（工具模块）——一套架构里三者常并用
- **application**：**声明式**、**按路由激活**、生命周期由 **single-spa 托管**——是主组织单位，`registerApplication` 注册后自动 load/bootstrap/mount/unmount
- **parcel**：**命令式**、**手动挂载/卸载**、**框架无关的 UI 片段**——官方定位为「single-spa 版 Web Components」，是**跨框架共享 UI** 的逃生舱（Vue 组件挂进 React 应用）
- **utility module**：**纯 JavaScript 逻辑**、**直接 `import`**、**不渲染 UI、不参与路由、无生命周期**——共享逻辑（鉴权、请求、通知、错误追踪、样式库 token）
- 一句话区分：**application 靠路由、parcel 靠手动、utility 靠 import**；**application/parcel 渲染 UI，utility 通常不渲染**
- application 用 **`registerApplication`**（root config 里声明），single-spa 负责在对的路由挂上、走的时候卸下——**你不碰生命周期时机**
- parcel 用 **`mountRootParcel`/`mountParcel`**（命令式 API），**必须自己在父组件卸载时手动 `unmount`**，否则泄漏；一般用框架适配器（single-spa-vue/react）把组件生成 parcel 配置
- utility module 是**有自己仓库/CI 的浏览器内模块**，导出函数与变量作为公共接口；官方常见例子：**Notification / Styleguide / Error tracking / Authorization / Data fetching**
- application **也能导出**生命周期之外的方法/组件作为公共接口——三者不是互斥的身份，而是「以哪种方式被消费」
- 选择顺序：**能按路由拆就用 application** → 要**跨框架复用一块 UI** 用 parcel → **只共享逻辑不渲染**用 utility module
- 跨应用通信官方首选 **utility module 直接 import**（而非全局事件总线），理由见[微前端核心机制·通信](../../mfe-mechanisms/guide-line/communication)

## 一、三种类型总览

single-spa 生态里流动的东西不止「子应用」一种。官方把它们归为三类，用途、消费方式、谁管生命周期各不相同：

| 维度 | application（应用） | parcel（包裹） | utility module（工具模块） |
| --- | --- | --- | --- |
| API 风格 | **声明式**（`registerApplication`） | **命令式**（`mountRootParcel`） | 普通 ES 模块 `export` |
| 激活方式 | **按路由**（activity function） | **手动**调用 mount | 被 `import` 时 |
| 生命周期 | single-spa **自动托管** | **你手动**管理 | **无** |
| 是否渲染 UI | 是（必须） | 是（必须） | 通常否 |
| 框架无关 | 是 | **是（核心卖点）** | 是（纯逻辑） |
| 主要用途 | 微前端主组织单位 | 跨框架共享一块 UI | 共享逻辑 |
| 典型例子 | `/orders`、`/settings` 各一个应用 | 一个能被多框架挂的用户弹窗 | 鉴权 / 请求 / 通知服务 |

三者不是非此即彼——一套真实架构通常**三种都有**：几个按路由拆的 application 撑起骨架，一个 styleguide 里既导出普通组件（build-time 复用）又导出 parcel（跨框架复用），再加若干 utility module 承载鉴权与请求。

## 二、application：声明式、按路由、single-spa 托管

application 是微前端的**主组织单位**，也是你 90% 时间在写的东西。它的特征是**声明式**——你在 root config 里用 `registerApplication` 告诉 single-spa「这个应用叫什么、代码怎么加载、什么路由下该活」，剩下的 load/bootstrap/mount/unmount **时机全由 single-spa 决定**，你不手动触碰：

```js
import { registerApplication } from "single-spa";

// 声明式：只描述「是什么、何时活」，不描述「何时挂载」——那是 single-spa 的事
registerApplication({
  name: "@org/orders", // 应用名
  app: () => System.import("@org/orders"), // 加载函数：返回带生命周期的模块
  activeWhen: "/orders", // 路由前缀命中即激活（内部转成 activity function）
});
```

被注册的 application 必须导出 single-spa 生命周期（`bootstrap`/`mount`/`unmount`）供框架调用；除此之外它**还能导出别的方法、组件或值作为公共接口**，供其他微前端 `import`。换句话说，一个 application 同时也可以「兼职」utility module 的角色——身份由「怎么被消费」决定，而非互斥标签。

**何时用**：只要有一块 UI 能**跟某段路由绑定**，它就该是 application。这是默认选择，其余两种都是它满足不了时的补充。

## 三、parcel：命令式、手动挂载、跨框架 UI 复用

parcel 是官方明说的**「escape hatch（逃生舱）」**，用来**在不同框架的应用之间共享一块 UI**——它把 single-spa 定位成**「我们自己的 Web Components」**。经典场景：一个用 Vue 写好的「新建用户」弹窗，要被一个 React 应用直接复用。React 没法直接渲染 Vue 组件，但可以挂载一个**框架无关的 parcel**。

parcel 与 application 最大的不同是**命令式 + 手动生命周期**：single-spa 不会自动帮你挂 parcel，你调用 `mountRootParcel`（或组件内的 `mountParcel`）时它**立即挂载**，而且**父组件卸载时你必须手动 `unmount`**，否则泄漏：

```js
import { mountRootParcel } from "single-spa";
import userModalParcel from "@org/styleguide/user-modal"; // 一个带生命周期的 parcel 配置

// 命令式：你决定何时挂、挂到哪、传什么
const parcel = mountRootParcel(userModalParcel, {
  domElement: document.getElementById("modal-host"), // 挂载容器（parcel 特有 prop）
  user: currentUser, // 任意业务 props 透传
});

await parcel.mountPromise; // 挂载完成的 Promise
// …… 用完必须手动卸载（application 由 single-spa 自动卸，parcel 得你自己来）
await parcel.unmount();
```

parcel 配置本身就是一个 `{ bootstrap, mount, unmount, update? }` 对象，比 application 多一个**可选的 `update`** 生命周期（父应用可以在不重挂的前提下把新 props 推给 parcel，见[生命周期协议](./lifecycle-protocol)）。实务中很少手写这个对象，而是用框架适配器生成——`single-spa-vue`/`single-spa-react` 都能把一个框架组件包成 parcel 配置（见[框架适配器](./framework-adapters)）。

**何时用**：需要**跨框架复用同一块 UI** 时。如果复用只发生在同框架内，普通组件 import 就够了，不必上 parcel。

## 四、utility module：纯逻辑、直接 import、无路由无生命周期

utility module 是三者里最朴素的：它就是**一个有自己 git 仓库和 CI 的浏览器内 JavaScript 模块**，导出一堆函数和变量作为公共接口，**不渲染 UI、不参与路由、没有 single-spa 生命周期**。它不被 `registerApplication`、也不被 `mountRootParcel`——只被别的微前端**直接 `import`**，用起来和一个普通 npm 包无异：

```js
// @org/api：一个 utility module —— 纯逻辑，无生命周期，无路由
let loggedInUserPromise = fetch("/api/me").then((r) => r.json());

/** 统一封装带鉴权的请求，所有子应用共用一份实现 */
export function authenticatedFetch(url, init) {
  return fetch(url, init).then((r) => r.json());
}

/** 共享登录态，避免每个子应用各查一遍 */
export function getLoggedInUser() {
  return loggedInUserPromise;
}
```

```js
// 任意子应用里：像用普通包一样直接 import
// （构建时把 @org/api 标为 externals，运行时由 import map 指到唯一 URL——见「import maps 工作流」）
import { authenticatedFetch } from "@org/api";

authenticatedFetch(`/api/clients/${clientId}`).then((client) => {
  console.log(client);
});
```

官方列举的常见 utility module：**Notification service（通知）**、**Styleguide / component library（样式库/组件库）**、**Error tracking service（错误追踪）**、**Authorization service（鉴权）**、**Data fetching（数据请求）**。它们的价值是**消除重复**——与其每个应用各写一份鉴权逻辑，不如做成一个 utility module 让所有应用共享。

utility module 也是 single-spa 官方**首选的跨应用通信方式**：与其搭一个全局事件总线或全局 Redux，不如把要共享的状态/逻辑做成一个 utility module，让需要的应用 `import { thing } from "@org/shared"`——显式依赖、可追溯、类型友好。这条立场的完整论证见[微前端核心机制·通信](../../mfe-mechanisms/guide-line/communication)。

## 五、怎么选：一张决策路径

```text
要共享的是「一整块能绑路由的界面」吗？
  ├─ 是 → application（默认选择，registerApplication）
  └─ 否 → 要共享的是「一块 UI」吗？
          ├─ 是，且要跨框架复用 → parcel（mountRootParcel，记得手动 unmount）
          ├─ 是，但只在同框架内复用 → 普通组件 import（不必上 single-spa）
          └─ 否（只共享逻辑，不渲染） → utility module（直接 import）
```

三条口诀收尾：**application 靠路由、parcel 靠手动、utility 靠 import**；**渲染 UI 的是 application/parcel，不渲染的是 utility**；**生命周期 single-spa 托管的是 application，手动托管的是 parcel，压根没有的是 utility**。

## 小结

三种模块类型对应三种「被消费」的方式：application 被路由激活、由 single-spa 托管生命周期，是主组织单位；parcel 被命令式挂载、需你手动管理，是跨框架 UI 复用的逃生舱；utility module 被直接 import、无生命周期无路由，是共享逻辑的载体。分清它们之后，下一步是看 single-spa 到底怎么托管 application/parcel 的生命周期——它们经历哪几个状态、每个钩子该做什么：见[生命周期协议](./lifecycle-protocol)。
