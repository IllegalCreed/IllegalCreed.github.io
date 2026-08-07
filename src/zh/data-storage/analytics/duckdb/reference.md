---
layout: doc
outline: [2, 3]
---

# 参考：DuckDB API、复杂度与对比速查

> 基于 DuckDB 1.x / MotherDuck · 核于 2026-08

## 速查

- **定位**：进程内列式 OLAP（「分析界的 SQLite」），嵌入式链接进应用，无独立服务器。
- **版本**：DuckDB 1.x（2026），GitHub 40k+ stars，MIT 许可证。
- **核心能力**：列式存储 + 向量化执行 + 标准 SQL + Parquet/CSV 直接查询 + Python/Node/R/Java API。
- **与 SQLite 对比**：同为嵌入式，但 SQLite=OLTP（行存/事务/点查），DuckDB=OLAP（列存/聚合/分析）。
- **与 ClickHouse 对比**：同为列式 OLAP，但 ClickHouse=服务器端（C/S 架构/集群/海量），DuckDB=进程内（无服务器/本地分析/GB-TB）。
- **集成生态**：Pandas/Polars/dbt/Arrow/Fugue 直接互操作；MotherDuck 提供云端托管。

## 一、DuckDB vs SQLite vs ClickHouse 对比

| 维度 | DuckDB | SQLite | ClickHouse |
| --- | --- | --- | --- |
| 架构 | 进程内（嵌入式） | 进程内（嵌入式） | C/S（服务器+集群） |
| 负载 | OLAP（分析聚合） | OLTP（事务点查） | OLAP（海量分析） |
| 存储 | 列式 | 行式 | 列式 |
| 数据量 | GB-TB（本地） | GB（本地） | TB-PB（集群） |
| SQL | 标准 SQL + 扩展 | 标准 SQL | 标准 SQL + 扩展 |
| 许可证 | MIT | 公有领域 | Apache 2.0 |
| 运维 | 零运维（库） | 零运维（库） | 需运维（集群） |

## 二、常用 SQL 速查

```sql
-- 直接查询 Parquet/CSV（无需导入）
SELECT * FROM 'data.parquet' WHERE year = 2026 LIMIT 10;
SELECT * FROM 'sales.csv' GROUP BY region ORDER BY sum(amount) DESC;

-- 创建表（支持丰富类型）
CREATE TABLE events AS SELECT * FROM 'events.parquet';

-- 窗口函数
SELECT user_id, event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) AS rn
FROM events;

-- 近似聚合（DuckDB 特色）
SELECT approx_count_distinct(user_id) FROM events;
SELECT reservoir(amt, 1000) FROM sales;  -- 采样

-- LIST/STRUCT 类型
SELECT list_agg(name) AS all_names FROM users;
SELECT struct_extract(info, 'age') FROM users;

-- 与 Pandas 互操作（Python）
-- SELECT * FROM df（直接查 Pandas DataFrame）
```

## 三、API 速查

### Python

```python
import duckdb

# 直接查 Parquet
result = duckdb.sql("SELECT * FROM 'data.parquet'").df()  # 返回 DataFrame

# 查 Pandas DataFrame
import pandas as pd
df = pd.DataFrame({"x": range(100)})
duckdb.sql("SELECT sum(x) FROM df").show()

# 持久化连接
con = duckdb.connect("my.db")
con.execute("CREATE TABLE t AS SELECT * FROM 'data.csv'")
con.close()
```

### Node.js

```javascript
const duckdb = require("duckdb");
const db = new duckdb.Database("my.db");  // ":memory:" for in-memory
const con = db.connect();
con.all("SELECT * FROM 'data.parquet' LIMIT 10", (err, rows) => {
  console.log(rows);
});

// Promise 风格
const arrow = await db.arrowIPC("SELECT count(*) FROM events");
```

## 四、MotherDuck 云服务

- **MotherDuck**：DuckDB 的云端托管平台，提供协作/共享/弹性资源。
- 本地 DuckDB 无缝接入：`ATTACH 'md:' AS my_db;`
- 适用：团队协作分析、跨数据源联合查询、无需本地大内存。

## 五、易错点清单

- **不是事务数据库**：DuckDB 不适合高频小事务（OLTP），用 SQLite/MySQL/PG。
- **单进程写入**：DuckDB 是进程内数据库，不支持多进程并发写（一个写者）。
- **内存配置**：大数据集查询可能耗尽内存，用 `PRAGMA memory_limit='4GB'` 限制。
- **Parquet 是首选格式**：DuckDB 对 Parquet 做了极致优化（谓词下推/列裁剪），CSV 慢于 Parquet。
- **版本兼容性**：DuckDB 正在快速迭代，不同版本的文件格式可能不兼容（1.x 起更稳定）。
- **与 Polars 的关系**：Polars（DataFrame 库）底层可选用 DuckDB 做 SQL 引擎，两者互补不互斥。

## 六、权威链接

- [DuckDB 官方文档](https://duckdb.org/docs/)
- [DuckDB GitHub](https://github.com/duckdb/duckdb)
- [MotherDuck](https://motherduck.com/)
- [DuckDB vs SQLite 对比](https://duckdb.org/2022/06/24/duckdb-sqlite.html)
- [DuckDB Python API](https://duckdb.org/docs/api/python/overview)
- 本站幻灯片：<a href="/SlideStack/duckdb-slide/" target="_blank">DuckDB</a>
