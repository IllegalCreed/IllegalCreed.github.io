---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Solid 1.9.x / SolidStart 1.1.x / Solid Router 0.15.x 编写 —— 基本响应式 / 派生 / 生命周期 / 控制流 / 组件 API / Store 工具 / `solid-js/web` / JSX 属性 / TypeScript 工具类型 / SolidStart / Router / 版本里程碑

## 基本响应式 API

### `solid-js` 主入口

| API | 签名 | 用途 |
|---|---|---|
| `createSignal<T>(value?, options?)` | `(T?, options?) => [Accessor<T>, Setter<T>]` | 响应式状态 |
| `createMemo<T>(fn, value?, options?)` | `(() => T, T?, options?) => Accessor<T>` | 派生缓存值 |
| `createEffect<T>(fn, value?)` | `((prev: T) => T, T?) => void` | 副作用（异步） |
| `createRenderEffect<T>(fn, value?)` | 同 createEffect 但同步 | DOM 测量类副作用 |
| `createDeferred<T>(source, options?)` | `(Accessor<T>, options?) => Accessor<T>` | 推迟更新（低优先级） |
| `createSelector<T, U>(source, fn?)` | `(Accessor<T>, ((a, b) => boolean)?) => (key: U) => boolean` | 选择器（O(1) 选中查询） |
| `createResource<T, S>(source?, fetcher, options?)` | 异步资源 | 与 Suspense 集成 |
| `batch(fn)` | `(() => T) => T` | 批量更新（多个 setSignal 合并） |
| `untrack(fn)` | `(() => T) => T` | 不追踪读 |
| `on(deps, fn, options?)` | 显式依赖 effect 帮手 | 替代隐式追踪 |

### 详细签名

```ts
// createSignal
function createSignal<T>(value: T, options?: SignalOptions<T>): Signal<T>
function createSignal<T>(): Signal<T | undefined>

interface SignalOptions<T> {
  name?: string                                    // dev 名称
  equals?: false | ((prev: T, next: T) => boolean) // 默认 ===
  internal?: boolean
}

type Signal<T> = [get: Accessor<T>, set: Setter<T>]
type Accessor<T> = () => T
type Setter<T> = {
  (value: Exclude<T, Function> | ((prev: T) => T)): T
}

// createMemo
function createMemo<T>(fn: (prev: T) => T, value?: T, options?: MemoOptions<T>): Accessor<T>

// createEffect
function createEffect<T>(fn: (prev: T) => T, value?: T): void

// createRenderEffect（在 DOM commit 前同步跑）
function createRenderEffect<T>(fn: (prev: T) => T, value?: T): void

// createDeferred（推迟低优先级更新）
function createDeferred<T>(source: () => T, options?: { timeoutMs?: number; name?: string }): () => T

// createSelector（适合「列表中选中项」场景，O(1) 查询）
function createSelector<T, U = T>(
  source: () => T,
  equals?: (a: U, b: T) => boolean,
): (key: U) => boolean

// createResource
function createResource<T, S>(
  source: false | null | undefined | S | (() => false | null | undefined | S),
  fetcher: (k: S, info: ResourceFetcherInfo<T>) => T | Promise<T>,
  options?: ResourceOptions<T>,
): ResourceReturn<T>

interface ResourceFetcherInfo<T> {
  value: T | undefined
  refetching: boolean | unknown
}

type ResourceReturn<T> = [
  Resource<T>,
  { mutate: Setter<T | undefined>; refetch: (info?: unknown) => Promise<T> | T },
]

interface Resource<T> {
  (): T | undefined
  loading: boolean
  error: any
  state: 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'
  latest: T | undefined
}
```

### 示例

```ts
import { createSignal, createMemo, createEffect, createResource, batch, untrack, on } from 'solid-js'

const [count, setCount] = createSignal(0)
const [name, setName] = createSignal('Solid')

const doubled = createMemo(() => count() * 2)

createEffect(() => console.log(count(), name()))   // 同时追 2 个 signal

// batch：多次 setSignal 合并成一次更新
batch(() => {
  setCount(c => c + 1)
  setName('Solid 2')
})

// untrack：不追踪
createEffect(() => {
  const c = count()                      // 追踪
  const n = untrack(() => name())        // 不追踪
})

// on：显式依赖 + defer 首次
createEffect(on(count, (c, prev) => {
  console.log(prev, '→', c)
}, { defer: true }))
```

## 生命周期与上下文

| API | 签名 | 用途 |
|---|---|---|
| `onMount(fn)` | `(() => void) => void` | 首次渲染后跑一次（client only） |
| `onCleanup(fn)` | `(() => void) => void` | 所在 scope 销毁时跑 |
| `onError(fn)` | `((err) => void) => void` | 错误处理（向上冒泡） |
| `createContext<T>(default?)` | `(T?) => Context<T>` | 创建 context |
| `useContext<T>(ctx)` | `(Context<T>) => T` | 读 context |
| `createRoot(fn)` | `((dispose: () => void) => T) => T` | 创建独立 reactive scope |
| `runWithOwner(owner, fn)` | 在指定 owner 跑 fn | 跨边界响应式 |
| `getOwner()` | `() => Owner \| null` | 取当前 owner |

```ts
import { onMount, onCleanup, onError, createContext, useContext, createRoot } from 'solid-js'

// 生命周期
onMount(() => console.log('mounted'))
onCleanup(() => console.log('cleanup'))
onError(err => console.error('caught', err))

// Context
interface Theme {
  mode: 'light' | 'dark'
}
const ThemeContext = createContext<Theme>({ mode: 'light' })

function Provider(props) {
  return <ThemeContext.Provider value={{ mode: 'dark' }}>{props.children}</ThemeContext.Provider>
}

function Consumer() {
  const theme = useContext(ThemeContext)
  return <div>{theme.mode}</div>
}

// createRoot（独立 scope，需要手动 dispose）
createRoot((dispose) => {
  const [count, setCount] = createSignal(0)
  // ... 用完 dispose() 清掉所有 effect
})
```

## 控制流组件

| 组件 | 签名 | 用途 |
|---|---|---|
| `<Show when fallback keyed>` | 单条件 | 替代 `&&` 三元 |
| `<For each fallback>` | 列表（对象身份） | 替代 `.map` |
| `<Index each fallback>` | 列表（按 index） | item 是 accessor |
| `<Switch fallback>` + `<Match when keyed>` | 多分支 | 替代 if-else-if 链 |
| `<Dynamic component>` | 动态组件 / 标签 | 标签名 / 函数组件可变 |
| `<Portal mount useShadow>` | 传送门 | 跳出 DOM 层级 |
| `<ErrorBoundary fallback>` | 错误边界 | 捕获子树错误 |
| `<Suspense fallback>` | 异步边界 | 与 Resource 集成 |
| `<SuspenseList revealOrder tail>` | 多 Suspense 协调（实验） | 顺序揭示 |

### Show / For / Switch 详细类型

```tsx
import type { JSX, Accessor } from 'solid-js'

// Show
function Show<T, K extends boolean = false>(props: {
  when: T | undefined | null | false
  fallback?: JSX.Element
  keyed?: K
  children: JSX.Element | ((item: K extends true ? T : Accessor<T>) => JSX.Element)
}): JSX.Element

// For
function For<T extends readonly any[], U extends JSX.Element>(props: {
  each: T | undefined | null | false
  fallback?: JSX.Element
  children: (item: T[number], index: Accessor<number>) => U
}): JSX.Element

// Index
function Index<T extends readonly any[], U extends JSX.Element>(props: {
  each: T | undefined | null | false
  fallback?: JSX.Element
  children: (item: Accessor<T[number]>, index: number) => U
}): JSX.Element

// Switch / Match
function Switch(props: { fallback?: JSX.Element; children: JSX.Element }): JSX.Element
function Match<T>(props: {
  when: T | undefined | null | false
  keyed?: boolean
  children: JSX.Element | ((item: any) => JSX.Element)
}): JSX.Element
```

### Dynamic / Portal / ErrorBoundary / Suspense

```tsx
import { Dynamic, Portal } from 'solid-js/web'
import { ErrorBoundary, Suspense } from 'solid-js'

// Dynamic
<Dynamic component="button" type="submit">Submit</Dynamic>
<Dynamic component={MyComponent} prop1="x" />

// Portal
<Portal mount={document.body} useShadow={false} isSVG={false}>
  <Modal />
</Portal>

// ErrorBoundary
<ErrorBoundary fallback={(err, reset) => (
  <div>Error: {err.message}<button onClick={reset}>retry</button></div>
)}>
  <App />
</ErrorBoundary>

// Suspense
<Suspense fallback={<Spinner />}>
  <DataView />
</Suspense>
```

## 组件 API

| API | 签名 | 用途 |
|---|---|---|
| `lazy(loader)` | `(() => Promise<Module>) => LazyComponent` | 代码分割 |
| `mergeProps(...sources)` | `(...Partial<P>[]) => P` | 合并默认值 + props |
| `splitProps(props, ...keys)` | `(P, ...K[][]) => [Pick<P,K>, Omit<P,K>]` | 拆分 props |
| `children(fn)` | `(() => JSX.Element) => Accessor<ResolvedJSXElement>` | 解析 children |
| `untrack(fn)` | `(() => T) => T` | 不追踪读 |
| `createUniqueId()` | `() => string` | SSR-safe 唯一 id |

```ts
import { lazy, mergeProps, splitProps, children, createUniqueId } from 'solid-js'

// lazy
const Heavy = lazy(() => import('./Heavy'))

// mergeProps：默认值
function Btn(props: { label: string; variant?: 'primary' | 'secondary' }) {
  const merged = mergeProps({ variant: 'primary' as const }, props)
  return <button class={`btn-${merged.variant}`}>{merged.label}</button>
}

// splitProps：透传给原生标签
function Input(props: { label: string } & JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, others] = splitProps(props, ['label'])
  return (
    <label>
      {local.label}
      <input {...others} />
    </label>
  )
}

// children：解析 JSX children 取实际 DOM 节点
function Counter(props: { children: JSX.Element }) {
  const resolved = children(() => props.children)
  createEffect(() => {
    const list = resolved.toArray()      // 节点数组
    console.log(list.length)
  })
  return <div>{resolved()}</div>
}

// createUniqueId：SSR 同步 id
function FormField() {
  const id = createUniqueId()
  return (
    <>
      <label for={id}>Name</label>
      <input id={id} type="text" />
    </>
  )
}
```

## Stores API

### `solid-js/store`

| API | 签名 | 用途 |
|---|---|---|
| `createStore<T>(initial)` | `(T) => [Store<T>, SetStoreFunction<T>]` | 嵌套响应式对象 |
| `produce(fn)` | `((draft) => void) => Modifier` | Immer 风格修改 |
| `reconcile(value, options?)` | `(T, { key?, merge? }) => Modifier` | 差异化替换 |
| `unwrap(store)` | `(Store<T>) => T` | 取出非 Proxy 对象 |
| `createMutable<T>(initial)` | `(T) => T` | 可变 store（不要 setter） |
| `modifyMutable(value, modifier)` | 批量改 createMutable | |

```ts
import { createStore, produce, reconcile, unwrap } from 'solid-js/store'

interface State {
  filter: string
  todos: { id: number; text: string; done: boolean }[]
}

const [state, setState] = createStore<State>({
  filter: 'all',
  todos: [],
})

// 多种 setState 调用方式
setState('filter', 'active')
setState('todos', [{ id: 1, text: 'x', done: false }])
setState('todos', 0, 'done', true)                       // path
setState('todos', t => t.id === 1, 'text', 'updated')    // 谓词
setState('todos', i => i % 2 === 0, 'done', true)        // 索引谓词
setState('todos', {}, 'done', true)                      // 全部
setState('todos', [0, 1], 'done', true)                  // 数组
setState(produce(s => {                                  // produce
  s.filter = 'done'
  s.todos[0].done = true
}))
setState('todos', reconcile(freshTodos, { key: 'id' }))  // diff 替换

// unwrap
const plain = unwrap(state)   // 不是 Proxy
```

### `produce` / `reconcile` 签名

```ts
function produce<T>(fn: (state: T) => void): (state: T) => T

function reconcile<T>(
  value: T,
  options?: { key?: string | null; merge?: boolean },
): (state: T) => T
```

## `solid-js/web` 工具

| API | 用途 |
|---|---|
| `render(fn, root)` | 客户端入口（mount 应用） |
| `hydrate(fn, root)` | SSR 客户端 hydration |
| `Portal` | 传送门组件 |
| `Dynamic` | 动态组件 |
| `template(strings, ...exprs)` | 内部 dom-expressions 用 |
| `delegateEvents(events)` | 启用事件委托 |
| `clearDelegatedEvents()` | 清委托 |
| `renderToString(fn, options?)` | SSR 同步 |
| `renderToStringAsync(fn, options?)` | SSR 异步（等 resource） |
| `renderToStream(fn, options?)` | SSR 流式 |
| `generateHydrationScript(options?)` | 生成 hydration 内联脚本 |
| `isServer` | boolean 常量 |

```ts
import { render, hydrate, isServer } from 'solid-js/web'
import App from './App'

if (isServer) {
  // 服务端渲染分支
} else {
  // CSR 入口
  render(() => <App />, document.getElementById('root')!)
}

// 或 SSR hydration（已有服务端 HTML）
hydrate(() => <App />, document.getElementById('root')!)
```

## JSX 属性参考

### 常用属性

| 属性 | 用途 | 示例 |
|---|---|---|
| `class` | 类名（字符串） | `<div class="btn">` |
| `classList` | 条件类名对象 | <span v-pre>`<div classList={{ active: isActive() }}>`</span> |
| `style` | 内联样式（字符串/对象） | <span v-pre>`<div style={{ color: 'red' }}>`</span> |
| `ref` | DOM 引用 | `<div ref={el}>` |
| `attr:xxx` | 强制设为 DOM attribute | `<svg attr:viewBox="0 0 10 10">` |
| `prop:xxx` | 强制设为 DOM property | `<input prop:value={text()}>` |
| `bool:xxx` | boolean 属性 | `<input bool:disabled={disabled()}>` |
| `on:xxx` | 原生事件（不委托） | `<button on:click={handler}>` |
| `oncapture:xxx` | 捕获阶段事件 | |
| `use:xxx` | 自定义指令 | `<div use:click-outside={close}>` |

### `style` 详解

```tsx
// 字符串
<div style="color: red; font-size: 16px" />

// 对象（key 是 camelCase 或 kebab-case 都行）
<div style={{ color: 'red', 'font-size': '16px' }} />

// CSS 变量
<div style={{ '--primary': color() }} />

// 动态
<div style={{ width: `${size()}px` }} />
```

### `classList` vs `class`

```tsx
// classList：条件类（推荐）
<div classList={{
  active: isActive(),
  disabled: isDisabled(),
}} />

// class：动态字符串（也可以）
<div class={`btn ${isActive() ? 'active' : ''}`} />

// 共存（推荐组合）
<div class="static-class" classList={{ active: isActive() }} />
```

### 事件

```tsx
// 委托事件（推荐）
<button onClick={handler}>Click</button>
<button onclick={handler}>Click</button>   {/* 小写也行 */}

// 原生事件（不走委托）
<button on:click={handler}>Click</button>

// 捕获阶段
<div oncapture:click={handler}>Capture</div>

// 自定义事件
<button on:my-event={handler}>Custom</button>
```

### `ref` 用法

```tsx
// 变量赋值
let inputRef: HTMLInputElement | undefined
<input ref={inputRef} />

// 函数回调（更灵活）
<input ref={(el) => { /* el 已挂载 */ }} />

// 在 ref 函数中订阅响应式
<input ref={(el) => {
  createEffect(() => el.value = text())
}} />
```

## TypeScript 工具类型

| 类型 | 用途 |
|---|---|
| `Accessor<T>` | `() => T`（signal getter） |
| `Setter<T>` | signal setter |
| `Signal<T>` | `[Accessor<T>, Setter<T>]` 元组 |
| `Component<P>` | 函数组件 |
| `ParentComponent<P>` | 接收 children: JSX.Element 的组件 |
| `FlowComponent<P, T>` | children 是函数 |
| `VoidComponent<P>` | 显式不接收 children |
| `ParentProps<P>` | 给 P 加 children: JSX.Element |
| `FlowProps<P, T>` | 给 P 加函数式 children |
| `VoidProps<P>` | 给 P 加 children: never |
| `Resource<T>` | `() => T \| undefined` + loading/error/state |
| `JSX.Element` | JSX 表达式合法类型 |
| `JSX.HTMLAttributes<T>` | 原生 HTML 属性 |
| `JSX.InputHTMLAttributes<T>` | input 元素属性 |
| `JSX.EventHandler<E, Ev>` | 类型化事件处理函数 |
| `JSX.IntrinsicElements` | 所有原生标签字典 |

```ts
import type {
  Accessor, Setter, Signal,
  Component, ParentComponent, ParentProps,
  Resource, JSX,
} from 'solid-js'

// 自定义组件
const Btn: Component<{ label: string }> = (props) => <button>{props.label}</button>

// 接收 children
const Card: ParentComponent<{ title: string }> = (props) => (
  <div><h2>{props.title}</h2>{props.children}</div>
)

// 等价写法
function Card2(props: ParentProps<{ title: string }>) {
  return <div><h2>{props.title}</h2>{props.children}</div>
}

// 类型化 ref
let ref: HTMLDivElement | undefined

// 类型化事件
const onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (e) => {
  console.log(e.currentTarget.disabled)
}
```

### `<For>` / `<Show>` keyed 类型

```tsx
// keyed: <Show> 子函数收到的是值，而非 accessor
<Show when={user()} keyed>
  {(u) => <UserCard user={u} />}    {/* u: User */}
</Show>

// 默认 <Show>：子函数收到 accessor
<Show when={user()}>
  {(u) => <UserCard user={u()} />}  {/* u: Accessor<User> */}
</Show>
```

## SolidStart API

### `@solidjs/start/server`

| API | 用途 |
|---|---|
| `APIEvent` | API 路由 event 类型 |
| `APIHandler` | API 路由函数类型 |
| `H3Event` | 底层 Nitro event |
| `getRequestEvent()` | 在 server function 中拿到 request event |
| `getRequestURL(event)` | 工具函数 |

```ts
// src/routes/api/users/[id].ts
import { APIEvent } from '@solidjs/start/server'

export async function GET({ params }: APIEvent) {
  return { id: params.id, name: 'Alice' }
}

export async function PATCH({ request, params }: APIEvent) {
  const body = await request.json()
  return { ok: true }
}
```

### `@solidjs/start` 客户端 API

| API | 用途 |
|---|---|
| `HttpStatusCode` | 设置响应状态码 |
| `Title` / `Meta` / `Link` | 文档头标签 |
| `<Body>` / `<Head>` / `<Html>` | document.* 等价 |
| `clientOnly(loader)` | 只在客户端渲染（避免 SSR） |

```tsx
import { Title } from '@solidjs/start'

export default function Home() {
  return (
    <>
      <Title>首页 - My App</Title>
      <h1>Hello</h1>
    </>
  )
}

// clientOnly：避免 SSR
import { clientOnly } from '@solidjs/start'
const Chart = clientOnly(() => import('./Chart'))
```

## Solid Router API

### `@solidjs/router`

| API | 用途 |
|---|---|
| `<Router>` | 顶层路由 |
| `<Route path component preload>` | 单条路由 |
| `<A href activeClass end>` | 链接组件 |
| `<Navigate href>` | 立即跳转 |
| `useNavigate()` | 函数式跳转 |
| `useParams<T>()` | 路径参数 |
| `useSearchParams<T>()` | 查询参数 |
| `useLocation()` | 当前位置 |
| `useMatch(pattern)` | 匹配检查 |
| `useResolvedPath(pathFn)` | 解析相对路径 |
| `useBeforeLeave(fn)` | 离开前钩子 |
| `query(fn, key)` | 缓存查询 |
| `action(fn, name?)` | 数据 mutation |
| `createAsync(fn)` | 异步数据 + Suspense |
| `revalidate(keys)` | 失效缓存 |
| `redirect(url)` | 重定向（Response） |
| `json(data, options?)` | JSON 响应 |

### 详细示例

```tsx
import {
  Router, Route, A, Navigate,
  useNavigate, useParams, useSearchParams, useLocation,
  useMatch, useBeforeLeave,
  query, action, createAsync, revalidate,
} from '@solidjs/router'

// 链接与导航
<A href="/about" end activeClass="active">About</A>
const navigate = useNavigate()
navigate('/users/42', { replace: true })

// 参数
const params = useParams<{ id: string }>()
const [search, setSearch] = useSearchParams<{ tab?: string }>()
const location = useLocation()

// 匹配检查（拿到 reactive match）
const match = useMatch(() => '/users/:id')

// 离开守卫
useBeforeLeave((e) => {
  if (hasUnsavedChanges()) {
    if (!confirm('Discard changes?')) e.preventDefault()
  }
})

// query + action（数据流）
const getUser = query(async (id: string) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}, 'user')

const updateUser = action(async (formData: FormData) => {
  await fetch(`/api/users/${formData.get('id')}`, {
    method: 'PATCH',
    body: JSON.stringify(Object.fromEntries(formData)),
  })
}, 'updateUser')

// createAsync：拿到响应式 user
const user = createAsync(() => getUser(params.id))

// revalidate
revalidate(getUser.keyFor(params.id))
revalidate('user')          // 所有 user query 失效
revalidate(undefined)       // 全部失效
```

## 版本里程碑

| 版本 | 时间 | 关键特性 |
|---|---|---|
| **0.x** | 2018-2020 | 项目起步，Ryan Carniato 个人项目 |
| **1.0** | 2021.6 | 首个稳定版，确立 Signals + JSX 范式 |
| **1.3** | 2022.1 | Suspense / Resource 稳定 |
| **1.4** | 2022.5 | createSelector / startTransition |
| **1.5** | 2022.9 | createDeferred、useTransition |
| **1.6** | 2022.10 | 兼容 TypeScript 4.8+，refine |
| **1.7** | 2023.5 | 大量 SSR 优化（streaming、islands） |
| **1.8** | 2023.10 | hydration mismatch 修复、islands props 优化 |
| **1.9** | 2024.9 | 1.x 收官版（TypeScript / SSR / hydration polishing），衔接 2.0 |
| **2.0**（开发中） | TBD | `@solidjs/signals` 新响应式核心 / concurrent transitions / 自愈错误边界 |

| 配套库 | 当前版本 |
|---|---|
| `@solidjs/router` | 0.15.x |
| `@solidjs/start` | 1.1.x |
| `solid-js/store` | 与 solid-js 同步 |
| `vite-plugin-solid` | 2.11.x |
| `solid-devtools` | 0.30.x |
| `@solidjs/testing-library` | 0.8.x |

## 生态精选

| 类型 | 库 | 用途 |
|---|---|---|
| 元框架 | [SolidStart](https://docs.solidjs.com/solid-start) | 官方全栈 |
| 路由 | [@solidjs/router](https://github.com/solidjs/solid-router) | 官方路由 |
| 状态 | [solid-js/store](https://docs.solidjs.com/concepts/stores) | 内置 store |
| 工具集 | [Solid Primitives](https://primitives.solidjs.community/) | 官方社区维护的 useXxx 集合 |
| UI 库 | [Kobalte](https://kobalte.dev/) | Headless 无样式 |
| UI 库 | [Hope UI](https://hope-ui.com/) | Chakra 风格 |
| UI 库 | [@suid/material](https://suid.io/) | Material UI 移植 |
| UI 库 | [Park UI](https://park-ui.com/) | shadcn 风格 |
| 表单 | [modular-forms](https://modularforms.dev/) | 类型安全表单 |
| 表单 | [@felte/solid](https://felte.dev/) | 表单管理 |
| i18n | [@solid-primitives/i18n](https://primitives.solidjs.community/package/i18n) | 国际化 |
| 测试 | [@solidjs/testing-library](https://github.com/solidjs/solid-testing-library) | Vitest 集成 |
| Devtools | [solid-devtools](https://github.com/thetarnav/solid-devtools) | 浏览器扩展 |
| 数据 | [@tanstack/solid-query](https://tanstack.com/query) | 服务端状态 |
| 虚拟化 | [@tanstack/solid-virtual](https://tanstack.com/virtual) | 大列表虚拟滚动 |
| 动画 | [solid-motionone](https://motion.dev/) | Motion.dev 移植 |
| Markdown | [solid-markdown](https://github.com/andi23rosca/solid-markdown) | Markdown 渲染 |

## 错误与警告速查

| 错误 | 原因 | 解决 |
|---|---|---|
| `computations created outside a createRoot or render` | 在 owner 外创建 effect | 用 `createRoot` 包裹 |
| `Stale read from <signal>` | 在 setter 后立即读旧值 | 用 `batch` 或调整时序 |
| `Hydration mismatch` | server/client 渲染不一致 | 用 `isServer` 守卫 / `clientOnly` |
| `props is not iterable` | 解构 props | 用 `props.xxx` 或 `splitProps` |
| `Maximum call stack` | effect 内 setSignal 自己 | 用 `untrack` 或 `createRenderEffect` |

## 命令行速查

```bash
# 创建项目
pnpm create solid

# 装核心
pnpm add solid-js

# 装路由 + Start
pnpm add @solidjs/router @solidjs/start

# 装 Vite 插件（纯 Vite 项目）
pnpm add -D vite-plugin-solid

# 装 store（与 solid-js 同包，无需单独装）
import { createStore } from 'solid-js/store'

# 装测试
pnpm add -D @solidjs/testing-library vitest jsdom

# 装 devtools
pnpm add -D solid-devtools
```

## 主要文档与社区

- **官网**：[solidjs.com](https://www.solidjs.com/)
- **文档**：[docs.solidjs.com](https://docs.solidjs.com/)
- **GitHub**：[solidjs/solid](https://github.com/solidjs/solid)
- **SolidStart**：[docs.solidjs.com/solid-start](https://docs.solidjs.com/solid-start)
- **Playground**：[playground.solidjs.com](https://playground.solidjs.com/)
- **Discord**：[discord.com/invite/solidjs](https://discord.com/invite/solidjs)
- **Primitives**：[primitives.solidjs.community](https://primitives.solidjs.community/)
