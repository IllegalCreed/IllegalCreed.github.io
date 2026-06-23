---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- 安装：Chrome / Firefox 商店搜「Redux DevTools」
- 接入：RTK `configureStore` 默认已集成；Zustand 用 `devtools` 中间件
- 核心：时间旅行（jump / skip / reorder / replay）+ state diff + 手动 dispatch
- action 列表：每次 dispatch 的 action（时间戳 + payload）
- import/export：导出 state 历史，分享/复现调试会话
- 本项目 Pinia 用 Vue DevTools，无需 Redux DevTools

## 安装与接入

### 浏览器扩展

```text
Chrome / Firefox 商店搜「Redux DevTools」
```

### Redux Toolkit（推荐）

RTK 的 `configureStore` **默认已集成** Redux DevTools，开发环境开箱即用：

```ts
import { configureStore } from "@reduxjs/toolkit";
const store = configureStore({ reducer: rootReducer });
// 开发环境自动连接 Redux DevTools 扩展
```

### Zustand 等其他库

Zustand 用 `devtools` 中间件接入：

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useStore = create(devtools((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 }), false, "inc"),
})));
```

> Jotai、NgRx 等也遵循 Redux DevTools 协议，可开箱接入。

## 核心面板

打开扩展后，主界面分三块：

| 区域 | 内容 |
| --- | --- |
| **Action 列表** | 按时间排列每次 dispatch 的 action |
| **状态 / Diff** | 当前 state、或选中 action 的 state diff |
| **控制条** | 时间旅行滑块、跳过、回放、dispatch |

## 时间旅行：标志性能力

- 点 action 列表里任意 action，**跳转到那一刻的 state**
- **skip** 某个 action，看「没有它会怎样」
- **slider** 拖动时间线滑块，连续回放状态变化
- 这依赖 Redux 的纯函数 reducer——状态变更可重放、可回溯

## 与 Vue DevTools 的边界

本项目用 **Pinia**，其状态调试（含 time-travel）由 **Vue DevTools** 提供，**无需 Redux DevTools**。Redux DevTools 面向 Redux / Zustand / Jotai / NgRx 等生态——本叶是这类状态库的调试知识补全。

## 下一步

- [时间旅行调试](./guide-line/time-travel.md)：jump / skip / reorder / 回放 / slider
- [Action 与状态检查](./guide-line/action-state.md)：action 列表、state diff、手动 dispatch、过滤
- [跨库接入](./guide-line/integration.md)：Redux / RTK / Zustand / Jotai / NgRx
- [导入导出与技巧](./guide-line/import-export.md)：导出历史、持久化、暂停、生成测试
