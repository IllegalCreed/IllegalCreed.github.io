---
layout: doc
outline: [2, 3]
---

# 时序数据模型：measurement/tag/field/降采样/retention

> 基于 InfluxDB 3 Core/Enterprise · 核于 2026-08

## 速查

- **point（数据点）**：InfluxDB 的最小数据单元，由 **measurement + tag + field + timestamp** 四元组构成。一行 = 一个 point。
- **measurement（测量）**：相当于关系库的「表」，一类时序数据的容器（如 `cpu`、`temperature`、`http_request`）。
- **tag（标签）**：带**索引**的键值对维度，用于**过滤和分组**（`WHERE`/`GROUP BY`）。例：`host=server1`、`region=us-east`。tag 值是字符串。
- **field（字段）**：**不带索引**的键值对度量值，存实际数值/字符串（CPU%、温度、延迟）。例：`usage=0.83`。查询 field 必须先经 tag 过滤再扫描聚合。
- **tag 索引、field 不索引的原因**：tag 是低基数维度（有限个 host），建索引高效；field 是高频写入的度量值（数值变化无穷），索引代价高于扫描。
- **timestamp（时间戳）**：纳秒精度，每个 point 必须有时间戳，数据按时间排序存储。
- **series（时间序列）**：**measurement + 所有 tag 的键值组合**唯一确定一条 series。series 数 = tag 组合数，是性能与内存的头号指标。
- **高基数（High Cardinality）陷阱**：把唯一性强的值（用户 ID、trace ID、带参数 URL）当 tag → series 爆炸 → 索引膨胀、内存撑爆、写入变慢。**唯一性强的值放 field 或不存**。
- **降采样（Downsampling）**：按**时间窗口**（1m/1h/1d）把高频原始点聚合成低频摘要（mean/max/sum/count），老数据用摘要替代原始——以更少存储回答趋势查询。
- **retention（保留策略）**：为数据设置**保留时长**（7d/30d/1y），到期自动删除。典型：原始短期 + 降采样长期。
- **Line Protocol**：InfluxDB 的写入文本协议，一行一个 point：`measurement,tag=val field=val timestamp`。

## 一、四元组：measurement / tag / field / timestamp

每个 point 是一个四元组。以 Line Protocol 写入为例：

```
cpu,host=server1,region=us-east usage=0.83,load=1.2 1693843200000000000
│   └────── tag ──────────┘  └─── field ───┘  └── timestamp ──┘
└─ measurement                                           (纳秒)
```

| 组成 | 角色 | 类型 | 索引 | 用途 |
| --- | --- | --- | --- | --- |
| **measurement** | 表名 | 字符串 | 是 | 一类数据的容器（`cpu`/`temperature`） |
| **tag** | 维度 | 键值（值是字符串） | **是** | `WHERE`/`GROUP BY` 过滤分组（host/region/status） |
| **field** | 度量 | 键值（值是数值/字符串） | **否** | 被测量的量（usage/temperature/latency），聚合对象 |
| **timestamp** | 时间 | 纳秒整数 | 是（排序键） | 时间定位、时间窗口聚合 |

### tag 与 field 的选择原则

这是 InfluxDB 数据建模的**核心决策**，直接影响查询性能与 series 数量：

- **放 tag**：**有限的、用于过滤分组的维度**。例：`host`（几十几百台）、`region`（少数几个）、`status`（200/404/500）、`endpoint`（几十个 API）。tag 建索引，`WHERE host='server1'` 走索引秒查。
- **放 field**：**高频写入的度量值、唯一性强的值**。例：`usage`（CPU 百分比）、`temperature`（温度）、`userId`（百万级唯一用户，放 tag 会撑爆 series）。
- **常见错误**：把 `userId`/`sessionId`/`traceId`/带参数的 URL 放 tag——这些值唯一性极强，每个值生成一条新 series，导致**series 爆炸**，索引与内存撑爆。这类值要么放 field（不需过滤），要么不存（用专门的用户行为库）。

### 为何 tag 索引、field 不索引

- **tag 是低基数维度**（host 就那几百台），索引小、命中率高，建索引划算。
- **field 是高频变化的度量值**（CPU 数值每秒都不同），索引会变得无穷大，且 field 查询基本是「先按 tag/时间过滤缩小范围，再扫描聚合」（如 `mean(usage)`），全表扫描聚合用列式压缩 + 向量化更快，索引帮不上忙。

## 二、series：时间序列与高基数

**series = measurement + 所有 tag 的键值组合**。同一个 series 的所有 point 共享同一组 tag 值，按时间排成一条序列。

```
measurement = cpu
series 1: cpu + host=server1 + region=us-east   → 一条时间序列
series 2: cpu + host=server2 + region=us-east   → 另一条
series 3: cpu + host=server1 + region=eu-west   → 又一条
```

- **series 数 = ∏（每个 tag 的不同值数）**。tag 越多、每个 tag 的值越多，series 越多。
- **series 是 InfluxDB 的性能核心指标**：内存里要维护 series 索引，series 越多内存占用越大、写入路径越长（要定位 series）、查询过滤越慢。
- **高基数陷阱**：假设把 `userId`（100 万用户）当 tag，再乘 `host`（100 台），series 数 = 1 亿，索引直接撑爆内存。**这是 InfluxDB 最常见的「突然就慢了/挂了」的根因**。

### 如何避免高基数

1. **唯一性强的值绝不放 tag**：用户 ID、请求 ID、trace ID、带参数 URL 一律放 field 或不存。
2. **降低 tag 粒度**：与其存精确 URL，不如存「路由模板」（`/api/users/:id`）。
3. **预聚合/采样**：在采集端（Telegraf processor）或写入前聚合，减少 point 数。
4. **分库分 measurement**：不同基数特征的数据分开放。

## 三、降采样：时间窗口聚合

时序数据的核心查询模式是「**按时间窗口聚合**」：过去 1 小时 CPU 均值、昨天每分钟最大延迟、本月每天 QPS。降采样把这个过程**前置**——提前算好低频摘要存下来，查询时直接读摘要，不必扫描全量原始点。

```
原始数据（1 秒一个点）          降采样（1 分钟窗口 mean）
  ┌──────────────────┐           ┌──────────┐
  │ 12:00:01 usage=0.8│           │          │
  │ 12:00:02 usage=0.9│  ─聚合─►  │ 12:00    │
  │ ...               │           │ usage=0.83│  （60 个原始点 → 1 个摘要）
  │ 12:00:60 usage=0.8│           │          │
  └──────────────────┘           └──────────┘
```

- **常见聚合函数**：`mean`（均值）、`max`/`min`（极值）、`sum`（累计）、`count`（计数）、`percentile`（分位数，如 P99 延迟）、`last`/`first`（窗口最后一个/第一个）。
- **多级降采样**：近期保留高频（1 秒）、中期中频（1 分钟）、远期低频（1 小时/1 天）——查询时间范围越大用越粗的粒度，速度与精度平衡。
- **3.x 实现方式**：①定时任务（连续查询/Task）周期性跑聚合 SQL 写入新 measurement；②查询时用 SQL 窗口函数即时聚合（`date_bin` + `AVG`）；③外部调度（cron/Airflow）跑聚合。

## 四、retention：自动过期

**retention policy（保留策略）**为数据设置**保留时长**，到期自动删除。时序数据「老数据冷访问」的特性让 retention 成为必需：

| 策略 | 数据 | 保留时长 | 用途 |
| --- | --- | --- | --- |
| 短期原始 | 高频原始点（1s） | 7 天 | 近期明细排查 |
| 中期降采样 | 1 分钟聚合 | 30 天 | 近期趋势 |
| 长期降采样 | 1 小时/1 天聚合 | 1-5 年 | 长期趋势、年度对比 |

- **retention + 降采样协同**：原始保留短期（满足近期明细查询），同时定时降采样成长期摘要；原始到期删除，摘要长期保留——存储成本降一个数量级，趋势查询不受影响。
- **3.x 的 retention**：通过表/分区级别的生命周期管理实现，配合 Parquet 文件按时间分区，过期即删整批文件，开销低。

## 五、Line Protocol：写入协议

InfluxDB 用 **Line Protocol** 接收写入，一行一个 point，文本格式紧凑高效：

```
# 语法：measurement,tagKey=tagVal,... fieldKey=fieldVal,... timestamp
cpu,host=server1,region=us-east usage=0.83,load=1.2 1693843200000000000
```

- **逗号分隔**：measurement 与 tag 之间用逗号，tag 之间用逗号；**tag 与 field 之间用空格**；field 之间用逗号；field 与 timestamp 之间用空格。
- **timestamp 可省略**：不写则用服务器当前时间（纳秒）。
- **字符串 field 要双引号**：`message="hello"`；数值不引号；布尔 `true`/`false`。
- **批量写入**：HTTP POST 多行 body，一次写上千 point，吞吐远高于逐条。

## 下一步

数据模型讲完后，下一个核心是 [SQL 与监控集成：3.x Parquet 引擎与 TIG 栈](./sql-and-monitoring)——3.x 如何用标准 SQL + Arrow/Parquet 重写查询栈，以及 Telegraf/Grafana 如何与 InfluxDB 组成监控链路。
