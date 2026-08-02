---
layout: doc
outline: [2, 3]
---

# 参考：procedure 模式、对比与易错点速查

> 基于 tRPC v11 · 核于 2026-08

## 速查

- **tRPC 定义**：TS 全栈端到端类型安全 RPC 框架，零 codegen，前后端共享类型。
- **核心单元**：procedure（query/mutation/subscription），input 用 Zod 校验 + 推导类型。
- **组织**：router 嵌套成树，路径即类型（`trpc.user.list`）。
- **依赖注入**：context（每请求构造），注入用户/DB；中间件封装 publicProcedure/protectedProcedure。
- **集成**：React 适配器底层是 TanStack Query（缓存/失效/乐观更新）；v11 支持 RSC 的 caller 模式。
- **限制**：强绑定 TS 全栈，非 TS 后端/客户端不适用；无 introspection。

## 一、procedure 类型与 API 速查

| API | 用途 | 示例 |
| --- | --- | --- |
| `t.procedure` | 创建过程（公开） | `t.procedure.query(...)` |
| `.use(mw)` | 挂中间件（鉴权/日志） | `.use(isAuthed)` |
| `.input(zodSchema)` | 参数校验 + 类型推导 | `.input(z.object({ id: z.string() }))` |
| `.output(zodSchema)` | 返回值校验（可选） | `.output(userSchema)` |
| `.meta({...})` | 挂元数据（角色等） | `.meta({ requiredRole: 'admin' })` |
| `.query(handler)` | 读（GET 语义） | `.query(({ ctx, input }) => ...)` |
| `.mutation(handler)` | 写（POST 语义） | `.mutation(({ ctx, input }) => ...)` |
| `.subscription(handler)` | 实时（observable） | `.subscription(({ ctx }) => observable(...))` |

## 二、router 组织模式

| 模式 | 写法 | 前端访问 |
| --- | --- | --- |
| **嵌套 router**（推荐） | `t.router({ user: userRouter, post: postRouter })` | `trpc.user.list` / `trpc.post.publish` |
| **mergeRouters** | `mergeRouters(a, b)` | 扁平，无命名空间（少用） |
| **procedure** | `t.router({ list: t.procedure.query(...) })` | `trpc.list` |

- **大型项目惯例**：每领域一个 router 文件（userRouter/postRouter），根 router 聚合，前端按命名空间访问。

## 三、鉴权与 procedure 工厂模式

```ts
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```

| 工厂 | 用途 |
| --- | --- |
| `publicProcedure` | 无需登录（如 health、登录接口本身） |
| `protectedProcedure` | 需登录 |
| `adminProcedure` | 需 admin 角色（`protectedProcedure.use(isAdmin)`） |

## 四、TRPCError code 映射

| code | HTTP | 含义 |
| --- | --- | --- |
| `PARSE_ERROR` | 400 | 请求体解析失败 |
| `BAD_REQUEST` | 400 | 参数校验失败（Zod 拒绝） |
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `TIMEOUT` | 408 | 超时 |
| `CONFLICT` | 409 | 冲突（如重复创建） |
| `INTERNAL_SERVER_ERROR` | 500 | 服务端异常（含未捕获错误） |

- **惯例**：抛 `TRPCError({ code, message })`，不要抛原生 Error（丢失 code，被当 500）。

## 五、与 REST / GraphQL / NestJS 对照

| 维度 | REST | GraphQL | tRPC | NestJS |
| --- | --- | --- | --- | --- |
| **模型** | resource（名词） | schema + resolver | procedure（动词） | DI + 装饰器 |
| **类型安全** | OpenAPI+codegen | schema+codegen | **零 codegen 端到端** | HTTP 边界断 |
| **语言无关** | ✅ | ✅ | ❌（TS 专属） | ✅ |
| **introspection** | OpenAPI 文档 | ✅ 运行时自省 | ❌ | Swagger 文档 |
| **协议** | 标准 HTTP | 自定义 HTTP | 自定义 HTTP+JSON | 标准 HTTP |
| **定位** | 协议 | 查询语言+协议 | TS 通信契约 | 应用框架 |

- **本质**：REST/GraphQL 是协议（语言无关），tRPC 是 TS 专属强类型方案，NestJS 是应用框架（可与 tRPC 共存）。

## 六、易错点清单

- **"tRPC 是语言无关的协议"**：错。tRPC 强绑定 TypeScript 全栈，前后端都必须是 TS，非 TS 后端/客户端不适用——这是它与 REST/GraphQL 的根本分野。
- **"tRPC 需要 codegen"**：错。tRPC 的核心卖点就是零 codegen——前端导入后端 router 的**类型**（仅类型，不含运行时），靠 TS 条件类型推断。GraphQL 才需要 codegen。
- **"前端把整个 router 运行时打包进去了"**：错。`import type { AppRouter }` 只导入类型，编译期被擦除，运行时前端不含 router 代码。
- **"input 不校验也没事"**：错。`.input(zodSchema)` 同时管运行时校验与类型推导。不写 input，handler 拿不到类型化参数，前端调用也无类型保护。
- **"mutation 也能缓存"**：错。query 映射 TanStack Query 的 useQuery（可缓存），mutation 是 useMutation（默认不缓存，触发后通常 invalidate query）。
- **"抛原生 Error 前端能拿到 code"**：错。`throw new Error()` 丢失 code，被 tRPC 当 INTERNAL_SERVER_ERROR（500）。要语义化错误必须 `throw new TRPCError({ code, message })`。
- **"tRPC 有 introspection，能运行时发现 API"**：错。tRPC 无 introspection（这是与 GraphQL 的区别），前端必须编译期知道 router 路径。
- **"tRPC 比 GraphQL 更类型安全"**：片面。TS 全栈下 tRPC 类型同样强（甚至更紧），但 GraphQL 在多语言/introspection/按需字段上有优势，不能一概而论。
- **"tRPC 和 NestJS 二选一"**：错。二者不同层：NestJS 管后端架构（DI/模块），tRPC 管前后端类型契约。大型 TS 项目可 NestJS + tRPC 共存。
- **"v10 升 v11 只改了版本号"**：错。v11 重构了 createTRPCClient/链接 API，对齐 TanStack Query v5，RSC 集成稳定化——有迁移成本。
- **"subscription 必须用 WebSocket"**：v11 起不一定。SSE/WebRTC 适配器可选，纯推送场景可不上 WebSocket。

## 七、进阶方向（链接其他叶）

- [NestJS](../../nestjs/) —— 企业级 DI 框架，可与 tRPC 共存（Nest 架构 + tRPC 端点）
- [Express](../../express/) —— tRPC 可挂在 Express/Next API route 上
- [Fastify](../../fastify/) —— tRPC 的 httpBatchLink 适配器之一
- [微服务架构] —— tRPC 主要面向前后端通信，服务间通信另见微服务章

## 权威链接

- [tRPC 官方文档](https://trpc.io/docs)
- [tRPC Quickstart](https://trpc.io/docs/quickstart)
- [tRPC Procedures](https://trpc.io/docs/procedures)
- [tRPC Context](https://trpc.io/docs/server/context)
- [tRPC Error Handling](https://trpc.io/docs/server/error-handling)
- [tRPC + TanStack Query](https://trpc.io/docs/client/react)
- [tRPC v11 升级指南](https://trpc.io/docs/migrate-from-v10-to-v11)
- 本站幻灯片：<a href="/SlideStack/trpc-slide/" target="_blank">tRPC</a>
