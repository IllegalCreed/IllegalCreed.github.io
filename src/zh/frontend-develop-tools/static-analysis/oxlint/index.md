---
layout: doc
---

# oxlint

基于 Rust 的超高速 JavaScript / TypeScript Linter，来自 Oxc（The JavaScript Oxidation Compiler）工具链。

## 评价

### 优点

- 极快：比 ESLint 快 50–100 倍（随核心数提升），专为大型仓库与 CI 场景设计
- 零配置开箱即用：默认开启 `correctness` 类规则，不写 `.oxlintrc.json` 也能直接 `oxlint` 跑
- 内置 800+ 规则，一站覆盖 ESLint 核心 + TypeScript + React / Unicorn / Import / jsx-a11y / Jest 等热门插件，无需逐个安装依赖
- 1.x 起支持 `--fix` 自动修复与 type-aware linting（基于 TypeScript 原生重写 tsgolint），并提供 `@oxlint/migrate` 一键迁移 ESLint 配置

### 缺点

- 只做 lint、不做格式化（格式化交给配套的 oxfmt，且 oxfmt 仍在 `0.x`）
- 自定义 JS 插件仍处 alpha，复杂的组织自定义规则生态远不及 ESLint
- 规则总量与边缘插件覆盖仍在追赶 ESLint，部分 typescript-eslint 类型规则尚未实现

## 文档地址

[oxlint](https://oxc.rs/docs/guide/usage/linter)

## GitHub地址

[oxc-project/oxc](https://github.com/oxc-project/oxc)

## 幻灯片地址

<a href="/SlideStack/oxlint-slide/" target="_blank">oxlint</a>
