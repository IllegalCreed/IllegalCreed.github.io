---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 onmax/nuxt-skills（社区项目，非官方，Nuxt 4+）的 README 与各 skills/ 编写；核心模式取自 `nuxt`、`nuxthub` 等 `SKILL.md` 及其 `references/`。

## 速查

- **渐进披露**：`SKILL.md`（~300 token 入口）→ 按任务再加载 `references/*.md`（每个 ~800–1500 token），**别一次全读**
- **多 skill 分工**：`nuxt` 管服务端/路由，`vue` 管组件/composables，`nuxt-ui` 管 UI，`nuxthub` 管存储，`nuxt-content` 管内容——skill 之间互相「转介」
- **Nuxt 4 目录**：客户端代码进 `app/`（`app/app.vue`、`app/pages/`、`app/components/`…），服务端仍在 `server/`，`nuxt.config.ts` 在根
- **数据获取**：组件里用 `useFetch` / `useAsyncData`（去重 + SSR），**别用裸 `fetch()`**；跨组件共享态用 `useState`
- **server 路由**：`server/api/users.get.ts` → `GET /api/users`；取参 `getRouterParam(event, 'userId')`，**别用 `event.context.params`**
- **红旗纠错**：`nuxt` skill 会主动拦截 `[id]` 泛参、Nuxt 3 旧 API 等过时写法
- **生态 skills**：`nuxthub`（DB/KV/Blob/Cache）、`nuxt-content`（collections/queryCollection/MDC）、`nuxt-ui`（v4 组件/表单/主题）、`reka-ui`（无头）、`tresjs`（3D）、`nuxt-seo`（sitemap/og）

## 渐进披露：省 token 的分层加载

每个 skill 不是一坨大文档，而是**入口 + 按需子文件**：

- `SKILL.md`：~300 token，只讲「何时用 / 有哪些子文件 / 快速开始」
- `references/*.md`：每个 ~800–1500 token，agent **只在任务相关时才加载**

以 `nuxt` skill 为例，它的入口会列出一张「加载清单」，让 agent 按当前任务勾选：

```md
- [ ] references/server.md          # 建 API 端点 / 服务端中间件时
- [ ] references/routing.md         # 建 pages / layouts / route groups 时
- [ ] references/nuxt-composables.md # 用 useFetch / useRequestURL 等时
- [ ] references/nuxt-config.md     # 改 nuxt.config.ts 时
```

> 入口里明写 **「DO NOT load all files at once」**——这是 skill 省 token 的核心：主 skill 常驻，子文件用完即走。

## 多 skill 组织：各司其职，互相转介

21 个 skill 不是各写各的，而是**明确分工 + 互相转介**。`nuxt` skill 的入口就写着「遇到这些去用那个 skill」：

| 你要做的事 | 用哪个 skill |
| --- | --- |
| Vue 组件 / composables 模式 | `vue` |
| UI 组件（Button/Table/Form） | `nuxt-ui` |
| 数据库 / KV / Blob 存储 | `nuxthub` |
| 内容驱动站点（Markdown/CMS） | `nuxt-content` |
| 写 Nuxt 模块 | `nuxt-modules` |
| 项目脚手架 / CI | `ts-library` |

这样每个 skill 保持精简、职责单一，组合起来覆盖全栈。

## nuxt 核心 1：Nuxt 4 的 `app/` 目录

Nuxt 4 最显眼的结构变化是引入 **`app/`（新 srcDir）**，把客户端代码和服务端/配置分开：

```txt
my-app/
├── app/                # 客户端代码（Nuxt 4 新 srcDir）
│   ├── app.vue
│   ├── pages/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   └── plugins/
├── server/             # 服务端（API/中间件/utils）
├── public/             # 静态资源
├── content/            # Nuxt Content（若用）
└── nuxt.config.ts      # 配置（仍在根）
```

`nuxt` skill 还会用一张对照表把 Nuxt 3 旧写法映射到 Nuxt 4：

| 旧（Nuxt 2/3） | 新（Nuxt 4） |
| --- | --- |
| `<Nuxt />` | `<NuxtPage />` |
| `context.params` | `getRouterParam(event, 'name')` |
| `window.origin` | `useRequestURL().origin` |
| 字符串路由 | 带路由名的类型化 router |
| 独立 `layouts/` | 父路由 + `<slot>` |

## nuxt 核心 2：数据获取与共享状态

组件里获取数据，**用 `useFetch` / `useAsyncData`，不要用裸 `fetch()`**——前者自带请求去重与 SSR 支持：

```ts
// 基础用法：拿到 data / error / status / refresh
const { data, error, status, refresh } = await useFetch('/api/users')

// 带 key 去重（同一 key 只发一次）
const { data: user } = await useFetch(`/api/users/${userId}`, {
  key: `user-${userId}`,
})

// 监听依赖自动重取
const page = ref(1)
const { data: list } = await useFetch('/api/users', {
  query: { page },
  watch: [page],
})
```

`useAsyncData` 用于「自定义异步逻辑」（不止是一个 URL）：

```ts
const { data } = await useAsyncData('active-users', async () => {
  const res = await $fetch('/api/users')
  return res.filter(u => u.active)
})
```

> **Nuxt 4 细节**：`useAsyncData` 的 `data` 默认是**浅响应式**（Nuxt 3 是深响应式），嵌套对象要响应式需传 `deep: true`；Nuxt 4.2+ 还支持 `dedupe: 'cancel' | 'defer'` 与 `AbortController` 取消。

跨组件共享状态用 `useState`（SSR 安全的全局态）：

```ts
const counter = useState('counter', () => 0)
const user = useState<User | null>('user', () => null)
```

## nuxt 核心 3：server 路由（h3 v1 + nitro v2）

`server/` 目录下**文件名决定 HTTP 方法与路由**：

```txt
server/
├── api/
│   ├── users.get.ts          # GET  /api/users
│   ├── users.post.ts         # POST /api/users
│   └── users/[userId].get.ts # GET  /api/users/:userId
├── routes/healthz.get.ts     # GET  /healthz（非 /api）
├── middleware/log.ts         # 服务端中间件
└── utils/db.ts               # 自动导入的服务端工具
```

取路由参数用 `getRouterParam`，验证用 h3 助手 + Zod，出错抛 `createError`：

```ts
// server/api/users/[userId].get.ts
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }
  const user = await fetchUserById(userId)
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  return user
})
```

> **红旗（Red Flags）**：`nuxt` skill 会主动拦这些过时念头——「我用 `event.context.params` 就行」「泛型 `[id]` 参数没问题」「不需要 `.get.ts` 后缀」「我记得 Nuxt 3 是怎么写的」——命中即换 Nuxt 4 写法（用 `getRouterParam`、用**描述性参数名** `[userId]`、带方法后缀）。注意版本：Nuxt 用 **h3 v1 + nitropack v2**，别套 h3 v2 / nitro v3 的文档。

## nuxt 核心 4：SSR 与 hydration

Nuxt 默认 SSR——服务端先渲染 HTML，客户端再「注水（hydration）」接管。skill 反复强调的关键点：

- **`window` 在 SSR 阶段不存在**：取地址用 `useRequestURL()`（SSR + 客户端通用），别用 `window.origin` / `window.location`
- **数据获取要 SSR 安全**：`useFetch` / `useAsyncData` 会在服务端取好数据、随 HTML 送到客户端，避免二次请求与 hydration 不匹配
- **私有配置只在服务端**：`useRuntimeConfig().apiSecret` 在客户端为 `undefined`，公开值放 `.public`

```ts
const url = useRequestURL()
console.log(url.origin)   // https://example.com（SSR 也可用）
const apiUrl = `${url.origin}/api/users`
```

## 生态 skills 巡览

装进来的不止 `nuxt`——一整套 Nuxt 全栈 skill 各管一摊：

- **`nuxthub`**（NuxtHub v0.10.6）：全栈存储——`hub:db`（Drizzle ORM，sqlite/postgresql/mysql）、`hub:kv`、`hub:blob`、cache；多云部署（Cloudflare/Vercel/Deno/Netlify）
- **`nuxt-content`**（v3）：`content.config.ts` 定义 collections、`queryCollection` 类 SQL 查询、MDC 在 Markdown 里用 Vue 组件、`<ContentRenderer>` 渲染、NuxtStudio 集成
- **`nuxt-ui`**（v4.4）：基于 Reka UI + Tailwind v4 的组件库，`<UApp>` 包裹、语义色、Tailwind Variants 主题、Zod/Valibot 表单校验
- **`reka-ui`**（v2，前身 Radix Vue）：无头 Vue 组件，可访问性、`asChild`、受控/非受控
- **`nuxt-seo`**：meta 元模块，robots / sitemap / og-image / schema-org / site config
- **`tresjs`**：Vue 版 Three.js，`<TresCanvas>`、Cientos 助手（OrbitControls/useGLTF）、后处理
- **`vueuse`**（v14）、**`motion`**（motion-v）、**`nuxt-better-auth`**、**`nuxt-modules`**、**`nuxt-studio`** 各补一环

一个 NuxtHub 数据库定义长这样：

```ts
// server/db/schema.ts（SQLite）
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
})
```

## 反模式与边界

- **别把它当官方**：社区个人项目，非 `nuxt` org；文档里如实标注
- **别用 Nuxt 3 旧写法**：`event.context.params`、`[id]` 泛参、`<Nuxt />`、`window.origin`——skill 的红旗就是拦这些
- **别一次加载所有 references**：违背渐进披露，白烧 token
- **别迷信 skill 里的版本号**：NuxtHub v0.10.6、Nuxt UI v4.4 等是快照，破坏性变更以上游官方为准
- **别用裸 `fetch()` 取数据**：丢掉去重与 SSR，易致 hydration 不匹配

## 下一步

- [参考](./reference) —— 21 skills 分组全表 + 安装/多 agent + 版本 + 贡献 + 许可 + 链接
- 上游：[onmax/nuxt-skills](https://github.com/onmax/nuxt-skills) ｜ [Nuxt 官方文档](https://nuxt.com/docs)
