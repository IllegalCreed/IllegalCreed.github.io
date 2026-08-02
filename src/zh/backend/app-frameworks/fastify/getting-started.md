---
layout: doc
outline: [2, 3]
---

# 入门：Fastify、JSON Schema 与插件系统

> 基于 Fastify v5 · 核于 2026-08

## 速查

- **Fastify 是什么**：Node.js 上**以性能和 Schema 驱动**为核心的 Web 框架（2016 年 Matteo Collina / Tomas Della Vedova 创建），专为高 QPS 场景设计。**基准测试比 Express 快 2-3 倍**，是 Node 后端性能派的代表。
- **核心武器：JSON Schema**：用 `schema.querystring/body/params/response` 声明路由的输入输出契约，框架据此做**请求验证**（Ajv 编译校验函数，失败自动返回 400）和**响应序列化**（预编译序列化器，比 Express 的通用 `res.json` 快得多）。
- **最小应用**：`const app = Fastify(); app.get('/', {schema}, async (req, reply) => reply.send(data)); app.listen({port:3000})`——处理器是 async 函数，返回值或 `reply.send()` 作为响应。
- **处理器风格**：`async (request, reply) => {}`——async/await 优先（非 Express 的回调风格），错误靠 `throw` 或返回 Error 自动被错误处理器捕获（不像 Express 4.x 需手动 next(err)）。
- **插件系统**：`fastify.register(plugin, opts)` 封装一组路由/装饰/钩子，每个插件有**独立作用域**（封装模式，decorate 不泄漏到外层）。`fastify-plugin`（`fp`）包装器让插件跳出封装。
- **decorate**：`fastify.decorate('method', fn)` / `decorateRequest`/`decorateReply` 给实例/请求/响应添加自定义方法或属性，是插件扩展 Fastify 的标准方式。
- **TypeScript 一等公民**：开箱即用 TS 支持，`FastifyInstance/FastifyRequest/FastifyReply` 类型完善，Schema 可通过 `jsonSchemaToTypescript` 等生成类型。
- **pino 内建日志**：零配置的高性能结构化日志（pino 是 Node 最快日志库），`fastify.log.info(...)` 直接用。
- **v5（2024）**：Node ≥ 20、改进类型推断、完善插件协议、移除部分废弃 API。
- **进阶顺序**：[Schema 与插件详解](./guide-line/schema-and-plugins) → [性能与 TypeScript](./guide-line/performance) → [参考](./reference)。

## 一、Fastify 是什么：性能与 Schema 派

Fastify 的设计哲学与 Express 截然相反——Express 是"极简灵活、靠中间件拼装"，Fastify 是"**Schema 驱动、性能优先**"。它认为：路由的输入输出是有契约的（请求体必须是这些字段、响应必须是那个结构），把这个契约用 JSON Schema 声明出来，框架就能做两件加速的事——**编译校验函数**（请求到达即快速校验）和**预编译序列化器**（响应序列化时不用运行时探测结构）：

```
    HTTP 请求
       │
       ▼
  preHandler 钩子（鉴权等）
       │
       ▼
  ┌─────────────────────┐
  │ Ajv 校验请求         │ ← schema.querystring/body 编译的校验函数
  │ 失败 → 自动 400       │
  └─────────────────────┘
       │
       ▼
  async handler(request, reply)
       │ 返回数据 / reply.send(data)
       ▼
  ┌─────────────────────┐
  │ 预编译序列化器        │ ← schema.response 编译的序列化函数
  │ 比 res.json 快得多    │
  └─────────────────────┘
       │
       ▼
    HTTP 响应
```

- **性能来源**：Schema 让框架"提前知道"数据结构，编译成最优的校验/序列化代码，避免运行时反射。
- **代价**：要写 Schema（强约束），接口变动时 Schema 要同步维护——这是性能换来的开发成本。

## 二、最小应用：async + schema

```js
import Fastify from "fastify";
const app = Fastify({ logger: true });

// 带 Schema 的路由
app.get("/users/:id", {
  schema: {
    params: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
    },
  },
  async handler(request, reply) {
    const user = await db.find(request.params.id);
    return user; // 返回值即响应（也可 reply.send(user)）
  },
});

app.listen({ port: 3000 });
```

- `Fastify({logger: true})`：开启内建 pino 日志，零配置。
- `schema.params`：声明路径参数契约，Ajv 校验。
- `schema.response.200`：声明 200 响应结构，**预编译序列化器**据此生成（这是性能关键）。
- `async handler(request, reply)`：async 函数，`return` 或 `reply.send()` 都行；`throw` 自动被错误处理器捕获（无需 try/catch + next）。
- **请求校验失败自动 400**：如果 `id` 缺失或类型不对，Fastify 自动返回 400 + 错误详情，handler 不会执行。

## 三、JSON Schema：输入输出契约

Fastify 用标准 JSON Schema（draft-07）声明路由契约，分四个维度：

```js
{
  schema: {
    querystring: { /* ?a=1&b=2 的契约 */ },
    params:      { /* /users/:id 的路径参数契约 */ },
    body:        { /* POST/PUT 请求体契约 */ },
    headers:     { /* 请求头契约 */ },
    response: {
      200: { /* 200 响应结构 */ },
      400: { /* 400 响应结构 */ },
      500: { /* 500 响应结构 */ },
    }
  }
}
```

- **Ajv 编译**：Fastify 启动时用 Ajv（最快的 JSON Schema 校验器）把每个 schema 编译成函数，请求到达时调用编译后的函数校验——比运行时遍历 schema 快得多。
- **response 序列化**：声明 `response.200` 后，Fastify 编译一个专用的序列化函数，只序列化声明的字段（多余字段被丢弃），且不用运行时探测类型——这是 Fastify 比 Express 快的核心原因之一。
- **不写 response schema 的代价**：仍能工作，但退化为通用序列化（性能与 Express 相当）。

## 四、插件系统：register 与封装模式

Fastify 的扩展机制是**插件 + 封装（encapsulation）**：

```js
// 定义插件
async function userPlugin(app, opts) {
  // decorate：给 app 添方法
  app.decorate('getUser', async (id) => db.find(id));

  // 注册路由（只在这个插件作用域内）
  app.get('/users/:id', { schema: {...} }, async (req, reply) => {
    return app.getUser(req.params.id);
  });
}

// 注册插件（默认封装：decorate 不泄漏到外层）
app.register(userPlugin, { db });

// 跨作用域插件：用 fastify-plugin 跳出封装
import fp from 'fastify-plugin';
const sharedPlugin = fp(async (app, opts) => {
  app.decorate('auth', verifyToken); // 跳出封装，全局可用
});
app.register(sharedPlugin);
```

- **封装模式（默认）**：`register` 创建一个独立作用域，插件内的 `decorate` 默认只在该作用域可见——避免命名冲突，是大型项目的模块化基础。
- **`fastify-plugin`（fp）**：让插件跳出封装，decorate 的内容对全局可见——适合共享工具（auth/db 客户端等）。
- **`decorate` 三种**：`decorate(name, value)` 给实例、`decorateRequest(name, value)` 给 request、`decorateReply(name, value)` 给 reply。

## 五、性能：为什么比 Express 快 2-3 倍

Fastify 的性能优势来自多个层面：

| 层面 | Fastify | Express |
| --- | --- | --- |
| **请求校验** | Ajv 编译期生成校验函数 | 需 express-validator/Zod（运行时反射） |
| **响应序列化** | schema 预编译序列化器 | `res.json` 通用序列化 |
| **日志** | 内建 pino（最快日志库） | morgan（需手配，较慢） |
| **中间件模型** | 钩子（hook）数组，精简 | 中间件链，较重 |
| **代码精简** | 内核只做核心，按需装插件 | 内核也精简，但无 Schema 加速 |

- **基准数据**：Fastify 在简单路由上约 2-3 倍 Express 的 QPS；高 QPS 场景（API 网关、高频查询）差距更明显。
- **关键在 response schema**：声明 `response` schema 后序列化快 2-3 倍——不写就退化为 Express 水平。

## 六、TypeScript 支持：一等公民

Fastify 开箱即用 TypeScript（不像 Express 需 `@types/express`）：

```ts
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

const app: FastifyInstance = Fastify();

app.get("/users/:id", {
  schema: {
    params: { type: "object", properties: { id: { type: "string" } } },
  },
  async handler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    request.params.id; // 类型推断为 string
    return { id: request.params.id };
  },
});
```

- **泛型推断**：`FastifyRequest<{ Params: { id: string }; Body: UserDTO }>` 精确约束 params/body/query/headers 的类型。
- **Schema 类型生成**：可用 `jsonSchemaToTypescript` 或 Fastify 的 `jsonSchemaToTypes` 工具，从 JSON Schema 自动生成 TS 类型，避免手写两份。
- **decorate 类型扩展**：自定义装饰的方法需通过模块声明扩展 `FastifyInstance` 接口，TS 才能识别。

## 下一步

理解了 Fastify 的 Schema 驱动、插件系统、性能优势与 TS 支持后，下一步深入[Schema 与插件详解](./guide-line/schema-and-plugins)（JSON Schema 语法、Ajv 编译、register/decorate 封装模式）与[性能与 TypeScript](./guide-line/performance)（性能细节、pino 日志、TS 类型推断）。
