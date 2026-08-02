---
layout: doc
---

# Supabase

**Supabase** 是**开源的 Postgres 后端即服务（Backend-as-a-Service，BaaS）**——它把一个**完整的 Postgres 数据库**加上**围绕它构建的一整套后端能力**（即时 REST/GraphQL API、身份认证、行级安全、实时订阅、文件存储、边缘函数）打包成一个托管平台，开发者建完表就能直接读写，无需写后端代码。它对标 **Firebase**，但**核心是关系型数据库（Postgres）而非 NoSQL**，且**全部开源、可自托管**——没有厂商锁定，跑在官方云上和跑在自己的服务器上是同一套代码。Supabase 已有超 **120 万开发者**，是 Firebase 最主流的开源替代。

Supabase 的全部考点围绕**「以 Postgres 为核心的 BaaS 能力栈」**展开：①**托管 Postgres**——开箱即用、可扩展（pg_cron/pgvector）、备份与 PITR；②**即时 API**——基于数据库 schema 自动生成 REST（PostgREST）与 GraphQL；③**Auth + RLS**——邮箱/社交/OAuth 登录 + Postgres 行级安全（Row Level Security）用策略（Policy）控制"每行谁能读/写"，前端拿到 JWT 后访问数据天然带权限；④**Realtime**——订阅 Postgres 的增删改与 Presence/Broadcast；⑤**Storage**——S3 兼容的对象存储且受 RLS 策略保护；⑥**Edge Functions**——基于 Deno 的全球分布式无服务器函数。本叶是 Supabase 的**总览与地基**，讲清定位、能力矩阵、与 Firebase 的取舍（关系型 vs NoSQL、开源 vs 闭源、定价）——Auth 机制原理归安全章，Postgres SQL 语法归数据库章，本叶聚焦平台整体。

## 评价

**优点**

- **Postgres 原生**：底层就是真正的 Postgres，关系型/事务/JOIN/扩展（pgvector 向量）全保留，不是"数据库像数据库"的仿真
- **即时 API**：建表即自动生成 REST 与 GraphQL 接口，前端无需写 CRUD 后端
- **Auth + RLS 一体**：身份认证与行级安全深度绑定 Postgres，前端凭 JWT 访问数据天然按用户隔离行
- **开源可自托管**：全部组件开源（Apache 2.0 / FreeBSD），可部署到自有云，规避厂商锁定
- **免费层慷慨**：免费层**无限 API 请求**、500MB 数据库、1GB 存储、50k 月活用户

**缺点**

- **强绑定 Postgres**：核心就是 Postgres，需要关系型思维；若天然是文档/键值场景，Firebase（Firestore）更顺手
- **复杂查询仍要写 SQL**：即时 API 覆盖增删改查，复杂 JOIN/聚合仍需直接写 SQL 或 RPC，并非"零代码"
- **自托管有运维成本**：虽可自托管，但 Postgres/Realtime/Storage/Auth/Edge 多组件编排、升级、备份并不轻松
- **生态/成熟度不及 Firebase**：Firebase 背靠 Google，移动端 SDK/分析/推送更成熟；Supabase 增长快但部分能力仍在追赶

## 本叶地图

- [入门](./getting-started) —— 定位（开源 Firebase 替代）、Postgres 核心、Auth+RLS、Realtime、与 Firebase 对比
- [Postgres 与 Auth/RLS](./guide-line/database-and-auth) —— 托管 Postgres、即时 REST/GraphQL API、Auth（邮箱/社交/OAuth）、RLS 行级安全（Policy）、JWT
- [Realtime、Storage 与 Edge Functions](./guide-line/realtime-and-edge) —— Realtime 订阅（Postgres Changes）、Storage（S3 兼容+RLS）、Edge Functions（Deno 全球分布）、定价（免费层无限 API 调用）
- [参考](./reference) —— Supabase vs Firebase 对比大表、定价表、产品矩阵、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/supabase-slide/" target="_blank">Supabase</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Supabase" target="_blank" rel="noopener noreferrer">Supabase 测试题</a>
