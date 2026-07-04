---
layout: doc
outline: [2, 3]
---

# 生态与扩展：rush-sdk、Heft 与选型定位

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- **三包分工**：**`@microsoft/rush`**（CLI 壳，提供 `rush`/`rushx` 命令）、**`@microsoft/rush-lib`**（核心引擎，实现全部功能）、**`@rushstack/rush-sdk`**（轻量 API 代理）。
- **写脚本用 rush-sdk，别直接依赖 rush-lib**：rush-sdk **自动加载 `rush.json` 指定的引擎版本**（避免版本失配），并提供访问引擎内部 API 的 stub。
- **关键 API 类**：`RushConfiguration`（加载解析 `rush.json`，`.projects` 遍历所有项目）、`RushConfigurationProject`、`PackageJsonEditor`（带校验地改 `package.json`）。
- **自定义命令走 `command-line.json`**（global / bulk 命令）；**Rush 插件**（实验）走 `rush-plugins.json`，且**必须配 autoinstaller**。
- **Heft ≠ Rush**：**Rush 跨项目编排**（安装/并行/发布），**Heft 在单个项目内部构建**（config-driven，调 TypeScript/ESLint/Jest/Webpack）。Rush 不绑定任何构建工具，Heft 只是官方推荐搭配。
- **Heft 经 `package.json` scripts 调用**（`"build": "heft build"`），可独立用也可配 Rush；配置在 `config/heft.json`（`phasesByName` / `tasksById`）；多项目共享配置靠 **rig 包**。
- **选型一句话**：**正确性/治理/受控发布 → Rush；研发速度/平台能力 → Nx；纯构建速度 → Turborepo；只要发版 → Lerna；多语言巨仓 → Bazel。**
- **Rush 的差异化**是「**依赖治理 + change file 受控发布 + 企业策略**」这条线，而非单纯构建加速（区别于 Nx/Turborepo 主打的 task orchestration + caching）。
- **生态背景**：**Lerna 2022 起由 Nx 团队接管**（底层已用 Nx）；**Turborepo 2021 被 Vercel 收购**（Rust 实现）。
- **`rushx <script>`**：在当前项目跑其 script（类似 `npm run`）；**`rush-pnpm`**：在 Rush 仓内安全代理 pnpm 子命令（如 `rush-pnpm audit`）。
- **边缘能力**：**subspaces**（多锁文件子空间，缓解超大仓单锁文件膨胀，实验）、**Lockfile Explorer（`lfx`）**（可视化 pnpm 锁文件排查幻影/重复依赖）、**Sparo**（超大仓 Git 稀疏检出加速）、**Rush MCP**（AI 集成）。
- **Rush Stack 家族**：Rush、Heft、API Extractor、Lockfile Explorer、Sparo、Rush MCP——一整套面向大仓的工具与实践集。

## 一、三包分工：rush / rush-lib / rush-sdk

Rush 的实现拆成三个 npm 包，各司其职：

| 包 | 角色 | 你什么时候接触 |
| --- | --- | --- |
| **`@microsoft/rush`** | **CLI 壳**：提供 `rush` / `rushx` shell 命令，委托给引擎 | 全局安装的就是它（版本选择器壳） |
| **`@microsoft/rush-lib`** | **核心引擎**：实现全部功能，内含内置插件 | 一般不直接依赖 |
| **`@rushstack/rush-sdk`** | **轻量 API 代理**：① 自动加载 `rush.json` 指定的引擎版本；② 提供访问引擎内部 API 的 stub | **写工具脚本时依赖它** |

**关键结论：写自定义脚本/工具应依赖 `@rushstack/rush-sdk`，而非直接 `@microsoft/rush-lib`**。原因是 rush-sdk 会**自动对齐 `rush.json` 里 `rushVersion` 锁定的引擎版本**——你的脚本永远用「与当前分支兼容的那个 Rush 引擎」，不会因为脚本 package.json 里锁死某个 rush-lib 版本而与仓库引擎打架。它内部通过 `install-run-rush.js` 机制加载正确引擎。

## 二、用 rush-sdk 读大仓：RushConfiguration 与 PackageJsonEditor

Rush 把「整个大仓的结构」暴露成可编程 API，适合写「批量改依赖、生成清单、自定义构建编排」的工具：

- **`RushConfiguration`**：加载并解析 `rush.json` 及相关配置，`.projects` 可遍历所有项目。
- **`RushConfigurationProject`**：单个项目的结构化视图（包名、路径、依赖、版本策略等）。
- **`PackageJsonEditor`**：带校验地修改 `package.json`——`addOrUpdateDependency()` 增改依赖、`saveIfModified()` 仅在有变更时落盘。

```ts
// 用 rush-sdk 读出大仓所有项目名（引擎版本自动对齐 rush.json）
import { RushConfiguration } from "@rushstack/rush-sdk";

const config = RushConfiguration.loadFromDefaultLocation();
for (const project of config.projects) {
  console.log(project.packageName, project.projectFolder);
}
```

**自定义命令**通过 `common/config/rush/command-line.json` 定义（`global` 命令或 `bulk` 批量命令，后者对每个项目跑一遍）；**Rush 插件**（实验特性）通过 `rush-plugins.json` + `rush-plugin-manifest.json` 注册，且**必须配 autoinstaller**（见[依赖治理](./dependencies)）。

## 三、Heft：Rush 编排，Heft 构建

Rush 是**编排层**，不编译代码。那单个项目内部「tsc + eslint + jest + webpack」的构建谁来管？官方推荐搭配 **Heft**——Rush Stack 家族里的**配置驱动（config-driven）单项目构建工具链**：

- **分工**：**Rush 跨项目编排（安装/并行/发布/部署），Heft 在单个项目内部构建**。二者是两个层次，不是竞争关系。
- **调用方式**：Heft 经项目 `package.json` 的 scripts 调用（`"build": "heft build"`、`"test": "heft test"`）——于是 `rush build` 跨项目跑，每个项目内部实际执行的就是 `heft build`。
- **解耦**：Heft **可独立使用**（不用 Rush 也能单项目构建），Rush 也**不绑定 Heft**（换任意构建工具都行）——Heft 只是官方推荐的默认搭配。

`config/heft.json` 用 `phasesByName` 定义阶段（build/test…）、`tasksById` 定义任务及依赖：

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json",
  "phasesByName": {
    "build": {
      "tasksById": {
        "typescript": {
          "taskPlugin": { "pluginPackage": "@rushstack/heft-typescript-plugin" }
        },
        "lint": {
          "taskPlugin": { "pluginPackage": "@rushstack/heft-lint-plugin" },
          "taskDependencies": ["typescript"]
        }
      }
    },
    "test": {
      "phaseDependencies": ["build"],
      "tasksById": {
        "jest": { "taskPlugin": { "pluginPackage": "@rushstack/heft-jest-plugin" } }
      }
    }
  }
}
```

多项目共享构建配置靠 **rig 包**（如 `@rushstack/heft-node-rig`）——项目继承 rig，免得每个项目重复一份 heft.json。

## 四、与 Nx / Turborepo / Lerna / Bazel 的定位差异

这是选型高频考点。同为 monorepo 工具，各自的**本质定位**不同：

| 工具 | 本质定位 | 强项 | 适用信号 |
| --- | --- | --- | --- |
| **Rush** | JS/TS **大仓管理器**（依赖治理 + 发布 + 部署 + 策略） | 严格依赖隔离（pnpm）、change file 受控发布、版本策略、包审批、确定性 | 追求**正确性/治理/受控发布**的大规模 JS 大仓 |
| **Nx** | monorepo **平台**（不止任务运行器） | affected 命令、代码生成器、插件生态、分布式任务执行 | 需要「平台能力 + 代码生成」的混合技术栈大仓 |
| **[Turborepo](../../turborepo/)** | 快速**任务编排 + 缓存** | Rust 实现、配置极简、远端缓存、Vercel 集成 | 追求**构建/CI 速度**、低上手成本的 workspace |
| **Lerna** | 老牌 JS monorepo 工具 | 版本化 + 发布是招牌；**2022 起由 Nx 团队接管** | 只需「协调多包版本发布」 |
| **Bazel** | 语言无关的**通用构建系统** | 超大规模、多语言、强可复现（sandbox） | 巨型多语言仓，愿承担高配置成本 |

**一句话决策**：**瓶颈是正确性 → Rush；是研发速度/平台 → Nx；是纯构建速度 → Turborepo；只要发版 → Lerna；多语言巨仓 → Bazel。**

**Rush 的差异化在哪**：它这条线是「**依赖治理（phantom/doppelganger 根治、一致性强制）+ change file 受控发布 + 企业策略（包审批、Git 邮箱策略）**」——**它也用 build cache 做加速，但加速不是唯一卖点**。这区别于 Nx/Turborepo 主打的「task orchestration + caching」：那两者的核心叙事是「让重复的任务不再重复」，Rush 的核心叙事是「让几百人协作下的依赖与发布**不出错、可追溯、可复现**」。选 Rush 的信号是「我的痛点是治理与正确性」，而不是「我的 CI 太慢」。

**生态背景**（常被当选型干扰项）：**Lerna 2022 起由 Nx 团队接管**，任务/缓存底层已用 Nx；**Turborepo 2021 被 Vercel 收购**、用 Rust 重写。这解释了为什么如今 Lerna 与 Nx、Turborepo 与 Vercel 生态深度绑定。

## 五、边缘与进阶能力

Rush 还有一批面向超大仓/特定场景的能力，多数标注实验特性：

- **`rushx <script>`**：在当前项目目录跑其 `package.json` 的 script（类似 `npm run` 但更短、报错更好）：`rushx start`。
- **`rush-pnpm`**：在 Rush 仓内**安全代理** pnpm 子命令（如 `rush-pnpm audit`），避免直接跑 `pnpm` 破坏结构。
- **subspaces（实验）**：把大仓拆成多个**独立锁文件的子空间**（`subspaces.json`），缓解超大仓单锁文件膨胀/冲突；project 用 `subspaceName` 归属。
- **installation variants（`variants`）**：同一仓维护**多套依赖版本组合**（如迁移 React 版本期间并行验证）。
- **Lockfile Explorer（`lfx`）**：`@rushstack/lockfile-explorer`，**可视化 pnpm 锁文件依赖**，排查幻影/重复依赖——是[依赖治理](./dependencies)里那些问题的诊断工具。
- **Sparo**：加速超大仓 Git 的**稀疏检出（sparse checkout）**集成。
- **Rush MCP server**：AI 集成，让 Agent 理解大仓结构。
- **phased builds（实验）**：把构建拆成多阶段（compile→test）细粒度调度。
- **eventHooks**：`rush.json` 里的生命周期钩子（`preRushInstall`/`postRushBuild` 等）。

这些共同构成 **Rush Stack 家族**——Rush、Heft、API Extractor、Lockfile Explorer、Sparo、Rush MCP 等一整套「面向大仓的工具 + 实践」集合。

## 小结

Rush 的可扩展性建立在**三包分工**上：`@microsoft/rush`（CLI 壳）/ `rush-lib`（引擎）/ **`rush-sdk`（写脚本首选，自动对齐引擎版本）**——用 `RushConfiguration` / `PackageJsonEditor` 可编程地读改大仓。构建层面记牢 **Rush 编排、Heft 构建**的分工（Heft config-driven、经 scripts 调用、rig 共享配置，但 Rush 不绑定它）。选型上，Rush 的差异化是「**依赖治理 + 受控发布 + 企业策略**」而非纯加速——**正确性选 Rush、速度选 Turborepo、平台选 Nx、发版选 Lerna、多语言选 Bazel**。命令、字段、坑的速查见下一页：[参考](../reference)。
