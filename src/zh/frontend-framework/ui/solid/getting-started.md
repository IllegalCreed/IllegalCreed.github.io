---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Solid 1.9.x 编写

## 速查

- 系统要求：Node.js **18.18+** / **20+**（SolidStart 推荐 Node 20+）
- 创建方式：
  - **官方脚手架**：`pnpm create solid`（交互式选 SolidStart / SPA / TS）
  - **Vite 模板**：`pnpm create vite@latest my-app -- --template solid-ts`（极简 SPA）
  - **degit 拉模板**：`npx degit solidjs/templates/ts my-app`（更轻量）
- 启动：`pnpm dev`（Vite 默认 `http://localhost:3000`；SolidStart 同）
- 入口：`render(() => <App />, document.getElementById('root')!)`
- 组件写法：函数组件 + JSX，**组件只运行一次**用于建立响应式图
- JSX：与 React 类似但属性用 `class`（不是 `className`）、`for`（不是 `htmlFor`）
- 核心 Signals：`createSignal` / `createMemo` / `createEffect` / `createResource`
- 核心 Stores：`createStore` / `produce` / `unwrap` / `reconcile`
- 控制流：`<For>` / `<Show>` / `<Switch>` / `<Match>` / `<Index>` / `<Dynamic>` / `<Portal>` / `<ErrorBoundary>` / `<Suspense>`
- 生命周期：`onMount` / `onCleanup`（无 `onUpdated`，effect 自动追踪重跑）
- Context：`createContext` + `useContext` + `<Context.Provider>`
- 路由：[@solidjs/router](https://github.com/solidjs/solid-router)（官方路由）
- 状态：signals / stores / [Solid Primitives](https://primitives.solidjs.community/)
- 元框架：[SolidStart](https://docs.solidjs.com/solid-start)（文件路由 + Server Functions）
- 工具：[Solid Devtools](https://github.com/thetarnav/solid-devtools)（浏览器扩展）

## Solid 是「细粒度响应式」不是「重渲染」

这是理解 Solid 的关键定位差异——**组件只运行一次**：

| 维度 | Solid 1.9 | React 19 | Vue 3.5 |
|---|---|---|---|
| 自我定位 | Library（细粒度响应式） | Library（重渲染 + reconcile） | Framework（编译时优化 + Proxy） |
| 模板 | JSX（编译到 DOM 操作） | JSX（编译到 vnode） | SFC 模板（编译到 vnode） |
| Virtual DOM | **无** | 有（Fiber） | 有（patchFlag 优化） |
| 组件重跑 | **永远只跑一次** | 每次 state 变化重跑 | 不重跑（响应式追踪） |
| 状态原语 | `createSignal(0)` | `useState(0)` | `ref(0)` |
| 派生 | `createMemo(...)` | `useMemo(...)` | `computed(...)` |
| 副作用 | `createEffect(...)` | `useEffect(...)` | `watchEffect(...)` |
| 异步 | `createResource(...)` | `use(promise)` / RSC | `<Suspense>` + `async setup` |
| 列表 key | `<For each={list}>` 自动 | `key={id}` 手动 | `:key="id"` 手动 |
| 学习曲线 | 中等（要换响应式心智） | 中等 | 平缓 |
| Bundle | **最小**（~7 KB） | 中（~45 KB） | 较小（~25 KB） |

**含义**：

- Solid 把「模板 → DOM 操作」交给**编译器**，把「响应式追踪 + 更新」交给极薄的运行时
- 状态变化不重跑组件函数，只重跑订阅了该信号的 effect / 单个 DOM textnode / 单个属性绑定
- 相对代价：从 React 来的人**必须改思维**——`props.count` 才响应，`const { count } = props` 之后是死值
- 性能与体积都是「同等业务下最优」的级别，但生态规模仍小于 React / Vue

## 安装与首次启动

### 推荐路径 A：SolidStart（官方元框架）

最完整的官方起点，含文件路由 / SSR / Server Functions / 多 adapter 部署：

```bash
pnpm create solid

# 交互式提问，常见组合：
# ◇ Project Name? my-app
# ◇ Is this a SolidStart project? Yes
# ◇ Which template? bare / basic / hackernews / todomvc / with-auth / with-tailwindcss / ...
# ◇ Use TypeScript? Yes

cd my-app
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:3000`。**HMR 默认开启**，编辑 `src/routes/index.tsx` 立刻热更。

### 推荐路径 B：Vite + Solid（纯 SPA）

不要 SSR、文件路由——直接 Vite 模板：

```bash
pnpm create vite@latest my-app -- --template solid-ts
cd my-app
pnpm install
pnpm dev
```

得到一个 SPA 起点，路由要自己装 `@solidjs/router`。

::: tip SolidStart vs Vite-only

- **SolidStart**：官方推荐，含文件路由 / SSR / Server Functions / 部署 adapter；中大型项目首选
- **Vite + Solid**：极简起点，纯前端 SPA、嵌入到老项目、组件库开发 / 教学时用

:::

### 推荐路径 C：degit 模板

`solidjs/templates` 仓库有多个起点（TypeScript / JS / Tauri / Universal），直接用 degit 拉取：

```bash
npx degit solidjs/templates/ts my-app
cd my-app && pnpm install && pnpm dev
```

模板列表见 [solidjs/templates](https://github.com/solidjs/templates)。

### Node 版本

- Solid 本体：Node 18.18+（只用浏览器无要求）
- Vite 7：Node 20.19+ / 22.12+
- SolidStart：推荐 Node 20+

```bash
nvm install --lts && nvm use --lts
node -v   # v22.x
```

## 项目结构

### Vite + Solid 默认结构

```
my-app/
├── public/                 # 不经 bundler 的静态资源
├── src/
│   ├── App.tsx             # 根组件
│   ├── App.module.css
│   ├── index.tsx           # 入口（render + App）
│   ├── index.css
│   ├── logo.svg
│   └── assets/             # 经 bundler 的资源
├── index.html              # SPA HTML 入口
├── vite.config.ts          # Vite + vite-plugin-solid
├── tsconfig.json
└── package.json
```

### SolidStart 默认结构

```
my-app/
├── public/
├── src/
│   ├── app.tsx             # 根 App（Router + Suspense）
│   ├── app.css
│   ├── entry-client.tsx    # 客户端 hydration 入口
│   ├── entry-server.tsx    # 服务端渲染入口
│   ├── routes/             # 文件路由根
│   │   ├── index.tsx       # /
│   │   ├── about.tsx       # /about
│   │   ├── api/
│   │   │   └── hello.ts    # /api/hello（API 路由）
│   │   └── [id].tsx        # /:id（动态路由）
│   └── components/
├── app.config.ts           # SolidStart 配置（Vinxi 之上）
└── package.json
```

**SolidStart 文件路由约定**：

- `src/routes/index.tsx` → `/`
- `src/routes/about.tsx` → `/about`
- `src/routes/users/[id].tsx` → `/users/:id`
- `src/routes/blog/[...slug].tsx` → 通配
- `src/routes/(group)/page.tsx` → 分组（不影响 URL）
- `src/routes/api/hello.ts` → API 路由（导出 `GET` / `POST` 等）

## JSX 基础

Solid JSX 与 React JSX **语法几乎一致**，但有几条关键差异：

```tsx
// JSX 写法
const element = <h1 class="title">Hello, {name()}!</h1>

// 编译后（dom-expressions）—— 不是 React.createElement
const _tmpl$ = template(`<h1 class="title">Hello, !`)

function _el() {
  const _el$ = _tmpl$()
  const _el$2 = _el$.firstChild
  insert(_el$, () => name(), null)   // 只更新这一个文本节点
  return _el$
}
```

**JSX 与 React 的差异（共 9 点）**：

1. **`class` 不是 `className`**——Solid 直接用 HTML 原生属性名
2. **`for` 不是 `htmlFor`**——label 的 for 属性同理
3. **`onclick` / `onClick` 都可以**——Solid 同时支持小写（更接近 HTML）和驼峰
4. **属性可以是 signal getter**——`<input value={text()}>` 之后 `text` 变 DOM 就变
5. **`style` 可以是字符串或对象**——`style="color:red"` 或 <span v-pre>`style={{ color: 'red' }}`</span>
6. **`classList` 比 `class` 推荐用于条件类**——<span v-pre>`classList={{ active: isActive() }}`</span>
7. **`ref` 是赋值不是 `useRef`**——`let el; <div ref={el}>` 后 `el` 直接是 DOM
8. **`<For>` / `<Show>` 比 `.map` / `&&` 推荐**——细粒度更新需要
9. **Fragment 仍是 `<>...</>`**——和 React 一致

```tsx
import { createSignal, For, Show } from 'solid-js'

function App() {
  const [name, setName] = createSignal('Solid')
  const items = ['Vue', 'React', 'Solid', 'Svelte']

  return (
    <>
      <h1>Hello, {name()}!</h1>
      <p style={{ color: 'gray', 'font-size': '14px' }}>Choose:</p>
      <ul>
        <For each={items}>
          {(item) => <li>{item}</li>}
        </For>
      </ul>
      <Show when={name() === 'Solid'}>
        <span>You picked Solid!</span>
      </Show>
      <button onClick={() => setName('Vue')}>Switch</button>
    </>
  )
}
```

::: warning JSX 表达式必须是 signal getter
模板中读 signal 必须写 `name()` 而不是 `name`——后者是 getter 函数引用，前者才会被 dom-expressions 编译成响应式更新点。
:::

## 第一个组件

Solid 组件本质上是「**返回 JSX 的 JavaScript 函数，只运行一次**」：

```tsx
import { createSignal } from 'solid-js'

// 函数声明
function Welcome(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>
}

// 箭头函数（常见）
const Welcome = (props: { name: string }) => {
  return <h1>Hello, {props.name}!</h1>
}

// 使用
<Welcome name="World" />
```

**关键差异：组件只跑一次**

```tsx
import { createSignal } from 'solid-js'

function Counter() {
  console.log('Counter 组件函数执行')   // 只打印一次！
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <p>Count: {count()}</p>       {/* count() 是响应式 */}
      <button onClick={() => setCount(count() + 1)}>+1</button>
    </div>
  )
}
```

点击按钮 10 次，`'Counter 组件函数执行'` 只打印 **1 次**；只有 `<p>` 内的文本节点被精确更新。这是 Solid 与 React 心智模型的**根本差异**。

::: warning Props 不能解构
```tsx
// ❌ 解构丢响应性
function Greet(props: { name: string }) {
  const { name } = props        // name 永远是初始值
  return <p>Hello {name}</p>    // 不更新
}

// ✅ 访问 props.xxx
function Greet(props: { name: string }) {
  return <p>Hello {props.name}</p>   // 响应式
}

// ✅ 多个 props 用 splitProps
import { splitProps } from 'solid-js'
function Greet(props: { name: string; age: number; role: string }) {
  const [local, others] = splitProps(props, ['name', 'age'])
  return <p>{local.name} / {local.age} / {others.role}</p>
}
```
:::

## Signals 入门

### `createSignal` —— 响应式状态

```tsx
import { createSignal } from 'solid-js'

function Counter() {
  // 返回 [getter, setter] 元组
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <p>Count: {count()}</p>           {/* 读：调用 getter */}
      <button onClick={() => setCount(count() + 1)}>+1</button>
      <button onClick={() => setCount(c => c + 1)}>+1 函数式</button>
    </div>
  )
}
```

**`createSignal` 三要点**：

1. 返回 `[getter, setter]` 元组——**getter 是函数，必须调用**
2. `setCount(next)` 触发依赖该信号的所有 effect / DOM 操作
3. 函数式更新 `setCount(c => c + 1)` 适合连续多次更新

### `createEffect` —— 副作用

```tsx
import { createSignal, createEffect } from 'solid-js'

function UserProfile(props: { userId: string }) {
  const [user, setUser] = createSignal<User | null>(null)

  createEffect(() => {
    // 副作用：自动追踪 props.userId
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    fetch(`/api/users/${props.userId}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setUser)
  })

  return (
    <Show when={user()} fallback={<div>Loading...</div>}>
      <h1>{user()!.name}</h1>
    </Show>
  )
}
```

**`createEffect` 三要点**：

1. **没有依赖数组**——自动追踪函数内访问的所有 signal
2. **首次同步执行一次**（不像 `onMount` 等待初次渲染完）
3. **清理用 `onCleanup`**——可以在 effect 内任意层级调用，每次 effect 重跑前先跑清理

### `createMemo` —— 派生值（带缓存）

```tsx
import { createSignal, createMemo } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)

  // 自动追踪依赖、缓存结果
  const doubled = createMemo(() => count() * 2)
  const fizzbuzz = createMemo(() => {
    if (count() % 15 === 0) return 'FizzBuzz'
    if (count() % 3 === 0) return 'Fizz'
    if (count() % 5 === 0) return 'Buzz'
    return String(count())
  })

  return (
    <div>
      <p>{count()} → {doubled()} → {fizzbuzz()}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  )
}
```

**`createMemo` 与 `createEffect` 的区别**：

- `createEffect`：副作用（fetch / 改 DOM / 写 localStorage），无返回值
- `createMemo`：派生计算（filter / map / 字符串拼接），返回 signal-like getter

### `createResource` —— 异步资源

```tsx
import { createSignal, createResource, Suspense, ErrorBoundary, For } from 'solid-js'

function PostList() {
  const [userId, setUserId] = createSignal(1)

  // source 是 reactive trigger；fetcher 返回 Promise
  const [posts] = createResource(userId, async (id) => {
    const res = await fetch(`/api/users/${id}/posts`)
    if (!res.ok) throw new Error('Failed')
    return res.json()
  })

  return (
    <ErrorBoundary fallback={<p>加载失败</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <For each={posts()}>
          {(post) => <li>{post.title}</li>}
        </For>
      </Suspense>
    </ErrorBoundary>
  )
}
```

`createResource` 是 Solid 处理异步的标准入口，**自动与 `<Suspense>` / `<ErrorBoundary>` 集成**。

## Props 与组件通信

### 父传子（Props）

```tsx
interface UserCardProps {
  name: string
  age?: number              // 可选
  onSelect?: (id: string) => void
  children?: JSX.Element
}

function UserCard(props: UserCardProps) {
  return (
    <div onClick={() => props.onSelect?.(props.name)}>
      <h2>{props.name}</h2>
      <Show when={props.age}>
        <p>Age: {props.age}</p>
      </Show>
      {props.children}
    </div>
  )
}

// 使用
<UserCard name="Alice" age={30} onSelect={id => console.log(id)}>
  <button>Edit</button>
</UserCard>
```

::: warning 不要解构 props
访问必须用 `props.name` / `props.age`，**不能** `const { name, age } = props`——后者一旦执行就是死值，失去响应性。

如果想要默认值或部分提取，用 `mergeProps` / `splitProps`：

```tsx
import { mergeProps, splitProps } from 'solid-js'

function UserCard(props: UserCardProps) {
  const merged = mergeProps({ age: 18 }, props)   // 提供默认值
  const [local, rest] = splitProps(props, ['name'])
  return <div {...rest}>{local.name}</div>
}
```
:::

### 子传父（Callback Props）

Solid 没有 Vue 的 `emit`——子组件通过调用「父传下来的回调函数」通信：

```tsx
function Child(props: { onChange: (value: string) => void }) {
  return <input onInput={e => props.onChange(e.currentTarget.value)} />
}

function Parent() {
  const [value, setValue] = createSignal('')
  return (
    <>
      <Child onChange={setValue} />
      <p>{value()}</p>
    </>
  )
}
```

### 跨层级（Context）

```tsx
import { createContext, useContext } from 'solid-js'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<Theme>('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  )
}

function Page() {
  const theme = useContext(ThemeContext)
  return <div class={theme}>Hello</div>
}
```

## 列表渲染：`<For>` 与 `<Index>`

Solid 推荐用 `<For>` / `<Index>` 而非 `.map`——因为细粒度更新需要在框架级别管理列表 reconcile：

```tsx
import { createSignal, For } from 'solid-js'

interface Todo {
  id: number
  title: string
  done: boolean
}

function TodoList(props: { todos: Todo[] }) {
  return (
    <ul>
      <For each={props.todos} fallback={<li>暂无数据</li>}>
        {(todo, index) => (
          <li>
            #{index()} - {todo.title}
          </li>
        )}
      </For>
    </ul>
  )
}
```

**`<For>` vs `<Index>` 的区别**：

| 维度 | `<For>` | `<Index>` |
|---|---|---|
| 映射依据 | 数组元素**引用**（对象身份） | 数组**位置（index）** |
| 元素 | 静态值（不是 signal） | accessor `() => T` |
| index | accessor `() => number` | 普通 number |
| 重排 | 自动复用对应对象的 DOM 节点 | 按 index 复用，值变 DOM 更新 |
| 适合 | 列表项有稳定 id 的动态列表 | 固定长度 / 按 index 替换值的场景 |

```tsx
// <For>：典型用法
<For each={todos()}>
  {(todo, index) => <li>{todo.title}</li>}
</For>

// <Index>：item 是函数（accessor）
<Index each={frames()}>
  {(frame, index) => <span>#{index} {frame()}</span>}
</Index>
```

::: tip 默认 `.map` 性能差
Solid 文档明确说**不要用 `.map`**——因为 `.map` 在外层不是 reactive 边界，整个数组变化时所有项都会重新创建 DOM 节点。`<For>` / `<Index>` 才是细粒度更新的入口。
:::

## 条件渲染：`<Show>` 与 `<Switch>`

`<Show>` 用于单一条件，`<Switch>` + `<Match>` 用于多分支：

```tsx
import { Show, Switch, Match } from 'solid-js'

// <Show>
<Show when={user()} fallback={<p>请登录</p>}>
  <p>Welcome, {user()!.name}</p>
</Show>

// <Show> + keyed（when 变化时整个子树重建）
<Show when={user()} keyed>
  {(user) => <UserCard user={user} />}
</Show>

// <Switch> + <Match>
<Switch fallback={<p>未知状态</p>}>
  <Match when={status() === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status() === 'success'}>
    <SuccessView />
  </Match>
  <Match when={status() === 'error'}>
    <ErrorView />
  </Match>
</Switch>
```

::: warning 不要用 `{cond && <X/>}`
原因同上——`&&` 在条件 false → true 切换时不会真正注册到响应式图，可能不更新或更新不彻底。**用 `<Show>` 是 Solid 的强约定**。
:::

## 事件处理

Solid 用 **委托事件** 处理常见事件（在 root 节点统一监听），与 React 类似但**类型更严格**：

```tsx
function App() {
  const handleClick = (e: MouseEvent & { currentTarget: HTMLButtonElement }) => {
    e.preventDefault()
    console.log(e.clientX, e.clientY)
  }

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    console.log(e.currentTarget.value)
  }

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onInput={handleInput} />
      <button on:click={handleClick}>原生不委托（前缀 on:）</button>
    </div>
  )
}
```

**事件命名约定**：

- `onClick` / `onclick` 都可以——前者 camelCase 风格（React 习惯），后者更接近 HTML
- 使用 `on:click` 强制使用原生事件监听（不走委托）
- 自定义事件用 `on:my-event`

## ref 与 DOM 访问

`ref` 是「**赋值**」而非 `useRef`——Solid 编译时把对 `ref` 的赋值改写成 `(el) => varName = el`：

```tsx
import { onMount } from 'solid-js'

function FocusInput() {
  let inputRef: HTMLInputElement | undefined

  onMount(() => {
    inputRef?.focus()
  })

  return <input ref={inputRef} />
}

// 回调形式（更灵活）
function FocusInput2() {
  return (
    <input ref={(el) => {
      onMount(() => el.focus())
    }} />
  )
}
```

::: tip ref 的赋值时机
Solid 在 JSX 编译时把 `ref={inputRef}` 改写成 `_$ref(_el$, (val) => inputRef = val)`。赋值发生在 **DOM 节点插入文档之前**——也就是说，`onMount` 之前 `ref` 就已经有值（与 React 不同）。
:::

## Strict Mode 与 dev 模式

Solid **没有等价的 `<StrictMode>`**——因为组件本身只跑一次，没有「effect 双调用」需求。dev / prod 模式由编译器选择，编译产物不同。

VS Code 推荐扩展：

- **Solid Snippets** —— 常用 snippets
- **TypeScript JSX with Solid** —— 自动类型检查
- **Solid Devtools** —— 浏览器扩展，组件树 / signal 实时检查

```bash
# 装 devtools 工具包
pnpm add -D solid-devtools
```

```tsx
// vite.config.ts
import devtools from 'solid-devtools/vite'

export default defineConfig({
  plugins: [
    devtools({
      autoname: true,    // 自动给 signal 命名（基于变量名）
    }),
    solid(),
  ],
})
```

## 学习路径建议

1. **第 1 周**：JSX → 函数组件 → `createSignal` / `createEffect` → `<For>` / `<Show>`（这一篇够了）
2. **第 2 周**：`createMemo` / `createResource` / `createStore` → 生命周期（`onMount` / `onCleanup`） → Context → ref（看 `guide-line.md` 前半）
3. **第 3 周**：`<Suspense>` / `<ErrorBoundary>` / `<Portal>` / `<Dynamic>` → 自定义指令 `use:` → Solid Router（看 `guide-line.md` 后半）
4. **第 4 周**：SolidStart 文件路由 → Server Functions → `use server` / `use client` → TypeScript 工具类型（看 `guide-line.md` 最后 / `reference.md`）
5. **持续提升**：编译器输出原理 → @solidjs/signals 2.0 实验 → SSR / Streaming → 与原生 DOM 库集成

下一章 `guide-line.md` 一站式深入讲所有 API、控制流组件、Stores、SolidStart、路由与 TypeScript 集成。
