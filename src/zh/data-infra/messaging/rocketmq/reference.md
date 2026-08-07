---
layout: doc
outline: [2, 3]
---

# 参考：RocketMQ 配置、消息类型与选型

> 基于 RocketMQ 5.x · 核于 2026-08

## 速查

- **架构**：NameServer（去中心化注册）+ Broker（CommitLog + ConsumeQueue）。NameServer 节点独立无协调，部署简单。
- **消息模型**：Topic → Tag（二级过滤）→ MessageQueue（并行+有序单位）。
- **三大特性**：顺序消息（分区有序）、事务消息（半消息+回查）、定时/延迟消息（18 级别）。
- **刷盘/复制**：SYNC_FLUSH + DLedger（Raft）是金融级推荐组合。
- **LiteTopic（5.x）**：面向 AI 会话的低延迟推模型队列。
- **双 11 实战**：万亿级消息、堆积容灾、DLedger 自动切换——中国电商事实标准。

## 一、消息类型对比

| 消息类型 | 特点 | 典型场景 |
| --- | --- | --- |
| **普通消息** | 无序、最高吞吐 | 日志、通知、事件广播 |
| **顺序消息** | 同 key 同 Queue，按序消费 | 订单状态流转、状态机 |
| **事务消息** | 半消息+本地事务+回查，原子化 | 写库+发消息需原子（订单创建、扣款） |
| **定时/延迟消息** | 延迟到指定时间投递 | 订单超时取消、延迟通知 |
| **批量消息** | 多条打包发送，省网络 | 大批量日志 |

## 二、核心配置速查

### Broker 端

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `flushDiskType` | ASYNC_FLUSH | SYNC_FLUSH（金融） | 刷盘策略 |
| `brokerRole` | ASYNC_MASTER | SYNC_MASTER / DLedger | 复制策略 |
| `defaultTopicQueueNums` | 4 | 按并发设 | 默认 Queue 数 |
| `maxMessageSize` | 4194304（4MB） | 按业务 | 单消息最大 |
| `messageDelayLevel` | 18 级 | 保持默认 | 延迟级别 |

### Producer 端

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `sendMsgTimeout` | 3000 | 按网络调 | 发送超时 |
| `retryTimesWhenSendFailed` | 2 | 3 | 同步发送重试 |
| `maxMessageSize` | 4MB | 按业务 | 单消息最大 |
| MessageQueueSelector | - | 按 key 哈希 | 顺序消息用 |

### Consumer 端

| 配置 | 默认 | 推荐生产值 | 说明 |
| --- | --- | --- | --- |
| `consumeMode` | CONCURRENTLY | ORDERLY（顺序） | 消费模式 |
| `messageModel` | CLUSTERING | 按需 | 集群/广播 |
| `consumeThreadMin/Max` | 20/64 | 按业务 | 消费线程池 |
| `consumeTimeout` | 15min | 按业务 | 消费超时 |

## 三、常用命令速查

```bash
# mqadmin 工具（在 bin/ 下）
sh mqadmin clusterList -n localhost:9876           # 查看集群
sh mqadmin topicList -n localhost:9876             # 列 Topic
sh mqadmin topicStatus -n localhost:9876 -t OrderTopic  # Topic 状态
sh mqadmin topicRoute -n localhost:9876 -t OrderTopic    # Topic 路由

# 创建 Topic（指定 Queue 数）
sh mqadmin updateTopic -n localhost:9876 -b broker-a -t OrderTopic -r 16 -w 16

# 消费进度
sh mqadmin consumerProgress -n localhost:9876 -g order_consumer_group

# 发送/消费测试消息
sh tools.sh org.apache.rocketmq.example.quickstart.Producer
sh tools.sh org.apache.rocketmq.example.quickstart.Consumer
```

## 四、事务消息实现要点

```java
// 生产者实现事务消息
TransactionMQProducer producer = new TransactionMQProducer("tx_group");
producer.setTransactionListener(new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        // 执行本地数据库事务（如写订单库）
        try {
            doLocalDbTransaction();
            return LocalTransactionState.COMMIT_MESSAGE;   // 提交半消息
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE; // 回滚
        }
    }
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // broker 回查时，查本地库确认事务状态
        return queryDbTransactionStatus(msg) 
            ? LocalTransactionState.COMMIT_MESSAGE
            : LocalTransactionState.ROLLBACK_MESSAGE;
    }
});
producer.sendMessageInTransaction(msg, null);  // 发半消息
```

## 五、易错点清单

- **「RocketMQ 用 ZooKeeper 做注册中心」**：错。RocketMQ 用 **NameServer**（去中心化、节点独立、无协调），不用 ZooKeeper。Kafka 早期才用 ZK。
- **「顺序消息默认全局有序」**：错。默认是**分区有序**（同 key 同 MessageQueue），全局有序需单 Queue（牺牲并行）。
- **「事务消息的回查可以省略」**：错。Producer 必须实现 `checkLocalTransaction`，否则本地事务状态未知时消息会悬空（最终 ROLLBACK）。
- **「延迟消息支持任意时间」**：4.x 只支持 18 个固定延迟级别；5.x 起才支持任意时间定时。
- **「Tag 可以替代 Topic」**：错。Tag 是 Topic 内的二级标签（轻量过滤），Topic 是顶层逻辑流，粒度不同。
- **「RocketMQ 吞吐比 Kafka 高」**：错。RocketMQ 单机十万级 TPS，Kafka 百万级 TPS。RocketMQ 胜在业务消息特性，非极致吞吐。
- **「LiteTopic 是普通 Topic 的别名」**：错。LiteTopic 是 5.x 面向 AI 会话的低延迟推模型队列，与普通 Topic 模型不同。
- **「NameServer 节点间要数据同步」**：错。NameServer 节点独立运行互不通信，靠 Broker 心跳最终一致，无协调开销。
- **「异步刷盘一定丢数据」**：错。异步刷盘 broker 挂「可能」丢（未刷的部分），正常情况下后台会刷盘，不是一定丢。
- **「DLedger 是 ZooKeeper 的替代」**：错。DLedger 是 Broker 层的 Raft 复制与选主机制（替代主从），NameServer 才是 ZK 的对应物。

## 六、四大消息队列选型对比

| 维度 | RocketMQ | Kafka | RabbitMQ | Pulsar |
| --- | --- | --- | --- | --- |
| **出身** | 阿里/Apache/Java | LinkedIn/Apache | Erlang/AMQP | Yahoo/Apache |
| **核心模型** | Topic+Tag+MessageQueue | 分区 commit log | Exchange/Queue 路由 | 存算分离+多订阅 |
| **顺序消息** | **原生强** | 单分区内有序 | 单队列内有序 | 单分区有序 |
| **事务消息** | **原生强**（半消息+回查） | 事务（EOS） | 弱 | 事务（EOS） |
| **延迟消息** | **原生**（18 级别） | 需自己实现 | TTL+DLX/插件 | 原生 |
| **路由能力** | 中（Tag+SQL92） | 弱 | **强**（4 Exchange） | 中 |
| **吞吐** | 十万级 TPS | **百万级 TPS** | 万级 TPS | 高 |
| **延迟** | 中 | 百毫秒级 | **个位数毫秒** | 中低 |
| **多租户** | 中 | 弱 | vhost | **强** |
| **典型场景** | **电商/金融/订单** | 日志/CDC/数仓 | 任务队列/业务路由 | 多租户/跨地域 |

**一句话选型**：要**电商金融的业务消息**（顺序/事务/延迟）选 **RocketMQ**；要**极致吞吐 + 事件流**选 **Kafka**；要**丰富路由 + 低延迟**选 **RabbitMQ**；要**多租户 + 地理复制**选 **Pulsar**。

## 权威链接

- [Apache RocketMQ 官方文档](https://rocketmq.apache.org/docs/)
- [RocketMQ 5.x 架构](https://rocketmq.apache.org/zh/docs/)
- [事务消息最佳实践](https://rocketmq.apache.org/docs/bestPractice/06Bestpractices)
- [DLedger 模式](https://github.com/apache/rocketmq/tree/develop/dledger)
- 本站幻灯片：<a href="/SlideStack/rocketmq-slide/" target="_blank">RocketMQ</a>
