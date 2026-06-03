---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Preact v10.x**（npm 包 `preact`，截至 2026 年 **v10.29.x**，v11 为下一个大版本；官网 [preactjs.com](https://preactjs.com/)）。

## 速查

- 定位：**3kB 的 React 替代品**，相同的现代 API（Class/Hooks/函数组件/JSX/Context）
- 安装/脚手架：`npm init preact`（create-preact，现代）；或 `npm i preact` 单装核心
- 核心导入：`import { h, render } from 'preact'`；Hooks：`import { useState } from 'preact/hooks'`（**不在核心**）
- 渲染：`render(<App />, document.body)`；SSR 水合 `hydrate(...)`
- 与 React 差异：**原生事件**（用 `onInput` 非 `onChange`）/ `class` 与 `className` **都支持** / SVG 用 kebab-case / Hooks 在 `preact/hooks`
- React 生态：`preact/compat` 把 `react`/`react-dom` 别名到 Preact（Vite 用 `@preact/preset-vite`）
- 信号：`@preact/signals` 的 `signal`/`computed`/`effect`，JSX 里直接用跳过重渲染
- SSR：`preact-render-to-string` 的 `renderToString`

## Preact 是什么

Preact 是 **Jason Miller** 与团队维护的 **React 替代品**，一句话定位：「**3kB、相同现代 API、贴近 DOM 的快速虚拟 DOM 库**」。

```jsx
import { h, render } from 'preact'
import { useState } from 'preact/hooks' // ⚠️ Hooks 在 preact/hooks

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

render(<Counter />, document.body)
```

理解 Preact 的**核心定位**：

- **相同的现代 API**：Class/Hooks/函数组件/JSX/Context 与 React 一致——React 开发者零成本上手
- **3kB 极小 + 贴近 DOM**：最薄虚拟 DOM 抽象，性能优异
- **不是 React**：无合成事件、`onInput` 而非 `onChange`、`class`+`className` 都支持、Hooks 在 `preact/hooks`
- **React 生态兼容**：`preact/compat` 别名跑 React 库

### 与 React 的区别（核心）

| 维度 | Preact | React |
|---|---|---|
| 体积 | **~3kB** | ~40kB+ |
| 事件 | **原生 addEventListener** | 合成事件系统 |
| 表单事件 | **`onInput`** | `onChange`（实为 input） |
| class | **`class` 和 `className` 都行** | 只 `className` |
| SVG 属性 | **kebab-case 原样写** | camelCase |
| Hooks 位置 | **`preact/hooks`** | `react` 核心 |
| 生态兼容 | 靠 `preact/compat` 别名 | 原生 |

**含义**：要「React 心智 + 更小更快 + 贴近 DOM」选 Preact；要「最大生态/最多三方组件/最大团队」用 React（Preact 也能借 compat 跑 React 库）。

## 安装

```bash
# 推荐：交互式脚手架（含 TS / 路由 / ESLint 选项）
npm init preact

# 或单装核心
npm i preact
```

## 核心 API

```jsx
import { h, render, hydrate, Component, Fragment, createContext } from 'preact'

// h(type, props, ...children) —— JSX 编译目标（createElement 别名）
// render(vdom, container[, replaceNode]) —— replaceNode 将在 v11 移除
render(<App />, document.getElementById('app'))

// 类组件：render(props, state) 把 props/state 作参数传入
class Hello extends Component {
  render({ name }, state) {     // 注意：参数形式，非 this.props
    return <h1>Hello {name}</h1>
  }
}
```

Hooks 从 **`preact/hooks`** 导入（不在核心）：

```jsx
import { useState, useEffect, useRef, useMemo, useErrorBoundary } from 'preact/hooks'
// useErrorBoundary 是 Preact 特有的 Hook（React 无内置等价）
```

## 与 React 的关键差异（写代码必知）

```jsx
// 1. 原生事件：表单用 onInput（不是 React 的 onChange）
<input onInput={(e) => setValue(e.currentTarget.value)} />

// 2. class 和 className 都支持（多数人用更短的 class）
<div class="card" />

// 3. SVG 属性按原样写（kebab-case）—— 可直接粘贴设计工具 SVG
<svg><path stroke-width="2" /></svg>

// 4. Hooks 从 preact/hooks 导入（从 'preact' 导入会失败）
import { useState } from 'preact/hooks'
```

> ⚠️ **不要**以为 Preact 把 `onChange` 当 input 事件——纯 Preact 里用 `onInput`；`onChange` 是真正的 change 语义。完全的 React 行为需 `preact/compat`。

## 第一个 Preact 应用

```jsx
import { render } from 'preact'
import { useState } from 'preact/hooks'

function App() {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div class="app">
      <input value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="名字" />
      <p>你好，{name || '陌生人'}</p>
      <button onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}</button>
      {open && <p>折叠内容</p>}
    </div>
  )
}

render(<App />, document.getElementById('app'))
```

**覆盖**：`render` 挂载、`useState`（来自 `preact/hooks`）、`onInput`（原生事件）、`class`（而非 className）、`e.currentTarget.value`。

## 用 preact/compat 跑 React 库

```ts
// vite.config.ts —— 用官方 preset 自动配别名（react/react-dom → preact/compat）
import preact from '@preact/preset-vite'
export default { plugins: [preact()] }
```

```js
// webpack 手动别名（注意顺序：具体键在前）
resolve: {
  alias: {
    'react/jsx-runtime': 'preact/compat/jsx-runtime', // 具体在前
    react: 'preact/compat',
    'react-dom': 'preact/compat',
  },
}
```

> 配好别名后即可 `import { forwardRef, memo, createPortal, Suspense } from 'react'`（实际走 `preact/compat`），并运行 React Router、Redux 等库。

## SSR

```jsx
import { renderToString } from 'preact-render-to-string'
const html = renderToString(<App />)   // 服务端生成 HTML
// 客户端用 hydrate(<App />, container) 复用 SSR 结构
```

## 下一步

- [指南](./guide-line.md)：**核心 API**（`h`/`render`/`hydrate`/`Component(props,state)`/`Fragment`/`createContext`/`createRef`） / **Hooks**（`preact/hooks` 全清单 + `useErrorBoundary`） / **与 React 差异详解**（无合成事件 / `onInput`·`onDblClick` / `class`+`className` / SVG / Portal 不冒泡） / **preact/compat**（webpack·Vite·Rollup·Jest 别名 + 顺序坑 + `preact/debug`） / **@preact/signals**（`signal`/`computed`/`effect`/`batch` / JSX 直接用跳过重渲染 / vs `useState`） / **工具链 & 常见坑**
