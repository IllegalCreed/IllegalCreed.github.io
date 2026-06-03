---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇按类目深入 usehooks-ts 的 33 个 hook，并强调「对象 vs 元组」返回形态与 v3 变更。React 专用，基于 v3.1.1。

## 状态类

| Hook | 返回形态 | 说明 |
|---|---|---|
| `useBoolean(default?)` | **对象** `{ value, setValue, setTrue, setFalse, toggle }` | 布尔状态；helper 方法 memo 化 |
| `useToggle(default?)` | **元组** `[value, toggle, setValue]` | ⚠️ `toggle` 在 `setValue` **前** |
| `useCounter(initial?)` | **对象** `{ count, increment, decrement, reset, setCount }` | 计数器；无 min/max（与 ahooks/react-use 不同） |
| `useStep(maxStep)` | **元组** `[step, helpers]` | `helpers.canGoToNextStep` 是**布尔值**不是函数 |
| `useMap(initial?)` | **元组** `[map, actions]` | `map` 是真实 Map 但 set/clear/delete 被隐藏 |

```tsx
import { useBoolean, useToggle } from 'usehooks-ts'

const { value, setTrue, setFalse, toggle } = useBoolean(false) // 对象
const [on, toggleOn, setOn] = useToggle(false)                 // 元组，注意顺序
```

> ⚠️ **`useMap` 必须通过 actions 改**：`map` 上的 `set` / `clear` / `delete` 被 `Omit` 隐藏，要用 `actions.set(k, v)` / `actions.remove(k)` / `actions.reset()` / `actions.setAll(entries)`；读取仍用 `map.get()` / `map.has()`。

## 存储与剪贴板（全部返回元组）

| Hook | 返回 | 说明 |
|---|---|---|
| `useLocalStorage(key, init, opts?)` | `[value, setValue, removeValue]` | `removeValue`（第 3 元素）v3.1.0 新增；跨标签同步；`initializeWithValue` 控 SSR |
| `useSessionStorage(key, init, opts?)` | `[value, setValue, removeValue]` | 同上，用 sessionStorage（不跨标签） |
| `useReadLocalStorage(key, opts?)` | **裸值** `T \| null` | 只读伴侣，key 不存在返回 `null` |
| `useCopyToClipboard()` | `[copiedText, copy]` | `copy(text)` 异步返回 `Promise<boolean>`；需安全上下文(HTTPS) |

```tsx
import { useLocalStorage } from 'usehooks-ts'

const [user, setUser, removeUser] = useLocalStorage('user', { name: '' }, {
  initializeWithValue: false, // SSR 安全
})
setUser((prev) => ({ ...prev, name: 'Tom' })) // 支持 updater
removeUser()                                   // 删除 key + 重置为 initialValue
```

> `useLocalStorage` 通过派发自定义 `local-storage` 事件实现**同页多组件 + 跨标签**同步；默认 JSON 序列化，可传 `serializer` / `deserializer`。

## 主题与媒体

| Hook | 返回 | 说明 |
|---|---|---|
| `useDarkMode(opts?)` | **对象** `{ isDarkMode, toggle, enable, disable, set }` | 读 `prefers-color-scheme` + 持久化（默认键 `usehooks-ts-dark-mode`） |
| `useTernaryDarkMode(opts?)` | **对象** | 三态：`'light'` / `'dark'` / `'system'` |
| `useMediaQuery(query, opts?)` | **裸布尔** | 媒体查询匹配；`defaultValue` / `initializeWithValue` 选项 |

```tsx
import { useMediaQuery, useDarkMode } from 'usehooks-ts'

const isMobile = useMediaQuery('(max-width: 768px)')
const { isDarkMode, toggle } = useDarkMode()
```

## DOM 与布局

| Hook | 说明 |
|---|---|
| `useEventListener(name, handler, ref?, options?)` | 自动清理的事件监听（4 个重载：window/document/element/media） |
| `useOnClickOutside(ref, handler, eventType?)` | 点击 ref 外部触发（ref 可为单个或数组） |
| `useClickAnyWhere(handler)` | 点击页面任意处触发 |
| `useHover(ref)` | **裸布尔**——元素是否悬停 |
| `useScrollLock(opts?)` | 锁定滚动（模态框常用），返回 `{ isLocked, lock, unlock }` |
| `useIntersectionObserver(opts?)` | **混合**返回（可按对象 `{ ref, isIntersecting, entry }` 或元组解构） |
| `useResizeObserver({ ref, onResize?, box? })` | ⚠️ `ref` 在 **options 对象内**（替代被移除的 `useElementSize`） |
| `useWindowSize(opts?)` / `useScreen(opts?)` | 窗口尺寸 `{ width, height }` / 屏幕信息 |
| `useDocumentTitle(title, opts?)` | 设标题，`preserveTitleOnUnmount` 默认 `true` |

```tsx
import { useRef } from 'react'
import { useResizeObserver, useOnClickOutside } from 'usehooks-ts'

const ref = useRef<HTMLDivElement>(null)
const { width = 0, height = 0 } = useResizeObserver({ ref }) // ref 在 options 内
useOnClickOutside(ref, () => close())
```

> ⚠️ `useElementSize` 在 v3 **被移除**——用 `useResizeObserver({ ref })` 替代，且 `ref` 必须放在 options 对象里（不是位置参数）。

## 定时与防抖

| Hook | 返回 / 说明 |
|---|---|
| `useInterval(cb, delay)` | 声明式 interval，`delay=null` 暂停 |
| `useTimeout(cb, delay)` | 声明式 timeout，`delay=null` 取消 |
| `useCountdown(options)` | **元组** `[count, { startCountdown, stopCountdown, resetCountdown }]`，接收单个 options 对象（`countStart` / `intervalMs` / `isIncrement` / `countStop`） |
| `useDebounceValue(initial, delay, opts?)` | **元组** `[debouncedValue, setValue]`——防抖一个值 |
| `useDebounceCallback(fn, delay?, opts?)` | 防抖后的函数，带 `.cancel()` / `.flush()` / `.isPending()`；`delay` 默认 500 |
| `useEventCallback(fn)` | 返回引用稳定、却总调最新闭包的回调（类似 ahooks `useMemoizedFn`） |

```tsx
import { useDebounceValue, useDebounceCallback } from 'usehooks-ts'

// 防抖值
const [debouncedQuery, setQuery] = useDebounceValue('', 500)

// 防抖函数（替代旧 useDebounce 的回调形态）
const debouncedSearch = useDebounceCallback((q: string) => search(q), 500)
debouncedSearch.cancel() // 可取消
```

> ⚠️ v3 把旧 `useDebounce` **拆成** `useDebounceValue`（值）+ `useDebounceCallback`（函数）——按旧 `useDebounce` 写的代码需迁移。

## 生命周期与工具

| Hook | 说明 |
|---|---|
| `useIsClient()` | **裸布尔**——是否在客户端（SSR 判断） |
| `useIsMounted()` | 返回**函数** `isMounted()`——异步回调里判断是否仍挂载 |
| `useUnmount(fn)` | 卸载时执行 |
| `useIsomorphicLayoutEffect` | SSR 安全的 `useLayoutEffect` |
| `useScript(src, opts?)` | 动态加载外部脚本，返回状态 `'loading' \| 'ready' \| 'error' \| ...` |

> ⚠️ `useUpdateEffect` 与 `useIsFirstRender` 在 v3 **已被移除**——不要再从 `usehooks-ts` 导入它们（会报错）。

## 常见坑

- **返回形态「对象 vs 元组」不统一**（头号坑）：`useBoolean`/`useCounter`/`useDarkMode`/`useTernaryDarkMode` 返回**对象**；`useToggle`/`useLocalStorage`/`useStep`/`useMap`/`useCopyToClipboard`/`useCountdown`/`useDebounceValue` 返回**元组**；`useReadLocalStorage`/`useHover`/`useMediaQuery`/`useIsClient` 返回**裸值**
- **`useToggle` 顺序**：`[value, toggle, setValue]`——`toggle` 在 `setValue` **前**，别假设成 `[value, setValue, toggle]`
- **`useMap` 必须用 actions**：`map.set()` 被 `Omit` 隐藏，要 `actions.set(k, v)`
- **`useLocalStorage` 第 3 元素是 `removeValue`**（v3.1.0 新增）：旧代码只解构两个
- **`useResizeObserver` 的 `ref` 在 options 内**：`useResizeObserver({ ref })`
- **v3 移除清单**：`useFetch` / `useSsr` / `useImageOnLoad` / `useElementSize` / `useUpdateEffect` / `useIsFirstRender` 都没了
- **`useDebounce` 已拆分**：用 `useDebounceValue` / `useDebounceCallback`
- **没有数据请求 hook**：请求用 SWR / TanStack Query（或 ahooks）
- **纯 ESM 包**：老 CommonJS / Jest 配置可能需额外处理
- **`useMountedState`... 不存在**：判断挂载用 `useIsMounted()`（返回函数，要调用）
- **React 专用 + Hook 规则**：只能在组件/自定义 Hook 顶层调用
