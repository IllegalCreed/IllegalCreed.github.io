---
layout: doc
outline: [2, 3]
---

# Action 与状态检查

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- action 列表：每次 dispatch 的 action（类型 + payload + 时间戳）
- 过滤：按 action 类型搜索过滤
- state 视图：Tree（树）/ Raw（原始）/ Chart（图）
- Diff：每个 action 对 state 的具体改动（增/删/改）
- 手动 dispatch：直接派发自定义 action 测 reducer
- 生成测试：基于 action 序列生成测试代码

## Action 列表

左侧按时间顺序列出每次 `dispatch` 的 action：

- **类型**（如 `counter/increment`）
- **payload**（携带的数据）
- **时间戳**

点击任一 action 查看其内容，以及它对 state 的影响（配合 Diff）。

## Action 过滤

action 多时可用**过滤**按类型搜索，只看关心的 action（如只看 `user/*` 相关），在海量 action 中快速定位。

## State 检查的多种视图

选中某个 action，右侧可切换查看那一刻的 state：

| 视图 | 用途 |
| --- | --- |
| **Tree** | 树形展开 state，逐层查看 |
| **Raw** | 原始 JSON |
| **Chart** | state 树的图形化展示 |

## Diff：状态改动一目了然

**Diff 视图**展示选中 action **对 state 做了什么具体改动**：

- 绿色 = 新增字段
- 红色 = 删除
- 黄色 = 修改

> 不必对比前后两份完整 state——Diff 直接高亮「这个 action 改了哪几个字段」。

## 手动 dispatch action

Redux DevTools 可**直接派发自定义 action**（或 action creator），无需在 UI 上操作触发：

```text
在 Dispatcher 输入：{ "type": "counter/increment" }
→ 直接测试 reducer 对该 action 的处理
```

> 用于快速验证 reducer 逻辑、复现特定状态，而不必在界面里一步步操作。

## 生成测试

基于记录的 action 序列与 state，Redux DevTools 可**生成测试代码**——把一次手动调试沉淀为回归测试的起点。

## 下一步

各状态库的接入方式见 [跨库接入](./integration.md)。
