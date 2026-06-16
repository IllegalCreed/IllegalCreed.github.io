---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Biome v2.5.0 编写

## 速查

- 安装（锁版本）：`npm i -D -E @biomejs/biome`（pnpm/yarn/bun 同理，`-E` = 精确版本）
- 运行：`npx @biomejs/biome <命令>`
- 一把梭：`biome check --write`（= 格式化 + lint + 整理 import，写回文件）
- 仅格式化：`biome format --write`；仅检查：`biome lint --write`
- 不安全修复：追加 `--unsafe`（可能改变语义，需复核）
- CI 只读校验：`biome ci`（不改文件，发现问题即失败）
- 生成配置：`biome init` → `biome.json`（或 `biome.jsonc`）
- 从 ESLint/Prettier 迁移：`biome migrate eslint --write` / `biome migrate prettier --write`
- 编辑器：VS Code / IntelliJ / Zed 官方扩展
- 配置全貌见 [配置](./guide-line/configuration.md)，CLI/字段速查见 [参考](./reference.md)

## 安装

Biome 是单个自包含二进制（Rust 编写），作为开发依赖安装。官方强烈建议用 `-E`（`--save-exact`）锁定精确版本：

```bash
# npm
npm i -D -E @biomejs/biome

# pnpm
pnpm add -D -E @biomejs/biome

# yarn
yarn add -D -E @biomejs/biome

# bun
bun add -D -E @biomejs/biome
```

::: tip 为什么锁版本
Biome 的格式化/lint 行为可能随小版本演进。锁死精确版本能保证团队成员、CI 与本地得到完全一致的结果，避免“在我机器上没问题”。
:::

## 运行命令

统一用 `npx @biomejs/biome <命令>`（下文简写为 `biome`）。四个核心命令：

```bash
biome format ./src    # 仅格式化
biome lint ./src      # 仅代码检查
biome check ./src     # 格式化 + lint + 整理 import（一把梭）
biome ci ./src        # CI 专用：只读，不改文件
```

::: tip check 一把梭
`biome check` 同时做三件事——格式化、lint、整理 import。日常最常用的就是它。
:::

## 写回与修复

默认只报告问题、不改文件。加 `--write`（旧别名 `--fix`）才会把**安全修复**、格式化与 import 排序写回：

```bash
# 应用安全修复 + 格式化 + 整理 import
biome check --write ./src

# 额外应用“不安全修复”（可能改变语义，需人工复核）
biome check --write --unsafe ./src
```

Biome 把修复分为**安全（safe）**与**不安全（unsafe）**：安全修复保证不改变语义，`--write` 即应用；不安全修复需显式 `--unsafe`。详见 [lint 与 format](./guide-line/lint-and-format.md)。

## 配置文件起步

零配置也能跑，但需要定制时生成一份配置：

```bash
biome init
```

会在项目根写出 `biome.json`（也支持 `biome.jsonc`）。最小示例：

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "formatter": {
    "indentStyle": "tab",
    "lineWidth": 80
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

- `formatter`：语言无关的格式化选项（缩进默认 `tab`、行宽默认 `80`）
- `linter.rules.recommended`：是否启用推荐规则集（默认 `true`）

字段全貌见 [配置](./guide-line/configuration.md)。

## 集成编辑器

Biome 提供一方扩展：

- **VS Code**：扩展市场搜索 **Biome**，支持保存即格式化、一键修复、整理 import
- **IntelliJ / WebStorm**、**Zed** 同样有官方扩展；Vim/Neovim/Sublime 有社区扩展

编辑器通过 Biome 内置的 LSP（`biome lsp-proxy`）接入。

## 集成 CI / Git Hooks

CI 用只读的 `ci` 命令，发现不合规即以非零退出码失败：

```bash
biome ci ./src
```

```json
// 配合 lint-staged 只查暂存文件（package.json）
"lint-staged": { "*.{js,ts,jsx,tsx,json,css}": "biome check --write --no-errors-on-unmatched" }
```

因为足够快，Biome 常被放在 `pre-commit` 做“第一道快门”。从 ESLint/Prettier 平滑切换见 [从 ESLint / Prettier 迁移](./guide-line/migration.md)；v2 的类型感知、Assist 与插件见 [类型感知与 Assist](./guide-line/type-aware-and-assist.md)。
