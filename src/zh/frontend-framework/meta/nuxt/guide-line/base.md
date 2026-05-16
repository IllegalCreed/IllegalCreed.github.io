---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 Nuxt 4.4.x 编写 — 自动导入、文件路由、数据获取的常用法

## 速查

- 自动导入：`components/` / `composables/` / `utils/` 自动 import；Vue API（`ref` / `computed` / 生命周期）自动可用
- 路由：`pages/index.vue` → `/`、`pages/[id].vue` → `/:id`、`pages/[...slug].vue` → catch-all、`pages/[[id]].vue` → 可选参数
- 导航：`<NuxtLink to>` 组件 / `navigateTo()` 函数；走 `vue-router` + 预加载
- `definePageMeta` 给页面声明 layout / middleware / keepalive / pageTransition 等
- 数据获取：`useFetch(url)` / `useAsyncData(key, fn)` / `$fetch(url)`（不带响应式）
- SSR + payload：服务端拉数据 → 序列化到 HTML → 客户端 hydration 复用，避免重复请求
- `useRoute()` / `useRouter()` 取路由信息 / 导航；`useRequestHeaders()` 取请求头
- 直接用 `console.log`：服务端日志进终端，客户端进浏览器

## 自动导入

### 哪些会被自动导入

| 来源                | 内容                                      | 命名规则                         |
| ------------------- | ----------------------------------------- | -------------------------------- |
| `app/components/`   | Vue 组件                                  | 嵌套目录会拼前缀（`base/Card.vue` → `<BaseCard />`） |
| `app/composables/`  | 任意 `export` 的函数（约定以 `use` 开头）  | 文件名即 export 名               |
| `app/utils/`        | 任意 `export` 的纯函数                    | 文件名 / export 名               |
| Vue 内置            | `ref` / `computed` / `watch` / `onMounted` / `defineProps` 等 | 框架级注入            |
| Nuxt 内置           | `useFetch` / `useAsyncData` / `useState` / `useRoute` 等 | 框架级注入                |
| `server/utils/`     | 服务端工具（仅 server/ 内可用）           | 文件名 / export 名               |

例子：

```ts
// app/composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null);
}
```

```vue
<!-- 任何组件直接用，不需要 import -->
<script setup lang="ts">
const user = useUser();
</script>
```

### `#imports` 显式导入

如果不喜欢魔法，可以走显式 import 路径：

```ts
import { ref, computed } from '#imports';
```

或者 nuxt.config 里关掉自动导入：

```ts
export default defineNuxtConfig({
  imports: {
    autoImport: false, // 全关
    // 或部分关：scan: false 让框架 API 还自动，但自定义 composables 要手动
  },
});
```

::: warning composable 调用上下文

自动导入的 composable 必须在**正确的生命周期上下文**里调用——`<script setup>` 顶层、`useAsyncData` 回调、`defineNuxtPlugin` 内、route middleware 内。在普通函数 / setTimeout 里调会报「Nuxt instance is unavailable」。

:::

## 文件路由

### 文件 ↔ URL 映射

```
pages/
├── index.vue              → /
├── about.vue              → /about
├── users/
│   ├── index.vue          → /users
│   └── [id].vue           → /users/:id
├── posts/
│   └── [...slug].vue      → /posts/* （所有子路径都匹配）
├── settings/
│   └── [[tab]].vue        → /settings 和 /settings/:tab 都匹配
└── (marketing)/
    └── pricing.vue        → /pricing （括号目录不进 URL，只组织文件）
```

### 嵌套路由

父级要带 `<NuxtPage />` 才能渲染子路由：

```
pages/
├── dashboard.vue          → /dashboard （父）
└── dashboard/
    ├── index.vue          → /dashboard （默认子）
    └── settings.vue       → /dashboard/settings
```

```vue
<!-- pages/dashboard.vue -->
<template>
  <div>
    <DashboardSidebar />
    <NuxtPage />  <!-- 子路由渲染在这里 -->
  </div>
</template>
```

### 路由参数

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
console.log(route.params.id); // 字符串
console.log(route.query.tab); // ?tab=info → 'info'
</script>
```

### `definePageMeta` 声明元数据

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',           // 用 layouts/admin.vue
  middleware: 'auth',         // 跑 middleware/auth.ts
  alias: ['/home', '/start'], // 路由别名
  keepalive: true,            // <KeepAlive> 缓存组件
  pageTransition: { name: 'slide', mode: 'out-in' },
  validate: (route) => /^\d+$/.test(route.params.id as string),
});
</script>
```

### 导航

```vue
<template>
  <!-- 组件式：自动预加载 + 高亮当前 -->
  <NuxtLink to="/about">About</NuxtLink>
  <NuxtLink :to="{ path: '/users', query: { sort: 'name' } }">Users</NuxtLink>

  <!-- 外链：自动加 rel="noopener" -->
  <NuxtLink href="https://nuxt.com" external target="_blank">Docs</NuxtLink>
</template>
```

```ts
// 程序式
await navigateTo('/login');
await navigateTo({ path: '/search', query: { q: 'nuxt' } });
return navigateTo('/dashboard', { replace: true }); // 在中间件里 return 即可
```

## 数据获取

### useFetch：URL 即 key 的简写

```vue
<script setup lang="ts">
const { data, pending, error, refresh, status } = await useFetch('/api/articles', {
  query: { limit: 10 },            // ?limit=10
  method: 'GET',
  headers: { 'X-Custom': '1' },
  transform: (raw) => raw.items,    // 改造响应
  pick: ['id', 'title'],            // 只挑字段
  default: () => [],                // SSR pending 时的占位
  watch: [page],                    // 依赖变化自动 refetch
  immediate: true,                  // 立刻请求（默认 true）
  server: true,                     // 是否在 SSR 时请求（默认 true）
  lazy: false,                      // true 时不阻塞 navigation
});
</script>
```

::: tip useFetch 自动 key

URL + 选项的哈希作为 key。相同 URL 的两个组件会**共享 data / status**，最后一个组件卸载时数据释放（Nuxt 4 新行为）。

:::

### useAsyncData：自定义 fetcher

```ts
const { data: user } = await useAsyncData('user-me', () =>
  $fetch('/api/me', { credentials: 'include' }),
);

// 复合请求
const { data } = await useAsyncData('dashboard', async () => {
  const [user, stats] = await Promise.all([
    $fetch('/api/me'),
    $fetch('/api/stats'),
  ]);
  return { user, stats };
});
```

**key 是必填**。两个组件用同 key 会共享数据；用不同 key 各取各的。

### $fetch：底层调用

不要响应式数据时用 `$fetch`（底层是 [ofetch](https://github.com/unjs/ofetch)）：

```ts
// 触发后端 mutation
async function deleteArticle(id: number) {
  await $fetch(`/api/articles/${id}`, { method: 'DELETE' });
  refresh(); // 让 useFetch 重新拉
}
```

::: warning useFetch vs $fetch 何时用

- **`useFetch` / `useAsyncData`**：页面 / 组件级的「**显示数据**」——SSR + payload + 响应式。不要在 mutation（删 / 改）里用
- **`$fetch`**：mutation、监听器内、`onMounted` 后才发起的请求

错用 useFetch 处理 mutation 会触发各种「重复请求 / hydration mismatch」奇怪问题。

:::

### 错误处理

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/might-fail');

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? 'Server error',
    fatal: true,  // 走 error.vue
  });
}
</script>
```

或在页面里 graceful 显示：

```vue
<template>
  <div v-if="error">出错了：{{ error.message }}</div>
  <div v-else>{{ data }}</div>
</template>
```

## 路由相关 composables

| Composable          | 作用                                  |
| ------------------- | ------------------------------------- |
| `useRoute()`        | 当前路由（响应式 readonly）：params / query / fullPath / meta |
| `useRouter()`       | 路由器实例：`push` / `replace` / `back` / `forward` |
| `useRequestHeaders(['cookie', 'host'])` | 取请求头（**仅 SSR**） |
| `useRequestURL()`   | 当前请求完整 URL（SSR + 客户端通用）   |
| `useCookie('name', options)`  | 双端通用 cookie 读写        |
| `useState(key, init)` | 跨组件共享的响应式状态（SSR 安全）   |

::: tip useCookie 是 reactive ref

```ts
const counter = useCookie('counter', { default: () => 0 });
counter.value++; // 自动写回 cookie
```

服务端：写入 Set-Cookie 响应头。客户端：写入 `document.cookie`。

:::

## 常用 NuxtLink 选项

```vue
<NuxtLink
  to="/products"
  prefetch                           <!-- 预加载（默认 true，可关） -->
  no-prefetch                        <!-- 关闭预加载 -->
  prefetch-on="interaction"          <!-- 仅在 hover / focus 时预加载 -->
  active-class="my-active"
  exact-active-class="my-exact"
  external                            <!-- 强制外链（不走 vue-router） -->
  replace                             <!-- 用 router.replace 而非 push -->
>
  Products
</NuxtLink>
```

`prefetch-on="interaction"` 是 Nuxt 4 新增——避免首屏所有 NuxtLink 同时拉资源，节省流量。

## `app.vue` 与全局结构

```vue
<!-- app/app.vue -->
<template>
  <div>
    <Header />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Footer />
  </div>
</template>
```

- `<NuxtPage />`：渲染当前路由对应的页面
- `<NuxtLayout>`：套布局（默认 `default.vue`，可在 `definePageMeta({ layout })` 里换）
- `<NuxtLoadingIndicator />`：页面切换时的顶部进度条
- `<NuxtErrorBoundary>`：错误边界（细粒度捕获）

也可以**不要 `app.vue`**——Nuxt 会自动用 `<NuxtPage />` 兜底。但加一份可以放全局 layout / loading / 错误处理。

## `useFetch` 完整参数清单

```ts
const { data, pending, error, refresh, execute, status, clear } = await useFetch(url, {
  // 请求
  method: 'GET',                       // HTTP 方法
  query: { page: 1 },                   // ?page=1
  params: { id: 1 },                    // 等价 query
  body: { foo: 'bar' },                 // POST/PUT body
  headers: { 'X-Custom': '1' },         // 请求头

  // 缓存 / 行为
  key: 'custom-key',                    // 覆盖默认 URL key
  default: () => [],                    // pending 时占位值
  transform: (raw) => raw.items,        // 改造响应（存 payload 前）
  pick: ['id', 'title'],                // 只挑顶层字段
  deep: true,                            // 数据深响应（默认 false，shallowRef）
  dedupe: 'cancel' | 'defer',           // 并发请求去重策略
  getCachedData: (key, app, ctx) => /* return cached */,

  // 触发
  watch: [ref1, ref2],                  // 依赖变化自动 refetch
  immediate: true,                       // 立刻请求（默认 true）
  lazy: false,                           // true 时不阻塞导航
  server: true,                          // 是否在 SSR 请求（默认 true）

  // ofetch 透传
  onRequest: ({ request, options }) => {},
  onRequestError: ({ error }) => {},
  onResponse: ({ response, request }) => {},
  onResponseError: ({ response }) => {},
  retry: 3,                             // 失败重试
  retryDelay: 1000,                      // 重试间隔（ms）
  timeout: 5000,                         // 请求超时（ms）

  // 仅 useFetch 特有
  $fetch: customFetcher,                 // 替换底层 $fetch
});
```

返回字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `data` | `Ref<T \| null>` | 响应数据；pending 时是 `default()` 的值 |
| `pending` | `Ref<boolean>` | 请求进行中（v4 中只在真正发请求时 true） |
| `status` | `Ref<'idle' \| 'pending' \| 'success' \| 'error'>` | 状态机 |
| `error` | `Ref<Error \| null>` | 错误对象 |
| `refresh()` | function | 主动重新拉取（保留旧 data 直到新到） |
| `execute()` | function | 同 refresh，命名更明显 |
| `clear()` | function | 清空 data + error，重置 status |

## useAsyncData 完整选项

`useAsyncData<T>(key, fn, opts)` 选项与 `useFetch` 大致相同，差别：

| 字段 | useFetch | useAsyncData |
|---|---|---|
| 第一参 | url | key（手动） |
| 第二参 | options | async function |
| 第三参 | - | options |
| URL 字段 | 有 | 无 |
| method / body / headers / query | 有 | 无（自己在 fn 内传） |

例：

```ts
const { data } = await useAsyncData('dashboard', async () => {
  const [user, stats] = await Promise.all([
    $fetch('/api/me'),
    $fetch('/api/stats'),
  ]);
  return { user, stats };
}, {
  default: () => ({ user: null, stats: null }),
  watch: [refresh],
});
```

## NuxtLink 完整属性表

| 属性 | 类型 | 说明 |
|---|---|---|
| `to` | string / RouteLocation | 目标路由（必填，除非用 `href`） |
| `href` | string | 同 `to`（与原生 `<a href>` 兼容） |
| `external` | boolean | 强制走 `<a href>` 整页跳转 |
| `replace` | boolean | 用 router.replace 不进历史 |
| `activeClass` | string | 路由匹配时的 class |
| `exactActiveClass` | string | 完全匹配时的 class（不含子路由） |
| `prefetch` | boolean | 是否预加载（默认 true） |
| `noPrefetch` | boolean | 关闭预加载（简写） |
| `prefetchOn` | `'visibility' \| 'interaction'` | 预加载触发条件 |
| `prefetchedClass` | string | 预加载完成的 class |
| `custom` | boolean | 用 slot props 完全自定义渲染 |
| `target` | string | `_blank` 自动加 `rel="noopener noreferrer"` |
| `rel` | string | 自定义 rel（覆盖自动加的） |
| `ariaCurrentValue` | string | 无障碍 aria-current 值 |

### 完全自定义 NuxtLink

```vue
<NuxtLink to="/about" custom v-slot="{ href, navigate, isActive }">
  <li :class="{ active: isActive }">
    <a :href="href" @click="navigate">About</a>
  </li>
</NuxtLink>
```

### 预加载策略

```vue
<!-- 1. 默认：视口可见时预加载 -->
<NuxtLink to="/about">About</NuxtLink>

<!-- 2. 仅 hover / focus 预加载（首屏链接多时省流量） -->
<NuxtLink to="/about" prefetch-on="interaction">About</NuxtLink>

<!-- 3. 显式关闭预加载 -->
<NuxtLink to="/about" no-prefetch>About</NuxtLink>
```

全局设置：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    defaults: {
      nuxtLink: {
        prefetchOn: { interaction: true },  // 全局改默认
      },
    },
  },
});
```

## definePageMeta 完整字段

```vue
<script setup>
definePageMeta({
  // 布局 / 中间件
  layout: 'admin' | false,                 // 用哪个 layout / false 表示不套
  middleware: ['auth', 'role-check'],       // 跑哪些 middleware
  validate: (route) => boolean,             // 路径参数校验，返回 false 触发 404

  // 缓存 / 动画
  keepalive: true | { include, exclude },   // <KeepAlive> 配置
  pageTransition: { name, mode } | false,   // 页面过渡动画
  layoutTransition: { name, mode } | false, // 布局过渡

  // 路由
  alias: '/home' | ['/home', '/start'],     // 路由别名
  redirect: '/new-path',                    // 路由级重定向
  name: 'custom-name',                       // 路由名（默认按文件路径推）

  // 渲染 / 性能
  scrollToTop: boolean | function,          // 切换时是否滚到顶部
  key: (route) => string,                    // <NuxtPage :page-key> 用

  // Nuxt 4 新增
  interruptible: true,                       // 切换时取消当前未完成的 useFetch

  // 任意自定义字段（透传到 route.meta）
  requiresAuth: true,
  permissions: ['admin'],
});
</script>
```

::: warning `definePageMeta` 是编译期宏

里面**只能用字面量**——不能引用 `ref` / `useRoute()` / `props` 等运行时值。需要动态行为，把判断放到 `validate` 或 middleware 内。

:::

## `useCookie` 完整选项

```ts
const cookie = useCookie<T>('name', {
  default: () => 'fallback',         // 没读到时的默认值
  maxAge: 60 * 60 * 24,              // 秒
  expires: new Date(...),             // Date 对象
  httpOnly: true,                     // JS 无法读（仅服务端写时可设）
  secure: true,                       // 仅 HTTPS
  sameSite: 'lax' | 'strict' | 'none',// SameSite 策略
  domain: '.example.com',             // 域
  path: '/',                          // 路径
  encode: (v) => string,              // 自定义编码
  decode: (v) => T,                   // 自定义解码
  readonly: true,                     // 只读模式
  watch: 'shallow' | false,           // watch 模式
});

// 用法 = 普通 ref
cookie.value;                          // 读
cookie.value = 'new-value';            // 写（自动同步到 cookie）
```

::: warning `httpOnly` 限制

`useCookie('x', { httpOnly: true })` 在客户端**写入**时不会生效——`document.cookie` 写不了 httpOnly。要服务端 `setCookie(event, 'x', val, { httpOnly: true })` 配合。`useCookie` 客户端读 httpOnly cookie 时拿不到值（默认）。

:::

## `useState` 进阶

### 必须给 key 的原因

```ts
// ❌ 无 key —— SSR 时多个组件共享同一份未命名 state，相互覆盖
const counter = useState(() => 0);

// ✅ 给唯一 key —— SSR payload 按 key 索引
const counter = useState('counter', () => 0);
```

### 跨组件共享

```ts
// composables/useCart.ts
export function useCart() {
  return useState<Item[]>('cart.items', () => []);
}
```

任何组件调 `useCart()` 拿到**同一份 ref**：

```vue
<!-- Component A -->
<script setup>
const cart = useCart();
cart.value.push(item);
</script>

<!-- Component B（同时挂载）-->
<script setup>
const cart = useCart();
console.log(cart.value);   // 看到 Component A 加的 item
</script>
```

### 重置到初始值

```ts
import { clearNuxtState } from '#imports';
clearNuxtState('cart.items');         // 重置到 init 值
clearNuxtState(['cart.items', 'user']); // 多个
clearNuxtState();                      // 全部
```

### Lazy 初始化

```ts
const user = useState<User | null>('user', () => null);
// init 函数仅在首次创建时跑，后续调用返回同一 ref
```

## 嵌套路由进阶

### 父子页面共用 layout 状态

```
pages/
├── settings.vue         → /settings/* 的父级（含 sidebar）
└── settings/
    ├── profile.vue      → /settings/profile
    ├── security.vue     → /settings/security
    └── notifications.vue → /settings/notifications
```

```vue
<!-- pages/settings.vue -->
<script setup>
const activeTab = ref('profile');  // 多个子页共享
</script>

<template>
  <div class="settings-shell">
    <nav>
      <NuxtLink to="/settings/profile">个人</NuxtLink>
      <NuxtLink to="/settings/security">安全</NuxtLink>
      <NuxtLink to="/settings/notifications">通知</NuxtLink>
    </nav>
    <main>
      <NuxtPage :active-tab="activeTab" />
    </main>
  </div>
</template>
```

子页通过 props 接收：

```vue
<!-- pages/settings/profile.vue -->
<script setup>
const props = defineProps<{ activeTab: string }>();
</script>
```

### NuxtPage 的 page-key

控制子路由切换时是否复用组件：

```vue
<!-- 切换不同 :id 时强制重新挂载（fetch 重跑） -->
<NuxtPage :page-key="(route) => route.fullPath" />

<!-- 默认按组件本身（同组件复用） -->
<NuxtPage />
```

或在子 page 用 `definePageMeta({ key: route => route.fullPath })`。

### 单根元素约束

```vue
<!-- ❌ 多根，触发 vue-router 警告 -->
<template>
  <h1>Title</h1>
  <p>Content</p>
</template>

<!-- ✅ 单根 -->
<template>
  <div>
    <h1>Title</h1>
    <p>Content</p>
  </div>
</template>
```

原因：transition 动画需要确定的根节点。Vue 3 fragments 在普通组件中支持但 Nuxt page 不行。

## 路由组（route groups）

括号目录**不出现在 URL** 中，只用来组织文件：

```
pages/
├── (marketing)/
│   ├── about.vue           → /about
│   └── pricing.vue         → /pricing
└── (admin)/
    └── dashboard.vue       → /dashboard
```

特别用法：**不同组用不同 layout**：

```vue
<!-- pages/(marketing)/about.vue -->
<script setup>
definePageMeta({ layout: 'marketing' });
</script>
```

```vue
<!-- pages/(admin)/dashboard.vue -->
<script setup>
definePageMeta({ layout: 'admin' });
</script>
```

URL 还是 `/about` / `/dashboard`，但目录分隔了关注点。

## 客户端 / 服务端守卫总结

```vue
<script setup>
// 1. 编译期常量（推荐，Vite 树摇）
if (import.meta.client) {
  // 只在客户端执行
}
if (import.meta.server) {
  // 只在服务端执行
}

// 2. 等价的 process（兼容，但 Vite 树摇没那么干净）
if (process.client) { /* ... */ }
if (process.server) { /* ... */ }

// 3. 等价的 import.meta.dev / prod
if (import.meta.dev) {
  // 仅开发模式
}

// 4. 运行时检测（不能树摇）
if (typeof window !== 'undefined') { /* ... */ }
</script>
```

优先级：`import.meta.client/server` > `process.client/server` > `typeof window`。

### `<ClientOnly>` 三种典型

```vue
<!-- 1. 简单包裹：SSR 时不渲染，hydration 后才出现 -->
<ClientOnly>
  <BrowserOnlyWidget />
</ClientOnly>

<!-- 2. 含 fallback：SSR 时显示占位 -->
<ClientOnly>
  <BrowserChart :data="data" />
  <template #fallback>
    <div class="chart-skeleton">加载中...</div>
  </template>
</ClientOnly>

<!-- 3. 显式 placeholder -->
<ClientOnly placeholder="loading" placeholder-tag="span">
  <Widget />
</ClientOnly>
```

## 数据请求最佳实践

### 显示类 vs 操作类

| 场景 | API |
|---|---|
| 页面 setup 内显示数据 | `useFetch` / `useAsyncData` |
| 用户操作后发请求（保存 / 删除 / 上传） | `$fetch` |
| 监听器内、`onMounted` 之后 | `$fetch` |
| 需要响应式 + 派生 | `useAsyncData` + `computed` |
| 复合多个请求 | `useAsyncData` + `Promise.all` |

### 错误隔离

```vue
<script setup>
const { data, error } = await useFetch('/api/articles');

// 优雅降级，不让单个 API 失败拖垮整页
const fallbackData = computed(() => data.value ?? []);
</script>

<template>
  <div v-if="error" class="error-banner">{{ error.statusMessage }}</div>
  <ul>
    <li v-for="item in fallbackData" :key="item.id">{{ item.title }}</li>
  </ul>
</template>
```

致命错误（无法继续）：

```ts
if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Server unavailable',
    fatal: true,        // 走 error.vue 全局错误页
  });
}
```

### 复用同一份数据

多组件需要同样数据时，用同 key：

```ts
// composables/useCurrentUser.ts
export const useCurrentUser = () =>
  useAsyncData('current-user', () => $fetch('/api/me'));
```

任意组件：

```ts
const { data: user } = await useCurrentUser();
// 多组件并发调用 = 共享一次请求
```

Nuxt 4 默认 dedupe = 'cancel'（新请求取消旧的）；改 `dedupe: 'defer'` 让多次调用共享同一 promise。
