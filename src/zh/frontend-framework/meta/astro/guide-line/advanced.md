---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 渲染模式、Server Islands、Actions、View Transitions、Image、Adapter

## 速查

- **渲染模式**：`output: 'static'`（默认，全量预渲染）/ `output: 'server'`（全量按需）；混合模式用 `prerender = false/true` 单页覆盖
- **SSR 必须装 adapter**：`@astrojs/node` / `@astrojs/vercel` / `@astrojs/netlify` / `@astrojs/cloudflare`
- **Server Islands**：组件加 `server:defer` + `slot="fallback"`；主壳秒出 + CDN 缓存，island 异步补齐
- **Actions**（4.15+ 稳定）：`defineAction({ input: zod, handler })`；client 用 `await actions.foo(input)`，form 用 `action={actions.foo}`
- **View Transitions**：`<ClientRouter />` 加进 `<head>` 即开启 SPA-like 导航；`transition:name` / `transition:animate` / `transition:persist`
- **Image**：`<Image src="..." alt="..." />` 自动 WebP / AVIF / lazy / 防 CLS；`<Picture>` 多源；`import.meta.glob` 拿 `ImageMetadata`
- **Sessions**（5.7+）：`Astro.session.get/set/regenerate/destroy`；adapter 自带或自定义 driver

## 渲染模式

Astro 5 简化为两种：

| `output` | 行为 | 用途 |
|---|---|---|
| `'static'` | 默认；构建期预渲染所有页面 | 博客 / 文档 / 营销站 |
| `'server'` | 全部按需 SSR | 应用 / dashboard |

### `output: 'static'`（默认）

```js
// astro.config.mjs
export default defineConfig({
  // output: 'static',   // 默认值，可省略
});
```

构建期把所有 `src/pages/` 渲染成 HTML，输出到 `dist/`：

```bash
npm run build
ls dist/
# index.html  about/index.html  blog/index.html  blog/foo/index.html ...
```

部署：把 `dist/` 上传到任意静态 CDN（Cloudflare Pages / Netlify / Vercel / S3 / GitHub Pages）。

### `output: 'server'`

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

所有页面都在请求时 SSR。**必须装 adapter**，否则报错。

### 混合：单页 `prerender`

最常用——大部分静态，少数动态：

```astro
---
// src/pages/feed.astro
// 默认 output: 'static' 下，这一页改成按需
export const prerender = false;

const posts = await db.post.findMany({ orderBy: { createdAt: 'desc' } });
---

<ul>
  {posts.map((p) => <li>{p.title}</li>)}
</ul>
```

反过来（默认 `'server'` 时，某页强制静态）：

```astro
---
// src/pages/privacy.astro
export const prerender = true;   // 强制预渲染
---

<h1>隐私政策</h1>
```

> Astro 5 已删除 `output: 'hybrid'` 选项，因为 `'static' + prerender = false` 已经能完全表达混合需求。

### Adapter

```bash
# Node.js 自托管
npx astro add node

# Vercel（包括 Vercel Edge）
npx astro add vercel

# Netlify
npx astro add netlify

# Cloudflare Workers / Pages
npx astro add cloudflare
```

每个 adapter 都有 mode / runtime / region 等选项，详见各 adapter 文档。

#### Node Adapter

```js
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',    // 'standalone' 自带 server / 'middleware' 嵌入 Express
  }),
});
```

```bash
npm run build
node ./dist/server/entry.mjs      # 启动 Node server，默认 :4321
HOST=0.0.0.0 PORT=8080 node ./dist/server/entry.mjs
```

`'middleware'` 模式接入 Express / Connect / Polka：

```ts
import express from 'express';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
app.use(express.static('dist/client/'));
app.use(ssrHandler);
app.listen(8080);
```

## Server Islands

`server:defer` 让组件**延后**到服务端按需渲染，主壳秒出。

### 基础用法

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Base.astro';
import Avatar from '../components/Avatar.astro';
import GenericAvatar from '../components/GenericAvatar.astro';
---

<Layout title="首页">
  <h1>欢迎</h1>

  <!-- 主壳秒出 + CDN 缓存 -->
  <p>这里是静态内容，整个 HTML 可以缓存到 CDN。</p>

  <!-- Server island：异步加载，不阻塞主壳 -->
  <Avatar server:defer>
    <!-- 主壳里先显示 fallback（loading 占位）-->
    <GenericAvatar slot="fallback" />
  </Avatar>
</Layout>
```

```astro
---
// src/components/Avatar.astro（server island 组件）
// 这里可以读 cookie / 调数据库
const userId = Astro.cookies.get('userId')?.value;
const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null;
---

{user ? (
  <img src={user.avatarUrl} alt={user.name} />
) : (
  <a href="/login">登录</a>
)}
```

### 工作流

1. 构建期：`<Avatar server:defer />` 替换成 `<script>` 占位 + fallback HTML
2. 浏览器加载主壳（带 fallback）—— **可被 CDN 缓存**
3. 占位脚本异步 `fetch` 服务端 island 端点（带加密的 props）
4. 拿到 HTML 替换占位

### 必备条件

- 必须装 adapter（Node / Vercel / Netlify / Cloudflare）
- 组件文件必须是 `.astro`（不能是 React / Vue / Svelte）
- 整页可 `prerender = true`（主壳静态），server island 仍按需

### Props 限制

`server:defer` 的 props 会**加密**塞进 URL query：

```astro
<!-- props 通过 GET 请求传 -->
<UserCard server:defer user={user} />
```

> 默认 GET。**props 体积 > 2048 字节自动转 POST**（破坏 CDN 缓存！）。
>
> 支持的 props 类型：`string` / `number` / `boolean` / `Date` / `Map` / `Set` / `URL` / `RegExp` / 普通对象 / 数组 / typed array。**不支持** 函数、类实例、循环引用。

### Astro.url 在 server island 中

```astro
---
// 在 server:defer 组件里
console.log(Astro.url.pathname);
// → 不是页面的 URL！是 island 端点的 URL，类似 /_server-islands/Avatar
---
```

要拿到原页面 URL：

```astro
---
const referer = Astro.request.headers.get('referer');
const pageUrl = referer ? new URL(referer) : null;
---
```

### 与 Client Islands 对比

| 维度 | Client Island | Server Island |
|---|---|---|
| 数据何时拿 | 客户端（hydrate 后 fetch） | 服务端 |
| JS 是否送 | 是 | 否（仅 fallback 替换脚本） |
| 能否读 cookie / DB | 仅通过 API | 直接 `Astro.cookies` / `db.xxx` |
| 适合 | 高交互（form / drag / chart） | 个性化数据（user avatar、A/B 实验） |

## Actions（类型安全的 RPC）

Astro Actions（4.15+ 稳定）提供从客户端到服务端的类型安全调用。

### 定义 Action

```ts
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';   // Astro 5；Astro 6 改 astro/zod

export const server = {
  // 普通 RPC
  createPost: defineAction({
    input: z.object({
      title: z.string().min(1),
      body: z.string(),
    }),
    handler: async ({ title, body }, context) => {
      const userId = context.locals.user?.id;
      if (!userId) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: '请先登录' });
      }

      const post = await db.post.create({
        data: { title, body, authorId: userId },
      });
      return { post };
    },
  }),

  // 接 FormData（accept: 'form'）
  uploadAvatar: defineAction({
    accept: 'form',
    input: z.object({
      avatar: z.instanceof(File),
    }),
    handler: async ({ avatar }, context) => {
      // 上传到 S3 / R2 ...
      return { url: 'https://...' };
    },
  }),
};
```

### Client 调用（JSON）

```tsx
// src/components/CreateButton.tsx
import { actions } from 'astro:actions';
import { useState } from 'react';

export default function CreateButton() {
  const [title, setTitle] = useState('');

  const handleSubmit = async () => {
    // 类型安全！actions.createPost.input 严格匹配 zod schema
    const { data, error } = await actions.createPost({
      title,
      body: '...',
    });

    if (error) {
      alert(error.message);
    } else {
      console.log('created', data.post);
    }
  };

  return (
    <>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button onClick={handleSubmit}>Create</button>
    </>
  );
}
```

### 表单调用（progressive enhancement）

```astro
---
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.uploadAvatar}>
  <input name="avatar" type="file" required />
  <button>Upload</button>
</form>
```

> 无 JS 也能跑（form POST 到 `/_actions/uploadAvatar`），刷页面后可在页面里读结果：

```astro
---
// 同一页 .astro
import { actions } from 'astro:actions';

const result = Astro.getActionResult(actions.uploadAvatar);
---

{result && !result.error && (
  <p>上传成功：{result.data.url}</p>
)}
```

### 在 `.astro` 服务端调用

```astro
---
import { actions } from 'astro:actions';

const { data, error } = await Astro.callAction(actions.createPost, {
  title: 'Hello',
  body: 'World',
});
---
```

### `safe()` / `orThrow()` 区分

```ts
// safe（默认）：返回 { data, error }
const { data, error } = await actions.foo(input);
if (error) { /* ... */ }

// orThrow：直接抛错（适合中间件 / try-catch 流）
try {
  const data = await actions.foo.orThrow(input);
} catch (err) {
  // ActionError
}
```

### Error Codes

```ts
import { ActionError } from 'astro:actions';

throw new ActionError({
  code: 'BAD_REQUEST',          // 也可 UNAUTHORIZED / FORBIDDEN / NOT_FOUND / TIMEOUT / ...
  message: '参数错误',
});
```

## View Transitions

跨页动画 + SPA-like 导航。基于浏览器 [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)，不支持的浏览器优雅降级。

### 启用

在根 layout 的 `<head>` 加 `<ClientRouter />`：

```astro
---
// src/layouts/Base.astro
import { ClientRouter } from 'astro:transitions';
---

<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title><slot name="title" /></title>
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

> Astro 5.5+ 改名 `<ViewTransitions />` → `<ClientRouter />`；Astro 6 完全移除旧名。

启用后：

- 原生 `<a href>` 不再触发 reload；走客户端导航
- 默认所有页之间用 fade 动画
- 自动响应 `prefers-reduced-motion`

### `transition:name`：跨页元素配对

两个页面里有相同 `transition:name` 的元素 → 浏览器自动 morph：

```astro
<!-- 列表页 -->
<a href={`/blog/${post.slug}`}>
  <img src={post.image} transition:name={`post-img-${post.id}`} />
  <h2 transition:name={`post-title-${post.id}`}>{post.title}</h2>
</a>

<!-- 详情页 -->
<article>
  <img src={post.image} transition:name={`post-img-${post.id}`} />
  <h1 transition:name={`post-title-${post.id}`}>{post.title}</h1>
</article>
```

> 推荐用唯一 ID（不要写死同一个 name），避免页内多个元素冲突。

### `transition:animate`

```astro
<!-- 内置动画 -->
<div transition:animate="fade">...</div>     <!-- 默认 -->
<div transition:animate="slide">...</div>
<div transition:animate="initial">...</div>  <!-- 浏览器默认 -->
<div transition:animate="none">...</div>     <!-- 禁用 -->

<!-- 自定义 -->
---
import { fade, slide } from 'astro:transitions';
const myFade = fade({ duration: '0.4s' });
---
<div transition:animate={myFade}>...</div>
```

### `transition:persist`：持久化

跨页保留某些 DOM / 状态（适合视频、音乐播放器、聊天框）：

```astro
<audio transition:persist src="/podcast.mp3" controls></audio>

<!-- React/Vue/Svelte 组件也可以保持 hydrate 状态 -->
<MusicPlayer client:load transition:persist />
```

### 生命周期事件

```js
// src/scripts/transitions.ts
document.addEventListener('astro:before-preparation', () => {
  console.log('开始导航，准备阶段');
});

document.addEventListener('astro:after-preparation', () => {
  console.log('数据加载完成');
});

document.addEventListener('astro:before-swap', (event) => {
  console.log('准备替换 DOM');
  // event.newDocument 可在替换前修改
});

document.addEventListener('astro:after-swap', () => {
  console.log('DOM 已替换');
});

document.addEventListener('astro:page-load', () => {
  console.log('页面 + 脚本就绪');
});
```

### 程序化导航

```ts
import { navigate } from 'astro:transitions/client';

// 跳转（走客户端路由，触发 transition）
navigate('/about');

// 替换历史（不入栈）
navigate('/about', { history: 'replace' });

// 强制重新加载
navigate('/about', { history: 'auto' });
```

### 跳过客户端路由的链接

```astro
<a href="/old-page" data-astro-reload>强制全页刷新</a>
```

### 替换 history entry

```astro
<a href="/new" data-astro-history="replace">不入栈</a>
```

## Image 优化

Astro 内置 `<Image />` / `<Picture />`，构建期自动生成 WebP / AVIF + 防 CLS。

### `<Image />` 基础

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.png';  // 本地资源
---

<!-- 本地图片：自动推断 width / height -->
<Image src={hero} alt="主图" />

<!-- 远程图片：必须指定 width + height -->
<Image
  src="https://example.com/photo.jpg"
  width={800}
  height={600}
  alt="照片"
/>
```

输出：

```html
<img
  src="/_astro/hero.abc123.webp"
  width="1920" height="1080"
  alt="主图"
  loading="lazy"
  decoding="async"
/>
```

### Image 属性

```astro
<Image
  src={hero}
  alt="主图"
  width={1280}                                <!-- 输出宽度 -->
  height={720}
  format="avif"                               <!-- avif | webp | jpg | png -->
  quality={80}                                <!-- 1-100 或预设 -->
  loading="eager"                             <!-- lazy | eager -->
  densities={[1, 2]}                          <!-- @2x retina -->
  widths={[400, 800, 1200]}                   <!-- 响应式 srcset -->
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 响应式 layout（5.10+）

```astro
<Image src={hero} alt="..." layout="responsive" />
<Image src={hero} alt="..." layout="fixed" width={400} height={300} />
<Image src={hero} alt="..." layout="full-width" />
```

Astro 自动算 srcset / sizes，浏览器选最合适的版本。

### `<Picture />`：多源

```astro
---
import { Picture } from 'astro:assets';
import hero from '../assets/hero.png';
---

<Picture
  src={hero}
  alt="主图"
  formats={['avif', 'webp']}     <!-- 各浏览器自选 -->
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

输出：

```html
<picture>
  <source type="image/avif" srcset="..." sizes="..." />
  <source type="image/webp" srcset="..." sizes="..." />
  <img src="/_astro/hero.abc123.png" alt="主图" ... />
</picture>
```

### 远程图片授权

默认不优化远程图片（防滥用）。要优化，在 config 显式允许：

```js
// astro.config.mjs
export default defineConfig({
  image: {
    domains: ['cdn.example.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.example.com' },
    ],
  },
});
```

### Markdown 中的图片

```md
![alt](./hero.png)         <!-- 相对路径自动优化 -->
![alt](/static/hero.png)   <!-- 绝对路径（public/ 下不优化）-->
```

MDX 还能用 `<Image>`：

```mdx
import { Image } from 'astro:assets';
import hero from './hero.png';

# 标题

<Image src={hero} alt="主图" />
```

### `getImage()`：自定义场景

```ts
import { getImage } from 'astro:assets';
import hero from '../assets/hero.png';

const optimized = await getImage({ src: hero, width: 800, format: 'webp' });
// optimized.src / .width / .height / .attributes
```

### Image Service

默认用 **Sharp**（Astro 5 起为唯一官方选项，Squoosh 已移除）。

```js
// astro.config.mjs
export default defineConfig({
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },   // 默认
    // service: { entrypoint: './my-custom-image-service.js' }, // 自定义
  },
});
```

## Sessions（5.7+）

服务端 session 存储，比 cookie 容量大、支持复杂类型。

### 配置

```js
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  session: {
    driver: 'fs',                              // 文件系统（适合 Node 自托管）
    // driver: 'redis',                        // 适合分布式
    // options: { url: process.env.REDIS_URL },
    cookie: 'astro-session',                   // cookie 名
    ttl: 60 * 60 * 24 * 7,                     // 7 天
  },
});
```

> 大部分 adapter（Node / Cloudflare / Netlify）有默认 driver；只有 Vercel / 自定义环境需要显式指定。

### 用法

```astro
---
// src/pages/dashboard.astro
export const prerender = false;

const cart = await Astro.session.get('cart');
const newCart = [...(cart ?? []), 'item-1'];
await Astro.session.set('cart', newCart);
---

<p>购物车有 {newCart.length} 件商品</p>
```

```ts
// src/pages/api/checkout.ts
export const POST: APIRoute = async ({ session }) => {
  const cart = await session.get('cart');
  // 结算 ...
  await session.destroy();              // 清空 session
  return Response.json({ ok: true });
};
```

### TypeScript

```ts
// src/env.d.ts
declare namespace App {
  interface SessionData {
    cart: string[];
    user: { id: string; name: string };
  }
}
```

之后 `session.get('cart')` 自动推断为 `string[] | undefined`。

### 主要方法

```ts
await Astro.session.get('key');         // 读
await Astro.session.set('key', value);  // 写
await Astro.session.regenerate();       // 换新 session ID（防固定攻击）
await Astro.session.destroy();          // 销毁 session
await Astro.session.load(sessionId);    // 手动加载特定 session
```

### 序列化支持

通过 [devalue](https://github.com/Rich-Harris/devalue) 序列化，支持 `string` / `number` / `Date` / `Map` / `Set` / `URL` / `RegExp` / `BigInt` / 普通对象 / 数组。

## On-demand only API

只在 `prerender = false` 或 `output: 'server'` 时可用：

- `Astro.clientAddress` —— 客户端 IP
- `Astro.cookies.set()` / `.delete()` —— 写 cookie
- `Astro.request.headers` —— 读请求头（静态时为构建期的）
- `Astro.session` —— 服务端 session

构建期访问会抛错。

## Streaming（流式响应）

Astro 默认就支持流式 SSR：`render()` 把 HTML 分块送出。配合 `Suspense`-like 模式：

```astro
---
// 顶层 await 会阻塞流
const data = await slowFetch();
---

<div>{data.title}</div>

<!-- Server Islands 是流式的关键 -->
<SlowComponent server:defer>
  <Loading slot="fallback" />
</SlowComponent>
```

主壳和 fallback 立即流出，server island 准备好后追加。

## `astro:env`：类型安全环境变量

```js
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      // 客户端可读，public
      PUBLIC_API_URL: envField.string({
        context: 'client',
        access: 'public',
      }),

      // 仅服务端读，secret
      DATABASE_URL: envField.string({
        context: 'server',
        access: 'secret',
      }),

      // 服务端 public（client 也能读，但 server 才注入）
      LOG_LEVEL: envField.enum({
        values: ['debug', 'info', 'warn', 'error'],
        context: 'server',
        access: 'public',
        default: 'info',
        optional: true,
      }),

      // 数字
      MAX_UPLOAD_MB: envField.number({
        context: 'server',
        access: 'public',
        default: 10,
      }),

      // 布尔
      ENABLE_BETA: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
});
```

### 使用

```ts
// 仅客户端能 import 的 public 变量
import { PUBLIC_API_URL } from 'astro:env/client';

// 仅服务端能 import
import { DATABASE_URL, LOG_LEVEL } from 'astro:env/server';
```

```astro
---
// .astro 文件（服务端）
import { DATABASE_URL } from 'astro:env/server';

const conn = await connect(DATABASE_URL);
---
```

```ts
// API 端点
import { DATABASE_URL } from 'astro:env/server';

export const GET: APIRoute = async () => {
  const data = await db.query(DATABASE_URL, 'SELECT ...');
  return Response.json(data);
};
```

### `getSecret()` 动态读

```ts
import { getSecret } from 'astro:env/server';

const apiKey = getSecret('STRIPE_API_KEY');   // string | undefined
```

### 启用 validate 阻止构建

```js
env: {
  validateSecrets: true,   // 构建期校验 secret 已设置
  schema: { /* ... */ },
}
```

## 默认 Astro 全局变量

不用配 schema，开箱可用：

```ts
import.meta.env.MODE        // 'development' | 'production'
import.meta.env.PROD        // boolean
import.meta.env.DEV         // boolean
import.meta.env.SSR         // boolean（true = 服务端）
import.meta.env.BASE_URL    // config.base
import.meta.env.SITE        // config.site
import.meta.env.ASSETS_PREFIX // config.build.assetsPrefix
```

## 部署模式总结

| 模式 | output | adapter | 部署到 |
|---|---|---|---|
| 静态站 | `'static'`（默认） | 不需要 | 任意静态 CDN |
| 静态 + 部分动态 | `'static'` + 单页 `prerender = false` | 必须 | Vercel / Netlify / Node / Cloudflare |
| 全 SSR | `'server'` | 必须 | 同上 |
| Edge | `'server'` | `@astrojs/cloudflare` / `@astrojs/vercel` (Edge) | Cloudflare Workers / Vercel Edge |

## 下一步

- Content Layer 深度 / DB / i18n / Streaming / Middleware / 多框架混用 见 [指南 - 高级](./expert.md)
- vs Next.js / Nuxt / SvelteKit / Astro 5 → 6 升级 / 常见踩坑 见 [指南 - 其他](./other.md)
- 全部文件约定 / `Astro` 全局对象 / 配置速查 见 [参考](../reference.md)
