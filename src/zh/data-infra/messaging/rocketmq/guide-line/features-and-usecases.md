---
layout: doc
outline: [2, 3]
---

# 特性与实战：顺序、事务、延迟消息与双 11

> 基于 RocketMQ 5.x（LiteTopic、Controller 模式） · 核于 2026-08

## 速查

- **顺序消息（Order Message）**：保证同一业务 key 的消息**按发送顺序消费**。生产端按 key（如订单号）路由到同一 MessageQueue，消费端单线程顺序消费。分**全局有序**（单 Queue，牺牲并行）与**分区有序**（多 Queue，同 key 同 Queue）。
- **事务消息（Transaction Message）**：让「发消息」与「本地数据库事务」**原子化**。流程：①发**半消息（half message）**到 broker（暂不对消费者可见）；②执行**本地事务**；③本地事务成功→**提交**半消息（变正常消息投递）/ 失败→**回滚**（删除）；④若本地事务状态未知（如网络断），broker **回查（check back）** 生产者确认状态。
- **定时/延迟消息（Scheduled/Delay Message）**：原生支持 **18 个延迟级别**（1s/5s/10s/30s/1m/2m/3m/4m/5m/6m/7m/8m/9m/10m/20m/30m/1h/2h）。5.x 起支持**任意时间定时**。订单超时取消、延迟通知开箱即用。
- **消息过滤**：Tag（轻量）+ SQL92 表达式（按属性过滤）。
- **LiteTopic（5.x）**：面向 **AI 会话**的低延迟队列——毫秒级推送、海量上下文管理，为 AI Agent 多轮对话、流式输出设计。
- **堆积容灾**：消费跟不上时消息大量堆积，RocketMQ 用 CommitLog 顺序写 + 内存映射扛住堆积，堆积百万级仍可读。
- **双 11 实战**：万亿级消息、峰值每秒亿级、堆积容灾、主从切换——这套场景打磨出的稳定性是国内大厂选它的核心。
- **中国电商事实标准**：淘宝/天猫/支付宝、拼多多、滴滴、美团、京东（部分）核心交易链路跑在 RocketMQ 上。

## 一、顺序消息：分区有序

业务消息常需**按发送顺序消费**——如订单的「创建→支付→发货→签收」必须有序，否则消费端状态机错乱。RocketMQ 的顺序消息靠**同 key 同 MessageQueue**：

```
生产端：按业务 key（如订单号 orderId）路由到同一 MessageQueue
  MessageQueueSelector: (list, msg, arg) -> list.get(hash(orderId) % list.size())

消费端：MessageListenerOrderly（顺序消费，单线程处理一个 Queue）
  同 orderId 的消息永远进同 Queue，消费端按 Queue 顺序消费 → 业务有序
```

- **分区有序**（推荐）：多 MessageQueue，同 key 进同 Queue，单 Queue 内有序，跨 Queue 不保证——兼顾有序与并行。
- **全局有序**：单 MessageQueue，所有消息严格有序——但牺牲并行（吞吐大降），仅用于「必须全局有序」的极少场景。
- **消费端**：用 `MessageListenerOrderly`（顺序消费，broker 锁定 Queue）而非 `MessageListenerConcurrently`（并发消费，无序）。
- **对比 Kafka**：Kafka 单分区内有序，但 RocketMQ 把「同 key 路由 + 顺序消费」做成了**原生 API**，开箱即用。

## 二、事务消息：半消息 + 回查

分布式事务的经典痛点：「**写本地数据库 + 发消息**」如何原子化？若先写库再发消息，发消息失败则库写了消息没发；若先发消息再写库，写库失败则消息发了但库没写。RocketMQ 用**事务消息**优雅解决：

```
1. Producer 发半消息（half message）到 broker
   → 半消息进特殊 Topic（RMQ_SYS_TRANS_HALF_TOPIC），消费者看不到
   → broker 返回半消息发送成功

2. Producer 执行本地数据库事务（如扣库存、写订单）

3. Producer 根据本地事务结果：
   - COMMIT  → broker 把半消息转为正常消息，投递给消费者
   - ROLLBACK -> broker 删除半消息，消费者永远收不到

4. 若 Producer 在第 3 步崩溃（状态未知），broker 定期（60s）回查 Producer：
   - Producer 的 checkLocalTransaction() 返回 COMMIT/ROLLBACK/UNKNOWN
   - UNKNOWN 则继续等下次回查（超时后默认 ROLLBACK）
```

- **核心价值**：保证「**本地事务成功则消息一定发出，失败则一定不发**」——半消息让消息发送与本地事务在效果上原子化。
- **回查机制**：Producer 崩溃或网络断时，broker 主动回查，避免消息悬空。Producer 需实现 `checkLocalTransaction` 接口（查本地库确认事务状态）。
- **典型场景**：订单创建（写订单库 + 发消息通知库存/物流）、扣款（扣款 + 发消息记账）——金融场景核心。

## 三、定时/延迟消息：原生延迟级别

RocketMQ 原生支持**延迟消息**——消息发送时不立即投递，延迟到指定时间后才对消费者可见：

- **18 个延迟级别**：1s/5s/10s/30s/1m/2m/3m/4m/5m/6m/7m/8m/9m/10m/20m/30m/1h/2h。生产端发消息时 `setDelayTimeLevel(3)` 即延迟 10 秒。
- **实现机制**：broker 把延迟消息存到特殊 Topic（SCHEDULE_TOPIC_XXXX），后台定时任务按级别扫描，到期后转为正常消息投递。
- **5.x 任意时间定时**：5.x 起支持 `setMessageDelayTimeSec` 或 `setDeliverTimeMs` 指定任意时间，不再限于 18 个级别。
- **典型场景**：
  - **订单超时取消**：下单时发延迟 30 分钟消息，30 分钟后消费检查支付状态，未支付则取消订单。
  - **延迟通知**：注册后 24 小时发提醒。
- **对比 RabbitMQ**：RabbitMQ 延迟要靠 TTL+DLX（拼装）或延迟插件；RocketMQ 原生支持，开箱即用。

## 四、LiteTopic（5.x）：面向 AI 会话

RocketMQ 5.x 引入 **LiteTopic**——面向 **AI 场景**的轻量低延迟队列：

- **毫秒级推送**：传统队列是 pull 模型（消费者轮询），LiteTopic 改为**推模型**，毫秒级推送，适合 AI 对话的实时性。
- **海量上下文管理**：AI Agent 多轮对话需要维护长上下文（用户消息历史），LiteTopic 提供高效的上下文存储与检索。
- **流式输出**：支持大模型流式输出（token 逐个推送），适配 LLM 的流式响应。
- **典型场景**：AI 客服多轮对话、AI Agent 的事件流、RAG 系统的上下文管理。

LiteTopic 让 RocketMQ 从「电商消息」扩展到「AI 时代的事件流」，与 Kafka 在 AI 场景竞争。

## 五、双 11 实战：万亿级消息

RocketMQ 的稳定性来自双 11 实战打磨：

- **万亿级消息**：双 11 当天单集群峰值万亿级消息、每秒亿级 TPS——考验 broker 的 CommitLog 顺序写性能与网络栈。
- **堆积容灾**：大促时消费端（如下游报表、风控）可能跟不上，消息大量堆积。RocketMQ 用 CommitLog 顺序写 + 内存映射 + 异步刷盘，**堆积百万级消息仍可正常读写**，不 OOM 不丢。
- **主从切换**：Master 节点故障时，DLedger（Raft）自动选举新 Master，秒级切换，业务无感知。
- **流量削峰**：大促瞬时流量涌入，RocketMQ 作为缓冲削峰填谷，保护下游数据库与服务。
- **场景**：订单创建、支付结果广播、库存扣减、营销活动通知、日志收集——核心交易链路全在 RocketMQ 上。

## 六、中国电商事实标准

国内主流互联网公司大量采用 RocketMQ：

- **阿里系**：淘宝/天猫/支付宝——RocketMQ 的发源地，核心交易链路。
- **拼多多/滴滴/美团/字节**：订单、支付、通知等核心业务。
- **金融行业**：银行/证券的交易消息、对账、风控——顺序/事务消息特性契合金融需求。

RocketMQ 在中国的地位类似 Kafka 在欧美的地位——**电商金融消息的事实标准**。

## 下一步

架构与特性都讲完后，[参考](../reference) 页提供配置项速查、消息类型对比、常用命令、易错点与四大消息队列选型对比，便于查阅。
