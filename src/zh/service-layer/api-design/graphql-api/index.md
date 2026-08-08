---
layout: doc
---

# GraphQL API

**GraphQL** 是 Facebook（现 Meta）在 2012 年内部开发、2015 年开源的**API 查询语言与运行时**。与 REST「服务器定义固定端点、客户端被动接收」不同，GraphQL 让客户端用一种**类 JSON 的查询语言**精确声明「我要哪些字段、关联哪些资源」，服务器在**单一端点**（通常 `POST /graphql`）一次返回正好所需的嵌套数据。理解 GraphQL 的核心机制——**schema-first 设计**（先定义类型契约）、**query/mutation/subscription 三类操作**、**resolver 解析器与 N+1 问题**（DataLoader 批量加载）、**federation 联邦**（多服务组合成一个超级图），是设计**灵活聚合、按需取数、强类型** API 的基础——GraphQL 解决了 REST 固有的「过度获取」（返回固定字段冗余）与「不足获取」（聚合多资源要多次 round-trip）两大痛点，代价是 HTTP 缓存变难、复杂查询的 N+1 性能陷阱、学习曲线陡峭。

GraphQL API 的全部考点围绕**类型系统与解析**展开：①**schema-first 设计**（用 SDL 定义 type/enum/interface/union，类型契约即文档）——回答「API 契约怎么定义」；②**三类操作**（query 查询、mutation 变更、subscription 订阅实时推送）——回答「客户端怎么交互」；③**resolver 与 N+1**（每个字段一个 resolver，列表查询易触发 N+1，DataLoader 批量加载是标准解法）——回答「数据怎么取、性能怎么控」；④**federation 与对比**（多服务联邦成超级图、与 REST 的取舍）——回答「大规模怎么组织、何时该选 GraphQL」。本叶讲 GraphQL 的设计概念——Apollo Server 等具体实现在微服务章展开。

## 评价

**优点**

- **按需取数，无过度/不足获取**：客户端精确指定字段与关联，一个请求拿到嵌套数据，告别 REST 的多次 round-trip 与冗余字段
- **强类型 + 自描述**：schema 即契约即文档，类型系统（type/enum/interface/union）让 IDE 自动补全、编译期校验、Codegen SDK 开箱即用
- **单一端点，聚合友好**：一个 `/graphql` 端点组合多个后端服务的数据，前端无需对接多个 REST 端点
- **演进无痛**：新增字段不破坏旧客户端（只是多了可选项），字段废弃用 `@deprecated` 标记，版本演进比 REST 平滑

**缺点**

- **HTTP 缓存难**：都走 `POST /graphql` 单端点，丧失 REST 的 URL 级 HTTP 缓存与浏览器缓存（需 Apollo Client 的应用层 normalized cache 补救）
- **N+1 性能陷阱**：列表查询每个元素的字段都触发 resolver，易产生 N+1 数据库查询，必须配 DataLoader 批量加载
- **复杂查询攻击面**：恶意客户端可构造深度嵌套/递归查询耗尽服务器（需 query complexity/depth 限制）
- **学习曲线陡**：schema/resolver/nectar/N+1/缓存全是新概念，团队上手成本高于 REST

## 本叶地图

- [入门](./getting-started) —— GraphQL 定义、schema/query-mutation-subscription、resolver、与 REST 对比速览
- [Schema 与 Resolver](./guide-line/schema-and-resolvers) —— SDL 类型系统、三类操作、resolver 解析机制、N+1 问题与 DataLoader
- [Federation 与 REST 对比](./guide-line/federation-and-comparison) —— federation 联邦、SDL 详解、与 REST 的取舍
- [参考](./reference) —— 操作类型速查、SDL 关键字速查、N+1 解法、易错点清单

## 幻灯片地址

<a href="/SlideStack/graphql-api-slide/" target="_blank">GraphQL API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=GraphQL%20API" target="_blank" rel="noopener noreferrer">GraphQL API 测试题</a>
