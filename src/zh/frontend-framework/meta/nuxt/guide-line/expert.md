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

## 服务端缓存

Nitro 自带缓存层，可包装 handler / 函数：

### `defineCachedEventHandler`

```ts
// server/api/heavy.get.ts
export default defineCachedEventHandler(
  async (event) => {
    const data = await expensiveCompute();
    return data;
  },
  {
    maxAge: 60,                   // 缓存 60 秒
    swr: true,                     // stale-while-revalidate
    base: 'memory',                // 后端：memory / redis / fs
    name: 'heavy',                 // 显式命名（默认按 URL）
    getKey: (event) => `heavy:${getRouterParam(event, 'id')}`,
    shouldInvalidateCache: (event) => getQuery(event).fresh === '1',
    shouldBypassCache: (event) => getHeader(event, 'authorization') !== undefined,
  },
);
```

### `defineCachedFunction`

```ts
// server/utils/db.ts
export const getUser = defineCachedFunction(
  async (id: number) => {
    return await prisma.user.findUnique({ where: { id } });
  },
  {
    maxAge: 300,
    name: 'db:user',
    getKey: (id) => String(id),
  },
);
```

```ts
// server/api/users/[id].get.ts
import { getUser } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  return await getUser(id);  // 自动缓存
});
```

### `useStorage` 内置 KV

```ts
const storage = useStorage('cache');  // 默认内存存储

await storage.setItem('key', { foo: 'bar' });
const val = await storage.getItem('key');
await storage.removeItem('key');
await storage.clear();   // 全清
```

配 Redis：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      cache: { driver: 'redis', url: process.env.REDIS_URL },
    },
  },
});
```

切 driver 后代码不变——`useStorage('cache')` 透明走 Redis。

## 部署目标各 preset 细节

### `node-server`（默认 / 推荐）

```ts
nitro: { preset: 'node-server' }
```

产物：`.output/server/index.mjs` —— 独立 Node 程序。

```bash
node .output/server/index.mjs    # 默认 :3000
PORT=8080 node .output/server/index.mjs

# PM2 / systemd 起进程
pm2 start .output/server/index.mjs --name my-app -i max
```

### `node-cluster`（多核利用）

```ts
nitro: { preset: 'node-cluster' }
```

自动按 CPU 核数 fork 多个 worker。比 PM2 cluster 模式更原生。

### `vercel` / `vercel-edge`

```ts
nitro: { preset: 'vercel' }       // Serverless Function
// 或
nitro: { preset: 'vercel-edge' }  // Edge Runtime（V8 isolate）
```

部署：仓库连 Vercel，自动识别 Nuxt + Nitro，零配置。

Edge runtime 需注意：
- 没有 Node `fs` / `child_process` 等
- 单请求 CPU 时间限制（25ms 区域路由 / 50ms Edge Function Pro）
- 部分 npm 包不兼容（含 native binary 的不行）

### `netlify` / `netlify-edge`

```ts
nitro: { preset: 'netlify' }       // Functions
nitro: { preset: 'netlify-edge' }  // Deno 跑的 Edge
```

`netlify-static`：纯静态（等价 generate）。

### `cloudflare-pages` / `cloudflare-workers`

```ts
nitro: { preset: 'cloudflare-pages' }    // 推荐：Pages + Functions
nitro: { preset: 'cloudflare-workers' }  // 纯 Worker（更纯净）
```

绑定环境变量在 Cloudflare dashboard 配。Workers 有 1 MB 大小限制（含 dependencies）—— 大型 Nuxt 应用要拆 Layer 或裁剪。

### `deno-deploy`

```ts
nitro: { preset: 'deno-deploy' }
```

部署：用 `denoctl deploy` 或 GitHub action。Deno runtime，部分 Node API 通过 polyfill。

### `bun`

```ts
nitro: { preset: 'bun' }
```

跑在 Bun runtime，速度比 Node 快 1.5-2x。要 Bun ≥ 1.1。

### `aws-lambda`

```ts
nitro: { preset: 'aws-lambda' }
```

产物为 Lambda handler。配合 API Gateway / CloudFront 部署。冷启动比 Node server 慢一些（200-500ms）。

### `azure` / `firebase` / 其它 PaaS

类似配置，每个 platform 都有官方 preset。详见 [Nitro deployment docs](https://nitro.unjs.io/deploy)。

## 部署最佳实践

### 环境变量与 secrets

- 部署平台用 dashboard / secret manager 配 `NUXT_*` 环境变量
- **不要把 token 写进 `runtimeConfig.public.*`** —— 进客户端 bundle
- 用 `useRuntimeConfig(event)` 在 server handler 读，避免污染 SSR payload

### 健康检查端点

```ts
// server/api/health.get.ts
export default defineEventHandler((event) => {
  setResponseStatus(event, 200);
  return { status: 'ok', uptime: process.uptime() };
});
```

负载均衡器 / Kubernetes liveness probe 用。

### 日志结构化

```ts
// server/plugins/logging.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    console.log(JSON.stringify({
      method: getMethod(event),
      path: event.path,
      ts: Date.now(),
    }));
  });

  nitroApp.hooks.hook('beforeResponse', (event, { body }) => {
    console.log(JSON.stringify({
      method: getMethod(event),
      path: event.path,
      status: getResponseStatus(event),
      duration: Date.now() - (event.context.startTime ?? 0),
    }));
  });
});
```

### 优雅停机

```ts
// server/plugins/graceful-shutdown.ts
export default defineNitroPlugin((nitroApp) => {
  let activeRequests = 0;
  let shuttingDown = false;

  nitroApp.hooks.hook('request', () => { activeRequests++ });
  nitroApp.hooks.hook('afterResponse', () => { activeRequests-- });

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      shuttingDown = true;
      console.log(`Received ${signal}, draining...`);
      const interval = setInterval(() => {
        if (activeRequests === 0) {
          clearInterval(interval);
          process.exit(0);
        }
      }, 200);
    });
  }
});
```

Kubernetes 滚动更新需要这个，避免请求被截断。

## Modules 开发深入

### 完整 module 结构

```
my-module/
├── package.json
├── README.md
├── src/
│   ├── module.ts          # 模块入口
│   └── runtime/           # 运行时代码（被注册的内容）
│       ├── plugin.ts
│       ├── composables/
│       │   └── useMyFeature.ts
│       ├── components/
│       │   └── MyButton.vue
│       ├── server/
│       │   └── api/
│       │       └── greet.get.ts
│       └── types.d.ts
├── playground/             # 用于本地测试的小 Nuxt 项目
└── test/                   # 模块测试
```

```ts
// src/module.ts
import { defineNuxtModule, addPlugin, addComponent, addImports, addServerHandler, createResolver, addTypeTemplate } from 'nuxt/kit';

export interface ModuleOptions {
  enabled?: boolean;
  greetingPrefix?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: {
    enabled: true,
    greetingPrefix: 'Hello',
  },
  async setup(options, nuxt) {
    if (!options.enabled) return;

    const resolver = createResolver(import.meta.url);

    // 加 plugin
    addPlugin(resolver.resolve('./runtime/plugin'));

    // 加自动导入的 composable
    addImports({
      name: 'useMyFeature',
      from: resolver.resolve('./runtime/composables/useMyFeature'),
    });

    // 加全局组件
    addComponent({
      name: 'MyButton',
      filePath: resolver.resolve('./runtime/components/MyButton.vue'),
    });

    // 加 server route
    addServerHandler({
      route: '/api/greet',
      handler: resolver.resolve('./runtime/server/api/greet.get'),
    });

    // 把选项注入到 runtime 配置（供 plugin 读）
    nuxt.options.runtimeConfig.public.myModule = {
      greetingPrefix: options.greetingPrefix,
    };

    // 加类型声明（让用户编辑器能识别）
    addTypeTemplate({
      filename: 'types/my-module.d.ts',
      getContents: () => `
        declare module '#app' {
          interface NuxtApp {
            $greet: (name: string) => string;
          }
        }
        export {};
      `,
    });

    // hook 进 Nuxt 生命周期
    nuxt.hook('build:before', () => {
      console.log('[my-module] starting build');
    });
  },
});
```

### 在 playground 测试

```
my-module/
├── src/...
└── playground/
    ├── nuxt.config.ts        # 引用 ../src
    ├── package.json
    └── app.vue
```

```ts
// playground/nuxt.config.ts
export default defineNuxtConfig({
  modules: ['../src/module'],
  myModule: {
    greetingPrefix: 'Hi',
  },
});
```

```bash
pnpm dev:playground   # 在 module 仓库根目录跑
```

### 程序化加载其它模块

```ts
import { installModule } from 'nuxt/kit';

export default defineNuxtModule({
  async setup(options, nuxt) {
    // 我的 module 需要 tailwind，自动装上
    await installModule('@nuxtjs/tailwindcss', {
      config: { /* ... */ },
    });
  },
});
```

### Module 发布

```json
// package.json
{
  "name": "my-module",
  "exports": {
    ".": {
      "types": "./dist/types.d.ts",
      "import": "./dist/module.mjs"
    }
  },
  "files": ["dist"],
  "build": {
    "externals": ["@nuxt/kit"]
  }
}
```

用 [`@nuxt/module-builder`](https://github.com/nuxt/module-builder) 一键构建：

```bash
pnpm dlx nuxt-module-build
pnpm publish
```

## Layers 深度

### Layer vs Module 选择

| 维度 | Layer | Module |
|---|---|---|
| 包含什么 | pages / components / 完整 Nuxt 项目结构 | 可程序化加注册项 |
| 灵活度 | 主项目可重写文件 | 程序化注入，不易重写 |
| 安装方式 | `extends: [...]` | `modules: [...]` |
| 共享单元 | 「应用碎片」 | 「功能注入器」 |

选 Layer：多个相似应用共用底座（电商前台 / 后台 / 移动端）  
选 Module：一组功能可装可拆（@nuxt/image / @nuxt/content）

### Layer 共享单元类型

```
my-layer/
├── nuxt.config.ts          # layer 配置（被合并）
├── pages/                  # 路由
├── components/             # 自动导入组件
├── composables/            # 自动导入 composable
├── layouts/                # 布局
├── middleware/             # 中间件
├── plugins/                # 插件
├── server/                 # Nitro 服务端
├── public/                 # 静态资源
└── shared/                 # 双端共用
```

主项目 `extends`：

```ts
export default defineNuxtConfig({
  extends: [
    './layers/admin',                                // 本地
    'github:my-org/my-shared-layer#v1.2.0',          // GitHub
    ['gh:user/repo', { auth: process.env.GH_TOKEN }], // 私有
  ],
});
```

### Layer 覆盖规则

| 资源 | 覆盖规则 |
|---|---|
| 同名 page (`pages/x.vue`) | 主项目优先 |
| 同名组件 | 主项目优先 |
| 同名 composable | 主项目优先 |
| nuxt.config 配置 | 深度合并，主项目优先 |
| modules 数组 | 累加 |
| plugins | 按 layer 顺序累加（layer 先跑，project 最后） |

主项目「重写」layer 单个文件的玩法：

```
acme/
├── layers/shared/
│   └── components/Footer.vue       # 共享版本
└── components/Footer.vue            # 主项目同名 → 覆盖
```

### Layer 内部禁忌

- **Layer 内不要硬编码绝对路径**（`/src/...`）—— 主项目部署后路径不同
- **Layer 不要 `installModule` 不存在的依赖** —— 安装失败影响主项目
- **Layer 的 nuxt.config 不要写 `runtimeConfig.public.X = 'hard-coded'`** —— 让主项目通过环境变量覆盖

### Layer 发布

```json
// package.json
{
  "name": "@my-org/admin-layer",
  "type": "module"
}
```

Layer 不需要 module 那种构建——直接 publish 源代码，主项目 `extends: ['@my-org/admin-layer']` 即可。

## Hybrid 渲染实战

### 典型电商场景

```ts
export default defineNuxtConfig({
  routeRules: {
    // 1. 首页 SSG —— 构建一次永久静态
    '/': { prerender: true },

    // 2. 产品列表 SWR —— CDN 缓存 5 分钟、后台再生
    '/products': { swr: 300 },

    // 3. 单品详情 ISR —— CDN 缓存到下次部署
    '/products/[slug]': { isr: true },

    // 4. 购物车 / 结账 —— 实时 SSR（默认）
    // 不需要 routeRules

    // 5. 用户中心 —— SPA（不需要 SEO）
    '/account/**': { ssr: false },

    // 6. API 路由 —— CORS 给前端 SPA 调用
    '/api/**': { cors: true },

    // 7. 老链接重定向
    '/legacy/products/:id': { redirect: '/products/:id' },

    // 8. 静态资源安全头
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },

    // 9. 全站安全头
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  },
});
```

### 选择策略决策树

```
路由内容是否随用户变化？
├─ 是 → SSR（默认）
└─ 否 → 渲染开销大吗？
    ├─ 大（数据库 / 复杂查询） → 缓存
    │   ├─ 频繁变化 → SWR（短 TTL）
    │   ├─ 很少变化 → ISR / prerender
    └─ 小 → SSR
```

### SWR vs ISR 实战差别

- **SWR（`swr: N`）**：
  - 数据存 Nitro 内部（默认内存，可配 Redis）
  - 第一个用户请求触发生成、N 秒内其它用户共享
  - 过期后第一个用户拿到旧数据 + 触发后台再生
  - 适合：自托管 Node / 单台服务器

- **ISR（`isr: true`）**：
  - 数据存 CDN（Vercel / Netlify 等平台特性）
  - 跨多个 region 共享缓存
  - 缓存到下次部署 / 显式 purge
  - 适合：Vercel / Netlify 用户

### `cache.maxAge` 完整选项

```ts
routeRules: {
  '/heavy': {
    cache: {
      maxAge: 60,                  // 缓存秒数
      swr: true,                    // 配合 stale-while-revalidate
      base: 'memory',               // 后端 storage
      varies: ['accept-language'],  // 按 header 分流
      group: 'heavy-pages',          // 标识，用 useStorage 操作
      shouldInvalidateCache: (event) => getQuery(event).bust === '1',
    },
  },
}
```

## Server Components 深入

### `.server.vue` 文件

```vue
<!-- components/HeavyServerCard.server.vue -->
<script setup lang="ts">
const { data } = await useFetch('/api/expensive');
</script>

<template>
  <article>
    <h2>{{ data.title }}</h2>
    <p>{{ data.body }}</p>
  </article>
</template>
```

特性：
- 渲染发生在服务端
- **客户端 bundle 不带这段代码**
- **没有交互能力**（无 click / 无 v-model）
- 适合：纯展示 + 数据重的卡片 / 列表项

### `<NuxtIsland />`

```vue
<NuxtIsland name="HeavyServerCard" :props="{ id: 42 }" />
```

特性：
- 服务端组件，**客户端可按 props 变化触发服务端重渲染**
- 通过 `useFetch` 拉新的渲染结果
- 适合：少数据更新 + 不想 hydration 整个组件树

### Server + Client 混合组件

```vue
<!-- components/MixedCard.vue —— 主体客户端 -->
<template>
  <div>
    <NuxtIsland name="MixedCard/ServerHeader" :props="{ userId }" />
    <ClientInteraction />
  </div>
</template>
```

```vue
<!-- components/MixedCard/ServerHeader.server.vue —— 仅服务端 -->
<script setup>
const props = defineProps<{ userId: number }>();
const { data: user } = await useFetch(`/api/users/${props.userId}`);
</script>

<template>
  <header>Welcome {{ user.name }}</header>
</template>
```

## Edge / Cloudflare 限制详解

部署到 Cloudflare Workers / Pages 时：

### 禁用的 Node API

```ts
// ❌ 全部不可用
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { Cluster } from 'node:cluster';
import * as net from 'node:net';

// ❌ 部分 process API 缺失
process.cwd();  // 在 Workers 上不存在
```

### 可用的 Web 标准 API

```ts
// ✅ 完整支持
await fetch('https://api.example.com');
new Headers();
new Request();
new Response();
new URL('https://example.com');
new URLSearchParams();
await crypto.subtle.digest('SHA-256', data);
crypto.randomUUID();
new TextEncoder();
new TextDecoder();
new ReadableStream();
```

### Cloudflare KV / D1 / R2 集成

```ts
// server/api/get-cache.get.ts
export default defineEventHandler(async (event) => {
  // Cloudflare 绑定的 KV / D1 通过 event.context.cloudflare 暴露
  const { env } = event.context.cloudflare;
  const value = await env.MY_KV.get('key');
  return { value };
});
```

绑定在 `wrangler.toml` 里配。

### 大小限制

- **Workers**：单 worker bundle 1 MB（free）/ 10 MB（paid）
- **Pages Functions**：每函数 1 MB
- 解决：拆 layer / 不打包不必要的 lib / 用 `external` 排除大依赖

## 性能基准 / 监控

### 衡量 SSR 性能

```ts
// server/plugins/ssr-metrics.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const duration = Date.now() - event.context.startTime;
    console.log(JSON.stringify({
      type: 'ssr',
      path: event.path,
      duration_ms: duration,
    }));
  });
});
```

### 监控 hydration 耗时

```ts
// plugins/hydration-metrics.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const start = performance.now();
  nuxtApp.hook('app:mounted', () => {
    const duration = performance.now() - start;
    console.log('Hydration duration:', duration, 'ms');
    // 上报
  });
});
```

### Core Web Vitals

```ts
// plugins/web-vitals.client.ts
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  import('web-vitals').then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
    function report(metric) {
      navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
    }
    onCLS(report); onLCP(report); onINP(report); onFCP(report); onTTFB(report);
  });
});
```
