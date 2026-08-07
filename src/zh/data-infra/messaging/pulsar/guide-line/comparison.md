---
layout: doc
outline: [2, 3]
---

# 分层存储、流处理与 Kafka 对比

> 基于 Apache Pulsar 3.x · 核于 2026-08

## 速查

- **Tiered Storage（分层存储）**：热数据存 BookKeeper（SSD，低延迟），冷数据自动下沉到 **S3/Azure Blob/Google Cloud Storage 等对象存储**——海量历史数据成本可控，访问透明。
- **触发条件**：按 **时间阈值**（如 2 天前的数据下沉）或 **大小阈值** 自动迁移 ledger 到冷层。
- **访问透明**：消费者读冷数据时，broker 按需从对象存储拉取，对应用透明——无需改代码。
- **成本优势**：BookKeeper 用 SSD（贵），对象存储极便宜（约 1/10 成本）。海量历史数据下沉到 S3，长期存储成本骤降——适合事件溯源、合规审计、长期日志。
- **Pulsar Functions**：轻量级流处理，用 Java/Python/Go 写函数处理流（map/filter/window/聚合），类似轻量 Flink。部署在 broker 或独立 Functions Worker。
- **Pulsar IO**：连接器框架（Source/Sink），类似 Kafka Connect，对接 MySQL CDC、Kafka、S3、Elasticsearch 等。
- **Pulsar SQL（Trino 集成）**：用 SQL 查询 Pulsar topic（含冷层数据），便于数据分析。
- **与 Kafka 全面对比**：Pulsar 胜在架构（存算分离）、多租户、地理复制、分层存储；Kafka 胜在生态（Streams/Connect/Schema Registry/ksqlDB/Confluent）、社区、文档、商业支持。

## 一、Tiered Storage：冷热分层存储

海量消息长期存储是消息平台的痛点——全放 SSD 成本爆炸，全放磁盘性能差。Pulsar 的 Tiered Storage 用**冷热分层**优雅解决：

```
Topic: events（持续写入）
  ├─ 热层（BookKeeper / SSD）：最近 2 天数据，低延迟读写
  └─ 冷层（S3 / 对象存储）：2 天前的数据，成本极低，按需读
  
  消费者读历史 → broker 按需从 S3 拉取（透明）
```

- **触发下沉**：按 namespace 配置 `managedLedgerDataTtlInSeconds`（数据年龄阈值）或大小阈值，超过的 ledger 自动下沉到对象存储。
- **对象存储支持**：AWS S3、Azure Blob Storage、Google Cloud Storage、阿里云 OSS、自建 MinIO 等。
- **访问透明**：消费者/订阅读历史消息时，broker 自动从冷层拉取，无需改代码——区别于 Kafka（Kafka 的分层存储 2.13+ 引入但生态较弱）。
- **成本优势**：对象存储约是 SSD 的 1/10 成本。对于事件溯源、合规审计（要求保留数年）、长期日志场景，分层存储让长期保留在经济上可行。
- **典型场景**：金融交易日志（合规要求保留 7 年）、用户行为日志（长期分析）、IoT 事件流（海量历史）。

## 二、Pulsar Functions：轻量流处理

Pulsar Functions 是内嵌的流处理能力，比 Kafka Streams 更轻、比 Flink 更简单：

```java
// 经典 word count：读输入 topic → 处理 → 写输出 topic
public class WordCount implements Function<String, String> {
    @Override
    public String process(String input, Context context) {
        // 处理逻辑，可访问 context（日志/状态/配置）
        return input.toUpperCase();
    }
}
```

- **轻量**：一个函数 = 一个处理逻辑，无需独立集群（部署在 broker 或 Functions Worker）。
- **多语言**：Java/Python/Go，便于不同栈团队使用。
- **状态管理**：基于 BookKeeper 的状态存储（State），支持有状态计算（聚合、窗口）。
- **对比**：比 Kafka Streams 简单（无独立 API 体系），比 Flink 轻量（无独立集群）。适合「简单流处理」；复杂 CEP/SQL 仍建议 Flink。
- **部署**：本地模式（开发）/ Cluster 模式（生产，Functions Worker 集群调度）。

## 三、Pulsar IO：连接器生态

类似 Kafka Connect，Pulsar IO 提供 Source/Sink 连接器：

- **Source Connector**：从外部读数据到 Pulsar（如 Debezium CDC 监听 MySQL、Kafka Source、S3 文件）。
- **Sink Connector**：从 Pulsar 写到外部（如 Elasticsearch、JDBC、Redis、S3）。
- **内置连接器**：官方提供常见数据源（Kafka、JDBC、Elasticsearch、Cassandra、S3 等）。
- **部署**：与 Functions 类似，运行在 Functions Worker 上，配置即用，免代码。

## 四、Pulsar SQL：Trino 集成查询

Pulsar 与 Trino（原 PrestoSQL）集成，提供 **Pulsar SQL**——用 SQL 查询 Pulsar topic 数据（含冷层 S3）：

```sql
-- 查询 events topic 最近 1 小时按地域聚合
SELECT region, COUNT(*) 
FROM pulsar."public/default".events 
WHERE event_time > NOW() - INTERVAL '1' HOUR
GROUP BY region;
```

- **冷热透明查询**：Trino 通过 Pulsar connector 直接查 topic，含已下沉到 S3 的冷数据。
- **schema 感知**：基于 Schema Registry（Avro/JSON/Protobuf），自动解析消息字段。
- **适用**：数据分析、报表、临时查询——无需把数据导到数仓即可查。

## 五、与 Kafka 的全面对比

| 维度 | Pulsar | Kafka |
| --- | --- | --- |
| **架构** | **存算分离**（broker 无状态 + BookKeeper） | 存算一体（broker 管元数据+存数据） |
| **扩容** | broker 秒级扩容（无状态） | 需迁移分区数据（慢） |
| **存储扩展** | BookKeeper 独立扩展，加 Bookie 即生效 | 加 broker 扩存储，分区迁移 |
| **副本模型** | ledger 副本跨 Bookie 可迁移 | 分区副本绑死 broker |
| **多租户** | **原生**（tenant/namespace/topic） | 弱（命名规范+配额） |
| **地理复制** | **内置** | 需 MirrorMaker 2 |
| **分层存储** | **原生强**（BookKeeper+S3） | 2.13+ 支持较弱 |
| **订阅模式** | 四种（Exclusive/Shared/Failover/Key_Shared） | 消费者组（pull+分区） |
| **延迟** | 中低（可推模式） | 百毫秒级（批） |
| **吞吐** | 高（接近 Kafka） | **极高（百万 TPS）** |
| **生态** | 较弱（Functions/IO/SQL，社区小） | **极强**（Streams/Connect/Confluent/ksqlDB） |
| **运维** | 偏重（broker+BookKeeper+ZK 三套） | 中（KRaft 后变简单） |
| **学习曲线** | 陡（多层抽象+多订阅） | 中 |
| **社区/文档** | 较小（StreamNative 商业主导） | **庞大**（Confluent+Apache） |
| **典型场景** | 大规模多租户/跨地域/云原生 | 日志/CDC/数仓/事件流（主流） |

## 六、选型建议

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| **多业务方共享集群（SaaS/企业内部）** | **Pulsar** | 原生多租户 + 配额 + 资源隔离 |
| **跨地域容灾/全球化** | **Pulsar** | 内置地理复制，运维简单 |
| **云原生 K8s 弹性** | **Pulsar** | broker 无状态秒级扩缩 |
| **海量冷数据长期保留** | **Pulsar** | Tiered Storage 冷热分层成本低 |
| **事件流/日志/CDC/数仓管道** | **Kafka** | 生态成熟、百万级吞吐、Confluent 商业支持 |
| **金融事务/电商订单** | **RocketMQ** | 顺序/事务/延迟消息原生 |
| **精细路由/任务队列** | **RabbitMQ** | Exchange 路由强、低延迟 |

**一句话**：Pulsar 是**架构最先进的下一代消息平台**——存算分离、多租户、地理复制、分层存储四大特性契合云原生与超大规模场景；但**生态与社区弱于 Kafka**，主流事件流场景仍以 Kafka 为先。选型权衡「架构先进性」与「生态成熟度」——超大规模多租户/云原生选 Pulsar，主流事件流选 Kafka。

## 下一步

架构、特性、对比都讲完后，[参考](../reference) 页提供配置项速查、订阅模式对比、常用命令、易错点与四大消息队列选型对比，便于查阅。
