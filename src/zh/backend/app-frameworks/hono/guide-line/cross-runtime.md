---
layout: doc
outline: [2, 3]
---

# 跨运行时与 Web Standards：边缘优先的设计

> 基于 Hono v4 · 核于 2026-08

## 速查

- **跨运行时核心**：Hono 业务代码（路由 + 中间件 + 处理器）与运行时解耦——通过适配器对接各运行时，同一份代码到处跑。这是 Hono 区别于 Express/Fastify（仅 Node）的根本特征。
- **`app.fetch` 是核心接口**：所有运行时适配器最终都是调用 `app.fetch(request, env?, executionCtx?)` 拿 Response——不同运行时只是启动 HTTP 服务的方式不同。
- **CF Workers（原生）**：`export default app`（app.fetch 即 Workers 的 fetch handler）；`c.env` 访问 KV/D1/R2 等绑定。
- **Deno**：`Deno.serve(app.fetch)`，原生支持 Request/Response。
- **Bun**：`export default { port, fetch: app.fetch }`，Bun 原生支持 Web Standards。
- **Node**：需 `@hono/node-server` 的 `serve({ fetch: app.fetch, port })`——因 Node 没有原生 Request/Response HTTP 服务 API。
- **Vercel Edge / AWS Lambda**：Vercel Edge 用 `export default`；Lambda 用 `hono/aws-lambda` 的 `handle(app)`。
- **Web Standards API**：处理器用标准 Request/Response/Headers/URL，与浏览器 Fetch API、Service Worker 一致——未来兼容性好。
- **边缘优先（Edge-first）**：Hono 首要场景是 CF Workers 等边缘——代码部署到全球边缘节点，靠近用户，低延迟，无中心服务器瓶颈。
- **为什么边缘重要**：①全球低延迟（用户访问最近节点）；②无中心瓶颈（不像传统 Node 单区域部署）；③成本（按请求计费，无空闲机器）。

## 一、跨运行时：一份代码到处跑

Hono 的核心卖点是**无运行时锁定**——业务代码（路由定义、中间件、处理器）与具体运行时解耦，通过适配器对接各平台：

```
        // app.ts —— 业务代码（运行时无关）
        const app = new Hono()
        app.get('/api', (c) => c.json({ ok: true }))
        
                    │ 同一份 app
        ┌───────────┼───────────┬──────────┬──────────┐
        ▼           ▼           ▼          ▼          ▼
   CF Workers     Deno        Bun        Node      Vercel
   export app     Deno.serve  export{}   node-server  Edge
   (c.env=KV)     (原生)      (原生)     (适配器)     (export)
```

- **业务代码不变**：`new Hono()`、路由、中间件、`c.json()` 这些在所有运行时都一样。
- **只换启动方式**：CF Workers 用 `export default app`，Deno 用 `Deno.serve(app.fetch)`，Node 用 `@hono/node-server`——一行启动代码的差别。
- **迁移成本极低**：今天跑 CF Workers，明天迁 Deno Deploy，业务代码几乎不改。

## 二、CF Workers：Hono 的首要场景

Cloudflare Workers 是 Hono 的"原生主场"——两者都是基于 Web Standards 的边缘运行时：

```ts
// CF Workers 部署
import { Hono } from "hono";

const app = new Hono();

app.get("/api/data", (c) => {
  const kv = c.env.MY_KV; // CF Workers KV 绑定
  const value = await kv.get("key");
  return c.json({ value });
});

export default app; // app.fetch 即 Workers 的 fetch handler
```

- **`export default app`**：CF Workers 的入口是 `export default { fetch }`，Hono 的 `app` 正好有 `fetch` 方法，直接 export 即可。
- **`c.env`**：CF Workers 把 KV/D1/R2/Queue/Secret 等资源以 binding 形式注入，通过 `c.env` 访问（`c.env.MY_KV`、`c.env.DB`）。
- **`c.executionCtx`**：Workers 的执行上下文，可调 `waitUntil()` 让后台任务在响应后继续。
- **全球边缘**：Workers 部署到 Cloudflare 全球 300+ 节点，用户访问最近节点，延迟 < 50ms。

## 三、Deno 与 Bun：原生 Web Standards

Deno 和 Bun 原生支持 Request/Response，与 Hono 契合度高：

```ts
// Deno（Deno Deploy）
import { Hono } from "https://deno.land/x/hono/mod.ts";
const app = new Hono();
app.get("/", (c) => c.text("Deno + Hono"));
Deno.serve(app.fetch); // 原生 Deno.serve

// Bun
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Bun + Hono"));
export default { port: 3000, fetch: app.fetch }; // Bun 原生 fetch handler
```

- **Deno**：`Deno.serve(app.fetch)` 直接启动，app.fetch 接收 Request 返回 Response，完美对接。
- **Bun**：`export default { port, fetch: app.fetch }`，Bun 原生支持这套 API。
- **两者都很快**：Deno/Bun 的 HTTP 性能优于 Node，配合 Hono 的轻量路由，边缘/本地都极速。

## 四、Node：需适配器

Node 没有原生 Request/Response HTTP 服务 API（Node 18+ 才部分支持，但 http 模块仍是回调风格），所以跑 Hono 需 `@hono/node-server`：

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.text("Node + Hono"));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`listening on ${info.port}`);
});
```

- **`@hono/node-server`**：把 Node 的 `http.Server` 转成 Web Standards——把 Node 的 req/res 包装成 Request/Response，喂给 `app.fetch`，再把返回的 Response 写回 Node res。
- **`c.env` 在 Node 是空**：Node 没有运行时环境绑定（KV/D1），需用 `c.set()` 中间件自己注入。
- **性能权衡**：在纯 Node 高 QPS 场景，Fastify 的 Schema 序列化比 Hono 的通用处理快——Hono 的优势在跨运行时和边缘，不是 Node 内极致性能。

## 五、Web Standards：Request/Response/Headers

Hono 处理器用 Web Standards API，与 Express/Fastify 的私有对象截然不同：

```ts
// Hono：Web Standards
app.get("/data", async (c) => {
  const req: Request = c.req.raw; // 原生 Request
  const headers = c.req.header("Authorization"); // Headers
  const url = new URL(c.req.url); // 标准 URL 解析
  return new Response("raw", { status: 200 }); // 标准 Response
});

// 对比 Express：私有 req/res
app.get("/data", (req, res) => {
  req.headers.authorization; // Express 私有 req
  res.status(200).send("raw"); // Express 私有 res
});
```

- **标准 Request/Response**：Hono 的 `c.req` 封装原生 Request，`c.json()` 返回原生 Response——与浏览器 Fetch API、Service Worker、Edge Runtime 完全一致。
- **可 escape hatch**：`c.req.raw` 拿原生 Request，`new Response()` 直接返回——任何 Web Standards 工具都能集成。
- **未来兼容**：Web Standards 是 W3C/WHATWG 标准，浏览器和各运行时都在收敛到这套 API，Hono 不会过时。

## 六、为什么边缘优先（Edge-first）

Hono 首要场景是边缘运行时（CF Workers/Deno Deploy/Vercel Edge），这源于边缘计算的三大优势：

```
传统 Node 部署（单区域）            边缘部署（全球节点）
┌──────────────────┐              ┌────┐ ┌────┐ ┌────┐
│  中心服务器        │              │节点│ │节点│ │节点│  ← 全球 300+
│  (us-east-1)     │              │ CF │ │ CF │ │ CF │
│                  │              │边缘│ │边缘│ │边缘│
│  所有请求汇聚至此   │              └──┬─┘ └──┬─┘ └──┬─┘
└──────────────────┘                 │      │      │
   ↑                                 │      │      │
   │ 全球用户都要连到这里              └──┬───┘──────┘
   │ 延迟 100-300ms                     │
   │ 单点瓶颈/故障                          │ 用户访问最近节点
                                       │ 延迟 < 50ms
                                       │ 无中心瓶颈
```

- **全球低延迟**：边缘节点部署到全球（CF Workers 300+ 节点），用户访问最近的，延迟 < 50ms（vs 传统单区域 100-300ms）。
- **无中心瓶颈**：没有单台中心服务器被所有请求打，故障/过载风险分散。
- **按请求计费**：CF Workers 按 request 计费，无空闲机器成本（vs 传统 Node 要常驻 EC2）。
- **Hono 适合边缘**：核心 < 20KB（边缘有体积限制）、启动快（冷启动敏感）、Web Standards（边缘运行时标准 API）。

## 七、运行时选型建议

| 场景 | 推荐运行时 | 原因 |
| --- | --- | --- |
| 全球低延迟 API/SSR | **CF Workers** + Hono | 边缘节点，< 50ms |
| 全栈应用（需 Node 生态） | **Node** + Hono | 兼容 Express 中间件 |
| 追求性能 + 简单 | **Bun** + Hono | Bun 启动快、性能强 |
| TypeScript 原生 | **Deno** + Hono | Deno 原生 TS |
| 已在 Vercel 生态 | **Vercel Edge** + Hono | 与 Next.js 同部署 |
| 已有 AWS Lambda | **Lambda** + Hono | 适配 API Gateway |

## 下一步

理解了 Hono 的跨运行时与 Web Standards 后，下一步看[中间件与 Hono RPC](./middleware-and-rpc)——洋葱模型、Context 对象、hc 客户端的端到端类型推断机制。
