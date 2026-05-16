---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 React 19.x 编写 —— Hooks 全篇、JSX 深入、组件复用、错误处理、性能基础

## 速查

- 内置 Hooks（React 18 及之前）：`useState` / `useEffect` / `useContext` / `useReducer` / `useRef` / `useMemo` / `useCallback` / `useLayoutEffect` / `useImperativeHandle` / `useDebugValue` / `useId` / `useTransition` / `useDeferredValue` / `useSyncExternalStore`
- React 19 新 Hooks：`use` / `useActionState` / `useFormStatus` / `useOptimistic`
- 内置组件：`<Fragment>` / `<>` / `<Suspense>` / `<StrictMode>` / `<Profiler>` / `ErrorBoundary`（需自己实现或装库）
- 顶级 API：`createContext` / `lazy` / `memo` / `startTransition` / `cache`（RSC）
- 工具：`forwardRef`（React 19 后多数场景可去掉，直接把 ref 当 prop）
- 自定义 Hook 命名必须 `useXxx`，否则 ESLint hooks 规则不识别

## 完整 Hooks 篇

### `useState` —— 单值状态

```tsx
const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

// 初始值需要计算成本高：用 lazy initializer
const [list, setList] = useState(() => loadFromLocalStorage())
```

**状态更新两种方式**：

```tsx
// 直接值
setCount(count + 1)

// 函数式（连续更新时用）
setCount(prev => prev + 1)

// 批量连续更新场景：
function handleClick() {
  setCount(c => c + 1)   // 0 → 1
  setCount(c => c + 1)   // 1 → 2
  setCount(c => c + 1)   // 2 → 3
}
// 如果写成 setCount(count + 1) 三次，结果还是 1（闭包过期）
```

**对象 / 数组状态：要不可变更新**：

```tsx
// ❌ 直接修改
user.name = 'Bob'
setUser(user)   // 引用没变，React 不会更新

// ✅ 新对象
setUser({ ...user, name: 'Bob' })

// ❌ 直接 push
list.push(item)
setList(list)

// ✅ 新数组
setList([...list, item])
setList(list.filter(x => x.id !== id))
setList(list.map(x => x.id === id ? { ...x, done: true } : x))
```

::: tip 复杂状态用 useReducer 或 Immer
深层嵌套状态用 `useReducer` 更清晰，或者上 `immer` / `use-immer` 让你写「看似可变」的代码：

```tsx
import { useImmer } from 'use-immer'

const [user, updateUser] = useImmer({ name: 'A', address: { city: 'NY' } })
updateUser(draft => { draft.address.city = 'LA' })
```
:::

### `useEffect` —— 副作用（含 cleanup）

```tsx
useEffect(() => {
  // 副作用：订阅 / 取数据 / 操作 DOM
  const timer = setInterval(() => console.log('tick'), 1000)

  // 清理函数：组件卸载或依赖变化前跑
  return () => clearInterval(timer)
}, [])
```

**依赖数组完整规则**：

| 写法 | 何时跑 | 用途 |
|---|---|---|
| `useEffect(fn)` | 每次渲染后 | 几乎不用（性能差） |
| `useEffect(fn, [])` | 仅挂载时一次 | 一次性初始化（订阅、AbortController） |
| `useEffect(fn, [a, b])` | a 或 b 变化时 | 响应依赖变化 |

**StrictMode 双调用陷阱**：

```tsx
useEffect(() => {
  console.log('mounted')   // 开发期会打印两次
  fetchData()
  return () => console.log('cleanup')
}, [])
```

StrictMode 在开发期故意 mount → cleanup → mount，目的是逼你写正确的 cleanup。修复方法：**让 effect 可以跑两次**。

```tsx
useEffect(() => {
  const controller = new AbortController()
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(e => { if (e.name !== 'AbortError') throw e })
  return () => controller.abort()
}, [])
```

**Effect 不要做的事**：

- ❌ **派生状态**——用 `useMemo` 或直接渲染时算
  ```tsx
  // ❌
  useEffect(() => setFullName(`${first} ${last}`), [first, last])
  // ✅
  const fullName = `${first} ${last}`
  ```

- ❌ **响应用户事件**——直接在事件处理器里写
  ```tsx
  // ❌ click 时设 state，再 effect 里 POST
  useEffect(() => { if (submitting) post(data) }, [submitting])
  // ✅
  const handleClick = () => post(data)
  ```

- ❌ **链式 effect**——直接计算
  ```tsx
  // ❌ effect 串联多个 setState
  useEffect(() => setB(a + 1), [a])
  useEffect(() => setC(b + 1), [b])
  // ✅
  const b = a + 1
  const c = b + 1
  ```

详见 React 官方 [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)。

### `useContext` —— 跨层级读值

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

// React 19：直接 <ThemeContext value="dark"> 即可
function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  )
}

// React 18 及之前：必须用 .Provider
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  )
}

function DeepChild() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>...</div>
}
```

**Context 的两个坑**：

1. **Provider value 引用变 → 所有消费组件都重渲染**——把 value memo 起来：
   ```tsx
   const value = useMemo(() => ({ user, setUser }), [user])
   <UserContext value={value}>
   ```

2. **不适合频繁更新的全局状态**——用 Zustand / Jotai 等更高效的方案。Context 适合「主题、用户身份、i18n」这种低频变化的值。

### `useReducer` —— 复杂状态机

```tsx
type State = { count: number; step: number }
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; step: number }
  | { type: 'reset' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step }
    case 'decrement': return { ...state, count: state.count - state.step }
    case 'setStep': return { ...state, step: action.step }
    case 'reset': return { count: 0, step: 1 }
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 })

  return (
    <>
      <p>Count: {state.count}, Step: {state.step}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'setStep', step: 5 })}>Step=5</button>
    </>
  )
}
```

**何时用 `useReducer`** vs `useState`：

- 多个相互关联的字段 → `useReducer`
- 下一个状态依赖前一个状态 → `useReducer`
- 复杂状态机（loading / success / error 多分支）→ `useReducer`
- 简单单字段 → `useState`

### `useRef` —— 跨渲染保留可变值

两种用途：

**1. 持有 DOM 节点**：

```tsx
function FocusInput() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return <input ref={ref} />
}
```

**2. 跨渲染保留任意值（不触发重渲染）**：

```tsx
function ChatRoom() {
  const renderCount = useRef(0)
  renderCount.current++   // 改这个不会触发重渲染

  const intervalRef = useRef<number | null>(null)

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => console.log('tick'), 1000)
  }
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  return <button onClick={startTimer}>Start</button>
}
```

**`useRef` vs `useState`**：

| 维度 | `useRef` | `useState` |
|---|---|---|
| 改变后重渲染 | ❌ 不 | ✅ 会 |
| 读取方式 | `ref.current` | 直接读变量 |
| 适合场景 | DOM、计时器、上次值、不影响 UI 的可变值 | UI 显示的状态 |

### `useMemo` —— 缓存计算

```tsx
function TodoList({ todos, filter }: Props) {
  // 仅当 todos / filter 变化时重新过滤
  const visibleTodos = useMemo(
    () => todos.filter(t => t.status === filter),
    [todos, filter]
  )

  return <ul>{visibleTodos.map(...)}</ul>
}
```

**`useMemo` 适用场景**：

- 计算成本高（O(n²) 以上、大列表过滤排序）
- 引用稳定避免子组件重渲染（配合 `React.memo`）
- **React 19 + Compiler 后多数手写 `useMemo` 不再必要**——Compiler 自动 memo

::: warning useMemo 不是免费的
`useMemo` 本身有缓存成本（创建依赖数组、比较）；对于轻量计算，**不加 useMemo 反而更快**。规则：
- 优先不加，profiler 看到瓶颈再加
- 加之前确认计算确实重——`console.time` 量过
:::

### `useCallback` —— 缓存函数

`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`：

```tsx
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])   // 函数引用恒定

// 主要用途：传给 React.memo 的子组件
<MemoizedChild onClick={handleClick} />
```

**何时真正需要 `useCallback`**：

1. 子组件被 `React.memo` 包裹了
2. 子组件用 `useEffect` 监听了这个 callback 做依赖
3. **不满足以上两条 → 不需要**

### `useLayoutEffect` —— 同步副作用

执行时机比 `useEffect` 早：在 DOM 更新后、浏览器绘制前**同步执行**。

```tsx
function Tooltip({ children }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    // 同步读 DOM 尺寸，然后调整位置
    const h = ref.current!.getBoundingClientRect().height
    setHeight(h)
  }, [])

  return <div ref={ref} style={{ marginTop: -height }}>{children}</div>
}
```

**`useLayoutEffect` vs `useEffect`**：

| | `useLayoutEffect` | `useEffect` |
|---|---|---|
| 时机 | DOM 提交后、绘制前 | 提交并绘制后 |
| 阻塞绘制 | ✅ 阻塞 | ❌ 不阻塞 |
| SSR | ❌ 不跑（会有警告） | ✅ 跑 |
| 用途 | 读 DOM 尺寸/位置后立即调整 | 取数据、订阅等 |

**99% 场景用 `useEffect`**——只有读 DOM 几何信息后必须立即调整、避免视觉闪烁时才用 `useLayoutEffect`。

### `useImperativeHandle` —— 自定义暴露 ref

让父组件通过 ref 访问子组件的「特定方法」而不是整个 DOM：

```tsx
import { useImperativeHandle, useRef } from 'react'

interface InputHandle {
  focus: () => void
  clear: () => void
}

// React 19：直接接 ref prop
function MyInput({ ref }: { ref: React.Ref<InputHandle> }) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = '' },
  }), [])

  return <input ref={inputRef} />
}

// 使用
function App() {
  const handle = useRef<InputHandle>(null)
  return (
    <>
      <MyInput ref={handle} />
      <button onClick={() => handle.current?.focus()}>Focus</button>
      <button onClick={() => handle.current?.clear()}>Clear</button>
    </>
  )
}
```

### `useId` —— 唯一 ID 生成

```tsx
function Form() {
  const id = useId()
  return (
    <>
      <label htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} />
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} />
    </>
  )
}
```

**`useId` 关键点**：

- SSR 友好——服务端和客户端生成一致 ID
- 不要把 `useId` 当列表 key（key 应该是数据里的稳定字段）
- 多个相关 ID 共用一个 `useId` 加后缀（如 `${id}-label`、`${id}-input`）

### `useTransition` —— 标记非紧急更新

```tsx
import { useTransition, useState } from 'react'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)   // 紧急更新（输入框立刻显示）

    startTransition(() => {
      setResults(search(value))   // 非紧急更新（大列表过滤）
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultList results={results} />
    </>
  )
}
```

**`useTransition` 含义**：

- React 把更新分两个优先级：紧急（输入、点击）和非紧急（搜索结果、路由切换）
- 非紧急更新可以被打断；紧急更新插队执行
- `isPending` = true 表示有 transition 正在进行

### `useDeferredValue` —— 延迟某个值

```tsx
function SearchPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // results 跟随 deferredQuery 慢一拍变化
  const results = useMemo(() => search(deferredQuery), [deferredQuery])

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ResultList results={results} />
    </>
  )
}
```

**`useDeferredValue` 与 `useTransition` 区别**：

- `useTransition`：你**主动**把某些更新包进 `startTransition`
- `useDeferredValue`：你**被动**接收某个值，让 React 延迟它

React 19 新增 `initialValue` 参数（首次渲染时返回的初值）：

```tsx
const value = useDeferredValue(query, '')
```

### `useSyncExternalStore` —— 订阅外部 store

让 React 安全订阅外部状态源（Redux / Zustand 之类）：

```tsx
import { useSyncExternalStore } from 'react'

// 自己写订阅 window.matchMedia
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    callback => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false   // SSR snapshot
  )
}

// 使用
const isMobile = useMediaQuery('(max-width: 768px)')
```

普通业务代码很少直接用，**主要给状态库作者用**。

### `useDebugValue` —— DevTools 标签

```tsx
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(...)
  useDebugValue(isOnline ? 'Online' : 'Offline')
  return isOnline
}
```

打开 React DevTools 在 Hooks 列表里看到自定义 hook 时显示这个 label。

## React 19 新 Hooks

### `use` —— 条件读资源（promise / context）

`use` 是 React 19 引入的特殊「Hook」（其实可以在条件分支里调用），统一资源读取：

**读 Promise（配合 Suspense）**：

```tsx
import { use, Suspense } from 'react'

// 父组件传 Promise 进来
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)   // 等待 promise resolve
  return (
    <ul>
      {comments.map(c => <li key={c.id}>{c.text}</li>)}
    </ul>
  )
}

function Page() {
  const promise = fetchComments()
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Comments commentsPromise={promise} />
    </Suspense>
  )
}
```

**条件读 Context**：

```tsx
import { use } from 'react'

function Theme() {
  if (someCondition) {
    const theme = use(ThemeContext)   // 可以在条件中调用！
    return <div className={theme} />
  }
  return null
}
```

普通 `useContext` 必须在组件顶层；`use` 可以在条件、循环、嵌套中调用。

::: warning use(promise) 别在组件内创建
```tsx
// ❌ 每次渲染都新建 promise，无限挂起
function Bad() {
  const data = use(fetch('/api').then(r => r.json()))
}

// ✅ 让父组件创建（或用 cache / loader 缓存）
function Good({ promise }) {
  const data = use(promise)
}
```
:::

### `useActionState` —— Action + 状态聚合

替代 React 18 的 `useFormState`，配合 Form Actions 用：

```tsx
import { useActionState } from 'react'

async function loginAction(prevState: string | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const error = await login(email, password)
  return error  // 返回错误信息，或 null
}

function LoginForm() {
  const [error, submitAction, isPending] = useActionState(loginAction, null)

  return (
    <form action={submitAction}>
      <input name="email" />
      <input name="password" type="password" />
      <button disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

**`useActionState` 三元组**：

- `state`：上一次 action 返回值
- `dispatch`：替代 form action（可以传给 `<form action={dispatch}>`）
- `isPending`：是否正在执行

### `useFormStatus` —— 读父 form 状态

从 `react-dom` 导入（不是 `react`），子组件读父 `<form>` 的提交状态：

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

// 父组件
function Form() {
  return (
    <form action={saveAction}>
      <input name="title" />
      <SubmitButton />   {/* 不需要传 pending 进来 */}
    </form>
  )
}
```

**`useFormStatus` 关键点**：

- **必须在 `<form>` 的子组件里用**（不是 form 本身）
- 自动从最近的父 `<form>` 取状态，零 prop drilling
- 返回字段：`pending` / `data: FormData | null` / `method` / `action`

### `useOptimistic` —— 乐观更新

```tsx
import { useOptimistic, useState } from 'react'

function Todos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state: Todo[], newTodo: Todo) => [...state, { ...newTodo, sending: true }]
  )

  async function formAction(formData: FormData) {
    const newTodo = { id: Date.now(), text: formData.get('text') as string }
    addOptimistic(newTodo)            // 立即在 UI 显示（带 sending）
    const saved = await postTodo(newTodo)   // 真实请求
    setTodos(prev => [...prev, saved])      // 真实数据替换
  }

  return (
    <>
      <ul>
        {optimisticTodos.map(t => (
          <li key={t.id} style={{ opacity: t.sending ? 0.5 : 1 }}>{t.text}</li>
        ))}
      </ul>
      <form action={formAction}>
        <input name="text" />
        <button>Add</button>
      </form>
    </>
  )
}
```

**`useOptimistic` 关键点**：

- 第一参数：真实状态
- 第二参数：reducer (state, optimisticValue) => 新状态
- 返回 `[optimisticState, addOptimistic]`
- Action 结束（成功或失败）自动回退到真实状态

## JSX 深入

### Fragment（`<></>`）

```tsx
// 写法 1：短语法（推荐）
return (
  <>
    <h1>Title</h1>
    <p>Body</p>
  </>
)

// 写法 2：显式 Fragment（需要 key 时用）
return (
  <Fragment key={item.id}>
    <dt>{item.label}</dt>
    <dd>{item.value}</dd>
  </Fragment>
)
```

短语法不能加 `key` 或其它属性；要 key 必须用 `<Fragment>`。

### Keys —— 列表渲染身份

```tsx
{items.map(item => <Item key={item.id} data={item} />)}
```

**Key 三铁律**：

1. 同级 sibling 中**唯一**（不必全局唯一）
2. **稳定**（数据的字段，不要 `Math.random()`）
3. **不要用 index 当 key**——只有列表完全静态时才能用 index

为什么不用 index？

```tsx
// 列表：[A, B, C]
// 删除 A 后：[B, C]
// 用 index 当 key：原 key 0=A 现在 key 0=B → React 复用 0 号 DOM，把内容从 A 换成 B
// 用 id 当 key：原 key id-a 删除，剩 id-b、id-c → React 删除 A 的 DOM，B 和 C 不动
```

### Refs

**1. DOM ref**：

```tsx
const ref = useRef<HTMLInputElement>(null)
<input ref={ref} />

// React 19：ref callback 可以返回 cleanup
<input ref={node => {
  if (node) {
    console.log('mounted', node)
    return () => console.log('unmounted')
  }
}} />
```

**2. 函数 / 组件 ref（React 19 简化）**：

```tsx
// React 19：直接接 ref prop，不用 forwardRef
function MyInput({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & InputProps) {
  return <input ref={ref} {...props} />
}

<MyInput ref={inputRef} />

// React 18 及之前：必须 forwardRef 包裹
const MyInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />
})
```

### 事件处理

```tsx
// 基本
<button onClick={handleClick}>Click</button>

// 内联
<button onClick={() => doSomething(id)}>Click</button>

// 阻止冒泡 / 默认行为
<a href="#" onClick={e => { e.preventDefault(); e.stopPropagation() }} />

// 事件类型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.clientX)
}
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value)
}
const handleKey = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') submit()
}
```

**事件冒泡**：

React 用「**合成事件**」统一各浏览器；冒泡阶段触发。React 17+ 把事件绑定从 `document` 改到 React 根（`createRoot` 的容器）。

**捕获阶段**：

```tsx
<div onClickCapture={handleCapture}>
  <button>Click</button>
</div>
```

事件名 + `Capture` 后缀。

## 受控 vs 非受控组件

| 维度 | 受控 | 非受控 |
|---|---|---|
| 值来源 | React state | DOM 自己 |
| 必须用 | `value` + `onChange` | `defaultValue` + ref |
| 适合 | 实时校验、依赖 state、自动填充 | 一次性提交（如登录表单） |
| 性能 | 每按键都重渲染 | 仅在提交时读 |

```tsx
// 受控
const [email, setEmail] = useState('')
<input value={email} onChange={e => setEmail(e.target.value)} />

// 非受控
const ref = useRef<HTMLInputElement>(null)
<input defaultValue="" ref={ref} />
// 提交时读 ref.current!.value
```

**React 19 推荐**：用 Form Actions + `FormData` 处理表单，免去大量受控状态：

```tsx
function MyForm() {
  async function action(formData: FormData) {
    const email = formData.get('email')
    await save(email)
  }

  return (
    <form action={action}>
      <input name="email" defaultValue="" />
      <button>Save</button>
    </form>
  )
}
```

## Forms + FormData 一等公民（React 19）

```tsx
import { useActionState } from 'react'

interface FormState {
  error: string | null
  success: boolean
}

async function saveUser(prev: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  if (!name) return { error: 'Name required', success: false }
  await api.save({ name })
  return { error: null, success: true }
}

function UserForm() {
  const [state, action, pending] = useActionState(saveUser, {
    error: null,
    success: false,
  })

  return (
    <form action={action}>
      <input name="name" defaultValue="" required />
      <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p style={{ color: 'green' }}>Saved!</p>}
    </form>
  )
}
```

**为什么 React 19 强推 Form Actions**：

1. 表单原生 `FormData` 不需要为每个 input 写 `useState`
2. 服务端 Action 与客户端 Action 同一接口（progressive enhancement）
3. 失败 / 成功 / pending 统一通过 `useActionState` 处理
4. `useFormStatus` 让子组件零 prop drilling 拿状态
5. `useOptimistic` 让乐观更新一行代码

## Lifting State Up（状态提升）

兄弟组件需要共享状态 → 提升到最近共同父组件：

```tsx
function App() {
  const [filter, setFilter] = useState('')   // 共享状态在父组件
  return (
    <>
      <SearchBar filter={filter} onChange={setFilter} />
      <TodoList filter={filter} />
    </>
  )
}

function SearchBar({ filter, onChange }: Props) {
  return <input value={filter} onChange={e => onChange(e.target.value)} />
}

function TodoList({ filter }: { filter: string }) {
  const todos = useTodos()
  const visible = todos.filter(t => t.text.includes(filter))
  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>
}
```

**何时提升 vs 用 Context / 状态库**：

- 提升 2-3 层以内 → 直接 props
- 提升超过 3 层 → 中间层成「prop drilling」难维护 → Context
- 多个不相关组件都要读写 → 状态库（Zustand / Jotai）

## 条件渲染模式

```tsx
// 1. 三元
{isLoggedIn ? <Dashboard /> : <Login />}

// 2. && 短路（注意：左边是 0 时会渲染 0）
{count > 0 && <Badge count={count} />}

// 3. 提前 return（推荐复杂逻辑）
function Page() {
  if (loading) return <Spinner />
  if (error) return <ErrorView error={error} />
  if (!data) return null
  return <Content data={data} />
}

// 4. 多分支：把组件抽出来
const view = (() => {
  switch (status) {
    case 'loading': return <Spinner />
    case 'error': return <ErrorView />
    case 'success': return <Content />
    default: return null
  }
})()
```

::: warning `&&` 短路陷阱
```tsx
const items = []
return <div>{items.length && <List items={items} />}</div>
// items.length 是 0 → 渲染出 "0"（不是 false）

// 修复：显式 boolean
return <div>{items.length > 0 && <List items={items} />}</div>
```
:::

## 组件复用三种模式

### 1. 自定义 Hooks（首选）

```tsx
// 抽离逻辑
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : initial
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// 使用
const [theme, setTheme] = useLocalStorage('theme', 'light')
```

**Hook 命名必须 `useXxx`**，否则 ESLint hooks 规则不识别 + Compiler 不优化。

### 2. Higher-Order Component（HOC）

老式模式，新代码用 Hook 替代，但读老库仍会遇到：

```tsx
function withAuth<P>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const user = useUser()
    if (!user) return <Login />
    return <Component {...props} />
  }
}

const ProtectedPage = withAuth(DashboardPage)
```

### 3. Render Props

```tsx
function MouseTracker({ render }: { render: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return <>{render(pos)}</>
}

// 使用
<MouseTracker render={pos => <p>{pos.x}, {pos.y}</p>} />
```

Render Props 完全可以被自定义 Hook 替代，**新代码用 Hook**：

```tsx
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => { ... })
  return pos
}

const pos = useMousePosition()
```

## 错误边界（ErrorBoundary）

只有 Class 组件能定义错误边界——React 19 仍是如此（hooks 版本尚未稳定）：

```tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
    // 上报错误到 Sentry / DataDog
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// 使用
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  <App />
</ErrorBoundary>
```

**错误边界能捕获**：

- 渲染期的错误
- 生命周期内的错误
- 构造函数内的错误

**错误边界不能捕获**：

- 事件处理器内的错误（用 try/catch）
- 异步代码（Promise reject / setTimeout）
- SSR 错误
- ErrorBoundary 自身抛错

**实用库**：[`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) 提供 hooks API + reset 能力。

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <>
      <p>Error: {error.message}</p>
      <button onClick={resetErrorBoundary}>Retry</button>
    </>
  )}
  onReset={() => refetch()}
>
  <App />
</ErrorBoundary>
```

## Portal —— 跨 DOM 层级渲染

```tsx
import { createPortal } from 'react-dom'

function Modal({ children, open }: { children: ReactNode; open: boolean }) {
  if (!open) return null
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.getElementById('modal-root')!
  )
}

// 使用
<Modal open={true}>
  <p>Modal content</p>
</Modal>
```

**Portal 关键点**：

- DOM 上挂在 `#modal-root` 下，逃出父组件的 `overflow: hidden` / `z-index` 局限
- React 组件树上仍是父子关系——Context / 事件冒泡正常工作

## Suspense + lazy（异步加载）

### `lazy` 代码分割

```tsx
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))
const Settings = lazy(() => import('./Settings'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
    </Suspense>
  )
}
```

`lazy(() => import('...'))` 返回懒加载组件；首次渲染时触发 chunk 下载，`Suspense` 显示 fallback。

### `Suspense` 边界

```tsx
function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<p>Loading user...</p>}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<p>Loading posts...</p>}>
        <PostList />
      </Suspense>
    </div>
  )
}
```

**Suspense 触发条件**：

- 子树里有 `lazy` 组件未加载完
- 子树里有 `use(promise)` 未 resolve（React 19+）
- 子树里有支持 Suspense 的数据库（TanStack Query / Relay / Apollo / Next.js fetch）

## 性能基础：React.memo / useMemo / useCallback

### `React.memo` —— 跳过 props 没变的重渲染

```tsx
const ExpensiveList = React.memo(function ExpensiveList({ items }: Props) {
  return <ul>{items.map(...)}</ul>
})

// 自定义比较（默认浅比较）
const ExpensiveList = React.memo(
  function ExpensiveList({ items }) { ... },
  (prev, next) => prev.items.length === next.items.length
)
```

**`memo` 失效场景**：

- Props 里有对象 / 数组 / 函数引用每次都变 → memo 没用
- 必须配合 `useMemo` / `useCallback` 稳定引用

```tsx
function Parent() {
  const [count, setCount] = useState(0)
  // ❌ items 每次渲染都是新数组，ChildList 仍重渲染
  const items = [1, 2, 3]
  return <ChildList items={items} />

  // ✅ useMemo 稳定引用
  const items = useMemo(() => [1, 2, 3], [])
  return <ChildList items={items} />
}
```

### `useMemo` —— 缓存计算结果

```tsx
const expensive = useMemo(() => heavyCompute(data), [data])
```

只在 `data` 变化时重新算。

### `useCallback` —— 缓存函数引用

```tsx
const handleClick = useCallback(() => doSomething(id), [id])
```

主要给 `React.memo` 子组件用。

::: tip React Compiler 改变游戏规则
React 19 的官方 Compiler（RC）会自动 memo 所有计算与函数引用：
- 装上 Compiler 后，**多数 `useMemo` / `useCallback` / `React.memo` 不再必要**
- 性能优化的心智负担大幅降低
- 详见 `expert.md` 的 Compiler 章节
:::

## StrictMode

```tsx
// main.tsx
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**StrictMode 开发期检查**：

1. **故意双调用**——`useState`、`useReducer`、`useMemo`、`useEffect`、组件函数本身
2. **检测废弃 API**（findDOMNode、UNSAFE_* 生命周期）
3. **检测过时 ref / context 用法**

生产环境不生效。

## 自定义 Hook 实战

```tsx
// 1. useToggle
function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle, setValue] as const
}

// 2. useDebounce
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// 3. usePrevious
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}

// 4. useFetch（简化版，正式项目用 TanStack Query）
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { if (e.name !== 'AbortError') { setError(e); setLoading(false) } })
    return () => controller.abort()
  }, [url])

  return { data, error, loading }
}

// 5. useEventListener
function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void
) {
  const savedHandler = useRef(handler)
  useEffect(() => { savedHandler.current = handler }, [handler])
  useEffect(() => {
    const wrapped = (e: WindowEventMap[K]) => savedHandler.current(e)
    window.addEventListener(event, wrapped)
    return () => window.removeEventListener(event, wrapped)
  }, [event])
}
```

## TypeScript 集成基础

### 函数组件类型

```tsx
// 方式 1：直接给 props 类型（推荐）
interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{label}</button>
}

// 方式 2：React.FC（不推荐，2019 后已不流行）
const Button: React.FC<ButtonProps> = ({ label, onClick }) => { ... }
```

为什么不推荐 `FC`：

- 隐式加上 `children: ReactNode`（即使你不要 children）
- 不能写泛型组件
- 没有 `displayName` 等好处

### 接受 children

```tsx
// 显式 children
interface CardProps {
  title: string
  children: React.ReactNode
}

function Card({ title, children }: CardProps) {
  return <div><h3>{title}</h3>{children}</div>
}

// 工具类型：PropsWithChildren
import { PropsWithChildren } from 'react'

function Card({ title, children }: PropsWithChildren<{ title: string }>) {
  return <div><h3>{title}</h3>{children}</div>
}
```

### 事件类型

```tsx
const onClick: React.MouseEventHandler<HTMLButtonElement> = e => { ... }
const onChange: React.ChangeEventHandler<HTMLInputElement> = e => { ... }
const onSubmit: React.FormEventHandler<HTMLFormElement> = e => { ... }
const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => { ... }
```

### 复用 HTML 元素 props

```tsx
// 让自定义 Button 接受所有原生 button props
interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
}

function Button({ variant, ...rest }: ButtonProps) {
  return <button className={variant} {...rest} />
}

// 使用：所有原生属性都能传
<Button type="submit" disabled onClick={...} variant="primary" />
```

## 速查清单（基础完成后做到）

- [ ] 懂 `useState` / `useEffect` / `useContext` / `useReducer` / `useRef` 用法
- [ ] 懂 `useMemo` / `useCallback` / `React.memo` 性能优化（以及 Compiler 出现后的简化）
- [ ] 能写自定义 Hook，命名 `useXxx`
- [ ] 受控 / 非受控表单都能写，懂 React 19 Form Actions
- [ ] 懂 `<Suspense>` + `lazy` 做代码分割
- [ ] 懂错误边界基本写法
- [ ] 懂 `createPortal` 用法
- [ ] 懂 React 19 新 hooks：`use` / `useActionState` / `useFormStatus` / `useOptimistic`
- [ ] 懂 StrictMode 双调用机制，能写「跑两次也对」的 effect
- [ ] 懂 ref as prop（React 19）替代 forwardRef
- [ ] 能用 React DevTools 看 Components / Profiler

下一章 `advanced.md` 详细讲 Server Components / 状态管理库 / 路由 / 数据获取 / 表单库 / UI 库 / TypeScript 进阶。
