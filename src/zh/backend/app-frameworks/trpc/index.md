---
layout: doc
---

# tRPC

**tRPC**（TypeScript Remote Procedure Call）是 TypeScript 全栈应用上**端到端类型安全**的 RPC 框架——诞生于 2020 年（Alex Johansson），核心卖点是**无 codegen** 即可让前后端共享类型：后端用 TypeScript 定义 procedure（query/mutation），前端调用时**自动获得精确的输入参数类型与返回值类型**，重构后端时前端编译期立刻报错。与 GraphQL 需要 codegen、REST 需要手写/OpenAPI 生成类型不同，tRPC 的类型是**编译期从后端代码直接推断**到前端的，零代码生成、零运行时 schema 同步开销。它采用 **procedure-based**（而非 REST 的 resource-based）模型，用 **router** 组织一组 procedure，配合 **TanStack Query**（React Query）做缓存/重试/乐观更新，是 **Next.js / Remix 全栈 TS 项目**的黄金组合。**tRPC v11（2024）** 是最新大版本，引入了更快的链接、`createTRPCClient` 重构、与 React Server Components 更好的集成。截至 2026 年，GitHub **约 35k stars**，是 TS 全栈类型安全方案的事实标准。

tRPC 的全部考点围绕**端到端类型**与 **procedure 模型**展开：①**procedure**——后端用 `t.procedure.input(zodSchema).query(handler)` / `.mutation(handler)` 定义一个可远程调用的函数，input 用 **Zod** 做运行时校验（同时产出 TS 类型）；②**router**——`t.router({ user: userRouter, post: postRouter })` 把 procedure 组织成树，前端用 `trpc.user.list.query()` 点号路径访问；③**context**——`createContext` 在每次请求时构造上下文（如注入登录用户、数据库连接），procedure handler 通过 ctx 访问，是鉴权与依赖注入的统一入口；④**端到端类型推断**——前端 `createTRPCReact<AppRouter>()` 把后端 router 的**类型**（不是运行时）导入，调用时参数与返回值全类型安全，靠的是 TypeScript 的条件类型与 infer；⑤**与 REST/GraphQL 对比**——比 REST 类型安全（无需 OpenAPI）、比 GraphQL 简单（无需 schema/codegen/resolver），但**强绑定 TS 全栈**（后端必须是 TS、前端也必须是 TS，跨语言场景不适用）；⑥**TanStack Query 集成**——tRPC 的 React 适配器底层就是 TanStack Query，`useQuery`/`useMutation` 的缓存/重试/失效开箱即用。本叶讲 tRPC 作为类型安全 RPC 框架的核心机制，与 [NestJS](../nestjs/)（企业级 DI 派）、[Express](../express/)（中间件派）形成对比。

## 评价

**优点**

- **端到端类型安全，零 codegen**：后端类型直接推断到前端，改后端前端编译期即报错，无 GraphQL 的 codegen 流程
- **运行时校验内建**：Zod schema 同时管运行时校验与类型推导，input 不合法后端直接拒绝，前后端契约一致
- **开发体验极佳**：前端 `trpc.user.list.query()` 全自动补全，参数/返回值类型精确，重构零摩擦
- **轻量、无 schema 同步**：无独立 schema 文件（GraphQL 的 .graphql）、无运行时 schema 注册，类型即代码
- **TanStack Query 集成**：缓存/重试/乐观更新/SSR 一应俱全，数据获取层开箱即用

**缺点**

- **强绑定 TypeScript 全栈**：前后端都必须是 TS，跨语言（后端 Go/Java/Python）场景完全不适用——这是最大的限制
- **非标准协议**：tRPC 用自定义 HTTP+JSON 传输，不是 REST（无标准 resource 语义）也不是 GraphQL（无标准 schema），第三方客户端（非 TS）难以消费
- **无 schema 自省**：不像 GraphQL 有 introspection，无法运行时查询可用 API（前端必须编译期知道 router）
- **生态/工具链窄于 REST/GraphQL**：API 网关、限流、文档（Swagger）、移动端原生支持不如 REST/GraphQL 成熟
- **versioning 较难**：procedure 变更（改 input/返回值）会让旧前端编译报错，但**已部署的旧前端运行时会断**，需自行管理版本兼容

## 本叶地图

- [入门](./getting-started) —— tRPC 是什么、端到端类型安全、procedure（query/mutation）、router、context、最小全栈示例
- [Procedure 与 Router](./guide-line/procedures-and-router) —— procedure 的 input/zod 校验、query vs mutation、router 组织、context 与中间件链、错误处理
- [对比与集成](./guide-line/comparison-and-integration) —— vs REST/GraphQL/NestJS、TanStack Query 集成、React Server Components、v11 变化、何时选 tRPC
- [参考](./reference) —— API 速查、procedure/router 模式、与 REST/GraphQL 对照、易错点

## 幻灯片地址

<a href="/SlideStack/trpc-slide/" target="_blank">tRPC</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tRPC" target="_blank" rel="noopener noreferrer">tRPC 测试题</a>
