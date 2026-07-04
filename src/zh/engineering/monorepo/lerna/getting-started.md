---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **一句话**：Lerna = **跨包按依赖顺序跑命令（借 Nx）+ 版本/发布到 npm** 的 monorepo 工具，JS 生态最早的一个。
- **现状必记**：**2022 起由 Nx（Nrwl）接管维护**；**v6 起底层默认走 Nx**（`useNx: true`）；**`lerna bootstrap` v7 默认移除、v9 彻底删除**；latest 约 **9.x**。
- **新建工作区**：`npx lerna init`（先 `npx lerna init --dryRun` 预览）；独立版本模式加 `--independent`。
- **配置文件**：根目录 `lerna.json`；任务流水线/缓存在 `nx.json`（`npx lerna add-caching` 生成）。
- **依赖安装/链接**：**不再用 Lerna**——`npm install`（或 `yarn` / `pnpm install`）借 **workspaces** 自动 symlink 本地包，等价于旧 `lerna bootstrap`。
- **包的发现**：npm/yarn 读 `package.json` 的 `workspaces`；**pnpm 读 `pnpm-workspace.yaml`**；也可用 `lerna.json` 的 `packages` 收窄。
- **跑 npm 脚本**：`lerna run <script>`（只在含该脚本的包里跑，走 Nx 拓扑并行 + 缓存）。
- **跑任意命令**：`lerna exec -- <cmd>`（如 `lerna exec -- rm -rf node_modules`）。
- **只跑受影响包**：`lerna run build --since=origin/main`；按包名过滤用 `--scope <glob>`。
- **升版本**：`lerna version`（升号 + changelog + git tag + commit + push，**不发 npm**）。
- **发布**：`lerna publish`（默认背后先调 `lerna version`；或 `from-git` / `from-package`）；**Lerna 永远用 npm 发布**。
- **fixed vs independent**：`lerna.json` 的 `version` 是语义版本串 → 全仓统一版本；是字面量 `"independent"` → 每包独立升号。

## Lerna 是什么

Lerna 诞生于 Babel 项目，是 **JavaScript/TypeScript 生态最早、最知名的 monorepo 管理工具**，曾支撑 React、Jest、Vue CLI 等大量开源仓库。它专注两件事：

1. **任务运行**：在一个仓库里管理多个 npm 包（package），按包之间的依赖关系**按拓扑顺序、并行、可缓存地**执行命令（如 `build` / `test` / `lint`）。
2. **版本与发布**：统一或独立地给各包升版本号、生成 CHANGELOG、打 git tag，并发布到 npm registry。

> Lerna 只管理**已由包管理器 workspaces 组织好的多包仓库**；它不是包管理器，也不做依赖安装。

## 2026 现状：与 Nx 的关系（必读）

这是当前最容易踩坑的认知差：

- **维护归属**：Lerna 曾一度濒临无人维护，**2022 年由 Nx 背后的公司 Nrwl（现称 Nx）接管**。官方原话：*"Nx took over stewardship of Lerna in 2022 after it was at risk of being unmaintained."*
- **底层复用 Nx**：从 **v6 起，Lerna 默认把任务调度交给 Nx 的 task runner**（配置项 `useNx` 默认 `true`）。官方：*"Lerna defers to Nx's powerful task runner to run scripts, allowing you to run them in parallel, cache results, and distribute them across multiple machines."* 另有：*"Lerna uses Nx to detect packages in the workspace and dependencies between them."*
- **职责分工**：**Lerna 负责版本/发布 + 命令界面 + 包/依赖探测的入口**，**Nx 负责实际的任务执行、并行、缓存、分布式**。
- **硬证据**：`lerna` 包的**运行时依赖直接包含 `nx` 与 `@nx/devkit`**；npm 维护者为 `nrwlowner`（Nx 公司账号）与 `jameshenry`。「底层用 Nx」是硬依赖，不是宣传。
- **关掉 Nx 的后果**：`useNx: false` 会回退到 Lerna 自研的 legacy runner（`p-map` / `p-queue`），**丢失缓存与智能并行**——通常不该关。

## 安装与初始化

```bash
# 新建一个空工作区
mkdir my-lerna-workspace && cd my-lerna-workspace

# 先预览 lerna init 会做哪些改动（推荐）
npx lerna init --dryRun

# 满意后真正执行：生成 lerna.json + 初始化 git + 配好 npm workspaces
npx lerna init
```

`lerna init` 常用参数：

| 参数 | 作用 |
| --- | --- |
| `--independent` | 进入独立版本模式（等价于写入 `"version": "independent"`） |
| `--exact` | 内部依赖写精确版本（`1.2.3`）而非兼容范围（`^1.2.3`） |
| `--packages="packages/*"` | 手动指定包位置 glob（可多次传入）；已配包管理器 workspaces 时无需此项 |

> `init` 之后即得到一个配好 npm workspaces 的 git 仓库。**强烈建议用包管理器 workspaces 组织包**，Lerna 会自动识别包位置，无需额外参数。

## lerna.json 骨架

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "0.0.0",
  "npmClient": "pnpm",
  "command": {
    "version": {
      "conventionalCommits": true,
      "allowBranch": "main"
    }
  }
}
```

- `version`：**fixed 模式**填语义版本串（如 `"1.4.2"`）；**independent 模式**填字面量 `"independent"`。
- `packages`：包位置 glob，默认 `["packages/*"]`；**默认复用包管理器 workspaces 配置**，一般无需显式写（pnpm 下更要写在 `pnpm-workspace.yaml`）。
- `useNx`：默认 `true`，走 Nx runner；`false` 回退 legacy。
- `npmClient`：声明包管理器（`npm` / `yarn` / `pnpm`），影响配置与包解析（pnpm 会去读 `pnpm-workspace.yaml`）。
- `command`：各命令的专属选项，如 `command.version`、`command.publish`、`command.run`。

> **`useWorkspaces` 已废弃/从 schema 移除**：旧版（Lerna 3~6）需 `useWorkspaces: true` 才读 workspaces，现在默认自动识别，不要再写它。

## 依赖靠 workspaces，而非 bootstrap

现代 Lerna **不安装、不链接依赖**，这一步交给包管理器：

| 旧命令（已移除） | 现在改用 |
| --- | --- |
| `lerna bootstrap` | `npm install`（或 `yarn` / `pnpm install`） |
| `lerna link` | 删掉——`install` 自动 symlink 本地包 |
| `lerna add <dep> --scope <pkg>` | `npm install <dep> -w <pkg>`（多包多个 `-w`） |

官方心智：*"lerna is not responsible for installing and linking your dependencies in your repo, your package manager is much better suited to that task."* 移除时间线：**v7.0.0（2023-06）默认移除 → v9.0.0（2025-09）彻底删除**（过渡兼容包 `@lerna/legacy-package-management` 仅 v7/v8 可用）。

## 跑任务：run 与 exec 初步

```bash
# 在每个"含 build 脚本"的包里跑 npm run build（走 Nx：拓扑序 + 并行 + 缓存）
npx lerna run build

# 只在名字匹配的包里跑
npx lerna run test --scope=header

# 只跑相对某 git ref 受影响的包（CI 提速关键）
npx lerna run test --since=origin/main

# 在每个包里跑任意命令（不限于 npm 脚本）
npx lerna exec -- rm -rf ./node_modules
```

- `lerna run <script>`：跑**已在各包 `package.json` 声明的 npm 脚本**；不存在该脚本的包会被跳过。
- `lerna exec -- <cmd>`：跑**任意 shell 命令**；提供 `LERNA_PACKAGE_NAME`、`LERNA_ROOT_PATH` 等环境变量。
- 默认并发数 **3**，用 `--concurrency` 调整；深入见[任务运行与 Nx 流水线](./guide-line/tasks-with-nx)。

## 包的发现（Project Graph 入口）

Lerna（借 Nx）从各 `package.json` 的依赖关系构建**项目图（Project Graph）**，用于任务拓扑排序与 `--since` 受影响检测：

- **发现规则**：npm/yarn 读 `package.json` 的 `workspaces`；**pnpm 读 `pnpm-workspace.yaml` 的 `packages`**；`lerna.json` 的 `packages` 可再收窄。
- **可视化**：`nx graph`（浏览器交互图）、`nx graph --file=output.json`（导出）。
- 详见[缓存与分布式执行](./guide-line/caching-and-distribution)。
