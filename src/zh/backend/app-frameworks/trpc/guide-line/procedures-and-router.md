---
layout: doc
outline: [2, 3]
---

# Procedure 与 Router：输入校验、中间件与上下文

> 基于 tRPC v11 · 核于 2026-08

## 速查

- **procedure 的完整链路**：`t.procedure.use(middleware).input(zodSchema).query(handler)`。`.use()` 挂中间件（鉴权/日志/上下文增强），`.input()` 声明参数 schema（Zod），`.query()/.mutation()/.subscription()` 定义最终执行体。链式调用顺序：中间件 → input 校验 → handler。
- **`.input(zodSchema)` 双重职责**：①**运行时校验**——请求参数不合法时自动拒绝，返回 400 + 详细错误；②**类型推导**——handler 的 `input` 参数与前端调用处的参数类型，都从 Zod schema 推断出来。一份 schema，运行时与编译时都管。
- **query vs mutation**：query 是读（GET 语义，幂等，可缓存）；mutation 是写（POST 语义，改变状态）。前端 React 适配器把 query 映射成 `useQuery`、mutation 映射成 `useMutation`，缓存策略不同。
- **router 组织**：`t.router({ name: subRouter })` 嵌套成树，路径即类型（`trpc.user.list`）。用 `mergeRouters` 合并多个 router。
- **context（ctx）**：`createContext` 在每请求构造，注入用户/DB/日志。procedure handler 通过 `ctx` 访问——是依赖注入与鉴权的统一入口。
- **中间件（middleware）**：`t.middleware(({ ctx, next }) => { ...; return next({ ctx: { ...ctx, user } }) })`。可拦截请求、增强 ctx、提前抛错（鉴权失败）。常用来封装 `publicProcedure` / `protectedProcedure`。
- **publicProcedure vs protectedProcedure 惯例**：基于同一个 `t`，用中间件封装出"公开"与"需登录"两种 procedure 工厂，业务代码按需选用——这是 tRPC 鉴权的标准模式。
- **错误处理**：抛 `TRPCError({ code, message })`，code 是枚举（BAD_REQUEST/UNAUTHORIZED/FORBIDDEN/NOT_FOUND/TIMEOUT/INTERNAL_SERVER_ERROR 等），前端收到结构化错误。不要抛原生 Error（丢失 code 信息）。
- **`.output(zodSchema)`**：可选，校验 handler 返回值（防手抖返回错误结构），同时给前端更精确的返回类型。少用（input 通常足够），但对公共 API 有价值。
- **meta**：procedure/router 可挂 `t.meta` 元数据（如所需权限角色），中间件里用 `ctx.meta` 读取——类似 NestJS 的 `@Roles()` + Guard 模式。

## 一、procedure 的完整链路

一个 procedure 的定义是一串链式调用，执行顺序固定：

```ts
const t = initTRPC.context(createContext).create();

export const protectedProcedure = t.procedure
  .use(authMiddleware)        // 1. 中间件：鉴权，增强 ctx
  .input(z.object({ id: z.string().uuid() })) // 2. input：Zod 校验 + 类型推导
  // 3. query/mutation/subscription：执行体
  .query(({ ctx, input }) => db.user.findUnique({ where: { id: input.id } }));
```

- **链式顺序**：`.use()` 可以多个（按序执行）→ `.input()` 校验参数 → `.query()` 执行体。
- **每一步都能增强或拦截**：中间件可以改 ctx（注入 user），可以提前 `throw`（鉴权失败），可以记录耗时。

## 二、input 与 Zod：一份 schema 双管齐下

```ts
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "名字至少 2 字符"),
  email: z.string().email("邮箱格式错误"),
  age: z.number().int().min(0).max(150),
  roles: z.array(z.enum(["admin", "user"])).optional(),
});

createUser: t.procedure.input(createUserSchema).mutation(({ input }) => {
  // input 类型自动推断：{ name: string; email: string; age: number; roles?: ("admin"|"user")[] }
  return db.user.create({ data: input });
}),
```

- **运行时校验**：请求参数不符合 schema（如 age=-1、email 缺失），tRPC 自动拒绝，返回 400 + Zod 的详细字段错误（前端能据此渲染表单错误）。
- **类型推导**：handler 的 `input` 参数类型从 Zod schema 推断，**前端调用处的参数类型也同步**——前端传错（少字段/类型错）TS 编译报错。
- **`z.infer<typeof schema>`**：需要单独拿类型时用 `z.infer` 把 Zod schema 转成 TS 类型。
- **Zod 是事实标准**：tRPC 社区与文档全面采用 Zod（也支持 valibot/ArkType 等通过适配器，但 Zod 最主流）。

## 三、context：依赖注入与鉴权入口

```ts
// createContext：每次请求构造
async function createContext({ req }: { req: IncomingMessage }) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  let user: User | null = null;
  if (token) {
    try { user = await verifyJwt(token); } catch {}
  }
  return { user, db, redis }; // 注入到所有 procedure 的 ctx
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

// procedure 里用 ctx
me: t.procedure.query(({ ctx }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return ctx.user;
}),
```

- **每请求构造**：createContext 在每个请求开始时执行一次，注入到该请求所有 procedure。
- **统一依赖入口**：用户、DB、缓存、日志都放 ctx，handler 不直接 require 全局对象——易于测试（mock ctx）与解耦。
- **类型安全**：`initTRPC.context<Context>()` 把 ctx 类型贯穿到所有 procedure，handler 里 `ctx.user` 有类型。

## 四、中间件与 publicProcedure/protectedProcedure

中间件是 tRPC 鉴权与横切的标准武器：

```ts
const t = initTRPC.context(createContext).create();

// 鉴权中间件
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } }); // 增强 ctx：确保有 user
});

// 两种 procedure 工厂
export const publicProcedure = t.procedure;             // 公开，无需登录
export const protectedProcedure = t.procedure.use(isAuthed); // 需登录

// 业务 router 按需选用
export const appRouter = t.router({
  health: publicProcedure.query(() => "ok"),           // 公开
  me: protectedProcedure.query(({ ctx }) => ctx.user),  // 需登录
  deleteUser: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => db.user.delete(...)),
});
```

- **惯例模式**：基于一个 `t`，用中间件封装出 `publicProcedure` 与 `protectedProcedure`，业务 router 按需选用——**把鉴权从 handler 抽到中间件**，单一职责。
- **中间件可叠加**：`.use(logMiddleware).use(rateLimitMiddleware).use(isAuthed)`，按序执行。
- **ctx 增强**：中间件 `next({ ctx: { ...ctx, user } })` 返回增强后的 ctx，后续中间件与 handler 拿到的是增强版。

## 五、meta：过程级元数据（角色权限）

类似 NestJS 的 `@Roles()` + Guard：

```ts
// 定义 meta 类型
type Meta = { requiredRole?: "admin" | "user" };
const t = initTRPC.context(createContext).meta<Meta>().create();

// 权限中间件读 meta
const hasRole = t.middleware(({ ctx, next, meta }) => {
  if (meta?.requiredRole && ctx.user?.role !== meta.requiredRole) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// 用法：procedure 声明所需角色
deleteUser: protectedProcedure
  .meta({ requiredRole: "admin" })
  .use(hasRole)
  .input(z.string())
  .mutation(({ input }) => db.user.delete(...)),
```

- **`.meta<Meta>()`**：给 procedure/router 挂类型化的元数据，中间件里 `meta` 参数读取——声明式权限。
- **类型安全**：meta 是泛型，TS 校验 meta 字段合法性。

## 六、错误处理：TRPCError

```ts
import { TRPCError } from "@trpc/server";

getUser: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
  const user = db.user.findUnique({ where: { id: input } });
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
  if (user.orgId !== ctx.user.orgId)
    throw new TRPCError({ code: "FORBIDDEN", message: "无权访问" });
  return user;
}),
```

- **code 枚举**：`PARSE_ERROR` / `BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `TIMEOUT` / `CONFLICT` / `INTERNAL_SERVER_ERROR` 等，映射到 HTTP 状态码（如 UNAUTHORIZED→401、FORBIDDEN→403）。
- **结构化错误**：前端收到 `{ error: { code, message, data: { zodError } } }`，可按 code 分支处理（401 跳登录、422 渲染表单错误）。
- **不要抛原生 Error**：`throw new Error('x')` 会丢失 code，tRPC 把它当 INTERNAL_SERVER_ERROR（500），前端拿不到语义。
- **错误格式化器**：`initTRPC.create({ errorFormatter({ shape, error }) { ... } })` 可自定义错误体（如统一加 `code` 字段）。

## 七、router 合并与组织

```ts
import { initTRPC, mergeRouters } from "@trpc/server";

const userRouter = t.router({ list, getById, create });
const postRouter = t.router({ list, publish });

// 方式一：根 router 嵌套（推荐，路径命名空间）
export const appRouter = t.router({ user: userRouter, post: postRouter });
// 前端：trpc.user.list / trpc.post.publish

// 方式二：mergeRouters 扁平合并（少用，无命名空间）
export const flatRouter = mergeRouters(userRouter, postRouter);
```

- **嵌套 router**（推荐）：形成 `trpc.user.*` / `trpc.post.*` 命名空间，路径清晰。
- **大型项目**：每个领域一个 router 文件，根 router 聚合——类似 NestJS 的模块组织。

## 八、subscription（实时）

```ts
import { observable } from "@trpc/server/observable";

onMessage: t.procedure.subscription(({ ctx }) => {
  return observable<Message>((emit) => {
    const sub = ctx.redis.subscribe("messages", (msg) => emit.next(msg));
    return () => sub.unsubscribe();
  });
}),
```

- **基于 observable**：subscription 返回 RxJS 风格 observable，推送数据到前端。
- **传输**：需 WebSocket 适配器（`@trpc/server` adatper-ws / `wsLink`）。**v11 起可用 SSE/WebRTC 替代**，部分场景不必上 WebSocket。
- **替代方案**：对纯推送场景，现代项目也直接用 Server-Sent Events 或 React Server Components 的流式渲染，subscription 用得在减少。

## 下一步

procedure 与 router 是 tRPC 的骨架，下一站进入[对比与集成](./comparison-and-integration)——tRPC vs REST vs GraphQL vs NestJS 的选型，TanStack Query 集成的缓存/失效，React Server Components 与 v11 的新范式。
