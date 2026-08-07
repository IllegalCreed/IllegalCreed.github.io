---
layout: doc
outline: [2, 3]
---

# 列式存储与 MergeTree：分片与复制

> 基于 ClickHouse 24.x · 核于 2026-08

## 速查

- **列存组织**：ClickHouse 每个 data part 内，数据按列分别存储（每列一个文件 + 索引/标记文件），聚合只读目标列。
- **向量化执行**：查询按列向量（一批同类型值）批处理，CPU 缓存友好、SIMD 加速，是 ClickHouse 性能的核心。
- **压缩编码**：每列用 delta（递增数值）/run-length（重复值）/LZ4/ZSTD（通用）编码，压缩比 5-15 倍。
- **MergeTree 核心**：按 `ORDER BY` 主键排序存储 + `PARTITION BY` 分区 + 后台异步合并 data part + 稀疏索引（每 8192 行一个索引点）。
- **data part**：写入的物理单元，每次批量写入产生一个 part，后台合并（merge）成更大的 part 减少 part 数。
- **合并（merge）**：后台异步任务，把多个小 part 合成大 part——减少查询要扫的文件数、应用去重/聚合逻辑（变体引擎）、回收已删数据。是 ClickHouse 写入后的核心任务。
- **稀疏索引（primary.idx）**：不索引每行，每 8192 行（一个 granule）存一个索引点，索引极小全驻内存，定位粗粒度，适合大范围扫描。
- **分区裁剪**：查询 WHERE 含分区键时，只扫相关分区（DROP 无关分区），大幅减少 IO；按分区删除（DROP PARTITION）瞬时。
- **MergeTree 变体**：`ReplacingMergeTree`（去重）、`SummingMergeTree`（求和）、`AggregatingMergeTree`（聚合状态）、`CollapsingMergeTree`（sign 抵消）。
- **分片（shard）**：按分片键水平切数据到多节点并行查询，吞吐线性扩展。
- **复制（replica）**：ReplicatedMergeTree 通过 ZooKeeper/Keeper 同步多副本，保证高可用。
- **分布式表（Distributed）**：逻辑表，查询自动分发到所有分片汇总。

## 一、列存的物理组织

ClickHouse 每个 data part 是一个目录，每列对应一组文件：

```
data part（目录）
├── primary.idx      主键稀疏索引（每 8192 行一个索引点）
├── time.bin         time 列数据（压缩后）
├── time.mrk         time 列标记（偏移，定位用）
├── user_id.bin      user_id 列数据
├── user_id.mrk      user_id 列标记
├── amount.bin       amount 列数据
├── amount.mrk       amount 列标记
└── ...              每列都有自己的 bin + mrk
```

- **按列独立存储**：聚合 `SUM(amount)` 只读 amount.bin，不碰其他列——100 列的表聚合 1 列，IO 降 99%。
- **mrk 标记文件**：每列的标记文件记录每个 granule（8192 行块）在该列 bin 文件中的偏移，配合 primary.idx 定位。
- **稀疏索引**：primary.idx 只存每个 granule 的主键值（time,user_id），不索引每行——索引极小（百万行表索引才几 MB），全驻内存，定位到 granule 后顺序扫该 granule。

### 查询执行流程

```
SELECT SUM(amount) FROM orders WHERE date = '2026-08-01'
  1. 分区裁剪：只扫 date='2026-08-01' 分区的 parts
  2. 主键索引：primary.idx 定位 time 相关 granule
  3. 只读 amount.bin 的相关 granule（其他列不读）
  4. 向量化：amount 列数据按向量批处理累加（SIMD 加速）
  5. 返回 SUM
```

## 二、向量化执行：性能核心

向量化是 ClickHouse 性能的关键引擎：

- **按列向量批处理**：执行时一次处理一批（通常几千行）同类型的列向量，而非逐行。
- **CPU 缓存友好**：连续的同类数据紧密排列，L1/L2 缓存命中率高。
- **SIMD 加速**：单条 CPU 指令同时处理多个值（AVX2/AVX-512 一次 8/16 个 32 位整数），SUM/COUNT 等聚合线性加速。
- **紧凑循环**：编译器能高效优化紧凑的同类型循环（无行内类型分支）。

对比行存的逐行处理（每行混合类型，循环内有分支判断），向量化在聚合场景快 5-50 倍。

## 三、MergeTree 的写入与合并

### 写入产生 data part

```sql
-- 建表：MergeTree，按 (date, user_id) 排序，按月分区
CREATE TABLE orders (
  date Date, user_id UInt64, amount Decimal(10,2)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id);

-- 批量写入（一次产生一个 data part）
INSERT INTO orders VALUES ...
```

- 每次批量 INSERT 产生一个 data part，part 内按 ORDER BY 排序、按列存储、建稀疏索引。
- **小批量频繁写入是反模式**：每次 INSERT 产生一个 part，part 太多（ClickHouse 建议单表 part 数 < 1000）查询要扫太多文件变慢。应攒大批量（万行以上/Stream/Buffer 引擎）一次写。

### 后台合并（merge）

```
parts: [p1][p2][p3][p4][p5]   ← 多个小 part
              │ 后台 merge
              ▼
        [big_part]              ← 合成大 part（减少 part 数）
```

- **合并触发**：后台线程定期把相邻小 part 合成大 part。
- **目的**：减少 part 数量（查询扫更少文件）、应用变体引擎逻辑（去重/聚合）、回收已删数据。
- **合并是异步的**：写入立即可查（不必等合并），合并在后台慢慢做。
- **合并压力**：写入持续大量时合并压力大，需监控 `system.merges`。

## 四、MergeTree 变体

不同变体在合并时应用不同逻辑：

### ReplacingMergeTree（去重）

```sql
ENGINE = ReplacingMergeTree([version_column])
```

合并时按 ORDER BY 主键去重，保留 version 最大的（或最新）。适合幂等写入（重复数据自动去重）。注意：去重只在合并时发生（异步），查询时可能仍有重复，需用 `FINAL` 关键字强制去重（有性能代价）。

### SummingMergeTree（求和预聚合）

```sql
ENGINE = SummingMergeTree((amount, qty))
```

合并时对 ORDER BY 主键相同的行，把数值列（amount, qty）求和合并。适合指标汇总（多份小记录合成一份汇总）。

### AggregatingMergeTree（聚合状态）

配合物化视图，合并时按聚合状态（uniqState/quantileState）合并。是物化视图预聚合的底层引擎。

### CollapsingMergeTree（sign 抵消）

```sql
ENGINE = CollapsingMergeTree(sign)
```

用 sign 字段（+1 表示有效，-1 表示取消），合并时 +1/-1 配对抵消。模拟「更新/删除」（先写 -1 取消旧值，再写 +1 新值）。

## 五、分区与生命周期

```sql
PARTITION BY toYYYYMM(date)   -- 按月分区
```

- **分区裁剪**：`WHERE date='2026-08-01'` 只扫 2026-08 分区，其他月份不读。
- **按分区管理生命周期**：
  - `DROP PARTITION` 瞬时删除整个分区（老数据过期）。
  - `ALTER ... MOVE PARTITION TO DISK` 冷热分层（老分区移到廉价存储）。
  - TTL 表达式自动过期分区。
- **分区粒度**：太细（按天）分区数爆炸；太粗（按年）裁剪效果差。经验：单分区 1-100GB，月/周/天视数据量选。

## 六、分片与复制

### 分片（shard）

```sql
-- 分片表（每个分片节点建本地表）
CREATE TABLE orders_local ON CLUSTER cluster (
  ...
) ENGINE = MergeTree() ORDER BY (date, user_id);

-- 分布式表（自动路由到分片）
CREATE TABLE orders_all ON CLUSTER cluster AS orders_local
ENGINE = Distributed(cluster, db, orders_local, rand());
```

- **分片键**：Distributed 引擎第 4 参数（如 `hash(user_id)` 或 `rand()`），决定数据路由。
- **查询并行**：分布式表查询自动分发到所有分片并行扫，汇总。
- **写入路由**：写分布式表自动按分片键路由到对应分片本地表。

### 复制（replica）

```sql
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/orders_local', '{replica}')
```

- **ReplicatedMergeTree**：通过 ZooKeeper/Keeper 协调副本间复制（写入同步/异步可配）。
- **高可用**：一副本挂，其他副本继续服务。
- **读扩展**：查询可分散到多副本负载均衡。

### 完整集群拓扑

```
分布式表 orders_all
   ├── 分片1
   │    ├── 副本1（ReplicatedMergeTree）
   │    └── 副本2
   ├── 分片2
   │    ├── 副本1
   │    └── 副本2
   └── 分片3 ...
```

分片扩吞吐（并行扫），复制保高可用。

## 下一步

存储引擎与分布式架构讲完后，下一步进入 [用例与 SQL：物化视图、近似查询与 Serverless](./use-cases-and-sql)——物化视图预聚合、近似函数、产品分析/日志场景与 ClickHouse Cloud。
