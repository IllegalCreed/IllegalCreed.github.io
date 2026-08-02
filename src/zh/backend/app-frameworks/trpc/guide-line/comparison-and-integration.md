---
layout: doc
outline: [2, 3]
---

# 对比与集成：REST/GraphQL/NestJS 与 TanStack Query

> 基于 tRPC v11 · 核于 2026-08

## 速查

- **vs REST**：tRPC 类型安全零 codegen（REST 要 OpenAPI 才有类型，手写易脱节）；但 REST 是语言无关的标准协议（任意客户端可消费），tRPC 强绑定 TS。tRPC 是 procedure-based（动词），REST 是 resource-based（名词）。
- **vs GraphQL**：tRPC 无 schema 文件、无 codegen、无 resolver 模板（GraphQL 都要）；但 GraphQL 有 introspection（运行时自省 API）、语言无关、生态更成熟（网关/限流/缓存标准化）。tRPC 适合 TS 全栈，GraphQL 适合多客户端/开放 API。
- **vs NestJS**：NestJS 是企业级应用框架（DI/模块/管线/生态），类型在 HTTP 边界断；tRPC 是类型安全 RPC 层，类型端到端。二者可**共存**——NestJS 做后端架构，tRPC 做前后端类型契约（Nest 可暴露 tRPC 端点）。本质不同层：NestJS 管"如何组织后端"，tRPC 管"前后端如何类型安全通信"。
- **TanStack Query 集成**：tRPC 的 React 适配器**底层就是 TanStack Query**。`trpc.x.list.useQuery()` 等价于 `useQuery({ queryKey, queryFn })`，缓存/重试/失效/乐观更新开箱即用。mutation 触发 query 失效用 `utils.invalidate()`。
- **批量（batching）**：tRPC 默认开 batchLink——前端多个 query 一次 HTTP 请求合并（减少往返），v11 进一步优化批处理速度。
- **SSR / RSC**：tRPC 支持 SSR（getServerSideProps 里 server-side call）；**v11 与 React Server Components 更好集成**——RSC 里可直接 `caller` 调用 procedure（不走 HTTP，纯函数调用），类型安全且零网络开销。
- **v11 关键变化**：①批处理更快；②`createTRPCClient`/链接 API 重构；③`UNSTABLE` 的 RSC 集成稳定化；④对 TanStack Query v5 的一等支持。
- **何时选 tRPC**：全栈 TS（Next/Remix/SolidStart）、内部 API（不需开放给第三方）、追求前后端类型一致与开发体验。**何时不选**：后端非 TS、需开放 API 给多语言客户端、需运行时 API 自省。

## 一、tRPC vs REST

| 维度 | REST | tRPC |
| --- | --- | --- |
| **模型** | resource-based（名词 `/users/1`） | procedure-based（动词 `user.getById`） |
| **类型安全** | 无原生支持，需 OpenAPI + codegen | **零 codegen 端到端** |
| **协议** | 标准 HTTP（GET/POST/...） | 自定义 HTTP+JSON |
| **语言无关** | ✅ 任意客户端可消费 | ❌ 强绑定 TS |
| **缓存** | HTTP 缓存语义成熟（ETag/Cache-Control） | 靠 TanStack Query 客户端缓存 |
| **工具链** | Swagger/OpenAPI、网关、限流标准化 | 较窄，自建多 |
| **适用** | 开放 API、多客户端、微服务 | TS 全栈内部应用 |

- **REST 的优势**：标准、语言无关、HTTP 工具链（CDN 缓存、网关、限流）开箱即用，适合开放给第三方的公共 API。
- **tRPC 的优势**：前后端类型同步零摩擦，开发体验碾压，适合 TS 全栈内部应用。
- **本质**：REST 是**协议**，tRPC 是**TS 专属的强类型通信方案**——选型取决于是否需要语言无关与开放。

## 二、tRPC vs GraphQL

| 维度 | GraphQL | tRPC |
| --- | --- | --- |
| **schema** | 独立 `.graphql` schema 文件 | 无独立 schema，类型即代码 |
| **codegen** | 需 `graphql-codegen` 生成前端类型 | **零 codegen**，编译期推断 |
| **resolver** | 写 resolver 函数映射字段 | procedure 即函数，无 resolver 层 |
| **introspection** | ✅ 运行时自省可用 API | ❌ 无（前端须编译期知道 router） |
| **语言无关** | ✅ 任意客户端 | ❌ 强绑定 TS |
| **查询灵活性** | 客户端按需选字段（避免 over-fetching） | 返回固定结构（除非手写变换） |
| **生态** | 网关/Apollo/缓存标准化 | 较窄 |
| **适用** | 多客户端、开放 API、复杂查询 | TS 全栈、内部应用、追求简单 |

- **GraphQL 的优势**：语言无关、introspection（前端可动态发现 API）、客户端按需选字段（移动端省流量）、生态成熟（Apollo 网关/缓存/订阅）。
- **tRPC 的优势**：无 schema/codegen/resolver 模板，开发更轻；TS 全栈类型最严丝合缝。
- **常见误判**：以为 GraphQL 比 tRPC 更类型安全——其实 tRPC 在 TS 全栈下类型同样强（甚至更紧，因为无 schema 与 resolver 脱节问题），只是牺牲了语言无关与自省。

## 三、tRPC vs NestJS（不同层，可共存）

| 维度 | NestJS | tRPC |
| --- | --- | --- |
| **定位** | 企业级应用框架（后端架构） | 类型安全 RPC（前后端通信契约） |
| **核心** | DI 容器、模块、装饰器、管线 | procedure、router、端到端类型 |
| **类型边界** | HTTP 边界类型断（前端拿不到） | **端到端类型贯通** |
| **底层 HTTP** | 自己用 Express/Fastify 暴露端点 | 自己暴露端点（可挂任何 HTTP 服务） |
| **可共存** | ✅ Nest 后端 + tRPC 端点 | ✅ tRPC 挂在 Nest/Next 上 |

- **不同层**：NestJS 解决"如何组织大型后端"（分层/DI/可测试），tRPC 解决"前后端如何类型安全通信"。二者不是竞品。
- **共存模式**：NestJS 做后端架构与业务逻辑，通过 tRPC 暴露类型安全的端点给前端——大型 TS 全栈项目的强组合。
- **选型**：纯全栈 TS 小中型项目，tRPC 直接挂在 Next/Node 上即可，不必上 NestJS 的重架构；大型企业系统需 DI/分层，NestJS + tRPC 都用。

## 四、TanStack Query 集成：缓存与失效

tRPC 的 React 适配器底层就是 TanStack Query（React Query v5）：

```ts
// 配置
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";

export const trpc = createTRPCReact<AppRouter>();
const queryClient = new QueryClient();

// 入口 Provider
<TRPCProvider queryClient={queryClient} client={trpcClient}>
  <App />
</TRPCProvider>

// 组件里：query
const { data, isLoading } = trpc.user.list.useQuery(); // 等价 useQuery

// mutation + 失效
const utils = trpc.useUtils();
const mut = trpc.user.create.useMutation({
  onSuccess: () => utils.user.list.invalidate(), // 创建后刷新列表
});
```

- **等价关系**：`trpc.user.list.useQuery()` ≈ `useQuery({ queryKey: ['user.list'], queryFn: () => client.user.list.query() })`——tRPC 帮你省掉手写 queryKey 与 queryFn。
- **缓存特性**：stale-while-revalidate、自动重试、window focus 重取、乐观更新、SSR hydration——全部继承自 TanStack Query。
- **失效**：`useUtils().user.list.invalidate()` 让指定 query 失效重新拉取（mutation 后刷新数据的标准手法）。
- **乐观更新**：`useMutation({ onMutate: async (newUser) => { await utils.user.list.cancel(); utils.user.list.setData(undefined, (old) => [...old, newUser]); } })`。

## 五、批处理（batching）与传输

```ts
// 客户端默认开 batchLink
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: "/api/trpc", maxURLLength: 2083 }),
  ],
});

// 前端并发调多个 query：
const a = trpc.user.list.useQuery();
const b = trpc.post.list.useQuery();
// → 一次 HTTP 请求合并两个 query，减少往返（v11 优化了批处理速度）
```

- **batchLink**：多个 query 合并成一次 HTTP 请求（POST `/api/trpc` 带 body 列表，或 GET 长URL）。减少网络往返，首屏多查询场景明显加速。
- **httpLink**：不批处理，一请求一 procedure。
- **WS/SSE link**：用于 subscription 或实时。
- **links 链**：tRPC 的 links 是一个**链**（类似中间件），可组合（如 loggerLink → httpBatchLink），做日志/重试/降级。

## 六、SSR 与 React Server Components

**SSR（getServerSideProps / loaders）**：

```ts
// 服务端直接调 procedure（helpers 模式，类型安全）
export async function getServerSideProps() {
  const ssg = await createServerSideHelpers({ router: appRouter, ctx: {...} });
  await ssg.user.list.prefetch(); // 服务端预取并缓存
  return { props: { trpcState: ssg.dehydrate() } }; // 脱水传给客户端 hydrate
}
```

**React Server Components（v11）**：

```ts
// RSC 里直接用 caller，不走 HTTP，纯函数调用
import { appRouter } from "@/server/router";

async function ServerComponent() {
  // 直接调用 procedure（server 端，零网络开销，类型安全）
  const users = await appRouter.createCaller({ user: null }).user.list();
  return <UserList users={users} />;
}
```

- **SSR helpers**：`createServerSideHelpers` 在服务端预取数据，脱水（dehydrate）传给客户端 TanStack Query hydrate，避免客户端二次请求。
- **RSC caller**：v11 与 RSC 深度集成，Server Component 里用 `createCaller` 直接调 procedure（纯函数，无 HTTP），是 Next.js App Router 的推荐模式。
- **类型仍贯通**：无论 SSR 还是 RSC，procedure 的类型都端到端安全。

## 七、v11 关键变化

| 变化 | v10 | v11 |
| --- | --- | --- |
| **批处理** | 基础 | 更快（优化序列化与合并） |
| **createTRPCClient** | 旧链接 API | 重构（更清晰的 links 链） |
| **TanStack Query** | v4 | **v5** 一等支持 |
| **RSC 集成** | UNSTABLE | 稳定化（`createCaller` 模式） |
| **subscription** | WebSocket 为主 | SSE/WebRTC 适配器可选 |

- **迁移**：从 v10 到 v11 主要是链接 API 调整与 TanStack Query v5 对齐，大多数 procedure/router 代码不变。
- **新项目**：直接用 v11 + TanStack Query v5 + Next.js App Router（RSC）。

## 八、何时选 tRPC（决策表）

| 场景 | 选 tRPC？ | 原因 |
| --- | --- | --- |
| Next.js/Remix 全栈 TS 内部应用 | ✅ | 类型零摩擦，开发体验最佳 |
| 大型企业 TS 系统（前后端分离） | ✅（可配 NestJS） | 端到端类型，NestJS 管架构 |
| 后端是 Go/Java/Python | ❌ | 无共享 TS 类型，tRPC 失效 |
| 开放给第三方/多语言客户端的公共 API | ❌ | 用 REST/GraphQL（语言无关） |
| 需要运行时 API 自省 | ❌ | GraphQL 有 introspection，tRPC 无 |
| 移动端（Swift/Kotlin）为主 | ❌ | 非 TS 客户端，用 REST/GraphQL |
| 追求前端按需选字段（省流量） | ❌ | GraphQL 更合适 |

## 下一步

对比与集成讲完后，建议进入[参考](./reference)速查 procedure/router 模式与易错点；横向深入看 [NestJS](../../nestjs/)（企业级 DI 派）与 [Express](../../express/)（中间件派）。
