---
layout: doc
outline: [2, 3]
---

# 网络行为

> 基于 MSW v2.x 编写

## 速查

- HTTP 错误：`new HttpResponse(null, { status: 503 })`
- 网络错误（连接中断）：`HttpResponse.error()`
- 延迟：`await delay(1000)` / `await delay()`（随机）/ `await delay("infinite")`
- 放行当前请求：`return passthrough()`
- handler 内发真实请求：`fetch(bypass(request))`
- GraphQL：`graphql.query/mutation`，响应显式写 `{ data: ... }`

## 错误响应 vs 网络错误

两者语义不同：错误响应是「服务器回了 4xx/5xx」，网络错误是「请求根本没到/连接断了」。

```ts
// HTTP 错误响应（有状态码、可有 body）
http.get("/api/data", () => new HttpResponse(null, { status: 503 }));

// 网络错误（触发 TypeError: Failed to fetch）
http.get("/api/data", () => HttpResponse.error());
```

## 延迟

```ts
import { http, delay, HttpResponse } from "msw";

// 精确延迟
http.get("/slow", async () => {
  await delay(1000);
  return HttpResponse.json({ ok: true });
});

// 随机真实延迟（Node 测试中自动变 0，不拖慢测试）
http.get("/realistic", async () => {
  await delay();
  return HttpResponse.json({ ok: true });
});

// 无限挂起（测超时场景）
http.get("/timeout", async () => {
  await delay("infinite");
  return new Response();
});
```

## passthrough：放行当前请求

让被拦截的请求走真实网络（不产生额外请求）：

```ts
import { http, passthrough, HttpResponse } from "msw";

http.get("/resource", ({ request }) => {
  if (request.headers.has("x-skip-mock")) return passthrough();
  return HttpResponse.text("Mocked");
});
```

## bypass：handler 内发真实请求

在 handler 内部发起一个**不被 MSW 拦截**的真实请求（如「先取真实数据再加工」）：

```ts
import { http, HttpResponse, bypass } from "msw";

http.get("/resource", async ({ request }) => {
  const real = await fetch(bypass(request)); // bypass 包装，避免再次被拦截
  const data = await real.json();
  return HttpResponse.json({ ...data, mocked: true });
});
```

> `passthrough` 放行**当前**请求；`bypass` 用于在 handler 里发**额外**真实请求。

## GraphQL

```ts
import { graphql, HttpResponse } from "msw";

export const handlers = [
  // 按 operation name 匹配 query
  graphql.query("ListUsers", () => {
    return HttpResponse.json({
      data: { users: [{ id: "1", name: "John" }] },
    });
  }),

  // mutation，通过 variables 取变量
  graphql.mutation("CreateUser", ({ variables }) => {
    return HttpResponse.json({
      data: { createUser: { id: "abc", name: variables.name } },
    });
  }),

  // GraphQL 错误
  graphql.query("Me", () => {
    return HttpResponse.json({ errors: [{ message: "Unauthorized" }] });
  }),
];
```

::: warning v2 必须显式写 `data:` 根字段
1.x 的 `ctx.data(...)` 会自动包一层 `data`；v2 取消了这个特殊处理，必须自己在 `HttpResponse.json({ data: ... })` 里写 `data` 根字段。
:::
