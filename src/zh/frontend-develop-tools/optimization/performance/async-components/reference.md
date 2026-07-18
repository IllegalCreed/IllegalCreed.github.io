---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vue 3 / React 19.2 官方文档编写

## 速查

- **Vue**：`defineAsyncComponent(loader | options)`；选项 `loader/loadingComponent/errorComponent/delay=200/timeout=Infinity/suspensible=true/onError`；`<Suspense>` 双插槽单子节点 + 事件 `pending/resolve/fallback`
- **React**：`lazy(load)` 必须顶层声明 + load 返回 Promise，解析值含 `.default`；`<Suspense fallback>`；错误用 Error Boundary class；`startTransition` 包裹会 suspend 的更新
- **Vue 版本要点**：嵌套 Suspense 3.3+；Lazy Hydration 3.5+；`<Suspense>` 仍标 Experimental
- **React 版本要点**：`lazy/Suspense` 均稳定；`use()` 读 Promise 19+；`useDeferredValue` 19+
- **共同点**：路由级懒加载是最划算的分割点；fallback 要轻量；过度分割会触发 chunk waterfall
- **关键差异**：Vue 有内置 `errorComponent/onError/timeout`；React 必须自己写 Error Boundary
- 详见 [入门](./getting-started.md) / [Vue 异步组件深度](./guide-line/vue-async-components.md) / [React 异步组件深度](./guide-line/react-async-components.md)

## Vue API

### defineAsyncComponent 选项对象

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `loader` | `() => Promise<Component>` | 必填 | 返回组件定义的 Promise |
| `loadingComponent` | Component | — | 加载期间显示的占位组件 |
| `errorComponent` | Component | — | 失败 / 超时显示的组件 |
| `delay` | number | `200` | 显示 loading 前等待 ms（避免闪烁） |
| `timeout` | number | `Infinity` | 超过则显示 errorComponent |
| `suspensible` | boolean | `true` | 是否交给上层 Suspense 接管（true 时自身 loading/error/delay/timeout 被忽略） |
| `onError` | `(err, retry, fail, attempts) => any` | — | loader reject 时调用，决定重试或放弃 |

### `<Suspense>` 内置组件

| prop / 事件 | 类型 / 触发 | 说明 |
| --- | --- | --- |
| `#default` 插槽 | 单子节点 | 真正内容；只允许 1 个直接子节点 |
| `#fallback` 插槽 | 单子节点 | pending 期间占位；只允许 1 个直接子节点 |
| `timeout` prop | number(ms) | `#default` 根节点替换时回退 fallback 的等待，`0`=立即回退 |
| `suspensible` prop（3.3+） | boolean | 内层 Suspense 是否委托给父 boundary |
| `pending` 事件 | 进入 pending | async 依赖出现 |
| `resolve` 事件 | 解析完成 | default 全部 async 依赖就绪 |
| `fallback` 事件 | 显示 fallback | fallback 内容被渲染 |

### Lazy Hydration 策略（3.5+，仅 SSR）

| 策略 | 触发时机 |
| --- | --- |
| `hydrateOnIdle()` | 浏览器空闲 |
| `hydrateOnVisible({ rootMargin })` | 进入视口 |
| `hydrateOnMediaQuery(query)` | 媒体查询匹配 |
| `hydrateOnInteraction(event)` | 用户交互 |
| 自定义 `HydrationStrategy(hydrate, forEachElement)` | 自定义逻辑 |

### 类型签名（简化）

```ts
function defineAsyncComponent<T>(
  source: (() => Promise<T>) | AsyncComponentOptions<T>
): Component

interface AsyncComponentOptions<T> {
  loader: () => Promise<T>
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number           // 默认 200
  timeout?: number         // 默认 Infinity
  suspensible?: boolean    // 默认 true
  onError?: (
    error: Error,
    retry: () => void,
    fail: () => void,
    attempts: number
  ) => any
}
```

## React API

### React.lazy

```ts
function lazy<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>
): T
```

| 要点 | 说明 |
| --- | --- |
| 顶层声明 | 不能写在组件函数体内 |
| `load` 契约 | 无参函数，返回 Promise 或 thenable |
| 解析值 | 必须含 `.default`，且为合法组件类型 |
| 调用次数 | load 只在第一次需要时调用一次，结果被缓存 |

### `<Suspense>` 组件

| prop | 类型 | 说明 |
| --- | --- | --- |
| `fallback` | ReactNode | suspend 时显示；自身若 suspend 冒泡到父 boundary |
| `children` | ReactNode | 真正内容 |

### 配套 API

| API | 用途 |
| --- | --- |
| `startTransition(fn)` | 把 fn 内的更新标记为非紧急，触发 suspend 时保留旧 UI |
| `useTransition()` | `[isPending, startTransition]`，可拿到 pending 状态 |
| `useDeferredValue(v)` | 延迟应用某值，避免阻塞高优更新 |
| `use(Promise)` | 读 Promise（React 19），可触发 Suspense |
| Error Boundary（class） | 实现 `getDerivedStateFromError` + `componentDidCatch`，捕获 lazy reject |

### Suspense 激活条件

| 激活源 | 备注 |
| --- | --- |
| `lazy()` 加载组件 | 最常见 |
| `use(Promise)` | React 19 |
| `<link rel="stylesheet" precedence>` | React 19 |
| 流式 SSR HTML | 服务端流式 |
| `<ViewTransition>`（Canary） | 实验性 |

不激活：`useEffect` / 事件处理器内的 `fetch`。

## Vue vs React 对比

| 维度 | Vue | React |
| --- | --- | --- |
| 入口 API | `defineAsyncComponent(loader \| options)` | `lazy(load)` |
| 占位组件 | `loadingComponent` 选项 | `<Suspense fallback={...}>` |
| 错误组件 | `errorComponent` 选项 | 必须自写 Error Boundary |
| 错误重试 | `onError(err, retry, fail, attempts)` | 自己在 Error Boundary 里实现 |
| 延迟显示 | `delay` 选项（默认 200ms） | 自己控制 fallback 显示逻辑 |
| 超时 | `timeout` 选项（默认 Infinity） | 自己实现（如 react-delay） |
| 顶层 await | `<script setup>` 自动是 Suspense 依赖 | 不支持（需 `use()`） |
| 嵌套 boundary | 3.3+，内层加 `suspensible` prop | 原生支持，按层级揭示 |
| SSR 按需水合 | 3.5+ Lazy Hydration | 由框架（Next.js）实现 |
| 实验性标记 | `<Suspense>` 仍 Experimental | lazy / Suspense 均稳定 |

## 版本要求

- **Vue 嵌套 Suspense**：3.3+
- **Vue Lazy Hydration**：3.5+
- **Vue `<Suspense>`**：仍标注 Experimental，API 可能变动
- **React `lazy`**：稳定（自 16.6）
- **React `<Suspense>`**：稳定（自 16.6）；SSR 支持自 18
- **React `use()` 读 Promise 触发 Suspense**：19+
- **React `useDeferredValue`**：19+
- **构建工具动态 `import()`**：webpack 2.27+ / Rollup 1.0+ / Vite / esbuild 全部支持

## 官方资源

### Vue

- 异步组件指南：[https://vuejs.org/guide/components/async.html](https://vuejs.org/guide/components/async.html)
- Suspense 指南：[https://vuejs.org/guide/built-ins/suspense.html](https://vuejs.org/guide/built-ins/suspense.html)
- 通用 API（defineAsyncComponent 类型）：[https://vuejs.org/api/general.html](https://vuejs.org/api/general.html)

### React

- lazy API：[https://react.dev/reference/react/lazy](https://react.dev/reference/react/lazy)
- Suspense API：[https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense)
- Suspense 概览：[https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense)
- useTransition：[https://react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition)

### 构建工具

- webpack 动态 import：[https://webpack.js.org/guides/code-splitting](https://webpack.js.org/guides/code-splitting)
- Vite 动态 import：[https://vite.dev/guide/features.html#dynamic-import](https://vite.dev/guide/features.html#dynamic-import)
- Rollup 动态 import：[https://rollupjs.org/guide/en/#dynamic-import](https://rollupjs.org/guide/en/#dynamic-import)
