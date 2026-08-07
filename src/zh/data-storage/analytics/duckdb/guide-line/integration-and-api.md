---
layout: doc
outline: [2, 3]
---

# 集成与 API：Pandas/Polars/dbt/MotherDuck

> 基于 DuckDB 1.x / MotherDuck · 核于 2026-08

## 速查

- **Python API**：`import duckdb; duckdb.sql('SELECT ...')`，零配置，结果可转 Pandas/Polars/Arrow。
- **Node.js API**：`const duckdb = require('duckdb')`，Promise/callback 风格，适合 JS/TS 后端内嵌分析。
- **DataFrame 零拷贝互转**：基于 Apache Arrow，DuckDB 与 Pandas/Polars/Arrow Table 无序列化开销互转。
- **查 DataFrame**：`duckdb.sql('SELECT * FROM df')` 直接对 Pandas/Polars DataFrame 跑 SQL（不复制数据）。
- **dbt-duckdb**：dbt 的 DuckDB adapter，本地轻量数据管道（ETL），用 SQL 做转换，结果存 DuckDB。
- **MotherDuck**：官方云服务，协作式 DuckDB——云端存储 + 团队协同 + GUI + 与本地无缝集成。
- **多语言绑定**：Python、R、Node.js、Java、Go、Rust、C/C++ 等，API 风格统一。
- **典型集成栈**：DuckDB + Pandas/Polars（分析）+ dbt（管道）+ MotherDuck（协作）。

## 一、Python API：数据科学首选

Python 是 DuckDB 最主要的绑定，专为数据科学流程优化：

```python
import duckdb
import pandas as pd

# 1. 直接查 Parquet 文件
result = duckdb.sql("SELECT region, SUM(amount) FROM 'sales.parquet' GROUP BY region").df()
# .df() 把结果转 Pandas DataFrame

# 2. 对 Pandas DataFrame 跑 SQL（零拷贝，不复制数据）
df = pd.read_csv('data.csv')
big = duckdb.sql("SELECT * FROM df WHERE amount > 1000 ORDER BY amount DESC").df()

# 3. 持久化库
con = duckdb.connect('analytics.duck')
con.execute("CREATE TABLE sales AS SELECT * FROM 'sales.parquet'")
con.sql("SELECT ... FROM sales").df()
```

### 关键特性

- **`duckdb.sql()` 全局函数**：无需显式连接，便捷查询。
- **`.df()` / `.arrow()` / `.pl()`**：结果一键转 Pandas/Arrow/Polars。
- **零拷贝互转**：基于 Arrow，DuckDB 与 DataFrame 共享内存，无序列化。
- **查 DataFrame**：`FROM df` 直接引用 Python 变量，DuckDB 不复制数据即可查询。

这让 DuckDB 成为 Pandas 的「SQL 加速器」——复杂聚合/JOIN 用 SQL（声明式、可读），结果转 DataFrame 可视化。

## 二、Node.js API：后端内嵌分析

Node.js 绑定适合在 JS/TS 后端内嵌分析：

```js
const duckdb = require('duckdb');

const db = new duckdb.Database('analytics.duck');  // 或 ':memory:'
db.all("SELECT region, SUM(amount) AS total FROM 'sales.parquet' GROUP BY region",
  (err, rows) => {
    if (err) throw err;
    console.log(rows);  // [{region:'east',total:...}, ...]
  });

// Promise 风格（推荐）
const con = await db.connect();
const rows = await con.all('SELECT ... FROM sales WHERE ...');
```

- **应用场景**：Node 后端内嵌 BI（直接查文件出报表）、本地数据分析工具、CLI 分析工具。
- **同步/异步**：API 支持 callback 与 Promise，避免阻塞事件循环。
- **与 Node 生态**：结果直接是 JS 对象，配合 Express 做 API、配合前端框架做仪表盘。

## 三、Pandas / Polars / Arrow 零拷贝互转

DuckDB 基于 Apache Arrow，与 DataFrame 生态零拷贝互通：

```python
import duckdb
import pandas as pd
import polars as pl

# Pandas → DuckDB（零拷贝，FROM df 不复制）
pdf = pd.DataFrame({'a': [1,2,3], 'b': [4,5,6]})
duckdb.sql('SELECT sum(a) FROM pdf').df()

# DuckDB → Pandas（.df() 零拷贝）
duckdb.sql("SELECT * FROM 'f.parquet'").df()

# Polars 互转（.pl()）
duckdb.sql('SELECT ... FROM polars_df').pl()

# Arrow Table 互转
duckdb.sql('SELECT ... FROM arrow_table').arrow()
```

- **零拷贝原理**：DuckDB 与 Pandas/Polars/Arrow 都用列式内存（Arrow），转换是元数据交换而非数据复制。
- **混合编程**：在 SQL（声明式聚合）与 DataFrame（过程式转换）间自由切换，各取所长。

## 四、dbt-duckdb：本地数据管道

dbt（data build tool）是流行的数据转换工具，dbt-duckdb 是其 DuckDB 适配器：

```bash
pip install dbt-duckdb
```

```sql
-- models/sales_summary.sql（dbt 模型，SQL 转换）
{{ config(materialized='table') }}
SELECT region, date_trunc('month', date) AS month, SUM(amount) AS total
FROM {{ ref('stg_sales') }}
GROUP BY region, month
```

- **本地轻量 ETL**：用 SQL 写转换逻辑，dbt 管理依赖与执行，结果存 DuckDB 文件。
- **无需数仓**：个人/小团队的数据管道，不必部署 BigQuery/Snowflake，本地 DuckDB 跑。
- **结合文件源**：stg 模型可从 Parquet/CSV 读，转换后物化为 DuckDB 表。
- **与 dbt 生态**：复用 dbt 的测试、文档、 lineage 能力。

## 五、MotherDuck：协作式云 DuckDB

MotherDuck 是 DuckDB 官方云服务：

- **云端存储 + 协同**：团队共享数据集与查询，云端持久存储。
- **与本地无缝**：本地 DuckDB 连 MotherDuck，查云端数据像查本地（`ATTACH 'md:'`）。
- **友好 GUI**：可视化查询界面、数据集管理、分享、协作。
- **混合执行**：本地数据 + 云端数据联合查询（本地 join 云端）。
- **场景**：团队协作分析、共享数据集、需要持久云端存储；个人本地探索用开源 DuckDB。

```python
# 连 MotherDuck（需 token）
con = duckdb.connect('md:')
con.sql('SELECT * FROM my_cloud_dataset').df()
```

## 六、其他语言绑定

DuckDB 提供多语言绑定，API 风格统一：

| 语言 | 绑定 | 典型场景 |
| --- | --- | --- |
| **Python** | `duckdb`（官方） | 数据科学、分析、notebook |
| **R** | `duckdb`（CRAN） | 统计分析、R 用户 |
| **Node.js** | `duckdb`（npm） | JS/TS 后端、CLI 工具 |
| **Java** | `duckdb_jdbc` | JVM 后端、Spark 集成 |
| **Go** | `duckdb-go` | Go 后端 |
| **Rust** | `duckdb-rs` | Rust 应用 |
| **C/C++** | 原生 | 嵌入式系统、底层集成 |

所有绑定共享同一个核心引擎（C++ 实现），性能与 SQL 语法一致。

## 七、典型集成栈

```
数据源（Parquet/CSV/业务库）
        │
        ▼
   DuckDB（进程内列式引擎）
   ├── Pandas/Polars（DataFrame 分析）
   ├── dbt（SQL 转换管道）
   ├── Node/Python 应用（内嵌 BI）
   └── MotherDuck（云端协作）
```

## 下一步

掌握集成与 API 后，可进入 [参考](../reference) 查阅 DuckDB vs SQLite/ClickHouse 对比、SQL 与函数速查、多语言绑定与易错点清单。
