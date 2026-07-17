---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 reduxjs/redux-toolkit 官方 skills（`packages/toolkit/skills/`，`library_version 2.11.2`；RTK 最新 2.12.0）与 `packages/rtk-query-codegen-openapi/skills/` 编写。

## 速查

- **是什么**：Redux 官方在**主仓库** `reduxjs/redux-toolkit` 内建的 agent 技能集（`packages/toolkit/skills/`，根 `skills/` 有 symlink），MIT
- **9 个 SKILL.md / 5 大任务类**：
  - `build-modern-redux-apps` → `modern-redux`、`redux-dataflow`
  - `model-redux-state` → `build-slices-and-selectors`、`design-state-ownership`
  - `manage-server-data` → `adopt-rtk-query`（+ 代码生成包里的 `generate-rtk-query-from-openapi`）
  - `orchestrate-side-effects` → `handle-side-effects`
  - `evolve-and-diagnose-redux-apps` → `debug-redux-toolkit-apps`、`migrate-to-modern-redux`
- **每个 SKILL.md 结构**：frontmatter（`description` 的 Use when… + `type` + `requires` 依赖 + `sources`）→ **Setup**（可跑代码）→ **Core Patterns** → **Common Mistakes**（`CRITICAL/HIGH/MEDIUM` + Wrong/Correct + `Source:`）→ References
- **现代 Redux 三件套**：`configureStore`（默认 middleware + DevTools）· `createSlice`（Immer + 自动 action creators）· typed hooks（`useDispatch.withTypes` / `useSelector.withTypes`）
- **数据获取**：RTK Query `createApi`——服务端缓存首选，`providesTags`/`invalidatesTags` 管失效
- **核心心智**：event → reducer → selector → render；reducer 纯函数、事件式 action、selector 派生
- **激活**：装进 agent 后按 `description` 自动匹配触发；也可显式说「用 RTK 建 store」

## 官方定位：主仓库内建

Redux Toolkit（`@reduxjs/toolkit`）是 Redux 官方「**编写 Redux 逻辑的标准方式**」——集成了 store 配置、reducer/action 生成、异步、数据缓存的 batteries-included 工具集。而 **Redux Toolkit Skills** 是它把这套最佳实践**面向 AI agent** 打包的产物：

- 源码在主仓库 `reduxjs/redux-toolkit` 的 `packages/toolkit/skills/`（8 个）+ `packages/rtk-query-codegen-openapi/skills/`（1 个）
- 仓库根目录的 `skills/redux-toolkit`、`skills/rtk-query-codegen-openapi` 是 **symlink**，指向上面两处
- 跟 Angular Developer Skill、Next.js 官方 skill 一样——**不单开仓库，跟框架代码同仓演进**，版本锁定当前 RTK（`library_version 2.11.2`）

这么设计的好处：技能里的每条「Correct」写法都跟着 RTK 版本走，`sources` 字段直接指向仓库内的文档路径（如 `docs/api/createSlice.mdx`、`docs/style-guide/style-guide.md`），可溯源。

## 为什么要这套技能：纠正训练数据

技能的核心价值是**纠偏**——大量 agent 被 RTK 1.x / 老 Redux 语料训练，仍在生成过时代码。技能用「Common Mistakes」直接点名这些：

| Agent 常犯（过时） | 技能纠正为（现代） |
| --- | --- |
| `createStore` + `applyMiddleware(thunk)` | `configureStore`（默认 middleware + DevTools） |
| `connect(mapState, mapDispatch)` | `useAppSelector` / `useAppDispatch` hooks |
| 手写 `switch (action.type)` reducer | `createSlice`（Immer + 自动 actions） |
| `extraReducers: { [type]: fn }` 对象语法 | `extraReducers: (builder) => builder.addCase(...)` |
| `middleware: [logger]` 数组 | `middleware: (gDM) => gDM().concat(logger)` |
| 手写 fetch loading-flag 状态 | RTK Query `createApi` |

## 5 大任务类总览

```text
build-modern-redux-apps      建现代应用：store 装配 + 数据流
├─ modern-redux              configureStore / Provider / typed hooks / SSR store 生命周期
└─ redux-dataflow            event→reducer→selector→render，事件式 action，selector 派生

model-redux-state            状态建模
├─ build-slices-and-selectors  createSlice / slice selectors / create.asyncThunk / entity adapter / 懒注入
└─ design-state-ownership      数据该放 Redux / 组件 / 路由？slice 尺寸与迁移

manage-server-data           服务端数据
├─ adopt-rtk-query             createApi / tag 失效 / 乐观更新 / 缓存模型
└─ generate-rtk-query-from-openapi  从 OpenAPI schema 生成 endpoints（代码生成包）

orchestrate-side-effects     副作用编排
└─ handle-side-effects         RTK Query vs createAsyncThunk vs thunk vs listener middleware

evolve-and-diagnose-redux-apps  演进与诊断
├─ debug-redux-toolkit-apps    重复请求 / stale 缓存 / 订阅过宽 / 序列化警告
└─ migrate-to-modern-redux     createStore→configureStore、reducer→createSlice、codemod、上 RTK Query
```

## 安装与激活

技能随主仓库分发。作为 agent 技能使用时，把 `packages/toolkit/skills/` 下的 `SKILL.md` 装进你的 agent（Claude Code / Cursor / Codex 等按各自的 skills 机制加载），agent 会依据每个 `SKILL.md` frontmatter 里的 `description`（`Use this when…`）在任务匹配时**自动激活**。

而项目里真正要装的运行时依赖是 Redux Toolkit 本身：

```bash
# 新项目脚手架（自带 RTK + React-Redux + TS）
npx create-react-app my-app --template redux-typescript

# 或在已有项目里装
npm install @reduxjs/toolkit react-redux

# OpenAPI 代码生成（可选）
npm install -D @rtk-query/codegen-openapi
```

## 现代 Redux：60 秒定位

一个最小现代 Redux 应用长这样（对应 `modern-redux` 技能的 Setup）：

```ts
// app/store.ts —— configureStore 自带默认 middleware + DevTools
import { configureStore } from '@reduxjs/toolkit'
import { counterSlice } from '../features/counter/counterSlice'

export const store = configureStore({
  reducer: { counter: counterSlice.reducer },
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

```ts
// app/hooks.ts —— 预类型化 hooks，组件里只用这两个
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

`createSlice` 用 Immer，reducer 里可以「直接改」；action creators 自动生成；组件通过 hooks 读写，不用 `connect`。这就是技能反复强调的「现代默认」。

## 下一步

- [指南](./guide-line) —— 5 大类逐类深入、createSlice/configureStore/RTK Query、副作用编排、调试与迁移、反模式清单
- [参考](./reference) —— 9 SKILL.md 分类表 + `requires` 依赖图、rtk-query-codegen-openapi、安装、版本、许可、链接
