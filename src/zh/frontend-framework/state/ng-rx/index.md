---
layout: doc
---

# NgRx

**Angular 生态最主流的 Redux 模式状态管理库 + 官方推荐 + 内置 Signals 新范式**——准确地说，NgRx 是 **2016 年由 Rob Wormald**（前 Angular 团队成员）以 `@ngrx/store` 之名发布、灵感**直接来自 Redux for React** 的 Angular 状态管理平台。NgRx 的名字来源于「**Ng**（Angular 缩写）+ **Rx**（[RxJS](https://rxjs.dev/) 响应式扩展）」的复合——名字本身就标记了它「**Angular 端的 Redux + RxJS 一等公民**」的定位。与 **Redux Toolkit**（React 端 Redux）/ **MobX**（响应式派）/ **Pinia**（Vue 端）形成对照：**NgRx 是「Angular 端的 Redux 官方门面」**——所有 Redux 核心理念（单一 store / immutable state / pure reducer / action 描述 + dispatch / 中间件 / time-travel）在 NgRx 都有对应映射，但**配合 Angular DI + RxJS Observable**——store 注入到组件 / service、selector 返回 Observable、effect 是 RxJS 流。**核心理念**：「**state is a single immutable data structure + actions describe state changes + pure functions called reducers take previous state and action to compute new state + state accessed with the Store, an observable of state and an observer of actions**」——四条核心原则。**最重要的事**：**现代 NgRx 必须用 Standalone API（`provideStore` / `provideEffects` / `provideStoreDevtools`）**——`StoreModule.forRoot` / `EffectsModule.forRoot` 这套 NgModule 老 API 仍可用、但 Angular 17+ 起官方推荐 standalone API + `bootstrapApplication`；另外 **NgRx 17+ 引入 `@ngrx/signals`**——基于 Angular Signals 的全新 store API（`signalStore` / `withState` / `withMethods` / `withComputed` / `withHooks`），与传统 Global Store 并行存在、**两条路线官方都推荐**：复杂全局状态 + 跨 feature 异步 + 严格审计场景用 **Global Store + Effects**、组件级 / feature 级反应式状态用 **SignalStore**。**最新 v19.x**（NgRx v19 / 2024-12 起 + 配合 Angular 19 / 20）作为协调发布的版本群已经**完全 standalone**、**完全 TypeScript 重写**、引入 `createFeature` 大幅简化 boilerplate（一行替代「actions + reducer + selectors 文件三件套」）、引入 `mapResponse` / `tapResponse` 等 `@ngrx/operators`、SignalStore 全面成熟（`withEntities` / `rxMethod` / `withProps` / `signalStoreFeature`）——这是当前事实标准。**核心模块矩阵**：

| 模块 | 用途 | 推荐度 |
|---|---|---|
| `@ngrx/store` | Redux store 核心（actions / reducers / selectors） | 必备 |
| `@ngrx/effects` | 副作用管理（类似 redux-thunk + saga 合体，基于 RxJS） | 异步必备 |
| `@ngrx/store-devtools` | Redux DevTools 浏览器扩展集成 | 强烈推荐 |
| `@ngrx/entity` | normalized state CRUD（类似 RTK EntityAdapter） | 大型列表必备 |
| `@ngrx/router-store` | Router state 同步到 store | 路由驱动 state 必备 |
| `@ngrx/component-store` | 组件级 / feature 级 store（pre-signals 时代方案） | 老项目维护 |
| **`@ngrx/signals`** | 基于 Angular Signals 的新一代 store（NgRx 17+） | **新项目首选** |
| `@ngrx/operators` | NgRx 专用 RxJS operators（`mapResponse` / `tapResponse` / `concatLatestFrom`） | 推荐 |
| `@ngrx/schematics` | Angular CLI 代码生成（`ng generate store` / `ng generate effect`） | 可选 |
| `@ngrx/eslint-plugin` | NgRx 专用 ESLint 规则 | 推荐 |

**典型用户群**：**Angular 企业级应用事实标准**——大量银行 / 保险 / 政府 / 医疗 / 物流 / 电信领域的 Angular 项目（这些行业是 Angular 的主战场）、**Cisco** / **Nrwl/Nx**（NgRx 长期布道者 + Nx 内置 NgRx generators）/ **Capital One** / **John Deere** / **Lufthansa** / **VMware** / **Vodafone** / 大量 **Microsoft** 内部 Angular 项目 / **Sanofi** / **Allianz**，以及 Angular 官方 [Material 文档](https://material.angular.dev/) 中推荐用于复杂 state 的方案——在 Angular 端**几乎没有可与之相提并论的成熟竞品**（Akita 已 deprecated、NGXS 用户量较小、Elf 较新）。

## 评价

**优点**

- **Angular 官方推荐的事实标准**：[Angular 官方文档](https://angular.dev/) 在状态管理章节明确推荐 NgRx、Angular Team 与 NgRx Team 紧密协作、**Angular CLI Schematics 一键集成**（`ng add @ngrx/store`）、与 Angular DI / RxJS / Router 深度集成——**Angular 生态选 NgRx 几乎没有更主流的替代**
- **Redux 心智模型完整搬运**：action / reducer / selector / dispatch / middleware / time-travel 全套 Redux 概念在 NgRx 中都有对应、**Redux for React 用户切换到 Angular 项目几乎零成本**——`createSlice` ≈ `createFeature` / `createAsyncThunk` ≈ `createEffect` / `useSelector` ≈ `Store.select` / `useDispatch` ≈ `Store.dispatch`
- **`createFeature` 大幅简化 boilerplate**：NgRx 16+ 引入的 `createFeature` 一次定义「**name + reducer + 自动生成 feature selectors**」——一个文件替代「`actions.ts` + `reducer.ts` + `selectors.ts` + `feature.ts` 四件套」、自动生成 `selectXxx` selector、`extraSelectors` 加派生——**比纯 Redux Toolkit 还简洁**
- **RxJS 一等公民**：Selector 返回 `Observable<T>`、Effect 是 RxJS 流（`Actions` 即 `Observable<Action>`）、可以使用所有 RxJS operators（`switchMap` / `mergeMap` / `concatMap` / `exhaustMap` / `debounceTime` / `distinctUntilChanged` / `combineLatest` 等）——**复杂异步编排能力远超 redux-thunk / saga**
- **`@ngrx/effects` 副作用模型成熟**：把 redux-thunk + redux-saga + redux-observable 的能力合三为一——`createEffect` + `ofType` + flattening operator 处理异步、`{ dispatch: false }` 处理 fire-and-forget 副作用、Functional Effects（`{ functional: true }`）支持 standalone API——**比 React 端任何单一中间件方案都完整**
- **`@ngrx/signals` 新一代基于 Signals**：NgRx 17+ 引入的 `signalStore` API 完全基于 Angular Signals、**零 RxJS 学习成本**、`withState` / `withMethods` / `withComputed` / `withHooks` / `withEntities` / `withProps` 声明式组合、`signalStoreFeature` 自定义功能复用、`rxMethod` 桥接 RxJS——**为 Angular Signals 时代设计的新范式**
- **`@ngrx/entity` normalized state**：`createEntityAdapter` 一行实现 normalized state（`ids` + `entities` 字典）+ 预生成 CRUD（`addOne` / `setMany` / `updateOne` / `upsertMany` / `removeOne`）+ memoized selectors（`selectAll` / `selectIds` / `selectEntities` / `selectTotal`）——大型列表 / 复杂关联数据的最佳实践
- **`@ngrx/router-store` 路由 state 同步**：URL / params / queryParams / data 自动同步到 store、可被 selector / effect 订阅、路由变化触发 action（`ROUTER_NAVIGATION` / `ROUTER_NAVIGATED`）——**Angular Router 与 store 一体化**
- **Redux DevTools 完整集成**：`provideStoreDevtools` 一行启用浏览器扩展、time-travel / state diff / action replay / dispatch from devtools 等所有 Redux DevTools 能力——**调试体验顶级**
- **TypeScript 一等公民**：`createAction` 自动推导 payload 类型、`createFeature` 自动生成强类型 selectors、`createSelector` 类型链式推导、`signalStore` 类型推导精度极高——大型企业项目 TS 体验顶级
- **企业审计场景的首选**：所有 state 变化都是 dispatched action、所有 action 都可记录到 log / Sentry / 后端、所有 state snapshot 可序列化——金融 / 医疗 / 政府 / 保险的合规审计场景几乎只能用 NgRx
- **Angular Standalone API 支持**：`provideStore({ counter: counterReducer })` / `provideEffects([UsersEffects])` / `provideStoreDevtools(...)` 完全适配 Angular 17+ 的 standalone bootstrap、不依赖 `NgModule`
- **Nx 集成无缝**：[Nx](https://nx.dev/)（NgRx Team 公司 [Nrwl](https://nrwl.io/) 开发）提供 NgRx generators / lib 拆分模板 / dataflow visualization——**Angular monorepo 项目首选组合**

**缺点**

- **学习曲线陡**：action / reducer / selector / effect / entity / RxJS operators / standalone API / signalStore 概念**十多个**——新手通常需要 **2-3 周**才能熟练、远比 Pinia（10 分钟）/ Zustand（10 分钟）的学习成本高
- **样板代码偏多**：虽然 `createFeature` 已经简化、但相比 SignalStore 的 `signalStore(withState({...}), withMethods(...))` 一行起、传统 Global Store 仍需要 actions 文件 + reducer 文件 + selectors 文件 + effects 文件 + module / provide 注册——**对小型 Angular 项目仍偏重**
- **RxJS 必须熟练**：Effect 完全基于 RxJS、不会 `switchMap` / `mergeMap` / `exhaustMap` / `catchError` 等 operator 几乎写不了 effect——**对不熟 RxJS 的开发者门槛极高**（虽然 Angular 本身就依赖 RxJS、但 NgRx 把 RxJS 用得更深）
- **Bundle 体积**：`@ngrx/store` + `@ngrx/effects` + `@ngrx/entity` + `@ngrx/store-devtools` 总计约 **30-40KB gzip**——比 SignalStore（~5KB）大、比 Pinia / Zustand 大很多
- **过度设计风险**：传统 NgRx 文化里有「**所有 state 都进 store**」的执念——但**表单 state / UI 临时 state / fetched data** 都进 NgRx 通常是过度工程化、**Angular signal-based 本地 state / SignalStore / HttpClient + DI service** 才是合适方案
- **Effect 风格争议**：传统 class-based effect（`@Injectable() class XxxEffects` + 字段属性写 effect）vs 新 functional effect（`createEffect(() => ..., { functional: true })`）两种风格并存——团队需要约定
- **`createSelector` memoize 单参数限制**：默认 memoize 缓存大小为 1、参数变化即失效——`createSelectorFactory` + `defaultMemoize` 自定义可解决但 API 复杂
- **vs `@ngrx/signals`**：SignalStore 心智更轻、API 更简、不依赖 RxJS、bundle 更小——**中小型 Angular 项目 / 组件级状态用 SignalStore、大型企业 / 严格审计 / 跨 feature 异步用 Global Store**——两条路线官方都推荐、需要团队选型
- **vs ComponentStore（已被 SignalStore 取代）**：`@ngrx/component-store` 是 NgRx 16 之前的「组件级 store」方案、心智模型偏 RxJS（`updater` / `effect` / `select`）——**新项目不推荐、用 SignalStore 替代**
- **vs Akita（已 deprecated）/ NGXS / Elf**：[Akita](https://github.com/datorama/akita) 已停止维护、[NGXS](https://www.ngxs.io/) 用户量较小（约 NgRx 1/10）、[Elf](https://ngneat.github.io/elf/) 较新且生态小——**Angular 端 NgRx 几乎是唯一成熟选项**
- **DevTools 性能**：开发模式 DevTools 序列化每次 action 的 state diff、大型 state（万级数组 / 复杂嵌套）会导致 DevTools 卡顿——需要 `actionsBlocklist` / `predicate` 等优化
- **新人接手项目门槛**：完整的 NgRx 项目通常涉及 actions / reducers / selectors / effects / entity / router-store / 多 feature 拆分——**需要架构师级的整体规划**、不像 Pinia / Zustand 那样「随手加 store」

## 文档地址

[NgRx 官网](https://ngrx.io/) | [Learn Global Store](https://ngrx.io/guide/store/walkthrough) | [Learn SignalStore](https://ngrx.io/guide/signals/signal-store) | [Store 完整指南](https://ngrx.io/guide/store) | [Effects 完整指南](https://ngrx.io/guide/effects) | [Signals 完整指南](https://ngrx.io/guide/signals) | [Entity 完整指南](https://ngrx.io/guide/entity) | [Router Store](https://ngrx.io/guide/router-store) | [Component Store](https://ngrx.io/guide/component-store) | [Operators](https://ngrx.io/guide/operators) | [Store DevTools](https://ngrx.io/guide/store-devtools) | [Schematics](https://ngrx.io/guide/schematics) | [API Reference](https://ngrx.io/api) | [v18 → v19 迁移](https://ngrx.io/guide/migration/v19)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ngrx" target="_blank" rel="noopener noreferrer">NgRx 测试题</a>


## GitHub 地址

[ngrx/platform](https://github.com/ngrx/platform)（monorepo：store + effects + entity + signals + router-store + component-store + operators + store-devtools + schematics + eslint-plugin） | [Rob Wormald](https://github.com/robwormald)（NgRx 联合创始人、前 Angular 团队）| [Brandon Roberts](https://github.com/brandonroberts)（NgRx 当前主维护者）| [Tim Deschryver](https://github.com/timdeschryver)（NgRx 核心维护者 + Signals 设计者）| [Marko Stanimirović](https://github.com/markostanimirovic)（NgRx Signals 主设计者）| [Mike Ryan](https://github.com/MikeRyanDev)（NgRx 联合创始人）

## 学习路径

- [入门](./getting-started.md)：`ng add @ngrx/store @ngrx/effects @ngrx/store-devtools` 安装（Schematics 自动配 standalone API + provideStore + Redux DevTools）/ 第一个 store（`createAction` + `createReducer` + `on()`） / `provideStore` + `provideEffects` + `provideStoreDevtools` 在 `app.config.ts` 注册 / `createFeature` 一行替代「actions + reducer + selectors 三件套」 / `createSelector` 派生 state / 在组件中（`inject(Store)` + `store.select()` + `store.dispatch()`）/ Counter 完整示例 / Redux DevTools 浏览器扩展 / TypeScript 基础（action payload 类型 / `createFeature` 自动 typed selectors）
- [指南](./guide-line.md)：**核心**——Actions 完整规范（`createAction` + `props` + `createActionGroup` + action 命名 `[Source] Event Description` 约定）/ Reducers 完整模式（`createReducer` + `on()` + 不变性 / Immer 风格 / `combineReducers`）/ Selectors 完整模式（`createSelector` + `createFeatureSelector` + `createFeature.extraSelectors` + memoize + 参数化 selector） / `createFeature` 详解（自动生成 selectors + extraSelectors） / **Effects 完整**（`createEffect` + `ofType` + class-based vs functional effects + `{ dispatch: false }` 非 dispatch effect + RxJS flattening operators 选择 + 错误处理 `catchError` + 重试 + `concatLatestFrom`） / `@ngrx/entity` 完整（`createEntityAdapter` + `EntityState` + 全 CRUD 方法 + selectors） / `@ngrx/router-store` 路由 state 同步 / **`@ngrx/signals` 新一代**（`signalStore` + `withState` + `withMethods` + `withComputed` + `withHooks` + `withEntities` + `withProps` + `signalStoreFeature` 自定义功能 + `rxMethod` 桥接 RxJS + `patchState` + `signalState`） / `@ngrx/operators`（`mapResponse` / `tapResponse` / `concatLatestFrom`） / Standalone API 注册完整 / RxJS 集成 / TypeScript 完整 / SSR + Angular Universal / 测试（Jest + `MockStore`） / 常见踩坑（reducer 副作用、忘了 `EffectsModule.forRoot([])`、Effect 中漏 catchError 导致流终止）
- [参考](./reference.md)：**API 速查**——`createAction` / `createActionGroup` / `props` / `createReducer` / `on` / `combineReducers` / `createFeature` / `createSelector` / `createFeatureSelector` / `createSelectorFactory` / `createEffect` / `ofType` / `Actions` / `Store.select` / `Store.dispatch` / `Store.pipe` / `createEntityAdapter` / `EntityState` / `EntityAdapter` 全方法 / `getSelectors` / `provideStore` / `provideEffects` / `provideStoreDevtools` / `provideState` / `provideRouterStore` / `signalStore` / `withState` / `withMethods` / `withComputed` / `withHooks` / `withProps` / `withEntities` / `signalStoreFeature` / `signalState` / `patchState` / `rxMethod` / `mapResponse` / `tapResponse` / `concatLatestFrom` / 全 import 来源速查 / v18 → v19 迁移要点 / Standalone API vs NgModule API 对照
