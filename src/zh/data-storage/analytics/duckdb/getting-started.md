---
layout: doc
outline: [2, 3]
---

# 入门：进程内 OLAP 与 DuckDB

> 基于 DuckDB 1.x / MotherDuck · 核于 2026-08

## 速查

- **DuckDB 定义**：**进程内（in-process）列式 OLAP 数据库**，被誉为「分析界的 SQLite」——像 SQLite 一样嵌入式链接进应用进程（无独立服务器），但针对分析型查询（OLAP）做列式优化。
- **进程内（in-process）**：DuckDB 作为库直接链接进应用进程（Python `import duckdb`、Node `require('duckdb')`），数据在同一进程内存流转，无网络/IPC 开销，无独立服务进程要运维。
- **「分析界 SQLite」类比**：SQLite 是进程内 OLTP（事务、点查、行存）；DuckDB 是进程内 OLAP（分析聚合、列存、向量化）。同样的嵌入式哲学，不同的工作负载。
- **列式 + 向量化**：与 ClickHouse 同源理念——按列存储、向量化执行（批处理列向量，SIMD 加速）、高压缩比，本地分析 GB-TB 数据秒级。
- **直接查 Parquet/CSV**：杀手特性。`SELECT * FROM 'data.parquet'` 直接查文件，不必先导入数据库，省去 ETL。支持 Parquet/CSV/JSON/Arrow/Web 数据源。
- **数据科学生态集成**：与 **Pandas/Polars** DataFrame 零拷贝互转，**dbt-duckdb** 做本地数据管道，Python/R 原生深度绑定。
- **标准 SQL**：完整 SQL（窗口函数、CTE、JSON、复杂聚合、LIST/STRUCT 类型），兼容大部分分析需求。
- **多语言绑定**：Python、R、Node.js、Java、Go、Rust、C/C++ 等。
- **MotherDuck**：官方云服务，协作式 DuckDB（云端协同 + GUI + 与本地 DuckDB 无缝），让团队共享数据集与查询。
- **典型场景**：本地数据探索分析（替代远程数仓）、应用内嵌 BI、dbt 本地管道、原型验证、日志/数据文件即时分析。
- **规模边界**：单机嵌入式，适合 GB-TB 级；PB 级或高并发多用户共享场景需上云数仓（ClickHouse/BigQuery/Snowflake）。

## 一、为何需要「进程内 OLAP」

数据科学家/分析师做数据分析的传统路径：把数据从业务库（MySQL）或文件（CSV/Parquet）**导到远程数仓**（BigQuery/Snowflake/Redshift），再写 SQL 查询。痛点：

1. **搬数据麻烦**：CSV/Parquet 要先 LOAD/ETL 到数仓，几 GB 到几十 GB 上传慢。
2. **远程查询有延迟**：每次查询走网络，本地迭代分析（频繁试查询）延迟累加。
3. **数仓有成本**：远程数仓按存储/查询付费，个人探索/小团队成本高。
4. **环境切换**：在 Python（Pandas）与 SQL（数仓）间来回切，数据反复搬运。

DuckDB 的解法：**把分析能力嵌进本地进程**。`import duckdb; duckdb.sql('SELECT ... FROM data.parquet')` 在本地直接查文件，无网络、无 ETL、无服务器、零成本。这正是「分析界 SQLite」的价值——SQLite 让 OLTP 嵌入应用（手机 App/浏览器本地库），DuckDB 让 OLAP 嵌入分析流程（Python notebook/本地 BI/原型）。

## 二、与 SQLite 的类比：嵌入式哲学

DuckDB 的设计哲学直接对标 SQLite，但工作负载不同：

| 维度 | SQLite（OLTP） | DuckDB（OLAP） |
| --- | --- | --- |
| 哲学 | 进程内嵌入式，零部署 | 同（进程内嵌入式，零部署） |
| 工作负载 | OLTP（事务、点查、取整行） | OLAP（分析聚合、大范围扫描） |
| 存储 | 行存 + B 树 | **列存 + 向量化** |
| 优势 | 短事务、点查、随机更新 | 聚合扫描、列式压缩、向量化 |
| 典型场景 | App 本地库、配置、小事务 | 数据分析、BI、文件查询 |
| 部署 | 单文件库 | 单文件库 |

共同点：进程内、单文件、零配置、无服务器、SQL 接口。差异：OLTP（行存）vs OLAP（列存）。

## 三、列式与向量化：本地分析快的根基

DuckDB 性能根基与 ClickHouse 同源：

- **列式存储**：按列存储，聚合只读目标列（100 列聚合 1 列 IO 降 99%）。
- **高压缩比**：同列数据类型一致，delta/run-length/LZ4/ZSTD 编码，压缩比高。
- **向量化执行**：查询按列向量（一批同类型值）批处理，CPU 缓存友好、SIMD 加速。

结果：本地（笔记本/单机）对 GB-TB 级数据做聚合分析，秒级返回——无需远程数仓的算力。

## 四、直接查文件：杀手特性

DuckDB 不必先把数据导入数据库，可直接查文件：

```sql
-- 直接查 Parquet 文件
SELECT region, SUM(amount) FROM 'sales.parquet' GROUP BY region;

-- 直接查 CSV
SELECT * FROM 'logs.csv' WHERE status = 500;

-- 直接查 JSON
SELECT json_extract(props, '$.city') FROM 'events.json';

-- 通配符查多个文件（按文件名 glob）
SELECT count() FROM 'logs/2026-08/*.parquet';

-- 查 HTTP 远程文件
SELECT * FROM 'https://example.com/data.parquet';
```

- **省 ETL**：不必先 LOAD/导入，文件原地查，分析即用。
- **支持格式**：Parquet、CSV、JSON、Arrow、Excel 等。
- **glob 模式**：`'logs/2026-08/*.parquet'` 一次查整月日志文件。
- **智能下推**：只读需要的列与行（谓词下推 + 列裁剪），不读整个文件。

## 五、数据科学生态集成

DuckDB 与数据科学生态深度集成，是其流行关键：

- **Pandas 互转**：`duckdb.sql('SELECT ... FROM df')` 直接查 Pandas DataFrame（零拷贝，Arrow 转换）；结果可 `df()` 转 Pandas。
- **Polars 互转**：与 Polars（另一个快速 DataFrame）互转，结合两者优势。
- **Arrow 原生**：DuckDB 内部用 Apache Arrow，与 Arrow 生态零拷贝互通。
- **Python/R 深度绑定**：`import duckdb` 即用，无需驱动配置；R 同理。

这让 DuckDB 成为 Python 数据分析栈的「SQL 加速器」——在 notebook 里用 SQL 做复杂聚合（比 Pandas 语法更声明式），结果转回 DataFrame 可视化。

## 六、MotherDuck：协作式 DuckDB

DuckDB 是单机的，MotherDock 是其官方云服务：

- **云端协同**：团队共享数据集与查询，云端存储 + 协作。
- **与本地无缝**：本地 DuckDB 可连 MotherDuck，查询云端数据像查本地。
- **友好 GUI**：可视化查询界面、数据集管理、分享。
- **混合执行**：本地数据 + 云端数据可联合查询。

适合：团队协作分析、共享数据集、需要持久云端存储的场景。个人本地探索用开源 DuckDB 即可。

## 七、何时用、何时不用

| 场景 | 是否合适 | 原因 |
| --- | --- | --- |
| 本地数据探索分析 | ✅ 极合适 | 进程内零部署，直接查文件 |
| 应用内嵌 BI / 报表 | ✅ 合适 | 嵌入应用，无独立服务 |
| dbt 本地数据管道 | ✅ 合适 | dbt-duckdb 轻量 ETL |
| Pandas/Polars 加速 SQL | ✅ 合适 | 零拷贝互转 |
| PB 级超大规模分析 | ❌ 不合适 | 单机嵌入式，用 ClickHouse/BigQuery |
| 多用户高并发共享 | ❌ 不合适 | 进程内单写者，用 Postgres/数仓 |
| 业务事务库 | ❌ 不合适 | OLAP 列存，事务弱，用 MySQL/PG |

## 下一步

理解了进程内 OLAP 定位后，下一步深入 [进程内 OLAP：列式与 Parquet/CSV 查询](./guide-line/embedded-olap)（架构细节、列存向量化、文件查询机制）与 [集成与 API：Pandas/Polars/dbt/MotherDuck](./guide-line/integration-and-api)（多语言 API、DataFrame 互转、dbt 与云协同）。
