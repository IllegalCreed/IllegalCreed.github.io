---
layout: doc
outline: [2, 3]
---

# 参考：RabbitMQ 配置、Exchange 对比与选型

> 基于 RabbitMQ 3.13 / 4.0 · 核于 2026-08

## 速查

- **核心模型**：Exchange → Binding → Queue，生产者从不直接发到队列，发到 Exchange 由其路由。
- **四种 Exchange**：direct（精确）/ topic（通配符）/ fanout（广播）/ headers（按头匹配）。
- **可靠性三件套**：durable（Queue/Exchange）+ deliveryMode=2（消息持久化）+ publisher confirms（生产者确认）+ 手动 ACK（消费者确认）。
- **死信队列**：`x-dead-letter-exchange` 配置，消息被 reject/nack 不重排、TTL 过期、队列满时进 DLX。
- **延迟队列**：TTL + DLX 经典方案，或延迟消息插件（`rabbitmq_delayed_message_exchange`）原生方案。
- **Quorum Queue**：4.0 默认，基于 Raft 强一致高可用，替代已弃用的经典镜像队列。
- **management plugin**：15672 端口 Web UI，开发调试必备；生产用 Prometheus + Grafana。
- **与 Kafka 差异**：RabbitMQ 强路由 + 低延迟（任务队列/业务消息），Kafka 强吞吐 + 持久化回放（日志/事件流）。

## 一、Exchange 四类型对比

| 类型 | 路由规则 | 通配符 | 性能 | 典型场景 |
| --- | --- | --- | --- | --- |
| **direct** | routing key **精确相等** | 无 | 高 | 点对点、按级别分发（error/info） |
| **topic** | routing key 按 `.` 分段 + `*`/`#` | `*` 一个词 / `#` 零或多个词 | 中 | 灵活主题订阅（`logs.kernel.*`） |
| **fanout** | **广播**所有绑定队列，忽略 key | 无 | **最高**（无需匹配） | 发布订阅、广播通知 |
| **headers** | 按**消息头**匹配（x-match=all/any） | 无 | 较低（解析所有头） | 多维复杂匹配，不依赖 routing key |

- **default exchange**：名为 `""` 的特殊 direct，所有队列自动绑定且 key=队列名——发到 default + routing key=队列名 = 直接进队列（最简单用法）。
- **特殊 pattern**：topic 的 `#`（仅井号）匹配一切（等价 fanout）；无通配符的 topic pattern 等价 direct。

## 二、可靠性配置速查

### 生产者侧

| 配置 | 含义 | 生产值 |
| --- | --- | --- |
| `deliveryMode=2` | 消息持久化（写磁盘） | 开 |
| `publisherConfirms=true` | 生产者确认（broker 收到回调 ack） | 开 |
| `mandatory=true` | 消息无匹配队列时回调 ReturnListener（而非静默丢弃） | 开 |
| `alternate-exchange` | 无匹配时的兜底 Exchange | 按需 |

### Queue 侧

| 配置 | 含义 | 生产值 |
| --- | --- | --- |
| `durable=true` | 队列定义持久化（broker 重启不丢队列） | 开 |
| `x-queue-type=quorum` | Quorum Queue（Raft 强一致，4.0 默认） | 开 |
| `x-message-ttl` | 队列内消息默认 TTL（毫秒） | 按需（延迟队列用） |
| `x-dead-letter-exchange` | 死信目标 Exchange | 按需（DLX 用） |
| `x-max-priority` | 启用优先级队列 | 按需 |

### 消费者侧

| 配置 | 含义 | 生产值 |
| --- | --- | --- |
| `autoAck=false` | 手动 ACK（处理完再 ack） | **关闭自动** |
| `basicQos(prefetch=10)` | 每个消费者未 ACK 上限（公平分发） | 按处理能力 |
| `basicAck` | 处理成功确认 | 处理完调用 |
| `basicNack(requeue=false)` | 处理失败拒绝，进死信队列 | 失败时调用 |

## 三、常用命令速查

```bash
# 启用管理插件（Web UI 15672）
rabbitmq-plugins enable rabbitmq_management

# 队列/交换机
rabbitmqctl list_queues name messages consumers
rabbitmqctl list_exchanges name type durable
rabbitmqctl list_bindings

# 用户与 vhost（多租户）
rabbitmqctl add_vhost tenant_a
rabbitmqctl add_user app_user password
rabbitmqctl set_permissions -p tenant_a app_user ".*" ".*" ".*"  # 配置/写/读

# 集群（Quorum Queue 节点）
rabbitmqctl join_cluster rabbit@node1
rabbitmqctl cluster_status

# 策略（批量设队列属性，如 HA、TTL）
rabbitmqctl set_policy ha-all "^ha\." '{"ha-mode":"all"}'
```

## 四、易错点清单

- **「生产者直接发消息到队列」**：错。AMQP 模型里生产者**只发到 Exchange**，由 Exchange 路由到 Queue。default exchange（`""`）让你「看起来」直接发到队列，本质还是 Exchange。
- **「Queue durable=true 就不丢消息」**：错。`durable` 只保证**队列定义**不丢（broker 重启队列还在），消息要持久化还得 `deliveryMode=2`。两者都要。
- **「自动 ACK 是安全的」**：错。自动 ACK 下消息被推送即标记删除，消费者处理崩溃消息就丢。生产用**手动 ACK**。
- **「fanout 看 routing key」**：错。fanout **忽略 routing key**，广播到所有绑定队列。
- **「topic 的 `*` 匹配多个单词」**：错。`*` 只匹配**一个**单词，`#` 才匹配**零或多个**。
- **「RabbitMQ 适合做事件流回放」**：错。消息 ACK 后即从队列删除，无 Kafka 的「多消费者组独立回放历史」能力。要回放用 Kafka。
- **「RabbitMQ 吞吐和 Kafka 相当」**：错。RabbitMQ 单机万级 TPS（内存队列），Kafka 百万级 TPS（顺序磁盘 + 零拷贝）。
- **「经典镜像队列还在用」**：2024+ 已弃用，4.0 移除。**生产用 Quorum Queue**（Raft 强一致）。
- **「TTL+DLX 是唯一延迟方案」**：错。还有延迟消息插件（`rabbitmq_delayed_message_exchange`），原生延迟 Exchange，更简单但需装插件。
- **「prefetch 越大越好」**：错。prefetch 太大会导致快消费者积压、慢消费者闲置。设合理值（如 10）做公平分发。

## 五、四大消息队列选型对比

| 维度 | RabbitMQ | Kafka | RocketMQ | Pulsar |
| --- | --- | --- | --- | --- |
| **出身** | Erlang/AMQP | LinkedIn/Apache | 阿里/Apache | Yahoo/Apache |
| **核心模型** | Exchange/Queue 路由 | 分区 commit log | Topic + Tag + 队列 | 存算分离 + 多订阅 |
| **路由能力** | **强**（4 种 Exchange） | 弱（key 哈希） | 中（Tag + SQL92 过滤） | 中 |
| **吞吐** | 万级 TPS | **百万级 TPS** | 十万级 TPS | 高 |
| **延迟** | **个位数毫秒** | 百毫秒级 | 中 | 中低 |
| **消息回放** | ACK 即删，弱 | **强**（保留策略） | 中 | 强 |
| **顺序消息** | 单队列内有序 | 单分区内有序 | **强**（分区顺序） | 单分区有序 |
| **事务消息** | 弱 | 事务（EOS） | **强**（半消息+回查） | 事务（EOS） |
| **延迟消息** | TTL+DLX / 插件 | 需自己实现 | **原生**（延迟级别） | 原生 |
| **多租户** | vhost + 权限 | 弱 | 中 | **强**（原生） |
| **典型场景** | 任务队列/业务消息/精细路由 | 日志/CDC/数仓/事件流 | 电商订单/事务/金融 | 多租户/跨地域/云原生 |

**一句话选型**：要**丰富路由 + 个位数毫秒延迟 + 任务队列**选 **RabbitMQ**；要**极致吞吐 + 事件流 + 数仓管道**选 **Kafka**；要**事务消息 + 延迟消息 + 电商**选 **RocketMQ**；要**多租户 + 地理复制 + 云原生**选 **Pulsar**。

## 权威链接

- [RabbitMQ 官方文档](https://www.rabbitmq.com/documentation.html)
- [AMQP 0-9-1 协议](https://www.rabbitmq.com/amqp-0-9-1-quickref.html)
- [Quorum Queue 指南](https://www.rabbitmq.com/quorum-queues.html)
- [Dead Lettering 文档](https://www.rabbitmq.com/dlx.html)
- [Management Plugin](https://www.rabbitmq.com/management.html)
- 本站幻灯片：<a href="/SlideStack/rabbitmq-slide/" target="_blank">RabbitMQ</a>
