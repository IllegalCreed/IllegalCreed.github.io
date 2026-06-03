---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 VueHooks Plus 的旗舰 `useRequest` 全选项，以及 State / Effect / DOM / Scene / Advanced 各类常用 hook。基于 **v2.x**（要求 Vue 3.2.25+）。

## 旗舰：useRequest 全景

`useRequest` 是 VueHooks Plus 的灵魂——一个**插件化架构**的「请求中间层」。它接收一个返回 Promise 的 **service** 函数和一个 **options** 配置对象，返回一套完整的请求状态与控制方法。

### 返回值（Result）

```ts
const {
  data,         // Readonly<Ref<TData | undefined>> —— 请求成功的数据
  loading,      // Readonly<Ref<boolean>> —— 是否加载中
  error,        // Readonly<Ref<Error | undefined>> —— 请求失败的错误
  params,       // Readonly<Ref<TParams>> —— 最近一次请求的参数
  run,          // 手动触发（同步风格，错误进 onError）
  runAsync,     // 手动触发（返回 Promise，需自行 try/catch）
  refresh,      // 用上次的参数重新请求
  refreshAsync, // refresh 的 Promise 版本
  mutate,       // 直接修改 data（乐观更新）
  cancel,       // 取消当前请求
} = useRequest(service, options)
```

### run vs runAsync vs refresh

三组触发方法的区别是高频考点：

| 方法 | 是否返回 Promise | 错误处理 | 参数 | 典型用途 |
|---|---|---|---|---|
| `run(...args)` | 否 | 自动捕获，进 `onError` | 自定义 | 模板里 `@click="run(id)"` |
| `runAsync(...args)` | **是** | **需自行 `try/catch`** | 自定义 | 需要拿到结果做后续逻辑 |
| `refresh()` | 否 | 自动捕获 | **复用上次参数** | 「刷新」按钮 |
| `refreshAsync()` | 是 | 需自行 catch | 复用上次参数 | 刷新后等待结果 |

```ts
// run：错误被内部捕获，不会抛出
run(1)

// runAsync：返回 Promise，错误会抛出，需自己处理
try {
  const user = await runAsync(1)
  console.log(user)
} catch (e) {
  console.error('请求失败', e)
}
```

### 自动 vs 手动（manual / defaultParams）

```ts
// 默认 manual: false —— 组件挂载即自动执行，用 defaultParams 作为首次参数
const { data } = useRequest(getUser, { defaultParams: [1] })

// manual: true —— 不自动执行，必须调用 run / runAsync 才发起
const { run } = useRequest(submitForm, { manual: true })
```

### ready：就绪控制

`ready` 为 `false` 时**不发起请求**，变为 `true` 时自动触发（自动模式下）——常用于「等某个依赖准备好再请求」：

```ts
import { ref } from 'vue'

const userId = ref<number>()
// userId 为空时不请求；一旦有值，自动发起
const { data } = useRequest(() => getUser(userId.value!), {
  ready: () => !!userId.value,
})
```

### refreshDeps：依赖刷新

监听响应式依赖，依赖变化时**自动用上次参数重新请求**（类似 `watch`）：

```ts
const page = ref(1)
// page 变化时自动 refresh
const { data } = useRequest(() => getList(page.value), {
  refreshDeps: [page],
  // 可选：自定义依赖变化时的动作，覆盖默认的 refresh
  // refreshDepsAction: () => run(page.value),
})
```

### loadingDelay：防闪烁

请求很快时 loading 一闪而过反而难看。`loadingDelay` 让 loading **延迟若干毫秒才置 true**——若请求在此之前已返回，则 loading 始终为 false：

```ts
// 请求 < 300ms 时不显示 loading，避免闪烁
const { loading } = useRequest(getUser, { loadingDelay: 300 })
```

### pollingInterval：轮询

设置后**自动按间隔重复请求**，适合实时数据：

```ts
const { data } = useRequest(getStatus, {
  pollingInterval: 3000,        // 每 3 秒轮询一次
  pollingWhenHidden: false,     // 页面隐藏时暂停轮询，回到前台恢复
  pollingErrorRetryCount: 3,    // 轮询出错时最多重试 3 次后停止
})
```

### debounceWait / throttleWait：防抖与节流

把请求**防抖或节流**——常用于搜索框输入：

```ts
const keyword = ref('')
// 输入停止 500ms 后才真正请求 —— 防抖
const { data, run } = useRequest(search, {
  manual: true,
  debounceWait: 500,
})
// 节流：throttleWait —— 固定间隔最多请求一次
```

> **踩坑**：`debounceWait` 与 `pollingInterval` 叠加时行为复杂，一般**二选一**；防抖/节流需配合 `manual: true` + 在输入事件里调 `run`。

### refreshOnWindowFocus：聚焦重新请求

浏览器标签页**重新获得焦点时自动刷新**数据（SWR 思路）：

```ts
const { data } = useRequest(getUser, {
  refreshOnWindowFocus: true,
  focusTimespan: 5000,   // 5 秒内重复聚焦不重复请求（节流）
})
```

### 缓存与 SWR（cacheKey / staleTime / cacheTime）

设置 `cacheKey` 后，相同 key 的请求**共享缓存**——再次进入页面时**先返回缓存数据、后台静默重新请求**（Stale-While-Revalidate）：

```ts
const { data } = useRequest(getUser, {
  cacheKey: 'user-info',
  staleTime: 5000,    // 5 秒内认为缓存新鲜，不重新请求
  cacheTime: 600000,  // 缓存保留 10 分钟后回收
})
```

- **`staleTime`**：缓存「新鲜期」——期内直接用缓存、不发请求
- **`cacheTime`**：缓存「保留期」——超时后缓存被清除
- 同 `cacheKey` 的多个组件**共享请求与数据**，并支持跨页面恢复

### retryCount：错误重试

```ts
const { data } = useRequest(getUser, {
  retryCount: 3,        // 失败后最多重试 3 次
  retryInterval: 1000,  // 重试间隔（不设则按指数退避）
})
```

### mutate：乐观更新

不等请求返回，**直接本地修改 `data`**——典型用于「点赞」「编辑」的即时反馈：

```ts
const { data, mutate } = useRequest(getArticle)

function like() {
  // 立即本地 +1（乐观更新），再发请求；失败可回滚
  mutate(prev => ({ ...prev!, likes: prev!.likes + 1 }))
}
```

### 生命周期回调与中间件（use）

```ts
useRequest(getUser, {
  onBefore: (params) => console.log('请求前', params),
  onSuccess: (data, params) => console.log('成功', data),
  onError: (e, params) => console.error('失败', e),
  onFinally: (params, data, e) => console.log('结束'),
  use: [/* 自定义中间件 */],   // 插件化扩展点
})
```

## State 类

| Hook | 返回 | 说明 |
|---|---|---|
| `useBoolean(default=false)` | `[state, { toggle, set, setTrue, setFalse }]` | 布尔状态管理 |
| `useToggle(default, reverse?)` | `[state, { toggle, set, setLeft, setRight }]` | 在两个值间切换 |
| `useCounter(init, { min, max })` | `[current, { inc, dec, set, reset }]` | 带边界的计数器 |
| `useSetState(initial)` | `[state, setState]` | 合并式对象状态（类似 React `setState`） |
| `useLocalStorageState(key, opts)` | `[state, setState]` | 响应式 localStorage |
| `useSessionStorageState(key, opts)` | `[state, setState]` | 响应式 sessionStorage |
| `useUrlState(initial, opts)` | URL 同步的响应式状态 | **依赖 vue-router**，需传 `router.push` |
| `usePrevious(state)` | 上一次的值 | 保存前一个状态 |

```ts
import { useSetState } from 'vue-hooks-plus'

// useSetState：合并而非替换 —— 只更新传入的字段
const [state, setState] = useSetState({ name: 'Tom', age: 1 })
setState({ age: 2 }) // name 保留，age 更新
```

> **`useUrlState` 注意**：它需要你**传入 `vue-router` 的 `router.push`**（`routerPushFn`），并可选 `localStorageKey` 作为 URL 无参时的回退来源。

## Effect 类

| Hook | 说明 |
|---|---|
| `useDebounceFn(fn, { wait })` | 返回防抖后的函数 |
| `useThrottleFn(fn, { wait })` | 返回节流后的函数 |
| `useDebounce(value, { wait })` | 防抖后的响应式值 |
| `useThrottle(value, { wait })` | 节流后的响应式值 |
| `useInterval(fn, interval)` | 自动清理的 setInterval |
| `useTimeout(fn, delay)` | 自动清理的 setTimeout |
| `useLockFn(asyncFn)` | 给异步函数加「执行锁」，防止并发重复调用 |
| `useUpdate()` | 返回一个强制组件重渲染的函数 |

```ts
import { useLockFn } from 'vue-hooks-plus'

// useLockFn：提交中再次点击会被忽略，直到上次完成 —— 防重复提交
const submit = useLockFn(async () => {
  await postForm()
})
```

## DOM 类

| Hook | 说明 |
|---|---|
| `useEventListener(event, handler, { target })` | 自动清理的事件监听 |
| `useMouse()` | 响应式鼠标坐标 |
| `useFullscreen(target)` | 全屏控制（`enterFullscreen` / `exitFullscreen` / `toggleFullscreen`） |
| `useHover(target)` | 元素是否悬停 |
| `useInViewport(target)` | 元素是否进入视口（IntersectionObserver） |
| `useScroll(target)` | 滚动位置 |
| `useSize(target)` | 元素尺寸（ResizeObserver） |
| `useElementBounding(target)` | 元素的 getBoundingClientRect |
| `useKeyPress(keyFilter, handler)` | 键盘按键监听 |
| `useTitle(title)` | 响应式 `document.title` |
| `useFavicon(url)` | 动态网站图标 |
| `useNetwork()` | 网络状态（在线/离线、类型） |

```ts
import { useEventListener } from 'vue-hooks-plus'

useEventListener('keydown', (e) => {
  if ((e as KeyboardEvent).key === 'Escape') close()
}, { target: window })
```

## Scene 类（业务场景）

这是 VueHooks Plus 的另一亮点——开箱即用的复杂业务 hook：

### useVirtualList：虚拟列表

只渲染视口内的元素，万级长列表也流畅：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useVirtualList } from 'vue-hooks-plus'

const containerRef = ref<HTMLElement>()
const source = ref(Array.from({ length: 10000 }, (_, i) => i))

const { list, wrapperStyle, containerStyle } = useVirtualList(source, {
  itemHeight: 50,          // 每行高度（或 (index, data) => number 动态高度）
  overscan: 5,             // 视口上下额外渲染的缓冲行数
})
</script>
```

> 不同小版本返回字段（`list` / `ref` / `onScroll` / `wrapperStyle` 等）略有差异，以你安装版本的文档为准。

### useInfiniteScroll：无限滚动

滚动到底部自动加载下一页，多次结果**自动合并**：

```ts
const { data, loading, loadingMore, noMore, loadMore, reload } = useInfiniteScroll(
  (currentData) => getList(currentData?.nextId),
  {
    target: containerRef,                 // 滚动容器，触底自动加载
    isNoMore: (d) => d?.nextId === undefined, // 判断是否到末页
    threshold: 100,                       // 距底部多少 px 触发
  },
)
```

### useWebSocket：WebSocket 封装

```ts
const { latestMessage, sendMessage, readyState, connect, disconnect } =
  useWebSocket('wss://example.com/ws')
```

### useDrag / useDrop：拖拽

`useDrag` 标记可拖拽元素、`useDrop` 标记放置区，配合实现拖放交互。

## Advanced 类（开发调试）

| Hook | 说明 |
|---|---|
| `useTrackedEffect(effect, deps)` | 追踪是**哪个依赖**触发了 effect 重新执行 |
| `useWhyDidYouUpdate(name, props)` | 打印**哪些 props 变化**导致组件更新——排查无谓重渲染 |

```ts
import { useWhyDidYouUpdate } from 'vue-hooks-plus'

// 开发期排查：控制台会打印每次更新中变化的字段
useWhyDidYouUpdate('MyComponent', { propA, propB })
```

## 常见踩坑

- **轮询与防抖/节流叠加**：`pollingInterval` 与 `debounceWait` / `throttleWait` 同时设置时行为复杂，通常**二选一**；防抖/节流务必配 `manual: true` 并在事件里调 `run`
- **`run` 吞掉错误**：`run` 的错误进 `onError` 而不抛出——需要拿到异常做后续处理时用 `runAsync` + `try/catch`
- **`cacheKey` 共享是把双刃剑**：相同 `cacheKey` 的请求共享数据，参数不同却用同一 key 会**串数据**——key 设计需包含区分维度
- **`useUrlState` 必须传 router**：它依赖 `vue-router`，需显式传入 `router.push`，否则无法同步 URL
- **SSR hydration mismatch**：`useLocalStorageState` 等依赖浏览器的 hook 在 SSR 阶段是默认值，参与首屏渲染时注意水合不一致警告
- **与 VueUse 同装的取舍**：`useToggle` / `useCounter` / `useLocalStorageState` / `useEventListener` 在 VueUse 里都有——同时装两库时建议**「请求管理用 VueHooks Plus、通用浏览器工具用 VueUse」**，避免心智混乱
- **`Hooks` 命名**：本库沿用 React「Hooks」叫法，但它就是 Vue 的**组合式函数（composable）**，受「必须在 setup 同步期调用」约束，不受 React Hook 规则约束
