---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **脚手架新仓**：`npx create-nx-workspace@latest`（交互选 preset：`ts` / `react` / `angular` / `none` 等）
- **加到已有仓库**：`npx nx@latest init`（自动探测工具、写入 `nx.json`）
- **加插件**：`nx add @nx/react`（版本自动对齐仓库当前 Nx 版本，勿手改版本号）
- **两层配置**：`nx.json`（工作区级：`plugins` / `targetDefaults` / `namedInputs` / `release` …）+ 项目级 `project.json` 或 `package.json` 的 `nx` 字段
- **任务三来源**：`package.json` 的 `scripts` + `project.json` 的 `targets` + 插件推断（Project Crystal），三者合并
- **跑单个任务**：`nx <target> <project>`，如 `nx build myapp`
- **跑多项目**：`nx run-many -t build lint test`，`-p app1 app2` 限定项目
- **只跑受影响**：`nx affected -t test`（相对 `defaultBase`，默认 `main`）
- **编排**：`nx.json` 里 `targetDefaults.build.dependsOn = ["^build"]`（先构建依赖）
- **缓存**：target 上 `"cache": true`；本地缓存默认落在 `.nx/cache`
- **看图/查配置**：`nx graph`（项目图）、`nx show project myapp --web`（项目详情 + 最终生效配置）
- **Nx 21 起**默认交互式 **Terminal UI（TUI）** 展示任务输出，可在 `nx.json` 的 `tui` 关闭

## Nx 是什么

Nx 是一个**技术无关的构建平台**，核心是一个 Rust 实现的任务运行器。它通过分析文件系统构建**项目图**（识别项目、推导项目间依赖与外部依赖），再在你每次运行命令时派生**任务图**并按依赖顺序并行执行、缓存结果。

关键在于**渐进式采用**：只用 Nx Core 就能获得任务编排 + 本地缓存；需要更多能力时，再叠加插件、Nx Cloud（远程缓存/分布式）与 Nx Console（编辑器集成）。

## 安装与初始化

新建工作区（会引导选择技术栈 preset）：

```bash
npx create-nx-workspace@latest myorg
```

把 Nx 加进一个已存在的仓库（npm/yarn/pnpm workspaces、Lerna 等都可）：

```bash
npx nx@latest init
```

为某项技术安装官方插件（版本会与仓库 Nx 对齐）：

```bash
nx add @nx/react
nx add @nx/vite @nx/eslint
```

::: tip 版本一律走 Nx 自己的命令
`nx` 与所有 `@nx/*` 包必须保持**同一版本**。升级用 `nx migrate`，新增插件用 `nx add`——不要手动改 `package.json` 里的版本号，否则容易版本错配。
:::

## 两层配置：`nx.json` 与 `project.json`

Nx 的配置分两层：

- **工作区级 `nx.json`**：注册 `plugins`、设定 `targetDefaults`（跨项目的目标默认值）、`namedInputs`、`parallel`、`cacheDirectory`、`defaultBase`、`generators` 默认项、`release`、`sync`、`tui`、`nxCloudId` 等。
- **项目级配置**：`project.json`（Nx 专用文件）或 `package.json` 里的 `"nx"` 字段，二者等价，按喜好选一种；Nx 会把它们与推断结果合并。

一个最小的 `nx.json`：

```json
{
  "plugins": [
    {
      "plugin": "@nx/eslint/plugin",
      "options": { "targetName": "lint" }
    }
  ],
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    }
  },
  "defaultBase": "main"
}
```

一个用 `package.json` 定义 target 的项目（`nx` 字段既能声明 `targets`，也能加 `tags` 等）：

```json
{
  "name": "mylib",
  "scripts": {
    "test": "jest"
  },
  "nx": {
    "targets": {
      "build": {
        "command": "tsc -p tsconfig.lib.json"
      }
    }
  }
}
```

同样的配置写成 `project.json`：

```json
{
  "name": "mylib",
  "targets": {
    "test": {
      "command": "jest"
    },
    "build": {
      "command": "tsc -p tsconfig.lib.json"
    }
  }
}
```

**配置优先级（后者覆盖前者）**：插件推断的任务 < `nx.json` 的 `targetDefaults` < 项目级 `project.json`/`package.json`。想知道某项目某个 target 最终长什么样、每个设置来自哪里，运行：

```bash
nx show project mylib --web
```

## 运行任务

Nx 的运行语法是 `nx <target> <project>`：

```bash
# 跑单个项目的单个 target
nx build myapp
nx test mylib

# 跑多个项目的多个 target（Nx 自动按依赖顺序并行）
nx run-many -t build lint test
nx run-many -t build -p app1 app2

# 只跑受本次改动影响的项目（相对 defaultBase）
nx affected -t test
```

`run-many` 会按 `dependsOn` 与任务图**自动排序并并行**；`affected` 则先根据 Git 变更算出「可能受影响的最小项目集」，再等价于对该集合执行 `run-many`。

**根级任务**（作用于整仓、又想吃到缓存）可在根 `package.json` 声明，并加上 `"nx": {}` 让 Nx 感知：

```json
{
  "name": "myorg",
  "scripts": {
    "docs": "node ./generateDocsSite.js"
  },
  "nx": {}
}
```

若希望仍用包管理器触发但让 Nx 缓存，可用 `nx exec`：

```json
{
  "scripts": {
    "docs": "nx exec -- node ./generateDocsSite.js"
  },
  "nx": {}
}
```

## 定义任务管道

任务之间常有先后：构建一个 app 前要先构建它依赖的库。用 `dependsOn` 表达，通常写在 `nx.json` 的 `targetDefaults` 以便对所有项目生效：

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

`^build` 表示「先在**所有依赖项目**上跑 `build`」。于是 `nx build myapp` 会先构建 `myapp` 依赖的库，再构建 `myapp`。更多语义见 [任务编排与管道](./guide-line/task-pipeline.md)。

## 可视化与项目图

```bash
# 交互式项目依赖图（浏览器打开）
nx graph

# 聚焦某个项目及其邻居
nx graph --focus=myapp

# 查看某项目的所有 target 及最终生效配置、来源
nx show project myapp --web

# 列出全部项目
nx show projects
```

项目图由 Nx 自动分析源码 import、`package.json`/`project.json`、TypeScript 路径映射等推导，并做增量缓存——只重新分析你改过的文件。
