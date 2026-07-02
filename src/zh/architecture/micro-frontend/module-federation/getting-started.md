---
layout: doc
outline: [2, 3]
---

# 入门：Module Federation 是什么与为什么

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- MF 是「**JavaScript 应用去中心化**的架构模式（类比服务端微服务）」——把「运行时加载另一个独立部署应用导出的模块」标准化，官方定位「减少重复、提升可维护性、降低应用体积、提升性能」。
- **一句话记牢**：MF = **跨应用的动态 `import()`**。宿主在运行时去另一个应用的产物里 `import` 一个**模块**（组件/函数/store），而不是把整个子应用挂上来。
- **两个角色**：**remote**（生产者 / producer，用 `exposes` 导出模块）、**host**（消费者 / consumer，用 `remotes` 声明去哪加载）；官网也用 **Provider / Consumer** 指同一对概念。
- **双向联邦**：同一个应用可**同时是 host 又是 remote**——没有中心编排者、没有 shell/child 的刚性层级，这是 MF 区别于 [single-spa](../single-spa/) 的结构特征。
- **模块级 vs 应用级**是理解 MF 的第一分水岭：MF 共享**模块粒度**（去重一份 React、复用一个设计系统组件）；[qiankun](../qiankun/)/[wujie](../wujie/) 组合**应用粒度**（按路由挂载整子应用 + 沙箱隔离）。
- **MF 没有沙箱**：联邦模块与宿主跑在**同一个 `window`**、共享同一份全局与 DOM——**更轻**（无 Proxy/iframe 开销）但**需要自律**（命名不撞、CSS 约定、别污染全局），细节见[与应用级方案的选型](./guide-line/vs-qiankun-selection)。
- **运行时组合 vs 构建时组合**：MF 2.0 把两者都做成一等公民——构建时用插件改写 `import`，运行时用 SDK（`registerRemotes`）动态注册，remote 清单可来自服务端/配置中心。
- **remoteEntry / mf-manifest.json** 是联邦的「目录」：remote 暴露一个入口清单，列出它 `exposes` 了什么、`shared` 了什么依赖、chunk 与类型信息，host 运行时先取这张清单再按需拉模块。
- **shared 是最大架构变量**：跨应用共享依赖靠**运行时 semver 协商**，`singleton` 冲突时**最高版本获胜、低版本告警**——治理视角见[shared 版本治理](./guide-line/shared-governance)。
- **2026 现状**：MF 2.0（2024-04 从 webpack fork 独立）是微前端**事实主线**，`@module-federation/enhanced` **v2.6.x** 月度迭代，横跨 webpack/Rspack/Vite/Rollup/Metro，字节 Web Infra + Zack Jackson 维护。
- **本叶边界**：`exposes`/`remotes`/`shared` 的**插件配置语法**已在[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)讲透，本叶**只讲架构层**，配置一律链接不复述。
- 起步顺序：先读本页建立「模块级 + 运行时 + 无沙箱」的心智 → 再进[联邦概念与心智模型](./guide-line/federation-concepts)吃透 host/remote/双向联邦与组合时机。

## 一、MF 解决什么问题

微前端要解决的通用问题（技术栈无关、独立部署、增量升级）在[微前端基础](../mfe-basics/)已定义清楚。MF 的**独特切入点**不在「怎么把多个应用拼成一个页面」，而在**「怎么让这些应用之间高效地共享代码」**。官方把价值主张写成四条：**减少代码重复、提升可维护性、降低应用整体体积、提升性能**，并点名三类场景：**大型应用、微前端架构、多团队协作**。

对比一下就清楚 MF 的定位偏移：

| 维度 | 应用级方案（qiankun/wujie） | Module Federation |
| --- | --- | --- |
| **组合粒度** | 整个子应用（一条路由一个 app） | **单个模块**（组件/函数/store） |
| **核心动作** | 挂载 / 卸载子应用（生命周期） | 跨应用 `import` 一个模块 |
| **隔离** | JS 沙箱 + 样式隔离（重） | **无沙箱**，同 `window`（轻，需自律） |
| **依赖共享** | 各应用自带 or import maps | **运行时 semver 协商**（shared） |
| **典型诉求** | 老系统渐进拆分、强隔离 | 团队间共享 UI/逻辑、去重大依赖 |

所以 MF 回答的问题是：**「五个应用都要用同一套设计系统组件、同一份 React——怎么让它们在运行时共享而不是各打各的？」** 这是**模块级共享**问题；而「把订单系统和商品系统拼进一个后台壳」是**应用级组合**问题。两者可以叠加（见第四节），但心智起点不同。

## 二、host / remote：最小心智

MF 里只有两个角色，且**可以由同一个应用兼任**：

- **remote（生产者）**：用 `exposes` 声明「我对外导出哪些模块」，构建产物里多出一个**入口清单**（`remoteEntry.js` / `mf-manifest.json`），像一张「导出目录」。
- **host（消费者）**：用 `remotes` 声明「我要从哪些 remote 加载模块」，运行时先取对方清单，再在**用到时**把模块拉过来执行。

最小心智可以浓缩成一行伪代码——它读起来就是「跨应用的动态 import」：

```ts
// host 侧：从名为 shop 的 remote 加载它 exposes 出来的 ./Button 模块
// （这行的构建插件配置见 webpack 章，本叶不复述语法）
const Button = await import("shop/Button");
```

`shop` 不是本地包，而是**另一个独立部署的应用**；`shop/Button` 是它用 `exposes` 暴露的模块。host 运行时通过 `shop` 的 remoteEntry 清单知道 `./Button` 存在、依赖了哪些 `shared`，然后按需加载。**没有中心注册表、没有 shell 编排**——host 直接点名要谁的什么模块。这就是「去中心化」的含义。

> **注意**：`exposes`（remote 导出什么）、`remotes`（host 从哪加载）、`shared`（共享哪些依赖）三块**插件配置的字段语法**，以及三大常见坑（子路径尾斜杠、eager、循环依赖），已在[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)逐字段讲过。本叶讲的是这套机制**在架构上意味着什么**，不重复配置。

## 三、为什么本叶只讲「架构层」

MF 的知识面被本知识库**刻意切成三块**，避免重复：

1. **插件配置语法**（`exposes`/`remotes`/`shared` 怎么写、三大坑）→ 已在 [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。
2. **框架接入代码**（React/Angular/Vue 里怎么拼生命周期与懒加载）→ 在各 UI 框架章。
3. **依赖共享通论**（externals+import maps / MF shared / 不共享 三路线的取舍）→ 在[核心机制 · 依赖共享三路线](../mfe-mechanisms/guide-line/dependency-sharing)。

**剩下的、也是本叶专属的**，是把 MF 当**一种微前端架构**来审视：它的组合心智（运行时 vs 构建时）、它把依赖共享的裁决搬到运行时带来的**治理**问题、2.0 运行时化重构出的**生态**、以及浏览器原生的平替 **Native Federation**、还有它与 qiankun 系在**架构本质**上的差异与**选型**。这些是配置文档和框架文档都不会讲的「为什么」与「怎么选」。

## 四、与 qiankun 系的定位差异（先建立坐标）

初学最容易把 MF 和 qiankun 当竞品对立，其实它们**解决的层次不同**，甚至常**叠加使用**：

- **不是二选一**：成熟的大型微前端里，**用 single-spa/qiankun 做应用级编排（谁在什么路由挂载）、用 MF 做模块级依赖共享（大家共用一份 React 和设计系统）** 是常见组合。single-spa 官方也把「single-spa 编排 + MF 共享」列为可行模式（唯一红线：同一依赖别同时走两套解析，见[依赖共享](../mfe-mechanisms/guide-line/dependency-sharing)）。
- **本质差异在「隔离」**：qiankun/wujie 花大力气做沙箱与样式隔离，是因为它们要把**互不信任、技术栈各异的整应用**塞进同一页面；MF 假设**参与方是同一个组织、能协同约定**，于是**不做隔离、换取轻量**。「无沙箱」不是缺陷，是**定位选择**——代价是团队必须自律。
- **选型直觉**：要**强隔离**（老系统林立、CSS 混乱、每块技术栈不同）→ 应用级（[qiankun](../qiankun/)/[wujie](../wujie/)）；要**细粒度共享**（同技术栈、多团队共用组件/依赖、能自律）→ MF；两者都要 → 编排 + MF 叠加。完整决策树见[与应用级方案的选型](./guide-line/vs-qiankun-selection)。

## 五、一个具体场景：把设计系统联邦化

抽象的「模块级共享」放进一个具体场景最好懂。设想一个中后台被拆给五个团队（订单、商品、用户、报表、营销），它们**共用一套设计系统**（Button、Table、Modal…）和**同一份 React**。

**没有 MF 时**的两难：把设计系统做成 npm 包——升级一次要五个团队各自 `npm update` + 重新构建部署，**版本长期不齐**（订单用 v2.1、报表还在 v1.8，UI 不一致）；各自打包 React——用户下载五份 React。

**用 MF 时**：把设计系统做成一个 **remote**（`exposes` 出 Button/Table/Modal），把 React 声明为 **shared singleton**：

| 诉求 | MF 怎么落地 |
| --- | --- |
| 设计系统统一升级 | remote 重新部署，五个 host **运行时自动拿到新版组件**，无需各自发版 |
| React 只下载一份 | shared singleton，五个应用**运行时共用一个 React 实例** |
| 组件跨团队一致 | 大家 `import("design/Button")` 的是**同一份线上产物** |
| 灰度新版设计系统 | 用 `registerRemotes` 给部分用户注册新版 remote（运行期决策） |

这就是「模块级 + 运行时共享」的价值：**一处更新、处处生效，且真正共用一份依赖实例**——这是把设计系统做成 npm 包（构建期锁定版本）给不了的。代价也在同一处：五个应用共享一个 React 实例、同一个 `window`，**谁污染了全局大家一起遭殃**——所以 MF 要求团队自律（见[与应用级方案的选型](./guide-line/vs-qiankun-selection)）。

## 六、四个常见误解速澄清

- **「MF 就是 webpack 插件」** ✗ —— 2.0 已从 webpack fork 成独立运行时，横跨 Rspack/Vite/Rollup/Metro（见 [MF 2.0 运行时化](./guide-line/mf2-runtime)）。
- **「MF 和 qiankun 二选一」** ✗ —— 一个管模块共享、一个管应用编排，常**叠加**使用（见[与应用级方案的选型](./guide-line/vs-qiankun-selection)）。
- **「MF 有沙箱隔离」** ✗ —— MF **无沙箱**，联邦模块与宿主同 `window`；隔离靠团队自律，不是框架兜底。
- **「shared 配了就一定共用一份」** ✗ —— 必须**双端声明**且版本能协商上；只一端声明会静默双份依赖（见 [shared 版本治理](./guide-line/shared-governance)）。

## 七、一分钟历史脉络

| 时间 | 节点 |
| --- | --- |
| 2020 | webpack 5 内置 Module Federation（Zack Jackson 提出），MF 1.0 时代——此时 **MF 确实 = webpack 特性** |
| 2024-04 | **MF 2.0 公告**：字节 Web Infra + Zack Jackson 把 MF 从 webpack **fork 成独立项目**，运行时能力抽成 SDK |
| 2024 → 2026 | 生态外扩：Rspack 内置、官方 Vite 插件、类型联邦、DevTools；横跨 webpack/Rspack/Vite/Rollup/Metro |
| 2026-06 | `@module-federation/enhanced` **v2.6.x**、月度迭代，微前端领域**事实主线** |

这条线解释了为什么「MF = webpack 插件」是过时认知：那句话停在 2020 的 1.0 时代。2024 之后的 MF 是一个**独立的微前端运行时**，webpack 只是它支持的众多打包器之一——这也是本叶把「配置」（webpack 章）与「架构」（本叶）分开讲的原因：前者是某个打包器的用法，后者才是 MF 作为架构方案的本体。

## 小结

Module Federation 是**模块级、运行时、无沙箱**的联邦方案——把「跨应用共享一个模块」标准化成「跨应用的动态 `import()`」，用 host/remote 两个可兼任的角色替代中心编排，用运行时 semver 协商替代集中裁定。它与 qiankun 系不是竞品而是**不同层次**，常叠加使用。理解了「模块级 + 无沙箱 + 运行时」这三个定位词，下一步是把它们展开成完整的心智模型——host/remote/双向联邦、模块级复用 vs 应用级复用、运行时组合 vs 构建时组合、remoteEntry 的角色：从[联邦概念与心智模型](./guide-line/federation-concepts)开始。
