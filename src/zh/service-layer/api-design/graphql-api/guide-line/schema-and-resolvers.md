---
layout: doc
outline: [2, 3]
---

# Schema 与 Resolver：类型系统、解析机制与 N+1

> 基于 GraphQL 规范 · 核于 2026-08

## 速查

- **SDL 类型构件**：**type**（对象）、**scalar**（标量，内置 String/Int/Float/Boolean/ID + 自定义 DateTime/JSON）、**enum**（枚举）、**interface**（接口，抽象共享字段）、**union**（联合，多种类型之一）、**input**（入参容器）、**`!`**（非空）、**`[]`**（列表）。这些构件组合出完整的类型契约。
- **`!` 语义**：`String!` 字段非空（返回 null 报错）；`[Order!]` 列表元素非空但列表本身可为 null；`[Order!]!` 列表和元素都非空。理解 `!` 的位置是 schema 设计的基础。
- **query 并行 / mutation 串行**：query 的字段可并行解析（无副作用，提升性能）；mutation 操作必须按顺序串行执行（防止并发竞态）。所以批量 mutation 比批量 query 慢。
- **resolver 四参数**：`(parent, args, context, info)`——parent（父字段返回值）、args（查询参数）、context（全局上下文：db/当前用户，所有 resolver 共享，请求级单例）、info（查询 AST）。默认 resolver 从 parent 取同名字段，简单字段无需手写。
- **N+1 问题**：列表查询（查 N 个元素，每个元素的字段各查一次数据库）= 1 + N 次查询。GraphQL 最经典的性能坑——因为每个字段独立解析，天然产生 N+1。
- **DataLoader 解法**：在一个事件循环 tick 内**批量合并**同类型请求 + **缓存**——100 个 `user.orders` 合并成一次 `WHERE userId IN (1,2,...,100)`，N+1 降为 2 次查询。是 GraphQL N+1 的行业标准解法。
- **查询复杂度控制**：恶意客户端可构造深度嵌套/递归查询耗尽服务器。防御：①**depth limiting**（限制最大嵌套深度，如 10）；②**query complexity**（按字段算分，总分超限拒绝）；③**persisted queries**（只接受预注册的白名单查询）。
- **introspection（自省）**：GraphQL 内置 `__schema`/`__type` 查询，可查 schema 本身（有哪些类型、字段）——这是 GraphiQL 自动补全和文档生成的基础。生产环境可关闭 introspection 防止 schema 泄露。

## 一、SDL 类型构件详解

### 1.1 标量（scalar）

```graphql
# 内置标量：String Int Float Boolean ID
# ID 是「唯一标识」，序列化为字符串但可以是数字

# 自定义标量（需配 resolver 做序列化/校验）
scalar DateTime
scalar URL
scalar JSON
```

- **自定义标量**：业务语义的类型，如 `DateTime`（时间戳序列化为 ISO 字符串）、`JSON`（任意 JSON，逃避类型系统）。自定义标量要配 resolver 定义如何序列化/反序列化/校验。

### 1.2 `!` 非空与 `[]` 列表的组合

```graphql
type Example {
  a: String          # 可空字符串
  b: String!         # 非空字符串（返回 null 会报错）
  c: [String]        # 可空列表，元素也可空
  d: [String!]       # 可空列表，但元素非空
  e: [String]!       # 非空列表，元素可空
  f: [String!]!      # 非空列表，元素也非空（最严格）
}
```

- **设计原则**：尽可能用 `!`——非空字段让客户端无需判空，减少运行时错误。列表通常用 `[Type!]!`（非空列表 + 非空元素）。但要诚实：确实可能为 null 的字段（如可选 email）不要标 `!`，否则 resolver 返回 null 会变成错误。

### 1.3 interface 与 union（多态）

```graphql
# 接口：共享字段的抽象类型
interface Node { id: ID! }
type User implements Node { id: ID! name: String! }
type Order implements Node { id: ID! total: Float! }

# 查询时可用接口字段
query { node(id: 42) { id } }   # 所有 Node 都有 id

# 联合：多种类型之一（无共同字段要求）
union SearchResult = User | Order | Article
type Query { search(term: String!): [SearchResult!]! }

# 客户端用内联片段区分具体类型
query {
  search(term: "alice") {
    ... on User { name }
    ... on Order { total }
    ... on Article { title }
  }
}
```

- **interface vs union**：interface 要求实现类型**共享字段**（Node 都有 id），适合「有共同特征的类型」；union **不要求共同字段**，适合「搜索结果可能是任何东西」。客户端都用内联片段（`... on Type`）区分具体类型。

### 1.4 input 类型（mutation 入参）

```graphql
# mutation 的复杂参数用 input（不是 type）
input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER          # 默认值
  tags: [String!] = []       # 默认空数组
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

- **input vs type**：input 是「入参容器」（扁平、只能含标量和嵌套 input），type 是「输出类型」。不能用 type 做入参（因为 type 可含循环引用/接口，不适合做入参）。

## 二、三类操作的执行语义

### 2.1 query 并行执行

```graphql
query {
  user(id: 42) { name }      # ┐
  orders { total }            # ├─ 这三个字段可并行解析
  products { price }          # ┘
}
```

- query 没有副作用，多个字段互不影响，GraphQL 引擎**并行**执行它们的 resolver，提升性能。

### 2.2 mutation 串行执行

```graphql
mutation {
  createUser(input: {name: "A"}) { id }    # 先执行
  createUser(input: {name: "B"}) { id }    # 后执行（等前一个完成）
}
```

- mutation 有副作用，多个 mutation 操作必须**按顺序串行**执行——防止并发改同一资源产生竞态（如两个 createUser 用了同一个自增 id）。所以批量 mutation 比批量 query 慢。

### 2.3 subscription 长连接

```graphql
subscription { orderStatusChanged(id: 42) { status } }
# 客户端订阅后，服务器在订单 42 状态变化时主动推送
```

- subscription 基于 WebSocket（或 SSE）长连接，服务器主动推送。适合实时场景。代价：连接维护成本（心跳、重连、负载均衡需 sticky），不适合大规模广播。

## 三、Resolver 解析机制

### 3.1 resolver 四参数

```js
const resolvers = {
  Query: {
    // parent: 根查询时通常为 undefined
    // args: 查询参数 {id: 42}
    // context: 全局上下文 {db, currentUser, dataLoaders}
    // info: 查询 AST（高级用，如分析字段做优化）
    user: async (parent, args, context, info) => {
      return context.db.user.findById(args.id);
    }
  },
  User: {
    // parent: 上游返回的 user 对象
    orders: (parent, args, context) => {
      return context.db.order.findByUserId(parent.id);
    },
    fullName: (parent) => {        // 计算字段
      return `${parent.firstName} ${parent.lastName}`;
    }
    // name 字段无需写 resolver，默认从 parent.name 取
  }
}
```

- **context 是请求级单例**：每个请求创建一个 context（含 db 连接、当前用户、dataLoaders 实例），该请求的所有 resolver 共享。把 dataLoaders 放 context 是关键（每个请求独立的缓存，避免跨请求缓存串数据）。

### 3.2 默认 resolver

若某字段没定义 resolver，GraphQL 默认执行 `parent[fieldName]`——所以简单字段（直接从 parent 取值的）无需手写 resolver，只给「需要计算/查关联」的字段写。

## 四、N+1 问题与 DataLoader

### 4.1 N+1 是怎么产生的

```graphql
query {
  users {           # 1 次查询拿 N 个用户
    name
    orders {        # 每个用户的 orders 各触发一次 resolver → N 次查询
      total
    }
  }
}
# 总计：1 + N 次数据库查询（若 N=100 就是 101 次）
```

- **根源**：GraphQL 的每个字段独立解析。users resolver 返回 100 个用户后，引擎对每个用户调用 `User.orders` resolver，每个 resolver 各查一次数据库——典型的 N+1。
- **影响**：N 越大越慢，数据库连接池被打满，是 GraphQL 最经典的性能坑。

### 4.2 DataLoader：批量合并 + 缓存

```js
const { DataLoader } = require('dataloader');

// 在 context 里为每个请求创建 DataLoader
const orderLoader = new DataLoader(async (userIds) => {
  // userIds 是一个 tick 内收集的所有 userId（如 [1,2,...,100]）
  const orders = await db.order.findByUserIds(userIds);  // 1 次查询拿所有
  return userIds.map(id => orders.filter(o => o.userId === id));  // 按顺序对应
});

const resolvers = {
  User: {
    orders: (user, _, { loaders }) => loaders.order.load(user.id),  // 批量合并
  }
};
```

- **批量合并**：DataLoader 在一个事件循环 tick 内收集所有 `load(id)` 调用，合并成一次批量查询（`WHERE userId IN (1,2,...,100)`），N+1 降为 2 次查询（1 次 users + 1 次 orders）。
- **缓存**：同一请求内同 id 的重复 load 命中缓存，去重。注意 DataLoader 缓存是**请求级**（每个请求新建实例），不跨请求——跨请求缓存用应用层（Redis）。
- **必须放 context**：每个请求新建 DataLoader 实例（避免跨请求缓存串数据），这是 GraphQL 性能优化的标准实践。

## 五、查询复杂度控制（防滥用）

恶意客户端可构造深度嵌套查询耗尽服务器：

```graphql
query {
  user(id: 1) {
    friends { friends { friends { friends { ... } } } }   # 递归嵌套
  }
}
```

防御手段：

| 手段 | 做法 |
| --- | --- |
| **depth limiting** | 限制最大嵌套深度（如 ≤ 10 层） |
| **query complexity** | 按字段算分（根 1 分、嵌套递增），总分超限拒绝 |
| **persisted queries** | 只接受预注册的白名单查询（客户端发 query hash，服务器查映射），生产推荐 |
| **rate limiting** | 按用户/IP 限制查询频率 |
| **timeout** | 查询执行超时中断 |
| **关闭 introspection** | 生产环境关闭 `__schema` 自省，防止 schema 泄露 |

## 交互演示

本叶无专门可视化，schema 与 resolver 建议结合实际项目（如本站后端若用 NestJS + GraphQL）或 Apollo Sandbox 体会。

## 下一步

讲完 schema 与 resolver 后，下一个主题是 [Federation 与 REST 对比](./federation-and-comparison)——大规模如何用 federation 组合多个服务的 schema，以及 GraphQL 与 REST 的工程取舍。
