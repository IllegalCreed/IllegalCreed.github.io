---
layout: doc
outline: [2, 3]
---

# 入门：Postgres 扩展路线的时序方案

> 基于 TimescaleDB 2.x / TigerData · 核于 2026-08

## 速查

- **TimescaleDB 定义**：基于 **PostgreSQL** 的**时序数据库扩展**——以 Postgres 扩展形式提供时序能力，一个库同时拥有关系库 ACID/SQL/生态与时序库的高吞吐写入/时间聚合。
- **核心理念**：**复用 Postgres 生态**，而非另起炉灶。你已有的 Postgres 技能、工具（pgAdmin/DBeaver）、ORM、BI、复制备份全部可用，时序只是「加一层扩展」。
- **hypertable（超表）**：核心抽象。对用户呈现为一张普通 Postgres 表，底层自动按**时间（必要）+ 可选空间维度（如 device_id 哈希）**切分成多个 **chunk（数据块）**，分布存储，写入与时间范围查询高效。
- **chunk（数据块）**：hypertable 的物理存储单元，每个 chunk 对应一段时间（+一段空间）的数据，是自动分区、压缩、过期删除的基本单位。
- **连续聚合（Continuous Aggregates）**：**预计算并物化**时间窗口聚合（如每分钟/每小时均值），查询趋势时直接读物化结果，比实时聚合快几个数量级，且自动增量刷新。
- **压缩（Compression）**：把历史 chunk 按列式编码压缩（delta/run-length），压缩比常达 **10-20 倍**，省存储且加速扫描；压缩后 chunk 只读，更新需先解压。
- **数据保留（retention）**：按时间自动删除老 chunk（如保留 30 天），避免磁盘膨胀。
- **TigerData 转型**：2025 年 Timescale 公司将时序业务重构为 **TigerData**（仍基于 Postgres，云原生新架构），原 TimescaleDB 开源版进入维护模式，核心概念延续。
- **vs InfluxDB**：TimescaleDB = 复用 Postgres 生态（关系+时序一体）；InfluxDB = 专用时序引擎（3.x 用 SQL/Parquet/Arrow）。哲学不同：一个「加扩展」，一个「造新轮子」。
- **适合场景**：已有 Postgres 技术栈、需要时序+关系 JOIN、中大规模时序、看重 SQL/工具生态。

## 一、为何选 Postgres 扩展路线

时序数据库市场有两大流派：

| 流派 | 代表 | 哲学 |
| --- | --- | --- |
| **专用时序引擎** | InfluxDB、QuestDB | 另起炉灶，为时序从存储到查询层全面定制 |
| **关系库扩展** | **TimescaleDB**、Cassandra（时序用法） | 复用成熟关系库（Postgres）内核，加时序能力 |

TimescaleDB 选 Postgres 扩展路线，核心动机是**生态复用**：

1. **学习成本最低**：开发者已会 Postgres SQL，时序只是 `create_hypertable()` 一个函数调用，无需学新查询语言（对比 InfluxDB 的 Flux/InfluxQL）。
2. **工具链全复用**：pgAdmin、DBeaver、psql、备份（pg_dump/pg_basebackup）、复制（流复制/逻辑复制）、监控（pg_stat_statements）——全部可用。
3. **应用集成零摩擦**：ORM（SQLAlchemy/Hibernate/Prisma）、连接池（PgBouncer）、应用框架，全按 Postgres 对接。
4. **关系 + 时序一体**：一个库既存业务表（用户/订单）又存时序表（指标），可 JOIN——避免「业务在 MySQL、指标在 InfluxDB」的数据孤岛与跨库同步。
5. **ACID 与强一致**：继承 Postgres 的 MVCC 与事务，时序写入也是事务安全的（专用 TSDB 通常弱化事务）。

代价是受限于 Postgres 架构（进程模型、写入路径），超大规模（千万级 series、极高写入）时专用引擎（InfluxDB 3.x 的 Parquet/Arrow）可能更有优势。

## 二、hypertable：透明的分区表

**hypertable** 是 TimescaleDB 的核心抽象——对用户是一张普通表，底层自动分区：

```
                用户视角
              ┌──────────┐
              │ metrics  │  ← 一张普通 Postgres 表
              │ (超表)    │     SELECT/INSERT 照常
              └────┬─────┘
                   │ create_hypertable 自动分区
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │ chunk1 │ │ chunk2 │ │ chunk3 │  ← 按 时间(+空间) 切分
   │ 8月1周 │ │ 8月2周 │ │ 8月3周 │     每个chunk是物理存储单元
   └────────┘ └────────┘ └────────┘
```

- **时间维度（必要）**：所有 hypertable 必须按时间分区（如每周一个 chunk），这是时序数据按时间组织的基础。
- **空间维度（可选）**：再加一个空间分区键（如 `device_id` 哈希），把同一时间的不同设备散到多个 chunk，提升并行写入能力。
- **chunk 是基本单位**：每个 chunk 对应一段时间（+空间）的数据。**压缩、过期删除、连续聚合刷新都以 chunk 为粒度**——整个 chunk 一起压缩/删除，开销低。
- **透明性**：用户写 `INSERT INTO metrics ...`、`SELECT ... FROM metrics WHERE time > ...`，hypertable 自动路由到对应 chunk，无需关心分区细节。

## 三、连续聚合：预计算物化趋势

时序数据的核心查询是「**按时间窗口聚合**」（过去 1 小时每分钟均值、本月每天 QPS）。实时聚合要扫描全量原始点，慢。**连续聚合（Continuous Aggregates）**预计算并物化这些聚合：

```
原始 hypertable（每秒一个点）       连续聚合视图（物化每分钟均值）
  ┌──────────────────┐              ┌──────────┐
  │ 12:00:01 val=10  │              │          │
  │ 12:00:02 val=12  │  ─预计算─►   │ 12:00    │
  │ ...              │   物化       │ avg=11   │  （60 个原始点 → 1 个物化点）
  │ 12:00:60 val=11  │              │          │
  └──────────────────┘              └──────────┘
```

- **物化（Materialized）**：聚合结果实际存下来（不是每次查询现算），查询趋势时直接读物化表，毫秒级返回。
- **自动增量刷新**：新数据写入后，连续聚合**只刷新受影响的窗口**（增量），不必全量重算，开销低。
- **多层级联**：原始 → 1 分钟聚合 → 1 小时聚合 → 1 天聚合，每层物化，不同时间范围查不同粒度。
- **与降采样的区别**：连续聚合是 TimescaleDB 的特有名词，本质就是物化的降采样视图。

## 四、压缩与数据保留

### 压缩（Compression）

历史 chunk 按列式编码压缩：

- **列式编码**：同一列的相邻值用 delta（差值）/run-length（游程）等编码，时序数据相邻值相似，压缩比常达 **10-20 倍**。
- **按 chunk 压缩**：整个历史 chunk 一起压缩（通常压缩超过 N 天的 chunk），压缩后**只读**——更新/删除需先解压。
- **省存储 + 加速扫描**：压缩后磁盘占用大降，且列式压缩的数据扫描时 IO 更少（只读需要的列），分析更快。

### 数据保留（retention）

- **自动过期删除**：按时间自动删除老 chunk（如保留 30 天原始 + 1 年连续聚合），避免磁盘膨胀。
- **以 chunk 为粒度**：删除是整 chunk 删（DROP），开销远低于逐行删。
- **与连续聚合协同**：原始数据短期保留 + 连续聚合长期保留，存储与查询两不误。

## 五、TigerData 转型

2025 年 Timescale 公司战略调整：

- **新品牌 TigerData**：将时序业务重构为 **TigerData**（仍基于 Postgres），引入更现代的架构（云原生、存算分离、更好的扩展性）与企业特性。
- **原 TimescaleDB 开源版**：进入**维护模式**（接受 bugfix，新功能主要进 TigerData），核心概念（hypertable/连续聚合/压缩）在 TigerData 中延续。
- **对用户的影响**：已有 TimescaleDB 部署可继续用；新项目可评估 TigerData；学习核心概念不会过时（TigerData 继承）。

## 六、与 InfluxDB 的哲学差异

| 维度 | TimescaleDB | InfluxDB |
| --- | --- | --- |
| 路线 | Postgres 扩展 | 专用时序引擎 |
| 查询语言 | 标准 SQL（Postgres 方言） | 3.x SQL / 1.x InfluxQL / 2.x Flux |
| 生态 | 复用 Postgres 全生态 | 自建生态（TIG 栈） |
| 事务 | ACID（继承 Postgres） | 弱（时序追加为主） |
| 关系 JOIN | 强（与业务表 JOIN） | 弱 |
| 底层存储 | Postgres 堆表 + chunk | 3.x Parquet 列存 |
| 适合 | 已有 Postgres、关系+时序一体 | 纯时序、监控/IoT、规模极大 |

## 下一步

理解了 TimescaleDB 的扩展路线与核心抽象后，下一步深入 [hypertable 与连续聚合：压缩与分区](./guide-line/hypertable-and-aggregation)（chunk 切分、连续聚合物化、压缩编码）与 [对比与 TigerData：与 InfluxDB 的取舍](./guide-line/comparison-and-tigerdata)（哲学差异、TigerData 演进、选型）。
