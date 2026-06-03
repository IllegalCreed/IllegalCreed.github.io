---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **react-use**（npm 包 `react-use`，streamich 出品的社区 React Hooks 库；**React 专用**，TypeScript 编写）。

## 速查

- 系统要求：**React 16.8+**（Hooks），TypeScript 完备
- 包定位：**广覆盖的 React Hooks 工具集合（100+ hook）**，对标 Vue 的 VueUse —— **不是** ahooks（无重型 useRequest）
- 安装：`npm i react-use` / `pnpm add react-use`
- 导入：`import { useToggle, useLocalStorage } from 'react-use'`
- 异步三件套：`useAsync`（自动，返回 `{ loading, error, value }`）/ `useAsyncFn`（手动，返回 `[state, callback]`）/ `useAsyncRetry`（+`retry`）
- 六大类：Sensors / UI / Animations / Side-effects / State / Lifecycles
- 元组约定不统一：`useToggle` 返回 `[on, toggle]`、`useCounter` 返回 `[current, actions]`，但 `useQueue` / `useStateList` 返回**对象**
- 明星 hook：`useToggle` / `useLocalStorage` / `useDebounce` / `useCounter` / `useList` / `useSetState` / `useInterval` / `useClickAway` / `createGlobalState`
- 文档：[README 全量分类](https://github.com/streamich/react-use#readme) + [Storybook](https://streamich.github.io/react-use/)

## react-use 是什么

react-use 是由 **streamich** 发起的 **社区 React Hooks 库**，一句话定位：「**一套庞大的、覆盖浏览器交互与通用模式的 React Hooks 工具集合**」（100+ hook）。

```tsx
import { useToggle, useLocalStorage } from 'react-use'

const [on, toggle] = useToggle(false)          // 布尔切换
const [name, setName] = useLocalStorage('name', '') // 响应式本地存储
```

理解 react-use 必须先抓住它的**定位坐标**：

- **对标 VueUse，而非 ahooks**：在「组合式函数库」象限里，react-use ≈ **React 版的 VueUse**（广覆盖的浏览器 API + 通用工具 hook），而 ahooks ≈ React 版的「企业级 useRequest 体系」（对应 Vue 的 VueHooks Plus）
- **没有重型 `useRequest`**：react-use 的异步只有 `useAsync` / `useAsyncFn` / `useAsyncRetry`，**无轮询、无缓存、无 SWR、无 refreshDeps**
- **React 专用**：Vue 项目用 VueUse
- **TypeScript + Tree-shakeable**：类型完备、按需打包

### 与 VueUse / ahooks / SWR 的区别

| 维度 | react-use | VueUse | ahooks | SWR / TanStack Query |
|---|---|---|---|---|
| 框架 | **React** | Vue 3 | React | 多框架 |
| 定位 | **广覆盖工具 hook 集合** | 广覆盖工具集合 | 企业级 · useRequest 为核心 | **专业服务端状态** |
| 对位关系 | **≈ React 版 VueUse** | ≈ Vue 版 react-use | ≈ React 版 VueHooks Plus | 跨框架数据层 |
| 异步能力 | useAsync/useAsyncFn（轻量） | useFetch（轻量） | useRequest（轮询/缓存/重试） | 缓存失效 + Devtools |
| 适合 | React 项目要海量通用 hook | Vue 项目 | React 中后台/重请求管理 | 大型数据密集应用 |

**含义**：要「海量现成的浏览器/状态/副作用工具 hook」选 react-use；要「带轮询/缓存/SWR 的企业级请求管理」选 ahooks；要「专业服务端状态」选 SWR / TanStack Query。

## 安装

```bash
npm i react-use
# 或：pnpm add react-use / yarn add react-use
```

按需导入即可（Tree-shaking）：

```tsx
import { useToggle, useCounter, useAsync } from 'react-use'
```

> 个别 hook 需子路径导入（如 `useSpring` 因可选 `rebound` 依赖：`import useSpring from 'react-use/lib/useSpring'`）。

## 异步三件套（与 ahooks useRequest 的本质区别）

react-use 没有 ahooks 那种重型 `useRequest`，异步用这三个：

```tsx
import { useAsync, useAsyncFn, useAsyncRetry } from 'react-use'

// 1. useAsync —— 挂载即自动执行、deps 变化重跑（语义同 useEffect），返回对象
const state = useAsync(async () => {
  const res = await fetch(`/api/user/${id}`)
  return res.json()
}, [id]) // ⚠️ fn 内用到的外部变量须进 deps
// state: { loading, error, value }

// 2. useAsyncFn —— 手动调 callback 才发起，返回 [state, callback]
const [submitState, submit] = useAsyncFn(async (data) => {
  return fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) })
}, [])
// <button onClick={() => submit(form)}>提交</button>

// 3. useAsyncRetry —— 多一个 retry()
const { loading, error, value, retry } = useAsyncRetry(fetchData, [])
```

> ⚠️ **别把它们当 ahooks useRequest 或 SWR 用**——它们只暴露 `loading` / `error` / `value`，**没有缓存、去重、轮询**。注意 `useAsync` 返回**对象**、`useAsyncFn` 返回**数组**，别搞混。

## 基本用法

### 约定一：返回形态不统一，用前看清

react-use 的返回形态**不像 ahooks 那样统一**——这是最需要留意的点：

```tsx
import { useToggle, useCounter, useQueue } from 'react-use'

const [on, toggle] = useToggle(false)                 // 元组 [值, 切换函数]
const [count, { inc, dec, reset }] = useCounter(0)    // 元组 [值, actions 对象]
const { add, remove, first, size } = useQueue()       // 对象（不是元组！）
```

### 约定二：toggle 不能直接当 onClick 传（经典坑）

```tsx
const [on, toggle] = useToggle(false)

// ❌ 错误：onClick 把 event 当参数传给 toggle，event 被当真值，on 变成对象
<button onClick={toggle}>切换</button>

// ✅ 正确：包一层
<button onClick={() => toggle()}>切换</button>
```

### 约定三：声明式定时器，delay=null 暂停

```tsx
import { useInterval } from 'react-use'

const [running, setRunning] = useState(true)
// delay 传 null 即暂停（Dan Abramov 的经典模式）；callback 始终引用最新闭包
useInterval(() => setCount((c) => c + 1), running ? 1000 : null)
```

## 第一个 react-use 应用

综合演示 `useToggle` + `useLocalStorage` + `useAsync`：

```tsx
import { useToggle, useLocalStorage, useAsync } from 'react-use'

function App() {
  // 1. useToggle —— [布尔值, 切换函数]
  const [open, toggle] = useToggle(false)

  // 2. useLocalStorage —— [value, setValue, remove]，自动读写 localStorage
  const [name, setName] = useLocalStorage('demo-name', '')

  // 3. useAsync —— 挂载即自动执行，返回 { loading, error, value }
  const userState = useAsync(async () => {
    const res = await fetch('/api/user')
    return res.json() as Promise<{ nick: string }>
  }, [])

  return (
    <div>
      <section>
        <h2>1. 折叠（useToggle）</h2>
        <button onClick={() => toggle()}>{open ? '收起' : '展开'}</button>
        {open && <p>折叠内容</p>}
      </section>

      <section>
        <h2>2. 草稿（useLocalStorage）</h2>
        <input value={name ?? ''} onChange={(e) => setName(e.target.value)} placeholder="刷新仍在" />
      </section>

      <section>
        <h2>3. 用户（useAsync）</h2>
        {userState.loading ? <p>加载中…</p>
          : userState.error ? <p>出错：{userState.error.message}</p>
          : <p>你好，{userState.value?.nick}</p>}
      </section>
    </div>
  )
}
```

**这个示例覆盖**：

- `useToggle(false)`：返回 `[on, toggle]`——注意 `onClick={() => toggle()}` 包一层
- `useLocalStorage('key', init)`：返回 `[value, setValue, remove]`，默认 JSON 序列化，值变化自动写 localStorage
- `useAsync(fn, deps)`：挂载即自动执行，返回 `{ loading, error, value }`——**对象**形态

## SSR 友好性

react-use 中访问 `window` / `localStorage` / `navigator` 的 hook（如 `useLocalStorage` / `useWindowSize` / `useMedia`）在**服务端渲染时没有这些全局对象**——需自行做客户端判断或惰性渲染，否则可能报错或产生 hydration 不一致。SSR 安全的 layout effect 用 `useIsomorphicLayoutEffect`。

## TypeScript

react-use 用 TypeScript 编写，类型完备。注意按各 hook 的真实返回类型解构：

```tsx
import { useCounter, useList } from 'react-use'

// current: number；actions: { inc, dec, get, set, reset }
const [current, { inc, dec }] = useCounter(0, 10, 1) // initial, max, min

// list: T[]；actions 含 push/updateAt/removeAt/filter 等
const [list, { push, removeAt }] = useList<number>([1, 2, 3])
```

## 下一步

- [指南](./guide-line.md)：**State 类**（`useToggle` / `useCounter` / `useList` / `useMap` / `useSet` / `useSetState` / `useStateWithHistory`） / **Side-effects 类**（异步三件套深度 / `useLocalStorage` / `useDebounce` 依赖驱动 / `useCopyToClipboard`） / **Sensors 类**（`useMouse` / `useScroll` / `useWindowSize` / `useMeasure` / `useNetworkState`） / **UI & Animations 类**（`useFullscreen` / `useClickAway` / `useInterval` / `useSpring`） / **Lifecycles 类**（`useMount` / `useUpdateEffect` / `useMountedState`） / **`createGlobalState`** / **常见坑**
