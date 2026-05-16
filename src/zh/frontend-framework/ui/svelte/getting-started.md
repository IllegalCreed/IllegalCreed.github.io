---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Svelte 5.x 编写

## 速查

- 系统要求：Node.js **20.19+** / **22.12+**（Vite 7 / SvelteKit 2 要求）
- 创建方式：
  - **SvelteKit**：`pnpm dlx sv create my-app`（官方推荐的全栈起点）
  - **Vite + Svelte**：`pnpm create vite@latest my-app -- --template svelte-ts`（纯前端 SPA）
- 启动：`pnpm dev`（SvelteKit 默认 `http://localhost:5173`，Vite 同）
- 入口：
  - SvelteKit：自动处理，无需手写
  - Vite：`mount(App, { target: document.getElementById('app')! })`
- 组件写法：`.svelte` 文件 = `<script lang="ts">` + 模板 + `<style>` 三段式
- 模板表达式：`{value}` 插值（不是 Vue 的 mustache）
- 控制流：`{#if}` / `{#each}` / `{#await}` / `{#key}` / `{#snippet}`
- **核心 Runes（Svelte 5）**：`$state` / `$derived` / `$effect` / `$props` / `$bindable` / `$inspect` / `$host`
- 事件（Svelte 5）：`onclick={fn}`（与 HTML 属性同形态，**不再是 `on:click`**）
- 双向绑定：`bind:value={x}` / `bind:checked={x}`
- 样式：`<style>` 默认 scoped；`:global(...)` 显式全局
- 路由：[SvelteKit](https://svelte.dev/docs/kit/introduction)（文件路由）/ [svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router)（SPA 第三方）
- 状态：`$state` 跨文件共享 / [Svelte stores](https://svelte.dev/docs/svelte/stores)（`writable` / `readable` / `derived`）
- 工具：[Svelte DevTools](https://chromewebstore.google.com/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn)（浏览器扩展）

## Svelte 是「编译器」不是「Runtime」

理解 Svelte 的第一步是认清它的定位差异：

| 维度 | Svelte | React | Vue |
|---|---|---|---|
| 自我定位 | **编译器框架** | UI Library | 渐进式 Framework |
| 编译策略 | **重编译时 + 极薄运行时** | 轻编译时 + 重运行时 | 重编译时 + 中等运行时 |
| Virtual DOM | **无** | 有 | 有 |
| Diff 算法 | **无**（编译时确定 DOM 操作） | Fiber Reconciler | patch + patchFlag |
| 响应式 | Signals（Svelte 5） | render + reconcile | Proxy（`ref` / `reactive`） |
| 组件文件 | `.svelte`（HTML 风格） | `.tsx`（JS 内嵌 JSX） | `.vue`（SFC） |
| 状态原语 | `$state(0)` | `useState(0)` | `ref(0)` |
| 派生 | `$derived(...)` | 普通计算（Compiler memo） | `computed(...)` |
| 副作用 | `$effect(...)` | `useEffect(...)` | `watchEffect(...)` |
| 模板 | HTML + `{}` 表达式 | JSX | `<template>` + 指令 |
| Bundle 体积 | **最小**（Hello World <10 KB） | 中等（~45 KB） | 较小（~25 KB） |

**含义**：

- Svelte 把「模板 → 实际 DOM 操作」的所有计算放在**构建时**完成，运行时只剩极小的响应式调度代码
- 不需要打包 Virtual DOM / Reconciler 进 bundle —— 这就是 Svelte bundle 体积小的根本原因
- 相对代价：**框架升级**（如 Svelte 4 → 5）通常需要重新编译所有组件，迁移成本比纯运行时框架略高

## 安装与首次启动

### 推荐路径 A：SvelteKit（官方全栈起点）

最完整的官方起点，含文件路由 / SSR / Server-only modules / 测试集成：

```bash
pnpm dlx sv create my-app

# 交互式提问，常见组合：
# ◆ Which template would you like? → SvelteKit minimal
# ◆ Add type checking with TypeScript? → Yes, using TypeScript syntax
# ◆ What would you like to add to your project? → 多选：
#     ☒ prettier
#     ☒ eslint
#     ☒ vitest
#     ☒ playwright
#     ☒ tailwindcss
#     ☐ drizzle
# ◆ Which package manager? → pnpm

cd my-app
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173`。**HMR 默认开启**，编辑 `.svelte` 文件立刻热更。

### 推荐路径 B：Vite + Svelte（纯 SPA）

不需要 SSR、文件路由——直接 Vite 模板：

```bash
pnpm create vite@latest my-app -- --template svelte-ts
cd my-app
pnpm install
pnpm dev
```

得到的是一个 SPA 起点，路由需要自己装 [svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router) 或 [svelte-routing](https://github.com/EmilTholin/svelte-routing) 等第三方。

::: tip SvelteKit vs Vite-only

- **SvelteKit**：官方推荐，含路由 / SSR / Form Actions / 多 adapter 部署；新项目 95% 应该选这个
- **Vite + Svelte**：极简起点，纯前端 SPA、嵌入到老项目、组件库开发 / 教学时用

两者底层都是 Vite。SvelteKit 多接好了路由、SSR、Server Endpoints。

:::

### Node 版本

Svelte 本体支持 Node 18+，但配套工具链有更新要求：

- Vite 7：Node 20.19+ / 22.12+
- SvelteKit 2：Node 18.13+（推荐 20+ LTS）
- `sv` CLI：Node 18+

```bash
nvm install --lts && nvm use --lts
node -v   # v22.x
```

## 项目结构

### SvelteKit 默认结构

```
my-app/
├── src/
│   ├── routes/                     # 文件系统路由根
│   │   ├── +layout.svelte          # 根 Layout（包裹整站）
│   │   ├── +layout.ts              # 根 Layout 的 load function
│   │   ├── +page.svelte            # 首页 /
│   │   ├── +page.ts                # 首页 load function（universal）
│   │   ├── about/
│   │   │   └── +page.svelte        # /about
│   │   ├── api/
│   │   │   └── hello/
│   │   │       └── +server.ts      # API 路由（Route Handler）
│   │   └── users/
│   │       └── [id]/
│   │           └── +page.svelte    # 动态路由 /users/:id
│   ├── lib/
│   │   ├── components/             # 可复用组件
│   │   ├── server/                 # **仅服务端**模块（永远不会进客户端 bundle）
│   │   ├── stores/                 # Svelte stores
│   │   └── index.ts                # `$lib` 别名导出
│   ├── app.html                    # HTML 模板（含 %sveltekit.head% / %sveltekit.body% 占位）
│   ├── app.d.ts                    # 全局类型声明
│   ├── hooks.server.ts             # 服务端 hooks（handle / handleFetch / handleError）
│   └── hooks.client.ts             # 客户端 hooks
├── static/                          # 不经 bundler 的静态资源
├── svelte.config.js                # SvelteKit 配置（adapter / preprocess / alias）
├── vite.config.ts                  # Vite 配置
├── tsconfig.json                   # TS 配置（extends .svelte-kit/tsconfig.json）
└── package.json
```

**`+` 文件名约定**（SvelteKit）：

- `+page.svelte` —— 页面组件
- `+page.ts` —— 页面的 universal load function（SSR + CSR 都跑）
- `+page.server.ts` —— **仅服务端** load function（含 form actions）
- `+layout.svelte` —— 布局（嵌套包裹子页面）
- `+layout.ts` / `+layout.server.ts` —— 布局的 load function
- `+server.ts` —— API 路由（导出 `GET` / `POST` / `PUT` / `DELETE` 函数）
- `+error.svelte` —— 错误页面（捕获子树错误）
- `+page@.svelte` —— 重置布局继承（脱离父 layout）

### Vite + Svelte 默认结构

```
my-app/
├── public/                          # 不经 bundler 的静态资源
│   └── vite.svg
├── src/
│   ├── assets/                      # 经 bundler 的资源
│   ├── lib/
│   │   └── Counter.svelte           # 可复用组件
│   ├── App.svelte                   # 根组件
│   ├── main.ts                      # 入口（mount + target）
│   ├── app.css
│   └── vite-env.d.ts                # Vite 类型声明
├── index.html                       # SPA HTML 入口
├── svelte.config.js                 # Svelte 配置（preprocess）
├── vite.config.ts                   # Vite 配置
└── tsconfig.json
```

## `.svelte` 文件三段式

每个 Svelte 组件就是一个 `.svelte` 文件，由三段组成：

```svelte
<!-- src/lib/Counter.svelte -->
<script lang="ts">
  // 1. <script>：组件逻辑
  let count = $state(0)
  const increment = () => count++
</script>

<!-- 2. 模板：组件 HTML 结构 -->
<button onclick={increment}>
  Clicks: {count}
</button>

<style>
  /* 3. <style>：组件样式（默认 scoped 到当前组件） */
  button {
    padding: 8px 16px;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
  }
</style>
```

**三段式的特性**：

- `<script lang="ts">` —— TypeScript 支持（推荐）；不写 `lang="ts"` 默认是 JavaScript
- **模板部分**：写在 `<script>` 与 `<style>` 之间，可以混合 HTML 标签和 Svelte 特殊语法（`{...}` / `{#if}` / `bind:` 等）
- `<style>` —— 默认 **scoped**（Svelte 编译时给每个选择器加唯一 hash），不需要 CSS Modules / scoped 关键字

::: tip 三段都不是必需的
最简单的 `.svelte` 文件可以只有模板，甚至全空：

```svelte
<!-- 仅模板 -->
<h1>Hello, Svelte!</h1>
```

或者只有 `<script>`（纯逻辑模块，没有渲染）。Svelte 5 还可以用 `.svelte.ts` / `.svelte.js` 写「带 Runes 的纯逻辑模块」。
:::

## 第一个组件

最经典的 Counter 例子，对照 Svelte 4 与 Svelte 5 写法：

```svelte
<!-- Svelte 5 - Runes（推荐） -->
<script lang="ts">
  let count = $state(0)

  function increment() {
    count++
  }

  function reset() {
    count = 0
  }
</script>

<div class="counter">
  <p>Count: {count}</p>
  <button onclick={increment}>+1</button>
  <button onclick={reset}>Reset</button>
</div>

<style>
  .counter {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  p {
    font-size: 20px;
  }
</style>
```

对比 Svelte 4 写法：

```svelte
<!-- Svelte 4 - 隐式响应式（旧） -->
<script lang="ts">
  let count = 0    // ← 没有 $state，纯 let 也能响应（编译器静态分析）

  function increment() {
    count += 1
  }
</script>

<button on:click={increment}>      <!-- ← on:click 不是 onclick -->
  Clicks: {count}
</button>
```

**Svelte 5 与 Svelte 4 关键差异**：

| 维度 | Svelte 4 | Svelte 5 |
|---|---|---|
| 响应式状态 | `let count = 0`（编译器隐式） | `let count = $state(0)`（显式 Rune） |
| 派生值 | `$: doubled = count * 2` | `let doubled = $derived(count * 2)` |
| 副作用 | `$: console.log(count)` | `$effect(() => console.log(count))` |
| Props 声明 | `export let name: string` | `let { name }: { name: string } = $props()` |
| 事件 | `on:click={fn}` | `onclick={fn}` |
| 子组件事件 | `createEventDispatcher` + `on:event` | callback props（直接当 props 传函数） |
| 插槽 | `<slot />` / `<slot name="header" />` | `{@render children?.()}` + `{#snippet}` |

## Runes 入门（Svelte 5 核心）

Runes 是 Svelte 5 引入的响应式原语——前缀 `$` 标记的特殊「函数」（实际是编译器识别的语法）。

### `$state` —— 响应式状态

```svelte
<script lang="ts">
  // 基本用法
  let count = $state(0)

  // 对象 / 数组：深响应式（Proxy 包装）
  let user = $state({ name: 'Alice', age: 30 })
  let todos = $state<Todo[]>([])

  function increment() {
    count++              // 直接赋值即可（不需要 setCount）
  }

  function updateName(name: string) {
    user.name = name     // 深响应式，直接改属性
  }

  function addTodo(text: string) {
    todos.push({ id: crypto.randomUUID(), text, done: false })  // 数组方法也响应
  }
</script>

<p>{count}, {user.name}, {todos.length} todos</p>
<button onclick={increment}>+1</button>
```

**`$state` 三要点**：

1. **直接读写**——`count` 就是值（不是 `count.value` / `count()`），赋值即更新
2. **深响应式**——对象 / 数组用 Proxy 自动包装，深层属性、数组方法都响应
3. **解构会断**——`let { name } = user` 只是普通变量，不再响应（与 Vue 的 `ref` 解构同坑）

### `$state.raw` —— 浅响应式（不 Proxy）

不需要深层追踪的大对象、外部库实例用 `$state.raw`：

```svelte
<script lang="ts">
  // 整体替换才触发更新，属性修改无效
  let person = $state.raw({ name: 'Heraclitus', age: 49 })

  person.age = 50           // ❌ 无效
  person = { ...person, age: 50 }  // ✅ 整体替换才更新
</script>
```

### `$state.snapshot` —— 取出快照

把 Proxy 拆开成普通对象（传给第三方库 / 序列化时用）：

```svelte
<script lang="ts">
  let user = $state({ name: 'Alice', age: 30 })

  function save() {
    const plain = $state.snapshot(user)
    localStorage.setItem('user', JSON.stringify(plain))
    // 直接 JSON.stringify(user) 会得到 Proxy 字符串（依赖 toJSON）
    // 用 snapshot 显式取出干净对象
  }
</script>
```

### `$derived` —— 派生值

```svelte
<script lang="ts">
  let count = $state(0)

  // 表达式版（最常用）
  let doubled = $derived(count * 2)

  // 函数版（多语句逻辑）
  let summary = $derived.by(() => {
    let sum = 0
    for (let i = 1; i <= count; i++) sum += i
    return `1 + 2 + ... + ${count} = ${sum}`
  })
</script>

<p>{count} doubled = {doubled}</p>
<p>{summary}</p>
<button onclick={() => count++}>+1</button>
```

**`$derived` vs `$state`**：

- `$state(0)` —— 可读可写的源状态
- `$derived(expr)` —— 根据其他 `$state` 自动计算，只读（除非显式赋值做乐观更新）

### `$effect` —— 副作用

```svelte
<script lang="ts">
  let count = $state(0)

  // 副作用：count 变化时打印、写 localStorage
  $effect(() => {
    console.log('count is', count)
    localStorage.setItem('count', String(count))

    // 返回 cleanup 函数（组件卸载或重跑前执行）
    return () => {
      console.log('cleanup before next run')
    }
  })
</script>
```

**`$effect` 五要点**：

1. **自动追踪依赖**——`$effect` 内访问的 `$state` 会自动被追踪（不需要依赖数组，与 Vue `watchEffect` 同思路）
2. **mount 时跑一次**——之后依赖变化重跑
3. **返回 cleanup**——下次重跑前或组件卸载时执行
4. **不要用 effect 派生状态**——派生用 `$derived`；effect 留给真正的副作用（DOM 操作、订阅、analytics）
5. **`untrack(fn)`** 可读值但不追踪——避免循环依赖

### `$props` —— 组件输入

```svelte
<!-- UserCard.svelte -->
<script lang="ts">
  interface Props {
    name: string
    age?: number
    onSelect?: (id: string) => void
    children?: import('svelte').Snippet
  }

  // 解构 + 默认值 + 类型
  let { name, age = 18, onSelect, children }: Props = $props()
</script>

<div class="card" onclick={() => onSelect?.(name)}>
  <h2>{name}</h2>
  <p>Age: {age}</p>
  {@render children?.()}
</div>
```

使用：

```svelte
<UserCard name="Alice" age={30} onSelect={(id) => console.log(id)}>
  <button>Edit</button>
</UserCard>
```

### `$bindable` —— 父子双向绑定

子组件想让 `bind:` 把变化推回父，必须显式声明：

```svelte
<!-- Input.svelte -->
<script lang="ts">
  let { value = $bindable('') }: { value?: string } = $props()
</script>

<input bind:value />

<!-- 父组件 -->
<script lang="ts">
  let text = $state('')
</script>

<Input bind:value={text} />
<p>You typed: {text}</p>
```

## 模板语法基础

### 表达式插值

```svelte
<script lang="ts">
  let name = $state('Svelte')
  let count = $state(5)
  const html = '<strong>Bold</strong>'
</script>

<!-- 普通插值（自动转义） -->
<p>Hello, {name}!</p>
<p>{count * 2}</p>
<p>{count > 3 ? 'many' : 'few'}</p>

<!-- 属性 -->
<a href={`/users/${name}`}>Profile</a>
<input value={name} disabled={count === 0} />

<!-- 短属性（变量名与属性名同名） -->
<input {value} {disabled} />

<!-- 类（动态） -->
<div class={count > 3 ? 'big' : 'small'}>Item</div>
<div class:active={count > 3}>With class directive</div>

<!-- 原始 HTML（注意 XSS） -->
<p>{@html html}</p>
```

### `{#if}` 条件渲染

```svelte
{#if count > 10}
  <p>Big number</p>
{:else if count > 5}
  <p>Medium number</p>
{:else}
  <p>Small number</p>
{/if}
```

### `{#each}` 列表渲染

```svelte
<script lang="ts">
  let todos = $state([
    { id: 1, text: 'Learn Svelte', done: false },
    { id: 2, text: 'Build app', done: false }
  ])
</script>

<ul>
  {#each todos as todo (todo.id)}
    <li class:done={todo.done}>
      <input type="checkbox" bind:checked={todo.done} />
      {todo.text}
    </li>
  {:else}
    <li>No todos</li>
  {/each}
</ul>

<!-- 带 index -->
{#each todos as todo, i (todo.id)}
  <li>{i + 1}. {todo.text}</li>
{/each}
```

**`{#each}` 三要点**：

1. **`(todo.id)` 是 key**——告诉 Svelte 用什么标识来 diff 列表（与 React `key` 同思路）；省略 key 用 index 兜底，复用错节点
2. **`{:else}`** 是空列表分支（仅 `{#each}` 块支持）
3. **解构**——`{#each items as { id, text } (id)}` 直接展开

### `{#await}` 异步

```svelte
<script lang="ts">
  let promise = $state(loadUser())

  async function loadUser() {
    const res = await fetch('/api/me')
    if (!res.ok) throw new Error('Failed')
    return await res.json()
  }
</script>

{#await promise}
  <p>Loading...</p>
{:then user}
  <p>Hello, {user.name}!</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

### `{#key}` 强制重建

```svelte
<!-- key 变化时，子树销毁重建（强制 Counter 重新挂载） -->
{#key resetVersion}
  <Counter />
{/key}
```

### `{#snippet}` + `{@render}`（Svelte 5）

替代 Svelte 4 的 `<slot>`：

```svelte
<!-- Card.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  let { header, children }: { header?: Snippet; children: Snippet } = $props()
</script>

<div class="card">
  {#if header}
    <header>{@render header()}</header>
  {/if}
  <div class="body">{@render children()}</div>
</div>

<!-- 使用 -->
<Card>
  {#snippet header()}
    <h2>Title</h2>
  {/snippet}

  <p>Card body</p>     <!-- 隐式 children -->
</Card>
```

## 事件（Svelte 5 函数式）

Svelte 5 把事件从「指令 `on:click`」改为「**属性 `onclick`**」，对齐原生 HTML：

```svelte
<script lang="ts">
  let count = $state(0)

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    count++
  }
</script>

<!-- 现代写法（v5） -->
<button onclick={handleClick}>+1</button>
<button onclick={() => count++}>+1 (inline)</button>

<!-- 修饰符已废弃（v4 的 |preventDefault），改用函数 -->
<form onsubmit={(e) => { e.preventDefault(); save() }}>...</form>
```

对比 Svelte 4 写法：

```svelte
<!-- Svelte 4（已废弃） -->
<button on:click={handleClick}>+1</button>
<form on:submit|preventDefault={save}>...</form>
```

::: tip 修饰符消失了
Svelte 4 的 `|preventDefault` / `|stopPropagation` / `|self` / `|once` 修饰符在 Svelte 5 全部移除——直接在函数里写 `e.preventDefault()` 即可。`once` 用 `{ once: true }` 选项：

```svelte
<button onclick={() => alert('first')} onclickcapture={...}>...</button>
<!-- 配 EventListener options 需要用 use: action 或元素属性 -->
```
:::

## 父子组件通信

### 父 → 子：Props

```svelte
<!-- Greeting.svelte -->
<script lang="ts">
  let { name, age = 18 }: { name: string; age?: number } = $props()
</script>

<p>Hello, {name}! You are {age}.</p>

<!-- 使用 -->
<Greeting name="Alice" age={30} />
```

### 子 → 父：Callback Props（v5 新方式）

Svelte 5 没有了 `createEventDispatcher` —— 直接传函数当 prop：

```svelte
<!-- Search.svelte -->
<script lang="ts">
  let { onSearch }: { onSearch: (query: string) => void } = $props()
  let query = $state('')
</script>

<input bind:value={query} />
<button onclick={() => onSearch(query)}>Go</button>

<!-- 父组件 -->
<Search onSearch={(q) => console.log('Searching for', q)} />
```

### 双向：`bind:` + `$bindable`

```svelte
<!-- NumberInput.svelte -->
<script lang="ts">
  let { value = $bindable(0) }: { value?: number } = $props()
</script>

<input type="number" bind:value />

<!-- 父组件 -->
<script lang="ts">
  let n = $state(0)
</script>

<NumberInput bind:value={n} />
<p>{n}</p>
```

## 引入 SvelteKit 的最小示例

`+page.svelte`（首页）：

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
</script>

<h1>{data.title}</h1>
<ul>
  {#each data.users as user (user.id)}
    <li>{user.name}</li>
  {/each}
</ul>
```

`+page.ts`（load function，universal）：

```ts
// src/routes/+page.ts
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/users')
  const users = await res.json()
  return {
    title: 'User List',
    users
  }
}
```

`+server.ts`（API endpoint）：

```ts
// src/routes/api/users/+server.ts
import { json } from '@sveltejs/kit'

export const GET = () => {
  return json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
}
```

`+layout.svelte`（根布局）：

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  let { children } = $props()
</script>

<header>
  <a href="/">Home</a>
  <a href="/about">About</a>
</header>

<main>
  {@render children()}
</main>

<style>
  header { display: flex; gap: 16px; padding: 16px; }
  main { padding: 16px; }
</style>
```

详细 SvelteKit 内容见 `advanced.md`。

## 开发者工具

### Svelte DevTools

[Svelte DevTools](https://chromewebstore.google.com/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn) 是 Chrome / Firefox 扩展（社区维护）：

- **Components 面板**：查看 Svelte 组件树、props、state、context
- **`$inspect` 集成**：在代码里 `$inspect(value)` 在 DevTools Console 看响应式变化

::: warning Svelte DevTools 仍在补齐 Svelte 5 支持
Svelte 5 的 Runes 模型与 Svelte 4 完全不同，DevTools 扩展正在重写以更好地展示 signal 依赖图；目前仍在改进中。日常调试更推荐用 `$inspect` 与 `$inspect.trace()`。
:::

### `$inspect` —— 内置响应式调试

```svelte
<script lang="ts">
  let count = $state(0)
  let user = $state({ name: 'Alice' })

  // 每次 count 变化，Console 打印
  $inspect(count)

  // 多个值
  $inspect(count, user)

  // 自定义回调
  $inspect(count).with((type, value) => {
    if (type === 'update') console.log('count updated to', value)
  })
</script>
```

### `$inspect.trace()` —— 追踪「为什么重新执行」

放在 `$effect` 或 `$derived` 内部，打印是哪个状态变化触发了重跑：

```svelte
<script lang="ts">
  let a = $state(0)
  let b = $state(0)

  let sum = $derived.by(() => {
    $inspect.trace('sum-derived')  // 在 Console 看到触发原因
    return a + b
  })
</script>
```

::: tip $inspect 在生产构建中被剥离
`$inspect` 是开发期专属——`vite build` 会把它编译成 no-op，不会进 bundle。可以放心地散布在代码里。
:::

### 浏览器扩展之外

| 工具 | 用途 |
|---|---|
| [Svelte Society DevTools](https://github.com/sveltejs/svelte-devtools)（重构中） | 组件树 / Signal 依赖图 |
| [vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect) | 检查 Vite 编译产物（含 Svelte 输出） |
| `svelte-check` | 类型检查 CLI（VS Code 插件 `Svelte for VS Code` 自动集成） |

## 学习路径建议

1. **第 1 周**：`.svelte` 三段式 → `$state` / `$derived` / `$effect` → `{#if}` / `{#each}` → 受控表单（这一篇够了）
2. **第 2 周**：`$props` / `$bindable` → Snippets → Stores → Context API → 生命周期（看 `base.md`）
3. **第 3 周**：自定义 Actions → Transitions / Animations → SvelteKit 路由 / Load function（看 `advanced.md` 前半）
4. **第 4 周**：Form Actions → Server-only modules → Hooks → adapter 部署（看 `advanced.md` 后半）
5. **持续提升**：编译器内部 → Signal 反应式系统 → SSR / Hydration → 性能优化（看 `expert.md`）

下一章 `base.md` 详细讲所有 Runes 用法、模板控制流、样式与生命周期。
