---
layout: doc
outline: [2, 3]
---

# 指南 - 其它

> 基于 Svelte 5.x 编写 —— 周边工具 / 跨端方案 / UI 库 / i18n / Storybook / 生态对比

## 速查

- **桌面端**：Tauri + Svelte（推荐）/ Electron + Svelte / NeutralinoJS
- **移动端**：Capacitor（H5 壳）/ Svelte Native（NativeScript，已沉寂）/ Ionic Svelte（实验）
- **样式生态**：Tailwind CSS / UnoCSS / Pico CSS / Open Props / 内置 Svelte scoped
- **UI 库**：Skeleton UI / shadcn-svelte / Flowbite Svelte / Bits UI / Melt UI / SVAR / Svelte Material UI / Carbon for Svelte
- **i18n**：[svelte-i18n](https://github.com/kaisermann/svelte-i18n)（社区主流）/ [Paraglide / @inlang/sdk](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)（编译时方案，类型最强）/ [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n)
- **Storybook**：Svelte 官方支持，含 CSF3 / Args / Controls
- **图标**：lucide-svelte / @iconify-icon/svelte / svelte-feather-icons
- **数据获取**：TanStack Query Svelte / [svelte-query](https://github.com/SvelteStack/svelte-query)（社区） / 直接 SvelteKit `load`
- **动画库**：[svelte-motion](https://github.com/spences10/svelte-motion)（Framer Motion 风格） / 内置 `svelte/transition`

## SvelteKit 生态总结

详细 SvelteKit 内容见 `advanced.md` / `expert.md`。这里做一个生态全景：

| 类别 | 推荐 / 主流 |
|---|---|
| **元框架** | SvelteKit（官方，基于 Vite） |
| **部署 adapter** | adapter-auto / adapter-node / adapter-static / adapter-vercel / adapter-cloudflare / adapter-netlify |
| **路由** | SvelteKit 文件路由（不需要第三方） |
| **状态管理** | `$state` + `.svelte.ts` / Svelte stores |
| **表单** | Superforms + Zod（最完整）/ SvelteKit 原生 Form Actions |
| **数据获取** | SvelteKit `load` + `+server.ts` / TanStack Query |
| **ORM** | Prisma / Drizzle / Kysely |
| **认证** | Auth.js (NextAuth) Svelte 适配 / Lucia / Clerk |
| **CMS** | Sanity / Strapi / Contentful（与 SvelteKit `load` 集成） |
| **静态站点** | adapter-static / [SvelTeX](https://sveltexample.com/)（实验） |
| **博客 / 文档** | mdsvex（Markdown + Svelte） / SvelteKit + Astro |

## 移动端方案

### Capacitor（推荐用于 H5 壳）

Capacitor 把 Web 应用打包成 iOS / Android 原生壳，性能介于 PWA 与 React Native 之间：

```bash
pnpm create svelte@latest my-app
cd my-app

# 装 Capacitor
pnpm add @capacitor/core
pnpm add -D @capacitor/cli
pnpm dlx cap init my-app com.example.myapp

# 编译 + 同步
pnpm build       # SvelteKit static adapter 输出
pnpm dlx cap add ios
pnpm dlx cap add android
pnpm dlx cap sync
pnpm dlx cap open ios   # 打开 Xcode
```

**SvelteKit 配置**（必须 `adapter-static`）：

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static'

export default {
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html' })
  }
}
```

```json
// capacitor.config.json
{
  "appId": "com.example.myapp",
  "appName": "MyApp",
  "webDir": "build",
  "server": {
    "androidScheme": "https"
  }
}
```

**优点**：

- SvelteKit 写好的 web 应用直接复用，0 额外开发成本
- 原生插件（Camera / Geolocation / Push）有完整 API
- 离线工作（Service Worker）

**缺点**：

- 性能不如 React Native（仍是 WebView 渲染）
- iOS / Android 各自需要原生开发知识（证书、商店审核）

### Svelte Native（社区，已沉寂）

[Svelte Native](https://svelte-native.technology/) 基于 NativeScript，编译到原生 UI。

```svelte
<!-- 原生组件，不是 HTML -->
<page>
  <action-bar title="My App" />
  <stack-layout>
    <label text={message} />
    <button text="Tap" on:tap={() => message = 'Tapped'} />
  </stack-layout>
</page>
```

::: warning Svelte Native 状态
社区维护已久未活跃，Svelte 5 支持滞后；**不推荐新项目使用**。原生移动方案优先选 Capacitor + Svelte（H5 壳）或直接用 React Native。
:::

## 桌面端方案

### Tauri + Svelte（强烈推荐）

Tauri 用 Rust 写后端、系统原生 WebView 渲染前端，bundle 比 Electron 小 10-100 倍：

```bash
# 创建 Tauri + SvelteKit
pnpm create tauri-app
# 选择 SvelteKit + TypeScript
```

详见 `expert.md` 跨端方案章节。

**Tauri vs Electron 对比**：

| 维度 | Tauri | Electron |
|---|---|---|
| 后端语言 | Rust | Node.js |
| 渲染引擎 | 系统原生 WebView（macOS WKWebView / Windows WebView2 / Linux WebKitGTK） | 嵌入 Chromium |
| Bundle 大小 | ~5-10 MB（无 Chromium） | ~100-150 MB（含 Chromium） |
| 内存占用 | ~50 MB | ~200-500 MB |
| 启动速度 | 快（毫秒级） | 慢（数百毫秒） |
| API 暴露 | Rust commands（显式声明） | Node.js 全量（IPC） |
| 跨平台一致性 | 不同 WebView 渲染差异 | Chromium 一致 |
| 生态成熟度 | 较新（2022 发布） | 老牌（2013） |

**结论**：新项目优先 Tauri；需要 Node.js 生态强集成的工具型应用（如 VS Code 类）用 Electron。

### Electron + Svelte

```bash
pnpm create @quick-start/electron my-app --template=svelte-ts
cd my-app
pnpm install
pnpm dev
```

`electron-vite` 自动接好 SvelteKit + Electron + 类型 + 热更新。

### NeutralinoJS

更轻量的桌面方案（Tauri 类似，但用 C++ 而非 Rust）：

```bash
pnpm dlx @neutralinojs/neu create my-app --template=neutralinojs/neutralinojs-svelte
```

社区较小，**不推荐新项目**，除非有特殊轻量需求。

## 样式集成

### Tailwind CSS

```bash
# SvelteKit 项目
pnpm dlx svelte-add tailwindcss

# 或纯 Vite + Svelte
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

```ts
// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({ scale: 1.2 })
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded cursor-pointer hover:bg-gray-700',
    'btn-primary': 'btn bg-blue-500 text-white'
  }
})
```

::: tip @unocss/svelte-scoped 自动 scoped
不同于普通 UnoCSS，`@unocss/svelte-scoped` 把工具类编译进每个 `.svelte` 文件的 `<style>` 块，避免全局 CSS 污染。
:::

### Pico CSS / Open Props（无构建）

最小化方案：

```html
<!-- app.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
```

直接 semantic HTML 即得设计良好的默认样式（适合快速 demo / 内部工具）。

## UI 组件库选型

### Skeleton UI

[Skeleton UI](https://www.skeleton.dev/) 是基于 Tailwind 的全套设计系统，主题切换、暗黑模式、动画一体化：

```bash
pnpm dlx svelte-add @skeletonlabs/skeleton
```

```svelte
<script>
  import { AppBar, AppShell, Drawer } from '@skeletonlabs/skeleton'
</script>

<AppShell>
  <svelte:fragment slot="header">
    <AppBar><svelte:fragment slot="lead">My App</svelte:fragment></AppBar>
  </svelte:fragment>
  <!-- main content -->
</AppShell>
```

::: tip Skeleton 仍在升级 Svelte 5
Skeleton 3.x 正在适配 Svelte 5 + Runes，部分组件 API 还在变化。新项目可以等 4.0 稳定后再迁移。
:::

### shadcn-svelte

[shadcn-svelte](https://www.shadcn-svelte.com/) 是 React 端 shadcn/ui 的 Svelte 移植——「**复制粘贴**」式无样式行为组件：

```bash
pnpm dlx shadcn-svelte@latest init
pnpm dlx shadcn-svelte@latest add button card dialog
```

会把组件源码复制到 `src/lib/components/ui/`，你完全拥有代码：

```svelte
<script>
  import { Button } from '$lib/components/ui/button'
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card'
</script>

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>
    <Button variant="default">Click</Button>
  </CardContent>
</Card>
```

**推荐用于**：希望完全控制组件样式 + 行为的项目。

### Bits UI / Melt UI（Headless）

[Bits UI](https://www.bits-ui.com/) 与 [Melt UI](https://melt-ui.com/) 是无样式 / 行为层组件——类似 Radix UI（React）的 Svelte 版：

```bash
pnpm add bits-ui
```

```svelte
<script>
  import { Dialog } from 'bits-ui'
</script>

<Dialog.Root>
  <Dialog.Trigger class="btn">Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50" />
    <Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded">
      <Dialog.Title>Hello</Dialog.Title>
      <Dialog.Description>This is a dialog</Dialog.Description>
      <Dialog.Close class="btn">Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

适合：需要自定义样式但不想从零写交互行为（焦点管理、ARIA、键盘）的项目。

### Flowbite Svelte

[Flowbite Svelte](https://flowbite-svelte.com/) 是 Tailwind UI 风格的现成组件库：

```bash
pnpm add flowbite-svelte flowbite
```

```svelte
<script>
  import { Button, Modal } from 'flowbite-svelte'
  let modalOpen = $state(false)
</script>

<Button onclick={() => modalOpen = true}>Open Modal</Button>
<Modal bind:open={modalOpen} title="Hello">
  <p>Modal content</p>
</Modal>
```

### SVAR

[SVAR Svelte](https://svar.dev/svelte/) 提供企业级数据组件（Grid / Gantt / Pivot / DataTable）：

```bash
pnpm add @svar-ui/svelte-datagrid @svar-ui/svelte-gantt
```

适合：CRM / ERP / Admin 后台需要重型表格的项目。

### Svelte Material UI

[Svelte Material UI](https://sveltematerialui.com/) 移植 Material Design 3，组件齐全但 Svelte 5 适配滞后。

### Carbon Components for Svelte

[Carbon Components Svelte](https://carbon-components-svelte.onrender.com/) 是 IBM Carbon Design 实现，企业风格。

### 选型建议

| 场景 | 推荐 |
|---|---|
| 设计自由度要求高 | shadcn-svelte（复制源码） |
| 行为层 + 自定义样式 | Bits UI / Melt UI |
| 快速搭后台 | Skeleton UI / Flowbite Svelte |
| 企业 admin / 数据密集 | SVAR / Carbon Components |
| Material Design | Svelte Material UI（Svelte 5 适配中） |

## Storybook 集成

```bash
pnpm dlx storybook@latest init
# 自动检测 SvelteKit / Vite + Svelte 项目，配置 @storybook/sveltekit / @storybook/svelte-vite
```

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/sveltekit'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|ts|svelte)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: '@storybook/sveltekit'
}
export default config
```

```ts
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/svelte'
import Button from './Button.svelte'

const meta = {
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger']
    },
    disabled: { control: 'boolean' }
  }
} satisfies Meta<Button>
export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', label: 'Click me' }
}

export const Disabled: Story = {
  args: { variant: 'primary', label: 'Disabled', disabled: true }
}
```

::: tip Svelte CSF（实验性）
[`@storybook/addon-svelte-csf`](https://github.com/storybookjs/addon-svelte-csf) 让你用 `.stories.svelte` 写故事（比 `.stories.ts` 更接近真实组件）：

```svelte
<script context="module">
  import { Meta, Story } from '@storybook/addon-svelte-csf'
  import Button from './Button.svelte'
</script>

<Meta title="Button" component={Button} />

<Story name="Primary" let:args>
  <Button {...args} label="Click" />
</Story>

<Story name="Danger">
  <Button variant="danger" label="Delete" />
</Story>
```
:::

## i18n 集成

### svelte-i18n（社区主流）

```bash
pnpm add svelte-i18n
```

```ts
// src/lib/i18n.ts
import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n'

import en from '$lib/locales/en.json'
import zh from '$lib/locales/zh.json'

addMessages('en', en)
addMessages('zh', zh)

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator()
})
```

```json
// src/lib/locales/zh.json
{
  "welcome": "欢迎，{name}！",
  "items": "{count, plural, one {1 项} other {# 项}}",
  "nav": {
    "home": "首页",
    "about": "关于"
  }
}
```

```svelte
<script lang="ts">
  import { _, locale } from 'svelte-i18n'
</script>

<h1>{$_('welcome', { values: { name: 'Alice' } })}</h1>
<p>{$_('items', { values: { count: 5 } })}</p>

<button onclick={() => locale.set('en')}>EN</button>
<button onclick={() => locale.set('zh')}>中文</button>
```

### Paraglide / @inlang/sdk（编译时方案，类型最强）

[Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) 把翻译编译成 tree-shakable 的 TypeScript 函数：

```bash
pnpm dlx @inlang/paraglide-js init
```

```json
// project.inlang/settings.json
{
  "sourceLanguageTag": "en",
  "languageTags": ["en", "zh"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
  ]
}
```

```json
// messages/en.json
{ "welcome": "Welcome, {name}!" }
```

```svelte
<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  // m.welcome 自动生成的类型安全函数
</script>

<h1>{m.welcome({ name: 'Alice' })}</h1>
```

**优点**：

- 类型安全（IDE 自动补全 message keys）
- Tree-shakable（仅打包用到的翻译）
- 无运行时（编译时确定）

**缺点**：

- 学习曲线略陡
- 需要构建步骤配合

### typesafe-i18n

[typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) 强类型 i18n，类似 Paraglide 但更老牌：

```bash
pnpm add -D typesafe-i18n
pnpm dlx typesafe-i18n --setup
```

适合：希望全程 TypeScript 类型推导 + 不引入构建插件依赖。

## 图标库

### lucide-svelte（推荐）

```bash
pnpm add lucide-svelte
```

```svelte
<script>
  import { Home, Settings, User } from 'lucide-svelte'
</script>

<Home size={24} color="blue" />
<Settings size={20} strokeWidth={2.5} />
<User class="text-gray-500" />
```

### @iconify-icon/svelte

```bash
pnpm add @iconify-icon/svelte
```

```svelte
<script>
  import 'iconify-icon'  // Web Component
</script>

<iconify-icon icon="mdi:home"></iconify-icon>
<iconify-icon icon="logos:svelte-icon" width="48"></iconify-icon>
```

支持 [200,000+ 图标](https://icon-sets.iconify.design/)，按需加载。

### svelte-feather-icons / svelte-heroicons

各种图标集的 Svelte 封装，按需选用。

## 动画库

### svelte-motion

[svelte-motion](https://github.com/spences10/svelte-motion) 是 Framer Motion 的 Svelte 移植：

```bash
pnpm add svelte-motion
```

```svelte
<script>
  import { Motion } from 'svelte-motion'
</script>

<Motion
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  let:motion
>
  <div use:motion>Animated content</div>
</Motion>
```

适合：需要复杂关键帧 / 拖拽 / 物理动画的项目。

### 内置 svelte/transition（推荐 90% 场景）

```svelte
<script>
  import { fade, fly, slide, scale, blur, crossfade } from 'svelte/transition'
  import { cubicOut, elasticOut } from 'svelte/easing'
</script>

{#if visible}
  <div transition:fly={{ y: 50, duration: 400, easing: elasticOut }}>
    Hello
  </div>
{/if}
```

零依赖，简单场景首选。

### AnimateCSS 集成

```bash
pnpm add animate.css
```

```svelte
<script>
  import 'animate.css'
</script>

<div class="animate__animated animate__bounceIn">Hello!</div>
```

## 数据获取

### SvelteKit `load`（内置首选）

详见 `advanced.md` SvelteKit 章节。SvelteKit 项目优先用 `load` —— 集成度最高。

### TanStack Query Svelte

```bash
pnpm add @tanstack/svelte-query
```

```ts
// src/routes/+layout.svelte
<script>
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
```

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const users = createQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      return res.json()
    }
  })
</script>

{#if $users.isLoading}
  <p>Loading...</p>
{:else if $users.error}
  <p>Error: {$users.error.message}</p>
{:else}
  <ul>{#each $users.data as user (user.id)}<li>{user.name}</li>{/each}</ul>
{/if}
```

适合：客户端复杂数据缓存 / 失效 / 重试 / 乐观更新场景。

## 生态对比

### Svelte vs 其他框架

| 维度 | Svelte 5 | Solid | Vue 3 | React 19 | Angular 21 |
|---|---|---|---|---|---|
| 自我定位 | 编译器框架 | 编译器框架（极致） | 渐进式 Framework | UI Library | 重型 Framework |
| 模板 | `{}` 表达式 + 控制流块 | JSX | `<template>` + 指令 | JSX | `*ngIf` / `@if` + 模板 |
| 响应式原语 | `$state` / `$derived` / `$effect` | `createSignal` / `createMemo` / `createEffect` | `ref` / `computed` / `watch` | `useState` / Compiler memo | `signal` / `computed` / `effect` |
| Virtual DOM | 无 | 无（更彻底） | 有 | 有 | 有（局部更新） |
| Bundle 大小 | 极小 | 极小 | 中等 | 较大 | 较大 |
| TypeScript | 完善（v5 起） | 完善 | 完善（v3 起） | 完善 | 一等公民 |
| 元框架 | SvelteKit | SolidStart | Nuxt | Next.js / Remix | Angular Universal |
| 国际生态 | 中等 | 较小 | 大 | 最大 | 中等 |
| 国内招聘 | 较少 | 极少 | 多 | 多 | 一般 |

**Svelte 5 vs Solid**：

- 写法 Svelte 更接近 HTML（`{#if}` / 控制流块），Solid 用 JSX（接近 React）
- 反应式 Solid 更纯粹（`createSignal` 直接返回 `[get, set]`），Svelte 5 隐藏了 getter / setter
- 生态 Svelte 更成熟（SvelteKit 比 SolidStart 更稳定）

**Svelte 5 vs Vue 3**：

- 心智模型 Svelte 更简单（无 `ref.value`、无 `<script setup>` 宏意识负担）
- 模板 Vue 更直观（`v-model` / `v-if` 一目了然），Svelte 控制流块（`{#if}`）需要适应
- 生态 Vue 大很多（Vue Router / Pinia / Element Plus / Nuxt 全官方）

**Svelte 5 vs React**：

- Bundle Svelte 小一个数量级（~10 KB vs ~45 KB）
- 心智 Svelte 极简（无 deps array / 无 Rules of Hooks）
- 生态 React 巨大（10 倍以上）；招聘也是 React 多

### Preact-Signals / SolidJS：Svelte 5 Runes 的精神近亲

Svelte 5 Runes / Solid Signals / Preact Signals 都是「**细粒度 signals**」的同一思路：

```ts
// Solid
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)
createEffect(() => console.log(count()))

// Preact Signals
const count = signal(0)
const doubled = computed(() => count.value * 2)
effect(() => console.log(count.value))

// Svelte 5
let count = $state(0)
let doubled = $derived(count * 2)
$effect(() => console.log(count))
```

**Svelte 5 的差异**：

- 编译器把 `count` 重写为 `getSignal()` / `setSignal(v)` 调用 —— 用户写普通赋值即可
- 模板里也是同样的「**自动 getter / setter**」编译，比手写 `count()` / `count.value` 更简洁

## 学习资源

### 官方

- [svelte.dev](https://svelte.dev/)（文档）
- [Svelte Tutorial](https://svelte.dev/tutorial)（交互式教程，浏览器里跑代码）
- [SvelteKit Docs](https://svelte.dev/docs/kit/introduction)
- [Svelte REPL](https://svelte.dev/playground)（在线 playground）

### 社区

- [Svelte Society](https://sveltesociety.dev/)（教程、组件、新闻）
- [Svelte Summit](https://www.sveltesummit.com/)（官方年度会议视频）
- [Svelte Society Discord](https://discord.com/invite/svelte)（最活跃 Svelte 中文 / 英文社区）
- [Svelte Hack 黑客松](https://hack.sveltesociety.dev/)
- [Reddit r/sveltejs](https://reddit.com/r/sveltejs)

### 中文社区

- [Svelte 中文社区](https://www.sveltejs.cn/)
- 国内招聘选 Svelte 较少，社区资源相对 React / Vue 少一个数量级

## 何时选 Svelte 5？

**推荐场景**：

- 中小型应用（10 万行内）—— Svelte 写起来速度快 + bundle 小，竞品 React 优势不明显
- 性能敏感（移动端 / 嵌入式 / IoT）—— Svelte bundle 比 React 小一个数量级
- 着重设计 / 动画 / 交互—— Svelte 内置 transition / animate，零依赖即可做出漂亮过渡
- 全栈一体化—— SvelteKit 路由 / SSR / Form Actions / 多 adapter 全在一个项目中
- 写 Web Component 组件库分发到不同框架 host

**不推荐场景**：

- 超大型企业级项目（>50 万行）—— 当前生态不如 React，第三方组件覆盖度不足
- 团队全是 React / Vue 老手—— 学习曲线虽低但仍有迁移成本
- 严重依赖 React Native / 现成大型 UI 库（如 AG Grid、Ant Design Pro）—— Svelte 移植版本较少
- 需要在欧美 / 国内大规模招人—— Svelte 候选人少一个数量级

## 小结

- **SvelteKit** 是 Svelte 生态的核心元框架，路由 / SSR / Form Actions / adapter 一应俱全
- **桌面端** Tauri + Svelte 是最优组合；Electron 备选；移动端用 Capacitor
- **UI 库** shadcn-svelte / Bits UI / Melt UI 适合高自定义；Skeleton / Flowbite 适合快速搭建；SVAR / Carbon 适合企业
- **i18n** svelte-i18n 易用；Paraglide 类型最强
- **样式** Tailwind / UnoCSS 与 Svelte 集成完善；内置 scoped 也足够
- **数据** SvelteKit `load` 首选；客户端复杂缓存用 TanStack Query
- **生态** 相对 React / Vue 较小，但已经覆盖大多数常用场景

下一章 `reference.md` 提供 Runes、模板、特殊组件、Stores、Actions、TypeScript 工具类型的完整 API 速查表。
