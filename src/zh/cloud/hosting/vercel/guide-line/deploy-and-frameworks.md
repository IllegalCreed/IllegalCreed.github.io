---
layout: doc
outline: [2, 3]
---

# 部署与框架集成

> 基于 Vercel · 核于 2026-08

## 速查

- **Next.js 原生**：Vercel 是 Next.js 母公司，App Router / Pages Router / ISR / RSC / Route Handlers 全部首发最优支持，是 Next.js 的"一等公民"部署目标。
- **框架适配**：Nuxt 3、Astro、SvelteKit、Remix、Vite、Vue/CRA（纯前端）都有零配置适配，Vercel 读 `package.json` 的 `build` 脚本自动识别。
- **三类部署**：Production（`main` 分支）、Preview（任意分支/PR，独立 URL）、Development（`vercel dev` 本地模拟）。
- **预览部署价值**：每个 PR 一个线上 URL，设计/产品/QA 在合并前验收，杜绝"合并后才发现样式崩了"。
- **自定义域名**：绑定后自动签 HTTPS 证书；可配多个域名、泛域名、重定向规则。
- **环境变量**：按 Development / Preview / Production 三个环境分别配置，构建时注入；敏感信息只放 Production。
- **`vercel.json`**：仅在需要重写路由、改运行时、配 Header、自定义构建时才写；标准项目零配置。
- **构建提速**：Vercel 自动缓存 `node_modules` 和构建中间产物，二次构建跳过未变更步骤。
- **进阶**：[Serverless 与 Edge Functions](./serverless-and-edge) 讲运行时细节。

## 一、Next.js：原生一等公民

Vercel 对 Next.js 的支持是"**同源**"的——框架和平台同一家公司，Next.js 的每个特性都针对 Vercel 做了优化：

| Next.js 特性 | Vercel 上的表现 |
| --- | --- |
| **App Router**（`app/` 目录） | 原生支持，Server Components 在 Edge/Node 运行时按需分发 |
| **Pages Router**（`pages/` 目录） | 原生支持，`getStaticProps`/`getServerSideProps` 自动映射 SSG/SSR |
| **SSG**（`getStaticProps`/`generateStaticParams`） | 构建时静态化，进 CDN，零成本高并发 |
| **SSR**（`getServerSideProps`/动态路由） | 每次请求服务端渲染，跑在 Serverless/Edge Function |
| **ISR**（`revalidate`/`generateStaticParams`） | 静态页 + 定时/按需重生成，结合 CDN 缓存与后台再生 |
| **Route Handlers**（`app/api/route.ts`） | 自动部署为 Serverless/Edge Function |
| **Middleware** | 部署为 Edge Middleware，每个请求在边缘先跑 |
| **Image Optimization** | Vercel 提供托管图片优化（按用量计费） |

- **ISR 是 Vercel 的招牌**：静态站点的性能 + 动态数据的时效性。例如博客用 `revalidate: 60`，页面构建后静态化进 CDN，用户访问拿静态（快）；每 60 秒后台触发一次重生成，下次访问看到新内容。也可用 `revalidateTag`/`revalidatePath` 做**按需重验证**（CMS 发布后立即更新）。
- **RSC（React Server Components）**：服务端渲染 + 零客户端 JS 体积，Vercel 自动按渲染边界拆分服务端/客户端代码。

## 二、其他框架：零配置适配

Vercel 不只支持 Next.js，对主流前端框架都有**零配置适配**（通过读 `package.json` 的 `build` 脚本识别）：

| 框架 | 适配方式 | 输出 |
| --- | --- | --- |
| **Nuxt 3** | Nitro 自动检测，SSR/SSG/Edge 都支持 | 服务端渲染 + 静态资源 |
| **Astro** | 自动识别，默认 SSG 进 CDN | 静态站点，可选 SSR |
| **SvelteKit** | 自动适配，SSR 部署为 Serverless | 服务端渲染 |
| **Remix** | 自动适配，SSR 部署为 Serverless | 服务端渲染 |
| **Vite / Vue / CRA** | 识别 `vite build`/`npm run build` | 纯静态 SPA（进 CDN） |

- **适配原理**：Vercel 维护一个框架预设表（`@vercel/static-build`、`@vercel/next`、`@vercel/nuxt` 等），根据依赖自动套用对应预设。少数情况（自定义输出目录、特殊运行时）需要写 `vercel.json` 微调。
- **纯静态 SPA**：Vue/CRA 这类无 SSR 的，Vercel 当静态站托管，所有路由 fallback 到 `index.html`（需配 `rewrites`）。

## 三、预览部署：合并前验收

预览部署（Preview Deployment）是 Vercel 区别于传统部署的杀手特性：

- **触发**：push 到任意非 main 分支，或开 PR，自动触发一次完整构建 + 部署。
- **独立 URL**：每个预览部署有独立 URL（`<git-commit>.<project>.vercel.app`），长期保留（按计划有保留期，Pro 默认 90 天）。可以回到任意历史提交的线上版本。
- **评论协作**：在预览 URL 上可直接评论（类似 Google Docs），标记页面某处的问题，团队看到后修。这让"设计走查"和"代码评审"合二为一。
- **生产等价**：预览部署的运行环境与生产完全一致（同样的 Edge 网络、同样的函数运行时），所以"预览能跑，生产基本能跑"——极大降低上线风险。

## 四、自定义域名与环境变量

- **自定义域名**：在项目设置里添加域名，Vercel 自动签发 HTTPS 证书（Let's Encrypt）并配置 DNS（或给 CNAME 记录让你自配）。支持多域名、`www` 与裸域名重定向、泛域名（需 Pro）。
- **环境变量**：分三个环境配置——Development（`vercel dev` 用）、Preview（预览部署用）、Production（生产用）。**敏感信息只勾 Production**，避免泄漏到公开的预览 URL。环境变量在构建时注入（`process.env.X`），也可标记为运行时注入。

## 下一步

部署与框架讲完，下一步进入运行时细节——[Serverless 与 Edge Functions](./serverless-and-edge)：两类函数的差异、数据层（KV/Postgres/Blob）、Fluid Compute 与按座定价的陷阱。
