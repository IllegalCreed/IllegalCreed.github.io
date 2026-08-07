---
layout: doc
outline: [2, 3]
---

# 入门：Kafka 定位、核心模型与生态

> 基于 Kafka 3.9（KRaft 模式） · 核于 2026-08

## 速查

- **定位**：Kafka 是**分布式事件流平台**——不是单纯消息队列，而是「**分布式 commit log + 流处理底座**」：消息按主题（Topic）追加写日志、按分区并行、消费者拉取消费。
- **三大能力**：①**发布订阅**（生产者写 Topic，多消费者组各自消费）；②**持久化**（消息按保留策略存磁盘，可重放历史）；③**流处理**（Kafka Streams/ksqlDB 在 Kafka 之上做实时计算）。
- **核心数据轴**：`Topic（逻辑流） → Partition（并行+有序单位） → Offset（分区内单调递增序号）`。分区既是**并行单位**（分区数=消费并发上限），又是**有序单位**（单分区内严格有序，跨分区不保证）。
- **生产者（Producer）**：往 Topic 发消息，可指定分区（key 哈希分区 / 自定义 Partitioner）、控制可靠性（`acks=all` + 幂等 + 事务）、批量发送 + 压缩（snappy/lz4/zstd）。
- **消费者（Consumer）**：从分区**拉取**（pull，非推送），按 offset 顺序消费；**手动提交 offset** 控制「至少一次 / 最多一次 / 精确一次」语义。
- **消费者组（Consumer Group）**：同一组的消费者**瓜分** Topic 的所有分区（一个分区只被组内一个消费者消费），实现负载均衡；不同组**各自独立消费**全量数据（发布订阅）。
- **Rebalance**：组内成员变动（加机器/挂掉）触发分区重新分配，期间消费暂停（stop-the-world），需用 **Cooperative Rebalance**（KIP-429）减少影响。
- **持久化与保留**：消息写日志段（segment）+ 索引，保留按 `retention.ms`（时间）/ `retention.bytes`（大小）/日志压缩（compact，按 key 留最新值）。
- **可靠性三件套**：`acks=all` + `min.insync.replicas≥2` + `unclean.leader.election.enable=false` —— broker 故障也不丢已 ack 消息。
- **KRaft（3.3+ GA）**：用 **Controller 节点 + Raft 元数据日志**替代 ZooKeeper，3.9 起**生产可用**、4.0 起移除 ZK —— 新部署**直接用 KRaft**，不再装 ZK。
- **生态**：**Kafka Streams**（嵌入式流处理库）、**Connect**（Source/Sink 数据源连接器）、**Schema Registry**（Avro/Protobuf/JSON Schema 版本管理）、**ksqlDB**（SQL 写流处理）。
- **进阶顺序**：[核心概念详解](./guide-line/core-concepts) → [Kafka Streams 与 KRaft](./guide-line/streams-and-kraft) → [参考](./reference)。

## 一、Kafka 是什么：从消息队列到事件流平台

传统消息队列（ActiveMQ、RabbitMQ 的早期定位）是「**传送带**」——消息被消费者取走即从队列删除，强调「点对点送达」。Kafka 借鉴数据库的 **commit log** 思想，重新定义了消息中间件：

1. **追加写日志（append-only log）**：消息按到达顺序追加到分区日志末尾，**永不修改**（除非 compact）。这让磁盘写永远是顺序 IO（机械盘也能跑 100MB/s+），是 Kafka 吞吐的基础。
2. **消费者拉取（pull）**：消费者主动按 offset 拉取（而不是 broker 推送），自己控制消费速率——消费慢不会压垮消费者（背压天然），消费快可以批量拉。
3. **多消费者组独立回放**：消息不会因「被消费」就删除，而是按保留策略（时间/大小）统一淘汰。这意味着不同业务方（实时数仓、推荐、风控）可以**各自消费同一份事件流**，互不影响——这是 Kafka 区别于传统队列的核心。

一句话：**Kafka 把「消息队列」升级成了「企业级事件日志」——一次写入、多处处消费、可重放、可计算。**

## 二、Topic、Partition、Offset：核心数据模型

Kafka 的数据组织是一条三层抽象：

```
Topic: orders（逻辑流，类似数据库表）
 │
 ├─ Partition 0:  [msg0][msg1][msg2][msg3][msg4]...  ← 每条消息有 offset（从 0 单调递增）
 ├─ Partition 1:  [msg0][msg1][msg2]...
 └─ Partition 2:  [msg0][msg1][msg2][msg3]...

每个分区是一个 append-only log，物理上是一组段文件（segment + .index + .timeindex）
```

- **Topic（主题）**：逻辑流的名字，类似数据库的表。生产者往 Topic 发消息，消费者订阅 Topic。
- **Partition（分区）**：Topic 的物理分片，是**并行与有序的基本单位**：
  - **并行**：一个 Topic 的分区可以分布在多个 broker 上，消费者组内一个消费者消费一个分区——分区数 = 该 Topic 的**消费并发上限**。
  - **有序**：**单分区内消息严格有序**（按 offset 顺序），跨分区**不保证顺序**。需要全局有序只能用单分区（牺牲并行）。
  - **分区数**：建 Topic 时指定，**只能加不能减**（减少分区会破坏数据语义，故禁用）——常见选 6/12/24/48，预估消费并发数。
- **Offset（位移）**：分区内消息的**单调递增整数序号**（从 0 开始）。消费者用 offset 标记「我读到哪了」，提交 offset 到 `__consumer_offsets` Topic 实现故障恢复。

## 三、生产者与消费者

**生产者**写消息时，消息落到哪个分区由**分区策略**决定：

| 策略 | 行为 | 适用 |
| --- | --- | --- |
| 指定分区 | 直接发到 partition=N | 特殊路由 |
| key 哈希（默认） | `hash(key) % partition_count` | 按 key 聚合（同 user_id 永远同分区，保证有序） |
| Sticky / Round-robin | 无 key 时轮流，黏性尽量保持批次 | 默认均衡 |

- **可靠性配置**：`acks=0`（发完不管，可能丢）/ `acks=1`（leader 写入即返回，leader 挂可能丢）/ **`acks=all`（所有 ISR 副本写入才返回，最安全）**——生产环境默认 `acks=all`。
- **幂等（idempotent）**：开启 `enable.idempotence=true`，生产者自动去重（基于 PID + sequence number），防止重试导致重复。
- **事务**：`transactional.id` 让跨 Topic/Partition 的写入**原子化**（要么全成功要么全失败），用于精确一次到下游。

**消费者**主动拉取消息，关键在 **offset 提交**：

```
消费者拉取 → 处理 → 提交 offset（标记"这批已处理"）
                ↑
        自动提交（enable.auto.commit=true，每 5s）vs 手动提交（处理完再 commitSync/commitAsync）
```

- **自动提交风险**：消息刚拉下来还没处理完就自动提交了 offset，崩溃后会**丢消息**（broker 以为已消费）。
- **手动提交**：处理完业务逻辑再提交，保证**至少一次**（at-least-once）——崩溃重试可能重复，故消费端要**幂等**（数据库唯一键 / Redis 去重）。
- **精确一次（exactly-once）**：生产者事务 + 消费者「**read-process-write**」（事务内消费+产出）才能达成——Kafka 内部事务可精确一次，跨外部系统需业务幂等。

## 四、消费者组：水平扩展与发布订阅

消费者组是 Kafka 的**负载均衡 + 多订阅**核心机制：

```
Topic orders（3 分区 P0/P1/P2）

消费者组 A（实时数仓）：
   消费者 A1 ← P0, P1
   消费者 A2 ← P2
   → A 组共同消费 orders 全量，组内瓜分分区

消费者组 B（推荐系统）：
   消费者 B1 ← P0, P1, P2
   → B 组独立消费 orders 全量（A、B 互不干扰）
```

- **组内瓜分**：同一组内，**一个分区只被一个消费者消费**——所以消费者数 > 分区数时多余的消费者闲置。组内成员变动触发 **rebalance**（分区重新分配）。
- **组间独立**：不同组各自维护自己的 offset，互不影响——这就是「发布订阅」：一次写入，多处消费。
- **Rebalance 代价**：rebalance 期间**消费暂停**（所有成员停止拉取，等协调完成），大集群可能分钟级。优化：**Cooperative Rebalance**（增量重分配，只停涉及的分区）、**Static Membership**（成员身份固定，减少不必要 rebalance）。

## 五、Kafka 与 RabbitMQ、Pulsar 的差异

| 维度 | Kafka | RabbitMQ | Pulsar |
| --- | --- | --- | --- |
| **核心模型** | 分布式 commit log（分区日志） | AMQP exchange/queue 路由 | 计算存储分离（broker + BookKeeper） |
| **持久化** | broker 本地磁盘日志 | 内存队列 + 可选持久化 | broker 无状态，数据存 BookKeeper |
| **消费模型** | 拉取（pull）+ offset + 消费者组 | 推送（push）+ ACK | 拉取/推送都支持 + 多订阅模式 |
| **顺序** | 单分区内有序 | 单队列内有序 | 单分区（partition）内有序 |
| **路由** | 弱（key 哈希分区） | **强**（direct/topic/fanout/headers） | 中（订阅模式丰富） |
| **吞吐** | **极高**（百万 TPS） | 中（万级 TPS） | 高（接近 Kafka） |
| **多租户** | 弱（靠 Topic 命名隔离） | 中 | **强**（原生 tenant/namespace） |
| **典型场景** | 日志/事件流/数仓管道/CDC | 任务队列/路由丰富的业务消息 | 大规模多租户/地理复制/云原生 |

## 下一步

理解了 Kafka 的总览后，下一步深入两个核心维度——[核心概念详解](./guide-line/core-concepts)（分区/offset/ack/消费者组 rebalance/可靠性）与 [Kafka Streams 与 KRaft](./guide-line/streams-and-kraft)（流处理、Schema、去 ZK、与 Pulsar 对比）。
