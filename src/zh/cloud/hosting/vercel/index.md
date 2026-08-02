---
layout: doc
---

# Vercel

**Vercel** 是 Next.js 的母公司（Next.js 作者 Guillermo Rauch 创立）打造的**前端优先云平台**——开发者只需 `git push`，Vercel 自动识别框架、构建产物并部署到全球 Edge 网络，开箱即用支持 SSR/ISR/SSG、Serverless 与 Edge Functions、预览部署与按座定价。它的核心理念是"**零配置 + 开发者体验**"：把传统 DevOps 的配置服务器、配 Nginx、配 CDN、配 CI/CD 全部收编进一个 git push。对一个 Next.js 项目，从代码到线上最快 30 秒；对 Nuxt/Astro/SvelteKit 等也有成熟适配。本叶只讲**部署平台本身**（v0/bolt.new 等 AI 应用生成器归 AI 章）。

Vercel 的全部考点围绕**"前端应用的托管与运行时"**展开：①**部署模型**——git-push 触发、零配置框架识别、预览部署（每个 PR 一个独立 URL）、生产部署；②**渲染策略**——SSR（动态服务端渲染）、SSG（构建时静态化）、ISR（增量静态再生，定时重生成静态页），三者在 Vercel 上都原生支持；③**运行时**——Serverless Functions（`/api/*`，按请求冷启动的 Node 函数）、Edge Functions（跑在 Cloudflare Workers 之上的边缘函数，冷启动近乎零）、Fluid Compute（2025 年推出的并发执行模型，缓解冷启动）；④**数据层**——Vercel KV（Redis）、Postgres（Serverless PG）、Blob（对象存储），全部托管；⑤**定价**——**按座（$20/seat）+ 用量**，团队协作的座席费是隐性大头。后续两叶分别深入"部署与框架集成"和"Serverless 与 Edge Functions"。

## 评价

**优点**

- **极致 DX**：git-push 即部署，零配置识别 Next.js/Nuxt/Astro，预览部署让 PR 评审能直接点开线上效果
- **Next.js 原生**：作为 Next.js 母公司，App Router/ISR/Route Handlers/RSC 等特性在 Vercel 上首发且支持最好
- **Edge 网络**：全球边缘节点，Edge Functions 冷启动近乎零，动态内容延迟低
- **预览部署**：每个分支/PR 一个独立 URL，方便设计/产品/测试在上线前验收

**缺点**

- **厂商锁定风险**：深度依赖 Next.js + Vercel 私有原语（如 ISR 的 on-demand 重验证、Edge Config），迁出自建成本高
- **定价陷阱**：**按座（$20/seat）**对人员多的团队是隐性大头；带宽/函数调用用量超额后账单可能暴涨，自建往往更便宜
- **Serverless 冷启动**：纯 Serverless Functions 有冷启动延迟（虽然 Fluid Compute 已大幅缓解），高并发突发场景不如常驻服务稳
- **不适合长任务/重计算**：函数有执行时长上限（Hobby 10s、Pro 300s），重 CPU/长连接/WebSocket 场景要另寻方案

## 本叶地图

- [入门](./getting-started) —— Vercel 定位、git-push 部署、零配置、Edge 网络、核心术语
- [部署与框架集成](./guide-line/deploy-and-frameworks) —— Next.js 原生支持、框架适配、预览部署、自定义域名、环境变量
- [Serverless 与 Edge Functions](./guide-line/serverless-and-edge) —— Serverless Functions、Edge Functions、KV/Postgres/Blob、Fluid Compute、定价陷阱
- [参考](./reference) —— 定价表、框架支持表、Edge vs Serverless 对比、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/vercel-slide/" target="_blank">Vercel</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Vercel" target="_blank" rel="noopener noreferrer">Vercel 测试题</a>
