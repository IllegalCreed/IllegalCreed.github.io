---
layout: doc
---

# Pinia

Vue.js 官方御用状态管理库，由 **Eduardo San Martin Morote**（Vue 核心团队成员、`vue-router` 作者）于 **2019 年 11 月** 创建。Pinia 最初是「**Composition API 重构 Vuex**」的实验项目（甚至比 Vue 3 正式版还早一年出现），原名 **Pinia**（西语「松果」，与 **piña** 谐音、对应「pina<u>p</u>p<u>l</u>e」字母倒数第二个被去掉的小彩蛋），后被 Vue 团队认定为「Vuex 的下一代继承者」并正式纳入官方生态。**Vuex 4 之后官方不再维护**，所有新项目必须使用 Pinia——这一点写在 Vuex 的 README 第一行。Pinia 与 Vuex 最大的本质区别：**移除 mutation 概念**（直接 mutate 或 `$patch`）/ **扁平化所有 store**（不再有「modules + namespacing」嵌套地狱）/ **完全基于 TypeScript 类型推导**（不再需要 Vuex 那一堆 `mapXxx` + 字符串路径 + 手写 typings）/ **TS 类型推导一等公民**（store 实例的 `state`/`getter`/`action` 自动推导，无需额外声明）/ **双语法支持**：既可以写 **Option Store**（Vuex/Vue Options API 风格、`{ state, getters, actions }`）也可以写 **Setup Store**（`<script setup>` 风格、`ref()` + `computed()` + `function`），两种 store 在同一项目中可以混用。**最新 v3.x**（2025-03 发布，要求 **Vue 3 + TypeScript 5+**，已正式停止支持 Vue 2 / Pinia v2 路线进入维护模式）整体保持稳定、是「boring major release」——v3 没有引入新特性、仅清理废弃 API + 升级到 Vue DevTools 7 协议。**核心特性矩阵**：~1.5KB gzip（极致轻量）/ Vue DevTools 时间旅行 + HMR 集成 / 跨 store 引用 / 插件系统（`pinia.use()`）/ SSR 一等公民（与 Nuxt 通过 `@pinia/nuxt` 无缝集成、零 XSS 配置）/ `@pinia/testing` 内置测试工具 / 自动模块化（每个 `defineStore('id', ...)` 即一个独立模块、无需注册 / namespacing）。**典型用户群**：所有 Vue 3 项目（Vue 官方推荐、几乎没有不用 Pinia 的）/ Nuxt 3+ / 大量企业级 Vue 应用 / `vee-validate` / `vueuse` 等生态项目内部状态管理也基于 Pinia 实现。

## 评价

**优点**

- **Vue 官方推荐 + Vuex 钦定继承者**：vue-router 同一团队（Eduardo）维护，与 Vue 3 / Composition API 紧密协同，社区方向唯一确定
- **API 极简**：相比 Vuex 的「state / getters / mutations / actions / modules / namespacing」六位一体，Pinia 只有「state / getters / actions」三件套——**mutation 完全消失**（合并入 actions 或直接 mutate）
- **双语法兼容**：**Option Store**（Vue Options API 用户零迁移成本）+ **Setup Store**（Composition API 用户自然过渡）共存，两种语法可同项目混用
- **TypeScript 完美推导**：`useStore()` 返回的 store 实例 `state` / `getters` / `actions` **自动推导类型**（不像 Vuex 4 还得手写 `InjectionKey`），错误在编辑器红线提示，无需额外类型声明
- **DevTools 一等公民**：Vue DevTools 7 内置 Pinia 标签页，可视化所有 store、时间旅行（state 回放）、`$patch` / `$reset` / action 历史
- **HMR 内置**：`acceptHMRUpdate()` 接入 Vite/Webpack，**编辑 store 后保留当前 state**（不再被强制刷新清空）
- **极致轻量**：~1.5KB gzip（Vuex ~3-4KB），不引入新概念到 bundle
- **完美 SSR**：与 Nuxt 通过 `@pinia/nuxt` 集成「**0 配置 SSR + 0 XSS 转义关注**」（Nuxt 自动 devalue 处理）
- **测试便捷**：`@pinia/testing` 提供 `createTestingPinia()` 一键拿到 mock store、`stubActions` 配置（默认 mock 所有 action）、`initialState` 注入测试初值
- **插件系统强大**：`pinia.use(plugin)` 一键扩展所有 store——`pinia-plugin-persistedstate`（localStorage 持久化）/ `pinia-plugin-debounce` / `pinia-orm`（ORM 增强）等社区生态丰富
- **每个 store 独立模块**：`defineStore('userId', ...)` + `useUserStore()` 自动 lazy 加载，**不需要 register、不需要 namespacing**（Vuex 的 `'auth/user/setName'` 全部消失）

**缺点**

- **Setup Store 的 SSR 复杂度**：Setup Store 比 Option Store 灵活但 SSR 序列化更复杂——`useLocalStorage` 等 client-only composable 必须配 `skipHydrate()` 避免 hydration mismatch
- **`$reset()` 在 Setup Store 中需手写**：Option Store 自动有 `$reset()`、Setup Store 必须自己 return 一个 `$reset` 函数（开发者经常忘）
- **无 mutation 的双刃剑**：直接 mutate state 简洁但**失去 mutation 的「单一变更入口」追溯优势**——大型项目建议所有变更都走 action 统一管理
- **store 间循环依赖**：A store 在 setup 顶层 read B store + B store 在 setup 顶层 read A store → 启动时无限循环；必须在 getter / action 内部按需读取（不是 setup 顶层）
- **`storeToRefs` 易遗忘**：直接 destructure store 会丢失响应式（`const { count } = useStore()` 是 plain value）——必须 `const { count } = storeToRefs(store)`；这是新手最大的坑
- **TS 严格模式陷阱**：`tsconfig.json` 需 `strict: true` 或 `noImplicitThis: true` 才能正确推导 getter 中的 `this`
- **`mapXxx` 性能 / 体验都不如 Composition API**：`mapStores` / `mapState` / `mapWritableState` / `mapActions` 主要为 Options API 兼容而保留，新项目应直接用 `useXxxStore()`
- **大型多人协作时 store 边界模糊**：扁平化 store 没有 namespacing 物理隔离 → 项目大时容易出现命名冲突（`useUserStore` / `useUsersStore`）+ 互引混乱
- **vs Vuex 5 dropped**：Vuex 5 原本设计了类似 Pinia 的 API（store 即 module）但官方直接 cancel + 推荐 Pinia → 历史包袱小、未来方向唯一
- **vs Zustand / Redux Toolkit**：Pinia 是「Vue 专属」、不跨框架；React 生态等价物是 Zustand（极简 hook-based）/ Jotai（atom-based）/ Redux Toolkit（包含 Redux + RTK Query 数据层）；Pinia 在 Vue 生态独占、跨框架不可迁移

## 文档地址

[Pinia 官网](https://pinia.vuejs.org/) | [Introduction](https://pinia.vuejs.org/introduction.html) | [Getting Started](https://pinia.vuejs.org/getting-started.html) | [Core Concepts](https://pinia.vuejs.org/core-concepts/) | [API Reference](https://pinia.vuejs.org/api/) | [Cookbook](https://pinia.vuejs.org/cookbook/) | [SSR + Nuxt](https://pinia.vuejs.org/ssr/) | [Cheat Sheet](https://pinia.vuejs.org/cheatsheet.html)

## GitHub 地址

[vuejs/pinia](https://github.com/vuejs/pinia) | [@pinia/nuxt](https://github.com/vuejs/pinia/tree/v3/packages/nuxt) | [@pinia/testing](https://github.com/vuejs/pinia/tree/v3/packages/testing) | [pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)（社区最流行持久化插件）

## 学习路径

- [入门](./getting-started.md)：`pnpm add pinia` 安装 / `createPinia()` + `app.use(pinia)` 注册 / 第一个 `defineStore` / Option Store vs Setup Store 对照 / state / getters / actions / 组件中使用 `useStore()` / `storeToRefs()` 解构 / DevTools 集成 / TypeScript 基础推导
- [指南](./guide-line.md)：**核心**：Option Store 完整 API（state / getters / actions 的 `this`）/ Setup Store 完整 API（ref / computed / function 对应关系）/ 异步 actions / 跨 store 引用（循环依赖陷阱）/ `$patch` 对象签名 + 函数签名 / `$reset`（Option vs Setup）/ `$subscribe` + `$onAction` 订阅 / `setActivePinia` 测试隔离 / 持久化（pinia-plugin-persistedstate）/ SSR + Nuxt 集成 / `skipHydrate()` / Plugin 系统（context / 自定义 options / TypeScript 类型扩展）/ Vue DevTools 集成 / HMR / 与 Composition API 协同 / Vuex → Pinia 迁移 / 常见踩坑
- [参考](./reference.md)：**API 速查**：`defineStore` (Option / Setup) / `createPinia` / `setActivePinia` / `getActivePinia` / `disposePinia` / Store 实例方法（`$id` / `$state` / `$patch` / `$reset` / `$subscribe` / `$onAction` / `$dispose`）/ `storeToRefs` / `mapStores` / `mapState` / `mapWritableState` / `mapActions` / `mapGetters` / `acceptHMRUpdate` / `skipHydrate` / `shouldHydrate` / `setMapStoreSuffix` / Plugin API（`PiniaPluginContext`）/ TypeScript 模块扩展（`PiniaCustomProperties` / `PiniaCustomStateProperties` / `DefineStoreOptionsBase`）
