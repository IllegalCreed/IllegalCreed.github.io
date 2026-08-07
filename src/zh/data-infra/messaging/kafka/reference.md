---
layout: doc
outline: [2, 3]
---

# 参考：Kafka 配置、命令与选型速查

> 基于 Kafka 3.9（KRaft 模式） · 核于 2026-08

## 速查

- **核心模型**：Topic → Partition → Offset。分区=并行+有序单位，单分区内有序，跨分区不保证。
- **生产可靠性**：`acks=all` + `enable.idempotence=true` + `min.insync.replicas≥2` + `unclean.leader.election.enable=false` + `replication.factor=3`。
- **消费语义**：自动提交可能丢消息；手动提交保证至少一次（消费端须幂等）；事务 read-process-write 实现精确一次。
- **消费者组**：组内瓜分分区（负载均衡），组间独立消费（发布订阅）；rebalance 期间消费暂停，用 CooperativeStickyAssignor 减小影响。
- **KRaft**：3.9 生产可用，4.0 移除 ZK。Controller（Raft 元数据）+ Broker（数据）分离部署；新部署直接用 KRaft。
- **保留策略**：`retention.ms`（默认 7 天）/ `retention.bytes` 删除；`cleanup.policy=compact` 按 key 留最新值。
- **生态**：Streams（嵌入式流）/ Connect（Source-Sink 连接器，Debezium CDC）/ Schema Registry（Avro/Protobuf 版本管理）/ ksqlDB（SQL 流处理）。

## 一、核心配置项速查

### 生产者（Producer）

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `acks` | `all`（3.0+） | `all` | 0/1/all，all=所有 ISR 确认 |
| `enable.idempotence` | `true`（3.0+） | `true` | PID+seq 去重，防重试重复 |
| `retries` | `2147483647` | 保持默认 | 无限重试，幂等保证不重复 |
| `compression.type` | `producer` | `lz4` 或 `zstd` | 批量压缩，省网络与存储 |
| `linger.ms` | `0` | `5-10` | 攒批等待时间，提升吞吐 |
| `batch.size` | `16384` | `65536` | 批次大小（字节） |
| `max.in.flight.requests.per.connection` | `5` | `5`（幂等时）| 并发请求数，幂等开启可>1 |
| `transactional.id` | - | 业务唯一 | 开启事务 |

### 消费者（Consumer）

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `enable.auto.commit` | `true` | **`false`**（手动） | 自动提交可能丢消息 |
| `auto.offset.reset` | `latest` | `earliest`（按需） | 无 offset 时从哪开始 |
| `group.id` | - | 业务唯一 | 消费者组标识 |
| `partition.assignment.strategy` | `RangeAssignor` | `CooperativeStickyAssignor` | 增量 rebalance |
| `session.timeout.ms` | `45000` | 按网络调整 | 心跳超时，超时视为死亡 |
| `max.poll.interval.ms` | `300000` | 按处理时长调整 | 两次 poll 间最大间隔，超时触发 rebalance |
| `isolation.level` | `read_uncommitted` | `read_committed`（事务） | 只读已提交事务消息 |

### Broker / Topic

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `num.partitions` | `1` | `6/12/24`（按吞吐） | 新 Topic 默认分区数 |
| `default.replication.factor` | `1` | **`3`** | 默认副本数 |
| `min.insync.replicas` | `1` | **`2`** | 至少同步副本数 |
| `unclean.leader.election.enable` | `false` | **`false`** | 禁止非 ISR 当 Leader |
| `log.retention.hours` | `168`（7天） | 按业务 | 保留时间 |
| `cleanup.policy` | `delete` | `delete` 或 `compact` | 删除/压缩 |

## 二、常用命令速查

```bash
# Topic 管理
bin/kafka-topics.sh --bootstrap-server localhost:9092 --create \
  --topic orders --partitions 12 --replication-factor 3
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders
bin/kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic orders --partitions 24  # 只能加

# 控制台生产/消费（调试用）
bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --from-beginning --group test

# 消费者组管理
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group order-processors
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --reset-offsets \
  --group order-processors --topic orders --to-earliest --execute  # 重置 offset

# KRaft 模式格式化存储（首次启动）
bin/kafka-storage.sh format --config config/kraft/server.properties --cluster-id $(bin/kafka-storage.sh random-uuid)
```

## 三、可靠性配方：不丢消息

```yaml
# 完整金融级配置
broker:
  default.replication.factor: 3
  min.insync.replicas: 2
  unclean.leader.election.enable: false
  transaction.state.log.replication.factor: 3
  transaction.state.log.min.isr: 2
topic:
  replication.factor: 3
  min.insync.replicas: 2
producer:
  acks: all
  enable.idempotence: true
  retries: 2147483647
consumer:
  enable.auto.commit: false
```

- **测试不丢消息**：杀掉 Leader broker（`kill -9`），观察是否丢已 ack 消息；杀 follower，观察是否影响写入。
- **危险配置**：`unclean.leader.election.enable=true` + `min.insync.replicas=1` —— 极端情况下丢已 ack 数据。

## 四、易错点清单

- **「分区数可以减少」**：错。Kafka 禁止减少分区（offset 映射会乱）。要「减」只能新建 Topic 迁移。
- **「消费者数越多越快」**：错。消费者数 > 分区数时多余的消费者闲置。**消费并发上限 = 分区数**。
- **「自动提交是安全的」**：错。自动提交可能在「拉了未处理」时提交 offset，崩溃丢消息。生产用手动提交。
- **「`acks=1` 就够了」**：错。Leader 挂且未同步到 follower 时丢数据。生产用 `acks=all` + `min.insync.replicas=2`。
- **「改分区数不影响 key 顺序」**：错。`hash(key) % partition_count`，改分区数会让 key 重新分布，破坏同 key 有序。
- **「Kafka 还依赖 ZooKeeper」**：2025 年起**不一定**。3.9+ KRaft 生产可用，新部署不装 ZK；4.0 移除 ZK。
- **「Kafka 适合做精细路由」**：错。Kafka 路由弱（只有 key 哈希分区），要做丰富路由（topic matching / header 路由）选 RabbitMQ。
- **「Kafka 是 push 模式」**：错。Kafka 消费者是**拉取（pull）**——主动按 offset 拉，自己控速率。
- **「消息消费完就删了」**：错。Kafka 消息按保留策略统一删除（与是否消费无关），故可重放。这是与传统队列的关键差异。
- **「跨分区有序」**：错。只有**单分区内**有序，跨分区不保证。要全局有序只能用单分区。

## 五、四大消息队列选型对比

| 维度 | Kafka | RabbitMQ | RocketMQ | Pulsar |
| --- | --- | --- | --- | --- |
| **出身** | LinkedIn/Apache | Rabbit Technologies/Erlang | 阿里/Apache | Yahoo/Apache |
| **核心模型** | 分布式 commit log | AMQP exchange/queue | Topic + Tag + 队列 | 存算分离 + 多订阅 |
| **吞吐** | **极高（百万 TPS）** | 中（万级 TPS） | 高（十万 TPS） | 高 |
| **延迟** | 百毫秒级（批） | **个位数毫秒** | 中 | 中低 |
| **路由** | 弱（key 哈希） | **强**（exchange 类型丰富） | 中（Tag + SQL92 过滤） | 中 |
| **顺序消息** | 单分区内有序 | 单队列内有序 | **强**（分区顺序消息） | 单分区有序 |
| **事务消息** | 事务（EOS） | 弱 | **强**（半消息+回查） | 事务（EOS） |
| **多租户** | 弱 | 中 | 中 | **强**（原生） |
| **延迟消息** | 需自己实现 | 插件 | **原生**（延迟级别） | 原生（delayed delivery） |
| **典型场景** | 日志/CDC/数仓/事件流 | 任务队列/业务消息/精细路由 | **电商**（订单/事务）/金融 | 多租户/跨地域/云原生 |

**一句话选型**：要**极致吞吐 + 事件流 + 数仓管道**选 **Kafka**；要**丰富路由 + 个位数毫秒延迟 + 任务队列**选 **RabbitMQ**；要**事务消息 + 延迟消息 + 国内电商**选 **RocketMQ**；要**多租户 + 地理复制 + 云原生**选 **Pulsar**。

## 权威链接

- [Apache Kafka 官方文档](https://kafka.apache.org/documentation/)
- [KIP-429 Cooperative Rebalance](https://cwiki.apache.org/confluence/display/KAFKA/KIP-429)
- [KRaft Mode 文档](https://kafka.apache.org/documentation/#kraft)
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [Kafka Streams 文档](https://kafka.apache.org/documentation/streams/)
- 本站幻灯片：<a href="/SlideStack/kafka-slide/" target="_blank">Kafka</a>
