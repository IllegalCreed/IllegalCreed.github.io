---
layout: doc
outline: [2, 3]
---

# 入门：GraphQL 定义、Schema 与三类操作

> 基于 GraphQL 规范（2015 开源）· 核于 2026-08

## 速查

- **GraphQL 是什么**：Facebook 2012 内部开发、2015 开源的**API 查询语言与运行时**。客户端用类 JSON 的查询语言**精确声明**要哪些字段、关联哪些资源，服务器在**单一端点**（通常 `POST /graphql`）一次返回正好所需的嵌套数据——解决 REST 的过度获取（返回固定字段冗余）与不足获取（聚合多资源要多次 round-trip）。
- **schema-first 设计**：先用 **SDL（Schema Definition Language）** 定义类型契约（type/enum/interface/union），schema 即 API 文档、即类型系统。前后端基于同一份 schema 做 codegen（类型、SDK、mock），契约驱动开发。
- **三类操作**：①**query**（查询，只读，类比 GET）；②**mutation**（变更，有副作用，类比 POST/PUT/PATCH/DELETE）；③**subscription**（订阅，长连接 WebSocket/SSE 实时推送）。query 必须并行执行，mutation 必须串行（避免竞态）。
- **resolver（解析器）**：每个字段对应一个 resolver 函数，负责返回该字段的值。GraphQL 引擎递归调用 resolver 解析整个查询树。resolver 接收 `(parent, args, context, info)` 四个参数。
- **N+1 问题**：列表查询（如查 100 个用户各自的文章）若每个用户的 `posts` 字段 resolver 各查一次数据库，会产生 1（用户列表）+ 100（每用户文章）= 101 次查询。标准解法是 **DataLoader**——批量合并（一个 tick 内的所有请求合并成一次 `WHERE userId IN (...)`）+ 缓存。
- **过度/不足获取**：REST 的固有痛点。**过度获取**=返回固定字段但客户端只用几个（浪费带宽）；**不足获取**=一个页面要聚合用户/订单/评论，REST 要 3 次请求。GraphQL 用客户端定义查询一次解决。
- **单一端点**：GraphQL 通常只有 `POST /graphql` 一个端点（subscription 用 WebSocket）。好处是聚合灵活，代价是丧失 REST 的 URL 级 HTTP 缓存。
- **强类型 + 自描述**：schema 是强类型契约，支持 IDE 自动补全、编译期校验、GraphiQL 交互式文档。无需额外写 OpenAPI spec——schema 本身就是 spec。
- **演进无痛**：新增字段不破坏旧客户端（旧查询不选新字段即可）；废弃字段用 `@deprecated` 标记 + reason。比 REST 的版本控制更平滑。
- **进阶顺序**：[Schema 与 Resolver](./guide-line/schema-and-resolvers) → [Federation 与 REST 对比](./guide-line/federation-and-comparison) → [参考](./reference)。

## 一、GraphQL 是什么：客户端驱动的查询语言

GraphQL（Graph Query Language）是 Facebook 为解决移动端「一个页面要聚合多个 REST 端点、且字段冗余」的问题而发明的。核心思想：**把「返回什么」的决定权从服务器交给客户端**——服务器只定义「有哪些类型和字段」（schema），客户端在查询里精确声明「我要这些类型的这些字段」。

```
客户端查询                        服务器返回
{                                 {
  user(id: 42) {                    "user": {
    name                            "name": "Alice",
    email                           "email": "a@x.com",
    orders {                        "orders": [
      id                            { "id": 1 },
      total                         { "id": 2, "total": 99 }
    }                             ]
  }                               }
}                                 }
```

- **按需取数**：只要 name/email/orders，不要的就别返回（解决过度获取）。
- **一次聚合**：用户 + 订单一次查询返回，无需两次 round-trip（解决不足获取）。
- **强类型**：schema 定义了 user 有 name(String!)/email/orders，客户端查询错了（拼错字段名）在编译期/运行时立即报错。

一句话：**GraphQL 是一种让客户端精确声明数据需求、服务器一次返回正好所需数据的 API 查询语言，schema 是它的类型契约。**

## 二、Schema-first 设计：SDL 类型系统

GraphQL 用 **SDL（Schema Definition Language）** 定义 schema——这是 API 的**类型契约**，也是文档、也是 codegen 的源头。

```graphql
# 标量类型（内置 String/Int/Float/Boolean/ID + 自定义）
scalar DateTime

# 对象类型
type User {
  id: ID!                    # ! 表示非空
  name: String!
  email: String
  orders: [Order!]!          # [] 表示列表，! 在内表示元素非空，! 在外表示列表本身非空
  friends: [User!]           # 自引用（图结构）
}

type Order {
  id: ID!
  total: Float!
  user: User!                # 关联（双向）
  items: [OrderItem!]!
}

# 枚举
enum OrderStatus { PENDING PAID SHIPPED DELIVERED CANCELLED }

# 接口（抽象类型，多个类型可实现）
interface Node { id: ID! }
type User implements Node { id: ID! name: String! }

# 联合类型（多个类型之一）
union SearchResult = User | Order

# 入口：三类操作的根类型
type Query {
  user(id: ID!): User
  users(role: Role): [User!]!
  search(term: String!): [SearchResult!]!
}
type Mutation {
  createUser(input: CreateUserInput!): User!
  cancelOrder(id: ID!): Order!
}
type Subscription {
  orderStatusChanged(id: ID!): Order!
}

# 输入类型（mutation 参数复杂时用）
input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER          # 默认值
}
```

- **`!` 非空**：`String!` 表示不能为 null；`[Order!]!` 表示列表本身非空且每个元素非空。
- **接口（interface）**：抽象类型，实现它的类型共享字段（如 Node 都有 id），客户端可用接口查询多态数据。
- **联合（union）**：表示「可能是多种类型之一」（搜索结果可能是 User 或 Order），客户端用内联片段区分。
- **input 类型**：mutation 的复杂参数用 `input`（而非 type），input 是「扁平的入参容器」。

## 三、三类操作：query / mutation / subscription

GraphQL 的客户端操作分三类，对应不同的交互语义：

| 操作 | 语义 | 类比 REST | 执行 | 端点 |
| --- | --- | --- | --- | --- |
| **query** | 查询（只读） | GET | **可并行**（无副作用，多个字段并行解析） | POST /graphql |
| **mutation** | 变更（有副作用） | POST/PUT/PATCH/DELETE | **必须串行**（避免竞态，按顺序执行） | POST /graphql |
| **subscription** | 订阅（实时推送） | WebSocket | 长连接，服务器主动推送变更 | WS /graphql |

- **query 并行**：一个 query 里的多个字段（如 user.name 和 user.orders）可并行解析，提高性能。
- **mutation 串行**：一个 mutation 里的多个变更操作按顺序执行——防止并发改同一资源产生竞态。所以多个 mutation 比多个 query 慢。
- **subscription**：基于长连接（WebSocket 或 SSE），客户端订阅后服务器在数据变化时主动推送。适合实时场景（聊天、订单状态、股票）。代价是连接维护成本高。

## 四、Resolver：每个字段一个解析函数

GraphQL 的执行模型是**递归解析**：查询树的每个字段都对应一个 resolver 函数，引擎从根开始逐层调用 resolver 取值。

```js
const resolvers = {
  Query: {
    user: (parent, args, context, info) => {
      return context.db.user.findById(args.id);  // 根据参数查用户
    }
  },
  User: {
    orders: (user, args, context) => {
      return context.db.order.findByUserId(user.id);  // 用户的订单
    }
  }
}
```

- **resolver 四参数**：`parent`（父字段返回值）、`args`（查询参数）、`context`（全局上下文，如 db、当前用户，所有 resolver 共享）、`info`（查询 AST，高级用）。
- **默认 resolver**：如果某字段没定义 resolver，GraphQL 默认从 parent 上取同名字段（`user.name` 默认返回 `parent.name`），所以简单字段无需手写。
- **N+1 陷阱的根源**：列表查询的每个元素都会触发其字段 resolver——查 100 个用户的 orders，若 orders resolver 每次查一次数据库，就是 100+1 次查询。详见 [Schema 与 Resolver](./guide-line/schema-and-resolvers)。

## 五、与 REST 对比：何时该选 GraphQL

| 维度 | REST | GraphQL |
| --- | --- | --- |
| **取数精确度** | 服务器定义固定字段（过度/不足获取） | 客户端按需取字段（精确） |
| **聚合** | 多资源要多次 round-trip | 一次查询聚合多资源 |
| **端点** | 多个（/users /orders） | 单一（/graphql） |
| **缓存** | HTTP 层 URL 级缓存成熟 | 难（单端点 POST），需应用层 normalized cache |
| **版本控制** | URL/Header 版本，痛苦 | 新增字段不破坏，@deprecated，平滑 |
| **学习曲线** | 低（基于 HTTP 通用） | 高（schema/resolver/N+1 新概念） |
| **工具** | OpenAPI + Swagger/Postman | GraphiQL + Apollo/urma codegen |
| **适用** | 简单 CRUD、需缓存、内部微服务 | 复杂数据聚合、多端差异化、BFF |

- **GraphQL 的甜区**：移动端/前端复杂数据聚合（一个页面要 N 个资源）、多端差异化字段需求（Web 要详情、Mobile 要精简）、BFF（Backend for Frontend）层。
- **REST 的甜区**：简单 CRUD、需要 HTTP 缓存（CDN）、内部微服务间调用、二进制文件上传下载。

## 下一步

理解了 GraphQL 的总览后，下一步深入两个核心主题——[Schema 与 Resolver](./guide-line/schema-and-resolvers)（SDL 类型系统细节、resolver 解析机制、N+1 问题与 DataLoader 解法）与 [Federation 与 REST 对比](./guide-line/federation-and-comparison)（联邦架构、SDL 详解、与 REST 的工程取舍）。
