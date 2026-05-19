---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Zustand 5.x。包含 State 设计原则、选择器深度优化、所有 middleware 详解、Slices 模式、vanilla store、SSR + Next.js 集成、测试、React 18 Concurrent Features 协同与常见踩坑。

## 速查

- **State 设计**：单 store + slice 模式 / actions colocate（推荐）vs actions-outside / 异步 action 直接 `async/await`
- **selector 必传**：`useStore((s) => s.x)` 才能精准订阅、不传等于 `(s) => s` 全字段订阅
- **多字段 selector**：用 `useShallow` 包裹（v5 推荐）或 `createWithEqualityFn` + 自定义比较函数
- **`set` shallow merge**：默认顶层合并、嵌套对象要手动展开；`set(newState, true)` 完全替换
- **`get()`**：在 action 内读最新 state（不是闭包的旧值）
- **vanilla store**：`createStore` from `zustand/vanilla`，不依赖 React，可在 Worker / Node / 测试用
- **persist**：`name` / `storage` / `partialize` / `version` / `migrate` / `skipHydration` 全配置
- **devtools**：`name` / `actionsDenylist` / `anonymousActionType` / `enabled` / `set(..., undefined, 'actionType')`
- **immer**：嵌套对象 mutable 写法（`state.user.name = 'X'`）
- **subscribeWithSelector**：精准订阅 + `fireImmediately` / 自定义 `equalityFn`
- **combine**：state + actions 分离 + 自动类型推导（v5 不用 curried）
- **Next.js**：vanilla store + `useState(() => createStore())` + React Context = store-per-request
- **测试**：Vitest / Jest 用 `__mocks__/zustand.ts` 自动 mock + `afterEach` reset 所有 store
- **React 18**：内部用 `useSyncExternalStore`，concurrent rendering 下 tearing-free

## State 设计原则

### 单 store vs 多 store

Zustand 官方推荐 **单 store**——大型应用拆 slice 合并到一个 store：

```ts
// ✅ 推荐：单 store + slice 拼接（详见后文 Slice 模式）
const useAppStore = create((set) => ({
  ...createUserSlice(set),
  ...createCartSlice(set),
  ...createUiSlice(set),
}))
```

为什么单 store？

- **跨 slice 调用简单**：在同一个 store 内 `get().otherSlice.action()` 即可，不需要 `useOtherStore()`
- **DevTools 一次连接**：一个 store = Redux DevTools 一个标签页（多 store 需手动配 `store` 选项分组）
- **persist 一次配**：一个 store = 一个 localStorage key
- **服务端 hydration 一次性**：SSR 时只 hydrate 一份

何时用**多 store**？

- **生命周期不同**：如 form state（页面级、随路由销毁）vs auth state（应用级、跨页面持久）
- **持久化策略不同**：一个用 localStorage、一个用 sessionStorage
- **可独立测试 / 复用**：可单独发包的状态库
- **代码隔离**：micro-frontend / 不同 feature 团队各自维护

### Actions colocate vs Actions outside

**模式 A：colocate（官方推荐）** —— state 和 action 写在一起：

```ts
export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
  reset: () => set({ bears: 0 }),
}))
```

**模式 B：actions outside** —— action 写在 store 外、用 `setState`：

```ts
export const useBearStore = create<BearState>()(() => ({
  bears: 0,
}))

// action 在 store 外（不需要 hook 调用、便于 code splitting）
export const increaseBear = () =>
  useBearStore.setState((s) => ({ bears: s.bears + 1 }))

export const resetBear = () =>
  useBearStore.setState({ bears: 0 })
```

**对比**：

| 维度 | Colocate | Outside |
|---|---|---|
| 调用方式 | `useBearStore((s) => s.increase)()` | `import { increaseBear }; increaseBear()` |
| Hook 强依赖 | 是（必须在组件内拿 action） | 否（任意函数都能调） |
| Code splitting | 较难 | 容易（action 可独立 import） |
| 测试 mock | 必须 mock 整个 store | 可单独 mock action |
| DevTools 集成 | 内置（action name 自动） | 需要在 `setState(..., undefined, 'name')` 写 |

**推荐**：默认用 colocate（更内聚），仅当需要 code splitting 或独立 import action 时用 outside。

### 派生 state：用 selector 不用 store 字段

派生值（如 `total = price * quantity`）**不要存到 state**——用 selector 实时计算：

```ts
// ❌ 不推荐：派生值存到 state（数据冗余 + 同步麻烦）
export const useCartStore = create<CartState>()((set) => ({
  items: [],
  total: 0, // ❌ 必须每次 set items 时同步更新 total
  addItem: (item) => set((s) => {
    const newItems = [...s.items, item]
    return {
      items: newItems,
      total: newItems.reduce((sum, i) => sum + i.price, 0), // 容易忘
    }
  }),
}))

// ✅ 推荐：派生值用 selector 实时算
export const useCartStore = create<CartState>()((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}))

// 组件中：
const total = useCartStore((s) =>
  s.items.reduce((sum, i) => sum + i.price, 0),
)
```

> **何时派生值入 store**？计算成本很高（O(n²) 算法）且很多组件用——这时可以入 store + 在 action 中显式维护。否则永远 selector。

## 选择器深度优化

### 默认行为：`Object.is` 比较

Zustand selector 默认用 `Object.is`（`===` 升级版）比较 `oldValue` 和 `newValue`——如果 `oldValue !== newValue`，组件重渲。

```ts
// 单字段：Object.is(number, number) === 比较，安全
const bears = useBearStore((s) => s.bears)
// state.bears = 0 → 1，Object.is(0, 1) === false → 重渲 ✓
// state.honey = 1 → 2，Object.is(0, 0) === true → 不重渲 ✓
```

**问题场景**：对象 / 数组 selector 默认每次返回**新引用**：

```tsx
// ❌ 每次组件重渲，selector 都返回新对象 → Object.is 永远 false → 永远重渲
function Dashboard() {
  const { bears, honey } = useBearStore((s) => ({
    bears: s.bears,
    honey: s.honey,
  }))
  // 即使 bears 和 honey 都没变，新对象 ≠ 老对象
  return <div>{bears} bears, {honey} honey</div>
}
```

### 解决方案 1：`useShallow`（v5 推荐）

`useShallow` 把 selector 包装成「**shallow 比较** + memoize」：

```tsx
import { useShallow } from 'zustand/react/shallow'

function Dashboard() {
  const { bears, honey } = useBearStore(
    useShallow((s) => ({ bears: s.bears, honey: s.honey })),
  )
  return <div>{bears} bears, {honey} honey</div>
}
```

`useShallow` 内部用 `shallow` 函数比较：**top-level 属性 + 引用相等** = 视为相等、不触发重渲。

**`shallow` 的判定规则**：

- 基本类型（number / string / boolean / bigint）：`Object.is` 比较 → `1 === 1` true
- 对象：top-level 属性全部 `Object.is` 相等 → `{ a: 1 } ≈ { a: 1 }` true
- 数组：每个元素 `Object.is` 相等 + 长度相等 → `[1, 2] ≈ [1, 2]` true
- `Set` / `Map`：top-level 元素 / 键值对 `Object.is` 相等 → 相等判定

**`shallow` 的局限**：

- 嵌套对象：`{ a: { b: 1 } }` vs `{ a: { b: 1 } }` → false（因为 `a` 引用不同）
- 不同原型：`Object.create({})` vs `{}` → false（原型不同）

### 解决方案 2：多次 `useStore`（最轻量）

如果 selector 返回基本类型（number / string），直接多次调用：

```tsx
function Dashboard() {
  // 每个 useBearStore 单独订阅一个字段，互不影响
  const bears = useBearStore((s) => s.bears)
  const honey = useBearStore((s) => s.honey)
  return <div>{bears} bears, {honey} honey</div>
}
```

**优势**：

- 无需 `useShallow` 包裹（基本类型用 `Object.is` 已经足够）
- selector 返回的值就是最终值（无对象引用问题）
- 性能最高（无对象创建）

### 解决方案 3：`createWithEqualityFn`（自定义比较）

需要自定义 equality 函数（如深比较 / 业务规则比较）时：

```ts
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

// 注意：从 'zustand/traditional' 导入，需要安装 use-sync-external-store
export const useBearStore = createWithEqualityFn<BearState>()(
  (set) => ({ ... }),
  shallow, // 默认 equality fn
)

// 组件中：可以传第二参数覆盖默认 equality
const data = useBearStore((s) => s.complex, Object.is)         // 用 Object.is
const data2 = useBearStore((s) => s.list, customDeepEqual)     // 用自定义比较
```

> v5 中 `create` 不再支持 equalityFn 参数——必须用 `createWithEqualityFn` from `zustand/traditional`。

### 解决方案 4：Auto-generating Selectors

每次写 `useStore((s) => s.field)` 太啰嗦？写个工具函数自动生成 selector：

```ts
// utils/createSelectors.ts
import type { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }
  return store
}
```

用法：

```ts
import { createSelectors } from '@/utils/createSelectors'
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
}

const useBearStoreBase = create<BearState>()((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}))

export const useBearStore = createSelectors(useBearStoreBase)

// 组件中：
const bears = useBearStore.use.bears()      // 等价于 useBearStore((s) => s.bears)
const increase = useBearStore.use.increase()
```

### `useShallow` vs `shallow` vs `createWithEqualityFn` 选择决策

| 场景 | 推荐方案 |
|---|---|
| 单字段、基本类型 selector | 直接 `useStore((s) => s.x)` |
| 多字段、对象 selector | `useShallow((s) => ({ a, b, c }))` |
| 数组 selector | `useShallow((s) => [a, b])` |
| `Object.keys(obj)` / `filter` / `map` 派生数组 | `useShallow` |
| 需要深比较 / 业务规则比较 | `createWithEqualityFn` + 自定义 fn |
| 大量 selector 重复书写 | `createSelectors` 工具函数 |

## Middleware 详解

Zustand middleware = 包装 `stateCreatorFn` 的高阶函数——可以多层嵌套组合。

**通用规则**：

- **顺序敏感**：`devtools(persist(creator))` 是「先 persist 再 devtools」，调换顺序会影响 DevTools 显示
- **TypeScript Mutator**：每个 middleware 会向 `StateCreator&lt;T, [...mutators], ...&gt;` 添加一项 mutator——slice 模式时类型必须完整传递
- **常见组合**：`devtools(persist(immer(creator)))`——顺序通常 devtools 最外、immer 最内

### `persist` middleware

把 state 持久化到 storage（localStorage / sessionStorage / IndexedDB / 自定义）。

#### 基础用法

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useBearStore = create<BearState>()(
  persist(
    (set) => ({
      bears: 0,
      increase: () => set((s) => ({ bears: s.bears + 1 })),
    }),
    {
      name: 'bear-storage',                              // localStorage key（必填、唯一）
      storage: createJSONStorage(() => localStorage),    // 默认 localStorage
    },
  ),
)
```

**默认行为**：

- 存储：`localStorage` + JSON 序列化
- key：配置中的 `name`
- 字段：**所有 state**（包括 actions——但 actions 是函数会被 JSON.stringify 忽略）
- 时机：每次 state 变化 → 立即同步写 storage

#### 自定义 storage

`createJSONStorage` 接受任何符合 `StateStorage` 接口的对象：

```ts
interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}
```

常见 storage：

```ts
// sessionStorage
storage: createJSONStorage(() => sessionStorage)

// IndexedDB（用 idb-keyval 库）
import { get, set, del } from 'idb-keyval'
storage: createJSONStorage(() => ({
  getItem: (name) => get(name).then((v) => v ?? null),
  setItem: (name, value) => set(name, value),
  removeItem: (name) => del(name),
}))

// URL search params（无服务端、可分享 URL）
const searchParamsStorage = {
  getItem: (key: string) => new URL(location.href).searchParams.get(key),
  setItem: (key: string, value: string) => {
    const sp = new URL(location.href).searchParams
    sp.set(key, value)
    window.history.replaceState({}, '', `${location.pathname}?${sp.toString()}`)
  },
  removeItem: (key: string) => {
    const sp = new URL(location.href).searchParams
    sp.delete(key)
    window.history.replaceState({}, '', `${location.pathname}?${sp.toString()}`)
  },
}

storage: createJSONStorage(() => searchParamsStorage)
```

#### `partialize`：只持久化部分字段

```ts
persist(
  (set) => ({
    user: null,
    settings: {},
    tempLoadingState: false,
    fetchData: async () => { ... },
  }),
  {
    name: 'app-storage',
    // 只持久化 user 和 settings，不持久化 tempLoadingState 和 actions
    partialize: (state) => ({
      user: state.user,
      settings: state.settings,
    }),
  },
)
```

#### `version` + `migrate`：版本迁移

state schema 变化时（如 v0 的 `{ x, y }` 改为 v1 的 `{ position: { x, y } }`），用 version + migrate：

```ts
persist(
  (set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }),
  {
    name: 'position-storage',
    version: 1, // 当前版本
    migrate: (persisted: any, version) => {
      if (version === 0) {
        // v0 → v1：把扁平 x, y 改为嵌套 position
        persisted.position = { x: persisted.x, y: persisted.y }
        delete persisted.x
        delete persisted.y
      }
      return persisted
    },
  },
)
```

**migrate 时机**：

- 启动时读取 storage → 发现 `version` 字段与配置不同 → 调用 `migrate`
- `migrate` 返回新 state → 触发 hydration

#### `merge`：自定义合并策略

默认 `merge` 是 **shallow merge**（顶层合并）。如果持久化的 state 与当前 state schema 不同、需要深合并：

```ts
import createDeepMerge from '@fastify/deepmerge'
const deepMerge = createDeepMerge({ all: true })

persist(
  (set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }),
  {
    name: 'position-storage',
    merge: (persisted, current) => deepMerge(current, persisted) as never,
  },
)
```

#### `onRehydrateStorage`：rehydrate 钩子

监听 rehydrate 完成（成功 / 失败）：

```ts
persist(
  (set) => ({ ... }),
  {
    name: 'app-storage',
    onRehydrateStorage: (state) => {
      console.log('rehydrate started')
      // 返回的函数在 rehydrate 完成后调用
      return (state, error) => {
        if (error) {
          console.error('rehydrate failed:', error)
        } else {
          console.log('rehydrate success:', state)
        }
      }
    },
  },
)
```

**典型用途**：

- 显示「正在恢复用户设置」loading 提示
- 失败时清空 storage（避免下次重复尝试）
- 跨标签同步（监听 storage event）

#### `skipHydration`：手动 rehydrate

默认 `skipHydration: false` —— store 创建时立即从 storage 读取。SSR 场景下需要 `skipHydration: true` + 客户端手动 rehydrate：

```ts
export const useBearStore = create<BearState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'bear-storage',
      skipHydration: true, // 启动时不自动 hydrate
    },
  ),
)

// 客户端某处（如 _app.tsx 或客户端入口）手动 rehydrate：
useBearStore.persist.rehydrate()
```

#### Persist 控制 API

`persist` 包装后的 store 挂载了一组 `persist.xxx` 方法：

| 方法 | 用途 |
|---|---|
| `store.persist.rehydrate()` | 手动 rehydrate（用于 skipHydration 场景） |
| `store.persist.clearStorage()` | 清空 storage（不影响内存中 state） |
| `store.persist.hasHydrated()` | 是否完成 rehydrate（boolean） |
| `store.persist.onHydrate(callback)` | rehydrate 前的回调 |
| `store.persist.onFinishHydration(callback)` | rehydrate 完成回调 |
| `store.persist.getOptions()` | 读取 persist 选项 |
| `store.persist.setOptions(newOptions)` | 修改 persist 选项 |

### `devtools` middleware

集成 Redux DevTools 浏览器扩展——可视化 state / action / 时间旅行。

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useBearStore = create<BearState>()(
  devtools(
    (set) => ({
      bears: 0,
      addBear: () => set(
        (s) => ({ bears: s.bears + 1 }),
        undefined,      // 第二参数：replace（默认 false，shallow merge）
        'bear/addBear', // 第三参数：action name（DevTools 显示）
      ),
    }),
    {
      name: 'BearStore',         // DevTools 中的 store 名
      enabled: true,             // 默认 dev=true, prod=false
      anonymousActionType: 'unknown', // 未命名 action 的默认 type
      actionsDenylist: ['internal/.*'], // 过滤掉这些 action
    },
  ),
)
```

#### action 命名规范

每次 `set` 都建议传第三参数标识 action type：

```ts
// 简单字符串
set({ bears: 1 }, undefined, 'bear/setOne')

// 对象（含 payload）
set(
  (s) => ({ bears: s.bears + 1 }),
  undefined,
  { type: 'bear/increment', by: 1, source: 'button' },
)
```

DevTools 显示：

- 简单：`bear/setOne`
- 对象：`bear/increment` + payload `{ by: 1, source: 'button' }`

#### `actionsDenylist`：过滤敏感 / 高频 action

```ts
devtools(
  (set) => ({
    login: (token) => set({ token }, undefined, 'auth/login'),
    logout: () => set({ token: null }, undefined, 'auth/logout'),
    pingHeartbeat: () => set({ lastPing: Date.now() }, undefined, 'internal/heartbeat'),
  }),
  {
    name: 'AuthStore',
    actionsDenylist: ['internal/.*'], // 隐藏所有 internal/* action
  },
)
```

#### 多 store 一个 DevTools 连接

需要在 DevTools 同一个标签页中看多个 store：

```ts
// 通过 store 选项指定同一个 connection name
const useUserStore = create(
  devtools((set) => ({ ... }), { name: 'App', store: 'user' }),
)
const useCartStore = create(
  devtools((set) => ({ ... }), { name: 'App', store: 'cart' }),
)
// DevTools 中：「App」标签下有 user / cart 两个子 store
```

#### 生产环境

`devtools` 默认在生产环境（`NODE_ENV=production`）自动禁用——可以强制开启：

```ts
devtools(creator, { enabled: true }) // 强制启用（包括生产）
devtools(creator, { enabled: false }) // 强制禁用
```

#### `cleanup`：销毁 store 时清理 DevTools

动态创建 / 销毁 store 的场景（如多 tab 应用）：

```ts
const store = create(devtools((set) => ({ ... })))

// 不再用 store 时
store.devtools.cleanup() // 关闭 DevTools 连接
```

### `immer` middleware

用 [Immer](https://immerjs.github.io/immer/) 库，state 写法变 mutable（内部还是 immutable）：

```bash
pnpm add immer
```

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface PersonState {
  person: { firstName: string; lastName: string; age: number }
  updateFirstName: (name: string) => void
  birthday: () => void
}

export const usePersonStore = create<PersonState>()(
  immer((set) => ({
    person: { firstName: 'Alice', lastName: 'Smith', age: 30 },

    // ✅ immer 包裹后，可以直接 mutate state
    updateFirstName: (name) => set((state) => {
      state.person.firstName = name
      // 不需要展开 ...state、不需要返回新对象
    }),

    birthday: () => set((state) => {
      state.person.age += 1
    }),
  })),
)
```

**对比无 immer 的写法**：

```ts
// 无 immer：嵌套对象必须手动展开
updateFirstName: (name) => set((s) => ({
  person: { ...s.person, firstName: name },
})),

// 有 immer：直接 mutate
updateFirstName: (name) => set((state) => {
  state.person.firstName = name
}),
```

**何时用 immer**？

- 嵌套层级 ≥ 3（`state.a.b.c.d`）
- 数组复杂操作（`push` / `splice` / `sort` / `reverse`）
- 团队习惯 mutable 风格（OOP 背景）

**何时不用 immer**？

- state 几乎都是扁平结构
- 性能敏感（immer 有 ~5x slow down，对大数组慎用）
- bundle size 敏感（immer ~3KB）

### `subscribeWithSelector` middleware

让 `store.subscribe()` 支持 selector（默认 subscribe 接收整个 state）：

```ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useDogStore = create<DogState>()(
  subscribeWithSelector((set) => ({
    paw: true,
    snout: true,
    fur: true,
    setPaw: (v) => set({ paw: v }),
  })),
)

// 不用 subscribeWithSelector：接收整个 state
useDogStore.subscribe((state, prev) => {
  console.log(state)
})

// 用 subscribeWithSelector：可以传 selector + 只在 selected 值变化时触发
const unsub = useDogStore.subscribe(
  (state) => state.paw,           // selector
  (paw, previousPaw) => {         // callback（带 prev 值）
    console.log('paw changed:', previousPaw, '→', paw)
  },
)
```

#### `equalityFn`：自定义比较

```ts
import { shallow } from 'zustand/shallow'

useDogStore.subscribe(
  (state) => [state.paw, state.fur],
  ([paw, fur]) => console.log(paw, fur),
  { equalityFn: shallow }, // 用 shallow 比较数组
)
```

#### `fireImmediately`：立即触发一次

```ts
useDogStore.subscribe(
  (state) => state.paw,
  (paw) => console.log('paw is:', paw),
  { fireImmediately: true }, // 订阅时立即触发一次
)
```

**应用场景**：

- 在 useEffect 内监听 store 变化（不需要组件订阅）
- 跨 store 联动（A 变 → 触发 B 的 action）
- 非 React 上下文（如 Vue / Svelte 应用集成 Zustand）

### `combine` middleware

把 state 和 actions 分开写，自动推导 TypeScript 类型（**v5 不用 curried**）：

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// 不需要 interface、不需要 curried
export const useBearStore = create(
  combine(
    // 第一参数：initial state
    { bears: 0, honey: 0 },
    // 第二参数：actions（set / get 类型自动推导自 initial state）
    (set, get) => ({
      increase: () => set((s) => ({ bears: s.bears + 1 })),
      eatHoney: (amount: number) => set((s) => ({ honey: s.honey - amount })),
    }),
  ),
)

// TypeScript 自动推导 useBearStore 类型为 StoreApi 包裹
// state（bears / honey）与 actions（increase / eatHoney）的交集
```

**优势**：

- 不需要写 interface（小项目 / 简单 state 很方便）
- `set` / `get` 类型自动推导
- v5 中**唯一不需要 curried 写法的 middleware**

**注意**：

- `set` 的内部类型是 `Partial&lt;InitialState&gt;`（不包含 actions）—— 实际上 actions 也在 state 中，但 TS 会「**轻度撒谎**」让类型简化
- `set(initial, true)` 会**删除 actions**（因为 combine 视角下 actions 不在 state 中）
- 复杂 store 还是用 `create&lt;T&gt;()(...)` 标准写法

### Middleware 组合

多个 middleware 嵌套，**顺序很重要**：

```ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export const useBearStore = create<BearState>()(
  devtools(           // 最外层：DevTools 看到所有变化
    persist(
      subscribeWithSelector(
        immer(        // 最内层：immer 包裹原始 creator
          (set) => ({
            bears: 0,
            increase: () => set((state) => { state.bears += 1 }),
          }),
        ),
      ),
      { name: 'bear-storage' },
    ),
    { name: 'BearStore' },
  ),
)
```

**推荐顺序**（从外到内）：

1. `devtools`（最外层 → 看到所有 middleware 后的最终 state）
2. `persist`（中间层 → 持久化最终 state）
3. `subscribeWithSelector` / 其他订阅类
4. `immer`（最内层 → 包裹原始 creator）

## Vanilla Store（非 React）

`zustand/vanilla` 子包提供 `createStore`——不依赖 React，可以在 Worker / Node / 测试 / 跨框架集成中使用：

```ts
// stores/vanillaCounter.ts
import { createStore } from 'zustand/vanilla'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

export const counterStore = createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

返回的对象上有：

| 方法 | 签名 | 用途 |
|---|---|---|
| `getState()` | `() => T` | 读当前 state |
| `getInitialState()` | `() => T` | 读初始 state |
| `setState(partial, replace?)` | `(partial, replace?) => void` 写入 state（详见 reference 章节签名） | 写 state |
| `subscribe(listener)` | `(state, prev) => void` 订阅器签名 | 订阅变化、返回 unsubscribe |

### 用法 1：纯 JS 应用

```ts
import { counterStore } from './stores/vanillaCounter'

// 订阅 + 渲染（如纯 DOM 应用）
const $counter = document.getElementById('counter')!
const render = (state: CounterState) => {
  $counter.textContent = String(state.count)
}
render(counterStore.getState())
counterStore.subscribe(render)

// 触发更新
document.getElementById('btn-inc')!.addEventListener('click', () => {
  counterStore.getState().increment()
})
```

### 用法 2:在 React 组件中用 vanilla store

通过 `useStore` hook 把 vanilla store 接入 React：

```tsx
import { useStore } from 'zustand'
import { counterStore } from '@/stores/vanillaCounter'

