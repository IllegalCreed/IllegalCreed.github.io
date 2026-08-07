---
layout: doc
outline: [2, 3]
---

# 入门：PostgreSQL、MVCC、索引与扩展生态

> 基于 PostgreSQL 17 / 18 · 核于 2026-08

## 速查

- **定义**：PostgreSQL（Postgres）是**功能最强大的开源关系库**，学术严谨 + 功能完备 + 扩展生态，被誉为「最像商业数据库的开源库」。源于 1986 年伯克利 POSTGRES 项目。
- **版本**：**17**（2024，主流稳定，性能与逻辑复制成熟）、**18**（2025，逻辑复制增强、虚拟生成列、异步 I/O 改进）。版本每年 9-10 月发布一个 major。
- **MVCC 差异**：PG 的 MVCC 是「**每行多版本**」——UPDATE 实际是「标记旧行已死 + 插入新行」，旧行（dead tuple）靠 **VACUUM** 清理。与 MySQL（undo log 回滚段）实现不同，PG 无回滚段膨胀问题，但需 VACUUM。
- **索引类型**：①**B-tree**（默认，等值/范围/排序）；②**GIN**（倒排，加速 JSONB/数组/全文检索，`@>`/`?`）；③**GiST**（空间/R-树，PostGIS 用它）；④**BRIN**（块范围摘要，海量有序数据极省空间）；⑤**SP-GiST**（空间分区树）。
- **JSONB**：二进制 JSON，自动校验 + 去重 + 保序，配合 **GIN 索引**与 `@>`（包含）/`?`（键存在）/`->`/`->>` 操作符，让 PG 成为「关系+文档」混合存储标杆。比 MySQL JSON 功能更强。
- **CTE**：`WITH ... AS (...)` 公共表表达式，**支持递归**（`WITH RECURSIVE`），处理树形/图查询极方便。18 起默认用 MATERIALIZED 物化语义可选。
- **窗口函数**：`OVER (PARTITION BY ... ORDER BY ...)`，做排名（`ROW_NUMBER`/`RANK`/`DENSE_RANK`）、累计（`SUM(...) OVER(...)`）、前后行（`LAG`/`LEAD`）等分析，无需自连接。
- **扩展生态**：`CREATE EXTENSION` 即装即用。`pgvector`（AI 向量）、`TimescaleDB`（时序）、`PostGIS`（地理）、`pg_partman`（自动分区）、`pg_stat_statements`（慢查询统计）、`uuid-ossp`。
- **逻辑复制**：基于**发布/订阅**（Publication/Subscription），复制**表级别**变更（非整个集群），可跨版本、跨平台、选择性复制——比 MySQL 的物理复制（流复制）灵活。
- **连接池 pgbouncer**：PG 进程模型是「一个连接一个进程」，连接多了进程开销大。pgbouncer 复用后端进程，是 PG 必备中间件。注意**事务模式**下不支持 prepared statements。
- **ACID 与隔离级别**：默认 **READ COMMITTED**（注意与 MySQL 默认 RR 不同）；PG 还支持 SERIALIZABLE（真正的可串行化，SSI 实现）。
- **进阶顺序**：[MVCC 与索引类型](./guide-line/mvcc-and-indexes) → [CTE、窗口函数与扩展生态](./guide-line/extensions-and-features) → [参考](./reference)。

## 一、PostgreSQL 是什么：功能最强大的开源关系库

PostgreSQL 用 SQL 把数据组织成表（行+列），承诺 ACID。但它的设计哲学与 MySQL 不同：

- **学术严谨**：源于 Stonebraker（图灵奖）的 POSTGRES 研究，SQL 标准遵循度最高，事务语义严格，数据类型极其丰富（原生支持数组、JSON、UUID、范围类型、地理类型）。
- **功能完备**：窗口函数、CTE（含递归）、物化视图、生成列、部分索引、表达式索引、排除约束……复杂查询能力是开源库中最强的。
- **扩展生态**：`CREATE EXTENSION` 让第三方把 PG 变成「向量库/时序库/GIS 库/分布式库」，这是 PG 最独特的护城河。
- **被「抄袭」最多的内核**：CockroachDB、YugabyteDB（兼容 PG 协议）、Supabase、Neon、Amazon Aurora PG、阿里云 PolarDB-PG、Greenplum（MPP）——都基于或兼容 PG。

竞品定位：相比 **MySQL**（成熟稳定、运维资料多、生态大），PG **功能更强、更严谨、扩展更丰富**，但运维门槛略高、招人略难。重度 JSON/分析/地理/AI 场景选 PG；纯 OLTP Web 应用两者皆可，MySQL 略常见。

## 二、版本与发布节奏

| 版本 | 发布年 | 关键特性 | 状态 |
| --- | --- | --- | --- |
| **17** | 2024 | 逻辑复制改进、SQL/JSON 路径、增量备份、内存上下文优化 | **主流稳定** |
| **18** | 2025 | 逻辑复制槽同步、虚拟生成列、异步 I/O 改进、OAuth 认证 | 最新 |
| 16 | 2023 | 逻辑复制双向、并行查询增强 | 维护 |
| 15 | 2022 | 逻辑复制行级过滤、MERGE 语句 | 维护 |

- **每年一个 major**：每年 9-10 月发布，社区支持 5 年。新项目选最新稳定版（当前 17/18）。
- **云厂商滞后**：AWS RDS/阿里云通常比社区版晚 3-6 个月支持新 major。

## 三、MVCC：每行多版本 + VACUUM

PG 的 MVCC 实现与 MySQL 根本不同：

| 维度 | PostgreSQL | MySQL（InnoDB） |
| --- | --- | --- |
| 多版本存哪 | **每行多版本**（同一表内，UPDATE 标记旧行 + 插新行） | undo log 回滚段 |
| 旧版本清理 | **VACUUM**（autovacuum 后台进程） | purge 线程 |
| 回滚段膨胀 | 无此问题 | 长事务致 undo 膨胀 |
| 大缺点 | dead tuples 占表空间，需 VACUUM（表膨胀） | undo 膨胀 |

- **UPDATE = DELETE + INSERT**：PG 的 UPDATE 不是原地改，而是把旧行标记为「已死」（xmax），插入新行——所以频繁更新的表会「膨胀」（dead tuples 占空间）。
- **VACUUM**：清理 dead tuples，回收空间（不一定还给 OS，但可重用）。`autovacuum` 默认开启，但大表/高写入可能跟不上，需调参（`autovacuum_vacuum_scale_factor`）或定期 `VACUUM FULL`（锁表重建）。
- **隔离级别默认 READ COMMITTED**：与 MySQL 默认 REPEATABLE READ 不同。PG 还支持真正的 SERIALIZABLE（基于 SSI，可串行化快照隔离）。

## 四、索引类型：不止 B+ 树

PG 的索引体系是开源库中最丰富的：

| 索引类型 | 结构 | 适用 | 典型场景 |
| --- | --- | --- | --- |
| **B-tree**（默认） | B+ 树 | 等值/范围/排序 | `WHERE id=?`、`BETWEEN`、`ORDER BY` |
| **GIN** | 倒排索引 | 多值/包含查询 | JSONB `@>`、数组 `&&`、全文 `@@` |
| **GiST** | 平衡树 + R-树 | 空间/范围/最近邻 | PostGIS 地理、范围重叠 |
| **BRIN** | 块范围摘要 | 海量有序数据 | 时间序列（按时间排序的大表） |
| **SP-GiST** | 空间分区树 | 非平衡数据 | IP 路由、电话区号、kd-树 |
| **Hash** | 哈希表 | 仅等值（不支持范围） | 简单等值（少用） |

- **GIN 是 JSONB/全文/数组的杀手锏**：`CREATE INDEX idx ON t USING GIN(attrs)`，让 `WHERE attrs @> '{"k":"v"}'` 高效。
- **BRIN 极省空间**：只为每个数据块存「最小/最大值摘要」，1TB 时序数据索引可能只有几 MB。前提是数据物理有序（如按时间写入）。
- **部分索引**：`CREATE INDEX ON t(col) WHERE active=true`，只索引满足条件的行，省空间、提查询。

## 五、JSONB：关系+文档混合存储

JSONB 是二进制 JSON（解析后存储），与 JSON（文本存储）不同——JSONB 支持 GIN 索引、操作更高效：

```sql
CREATE TABLE product (
  id BIGSERIAL PRIMARY KEY,
  attrs JSONB
);
CREATE INDEX idx_attrs ON product USING GIN(attrs);

INSERT INTO product(attrs) VALUES ('{"brand":"Apple","tags":["phone","5G"],"price":7999}');

SELECT * FROM product WHERE attrs @> '{"brand":"Apple"}';     -- 包含
SELECT attrs->>'brand', attrs->'price' FROM product;          -- 取值
SELECT * FROM product WHERE attrs ? 'tags';                   -- 键存在
SELECT * FROM product WHERE attrs @> '{"tags":["5G"]}';       -- 数组包含
```

- **操作符**：`@>`（包含）、`?`（键存在）、`?|`/`?&`（任一/全部键）、`->`（取 JSON 值）、`->>`（取文本）、`#>`（路径）。
- **vs MySQL JSON**：PG JSONB + GIN 更强——`@>`包含查询走索引极快；MySQL JSON 要靠函数索引，功能略弱。

## 六、CTE 与窗口函数

- **CTE（公共表表达式）**：`WITH t AS (...) SELECT ... FROM t`，把复杂查询拆成命名子查询。**递归 CTE**（`WITH RECURSIVE`）处理树形/图（如组织架构、依赖链）极方便：
  ```sql
  WITH RECURSIVE org AS (
    SELECT id, name, parent_id FROM dept WHERE id = 1        -- 锚点
    UNION ALL
    SELECT d.id, d.name, d.parent_id FROM dept d JOIN org o ON d.parent_id = o.id  -- 递归
  )
  SELECT * FROM org;                                         -- 整棵子树
  ```
- **窗口函数**：`OVER (PARTITION BY ... ORDER BY ...)`，不聚合行而是给每行一个「窗口计算结果」。排名/累计/前后行：
  ```sql
  SELECT name, salary,
    RANK() OVER (ORDER BY salary DESC) AS rk,                -- 薪资排名
    SUM(salary) OVER (PARTITION BY dept) AS dept_total,      -- 部门薪资累计
    LAG(name, 1) OVER (ORDER BY salary) AS prev_person       -- 前一名是谁
  FROM employees;
  ```

## 七、扩展生态、逻辑复制与 pgbouncer

- **扩展（Extensions）**：`CREATE EXTENSION pgvector;` 即装即用，是 PG 最独特的护城河：
  - **pgvector**：AI 向量检索（`<=>` 余弦、`<->` L2、HNSW/IVFFlat 索引），让 PG 变向量库。
  - **TimescaleDB**：时序数据自动分区 + 压缩 + 连续聚合，物联网/监控场景。
  - **PostGIS**：地理空间（点/线/面、`ST_Distance`、`ST_Contains`），地图/LBS 首选。
  - **pg_partman**：自动分区管理；**pg_stat_statements**：慢查询统计；**uuid-ossp**：UUID 生成。
- **逻辑复制**：基于**发布/订阅**（`CREATE PUBLICATION` / `CREATE SUBSCRIPTION`），复制**表级别**行变更。可跨版本、跨平台、选择性复制（只复制部分表/列），比 MySQL 的物理流复制（整个集群）灵活——常用于版本升级（蓝绿）、ETL、多租户。
- **pgbouncer**：PG 进程模型是「一个连接一个后端进程」，连接多了 fork/调度开销大。pgbouncer 作为连接池代理，**复用后端进程**，是 PG 必备。注意三种池化模式：**session**（会话级，最简单）、**transaction**（事务级，复用率高，但**不支持 prepared statements**）、**statement**（语句级，少用）。

## 下一步

理解了 PostgreSQL 的全貌后，下一步深入两个核心——[MVCC 与索引类型](./guide-line/mvcc-and-indexes)（每行多版本与 VACUUM、B-tree/GIN/GiST/BRIN 选型）与[CTE、窗口函数与扩展生态](./guide-line/extensions-and-features)（递归 CTE、窗口函数、pgvector/timescaledb/postgis、逻辑复制与 pgbouncer）。
