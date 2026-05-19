---
layout: doc
outline: [2, 3]
---

# 参考

> Pinia 3.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

```ts
// from 'pinia'
import {
  // 核心 API
  defineStore,
  createPinia,
  setActivePinia,
  getActivePinia,
  disposePinia,

  // 响应式工具
  storeToRefs,

  // 映射助手（Options API 用）
  mapStores,
  mapState,
  mapWritableState,
  mapActions,
  mapGetters, // ⚠️ 兼容性别名，新代码用 mapState

  // 配置助手
  setMapStoreSuffix,

  // HMR
  acceptHMRUpdate,

  // SSR
  skipHydrate,
  shouldHydrate,

  // 类型
  type Store,
  type StoreDefinition,
  type StoreState,
  type StoreGetters,
  type StoreActions,
  type PiniaPlugin,
  type PiniaPluginContext,
  type SubscriptionCallback,
  type SubscriptionCallbackMutation,
  type StoreOnActionListener,
  type DefineStoreOptions,
  type DefineSetupStoreOptions,
  type PiniaCustomProperties,
  type PiniaCustomStateProperties,
  type DefineStoreOptionsBase,

  // 枚举
  MutationType,
} from 'pinia'
```

```ts
// from '@pinia/testing'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
```

```ts
// from '@pinia/nuxt'（Nuxt module）
// 提供自动 import + module 配置；运行时 API 同 'pinia'
```

## 核心 API

### `createPinia()`

创建一个 Pinia 实例。

```ts
function createPinia(): Pinia
```

**用法**：

```ts
import { createPinia } from 'pinia'

const pinia = createPinia()
app.use(pinia)
```

**返回的 `Pinia` 实例方法**：

| 方法 / 属性 | 说明 |
|---|---|
| `pinia.use(plugin)` | 注册插件 |
| `pinia.state` | `ref<Record<string, any>>`，所有 store 的 state |
| `pinia.install(app)` | 由 `app.use()` 自动调用 |
| `pinia._a` | 内部：当前 Vue app |
| `pinia._e` | 内部：effectScope |
| `pinia._s` | 内部：所有 store 实例的 Map |

### `defineStore()`

定义一个 store。

#### Option Store 签名

```ts
function defineStore<Id, S, G, A>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>
): StoreDefinition<Id, S, G, A>
```

```ts
defineStore('id', {
  state: () => ({ /* ... */ }),
  getters: { /* ... */ },
  actions: { /* ... */ },

  // 可选：SSR hydrate 钩子
  hydrate(state, initialState) { /* ... */ },

  // 可选：插件扩展的自定义 options（如 persist）
  persist: true,
})
```

#### Setup Store 签名

```ts
function defineStore<Id, SS>(
  id: Id,
  setup: () => SS,
  options?: DefineSetupStoreOptions<Id, ...>
): StoreDefinition<Id, ...>
```

```ts
defineStore('id', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { count, increment }
}, {
  // 可选：插件扩展的 options
  persist: true,
})
```

> ⚠️ **v3 已移除**：`defineStore({ id: 'xxx', ...options })` 老语法被删除——必须用 `defineStore('xxx', options)`。

### `setActivePinia(pinia)`

设置当前活跃的 Pinia 实例（测试 / 非组件场景必备）。

```ts
function setActivePinia(pinia: Pinia | undefined): Pinia | undefined
```

```ts
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

### `getActivePinia()`

获取当前活跃的 Pinia 实例（如果存在）。

```ts
function getActivePinia(): Pinia | undefined
```

```ts
const pinia = getActivePinia()
if (pinia) {
  // 在 pinia 上下文中
}
```

> Nuxt 中建议用 `useNuxtApp().$pinia` 或 `usePinia()` 替代。

### `disposePinia()`

销毁整个 Pinia 实例 + 清理所有 store。

```ts
function disposePinia(pinia: Pinia): void
```

```ts
import { disposePinia } from 'pinia'

disposePinia(pinia) // 清理所有 store + 订阅
```

## Store 实例 API

每个 `useXxxStore()` 返回的实例上有以下**保留属性 / 方法**（以 `$` 开头）：

### `$id`

只读字符串，等于 `defineStore` 的第一个参数。

```ts
const counter = useCounterStore()
counter.$id // 'counter'
```

### `$state`

整个 state 对象（响应式）。

```ts
counter.$state.count   // 等价于 counter.count
counter.$state = { count: 100, name: 'X' } // 整体替换 state
```

### `$patch()`

批量更新 state。

```ts
// 对象签名
$patch(partialState: Partial<S>): void

// 函数签名
$patch(mutator: (state: S) => void): void
```

```ts
// 对象
counter.$patch({ count: 1, name: 'Vue' })

// 函数
counter.$patch((state) => {
  state.items.push(item)
  state.total = computeTotal(state.items)
})
```

### `$reset()`

重置为初始 state。

```ts
$reset(): void
```

**Option Store**：自动生成。

**Setup Store**：必须手动 return：

```ts
defineStore('counter', () => {
  const count = ref(0)
  function $reset() { count.value = 0 }
  return { count, $reset }
})
```

### `$subscribe()`

监听 state 变化。

```ts
function $subscribe(
  callback: SubscriptionCallback<S>,
  options?: WatchOptions & { detached?: boolean }
): () => void
```

**回调签名**：

```ts
type SubscriptionCallback<S> = (
  mutation: {
    type: MutationType
    storeId: string
    payload?: any
    events?: DebuggerEvent | DebuggerEvent[]
  },
  state: S
) => void

enum MutationType {
  direct = 'direct',          // 直接 mutate：store.x = 1
  patchObject = 'patch object', // $patch(obj)
  patchFunction = 'patch function', // $patch(fn)
}
```

**选项**：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `detached` | `boolean` | `false` | true 时不随组件卸载自动取消订阅 |
| `flush` | `'pre'` / `'post'` / `'sync'` | `'post'` | 同 Vue `watch` |
| `deep` | `boolean` | `true` | 同 Vue `watch` |

**返回**：unsubscribe 函数。

```ts
const unsubscribe = counter.$subscribe((mutation, state) => {
  console.log(mutation.type, state)
}, { detached: true, flush: 'sync' })

unsubscribe()
```

### `$onAction()`

监听 action 调用。

```ts
function $onAction(
  callback: StoreOnActionListener<Id, S, G, A>,
  detached?: boolean
): () => void
```

**回调签名**：

```ts
type StoreOnActionListener = (context: {
  name: string                              // action 名
  store: Store                              // store 实例
  args: any[]                               // 调用参数（数组）
  after: (callback: (result: any) => void) => void // 完成回调
  onError: (callback: (error: unknown) => void) => void // 失败回调
}) => void
```

```ts
counter.$onAction(({ name, args, after, onError, store }) => {
  console.log(`[${name}] start`, args)
  after((result) => console.log(`[${name}] done`, result))
  onError((err) => console.error(`[${name}] error`, err))
})

// 不随组件卸载
counter.$onAction(callback, true)
```

### `$dispose()`

销毁 store + 取消所有 `$subscribe` / `$onAction` 订阅。

```ts
$dispose(): void
```

```ts
const store = useCounterStore()
store.$dispose() // 移除注册 + 清理订阅
```

## `storeToRefs()`

把 store 的 **state 和 getters** 转成 `ref`，使 destructure 保留响应式。

```ts
function storeToRefs<SS>(store: SS): ToRefs<StoreState<SS> & StoreGetters<SS>>
```

**特性**：

- 仅转换 **state + getters**（不包括 actions / `$xxx` 方法）
- Actions 可以直接 destructure 原 store（自动 bind）
- 模板中自动解包 `.value`

```ts
const counter = useCounterStore()

// ✅ state + getters 用 storeToRefs
const { count, name, doubleCount } = storeToRefs(counter)

// ✅ actions 直接 destructure
const { increment, setName } = counter

// 修改：
count.value++   // 直接改 .value（仍触发 store 响应式）
counter.count++ // 也可以
increment()     // 等价于 counter.increment()
```

## 映射助手（Options API）

> 这些助手主要用于 Options API。新项目（Composition API）应优先使用 `useXxxStore()` + `storeToRefs()`。

### `mapStores()`

把整个 store 实例映射到 `this.xxxStore`。

```ts
mapStores(...stores): Record<string, () => Store>
```

```ts
import { mapStores } from 'pinia'

export default {
  computed: {
    ...mapStores(useCartStore, useUserStore),
  },
  methods: {
    async buy() {
      if (this.userStore.isAuthenticated) {
        await this.cartStore.buy()
      }
    },
  },
}
```

默认后缀 `Store`（即 `useCartStore` → `this.cartStore`）。

### `setMapStoreSuffix()`

自定义 `mapStores` 的后缀。

```ts
function setMapStoreSuffix(suffix: string): void
```

```ts
import { setMapStoreSuffix, createPinia } from 'pinia'

setMapStoreSuffix('')        // useCartStore → this.cart
setMapStoreSuffix('_store')  // useCartStore → this.cart_store

export const pinia = createPinia()
```

> 改后还需要在 TS 中扩展类型：
>
> ```ts
> declare module 'pinia' {
>   interface MapStoresCustomization {
>     suffix: ''
>   }
> }
> ```

### `mapState()`

映射 state 和 getters 为 **只读 computed**。

```ts
// 数组形式（同名）
mapState(useStore, ['count', 'name'])

// 对象形式（重命名 / 函数派生）
mapState(useStore, {
  myCount: 'count',                      // 同 store.count
  double: (store) => store.count * 2,    // 派生
})
```

```ts
import { mapState } from 'pinia'

export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    ...mapState(useCounterStore, {
      myCount: 'count',
      double: (store) => store.count * 2,
    }),
  },
}
```

> 在模板中使用：`{{ count }}` / `{{ myCount }}` / `{{ double }}`。

### `mapWritableState()`

映射为 **可写 computed**（适合 `v-model`）。

```ts
mapWritableState(useStore, ['count'])
```

```ts
export default {
  computed: {
    ...mapWritableState(useCounterStore, ['count']),
  },
}

// 模板可以双向绑定：
// <input v-model="count">
```

### `mapActions()`

映射 actions 到 `this.xxx`。

```ts
mapActions(useStore, ['increment', 'reset'])
mapActions(useStore, { add: 'increment' }) // 重命名
```

```ts
export default {
  methods: {
    ...mapActions(useCounterStore, ['increment']),
    ...mapActions(useCounterStore, { add: 'increment' }),
  },
}
```

### `mapGetters()`

`mapState` 的别名（用于 Vuex 迁移兼容）——**新代码用 `mapState` 即可**。

```ts
mapGetters(useStore, ['doubleCount'])
// 等价于 mapState(useStore, ['doubleCount'])
```

## HMR

### `acceptHMRUpdate()`

为 store 启用 HMR。

```ts
function acceptHMRUpdate<S extends StoreDefinition>(
  initialUseStore: S,
  hot: ImportMeta['hot']
): (newModule: any) => any
```

```ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', { /* ... */ })

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

Webpack：

```ts
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(acceptHMRUpdate(useCounterStore, import.meta.webpackHot))
}
```

## SSR API

### `skipHydrate()`

标记 state 字段不参与 SSR hydration（用于 client-only 的 ref / composable）。

```ts
function skipHydrate<T extends Ref>(ref: T): T
```

```ts
import { defineStore, skipHydrate } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

defineStore('user', () => {
  const token = useLocalStorage('token', '') // client-only
  return {
    token: skipHydrate(token),
  }
})
```

### `shouldHydrate()`

判断一个 ref 是否参与 hydration（一般无需手动调用）。

```ts
function shouldHydrate(obj: any): boolean
```

## Plugin API

### `PiniaPluginContext`

插件接收的上下文。

```ts
interface PiniaPluginContext<Id, S, G, A> {
  pinia: Pinia            // pinia 实例
  app: App                // Vue app
  store: Store<Id, S, G, A>  // 当前 store
  options: DefineStoreOptions<Id, S, G, A> // store 的 defineStore options
}
```

### `pinia.use()`

注册插件。

```ts
function use(plugin: PiniaPlugin): Pinia
```

```ts
pinia.use((context) => {
  // 返回的对象会合并到 store 上
  return { hello: 'world' }
})

pinia.use(({ store }) => {
  store.$subscribe(() => { /* ... */ })
})
```

### 插件中常用 store 内部属性

| 属性 | 说明 |
|---|---|
| `store._customProperties` | DevTools 可见的自定义属性集合（dev only） |
| `store.$state` | state 对象引用 |
| `store.$id` | store id |

## TypeScript 类型扩展

### `PiniaCustomProperties`

扩展所有 store 实例的属性（来自 plugin）。

```ts
import 'pinia'
import type { Router } from 'vue-router'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    router: Router
    hasError: boolean
    // 也支持 getter / setter
    set hello(value: string | Ref<string>)
    get hello(): string
  }
}
```

### `PiniaCustomStateProperties`

扩展所有 store 的 `$state`（来自 plugin）。

```ts
declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    hasError: boolean
  }
}
```

### `DefineStoreOptionsBase`

扩展 `defineStore` 第二参数的 options。

```ts
declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>
    persist?: boolean | PersistOptions
  }
}
```

### `MapStoresCustomization`

修改 `mapStores` 的后缀类型。

```ts
declare module 'pinia' {
  export interface MapStoresCustomization {
    suffix: '' // 或 '_store' 等
  }
}
```

## 类型辅助

### `Store<Id, S, G, A>`

完整的 store 实例类型。

```ts
type Store<Id extends string, S, G, A> = _StoreWithState<Id, S, G, A> &
  UnwrapRef<S> &
  _StoreWithGetters<G> &
  PiniaCustomProperties<Id, S, G, A> &
  A
```

### `StoreDefinition<Id, S, G, A>`

`defineStore` 返回的 composable 函数类型。

```ts
type StoreDefinition<Id, S, G, A> = (pinia?: Pinia | null) => Store<Id, S, G, A>
```

### `StoreState<SS>` / `StoreGetters<SS>` / `StoreActions<SS>`

从 store 类型反推 state / getters / actions。

```ts
import type { StoreState, StoreGetters, StoreActions } from 'pinia'

type State = StoreState<typeof useCounterStore>     // { count: number, name: string }
type Getters = StoreGetters<typeof useCounterStore> // { doubleCount: number }
type Actions = StoreActions<typeof useCounterStore> // { increment: () => void }
```

## 测试 API（`@pinia/testing`）

### `createTestingPinia()`

创建用于组件测试的 mock pinia。

```ts
function createTestingPinia(options?: TestingOptions): TestingPinia

interface TestingOptions {
  initialState?: Partial<Record<string, any>>
  stubActions?: boolean | string[] | ((name: string, store: Store) => boolean)
  plugins?: PiniaPlugin[]
  createSpy?: () => () => void  // Vitest: vi.fn / Jest: jest.fn
  fakeApp?: boolean  // 是否伪造 Vue app（默认 false）
}
```

```ts
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'

const pinia = createTestingPinia({
  createSpy: vi.fn,
  initialState: {
    counter: { count: 5 },
  },
  stubActions: false, // 让 action 正常执行
})
```

**配置说明**：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `initialState` | `Record<string, any>` | `{}` | 按 store id 注入初始 state |
| `stubActions` | `boolean / string[] / fn` | `true` | true=mock 所有 action；false=正常执行；数组=指定 mock；函数=按 action 名判断 |
| `plugins` | `PiniaPlugin[]` | `[]` | 额外的 pinia 插件 |
| `createSpy` | `() => fn` | 全局 jest.fn | Vitest 必传 `vi.fn` |
| `fakeApp` | `boolean` | `false` | 是否创建 fake Vue app（一般不需要） |

### `TestingPinia`

`createTestingPinia` 返回类型，扩展了 `Pinia`：

```ts
interface TestingPinia extends Pinia {
  app: App                                  // fake Vue app
  // 其他与 Pinia 一致
}
```

## Nuxt 集成（`@pinia/nuxt`）

### 模块配置

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    // 自定义 store 扫描目录（默认 './stores'）
    storesDirs: ['./stores/**'],
  },
})
```

### 自动 import 的 API

| API | 说明 |
|---|---|
| `defineStore` | 定义 store |
| `storeToRefs` | 解构 store |
| `acceptHMRUpdate` | HMR |
| `usePinia` | 获取当前 pinia 实例（替代 `getActivePinia`） |
| `useXxxStore` | `stores/` 目录下所有 store 自动 import |

### 在非组件中获取 pinia

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore() // 自动可用
  if (!userStore.isLoggedIn) {
    return navigateTo('/login')
  }
})

// 或显式拿 pinia
const { $pinia } = useNuxtApp()
const userStore = useUserStore($pinia)
```

## defineStore 选项完整速查

### Option Store 选项

```ts
defineStore('id', {
  // 必填：state 工厂
  state: () => ({ /* ... */ }),

  // 可选：getters
  getters: {
    derived: (state) => state.x * 2,
    other(): number { return this.derived + 1 },
  },

  // 可选：actions
  actions: {
    sync() { this.x++ },
    async asyncFn() { this.data = await api.get() },
  },

  // 可选：SSR hydrate 钩子
  hydrate(storeState, initialState) {
    storeState.client = useLocalStorage('key', '')
  },

  // 可选（插件扩展）：持久化
  persist: true,
  // 或
  persist: {
    key: 'custom-key',
    storage: sessionStorage,
    pick: ['fieldA'],
  },

  // 可选（插件扩展）：debounce
  debounce: { searchContacts: 300 },
})
```

### Setup Store 选项

```ts
defineStore('id', () => {
  // 任意 Composition API
  const x = ref(0)
  const derived = computed(() => x.value * 2)
  function increment() { x.value++ }
  function $reset() { x.value = 0 }

  return { x, derived, increment, $reset }
}, {
  // 可选 options（同 Option Store 中的非 state/getters/actions 部分）
  persist: true,
})
```

## 常用 import 来源速查

| 符号 | 来源 |
|---|---|
| `defineStore` | `pinia` |
| `createPinia` | `pinia` |
| `setActivePinia` / `getActivePinia` | `pinia` |
| `storeToRefs` | `pinia` |
| `mapStores` / `mapState` / `mapWritableState` / `mapActions` | `pinia` |
| `acceptHMRUpdate` | `pinia` |
| `skipHydrate` / `shouldHydrate` | `pinia` |
| `setMapStoreSuffix` | `pinia` |
| `MutationType` | `pinia` |
| `PiniaPluginContext` | `pinia`（type） |
| `createTestingPinia` | `@pinia/testing` |
| Nuxt module | `@pinia/nuxt` |

## 版本兼容矩阵

| Pinia | Vue | TypeScript | Nuxt | DevTools |
|---|---|---|---|---|
| v3.x | Vue 3.x | TS 5+ | Nuxt 3 / 4 | DevTools 7+ |
| v2.x | Vue 2.7+ / Vue 3.x | TS 4.4+ | Nuxt 2 / Bridge / 3 | DevTools 6+ |
| v0.x / v1.x | Vue 2 + `@vue/composition-api` | — | — | — |

## 弃用对照（v2 → v3）

| v2 API | v3 处理 | 替代方案 |
|---|---|---|
| `defineStore({ id, ...options })` | **移除** | `defineStore('id', options)` |
| `PiniaStorePlugin` 类型 | **移除** | `PiniaPlugin` |
| Vue 2 支持 | **移除** | 升级到 Vue 3 + Pinia v3，或保留 Pinia v2 |
| DevTools API v6 | 升级到 v7 | 自定义 DevTools 插件需重写 |

## 相关链接

- [Pinia 官网](https://pinia.vuejs.org/)
- [API Reference](https://pinia.vuejs.org/api/)
- [Cheat Sheet](https://pinia.vuejs.org/cheatsheet.html)
- [GitHub: vuejs/pinia](https://github.com/vuejs/pinia)
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- [Pinia Discord](https://chat.vuejs.org/) | [Vue Discord #pinia](https://discord.com/invite/vue)
