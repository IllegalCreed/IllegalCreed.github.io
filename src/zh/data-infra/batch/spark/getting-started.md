---
layout: doc
outline: [2, 3]
---

# 入门：Spark 定位、RDD 哲学与 DAG 调度

> 基于 Apache Spark 3.5 · 核于 2026-08

## 速查

- **Spark 定位**：**统一的大规模数据分析引擎**——把批、流、SQL、机器学习、图计算统一在一套引擎下，用**内存计算 + DAG 调度 + 惰性求值**取代 MapReduce 的磁盘 shuffle，迭代速度提升 10-100 倍。
- **历史背景：Hadoop/MapReduce**：Hadoop（2006）= HDFS（存储）+ MapReduce（计算）+ YARN（资源）。MapReduce 把计算分 map/reduce 两阶段，每阶段落磁盘——**慢**（尤其机器学习迭代多轮要反复读写磁盘）。Spark（2009，UC Berkeley AMPLab）用 RDD 内存迭代 + DAG 优化一举取代 MapReduce 计算层（HDFS/YARN 仍是 Spark 的存储/资源底座）。
- **核心抽象 RDD**：**弹性分布式数据集（Resilient Distributed Dataset）**——不可变、分区、可并行、可容错的内存对象集合。是 Spark 最底层抽象，所有上层 API（DataFrame/SQL/Streaming）都编译成 RDD 执行。
- **惰性求值（lazy evaluation）**：**transformations（转换）**如 `map`/`filter`/`groupBy` 是惰性的——只构建 DAG 不立即执行；**actions（行动）**如 `collect`/`count`/`save` 才触发整个 DAG 的实际计算。惰性让 Spark 全局优化（融合、流水线、裁剪）。
- **DAG 调度**：Spark 把 transformations 构建成**有向无环图（DAG）**，按 shuffle 边界切分成 **stage**，每个 stage 内是流水线（pipeline）执行，stage 间要 shuffle。相比 MapReduce 固定两阶段，DAG 灵活高效。
- **架构**：**Driver**（运行用户 main，构建 DAG、调度 task、跟踪状态）+ **Executor**（JVM 进程，跑 task、存缓存）+ **Cluster Manager**（YARN/K8s/Mesos/Spark Standalone，分配资源）。
- **血缘（lineage）容错**：RDD 不可变，丢失分区时按**血缘关系**（构建它的 transformations 链）重算恢复——无需复制数据。这是「弹性」的含义。
- **窄依赖 vs 宽依赖**：**窄依赖**（map/filter，父分区对应一个子分区）可流水线；**宽依赖**（groupBy/join，父分区对应多个子分区）必须 shuffle，是 stage 边界。
- **进阶顺序**：[核心 API：RDD、DataFrame 与 Spark SQL](./guide-line/core-apis) → [Spark Streaming、与 Flink 对比](./guide-line/streaming-and-comparison) → [参考](./reference)。

## 一、Spark 是什么：统一大数据引擎

大数据处理的痛点是「**数据量大到一台机器装不下，要分散到集群并行算**」。Hadoop/MapReduce 是第一代解法（2006），但有两个硬伤：①**表达能力弱**——只有 map/reduce 两阶段，复杂逻辑要拆成多轮 job 串联；②**慢**——每阶段（map 输出、reduce 输入）都落磁盘，机器学习迭代多轮反复读写磁盘，性能灾难。

Spark（2009，UC Berkeley AMPLab，2014 顶级项目）的核心贡献是：①**RDD 抽象**——内存里的分布式集合，迭代不用落磁盘；②**DAG 调度**——把多步转换构建成 DAG，全局优化、流水线执行；③**统一引擎**——批/流/SQL/ML/图都用同一套 RDD/DataFrame 底座。

```
Hadoop/MapReduce：    map ──磁盘──► shuffle ──磁盘──► reduce
                      每阶段落磁盘，迭代多轮 = 灾难

Spark：              RDD1 ──内存──► map ──内存──► filter ──内存──► reduce
                     构建 DAG，全局优化、流水线，迭代快 10-100 倍
```

Spark 没有取代 Hadoop 全部——**HDFS（存储）和 YARN（资源）仍是 Spark 的底座**，Spark 取代的是 MapReduce **计算层**。所以常说「Spark on YARN」「Spark 读 HDFS」。

## 二、RDD：弹性分布式数据集

RDD 是 Spark 最核心的抽象——一个**不可变、分区、可并行、可容错**的内存对象集合：

- **不可变（immutable）**：RDD 创建后不能改，每个 transformation 返回一个**新 RDD**。
- **分区（partitioned）**：RDD 数据分散在集群多台机器，每台存若干分区，并行处理。
- **可并行（parallel）**：不同分区可在不同 executor 上同时计算。
- **容错（resilient）**：分区丢失时按**血缘（lineage）**重算——记住了「这个 RDD 是怎么从父 RDD 转换来的」，丢失就重算 transformations 链。

```python
rdd = sc.textFile("hdfs:///logs/*")          # 从 HDFS 读
words = rdd.flatMap(lambda line: line.split())  # 转换（惰性，不执行）
pairs = words.map(lambda w: (w, 1))           # 转换（惰性）
counts = pairs.reduceByKey(lambda a, b: a + b)  # 转换（惰性，触发 shuffle）
result = counts.collect()                     # 行动！此刻整个 DAG 才执行
```

- **创建 RDD 的方式**：①外部数据源（`textFile` 读 HDFS/S3）；②集合并行化（`parallelize([1,2,3])`，测试用）；③已有 RDD 转换。
- **缓存**：`rdd.persist()` / `rdd.cache()` 把 RDD 放内存/磁盘，避免重算——机器学习迭代反复用同一数据集时关键。

## 三、惰性求值与 DAG

Spark 性能的秘密是**惰性求值 + DAG 调度**：

- **transformations（转换）是惰性的**：`map`/`filter`/`flatMap`/`groupBy`/`join` 等只构建 DAG 的节点，**不立即执行**。这样 Spark 在 action 触发时能看到完整计算图，做全局优化（算子融合、列裁剪、谓词下推、流水线）。
- **actions（行动）才触发执行**：`collect`（拉到 driver）/ `count`（计数）/ `save`（写存储）/ `take(n)`（取前 n 个）/ `foreach`（遍历副作用）。action 调用瞬间，Spark 把 DAG 转 task 调度到 executor 跑。

```
transformations（构建 DAG，惰性）：
  textFile → flatMap → map → reduceByKey
                                 │
action（触发）：count()  ◄──────┘
  此刻 Spark 把 DAG 切成 stage、调度 task、实际执行
```

- **窄依赖 vs 宽依赖**：
  - **窄依赖**（narrow）：父分区对应**一个**子分区（如 `map`/`filter`）。可在同一 executor 流水线执行，不 shuffle。
  - **宽依赖**（wide/shuffle）：父分区对应**多个**子分区（如 `groupBy`/`join`/`reduceByKey`）。必须 shuffle——数据按 key 重新分发，落磁盘，是 stage 边界，性能瓶颈点。
- **stage 划分**：Spark 按宽依赖边界把 DAG 切成 **stage**，每个 stage 内是窄依赖流水线，stage 间要 shuffle。

## 四、血缘容错：为什么「弹性」

分布式集群机器会故障，分区会丢。Spark 不靠复制数据容错，而靠**血缘（lineage）**：

- 每个 RDD 记住「我是怎么从父 RDD 转换来的」（即 transformations 链）。
- 某分区丢失时，Spark 按血缘**重算**该分区——从父 RDD 的对应分区重跑 transformations 链恢复。
- 这比复制（如 HDFS 的 3 副本）省存储——只多记一份「血缘元数据」，但故障时重算有延迟。

「弹性（Resilient）」正指此——能从故障中弹性恢复。代价是长血缘链重算慢，所以迭代场景常用 `persist()` 把中间 RDD 缓存到内存，缩短重算链。

## 五、架构：Driver、Executor 与 Cluster Manager

Spark 应用是「一个 Driver + 多个 Executor」结构：

```
              ┌───────────────────────┐
              │   Driver（你的 main）   │  · 构建 DAG、切 stage、调度 task
              │   SparkContext          │  · 跟踪 task 状态、缓存元数据
              └───────────┬───────────┘
                          │ 向 Cluster Manager 申请资源
              ┌───────────▼───────────┐
              │   Cluster Manager      │  YARN / K8s / Mesos / Standalone
              └───────────┬───────────┘
                          │ 分配 container/pod
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
  ┌──────────┐       ┌──────────┐       ┌──────────┐
  │ Executor │       │ Executor │       │ Executor │
  │ (JVM)    │       │ (JVM)    │       │ (JVM)    │
  │ task cache│      │ task cache│      │ task cache│
  └──────────┘       └──────────┘       └──────────┘
```

- **Driver**：运行用户的 `main` 函数，创建 `SparkContext`/`SparkSession`，构建 DAG，把 DAG 切成 stage、把 stage 切成 task，调度 task 到 executor，跟踪 task 状态与缓存。
- **Executor**：在 worker 节点跑的 JVM 进程，运行 task、存 RDD/DataFrame 缓存。一个应用有多个 executor，每个 executor 有若干 core（并发 task 数）和内存。
- **Cluster Manager**：分配集群资源（CPU/内存）给 Spark 应用。主流是 **YARN**（Hadoop 生态，最常见）、**Kubernetes**（云原生趋势）、**Mesos**（衰退）、**Standalone**（Spark 自带，轻量测试）。
- **部署模式**：**client**（driver 在提交机器本地，适合交互）vs **cluster**（driver 跑在集群内，适合生产长期作业）。

## 下一步

理解了 Spark 的总览后，下一步深入两个核心机制——[核心 API：RDD、DataFrame 与 Spark SQL](./guide-line/core-apis)（DataFrame/Catalyst/MLlib）与 [Spark Streaming、与 Flink 对比](./guide-line/streaming-and-comparison)（微批流处理与真流式对照）。
