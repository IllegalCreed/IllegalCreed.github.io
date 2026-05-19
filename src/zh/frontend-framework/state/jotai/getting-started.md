---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Jotai 2.x**（最新 **v2.16+**，2024-2026 发布；要求 **React 18+** + **TypeScript 3.8+**，v1 用户请参考底部「v1 → v2 迁移」章节）编写。

## 速查

- 系统要求：**React 18+**（推荐 React 19）+ **TypeScript 3.8+**（可选但强烈推荐 strict 模式）
- 安装：`pnpm add jotai` / `npm install jotai` / `yarn add jotai` / `bun add jotai`
- 创建 atom：`const countAtom = atom(0)` **必须模块级**或用 `useMemo` 包裹
- 读 + 写：`const [count, setCount] = useAtom(countAtom)` 类比 `useState`
- 只读：`const count = useAtomValue(countAtom)` 不返回 setter（避免不必要订阅）
- 只写：`const setCount = useSetAtom(countAtom)` 不订阅值变化（性能更好）
- 派生 atom（只读）：`const doubledAtom = atom((get) => get(countAtom) * 2)`
- 派生 atom（读写）：`atom((get) => ..., (get, set, payload) => ...)`
- 写入 atom：`setCount(5)` 或 `setCount((prev) => prev + 1)`
- 异步 atom：`atom(async (get) => fetch(...).then(r => r.json()))` 配合 Suspense
- Provider 可选：默认全局 store，需要隔离 store 时用 `<Provider store={createStore()}>`
- 模块级声明：**禁止** `function C() { const a = atom(0); useAtom(a) }` ← 每次渲染都创建新 atom → 无限循环
- 命名约定：`xxxAtom`（普通）/ `xxxAtomFamily`（family）/ `useXxx`（封装 hook）
- vanilla store：`createStore` from `jotai` 或 `jotai/vanilla`，非 React 环境可用

## Jotai 是什么

Jotai 是 **React 生态最具代表性的「原子化（atom-based）状态管理库」**——准确地说，它是 **Poimandres**（pmndrs 社区，专注 React 工具链的开源组织）旗下、由 **Daishi Kato** 主导的「**bottom-up 原子组合派**」实现。**Jotai** 这个词来自日语「**状態**（じょうたい）」即「状态」——与 Zustand（德语「状态」）形成「**日德双语 useState**」的双重双关。

- **Jotai 2.x（2023-2026）** 已完全 ESM 优先、要求 React 18+、TypeScript 一等公民
- **Meta 已 archive Recoil**（2024）—— Jotai 是社区认可的最佳迁移目标
- **同团队作品**：[Zustand](https://zustand.docs.pmnd.rs/)（store-based）/ [Valtio](https://valtio.dev/)（mutable proxy）/ [React Three Fiber](https://github.com/pmndrs/react-three-fiber)（R3F）—— Jotai 是其中「**派生 state 最强、依赖追踪最优雅**」的一个

> Jotai 名字来源：日语 **状態（じょうたい）** = 状态。与 Zustand（德语 Zustand = 状态）呼应——Daishi Kato 的双语命名彩蛋。

## Jotai 是「Recoil 替代」不是「Zustand 替代」

理解 Jotai 必须先理解它**和 Zustand / Redux 的根本差异**——它**不是**「另一个 store-based 状态库」、也**不是**「另一个 React Query 风格的数据库」——它是 **Recoil 思想（atom 图 + 自动依赖追踪）的极简且活跃的实现**：

| 维度 | Jotai 2.x | Zustand 5.x | Recoil（archived） | Redux Toolkit | Valtio |
|---|---|---|---|---|---|
| 阵营 | **Poimandres** | Poimandres | Meta（已存档） | React 官方 | Poimandres |
| 心智模型 | **atom 图 + 依赖追踪** | hook 即 store + Flux | atom + selector | reducer + dispatch + slice | mutable proxy |
| atom 标识 | **对象引用** | — | 字符串 key（必须全局唯一） | — | — |
| Provider | **可选**（默认 global store） | 不需要 | 需要 `<RecoilRoot>` | 需要 `<Provider>` | 不需要 |
| 订阅粒度 | **atom 级**（自动） | store 级（手动 selector） | atom 级（自动） | store 级 + useSelector | 属性级（proxy） |
| 派生 state | **派生 atom + `get` 追踪** | selector 函数 | `selector()` | createSelector / reselect | computed proxy |
| Async | **atom + Suspense（一等公民）** | async action（手动 loading） | atom + Suspense | RTK Query | — |
| TypeScript | **优秀**（自动推导） | 优秀（curried） | 一般 | 优秀（RTK 推导） | 一般 |
| Bundle 大小 | **~2-3KB** | ~1KB | ~10KB | ~10KB（含 RTK Query） | ~3KB |
| SSR | 良好（`useHydrateAtoms` + Provider） | 良好（store-per-request） | 不支持 App Router | 良好 | 不支持 |
| DevTools | **jotai-devtools**（atom graph + 时间旅行） | devtools middleware（Redux DevTools） | Recoil DevTools（社区） | Redux DevTools | Valtio DevTools |
| 学习曲线 | **中**（atom 思想需理解） | 平（10 分钟） | 中（atom + selector） | 陡 | 平 |
| 适用规模 | **中大型**（派生 state 多） | 中小型 | 大型（已停止维护） | 大型（严格审计） | 小型 |

**含义**：

- Jotai 解决的是「**派生 state 多 + 跨组件原子共享 + Recoil 接班**」的场景
- 与 Zustand 对比：两者由同一团队维护、**互补**——Zustand 是「单 store + 直观调用」、Jotai 是「atom 图 + 细粒度订阅」；可**同项目混用**（全局 user 用 Zustand、表单局部 state 用 Jotai）
- 与 Recoil 对比：API 思想几乎一致——主要差异是「Jotai 用对象引用代替字符串 key」+「Jotai 活跃维护，Recoil 已 archive」
- 与 Redux Toolkit 对比：RTK 强调严格 reducer / slice + RTK Query；Jotai 强调灵活组合 + 自动依赖追踪——RTK 适合严格审计场景，Jotai 适合派生 state 复杂的中后台
- **不适合**：极小项目（一个 `useState` 能搞定）/ 需要严格 redux time-travel 审计 / 团队 React 经验薄弱（atom 思想需要学习曲线）
- **适合**：表单复杂派生 / 协作画布 / 大量跨组件共享 / Recoil 迁移项目 / 与 TanStack Query 配合的中大型应用

## 安装与首次启动

### 安装

```bash
pnpm add jotai
# 或：npm install jotai / yarn add jotai / bun add jotai
```

React 版本要求：

| Jotai 版本 | React | TypeScript |
|---|---|---|
| **v2** | **React 18+**（推荐 18.2+ / React 19） | TS 3.8+（推荐 5+） |
| v1 | React 16.8+ | TS 3.8+ |

> Jotai v2 已 **drop React 17 支持**——内部使用 React 18 的 `useSyncExternalStore` 保证 Concurrent Mode 下的正确性，且 v2 把 atom 视为 Promise 容器、依赖 React 18 一等公民 promise 支持。如果还在维护 React 17 项目、请继续使用 Jotai v1.x（仅 bug 修复）。

### 不需要 Provider（默认）

与 Recoil 不同，**Jotai 不需要 `<RecoilRoot>` 包裹应用根部**——默认使用**全局 store**（`getDefaultStore()`），import 即用：

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client'
import App from './App'

// 注意：没有任何 <Provider> 包裹（默认全局 store）
createRoot(document.getElementById('root')!).render(<App />)
```

这是 Jotai 与 Recoil / Redux 类库**最大的差异**——你不需要：

- 包 `<RecoilRoot>`
- 在 App 根部初始化 store
- 担心 Provider 嵌套顺序

> **例外**：Next.js App Router / SSR 场景需要 **store-per-request** 模式——这时需要用 `<Provider store={createStore()}>` 配合 `useHydrateAtoms`，详见 [指南 > Next.js 与 SSR](./guide-line.md#nextjs-与-ssr)。

## 第一个 Atom

Jotai 的核心抽象**只有一个**：`atom()`——返回一个 **atom 配置对象**（不持有值、不可变、用对象身份作为唯一标识）。

### Primitive Atom（基础 atom）

最简单的 atom：传入初始值即可。

```ts
// src/atoms/counter.ts
import { atom } from 'jotai'

export const countAtom = atom(0)
export const messageAtom = atom('hello')
export const userAtom = atom({ id: 1, name: 'Alice' })
```

每个 `atom(...)` 返回的对象就是一个独立 atom——**用模块路径（文件名 + export name）作为命名空间即可**，不需要 Recoil 那种字符串 key。

### 派生 Atom（read-only / 只读）

派生 atom 的初始值是个函数：函数接收 `get`（读其它 atom）、返回派生值——**`get` 调用会自动建立依赖**。

```ts
import { atom } from 'jotai'

export const countAtom = atom(10)

// 派生 atom：自动追踪 countAtom 的变化
export const doubledAtom = atom((get) => get(countAtom) * 2)
// doubledAtom 当前值是 20

// 多依赖派生
export const priceAtom = atom(100)
export const taxAtom = atom(0.08)
export const totalAtom = atom((get) => {
  const price = get(priceAtom)
  const tax = get(taxAtom)
  return price * (1 + tax)
})
```

派生 atom 的特点：

- **`get` 调用自动建立依赖**——读 `countAtom` → `doubledAtom` 依赖 `countAtom` → `countAtom` 变化时 `doubledAtom` 重新计算
- **派生 atom 是 read-only**：组件中只能 `useAtomValue`、不能 `useAtom` 解构 setter（没有 setter）
- **派生计算是惰性的**：只有当 atom 被某个组件订阅时、`get` 才执行

### 派生 Atom（read-write / 读写）

读写派生 atom：`atom(readFn, writeFn)` 两参数。

```ts
import { atom } from 'jotai'

const dollarsAtom = atom(10)

// 美元 ↔ 美分双向派生
const centsAtom = atom(
  (get) => get(dollarsAtom) * 100,         // read: 派生 cents
  (get, set, newCents: number) => {
    set(dollarsAtom, newCents / 100)        // write: 转回 dollars
  },
)

// 组件中：
const [cents, setCents] = useAtom(centsAtom)
setCents(500) // 内部会 set(dollarsAtom, 5)
```

`writeFn` 三参数：

- `get` —— 读其它 atom（不建立依赖、只在 write 触发时执行）
- `set` —— 写其它 atom
- `update` —— 调用方传入的负载（这里是 `newCents: number`）

### Write-only Atom（只写 / action atom）

不需要 read 的「**action atom**」——第一个参数传 `null`：

```ts
import { atom } from 'jotai'

const countAtom = atom(0)

// write-only atom：行为类似「dispatch action」
const incrementAtom = atom(
  null,                               // ← 约定：read 部分传 null
  (get, set, _ignored) => {
    set(countAtom, get(countAtom) + 1)
  },
)

// 组件中：
const increment = useSetAtom(incrementAtom)
;<button onClick={increment}>+1</button>
```

write-only atom 是 Jotai 中「**action / command 模式**」的标准实现——把业务逻辑沉淀为 atom、组件只负责触发。

### Async Atom（异步 atom）

read 部分返回 Promise：Jotai 自动配合 Suspense / ErrorBoundary 处理。

```ts
import { atom } from 'jotai'

const userIdAtom = atom(1)

// async atom：read 返回 Promise
const userAtom = atom(async (get) => {
  const id = get(userIdAtom)
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})
```

组件中使用（必须包 `<Suspense>`）：

```tsx
import { Suspense } from 'react'
import { useAtomValue } from 'jotai'

function UserName() {
  // useAtomValue 自动解 Promise（同步返回最终值）
  const user = useAtomValue(userAtom)
  return <div>User: {user.name}</div>
}

export default function App() {
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <UserName />
    </Suspense>
  )
}
```

Jotai async atom 的内部魔法：

- 第一次读取 → throw Promise → React Suspense 捕获 → 显示 fallback
- Promise resolve → React 重新渲染 → `useAtomValue` 返回真实值
- 拿到的就是「**异步加载完成的同步值**」——组件代码看起来跟同步一样

> **`AbortController` 支持**：async atom 的 read 函数第二参数 `{ signal }` 可以传给 fetch——atom 重新计算时上一次请求自动 abort。详见 [指南 > Async atom](./guide-line.md#async-atom-与-suspense)。

## 在组件中使用 Atom

Jotai 提供**三个核心 hook**——`useAtom` / `useAtomValue` / `useSetAtom`——根据需求选择。

### `useAtom`：读 + 写（类比 useState）

`useAtom` 返回 `[value, setter]` 元组，类比 `useState`：

```tsx
import { useAtom } from 'jotai'
import { countAtom } from '@/atoms/counter'

function Counter() {
  const [count, setCount] = useAtom(countAtom)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount((prev) => prev + 1)}>+1 (updater)</button>
    </div>
  )
}
```

setter 的两种形式：

- **直接值**：`setCount(5)` → state = 5
- **updater 函数**：`setCount((prev) => prev + 1)` → 基于上一次 state

> **派生 atom（只读）调用 useAtom**：setter 是 `never` 类型——不要试图调用。建议用 `useAtomValue` 更直观。

### `useAtomValue`：只读（不要 setter）

不需要 setter 时用 `useAtomValue`——意图更清晰、订阅范围更窄：

```tsx
import { useAtomValue } from 'jotai'
import { doubledAtom } from '@/atoms/counter'

function Display() {
  const doubled = useAtomValue(doubledAtom)
  return <p>Doubled: {doubled}</p>
}
```

**何时用 `useAtomValue` 而不是 `useAtom`**？

- 派生 atom（无 setter）→ 必须用 `useAtomValue`
- 只读组件 / 派生计算 / 列表展示
- 代码意图：「我只读、不改」

### `useSetAtom`：只写（不订阅值变化）

只需要写入、不关心值变化时用 `useSetAtom`——**组件不会因 atom 值变化而重渲**：

```tsx
import { useSetAtom } from 'jotai'
import { countAtom, incrementAtom } from '@/atoms/counter'

function IncrementButton() {
  // 组件不订阅 countAtom 的值，只拿到 setter
  const setCount = useSetAtom(countAtom)
  // 也可以拿 write-only atom 的 setter
  const increment = useSetAtom(incrementAtom)

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={increment}>+1 (action)</button>
    </>
  )
}
```

**何时用 `useSetAtom`**？

- 触发按钮 / 表单提交（只写）
- 组件不依赖当前值（如「重置」按钮）
- 性能优化：值变化频繁但组件不关心当前值

### 三件套对比速记

| Hook | 读值 | 订阅值变化 | 写入 | 典型场景 |
|---|---|---|---|---|
| `useAtom` | ✅ | ✅（值变化触发重渲） | ✅ | 类比 `useState`、读写一体 |
| `useAtomValue` | ✅ | ✅ | ❌ | 只读组件、派生 atom 展示 |
| `useSetAtom` | ❌ | ❌（**不触发重渲**） | ✅ | 触发按钮、action atom |

## atom 创建时机（最容易踩的坑）

Jotai 的 atom **必须在组件之外或用 `useMemo` 创建**——因为 atom 用「对象身份」作为唯一标识：

```tsx
// ❌ 错误：组件内直接 atom() —— 每次渲染都创建新 atom → useAtom 看到不同 atom → 无限循环
function BadCounter() {
  const countAtom = atom(0) // ← 每次渲染都是新对象！
  const [count, setCount] = useAtom(countAtom)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

```tsx
// ✅ 正确：模块顶层声明（推荐）
const countAtom = atom(0)

function GoodCounter() {
  const [count, setCount] = useAtom(countAtom)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

```tsx
// ✅ 正确：组件内需要动态 atom 时用 useMemo
function ParametrizedCounter({ initialValue }: { initialValue: number }) {
  // useMemo 保证 atom 引用稳定（除非 initialValue 变化）
  const countAtom = useMemo(() => atom(initialValue), [initialValue])
  const [count, setCount] = useAtom(countAtom)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

> **核心原则**：`atom(...)` 返回的对象必须**引用稳定**——否则 `useAtom` 每次渲染看到的是「不同 atom」，会反复创建 + 销毁、引发无限循环。**默认推荐模块顶层声明**——这也是 Jotai 推荐的标准做法。

## Provider（多 store / 隔离场景）

默认情况下、所有 atom 共享一个**全局 store**（`getDefaultStore()`）。需要隔离时用 `<Provider>`：

### 不需要 Provider 的场景

```tsx
// ✅ 单组件 / 单页应用 / 默认场景
function App() {
  return (
    <>
      <Counter />
      <Display />
    </>
  )
}
// 所有 useAtom(countAtom) 共享同一个 countAtom 值
```

### 需要 Provider 的场景

1. **多个独立 store 子树**：不同 panel / tab 各自维护一份 atom 状态
2. **测试隔离**：每个测试一个 Provider，避免状态污染
3. **SSR**：Next.js / Remix 每次请求一个 store，避免请求间状态泄漏
4. **重置 store**：unmount Provider 即清空所有 atom

```tsx
import { Provider } from 'jotai'

function App() {
  return (
    <>
      {/* 子树 A：独立 store */}
      <Provider>
        <Panel name="A" />
      </Provider>

      {/* 子树 B：另一个独立 store */}
      <Provider>
        <Panel name="B" />
      </Provider>
    </>
  )
}
// Panel A 中的 countAtom 与 Panel B 中的 countAtom 是不同的值
```

### 注入自定义 store

```tsx
import { createStore, Provider } from 'jotai'

const myStore = createStore()
myStore.set(countAtom, 100) // 预设初始值

function App() {
  return (
    <Provider store={myStore}>
      <Counter /> {/* count 一开始是 100 */}
    </Provider>
  )
}
```

> Provider 的完整能力（initialValues / scope 替代方案 / store 注入）见 [指南 > Provider 与 store 隔离](./guide-line.md#provider-与-store-隔离)。

## `set` 与 `get` 在 atom write 中

派生 atom 的 `write` 函数三参数：`(get, set, update)`——

```ts
const heavyAtom = atom(
  (get) => get(countAtom),               // read（建立依赖）
  (get, set, payload: { delta: number }) => {
    const current = get(countAtom)        // ← write 中的 get 不建立依赖
    set(countAtom, current + payload.delta) // ← set 触发 countAtom 更新
    set(logsAtom, (prev) => [...prev, `+${payload.delta}`]) // 可以 set 多个 atom
  },
)
```

**重要差异**：

| 函数 | 在 read 中 | 在 write 中 |
|---|---|---|
| `get(atom)` | **建立依赖**（atom 变化触发重新计算） | **不建立依赖**（只是读取当前值） |
| `set(atom, value)` | 不可用 | 写入 atom |

write 中 `get` 不建立依赖——这是为了避免 write 函数与 read 部分混淆依赖图。

## 异步 Action（write + Promise）

write 函数可以是 async，组件 setter 调用时返回 Promise：

```ts
import { atom } from 'jotai'

const userAtom = atom<{ name: string } | null>(null)
const loadingAtom = atom(false)
const errorAtom = atom<string | null>(null)

// write-only async atom（action）
const fetchUserAtom = atom(
  null,
  async (get, set, userId: number) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    try {
      const res = await fetch(`/api/users/${userId}`)
      const data = await res.json()
      set(userAtom, data)
    } catch (err) {
      set(errorAtom, (err as Error).message)
    } finally {
      set(loadingAtom, false)
    }
  },
)
```

组件中：

```tsx
function UserPanel() {
  const user = useAtomValue(userAtom)
  const loading = useAtomValue(loadingAtom)
  const error = useAtomValue(errorAtom)
  const fetchUser = useSetAtom(fetchUserAtom)

  useEffect(() => {
    fetchUser(1)
  }, [fetchUser])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>
  return <p>User: {user?.name}</p>
}
```

> **建议**：「同步派生」用 read async atom（配合 Suspense）；「命令式触发」（如按钮点击）用 write async atom（手动 loading / error 字段）。详见 [指南 > 派生 atom vs write 模式选择](./guide-line.md#派生-atom-vs-write-模式选择)。

## 外部读写（非 React 场景）

Jotai 提供 vanilla `createStore` + `getDefaultStore` 用于 React 之外：

```ts
import { createStore, getDefaultStore } from 'jotai'
import { countAtom } from '@/atoms/counter'

// 1. 默认 store（与组件中使用 atom 共享同一个）
const store = getDefaultStore()

// 读
console.log(store.get(countAtom))  // 0

// 写
store.set(countAtom, 100)

// 订阅
const unsub = store.sub(countAtom, () => {
  console.log('changed to:', store.get(countAtom))
})
unsub()

// 2. 创建独立 store（用于测试 / SSR / Worker）
const myStore = createStore()
myStore.set(countAtom, 999)
console.log(myStore.get(countAtom)) // 999
```

> **应用场景**：路由守卫读 atom、Web Worker 内读写 atom、单元测试 reset、第三方非 React 库回调中写 atom。

## TypeScript 基础

### 自动推导

`atom(initialValue)` 自动根据初始值推导类型——大多数场景**不需要写泛型**：

```ts
import { atom } from 'jotai'

const numAtom = atom(0)        // PrimitiveAtom<number>
const strAtom = atom('hello')  // PrimitiveAtom<string>
const userAtom = atom({ id: 1, name: 'Alice' }) // PrimitiveAtom<{ id: number; name: string }>
```

### 显式泛型（复杂初始值）

初始为 `null` / 空数组 / 联合类型时**显式标注**：

```ts
interface User {
  id: number
  name: string
}

// ✅ 显式泛型 —— 初始值是 null，让 TS 知道完整类型是 User | null
const currentUserAtom = atom<User | null>(null)

// ✅ 显式泛型 —— 初始值是 []，避免推导为 never[]
const usersAtom = atom<User[]>([])

// ✅ 联合类型
const roleAtom = atom<'guest' | 'admin' | 'user'>('guest')
```

### 派生 atom 类型

派生 atom 的返回类型**自动推导**——不需要显式：

```ts
const countAtom = atom(0)

// 自动推导为 Atom<number>
const doubledAtom = atom((get) => get(countAtom) * 2)

// 显式写也可以：
const tripled: Atom<number> = atom((get) => get(countAtom) * 3)
```

### `useAtom` 元组类型

```ts
const [count, setCount] = useAtom(countAtom)
// count: number
// setCount: SetAtom<[number | ((prev: number) => number)], void>

const [doubled] = useAtom(doubledAtom)
// doubled: number
// 第二个位置是 never（派生 atom 无 setter）

const [user, setUser] = useAtom(currentUserAtom)
// user: User | null
// setUser 接受 User | null 或 updater
```

### `ExtractAtomValue` 提取类型

需要在工具函数 / 测试 / props 中复用 atom 的值类型时：

```ts
import { atom, type ExtractAtomValue } from 'jotai'

const userAtom = atom<User | null>(null)

// 提取 atom 的值类型
export type UserAtomValue = ExtractAtomValue<typeof userAtom>
// UserAtomValue = User | null

function logUser(user: UserAtomValue) {
  if (user) console.log(`User: ${user.name}`)
}
```

### 三大 atom 类型

| 类型 | 适用 | 示例 |
|---|---|---|
| `PrimitiveAtom&lt;T&gt;` | `atom(initialValue)` 创建的可读可写基础 atom | `atom(0)` |
| `Atom&lt;T&gt;` | 只读 atom（基础 atom 的超类） | `atom((get) => ...)` |
| `WritableAtom&lt;Value, Args, Result&gt;` | 派生读写 atom | `atom((get) => ..., (get, set, arg) => ...)` |

> Jotai 的类型系统比 Zustand 直观——基础 atom 写法都不需要泛型、派生类型自动推导。详细类型见 [参考 > TypeScript 类型](./reference.md#typescript-类型)。

## 集成 DevTools（jotai-devtools）

Jotai 有专门的 DevTools 包 [`jotai-devtools`](https://github.com/jotaijs/jotai-devtools)：

```bash
pnpm add -D jotai-devtools
```

```tsx
import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

function App() {
  return (
    <>
      <YourApp />
      {/* DevTools 浮动面板（仅 dev 环境） */}
      <DevTools />
    </>
  )
}
```

DevTools 功能：

- **Atom Graph**：可视化 atom 依赖关系图
- **Snapshot**：拍快照 + 时间旅行回放
- **Inspector**：查看每个 atom 的当前值 + 历史

> 配合 [Babel/SWC 插件](https://github.com/pmndrs/jotai/tree/main/packages/babel) 自动为每个 atom 注入 `debugLabel`：

```ts
// 编译前
const countAtom = atom(0)

// 编译后（自动注入）
const countAtom = atom(0)
countAtom.debugLabel = 'countAtom'
```

详细配置见 [指南 > DevTools 与调试](./guide-line.md#devtools-与调试)。

## 持久化（atomWithStorage）

Jotai 通过 `atomWithStorage` 工具自动持久化到 localStorage：

```ts
import { atomWithStorage } from 'jotai/utils'

// 与 atom(0) 几乎一致 —— 自动同步到 localStorage['count']
export const countAtom = atomWithStorage('count', 0)

// sessionStorage
import { createJSONStorage } from 'jotai/utils'
export const draftAtom = atomWithStorage(
  'draft',
  '',
  createJSONStorage(() => sessionStorage),
)
```

支持：

- localStorage（默认）
- sessionStorage（`createJSONStorage(() => sessionStorage)`）
- AsyncStorage（React Native，需 `getOnInit: true`）
- IndexedDB（用 `idb-keyval` 自定义 storage）
- 自定义（URL hash / cookie 等）

详细配置（getOnInit / subscribe / 自定义 storage）见 [指南 > 持久化](./guide-line.md#持久化-atomwithstorage)。

## v1 → v2 迁移要点

如果你的项目还在 v1，升级到 v2 需要注意：

### 1. async atom 行为变化

v1 的 `get(asyncAtom)` 在派生 atom 内**自动 await**；v2 不再——必须显式 await：

```diff
- const userNameAtom = atom((get) => get(userAtom).name)
+ const userNameAtom = atom(async (get) => {
+   const user = await get(userAtom)
+   return user.name
+ })
```

> 注意：`useAtom(asyncAtom)` 在 v2 仍然自动解 Promise——只有「派生 atom 的 read 函数内部」需要显式 await。

### 2. Provider 移除 `initialValues` 与 `scope`

```diff
- <Provider initialValues={[[countAtom, 10]]}>
-   <App />
- </Provider>
+ <Provider>
+   <HydrateAtoms initialValues={[[countAtom, 10]]}>
+     <App />
+   </HydrateAtoms>
+ </Provider>

// 其中 HydrateAtoms 自定义实现：
function HydrateAtoms({ initialValues, children }) {
  useHydrateAtoms(initialValues)
  return children
}
```

```diff
// scope 移除 → 改用自定义 React Context
- <Provider scope={myScope}>
+ // 自己创建 React Context + 注入 store
+ const MyStoreContext = createContext(createStore())
+ <MyStoreContext.Provider value={myStore}>
+   <Provider store={myStore}>...</Provider>
+ </MyStoreContext.Provider>
```

### 3. 新增 vanilla 子包

```diff
+ import { createStore, getDefaultStore } from 'jotai/vanilla'
+ // 或：import { createStore, getDefaultStore } from 'jotai'
```

### 4. 移除部分 utils

```diff
- import { abortableAtom, waitForAll } from 'jotai/utils'
- const userAtom = abortableAtom(async (get, { signal }) => ...)
+ // abortableAtom 已合并到 atom —— signal 直接来自 atom 第二参数
+ const userAtom = atom(async (get, { signal }) => ...)

- const both = useAtomValue(waitForAll([a, b]))
+ // waitForAll 移除 —— 改用 Promise.all
+ const both = useAtomValue(atom(async (get) => Promise.all([get(a), get(b)])))
```

### 5. WritableAtom 类型签名变化

```diff
- WritableAtom<Value, Update, Result>
+ WritableAtom<Value, Args extends unknown[], Result>
//                    ↑ Update 改为 Args 数组
```

> 完整迁移指南：[Migrating to v2 API](https://jotai.org/docs/guides/migrating-to-v2-api)。

## 完整示例：购物车应用

来一个综合 demo——一个带异步 + 持久化 + 派生计算的购物车：

```ts
// src/atoms/cart.ts
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

// 持久化：items 同步到 localStorage
export const cartItemsAtom = atomWithStorage<CartItem[]>('cart-items', [])

// 持久化：discount 同步到 localStorage
export const discountAtom = atomWithStorage('cart-discount', 0)

// 派生：商品总数
export const itemCountAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, i) => sum + i.quantity, 0),
)

// 派生：小计
export const subtotalAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, i) => sum + i.price * i.quantity, 0),
)

// 派生：合计（含折扣）
export const totalAtom = atom((get) => {
  const sub = get(subtotalAtom)
  const disc = get(discountAtom)
  return sub * (1 - disc)
})

// write-only action：添加商品
export const addItemAtom = atom(
  null,
  (get, set, item: Omit<CartItem, 'quantity'>) => {
    const items = get(cartItemsAtom)
    const existing = items.find((i) => i.id === item.id)
    if (existing) {
      set(
        cartItemsAtom,
        items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      )
    } else {
      set(cartItemsAtom, [...items, { ...item, quantity: 1 }])
    }
  },
)

// write-only action：删除商品
export const removeItemAtom = atom(null, (get, set, id: number) => {
  set(
    cartItemsAtom,
    get(cartItemsAtom).filter((i) => i.id !== id),
  )
})

// write-only async action：结算
export const checkoutAtom = atom(null, async (get, set) => {
  const items = get(cartItemsAtom)
  await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  set(cartItemsAtom, [])
  set(discountAtom, 0)
})
```

组件中使用：

```tsx
// src/components/CartView.tsx
import { useAtomValue, useSetAtom } from 'jotai'
import {
  cartItemsAtom,
  itemCountAtom,
  totalAtom,
  removeItemAtom,
  checkoutAtom,
} from '@/atoms/cart'

function CartView() {
  // 只读 atom 用 useAtomValue
  const items = useAtomValue(cartItemsAtom)
  const itemCount = useAtomValue(itemCountAtom)
  const total = useAtomValue(totalAtom)

  // write-only atom 用 useSetAtom
  const removeItem = useSetAtom(removeItemAtom)
  const checkout = useSetAtom(checkoutAtom)

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
      <button
        onClick={() => checkout()}
        disabled={items.length === 0}
      >
        结算
      </button>
    </div>
  )
}
```

## 下一步

至此你已掌握 Jotai 的基础——**安装**（无需 Provider 即可启动）/ **第一个 atom**（primitive / derived / async / write-only）/ **三大 hook**（`useAtom` / `useAtomValue` / `useSetAtom`）/ **atom 创建时机**（必须模块级或 `useMemo`）/ **Provider 与 store 隔离**（可选）/ **外部读写**（`createStore` / `getDefaultStore`）/ **TypeScript 自动推导** / **DevTools + 持久化** / **v1 → v2 迁移**。

继续学习：

- [指南](./guide-line.md)：**核心**——atom Primitives 全谱（5 种 atom 形态）/ 三大 hook 选用决策 / Provider + 多 store 隔离 / async atom + Suspense + ErrorBoundary + AbortController 完整模式 / 所有 utils（`atomWithStorage` / `atomWithReset` / `atomFamily` / `atomWithDefault` / `loadable` / `unwrap` / `selectAtom` / `splitAtom` / `atomWithReducer` / `atomWithLazy`）/ `useHydrateAtoms` SSR 注水 / `useAtomCallback` 命令式访问 / DevTools + Babel/SWC 插件 / 集成（TanStack Query / Immer / XState）/ Next.js App Router / 测试策略 / 常见踩坑
- [参考](./reference.md)：**API 速查**——所有 `atom` 重载 / `useAtom` / `useAtomValue` / `useSetAtom` / `useStore` / `Provider` / `createStore` / `getDefaultStore` 完整签名 / 所有 utils 选项 / Store API / TypeScript 类型（`Atom` / `PrimitiveAtom` / `WritableAtom` / `Getter` / `Setter` / `ExtractAtomValue`）/ Import 来源速查
