---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Knip v6.17.1 编写

## 速查

- 环境要求：Node.js ≥ 20.19（或 Bun）；`typescript` 与 `@types/node` 为 peer 依赖
- 一键初始化（推荐）：`npm init @knip/config`（或 `pnpm create @knip/config`）
- 手动安装：`pnpm add -D knip typescript @types/node`
- 运行：`pnpm knip`；免安装试跑：`npx knip`
- 三类核心产出：未使用的**文件** / **导出（含类型）** / **依赖**
- 自动修复：`knip --fix`（删未用文件需加 `--allow-remove-files`）；改完格式化：`--format`
- 只看生产代码：`knip --production`（`-p`）；聚焦依赖：`knip --dependencies`
- 配置文件：`knip.json` / `knip.jsonc` / `knip.ts`，核心字段 `entry` + `project`
- 替代：depcheck / ts-prune / ts-unused-exports / unimported

## 环境要求

Knip v6 要求 **Node.js ≥ 20.19.0**（或 Bun）。`typescript` 与 `@types/node` 是 peer 依赖，需一并安装。

## 安装

最快的方式是用包管理器的初始化命令，它会装好依赖并写出一份最简配置：

```bash
npm init @knip/config
# 或
pnpm create @knip/config
bun create @knip/config
yarn create @knip/config
```

也可以手动安装：

```bash
pnpm add -D knip typescript @types/node
```

然后在 `package.json` 加一条脚本：

```json
{
  "scripts": {
    "knip": "knip"
  }
}
```

## 运行

```bash
# 通过脚本
pnpm knip

# 不安装直接试跑
npx knip
```

::: tip 开箱即用
首次运行 Knip 就会 lint 整个项目，报告未使用的依赖、导出与文件——大多数项目靠插件自动识别框架，**零配置**即可拿到有用结果。
:::

## 它在找什么

Knip 从 `entry`（入口文件）出发，顺着 `import` / `require` 构建整个项目的模块图，**走不到的就是死代码**。它把发现的问题分门别类报告，核心是三大类：

- **未使用的文件**：项目里存在、但没有任何地方引用到
- **未使用的导出**：`export` 了却没人 import（含未用的导出类型）
- **未使用的依赖**：装进 `package.json` 却没被代码用到

此外还有反向的 `unlisted`（用了却没写进 `package.json`）、`binaries`（脚本里调用却未声明的命令）、`unresolved`（解析不了的 import）等。完整清单见 [参考](./reference.md)。

## 一个工具替代一堆

Knip 把过去要分别安装的工具合并成一个：

| 老工具                | 职责             | Knip 对应能力          |
| --------------------- | ---------------- | ---------------------- |
| `depcheck`            | 未用/缺失依赖    | `dependencies`/`unlisted` |
| `ts-prune`            | 未用导出         | `exports`/`types`      |
| `ts-unused-exports`   | 未用导出         | `exports`/`types`      |
| `unimported`          | 未用文件         | `files`                |

其价值不只是合并：分析依赖会发现更多入口，进而暴露更多死导出与死文件——几件事**互相放大**，在 monorepo 尤其明显。详见 [为什么用 Knip](https://knip.dev/explanations/why-use-knip)。

## 自动修复

发现问题后，Knip 能自动帮你删：

```bash
# 应用所有可自动修复的问题
knip --fix

# 允许删除未使用的文件（默认不删文件）
knip --fix --allow-remove-files

# 修复后用本地格式化器（Prettier/Biome/dprint）整理
knip --fix --format
```

::: warning 改完务必复核
`--fix` 会改 `package.json` 和源码，删文件更是不可逆。请在 Git 工作区干净时运行，改完跑一次 `install` 并 `git diff` 复核。详见 [用法与自动修复](./guide-line/usage-and-fixing.md)。
:::

## 接入 CI

Knip 发现问题时以非零退出码结束，天然适合做质量门禁：

```bash
# 只检查生产代码（排除测试/配置文件与 devDependencies）
knip --production
```

把 `knip` 放进 CI，就能在 PR 阶段挡住死代码与死依赖的回归。配置入口/范围见 [配置](./guide-line/configuration.md)，monorepo 见 [Monorepo](./guide-line/monorepo.md)。
