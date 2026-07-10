---
layout: doc
outline: [2, 3]
---

# 时间旅行调试

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- jump：点 action 列表任意 action，跳转到那一刻的 state
- skip：跳过（取消）某个 action，看「没有它会怎样」
- slider：拖时间线滑块连续回放状态变化
- reorder：在历史里重排 action
- replay：回放整个 action 序列
- 前提：纯函数 reducer + 可序列化 state

时间旅行（time-travel）是 Redux DevTools 最标志性的能力，也是「可预测状态容器」的最大价值体现。

## 为什么能时间旅行

Redux 的设计是 **单向数据流 + 纯函数 reducer**：

- 每个状态变更都由一个 **action** 触发
- reducer 是**纯函数**：`(state, action) => newState`，相同输入必得相同输出
- 因此从初始 state + 一串 action，可**确定性地重建任意时刻的 state**

> 时间旅行不是「魔法」，而是纯函数可重放的自然结果——这也解释了为什么副作用要放在 reducer 之外。

## jump：跳转到任意状态

点击 action 列表中任意一条 action，应用的 state **立即回到那一刻**，页面 UI 同步还原。可在历史间自由前后跳，复现「状态是怎么一步步变成现在这样」。

## skip：跳过某个 action

把某个 action **标记为 skip（取消）**，Redux DevTools 重新计算「没有这个 action」时的 state 序列——用于验证某个 action 的真实影响、定位是哪个 action 引入了问题。

## slider：连续回放

时间线**滑块**可连续拖动，像视频进度条一样回放整个状态变化过程，直观看到 state 随 action 演进。

## reorder 与 replay

- **reorder**：调整 action 在历史中的顺序，观察对最终 state 的影响
- **replay**：从头回放整个 action 序列

## 时间旅行的前提

要让时间旅行可靠工作：

- **reducer 必须是纯函数**：无副作用、不可变更新
- **state 应可序列化**：避免在 state 里放函数、类实例等不可序列化值
- 副作用（API 调用等）放在 reducer 之外（thunk / saga / listener）

> 这些约束正是 Redux「可预测」的代价与收益——遵守它们，才能享受时间旅行。

## 下一步

action 与 state 的检查见 [Action 与状态检查](./action-state.md)。
