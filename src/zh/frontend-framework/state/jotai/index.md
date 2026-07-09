---
layout: doc
---

# Jotai

React 生态最具代表性的「**原子化（atom-based）状态管理库**」，由 **Poimandres**（pmndrs 社区）出品——同一团队还维护 **Zustand**（store-based）、**Valtio**（mutable proxy）、**React Three Fiber**（R3F）、**React Spring** 等一系列「让 React 生态更好用」的项目，灵魂人物同样是 **Daishi Kato**（Zustand / Jotai / Valtio 三作者一体）。**Jotai** 在日语里就是「**状态**」（じょうたい）的意思——与 Zustand 的德语「状态」遥相呼应、Daishi Kato 起名时的双国双关。**核心理念**：「**bottom-up 原子化**」+「**atom 作为最小订阅单元**」+「**自动依赖追踪**」+「**Provider 可选**」——`atom()` 返回一个 atom 配置对象（不持有值），`useAtom`/`useAtomValue`/`useSetAtom` 在组件中订阅，**派生 atom 通过 `get` 自动追踪依赖**，无需手动声明 selector / memoize。**Jotai 是 Meta 已经 archive 的 Recoil 在社区中的事实继任者**——API 几乎一致（`atom` / `selector` 思想）、心智模型相同（bottom-up + atom graph）、但 Jotai 用 **atom 对象身份** 作为唯一标识（Recoil 用字符串 key、必须全局唯一）、且 v2 完全拥抱 React 18+ 一等公民 promise。**bundle 极致轻量**：核心 ~2-3KB gzip（实际是 React 状态库中与 Zustand 同档的最小），同时正确处理了 atom-based 模型最棘手的两个问题：**async atom 与 React 18 Suspense 集成**（v2 把 atom 视为 promise 容器、`useAtom` 透明 await）+ **store 隔离 SSR**（vanilla `createStore` + Provider 可注入）。**最新 v2.x**（2023 年发布、目前 v2.16+ / 2026 年事实标准）已**完全 ESM 优先**、要求 **React 18+**——v2 最大变化是引入 vanilla `createStore` 子包（`jotai/vanilla`）+ 改变 async atom 行为（getter 不再自动 await、必须显式 `await get(asyncAtom)`）+ 移除 `Provider` 的 `initialValues` / `scope` props（改用 `useHydrateAtoms` + Context）。**核心特性矩阵**：~2-3KB gzip（极致轻量）/ Provider 可选（默认 global store）/ atom 自动依赖追踪（无需 selector）/ TypeScript 一等公民（atom 类型自动推导）/ vanilla store 子包（`jotai/vanilla` 不依赖 React）/ 内置 Suspense + Promise 支持（v2 一等公民）/ 工具集（`atomWithStorage` / `atomWithReset` / `atomFamily` / `atomWithDefault` / `loadable` / `unwrap` / `splitAtom` / `selectAtom`）/ 集成生态（`jotai-tanstack-query` / `jotai-immer` / `jotai-xstate` / `jotai-redux` / `jotai-trpc` / `jotai-zustand`）/ DevTools（`jotai-devtools` 时间旅行 + atom graph）/ Babel / SWC 插件（自动 `debugLabel` + Fast Refresh）。**典型用户群**：替代 Recoil 的首选（Meta 把 Recoil archive 之后 Jotai 是大多数 Recoil 用户的迁移目标）/ Next.js App Router / Waku / Remix / React Native（与 R3F 同生态完美协同）/ 表单状态 / fine-grained UI 状态 / 大量派生 state 的中后台 / 与 TanStack Query 配合做服务端数据 + Jotai 做派生客户端状态。

## 评价

**优点**

- **bottom-up 原子化**：与「单 store + selector」截然不同的心智模型——每个 atom 是独立单元、组合成依赖图、订阅粒度极细——适合**派生 state 多 + 跨组件原子共享**的场景（如多面板表单 / 协作画布 / 复杂筛选）
- **自动依赖追踪**：派生 atom `atom((get) => get(a) + get(b))` 中 `get` 调用自动建立依赖——atom 变化时只有「依赖它的派生 atom + 订阅这些 atom 的组件」会重渲，**无需手动写 selector / memoize**——比 Zustand 的「手动 selector + useShallow」心智更低、比 Redux 的「createSelector / reselect」更优雅
- **Provider 可选**：默认全局 store（`getDefaultStore`），单组件应用一行 `useAtom` 即用；需要隔离时 `<Provider store={...}>` 包裹子树——同时满足「小型应用零配置」+「大型应用 / SSR 完美隔离」两个需求
- **TypeScript 一等公民**：`atom(0)` 自动推导 `PrimitiveAtom&lt;number&gt;`、派生 atom 推导返回类型、`useAtom` 元组类型自动反映——比 Zustand 的「必须 curried `create&lt;T&gt;()`」更直观、比 Redux Toolkit 的 `createSlice` 推导更简洁
- **Async atom + Suspense 一等公民**：v2 把 atom 视为「值或 Promise 的容器」、`useAtom(asyncAtom)` 自动 throw Promise 触发 Suspense + ErrorBoundary——配合 React 18 Concurrent Mode 实现「**声明式数据获取**」（无需 useEffect + isLoading 三件套），且自带 `AbortController` 取消能力
- **vanilla store 独立子包**：`createStore` from `jotai/vanilla` 不依赖 React—— Web Worker / Node / 测试 / 非 React 项目皆可用；store 实例可注入 React 上下文实现「**store-per-request**」（Next.js App Router SSR 必备）
- **极致轻量**：核心 ~2-3KB gzip（与 Zustand 同档、比 Redux Toolkit 小一个数量级、比 Recoil 小一半），utils / extensions 都是 tree-shakeable 子包按需引入
- **utils 工具集丰富**：`atomWithStorage`（localStorage / sessionStorage / AsyncStorage / 自定义、支持 storage event 跨 tab 同步）/ `atomWithReset` + `useResetAtom`（基础重置）/ `atomFamily`（参数化 atom，类似 Recoil atomFamily）/ `atomWithDefault`（默认值由 `get` 派生）/ `loadable`（async atom 包装为 `{ state, data, error }` 不走 Suspense）/ `unwrap`（async atom 同步化 + fallback）/ `selectAtom`（派生 + 自定义 equality）/ `splitAtom`（数组每元素一个 atom，性能优化必备）/ `atomWithReducer`（reducer 模式）/ `atomWithLazy`（延迟初始化）
- **集成生态完整**：[`jotai-tanstack-query`](https://github.com/jotaijs/jotai-tanstack-query)（atomWithQuery / atomWithMutation 把 TanStack Query 包装为 atom）/ [`jotai-immer`](https://github.com/jotaijs/jotai-immer)（嵌套 mutable 写法）/ [`jotai-xstate`](https://github.com/jotaijs/jotai-xstate)（状态机集成）/ [`jotai-redux`](https://github.com/jotaijs/jotai-redux)（与 Redux 互操作）/ [`jotai-trpc`](https://github.com/jotaijs/jotai-trpc)（tRPC 集成）/ [`jotai-zustand`](https://github.com/jotaijs/jotai-zustand)（atom 转 Zustand store）
- **DevTools + Babel/SWC 插件**：[`jotai-devtools`](https://github.com/jotaijs/jotai-devtools) 提供时间旅行 / atom 依赖图可视化；Babel / SWC 插件自动为每个 atom 注入 `debugLabel` + 修复 Fast Refresh（HMR 不再丢 atom 状态）
- **Recoil 替代之首选**：Meta 已**正式 archive** Recoil（2024 年）——Jotai 是社区认可的最佳迁移目标（API 思想几乎相同 + 活跃维护 + 同档轻量）

**缺点**

- **「atom 必须模块级声明」陷阱**：组件内 `atom(0)` 每次渲染都创建新对象 → `useAtom` 看到的是「不同 atom」→ 无限循环——必须用 `useMemo` 包或挪到模块顶层（这是 Jotai 最容易踩的新手坑，见 [指南 > atom 创建时机](./guide-line.md#atom-创建时机)）
- **派生 atom 性能不可控**：自动依赖追踪虽然方便、但**所有 read 的 atom 都成为依赖**——大型派生 atom 容易意外引入额外依赖；调试时需要 DevTools 才能看清 atom graph
- **Async atom 的 Suspense 行为不够灵活**：默认 throw Promise → 必须包 `<Suspense>` + `<ErrorBoundary>`；不想 Suspense 的场景必须用 `loadable` 包装、或用 `unwrap` 同步化——心智成本比「`isLoading` 字段」要高
- **没有内置「action」概念**：Jotai 推崇「**派生 atom + write-only atom**」组织业务逻辑——但缺乏 Redux/Zustand 那种「action 集中、易于审计」的天然组织方式；大型项目需要团队约定（如 `xxxActionAtom` 命名）
- **vs Zustand**：同团队、不同哲学——Zustand 是「单 store + 直观调用」、Jotai 是「atom 图 + 细粒度订阅」——简单场景 Zustand 更直接、复杂派生场景 Jotai 更优雅；两者可以**同项目混用**（如全局 user 用 Zustand、表单局部 state 用 Jotai）
- **vs Recoil**：Recoil 已 archive、不再推荐；Jotai API 思想几乎一致但**atom 用对象身份代替字符串 key**——迁移成本主要在改 `selector(...)` 为 `atom((get) => ...)` + 移除 key
- **vs Redux Toolkit**：RTK 强调严格 reducer + slice + RTK Query 一体化；Jotai 强调灵活组合 + atom 派生——RTK 适合金融 / 医疗等需严格审计的大型应用，Jotai 适合中大型派生 state 复杂的应用
- **vs Valtio**：同团队的「mutable proxy」派——Valtio 直接 mutate `state.x = ...` 触发响应式（最低心智模型），Jotai 是 immutable atom set——Valtio 适合简单 UI 状态、Jotai 适合需要依赖追踪的派生 state
- **atomFamily 在 v3 将被移除**：当前 v2 中 `atomFamily` 仍可用、但官方文档已标注 deprecated，未来需迁移到 [`jotai-family`](https://github.com/jotaijs/jotai-family) 包（API 兼容 + 增强）

## 文档地址

[Jotai 官网](https://jotai.org/) | [Introduction](https://jotai.org/docs/introduction) | [Concepts](https://jotai.org/docs/basics/concepts) | [Comparison](https://jotai.org/docs/basics/comparison) | [Core API: atom](https://jotai.org/docs/core/atom) | [Utilities](https://jotai.org/docs/utilities/storage) | [Guides](https://jotai.org/docs/guides/typescript) | [Extensions](https://jotai.org/docs/extensions/query) | [Migrating to v2](https://jotai.org/docs/guides/migrating-to-v2-api)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=jotai" target="_blank" rel="noopener noreferrer">Jotai 测试题</a>


## GitHub 地址

[pmndrs/jotai](https://github.com/pmndrs/jotai) | [Poimandres 组织](https://github.com/pmndrs) | [Daishi Kato](https://github.com/dai-shi)（主要作者，Zustand / Valtio 等同作者） | [jotaijs](https://github.com/jotaijs)（Jotai 扩展生态组织） | [jotai-devtools](https://github.com/jotaijs/jotai-devtools) | [jotai-tanstack-query](https://github.com/jotaijs/jotai-tanstack-query) | [jotai-immer](https://github.com/jotaijs/jotai-immer)

## 学习路径

- [入门](./getting-started.md)：`pnpm add jotai` 安装 / 第一个 `atom` / `useAtom` / `useAtomValue` / `useSetAtom` 三件套 / 派生 atom（read-only / write-only / read-write）/ async atom + Suspense / Provider 可选场景 / TypeScript 基础（自动推导 + `PrimitiveAtom` / `Atom` / `WritableAtom`）/ atom 创建时机（必须模块级 / `useMemo`）
- [指南](./guide-line.md)：**核心**：atom Primitives 全谱（primitive / derived / async / write-only / read-write）/ `useAtom` / `useAtomValue` / `useSetAtom` 选用决策 / Provider 与多 store 隔离 / `createStore` + `getDefaultStore` 双 API / async atom + Suspense + ErrorBoundary + AbortController / utils（`atomWithStorage` / `atomWithReset` / `atomFamily` / `atomWithDefault` / `loadable` / `unwrap` / `splitAtom` / `selectAtom` / `atomWithReducer` / `atomWithLazy`）/ `useHydrateAtoms` SSR 注水 / `useAtomCallback` 命令式访问 / DevTools + Babel/SWC 插件 / 集成（TanStack Query / Immer / XState）/ Next.js App Router / 测试策略 / 与 Zustand 对比 / 常见踩坑（atom 在 render 中创建、async atom 重复请求、循环依赖）
- [参考](./reference.md)：**API 速查**：`atom` 全签名 / `useAtom` / `useAtomValue` / `useSetAtom` / `useStore` / `Provider` / `createStore` / `getDefaultStore` / `atomWithStorage` / `atomWithReset` + `RESET` + `useResetAtom` / `atomFamily` / `atomWithDefault` / `loadable` / `unwrap` / `selectAtom` / `splitAtom` / `atomWithReducer` / `atomWithLazy` / `atomWithObservable` / `useHydrateAtoms` / `useAtomCallback` / TypeScript 类型（`Atom` / `PrimitiveAtom` / `WritableAtom` / `Getter` / `Setter` / `ExtractAtomValue`）/ Import 来源速查 / v1 → v2 迁移要点
