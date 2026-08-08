---
layout: doc
outline: [2, 3]
---

# Federation 与 REST 对比

> 基于 GraphQL 规范 · Apollo Federation 2 · 核于 2026-08

## 速查

- **federation（联邦）**：把多个独立服务的 GraphQL schema **组合成一个超级图（supergraph）** 的架构。每个团队负责自己的 subgraph（如订单服务定义 Order 类型、用户服务定义 User 类型），网关（gateway）自动把它们 stitch 成统一的 API——前端只见一个端点，后端各服务独立演进部署。
- **entity（实体）**：federation 的核心构件。用 `@key` 标记的类型，跨服务共享。如订单服务和用户服务都引用 User entity，通过 `id` 关联。entity 让一个类型的字段可分散在多个服务（User.name 在用户服务，User.orders 在订单服务）。
- **@key / @external / @provides / @requires**：federation 的核心指令——`@key`（定义 entity 主键）、`@external`（引用其他服务定义的字段）、`@provides`（声明本服务能解析某字段）、`@requires`（声明解析某字段需要的外部字段）。
- **gateway（网关）**：federation 的查询规划器（query planner）所在。客户端查询发到 gateway，gateway 拆解查询、并行调用各 subgraph、合并结果返回。前端只对接 gateway，不感知后端有几个服务。
- **schema stitching vs federation**：两种合并多 schema 的方式。stitching（早期方案）手动写 resolver 合并；federation（Apollo 主推）用 entity + 自动 query planning，更自动化。新项目用 federation。
- **与 REST 对比（核心取舍）**：GraphQL 赢在取数精确 + 聚合 + 强类型 + 演进无痛；REST 赢在 HTTP 缓存 + 简单 + 工具链成熟 + 性能可控。**不是替代是互补**——BFF 层用 GraphQL，内部微服务用 REST/gRPC。
- **GraphQL 不适合的场景**：①需要 HTTP 缓存（CDN）的公共 API；②二进制文件上传下载；③内部高频微服务调用（gRPC 二进制更高效）；④学习成本敏感的小团队简单 CRUD。
- **SDL 详解**：`type`/`scalar`/`enum`/`interface`/`union`/`input`/`directive` 是 schema 的全部构件，schema 即契约即文档。

## 一、为什么需要 Federation：单体 schema 的瓶颈

小型项目用一个 GraphQL 服务（一个 schema、一套 resolver）就够了。但当业务规模扩大到多个团队、多个微服务时，单体 schema 的问题暴露：

- **所有团队的 schema 挤在一个仓库**——合并冲突、部署耦合，一个团队改 schema 影响所有人。
- **resolver 要连所有数据源**——订单 resolver 连订单库、用户 resolver 连用户库，一个服务变成「上帝服务」。
- **无法独立扩缩容**——订单查询多时整个服务要扩容，浪费。

**Federation 的解法**：每个团队/服务维护自己的 **subgraph**（子图，只定义自己负责的类型），用一个 **gateway** 把所有 subgraph 组合成一个 **supergraph**（超级图）。前端只见 gateway 一个端点，后端各服务独立演进部署。

## 二、Federation 的核心构件：entity

entity（实体）是 federation 跨服务共享的类型，用 `@key` 标记主键：

```graphql
# 用户服务（subgraph-users）
type User @key(fields: "id") {
  id: ID!           # 主键，其他服务通过 id 引用 User
  name: String!
  email: String!
}

# 订单服务（subgraph-orders）
type Order {
  id: ID!
  total: Float!
  user: User!       # 引用 User entity（无需在此重复定义 User 字段）
}

# 订单服务也可以扩展 User（给 User 加 orders 字段）
extend type User @key(fields: "id") {
  id: ID! @external              # 引用主键
  orders: [Order!]!              # 由订单服务解析
}
```

- **entity 的字段可分散在多个服务**：User.name 在用户服务，User.orders 在订单服务——客户端查询时无感知，gateway 自动路由到正确的服务。
- **`@key`**：定义 entity 的主键（通常是 id），其他服务通过主键引用。
- **`extend type`**：扩展一个已在其他服务定义的 entity，给它加字段。
- **`@external`**：标记某字段由其他服务定义（本服务只是引用）。
- **`@provides`**：声明本服务能在某处解析通常由其他服务提供的字段（优化）。
- **`@requires`**：声明本服务解析某字段时需要的外部字段（跨服务计算）。

## 三、Gateway：查询规划器

```graphql
# 客户端查询（发给 gateway）
query {
  user(id: 42) {
    name          # ← 用户服务提供
    orders {      # ← 订单服务提供
      total
    }
  }
}
```

gateway 收到查询后，**query planner** 自动规划执行：

1. 先调用户服务拿 `user(id:42).name` → `{id:42, name:"Alice"}`
2. 再用 id=42 调订单服务拿 `orders` → `[{total:99}]`
3. 合并成 `{name:"Alice", orders:[{total:99}]}` 返回客户端

- **并行优化**：无依赖的字段并行调多个 subgraph。
- **前端无感知**：客户端只对接 gateway，不关心后端有几个服务、怎么拆。这让后端可以自由重构（拆分/合并服务）而不影响前端。

## 四、Federation vs Schema Stitching

| 维度 | Schema Stitching（早期） | Federation（现代） |
| --- | --- | --- |
| **合并方式** | 手动写 resolver 合并多个 schema | 用 entity + 自动 query planning |
| **耦合** | 网关需了解各服务细节 | subgraph 声明式（directive），网关自动 |
| **演进** | 加服务要改网关 resolver | 加 subgraph 自动纳入 supergraph |
| **主导** | 社区早期方案 | Apollo 主推（Federation 2） |
| **现状** | 渐被弃用 | 主流 |

新项目选 Federation 2。

## 五、SDL 构件完整速查

```graphql
# 标量
scalar DateTime

# 对象类型
type User { id: ID! name: String! }

# 枚举
enum Role { ADMIN USER GUEST }

# 接口（抽象，共享字段）
interface Node { id: ID! }

# 联合（多类型之一）
union SearchResult = User | Order

# 输入类型（入参）
input CreateUserInput { name: String! }

# 指令（directive，附加元信息）
directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE
type OldQuery { field: String @deprecated(reason: "用 newField") }

# 根类型（入口）
type Query { ... }
type Mutation { ... }
type Subscription { ... }
```

## 六、GraphQL vs REST：完整取舍

| 维度 | REST | GraphQL |
| --- | --- | --- |
| **取数精确度** | 固定字段（过度/不足获取） | 客户端按需取（精确） |
| **聚合** | 多次 round-trip | 一次查询 |
| **端点** | 多个 | 单一（/graphql） |
| **HTTP 缓存** | 成熟（URL 级 + CDN） | 难（单端点 POST），需应用层 cache |
| **版本控制** | URL/Header，痛苦 | 新增字段不破坏，@deprecated |
| **错误处理** | 状态码明确 | 永远 200，错误在 body（partial result） |
| **学习曲线** | 低（基于 HTTP） | 高（schema/resolver/N+1） |
| **性能可控** | 高（端点固定，易优化） | 低（任意查询，N+1 风险） |
| **文件上传** | 原生支持（multipart） | 弱（需 multipart scalar 或单独端点） |
| **工具链** | OpenAPI + Swagger/Postman | GraphiQL + Apollo/codegen |
| **适合** | 公共 API、需缓存、内部微服务、文件 | 复杂聚合、多端差异化、BFF |

### 6.1 GraphQL 的甜区

- **移动端/前端复杂数据聚合**：一个页面要 N 个资源，GraphQL 一次拿全。
- **多端差异化字段需求**：Web 要详情、Mobile 要精简、Watch 要极少——同一 schema 各取所需。
- **BFF（Backend for Frontend）层**：前端聚合层用 GraphQL，对接后端多个 REST/gRPC 微服务。

### 6.2 REST 的甜区（GraphQL 不适合的场景）

- **公共 API 需 HTTP 缓存**：CDN 缓存 GET 请求，GraphQL 单端点 POST 难缓存。
- **二进制文件上传下载**：GraphQL 基于 JSON，文件用 REST multipart 原生支持。
- **内部高频微服务调用**：gRPC 二进制 protobuf 比 GraphQL JSON 更高效。
- **小团队简单 CRUD**：GraphQL 的 schema/resolver/N+1 学习成本不划算。

## 七、GraphQL 的代价与坑

- **HTTP 缓存难**：都走 POST /graphql，丧失 REST 的 URL 级缓存。解法：①Apollo Client 的应用层 normalized cache；②对 GET 查询用 Apollo 的 Automatic Persisted Queries 把查询转成 GET 可缓存。
- **错误处理**：GraphQL 即使部分字段失败也返回 HTTP 200，错误在 body 的 `errors` 数组——这与 REST 的 4xx/5xx 不同，监控/网关要适配。
- **N+1 性能坑**：见上一节，必须配 DataLoader。
- **复杂查询攻击**：见上一节，需 depth/complexity 限制。

## 交互演示

本叶无专门可视化，federation 建议结合 Apollo 官方的 supergraph 演示（studio.apollographql.com）理解 query planning。

## 下一步

GraphQL 的核心概念到此讲完。下一步可深入 [REST API](../../rest-api/)（对比理解）与 [OpenAPI 规范](../../openapi-spec/)（REST 的契约描述——GraphQL 的对应物是 SDL，理解二者差异）。
