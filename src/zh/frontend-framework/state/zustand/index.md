---
layout: doc
---

# Zustand

React 生态最流行的「轻量级 hook-based」状态管理库，由 **Poimandres**（pmndrs 社区）出品——同一团队还维护 **Jotai**（atom 派状态）、**Valtio**（mutable proxy 派状态）、**React Three Fiber**（React 渲染 Three.js）、**React Spring**（动画）等一系列「让 React 生态更好用」的项目，灵魂人物是 **Daishi Kato**（同时也是 Zustand 主要作者 + Jotai 作者 + React 状态管理领域的核心研究者）。Zustand 单词源自德语「**状态**（Zustand）」、名字本身就是「状态」一词的另一种表达，与 React 形成「英德双语 useState」的小巧妙趣。**核心理念**：「**hook 即 store**」+「**简化版 Flux**」+「**没有 Provider**」+「**immutable + shallow merge**」——`create()` 返回的就是一个 React Hook，可以直接在任意组件中使用，**完全不需要在 App 根部包 Provider**（这是它与 Redux / Recoil / Jotai 最大的区别）。**bundle 极致轻量**：~1KB gzip（实际是 React 生态最小的状态库），同时正确处理了 React 状态管理中三个最棘手的问题：**zombie child problem**（被卸载组件读取过期 store）、**React 18 concurrency**（并发渲染下状态读取一致性）、**context loss**（多个 renderer 之间 context 丢失）。**最新 v5.x**（2024 年 10 月发布、最近版本 v5.0.13 / 2026-05 发布、目前事实标准）已**完全 ESM 优先**、要求 **React 18+** + **Node 18+**——v5 最大变化是把 `create(fn)` 的「无参数自动推导」改为 `create<T>()(fn)` 的「curried 显式标注」(详见 [入门](./getting-started.md))、把 `shallow` 等比较函数从默认值移出由 `useShallow` 显式提供。**核心特性矩阵**：~1KB gzip（极致轻量）/ 无 Provider（hook 即 store）/ `set` 自动 shallow merge / TypeScript 一等公民（`StateCreator` 完整类型推导）/ vanilla store 子包（`zustand/vanilla` 不依赖 React）/ Middleware 系统（**persist** localStorage 持久化、**devtools** Redux DevTools 集成、**immer** 嵌套 mutable 写法、**subscribeWithSelector** 选择性订阅、**combine** 自动推导、**redux** Redux 风格）/ SSR / Next.js App Router 完美兼容（store-per-request 模式）/ 与 React 18+ Concurrent Features 协同 / vanilla + React 双入口（`zustand/vanilla` / `zustand/react`）/ `useShallow` hook 防止不必要重渲（v5 新推荐）/ Subscribe API（外部订阅、用于非 React 上下文）。**典型用户群**：React 项目状态管理的**新主流**——已**事实替代 Redux Toolkit** 在中小型项目中的统治地位（npm 下载量 zustand > redux toolkit ≈ 2026 年）、被 Next.js / Remix / RTK / Excalidraw / Code Sandbox / Vercel 多个一线项目内部使用、`react-flow` / `tldraw` / `xstate-react` 等知名库内部状态管理基于 Zustand 实现。

## 评价

**优点**

- **极致轻量 ~1KB gzip**：React 生态最小的状态库，比 Redux Toolkit（~10KB）小一个数量级、与 Jotai 同档
- **API 极简**：`create((set) => ({ ...state, ...actions }))` 一行起，**无 Provider / reducer / dispatch / namespacing / module 概念**——心智模型极低，10 分钟上手
- **hook 即 store**：`useBearStore((s) => s.bears)` 直接拿值，**不需要包 Provider**（与 Redux / Recoil / Jotai 都不同）——这是 Zustand 最大的差异化卖点
- **TypeScript 一等公民**：`create<T>()(fn)` curried 写法 + `StateCreator<T, Mutators, Mws>` 完整类型推导、middleware 链类型自动累加（如 `[['zustand/devtools', never], ['zustand/persist', BearState]]`）
- **React 18 Concurrent Mode 安全**：内部用 `useSyncExternalStore` 处理 tearing / zombie child / context loss 三大坑——Daishi Kato 写过专题文章证明 Zustand 在 concurrent rendering 下行为最正确
- **Middleware 系统完善且可组合**：`persist`（localStorage / sessionStorage / IndexedDB / URL）+ `devtools`（Redux DevTools 时间旅行）+ `immer`（嵌套对象写法变 mutable）+ `subscribeWithSelector`（带选择器订阅）+ `combine`（自动类型推导）+ `redux`（reducer 风格）——middleware 链式组合 + 类型自动传递
- **vanilla store 独立子包**：`zustand/vanilla` 不依赖 React、可以在任何 JS 环境（Vue / Svelte / Node / Web Worker）使用——`createStore` 返回的对象有 `getState` / `setState` / `subscribe` / `getInitialState` 完整 API
- **`useShallow` hook**：v5 推荐方式——`useBearStore(useShallow((s) => ({ a: s.a, b: s.b })))` 用 shallow 比较避免对象 selector 触发不必要重渲
- **Subscribe API**：`useBearStore.subscribe(listener)` 可以在 React 外部订阅（用于 useEffect / 非 React 库 / debug）—— `subscribeWithSelector` middleware 还能用 selector 精准订阅
- **SSR / Next.js App Router 完美兼容**：vanilla store + `useState(() => createStore(...))` 的 store-per-request 模式被 Next.js 官方文档收录、避免请求间状态污染
- **Slice 模式扩展能力强**：大型应用拆 `createBearSlice` / `createFishSlice` 然后 `create((...a) => ({ ...createBearSlice(...a), ...createFishSlice(...a) }))` 合并——天然支持「单 store 多 slice」
- **生态丰富**：`zundo`（undo/redo）/ `zukeeper`（DevTools 增强）/ `auto-zustand-selectors-hook`（自动生成 selector）/ `zustood`（增强 API）/ React Query / SWR / Tanstack Query 都能很自然搭配

**缺点**

- **没有 Provider 的双刃剑**：默认 `create` 是 **module-scoped singleton**——多个 Next.js 请求会共享 store 状态（必须用 vanilla store + React Context 切换为 per-request 模式才能 SSR），单元测试也需要手动 reset（见 [Testing 章节](./guide-line.md#测试)）
- **选择器优化全靠手动**：与 Jotai / Recoil「atom 依赖图自动 fine-grained」不同——Zustand 默认 `useBearStore((s) => s.bears)` 必须显式写选择器，**对象 selector 必须用 `useShallow`** 否则每次重渲都触发（v4 老代码用 `shallow` 第二参数，v5 已移除、必须用 `useShallow`）
- **没有内置 DevTools**：必须显式包 `devtools()` middleware + 安装 Redux DevTools 扩展才能调试——不像 Pinia 自带 Vue DevTools 7 集成、不像 Jotai 有专用 Jotai DevTools
- **v5 breaking changes**：v4 的 `create((set) => ...)` 在 v5 中 TypeScript 用户**必须**改为 `create<T>()((set) => ...)` curried 写法（多一层括号）+ `shallow` 作为第二参数移除（改用 `useShallow`）—— v4 → v5 迁移有一定成本
- **小型项目易过度设计**：Zustand 虽轻、但「单 store + slice + middleware」三件套对 < 5 个状态字段的小项目仍然偏重——`useState` / `useReducer` / Context API 在小场景更轻
- **没有 atom 派的精细订阅**：与 Jotai 的「atom 是订阅原子单位」不同——Zustand 仍然是「单 store + selector」模型，组件订阅了 store 但只 read 一个字段时仍需正确写 selector 才能避免无关字段变化导致的重渲
- **Map / Set 必须新引用**：mutable 数据结构（`new Map()` / `new Set()`）必须创建新实例才能触发响应式 → `set((state) => ({ map: new Map(state.map).set(k, v) }))`，新手容易踩坑（见 [Map / Set 章节](./guide-line.md#map--set-的特殊处理)）
- **vs Pinia**：Vue 生态没法用 Zustand（Vue 用 Pinia / Vue 3 + 组件 state）；React 生态等价物是 **Jotai**（atom 派、更 fine-grained）/ **Valtio**（mutable proxy 派、心智更简单）/ **Redux Toolkit**（严格单向数据流 + RTK Query 数据层）—— Zustand 在「**极简 + Flux 风格 + 中等项目规模**」这个甜区独占
- **vs Redux Toolkit**：RTK 强调严格 reducer + RTK Query 一体化数据层；Zustand 强调极简心智 + 异步 action 自由写——RTK 适合大型企业应用（严格审计）、Zustand 适合 99% 的中小应用
- **vs Jotai**：Jotai 是同一团队（Poimandres + Daishi Kato）的「atom 派」副产物——Jotai atom 自动依赖追踪、更 fine-grained；Zustand 是「单 store + selector」、更直观——两者由同一团队维护、长期共存（Jotai 适合「派生 state 多 + 跨组件原子共享」、Zustand 适合「单一全局状态 + 直观调用」）

## 文档地址

[Zustand 官网](https://zustand.docs.pmnd.rs/) | [Introduction](https://zustand.docs.pmnd.rs/getting-started/introduction) | [Comparison](https://zustand.docs.pmnd.rs/getting-started/comparison) | [Guides](https://zustand.docs.pmnd.rs/guides/updating-state) | [API Reference](https://zustand.docs.pmnd.rs/apis/create) | [Middlewares](https://zustand.docs.pmnd.rs/middlewares/persist) | [Migrating to v5](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=zustand" target="_blank" rel="noopener noreferrer">Zustand 测试题</a>


## GitHub 地址

[pmndrs/zustand](https://github.com/pmndrs/zustand) | [Poimandres 组织](https://github.com/pmndrs) | [Daishi Kato](https://github.com/dai-shi)（主要作者，Jotai / Valtio 等同作者） | [zundo](https://github.com/charkour/zundo)（undo/redo 插件） | [auto-zustand-selectors-hook](https://github.com/Albert-Gao/auto-zustand-selectors-hook)（自动 selector）

## 学习路径

- [入门](./getting-started.md)：`pnpm add zustand` 安装 / `create<T>()((set) => ...)` 第一个 store（curried 写法）/ 组件中使用 `useBearStore((s) => s.bears)` / 选择器 selector 必须性 / `useShallow` 防多字段重渲 / TypeScript 基础（`StateCreator` 类型）/ Async actions / `set` shallow merge / `set(fn)` updater function / `replace` 覆盖
- [指南](./guide-line.md)：**核心**：State 设计原则（colocate actions / actions-outside / 单 store vs 多 store）/ 选择器深度优化（避免对象 selector、`useShallow` / `shallow` 区别、auto-generating selectors）/ Middleware 详解（`persist` 完整 API 含 partialize / version / migrate / skipHydration / `devtools` 含 actionsDenylist / `immer` / `subscribeWithSelector` 含 fireImmediately / `combine` / `redux`）/ 异步 actions / Slices 模式（拆分 + 合并 + 跨 slice 调用）/ vanilla store（`zustand/vanilla` + Web Worker / Node）/ SSR & Next.js App Router 集成（store-per-request + Provider 模式）/ Subscribe + getState API（React 外部读写）/ 测试（Jest / Vitest 自动 mock + 每次测试 reset）/ React 18 Concurrent Features 协同 / Map / Set 特殊处理 / `$reset` 模式 / 与 Pinia / Redux / Jotai 对比
- [参考](./reference.md)：**API 速查**：`create` / `createStore` / `useStore` / `useStoreWithEqualityFn` / `createWithEqualityFn` / `useShallow` / `shallow` / `subscribeWithSelector` / `persist` 全选项 / `devtools` 全选项 / `immer` / `combine` / `redux` middleware / Store API（`getState` / `setState` / `subscribe` / `getInitialState`）/ TypeScript 类型（`StateCreator` / `UseBoundStore` / `StoreApi` / `ExtractState` / `Mutator`）/ Import 来源速查 / v4 → v5 迁移要点
