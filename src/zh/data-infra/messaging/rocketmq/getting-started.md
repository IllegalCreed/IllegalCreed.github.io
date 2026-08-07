---
layout: doc
outline: [2, 3]
---

# 入门：RocketMQ 定位、架构与核心特性

> 基于 RocketMQ 5.x（LiteTopic、Controller 模式） · 核于 2026-08

## 速查

- **定位**：RocketMQ 是阿里自研、Apache 顶级、Java 编写的分布式消息平台——**中国电商与金融事实标准**，脱胎于双 11 万亿级消息实战。
- **架构**：**NameServer（注册中心，去中心化无状态）+ Broker（数据节点，主从复制）**。区别于 Kafka 早期的 ZooKeeper，NameServer 是**每个节点独立**的轻量注册中心，无协调开销。
- **消息模型**：**Topic（主题）→ Tag（标签，二级筛选）→ MessageQueue（队列，分区单位）**。Topic 是逻辑流，Tag 做轻量过滤，MessageQueue 是并行与有序单位（类似 Kafka 分区）。
- **三大原生特性**：①**顺序消息**（MessageQueue 分区有序）；②**事务消息**（半消息 + 本地事务 + 回查）；③**定时/延迟消息**（原生延迟级别）。
- **顺序消息**：保证同一业务 key（如订单号）的消息按发送顺序消费。生产端按 key 路由到同一 MessageQueue，消费端单线程顺序消费。
- **事务消息**：`半消息（broker 不投递） → 执行本地事务 → 提交/回滚`；本地事务状态未知时，broker **回查**生产者确认——让「发消息」与「本地数据库事务」原子化。
- **定时/延迟消息**：原生支持 18 个延迟级别（1s/5s/10s/30s/1m/2m...30m/1h/2h），订单超时取消、延迟通知开箱即用。5.x 起支持任意时间定时。
- **刷盘策略**：**ASYNC_FLUSH**（异步刷盘，性能高但 broker 挂可能丢）/ **SYNC_FLUSH**（同步刷盘，最安全但性能低）。
- **复制策略**：**ASYNC_MASTER**（异步主从，主挂数据可能丢）/ **SYNC_MASTER**（同步主从，强一致）/ **DLedger**（5.x Raft 自动选主，推荐）。
- **LiteTopic（5.x）**：面向 **AI 会话**的低延迟队列，毫秒级推送、海量上下文管理——为 AI Agent 多轮对话、流式输出场景设计。
- **与 Kafka 差异**：RocketMQ 强在**顺序/事务/延迟消息原生支持 + 电商金融特性**；Kafka 强在**极致吞吐 + 事件流生态**。
- **进阶顺序**：[架构详解](./guide-line/architecture) → [特性与实战](./guide-line/features-and-usecases) → [参考](./reference)。

## 一、RocketMQ 是什么：电商金融的事实标准

RocketMQ 起源于淘宝自研的 MetaQ（2012），为解决双 11 海量订单消息而设计，2016 年捐赠 Apache 成顶级项目。它的设计哲学与 Kafka 不同——Kafka 为「日志/事件流」而生（极致吞吐 + 持久化回放），RocketMQ 为「**电商与金融业务消息**」而生（**业务语义原生支持**）：

1. **业务消息原生**：订单、支付、库存等业务消息有严格的顺序、事务、定时需求——RocketMQ 把这些做成**原生特性**（顺序消息、事务消息、延迟消息），而 Kafka 要自己实现。
2. **万亿级实战**：双 11 单集群峰值万亿级消息、堆积容灾（消费跟不上时消息堆积不丢）、主从切换——这些场景打磨出的稳定性，是国内大厂选它的核心原因。
3. **去中心化架构**：NameServer 无状态、节点独立，比 ZooKeeper 轻量，部署运维更简单。

一句话：**RocketMQ 是「为电商金融场景量身打造」的消息平台——顺序/事务/延迟消息开箱即用，双 11 万亿级实战背书，是中国电商事实标准。**

## 二、架构：NameServer + Broker

```
┌─────────────┐  注册/心跳   ┌─────────────┐
│  NameServer │ <──────────  │   Broker    │  （Master/Slave 或 DLedger 集群）
│  （无状态）  │              │ （数据节点） │
└──────┬──────┘              └──────┬──────┘
       │ 路由信息                    │ push/pull
       ▼                            ▼
┌─────────────┐              ┌─────────────┐
│  Producer   │ ──发消息──>  │  Consumer   │
└─────────────┘              └─────────────┘
```

- **NameServer**：注册中心，**每个节点独立运行**（互不通信），Broker 定期注册心跳与路由信息。Producer/Consumer 启动时从任一 NameServer 拉路由。无协调开销，部署简单。
- **Broker**：数据节点，存储消息。主从复制保证高可用；5.x 起 **DLedger（Raft）** 实现自动选主，故障自动切换。
- **Producer**：发消息到 Topic，按 MessageQueue 选择策略（轮询/按 key 顺序/指定）。
- **Consumer**：消费消息，支持集群（Cluster，每消息被一个消费者消费）与广播（Broadcast，每消费者都消费全量）两种模式。

## 三、消息模型：Topic + Tag + MessageQueue

```
Topic: OrderTopic（订单主题）
  ├─ Tag: CreateTag（创建）  ── MessageQueue[0..N]
  ├─ Tag: PayTag（支付）      ── MessageQueue[0..N]
  └─ Tag: ShipTag（发货）     ── MessageQueue[0..N]
（Tag 是 Topic 内的二级标签，消费端可按 Tag 过滤订阅）
```

- **Topic**：逻辑消息主题，类似 Kafka 的 Topic。
- **Tag**：Topic 内的**二级标签**，用于消费端**轻量过滤**——消费者订阅 Topic 时可指定只收某些 Tag 的消息（如只订阅 PayTag）。比 Kafka 的 key 过滤更直观。
- **MessageQueue**：Topic 的物理分片，是**并行与有序单位**（类似 Kafka Partition）。一个 Topic 有多个 MessageQueue 分布在 Broker 上，消费组内一个消费者消费一个 MessageQueue。
- **消息过滤**：除 Tag 外，5.x 支持 **SQL92 语法过滤**（按消息属性表达式过滤，如 `a > 5 AND tag = 'PayTag'`）。

## 四、三大原生特性概览

| 特性 | 解决问题 | 机制 |
| --- | --- | --- |
| **顺序消息** | 业务消息需按序消费（订单状态流转） | 生产端按 key 路由到同一 MessageQueue + 消费端单线程顺序消费 |
| **事务消息** | 发消息与本地事务需原子化 | 半消息（broker 暂不投递）→ 本地事务 → 提交/回滚；状态未知时 broker 回查 |
| **定时/延迟消息** | 定时投递（订单超时取消） | 原生延迟级别（1s/5s...2h）；5.x 起支持任意时间定时 |

这三大特性是 RocketMQ 区别于 Kafka/RabbitMQ 的核心——Kafka 要自己实现顺序/事务/延迟，RabbitMQ 延迟要靠 TTL+DLX，而 RocketMQ 开箱即用。

## 五、RocketMQ 与 Kafka、RabbitMQ 的差异

| 维度 | RocketMQ | Kafka | RabbitMQ |
| --- | --- | --- | --- |
| **出身** | 阿里/Apache/Java | LinkedIn/Apache | Erlang/AMQP |
| **核心模型** | Topic + Tag + MessageQueue | 分区 commit log | Exchange/Queue 路由 |
| **顺序消息** | **原生强**（分区顺序） | 单分区内有序 | 单队列内有序 |
| **事务消息** | **原生强**（半消息+回查） | 事务（EOS） | 弱 |
| **延迟消息** | **原生**（延迟级别） | 需自己实现 | TTL+DLX/插件 |
| **路由能力** | 中（Tag + SQL92） | 弱（key 哈希） | **强**（4 种 Exchange） |
| **吞吐** | 十万级 TPS | **百万级 TPS** | 万级 TPS |
| **典型场景** | **电商/金融/订单** | 日志/CDC/数仓 | 任务队列/业务路由 |

**一句话**：要**电商金融的业务消息**（顺序/事务/延迟）选 RocketMQ；要**极致吞吐 + 事件流**选 Kafka；要**丰富路由 + 低延迟**选 RabbitMQ。

## 下一步

理解了 RocketMQ 的总览后，下一步深入两个核心维度——[架构详解](./guide-line/architecture)（NameServer/Broker/Topic/Tag/MessageQueue）与 [特性与实战](./guide-line/features-and-usecases)（顺序/事务/延迟消息、LiteTopic、双 11 实战）。
