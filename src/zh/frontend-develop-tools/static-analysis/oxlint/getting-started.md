---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 oxlint v1.70.0 编写

## 速查

- 安装：`pnpm add -D oxlint`
- 直接跑（零配置）：`pnpm exec oxlint` —— 默认只开 `correctness` 类（几乎确定是 bug 的规则）
- 指定目录：`oxlint src test`
- 自动修复：`oxlint --fix`（安全）/ 追加 `--fix-suggestions`、`--fix-dangerously`
- 生成配置：`oxlint --init` → `.oxlintrc.json`
- 规则类别：`correctness`(默认 on) / `suspicious` / `pedantic` / `perf` / `style` / `restriction` / `nursery`
- 从 ESLint 迁移：`npx @oxlint/migrate`（转 flat config），类型规则加 `--type-aware`
- 增量共存：ESLint 侧装 `eslint-plugin-oxlint` 关掉与 oxlint 重叠的规则
- 编辑器：VS Code 装官方 **Oxc** 扩展
- 格式化：oxlint **不做**格式化，交给配套的 **oxfmt**

## 安装

oxlint 是单个自包含二进制（Rust 编写），无需任何 peer 依赖：

```bash
pnpm add -D oxlint
```

也支持 npm / yarn / bun，或不安装直接试跑：

```bash
npx oxlint@latest
```

::: tip 几乎零接入成本
不用像 ESLint 那样安装一堆 `@typescript-eslint/*`、`eslint-plugin-*`——常用插件的规则已内置在二进制里。
:::

## 零配置直接跑

oxlint 最大的特点是开箱即用。装好后直接：

```bash
pnpm exec oxlint
```

默认只启用 `correctness` 类规则——也就是"几乎可以肯定是 bug"的规则（如 `no-debugger`、`no-dupe-keys`、`for-direction`），误报极低，适合无脑接入存量项目。输出会列出问题文件、规则名与定位，并以非零退出码让 CI 失败。

## 配置文件起步

需要更多规则或定制时，生成一份配置：

```bash
oxlint --init
```

会在项目根写出 `.oxlintrc.json`。最小示例：

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "rules": {
    "no-console": "warn"
  }
}
```

- `categories`：按"意图"批量开关规则组
- `rules`：精确控制单条规则，严重级支持 `off` / `warn` / `error`（也接受 `allow` / `warn` / `deny`）

字段全貌见 [配置](./guide-line/configuration.md)。

## 自动修复

```bash
# 安全修复（不改变语义）
oxlint --fix

# 叠加"建议级"修复
oxlint --fix --fix-suggestions

# 叠加"危险级"修复（可能改变语义，需人工复核）
oxlint --fix --fix-dangerously
```

## 和 ESLint 的关系

oxlint 定位是 ESLint 的**替代**而非补充——它覆盖了大部分 ESLint 核心与 typescript-eslint 规则。两条落地路线：

1. **彻底替换**：`npx @oxlint/migrate` 把现有 flat config 转成 `.oxlintrc.json`，之后只跑 oxlint。
2. **增量共存**：在 ESLint 侧装 `eslint-plugin-oxlint`，把 oxlint 已覆盖的规则关掉交给 oxlint（快），ESLint 只保留 oxlint 尚不支持的部分（如自定义插件）。

详见 [从 ESLint 迁移](./guide-line/migration.md)。

## 集成编辑器

VS Code 在扩展市场搜索并安装官方 **Oxc** 扩展，保存即时报告问题、支持一键 `--fix`；其它编辑器可通过 oxlint 内置的 language server 接入。

## 集成 CI / Git Hooks

```bash
# CI：发现问题即失败（默认行为）
pnpm exec oxlint
```

```json
// 配合 lint-staged 只查暂存文件（package.json）
"lint-staged": { "*.{js,ts,jsx,tsx}": "oxlint" }
```

因为足够快，oxlint 常被放在 `pre-commit` 做"第一道快门"，把较慢的 ESLint（若仍保留）留到 CI 跑。
