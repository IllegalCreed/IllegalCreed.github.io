---
layout: doc
outline: [2, 3]
---

# Postgres 与 Auth/RLS：即时 API 与行级安全

> 基于 Supabase · 核于 2026-08

## 速查

- **托管 Postgres**：Supabase 给每个项目一个**独立的 Postgres 实例**（不是共享的多租户），完整保留事务/外键/JOIN/扩展能力，可用 `psql`/Prisma/DataGrip 直连。
- **即时 REST API（PostgREST）**：扫描数据库 schema，自动把**每张表/视图/函数**暴露成 REST 端点——`GET /todos` 列表、`POST /todos` 新增、`PATCH /todos?id=eq.1` 更新，支持过滤/排序/分页/嵌套展开，无需写后端。
- **即时 GraphQL API**：在 PostgREST 之上再套一层 GraphQL，自动生成 schema 与 resolver，支持关系嵌套查询。
- **Auth（Supabase Auth）**：邮箱密码、魔法链接、社交登录（GitHub/Google/Apple 等）、电话 OTP、匿名登录、企业 SSO（SAML/OIDC）。登录后签发 **JWT**。
- **JWT**：Auth 颁发的 JSON Web Token，含 `sub`（用户 id）、`role`、过期时间等；客户端每次请求带 JWT，PostgREST 校验并注入 Postgres 会话。
- **RLS（Row Level Security）**：Postgres 原生的行级安全机制。给表开 RLS 后**默认全拒绝**，必须写**策略（Policy）**放行；策略是 SQL 表达式，能读 JWT 里的 `auth.uid()`。
- **Policy（策略）**：`create policy ... on 表 for select/insert/update/delete using (...) with check (...)`——`using` 控制能否"读到/改到"该行，`with check` 控制改后内容是否合法。
- **联动效果**：前端直接 `select * from todos`，数据库自动只返回 `auth.uid() = user_id` 的行——**后端零代码**实现行级权限。
- **RPC**：复杂查询/事务写成 Postgres **函数（function）**，通过 `POST /rpc/函数名` 调用——即时 API 搞不定的就走 RPC。
- **进阶顺序**：本叶讲数据库与鉴权 → [Realtime、Storage 与 Edge Functions](./realtime-and-edge) → [参考](../reference)。

## 一、托管 Postgres：真正的关系型数据库

Supabase 的"数据库"不是仿真，是**一个货真价实的 Postgres**：

- **独立实例**：每个项目一个独立 Postgres（Pro 及以上是专用计算/存储），不是多租户共享一个库再分 schema。
- **全功能**：事务（ACID）、外键、JOIN、视图、触发器、存储过程、窗口函数、CTE、全文检索——SQL 该有的全有。
- **可扩展（Extensions）**：一键装 `pgvector`（向量检索，做 AI/RAG）、`PostGIS`（地理）、`pg_cron`（定时任务）、`pg_graphql`、`uuid-ossp` 等。装完即在 SQL 和 API 里用。
- **可直连**：除了 REST/GraphQL，还能用连接串直连（端口 5432 或连接池 6543），配 Prisma、Drizzle、DataGrip、`psql` 都行。
- **备份与 PITR**：免费层每日备份；Pro 以上支持 **PITR（Point-In-Time Recovery）**，可恢复到任意秒。
- **Branding**：Supabase 不发明新 SQL，**只是 Postgres 的托管层**——你在它上面学的 SQL，搬到任何 Postgres 都成立。

**注意边界**：本叶讲平台整体，**Postgres 的 SQL 语法/优化/索引原理归「数据库」章**——这里只关心 Supabase 如何把 Postgres 包装成 BaaS。

## 二、即时 API：PostgREST 与 GraphQL

建完表，Supabase 自动生成两套 API，前端无需写后端：

### REST API（PostgREST）

[PostgREST](https://postgrest.org/) 是独立的开源项目，它读 Postgres 的**元数据（catalog）**——表、列、类型、外键、函数——自动暴露为 REST 端点：

```
GET    /rest/v1/todos                 # 列表（带过滤/排序/分页）
POST   /rest/v1/todos                 # 新增
GET    /rest/v1/todos?id=eq.1         # 过滤 id=1
PATCH  /rest/v1/todos?id=eq.1         # 更新
DELETE /rest/v1/todos?id=eq.1         # 删除
POST   /rest/v1/rpc/my_function       # 调用 Postgres 函数
```

过滤语法（PostgREST 的"行不变式"）：

```
GET /todos?status=eq.done             # status = 'done'
GET /todos?id=gte.10&id=lt.100        # 10 <= id < 100
GET /todos?order=created_at.desc&limit=20
GET /todos?select=id,title,user(id,name)  # 嵌套展开（靠外键自动 JOIN）
```

### GraphQL API

在 PostgREST 之上，Supabase 用 `pg_graphql` 扩展把 schema 映射成 GraphQL schema，关系变成嵌套字段：

```graphql
query {
  todosCollection(filter: { status: { eq: "done" } }) {
    edges {
      node { id title user { name } }
    }
  }
}
```

- **关键点**：REST 和 GraphQL 都**自动跟着 schema 变**——加列、改外键，API 立刻同步，无需重新部署。
- **权限**：所有 API 调用都**受 RLS 约束**（见下节），不是"谁都能读"。

## 三、Auth：身份认证

Supabase Auth（前身 GoTrue）负责"证明你是谁"，签发 JWT。支持的登录方式：

| 类型 | 方式 |
| --- | --- |
| 邮箱 | 密码、魔法链接（无密码）、邮箱 OTP |
| 社交 | GitHub、Google、Apple、GitLab、Discord、Facebook、Twitter 等（OAuth） |
| 企业 | SAML 2.0、OIDC（对接公司 SSO） |
| 手机 | SMS OTP（需 Twilio/MessageBird） |
| 匿名 | 临时用户，后续可升级 |

- **用户表 `auth.users`**：所有用户存在 `auth` schema 的 `users` 表，与业务表分离。
- **`auth.uid()`**：Postgres 函数，返回当前请求 JWT 里的用户 id——**RLS 策略靠它识别"当前是谁"**。
- **JWT**：登录后签发，含 `sub`（用户 id）、`role`（`authenticated`/`anon`）、`exp`。客户端（JS SDK / 移动 SDK）自动在每次请求带 JWT。
- **Refresh Token**：JWT 有效期短（默认 1 小时），过期用 refresh token 续签——Supabase SDK 自动处理。

> **边界**：Auth 的**安全原理**（OAuth 流程、JWT 签名/校验、密码哈希、会话安全）归「安全」章；本叶只讲它在 Supabase 平台**如何与 RLS 联动**。

## 四、RLS：行级安全与策略

RLS 是 Supabase"前端能直接安全访问数据库"的根基。它是 **Postgres 原生能力**（9.5+），Supabase 只是把它用好用满。

### 开启与默认拒绝

```sql
alter table todos enable row level security;
```

**开启后默认拒绝一切**——匿名用户和已登录用户都读不到任何行。必须写策略放行。

### 策略（Policy）

策略是一条 SQL 表达式，挂在表上，分四类操作：

```sql
-- 当前用户只能读自己的 todo
create policy "用户读自己的 todo"
  on todos for select
  using (auth.uid() = user_id);

-- 当前用户只能新增自己的 todo（with check 校验写入值）
create policy "用户新增自己的 todo"
  on todos for insert
  with check (auth.uid() = user_id);

-- 当前用户只能改/删自己的 todo
create policy "用户改自己的 todo"
  on todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 公开读（如公告表）
create policy "公开读" on announcements for select using (true);
```

- **`using (expr)`**：决定能否"命中/读到/删到"该行——表达式为真才行。
- **`with check (expr)`**：`insert/update` 后的新行内容必须满足——防止"改别人的行成自己的"。
- **`auth.uid()`**：当前 JWT 的用户 id；未登录返回 NULL，策略自然不匹配 → 拒绝。
- **角色**：JWT 里 `role` 是 `anon`（匿名）或 `authenticated`（已登录），策略可按角色区分。

### 联动效果

前端代码（JS SDK）：

```js
const { data } = await supabase.from('todos').select('*');
```

后端无任何代码，但返回的**只有当前登录用户的 todo**——因为 PostgREST 把 JWT 注入会话，Postgres 的 RLS 自动过滤。这是 Firebase 需要 Security Rules 另写一套才能做到的，而 Supabase 把它统一在 Postgres 一层。

### 何时不用 RLS

复杂权限（如"部门层级继承"、多对多动态授权）在 RLS 里写 SQL 会很绕。这时写**Postgres 函数**做权限判断，通过 `POST /rpc/函数名` 调用（RPC），绕过 RLS 的声明式约束，用过程式逻辑控制。

## 下一步

数据库与鉴权讲完后，下一站是 [Realtime、Storage 与 Edge Functions](./realtime-and-edge)——如何订阅数据变更、用 S3 兼容存储带权限存文件、用 Deno 边缘函数跑全球分布式逻辑，以及 Supabase 的定价模型。
