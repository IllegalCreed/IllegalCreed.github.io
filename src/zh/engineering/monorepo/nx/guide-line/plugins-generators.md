---
layout: doc
outline: [2, 3]
---

# 插件、执行器与生成器

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **插件（plugin）四类能力**：推断任务、生成代码、维护依赖（migrations）、用 executor 增强工具
- **executor（执行器）= run 阶段**：定义「怎么跑一个 target」；内置 `nx:run-commands`、`nx:run-script`、`nx:noop`，官方如 `@nx/js:tsc`
- **generator（生成器）= write 阶段**：生成/修改代码与配置（脚手架、重构）；`nx g @nx/react:library mylib`
- **一句话区分**：executor 执行任务，generator 改文件；两者都来自插件
- **Project Crystal（inferred tasks，Nx 18+）**：插件读取工具配置文件，自动推断 target 的**命令/缓存/输入输出/依赖**
- **注册插件**：`nx.json` 的 `plugins`，可为字符串或 `{ plugin, options, include, exclude }`
- **插件顺序有意义**：多个插件推断出同名 target 时，**列在后面的胜出**
- **配置优先级**：推断 < `targetDefaults` < `project.json`/`package.json`
- **关掉推断**：`useInferencePlugins: false`（旧仓迁移时可能被自动设为该值）
- **查看推断结果**：`nx show project <p> --web`（还能看到每项来自哪）
- **两种采用风格**：**package-based**（贴近手写 package.json、按需加缓存）vs **integrated**（插件深度托管：推断 + 生成 + 迁移 + 公共 API）
- **造插件**：`@nx/plugin`（`generator`/`executor`/`migration`/`createNodes`）+ Nx Devkit

## 插件是什么，能做什么

Nx 插件让「最懂某工具怎么配 Nx 的人」把经验固化下来，供整个社区复用。一个插件通常提供四类能力：

- **推断任务（Infer tasks）**：如 `@nx/webpack` 依据 `webpack.config.js` 自动为 `build` 配好 inputs/outputs。
- **生成代码（Generate Code）**：如 `@nx/playwright:configuration` 在既有项目里一键装好 Playwright。
- **维护依赖（Maintain Dependencies）**：升级工具版本时自动更新配置（如 Storybook 7 的配置格式迁移）。
- **用 executor 增强工具（Enhance Tooling）**：如 `@nx/js:tsc` 结合 Nx 对仓库的理解 + TS batch mode，让构建更快。

插件分**官方**（`@nx/*`）与**社区**两类，可在官方 plugin registry 查找；也能用 Nx Devkit 自建。

## executor vs generator

二者是插件里两种截然不同的扩展点：

| 维度 | executor（执行器） | generator（生成器） |
| --- | --- | --- |
| 阶段 | **运行**任务（run） | **生成/修改**文件（write） |
| 目的 | 以「命令行做不到的高级方式」跑工具 | 脚手架、批量重构、保持配置同步 |
| 触发 | 运行某个 target 时（`nx build app`） | 手动或组合调用（`nx g ...`） |
| 例子 | `@nx/js:tsc`、`nx:run-commands` | `@nx/react:component`、`@nx/js:library` |

调用 generator：

```bash
nx g @nx/react:library mylib
nx g @nx/js:library util --dry-run   # 先看会改哪些文件
```

在 target 里显式指定 executor 与其选项：

```json
{
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "options": { "generateExportsField": true }
    }
  }
}
```

内置通用 executor：`nx:run-commands`（包裹任意命令）、`nx:run-script`（跑 package.json script）、`nx:noop`。此外还有 **sync generator**：由 `nx sync` 或 target 的 `syncGenerators` 触发，用于让配置文件与项目图保持一致（Nx 19.8+）。

## Project Crystal：任务推断

自 **Nx 18** 起，插件能根据工具配置文件**自动推断任务**。很多工具的配置文件已经定义了「做什么」，Nx 复用它来推断「该怎么跑 + 怎么缓存」。

**插件如何推断**（各插件逻辑不同，但都经这两步）：

1. **探测配置文件**：如 `@nx/webpack` 在仓库里找 `webpack.config.js`，每找到一个就为其推断任务。
2. **创建推断任务**：任务名来自你在 `nx.json` 里给插件的配置；缓存等设置从工具配置读取。`@nx/webpack` 默认造出 `build`/`serve`/`preview`。

**插件推断出的属性**：命令（怎么调用工具）、可缓存性、inputs、outputs、任务依赖。

**注册与顺序**：插件写在 `nx.json` 的 `plugins`，按数组顺序处理；**同名 target 由靠后的插件胜出**（如同一项目同时有 `vite.config.js` 和 `webpack.config.js`，谁的插件排在后面，`build` 就用谁的）。

```json
{
  "plugins": [
    "@my-org/graph-plugin",
    {
      "plugin": "@nx/jest/plugin",
      "include": ["packages/**/*"],
      "exclude": ["**/*-e2e/**/*"]
    }
  ]
}
```

**覆盖推断的优先级**（由低到高）：

1. 插件推断的任务配置
2. `nx.json` 的 `targetDefaults`
3. 项目的 `project.json`/`package.json`（最高，最具体）

**查看最终生效配置**（推断看不到显式配置，必须查）：

```bash
nx show project my-project --web
```

**关闭推断**：设 `useInferencePlugins: false`（升级旧仓时迁移脚本可能自动设成它）。此时新项目用 executor 显式定义 target，`nx add` 也不再写 plugin 条目。

即便全面拥抱推断，`project.json` 与 executor 仍有价值：用来**覆盖推断的选项**、以及定义**无法从命令行推断的任务**（如 TypeScript batch mode）。

## integrated vs package-based（两种采用风格）

Nx 可以两种风格落地，区别在「让 Nx/插件托管多少」：

- **package-based（包为中心）**：更接近你手写的 `package.json` + workspaces，工具由你自己配置，Nx 主要提供任务编排与缓存，按需逐步引入。适合从 npm/yarn/pnpm workspaces 平滑迁入、想少改动的团队。
- **integrated（集成式）**：插件深度参与——推断任务、代码生成、`nx migrate` 自动升级，配合 `index.ts` 公共 API 与 module boundaries，自动化程度最高。适合追求统一 DX、强约束的大团队。

**Project Crystal 缩小了两者差距**：推断让「保留原生工具配置文件」的 package-based 仓库也能享受精确缓存与任务依赖，而不必迁成一堆 executor。造自己的插件时，任务推断由 `createNodes` 实现，配合 generator/executor/migration + Nx Devkit 打包成 `@nx/plugin` 项目。
