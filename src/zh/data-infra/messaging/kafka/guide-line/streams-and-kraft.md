---
layout: doc
outline: [2, 3]
---

# Kafka Streams 与 KRaft：流处理与去 ZooKeeper

> 基于 Kafka 3.9（KRaft 模式） · 核于 2026-08

## 速查

- **Kafka Streams**：Java 库（不是独立服务），嵌入应用进程，把 Kafka Topic 当流做实时计算（过滤/聚合/连接/窗口）。**无独立集群**，部署=普通应用。
- **核心抽象**：**KStream**（事件流，每条记录独立）/ **KTable**（按 key 的最新状态，类似表）/ **GlobalKTable**（全副本，用于小维表 join）。状态存储用 **RocksDB**（本地）+ changelog Topic（容错）。
- **窗口**：滚动窗口（Tumbling，固定大小不重叠）/ 跳跃窗口（Hopping，按步长滑动）/ 会话窗口（Session，按活跃间隔动态）/ **滑动窗口**（Join 用）。
- **Exactly-once（EOS）**：Streams 2.5+ 默认 `exactly_once_v2`（事务优化版），read-process-write 全链路精确一次。
- **Connect**：Source/Sink 连接器框架，把外部系统（MySQL/Debezium CDC、S3、ES）与 Kafka 互导——**免代码**搭数据管道。
- **Schema Registry**：Confluent 维护的元数据服务，管理 Avro/Protobuf/JSON Schema 版本，生产者注册 schema、消费者按 ID 反序列化——**向后/向前兼容**保证。
- **ksqlDB**：用 SQL 写流处理（`CREATE STREAM`/`CREATE TABLE AS SELECT`），降低门槛，适合简单实时数仓。
- **KRaft 模式（3.3+ GA）**：用 **Controller 节点 + Raft 元数据日志**替代 ZooKeeper。3.9 生产可用，4.0 移除 ZK。**新部署直接用 KRaft**——架构简化、元数据扩展性提升、分区上限从 ZK 的 20 万跃升到百万级。
- **KRaft 角色**：**Controller**（管理元数据，Raft 选举 leader）/ **Broker**（数据节点）/ 可合一（dev）或分离（prod，3 Controller + N Broker）。
- **与 Pulsar 对比**：Kafka 存算一体（broker 既管元数据又存数据，分区与 broker 绑定）；**Pulsar 存算分离**（broker 无状态只管计算，数据存 BookKeeper）——Pulsar 弹性扩容快、多租户原生、地理复制内置，但运维组件多、生态弱于 Kafka。

## 一、Kafka Streams：嵌入式流处理

Kafka Streams 不是独立的服务，而是**一个 Java 库**，嵌入到你的应用进程里——部署就是部署一个普通 Spring Boot 应用。这让流处理「轻量化」，无需独立 Flink/Spark 集群：

```java
// 经典 word count：读输入流 → 拆词 → 按 key 分组 → 窗口计数 → 写输出流
StreamsBuilder builder = new StreamsBuilder();
KStream<String, String> source = builder.stream("input-topic");
KTable<String, Long> counts = source
    .flatMapValues(v -> Arrays.asList(v.toLowerCase().split(" ")))
    .groupBy((k, w) -> w)
    .count(Materialized.as("count-store"));  // 状态存 RocksDB
counts.toStream().to("output-topic", Produced.with(Serdes.String(), Serdes.Long()));
```

- **三大抽象**：
  - **KStream**：事件流——每条记录是独立事件（如「用户点击」「订单产生」），可多条同 key。
  - **KTable**：按 key 的**最新状态**——类似数据库表，新值覆盖旧值。常用于聚合结果（如「当前用户余额」）。
  - **GlobalKTable**：全分区副本的 KTable，每个实例都有完整数据——用于 join 小维表（如「地区代码→地区名」），避免 join 时的网络 shuffle。
- **状态存储**：聚合/join 需要状态，Streams 用 **RocksDB**（本地嵌入式 KV）存本地状态，并写一个 **changelog Topic** 作容错——实例崩溃后从 changelog 重建状态。
- **EOS**：`processing.guarantee=exactly_once_v2`（Streams 2.5+），用 Kafka 事务把「消费 offset 提交 + 状态更新 + 产出下游」原子化，全链路精确一次。
- **何时选 Streams vs Flink**：Streams 适合「**简单、Java 嵌入、纯 Kafka**」场景；Flink 适合「**复杂窗口、CEP、跨数据源（Kafka+文件+DB）**、强一致 SQL」场景。流式数仓/复杂事件处理选 Flink，应用内流处理选 Streams。

## 二、Connect、Schema Registry 与 ksqlDB：生态三件套

Kafka 的强大在于周边生态，三大件最常用：

- **Kafka Connect**：连接器框架，**免代码**把外部数据源/汇与 Kafka 互导：
  - **Source Connector**：从外部读写到 Kafka（如 Debezium 监听 MySQL binlog → Kafka，实现 CDC）。
  - **Sink Connector**：从 Kafka 写到外部（如把日志 Topic 写到 S3/Elasticsearch）。
  - 部署模式：**Standalone**（单进程）/ **Distributed**（集群，多 worker 自动均衡）。
- **Schema Registry**（Confluent）：解决「生产者改了 schema，消费者怎么兼容」的问题：
  - 生产者发送前注册 schema，获得 schema id，消息带 id；消费者按 id 反序列化。
  - **兼容性策略**：向后兼容（新 schema 能读旧数据，加可选字段）/ 向前兼容 / 完全兼容——按业务选。
  - 支持 **Avro**（紧凑、强类型，最常用）/ **Protobuf**（与 gRPC 一致）/ **JSON Schema**（易读）。
- **ksqlDB**：用 **SQL 写流处理**，降低门槛：

```sql
-- 实时统计每地区订单数，5 分钟滚动窗口
CREATE TABLE orders_by_region AS
  SELECT region, COUNT(*) AS order_cnt
  FROM orders_stream
  WINDOW TUMBLING (SIZE 5 MINUTES)
  GROUP BY region;
```

## 三、KRaft：去 ZooKeeper 的元数据自管理

Kafka 早期强依赖 **ZooKeeper** 做元数据存储（Topic/分区/副本/Controller 选举）。ZooKeeper 带来运维负担（多一套 ZK 集群要维护）与扩展瓶颈（ZK watch 通知机制在分区数超 20 万时性能下降）。**KRaft（Kafka Raft Metadata mode）** 用 Kafka 自己管理元数据：

```
KRaft 架构：
  ┌─────────────────────────────────┐
  │  Controller 仲裁组（3 节点）     │  ← Raft 选举 Active Controller
  │  共享一条元数据日志 (__cluster_metadata) │  ← 元数据变更走 Raft
  └──────────────┬──────────────────┘
                 │ 推送元数据
  ┌──────────────┴──────────────────┐
  │  Broker 集群（数据节点）          │  ← 只存数据，无元数据状态
  └─────────────────────────────────┘
```

- **Controller 节点**：运行 Raft 协议维护元数据日志，仲裁组（quorum）通常 3 或 5 个节点，多数派选 Active Controller。
- **Broker 节点**：数据节点，从 Controller 拉取元数据，无状态。
- **合一 vs 分离**：dev 环境 Controller + Broker 同进程（`process.roles=broker,controller`）；prod 环境分离部署（3 个纯 Controller + N 个纯 Broker），元数据与数据隔离。
- **优势**：①**架构简化**（少一套 ZK）；②**元数据扩展性**（百万级分区，ZK 难支撑）；③**故障恢复更快**（Raft 选举秒级，ZK session 过期分钟级）。
- **迁移**：现有 ZK 集群可平滑迁移到 KRaft（3.6+ 提供 `kafka-storage` 工具）。新部署**直接用 KRaft**。

## 四、与 Pulsar 的对比

| 维度 | Kafka | Pulsar |
| --- | --- | --- |
| **架构** | 存算一体（broker 管 metadata + 存数据） | **存算分离**（broker 无状态 + BookKeeper 存数据） |
| **副本** | 分区副本绑死在 broker（partition→replica→broker） | 分段（ledger）副本可在 Bookie 间迁移 |
| **扩容** | 加 broker 要迁移分区数据，慢 | 加 broker 立即生效（无状态），数据均衡由 BookKeeper |
| **订阅模式** | 消费者组（pull） | Exclusive/Shared/Failover/Key_Shared 四种 |
| **多租户** | 弱（靠 Topic 命名规范 + 配额） | **原生**（tenant → namespace → topic） |
| **地理复制** | 需 MirrorMaker/MirrorMaker 2（外部组件） | **内置**（config-to-replicate 一行配置） |
| **分层存储** | 2.13+ 支持但较弱 | **Tiered Storage 原生强**（热 BookKeeper + 冷 S3） |
| **生态** | **极强**（Streams/Connect/Schema Registry/ksqlDB/Confluent 商业） | 较弱（Functions/IO/SQL，但社区小） |
| **运维** | 中（KRaft 后变简单） | 偏重（broker + BookKeeper + ZooKeeper 三套） |
| **延迟** | 默认批处理，百毫秒级 | 可更低（推模式） |
| **典型场景** | 事件流、日志、CDC、数仓管道 | 大规模多租户、跨地域、云原生 |

**一句话**：Kafka 靠**生态与成熟度**赢主流，Pulsar 靠**架构先进性**（存算分离、多租户、地理复制）赢未来与大规模场景——绝大多数团队选 Kafka 是因为「生态够用、踩坑文档多」。

## 下一步

Kafka 的核心概念、可靠性、Streams、KRaft 都讲完后，[参考](../reference) 页提供配置项速查、命令清单与四大消息队列（Kafka/RabbitMQ/RocketMQ/Pulsar）选型对比表，便于查阅。
