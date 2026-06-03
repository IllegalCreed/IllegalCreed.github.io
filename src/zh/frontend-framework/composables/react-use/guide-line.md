---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇按 react-use 的六大类（State / Side-effects / Sensors / UI / Animations / Lifecycles）深入常用 hook，并汇总常见坑。React 专用。

## State 类（状态管理）

| Hook | 返回 / 说明 |
|---|---|
| `useToggle` / `useBoolean` | `[on, toggle]`——`toggle()` 反转、`toggle(true/false)` 设值（`useBoolean` 是 `useToggle` 别名） |
| `useCounter` / `useNumber` | `[current, { inc, dec, get, set, reset }]`，可传 `(initial, max, min)` 钳制边界 |
| `useList` | `[list, { set, push, updateAt, insertAt, update, upsert, sort, filter, removeAt, clear, reset }]` |
| `useMap` | `[map, { set, setAll, remove, reset }]`——**跟踪普通对象，不是 ES Map**（无 has/size） |
| `useSet` | `[set, { add, has, remove, toggle, reset, clear }]`——真正的 Set；`reset()` 回初始、`clear()` 清空 |
| `useQueue` | `{ add, remove, first, last, size }`——**对象，非元组** |
| `useSetState` | `[state, setState]`——仿 class `setState` 的**浅合并**（非整体替换） |
| `useStateList` | `{ state, currentIndex, prev, next, setStateAt, isFirst, isLast }`——在一组值间循环 |
| `useStateWithHistory` | `[state, setState, history]`——带**撤销/重做**历史（可设 `capacity`） |
| `usePrevious` / `usePreviousDistinct` | 上一次渲染值 / 上一次**不同**的值 |

```tsx
import { useCounter, useList } from 'react-use'

const [n, { inc, dec, reset }] = useCounter(5, 10, 1)  // 钳制在 1~10
const [todos, { push, removeAt, filter }] = useList<string>([])
push('learn react-use')
```

> ⚠️ `useSetState` 只**浅合并一层**，嵌套对象会被整层覆盖；`useMap` 是普通对象（key 转字符串），要 Set 语义用 `useSet`。

## Side-effects 类（副作用）

### 异步三件套

```tsx
import { useAsync, useAsyncFn, useAsyncRetry } from 'react-use'

const state = useAsync(fn, [dep])              // 自动执行，返回 { loading, error, value }
const [state2, run] = useAsyncFn(fn, [])       // 手动 run() 才执行，返回 [state, callback]
const { loading, value, retry } = useAsyncRetry(fn, []) // 多一个 retry()
```

> react-use 的异步**极简**：只有 loading/error/value，**无轮询/缓存/SWR/refreshDeps/手动自动模式**。需要这些用 ahooks `useRequest` 或 SWR / TanStack Query。

### 存储 / 剪贴板 / 文档

| Hook | 说明 |
|---|---|
| `useLocalStorage` | `[value, setValue, remove]`——默认 JSON 序列化；`{ raw: true }` 原样存字符串；可自定义 `serializer` / `deserializer` |
| `useSessionStorage` | 同形态，用 sessionStorage |
| `useCookie` | `[value, updateCookie, deleteCookie]` |
| `useCopyToClipboard` | `[state, copyToClipboard]`，`state` 含 `value` / `error` / `noUserInteraction` |
| `useTitle` | 设 `document.title`，`{ restoreOnUnmount: true }` 卸载时还原 |
| `useFavicon` / `useBeforeUnload` / `useError` | 网站图标 / 离开页面拦截 / 错误派发 |

### 防抖 / 节流

```tsx
import { useDebounce, useThrottle } from 'react-use'

// useDebounce 是「依赖驱动」：deps 变化后等 ms 调 fn；返回 [isReady, cancel]
const [isReady, cancel] = useDebounce(() => search(q), 500, [q])

// useThrottle 节流「值」：每 ms 最多更新一次
const throttledScroll = useThrottle(scrollY, 200)
```

> `useDebounce` **不是手动调用**，而是 deps 变化触发——fn 内用到的外部变量须进 deps。

## Sensors 类（传感器）

| Hook | 返回 / 说明 |
|---|---|
| `useMouse(ref)` | `{ docX, docY, posX, posY, elX, elY, elW, elH }`——鼠标在文档/元素内坐标 |
| `useScroll(ref)` / `useWindowScroll()` | 元素 / 窗口滚动位置 `{ x, y }` |
| `useScrolling(ref)` | 元素是否正在滚动（boolean） |
| `useWindowSize()` | `{ width, height }`——窗口尺寸 |
| `useMeasure()` | `[ref, { width, height, top, left, ... }]`——ResizeObserver 测元素尺寸 |
| `useGeolocation()` | 地理位置 `{ latitude, longitude, ... }` |
| `useNetworkState()` | 网络状态 `{ online, rtt, type, downlink, ... }` |
| `useHover` / `useHoverDirty` | `[element, isHovering]`（前者接收渲染元素）/ 基于 ref 的悬停 |
| `useIdle` / `useBattery` / `useOrientation` / `useMotion` | 空闲检测 / 电量（API 已废弃） / 屏幕方向 / 设备运动 |
| `useStartTyping` / `usePageLeave` | 开始打字 / 鼠标离开页面 时触发回调 |

> ⚠️ `useMeasure` 旧浏览器需 `ResizeObserver` polyfill；初始渲染尺寸为 0，需等 observer 回调。

## UI & Animations 类

| Hook | 说明 |
|---|---|
| `useFullscreen(ref, show, opts?)` | 全屏控制，返回 `isFullscreen` |
| `useClickAway(ref, onClickAway, events?)` | 点击元素外部触发——**默认 events 是 `mousedown` + `touchstart`，不是 `click`** |
| `useAudio` / `useVideo` | `[element, state, controls, ref]`——声明式音视频控制 |
| `useSlider` / `useSpeech` / `useVibrate` / `useDrop` / `useDropArea` | 滑块 / 语音合成 / 振动 / 拖放 |
| `useInterval(cb, delay)` | 声明式 interval——`delay=null` 暂停，callback 始终最新闭包 |
| `useTimeoutFn(fn, ms)` / `useTimeout(ms)` | `[isReady, cancel, reset]` |
| `useRaf` / `useRafLoop` | requestAnimationFrame 驱动的进度 / 循环 |
| `useSpring` / `useTween` | 弹簧 / 缓动动画数值 |

```tsx
import { useClickAway } from 'react-use'
const ref = useRef(null)
useClickAway(ref, () => closePopover())  // 默认 mousedown + touchstart
```

> ⚠️ `useSpring` 因可选 `rebound` 依赖，需**直接导入** `import useSpring from 'react-use/lib/useSpring'`。

## Lifecycles 类（生命周期）

| Hook | 说明 |
|---|---|
| `useEffectOnce` | 只执行一次的 effect（支持 cleanup） |
| `useMount` / `useUnmount` | 挂载 / 卸载时执行（两者都要用 `useLifecycles`） |
| `useUpdateEffect` | 跳过首次挂载、只在后续 deps 更新时运行 |
| `useUpdate` | 返回强制重渲染的函数 |
| `useFirstMountState` | 返回「是否首次挂载」 |
| `useDeepCompareEffect` / `useShallowCompareEffect` / `useCustomCompareEffect` | 依赖深比较 / 浅比较 / 自定义比较的 effect |
| `useIsomorphicLayoutEffect` | SSR 安全的 `useLayoutEffect` |
| `usePermission` | 查询 Permissions API 状态 |
| `useMountedState` / `useUnmountPromise` | 返回**函数** `isMounted()` 判断是否已挂载 / 卸载后忽略 promise |

> ⚠️ `useMountedState` 返回的是**函数**——要 `if (isMounted())` 调用，不是 `if (isMounted)`；它不触发重渲染。

## createGlobalState：零依赖全局状态

无需 Context / Redux / Zustand 即可跨组件共享状态：

```tsx
import { createGlobalState } from 'react-use'

// 工厂生成一个共享态 hook
const useGlobalCount = createGlobalState<number>(0)

function A() {
  const [count, setCount] = useGlobalCount()
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>
}
function B() {
  const [count] = useGlobalCount() // 与 A 共享同一份；A 改了 B 自动重渲染
  return <span>{count}</span>
}
```

> 相关：`createReducer` / `createReducerContext` / `createStateContext` / `useMethods`。注意 `createGlobalState` 的 state **模块级存活**，组件全卸载后值仍保留；复杂场景仍建议 Redux / Zustand。

## 常见坑

- **没有 ahooks 式 `useRequest`**：异步只有 `useAsync` / `useAsyncFn` / `useAsyncRetry`，无缓存/轮询/SWR——需要这些用 ahooks 或 SWR / TanStack Query
- **`toggle` 不能直传 `onClick`**：`onClick={toggle}` 会把 event 当真值写入；要 `onClick={() => toggle()}`
- **返回形态不统一**：`useToggle`/`useCounter`/`useList`/`useMap`/`useSet` 返回 `[state, actions]` 元组，但 `useQueue`/`useStateList` 返回**对象**、`useAsync` 返回对象而 `useAsyncFn` 返回数组
- **`useMap` 不是 ES Map**：跟踪普通对象，无 `has`/`size`，key 转字符串；要 Set 语义用 `useSet`
- **`useSetState` 仅浅合并**：嵌套对象整层覆盖
- **`useMountedState` 返回函数**：`isMounted()` 要调用
- **`useDebounce` 依赖驱动**：deps 变化触发，非手动调；fn 内变量须进 deps
- **`useSpring` 直接 import**：`react-use/lib/useSpring`（可选 `rebound` 依赖）
- **`useMeasure` 需 ResizeObserver polyfill**（旧浏览器）；`useBattery` 基于已废弃 API
- **SSR**：访问 `window`/`localStorage`/`navigator` 的 hook 服务端会报错，需降级；layout effect 用 `useIsomorphicLayoutEffect`
- **React 专用 + Hook 规则**：只能在组件/自定义 Hook 顶层调用，不能在条件/循环里
