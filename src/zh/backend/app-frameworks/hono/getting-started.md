---
layout: doc
outline: [2, 3]
---

# 入门：Hono、跨运行时与 Web Standards

> 基于 Hono v4 · 核于 2026-08

## 速查

- **Hono 是什么**：**边缘优先、跨运行时**的现代 Web 框架（2022 年 Yusuke Wada / Cloudflare 创建），一份代码跑在 CF Workers/Deno/Bun/Node/Vercel Edge 等几乎所有 JS 运行时。基于 **Web Standards**（Request/Response/Headers），超快超轻（核心 < 20KB）。
- **跨运行时**：同一份 Hono 代码通过不同适配器跑各运行时——CF Workers（原生 `export default { fetch }`）、Deno（`Deno.serve`）、Bun（`Bun.serve`）、Node（`@hono/node-server`）。这是 Hono 的核心卖点——无运行时锁定。
- **Web Standards**：处理器接收标准 `Request` 对象，返回标准 `Response`——不是 Express/Fastify 的私有 req/res 对象。这与浏览器 Fetch API、Service Worker、CF Workers 的 API 一致，未来兼容性好。
- **最小应用**：`const app = new Hono(); app.get('/', (c) => c.text('hi')); export default app`（CF Workers）或 `serve({fetch: app.fetch, port:3000})`（Node）。
- **Context（c）对象**：处理器签名 `(c) => Response`，c 是 Context——含 `c.req`（请求）、`c.json()`/`c.text()`/`c.html()`（响应助手）、`c.header()`（头）、`c.env`（运行时环境，如 CF Workers 的 KV/D1 绑定）、`c.set()`/`c.get()`（请求级变量）。
- **中间件**：`app.use('*', middleware)` 全局挂载、`app.get('/api', mw, handler)` 路由级。中间件签名 `(c, next) => {}`，调 `next()` 放行（洋葱模型，next 后能继续做事）。
- **Hono RPC（hc）**：`hc<App>()('/api/users')` 创建的客户端基于路由定义自动推断请求参数和响应类型——调用 API 像 RPC 一样全程类型安全，无需手写类型或 codegen。
- **超快**：路由用 RegExpRouter（编译期生成正则）或 LinearRouter，核心超轻量，边缘环境基准卓越。
- **TypeScript 一等公民**：开箱即用，路由泛型、RPC 类型推断完善。
- **进阶顺序**：[跨运行时与 Web Standards](./guide-line/cross-runtime) → [中间件与 Hono RPC](./guide-line/middleware-and-rpc) → [参考](./reference)。

## 一、Hono 是什么：边缘优先的跨运行时框架

Hono 的设计哲学是**一份代码，到处运行**——专为边缘计算和多运行时设计。与 Express/Fastify 只能跑 Node 不同，Hono 通过适配器对接各运行时，且处理器基于 Web Standards（Request/Response），不绑定任何运行时的私有 API：

```
              一份 Hono 代码（路由 + 中间件 + 处理器）
                          │
        ┌────────┬────────┼────────┬────────┬────────┐
        ▼        ▼        ▼        ▼        ▼        ▼
   CF Workers  Deno     Bun      Node    Vercel   AWS Lambda
   (原生 fetch) (Deno.serve) (Bun.serve) (node-server) (Edge)  (适配器)
                          │
                    跑在「边缘」节点
              （全球低延迟、靠近用户）
```

- **边缘优先**：Hono 的首要场景是 Cloudflare Workers 等边缘运行时——代码部署到全球边缘节点，靠近用户，低延迟。
- **无锁定**：今天跑 CF Workers，明天想迁 Deno Deploy 或 Vercel Edge，业务代码几乎不改，只换适配器。
- **Web Standards**：用 Request/Response/Headers/URL 这些 Web 标准 API，与浏览器、Service Worker、Edge Runtime 的 API 一致。

## 二、最小应用：Context 与 Web Standards

```ts
import { Hono } from "hono";
const app = new Hono();

// 路由：处理器接收 Context c，返回 Response
app.get("/", (c) => c.text("Hello Hono")); // c.text 返回 Response
app.get("/users/:id", (c) => {
  const id = c.req.param("id"); // 路径参数
  return c.json({ id, name: "Alice" }); // c.json 返回 JSON Response
});

// CF Workers：原生 export
export default app; // app.fetch 是 fetch handler

// Node：用 @hono/node-server
// import { serve } from '@hono/node-server'
// serve({ fetch: app.fetch, port: 3000 })
```

- **`c`（Context）**：贯穿整个请求处理，含请求、响应助手、运行时环境、请求级变量。
- **`c.req`**：标准 Request 的封装，`c.req.param()`（路径参数）、`c.req.query()`（查询串）、`c.req.json()`（body）、`c.req.header()`（请求头）。
- **`c.json()`/`c.text()`/`c.html()`**：返回标准 Response，自动设置 Content-Type。
- **`app.fetch`**：Hono 应用的核心是 `fetch` 方法（接收 Request 返回 Response），各运行时适配器就是调用它。

## 三、跨运行时：适配器

Hono 通过运行时适配器对接各平台，业务代码不变：

```ts
// CF Workers（原生，无需适配器）
export default app; // app.fetch 即 Workers 的 fetch handler

// Deno
// deno run --allow-net app.ts
import app from "./hono-app.ts";
Deno.serve(app.fetch);

// Bun
// bun run app.ts
import { Hono } from "hono";
const app = new Hono();
export default { port: 3000, fetch: app.fetch };

// Node（需 @hono/node-server）
import { serve } from "@hono/node-server";
import { Hono } from "hono";
const app = new Hono();
serve({ fetch: app.fetch, port: 3000 });
```

- **`app.fetch` 是核心**：所有适配器最终都是调用 `app.fetch(request)` 拿 Response，区别只是各运行时怎么启动 HTTP 服务（Workers 的 export default / Deno.serve / Bun.serve / node-server）。
- **Node 需适配器**：因为 Node 没有原生 `Request`/`Response`（Node 18+ 才有，但 HTTP 服务 API 不同），需 `@hono/node-server` 把 Node http 转成 Web Standards。

## 四、Web Standards：Request/Response/Headers

Hono 处理器用 Web Standards API，而非 Express/Fastify 的私有对象：

```ts
app.put("/users/:id", async (c) => {
  // c.req 是 Request 的封装
  const id = c.req.param("id");
  const body = await c.req.json(); // 解析 JSON body
  const auth = c.req.header("Authorization");

  // c.json() 返回标准 Response
  return c.json({ id, updated: body }, 200, {
    "X-Custom": "value", // 响应头
  });
});

// 也可直接操作原生 Request/Response（escape hatch）
app.get("/raw", async (c) => {
  const req: Request = c.req.raw; // 原生 Request
  return new Response("raw response", { status: 200 });
});
```

- **标准 Request/Response**：与浏览器 Fetch API、Service Worker、CF Workers 完全一致——学了 Hono 的 API，到浏览器/Worker 也通用。
- **`c.req.raw`**：拿到原生 Request 对象（escape hatch），可做底层操作。
- **未来兼容**：Web Standards 是 W3C/WHATWG 标准，浏览器和各运行时都在收敛到这套 API，Hono 不会过时。

## 五、中间件：洋葱模型

```ts
import { logger, cors, secureHeaders } from "hono/middleware";

// 全局中间件
app.use("*", logger());
app.use("*", cors());
app.use("*", secureHeaders());

// 路由级中间件
app.get(
  "/api/users",
  authMiddleware,
  rateLimitMiddleware,
  async (c) => {
    return c.json({ users: [] });
  }
);

// 自定义中间件（洋葱模型：next 前后都能做事）
async function timingMiddleware(c, next) {
  const start = Date.now();
  await next(); // 放行下一个中间件/处理器
  c.header("X-Response-Time", String(Date.now() - start));
}
app.use("*", timingMiddleware);
```

- **签名 `(c, next) => {}`**：中间件接收 Context 和 next，调 `await next()` 放行——next 之后能继续做事（洋葱模型，与 Koa 一致，比 Express 线性管道更灵活）。
- **`c.set()`/`c.get()`**：请求级变量，中间件设值（如 `c.set('user', user)`），处理器取值（`c.get('user')`）。
- **官方中间件**：hono/middleware 提供 logger/cors/secureHeaders/basicAuth/bearerAuth/compress/jsx/renderer 等，覆盖常见需求。

## 六、Hono RPC：端到端类型推断

Hono RPC 是 Hono 的杀手锏——客户端调用 API 全程类型安全，无需 codegen：

```ts
// 服务端：定义路由类型
const app = new Hono()
  .get("/users", (c) => c.json({ users: [{ id: 1, name: "Alice" }] }))
  .post("/users", async (c) => {
    const body = await c.req.json<{ name: string }>();
    return c.json({ created: body.name }, 201);
  })
  .get("/users/:id", (c) => c.json({ id: Number(c.req.param("id")) }));

export type AppType = typeof app; // 导出路由类型

// 客户端：hc 基于 AppType 推断
import { hc } from "hono/client";
import type { AppType } from "./server";

const client = hc<AppType>("http://localhost:3000");
const res = await client.users.$get(); // 自动推断返回 { users: {id,name}[] }
const data = await res.json();
data.users[0].name; // 类型安全，IDE 自动补全

const postRes = await client.users.$post({ json: { name: "Bob" } }); // body 类型校验
```

- **类型从路由定义推断**：`hc<AppType>()` 让客户端的每个调用都基于服务端路由的实际返回类型——无需手写 interface 或 OpenAPI codegen。
- **路径、参数、body 全类型安全**：调用 `client.users.$get()` 路径正确，`$post({json})` 的 body 类型校验。
- **`$` 前缀**：RPC 方法带 `$`（如 `$get`/`$post`），与原生 fetch 区分。

## 七、超快：路由器优化

Hono 提供多个路由器（Router）实现，按场景选：

| 路由器 | 特点 | 场景 |
| --- | --- | --- |
| **RegExpRouter** | 编译期生成正则，匹配极快 | 默认，路由数适中时最快 |
| **LinearRouter** | 线性匹配，启动快 | 大量路由（数千+）启动性能好 |
| **PatternRouter** | 模式匹配，最轻量 | 极端体积约束 |
| **TrieRouter** | 字典树 | 复杂路由优先级 |

- **RegExpRouter 默认**：在边缘环境（冷启动敏感）启动快、匹配快，是 Hono 性能的来源。
- **核心 < 20KB**：Hono 核心超轻量，适合边缘环境（CF Workers 有体积限制）。

## 下一步

理解了 Hono 的跨运行时、Web Standards、中间件、RPC 后，下一步深入[跨运行时与 Web Standards](./guide-line/cross-runtime)（各运行时部署细节、为什么边缘优先）与[中间件与 Hono RPC](./guide-line/middleware-and-rpc)（洋葱模型、hc 类型推断机制）。
