---
layout: doc
---

# Spark

**Apache Spark** 是一个**统一的大规模数据分析引擎**——它用**内存计算 + DAG 调度 + 惰性求值**把「批、流、SQL、机器学习、图计算」五大范式统一在一套引擎下，取代了早期 MapReduce 的「磁盘 shuffle、表达能力弱、迭代慢」。Spark 的核心抽象是 **RDD（弹性分布式数据集）**——一个不可变、分区、可并行、可容错的内存对象集合；在此之上又叠加了**结构化 API（DataFrame/Spark SQL）**（带 schema 的关系表，受 Catalyst 优化器优化，是现代主流）与**Spark Streaming / Structured Streaming**（流处理，微批为主）。理解 Spark 的全部考点围绕五个核心展开：①**RDD 哲学与惰性求值**（transformations 惰性、actions 触发，DAG 调度）；②**DataFrame/Spark SQL**（结构化数据 + Catalyst 优化器 + Tungsten 执行引擎，是生产主力）；③**Spark Streaming / Structured Streaming**（微批流处理，与 Flink 真流式对照）；④**MLlib**（机器学习库，与 DataFrame/Spark SQL 深度集成）；⑤**与 Hadoop/MapReduce 的历史关系 + 与 Flink 的架构对照**（Hadoop 是 Spark 的前辈与背景，MapReduce 已基本被 Spark 取代；Flink 是流处理领域的对照路线）。本叶是批处理与转换章的总览与地基——后续各叶在核心 API 与流处理维度深入。

## 评价

**优点**

- **统一引擎**：批/流/SQL/ML/图统一在 Spark 之上，无需学习多套系统，DataFrame 是所有 API 的公共底座
- **内存计算快**：相比 MapReduce 磁盘 shuffle，Spark 内存迭代快 10-100 倍，特别适合机器学习迭代
- **结构化 API + 优化器**：DataFrame/Spark SQL 有 Catalyst 优化器 + Tungsten 执行引擎（代码生成/堆外内存），性能接近手写
- **生态成熟**：MLlib 机器学习、GraphX 图计算、Structured Streaming 流、Spark SQL 数仓，外加 Delta Lake/Hudi/Iceberg 等表格式
- **多语言**：Scala/Java/Python/SQL/R 一致 API，开发者友好

**缺点**

- **流处理非真流式**：Structured Streaming 默认微批（攒批），延迟秒级，毫秒级实时场景需 Flink
- **内存消耗大**：内存计算是把双刃剑，大数据集 + 缓存不当易 OOM；调参（executor 内存/spill）是运维负担
- **小文件与 shuffle 坑**：shuffle 写大量小文件、调 partition 数（repartition/coalesce）是常见调优点
- **启动开销**：JVM 启动 + DAG 调度有秒级开销，超低延迟小任务不划算（不如 Flink 常驻或专门流引擎）

## 本叶地图

- [入门](./getting-started) —— Spark 定位与 Hadoop/MapReduce 历史背景、RDD 哲学与惰性求值、DAG 调度、架构（Driver/Executor/Cluster Manager）
- [核心 API：RDD、DataFrame 与 Spark SQL](./guide-line/core-apis) —— RDD 转换/行动算子、DataFrame 结构化 API、Catalyst 优化器、Spark SQL、MLlib 机器学习库
- [Spark Streaming、与 Flink 对比](./guide-line/streaming-and-comparison) —— DStream（已弃）vs Structured Streaming 微批、event-time/watermark、与 Flink 真流式的架构对照、选型
- [参考](./reference) —— RDD 算子速查、DataFrame API、Spark vs Flink vs Hadoop 对比、性能调优清单、易错点

## 幻灯片地址

<a href="/SlideStack/spark-slide/" target="_blank">Spark</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Spark" target="_blank" rel="noopener noreferrer">Spark 测试题</a>
