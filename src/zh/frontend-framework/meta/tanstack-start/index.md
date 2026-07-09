---
layout: doc
---

# TanStack Start

[TanStack](https://tanstack.com) 团队（Tanner Linsley，TanStack Query / Table / Router / Form 等 headless 库作者）打造的「**TanStack Router 全栈元框架**」，基于 [TanStack Router](https://tanstack.com/router/) 与 Vite，定位是「**类型安全到极致的 Next.js / Remix 替代品**」。TanStack Start = TanStack Router（路由层）+ Vite（构建层）+ Server Functions（RPC 层）+ Server Routes（API 层）+ Middleware（请求层）的统一发行版，核心卖点是「**end-to-end type safety**」——路径参数、search params、loader 返回值、`createServerFn` 输入输出、`createMiddleware` 上下文链全部由 TypeScript 编译期推导，且通过 `routeTree.gen.ts`（Vite 插件运行时自动生成）把整棵路由树的类型注册到全局，让 <span v-pre>`<Link to="/posts/$postId" params={{ postId: "1" }}>`</span> 这样的导航在拼错路径或漏参数时直接编译报错。截至 2026 年 5 月，TanStack Start 处于 **Release Candidate (RC)** 阶段——API 已稳定、可生产，但仍建议锁版本依赖；从 v1.0 发布只剩一段路。底层从前期 Nitro / Vinxi 迁移到了直接基于 Vite + 各平台官方 Vite 插件（Cloudflare / Netlify 等），代码包名是 `@tanstack/react-start`（React 版）与 `@tanstack/solid-start`（Solid 版），本笔记主讲 React 版。

## 评价

**优点**

- **路由类型安全冠绝群雄**：`createFileRoute('/posts/$postId')` 中的路径字符串由 Vite 插件运行时自动生成（你不用手写），并把 `params.postId` 类型推导到组件 / loader / `<Link>` 全链路；search params 通过 `validateSearch: zodValidator(schema)` 编译期 + 运行期双校验
- **Server Functions 一等公民**：`createServerFn({ method: 'POST' }).inputValidator(zSchema).handler(fn)` 即定义 RPC 端点——客户端调用时是 `fetch` 但 TS 看到的是「带类型的函数」；自动生成端点 ID、自动 CSRF、自动序列化
- **Middleware 链式组合**：`createMiddleware().middleware([authMw]).server(async ({ next, context }) => ...)` 支持 server / client / function 三种类型，可链式 + 上下文穿透 + tree-shake（`.server()` 内代码绝不出现在客户端 bundle）
- **同构 by default**：所有代码默认同时在 server / client 跑——loader 首次 SSR 在 server，导航时在 client；用 `createServerFn` / `createIsomorphicFn` / `.server.ts` / `.client.ts` 显式拆分
- **Selective SSR**：每个路由可独立 `ssr: true / false / 'data-only'`，且支持 `ssr: ({ params, search }) => ...` 函数式动态决策；首屏 HTML 还是壳但客户端继续 SPA 导航
- **Vite 加成**：开发期 HMR 极快、生态插件随便用（Tailwind / UnoCSS / Sentry / Bun / Cloudflare 都是 Vite 插件）；与 Next.js 的 Turbopack 相比，Vite 插件生态更成熟
- **完整 SSR / SSG / SPA 三模式**：`vite.config.ts` 一次配置 `prerender: { enabled: true }` 即 SSG；`spa: { enabled: true }` 即纯 SPA + `_shell.html`；默认就是 SSR + Streaming
- **平台中立**：官方支持 Cloudflare Workers / Netlify / Railway 三 Official Partners，Nitro 适配 Vercel / AWS / Bun / Node Docker 等几乎所有平台；不像 Next.js 那样深度绑 Vercel
- **与 TanStack Query 天然配合**：`loader: () => queryClient.ensureQueryData(opts)` 模式实现 SSR + 客户端 Query 缓存复用，享受 Query 的 mutation / 乐观更新 / persist 整套生态
- **devtools 完善**：TanStack Router Devtools 直接显示路由匹配 / loader 状态 / search params 解析，调试体验远超 Next.js 调试 RSC

**缺点**

- **仍在 RC 阶段**：截至 2026.05 还没到 v1.0，部分细节 API（如 RSC 集成、`createServerFileRoute` 替换为 `server: { handlers }`）可能小幅调整；生产用建议锁定具体版本号
- **路由约定密集**：`__root.tsx` / `_layout` / `$param` / `_` 后缀（非嵌套）/ `-` 前缀（排除）/ `(group)` / `.route.tsx` 七种文件名规则一起出现时，新手容易迷失
- **`routeTree.gen.ts` 自动生成的「魔法」**：Vite 插件在开发期自动写入 `src/routeTree.gen.ts`，路径字符串也是自动管理——开发者不需要碰但调试时要意识到这是生成产物（提交到 git 还是 gitignore 看团队偏好，多数项目选 gitignore + dev 启动时再生成）
- **`createServerFn` 序列化限制**：输入输出必须可序列化（JSON + Date + Map + Set + FormData），类实例 / 函数 / Symbol 不行——与 React Router v7 / SolidStart 同坑
- **CSRF 默认行为依赖 `src/start.ts`**：如果你定义了 `src/start.ts` 但忘了加 `createCsrfMiddleware`，自动 CSRF 保护会消失——这是个隐式行为坑
- **RSC 体验仍 experimental**：与 Next.js 押注 RSC 的策略不同，TanStack Start 把 RSC 当「数据」而非范式，目前 RSC 集成被标为 experimental
- **import protection 在 dev / prod 行为不同**：dev 只 warn，prod 才 fail build——开发期看似没问题的 client 导入 `*.server.ts` 可能上线才炸
- **客户端 context 默认不传到服务端**：`createMiddleware().client(...)` 里的 context 不会自动 `sendContext`，需显式 `next({ sendContext: { ... } })`——安全但易踩
- **生态规模小于 Next.js / React Router**：模板 / 教程 / Stack Overflow 答案数量级差距明显；招聘市场基本没有「TanStack Start 工程师」职位
- **vs SolidStart / Nuxt / SvelteKit**：TanStack Start 是 React 阵营（也有 Solid 版），但路由类型化是它独有的卖点——其它框架的 search params / loader 类型推导都没这么深入

## 文档地址

[TanStack Start 官网](https://tanstack.com/start) | [TanStack Start React 文档](https://tanstack.com/start/latest/docs/framework/react/overview) | [TanStack Router 文档](https://tanstack.com/router/latest) | [示例集合](https://tanstack.com/start/latest/docs/framework/react/examples)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tanstack-start" target="_blank" rel="noopener noreferrer">TanStack Start 测试题</a>


## GitHub 地址

[TanStack/router](https://github.com/TanStack/router)（TanStack Router 与 TanStack Start 共仓库，Start 位于 `packages/start-*`）

## 学习路径

- [入门](./getting-started.md)：创建项目（CLI / 手搭）/ 项目结构 / `__root.tsx` / 第一个文件路由 / `routeTree.gen.ts` 自动生成 / 第一个 `loader` / 第一个 `createServerFn` / 与 TanStack Query 配合 / 三模式（SSR / SSG / SPA）辨析
- [指南](./guide-line.md)：file-based routing 全规则 / 动态参数 / pathless layout / splat / group / 非嵌套 / 类型安全导航（`<Link>` + `useNavigate`）/ Type-safe search params with Zod / Loaders + beforeLoad + Context / Server Functions 全集（输入校验 / FormData / 错误 / redirect / streaming）/ Middleware（server / client / function 三类）/ Server Routes（API 端点）/ Selective SSR + SPA Mode + Static Prerender / 部署 adapter / 与 TanStack Query 协作 / 与 Next.js / React Router 对比 / 常见踩坑
- [参考](./reference.md)：API 速查（Hooks / Components / Route 选项 / `createServerFn` / `createMiddleware` / `createStart` / Vite 插件配置 / 文件命名约定 / CLI）
