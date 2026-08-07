---
layout: doc
outline: [2, 3]
---

# 入门：RabbitMQ 定位、路由模型与工作模式

> 基于 RabbitMQ 3.13 / 4.0（Quorum Queue 默认） · 核于 2026-08

## 速查

- **定位**：RabbitMQ 是用 **Erlang** 编写、实现 **AMQP** 协议的通用消息代理——核心价值是**强路由能力 + 低延迟 + 协议丰富**。
- **核心路由轴**：`Exchange（交换机） → Binding（绑定规则） → Queue（队列）`。**生产者从不直接发消息到队列**，而是发到 Exchange；Exchange 按类型与 Binding 把消息路由到 Queue。
- **Exchange 四种类型**：①**direct**（精确匹配 routing key）；②**topic**（按通配符 `*`/`#` 匹配 routing key）；③**fanout**（广播到所有绑定的队列，忽略 key）；④**headers**（按消息头匹配，忽略 key）。
- **Queue（队列）**：消息存储的 FIFO 缓冲，消费者拉取或被推送，处理完发 **ACK** 确认（未 ACK 则重投）。
- **AMQP 协议**：Advanced Message Queuing Protocol，定义了 Broker/Exchange/Queue/Binding/Message 的完整模型与 wire-level 协议——RabbitMQ 实现 AMQP 0.9.1（原生）+ 1.0（插件）。
- **四种工作模式**：①**工作队列**（多个消费者瓜分一个队列，负载均衡）；②**发布订阅**（fanout 广播到多队列）；③**路由模式**（direct 按精确 key 路由）；④**主题模式**（topic 按通配符路由）。
- **可靠性三件套**：①**消息持久化**（durable exchange/queue + 消息 deliveryMode=2）；②**生产者确认**（publisher confirms，broker 收到后回调）；③**消费者手动 ACK**（处理完再 ack，崩溃未 ack 则重投）。
- **死信队列（DLX）**：消息变成「死信」（被 reject/nack 且 requeue=false、TTL 过期、队列满）时，被路由到指定的 DLX，用于失败消息的二次处理/告警。
- **TTL + DLX = 延迟队列**：给消息/队列设 TTL，过期后进 DLX，下游订阅 DLX 即可实现延迟投递（如订单 30 分钟未支付自动取消）。
- **Quorum Queue**（3.8+，4.0 默认）：基于 **Raft** 的高可用队列，替代经典镜像队列，**数据强一致**、故障自动 failover。
- **management plugin**：官方 Web UI，可视化 queues/exchanges/connections/bindings，监控消息速率——**开发调试必备**。
- **与 Kafka 差异**：RabbitMQ 强在**路由丰富 + 低延迟**（任务分发/业务消息），Kafka 强在**极致吞吐 + 持久化回放**（日志/事件流/数仓）。
- **进阶顺序**：[路由模型详解](./guide-line/routing-model) → [工作模式与死信队列](./guide-line/patterns-and-dlx) → [参考](./reference)。

## 一、RabbitMQ 是什么：路由优先的消息代理

Kafka 把消息中间件重新定义为「事件日志」，而 RabbitMQ 走的是另一条路——「**智能路由的邮件系统**」：

1. **生产者只管发到 Exchange**：生产者不关心消息最终进哪个队列，只指定 Exchange 与 routing key，由 broker 决定路由。
2. **Exchange 按 Binding 路由**：管理员预先定义「Exchange + 绑定规则（routing key/通配符/头匹配）→ Queue」的拓扑，Exchange 收到消息后按规则投递到对应队列。
3. **消费者从 Queue 消费 + ACK**：消费者订阅 Queue，broker 推送消息，消费者处理完发 ACK；未 ACK 的消息（消费者崩溃/处理失败）会被重投。

这种「**智能 broker + 智能路由**」让 RabbitMQ 在「**点对点任务分发、按业务规则精细路由、广播通知**」场景里非常顺手——而 Kafka 的「分区日志 + key 哈希」路由能力则弱得多。

一句话：**RabbitMQ 是「路由能力最强的消息中间件」——用 Exchange + Binding 表达任意业务路由拓扑，配合 ACK 与持久化保证可靠投递。**

## 二、核心路由模型：Exchange → Binding → Queue

```
生产者 ──(消息 + routing key)──> Exchange ──(按类型 + Binding)──> Queue ──> 消费者
                                    │
                          Binding: (Exchange, Queue, routing key/规则)
```

- **Exchange（交换机）**：消息的入口，四种类型决定路由行为。
- **Binding（绑定）**：把 Queue 关联到 Exchange 的规则，可带 routing key（direct/topic）或匹配头（headers）。
- **Queue（队列）**：消息的 FIFO 缓冲，消费者从中消费。一个 Queue 可绑定到多个 Exchange，一个 Exchange 可绑定多个 Queue。
- **routing key**：生产者发送时带的字符串，Exchange 用它做匹配（direct 精确、topic 通配符、fanout 忽略）。

四种 Exchange 类型一览（详见 [路由模型详解](./guide-line/routing-model)）：

| 类型 | 路由规则 | 典型场景 |
| --- | --- | --- |
| **direct** | routing key **精确相等**才路由 | 点对点、按级别分发（error/warn/info） |
| **topic** | routing key 按**通配符**匹配（`*` 一个词 / `#` 多个词） | 按主题层级订阅（`logs.kernel.*`） |
| **fanout** | **广播**到所有绑定的队列，忽略 routing key | 发布订阅（广播通知） |
| **headers** | 按**消息头**匹配（x-match=all/any） | 不依赖 routing key 的复杂匹配 |

## 三、四种工作模式

| 模式 | 拓扑 | 用途 |
| --- | --- | --- |
| **工作队列（Work Queue）** | 一个 Queue + 多个消费者瓜分 | 任务分发、负载均衡（图片处理、邮件发送） |
| **发布订阅（Pub/Sub）** | fanout Exchange + 多个 Queue | 广播通知、日志多路输出 |
| **路由（Routing）** | direct Exchange + 按 key 绑定 | 按级别/类型精确分发（error → 告警队列） |
| **主题（Topic）** | topic Exchange + 通配符绑定 | 灵活订阅（`logs.*.error` 订阅所有服务的错误日志） |

工作队列的核心是**多消费者瓜分一个队列**——broker 轮询推送，每个消息只被一个消费者处理，实现负载均衡。配合 prefetch count 控制每个消费者未 ACK 的消息数，避免一个消费者积压、其他空闲。

## 四、可靠性三件套

RabbitMQ 不丢消息靠三层保证：

1. **消息持久化**：Exchange/Queue 声明为 `durable=true`，消息发送时 `deliveryMode=2`（持久化）——broker 重启不丢。代价：写磁盘降低吞吐。
2. **生产者确认（publisher confirms）**：开启后 broker 收到并持久化消息后回调 `ack` 给生产者，生产者据此重发——保证「broker 收到了」。
3. **消费者手动 ACK**：消费者关闭自动 ACK（`autoAck=false`），处理完业务逻辑再 `basicAck`——消费者崩溃时未 ACK 的消息会被重投（at-least-once）。

三层组合后，从生产者到消费者的整条链路都不丢消息（生产者→broker 靠 confirm，broker 持久化靠 durable，broker→消费者靠 ACK + 重投）。

## 五、RabbitMQ 与 Kafka 的差异

| 维度 | RabbitMQ | Kafka |
| --- | --- | --- |
| **核心模型** | Exchange/Queue 智能路由 | 分区 commit log |
| **路由能力** | **强**（四种 Exchange + Binding） | 弱（key 哈希分区） |
| **消费模型** | 推送（push）+ ACK | 拉取（pull）+ offset |
| **消息保留** | ACK 后即删 | 按保留策略存盘，可回放 |
| **多消费者独立回放** | 无（要靠额外机制） | **有**（消费者组） |
| **吞吐** | 万级 TPS（内存队列） | **百万级 TPS** |
| **延迟** | **个位数毫秒** | 百毫秒级（批处理） |
| **典型场景** | 任务队列、业务消息、精细路由 | 日志、事件流、CDC、数仓管道 |

**一句话**：要**精细路由 + 低延迟 + 任务队列**选 RabbitMQ；要**极致吞吐 + 持久化回放 + 多消费者解耦**选 Kafka。

## 下一步

理解了 RabbitMQ 的总览后，下一步深入两个核心维度——[路由模型详解](./guide-line/routing-model)（四种 Exchange 的精确语义与 AMQP 协议）与 [工作模式与死信队列](./guide-line/patterns-and-dlx)（四种模式拓扑、DLX 死信、TTL 延迟队列、管理界面）。
