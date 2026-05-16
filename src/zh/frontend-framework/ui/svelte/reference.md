---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Svelte 5.x / SvelteKit 2.x 编写 —— Runes / 模板控制流 / 特殊组件 / Stores / 生命周期 / 过渡 / Actions / TypeScript 工具类型 / SvelteKit / 版本里程碑

## Runes 完整表

| Rune | 签名 | 用途 |
|---|---|---|
| `$state<T>(initial)` | `T => T`（编译后是 getter / setter） | 声明响应式状态（深响应式 Proxy） |
| `$state.raw<T>(initial)` | `T => T` | 浅响应式（不 Proxy 包装，整体替换才更新） |
| `$state.snapshot<T>(value)` | `T => T` | 取出 Proxy 的纯 JS 快照（用于 JSON / 第三方库） |
| `$derived<T>(expression)` | 表达式 → `T` | 派生值（表达式版） |
| `$derived.by<T>(fn)` | `() => T` => `T` | 派生值（函数版，多语句逻辑） |
| `$effect(fn)` | `() => void \| (() => void)` | 副作用（DOM 更新后跑） |
| `$effect.pre(fn)` | `() => void \| (() => void)` | 副作用（DOM 更新前跑） |
| `$effect.tracking()` | `() => boolean` | 判断是否在响应式追踪上下文 |
| `$effect.root(fn)` | `() => () => void` | 创建独立 effect 作用域（手动 cleanup） |
| `$props<T>()` | `() => T` | 接收组件 props（解构 + 默认值） |
| `$bindable<T>(default?)` | `T? => T` | 标记 prop 可双向绑定 |
| `$inspect(...values)` | `(...any[]) => { with(callback) }` | 开发期响应式日志（生产剥离） |
| `$inspect.trace(label?)` | `(label?: string) => void` | 追踪 effect / derived 的触发原因 |
| `$host()` | `() => HTMLElement` | 自定义元素的宿主 DOM 节点（仅 customElement 模式） |

### 详细签名

```ts
// $state
let count = $state<number>(0)
let user = $state<User>({ id: '1', name: 'A' })

// $state.raw
let map = $state.raw<Map<string, number>>(new Map())

// $state.snapshot
const plain = $state.snapshot(user)   // { id: '1', name: 'A' } 普通对象（不是 Proxy）

// $derived
let doubled = $derived(count * 2)

// $derived.by
let summary = $derived.by((): string => {
  let s = ''
  for (const item of items) s += item.name + ', '
  return s
})

// $effect
$effect(() => {
  const timer = setInterval(...)
  return () => clearInterval(timer)
})

// $effect.pre
$effect.pre(() => {
  // 在 DOM 更新前测量
  measureScroll()
})

// $effect.root
const cleanup = $effect.root(() => {
  $effect(() => { ... })
  return () => console.log('Cleaning up')
})
cleanup()

// $props（推荐 + Props 接口）
interface Props {
  label: string
  count?: number
  onclick?: (e: MouseEvent) => void
}
let { label, count = 0, onclick }: Props = $props()

// $bindable
let { open = $bindable(false) } = $props()

// $inspect
$inspect(count)
$inspect(count, user).with((type, value) => {
  // type: 'init' | 'update'
})

// $inspect.trace
$effect(() => {
  $inspect.trace('myEffect')
  // 触发时打印是哪个 state 变化导致
})

// $host
function dispatchCustomEvent() {
  $host().dispatchEvent(new CustomEvent('greet'))
}
```

## 模板控制流

| 块 | 语法 | 用途 |
|---|---|---|
| `{#if}` | `{#if cond} ... {:else if c} ... {:else} ... {/if}` | 条件渲染 |
| `{#each}` | `{#each items as item, i (key)} ... {:else} ... {/each}` | 列表渲染 |
| `{#await}` | `{#await promise} ... {:then v} ... {:catch e} ... {/await}` | 异步 |
| `{#key}` | `{#key value} ... {/key}` | 强制重建子树 |
| `{#snippet}` | `{#snippet name(params)} ... {/snippet}` | 定义可复用片段（替代 v4 slot） |

### 详细语法

```svelte
<!-- {#if} -->
{#if user}
  <p>Hello, {user.name}!</p>
{:else if loading}
  <p>Loading</p>
{:else}
  <p>Not logged in</p>
{/if}

<!-- {#each} -->
{#each items as item, i (item.id)}
  <li>{i + 1}. {item.name}</li>
{:else}
  <p>Empty</p>
{/each}

<!-- 解构 -->
{#each users as { id, name } (id)}
  <span>{name}</span>
{/each}

<!-- {#await} -->
{#await promise}
  <p>Loading</p>
{:then result}
  <p>{result}</p>
{:catch error}
  <p>{error.message}</p>
{/await}

<!-- 仅 then -->
{#await promise then result}
  <p>{result}</p>
{/await}

<!-- {#key} -->
{#key reload}
  <ChildComponent />
{/key}

<!-- {#snippet} -->
{#snippet greeting(name)}
  <p>Hello, {name}!</p>
{/snippet}

{@render greeting('Alice')}
```

## 模板标签

| 标签 | 语法 | 用途 |
|---|---|---|
| `{@html}` | `{@html htmlString}` | 渲染原始 HTML（XSS 风险） |
| `{@const}` | `{@const x = expr}` | 模板内常量（仅在控制流块内） |
| `{@render}` | `{@render snippet(args)}` | 调用 snippet 函数 |
| `{@debug}` | `{@debug vars}` | 开发期断点（变量变化时暂停） |

```svelte
<!-- {@html} -->
<div>{@html '<strong>Bold</strong>'}</div>

<!-- {@const} -->
{#each users as user (user.id)}
  {@const isAdmin = user.role === 'admin'}
  <li class:admin={isAdmin}>{user.name}</li>
{/each}

<!-- {@render} -->
{@render mySnippet(arg1, arg2)}

<!-- {@debug} -->
{@debug user, items}   <!-- DevTools 在 user / items 变化时暂停 -->
```

## 特殊元素

| 元素 | 用途 |
|---|---|
| `<svelte:component>` | 动态组件（Svelte 5 可省略） |
| `<svelte:element>` | 动态元素标签 |
| `<svelte:window>` | 监听 window 事件 / 绑定 window 属性 |
| `<svelte:document>` | 监听 document 事件 |
| `<svelte:body>` | 监听 body 事件 |
| `<svelte:head>` | 注入到 `<head>`（title / meta / link） |
| `<svelte:options>` | 编译选项（customElement / immutable / accessors） |
| `<svelte:boundary>` | 错误边界（v5.3+） |
| `<svelte:fragment>` | v4 命名 slot 用，v5 deprecated（用 snippet） |

### 详细用法

```svelte
<!-- <svelte:component> v4 写法 -->
<svelte:component this={CurrentComponent} {...props} />

<!-- v5 等价（直接当组件用） -->
{@const Comp = currentTab === 'a' ? TabA : TabB}
<Comp {...props} />

<!-- <svelte:element> -->
<svelte:element this={tagName} {...attrs}>
  Content
</svelte:element>

<!-- <svelte:window> -->
<svelte:window
  bind:innerWidth={width}
  bind:scrollY={scrollY}
  onresize={handleResize}
  onkeydown={handleKey}
  ononline={() => online = true}
  onoffline={() => online = false}
/>

<!-- <svelte:document> -->
<svelte:document
  onvisibilitychange={...}
  onselectionchange={...}
/>

<!-- <svelte:body> -->
<svelte:body
  onclick={handleBodyClick}
/>

<!-- <svelte:head> -->
<svelte:head>
  <title>Page Title</title>
  <meta name="description" content="..." />
  <link rel="canonical" href="..." />
</svelte:head>

<!-- <svelte:options> -->
<svelte:options
  customElement="my-button"
  immutable={true}
  accessors={false}
  runes={true}
/>

<!-- <svelte:boundary> v5.3+ -->
<svelte:boundary onerror={(error) => console.error(error)}>
  <RiskyComponent />

  {#snippet failed(error, reset)}
    <p>Error: {error.message}</p>
    <button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```

## `<svelte:window>` / `<svelte:document>` 可绑定属性

```svelte
<svelte:window
  bind:innerWidth
  bind:innerHeight
  bind:outerWidth
  bind:outerHeight
  bind:scrollX
  bind:scrollY
  bind:online
  bind:devicePixelRatio
/>

<svelte:document
  bind:fullscreenElement
  bind:visibilityState
/>
```

## Stores API（`svelte/store`）

| API | 签名 | 用途 |
|---|---|---|
| `writable<T>(initial?, start?)` | `T?, StartStopNotifier? => Writable<T>` | 可读可写 store |
| `readable<T>(initial?, start?)` | `T?, StartStopNotifier? => Readable<T>` | 仅读 store |
| `derived<T>(stores, fn, initial?)` | 多个 store + 派生函数 | 派生 store |
| `get<T>(store)` | `Readable<T> => T` | 一次性取值（不订阅） |
| `readonly<T>(store)` | `Writable<T> => Readable<T>` | 只读包装 |

### `Writable<T>` 接口

```ts
interface Writable<T> {
  subscribe(run: (value: T) => void, invalidate?: () => void): () => void
  set(value: T): void
  update(updater: (value: T) => T): void
}
```

### `Readable<T>` 接口

```ts
interface Readable<T> {
  subscribe(run: (value: T) => void, invalidate?: () => void): () => void
}
```

### 使用示例

```ts
import { writable, readable, derived, get } from 'svelte/store'

// writable
const count = writable(0)
count.set(5)
count.update(n => n + 1)

// readable（带 start / stop）
const time = readable(new Date(), (set) => {
  const timer = setInterval(() => set(new Date()), 1000)
  return () => clearInterval(timer)
})

// derived（单 store）
const doubled = derived(count, $count => $count * 2)

// derived（多 store）
const summary = derived([count, doubled], ([$c, $d]) => `${$c}, ${$d}`)

// derived（异步）
const userInfo = derived(userId, ($id, set) => {
  fetch(`/api/users/${$id}`)
    .then(r => r.json())
    .then(set)
}, null)

// get（不订阅）
console.log(get(count))
```

```svelte
<script>
  import { count } from './stores'
</script>

<!-- $ 自动订阅 -->
<p>{$count}</p>
<button onclick={() => $count++}>+1</button>
<!-- 等价于 count.set($count + 1) -->
```

## 生命周期 API

| API | 签名 | 用途 |
|---|---|---|
| `onMount(fn)` | `() => void \| (() => void) \| Promise<void>` | 挂载后跑（仅客户端） |
| `onDestroy(fn)` | `() => void` | 卸载前跑（SSR 也跑） |
| `tick()` | `() => Promise<void>` | 等待下一次 DOM 更新 |
| `untrack<T>(fn)` | `(() => T) => T` | 读值但不追踪（在 effect / derived 内用） |
| `flushSync()` | `() => void` | 强制同步执行所有 pending effects |
| `mount(Comp, opts)` | `(Comp, MountOptions) => Record<string, any>` | 程式化挂载组件（v4 `new Comp()` 替代） |
| `unmount(instance)` | `(instance) => void` | 卸载 |
| `hydrate(Comp, opts)` | 同 mount | SSR hydrate |
| `createEventDispatcher()` | v4 兼容；v5 用 callback props |
| `beforeUpdate(fn)` | deprecated → `$effect.pre` |
| `afterUpdate(fn)` | deprecated → `$effect` |

```ts
import { onMount, onDestroy, tick, untrack, flushSync, mount, unmount } from 'svelte'

onMount(async () => {
  // 仅客户端
  console.log('Mounted')
  const data = await fetch('/api/data').then(r => r.json())
  // 返回 cleanup
  return () => console.log('Will unmount')
})

onDestroy(() => {
  console.log('Destroying')
})

// tick
async function clickAndMeasure() {
  count++
  await tick()  // DOM 更新后
  const el = document.querySelector('p')
  console.log(el?.textContent)
}

// untrack
$effect(() => {
  console.log(a)         // 追踪 a
  console.log(untrack(() => b))  // 读 b 不追踪
})

// flushSync
flushSync()   // 立即跑完所有 pending effects

// mount（替代 v4 `new App()`）
const app = mount(App, {
  target: document.getElementById('root')!,
  props: { initial: 5 }
})

unmount(app)
```

## 过渡 / 动画 API（`svelte/transition` + `svelte/animate`）

### `svelte/transition`

| 函数 | 参数 | 用途 |
|---|---|---|
| `fade` | `{ delay?, duration?, easing? }` | 透明度变化 |
| `fly` | `{ delay?, duration?, easing?, x?, y?, opacity? }` | 飞入飞出（位移） |
| `slide` | `{ delay?, duration?, easing?, axis?: 'x' \| 'y' }` | 滑入滑出（高度 / 宽度） |
| `scale` | `{ delay?, duration?, easing?, start?, opacity? }` | 缩放 |
| `blur` | `{ delay?, duration?, easing?, amount?, opacity? }` | 模糊 |
| `draw` | `{ delay?, duration?, easing?, speed? }` | SVG path 描边 |
| `crossfade` | `{ delay?, duration?, easing?, fallback? }` | 跨容器过渡（返回 `[send, receive]`） |

```svelte
<script>
  import { fade, fly, slide, scale, blur, draw, crossfade } from 'svelte/transition'

  const [send, receive] = crossfade({ duration: 400 })
</script>

<div transition:fade={{ duration: 300 }}>Fade</div>
<div transition:fly={{ y: 50, duration: 400, opacity: 0 }}>Fly</div>
<div transition:slide={{ axis: 'y' }}>Slide</div>
<div transition:scale={{ start: 0.5, opacity: 0.5 }}>Scale</div>
<div transition:blur={{ amount: 10 }}>Blur</div>

<svg>
  <path d="M0 0 L100 100" transition:draw={{ duration: 1000 }} />
</svg>

<!-- crossfade -->
{#each items as item (item.id)}
  <li in:receive={{ key: item.id }} out:send={{ key: item.id }}>{item.text}</li>
{/each}
```

### `svelte/animate`

| 函数 | 参数 | 用途 |
|---|---|---|
| `flip` | `{ delay?, duration?, easing? }` | First-Last-Invert-Play 列表项重排动画 |

```svelte
<script>
  import { flip } from 'svelte/animate'
</script>

{#each items as item (item.id)}
  <li animate:flip={{ duration: 300 }}>{item.text}</li>
{/each}
```

### `svelte/easing` 缓动函数

| 类别 | 函数 |
|---|---|
| 线性 | `linear` |
| Back | `backIn` / `backOut` / `backInOut` |
| Bounce | `bounceIn` / `bounceOut` / `bounceInOut` |
| Circ | `circIn` / `circOut` / `circInOut` |
| Cubic | `cubicIn` / `cubicOut` / `cubicInOut` |
| Elastic | `elasticIn` / `elasticOut` / `elasticInOut` |
| Expo | `expoIn` / `expoOut` / `expoInOut` |
| Quad | `quadIn` / `quadOut` / `quadInOut` |
| Quart | `quartIn` / `quartOut` / `quartInOut` |
| Quint | `quintIn` / `quintOut` / `quintInOut` |
| Sine | `sineIn` / `sineOut` / `sineInOut` |

```svelte
<script>
  import { fly } from 'svelte/transition'
  import { cubicOut, elasticOut, bounceOut } from 'svelte/easing'
</script>

<div transition:fly={{ y: 50, duration: 600, easing: bounceOut }}>Bounce</div>
```

### `svelte/motion` 物理动画

| 函数 | 用途 |
|---|---|
| `tweened(value, opts?)` | 渐变 store（线性 / easing 插值） |
| `spring(value, opts?)` | 弹性 store（物理参数） |

```svelte
<script>
  import { tweened, spring } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'

  const progress = tweened(0, { duration: 400, easing: cubicOut })
  const x = spring(0, { stiffness: 0.1, damping: 0.4 })

  progress.set(100)
  x.set(200)
</script>

<div style:width={`${$progress}%`}>Progress</div>
<div style:transform={`translateX(${$x}px)`}>Spring</div>
```

## Actions API（`svelte/action`）

| 类型 | 签名 | 用途 |
|---|---|---|
| `Action<E, P>` | `(node: E, params: P) => ActionReturn<P>` | 自定义指令 |
| `ActionReturn<P>` | `{ update?: (p: P) => void; destroy?: () => void }` | Action 返回值 |

```ts
import type { Action } from 'svelte/action'

interface TooltipParams {
  text: string
}

export const tooltip: Action<HTMLElement, TooltipParams> = (node, { text }) => {
  const el = document.createElement('div')
  el.textContent = text
  // ... show/hide logic

  return {
    update({ text }) {
      el.textContent = text
    },
    destroy() {
      el.remove()
    }
  }
}
```

```svelte
<button use:tooltip={{ text: 'Click me' }}>Hover</button>
```

## TypeScript 工具类型

```ts
import type {
  Snippet,         // Snippet 类型（替代 v4 SlotsType）
  Component,        // 组件类型
  ComponentProps,   // 取 Component 的 props 类型
  ComponentEvents,  // 取 Component 的 events 类型（v4，v5 用 callback props）
  Action,           // use: action 类型
  ActionReturn,
  EventDispatcher   // v4 兼容
} from 'svelte'

// Snippet
let { row }: { row: Snippet<[User]> } = $props()
// row 是接受 User 参数的 snippet

// Snippet without params
let { children }: { children: Snippet } = $props()

// Snippet with multiple params
let { cell }: { cell: Snippet<[User, number]> } = $props()

// Component<Props>
import Button from './Button.svelte'

type ButtonComponent = Component<{ label: string; variant?: 'primary' | 'danger' }>
let MyButton: ButtonComponent = Button

// ComponentProps（取 props 类型）
type ButtonProps = ComponentProps<typeof Button>
// { label: string; variant?: ... }
```

## SvelteKit 主要 API

### `+page.ts` / `+page.server.ts`

```ts
import type { PageLoad, PageServerLoad, Actions } from './$types'

// load
export const load: PageLoad = async ({ params, url, fetch, parent, depends }) => {
  depends('app:users')  // 打标签
  return {
    users: await fetch('/api/users').then(r => r.json())
  }
}

// server-only load
export const load: PageServerLoad = async ({ params, locals, cookies, request }) => {
  return { user: locals.user }
}

// actions
export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData()
    // ...
  },
  named: async ({ request }) => { /* ... */ }
}

// 渲染选项
export const ssr = true
export const csr = true
export const prerender = false
export const trailingSlash = 'never'
```

### `+server.ts`（API endpoint）

```ts
import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, params, fetch, locals }) => {
  return json({ ... })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401)
  const body = await request.json()
  return json({ created: body }, { status: 201 })
}

export const PUT: RequestHandler = async ({ request, params }) => { /* ... */ }
export const DELETE: RequestHandler = async ({ params, locals }) => { /* ... */ }
export const PATCH: RequestHandler = async ({ request, params }) => { /* ... */ }
```

### `hooks.server.ts`

```ts
import type { Handle, HandleFetch, HandleServerError, Reroute } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

export const handle: Handle = async ({ event, resolve }) => {
  // 中间件
  event.locals.user = await authenticate(event)
  return resolve(event, {
    transformPageChunk: ({ html, done }) => html.replace('%lang%', 'en'),
    filterSerializedResponseHeaders: (name) => name === 'content-type',
    preload: ({ type, path }) => type === 'js' && path.includes('/important')
  })
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  return fetch(request)
}

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  return { message: 'Internal error' }
}

export const reroute: Reroute = ({ url }) => {
  if (url.pathname === '/old') return '/new'
}
```

### `$app/*` 模块

| 模块 | 用途 |
|---|---|
| `$app/environment` | `browser` / `dev` / `building` / `version` |
| `$app/forms` | `enhance` / `applyAction` / `deserialize` |
| `$app/navigation` | `goto` / `invalidate` / `invalidateAll` / `preloadData` / `preloadCode` / `beforeNavigate` / `afterNavigate` / `onNavigate` / `pushState` / `replaceState` |
| `$app/paths` | `base` / `assets` / `resolveRoute` |
| `$app/server` | `read` / `getRequestEvent`（在 layout / page server 之外） |
| `$app/state` | `page` / `navigating` / `updated`（Runes 版本，无 `$` 前缀） |
| `$app/stores` | `page` / `navigating` / `updated`（Stores 版本，需 `$page`） |

```ts
import { browser, dev, building, version } from '$app/environment'
import { enhance, applyAction } from '$app/forms'
import { goto, invalidate, invalidateAll, preloadData } from '$app/navigation'
import { base, assets } from '$app/paths'
import { page, navigating, updated } from '$app/state'   // v2.7+
```

### `$env/*` 模块

| 模块 | 类型 | 客户端可见 | 用法 |
|---|---|---|---|
| `$env/static/private` | 静态 | ❌ | `import { SECRET } from '$env/static/private'` |
| `$env/static/public` | 静态 | ✅（前缀 `PUBLIC_`） | `import { PUBLIC_URL } from '$env/static/public'` |
| `$env/dynamic/private` | 动态 | ❌ | `import { env } from '$env/dynamic/private'; env.SECRET` |
| `$env/dynamic/public` | 动态 | ✅（前缀 `PUBLIC_`） | `import { env } from '$env/dynamic/public'` |

### `$lib` 别名

```ts
// 默认指向 src/lib/
import Button from '$lib/components/Button.svelte'
import { utils } from '$lib/utils'
```

### `$lib/server` —— 仅服务端

```ts
// src/lib/server/db.ts —— 永远不会进客户端 bundle
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()
```

## 编译选项（`svelte.config.js`）

```ts
import type { Config } from '@sveltejs/kit'

const config: Config = {
  preprocess: [...],
  compilerOptions: {
    runes: true,                  // 启用 Runes（v5 默认）
    css: 'injected',              // 'injected' | 'external'
    customElement: false,
    immutable: false,
    accessors: false,
    discloseVersion: true,
    enableSourcemap: true,
    cssHash: ({ hash, css, name, filename }) => `svelte-${hash(css)}`
  },
  kit: {
    adapter: adapter(),
    alias: { '$components': './src/lib/components' },
    csp: { mode: 'auto', directives: { 'script-src': ['self'] } },
    csrf: { checkOrigin: true },
    inlineStyleThreshold: 0,
    moduleExtensions: ['.js', '.ts'],
    output: { preloadStrategy: 'modulepreload' },
    paths: { assets: '', base: '' },
    prerender: { concurrency: 1, crawl: true, entries: ['*'] },
    serviceWorker: { register: true, files: () => true },
    typescript: { config: () => {} },
    version: { name: '1.0.0', pollInterval: 0 }
  }
}
```

## 错误处理

### `error()` —— 抛出错误

```ts
import { error } from '@sveltejs/kit'

export const load = async ({ params }) => {
  const user = await db.user.findUnique({ where: { id: params.id } })
  if (!user) throw error(404, 'User not found')
  if (user.private) throw error(403, { message: 'Forbidden', code: 'PRIVATE_USER' })
  return { user }
}
```

### `redirect()` —— 重定向

```ts
import { redirect } from '@sveltejs/kit'

export const actions = {
  default: async ({ cookies }) => {
    // ...
    throw redirect(302, '/dashboard')
  }
}
```

### `fail()` —— 表单失败

```ts
import { fail } from '@sveltejs/kit'

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    const email = data.get('email')
    if (!email) return fail(400, { email, error: 'Email required' })
    // ...
  }
}
```

### `+error.svelte` —— 错误边界

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state'
</script>

<h1>{page.status}: {page.error?.message}</h1>
```

## Custom Element 选项

```svelte
<svelte:options
  customElement={{
    tag: 'my-button',
    shadow: 'open',                    // 'open' | 'none'
    props: {
      label: { type: 'String' },
      count: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', attribute: 'is-disabled' }
    },
    extend: (customElementConstructor) => {
      return class extends customElementConstructor {
        constructor() { super() }
        connectedCallback() { /* ... */ }
      }
    }
  }}
/>
```

## `bind:` 完整列表

### 元素属性

| 元素 | 可绑定属性 |
|---|---|
| `<input>` | `value` / `checked` / `group` / `files` / `indeterminate` |
| `<textarea>` | `value` |
| `<select>` | `value` |
| `<details>` | `open` |
| `<dialog>` | `open` |
| `<video>` / `<audio>` | `currentTime` / `duration` / `paused` / `volume` / `muted` / `playbackRate` / `seeking` / `ended` / `played` / `buffered` / `seekable` / `readyState` |
| `<img>` | `naturalWidth` / `naturalHeight` |
| 任何元素 | `this`（DOM 引用） / `clientWidth` / `clientHeight` / `offsetWidth` / `offsetHeight` / `contentRect` / `contentBoxSize` / `borderBoxSize` / `devicePixelContentBoxSize` |

```svelte
<input bind:value={text} />
<input type="checkbox" bind:checked={agreed} />
<input type="radio" bind:group={selected} value="a" />
<input type="file" bind:files />

<video bind:currentTime bind:duration bind:paused />

<div bind:clientWidth bind:clientHeight bind:this={el}></div>
```

### 组件 props

```svelte
<MyInput bind:value={text} />
<!-- 子组件须用 $bindable() -->
```

## Class / Style 指令

```svelte
<!-- class:name -->
<div class:active class:disabled={isDisabled}>...</div>

<!-- class:object（v5 实验性） -->
<div class={['btn', { active, disabled }, size]}>...</div>

<!-- style:property -->
<div style:color="red" style:font-size={`${size}px`}>...</div>
```

## 版本里程碑

| 版本 | 时间 | 主要变化 |
|---|---|---|
| **Svelte 1** | 2016.11 | Rich Harris 首个开源版本，模板编译为 vanilla JS |
| **Svelte 2** | 2018.4 | 简化语法，移除 magical class bindings |
| **Svelte 3** | 2019.4 | 重大重写，引入 `$:` reactive statements、stores |
| **Svelte 4** | 2023.6 | TypeScript 重写，移除 IE 支持，性能提升 |
| **Svelte 5** | 2024.10 | **Runes** 系统（`$state` / `$derived` / `$effect` / `$props` / `$bindable` / `$inspect`），事件 `onclick` 化，Snippets 替代 slots，编译器重写 |
| **SvelteKit 1** | 2022.12 | 替代 Sapper，基于 Vite，文件路由 + load + actions |
| **SvelteKit 2** | 2023.12 | 简化 API（throw error/redirect），更严格类型 |

## Svelte 5 完整核心包

- `svelte` —— 核心库
  - `svelte` —— `onMount` / `onDestroy` / `tick` / `untrack` / `mount` / `unmount` / `hydrate` / `flushSync` / `getContext` / `setContext` / `hasContext` / `getAllContexts`
  - `svelte/store` —— `writable` / `readable` / `derived` / `get` / `readonly`
  - `svelte/transition` —— `fade` / `fly` / `slide` / `scale` / `blur` / `draw` / `crossfade`
  - `svelte/animate` —— `flip`
  - `svelte/easing` —— `linear` / `cubicOut` / `bounceOut` etc.
  - `svelte/motion` —— `tweened` / `spring`
  - `svelte/action` —— `Action` / `ActionReturn` 类型
  - `svelte/compiler` —— 编译器 API（compile / parse / preprocess）
  - `svelte/elements` —— HTML 元素类型
  - `svelte/events` —— 事件助手（实验性）
  - `svelte/server` —— `render` 函数（SSR）
  - `svelte/legacy` —— v4 兼容 API（`createBubbler` / `run` / `createClassComponent`）

- `@sveltejs/kit` —— SvelteKit
- `@sveltejs/vite-plugin-svelte` —— Vite 集成
- `@sveltejs/adapter-*` —— 部署 adapter
- `@sveltejs/package` —— 包发布工具
- `svelte-check` —— 类型检查 CLI
- `eslint-plugin-svelte` —— ESLint 集成
- `prettier-plugin-svelte` —— Prettier 集成

## 常用关键字 / 全局

```svelte
<!-- 注释 -->
<!--  HTML 注释（保留在输出） -->
{/* JS 注释（仅 .ts / .js 内） */}

<!-- 元素属性 -->
<input value={x} />            <!-- 属性绑定 -->
<input bind:value={x} />        <!-- 双向绑定 -->
<input {value} />               <!-- 短属性（同名） -->
<input {...attrs} />            <!-- spread -->

<!-- 事件 -->
<button onclick={fn} />         <!-- v5 -->
<button on:click={fn} />        <!-- v4，v5 仍兼容但 deprecated -->

<!-- Class -->
<div class="btn" />
<div class:active={cond} />
<div class={cls} />
<div class={['btn', { active }, size]} />   <!-- v5 实验 -->

<!-- Style -->
<div style="color: red;" />
<div style:color="red" />
<div style:font-size={`${size}px`} />

<!-- 动作 -->
<div use:action={params} />

<!-- 过渡 / 动画 -->
<div transition:fade />
<div in:fly out:fade />
<div animate:flip />

<!-- 引用 DOM -->
<input bind:this={inputEl} />

<!-- 引用组件实例（v4 用，v5 用 bind:value / props） -->
<Comp bind:this={compInstance} />
```

## 性能提示

| 优化 | 何时用 |
|---|---|
| `$state.raw` | 大对象 / 第三方库实例 / 不需要深响应 |
| `<svelte:options immutable>` | props 引用稳定的子组件 |
| `key` 块（`(item.id)`） | `{#each}` 中保持稳定 key |
| 列表虚拟化 | >500 行的长列表（用 `@tanstack/svelte-virtual`） |
| `await tick()` | 等 DOM 更新后测量 |
| `flushSync()` | 测试中强制同步 |
| `$inspect.trace()` | 排查为什么 effect 重跑 |
| `untrack(...)` | effect 内读值但不追踪 |
| `data-sveltekit-preload-data` | 链接预取（SvelteKit） |
| `csr=false` / `ssr=false` | 单页面切换渲染模式 |

## 小结

- **Runes** 是 Svelte 5 响应式核心（`$state` / `$derived` / `$effect` / `$props` / `$bindable` / `$inspect` / `$host`）
- **模板控制流** `{#if}` / `{#each}` / `{#await}` / `{#key}` / `{#snippet}` 加 `{@html}` / `{@const}` / `{@render}` / `{@debug}`
- **特殊元素** `<svelte:component>` 等 9 个，用于动态 / 全局 DOM 集成
- **Stores** `writable` / `readable` / `derived` / `get` / `readonly`（与 Runes 互补）
- **生命周期** `onMount` / `onDestroy` / `tick` / `untrack` / `flushSync` / `mount` / `unmount`
- **过渡 / 动画** `fade` / `fly` / `slide` 等内置，零依赖
- **TypeScript** `Snippet<[T]>` / `Component<Props>` / `Action<E, P>` 等类型工具
- **SvelteKit** `+page` / `+layout` / `+server` / `hooks.server` / adapter 是元框架支柱
- **版本里程碑** Svelte 1 (2016) → 5 (2024.10 Runes 时代)

至此 Svelte 完整笔记结束。从入门、基础、进阶、高级到周边生态，覆盖 Svelte 5 + SvelteKit 2 的核心使用范围。建议结合 [svelte.dev](https://svelte.dev/) 官方交互式 Tutorial 实操练习。
