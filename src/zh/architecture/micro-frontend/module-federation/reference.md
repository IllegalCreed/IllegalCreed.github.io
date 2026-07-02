---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- 本页汇总六张表：**联邦概念** / **shared 策略** / **MF 1.0 vs 2.0** / **生态工具** / **Native Federation 对照** / **选型决策**。
- 联邦概念一句话：**host/remote 可兼任 → 双向联邦**；共享**模块**（非应用）；**remoteEntry/mf-manifest.json** 是运行时「目录」；组合可**构建时**（编译写死）或**运行时**（`registerRemotes` 动态）。
- shared 策略一句话：**双端声明**才成交；**singleton = 最高版本获胜 + 低版本告警 + lockfile 失效**；治理光谱 `requiredVersion`（告警）→ `strictVersion`（拒绝）；`version-first`（版本最优但 remote 离线即炸）vs `loaded-first`（容错）。
- 1.0 vs 2.0 一句话：1.0 = **webpack 内置、构建期**；2.0 = **2024-04 从 webpack fork 独立、运行时 SDK、mf-manifest.json、类型联邦、DevTools、跨工具**。
- 生态一句话：**Rspack 内置**、官方 **`@module-federation/vite`** 取代停滞的 originjs、类型联邦补 TS、DevTools 可观测、`preloadRemote` 拍平瀑布。
- Native Federation 一句话：MF **心智**的浏览器原生实现（**ESM + Import Maps + esbuild**）、**bundler-agnostic**、Manfred Steyer / Angular 背书。
- 选型一句话：**共享「模块」→ MF（无沙箱、需自律）**；**隔离「应用」→ qiankun/wujie（带沙箱）**；都要 → 编排 + MF 叠加（同一依赖只走一套解析）。
- 版本一句话：`@module-federation/enhanced` **v2.6.x（2026-06、月度迭代）**，字节 Web Infra + Zack Jackson 维护，2026 微前端**事实主线**。

## 一、联邦概念表

| 概念 | 含义（架构视角） | 关键点 |
| --- | --- | --- |
| **host / 消费者** | 用 `remotes` 声明来源、运行时加载远程模块 | 可与 remote 由同一应用兼任 |
| **remote / 生产者** | 用 `exposes` 导出模块、产出入口清单 | 独立部署，改版 host 不必重构 |
| **双向联邦** | 同一应用**同时** host + remote | 对等网络、无 shell/child 层级 |
| **模块级复用** | 共享组件/函数/store（非整应用） | 同 realm、可共享 React 实例/context |
| **remoteEntry.js** | remote 的入口 + 加载器 | 两段式加载的「目录」 |
| **mf-manifest.json** | 2.0 结构化清单（exposes/shared/remotes/chunks/type） | 类型/预加载/DevTools/治理的公共数据源 |
| **share scope** | 运行时的公共依赖货架 | shared 副本注册在此、按 semver 协商 |
| **构建时组合** | 插件编译期改写 import、remote 写死 | 静态、可 tree-shake |
| **运行时组合** | `registerRemotes` 运行时注册 | 灰度/A-B/动态上下线 |

详见[联邦概念与心智模型](./guide-line/federation-concepts)。

## 二、shared 版本治理策略表

| 机制 | 行为 | 治理含义 |
| --- | --- | --- |
| **双端声明** | 生产/消费都要声明同一 `shareKey` 才共享 | 只一端声明 = 静默双份依赖（无报错） |
| **singleton** | 冲突时**加载最高版本、低版本方仅告警** | 实际版本由**最高参与者**定，**lockfile 失效**；React/Vue 必开 |
| **requiredVersion** | 低于范围 → **告警**后用可用版本 | 默认档：能跑但会漂 |
| **strictVersion** | 不满足 → **拒绝**：有 fallback 用之，否则**运行时抛错** | 把版本漂移**提前到联调/CI 暴露** |
| **eager** | 打进入口同步可用 | 免异步协商，代价入口膨胀、总被下载 |
| **shareStrategy: version-first**（默认） | 启动即拉全部 remote 保版本最优 | **任一 remote 离线 → 启动即炸** |
| **shareStrategy: loaded-first** | 复用已加载、按需再拉 | 版本非全局最优，换启动性能 + 容错 |
| **名单最小化** | 每个共享项 = 一份构建耦合（Fowler） | 从「不共享」起步，只共享大而全局的 |

机制通论见[核心机制 · 依赖共享三路线](../mfe-mechanisms/guide-line/dependency-sharing)，治理决策见[shared 版本治理](./guide-line/shared-governance)，字段语法见[webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。

## 三、MF 1.0 vs 2.0 对比表

| 维度 | MF 1.0 | MF 2.0 |
| --- | --- | --- |
| **载体** | **webpack 5 内置**特性 | **独立项目**（module-federation.io，2024-04 从 webpack fork） |
| **依赖构建工具** | 必须 webpack | **运行时 SDK，脱离构建工具** |
| **运行时 API** | 无独立 SDK | `@module-federation/runtime`：`createInstance`/`loadRemote`/`registerRemotes`/`preloadRemote` |
| **动态注册 remote** | 基本靠 hack | **`registerRemotes` 一等支持** |
| **清单** | 裸 `remoteEntry.js` | **mf-manifest.json**（结构化元信息） |
| **类型** | 手写 `.d.ts` | **类型联邦**（自动生成 + 实时同步） |
| **可观测** | 无 | **Chrome DevTools 插件** |
| **插件机制** | 无运行时插件 | **运行时插件系统**（加载生命周期钩子） |
| **跨构建工具** | 仅 webpack | webpack/**Rspack 内置**/Vite/Rollup/Metro… |
| **维护** | Zack Jackson（webpack 内） | **字节 Web Infra + Zack Jackson**，v2.6.x 月度迭代 |

详见 [MF 2.0 运行时化](./guide-line/mf2-runtime)。

## 四、MF 2.0 生态工具表

| 能力 | 做什么 | 要点 |
| --- | --- | --- |
| **类型联邦** | 自动生成/同步 remote 的 TS 类型 | 解决联邦模块类型丢失，DTS 插件 + manifest `types` |
| **Chrome DevTools** | 可视化联邦依赖图、config | 支持本地代理 + 热更新联调单个 remote |
| **preloadRemote** | 预取 remote 资源、拍平请求瀑布 | `resourceCategory`/`exposes`/`filter` 精准预取 |
| **Rspack** | 内置 MF | **v1.5 内置**，2.0 叠 `@module-federation/enhanced` |
| **@module-federation/vite** | Vite 官方 MF 插件 | **活跃**，接入官方 runtime；取代 originjs |
| **originjs/vite-plugin-federation** | 社区 Vite MF（旧） | **已停滞**（自造运行时、约一年未更、Vite 7 不兼容） |
| **框架集成** | Next.js/Modern.js/Rspress/Storybook | React/Vue/RN bridge，可桥接整页面 |

详见 [MF 2.0 生态](./guide-line/mf2-ecosystem)。

## 五、Native Federation 对照表

| 维度 | webpack/Rspack MF | Native Federation |
| --- | --- | --- |
| **底座** | 打包器编译 + 自有运行时容器 | **原生 ESM + Import Maps** |
| **构建器** | 需 MF 插件 | **适配器包装任意打包器**（Angular 走 esbuild） |
| **shared 去重** | share scope 运行时协商 | **import map 条目** |
| **核心包** | `@module-federation/enhanced` | `@softarc/native-federation`（核心）+ `@angular-architects/native-federation`（Angular） |
| **背书** | 字节 Web Infra + Zack Jackson | **Manfred Steyer / Angular** |
| **前提平台能力** | 自有 runtime | **Import Maps 已 Baseline（2023-03）** |
| **甜区** | 多团队规模化、治理/工具/跨工具 | Angular、贴浏览器标准、不绑私有运行时 |

详见 [Native Federation](./guide-line/native-federation)。

## 六、选型决策表

| 首要诉求 | 选型 | 理由 |
| --- | --- | --- |
| 共享模块 · webpack/Rspack | **MF 2.0**（Rspack 内置） | 模块级共享、运行时协商、生态最厚 |
| 共享模块 · Vite | **@module-federation/vite**（官方） | 接入官方 runtime，取代停滞的 originjs |
| 共享模块 · Angular/贴标准 | **Native Federation** | ESM + Import Maps、bundler-agnostic |
| 隔离应用 · 存量 webpack 开箱 | **[qiankun](../qiankun/)** | 应用级 + 沙箱，接入像 iframe 一样简单 |
| 隔离应用 · Vite/更强隔离 | **[wujie](../wujie/) / [micro-app](../micro-app/)** | iframe/WebComponent 沙箱、ESM 友好 |
| 编排 + 共享都要 | **single-spa/qiankun 编排 + MF 共享** | 各取所长；同一依赖只走一套解析 |
| 极致控制 · 自建底座 | **[single-spa](../single-spa/) + import maps** | 最小编排，自理隔离与共享 |

**无沙箱 = 更轻但需自律**（同 `window`、靠团队纪律防污染）；**带沙箱 = 更重但兜底**（Proxy/iframe 隔离）。详见[与应用级方案的选型](./guide-line/vs-qiankun-selection)与[微前端基础 · 2026 选型全景](../mfe-basics/guide-line/landscape-2026)。

## 权威链接

- [Module Federation 官网](https://module-federation.io/) —— 概念、Guide、Configuration、Runtime、生态总入口
- [Guide · Introduction](https://module-federation.io/guide/start/index.html) —— MF 定义、host/remote、适用场景
- [Configuration · Shared](https://module-federation.io/configure/shared.html) —— shared 全部字段与版本协商语义
- [Guide · Runtime](https://module-federation.io/guide/basic/runtime.html) —— Runtime SDK、`createInstance`/`registerRemotes`/`loadRemote`
- [Blog · MF 2.0 公告](https://module-federation.io/blog/announcement.html) —— 从 webpack fork、运行时化、脱离构建工具
- [GitHub: module-federation/core](https://github.com/module-federation/core) · [Releases](https://github.com/module-federation/core/releases) —— 源码与版本（v2.6.x、月度迭代）核对源
- [@module-federation/enhanced](https://www.npmjs.com/package/@module-federation/enhanced) · [@module-federation/vite](https://www.npmjs.com/package/@module-federation/vite) —— 2.0 增强插件 / Vite 官方插件
- [Rspack · Module Federation](https://rspack.rs/guide/features/module-federation) —— Rspack 内置 MF v1.5 与 2.0 支持
- [Native Federation（Angular 官方博客）](https://blog.angular.dev/micro-frontends-with-angular-and-native-federation-7623cfc5f413) —— Manfred Steyer 讲 Native Federation
- [@angular-architects/native-federation](https://www.npmjs.com/package/@angular-architects/native-federation) —— Native Federation 的 Angular 集成
- [MDN: Import Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) —— Native Federation 与共享去重的原生底座
- [webpack 深入（本库）](/zh/frontend-toolchain/build/webpack/guide-line/expert) —— `exposes`/`remotes`/`shared` 插件配置与三大坑

## 相关页

- [入门](./getting-started) —— MF 是什么、模块级 vs 应用级、host/remote、为何只讲架构层
- [联邦概念与心智模型](./guide-line/federation-concepts) / [shared 版本治理](./guide-line/shared-governance) / [MF 2.0 运行时化](./guide-line/mf2-runtime) / [MF 2.0 生态](./guide-line/mf2-ecosystem) / [Native Federation](./guide-line/native-federation) / [与应用级方案的选型](./guide-line/vs-qiankun-selection)
- [核心机制 · 依赖共享三路线](../mfe-mechanisms/guide-line/dependency-sharing) —— shared 机制通论（本叶讲 MF 治理视角，通论在此）
- [qiankun](../qiankun/) / [wujie](../wujie/) / [single-spa](../single-spa/) —— 应用级方案与编排底座（选型对照）
- [微前端基础 · 2026 选型全景](../mfe-basics/guide-line/landscape-2026) —— 全部微前端方案横评
