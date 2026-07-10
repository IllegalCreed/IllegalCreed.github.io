---
layout: doc
outline: [2, 3]
---

# 跨库接入

> 基于 Redux DevTools 扩展 + Redux Toolkit 2.x 编写

## 速查

- Redux Toolkit：`configureStore` 默认集成（开发环境）
- 原生 Redux：`composeWithDevTools` 包裹 enhancer
- Zustand：`devtools` 中间件，第三参标注 action 名
- Jotai：`jotai-devtools` / atom devtools
- NgRx：`StoreDevtoolsModule.instrument()`

Redux DevTools 虽因 Redux 得名，但已成为状态调试的**通用协议**，多个状态库开箱接入。

## Redux Toolkit（推荐）

RTK 的 `configureStore` **默认已集成** Redux DevTools，开发环境无需额外配置：

```ts
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: { counter: counterReducer },
  // devTools 默认 true（生产环境自动关闭）
});
```

## 原生 Redux

不用 RTK 时，手动接入：

```ts
import { createStore } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";

const store = createStore(reducer, composeWithDevTools());
```

## Zustand

用 `devtools` 中间件，`set` 的第三个参数可**标注 action 名**（在 DevTools 里显示）：

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useStore = create(
  devtools((set) => ({
    count: 0,
    inc: () => set((s) => ({ count: s.count + 1 }), false, "inc"),
  })),
);
```

> 第三参 `"inc"` 让 DevTools 的 action 列表显示有意义的名字，而非匿名更新。

## Jotai 与 NgRx

- **Jotai**：用 `jotai-devtools` 或 atom 级 devtools 接入，调试 atom 状态
- **NgRx**（Angular 的 Redux 风格状态库）：`StoreDevtoolsModule.instrument({ maxAge: 25 })`

## 接入的本质

这些库都遵循 Redux DevTools 的**通信协议**：把状态变更包装成「action + 新 state」上报给扩展，从而复用时间旅行、diff、dispatch 等能力。只要状态变更可表达为「action → state」，就能接入。

## 下一步

导入导出与高级技巧见 [导入导出与技巧](./import-export.md)。
