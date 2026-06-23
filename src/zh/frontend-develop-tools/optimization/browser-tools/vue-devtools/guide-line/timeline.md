---
layout: doc
outline: [2, 3]
---

# Timeline 时间线

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

## 速查

- Timeline 统一记录：组件事件（emit）、Pinia mutations/actions、路由导航、性能
- 验证组件事件是否如预期触发、参数是否正确
- Pinia 事件按 action 分组，配合 time-travel 回溯
- 性能层（Performance）记录组件渲染耗时
- 适合排查「事件没触发 / 触发多次 / 顺序不对」

## Timeline 是什么

Timeline 把应用运行期间的各类**事件按时间轴统一呈现**，分层记录：

| 层 | 记录内容 |
| --- | --- |
| **Component events** | 组件 `emit` 的自定义事件 |
| **Pinia** | mutations / actions（按 action 分组） |
| **Router** | 路由导航 |
| **Performance** | 组件渲染耗时 |
| **Mouse / Keyboard** | 鼠标 / 键盘事件 |

## 验证组件事件

用 Timeline 确认组件的 `emit` 是否**如预期触发**、参数是否正确：

```vue
<script setup>
const emit = defineEmits(["submit"]);
function onClick() {
  emit("submit", { id: 1 }); // Timeline 的 Component events 层能看到这次 submit 及其参数
}
</script>
```

> 排查「点了按钮但父组件没反应」：先看 Timeline 是否真的 emit 了、参数对不对，快速区分是「没触发」还是「父组件没接住」。

## Pinia 事件追踪

Timeline 的 Pinia 层记录每次 mutation / action，**按 action 分组**——一个 action 内触发的所有 state 变化聚在一起，配合时间旅行可回溯到任意历史状态。是状态调试的核心视图。

## 性能时间线

Performance 层记录组件渲染耗时，帮助发现渲染开销大的组件。虽不及 Chrome Performance 面板的火焰图细致，但**结合 Vue 组件维度**看渲染更直观（知道是哪个组件、哪次状态变更引起的）。

## 路由与输入事件

- **Router** 层：每次导航的来源 / 目标路由，排查导航时序
- **Mouse / Keyboard** 层：用户输入事件，配合组件事件分析交互链路

## 下一步

点选跳源码与组件关系图见 [Inspector 与 Graph](./inspector-graph.md)。
