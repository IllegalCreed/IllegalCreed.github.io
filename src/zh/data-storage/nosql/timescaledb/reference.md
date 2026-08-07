---
layout: doc
outline: [2, 3]
---

# 参考：TimescaleDB 速查与易错点

> 基于 TimescaleDB 2.x / TigerData · 核于 2026-08

## 速查

- **定义**：基于 PostgreSQL 的时序数据库扩展，复用 Postgres 生态，关系+时序一体。
- **核心理念**：加扩展而非造新轮子——Postgres 技能/工具/ORM/BI 全可用。
- **hypertable**：对用户是普通表，底层自动按时间（+可选空间）切 chunk 分区。`create_hypertable()` 创建。
- **chunk**：物理存储单元，对应一段时间（+空间）数据；压缩/删除/刷新都以 chunk 为粒度。
- **连续聚合**：预计算并物化时间窗口聚合（`time_bucket`），自动增量刷新，趋势查询毫秒级。
- **压缩**：历史 chunk 列式编码（delta/run-length），压缩比 10-20 倍，省存储+加速扫描；压缩后只读。
- **数据保留**：按时间自动删老 chunk（整 chunk DROP，开销低）。
- **TigerData**：2025 年 Timescale 公司新品牌，仍基于 Postgres，云原生+存算分离+更强扩展；原开源版进维护模式。
- **vs InfluxDB**：TimescaleDB 复用 Postgres 生态（ACID/JOIN/工具）；InfluxDB 专用引擎（Parquet/Arrow）大规模时序更优。
- **高基数**：TimescaleDB 受 Postgres 限制，需控制 tag 基数；InfluxDB 有 series 爆炸坑。

## 一、核心概念速查

| 概念 | 作用 | 关键点 |
| --- | --- | --- |
| **hypertable** | 时序表（对用户透明） | `create_hypertable('t','time')` |
| **chunk** | 物理存储单元 | 时间（+空间）分区 |
| **time_bucket** | 时间窗口函数 | 比 `date_trunc` 灵活，任意间隔 |
| **连续聚合** | 物化预计算 | 自动增量刷新 |
| **压缩** | 列式编码压缩 | 10-20x，压缩后只读 |
| **retention** | 自动过期删除 | 整 chunk DROP |

### 常用 SQL 速查

```sql
-- 创建 hypertable
SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '7 days');

-- 连续聚合（物化每分钟均值）
CREATE MATERIALIZED VIEW metrics_1m WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', time) AS bucket, device_id, AVG(cpu)
FROM metrics GROUP BY bucket, device_id;

-- 启用压缩 + 策略（超 7 天压缩）
ALTER TABLE metrics SET (timescaledb.compress, timescaledb.compress_segmentby = 'device_id');
SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- 数据保留（超 30 天删除）
SELECT add_retention_policy('metrics', INTERVAL '30 days');
```

## 二、TimescaleDB vs InfluxDB 对比

| 维度 | TimescaleDB | InfluxDB |
| --- | --- | --- |
| 路线 | Postgres 扩展 | 专用时序引擎 |
| 查询语言 | 标准 SQL（Postgres） | 3.x SQL / InfluxQL / Flux |
| 底层存储 | Postgres 堆表 + chunk | 3.x Parquet + Arrow |
| 事务 | **ACID** | 弱 |
| 关系 JOIN | **强** | 弱 |
| 生态 | 复用 Postgres 全生态 | TIG 栈 |
| 极大规模 | 受 Postgres 限制 | 3.x 更优 |
| 学习成本 | 极低（会 Postgres） | 中 |
| 降采样/物化 | 连续聚合（自动增量） | Task 降采样任务 |
| 压缩 | chunk 列式编码（10-20x） | Parquet 列存（10-50x） |

## 三、TigerData 演进要点

- **2025 年新品牌**：Timescale 公司时序业务重构为 TigerData。
- **仍基于 Postgres**：内核延续，核心概念（hypertable/连续聚合/压缩）继承。
- **架构升级**：云原生、存算分离、更强水平扩展。
- **原开源版**：维护模式（bugfix + 兼容性），新功能主要进 TigerData。
- **过渡**：已有部署可继续用，长期可评估迁移；学习核心概念不过时。

## 四、易错点清单

- **「TimescaleDB 是独立数据库」**：错。它是 **PostgreSQL 扩展**，必须先有 Postgres，时序能力通过扩展提供。
- **「hypertable 和普通表完全一样」**：对用户透明（SQL 一样），但底层是分区的，且压缩后只读——不能把压缩 chunk 当普通表随便更新。
- **「连续聚合是普通视图」**：错。连续聚合是**物化**视图（结果存盘），且自动增量刷新，不是每次现算。
- **「压缩的 chunk 可以直接更新」**：错。压缩后**只读**，更新/删除需先 `decompress_chunk` 解压。
- **「TimescaleDB 一定能跑赢 InfluxDB」**：错。极大规模（千万 series、极高写入）时 InfluxDB 3.x 的专用列存引擎常更优；TimescaleDB 受 Postgres 进程模型限制。
- **「TimescaleDB 无事务」**：错。它继承 Postgres 的 **ACID** 事务，时序写入也是事务安全的——这是它相对 InfluxDB 的优势之一。
- **「chunk_time_interval 越小越好」**：错。chunk 太小 → chunk 数量爆炸、元数据多、查询跨太多 chunk；太大 → 单 chunk 扫描慢。经验：每个 chunk 约 25% 主存大小。
- **「连续聚合会实时同步」**：连续聚合是**异步增量刷新**（有延迟），不是强实时。需要实时数据查原始表。
- **「TigerData 和 TimescaleDB 无关」**：错。TigerData 是 Timescale 公司时序业务的新品牌，仍基于 Postgres，核心概念延续。
- **「TimescaleDB 不需要控制 tag 基数」**：错。Postgres 索引也受高基数影响（B+ 树膨胀），需合理设计索引列。
- **「time_bucket 和 date_trunc 完全一样」**：不完全。`time_bucket` 支持任意间隔（如 37 秒、13 分钟），`date_trunc` 只支持标准单位（秒/分/时/天）。

## 五、进阶方向（链接其他叶）

- [InfluxDB](../influxdb/) —— 专用时序引擎路线，与 TimescaleDB 对比
- [PostgreSQL](../../relational/postgresql/) —— TimescaleDB 的内核基础
- [ClickHouse](../../analytics/clickhouse/) —— 列式分析库，大范围时序分析
- [DuckDB](../../analytics/duckdb/) —— 进程内列式 OLAP

## 权威链接

- [TimescaleDB 官方文档](https://docs.timescale.com/)
- [TimescaleDBhypertable 文档](https://docs.timescale.com/use-timescale/latest/hypertables/)
- [Continuous Aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/)
- [Compression](https://docs.timescale.com/use-timescale/latest/compression/)
- [TigerData](https://www.tigerdata.com/)
- [Timescale Blog](https://www.timescale.com/blog)
- 本站幻灯片：<a href="/SlideStack/timescaledb-slide/" target="_blank">TimescaleDB</a>
