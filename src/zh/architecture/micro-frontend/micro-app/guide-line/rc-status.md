---
layout: doc
outline: [2, 3]
---

# 1.0 RC 与现状

> 基于 micro-app 1.0（RC，`1.0.0-rc.32`／2026-06） · 核于 2026-07

## 速查

- micro-app **长期停留在 `1.0.0-rc`**——2021-06 建库，至今仍是 **1.0 的 RC（release candidate）**，未正式发布 1.0 稳定版
- 当前最新 **`1.0.0-rc.32`（2026-06-25）**；rc 序列**持续发版、大致月度节奏**（有时一月两版、有时隔数月），是「**持续活跃但 1.0 长期 RC**」的典型样本
- **京东开源背书**：`jd-opensource` 出品（前身 micro-zoe），约 **6.2k star**、京东内部大规模使用，**并非 RC 就不成熟**——RC 更像是「稳定在用、版本号没跳」
- **亮点能力·虚拟路由系统**：拦截浏览器路由、给子应用一套隔离的 `location`/`history`，**5 种 `router-mode`**（`search`/`native`/`native-scope`/`pure`/`state`）+ `microApp.router` 编排 + 路由守卫
- **ESM/Vite 原生友好**：不像 [qiankun](../../qiankun/) 2.x 卡在 `import-html-entry` 接不了 `type=module`，micro-app 亲和 Vite/ESM 子应用
- **选型定位**：**接入成本最低**（一行 `<micro-app>` 标签）+ **组件化用法** + 双沙箱可选，甜区是「快速试点 / 渐进接入 / Vite 主力」
- **与 [wujie](../../wujie/) 对比**：同属「组件化 + Vite 友好」阵营；micro-app 默认 **with 软沙箱**（轻、成本低）、wujie 默认 **iframe 物理隔离**（隔离最强、有 iframe 开销）——micro-app 也能 `iframe` 属性切到强隔离
- **1.0 持续增强**：iframe 沙箱增强（Document 禁用、window 事件逃逸）、Worker 代理、`file://`（Electron）、CSS `:root` 变量、Tailwind CSS 4 兼容等
- **局限**：1.0 未转正的心理门槛、默认 with 沙箱是软隔离、**主应用样式仍下渗子应用**、依赖 Proxy（不可 polyfill）
- 本页是**选型与现状收口**；能力细节回各指南页，速查表汇总见 [参考](../reference)

## 一、1.0 长期 RC 的时间线

micro-app 一个绕不开的话题：**它长期是 `1.0.0-rc`，没有「正式的 1.0」**。2021-06-24 建库，此后版本号一直在 `1.0.0-rc.x` 上递增，至今（2026-07）最新为 `1.0.0-rc.32`。近期发版节奏：

| 版本 | 日期 | 备注 |
| --- | --- | --- |
| `1.0.0-rc.28` | 2025-12-11 | 持续迭代 |
| `1.0.0-rc.29` | 2026-01-30 | 持续迭代 |
| `1.0.0-rc.30` | 2026-04-20 | 持续迭代 |
| `1.0.0-rc.31` | 2026-06-09 | 持续迭代 |
| **`1.0.0-rc.32`** | **2026-06-25** | **当前最新**（iframe 沙箱增强、Tailwind 4 兼容等） |

节奏上**大致月度、有时一月两版**（如 2025-05 的 rc.25/rc.26、2026-06 的 rc.31/rc.32），也有隔几个月的间隔。要点是：**「RC」在这里不等于「不稳定 / 别用」**——它更像一个「实际稳定、被大规模用着、只是版本号迟迟不跳到正式」的状态。选型时把它当成一个**活跃维护中的成熟框架**看即可，只是要接受「依赖一个 `rc` 版本号」这件事。

## 二、京东生态背书与活跃度

micro-app 由**京东**开源（GitHub 组织 `jd-opensource`，早期名为 micro-zoe），是京东内部微前端的主力方案之一：

- **规模**：约 **6.2k star**、600+ fork，2021 年至今持续提交与发版。
- **背书**：京东多条业务线在用——「大厂内部大规模生产验证」是它区别于个人项目的可靠性来源。
- **生态**：配套有 devtools 调试工具、插件系统、`prefetch` 预加载、UMD/`keep-alive` 等能力。

官方还提供**逐框架的接入指南**，主/子应用两侧都覆盖到，进一步降低「不同框架怎么接」的摸索成本：

| 框架 | 官方指南 |
| --- | --- |
| **Vue**（2/3） | 主/子应用接入、`public-path`、路由 base、`unmount` 钩子 |
| **React** | 主/子应用接入、`data` 属性绑定、生命周期 |
| **Angular** | 主/子应用接入、路由与打包配置 |
| **Next.js / Nuxt.js** | SSR 场景（配 `ssr` 属性）的接入 |
| **Vite** | 子应用零沙箱插件接入（对比 qiankun 需社区插件） |

结合上一节：**长期 RC + 大厂在用 + 持续发版 + 全框架指南** 放一起，画像就清楚了——这是一个「务实、稳定、只是不执着于版本号仪式」的框架。

## 三、亮点能力：虚拟路由系统

micro-app 相对同类的一个突出能力是**内建的虚拟路由系统**：它**拦截浏览器路由事件、为子应用定制 `location`/`history`**，让子应用在一个与主应用隔离的「虚拟路由环境」里跑，互不干扰。核心是 **5 种 `router-mode`**：

| `router-mode` | 行为 |
| --- | --- |
| `search`（默认） | 子应用路由**投影到主应用 URL 的 query** 上 |
| `native` | 去掉路由隔离，子/主应用**共享浏览器路由**、可直接跳转 |
| `native-scope` | 类 `native`，但子应用域名**指向子应用自己**而非主应用 |
| `pure` | 子应用**完全脱离浏览器路由**——不改 URL、不进历史栈 |
| `state` | 用 `history.state` 记录路由、**不改地址栏**（比 iframe 式路由更干净） |

配套 `microApp.router` 提供命令式编排（`push`/`replace`/`go`/`back`/`forward`）、`setDefaultPage`、路由守卫 `beforeEach`/`afterEach`、`encode`/`decode`、`attachToURL` 等——主应用可直接驱动子应用导航，子应用路由变化也能被主应用感知。这套系统让「主应用统一管路由、子应用各自隔离」成为开箱能力（与[数据通信](./data-communication)的「传值」职责分离）。

## 四、ESM / Vite 友好与资源处理

qiankun 2.x 最大的痛点是 `import-html-entry` 的 eval 执行模型**接不了 `type=module`**，导致 Vite/ESM 子应用要么沙箱失效、要么上社区插件（详见 [qiankun·Vite 之痛](../../qiankun/guide-line/vite-esm-pain)）。micro-app **原生亲和 Vite/ESM**——这与 [wujie](../../wujie/) 一样，是 2026 年选型时**「子应用用 Vite」**场景下相对 qiankun 的关键优势。对新项目、Vite 主力的团队，这一条往往是把 micro-app/wujie 排在 qiankun 前面的直接理由。

配套还有两个降低接入摩擦的细节：

- **资源地址补全**：子应用被 `fetch` 到主应用上下文后，其中的相对资源路径（图片、字体、异步 chunk 等）本会因「宿主变了」而失效。micro-app 默认**自动把相对地址补全为子应用的绝对地址**，省掉大量手工配置；确有需要时用 `disable-patch-request` 关闭。这与 [with 沙箱](./with-sandbox) 里的 <code v-pre>__MICRO_APP_PUBLIC_PATH__</code> 一起，构成「子应用资源零改动或极少改动」的基础。
- **`globalAssets` 共享资源**：主应用可通过 `microApp.start({ globalAssets })` 预声明多个子应用共用的 JS/CSS，避免每个子应用重复加载同一份依赖——这是[依赖共享](../../mfe-mechanisms/guide-line/dependency-sharing)通论在 micro-app 里的一个轻量落点。

一句话：micro-app 不只是「能跑 Vite 子应用」，还在**资源加载这层替你把相对路径、公共依赖的坑填了**，进一步压低接入成本。

## 五、选型定位与 wujie 对比

micro-app 的选型画像可以一句话概括：**「用最低接入成本拿组件化微前端，隔离强度按需在 with / iframe 之间选」**。和最接近的对手 [wujie](../../wujie/) 并排看：

| 维度 | **micro-app** | [wujie](../../wujie/) |
| --- | --- | --- |
| **出品** | 京东 | 腾讯 |
| **容器** | `<micro-app>` CustomElement（默认非 Shadow DOM） | `<wujie>` WebComponent（`shadowRoot`） |
| **默认沙箱** | **with 软沙箱**（轻、成本低） | **iframe 物理隔离**（最强） |
| **强隔离** | 可选 `iframe` 沙箱 | 天生 iframe |
| **接入成本** | **最低（一行标签）** | 低（组件化） |
| **保活** | `keep-alive` 属性 | `alive: true` |
| **Vite/ESM** | 原生友好 | 原生友好 |
| **版本** | **1.0 长期 RC** | v1 沉寂后 **2026-06 v2.0 复活** |

选型直觉：**要最低接入成本、快速试点、内部可信子应用** → micro-app（默认 with 沙箱够用，必要时切 iframe）；**要最强隔离、复杂/不可信子应用** → wujie；**存量 webpack、生态最大** → qiankun。三者不是替代关系，是「场景匹配」——micro-app 的位置是「**接入最轻的那一个**」。

## 六、局限与风险

务实地列清楚 micro-app 的短板，避免选型踩坑：

- **1.0 未转正**：长期 `rc` 版本号是个心理/合规门槛（有的团队规范不允许依赖 `rc`）——虽然实际稳定，但要能接受。
- **默认软隔离**：with 沙箱是「防意外不防恶意」的软隔离，隔离强度不及 iframe/wujie；强隔离诉求要显式开 [iframe 沙箱模式](./iframe-sandbox-mode)（换来开销与同域约束）。
- **主应用样式下渗**：scopedcss 只圈住子应用样式，**主应用全局样式仍会影响子应用**（见 [元素与样式隔离](./element-style-isolation)），需主应用样式收敛配合。
- **with 沙箱的坑**：顶层 `var`/`function` 不挂 window（见 [with 沙箱](./with-sandbox)），个别三方库要额外处理。
- **依赖 Proxy**：`Proxy` 不可 polyfill，必须运行环境原生支持（除 IE 外的现代浏览器都满足）。

## 七、近期迭代看维护活跃度

「长期 RC」容易让人误判为「停更」，但看近期 rc 的实际改动，micro-app 仍在**持续跟进现代前端生态与真实业务场景**——这比版本号更能说明它的健康度：

| 方向 | 近期迭代内容 |
| --- | --- |
| **iframe 沙箱增强** | Document 禁用、window 事件逃逸修复——把可选的 [iframe 沙箱模式](./iframe-sandbox-mode) 打磨得更可用 |
| **运行环境扩展** | **Worker 代理**（Web Worker 也纳入沙箱回收）、**`file://` 协议**支持（Electron 离线场景） |
| **样式生态跟进** | CSS `:root` 变量处理、**Tailwind CSS 4 兼容** |
| **兼容性修复** | TypedArray 支持、Firefox `caretRangeFromPoint` 支持 |

这些改动的共同点是**「跟着真实业务踩的坑走」**：Electron 离线、Worker、Tailwind 4、Firefox 光标 API——都是实际项目里会遇到的问题。一个「跟得上 Tailwind 4、修得动 Firefox 边角 API」的 RC，工程上完全可以当稳定框架用。选型时真正要评估的不是「它叫 rc」，而是「**这套接入方式、这套隔离强度、这套生态，配不配我的场景**」——这正是前六节回答的问题。

## 小结

micro-app 是**京东开源、长期停在 `1.0.0-rc`（当前 rc.32／2026-06）但持续活跃、大厂大规模在用**的微前端框架——「RC」在这里等于「稳定在用、版本号没跳」，选型时当成熟框架看即可。它的差异化价值是**接入成本最低（一行 `<micro-app>` 标签）+ 组件化用法 + 内建虚拟路由系统 + Vite/ESM 友好 + with/iframe 双沙箱可选**；对手 wujie 靠 iframe 拿最强隔离，micro-app 靠 with 软沙箱拿最低成本、必要时切 iframe。局限是 1.0 未转正、默认软隔离、主应用样式下渗、依赖 Proxy。至此本叶的定位、接入、CustomElement 容器、双沙箱、双隔离、通信、现状都讲完了——所有属性/API/对比/版本的**速查汇总**，见 [参考](../reference)。
