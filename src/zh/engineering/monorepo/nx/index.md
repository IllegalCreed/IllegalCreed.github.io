---
layout: doc
---

# Nx

**Nx** 是一个开源、技术无关的 **构建平台（build platform）**，其底座是一个用 **Rust** 编写的 **任务运行器（task runner）**。它先分析仓库得到 **项目图（project graph）**，再按每次调用派生 **任务图（task graph）**，据此做 **拓扑排序并行执行**、**计算缓存（computation caching）** 与 **affected 增量**，把「从编辑器写下一行代码到 CI 变绿」这条链路上的重复劳动降到最低。

## 概述

Nx 采用**模块化、渐进式采用**的设计：底座是 **Nx Core**（Rust 任务运行器 + 项目/任务图 + 本地缓存），可直接跑 `package.json` scripts，也能驱动 Gradle 等非 JS 技术栈；随规模增长再逐步叠加 **Nx Plugins**（技术专属的任务推断、代码生成、版本迁移）、**Nx Cloud**（远程缓存 Nx Replay、分布式执行 Nx Agents、自愈 CI）与 **Nx Console**（编辑器集成）。当前主线为 **Nx 21**，v20 为上一个稳定大版本。

**优点**

- **计算缓存 + affected**：输入哈希命中即「replay」终端输出与产物，配合 `nx affected` 只跑受改动影响的项目，大仓 CI 提速显著
- **编排精确到「目标（target）」**：`dependsOn` / `^build` 语义由**任务图**（非项目图）驱动，跨项目按依赖拓扑并行
- **Project Crystal 任务推断**：插件读取 `webpack.config.js`、`vite.config.ts` 等工具配置，自动补全 target 的命令、缓存、输入输出与依赖，手写配置骤降
- **一体化能力**：代码生成器（generators）、`nx migrate` 自动升级、`nx release` 版本/changelog/发布、module boundaries 架构约束、`nx graph` 可视化开箱即用
- **缓存可分布式**：Nx Cloud 的 Nx Replay（远程缓存）+ Nx Agents（声明式分布式执行）几乎零配置接入现有 CI

**缺点**

- **缓存正确性依赖 inputs/outputs 的精确声明**：漏声明会「该 miss 没 miss」，Nx 默认「宁可多算」以求安全，命中率需手动调优
- **概念门槛**：project/task graph、`targetDefaults` 的 executor 键 vs 名称键优先级、`namedInputs` 的合并/替换规则，初学者容易困惑
- **推断的「黑盒感」**：inferred tasks 看不到显式配置，需 `nx show project <p> --web` 才能查看最终生效的配置
- **深度绑定 Nx 心智**：`nx release`、Nx Agents 等高级能力与 Nx Cloud / 生态耦合，迁出成本不低

## 本叶地图

- [入门](./getting-started.md)：Nx 定位、安装初始化、`nx.json` + `project.json` 两层配置、`run-many` 与 `affected`、`nx graph`
- 指南
  - [计算缓存与哈希](./guide-line/caching.md)：computation hash 原理、`inputs`/`outputs`/`namedInputs`、本地缓存与缓存正确性
  - [任务编排与管道](./guide-line/task-pipeline.md)：`targetDefaults`、`dependsOn` 与 `^build` 语义、任务图 vs 项目图、并行
  - [插件、执行器与生成器](./guide-line/plugins-generators.md)：executor vs generator、Project Crystal 任务推断、integrated vs package-based
  - [规模化与治理](./guide-line/scale-governance.md)：`affected --base/--head`、module boundaries（tags + ESLint）、`nx release`、`nx migrate`
  - [Nx Cloud 与分布式 CI](./guide-line/nx-cloud.md)：Nx Replay 远程缓存、Nx Agents（DTE）、自愈 CI、安全模型
- [参考](./reference.md)：命令、配置字段、坑速查 + 官方链接

## 文档地址

[Nx 官方文档](https://nx.dev)

## GitHub地址

[nrwl/nx](https://github.com/nrwl/nx)

## 幻灯片地址

- <a href="/SlideStack/nx-slide/" target="_blank">Nx</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=nx" target="_blank" rel="noopener noreferrer">Nx 测试题</a>
