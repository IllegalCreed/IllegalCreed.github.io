---
layout: doc
outline: [2, 3]
---

# 参考：PostgreSQL 索引、JSONB、扩展与对比速查

> 基于 PostgreSQL 17 / 18 · 核于 2026-08

## 速查

- **PostgreSQL 定义**：功能最强大的开源关系库，学术严谨 + 功能完备 + 扩展生态，被誉为「最像商业数据库的开源库」。
- **版本**：**17**（2024 主流稳定）、**18**（2025 最新）。每年 9-10 月一个 major，社区支持 5 年。
- **MVCC**：每行多版本（UPDATE = 标记旧行已死 + 插新行），无回滚段膨胀，但需 VACUUM 清理 dead tuples（表膨胀）。
- **默认隔离级别**：READ COMMITTED（与 MySQL 的 RR 不同）；支持真 SERIALIZABLE（SSI）。
- **索引**：B-tree（默认）/ GIN（JSONB/数组/全文）/ GiST（空间）/ BRIN（块范围，海量有序）/ SP-GiST / Hash。
- **JSONB**：二进制 JSON + GIN 索引，`@>`包含查询高效，强于 MySQL JSON。
- **CTE/窗口函数**：`WITH`（含递归）+ `OVER()`，复杂分析查询能力强。
- **扩展**：pgvector（向量）/ TimescaleDB（时序）/ PostGIS（地理）/ pg_stat_statements（慢查询）。
- **逻辑复制**：发布/订阅，表级行变更，可跨版本/选择性/写入从库。
- **pgbouncer**：必备连接池，transaction 模式复用高但不支持 prepared statements（PG 18+ 缓解）。

## 一、索引类型速查

| 类型 | 结构 | 适用 | 典型场景 |
| --- | --- | --- | --- |
| **B-tree**（默认） | B+ 树 | 等值/范围/排序/唯一 | `=`/`<`/`BETWEEN`/`ORDER BY`/`LIKE 'x%'` |
| **GIN** | 倒排索引 | 多值/包含 | JSONB `@>`、数组 `&&`、全文 `@@` |
| **GiST** | 平衡树+R-树 | 空间/范围/最近邻 | PostGIS、范围重叠、KNN |
| **BRIN** | 块范围摘要 | 海量有序数据 | 时间序列（min/max 摘要） |
| **SP-GiST** | 空间分区树 | 非平衡数据 | IP 路由、电话区号 |
| **Hash** | 哈希表 | 仅等值 | 少用（B-tree 通常够） |

## 二、JSONB 操作符速查

| 操作符 | 含义 | 示例 |
| --- | --- | --- |
| `->` | 取 JSON 值（返回 JSONB） | `'{"a":1}'::jsonb -> 'a'` → `1` |
| `->>` | 取文本（返回 text） | `'{"a":1}'::jsonb ->> 'a'` → `'1'` |
| `#>` / `#>>` | 路径取值/文本 | `'{"a":{"b":1}}' #> '{a,b}'` |
| `@>` | 包含（左含右） | `'{"a":1,"b":2}' @> '{"a":1}'` → `t` |
| `<@` | 被包含 | — |
| `?` | 键/数组元素存在 | `'{"a":1}' ? 'a'` → `t` |
| `?\|` | 任一键存在 | — |
| `?&` | 全部键存在 | — |
| `\|\|` | 拼接 | `'[1,2]'::jsonb \|\| '[3]'` → `[1,2,3]` |
| `-` | 删键 | `'{"a":1,"b":2}' - 'a'` → `{"b":2}` |

```sql
CREATE INDEX idx_attrs ON product USING GIN(attrs jsonb_path_ops);  -- jsonb_path_ops 更小快，仅 @>
SELECT * FROM product WHERE attrs @> '{"brand":"Apple"}';            -- GIN 加速
```

## 三、窗口函数速查

| 类别 | 函数 | 用途 |
| --- | --- | --- |
| **排名** | `ROW_NUMBER()`/`RANK()`/`DENSE_RANK()`/`NTILE(n)` | 行号/排名/密集排名/分桶 |
| **聚合** | `SUM()`/`AVG()`/`COUNT()`/`MIN()`/`MAX()` `OVER(...)` | 窗口聚合、累计 |
| **偏移** | `LAG(col,n)`/`LEAD(col,n)` | 前/后 N 行值 |
| **首末** | `FIRST_VALUE()`/`LAST_VALUE()`/`NTH_VALUE()` | 窗口首/末/第 N 值 |
| **分布** | `CUME_DIST()`/`PERCENT_RANK()`/`PERCENTILE_CONT()` | 百分位、累计分布 |

- `RANK` 并列后跳号（1,2,2,4）；`DENSE_RANK` 不跳（1,2,2,3）；`ROW_NUMBER` 不并列（1,2,3,4）。
- `OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN ... AND ...)` 控制窗口帧。

## 四、常用扩展清单

| 扩展 | 用途 | 安装 |
| --- | --- | --- |
| **pgvector** | AI 向量检索（`<=>`余弦/`<->`L2 + HNSW/IVFFlat） | `CREATE EXTENSION vector;` |
| **TimescaleDB** | 时序（hypertable 自动分区 + 压缩 + 连续聚合） | `CREATE EXTENSION timescaledb;` |
| **PostGIS** | 地理空间（`ST_*` + GiST） | `CREATE EXTENSION postgis;` |
| **pg_partman** | 自动分区管理 | `CREATE EXTENSION pg_partman;` |
| **pg_stat_statements** | 慢查询统计（需 shared_preload_libraries） | `CREATE EXTENSION pg_stat_statements;` |
| **uuid-ossp** | UUID 生成（PG 13+ 可用内置 `gen_random_uuid()`） | `CREATE EXTENSION "uuid-ossp";` |
| **pg_trgm** | 模糊匹配/相似度 | `CREATE EXTENSION pg_trgm;` |
| **hstore** | 键值类型 | `CREATE EXTENSION hstore;` |
| **citext** | 大小写不敏感文本 | `CREATE EXTENSION citext;` |
| **pgcrypto** | 加密（`crypt`/`digest`） | `CREATE EXTENSION pgcrypto;` |

## 五、逻辑复制 vs 流复制

| 维度 | 流复制（物理） | 逻辑复制 |
| --- | --- | --- |
| 粒度 | 整个集群（块级） | 表级行变更 |
| 跨版本 | ❌ 必须同版本 | ✅ |
| 选择性 | ❌ 全量 | ✅ 部分 |
| 从库可写 | ❌ 只读备库 | ✅ |
| DDL 复制 | ✅ | ❌（手动同步 schema） |
| 典型场景 | 高可用（主备）、读副本 | 版本升级、ETL、多租户 |

## 六、PostgreSQL vs MySQL 对比

| 维度 | PostgreSQL | MySQL |
| --- | --- | --- |
| **定位** | 功能最强、最严谨 | 成熟稳定、生态大 |
| **MVCC** | 每行多版本 + VACUUM | undo log 回滚段 |
| **默认隔离** | READ COMMITTED | REPEATABLE READ |
| **索引** | B-tree+GIN+GiST+BRIN+SP-GiST | 主要 B+ 树 + 全文 + 空间 |
| **JSON** | JSONB + GIN（更强） | JSON + 函数索引（够用） |
| **扩展生态** | CREATE EXTENSION（pgvector 等） | 插件机制弱 |
| **CTE/窗口** | 全（含递归 CTE） | 8.0+ 支持（无递归） |
| **复制** | 流复制 + 逻辑复制 | binlog + GTID + MGR |
| **连接池** | pgbouncer（必备） | 客户端池（HikariCP） |
| **运维资料** | 略少 | 极丰富 |
| **云托管** | RDS PG / Aurora PG / Supabase / Neon | RDS MySQL / PolarDB（更主流） |

## 七、易错点清单

- **「PG 默认隔离级别是 REPEATABLE READ」**：错。PG 默认 **READ COMMITTED**（与 MySQL 默认 RR 不同），迁移要注意。
- **「PG 的 RR 有幻读」**：错。PG 的 RR 实际是「快照隔离」，已防幻读（比 SQL 标准 RR 更强），但仍有写偏序异常——SERIALIZABLE（SSI）才彻底解决。
- **「JSON 和 JSONB 一样」**：错。JSON 是文本存储（保序、保留重复键），JSONB 是二进制（去重、不保序、支持 GIN）。查询用 JSONB。
- **「VACUUM 是浪费时间」**：错。PG 的 MVCC 产生 dead tuples，不 VACUUM 会表膨胀、查询变慢。autovacuum 必须开。
- **「GIN 索引哪里都能用」**：错。GIN 用于多值列（JSONB/数组/全文）；普通等值/范围用 B-tree。GIN 构建慢、占空间大。
- **「BRIN 适合所有大表」**：错。BRIN 要求数据物理有序（如时间序列），无序数据 min/max 范围太宽过滤不掉，效果差。
- **「逻辑复制能复制 DDL」**：错。逻辑复制只复制 DML（INSERT/UPDATE/DELETE/TRUNCATE），DDL（建表/改表）要手动同步两边 schema。
- **「pgbouncer transaction 模式支持 prepared statements」**：传统不支持（Prisma/TypeORM 默认 prepared 会报错），PG 18 + pgbouncer 1.22+ 才在协议级支持。
- **「PG 没有 SERIALIZABLE」**：错。PG 用 SSI（可串行化快照隔离）实现真正的 SERIALIZABLE，冲突时抛 `40001` 让应用重试。
- **「UPDATE 是原地修改」**：错。PG 的 UPDATE 是「标记旧行已死 + 插新行」，会产生 dead tuple——频繁更新的表要关注 VACUUM。
- **「CTE 一定物化」**：不精确。12 之前默认物化；12+ 优化器可内联（`MATERIALIZED`/`NOT MATERIALIZED` 可手动指定）。
- **「递归 CTE 会无限循环」**：可能。递归 CTE 要有终止条件（递归项结果为空时停止），有环数据要加 `LIMIT` 或访问标记防环。

## 八、进阶方向（链接其他叶）

- [MySQL](../../mysql/) —— 成熟稳定的对照，本站 quiz-backend 跑在它上
- [SQLite](../../sqlite/) —— 嵌入式零运维，移动端/PWA
- 本站幻灯片：<a href="/SlideStack/postgresql-slide/" target="_blank">PostgreSQL</a>

## 权威链接

- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/17/indexes-types.html)
- [JSON Functions and Operators](https://www.postgresql.org/docs/17/functions-json.html)
- [pgvector](https://github.com/pgvector/pgvector)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- 本站幻灯片：<a href="/SlideStack/postgresql-slide/" target="_blank">PostgreSQL</a>
