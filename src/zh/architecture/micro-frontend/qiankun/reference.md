---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- 本页汇总六张表：**核心 API** / **三沙箱对比** / **样式隔离两方案** / **UMD 接入清单** / **Vite 方案** / **版本时间线**
- 核心 API 一句话：路由型 `registerMicroApps + start`（默认 `singular: true` 单实例）、手动型 `loadMicroApp`（多实例、生命周期自管）、`initGlobalState` 通信、`setDefaultMountApp`/`runAfterFirstMounted` 管启动
- 三沙箱一句话：`proxySandbox`（多实例）/ `legacyProxySandbox`（单实例）/ `snapshotSandbox`（无 Proxy 降级），按「有无 Proxy + singular」自动选
- 样式隔离一句话：`strictStyleIsolation`（Shadow DOM，**弹窗逃逸**）vs `experimentalStyleIsolation`（属性改写，**不支持 `@keyframes`/`@font-face`**）；主应用样式自治靠改前缀
- UMD 接入一句话：`libraryTarget: 'umd'` + 唯一 `library`/`chunkLoadingGlobal` + 导出 `bootstrap/mount/unmount` + 修 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__` + 开 CORS
- Vite 一句话：2.x 基于 import-html-entry **不支持 ESM 入口**，`vite-plugin-qiankun` 可 hack（**沙箱失效**），要真隔离换 wujie/micro-app，3.0 规划原生吃 ESM
- 版本一句话：**2.10.16（2023-11）事实稳定线**，**3.0 rc.21（2026-02）仍无 stable**，三年难产、2026 复苏（@scope、`create-qiankun`）
- 定位一句话：qiankun = single-spa + HTML entry + JS 沙箱 + 样式隔离；**国内存量最大、面试必考**，甜区「存量 webpack + 要开箱」

## 一、核心 API 表

| API | 作用 | 关键参数 / 返回 |
| --- | --- | --- |
| `registerMicroApps(apps, lifeCycles?)` | 路由型注册子应用 | app：`name`/`entry`/`container`/`activeRule`（+`loader`/`props`）；全局 `beforeLoad`/`beforeMount`/`afterMount`/`beforeUnmount`/`afterUnmount` |
| `start(opts?)` | 启动 qiankun | `prefetch`（默认 `true`）/`sandbox`（默认 `true`）/`singular`（默认 `true`）/`fetch`/`getPublicPath`/`getTemplate`/`excludeAssetFilter` |
| `loadMicroApp(app, config?)` | 手动加载（多实例） | 返回 `MicroApp`：`mount`/`unmount`/`update`/`getStatus`/`loadPromise`/`bootstrapPromise`/`mountPromise`/`unmountPromise` |
| `setDefaultMountApp(appLink)` | 首次进站默认挂载的子应用 | 路由字符串（如 `/home`） |
| `runAfterFirstMounted(effect)` | 首个子应用挂载后执行一次 | 回调（常用于收 loading） |
| `initGlobalState(state)` | 建全局通信状态 | 返回 `onGlobalStateChange(cb, fireImmediately?)`/`setGlobalState(state)`（仅一级属性）/`offGlobalStateChange()` |
| `prefetchApps(apps, opts?)` | 手动预取子应用资源 | `[{ name, entry }]` |
| `addGlobalUncaughtErrorHandler(h)` / `removeGlobalUncaughtErrorHandler(h)` | 全局未捕获错误兜底 | 错误处理器 |

`entry` 可为 HTML 地址（末尾 `/` 不能省）或 `{ scripts, styles, html }`；`activeRule` 可为前缀串 / `location => boolean` / 数组。详见[核心 API](./guide-line/core-api)。

## 二、三沙箱对比表

| 沙箱 | 隔离方式 | 实例数 | 何时启用 |
| --- | --- | --- | --- |
| `proxySandbox` | 每应用一个 `fakeWindow`，写落假读先假后真 | **多实例** | 支持 Proxy 且 `singular: false` |
| `legacyProxySandbox` | Proxy 记差异、写仍落真 window、卸载恢复 | 单实例 | 支持 Proxy 且 `singular: true`（路由型默认） |
| `snapshotSandbox` | 激活拍 window 快照、失活 diff 恢复 | 单实例 | **不支持 `Proxy`** 的旧环境（IE）降级，强制单实例 |

**拦得住**：全局变量读写、`window` 事件（劫持 `addEventListener` 记账卸载清）、定时器（劫持 `setTimeout`/`setInterval`）、动态 `<style>`/`<script>`/`<link>`（记账卸载移除）。**拦不住**：`window.top`/`window.parent`、原生构造函数、闭包缓存引用——软隔离防意外不防恶意。**高频坑**：<code v-pre>window.onXxx</code> 直接赋值失效，改 `addEventListener`。沙箱通论见[核心机制·JS 沙箱](../mfe-mechanisms/guide-line/js-sandbox)，qiankun 细节见[沙箱实现](./guide-line/sandbox-impl)。

## 三、样式隔离两方案对比表

| 维度 | `strictStyleIsolation` | `experimentalStyleIsolation` |
| --- | --- | --- |
| 机制 | Shadow DOM 包裹子应用容器 | 运行时把规则改写成 `div[data-qiankun-xxx] .selector` |
| 隔离方向 | 双向（进不来出不去） | 单向（防泄漏，不防入侵） |
| 弹窗（挂 body） | **死穴：逃出 shadow tree、样式全丢** | 失效：改写后选择器选不中 |
| `@keyframes`/`@font-face`/`@import`/`@page` | 树内自洽（重名仍需前缀） | **不支持改写 → 重名互踩** |
| 继承属性 / CSS 变量 | 照常穿透（可作主题通道） | 不拦 |
| 稳定度 | 稳定但组件库弹窗致其难用 | 实验性 |

**默认行为**（`sandbox: true`）：动态样式表劫持，自动隔离**微应用之间**的样式（卸载移除）；**主应用样式不管辖**。**主应用自治**：antd 用 `modifyVars: { '@ant-prefix': 'yourPrefix' }` + <code v-pre>&lt;ConfigProvider prefixCls="yourPrefix"&gt;</code>。**2026 方向**：3.0 弃 Shadow DOM，转原生 CSS `@scope`。通论见[核心机制·CSS 隔离](../mfe-mechanisms/guide-line/css-isolation)，qiankun 细节见[样式隔离](./guide-line/style-isolation)。

## 四、UMD 接入清单

| 步骤 | 配置 / 代码 | 目的 |
| --- | --- | --- |
| 导出生命周期 | `export async function bootstrap/mount/unmount` | qiankun 取生命周期的契约 |
| 打成 UMD | `output.libraryTarget: 'umd'` | 否则报 “export the functional lifecycles” |
| 库名唯一 | `output.library: '${packageName}-[name]'` | 多子应用不撞、qiankun 定位导出 |
| chunk 全局唯一 | `output.chunkLoadingGlobal`（webpack4 `jsonpFunction`）：`webpackJsonp_${packageName}` | 避免多子应用 chunk 加载互相覆盖 |
| UMD 挂 window | `output.globalObject: 'window'` | 避免 `self` 在某些环境出错 |
| 修 publicPath | `__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__`（`public-path.js` 最先 import） | 嵌入后动态 chunk 路径不 404 |
| 判别独立/嵌入 | <code v-pre>window.__POWERED_BY_QIANKUN__</code> | 切路由 `base`、publicPath、是否自渲染 |
| 开 CORS | 资源服务器 `Access-Control-Allow-Origin` | qiankun 用 `fetch` 拉资源 |
| entry 末尾带 `/` | `entry: '//host/'` | 否则 publicPath 推断错 |
| activeRule 错开真实路径 | `activeRule` ≠ 子应用真实访问路径 | 否则自激活死循环 |

**常见报错**：`export lifecycles`（UMD/导出没对）、`died in LOADING_SOURCE_CODE`（entry 404/CORS/格式错）、多子应用随机失败（chunk 全局冲突）。详见 [HTML entry 与接入约束](./guide-line/html-entry-integration)。

## 五、Vite 方案表

| 路线 | 原理 | 局限 / 适用 |
| --- | --- | --- |
| **qiankun 2.x 原生** | import-html-entry「fetch 脚本回来 eval」 | **不支持 ESM 入口 → 接不了 Vite** |
| **`vite-plugin-qiankun`**（社区） | 伪装成 qiankun 认得的形式：注入全局标记、生命周期挂 window、开发态绕沙箱 | **沙箱基本失效**、非官方、生产额外配置——权宜之计 |
| **换 [wujie](../wujie/)** | iframe 沙箱，ESM 交浏览器原生执行 | 原生 Vite 友好 + 隔离更强——**Vite + 要隔离首选** |
| **换 [micro-app](../micro-app/)** | 支持 `<script type="module">` | 低侵入、原生 Vite 友好 |
| **[single-spa](../single-spa/) + import maps** | 原生 ESM 路线 | 要极致控制、自建底座、自理隔离 |
| **qiankun 3.0**（未 stable） | 新 loader：DOMParser + streaming 原生吃 ESM/Vite | 三年 rc、**别赌排期** |

根因：ESM 的专属语法 / 异步原生加载 / 强制严格模式（与 with 沙箱互斥）与 import-html-entry 的 eval 模型不兼容。详见 [Vite 与 ESM 之痛](./guide-line/vite-esm-pain)。

## 六、版本时间线表

| 时间 | 版本 / 节点 | 状态 |
| --- | --- | --- |
| 2023-11-15 | **2.10.16** | **`latest` 稳定版，事实停更线**（此后仅极小维护） |
| 2021-04 | 3.0 roadmap 发起（[#1378](https://github.com/umijs/qiankun/discussions/1378)） | 规划 |
| 2022-06 | 社区吐槽「一年多只做了个新 logo」 | 停滞 |
| 2024-09-18 | **3.0.0-rc.0** | 首个 rc（`@qiankunjs/*` 新架构） |
| 2026-02 | **3.0.0-rc.21** | **仍 rc、无 stable**；加 legacy API 兼容层 |
| 2026 | @scope 样式隔离 · `create-qiankun` 脚手架 | 复苏迹象 |

结论：**生产用 2.10.16**；3.0 三年难产、rc 未 stable，别等。3.0 重构方向（可插拔 `@qiankunjs/*` 模块、原生吃 ESM、`@scope` 样式、CSP）清晰但未落地。详见[演进与现状](./guide-line/evolution-status)。

## 权威链接

- [qiankun 官网](https://qiankun.umijs.org/) —— 指南/API/FAQ/Cookbook 总入口
- [Guide 指南](https://qiankun.umijs.org/guide) · [Getting Started](https://qiankun.umijs.org/guide/getting-started) —— 核心价值、快速上手、主/子应用接入
- [API](https://qiankun.umijs.org/api) —— `registerMicroApps`/`start`/`loadMicroApp`/`initGlobalState` 等全部签名
- [FAQ](https://qiankun.umijs.org/faq) —— 沙箱、样式隔离、UMD、publicPath、CORS 一手排障
- [Cookbook 实践](https://qiankun.umijs.org/cookbook) —— 路由模式、部署方案、1.x→2.x 升级
- [GitHub: qiankun](https://github.com/umijs/qiankun) · [Releases](https://github.com/umijs/qiankun/releases) —— 源码与版本状态核对源
- [3.0 Roadmap #1378](https://github.com/umijs/qiankun/discussions/1378) —— 3.0 架构规划一手讨论
- [import-html-entry](https://github.com/kuitos/import-html-entry) —— qiankun 2.x HTML entry 加载底层库
- [single-spa 官网](https://single-spa.js.org/) —— qiankun 的路由编排底座
- [MDN: CSS @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) —— 3.0 样式隔离新方向的原生能力

## 相关页

- [入门](./getting-started) —— qiankun 是什么、最小接入、主/子应用改造、与 single-spa 的关系
- [核心 API](./guide-line/core-api) / [沙箱实现](./guide-line/sandbox-impl) / [样式隔离](./guide-line/style-isolation) / [HTML entry 与接入约束](./guide-line/html-entry-integration) / [Vite 与 ESM 之痛](./guide-line/vite-esm-pain) / [演进与现状](./guide-line/evolution-status)
- [微前端核心机制](../mfe-mechanisms/) —— 沙箱/样式/通信/HTML entry/预加载的通论（本叶讲 qiankun 具体实现，通论在此）
- [single-spa](../single-spa/) —— qiankun 的路由编排底座（qiankun ≈ single-spa + HTML entry + 沙箱 + 样式隔离）
- [微前端基础](../mfe-basics/) —— 定义、判据、[2026 选型全景](../mfe-basics/guide-line/landscape-2026)
- [wujie](../wujie/) / [micro-app](../micro-app/) —— Vite/ESM 友好的替代方案（前向引用）
- [Vue 其他生态](/zh/frontend-framework/ui/vue/guide-line/other) —— qiankun/wujie/micro-app 的 Vue 接入实操
