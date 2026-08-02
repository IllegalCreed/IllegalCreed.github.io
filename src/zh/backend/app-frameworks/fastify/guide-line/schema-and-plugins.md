---
layout: doc
outline: [2, 3]
---

# Schema 与插件详解：JSON Schema 验证、序列化与 register/decorate

> 基于 Fastify v5 · 核于 2026-08

## 速查

- **JSON Schema 四个输入维度**：`querystring`（查询串）、`params`（路径参数）、`body`（请求体）、`headers`（请求头）——每个用标准 JSON Schema（draft-07）声明。
- **response 按状态码声明**：`response: { 200: {...}, 400: {...}, 500: {...} }`，每个状态码一个 schema——这是性能关键（预编译序列化器）。
- **Ajv 编译期校验**：Fastify 启动时用 Ajv 把每个 schema 编译成校验函数，请求到达即调用，校验失败自动返回 400 + 错误详情。
- **response 序列化加速**：声明 `response` 后，Fastify 编译专用序列化函数，只输出声明的字段（多余字段丢弃），不用运行时探测类型——比 Express 的通用 `res.json` 快 2-3 倍。
- **register 封装模式（默认）**：`app.register(plugin)` 创建独立作用域，插件内 `decorate` 默认只在该作用域可见——避免命名冲突，是模块化基础。
- **fastify-plugin（fp）跳出封装**：用 `fp` 包装的插件，其 decorate 对全局可见——适合共享工具（auth/db 客户端）。
- **decorate 三种**：`decorate(name, value)`（实例）、`decorateRequest(name, value)`（request）、`decorateReply(name, value)`（reply）。
- **钩子链**：`onRequest` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`——比 Express 中间件链更精细。
- **async handler 自动捕错**：`throw` 或 `return Promise.reject` 自动被错误处理器捕获（与 Express 4.x 不同）。
- **TS 类型推断**：`FastifyRequest<{ Params, Body, Querystring, Headers }>` 泛型精确约束，Schema 可生成类型。

## 一、JSON Schema：输入契约

Fastify 用标准 JSON Schema 声明路由的输入契约：

```js
app.post("/users", {
  schema: {
    // 查询串：?role=admin
    querystring: {
      type: "object",
      properties: { role: { type: "string", enum: ["admin", "user"] } },
    },
    // 路径参数：/users/:id
    params: {
      type: "object",
      properties: { id: { type: "string", pattern: "^[0-9a-f]+$" } },
      required: ["id"],
    },
    // 请求体：POST 的 JSON
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        email: { type: "string", format: "email" },
        age: { type: "integer", minimum: 0 },
      },
      required: ["name", "email"],
      additionalProperties: false, // 禁止额外字段
    },
    // 请求头
    headers: {
      type: "object",
      properties: { authorization: { type: "string" } },
      required: ["authorization"],
    },
  },
  async handler(request, reply) {
    // request.body 已校验，类型安全
    const user = await db.create(request.body);
    return user;
  },
});
```

- **`type`**：数据类型（string/integer/number/boolean/object/array/null）。
- **`properties`**：对象的属性及其子 schema。
- **`required`**：必填字段数组。
- **`pattern`**：字符串正则约束；**`format`**：预定义格式（email/uri/date-time）。
- **`enum`**：枚举值；**`minimum`/`maximum`**：数值范围；**`minLength`/`maxLength`**：字符串长度。
- **`additionalProperties: false`**：禁止请求体有未声明的字段（严格模式，防注入）。

## 二、Ajv：编译期校验

Fastify 内部用 **Ajv**（最快的 JSON Schema 校验器）处理校验：

```
启动阶段：
  schema.body = {...}
     │ Ajv.compile
     ▼
  validateBody = function(data) { /* 编译后的快速校验 */ }

请求阶段：
  POST /users {body}
     │
     ▼
  validateBody(request.body)
     │ 失败 → 自动 400 + 错误详情
     │ 通过 ↓
     ▼
  handler 执行
```

- **编译 vs 运行时**：Ajv 在 Fastify 启动时把每个 schema 编译成专门的校验函数（直接生成 JS 逻辑），请求到达时调用编译后的函数——比运行时遍历 schema 快 10 倍以上。
- **校验失败自动 400**：schema 不通过时，Fastify 自动返回 400 + Ajv 的错误详情（哪个字段、什么问题），handler 不会执行——开发者不用手写校验。
- **可定制错误格式**：`setErrorHandler` 或 `ajv-custom` 插件可定制错误响应格式。

## 三、response 序列化：性能关键

```js
app.get("/users/:id", {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
        },
      },
      404: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  async handler(request, reply) {
    const user = await db.find(request.params.id);
    if (!user) {
      reply.code(404);
      return { error: "not found" };
    }
    return user; // 即使 user 有 10 个字段，也只输出 schema 声明的 3 个
  },
});
```

- **预编译序列化器**：Fastify 启动时为每个 `response.<code>` 编译一个专用的 `JSON.stringify` 替代函数，直接按声明字段拼接 JSON 字符串——不用运行时探测类型、不遍历对象所有属性。
- **多余字段丢弃**：handler 返回的对象即使有 schema 未声明的字段，序列化时也被丢弃（只输出声明的）——既是性能优化也是安全特性（防敏感字段泄漏）。
- **不写 response 的代价**：仍能工作，但退化为通用序列化（运行时探测类型），性能与 Express 相当——**要享受 2-3x 性能，必须声明 response schema**。

## 四、register：插件封装模式

Fastify 的插件系统基于**封装（encapsulation）**：

```js
// 用户模块插件（默认封装）
async function userRoutes(app, opts) {
  // 这里的 decorate 只在 userRoutes 作用域内可见
  app.decorate('userDb', opts.db); // opts.db 由 register 传入

  app.get('/users', async (req, reply) => {
    return app.userDb.list(); // 作用域内可用
  });

  app.get('/users/:id', async (req, reply) => {
    return app.userDb.find(req.params.id);
  });
}

// 注册时传 opts（封装：userDb 不泄漏到外层 app）
app.register(userRoutes, { db: myDbClient });

// 外层访问不到 app.userDb（封装）
app.get('/', async (req, reply) => {
  return app.userDb; // undefined！封装隔离
});
```

- **封装的目的**：避免插件间的命名冲突（多个插件都 decorate `db` 不会打架），是大型项目模块化的基础。
- **作用域继承**：子作用域能访问父作用域的 decorate（父对子可见），但子对父不可见。
- **`prefix`**：`app.register(routes, { prefix: '/api' })` 给插件所有路由加前缀。

## 五、fastify-plugin：跳出封装

有些插件是全局共享工具（auth、db 客户端、工具函数），应该对所有作用域可见——这时用 `fastify-plugin`（`fp`）跳出封装：

```js
import fp from "fastify-plugin";

// 共享插件：用 fp 包装，decorate 对全局可见
const dbPlugin = fp(async (app, opts) => {
  const client = await connectDB(opts.url);
  app.decorate("db", client); // 全局可用
}, { name: "my-db-plugin" });

app.register(dbPlugin, { url: "..." });

// 任何路由都能用 app.db
app.get("/users", async (req, reply) => {
  return app.db.listUsers(); // 可访问（fp 跳出了封装）
});
```

- **`fp` 的作用**：标记插件为"非封装"，其 decorate 提升到根作用域。
- **`name`**：给插件命名（用于检测重复注册和依赖声明）。
- **`fastify-plugin` 是约定**：写共享插件必须用它包装，否则 decorate 默认封装不泄漏。

## 六、decorate 三种与 TS 扩展

```js
// 1. 装饰实例
app.decorate("verifyToken", (token) => jwt.verify(token));

// 2. 装饰 request（每个请求一个实例）
app.decorateRequest("user", null); // 初始 null，preHandler 里赋值

// 3. 装饰 reply
app.decorateReply("success", function (data) {
  this.send({ ok: true, data }); // this 是 reply
});
```

**TypeScript 中扩展类型**（TS 才能识别自定义装饰）：

```ts
declare module "fastify" {
  interface FastifyInstance {
    verifyToken: (token: string) => User;
  }
  interface FastifyRequest {
    user: User | null;
  }
  interface FastifyReply {
    success: (data: unknown) => void;
  }
}
```

- **不扩展类型会报错**：TS 不知道 `app.verifyToken` 存在，会报属性不存在的错。必须用 `declare module` 扩展接口。

## 七、钩子链：比中间件更精细

Fastify 的钩子比 Express 中间件更细分生命周期阶段：

```js
app.addHook("onRequest", async (request, reply) => {
  // 最早：鉴权、限流
  if (!request.headers.authorization) {
    throw new Error("未授权"); // 自动转 401
  }
});

app.addHook("preHandler", async (request) => {
  // handler 前：数据预取
  request.user = await db.findUser(request.userId);
});

app.addHook("onResponse", async (request, reply) => {
  // 响应已发送：日志、指标
  request.log.info({ duration: Date.now() - request.startTime }, "done");
});
```

- **钩子顺序**：`onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`。
- **async 钩子**：钩子可以是 async，Fastify 会 await；抛错自动转错误处理。
- **vs Express 中间件**：Express 只有"中间件"一个概念（线性链），Fastify 把请求生命周期拆成多个阶段，每个阶段可挂多个钩子，更精确控制。

## 下一步

Schema 与插件是 Fastify 的两大支柱，下一步看[性能与 TypeScript](./performance)——为什么比 Express 快 2-3 倍的细节、pino 日志、TypeScript 类型推断与 Schema 类型生成。
