---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 React 19.x 编写 —— 顶级 API / Hooks / 组件 / react-dom / TypeScript 工具类型 / 错误码 / 版本里程碑

## React 顶级 API

### 组件相关

| API | 签名 | 用途 |
|---|---|---|
| `createElement(type, props?, ...children)` | `(type, props, ...children) => ReactElement` | 创建 vnode（JSX 编译目标） |
| `cloneElement(element, props?, ...children)` | `(el, props, ...children) => ReactElement` | 克隆元素并覆盖 props |
| `isValidElement(value)` | `(any) => boolean` | 判断值是不是 React 元素 |
| `Children.map(children, fn)` | 遍历 children | 处理 `props.children` |
| `Children.forEach(children, fn)` | 遍历 children | 不收集结果 |
| `Children.count(children)` | `number` | 子节点数量 |
| `Children.only(children)` | `ReactElement` | 断言只有一个子节点 |
| `Children.toArray(children)` | `ReactElement[]` | 子节点转数组 |
| `Fragment` | 内置组件 | 多根节点容器 |
| `Profiler` | 内置组件 | 性能采集 |
| `StrictMode` | 内置组件 | 开发期严格检查 |
| `Suspense` | 内置组件 | 异步边界 |

```tsx
import { createElement, cloneElement, isValidElement, Children, Fragment } from 'react'

// createElement（极少手写，编译器自动生成）
const el = createElement('div', { className: 'box' }, 'hello')

// cloneElement
function withClass(child: React.ReactElement) {
  return cloneElement(child, { className: 'highlighted' })
}

// Children
function List({ children }) {
  return <ul>{Children.map(children, c => <li>{c}</li>)}</ul>
}
```

### 函数 API

| API | 签名 | 用途 |
|---|---|---|
| `memo(component, areEqual?)` | `Component => MemoComponent` | 缓存子组件防多余渲染 |
| `lazy(loader)` | `() => Promise<Module> => LazyComponent` | 代码分割 |
| `forwardRef(render)` | `(Component) => ForwardRefComponent` | ref 转发（React 19 后多数不需要） |
| `createContext(defaultValue)` | `(value) => Context` | 创建 Context |
| `startTransition(callback)` | `() => void` | 标记非紧急更新 |
| `cache(fn)` | `(fn) => fn`（RSC） | 服务端记忆函数返回值 |
| `act(callback)` | `(fn) => Promise` | 测试包装（同步触发） |

```tsx
import { memo, lazy, createContext, startTransition, cache } from 'react'

// memo
const ExpensiveList = memo(function ExpensiveList({ items }: Props) {
  return <ul>{items.map(...)}</ul>
})

// lazy
const Dashboard = lazy(() => import('./Dashboard'))

// createContext
const ThemeContext = createContext<'light' | 'dark'>('light')

// startTransition
startTransition(() => {
  setResults(filtered)
})

// cache（仅 Server Components）
const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } })
})
```

## Hooks 完整表

### 基础 Hooks（React 16.8+）

| Hook | 签名 | 用途 |
|---|---|---|
| `useState<T>(initial)` | `T => [T, Dispatch<SetStateAction<T>>]` | 单值状态 |
| `useEffect(fn, deps?)` | `(EffectCallback, DependencyList?) => void` | 副作用 |
| `useContext<T>(context)` | `(Context<T>) => T` | 读 Context |
| `useReducer<R, I>(reducer, init, initFn?)` | reducer + state | 状态机 |
| `useRef<T>(initial)` | `T => RefObject<T>` | 可变值 / DOM 引用 |
| `useMemo<T>(fn, deps)` | `(() => T, DependencyList) => T` | 缓存计算 |
| `useCallback<F>(fn, deps)` | `(F, DependencyList) => F` | 缓存函数 |
| `useLayoutEffect(fn, deps?)` | `(EffectCallback, DependencyList?) => void` | 同步副作用 |
| `useImperativeHandle<T, R>(ref, factory, deps?)` | ref 暴露 | 自定义 ref API |
| `useDebugValue(value, fmt?)` | `(T, formatter?) => void` | DevTools 标签 |

### React 18 新增 Hooks

| Hook | 签名 | 用途 |
|---|---|---|
| `useId()` | `() => string` | 生成稳定唯一 ID |
| `useTransition()` | `() => [boolean, (cb) => void]` | 标记 transition |
| `useDeferredValue<T>(value, initial?)` | `T => T` | 推迟值（React 19 加 initial） |
| `useSyncExternalStore<T>(subscribe, get, getServer?)` | 订阅外部 store | Redux/Zustand 适配 |

### React 19 新增 Hooks

| Hook | 签名 | 用途 |
|---|---|---|
| `use<T>(resource)` | `Promise<T> \| Context<T> => T` | 条件读取 promise / context |
| `useActionState<S, P>(action, initial)` | `[S, dispatch, isPending]` | Action + 状态聚合 |
| `useFormStatus()`（from `react-dom`） | `() => { pending, data, method, action }` | 读父 form 状态 |
| `useOptimistic<S, V>(state, reducer)` | `[S, addOptimistic]` | 乐观更新 |

### 详细签名

```tsx
// useState
const [state, setState] = useState<T>(initial: T | (() => T))
setState(next: T | ((prev: T) => T))

// useEffect
useEffect(
  effect: () => void | (() => void),  // 返回 cleanup 函数
  deps?: DependencyList
)

// useContext
const value = useContext<T>(Context: React.Context<T>)

// useReducer
const [state, dispatch] = useReducer<R extends Reducer<any, any>>(
  reducer: R,
  initial: ReducerState<R>,
  init?: (initial) => ReducerState<R>
)

// useRef
const ref = useRef<T>(initial: T): MutableRefObject<T>
const ref = useRef<T>(null): RefObject<T>

// useMemo
const value = useMemo<T>(factory: () => T, deps: DependencyList): T

// useCallback
const cb = useCallback<F extends Function>(fn: F, deps: DependencyList): F

// useLayoutEffect
useLayoutEffect(effect: () => void | (() => void), deps?: DependencyList)

// useImperativeHandle
useImperativeHandle<T, R extends T>(
  ref: Ref<T>,
  init: () => R,
  deps?: DependencyList
)

// useId
const id = useId(): string

// useTransition
const [isPending, startTransition] = useTransition(): [boolean, TransitionStartFunction]

// useDeferredValue
const deferred = useDeferredValue<T>(value: T, initialValue?: T): T

// useSyncExternalStore
const value = useSyncExternalStore<T>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
): T

// useDebugValue
useDebugValue<T>(value: T, format?: (value: T) => any)

// React 19: use
const value = use<T>(resource: Promise<T> | Context<T>): T

// React 19: useActionState
const [state, formAction, isPending] = useActionState<State, Payload>(
  action: (prev: State, payload: Payload) => Promise<State> | State,
  initialState: State,
  permalink?: string
)

// React 19: useFormStatus (from react-dom!)
const { pending, data, method, action } = useFormStatus(): {
  pending: boolean
  data: FormData | null
  method: 'get' | 'post' | null
  action: string | ((formData: FormData) => void | Promise<void>) | null
}

// React 19: useOptimistic
const [optimisticState, addOptimistic] = useOptimistic<State, Optimistic>(
  state: State,
  reducer?: (state: State, optimistic: Optimistic) => State
)
```

## 内置组件

### `<Fragment>` / `<>`

```tsx
import { Fragment } from 'react'

<>
  <h1>Title</h1>
  <p>Body</p>
</>

// 需要 key 时用 Fragment
<Fragment key={item.id}>
  <dt>{item.label}</dt>
  <dd>{item.value}</dd>
</Fragment>
```

### `<StrictMode>`

```tsx
<StrictMode>
  <App />
</StrictMode>
```

开发期检查（生产不生效）：双调用 setter / effect / 组件函数；检测废弃 API；检测 ref 错用。

### `<Suspense>`

```tsx
<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>

// React 19 完整 props
<Suspense
  fallback={<Spinner />}
  // name?: string  仅 dev 用，profiler 里显示
>
  ...
</Suspense>
```

### `<Profiler>`

```tsx
<Profiler id="App" onRender={onRender}>
  <App />
</Profiler>

function onRender(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  // 上报性能
}
```

## react-dom 顶级 API

### `react-dom/client`

| API | 签名 | 用途 |
|---|---|---|
| `createRoot(container, options?)` | `(Element, RootOptions?) => Root` | 创建客户端根 |
| `hydrateRoot(container, element, options?)` | `(Element, ReactNode, HydrationOptions?) => Root` | SSR 水合 |
| `root.render(element)` | 渲染 | 渲染到根 |
| `root.unmount()` | 卸载 | 卸载整个树 |

```tsx
import { createRoot, hydrateRoot } from 'react-dom/client'

// 客户端首次渲染
const root = createRoot(document.getElementById('root')!, {
  onCaughtError: (error, info) => { /* 错误边界捕获后 */ },
  onUncaughtError: (error, info) => { /* 没被边界捕获 */ },
  onRecoverableError: (error) => { /* 可恢复错误 */ },
  identifierPrefix: 'app-',  // useId 前缀
})
root.render(<App />)

// SSR 水合
hydrateRoot(document.getElementById('root')!, <App />, {
  onCaughtError, onUncaughtError, onRecoverableError,
})

// 卸载
root.unmount()
```

### `react-dom`

| API | 签名 | 用途 |
|---|---|---|
| `createPortal(children, container, key?)` | Portal 渲染 | 跨 DOM 层级 |
| `flushSync(callback)` | 同步刷新更新 | 强制同步渲染 |
| `prefetchDNS(href)` | DNS 预查 | 加速后续请求 |
| `preconnect(href, options?)` | 提前建立连接 | 加速后续请求 |
| `preload(href, options)` | 预加载资源 | 字体 / 样式 / 脚本 |
| `preloadModule(href, options)` | 预加载 ESM 模块 | 模块预加载 |
| `preinit(href, options)` | 预加载并执行 | script / stylesheet |
| `preinitModule(href, options)` | 预加载并执行 ESM | module |

```tsx
import { createPortal, flushSync } from 'react-dom'
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom'

// Portal
function Modal({ children }) {
  return createPortal(children, document.getElementById('modal-root')!)
}

// flushSync（极少用）
flushSync(() => {
  setCount(c => c + 1)
})
// 同步完成 DOM 更新

// 资源预加载（通常在 RSC 中）
preload('/font.woff2', { as: 'font', crossOrigin: 'anonymous' })
preinit('/critical.css', { as: 'style' })
preconnect('https://api.example.com')
prefetchDNS('https://cdn.example.com')
```

### `react-dom/server`

| API | 签名 | 用途 |
|---|---|---|
| `renderToString(element, options?)` | `=> string` | 同步渲染（旧，不推荐） |
| `renderToStaticMarkup(element)` | `=> string` | 同上但不含 hydration 标记 |
| `renderToReadableStream(element, options?)` | `=> Promise<ReadableStream>` | Web Streams（Cloudflare Workers/Deno） |
| `renderToPipeableStream(element, options?)` | `=> { pipe, abort }` | Node.js 流（Express 等） |
| `renderToNodeStream` | **已移除**（React 19） | — |
| `renderToStaticNodeStream` | **已移除**（React 19） | — |

```tsx
import { renderToString } from 'react-dom/server'

// 旧式同步 SSR
const html = renderToString(<App />)
res.send(`<!DOCTYPE html><html><body><div id="root">${html}</div></body></html>`)
```

```tsx
import { renderToPipeableStream } from 'react-dom/server'

// 流式 SSR（Node.js）
app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      res.setHeader('content-type', 'text/html')
      pipe(res)
    },
    onError(error) { console.error(error) },
  })
})
```

```tsx
import { renderToReadableStream } from 'react-dom/server'

// 流式 SSR（Web Streams：Cloudflare Workers / Deno / Bun）
export default {
  async fetch(req: Request) {
    const stream = await renderToReadableStream(<App />, {
      bootstrapScripts: ['/main.js'],
    })
    return new Response(stream, { headers: { 'content-type': 'text/html' } })
  },
}
```

### `react-dom/static`（React 19 新）

| API | 用途 |
|---|---|
| `prerender(element, options?)` | 静态预渲染（Web Streams） |
| `prerenderToNodeStream(element, options?)` | 静态预渲染（Node Stream） |

```tsx
import { prerender } from 'react-dom/static'

async function buildSSG() {
  const { prelude } = await prerender(<App />, {
    bootstrapScripts: ['/main.js'],
  })
  await fs.writeFile('dist/index.html', prelude)
}
```

与 `renderToReadableStream` 区别：`prerender` 会**等所有数据完成**才返回（适合 SSG / Edge Cache）；`renderToReadableStream` 边渲染边发（适合实时 SSR）。

### `react-dom`（已移除 API）

React 19 移除：

| 旧 API | 替代 |
|---|---|
| `render(element, container)` | `createRoot(container).render(element)` |
| `hydrate(element, container)` | `hydrateRoot(container, element)` |
| `unmountComponentAtNode(container)` | `root.unmount()` |
| `findDOMNode(component)` | 用 ref |
| `renderToNodeStream` | `renderToPipeableStream` |
| `renderToStaticNodeStream` | `renderToString` + `renderToStaticMarkup` |

## 指令（Directives）

React 19 引入两个文件级指令：

| 指令 | 位置 | 含义 |
|---|---|---|
| `'use client'` | 文件顶部 | 该文件及其导入的代码进客户端 bundle |
| `'use server'` | 文件顶部 / 函数顶部 | 该函数是 Server Action，可从客户端调用 |

```tsx
// 1. 'use client' 在文件顶部
'use client'

import { useState } from 'react'

export function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
```

```ts
// 2. 'use server' 在文件顶部
'use server'

import { db } from '@/lib/db'

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') as string } })
}
```

```ts
// 3. 'use server' 在函数顶部（inline server function）
import { db } from '@/lib/db'

export default async function Page() {
  async function createPost(formData: FormData) {
    'use server'
    await db.post.create({ data: { title: formData.get('title') as string } })
  }

  return <form action={createPost}><input name="title" /></form>
}
```

::: warning Compiler 指令
另外两个指令仅 Compiler 识别：

- `'use memo'` —— 强制 Compiler 编译该函数
- `'use no memo'` —— 跳过 Compiler 优化（兜底）

写法同：函数顶部一行字符串。
:::

## TypeScript 工具类型

### Element / Component / Children

| 类型 | 含义 |
|---|---|
| `ReactNode` | 任何能渲染的东西（元素、字符串、数字、null、数组） |
| `ReactElement` | JSX element 对象 |
| `JSX.Element` | 同 ReactElement（更常见） |
| `ReactChild` | 旧别名（已废弃） |
| `PropsWithChildren<P>` | `P & { children?: ReactNode }` |
| `ComponentProps<T>` | 提取组件 / HTML 元素的 props 类型 |
| `ComponentPropsWithRef<T>` | 含 ref |
| `ComponentPropsWithoutRef<T>` | 不含 ref |
| `ComponentType<P>` | 任意组件（FC / Class） |
| `FunctionComponent<P>` / `FC<P>` | 函数组件（不推荐） |
| `ElementRef<T>` | 元素 ref 类型 |
| `ElementType` | 任意 element 类型字符串或组件 |
| `JSXElementConstructor<P>` | JSX 构造器（函数组件 / Class 组件） |

```tsx
// 用法举例
type ButtonProps = React.ComponentProps<'button'>
type CustomButtonProps = React.ComponentProps<typeof CustomButton>

type LayoutProps = React.PropsWithChildren<{ title: string }>

function Layout({ title, children }: LayoutProps) { ... }

// ElementRef
const ref = useRef<React.ElementRef<typeof MyInput>>(null)
// 等价于
const ref = useRef<HTMLInputElement>(null)
```

### Event 类型

| 类型 | 用途 |
|---|---|
| `SyntheticEvent<T>` | 所有合成事件基类 |
| `MouseEvent<T>` | 鼠标事件 |
| `KeyboardEvent<T>` | 键盘事件 |
| `ChangeEvent<T>` | input/select/textarea change |
| `FormEvent<T>` | form 事件 |
| `FocusEvent<T>` | focus/blur |
| `TouchEvent<T>` | 触摸事件 |
| `DragEvent<T>` | 拖拽事件 |
| `WheelEvent<T>` | 滚轮 |
| `ClipboardEvent<T>` | 剪切板 |
| `PointerEvent<T>` | 指针 |
| `AnimationEvent<T>` | 动画 |
| `TransitionEvent<T>` | 过渡 |
| `UIEvent<T>` | 滚动等 |

Handler 类型（每个 Event 都有对应的 `XxxEventHandler<T>`）：

```tsx
const handler: React.MouseEventHandler<HTMLButtonElement> = e => { ... }
const onChange: React.ChangeEventHandler<HTMLInputElement> = e => { ... }
const onSubmit: React.FormEventHandler<HTMLFormElement> = e => { ... }
```

### Ref 类型

| 类型 | 含义 |
|---|---|
| `Ref<T>` | 联合类型（callback / RefObject） |
| `RefObject<T>` | `{ readonly current: T \| null }` |
| `MutableRefObject<T>` | `{ current: T }` |
| `RefCallback<T>` | `(node: T \| null) => void \| (() => void)` |
| `ForwardedRef<T>` | forwardRef 第二参数类型 |
| `LegacyRef<T>` | 旧风格 ref（兼容） |

### HTML / SVG 属性类型

| 类型 | 用途 |
|---|---|
| `HTMLAttributes<T>` | 任意 HTML 元素属性 |
| `HTMLProps<T>` | 旧别名 |
| `DetailedHTMLProps<A, T>` | 含 ref 的 HTML props |
| `ButtonHTMLAttributes<T>` | `<button>` 专属 |
| `InputHTMLAttributes<T>` | `<input>` 专属 |
| `AnchorHTMLAttributes<T>` | `<a>` 专属 |
| `ImgHTMLAttributes<T>` | `<img>` 专属 |
| `SVGAttributes<T>` | SVG 元素 |
| `CSSProperties` | style 对象类型 |

```tsx
// 复用原生属性 + 加自定义
interface MyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

function MyButton({ variant, ...rest }: MyButtonProps) {
  return <button className={variant} {...rest} />
}
```

### useState / useReducer 类型

```tsx
// useState
const [state, setState] = useState<T>(initial)
type Dispatch<A> = (value: A) => void
type SetStateAction<S> = S | ((prev: S) => S)
// 所以 setState: Dispatch<SetStateAction<T>>

// useReducer
const [state, dispatch] = useReducer<R extends Reducer<any, any>>(reducer, initial)
type Reducer<S, A> = (prevState: S, action: A) => S
type ReducerState<R> = R extends Reducer<infer S, any> ? S : never
type ReducerAction<R> = R extends Reducer<any, infer A> ? A : never
```

### Context 类型

```tsx
import { createContext, type Context } from 'react'

const ThemeContext = createContext<'light' | 'dark'>('light')

// 类型
Context<T> = {
  Provider: Provider<T>
  Consumer: Consumer<T>
  displayName?: string
}
```

## Hooks 详细 API

### useState

```tsx
// 1. 简单初值
const [count, setCount] = useState(0)

// 2. 类型化（推荐显式给类型）
const [user, setUser] = useState<User | null>(null)

// 3. 懒初始化
const [data, setData] = useState(() => expensiveCompute())

// 4. 函数式更新（避免闭包过期值）
setCount(prev => prev + 1)
```

### useEffect

```tsx
// 1. 仅挂载
useEffect(() => { fetchData() }, [])

// 2. 依赖变化时
useEffect(() => { sync(user) }, [user])

// 3. 含 cleanup
useEffect(() => {
  const timer = setInterval(() => tick(), 1000)
  return () => clearInterval(timer)
}, [])

// 4. 异步（不能直接 async function）
useEffect(() => {
  async function load() {
    const data = await fetchData()
    setData(data)
  }
  load()
}, [])
```

### useReducer

```tsx
type Action = { type: 'inc' } | { type: 'set'; value: number }

const reducer = (state: number, action: Action): number => {
  switch (action.type) {
    case 'inc': return state + 1
    case 'set': return action.value
  }
}

const [count, dispatch] = useReducer(reducer, 0)

// 懒初始化
const [count, dispatch] = useReducer(reducer, props.initialCount, c => c * 2)
```

### useRef

```tsx
// 1. DOM ref
const ref = useRef<HTMLInputElement>(null)

// 2. 可变值（不重渲染）
const intervalRef = useRef<number | null>(null)

// 3. 持有可变实例
const mapRef = useRef<Map<string, any>>(new Map())
```

### useMemo / useCallback

```tsx
const computed = useMemo(() => heavy(data), [data])
const stableFn = useCallback((x: number) => x * 2, [])

// 类型化函数 useCallback
const handler = useCallback<(e: React.MouseEvent) => void>(e => {
  e.preventDefault()
}, [])
```

### useLayoutEffect

```tsx
useLayoutEffect(() => {
  // 同步在 DOM 提交后、绘制前跑
  const height = ref.current?.getBoundingClientRect().height
  setHeight(height ?? 0)
}, [])
```

### useImperativeHandle

```tsx
interface Handle {
  focus: () => void
}

function MyInput({ ref }: { ref?: React.Ref<Handle> }) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }), [])

  return <input ref={inputRef} />
}
```

### useTransition

```tsx
const [isPending, startTransition] = useTransition()

// 同步
startTransition(() => {
  setQuery(value)
})

// 异步（React 19+）
startTransition(async () => {
  const result = await save()
  setResult(result)
})
```

### useDeferredValue

```tsx
// 基础
const deferred = useDeferredValue(value)

// React 19 加 initialValue
const deferred = useDeferredValue(value, '')
```

### useSyncExternalStore

```tsx
const value = useSyncExternalStore(
  subscribe: (notify) => unsubscribe,
  getSnapshot: () => state,
  getServerSnapshot?: () => state   // SSR
)

// 例：订阅 window.matchMedia
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    cb => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false   // SSR fallback
  )
}
```

### use（React 19）

```tsx
// 读 promise
const data = use(promise)

// 读 context（可在条件中调用）
if (cond) {
  const theme = use(ThemeContext)
}
```

### useActionState（React 19）

```tsx
const [state, formAction, isPending] = useActionState(
  async (prev, formData) => { return newState },
  initialState
)

// formAction 可直接传给 form
<form action={formAction}>...</form>
```

### useFormStatus（React 19，from `react-dom`）

```tsx
import { useFormStatus } from 'react-dom'

function Submit() {
  const { pending, data, method, action } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}
```

### useOptimistic（React 19）

```tsx
const [optimistic, addOptimistic] = useOptimistic(
  realState,
  (state, optimisticValue) => [...state, optimisticValue]
)

// 在 action 内调用
addOptimistic(newItem)
```

## Form Action API

React 19 让 `<form>` 一等公民：

```tsx
<form
  action={fn | string}      // 函数 = Action，字符串 = 标准 URL
  method="post"             // 默认 get
  encType="multipart/form-data"
>
  <input name="email" />
  <button type="submit" formAction={overrideFn}>Submit</button>
</form>
```

`<button formAction={fn}>` 可以覆盖外层 form 的 action。

## React Compiler 配置

```js
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      target: '19',                // '17' | '18' | '19'
      compilationMode: 'infer',    // 'infer' | 'all' | 'annotation' | 'syntax'
      sources: (filename) => true, // 选定要编译的文件
      runtimeModule: 'react/compiler-runtime',
      panicThreshold: 'critical_errors',  // 错误阈值
      logger: console,             // 日志
    }],
  ],
}
```

```bash
# 安装
pnpm add -D babel-plugin-react-compiler@latest
pnpm add -D eslint-plugin-react-hooks@latest

# React 17/18 还要装 runtime
pnpm add react-compiler-runtime@latest
```

ESLint 配置：

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  reactHooks.configs['recommended-latest'],
]
```

## 错误码对照（部分）

| Error # | 含义 | 常见原因 |
|---|---|---|
| **#31** | `Objects are not valid as a React child` | 直接渲染对象（用 JSON.stringify） |
| **#130** | Element type is invalid | import/export 错（默认 vs 命名） |
| **#185** | Maximum update depth exceeded | render 内 setState 引发无限循环 |
| **#188** | render is not a function | 导出错误 |
| **#291** | `Cannot read properties of null` | DOM ref 未挂载就访问 |
| **#300** | `Rendered more hooks than during the previous render` | hooks 调用顺序变了 |
| **#310** | `Rendered fewer hooks than expected` | 同上 |
| **#321** | Invalid hook call | hook 写在普通函数里 |
| **#418** | Hydration mismatch | SSR HTML 与客户端不一致 |
| **#419** | Hydration failed because the server rendered HTML didn't match | 同上 |
| **#420** | Hook setState 在已卸载组件上调用 | 漏 cleanup |
| **#421** | This Suspense boundary received an update before it finished hydrating | 水合中触发更新 |
| **#422** | Cannot read property of undefined while suspending | promise 引用问题 |
| **#423** | Maximum update depth in Suspense | Suspense 内无限渲染循环 |
| **#425** | Server response did not finish | 流式 SSR 中断 |

完整列表：[react.dev/errors](https://react.dev/errors)。

## 版本里程碑

| 版本 | 日期 | 重要变化 |
|---|---|---|
| **0.3.0** | 2013.05 | 首次开源 |
| **0.14** | 2015.10 | 拆 `react-dom` |
| **15** | 2016.04 | 完善 SVG 支持 |
| **16** | 2017.09 | **Fiber Reconciler** 重写、错误边界、Portal、Fragment |
| **16.3** | 2018.03 | `createRef` / `forwardRef` / 新 Context API |
| **16.6** | 2018.10 | `React.memo` / `React.lazy` / Suspense（仅 lazy） |
| **16.8** | 2019.02 | **Hooks** |
| **17** | 2020.10 | 事件委托改到 root、JSX 新转译 |
| **18** | 2022.03 | **Concurrent Rendering**、`createRoot`、自动 batching、`useTransition` / `useDeferredValue` / `useId` / `useSyncExternalStore` |
| **18.3** | 2024.04 | 警告升级（为 19 铺路） |
| **19** | 2024.12 | **Server Components 稳定**、Actions、`use` API、ref as prop、Context as Provider、Document Metadata、Asset Loading |
| **19.1** | 2025.03 | Owner Stack（DevTools 调用栈）、`useId` 默认前缀 |
| **React Compiler RC** | 2025.04 | 进入 RC，eslint-plugin-react-hooks 合并 |

## React DevTools

```bash
# Chrome / Firefox / Edge 扩展
# 或独立 app：
pnpm add -g react-devtools
react-devtools
```

**面板**：

| 面板 | 用途 |
|---|---|
| **Components** | 查看组件树 / props / state / hooks |
| **Profiler** | 性能录制 + flame graph |
| **Settings → General** | 高亮重渲染、组件过滤 |
| **Settings → Components** | 调试组件名显示规则 |
| **Settings → Profiler** | 录制选项 |

**Components 面板技巧**：

- 选中组件 → 右侧看 props / hooks（hooks 按 useXxx 排序）
- 右键组件 → "Log this component data"
- 右键组件 → "View source for this element"（跳到代码）
- `$r` 在控制台 = 当前选中组件实例

**Profiler 技巧**：

- Settings → Profiler → "Record why each component rendered" 开启
- 录制后看 commits，每个 commit 内点组件看 "Why did this render?"

## 常见类型 cheatsheet

```tsx
// 1. 函数组件 props
function MyComponent({ name, age = 18, onSave, children }: {
  name: string
  age?: number
  onSave?: (data: Data) => void
  children?: React.ReactNode
}) { ... }

// 2. 接受任意 button props + 加额外
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

// 3. 多态组件（as prop）
type AsProp<C extends React.ElementType> = { as?: C }
type PolymorphicProps<C extends React.ElementType> =
  AsProp<C> & React.ComponentPropsWithoutRef<C>

function Box<C extends React.ElementType = 'div'>({
  as,
  ...rest
}: PolymorphicProps<C>) {
  const Component = as || 'div'
  return <Component {...rest} />
}

// 使用
<Box as="section" />
<Box as="a" href="..." />

// 4. 受控/非受控 union
type ControlledProps = { value: string; onChange: (v: string) => void }
type UncontrolledProps = { defaultValue?: string }
type InputProps = ControlledProps | UncontrolledProps

// 5. 提取 useState setter 类型
const [v, setV] = useState<number>(0)
type SetV = typeof setV   // Dispatch<SetStateAction<number>>

// 6. 提取组件 props
type MyButtonProps = React.ComponentProps<typeof MyButton>

// 7. forwardRef（React 19 后多数不需要）
const MyInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input ref={ref} {...props} />
))

// 8. 泛型组件
function List<T>({
  items,
  render,
}: {
  items: T[]
  render: (item: T) => React.ReactNode
}) {
  return <ul>{items.map((it, i) => <li key={i}>{render(it)}</li>)}</ul>
}
```

## 与 React 18 的关键差异（速查）

| 特性 | React 18 | React 19 |
|---|---|---|
| ref 传递 | `forwardRef` 包裹 | ref 当 prop 直接传 |
| Context Provider | `<Ctx.Provider value=...>` | `<Ctx value=...>`（兼容旧的） |
| `useFormState` | 在 `react-dom` | `useActionState`（在 `react`） |
| `act` 导入 | `react-dom/test-utils` | `react` |
| Document Metadata | 需 react-helmet | 原生支持 `<title>` / `<meta>` / `<link>` |
| 资源预加载 | 无 | `preinit` / `preload` / `preconnect` / `prefetchDNS` |
| Form Action | 无 | `<form action={fn}>` |
| `use(promise)` | 无 | ✅ |
| `useOptimistic` | 无 | ✅ |
| Custom Elements | 部分（属性当 attribute） | 完整（区分 prop / attribute） |
| Hydration 错误 | 多条警告 | 单条 + diff |
| Server Components | 实验（仅 Next.js） | 稳定 |
| `prerender` API | 无 | `react-dom/static` 新增 |
| 已移除 | — | `render` / `hydrate` / `findDOMNode` / `unmountComponentAtNode` / `renderToNodeStream` |

## React 生态包速查

| 包 | 用途 |
|---|---|
| `react` | 核心 |
| `react-dom` | Web 渲染 |
| `react-dom/client` | 客户端 root |
| `react-dom/server` | SSR |
| `react-dom/static` | SSG（React 19） |
| `react-native` | Native 渲染 |
| `react-test-renderer` | 测试用（ReactDOM 替代） |
| `react-reconciler` | 自定义 host 用 |
| `scheduler` | 内部调度器 |
| `react-server` | Server Components 内部用 |
| `react-server-dom-webpack` | Webpack 端 RSC |
| `react-server-dom-turbopack` | Turbopack 端 RSC |
| `react-compiler-runtime` | Compiler runtime（React 17/18） |
| `babel-plugin-react-compiler` | Compiler Babel 插件 |
| `eslint-plugin-react-hooks` | Hooks + Compiler 规则 |

## 速查清单

写代码时常去查的：

- Hooks 完整签名（特别是 React 19 新 hooks）
- Event 类型（哪个事件用哪个类型）
- HTMLAttributes 系列（继承原生元素属性）
- react-dom 顶级 API（创建 root / Portal / 流式 SSR）
- Error #418 / #185 / #310 等高频错误码
- React 18 → 19 迁移要点（forwardRef / useFormState / context provider）
- React Compiler 配置

至此 React 19 完整笔记结束。
