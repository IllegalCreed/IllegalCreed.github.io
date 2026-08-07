---
layout: doc
---

# Flink

**Apache Flink** 是一个**有状态的流式数据流处理引擎**——它把「无界数据流（stream）」和「有界数据流（batch，即批）」统一在**同一套运行时**下处理：流是真正的「逐条到来、持续计算」（事件驱动、低延迟），批被视作「有限的流」（一次性读完、有序处理）。与 Spark 的「微批（micro-batch）」路线不同，Flink 走的是**真流式（true streaming）**架构——每来一条数据立刻算，端到端延迟可达毫秒级。理解 Flink 的全部考点围绕五个核心展开：①**有状态流处理**（算子维护可查询的状态，支持 keyed/operator state，是复杂聚合、去重、JOIN 的基础）；②**时间与窗口**（事件时间 event-time + watermark 处理乱序，滚动/滑动/会话三类窗口把无界流切成可计算的有限片段）；③**Flink SQL & Table API**（用 SQL/关系算子写流处理，让分析师也能上实时数仓）；④**Checkpoint 与 Savepoint**（基于 Chandy-Lamport 分布式快照算法，实现**精确一次 exactly-once**与故障恢复）；⑤**CEP（复杂事件处理）**（用模式检测时序事件，做风控、IoT 异常、实时告警）。本叶是流处理章的总览与地基——后续各叶在状态、时间、容错维度深入。

## 评价

**优点**

- **真流式低延迟**：逐条处理而非攒批，端到端延迟可压到毫秒级，适合风控、监控、实时大屏等强实时场景
- **统一的流批架构**：同一套 DataStream API / SQL 同时跑流与批，批是「有界的流」，无需维护两套代码
- **精确一次（exactly-once）语义**：基于分布式快照（Checkpoint）的状态容错，故障恢复后结果不重不算漏，对账级正确性
- **强大的时间语义**：event-time + watermark + allowed-lateness 原生支持乱序/迟到数据，窗口语义清晰
- **丰富的状态管理**：Keyed State（ValueState/ListState/MapState）+ 状态 TTL + RocksDB 增量 Checkpoint，可支撑 TB 级状态

**缺点**

- **学习曲线陡**：时间语义（watermark/allowed-lateness）、状态、窗口、Checkpoint 概念相互耦合，初学者入门难
- **运维复杂**：JobManager/TaskManager、Slot、Checkpoint 配置、反压（backpressure）调优、状态迁移（savepoint 兼容性）坑多
- **资源占用高**：常驻进程 + 状态后端（尤其 RocksDB）吃内存，小流量场景比 Spark 微批更重
- **生态弱于 Spark**：MLlib/GraphX 这类机器学习/图计算库 Flink 生态相对薄弱，机器学习非其强项

## 本叶地图

- [入门](./getting-started) —— Flink 定位与流批统一、有状态流处理、时间与窗口（watermark/allowed-lateness）、架构（JobManager/TaskManager）
- [有状态流处理与窗口](./guide-line/stateful-streaming) —— Keyed/Operator State、状态后端（Heap/RocksDB）、状态 TTL、滚动/滑动/会话窗口、watermark 生成与迟到数据处理
- [Flink SQL、Checkpoint 与 CEP](./guide-line/sql-and-checkpoint) —— Table API/SQL 写流处理、Chandy-Lamport 快照、exactly-once 实现、Savepoint 与状态迁移、CEP 模式匹配
- [参考](./reference) —— 状态类型速查、窗口对比、Checkpoint 配置、Flink vs Spark vs Kafka Streams 选型、易错点

## 幻灯片地址

<a href="/SlideStack/flink-slide/" target="_blank">Flink</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Flink" target="_blank" rel="noopener noreferrer">Flink 测试题</a>
