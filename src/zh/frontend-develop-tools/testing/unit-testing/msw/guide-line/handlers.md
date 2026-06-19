---
layout: doc
outline: [2, 3]
---

# Handler

> 基于 MSW v2.x 编写

## 速查

- 方法：`http.get/post/put/patch/delete/all(url, resolver)`
- resolver 参数（解构对象）：`{ request, params, cookies, requestId }`
- 响应：`HttpResponse.json(data, { status })` / `.text()` / `.error()` / `new HttpResponse(body, init)`
- 路径参数：`http.get("/posts/:id", ({ params }) => ...)`，`params.id`
- 查询参数：`new URL(request.url).searchParams.get("id")`
- 请求体：`await request.json()` / `request.formData()` / `request.text()`
- cookie：resolver 参数里的 `cookies`

## 定义 handler

```ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user", () => HttpResponse.json({ id: "1", name: "John" })),
  http.delete("/api/user/:id", () => new HttpResponse(null, { status: 204 })),
];
```

支持 `get` / `post` / `put` / `patch` / `delete` / `head` / `options` / `all`。

## resolver 参数

v2 的 resolver 接收**单个对象**（不再是 1.x 的 `req, res, ctx` 三参数）：

| 属性        | 说明                              |
| ----------- | --------------------------------- |
| `request`   | Fetch API 的 `Request` 实例       |
| `params`    | 路径参数（`string` 或 `string[]`）|
| `cookies`   | 解析后的请求 cookie               |
| `requestId` | 该请求的 UUID                     |

## HttpResponse

```ts
import { HttpResponse } from "msw";

HttpResponse.json({ id: "1" }, { status: 200 }); // 自动设 Content-Type: application/json
HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
HttpResponse.text("Hello world!");
HttpResponse.error(); // 网络错误（连接中断，非 4xx/5xx）

new HttpResponse(null, { status: 404 }); // 只设状态码、无 body
new HttpResponse("Not found", {
  status: 404,
  headers: { "Content-Type": "text/plain" },
});
```

## 路径参数

```ts
http.get<{ id: string }>("/posts/:id", ({ params }) => {
  return HttpResponse.json({ id: params.id });
});

// 可选参数 :id?
http.get("/posts/:id?", ({ params }) => {});
// 重复参数 :segments+ → 值为 string[]
http.get("/settings/:segments+", ({ params }) => {
  console.log(params.segments); // ["user", "privacy"]
});
```

`params` 的值都是字符串（或字符串数组），MSW 不做类型转换。

## 查询参数

v2 的 `request.url` 是**字符串**，要手动 `new URL()` 才能取 searchParams：

```ts
http.get("/products", ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id"); // 单值
  const ids = url.searchParams.getAll("id"); // 多值 ?id=1&id=2 → ["1","2"]
  return HttpResponse.json({ id });
});
```

## 请求体

完全走 Fetch API 标准：

```ts
http.post("/users", async ({ request }) => {
  const user = await request.json(); // JSON
  return HttpResponse.json({ id: "new-1", name: user.name });
});

http.post("/login", async ({ request }) => {
  const data = await request.formData(); // FormData
  if (!data.get("email")) return new HttpResponse("Missing email", { status: 400 });
  return HttpResponse.json({ token: "abc" });
});
```

还有 `request.text()` / `request.arrayBuffer()`。

## cookie

```ts
http.get("/api/user", ({ cookies }) => {
  if (!cookies.authToken) return new HttpResponse(null, { status: 403 });
  return HttpResponse.json({ name: "John" });
});
```

## TypeScript 泛型

`http.*` 接受四个类型参数（按需）：

```ts
http.post<
  { postId: string }, // 路径参数
  { comment: string }, // 请求体
  { commentUrl: string } // 响应体
>("/post/:postId", async ({ params, request }) => {
  const body = await request.json();
  return HttpResponse.json({ commentUrl: `/post/${params.postId}` });
});
```

GraphQL handler 见 [网络行为](./network-behavior.md#graphql)。
