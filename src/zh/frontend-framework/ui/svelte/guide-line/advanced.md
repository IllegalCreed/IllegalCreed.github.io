---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 基于 Svelte 5.x / SvelteKit 2.x 编写 —— SvelteKit / 状态管理 / TypeScript / 测试 / 特殊元素 / Actions / 模块共享 / 样式集成

## 速查

- **SvelteKit**：基于 Vite 的官方元框架（文件路由、SSR、Form Actions、Server Endpoints、多 adapter）
- **状态共享**：`.svelte.ts` 模块 + `$state` / Stores / Context API / 第三方（Svelte 通常不需要 Pinia / Redux）
- **TypeScript**：`<script lang="ts">` / `Props` / 泛型组件 `<script generics="T">` / `Snippet<[T]>` / `Component<Props>`
- **测试**：Vitest + `@testing-library/svelte` + Playwright Component / Vitest browser mode
- **特殊元素**：`<svelte:component>` / `<svelte:element>` / `<svelte:window>` / `<svelte:document>` / `<svelte:body>` / `<svelte:head>` / `<svelte:options>` / `<svelte:boundary>` / `<svelte:fragment>`
- **Actions**：`use:fn` 自定义指令（类型 `Action` / `ActionReturn`）
- **样式集成**：Tailwind CSS / UnoCSS / CSS Modules（`<style module>`）
- **Module Context**：Svelte 4 `<script context="module">` → Svelte 5 `<script module>`
- **Adapter**：`adapter-auto` / `adapter-node` / `adapter-static` / `adapter-vercel` / `adapter-cloudflare` / `adapter-netlify`

## SvelteKit 深入

### 文件路由

SvelteKit 用 `src/routes/` 下的文件结构生成路由：

```
src/routes/
├── +layout.svelte                # 根布局
├── +layout.ts                    # 根 load function
├── +page.svelte                  # /
├── +page.ts                      # / load function
├── about/
│   └── +page.svelte              # /about
├── users/
│   ├── +page.svelte              # /users
│   └── [id]/
│       ├── +page.svelte          # /users/:id
│       ├── +page.ts              # /users/:id load function
│       └── +page.server.ts       # /users/:id server-only load + actions
├── blog/
│   ├── +page.svelte              # /blog
│   ├── [slug]/
│   │   └── +page.svelte          # /blog/:slug
│   └── [...rest]/                # /blog/*  catch-all
│       └── +page.svelte
├── api/
│   └── users/
│       └── +server.ts            # /api/users (REST endpoints)
└── (auth)/                        # 命名分组（不出现在 URL）
    ├── login/+page.svelte         # /login
    └── register/+page.svelte      # /register
```

**路由规则**：

- `+page.svelte` 是页面
- `[param]` 是动态段（`/users/[id]/+page.svelte` → `/users/123`）
- `[...rest]` 是 catch-all（`/blog/[...rest]/+page.svelte` → `/blog/a/b/c`）
- `[[optional]]` 是可选段
- `(group)/` 是命名分组（仅组织文件，不影响 URL）
- `+page@.svelte`（with `@`）重置布局继承
- `+page@root.svelte` 重置到某个 layout

### Load Function

Load 用于在渲染前预取数据：

```ts
// src/routes/users/[id]/+page.ts
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  // params：路由参数
  const { id } = params

  // parent：合并父 layout 的 data
  const parentData = await parent()

  // fetch：服务端 / 客户端都用同一个 fetch（自动注入 cookies）
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw error(404, 'User not found')

  const user = await res.json()

  return {
    user,
    // 也可以 stream（promise 不 await）
    posts: fetch(`/api/users/${id}/posts`).then(r => r.json())
  }
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
</script>

<h1>{data.user.name}</h1>

{#await data.posts}
  <p>Loading posts...</p>
{:then posts}
  <ul>{#each posts as p (p.id)}<li>{p.title}</li>{/each}</ul>
{/await}
```

### Universal vs Server Load

| 文件 | 运行位置 | 用途 |
|---|---|---|
| `+page.ts` | **客户端 + 服务端** | universal（与服务端共享数据获取） |
| `+page.server.ts` | **仅服务端** | 需要数据库、密钥、cookies 时用 |
| `+layout.ts` / `+layout.server.ts` | 同上 | layout 级数据 |

```ts
// +page.server.ts —— 服务端独占
import type { PageServerLoad } from './$types'
import { db } from '$lib/server/db'

export const load: PageServerLoad = async ({ locals, params }) => {
  // 直接访问数据库（不进客户端 bundle）
  const user = await db.user.findUnique({ where: { id: params.id } })
  // locals 来自 hooks（如认证用户）
  if (!user || user.orgId !== locals.user?.orgId) {
    throw error(403, 'Forbidden')
  }
  return { user }
}
```

### Form Actions

替代手写 fetch，提供渐进增强（无 JS 也能用）：

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
</script>

<form method="POST" use:enhance>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Login</button>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</form>
```

```ts
// +page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData()
    const email = data.get('email') as string
    const password = data.get('password') as string

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verify(password, user.passwordHash)) {
      return fail(400, { error: 'Invalid credentials', email })
    }

    cookies.set('token', sign(user.id), { path: '/' })
    throw redirect(302, '/dashboard')
  }
}
```

**多个 named actions**：

```ts
export const actions: Actions = {
  login: async ({ request }) => { /* ... */ },
  register: async ({ request }) => { /* ... */ },
  logout: async ({ cookies }) => { /* ... */ }
}
```

```svelte
<!-- 指定 action -->
<form method="POST" action="?/login" use:enhance>...</form>
<form method="POST" action="?/register" use:enhance>...</form>
```

### Server Endpoints `+server.ts`

REST API 端点：

```ts
// src/routes/api/users/+server.ts
import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 10)
  const users = await db.user.findMany({ take: limit })
  return json(users)
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized')
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return json(user, { status: 201 })
}
```

### Hooks

应用级中间件：

```ts
// src/hooks.server.ts
import type { Handle, HandleServerError, HandleFetch } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const authentication: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token')
  if (token) {
    event.locals.user = verify(token)
  }
  return resolve(event)
}

const logging: Handle = async ({ event, resolve }) => {
  const start = Date.now()
  const response = await resolve(event)
  console.log(`${event.request.method} ${event.url.pathname} ${Date.now() - start}ms`)
  return response
}

export const handle = sequence(authentication, logging)

export const handleError: HandleServerError = ({ error, event }) => {
  console.error(error)
  return { message: 'Internal error' }
}

export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
  // 同源 fetch 自动转发 cookies；这里可以注入 API 密钥等
  if (request.url.startsWith('https://api.internal.com')) {
    request.headers.set('X-API-Key', env.INTERNAL_API_KEY)
  }
  return fetch(request)
}
```

### Adapter（部署）

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto'   // 默认：自动检测平台
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  }
}
```

**官方 adapters**：

| Adapter | 包 | 用途 |
|---|---|---|
| **adapter-auto** | `@sveltejs/adapter-auto` | 自动检测部署平台（Vercel / Netlify / Cloudflare） |
| **adapter-node** | `@sveltejs/adapter-node` | 自托管 Node.js 服务器（Docker / 自建主机） |
| **adapter-static** | `@sveltejs/adapter-static` | 完全静态（SSG，GitHub Pages / S3） |
| **adapter-vercel** | `@sveltejs/adapter-vercel` | Vercel（Edge / Serverless） |
| **adapter-cloudflare** | `@sveltejs/adapter-cloudflare` | Cloudflare Workers / Pages |
| **adapter-netlify** | `@sveltejs/adapter-netlify` | Netlify Functions |

```js
// svelte.config.js（Node 自托管）
import adapter from '@sveltejs/adapter-node'

export default {
  kit: { adapter: adapter({ out: 'build', precompress: true }) }
}

// 完全静态
import adapter from '@sveltejs/adapter-static'
export default {
  kit: { adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html' }) }
}

// Cloudflare
import adapter from '@sveltejs/adapter-cloudflare'
export default { kit: { adapter: adapter() } }
```

### 环境变量

SvelteKit 区分公开 / 私有、静态 / 动态：

```ts
// 私有 + 静态（仅服务端，构建时注入）
import { SECRET_API_KEY } from '$env/static/private'

// 私有 + 动态（仅服务端，运行时读取）
import { env } from '$env/dynamic/private'
console.log(env.DATABASE_URL)

// 公开 + 静态（客户端可见，前缀 PUBLIC_）
import { PUBLIC_SITE_URL } from '$env/static/public'

// 公开 + 动态
import { env } from '$env/dynamic/public'
```

`.env` 文件：

```bash
SECRET_API_KEY=sk_xxxxx               # 私有
PUBLIC_SITE_URL=https://example.com   # 公开（前缀 PUBLIC_）
```

### 客户端导航 API

```ts
// 编程式导航
import { goto, invalidate, invalidateAll, preloadData, beforeNavigate, afterNavigate } from '$app/navigation'

await goto('/dashboard')
await goto('/dashboard', { replaceState: true, invalidateAll: true })

// 重新跑 load function
await invalidate('app:users')          // 仅触发 depends('app:users') 的 load
await invalidateAll()                  // 触发所有 load

// 预取 + 预渲染
await preloadData('/dashboard')        // load + render，hover 时调用
```

```ts
// load function 内打依赖标签
export const load = async ({ depends, fetch }) => {
  depends('app:users')
  return { users: await fetch('/api/users').then(r => r.json()) }
}

// 刷新这条数据
import { invalidate } from '$app/navigation'
await invalidate('app:users')
```

### `$app/stores` —— 应用级 stores

```svelte
<script lang="ts">
  import { page, navigating, updated } from '$app/stores'
</script>

<p>Current path: {$page.url.pathname}</p>
<p>Route ID: {$page.route.id}</p>
<p>Status: {$page.status}</p>

{#if $navigating}
  <p>Navigating to {$navigating.to?.url.pathname}...</p>
{/if}

{#if $updated}
  <button onclick={() => location.reload()}>New version available - reload</button>
{/if}
```

::: tip Svelte 5 推荐 `$app/state`
SvelteKit 2.7+ 引入了 `$app/state`，用 Runes 替代 stores：

```ts
import { page } from '$app/state'

// $page → page（无 $ 前缀，直接访问）
console.log(page.url.pathname)
console.log(page.params.id)
```
:::

## 状态管理选项

### 选项一：`$state` + `.svelte.ts` 模块

最简单的跨组件共享：

```ts
// stores/cart.svelte.ts
interface CartItem { id: string; name: string; quantity: number }

let _items = $state<CartItem[]>([])

export const cart = {
  get items() { return _items },
  get total() { return _items.reduce((s, i) => s + i.quantity, 0) },

  add(item: Omit<CartItem, 'quantity'>) {
    const existing = _items.find(i => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      _items.push({ ...item, quantity: 1 })
    }
  },

  remove(id: string) {
    _items = _items.filter(i => i.id !== id)
  },

  clear() {
    _items = []
  }
}
```

```svelte
<!-- 任意组件 -->
<script lang="ts">
  import { cart } from '$lib/stores/cart.svelte'
</script>

<p>Total items: {cart.total}</p>
<ul>
  {#each cart.items as item (item.id)}
    <li>
      {item.name} ({item.quantity})
      <button onclick={() => cart.remove(item.id)}>Remove</button>
    </li>
  {/each}
</ul>
```

### 选项二：Svelte Stores

适合外部订阅、异步流：

```ts
// stores/notifications.ts
import { writable } from 'svelte/store'

interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

function createNotifications() {
  const { subscribe, update } = writable<Notification[]>([])

  return {
    subscribe,
    add(message: string, type: Notification['type'] = 'info') {
      const id = crypto.randomUUID()
      update(list => [...list, { id, message, type }])
      setTimeout(() => {
        update(list => list.filter(n => n.id !== id))
      }, 3000)
    },
    remove(id: string) {
      update(list => list.filter(n => n.id !== id))
    }
  }
}

export const notifications = createNotifications()
```

```svelte
<script lang="ts">
  import { notifications } from '$lib/stores/notifications'
</script>

{#each $notifications as n (n.id)}
  <div class="toast" class:error={n.type === 'error'}>
    {n.message}
  </div>
{/each}

<button onclick={() => notifications.add('Saved!', 'success')}>Add</button>
```

### 选项三：Context API（局部树共享）

见 `base.md` 的 Context API 章节。适合组件树内（不跨页面）共享。

### 与第三方库对比

| 第三方库 | Svelte 替代 | 评价 |
|---|---|---|
| Pinia / Vuex | `.svelte.ts` + `$state` | Svelte 通常不需要 |
| Redux / Zustand | `.svelte.ts` + `$state` 或 stores | 同上 |
| Jotai / Recoil | `$state` 已经是细粒度原子 | 不需要 |
| TanStack Query | [TanStack Query Svelte](https://tanstack.com/query) | 服务端数据缓存仍推荐 |
| RxJS | Svelte stores 兼容 RxJS（subscribe 协议） | 异步流仍可用 |

**Svelte 5 现状**：90% 场景用 `$state` + `.svelte.ts` 模块够了，剩余 10%（异步流、外部订阅）用 stores。

## TypeScript 集成

### 启用

```svelte
<script lang="ts">
  // 自动启用 TS
  let count = $state(0)
  let user = $state<User>({ id: '1', name: 'Alice' })
</script>
```

`tsconfig.json` 由 SvelteKit / `create-vite` 模板自动配置：

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": true,
    "skipLibCheck": true
  }
}
```

### Props 类型

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    count?: number
    onClick?: (e: MouseEvent) => void
    items: Item[]
    children?: Snippet
    header?: Snippet<[string]>     // 带参数的 snippet
  }

  let { title, count = 0, onClick, items, children, header }: Props = $props()
</script>
```

### 泛型组件

Svelte 5 支持 `generics` 属性：

```svelte
<!-- DataTable.svelte -->
<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte'

  interface Props {
    items: T[]
    row: Snippet<[T]>
    keyExtractor?: (item: T) => string
  }

  let { items, row, keyExtractor = (item) => item.id }: Props = $props()
</script>

<table>
  {#each items as item (keyExtractor(item))}
    <tr>{@render row(item)}</tr>
  {/each}
</table>

<!-- 使用 -->
<DataTable items={users}>
  {#snippet row(user)}        <!-- user 自动推导为 User -->
    <td>{user.name}</td>
  {/snippet}
</DataTable>
```

### Event 类型

```svelte
<script lang="ts">
  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    console.log(e.currentTarget.disabled)
  }

  function handleInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    console.log(e.currentTarget.value)
  }
</script>

<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
```

### Component 类型

```ts
// 引用组件类型
import type { Component } from 'svelte'
import Button from './Button.svelte'

let MyComponent: Component<{ label: string }> = Button
```

### `svelte-check` 命令行类型检查

```bash
pnpm add -D svelte-check
pnpm svelte-check --tsconfig ./tsconfig.json
```

```json
// package.json
{
  "scripts": {
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-check --tsconfig ./tsconfig.json --watch"
  }
}
```

VS Code 安装 [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) 插件，编辑器自动跑 `svelte-check`。

### `$$Props` / `$$Events` 已废弃

Svelte 4 的 `$$Props` / `$$Events` / `$$Slots` 类型工具在 Svelte 5 不再需要 —— `$props()` + `Snippet` 直接搞定类型。

## 测试

### Vitest + `@testing-library/svelte`

```bash
pnpm add -D vitest @testing-library/svelte @testing-library/jest-dom jsdom
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
})
```

```ts
// src/test-setup.ts
import '@testing-library/jest-dom/vitest'
```

```ts
// Counter.test.ts
import { render, screen } from '@testing-library/svelte'
import { fireEvent } from '@testing-library/dom'
import { expect, it } from 'vitest'
import Counter from './Counter.svelte'

it('renders initial count', () => {
  render(Counter, { props: { initial: 5 } })
  expect(screen.getByText(/count: 5/i)).toBeInTheDocument()
})

it('increments on click', async () => {
  render(Counter, { props: { initial: 0 } })
  const button = screen.getByRole('button', { name: /\+1/ })
  await fireEvent.click(button)
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument()
})
```

### Vitest browser mode（真实浏览器）

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true
    }
  }
})
```

### Playwright（E2E）

```bash
pnpm dlx playwright install
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173
  },
  testDir: 'tests'
})
```

```ts
// tests/login.spec.ts
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

### 测试 Runes 模块

Runes 在 `.test.ts` 中需要重命名为 `.test.svelte.ts`：

```ts
// counter.svelte.test.ts
import { expect, it } from 'vitest'
import { flushSync } from 'svelte'

it('counter increments', () => {
  let count = $state(0)
  let cleanup = $effect.root(() => {
    let doubled = $derived(count * 2)
    count = 5
    flushSync()
    expect(doubled).toBe(10)
  })
  cleanup()
})
```

## 样式高级

### Tailwind CSS

```bash
pnpm dlx svelte-add tailwindcss
# 或手动
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: { extend: {} },
  plugins: []
}
```

```svelte
<!-- 直接用 Tailwind 类 -->
<button class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
  Click
</button>
```

### UnoCSS

```bash
pnpm add -D unocss @unocss/svelte-scoped
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import UnoCSS from '@unocss/svelte-scoped/vite'

export default {
  plugins: [
    UnoCSS({ injectReset: '@unocss/reset/tailwind.css' }),
    sveltekit()
  ]
}
```

```svelte
<!-- @unocss/svelte-scoped 自动 scoped 工具类 -->
<button class="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded">
  Click
</button>
```

### CSS Modules（`<style module>`）

```svelte
<script lang="ts">
  // 引用 module 类
  import s from './styles.module.css'  // 标准 CSS Modules（与 Vite 集成）
</script>

<button class={s.btn}>Click</button>
```

或用 Svelte 的 `<style module>`：

```svelte
<button class={$style.btn}>Click</button>

<style module>
  .btn { padding: 8px; }
</style>
```

### CSS 变量 + `--var:` 属性

```svelte
<!-- Parent.svelte -->
<Card --primary="blue" --hover="lightblue" />

<!-- Card.svelte -->
<button class="card">Hello</button>

<style>
  .card {
    background: var(--primary);
    transition: background 0.2s;
  }
  .card:hover {
    background: var(--hover);
  }
</style>
```

## 特殊组件

### `<svelte:component>`（v4 写法，v5 已不需要）

Svelte 4 用 `<svelte:component this={Comp}>` 渲染动态组件。Svelte 5 直接把组件当变量：

```svelte
<!-- Svelte 4 -->
<svelte:component this={CurrentTab} />

<!-- Svelte 5（直接当组件用） -->
<script lang="ts">
  import Tab1 from './Tab1.svelte'
  import Tab2 from './Tab2.svelte'

  let active = $state<'tab1' | 'tab2'>('tab1')
  let CurrentTab = $derived(active === 'tab1' ? Tab1 : Tab2)
</script>

<CurrentTab />
```

### `<svelte:element>` —— 动态元素标签

```svelte
<script lang="ts">
  let tag = $state<'h1' | 'h2' | 'h3'>('h1')
</script>

<svelte:element this={tag}>Heading</svelte:element>
<!-- tag='h1' → <h1>Heading</h1>，tag='h2' → <h2>Heading</h2> -->

<select bind:value={tag}>
  <option value="h1">H1</option>
  <option value="h2">H2</option>
  <option value="h3">H3</option>
</select>
```

### `<svelte:window>` —— 监听 window 事件

```svelte
<script lang="ts">
  let scrollY = $state(0)
  let innerWidth = $state(0)

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      console.log('Escape pressed')
    }
  }
</script>

<svelte:window
  bind:scrollY
  bind:innerWidth
  onkeydown={handleKeyDown}
  ononline={() => console.log('online')}
  onoffline={() => console.log('offline')}
/>

<p>Scroll: {scrollY}px, Width: {innerWidth}px</p>
```

**`<svelte:window>` 可绑定属性**：`innerWidth` / `innerHeight` / `outerWidth` / `outerHeight` / `scrollX` / `scrollY` / `online` / `devicePixelRatio`

### `<svelte:document>` —— document 事件

```svelte
<script lang="ts">
  function handleVisibility() {
    if (document.hidden) console.log('Hidden')
    else console.log('Visible')
  }
</script>

<svelte:document onvisibilitychange={handleVisibility} />
```

### `<svelte:body>` —— body 事件

```svelte
<svelte:body onmouseenter={() => isHovered = true} onmouseleave={() => isHovered = false} />
```

### `<svelte:head>` —— 注入到 `<head>`

```svelte
<svelte:head>
  <title>My Page Title</title>
  <meta name="description" content="Page description" />
  <link rel="canonical" href="https://example.com/page" />
</svelte:head>
```

::: tip SvelteKit 多页面 head 合并
SvelteKit 自动合并多层 layout / page 的 `<svelte:head>`，子页面会覆盖父 layout 的 `<title>`。
:::

### `<svelte:options>` —— 编译选项

```svelte
<!-- 在 .svelte 文件顶部 -->
<svelte:options
  customElement="my-button"     ← 编译成 Web Component
  immutable={true}              ← prop 引用变化才更新（性能优化）
  accessors={true}              ← 暴露 get/set（Svelte 4 兼容）
/>

<script lang="ts">
  let { label }: { label: string } = $props()
</script>

<button>{label}</button>
```

### `<svelte:boundary>` —— 错误边界（v5.3+）

```svelte
<script lang="ts">
  function reset() {
    // 重置错误状态
  }
</script>

<svelte:boundary onerror={(error, reset) => console.error(error)}>
  <RiskyComponent />

  {#snippet failed(error, reset)}
    <p>Error: {error.message}</p>
    <button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```

### `<svelte:fragment>` 已废弃

Svelte 4 的 `<svelte:fragment slot="x">` 在 Svelte 5 用 `{#snippet}` 替代。

## Actions（`use:` 自定义指令）

### 基本 Action

```ts
// actions/clickOutside.ts
import type { Action } from 'svelte/action'

export const clickOutside: Action<HTMLElement, () => void> = (node, callback) => {
  function handle(e: MouseEvent) {
    if (!node.contains(e.target as Node)) {
      callback()
    }
  }

  document.addEventListener('click', handle, true)

  return {
    destroy() {
      document.removeEventListener('click', handle, true)
    }
  }
}
```

```svelte
<script lang="ts">
  import { clickOutside } from './actions/clickOutside'

  let open = $state(false)
</script>

{#if open}
  <div use:clickOutside={() => open = false}>
    Dropdown content
  </div>
{/if}
```

### Action with update

```ts
// actions/tooltip.ts
import type { Action } from 'svelte/action'

interface TooltipParams {
  text: string
  position?: 'top' | 'bottom'
}

export const tooltip: Action<HTMLElement, TooltipParams> = (node, params) => {
  let { text, position = 'top' } = params
  const el = document.createElement('div')
  el.className = `tooltip tooltip-${position}`
  el.textContent = text

  function show() {
    document.body.appendChild(el)
    const rect = node.getBoundingClientRect()
    el.style.left = `${rect.left}px`
    el.style.top = `${position === 'top' ? rect.top - 30 : rect.bottom + 5}px`
  }

  function hide() {
    el.remove()
  }

  node.addEventListener('mouseenter', show)
  node.addEventListener('mouseleave', hide)

  return {
    update(newParams) {
      text = newParams.text
      position = newParams.position ?? 'top'
      el.textContent = text
      el.className = `tooltip tooltip-${position}`
    },
    destroy() {
      node.removeEventListener('mouseenter', show)
      node.removeEventListener('mouseleave', hide)
      el.remove()
    }
  }
}
```

```svelte
<button use:tooltip={{ text: 'Click me', position: 'top' }}>Hover</button>
```

### 常用 Actions 库

| 库 | 用途 |
|---|---|
| [svelte-portal](https://github.com/romkor/svelte-portal) | 把内容渲染到 body / 任意节点 |
| [svelte-clickoutside](https://github.com/dnaszary/svelte-clickoutside) | 点击外部触发 |
| [svelte-floating-ui](https://github.com/fedorovvvv/svelte-floating-ui) | Popover / Tooltip 定位 |
| [@svelte-put/clickoutside](https://github.com/vnphanquang/svelte-put) | 完整 utilities |
| [@melt-ui/svelte](https://melt-ui.com/) | 无样式行为组件（Headless） |

## Module Context

Svelte 4 用 `<script context="module">` 写组件级单例（所有实例共享）：

```svelte
<!-- Svelte 4 -->
<script context="module" lang="ts">
  let counter = 0          // ← 所有 Counter 实例共享
  export function getCount() { return counter }
</script>

<script lang="ts">
  counter++                // 每次创建实例时 +1
</script>
```

Svelte 5 改名为 `<script module>`：

```svelte
<!-- Svelte 5 -->
<script module lang="ts">
  // 仅在文件首次 import 时执行一次
  export const supportedLocales = ['en', 'zh', 'ja']

  // 共享状态（所有组件实例可见）
  let _instanceCount = 0
  export function getInstanceCount() { return _instanceCount }
</script>

<script lang="ts">
  // 每个组件实例都跑一次
  _instanceCount++
</script>
```

**用途**：

- 导出工具函数 / 常量（不跨实例的 props / state 放普通 `<script>`）
- 共享状态（单例计数器、注册中心）
- 在被 import 时执行的初始化代码

## 与 Svelte 4 关键差异速览

| 维度 | Svelte 4 | Svelte 5 |
|---|---|---|
| 响应式声明 | `let count = 0` | `let count = $state(0)` |
| 派生 | `$: doubled = count * 2` | `let doubled = $derived(count * 2)` |
| 副作用 | `$: console.log(count)` | `$effect(() => console.log(count))` |
| Props | `export let name: string` | `let { name }: { name: string } = $props()` |
| 默认值 | `export let name = 'Anon'` | `let { name = 'Anon' } = $props()` |
| 事件 | `on:click={fn}` | `onclick={fn}` |
| 子→父事件 | `createEventDispatcher` | callback props（函数当 prop） |
| 插槽 | `<slot />` / `<slot name="x" />` | `{@render children?.()}` + `{#snippet x()}` |
| 动态组件 | `<svelte:component this={Comp} />` | 直接 `<Comp />` |
| Module Script | `<script context="module">` | `<script module>` |
| Component 类 | `new Comp(...)` | `mount(Comp, ...)` / `unmount(...)` |
| `$$Props` 类型 | 需要 | 用 `$props()` 类型直接推导 |
| `beforeUpdate` | 可用 | deprecated（用 `$effect.pre`） |
| `afterUpdate` | 可用 | deprecated（用 `$effect`） |

## 小结

- **SvelteKit** 文件路由、Load function、Form Actions、Server Endpoints、Hooks 构成完整全栈方案
- **Adapter** 决定部署目标，`adapter-auto` 自动检测
- **状态管理** 通常用 `.svelte.ts` + `$state` 模块化共享，Stores 仅在异步流时用
- **TypeScript** Svelte 5 集成完善，泛型组件用 `generics="T"` 属性
- **测试** Vitest + `@testing-library/svelte` + Playwright，Runes 模块用 `.test.svelte.ts`
- **特殊元素** `<svelte:window>` / `<svelte:head>` / `<svelte:element>` 等覆盖动态 / DOM 集成场景
- **Actions** 用 `use:fn` 写自定义指令，类型 `Action<E, P>`
- **`<script module>`** 替代 v4 的 `<script context="module">`

下一章 `expert.md` 进入编译器内部、SSR / Hydration、Svelte 4 → 5 迁移、性能优化、微前端、Tauri、库开发。
