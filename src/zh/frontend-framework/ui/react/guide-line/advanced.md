---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 基于 React 19.x 编写 —— Server Components / Actions / use API / 路由 / 状态库 / 数据获取 / 表单库 / UI 库 / TypeScript 进阶

## 速查

- **Server Components**：服务端独立渲染，零客户端 JS，`'use client'` 切到客户端组件
- **Server Actions**：`'use server'` 标记的函数可以从客户端直接调用（RPC），支持 form action 渐进增强
- **路由**：React Router v7（最主流，Remix 合并版）/ TanStack Router（类型最强）/ Next.js 文件路由
- **状态库**：Redux Toolkit / Zustand / Jotai / Recoil / Valtio / TanStack Store
- **数据获取**：TanStack Query（最流行）/ SWR / RTK Query / Apollo Client（GraphQL）
- **表单库**：React Hook Form / Formik / TanStack Form
- **样式**：CSS Modules / Tailwind / styled-components / Emotion / Vanilla Extract
- **动画**：Framer Motion / React Spring / Auto Animate
- **UI 库**：MUI / Ant Design / Chakra / Mantine / shadcn/ui / Radix UI

## React Server Components（RSC）

### 核心概念

React Server Components 是 React 19 真正稳定的特性（之前在 Next.js 13 实验阶段）。它把组件分两种：

- **Server Components**（默认）：仅在**服务端**执行，输出序列化的 React 树（不是 HTML），客户端反序列化挂载
- **Client Components**（`'use client'` 标记）：跑在客户端，可以用 hooks / 事件 / 浏览器 API

```tsx
// app/page.tsx —— 默认 Server Component
import { db } from '@/lib/db'

async function ProductList() {
  // 直接 await 数据库（服务端）
  const products = await db.product.findMany()
  return (
    <ul>
      {products.map(p => <Product key={p.id} product={p} />)}
    </ul>
  )
}

export default ProductList
```

**Server Components 能做什么**：

- `async/await` 直接在组件函数内（不需要 useEffect）
- 访问数据库 / 文件系统 / 环境变量
- 使用任意 Node.js 库（不增加客户端 bundle）
- 渲染结果 stream 到客户端

**Server Components 不能做什么**：

- 不能用 `useState` / `useEffect` / `useContext` / `useRef`
- 不能绑定事件（`onClick` 等）
- 不能用浏览器 API（`window`、`localStorage`）
- 不能作为 React.memo / forwardRef 包裹的目标

### `'use client'` 边界

要用 state / events，必须显式声明 Client Component：

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**`'use client'` 含义**：

- 这个文件**及其导入的所有模块**都进客户端 bundle
- 文件本身可以被 Server Component import 后渲染（边界由这个指令划定）
- 像「绿洲入口」——一旦标了 `'use client'`，里面所有子组件都是客户端组件（除非显式传 Server Component 当 children）

### 组合模式

**Server → Client**：直接 import 渲染（推荐）：

```tsx
// page.tsx (Server)
import { Counter } from './Counter'   // Client Component

export default async function Page() {
  const data = await db.fetch()
  return (
    <div>
      <h1>{data.title}</h1>
      <Counter />   {/* 客户端组件，会 hydrate */}
    </div>
  )
}
```

**Client → Server**：不能直接 import，必须通过 children/props 传：

```tsx
// page.tsx (Server)
import { ClientLayout } from './ClientLayout'   // Client
import { ServerPanel } from './ServerPanel'     // Server

export default function Page() {
  return (
    <ClientLayout>
      <ServerPanel />   {/* Server 当 children 传给 Client */}
    </ClientLayout>
  )
}

// ClientLayout.tsx
'use client'
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <div className="layout">{children}</div>
}
```

### 数据获取下沉

RSC 让数据获取下沉到「最需要数据的那个组件」：

```tsx
// 老 SPA 模式：在父页面取所有数据，prop drilling 给孩子
// RSC：每个 Server Component 独立 await 自己的数据

async function ProductDetail({ id }: { id: string }) {
  const product = await db.product.findUnique({ where: { id } })
  return (
    <article>
      <h1>{product.name}</h1>
      <Reviews productId={id} />
      <RelatedProducts categoryId={product.categoryId} />
    </article>
  )
}

async function Reviews({ productId }: { productId: string }) {
  const reviews = await db.review.findMany({ where: { productId } })
  return <ul>{reviews.map(r => <li key={r.id}>{r.text}</li>)}</ul>
}

async function RelatedProducts({ categoryId }: { categoryId: string }) {
  const items = await db.product.findMany({ where: { categoryId }, take: 5 })
  return <aside>{items.map(p => <Product key={p.id} product={p} />)}</aside>
}
```

每个组件独立 await → React 自动并行（用 `Suspense` 边界包起来更好）。

### Streaming + Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Page</h1>
      <Suspense fallback={<p>Loading product...</p>}>
        <ProductDetail id="123" />
      </Suspense>
      <Suspense fallback={<p>Loading reviews...</p>}>
        <Reviews productId="123" />
      </Suspense>
    </div>
  )
}
```

服务端 stream HTML：先发不带 Suspense 部分，等数据到了再补 Suspense 内容。用户感受到的 TTFB 更短。

## Server Actions

### 基本用法

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTodo(formData: FormData) {
  const text = formData.get('text') as string
  await db.todo.create({ data: { text } })
  revalidatePath('/todos')
}
```

```tsx
// app/page.tsx (Server)
import { createTodo } from './actions'

export default function Page() {
  return (
    <form action={createTodo}>
      <input name="text" />
      <button type="submit">Add</button>
    </form>
  )
}
```

**Server Actions 含义**：

- `'use server'` 标记的函数会被框架编译成 RPC 端点
- 客户端调用 = 自动序列化参数 → 后端反序列化 → 执行 → 返回结果
- 不需要写 `/api/...` 路由 + fetch
- **作用域**：`'use server'` 在文件顶部 = 整个文件；写在函数内 = 仅这个函数

### 与 useActionState 配合

```tsx
'use client'

import { useActionState } from 'react'
import { createTodo } from './actions'

interface State {
  error: string | null
  success: boolean
}

async function action(prev: State, formData: FormData): Promise<State> {
  try {
    await createTodo(formData)
    return { error: null, success: true }
  } catch (e: any) {
    return { error: e.message, success: false }
  }
}

export function TodoForm() {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    success: false,
  })

  return (
    <form action={formAction}>
      <input name="text" required />
      <button disabled={pending}>{pending ? 'Adding...' : 'Add'}</button>
      {state.error && <p>{state.error}</p>}
    </form>
  )
}
```

### Progressive Enhancement

Server Actions 的杀手特性：**JS 关闭也能用**：

```tsx
// 服务端组件渲染 form action={serverAction}
// JS 加载前：浏览器原生 form 提交 → 服务端处理 → 渲染新页面
// JS 加载后：拦截提交，调用 Server Action，更新 UI 不刷页
```

像 Remix / Next.js App Router 默认就支持这点。

## `use` API

### 读 Promise（配合 Suspense）

```tsx
import { use, Suspense } from 'react'

function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)
  return comments.map(c => <p key={c.id}>{c.text}</p>)
}

function Page() {
  // Server Component 把 promise 传给 Client Component
  const promise = fetch('/api/comments').then(r => r.json())
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Comments commentsPromise={promise} />
    </Suspense>
  )
}
```

::: warning use(promise) 三条铁律
1. **promise 必须由父组件创建并通过 props 传入**——不能在 use 所在组件内创建（每次渲染新 promise → 无限 suspend）
2. **必须在 Suspense 内**——否则 React 报错
3. **配合 ErrorBoundary**——promise reject 会抛错
:::

### 条件读 Context

```tsx
import { use } from 'react'

function MaybeTheme() {
  if (showTheme) {
    const theme = use(ThemeContext)   // 条件分支里调用 use
    return <span style={{ color: theme.color }}>...</span>
  }
  return null
}
```

普通 `useContext` 不能放条件 / 循环里；`use` 可以。

### Server Components 中使用

```tsx
// Server Component
async function Page({ params }: { params: { id: string } }) {
  const productPromise = db.product.findUnique({ where: { id: params.id } })
  return (
    <Suspense fallback={<Spinner />}>
      <ProductView productPromise={productPromise} />
    </Suspense>
  )
}

async function ProductView({ productPromise }: { productPromise: Promise<Product> }) {
  const product = use(productPromise)
  return <h1>{product.name}</h1>
}
```

## Suspense 深入

### Waterfall 与 Parallel Fetching

**Waterfall（坏）**：

```tsx
function Page() {
  const user = use(fetchUser())   // 等用户
  const posts = use(fetchPosts(user.id))   // 等完用户再取 posts
  return ...
}
```

请求依次发，总时间 = sum。

**Parallel（好）**：

```tsx
// 父组件并行发起所有 promise
function Page() {
  const userPromise = fetchUser()
  const postsPromise = fetchPosts()   // 不依赖 user
  return (
    <Suspense fallback={<Spinner />}>
      <UserView promise={userPromise} />
      <PostsView promise={postsPromise} />
    </Suspense>
  )
}
```

两个 promise 同时启动，总时间 = max。

### 嵌套 Suspense

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ContentSkeleton />}>
    <Content />
    <Suspense fallback={<SidebarSkeleton />}>
      <Sidebar />
    </Suspense>
  </Suspense>
</Suspense>
```

每一层独立 fallback——内层 suspend 不会影响外层显示。

### Suspense + ErrorBoundary 完整模式

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary fallback={<p>Error loading data</p>}>
  <Suspense fallback={<Spinner />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

## Concurrent Features

### `startTransition` —— 非紧急更新

`useTransition` 的非 hook 版，可在事件处理器外用：

```tsx
import { startTransition } from 'react'

function handleSearch(value: string) {
  setQuery(value)   // 紧急
  startTransition(() => {
    setResults(search(value))   // 非紧急
  })
}
```

### `useDeferredValue` —— 推迟值

```tsx
function SearchPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query, '')   // React 19 加 initialValue

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ResultsList query={deferredQuery} />
    </>
  )
}
```

`deferredQuery` 慢一拍跟上 `query`，让输入框响应优先。

### `useTransition` —— 包装异步更新

```tsx
const [isPending, startTransition] = useTransition()

async function handleSubmit() {
  startTransition(async () => {
    const result = await saveData()
    setResult(result)   // 包在 transition 内
  })
}
```

React 19 支持 `startTransition` 内传 async 函数（之前不行）。

## 状态管理库对比

| 库 | bundle | 心智模型 | TypeScript | 服务端状态 | 时间旅行 | DevTools |
|---|---|---|---|---|---|---|
| **Redux Toolkit** | ~20 KB | reducer + action | ★★★ | ❌（需 RTK Query） | ✅ | ✅ 强 |
| **Zustand** | ~1 KB | hook + setter | ★★★ | ❌ | ❌ | ✅（Redux DevTools） |
| **Jotai** | ~3 KB | atom（细粒度） | ★★★ | 半支持 | ❌ | ✅ |
| **Recoil** | ~14 KB | atom + selector | ★★ | 半支持 | ❌ | ✅ |
| **Valtio** | ~3 KB | proxy 可变写法 | ★★ | ❌ | ❌ | ✅ |
| **TanStack Store** | ~2 KB | 类似 Zustand | ★★★ | ❌ | ❌ | ❌ |
| **MobX** | ~17 KB | observable + reaction | ★★ | ❌ | ❌ | ✅ |

### Redux Toolkit（企业首选）

```tsx
// store.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value++ },   // Immer 内置
    decrement: state => { state.value-- },
    setBy: (state, action: PayloadAction<number>) => { state.value = action.payload },
  },
})

export const { increment, decrement, setBy } = counterSlice.actions

export const store = configureStore({
  reducer: { counter: counterSlice.reducer },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

```tsx
// hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

```tsx
// Counter.tsx
import { Provider } from 'react-redux'
import { useAppDispatch, useAppSelector } from './hooks'
import { store, increment } from './store'

function Counter() {
  const count = useAppSelector(s => s.counter.value)
  const dispatch = useAppDispatch()
  return <button onClick={() => dispatch(increment())}>{count}</button>
}

function App() {
  return <Provider store={store}><Counter /></Provider>
}
```

### Zustand（最简单）

```tsx
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
  reset: () => void
}

const useBearStore = create<BearState>(set => ({
  bears: 0,
  increase: () => set(state => ({ bears: state.bears + 1 })),
  reset: () => set({ bears: 0 }),
}))

function BearCounter() {
  const bears = useBearStore(s => s.bears)
  const increase = useBearStore(s => s.increase)
  return <button onClick={increase}>{bears}</button>
}
```

**Zustand 三优点**：

- 零 Provider 包裹
- 选择器自动 memo（只读的字段变了才重渲染）
- bundle 极小（1KB）

### Jotai（atom 派）

```tsx
import { atom, useAtom } from 'jotai'

const countAtom = atom(0)
const doubledAtom = atom(get => get(countAtom) * 2)

function Counter() {
  const [count, setCount] = useAtom(countAtom)
  const [doubled] = useAtom(doubledAtom)
  return <button onClick={() => setCount(c => c + 1)}>{count} ({doubled})</button>
}
```

Atom 是「最小响应单元」，自动 fine-grained 重渲染。适合：极致性能 / 复杂依赖图。

## 路由

### React Router v7（最主流）

Remix（v2）已并入 React Router v7（2024.12 稳定）：

```bash
pnpm create react-router@latest
```

```tsx
// 数据路由（推荐）
import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: 'users/:id',
        Component: UserProfile,
        loader: async ({ params }) => {
          return await fetchUser(params.id!)
        },
        action: async ({ request }) => {
          const formData = await request.formData()
          return await updateUser(formData)
        },
      },
    ],
  },
])

createRoot(root).render(<RouterProvider router={router} />)
```

**React Router v7 关键 hooks**：

- `useParams()` —— URL 参数
- `useNavigate()` —— 编程式导航
- `useLocation()` —— 当前路由信息
- `useLoaderData()` —— loader 返回值（TypeScript 推导自动）
- `useActionData()` —— action 返回值
- `useNavigation()` —— 全局 navigation 状态（pending）
- `useFetcher()` —— 不切换路由的数据加载 / 提交

### TanStack Router（类型最强）

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-vite-plugin
```

```tsx
// 文件路由（默认）：src/routes/users.$id.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$id')({
  loader: async ({ params }) => fetchUser(params.id),
  component: UserProfile,
})

function UserProfile() {
  const user = Route.useLoaderData()   // 类型 = fetchUser 返回类型
  const { id } = Route.useParams()     // id: string，类型从 $id 推导
  return <h1>{user.name}</h1>
}
```

**TanStack Router 优势**：

- 端到端 TypeScript 推导（params / search / loader 类型自动）
- search params 一等公民（类型化 query string）
- 内置缓存 + 预加载

### Next.js / Remix 文件路由

```
app/
├── page.tsx           → /
├── about/page.tsx     → /about
├── users/[id]/page.tsx → /users/:id
├── (admin)/dashboard/page.tsx → /dashboard（路由组）
├── @modal/page.tsx    → 并行路由
```

## 数据获取

### TanStack Query（最流行）

```bash
pnpm add @tanstack/react-query
```

```tsx
// 1. Provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000 },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserPage />
    </QueryClientProvider>
  )
}

// 2. 查询
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function UserPage({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorView />
  return <h1>{data.name}</h1>
}

// 3. 变更
function UpdateUserForm({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: Partial<User>) =>
      fetch(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })

  return <button onClick={() => mutation.mutate({ name: 'New' })}>Save</button>
}
```

**TanStack Query 核心特性**：

- 自动缓存、去重、后台刷新
- staleTime / gcTime 精细控制
- Suspense / 错误边界一键集成（`useSuspenseQuery`）
- DevTools 强大
- 与 Server Components 共存（Hydration Boundary）

### SWR（轻量替代）

```tsx
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function User({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR(`/api/users/${id}`, fetcher)
  if (error) return <p>error</p>
  if (isLoading) return <p>loading</p>
  return <h1>{data.name}</h1>
}
```

SWR 由 Vercel 维护，API 比 TanStack Query 简单一档。

### Apollo Client（GraphQL）

```tsx
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client'

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
})

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) { id name email }
  }
`

function User({ id }: { id: string }) {
  const { data, loading } = useQuery(GET_USER, { variables: { id } })
  if (loading) return <Spinner />
  return <h1>{data.user.name}</h1>
}
```

GraphQL 项目首选。Apollo 体积大（~30KB），轻量替代有 [urql](https://formidable.com/open-source/urql/)。

## 表单库

### React Hook Form（最流行）

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}
      <button disabled={isSubmitting}>Login</button>
    </form>
  )
}
```

**React Hook Form 优势**：

- **非受控**（用 ref + 事件） → 性能极佳，大表单也不卡
- Zod / Yup / Joi 验证集成
- TypeScript 推导完整

### Formik（老牌）

```tsx
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={Yup.object({
        email: Yup.string().email().required(),
        password: Yup.string().min(8).required(),
      })}
      onSubmit={values => login(values)}
    >
      {({ errors }) => (
        <Form>
          <Field name="email" />
          {errors.email && <p>{errors.email}</p>}
          <Field name="password" type="password" />
          {errors.password && <p>{errors.password}</p>}
          <button type="submit">Login</button>
        </Form>
      )}
    </Formik>
  )
}
```

Formik 受控、心智模型简单，但大表单性能不如 RHF。新项目首选 RHF。

### TanStack Form（类型最强）

```tsx
import { useForm } from '@tanstack/react-form'

function LoginForm() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => login(value),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field name="email">
        {field => (
          <input
            value={field.state.value}
            onChange={e => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
      <button type="submit">Login</button>
    </form>
  )
}
```

TanStack 系列一致的「Headless + 类型至上」风格。

## 样式方案

### CSS Modules（零运行时）

```css
/* Button.module.css */
.button { padding: 8px 16px; }
.button.primary { background: blue; color: white; }
```

```tsx
import styles from './Button.module.css'
import clsx from 'clsx'

function Button({ primary, children }: Props) {
  return (
    <button className={clsx(styles.button, primary && styles.primary)}>
      {children}
    </button>
  )
}
```

### Tailwind CSS（最流行）

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```tsx
function Button({ children }: Props) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      {children}
    </button>
  )
}
```

Tailwind 4（2024.12）发布，配置文件简化，性能大幅提升。

### styled-components / Emotion（CSS-in-JS）

```tsx
import styled from 'styled-components'

const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  border-radius: 4px;
`

<Button primary>Click</Button>
```

::: warning CSS-in-JS 与 RSC
传统 styled-components / Emotion 是**运行时 CSS-in-JS**——会拖累 RSC（每次渲染都生成 CSS）。React 19 + RSC 推荐：
- **零运行时**：[Vanilla Extract](https://vanilla-extract.style/) / [Linaria](https://linaria.dev/) / [Panda CSS](https://panda-css.com/)
- **CSS Modules**（零运行时，最稳）
- **Tailwind**（编译时生成，零运行时）

styled-components 5+ 已支持 SSR，但 RSC 兼容性仍不完善。
:::

### Vanilla Extract（零运行时 CSS-in-TS）

```tsx
// Button.css.ts
import { style } from '@vanilla-extract/css'

export const button = style({
  padding: '8px 16px',
  background: 'blue',
})

// Button.tsx
import { button } from './Button.css'

<button className={button}>Click</button>
```

类型安全 + 零运行时 + RSC 友好。

## 动画

### Framer Motion（最强大）

```bash
pnpm add framer-motion
```

```tsx
import { motion, AnimatePresence } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Hello
</motion.div>

// 列表动画
<AnimatePresence>
  {items.map(item => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {item.text}
    </motion.li>
  ))}
</AnimatePresence>
```

### React Spring（物理动画）

```tsx
import { useSpring, animated } from '@react-spring/web'

const styles = useSpring({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

<animated.div style={styles}>Hello</animated.div>
```

### Auto Animate（一行配置）

```tsx
import { useAutoAnimate } from '@formkit/auto-animate/react'

function List() {
  const [parent] = useAutoAnimate()
  return (
    <ul ref={parent}>
      {items.map(item => <li key={item.id}>{item.text}</li>)}
    </ul>
  )
}
```

零配置，自动给列表加进入 / 离开 / 重排动画。

## UI 组件库

### 完整组件库（拿来即用）

| 库 | 风格 | TypeScript | RSC 兼容 | 主题 | 备注 |
|---|---|---|---|---|---|
| **MUI** | Material Design | ★★★ | ✅ | 主题工具完整 | 企业最稳，~80KB |
| **Ant Design** | 企业风（蚂蚁出品） | ★★★ | ✅ | 主题 token | 中后台首选，~100KB |
| **Chakra UI** | 现代简洁 | ★★★ | 部分 | Style Props | API 直观 |
| **Mantine** | 全功能 + Hooks | ★★★ | ✅ | 完整 | 组件最多（100+） |
| **NextUI / HeroUI** | 现代化 | ★★★ | ✅ | Tailwind | 与 Tailwind 集成 |
| **Park UI** | shadcn 风格 + Ark UI | ★★★ | ✅ | Panda CSS | 新兴 |

### Headless（自带样式空间）

| 库 | 备注 |
|---|---|
| **Radix UI** | 行业标杆，shadcn/ui 底层 |
| **Headless UI** | Tailwind 团队出品 |
| **Ark UI** | Chakra 团队出品，Panda CSS 配套 |
| **React Aria** | Adobe 出品，无障碍最强 |
| **TanStack Table / Virtual / Form** | 数据组件 headless |

### shadcn/ui（特殊：复制粘贴源码）

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button
```

不是 npm 包，**直接复制源码到你的项目**：

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">Click</Button>
```

底层是 Radix UI + Tailwind，源码在你的仓库里——可任意改。RSC 友好。**2024-2025 React 圈最火的 UI 方案**。

## TypeScript 集成

### Props 类型

```tsx
// 方式 1：interface
interface UserCardProps {
  name: string
  age?: number
  onSelect?: (id: string) => void
  children?: React.ReactNode
}

function UserCard({ name, age, onSelect, children }: UserCardProps) { ... }

// 方式 2：type
type UserCardProps = {
  name: string
  age?: number
}

// 方式 3：复用 HTML 元素 props
type ButtonProps = React.ComponentProps<'button'> & { variant?: 'primary' | 'secondary' }
type AnchorProps = React.ComponentProps<'a'> & { external?: boolean }
```

### 事件类型

```tsx
React.MouseEvent<HTMLButtonElement>
React.ChangeEvent<HTMLInputElement>
React.FormEvent<HTMLFormElement>
React.KeyboardEvent<HTMLInputElement>
React.FocusEvent<HTMLInputElement>
React.DragEvent<HTMLDivElement>

// Handler 类型
React.MouseEventHandler<HTMLButtonElement>
React.ChangeEventHandler<HTMLInputElement>
```

### Ref 类型

```tsx
// useRef + DOM
const ref = useRef<HTMLInputElement>(null)

// React 19：ref as prop
function MyInput({ ref }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} />
}

// 暴露自定义 handle
interface InputHandle {
  focus: () => void
}

function MyInput({ ref }: { ref?: React.Ref<InputHandle> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))
  return <input ref={inputRef} />
}
```

### 泛型组件

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// 使用：类型自动推导
<List
  items={users}
  keyExtractor={u => u.id}
  renderItem={u => u.name}
/>
```

### 工具类型

```tsx
import {
  ReactNode,       // 任意子节点
  ReactElement,    // JSX element
  ComponentProps,  // 提取组件的 props 类型
  ComponentType,   // 任意组件（FC / Class）
  PropsWithChildren,  // 加 children
  CSSProperties,   // style 对象
  Dispatch, SetStateAction,  // useState setter
} from 'react'

// 提取组件 props
type ButtonProps = ComponentProps<typeof Button>

// HTMLElement 别名
type ButtonAttributes = React.ButtonHTMLAttributes<HTMLButtonElement>
type DivAttributes = React.HTMLAttributes<HTMLDivElement>

// useState setter
const setCount: Dispatch<SetStateAction<number>> = useState(0)[1]
```

## Refs 完整篇

### 三种 ref 形式

```tsx
// 1. RefObject（最常用）
const ref = useRef<HTMLDivElement>(null)
<div ref={ref} />
ref.current   // HTMLDivElement | null

// 2. Callback Ref
<div ref={node => {
  if (node) console.log('mounted', node)
  return () => console.log('unmounted')   // React 19 cleanup
}} />

// 3. ref as prop（React 19，替代 forwardRef）
function MyComponent({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} />
}
```

### forwardRef → ref prop 迁移

```tsx
// React 18 风格
import { forwardRef } from 'react'

const MyInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
))

// React 19 风格（推荐）
function MyInput({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}
```

官方提供 codemod：

```bash
npx codemod@latest react/19/replace-use-form-state
npx codemod@latest react/19/migrate-from-forward-ref
```

### `useImperativeHandle` 完整示例

```tsx
interface VideoHandle {
  play: () => void
  pause: () => void
  seekTo: (sec: number) => void
}

function Video({ ref, src }: { ref?: React.Ref<VideoHandle>; src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seekTo: sec => { if (videoRef.current) videoRef.current.currentTime = sec },
  }), [])

  return <video ref={videoRef} src={src} />
}

function App() {
  const handle = useRef<VideoHandle>(null)
  return (
    <>
      <Video ref={handle} src="/video.mp4" />
      <button onClick={() => handle.current?.play()}>Play</button>
      <button onClick={() => handle.current?.seekTo(30)}>30s</button>
    </>
  )
}
```

## 速查清单（进阶完成后做到）

- [ ] 懂 Server Components / Client Components 边界
- [ ] 懂 Server Actions，能写 form action + useActionState
- [ ] 懂 `use(promise)` + Suspense 数据获取模式
- [ ] 选择合适的状态库（Redux Toolkit / Zustand / Jotai）
- [ ] 用过 React Router v7 数据路由 或 Next.js App Router
- [ ] 用过 TanStack Query 处理服务端状态
- [ ] 表单库（React Hook Form 优先）+ Zod 验证
- [ ] 选择合适的样式方案（CSS Modules / Tailwind / Vanilla Extract）
- [ ] 用过 Framer Motion 做基本动画
- [ ] 用过至少一个完整 UI 库（MUI / Ant Design / Chakra）或 shadcn/ui
- [ ] TypeScript 能写泛型组件 / 复用 HTML 元素 props / 类型化 ref
- [ ] 懂 ref as prop（React 19）替代 forwardRef

下一章 `expert.md` 详细讲 React Compiler / 性能优化 / SSR/RSC 内部 / Reconciler / Testing / 微前端 / React Native 等。
