---
layout: doc
---

# RocketMQ

**Apache RocketMQ** 是阿里巴巴自研、2016 年捐赠给 Apache 顶级基金会、用 **Java** 编写的**分布式消息与流处理平台**——它脱胎于双十一（双 11）万亿级消息实战，以「**NameServer + Broker**」去中心化架构、「**Topic + Tag + MessageQueue**」两级分类、「**顺序消息、事务消息、定时/延迟消息**」三大原生特性，成为**中国电商与金融行业的事实标准**。理解 RocketMQ 的关键是理解它「**为电商与金融场景量身打造**」的设计取舍：①**顺序消息**——保证消息按发送顺序消费（订单创建→支付→发货必须有序，否则业务逻辑错乱）；②**事务消息**——半消息 + 本地事务 + 回查机制，让「发消息」与「本地数据库事务」原子化（订单写库 + 发消息要么都成功要么都失败），解决了分布式事务的痛点；③**定时/延迟消息**——原生支持延迟级别（1s/5s/10s...30m/1h/2h...），订单超时取消、延迟通知开箱即用。这套特性让淘宝/天猫/支付宝、拼多多、滴滴、美团的核心交易链路都跑在它上面。

RocketMQ 的全部考点围绕「**架构、特性、实战**」展开：①**架构**（NameServer 与 Broker 的去中心化设计、Topic/Tag/MessageQueue 两级分类、Producer/Consumer 角色）——回答「集群怎么组、消息怎么路由」；②**核心特性**（顺序消息的分区有序、事务消息的半消息+回查、定时/延迟消息的延迟级别、消息过滤 Tag 与 SQL92）——回答「电商金融的硬需求怎么满足」；③**实战**（双 11 万亿级消息、堆积容灾、刷盘与复制策略）——回答「生产怎么扛住峰值」；④**演进**（5.x 架构升级、LiteTopic 面向 AI 会话的低延迟队列、与 Kafka/RabbitMQ 的对比）。本叶是消息队列组的**第三站**，讲清 RocketMQ 的架构与核心特性，再讲实战场景与 LiteTopic，帮你既会用 RocketMQ、也理解它为什么是中国电商的事实标准。

## 评价

**优点**

- **原生顺序消息**：MessageQueue 分区有序，保证订单等业务消息严格按序消费
- **事务消息**：半消息 + 本地事务 + 回查，原生解决「发消息与本地事务原子性」的分布式事务痛点
- **定时/延迟消息**：开箱即用的延迟级别，订单超时取消、延迟通知无需自建队列
- **高吞吐 + 低延迟**：双 11 万亿级消息实战，顺序写 + 零拷贝 + 异步刷盘，单机十万级 TPS

**缺点**

- **生态国际化弱**：在欧美与开源社区影响力不及 Kafka，文档与最佳实践以中文为主
- **架构偏重**：NameServer + Broker + 多角色，部署运维比 RabbitMQ 复杂
- **延迟消息限制**：原生只支持固定延迟级别（1s/5s...），任意时间延迟需 5.x+ 新特性或自己实现
- **客户端语言**：Java 客户端最成熟，其他语言（C++/Go/Python）社区维护，功能滞后

## 本叶地图

- [入门](./getting-started) —— RocketMQ 定位、NameServer/Broker 架构、Topic/Tag/MessageQueue、与 Kafka/RabbitMQ 的差异
- [架构详解](./guide-line/architecture) —— NameServer 去中心化、Broker 主从复制、Topic/Tag/MessageQueue 两级分类、刷盘与复制策略
- [特性与实战](./guide-line/features-and-usecases) —— 顺序消息、事务消息、定时/延迟消息、LiteTopic AI 会话、双 11 实战
- [参考](./reference) —— 配置项速查、消息类型对比、常用命令、易错点、四大消息队列选型对比

## 幻灯片地址

<a href="/SlideStack/rocketmq-slide/" target="_blank">RocketMQ</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=RocketMQ" target="_blank" rel="noopener noreferrer">RocketMQ 测试题</a>
