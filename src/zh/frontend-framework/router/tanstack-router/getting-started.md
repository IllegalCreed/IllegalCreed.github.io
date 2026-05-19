---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **TanStack Router v1.x**（`@tanstack/react-router`）编写。本笔记主讲 **React 版**——TanStack Router 也有 [Solid 实现](https://tanstack.com/router/v1/docs/framework/solid/overview)（`@tanstack/solid-router`），API 几乎一致。

## 速查

- 系统要求：**Node.js 20+** + **React 18.x 或 19.x** + **TypeScript 5+**（强烈推荐 5.5+，类型推导更准）
- 安装核心：`pnpm add @tanstack/react-router`
- 安装 Vite 插件（File-based 必需）：`pnpm add -D @tanstack/router-plugin`
- 安装 Devtools：`pnpm add -D @tanstack/react-router-devtools`
- Vite 插件名：`tanstackRouter({ target: 'react' })`（**必须放在 `viteReact()` 之前**）
- 路由目录：`src/routes/`，根路由 `src/routes/__root.tsx`
- 自动生成：`src/routeTree.gen.ts` 由 Vite 插件 dev / build 时生成（**多数项目 gitignore**）
- 入口：`createRouter({ routeTree })` + `<RouterProvider router={router} />`
- File-based 路由：`createFileRoute('/path/$param')({ component, loader, ... })`，必须导出为 `Route`
- Code-based 路由：`createRootRoute()` + `createRoute({ getParentRoute, path })` + `rootRoute.addChildren([...])`
- 导航组件：`<Link to="/path" params={...} search={...}>`
- 编程式导航：`const navigate = useNavigate(); navigate({ to: '/posts', search: { page: 2 } })`
- 类型注册：`declare module '@tanstack/react-router' { interface Register { router: typeof router } }`
- 命名导出：`@tanstack/react-router` 全部命名导出（**无默认导出**）

## TanStack Router 是什么

TanStack Router 是 [TanStack](https://tanstack.com) 团队（Tanner Linsley）打造的「**类型安全到极致的客户端路由库**」——主推 React、也有 Solid 版，是 [TanStack Start](../../meta/tanstack-start/) 全栈元框架的**路由层**，也可作为独立的客户端路由单独使用。

它与同类路由库的本质差异：

| 维度 | TanStack Router | React Router v7 | Vue Router 4 | Next.js App Router |
|---|---|---|---|---|
| 阵营 | TanStack（跨框架） | Remix Team | Vue 官方 | Next.js / Vercel |
| 路由定义 | 文件 + 代码（双轨） | 文件 + `routes.ts` 配置 | 配置（routes 数组） | 100% 文件系统 |
| 路径类型化 | **运行时自动生成 + 注册** | typegen `.d.ts` | unplugin-vue-router | 半自动 |
| Search Params | **一等公民 + Zod 校验** | 手动 URLSearchParams | 手动 / 自定义 | 手动 |
| 数据加载 | Loader + beforeLoad + Context | Loader + clientLoader | watcher / Data Loaders 试验 | Server Components |
| 数据 mutation | 配合 mutation 工具（无内置 action） | Action + Form | 无内置 | Server Actions |
| 缓存 | **内置 SWR**（staleTime / gcTime） | 无内置 | 无内置 | RSC 缓存层 |
| 错误边界 | 路由级 errorComponent / notFoundComponent | errorElement | 全局 error 组件 | error.tsx 文件约定 |
| Bundle | ~50KB gzip（含 devtools） | ~15KB gzip | ~10KB gzip | 大（含 Next 框架） |
| 学习曲线 | **陡**（编译期类型 + 多概念） | 中 | 平 | 陡（RSC） |

**含义**：

- TanStack Router 与 React Router v7 心智最像——都是 **「Loader-first + 路径参数 + 嵌套路由」**，但 TSR 的类型化和 search params 校验远比 RR7 完善
- 与 Vue Router 完全不可比——一个 Vue 一个 React，哲学不同
- 与 Next.js App Router 哲学对立——Next 押注 RSC（默认服务端），TSR 押注同构（默认全客户端）+ 配 TanStack Start 时通过 `createServerFn` 显式声明服务端
- **适合**：重度使用 search params 作为应用状态的 SaaS / Dashboard / 电商列表 / 复杂筛选；TanStack Query 重度用户；从 React Location 迁移
- **不适合**：不写 TypeScript（浪费 80% 卖点）；极简 SPA（React Router 心智更低）；需要 RSC（用 Next.js）

## 安装

### 在新项目中（推荐：File Router 起步）

最简单的方式是从官方模板克隆：

```bash
# Vite + File Router 起步模板
npx gitpick TanStack/router/tree/main/examples/react/quickstart-file-based my-app
cd my-app
pnpm install
pnpm dev
```

或者用 TanStack 官方 CLI（创建包含 TanStack Start 全栈框架）：

```bash
# 注意：这是 TanStack Start CLI，会创建全栈项目而非纯 Router
npx @tanstack/cli@latest create
```

> 如果你只想要**纯路由库**而非全栈框架，建议从模板克隆或手动安装 —— `@tanstack/cli` 主要面向 Start。

### 在已有 Vite + React 项目中安装

```bash
# 路由核心 + Vite 插件 + Devtools
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin @tanstack/react-router-devtools
```

或用 npm / yarn：

```bash
npm install @tanstack/react-router
npm install -D @tanstack/router-plugin @tanstack/react-router-devtools
```

### React 版本要求

| React 版本 | TanStack Router 版本 |
|---|---|
| **React 18.x / 19.x** | **TanStack Router 1.x**（推荐） |
| React 17 及以下 | 不支持（v1 要求 React 18+） |

### TypeScript 版本

| TypeScript 版本 | 兼容性 |
|---|---|
| **5.5+** | 推荐——`Register` 接口推导最准 |
| 5.3 - 5.4 | 可用——部分高级类型推导可能滞后 |
| 5.2 及以下 | 不推荐（路径模板字符串类型不全） |

## 配置 Vite 插件

TanStack Router 的 File-based routing 由 Vite 插件 `@tanstack/router-plugin/vite` 提供，它会扫描 `src/routes/` 目录并生成 `src/routeTree.gen.ts` 路由树。

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // 必须在 react() 之前——它会转换 routes 目录
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true, // 默认 true，路由 component 自动分包
    }),
    react(),
  ],
})
```

**关键选项**：

| 选项 | 默认 | 说明 |
|---|---|---|
| `target` | 必填 | `'react'` / `'solid'` |
| `routesDirectory` | `'./src/routes'` | 路由目录 |
| `generatedRouteTree` | `'./src/routeTree.gen.ts'` | 生成文件路径 |
| `autoCodeSplitting` | `true` | 自动 code-splitting |
| `quoteStyle` | `'single'` | 生成代码引号风格 |
| `semicolons` | `false` | 生成代码是否带分号 |

> **顺序很重要**：`tanstackRouter()` 必须放在 `react()` 之前，因为它会在文件级别注入 import 与转换 routes 目录的导出。

### 加入 `.gitignore`（推荐）

```gitignore
# .gitignore
src/routeTree.gen.ts
```

> `routeTree.gen.ts` 是 dev / build 时由插件自动生成的——多数团队选择 gitignore，每次启动 dev server 时重新生成。也可以选择提交（方便代码审查时看路由变化），但要确保 CI 在 build 前先跑 `pnpm dev` 或 `tsr generate` 把它生成出来。

## TypeScript 配置

`tsconfig.json` 推荐 `moduleResolution: 'Bundler'` 或 `'Node16'`，并把 `strict: true` 打开——TSR 的类型推导依赖严格模式：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

> **`strict: true` 是必需的**——TSR 的 `Register` 接口 + `createFileRoute` 模板字符串推导只在严格模式下生效。

## 第一个 File-based 路由

File-based routing 是 TanStack Router 的**默认推荐方式**——文件即路由，由 Vite 插件扫描 `src/routes/` 目录生成路由树。

### 1. 创建路由目录结构

```
src/
├── main.tsx               # 应用入口
├── router.tsx             # 构造 Router 实例（可选拆分）
├── routeTree.gen.ts       # ⚙️ 自动生成，勿手动编辑
└── routes/
    ├── __root.tsx         # 根路由（HTML 壳 + 全局布局）
    ├── index.tsx          # / 路由
    ├── about.tsx          # /about 路由
    └── posts/
        ├── index.tsx      # /posts 路由
        └── $postId.tsx    # /posts/:postId 路由（动态参数）
```

### 2. 编写根路由（`__root.tsx`）

根路由必须存在，提供全局布局 + Outlet 占位 + Devtools：

```tsx
// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav className="p-2 flex gap-2 border-b">
        <Link to="/" className="[&.active]:font-bold">
          首页
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          关于
        </Link>
        <Link to="/posts" className="[&.active]:font-bold">
          文章
        </Link>
      </nav>
      <main className="p-4">
        {/* 子路由渲染位置 */}
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  )
}
```

**要点**：

- 用 `createRootRoute` 而非 `createFileRoute`——根路由没有 path
- 必须导出为 `Route`（Vite 插件按这个名字扫描）
- `<Outlet />` 是子路由渲染位置（类似 Vue Router 的 `<RouterView />`）
- `[&.active]:font-bold` 是 Tailwind CSS 选择器——`<Link>` 激活时会自动加 `.active` 类

### 3. 编写首页（`index.tsx`）

```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">欢迎来到首页</h1>
      <p>这是 TanStack Router 的第一个 Demo。</p>
    </div>
  )
}
```

**要点**：

- `createFileRoute('/')` 的字符串路径**由插件自动维护**——你可以直接写，插件会校验是否与文件位置匹配；也可以让插件填（写 `createFileRoute('')`，dev 启动时插件补全）
- 必须导出为 `Route`

### 4. 编写关于页（`about.tsx`）

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">关于</h1>
      <p>TanStack Router 是 100% 类型安全的路由库。</p>
    </div>
  )
}
```

### 5. 编写动态路由（`posts/$postId.tsx`）

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  // 自动推导：postId 类型为 string
  const { postId } = Route.useParams()

  return (
    <div>
      <h1 className="text-2xl font-bold">文章详情</h1>
      <p>当前文章 ID：{postId}</p>
    </div>
  )
}
```

**要点**：

- `$postId` 是动态段（类似 Vue Router 的 `:id`、Next.js 的 `[postId]`）
- `Route.useParams()` 自动推导出 `{ postId: string }` 类型——拼错名字直接编译报错
- 也可以用全局 hook `useParams({ from: '/posts/$postId' })`

### 6. 编写文章列表（`posts/index.tsx`）

```tsx
// src/routes/posts/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  component: PostsListPage,
})

function PostsListPage() {
  const posts = [
    { id: '1', title: 'TanStack Router 介绍' },
    { id: '2', title: '类型安全的路由' },
    { id: '3', title: 'Search Params 状态管理' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold">文章列表</h1>
      <ul className="mt-2 space-y-1">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              to="/posts/$postId"
              params={{ postId: post.id }}
              className="text-blue-600 hover:underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**要点**：

- <span v-pre>`<Link to="/posts/$postId" params={{ postId: post.id }}>`</span> —— `to` 是字符串模板，`params` 必填 `{ postId }`，少写漏写直接编译报错
- `to` 不传或拼错（如 `to="/post/$id"`）TypeScript 会报错——这是 TSR 类型安全的核心体现

### 7. 创建 Router 实例（`main.tsx`）

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// 创建 router 实例
const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // 推荐：hover / touchstart 时预加载
  scrollRestoration: true,
})

// 类型注册——让 <Link>、useNavigate 等自动推导路由树类型
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')!
ReactDOM.createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**关键点**：

- `routeTree` 从 `./routeTree.gen` 导入（Vite 插件自动生成）
- `defaultPreload: 'intent'` —— hover 或 touchstart 时预加载，几乎零延迟切换
- **类型注册必不可少**——`declare module '@tanstack/react-router' { interface Register { router: typeof router } }` 让所有 `<Link>` / `useNavigate` / `useParams` 等都拿到当前应用的路由树类型
- 推荐放在 `main.tsx` 或单独的 `src/router.tsx` 文件中

### 8. 启动 dev server

```bash
pnpm dev
```

第一次启动时 Vite 插件会自动生成 `src/routeTree.gen.ts`——访问 `http://localhost:5173` 看到首页，点 "文章" 看到列表，点列表项进入详情页。

## 第一个 Code-based 路由

如果你不想用文件路由（不喜欢 Vite 插件 / 偏好显式控制），也可以**代码定义路由树**。Code-based 不依赖 Vite 插件、不需要 `routeTree.gen.ts`，所有路由用 `createRoute` 手动拼装。

### 完整示例

```tsx
// src/router.tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// 1. 根路由
const rootRoute = createRootRoute({
  component: () => (
    <>
      <nav className="p-2 flex gap-2 border-b">
        <Link to="/" className="[&.active]:font-bold">首页</Link>
        <Link to="/about" className="[&.active]:font-bold">关于</Link>
        <Link to="/posts" className="[&.active]:font-bold">文章</Link>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
})

// 2. 子路由（每个都需要 getParentRoute）
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <h1>首页</h1>,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => <h1>关于</h1>,
})

const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts',
  component: () => (
    <div>
      <h1>文章</h1>
      <Outlet />
    </div>
  ),
})

const postsIndexRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '/',
  component: () => <p>请从列表选择一篇文章。</p>,
})

const postRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '$postId',
  component: function PostDetail() {
    const { postId } = postRoute.useParams()
    return <p>文章 ID：{postId}</p>
  },
})

// 3. 拼装路由树
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  postsRoute.addChildren([postsIndexRoute, postRoute]),
])

// 4. 创建 router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

const root = document.getElementById('root')!
ReactDOM.createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**File-based vs Code-based 对比**：

| 维度 | File-based | Code-based |
|---|---|---|
| Vite 插件 | **必需** | 不需要 |
| 路由发现 | 自动扫描 `src/routes/` | 手动 `addChildren` 拼装 |
| 类型推导 | 自动生成 `routeTree.gen.ts` | 直接从 `createRoute` 推导 |
| 代码量 | 少（约定胜于配置） | 多（显式拼装） |
| 灵活性 | 中（受文件名约定限制） | **高**（完全控制路由树） |
| 适合 | 大多数应用 | 不想用 Vite 插件 / 极端定制 |

> **官方推荐 File-based**——除非你有特殊原因（不想用 Vite 插件、需要运行时动态路由树），否则首选文件路由。

## 类型推导核心

TanStack Router 的**全局类型推导**通过 `Register` 接口实现——只需声明一次，所有 hook / `<Link>` / `useNavigate` 都能自动推导：

```ts
// 在 main.tsx 或 router.tsx 任意位置
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

注册之后：

- <span v-pre>`<Link to="/posts/$postId" params={{ postId: '1' }}>`</span> —— `to` 可补全所有可能的路径，`params` 自动推导出 `{ postId: string }`
- `useParams({ from: '/posts/$postId' })` —— 返回值类型 `{ postId: string }`
- `useSearch({ from: '/shop/products' })` —— 返回值类型从 `validateSearch` 自动推导
- `navigate({ to: '/posts/$postId', params: { postId: '1' } })` —— 同样的类型保护

**没注册的话**会怎样？所有路径变成 `string`、所有参数失去类型——基本等于裸 React Router——TSR 的卖点丢一半。

## 编程式导航

除了 `<Link>` 组件，还可以用 `useNavigate` hook 编程式导航：

```tsx
import { useNavigate } from '@tanstack/react-router'

function LoginButton() {
  const navigate = useNavigate()

  const handleLogin = async () => {
    await login()
    // 类型安全：to / params / search 全部按当前路由树推导
    navigate({
      to: '/dashboard',
      search: { tab: 'overview' },
    })
  }

  return <button onClick={handleLogin}>登录</button>
}
```

**`navigate` 选项**：

| 选项 | 类型 | 说明 |
|---|---|---|
| `to` | 路由 path | 目标路径（自动推导） |
| `params` | object | 路径参数（必填字段类型推导） |
| `search` | object 或 `(prev) => object` | search params（函数式可基于上一次） |
| `hash` | string | URL hash 片段（不含 `#`） |
| `state` | object | History state（不出现在 URL） |
| `replace` | boolean | 替换历史栈而非 push |
| `from` | string | 相对导航的起点 |

## Devtools

`@tanstack/react-router-devtools` 是路由开发的核心调试工具——显示路由匹配树、loader 状态、search params 解析、context 链：

```tsx
// 推荐：渲染在 __root.tsx 中（自动连接到 RouterProvider 内的 router）
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

**Devtools 功能**：

- **Routes 树**：当前激活的路由匹配链、每个路由的 `params` / `search` / `context` / `loaderData`
- **Active matches**：当前匹配的所有路由 match 对象
- **Pending matches**：加载中的路由（loader 还没 resolve）
- **Search params**：当前 URL 的 search 解析后的对象
- **History**：路由跳转历史回放

**生产环境**：默认 Devtools 不会出现在 prod build；如想完全排除，用条件渲染：

```tsx
{import.meta.env.DEV && <TanStackRouterDevtools />}
```

## 第一个完整 Demo

把前面所有内容串起来——一个带导航、动态路由、文章列表的最小 SPA。

### 项目结构

```
my-tsr-app/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── styles.css
    ├── routeTree.gen.ts   (插件自动生成)
    └── routes/
        ├── __root.tsx
        ├── index.tsx
        ├── about.tsx
        └── posts/
            ├── index.tsx
            └── $postId.tsx
```

### `package.json`

```json
{
  "name": "my-tsr-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.95.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tanstack/react-router-devtools": "^1.95.0",
    "@tanstack/router-plugin": "^1.95.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0"
  }
}
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
})
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "resolveJsonModule": true
  },
  "include": ["src", "vite.config.ts"]
}
```

### `index.html`

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My TSR App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles.css'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

### `src/routes/__root.tsx`

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
        <Link to="/" activeProps={{ style: { fontWeight: 'bold' } }}>
          首页
        </Link>
        {' | '}
        <Link to="/about" activeProps={{ style: { fontWeight: 'bold' } }}>
          关于
        </Link>
        {' | '}
        <Link to="/posts" activeProps={{ style: { fontWeight: 'bold' } }}>
          文章
        </Link>
      </nav>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  )
}
```

### `src/routes/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1>欢迎来到 TanStack Router Demo</h1>
      <p>这是一个完整的 SPA 示例。</p>
    </div>
  )
}
```

### `src/routes/about.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div>
      <h1>关于本站</h1>
      <p>TanStack Router 是 100% 类型安全的路由库。</p>
    </div>
  )
}
```

### `src/routes/posts/index.tsx`

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  component: PostsListPage,
})

const POSTS = [
  { id: '1', title: 'TanStack Router 介绍' },
  { id: '2', title: '100% 类型安全的路由设计' },
  { id: '3', title: 'Search Params 状态管理' },
]

function PostsListPage() {
  return (
    <div>
      <h1>文章列表</h1>
      <ul>
        {POSTS.map((post) => (
          <li key={post.id}>
            <Link to="/posts/$postId" params={{ postId: post.id }}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### `src/routes/posts/$postId.tsx`

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  // 类型推导：postId 是 string
  const { postId } = Route.useParams()

  return (
    <div>
      <Link to="/posts">← 返回列表</Link>
      <h1>文章 #{postId}</h1>
      <p>这里是文章 {postId} 的详细内容。</p>
    </div>
  )
}
```

### 启动 + 测试

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:5173`：

- 首页 `/` 显示欢迎语
- 点 "文章" 进入 `/posts` 显示列表
- 点列表项进入 `/posts/1`、`/posts/2`、`/posts/3`
- 点 "← 返回列表" 回到 `/posts`
- 浏览器右下角的 Devtools 图标点开看路由树

**验证类型安全**：试着在 `posts/index.tsx` 把 `to="/posts/$postId"` 改成 `to="/posts/$postID"`（大小写错），TypeScript 立即报错——这就是 TSR 卖点的体现。

## 常见踩坑

### 1. 忘记 `declare module` 类型注册

**错误**：

```ts
// ❌ 没有 declare module
const router = createRouter({ routeTree })

// <Link to="/posts/$postId">  类型不全，to 变成 string，params 不强制
```

**正确**：

```ts
// ✅ 必须 declare module
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### 2. Vite 插件放错位置

**错误**：

```ts
// ❌ tanstackRouter 放在 react() 之后
plugins: [react(), tanstackRouter({ target: 'react' })]
```

**正确**：

```ts
// ✅ 必须在 react() 之前
plugins: [tanstackRouter({ target: 'react' }), react()]
```

### 3. `routeTree.gen.ts` 文件不存在

**现象**：dev server 启动报错 `Cannot find module './routeTree.gen'`。

**原因**：

- Vite 插件没启动（插件位置错 / 没安装）
- `src/routes/__root.tsx` 不存在（插件需要 `__root` 作为根才生成）
- TS 编译比 Vite 还早跑（直接 `tsc` 时插件没运行）

**修复**：

- 确认插件已安装：`pnpm add -D @tanstack/router-plugin`
- 确认根路由：`src/routes/__root.tsx` 存在并 `export const Route = createRootRoute(...)`
- 先跑一次 `pnpm dev`（让插件生成文件）再 `tsc`

### 4. `tsconfig` 没开 strict

**现象**：所有 `useParams()` / `useSearch()` 返回 `unknown` / `any`。

**原因**：`tsconfig.json` 没开 `strict: true`——TSR 的高级类型推导依赖严格模式。

**修复**：

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

### 5. 文件名与 createFileRoute 路径不一致

**错误**：文件叫 `src/routes/posts/$postId.tsx`，但里面写 `createFileRoute('/posts/$post_id')`。

**现象**：dev server 启动时插件报警告或重写文件——TSR 插件会按**文件路径**自动校正字符串。

**最佳实践**：

- 让插件自动管理——你写 `createFileRoute('')`，插件会填路径
- 或保持文件名与 `createFileRoute` 路径一致

### 6. `__root.tsx` 用 `createFileRoute` 而非 `createRootRoute`

**错误**：

```tsx
// ❌ 根路由不能用 createFileRoute
export const Route = createFileRoute('/__root')({ component: ... })
```

**正确**：

```tsx
// ✅ 必须用 createRootRoute
export const Route = createRootRoute({ component: ... })
```

### 7. `<Link>` 缺 `params`

**错误**：

```tsx
// ❌ TypeScript 报错：params 必填
<Link to="/posts/$postId">文章</Link>
```

**正确**：

```tsx
// ✅
<Link to="/posts/$postId" params={{ postId: '1' }}>文章</Link>
```

### 8. CommonJS 项目

TanStack Router v1 是 **ESM-only**——如果 `package.json` 没写 `"type": "module"`，可能出现 require 报错。

**修复**：

```json
{
  "type": "module"
}
```

## 与 TanStack Start 的关系

TanStack Router 是**路由库**，TanStack Start 是**全栈元框架**——后者基于前者：

| 角色 | 包 | 提供 |
|---|---|---|
| 路由层 | `@tanstack/react-router` | createRouter / Route / Link / hooks |
| Vite 插件 | `@tanstack/router-plugin` | File-based routing 扫描 + 生成 |
| 全栈框架 | `@tanstack/react-start` | SSR + createServerFn + Middleware + 部署 |
| Start 的 Vite 插件 | `@tanstack/react-start/plugin/vite` | 整合 router-plugin + SSR 入口 |

**选择策略**：

- 纯客户端 SPA + Vite → 用 **TanStack Router**（本笔记主讲）
- 需要 SSR / SSG / Server Functions / Middleware → 用 **TanStack Start**（见 [TanStack Start 笔记](../../meta/tanstack-start/)）

下一步推荐学习：

- [指南](./guide-line.md)：完整 File-based 文件命名约定 / Search Params + Zod / Loader + beforeLoad / Pending UI / 错误边界 / Code Splitting / 与 TanStack Query 协作
- [参考](./reference.md)：API 速查 / 全部 hooks / RouteOptions / RouterOptions 完整字段
