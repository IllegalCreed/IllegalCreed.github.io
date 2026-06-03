---
layout: doc
---

# VueHooks Plus

**高性能 & 简约的 Vue 3 Hooks 库（High-performance & Simplicity Vue 3 Hooks Library）**——由开源团队 **InhiblabCore** 维护的 **Vue 3 组合式函数库**，定位是「**Vue 版的 ahooks**」：把 **React 生态里 `ahooks` 那套「以 `useRequest` 为核心、覆盖业务高频场景的企业级 Hook 集合」原样搬到 Vue 3**。与「浏览器 API 工具集」定位的 VueUse 不同，VueHooks Plus 的灵魂是那个**插件化架构的旗舰 `useRequest`**——一个把「**自动/手动触发、轮询、防抖、节流、窗口聚焦重新请求、错误重试、loading 延迟、SWR 缓存、依赖刷新、并行请求、分页加载、自定义中间件**」全部内建的「**请求中间层**」，一行 `const { data, loading, error, run } = useRequest(service)` 就拿到一套完整的异步请求状态机。**npm 包名 `vue-hooks-plus`**（**当前 v2.4.3**），**要求 Vue 3.2.25+**（**Vue 3 专用，不支持 Vue 2**），**100% TypeScript 编写**、**完全 Tree-shakeable**（支持 `import useRequest from 'vue-hooks-plus/es/useRequest'` 单函数按需引入）、**SSR 友好**。**全库约 50+ 个 hook**，按官方文档分为 **State（状态）/ Effect（副作用）/ DOM / Scene（场景）/ Advanced（高级·开发调试）** 几大类，覆盖 `useBoolean` / `useToggle` / `useCounter` / `useSetState` / `useLocalStorageState` / `useUrlState` / `useDebounceFn` / `useThrottleFn` / `useInterval` / `useTimeout` / `useEventListener` / `useMouse` / `useFullscreen` / `useVirtualList` / `useInfiniteScroll` / `useWebSocket` / `useDrag` / `useDrop` 等高频组合式函数。**自动导入**：配合 `unplugin-auto-import` + 官方 `@vue-hooks-plus/resolvers` 的 `VueHooksPlusResolver()`，可在 Vite / Webpack 项目里免写 `import` 直接调用。**周边生态**：提供 **VS Code 扩展 `vscode-vue-hooks-plus`**（编辑器内浏览文档）、**在线 Playground**、以及 **Nuxt 3 示例**。**与 VueUse 的关系**：两者**互补而非替代**——VueUse 偏「**通用浏览器 API + 响应式工具**」（鼠标、剪贴板、媒体查询、暗色模式……200+ 函数，广度取胜），VueHooks Plus 偏「**以请求为核心的业务 Hook**」（`useRequest` 的轮询/缓存/重试/SWR 是它的杀手锏，深度取胜）；偏好 ahooks 风格、重度依赖数据请求管理的 Vue 团队会更青睐 VueHooks Plus，很多项目甚至两者同装。**典型用户群**：**从 React + ahooks 迁移到 Vue 的团队**（API 心智几乎一致，迁移成本极低）、**需要开箱即用的请求状态管理（轮询/缓存/重试）却不想引入 TanStack Query 那么重的方案**的 Vue 3 项目。

## 评价

**优点**

- **旗舰 `useRequest` 极其强大**：一个 hook 内建**自动/手动触发、轮询（`pollingInterval`）、防抖（`debounceWait`）、节流（`throttleWait`）、窗口聚焦重新请求（`refreshOnWindowFocus`）、错误重试（`retryCount`）、loading 延迟（`loadingDelay`）、SWR 缓存（`cacheKey` + `staleTime`）、依赖刷新（`refreshDeps`）、就绪控制（`ready`）、并行请求（`concurrent`）、乐观更新（`mutate`）、自定义中间件（`use`）**——这些在裸 `fetch` / `axios` 里要写几十行的逻辑，全部变成配置项
- **ahooks 心智无缝迁移**：API 命名、`useRequest` 的 Options / Result 结构、`useBoolean` / `useToggle` / `useCounter` 的 `[state, actions]` 元组返回风格**几乎与 React 的 ahooks 一致**——React 团队转 Vue 几乎零学习成本
- **完全 Tree-shakeable + 单函数按需引入**：除整包 `import { useRequest } from 'vue-hooks-plus'` 外，还支持 `import useRequest from 'vue-hooks-plus/es/useRequest'` **只打包单个 hook**——对体积敏感的项目友好
- **100% TypeScript**：源码全量 TS 编写，`useRequest` 的泛型会**根据 service 的返回类型自动推导 `data` 的类型**、根据参数推导 `run` 的入参类型，无需额外 `@types/*`
- **SSR 友好**：在 Nuxt / Vite SSR 环境下不会因访问 `window` / `document` 崩溃，官方提供 Nuxt 3 示例工程
- **副作用自动清理**：`useEventListener` / `useInterval` / `useTimeout` / 各类 Observer hook **随组件 unmount 自动清理**——消除「忘记清理导致内存泄漏」这一最常见的 Vue 副作用 Bug
- **自动导入零样板**：官方 `@vue-hooks-plus/resolvers` 配合 `unplugin-auto-import`，`.vue` 里直接写 `useRequest()` 而不写 import
- **插件化架构**：`useRequest` 的轮询、缓存、重试等能力都是**独立插件**组合而成——既保证按需 tree-shaking，也支持通过 `use` 注入自定义中间件扩展
- **文档含可交互 Demo + Playground + VS Code 扩展**：每个 hook 都有在线示例，还能在编辑器内直接查文档

**缺点**

- **生态规模 / 社区体量远小于 VueUse**：Star 数、周下载量、第三方文章数都明显少于 VueUse——遇到边缘问题时可参考的资料更少
- **Vue 3 专用、不支持 Vue 2**：要求 **Vue 3.2.25+**，Vue 2 老项目无法使用
- **核心价值高度集中在 `useRequest`**：除请求管理外的工具型 hook（`useMouse` / `useFullscreen` / 媒体查询等）VueUse 覆盖得更全更成熟——**只为这些通用工具而装 VueHooks Plus 性价比不如直接用 VueUse**
- **与 VueUse 功能重叠**：`useToggle` / `useCounter` / `useLocalStorageState` / `useEventListener` 等在 VueUse 里都有对应实现，同时装两个库会有重复——需想清楚「以谁为主」
- **`useRequest` 选项繁多、易过度配置**：轮询 + 缓存 + 重试 + 防抖 + 节流叠加时，**各选项的优先级与相互作用需吃透文档**，否则容易出现「以为开了缓存其实被防抖吞掉」之类的困惑
- **vs TanStack Query**：在「**服务端状态管理**」这一专业领域，TanStack Query（含 Vue 适配）的缓存失效策略、Devtools、生态成熟度更强——**大型、以数据为中心的应用**可能更适合 TanStack Query；VueHooks Plus 胜在「轻量 + 开箱即用 + ahooks 风格」
- **命名 `Hooks` 而非 `Composables`**：沿用 React「Hooks」叫法（而非 Vue 社区习惯的「Composables / 组合式函数」），对纯 Vue 背景的新人略有概念混淆

## 文档地址

[VueHooks Plus 官网](https://inhiblabcore.github.io/docs/hooks/) | [English 文档](https://inhiblabcore.github.io/docs/hooks/en/) | [Guide 指南](https://inhiblabcore.github.io/docs/hooks/guide/) | [useRequest（旗舰）](https://inhiblabcore.github.io/docs/hooks/useRequest/) | [Playground 在线演示](https://inhiblabcore.github.io/vue-hooks-plus/) | [npm: vue-hooks-plus](https://www.npmjs.com/package/vue-hooks-plus)

## GitHub 地址

[InhiblabCore/vue-hooks-plus](https://github.com/InhiblabCore/vue-hooks-plus)（主仓库，MIT 许可）| [vscode-vue-hooks-plus](https://github.com/InhiblabCore/vscode-vue-hooks-plus)（VS Code 文档扩展）| [@vue-hooks-plus/resolvers](https://github.com/InhiblabCore/vue-hooks-plus)（自动导入解析器，配合 `unplugin-auto-import`）

## 学习路径

- [入门](./getting-started.md)：`pnpm add vue-hooks-plus` 安装 / VueHooks Plus 是什么（与 ahooks / VueUse / TanStack Query 的区别） / 整包导入 vs 单函数按需引入（`vue-hooks-plus/es/useRequest`） / 自动导入（`unplugin-auto-import` + `@vue-hooks-plus/resolvers`） / 基本用法（`useRequest` 三件套 `data` / `loading` / `error` + `[state, actions]` 元组约定 + 副作用自动清理） / 第一个 VueHooks Plus 应用（`useRequest` + `useBoolean` + `useLocalStorageState` 综合 `.vue` 示例） / SSR / TypeScript 泛型推导
- [指南](./guide-line.md)：**核心**：旗舰 `useRequest` 全选项深度（自动/手动 `manual`、`defaultParams`、`ready` 就绪、`refreshDeps` 依赖刷新、`loadingDelay` 延迟 loading、`pollingInterval` 轮询、`debounceWait` / `throttleWait` 防抖节流、`refreshOnWindowFocus` 聚焦刷新、`cacheKey` + `staleTime` SWR 缓存、`retryCount` 错误重试、`mutate` 乐观更新、`run` / `runAsync` / `refresh` / `cancel` 区别、`use` 中间件） / **State 类**（`useBoolean` / `useToggle` / `useCounter` / `useSetState` / `useLocalStorageState` / `useUrlState`） / **Effect 类**（`useDebounceFn` / `useThrottleFn` / `useInterval` / `useTimeout` / `useLockFn` / `useUpdate`） / **DOM 类**（`useEventListener` / `useMouse` / `useFullscreen` / `useHover` / `useInViewport` / `useScroll`） / **Scene 类**（`useVirtualList` 虚拟列表 / `useInfiniteScroll` 无限滚动 / `useWebSocket` / `useDrag` + `useDrop`） / **Advanced 类**（`useTrackedEffect` / `useWhyDidYouUpdate` 调试） / **常见踩坑**（轮询与防抖叠加、SSR hydration、与 VueUse 同装取舍）
