---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 布局、中间件、插件、状态管理、错误处理

## 速查

- `layouts/default.vue` 默认布局，`definePageMeta({ layout: 'admin' })` 切换
- `middleware/auth.ts` 路由守卫；`definePageMeta({ middleware: ['auth'] })` 应用
- `plugins/*.ts` 启动时跑一次（前 + 后端），可注册全局对象 / Vue 插件
- `useState(key, init)` 跨组件 SSR-safe 状态；Pinia 用 `@pinia/nuxt` 模块
- `error.vue` 全局错误页；`createError({ statusCode, fatal: true })` 触发
- `runtimeConfig` 服务端密钥；`public` 前缀的字段会暴露给客户端
- App Config（`app.config.ts`）非机密、构建时打包，可热更新

## 布局（layouts）

布局是路由间共用的「外壳」（Header / Sidebar / Footer 等）。`layouts/default.vue` 自动应用：

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <slot />              <!-- 当前页面内容 -->
    <AppFooter />
  </div>
</template>
```

页面套用：

```vue
<!-- pages/index.vue -->
<template>
  <NuxtLayout>
    <h1>Home</h1>
  </NuxtLayout>
</template>
```

或在 `app.vue` 里全局套（推荐）：

```vue
<!-- app/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

切换不同布局：

```vue
<!-- pages/admin/index.vue -->
<script setup>
definePageMeta({ layout: 'admin' });
</script>
```

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="admin-shell">
    <AdminSidebar />
    <main><slot /></main>
  </div>
</template>
```

动态切换：

```vue
<script setup>
const layout = ref<string | false>('default');
</script>

<template>
  <NuxtLayout :name="layout">
    <NuxtPage />
  </NuxtLayout>
</template>
```

`:name="false"` 表示不套布局。

## 中间件（middleware）

### 三种类型

| 类型             | 文件位置              | 何时跑                          |
| ---------------- | --------------------- | ------------------------------- |
| Anonymous        | `definePageMeta` 内    | 仅该页跑                        |
| Named            | `middleware/auth.ts`  | `definePageMeta({ middleware })` 引用 |
| Global           | `middleware/auth.global.ts` | 每次路由切换都跑（前缀 `.global`） |

### 基础写法

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser();
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');           // 重定向
  }
  // 不返回 = 放行
});
```

返回值含义：

- `undefined` / 不返回：放行
- `navigateTo('/x')`：重定向
- `abortNavigation('msg')`：中止 + 抛错
- `abortNavigation(error)`：中止 + 触发 error.vue

### 应用到页面

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'admin-only'],     // 按数组顺序跑
});
</script>
```

### 全局中间件

```ts
// middleware/log.global.ts
export default defineNuxtRouteMiddleware((to) => {
  console.log('navigating to', to.path);
});
```

::: warning SSR 期间中间件也会跑

middleware 是双端的（服务端 + 客户端各一次）。`window` / `localStorage` 访问要用 `import.meta.client` 守卫：

```ts
if (import.meta.client) {
  localStorage.getItem('token');
}
```

:::

## 插件（plugins）

`plugins/` 目录下的文件在 Nuxt 启动时跑一次。常用于注册 Vue 插件、全局对象、provide 注入。

### 基础写法

```ts
// plugins/echo.ts
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      echo: (msg: string) => `[echo] ${msg}`,
    },
  };
});
```

任何组件用：

```vue
<script setup>
const { $echo } = useNuxtApp();
console.log($echo('hello'));
</script>
```

### 仅客户端 / 仅服务端

```
plugins/
├── analytics.client.ts   # 只在客户端跑
├── db.server.ts          # 只在服务端跑
└── theme.ts              # 双端
```

### 注册 Vue 插件 / 全局组件

```ts
// plugins/vue-toast.ts
import Toast from 'vue-toastification';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, { /* options */ });
});
```

### 控制插件执行顺序

```ts
// plugins/01-foo.ts —— 数字前缀决定顺序
// plugins/02-bar.ts —— 后跑
```

或用对象语法：

```ts
export default defineNuxtPlugin({
  name: 'my-plugin',
  enforce: 'pre',  // 'pre' | 'default' | 'post'
  parallel: false,  // 默认串行
  async setup(nuxtApp) {
    // ...
  },
});
```

## 状态管理

### `useState`：SSR-safe 的最小方案

```ts
// composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null);
}
```

- 第一个参数 `key` 是序列化标识——SSR 时把 state 序到 payload，客户端用 key 找回
- 第二个参数是 init 函数（只在第一次创建时跑）
- 跨组件共享：任何组件 `const user = useUser()`，拿到同一份 ref

### Pinia（推荐用于复杂状态）

安装：

```bash
pnpm add pinia @pinia/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
});
```

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([]);
  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0));

  function add(item: Item) {
    items.value.push(item);
  }

  return { items, total, add };
});
```

```vue
<script setup>
const cart = useCartStore();
</script>

<template>
  <span>购物车 ({{ cart.items.length }})</span>
</template>
```

Pinia 自带 SSR 支持，Nuxt module 自动注册 → 不需要手写 store 序列化。

### `useFetch` 也是状态

很多场景下「请求来的数据」本身就是状态。`useFetch` 内部就是 `useAsyncData` + payload 序列化，可以当作只读状态用——同 key 多个组件共享。

```ts
// 共享当前用户
const useCurrentUser = () =>
  useAsyncData('current-user', () => $fetch('/api/me'), {
    server: true,
  });
```

## 运行时配置（runtimeConfig）

服务端机密 + 客户端可读公共配置：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 仅服务端
    apiSecret: '',                 // 默认空，跑时由 env 覆盖
    githubToken: '',

    // 客户端 + 服务端 都可见
    public: {
      apiBase: '/api',
      appName: 'My App',
    },
  },
});
```

环境变量覆盖（驼峰转大写下划线 + `NUXT_` 前缀）：

```bash
NUXT_API_SECRET=xxxxxx
NUXT_PUBLIC_API_BASE=https://api.example.com
```

读取：

```ts
// 服务端（server/api/x.ts）
const config = useRuntimeConfig(event);
config.apiSecret  // 仅服务端能读
config.public.apiBase

// 客户端 / 组件
const config = useRuntimeConfig();
config.public.apiBase  // ✅
config.apiSecret       // undefined，不会暴露
```

::: warning runtimeConfig vs env

- `runtimeConfig` 在**运行时**读，部署后可改环境变量不需重新 build
- `process.env.X` 是**构建时**替换的常量，部署后改了不生效（除非 rebuild）
- 生产用 `runtimeConfig`，本地脚手架用 `process.env` 都可

:::

## App Config（应用配置）

`app.config.ts` 与 `runtimeConfig` 不同——它是**构建时打包**的、可在客户端读且可被运行时**热更新**：

```ts
// app.config.ts
export default defineAppConfig({
  title: 'My App',
  theme: {
    primary: '#3B82F6',
    dark: false,
  },
});
```

```vue
<script setup>
const appConfig = useAppConfig();
</script>

<template>
  <div :style="{ color: appConfig.theme.primary }">{{ appConfig.title }}</div>
</template>
```

适合：**非机密 UI 主题、品牌名、feature flag 类配置**。Pinia / cookies 之外的轻量公共状态。

## 错误处理

### 全局错误页

`error.vue` 放在 `app/` 根（与 `app.vue` 同级），自动接管致命错误：

```vue
<!-- app/error.vue -->
<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    statusMessage: string;
    message: string;
  };
}>();

function handleError() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage }}</p>
    <button @click="handleError">回首页</button>
  </div>
</template>
```

`clearError()` 清除错误状态；`clearError({ redirect: '/' })` 同时跳转。

### 抛出 fatal 错误

```ts
throw createError({
  statusCode: 404,
  statusMessage: 'Article Not Found',
  fatal: true,    // true 时走 error.vue
});
```

`fatal: false`（默认）只是 throw 普通 Error，组件可 try/catch。

### 错误边界

```vue
<template>
  <NuxtErrorBoundary @error="onError">
    <SomeFlakyComponent />

    <template #error="{ error, clearError }">
      <p>这块组件挂了：{{ error }}</p>
      <button @click="clearError">重试</button>
    </template>
  </NuxtErrorBoundary>
</template>
```

适合：**单个组件挂了不想让整页跪**——比如第三方 widget。

## 组件懒加载

```vue
<template>
  <!-- 自动 lazy import；显示前显示 fallback slot -->
  <LazyHeavyChart v-if="show" />
</template>
```

只要前缀 `Lazy`，Nuxt 自动按需 import。也可以手动 `defineAsyncComponent`：

```ts
const HeavyChart = defineAsyncComponent(() =>
  import('~/components/HeavyChart.vue'),
);
```

## 客户端 / 服务端守卫

`import.meta.client` / `import.meta.server` 是构建时常量，Vite 会在对应 bundle 里树摇掉另一边代码：

```ts
if (import.meta.server) {
  // 只在 SSR 时跑
}

if (import.meta.client) {
  // 只在浏览器跑
  window.addEventListener('resize', ...);
}
```

`<ClientOnly>` 组件包住的内容**只在客户端渲染**——适合直接用 `window` 的第三方库：

```vue
<ClientOnly>
  <SomeBrowserOnlyWidget />
  <template #fallback>
    <div>Loading...</div>
  </template>
</ClientOnly>
```
