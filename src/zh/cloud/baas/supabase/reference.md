---
layout: doc
outline: [2, 3]
---

# 参考：Supabase 速查、对比与易错点

> 基于 Supabase · 核于 2026-08

## 速查

- **定位**：开源 Postgres BaaS，Firebase 的开源替代；核心是真 Postgres + 即时 API + Auth + RLS + Realtime + Storage + Edge Functions。
- **数据库**：托管 Postgres（独立实例），保留事务/外键/JOIN/扩展（pgvector/PostGIS/pg_cron），可 `psql` 直连。
- **即时 API**：PostgREST 自动生成 REST；`pg_graphql` 自动生成 GraphQL；跟着 schema 变。
- **Auth**：邮箱/魔法链接/社交（OAuth）/企业 SSO（SAML/OIDC）/手机 OTP/匿名；签发 JWT。
- **RLS**：Postgres 原生行级安全，开启后默认全拒绝，写 Policy（`using`/`with check`）放行；`auth.uid()` 读 JWT 用户。
- **Realtime**：Postgres Changes（消费 WAL）+ Presence + Broadcast，基于 WebSocket，受 RLS 约束。
- **Storage**：S3 兼容对象存储，访问权限由 RLS 策略保护（public/private 桶 + 签名 URL）。
- **Edge Functions**：Deno 运行时 + 全球 CDN 边缘节点（Deno Deploy），TS 原生，毫秒级冷启动。
- **开源/自托管**：全组件开源，官方云与自托管同代码，无厂商锁定。
- **规模**：120 万+ 开发者，300% 增长。

## 一、Supabase vs Firebase 全维度对比

| 维度 | Supabase | Firebase |
| --- | --- | --- |
| **数据库类型** | **关系型 Postgres**（SQL） | **文档型 NoSQL**（Firestore）/ 键值（Realtime DB） |
| 数据模型 | 表/行/列，严格 schema、外键 | 集合/文档，无 schema、层级文档 |
| JOIN | ✅ 原生 SQL JOIN、嵌套展开 | ❌ 无 JOIN，需多次查询或冗余 |
| 事务 | ✅ ACID | Firestore 有有限事务；Realtime DB 原子写 |
| 复杂查询 | ✅ SQL（聚合/窗口/CTE） | ❌ 查询能力弱（无 `!=`、深度受限） |
| 向量/AI | ✅ pgvector（RAG/语义检索） | 需另接向量库 |
| **API** | 自动 REST（PostgREST）+ GraphQL | SDK 封装（无原生 REST/GraphQL） |
| 即时 API | 建表即生成，跟 schema 变 | 无，需手写 |
| **认证** | 邮箱/社交/OAuth/SSO/匿名/OTP | 邮箱/社交/匿名/手机/SSO |
| 权限模型 | **RLS（Postgres 行级安全）+ Policy** | Security Rules（另写一套） |
| 权限表达 | SQL（统一在数据库一层） | 规则 DSL（与数据查询分离） |
| **实时** | Realtime（Postgres Changes/Presence/Broadcast） | Firestore/Realtime DB 原生实时 |
| 实现机制 | 逻辑复制消费 WAL → WebSocket | 监听文档变更 → WebSocket |
| **存储** | S3 兼容，受 RLS 保护 | Cloud Storage（GCS） |
| 签名 URL | ✅ 限时签名 URL | ✅ 限时签名 URL |
| **函数** | Edge Functions（Deno，全球边缘） | Cloud Functions（Node/Python 等，区域） |
| 运行时 | Deno（TS 原生） | Node 为主，多语言 |
| 部署位置 | 全球 CDN 边缘（Deno Deploy） | 单区域 |
| 冷启动 | 毫秒级 | 百毫秒级（Node） |
| **开源** | **全开源、可自托管** | 闭源，锁定 Google Cloud |
| 厂商锁定 | 低（同代码可迁） | 高 |
| **免费层** | **无限 API 请求**、500MB DB、1GB 存储、50k MAU | Firestore 按读写计次、有限免费额度 |
| 项目暂停 | 免费层 7 天无活动会暂停 | 不暂停（但超额收费） |
| **背靠** | 独立公司 + YC + 开源社区 | Google |
| **强项** | 中后台/SaaS/复杂关系/需 SQL/可自托管 | 移动端/快速原型/层级文档/Google 生态 |

## 二、定价对比

| 项 | Supabase 免费层 | Supabase Pro（$25/月） | Firebase（Spark 免费） |
| --- | --- | --- | --- |
| 项目数 | 2 | 8 | 1 项目多库 |
| **API/读写** | **无限** | **无限** | Firestore 5万读/2万写/天 |
| 数据库容量 | 500MB | 8GB | Firestore 1GB 存储 |
| 存储 | 1GB | 100GB | 5GB（GCS） |
| 月活用户 | 50k | 100k | 无限（认证免费） |
| 函数调用 | 500k/月 | 2M+ 起 | Cloud Functions 2M/月 |
| 函数流量 | 500MB | 250GB | 按量 |
| 实时并发 | 200 连接 | 500+ | 按连接数计费 |
| PITR | 无 | 有 | 无 |
| 超额 | 暂停/限流 | 按量计费 | 按量计费（账单易超） |

**核心差异**：Supabase 免费层**不限 API 调用次数**（只限数据库/存储容量与函数额度）；Firebase 免费层**读写次数有限**，超了立即收费，流量大的应用账单不可控。

## 三、产品矩阵

| 产品 | 作用 | 底层/开源组件 | 对标 Firebase |
| --- | --- | --- | --- |
| **Database** | 托管 Postgres | PostgreSQL | Firestore / Realtime DB |
| **Auth** | 身份认证 | Supabase Auth（GoTrue） | Firebase Authentication |
| **即时 API** | 自动 REST + GraphQL | PostgREST + pg_graphql | 无（无原生 API） |
| **Realtime** | 实时订阅 | Supabase Realtime（Phoenix Channels） | Realtime DB |
| **Storage** | 对象存储 | S3 兼容 + Storage API | Cloud Storage |
| **Edge Functions** | 无服务器函数 | Deno + Deno Deploy | Cloud Functions |
| **Vector（pgvector）** | 向量检索/AI | pgvector 扩展 | 需另接 Vertex AI |
| **Cron** | 定时任务 | pg_cron 扩展 | Cloud Scheduler |

## 四、易错点清单

- **"Supabase 数据库是 NoSQL"**：错。它是**真正的 Postgres**（关系型），支持 SQL/JOIN/事务/外键；NoSQL 的是 Firebase。
- **"开了 RLS 就安全了"**：错。开启 RLS 后**默认全拒绝**，但如果你写了 `using (true)` 这种放行策略，等于没开。安全靠**正确的 Policy**，不是"开了 RLS"本身。
- **"RLS 能替代所有后端鉴权"**：部分错。简单行级权限 RLS 很合适；但复杂权限（层级继承、多对多动态授权、跨表聚合鉴权）在 RLS 里写 SQL 极绕，应写 RPC 函数过程式判断。
- **"即时 API 等于零代码后端"**：错。简单 CRUD 是；复杂 JOIN/聚合/事务仍需直接写 SQL 或 RPC，并非完全免代码。
- **"Edge Functions 就是 Lambda"**：差异大。Edge Functions 跑在**全球边缘**（Deno Deploy）就近执行、毫秒冷启动；Lambda 是**单区域**、冷启动更慢。Edge 不适合长任务（超时短）。
- **"Storage 权限和数据库无关"**：错。Storage 的访问**也由 RLS 策略保护**（对 `storage.objects` 表写 Policy），与行级权限是同一套机制。
- **"Realtime 推送不受 RLS 约束"**：错。Realtime 推送同样按 RLS 过滤，客户端只收到它有权读的行的变更。
- **"自托管 Supabase 等于零运维"**：错。Postgres/Realtime/Storage/Auth/Edge 多组件编排、升级、备份、安全仍要自己管，比托管版累得多。
- **"免费层项目永久在线"**：错。免费项目 **7 天无活动会被暂停**（数据保留，可唤醒）；生产应用要上 Pro。
- **"Supabase 完全免费"**：免费层不限 API 调用，但**数据库容量、存储、函数额度、并发连接**都有限，超额要升级或按量付费。
- **"pgvector 只是装个扩展"**：要真正做向量检索还需建向量索引（`HNSW`/`IVFFlat`）、选距离度量（余弦/内积/L2）、控制维度，否则大数据量下慢。

## 五、进阶方向（链接其他叶）

- [Postgres 与 Auth/RLS](./guide-line/database-and-auth) —— 即时 API 生成原理与 RLS 策略机制
- [Realtime、Storage 与 Edge Functions](./guide-line/realtime-and-edge) —— 实时订阅、S3 兼容存储、Deno 边缘函数
- 数据库 SQL/索引/优化 → 见「数据库」章
- Auth/OAuth/JWT 安全原理 → 见「安全」章

## 权威链接

- [Supabase 官网](https://supabase.com/)
- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [PostgREST（即时 REST）](https://postgrest.org/)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [pgvector（向量检索）](https://github.com/pgvector/pgvector)
- [Deno Deploy（Edge Functions 运行时）](https://deno.com/deploy)
- 本站幻灯片：<a href="/SlideStack/supabase-slide/" target="_blank">Supabase</a>
