---
layout: doc
outline: [2, 3]
---

# 入门：Flink 定位、流批统一与时间语义

> 基于 Apache Flink 1.20 · 核于 2026-08

## 速查

- **Flink 定位**：**有状态的流式数据流处理引擎**——逐条处理无界数据流（延迟毫秒级），同时把批（有界数据）当作「有限的流」统一处理。与 Spark「攒批再算」的微批路线不同，Flink 是**真流式**架构。
- **流批统一**：同一套 DataStream API / Flink SQL 跑流与批。流 = 无界（unbounded，持续到来）；批 = 有界（bounded，有限数据集）。批不是独立引擎，而是「知道数据有边界、有序处理完即结束」的流。
- **有状态（stateful）**：算子（operator）可维护可查询的**状态**（如窗口累加值、去重集合、JOIN 缓存）。状态是复杂聚合/去重/JOIN 的基础——没有状态就只能做无记忆的逐条映射。
- **三类时间**：①**事件时间 event-time**（数据本身携带的时间戳，最符合业务语义）；②**处理时间 processing-time**（算子处理到这条数据的机器时钟，延迟最低但不确定）；③**摄入时间 ingestion-time**（进入 Flink 的时间，折中）。
- **Watermark（水位线）**：event-time 下处理**乱序数据**的机制——一个单调推进的时间戳，告诉算子「小于此时间的所有数据应该都到齐了，可以触发窗口计算」。watermark 越大，延迟越高但结果越完整。
- **窗口（Window）**：把**无界流**切成**有限片段**以便聚合。三类：**滚动窗口 tumbling**（不重不漏，固定大小）、**滑动窗口 sliding**（可重叠）、**会话窗口 session**（按活跃间隙聚合，无固定边界）。
- **架构**：**JobManager**（Master，调度/Checkpoint 协调/故障恢复）+ **TaskManager**（Worker，跑算子、存状态、含多个 Slot）。客户端提交 JobGraph，JM 调度到 TM 的 Slot 上。
- **Checkpoint**：基于 **Chandy-Lamport 分布式快照**算法，周期性把全量算子状态 + 输入位点持久化。故障后从最近的 Checkpoint 恢复，是**精确一次（exactly-once）**的基石。
- **exactly-once**：故障恢复后，每条数据「恰好被处理一次」——既不丢（at-most-once 的坑）也不重（at-least-once 的坑）。靠 Checkpoint（状态快照）+ 可重放的源（Kafka offset）+ 幂等/事务写汇（sink）共同保证。
- **进阶顺序**：[有状态流处理与窗口](./guide-line/stateful-streaming) → [Flink SQL、Checkpoint 与 CEP](./guide-line/sql-and-checkpoint) → [参考](./reference)。

## 一、Flink 是什么：真流式处理引擎

流处理的核心问题是「**数据是源源不断到来的，怎么对它做计算**」。两条技术路线：

1. **真流式（native streaming，Flink 路线）**：每来一条数据**立刻**流经算子链处理，端到端延迟可压到毫秒。状态、窗口、时间是一等公民，因为流是无界的，要靠它们「记住中间结果」和「切分可计算片段」。
2. **微批（micro-batch，Spark Streaming 路线）**：把流按时间（如每秒）攒成一个小批次，再用批引擎处理。延迟取决于批次间隔（秒级），实现简单但延迟下限高。

Flink 选了真流式 + **流批统一**——批不是另一个引擎，而是「数据有边界、按 event-time 有序、处理完即结束」的流：

```
   无界流（unbounded）          有界流（bounded = 批）
   ─────────────────►          ▓▓▓▓▓▓►
   持续到来，永不结束            有限数据，处理完即停
        │                            │
        └──────── 同一套 DataStream API / SQL ────────┘
                      同一个 Flink 运行时
```

一句话：**Flink 把流当作最通用的抽象，批是流的特例**——这与 Spark「把流当作微批」的哲学正好相反。

## 二、有状态流处理：算子能「记住」

传统 map/filter 是**无状态**的——来一条算一条，算完就忘。但很多业务要「记住」：

- **窗口聚合**：每 5 分钟统计 UV，要记住当前窗口内已到来的用户集合。
- **去重**：每条订单判重，要记住见过的所有订单号。
- **流式 JOIN**：订单流 JOIN 用户流，要缓存用户数据。
- **CEP 模式**：检测「登录失败 3 次后成功」要记住失败次数。

Flink 让每个算子维护**状态（state）**，并负责状态的**容错**（Checkpoint 把状态快照持久化，故障后恢复）。状态分两类：

- **Keyed State**（最常用）：在 `keyBy()` 之后，每个 key 独立一份状态。有 `ValueState`（单值）、`ListState`（列表）、`MapState`（映射）、`ReducingState`（聚合）、`AggregatingState`（聚合+转换）。
- **Operator State**（少用）：算子级状态，不按 key 分。典型是 Kafka Source 记录每个 partition 的 offset。

状态存在哪？**状态后端（State Backend）**：`HashMapStateBackend`（状态在 JM/TM 堆内存，快但受内存限制）vs `EmbeddedRocksDBStateBackend`（状态存 RocksDB，可支撑 TB 级状态，是大规模生产默认）。

## 三、时间与 Watermark：处理乱序数据

流处理最大的痛点是**数据乱序**——网络延迟、分区不均、重试，导致后发生的事件可能先到、先发生的后到。怎么对一个「还在到来」的窗口做聚合？Flink 用**事件时间 + watermark** 解决：

- **事件时间（event-time）**：用**数据自带的时间戳**（如订单创建时间）而非处理时刻来定义「这件事什么时候发生」，结果确定且可重放。
- **Watermark**：一个**单调递增**的时间戳 `W`，语义是「**事件时间 ≤ W 的数据应该都到齐了**」。算子收到 watermark 后，会触发所有「结束时间 ≤ W」的窗口计算。
- **生成 watermark**：通常用 `WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(5))`——允许 5 秒乱序，即「比当前见过的最大时间戳早 5 秒以内算正常，超过算迟到」。
- **allowed-lateness**：窗口计算后仍可保留一段时间接收迟到数据（如 `allowedLateness(Duration.ofMinutes(1))`），迟到数据到达时再次触发计算或侧路输出。

```
事件流（时间戳递增但乱序）：
  (a,t=10) (b,t=7) (c,t=12) (d,t=9) ...
              │ forBoundedOutOfOrderness(3s)
              ▼
watermark 推进：maxTimestamp - 3s
  见到 t=12 → watermark=9 → 触发「结束时间≤9」的窗口
  （即使 t=7、t=9 比后到的 t=10、t=12 早，也已被算进窗口）
```

- **处理时间（processing-time）**：用机器时钟，延迟最低但结果不确定（受处理速度/重放影响）——只在「粗略实时、能容忍误差」的场景用。

## 四、窗口：切分无界流

窗口（Window）把无界流切成有限的「片段」以便聚合。Flink 三类核心窗口：

| 窗口 | 边界 | 重叠 | 典型场景 |
| --- | --- | --- | --- |
| **滚动 Tumbling** | 固定大小，**对齐** | 不重不漏 | 每分钟 PV、每天 UV（按天分桶） |
| **滑动 Sliding** | 固定大小 + 滑动步长 | **可重叠** | 「过去 5 分钟每 1 分钟」的移动 UV |
| **会话 Session** | 按活跃间隙，**动态** | 不重叠 | 用户一次会话内的行为聚合（gap 不活动即切） |

- 滚动窗口：`TumblingEventTimeWindows.of(Time.minutes(5))`——每 5 分钟一个窗口，数据各归一个窗口。
- 滑动窗口：`SlidingEventTimeWindows.of(Time.minutes(5), Time.minutes(1))`——窗口 5 分钟、每 1 分钟滑一次，一条数据可能落进多个窗口。
- 会话窗口：`EventTimeSessionWindows.withGap(Time.minutes(10))`——两个事件间隔超 10 分钟就分到不同会话。

窗口需配合**触发器（Trigger）**（何时计算）与**驱逐器（Evictor）**（剔除元素），event-time 下默认触发器由 watermark 驱动。

## 五、架构：JobManager 与 TaskManager

Flink 是 Master-Worker 架构：

```
              ┌─────────────────────────┐
              │      Client（提交端）    │  编译 DataStream/SQL → JobGraph
              └────────────┬────────────┘
                           │ 提交 JobGraph
              ┌────────────▼────────────┐
              │      JobManager（Master）│
              │  · 调度算子到 TaskManager │
              │  · 协调 Checkpoint        │
              │  · 故障恢复               │
              └────────────┬────────────┘
                           │ 分发任务
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │TaskMgr  │         │TaskMgr  │         │TaskMgr  │
  │ Slot 1  │         │ Slot 1  │         │ Slot 1  │
  │ Slot 2  │         │ Slot 2  │         │ Slot 2  │
  │ (状态)  │         │ (状态)  │         │ (状态)  │
  └─────────┘         └─────────┘         └─────────┘
```

- **JobManager（JM）**：集群大脑。含 **Dispatcher**（接收作业、启动 JM）、**ResourceManager**（管理 Slot 资源）、**JobMaster**（一个作业的调度器与 Checkpoint 协调者）。
- **TaskManager（TM）**：JVM 进程，含若干 **Slot**（资源切片，每个 Slot 跑一个 task 的子任务链）。状态后端也存于 TM。
- **Slot 共享**：同一作业的不同算子（如 source → map → sink）的并行子任务可共享一个 Slot，形成 **slot sharing group**，便于资源隔离与均匀负载。
- **反压（backpressure）**：下游处理慢，TCP/网络缓冲被填满，反压到上游让源降速——Flink 基于 credit-based 流控在 TCP 之上精细控制，避免 OOM。

## 下一步

理解了 Flink 的总览后，下一步深入两个核心机制——[有状态流处理与窗口](./guide-line/stateful-streaming)（状态后端、三类窗口、watermark 生成）与 [Flink SQL、Checkpoint 与 CEP](./guide-line/sql-and-checkpoint)（SQL 写流处理、分布式快照、exactly-once、复杂事件处理）。
