---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 React 19.x 编写

## 速查

- 系统要求：Node.js **20.19+** / **22.12+**（Vite 7 / Next.js 15 要求）
- 创建方式：
  - **Vite**：`pnpm create vite@latest my-app -- --template react-ts`（最常用的 SPA 起点）
  - **Next.js**：`pnpm create next-app@latest`（官方推荐的全栈元框架）
  - **TanStack Start**：`pnpm create tanstack-app@latest`（类型最强的全栈方案）
  - **Remix → React Router v7**：`pnpm create react-router@latest`（Remix 已并入 React Router）
- 启动：`pnpm dev`（Vite 默认 `http://localhost:5173`；Next.js 默认 `http://localhost:3000`）
- 入口：`createRoot(document.getElementById('root')!).render(<App />)`
- 组件写法：函数组件 + Hooks，`function App() { return <div /> }` 或 `const App = () => <div />`
- JSX：JavaScript 的语法扩展，编译后变成 `React.createElement(...)` 调用
- 核心 Hooks：`useState` / `useEffect` / `useContext` / `useRef` / `useReducer` / `useMemo` / `useCallback`
- React 19 新 Hooks：`use` / `useActionState` / `useFormStatus` / `useOptimistic` / `useTransition` / `useDeferredValue`
- 路由：[React Router v7](https://reactrouter.com/)（最主流）、[TanStack Router](https://tanstack.com/router)（类型最强）
- 状态：[Redux Toolkit](https://redux-toolkit.js.org/)、[Zustand](https://zustand-demo.pmnd.rs/)、[Jotai](https://jotai.org/)
- 数据：[TanStack Query](https://tanstack.com/query)（最流行的服务端状态库）
- 工具：[React DevTools](https://react.dev/learn/react-developer-tools)（浏览器扩展）

## React 是「库」不是「框架」

这是理解 React 的关键定位差异：

| 维度 | React | Vue | Angular |
|---|---|---|---|
| 自我定位 | Library | Framework（渐进式） | Framework（重型） |
| 路由 | 第三方（React Router / TanStack） | 官方 Vue Router | 官方 `@angular/router` |
| 状态管理 | 第三方（Redux / Zustand / Jotai） | 官方 Pinia | 官方 RxJS / Signals |
| HTTP 请求 | 第三方（fetch / axios / TanStack Query） | 第三方 | 官方 `HttpClient` |
| 表单 | 第三方（React Hook Form / Formik） | 内置 `v-model` | 官方 Reactive Forms |
| SSR | 元框架（Next.js / Remix） | 元框架（Nuxt） | 官方 Angular Universal |
| 构建 | 元框架决定 | 官方 Vite | 官方 Angular CLI |
| CSS | 第三方（CSS Modules / Tailwind / CSS-in-JS） | 内置 `<style scoped>` | 内置 `@Component` styles |

**含义**：

- React 只解决「组件 + 状态 + 渲染」三件事；其它一切（路由、SSR、构建、表单、HTTP）都靠生态
- 优势：每个赛道都有 3-10 个成熟方案，组合自由度极高；不被框架绑死
- 代价：决策疲劳——新项目第一周可能花在「选哪个路由 / 状态 / HTTP / CSS 方案」上
- 实务建议：**起步用元框架**（Next.js / Remix），不要从零拼。元框架已经替你选好了路由 / SSR / 数据获取的合理默认

## 安装与首次启动

### 推荐路径 A：Vite + React（SPA）

最快的纯前端 SPA 起点，零 SSR、零数据获取，适合后端独立的项目：

```bash
pnpm create vite@latest my-app -- --template react-ts
cd my-app
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173` 即看到默认页。HMR 默认开启，编辑 `src/App.tsx` 立刻热更。

### 推荐路径 B：Next.js（全栈 SSR / RSC）

要 SSR、SEO、Server Components、Server Actions、文件路由——直接 Next.js：

```bash
pnpm create next-app@latest

# 交互式提问，常见组合：
# √ What is your project named? my-app
# √ Would you like to use TypeScript? Yes
# √ Would you like to use ESLint? Yes
# √ Would you like to use Tailwind CSS? Yes
# √ Would you like your code inside a `src/` directory? Yes
# √ Would you like to use App Router? Yes
# √ Would you like to use Turbopack for next dev? Yes
# √ Would you like to customize the import alias? No

cd my-app && pnpm dev
```

打开 `http://localhost:3000`。Next.js 15 默认 **App Router + React Server Components**，是 React 19 特性最完整的元框架。

### 推荐路径 C：TanStack Start（类型最强全栈）

如果你已经用 TanStack Query / Router，并且类型安全优先级最高：

```bash
pnpm create tanstack-app@latest my-app
cd my-app && pnpm dev
```

TanStack Start 是 Vite 之上的全栈框架，类型推导从路由参数一直贯穿到 loader 返回值。

### 推荐路径 D：React Router v7（前 Remix）

Remix 已经并入 React Router v7（2024.12），同时支持 SPA 模式和 SSR 模式：

```bash
pnpm create react-router@latest my-app
cd my-app && pnpm dev
```

### Node 版本

React 本体没有 Node 版本要求（只是个库），但构建链有：

- Vite 7：Node 20.19+ / 22.12+
- Next.js 15：Node 18.18+（推荐 20+）
- React Router v7：Node 20+

```bash
nvm install --lts && nvm use --lts
node -v   # v22.x
```

## 项目结构

### Vite + React 默认结构

```
my-app/
├── public/                  # 不经 bundler 的静态资源
│   └── vite.svg
├── src/
│   ├── assets/              # 经 bundler 的资源（图片、字体）
│   ├── App.tsx              # 根组件
│   ├── App.css
│   ├── main.tsx             # 入口（createRoot + render）
│   ├── index.css
│   └── vite-env.d.ts        # Vite 类型声明
├── index.html               # SPA HTML 入口
├── vite.config.ts           # Vite 配置
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

### Next.js App Router 默认结构

```
my-app/
├── public/
├── src/
│   └── app/                 # App Router 根（文件路由）
│       ├── layout.tsx       # 根 Layout（包裹整站）
│       ├── page.tsx         # 首页 /
│       ├── about/
│       │   └── page.tsx     # /about
│       ├── api/
│       │   └── route.ts     # API 路由（Route Handler）
│       └── globals.css
├── next.config.ts
├── tailwind.config.ts       # 如果选了 Tailwind
└── tsconfig.json
```

**App Router 关键文件名约定**：

- `page.tsx`：页面（必须）
- `layout.tsx`：布局（嵌套包裹子页面）
- `loading.tsx`：Suspense fallback
- `error.tsx`：Error Boundary
- `not-found.tsx`：404
- `route.ts`：API 路由

## JSX 基础

JSX 是 JavaScript 的语法扩展，写起来像 HTML、跑起来是 JavaScript：

```tsx
// JSX 写法
const element = <h1 className="title">Hello, {name}!</h1>

// 编译后（React 17+ 的新 JSX Transform）
import { jsx as _jsx } from 'react/jsx-runtime'
const element = _jsx('h1', { className: 'title', children: ['Hello, ', name, '!'] })

// 老编译（React 16）
const element = React.createElement('h1', { className: 'title' }, 'Hello, ', name, '!')
```

**JSX 八条规则**：

1. **必须只有一个根节点**——多根用 `<></>`（Fragment）包裹
2. **必须闭合标签**——`<img />`、`<br />`、`<input />`
3. **属性 camelCase**——`className`（不是 `class`）、`htmlFor`（不是 `for`）、`onClick`
4. **`{}` 嵌入 JS 表达式**——`{name}`、`{1 + 2}`、`{user.name}`，但不能写语句（不能 `if` / `for`）
5. **字符串属性用 `"`**——`<div className="box" />`；动态属性用 `{}`——`<div className={cls} />`
6. **`style` 是对象**——<span v-pre>`<div style={{ color: 'red', fontSize: 16 }} />`</span>（不是字符串）
7. **`children` 也是属性**——`<Box>hi</Box>` 等价于 `<Box children="hi" />`
8. **JSX 大小写敏感**——首字母大写当组件渲染，小写当 HTML 标签

```tsx
function App() {
  const name = 'React'
  const items = ['Vue', 'React', 'Svelte']

  return (
    <>
      <h1>Hello, {name}!</h1>
      <p style={{ color: 'gray', fontSize: 14 }}>Choose your framework:</p>
      <ul>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button onClick={() => alert('clicked')}>Click me</button>
    </>
  )
}
```

## 第一个组件

React 组件本质上就是「**返回 JSX 的 JavaScript 函数**」：

```tsx
// 函数声明
function Welcome(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>
}

// 箭头函数（更常见）
const Welcome = (props: { name: string }) => {
  return <h1>Hello, {props.name}!</h1>
}

// 隐式返回 + 解构 props
const Welcome = ({ name }: { name: string }) => <h1>Hello, {name}!</h1>

// 使用
<Welcome name="World" />
```

**Class 组件已不推荐**——React 19 仍保留兼容，但所有新功能（Hooks / Suspense / Concurrent / Server Components）都围绕函数组件设计：

```tsx
// 旧风格（仅维护遗留项目时用）
class Welcome extends React.Component<{ name: string }> {
  render() {
    return <h1>Hello, {this.props.name}!</h1>
  }
}
```

## Hooks 入门

### `useState` —— 组件状态

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(c => c + 1)}>+1 (函数式)</button>
    </div>
  )
}
```

**`useState` 三要点**：

1. 返回 `[state, setState]` 元组
2. `setState(next)` 触发重渲染
3. **多次连续更新建议用函数式**——`setCount(c => c + 1)` 而不是 `setCount(count + 1)`，避免闭包过期值

### `useEffect` —— 副作用

```tsx
import { useEffect, useState } from 'react'

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 副作用：取数据
    let cancelled = false
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setUser(data)
      })

    // 清理函数：组件卸载或 userId 变化时跑
    return () => {
      cancelled = true
    }
  }, [userId])  // 依赖数组：userId 变化时重新跑

  if (!user) return <div>Loading...</div>
  return <h1>{user.name}</h1>
}
```

**依赖数组三种情况**：

- `[]`：仅挂载时跑一次
- `[a, b]`：a 或 b 变化时跑
- 省略（不传第二个参数）：每次渲染都跑（几乎不用）

### `useContext` —— 跨层级共享值

```tsx
import { createContext, useContext } from 'react'

// 1. 创建 Context
const ThemeContext = createContext<'light' | 'dark'>('light')

// 2. 提供值（React 19 直接用 Context，不需要 .Provider）
function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  )
}

// 3. 消费值
function Page() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Hello</div>
}
```

### `useRef` —— 跨渲染保留可变值

```tsx
import { useRef, useEffect } from 'react'

function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} />
}
```

**`useRef` 两种用途**：

1. **持有 DOM 节点**——`const ref = useRef<HTMLDivElement>(null)` + `<div ref={ref} />`
2. **跨渲染保留值（不触发重渲染）**——`const renderCount = useRef(0); renderCount.current++`

## Props 与组件通信

### 父传子（Props）

```tsx
interface UserCardProps {
  name: string
  age?: number          // 可选
  onSelect?: (id: string) => void
  children?: React.ReactNode
}

function UserCard({ name, age = 18, onSelect, children }: UserCardProps) {
  return (
    <div onClick={() => onSelect?.(name)}>
      <h2>{name}</h2>
      {age && <p>Age: {age}</p>}
      {children}
    </div>
  )
}

// 使用
<UserCard name="Alice" age={30} onSelect={id => console.log(id)}>
  <button>Edit</button>
</UserCard>
```

### 子传父（Callback Props）

React 没有 Vue 的 `emit`——子组件通过调用「父传下来的回调函数」来通信：

```tsx
function Child({ onChange }: { onChange: (value: string) => void }) {
  return <input onChange={e => onChange(e.target.value)} />
}

function Parent() {
  const [value, setValue] = useState('')
  return (
    <>
      <Child onChange={setValue} />
      <p>{value}</p>
    </>
  )
}
```

### 跨层级（Context）

见上面 `useContext` 示例。深嵌套场景（>3 层）才用，浅嵌套优先用 props。

### 全局（状态库）

更复杂的跨组件共享用 Zustand / Redux Toolkit / Jotai 等，详见 `advanced.md`。

## 列表渲染（map + key）

```tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.title}
        </li>
      ))}
    </ul>
  )
}
```

**`key` 三条铁律**：

1. **必须给**——否则 React 会用 index 兜底，警告并可能引发 bug
2. **必须稳定**——不要用 `Math.random()` 或 `Date.now()`，否则每次渲染都换 key 失去优化意义
3. **必须唯一**——同级 sibling 中唯一即可，不必全局唯一；不要用 index 做 key（顺序变了会复用错节点）

```tsx
// ❌ 用 index 做 key：增删/排序时复用错节点
{items.map((item, i) => <Item key={i} data={item} />)}

// ✅ 用稳定 ID
{items.map(item => <Item key={item.id} data={item} />)}
```

## 表单

### 受控组件（推荐）

```tsx
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

### 非受控组件（用 ref 取值）

```tsx
function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(formRef.current!)
    console.log(Object.fromEntries(formData))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input name="email" type="email" defaultValue="" />
      <input name="password" type="password" defaultValue="" />
      <button type="submit">Login</button>
    </form>
  )
}
```

### React 19：Form Actions（新）

React 19 让 `<form action={fn}>` 一等公民化：

```tsx
function LoginForm() {
  async function submit(formData: FormData) {
    const email = formData.get('email')
    const password = formData.get('password')
    await login(email, password)
  }

  return (
    <form action={submit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Login</button>
    </form>
  )
}
```

配合 `useActionState` / `useFormStatus` 拿 pending 状态，详见 `advanced.md`。

## 事件处理（合成事件）

React 用「**合成事件 SyntheticEvent**」统一各浏览器的事件 API：

```tsx
function App() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log(e.clientX, e.clientY)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onChange={handleChange} />
      <form onSubmit={handleSubmit} />
    </div>
  )
}
```

**常用事件类型**：

- `MouseEvent` / `KeyboardEvent` / `TouchEvent`
- `ChangeEvent<HTMLInputElement>` / `FormEvent<HTMLFormElement>`
- `FocusEvent` / `WheelEvent` / `DragEvent`

::: tip React 17+ 已移除事件池
老 React 16 的合成事件有「事件池」机制（异步访问 `e` 会报错），17+ 已移除，可以放心异步用。
:::

## Strict Mode

`<StrictMode>` 是开发期诊断工具，包裹根组件可以提前发现潜在问题：

```tsx
// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**StrictMode 在开发期会**：

1. **故意双调用**——`useState` setter、`useReducer`、`useMemo`、`useEffect`、组件函数本身。目的是暴露副作用（你的渲染必须是纯函数）
2. **检查废弃 API**——`findDOMNode`、`UNSAFE_*` 生命周期等
3. **检测错误的 ref / context 使用**

生产环境 StrictMode 不生效，**不要因为 effect 跑了两次就慌**——把所有 effect 写成「跑两次也对」的就行。

## 开发者工具

### React DevTools

[React Developer Tools](https://react.dev/learn/react-developer-tools) 是 Chrome / Firefox 扩展：

- **Components 面板**：查看组件树、props、state、hooks
- **Profiler 面板**：录制渲染，分析性能、找出多余重渲染
- **设置 → Highlight updates**：高亮重渲染的组件（找性能问题神器）
- **⚛︎ 图标颜色**：橙色 = 生产构建（含 Source Map），蓝色 = 开发构建

### 其它实用工具

| 工具 | 用途 |
|---|---|
| [why-did-you-render](https://github.com/welldone-software/why-did-you-render) | 打印「为什么这个组件重渲染了」 |
| [@welldone-software/react-renders-tracker](https://github.com/lahmatiy/react-render-tracker) | 渲染时间线录制 |
| [React Compiler ESLint](https://www.npmjs.com/package/eslint-plugin-react-hooks) | 检查 Rules of React + Compiler 兼容性 |
| [Million.js](https://million.dev/) | 第三方运行时优化（不与 React Compiler 同用） |

## 学习路径建议

1. **第 1 周**：JSX → 函数组件 → useState / useEffect → 受控表单（这一篇够了）
2. **第 2 周**：useContext / useReducer / useRef → 自定义 Hooks → 错误边界（看 `base.md`）
3. **第 3 周**：Suspense → useTransition → React.memo / useMemo → React Router v7（看 `advanced.md` 前半）
4. **第 4 周**：Next.js App Router → Server Components / Server Actions → TanStack Query（看 `advanced.md` 后半）
5. **持续提升**：React Compiler → React Profiler 实战 → SSR / RSC 内部 → 自定义 Reconciler（看 `expert.md`）

下一章 `base.md` 详细讲所有 Hooks 用法、组件复用模式与错误边界。
