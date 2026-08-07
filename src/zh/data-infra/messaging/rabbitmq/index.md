---
layout: doc
---

# RabbitMQ

**RabbitMQ** 是 Rabbit Technologies 公司开发、用 **Erlang** 编写、实现 **AMQP**（Advanced Message Queuing Protocol）协议的**通用消息代理（message broker）**——它以「**Exchange + Queue + Binding**」三件套构成的**路由模型**，把消息从生产者精确地按规则投递到队列，再由消费者 ACK 确认消费。理解 RabbitMQ 的关键是理解「**Exchange（交换机）→ Binding（绑定规则）→ Queue（队列）**」这条核心路由轴：生产者**从不直接发消息到队列**，而是发到 Exchange；Exchange 根据**类型（direct/topic/fanout/headers）**与 Binding 规则，把消息路由到一个或多个 Queue；消费者从 Queue 拉取（或被推送）消息，处理完发 ACK 确认。这套机制让 RabbitMQ 成为「**路由能力最强**」的消息中间件——点对点、发布订阅、按路由键匹配、按消息头匹配都能优雅表达，配合**死信队列（DLX）**处理失败消息、**TTL** 做延迟队列、**管理界面**可视化运维，让它在「**任务分发、业务消息、系统解耦**」场景里长期占据一席之地——Uber 的地理位置更新、Instagram 的异步通知、众多金融系统的订单流转都跑在它上面。

RabbitMQ 的全部考点围绕「**路由、可靠、灵活**」展开：①**路由模型**（Exchange 四种类型 direct/topic/fanout/headers、Binding、Queue、AMQP 协议）——回答「消息怎么从生产者到队列」；②**工作模式**（工作队列负载均衡、发布订阅、路由模式、主题模式）——回答「典型业务拓扑怎么搭」；③**可靠性**（消息持久化、生产者确认 publisher confirms、消费者手动 ACK、镜像队列 Quorum Queue）——回答「broker 挂了或消费者崩了不丢消息吗」；④**死信与延迟**（DLX 死信队列 + TTL 实现延迟队列、惰性队列）——回答「消费失败的消息去哪、怎么定时投递」；⑤**运维**（management plugin Web UI、用户/权限/vhost 多租户、Prometheus 监控）。本叶是消息队列组的**第二站**，讲清 RabbitMQ 的路由模型与工作模式，再讲死信/延迟与管理，帮你既会用 RabbitMQ、也会在选型表上写明它「强在哪、弱在哪」。

## 评价

**优点**

- **路由能力强**：四种 Exchange 类型覆盖点对点、广播、按路由键匹配、按消息头匹配——业务拓扑表达力丰富
- **低延迟**：内存队列 + 推送模式，端到端延迟常在个位数毫秒级，适合实时业务消息
- **协议丰富**：原生 AMQP 0.9.1，插件支持 AMQP 1.0、STOMP、MQTT、HTTP——兼容多语言多协议客户端
- **管理友好**：官方 management plugin 提供 Web UI，可视化队列/连接/消息流转；vhost + 用户权限实现多租户隔离

**缺点**

- **吞吐有限**：单机万级 TPS 量级，远低于 Kafka 的百万级——大规模日志/事件流场景力不从心
- **消息回放弱**：消息消费 ACK 后即从队列删除，无 Kafka 那样的「多消费者组独立回放历史」能力（要回放得用额外机制）
- **Erlang 运维门槛**：用 Erlang 编写，调试与深度调优对非 Erlang 背景的运维人员有学习曲线
- **集群扩展有限**：经典镜像队列在节点增多时性能下降明显（已被 Quorum Queue 替代），但整体横向扩展能力不及 Kafka

## 本叶地图

- [入门](./getting-started) —— RabbitMQ 定位、Exchange/Queue/Binding 路由模型、AMQP 协议、四种工作模式、与 Kafka 的差异
- [路由模型详解](./guide-line/routing-model) —— Exchange 四种类型（direct/topic/fanout/headers）、Binding、Queue、AMQP 协议细节、消息流转全过程
- [工作模式与死信队列](./guide-line/patterns-and-dlx) —— 工作队列/发布订阅/路由/主题模式、消息持久化、ACK、死信队列 DLX、TTL 延迟队列、管理界面
- [参考](./reference) —— 配置项速查、Exchange 类型对比、常用命令、易错点、四大消息队列选型对比

## 幻灯片地址

<a href="/SlideStack/rabbitmq-slide/" target="_blank">RabbitMQ</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=RabbitMQ" target="_blank" rel="noopener noreferrer">RabbitMQ 测试题</a>
