---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **usehooks-ts v3.x**（npm 包 `usehooks-ts`，截至 2026 年 **v3.1.1**；**React 专用**，支持 React 16.8 ~ 19）。

## 速查

- 系统要求：**React 16.8+**，TypeScript-first（无需额外 `@types`）
- 包定位：**最克制的 React Hooks 库（33 个 hook）**，类型干净、SSR 友好、纯 ESM、可复制源码
- 安装：`npm i usehooks-ts` / `pnpm add usehooks-ts`
- 导入：`import { useBoolean, useLocalStorage } from 'usehooks-ts'`
- **无数据请求 hook**：v3 已移除 `useFetch`；请求用 SWR / TanStack Query
- **返回形态不统一**：`useBoolean`/`useCounter`/`useDarkMode` 返回**对象**；`useToggle`/`useLocalStorage`/`useCopyToClipboard` 返回**元组**
- **v3 变更**：`useDebounce` → `useDebounceValue` + `useDebounceCallback`；移除 `useFetch`/`useSsr`/`useElementSize`/`useUpdateEffect`/`useIsFirstRender`；ESM-only
- 文档：[usehooks-ts.com](https://usehooks-ts.com/)（每个 hook 可复制源码）

## usehooks-ts 是什么

usehooks-ts 是 **Julien Caron（juliencrn）** 维护的 **TypeScript-first React Hooks 库**，一句话定位：「**一套小而精、类型最干净、即拿即用的基础 React Hooks**」。

```tsx
import { useBoolean, useLocalStorage } from 'usehooks-ts'

const { value, toggle } = useBoolean(false)     // ⚠️ 返回对象
const [name, setName] = useLocalStorage('name', '') // ⚠️ 返回元组
```

理解 usehooks-ts 的**定位坐标**：

- **最克制的一档**：仅 33 个高频 hook，比 react-use（100+）和 ahooks（企业级）都小、更聚焦
- **完全没有数据请求**：v3 移除 `useFetch`，也没有 ahooks 式 `useRequest`——请求自己搭或上 SWR / TanStack Query
- **TypeScript-first + 单文件可复制**：类型体验最好，文档站可直接拷源码进项目
- **SSR 友好 + 纯 ESM + Tree-shakeable**

### 与 react-use / ahooks 的区别

| 维度 | usehooks-ts | react-use | ahooks |
|---|---|---|---|
| 规模 | **小而精（33）** | 大而全（100+） | 企业级（70+） |
| 风格 | **TypeScript-first、克制** | 社区大杂烩 | 阿里、成体系 |
| 数据请求 | **无**（v3 移除 useFetch） | useAsync（轻量） | useRequest（轮询/缓存/SWR） |
| 适合 | 想要少而干净的基础 hook | 要海量通用 hook | 要企业级请求管理 |

**含义**：要「类型干净、依赖少、看得懂源码」的基础 hook 集选 usehooks-ts；要广覆盖选 react-use；要企业级请求管理选 ahooks。

## 安装

```bash
npm i usehooks-ts
# 或：pnpm add usehooks-ts / yarn add usehooks-ts
```

按需导入（Tree-shaking）：

```tsx
import { useBoolean, useCounter, useLocalStorage } from 'usehooks-ts'
```

> usehooks-ts 是**纯 ESM 包**（v3 起）——老的 CommonJS / Jest 配置可能需额外处理。

## v3 重大变更（升级必读）

如果你从 v2 升级，注意这些**破坏性变更**：

| 变更 | 说明 |
|---|---|
| `useDebounce` **拆分** | → `useDebounceValue`（防抖一个值）+ `useDebounceCallback`（防抖一个函数） |
| **移除** | `useFetch` / `useSsr` / `useImageOnLoad` / `useElementSize` / `useUpdateEffect` / `useIsFirstRender` 都已删除 |
| **ESM-only** | 整包改为纯 ES Modules |
| `useLocalStorage` / `useSessionStorage` | v3.1.0 返回元组**新增第三个元素 `removeValue`**（旧代码只解构两个） |
| `useResizeObserver` 替代 `useElementSize` | `useElementSize` 被移除，改用 `useResizeObserver({ ref })` |

## 基本用法

### 约定（核心坑）：返回形态「对象 vs 元组」不统一

这是 usehooks-ts **最容易踩的坑**——同是状态 hook，返回结构却不同：

```tsx
import { useBoolean, useToggle, useCounter, useLocalStorage } from 'usehooks-ts'

// 对象：按 key 解构
const { value, setTrue, setFalse, toggle } = useBoolean(false)
const { count, increment, decrement, reset } = useCounter(0)

// 元组：按位置解构（⚠️ useToggle 顺序是 [value, toggle, setValue]，toggle 在 setValue 前！）
const [on, toggleOn, setOn] = useToggle(false)
const [name, setName, removeName] = useLocalStorage('name', '') // 第三个是 removeValue
```

> **记忆法**：「**带 helper 名字的（setTrue/increment）→ 对象**；**纯 set/value 的（存储/toggle）→ 元组**」。用前查文档确认。

### useLocalStorage：跨标签同步 + SSR

```tsx
import { useLocalStorage } from 'usehooks-ts'

// 值变化自动写 localStorage；通过自定义 'local-storage' 事件跨标签/组件同步
const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light', {
  initializeWithValue: false, // SSR：首屏用 initialValue，挂载后再读 localStorage，避免 hydration mismatch
})
```

## 第一个 usehooks-ts 应用

综合演示 `useBoolean`（对象）+ `useLocalStorage`（元组）+ `useDarkMode`（对象）：

```tsx
import { useBoolean, useLocalStorage, useDarkMode } from 'usehooks-ts'

function App() {
  // 1. useBoolean —— 返回对象
  const { value: open, toggle } = useBoolean(false)

  // 2. useLocalStorage —— 返回元组 [value, setValue, removeValue]
  const [name, setName, removeName] = useLocalStorage('demo-name', '')

  // 3. useDarkMode —— 返回对象
  const { isDarkMode, toggle: toggleDark } = useDarkMode()

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <button onClick={toggleDark}>{isDarkMode ? '🌙 暗色' : '☀️ 亮色'}</button>

      <section>
        <button onClick={toggle}>{open ? '收起' : '展开'}</button>
        {open && <p>折叠内容</p>}
      </section>

      <section>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="刷新仍在" />
        <button onClick={removeName}>清除</button>
      </section>
    </div>
  )
}
```

**这个示例覆盖**：

- `useBoolean(false)`：返回**对象** `{ value, setTrue, setFalse, toggle }`
- `useLocalStorage('key', init)`：返回**元组** `[value, setValue, removeValue]`，跨标签同步
- `useDarkMode()`：返回**对象** `{ isDarkMode, toggle, enable, disable, set }`，读 `prefers-color-scheme` 并持久化

## SSR 友好性

访问浏览器 API 的 hook（`useLocalStorage` / `useWindowSize` / `useMediaQuery` / `useScreen`）都提供 **`initializeWithValue`** 选项：默认 `true`（首屏直接读浏览器值），SSR 场景设 **`false`**，首屏返回初始/默认值、客户端挂载后再读真实值——规避 hydration 不一致。判断是否客户端可用 `useIsClient()`。

## TypeScript

usehooks-ts **100% 用 TypeScript 编写**，类型完备。注意按真实返回结构解构：

```tsx
import { useStep, useCountdown } from 'usehooks-ts'

// 元组 [当前步, helpers]；canGoToNextStep 是布尔值不是函数
const [step, { goToNextStep, goToPrevStep, canGoToNextStep }] = useStep(5)

// 元组 [count, controllers]；接收单个 options 对象
const [count, { startCountdown, resetCountdown }] = useCountdown({ countStart: 60 })
```

## 下一步

- [指南](./guide-line.md)：**状态类**（`useBoolean` / `useToggle` / `useCounter` / `useStep` / `useMap`） / **存储与剪贴板**（`useLocalStorage` + `removeValue` / `useReadLocalStorage` / `useCopyToClipboard`） / **主题与媒体**（`useDarkMode` / `useTernaryDarkMode` / `useMediaQuery`） / **DOM 与布局**（`useEventListener` / `useOnClickOutside` / `useResizeObserver` / `useIntersectionObserver` / `useScrollLock`） / **定时与防抖**（`useInterval` / `useCountdown` / `useDebounceValue` / `useDebounceCallback`） / **生命周期工具** / **常见坑**
