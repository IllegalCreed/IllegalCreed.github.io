---
layout: doc
outline: [2, 3]
---

# Profiler 性能剖析

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- 录制：Profiler 面板点录制 → 交互 → 停止；或「Reload and start profiling」测首屏
- 火焰图（Flamegraph）：层级 + 各组件本次 commit 渲染耗时
- 排名图（Ranked）：按渲染耗时排序，找最慢组件
- Commits：顶部每个竖条 = 一次提交，点选看该次渲染
- 为什么渲染：设置开「Record why each component rendered」
- Compiler：React 编译器记忆化的组件标 ✨
- 灰色组件 = 本次未渲染

## 录制性能

Profiler 面板：

- **录制交互**：点圆形录制按钮 → 在页面操作 → 再点停止
- **测首屏渲染**：点「Reload and start profiling」重载并从头录制

录制结束后得到一组 **commit（提交）**，每次状态更新触发的渲染对应一个 commit。

## 火焰图（Flamegraph）

展示该次 commit 的组件**层级与渲染耗时**：

- 条越宽 = 渲染（含子树）耗时越长
- 颜色：黄 / 橙表示耗时较多，灰色表示本次**未重新渲染**
- 点击组件看其本次渲染耗时与原因

## 排名图（Ranked）

把本次 commit 的组件**按自身渲染耗时降序排列**，一眼看出最慢的组件，适合快速定位性能热点。

## Commits 时间线

顶部一排竖条代表录制期间的每次 commit（高度 / 颜色反映耗时）。点选某个 commit 查看那一次的火焰图——可逐次分析「哪一次更新最贵」。

## 为什么重渲染

在 Profiler **设置**里勾选 **「Record why each component rendered while profiling」**，录制后点组件即可看到它**为什么渲染**：

- Props changed（哪些 props 变了）
- State / Hooks changed
- Context changed
- Parent re-rendered（父组件重渲染带动）

> 这是消除「不必要重渲染」的关键——先知道为什么渲染，才能对症下药。

## React Compiler 与 ✨

React 19 起的 **React Compiler** 会自动记忆化组件。在 Profiler 里，被编译器记忆化的组件会标上 **✨**，帮助确认编译器是否如预期生效、哪些组件已被自动优化。

## 下一步

实时高亮重渲染与优化技巧见 [高亮重渲染与优化](./highlight-optimize.md)。
