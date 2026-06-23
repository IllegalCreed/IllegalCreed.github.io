---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Angular 20 + Angular DevTools 编写

## 速查

- 安装：Chrome / Firefox 商店搜「Angular DevTools」
- 仅浏览器扩展，无 standalone；需 Angular 开发模式
- 三大面板：**Components**（组件/指令树）+ **Profiler**（变更检测）+ **Injector Tree**（DI）
- Components：检查 / 修改组件与指令实例状态
- Profiler：录制变更检测周期，柱越高 = CD 耗时越长
- Injector Tree：Angular 17+；environment + element 两棵 DI 树
- Signals：Angular 18+，追踪 signal 依赖与变化传播

## 安装

```text
Chrome / Firefox 应用商店搜「Angular DevTools」
```

- 仅**浏览器扩展**形态（不像 React/Vue 有 standalone）
- 打开 Angular 应用（**开发模式**）后，DevTools 多出 **Angular** 标签页
- 生产构建会隐藏调试信息，建议开发环境调试

## 三大面板

| 面板 | 用途 | 深入 |
| --- | --- | --- |
| **Components** | 组件 / 指令树，检查修改实例状态 | [组件与指令](./guide-line/components.md) |
| **Profiler** | 变更检测周期、生命周期钩子可视化 | [Profiler 变更检测](./guide-line/profiler.md) |
| **Injector Tree** | 依赖注入层级与解析路径（Angular 17+） | [Injector 注入树](./guide-line/injector-tree.md) |
| **Signals 调试** | 追踪 signal 依赖（Angular 18+） | [Signals 与优化](./guide-line/signals-cd.md) |

## Angular 调试的特殊性

与 React/Vue 不同，Angular 的调试核心围绕两个 Angular 特有机制：

- **变更检测（Change Detection）**：Angular 检测数据变化并更新视图的机制。性能问题多源于「CD 跑得太频繁/太重」——Profiler 正是为此设计
- **依赖注入（DI）**：Angular 的核心架构。Injector Tree 可视化 DI 层级，排查「服务注入到哪个层级、解析路径如何」

> 理解变更检测与 DI，才能用好 Angular DevTools 的 Profiler 与 Injector Tree。

## 与浏览器内置 DevTools 的关系

浏览器 DevTools 看编译后的 DOM 与运行时；Angular DevTools 看 **Angular 的组件/指令、变更检测、DI、Signals** 抽象层。两者配合：DOM/网络用浏览器 DevTools，Angular 机制用 Angular DevTools。

## 下一步

- [组件与指令](./guide-line/components.md)：组件 / 指令树、检查修改状态、定位
- [Profiler 变更检测](./guide-line/profiler.md)：录制 CD 周期、火焰图、生命周期钩子
- [Injector 注入树](./guide-line/injector-tree.md)：DI 层级、解析路径可视化
- [Signals 与优化](./guide-line/signals-cd.md)：signal 依赖追踪、变更检测优化
