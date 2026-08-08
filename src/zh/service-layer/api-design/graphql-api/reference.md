---
layout: doc
outline: [2, 3]
---

# 参考：GraphQL 操作、SDL、N+1 与易错点速查

> 基于 GraphQL 规范 · 核于 2026-08

## 速查

- **GraphQL 定义**：API 查询语言与运行时，客户端精确声明数据需求，服务器单端点返回。
- **schema-first**：用 SDL 定义类型契约，schema 即文档即 codegen 源头。
- **三类操作**：query（查询，并行）、mutation（变更，串行）、subscription（订阅，长连接）。
- **resolver 四参数**：parent/args/context/info，每字段一个，默认 resolver 取 parent 同名字段。
- **N+1 解法**：DataLoader 批量合并 + 请求级缓存。
- **federation**：多个 subgraph 组合成 supergraph，entity（@key）跨服务共享，gateway 自动 query planning。

## 一、三类操作速查

| 操作 | 语义 | 副作用 | 执行 | 端点 |
| --- | --- | --- | --- | --- |
| query | 查询 | 无 | 并行 | POST /graphql |
| mutation | 变更 | 有 | 串行 | POST /graphql |
| subscription | 订阅 | 无（推送） | 长连接 | WS /graphql |

## 二、SDL 构件速查

| 构件 | 作用 | 示例 |
| --- | --- | --- |
| `type` | 对象类型 | `type User { id: ID! }` |
| `scalar` | 标量 | `scalar DateTime`（内置 String/Int/Float/Boolean/ID） |
| `enum` | 枚举 | `enum Role { ADMIN USER }` |
| `interface` | 接口（抽象，共享字段） | `interface Node { id: ID! }` |
| `union` | 联合（多类型之一） | `union Result = User \| Order` |
| `input` | 入参容器 | `input CreateUserInput { name: String! }` |
| `!` | 非空 | `String!` / `[Order!]!` |
| `[]` | 列表 | `[String]` |
| `directive` | 指令（元信息） | `@deprecated(reason: "...")` `@key(fields:"id")` |

## 三、`!` 非空组合速查

| 写法 | 列表本身 | 元素 |
| --- | --- | --- |
| `[String]` | 可空 | 可空 |
| `[String!]` | 可空 | 非空 |
| `[String]!` | 非空 | 可空 |
| `[String!]!` | 非空 | 非空 |

## 四、N+1 问题与解法

| 维度 | 说明 |
| --- | --- |
| **现象** | 列表查询 N 个元素，每元素字段各查一次数据库 = 1+N 次查询 |
| **根源** | 每个字段独立 resolver，天然产生 N+1 |
| **解法** | DataLoader——一个 tick 内批量合并 + 请求级缓存 |
| **效果** | N+1 降为 2 次查询（1 次列表 + 1 次批量 `WHERE IN`） |
| **要点** | DataLoader 实例放 context（每请求新建，避免跨请求串数据） |

## 五、Federation 指令速查

| 指令 | 作用 |
| --- | --- |
| `@key(fields: "id")` | 定义 entity 主键，跨服务引用 |
| `@external` | 标记字段由其他服务定义（本服务引用） |
| `extend type` | 扩展其他服务定义的 entity |
| `@provides` | 声明本服务能解析通常由其他服务提供的字段 |
| `@requires` | 声明解析某字段需要的外部字段 |

## 六、GraphQL vs REST 速查

| 维度 | REST | GraphQL |
| --- | --- | --- |
| 取数 | 固定字段 | 按需 |
| 聚合 | 多次 round-trip | 一次查询 |
| 缓存 | HTTP URL 级成熟 | 难（单端点） |
| 版本 | URL/Header 痛苦 | @deprecated 平滑 |
| 错误 | 状态码明确 | 永远 200 + errors 数组 |
| 文件 | 原生 multipart | 弱 |
| 适合 | 公共 API/缓存/微服务 | 复杂聚合/多端/BFF |

## 七、易错点清单

- **「GraphQL 是 REST 的替代品」**：错。两者互补——GraphQL 甜区是复杂聚合/BFF，REST 甜区是公共 API/缓存/文件。按场景选型。
- **「GraphQL 一定比 REST 快」**：错。GraphQL 有 N+1 风险，复杂查询可能比 REST 慢。性能取决于实现（DataLoader/缓存）。
- **「mutation 和 query 一样可并行」**：错。mutation 必须串行（防竞态），query 才并行。
- **「`!` 不重要，随便加」**：错。`!` 是契约——标了 `!` 的字段返回 null 会变成错误。应诚实标注（确实非空的才标）。
- **「N+1 只在 GraphQL 出现」**：不全面。ORM 的 lazy loading 也有 N+1，但 GraphQL 因每字段独立 resolver 更易触发。
- **「DataLoader 缓存是全局的」**：错。DataLoader 缓存是**请求级**（每请求新建实例），不跨请求——跨请求缓存用 Redis。
- **「GraphQL 错误返回 4xx/5xx」**：错。GraphQL 即使部分失败也返回 HTTP 200，错误在 body 的 `errors` 数组（含 partial result）。
- **「subscription 可以随便用」**：错。subscription 基于长连接（WS），连接维护成本高，不适合大规模广播，只用于真正的实时场景。
- **「GraphQL 天然安全」**：错。恶意客户端可构造深度嵌套查询耗尽服务器，需 depth/complexity 限制 + persisted queries。
- **「federation 就是 schema stitching」**：错。stitching 是手动 resolver 合并（早期方案），federation 是 entity + 自动 query planning（现代主流）。

## 八、进阶方向（链接其他叶）

- [REST API](../../rest-api/) —— 对比理解 REST 与 GraphQL 的取舍
- [OpenAPI 规范](../../openapi-spec/) —— REST 的契约描述（对应 GraphQL 的 SDL）
- [API 版本控制](../../api-versioning/) —— REST 演进 vs GraphQL 的 @deprecated 平滑演进

## 权威链接

- [GraphQL 官方规范](https://spec.graphql.org/)
- [GraphQL 官网](https://graphql.org/)
- [Apollo Federation 文档](https://www.apollographql.com/docs/federation/)
- [DataLoader](https://github.com/graphql/dataloader)
- [Apollo Server 文档](https://www.apollographql.com/docs/apollo-server/)
- 本站幻灯片：<a href="/SlideStack/graphql-api-slide/" target="_blank">GraphQL API</a>
