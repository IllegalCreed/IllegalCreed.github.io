---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- 安装：Chrome / Firefox / Edge 扩展商店搜「React Developer Tools」
- 两大面板：**Components**（组件树）+ **Profiler**（渲染性能）
- 图标变色：扩展图标在 React 站点会高亮，提示检测到 React
- 选中组件：Components 里点组件 → 右侧看 props / state / hooks
- Console 引用：选中组件后 `$r` = 该组件实例（`$r.props` / `$r.state`）
- 编辑：双击 props / state 值直接改，页面实时更新
- 高亮重渲染：Profiler 设置开「Highlight updates when components render」
- standalone：`npx react-devtools`，调 React Native / Safari / Electron

## 安装

| 形态 | 方式 | 适用 |
| --- | --- | --- |
| 浏览器扩展 | Chrome / Firefox / Edge 商店搜「React Developer Tools」 | 网页 React 应用 |
| 独立应用 | `npm i -D react-devtools` → `npx react-devtools` | React Native / Safari / Electron |

安装扩展后，打开任意 React 站点，DevTools 里会多出 **Components ⚛** 与 **Profiler ⚛** 两个标签。扩展图标变彩色即表示检测到 React（灰色表示无 / 生产构建）。

## 两大面板

### Components ⚛

展示 React **组件树**（而非 DOM 树）：

- 点选组件 → 右侧看其 **props / state / hooks / context**
- 双击值可**直接编辑**，页面实时响应
- 搜索框按组件名过滤
- 右键组件有「Log this component」「Inspect the matching DOM element」等

### Profiler ⚛

录制一段交互期间的渲染性能：

- 火焰图 / 排名图展示各组件渲染耗时
- 点击组件看**它为什么重渲染**（哪些 props/state 变了）
- React Compiler 记忆化的组件标 ✨

## $r：Console 里操作组件

在 Components 选中某组件后，切到 Console 输入 **`$r`** 即引用该组件实例：

```js
$r          // 当前选中的组件实例
$r.props    // 它的 props
$r.state    // 它的 state（类组件）
```

> 类似浏览器 DevTools 的 `$0`（选中 DOM 元素），`$r` 是 React DevTools 提供的「选中组件」引用。

## 与浏览器内置 DevTools 的关系

浏览器 DevTools（Elements/Console/Network）看的是**编译后的 DOM 与运行时**；React DevTools 看的是 **React 的组件抽象层**。两者配合：DOM 层问题用浏览器 DevTools，组件/渲染问题用 React DevTools。

## 下一步

- [组件树导航](./guide-line/components-tree.md)：树导航、搜索、过滤、定位 DOM/source
- [Props/State/Hooks](./guide-line/props-state-hooks.md)：检查与编辑、context、`$r`
- [Profiler 性能剖析](./guide-line/profiler.md)：录制、火焰图、为什么渲染、Compiler ✨
- [高亮重渲染与优化](./guide-line/highlight-optimize.md)：高亮更新、定位与消除多余渲染
- [独立应用与 RN](./guide-line/standalone-rn.md)：standalone、React Native、Performance Tracks
