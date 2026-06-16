---
layout: doc
outline: [2, 3]
---

# 从 ESLint / Prettier 迁移

> 基于 Biome v2.5.0 编写

## 速查

- 迁移 ESLint：`biome migrate eslint --write`（读 `.eslintrc.*` 与 flat config `eslint.config.js`、`extends`、`.eslintignore`）
- 迁移 Prettier：`biome migrate prettier --write`（读 `.prettierrc.*`，并自动启用 formatter/linter/整理 import）
- 纳入“受启发”规则：`--include-inspired`；纳入 nursery：`--include-nursery`
- 迁移需 Node 来加载解析 ESLint 插件；**不支持** YAML 配置
- 注意默认差异：Biome 缩进默认 `tab`、整理 import 归 Assist——迁移后行为可能与原工具略不同
- 策略：新项目直接上 Biome；重度依赖 ESLint 自定义规则的存量项目先评估覆盖度

## 为什么迁移

把 ESLint + Prettier 二件套合并为单个 Rust 工具：省去协调两套配置、安装一堆插件的成本，格式化与 lint 速度更快，且格式化与 Prettier 约 97% 兼容。

## 迁移 ESLint

```bash
biome migrate eslint --write
```

它会读取 ESLint 配置并尽量把对应设置/规则写入 `biome.json`：

- 支持 legacy `.eslintrc.*` 与 flat config（`eslint.config.js`）
- 解析 `extends` 与共享/插件配置、`.eslintignore`
- 加 `--include-inspired` 纳入“受 ESLint 启发但非严格对应”的规则（默认不含）
- 加 `--include-nursery` 纳入 nursery（实验）规则

::: warning 迁移前提与限制
- 需要 Node 来加载并解析 ESLint 插件
- **不支持** YAML 格式的 ESLint 配置
- 个别插件可能触发循环引用错误，可临时注释掉问题项再迁移
:::

## 迁移 Prettier

```bash
biome migrate prettier --write
```

它读取 `.prettierrc.*`（含 `overrides`）并转换为 Biome 格式化配置，同时**自动启用 formatter、linter 与整理 import**。

::: warning 默认值不同
Biome 默认值与 Prettier 不完全一致（如缩进默认 `tab`）。迁移会尽量映射你显式写过的选项，但未显式设置的项会落到 Biome 默认上，结果可能与原 Prettier 略有差异。`biome migrate prettier` 不支持 JSON5 / TOML / YAML 格式的 Prettier 配置。
:::

## 迁移后清理

确认 Biome 跑通后，卸载被取代的依赖：`eslint`、`@typescript-eslint/*`、各 `eslint-plugin-*`、`prettier`、`eslint-config-prettier` 等，并把 `package.json` 的 lint/format 脚本改为 `biome check`。

```json
// package.json
{
  "scripts": {
    "lint": "biome check ./src",
    "lint:fix": "biome check --write ./src",
    "ci": "biome ci ./src"
  }
}
```

## 迁移取舍

Biome 用单工具替代二件套，但要权衡：

- **能直接替代**：格式化（97% 兼容 Prettier）、绝大多数 ESLint / typescript-eslint 常用规则
- **需评估**：自定义规则只能用 [GritQL 插件](./type-aware-and-assist.md#插件-gritql)，生态与表达力不及 ESLint 的 JS 插件；类型感知 lint 覆盖尚不完整；少量边缘规则未实现

新项目可直接上 Biome；重度依赖 ESLint 自定义规则的存量项目，建议先用 `biome migrate eslint` 评估覆盖度，必要时局部保留 ESLint。配置细节见 [配置](./configuration.md)。
