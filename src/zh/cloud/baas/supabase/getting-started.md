---
layout: doc
outline: [2, 3]
---

# 入门：开源 Postgres BaaS 与 Firebase 替代

> 基于 Supabase · 核于 2026-08

## 速查

- **定位**：Supabase 是**开源 Postgres 后端即服务（BaaS）**——把一个真 Postgres + 围绕它的后端能力（即时 API、Auth、RLS、Realtime、Storage、Edge Functions）打包成托管平台，对标 Firebase。
- **核心是 Postgres**：底层是**真正的 Postgres 数据库**，不是 NoSQL 仿真。事务、JOIN、外键、扩展（pgvector 向量、pg_cron 定时）全保留，可用任意 Postgres 客户端直连。
- **即时 API**：建表后自动生成 **REST（PostgREST）与 GraphQL**——前端直接发 HTTP 就能增删改查，无需写后端。
- **Auth + RLS 一体**：邮箱/社交（GitHub/Google 等）/OAuth 登录；**行级安全（Row Level Security）**用策略（Policy）控制"每行谁能读/写"，前端拿 JWT 访问数据天然带权限。
- **Realtime**：订阅 Postgres 的**增删改**（Postgres Changes）+ Presence（在线状态）+ Broadcast（消息广播），基于 WebSocket。
- **Storage**：**S3 兼容**的对象存储，且受 **RLS 策略**保护（上传/下载按用户鉴权）。
- **Edge Functions**：基于 **Deno** 的全球分布式无服务器函数，靠近用户执行（CDN 边缘节点），TypeScript 原生。
- **开源可自托管**：全部组件开源，官方云与自托管同一套代码——无厂商锁定。
- **规模**：超 **120 万开发者**，Firebase 最主流的开源替代。
- **vs Firebase 关键差异**：**关系型（Postgres）vs 文档型 NoSQL（Firestore）**；开源可自托管 vs 闭源锁定 Google；SQL/JOIN/事务 vs 文档查询；免费层 Supabase **无限 API 调用** vs Firebase 按读写计次。
- **进阶顺序**：[Postgres 与 Auth/RLS](./guide-line/database-and-auth) → [Realtime、Storage 与 Edge Functions](./guide-line/realtime-and-edge) → [参考](./reference)。

## 一、Supabase 是什么：开源 Firebase 替代

传统做法是：前端 + 后端（Node/Java）+ 数据库（MySQL/Postgres），后端要写路由、鉴权、CRUD、文件上传、实时推送。**BaaS（后端即服务）** 把这些**通用后端能力**打包成平台，让前端（或移动端）开发者跳过后端直接用。Firebase 是这个赛道的开创者（2011，Google 2014 收购），但它**闭源、锁定 Google Cloud、数据库是 NoSQL（Firestore/Realtime DB）**。

Supabase（2020 创立）的打法是：**用开源的 Postgres 重做一遍 Firebase 的能力栈**。核心信条是：

> "Supabase is an open source Firebase alternative. We don't try to be Firebase; we expose PostgreSQL so you can build anything."

它的每个产品都对应一个开源组件，且**都开源、可自托管**：

| 能力 | Supabase | 底层开源组件 |
| --- | --- | --- |
| 数据库 | 托管 Postgres | PostgreSQL + PostgREST |
| 认证 | Auth | GoTrue（已并入 Supabase Auth） |
| 实时 | Realtime | Supabase Realtime（Elixir/Phoenix Channels） |
| 存储 | Storage | S3 兼容 + 自研 Storage API |
| 边缘函数 | Edge Functions | Deno + Deno Deploy |

一句话：**Supabase = 开源 Postgres + Firebase 式的后端能力栈，可托管也可自建。**

## 二、Postgres 核心：不是 NoSQL，是关系型

Supabase 与 Firebase 最根本的差异在**数据模型**：

- **Firebase（Firestore）**：**文档型 NoSQL**。数据组织成"集合 → 文档 → 字段"，没有表结构和 schema，没有 JOIN，查询以文档为主，适合**层级化、读多写少、结构灵活**的场景。
- **Supabase**：**关系型 Postgres**。数据是"表 → 行 → 列"，有严格 schema、外键、事务、JOIN、聚合、索引——**所有 SQL/关系型能力原样保留**。

这意味着：

1. **能 JOIN**：`select * from posts join users on ...`——这是 NoSQL 做不到（或要手写多次查询）的。
2. **有事务**：多条写操作要么全成功要么全回滚，金融/库存类业务必需。
3. **可扩展**：装 `pgvector` 就能做向量检索（RAG/语义搜索）；装 `PostGIS` 做地理；装 `pg_cron` 做定时任务。
4. **可直连**：除了 REST/GraphQL API，还能用 `psql`、DataGrip、Prisma 等**任意 Postgres 客户端直连**（只读连接池或完整连接）。

代价是：你需要**会关系型建模**（范式、外键、索引），比 Firestore 的"丢个 JSON 进去"门槛高。但对中后台、SaaS、复杂关系数据，关系型 + SQL 远比 NoSQL 顺手。

## 三、Auth + RLS：前端直接安全访问数据

Supabase 最具特色的设计是**把权限下放到数据库层**：

- **Auth（GoTrue）**：提供邮箱密码、魔法链接、社交登录（GitHub/Google/Apple 等）、企业 SSO（OIDC/SAML）、匿名登录、电话（OTP）。登录成功后，前端拿到一个 **JWT（JSON Web Token）**。
- **RLS（Row Level Security）**：Postgres 原生能力。给表开启 RLS 后，**默认拒绝所有访问**，必须写**策略（Policy）**显式放行——策略用 SQL 表达"谁能读写哪些行"。
- **JWT 与 RLS 联动**：Supabase 客户端发请求时自动带上 JWT；PostgREST 把 JWT 里的 `auth.uid()` 注入到 Postgres 会话；策略就能这样写：

```sql
-- 用户只能读写自己的 todo
create policy "own todos" on todos
  for all using (auth.uid() = user_id);
```

效果：**前端直接发 `select * from todos`，数据库自动只返回当前用户的行**——后端零代码就把"行级权限"做对了。这是 Firebase 需要在 Security Rules 里另写一套规则才能实现的能力，而 Supabase 把它统一在 Postgres 一层。

## 四、Realtime、Storage、Edge Functions

- **Realtime**：通过 WebSocket 订阅 Postgres 的变更。底层是 Postgres 的**逻辑复制（logical replication）**——表变更产生 WAL，Realtime 服务消费 WAL 转成事件推给订阅的客户端。除了"Postgres Changes"，还有 **Presence**（谁在线）和 **Broadcast**（客户端间广播消息）。聊天、协作编辑、仪表盘都用它。
- **Storage**：**S3 兼容的对象存储**（存图片/视频/PDF）。特别之处：**Storage 的权限也由 RLS 策略保护**——上传/下载文件的鉴权和数据库行级权限用同一套机制，不再是另写一套对象存储 ACL。
- **Edge Functions**：基于 **Deno** 运行时的无服务器函数，部署在全球 **CDN 边缘节点**（Deno Deploy），靠近用户执行（延迟低）。用 TypeScript 写，能直接访问数据库、做 Webhook、跑定时任务。相比 AWS Lambda（区域集中），Edge Functions 天然全球分布。

## 五、Supabase vs Firebase：怎么选

| 维度 | Supabase | Firebase |
| --- | --- | --- |
| 数据库 | **关系型 Postgres**（SQL/JOIN/事务/扩展） | **NoSQL**（Firestore 文档型 / Realtime DB） |
| 开源 | **全开源、可自托管** | 闭源，锁定 Google Cloud |
| API | 自动 REST + GraphQL | SDK 封装 |
| 实时 | Realtime（Postgres Changes/Presence） | Realtime DB / Firestore 原生实时 |
| 函数 | Edge Functions（Deno，全球边缘） | Cloud Functions（Node/Java 等，区域） |
| 免费层 | **无限 API 请求**、500MB DB | 按读写次数/存储计费（有限） |
| 适合 | 中后台/SaaS/复杂关系/需 SQL | 移动端/层级文档/快速原型 |

**选型口诀**：要关系型/事务/JOIN/能自托管 → **Supabase**；要文档型/移动端/Google 生态/极快原型 → **Firebase**。

## 下一步

理解了 Supabase 的整体定位后，下一步拆解两大核心——[Postgres 与 Auth/RLS](./guide-line/database-and-auth)（即时 API 的生成原理与行级安全的策略机制）与 [Realtime、Storage 与 Edge Functions](./guide-line/realtime-and-edge)（实时订阅、S3 兼容存储、Deno 边缘函数与定价）。
