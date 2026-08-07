---
layout: doc
outline: [2, 3]
---

# 有状态流处理与窗口：State、Watermark 与迟到数据

> 基于 Apache Flink 1.20 · 核于 2026-08

## 速查

- **为什么要有状态**：流是无界的，窗口聚合/去重/JOIN/CEP 都要「记住中间结果」。Flink 把状态抽象成**一等公民**，并由框架负责状态的**容错**（Checkpoint）与**迁移**（Savepoint）。
- **Keyed State vs Operator State**：`keyBy()` 后按 key 隔离的是 Keyed State（每 key 独立一份，最常用）；算子级不按 key 的是 Operator State（如 Kafka Source 记每分区 offset）。
- **Keyed State 五种**：`ValueState`（单值）、`ListState`（列表）、`MapState`（键值）、`ReducingState`（同类型聚合）、`AggregatingState`（聚合后类型可变）。通过 `RuntimeContext.getXxxState(descriptor)` 在 `RichFunction` 中获取。
- **状态后端（State Backend）**：决定状态存哪、Checkpoint 怎么做。`HashMapStateBackend`（状态在 TM 堆内存，Checkpoint 全量快照，快但受内存限）vs `EmbeddedRocksDBStateBackend`（状态存 RocksDB，Checkpoint 增量，支持 TB 级状态，**生产大规模默认**）。
- **状态 TTL**：给状态设过期时间（`StateTtlConfig.newBuilder(Time.hours(1))`），到期自动清理——防止状态无限膨胀（如去重集合爆炸）。
- **窗口三要素**：**分配器 Assigner**（决定数据进哪个窗口）、**触发器 Trigger**（何时计算）、**函数 Function**（怎么聚合）。
- **三类窗口**：**滚动 Tumbling**（固定大小对齐，不重不漏）、**滑动 Sliding**（窗口+步长，可重叠）、**会话 Session**（按活动间隙动态切分）。前两者时间驱动，会话由数据自身驱动。
- **Watermark 生成**：`WatermarkStrategy.forBoundedOutOfOrderness(d)`（最常用，允许 d 乱序）；或 `forMonotonousTimestamps()`（严格递增无乱序）。在 source 后 `.assignTimestampsAndWatermarks(ws)` 挂上。
- **Watermark 传播**：多并行度下，算子取**所有上游 watermark 的最小值**作为自身 watermark——保证「所有分区都到齐才算到齐」。
- **迟到数据**：watermark 已超过窗口结束仍到达的数据。用 `allowedLateness(d)` 允许窗口保留 d 内接收迟到数据并再次触发；超出的迟到数据走 **侧路输出 side output**（不丢但单独处理）。

## 一、状态：让算子能记住

无状态的 `map`/`filter` 来一条算一条就忘，但聚合/去重/JOIN 要记住历史。Flink 让算子持有**状态**并负责其容错：

```java
// 统计每个 key 的访问次数（Keyed State）
public class CountByKey extends KeyedProcessFunction<String, Event, Result> {
    private ValueState<Long> countState;

    @Override
    public void open(Configuration cfg) {
        // 通过 StateDescriptor 声明状态
        countState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("count", Long.class));
    }

    @Override
    public void processElement(Event evt, Context ctx, Collector<Result> out) throws Exception {
        Long cnt = countState.value();      // 读
        cnt = (cnt == null) ? 1L : cnt + 1;  // 改
        countState.update(cnt);              // 写
        out.collect(new Result(evt.key, cnt));
    }
}
```

状态必须**可序列化**（Checkpoint 要把它写出去），所以状态类型要实现 Flink 的 `TypeInformation`（通常自动推断）。

## 二、Keyed State 五种类型

`keyBy()` 之后，每个 key 拥有独立的状态命名空间，互不影响。五种内置状态：

| 状态 | 语义 | 典型用途 |
| --- | --- | --- |
| **ValueState&lt;T&gt;** | 单个值 | 计数、最新值、上次时间戳 |
| **ListState&lt;T&gt;** | 有序列表 | 窗口缓存元素、CEP 模式缓冲 |
| **MapState&lt;K,V&gt;** | 键值映射 | 去重集合、聚合桶（如 UV 的 user→bool） |
| **ReducingState&lt;T&gt;** | 同类型聚合（用 ReduceFunction） | 累加和、最大值 |
| **AggregatingState&lt;IN,OUT&gt;** | 聚合后类型可变 | 平均值（累加 count+sum 后输出 double） |

- **ReducingState vs AggregatingState**：前者输入输出同类型（如 `Long` 求和）；后者可变（如输入事件、输出 `Avg(sum,count)`）。
- **MapState 是去重利器**：UV 统计用 `MapState<userId, Boolean>` 记住见过的用户，窗口结束时统计 size。
- **清空时机**：窗口算子的状态在窗口结束时自动清；ProcessFunction 的状态需手动管（或配 TTL）。

## 三、Operator State：不依赖 key 的状态

Operator State 不在 `keyBy()` 之后，是整个算子并行实例共享一份语义的状态。典型场景：

- **Kafka Source 的 offset**：每个分区一个 offset，靠 **union 重分布**——故障恢复时所有分区 offset 汇总后重新均分。
- **自定义 source/sink**：记录与外部系统的连接位点。

Operator State 通过实现 `CheckpointedFunction` 接口的 `snapshotState` / `initializeState` 管理，多用 `ListState`（因为要支持 union 重分布）。

## 四、状态后端：状态存哪

状态后端（State Backend）决定**状态在 TaskManager 里怎么存**以及 **Checkpoint 怎么做**：

| 后端 | 状态位置 | Checkpoint 方式 | 适用 |
| --- | --- | --- | --- |
| **HashMapStateBackend** | TM 堆内存（JVM 对象） | 全量快照（也可配增量） | 中小状态（GB 内）、低延迟读写 |
| **EmbeddedRocksDBStateBackend** | TM 本地 RocksDB（磁盘） | **增量快照**（只传变化） | **大规模状态（TB 级），生产默认** |

- **RocksDB 的代价**：每次读写要序列化/反序列化（K/V 是 byte[]），比堆内存慢——但状态量大时堆内存会 OOM，RocksDB 靠磁盘撑住。
- **配置**：`env.setStateBackend(new EmbeddedRocksDBStateBackend())`，或 1.13+ 用 `config.setConfiguration(...)` 配统一 state backend。
- **Checkpoint 存哪**：状态快照写到 **checkpoint storage**：`FileSystemCheckpointStorage`（HDFS/S3）或 `JobManagerCheckpointStorage`（JM 内存，仅测试）。

## 五、状态 TTL：防止状态膨胀

去重/会话等场景状态会无限增长（如永久记住所有 user id）。**TTL（Time-To-Live）** 给状态设过期时间：

```java
StateTtlConfig ttlConfig = StateTtlConfig
    .newBuilder(Time.hours(1))                          // 1 小时过期
    .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite) // 读写都刷新
    .setStateVisibility(StateTtlConfig.StateVisibility.NeverReturnExpired) // 过期即不可见
    .cleanupInRocksdbCompactFilter(1000)                // RocksDB 压缩时清理
    .build();
descriptor.enableTimeToLive(ttlConfig);
```

- **TTL 计时基准**：默认按**处理时间**（也可配事件时间），从状态最后更新时刻起算。
- **清理策略**：Flink 不主动扫描全量状态清过期项（太贵），而是在**读取时**惰性跳过、**后台快照**时清理、**RocksDB 压缩**时清理（`cleanupInRocksdbCompactFilter`）。

## 六、窗口三要素与三类窗口

窗口把无界流切成有限片段。一个完整窗口由**分配器（Assigner）+ 触发器（Trigger）+ 函数（Function）**组成：

```java
stream
  .keyBy(e -> e.userId)
  .window(TumblingEventTimeWindows.of(Time.minutes(5)))  // Assigner：滚动 5 分钟
  // .trigger(...)                                        // Trigger：默认 watermark 触发
  .aggregate(new MyAggregateFunction());                  // Function：聚合
```

三类窗口语义：

```
时间 ──────────────────────────────────────────►

滚动 Tumbling（5min）：每 5 分钟一个桶，不重不漏
  |--- w1 ---|--- w2 ---|--- w3 ---|
  每条数据落且仅落一个窗口

滑动 Sliding（窗口 5min，步长 1min）：可重叠
  |-- w1 --|
   |-- w2 --|
    |-- w3 --|
  一条数据可能落进多个窗口（5 个）

会话 Session（gap 10min）：按不活跃间隙切分
  |--用户活跃--|     gap     |--用户活跃--|
       s1                      s2
  会话长度由数据自身决定，无固定边界
```

- **滚动**：`TumblingEventTimeWindows.of(size)`，全局对齐（如 0-5、5-10），需注意时区（`.withOffset`）。
- **滑动**：`SlidingEventTimeWindows.of(size, slide)`，size 是窗口长度、slide 是步长。当 slide < size 重叠，slide > size 有数据会被丢（一般用 GlobalWindow 替代）。
- **会话**：`EventTimeSessionWindows.withGap(gap)` 或动态 gap（`withDynamicGap`）。数据驱动——两个事件间隔超过 gap 就分到不同会话。

## 七、Watermark：处理乱序的核心

事件时间下，数据可能因网络/分区延迟而乱序到达。watermark 是 Flink 处理乱序的核心机制：

- **语义**：watermark = 时间戳 W，表示「**事件时间 ≤ W 的所有数据应该都到齐了**」。算子收到 watermark 后会触发所有「窗口结束时间 ≤ W」的窗口计算。
- **生成**：`WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(5))` —— watermark = 已见最大时间戳 - 5 秒。乱序容忍度越大，结果越完整但延迟越高。
- **严格递增**：若数据严格按时间戳递增（无乱序），用 `forMonotonousTimestamps()` —— watermark = 已见最大时间戳。
- **传播**：算子有多个上游时，自身 watermark = **min(所有上游 watermark)**。watermark 通过数据流像事件一样传播。

```java
WatermarkStrategy<Event> ws = WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
    .withTimestampAssigner((evt, ts) -> evt.eventTime); // 指定事件时间字段

stream.assignTimestampsAndWatermarks(ws);
```

- **空闲来源（idle source）**：某分区长时间无数据，watermark 不推进导致整个作业卡住——用 `.withIdleness(Duration.ofMinutes(1))` 标记空闲分区跳过它。

## 八、迟到数据：allowed-lateness 与侧路输出

watermark 超过窗口结束时间后窗口会被清理，此时仍到达的数据叫**迟到数据**。两层兜底：

1. **allowed-lateness**：窗口计算后仍保留一段时间接收迟到数据，到达时再次触发计算（结果可能下发到下游）。
2. **侧路输出（side output）**：超出 allowed-lateness 的迟到数据不再进入主流，通过 `OutputTag` 单独收集——不丢但单独处理（如写到死信队列）。

```java
OutputTag<Event> lateTag = new OutputTag<Event>("late"){};

DataStream<Result> result = stream
    .keyBy(e -> e.userId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .allowedLateness(Time.minutes(1))    // 允许窗口结束后 1 分钟内迟到
    .sideOutputLateData(lateTag)         // 超出的迟到数据走侧路
    .aggregate(new MyAgg());

DataStream<Event> lateEvents = result.getSideOutput(lateTag); // 单独处理
```

## 下一步

掌握了状态、窗口、watermark 后，下一步是 [Flink SQL、Checkpoint 与 CEP](./sql-and-checkpoint) ——如何用 SQL 写流处理、Chandy-Lamport 分布式快照如何保证 exactly-once、CEP 如何做模式匹配。
