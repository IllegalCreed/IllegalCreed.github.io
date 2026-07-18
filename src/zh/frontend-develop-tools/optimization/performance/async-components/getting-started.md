---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vue 3 / React 19.2 官方文档编写

## 速查

- **本质**：把组件代码从主 bundle 拆出，渲染时才动态 `import()` 加载，加载期间用 fallback 占位
- **Vue 写法**：`defineAsyncComponent(() => import('./Foo.vue'))`；选项对象加 `loadingComponent/errorComponent/delay=200/timeout=Infinity/suspensible=true/onError`
- **React 写法**：`const Foo = lazy(() => import('./Foo'))` + 在父级用 `<Suspense fallback={<Spinner/>}>` 包住
- **loader 契约**：返回 Promise，解析值为模块对象；Vue 取 `default` 或整个模块，React **必须**取 `.default` 且为合法组件
- **触发加载**：组件**真正被渲染**时才调用 loader 一次（结果会缓存）
- **路由级懒加载最划算**：Vue Router `() => import(...)`、React 在 route 边界用 `lazy + Suspense`
- **Vue Suspense 接管**：默认 `suspensible:true`，组件自身 loading/error/delay/timeout 在 Suspense 父链下被忽略
- **React 错误**：loader reject → throw 给最近的 Error Boundary（React 无内置 errorComponent）
- **反模式**：React 在组件函数体内声明 `lazy(...)`；Vue `<Suspense>` 插槽多根；过度分割导致 chunk waterfall

## 什么是异步组件

异步组件（Async Component）= **它本身的定义是异步获取的**。普通组件在应用启动时就被打包进主 bundle、随脚本同步注册；而异步组件只保留一个 `loader`（加载器函数），等组件真正要被渲染时才去调用 loader、拉取对应 chunk，并在拿到代码前用占位 UI 兜底。

```ts
// Vue：loader 返回 Promise，解析后取 default
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))

// React：lazy 的契约相同，Suspense 提供占位
const HeavyChart = lazy(() => import('./HeavyChart'))
;<Suspense fallback={<Spinner />}><HeavyChart /></Suspense>
```

> 关键点：**异步是「定义」层面**的，使用方仍然像普通组件一样写 `<HeavyChart />`，框架负责拉取代码与切换 fallback。

## 为什么要异步组件：代码分割

**动机 = 首屏体积**。一个大型应用如果所有组件都同步打包：

- 主 bundle 越来越大，下载 / 解析 / 执行时间随之上升
- 用户首屏根本看不到的模块（设置面板、二级路由、巨型图表库）也占用首屏预算
- 单页应用尤其严重——所有路由代码默认都在初始包里

异步组件配合构建工具（Vite / Rollup / webpack / esbuild）的 ESM 动态 `import()` 会自动**产生一个独立的 chunk**：

```ts
// 这一行就是分割点，构建工具会生成单独的 js 文件
const Settings = defineAsyncComponent(() => import('./Settings.vue'))
```

效果：首屏只下载主 bundle；用户点到「设置」时才下载 `Settings` 对应的 chunk，并在下载期间显示 loading。

> 与「按需引入第三方库」不同：异步组件拆的是**应用自身的业务代码**，是首屏优化的核心手段。

## Vue defineAsyncComponent 速览

`defineAsyncComponent` 接受两种入参：

```ts
// 1. 简化形式：只传 loader
const Foo = defineAsyncComponent(() => import('./Foo.vue'))

// 2. 选项对象：完整控制 loading / error / delay / timeout / 重试
const Foo = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
  loadingComponent: Loading,        // 加载期间显示
  errorComponent: Error,            // 失败 / 超时显示
  delay: 200,                       // 显示 loading 前等待 ms（默认 200）
  timeout: 3000,                    // 超过 ms 显示 error（默认 Infinity）
  suspensible: true,                // 是否交给 <Suspense> 接管（默认 true）
  onError(err, retry, fail, attempts) {
    if (attempts <= 3) retry()
    else fail()
  },
})
```

> 详见 [Vue 异步组件深度](./guide-line/vue-async-components.md)。

## React lazy 速览

`React.lazy` 只接受一个无参函数 `load`，返回 Promise 或 thenable，解析值必须含 `.default`：

```tsx
// 顶层声明，不要在组件函数体里写！
const Foo = lazy(() => import('./Foo'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Foo />
    </Suspense>
  )
}
```

错误处理需要 Error Boundary（class 组件，实现 `getDerivedStateFromError` + `componentDidCatch`）：

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error(err) }
  render() {
    return this.state.hasError ? <Error /> : this.props.children
  }
}

// 包在 Suspense 外层
;<ErrorBoundary><Suspense fallback={<Spinner />}><Foo /></Suspense></ErrorBoundary>
```

> 详见 [React 异步组件深度](./guide-line/react-async-components.md)。

## 第一条建议：先在路由层做分割

路由切换天然是用户能接受的 loading 边界，**性价比最高**：

- **Vue Router**：直接用动态 `import()` 作为 route component，无需 `defineAsyncComponent`
- **React**：在 route 边界用 `lazy + Suspense`，并用 `startTransition` 包裹路由导航

```ts
// Vue Router
const routes = [
  { path: '/settings', component: () => import('./Settings.vue') },
]
```

```tsx
// React（伪代码，框架路由器会自带 Suspense 边界）
const Settings = lazy(() => import('./Settings'))

// React 19 路由切换用 startTransition，保留旧内容直到新页就绪
function navigate(next) {
  startTransition(() => router.push(next))
}
```

## 下一步

- [Vue 异步组件深度](./guide-line/vue-async-components.md)：`defineAsyncComponent` 选项逐项、`<Suspense>` 状态机、嵌套、Lazy Hydration 3.5+
- [React 异步组件深度](./guide-line/react-async-components.md)：`lazy` 契约、`<Suspense>` 激活条件、Error Boundary、`startTransition`、反模式
- [参考](./reference.md)：Vue / React API 表、版本要求、官方链接
