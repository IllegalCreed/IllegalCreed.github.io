---
layout: doc
---

# Module Federation

Module Federation（模块联邦，简称 **MF**）把「一个应用在**运行时**加载另一个独立部署应用所导出的模块」标准化成了一套架构方案。它由 Zack Jackson（@ScriptedAlchemy）在 webpack 5 时代提出，**2024-04 由字节跳动 Web Infra 团队 + Zack Jackson 从 webpack 里 fork 出来、重设计为独立项目**（[module-federation.io](https://module-federation.io/)）——原本内嵌在 webpack 里的运行时能力被抽成独立 SDK，从此「不再是 webpack 编译期专属」。定位一句话：MF 做的是**模块级联邦**（module-level）——共享的是组件 / 工具函数 / store 这种**模块粒度**，而不是 [qiankun](../qiankun/) / [wujie](../wujie/) 那种「整应用挂载」的**应用级组合**；它**没有沙箱**，联邦模块与宿主跑在同一个 `window` 里，因此**更轻但需要团队自律**。到 2026 年，MF 2.0 已是微前端领域的**事实主线与最活跃项目**（`@module-federation/enhanced` **v2.6.x**、月度迭代、横跨 webpack / Rspack / Vite / Rollup / Metro），「MF = webpack 插件」是过时认知。**边界**：`exposes`/`remotes`/`shared` 的**插件配置语法**已在[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)讲透，依赖共享**通论**在[核心机制 · 依赖共享三路线](../mfe-mechanisms/guide-line/dependency-sharing)；本叶**只讲 MF 作为微前端架构的架构层**——运行时 vs 构建时组合、shared 版本治理、2.0 运行时化生态、Native Federation、与 qiankun 系的选型，配置细节一律**链接不复述**。

## 概述

- **本质**：MF 是「**JavaScript 应用去中心化**的架构模式（类比服务端微服务）」——每个应用既可作 **remote**（生产者，导出模块）又可作 **host**（消费者，加载模块），运行时按需拉取对方产物中的模块，天然支持**双向联邦**、无中心编排者。
- **模块级 ≠ 应用级**：MF 共享的是**模块**（一个 React 组件、一个 `add()` 函数、一个 Pinia store），不是整个子应用。这与 qiankun/wujie「按路由挂载整应用 + 沙箱隔离」是**两个物种**——MF 更像「跨应用的动态 `import()`」。
- **MF 2.0 = 运行时化**：2024-04 从 webpack fork 后，核心能力落到 **Runtime SDK**（`@module-federation/enhanced/runtime`）——`createInstance` / `registerRemotes` / `loadRemote` 可在**无任何构建插件**的纯运行时里动态注册和加载 remote，配合 **mf-manifest.json** 协议与**运行时插件系统**，彻底摆脱「必须 webpack 编译期织入」的束缚。
- **shared 是最大的架构变量**：跨应用共享 React/Vue 这类依赖时，MF 用**运行时 semver 协商**——`singleton` 冲突时**最高版本获胜、低版本告警**，你实际跑的版本由**页面里版本最高的参与者**决定（lockfile 说了不算）。这是治理重点，不是配置细节。
- **2026 现状**：`@module-federation/enhanced` **v2.6.x**、月度迭代，官方支持已远超 webpack（Rspack 内置、官方 `@module-federation/vite` 活跃、Rollup/Rsbuild/Metro），社区 `originjs/vite-plugin-federation` 已停滞被取代；由**字节 Web Infra + Zack Jackson** 联合维护，是当下最活跃的微前端基础设施。

## 本叶地图

- [入门](./getting-started) —— MF 解决什么（模块级共享 vs 应用级组合）、host/remote 最小心智、本叶为何只讲架构层、与 qiankun 系的定位差异
- [联邦概念与心智模型](./guide-line/federation-concepts) —— host/remote/双向联邦、模块级复用 vs 应用级复用、运行时组合 vs 构建时组合、remoteEntry/manifest 的角色（架构视角）
- [shared 版本治理](./guide-line/shared-governance) —— singleton 最高版本获胜 + 低版本告警、requiredVersion/strictVersion 取舍、双端声明原则、版本地狱与 lockfile 失效（架构决策视角）
- [MF 2.0 运行时化](./guide-line/mf2-runtime) —— 从 webpack fork 独立、Runtime SDK、`registerRemotes` 动态注册、mf-manifest.json 协议、运行时插件机制
- [MF 2.0 生态](./guide-line/mf2-ecosystem) —— 类型联邦、Chrome DevTools、预加载/请求瀑布优化、跨构建工具支持（Rspack 内置 / 官方 Vite 插件 / originjs 已停滞）
- [Native Federation](./guide-line/native-federation) —— MF 心智的「浏览器原生」实现：ESM + Import Maps + esbuild、bundler-agnostic、Angular 官方背书（Manfred Steyer）、与 webpack MF 对照
- [与应用级方案的选型](./guide-line/vs-qiankun-selection) —— MF（模块级/无沙箱/需自律）vs qiankun/wujie（应用级/带沙箱）、无沙箱的含义与代价、混用模式、选型决策树
- [参考](./reference) —— 联邦概念 / shared 策略 / 1.0 vs 2.0 / 生态工具 / Native Federation 对照 / 选型决策六张表 + 权威链接

## 文档地址

- [Module Federation 官网](https://module-federation.io/) —— 概念、Guide、Configuration、Runtime、生态一手总入口
- [Guide · Introduction](https://module-federation.io/guide/start/index.html) —— MF 是什么、host/remote、适用场景
- [Configuration · Shared](https://module-federation.io/configure/shared.html) —— shared 版本协商全部字段（本叶取治理策略、配置见 webpack 章）
- [Guide · Runtime](https://module-federation.io/guide/basic/runtime.html) —— Runtime SDK、`registerRemotes`/`loadRemote` 动态注册
- [Blog · MF 2.0 公告](https://module-federation.io/blog/announcement.html) —— 从 webpack fork、运行时化、脱离构建工具
- [GitHub: module-federation/core](https://github.com/module-federation/core) · [Releases](https://github.com/module-federation/core/releases) —— 源码与版本状态（v2.6.x、月度迭代）核对源

## 幻灯片地址

- <a href="/SlideStack/module-federation-slide/" target="_blank">Module Federation</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=module-federation" target="_blank" rel="noopener noreferrer">Module Federation 测试题</a>
