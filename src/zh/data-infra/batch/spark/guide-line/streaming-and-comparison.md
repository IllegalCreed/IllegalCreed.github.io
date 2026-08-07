---
layout: doc
outline: [2, 3]
---

# Spark Streaming、与 Flink 对比：微批 vs 真流式

> 基于 Apache Spark 3.5 · 核于 2026-08

## 速查

- **两代流 API**：①**DStream（Discretized Stream，已弃）**——Spark Streaming 老接口，把流按时间间隔切成一批批 RDD，已被弃用；②**Structured Streaming（结构化流，主流）**——基于 DataFrame/SQL 的流处理，把流当作「无界的 DataFrame」，是当前推荐。
- **微批（micro-batch）**：Spark 流处理的核心路线——把流按固定间隔（如每秒）攒成一个小批次，用批引擎处理，延迟取决于批次间隔（秒级）。与 Flink 真流式（逐条毫秒级）形成对照。
- **Continuous Processing（连续模式，可选）**：Structured Streaming 的低延迟实验模式，近似真流式（毫秒级），但功能受限（支持算子少、at-least-once），非主流——需要毫秒级仍首选 Flink。
- **event-time + watermark**：Structured Streaming 支持 event-time 窗口与 watermark（与 Flink 概念一致），处理乱序数据。watermark 在 SQL 里用 `window` + `.withWatermark`。
- **exactly-once**：Structured Streaming 通过 **WAL（Write-Ahead Log，预写日志）+ checkpoint + 幂等/事务 sink** 实现 at-least-once 到 exactly-once（取决于 sink）。机制与 Flink 的 barrier 快照不同。
- **与 Flink 对照**：Spark 微批 = 实现简单、复用批引擎、生态统一、延迟秒级；Flink 真流式 = 毫秒延迟、状态/时间一等公民、复杂但有专门流引擎。
- **Hadoop 历史定位**：Hadoop（HDFS+MapReduce+YARN）是大数据第一代，Spark 取代了 MapReduce **计算层**，但 HDFS（存储）+ YARN（资源）仍是 Spark 的底座。所以「Spark on YARN」「Spark 读 HDFS」是常态。
- **选型原则**：①毫秒级低延迟 + 强时间语义 + CEP → Flink；②准实时（秒/分钟级）+ 与批/SQL/ML 统一栈 → Spark Structured Streaming；③离线批 ETL/ML 训练 → Spark 批。

## 一、Spark Streaming 的演进：DStream 到 Structured Streaming

Spark 流处理有两代 API：

- **DStream（Spark Streaming，已弃）**：老接口（Spark 1.x）。把输入流按固定间隔（如 `batchDuration=1s`）切成一批批 **RDD**（叫 Discretized Stream），每个 micro-batch 用批引擎处理。API 是 `map`/`reduceByKey`/`window` 等，基于 RDD。Spark 3.x 后官方不再增强，迁移到 Structured Streaming。
- **Structured Streaming（Spark 2.x+，主流）**：基于 DataFrame/SQL 的流处理。核心思想——把流当作「**无界的 DataFrame**」，用与批完全相同的 DataFrame/SQL API 写流处理（流批统一）。

```python
# Structured Streaming：与批 DataFrame 几乎一样的 API
stream = (spark
  .readStream                            # 注意是 readStream 不是 read
  .format("kafka").option(...).load()
  .selectExpr("CAST(value AS STRING) as json")
  .groupBy(window("timestamp", "1 minute"), "city")
  .count())
query = stream.writeStream.format("console").start()
query.awaitTermination()
```

Structured Streaming 的优势：**流批统一**（同一套 DataFrame/SQL），**Catalyst 优化**，**event-time/watermark** 原生支持，是当前唯一推荐的 Spark 流 API。

## 二、微批：Spark 流处理的核心路线

Structured Streaming 默认是**微批（micro-batch）**模式：

```
   时间 ──────────────────────────────────►
   ──数据──数据──数据──数据──数据──数据──
        │  每 1 秒（trigger）攒一批  │
        ▼                             ▼
   [batch 0]      [batch 1]      [batch 2]
   作为一个 DataFrame 处理         作为 DataFrame 处理
        ▼                             ▼
     结果 sink                       结果 sink
```

- **延迟下限**：受 trigger 间隔限制（默认约 100ms-数秒），**秒级**。即使 trigger 设到 100ms，调度 + 处理开销也让实际延迟高于 Flink 毫秒级。
- **优势**：实现简单（复用成熟批引擎）、与批 SQL/ML 统一栈、容错基于 WAL（简单可靠）。
- **劣势**：延迟不够低（毫秒级场景不行）、状态管理不如 Flink 精细、反压调优不如 Flink 成熟。

### Continuous Processing：低延迟实验模式

Structured Streaming 提供 `Trigger.Continuous()` 模式——近似真流式，毫秒级延迟：

```python
stream.writeStream
  .trigger(continuous="1 second")   # 连续模式，1 秒检查点
  .format("kafka").start()
```

- **代价**：支持的算子少（map 类无状态算子，复杂的 join/聚合受限）、默认 at-least-once（要 exactly-once 需特殊 sink）、生态不如微批成熟。
- **结论**：毫秒级实时仍首选 **Flink**（真流式成熟），Continuous Processing 是 Spark 的尝试但非主流。

## 三、event-time 与 watermark（与 Flink 概念一致）

Structured Streaming 支持 event-time 窗口与 watermark，处理乱序数据：

```python
from pyspark.sql.functions import window

agg = (events
  .withWatermark("eventTime", "10 minutes")   # 允许 10 分钟乱序
  .groupBy(window("eventTime", "5 minutes"), "userId")  # 5 分钟滚动窗口
  .count())
```

- **window**：`window(timeColumn, "5 minutes")` 定义窗口（支持窗口 + 滑动）。
- **watermark**：`.withWatermark("eventTime", "10 minutes")` 告诉引擎「允许 10 分钟乱序，超过的状态可清理」。语义与 Flink 一致。
- **状态清理**：watermark 让引擎知道哪些旧窗口状态可以丢弃，避免状态膨胀。

## 四、exactly-once：WAL + checkpoint + 幂等/事务 sink

Structured Streaming 的容错与 exactly-once：

- **WAL（Write-Ahead Log）**：source（如 Kafka）的 offset 定期写入 WAL（checkpoint 目录）。故障后从 WAL 恢复 offset，从一致位点重放。
- **checkpoint**：状态（聚合中间结果）+ 进度（offset）存 checkpoint 目录。
- **sink**：①**幂等 sink**（如 MySQL `INSERT ON DUPLICATE KEY`）——重放数据幂等；②**事务 sink**（如 foreachBatch + 事务）——保证不重不漏。
- **语义**：默认 **at-least-once**（重放可能重），靠幂等/事务 sink 升级到 **exactly-once**。机制与 Flink 的 barrier 快照不同（Spark 是 WAL+offset，Flink 是 Chandy-Lamport barrier）。

## 五、Spark vs Flink：微批 vs 真流式

| 维度 | Spark Structured Streaming | Flink |
| --- | --- | --- |
| 架构 | **微批**（攒批） | **真流式**（逐条） |
| 延迟 | 秒级（受 trigger 限制） | **毫秒级** |
| 状态管理 | 基于 WAL，相对粗 | Keyed/Operator State，精细 |
| event-time/watermark | ✅（与 Flink 概念一致） | ✅ 一等公民，更成熟 |
| exactly-once | WAL + offset + 幂等/事务 sink | Checkpoint barrier + 2PC sink |
| SQL/CEP | ✅ SQL（CEP 弱） | ✅ SQL + 强 CEP |
| 流批统一 | ✅（DataFrame 同一套） | ✅（DataStream 同一套） |
| 部署 | 复用 Spark 集群（YARN/K8s） | 独立 Flink 集群 |
| ML | ✅ MLlib 强 | MLlib 弱 |
| 适用 | 准实时（秒/分钟）+ 统一栈 | 毫秒实时 + 强时间语义 + CEP |

**选型决策**：

- **选 Spark Structured Streaming**：①准实时（秒/分钟级延迟可接受）；②与离线批/SQL/ML 用同一套 Spark 栈；③团队已熟悉 Spark；④机器学习流水线 + 流预处理。
- **选 Flink**：①毫秒级低延迟（风控/监控/实时大屏）；②强事件时间语义 + 复杂 CEP；③大规模有状态流处理（去重/会话/JOIN）；④专门流处理团队。

## 六、Hadoop 历史定位：Spark 取代计算层，存储/资源仍是底座

Hadoop（2006）= HDFS（存储）+ MapReduce（计算）+ YARN（资源）。Spark（2014 顶级）取代了 MapReduce **计算层**，但 **HDFS 与 YARN 仍是 Spark 的底座**：

```
   计算层：MapReduce（已被 Spark 取代）
            ↓ Spark 接管
   资源层：YARN（仍是 Spark 主流 Cluster Manager）
   存储层：HDFS（仍是 Spark 常见数据源，与 S3 共存）
```

- **MapReduce 为什么被取代**：①磁盘 shuffle 慢（Spark 内存迭代快 10-100 倍）；②只有 map/reduce 两阶段，表达能力弱（Spark DAG 灵活）；③迭代场景（ML）灾难（Spark 内存迭代）。
- **Hadoop 仍活的部分**：HDFS（大数据存储事实标准之一，被 S3/对象存储部分取代）、YARN（资源调度，被 K8s 部分取代）、Hive Metastore（元数据管理，Spark SQL 复用）。
- **现代大数据栈**：存储（HDFS/S3/对象存储）+ 表格式（Delta Lake/Iceberg/Hudi）+ 计算（Spark 批/Flink 流）+ 元数据（Hive Metastore）。Hadoop 不再是「整套」，而是其中存储/资源的组成部分。

## 下一步

掌握了 Spark Streaming 与 Flink 对照后，可进入 [参考](../reference) 速查 RDD 算子、DataFrame API、Spark vs Flink vs Hadoop 对比、性能调优清单与易错点。
