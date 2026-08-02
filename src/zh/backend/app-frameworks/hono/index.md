---
layout: doc
---

# Hono

**Hono** 是**边缘优先、跨运行时**的现代 Web 框架——由 Yusuke Wada（Cloudflare）于 2022 年创建，专为边缘计算（Edge Computing）和多运行时环境设计。它一个框架就能跑在 **Cloudflare Workers、Deno、Bun、Node.js、Vercel Edge、Lagon、AWS Lambda** 等几乎所有 JS 运行时上，且基于 **Web Standards**（Request/Response/Headers/URL 这些标准 Web API），不绑定特定运行时的私有 API。**Hono 超快**（核心超轻量 < 20KB，路由编译期优化），在 Cloudflare Workers 等边缘环境基准测试中表现卓越。它还有 **Hono RPC**——客户端通过共享路由定义获得端到端类型推断，调用 API 像 RPC 一样类型安全。

Hono 的全部考点围绕**跨运行时与 Web Standards**、**中间件机制**、**Hono RPC** 展开：①**跨运行时**——同一份代码在 CF Workers/Deno/Bun/Node 等运行，靠 `@hono/node-server`、`hono/deno`、`hono/bun` 等适配器对接；②**Web Standards**——处理器用标准 `Request`/`Response`/`Headers`，而非 Express/Fastify 的私有 req/res 对象；③**中间件**——`app.use('*', middleware)` 或 `app.get('/api', middleware, handler)`，`c`（Context）对象贯穿，洋葱模型；④**Hono RPC**——`hc()` 客户端基于路由定义自动推断请求/响应类型，调用 API 全程类型安全。本叶是边缘计算与跨运行时选型的代表，与 [Express](../express/)（Node 生态派）、[Fastify](../fastify/)（Node 性能派）形成三角对比。

## 评价

**优点**

- **跨运行时**：一份代码跑 CF Workers/Deno/Bun/Node/Vercel Edge，无锁定
- **Web Standards**：基于 Request/Response/Headers 标准 API，未来兼容性好
- **超快超轻**：核心 < 20KB，路由编译期优化，边缘环境性能卓越
- **Hono RPC**：端到端类型推断，客户端调用 API 全程类型安全
- **TypeScript 一等公民**：开箱即用，类型推断完善

**缺点**

- **Node 内性能不及 Fastify**：在纯 Node 高 QPS 场景，Fastify 的 Schema 序列化更快
- **生态较新**：中间件规模小于 Express（数百 vs 数万），部分功能需自写
- **学习曲线**：Web Standards API 与 Express 的 req/res 不同，需适应
- **Node 适配额外配置**：跑 Node 需 `@hono/node-server`，比 Express 直接 `app.listen` 多一步

## 本叶地图

- [入门](./getting-started) —— Hono 是什么、跨运行时、Web Standards、超快、Hono RPC、中间件、最小应用
- [跨运行时与 Web Standards](./guide-line/cross-runtime) —— 运行时适配器、CF Workers/Deno/Bun/Node 部署、Web Standards API、为什么边缘优先
- [中间件与 Hono RPC](./guide-line/middleware-and-rpc) —— 中间件机制、Context 对象、洋葱模型、hc() RPC 客户端、类型推断
- [参考](./reference) —— API 速查、运行时清单、中间件清单、与 Express/Fastify 对比、易错点

## 幻灯片地址

<a href="/SlideStack/hono-slide/" target="_blank">Hono</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Hono" target="_blank" rel="noopener noreferrer">Hono 测试题</a>
