---
layout: doc
outline: [2, 3]
---

# 架构详解：存算分离、多租户与地理复制

> 基于 Apache Pulsar 3.x · 核于 2026-08

## 速查

- **三大组件**：**broker**（无状态计算）+ **BookKeeper**（分布式日志存储，节点叫 Bookie）+ **ZooKeeper**（协调与元数据）。
- **broker 无状态**：处理协议、路由消息、维护订阅 cursor（消费进度），**不存消息数据**（数据在 BookKeeper）。重启不丢数据，可秒级扩缩容。
- **BookKeeper**：独立的分布式日志存储。消息按 **ledger**（分段）写入多个 Bookie，默认 `Qw=2, Qa=2`（写 3 副本，2 个确认即成功）。
- **ledger**：topic 的分段单元，写满或定时切换。一个 topic 由多个 ledger 组成，ledger 分布在不同 Bookie——存储解耦。
- **cursor**：订阅的消费进度标记（类似 Kafka offset），存在 ZooKeeper/broker，独立于数据层。
- **partition topic**：逻辑分区，分布在 broker 上，但数据在 BookKeeper——分区与存储解耦。
- **tenant/namespace/topic**：原生多租户三级模型，配认证授权、配额、资源隔离。
- **地理复制**：配置 `replicated` topic + 目标集群后，消息自动跨集群复制——**内置**，无需 MirrorMaker。
- **订阅四种模式**：Exclusive / Shared / Failover / Key_Shared。

## 一、三大组件协同

Pulsar 集群由三个独立组件构成，职责清晰分离：

```
┌──────────────────────────────────────────────────────┐
│  生产者 / 消费者                                       │
└────────────────────┬─────────────────────────────────┘
                     │ Pulsar 二进制协议
                     ▼
┌──────────────────────────────────────────────────────┐
│  Broker 层（无状态计算）                               │
│  - 处理协议、路由消息、维护 cursor                      │
│  - topic 逻辑分区分布于此                              │
│  - 加机器即扩容（无状态）                               │
└────────────────────┬─────────────────────────────────┘
                     │ 写 ledger（分段）
                     ▼
┌──────────────────────────────────────────────────────┐
│  BookKeeper 层（分布式日志存储）                       │
│  - Bookie 节点 × N（消息按 ledger 多副本分布）          │
│  - 默认 Qw=2, Qa=2（3 副本写 2 确认）                   │
│  - 独立扩展、独立运维                                   │
└──────────────────────────────────────────────────────┘
                     ▲
                     │ 元数据 + cursor
┌────────────────────┴─────────────────────────────────┐
│  ZooKeeper（协调与元数据）                             │
│  - broker 注册、ledger 元数据、cursor、配置             │
└──────────────────────────────────────────────────────┘
```

- **broker 层**：处理客户端协议、路由消息到 topic、维护每个订阅的 cursor（消费进度）。**无状态**——所有持久化数据在 BookKeeper/ZK，broker 重启不丢。
- **BookKeeper 层**：消息按 ledger 写入多个 Bookie（默认 3 副本）。Bookie 故障时，受影响的 ledger 在其他 Bookie 重建（自愈）。
- **ZooKeeper**：存 broker 注册、ledger 元数据、cursor、topic 配置等协调信息。

## 二、broker 无状态与秒级扩容

broker 无状态是 Pulsar 区别于 Kafka 的核心：

- **Kafka 扩容**：分区与 broker 绑定（分区副本存在 broker 本地磁盘），加 broker 后要**手动/自动迁移分区数据**到新 broker，迁移期间有 IO 压力，慢且重。
- **Pulsar 扩容**：broker 不存数据，加 broker 后**立即生效**——topic 分区自动重新均衡到新 broker（仅元数据调整，无数据迁移），秒级完成。数据仍在 BookKeeper，broker 只接管路由。
- **云原生友好**：broker 无状态天然适合 K8s Deployment 弹性伸缩（HPA 按负载自动扩缩），是「云原生消息平台」的核心优势。

## 三、BookKeeper：分布式日志存储

BookKeeper 是 Pulsar 的存储底座，独立可复用：

- **ledger**：写消息的最小分段单元。一个 topic 由多个 ledger 串成（写满或定时切换新 ledger）。ledger 创建时确定副本分布（写到哪几个 Bookie）。
- **写 quorum（Qw）与  ack quorum（Qa）**：默认 `Qw=3, Qa=2`——写 3 个 Bookie 副本，2 个确认即算写入成功（类似 Kafka 的 acks=all + min.insync.replicas）。
- **Bookie 故障自愈**：Bookie 挂时，其上的 ledger 副本不足，BookKeeper 自动在其他 Bookie 补齐副本——存储层自愈，broker 无感知。
- **对比 Kafka 副本**：Kafka 副本绑死 broker（partition→replica→broker）；Pulsar ledger 副本可跨 Bookie 迁移，更灵活。

## 四、多租户：tenant/namespace/topic

Pulsar 多租户是设计之初的核心理念：

```
persistent://tenant/namespace/topic
            │       │         │
            │       │         └─ 消息主题
            │       └─ 命名空间（策略单元：保留/复制/TTL）
            └─ 租户（顶级隔离：认证授权/配额）
```

- **认证授权**：每个 tenant 配独立用户/角色，控制谁能访问。namespace/topic 继承 tenant 权限。
- **配额（限流）**：按 tenant/namespace 配消息速率（如 10000 msg/s）、存储上限、Topic 数上限——防止单租户耗尽资源。
- **资源隔离**：可选指定某 namespace 专用的 broker 池或 Bookie 池（物理隔离），满足关键业务 SLA。
- **典型用法**：SaaS 平台一个集群服务多企业客户（每客户一个 tenant）；企业内部一个集群多业务线（每业务线一个 tenant）。

## 五、地理复制：内置跨地域同步

Pulsar 地理复制是**内置**功能，无需外部组件：

- **配置方式**：创建 topic 时指定 `replicated`，配置目标集群（如 us-east → eu-west），消息自动复制。
- **复制粒度**：可全集群复制，也可按 namespace/topic 选择性复制。
- **对比 Kafka**：Kafka 跨集群复制要用 **MirrorMaker / MirrorMaker 2**（独立组件，运维复杂）；Pulsar 一行配置内置，运维简单。
- **典型场景**：跨地域容灾（主集群挂，备集群接管）、全球化部署（中美双集群，用户就近访问）、数据合规（数据按地域存储）。

## 六、订阅模式与 cursor

| 订阅模式 | 行为 | 顺序保证 | 典型场景 |
| --- | --- | --- | --- |
| **Exclusive** | 单消费者独占 | 严格顺序 | 顺序处理（订单状态机） |
| **Shared** | 多消费者轮询 | 不保证 | 高吞吐无序（日志） |
| **Failover** | 主消费备待命，主挂备顶 | 顺序（单主） | 高可用顺序消费 |
| **Key_Shared** | 按 key 路由同 key 同消费者 | 同 key 有序 | 既序又并行（订单按 key） |

- **cursor**：每个订阅维护独立的 cursor（消费进度），存在 ZK/broker。ACK 后 cursor 前移；崩溃未 ACK 则重投（at-least-once）。
- **多订阅独立**：一个 topic 可有多个订阅，各自 cursor 独立——类似 Kafka 多消费者组，但 Pulsar 允许任意创建订阅（更灵活）。

## 下一步

掌握了架构后，下一步进入 [分层存储与 Kafka 对比](./comparison)——Tiered Storage 冷热分层、Pulsar Functions 流处理、与 Kafka 存算一体架构的全面对比与选型建议。
