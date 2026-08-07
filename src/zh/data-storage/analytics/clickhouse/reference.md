---
layout: doc
outline: [2, 3]
---

# 参考：ClickHouse 速查与易错点

> 基于 ClickHouse 24.x / ClickHouse Cloud · 核于 2026-08

## 速查

- **定义**：Yandex 开源的列式分析型数据库（OLAP DBMS），单机数亿行/秒，集群 10 亿行/秒。
- **列存三优势**：聚合 IO 少（只读目标列）、压缩比高（5-15 倍）、向量化执行（SIMD 加速）。
- **MergeTree**：核心引擎，按 ORDER BY 排序 + PARTITION BY 分区 + 后台合并 data part + 稀疏索引（每 8192 行一个索引点）。
- **变体**：ReplacingMergeTree（去重）、SummingMergeTree（求和）、AggregatingMergeTree（聚合状态）、CollapsingMergeTree（sign 抵消）。
- **分片**：水平切数据并行查询（Distributed 引擎路由）。
- **复制**：ReplicatedMergeTree + ZooKeeper/Keeper 同步多副本保高可用。
- **物化视图**：预聚合物化，原表写入触发增量更新。
- **近似查询**：uniq（HyperLogLog）、quantile（分位数）、SAMPLE（采样），精度换速度。
- **标准 SQL**：兼容 ANSI SQL + 数组/JSON/URL/日期扩展函数，JDBC/ODBC/HTTP/原生协议。
- **Serverless**：ClickHouse Cloud 存算分离、按用量付费、弹性扩缩容。
- **场景**：产品分析（漏斗/留存）、日志分析、监控指标、广告/营销。
- **不适合**：强 ACID 事务、点查、频繁随机更新删除、复杂多表 JOIN。

## 一、MergeTree 引擎家族对比

| 引擎 | 合并时行为 | 典型场景 |
| --- | --- | --- |
| **MergeTree** | 仅合并 part | 通用分析表 |
| **ReplacingMergeTree** | 按 ORDER BY 去重（留最新/版本最大） | 幂等写入、去重 |
| **SummingMergeTree** | 数值列求和预聚合 | 指标汇总 |
| **AggregatingMergeTree** | 聚合状态合并（配合物化视图） | 复杂预聚合 |
| **CollapsingMergeTree** | sign(+1/-1) 配对抵消 | 模拟更新删除 |
| **ReplicatedMergeTree** | 上述 + 副本同步 | 高可用 |
| **Distributed** | 不存数据，路由到分片 | 分布式查询 |

## 二、近似函数速查

| 函数 | 用途 | 误差/机制 |
| --- | --- | --- |
| `uniq(x)` | 近似去重计数 | HyperLogLog，~0.5-2% |
| `uniqHLL12(x)` | 显式 HLL | 同上 |
| `uniqCombined(x)` | 组合算法 | 更省内存 |
| `count(DISTINCT x)` | 精确去重 | 无误差但慢 |
| `quantile(p)(x)` | 近似分位数 | reservoir sampling |
| `quantileTDigest(p)(x)` | 更高效分位数 | t-digest |
| `quantileExact(p)(x)` | 精确分位数 | 无误差但慢 |
| `SAMPLE n` | 采样查询 | 扫 n 比例数据 |
| `any(x)` | 任意取一值 | 非聚合 |
| `topK(n)(x)` | 近似高频项 | Space-Saving |

## 三、聚合状态函数（物化视图用）

| 状态函数 | 合并函数 | 用途 |
| --- | --- | --- |
| `uniqState(x)` | `uniqMerge(state)` | 去重计数（可增量） |
| `quantileState(p)(x)` | `quantileMerge(p)(state)` | 分位数（可增量） |
| `sumState(x)` | `sumMerge(state)` | 求和（可增量） |
| `avgState(x)` | `avgMerge(state)` | 均值（可增量） |

## 四、常用 SQL 速查

```sql
-- 建表（MergeTree，按月分区，按 date+user 排序）
CREATE TABLE events (
  date Date, user_id UInt64, event String, amount Decimal(10,2)
) ENGINE = MergeTree() PARTITION BY toYYYYMM(date) ORDER BY (date, user_id);

-- 物化视图（每分钟 UV，增量聚合）
CREATE MATERIALIZED VIEW mv_uv ENGINE = AggregatingMergeTree ORDER BY (minute) AS
SELECT toStartMinute(time) AS minute, uniqState(user_id) AS uv FROM events GROUP BY minute;

-- 查询（合并状态）
SELECT minute, uniqMerge(uv) AS uv FROM mv_uv WHERE minute > now() - INTERVAL 1 HOUR GROUP BY minute;

-- 近似去重
SELECT uniq(user_id) FROM events WHERE date = today();

-- 漏斗分析
SELECT windowFunnel(1800)(time, event='view', event='cart', event='order') AS step
FROM events WHERE date = today() GROUP BY user_id;

-- 按分区删除（瞬时）
ALTER TABLE events DROP PARTITION 202607;
```

## 五、易错点清单

- **「ClickHouse 适合做业务事务库」**：错。它是 OLAP 分析库，无强 ACID 事务、点查弱、随机更新代价高。业务库用 MySQL/PG。
- **「小批量频繁写入没问题」**：错。每次 INSERT 产生一个 data part，part 太多（建议 < 1000/表）查询变慢。应攒大批量或用 Buffer/Stream。
- **「ReplacingMergeTree 查询时一定已去重」**：错。去重只在合并时（异步）发生，查询时可能仍有重复，需 `FINAL` 强制（有代价）或接受最终一致。
- **「列式存储点查（按主键取单行）很快」**：错。列存为扫描聚合优化，点查（取单行所有列）要读多个列文件，不如行存 B+ 树。点查用 Redis/MySQL。
- **「物化视图会实时同步」**：物化视图是**原表写入时增量触发**（近实时），但聚合状态合并依赖后台 merge，不是强实时。
- **「近似查询（uniq）是精确的」**：错。uniq 用 HyperLogLog，有 ~0.5-2% 误差。要精确用 count(DISTINCT)（慢）。
- **「分布式 JOIN 性能很好」**：错。分布式 JOIN 需 shuffle/广播数据，是性能瓶颈。ClickHouse 设计偏单表大聚合，复杂多表 JOIN 不如关系库/数仓。
- **「UPDATE/DELETE 和 MySQL 一样快」**：错。ClickHouse 的 UPDATE/DELETE 是异步 mutation（重写 part），代价高、慢。避免随机更新删除。
- **「分区越细越好」**：错。分区太细（按天/小时）分区数爆炸，元数据多。经验：单分区 1-100GB，按月/周/天视数据量。
- **「SAMPLE 能用于精确统计」**：错。SAMPLE 是采样，结果有统计误差，适合探索趋势，不适合精确报表。
- **「AggregatingMergeTree 直接存最终值」**：错。它存聚合状态（uniqState），需 uniqMerge 合并才得最终值。
- **「ClickHouse Cloud 和自建完全一样」**：Cloud 是存算分离（S3 + 弹性计算），自建是存算一体的本地集群，架构与运维模式不同。

## 六、进阶方向（链接其他叶）

- [DuckDB](../duckdb/) —— 进程内列式 OLAP，轻量分析
- [InfluxDB](../../nosql/influxdb/) —— 时序专用，监控场景
- [TimescaleDB](../../nosql/timescaledb/) —— Postgres 时序扩展
- [Elasticsearch](../../distributed-search/elasticsearch/) —— 搜索 + 日志分析

## 权威链接

- [ClickHouse 官方文档](https://clickhouse.com/docs)
- [ClickHouse MergeTree](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
- [Materialized Views](https://clickhouse.com/docs/en/guides/developer/cascading-materialized-views)
- [ClickHouse Cloud](https://clickhouse.com/cloud)
- [ClickHouse 中文文档](https://clickhouse.com/docs/zh)
- 本站幻灯片：<a href="/SlideStack/clickhouse-slide/" target="_blank">ClickHouse</a>
