---
layout: doc
outline: [2, 3]
---

# 入门：tRPC、端到端类型安全与 procedure

> 基于 tRPC v11 · 核于 2026-08

## 速查

- **tRPC 是什么**：TypeScript 全栈应用的**端到端类型安全 RPC 框架**（2020 年 Alex Johansson 创建），**无 codegen** 即可让前后端共享类型——后端定义 procedure，前端调用时自动获得精确的输入/返回类型。GitHub 约 35k stars。
- **核心卖点**：①**零 codegen**——类型从后端代码编译期直接推断到前端，无需 GraphQL 的 schema 生成流程；②**运行时校验内建**——Zod schema 同时管校验与类型推导；③**重构即时报错**——改后端，前端编译期立刻报错。
- **procedure（过程）**：后端一个可远程调用的函数。`t.procedure.input(zodSchema).query(handler)`（读，GET 语义）或 `.mutation(handler)`（写，POST 语义），`.subscription`（流/实时，v11 起可由适配器替代）。handler 拿到 `input` 与 `ctx`。
- **router（路由）**：`t.router({ user: userRouter, post: postRouter })` 把 procedure 组织成树。前端用 `trpc.user.list.query()` 这种**点号路径**访问，路径即类型。
- **context（上下文）**：`createContext` 在**每次请求**时构造（注入登录用户、数据库连接等），procedure handler 通过 `ctx` 访问——是依赖注入与鉴权的统一入口。
- **端到端类型推断原理**：前端 `createTRPCReact<AppRouter>()` 把后端 router 的**类型**（仅类型，不含运行时）导入，靠 TypeScript 的**条件类型 + infer** 把每个 procedure 的 input/output 类型映射到前端调用方法上——所以前端调用时参数与返回值全类型安全。
- **传输**：默认 HTTP+JSON（`fetchHTTPClient`），请求体是 `{ json }` 包裹，URL 是 `/trpc/user.list`。不是标准 REST，也不是 GraphQL。
- **TanStack Query 集成**：tRPC 的 React 适配器**底层就是 TanStack Query**，`useQuery`/`useMutation` 的缓存、重试、失效、乐观更新开箱即用，配合 SSR。
- **v11（2024）**：更快的链接（batchLink 优化）、`createTRPCClient` 重构、与 React Server Components 更好集成（Server 端可直接调 procedure）。
- **最大限制**：**强绑定 TypeScript 全栈**——前后端都必须是 TS。后端是 Go/Java/Python，或前端是原生 JS/其他语言，tRPC 不适用（这是它与 REST/GraphQL 的根本分野）。
- **进阶顺序**：[Procedure 与 Router](./guide-line/procedures-and-router) → [对比与集成](./guide-line/comparison-and-integration) → [参考](./reference)。

## 一、tRPC 是什么：端到端类型，零 codegen

先看传统全栈的痛点。REST 方案里前后端类型是脱节的：

```
后端（TS）                      前端（TS）
interface User { ... }          // 手写或 OpenAPI codegen 生成
                                interface User { ... }   ← 易与后端不同步
GET /users → res.json(users)    fetch('/users').then(r => r.json() as User[])  ← as 断言，不安全
```

GraphQL 用 codegen 弥补：后端写 `.graphql` schema，运行 `graphql-codegen` 生成前端类型——但多了一步生成流程，且 schema 与 resolver 类型仍可能不一致。

tRPC 的解法是**让前端直接导入后端的类型**，编译期推断，零 codegen：

```
后端（server/routers.ts）        前端（client）
export const appRouter = t.router({ import type { appRouter } from '../server/routers'
  user: t.router({               const trpc = createTRPCReact<appRouter>()
    list: t.procedure            // 调用时全类型安全：
      .query(() => users),       trpc.user.list.useQuery()  // 返回 User[]，自动推断
  }),                            trpc.user.create.useMutation({ ... })
});                              // input 自动校验，参数错了编译报错
```

- **类型即代码**：后端 procedure 的 input/output 类型就是后端 TS 代码的类型，前端导入这个类型即可——没有独立的 schema 文件需要同步。
- **重构零摩擦**：后端改了 `list` 的返回值结构，前端所有调用点编译期立刻报错——这是 tRPC 最让人上瘾的特性。

## 二、最小全栈示例

后端（Express/Next API route/Nest 均可承载）：

```ts
// server/trpc.ts
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create(); // 创建 tRPC 实例

// 定义 procedure + router
export const appRouter = t.router({
  // query：读（GET 语义）
  greeting: t.procedure
    .input(z.object({ name: z.string() })) // Zod 校验 + 类型推导
    .query(({ input }) => `Hello ${input.name}`), // 返回 string

  // mutation：写（POST 语义）
  createUser: t.procedure
    .input(z.object({ name: z.string(), age: z.number().min(0) }))
    .mutation(({ input }) => {
      const user = { id: Date.now(), ...input };
      db.users.push(user);
      return user; // 返回 User 类型
    }),
});

export type AppRouter = typeof appRouter; // ★ 只导出类型
```

前端（React）：

```ts
// client/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/trpc"; // 只导入类型

export const trpc = createTRPCReact<AppRouter>();

// 组件里用
function Greeting({ name }: { name: string }) {
  const { data } = trpc.greeting.useQuery({ name }); // data: string | undefined
  return <p>{data}</p>;
}

function CreateUser() {
  const mut = trpc.createUser.useMutation();
  return (
    <button onClick={() => mut.mutate({ name: "Ada", age: 30 })}>
      创建
    </button>
  ); // 参数错了 TS 编译报错
}
```

- **后端只导出类型**：`export type AppRouter`，运行时的 router 不打包进前端——前端只拿类型信息做推断。
- **前端调用即类型安全**：`trpc.greeting.useQuery({ name })` 的参数类型与返回值类型，全部从后端 procedure 推断。

## 三、procedure：query 与 mutation

procedure 是 tRPC 的基本单元，分三类：

```ts
const t = initTRPC.create();

// 1. query：读操作（GET 语义），幂等，可缓存
const getUser = t.procedure.input(z.object({ id: z.string() })).query(({ input }) =>
  db.user.findUnique({ where: { id: input.id } }),
);

// 2. mutation：写操作（POST 语义），改变状态
const deleteUser = t.procedure.input(z.string()).mutation(({ input }) =>
  db.user.delete({ where: { id: input } }),
);

// 3. subscription：流/实时（WebSocket，v11 起可由 SSE/WebRTC 适配器替代）
const onMessage = t.procedure.subscription(() => messageStream);
```

| 类型 | HTTP 语义 | 用途 | 缓存 |
| --- | --- | --- | --- |
| **query** | GET | 读取数据 | 可（TanStack Query 缓存） |
| **mutation** | POST/PUT/DELETE | 写入/修改 | 默认不缓存，常触发 query 失效 |
| **subscription** | WebSocket/SSE | 实时推送 | 流式 |

- **`.input(zodSchema)`**：声明参数 schema，**Zod 同时做运行时校验和 TS 类型推导**。input 不合法，后端自动拒绝并返回校验错误（前端类型也错）。
- **handler 收到 `{ ctx, input, type }`**：`input` 是校验后的参数，`ctx` 是上下文（鉴权用户/DB），`type` 是 'query'|'mutation'|'subscription'。

## 四、router：procedure 的树

router 把 procedure 组织成嵌套树，前端用点号路径访问：

```ts
// 业务 router
const userRouter = t.router({
  list: t.procedure.query(() => db.users),
  getById: t.procedure.input(z.string()).query(({ input }) => ...),
  create: t.procedure.input(createUserSchema).mutation(({ input }) => ...),
});

const postRouter = t.router({
  list: t.procedure.query(() => db.posts),
  publish: t.procedure.input(z.string()).mutation(({ input }) => ...),
});

// 合并成根 router
export const appRouter = t.router({
  user: userRouter,
  post: postRouter,
});
// 前端：trpc.user.list.query() / trpc.post.publish.mutate(id)
```

- **路径即类型**：`trpc.user.list` 这个点号路径同时是运行时调用路径和编译期类型路径——TypeScript 在每一步点号上做类型检查，路径错了编译报错。
- **合并 router**：用 `t.router({ a, b })` 把多个子 router 合并，形成命名空间（user.* / post.*）。

## 五、context：每请求的依赖与鉴权

```ts
// createContext：每次请求时调用
export async function createContext({ req, res }) {
  const token = req.headers.authorization;
  const user = token ? await verifyUser(token) : null;
  return { user, db }; // 注入到每个 procedure 的 ctx
}

const t = initTRPC.context(createContext).create();

// procedure 里用 ctx 鉴权
const userRouter = t.router({
  me: t.procedure.query(({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return ctx.user;
  }),
});
```

- **统一入口**：登录用户、数据库连接、日志、配置都放进 ctx，procedure 通过 `ctx` 访问——这是 tRPC 的"依赖注入"方式。
- **每请求构造**：createContext 在每个请求开始时调用一次，注入到该请求所有 procedure。
- **鉴权**：在 procedure 里检查 `ctx.user`，或用**中间件**（`t.middleware`）封装成 `protectedProcedure`，统一拦截未登录请求。

## 六、最大限制：强绑定 TypeScript 全栈

tRPC 的端到端类型推断**依赖前后端共享 TS 类型**：

- ✅ 适合：Next.js / Remix / SolidStart / SvelteKit 等**全栈 TS 项目**，前后端同仓库或同 monorepo。
- ❌ 不适合：后端是 Go/Java/Python/Rust，或前端是原生 JS/Swift/Kotlin——没有共享 TS 类型的基础，tRPC 无法推断类型，失去核心价值。
- ❌ 第三方非 TS 客户端难以消费：tRPC 用自定义 HTTP+JSON 格式，不是标准 REST/GraphQL，非 TS 客户端要手写请求，没有自动类型与工具。

这是 tRPC 与 REST/GraphQL 的**根本分野**：REST/GraphQL 是**语言无关**的协议，tRPC 是**TS 专属**的强类型方案。

## 下一步

理解了 tRPC 的端到端类型推断、procedure（query/mutation）、router、context 后，下一步深入[Procedure 与 Router](./guide-line/procedures-and-router)（input/zod、中间件链、错误处理）与[对比与集成](./guide-line/comparison-and-integration)（vs REST/GraphQL/NestJS、TanStack Query 集成、v11 与 RSC）。
