---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- 安装：浏览器扩展（Chrome/Firefox/Edge）或 `npx react-devtools`（RN/Safari）
- 面板：Components ⚛（组件树）+ Profiler ⚛（渲染性能）
- 选中组件 → `$r`（`$r.props` / `$r.state`）
- 编辑 props/state：双击值，页面实时更新
- 高亮重渲染：Profiler 设置 → Highlight updates
- 为什么渲染：Profiler 设置 → Record why each component rendered
- 完整说明见 [入门](./getting-started.md) / [组件树导航](./guide-line/components-tree.md) / [Props/State/Hooks](./guide-line/props-state-hooks.md) / [Profiler](./guide-line/profiler.md) / [高亮与优化](./guide-line/highlight-optimize.md) / [独立应用与 RN](./guide-line/standalone-rn.md)

## 两大面板

| 面板 | 用途 |
| --- | --- |
| **Components ⚛** | 组件树、props/state/hooks/context 检查编辑 |
| **Profiler ⚛** | 录制渲染性能、火焰图、为什么渲染、Compiler ✨ |

## Console 引用

| 变量 | 含义 |
| --- | --- |
| `$r` | 当前选中的组件实例 |
| `$r.props` | 它的 props |
| `$r.state` | 它的 state（类组件） |

## Profiler 工作流

1. （可选）设置开「Record why each component rendered」
2. 点录制 / Reload and start profiling
3. 交互后停止
4. 看 Flamegraph（耗时层级）/ Ranked（最慢组件）
5. 点组件看「为什么渲染」
6. 优化后重录验证

## 优化手段对照

| 手段 | 作用 |
| --- | --- |
| `React.memo` | props 未变跳过渲染 |
| `useMemo` | 缓存计算 / 稳定引用 |
| `useCallback` | 稳定函数引用 |
| 稳定 `key` | 避免列表错误复用 |
| React Compiler | 自动记忆化（标 ✨） |

## 安装形态

| 形态 | 命令 / 方式 | 适用 |
| --- | --- | --- |
| 浏览器扩展 | 商店搜「React Developer Tools」 | 网页 |
| standalone | `npx react-devtools` | RN / Safari / Electron |

## 官方资源

- 文档：[https://react.dev/learn/react-developer-tools](https://react.dev/learn/react-developer-tools)
- Profiler：[https://react.dev/reference/react/Profiler](https://react.dev/reference/react/Profiler)
- React Native DevTools：[https://reactnative.dev/docs/react-native-devtools](https://reactnative.dev/docs/react-native-devtools)
- GitHub：[facebook/react · react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools)
