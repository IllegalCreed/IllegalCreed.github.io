---
layout: doc
---

# Knip

从入口出发做全项目可达性分析，找出并自动清理 JavaScript / TypeScript 项目中**未使用的文件、导出与依赖**的一体化工具。

## 评价

### 优点

- 三类垃圾一网打尽：未使用的**文件** / **导出** / **依赖（含 unlisted / binaries / unresolved）**，一个工具替代 depcheck + ts-prune + ts-unused-exports + unimported
- **155+ 内置插件**按 `package.json` 依赖自动启用，能解析 ESLint / Vite / Vitest / Next 等工具的配置文件，开箱即获得低误报
- 支持 `--fix` 自动修复（删未用导出关键字、删 `package.json` 依赖、删未用文件、清 catalog），`--format` 顺手格式化
- 面向 monorepo：跨 workspace 分析有协同放大效应；非侵入，靠标准 JSDoc/TSDoc 标记而非私有注释

### 缺点

- 需要理解 `entry` / `project` 心智模型，复杂项目仍需手动补入口或写插件来消除误报
- 部分问题（`unlisted` 依赖、`duplicates` 重复导出）不可自动修复，需人工处理
- 依赖 TypeScript 与 `@types/node`（peer 依赖），要求 Node ≥ 20.19；产物分析准确度受插件覆盖度影响

## 文档地址

[Knip](https://knip.dev/)

## GitHub地址

[webpro-nl/knip](https://github.com/webpro-nl/knip)

## 幻灯片地址

<a href="/SlideStack/knip-slide/" target="_blank">Knip</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=knip" target="_blank" rel="noopener noreferrer">Knip 测试题</a>
