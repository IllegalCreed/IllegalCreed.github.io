---
layout: doc
outline: [2, 3]
---

# 参考：Pulsar 配置、订阅模式与选型

> 基于 Apache Pulsar 3.x · 核于 2026-08

## 速查

- **架构**：存算分离——broker（无状态）+ BookKeeper（日志存储）+ ZooKeeper（协调）。
- **多租户**：tenant → namespace → topic 三级模型，原生认证授权与配额。
- **订阅四种**：Exclusive（独占）/ Shared（共享轮询）/ Failover（主备）/ Key_Shared（按 key 保序+并行）。
- **地理复制**：内置，配置 `replicated` topic 自动跨集群复制。
- **分层存储**：热 BookKeeper + 冷 S3，按时间/大小自动下沉，访问透明。
- **生态**：Functions（轻量流处理）/ IO（连接器）/ SQL（Trino 集成查询）。
- **与 Kafka**：Pulsar 胜架构先进性（存算分离/多租户/地理复制），Kafka 胜生态成熟度。

## 一、订阅模式对比

| 订阅模式 | 消费者数 | 顺序保证 | 容错 | 典型场景 |
| --- | --- | --- | --- | --- |
| **Exclusive** | 1 个 | 严格顺序 | 单点（消费者挂停） | 顺序处理、状态机 |
| **Shared** | 多个（轮询） | 不保证 | 高（消费者挂重分配） | 高吞吐无序（日志） |
| **Failover** | 主+备 | 顺序（单主） | 高（主挂备顶） | 高可用顺序消费 |
| **Key_Shared** | 多个（按 key） | 同 key 有序 | 高 | 既序又并行（订单按 key） |

- **Exclusive vs Failover**：都是顺序消费，Exclusive 单消费者无主备，Failover 主备可切换。
- **Shared vs Key_Shared**：Shared 轮询不保序（吞吐高），Key_Shared 按 key 路由保同 key 有序（类似 Kafka key 分区）。

## 二、核心配置速查

### Topic 与订阅

| 配置 | 含义 | 生产值 |
| --- | --- | --- |
| `persistent://tenant/ns/topic` | 持久化 topic 全名 | 按租户/命名空间 |
| `partitions` | 分区数（partitioned topic） | 按吞吐设 |
| SubscriptionType | Exclusive/Shared/Failover/Key_Shared | 按场景 |
| SubscriptionInitialPosition | Latest/Earliest | 按需 |

### BookKeeper

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `writeQuorum` (Qw) | 3 | 写副本数 |
| `ackQuorum` (Qa) | 2 | 确认副本数（类似 min.insync.replicas） |
| `ensembleSize` (E) | 3 | ledger 分布的 Bookie 数 |

### Tiered Storage

| 配置 | 含义 |
| --- | --- |
| `managedLedgerDataTtlInSeconds` | 数据下沉到冷层的年龄阈值 |
| `offloadDeletionLagMs` | 下沉后热层保留多久再删 |
| `s3ManagedLedgerOffloadBucket` | S3 桶名 |
| `s3ManagedLedgerOffloadRegion` | S3 区域 |

## 三、常用命令速查

```bash
# pulsar-admin 工具
bin/pulsar-admin tenants create tenant-a
bin/pulsar-admin namespaces create tenant-a/ns-1
bin/pulsar-admin topics create-partitioned-topic \
  persistent://tenant-a/ns-1/orders --partitions 4

# 生产/消费测试
bin/pulsar-client produce persistent://tenant-a/ns-1/orders \
  --messages "msg1" "msg2"
bin/pulsar-client consume persistent://tenant-a/ns-1/orders \
  --subscription-name sub-1

# 订阅管理
bin/pulsar-admin topics stats persistent://tenant-a/ns-1/orders
bin/pulsar-admin subscriptions reset-cursor \
  persistent://tenant-a/ns-1/orders sub-1 --to-earliest

# Functions 部署
bin/pulsar-admin functions create --jar myfunc.jar \
  --classname com.example.WordCount --inputs in-topic --output out-topic

# 地理复制配置
bin/pulsar-admin namespaces set-replication-buckets \
  tenant-a/ns-1 --clusters us-east,eu-west
```

## 四、易错点清单

- **「Pulsar 和 Kafka 架构相同」**：错。Pulsar 是**存算分离**（broker 无状态+BookKeeper），Kafka 是存算一体（broker 管元数据+存数据）——根本不同。
- **「Pulsar broker 存消息数据」**：错。broker 无状态，不存数据（数据在 BookKeeper 的 Bookie 节点）。
- **「Pulsar 不支持多租户」**：错。Pulsar **原生多租户**（tenant/namespace/topic），这是它的核心特性。
- **「Pulsar 地理复制要用 MirrorMaker」**：错。Pulsar **内置**地理复制，一行配置跨集群同步，无需 MirrorMaker（那是 Kafka 的方案）。
- **「Pulsar 生态比 Kafka 强」**：错。Pulsar 生态（Functions/IO/SQL）弱于 Kafka（Streams/Connect/Confluent/ksqlDB），社区也较小。
- **「Tiered Storage 把冷数据删了」**：错。分层存储是把冷数据**迁移**到对象存储（S3），不是删除，访问仍透明。
- **「Key_Shared 与 Shared 相同」**：错。Shared 轮询不保序，Key_Shared 按 key 路由保同 key 有序。
- **「Pulsar 运维比 Kafka 简单」**：错。Pulsar 有 broker + BookKeeper + ZK 三套组件，运维比 KRaft 后的 Kafka 更重。
- **「Pulsar 在中国是主流」**：错。中国市场 Kafka 与 RocketMQ 占主导，Pulsar 案例相对较少（主要是大厂如腾讯）。
- **「ledger 绑死在某个 Bookie」**：错。ledger 副本可在 Bookie 间迁移，Bookie 故障时自愈。

## 五、四大消息队列选型对比

| 维度 | Pulsar | Kafka | RabbitMQ | RocketMQ |
| --- | --- | --- | --- | --- |
| **出身** | Yahoo/Apache | LinkedIn/Apache | Erlang/AMQP | 阿里/Apache |
| **架构** | **存算分离** | 存算一体 | 队列路由 | Topic+Tag+Queue |
| **多租户** | **强（原生）** | 弱 | vhost | 中 |
| **地理复制** | **内置** | MirrorMaker 2 | 弱 | 弱 |
| **分层存储** | **强（S3）** | 弱 | 无 | 无 |
| **吞吐** | 高 | **百万级** | 万级 | 十万级 |
| **路由** | 中 | 弱 | **强** | 中（Tag+SQL92） |
| **顺序消息** | 单分区有序 | 单分区有序 | 单队列有序 | **原生强** |
| **事务消息** | 事务（EOS） | 事务（EOS） | 弱 | **原生强** |
| **延迟消息** | 原生 | 需自己实现 | TTL+DLX | **原生** |
| **生态** | 较弱 | **极强** | 强 | 中（中国强） |
| **典型场景** | 多租户/跨地域/云原生 | 日志/CDC/数仓 | 任务队列/精细路由 | 电商/金融/订单 |

**一句话选型**：要**多租户 + 地理复制 + 云原生**选 **Pulsar**；要**极致吞吐 + 事件流生态**选 **Kafka**；要**丰富路由 + 低延迟**选 **RabbitMQ**；要**电商金融业务消息**选 **RocketMQ**。

## 权威链接

- [Apache Pulsar 官方文档](https://pulsar.apache.org/docs/)
- [Pulsar 架构概述](https://pulsar.apache.org/docs/concepts-architecture-overview/)
- [BookKeeper 文档](https://bookkeeper.apache.org/)
- [Pulsar Tiered Storage](https://pulsar.apache.org/docs/concepts-tiered-storage/)
- [Pulsar Geo-Replication](https://pulsar.apache.org/docs/concepts-replication/)
- 本站幻灯片：<a href="/SlideStack/pulsar-slide/" target="_blank">Pulsar</a>
