---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Nuxt 4.4.x 编写 — CLI / 配置项 / 内置 composables / Nitro utils 速查

## CLI

```bash
# nuxi 命令（也可写 nuxt）
pnpm dlx nuxi <command>
```

| 命令 | 作用 |
|---|---|
| `init <dir>` | 创建新项目（交互式） |
| `dev` | 启动开发服务器（HMR） |
| `build` | 构建生产产物到 `.output/` |
| `generate` | 全站 SSG 预渲染 |
| `preview` | 预览构建产物 |
| `prepare` | 生成 `.nuxt/` 类型 + 文件（IDE / CI 用） |
| `typecheck` | `vue-tsc --noEmit` |
| `upgrade` | 升级 Nuxt 到 latest |
| `info` | 打印环境信息（Node / Nuxt 版本 / 模块） |
| `add page <name>` | 生成 page 模板 |
| `add component <name>` | 生成 component 模板 |
| `add layer <name>` | 生成 layer |
| `module add <name>` | 安装 + 启用模块 |
| `cleanup` | 删除 `.nuxt` / `.output` / `node_modules/.cache` |
| `analyze` | 分析 bundle 体积 |

## 主要配置项（nuxt.config.ts）

```ts
export default defineNuxtConfig({
  // 兼容性日期，控制 Nuxt 行为版本
  compatibilityDate: '2026-05-15',

  // 开关 SSR
  ssr: true,                              // 默认 true；false 走 SPA

  // 应用元信息
  app: {
    head: {
      title: 'My App',
      meta: [{ name: 'description', content: '...' }],
      link: [{ rel: 'icon', href: '/favicon.ico' }],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    keepalive: true,
  },

  // 模块
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
  ],

  // 运行时配置
  runtimeConfig: {
    apiSecret: '',          // server-only
    public: {                // 双端
      apiBase: '/api',
    },
  },

  // 路由规则（hybrid 渲染）
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
  },

  // Nitro
  nitro: {
    preset: 'node-server',
    prerender: {
      routes: ['/sitemap.xml'],
      crawlLinks: true,
    },
    storage: {
      // 用 KV / Redis 做服务端缓存
    },
  },

  // 自动导入
  imports: {
    autoImport: true,
    dirs: ['stores'],                     // 额外扫描目录
  },

  // 组件
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  // CSS 全局
  css: ['~/assets/css/main.css'],

  // Vite 配置
  vite: {
    server: {
      hmr: { protocol: 'ws', host: 'localhost' },
    },
  },

  // 实验性
  experimental: {
    typedPages: true,                     // typed router
    appManifest: true,
  },
});
```

## 内置 composables 速查

### 数据 / 状态

| 函数 | 作用 |
|---|---|
| `useFetch(url, opts?)` | URL 当 key 的取数；SSR + 客户端复用 payload |
| `useAsyncData(key, fn, opts?)` | 任意 async + 显式 key |
| `useLazyFetch(url)` | `useFetch` + `lazy: true` |
| `useLazyAsyncData(key, fn)` | `useAsyncData` + `lazy: true` |
| `$fetch(url, opts?)` | 直接调用（ofetch），无响应式 |
| `useState(key, init)` | SSR-safe 跨组件共享 ref |
| `useNuxtData(key)` | 拿到现有 useFetch / useAsyncData 的数据（不重发请求） |
| `useNuxtApp()` | 全局 Nuxt context（含 `payload` / `$xxx` provides） |
| `clearNuxtData(key)` | 清单 / 全部 useAsyncData 缓存 |
| `clearNuxtState(key)` | 清 useState |
| `refreshNuxtData(key?)` | 重新拉 useAsyncData |

### 路由 / 导航

| 函数 | 作用 |
|---|---|
| `useRoute()` | 当前路由（readonly 响应式） |
| `useRouter()` | router 实例 |
| `navigateTo(url, opts?)` | 程序化导航；middleware 内 return 它 |
| `abortNavigation(error?)` | 中止导航（middleware 内） |
| `useLink()` | 编程获取 NuxtLink 等同行为 |
| `definePageMeta({...})` | 编译期声明页面元数据 |

### 请求 / 响应

| 函数 | 作用 |
|---|---|
| `useRequestHeaders(['cookie'])` | 取请求头（SSR 时） |
| `useRequestURL()` | 当前 URL 对象（双端通用） |
| `useRequestEvent()` | 拿到 Nitro event（仅 SSR） |
| `useResponseHeader()` | 设置 SSR 响应头 |
| `useCookie(name, opts?)` | 双端 cookie 读写 |
| `setResponseStatus(event, code)` | 设状态码（仅 server） |

### Head / SEO

| 函数 | 作用 |
|---|---|
| `useHead({...})` | 动态设置 meta / title / link |
| `useSeoMeta({...})` | 类型化 SEO meta（推荐替代 useHead） |
| `useServerSeoMeta({...})` | 仅 SSR 时设 SEO（客户端跳过节省 JS） |

### 错误

| 函数 | 作用 |
|---|---|
| `createError({...})` | 抛 HTTP 错误（`fatal: true` 走 error.vue） |
| `useError()` | 当前错误 |
| `clearError({ redirect? })` | 清错误 + 可选跳转 |
| `showError(...)` | 程序化触发 error.vue |

### 配置 / 工具

| 函数 | 作用 |
|---|---|
| `useRuntimeConfig(event?)` | 读 runtime config |
| `useAppConfig()` | 读 app config |
| `useNuxtApp()` | 全局 context |

## Nitro Server Utils（server/ 内自动导入）

### 读请求

```ts
defineEventHandler(async (event) => {
  // body
  const body = await readBody(event);
  const body = await readMultipartFormData(event);

  // query
  const { sort, page } = getQuery(event);

  // path params
  const id = getRouterParam(event, 'id');

  // headers / cookies
  const ua = getHeader(event, 'user-agent');
  const session = getCookie(event, 'session');

  // method / url
  const method = getMethod(event);
  const url = getRequestURL(event);
})
```

### 写响应

```ts
defineEventHandler((event) => {
  setResponseStatus(event, 201);
  setResponseHeader(event, 'X-Custom', '1');
  setCookie(event, 'session', token, { httpOnly: true, secure: true });

  // 重定向 / 流
  sendRedirect(event, '/somewhere', 302);
  sendStream(event, nodeReadableStream);
  sendNoContent(event);   // 204

  // 错误
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
});
```

### 内部调用 / 转发

```ts
const data = await event.$fetch('/api/other');  // 转发 headers
const data = await $fetch('/api/other', {        // 不转发
  headers: getHeaders(event),
});
```

## 渲染模式速查（routeRules）

| 字段 | 类型 | 含义 |
|---|---|---|
| `prerender` | boolean | 构建时预渲染（生成静态 HTML） |
| `ssr` | boolean | 是否服务端渲染（false = 纯 SPA） |
| `swr` | number\|true | 服务端缓存秒数；过期后台再生 |
| `isr` | number\|true | CDN 缓存（Vercel / Netlify） |
| `redirect` | string | 服务端重定向 |
| `cors` | boolean | 自动加 CORS 响应头 |
| `headers` | object | 自定义响应头 |
| `noScripts` | boolean | 不发送 Nuxt JS（纯 SSR 输出） |
| `cache` | object | 完整 cache 选项（更细粒度） |
| `appMiddleware` | string[] | 限定可跑的 middleware |

## Kit utilities（模块开发）

```ts
import {
  defineNuxtModule,
  createResolver,
  addPlugin,
  addServerHandler,
  addComponent,
  addImports,
  addRouteMiddleware,
  addPrerenderRoutes,
  extendPages,
  installModule,
  useNuxt,
  hasNuxtModule,
  resolveModule,
} from 'nuxt/kit';
```

模块骨架：

```ts
export default defineNuxtModule<MyModuleOptions>({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: {
    enabled: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    // 注册各种钩子
  },
});
```

## 文件命名约定速查

| 后缀 / 前缀 | 含义 | 例子 |
|---|---|---|
| `.client.vue` / `.client.ts` | 仅客户端 | `analytics.client.ts` |
| `.server.vue` / `.server.ts` | 仅服务端 | `db.server.ts` |
| `[id].vue` | 动态参数 | `pages/users/[id].vue` → `/users/:id` |
| `[...slug].vue` | catch-all | `pages/blog/[...slug].vue` |
| `[[id]].vue` | 可选参数 | `pages/[[lang]]/about.vue` |
| `(group)/` | 路由组（不进 URL） | `pages/(admin)/dashboard.vue` |
| `*.global.ts` | 全局中间件 | `middleware/log.global.ts` |
| `*.get.ts` / `.post.ts` 等 | HTTP 方法绑定 | `server/api/users.post.ts` |

## TypeScript 模块声明 cheat-sheet

```ts
// 扩展 NuxtApp（给 $xxx 加类型）
declare module '#app' {
  interface NuxtApp {
    $echo(msg: string): string;
  }
}

// 扩展 RuntimeConfig
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    apiBase: string;
  }
  interface RuntimeConfig {
    apiSecret: string;
  }
}

// 扩展 PageMeta
declare module '#app' {
  interface PageMeta {
    permissions?: string[];
  }
}
```

## 常用部署预设

| Preset | 平台 |
|---|---|
| `node-server` | 自托管 Node（默认） |
| `node-cluster` | Node + cluster 多核 |
| `static` | 全静态（等价 `nuxt generate`） |
| `vercel` / `vercel-edge` | Vercel |
| `netlify` / `netlify-edge` | Netlify |
| `cloudflare-pages` / `cloudflare-workers` | Cloudflare |
| `deno-deploy` | Deno Deploy |
| `bun` | Bun runtime |
| `aws-lambda` | AWS Lambda（带 API Gateway） |
| `azure` | Azure Functions |
| `firebase` | Firebase Cloud Functions |
| `digital-ocean` / `heroku` / `iis` | 各 PaaS |

设置：`NITRO_PRESET=vercel pnpm build` 或 `nitro: { preset: 'vercel' }`。

## 常用片段拷贝即用

### 完整 nuxt.config.ts 起步

```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-05-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
  },

  app: {
    head: {
      title: 'My App',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
});
```

### 一个完整的 server API + 客户端调用

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }
  return user;
});
```

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: user, error } = await useFetch(`/api/users/${route.params.id}`);
</script>

<template>
  <div v-if="error">Error: {{ error.statusMessage }}</div>
  <div v-else-if="user">{{ user.name }}</div>
</template>
```

### Auth middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useState<User | null>('user');
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login', { redirectCode: 302 });
  }
});
```

```vue
<script setup>
definePageMeta({ middleware: 'auth' });
</script>
```

### Pinia store

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<Item[]>([]);
  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  function add(item: Item) {
    const existing = items.value.find((i) => i.id === item.id);
    if (existing) existing.quantity++;
    else items.value.push({ ...item, quantity: 1 });
  }

  function remove(id: number) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  return { items, total, add, remove };
});
```
