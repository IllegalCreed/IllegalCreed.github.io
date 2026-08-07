---
layout: doc
outline: [2, 3]
---

# 入门：列式分析与 ClickHouse

> 基于 ClickHouse 24.x / ClickHouse Cloud · 核于 2026-08

## 速查

- **OLAP vs OLTP**：**OLTP**（在线事务，MySQL/PG）为事务、点查、取整行优化，少量行快速读写；**OLAP**（在线分析，ClickHouse）为海量数据聚合扫描优化，单机数亿行/秒。
- **为何需要列式 OLAP**：业务库（OLTP）做分析聚合（SUM/COUNT/GROUP BY 扫亿行）要读整行浪费 IO、慢。列存只读目标列，IO 与 CPU 都省，分析快几个数量级。
- **ClickHouse 定义**：Yandex 开源的**列式分析型数据库（OLAP DBMS）**，专为海量数据聚合设计，单机数亿行/秒，集群 10 亿行/秒。
- **列式存储三优势**：①**聚合 IO 少**（只读目标列）；②**压缩比高**（同列类型一致，delta/run-length/LZ4/ZSTD，5-15 倍）；③**向量化执行**（批处理列向量，SIMD 加速）。
- **MergeTree 家族**：核心存储引擎。按主键排序、按分区（partition）组织、后台异步合并 data part。变体：`MergeTree`（基础）、`ReplacingMergeTree`（去重）、`SummingMergeTree`（求和预聚合）、`AggregatingMergeTree`（聚合状态）。
- **分区（partition）**：按 PARTITION BY 表达式（如 toYYYYMM(date)）把表分成多个分区，查询裁剪无关分区，加速 + 便于生命周期管理（按分区删除/移动）。
- **data part 与合并**：每次写入产生 data part，后台异步合并（merge）成更大的 part，减少 part 数量提升查询；合并是 ClickHouse 写入后的核心后台任务。
- **分片（shard）+ 复制（replica）**：分片水平切数据到多节点并行查询（Scale OUT）；复制保证高可用（多副本）。分布式表（Distributed）跨分片查询，ReplicatedMergeTree 跨副本同步。
- **物化视图（Materialized View）**：预计算并物化聚合结果，原表写入触发物化视图增量更新，查询趋势直接读物化表。
- **近似查询**：用采样（SAMPLE）、HyperLogLog（uniq 基数估计）、quantile（分位数估计）等，毫秒级返回近似结果，精度换速度。
- **标准 SQL**：兼容大部分 ANSI SQL + 大量扩展函数（数组/JSON/URL/日期），JDBC/ODBC/HTTP/原生协议接入。
- **Serverless / Cloud**：ClickHouse Cloud 存算分离、按用量付费、弹性扩缩容，免运维。
- **典型场景**：产品分析（漏斗/留存）、日志分析（应用/访问日志）、监控指标、广告/营销分析、用户行为分析。

## 一、OLAP vs OLTP：为何要分库

数据库按工作负载分两大类，需求根本不同：

| 维度 | OLTP（事务型） | OLAP（分析型） |
| --- | --- | --- |
| 代表 | MySQL、PostgreSQL | **ClickHouse**、DuckDB、BigQuery |
| 工作负载 | 短事务、点查、取整行、随机更新 | 大范围扫描、聚合（SUM/COUNT/GROUP BY） |
| 数据量 | GB-TB（当前业务数据） | TB-PB（历史全量、日志、事件） |
| 写入 | 频繁 INSERT/UPDATE/DELETE | 批量追加为主（事件流、ETL 灌入） |
| 查询 | 「取用户 123 的订单」 | 「过去 30 天各省份日活、GMV 趋势」 |
| 存储优化 | 行存 + B+ 树索引（取整行快） | **列存**（聚合只读目标列） |
| 事务 | 强 ACID | 弱/无（分析不需事务） |

把 OLTP 库（MySQL）当 OLAP 用（扫亿行算 SUM）是常见性能灾难——行存读整行浪费 IO，B+ 树不适合大范围扫描，慢到不可用。专用 OLAP 库（ClickHouse）用列存 + 向量化，快几个数量级。

## 二、列式存储的三重优势

ClickHouse 的性能根基是列式存储，三大优势叠加：

### 1. 聚合 IO 少

行存一行的所有列连续存储，聚合某列（SUM(amount)）要读整行（含无关列）。列存按列存储，聚合只读目标列：

```
行存：[id,user,amount,time,status] [id,user,amount,time,status] ...  ← 算 SUM(amount) 要读全部列
列存：amount 列：[100,200,150,...] 单独连续存储  ← 算 SUM(amount) 只读 amount 列
```

100 列的表，聚合 1 列只需读 1% 数据，IO 降 99%。

### 2. 压缩比高

同列数据类型一致（都是数值/都是字符串），且相邻值常相似（时间序列、状态码），可用高效编码：

| 编码 | 适用 | 效果 |
| --- | --- | --- |
| delta | 递增数值（时间戳、ID） | 存差值 |
| run-length | 重复值（状态码、枚举） | 存重复次数 |
| LZ4/ZSTD | 通用压缩 | 兜底 |

列存压缩比常达 **5-15 倍**，行存一般 2-3 倍。省存储 + 扫描时 IO 更少。

### 3. 向量化执行

CPU 按列向量（一批同类型值）批处理，循环紧凑、缓存友好、能 SIMD（单指令多数据）并行——一次指令处理多个值。行存按行处理（每行混合类型），无法向量化。

## 三、MergeTree 家族：存储引擎核心

MergeTree 是 ClickHouse 的核心表引擎，所有时序/分析表几乎都用它的变体：

- **按主键排序**：`ORDER BY (date, user_id)` 让数据按主键有序存储，范围查询与稀疏索引高效。
- **分区（partition）**：`PARTITION BY toYYYYMM(date)` 按月分区，查询时裁剪无关分区（只扫相关月份），且便于按分区删除/移动（DROP PARTITION 瞬时）。
- **data part 与合并**：每次批量写入产生一个 data part，后台**异步合并**（merge）成更大的 part——part 太多查询要扫太多文件，合并减少 part 数提升查询。合并是写入后的核心后台任务。
- **稀疏索引（primary.idx）**：不索引每一行，而是每 N 行（默认 8192）存一个索引点，索引极小可全驻内存，定位粗粒度。

### MergeTree 变体

| 引擎 | 特性 | 场景 |
| --- | --- | --- |
| **MergeTree** | 基础引擎，按主键排序+合并 | 通用分析表 |
| **ReplacingMergeTree** | 后台合并时按主键去重（保留最新/指定版本） | 幂等写入、去重 |
| **SummingMergeTree** | 合并时对数值列求和（预聚合） | 指标汇总 |
| **AggregatingMergeTree** | 合并时按聚合状态合并（配合物化视图） | 复杂聚合预计算 |
| **CollapsingMergeTree** | 用 sign 字段（+1/-1）抵消删除 | 频繁更新场景 |

## 四、分片与复制：水平扩展

单机装不下或查不动时，靠分片+复制扩展：

```
                  分布式表（Distributed）
                  ┌────────────────────┐
                  │ 跨分片查询汇总       │
                  └──┬───────┬───────┬──┘
                     │       │       │
              ┌──────▼──┐ ┌──▼────┐ ┌▼──────┐
   分片1      │ 副本1   │ │副本1  │ │副本1  │   分片2/3
              │ 副本2   │ │副本2  │ │副本2  │
              └─────────┘ └───────┘ └───────┘
              （ReplicatedMergeTree 同步副本）
```

- **分片（shard）**：按分片键（如 hash(user_id)）把数据水平切到多节点，查询并行（每分片扫一部分），吞吐线性扩展。
- **复制（replica）**：每个分片可有多个副本（ReplicatedMergeTree），副本间通过 ZooKeeper/Keeper 同步，保证高可用（一副本挂不影响）。
- **分布式表（Distributed）**：一个逻辑表，查询时自动分发到所有分片，汇总结果。写也可走分布式表（自动路由到对应分片）。

## 五、物化视图与近似查询

### 物化视图（Materialized View）

预计算并物化聚合，原表写入触发物化视图**增量更新**：

```sql
-- 原表：原始事件（每秒海量）
CREATE TABLE events (time DateTime, user_id UInt64, event String) ENGINE=MergeTree ORDER BY time;

-- 物化视图：每分钟去重用户数（自动增量更新）
CREATE MATERIALIZED VIEW mv_min UNIQUE
ENGINE=AggregatingMergeTree ORDER BY (minute)
AS SELECT toStartMinute(time) AS minute, uniqState(user_id) AS uv FROM events GROUP BY minute;
```

查询趋势时读 mv_min（物化预聚合），比扫原始 events 快几个数量级。

### 近似查询

海量数据下，精确聚合慢。ClickHouse 提供近似函数，毫秒级返回近似结果：

| 函数 | 用途 | 机制 |
| --- | --- | --- |
| `uniq()` / `uniqHLL12` | 近似去重计数 | HyperLogLog（固定内存，~0.5-2% 误差） |
| `quantile()` | 近似分位数（P50/P99） | reservoir sampling |
| `SAMPLE 0.1` | 采样查询 | 只扫 10% 数据 |
| `approx_count_distinct` | 近似唯一值 | 同 HLL |

精度换速度——产品分析看趋势，±1% 误差无所谓，速度差 10 倍。

## 六、Serverless 与典型场景

- **ClickHouse Cloud**：官方托管，**存算分离**（存储 S3、计算弹性）、按用量付费、自动扩缩容、免运维。
- **典型场景**：
  - **产品分析**：漏斗（funnel）、留存（retention）、用户路径——扫全量事件聚合。
  - **日志分析**：应用日志、访问日志、安全日志——TB 级日志快速检索统计。
  - **监控指标**：服务器/应用指标大范围趋势（与 InfluxDB 重叠，ClickHouse 更适合超大规模历史分析）。
  - **广告/营销**：点击流、转化归因、人群洞察。

## 下一步

理解了 OLAP 与列式优势后，下一步深入 [列式存储与 MergeTree：分片与复制](./guide-line/columnar-and-mergetree)（存储引擎细节、合并机制、分布式架构）与 [用例与 SQL：物化视图、近似查询与 Serverless](./guide-line/use-cases-and-sql)（物化视图、近似函数、产品分析/日志场景）。
