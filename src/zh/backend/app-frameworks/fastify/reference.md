---
layout: doc
outline: [2, 3]
---

# 参考：Fastify API、Schema 与插件速查

> 基于 Fastify v5 · 核于 2026-08

## 速查

- **核心 API**：`Fastify(opts)` 建实例、`app.get/post/...` 注册路由、`app.register(plugin)` 注册插件、`app.decorate(name, value)` 添装饰、`app.listen({port})` 启动、`app.addHook(event, fn)` 挂钩子。
- **路由选项**：`{ schema, preHandler, preValidation, handler }`——schema 声明契约，pre* 是钩子链，handler 是处理器。
- **request 对象**：`request.params`（路径参数）、`request.query`（查询串）、`request.body`（请求体，需 schema 声明）、`request.headers`、`request.id`（请求 ID）。
- **reply 对象**：`reply.status(code)`、`reply.send(data)`、`reply.header(field, value)`、`reply.code(code)`、`reply.type(type)`。
- **Schema 四维**：`querystring`/`params`/`body`/`headers`（输入）+ `response`（输出，按状态码）。
- **插件封装**：`register` 默认独立作用域；`fastify-plugin`（fp）跳出封装。
- **钩子链**：`onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`。
- **日志**：内建 pino，`app.log.info()` / `request.log.error()`，零配置高性能。
- **v5**：Node ≥ 20、改进类型推断、完善插件协议。

## 一、app 对象核心方法

| 方法 | 说明 | 示例 |
| --- | --- | --- |
| `Fastify(opts)` | 创建实例 | `const app = Fastify({ logger: true })` |
| `app.METHOD(path, opts, handler)` | 注册路由 | `app.get('/users/:id', {schema}, handler)` |
| `app.register(plugin, opts)` | 注册插件（封装） | `app.register(cors)` / `app.register(userRoutes)` |
| `app.decorate(name, value)` | 装饰实例 | `app.decorate('db', dbClient)` |
| `app.decorateRequest(name, value)` | 装饰 request | `app.decorateRequest('user', null)` |
| `app.addHook(event, fn)` | 挂钩子 | `app.addHook('onRequest', authHook)` |
| `app.listen({port, host})` | 启动监听 | `app.listen({ port: 3000 })` |
| `app.ready()` | 实例就绪 | 插件加载完后 resolve |
| `app.close()` | 优雅关闭 | 关闭实例，触发 onClose 钩子 |

## 二、request 对象

| 属性 | 说明 |
| --- | --- |
| `request.params` | 路径参数（`/users/:id` → `{id}`） |
| `request.query` | 查询串（`?a=1` → `{a:1}`） |
| `request.body` | 请求体（需 schema 声明） |
| `request.headers` | 请求头 |
| `request.id` | 请求 ID（用于追踪） |
| `request.log` | 该请求的 pino logger（带请求上下文） |
| `request.ip` | 客户端 IP |
| `request.method` | HTTP 方法 |
| `request.url` | 完整 URL |

## 三、reply 对象

| 方法 | 说明 |
| --- | --- |
| `reply.status(code)` / `reply.code(code)` | 设置状态码 |
| `reply.send(data)` | 发送响应（终结） |
| `reply.header(field, value)` / `reply.headers(obj)` | 设置响应头 |
| `reply.type(type)` | 设置 Content-Type |
| `reply.redirect(code, url)` | 重定向 |
| `reply.callNotFound()` | 触发 404 处理 |
| `reply.raw` | 原始 Node res（escape hatch） |

- **return vs reply.send**：handler 既可 `return data` 也可 `reply.send(data)`，效果一样。`return` 更简洁，是推荐写法。

## 四、JSON Schema 速查

```js
{
  schema: {
    // 输入
    querystring: { type: 'object', properties: { page: { type: 'integer' } }, required: ['page'] },
    params:      { type: 'object', properties: { id: { type: 'string', pattern: '^[0-9]+$' } } },
    body:        { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } }, required: ['name'] },
    headers:     { type: 'object', properties: { authorization: { type: 'string' } }, required: ['authorization'] },
    // 输出（按状态码）
    response: {
      200: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
      400: { type: 'object', properties: { error: { type: 'string' } } },
    }
  }
}
```

- **关键字**：`type`（类型）、`properties`（属性）、`required`（必填）、`pattern`（正则）、`enum`（枚举）、`minimum`/`maximum`（范围）、`additionalProperties: false`（禁止额外字段）。
- **Ajv 编译**：Fastify 启动时把每个 schema 编译成校验函数，请求到达即调用——校验速度极快。
- **response 序列化**：声明 `response.200` 后，Fastify 编译专用序列化函数，只输出声明的字段。

## 五、钩子链（生命周期）

请求生命周期中可挂的钩子（按执行顺序）：

| 钩子 | 时机 | 用途 |
| --- | --- | --- |
| `onRequest` | 收到请求最早 | 鉴权、限流（最早的拦截点） |
| `preParsing` | 解析 body 前 | 修改原始请求 |
| `preValidation` | 校验前 | 准备校验数据 |
| `preHandler` | handler 前 | 业务前置（数据预取） |
| handler | 主处理器 | 业务逻辑 |
| `preSerialization` | 序列化前 | 修改响应数据 |
| `onSend` | 发送前 | 改响应头/body |
| `onResponse` | 响应已发送 | 日志、指标 |
| `onError` | 错误时 | 错误日志、上报 |

## 六、常见官方插件

| 插件 | 作用 |
| --- | --- |
| `@fastify/cors` | 跨域 |
| `@fastify/helmet` | 安全头 |
| `@fastify/static` | 静态文件 |
| `@fastify/multipart` | 文件上传 |
| `@fastify/cookie` | Cookie |
| `@fastify/session` | Session |
| `@fastify/jwt` | JWT 认证 |
| `@fastify/passport` | Passport 适配 |
| `@fastify/rate-limit` | 限流 |
| `@fastify/swagger` | OpenAPI 文档自动生成（从 schema） |
| `@fastify/type-provider-typebox` | TypeBox 类型提供者（Schema 即类型） |

## 七、Fastify vs Express vs Hono 对比

| 维度 | Fastify | Express | Hono |
| --- | --- | --- | --- |
| **运行时** | 仅 Node | 仅 Node | CF/Deno/Bun/Node |
| **性能** | 2-3x Express | 基准 1x | 超快（边缘） |
| **Schema 验证** | 内建 JSON Schema | 需第三方 | 需第三方 |
| **TS 支持** | 一等公民 | 需 @types | 一等公民 |
| **日志** | 内建 pino | morgan | 自选 |
| **生态** | 数千插件 | 数万中间件 | 数百中间件 |
| **场景** | 高 QPS Node 服务 | 通用 Node 后端 | 边缘/跨运行时 |

## 八、易错点清单

- **忘了写 response schema**：性能退化为 Express 水平。要享受 2-3x 性能，必须声明 `response`。
- **decorate 类型未扩展**：TS 中自定义装饰的方法需声明模块扩展 `declare module 'fastify' { interface FastifyInstance { myMethod: ... } }`，否则 TS 报错。
- **register 的封装陷阱**：默认封装下，插件内 decorate 不泄漏到外层。要让全局可用，需 `fastify-plugin` 包装。
- **async handler 抛错**：Fastify 自动捕获（与 Express 4.x 不同），无需 try/catch + next。
- **`reply.send` 后再操作 reply**：send 已终结响应，再设 header/status 无效甚至报错。
- **schema 校验失败的错误格式**：返回 400 + Ajv 错误数组，前端要按这个格式解析。
- **v5 Node 版本**：要求 Node ≥ 20，老项目升级要先升 Node。

## 九、进阶方向（链接其他叶）

- [Express](../express/) —— 生态派基线，对比基准
- [Hono](../hono/) —— 边缘跨运行时派
- [NestJS](../../nestjs/)（如有） —— 可切 Fastify adapter

## 权威链接

- [Fastify 官网](https://fastify.dev/)
- [Fastify 文档](https://fastify.dev/docs/latest/)
- [Fastify GitHub](https://github.com/fastify/fastify)
- [Ajv JSON Schema 校验器](https://ajv.js.org/)
- [Fastify benchmarks](https://fastify.dev/benchmarks/)
- 本站幻灯片：<a href="/SlideStack/fastify-slide/" target="_blank">Fastify</a>
