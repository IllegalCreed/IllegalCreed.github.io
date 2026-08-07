---
layout: doc
---

# DuckDB

**DuckDB** 是被誉为「**分析界的 SQLite**」的**进程内（in-process）列式 OLAP 数据库**——像 SQLite 一样以嵌入式库的形式直接链接进应用进程，无需独立服务器，但针对**分析型查询**（OLAP）做了列式优化。它的核心定位是：在本地（或单机）对中等规模数据（GB 到 TB 级）做高速分析查询，特别擅长**直接查询 Parquet/CSV 文件**（不必先导入），以及与 **Pandas/Polars/dbt** 等数据科学生态深度集成。DuckDB 的存储引擎是**列式 + 向量化执行**（与 ClickHouse 同源理念），用标准 SQL 查询，支持复杂聚合、JOIN、窗口函数。典型场景：数据科学家在本地用 Python/R 加载数据后做探索分析（替代把数据导到远程数仓）；应用内嵌分析（BI 报表、本地仪表盘）；**dbt-duckdb** 本地数据管道（轻量 ETL）。官方还提供 **MotherDuck** 云服务（协作式 DuckDB，云端协同 + 友好 GUI），让团队共享数据集与查询。DuckDB 提供 **Python、R、Node.js、Java、Go、Rust** 等多语言绑定，单文件部署、零配置、开箱即用，是个人分析、原型验证、嵌入式 BI 的轻量首选。

## 评价

**优点**

- **进程内零部署**：像 SQLite 一样链接进应用，单文件、零配置、无服务器，开箱即用
- **列式向量化分析快**：与 ClickHouse 同源的列存+向量化，本地分析 GB-TB 数据秒级
- **直接查 Parquet/CSV**：不必先导入，`SELECT * FROM 'data.parquet'` 直接查文件，省去 ETL
- **数据科学生态深度集成**：Pandas/Polars DataFrame 零拷贝互转、dbt-duckdb 本地管道、R/Python 原生绑定
- **标准 SQL + 多语言绑定**：完整 SQL（窗口/JSON/聚合）+ Python/R/Node/Java/Go/Rust 绑定

**缺点**

- **单机嵌入式，无分布式**：不是 ClickHouse/Spark 那样的分布式引擎，超大规模（PB）需上云数仓
- **无多用户并发写入**：进程内单写者模型，不适合多客户端高并发事务场景
- **无服务器高可用**：嵌入式无独立服务进程，应用崩溃则库随应用，不适合做共享数据服务
- **生态较新**：相对 SQLite/Postgres 历史短，部分边缘特性与运维资料在积累中

## 本叶地图

- [入门](./getting-started) —— 进程内 OLAP 定位、「分析界 SQLite」、列式优势、直接查 Parquet/CSV、数据科学生态、MotherDuck、典型场景
- [进程内 OLAP：列式与 Parquet/CSV 查询](./guide-line/embedded-olap) —— 进程内架构、列存与向量化、直接查文件（Parquet/CSV/JSON）、与 SQLite 对比
- [集成与 API：Pandas/Polars/dbt/MotherDuck](./guide-line/integration-and-api) —— Python/Node.js API、与 Pandas/Polars 零拷贝互转、dbt-duckdb、MotherDuck 云协同
- [参考](./reference) —— DuckDB vs SQLite/ClickHouse 对比、SQL 与函数速查、多语言绑定、易错点清单

## 幻灯片地址

<a href="/SlideStack/duckdb-slide/" target="_blank">DuckDB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=DuckDB" target="_blank" rel="noopener noreferrer">DuckDB 测试题</a>
