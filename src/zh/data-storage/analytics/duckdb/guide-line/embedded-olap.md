---
layout: doc
outline: [2, 3]
---

# 进程内 OLAP：列式与 Parquet/CSV 查询

> 基于 DuckDB 1.x · 核于 2026-08

## 速查

- **进程内架构**：DuckDB 作为库链接进应用进程（Python/Node/R/...），数据在同进程内存流转，无独立服务器、无网络/IPC 开销。
- **与客户端/服务器架构对比**：传统数据库（Postgres/ClickHouse）是独立服务进程，应用经网络/IPC 连接；DuckDB 是进程内库，调用即执行，零往返延迟。
- **列式存储**：数据按列组织，聚合只读目标列，IO 省；DuckDB 的 `.duck` 持久化文件是列式存储。
- **向量化执行**：基于 Apache Arrow 的列向量批处理，SIMD 加速，CPU 缓存友好。
- **Arrow 原生**：DuckDB 内部用 Apache Arrow 内存格式，与 Arrow 生态（Pandas/Polars/Spark）零拷贝互通。
- **直接查文件**：`SELECT * FROM 'data.parquet'` 原地查文件，省 ETL。支持 Parquet/CSV/JSON/Arrow/Excel/glob/HTTP。
- **谓词下推 + 列裁剪**：查文件时只读需要的行（WHERE 下推）与列（SELECT 裁剪），不读整个文件。
- **完整 SQL**：窗口函数、CTE、JSON、复杂聚合、LIST/STRUCT/MAP 类型、日期函数，覆盖分析需求。
- **ACID（有限）**：支持事务（BEGIN/COMMIT），但单写者模型（进程内一个写者），不是高并发事务库。

## 一、进程内架构：库而非服务器

DuckDB 的核心架构差异是**进程内（in-process）**——它是库，不是独立服务器：

```
传统客户端/服务器（Postgres/ClickHouse）：
  应用进程 ──网络/IPC──► 数据库服务器进程 ──► 存储
                          （独立运维、多客户端）

DuckDB 进程内：
  应用进程 ┌──────────────────────┐
           │  应用代码              │
           │  DuckDB 库（链接进来） │ ──► .duck 文件 / 内存
           │  数据在同进程流转       │
           └──────────────────────┘
           （无独立服务器、零网络往返）
```

### 进程内的优势

- **零网络/IPC 开销**：数据在进程内存流转，无往返延迟，单次查询更快。
- **零运维**：无独立服务进程要启动/监控/调优/升级，`import duckdb` 即用。
- **单文件部署**：持久化是单个 `.duck` 文件，拷贝即迁移，像 SQLite。
- **数据本地化**：数据与计算同进程，配合 Pandas/Polars 零拷贝高效。

### 进程内的代价

- **无多客户端并发**：进程内单写者（一个进程写），不适合多客户端高并发共享。
- **无独立服务**：应用崩溃则库随之，不能作为共享数据服务。
- **单机**：无分布式扩展（不像 ClickHouse 分片），受单机资源限制。

## 二、列式存储与向量化执行

DuckDB 的分析性能根基与 ClickHouse 同源：

### 列式存储

```
行存（SQLite/MySQL）：[id,user,amount,time] [id,user,amount,time] ...
列存（DuckDB）：      id 列：[1,2,3,...]
                      amount 列：[100,200,150,...]   ← 聚合 SUM(amount) 只读此列
                      time 列：[...]
```

- 聚合只读目标列，IO 大幅减少（100 列表聚合 1 列，IO 降 99%）。
- 同列类型一致，压缩比高（delta/run-length/LZ4/ZSTD）。
- `.duck` 文件是列式持久化格式。

### 向量化执行（基于 Arrow）

- DuckDB 内部用 **Apache Arrow** 作为内存格式（列式 + 零拷贝）。
- 查询按列向量（一批同类型值，通常 2048 行）批处理。
- CPU 缓存友好（连续同类数据）、SIMD 加速（一条指令处理多值）。
- 与 Arrow 生态（Pandas/Polars/Spark）零拷贝互转。

## 三、直接查文件：省 ETL 的杀手特性

DuckDB 最受欢迎的特性是**直接查文件**，不必先导入：

```sql
-- 直接查 Parquet
SELECT region, SUM(amount) FROM 'sales.parquet' GROUP BY region;

-- 直接查 CSV（自动推断类型）
SELECT * FROM 'logs.csv' WHERE status >= 500 LIMIT 10;

-- 直接查 JSON（json_extract 函数）
SELECT json_extract_string(props, '$.city') AS city FROM 'events.json';

-- glob 查多个文件（按通配符）
SELECT count() FROM 'logs/2026-08-*.parquet' WHERE date = '2026-08-07';

-- 查 HTTP 远程文件
SELECT * FROM 'https://example.com/data.parquet' LIMIT 100;

-- 查 Hive 分区目录
SELECT count() FROM read_parquet('events/*/*/*.parquet', hive_partitioning=1);
```

### 智能下推

查文件时 DuckDB 不是傻读整个文件，而是：

- **谓词下推（Predicate Pushdown）**：WHERE 条件下推到文件扫描，只读符合条件的行（Parquet 的 row group 统计信息辅助跳过）。
- **列裁剪（Column Pruning）**：SELECT 只读需要的列，不读无关列。
- **结果：只读必要数据**，几十 GB 的 Parquet 文件查一列聚合，可能只读几百 MB。

### 支持的文件格式

| 格式 | 说明 |
| --- | --- |
| **Parquet** | 列式，最高效（推荐） |
| **CSV/TSV** | 自动类型推断 |
| **JSON** | 配合 json_extract |
| **Arrow** | 零拷贝 |
| **Excel** | 读 xlsx |

## 四、完整 SQL：分析能力齐全

DuckDB 支持完整 SQL，覆盖分析需求：

```sql
-- 窗口函数
SELECT user_id, time,
  row_number() OVER (PARTITION BY user_id ORDER BY time) AS rn,
  sum(amount) OVER (PARTITION BY user_id ORDER BY time) AS cumsum
FROM orders;

-- CTE（递归/非递归）
WITH active_users AS (
  SELECT user_id FROM events WHERE date = today() GROUP BY user_id
)
SELECT u.name, count(o.id) FROM active_users a JOIN users u USING(user_id) ...;

-- LIST / STRUCT / MAP 复杂类型
SELECT list_agg(event) AS events FROM ...;
SELECT struct_extract(props, 'city') FROM ...;

-- 日期/JSON/URL 函数
SELECT date_trunc('month', time), json_extract(...), regexp_match(...);
```

## 五、持久化与内存模式

DuckDB 两种使用模式：

- **内存模式**：`duckdb.sql(':memory:')` 或默认，数据在内存，进程结束即失。适合临时分析。
- **持久模式**：`duckdb.sql('my.duck')`，数据持久化到 `.duck` 文件，跨进程重启保留。适合应用内嵌库。

两种模式 API 一致，切换只是连接字符串。

## 六、事务（有限 ACID）

DuckDB 支持 ACID 事务（BEGIN/COMMIT/ROLLBACK），但**单写者模型**——同一时刻一个进程写，多个读者并发。这让 DuckDB 有基本事务保证（一致性、持久性），但不是高并发事务库（多客户端高并发写场景用 Postgres/MySQL）。

## 下一步

理解了进程内架构与列式文件查询后，下一步进入 [集成与 API：Pandas/Polars/dbt/MotherDuck](./integration-and-api)——多语言绑定、DataFrame 互转、dbt-duckdb 与 MotherDuck 云协同。
