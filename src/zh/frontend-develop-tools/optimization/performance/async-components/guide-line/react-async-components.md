---
layout: doc
outline: [2, 3]
---

# React 异步组件深度

> 基于 React 19.2 官方文档（lazy / Suspense / Error Boundary / Transition）

## 速查

- **声明位置**：`lazy()` 必须在**模块顶层**，不能写在组件函数体内
- **load 契约**：无参函数，返回 Promise 或 thenable；解析值必须含 `.default` 且 `.default` 是合法组件类型；load 只调用一次
- **必须配 Suspense**：`<Suspense fallback={<Spinner/>}>` 包住 lazy 组件，否则一旦 suspend 直接报错
- **必须配 Error Boundary**：loader reject 会作为 throw 抛给最近的 Error Boundary，React 无内置 errorComponent
- **激活条件**：lazy 加载 / `use()` 读 Promise / `<link rel=stylesheet precedence>` / 流式 SSR /（Canary）`<ViewTransition>` 等字体图片
- **不激活**：`useEffect` / 事件处理器内的 `fetch` —— 不要期待它们触发 Suspense
- **startTransition**：包裹会触发 suspend 的更新，让 React 尽量保留已显示内容直到新内容就绪
- **嵌套**：合并到 1 个 boundary = 一起揭示；分层 = 各自按就绪顺序揭示
- **重置 boundary**：用 `key={id}`（如切换用户 profile）
- **fallback 要轻量**：spinner / skeleton，过重会增加首次揭示的渲染负担
- **过度分割有代价**：每个小组件都 lazy → chunk waterfall（瀑布请求），应在路由或重组件边界分割

## React.lazy 契约

`React.lazy(load)` 只接受一个**无参函数 `load`**，返回 Promise 或 thenable。React 等待 resolve 后取 `.default` 作为组件：

```tsx
const Foo = lazy(() => import('./Foo'))

// import('./Foo') 返回 Promise<{ default: FooType, ... }>
// lazy 自动从 module.default 取组件
```

**要点**：

- `load` **只在第一次渲染需要该组件时调用一次**，结果（Promise 与解析值）被缓存
- 返回值必须含 `.default`，且 `.default` 必须是合法的 React 组件类型（函数 / class）
- 也支持 thenable（不一定是 Promise），但生产用 Promise 最常见

```tsx
// ❌ 错误：返回了模块对象本身而非 .default
const Foo = lazy(() => import('./Foo').then(m => m)) // 错——需 .default

// ✅ 正确（lazy 自动取 .default）
const Foo = lazy(() => import('./Foo'))
```

## 必须在模块顶层声明

`lazy(...)` **必须在模块顶层**，不能写在组件函数体内。否则每次渲染都生成**新的 lazy 类型实例**，React 会把整棵子树当成新组件树、**重置所有内部状态**：

```tsx
// ❌ 反模式：写在组件体内
function App() {
  const Foo = lazy(() => import('./Foo'))  // 每次渲染都是新的 lazy
  return <Suspense fallback={<Spinner/>}><Foo /></Suspense>
}

// ✅ 正确：模块顶层
const Foo = lazy(() => import('./Foo'))
function App() {
  return <Suspense fallback={<Spinner/>}><Foo /></Suspense>
}
```

> 官方 troubleshooting 明确列此为反模式：会导致子组件状态被重置。

## `<Suspense>` 边界

### props

| prop | 含义 |
| --- | --- |
| `fallback` | 任意 React 节点（spinner / skeleton），fallback **自身若 suspend 会向上冒泡到最近的父 boundary** |
| `children` | 真正内容 |

```tsx
<Suspense fallback={<Spinner />}>
  <Foo />
</Suspense>
```

### 嵌套与揭示策略

| 策略 | 写法 | 效果 |
| --- | --- | --- |
| **一起揭示** | 多个 lazy 组件放在**同一个** boundary 内 | 全部就绪后才整体出现 |
| **逐步揭示** | 各 lazy 组件各自包一层 boundary | 各自按就绪顺序揭示，避免长时间白屏 |

```tsx
// 一起揭示：A、B 都好才显示
<Suspense fallback={<PageSpinner />}>
  <A /><B />
</Suspense>

// 逐步揭示：A、B 各自揭示
<Suspense fallback={<ASkeleton />}><A /></Suspense>
<Suspense fallback={<BSkeleton />}><B /></Suspense>
```

> 官方建议：300ms 揭示节流会让一个窗口内就绪的 boundary 合并揭示。粒度应贴合用户期望的 loading 序列，**不要给每个组件都包 Suspense boundary**——问设计师「loading 应该出现在哪里」。

### 重置 boundary：用 key

切换不同实体（如用户 profile）希望立即显示 fallback 而非保留旧数据时，给 Suspense 加 `key`：

```tsx
<Suspense key={userId} fallback={<ProfileSkeleton />}>
  <Profile id={userId} />
</Suspense>
```

> 不加 key：旧内容会继续显示直到新内容就绪；加 key：跨实体切换时立即显示 fallback。

## 激活条件（哪些场景能让组件 suspend）

Suspense 只在以下场景激活：

| 激活源 | 备注 |
| --- | --- |
| `lazy(() => import())` 加载组件 | 最常见 |
| `use(Promise)` 读 Promise | React 19 |
| `<link rel="stylesheet" precedence>` 加载样式表 | React 19 |
| 流式 SSR HTML | 服务端流式传输 |
| `<ViewTransition>`（Canary）等字体 / 图片 | 实验性 |

**不激活**：

- `useEffect` 内的 `fetch`
- 事件处理器（如 `onClick`）内的 `fetch`
- 普通 `await` 在事件回调里

> 想让数据获取也走 Suspense：要么用支持 Suspense 的数据库（Relay / TanStack Query Suspense mode），要么用 `use()` 读 Promise。

## 错误处理：必须配 Error Boundary

`lazy` 的 loader Promise reject 时，React **把 rejection 作为 throw 抛给最近的 Error Boundary**。React **没有内置 errorComponent 选项**，必须自己写：

```tsx
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    console.error('Suspense loader rejected:', err)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

// 包在 Suspense 外层
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Spinner />}>
    <Foo />
  </Suspense>
</ErrorBoundary>
```

> Error Boundary 必须是 class 组件（hooks 没有 `componentDidCatch` 等价物）。

## startTransition：避免把已显示内容打回 fallback

**核心问题**：默认情况下，**已显示内容的更新**中触发 suspend，会把已揭示的 UI 直接换成 fallback，造成跳变。

**解决**：用 `startTransition` 包裹会触发 suspend 的状态更新，让 React 标记为非紧急、尽量保留旧 UI 直到新内容就绪：

```tsx
import { startTransition, useTransition } from 'react'

// 场景：切 tab 时新组件还没加载
function navigate(next) {
  startTransition(() => {
    setTab(next) // 内部触发的 lazy 加载不会立即显示 fallback
  })
}

// 需要 isPending 状态
const [isPending, startTrans] = useTransition()
function navigate(next) {
  startTrans(() => setTab(next))
}
```

**典型应用**：路由导航、Tab 切换、过滤条件变化。`Suspense-aware` 路由默认会这么做。

> `useDeferredValue` 类似——延迟应用某个值，避免阻塞高优更新。

## 反模式

- 在组件函数体内声明 `lazy(() => import(...))`——每次渲染产生新 lazy 类型，子组件状态重置
- 期待 `useEffect` / 事件处理器里的 `fetch` 触发 Suspense——明确不激活
- 不给 lazy 配 Error Boundary——loader reject 直接抛错无法优雅降级
- 给每个组件都包 Suspense boundary——粒度过细，应贴合用户期望
- 过度分割（每个小组件都 lazy）——触发 chunk waterfall，反而损害性能
- 在「已显示内容」的更新中直接 suspend 而不用 `startTransition`——已揭示内容被打回 fallback 造成跳变

## 路由级懒加载

路由切换是用户可接受的 loading 边界，**性价比最高**：

```tsx
import { lazy, Suspense } from 'react'
import { startTransition } from 'react'

const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  const [route, setRoute] = useState('home')
  function navigate(next) {
    startTransition(() => setRoute(next)) // 关键：标记为非紧急
  }
  return (
    <Suspense fallback={<PageSpinner />}>
      {route === 'settings' && <Settings />}
      {route === 'profile' && <Profile />}
    </Suspense>
  )
}
```

> React Router / Next.js / TanStack Router 等 Suspense-aware 路由已内置这套机制。

## 下一步

- [Vue 异步组件深度](./vue-async-components.md)：Vue 的对照方案
- [参考](../reference.md)：Vue / React API 对照表
