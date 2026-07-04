---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 micro-app 1.0（RC，`1.0.0-rc.32`／2026-06） · 核于 2026-07

## 速查

- 本页汇总七张表：**标签属性** / **全局配置与 API** / **双沙箱对比** / **生命周期事件** / **元素与样式隔离** / **数据通信** / **版本状态**
- 一句话定位：micro-app = 京东开源、**<code v-pre>&lt;micro-app&gt;</code> CustomElement 容器**、**接入成本最低**（一行标签）、默认 **with 沙箱** + 可选 **iframe 沙箱**
- 接入一句话：主应用 `microApp.start()` 一次 + <code v-pre>&lt;micro-app name url&gt;</code> 标签；子应用**开 CORS + 配 <code v-pre>__webpack_public_path__</code>**，基本零生命周期改造
- 沙箱一句话：**with（默认，`Proxy`+`with` 软隔离、轻）/ iframe（`iframe` 属性，物理隔离、强、有开销）**
- 隔离一句话：**元素隔离**（DOM 作用域、`removeDomScope` 逃逸）+ **scopedcss 样式隔离**（`micro-app[name=x]` 前缀、可 4 级关、`shadowDOM` 可选）；**主应用样式仍下渗**
- 通信一句话：**`data`/`setData`（下行）/ `dispatch`（上行）/ `GlobalData`（全局）/ `EventCenterForMicroApp`（关沙箱/UMD）**
- 路由一句话：**虚拟路由系统**，5 种 `router-mode`（`search`/`native`/`native-scope`/`pure`/`state`）+ `microApp.router` 编排
- 版本一句话：**1.0 长期 RC**（`1.0.0-rc.32`／2026-06-25，持续发版、大致月度），京东背书、约 6.2k star

## 一、核心 <code v-pre>&lt;micro-app&gt;</code> 标签属性表

| 属性 | 作用 | 默认 |
| --- | --- | --- |
| `name` | 子应用**唯一标识**，须字母开头 | **必填** |
| `url` | 子应用地址（指向 `index.html`） | **必填** |
| `baseroute` | 子应用基础路由，注入为 <code v-pre>__MICRO_APP_BASE_ROUTE__</code> | `''` |
| `iframe` | 开启 **iframe 沙箱**（默认 with 沙箱） | `false` |
| `keep-alive` | 保活：卸载不销毁、推入后台 | `false` |
| `ssr` | SSR 模式 | `false` |
| `inline` | 使用内联 script（便于调试） | `false` |
| `destroy` | 卸载时删除缓存资源 | `false` |
| `clear-data` | 卸载时清空通信缓存数据 | `false` |
| `default-page` | 子应用初始渲染页面 | `''` |
| `router-mode` | 虚拟路由模式（见版本/路由说明） | `search` |
| `keep-router-state` | 卸载时保留子应用路由状态 | `false` |
| `disable-scopecss` | 关闭样式隔离 | `false` |
| `disable-sandbox` | 关闭 JS 沙箱（**不推荐**） | `false` |
| `disable-memory-router` | 关闭虚拟路由系统 | `false` |
| `disable-patch-request` | 关闭请求地址自动补全 | `false` |
| `shadowDOM` | 用真 Shadow DOM 做样式隔离（可选） | `false` |
| `fiber` | fiber 模式，异步执行 JS | `false` |
| `exclude` / `ignore` | 命中元素被删除 / 放行不处理（如 JSONP） | — |

属性写在标签上（单应用）或传给 `microApp.start({...})`（全局默认，key 用小驼峰或连字符）。

## 二、全局配置与核心 API 表

```js
// 全局启动与配置（节选）
microApp.start({
  iframe: true, // 全局 iframe 沙箱
  iframeSrc: location.origin, // iframe 沙箱初始化空页面
  inline: true,
  destroy: true,
  ssr: true,
  disableScopecss: true, // 或 'disable-scopecss': true
  disableSandbox: true, // 或 'disable-sandbox': true
  "keep-alive": true,
  "disable-memory-router": true,
  "keep-router-state": true,
  "disable-patch-request": true,
  lifeCycles: {}, // 全局生命周期
  plugins: {}, // 插件系统
  fetch(url, options) {}, // 自定义 fetch（如加 credentials）
  globalAssets: { js: [], css: [] }, // 全局共享资源
});
```

| API | 归属 | 作用 |
| --- | --- | --- |
| `microApp.start(options)` | 主应用 | 启动 micro-app、注册 <code v-pre>&lt;micro-app&gt;</code>、传全局配置 |
| `microApp.setData(name, data, cb)` / `forceSetData` | 主应用 | 向子应用下发数据（下行） |
| `microApp.getData(name)` | 主应用 | 读取子应用数据 |
| `microApp.addDataListener(name, fn, autoTrigger)` | 主应用 | 订阅子应用上报数据 |
| `microApp.setGlobalData(data)` / `getGlobalData` / `addGlobalDataListener` | 双端 | 全局数据读写与订阅 |
| `microApp.clearData(name)` / `clearGlobalData` | 主应用 | 清理数据 / 全局数据 |
| `removeDomScope(bool)` | 双端 | 元素作用域解绑 / 恢复 |
| `EventCenterForMicroApp(name)` | 主应用 | 关沙箱/UMD 多实例的独立事件中心 |
| `microApp.router.push/replace/go/back/forward` | 双端 | 虚拟路由编排（导航） |
| `microApp.router.beforeEach/afterEach` | 主应用 | 路由守卫 |
| `microApp.router.setDefaultPage/getDefaultPage` | 主应用 | 子应用默认页 |
| `microApp.router.attachToURL/attachAllToURL` | 主应用 | 手动把子应用路由同步到 URL |
| 子应用 `window.microApp.*` | 子应用 | `getData`/`addDataListener`/`dispatch`/`router`/`removeDomScope` 等 |

## 三、双沙箱对比表

| 维度 | with 沙箱（默认） | iframe 沙箱（`iframe` 属性） |
| --- | --- | --- |
| **机制** | `with(proxyWindow)` + `Proxy` 拦截 | 同域 iframe 原生上下文 |
| **隔离性质** | 软隔离（防意外不防恶意） | **物理隔离** |
| **`window`/`document`/`location`/`history`** | 代理/部分共享 | **各自独立、原生** |
| **顶层变量挂 window** | ❌ 不挂（经典坑） | ✅ 接近原生 |
| **性能/开销** | 好、无 iframe 开销 | 有 iframe 创建/常驻开销 |
| **兼容性** | 广（除 IE，须 Proxy） | 同域约束 + 部分 API 差异 |
| **取真实对象** | `window.rawWindow` / `rawDocument` | — |
| **注入变量** | <code v-pre>__MICRO_APP_ENVIRONMENT__</code> / <code v-pre>__MICRO_APP_NAME__</code> / <code v-pre>__MICRO_APP_PUBLIC_PATH__</code> / <code v-pre>__MICRO_APP_BASE_ROUTE__</code> / <code v-pre>__MICRO_APP_BASE_APPLICATION__</code> | 同左 |
| **初始化坑** | 顶层变量不挂 window | 误载主应用资源（`iframeSrc` 空页 / `window.stop()`） |

详见 [with 沙箱](./guide-line/with-sandbox) 与 [iframe 沙箱模式](./guide-line/iframe-sandbox-mode)。

## 四、生命周期事件表

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `created` | 元素初始化后、**加载资源前** | 打点、loading |
| `beforemount` | 资源加载完、**渲染前** | 注入初始数据 |
| `mounted` | 子应用**渲染结束** | 隐藏 loading、通知就绪 |
| `unmount` | 子应用**卸载时** | 清理主应用副作用 |
| `error` | 加载/渲染出错（**仅渲染终止型**） | 兜底 UI、上报 |
| `beforeshow`（keep-alive） | 保活应用**回前台前** | 子应用 `appstate-change` 监听 |
| `aftershow`（keep-alive） | 保活应用**已展示** | 同上 |
| `afterhidden`（keep-alive） | 保活应用**入后台** | 同上 |

监听：元素上 `addEventListener('mounted', …)` / 框架 `@mounted`；或全局 `microApp.start({ lifeCycles: { mounted(e, appName){} } })`。子应用保活状态：`window.addEventListener('appstate-change', e => e.detail.appState)`。详见 [CustomElement 容器](./guide-line/custom-element)。

## 五、元素与样式隔离表

| 隔离 | 机制 | 关闭 / 调整 |
| --- | --- | --- |
| **元素隔离** | 代理子应用 DOM 查询，圈进 <code v-pre>&lt;micro-app&gt;</code> 边界（主可访子、子不可访主） | `removeDomScope(true/false)` 临时解绑/恢复 |
| **样式隔离（scopedcss，默认开）** | 选择器加前缀 `micro-app[name=x] .test{}` | 全局 `disableScopecss` / 属性 `disable-scopecss` |
| ·文件级关 | `/*! scopecss-disable */ … /*! scopecss-enable */` | 注释须 `/*!` 开头（躲压缩） |
| ·选择器级关 | `/*! scopecss-disable .a, .b */` | — |
| ·行级关 | `/*! scopecss-disable-next-line */` | — |
| **shadowDOM（可选）** | 用真 Shadow DOM 承载、样式强封闭 | 有第三方弹窗逃逸等代价，非默认 |
| **主应用样式下渗** | scopedcss 管不到主应用 → **主应用全局样式仍影响子应用** | 主应用样式收敛 + 子应用 CSS Modules |

详见 [元素与样式隔离](./guide-line/element-style-isolation)。

## 六、数据通信表

| 方向 | 主应用侧 | 子应用侧 |
| --- | --- | --- |
| **父 → 子（下行）** | <code v-pre>&lt;micro-app :data&gt;</code> / `microApp.setData(name, data, cb)` / `forceSetData` | `window.microApp.getData()` / `addDataListener(fn, autoTrigger)` |
| **子 → 父（上行）** | 元素 `datachange` 事件 / `microApp.addDataListener(name, fn)` / `getData(name)` | `window.microApp.dispatch(data, cb)` / `forceDispatch` |
| **全局广播** | `microApp.setGlobalData` / `getGlobalData` / `addGlobalDataListener` | `window.microApp.setGlobalData` / `getGlobalData` / `addGlobalDataListener` |
| **独立事件中心**（关沙箱/UMD） | `new EventCenterForMicroApp(name)` → `window.eventCenterForAppxx` | `window.eventCenterForAppxx.getData()` / `dispatch()` / `addDataListener()` |
| **清理** | `microApp.clearData(name)` / `removeDataListener` / `clearDataListener` | `window.microApp.clearData()` / `removeDataListener` |

**分工**：传值用通信 API，导航用 `microApp.router`。详见 [数据通信](./guide-line/data-communication)。

## 七、版本状态表

| 项 | 现状 |
| --- | --- |
| **最新版本** | `1.0.0-rc.32`（2026-06-25） |
| **版本形态** | **1.0 长期 RC**——2021-06 建库至今未发正式 1.0 |
| **发版节奏** | rc.x 持续发版，**大致月度**（有时一月两版、有时隔数月） |
| **出品方** | 京东开源 `jd-opensource`（前身 micro-zoe） |
| **热度** | 约 6.2k star、600+ fork，京东内部大规模在用 |
| **包名** | `@micro-zoe/micro-app` |
| **浏览器** | 除 IE 外全支持；须 **CustomElements（可 polyfill）+ Proxy（须原生）**；iOS 10+ / Android 5+ |
| **近期增强** | iframe 沙箱增强、Worker 代理、`file://`（Electron）、CSS `:root` 变量、Tailwind CSS 4 兼容 |

详见 [1.0 RC 与现状](./guide-line/rc-status)。

## 权威链接

- [micro-app 官网](https://jd-opensource.github.io/micro-app/) —— 定位、特性、在线演示总入口
- [快速开始](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/start) · [配置项](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/configure) —— 主/子应用接入、<code v-pre>&lt;micro-app&gt;</code> 全部属性与全局配置
- [沙箱](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/sandbox) · [元素隔离](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/dom-scope) · [样式隔离](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/scopecss) —— with/iframe 沙箱、DOM 作用域、scopedcss 一手说明
- [数据通信](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/data) · [虚拟路由](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/router) · [生命周期](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/life-cycles) —— 通信 API、`router-mode`、生命周期事件
- [GitHub: jd-opensource/micro-app](https://github.com/jd-opensource/micro-app) · [Releases](https://github.com/jd-opensource/micro-app/releases) —— 源码与 1.0 RC 版本状态核对源
- [MDN: Using custom elements](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_custom_elements) —— <code v-pre>&lt;micro-app&gt;</code> 自定义元素的原生基础

## 相关页

- [入门](./getting-started) —— micro-app 是什么、最小接入、CustomElement 容器心智、与 qiankun/wujie 的接入成本对比
- [CustomElement 容器](./guide-line/custom-element) / [with 沙箱](./guide-line/with-sandbox) / [iframe 沙箱模式](./guide-line/iframe-sandbox-mode) / [元素与样式隔离](./guide-line/element-style-isolation) / [数据通信](./guide-line/data-communication) / [1.0 RC 与现状](./guide-line/rc-status)
- [微前端核心机制](../mfe-mechanisms/) —— 沙箱/CSS 隔离/通信的通论（本叶讲 micro-app 具体实现，通论在此）
- [qiankun](../qiankun/) —— Proxy 软沙箱路线的对照（接入成本更高、生态更大） · [沙箱实现](../qiankun/guide-line/sandbox-impl) / [Vite 之痛](../qiankun/guide-line/vite-esm-pain)
- [wujie](../wujie/) —— 同走组件化 + Vite 友好路线，但默认 iframe 物理隔离（隔离更强、有 iframe 开销）
- [single-spa](../single-spa/) —— 只做路由编排的底座（micro-app 无需注册、不走此路） · [微前端基础](../mfe-basics/) —— 定义、判据、[2026 选型全景](../mfe-basics/guide-line/landscape-2026)
