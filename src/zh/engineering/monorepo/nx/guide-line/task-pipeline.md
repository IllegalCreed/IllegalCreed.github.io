---
layout: doc
outline: [2, 3]
---

# 任务编排与管道

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **任务（task）= 一个 target 的一次调用**；`nx test lib` 会建一个单节点任务图
- **项目图 ≠ 任务图**：即使 app 依赖 lib，`test app` 也不必依赖 `test lib`（可并行）；而 `build` 通常需要先 `^build`
- **`dependsOn` 两种基本语义**：`"^build"` = 先在**所有依赖项目**上跑 build；`"build"` = 先跑**本项目**的 build
- **全局编排**放 `nx.json` 的 `targetDefaults`；**单项目**放 `project.json` / `package.json`
- **targetDefaults 匹配键**：`${executor}` 键优先于 `${targetName}` 键；只取 **1** 条默认做合并；支持 **glob 键**（如 `e2e-ci--**/**`）
- **对象语法**：`{ "target": "build", "params": "forward"|"ignore", "projects": "{dependencies}"|"self"|["a","b"] }`；`params` 默认 `ignore`
- **通配 dependsOn（19.5+）**：`"build-*"`（本项目）、`"^build-*"`（依赖项目）
- **continuous（21+）**：常驻任务（如 `serve`）标 `"continuous": true`，其下游（如 `e2e`）不必等它退出
- **并行度**：`nx.json` 的 `parallel` 或 CLI `--parallel=N`（默认 3）
- **禁并行（19.5+）**：某 target 设 `"parallelism": false`，避免与他人争端口/内存（**仅限单机**）
- **编排只排序、不强制重跑**：产物已在位或可从缓存取回则直接跳过
- **查看顺序**：`nx graph`、`nx run-many -t build --graph`

## 项目图与任务图

Nx 分析源码得到**项目图**：既反映你仓库里的项目，也包含 Webpack、React 等**外部依赖**。项目通过 `package.json`/`project.json` 被识别，依赖关系多数由 Nx 自动从 import、TS 配置等推导，很少需要手动声明。

每次运行命令，Nx 从项目图**派生任务图**并执行。二者**不同构**：

- `nx test lib` → 单节点任务图。
- `nx run-many -t test -p app1 app2 lib`：即便 `app1`/`app2` 依赖 `lib`，**测试** `app1` 并不依赖**测试** `lib`——三个 test 任务可并行。
- 但若给 `test` 配了 `"dependsOn": ["^test"]`，任务图就会加上「先测依赖」的边。

不同 target 的任务可同时进行：Nx 构建 `app2` 的同时可以测试 `app1`。Nx 负责按正确顺序、尽量并行地跑完整张任务图。

## `dependsOn`：表达任务依赖

最常见的场景是「构建本项目前先构建它的依赖」：

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

- **`^build`**：先在本项目的**所有依赖项目**上跑 `build`。`nx build myreactapp` 会先 build `modules-shared-ui`、`modules-products`，再 build `myreactapp`。
- **`build`**（不带 `^`）：先跑**本项目**的另一个 target。例如 `test` 依赖 `build`：

```json
{
  "targets": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] }
  }
}
```

**重要**：`dependsOn` 只保证**顺序**，不等于「重跑」。如果依赖的产物已在正确位置，Nx 什么都不做；若不在但缓存里有，则从缓存恢复。

### 对象语法与参数传递

展开写法能控制作用范围与参数转发（`params` 为 `forward` 或 `ignore`，默认 `ignore`）：

```json
{
  "targets": {
    "build": {
      "dependsOn": [
        { "projects": "{dependencies}", "target": "build", "params": "forward" }
      ]
    },
    "test": {
      "dependsOn": [{ "target": "build" }]
    }
  }
}
```

- `"projects": "{dependencies}"` 等价于 `^`；`"projects": "self"` 指本项目；也可写具体项目数组 `["is-even", "is-odd"]`（v16+）。
- 从 **19.5+** 起 `dependsOn` 支持通配：`"build-*"` 匹配本项目的 `build-css`/`build-js`，`"^build-*"` 匹配依赖项目的同类 target。

## `targetDefaults`：消除重复配置

同一份 `dependsOn`/`inputs`/`outputs` 往往要给每个项目重复写，`targetDefaults` 让它们一次生效于全仓。

**键的匹配与优先级**（易错点）：为某 target 找默认时，Nx 依次看两类键——

1. `` `${executor}` ``（如 `@nx/js:tsc`）
2. `` `${targetName}` ``（如 `build`）

**executor 键优先于名称键**，且**只会取 1 条**默认与目标配置合并。因此若 `inputs`/`outputs` 同时想通过两种键生效，需在两处都写：

```json
{
  "targetDefaults": {
    "@nx/js:tsc": {
      "inputs": ["production", "^production"],
      "outputs": ["{workspaceRoot}/{projectRoot}"],
      "cache": true
    },
    "build": {
      "inputs": ["production", "^production"],
      "outputs": ["{workspaceRoot}/{projectRoot}"],
      "cache": true
    }
  }
}
```

对 **Task Atomizer** 插件（如 `@nx/cypress` 会为每个测试文件生成 `e2e-ci--test/foo.spec.ts` 这类 target）可用 glob 键统一配置：

```json
{
  "targetDefaults": {
    "e2e-ci--**/**": {
      "options": { "headless": true }
    }
  }
}
```

::: warning 同名不同 executor 时别在 targetDefaults 里塞 options
如果多个项目的同名 target 跑的是**不同命令/executor**，不要在 `targetDefaults` 里给它们设 `options`——不同命令接受的参数不同，硬塞可能让某些命令报错。
:::

## `continuous` 任务（Nx 21）

有些任务永不退出（如 dev server）。若把它放进别的任务的 `dependsOn`，下游会**永远等不到它结束**。Nx 21 用 `"continuous": true` 标记这类常驻任务，Nx 便不等它退出就启动下游：

```json
// apps/myapp/project.json
{
  "targets": {
    "serve": { "continuous": true }
  }
}
```

```json
// apps/myapp-e2e/project.json
{
  "targets": {
    "e2e": {
      "dependsOn": [{ "projects": "myapp", "target": "serve" }]
    }
  }
}
```

这样 `e2e` 会确保 `serve` 已在运行，但不会卡在等待其退出上。

## 并行与资源

- **并行度**：`nx.json` 的 `parallel`（最大并行 target 数）或 CLI `--parallel=5`；默认为 3。
- **禁并行（19.5+）**：需要独占端口/内存的 target 可设 `"parallelism": false`，保证它不与本机其他任务同时跑：

```json
{
  "targets": {
    "e2e": { "parallelism": false }
  }
}
```

注意 `parallelism` 只作用于**单台机器**。用 Nx Agents 分布式执行时，不同机器不共享资源，故多台 agent 同时跑「不可并行」的任务反而是最优解——这也是分布式对 e2e 之类任务的价值所在，见 [Nx Cloud 与分布式 CI](./nx-cloud.md)。
