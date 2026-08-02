---
layout: doc
outline: [2, 3]
---

# 入门：Vercel 定位与零配置部署

> 基于 Vercel · 核于 2026-08

## 速查

- **Vercel 定位**：Next.js 母公司打造的**前端优先云平台**，理念是"零配置 + 开发者体验"——`git push` 即部署。
- **git-push 部署**：连接 GitHub/GitLab/Bitbucket，每次 push 自动触发构建与部署，无需写 CI/CD。
- **零配置**：自动识别 Next.js/Nuxt/Astro/SvelteKit/Remix 等框架，无需写 `vercel.json` 即可跑起来（需要微调时才写）。
- **Edge 网络**：构建产物分发到全球边缘节点，静态资源就近返回，动态请求路由到最近的函数实例。
- **三类部署**：①**生产部署**（Production，`main` 分支）；②**预览部署**（Preview，任意分支/PR，独立 URL）；③**开发部署**（Development，`vercel dev` 本地）。
- **渲染策略三件套**：SSR（动态服务端渲染）、SSG（构建时静态化）、ISR（增量静态再生，定时/按需重生成）。
- **两类函数**：①**Serverless Functions**（`/api/*`，Node 运行时，按请求冷启动）；②**Edge Functions**（跑在 Cloudflare Workers 之上，冷启动近乎零）。
- **数据层**：Vercel KV（Redis）、Postgres（Serverless PG）、Blob（对象存储），全部托管。
- **Fluid Compute**：2025 年推出的并发执行模型，一个函数实例可并发处理多请求，缓解冷启动。
- **定价模型**：**按座（$20/seat·Pro）+ 用量**（带宽/函数调用/Edge 请求），座席费是团队协作的隐性大头。
- **v0 边界**：v0/bolt.new 等 AI 应用生成器归 AI 章，本叶只讲部署平台 Vercel 本身。
- **进阶顺序**：[部署与框架集成](./guide-line/deploy-and-frameworks) → [Serverless 与 Edge Functions](./guide-line/serverless-and-edge) → [参考](./reference)。

## 一、Vercel 是什么：Next.js 的原生部署平台

Vercel 由 **Guillermo Rauch** 创立，他同时也是 Next.js 框架的核心维护者。这种"**框架 + 平台同一家公司**"的关系，决定了 Vercel 的定位：**Next.js 的原生部署平台**。Next.js 的新特性（App Router、RSC、ISR on-demand 重验证、Route Handlers）总是先在 Vercel 上跑通、得到最优支持，再回流到开源框架。

- **前端优先**：Vercel 不是通用云（不是 AWS/GCP），它专注**前端应用 + BFF（Backend for Frontend）**这一层——你的 Next.js/Nuxt/Astro/Vite 应用，加少量 `/api` 函数，再加 KV/Postgres/Blob 数据层，就是一个完整的全栈前端。
- **DX 优先**：传统部署要配服务器、配 Nginx、配 CDN、配 CI/CD、配 HTTPS 证书；Vercel 把这些全部收编进一个 git push。对一个标准 Next.js 项目，从代码合并到 `main` 到线上生效，最快 30 秒。
- **谁该用**：①个人开发者/小团队做 Next.js 项目（Hobby 免费够用）；②中小公司前端团队想要"部署即上线"的体验而不养 DevOps；③重度用 Next.js ISR/Edge 的项目。不适合：长任务/重计算/深度依赖 AWS 私有服务的项目。

## 二、git-push 部署：零配置的工作流

Vercel 的核心工作流极简：

```
开发者 git push 到 main
  → Vercel 检测到 webhook
  → 自动识别框架（读 package.json/build 命令）
  → 拉依赖、跑构建（产出 .next/ 或静态文件）
  → 产物上传到 Edge 网络（静态资源进 CDN，函数部署到 Serverless/Edge）
  → 颁发 HTTPS 域名（默认 *.vercel.app）
  → 生产部署完成（约 30s-2min）
```

- **零配置**：对标准 Next.js 项目，连 `vercel.json` 都不用写——Vercel 自动识别 `next build`、自动判断 SSR/SSG、自动把 `/api/*` 当 Serverless Functions。只有需要自定义（重写路由、改运行时、配 Header）时才写 `vercel.json`。
- **预览部署**：push 到任意非 main 分支或开 PR，Vercel 自动生成一个**预览部署**——独立 URL（`<branch>-<project>.vercel.app`），完整可点的线上版本。这让设计评审、产品验收、QA 测试都能在**合并前**看到真实效果，是 Vercel 最被称道的特性之一。
- **环境变量**：在 Vercel 控制台按环境（Development/Preview/Production）分别配置，构建时注入；敏感信息（数据库密码、API Key）只放 Production，避免泄漏到 Preview 部署。

## 三、Edge 网络：全球就近返回

Vercel 不维护单一数据中心，而是把构建产物分发到**全球边缘节点**（Edge Network）：

- **静态资源**（JS/CSS/图片/SSG 页面）：直接进 CDN，用户就近从最近的边缘节点取，延迟低。
- **动态请求**（SSR/API）：路由到离用户最近的函数实例执行。Edge Functions 本身就跑在边缘节点（Cloudflare Workers 之上），Serverless Functions 跑在区域数据中心（选一个主区域，如 `iad1`）。
- **HTTPS 自动**：所有部署自动签发并续期证书，`*.vercel.app` 开箱即用；绑定自定义域名后自动给自定义域名签证书。

这种架构让一个部署好的 Next.js 站点，东京用户和纽约用户都能拿到较低延迟——这是传统单机房部署做不到的。

## 下一步

理解了 Vercel 的定位与零配置工作流后，下一步深入两件事——[部署与框架集成](./guide-line/deploy-and-frameworks)（Next.js 原生支持、其他框架适配、预览部署与域名）与[Serverless 与 Edge Functions](./guide-line/serverless-and-edge)（两类运行时的差异、数据层、定价陷阱）。
