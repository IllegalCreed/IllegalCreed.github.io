---
layout: doc
---

# Pulsar

**Apache Pulsar** 是 Yahoo 自研、2016 年捐赠 Apache 顶级基金会、用 **Java** 编写的**分布式发布订阅消息与事件流平台**——它以「**计算存储分离（broker 无状态 + BookKeeper 存数据）**」的云原生架构、「**原生多租户（tenant → namespace → topic）**」、「**内置地理复制（geo-replication）**」、「**Tiered Storage（分层存储，热 BookKeeper + 冷 S3）**」四大特性，成为继 Kafka 之后下一代消息平台的代表。理解 Pulsar 的关键是理解它对 Kafka「存算一体」架构的根本性重构：Kafka 的 broker 既管元数据又存数据，分区与 broker 绑定——扩容要迁移分区数据，慢且重；**Pulsar 把 broker 与存储彻底分离**——broker 是**无状态计算节点**（只负责消息路由与协议处理，可随时加），数据存在 **Apache BookKeeper**（独立的分布式日志存储，分段 ledger 分布在 Bookie 节点）——这让 Pulsar **扩容秒级**（加 broker 立即生效）、**多租户原生**（tenant/namespace/topic 三级隔离）、**地理复制内置**（一行配置跨地域同步）、**分层存储天然**（热数据在 BookKeeper，冷数据下沉到 S3/对象存储）。这些架构优势让 Twitter、Splunk、Tencent、Yahoo Japan 等超大规模场景选择 Pulsar，被视为「云原生时代的 Kafka」。

Pulsar 的全部考点围绕「**架构先进性、多租户、地理复制、对比 Kafka**」展开：①**存算分离架构**（broker 无状态、BookKeeper 分布式日志、分区与存储解耦）——回答「为什么扩容快、为什么云原生」；②**原生多租户**（tenant/namespace/topic 三级模型、认证授权、配额）——回答「一个集群怎么服务多业务方」；③**地理复制**（内置跨机房/跨地域同步、与 Kafka MirrorMaker 的差异）——回答「跨地域容灾怎么做」；④**Tiered Storage**（热数据 BookKeeper + 冷数据对象存储，成本可控）——回答「海量冷数据怎么存」；⑤**订阅模式**（Exclusive/Shared/Failover/Key_Shared 四种）与生态（Functions 流处理、IO 连接器）；⑥**与 Kafka 对比**（存算一体 vs 存算分离、生态强弱、适用场景）。本叶是消息队列组的**第四站**，讲清 Pulsar 的存算分离架构与多租户、地理复制，再讲 Tiered Storage 与 Kafka 对比，帮你理解它「架构先进但生态弱于 Kafka」的定位。

## 评价

**优点**

- **存算分离**：broker 无状态可秒级扩缩容，存储独立扩展，云原生友好
- **原生多租户**：tenant/namespace/topic 三级隔离 + 认证授权 + 配额，一个集群服务多业务方
- **地理复制内置**：一行配置跨地域同步，容灾与全球化天然支持
- **分层存储**：热数据 BookKeeper + 冷数据下沉 S3，海量历史数据成本可控

**缺点**

- **运维组件多**：broker + BookKeeper + ZooKeeper 三套组件（KRaft 后的 Kafka 更轻）
- **生态弱于 Kafka**：社区规模、文档、商业支持（StreamNative 外）不及 Confluent/Kafka 生态
- **学习曲线陡**：多层抽象（broker/Bookie/ledger/cursor）与多订阅模式，比 Kafka 复杂
- **国内案例少**：在中国市场影响力远不及 Kafka/RocketMQ，文档与最佳实践相对稀缺

## 本叶地图

- [入门](./getting-started) —— Pulsar 定位、存算分离架构、多租户、地理复制、订阅模式、与 Kafka 差异
- [架构详解](./guide-line/architecture) —— broker 无状态、BookKeeper 分布式日志、tenant/namespace/topic 多租户、地理复制机制、订阅模式四种
- [分层存储与 Kafka 对比](./guide-line/comparison) —— Tiered Storage 冷热分层、Pulsar Functions 流处理、与 Kafka 存算一体架构的全面对比、选型建议
- [参考](./reference) —— 配置项速查、订阅模式对比、命令清单、易错点、四大消息队列选型对比

## 幻灯片地址

<a href="/SlideStack/pulsar-slide/" target="_blank">Pulsar</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Pulsar" target="_blank" rel="noopener noreferrer">Pulsar 测试题</a>
