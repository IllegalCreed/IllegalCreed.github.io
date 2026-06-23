---
layout: doc
outline: [2, 3]
---

# 高亮重渲染与优化

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- 开启：Profiler 设置 →「Highlight updates when components render」
- 效果：组件重渲染时闪现彩色边框（频率高 = 颜色偏红）
- 用途：交互时一眼看出**不必要的重复渲染**
- 优化：`React.memo` / `useMemo` / `useCallback` / 稳定 key / state 下移
- 验证：优化后重看高亮 / Profiler，确认多余渲染消失
- React 19 Compiler 自动记忆化，多数手动优化可省

## 高亮更新（Highlight updates）

在 Profiler 面板**设置**里勾选 **「Highlight updates when components render」**后，每当组件重渲染，页面上会闪现**彩色边框**：

- 颜色随渲染频率变化（蓝→绿→黄→红，越红越频繁）
- 交互时观察：**不该变的区域却频繁闪烁**＝存在不必要的重渲染

> 这是发现性能问题最直观的方式：打字时整个列表都在闪？说明列表项没被正确记忆化。

## 定位不必要渲染

结合 Profiler 的「为什么渲染」：

1. 开高亮，交互时发现某区域异常频繁闪烁
2. 用 Profiler 录制该交互
3. 选中频繁渲染的组件，看「为什么渲染」
4. 多半是：父组件重渲染、传了**新的对象/函数引用**、context 变化

## 常见优化手段

发现多余渲染后，对症处理（再用 DevTools 验证）：

| 手段 | 适用 |
| --- | --- |
| `React.memo` | 子组件 props 未变时跳过渲染 |
| `useMemo` | 缓存昂贵计算 / 稳定对象引用 |
| `useCallback` | 稳定函数引用，避免子组件重渲染 |
| 稳定 `key` | 列表项避免错误复用 / 重建 |
| state 下移 | 把频繁变的 state 移到更小的子组件 |

> 优化后**再录一次 Profiler / 看高亮**，确认多余渲染真的消失——避免「凭感觉优化」。

## React Compiler 让优化自动化

React 19 起的 **React Compiler** 会自动为组件做记忆化，多数 `useMemo` / `useCallback` / `React.memo` 可省。在 Profiler 里被编译器记忆化的组件标 ✨——优化重心从「手写记忆化」转为「确认编译器生效」。

> 即便有 Compiler，理解高亮与「为什么渲染」仍是排查性能的基本功。

## 下一步

跨环境调试见 [独立应用与 RN](./standalone-rn.md)。
