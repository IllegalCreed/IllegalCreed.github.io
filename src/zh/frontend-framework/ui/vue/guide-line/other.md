---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 微前端、Storybook、Tailwind / UnoCSS、表单库、i18n、GraphQL 客户端

## 速查

- 微前端：[qiankun](https://qiankun.umijs.org/) / [single-spa](https://single-spa.js.org/) / [wujie](https://wujie-micro.github.io/doc/) / [micro-app](https://micro-zoe.github.io/micro-app/) 都支持 Vue 子应用
- 元框架：Nuxt 是 Vue 的 SSR / SSG / 全栈解决方案，详见 [Nuxt 笔记](../../meta/nuxt/index.md)
- 跨端：Vue + Quasar / Capacitor → 移动应用；Vue + Electron / Tauri → 桌面
- Storybook：v8+ 支持 Vue 3 SFC，组件 isolated 开发与文档
- 样式：Tailwind 4 / UnoCSS 是首选；scoped CSS 仍可叠加用
- i18n：[vue-i18n](https://vue-i18n.intlify.dev/)（详见 [vue-i18n 笔记](../../others/vue-i18n/index.md)）
- 表单：[vee-validate](https://vee-validate.logaretm.com/) / [FormKit](https://formkit.com/)
- GraphQL：[Apollo Vue](https://apollo.vuejs.org/) / [urql](https://commerce.nearform.com/open-source/urql/)

## 微前端

### qiankun

蚂蚁开源、国内用得最多。基于 single-spa，主应用注册子应用：

```ts
// 主应用 main.ts
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'vue-sub-app',
    entry: '//localhost:5174',     // 子应用 url
    container: '#sub-container',
    activeRule: '/vue-app',         // 当 url 含 /vue-app 时激活
  },
])

start()
```

```ts
// 子应用 main.ts（Vue 3）
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

let app: ReturnType<typeof createApp> | null = null

function render(props: any = {}) {
  const { container } = props
  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
}

// 子应用作为独立 SPA 跑
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期
export async function bootstrap() {}
export async function mount(props: any) { render(props) }
export async function unmount() {
  app?.unmount()
  app = null
}
```

```ts
// 子应用 vite.config.ts
export default defineConfig({
  // qiankun 要求 UMD + library mode
  base: '/',
  server: {
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
})
```

::: warning Vite + qiankun 兼容

qiankun 默认要求子应用是 UMD 格式，但 Vite 输出 ESM。社区方案：

1. **[vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun)**：把 Vite ESM 转成 qiankun 能识别
2. **改用 wujie**：原生支持 Vite（基于 Web Components）

:::

### wujie（无界）

腾讯开源，基于 iframe + Web Component，**对 Vite / ESM 友好**：

```ts
// 主应用
import { startApp } from 'wujie'

startApp({
  name: 'vue-app',
  url: 'http://localhost:5174',
  el: '#sub',
  sync: true,
})
```

子应用几乎不用改 —— 直接跑独立的 Vue 项目即可。

### single-spa

更底层、跨框架的方案：

```ts
import { registerApplication, start } from 'single-spa'

registerApplication({
  name: 'vue-app',
  app: () => import('./vue-app'),
  activeWhen: '/vue',
  customProps: {},
})

start()
```

Vue 子应用包装：

```ts
// vue-app/main.ts
import { h, createApp } from 'vue'
import singleSpaVue from 'single-spa-vue'
import App from './App.vue'

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    render() { return h(App) },
  },
})

export const bootstrap = vueLifecycles.bootstrap
export const mount = vueLifecycles.mount
export const unmount = vueLifecycles.unmount
```

### micro-app

京东开源，基于 Web Components：

```html
<!-- 主应用 -->
<micro-app name="vue-app" url="http://localhost:5174/"></micro-app>
```

子应用零改造（多数情况下）。

### 对比

| 方案 | 隔离原理 | Vite 友好 | 主仓库 |
|---|---|---|---|
| **qiankun** | iframe-less + JS sandbox | ⚠️ 需插件 | [umijs/qiankun](https://github.com/umijs/qiankun) |
| **wujie** | iframe + Web Component | ✅ 原生 | [Tencent/wujie](https://github.com/Tencent/wujie) |
| **single-spa** | 各自隔离 + 共享路由 | ✅ | [single-spa/single-spa](https://github.com/single-spa/single-spa) |
| **micro-app** | Web Components + 沙箱 | ✅ | [micro-zoe/micro-app](https://github.com/micro-zoe/micro-app) |

经验：**新项目首选 wujie 或 micro-app**（对 Vite 友好）；老项目延续 qiankun。

## Nuxt 概览

Nuxt = Vue 的「全栈元框架」，提供：

- 文件路由（`pages/`）
- SSR / SSG / ISR / SWR / Hybrid 渲染
- 自动导入（components / composables / utils）
- 服务端 API（`server/api/`）
- 模块生态（`@nuxt/image` / `@nuxt/content` / `@pinia/nuxt` 等）

```bash
pnpm dlx nuxi@latest init my-app
```

```vue
<!-- pages/index.vue —— 文件即路由 -->
<script setup>
const { data } = await useFetch('/api/articles')
</script>

<template>
  <ul>
    <li v-for="article in data" :key="article.id">
      <NuxtLink :to="`/articles/${article.id}`">{{ article.title }}</NuxtLink>
    </li>
  </ul>
</template>
```

详细见 [Nuxt 笔记](../../meta/nuxt/index.md)。

## 跨端集成

### 移动应用：Quasar / Capacitor / Ionic Vue

**Quasar Framework** —— 一份代码出 SPA / SSR / PWA / iOS / Android / Electron：

```bash
pnpm create quasar
```

```vue
<template>
  <q-page>
    <q-btn label="Click" color="primary" @click="onClick" />
  </q-page>
</template>
```

**Capacitor + Vue** —— 用 Web tech 套原生壳：

```bash
pnpm add @capacitor/core @capacitor/cli
pnpm dlx cap init
pnpm dlx cap add ios
pnpm dlx cap add android
```

普通 Vue SPA → 调 `cap.run()` 套壳跑在 iOS / Android。

### 桌面应用：Electron / Tauri

**Electron-Vue** —— Web tech + Chromium 内核：

```bash
pnpm create vite my-electron -- --template vue-ts
pnpm add -D electron electron-builder
```

写主进程 + Vite 前端。Bundle 较大（含 Chromium）。

**Tauri** —— Web tech + 系统 WebView（更轻）：

```bash
pnpm create tauri-app
# 选 Vue + TypeScript
```

Bundle 通常 3-10 MB（vs Electron 80+ MB）。适合发布给最终用户的桌面工具。

### React Native（不直接支持 Vue）

Vue 在 React Native 上没原生支持。社区有 [NativeScript-Vue](https://nativescript-vue.org/) —— 但活跃度比 React Native + React 低。

### 小程序

- **[uni-app](https://uniapp.dcloud.net.cn/)**：DCloud 出品，Vue 3 写一份代码 → 微信 / 支付宝 / 抖音 / 百度小程序 + H5 + App
- **[Taro](https://taro-docs.jd.com/)**：京东出品，3.6+ 支持 Vue 3

```vue
<!-- uni-app Vue 3 -->
<template>
  <view class="container">
    <text>{{ message }}</text>
    <button @click="onTap">Tap me</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello')
function onTap() { /* ... */ }
</script>
```

## Storybook 集成

```bash
# Vite + Vue 3 项目内
pnpm dlx storybook@latest init
```

写 story：

```ts
// src/components/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Click me',
  },
}

export const Disabled: Story = {
  args: { ...Primary.args, disabled: true },
}
```

```bash
pnpm storybook   # 默认 :6006
```

::: tip Storybook 9+

最新版本支持 Vite + Vue 3 + Test Runner + AI Addon。配置自动生成。

:::

## Tailwind 集成

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

```js
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

```css
/* src/assets/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```vue
<template>
  <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Click me
  </button>
</template>
```

### Tailwind 4 注意点

Tailwind 4 用 CSS 原生 `@layer` + zero-config，无需 `tailwind.config.js`：

```css
@import "tailwindcss";

@theme {
  --color-primary: #41b883;
}
```

直接通过 `bg-primary` 引用自定义颜色。

## UnoCSS 集成

```bash
pnpm add -D unocss @unocss/preset-uno @unocss/preset-icons
```

```ts
// vite.config.ts
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
})
```

```ts
// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({ scale: 1.2 }),
  ],
  shortcuts: {
    btn: 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600',
  },
})
```

```ts
// main.ts
import 'virtual:uno.css'
```

```vue
<template>
  <button class="btn">Click me</button>
  <span class="i-carbon-notification text-xl" />
</template>
```

### UnoCSS 优势

- **按需生成**：只产出实际用到的工具类，bundle 极小
- **图标即类**：`i-carbon-*` / `i-mdi-*` 直接当 class 用，无需 SVG 文件
- **Attributify 模式**：`<div text="red 20px" font="bold" />`

::: warning pnpm 严格依赖隔离 + UnoCSS Icons

monorepo 中 `presetIcons` 自动发现可能失败，需显式 import 图标集合：

```ts
import { icons as carbonIcons } from '@iconify-json/carbon'

presetIcons({
  collections: {
    carbon: () => carbonIcons,
  },
}),
```

详见 [项目 CLAUDE.md](https://github.com/IllegalCreed) 中的「UnoCSS 图标生产构建不加载」章节。

:::

## vue-i18n 集成

```bash
pnpm add vue-i18n
```

```ts
// i18n/index.ts
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,           // 用 Composition API 模式
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: {
      hello: '你好',
      greet: '欢迎 {name}',
    },
    en: {
      hello: 'Hello',
      greet: 'Welcome {name}',
    },
  },
})

export default i18n
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'

createApp(App).use(i18n).mount('#app')
```

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

function switchLang() {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>

<template>
  <p>{{ t('hello') }}</p>
  <p>{{ t('greet', { name: 'Alice' }) }}</p>
  <button @click="switchLang">Switch</button>
</template>
```

详细见 [vue-i18n 笔记](../../others/vue-i18n/index.md)。

## 表单库

### vee-validate

```bash
pnpm add vee-validate zod @vee-validate/zod
```

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  email: z.string().email('请输入合法邮箱'),
  password: z.string().min(8, '至少 8 位'),
  age: z.number().int().min(18, '需 18 岁以上'),
}))

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: schema,
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [age, ageAttrs] = defineField('age')

const onSubmit = handleSubmit((values) => {
  console.log('valid:', values)
})
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="email" v-bind="emailAttrs" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="password" v-bind="passwordAttrs" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <input v-model="age" v-bind="ageAttrs" type="number" />
    <span v-if="errors.age">{{ errors.age }}</span>

    <button type="submit">提交</button>
  </form>
</template>
```

### FormKit

```bash
pnpm add @formkit/vue
```

```vue
<script setup>
import { FormKit } from '@formkit/vue'
</script>

<template>
  <FormKit type="form" @submit="onSubmit">
    <FormKit
      type="email"
      name="email"
      label="Email"
      validation="required|email"
    />
    <FormKit
      type="password"
      name="password"
      label="Password"
      validation="required|length:8"
    />
  </FormKit>
</template>
```

FormKit 把组件层包好——validation / a11y / 国际化都内置。

### 对比

| 库 | 风格 | 适合 |
|---|---|---|
| **vee-validate** | Headless（你写组件） | 已有 UI 库 / 完全控制 |
| **FormKit** | 组件式（拿来即用） | 快速搭建 / 后台表单 |

## GraphQL 客户端

### Apollo Vue（@apollo/client + @vue/apollo-composable）

```bash
pnpm add @apollo/client @vue/apollo-composable graphql
```

```ts
// apollo.ts
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

export const apolloClient = new ApolloClient({
  uri: 'https://api.example.com/graphql',
  cache: new InMemoryCache(),
})
```

```ts
// main.ts
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'

const app = createApp(App)
app.provide(DefaultApolloClient, apolloClient)
app.mount('#app')
```

```vue
<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const { result, loading, error } = useQuery(gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`)
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in result?.users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### urql

```bash
pnpm add @urql/vue
```

```ts
import { createClient, provideClient } from '@urql/vue'

const client = createClient({
  url: 'https://api.example.com/graphql',
})

const app = createApp(App)
provideClient(client)
app.mount('#app')
```

```vue
<script setup>
import { useQuery } from '@urql/vue'

const result = useQuery({
  query: `query { users { id name } }`,
})
</script>

<template>
  <div v-if="result.fetching">Loading...</div>
  <ul v-else>
    <li v-for="user in result.data?.users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### 对比

| 库 | 体积 | 缓存 | 主仓库 |
|---|---|---|---|
| **Apollo Client** | 大（~40KB） | 强（normalized cache） | [apollographql/apollo-client](https://github.com/apollographql/apollo-client) |
| **urql** | 小（~13KB） | 默认 document cache，可换 normalized | [urql-graphql/urql](https://github.com/urql-graphql/urql) |

经验：复杂查询缓存（同实体多查询去重）用 Apollo；小型项目 / API 简单用 urql。

## 服务端实时通信

### WebSocket + Pinia

```ts
// composables/useSocket.ts
import { ref, onUnmounted } from 'vue'

export function useSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const connected = ref(false)
  const messages = ref<string[]>([])

  function connect() {
    socket.value = new WebSocket(url)

    socket.value.onopen = () => { connected.value = true }
    socket.value.onclose = () => { connected.value = false }
    socket.value.onmessage = (e) => {
      messages.value.push(e.data)
    }
  }

  function send(msg: string) {
    socket.value?.send(msg)
  }

  function close() {
    socket.value?.close()
  }

  onUnmounted(() => close())

  return { socket, connected, messages, connect, send, close }
}
```

### Server-Sent Events (SSE)

```ts
// composables/useSSE.ts
import { ref, onUnmounted } from 'vue'

export function useSSE<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const connected = ref(false)

  const source = new EventSource(url)

  source.onopen = () => { connected.value = true }
  source.onerror = (e) => { error.value = new Error('SSE error') }
  source.onmessage = (e) => {
    data.value = JSON.parse(e.data)
  }

  onUnmounted(() => source.close())

  return { data, error, connected }
}
```

```vue
<script setup>
const { data: serverStatus } = useSSE<ServerStatus>('/api/status-stream')
</script>

<template>
  <div>Server status: {{ serverStatus?.health ?? 'connecting' }}</div>
</template>
```

## 常见陷阱速查

### 1. 解构 reactive 失去响应

```ts
// ❌
const state = reactive({ count: 0 })
const { count } = state

// ✅
const { count } = toRefs(state)
// 或干脆用 ref
const count = ref(0)
```

### 2. v-for + v-if 同元素

```vue
<!-- ❌ Vue 3 中 v-if 优先级高，循环未生效 -->
<li v-for="item in items" v-if="item.active" :key="item.id" />

<!-- ✅ -->
<li v-for="item in activeItems" :key="item.id" />
```

### 3. 模板 ref 在 onMounted 之前为 null

```ts
const el = useTemplateRef('el')

console.log(el.value)   // ❌ null（setup 阶段 DOM 还没挂）

onMounted(() => {
  console.log(el.value)   // ✅ DOM 元素
})
```

### 4. Composition API 必须在 setup 顶层调用

```ts
// ❌ setTimeout 回调里调 composable
setTimeout(() => {
  const route = useRoute()   // 报错：no current instance
}, 1000)

// ✅ 先在顶层拿到 ref，再异步用
const route = useRoute()
setTimeout(() => {
  console.log(route.params.id)
}, 1000)
```

### 5. SSR 时 window 不存在

```ts
// ❌ SSR 报错
const width = window.innerWidth

// ✅ 守卫
const width = ref(0)
onMounted(() => {
  width.value = window.innerWidth
})

// 或用 import.meta.client（Nuxt） / typeof window
if (typeof window !== 'undefined') {
  // ...
}
```

### 6. props 解构与默认值（3.5 前的坑）

Vue 3.5 之前 props 解构会失去响应性，需要 `withDefaults`：

```ts
// Vue 3.5+：可以直接解构（reactive props destructure 默认开）
const { title, count = 0 } = defineProps<Props>()

// Vue 3.4 及之前：用 withDefaults
const props = withDefaults(defineProps<Props>(), { count: 0 })
```

## 何时不选 Vue

- **团队全是 React**：人才 / 生态切换成本不小
- **依赖某个 React 库**（React Native / Next.js Server Component / 某些 SaaS）：直接选 React
- **需要 React Server Components 等先发实验性特性**：Vue 暂无对应
- **大型库迁出考虑**：Vue 3 后向 Vue 2 兼容差，Options API 到 Composition API 重写不少

经验：**新项目 + 团队中立或 Vue 优势 → 选 Vue**；其它先评估迁移 / 招聘成本。
