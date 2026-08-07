---
layout: doc
outline: [2, 3]
---

# 入门：Pulsar 定位、存算分离与多租户

> 基于 Apache Pulsar 3.x · 核于 2026-08

## 速查

- **定位**：Pulsar 是 Yahoo 自研、Apache 顶级、Java 编写的分布式发布订阅消息平台——以**存算分离、原生多租户、地理复制**三大特性，被视为云原生时代的 Kafka。
- **存算分离架构**：**broker（无状态计算节点）+ BookKeeper（分布式日志存储）**。broker 只管路由与协议，不存数据；数据存 BookKeeper 的 Bookie 节点（分段 ledger 分布式存储）。
- **broker 无状态的好处**：加 broker 立即生效（无需迁移数据），扩缩容秒级，云原生友好（适合 K8s）。
- **BookKeeper**：独立的分布式日志存储，消息按 **ledger（分段）** 写入多个 Bookie（副本），ledger 可在 Bookie 间迁移——存储独立扩展。
- **原生多租户**：**tenant（租户）→ namespace（命名空间）→ topic** 三级模型，配认证授权与配额，一个集群天然服务多业务方。
- **地理复制（geo-replication）**：**内置**跨地域同步，配置 `replicated` topic 后消息自动复制到其他集群——容灾与全球化天然支持。
- **四种订阅模式**：①**Exclusive**（独占，一个消费者）；②**Shared**（共享，轮询负载均衡）；③**Failover**（主备，主挂备顶）；④**Key_Shared**（按 key 同 key 同消费者，保序+并行）。
- **Tiered Storage**：热数据存 BookKeeper，冷数据自动下沉到 S3/对象存储——海量历史数据成本可控。
- **Pulsar Functions**：轻量级流处理（类似轻量 Flink），用 Java/Python 写函数处理流。
- **Pulsar IO**：连接器框架（Source/Sink），类似 Kafka Connect，对接外部数据源。
- **与 Kafka 差异**：Pulsar 存算分离、多租户原生、地理复制内置；Kafka 存算一体、生态强。Pulsar 靠架构先进赢大规模云原生场景，Kafka 靠生态成熟赢主流。
- **进阶顺序**：[架构详解](./guide-line/architecture) → [分层存储与 Kafka 对比](./guide-line/comparison) → [参考](./reference)。

## 一、Pulsar 是什么：云原生时代的 Kafka

Pulsar 起源于 Yahoo 内部的消息平台（2012），为应对 Yahoo 海量业务（多租户、跨地域）而设计，2016 年捐赠 Apache。它的设计哲学与 Kafka 根本不同——Kafka 是「**存算一体**」（broker 既管元数据又存数据，分区与 broker 绑定），Pulsar 是「**存算分离**」（broker 只管计算，数据存独立层）：

1. **broker 无状态**：broker 不存消息数据（只短暂缓存），数据持久化在 BookKeeper。这让 broker 像 Web 服务一样无状态——加机器即扩容，不用迁移数据。
2. **BookKeeper 存储独立**：消息按 ledger（分段）分布在 Bookie 节点，多副本保证可靠。ledger 与 Bookie 解耦，存储可独立扩展、独立运维。
3. **多租户原生**：从设计之初就内置 tenant/namespace/topic 三级模型，一个集群服务多业务方，配认证授权与配额。

这套架构让 Pulsar 在**云原生（K8s 弹性）、多租户 SaaS、跨地域容灾**场景有先天优势——Twitter、Splunk、Tencent 都选它做超大规模消息底座。

一句话：**Pulsar 用「存算分离」重构了消息中间件——broker 无状态秒级扩容、存储独立扩展、多租户与地理复制原生支持，是云原生时代的 Kafka。**

## 二、存算分离：broker + BookKeeper

```
生产者 ──> Broker（无状态计算）──> BookKeeper（分布式日志存储）
              │                         │
        只管路由与协议           消息按 ledger 分段
        加机器即扩容              分布在多个 Bookie 节点
        （不存数据）              （多副本，可迁移）
```

- **broker**：处理 Pulsar 协议、路由消息到 topic、维护订阅 cursor（消费进度）。**无状态**——重启不丢数据（数据在 BookKeeper），可随意扩缩容。
- **BookKeeper**：独立的分布式日志存储。消息按 **ledger**（写满或定时切换的分段）写入多个 Bookie（BookKeeper 存储节点），默认 3 副本写入 2 个确认（`Qw=2, Qa=2`）。
- **ledger 与 Bookie 解耦**：一个 topic 由多个 ledger 组成，每个 ledger 分布在不同 Bookie。Bookie 故障时，ledger 可在其他 Bookie 重建——存储自愈。
- **对比 Kafka**：Kafka 分区与 broker 绑定，扩容要迁移分区数据（慢）；Pulsar 分区是 broker 上的逻辑概念，数据在 BookKeeper，扩 broker 立即生效。

## 三、原生多租户：tenant/namespace/topic

Pulsar 从设计之初就内置多租户：

```
Pulsar 集群
  ├─ tenant: tenant-a（业务方 A）
  │   ├─ namespace: team-1
  │   │   ├─ topic: orders
  │   │   └─ topic: payments
  │   └─ namespace: team-2
  ├─ tenant: tenant-b（业务方 B）
  │   └─ namespace: prod
  │       └─ topic: logs
```

- **tenant（租户）**：顶级隔离单元，通常对应一个业务方/组织。可配独立认证授权、配额（消息速率、存储上限）。
- **namespace（命名空间）**：tenant 内的逻辑分组（如团队、环境），管理 topic 的策略（保留、复制、TTL 等）。
- **topic**：消息主题，全名 `persistent://tenant/namespace/topic`。
- **隔离粒度**：认证授权（哪些用户能访问哪个 tenant）、配额（限流）、资源隔离（可指定 namespace 专用的 broker/Bookie 池）——SaaS 与企业内部多业务共享一个集群。

## 四、四种订阅模式

Pulsar 提供四种订阅模式，覆盖不同消费场景：

| 订阅模式 | 行为 | 适用 |
| --- | --- | --- |
| **Exclusive**（独占） | 一个 topic/订阅只允许**一个消费者** | 严格顺序、单消费者场景 |
| **Shared**（共享） | 多消费者**轮询**消费（负载均衡），不保证顺序 | 高吞吐无序场景 |
| **Failover**（主备） | 多消费者，**主**消费，备待命；主挂备顶 | 高可用顺序消费 |
| **Key_Shared**（按 key 共享） | 多消费者**按 key 路由**（同 key 同消费者），保序+并行 | 既需顺序又需并行（订单按 key 保序） |

- **Shared vs Key_Shared**：Shared 不保证顺序（轮询），Key_Shared 按 key 路由保证同 key 有序（类似 Kafka key 分区 + 消费者组）。
- **订阅与 topic 解耦**：一个 topic 可以有多个订阅（subscription），每个订阅独立维护 cursor（消费进度）——类似 Kafka 的消费者组，但更灵活（可创建任意订阅）。

## 五、地理复制与 Tiered Storage

- **地理复制（geo-replication）**：配置 `replicated` topic 后，消息自动复制到其他地域的 Pulsar 集群——**内置**，无需外部组件（Kafka 要用 MirrorMaker）。用于跨地域容灾、全球化部署（如中美双集群同步）。
- **Tiered Storage（分层存储）**：热数据存 BookKeeper（SSD，低延迟访问），冷数据自动下沉到 **S3/对象存储**（成本低）——海量历史数据成本可控。访问时按需从冷层读，对应用透明。

## 六、Pulsar 与 Kafka 的差异概览

| 维度 | Pulsar | Kafka |
| --- | --- | --- |
| **架构** | **存算分离**（broker 无状态 + BookKeeper） | 存算一体（broker 管元数据+存数据） |
| **扩容** | 加 broker 立即生效（无状态） | 要迁移分区数据（慢） |
| **多租户** | **原生**（tenant/namespace/topic） | 弱（靠 Topic 命名规范 + 配额） |
| **地理复制** | **内置** | 需 MirrorMaker/MirrorMaker 2 |
| **分层存储** | **原生强**（热 BookKeeper + 冷 S3） | 2.13+ 支持但较弱 |
| **生态** | 较弱（Functions/IO/SQL，社区小） | **极强**（Streams/Connect/Confluent） |
| **运维** | 偏重（broker + BookKeeper + ZK） | 中（KRaft 后变简单） |
| **典型场景** | 大规模多租户/跨地域/云原生 | 日志/CDC/数仓/事件流（主流） |

**一句话**：要**大规模多租户 + 地理复制 + 云原生弹性**选 Pulsar；要**成熟生态 + 极致吞吐 + 事件流**选 Kafka。

## 下一步

理解了 Pulsar 的总览后，下一步深入两个核心维度——[架构详解](./guide-line/architecture)（broker/BookKeeper/多租户/地理复制/订阅模式）与 [分层存储与 Kafka 对比](./guide-line/comparison)（Tiered Storage、Functions、全面对比）。
