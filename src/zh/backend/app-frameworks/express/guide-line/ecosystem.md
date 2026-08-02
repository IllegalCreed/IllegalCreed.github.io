---
layout: doc
outline: [2, 3]
---

# 生态与对比：必装中间件、与 Fastify/Hono/Koa 的选型

> 基于 Express 5.0 / 4.x · 核于 2026-08

## 速查

- **生态无敌**：npm 上 `express-*` 中间件数以万计，任何需求（认证/日志/限流/文件/安全）都有成熟方案，这是 Express 最大的护城河。
- **必装中间件九件套**：`cors`（跨域）、`helmet`（安全头）、`morgan`（日志）、`multer`（上传）、`cookie-parser`（Cookie）、`compression`（压缩）、`express-rate-limit`（限流）、`passport`（认证）、`express-validator`（校验）。
- **vs Fastify**：Fastify 用 JSON Schema 做请求/响应验证 + 序列化加速，**性能比 Express 快 2-3 倍**，开箱即用 TS。但生态规模、文档量、新人上手速度仍不及 Express。
- **vs Hono**：Hono **边缘优先**（Cloudflare Workers/Deno/Bun/Node 全支持），基于 Web Standards（Request/Response），超轻量。Express 只能跑 Node。
- **vs Koa**：Koa 是 Express 原班团队的"下一代"，async/await + 洋葱模型，更现代但生态远小于 Express。
- **何时选 Express**：①生态依赖重（passport/某中间件只有 Express 版）；②团队熟、新人多、要快速上手；③中低 QPS 内部系统、CRUD 后台。
- **何时该迁出**：①QPS 极高、性能成瓶颈 → Fastify；②要跑边缘/多运行时 → Hono；③要强类型 + Schema 驱动 → Fastify/NestJS。
- **1800 万周下载**：意味着绝大多数 Node 项目仍在用 Express，迁移成本与生态惯性使其短期难被替代。

## 一、Express 生态：中间件九件套

Express 不内建功能，全靠中间件拼装。以下是几乎所有项目都会装的"九件套"：

| 中间件 | 作用 | 典型用法 |
| --- | --- | --- |
| `cors` | 跨域资源共享 | `app.use(cors({ origin: 'https://app.com' }))` |
| `helmet` | 安全头（CSP/HSTS/X-Frame） | `app.use(helmet())` |
| `morgan` | HTTP 请求日志 | `app.use(morgan('dev'))` |
| `multer` | 文件上传（multipart） | `app.post('/upload', upload.single('file'))` |
| `cookie-parser` | 解析 Cookie 头 | `app.use(cookieParser())` |
| `compression` | gzip/deflate 压缩 | `app.use(compression())` |
| `express-rate-limit` | API 限流 | `app.use('/api', rateLimit({ max: 100 }))` |
| `passport` | 认证策略（JWT/OAuth/Local） | `passport.use(new JwtStrategy(...))` |
| `express-validator` | 请求参数校验 | `body('email').isEmail()` |

- **passport 是认证生态中心**：500+ 策略（passport-jwt/passport-google-oauth20/passport-local...），几乎所有 Node 认证方案都基于它。
- **替代关系**：`express-validator` 在新项目里常被 Zod/Valibot/Joi 替代（更现代），但 express-validator 与 Express 集成最无缝。

## 二、Express vs Fastify：经典 vs 性能派

| 维度 | Express | Fastify |
| --- | --- | --- |
| **设计哲学** | 极简中间件，灵活拼装 | Schema 驱动，性能优先 |
| **性能（QPS）** | 基准 1x | **2-3x**（Schema 序列化加速） |
| **请求验证** | 需 express-validator/Zod | 内建 JSON Schema（`schema.query/body`） |
| **响应序列化** | `res.json` 通用 | Schema 预编译序列化，更快 |
| **TS 支持** | 需 `@types/express` | 开箱即用（含 Schema 类型推断） |
| **插件生态** | 数万 express-* 中间件 | 数千 fastify-* 插件（规模小但精） |
| **学习曲线** | 极低（教程海量） | 中（要学 Schema/插件封装） |
| **日志** | morgan（需手配） | 内建 pino（零配置高性能日志） |
| **维护节奏** | 慢（5.0 等 9 年） | 快（v5 2024 发布，活跃迭代） |

- **何时选 Fastify**：高 QPS API 网关、Schema 强类型项目、对延迟敏感的服务。
- **何时留 Express**：重生态依赖、团队熟、CRUD 后台、性能要求不极端。

## 三、Express vs Hono：Node vs 跨运行时

| 维度 | Express | Hono |
| --- | --- | --- |
| **运行时** | **仅 Node** | Cloudflare Workers / Deno / Bun / Node / Vercel Edge |
| **API 风格** | `req/res/next` 回调 | **Web Standards**（Request/Response/Headers） |
| **体积** | 较大 | 超轻量（核心 < 20KB） |
| **TS 支持** | 需 @types | 开箱即用（一等公民） |
| **RPC** | 无 | **Hono RPC**（客户端类型自动推断） |
| **中间件** | 数万 | 数百（精炼） |
| **场景** | 传统 Node 后端 | 边缘计算、Serverless、跨运行时 |

- **何时选 Hono**：跑 Cloudflare Workers、要全球低延迟边缘部署、需要客户端 RPC 类型推断。
- **何时留 Express**：纯 Node 后端、生态依赖重、不关心边缘。

## 四、Express vs Koa：同源不同代

Koa（2013）是 Express 原班团队（TJ Holowaychuk 等）的"下一代"尝试：

| 维度 | Express | Koa |
| --- | --- | --- |
| **错误处理** | next(err) 回调 | async/await + try/catch |
| **中间件模型** | 线性管道 | **洋葱模型**（next 后能回来做事） |
| **内建中间件** | 无 | 无（更极简） |
| **生态** | 庞大 | 小（Koa-* 系列自维护） |
| **现状** | 主流 | 小众（被 Fastify/Hono 超越） |

- Koa 的洋葱模型（请求进去时做 A，`await next()` 后回来做 B）比 Express 的线性管道更灵活，但生态没起来，如今多被 Fastify 替代。

## 五、Express 周下载量与市场地位

- **周下载约 1800 万**（2026 npm 数据）——仍是 Node 框架装机量第一。
- **Fastify 周下载约 300-400 万**——增长快，但规模仍约 Express 的 1/5。
- **Hono 周下载约 100-200 万**——边缘场景主导，增速最快。
- **NestJS 周下载约 500-600 万**——但 NestJS 默认基于 Express（也可切 Fastify），所以 Express 的实际覆盖比下载量更大。

**结论**：Express 的市场地位短期不可撼动，但新项目选型正逐步向 Fastify（性能/Schema）和 Hono（边缘/跨运行时）分流。

## 六、何时选 Express，何时迁出

**选 Express 的场景**

- 重生态依赖（passport 策略、特定中间件只有 Express 版）
- 团队熟练、新人多、要快速上手（教程最全）
- 中低 QPS 内部系统、CRUD 后台、SSR 站点
- 已有大型 Express 代码库，迁移成本高

**迁出 Express 的信号**

- QPS 极高、性能成瓶颈 → **Fastify**（2-3x 性能 + Schema）
- 要跑边缘/Serverless/多运行时 → **Hono**（Cloudflare Workers 等）
- 要强类型 + 企业级架构 → **NestJS**（基于 Express 或 Fastify）
- 要 async/await + 洋葱模型 → **Koa**（但更推荐 Fastify）

## 七、迁移建议

- **Express → Fastify**：中间件需改写成 Fastify 插件（`fastify.register`），路由风格相近，`req/res` 改为 `request/reply`。多数 passport 策略有 Fastify 适配（`@fastify/passport`）。
- **Express → Hono**：API 风格变化大（Web Standards），但 Hono 设计借鉴 Express，迁移成本中等。
- **渐进式**：NestJS 可先用 Express adapter，再切 Fastify adapter，无需重写业务代码——这是大型项目低风险现代化的路径。

## 下一步

理解了 Express 的生态地位与对比后，建议看[Fastify](../../fastify/)（Schema + 性能派）与[Hono](../../hono/)（边缘跨运行时派），形成 Node 后端框架的完整三角认知。
