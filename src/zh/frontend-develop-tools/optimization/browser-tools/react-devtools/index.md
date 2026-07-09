---
layout: doc
---

# React DevTools

React DevTools 是 Meta（React 团队）官方维护的 **React 应用调试工具**，以浏览器扩展（Chrome / Firefox / Edge）和独立应用（`react-devtools` npm 包）两种形态提供。浏览器内置 DevTools 只能看到编译后的 DOM，看不到 React 的组件抽象；React DevTools 补上这一层，提供两大面板：**Components**（组件树，检查/编辑 props、state、hooks、context）与 **Profiler**（录制渲染性能，火焰图分析哪些组件渲染慢、为什么重渲染）。它是 React 生态最基础、几乎人人必装的调试扩展。2026 年的看点是与 **React 19.2** 深度配合——Profiler 对 React 编译器（React Compiler）记忆化的组件标 ✨，且 React 19.2 在 Chrome Performance 面板注入 **React Performance Tracks**，把调度与渲染过程直接画进浏览器时间线。

## 评价

**优点**

- **React 官方**：与 React 同步迭代，支持最新特性（Hooks、Suspense、Compiler）
- **组件树可视化**：直接看 React 抽象层，而非编译后 DOM
- **props/state/hooks 实时检查编辑**：点选组件即可改值快速验证
- **Profiler 强大**：火焰图 + 排名图 + 「为什么渲染」定位性能问题
- **高亮重渲染**：一眼看出不必要的重复渲染
- **跨环境**：浏览器扩展 + standalone（调 React Native、Safari、Electron）

**缺点**

- **仅限 React**：只对 React（及 RN）应用有效
- **生产构建受限**：生产版 React 会隐藏部分调试信息（建议开发环境调试）
- **大型组件树卡顿**：超大应用的组件树/Profiler 有性能开销
- **依赖正确安装**：standalone 连接 RN/Safari 需额外配置

## 文档地址

[React Developer Tools](https://react.dev/learn/react-developer-tools)

## GitHub地址

[facebook/react · packages/react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools)

## 幻灯片地址

<a href="/SlideStack/react-devtools-slide/" target="_blank">React DevTools</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=react-devtools" target="_blank" rel="noopener noreferrer">React DevTools 测试题</a>
