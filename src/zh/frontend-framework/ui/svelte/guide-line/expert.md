---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 基于 Svelte 5.x / SvelteKit 2.x 编写 —— 编译器内部 / Runes 反应式系统 / SSR + Hydration / Svelte 4→5 迁移 / 性能优化 / SvelteKit 高级 / 跨端 / 库开发 / 微前端 / Web Components

## 速查

- **编译器**：模板解析 → AST → 静态分析 → 代码生成（JS + CSS），重编译时 / 极薄运行时
- **Runes 反应式**：基于 signals（与 Solid / Preact Signals 同思路），细粒度 / 推-拉混合 / 引用相等优化
- **SSR**：SvelteKit `render` → 序列化 → 客户端 `hydrate`；Hydration mismatch 同 React / Vue 类似坑
- **迁移**：`npx sv migrate svelte-5` 自动转换 v4 → v5；事件 / props / slots 三大块需重写
- **性能**：编译期已极优；列表用 virtualization；`$state.raw` 避免 Proxy 开销；`<svelte:options immutable>` 避免无效 diff
- **SvelteKit 高级**：streaming SSR、Server-only modules（`$lib/server`）、`+server.ts` 端点、`hooks.server.ts`、type-safe forms
- **跨端**：Tauri + Svelte（推荐）/ Electron + Svelte / Svelte Native（已沉寂）
- **Web Components**：`<svelte:options customElement="my-el" />` 编译成原生 Custom Element
- **库开发**：`package.json exports` + `svelte` 字段 / `svelte-package` CLI / 类型自动生成

## 编译器内部

### 编译流程

Svelte 编译器是「**模板 → JavaScript**」的转译器，输入 `.svelte` 文件，输出可执行 JS：

```
.svelte 文件
  ↓
[Parser] 把 <script> / template / <style> 三段分离
  ↓
[模板 AST]  +  [Script AST（acorn）]  +  [CSS AST（postcss）]
  ↓
[Analyzer] 静态分析（变量声明、reactive deps、scope）
  ↓
[Transformer] AST 重写（$state → 响应式 getter，{#if} → 命令式 if）
  ↓
[Generator] 输出 JS（component class / function） + CSS
```

### 模板编译示例

源代码：

```svelte
<script>
  let count = $state(0)
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

简化后的编译输出（Svelte 5 内部表示）：

```js
import * as $ from 'svelte/internal/client'

function App($$anchor, $$props) {
  // 1. 创建响应式 source
  let count = $.state(0)

  // 2. 创建模板（一次性，使用浏览器原生 template element 性能极优）
  const template = $.template(`<button> </button>`)

  // 3. 实例化 DOM 节点
  const button = template()
  const text = button.firstChild

  // 4. 绑定事件
  button.addEventListener('click', () => { $.set(count, $.get(count) + 1) })

  // 5. 设置响应式文本（只在 count 变化时更新）
  $.template_effect(() => {
    $.set_text(text, `Clicks: ${$.get(count)}`)
  })

  // 6. 挂载
  $.append($$anchor, button)
}
```

**对比 React 编译**：

| 步骤 | Svelte | React |
|---|---|---|
| 模板 → 操作 | **编译时** 转成命令式 DOM 操作 | **运行时** 跑 JSX → vnode → diff |
| Diff | **无** | Fiber Reconciler |
| 状态变化 | **直接更新对应 DOM** | 触发组件函数重跑 → reconcile |
| Bundle | 仅含本组件的 DOM 操作 | 含 React 运行时（react-dom ~45 KB） |

### 静态分析：CSS Pruning

Svelte 编译器分析模板用了哪些类 / 选择器，把 `<style>` 中**未使用的规则警告**：

```svelte
<div class="used">Hello</div>

<style>
  .used { color: red; }
  .unused { color: blue; }   /* ⚠️ Svelte 编译器警告：未使用 */
</style>
```

输出 CSS 只保留 `.used`，bundle 更小。

### Tree-Shaking 友好

Svelte 编译产物是普通的 ES Modules，Vite / Rollup 可以正确 tree-shake：

```ts
// 仅用 fade，slide / fly 等不进 bundle
import { fade } from 'svelte/transition'
```

Vue 单文件组件需要 `unplugin-vue` 包装，React 没有这层；Svelte 编译后是「就是 ES Module」，工具链友好度极高。

### Preprocessors

Svelte 支持 preprocess 把其他语法（TS / SCSS / PostCSS）转成它能识别的形式：

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess({
    // 自动支持 <script lang="ts"> / <style lang="scss">
  })
}
```

**自定义 preprocessor**：

```ts
import type { PreprocessorGroup } from 'svelte/compiler'

const myPreprocess: PreprocessorGroup = {
  name: 'my-preprocess',
  markup({ content, filename }) {
    return { code: content.replace(/<!--.*?-->/g, '') }
  },
  script({ content, attributes, filename }) {
    if (attributes.lang !== 'ts') return
    // 调用 TS 编译...
    return { code: transformed }
  },
  style({ content, attributes, filename }) {
    if (attributes.lang !== 'scss') return
    // 调用 SCSS...
  }
}
```

## Runes 反应式系统内部

### Signals 是什么

Svelte 5 把 Svelte 4 时代的「编译器分析变量声明 + 隐式响应」改为「**显式 signals**」。每个 `$state(x)` 在内部是一个 Signal：

```ts
// 简化的内部表示
interface Signal<T> {
  value: T
  consumers: Set<Computation>     // 谁依赖了我
}

interface Computation {
  fn: () => void
  deps: Set<Signal<any>>           // 我依赖了谁
}
```

### 依赖追踪

`$effect` / `$derived` 内部读取 `$state` 时，自动建立依赖关系：

```svelte
<script lang="ts">
  let count = $state(0)         // Signal { value: 0, consumers: [] }
  let doubled = $derived(count * 2)  // Computation { fn: ..., deps: [count] }

  $effect(() => {               // Computation { fn: ..., deps: [doubled] }
    console.log(doubled)
  })
</script>
```

依赖图：

```
   count (signal)
     ↓ (consumer)
   doubled (derived)
     ↓ (consumer)
   effect
```

### 推-拉混合（Push-Pull）

```ts
// count 改变（push）
count = 1   // → 通知 consumers（doubled / effect）：「我变了」
            //   但不立即重算 doubled（懒）

// effect 触发（push 通知）→ 读 doubled（pull）→ doubled 此时计算 (1 * 2) = 2
console.log(doubled)
```

**对比**：

- **纯 Push**（如 RxJS、传统 Observable）：每次 push 立即沿依赖图全部更新
- **纯 Pull**（如 React 的 render）：每次都重跑组件，diff 找变化
- **Push-Pull**（Svelte 5 / Solid / Vue Composition）：push 标记 dirty，pull 时才重算

### 引用相等优化

`$derived` 如果重算结果与上次相同，下游跳过更新：

```svelte
<script lang="ts">
  let items = $state<Item[]>([{ id: 1, done: false }])

  // 即使 items 变化，如果 hasAny 结果不变，下游 effect 不重跑
  let hasAny = $derived(items.length > 0)

  $effect(() => {
    console.log(hasAny)
  })

  function addItem() {
    items.push({ id: 2, done: false })
    // hasAny 仍是 true，effect 不重跑
  }
</script>
```

### 细粒度更新（fine-grained）

与 React / Vue 不同，Svelte 5 状态变化**不会重跑组件函数**，只更新依赖该状态的 DOM 节点：

```svelte
<script lang="ts">
  let count = $state(0)
  let name = $state('Alice')

  console.log('Component setup')  // 只在挂载时打印一次
</script>

<p>{count}</p>      <!-- count 变化时仅更新这个文本节点 -->
<p>{name}</p>       <!-- name 变化时仅更新这个文本节点 -->
<button onclick={() => count++}>+1</button>
```

**对比 React**：

```tsx
function Counter() {
  console.log('Component runs')   // 每次 state 变化都打印

  const [count, setCount] = useState(0)
  const [name, setName] = useState('Alice')

  return <>
    <p>{count}</p>
    <p>{name}</p>
    <button onClick={() => setCount(count + 1)}>+1</button>
  </>
}
```

React 19 + Compiler 后会自动 memo，差距缩小；但「组件函数仅跑一次」仍是 Svelte 5 / Solid 的独特优势。

### Effect 调度

`$effect` 默认在 **microtask** 调度，多个状态变化批处理：

```svelte
<script lang="ts">
  let a = $state(0)
  let b = $state(0)

  $effect(() => {
    console.log('effect:', a, b)
  })

  function update() {
    a = 1
    b = 1
    // effect 只跑一次（batched），不是两次
  }
</script>
```

强制同步执行用 `flushSync`：

```ts
import { flushSync } from 'svelte'

a = 1
flushSync()    // 立即执行所有待处理 effects
```

## SSR + Hydration

### SvelteKit SSR 流程

```
1. HTTP 请求到达 SvelteKit 服务器
   ↓
2. SvelteKit Router 匹配路由
   ↓
3. 执行 +layout.server.ts / +page.server.ts 的 load (服务端独占)
   ↓
4. 执行 +layout.ts / +page.ts 的 load (universal)
   ↓
5. 渲染组件树 → HTML 字符串（含序列化的 data）
   ↓
6. 浏览器收到 HTML：立刻显示（First Paint）
   ↓
7. 加载 JS bundle
   ↓
8. Hydrate：把 HTML 节点接管为可交互组件
   ↓
9. 之后所有导航走客户端路由（SPA 模式）
```

### Hydration 是什么

Hydration = 「**让静态 HTML 变得可交互**」：

- 服务端生成 `<button>Click</button>` HTML 字符串
- 客户端 JS 不重新创建 DOM，而是 attach 事件监听 + 初始化响应式状态
- 用户看到的 DOM 不闪烁（与「客户端 JS 全部重渲染一次」相比）

### Hydration Mismatch

服务端渲染结果与客户端预期不一致时报错：

```svelte
<script lang="ts">
  // ❌ Date.now() 服务端和客户端不同
  const now = Date.now()
</script>

<p>{now}</p>
```

**修复**：

```svelte
<script lang="ts">
  import { onMount } from 'svelte'

  let now = $state(0)
  onMount(() => {
    now = Date.now()  // 仅客户端
  })
</script>

<p>{now}</p>
```

或使用 SvelteKit 的 `browser` 标志：

```ts
import { browser } from '$app/environment'

const now = browser ? Date.now() : 0
```

### 渲染模式

SvelteKit 每个页面可以独立选择渲染模式：

```ts
// +page.server.ts 或 +page.ts
export const ssr = true       // 服务端渲染（默认）
export const csr = true       // 客户端 Hydration（默认）
export const prerender = false // 构建时预渲染（默认 'auto'）
```

**四种组合**：

| ssr | csr | prerender | 类型 |
|---|---|---|---|
| true | true | false | 默认 SSR + CSR（推荐） |
| true | true | true | **SSG**（构建时预渲染） |
| true | false | false | **纯 SSR**（无客户端 JS） |
| false | true | false | **SPA**（仅客户端渲染） |

### Streaming SSR

SvelteKit 支持 streaming —— load function 中**不 await 的 promise** 会以 stream 形式发回：

```ts
// +page.server.ts
export const load = async ({ fetch }) => {
  return {
    user: await fetch('/api/me').then(r => r.json()),  // 等
    posts: fetch('/api/posts').then(r => r.json())    // ← 不 await，stream
  }
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  let { data } = $props()
</script>

<h1>Welcome, {data.user.name}!</h1>

{#await data.posts}
  <p>Loading posts...</p>
{:then posts}
  <ul>{#each posts as p (p.id)}<li>{p.title}</li>{/each}</ul>
{/await}
```

用户体验：

1. 立刻看到 `<h1>Welcome, Alice!</h1>` + "Loading posts..."
2. posts 数据准备好后，stream 进来，自动替换占位

### 部分 Hydration（实验）

Svelte 一直在探索「**Islands Architecture**」（类似 Astro / Marko）—— 仅 hydrate 真正需要交互的「岛屿」，其他保持纯 HTML。截至 Svelte 5，官方还没正式发布 Islands 模式，但 `+page.ts` 的 `csr=false` 配置已经能做到「仅服务端渲染、零客户端 JS」。

## Svelte 4 → 5 迁移

### 自动迁移工具

官方提供 `sv migrate svelte-5` 命令：

```bash
# 全自动转换（推荐先 commit 干净再跑）
pnpm dlx sv migrate svelte-5

# 转换的范围：
# - on:click → onclick
# - $: → $state / $derived / $effect
# - export let → $props()
# - createEventDispatcher → callback props
# - $$slots / $$props → 现代写法
```

工具不能 100% 自动迁移，需要手动检查：

- 复杂 `$:` 块（依赖多状态、含 side-effect）
- 自定义 stores（API 可能与 v5 习惯不同）
- 测试代码（mount/unmount API 变化）

### 关键变化清单

#### 1. 事件：`on:click` → `onclick`

```svelte
<!-- v4 -->
<button on:click={handleClick}>Click</button>
<form on:submit|preventDefault={save}>...</form>

<!-- v5 -->
<button onclick={handleClick}>Click</button>
<form onsubmit={(e) => { e.preventDefault(); save() }}>...</form>
```

#### 2. 响应式：`let` → `$state`

```svelte
<!-- v4 -->
<script>
  let count = 0
  $: doubled = count * 2
  $: console.log(count)
</script>

<!-- v5 -->
<script>
  let count = $state(0)
  let doubled = $derived(count * 2)
  $effect(() => console.log(count))
</script>
```

#### 3. Props：`export let` → `$props()`

```svelte
<!-- v4 -->
<script lang="ts">
  export let name: string
  export let age: number = 18
  export let onSelect: (id: string) => void
</script>

<!-- v5 -->
<script lang="ts">
  interface Props {
    name: string
    age?: number
    onSelect?: (id: string) => void
  }
  let { name, age = 18, onSelect }: Props = $props()
</script>
```

#### 4. 子→父事件：`createEventDispatcher` → callback props

```svelte
<!-- v4 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher<{ select: { id: string } }>()

  function handleClick(id: string) {
    dispatch('select', { id })
  }
</script>
<button on:click={() => handleClick('1')}>Pick</button>

<!-- 父 v4 -->
<Child on:select={(e) => console.log(e.detail.id)} />

<!-- v5 -->
<script lang="ts">
  let { onSelect }: { onSelect: (id: string) => void } = $props()
</script>
<button onclick={() => onSelect('1')}>Pick</button>

<!-- 父 v5 -->
<Child onSelect={(id) => console.log(id)} />
```

#### 5. 插槽：`<slot>` → `{#snippet}` + `{@render}`

```svelte
<!-- v4 Card.svelte -->
<div class="card">
  <slot name="header" />
  <slot />
</div>

<!-- v4 使用 -->
<Card>
  <h2 slot="header">Title</h2>
  <p>Body</p>
</Card>

<!-- v5 Card.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  let { header, children }: { header?: Snippet; children: Snippet } = $props()
</script>
<div class="card">
  {#if header}{@render header()}{/if}
  {@render children()}
</div>

<!-- v5 使用 -->
<Card>
  {#snippet header()}<h2>Title</h2>{/snippet}
  <p>Body</p>      <!-- 隐式 children -->
</Card>
```

#### 6. 组件实例：`new Comp()` → `mount(Comp)`

```ts
// v4
import App from './App.svelte'
const app = new App({ target: document.getElementById('app'), props: { ... } })
app.$set({ count: 5 })
app.$destroy()

// v5
import { mount, unmount } from 'svelte'
import App from './App.svelte'
const app = mount(App, { target: document.getElementById('app')!, props: { ... } })
// app 没有 $set / $destroy 了
unmount(app)
```

#### 7. Module Script

```svelte
<!-- v4 -->
<script context="module" lang="ts">
  export const constants = [...]
</script>

<!-- v5 -->
<script module lang="ts">
  export const constants = [...]
</script>
```

#### 8. `beforeUpdate` / `afterUpdate` deprecated

```svelte
<!-- v4 -->
<script>
  import { beforeUpdate, afterUpdate } from 'svelte'
  beforeUpdate(() => console.log('before'))
  afterUpdate(() => console.log('after'))
</script>

<!-- v5 -->
<script>
  $effect.pre(() => {
    // 依赖某个 state 才会触发
    someState
    console.log('before DOM update')
  })

  $effect(() => {
    someState
    console.log('after DOM update')
  })
</script>
```

### 渐进迁移策略

不能一次全改时（大项目），Svelte 5 支持新旧混用：

```js
// svelte.config.js
export default {
  compilerOptions: {
    runes: false  // 默认沿用 v4 风格
  }
}
```

单文件启用 Runes：

```svelte
<svelte:options runes />

<script>
  let count = $state(0)  // 启用了 Runes
</script>
```

或全局启用，单文件回退（不推荐）。

## 性能优化

### 默认已极优

Svelte 编译产物已经是「**最小化的命令式 DOM 操作**」，多数场景不需要手动优化。

### `$state.raw` 避免 Proxy 开销

大对象 / 不需要深响应的数据：

```svelte
<script lang="ts">
  // ❌ Proxy 每次属性访问都有开销
  let bigData = $state({
    items: Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  })

  // ✅ 整体替换更新
  let bigData = $state.raw({
    items: Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  })

  function update() {
    bigData = { ...bigData, items: bigData.items.map(transform) }
  }
</script>
```

### 列表虚拟化

大列表（>500 行）用 [svelte-virtual](https://github.com/jsalama-dev/svelte-virtual) / [@tanstack/svelte-virtual](https://tanstack.com/virtual/latest)：

```svelte
<script lang="ts">
  import { createVirtualizer } from '@tanstack/svelte-virtual'

  let parentRef: HTMLDivElement
  let items = $state(Array.from({ length: 10000 }, (_, i) => `Item ${i}`))

  const virtualizer = $derived(
    createVirtualizer<HTMLDivElement>({
      count: items.length,
      getScrollElement: () => parentRef,
      estimateSize: () => 40
    })
  )
</script>

<div bind:this={parentRef} class="container" style:height="500px" style:overflow="auto">
  <div style:height={`${virtualizer.getTotalSize()}px`} style:position="relative">
    {#each virtualizer.getVirtualItems() as v (v.key)}
      <div
        style:position="absolute"
        style:top={`${v.start}px`}
        style:height="40px"
        style:width="100%"
      >
        {items[v.index]}
      </div>
    {/each}
  </div>
</div>
```

### Immutable 优化

```svelte
<svelte:options immutable />

<script lang="ts">
  // 仅在 props 引用变化时更新（不深比较）
  let { user }: { user: User } = $props()
</script>
```

适合：父级频繁更新但子组件 props 引用稳定的场景。

### 代码分割

SvelteKit 自动按路由分割。手动 lazy 加载组件：

```svelte
<script lang="ts">
  let Modal = $state<typeof import('./Modal.svelte').default | null>(null)
  let open = $state(false)

  async function openModal() {
    if (!Modal) {
      const m = await import('./Modal.svelte')
      Modal = m.default
    }
    open = true
  }
</script>

<button onclick={openModal}>Open Modal</button>
{#if Modal && open}
  <Modal onclose={() => open = false} />
{/if}
```

### Preload

SvelteKit hover 时预取链接的 data + 模块：

```svelte
<a href="/about" data-sveltekit-preload-data>About</a>
<a href="/about" data-sveltekit-preload-data="hover">About (hover preload)</a>
<a href="/about" data-sveltekit-preload-data="tap">About (mousedown preload)</a>

<!-- 仅预取代码，不预取 data -->
<a href="/about" data-sveltekit-preload-code>About</a>
```

### 编译选项

```js
// svelte.config.js
export default {
  compilerOptions: {
    css: 'injected',        // 'external' 拆 CSS 文件 / 'injected' 注入到 JS（默认）
    immutable: false,        // 全局 immutable
    hydratable: true,        // 输出 hydration 标记
    enableSourcemap: false   // 生产关闭 sourcemap
  }
}
```

## SvelteKit 高级

### Server-only Modules

`$lib/server/**` 路径下的模块**永远不会进客户端 bundle**：

```ts
// src/lib/server/db.ts
import { PrismaClient } from '@prisma/client'
import { DATABASE_URL } from '$env/static/private'

export const db = new PrismaClient({ datasourceUrl: DATABASE_URL })
```

```ts
// 在 client 文件 import 会 build error
import { db } from '$lib/server/db'  // ❌ Cannot import server-only module
```

### Hooks 完整 API

```ts
// src/hooks.server.ts
import type { Handle, HandleFetch, HandleServerError, Reroute } from '@sveltejs/kit'

// 1. handle: 每个请求都跑
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await authenticate(event.cookies)
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang ?? 'en')
  })
}

// 2. handleFetch: 服务端 fetch 拦截
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (request.url.startsWith('https://api.internal.com')) {
    request.headers.set('cookie', event.request.headers.get('cookie') ?? '')
  }
  return fetch(request)
}

// 3. handleError: 错误处理
export const handleError: HandleServerError = ({ error, event, status, message }) => {
  console.error(error)
  return {
    message: 'Internal error',
    errorId: crypto.randomUUID()
  }
}

// 4. reroute: 修改路由（不改 URL）
export const reroute: Reroute = ({ url }) => {
  if (url.pathname === '/old-path') return '/new-path'
}
```

```ts
// src/hooks.client.ts
import type { HandleClientError } from '@sveltejs/kit'

export const handleError: HandleClientError = ({ error, event }) => {
  console.error('Client error:', error)
  return { message: 'Something went wrong' }
}
```

### Type-safe Forms

SvelteKit 配合 [Superforms](https://superforms.rocks/) + Zod 实现端到端类型安全：

```bash
pnpm add -D sveltekit-superforms zod
```

```ts
// +page.server.ts
import { superValidate } from 'sveltekit-superforms/server'
import { zod } from 'sveltekit-superforms/adapters'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const load = async () => {
  const form = await superValidate(zod(schema))
  return { form }
}

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod(schema))
    if (!form.valid) return { form }

    // form.data 已验证 + 类型安全
    await login(form.data.email, form.data.password)
    return { form }
  }
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  let { data } = $props()
  const { form, errors, enhance } = superForm(data.form)
</script>

<form method="POST" use:enhance>
  <input bind:value={$form.email} />
  {#if $errors.email}<p class="error">{$errors.email}</p>{/if}

  <input type="password" bind:value={$form.password} />
  {#if $errors.password}<p class="error">{$errors.password}</p>{/if}

  <button type="submit">Login</button>
</form>
```

### Cookies 与 Sessions

```ts
// +page.server.ts
export const load = async ({ cookies, locals }) => {
  const token = cookies.get('session')
  return { user: locals.user }
}

export const actions = {
  login: async ({ cookies, request }) => {
    const data = await request.formData()
    const token = await signIn(data)

    cookies.set('session', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    throw redirect(302, '/dashboard')
  },

  logout: async ({ cookies }) => {
    cookies.delete('session', { path: '/' })
    throw redirect(302, '/login')
  }
}
```

### Streaming Responses

```ts
// src/routes/api/chat/+server.ts
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const { prompt } = await request.json()

  // 流式响应（Server-Sent Events）
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of llm.streamCompletion(prompt)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### Edge / Cloudflare 部署

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare'

export default {
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    })
  }
}
```

```ts
// 访问 Cloudflare 平台 API
// +page.server.ts
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ platform }) => {
  // KV 存储
  const value = await platform!.env.MY_KV.get('key')

  // D1 数据库
  const result = await platform!.env.DB.prepare('SELECT * FROM users LIMIT 10').all()

  // R2 Object Storage
  const obj = await platform!.env.MY_BUCKET.get('file.txt')

  return { value, users: result.results }
}
```

```ts
// src/app.d.ts
declare global {
  namespace App {
    interface Platform {
      env: {
        MY_KV: KVNamespace
        DB: D1Database
        MY_BUCKET: R2Bucket
      }
      cf: CfProperties
      ctx: ExecutionContext
    }
  }
}
```

## 跨端方案

### Tauri + Svelte（推荐）

Tauri 是 Rust 内核的桌面应用框架，比 Electron bundle 小 10-100 倍：

```bash
# 创建 Tauri + SvelteKit 项目
pnpm create tauri-app
# 选 SvelteKit 模板

cd my-tauri-app
pnpm install
pnpm tauri dev
```

```
my-tauri-app/
├── src/                      # SvelteKit 前端
│   └── routes/+page.svelte
├── src-tauri/                # Rust 后端
│   ├── src/main.rs
│   ├── tauri.conf.json       # Tauri 配置
│   └── Cargo.toml
└── package.json
```

```rust
// src-tauri/src/main.rs
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error");
}
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core'

  let name = $state('')
  let result = $state('')

  async function greet() {
    result = await invoke('greet', { name })
  }
</script>

<input bind:value={name} />
<button onclick={greet}>Greet</button>
<p>{result}</p>
```

### Electron + Svelte

```bash
# 用 electron-vite + Svelte 模板
pnpm create @quick-start/electron my-electron-app --template=svelte-ts
```

适合需要完整 Node.js 集成的场景；bundle 较大（~150 MB）。

### Capacitor（移动 H5 壳）

```bash
pnpm add @capacitor/core @capacitor/cli
pnpm dlx cap init
pnpm dlx cap add ios
pnpm dlx cap add android

# 编译 SvelteKit 为静态站点
pnpm build
pnpm dlx cap sync
pnpm dlx cap open ios
```

适合：已有 SvelteKit 网站想包成 App。性能不如原生但开发成本低。

### Svelte Native（社区，已沉寂）

[Svelte Native](https://svelte-native.technology/) 基于 NativeScript，编译到 iOS / Android 原生 UI。截至 2025 社区更新缓慢，**不推荐新项目使用**——优先考虑 Tauri / Capacitor。

## Web Components 输出

Svelte 可以编译组件为原生 Custom Element：

```svelte
<!-- MyButton.svelte -->
<svelte:options customElement="my-button" />

<script lang="ts">
  let { label = 'Click', variant = 'primary' }: { label?: string; variant?: string } = $props()
</script>

<button class={variant}>{label}</button>

<style>
  .primary { background: blue; color: white; }
  .danger { background: red; color: white; }
</style>
```

```js
// 引入后即可在任意 HTML 中使用
import './MyButton.svelte'

// HTML
<my-button label="Save" variant="primary"></my-button>
```

**编译配置**：

```js
// svelte.config.js
export default {
  compilerOptions: {
    customElement: true
  }
}
```

**用途**：

- 给非 Svelte 项目（React / Vue / 原生）输出组件
- 微前端中作为框架无关的「壳」
- 设计系统跨技术栈复用

## 微前端集成

### Module Federation（Vite）

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    sveltekit(),
    federation({
      name: 'svelte-app',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/lib/Button.svelte'
      },
      shared: ['svelte']
    })
  ]
})
```

### 通过 Web Components 集成

最实用：把 Svelte 组件编译为 Web Component，host 用 React / Vue 都能直接引用：

```jsx
// React 中使用 Svelte Web Component
import 'svelte-app/dist/MyButton'

function App() {
  return <my-button label="Hi" onclick={() => console.log('clicked')} />
}
```

### 路由级集成（single-spa）

```ts
import { mount, unmount } from 'svelte'
import App from './App.svelte'

let app: Record<string, any>

export const bootstrap = async () => {}

export const mount = async (props: any) => {
  app = mount(App, { target: props.container, props })
}

export const unmount = async () => {
  unmount(app)
}
```

## 库开发

### 项目结构

```
my-svelte-lib/
├── src/
│   └── lib/
│       ├── Button.svelte
│       ├── Modal.svelte
│       └── index.ts            # 导出入口
├── package.json
├── svelte.config.js
└── tsconfig.json
```

### `package.json` 配置

```json
{
  "name": "my-svelte-lib",
  "version": "1.0.0",
  "scripts": {
    "package": "svelte-package",
    "prepublishOnly": "pnpm package"
  },
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@sveltejs/package": "^2.3.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

### 用 `svelte-package` 打包

```bash
pnpm add -D @sveltejs/package
pnpm svelte-package
```

输出：

```
dist/
├── Button.svelte           # 保留 .svelte 源（host 工具链编译）
├── Modal.svelte
├── index.js
└── index.d.ts
```

::: tip 不编译 Svelte 文件
Svelte 包通常**不预编译** `.svelte` 文件 —— 让宿主项目的编译器（含 host 项目的编译选项 / preprocessor）处理。这与一般 JS 库不同。
:::

### `index.ts` 入口

```ts
// src/lib/index.ts
export { default as Button } from './Button.svelte'
export { default as Modal } from './Modal.svelte'

export type { ButtonProps } from './Button.svelte'
```

### 发布

```bash
pnpm publish --access public
```

## 服务器 GraphQL 客户端

```bash
pnpm add @urql/svelte graphql
```

```ts
// src/lib/urql.ts
import { Client, fetchExchange, cacheExchange } from '@urql/svelte'
import { browser } from '$app/environment'

export function createClient(fetch: typeof globalThis.fetch) {
  return new Client({
    url: '/api/graphql',
    fetch,
    exchanges: [cacheExchange, fetchExchange]
  })
}
```

```svelte
<script lang="ts">
  import { queryStore, gql, setContextClient } from '@urql/svelte'
  import { createClient } from '$lib/urql'

  setContextClient(createClient(fetch))

  const users = queryStore({
    query: gql`
      query Users {
        users { id name }
      }
    `
  })
</script>

{#if $users.fetching}
  <p>Loading...</p>
{:else if $users.error}
  <p>Error: {$users.error.message}</p>
{:else}
  <ul>
    {#each $users.data.users as user (user.id)}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

或用 Apollo Client、GraphQL Code Generator + 自定义 fetch 也都常见。

## 测试深入

### 测试 Svelte 5 Runes

Runes 必须在 `.svelte.ts` / `.svelte.test.ts` 文件内才能用：

```ts
// counter.svelte.ts
class Counter {
  count = $state(0)

  get doubled() {
    return this.count * 2
  }

  increment() {
    this.count++
  }
}

export const counter = new Counter()
```

```ts
// counter.svelte.test.ts
import { describe, it, expect } from 'vitest'
import { flushSync } from 'svelte'
import { counter } from './counter.svelte'

describe('Counter', () => {
  it('increments', () => {
    const cleanup = $effect.root(() => {
      counter.increment()
      flushSync()
      expect(counter.count).toBe(1)
      expect(counter.doubled).toBe(2)
    })
    cleanup()
  })
})
```

### `@testing-library/svelte` 高级

```ts
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import LoginForm from './LoginForm.svelte'

describe('LoginForm', () => {
  it('submits with valid input', async () => {
    const onSubmit = vi.fn()
    render(LoginForm, { props: { onSubmit } })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('shows error when password is short', async () => {
    render(LoginForm)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Password'), '123')
    await user.tab()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })
})
```

### Playwright Component Testing

```ts
// playwright-ct.config.ts
import { defineConfig } from '@playwright/experimental-ct-svelte'

export default defineConfig({
  testDir: './tests/components'
})
```

```ts
// tests/components/Button.spec.ts
import { test, expect } from '@playwright/experimental-ct-svelte'
import Button from '../../src/lib/Button.svelte'

test('renders label', async ({ mount }) => {
  const component = await mount(Button, { props: { label: 'Click' } })
  await expect(component).toContainText('Click')
})

test('fires onclick', async ({ mount }) => {
  let clicked = false
  const component = await mount(Button, {
    props: {
      label: 'Click',
      onclick: () => { clicked = true }
    }
  })
  await component.click()
  expect(clicked).toBe(true)
})
```

## 编译器 API 自用

可以编程式调用 Svelte 编译器（写自定义工具时）：

```ts
import { compile, parse, preprocess } from 'svelte/compiler'

const source = `
<script>
  let count = $state(0)
</script>
<button onclick={() => count++}>{count}</button>
`

// 1. parse 拿 AST
const ast = parse(source)
console.log(ast.html, ast.css, ast.instance)

// 2. preprocess 转 lang="ts" / lang="scss"
const processed = await preprocess(source, [/* preprocessor list */], { filename: 'App.svelte' })

// 3. compile 生成 JS
const result = compile(processed.code, {
  filename: 'App.svelte',
  generate: 'client',   // 或 'server'
  dev: false
})

console.log(result.js.code)    // 编译后的 JS
console.log(result.css?.code)  // 提取的 CSS
console.log(result.warnings)
```

应用场景：

- 写 IDE 插件
- 自定义 bundler 集成
- AST 静态分析工具（safelist 收集、i18n 提取）

## 小结

- **编译器**是 Svelte 的核心引擎，把模板转成命令式 DOM 操作，没有运行时 diff
- **Runes 反应式**基于 signals，推-拉混合、引用相等优化、细粒度更新
- **SSR + Hydration** 全在 SvelteKit 内统一处理；streaming 优化 TTFB
- **Svelte 4→5 迁移** 用 `sv migrate svelte-5` 自动转换，关键改动事件 / props / slots / module script
- **性能** 默认极优；大列表用虚拟化；`$state.raw` 避免 Proxy 开销
- **SvelteKit 高级** Server-only modules、Hooks 全链路、Streaming Response、Edge 部署
- **跨端** Tauri 推荐；Electron 备用；Capacitor 包 H5；Svelte Native 已沉寂
- **Web Components 输出** 用 `<svelte:options customElement>`
- **库开发** 用 `svelte-package`，通常**不预编译** `.svelte` 源，让宿主编译

下一章 `other.md` 整理周边工具、UI 库、i18n、Storybook 等生态。
