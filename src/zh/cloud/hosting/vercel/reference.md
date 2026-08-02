---
layout: doc
outline: [2, 3]
---

# 参考：Vercel 定价、框架与运行时速查

> 基于 Vercel · 核于 2026-08

## 速查

- **定位**：Next.js 母公司打造的前端优先云平台，git-push 零配置部署，覆盖 SSG/SSR/ISR/Serverless/Edge。
- **部署模型**：Production（`main`）/ Preview（分支/PR，独立 URL）/ Development（`vercel dev`）。
- **运行时两类**：Serverless Functions（Node，有冷启动，区域数据中心）/ Edge Functions（V8 isolate，无冷启动，全球边缘，Web API only）。
- **Fluid Compute**（2025）：单实例并发多请求，缓解冷启动，复用连接。
- **数据层**：KV（Redis/Upstash）、Postgres（Neon）、Blob（对象存储），均 Serverless 友好。
- **ISR**：静态页 + 定时/按需重生成，CDN 缓存，Vercel 招牌。
- **定价**：按座（Pro $20/seat/月）+ 用量（带宽/函数调用/Edge 请求），座席费是隐性大头。
- **v0 边界**：v0/bolt.new 等 AI 应用生成器归 AI 章，本叶只讲部署平台。

## 一、定价速查（2026-08）

| 计划 | 月费 | 座席 | 带宽 | 函数调用 | Edge 请求 | 适用 |
| --- | --- | --- | --- | --- | --- | --- |
| **Hobby** | 免费 | 1（个人） | 100 GB | 100K/月 | 1M/月 | 个人/学习，**禁止商用** |
| **Pro** | $20/seat | 按人 | 1 TB | 1M/月 | 1M/月/座 | 小团队/商用 |
| **Enterprise** | 定制 | 定制 | 定制 | 定制 | 定制 | 大团队/SLA/SSO |

- **数据层另算**：KV（按命令数/存储）、Postgres（按计算/存储）、Blob（按存储/带宽）、Image Optimization（按次数），超出额度按量计费。
- **冷知识**：Hobby 计划**禁止商业用途**（条款明确），商用必须升 Pro。带宽超额度单价：Pro $0.15/GB、$40/100GB 档，高流量站要警惕。
- **座席定义**：能登录 Vercel 控制台、部署、管理项目的人。纯访问部署 URL 的访客不计座席。

## 二、框架支持表

| 框架 | 零配置 | SSR | SSG | ISR | Edge | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| **Next.js** | ✅ 一等公民 | ✅ | ✅ | ✅ | ✅ | 母公司产品，全特性首发 |
| **Nuxt 3** | ✅ | ✅（Nitro） | ✅ | △ | ✅ | 通过 Nitro 适配 |
| **Astro** | ✅ | △（可选） | ✅ | ❌ | △ | 默认 SSG，SSR 需配 |
| **SvelteKit** | ✅ | ✅ | ✅ | ❌ | △ | 适配器支持 |
| **Remix** | ✅ | ✅ | △ | ❌ | △ | SSR 为主 |
| **Vite/Vue/CRA** | ✅ | ❌ | ✅ | ❌ | ❌ | 纯静态 SPA |

✅ 原生支持 / △ 部分支持或需配置 / ❌ 不支持

## 三、Edge vs Serverless 对比

| 维度 | Serverless Functions | Edge Functions |
| --- | --- | --- |
| **运行时** | Node.js（完整，含 `fs`/Node 生态） | V8 isolate（Web API only，无 `fs`） |
| **底层** | 区域数据中心 Node 容器 | **Cloudflare Workers**（V8 isolate） |
| **冷启动** | 有（250ms-数秒，Fluid Compute 已缓解） | **近乎零**（<5ms） |
| **执行位置** | 选定主区域（如 `iad1`） | **全球边缘**（就近） |
| **时长上限** | Pro 300s / Enterprise 900s | 30s（流式更长） |
| **数据库连接** | 可用连接池（Fluid Compute 复用） | 只能用 HTTPS/REST（如 KV） |
| **第三方库** | 任意 Node 生态 | 仅 Web 标准 + 兼容 V8 的库 |
| **适用场景** | DB 访问、重逻辑、Node 生态 | 鉴权、改写、A/B、轻 KV、地理路由 |

## 四、渲染策略三件套

| 策略 | 全称 | 何时生成 | 性能 | 时效性 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **SSG** | Static Site Generation | **构建时** | 最快（CDN 静态） | 差（改内容要重新构建） | 博客、文档、营销页 |
| **SSR** | Server-Side Rendering | **每次请求** | 慢（每次服务端渲染） | 实时 | 个性化页面、仪表盘 |
| **ISR** | Incremental Static Regeneration | **构建时 + 后台定时重生成** | 近 SSG（CDN 缓存） | 可调（`revalidate` 秒） | 电商、新闻、CMS |

- **ISR 是 Vercel 招牌**：`revalidate: 60` 表示页面静态化进 CDN，用户拿静态（快），后台每 60 秒触发一次重生成，下次访问看到新内容。`revalidateTag`/`revalidatePath` 支持按需触发（CMS 发布即更新）。

## 五、易错点清单

- **"Edge Functions 是 Node"**：错。Edge 是 V8 isolate（Cloudflare Workers 同源），**不能用** `fs`/`child_process`/`net` 等 Node 内置模块，只能用 Web 标准 API（`fetch`/`Request`/`Response`）。用了 Node API 的库（如 `mongoose`）在 Edge 跑不起来。
- **"Serverless 没有冷启动"**：错。Serverless 有冷启动（首次或闲置后 250ms-数秒）。Fluid Compute（2025）通过单实例并发缓解，但没消除。Edge Functions 才近乎零冷启动。
- **"Hobby 免费可以商用"**：错。Hobby 计划**条款禁止商业用途**，商用必须升 Pro（$20/seat）。
- **"按座是按项目"**：错。按座是**按团队成员**（能登录控制台的人），不是按项目数量。10 人团队 1 个项目也是 10 个座席。
- **"ISR = SSR"**：错。ISR 是静态页 + 后台定时重生成（CDN 缓存，性能近 SSG）；SSR 是每次请求都服务端渲染（性能慢）。ISR 兼顾性能与时效。
- **"Vercel 带宽便宜"**：错。Vercel 带宽单价（超额度后）高于 Cloudflare/自建 CDN。高流量站带宽费容易超，自建往往便宜。
- **"Edge Functions 可以连 Postgres"**：受限。Edge 无长连接，传统 PG 驱动用不了；要用 `@vercel/postgres` 的 Edge 兼容接口或走 REST。
- **"Serverless 函数能跑很久"**：受限于计划。Hobby 10s、Pro 300s、Enterprise 900s。视频转码/大数据/长任务要外部服务。
- **"v0 是 Vercel 的部署功能"**：错。v0（AI UI 生成器）是 Vercel 旗下产品但归 AI 应用生成器范畴，本叶只讲部署平台本身。

## 权威链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 官方文档](https://nextjs.org/docs)
- [Vercel Pricing](https://vercel.com/pricing)
- [Edge Functions 文档](https://vercel.com/docs/functions/edge-functions)
- [Fluid Compute 公告](https://vercel.com/blog)
- [Vercel KV / Postgres / Blob](https://vercel.com/docs/storage)
- 本站幻灯片：<a href="/SlideStack/vercel-slide/" target="_blank">Vercel</a>
