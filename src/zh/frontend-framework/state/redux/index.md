---
layout: doc
---

# Redux

**老牌 React 状态管理库 + 企业级首选**——准确地说，Redux 是 **2015 年由 Dan Abramov + Andrew Clark** 在 React Europe 现场演讲发布、灵感来自 **Flux 架构 + Elm 单向数据流 + 函数式 reducer 模式**的 JavaScript 状态容器。Redux 一词源自「**reducer**」（核心数据更新机制都是 pure reducer 函数）+「Flux」（Facebook 提出的单向数据流架构）的复合——名字本身就标记了它「**reducer 派 Flux**」的定位，与 **MobX**（响应式派）/ **Zustand**（hook 即 store 派）/ **Jotai**（atom 派）形成对照。Redux 提出的「**单一 store + immutable state + pure reducer + dispatch action + 中间件**」五件套已经成为前端状态管理的**事实通用语**——后来 Pinia / Zustand / NgRx / Vuex / Bloc 都在不同程度上引用了这个范式。**核心理念**：「**state is read-only + changes via pure reducer + single source of truth**」三大原则、配合「**action 是描述发生了什么的 plain object**」+「**reducer 是 (state, action) => state 的纯函数**」的契约，让状态变化**完全可预测、可序列化、可回放、可时间旅行**。**最重要的事**：**现代 Redux 必须用 Redux Toolkit（RTK） + React-Redux hooks**——纯 `redux` + `connect` HOC + 手写 reducer + `redux-thunk` 那套**老写法 2019 年起官方已经不再推荐**、所有官方文档与教程都以 RTK 为默认。**最新 v5.x**（Redux core v5.0.1 / 2024-12 发布 + Redux Toolkit v2.x / 2024 起 / React-Redux v9.x / 2024 起 + Reselect v5.x / 2024 起）作为一个**协调发布的版本群**（"Redux 2.0 wave"）已经**完全 TypeScript 重写**、**ESM 优先**、**drop UMD build**、引入 `UnknownAction` 替代 `AnyAction`、要求 **TypeScript 5.4+**——RTK 2.x 是当前事实标准（详见 [入门](./getting-started.md)）。**核心特性矩阵**：`configureStore`（一行设置、自动配置 thunk + DevTools + 不变性检查） / `createSlice`（自动 generated action creators + Immer mutable 写法 + extraReducers） / `createAsyncThunk`（pending / fulfilled / rejected 三阶段自动 dispatch） / **RTK Query**（数据获取 + 缓存 + 失效 + 自动生成 hooks，**官方推荐替代 useEffect + axios 模式**） / `createListenerMiddleware`（替代 redux-saga / redux-observable 的现代副作用方案） / `createEntityAdapter`（normalized state CRUD + memoized selector） / `createSelector`（Reselect 集成 + memoize） / **React-Redux hooks**（`useSelector` / `useDispatch` / `useStore` 替代 `connect` HOC） / **TypeScript 一等公民**（`RootState` / `AppDispatch` / `useAppSelector` / `useAppDispatch` 类型化 hooks） / **Redux DevTools** 时间旅行 / **persist**（redux-persist） / **SSR + Next.js** 完整集成 / **跨框架支持**（Vue / Angular / Svelte / vanilla 都能用 Redux core）。**典型用户群**：**全球大型企业应用的事实标准**——Facebook / Airbnb / Netflix / Slack / Atlassian / GitHub / Twitter / Uber / Lyft / Tesla / Microsoft / VS Code 等大量一线产品长期使用、复杂前端审计场景（金融 / 医疗 / 政府 / 物流）的首选、**Twitch / Microsoft Office Online / Trello / Asana** 内部状态管理基于 Redux。

## 评价

**优点**

- **生态最成熟**：10 年（2015-2026）演进、社区生态、最佳实践、教程、招聘、生产案例**全面领先**——大型项目找资深 Redux 工程师比找 Zustand / Jotai 工程师容易得多
- **Redux Toolkit 全面简化**：`configureStore` 一行替代手写 `applyMiddleware + composeWithDevTools` 样板、`createSlice` 自动 generated action creators + Immer mutable 写法、`createAsyncThunk` 三阶段自动 dispatch、`createListenerMiddleware` 替代 redux-saga——RTK 把传统 Redux 80% 的样板消除
- **RTK Query 数据层一体化**：内置数据获取 + 缓存 + 失效 + 重试 + 轮询 + 自动生成 React hooks（`useGetXxxQuery` / `useXxxMutation`）——**单一工具替代 React Query / SWR + axios + useEffect 全套**、且与 Redux store 深度集成（缓存可被其他 slice 读取）
- **严格单向数据流**：`action → reducer → state → view → action` 形成闭环、所有状态变化必须通过 dispatched action、所有 reducer 都是 pure function——**状态变化 100% 可审计**（金融 / 医疗 / 政府场景刚需）
- **Time-Travel 调试无可替代**：Redux DevTools 浏览器扩展可以**前进 / 回退每一个 action**、查看 state diff、重放历史、export 整个 session——这是 Zustand / Jotai / Pinia 等都达不到的强大调试能力
- **TypeScript 一等公民**：`RootState` / `AppDispatch` 自动从 store 推导、`useAppSelector` / `useAppDispatch` 类型化 hooks、`PayloadAction&lt;T&gt;` 严格类型、createAsyncThunk 三泛型 (`Returned` / `ThunkArg` / `ThunkAPIConfig`)、RTK Query 端点完整类型推导——大型项目 TypeScript 体验是顶级的
- **架构模式标准化**：单 store + slice 拆分 + action 命名规范（`domain/action`） + selector + thunk + middleware 五层分明、新人接手项目能快速理解结构——这种**架构约束**是 Zustand 自由风格做不到的
- **跨框架支持**：Redux core 是纯 JS、不依赖 React——可以在 Vue / Angular / Svelte / Solid / vanilla JS / Node / Web Worker 中使用，store 逻辑可在不同框架间复用
- **企业审计场景的首选**：所有 state 变化都是 dispatched action、所有 action 都可记录到 log / Sentry / 后端、所有 state snapshot 可序列化——金融 / 医疗 / 政府 / 物流的合规审计场景几乎只能用 Redux
- **中间件生态最丰富**：thunk / saga / observable / persist / logger / offline / form / undo / router / batched-actions / api 等 100+ 中间件，几乎任何需求都有现成方案
- **`createEntityAdapter` 标准化 CRUD**：normalized state（`ids` + `entities`）模式 + 预生成 `addOne` / `setMany` / `updateOne` / `selectById` / `selectAll`——大型列表 / 复杂关联数据的最佳实践

**缺点**

- **学习曲线陡**：action / reducer / dispatch / selector / thunk / middleware / slice / RTK Query / extraReducers / Immer / createListenerMiddleware **十多个概念**——新手通常需要 1-2 周才能熟练、远比 Zustand（10 分钟）/ Jotai（30 分钟）的学习成本高
- **样板代码仍偏多**：虽然 RTK 已大大简化、但相比 Zustand 的 `create((set) => ({...}))` 一行起、Redux 仍需要 store 文件 + slice 文件 + hooks 文件 + Provider 包装 + RTK Query 端点定义——**对小型项目仍偏重**
- **Bundle 体积**：`@reduxjs/toolkit` 约 13KB（含 Immer + Redux + Reselect 等）+ `react-redux` 约 8KB、加 RTK Query 再 9KB——总计 ~25-30KB gzip，**比 Zustand（~1KB）大一个数量级**
- **过度设计风险**：传统 Redux 文化里有「**所有 state 都进 Redux**」的执念——但**表单 state / UI 临时 state / fetched data**都进 Redux 通常是过度工程化、React 本地 state / RTK Query / React Hook Form 才是合适方案
- **老代码债务**：现存的 Redux 项目里仍有大量 `connect` HOC + `mapStateToProps` + 手写 reducer + redux-thunk 的**老代码**——RTK 迁移成本不低、新老风格并存增加维护难度
- **DevTools 性能**：开发模式 DevTools 序列化每次 action 的 state diff，大型 state（万级数组 / 复杂嵌套）会导致 DevTools 卡顿——需要 `actionsDenylist` / `predicate` 等优化（见 [指南](./guide-line.md)）
- **不再是 React 状态管理首选**：2026 年 npm 下载量上 **Zustand 已超越 RTK** 成为 React 状态库下载量第一——Redux 仍是大型 / 企业 / 严格审计场景的首选，但 React 官方文档（[Choosing a State Management Library](https://react.dev/learn/managing-state)）**已优先推荐 Zustand** 给中小型项目
- **`connect` HOC 已过时**：传统 `connect(mapStateToProps, mapDispatchToProps)` 写法虽未 deprecated 但**官方明确不再推荐**——现代写法必须用 `useSelector` / `useDispatch` hooks
- **vs Zustand**：Zustand 心智更轻、bundle 更小、API 更简——**中小项目用 Zustand、大型 / 严格审计用 RTK**
- **vs Jotai**：Jotai 是 atom 派、细粒度依赖追踪、组合式更自然——**派生 state 极多 / 跨组件原子共享场景用 Jotai、严格单向数据流场景用 RTK**
- **vs TanStack Query / SWR**：单纯做服务端数据获取 + 缓存，TanStack Query 心智更轻、生态独立——**纯数据层用 TanStack Query、状态 + 数据一体化用 RTK + RTK Query**

## 文档地址

[Redux 官网](https://redux.js.org/) | [Redux Toolkit 官网](https://redux-toolkit.js.org/) | [React-Redux 官网](https://react-redux.js.org/) | [Redux Essentials Tutorial](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)（官方教程）| [Migrating to RTK 2.0 & Redux 5.0](https://redux-toolkit.js.org/usage/migrating-rtk-2)（v4 → v5 迁移）| [Migrating to Modern Redux](https://redux.js.org/usage/migrating-to-modern-redux)（老 Redux → RTK 迁移）| [RTK Query 完整文档](https://redux-toolkit.js.org/rtk-query/overview) | [TypeScript Quick Start](https://redux-toolkit.js.org/tutorials/typescript) | [Usage With TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript)（进阶）

## GitHub 地址

[reduxjs/redux](https://github.com/reduxjs/redux) | [reduxjs/redux-toolkit](https://github.com/reduxjs/redux-toolkit) | [reduxjs/react-redux](https://github.com/reduxjs/react-redux) | [reduxjs/reselect](https://github.com/reduxjs/reselect)（memoized selector）| [rt2zz/redux-persist](https://github.com/rt2zz/redux-persist)（localStorage 持久化）| [Dan Abramov](https://github.com/gaearon)（联合创始人、React 核心团队）| [Mark Erikson](https://github.com/markerikson)（当前主维护者、Redux 长期布道者）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @reduxjs/toolkit react-redux` 安装 / 第一个 store（`configureStore`）/ 第一个 slice（`createSlice`）/ `<Provider>` 根部包装 / 在组件中（`useSelector` + `useDispatch`）/ Redux DevTools 浏览器扩展配置 / TypeScript 基础（`RootState` / `AppDispatch` / `useAppSelector` / `useAppDispatch` typed hooks）/ Counter 完整示例
- [指南](./guide-line.md)：**核心**：State 设计原则（slice 拆分 / normalized state / colocate vs separate） / `configureStore` 完整选项（middleware getDefaultMiddleware / devTools / preloadedState / enhancers） / `createSlice` 详解（reducers / extraReducers / prepare callback / selectors / PayloadAction） / `createAsyncThunk` 完整模式（thunkAPI / rejectWithValue / condition / dispatch chain / .unwrap()） / **RTK Query**（createApi / fetchBaseQuery / endpoints / 自动生成 hooks / tag invalidation / polling / setupListeners） / `createListenerMiddleware` 完整模式（替代 redux-saga，全部 listenerApi 方法） / `createEntityAdapter` normalized CRUD / `createSelector` memoized selector / `redux-persist` 持久化 / TypeScript 完整类型（typed hooks / PayloadAction / createAsyncThunk 三泛型 / createApi 类型推导） / SSR + Next.js App Router / 测试（Jest / Vitest + mockStore） / 常见踩坑（直接 mutate state、reducer 副作用、Provider 嵌套、Hot Module Replacement）
- [参考](./reference.md)：**API 速查**：`configureStore` / `createSlice` / `createAction` / `createReducer` / `combineReducers` / `combineSlices` / `createAsyncThunk` / `createSelector` / `createDraftSafeSelector` / `createApi` / `fetchBaseQuery` / `createListenerMiddleware` / `createEntityAdapter` / React-Redux hooks（`useSelector` / `useDispatch` / `useStore` + `.withTypes`）/ `<Provider>` 完整 props / Middleware 完整列表 / 全 import 来源速查 / v1 / v4 → v2 迁移要点 / Redux 5.x 破坏性变化（`UnknownAction` 替代 `AnyAction` / `PreloadedState` 移除）
