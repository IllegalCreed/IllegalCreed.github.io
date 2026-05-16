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

## 内置 composables 完整表

### 数据获取

| Composable | 签名 | 用途 |
|---|---|---|
| `useFetch` | `(url, opts) => Promise<{ data, error, pending, status, refresh }>` | URL 当 key 的数据获取，SSR 复用 payload |
| `useAsyncData` | `(key, fn, opts) => 同上` | 任意 async function，显式 key |
| `useLazyFetch` | `(url, opts) => 同 useFetch` | `useFetch + lazy: true`，不阻塞导航 |
| `useLazyAsyncData` | `(key, fn, opts) => 同 useAsyncData` | 同上的 useAsyncData 版 |
| `$fetch` | `(url, opts) => Promise<T>` | 底层 ofetch，无响应式，适合 mutation |
| `refreshNuxtData` | `(key?)` | 立即重新拉取 useAsyncData，保留旧数据直到新数据到 |
| `clearNuxtData` | `(key? \| string[])` | 删除缓存数据，下次有组件需要时重新拉 |
| `useNuxtData` | `(key)` | 拿到现有 useFetch / useAsyncData 的数据，不发新请求 |

### 状态

| Composable | 签名 | 用途 |
|---|---|---|
| `useState` | `<T>(key, init) => Ref<T>` | SSR-safe 跨组件共享 ref |
| `clearNuxtState` | `(key? \| string[])` | 重置 useState 到 init 值 |
| `useCookie` | `<T>(name, opts?) => Ref<T>` | 双端响应式 cookie 读写 |

### 路由

| Composable | 签名 | 用途 |
|---|---|---|
| `useRoute` | `() => RouteLocationNormalized` | 当前路由（响应式 readonly） |
| `useRouter` | `() => Router` | router 实例（push / replace / back / forward） |
| `navigateTo` | `(to, opts?) => Promise<...>` | 程序化导航；middleware 内 return 它 |
| `abortNavigation` | `(error?) => never` | 中止导航（仅 middleware 内可用） |
| `useLink` | `(props) => UseLinkReturn` | 编程获取 NuxtLink 同等行为 |
| `definePageMeta` | `({ layout, middleware, validate, ... })` | 编译期宏，声明页面元数据 |

### 请求

| Composable | 签名 | 用途 |
|---|---|---|
| `useRequestHeaders` | `(includes?: string[]) => Headers` | 取请求头（仅 SSR 时） |
| `useRequestURL` | `() => URL` | 当前请求完整 URL（双端通用） |
| `useRequestEvent` | `() => H3Event` | 拿到 Nitro event（仅 SSR） |
| `useResponseHeader` | `(name, value?)` | 设置 SSR 响应头 |

### Head / SEO

| Composable | 用途 |
|---|---|
| `useHead` | 动态设置 meta / title / link |
| `useSeoMeta` | 类型化 SEO meta（推荐替代 useHead 的 SEO 部分） |
| `useServerSeoMeta` | 仅 SSR 注入 SEO，客户端不带这段代码，节省 bundle |
| `useHeadSafe` | useHead 的 XSS-safe 版（外部不可信内容时用） |

### 错误

| Composable | 用途 |
|---|---|
| `createError` | 抛 HTTP 错误（`fatal: true` 走 error.vue） |
| `useError` | 当前错误状态 ref |
| `clearError` | 清错误 + 可选跳转 `{ redirect }` |
| `showError` | 程序化触发 error.vue |

### 配置 / 全局

| Composable | 用途 |
|---|---|
| `useRuntimeConfig` | 读 runtime config（公共 + 服务端） |
| `useAppConfig` | 读 app config（构建时打包，非机密） |
| `useNuxtApp` | 全局 Nuxt context |
| `tryUseNuxtApp` | 同 useNuxtApp 但拿不到时返回 null（不抛错） |

### Plugin / Middleware 声明宏

| 宏 | 用途 |
|---|---|
| `defineNuxtPlugin` | 定义 Nuxt 插件（Vue 应用层） |
| `defineNuxtRouteMiddleware` | 定义路由 middleware |
| `defineNitroPlugin` | 定义 Nitro 服务端 plugin（server/plugins/） |
| `defineEventHandler` | 定义 Nitro server handler |
| `defineNuxtModule` | 定义 Nuxt 模块（modules/） |
| `defineCachedFunction` | 定义带缓存的 server function |
| `defineCachedEventHandler` | 定义带缓存的 server handler |

## Nitro Server Utils 完整表

### 读请求

| 函数 | 用途 |
|---|---|
| `readBody(event)` | 读 POST/PUT body（自动 JSON / urlencoded / text） |
| `readMultipartFormData(event)` | 文件上传（multipart） |
| `readValidatedBody(event, validator)` | 读 + 校验（zod / valibot 等） |
| `getQuery(event)` | URL ?xx=... |
| `getValidatedQuery(event, validator)` | 读 + 校验 query |
| `getRouterParam(event, 'id')` | 路径参数（`[id].ts`） |
| `getRouterParams(event)` | 所有路径参数对象 |
| `getMethod(event)` | HTTP 方法（GET / POST / ...） |
| `getRequestURL(event)` | 当前请求完整 URL |
| `getHeader(event, name)` | 单个请求头 |
| `getHeaders(event)` | 全部请求头对象 |
| `getCookie(event, name)` | 读 cookie |
| `parseCookies(event)` | 全部 cookies 对象 |
| `getRequestIP(event, opts?)` | 客户端 IP（自动处理 X-Forwarded-For） |

### 写响应

| 函数 | 用途 |
|---|---|
| `setResponseStatus(event, code, msg?)` | 设状态码 |
| `setResponseHeader(event, name, value)` | 设响应头 |
| `setResponseHeaders(event, headers)` | 批量设响应头 |
| `setCookie(event, name, value, opts?)` | 写 Set-Cookie |
| `deleteCookie(event, name, opts?)` | 删 cookie（设 maxAge=0） |
| `sendRedirect(event, location, code?)` | 重定向（默认 302） |
| `sendStream(event, stream)` | 流式响应（文件下载等） |
| `sendNoContent(event, code?)` | 204 No Content |
| `sendWebResponse(event, response)` | 直接送一个 Web 标准 Response 对象 |

### 错误 / 钩子

| 函数 | 用途 |
|---|---|
| `createError({ statusCode, statusMessage, fatal? })` | 抛 HTTP 错误 |
| `event.context.X = Y` | 请求级共享上下文（middleware 写、handler 读） |
| `event.waitUntil(promise)` | 后台异步任务（不阻塞响应） |
| `event.$fetch` | 内部转发请求 + 自动带 headers |

### 缓存

| 函数 | 用途 |
|---|---|
| `defineCachedEventHandler(handler, opts)` | 带服务端缓存的 handler |
| `defineCachedFunction(fn, opts)` | 缓存任意 server function |
| `useStorage('key')` | Nitro 内置 KV storage（默认内存，可换 Redis / FS 等） |

## App / Nitro hooks 完整表

### Nuxt App hooks（客户端 + 服务端）

```ts
const nuxtApp = useNuxtApp();
nuxtApp.hooks.hook('app:created', () => {});
```

| Hook | 触发时机 |
|---|---|
| `app:created` | Vue app 创建后 |
| `app:beforeMount` | App 挂载前（仅客户端） |
| `app:mounted` | App 挂载完成（仅客户端） |
| `app:error` | App 抛错（含未捕获 promise） |
| `app:error:cleared` | clearError() 后 |
| `app:rendered` | SSR 渲染完成（仅服务端） |
| `app:redirected` | SSR 时发生重定向（仅服务端） |
| `vue:setup` | 任意 Vue setup() 前 |
| `vue:error` | Vue 组件抛错 |
| `page:start` | 路由切换开始 |
| `page:finish` | 路由切换完成 |
| `page:loading:start` | NuxtLoadingIndicator 显示 |
| `page:loading:end` | NuxtLoadingIndicator 隐藏 |
| `page:transition:finish` | pageTransition 动画结束 |
| `link:prefetch` | NuxtLink 预加载某路由 |

### Nitro hooks（服务端）

```ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {});
});
```

| Hook | 触发时机 |
|---|---|
| `request` | 请求进入（handler 之前） |
| `beforeResponse` | 响应发出前（可改 headers / body） |
| `afterResponse` | 响应发出后（适合后台清理） |
| `error` | Nitro 抛错 |
| `render:html` | SSR HTML 渲染完成（可改 HTML） |
| `render:response` | 完整响应对象生成完 |
| `close` | Nitro app 关闭（仅 dev 重启 / 部署关闭） |

## routeRules 完整字段表

| 字段 | 类型 | 用途 |
|---|---|---|
| `prerender` | boolean | 构建时预渲染（生成静态 HTML） |
| `ssr` | boolean | 是否服务端渲染（false = 纯 SPA） |
| `swr` | number\|true | 服务端缓存秒数；过期后台再生 |
| `isr` | number\|true | CDN 缓存（Vercel / Netlify） |
| `redirect` | string\|object | 服务端重定向 |
| `cors` | boolean | 自动加 CORS 响应头 |
| `headers` | object | 自定义响应头 |
| `noScripts` | boolean | 不发送 Nuxt JS 脚本 |
| `cache` | object | 完整 cache 选项（更细粒度） |
| `appMiddleware` | string[] | 限定可跑的 middleware |
| `experimentalNoScripts` | boolean | 完全无 JS 输出（试验） |
| `robots` | object | robots.txt 控制 |
| `csurf` | object | CSRF 保护配置（如有相应 module） |

## Nitro Preset 部署目标全表

| Preset | 平台 | 备注 |
|---|---|---|
| `node-server` | 自托管 Node | 默认；标准 Node entry |
| `node-cluster` | Node + cluster 多核 | 自动多进程 |
| `node-listener` | 嵌入 Node app | 给现有 Express / Fastify 嵌入 |
| `static` | 全静态 | 等价 `nuxt generate` |
| `vercel` | Vercel Serverless | 自动识别 |
| `vercel-edge` | Vercel Edge Function | V8 isolate |
| `netlify` | Netlify Functions | |
| `netlify-edge` | Netlify Edge Functions | Deno 跑 |
| `netlify-static` | Netlify 静态 | |
| `cloudflare-pages` | Cloudflare Pages | 推荐用 |
| `cloudflare-workers` | Cloudflare Workers | 纯 Worker |
| `cloudflare-module` | CF Worker 模块语法 | |
| `deno-deploy` | Deno Deploy | |
| `deno-server` | Deno Server | 自托管 Deno |
| `bun` | Bun runtime | |
| `aws-lambda` | AWS Lambda + API Gateway | |
| `aws-amplify` | AWS Amplify | |
| `azure` | Azure Functions | |
| `azure-functions` | 同 azure | |
| `azure-swa` | Azure Static Web Apps | |
| `firebase` | Firebase Cloud Functions | |
| `digital-ocean` | DigitalOcean App Platform | |
| `heroku` | Heroku | |
| `iis` | Windows IIS | |
| `iis-handler` | IIS 配合 iisnode | |
| `koyeb` | Koyeb | |
| `nitro-prerender` | 仅预渲染产物 | |
| `service-worker` | PWA Service Worker | |

设置：`NITRO_PRESET=vercel pnpm build` 或 `nitro: { preset: 'vercel' }`。

## Edge runtime 限制速查

部署到 Edge preset（vercel-edge / cloudflare-workers / netlify-edge / deno-deploy）时：

**可用**：
- Web 标准：`fetch` / `Request` / `Response` / `Headers` / `URL` / `URLSearchParams`
- `crypto.subtle` / `crypto.randomUUID` / `crypto.getRandomValues`
- `TextEncoder` / `TextDecoder`
- `ReadableStream` / `WritableStream`
- 部分 Node `:crypto` / `:buffer`（兼容层）
- `$fetch`（底层 ofetch / undici，跨 runtime）

**不可用**：
- `fs` / `path` / `os` Node-only 模块
- `child_process` / `cluster`
- `net` / `dgram` 原始 socket
- `process.env`（部分 Edge 支持但行为不同）
- `setInterval` 长任务（Worker 有 CPU 时间限制）
- 完整 `eval` / `new Function`（CSP 限制）

## Kit utilities 完整表

```ts
import {
  // 定义
  defineNuxtModule,
  createResolver,
  useNuxt,

  // 注册资源
  addPlugin,
  addPluginTemplate,
  addComponent,
  addComponentsDir,
  addImports,
  addImportsDir,
  addImportsSources,
  addServerHandler,
  addServerScanDir,
  addRouteMiddleware,
  addPrerenderRoutes,
  extendPages,
  extendRouteRules,
  addLayout,
  addTemplate,
  addBuildPlugin,
  addVitePlugin,
  addWebpackPlugin,

  // 模块互操作
  installModule,
  hasNuxtModule,
  hasNuxtCompatibility,
  resolveModule,
  resolvePath,

  // Logger
  useLogger,

  // 类型 / TS
  addTypeTemplate,
} from 'nuxt/kit';
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
| `app.vue` | 根组件 | 含 NuxtPage / NuxtLayout |
| `error.vue` | 全局错误页 | 与 app.vue 同级 |
| `app.config.ts` | App Config | 构建时打包 |

## TypeScript 模块声明 cheat-sheet

```ts
// 扩展 NuxtApp（给 $xxx provides 加类型）
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

// 扩展 AppConfig
declare module 'nuxt/schema' {
  interface AppConfigInput {
    theme?: { primary: string };
  }
}

// 扩展 PageMeta
declare module '#app' {
  interface PageMeta {
    permissions?: string[];
  }
}

// Vue 全局组件
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MyButton: typeof import('./components/MyButton.vue')['default'];
  }
}
```

## Composition API 上下文规则

Nuxt context **仅在**这些位置同步可用：

| 位置 | 可用？ |
|---|---|
| `<script setup>` 顶层 | ✅ |
| `defineNuxtPlugin` 内 | ✅ |
| `defineNuxtRouteMiddleware` 内 | ✅ |
| `defineEventHandler` 内（server 侧） | ⚠️ 服务端 composable（useRuntimeConfig 等）可，客户端 composable 不行 |
| `useAsyncData` 回调内 | ✅ |
| `useFetch` 选项的 transform / onResponse 等 | ✅ |
| `onMounted` / `onBeforeMount` 内 | ✅ |
| `setTimeout` / `setInterval` 回调内 | ❌（context 已丢） |
| `Promise.then(callback)` 内 | ❌ |
| `EventListener` 内 | ❌ |
| 普通工具函数 | ❌ |

报错时的解法：**先在 setup 顶层 / 合法上下文中调好 composable 拿到 ref，再在异步回调里 `.value` 访问**。

## 性能优化 cheat sheet

| 场景 | 方案 |
|---|---|
| 首屏 SSR 慢 | `lazy: true` 非关键数据 / `<NuxtIsland>` 拆 server-only / `transform` 裁 payload |
| NuxtLink 预加载吃流量 | `prefetch-on="interaction"` 改 hover 触发 |
| Bundle 太大 | `Lazy 前缀` 组件懒加载 / `.client.vue` 拆客户端 / `nuxi analyze` 找大头 |
| 数据请求重复 | Nuxt 4 自动按 key 共享；`dedupe: 'defer'` 多调用共用 promise |
| 图片大 | `<NuxtImg>` + 多 srcset + WebP/AVIF |
| 主进程卡 | `useFetch lazy: true` 不阻塞导航 / `definePageMeta keepalive` 复用 |
| 频繁切换页面 | `interruptible: true` 取消旧路由 / `concurrency` 控制 |

## 常用片段拷贝即用（追加）

### Sentry 错误监控集成

```ts
// plugins/sentry.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  import('@sentry/vue').then(({ init, vueIntegration }) => {
    init({
      app: nuxtApp.vueApp,
      dsn: useRuntimeConfig().public.sentryDsn,
      integrations: [vueIntegration({ tracingOptions: { trackComponents: true } })],
      tracesSampleRate: 0.1,
    });
  });

  nuxtApp.hook('app:error', (error) => {
    console.error('App error:', error);
  });
});
```

### 路由切换埋点

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', ({ to }) => {
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', { page_path: to.fullPath });
    }
  });
});
```

### Auth-utils session 鉴权

```bash
pnpm add nuxt-auth-utils
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
});
```

```ts
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);
  // 校验...
  await setUserSession(event, {
    user: { id: 1, username },
    loggedInAt: Date.now(),
  });
  return { ok: true };
});
```

```vue
<!-- 任意组件 -->
<script setup>
const { loggedIn, user, clear } = useUserSession();
</script>

<template>
  <div v-if="loggedIn">Hi, {{ user.username }}</div>
  <NuxtLink v-else to="/login">Login</NuxtLink>
</template>
```

### Pinia store + SSR 持久化

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = useState<Item[]>('cart.items', () => []);
  // 用 useState 代替 ref → 自动 SSR-safe
  // ...
});
```

或用 `@pinia-plugin-persistedstate/nuxt` 自动持久化到 cookie / localStorage。

### 全局错误处理 + 上报

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('Vue error:', err);
    // 上报...
  };

  nuxtApp.hook('vue:error', (err) => {
    console.error('Nuxt vue:error:', err);
  });

  nuxtApp.hook('app:error', (err) => {
    console.error('Nuxt app:error:', err);
  });

  // 处理客户端未捕获 Promise
  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
    });
  }
});
```

### 限速 / 缓存的 server handler

```ts
// server/api/heavy.get.ts
export default defineCachedEventHandler(
  async (event) => {
    const data = await expensiveComputation();
    return data;
  },
  {
    maxAge: 60,  // 缓存 60 秒
    swr: true,    // stale-while-revalidate
    base: 'memory',  // 用 useStorage 的 backend；可换 redis / fs
    getKey: (event) => `heavy:${getRouterParam(event, 'id')}`,
  },
);
```
