---
layout: doc
outline: [2, 3]
---

# 核心 API：RDD、DataFrame 与 Spark SQL

> 基于 Apache Spark 3.5 · 核于 2026-08

## 速查

- **三层 API**：①**RDD**（最底层，对象集合，灵活但无优化）；②**DataFrame/DataSet**（结构化，带 schema，受 Catalyst 优化，**生产主力**）；③**Spark SQL**（用 SQL 查 DataFrame，分析师友好）。三层都编译成 RDD 执行，但上层有优化器加持。
- **RDD 算子**：**transformations**（惰性）——`map`/`filter`/`flatMap`/`mapPartitions`/`distinct`/`union`/`intersection`/`groupByKey`/`reduceByKey`/`join`；**actions**（触发）——`collect`/`count`/`take`/`reduce`/`saveAsTextFile`/`foreach`。
- **DataFrame**：带 schema 的分布式「表」（类似 Pandas DataFrame/数据库表），有列名和类型。受 **Catalyst 优化器**（逻辑+物理计划优化）和 **Tungsten 执行引擎**（代码生成 + 堆外内存）加持，性能远超裸 RDD。
- **Catalyst 优化器**：Spark SQL/DataFrame 的查询优化器——分析（resolve 列名/类型）、逻辑优化（谓词下推、列裁剪、常量折叠）、物理优化（选 join 策略、广播 vs shuffle）、代码生成（whole-stage codegen）。
- **Spark SQL**：用标准 SQL 查 DataFrame，`spark.sql("SELECT ... FROM ...")`。底层与 DataFrame 共享 Catalyst，是分析师与数仓的主力接口。
- **MLlib**：Spark 的机器学习库——分类/回归/聚类/协同过滤/特征工程/模型评估，与 DataFrame 深度集成（`pyspark.ml` 的 Pipeline/Transformer/Estimator）。适合大规模分布式 ML（GBM、KMeans），深度学习通常配合 ONNX/TensorFlow。
- **reduceByKey vs groupByKey**：`reduceByKey` 在 shuffle 前先本地聚合（map-side combine），shuffle 数据量小，**优先用**；`groupByKey` 直接 shuffle 全量，大数据集易 OOM，慎用。
- **partition 数**：控制并行度。过多 = 小任务调度开销大、shuffle 写小文件多；过少 = 并行度不足。用 `repartition(n)`（shuffle 重分布）或 `coalesce(n)`（仅减少，尽量不 shuffle）调整。

## 一、三层 API：RDD、DataFrame 与 Spark SQL

Spark 提供三层 API，从底层到高层抽象越来越强、优化越来越好：

```
应用层      Spark SQL（spark.sql("SELECT ...")）
              │ 共享 Catalyst 优化器
            DataFrame / Dataset（df.select/where/groupBy）
              │ 编译为
执行层      RDD（rdd.map/filter/reduceByKey）── 物理执行
```

| API | 抽象层级 | schema | 优化 | 适用 |
| --- | --- | --- | --- | --- |
| **RDD** | 底层（对象集合） | 无 | 无（用户全控） | 非结构化、需要细粒度控制 |
| **DataFrame/Dataset** | 结构化（带列的表） | 有 | **Catalyst + Tungsten** | **生产主力**，结构化数据 |
| **Spark SQL** | SQL 文本 | 有 | Catalyst | 分析师、数仓 SQL |

- **DataFrame 是公共底座**：现代 Spark 推荐几乎全用 DataFrame/SQL，RDD 仅在「非结构化、需要底层控制」时用。
- **Dataset**（Scala/Java 强类型版 DataFrame）有编译期类型检查，Python 没有真正的 Dataset（Python DataFrame 即是）。

## 二、RDD 算子：transformations 与 actions

RDD 操作分两类，理解惰性是关键：

```python
rdd = sc.textFile("hdfs:///logs/*")

# transformations（惰性，构建 DAG，不执行）
words = rdd.flatMap(lambda l: l.split())   # 拆词
pairs = words.map(lambda w: (w, 1))        # 映射成 (word, 1)
counts = pairs.reduceByKey(lambda a, b: a + b)  # 按 key 求和（shuffle）
filtered = counts.filter(lambda kv: kv[1] > 10) # 过滤高频词

# actions（触发整个 DAG 执行）
print(counts.count())                      # 计数
result = filtered.collect()                # 拉到 driver
counts.saveAsTextFile("hdfs:///out")       # 写存储
```

**常用 transformations**：`map`（一对一）、`flatMap`（一对多）、`filter`（过滤）、`mapPartitions`（按分区处理，比 map 高效）、`distinct`、`union`、`intersection`、`subtract`、`groupByKey`、`reduceByKey`、`aggregateByKey`、`join`、`cogroup`、`repartition`、`coalesce`、`sortBy`。

**常用 actions**：`collect`（拉到 driver，慎用于大数据）、`count`、`countByKey`、`take(n)`、`first`、`reduce`、`fold`、`aggregate`、`saveAsTextFile`、`saveAsSequenceFile`、`foreach`。

## 三、reduceByKey vs groupByKey：性能分水岭

聚合时 `reduceByKey` 远优于 `groupByKey`：

- **reduceByKey**：shuffle **之前**先在每个分区本地聚合（map-side combine），再把**已聚合的小结果** shuffle 到下游继续聚合。shuffle 数据量大幅减少。
- **groupByKey**：直接把**全量** (key, value) shuffle 到下游，下游再聚合。大数据集 shuffle 数据量大、易 OOM。

```python
# 推荐：reduceByKey（本地预聚合，shuffle 少）
pairs.reduceByKey(lambda a, b: a + b)

# 慎用：groupByKey（全量 shuffle，易 OOM）
pairs.groupByKey().mapValues(lambda vs: sum(vs))

# aggregateByKey / foldByKey 也有本地预聚合，适合复杂聚合
```

**选型**：能用 `reduceByKey`/`aggregateByKey`/`foldByKey`（有 map-side combine）就别用 `groupByKey`。`groupByKey` 只在「真的需要拿到全部 value 列表」时用。

## 四、DataFrame：结构化 API 与 Catalyst 优化器

DataFrame 是带 schema 的分布式表，受 **Catalyst 优化器**与 **Tungsten 执行引擎**加持：

```python
df = spark.read.json("hdfs:///people.json")    # 自动推断 schema
df2 = (df.filter(df.age > 21)                  # 谓词下推
        .select("name", "age")
        .groupBy("age")
        .avg("salary")
        .orderBy("age"))
df2.show()
```

**Catalyst 优化器**的四个阶段：

1. **分析（Analysis）**：把未解析的列名/类型与 catalog 比对，解析成「逻辑计划」。
2. **逻辑优化（Logical Optimization）**：基于规则优化——**谓词下推**（filter 提前到靠近 source）、**列裁剪**（只读用到的列）、**常量折叠**（编译期算常量）、**表达式简化**。
3. **物理计划（Physical Planning）**：生成多个物理策略，按代价选最优——如 join 选 **BroadcastHashJoin**（小表广播）vs **SortMergeJoin**（大表 shuffle sort）vs **ShuffleHashJoin**。
4. **代码生成（Code Generation）**：**whole-stage codegen** 把整个 stage 编译成单个 Java 函数，避免虚函数调用与对象分配。

**Tungsten 执行引擎**：堆外内存（避免 GC）、二进制处理（紧凑列存）、代码生成，让 DataFrame 性能接近手写 Java。

## 五、Spark SQL：用 SQL 查 DataFrame

Spark SQL 让分析师用标准 SQL 查 DataFrame，底层与 DataFrame 共享 Catalyst：

```python
df.createOrReplaceTempView("people")           # 注册成临时视图

result = spark.sql("""
  SELECT age, AVG(salary) AS avg_sal
  FROM people
  WHERE age > 21
  GROUP BY age
  ORDER BY age
""")
```

- **临时视图**：`createOrReplaceTempView`（session 内）、`createGlobalTempView`（跨 session）。
- **Catalog**：管理数据库/表/视图/函数，支持 `CREATE TABLE`（外部表如 Hive Metastore、Parquet/ORC 文件）。
- **Hive 兼容**：`enableHiveSupport()` 可读 Hive Metastore，跑 HiveQL——是数仓迁移的关键。

## 六、MLlib：分布式机器学习库

MLlib 是 Spark 的机器学习库，与 DataFrame 深度集成（`pyspark.ml` / `scala.ml`）：

- **算法**：分类（逻辑回归/随机森林/GBDT/SVM）、回归、聚类（KMeans/GMM）、协同过滤（ALS）、频繁项集（FP-Growth）。
- **特征工程**：Tokenizer、OneHotEncoder、StandardScaler、PCA、StringIndexer 等 Transformer。
- **Pipeline**：把多个 Transformer + Estimator 串成流水线（类似 sklearn），便于训练-评估-部署一致。
- **适用**：**大规模分布式 ML**（数据量大到单机 scikit-learn 装不下）。深度学习（神经网络）MLlib 弱，通常配合 ONNX 跑推理或用 TensorFlow/PyTorch 单机训练 + Spark 数据预处理。

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, OneHotEncoder
from pyspark.ml.classification import RandomForestClassifier

idx = StringIndexer(inputCol="city", outputCol="cityIdx")
ohe = OneHotEncoder(inputCol="cityIdx", outputCol="cityVec")
rf = RandomForestClassifier(featuresCol="cityVec", labelCol="label")
pipe = Pipeline(stages=[idx, ohe, rf])
model = pipe.fit(train)
```

## 下一步

掌握了核心 API 后，下一步是 [Spark Streaming、与 Flink 对比](./streaming-and-comparison) —— 微批流处理与真流式的架构对照、event-time/watermark、选型决策。
