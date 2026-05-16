---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> Nitro 服务端、渲染模式、模块开发、部署落地

## 速查

- Nitro = Nuxt 的服务引擎（H3 + 路由 + plugins），不需要装 Express / Fastify
- `server/api/*.ts` 自动暴露 `/api/*`；带方法 `*.get.ts` / `*.post.ts`
- 渲染模式：默认 SSR；`routeRules` 一行切 SSG / SWR / ISR / CSR
- `nitro.preset` 选部署目标：`node-server` / `vercel` / `netlify` / `cloudflare` / `deno-deploy` / `bun` 等
- 模块：`modules/` 放本地模块；`defineNuxtModule` + `addPlugin` / `addComponent` / `addImports` / `addServerHandler` 等 Kit utils 扩展能力
- Layer：`layers/` 把可复用的部分拆成「子项目」，主项目用 `extends: './layers/admin'` 引入
- Hybrid 部署：`prerender` 静态首页 + `swr` 缓存列表 + `ssr` 详情 + `cors` API，**一份代码多种渲染策略**

## Nitro 服务端

### 文件结构与自动注册

```
server/
├── api/                # /api/* 端点
│   ├── articles.get.ts        → GET /api/articles
│   ├── articles.post.ts       → POST /api/articles
│   ├── articles/[id].get.ts   → GET /api/articles/:id
│   └── articles/[id].delete.ts → DELETE /api/articles/:id
├── routes/             # 没 /api 前缀
│   └── sitemap.xml.ts         → GET /sitemap.xml
├── middleware/         # 服务端中间件（不返回 response，只处理 event）
├── utils/              # 服务端工具（自动导入仅在 server/ 内）
└── plugins/            # Nitro 启动钩子
```

### Event handler 基础

```ts
// server/api/articles.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ title: string; body: string }>(event);

  // 校验
  if (!body.title) {
    throw createError({ statusCode: 400, statusMessage: 'title required' });
  }

  // 写库（这里用假数据）
  const article = { id: Date.now(), ...body };

  // 设置 Set-Cookie
  setCookie(event, 'last-created', String(article.id), {
    httpOnly: true, maxAge: 60 * 60,
  });

  return article;
});
```

### 常用 Nitro utils

| 函数                           | 作用                                              |
| ------------------------------ | ------------------------------------------------- |
| `readBody(event)`              | 读 POST/PUT body（自动 JSON 解析）                |
| `readMultipartFormData(event)` | 文件上传                                          |
| `getQuery(event)`              | URL query 参数                                    |
| `getRouterParam(event, 'id')`  | 路径参数（`[id].ts` 这种）                        |
| `getHeader(event, 'x-foo')`    | 单个请求头                                        |
| `getHeaders(event)`            | 全部请求头                                        |
| `getCookie(event, 'name')`     | 读 cookie                                         |
| `setCookie(event, 'k', 'v')`   | 写 Set-Cookie                                     |
| `setResponseStatus(event, 201)`| 改状态码                                          |
| `setResponseHeader(event, k, v)` | 改响应头                                        |
| `sendRedirect(event, '/x', 302)` | 重定向                                          |
| `sendStream(event, stream)`    | 推流（文件下载等）                                |
| `createError({ ... })`         | 抛 HTTP 错误（被 Nitro 自动转 JSON 错误响应）     |
| `useRuntimeConfig(event)`      | 读 runtime config（机密 + public）                |

### 服务端中间件

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${getMethod(event)} ${getRequestURL(event).pathname}`);
  // 不要返回值；返回值会被当成 response
});
```

适合：日志、统一 CORS、鉴权预检、把用户挂到 `event.context.user`。

### 调用其它内部 API

```ts
// 在 server handler 内调另一个 API
const data = await $fetch('/api/articles', {
  // 转发当前请求的 headers（cookies / auth 等）
  headers: getHeaders(event),
});

// 更简洁：event.$fetch 自动转发
const data = await event.$fetch('/api/articles');
```

### Runtime hooks

```ts
// server/plugins/init.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    console.log('incoming', event.path);
  });

  nitroApp.hooks.hook('beforeResponse', (event, { body }) => {
    console.log('outgoing', event.path);
  });
});
```

## 渲染模式 + Route Rules

Nuxt 默认 **Universal SSR**：服务端渲 HTML → 客户端 hydration。其它模式通过 `routeRules` 一行切换：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 1. 首页静态生成，部署时一次性 build
    '/': { prerender: true },

    // 2. 博客列表 SWR：CDN 缓存 1 小时，过期后台再生（用户先看旧的）
    '/blog': { swr: 3600 },

    // 3. 博客详情 ISR：CDN 缓存到下次部署，按需触发再生
    '/blog/**': { isr: true },

    // 4. Admin 后台关闭 SSR（纯 SPA，避免 hydration 折腾）
    '/admin/**': { ssr: false },

    // 5. API 自动带 CORS
    '/api/**': { cors: true },

    // 6. 老链接重定向
    '/old-page': { redirect: '/new-page' },

    // 7. 安全头
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  },
});
```

### 渲染模式选择树

```
需要 SEO + 内容动态？
├─ 是 + 频繁更新   → SSR（默认）
├─ 是 + 偶尔更新   → SWR / ISR（CDN 缓存 + 后台再生）
├─ 是 + 永不更新   → SSG（prerender）
└─ 否（后台 / 仪表盘） → ssr: false（纯 SPA）
```

### SWR vs ISR

| 维度       | SWR                          | ISR                          |
| ---------- | ---------------------------- | ---------------------------- |
| 缓存位置   | 服务端 / 自部署反向代理       | CDN（Vercel / Netlify 等）   |
| 失效策略   | TTL（`swr: 3600` 秒）         | 直到下次部署（`isr: true`）  |
| 触发再生   | TTL 过期后第一个请求         | 通过 webhook / API trigger    |
| 适合       | 自托管 Node 部署              | Vercel / Netlify 用户         |

实战推荐：

- 自托管 → 用 `swr`（Nitro 自带 cache 实现）
- 上 Vercel / Netlify → 用 `isr`（让 CDN 接管）

## 模块开发

模块 = 启动时跑的「**Nuxt 内部 hook**」，可以加路由 / 加组件 / 改配置 / 注册 server handler。

### 本地模块（modules/）

```ts
// modules/my-greet.ts
import { defineNuxtModule, addServerHandler, createResolver } from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'my-greet',
    configKey: 'myGreet',
  },
  defaults: {
    enabled: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // 加一个服务端 handler
    addServerHandler({
      route: '/api/greet',
      handler: resolver.resolve('./runtime/greet.get.ts'),
    });

    // 加自动导入的 composable
    addImports({
      name: 'useGreet',
      from: resolver.resolve('./runtime/composables/useGreet'),
    });

    // 加全局组件
    addComponent({
      name: 'GreetCard',
      filePath: resolver.resolve('./runtime/components/GreetCard.vue'),
    });

    nuxt.hook('build:before', () => {
      console.log('[my-greet] build starting');
    });
  },
});
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['./modules/my-greet'],
  myGreet: { enabled: true },
});
```

### Kit utilities（常用）

| 函数                  | 作用                                              |
| --------------------- | ------------------------------------------------- |
| `addPlugin(path)`     | 加 Vue 插件（client / server / 双端）             |
| `addComponent({...})` | 注册全局 Vue 组件                                 |
| `addImports({...})`   | 注册自动导入                                      |
| `addServerHandler({...})` | 加 server route                                |
| `addRouteMiddleware({...})` | 加全局路由 middleware                       |
| `addPrerenderRoutes([...])` | 加预渲染的路由列表                            |
| `extendPages(cb)`     | 修改路由表                                        |
| `installModule('name', options)` | 程序化安装其它模块                     |
| `createResolver(import.meta.url)` | 路径解析（找到模块自己的内部资源）    |

### 常用官方 / 社区模块

| 模块                | 作用                                      |
| ------------------- | ----------------------------------------- |
| `@nuxt/image`       | 自适应图片 + 多 provider（Cloudinary / Vercel 等） |
| `@nuxt/content`     | 把 `content/*.md` 渲成可查询的内容站      |
| `@nuxt/ui`          | 官方 Tailwind UI 组件库                   |
| `@nuxt/devtools`    | DevTools（v4 默认带）                     |
| `@nuxt/test-utils`  | 测试工具                                  |
| `@pinia/nuxt`       | Pinia 状态管理                            |
| `@vueuse/nuxt`      | VueUse 自动导入                           |
| `@nuxtjs/tailwindcss` | Tailwind CSS                            |
| `@nuxtjs/i18n`      | 国际化（基于 vue-i18n）                   |
| `nuxt-auth-utils`   | 轻量 session-based auth                   |
| `@sentry/nuxt`      | Sentry 错误监控                           |

## Layers（项目分层）

把可复用的页面 / 组件 / API 等打包成「子项目」，主项目用 `extends` 引入：

```
acme/
├── layers/
│   └── admin/                # 一个子 layer
│       ├── pages/
│       │   └── admin/index.vue
│       ├── components/
│       │   └── AdminSidebar.vue
│       ├── server/api/
│       │   └── admin/users.get.ts
│       └── nuxt.config.ts    # layer 自己的配置
├── app/
│   ├── pages/...
│   └── components/...
└── nuxt.config.ts
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/admin'],
});
```

layer 里的所有目录（pages / components / server / public ...）都会被自动合并进主项目。**适合多个相似项目共用底座**——电商前台 / 后台 / 移动端各一个 layer，主项目 extends 全部。

::: tip Layer 加载顺序

- Layer 模块**先**加载，主项目**后**加载（Nuxt 4 修复了 v3 反向的 bug）
- 同名文件**主项目覆盖 layer**（你可以局部重写）

:::

## 部署

### Nitro Preset（部署目标）

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server',  // 默认
    // preset: 'vercel',
    // preset: 'netlify',
    // preset: 'cloudflare-pages',
    // preset: 'cloudflare-workers',
    // preset: 'deno-deploy',
    // preset: 'bun',
    // preset: 'aws-lambda',
    // preset: 'azure',
    // preset: 'static',  // 等价 nuxt generate
  },
});
```

或环境变量 `NITRO_PRESET=vercel pnpm build`。

### 完整部署流程

```bash
# 1. 构建
pnpm build

# 2. 产物在 .output/
ls .output/
# server/        — Node entry + 依赖
# public/        — 静态资源 + 预渲染 HTML

# 3. 跑（Node preset）
node .output/server/index.mjs

# 或上传到 PaaS（自动识别 Nitro）
```

### 静态站（SSG）

```bash
# 全站预渲染
pnpm generate

# 产物
ls .output/public/        # 纯静态文件，可丢到任何 CDN
```

注意：SSG 时**不能用 server/api/**，因为没运行时服务器。但可以用 `useFetch` 调用**外部 API**——Nuxt 在 prerender 阶段会把响应写进 payload。

### Hybrid（混合）

`routeRules` 让 SSR / SSG / ISR 共存：

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },         // 首页 SSG
    '/blog/**': { isr: 3600 },         // 博客 ISR
    '/admin/**': { ssr: false },       // 后台 SPA
    '/api/**': { cors: true },         // API CORS
  },
});
```

构建后 `.output/` 同时含静态文件 + Node 入口；部署平台按 routeRule 自动选渲染方式。

### Edge 部署

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',   // 或 vercel-edge / netlify-edge
  },
});
```

注意 Edge 环境没 Node 全部 API（不能用 `fs` / `child_process` 等），写 server handler 时只用 Web 标准 API。

## 性能调优

### Server-only 组件

只在服务端渲，不进客户端 bundle：

```vue
<!-- components/HeavyServerOnly.server.vue -->
<template>
  <div>{{ expensiveCalculation }}</div>
</template>

<script setup>
const expensiveCalculation = await computeOnServer();
</script>
```

或用 `<NuxtIsland>`：

```vue
<NuxtIsland name="HeavyServerOnly" :props="{ id: 42 }" />
```

### Client-only 组件

只在客户端渲，跳过 SSR：

```vue
<!-- components/InteractiveWidget.client.vue -->
```

或：

```vue
<ClientOnly>
  <Widget />
</ClientOnly>
```

### `useFetch` 的 `lazy` 与 `transform`

```ts
const { data, pending } = await useFetch('/api/big', {
  lazy: true,          // 不阻塞导航（先渲页面再拉数据）
  transform: (raw) => ({ list: raw.items.map(pickFields) }),  // SSR payload 只存改造后的小对象
  pick: ['title', 'id'],  // 进一步裁剪
});
```

### Payload 体积

SSR 把数据序到 HTML 里给客户端 hydration——大数据会让首屏 HTML 膨胀。两个方向优化：

1. `transform` / `pick` 裁剪上面提到
2. `useAsyncData('key', fn, { default: () => null })` + 客户端再拉详情

### Image 优化

```vue
<NuxtImg src="/hero.jpg" width="800" height="600" format="webp" loading="lazy" />
```

需要 `@nuxt/image` 模块。它自动转 WebP / AVIF、按 srcset 出多份尺寸、走 CDN provider。
