---
layout: doc
---

# Rush

Rush 是微软 **Rush Stack** 出品的「**a scalable monorepo manager for the web**」——面向**大规模企业级** JS/TS 大仓的 monorepo 管理器。它由微软 SharePoint 平台团队开源，被 Azure SDK、HBO Max、OneDrive、SharePoint、Office 365、Wix 等大仓验证过。定位一句话：Rush 是一个**编排层（orchestrator）**，不替代你的构建工具，而是在「几百个 npm 包共处一个 Git 仓、几百人每天几百个 PR」的场景下，统一做**依赖安装与互链、增量/并行构建 + 缓存、change file 驱动的受控版本发布、部署打包、策略治理**。它支持 **pnpm（官方推荐）/ npm / yarn** 三选一，但都用自己的**符号链接策略**组织 `node_modules`，从根上**根治幻影依赖（phantom dependencies）与同版本重影（doppelgangers）**。与 [Turborepo](../turborepo/)（主打任务编排 + 缓存的构建加速）、Nx（monorepo 平台 + 代码生成）不同，Rush 的差异化在「**依赖治理 + change file 受控发布 + 企业策略**」这条线——**瓶颈是正确性与治理时选 Rush，瓶颈是构建速度时选 Turborepo，要平台能力时选 Nx**。版本走**长期迭代的 5.x**（schema 锁 v5，2026-07 为 `5.177.x`），配套单项目构建器 **Heft**、轻量加载代理 **`@rushstack/rush-sdk`**、锁文件可视化 **Lockfile Explorer**。

## 概述

- **本质是编排层，不是构建工具**：Rush 只做「跨项目的安装 / 并行 / 发布 / 部署 / 治理」，**每个 project 内部怎么构建由你选**（TypeScript、Webpack、Heft…都行）。它兼容任意构建工具，脱离 Rush 后每个包仍是自包含的普通 npm 包。
- **面向「一个团队一个大仓」（one Git repo per team）**：把互相依赖的多个包放进同一仓，能**在每次改动时一起跑全部单测**，把回归责任压在改动者身上，而非几周后下游 `npm update` 才暴雷——这是 Rush 对多仓「隧道视野 / 级联发布 / link 地狱」四大痛点的回答。
- **依赖治理是招牌**：推荐 pnpm 严格符号链接，**根治 phantom / doppelganger**；`ensureConsistentVersions` 强制全仓依赖版本一致；`approvedPackagesPolicy` 做新包审批；中心化安装到 `common/temp/node_modules` 再 symlink 到各项目。
- **change file 驱动的受控发布**：改了可发布包必须用 `rush change` 写一个 change file（描述版本递增类型 + 说明），CI 用 `rush change --verify` 强制门禁；发布走 `rush version --bump` → `rush publish` 两步，配 **lockstep / individual** 两种版本策略。
- **增量 + 并行 + build cache**：`rush build` 靠**文件内容哈希**（`package-deps-hash`，不看时间戳）做增量，多进程并行（`-p`），并支持**本地 + 云端 build cache**（`local-only` / Azure Blob / S3），切分支免全量重建。
- **版本选择器保证确定性**：全局装的 `rush` 只是薄壳，真正跑的是 `rush.json` 里 `rushVersion` 锁定的引擎版本——全团队与 CI 行为一致、bug 可复现。
- **2026 现状**：`@microsoft/rush` **5.x**（`5.177.x`，schema v5，单调递增无大改），隶属 **Rush Stack** 项目集，配套 Heft / API Extractor / Lockfile Explorer / Sparo / Rush MCP。

## 本叶地图

- [入门](./getting-started) —— Rush 是什么与为什么（编排层而非构建工具）、企业级大 monorepo 理念、`rush.json` 与包管理器选择、版本选择器、`rush install` vs `rush update` + shrinkwrap、`rush build` 增量初体验
- [依赖治理](./guide-line/dependencies) —— 幻影依赖与 doppelganger 的机制与危害、pnpm 严格隔离为何是解药、中心化安装 + symlink、shrinkwrap 纪律、`rush add` / `rush check` / `common-versions.json`、autoinstallers 隔离工具依赖
- [增量构建与缓存](./guide-line/build-cache) —— `build` vs `rebuild`、`package-deps-hash` 内容哈希增量、项目子集选择器（`--to` / `--from` / `--impacted-by`）、`-p` 并行、本地 + 云 build cache、缓存键四要素、`rush-project.json` 与写权限控制
- [受控发布](./guide-line/publishing) —— change file 全流程（`rush change --verify` → `version --bump` → `publish`）、五种 change type、lockstep vs individual 版本策略、`rush deploy` 与 publish 的区别
- [生态与扩展](./guide-line/ecosystem) —— `@microsoft/rush` / `rush-lib` / `rush-sdk` 三包分工、Heft 与 Rush 的编排/构建分工、与 Nx / Turborepo / Lerna / Bazel 的定位差异、subspaces / Lockfile Explorer / `rushx` 等边缘能力
- [参考](./reference) —— 命令 / `rush.json` 字段 / 配置文件 / 选择器 / change type / 版本策略 / 高频坑六张速查表 + 权威链接

## 文档地址

- [Rush 官网](https://rushjs.io/) —— 定位、Intro / Developer / Maintainer / Configs / Commands 全部文档总入口
- [Intro · Welcome](https://rushjs.io/pages/intro/welcome/) —— 导航全景与价值主张
- [Configs · rush.json](https://rushjs.io/pages/configs/rush_json/) —— 主配置全字段
- [Maintainer · Publishing](https://rushjs.io/pages/maintainer/publishing/) —— change file 与发布流程
- [Maintainer · Build cache](https://rushjs.io/pages/maintainer/build_cache/) —— 本地 + 云构建缓存
- [Advanced · Phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/) · [NPM doppelgangers](https://rushjs.io/pages/advanced/npm_doppelgangers/) —— 依赖治理两大核心概念
- [GitHub: microsoft/rushstack](https://github.com/microsoft/rushstack) —— 源码与版本状态（`@microsoft/rush` 5.x）核对源

## 幻灯片地址

- <a href="/SlideStack/rush-slide/" target="_blank">Rush</a>
