---
layout: doc
outline: [2, 3]
---

# 工作模式、死信队列与管理

> 基于 RabbitMQ 3.13 / 4.0 · 核于 2026-08

## 速查

- **四种工作模式**：①**工作队列**（一队列多消费者瓜分，负载均衡）；②**发布订阅**（fanout 广播到多队列）；③**路由模式**（direct 按精确 key）；④**主题模式**（topic 按通配符）。
- **消息持久化**：`durable=true`（Queue/Exchange）+ `deliveryMode=2`（消息）—— broker 重启不丢。两者都要。
- **生产者确认（publisher confirms）**：broker 收到并落盘后回调 ack 给生产者，生产者据此重发——保证「broker 收到了」。
- **消费者手动 ACK**：`autoAck=false`，处理完再 `basicAck`——崩溃未 ACK 则 broker 重投（at-least-once，需消费端幂等）。
- **prefetch**：限制每个消费者未 ACK 的消息数（如 `prefetch=1`），避免一个消费者积压、其他空闲——公平分发。
- **死信（Dead-Letter）**：消息在三种情况下变死信——①被 `basicReject`/`basicNack` 且 `requeue=false`；②**TTL 过期**；③**队列达 max-length**。
- **死信队列（DLX）**：声明 Queue 时配 `x-dead-letter-exchange`，死信自动路由到该 Exchange → 绑定的死信 Queue，便于二次处理/告警/审计。
- **TTL + DLX = 延迟队列**：给消息/队列设 TTL，过期后进 DLX，下游订阅 DLX 实现「定时投递」（如订单 30 分钟未支付自动取消）。
- **Quorum Queue**（3.8+，**4.0 默认**）：基于 **Raft** 的高可用队列，数据强一致、自动 failover——替代经典镜像队列（Classic Mirrored Queue，已弃用）。
- **Lazy Queue**（惰性队列）：消息默认写磁盘，内存只存元数据——适合百万级消息堆积场景，牺牲延迟换内存可控。4.0 起默认行为（惰性成为默认）。
- **management plugin**：官方 Web UI（默认 15672 端口），可视化 queues/exchanges/connections，监控消息速率，发送测试消息——**开发调试必备**。
- **多租户**：**vhost**（虚拟主机，逻辑隔离）+ 用户权限（按 vhost 配置 read/write/configure）。

## 一、四种工作模式

### 1. 工作队列（Work Queue）：负载均衡

```
生产者 ──> Queue "tasks" ──> 消费者 A（处理）
                          ──> 消费者 B（处理）   ← broker 轮询推送，每个消息只被一个消费者处理
                          ──> 消费者 C（处理）
```

- **核心**：多个消费者订阅**同一个** Queue，broker 轮询推送，每个消息只被**一个**消费者处理——实现负载均衡。
- **prefetch 公平分发**：默认 broker 会一次推多条给快消费者，导致慢消费者闲置、快消费者积压。设 `basicQos(prefetch=1)` 让每个消费者未 ACK 不超过 1 条，实现「处理完再给下一条」的公平分发。
- **典型场景**：图片处理、邮件发送、订单异步处理——多 worker 瓜分任务。

### 2. 发布订阅（Pub/Sub）：fanout 广播

```
生产者 ──> Exchange(fanout) "notify" ──> Queue "email_q"   ──> 邮件服务
                                   ──> Queue "sms_q"     ──> 短信服务
                                   ──> Queue "push_q"    ──> 推送服务
（同一消息广播到三个队列，各自独立消费）
```

- **核心**：fanout Exchange 把消息**广播**到所有绑定的 Queue，每个 Queue 独立消费一份。
- **典型场景**：系统公告、配置变更通知、用户行为日志多路输出。

### 3. 路由模式（Routing）：direct 精确

```
生产者 ──> Exchange(direct) "logs" ──[key=error]──> Queue "error_q" ──> 告警
                                ──[key=info]───> Queue "info_q"  ──> 归档
                                ──[key=warn]───> Queue "warn_q"
```

- **核心**：direct Exchange 按 routing key **精确相等**路由，生产者按 key 决定进哪个队列。
- **典型场景**：按级别/类型分发——error 进告警、info 进归档。

### 4. 主题模式（Topic）：通配符灵活

```
生产者 ──> Exchange(topic) "app" ──["logs.kernel.*"]──> Queue "kernel_q"
                              ──["*.critical.error"]──> Queue "urgent_q"
                              ──["logs.#"]─────────> Queue "all_logs_q"

routing key="logs.kernel.error" → kernel_q + all_logs_q
```

- **核心**：topic Exchange 按 `.` 分段 + `*`/`#` 通配符匹配，灵活订阅。
- **典型场景**：多服务多维度的日志/事件订阅——订阅 `logs.kernel.*` 收所有 kernel 服务日志。

## 二、可靠性：持久化、Confirm、ACK

生产级 RabbitMQ 不丢消息靠三层：

```java
// 1. 持久化：Exchange/Queue durable + 消息 deliveryMode=2
channel.exchangeDeclare("orders", "direct", true);  // durable=true
channel.queueDeclare("order_q", true, false, false, null);  // durable=true
channel.basicPublish("orders", "pay", 
    MessageProperties.PERSISTENT_TEXT_PLAIN,  // deliveryMode=2
    msg.getBytes());

// 2. 生产者确认（publisher confirms）
channel.confirmSelect();
channel.basicPublish(...);
if (!channel.waitForConfirms(5000)) { /* 重发 */ }

// 3. 消费者手动 ACK
channel.basicConsume("order_q", false, (tag, delivery) -> {
    process(delivery);              // 先处理业务
    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);  // 再 ACK
}, tag -> {});
```

- **持久化代价**：写磁盘降低吞吐（内存队列的万级 TPS → 持久化后下降），但保证 broker 重启不丢。可用 **lazy queue** 把所有消息默认落盘，避免内存压力。
- **publisher confirms vs 事务**：事务（`txSelect`/`txCommit`）开销大（约降 250 倍吞吐），**生产用 confirms**（异步回调，开销小）。
- **ACK 与重投**：手动 ACK 下，消费者崩溃（连接断）或处理失败 `basicNack`，消息被重投——at-least-once，消费端**幂等**。

## 三、死信队列（DLX）与延迟队列

**死信（Dead-Letter）**：消息在以下三种情况变成死信：

1. 被 `basicReject`/`basicNack` 且 `requeue=false`（消费者拒绝且不重排队）。
2. **TTL 过期**（消息 `expiration` 或队列 `x-message-ttl` 到期）。
3. **队列达 `x-max-length`**（超出限制，先进先出被挤出的）。

**死信队列（DLX）实现**：声明 Queue 时配 `x-dead-letter-exchange`（与可选 `x-dead-letter-routing-key`），死信自动路由到该 Exchange：

```
Queue "order_pay_q" (x-message-ttl=1800000, x-dead-letter-exchange="order_timeout")
   ↓ 消息 30 分钟未被消费（TTL 过期）→ 变死信
DLX "order_timeout" → Queue "order_timeout_q" → 消费者：执行「订单超时取消」
```

**TTL + DLX = 延迟队列**：给消息/队列设 TTL，过期后进 DLX，下游订阅 DLX 实现「定时投递」。典型用例：

- **订单超时取消**：下单后消息进 TTL=30 分钟的队列，超时未支付变死信 → DLX → 消费者执行取消逻辑。
- **延迟通知**：注册后 24 小时发提醒邮件。

注意：基于 TTL+DLX 的延迟队列是经典方案；RabbitMQ **延迟消息插件**（`rabbitmq_delayed_message_exchange`）提供原生延迟 Exchange，更简单但需装插件。

## 四、Quorum Queue 与 Lazy Queue

- **Quorum Queue**（3.8+，4.0 默认）：基于 **Raft** 共识的**强一致高可用队列**——
  - 替代经典镜像队列（Classic Mirrored Queue，**已弃用**，4.0 移除）。
  - 数据强一致（多数副本写入成功才算成功），故障自动 failover（秒级）。
  - 代价：性能略低于经典镜像队列，**不支持 exclusive**、优先级队列等少数特性。
  - **生产默认选 Quorum Queue**。
- **Lazy Queue**（惰性队列，4.0 默认行为）：消息默认**写磁盘**，内存只存元数据——
  - 适合**百万级消息堆积**场景，避免 OOM。
  - 代价：吞吐与延迟略降（每次都磁盘 IO）。
  - 4.0 起，队列默认是 lazy 行为，无需特别声明。

## 五、管理界面与运维

- **management plugin**（`rabbitmq-plugins enable rabbitmq_management`）：Web UI 默认 **15672** 端口——
  - 可视化 Queues（消息数、消费者数、速率）、Exchanges、Bindings、Connections、Channels。
  - 发送测试消息（手动发一条进队列测试）。
  - 用户/权限/vhost 管理。
  - **开发调试必备**，生产用 Prometheus + Grafana 做长期监控。
- **多租户**：**vhost**（虚拟主机）做逻辑隔离，每个 vhost 独立的 queues/exchanges/permissions。用户按 vhost 配置 read/write/configure 权限。
- **常用命令**：
  - `rabbitmqctl list_queues`：列队列。
  - `rabbitmqctl list_exchanges`：列交换机。
  - `rabbitmqctl set_policy`：设队列策略（如 HA、TTL）。
  - `rabbitmqctl add_vhost`/`set_permissions`：多租户管理。

## 下一步

路由模型与工作模式都讲完后，[参考](../reference) 页提供配置项速查、Exchange 类型对比、常用命令、易错点与四大消息队列选型对比，便于查阅。
