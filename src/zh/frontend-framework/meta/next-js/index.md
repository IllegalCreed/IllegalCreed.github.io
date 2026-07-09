---
layout: doc
---

# Next.js

Vercel 维护的 React 全栈元框架。建在 React 之上，把"渲染库 React"升级成「文件路由 + RSC（React Server Components）+ Server Actions + SSR / SSG / ISR / Streaming + 服务端 API + 自动优化（图片 / 字体 / 字体子集）+ Turbopack 打包」一整套。Next.js 15（2024.10）是 App Router 走向成熟的版本：稳定 Turbopack dev、把 Request-time API（`cookies` / `headers` / `params` / `searchParams`）改成异步、`fetch` 与 GET Route Handler 默认不再缓存，与 React 19 RC 全面集成。

## 评价

**优点**

- **React 圈事实标准**：要做 SSR / SSG / 服务端逻辑的 React 项目几乎默认选 Next.js；招聘、文档、教程、第三方集成最丰富
- **App Router 模型先进**：基于 RSC（React Server Components）+ Server Actions，把"组件 = 数据 + UI"的边界压到极致；服务端逻辑写在组件里就行，不用再分 `getServerSideProps` / API Route
- **渲染模式齐**：静态、动态、流式 SSR、ISR 增量再生，可以按路由甚至按组件分别选；从 Next.js 16 开始 Cache Components（PPR）让一个页面里"静态壳 + 动态内容"自然共存
- **零配置优化**：`next/image` 自动转 WebP/AVIF + 响应式 + 懒加载；`next/font` 构建时下载并自托管 Google Fonts，无运行时；`next/link` 自动预取
- **Turbopack（Rust 写）**：从 Next.js 16 开始 dev/build 默认 Turbopack，大项目 HMR 与首次启动比 Webpack 快好几倍
- **部署灵活**：Vercel 一行 git push 上线；也支持 Node.js server / Docker / 静态导出 / Cloudflare / Netlify / Bun / Deno 各平台

**缺点**

- **抽象层重 + 升级激进**：13 → 14 → 15 → 16 每次大版本都有破坏性变更（Pages Router → App Router、`params` 异步化、`fetch` 默认不缓存、`middleware` → `proxy`、Cache Components）。生产项目需要持续维护精力
- **RSC 心智门槛高**：Server / Client Components 边界、`'use client'` 传染性、Context 不能跨边界、序列化限制、`async/await` 在组件里的语义 —— 都需要重学一遍 React
- **Vercel 强绑定**：很多新特性（PPR、`fluid` compute、`@vercel/otel`）首发只在 Vercel 跑得最顺；自托管要补 cache handler、CDN、`output: 'standalone'` 镜像等手工活
- **缓存语义复杂**：四层缓存（Request Memoization / Data Cache / Full Route Cache / Router Cache）+ `fetch` 选项 + segment config + `revalidateTag`/`revalidatePath`/`updateTag`/`refresh`，新人很难一次理清
- **Pages Router 长尾**：老项目大量在 Pages Router 上，迁到 App Router 等于重写；两者长期共存让文档与生态分叉

## Next.js 15 关键变化（vs 14）

- **`fetch` 默认不再缓存**：14 时代 `fetch` 默认 `force-cache`，15 改成 `auto no cache`（每次请求都跑），要缓存必须显式写 `cache: 'force-cache'` 或 `next: { revalidate }`
- **GET Route Handler 默认不再缓存**：要静态化必须显式 `export const dynamic = 'force-static'`
- **Request-time API 异步化**：`cookies()` / `headers()` / `draftMode()` / `params` / `searchParams` 都变成 Promise，必须 `await` 或 `use()`
- **React 19 RC**：App Router 默认带 React Canary（包含全部稳定的 React 19 特性），最低 React 19
- **Turbopack `dev` 稳定**：`next dev --turbopack` 不再标 experimental（默认仍 Webpack）
- **next/font 内建**：`@next/font` 废弃，import 改用 `next/font`

## Next.js 16 关键变化（vs 15）

- **同步访问 Request-time API 全面移除**：15 还允许同步读 `cookies()` 等并打警告，16 直接报错
- **`middleware` → `proxy`**：`middleware.ts` 重命名为 `proxy.ts`，函数名改 `proxy`，runtime 固定 Node.js（不再支持 Edge）。原 `middleware` 文件名仍 deprecated 可用
- **Turbopack 默认**：`next dev` / `next build` 默认用 Turbopack，要回退 Webpack 显式 `--webpack`
- **Cache Components（PPR 升级版）**：通过 `cacheComponents: true` 启用；`'use cache'` 指令缓存函数/组件返回值，`cacheLife()` / `cacheTag()` / `updateTag()` 一套新 API
- **`revalidateTag` 改签名**：需要传第二参数 `cacheLife` profile
- **React 19.2**：内建 View Transitions / `useEffectEvent` / `Activity` 等
- **React Compiler 稳定**：`reactCompiler: true` 开启
- **AMP / `next lint` / `serverRuntimeConfig` / `publicRuntimeConfig` 移除**
- **Node 最低 20.9**（之前 18.18）

兼容性：用 `npx @next/codemod@canary upgrade latest` 一行升级；多数破坏性变更都有 codemod 自动迁移。

## 文档地址

[Next.js Documentation](https://nextjs.org/docs)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=next-js" target="_blank" rel="noopener noreferrer">Next.js 测试题</a>


## GitHub 地址

[vercel/next.js](https://github.com/vercel/next.js)
