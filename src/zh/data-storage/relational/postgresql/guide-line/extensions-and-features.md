---
layout: doc
outline: [2, 3]
---

# CTE、窗口函数与扩展生态：pgvector、TimescaleDB、逻辑复制

> 基于 PostgreSQL 17 / 18 · 核于 2026-08

## 速查

- **CTE（公共表表达式）**：`WITH t AS (...) SELECT ... FROM t`，把复杂查询拆成命名子查询，提升可读性。**递归 CTE**（`WITH RECURSIVE`）处理树形/图查询（组织架构、依赖链、路径搜索）极方便。
- **窗口函数**：`OVER (PARTITION BY ... ORDER BY ...)`，不聚合行而给每行附「窗口计算结果」。排名（`ROW_NUMBER`/`RANK`/`DENSE_RANK`/`NTILE`）、累计（`SUM/AVG OVER`）、前后行（`LAG`/`LEAD`）、首末值（`FIRST_VALUE`/`LAST_VALUE`）。
- **pgvector**：AI 向量扩展，`vector` 类型 + `<=>`（余弦）/`<->`（L2）/`<#>`（内积）距离 + HNSW/IVFFlat 索引，让 PG 变向量库（RAG、语义搜索）。
- **TimescaleDB**：时序扩展，**自动分区（hypertable）+ 列式压缩 + 连续聚合**，物联网/监控/金融 tick 场景。
- **PostGIS**：地理空间扩展，点/线/面几何 + `ST_Distance`/`ST_Contains`/`ST_DWithin` + GiST 索引，地图/LBS/地理分析首选。
- **其他常用扩展**：`pg_partman`（自动分区管理）、`pg_stat_statements`（慢查询统计）、`uuid-ossp`（UUID）、`pg_trgm`（模糊匹配/相似度）、`hstore`（键值）、`citext`（大小写不敏感文本）。
- **逻辑复制**：基于**发布/订阅**（Publication/Subscription），复制**表级行变更**（INSERT/UPDATE/DELETE/TRUNCATE）。可跨版本、跨平台、选择性复制——比物理流复制灵活。
- **逻辑复制 vs 流复制**：流复制是**物理块级**（整个集群、二进制一致、必须同版本）；逻辑复制是**逻辑行级**（选择性、跨版本、可写入）。
- **pgbouncer**：PG「一连接一进程」模型下连接多了开销大，pgbouncer 复用后端进程，是**必备连接池**。模式：**session**（会话级，简单）、**transaction**（事务级，复用高，**不支持 prepared statements**）、**statement**（少用）。
- **pg_stat_statements**：记录每条 SQL 的耗时/调用次数/IO，是 PG 调优第一工具，需 `shared_preload_libraries` 启用。

## 一、CTE：公共表表达式与递归

CTE 用 `WITH` 把子查询命名，提升可读性，避免嵌套；递归 CTE 处理层次数据：

### 普通 CTE

```sql
WITH active_users AS (
  SELECT id, name FROM users WHERE status='active'
),
recent_orders AS (
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT u.name, COUNT(o.id) AS order_cnt
FROM active_users u
LEFT JOIN recent_orders o ON o.user_id = u.id
GROUP BY u.name;
```

### 递归 CTE（树形遍历）

```sql
-- 查询部门 1 的整棵子树（含所有后代部门）
WITH RECURSIVE org_tree AS (
  -- 锚点：起点
  SELECT id, name, parent_id, 0 AS depth
  FROM departments WHERE id = 1
  UNION ALL
  -- 递归：基于上一层结果找下一层
  SELECT d.id, d.name, d.parent_id, ot.depth + 1
  FROM departments d
  JOIN org_tree ot ON d.parent_id = ot.id
)
SELECT id, name, depth FROM org_tree ORDER BY depth;
```

- **递归 CTE 三要素**：①锚点（非递归初始查询）；②`UNION [ALL]`；③递归项（引用 CTE 自身）。`UNION ALL` 保留重复（通常安全），`UNION` 去重。
- **典型场景**：组织架构（上下级）、依赖链（包/任务依赖）、路径搜索（最短路径）、物料清单（BOM 展开）。
- **18 的改进**：CTE 默认 `MATERIALIZED`（物化）或 `NOT MATERIALIZED`（内联）可手动指定，优化器选择更可控。

## 二、窗口函数：分析查询利器

窗口函数对「每行」计算一个「窗口内」的聚合/排名，**不折叠行**（与 GROUP BY 不同）：

```sql
SELECT
  name, dept, salary,
  -- 排名
  RANK() OVER (ORDER BY salary DESC) AS salary_rank,
  DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank,
  ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_row,
  -- 累计聚合
  SUM(salary) OVER (PARTITION BY dept ORDER BY hire_date) AS dept_running_total,
  AVG(salary) OVER (PARTITION BY dept) AS dept_avg,
  -- 前后行
  LAG(name, 1) OVER (ORDER BY salary DESC) AS prev_person,
  LEAD(salary, 1) OVER (ORDER BY salary DESC) AS next_salary,
  -- 首末值
  FIRST_VALUE(name) OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_top
FROM employees;
```

| 函数类 | 函数 | 用途 |
| --- | --- | --- |
| **排名** | `ROW_NUMBER`/`RANK`/`DENSE_RANK`/`NTILE` | 行号/排名/密集排名/分桶 |
| **聚合** | `SUM`/`AVG`/`COUNT`/`MIN`/`MAX` `OVER` | 窗口内聚合、累计 |
| **偏移** | `LAG`/`LEAD` | 前/后 N 行的值 |
| **首末** | `FIRST_VALUE`/`LAST_VALUE`/`NTH_VALUE` | 窗口首/末/第 N 值 |
| **分布** | `CUME_DIST`/`PERCENT_RANK`/`PERCENTILE_CONT` | 百分位、累计分布 |

- **`RANK` vs `DENSE_RANK`**：并列第 2 后，`RANK` 跳到第 4，`DENSE_RANK` 是第 3。
- **`OVER` 子句**：`PARTITION BY` 分区（每组独立计算），`ORDER BY` 排序（决定累计/偏移顺序），`ROWS BETWEEN` 指定窗口帧（如「当前行到前 3 行」）。
- **vs GROUP BY**：GROUP BY 把同组折叠成一行；窗口函数保留每行，附加聚合结果——适合「既要明细又要汇总」的报表。

## 三、扩展生态：pgvector / TimescaleDB / PostGIS

PG 的 `CREATE EXTENSION` 是其最独特的护城河，把 PG 变成「多用途库」：

### pgvector（AI 向量检索）

```sql
CREATE EXTENSION vector;
CREATE TABLE docs (id BIGSERIAL PRIMARY KEY, content TEXT, embedding vector(1536));
-- ivfflat 索引（IVF 倒排近似最近邻）
CREATE INDEX ON docs USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
-- 或 hnsw 索引（更准更快，0.5.0+）
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);

-- 查询：余弦相似度最近邻
SELECT content, embedding <=> $1 AS distance    -- <=> 余弦，<-> L2，<#> 内积
FROM docs ORDER BY embedding <=> $1 LIMIT 10;
```

- **用途**：RAG（检索增强生成）、语义搜索、推荐、图像/文本相似度。让 PG 直接当向量库，无需额外引入 Pinecone/Milvus。
- **vs 专用向量库**：pgvector 优势是「与关系数据 JOIN」天然（向量 + 元数据过滤一条 SQL）；超大规模（亿级）仍推荐专用库（Milvus/Qdrant）。

### TimescaleDB（时序数据）

```sql
CREATE EXTENSION timescaledb;
-- 把普通表变 hypertable（按时间自动分区）
SELECT create_hypertable('metrics', 'time');
-- 连续聚合（自动维护 rollup）
CREATE MATERIALIZED VIEW metrics_hourly WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', time) AS bucket, device_id, AVG(value)
  FROM metrics GROUP BY bucket, device_id;
-- 列式压缩（老数据）
ALTER TABLE metrics SET (timescaledb.compress, timescaledb.compress_segmentby='device_id');
SELECT compress_chunk(c) FROM show_chunks('metrics') c WHERE c < NOW() - INTERVAL '7 days';
```

- **用途**：物联网传感器、监控指标、金融 tick、应用日志——写多读少、按时间查询/聚合。
- **三大能力**：①**自动分区**（hypertable，按时间切片，查询自动裁剪）；②**列式压缩**（10-90× 压缩老数据）；③**连续聚合**（自动维护时序 rollup）。

### PostGIS（地理空间）

```sql
CREATE EXTENSION postgis;
CREATE TABLE places (id SERIAL PRIMARY KEY, name TEXT, loc GEOGRAPHY(POINT, 4326));
CREATE INDEX ON places USING GIST(loc);

-- 附近 1 公里的咖啡店（按距离排序）
SELECT name, ST_Distance(loc, ST_MakePoint(116.4, 39.9)::geography) AS dist
FROM places
WHERE ST_DWithin(loc, ST_MakePoint(116.4, 39.9)::geography, 1000)  -- 1000 米内
ORDER BY loc <-> ST_MakePoint(116.4, 39.9)::geography;             -- KNN 最近邻
```

- **用途**：地图应用、LBS（附近的人/店）、物流路径、地理分析（行政区划、热力图）。
- **核心**：`GEOGRAPHY`/`GEOMETRY` 类型 + `ST_*` 函数（距离、包含、相交、缓冲）+ GiST 索引（空间查询加速）。

### 其他常用扩展

| 扩展 | 用途 |
| --- | --- |
| `pg_partman` | 自动分区管理（比原生 declarative partitioning 更省心） |
| `pg_stat_statements` | 慢查询统计（每条 SQL 耗时/次数/IO），调优第一工具 |
| `uuid-ossp` | UUID 生成（`uuid_generate_v4()`）；PG 13+ 也可用内置 `gen_random_uuid()` |
| `pg_trgm` | 模糊匹配/相似度（`%`/`<->`/`similarity()`），比 LIKE 快 |
| `hstore` | 键值类型（JSONB 之前的方案，部分场景仍用） |
| `citext` | 大小写不敏感文本类型 |
| `pgcrypto` | 加密函数（`crypt`/`digest`） |

## 四、逻辑复制：发布/订阅

PG 复制分两种：

| 类型 | 粒度 | 跨版本 | 选择性 | 写入从库 |
| --- | --- | --- | --- | --- |
| **流复制**（物理） | 整个集群（块级） | ❌ 必须同版本 | ❌ 全量 | ❌（只读备库） |
| **逻辑复制** | 表级行变更 | ✅ | ✅ 部分 | ✅（可写） |

逻辑复制流程：

```sql
-- 发布端（源库）
CREATE PUBLICATION pub_all FOR ALL TABLES;
-- 或只发布部分表
CREATE PUBLICATION pub_users FOR TABLE users, orders;

-- 订阅端（目标库）
CREATE SUBSCRIPTION sub_users
  CONNECTION 'host=source dbname=mydb user=repl'
  PUBLICATION pub_users;
```

- **典型场景**：①**版本升级**（蓝绿——新版本订阅旧版本，切换流量）；②**ETL/数据仓库**（OLTP → OLAP）；③**多租户/分片**（不同租户数据复制到不同库）；④**缓存刷新**（PG → Redis/Elasticsearch）。
- **限制**：只复制 DML（INSERT/UPDATE/DELETE/TRUNCATE），不复制 DDL（schema 变更要手动同步）；表必须有 PRIMARY KEY 或 REPLICA IDENTITY；不支持大对象/序列。
- **17/18 改进**：逻辑复制槽故障转移、行级过滤、列级过滤、双向逻辑复制更成熟。

## 五、pgbouncer：连接池中间件

PG 的进程模型是「一个连接一个后端进程」（fork），连接数多了进程开销大、调度重：

- **pgbouncer** 作为代理，**复用后端进程**：应用 1000 连接 → pgbouncer → 复用到 PG 后端 50-100 个进程。
- **三种池化模式**：

| 模式 | 复用粒度 | 复用率 | 限制 |
| --- | --- | --- | --- |
| **session** | 会话级（连接断开才归还） | 低 | 无（最兼容） |
| **transaction** | 事务级（事务结束即归还） | **高（推荐）** | **不支持 prepared statements、SET 会话变量、临时表** |
| **statement** | 语句级 | 极高 | 不支持多语句事务 |

- **transaction 模式的坑**：很多 ORM（Prisma/TypeORM）默认用 prepared statements，配 pgbouncer transaction 模式会报错——需在连接串加 `?pgbouncer=true` 或关闭 prepared statements。PG 18 + pgbouncer 1.22+ 已支持 transaction 模式下的 prepared statements（协议级），缓解此坑。
- **配置要点**：`max_client_conn`（前端连接数，可几千）、`pool_mode=transaction`、`default_pool_size`（每个 db/user 的后端连接数，如 25）。

## 六、调优第一工具：pg_stat_statements

```sql
-- 启用（需 shared_preload_libraries='pg_stat_statements' 重启）
CREATE EXTENSION pg_stat_statements;

-- 找最耗时的 SQL
SELECT query, calls, total_exec_time, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 10;

-- 找 IO 大的 SQL
SELECT query, shared_blks_read + shared_blks_hit AS blks, calls
FROM pg_stat_statements ORDER BY blks DESC LIMIT 10;
```

- **`total_exec_time`/`mean_exec_time`**：总/平均耗时。**`calls`**：调用次数。**`rows`**：影响行数。**`shared_blks_*`**：缓冲块读写。
- **配合 EXPLAIN (ANALYZE, BUFFERS)**：pg_stat_statements 找到慢 SQL，EXPLAIN ANALYZE 看执行计划与实际耗时，定位瓶颈。

## 下一步

CTE、窗口函数与扩展生态讲完后，可回到[参考](../reference)查阅索引类型速查、JSONB 操作符、扩展清单、与 MySQL 对比及易错点清单。
