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

## Pinia 深入

### 安装与配置

```bash
pnpm add pinia @pinia/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**', './shared/stores/**'],   // 自定义 store 目录
  },
});
```

### Composition API 风格 store（推荐）

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  // state（用 ref / reactive）
  const items = ref<Item[]>([]);
  const promoCode = ref<string | null>(null);

  // getters（用 computed）
  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  const isEmpty = computed(() => items.value.length === 0);

  // actions（普通函数）
  function add(item: Item) {
    const existing = items.value.find((i) => i.id === item.id);
    if (existing) existing.quantity++;
    else items.value.push({ ...item, quantity: 1 });
  }

  function remove(id: number) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  async function checkout() {
    const result = await $fetch('/api/checkout', {
      method: 'POST',
      body: { items: items.value, promoCode: promoCode.value },
    });
    items.value = [];
    promoCode.value = null;
    return result;
  }

  // $reset 方法自动生成
  return { items, promoCode, total, isEmpty, add, remove, checkout };
});
```

### Options API 风格（向后兼容）

```ts
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as Item[],
    promoCode: null as string | null,
  }),
  getters: {
    total: (state) => state.items.reduce((s, i) => s + i.price * i.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },
  actions: {
    add(item: Item) {
      this.items.push(item);
    },
    async checkout() {
      const result = await $fetch('/api/checkout');
      this.$reset();
      return result;
    },
  },
});
```

### 使用 store

```vue
<script setup>
const cart = useCartStore();

// 直接访问 state / getter / action
console.log(cart.items, cart.total);
cart.add({ id: 1, price: 99, quantity: 1 });

// 解构（要保留响应性）
const { items, total } = storeToRefs(cart);  // ✅ 保留响应性
const { add } = cart;                          // ✅ actions 不需要 toRefs
</script>
```

### SSR 数据 hydration

Pinia + Nuxt module 自动处理 SSR：

1. 服务端：state 序列化到 payload
2. 客户端：hydration 时从 payload 恢复 state

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);

  async function fetch() {
    user.value = await $fetch('/api/me');
  }

  return { user, fetch };
});
```

```vue
<!-- pages/index.vue -->
<script setup>
const userStore = useUserStore();
// SSR 时拉数据；hydration 后已经有了
if (!userStore.user) {
  await userStore.fetch();
}
</script>
```

### 持久化到 cookie / localStorage

```bash
pnpm add @pinia-plugin-persistedstate/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt'],
});
```

```ts
// stores/settings.ts
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light');
  const language = ref<string>('zh');

  return { theme, language };
}, {
  persist: {
    storage: piniaPluginPersistedstate.cookies({ maxAge: 60 * 60 * 24 * 365 }),
  },
});
```

支持：`cookies()`（双端可用，推荐）、`localStorage()`（仅客户端）。

### Store 间组合

```ts
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const userStore = useUserStore();     // 引用另一个 store
  const isLoggedIn = computed(() => userStore.user !== null);

  async function login(credentials) {
    const user = await $fetch('/api/login', { method: 'POST', body: credentials });
    userStore.user = user;
  }

  async function logout() {
    await $fetch('/api/logout', { method: 'POST' });
    userStore.user = null;
  }

  return { isLoggedIn, login, logout };
});
```

### Store 订阅与监听

```ts
const cart = useCartStore();

// 监听 state 变化
cart.$subscribe((mutation, state) => {
  console.log('Cart changed:', mutation.type, state);
  localStorage.setItem('cart', JSON.stringify(state));
});

// 监听 action 调用
cart.$onAction(({ name, args, after, onError }) => {
  console.log(`Action ${name} called with`, args);
  after((result) => console.log(`Action ${name} returned`, result));
  onError((err) => console.error(`Action ${name} failed`, err));
});
```

### Pinia DevTools 集成

Nuxt DevTools + Vue DevTools 都内置 Pinia 面板——查看 store 状态、时间旅行、手动触发 action。无需额外配置。

## 插件高级模式

### 异步插件

```ts
// plugins/init.ts
export default defineNuxtPlugin({
  name: 'init',
  parallel: false,                    // 等本插件完成再跑下一个
  async setup(nuxtApp) {
    // 启动时拉数据
    const config = await $fetch('/api/config');
    nuxtApp.provide('config', config);
  },
});
```

### 控制执行顺序

```ts
// plugins/01-auth.ts —— 数字前缀
// plugins/02-features.ts —— 后跑

// 或用 enforce
export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre',                     // 'pre' | 'default' | 'post'
  setup() { /* ... */ },
});
```

### Plugin Hooks 写法

```ts
export default defineNuxtPlugin({
  name: 'router-guards',
  hooks: {
    'app:created'(app) {
      console.log('App created');
    },
    'page:start'() {
      console.log('Navigation start');
    },
    'app:error'(err) {
      console.error('App error', err);
    },
  },
});
```

比 `setup() { nuxtApp.hooks.hook(...) }` 更声明式。

### Provide / Inject 类型

```ts
// plugins/echo.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      echo: (msg: string) => `[echo] ${msg}`,
      api: {
        getUsers: () => $fetch('/api/users'),
        getPosts: () => $fetch('/api/posts'),
      },
    },
  };
});
```

类型扩展：

```ts
// types/nuxt-app.d.ts
declare module '#app' {
  interface NuxtApp {
    $echo(msg: string): string;
    $api: {
      getUsers(): Promise<User[]>;
      getPosts(): Promise<Post[]>;
    };
  }
}
export {};
```

任何组件：

```vue
<script setup>
const { $echo, $api } = useNuxtApp();
const users = await $api.getUsers();
</script>
```

### 客户端 / 服务端独占插件

```
plugins/
├── analytics.client.ts    # 只在客户端跑
├── db.server.ts           # 只在服务端跑
└── theme.ts               # 双端
```

或对象语法：

```ts
export default defineNuxtPlugin({
  name: 'analytics',
  env: { islands: false },              // 不在 server-component 内跑
  setup() { /* ... */ },
});
```

### 装 Vue 插件

```ts
import VueToast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueToast, {
    position: 'bottom-right',
    timeout: 3000,
  });
});
```

### 注册全局组件 / 指令

```ts
export default defineNuxtPlugin((nuxtApp) => {
  // 全局组件（用 addComponent 更好，这里仅示意）
  nuxtApp.vueApp.component('AppButton', AppButton);

  // 全局指令
  nuxtApp.vueApp.directive('focus', {
    mounted(el) { el.focus() },
  });
});
```

::: tip 注册组件更好的方式

用 module 的 `addComponent` 在 build 时注入——支持懒加载 + 自动类型。Plugin 里 `nuxtApp.vueApp.component` 是运行时注册，影响 bundle 体积。

:::

## 错误处理深入

### 错误来源全景

```
错误来源
├── Vue 组件 setup / template 抛错      → vue:error hook
├── Vue 内部错误（如 prop 类型）         → vue:error hook
├── Nuxt App 抛错（route / lifecycle）   → app:error hook
├── 未捕获 Promise rejection             → window unhandledrejection
├── server handler 抛错（包括 createError）→ Nitro error hook + 客户端 error.vue
└── runtime fetch 错误                   → useFetch 的 error ref
```

### 全局错误页 `error.vue`

```vue
<!-- app/error.vue -->
<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    statusMessage: string;
    message: string;
    stack?: string;
    data?: any;
  };
}>();

// 上报错误
if (import.meta.client) {
  // 客户端上报
  $fetch('/api/error-report', {
    method: 'POST',
    body: {
      url: window.location.href,
      ...props.error,
    },
  }).catch(() => {});
}

function handleError() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage }}</p>
    <button @click="handleError">回首页</button>

    <details v-if="error.stack && $config.public.showStack" class="dev-info">
      <summary>错误详情</summary>
      <pre>{{ error.stack }}</pre>
    </details>
  </div>
</template>
```

### 抛 fatal 错误

```ts
// pages/articles/[id].vue
<script setup>
const route = useRoute();
const { data: article, error } = await useFetch(`/api/articles/${route.params.id}`);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? 'Server error',
    fatal: true,                                    // 走 error.vue
  });
}

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true });
}
</script>
```

### NuxtErrorBoundary 局部捕获

```vue
<template>
  <div>
    <Header />

    <NuxtErrorBoundary>
      <SidebarWidget />
      <template #error="{ error, clearError }">
        <div class="widget-error">
          <p>Widget 加载失败</p>
          <button @click="clearError">重试</button>
        </div>
      </template>
    </NuxtErrorBoundary>

    <main>
      <slot />
    </main>
  </div>
</template>
```

### server handler 内的错误

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' });
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return user;
});
```

客户端调用：

```ts
const { data, error } = await useFetch(`/api/users/${id}`);

// error.value 是 FetchError 实例
// {
//   statusCode: 404,
//   statusMessage: 'User not found',
//   data: { ... },  // server 抛 error 时 body 数据
// }
```

### 全局错误监听 plugin

```ts
// plugins/error-monitor.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Vue 组件错误
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('[vue]', err, info);
    reportError({ source: 'vue', err, info });
  };

  // Nuxt vue hook
  nuxtApp.hook('vue:error', (err) => {
    console.error('[vue:error]', err);
  });

  // Nuxt app hook
  nuxtApp.hook('app:error', (err) => {
    console.error('[app:error]', err);
    reportError({ source: 'app', err });
  });

  // 客户端独有
  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[unhandledrejection]', event.reason);
      reportError({ source: 'promise', err: event.reason });
    });

    window.addEventListener('error', (event) => {
      console.error('[window.error]', event.error);
      reportError({ source: 'window', err: event.error });
    });
  }

  function reportError(payload: any) {
    $fetch('/api/error-report', { method: 'POST', body: payload }).catch(() => {});
  }
});
```

### 区分 fatal 与非 fatal

```ts
// 1. fatal: true —— 整页错误，走 error.vue
throw createError({ statusCode: 500, fatal: true });

// 2. fatal: false（默认）—— 只抛错给调用方
throw createError({ statusCode: 500 });
// 等价：throw new Error('...');

// 3. 服务端抛 fatal 时 —— 服务端响应 500、客户端 useFetch error 字段
// 4. 客户端抛 fatal 时 —— 立即触发 error.vue
```

## Middleware 高级模式

### 异步 middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useUserStore();

  if (!user.loaded) {
    await user.fetchProfile();   // 等待用户信息
  }

  if (!user.isAuthenticated) {
    return navigateTo('/login');
  }
});
```

### 角色检查

```ts
// middleware/role.ts
export default defineNuxtRouteMiddleware((to) => {
  const required = to.meta.permissions as string[] | undefined;
  if (!required) return;

  const user = useUserStore();
  const hasAll = required.every((p) => user.permissions.includes(p));
  if (!hasAll) {
    return abortNavigation(
      createError({ statusCode: 403, statusMessage: 'Forbidden', fatal: true }),
    );
  }
});
```

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'role'],
  permissions: ['admin'],
});
</script>
```

### 阻止 navigation

```ts
// middleware/unsaved-changes.ts
export default defineNuxtRouteMiddleware(() => {
  const editor = useEditorStore();
  if (editor.hasUnsavedChanges) {
    const ok = confirm('有未保存的修改，确定离开？');
    if (!ok) return abortNavigation();
  }
});
```

### Hash 模式

```ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === from.path && to.hash !== from.hash) {
    // 只是 hash 变化（如 #section1），跳过
    return;
  }
  // 完整路由切换才执行
  trackPageView(to);
});
```

### Middleware 顺序

```vue
<script setup>
definePageMeta({
  middleware: ['log', 'auth', 'role'],   // 按数组顺序跑；前面的可 return 阻止后面跑
});
</script>
```

全局 middleware 先于命名 middleware。anonymous middleware（直接函数）在命名后。

### Middleware 内访问 store

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  // SSR + 客户端都安全
  const user = useUserStore();
  const cart = useCartStore();
  // ...
});
```

注意：middleware 默认双端跑。访问浏览器 API 要 `import.meta.client` 守卫。

## 自定义 NuxtLayout 使用

### 动态切换 layout

```vue
<script setup>
const layout = ref<string | false>('default');

function switchToAdmin() {
  layout.value = 'admin';
}

function noLayout() {
  layout.value = false;
}
</script>

<template>
  <NuxtLayout :name="layout">
    <button @click="switchToAdmin">Admin</button>
    <button @click="noLayout">No layout</button>
    <NuxtPage />
  </NuxtLayout>
</template>
```

`:name="false"` 时不套布局。

### Layout slot 传 props

```vue
<!-- layouts/admin.vue -->
<script setup>
defineProps<{ section?: string }>();
</script>

<template>
  <div class="admin">
    <AdminSidebar :section="section" />
    <main><slot /></main>
  </div>
</template>
```

```vue
<!-- pages/admin/users.vue -->
<template>
  <NuxtLayout name="admin" section="users">
    <UserList />
  </NuxtLayout>
</template>
```

### 切换 layout 时的过渡

```vue
<script setup>
definePageMeta({
  layoutTransition: { name: 'layout-fade', mode: 'out-in' },
});
</script>

<style>
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 0.3s;
}
.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
}
</style>
```

## App Config vs Runtime Config 实战

### App Config（非机密 / 构建时）

```ts
// app.config.ts
export default defineAppConfig({
  theme: {
    primary: '#3B82F6',
    dark: false,
  },
  features: {
    chat: true,
    analytics: false,
  },
  branding: {
    name: 'My App',
    logo: '/logo.svg',
  },
});
```

```vue
<script setup>
const appConfig = useAppConfig();
</script>

<template>
  <div :style="{ '--primary': appConfig.theme.primary }">
    <img :src="appConfig.branding.logo" />
    <Chat v-if="appConfig.features.chat" />
  </div>
</template>
```

特点：
- 构建时打包进 bundle
- **dev 模式 HMR 热更新**（改完不刷页面）
- 客户端 + 服务端都可读
- 类型完整推导
- **永远不放机密**

### Runtime Config（机密 / 运行时）

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 仅服务端
    githubToken: '',
    databaseUrl: '',

    // 双端
    public: {
      apiBase: '/api',
      sentryDsn: '',
      analyticsId: '',
    },
  },
});
```

环境变量覆盖（`.env`）：

```bash
NUXT_GITHUB_TOKEN=ghp_xxx
NUXT_DATABASE_URL=postgresql://...
NUXT_PUBLIC_API_BASE=https://api.production.com
NUXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

读取：

```ts
// 服务端
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  config.githubToken;             // ✅ 仅服务端
  config.public.apiBase;          // ✅ 双端

  return await $fetch('https://api.github.com/...', {
    headers: { Authorization: `Bearer ${config.githubToken}` },
  });
});

// 客户端
const config = useRuntimeConfig();
config.githubToken;                // ❌ undefined（不暴露给客户端）
config.public.apiBase;             // ✅
```

### 何时用哪个

| 场景 | App Config | Runtime Config |
|---|---|---|
| 主题色 / 品牌名 | ✅ | ❌ |
| Feature flag | ✅ | ⚠️（只有要部署后改才用） |
| API base URL | ⚠️（如果 build 时已知） | ✅（如果不同环境不同） |
| API token / 密钥 | ❌ | ✅（顶层，非 public） |
| 第三方服务 ID | ⚠️ | ✅（public） |

经验：**构建时已知 + 公开 = App Config；运行时决定 + 公开 = Public Runtime Config；构建时已知 + 私密 = 危险（不该出现）；运行时决定 + 私密 = Runtime Config 顶层**。

## 组件懒加载策略

### `Lazy` 前缀

```vue
<template>
  <!-- 普通：同步加载（首屏即下载） -->
  <HeavyChart :data="data" />

  <!-- Lazy：异步按需 -->
  <LazyHeavyChart :data="data" v-if="showChart" />
</template>
```

只在 `v-if="true"` 时才下载 `HeavyChart.vue` 的 chunk。

### `defineAsyncComponent` 手动控制

```vue
<script setup>
const HeavyChart = defineAsyncComponent({
  loader: () => import('~/components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorFallback,
  delay: 200,                    // 200ms 后才显示 loading
  timeout: 10000,                // 10s 超时
  suspensible: false,
});
</script>
```

适合需要 loading / error 自定义占位的场景。

### 仅服务端 / 仅客户端 import

```vue
<script setup>
// 仅服务端 import（客户端 bundle 不带）
if (import.meta.server) {
  const { default: pdf } = await import('puppeteer-core');
  // ...
}

// 仅客户端 import
if (import.meta.client) {
  const { default: confetti } = await import('canvas-confetti');
  confetti();
}
</script>
```

Vite 编译期能识别 `import.meta.client/server` 守卫，对应一边的代码被树摇掉。

## SEO 完整方案

### 静态 meta

```vue
<script setup>
useSeoMeta({
  title: '产品列表 - My App',
  description: '我们的产品包括…',
  ogTitle: '产品列表',
  ogDescription: '我们的产品包括…',
  ogImage: 'https://example.com/og-image.png',
  ogUrl: 'https://example.com/products',
  twitterCard: 'summary_large_image',
  twitterTitle: '产品列表',
  twitterDescription: '我们的产品包括…',
});
</script>
```

### 动态 meta

```vue
<script setup>
const route = useRoute();
const { data: article } = await useFetch(`/api/articles/${route.params.id}`);

// 响应式 meta —— article 变化时 meta 自动更新
useSeoMeta({
  title: () => article.value?.title ?? '加载中…',
  description: () => article.value?.summary,
  ogImage: () => article.value?.coverImage,
});
</script>
```

### `useServerSeoMeta` 节省 bundle

只在 SSR 注入 meta，**客户端 hydration 后不再维护**——客户端 bundle 不带这段代码。适合内容站（博客 / 新闻），用户不会动态改 meta。

```vue
<script setup>
useServerSeoMeta({
  title: 'Static page',
  description: 'Static description',
});
</script>
```

### `useHead` 全能型

```ts
useHead({
  title: 'My Page',
  titleTemplate: (title) => `${title} - My App`,    // 模板包装
  htmlAttrs: { lang: 'zh-CN', class: 'theme-dark' },
  bodyAttrs: { class: 'page-products' },
  meta: [
    { name: 'theme-color', content: '#3B82F6' },
    { 'http-equiv': 'Content-Security-Policy', content: "default-src 'self'" },
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/products' },
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'manifest', href: '/manifest.json' },
  ],
  script: [
    { src: 'https://analytics.example.com/analytics.js', async: true },
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'My Product',
      }),
    },
  ],
});
```

### Sitemap / Robots

```bash
pnpm add -D @nuxtjs/sitemap @nuxtjs/robots
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap', '@nuxtjs/robots'],
  sitemap: {
    hostname: 'https://example.com',
    gzip: true,
    routes: async () => {
      const articles = await $fetch('/api/articles');
      return articles.map((a) => `/articles/${a.id}`);
    },
  },
  robots: {
    UserAgent: '*',
    Allow: '/',
    Sitemap: 'https://example.com/sitemap.xml',
  },
});
```
