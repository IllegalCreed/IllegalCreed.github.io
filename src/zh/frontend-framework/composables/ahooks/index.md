---
layout: doc
---

# Ahooks

**一套高质量、可靠的 React Hooks 库（A high-quality & reliable React Hooks library）**——由 **阿里巴巴**（GitHub 仓库 `alibaba/hooks`）出品并维护的 **React 专用** Hooks 集合，是 React 生态里**最主流的企业级 Hook 工具库之一**。**当前 v3.x（约 v3.9.x）**，**仅支持 React**（React 16.8 ~ 19，含 React 18 并发特性）、**100% TypeScript 编写**、**SSR 友好**。它的灵魂是那个**插件化架构的旗舰 `useRequest`**——一个把「**自动/手动触发、轮询、防抖、节流、屏幕聚焦重新请求、错误重试、loading 延迟、SWR 缓存、依赖刷新、乐观更新**」全部内建的「异步数据管理 Hook」，一行 `const { data, loading, error, run } = useRequest(service)` 就拿到一套完整的请求状态机；ahooks 的分页三件套（`usePagination` / `useAntdTable` / `useFusionTable`）与 `useInfiniteScroll` 也都建立在 `useRequest` 之上。**安装** `npm i ahooks`，**完全 Tree-shakeable**（旧版 Babel 可配 `babel-plugin-import` 进一步按需）。**全库约 70+ 个 hook，分八大类**：**useRequest**（异步请求，唯一插件化设计）/ **Scene**（场景：分页、无限滚动、虚拟列表、倒计时、WebSocket、网络状态…）/ **LifeCycle**（`useMount` / `useUnmount` / `useUnmountedRef`）/ **State**（`useSetState` / `useToggle` / `useLocalStorageState` / `useGetState`…）/ **Effect**（`useUpdateEffect` / `useDebounceFn` / `useLockFn`…）/ **Dom**（`useEventListener` / `useClickAway` / `useFullscreen`…）/ **Advanced**（`useMemoizedFn` / `useCreation` / `useReactive` / `useLatest`…）/ **Dev**（`useTrackedEffect` / `useWhyDidYouUpdate` 调试）。**几个被高频使用的"明星" hook**：`useMemoizedFn`（**引用永不变、却总调最新闭包的 `useCallback` 替代品**，根治 React 闭包陷阱）、`useRequest`（请求状态机）、`useReactive`（可变式响应状态，写法接近 Vue 的 `reactive`）、`useLatest`（永远拿到最新值的 ref）、`useControllableValue`（同时支持受控/非受控的组件状态）。**与 VueHooks Plus 的关系**：VueHooks Plus 正是「**Vue 版的 ahooks**」——两者的 `useRequest` API 心智、`[state, actions]` 元组风格几乎同构，只是分属 React / Vue 两个生态。**典型用户群**：**广大 React 项目**（尤其中后台/管理系统，配合 Ant Design 的 `useAntdTable` 极顺手）、**追求「开箱即用的请求/分页/表格状态管理」而不想自己造轮子**的团队。

## 评价

**优点**

- **旗舰 `useRequest` 极其强大且唯一插件化**：一个 hook 内建**自动/手动、轮询、防抖、节流、屏幕聚焦刷新、错误重试、loading 延迟、SWR 缓存、依赖刷新、乐观更新**——核心只管 `loading/data/error/params` 与 `run/runAsync/refresh/mutate/cancel`，进阶能力由 8 个插件实现，既保证 tree-shaking 又支持自定义插件
- **`useMemoizedFn` 根治 React 闭包陷阱**：返回一个**引用恒定、却总是调用最新闭包**的函数——可放心进任何依赖数组而不引发重渲染，是 `useCallback` 的更优替代，几乎是 ahooks 用户的"标配"
- **企业级场景 hook 开箱即用**：`usePagination`（分页）/ `useAntdTable`（Ant Design 表格联动）/ `useFusionTable` / `useInfiniteScroll`（无限滚动）/ `useVirtualList`（虚拟列表）/ `useCountDown`（倒计时）/ `useWebSocket`——中后台高频需求一个 hook 搞定
- **阿里出品、维护可靠**：`alibaba/hooks` 长期高频迭代、文档完善、社区活跃，被海量 React 项目与 Ant Design 生态采用
- **100% TypeScript**：源码全量 TS，所有 hook、选项、返回值类型完备，`useRequest` 能根据 service 自动推导 `data` / `run` 参数类型
- **完全 Tree-shakeable**：基于 ESM 按需打包；旧版 Babel 可配 `babel-plugin-import` 进一步精确按需
- **SSR 友好**：浏览器相关 hook（如 `useLocalStorageState`）提供 `getInitialValueInEffect` 等选项规避 hydration 不一致
- **`useReactive` 提供 Vue 式心智**：返回可变响应式代理对象，直接 `state.count++` 即触发更新——对来自 Vue 的开发者很友好
- **覆盖面广、约定一致**：70+ hook 覆盖 State / Effect / Dom / Scene / Advanced / Dev / LifeCycle，命名与返回风格统一，学会一个触类旁通

**缺点**

- **React 专用、不支持 Vue**：Vue 项目应改用 **VueHooks Plus**（ahooks 的 Vue 移植）或 VueUse
- **`useRequest` 选项繁多、有不少"反直觉"约束**：例如 `manual: true` 会**同时**让 `refreshDeps` / `refreshDepsAction` 失效、轮询不自动启动、`ready=false` 时 `run` 也不执行——是最容易踩的全局坑
- **`cancel` 名不副实**：它**只让 useRequest 忽略当前 promise 的响应**，**并不会真正取消底层请求**（`fetch` 仍会发出）——需要真正中止得自己接 `AbortController`
- **轮询不是固定间隔**：`pollingInterval` 是「**上一次请求完成后**再等间隔」，慢请求会拉长实际周期
- **缓存数据共享与 `cacheTime`/`staleTime` 的交互有坑**：设了 `cacheTime`/`staleTime` 会使同 `cacheKey` 的「数据实时共享」机制失效（仅新请求才触发共享）
- **与 VueUse 式"工具库"定位不同**：ahooks 更偏「业务/请求场景」，纯浏览器 API 工具的广度不及 VueUse（在 React 侧）
- **vs TanStack Query（React Query）**：在「**服务端状态管理**」这一专业领域，TanStack Query 的缓存失效策略、Devtools、生态更强——**大型、以数据为中心的应用**可能更适合它；ahooks 胜在「轻量 + 一库覆盖请求/分页/表格/工具」
- **`Hooks` 规则约束**：ahooks 终究是 React Hook，受「只能在组件/自定义 Hook 顶层、不能在条件/循环里调用」的 Hook 规则约束

## 文档地址

[ahooks 官网](https://ahooks.js.org/) | [中文文档](https://ahooks.js.org/zh-CN/) | [快速上手](https://ahooks.js.org/zh-CN/guide/) | [useRequest（旗舰）](https://ahooks.js.org/zh-CN/hooks/use-request/index) | [useMemoizedFn](https://ahooks.js.org/zh-CN/hooks/use-memoized-fn)

## GitHub 地址

[alibaba/hooks](https://github.com/alibaba/hooks)（主仓库，阿里巴巴出品，MIT 许可）| [@ahooksjs/use-url-state](https://github.com/alibaba/hooks/tree/master/packages/use-url-state)（`useUrlState` 独立包）

## 学习路径

- [入门](./getting-started.md)：`npm i ahooks` 安装 / ahooks 是什么（与 VueHooks Plus / react-use / SWR / TanStack Query 的区别） / 按需引入与 `babel-plugin-import` / 八大类总览 / 基本用法（`useRequest` 三件套 `data` / `loading` / `error` + `[state, actions]` 元组 + `useMemoizedFn` 闭包陷阱） / 第一个 ahooks 应用（`useRequest` + `useBoolean` + `useLocalStorageState` 综合示例） / SSR / TypeScript 泛型推导
- [指南](./guide-line.md)：**核心**：旗舰 `useRequest` 全选项深度（`manual` / `defaultParams` / `ready` / `refreshDeps` / `loadingDelay` / `pollingInterval` 轮询 / `debounceWait` / `throttleWait` / `refreshOnWindowFocus` / `cacheKey` + `staleTime` + `cacheTime` SWR / `clearCache` / `retryCount` / `mutate` / `run` vs `runAsync` vs `refresh` / `cancel` 的真实语义） / **Scene 场景类**（`usePagination` / `useAntdTable` / `useInfiniteScroll` / `useVirtualList` / `useCountDown` / `useWebSocket`） / **State 类**（`useSetState` / `useToggle` / `useLocalStorageState` / `useGetState` / `useResetState`） / **Effect 类**（`useUpdateEffect` / `useDebounceFn` / `useLockFn`） / **Dom 类**（`useEventListener` / `useClickAway` / `useFullscreen`） / **Advanced 明星**（`useMemoizedFn` / `useCreation` / `useReactive` / `useLatest` / `useControllableValue`） / **Dev 调试**（`useTrackedEffect` / `useWhyDidYouUpdate`） / **常见坑**（`manual` 的连锁失效、`cancel` 不真取消、轮询非固定间隔、缓存共享与 cacheTime 冲突）
