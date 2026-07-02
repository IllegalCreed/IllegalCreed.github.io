---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 single-spa v6 · 核于 2026-07

## 速查

- 本页汇总六张表：**三种模块类型** / **生命周期状态机** / **registerApplication 参数** / **import maps 工作流** / **框架适配器** / **版本状态**
- 三类型一句话：**application 靠路由**（声明式、single-spa 托管）、**parcel 靠手动**（命令式、跨框架 UI）、**utility module 靠 import**（纯逻辑、无生命周期）
- 生命周期一句话：`bootstrap`/`mount`/`unmount`（+ parcel `update`）各返回 Promise，走 `NOT_LOADED → … → MOUNTED` 状态机；`LOAD_ERROR` 可重试、`SKIP_BECAUSE_BROKEN` 永久隔离
- registerApplication 一句话：`name` + `app`（加载函数/对象）+ `activeWhen`（前缀/含参/函数/数组）+ `customProps`（对象/函数）；`start()` 不调用就不挂载
- import maps 一句话：原生 ESM + import maps（Baseline 2023-03）现代首选，SystemJS 历史 polyfill；共享依赖走 externals + import map；overrides 本地覆盖、deployer 并发部署
- 适配器一句话：single-spa-vue（`createApp`/`Vue`）、single-spa-react（`ReactDOMClient`/`ReactDOM` + `rootComponent`）、single-spa-angular（`singleSpaAngular` + `ng add`）都返回 `{ bootstrap, mount, unmount }`
- 版本一句话：**v6.0.3（2024-09）稳定 `latest`**，**v7 长期 beta（beta.13 停在 2025-09-22 后无更新）**——生产用 v6
- 定位一句话：single-spa **只编排、不隔离**，是 **qiankun 的底座**（qiankun ≈ single-spa + HTML entry + 沙箱 + 样式隔离）

## 一、三种模块类型对比表

| 维度 | application（应用） | parcel（包裹） | utility module（工具模块） |
| --- | --- | --- | --- |
| API 风格 | 声明式 `registerApplication` | 命令式 `mountRootParcel`/`mountParcel` | 普通 ES 模块 `export` |
| 激活方式 | 按路由（activity function） | 手动调用 mount | 被 `import` 时 |
| 生命周期 | single-spa 自动托管 | 你手动管理（须手动 unmount） | 无 |
| 额外生命周期 | — | 可选 `update`（推新 props 不重挂） | — |
| 是否渲染 UI | 是（必须） | 是（必须） | 通常否 |
| 框架无关 | 是 | 是（核心卖点） | 是（纯逻辑） |
| 主要用途 | 微前端主组织单位 | 跨框架共享一块 UI | 共享逻辑（鉴权/请求/通知/样式库/错误追踪） |
| 典型坏法 | 该拆路由却塞进一个巨应用 | 父组件卸载忘了手动 unmount → 泄漏 | 演化成全局 store |

详见[三种模块类型](./guide-line/three-types)。

## 二、生命周期状态机表

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| `NOT_LOADED` | 已注册，未加载源码 | 命中路由 → 加载 |
| `LOADING_SOURCE_CODE` | 正在下载/执行源码 | 成功 → `NOT_BOOTSTRAPPED`；失败 → `LOAD_ERROR` |
| `NOT_BOOTSTRAPPED` | 源码就绪，未 bootstrap | → `BOOTSTRAPPING` |
| `BOOTSTRAPPING` | `bootstrap` 执行中 | 完成 → `NOT_MOUNTED` |
| `NOT_MOUNTED` | 已引导，未挂载（或刚卸载） | 激活 → `MOUNTING` |
| `MOUNTING` | `mount` 执行中 | 完成 → `MOUNTED` |
| `MOUNTED` | 正活在 DOM 上 | 停用 → `UNMOUNTING` |
| `UPDATING` | parcel 的 `update` 执行中 | 完成 → `MOUNTED` |
| `UNMOUNTING` | `unmount` 执行中 | 完成 → `NOT_MOUNTED` |
| `UNLOADING` | `unloadApplication` 卸载中 | 完成 → `NOT_LOADED`（可重新引导） |
| `LOAD_ERROR` | 加载失败 | **下次路由变化重试** |
| `SKIP_BECAUSE_BROKEN` | 生命周期抛错/超时死亡 | **永久跳过、不再尝试** |

**超时配置**：`setBootstrapMaxTime` / `setMountMaxTime` / `setUnmountMaxTime` / `setUnloadMaxTime`，参数 `(millis, dieOnTimeout, warningMillis)`；`dieOnTimeout: true` 超时 → `SKIP_BECAUSE_BROKEN`。**错误处理**：`addErrorHandler(fn)`（error 带 `appOrParcelName`）/ `removeErrorHandler(fn)`。**重置**：`unloadApplication(name, { waitForUnmount })` 打回 `NOT_LOADED`；`unregisterApplication(name)` 彻底注销。**查询**：`getAppStatus` / `getMountedApps` / `getAppNames`。详见[生命周期协议](./guide-line/lifecycle-protocol)。

## 三、registerApplication 参数表

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 应用唯一名，约定与 import map 键一致 |
| `app` | 函数 / 对象 | 加载函数 `() => import(...)`，或已解析对象 `{ bootstrap, mount, unmount }` |
| `activeWhen` | 字符串 / 函数 / 数组 | 何时激活（见下） |
| `customProps` | 对象 / 函数 | 透传给生命周期的自定义数据；函数形态 `(name, location) => ({...})` |

**`activeWhen` 四种写法**：

| 写法 | 例 | 匹配 |
| --- | --- | --- |
| 路径前缀 | `"/app1"` | `/app1` 及 `/app1/**` |
| 含参路径 | `"/users/:userId/profile"` | 动态段匹配 |
| activity function | `(loc) => loc.pathname.startsWith("/app2")` | 完全自定义（须纯函数） |
| 数组 | `["/pathname/#/hash", "/app1"]` | 命中其一即激活 |

**`start(opts)`**：不调用则应用只 load、不 mount；`urlRerouteOnly`（v6 默认 `true`）只在 URL 真正变化时 reroute。**activity function 求值时机**：`hashchange`/`popstate`、被劫持的 `pushState`/`replaceState`、`triggerAppChange()`、`checkActivityFunctions()`。**容器约定**：`<div id="single-spa-application:应用名"></div>`。详见 [root config 与注册](./guide-line/root-config)。

## 四、import maps 工作流表

| 维度 | 原生 ESM + import maps | SystemJS（历史 polyfill） |
| --- | --- | --- |
| script 类型 | `<script type="importmap">` | `<script type="systemjs-importmap">` |
| 加载入口 | 原生 `import` | `System.import(...)` |
| 构建产物格式 | 标准 ESM | `System.register`（webpack `libraryTarget: "system"` / rollup `format: "system"`） |
| 浏览器支持 | Baseline Widely available（2023-03） | 老浏览器兼容层 |
| 吃标准 ESM 包 | ✓ | ✗（需 esm-bundle / JSPM CDN 取 `System.register` 版） |
| 定位 | **现代首选** | **历史/兼容，退居 polyfill** |

**共享依赖**：构建时 `externals: [/^@org\/.+/, "react"]`（webpack）/ `external`（rollup）不打进 bundle，运行时 import map 指到唯一 URL → 全站共下一份。**工具**：`import-map-overrides`（本地只起一个应用、覆盖存 localStorage）、`import-map-deployer`（CI `curl -X PATCH` 并发安全改键）、`systemjs-webpack-interop`（动态 `publicPath`）。**依赖 URL 来源**：esm-bundle、JSPM CDN（`system-cdn.jspm.io/npm:react@17.0.0/...`）、generator.jspm.io、self-hosted。详见 [import maps 工作流](./guide-line/import-maps-workflow)。

## 五、框架适配器表

| 适配器 | 关键必填参数 | 要点 |
| --- | --- | --- |
| **single-spa-vue** | Vue 3：`createApp` + `appOptions`；Vue 2：`Vue` + `appOptions` | 可选 `handleInstance(app, props)`；single-spa props 挂在组件 `this` 上 |
| **single-spa-react** | `React` + `rootComponent` + `ReactDOMClient`（18+）/ `ReactDOM`（≤17） | React 18 `renderType` 默认 `createRoot`；可配 `errorBoundary(err, info, props)` |
| **single-spa-angular** | `bootstrapFunction` + `template`（+ `Router`/`NgZone`/`NavigationStart`） | `ng add single-spa-angular` 生成 `main.single-spa.ts` 等 |
| 其他 | — | svelte / preact / ember / angularjs / alpinejs / riot / inferno / dojo / backbone / cycle / html / web-components |

**配套工具**：`create-single-spa`（脚手架）、`single-spa-layout`（声明式布局）、`import-map-overrides`、`import-map-deployer`。**旁路**：Angular 生态的 @angular-architects Native Federation 用原生 ESM + import maps 走 MF 心智，与 single-spa-angular 是两条独立路线。详见[框架适配器](./guide-line/framework-adapters)。

## 六、版本状态表

| 版本 | 发布时间 | 标签 | 状态 |
| --- | --- | --- | --- |
| `6.0.0` | 2023-12-03 | — | v6 首发 |
| `6.0.3` | 2024-09-29 | **`latest`** | **当前稳定版**（生产推荐） |
| `7.0.0-beta.0` | 2024-09-30 | `beta` | v7 beta 起点 |
| `7.0.0-beta.13` | 2025-09-22 | `beta` | **最新 beta，此后无更新** |
| `4.4.4` | — | `4.x` | 老版本兼容标签 |

结论：**生产用 v6.0.3**；v7 长期 beta 且 2025-09 后停更，无需等待。single-spa 定位极窄（只编排），核心稳定、少变；它是 **qiankun 的底座**（qiankun ≈ single-spa + HTML entry + 沙箱 + 样式隔离）。详见[现状与定位](./guide-line/status-positioning)。

## 权威链接

- [single-spa 官网](https://single-spa.js.org/) —— 概念/API/生态/推荐架构总入口
- [Getting Started / Overview](https://single-spa.js.org/docs/getting-started-overview/) —— 起源、三大收益、三核心概念
- [Microfrontends Concept](https://single-spa.js.org/docs/microfrontends-concept/) —— 「浏览器里的微服务」定义、5kb 编排器定位、三类型
- [Module Types](https://single-spa.js.org/docs/module-types/) —— application / parcel / utility module 三类型详解
- [Configuration](https://single-spa.js.org/docs/configuration/) —— registerApplication、activeWhen、customProps、start()
- [API](https://single-spa.js.org/docs/api/) —— 生命周期、状态机、超时、错误处理、事件
- [Recommended Setup](https://single-spa.js.org/docs/recommended-setup/) —— import maps + SystemJS、externals 共享、overrides/deployer
- [Ecosystem](https://single-spa.js.org/docs/ecosystem/) —— single-spa-vue/react/angular 等适配器与工具
- [GitHub: single-spa](https://github.com/single-spa/single-spa) · [Releases](https://github.com/single-spa/single-spa/releases) —— 源码与版本状态核对源
- [MDN: import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) —— Baseline 状态、imports/scopes/integrity
- [SystemJS](https://github.com/systemjs/systemjs) —— System.register 模块加载器（历史 polyfill）

## 相关页

- [入门](./getting-started) —— single-spa 是什么、最小 root config、与 qiankun 的关系、直接用 vs 用封装
- [三种模块类型](./guide-line/three-types) / [生命周期协议](./guide-line/lifecycle-protocol) / [root config 与注册](./guide-line/root-config) / [import maps 工作流](./guide-line/import-maps-workflow) / [框架适配器](./guide-line/framework-adapters) / [现状与定位](./guide-line/status-positioning)
- [微前端核心机制](../mfe-mechanisms/) —— single-spa 不做的沙箱/样式/通信/依赖共享/加载通论
- [微前端基础](../mfe-basics/) —— 定义、判据、组合模式、[2026 选型全景](../mfe-basics/guide-line/landscape-2026)
- [qiankun](../qiankun/) —— 以 single-spa 为底座、补齐沙箱/样式/HTML entry 的封装（前向引用）
- [Vue 其他生态](/zh/frontend-framework/ui/vue/guide-line/other) —— qiankun/wujie/micro-app 等的 Vue 接入实操
