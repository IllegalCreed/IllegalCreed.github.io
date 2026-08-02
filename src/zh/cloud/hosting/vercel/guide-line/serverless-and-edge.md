---
layout: doc
outline: [2, 3]
---

# Serverless 与 Edge Functions

> 基于 Vercel · 核于 2026-08

## 速查

- **Serverless Functions**：放在 `/api/*` 的 Node 函数，按请求触发，**有冷启动**（首次或闲置后约 250ms-数秒），适合 BFF、数据库访问、复杂 Node 生态逻辑。
- **Edge Functions**：跑在 **Cloudflare Workers 之上**（基于 V8 isolate，非 Node），冷启动**近乎零**（<5ms），全球边缘就近执行，但只能用 Web 标准 API（`fetch`/`Request`/`Response`），不能用 Node 内置模块。
- **运行时差异**：Serverless = Node.js 完整运行时（`fs`/`crypto`/`child_process` 都能用）；Edge = V8 isolate（受限，无 `fs`，部分 Node API 通过 polyfill）。
- **ISR**：增量静态再生，静态页 + 后台定时/按需重生成，结合 CDN 缓存，是 Vercel 招牌的"静态性能 + 动态时效"方案。
- **Fluid Compute**（2025）：一个 Serverless 实例可**并发处理多请求**，复用连接与内存，大幅缓解冷启动——Vercel 对标 Cloudflare Workers 并发模型的演进。
- **Vercel KV**：托管 Redis（基于 Upstash），Serverless 友好（REST/HTTPS 接口，无需长连接），用于缓存/会话/计数。
- **Vercel Postgres**：Serverless Postgres（基于 Neon），按需连接、分支数据库，适合关系型数据。
- **Vercel Blob**：托管对象存储（基于 Cloudflare R4/AWS S3 风格），存文件/图片/视频，配合 Image Optimization。
- **定价陷阱**：**按座（$20/seat·Pro）+ 用量**。座席费（团队成员）是隐性大头；带宽/函数调用/Edge 请求超额后账单暴涨。高流量/大团队自建往往更便宜。
- **时长上限**：Serverless Functions Hobby 10s / Pro 300s / Enterprise 900s；Edge Functions 全局 30s（流式更长）。长任务/WebSocket/重计算不适合。
- **进阶**：[参考](../reference) 有完整对比表与定价。

## 一、Serverless Functions：/api/* 的 Node 函数

Serverless Functions 是 Vercel 上的"传统"函数形态——放在项目 `/api/` 目录的文件（`api/foo.js`、`app/api/route.ts`），每个文件部署成一个独立的 Node 函数：

```ts
// app/api/hello/route.ts (Next.js Route Handler)
export async function GET(request: Request) {
  return Response.json({ hello: 'world', time: Date.now() });
}
```

- **运行时**：完整的 **Node.js**（默认 Node 20+），`fs`/`crypto`/`child_process`/`pg`/`mongoose` 等 Node 生态全可用。也支持 Python/Go/Ruby 运行时。
- **冷启动**：函数闲置一段时间后，实例被回收，下次请求要重新拉起（加载代码、初始化运行时、跑模块顶层代码），这段延迟叫**冷启动**，约 250ms 到数秒（取决于代码体积与依赖）。**首次冷启动最慢**，后续会"预热"一段时间。
- **区域**：部署时选一个主区域（如 `iad1` 美东、`hnd1` 东京），函数跑在该区域的数据中心；离该区域远的用户有跨区延迟。
- **执行时长上限**：Hobby 10 秒、Pro 300 秒（5 分钟）、Enterprise 900 秒（15 分钟）。超长任务（视频转码、大数据处理）不适合放函数，要用外部服务。
- **何时用**：访问数据库、调第三方 API、复杂业务逻辑（需要 Node 生态）、文件 IO、JWT 验证等"重"逻辑。

## 二、Edge Functions：Cloudflare Workers 之上的边缘函数

Edge Functions 跑在**全球边缘节点**，基于 **V8 isolate**（与 Cloudflare Workers 同源技术）：

- **冷启动近乎零**：V8 isolate 启动是微秒级（启动一个 JS context），不像 Node 冷启动要几百毫秒。所以 Edge Functions 几乎"无冷启动"。
- **就近执行**：用户的请求在最近的边缘节点直接跑函数，不用回源到主区域，全球延迟低。
- **受限运行时**：只能用 **Web 标准 API**——`fetch`/`Request`/`Response`/`Headers`/`URL`/`Crypto`/`Cache API` 等。**不能用** Node 内置模块（`fs`/`child_process`/`net` 等不可用，部分如 `Buffer`/`process.env` 通过 polyfill）。第三方库若依赖 Node API 也不能用。
- **执行时长**：默认 30 秒（流式响应更长）。适合快速请求处理，不适合长任务。
- **何时用**：鉴权/重定向（Middleware）、A/B 测试分流、地理路由、轻量 KV 读写、HTML 改写——"快、轻、全球"的场景。

## 三、Fluid Compute：缓解冷启动

**Fluid Compute**（2025 年推出）是 Vercel 对 Serverless 冷启动问题的回应，对标 Cloudflare Workers 的并发模型：

- **传统 Serverless**：一个函数实例**一次只处理一个请求**。请求一来 → 起一个实例 → 处理 → 闲置 → 回收。并发突增时大量冷启动。
- **Fluid Compute**：一个实例**并发处理多个请求**，复用已初始化的运行时、数据库连接、模块顶层缓存。请求处理完不立即回收，而是保留一段时间承接后续请求。冷启动次数大幅下降，数据库连接池也能真正复用。
- **意义**：让 Serverless 在"突发并发"和"数据库连接管理"上接近常驻服务，是 Vercel 在运行时层面对自建 Node 服务（PM2/Docker）竞争力的补强。

## 四、数据层：KV / Postgres / Blob

Vercel 提供**托管数据层**，专为 Serverless/Edge 设计（无需维护长连接）：

| 服务 | 本质 | 用途 | 接入 |
| --- | --- | --- | --- |
| **Vercel KV** | 托管 Redis（基于 Upstash） | 缓存、会话、计数器、限流 | REST/HTTPS，Edge 友好 |
| **Vercel Postgres** | Serverless Postgres（基于 Neon） | 关系型数据、事务 | `@vercel/postgres`，按需连接池 |
| **Vercel Blob** | 对象存储（文件/图片/视频） | 用户上传、静态资源 | `@vercel/blob`，HTTP 上传/下载 |

- **Serverless 友好**：传统 Redis/PG 需要长连接，但 Serverless 函数实例频繁起停，长连接难维护。Vercel 的数据层都支持 **HTTPS/REST 接口**（KV）或**按需连接池**（Postgres via Neon），适配无状态函数。
- **定价另算**：数据层用量单独计费（KV 按命令数、Postgres 按计算时长/存储、Blob 按存储/带宽），不包含在基础计划内。

## 五、定价陷阱：按座 + 用量

Vercel 的定价模型是**按座（seat）+ 用量**，理解陷阱才能避坑：

- **按座（seat）**：每个**团队成员**（能登录控制台、参与部署的人）一个座席。Pro 计划 **$20/seat/月**。一个 10 人团队每月光座席费就是 $200——**这是隐性大头**，很多团队迁移后才发现。注意：仅"查看"的部署 URL 访问者不算座席。
- **用量**：带宽（流量）、函数调用次数、Edge 请求、构建分钟数、Image Optimization 次数等，超出计划额度后按量计费。**高流量站点带宽费容易超**（Vercel 带宽单价高于 Cloudflare/自建 CDN）。
- **何时自建更划算**：①团队人数多（座席费累积）；②流量/带宽大（用量费暴涨）；③重计算/长任务（函数时长超限）。这类场景用 VPS/容器（自建 Node + Nginx + Cloudflare CDN）往往便宜一个数量级。
- **何时 Vercel 更划算**：①个人/小团队；②DX 与迭代速度优先于成本；③重度用 Next.js 特性（ISR/Edge）且自建难复刻。

## 下一步

运行时与数据层讲完，下一步看[参考](../reference)——完整定价表、框架支持表、Edge vs Serverless 对比清单、易错点与权威链接。
