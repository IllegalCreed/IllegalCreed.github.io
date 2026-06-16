---
layout: doc
outline: [2, 3]
---

# 类型感知与插件

> 基于 oxlint v1.70.0 编写

## 速查

- type-aware：`oxlint --type-aware`，底层 `oxlint-tsgolint`（基于 TypeScript 原生重写），可跑需类型信息的规则
- 内置插件：`eslint` / `typescript` / `unicorn` / `react` / `react-perf` / `nextjs` / `oxc` / `import` / `jsdoc` / `jsx-a11y` / `node` / `promise` / `jest` / `vitest` / `vue`
- 默认启用一组（如 `react` / `unicorn` / `typescript` / `oxc`），其余在 `plugins` 中显式开
- JS 插件（**alpha**）：用 `jsPlugins` 加载，可写自定义规则
- 多文件分析：`import` 插件可做跨文件检查
- 格式化：交给配套的 **oxfmt**，oxlint 自身不做格式化

## 类型感知 linting

oxlint 默认是**单文件、无类型**的快速 lint。但 typescript-eslint 中有一批规则依赖类型信息（如 `no-floating-promises`、`no-misused-promises`），传统上 oxlint 跑不了。

type-aware 能力补上了这块：

```bash
oxlint --type-aware
```

它底层依赖 `oxlint-tsgolint`——基于 TypeScript 团队"原生（Go）重写"的类型引擎，因此即便带上类型检查，速度仍远快于 typescript-eslint。这是 1.x 的重点演进方向，能力仍在扩展中。

## 内置插件

oxlint 把常用生态的规则用 Rust 重新实现并内置：

| 领域       | 插件                                                  |
| ---------- | ----------------------------------------------------- |
| 核心 / TS  | `eslint`、`typescript`、`oxc`                         |
| 代码质量   | `unicorn`、`promise`、`node`、`import`、`jsdoc`        |
| 框架       | `react`、`react-perf`、`nextjs`、`vue`                |
| 可访问性   | `jsx-a11y`                                            |
| 测试       | `jest`、`vitest`                                      |

启用方式见 [配置 - plugins](./configuration.md#plugins-开启插件)。注意 `plugins` 字段会整体替换默认集。

## 多文件分析

早期 linter（含早期 oxlint）多为单文件分析。oxlint 现已支持跨文件分析，`import` 插件能据此检查"导入了不存在的成员""循环依赖"等需要看多个文件才能发现的问题。

## JS 插件（alpha）

除了内置的 Rust 插件，oxlint 允许用 JavaScript 写自定义规则，通过 `jsPlugins` 加载：

```json
{
  "jsPlugins": ["./my-rules/index.js"]
}
```

API 思路与 ESLint 规则接近，便于把组织内部的 ESLint 自定义规则迁移过来。该能力目前处于 **alpha**，复杂场景仍建议保留 ESLint。

## 配套：oxfmt

oxlint 只负责 lint。格式化由同属 Oxc 工具链的 **oxfmt** 负责（独立二进制，对位 Prettier）。oxfmt 仍在 `0.x`，但与 oxlint 组合即可得到"Rust 全家桶"的 lint + format 体验。
