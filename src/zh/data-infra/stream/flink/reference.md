---
layout: doc
outline: [2, 3]
---

# 参考：Flink 状态、窗口、Checkpoint 速查与选型

> 基于 Apache Flink 1.20 · 核于 2026-08

## 速查

- **Flink 定位**：有状态的流式数据流处理引擎，真流式 + 流批统一。批是「有限的流」。
- **三类时间**：event-time（数据时间戳，最符合业务）/ processing-time（机器时钟，延迟低但不确定）/ ingestion-time（进入 Flink 时间）。
- **Watermark**：单调递增时间戳，语义「≤ 此时间的应都到齐」。多上游取最小值传播。
- **三类窗口**：滚动（不重不漏）/ 滑动（可重叠）/ 会话（数据驱动动态切）。
- **状态五类**：ValueState / ListState / MapState / ReducingState / AggregatingState。
- **状态后端**：HashMapStateBackend（堆内存，小状态）/ EmbeddedRocksDBStateBackend（磁盘，TB 级，生产默认）。
- **Checkpoint**：Chandy-Lamport barrier 快照，故障恢复基础。aligned（对齐）vs unaligned（背压场景）。
- **exactly-once**：可重放 source + Checkpoint + 事务/幂等 sink 三件套。
- **Savepoint**：手动快照，按算子 uid() 绑定，用于版本升级/作业迁移。
- **CEP**：复杂事件处理，Pattern + NFA 模式匹配，做风控/IoT/告警。

## 一、状态类型速查

| 状态 | 接口 | 读写 | 典型用途 |
| --- | --- | --- | --- |
| **ValueState&lt;T&gt;** | `value()` / `update(T)` | 单值 | 计数、最新值、上次时间戳 |
| **ListState&lt;T&gt;** | `add(T)` / `get()` / `update(List)` | 有序列表 | 窗口缓存、CEP 缓冲 |
| **MapState&lt;K,V&gt;** | `put/get/entries` | 键值映射 | 去重集合、UV 桶 |
| **ReducingState&lt;T&gt;** | `add(T)` 自动聚合 | 同类型聚合 | 求和、最大值 |
| **AggregatingState&lt;IN,OUT&gt;** | `add(IN)` 自动聚合 | 聚合后类型可变 | 平均值（累加 sum/count 输出 double） |

获取方式：在 `RichFunction.open()` 里 `getRuntimeContext().getState/getListState/getMapState(descriptor)`。

## 二、窗口对比

| 窗口 | 分配器 | 重叠 | 边界 | 典型 |
| --- | --- | --- | --- | --- |
| **滚动 Tumbling** | `TumblingEventTimeWindows.of(size)` | 不重不漏 | 固定、对齐 | 每分钟 PV、每天 UV |
| **滑动 Sliding** | `SlidingEventTimeWindows.of(size, slide)` | 可重叠 | 固定 | 过去 5 分钟每 1 分钟 |
| **会话 Session** | `EventTimeSessionWindows.withGap(gap)` | 不重叠 | 数据驱动 | 用户一次会话行为 |
| **全局 Global** | `GlobalWindows.create()` | — | 单窗口 | 需自定义 Trigger，慎用 |

注意：滑动窗口 slide > size 时会有数据丢失（落不进任何窗口），慎用。

## 三、时间与 Watermark 速查

| 时间语义 | 含义 | 确定性 | 延迟 | 用法 |
| --- | --- | --- | --- | --- |
| **event-time** | 数据自带时间戳 | ✅ 高（可重放） | 中（等 watermark） | 业务统计默认 |
| **processing-time** | 算子机器时钟 | ❌ 低（受处理速度影响） | 最低 | 粗略实时、能容忍误差 |
| **ingestion-time** | 进入 Flink 时间 | 中 | 低 | 折中，少用 |

```java
WatermarkStrategy<Event> ws = WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))  // 允许 5s 乱序
    .withTimestampAssigner((e, t) -> e.eventTime)
    .withIdleness(Duration.ofMinutes(1));                     // 空闲分区跳过
stream.assignTimestampsAndWatermarks(ws);
```

## 四、Checkpoint 与 Savepoint 配置速查

```java
env.enableCheckpointing(60_000);                          // 60 秒一次
env.getCheckpointConfig().setCheckpointingMode(EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30_000);  // 两次间最少间隔
env.getCheckpointConfig().setCheckpointTimeout(600_000);          // 超时 10 分钟
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);         // 并发 1 个
env.getCheckpointConfig().setExternalizedCheckpointCleanup(
    RETAIN_ON_CANCELLATION);                              // 取消作业时保留
env.getCheckpointConfig().enableUnalignedCheckpoints();   // 背压场景
```

| | Checkpoint | Savepoint |
| --- | --- | --- |
| 触发 | 自动周期 | 手动 CLI |
| 用途 | 故障恢复 | 升级/迁移/暂停 |
| 格式 | 增量（RocksDB） | 标准化 |
| 算子绑定 | 位点 | uid() |
| 生命周期 | 取消常删（可保留） | 长期保留 |

## 五、Flink vs Spark Streaming vs Kafka Streams

| 维度 | Flink | Spark Streaming | Kafka Streams |
| --- | --- | --- | --- |
| 架构 | **真流式**（逐条） | **微批**（攒批） | 嵌入式库（真流式） |
| 延迟 | **毫秒级** | 秒级（依赖批次间隔） | 毫秒级 |
| 状态 | Keyed/Operator State，丰富 | 较弱（需 checkpoint） | 强（state stores） |
| event-time + watermark | ✅ 一等公民 | ✅（结构化流式） | ✅ |
| exactly-once | ✅（Checkpoint + 2PC sink） | ✅（结构化流式） | ✅（事务） |
| SQL/CEP | ✅ 全功能 | ✅ SQL | ❌ 无 SQL |
| 部署 | 独立集群 | Spark 集群 | 嵌入应用进程 |
| 适用 | 实时数仓/风控/CEP | 准实时、与 Spark 统一栈 | Kafka 为主、轻量流处理 |

## 六、易错点清单

- **「批处理和流处理是两套引擎」**：错。Flink 流批统一，批是「有限的流」，同一套 DataStream/SQL 运行时。
- **「processing-time 比 event-time 准」**：错。processing-time 受处理速度/重放影响结果不确定；event-time 用数据时间戳结果确定可重放。
- **「watermark 越大越好」**：错。watermark 大延迟高。要按业务乱序容忍度调（一般秒级）。
- **「滑动窗口 slide 可以大于 size」**：错。slide > size 时部分数据落不进任何窗口会丢。
- **「state 不需要清理」**：错。去重/会话状态会无限膨胀，必须配 TTL 或窗口自动清理。
- **「Checkpoint 模式 EXACTLY_ONCE 就端到端 exactly-once」**：错。Checkpoint 只保证框架内部；source 要可重放（Kafka offset）、sink 要事务/幂等，三方协同才是端到端。
- **「savepoint 和 checkpoint 完全一样」**：错。savepoint 按 uid() 绑定、跨版本兼容好；checkpoint 按位点、取消常删。
- **「改代码后从 savepoint 恢复一定能成功」**：错。改了状态结构（如 ValueState 改 MapState）或没固定 uid 可能对不上，需自定义序列化迁移。
- **「RocksDB 状态后端比 HashMap 快」**：错。RocksDB 有序列化开销，比堆内存慢；它胜在能撑 TB 级状态不 OOM。
- **「CEP 模式不需要 keyBy」**：CEP 必须在 keyed stream 上调用（每 key 一个 NFA 状态机），否则会抛异常。
- **「会话窗口有固定大小」**：错。会话窗口大小由数据自身驱动，不活跃超 gap 即切，长度可变。

## 七、进阶方向（链接其他叶）

- [Spark](../../batch/spark/) —— 微批路线对照，流批哲学对比
- [Databricks](../../batch/databricks/) —— Spark 商业化平台，结构化流式
- [dbt](../../batch/dbt/) —— 批处理 SQL 转换层，与 Flink SQL 互补（离线 vs 实时）

## 权威链接

- [Apache Flink 官方文档](https://nightlies.apache.org/flink/flink-docs-stable/)
- [Flink Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/)
- [Flink Table API & SQL](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/table/overview/)
- [Chandy-Lamport 算法论文](https://lamport.azurewebsites.net/pubs/chandy.pdf)
- [Flink CEP 文档](https://nightlies.apache.org/flink/flink-docs-stable/docs/libs/cep/)
- 本站幻灯片：<a href="/SlideStack/flink-slide/" target="_blank">Flink</a>
