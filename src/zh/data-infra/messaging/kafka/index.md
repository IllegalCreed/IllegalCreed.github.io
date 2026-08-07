---
layout: doc
---

# Kafka

**Apache Kafka** 是 LinkedIn 于 2011 年开源、Apache 顶级基金会维护的**分布式事件流平台（distributed event streaming platform）**——它以「**追加写日志（append-only log）** + **消费者拉取（pull）** + **分区并行**」三件套，把消息队列从「**传送带（消息读完即删）**」改造成了「**企业级 commit log**」：消息写入后按顺序持久化、可被多个消费者组**各自独立回放**、按分区横向扩展到单集群百万级 TPS。理解 Kafka 的关键是理解「**Topic → Partition → Offset**」这条核心数据轴——分区既是**并行单位**（一个消费者对应一个分区，分区数=并发上限），又是**有序单位**（单分区内消息严格有序，跨分区不保证）；以及「**消费者组（Consumer Group）**」如何把一条流的负载在多个实例间**水平拆分**，组内重平衡（rebalance）即可弹性扩缩容。这使得 Kafka 不只是「队列」，而是**事件溯源（event sourcing）、流处理管道（CDC、ETL）、微服务解耦、实时数仓**的事实底座——Netflix/Uber/LinkedIn 的核心数据管道、Confluent 的商业生态、Kafka Streams 的嵌入式流处理，都建立在它之上。

Kafka 的全部考点围绕「**写、存、读、扩展、容错**」展开：①**核心模型**（Topic/Partition/Offset、生产者的 ack 与幂等、消费者的 pull 与 offset 提交、消费者组的 rebalance）——回答「消息怎么写、存哪、谁读、读到哪」；②**可靠性**（ISR、min.insync.replicas、unclean.leader.election 禁用、ack=all）——回答「broker 挂了不丢消息吗」；③**架构演进**（ZooKeeper → KRaft 元数据自管理）——回答「2025 年的 Kafka 还依赖 ZK 吗」；④**生态**（Kafka Streams 嵌入式流处理、Connect 数据源连接器、Schema Registry Avro/Protobuf、KSQL/ksqlDB）——回答「能不能在 Kafka 上跑流处理」；⑤**对比**（与 RabbitMQ 的「路由丰富 vs 吞吐优先」、与 Pulsar 的「存算一体 vs 存算分离、多租户」）。本叶是消息队列组的**第一站**，先讲清 Kafka 的核心模型与可靠性，再讲 KRaft 与 Streams，最后与 Pulsar 对比，帮你既会用 Kafka、也会在选型表上写明它「强在哪、弱在哪」。

## 评价

**优点**

- **极致吞吐**：顺序磁盘写（机械盘 100MB/s+，SSD 上 GB/s）+ 零拷贝（sendfile）+ 批量压缩（snappy/lz4/zstd），单集群百万级 TPS 常态化
- **持久化与回放**：消息按日志存储、保留按时间/大小策略，可重放历史事件——天然适合事件溯源与 CDC
- **水平扩展**：分区是并行单位，加分区 + 加 broker + 加消费者即可线性扩容
- **多消费者解耦**：不同消费者组各自独立消费同一 Topic，互不干扰——一次写入、多处消费

**缺点**

- **功能相对单一**：原生只做「日志流」，路由能力弱（没有 RabbitMQ 的 exchange/topic 丰富路由），事务消息支持有限（非 RocketMQ 级别）
- **运维复杂度**：分区 rebalance 引入消费暂停（stop-the-world）、跨机房的 Offset 与分区迁移复杂；KRaft 前强依赖 ZooKeeper 是历史包袱
- **延迟下限较高**：默认批处理与拉取间隔让端到端延迟多在百毫秒级，不适合 RabbitMQ 那种个位数毫秒的精细路由场景
- **资源占用**：依赖 JVM，broker 与生产者/消费者的内存占用偏高，小规模场景偏「重」

## 本叶地图

- [入门](./getting-started) —— Kafka 定位、Topic/Partition/Offset、生产者/消费者、消费者组、与 RabbitMQ/Pulsar 的差异
- [核心概念](./guide-line/core-concepts) —— Topic/Partition/Offset 详解、生产者 ack/幂等/事务、消费者 offset 提交与消费者组 rebalance、可靠性（ISR/min.insync.replicas）
- [Kafka Streams 与 KRaft](./guide-line/streams-and-kraft) —— Kafka Streams 嵌入式流处理、Schema Registry、KRaft 去 ZooKeeper、与 Pulsar 的存算分离对比
- [参考](./reference) —— 配置项速查、命令清单、可靠性配方、易错点、四大消息队列选型对比

## 幻灯片地址

<a href="/SlideStack/kafka-slide/" target="_blank">Kafka</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Kafka" target="_blank" rel="noopener noreferrer">Kafka 测试题</a>
