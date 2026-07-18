---
layout: doc
outline: [2, 3]
---

# Vue 异步组件深度

> 基于 Vue 3 官方文档（异步组件 + Suspense + 通用 API）

## 速查

- **简写**：`defineAsyncComponent(() => import('./Foo.vue'))`
- **选项默认**：`delay=200` / `timeout=Infinity` / `suspensible=true` / `loadingComponent/errorComponent/onError` 可选
- **delay=200 设计**：快网下加载瞬时，立即显示 loading 又瞬间被换会闪烁，200ms 内完成则不显示
- **timeout 超时**：超过则**走 errorComponent**（与 loader reject 同走 errorComponent）
- **onError(err, retry, fail, attempts)**：手动决定重试 / 放弃
- **Suspense 接管规则**：默认 `suspensible=true` 时组件自身 loading/error/delay/timeout 被 Suspense 接管忽略；改 `false` 让组件自管
- **async setup**：`<script setup>` 顶层 `await` 自动成为 Suspense 依赖
- **`<Suspense>` 插槽**：`#default` / `#fallback` 各只允许 **1 个直接子节点**；事件 `pending` / `resolve` / `fallback`
- **嵌套 Suspense 3.3+**：内层加 `suspensible` 把 async 依赖与事件委托给父 boundary
- **Lazy Hydration 3.5+**：`hydrateOnIdle/hydrateOnVisible/hydrateOnMediaQuery/hydrateOnInteraction` + 自定义 `HydrationStrategy`，仅 SSR
- **错误处理**：Suspense 自身不提供错误 UI，用父级 `onErrorCaptured` / `errorCaptured` 钩子

## defineAsyncComponent 选项逐项

### loader（必填）

返回 Promise 的函数。Promise 解析为组件定义（普通组件对象）。配合构建工具的 ESM 动态 `import()` 自动产生独立 chunk。

```ts
const Foo = defineAsyncComponent(() => import('./Foo.vue'))
```

> loader **只在组件实际渲染时调用一次**，结果被缓存；后续再渲染同一组件不会重新加载。

### loadingComponent（可选）

加载期间显示的占位组件，建议保持轻量（spinner / skeleton）。在 `delay` 时间之后才显示。

### errorComponent（可选）

加载失败或超时（`timeout` 触发）时显示的组件。

### delay（默认 200ms）

显示 `loadingComponent` 之前的等待时间。**为什么默认不是 0**：在快网上加载几乎瞬时完成，立刻显示 loading 又瞬间被替换会形成闪烁（flicker），用户体验反而差。200ms 内完成则**根本不显示** loading。

> 改成 0 会增加无意义闪烁；除非确有需求（如展示骨架屏做品牌动效），保留默认。

### timeout（默认 Infinity）

最长加载时间，超过则**显示 errorComponent**（与 loader reject 同走 errorComponent 路径）。默认 `Infinity` 表示永不超时。

```ts
const Foo = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
  loadingComponent: Loading,
  errorComponent: Error,
  timeout: 3000, // 3 秒未加载完 → 显示 Error
})
```

### suspensible（默认 true）

**关键且常被误解的选项**。

- `true`（默认）：把组件的 loading/error/delay/timeout 处理**全权交给上层 `<Suspense>`**——当存在 Suspense 父链时，组件自身的 loadingComponent/errorComponent/delay/timeout **被忽略**，loading 由 Suspense 的 `#fallback` 统一展示
- `false`：组件自己管理 loading/error/delay/timeout，**即使外层有 Suspense 也独立处理**

```ts
// 想让组件自己控制 loading，不被外层 Suspense 接管
const Foo = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
  loadingComponent: Loading,
  delay: 100,
  suspensible: false, // 关键
})
```

> 「我的 loadingComponent 怎么不显示？」——99% 是因为外层有 `<Suspense>` 把它接管了。

### onError(err, retry, fail, attempts)（可选）

loader reject 时调用。`retry()` 重试 loader，`fail()` 放弃（走 errorComponent），`attempts` 是当前尝试次数（从 1 开始）。

```ts
const Foo = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
  onError(err, retry, fail, attempts) {
    if (err.status === 503 && attempts <= 3) retry()  // 限流重试
    else fail()
  },
})
```

## async setup 与 Suspense 依赖

Composition API 的 `setup` 可以是 async 函数。`<script setup>` 中只要出现**顶层 await**，该组件就自动成为 `<Suspense>` 的 async 依赖：

```vue
<!-- UserProfile.vue -->
<script setup lang="ts">
const user = await fetchUser() // 顶层 await → 自动是 async 依赖
</script>
```

```vue
<!-- 父组件 -->
<Suspense>
  <template #default><UserProfile /></template>
  <template #fallback><Spinner /></template>
</Suspense>
```

> `async setup()` 仅在 `<Suspense>` 父链下可用，否则 Vue 会警告。

## `<Suspense>` 内置组件

### 插槽约束

`<Suspense>` 只有两个具名插槽，每个**只允许 1 个直接子节点**：

```vue
<Suspense>
  <template #default>
    <AsyncComponent />  <!-- 唯一直接子节点 -->
  </template>
  <template #fallback>
    <Spinner />         <!-- 唯一直接子节点 -->
  </template>
</Suspense>
```

多根节点会出错；多个异步组件应在 `#default` 的子节点内部组合，而非直接平铺多个。

### 状态机

```
initial render
   ↓ 遇到 async 依赖
pending（显示 #fallback）
   ↓ 所有 async 依赖完成
resolved（显示 #default）
```

**重要**：进入 `resolved` 后，**只有 `#default` 根节点被替换**才会重新进入 `pending`。深层新出现的 async 依赖**不会**让 Suspense 重新 pending。

### props

| prop | 类型 | 含义 |
| --- | --- | --- |
| `timeout` | number (ms) | `#default` 根节点被替换、回退到 fallback 的等待时间；`0` = 立即回退 |

### 事件

| 事件 | 触发时机 |
| --- | --- |
| `pending` | 进入 pending 状态 |
| `resolve` | default 完成（所有 async 依赖就绪） |
| `fallback` | fallback 内容被显示 |

```vue
<Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
  ...
</Suspense>
```

## 错误处理

**`<Suspense>` 自身不提供错误 UI**。异步错误（loader reject / async setup throw）需要用父级的 `onErrorCaptured` 钩子捕获：

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue'
const err = ref(null)
onErrorCaptured((e) => {
  err.value = e
  return false // 阻止继续向上抛
})
</script>

<template>
  <Error v-if="err" :error="err" />
  <Suspense v-else>
    <template #default><AsyncPage /></template>
    <template #fallback><Spinner /></template>
  </Suspense>
</template>
```

## 嵌套 Suspense（3.3+）

子 `<Suspense>` 加 `suspensible` prop 后，**把 async 依赖处理与事件全权委托给父 boundary**：

```vue
<!-- 父 -->
<Suspense>
  <template #default><LayoutWithAsyncChildren /></template>
  <template #fallback><PageSpinner /></template>
</Suspense>

<!-- LayoutWithAsyncChildren 内部 -->
<Suspense suspensible>
  <template #default><AsyncContent /></template>
  <template #fallback><ContentSpinner /></template>
</Suspense>
```

> 不加 `suspensible` 时内层被当同步组件处理，两个 Dynamic 同时变化会出现空节点和多次 patch 循环。

## Lazy Hydration（3.5+，仅 SSR）

把组件的**水合**也按需发生，进一步降低低端机首屏负担。四种内置策略 + 自定义：

```ts
import {
  defineAsyncComponent,
  hydrateOnIdle,
  hydrateOnVisible,
  hydrateOnMediaQuery,
  hydrateOnInteraction,
} from 'vue'

const HeavyComp = defineAsyncComponent({
  loader: () => import('./Heavy.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '100px' }),
})

// 交互时水合
const Dialog = defineAsyncComponent({
  loader: () => import('./Dialog.vue'),
  hydrate: hydrateOnInteraction('click'),
})

// 自定义策略
function hydrateOnHover(hydrate, forEachElement) {
  forEachElement(el => {
    el.addEventListener('mouseenter', hydrate, { once: true })
  })
}
```

| 策略 | 触发时机 |
| --- | --- |
| `hydrateOnIdle()` | 浏览器空闲时 |
| `hydrateOnVisible({ rootMargin })` | 进入视口时 |
| `hydrateOnMediaQuery('(max-width: 500px)')` | 匹配媒体查询时 |
| `hydrateOnInteraction('click' \| [...])` | 用户与组件交互时 |

## 与 Transition / KeepAlive / RouterView 的正确顺序

官方给定的唯一正确组合顺序：

```
<Transition mode="out-in">
  <KeepAlive>
    <Suspense>
      <component :is="Component" />  ← RouterView 解析的组件
    </Suspense>
  </KeepAlive>
</Transition>
```

颠倒会导致过渡 / 缓存 / loading 三者行为互相干扰。

## 反模式

- 以为 Suspense 父链下 async 组件的 loading/error/delay/timeout 还会生效——默认 `suspensible=true` 时这些选项全部被 Suspense 接管忽略
- `<Suspense>` 的 `#default` / `#fallback` 各放多个根节点
- 以为 Vue Router 的 `() => import()` 路由懒加载会触发 `<Suspense>`——官方明确「目前」不会，只有其内部 async 子组件或 async setup 才会
- 以为 resolved 状态下深层新出现的 async 依赖会让 Suspense 重新 pending——只有根节点被替换才会
- 在 `#default` 直接放多个根级异步组件希望分别 fallback——同 boundary 内任一 suspend 都会触发整体 fallback，应改用嵌套 Suspense

## 下一步

- [React 异步组件深度](./react-async-components.md)：lazy 契约、Suspense 激活条件、Error Boundary、startTransition
- [参考](../reference.md)：Vue / React API 对照表
