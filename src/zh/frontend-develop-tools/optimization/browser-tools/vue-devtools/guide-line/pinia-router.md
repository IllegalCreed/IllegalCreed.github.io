---
layout: doc
outline: [2, 3]
---

# Pinia 与路由

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

Vue DevTools 深度集成 Pinia 与 Vue Router，这是它相对浏览器内置 DevTools 的关键优势。

## 速查

- Pinia：查看所有 store 的 state / getters / actions，可直接编辑 state
- time-travel：Timeline 里按 action 回溯状态变更（Pinia 集成的杀手锏）
- Routing：当前路由、history、所有路由配置、params / query / meta
- 本项目用 Pinia，store 调试走 Vue DevTools（不必装 Redux DevTools）

## Pinia 面板

显示应用中所有 Pinia store：

- **store 列表**：每个 store 的 id 与当前状态
- **state**：响应式状态，**可直接双击编辑**，视图实时更新
- **getters**：计算派生值及当前结果
- **actions**：可查看（配合 Timeline 看调用与 state 变化）

```ts
// stores/counter.ts
import { defineStore } from "pinia";
export const useCounter = defineStore("counter", {
  state: () => ({ count: 0 }),
  actions: {
    inc() {
      this.count++;
    },
  },
});
// DevTools 的 Pinia 面板能看到 counter store，直接改 count、追踪 inc 调用
```

## Pinia time-travel（时间旅行）

Pinia 的 DevTools 集成中**最强大的是 Timeline 时间旅行**：

- 每次 action / state 变更记录为时间线事件
- 事件**按 action 分组**——能看到一个 action 内发生的所有 state 变化
- 可回溯到任意历史状态，复现「状态是怎么一步步变成现在这样的」

> 这是本项目（Pinia 栈）调试状态的利器：状态错乱时，沿时间线回放找到出错的那一步 action。

## Routing 面板

集成 Vue Router，调试路由：

- **当前路由**：path、name、params、query、meta、matched
- **history**：导航历史记录
- **所有路由**：列出应用注册的全部路由及其配置

> 排查「路由参数没拿到 / 守卫没生效 / meta 没传对」时，Routing 面板直接显示真实路由状态。

## 与 Redux DevTools 的边界

本项目用 **Pinia**，其状态调试（含 time-travel）完全由 **Vue DevTools** 提供，无需 Redux DevTools。Redux DevTools 面向 Redux/Zustand 等生态——详见「浏览器工具 · Redux DevTools」叶。

## 下一步

事件与性能时间线见 [Timeline 时间线](./timeline.md)。
