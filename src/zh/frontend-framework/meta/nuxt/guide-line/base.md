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
