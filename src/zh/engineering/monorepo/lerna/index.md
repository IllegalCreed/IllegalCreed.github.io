---
layout: doc
---

# Lerna

Lerna 是 **JavaScript/TypeScript 生态最早、最知名的 monorepo 管理工具**，诞生于 Babel 项目，曾支撑 React、Jest、Vue CLI 等数以万计的仓库。它专注两件核心事：**① 跨多个包按依赖拓扑顺序高效执行命令**（可并行、可缓存、可分布式），**② 管理版本号并把包发布到 npm 的工作流**（`lerna version` + `lerna publish`）。现状（高频考点，务必记牢）：Lerna 一度濒临无人维护，**自 2022 年起由 Nx 背后的公司 Nrwl（现称 Nx）接管维护**，官方原话是 "Nx took over stewardship of Lerna in 2022 after it was at risk of being unmaintained"；从 **v6 起底层任务调度默认复用 Nx 的 task runner**（`useNx` 默认 `true`），因此天然拥有**计算缓存、智能并行、分布式执行**能力——现代 Lerna 本质是「**Nx 执行层之上的版本/发布层 + 一套熟悉的 JS monorepo 命令界面**」。另一个关键心智转变：**Lerna 不再负责安装和链接依赖**（"lerna is not responsible for installing and linking your dependencies"），`lerna bootstrap`/`add`/`link` 已在 **v7（2023-06）默认移除、v9（2025-09）彻底删除**，本地包链接改由**包管理器的 workspaces**（npm/yarn/pnpm/bun）在 `install` 时完成。当前 npm latest 约为 **9.x**。

## 概述

- **定位**：Lerna = **版本与发布层（一流）+ 经典 JS monorepo 命令界面**，底层任务执行**复用 Nx**。记忆锚点：「**Lerna 管版本/发布，Nx 管执行/构建，Lerna 站在 Nx 肩上**」。
- **归属与维护**：**Nx（Nrwl）自 2022 年接管**；npm 上维护者为 `nrwlowner`（Nx 公司账号）与 `jameshenry`（现任负责人）；`lerna` 的运行时依赖直接包含 `nx` 与 `@nx/devkit`——「底层用 Nx」是硬依赖，不是宣传口号。
- **两大能力**：**任务运行**（`lerna run` / `lerna exec`，走 Nx 调度，含缓存/并行/`--since` 受影响检测）与**版本发布**（`lerna version` 升号 + changelog + tag，`lerna publish` 发 npm，支持 fixed/independent、conventional-commits、canary、`from-git`/`from-package`）。
- **bootstrap 已成历史**：`lerna bootstrap`/`add`/`link` **v7 默认移除、v9 彻底删除**；依赖安装与本地 symlink 交给**包管理器 workspaces**（`npm install` 等一条命令搞定）。过渡兼容包 `@lerna/legacy-package-management` 仅在 v7/v8 可用、v9 起消失。
- **配置入口**：`lerna.json`（`version` / `packages` / `useNx` / `npmClient` / `command.*`）；任务流水线与缓存写在 `nx.json`（`npx lerna add-caching` 生成）。
- **选型甜区**：**需要成熟发布流水线的 JS/TS 库 monorepo**——想要跨包版本联动、conventional changelog、canary 预览、独立/统一版本切换时，Lerna 仍是标杆；纯应用编排且不发包可考虑 Turborepo（不管发布，通常配 Changesets）。

## 本叶地图

- [入门](./getting-started) —— Lerna 是什么、2026 现状与 Nx 的关系、`lerna init` / `lerna.json`、为何依赖 workspaces 而非 bootstrap、`run` / `exec` 初步
- [版本与发布](./guide-line/versioning-publish) —— fixed vs independent、`lerna version` 五步与 `lerna publish` 三模式（`from-git` / `from-package`）、conventional-commits、canary、内部依赖联动、私有/scoped 包发布
- [任务运行与 Nx 流水线](./guide-line/tasks-with-nx) —— `useNx` 默认 true、`run` / `exec` 深入、Command/Target/Task、过滤（`--scope` / `--since`）、`nx.json` 任务流水线与 `^build`、v6 起失效的选项
- [缓存与分布式执行](./guide-line/caching-and-distribution) —— 本地计算缓存、远程/共享缓存（Nx Cloud）、`--since` / affected、DTE 分布式任务执行、Project Graph 与可视化
- [迁移与选型](./guide-line/migration-selection) —— bootstrap 移除后的迁移映射、schema 保留 ≠ 命令可用、pnpm 专项、`lerna repair`、与 Nx/Turborepo/Rush 对比
- [参考](./reference) —— 命令总览 / `lerna.json` 字段 / version·publish flags / 常见坑 / Lerna↔Nx 版本矩阵 / 权威链接

## 文档地址

- [Lerna 官方文档](https://lerna.js.org/docs/introduction) —— 介绍、特性、概念、API 一手总入口
- [Lerna 与 Nx 的关系](https://lerna.js.org/docs/lerna-and-nx) · [版本矩阵](https://lerna.js.org/docs/lerna-and-nx-version-matrix) —— 维护归属、职责分工、Lerna↔Nx 版本对应
- [版本与发布](https://lerna.js.org/docs/features/version-and-publish) · [运行任务](https://lerna.js.org/docs/features/run-tasks) · [缓存任务](https://lerna.js.org/docs/features/cache-tasks) · [分布式执行](https://lerna.js.org/docs/features/distribute-tasks) —— 四大特性一手页
- [lerna.json 配置参考](https://lerna.js.org/docs/api-reference/configuration) · [命令参考](https://lerna.js.org/docs/api-reference/commands) —— 字段与命令全表
- [旧包管理（bootstrap 移除）](https://lerna.js.org/docs/legacy-package-management) · [Lerna 6 过时选项](https://lerna.js.org/docs/lerna6-obsolete-options) —— 迁移与行为变更一手说明
- [GitHub: lerna/lerna](https://github.com/lerna/lerna) · [npm: lerna](https://www.npmjs.com/package/lerna) —— 源码/schema/命令 README 与版本·依赖·维护者佐证

## 幻灯片地址

- <a href="/SlideStack/lerna-slide/" target="_blank">Lerna</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=lerna" target="_blank" rel="noopener noreferrer">Lerna 测试题</a>
