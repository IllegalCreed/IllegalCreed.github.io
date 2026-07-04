---
layout: doc
outline: [2, 3]
---

# 迁移与选型

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **bootstrap 已死**：`lerna bootstrap` / `add` / `link` **v7.0.0（2023-06）默认移除、v9.0.0（2025-09）彻底删除**；改用**包管理器 workspaces**。
- **迁移映射**：`lerna bootstrap` → `npm install`；`lerna link` → 删掉（install 自动 link）；`lerna add <dep> --scope <pkg>` → `npm install <dep> -w <pkg>`。
- **过渡兼容包**：`@lerna/legacy-package-management` 仅 **v7/v8** 可临时恢复旧命令，**v9 起消失**。
- **schema ≠ 命令**：`lerna.json` schema 仍保留 `command.bootstrap` / `add` / `link` 节点（历史兼容），但**对应命令 v9 已删——能写配置 ≠ 能跑命令**。
- **`useWorkspaces` 已移除**：现在默认自动识别 workspaces，别再写这个开关。
- **`lerna repair`**：借 Nx migrate 机制运行内置迁移，**修复过时/损坏的工作区配置**（升大版本后常用）。
- **pnpm 专项**：`npmClient: "pnpm"`；**包位置只写 `pnpm-workspace.yaml`，别在 `lerna.json` 再写 `packages`**；`lerna version` 保留 `workspace:` 前缀。
- **hoisting 复杂**：官方建议改用**现代 Yarn（v3+）**的 `nmHoistingLimits`。
- **选型锚点**：**「Lerna 管版本/发布，Nx 管执行/构建」**；Turborepo **不管发布**（配 Changesets）；Rush 面向**超大规模强治理**。
- **版本矩阵**：`<5.2.0` 不依赖 Nx；v9 对应 Nx `>=21.5.3 <23`（以 npm 实际依赖声明为准）。

## bootstrap 移除后的迁移

现代 Lerna **不再安装/链接依赖**——这交给包管理器的 workspaces：

| 旧命令（已移除） | 现在改用 |
| --- | --- |
| `lerna bootstrap` | `npm install`（或 `yarn` / `pnpm install`） |
| `lerna link` | 删掉——`install` 自动 symlink 本地包 |
| `lerna add <dep> --scope <pkg>` | `npm install <dep> -w <pkg>`（多包多个 `-w`） |

- **移除时间线**：**v7.0.0（2023-06）默认移除** → **v9.0.0（2025-09）彻底删除**（原文 *"finally fully removed after over 2 years of being deprecated"*）。
- **过渡兼容包**：`@lerna/legacy-package-management` 在 v7/v8 可临时恢复这些命令（只收关键补丁/安全更新、无新功能），**v9 起不再提供**。
- **hoisting 需求复杂**者：官方建议用**现代 Yarn（v3+）的 `nmHoistingLimits`**，而非旧的 lerna hoist。
- 支持的 workspaces：**npm / yarn / pnpm**（均一等公民；文档也提及 Bun）。

::: warning schema 保留 ≠ 命令可用
`lerna.json` 的 JSON schema **仍保留** `command.bootstrap` / `command.add` / `command.link` 节点（历史兼容），编辑器不会报错——但**对应 CLI 命令在 v9 已删除**。「配置里能写」不代表「命令能跑」，这是升级后的经典困惑点。
:::

## lerna repair 与升级路径

- **`lerna repair`**：借 Nx 的 migrate 机制运行一系列内置迁移，自动修复过时/损坏的工作区配置——**升级 Lerna 大版本后**先跑它。
- **升级要点**：
  - **v5 → v6**：任务默认走 Nx，旧 `--parallel` / `--sort` 语义变化（见[任务运行与 Nx 流水线](./tasks-with-nx)）。
  - **v6 → v7**：`bootstrap` / `add` / `link` 需换成包管理器 workspaces。
  - **v8 → v9**：兼容包彻底消失，**必须已迁到 workspaces**。
- 初次启用 `--conventional-commits` 想补历史 changelog：临时装 `conventional-changelog-cli`，配合 `lerna exec` 逐包生成。

## pnpm 专项

pnpm 工作区有几条硬约束：

- `lerna.json` 设 `"npmClient": "pnpm"`。
- **包位置写在 `pnpm-workspace.yaml` 的 `packages`，不要在 `lerna.json` 再写 `packages`**（pnpm 只认自己的 workspace 文件）。
- Lerna 在 pnpm 工作区会：**忽略** `package.json` 的 `workspaces` 字段；`lerna version` **保留 `workspace:` 协议前缀**；workspace 别名依赖不会被自动升号；`bootstrap` / `link` / `add` 被禁用（本已移除）。
- **迁移步骤**：装 pnpm → `lerna clean` 清 `node_modules` → 设 `npmClient: pnpm` → 建 `pnpm-workspace.yaml` → 可选 `pnpm import` 转换锁文件 → `pnpm install`。

## 与 Nx / Turborepo / Rush 选型对比

| 维度 | **Lerna** | **Nx** | **Turborepo** | **Rush** |
| --- | --- | --- | --- | --- |
| 归属 | Nx 团队（Nrwl）维护 | Nx（Nrwl） | Vercel | Microsoft |
| 定位 | Nx 执行层之上的**版本/发布层** + 经典 JS 命令界面 | 全功能构建系统（插件/代码生成/图/缓存/DTE） | 轻量任务编排 + 远程缓存 | 超大规模企业 monorepo（严格幻影依赖治理） |
| 任务调度 | **底层复用 Nx**（v6+） | 自身即调度核心 | 自研（Go/Rust） | 自研 |
| 计算缓存 | 有（借 Nx） | 有（一流） | 有（Vercel Remote Cache） | 有 |
| 分布式执行 | 有（借 Nx Cloud） | 有（Nx Cloud/Agents） | 无原生 DTE | 有（分阶段/增量） |
| **版本 + 发布** | **一流**（version/publish/conventional/changelog/canary） | 靠 `nx release` 或搭配 Lerna | **不管**（配 Changesets） | 有 `rush publish` |
| 依赖安装/链接 | 交给包管理器 workspaces | 交给包管理器 | 交给包管理器 | 自带 `rush install`（PNPM store） |
| 适用 | 需要成熟发布流水线的 JS/TS 库 monorepo | 需要构建系统全家桶 | 想要「简单 + 快缓存」的应用 monorepo | 超大规模、强治理 |

> 记忆锚点：**「Lerna = 版本/发布；Nx = 执行/构建；Lerna 站在 Nx 肩上」**。想要 Turborepo 的发布能力通常另配 Changesets。

## Lerna ↔ Nx 版本矩阵

| Lerna 版本 | 推荐 Nx | Nx 范围 |
| --- | --- | --- |
| 9.x（当前 latest） | 最新 | `>=21.5.3 <23.0.0`（取自 npm 依赖声明） |
| >=8.0.0 <9.0.0 | 20.8.2 | `>=17.1.2 <21` |
| >=7.1.4 <8.0.0 | 16.10.0 | `>=16.5.1 <17` |
| >=6.5.0 <7.0.0 | 15.9.4 | `>=15.5.2 <16` |
| >=5.2.0 <6.0.1 | 15.9.4 | `>=14.4.3 <16` |
| <5.2.0 | 不适用 | Lerna 此前**不依赖 Nx** |

> 官方文档矩阵页与 npm 实际依赖声明可能有细微差（文档更新滞后）；以当前 latest 的 npm 依赖 `>=21.5.3 <23` 为准。
