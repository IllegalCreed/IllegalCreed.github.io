---
layout: doc
outline: [2, 3]
---

# hypertable 与连续聚合：压缩与分区

> 基于 TimescaleDB 2.x / TigerData · 核于 2026-08

## 速查

- **hypertable（超表）**：对用户是普通表，底层自动按时间（+可选空间）分区。`create_hypertable('metrics', 'time')` 一行即可创建。
- **chunk（数据块）**：hypertable 的物理存储单元，对应一段时间（+空间）的数据。压缩、删除、刷新都以 chunk 为粒度。
- **时间分区（必要）**：所有 hypertable 必须按时间分区（如 `chunk_time_interval => '7 days'`），是时序组织基础。
- **空间分区（可选）**：再加空间键（如 device_id 哈希），散到多 chunk 提升并行写入。分区数 = 时间区间数 × 空间分区数。
- **连续聚合（Continuous Aggregates）**：**预计算并物化**时间窗口聚合，查询趋势直接读物化结果，快几个数量级；自动增量刷新（只刷新受影响窗口）。
- **物化 vs 视图**：连续聚合是**物化**视图（结果存盘），不是普通视图（每次现算）。
- **压缩（Compression）**：历史 chunk 按列式编码（delta/run-length）压缩，压缩比 10-20 倍，省存储 + 加速扫描；压缩后 chunk **只读**，更新需先解压。
- **压缩的列存本质**：TimescaleDB 把行存的 chunk 重新按列编码存储（chunk 内分行存、压缩时转列编码），获列式压缩优势。
- **数据保留（retention policy）**：按时间自动删除老 chunk（整 chunk DROP，开销低），与连续聚合协同控成本。
- **分层策略**：近期原始（热，可更新）→ 中期压缩（温，只读）→ 远期连续聚合（冷，长期趋势）。

## 一、hypertable 的创建与分区

把一张普通 Postgres 表转为 hypertable，只需一个函数调用：

```sql
-- 1. 建普通表
CREATE TABLE metrics (
  time        TIMESTAMPTZ NOT NULL,
  device_id   TEXT        NOT NULL,
  cpu         DOUBLE PRECISION,
  mem         DOUBLE PRECISION
);

-- 2. 转为 hypertable（按 time 时间分区，每周一个 chunk）
SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '7 days');

-- 3. （可选）加空间分区，散到多 chunk 提升并行写入
SELECT create_hypertable('metrics', 'time',
  partitioning_column => 'device_id', number_partitions => 4);
```

### chunk 如何切分

```
hypertable: metrics（按 time 每周一个 chunk）
  ├── chunk_2026_31   8月1日-8月7日   ← 历史chunk（已压缩，只读）
  ├── chunk_2026_32   8月8日-8月14日  ← 历史chunk（已压缩，只读）
  └── chunk_2026_33   8月15日-8月21日 ← 当前chunk（可写，未压缩）
```

- **时间分区（必要）**：`chunk_time_interval` 决定每个 chunk 跨多长时间（7 天/1 天/1 小时）。选多大看数据量——chunk 太大查询扫描慢，太小 chunk 数量爆炸元数据多。经验：每个 chunk 约 25% 主存大小。
- **空间分区（可选）**：`partitioning_column` + `number_partitions`，把同一时间的不同 device 散到多个 chunk，提升并行写入（多设备并发写不争抢同一 chunk）。
- **chunk 自动创建/删除**：写入新时间段时自动建新 chunk；retention 策略到期自动删老 chunk。
- **透明路由**：用户 `INSERT`/`SELECT` 不感知 chunk，hypertable 按 time 自动路由。

## 二、连续聚合：物化与增量刷新

连续聚合预计算时间窗口聚合并物化，是趋势查询的加速器：

```sql
-- 创建连续聚合：每分钟 CPU 均值（物化视图）
CREATE MATERIALIZED VIEW metrics_1m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,   -- 时间窗口函数
  device_id,
  AVG(cpu) AS avg_cpu,
  MAX(cpu) AS max_cpu
FROM metrics
GROUP BY bucket, device_id;

-- 查询趋势：直接读物化表，毫秒级
SELECT * FROM metrics_1m
WHERE bucket > now() - INTERVAL '1 hour'
ORDER BY bucket;
```

### 关键特性

- **time_bucket**：TimescaleDB 的窗口函数（比标准 Postgres 的 `date_bin`/`date_trunc` 更灵活），按任意间隔分桶。
- **物化（Materialized）**：结果实际存盘（不是每次查询现算），查询时直接读物化表。
- **自动增量刷新**：`refresh_continuous_aggregate` 或后台自动策略，**只刷新新增/变更的窗口**，不必全量重算。新数据写入后，连续聚合异步增量更新。
- **多层级联**：原始 → 1m → 1h → 1d，每层物化，大时间范围查粗粒度层。

### 与普通物化视图的区别

| 维度 | 普通 MATERIALIZED VIEW | 连续聚合 |
| --- | --- | --- |
| 刷新 | 全量刷新（`REFRESH MATERIALIZED VIEW`） | **增量**刷新（只更新变更窗口） |
| 跨 hypertable | 是 | 专为 hypertable 优化 |
| 自动化 | 手动/外部调度 | 内置策略自动刷新 |
| 性能 | 全量重算慢 | 增量快 |

## 三、压缩：列式编码省存储

压缩把历史 chunk 按列式编码重新存储：

```sql
-- 启用压缩（按 device_id 分组、按列编码）
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id',
  timescaledb.compress_orderby   = 'time DESC'
);

-- 压缩超过 7 天的 chunk
SELECT add_compression_policy('metrics', INTERVAL '7 days');
```

### 压缩原理

- **compress_segmentby**：按某列（如 device_id）分组，同一组的行放一起。
- **compress_orderby**：组内按时间排序。
- **列式编码**：组内每列用 delta（数值差值）/run-length（重复值游程）等编码——时序数据相邻值相似（CPU 8.1, 8.2, 8.1...），压缩比常达 **10-20 倍**。
- **chunk 整体压缩**：以 chunk 为单位整体压缩，压缩后该 chunk **只读**。

### 压缩的代价与收益

| 维度 | 收益 | 代价 |
| --- | --- | --- |
| 存储 | **省 10-20 倍** | - |
| 扫描 | 列式 IO 少，**分析更快** | - |
| 写入 | - | 压缩 chunk **不可写**，需先解压 |
| 更新/删除 | - | 需 `decompress_chunk` 先解压 |
| CPU | - | 压缩/解压消耗 CPU |

策略：近期 chunk（热，频繁写）不压缩；超过 N 天的历史 chunk（温/冷，只读分析）压缩。

## 四、数据保留：自动删除老 chunk

```sql
-- 自动删除超过 30 天的原始数据 chunk
SELECT add_retention_policy('metrics', INTERVAL '30 days');
```

- **整 chunk 删除**：retention 按 chunk 粒度删（DROP），开销远低于逐行 DELETE。
- **与连续聚合协同**：原始 metrics 保留 30 天 + 连续聚合 metrics_1m 保留 1 年——近期查明细、远期查趋势，存储与查询两不误。
- **分层生命周期**：近期原始（热）→ 压缩历史（温）→ 连续聚合（冷/长期），每层 retention 不同。

## 五、完整生命周期

```
写入 → 当前 chunk（未压缩，可写可查）
         │
         │ 超过 7 天
         ▼
      压缩 chunk（列式编码，只读，省 10-20x）
         │
         │ 同时：连续聚合增量刷新（1m/1h 物化）
         │
         │ 超过 30 天 retention
         ▼
      删除原始 chunk（整 chunk DROP）
         │
         ▼
      连续聚合长期保留（1 年）→ 远期趋势查询
```

## 下一步

掌握 hypertable、连续聚合、压缩后，下一步进入 [对比与 TigerData：与 InfluxDB 的取舍](./comparison-and-tigerdata)——TimescaleDB 与 InfluxDB 的哲学差异、TigerData 演进与选型建议。
