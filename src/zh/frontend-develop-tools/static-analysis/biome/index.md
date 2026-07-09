---
layout: doc
---

# Biome

用 Rust 编写的一体化 Web 工具链——单个工具同时提供格式化（对位 Prettier）与代码检查（对位 ESLint），外加 import 整理与代码助手（Assist）。

## 评价

### 优点

- 一体化：lint + format + 整理 import 三合一，一个 `@biomejs/biome` 取代 ESLint + Prettier 二件套，无需协调两套工具与一堆插件
- 极快且零依赖：Rust 编写，格式化与 ESLint 同名规则的检查在大仓库上远快于 JS 实现；零配置即可 `biome check` 跑起来
- 与 Prettier 约 97% 兼容、内置 500+ lint 规则（覆盖 ESLint / typescript-eslint 等来源），并提供 `biome migrate eslint/prettier` 一键迁移
- v2 起支持**不依赖 tsc 的类型感知 lint**（自研类型推断引擎）、GritQL 插件、Assist、按框架分组的 domains 与多文件分析

### 缺点

- 自定义规则只能用 GritQL 插件编写，生态与表达力远不及 ESLint 的 JS 插件体系
- 类型感知 lint 覆盖尚不完整（如 `noFloatingPromises` 约覆盖 typescript-eslint 75% 场景），部分边缘规则仍未实现
- 默认值与 Prettier 有差异（缩进默认 `tab`、整理 import 归入 Assist 等），从既有工具迁移需注意行为变化

## 文档地址

[Biome](https://biomejs.dev/)

## GitHub地址

[biomejs/biome](https://github.com/biomejs/biome)

## 幻灯片地址

<a href="/SlideStack/biome-slide/" target="_blank">Biome</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=biome" target="_blank" rel="noopener noreferrer">Biome 测试题</a>
