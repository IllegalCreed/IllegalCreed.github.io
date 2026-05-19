---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Zustand 5.x**（最新 **v5.0.13**，2026-05 发布；要求 **React 18+** + **Node 18+** + **TypeScript 5+**，v4 用户请参考底部「v4 → v5 迁移」章节）编写。

## 速查

- 系统要求：**React 18+**（推荐 18.2+ / React 19）+ **Node 18+** + **TypeScript 5+**（可选但强烈推荐）
- 安装：`pnpm add zustand` / `npm install zustand` / `yarn add zustand` / `bun add zustand`
- TypeScript：**v5 必须用 curried 写法** `create<State>()((set) => ...)`（注意多一层 `()`）
- 定义 store：`export const useBearStore = create<BearState>()((set, get) => ({ ... }))`
- store 命名：必须 `useXxxStore`（约定俗成，便于识别）
- 组件中使用：`const bears = useBearStore((s) => s.bears)`（**必须传 selector**，否则全字段订阅触发不必要重渲）
- 多字段 selector：用 `useShallow` 避免对象引用变化导致的重渲（`useBearStore(useShallow((s) => ({ a: s.a, b: s.b })))`）
- 调用 action：`const inc = useBearStore((s) => s.inc); inc()`（也支持 `useBearStore.getState().inc()` 非响应式调用）
- `set` shallow merge：`set({ bears: 1 })` 自动合并、**不需要展开** `{ ...state, bears: 1 }`
- `set` updater 函数：`set((state) => ({ bears: state.bears + 1 }))`（基于上一次状态）
- `set` 覆盖：`set(newState, true)` 第二参数 `true` 完全替换（默认 `false` shallow merge）
- 外部读：`useBearStore.getState().bears`（非 hook、不触发重渲）
- 外部写：`useBearStore.setState({ bears: 99 })`
- 订阅：`const unsub = useBearStore.subscribe(listener); unsub()`
- vanilla store：`createStore` from `zustand/vanilla`（不依赖 React、用于 Worker / Node / 非 React 项目）
- Middleware：`devtools` / `persist` / `immer` / `subscribeWithSelector` / `combine` / `redux` from `zustand/middleware`

## Zustand 是什么

Zustand 是 **React 生态最流行的「轻量级 hook-based」状态管理库**——准确地说，它是 **Poimandres**（pmndrs 社区，专注 React 工具链的开源组织）旗下、由 **Daishi Kato** 主导的「**简化版 Flux**」实现。Zustand 这个词在德语里就是「**状态**」的意思——这是个跟 React 的「英文状态」形成「双语 useState」的小巧妙双关。

- **React 官方文档** 在 [Choosing a State Management Library](https://react.dev/learn/managing-state) 章节明确推荐 Zustand
- **npm 下载量**：~5M / week（2026 年），已**超过 Redux Toolkit** 成为 React 状态库下载量第一
- **Zustand 5.x（2024-2026）** 已完全 ESM 优先、要求 React 18+、TypeScript 一等公民
- **同团队作品**：[Jotai](https://jotai.org/)（atom 派）/ [Valtio](https://valtio.dev/)（mutable proxy 派）/ [React Three Fiber](https://github.com/pmndrs/react-three-fiber)（R3F）/ [React Spring](https://react-spring.dev/)（动画）—— Zustand 是其中「最直觉、最轻量」的一个

> Zustand 名字来源：德语 **Zustand**（发音 /ˈt͡suːʃtant/）= 状态。与 React 的 `useState` 形成「英德双语状态」对照——这是 Daishi Kato 起名时的小俏皮。

## Zustand 是「简化版 Flux」不是「下一个 Redux」

理解 Zustand 必须先理解它**和 Redux 的根本差异**——它**不是**「重新发明的 Flux」「mobx 风格的响应式 store」「单 store + reducer 的 Redux 翻版」——它是**Flux 思想去掉所有样板代码后的最小可用实现**：

| 维度 | Zustand 5.x | Redux Toolkit | Jotai | Valtio | Recoil | Pinia (Vue) |
|---|---|---|---|---|---|---|
| 阵营 | **Poimandres** | React 官方 | Poimandres | Poimandres | Meta（已存档） | Vue 官方 |
| 心智模型 | **hook 即 store + Flux** | reducer + dispatch + slice | atom 依赖图 | mutable proxy | atom + selector | 多 store（无 mutation） |
| Provider | **不需要** | 需要（`<Provider>`） | 需要（`<JotaiProvider>`） | 不需要 | 需要 | 需要（`createPinia`） |
| Mutation | **直接 set（shallow merge）** | createSlice reducer | atom 的 setter | 直接 `state.x = ...` | atom 的 setter | 直接 mutate / `$patch` |
| 模块化 | 单 store + slice 拼接 | slice + combineReducer | 每 atom 独立 | proxy 实例独立 | atom 独立 | 每 store 独立 |
| 选择器优化 | **手动 selector + useShallow** | useSelector 手动 | atom 自动依赖追踪 | 属性访问追踪 | atom 自动依赖追踪 | `storeToRefs` 手动 |
| TypeScript | **优秀**（curried + StateCreator） | 优秀（RTK 推导） | 优秀 | 一般 | 一般 | 优秀 |
| Bundle 大小 | **~1KB** | ~10KB（含 RTK Query） | ~3KB | ~3KB | ~10KB | ~1.5KB |
| SSR | 良好（store-per-request） | 良好 | 良好 | 不支持 | 不支持 | 良好（@pinia/nuxt） |
| DevTools | **devtools middleware**（Redux DevTools） | Redux DevTools | Jotai DevTools | Valtio DevTools | Redux DevTools | Vue DevTools 7 |
| 学习曲线 | **极平**（10 分钟上手） | 陡（thunk / slice / RTK Query） | 中（atom + selector） | 平（mutable 直觉） | 中（atom + selector） | 平 |
| 适用规模 | **中小型（1-100 store 字段）** | 大型（100+ 字段、严格审计） | 中型（派生 state 多） | 小型（简单 UI 状态） | 大型（已停止维护） | 所有规模 Vue 项目 |

**含义**：

- Zustand 解决的是「**Redux 样板代码 + Provider 嵌套地狱 + namespacing 心智负担**」三大痛点
- 与 Pinia 对比：两者「**心智模型几乎一致**」（单 store / 直接 mutate / Composition-style action）——主要差异是「Zustand 是 React 专属、Pinia 是 Vue 专属」+「Zustand 没有 Provider、Pinia 用 `createPinia()` 注册」
- 与 Redux Toolkit 对比：RTK 强调「严格单向数据流 + slice + RTK Query 一体化」；Zustand 强调「极简心智 + 自由组合」——RTK 适合金融 / 医疗等严格审计场景，Zustand 适合 99% 的普通 React 项目
- 与 Jotai 对比：两者是 Poimandres 同一团队**互补**的两条路径——Jotai 是「**atom 派**」（细粒度依赖、组合式）、Zustand 是「**store 派**」（直观调用、单一全局状态）；可以**同一项目混用**（如 form state 用 Jotai atom、全局 user 用 Zustand store）
- **不适合**：跨框架共享（Zustand 是 React 专属、虽然 vanilla store 可在 Node / Worker 用、但 React 组件中不能直接迁移到 Vue 组件）、严格 redux time-travel 审计场景（用 RTK）
- **适合**：90% 的 React 项目——这不是吹捧、是 React 官方明文推荐的**新主流**

## 安装与首次启动

### 安装

```bash
pnpm add zustand
# 或：npm install zustand / yarn add zustand / bun add zustand
```

React 版本要求：

| Zustand 版本 | React | TypeScript |
|---|---|---|
| **v5** | **React 18+** | TS 5+ |
| v4 | React 16.8+ | TS 4+ |
| v3 | React 16.8+ | TS 4+ |

> Zustand v5 已**正式 drop React 17 支持**——内部使用 `useSyncExternalStore`（React 18 内置 API）保证 Concurrent Mode 下的正确性。如果还在维护 React 17 项目，请继续使用 Zustand v4.x（仅 bug 修复、不再新增特性）。

### 不需要 Provider

与 Redux / Recoil / Jotai 不同，**Zustand 不需要在应用根部注入任何 Provider**——store 本身就是一个 hook，import 即可使用：

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client'
import App from './App'

// 注意：没有任何 <Provider> 包裹
createRoot(document.getElementById('root')!).render(<App />)
```

这是 Zustand 与所有 Redux 类库**最大的差异**——你不需要：

- ❌ 包 `<Provider store={...}>`
- ❌ 在 App 根部初始化 store
- ❌ 担心 Provider 嵌套顺序

> **例外**：Next.js App Router / SSR 场景需要 **store-per-request** 模式——这时需要用 vanilla store + React Context，详见 [指南 > Next.js 集成](./guide-line.md#nextjs-与-ssr)。

## 第一个 Store

Zustand 的 store 定义**只有一种语法**：`create((set, get) => ({ ...state, ...actions }))`——返回的是一个 React Hook（约定命名为 `useXxxStore`）。

### JavaScript 版

```js
// src/stores/bearStore.js
import { create } from 'zustand'

export const useBearStore = create((set) => ({
  // state
  bears: 0,
  honey: 0,

  // actions（与 state 写在一起，称为「colocated actions」）
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  eatHoney: (amount) => set((state) => ({ honey: state.honey - amount })),
}))
```

### TypeScript 版（v5 必须 curried 写法）

```ts
// src/stores/bearStore.ts
import { create } from 'zustand'

// 定义 state + actions 类型
interface BearState {
  bears: number
  honey: number
  increasePopulation: () => void
  removeAllBears: () => void
  eatHoney: (amount: number) => void
}

// 注意：v5 必须写 create<BearState>()((set) => ...) —— 多一层 ()
export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  honey: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  eatHoney: (amount) => set((state) => ({ honey: state.honey - amount })),
}))
```

### 为什么 v5 必须 curried 写法

TypeScript 的「**泛型 invariance**」限制——直接 `create<BearState>((set) => ...)` 时 TS 无法同时让 `T` 既向外 return（covariant）又通过 `get` 接收（contravariant）。详细原理见 [Advanced TypeScript 章节](./guide-line.md#typescript-高级类型)。

简记结论：

```ts
// ❌ v4 写法在 v5 TS 中报错
create<BearState>((set) => ({ ... }))

// ✅ v5 正确写法（额外的 () 是「类型工厂」帮 TS 推导）
create<BearState>()((set) => ({ ... }))

// ✅ 不用泛型时（JS 或 combine 推导）可以省略
create((set) => ({ ... }))
```

### Store id 不需要

与 Pinia / Redux Toolkit slice 不同，Zustand **不需要 store id**——每个 `create()` 调用返回一个独立的 hook，模块路径本身就是 id。

```ts
// ✅ 推荐：每个 store 一个文件，文件名即 store 名
// src/stores/bearStore.ts
// src/stores/userStore.ts
// src/stores/cartStore.ts

// ❌ 不推荐：多个 store 写在同一个文件
```

### 函数命名约定

返回的 hook **必须**以 `useXxxStore` 命名：

```ts
export const useBearStore = create<BearState>()(...)  // ✅
export const bearStore = create<BearState>()(...)     // ❌ 违反 hooks 命名（必须 use 开头）
export const useBear = create<BearState>()(...)       // ⚠️ 缺少 Store 后缀（也能用、但不规范）
```

> 「**use 前缀**」是 React Hooks 命名规范——非 hook 写法会触发 ESLint `react-hooks/rules-of-hooks` 报错。

## 在组件中使用 Store

### 基本读取（必须传 selector）

**在组件中调用 hook + 传入 selector**：

```tsx
// src/components/BearCounter.tsx
import { useBearStore } from '@/stores/bearStore'

function BearCounter() {
  // ✅ 推荐：用 selector 只订阅需要的字段
  const bears = useBearStore((state) => state.bears)

  return <h1>{bears} bears around here ...</h1>
}
```

### 为什么必须传 selector

不传 selector 时，**任意字段变化都会触发组件重渲**：

```tsx
// ❌ 全字段订阅 —— 任何字段变化都重渲
function BadCounter() {
  const state = useBearStore() // 等价于 useBearStore((s) => s)
  return <h1>{state.bears}</h1>
}

// ❌ 上面这种写法的问题：
// - state.honey 变化 → BadCounter 也会重渲（即使没用到 honey）
// - 性能浪费 + 不可控
```

```tsx
// ✅ selector 精准订阅 —— 只有 state.bears 变化时才重渲
function GoodCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears}</h1>
}
```

> **核心原则**：**永远写 selector**——这是 Zustand 与 Pinia `storeToRefs` 不同之处。Pinia 解构是默认丢响应式、需要 `storeToRefs` 救回来；Zustand 不写 selector 是默认订阅整个 store、需要 selector 来精简。

### 多个 selector vs 单个对象 selector

需要读多个字段时，**不要返回对象** —— 直接调用多次 hook：

```tsx
// ✅ 推荐：多次 useBearStore + 每次一个字段
function Dashboard() {
  const bears = useBearStore((state) => state.bears)
  const honey = useBearStore((state) => state.honey)
  const increase = useBearStore((state) => state.increasePopulation)

  return <div>{bears} bears, {honey} honey <button onClick={increase}>+1</button></div>
}
```

```tsx
// ❌ 不推荐：对象 selector 默认每次都是新引用 → 触发重渲
function Dashboard() {
  const { bears, honey, increase } = useBearStore((state) => ({
    bears: state.bears,
    honey: state.honey,
    increase: state.increasePopulation,
  }))
  // 每次 store 变化都返回新对象 { bears, honey, increase } → 即使值不变也触发重渲
  return <div>...</div>
}
```

### 对象 selector 的正确写法：`useShallow`

如果一定要返回对象（如要解构使用），**必须包 `useShallow`** 才能用浅比较避免重渲：

```tsx
import { useBearStore } from '@/stores/bearStore'
import { useShallow } from 'zustand/react/shallow'

function Dashboard() {
  // ✅ useShallow 包裹 → 用 shallow 比较代替默认的 Object.is
  const { bears, honey, increase } = useBearStore(
    useShallow((state) => ({
      bears: state.bears,
      honey: state.honey,
      increase: state.increasePopulation,
    })),
  )

  return <div>{bears} bears, {honey} honey <button onClick={increase}>+1</button></div>
}
```

`useShallow` 也支持**数组解构**：

```tsx
// 数组 selector + 解构
const [bears, honey] = useBearStore(
  useShallow((state) => [state.bears, state.honey]),
)
```

`useShallow` 还支持**派生字段** —— `Object.keys` / `filter` / `map` 等：

```tsx
const bearNames = useBearStore(
  useShallow((state) => Object.keys(state.bearMap)),
)
// 只有 bearMap 的 keys 变化时才重渲，bearMap 内部值变化不触发
```

> **v4 vs v5**：v4 的 `useBearStore((s) => ..., shallow)` 第二参数 shallow 在 v5 中**已被移除**——必须用 `useShallow` hook。详见底部 v4 → v5 迁移章节。

### 调用 action

action 也通过 selector 读取——**注意 selector 必须返回函数本身**（不是函数调用结果）：

```tsx
function Controls() {
  // ✅ selector 返回函数引用（不是调用）
  const increasePopulation = useBearStore((state) => state.increasePopulation)

  return <button onClick={increasePopulation}>one up</button>
}
```

```tsx
// ❌ 错误：selector 内执行了函数 → 每次重渲都执行 increasePopulation
function BadControls() {
  const bears = useBearStore((state) => state.increasePopulation()) // 触发循环更新！
  return <button>...</button>
}
```

### 完整示例：Bear Counter 应用

```tsx
// src/components/BearApp.tsx
import { useBearStore } from '@/stores/bearStore'
import { useShallow } from 'zustand/react/shallow'

function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears around here ...</h1>
}

function HoneyJar() {
  const honey = useBearStore((state) => state.honey)
  return <p>Honey in jar: {honey}</p>
}

function Controls() {
  // 多个 action 用 useShallow 解构
  const { increase, removeAll, eatHoney } = useBearStore(
    useShallow((state) => ({
      increase: state.increasePopulation,
      removeAll: state.removeAllBears,
      eatHoney: state.eatHoney,
    })),
  )

  return (
    <div>
      <button onClick={increase}>add bear</button>
      <button onClick={removeAll}>kill all</button>
      <button onClick={() => eatHoney(5)}>eat 5 honey</button>
    </div>
  )
}

export default function BearApp() {
  // 注意：根组件不需要 Provider —— 这是 Zustand 的核心特性
  return (
    <div>
      <BearCounter />
      <HoneyJar />
      <Controls />
    </div>
  )
}
```

## `set` 函数详解

### Shallow Merge（默认行为）

`set` 默认对返回的对象做 **shallow merge**——不需要展开 `...state`：

```ts
create((set) => ({
  bears: 0,
  honey: 0,
  // ✅ 简洁：只写要更新的字段，其他自动保留
  increase: () => set({ bears: 1 }),
  // 等价于（但啰嗦）：
  // increase: () => set((state) => ({ ...state, bears: 1 })),
}))
```

调用 `increase()` 后：state = `{ bears: 1, honey: 0, increase: fn }`（**honey 和 actions 都保留**）。

> **重要**：shallow merge 只在**顶层**——嵌套对象不会自动合并：
>
> ```ts
> // state: { user: { name: 'Eduardo', age: 30 } }
> set({ user: { age: 31 } })
> // → state: { user: { age: 31 } }，name 字段消失！
>
> // 正确写法：手动展开
> set((state) => ({ user: { ...state.user, age: 31 } }))
> ```

### Updater 函数（基于上一次 state）

需要基于当前 state 计算下一次时，**用函数形式**：

```ts
create((set) => ({
  bears: 0,
  // ✅ 基于上一次 state.bears 计算
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

为什么不能 `set({ bears: state.bears + 1 })`？因为闭包捕获的 `state` 可能过期（多次连续调用时）。

### `replace` 参数（完全覆盖）

`set` 的第二个参数 `false` 默认 shallow merge——传 `true` 完全替换 state：

```ts
create((set) => ({
  bears: 0,
  honey: 0,
  // ⚠️ 完全替换：删除 honey、删除 actions
  reset: () => set({ bears: 0 }, true),
  // → state = { bears: 0 } —— 注意 actions 也丢了！
}))
```

> **慎用 `replace: true`**——会把 actions 一起删掉。除非真的要清空整个 store（如 logout 场景），否则用 `reset` 模式（见 [指南 > `$reset` 模式](./guide-line.md#reset-模式)）。

## `get` 函数：在 action 中读 state

`create` 的第二个参数是 `get`——在 action 内部读取当前 state（不是闭包中的旧值）：

```ts
create((set, get) => ({
  sound: 'grunt',
  bears: 0,

  action: () => {
    // ✅ 用 get() 读最新 state
    const currentSound = get().sound
    console.log('Current sound:', currentSound)

    set({ sound: 'roar' })
  },

  // 也可以用 set 的函数形式访问 state（推荐）
  betterAction: () => {
    set((state) => {
      console.log('Current sound:', state.sound) // 同 get().sound
      return { sound: 'roar' }
    })
  },
}))
```

**何时用 `get` vs `set(fn)`**？

- **读 + 写一起**：用 `set((state) => ...)`，更聚合
- **只读不写 + 在 action 内**：用 `get()`，更直观
- **跨 store 调用**：必须用 `get()`（store 外）

## 异步 Action

Zustand 对 async action **零特殊处理**——`async / await` 自由组合：

```ts
import { create } from 'zustand'

interface FishState {
  fishes: Record<string, number>
  loading: boolean
  error: string | null
  fetchFishes: (pond: string) => Promise<void>
}

export const useFishStore = create<FishState>()((set) => ({
  fishes: {},
  loading: false,
  error: null,

  fetchFishes: async (pond) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(pond)
      const data = await response.json()
      set({ fishes: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))
```

组件中使用：

```tsx
function FishList() {
  const { fishes, loading, error, fetchFishes } = useFishStore(
    useShallow((s) => ({
      fishes: s.fishes,
      loading: s.loading,
      error: s.error,
      fetchFishes: s.fetchFishes,
    })),
  )

  useEffect(() => {
    fetchFishes('/api/fishes/pond-1')
  }, [fetchFishes])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>
  return <ul>{Object.entries(fishes).map(([name, count]) => <li key={name}>{name}: {count}</li>)}</ul>
}
```

## 外部读写 Store（非组件场景）

Store hook 本身挂载了**非 React 工具方法**——可以在 React 之外读写：

```ts
// 路由守卫 / 工具函数 / Web Worker / 测试 内都能用
import { useBearStore } from '@/stores/bearStore'

// 1. 读 state（非响应式 / 不触发重渲）
const currentBears = useBearStore.getState().bears
console.log('Current bears:', currentBears)

// 2. 写 state（会触发组件重渲）
useBearStore.setState({ bears: 100 })
useBearStore.setState((state) => ({ bears: state.bears + 1 }))

// 3. 读初始 state（store 创建时的初始值，常用于 reset）
const initial = useBearStore.getInitialState()

// 4. 订阅变化（每次 state 变化触发回调）
const unsub = useBearStore.subscribe((state, prevState) => {
  console.log('Bears changed:', prevState.bears, '→', state.bears)
})

// 取消订阅
unsub()
```

> **应用场景**：路由守卫读 `useUserStore.getState().isAuthenticated`、Web Worker 内读 store、单元测试 reset state、第三方非 React 库回调中写 state。

## TypeScript 基础

### 安装

```bash
pnpm add -D typescript @types/react @types/react-dom
```

`tsconfig.json` 推荐配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve"
  }
}
```

### State + Action 接口

`create<T>()(fn)` 中的 `T` 是 state + actions 的完整类型：

```ts
import { create } from 'zustand'

// 模式 1：state + actions 合并到一个 interface
interface BearState {
  // state
  bears: number
  food: string
  // actions
  increase: (by: number) => void
  feed: (food: string) => void
}

export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  food: 'honey',
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  feed: (food) => set({ food }),
}))

// 模式 2：state / actions 分开（更清晰）
interface BearState {
  bears: number
  food: string
}

interface BearActions {
  increase: (by: number) => void
  feed: (food: string) => void
}

export const useBearStore = create<BearState & BearActions>()((set) => ({
  bears: 0,
  food: 'honey',
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  feed: (food) => set({ food }),
}))
```

### `ExtractState` 提取 state 类型

需要在测试 / 工具函数 / props 类型中复用 store 类型时，用 `ExtractState`：

```ts
import { create, type ExtractState } from 'zustand'

export const useBearStore = create<BearState>()((set) => ({ ... }))

// 提取完整 store 类型
export type BearStoreState = ExtractState<typeof useBearStore>

// 在测试中：
const snapshot: BearStoreState = useBearStore.getState()
expect(snapshot.bears).toBeGreaterThanOrEqual(0)

// 在工具函数中：
function logBears(state: BearStoreState) {
  console.log(`We have ${state.bears} bears eating ${state.food}`)
}
```

### `StateCreator` 类型

`create` 的回调函数类型是 `StateCreator<T>`——可以单独定义、便于拆分：

```ts
import { create, type StateCreator } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
}

// 单独定义 state creator（便于做 slice 拆分、测试 mock）
const bearStateCreator: StateCreator<BearState> = (set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
})

export const useBearStore = create<BearState>()(bearStateCreator)
```

### 复杂类型：数组 / 联合类型 / null

初始为 `null` / 空数组 / 联合类型时**手动断言**：

```ts
interface User {
  id: number
  name: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  role: 'guest' | 'admin' | 'user'
}

export const useUserStore = create<UserState>()((set) => ({
  users: [],                // 自动推导 User[]（因为 interface 已声明）
  currentUser: null,
  role: 'guest',
}))
```

如果没用 interface 而是依赖 inference（推导）：

```ts
// 不推荐：依赖推导 → 容易拿到 never[] 或过窄类型
export const useUserStore = create((set) => ({
  users: [] as User[],          // 必须 as 否则推导为 never[]
  currentUser: null as User | null, // 必须 as 否则推导为 null
}))
```

## 启用 Redux DevTools

包一个 `devtools` middleware 即可——可视化所有 action / 时间旅行：

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

export const useBearStore = create<BearState>()(
  devtools(
    (set) => ({
      bears: 0,
      // ⚠️ 第三个参数是 action name（DevTools 显示用）
      increase: () => set(
        (state) => ({ bears: state.bears + 1 }),
        undefined,
        'bear/increase',
      ),
    }),
    { name: 'BearStore' }, // DevTools 显示的 store 名
  ),
)
```

详细配置见 [指南 > devtools middleware](./guide-line.md#devtools-middleware)。

## 持久化（localStorage）

包一个 `persist` middleware 让 state 在刷新 / 关闭页面后仍保留：

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: () => void
}

export const useBearStore = create<BearState>()(
  persist(
    (set) => ({
      bears: 0,
      increase: () => set((state) => ({ bears: state.bears + 1 })),
    }),
    {
      name: 'bear-storage',                              // localStorage key
      storage: createJSONStorage(() => localStorage),    // 默认 localStorage，可改 sessionStorage
    },
  ),
)
```

详细配置（partialize / version / migrate / skipHydration）见 [指南 > persist middleware](./guide-line.md#persist-middleware)。

## v4 → v5 迁移要点

如果你的项目还在 v4，升级到 v5 需要注意：

### 1. TypeScript 必须 curried 写法

```diff
- create<BearState>((set) => ({ ... }))
+ create<BearState>()((set) => ({ ... }))   // 多一层 ()
```

### 2. `shallow` 第二参数移除

```diff
  import { shallow } from 'zustand/shallow'
  import { useShallow } from 'zustand/react/shallow'

- const { a, b } = useBearStore((s) => ({ a: s.a, b: s.b }), shallow)
+ const { a, b } = useBearStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

### 3. `createWithEqualityFn` 移到 `zustand/traditional`

如果要用自定义 equality 函数（不只是 shallow）：

```diff
- import { create } from 'zustand'
- const useStore = create(creator, customEqualityFn)
+ import { createWithEqualityFn } from 'zustand/traditional'
+ const useStore = createWithEqualityFn(creator, customEqualityFn)
```

### 4. React 17 不再支持

升级 React 到 18+。

### 5. Mutating state 必须返回（v5 严格）

```diff
- set((state) => { state.bears += 1 })   // 不再 work（v5 是 immer 包裹才行）
+ set((state) => ({ bears: state.bears + 1 }))
```

> 完整迁移指南：[Migrating to v5](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)。

## 完整示例：购物车应用

来一个综合 demo——一个带异步 + persist + devtools 的购物车：

```ts
// src/stores/cartStore.ts
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  discount: number
  loading: boolean

  // 派生 getter 写成 selector（见 reference）
  // 派生值：itemCount / subtotal / total（在组件中用 selector）

  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number) => void
  setQuantity: (id: number, quantity: number) => void
  checkout: () => Promise<void>
  reset: () => void
}

const initialState = {
  items: [] as CartItem[],
  discount: 0,
  loading: false,
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addItem: (item) => set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }, undefined, 'cart/addItem'),

        removeItem: (id) => set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }), undefined, 'cart/removeItem'),

        setQuantity: (id, quantity) => set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i,
          ),
        }), undefined, 'cart/setQuantity'),

        checkout: async () => {
          set({ loading: true }, undefined, 'cart/checkoutStart')
          const items = get().items
          try {
            await fetch('/api/checkout', {
              method: 'POST',
              body: JSON.stringify({ items }),
            })
            set({ ...initialState }, false, 'cart/checkoutSuccess')
          } catch {
            set({ loading: false }, false, 'cart/checkoutError')
          }
        },

        reset: () => set(initialState, false, 'cart/reset'),
      }),
      {
        name: 'cart-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // 只持久化 items 和 discount，不持久化 loading
          items: state.items,
          discount: state.discount,
        }),
      },
    ),
    { name: 'CartStore' },
  ),
)
```

组件中使用：

```tsx
// src/components/CartView.tsx
import { useCartStore } from '@/stores/cartStore'
import { useShallow } from 'zustand/react/shallow'

function CartView() {
  // state + actions 解构（useShallow 防多字段重渲）
  const { items, discount, loading, addItem, removeItem, checkout } = useCartStore(
    useShallow((s) => ({
      items: s.items,
      discount: s.discount,
      loading: s.loading,
      addItem: s.addItem,
      removeItem: s.removeItem,
      checkout: s.checkout,
    })),
  )

  // 派生值用 selector 计算（也可以在 store 中存）
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  )
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  )
  const total = subtotal * (1 - discount)

  return (
    <div>
      <h2>购物车（{itemCount} 件）</h2>
      {items.length === 0 ? (
        <p>购物车为空</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} × {item.quantity} —— ￥{item.price * item.quantity}
              <button onClick={() => removeItem(item.id)}>删除</button>
            </li>
          ))}
        </ul>
      )}
      <p>合计：￥{total.toFixed(2)}</p>
      <button onClick={checkout} disabled={items.length === 0 || loading}>
        {loading ? '结算中...' : '结算'}
      </button>
    </div>
  )
}
```

## 下一步

至此你已掌握 Zustand 的基础——**安装** / **第一个 store**（curried TS 写法）/ **组件中使用**（selector + useShallow）/ **`set` shallow merge** / **`get` 读 state** / **异步 action** / **外部读写 API**（`getState` / `setState` / `subscribe`）/ **TypeScript 基础**（`ExtractState` / `StateCreator`）/ **DevTools + Persist** / **v4 → v5 迁移**。

继续学习：

- [指南](./guide-line.md)：**核心**——State 设计原则 / 选择器深度优化（`useShallow` vs `shallow` / `createWithEqualityFn` / auto-generating selectors）/ Middleware 详解（`persist` 完整 API + 多策略持久化、`devtools` actionsDenylist、`immer` 嵌套 mutable 写法、`subscribeWithSelector` fireImmediately、`combine` 自动推导、`redux`）/ Slice 模式拆大 store / vanilla store（Web Worker / Node）/ SSR + Next.js App Router 集成（store-per-request + Provider 模式）/ 测试（Jest / Vitest auto-mock + reset）/ React 18 Concurrent Features 协同 / Map / Set 特殊处理 / `$reset` 模式 / 常见踩坑
- [参考](./reference.md)：**API 速查**——所有 `create` / `createStore` / `useStore` / `useStoreWithEqualityFn` / `createWithEqualityFn` / `useShallow` / `shallow` / `subscribeWithSelector` / 所有 middleware 完整签名 + 选项 / Store API 方法 / TypeScript 类型（`StateCreator` / `UseBoundStore` / `StoreApi` / `Mutator`） / Import 来源速查
