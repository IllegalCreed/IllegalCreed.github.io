---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **ahooks v3.x**（npm 包 `ahooks`，截至 2026 年约 **v3.9.x**；**React 专用**，支持 React 16.8 ~ 19，含 React 18）。

## 速查

- 系统要求：**React 16.8+**（Hooks），TypeScript 完备，SSR 友好
- 包定位：**阿里出品的企业级 React Hooks 库**，以插件化旗舰 `useRequest` 为核心，约 70+ hook，分八大类
- 安装：`npm i ahooks` / `pnpm add ahooks`
- 导入：`import { useRequest, useMemoizedFn } from 'ahooks'`（ESM 天然 Tree-shaking；旧 Babel 可配 `babel-plugin-import`）
- 旗舰用法：`const { data, loading, error, run } = useRequest(service)`
- 元组约定：State 类多返回 `[state, actions]`，如 `const [v, { toggle }] = useBoolean()`
- 明星 hook：`useMemoizedFn`（引用恒定的 `useCallback` 替代）、`useReactive`（Vue 式可变响应状态）、`useLatest`、`useControllableValue`
- 八大类：useRequest / Scene / LifeCycle / State / Effect / Dom / Advanced / Dev
- `useUrlState` 在独立包 `@ahooksjs/use-url-state`，非主包
- 文档：<https://ahooks.js.org/zh-CN/>

## ahooks 是什么

ahooks（读作 "a hooks"）是由 **阿里巴巴**（GitHub `alibaba/hooks`）出品的 **React Hooks 库**，一句话定位：「**一套高质量、可靠的、覆盖业务高频场景的 React Hooks 集合**」。它的灵魂是那个**插件化架构的旗舰 `useRequest`**：

```tsx
import { useRequest } from 'ahooks'

// 一行拿到一套完整的异步请求状态机
const { data, loading, error, run } = useRequest(getUserInfo)
```

理解 ahooks 必须先抓住几个**核心定位**：

- **React 专用**：仅服务 React（16.8 ~ 19）；Vue 项目用它的"孪生兄弟" **VueHooks Plus**（ahooks 的 Vue 移植）
- **以请求为核心**：`useRequest` 内建轮询 / 缓存(SWR) / 重试 / 防抖 / 节流 / 聚焦刷新；分页三件套（`usePagination` / `useAntdTable` / `useFusionTable`）与 `useInfiniteScroll` 都建立在它之上
- **`useMemoizedFn` 是日常标配**：引用恒定却总调最新闭包，根治 React 闭包陷阱（详见指南）
- **TS + SSR 友好 + Tree-shakeable**：类型完备、服务端渲染不崩、按需打包

### 与 VueHooks Plus / react-use / SWR / TanStack Query 的区别

| 维度 | ahooks | VueHooks Plus | react-use | SWR / TanStack Query |
|---|---|---|---|---|
| 框架 | **React** | Vue 3 | React | 多框架（含 React/Vue 适配） |
| 出品 | **阿里巴巴** | InhiblabCore | 社区 | Vercel / Tanner Linsley |
| 核心定位 | **企业级 · 以 `useRequest` 为核心** | ahooks 的 Vue 版 | 社区 Hook 大杂烩 | **专业服务端状态管理** |
| 杀手锏 | useRequest + 分页/表格场景 + useMemoizedFn | useRequest（同构） | 数量多、覆盖广 | 缓存失效策略 + Devtools |
| 适合 | React 中后台 / 想一库覆盖请求+工具 | Vue 项目 | React 通用工具 | 大型数据密集应用 |

**含义**：ahooks 与 **VueHooks Plus 几乎是同一套设计的 React/Vue 两个版本**；相比 react-use 它更"企业级、成体系"；相比 SWR / TanStack Query，ahooks 胜在「轻量 + 一库覆盖请求/分页/表格/工具」，而专业的服务端状态管理（精细缓存失效 + Devtools）仍是 TanStack Query 更强。

## 安装

```bash
npm i ahooks
# 或：pnpm add ahooks / yarn add ahooks
```

直接按需导入即可（ESM 天然 Tree-shaking，没用到的 hook 不打包）：

```tsx
import { useRequest, useMemoizedFn, useBoolean } from 'ahooks'
```

> **旧版 Babel 项目**可加 `babel-plugin-import` 进一步精确按需（现代打包器通常无需）。`useUrlState` 不在主包，需单独 `npm i @ahooksjs/use-url-state`。

## 基本用法

### 约定一：useRequest 三件套（data / loading / error）

`useRequest` 接收一个**返回 Promise 的 service 函数**，默认**自动执行**，返回响应式的请求状态：

```tsx
import { useRequest } from 'ahooks'

function getUserInfo(): Promise<{ name: string }> {
  return fetch('/api/user').then((res) => res.json())
}

function Demo() {
  // 默认自动执行；data / loading / error 都是状态
  const { data, loading, error, run } = useRequest(getUserInfo)

  if (loading) return <p>加载中…</p>
  if (error) return <p>出错了：{error.message}</p>
  return (
    <div>
      <p>你好，{data?.name}</p>
      <button onClick={() => run()}>手动刷新</button>
    </div>
  )
}
```

> **手动触发**：传 `{ manual: true }` 后不自动执行，需调用 `run()` / `runAsync()`。

### 约定二：State 类 hook 返回 [state, actions] 元组

这是 ahooks 的标志性约定（VueHooks Plus 也继承了它）——状态类 hook 返回二元组：

```tsx
import { useBoolean, useToggle, useSetState } from 'ahooks'

// useBoolean：[布尔值, { setTrue, setFalse, set, toggle }]
const [open, { toggle, setTrue, setFalse }] = useBoolean(false)

// useToggle：在两个值间切换 [state, { toggle, set, setLeft, setRight }]
const [lang, { toggle: toggleLang }] = useToggle('zh', 'en')

// useSetState：对象浅合并（不是替换），用法接近 class 的 setState
const [state, setState] = useSetState({ name: 'Tom', age: 1 })
setState({ age: 2 }) // name 保留，仅更新 age
```

### 约定三：useMemoizedFn 根治闭包陷阱

`useMemoizedFn` 返回一个**引用永远不变、却总是调用最新闭包**的函数——可放心传给子组件 / 进依赖数组而不触发额外重渲染。它是 `useCallback` 的更优替代，几乎是 ahooks 项目的标配：

```tsx
import { useMemoizedFn } from 'ahooks'
import { useState } from 'react'

function Demo() {
  const [count, setCount] = useState(0)

  // 引用恒定（无需依赖数组），但内部 count 永远是最新值
  const onClick = useMemoizedFn(() => {
    console.log('当前 count =', count)
  })

  // 传给深层子组件也不会因引用变化引发重渲染
  return <Child onClick={onClick} />
}
```

## 第一个 ahooks 应用

下面用一个组件综合演示三个 hook——`useRequest`（请求）、`useBoolean`（布尔开关）、`useLocalStorageState`（持久化状态）：

```tsx
import { useRequest, useBoolean, useLocalStorageState } from 'ahooks'

function App() {
  // 1. useRequest —— data / loading / error 三件套，默认自动执行
  const { data, loading, error, run } = useRequest<{ name: string }>(
    () => fetch('/api/user').then((r) => r.json()),
  )

  // 2. useBoolean —— [布尔值, { toggle }]
  const [open, { toggle }] = useBoolean(false)

  // 3. useLocalStorageState —— [state, setState]，自动读写 localStorage
  const [draft, setDraft] = useLocalStorageState<string>('demo-draft', {
    defaultValue: '',
  })

  return (
    <div>
      <section>
        <h2>1. 用户信息（useRequest）</h2>
        {loading ? <p>加载中…</p> : error ? <p>出错：{error.message}</p> : <p>用户：{data?.name}</p>}
        <button onClick={() => run()}>刷新</button>
      </section>

      <section>
        <h2>2. 折叠面板（useBoolean）</h2>
        <button onClick={toggle}>{open ? '收起' : '展开'}</button>
        {open && <p>这是折叠内容。</p>}
      </section>

      <section>
        <h2>3. 草稿（useLocalStorageState）</h2>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="输入后刷新仍在" />
        <p>已保存：{draft}</p>
      </section>
    </div>
  )
}
```

**这个示例覆盖**：

- `useRequest(service)`：返回 `data` / `loading` / `error` / `run`——默认自动执行，`run()` 手动刷新
- `useBoolean(false)`：返回 `[state, { toggle, setTrue, setFalse }]` 元组——典型 ahooks 风格
- `useLocalStorageState('key', { defaultValue })`：返回 `[state, setState]`，值变化自动写 localStorage、刷新自动读回（默认 JSON 序列化；`setState(undefined)` 删除该键）

## SSR 友好

ahooks 在服务端渲染环境下对浏览器相关 hook 做了降级。`useLocalStorageState` 等提供 **`getInitialValueInEffect`** 选项，把首次取值推迟到 effect（客户端）执行，规避 hydration 不一致：

```tsx
const [theme] = useLocalStorageState('theme', {
  defaultValue: 'light',
  getInitialValueInEffect: true, // SSR 下避免 hydration mismatch
})
```

## TypeScript

ahooks **100% 用 TypeScript 编写**，无需额外 `@types/*`。`useRequest` 会**根据 service 的返回类型自动推导 `data`**、根据参数推导 `run` 的入参：

```tsx
import { useRequest } from 'ahooks'

interface User { id: number; name: string }

// service 返回 Promise<User> —— data 自动推导为 User | undefined
async function getUser(id: number): Promise<User> {
  return fetch(`/api/user/${id}`).then((r) => r.json())
}

const { data, run } = useRequest(getUser, {
  manual: true,
  defaultParams: [1], // 类型须匹配 getUser 的参数 [number]
})

run(2)      // ✅ number
// run('x') // ❌ TS 报错
```

## 下一步

到这里你已经会安装 ahooks、掌握「`useRequest` 三件套、`[state, actions]` 元组、`useMemoizedFn` 闭包陷阱」三大核心约定了——下一步深入：

- [指南](./guide-line.md)：**旗舰 `useRequest` 全选项深度**（`manual` / `ready` / `refreshDeps` / `loadingDelay` / 轮询 / 防抖节流 / 聚焦刷新 / `cacheKey` + `staleTime` + `cacheTime` SWR / `clearCache` / 重试 / `mutate` / `run` vs `runAsync` / `cancel` 真实语义） / **Scene 场景类**（分页三件套 / 无限滚动 / 虚拟列表 / 倒计时 / WebSocket） / **State / Effect / Dom 类** / **Advanced 明星**（`useMemoizedFn` / `useCreation` / `useReactive` / `useLatest`） / **Dev 调试 hook** / **常见坑**（`manual` 连锁失效、`cancel` 不真取消、轮询非固定间隔、缓存共享与 cacheTime 冲突）
