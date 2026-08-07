---
layout: doc
outline: [2, 3]
---

# 架构详解：NameServer、Broker 与消息模型

> 基于 RocketMQ 5.x · 核于 2026-08

## 速查

- **NameServer**：注册中心，**每个节点完全独立**（互不通信），Broker 定期（30s）注册心跳与路由信息。Producer/Consumer 启动时从任一 NameServer 拉路由。
- **Broker**：数据节点，存储 CommitLog（消息全量顺序写）+ ConsumeQueue（逻辑队列索引）+ IndexFile（按 key 索引）。主从复制保证高可用。
- **去中心化设计**：NameServer 无协调开销（不像 ZooKeeper 要多数派），单节点也能工作，集群节点间数据最终一致即可——架构简单、运维轻。
- **Topic**：逻辑消息主题，由多个 **MessageQueue** 组成，分布在 Broker 上。
- **Tag**：Topic 内的**二级标签**，消费端按 Tag 过滤订阅（轻量）。
- **MessageQueue**：Topic 的物理分片，并行与有序单位（类似 Kafka Partition）。一个 Topic 默认 4 个 Queue，可调。
- **CommitLog**：所有 Topic 的消息**全局顺序写**到同一个大文件，磁盘 IO 最高效。
- **ConsumeQueue**：每个 MessageQueue 一个，存「消息在 CommitLog 的偏移量」，消费端按 ConsumeQueue 找消息——逻辑索引解耦。
- **刷盘**：ASYNC_FLUSH（异步，性能高但丢风险）/ SYNC_FLUSH（同步，最安全）。
- **复制**：ASYNC_MASTER（异步主从）/ SYNC_MASTER（同步主从）/ **DLedger（5.x Raft 自动选主，推荐）**。
- **高可用**：Master 挂时，SLAVE 提供读；DLedger 模式下自动选举新 Master，故障切换秒级。

## 一、NameServer：去中心化注册中心

RocketMQ 的注册中心是 NameServer，设计上**去中心化**——多个 NameServer 节点**互不通信、各自独立**：

```
Broker 心跳注册 →  NameServer-1   ← Producer/Consumer 拉路由（任一即可）
                →  NameServer-2
                →  NameServer-3
（节点间不通信，各自维护 Broker 注册数据，最终一致）
```

- **节点独立**：每个 NameServer 独立接收 Broker 心跳，节点间不交换数据。Producer/Consumer 从任一节点拉到的路由可能短暂不一致（Broker 注册有先后），但最终一致。
- **无协调开销**：不像 ZooKeeper 要多数派共识，NameServer 单节点也能工作，不投票、不选主——架构简单、性能高。
- **心跳与下线**：Broker 每 30s 向所有 NameServer 注册；NameServer 120s 未收到心跳判定 Broker 下线，更新路由。Producer/Consumer 定期（30s）刷新路由。
- **对比 ZooKeeper**：Kafka 早期用 ZK（强一致但重），RocketMQ 用 NameServer（最终一致但轻）。RocketMQ 认为消息中间件的路由短暂不一致可接受（几秒），换来架构简单与无外部依赖。

## 二、Broker：CommitLog + ConsumeQueue

Broker 的存储设计是 RocketMQ 高性能的关键——**所有 Topic 的消息全局顺序写一个 CommitLog**：

```
CommitLog（全局顺序写大文件，所有 Topic 共享）
   消息1（TopicA）｜消息2（TopicB）｜消息3（TopicA）｜消息4（TopicC）｜...

ConsumeQueue（每 MessageQueue 一个，逻辑索引）
   TopicA-Queue0: [offset=消息1的CommitLog偏移][消息3的偏移]...
   TopicB-Queue0: [offset=消息2的偏移]...

IndexFile（按 key 的哈希索引，支持按消息 key 查询）
```

- **CommitLog 全局顺序写**：所有 Topic 的消息**追加写**到同一个大文件（默认 1GB 一个，滚动）——磁盘顺序写性能最高（机械盘 100MB/s+），这是 RocketMQ 单机十万级 TPS的基础。
- **ConsumeQueue 逻辑索引**：每个 MessageQueue 对应一个 ConsumeQueue，存「该 Queue 的消息在 CommitLog 的偏移量」。消费端按 ConsumeQueue 找消息——逻辑索引与物理存储解耦，方便扩展。
- **IndexFile**：按消息 key 的哈希索引，支持「按业务 key 查消息」（如按订单号查消息）——业务查询友好。

这种「**全局 CommitLog 顺序写 + 每 Queue 逻辑索引**」的设计，既保证了写性能（顺序写），又支持多 Topic/多 Queue 的并发消费（按索引）。

## 三、Topic、Tag、MessageQueue 两级分类

```
Topic: OrderTopic
  ├─ Tag: CreateTag（创建）
  ├─ Tag: PayTag（支付）
  ├─ Tag: ShipTag（发货）
  │
  └─ MessageQueue[0,1,2,3]（默认 4 个，可调）
      ├─ Queue0 在 Broker-A
      ├─ Queue1 在 Broker-A
      ├─ Queue2 在 Broker-B
      └─ Queue3 在 Broker-B
```

- **Topic**：逻辑消息主题，业务流的顶层划分（如 OrderTopic 订单、PayTopic 支付）。
- **Tag**：Topic 内的**二级标签**，用于消费端**轻量过滤**。消费者订阅时可指定只收某些 Tag（如 `consumer.subscribe("OrderTopic", "PayTag || ShipTag")`）。
- **MessageQueue**：Topic 的**物理分片**，并行与有序单位。一个 Topic 默认 4 个 Queue，可调。消费组内一个消费者消费一个 Queue（负载均衡）。
- **SQL92 过滤**（5.x）：除 Tag 外，支持按消息属性的 SQL92 表达式过滤（如 `a > 5 AND b = 'x'`），更灵活。

## 四、刷盘与复制策略

| 策略 | 选项 | 特点 | 适用 |
| --- | --- | --- | --- |
| **刷盘** | ASYNC_FLUSH（异步） | 写内存即返回，后台刷盘——性能高但 broker 挂可能丢 | 一般业务（容忍少量丢） |
| | SYNC_FLUSH（同步） | 刷盘到磁盘才返回——最安全但性能低 | 金融/订单（不能丢） |
| **复制** | ASYNC_MASTER（异步主从） | Master 写即返回，Slave 异步同步——Master 挂数据可能丢 | 高吞吐场景 |
| | SYNC_MASTER（同步主从） | Master 等 Slave 同步才返回——强一致 | 金融场景 |
| | **DLedger（5.x Raft）** | 多数派复制 + 自动选主——故障自动切换秒级 | **推荐生产** |

- **DLedger** 是 5.x 的推荐方案——基于 Raft 共识，Master 挂时自动选举新 Master，无需人工切换。比传统主从更可靠。
- **金融级组合**：SYNC_FLUSH + DLedger（或 SYNC_MASTER）——刷盘确认 + 多副本同步，broker 故障不丢已确认消息。

## 五、消费模式：集群与广播

| 模式 | 行为 | 适用 |
| --- | --- | --- |
| **CLUSTERING（集群）** | 同一消费组内**每消息被一个消费者消费**（负载均衡） | 默认，业务处理 |
| **BROADCASTING（广播）** | 每个消费者都消费**全量消息** | 广播通知、本地缓存刷新 |

- 集群模式下，消费组内消费者**瓜分 MessageQueue**（类似 Kafka 消费者组），实现负载均衡。
- 广播模式下，每个消费者独立消费全量，常用于「所有节点刷新本地配置缓存」。

## 下一步

掌握了架构后，下一步进入 [特性与实战](./features-and-usecases)——顺序消息、事务消息、定时/延迟消息三大原生特性，以及 LiteTopic AI 会话与双 11 实战。
