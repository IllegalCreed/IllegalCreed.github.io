---
layout: doc
outline: [2, 3]
---

# 路由模型：Exchange、Queue、Binding 与 AMQP

> 基于 RabbitMQ 3.13 / 4.0 · 核于 2026-08

## 速查

- **AMQP 协议**：Advanced Message Queuing Protocol，定义了 Broker/Exchange/Queue/Binding/Message 的完整模型与 wire-level 二进制协议。RabbitMQ 实现的是 **AMQP 0.9.1**（原生，常用）+ **AMQP 1.0**（插件，与 ActiveMQ/Qpid 互通）。
- **核心实体**：**Exchange**（消息入口）、**Queue**（消息缓冲）、**Binding**（绑定规则）、**Message**（消息体 + 元数据如 routing key/headers）。
- **Exchange 四类型**：①**direct**（routing key 精确相等）；②**topic**（按 `.` 分隔 + `*`/`#` 通配符匹配）；③**fanout**（广播到所有绑定队列）；④**headers**（按消息头 x-match=all/any 匹配，忽略 routing key）。
- **default exchange**：名为空字符串 `""` 的特殊 direct exchange，所有队列自动绑定到它且 key=队列名——发消息到 default exchange + routing key=队列名 = 直接发到该队列。
- **Queue 属性**：`durable`（持久化，broker 重启不丢）、`exclusive`（仅当前连接可用，连接断开自动删除）、`auto-delete`（最后一个消费者断开后删除）。
- **Binding 参数**：`routing key`（direct/topic 用）、`arguments`（headers 用 `x-match=any|all`）、可设 `x-cancel-on-ha-failover` 等。
- **消息属性**：`deliveryMode`（2=持久化）、`contentType`、`contentEncoding`、`priority`、`correlationId`（RPC 用）、`replyTo`（RPC 回调队列）、`expiration`（TTL，毫秒）。
- **routing key 格式**：用 `.` 分隔的单词串（如 `logs.kernel.warning`），topic 模式按段匹配。
- **通配符**（topic）：`*` 匹配**一个**单词，`#` 匹配**零或多个**单词。如 `logs.*.warning` 匹配 `logs.kernel.warning` 不匹配 `logs.kernel.critical.warning`；`logs.#` 匹配所有以 `logs.` 开头的。

## 一、AMQP 协议与核心实体

AMQP 定义了一套完整的消息模型，RabbitMQ 是其最知名的实现。理解四个核心实体：

```
┌──────────┐   消息+routing key   ┌──────────┐  Binding规则  ┌──────────┐  push  ┌──────────┐
│ 生产者    │ ──────────────────> │ Exchange │ ────────────> │  Queue   │ ────> │ 消费者    │
└──────────┘                      └──────────┘               └──────────┘  ACK   └──────────┘
                                       │                          │
                                  (按类型路由)                  (FIFO 缓冲)
```

- **Exchange（交换机）**：消息的「入口」，**不存储消息**（除特定情况），只负责按 Binding 规则路由。生产者发消息时指定目标 Exchange 与 routing key。
- **Queue（队列）**：消息的**存储缓冲**，FIFO（同名 Exchange 投递顺序，多 Exchange 投递可能乱序）。消费者订阅 Queue，broker 推送消息。
- **Binding（绑定）**：把 Queue 关联到 Exchange 的「**规则**」——direct/topic 用 routing key，headers 用 arguments，fanout 不需要 key。一个 Queue 可绑定到多个 Exchange，一个 Exchange 可绑定多个 Queue（多对多）。
- **Message（消息）**：由 **body**（字节流）+ **properties**（元数据）组成。关键属性：`deliveryMode`（2=持久化）、`contentType`、`correlationId`/`replyTo`（RPC 用）、`headers`（自定义头）、`expiration`（TTL）。

## 二、四种 Exchange 类型详解

### direct：精确匹配

```
Exchange(direct) "logs"
   Binding: Q_error   ← routing key "error"
   Binding: Q_info    ← routing key "info"

生产者发 routing key="error" → 进 Q_error
生产者发 routing key="info"  → 进 Q_info
生产者发 routing key="warn"  → 无匹配，丢弃（或进 alternate exchange）
```

- **路由规则**：消息的 routing key 与 Binding 的 routing key **字符串精确相等**才路由。
- **适用**：点对点、按级别/类型分发。如不同日志级别路由到不同处理队列。

### topic：通配符匹配

```
Exchange(topic) "app_logs"
   Binding: Q_kernel_error ← "logs.kernel.*"      (* 匹配一个单词)
   Binding: Q_all_error    ← "*.critical.error"   
   Binding: Q_everything    ← "logs.#"            (# 匹配零或多个单词)

routing key = "logs.kernel.error"   → Q_kernel_error + Q_everything
routing key = "app.kernel.error"    → Q_all_error
routing key = "logs.db.critical.error" → Q_everything
```

- **路由规则**：routing key 按 `.` 分段，Binding 的 pattern 用 `*`（一个单词）/ `#`（零或多个单词）匹配。
- **特殊 pattern**：`#`（仅井号）匹配一切（等价于 fanout）；无通配符的 pattern 等价于 direct。
- **适用**：灵活的主题订阅。如订阅 `logs.kernel.*` 收所有 kernel 服务日志、`*.critical.*` 收所有服务的 critical 级别。

### fanout：广播

```
Exchange(fanout) "broadcast"
   Binding: Q_a (无需 routing key)
   Binding: Q_b (无需 routing key)

生产者发任意 routing key → 同时进 Q_a 和 Q_b（广播）
```

- **路由规则**：**忽略 routing key**，消息广播到**所有**绑定的 Queue。
- **适用**：发布订阅、广播通知。如系统公告、配置变更通知所有节点。

### headers：按消息头匹配

```
Exchange(headers) "header_match"
   Binding: Q_a ← arguments: {x-match: "all", format: "pdf", type: "report"}

消息 headers = {format: "pdf", type: "report"} → 进 Q_a（全匹配）
消息 headers = {format: "pdf", type: "invoice"} → 不匹配
```

- **路由规则**：**忽略 routing key**，按消息 headers 匹配。`x-match=all` 要求所有头匹配，`x-match=any` 任一匹配即可。
- **适用**：不依赖 routing key 的复杂多维匹配（如同时按 format+type 筛选）。性能略低于其他类型（要解析所有头）。

## 三、特殊 Exchange：default 与 alternate

- **default exchange**：名字为空字符串 `""`，类型是 direct。**所有队列自动绑定到它，binding key = 队列名**。所以发消息到 default exchange + routing key=队列名 = 直接发到该队列——这是最简单的「点对点」用法，初学者常用。
- **alternate exchange（AE）**：Exchange 上配 `alternate-exchange` 参数，当消息**无匹配 Binding** 时，转发到 AE。用于兜底处理「没路由上的消息」（如告警、归档）。

## 四、Queue 属性与生命周期

声明 Queue 时的关键属性：

| 属性 | 含义 | 典型值 |
| --- | --- | --- |
| `durable` | 是否持久化（broker 重启不丢队列定义） | `true`（生产） |
| `exclusive` | 仅当前连接可用，连接断开自动删除 | `true`（临时队列，如 RPC 回调） |
| `auto-delete` | 最后一个消费者断开后自动删除 | 临时队列用 |
| `x-message-ttl` | 队列内消息的默认 TTL（毫秒） | 延迟队列用 |
| `x-dead-letter-exchange` | 死信目标 Exchange | DLX 用 |
| `x-max-priority` | 启用优先级队列，定义最大优先级值 | 紧急消息优先 |

- **消息持久化**：Queue `durable=true` **只保证队列定义不丢**，消息要持久化还得发消息时 `deliveryMode=2`。两者都要。
- **exclusive Queue**：常用于 RPC 回调——客户端连上声明一个独占队列作 replyTo，连接断开自动清理。

## 五、消息流转全过程

一次完整的「生产者→消费者」流转：

```
1. 生产者发消息 (Exchange, routing key, body, properties[deliveryMode=2])
2. Exchange 收到 → 按 Binding 规则找匹配的 Queue 列表
   - 若持久化且 deliveryMode=2 → 写磁盘（保证 broker 重启不丢）
   - 若开启 publisher confirms → 回调 ack 给生产者
3. Exchange 把消息投递到所有匹配的 Queue（每个 Queue 一份拷贝）
4. Queue 按 FIFO 缓冲消息
5. 消费者订阅 Queue（push 模式，按 prefetch 推送）
6. 消费者处理消息 → basicAck（确认消费，消息从 Queue 删除）
   - 若消费者崩溃（连接断）→ 未 ACK 的消息被 broker 重投给其他消费者（at-least-once）
   - 若消费者 basicNack/basicReject(requeue=false) → 进死信队列 DLX
```

## 下一步

掌握了路由模型后，下一步进入 [工作模式与死信队列](./patterns-and-dlx)——四种典型工作模式拓扑、死信队列 DLX、TTL 延迟队列、Quorum Queue 高可用、管理界面。
