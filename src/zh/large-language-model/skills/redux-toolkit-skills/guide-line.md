---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 reduxjs/redux-toolkit 官方 skills（`packages/toolkit/skills/`）9 个 `SKILL.md` 编写，引用其 Setup / Core Patterns / Common Mistakes。

## 速查

- **1｜build-modern-redux-apps**：`modern-redux`（configureStore/Provider/typed hooks/SSR store 生命周期）+ `redux-dataflow`（event→reducer→selector→render、事件式 action、selector 派生）
- **2｜model-redux-state**：`build-slices-and-selectors`（createSlice/Immer/slice selectors/`create.asyncThunk`/entity adapter/懒注入）+ `design-state-ownership`（数据放 Redux 还是组件/路由、slice 尺寸）
- **3｜manage-server-data**：`adopt-rtk-query`（createApi/一个后端一个 API 根/tag 失效/乐观更新 lifecycle）+ `generate-rtk-query-from-openapi`（空 API + codegen）
- **4｜orchestrate-side-effects**：`handle-side-effects`（RTK Query→createAsyncThunk→listener middleware 决策树；副作用别进 reducer；listener 要 `prepend`）
- **5｜evolve-and-diagnose**：`debug-redux-toolkit-apps`（重复请求/序列化警告/订阅过宽）+ `migrate-to-modern-redux`（createStore→configureStore、增量迁移、codemod）
- **贯穿反模式**：`connect` / 手写 switch reducer / `extraReducers` 对象语法 / 数组 middleware / reducer 里跑副作用 / 一个后端多个 API 根 / URL 状态同步进 Redux——技能全部标 Wrong→Correct
- **严重度**：`CRITICAL`（破坏不可变/纯度）> `HIGH`（过时/易错默认）> `MEDIUM`（会漂移的次优）

## 一、build-modern-redux-apps：装配现代应用

### modern-redux（lifecycle）

新建或现代化 React + Redux 时用。覆盖 `configureStore`、`Provider` 装配、typed hooks、hooks-first 用法、feature 文件夹、SPA 与 SSR 下的 store 生命周期。

**核心模式**

- **组件走 hooks，不走包装器**：`useAppSelector` / `useAppDispatch` 是新代码默认，`connect` 是逃生舱
- **SSR 应用在 Provider 内建 store**：`const [store] = useState(makeStore)`——每请求一个 store，且跨渲染稳定
- **app/ 放装配，feature 文件夹放逻辑**：`app/store.ts` + `app/hooks.ts`，特性代码就近 colocate

**反模式（Common Mistakes）**

- `HIGH` 在组件里直接 `import { store }` 读 `store.getState()`——应走 context + hooks
- `HIGH` 新代码默认 `connect()`——维护者明确要 agent 把新代码导向 hooks
- `HIGH` SSR 里每次渲染 `makeStore()`——客户端丢状态、服务端 singleton 跨请求泄漏；用 `useState(makeStore)`
- `HIGH` 保留 `createStore` 样板——丢掉 RTK 默认 middleware、dev 检查与推荐基线

### redux-dataflow（core）

需要 Redux 的事件循环、事件式 action、reducer 拥有的状态转换、派生数据、调试模型时用。**这是理解 Redux 的心智地基。**

**核心模式**

- **dispatch 事件，不 dispatch setter**：`postAdded({...})` 而非 `setPosts(nextArray)`——action 描述「发生了什么」
- **reducer 合并新旧数据**：若转换要混合 store 现状 + 外部新数据，dispatch 外部数据，让 reducer 拥有合并逻辑
- **用 selector 派生，不存副本**：`createSelector` 记忆化派生视图，state 里只留单一真相

**反模式**

- `CRITICAL` 在 reducer 外修改从 store 读出的对象——它仍是 store 状态，破坏不可变与陈旧渲染假设
- `HIGH` 用 setter 式 action 代替事件式——别让 reducer 盲目替换成预算好的值
- `HIGH` dispatch 前就合并 store 状态——下一状态依赖现状时，合并逻辑归 reducer
- `HIGH` 异步 reducer 忽略当前状态——`fetchPosts.fulfilled` 里应校验 `state.status === 'pending'`，防陈旧请求覆盖
- `MEDIUM` 把派生值存进 state——会漂移，保留原始态、按需派生

## 二、model-redux-state：状态建模

### build-slices-and-selectors（core）

写/重构 slice 时用。覆盖 `createSlice`、slice selectors、`create.asyncThunk`、entity adapter、懒 reducer 注入。

**核心模式**

- **reducer 里用 mutating 语法**：Immer 是 `createSlice` 默认，`state.items.push(...)` 直接写，别手动拷贝
- **slice selectors**：把 `selectors: { selectValue: (s) => s.value }` 写进 `createSlice`，状态位置知识就近
- **`create.asyncThunk`**：用 `buildCreateSlice({ creators: { asyncThunk: asyncThunkCreator } })` 建 `createAppSlice`，异步生命周期就近 slice 时用
- **entity adapter + 懒注入**：`createEntityAdapter` 标准化归一集合；`combineSlices().withLazyLoadedSlices()` + `slice.injectInto()` 让 slice 感知注入位置

```ts
export const createAppSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
})

export const postsSlice = createAppSlice({
  name: 'posts',
  initialState,
  reducers: (create) => ({
    postAdded: create.reducer<{ id: string; title: string }>((state, action) => {
      state.items.push({ ...action.payload, published: false })
    }),
    fetchPosts: create.asyncThunk(
      async () => (await fetch('/api/posts')).json(),
      {
        pending: (state) => { state.status = 'pending' },
        fulfilled: (state, action) => { state.status = 'succeeded'; state.items = action.payload },
        rejected: (state) => { state.status = 'failed' },
      },
    ),
  }),
  selectors: {
    selectPosts: (state) => state.items,
  },
})
```

**反模式**

- `CRITICAL` 在 slice reducer 外用 mutating 语法——mutation 只在 Immer 上下文（`createSlice`/`createReducer`）内安全
- `HIGH` 默认手写 switch reducer——那是「已证瓶颈」的逃生舱，不是 agent 常规产物
- `HIGH` 写 RTK 1.x 的 `extraReducers` 对象语法——RTK 2 已移除，用 `(builder) => builder.addCase(...)`
- `HIGH` 假设每个集合都有 `entity.id`——非 `id` 主键要传 `selectId: (book) => book.bookId`

### design-state-ownership（core）

决定数据该放 Redux、组件 state、路由 state 还是别处时用。覆盖状态归属、权威边界、slice 尺寸、随应用演进的迁移。

**核心模式**

- **可编辑表单状态留在本地，提交才入 Redux**：`useState` 管每次击键，`dispatch(profileSaved(...))` 只在提交
- **URL 状态归路由，在边缘合并**：`useSearchParams` 读 filter，作为参数传进 selector，别同步进 Redux
- **随访问模式重设 slice 尺寸**：无关数据拆开，处处拼在一起的数据可能该靠近

**反模式**

- `MEDIUM` 把表单编辑态放 Redux——每次击键 dispatch，为单组件树的数据加全局复杂度
- `HIGH` 把路由/URL 状态同步进 Redux——URL 已有权威 owner，重复即两个真相源
- `HIGH` 用组件名命名 state——`loginScreen`/`postsList` 应是 `auth`/`posts`（按领域，非组件树）
- `MEDIUM` 让 slice 边界固化——把 auth/posts/notifications 焊进一个 `app` slice；按实际访问模式拆合
- `HIGH` 盲目把 payload 铺进 state——`{...state, ...action.payload}` 让 reducer 把 payload 当可信补丁；应逐字段赋值

## 三、manage-server-data：服务端数据

### adopt-rtk-query（lifecycle）

把 RTK Query 作为默认服务端数据 + 文档缓存层时用。覆盖 `createApi`、store 集成、hooks、失效行为、乐观更新、以及「何时 RTK Query 是对的缓存模型」。

**核心模式**

- **一个 base URL 一个 API 根，用 `injectEndpoints` 扩展**：别为同后端建多个 `createApi`
- **用 tag 做失效**：`providesTags` 标记查询、`invalidatesTags` 标记变更；tag 是常规失效路径
- **乐观更新写在 endpoint lifecycle**：`onQueryStarted` 里 `api.util.updateQueryData(...)` 打 patch，`catch` 里 `patch.undo()`

```ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Post'],
  endpoints: (build) => ({
    getPosts: build.query<Post[], void>({
      query: () => 'posts',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Post' as const, id })), 'Post'] : ['Post'],
    }),
    addPost: build.mutation<Post, Pick<Post, 'title'>>({
      query: (body) => ({ url: 'posts', method: 'POST', body }),
      invalidatesTags: ['Post'],
    }),
  }),
})
export const { useGetPostsQuery, useAddPostMutation } = api
```

store 里两处都要接：`reducer: { [api.reducerPath]: api.reducer }` + `middleware: (gDM) => gDM().concat(api.middleware)`。

**反模式**

- `CRITICAL` 为一个后端建多个 API 根——用 `api.injectEndpoints` 拆文件，保失效行为、免重复 middleware
- `HIGH` 漏接 `api.reducer` 或 `api.middleware`——hooks 需两者才能管缓存与请求生命周期
- `MEDIUM` 默认持久化浏览器缓存——常让 stale 数据留太久，持久化当特例
- `HIGH` 从组件里 patch 缓存——`updateQueryData` 应在 mutation lifecycle 里，别在组件 `useEffect`
- `HIGH` 以为失效会重取未订阅的查询——失效只重取**活跃订阅**的查询，没组件用就丢弃、下次再取

### generate-rtk-query-from-openapi（composition）

用 `@rtk-query/codegen-openapi` 从 OpenAPI schema 生成 RTK Query endpoints 时用。**注意它在 `packages/rtk-query-codegen-openapi/skills/` 而非主 skills 目录**，`requires: adopt-rtk-query`。

**核心模式**

- **生成进「空 API」**：`emptySplitApi = createApi({ endpoints: () => ({}) })`，codegen 扩展它而非另立 API 根
- **`filterEndpoints` 收窄**：schema 太大时先取一片，`filterEndpoints: ['loginUser', /User/]`
- **`endpointOverrides` 修生成结果**：改 `type`（query↔mutation）、`parameterFilter`、`providesTags`，别手改生成文件

```ts
// openapi-config.ts
const config: ConfigFile = {
  schemaFile: './openapi.json',
  apiFile: './src/store/emptyApi.ts',
  apiImport: 'emptySplitApi',
  outputFile: './src/store/petApi.ts',
  exportName: 'petApi',
  hooks: true,
  tag: true,
  endpointOverrides: [{ pattern: 'getPetById', providesTags: ['SinglePet'] }],
}
// npx @rtk-query/codegen-openapi openapi-config.ts
```

**反模式**

- `HIGH` 以为生成的 tag 够精确——默认 string-only，可能失效超出预期，用 `endpointOverrides` 收窄
- `HIGH` 另立全新 API 根而非扩展空 API——应插进一个 RTK Query 架构，保失效与装配一致
- `MEDIUM` 不 review 直接信生成形状——真实 schema 常需改 type/参数/tag，把生成物当「已 review 的源码」

## 四、orchestrate-side-effects：副作用编排

### handle-side-effects（core）

在 RTK Query、`createAsyncThunk`、手写 thunk、`createListenerMiddleware` 之间选择时用。**这是一棵决策树：**

| 场景 | 用什么 |
| --- | --- |
| 服务端数据、要缓存复用 | **RTK Query**（首选） |
| 一次命令式异步（单点 dispatch + getState） | **`createAsyncThunk`** |
| 反应式：响应未来的 action / 状态变化 | **`createListenerMiddleware`** |

listener 装配关键：`middleware: (gDM) => gDM().prepend(listenerMiddleware.middleware)`——必须 **prepend**。

**反模式**

- `CRITICAL` 在 reducer 里跑副作用——即便有 Immer，reducer 也必须纯；`fetch()` 移到 thunk
- `HIGH` 用 thunk 轮询未来状态变化——`while (getState()... )` 是跟架构对着干；用 listener 的 `predicate`
- `HIGH` 把 listener middleware `concat` 在默认检查之后——listener 的 add/remove action 携带函数，须在序列化检查**之前**跑，所以要 `prepend`

## 五、evolve-and-diagnose-redux-apps：演进与诊断

### debug-redux-toolkit-apps（lifecycle）

排查重复请求、stale 缓存、订阅过宽、selector 抖动、序列化警告等 RTK/RTK Query bug 时用。

**核心模式**

- **按序调试：action → reducer → selector → render**——组件不对，先验 action 发了没、再 reducer、再 selector、再渲染边界
- **在使用点收窄订阅**：组件只 select 它要渲染的值，且尽量靠近使用处
- **正确解读 RTK Query 失效**：失效没触发重取？先看还有没有东西订阅那条缓存

**反模式**

- `HIGH` 从 effect dispatch fetch thunk 却没在 thunk 层加 guard——StrictMode 开发下 effect 跑两次，guard 要用 `createAsyncThunk` 的 `condition` 放在 thunk 里
- `HIGH` 无视序列化警告——`new Date()` / `Set` 进 state 会破坏 DevTools、replay、持久化；存 ISO 字符串 / 数组
- `HIGH` 在父层 select 大块 state 再透传 props——拉宽订阅面、把重渲染顺 props 推下去
- `MEDIUM` `selectFromResult` 返回不稳定对象——`{ posts: [...data] }` 每次新引用毁记忆化；直接 `{ posts: data }`

### migrate-to-modern-redux（lifecycle）

把 legacy Redux 迁到现代 RTK 时用。覆盖 `createStore`→`configureStore`、被触及的 reducer 迁到 `createSlice`、codemod 辅助的 RTK 2 更新、用 RTK Query 替换服务端数据栈。

**核心模式**

- **先换 store 装配**：`createStore` → `configureStore`——唯一能立刻做、旧 reducer 继续跑的步骤
- **改到哪个 reducer 就迁哪个**：需要编辑时再迁到 `createSlice`，别继续给它加旧代码
- **用 codemod 做机械更新**：`npx @reduxjs/rtk-codemods createSliceBuilder <file>`、`createReducerBuilder <file>`，跑完人工 review 收尾
- **服务端数据栈换 RTK Query**：旧代码只是「请求状态 + 取回数据」时，迁向 RTK Query 而非把 thunk 栈永远抬下去

**反模式**

- `HIGH` 一次性大爆炸重写——迁移是增量的（换 store → 迁一个 reducer → 连接组件转 hooks → 重复），但 store 现代化后新工作不再加旧范式
- `CRITICAL` 把 RTK 2 已移除的配置形式抬下去——`middleware: [logger]` 数组等旧 builder 形式，改回调形式
- `HIGH` 默认保留手写 fetch 状态——真是服务端缓存就迁 RTK Query，别在新 API 里重建旧的 loading-flag 架构

## 反模式速查（跨技能汇总）

| 反模式 | 严重度 | 正解 |
| --- | --- | --- |
| `createStore` + `applyMiddleware` | HIGH | `configureStore` |
| `connect()` 做新组件 | HIGH | `useAppSelector`/`useAppDispatch` |
| 手写 switch reducer | HIGH | `createSlice` |
| `extraReducers` 对象语法 | HIGH | `(builder) => builder.addCase()` |
| `middleware: [arr]` 数组 | CRITICAL（迁移语境） | `(gDM) => gDM().concat(...)` |
| reducer 里 `fetch()` / 副作用 | CRITICAL | thunk / listener |
| reducer 外 mutate store 对象 | CRITICAL | dispatch action，reducer 内改 |
| 一个后端多个 `createApi` | CRITICAL | `injectEndpoints` |
| 组件里 patch RTK Query 缓存 | HIGH | `onQueryStarted` lifecycle |
| URL/表单状态塞进 Redux | HIGH/MEDIUM | 路由/组件 state + selector 边缘合并 |
| `Date`/`Set` 进 state | HIGH | ISO 字符串 / 数组 |

## 下一步

- [参考](./reference) —— 9 SKILL.md 分类表 + `requires` 依赖图、rtk-query-codegen-openapi、安装、版本、许可、链接
- 上游：[Redux Toolkit 官网](https://redux-toolkit.js.org/) · [Redux 风格指南](https://redux.js.org/style-guide/)
