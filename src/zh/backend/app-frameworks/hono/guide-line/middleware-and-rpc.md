---
layout: doc
outline: [2, 3]
---

# 中间件与 Hono RPC：洋葱模型与端到端类型推断

> 基于 Hono v4 · 核于 2026-08

## 速查

- **中间件签名**：`(c, next) => {}`——接收 Context 和 next，调 `await next()` 放行。洋葱模型（next 前后都能做事），与 Koa 一致，比 Express 线性管道更灵活。
- **挂载方式**：`app.use(path, ...mw)` 全局/路径中间件、`app.get(path, mw, handler)` 路由级中间件链。
- **Context（c）核心**：`c.req`（请求）、`c.json/text/html`（响应助手）、`c.header/status`（响应控制）、`c.env`（运行时环境）、`c.set/get`（请求级变量）、`c.var`（变量，TS 扩展点）。
- **请求级变量传递**：中间件 `c.set('user', user)` 设值，处理器 `c.get('user')` 取值——是鉴权后传用户信息的标准方式。
- **官方中间件**：hono/middleware 提供 logger/cors/secureHeaders/basicAuth/bearerAuth/compress/jsx/renderer/etag 等。
- **校验集成**：hono/validator（通用校验）、hono/zod（Zod 集成）、hono/type-validator——在路由层校验请求。
- **Hono RPC（hc）**：`hc<AppType>(baseUrl)` 创建客户端，基于路由定义自动推断请求参数和响应类型——调用 API 全程类型安全，无需 codegen。
- **RPC 类型推断原理**：路由用链式（`.get().post()`）注册时，TypeScript 推断出整个路由树的类型（AppType），客户端 hc<AppType> 据此为每个路径生成精确的方法签名。
- **`$` 前缀**：RPC 方法带 `$`（`client.users.$get()`），与原生 fetch 区分，避免命名冲突。
- **TS 一等公民**：路由泛型、Context 类型、RPC 类型推断完善，开箱即用。

## 一、中间件：洋葱模型

Hono 中间件是洋葱模型——请求进去时做 A，`await next()` 后回来做 B（控制权从最外层逐层进入处理器，再逐层返回）：

```ts
app.use("*", async (c, next) => {
  console.log("A: before next"); // 请求进入时执行
  await next(); // 放行到下一个中间件/处理器
  console.log("A: after next"); // 响应返回时执行
  c.header("X-Timing", "100ms"); // 可改最终响应
});

app.use("*", async (c, next) => {
  console.log("B: before next");
  await next();
  console.log("B: after next");
});

app.get("/", (c) => c.json({ ok: true }));

// 执行顺序：A before → B before → handler → B after → A after
```

- **vs Express 线性管道**：Express 中间件是线性的（next 后就走了，回不来）；Hono/Koa 是洋葱的（next 后能回来做事），适合横切关注点（日志、压缩、改响应头）。
- **`await next()` 必须 await**：不 await 就不放行，请求挂起。
- **改响应**：在 next 后，处理器已生成 Response，中间件可改它的 header/body（如压缩中间件压缩 body）。

## 二、Context（c）：贯穿请求的对象

Context 是 Hono 处理的中心对象，封装请求、响应助手、运行时环境、请求级变量：

```ts
app.get("/api/:id", async (c) => {
  // 请求相关
  const id = c.req.param("id"); // 路径参数
  const page = c.req.query("page"); // 查询串
  const body = await c.req.json(); // JSON body（async）
  const auth = c.req.header("Authorization"); // 请求头

  // 运行时环境（CF Workers 的 KV/D1 绑定）
  const kv = c.env?.MY_KV;
  const value = await kv?.get("key");

  // 响应助手（返回标准 Response）
  return c.json({ id, page }, 200, { "X-Custom": "header" });
  // 或 c.text('plain') / c.html('<h1>hi</h1>') / c.redirect('/other')
});

// 请求级变量（中间件设，处理器取）
app.use("*", async (c, next) => {
  const user = await verifyToken(c.req.header("Authorization"));
  c.set("user", user); // 设值
  await next();
});

app.get("/me", (c) => {
  const user = c.get("user"); // 取值
  return c.json({ user });
});
```

- **`c.set`/`c.get`**：请求级变量，是中间件向处理器传递数据的标准方式（如鉴权后的 user、预取的数据）。
- **`c.env`**：运行时环境绑定（CF Workers 的 KV/D1/R2/Secret），Node 中为空。
- **`c.var`**：变量的对象形式，TS 中可通过 `declare module 'hono'` 扩展 Variables 类型，让 `c.get('user')` 有正确类型。

## 三、TS 中扩展 Variables 类型

```ts
import { Context } from "hono";

// 声明 Variables 的类型
type Variables = {
  user: { id: string; name: string };
  db: Database;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", async (c, next) => {
  c.set("user", await getUser()); // 类型校验：必须是 { id, name }
  await next();
});

app.get("/me", (c) => {
  const user = c.get("user"); // 类型推断为 { id: string; name: string }
  return c.json({ user });
});
```

- **`Hono<{ Variables, Bindings, Env }>` 泛型**：在创建 app 时声明 Variables（请求变量）、Bindings（运行时绑定）、Env（自定义环境）的类型——TS 全程推断。
- **类型安全**：`c.set('user', ...)` 校验值的类型，`c.get('user')` 返回正确类型，避免 any。

## 四、官方中间件

```ts
import { logger, cors, secureHeaders, bearerAuth, compress } from "hono/middleware";

app.use("*", logger()); // HTTP 日志
app.use("*", cors({ origin: "https://app.com" })); // CORS
app.use("*", secureHeaders()); // 安全头（CSP/HSTS）
app.use("*", compress()); // gzip 压缩
app.use(
  "/api/*",
  bearerAuth({ token: "secret" }) // Bearer Token 认证
);

// JSX 渲染（SSR）
import { jsx } from "hono/jsx";
import { renderer } from "hono/middleware";
app.use("*", renderer((c) => {
  return jsx`<Layout>${c.children}</Layout>`;
}));
```

## 五、请求校验：validator 与 Zod

```ts
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

app.post("/users", zValidator("json", userSchema), async (c) => {
  const body = c.req.valid("json"); // 类型安全的 body
  return c.json({ created: body.name });
});
// body 不符合 schema → 自动 400，handler 不执行
```

- **`zValidator(target, schema)`**：target 是 `json`/`query`/`param`/`header`/`form`，schema 是 Zod schema。校验失败自动 400，通过后 `c.req.valid('json')` 拿类型安全的数据。
- **vs Fastify 的 JSON Schema**：Fastify 用 JSON Schema（标准化，序列化加速）；Hono 用 Zod/validator（前端常用，类型推断友好）——不同取舍。

## 六、Hono RPC：端到端类型推断

Hono RPC 是 Hono 的杀手锏——客户端调用 API 全程类型安全，无需手写 interface 或 codegen：

```ts
// 1. 服务端：链式注册路由，导出类型
const app = new Hono()
  .get("/users", (c) =>
    c.json({ users: [{ id: 1, name: "Alice" }] })
  )
  .post(
    "/users",
    zValidator("json", z.object({ name: z.string() })),
    async (c) => {
      const body = c.req.valid("json");
      return c.json({ created: body.name }, 201);
    }
  )
  .get("/users/:id", (c) =>
    c.json({ id: Number(c.req.param("id")) })
  );

export type AppType = typeof app; // 关键：导出路由类型

// 2. 客户端：hc<AppType> 自动推断
import { hc } from "hono/client";
import type { AppType } from "../server";

const client = hc<AppType>("http://localhost:3000");

// 完全类型安全
const res = await client.users.$get(); // 返回类型推断为 { users: {id,name}[] }
const data = await res.json();
data.users[0].name; // IDE 自动补全

const postRes = await client.users.$post({
  json: { name: "Bob" }, // body 类型校验（必须是 { name: string }）
});

// 错误的调用会被 TS 拦截
// await client.users.$post({ json: { wrong: 1 } }); // TS 报错：缺 name
// await client.nonexistent.$get(); // TS 报错：路径不存在
```

### RPC 类型推断的原理

```
链式注册路由：
  new Hono().get('/users', h1).post('/users', h2).get('/users/:id', h3)
     │ TypeScript 推断
     ▼
  typeof app = {
    '/users': { $get: () => Response<{users}>, $post: (body) => Response<{created}> },
    '/users/:id': { $get: () => Response<{id}> }
  }
     │ hc<AppType> 据此生成客户端
     ▼
  client.users.$get() / client.users.$post() / client.users[':id'].$get(id)
  每个方法都有精确的参数和返回类型
```

- **链式注册是关键**：`.get().post()` 链式调用让 TypeScript 能把所有路由累加到类型里——非链式（多次 `app.get`）类型推断不完整。
- **`$` 前缀**：RPC 方法带 `$`（`$get`/`$post`），与原生 fetch 区分。
- **路径映射**：`/users/:id` 映射为 `client.users[':id'].$get({ param: { id } })`。

## 七、RPC vs 传统 API 调用

| 方式 | 类型安全 | Codegen | 维护成本 |
| --- | --- | --- | --- |
| **手写 fetch + interface** | 易不同步 | 无 | 高（接口变动改两处） |
| **OpenAPI codegen** | 有（生成时） | 需要 | 中（需 codegen 工具链） |
| **tRPC** | 端到端 | 无 | 低（但绑定 TS 全栈） |
| **Hono RPC** | 端到端 | 无 | 低（基于路由定义推断） |

- **Hono RPC 像 tRPC**：都是端到端类型安全、无 codegen。区别：tRPC 是自己的协议（非 REST），Hono RPC 仍是标准 HTTP（`$get` 底层是 fetch），可与非 TS 客户端互通。

## 八、中间件 + RPC 实战：鉴权后类型安全调用

```ts
// 服务端：鉴权中间件 + 受保护路由
const app = new Hono<{ Variables: { user: User } }>()
  .use("/api/*", async (c, next) => {
    const user = await verify(c.req.header("Authorization"));
    if (!user) return c.json({ error: "unauthorized" }, 401);
    c.set("user", user);
    await next();
  })
  .get("/api/me", (c) => c.json({ user: c.get("user") }))
  .get("/api/users", (c) => c.json({ users: [] }));

export type App = typeof app;

// 客户端
const client = hc<App>("/");
const me = await client.api.me.$get(); // 类型安全
const meData = await me.json(); // { user: User }
```

## 下一步

理解了 Hono 的中间件与 RPC 后，建议看[Express](../../express/)与[Fastify](../../fastify/)，形成 Node 后端框架的完整三角认知——Hono 主打边缘/跨运行时，Fastify 主打 Node 性能，Express 主打生态。
