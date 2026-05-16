---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Nuxt 4.4.x 编写

## 速查

- 系统要求：Node.js **20.19+** / **22.12+** / **24+**
- 创建：`pnpm dlx nuxi@latest init my-app`
- 启动：`pnpm dev`（默认 `http://localhost:3000`）
- 主要目录（Nuxt 4 默认在 `app/` 下）：`pages/` 路由 / `components/` 组件 / `composables/` 自动导入函数 / `layouts/` 布局 / `middleware/` 路由守卫 / `plugins/` 插件
- 与 `app/` 同级：`server/` 后端 / `content/` Markdown / `public/` 静态资源 / `shared/` 双端共用 / `nuxt.config.ts` 配置
- 路由：文件即路由（`pages/index.vue` → `/`、`pages/[id].vue` → `/:id`）
- 数据：`useFetch('/api/x')` / `useAsyncData('key', fn)`，SSR + 客户端复用
- API：`server/api/x.ts` 自动暴露为 `/api/x`
- 部署：`pnpm build` 生成 `.output/`，可部署到 Node / Vercel / Netlify / Cloudflare / Deno / Bun

## 安装与首次启动

最快路径：

```bash
# 创建项目（交互式：选 git / pnpm / TS / ESLint 等）
pnpm dlx nuxi@latest init my-app

cd my-app
pnpm install
pnpm dev
```

打开 `http://localhost:3000`，首屏即默认 Welcome 页。**HMR + SSR 默认开启**。

::: warning Node 版本

Nuxt 4 最低要求 **Node 20.19 / 22.12 / 24** —— 关键修复决定了这条线。CI 镜像和同事机器先把 Node 升到至少 LTS。

:::

## 项目结构

Nuxt 4 默认结构（vs Nuxt 3 把所有目录都放在根）：

```
my-app/
├── app/                    # 客户端代码（核心区）
│   ├── pages/              # 文件路由（必备）
│   ├── components/         # 组件，自动导入
│   ├── composables/        # 自动导入的函数
│   ├── layouts/            # 布局模板
│   ├── middleware/         # 路由守卫
│   ├── plugins/            # 客户端插件
│   ├── assets/             # 经 bundler 处理的资源（图片 / SCSS 等）
│   ├── app.vue             # 根组件（包 <NuxtPage /> 渲染路由）
│   └── error.vue           # 错误页
├── server/                 # 服务端（Nitro 引擎）
│   ├── api/                # /api/* 端点
│   ├── routes/             # 不带 /api 前缀的路由
│   ├── middleware/         # 服务端中间件
│   ├── utils/              # 服务端工具
│   └── plugins/            # Nitro 插件
├── shared/                 # 双端共用代码（types / consts）
├── content/                # Markdown 内容（@nuxt/content 用）
├── layers/                 # 项目分层
├── modules/                # 本地模块
├── public/                 # 直接拷贝的静态资源
├── nuxt.config.ts          # 主配置
├── app.config.ts           # 运行时可改的配置
└── package.json
```

::: tip Nuxt 3 → Nuxt 4 迁移

如果你有 Nuxt 3 项目，启动时 Nuxt 会自动识别旧布局（pages / components 在根目录），无需立刻搬。但官方建议尽快移到 `app/`——能改善 IDE 性能（`.git` 和 `node_modules` 不再被扫）+ 让 TypeScript 区分客户端 / 服务端上下文。

迁移命令：

```bash
pnpm dlx nuxt upgrade  # 跑迁移 codemod
```

:::

## 第一个页面

`pages/index.vue` 是路由 `/`：

```vue
<template>
  <div>
    <h1>Hello Nuxt 4 👋</h1>
    <NuxtLink to="/about">About</NuxtLink>
  </div>
</template>
```

`pages/about.vue` 是 `/about`：

```vue
<template>
  <div>
    <h1>About</h1>
    <NuxtLink to="/">Home</NuxtLink>
  </div>
</template>
```

`app.vue` 作为根，包含 `<NuxtPage />` 渲染当前路由的页面：

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

::: warning 页面必须**单根元素**

Nuxt 路由切换走 transition，要求每个 page 组件**根节点唯一**。两个并列的 `<div>` 会触发 vue-router 警告。

:::

## 动态路由与参数

```
pages/
├── users/
│   ├── index.vue       → /users
│   └── [id].vue        → /users/:id
└── blog/
    └── [...slug].vue   → /blog/*（catch-all）
```

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: user } = await useFetch(`/api/users/${route.params.id}`);
</script>

<template>
  <h1>{{ user?.name }}</h1>
</template>
```

可选参数 `[[slug]].vue` 匹配 `/blog` 和 `/blog/test`。

## 数据获取：useFetch / useAsyncData

```vue
<script setup lang="ts">
// useFetch：自动按 URL 当 key，SSR 时服务端取数据 + 客户端复用 payload
const { data, pending, error, refresh } = await useFetch('/api/articles');

// useAsyncData：要自己传 key（避免重复请求）+ 自定义 fetcher
const { data: user } = await useAsyncData('user-current', () =>
  $fetch('/api/me'),
);
</script>

<template>
  <div v-if="pending">加载中…</div>
  <ul v-else>
    <li v-for="a in data" :key="a.id">{{ a.title }}</li>
  </ul>
</template>
```

::: tip 区别

- **`useFetch(url)`** = `useAsyncData(url, () => $fetch(url))` 的语法糖；适合直接拉 URL
- **`useAsyncData(key, fn)`** = 任意 async 函数 + 你提供 key；适合复杂逻辑、多请求合并

两者都自动处理 SSR payload → 客户端 hydration，**不会双拉**。

:::

## 第一个 API 端点

`server/api/hello.ts` 自动暴露为 `/api/hello`：

```ts
// server/api/hello.ts
export default defineEventHandler((event) => {
  return { message: 'Hello from Nitro' };
});
```

带方法：

```
server/api/
├── articles.get.ts        → GET /api/articles
├── articles.post.ts       → POST /api/articles
└── articles/[id].delete.ts → DELETE /api/articles/:id
```

```ts
// server/api/articles.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // 写库 / 校验 / 返回
  return { id: 42, ...body };
});
```

Nuxt 客户端用 `$fetch('/api/articles', { method: 'POST', body: { ... } })` 调，**类型自动推导**——只要 handler 有返回值，前端 `useFetch` 的 `data` 就有正确类型。

## 一份能跑的最小示例

```
my-app/
├── app/
│   ├── pages/
│   │   ├── index.vue
│   │   └── articles/[id].vue
│   └── app.vue
├── server/api/
│   ├── articles.get.ts
│   └── articles/[id].get.ts
└── nuxt.config.ts
```

```vue
<!-- app/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { data: articles } = await useFetch('/api/articles');
</script>

<template>
  <div>
    <h1>Articles</h1>
    <ul>
      <li v-for="a in articles" :key="a.id">
        <NuxtLink :to="`/articles/${a.id}`">{{ a.title }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
```

```vue
<!-- app/pages/articles/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: article } = await useFetch(`/api/articles/${route.params.id}`);
</script>

<template>
  <article v-if="article">
    <h1>{{ article.title }}</h1>
    <p>{{ article.body }}</p>
  </article>
</template>
```

```ts
// server/api/articles.get.ts
const articles = [
  { id: 1, title: 'Hello Nuxt', body: '...' },
  { id: 2, title: 'Nitro is cool', body: '...' },
];
export default defineEventHandler(() => articles);
```

```ts
// server/api/articles/[id].get.ts
const articles = [
  { id: 1, title: 'Hello Nuxt', body: '...' },
  { id: 2, title: 'Nitro is cool', body: '...' },
];
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'));
  return articles.find((a) => a.id === id);
});
```

`pnpm dev` → 浏览器打开 `/`，看到文章列表；点进去看详情。**没装数据库 / 没配 Express / 没写 SSR 逻辑**——Nuxt 全包了。

## 下一步

- 自动导入 / NuxtLink / 数据获取细节见 [指南 - 基础](./guide-line/base.md)
- 布局、中间件、插件、状态管理（useState / Pinia）见 [指南 - 进阶](./guide-line/advanced.md)
- Nitro 服务端 + 渲染模式 + 模块开发 + 部署见 [指南 - 高级](./guide-line/expert.md)
- v3 → v4 迁移 + vs Next.js + 测试 + 性能 + 常见陷阱见 [指南 - 其他](./guide-line/other.md)
- CLI / 配置项 / 内置 composables 速查见 [参考](./reference.md)
