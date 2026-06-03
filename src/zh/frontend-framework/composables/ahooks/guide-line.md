---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 ahooks 的旗舰 `useRequest` 全选项，以及 Scene / State / Effect / Dom / Advanced / Dev 各类常用 hook。基于 **v3.x**（React 专用）。

## 旗舰：useRequest 全景

`useRequest` 是 ahooks 唯一采用**插件化架构**的 hook——核心负责 `loading / data / error / params` 与 `run / runAsync / refresh / refreshAsync / mutate / cancel`，进阶能力（ready、依赖刷新、轮询、防抖、节流、聚焦刷新、缓存、重试）由 8 个插件实现。

### 返回值（Result）

```ts
const {
  data,         // TData | undefined —— service resolve 的数据
  error,        // Error | undefined —— service 抛出的异常
  loading,      // boolean —— 是否执行中
  params,       // TParams | [] —— 当次执行的参数数组（run(1,2) → [1,2]）
  run,          // (...params) => void —— 同步触发，自动捕获异常进 onError
  runAsync,     // (...params) => Promise<TData> —— 返回 Promise，异常需自行 catch
  refresh,      // () => void —— 用上一次的 params 重新 run
  refreshAsync, // () => Promise<TData>
  mutate,       // (data | (old) => data) => void —— 直接改 data（乐观更新）
  cancel,       // () => void —— 忽略当前 promise 的响应（注意：不真正取消请求）
} = useRequest(service, options)
```

### run vs runAsync vs refresh

| 方法 | 返回 Promise | 错误处理 | 参数 | 典型用途 |
|---|---|---|---|---|
| `run(...args)` | 否 | **自动进 `onError`，不抛出** | 自定义 | `onClick={() => run(id)}` |
| `runAsync(...args)` | **是** | **需 `try/catch`**，否则未处理 rejection | 自定义 | 拿结果做后续逻辑 |
| `refresh()` | 否 | 自动捕获 | **复用上次参数** | 刷新按钮 |
| `refreshAsync()` | 是 | 需 catch | 复用上次参数 | 刷新后等结果 |

```ts
run(1)                       // 失败也不抛，错误进 onError
try {
  const data = await runAsync(1)   // 返回 Promise，需自己 catch
} catch (e) { /* 处理异常 */ }
```

> ⚠️ **`cancel` 的真实语义**：它**只让 useRequest 忽略当前 promise 的 data/error**，**并不会真正取消底层请求**（`fetch` 仍会发出并继续）。要真正中止，需自己在 service 里接 `AbortController`。

### 自动 vs 手动（manual / defaultParams）

```ts
// 默认 manual: false —— 挂载即自动执行，defaultParams 作为首次参数
const { data } = useRequest(getUser, { defaultParams: [1] })

// manual: true —— 不自动执行，必须 run / runAsync
const { run } = useRequest(submitForm, { manual: true })
```

> `defaultParams` **仅在 `manual:false` 的首次自动执行时生效**；`manual:true` 时首次参数应直接 `run(...)` 传入。

### ready / refreshDeps / loadingDelay

```ts
// ready：false 不发请求，变 true 自动触发（默认 true）
useRequest(() => getUser(id), { ready: !!id })

// refreshDeps：依赖变化自动用上次参数重新请求（类似 watch）
useRequest(() => getList(page), { refreshDeps: [page] })
// refreshDepsAction：自定义依赖变化时的动作（覆盖默认 refresh）

// loadingDelay：请求 < 300ms 不显示 loading，防闪烁
useRequest(getUser, { loadingDelay: 300 })
```

### 轮询（polling）

```ts
useRequest(getStatus, {
  pollingInterval: 3000,        // 每次请求完成后等 3s 再发下一次
  pollingWhenHidden: false,     // 页面隐藏时暂停（默认 true=隐藏也轮询）
  pollingErrorRetryCount: 3,    // 轮询出错重试次数（默认 -1 无限）
})
```

> ⚠️ 轮询**不是固定间隔**触发，而是「**上一次请求完成后**再等 `pollingInterval`」——慢请求会拉长实际周期。

### 防抖 / 节流

```ts
// 防抖：连续触发停止 500ms 后才请求
useRequest(search, { debounceWait: 500 /* debounceLeading / debounceTrailing / debounceMaxWait */ })
// 节流：固定间隔最多请求一次
useRequest(search, { throttleWait: 500 /* throttleLeading(默 true) / throttleTrailing */ })
```

### 屏幕聚焦刷新

```ts
useRequest(getUser, {
  refreshOnWindowFocus: true,  // 标签页重新聚焦时自动刷新
  focusTimespan: 5000,         // 5s 内重复聚焦不重复请求（默认 5000）
})
```

### 缓存与 SWR（cacheKey / staleTime / cacheTime）

```ts
useRequest(getUser, {
  cacheKey: 'user-info',  // 相同 key 共享数据；再次进入先返回缓存、后台静默重新请求
  staleTime: 5000,        // 5s 内认为新鲜、不重新请求（默认 0）
  cacheTime: 600000,      // 缓存保留时长（默认 300000 = 5 分钟）
})
// 清缓存：独立导出函数
import { clearCache } from 'ahooks'
clearCache('user-info')   // 不传则清全部
```

> ⚠️ 设置 `cacheTime` / `staleTime` 会让同 `cacheKey` 的「**数据实时共享**」机制失效（仅发起新请求才触发共享）；自定义 `setCache`/`getCache` 模式下 `cacheTime` 与 `clearCache` 都不生效，需自行实现过期与清除。

### 错误重试 / 乐观更新 / 生命周期

```ts
useRequest(getUser, {
  retryCount: 3, retryInterval: 1000,   // 失败重试
  onBefore: (params) => {},
  onSuccess: (data, params) => {},
  onError: (e, params) => {},
  onFinally: (params, data, e) => {},
})

// mutate：乐观更新（同步本地改 data，不重新请求）；失败回滚需自存旧值
const { data, mutate } = useRequest(getArticle)
mutate((prev) => ({ ...prev!, likes: prev!.likes + 1 }))
```

## Scene 场景类（建立在 useRequest 之上的开箱即用方案）

| Hook | 作用 |
|---|---|
| `usePagination` | 分页：service 收 `{ current, pageSize }` 返 `{ total, list }`，返回 `pagination` 对象（含 `onChange` / `changeCurrent` / `changePageSize`） |
| `useAntdTable` | Ant Design 表格 + 表单联动（继承 usePagination） |
| `useFusionTable` | Fusion Design 表格（继承 useAntdTable） |
| `useInfiniteScroll` | 无限滚动：service 收 `currentData` 返 `{ list }`，自动拼接；配 `target` 触底加载、`isNoMore` 判末页 |
| `useVirtualList` | 虚拟列表：只渲染可视区，`list` 须为完整已加载数组 |
| `useDynamicList` | 可增删改的动态列表（`insert` / `remove` / `replace` / `getKey`） |
| `useCountDown` | 倒计时（`targetDate` / `leftTime`，`onEnd` 回调） |
| `useWebSocket` | WebSocket 封装（`latestMessage` / `sendMessage` / `readyState` + 自动重连） |
| `useNetwork` / `useSelections` / `useHistoryTravel` / `useTextSelection` / `useTheme` | 网络状态 / 多选 / 撤销重做 / 选区 / 主题 |

```tsx
// 分页
const { data, pagination } = usePagination(
  ({ current, pageSize }) => fetchList({ current, pageSize }),
  { defaultPageSize: 20 },
)
// data.list 是当前页数据；pagination.total / current / onChange 直接喂给 <Pagination />

// 无限滚动（必须配 isNoMore，否则会无限触发加载）
const { data, loadingMore, noMore, loadMore } = useInfiniteScroll(
  (d) => getList(d?.nextId),
  { target: ref, isNoMore: (d) => d?.nextId === undefined },
)
```

> ⚠️ `useVirtualList` 只做可视区渲染、**不负责数据加载**，`list` 必须是完整数组；容器须有固定高度 + `overflow` 滚动；返回项是 `{ data, index }`，渲染用 `item.index` 当 key、读 `item.data`。

## State 类

| Hook | 返回 / 特点 |
|---|---|
| `useSetState` | `[state, setState]`——对象**浅合并**（不是替换），用法似 class `setState` |
| `useBoolean` | `[bool, { setTrue, setFalse, set, toggle }]` |
| `useToggle` | `[state, { toggle, set, setLeft, setRight }]`——两值切换 |
| `useGetState` | `[state, setState, getState]`——`getState()` 在异步回调里拿**最新**值（绕过闭包） |
| `useResetState` | `[state, setState, resetState]`——一键重置到初始值 |
| `useLocalStorageState` / `useSessionStorageState` | `[state, setState]`——默认 JSON 序列化，跨/同标签同步，`setState(undefined)` 删除键 |
| `useCookieState` | 值仅 `string \| undefined`，基于 js-cookie，不跨标签同步 |
| `useDebounce` / `useThrottle` | 防抖/节流后的**值** |
| `useMap` / `useSet` / `usePrevious` / `useRafState` | 响应式 Map/Set / 上一个值 / requestAnimationFrame 节流的 state |

> `useUrlState`（把状态同步到 URL query）在**独立包** `@ahooksjs/use-url-state`，不在主包。

## Effect 类

| Hook | 说明 |
|---|---|
| `useUpdateEffect` | 与 `useEffect` 一致，但**跳过首次渲染**（仅依赖更新时执行） |
| `useDebounceFn` / `useThrottleFn` | 返回 `{ run, cancel, flush }` 的防抖/节流函数（默认 `wait: 1000`） |
| `useDebounceEffect` / `useThrottleEffect` | 防抖/节流版的 effect |
| `useDeepCompareEffect` | 依赖**深比较**的 effect |
| `useInterval` / `useTimeout` | 自动清理的定时器（`useRafInterval` / `useRafTimeout` 用 rAF） |
| `useLockFn` | 给异步函数加锁，执行中再次调用被忽略——防重复提交 |
| `useAsyncEffect` | 支持异步函数的 effect |
| `useUpdate` | 返回强制重渲染的函数 |

```tsx
import { useLockFn } from 'ahooks'
// 提交中再点击被忽略，直到完成
const submit = useLockFn(async () => { await postForm() })
```

## Dom 类

| Hook | 说明 |
|---|---|
| `useEventListener` | 自动清理的事件监听（`target` / `capture` / `once` / `passive` / `enable`） |
| `useClickAway` | 点击元素外部触发（常用于关闭弹层） |
| `useFullscreen` | `[isFullscreen, { enterFullscreen, exitFullscreen, toggleFullscreen }]` |
| `useInViewport` | 元素是否进入视口（IntersectionObserver） |
| `useKeyPress` | 键盘按键/组合键监听 |
| `useResponsive` | 响应式断点信息 |
| `useHover` / `useMouse` / `useScroll` / `useSize` | 悬停 / 鼠标 / 滚动 / 尺寸 |
| `useTitle` / `useFavicon` | 动态文档标题 / 网站图标 |
| `useExternal` | 动态注入外部 JS/CSS 并跟踪加载状态 |

## Advanced 类（明星 hook 集中地）

| Hook | 说明 |
|---|---|
| **`useMemoizedFn`** | **引用恒定、却总调最新闭包**的函数——`useCallback` 的更优替代，根治闭包陷阱，可放心进依赖数组 |
| **`useCreation`** | 比 `useMemo` 更可靠的「仅依赖变化才重算」——`useMemo` 不保证一定不重算，`useCreation` 保证；适合创建昂贵实例 |
| **`useReactive`** | 返回**可变响应式代理**对象，直接 `state.count++` 即触发更新（Vue `reactive` 式心智） |
| **`useLatest`** | 返回始终指向**最新值**的 ref——在闭包/定时器里拿最新 state |
| `useControllableValue` | 同时支持**受控/非受控**的组件内部状态（封装组件常用） |
| `useEventEmitter` | 组件间事件订阅/发布 |
| `useLatest` / `useIsomorphicLayoutEffect` | 最新值 ref / SSR 安全的 layoutEffect |

```tsx
import { useMemoizedFn, useReactive } from 'ahooks'

// useMemoizedFn：引用不变、闭包最新
const onSave = useMemoizedFn(() => save(form))

// useReactive：可变式响应状态
const state = useReactive({ count: 0, list: [] as number[] })
state.count++          // 直接改即触发更新
state.list.push(1)
```

## Dev 类（开发调试）

| Hook | 说明 |
|---|---|
| `useWhyDidYouUpdate` | 打印**哪些 props 变化**导致组件更新——排查无谓重渲染 |
| `useTrackedEffect` | 追踪**是哪个依赖**触发了 effect 重新执行 |

## LifeCycle 类

`useMount(fn)`（挂载时）/ `useUnmount(fn)`（卸载时）/ `useUnmountedRef()`（拿到「是否已卸载」的 ref，避免卸载后 setState 警告）。

## 常见坑

- **`manual: true` 的连锁失效**（最易踩）：会**同时**让 `refreshDeps` / `refreshDepsAction` 失效、轮询不自动启动、`ready=false` 时 `run` 也不执行——手动模式下这些都得自己 `run` 触发
- **`cancel` 不真正取消请求**：只让 useRequest 忽略响应，底层 `fetch` 仍发出；真正中止要自接 `AbortController`
- **轮询非固定间隔**：`pollingInterval` 是「上次完成后再等」，慢请求拉长周期
- **缓存共享与 `cacheTime`/`staleTime` 冲突**：设了二者会让同 `cacheKey` 的实时数据共享失效；`setCache`/`getCache` 自定义模式下 `cacheTime`/`clearCache` 不生效
- **`run` 吞错误**：错误进 `onError` 不抛出；要拿异常用 `runAsync` + `try/catch`
- **`useToggle` / `useBoolean` 的 actions 忽略后续 value 变化**：actions 用空依赖缓存，`defaultValue` 后续变化不更新闭包
- **`useLocalStorageState` 默认 JSON 序列化**：存纯字符串会被加引号；要原样存需自定义 `serializer` / `deserializer`；SSR 用 `getInitialValueInEffect: true`
- **`useVirtualList` 不加载数据**：`list` 必须完整、容器须固定高度 + 滚动
- **React 专用 + Hook 规则**：只能在组件/自定义 Hook 顶层调用，不能在条件/循环里
