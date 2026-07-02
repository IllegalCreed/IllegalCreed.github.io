---
layout: doc
outline: [2, 3]
---

# 入门：single-spa 是什么与怎么起步

> 基于 single-spa v6 · 核于 2026-07

## 速查

- single-spa 是**微前端的生命周期编排器**——一句话定位：**「浏览器里的微服务」调度器**，只按路由把子应用装上/卸下，自身 gzip 后约 **5kb**
- 起源于 Canopy 的存量系统现代化：要在**同一个页面、不刷新**地同时跑 React / Angular / Vue，还要各团队**独立部署**
- 三大收益：**多框架同页共存**、**独立部署**（各子应用独立 git 仓库 + CI/CD）、**按路由懒加载**（首屏只下当前应用）
- 三个核心概念：**root config**（启动壳）、**application**（按路由激活的子应用）、**parcel**（手动挂载的 UI 片段）
- 子应用 = 导出 **`bootstrap`/`mount`/`unmount`** 三个返回 Promise 的生命周期的 JS 模块——**框架无关**，靠适配器（single-spa-vue/react/angular）把框架组件包成这三个函数
- root config **只做一件事**：`registerApplication(名字, 加载函数, activity function, customProps)` + `start()`——官方明说它「exists only to start up」，**别往里塞业务**
- **activity function**：`location => 真值` 决定某应用在当前 URL 下是否该活；URL 一变，single-spa 重新算一遍、该 mount 的 mount、该 unmount 的 unmount
- single-spa **只编排、不隔离**：它**不管** JS 沙箱、**不管**样式隔离、**不管**怎么把子应用 HTML 拆成资源清单——这些全要你自己补
- **qiankun ≈ single-spa + 沙箱 + 样式隔离 + HTML entry**：qiankun 内部就是拿 single-spa 当编排底座，再补上 single-spa 故意不做的隔离与加载
- 现代推荐架构：**原生 ESM + import maps** 加载子应用与共享依赖，**SystemJS** 只是浏览器不支持 import maps 时的历史 polyfill
- 选型直觉：**要极致控制、自建底座、团队肯自理隔离** → 直接用 single-spa；**要开箱即用的沙箱/样式/HTML entry** → 用 qiankun（国内主流）
- 起步顺序：先读[三种模块类型](./guide-line/three-types)分清 application/parcel/utility → 再读[生命周期协议](./guide-line/lifecycle-protocol)与 [root config](./guide-line/root-config)

## 一、single-spa 解决什么问题

single-spa 官方给微前端下的定义是一句很硬的类比：**「A microfrontend is a microservice that exists within a browser（微前端就是活在浏览器里的微服务）」**。后端微服务把一个大服务拆成独立进程、独立部署、用网络协作；微前端把一个大前端拆成独立仓库、独立构建、同页协作。single-spa 扮演的角色，就是这堆「浏览器里的微服务」的**调度器**——一个 gzip 后约 5kb 的 npm 包，只负责**编排子应用的挂载与卸载**。

它诞生于 Canopy 的存量系统现代化，要解决三类真实痛点，也正是它的三大收益：

| 收益 | 解决的痛点 | single-spa 怎么做 |
| --- | --- | --- |
| **多框架同页共存** | 老代码 AngularJS、新代码 React，想同页且**不刷新**切换 | 子应用是框架无关的生命周期模块，谁写的框架 single-spa 都不关心 |
| **独立部署** | 一个大仓库、一次发布全量上线，团队互相卡 | 每个子应用独立 git 仓库、独立 `package.json`、独立 CI/CD |
| **按路由懒加载** | 首屏要下载全站 JS | activity function 命中才 `load` + `mount`，没进的路由不下载 |

它对构建工具与浏览器都很宽容：ES5/ES6+/TypeScript、Webpack/SystemJS/Rollup 都行，Chrome/Firefox/Safari/Edge 直到加了 polyfill 的 IE11 都能跑。但官方也把丑话说在前面——**这是一套「与常规前端不同的进阶架构」**，心智负担和工具链要求都更高。

## 二、最小 root config 心智

single-spa 应用由两部分组成：一个 **root config**（负责启动）和若干 **application**（真正的业务子应用）。root config 是整棵树的根，但它**薄到几乎没有逻辑**——官方原话：**「Your root config exists only to start up the single-spa applications（root config 只为把子应用启动起来而存在）」**。

一个最小 root config 只有两段：一张告诉浏览器「子应用代码在哪」的 import map，和一段 JS。

```html
<!-- index.html：root config 的 HTML 外壳，声明子应用与共享依赖的 URL -->
<script type="systemjs-importmap">
{
  "imports": {
    "@org/root-config": "//localhost:9000/org-root-config.js",
    "@org/app-vue": "//localhost:8080/org-app-vue.js"
  }
}
</script>
```

```js
// root-config.js：全站唯一的「启动壳」，只做注册 + start
import { registerApplication, start } from "single-spa";

registerApplication({
  name: "@org/app-vue", // 子应用名（约定与 import map 键一致）
  app: () => System.import("@org/app-vue"), // 加载函数：返回一个带生命周期的模块
  activeWhen: (location) => location.pathname.startsWith("/vue"), // 何时激活
  customProps: { authToken: "..." }, // 透传给子应用生命周期的自定义数据
});

start(); // 必须调用：在此之前子应用只会被 load，不会 bootstrap/mount
```

而每个子应用，无论用什么框架，最终都要**导出三个返回 Promise 的生命周期函数**——这就是 single-spa 与子应用之间唯一的契约：

```js
// 子应用入口：框架无关的生命周期契约（实际由适配器代劳，见「框架适配器」）
export function bootstrap(props) {
  return Promise.resolve(); // 只在首次加载后跑一次：一次性初始化
}
export function mount(props) {
  // 应用被激活：把自己渲染进 DOM（props 里带 name/customProps 等）
  return Promise.resolve();
}
export function unmount(props) {
  // 应用被停用：把自己从 DOM 彻底移除，清理副作用
  return Promise.resolve();
}
```

三段拼起来的心智模型：**import map 说「代码在哪」，root config 说「谁在什么路由下活」，子应用说「怎么把自己装上/卸下」**。细节分别见 [import maps 工作流](./guide-line/import-maps-workflow)、[root config 与注册](./guide-line/root-config)、[生命周期协议](./guide-line/lifecycle-protocol)。

## 三、一次路由切换里发生了什么

single-spa 的运行时循环叫 **reroute**——每当 URL 变化（`hashchange`/`popstate`、被劫持的 `pushState`/`replaceState`），它就重新走一遍：

```text
URL 变化 → 对每个已注册应用跑 activity function
        → 该活却没加载的：load 源码 → bootstrap → mount
        → 该走却还活着的：unmount
        → 其余保持不动
```

举例：用户从 `/react` 走到 `/vue`。single-spa 发现 `@org/app-react` 的 activity function 变成假、`@org/app-vue` 变成真，于是**先 `unmount` React 应用**（它把自己从 DOM 移除），**再 `load`（首次）+ `bootstrap` + `mount` Vue 应用**。两个应用可以同页并存（各占一个容器 DOM），也可以互斥切换——完全由 activity function 决定。**注意：这条链路里没有任何一步在做沙箱或样式隔离**，这正是 single-spa 与 qiankun 的分水岭。

## 四、single-spa 与 qiankun：底座关系

初学最容易混的一点：single-spa 和 qiankun **不是竞品，是分层**。single-spa 是编排层，qiankun 是在它之上补齐隔离与加载的**上层封装**：

| 能力 | single-spa | qiankun |
| --- | --- | --- |
| 生命周期编排 / 路由分发 | ✅ 本命 | ✅ 复用 single-spa |
| JS 沙箱（防全局污染） | ❌ 不做 | ✅ Proxy / 快照沙箱 |
| 样式隔离（防样式互踩） | ❌ 不做 | ✅ Shadow DOM / 属性改写 |
| HTML entry（子应用给 HTML 而非 JS） | ❌ 只吃 JS 模块 | ✅ import-html-entry |
| 上手成本 | 高（要自己搭 import maps、自理隔离） | 低（`registerMicroApps` 开箱即用） |

一句话记牢：**qiankun = single-spa + 沙箱 + 样式隔离 + HTML entry**。所以「single-spa 不管沙箱」不是缺陷，而是它把这些留给了上层——你要么自己补，要么直接用已经补好的 qiankun。隔离机制的通论（四代沙箱、四路 CSS 隔离）见[微前端核心机制](../mfe-mechanisms/)，qiankun 的完整封装见 [qiankun 叶](../qiankun/)。

## 五、直接用 single-spa 还是用封装

| 场景 | 更适合 |
| --- | --- |
| 子应用**同技术栈、同团队自律**，不需要强隔离 | 直接 single-spa（少一层运行时税） |
| 想要**极致控制**加载/路由/共享，自建底座 | 直接 single-spa |
| 已全面 **ESM + import maps**、想用官方推荐架构 | 直接 single-spa |
| 需要**开箱即用**的 JS 沙箱 + 样式隔离 | qiankun（国内主流） |
| 子应用只给 **HTML 地址**、不愿改造成 JS 生命周期模块 | qiankun（HTML entry） |
| 团队规模大、要**降低子应用互相踩坑**的概率 | qiankun / wujie / micro-app |

判据的完整版（含 v6/v7 版本现状、2026 选型位置）见[现状与定位](./guide-line/status-positioning)。

## 小结

single-spa 把微前端窄化成一件事——**按路由编排子应用的生命周期**，自身只有 5kb、只认「导出 bootstrap/mount/unmount」这一条契约，其余（沙箱、样式、HTML 加载）一律不做，留给上层封装或你自己。理解它的最快路径是先分清它管的三种「模块」各自是什么、什么时候用哪种：从[三种模块类型](./guide-line/three-types)开始。
