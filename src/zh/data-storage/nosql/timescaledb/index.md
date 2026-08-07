---
layout: doc
---

# TimescaleDB

**TimescaleDB** 是基于 **PostgreSQL** 的**时序数据库扩展**——不另起炉灶，而是以 Postgres 扩展形式提供时序能力，让你在一个数据库里同时拥有关系库的 ACID 事务、丰富 SQL、生态，与时序库的高吞吐写入、时间窗口聚合、自动分区。它的核心抽象是 **hypertable（超表）**：对用户呈现为一张普通 Postgres 表，底层自动按**时间（必要）+ 可选空间维度（如设备 ID 哈希）**切成多个 **chunk（数据块）**，分布存储与查询，写入与查询对时间范围扫描高度优化。两大杀手锏是**连续聚合（Continuous Aggregates）**——预计算并物化时间窗口聚合（如每分钟/每小时均值），查询趋势时直接读物化结果，快几个数量级；与**压缩（Compression）**——按列式编码压缩历史数据，压缩比常达 10-20 倍，省存储且加速扫描。配合**数据保留策略（retention）**自动过期老数据，构成完整的时序生命周期管理。2025 年 Timescale 公司将其时序业务整体重构为新一代产品 **TigerData**（仍基于 Postgres，引入更现代的架构与云原生能力），原 TimescaleDB 开源版进入维护模式，但核心概念（hypertable/连续聚合/压缩）仍是理解其产品线的钥匙。与专用时序库 **InfluxDB** 相比，TimescaleDB 的哲学是「**复用 Postgres 生态**」——你已有的 Postgres 技能、工具（pgAdmin/DBeaver）、ORM、BI、复制备份方案全部可用，时序只是「加一层扩展」，而非学一套全新系统。

## 评价

**优点**

- **复用 Postgres 全生态**：ACID 事务、完整 SQL、JSON/PostGIS、复制/备份/监控工具、ORM、BI 全部可用，学习迁移成本极低
- **hypertable 透明分区**：对用户是一张普通表，底层自动按时间（+空间）切 chunk，写入与时间范围查询高效
- **连续聚合预计算**：物化时间窗口聚合，趋势查询毫秒级返回，且自动增量刷新
- **压缩省存储**：列式编码压缩历史 chunk，10-20 倍压缩比，加速扫描且降成本
- **关系与时序一体**：一个库既存业务表又存时序数据，可 JOIN，避免多库数据孤岛

**缺点**

- **依赖 Postgres 单一内核**：扩展受限于 Postgres 架构（写入瓶颈、连接模型），超大规模（千万级 series）不及专用 TSDB
- **压缩 chunk 只读**：压缩后的历史 chunk 不可直接更新/删除，需先解压，写后读场景有摩擦
- **TigerData 转型不确定性**：原开源版维护放缓，企业版与 TigerData 的功能边界、授权变化需持续关注
- **资源占用高**：Postgres 本身偏重，小规模时序场景相比轻量 TSDB 显臃肿

## 本叶地图

- [入门](./getting-started) —— 时序场景、Postgres 扩展路线、hypertable 概念、连续聚合与压缩、数据保留、TigerData 转型、与 InfluxDB 对比
- [hypertable 与连续聚合：压缩与分区](./guide-line/hypertable-and-aggregation) —— hypertable 的 chunk 切分、连续聚合的物化与增量刷新、压缩的列式编码、数据保留策略
- [对比与 TigerData：与 InfluxDB 的取舍](./guide-line/comparison-and-tigerdata) —— TimescaleDB vs InfluxDB 的哲学差异、TigerData 收购与产品线演进、选型建议
- [参考](./reference) —— hypertable/连续聚合/压缩速查、TimescaleDB vs InfluxDB 对比表、易错点清单

## 幻灯片地址

<a href="/SlideStack/timescaledb-slide/" target="_blank">TimescaleDB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=TimescaleDB" target="_blank" rel="noopener noreferrer">TimescaleDB 测试题</a>
