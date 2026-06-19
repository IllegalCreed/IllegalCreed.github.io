---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MSW v2.x 编写

## 速查

- 安装 + 初始化：`pnpm add -D msw`；浏览器 `npx msw init public/ --save`
- handler：`http.get(url, ({ request, params, cookies }) => HttpResponse.json(...))`
- 测试：`setupServer` + `listen` / `resetHandlers` / `close`
- 完整说明见 [入门](./getting-started.md) / [Handler](./guide-line/handlers.md) / [测试集成](./guide-line/testing.md) / [网络行为](./guide-line/network-behavior.md) / [迁移与对比](./guide-line/migration.md)

## Handler API

| API                     | 用途                              |
| ----------------------- | --------------------------------- |
| `http.get/post/put/...` | 定义 REST handler                 |
| `http.all`              | 匹配任意方法                      |
| `graphql.query`         | GraphQL query handler             |
| `graphql.mutation`      | GraphQL mutation handler          |

## HttpResponse

| API                                | 说明                          |
| ---------------------------------- | ----------------------------- |
| `HttpResponse.json(data, init?)`   | JSON 响应                     |
| `HttpResponse.text(body)`          | 纯文本                        |
| `HttpResponse.html(body)`          | HTML                          |
| `HttpResponse.error()`             | 网络错误（连接中断）          |
| `new HttpResponse(body, init)`     | 自定义状态码 / 头             |

## resolver 参数

| 属性        | 说明                              |
| ----------- | --------------------------------- |
| `request`   | Fetch API `Request`（`request.url` 是字符串）|
| `params`    | 路径参数                          |
| `cookies`   | 请求 cookie                       |
| `requestId` | 请求 UUID                         |

## server / 生命周期

| API                                    | 说明                          |
| -------------------------------------- | ----------------------------- |
| `setupServer(...handlers)`             | Node 测试（`msw/node`）       |
| `setupWorker(...handlers)`             | 浏览器（`msw/browser`）       |
| `server.listen({ onUnhandledRequest })`| 开始拦截                      |
| `server.resetHandlers()`               | 清运行时 handler              |
| `server.close()`                       | 停止拦截                      |
| `server.use(...handlers)`              | 运行时覆盖（支持 `{ once: true }`）|

## 网络行为

| API                  | 说明                          |
| -------------------- | ----------------------------- |
| `delay(ms?)`         | 延迟（精确 / 随机 / `"infinite"`）|
| `passthrough()`      | 放行当前请求到真实网络        |
| `bypass(request)`    | 包装请求，发不被拦截的真实请求|
| `onUnhandledRequest` | `"error"` / `"warn"` / `"bypass"` |

## 官方资源

- 文档：[https://mswjs.io/](https://mswjs.io/)
- Node 集成：[https://mswjs.io/docs/integrations/node](https://mswjs.io/docs/integrations/node)
- 1.x → 2.x 迁移：[https://mswjs.io/docs/migrations/1.x-to-2.x](https://mswjs.io/docs/migrations/1.x-to-2.x)
- GitHub：[https://github.com/mswjs/msw](https://github.com/mswjs/msw)
