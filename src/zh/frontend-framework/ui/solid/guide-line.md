---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Solid 1.9.x / SolidStart 1.1.x / Solid Router 0.15.x 编写 —— Signals / Stores / 控制流 / 生命周期 / Context / 自定义指令 / SolidStart / Router / TypeScript / 编译器优化 / 测试 / 性能 / 对比

## 响应式核心：四大原语

Solid 响应式系统建立在四个原语之上，所有其他 API 都是它们的组合：

| 原语 | 作用 | 类比 |
|---|---|---|
| `createSignal` | 响应式状态（getter + setter） | React `useState` / Vue `ref` |
| `createMemo` | 派生值（带缓存） | React `useMemo` / Vue `computed` |
| `createEffect` | 副作用（自动追踪依赖） | React `useEffect` / Vue `watchEffect` |
| `createResource` | 异步资源（与 Suspense 集成） | React `use(promise)` |

### `createSignal` 完整签名

```tsx
import { createSignal } from 'solid-js'
import type { Setter, Accessor } from 'solid-js'

// 基础
const [count, setCount] = createSignal(0)

// 类型显式
const [user, setUser] = createSignal<User | null>(null)

// 函数式更新
setCount(c => c + 1)

// 自定义相等性
const [arr, setArr] = createSignal([1, 2, 3], {
  equals: (prev, next) => prev.length === next.length,
})

// 永远更新（即使值相等）
const [tick, setTick] = createSignal(0, { equals: false })

// 命名（dev tools 显示）
const [score, setScore] = createSignal(100, { name: 'score' })
```

### `createMemo` 完整签名

```tsx
import { createMemo } from 'solid-js'

const [count, setCount] = createSignal(0)
const [factor, setFactor] = createSignal(2)

// 自动追踪 count + factor
const product = createMemo(() => count() * factor())

// 显式初始值（首次 prev 是它）
const sum = createMemo((prev) => prev + count(), 0)

// 自定义相等性 / 名称
const expensive = createMemo(
  () => doHeavyWork(count()),
  undefined,
  { equals: deepEqual, name: 'expensive' },
)
```

### `createEffect` 完整签名

```tsx
import { createEffect, onCleanup, untrack } from 'solid-js'

createEffect(() => {
  console.log(count())
})

// 上次值（首次 prev 是 undefined 或 initial）
createEffect<number>((prev) => {
  console.log('count from', prev, 'to', count())
  return count()
}, 0)

// 跳过追踪
createEffect(() => {
  // count() 被追踪
  const c = count()
  // untrack 内部不追踪
  untrack(() => {
    console.log(unrelated())   // 访问但不订阅
  })
})

// 清理（异步 abort / 移除监听 / 销毁 timer）
createEffect(() => {
  const id = setInterval(() => console.log(count()), 1000)
  onCleanup(() => clearInterval(id))
})
```

::: tip `createEffect` 立刻同步执行
不像 React `useEffect` 在 commit 后异步执行，Solid `createEffect` 在「**当前响应式系统更新结束后**」立即跑——这意味着 DOM 已挂上、ref 已赋值。第一次执行时其内部的 signal 会被追踪进依赖。
:::

### `createResource` 完整签名

```tsx
import { createResource } from 'solid-js'

// 无 source（手动 refetch 才重跑）
const [users] = createResource(async () => {
  const res = await fetch('/api/users')
  return res.json()
})

// 有 source（source 变化触发 fetcher）
const [userId, setUserId] = createSignal(1)
const [user] = createResource(userId, async (id) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
})

// 第二返回值含 mutate / refetch
const [posts, { mutate, refetch }] = createResource(async () => {
  return fetch('/api/posts').then(r => r.json())
})

// 状态字段
posts()             // 当前值
posts.loading       // boolean
posts.error         // Error | undefined
posts.state         // 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'
posts.latest        // 最后一次成功值（refresh 期间用这个不闪烁）

// mutate（乐观更新）
mutate(curr => [...curr!, newPost])

// refetch（强制刷新）
refetch()
```

**`source` 参数的三种返回值**：

```tsx
// 返回 falsy → fetcher 不跑
const [data] = createResource(userId, fetcher)
// userId() 返回 0 / null / undefined / false 时 fetcher 不调用

// 返回 truthy（任意非 falsy）→ fetcher 跑，把这个值传进去
createResource(userId, async (id) => fetch(`/api/users/${id}`))

// source 是对象（含 refetching） → 第二个参数拿到上下文
createResource(userId, async (id, { value, refetching }) => {
  // value 是上一次成功值，refetching 表示是否是 refetch 触发
})
```

## Solid 响应式：底层模型

Solid 用「**push-pull**」混合响应式：

```
signal 更新（push）
  → 通知所有「订阅了它的 effect/memo」标记 dirty
  → 下一次访问 memo / DOM 操作（pull）
    → 重新计算
    → 只更新真正 dirty 的部分
```

简化版手写：

```ts
let currentObserver: (() => void) | null = null
const subscriptions = new WeakMap<object, Set<() => void>>()

function createSignal<T>(initial: T) {
  let value = initial
  const subs = new Set<() => void>()

  const get = (): T => {
    if (currentObserver) subs.add(currentObserver)
    return value
  }

  const set = (next: T) => {
    value = next
    subs.forEach(fn => fn())
  }

  return [get, set] as const
}

function createEffect(fn: () => void) {
  const execute = () => {
    currentObserver = execute
    try { fn() }
    finally { currentObserver = null }
  }
  execute()
}
```

**关键洞察**：

- `signal()` 读：自动注册「我是当前 effect 的依赖」
- `setSignal(next)` 写：通知所有订阅者
- 不需要依赖数组——**读到什么就追什么**

## Stores：嵌套响应式

Signal 适合**单值**，Store 适合**嵌套对象**：

```tsx
import { createStore, produce, unwrap } from 'solid-js/store'

interface TodoState {
  filter: 'all' | 'active' | 'done'
  todos: { id: number; text: string; done: boolean }[]
}

const [state, setState] = createStore<TodoState>({
  filter: 'all',
  todos: [
    { id: 1, text: 'Learn Solid', done: false },
    { id: 2, text: 'Build app', done: false },
  ],
})

// 读：直接 state.xxx（嵌套 Proxy）
console.log(state.todos[0].text)

// 写：path-based setStore
setState('filter', 'active')
setState('todos', 0, 'done', true)               // todos[0].done = true
setState('todos', t => t.id === 1, 'text', 'X')  // 按谓词
setState('todos', {}, 'done', true)              // 全部 done = true
```

### `produce` —— 像 Immer 一样改 store

```tsx
import { produce } from 'solid-js/store'

setState(produce((draft) => {
  draft.filter = 'active'
  draft.todos.push({ id: 3, text: 'New', done: false })
  draft.todos[0].done = true
}))
```

`produce` 让你写 mutable 风格的代码，内部会用 Proxy 把所有修改翻译成 path-based 更新——**单次 batch，性能更好**。

### `reconcile` —— 替换整体但保留 reference

```tsx
import { reconcile } from 'solid-js/store'

const fresh = await fetch('/api/todos').then(r => r.json())

// 不要直接 setState('todos', fresh) —— 会失去引用稳定性
setState('todos', reconcile(fresh, { key: 'id' }))
// 内部比对每项 id，只更新真正变化的子树
```

### `unwrap` —— 取出纯 JS 对象

```tsx
import { unwrap } from 'solid-js/store'

const raw = unwrap(state)
// raw 是非 Proxy 普通对象，可以 JSON.stringify 或传给第三方库

console.log(JSON.stringify(raw))
```

::: warning unwrap 不 deep clone
`unwrap` 返回的对象 mutate 会**直接改 store**。需要快照拷贝用 `structuredClone(unwrap(state))`。
:::

### `createMutable` —— 完全可变 store

```tsx
import { createMutable } from 'solid-js/store'

const state = createMutable({ count: 0, list: [] })

// 直接改，无需 setter
state.count++
state.list.push('new')
```

::: tip 何时用 `createMutable`？
适合**单组件局部状态**或与第三方库（如 Y.js / Yjs CRDT）集成。**跨组件全局状态推荐用 `createStore`**——后者可控、可追踪、可测试。
:::

## 控制流组件完整表

| 组件 | 用途 | 关键 props |
|---|---|---|
| `<Show>` | 单条件渲染 | `when`, `fallback`, `keyed` |
| `<For>` | 列表（按对象身份） | `each`, `fallback` |
| `<Index>` | 列表（按 index） | `each`, `fallback` |
| `<Switch>` + `<Match>` | 多分支 | `<Switch fallback>` / `<Match when>` |
| `<Dynamic>` | 动态组件 / 标签 | `component` |
| `<Portal>` | 传送门 | `mount`, `useShadow`, `isSVG` |
| `<ErrorBoundary>` | 错误边界 | `fallback` |
| `<Suspense>` | 异步边界 | `fallback` |
| `<SuspenseList>` | Suspense 列表协调（实验） | `revealOrder`, `tail` |

### `<Show>` 详解

```tsx
import { Show } from 'solid-js'

// 基础
<Show when={user()} fallback={<Spinner />}>
  <UserCard />
</Show>

// keyed：when 变化时子树完全重建（旧 effect cleanup 后新创建）
<Show when={user()} keyed>
  {(user) => <UserCard user={user} />}
</Show>

// 默认（非 keyed）：when 变化时子树保持，内部用 props.xxx 访问
<Show when={user()}>
  <UserCard user={user()!} />
</Show>
```

**keyed vs 默认**：

- 默认：when 从 truthy → 另一个 truthy 不重建子树（性能好）
- keyed：每次 when 值变化都重建（适合配合 Resource，每次新数据回来重置子组件状态）

### `<For>` vs `<Index>` 深入

```tsx
import { For, Index } from 'solid-js'

// 场景：渲染聊天消息列表，每条消息有 id

// ✅ <For>：按 message.id 复用 DOM
<For each={messages()}>
  {(msg) => <MessageRow msg={msg} />}
</For>

// 重排消息时（如按时间倒序）：<For> 会保持 DOM 节点引用，只改 parent 的子节点顺序

// 场景：固定长度的 grid，每格用 index 标识

// ✅ <Index>：item 是 accessor，按 index 复用
<Index each={cells()}>
  {(cell, index) => (
    <div class="cell" data-index={index}>
      {cell()}   {/* cell() 是 accessor */}
    </div>
  )}
</Index>

// 重排 cells 时：<Index> 把新值赋给原 index 的 DOM 节点，节点不动
```

### `<Switch>` + `<Match>`

```tsx
import { Switch, Match } from 'solid-js'

<Switch fallback={<p>未知状态</p>}>
  <Match when={status() === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status() === 'success'} keyed>
    {/* keyed 模式：when 提供 truthy 值传入 */}
    {(data) => <SuccessView data={data} />}
  </Match>
  <Match when={error()}>
    <ErrorView err={error()!} />
  </Match>
</Switch>
```

### `<Dynamic>` —— 动态组件 / HTML 标签

```tsx
import { Dynamic } from 'solid-js/web'

const tag = () => isLink() ? 'a' : 'button'

<Dynamic
  component={tag()}
  href={isLink() ? '/home' : undefined}
  onClick={isLink() ? undefined : handleClick}
>
  Click me
</Dynamic>

// 也可以是函数组件
const View = () => isLoggedIn() ? UserView : GuestView
<Dynamic component={View()} {...props} />
```

`<Dynamic>` 接受字符串（HTML 标签名）或函数组件，所有 props 直接透传。

### `<Portal>` —— 跳出 DOM 层级

```tsx
import { Portal } from 'solid-js/web'

function Modal(props: { open: boolean; onClose: () => void }) {
  return (
    <Show when={props.open}>
      <Portal mount={document.body}>
        <div class="modal-overlay" onClick={props.onClose}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Modal Title</h2>
            <button onClick={props.onClose}>Close</button>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
```

**`<Portal>` 关键 props**：

- `mount`：挂载到哪个 DOM 节点（默认 `document.body`）
- `useShadow`：是否用 Shadow DOM 包裹（默认 false）
- `isSVG`：渲染到 SVG 上下文

### `<ErrorBoundary>` —— 错误兜底

```tsx
import { ErrorBoundary } from 'solid-js'

<ErrorBoundary fallback={(err, reset) => (
  <div>
    出错了：{err.message}
    <button onClick={reset}>重试</button>
  </div>
)}>
  <BuggyComponent />
</ErrorBoundary>
```

`fallback` 是函数：第一个参数是 Error 对象，第二个是 `reset` 函数（调用后清错误、重新渲染子组件）。

### `<Suspense>` —— 异步边界

```tsx
import { Suspense, createResource, For } from 'solid-js'

function PostList() {
  const [posts] = createResource(async () => {
    const res = await fetch('/api/posts')
    return res.json()
  })

  return (
    <Suspense fallback={<SkeletonList />}>
      <For each={posts()}>
        {(post) => <PostRow post={post} />}
      </For>
    </Suspense>
  )
}
```

**`<Suspense>` 行为**：

- 子组件内任意 `createResource` 在 pending 状态 → 显示 fallback
- 所有 resource ready → 显示子组件
- 与 SSR / streaming 集成（SolidStart 自动支持）

### 嵌套 `<ErrorBoundary>` + `<Suspense>`

```tsx
<ErrorBoundary fallback={<ErrorView />}>
  <Suspense fallback={<Loading />}>
    <DataView />
  </Suspense>
</ErrorBoundary>
```

**外层 ErrorBoundary 内层 Suspense**：error 阻断在最近的 boundary，suspense 也是。习惯按「Error 包 Suspense」组合，因为错误优先于加载。

## 生命周期

Solid 的生命周期非常简单，**只有两个**：

```tsx
import { onMount, onCleanup } from 'solid-js'

function Component() {
  onMount(() => {
    // 首次渲染后跑一次（只跑一次），可访问 DOM
    console.log('mounted')
  })

  onCleanup(() => {
    // 组件销毁时跑（或所在 effect / root 销毁时）
    console.log('unmounted')
  })

  return <div>Hello</div>
}
```

**没有 `onUpdated`**——更新由 effect 自动追踪：

```tsx
// React 的 useEffect(() => { ... }, [count])
// Solid 等价于：
createEffect(() => {
  console.log('count changed to', count())
})

// 跳过首次执行？（Solid 的 effect 总是立即跑首次）
import { on, createEffect } from 'solid-js'

createEffect(on(count, (c, prev) => {
  console.log('changed', c, 'from', prev)
}, { defer: true }))   // defer: true → 跳过首次
```

### `on` 帮助函数

```tsx
import { on, createEffect } from 'solid-js'

// 显式指定追踪源（不在 fn 内追踪）
createEffect(on(
  () => count(),
  (current, prev) => {
    console.log(prev, '→', current)
  },
))

// 多个源
createEffect(on(
  [count, name],   // 数组
  ([c, n]) => console.log(c, n),
))

// defer: 跳过首次
createEffect(on(count, fn, { defer: true }))
```

## Context API

```tsx
import { createContext, useContext, JSX } from 'solid-js'

// 1. 创建（必须默认值或类型断言）
interface Theme {
  mode: 'light' | 'dark'
  toggle: () => void
}

const ThemeContext = createContext<Theme>()

// 2. Provider 组件（自定义封装更便利）
export function ThemeProvider(props: { children: JSX.Element }) {
  const [mode, setMode] = createSignal<'light' | 'dark'>('light')
  const value: Theme = {
    get mode() { return mode() },   // getter 保持响应性
    toggle: () => setMode(m => m === 'light' ? 'dark' : 'light'),
  }
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  )
}

// 3. 消费 + 守卫（避免 undefined）
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
  return ctx
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  )
}

function Page() {
  const { mode, toggle } = useTheme()
  return (
    <button onClick={toggle}>
      Current: {mode}
    </button>
  )
}
```

::: tip Context value 的响应性
传 signal/store 进 context **不会**自动让消费方响应——你必须传一个**可被访问的 reactive 引用**（如上例的 `value.mode` getter）或直接传 signal 元组。普通对象快照 `{ mode: mode() }` 是死值。
:::

## 自定义指令：`use:`

`use:directive={value}` 在 DOM 节点挂载时调用 directive 函数，参数是 DOM 元素和 accessor：

```tsx
import { onCleanup } from 'solid-js'

// 实现 click-outside
function clickOutside(el: HTMLElement, accessor: () => () => void) {
  const onClick = (e: MouseEvent) => {
    if (!el.contains(e.target as Node)) accessor()()
  }
  document.body.addEventListener('click', onClick)
  onCleanup(() => document.body.removeEventListener('click', onClick))
}

// 必须告诉 TypeScript
declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      clickOutside: () => void
    }
  }
}

// 使用
function Menu() {
  const [open, setOpen] = createSignal(true)
  return (
    <Show when={open()}>
      <div use:clickOutside={() => setOpen(false)}>
        Menu
      </div>
    </Show>
  )
}
```

::: warning use: directive 不能动态
`use:clickOutside` 必须是**静态字符串**——编译器扫描 JSX 时静态识别 directive 名字。不能 `use:[dynamic]`。
:::

### 内置示例：`use:model` 双向绑定

Solid 没有内置双向绑定，但用 directive 5 行写一个：

```tsx
function model(el: HTMLInputElement, accessor: () => [() => string, (v: string) => void]) {
  const [get, set] = accessor()
  createRenderEffect(() => (el.value = get()))
  el.addEventListener('input', () => set(el.value))
}

const [text, setText] = createSignal('')
<input type="text" use:model={[text, setText]} />
```

## SolidStart：官方元框架

SolidStart 在 Solid + Vinxi（基于 Vite）之上，提供文件路由 / SSR / Server Functions / 多 adapter。

### 安装

```bash
pnpm create solid
# 选 SolidStart + TypeScript + 模板
```

### 文件路由

```
src/routes/
├── index.tsx                 # /
├── about.tsx                 # /about
├── users/
│   ├── index.tsx             # /users
│   └── [id].tsx              # /users/:id
├── blog/
│   └── [...slug].tsx         # /blog/* （catch-all）
├── (auth)/                   # 路由分组（不影响 URL）
│   ├── login.tsx             # /login
│   └── signup.tsx            # /signup
└── api/
    └── hello.ts              # /api/hello（API 路由）
```

```tsx
// src/routes/users/[id].tsx
import { useParams } from '@solidjs/router'

export default function UserDetail() {
  const params = useParams()
  return <h1>User {params.id}</h1>
}
```

### Server Functions（`'use server'`）

```tsx
import { query, action, createAsync } from '@solidjs/router'

// query：读
const getUser = query(async (id: string) => {
  'use server'
  // 这段代码只在服务端跑——客户端调 getUser(id) 自动变成 fetch
  return db.user.findUnique({ where: { id } })
}, 'user')

// action：写
const updateUser = action(async (formData: FormData) => {
  'use server'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  await db.user.update({ where: { id }, data: { name } })
  return { ok: true }
})

// 使用
export default function UserDetail(props: { params: { id: string } }) {
  const user = createAsync(() => getUser(props.params.id))

  return (
    <Show when={user()}>
      <form action={updateUser} method="post">
        <input type="hidden" name="id" value={user()!.id} />
        <input name="name" value={user()!.name} />
        <button type="submit">Save</button>
      </form>
    </Show>
  )
}
```

`'use server'` 指令告诉 SolidStart：

- 这段代码只在 server 端打包（客户端 bundle 不会包含 db 调用）
- 客户端调用变成自动 fetch → server endpoint
- form action 直接对接：表单提交触发 `updateUser`

### API 路由

```ts
// src/routes/api/hello.ts
import { APIEvent } from '@solidjs/start/server'

export async function GET(event: APIEvent) {
  return { hello: 'world' }
}

export async function POST({ request }: APIEvent) {
  const body = await request.json()
  return new Response(JSON.stringify(body), { status: 201 })
}
```

文件导出 `GET` / `POST` / `PUT` / `PATCH` / `DELETE` 函数，对应 HTTP 方法。

### 数据加载：`preload`

```tsx
import { Route, query, createAsync } from '@solidjs/router'

const getPosts = query(async () => {
  'use server'
  return db.post.findMany()
}, 'posts')

function PostList() {
  const posts = createAsync(() => getPosts())
  return (
    <Suspense fallback={<Loading />}>
      <For each={posts()}>{(p) => <PostRow post={p} />}</For>
    </Suspense>
  )
}

// 路由配置：preload 提前触发 query
<Route
  path="/posts"
  component={PostList}
  preload={() => getPosts()}
/>
```

`preload` 在路由匹配时（甚至导航前 hover link 时）就触发 query，做到「点击瞬间数据已就绪」。

### Adapter 部署

```ts
// app.config.ts
import { defineConfig } from '@solidjs/start/config'

export default defineConfig({
  server: {
    preset: 'vercel',   // 或 'netlify' / 'cloudflare-pages' / 'node-server' / 'bun' / ...
  },
})
```

支持 [Vercel / Netlify / Cloudflare Pages / Node / Bun / Deno / AWS Lambda 等](https://nitro.unjs.io/deploy)（基于 Nitro）。

## Solid Router

### 基础

```tsx
import { Router, Route } from '@solidjs/router'
import { render } from 'solid-js/web'

const Home = () => <h1>Home</h1>
const About = () => <h1>About</h1>
const User = () => <h1>User Detail</h1>

render(
  () => (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={User} />
    </Router>
  ),
  document.getElementById('root')!,
)
```

### `<A>` 与 `useNavigate`

```tsx
import { A, useNavigate } from '@solidjs/router'

function Nav() {
  const navigate = useNavigate()

  return (
    <nav>
      <A href="/" end>Home</A>           {/* end → 严格匹配 */}
      <A href="/about" activeClass="active">About</A>
      <A href="/users/42">User 42</A>

      <button onClick={() => navigate('/about', { replace: true })}>
        Go About
      </button>
    </nav>
  )
}
```

### 路由参数

```tsx
import { useParams, useSearchParams, useLocation } from '@solidjs/router'

function UserDetail() {
  // 路径参数（响应式）
  const params = useParams<{ id: string }>()

  // 查询参数（响应式）
  const [search, setSearch] = useSearchParams<{ tab?: string }>()

  // 当前 location（响应式）
  const location = useLocation()

  return (
    <div>
      <h1>User {params.id}</h1>
      <p>Tab: {search.tab}</p>
      <button onClick={() => setSearch({ tab: 'posts' })}>Posts Tab</button>
      <p>Path: {location.pathname}</p>
    </div>
  )
}
```

### 嵌套路由

```tsx
<Router>
  <Route path="/" component={Layout}>
    <Route path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/users/:id" component={User}>
      <Route path="/" component={UserOverview} />
      <Route path="/posts" component={UserPosts} />
      <Route path="/settings" component={UserSettings} />
    </Route>
  </Route>
</Router>

function Layout(props) {
  return (
    <>
      <Nav />
      <main>{props.children}</main>
    </>
  )
}
```

### Lazy Routes（代码分割）

```tsx
import { lazy } from 'solid-js'

const About = lazy(() => import('./routes/About'))

<Route path="/about" component={About} />
```

Solid 的 `lazy` 与 React 类似，但**自动配合 `<Suspense>`**——已经在外层包了 `<Suspense>` 时，路由切换自动等待 chunk 加载。

### 路由 metadata

```tsx
// 路由配置带 meta
<Route
  path="/admin"
  component={Admin}
  matchFilters={{ id: /^\d+$/ }}   // 参数过滤（正则）
/>

// 全局路由钩子
<Router
  root={(props) => (
    <>
      <Nav />
      <Suspense>{props.children}</Suspense>
    </>
  )}
  preload={(routeMatch) => {
    // 全局 preload：每次路由切换前跑
  }}
>
```

## TypeScript 集成

### 组件 props

```tsx
import { JSX } from 'solid-js'

interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
  onClick?: (e: MouseEvent) => void
  children?: JSX.Element
}

function Button(props: ButtonProps) {
  return (
    <button class={`btn btn-${props.variant ?? 'primary'}`} onClick={props.onClick}>
      {props.label}
      {props.children}
    </button>
  )
}
```

### Component vs ParentComponent

```tsx
import type { Component, ParentComponent, FlowComponent, ParentProps } from 'solid-js'

// 不接收 children
const Avatar: Component<{ url: string }> = (props) => <img src={props.url} />

// 接收 children（ParentProps 自动加 children: JSX.Element）
const Card: ParentComponent<{ title: string }> = (props) => (
  <div>
    <h2>{props.title}</h2>
    {props.children}
  </div>
)

// FlowComponent：用于控制流组件（children 是函数）
const MyFor: FlowComponent<{ each: any[] }, (item: any) => JSX.Element> = (props) => {
  // ...
}
```

| 类型 | 描述 |
|---|---|
| `Component<P>` | 函数组件 |
| `ParentComponent<P>` | 接收 `children: JSX.Element` 的组件 |
| `FlowComponent<P, T>` | children 是函数（`<For>` / `<Show>` 类型） |
| `ParentProps<P>` | 给已有 props 类型加 children |
| `FlowProps<P, T>` | 给已有 props 类型加函数式 children |
| `VoidProps<P>` | 显式不接受 children |
| `Accessor<T>` | `() => T`（signal getter） |
| `Setter<T>` | signal setter 类型 |
| `Signal<T>` | `[Accessor<T>, Setter<T>]` 元组 |

### 类型化 JSX 事件

```tsx
import type { JSX } from 'solid-js'

function Form() {
  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
    e.preventDefault()
    const form = e.currentTarget   // 自动推导为 HTMLFormElement
  }

  const handleInput: JSX.InputEventHandler<HTMLInputElement, InputEvent> = (e) => {
    console.log(e.currentTarget.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onInput={handleInput} />
    </form>
  )
}
```

`JSX.EventHandler<Element, Event>` 让 `currentTarget` 类型正确（DOM 原生 `Event` 的 `currentTarget` 是 `EventTarget`，不是具体元素）。

### `splitProps` / `mergeProps` 类型

```tsx
import { splitProps, mergeProps } from 'solid-js'

function CustomButton(props: ButtonProps & JSX.HTMLAttributes<HTMLButtonElement>) {
  // 分离自己定义的 props 和 native button props
  const [local, others] = splitProps(props, ['label', 'variant'])
  const merged = mergeProps({ variant: 'primary' as const }, local)

  return (
    <button {...others} class={`btn-${merged.variant}`}>
      {merged.label}
    </button>
  )
}
```

## 编译器优化

Solid 用 **`babel-plugin-jsx-dom-expressions`**（也叫 `babel-preset-solid`）把 JSX 编译成直接的 DOM 操作：

```tsx
// 源码
function App() {
  const [count, setCount] = createSignal(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  )
}

// 编译后（简化）
const _tmpl$ = template(`<button>Count: `)

function App() {
  const [count, setCount] = createSignal(0)
  return (() => {
    const _el$ = _tmpl$.cloneNode(true)
    _el$.$$click = () => setCount(c => c + 1)
    insert(_el$, count, null)    // 只更新 count() 文本节点
    return _el$
  })()
}
```

**关键优化点**：

1. **静态 HTML 模板**：`<button>Count: </button>` 编译到模块顶层一份，所有实例 cloneNode
2. **细粒度更新点**：`insert(el, count, marker)` 把 `count()` 包装成响应式 textnode 更新
3. **事件委托**：`$$click` 是 dom-expressions 的委托标记，单一 root 监听
4. **无 Reconciler**：不存在 vnode diff，因为「哪个文本/属性该更新」编译时就确定了

### 与 React Compiler 对比

| 维度 | React Compiler（React 19+ RC） | Solid Compiler |
|---|---|---|
| 范围 | 自动 memoize `useMemo` / `useCallback` | 直接编译到 DOM 操作 |
| 输入 | JSX + Hooks | JSX + Signals |
| 输出 | 优化后的 React 函数 | DOM 模板 + insert/setAttribute 调用 |
| 心智 | 修复 React 性能心智 | 从头设计无重渲染 |
| 状态 | RC 阶段，需要 ESLint 规则配合 | 稳定 6+ 年，标配 |

::: tip Solid 没有「需要 Compiler 才优秀」的设定
React Compiler 是为了**补救** Hooks 时代的 memo 心智负担。Solid 一开始就把这件事编译掉了——无需任何手动优化，开箱细粒度。
:::

## 测试

### Vitest + @solidjs/testing-library

```bash
pnpm add -D vitest @solidjs/testing-library jsdom @testing-library/jest-dom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
})
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

```tsx
// Counter.test.tsx
import { render, fireEvent, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import Counter from './Counter'

describe('Counter', () => {
  it('increments on click', () => {
    render(() => <Counter />)
    fireEvent.click(screen.getByRole('button', { name: /increment/i }))
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})
```

::: warning `render` 接收**函数**
`render(() => <Counter />)` 必须传函数——因为 Solid 需要在 owner 内创建 reactive scope。直接传 `<Counter />` 会失去 onCleanup 等能力。
:::

### Signal/Store 单元测试

```ts
import { createRoot, createSignal } from 'solid-js'
import { describe, it, expect } from 'vitest'

describe('counter signal', () => {
  it('increments', () => {
    createRoot((dispose) => {
      const [count, setCount] = createSignal(0)
      setCount(c => c + 1)
      expect(count()).toBe(1)
      dispose()
    })
  })
})
```

测试 signal/store 时用 `createRoot(dispose => { ... })` 包裹——所有 effect / memo 都需要有 owner，否则会泄漏。

## 性能优化清单

Solid 默认就是极致性能，但仍有几条建议：

- **优先 `<For>` / `<Index>`** 而非 `.map`——前者细粒度，后者每次重渲染整列表
- **优先 `<Show>` / `<Switch>`** 而非 `&&` / 三元——前者响应式精准，后者可能不更新
- **`createMemo` 缓存昂贵计算**——派生值要 memo，否则模板每次访问重算
- **`shallow store` 大对象**——`createStore` 默认深 Proxy，大量数据用 `createMutable` 或 `unwrap` 显式控制
- **避免 props 解构**——会失去响应性，用 `splitProps`
- **大列表虚拟滚动**——[@tanstack/solid-virtual](https://tanstack.com/virtual)
- **lazy 路由 + Suspense**——分 chunk 按需加载
- **Server Functions 替代 client fetch**——SolidStart 在 SSR 时数据已就绪

```tsx
// 例：lazy + Suspense
import { lazy, Suspense } from 'solid-js'

const Dashboard = lazy(() => import('./Dashboard'))

<Suspense fallback={<Skeleton />}>
  <Dashboard />
</Suspense>
```

## 常见陷阱速查

- **解构 props 失去响应性** → 用 `props.xxx` 或 `splitProps`
- **`createEffect` 内同步 `setSignal` 死循环** → 自己读写同一 signal 会无限触发；用 `untrack` 或换 `createRenderEffect`
- **forgot `()` on signal getter** → 模板里 `{count}` 是 getter 函数引用，必须 `{count()}` 才响应
- **`{cond && <Comp/>}` 不更新** → 用 `<Show when={cond()}>`
- **`.map()` 不细粒度** → 用 `<For>` / `<Index>`
- **resource 在 SSR 与 client 数据不一致** → SolidStart 已自动同步；自己手写 SSR 要序列化 `getServerStream`
- **`use:directive` 必须静态名** → 不能 `use:[dynamic]`，编译期识别
- **`createStore` 替换整体** → 用 `reconcile`，不要 `setState(fresh)`
- **`onMount` 不在 SSR 跑** → 仅 client 端跑（与 React 一致）
- **`createEffect` 立即执行首次** → 想跳过用 `on(src, fn, { defer: true })`

## vs React

| 维度 | Solid 1.9 | React 19 |
|---|---|---|
| 组件重跑 | 一次（建立响应式图） | 每次 state 变化 |
| 响应式 | Signals（细粒度） | hooks + reconcile |
| 状态原语 | `createSignal` | `useState` |
| 派生 | `createMemo` | `useMemo`（Compiler 后自动） |
| 副作用 | `createEffect` | `useEffect` |
| 异步 | `createResource` | `use(promise)` / RSC |
| Memoization | 内置 | 需 React.memo / Compiler |
| Virtual DOM | 无 | 有（Fiber） |
| Bundle | ~7 KB | ~45 KB |
| 性能 | 顶级 | 中等（Compiler 后接近 Solid） |
| 生态 | 小 | 最大 |
| 招聘市场 | 小 | 最大 |
| 元框架 | SolidStart | Next.js / Remix / TanStack Start |
| Server Components | SolidStart 形态 | 完整 RSC |

::: tip 团队主语言决定
- React 团队 → 写 React，Compiler 后性能差距明显缩小
- Solid 团队 → 性能与代码优雅程度更好
- 新项目 + 中立团队 → 评估招聘 / 生态 / 性能要求
:::

## vs Vue

| 维度 | Solid 1.9 | Vue 3.5 |
|---|---|---|
| 模板 | JSX | SFC 模板 |
| 响应式 | Signals（函数式） | Proxy（对象式） |
| 编译策略 | JSX → DOM 操作 | 模板 → vnode + patchFlag |
| Virtual DOM | 无 | 有（小核） |
| 状态原语 | `createSignal` getter | `ref().value` |
| 派生 | `createMemo` | `computed` |
| 副作用 | `createEffect` | `watchEffect` / `watch` |
| 列表 | `<For each>` | `v-for` |
| 双向绑定 | 自己实现 directive | `v-model` 内置 |
| 学习曲线 | 中等（需要换思维） | 平缓 |
| 心智契合度 | 类 React | 类 HTML + 一点新 |

## vs Svelte

| 维度 | Solid | Svelte 5 |
|---|---|---|
| 模板 | JSX | `.svelte` SFC（HTML 风格） |
| 编译策略 | JSX → DOM 操作 | SFC → 极薄运行时 |
| 响应式 | Signals（运行时 + 编译辅助） | Runes（`$state` / `$derived` / `$effect`） |
| Virtual DOM | 无 | 无 |
| 体积 | ~7 KB | ~5 KB |
| 学习曲线 | 中等 | 中等 |
| 元框架 | SolidStart | SvelteKit |
| 心智契合度 | React 思维 | HTML + 编译魔法 |

**怎么选**：

- **Solid**：React 经验、JSX 偏好、性能至上
- **Svelte**：HTML 偏好、编译产物体积最小、SvelteKit 文档好

## vs Preact

Preact 是 React 的轻量替代（~3 KB），API 几乎与 React 一致：

| 维度 | Solid | Preact |
|---|---|---|
| 心智模型 | 细粒度响应式 | React-like + signals 可选 |
| 响应式 | Signals 标配 | hooks 默认，[@preact/signals](https://preactjs.com/guide/v10/signals/) 可选 |
| API 兼容 React | 部分（JSX 一致，hooks 不同） | 几乎完全兼容 |
| Bundle | ~7 KB | ~3 KB |
| 性能 | 顶级（细粒度） | 接近 React（vnode 优化） |
| 生态 | 自己的（Kobalte / SolidStart） | 复用 React 大部分（带兼容层） |

**怎么选**：

- **想要细粒度更新 + 不复用 React 库** → Solid
- **想要小体积 + 几乎复用 React 库** → Preact

## 不要选 Solid 的场景

- **团队全是 React 老手 + 重度依赖 React 生态**（某 SaaS SDK 只有 React 版） → 切换成本高
- **企业级中后台**（依赖 Ant Design / Element Plus 这类大库） → Solid UI 库覆盖度还不够
- **React Native 跨端需求** → solid-native 远不如 React Native 成熟
- **招聘大量人** → 候选人少，培训成本高
- **追求最稳定的元框架** → Next.js 15 + RSC 仍领先 SolidStart 一档（虽然 SolidStart 已经很可用）
- **要 RSC + Edge Streaming 等最前沿特性** → React 19 + Next.js 走得更前面

## 经验法则

- **小 / 中型项目 + 性能敏感** → Solid 是优秀选择，Bundle 与运行时都领先
- **掌握 React JSX 经验** → 学 Solid 比学 Vue / Svelte 心智迁移更顺畅
- **不要解构 props** → 这是 Solid 的「头号坑」
- **优先用 `<Show>` / `<For>` / `<Switch>`** → 不要回到 `&&` / `.map()` / 三元
- **`createStore` + `produce`** → 嵌套状态首选，写法接近 Immer
- **SolidStart 用 `'use server'`** → 数据获取标准范式
- **2.0 别押注** → 仍在 `@solidjs/signals` 实验分支；正式生产用 1.9
- **测试用 `@solidjs/testing-library`** → 不要直接用 RTL（React Testing Library）

## 进阶技巧：自定义 Hooks（Composables）

Solid 把可复用逻辑封装成 `useXxx` 函数（与 Vue Composables / React Custom Hooks 同理）：

```ts
import { createSignal, createEffect, onCleanup } from 'solid-js'

// composables/useCounter.ts
export function useCounter(initial = 0) {
  const [count, setCount] = createSignal(initial)
  const doubled = createMemo(() => count() * 2)

  const increment = () => setCount(c => c + 1)
  const reset = () => setCount(initial)

  return { count, doubled, increment, reset }
}

// 使用
function Counter() {
  const { count, doubled, increment, reset } = useCounter(10)
  return (
    <div>
      <p>{count()} → {doubled()}</p>
      <button onClick={increment}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### 实战 composable：useLocalStorage

```ts
import { createSignal, createEffect } from 'solid-js'

export function useLocalStorage<T>(key: string, initial: T) {
  // 从 localStorage 读初始值
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  const [value, setValue] = createSignal<T>(
    stored ? JSON.parse(stored) as T : initial,
  )

  // 写：自动同步到 localStorage
  createEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value()))
    }
  })

  return [value, setValue] as const
}

// 使用：与 createSignal 等价 API
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')
```

### 实战 composable：useFetch

```ts
import { createResource, createSignal } from 'solid-js'

export function useFetch<T>(url: () => string) {
  const [data, { mutate, refetch }] = createResource(url, async (u) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error(`Failed: ${res.status}`)
    return res.json() as Promise<T>
  })

  return {
    data,
    loading: () => data.loading,
    error: () => data.error,
    mutate,
    refetch,
  }
}

// 使用
function PostList() {
  const [page, setPage] = createSignal(1)
  const { data, loading, error } = useFetch<Post[]>(() => `/api/posts?page=${page()}`)

  return (
    <>
      <Show when={!loading()} fallback={<Spinner />}>
        <For each={data()}>{(post) => <PostRow post={post} />}</For>
      </Show>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </>
  )
}
```

## 异步处理深入

### `<Suspense>` 与 `<ErrorBoundary>` 组合

```tsx
import { createResource, Suspense, ErrorBoundary, Show, For } from 'solid-js'

interface Post {
  id: number
  title: string
}

function PostList() {
  const [posts] = createResource<Post[]>(async () => {
    const res = await fetch('/api/posts')
    if (!res.ok) throw new Error('Failed')
    return res.json()
  })

  return (
    <ErrorBoundary fallback={(err, reset) => (
      <div>
        <p>Error: {err.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    )}>
      <Suspense fallback={<p>Loading...</p>}>
        <For each={posts()} fallback={<p>No posts</p>}>
          {(post) => <li>{post.title}</li>}
        </For>
      </Suspense>
    </ErrorBoundary>
  )
}
```

### `useTransition` —— 标记非紧急更新

```tsx
import { useTransition, createSignal, Suspense } from 'solid-js'

function Search() {
  const [pending, start] = useTransition()
  const [query, setQuery] = createSignal('')

  const handleInput = (e: InputEvent) => {
    start(() => {
      // 这次 setSignal 触发的 Suspense fallback 不会立即闪烁
      setQuery((e.target as HTMLInputElement).value)
    })
  }

  return (
    <>
      <input onInput={handleInput} />
      <Show when={pending()}>
        <span>Searching...</span>
      </Show>
      <Suspense fallback={<Skeleton />}>
        <SearchResults query={query()} />
      </Suspense>
    </>
  )
}
```

`useTransition` 把内部的 setSignal 标记成「**非紧急**」——已经显示的 Suspense 内容继续显示，等新数据 ready 才切换；适合 Tab 切换、搜索输入等。

### `startTransition` —— 命令式版本

```tsx
import { startTransition } from 'solid-js'

function Tabs() {
  const [active, setActive] = createSignal('home')

  const switchTab = (tab: string) => {
    startTransition(() => setActive(tab))
  }

  return <button onClick={() => switchTab('about')}>About</button>
}
```

## SolidStart 进阶

### Cookie / Session（中间件）

```ts
// src/middleware.ts
import { createMiddleware } from '@solidjs/start/middleware'

export default createMiddleware({
  onRequest: [
    (event) => {
      // 给每个请求加一个 user 字段
      const token = event.request.headers.get('cookie')?.match(/token=(\w+)/)?.[1]
      event.locals.user = token ? verifyToken(token) : null
    },
  ],
})
```

```ts
// app.config.ts
import { defineConfig } from '@solidjs/start/config'

export default defineConfig({
  middleware: './src/middleware.ts',
})
```

### Server Function 访问 request

```ts
import { getRequestEvent } from 'solid-js/web'

const getCurrentUser = query(async () => {
  'use server'
  const event = getRequestEvent()!
  return event.locals.user
}, 'currentUser')
```

### 流式 SSR

SolidStart 默认开启流式 SSR——`<Suspense>` 内的异步内容在 ready 后流式推送到客户端，首屏 HTML 不等待所有数据：

```tsx
// src/routes/index.tsx
export default function Home() {
  return (
    <>
      <h1>Home</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />    {/* SlowComponent 内 createResource fetch */}
      </Suspense>
    </>
  )
}
```

服务器返回时：

1. 立即发送 `<h1>` + `<Skeleton/>` 的 HTML
2. `SlowComponent` 数据 ready 后，再发一段 `<template>` + 内联脚本替换 Skeleton

### SSG（静态站点）

```ts
// app.config.ts
import { defineConfig } from '@solidjs/start/config'

export default defineConfig({
  server: {
    preset: 'static',          // 全站 prerender
    prerender: {
      routes: ['/blog/foo', '/blog/bar'],  // 动态路由要列出
    },
  },
})
```

```bash
pnpm build      # 输出 dist/，纯静态文件
```

## Vite 集成

### 单独的 Vite + Solid 项目

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'

export default defineConfig({
  plugins: [
    devtools({ autoname: true }),
    solid(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

### `solid()` 插件配置

```ts
solid({
  ssr: true,                              // 默认 false
  hot: true,                              // HMR
  babel: {
    plugins: [...],                       // 额外 babel 插件
  },
  solid: {
    generate: 'dom' | 'ssr' | 'universal',
    hydratable: true,
  },
})
```

## 与原生 DOM 库集成

### 与 D3 / Three.js / Pixi.js 集成

Solid 的 `ref` + `onMount` + `onCleanup` 让原生库非常好集成：

```tsx
import * as d3 from 'd3'
import { onMount, onCleanup, createEffect } from 'solid-js'

function BarChart(props: { data: number[] }) {
  let svgRef: SVGSVGElement | undefined

  onMount(() => {
    const svg = d3.select(svgRef!)
    // 初始化 svg
  })

  createEffect(() => {
    // data 变化时更新
    const data = props.data
    d3.select(svgRef!)
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('height', d => d)
  })

  return <svg ref={svgRef} width="500" height="300" />
}
```

### 与 Element Plus 等 Vue 库集成

不能直接用——但可以通过 web components 桥接：

```tsx
// 把 Vue 组件注册成 custom element 后
<el-button>{/* 任意 prop / slot */}</el-button>
```

实务中**避免跨框架混用**——选了 Solid 就用 Solid 原生 UI 库（Kobalte / Hope UI / Park UI）。

## 不要选 Solid 的场景

- **团队全是 React 老手 + 重度依赖 React 生态**（某 SaaS SDK 只有 React 版） → 切换成本高
- **企业级中后台**（依赖 Ant Design / Element Plus 这类大库） → Solid UI 库覆盖度还不够
- **React Native 跨端需求** → solid-native 远不如 React Native 成熟
- **招聘大量人** → 候选人少，培训成本高
- **追求最稳定的元框架** → Next.js 15 + RSC 仍领先 SolidStart 一档（虽然 SolidStart 已经很可用）
- **要 RSC + Edge Streaming 等最前沿特性** → React 19 + Next.js 走得更前面

## 开发者工具

### Solid DevTools

```bash
pnpm add -D solid-devtools
```

```ts
// vite.config.ts
import devtools from 'solid-devtools/vite'

export default defineConfig({
  plugins: [devtools({ autoname: true }), solid()],
})
```

```ts
// src/index.tsx
import 'solid-devtools'   // 引入即生效
```

启动 dev server 后，浏览器扩展面板会显示：

- **Components**：组件树 + props
- **Signals**：所有 signal 当前值 + 订阅关系
- **Owners**：reactive owner 层级（适合调试内存泄漏）
- **Locator**：在网页上点元素跳到源码（需 VSCode 等扩展支持）

### 调试技巧

```ts
import { DEV } from 'solid-js'

// dev 模式额外日志
if (DEV) {
  console.log('dev only')
}

// 给 signal 命名（dev tools 显示）
const [count, setCount] = createSignal(0, { name: 'counter' })

// 给 memo 命名
const doubled = createMemo(() => count() * 2, 0, { name: 'doubled' })

// 在 effect 内打断点：dev 模式 effect 有 stack trace
createEffect(() => {
  debugger
  console.log(count())
})
```

下一章 `reference.md` 是 API / Hooks / 组件 / TypeScript 工具类型的速查表。
