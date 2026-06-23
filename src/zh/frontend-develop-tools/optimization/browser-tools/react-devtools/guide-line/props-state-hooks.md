---
layout: doc
outline: [2, 3]
---

# Props / State / Hooks

> 基于 React 19.2 + React DevTools 6.x 编写

## 速查

- 选中组件 → 右侧栏看 props / state / hooks / context
- 编辑：双击值直接改，页面实时更新（快速验证 UI）
- hooks：按调用顺序列出，`useState` / `useReducer` / `useContext` / 自定义 hook
- context：显示组件消费的 context 值
- Console：`$r` = 选中组件，`$r.props` / `$r.state`
- 右键值 →「Copy value to clipboard」/「Store as global variable」

## 检查 props

选中组件，右侧 **props** 区显示它当前接收的所有属性值（对象 / 数组可展开）。用于确认「父组件到底传了什么」——很多 bug 源于 props 与预期不符。

## 编辑 props / state

**双击值即可编辑**，修改后页面**实时重渲染**：

- 改 props 验证不同输入下的 UI（不必回父组件改代码）
- 改 state 模拟各种状态（loading / error / 空数据）
- 数字、字符串、布尔可直接改；对象可展开逐字段改

> 这是「免改代码快速验证 UI」的利器：想看「按钮 disabled 时长什么样」，直接把 `disabled` 改成 `true`。

## Hooks 列表

函数组件的 **hooks** 区按**调用顺序**列出所有 hook 及当前值：

- `State`（`useState`）/ `Reducer`（`useReducer`）：可编辑
- `Context`（`useContext`）：显示消费的 context
- `Memo` / `Callback` / `Ref` / `Effect`：对应各 hook
- **自定义 hook** 以其名字分组显示，内部 hook 嵌套展开

> hooks 按顺序展示，呼应 React「hook 调用顺序必须稳定」的规则——能直观看到每个 hook 的当前状态。

## Context

组件消费的 **Context** 值直接显示在检查栏，省去手动追踪 Provider 的麻烦——排查「context 值没更新 / 取到默认值」时很有用。

## Console 集成：$r

选中组件后，Console 里 **`$r`** 引用该组件实例：

```js
$r          // 选中的组件实例
$r.props    // props
$r.state    // state（类组件）
```

右键检查栏的值还可「Copy value to clipboard」或「Store as global variable」（存为 `$reactTemp1` 等）到 Console 进一步操作。

## 下一步

渲染性能分析见 [Profiler 性能剖析](./profiler.md)。
