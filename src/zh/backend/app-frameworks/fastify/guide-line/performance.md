---
layout: doc
outline: [2, 3]
---

# 性能与 TypeScript：为什么比 Express 快、TS 一等公民

> 基于 Fastify v5 · 核于 2026-08

## 速查

- **性能四支柱**：①Ajv 编译期请求校验（比运行时反射快 10 倍）；②response schema 预编译序列化器（比通用 JSON.stringify 快 2-3 倍）；③内建 pino 日志（Node 最快日志库）；④精简内核 + 钩子数组（比中间件链轻）。
- **基准数据**：Fastify 简单路由 QPS 约 2-3 倍 Express；高 QPS 场景（API 网关、高频查询）差距更明显。
- **关键：response schema**：不声明 response，性能退化为 Express 水平——要享受 2-3x，必须写 response schema。
- **pino 内建**：`Fastify({ logger: true })` 即开启 pino，结构化日志、请求自动带 ID 和上下文、零配置高性能。
- **async handler 自动捕错**：`throw` 或返回 rejected Promise 自动被错误处理器捕获（与 Express 4.x 不同），无需 try/catch + next。
- **TypeScript 一等公民**：开箱即用，`FastifyInstance/FastifyRequest/FastifyReply` 类型完善，`FastifyRequest<{Params,Body,Querystring,Headers}>` 泛型精确约束。
- **Schema 类型生成**：可用 TypeBox（Schema 即类型）、`jsonSchemaToTypescript`、`@fastify/type-provider-typebox` 等实现"写一份 Schema，类型和运行时校验都有了"。
- **decorate 类型扩展**：自定义装饰需 `declare module 'fastify'` 扩展接口，TS 才识别。

## 一、性能四支柱

Fastify 比 Express 快 2-3 倍，性能来自四个层面：

```
┌─────────────────────────────────────────────────┐
│ ① 请求校验：Ajv 编译期生成校验函数              │
│    schema.body → 启动时编译 → 请求时快速校验     │
│    比 express-validator/Zod 运行时反射快 10 倍   │
├─────────────────────────────────────────────────┤
│ ② 响应序列化：response schema 预编译序列化器     │
│    schema.response.200 → 编译成专用 stringify    │
│    只输出声明字段，不运行时探测，比 res.json 快  │
├─────────────────────────────────────────────────┤
│ ③ 日志：内建 pino（Node 最快日志库）             │
│    零配置，结构化，请求自动带 ID + 上下文        │
├─────────────────────────────────────────────────┤
│ ④ 内核：精简，钩子数组而非中间件链              │
│    只做核心，按需装插件，启动开销小              │
└─────────────────────────────────────────────────┘
```

- **支柱①和②是核心**：它们都依赖 Schema——Fastify 的性能优势本质是"**用 Schema 换性能**"。
- **不写 schema 会退化**：如果完全不声明任何 schema，Fastify 的校验和序列化退化为通用逻辑，性能与 Express 相当。所以"用 Fastify 但不写 schema"等于没发挥它的优势。

## 二、Ajv 编译期校验的细节

```js
// 启动时：Ajv 把 schema 编译成函数
app.post("/users", {
  schema: {
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        age: { type: "integer", minimum: 0 },
      },
      required: ["name"],
    },
  },
  handler,
});

// Ajv 编译后等价于（伪代码）：
function validateBody(data) {
  if (typeof data !== "object" || data === null) return error("not object");
  if (typeof data.name !== "string" || data.name.length < 1) return error("name invalid");
  if (data.age !== undefined && (typeof data.age !== "number" || data.age < 0)) return error("age invalid");
  return valid;
}
```

- **编译产物是直接的判断逻辑**：没有运行时的 schema 遍历、没有反射——就是一串 if 判断，CPU 分支预测友好，极快。
- **vs express-validator/Zod**：这些库在校验时要遍历 schema 对象、动态判断每个约束，比编译后的函数慢得多。
- **`ajv` 自定义**：Fastify 允许 `ajv: { customOptions }` 或自定义 Ajv 实例（如加载 `ajv-formats` 支持 email/uri 等 format）。

## 三、response 序列化器的细节

```js
app.get("/users/:id", {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
  },
  async handler(request, reply) {
    // 数据库返回完整用户对象（含密码、createdAt 等）
    const user = await db.find(request.params.id);
    return user;
    // 序列化时只输出 schema 声明的 id、name（密码等被丢弃）
  },
});

// 编译后的序列化器（伪代码）：
function serialize200(data) {
  return `{"id":${JSON.stringify(data.id)},"name":${JSON.stringify(data.name)}}`;
  // 直接字符串拼接，不用 JSON.stringify 探测类型，快 2-3 倍
}
```

- **字符串拼接代替 JSON.stringify**：编译后的序列化器直接按声明结构拼接 JSON 字符串，省去了 `JSON.stringify` 运行时的类型探测、循环引用检测等开销。
- **多余字段自动丢弃**：handler 返回的对象即使有 schema 没声明的字段（如密码），序列化时也不输出——安全特性。
- **多个状态码各自编译**：`response.200`、`response.404`、`response.500` 各编译一个序列化器，按 reply 实际的状态码选用。

## 四、pino：内建高性能日志

```js
const app = Fastify({ logger: true }); // 开启 pino

app.get("/users/:id", async (request, reply) => {
  request.log.info({ id: request.params.id }, "fetching user"); // 带请求上下文
  const user = await db.find(request.params.id);
  return user;
});

// 输出（结构化 JSON）：
// {"level":30,"time":1722...,"reqId":42,"id":"123","msg":"fetching user"}
// {"level":30,"time":1722...,"reqId":42,"responseTime":12.3,"msg":"request completed"}
```

- **pino 是 Node 最快日志库**：异步、流式、零分配设计，比 winston/bunyan 快 3-10 倍。
- **请求自动带 ID**：每个请求自动分配 `reqId`，所有日志都带这个 ID，方便追踪一个请求的完整链路。
- **请求开始/结束自动日志**：Fastify 自动记录请求到达和完成（含 responseTime），不用手写。
- **生产配置**：`logger: { level: 'info', transport: { target: 'pino-pretty' } }`（开发期美化）或直接输出 JSON（生产期接 ELK/Loki）。

## 五、基准数据

| 场景 | Express | Fastify | 倍数 |
| --- | --- | --- | --- |
| 简单 JSON 响应 | ~30000 req/s | ~70000-90000 req/s | ~2.5-3x |
| 带参数校验 | ~20000 req/s | ~60000 req/s | ~3x |
| 带序列化（response schema） | ~25000 req/s | ~75000 req/s | ~3x |

- **数据来源**：Fastify 官方 benchmarks + 社区基准（具体数字随硬件/Node 版本变化，但倍数关系稳定）。
- **差距在高 QPS 更明显**：低 QPS（几百 req/s）时两者都能扛，差距不显著；API 网关、高频查询等万级 QPS 场景，Fastify 的性能优势转化为显著的成本节约（更少机器）。

## 六、TypeScript 一等公民

```ts
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

const app: FastifyInstance = Fastify();

interface UserBody {
  name: string;
  email: string;
  age?: number;
}

app.post<{ Body: UserBody }>("/users", {
  schema: {
    body: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        age: { type: "integer" },
      },
      required: ["name", "email"],
    },
  },
  async handler(request, reply) {
    request.body.name; // 类型推断为 string，TS 不报错
    const user = await create(request.body); // UserBody 类型传入
    return user;
  },
});
```

- **泛型约束**：`app.post<Body, Querystring, Params, Headers>` 精确约束路由的输入类型，`request.body/params/query` 都有正确类型推断。
- **Schema 与类型的双份维护问题**：上面例子 `UserBody` 类型 和 `schema.body` 是两份——维护时易不同步。解法见下：TypeBox。

## 七、Schema 类型生成：写一份即可

为避免 schema（运行时校验）和 TS 类型（编译期类型）双份维护，Fastify 生态有几个方案：

### 方案一：TypeBox（Schema 即类型）

```ts
import { Type, Static } from "@sinclair/typebox";
import { TypeBoxProvider } from "@fastify/type-provider-typebox";

const app = Fastify().withTypeProvider<TypeBoxProvider>();

const UserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: "email" }),
  age: Type.Optional(Type.Integer()),
});

type User = Static<typeof UserSchema>; // 类型自动从 Schema 推断

app.post("/users", {
  schema: { body: UserSchema },
  async handler(request) {
    request.body; // 类型是 User，自动推断
    return createUser(request.body);
  },
});
```

- **一份 Schema 两用**：TypeBox 的 Schema 既是运行时校验契约（传给 Fastify/Ajv），又是 TS 类型来源（Static 推断）——彻底消除双份维护。

### 方案二：jsonSchemaToTypescript

- 把 JSON Schema 用工具转成 `.d.ts` 类型文件，build 时生成。

### 方案三：zod-to-json-schema

- 用 Zod 写 schema（前端常用），转成 JSON Schema 给 Fastify。

## 八、何时选 Fastify

- **高 QPS API 服务**：性能优势转化为成本节约
- **Schema 强约束项目**：喜欢契约驱动、自动校验
- **TypeScript 项目**：开箱即用 TS + TypeBox 类型生成
- **企业级 Node 后端**：插件封装模式适合模块化
- **何时不用**：①要跨运行时（边缘）→ Hono；②重 Express 生态依赖、CRUD 后台 → Express；③要企业级架构（DI/装饰器）→ NestJS（可切 Fastify adapter）

## 下一步

理解了 Fastify 的性能细节与 TS 支持后，建议看[Express](../../express/)（对比基线）与[Hono](../../hono/)（边缘跨运行时派），形成 Node 后端框架的完整三角认知。
