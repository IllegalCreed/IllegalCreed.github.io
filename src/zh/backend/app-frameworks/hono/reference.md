---
layout: doc
outline: [2, 3]
---

# 参考：Hono API、运行时与中间件速查

> 基于 Hono v4 · 核于 2026-08

## 速查

- **核心 API**：`new Hono()` 建实例、`app.get/post/...` 注册路由、`app.use(path, mw)` 挂中间件、`app.route(path, subApp)` 挂子应用、`app.fetch(request)` 核心 fetch handler、`app.fire()` 自动绑定运行时。
- **Context（c）**：`c.req`（请求）、`c.json/text/html/redirect`（响应助手）、`c.header/headers`（头）、`c.status`（状态码）、`c.env`（运行时环境绑定）、`c.set/get`（请求级变量）、`c.var`（变量对象）、`c.exec`（执行）。
- **c.req 方法**：`param(key)`（路径参数）、`query(key)`（查询串）、`json()`（JSON body）、`text()`（文本 body）、`header(name)`（请求头）、`arrayBuffer()`/`blob()`/`formData()`（其他 body）、`raw`（原生 Request）。
- **运行时适配器**：CF Workers（原生 `export default`）、Deno（`Deno.serve`）、Bun（`Bun.serve`）、Node（`@hono/node-server`）、Vercel Edge（`export default`）、AWS Lambda（`hono/aws-lambda`）。
- **路由器**：RegExpRouter（默认，最快）、LinearRouter（大量路由）、TrieRouter、PatternRouter（最轻）。
- **Hono RPC**：`hc<AppType>(baseUrl)` 创建客户端，`client.path.$method()` 类型安全调用。
- **官方中间件**：hono/middleware 提供 logger/cors/secureHeaders/basicAuth/bearerAuth/compress/jsx/renderer/etag 等。
- **辅助库**：hono/validator（请求校验）、hono/zod（Zod 集成）、hono/type-validator（类型校验）。

## 一、app 对象核心方法

| 方法 | 说明 | 示例 |
| --- | --- | --- |
| `new Hono()` | 创建应用 | `const app = new Hono()` |
| `app.METHOD(path, ...handlers)` | 注册路由 | `app.get('/users/:id', handler)` |
| `app.use(path, ...middleware)` | 挂中间件 | `app.use('*', logger())` |
| `app.route(path, subApp)` | 挂子应用 | `app.route('/api', apiApp)` |
| `app.fetch(request, env?)` | 核心 fetch handler | 适配器调用它 |
| `app.fire()` | 自动绑定运行时 | 部分运行时用 |
| `app.notFound(handler)` | 404 处理 | `app.notFound((c) => c.text('404', 404))` |
| `app.onError(handler)` | 错误处理 | `app.onError((err, c) => c.json({err}, 500))` |
| `app.onError(err => ...)` | 全局错误 | 兜底 |

- **METHOD**：get/post/put/delete/patch/all。
- **链式调用**：`new Hono().get(...).post(...)` 可链式注册，便于类型推断（RPC 需要）。

## 二、Context（c）对象

| 属性/方法 | 说明 |
| --- | --- |
| `c.req` | 请求对象（封装 Request） |
| `c.json(data, status?, headers?)` | 返回 JSON Response |
| `c.text(text, status?, headers?)` | 返回文本 Response |
| `c.html(html, status?, headers?)` | 返回 HTML Response |
| `c.redirect(location, status?)` | 重定向 |
| `c.header(name, value)` | 设置响应头 |
| `c.status(code)` | 设置状态码 |
| `c.env` | 运行时环境（CF Workers 的 KV/D1/R2 绑定等） |
| `c.set(key, value)` | 设置请求级变量 |
| `c.get(key)` | 获取请求级变量 |
| `c.var` | 变量对象（TS 类型扩展点） |
| `c.executionCtx` | 运行时执行上下文（如 Workers 的 waitUntil） |
| `c.error` | 当前错误（onError 中） |

## 三、c.req 方法

| 方法 | 说明 |
| --- | --- |
| `c.req.param(key?)` | 路径参数（`:id`），不传 key 返回全部 |
| `c.req.query(key?)` | 查询串（`?a=1`），不传 key 返回全部 |
| `c.req.queries(key)` | 同名多值查询串 |
| `c.req.header(name)` | 请求头 |
| `c.req.json()` | 解析 JSON body（async） |
| `c.req.text()` | 解析文本 body（async） |
| `c.req.arrayBuffer()` | ArrayBuffer body |
| `c.req.blob()` | Blob body |
| `c.req.formData()` | FormData body |
| `c.req.parseBody()` | 解析 multipart（文件上传） |
| `c.req.raw` | 原生 Request 对象 |
| `c.req.url` | URL 字符串 |
| `c.req.method` | HTTP 方法 |
| `c.req.routePath` | 匹配的路由路径 |

## 四、运行时适配器清单

| 运行时 | 适配器/包 | 启动方式 |
| --- | --- | --- |
| **Cloudflare Workers** | 内置（原生） | `export default app`（app.fetch 即 fetch handler） |
| **Deno** | 内置 | `Deno.serve(app.fetch)` |
| **Bun** | 内置 | `export default { port, fetch: app.fetch }` |
| **Node.js** | `@hono/node-server` | `serve({ fetch: app.fetch, port })` |
| **Vercel Edge** | 内置（Edge Runtime） | `export default app` |
| **AWS Lambda** | `hono/aws-lambda` | `handle(app)` 适配 API Gateway |
| **Lagon** | 内置 | 平台自动调用 |
| **Deno Deploy** | 内置 | `Deno.serve(app.fetch)` |

- **CF Workers 用 `c.env`**：访问 KV/D1/R2/Queue 等绑定（`c.env.MY_KV.get(key)`）。
- **Node 适配器**：因 Node 无原生 Request/Response（18+ 才部分支持），`@hono/node-server` 做转换。

## 五、路由器（Router）

| 路由器 | 特点 | 选用 |
| --- | --- | --- |
| **RegExpRouter** | 编译期生成正则，匹配最快 | 默认，路由数 < 数千 |
| **LinearRouter** | 线性匹配，启动快 | 大量路由（数千+），启动性能优先 |
| **TrieRouter** | 字典树，复杂优先级 | 需要复杂路由优先级 |
| **PatternRouter** | 模式匹配，最轻量 | 极端体积约束 |

```ts
import { Hono } from "hono";
import { RegExpRouter } from "hono/router/reg-exp-router";
const app = new Hono({ router: new RegExpRouter() });
```

## 六、官方中间件（hono/middleware）

| 中间件 | 作用 |
| --- | --- |
| `logger()` | HTTP 请求日志 |
| `cors()` | 跨域 |
| `secureHeaders()` | 安全头 |
| `basicAuth(...)` | Basic 认证 |
| `bearerAuth(...)` | Bearer Token 认证 |
| `compress()` | gzip 压缩 |
| `etag()` | ETag 缓存 |
| `prettyJson()` | JSON 美化 |
| `jsx()` | JSX 渲染（SSR） |
| `renderer()` | 布局渲染 |
| `cache(...)` | 缓存响应 |
| `timeout(...)` | 超时 |

## 七、Hono vs Express vs Fastify 对比

| 维度 | Hono | Express | Fastify |
| --- | --- | --- | --- |
| **运行时** | CF/Deno/Bun/Node/Edge | 仅 Node | 仅 Node |
| **API 风格** | Web Standards（Request/Response） | 自有 req/res 回调 | 自有 request/reply async |
| **体积** | < 20KB | 较大 | 中 |
| **性能** | 边缘超快 | 基准 1x | Node 内 2-3x |
| **Schema 验证** | validator/zod 集成 | 需第三方 | 内建 JSON Schema |
| **TS 支持** | 一等公民 | 需 @types | 一等公民 |
| **RPC** | Hono RPC（端到端类型） | 无 | 无 |
| **场景** | 边缘/跨运行时 | 通用 Node 后端 | 高 QPS Node 服务 |

## 八、易错点清单

- **Node 跑 Hono 需适配器**：直接 `app.listen` 不行（Hono 无此方法），要用 `@hono/node-server` 的 `serve({ fetch: app.fetch })`。
- **c.env 在 Node 是空**：`c.env` 是运行时环境绑定（CF Workers 的 KV/D1），Node 没有，需用 `c.set()` 自己传。
- **中间件忘 `await next()`**：洋葱模型，不 await next 就不放行，请求挂起。
- **RPC 需链式注册**：`hc<AppType>` 要求路由用链式（`.get().post()`）注册，类型才能正确推断。
- **body 解析是 async**：`c.req.json()` 返回 Promise，要 `await`。
- **RegExpRouter 在大量路由时编译慢**：数千+ 路由用 LinearRouter。
- **Web Standards 与 Express 习惯不同**：`c.req.param()` 不是 `req.params.id`，`c.json()` 不是 `res.json()`。

## 九、进阶方向（链接其他叶）

- [Express](../express/) —— Node 生态派基线
- [Fastify](../fastify/) —— Node 性能派
- [Cloudflare Workers](../../../cloud-services/)（如有） —— Hono 的主要边缘场景

## 权威链接

- [Hono 官网](https://hono.dev/)
- [Hono 文档](https://hono.dev/docs/)
- [Hono GitHub](https://github.com/honojs/hono)
- [Hono RPC](https://hono.dev/docs/guides/rpc)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- 本站幻灯片：<a href="/SlideStack/hono-slide/" target="_blank">Hono</a>
