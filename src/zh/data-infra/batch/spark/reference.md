---
layout: doc
outline: [2, 3]
---

# 参考：Spark API、选型与调优速查

> 基于 Apache Spark 3.5 · 核于 2026-08

## 速查

- **Spark 定位**：统一大数据分析引擎，内存计算 + DAG 调度 + 惰性求值，取代 MapReduce 计算层。
- **三层 API**：RDD（底层，无优化）/ DataFrame（结构化，Catalyst 优化，**主力**）/ Spark SQL（SQL 文本，分析师友好）。
- **惰性求值**：transformations 惰性构建 DAG，actions 触发执行；窄依赖流水线，宽依赖 shuffle 切 stage。
- **血缘容错**：RDD 不可变，分区丢失按血缘重算，是「弹性」含义。
- **架构**：Driver（构建 DAG/调度 task）+ Executor（跑 task/缓存）+ Cluster Manager（YARN/K8s）。
- **reduceByKey > groupByKey**：reduceByKey 有 map-side 预聚合，shuffle 少；groupByKey 全量 shuffle 易 OOM。
- **流处理**：DStream（已弃）→ Structured Streaming（主流，微批，秒级延迟）→ Continuous Processing（实验，毫秒级受限）。
- **vs Flink**：Spark 微批秒级 + 统一栈；Flink 真流式毫秒级 + 强时间语义 + CEP。
- **vs Hadoop**：Spark 取代 MapReduce 计算层；HDFS/YARN/Hive Metastore 仍是底座。
- **调优要点**：partition 数、缓存、shuffle、broadcast join、序列化、内存。

## 一、RDD 算子速查

| 类别 | 算子 | 说明 |
| --- | --- | --- |
| **转换-窄依赖** | `map` / `filter` / `flatMap` / `mapPartitions` / `distinct` / `union` | 不 shuffle，流水线 |
| **转换-宽依赖** | `groupByKey` / `reduceByKey` / `aggregateByKey` / `join` / `cogroup` / `repartition` / `sortBy` | shuffle，stage 边界 |
| **行动** | `collect` / `count` / `take(n)` / `first` / `reduce` / `fold` / `aggregate` / `countByKey` / `saveAsTextFile` / `foreach` | 触发 DAG 执行 |
| **控制** | `persist(级别)` / `cache()` / `unpersist()` / `coalesce(n)` | 缓存与分区控制 |

## 二、DataFrame / Spark SQL 速查

| 操作 | DataFrame API | SQL |
| --- | --- | --- |
| 读 | `spark.read.parquet/json/csv(...)` | `LOAD DATA ...` |
| 写 | `df.write.mode("overwrite").parquet(...)` | `INSERT OVERWRITE TABLE ...` |
| 选择 | `df.select("a","b")` | `SELECT a, b` |
| 过滤 | `df.filter(df.a > 1)` | `WHERE a > 1` |
| 聚合 | `df.groupBy("a").agg(sum("b"))` | `GROUP BY a, SUM(b)` |
| JOIN | `df1.join(df2, "id")` | `JOIN df2 ON id` |
| 窗口 | `Window.partitionBy("a").orderBy("b")` | `OVER (PARTITION BY a ORDER BY b)` |

- **谓词下推**：`df.filter(...)` 会下推到 source（如 Parquet 读时跳过不匹配的 row group），自动优化。
- **列裁剪**：`df.select("a","b")` 只读用到的列，不读全表。
- **广播 join**：`broadcast(smallDf)` 把小表广播到所有 executor，避免 shuffle——大表 JOIN 小表神器。

## 三、Spark vs Flink vs Hadoop 对比

| 维度 | Spark | Flink | Hadoop MapReduce |
| --- | --- | --- | --- |
| 计算 | 内存迭代 + DAG | 真流式 + 批统一 | 磁盘 shuffle 两阶段 |
| 流 | Structured Streaming（微批，秒级） | 真流式（毫秒级） | 无（需 Storm） |
| 批 | ✅ 主力 | ✅（批是有限流） | ✅（已基本被取代） |
| ML | MLlib 强 | ML 弱 | Mahout（衰退） |
| 状态 | WAL 相对粗 | 精细 Keyed/Operator State | 无状态概念 |
| 生态 | 统一栈（批/流/SQL/ML/图） | 流为主 + SQL + CEP | 仅批 |
| 部署 | YARN/K8s/Standalone | 独立集群 | YARN |
| 现状 | 批/准实时主力 | 实时流主力 | 已基本淘汰 |

## 四、性能调优清单

- **partition 数**：过多（小任务 + shuffle 小文件多）/ 过少（并行度不足）。用 `repartition(n)`（shuffle 重分布）或 `coalesce(n)`（仅减少，尽量不 shuffle）调整。`spark.sql.shuffle.partitions`（默认 200）按数据量调。
- **缓存**：反复用的 RDD/DataFrame 用 `.cache()` / `.persist(DISK_ONLY/MEMORY_AND_DISK)`，避免重算。不用了 `.unpersist()` 释放。
- **shuffle 优化**：①优先 `reduceByKey`/`aggregateByKey`（有 map-side combine）而非 `groupByKey`；②`spark.sql.shuffle.partitions` 按数据量调；③大表 JOIN 小表用 `broadcast(smallDf)`。
- **序列化**：默认 Java 序列化慢，配 `spark.serializer=org.apache.spark.serializer.KryoSerializer`（Kryo 快且紧凑）。
- **内存**：`spark.executor.memory` / `spark.executor.memoryOverhead`（堆外）按数据量调；`spark.memory.fraction` 控制执行/存储比例。spill 到磁盘要监控。
- **数据倾斜**：某 key 数据量远超其他 → join/聚合时倾斜。解法：①加盐（给 key 加随机前缀打散）；②两阶段聚合（先局部后全局）；③`skewJoin` 配置。
- **小文件**：写 Parquet/ORC 易产生小文件（每个 task 一个）。解法：①输出前 `coalesce(n)` 减少分区；②用 Delta Lake/Iceberg 的 compaction。

## 五、易错点清单

- **「Spark 流处理是真流式」**：错。Structured Streaming 默认微批（秒级），Continuous Processing 才近似真流式且受限。毫秒级选 Flink。
- **「RDD 比 DataFrame 快」**：错。DataFrame 受 Catalyst + Tungsten 优化，通常比裸 RDD 快得多。RDD 只在非结构化/需细粒度控制时用。
- **「groupByKey 和 reduceByKey 等价」**：错。groupByKey 全量 shuffle 易 OOM；reduceByKey 有 map-side 预聚合，shuffle 少，优先用。
- **「transformations 会立即执行」**：错。transformations 惰性，只有 actions（collect/count/save）才触发执行。
- **「Spark 取代了整个 Hadoop」**：错。Spark 取代 MapReduce 计算层；HDFS（存储）+ YARN（资源）+ Hive Metastore 仍是 Spark 底座。
- **「collect 安全可用于大数据」**：错。collect 把数据拉到 driver 内存，大数据会 OOM。用 `take(n)`/`write` 替代。
- **「partition 数越多越好」**：错。过多 = 小任务调度开销 + shuffle 小文件多；过少 = 并行度不足。按数据量调。
- **「Structured Streaming 默认 exactly-once」**：错。默认 at-least-once，要 exactly-once 需幂等/事务 sink。
- **「MLlib 适合深度学习」**：错。MLlib 强在分布式传统 ML（GBM/KMeans/ALS），深度学习弱，通常配合 TensorFlow/PyTorch + ONNX。
- **「broadcast join 适合两张大表」**：错。broadcast 适合大表 JOIN 小表（小表 < broadcast 阈值，默认 10MB）。两表都大用 SortMergeJoin。
- **「watermark 在 Spark Streaming 没用」**：错。Structured Streaming 支持 event-time + watermark，概念与 Flink 一致，用于清理旧窗口状态。

## 六、进阶方向（链接其他叶）

- [Flink](../../stream/flink/) —— 真流式对照，毫秒级实时
- [Databricks](../databricks/) —— Spark 商业化平台 + Delta Lake + Photon
- [dbt](../dbt/) —— SQL 转换层，与 Spark SQL 互补

## 权威链接

- [Apache Spark 官方文档](https://spark.apache.org/docs/latest/)
- [Spark SQL & DataFrame Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
- [MLlib Programming Guide](https://spark.apache.org/docs/latest/ml-guide.html)
- [Spark Performance Tuning](https://spark.apache.org/docs/latest/tuning.html)
- 本站幻灯片：<a href="/SlideStack/spark-slide/" target="_blank">Spark</a>
