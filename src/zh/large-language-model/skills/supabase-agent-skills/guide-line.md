---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 supabase/agent-skills 的 `supabase/SKILL.md`（v0.1.2）与 `supabase-postgres-best-practices/SKILL.md`（v1.1.1）及其 references 编写。

## 速查

- **四大域**：文档访问（先 changelog 后文档）· 安全（RLS/权限清单）· 工具工作流（CLI/MCP）· schema 管理（声明式/命令式）
- **文档优先级**：MCP `search_docs` → 文档页加 `.md` 拉取 → Web 搜索；先扫 `changelog.md` 的 `breaking-change`
- **RLS 铁律**：暴露 schema 每张表都开 RLS；`TO authenticated` 只是认证不是授权，必须配 `USING` 里的归属判断
- **视图坑**：视图默认绕 RLS → PG15+ 用 `security_invoker = true`
- **UPDATE 坑**：需要 SELECT 策略（否则静默返回 0 行）；UPDATE 策略要同时写 `USING` + `WITH CHECK`
- **授权数据**：放 `app_metadata`，别放用户可改的 `user_metadata`
- **CLI**：`--help` 发现命令别猜；`db query` 需 v2.79.0+、`db advisors` 需 v2.81.3+
- **schema 迭代**：本地用 `execute_sql`，别用 `apply_migration` 反复写；提交前跑 advisors
- **Postgres 8 类规则**：查询/连接/安全=CRITICAL，schema=HIGH，锁=MED-HIGH，数据访问=MED，监控=LOW-MED，高级=LOW
- **RLS 性能**：`auth.uid()` 包进 `(select auth.uid())`，从每行调用变调一次缓存，大表 100x+

## 域一：文档访问——别信训练数据

主技能的第一原则：**Supabase 变化快，实现前先核对 changelog 与当前文档。** 函数签名、`config.toml` 设置、API 约定都会在版本间变。

流程：

1. **先拉 changelog**——`https://supabase.com/changelog.md`（轻量摘要索引，不是重量级全量拉取），扫与任务相关的 `breaking-change` 标签，命中就跟进对应页。
2. **再查主题文档**，按优先级：

| 优先级 | 方法 | 说明 |
| --- | --- | --- |
| 1 | MCP `search_docs` 工具 | 首选，直接返回相关片段 |
| 2 | 文档页当 markdown 拉 | 任意文档页 URL 后加 `.md` |
| 3 | Web 搜索 | 不知道看哪页时用 |

## 域二：安全——Supabase 专属陷阱清单

凡是碰 auth、RLS、视图、storage、用户数据的任务，都要过一遍这份清单。这些都是 Supabase 特有、会**静默**制造漏洞的坑。

### 暴露表到 Data API ≠ RLS

新建的表未必自动暴露到 Data（REST）API——取决于项目的 Data API 设置。要让 `anon`/`authenticated` 角色访问，需显式 `GRANT`。**这和 RLS 是两回事**：RLS 控制表可访问后哪些「行」可见，不控制表本身是否可访问。给公开角色授权时，务必同时开 RLS。

### RLS 与暴露 schema

任何暴露 schema（默认含 `public`）里的**每张表都要开 RLS**。因为当 `anon`/`authenticated` 有访问权时，暴露 schema 里的表能通过 Data API 触达。开 RLS 后，按真实访问模型写策略，别把每张表都套同一个 `auth.uid()`。

### Auth 与会话安全

- **绝不用 `user_metadata` 做授权判断**：`raw_user_meta_data` 用户可改、会出现在 `auth.jwt()` 里，用于 RLS 或任何授权逻辑都不安全。授权数据放 `raw_app_meta_data` / `app_metadata`。
- **删用户不会让已签发的 access token 失效**：先登出或吊销会话；敏感应用把 JWT 有效期设短；严格场景在敏感操作时校验 `session_id` 对 `auth.sessions`。
- **JWT 声明不总是最新**：用 `app_metadata` / `auth.jwt()` 授权时，声明要等 token 刷新才更新。

### API key 与客户端暴露

- **绝不在公开客户端暴露 `service_role` 或 secret key**：前端用 publishable key；旧 `anon` key 仅为兼容。Next.js 里任何 `NEXT_PUBLIC_` 前缀的环境变量都会发到浏览器。

### RLS、视图与特权数据库代码

- **视图默认绕过 RLS**：PG15+ 用 `CREATE VIEW ... WITH (security_invoker = true)`；旧版从 `anon`/`authenticated` 收回访问权，或放进不暴露的 schema。
- **UPDATE 需要 SELECT 策略**：Postgres RLS 里 UPDATE 要先 SELECT 到行。没有 SELECT 策略，更新会**静默返回 0 行**——不报错，也不改。
- **`auth.role()` 已废弃**——改用 `TO` 子句。开启匿名登录后 `auth.role() = 'authenticated'` 会静默失效（匿名用户也带 `authenticated` 角色）。
- **`TO authenticated` 只是认证不是授权（BOLA / IDOR）**：只检查角色，不限制访问哪些行。正确姿势是配合 `USING` 里的归属判断：

```sql
create policy "example" on table_name for select
to authenticated
using ( (select auth.uid()) = user_id );
```

- **UPDATE 策略要同时写 `USING` + `WITH CHECK`**：缺 `WITH CHECK`，用户能把某行的 `user_id` 改成别人：

```sql
create policy "example" on table_name for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
```

- **`SECURITY DEFINER` 函数绕过 RLS**：它以创建者权限运行（通常带 `bypassrls`）。绝不要为了解权限错误而加 `SECURITY DEFINER`——它会静默移除访问控制。优先 `SECURITY INVOKER`。
- **`public` 里的 `SECURITY DEFINER` 函数人人可调**：Postgres 默认给每个新函数把 `EXECUTE` 授给 `PUBLIC`，所以 `public` 里的 `SECURITY DEFINER` 函数就是个 `anon`/`authenticated` 都能调的公开 API。真需要时放进非暴露 schema、函数体内做 `auth.uid()` 检查、改动后跑 `supabase db advisors`。

### Storage 访问控制

- **Storage upsert 需 INSERT + SELECT + UPDATE 三个权限**：只给 INSERT 能新上传，但文件替换（upsert）会**静默失败**。

### 依赖与供应链

- **装 Supabase 包务必锁版本、提交 lockfile**（`supabase-js`、`@supabase/ssr`、`supabase-py` 等）。

## 域三：工具工作流——CLI 与 MCP

### Supabase CLI

**永远用 `--help` 发现命令，别猜**——CLI 结构会在版本间变：

```bash
supabase --help                    # 所有顶层命令
supabase <group> --help            # 子命令（如 supabase db --help）
supabase <group> <command> --help  # 某命令的 flag
```

已知坑：

- `supabase db query` 需 CLI **v2.79.0+** → 否则用 MCP `execute_sql` 或 `psql` 回退
- `supabase db advisors` 需 CLI **v2.81.3+** → 否则用 MCP `get_advisors` 回退
- 命令式迁移项目：先用 `supabase migration new <name>` 建手写迁移文件，别凭记忆编文件名

### Supabase MCP Server

连接排障按序三步：

1. **查可达性**：`curl -so /dev/null -w "%{http_code}" https://mcp.supabase.com/mcp`——返回 `401`（无 token）是预期，说明服务在线；超时或 connection refused 才是挂了。
2. **查 `.mcp.json`**：项目根有没有指向正确 server URL 的配置，缺就建一个指向 `https://mcp.supabase.com/mcp`。
3. **鉴权**：可达且配置对但工具不可见，就是要鉴权——MCP 用 OAuth 2.1，触发 agent 里的授权流、浏览器完成、重载会话。

## 域四：schema 管理——声明式 vs 命令式

先判断项目用哪种工作流。

### 方案 A：声明式 schema

当 `supabase/schemas/` 存在或 `config.toml` 设了 `schema_paths` 时用。在这些文件里改期望的 schema 状态，然后生成并审查迁移——**别一上来手写迁移**。

### 方案 B：命令式迁移

项目不用声明式时用。**改 schema 用 `execute_sql`（MCP）或 `supabase db query`（CLI）**——它们直接在库上跑 SQL、不写迁移历史，可自由迭代，就绪后再生成干净迁移。

**别用 `apply_migration` 改本地 schema**——它每次调用都写一条迁移历史，导致无法迭代，且 `supabase db diff` / `db pull` 会产生空或冲突的 diff。用了就被首次传的 SQL 卡死。

就绪提交时：

1. **跑 advisors** → `supabase db advisors`（v2.81.3+）或 MCP `get_advisors`，修掉问题
2. **过一遍安全清单**（若改动涉及视图/函数/触发器/storage）
3. **生成迁移** → `supabase db pull <descriptive-name> --local --yes`
4. **验证** → `supabase migration list --local`

## Postgres 最佳实践：8 类规则，按影响力排序

`supabase-postgres-best-practices` 技能含 8 类规则，按影响力从关键到增量排：

| 优先级 | 类别 | 影响 | 前缀 |
| --- | --- | --- | --- |
| 1 | 查询性能 | CRITICAL | `query-` |
| 2 | 连接管理 | CRITICAL | `conn-` |
| 3 | 安全 & RLS | CRITICAL | `security-` |
| 4 | Schema 设计 | HIGH | `schema-` |
| 5 | 并发 & 锁 | MEDIUM-HIGH | `lock-` |
| 6 | 数据访问模式 | MEDIUM | `data-` |
| 7 | 监控 & 诊断 | LOW-MEDIUM | `monitor-` |
| 8 | 高级特性 | LOW | `advanced-` |

每条规则含：为什么重要、错误 SQL 示例、正确 SQL 示例、可选的 EXPLAIN/指标、Supabase 专属备注。几个高频规则：

### 查询性能：给 WHERE / JOIN 列加索引

无索引的过滤/连接列会全表扫描，表越大越慢（100-1000x 差距）：

```sql
-- 错误：customer_id 无索引 → Seq Scan
select * from orders where customer_id = 123;

-- 正确：建索引 → Index Scan
create index orders_customer_id_idx on orders (customer_id);
```

### 连接管理：所有应用都用连接池

Postgres 连接昂贵（每个 1-3MB 内存），无池化会在高并发下耗尽连接。用 PgBouncer 之类的池：

- **Transaction 模式**：每个事务后归还连接（多数应用最佳）
- **Session 模式**：整个会话持有连接（预处理语句、临时表需要）

`pool_size` 参考 `(CPU 核数 * 2) + spindle_count`。500 并发用户可共享 10 个真实连接。

### 安全 RLS 性能：把函数包进 SELECT

RLS 策略里直接调 `auth.uid()` 会**每行调用一次**；包进 `(select auth.uid())` 只调一次并缓存，大表 100x+ 提速：

```sql
-- 错误：auth.uid() 每行调用，100 万行调 100 万次
create policy orders_policy on orders
  using (auth.uid() = user_id);

-- 正确：调一次缓存
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);
```

并给 RLS 策略用到的列加索引（如 `create index orders_user_id_idx on orders (user_id);`）。

### 数据访问：消灭 N+1，批量加载

循环里一项一条查询 = N+1。用数组或 JOIN 合成一条（少 10-100x 往返）：

```sql
-- 错误：循环里 N 条查询
-- 正确：一条批量查询
select * from orders where user_id = any(array[1, 2, 3, ...]);
```

## 反模式：别这么做

- **凭记忆写 Supabase 代码**——先查 changelog + 当前文档
- **给暴露 schema 的表不开 RLS**——每张都要开
- **用 `user_metadata` 做授权**——用户可改，改用 `app_metadata`
- **视图不加 `security_invoker`**——默认绕 RLS
- **`TO authenticated` 当授权用**——那只是认证，缺归属判断就是越权（IDOR）
- **UPDATE 策略只写 `USING`**——缺 `WITH CHECK` 能被改归属
- **为解权限错乱加 `SECURITY DEFINER`**——静默移除访问控制
- **本地迭代用 `apply_migration`**——每次写迁移历史，无法迭代，用 `execute_sql`
- **RLS 策略里裸调 `auth.uid()`**——每行一次，包进 `(select auth.uid())`
- **实现完不验证**——「没验证的修复是未完成的修复」

## 下一步

- [参考](./reference) —— 技能清单、安装命令、四域速览、安全清单速查、许可与链接
- 上游：[Supabase AI Skills 文档](https://supabase.com/docs/guides/getting-started/ai-skills)
