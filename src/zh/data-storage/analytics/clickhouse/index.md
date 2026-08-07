---
layout: doc
---

# ClickHouse

**ClickHouse** 是 Yandex（现 Yandex Cloud）开源的**列式分析型数据库（OLAP DBMS）**——专为海量数据的分析聚合查询设计，单机即可每秒扫描**数亿行**，集群能冲到**10 亿行/秒**。它的核心是**列式存储引擎**：数据按列而非按行存储，聚合时只读目标列，IO 与 CPU 都省；配合**高压缩比**（同列数据类型一致，delta/run-length/LZ4/ZSTD 编码，常达 5-15 倍）和**向量化执行**（按批处理列向量，SIMD 加速），在 OLAP 场景碾压行存关系库（MySQL/PG 做分析聚合慢几个数量级）。ClickHouse 的存储基础是 **MergeTree 家族**引擎——按主键排序、按分区（partition）组织、后台异步合并（merge）数据片段（data part），兼顾写入吞吐与查询效率；衍生出 `ReplacingMergeTree`（去重）、`SummingMergeTree`（预聚合求和）、`AggregatingMergeTree`（聚合状态）等针对不同场景的变体。横向扩展靠**分片（shard）+ 复制（replica）**：分片把数据水平切到多节点并行查询，复制保证高可用。两大杀手锏是**物化视图（Materialized View）**——预计算并物化聚合结果（类似 TimescaleDB 连续聚合），查询趋势直接读物化表；与**近似查询**——用采样、HyperLogLog（基数估计）、quantile 算法等在毫秒级返回近似结果，精度换速度。ClickHouse 用**标准 SQL**（兼容大部分 ANSI SQL + 扩展函数），支持**Serverless**（ClickHouse Cloud 存算分离、按用量付费），是**产品分析（漏斗/留存）、日志分析、监控指标、广告/营销分析**等 OLAP 场景的顶级选择。

## 评价

**优点**

- **极致分析性能**：列存 + 向量化 + 高压缩，单机数亿行/秒，集群 10 亿行/秒，OLAP 场景碾压行存
- **MergeTree 引擎家族**：按主键排序+分区+异步合并，写入吞吐与查询效率兼顾，变体覆盖去重/聚合等场景
- **物化视图预计算**：预聚合加速重复查询，与原表自动同步增量
- **近似查询**：HyperLogLog/采样/quantile，毫秒级近似结果，精度换速度适合海量数据
- **标准 SQL + 生态**：兼容 ANSI SQL，JDBC/ODBC/HTTP/原生协议，BI（Superset/Metabase/Tableau）直连

**缺点**

- **不适合事务与点更新**：无强 ACID 事务，点查（按主键取单行）弱，随机更新/删除代价高（ALTER 异步 mutation）
- **JOIN 相对弱**：分布式 JOIN 是性能瓶颈（需 shuffle/广播），复杂多表关联不如关系库
- **运维复杂**：集群（分片+复制+ZooKeeper/Keeper）配置与调优门槛高，副本同步、合并、mutation 要监控
- **资源占用大**：列存与向量化吃 CPU/内存，小规模场景「杀鸡用牛刀」

## 本叶地图

- [入门](./getting-started) —— OLAP vs OLTP、列式存储优势、ClickHouse 定义、MergeTree 家族、分片复制、物化视图、近似查询、Serverless、典型场景
- [列式存储与 MergeTree：分片与复制](./guide-line/columnar-and-mergetree) —— 列式存储与向量化、MergeTree 的 part/合并、ReplacingMergeTree 等变体、分片与复制（Distributed/ReplicatedTable）
- [用例与 SQL：物化视图、近似查询与 Serverless](./guide-line/use-cases-and-sql) —— 物化视图预聚合、近似查询（HyperLogLog/采样/quantile）、标准 SQL、产品分析/日志/指标场景、ClickHouse Cloud
- [参考](./reference) —— MergeTree 引擎家族对比、聚合/近似函数速查、分布式架构、易错点清单

## 幻灯片地址

<a href="/SlideStack/clickhouse-slide/" target="_blank">ClickHouse</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ClickHouse" target="_blank" rel="noopener noreferrer">ClickHouse 测试题</a>
