---
layout: doc
---

# Cassandra

**Apache Cassandra** 是一个**分布式、去中心化、宽列（wide-column）NoSQL 数据库**，最初由 Facebook 在 2008 年为收件箱搜索开发，后捐给 Apache 基金会。它的核心设计目标是**极致的写入可扩展性**与**无单点故障的高可用**——通过**一致性哈希 + Gossip 协议**把数据分散到对等节点（peer-to-peer，无主从），复制因子（replication factor）多副本冗余，可调一致性（ONE/QUORUM/ALL）让用户在**可用性与一致性**之间按场景权衡。Cassandra 用 **CQL（Cassandra Query Language）** 提供类 SQL 的查询接口（但底层是宽列存储），数据按 **keyspace → table → partition key → clustering key** 组织，单分区内的数据连续存储，天然适合**时间序列、物联网传感器、用户活动流**等「写多读少、按主键范围查询」的场景。Apple（数万台节点、百万级 QPS）、Netflix（全球观众行为）、Instagram（Feed）都用它承载海量写入，证明了其在**大规模写入场景**的统治力。理解 Cassandra 的核心是理解它的**去中心化拓扑**（无 Master，任何节点都能接收任何请求）、**可调一致性**（不是 CP 也不是 AP 的极端，而是可滑动的天平）以及**宽列模型与传统行/列存储的差异**——这是它与 MongoDB（文档）、Redis（KV）、MySQL（关系）的根本分野。

## 评价

**优点**

- **去中心化无单点**：所有节点对等，无 Master/Slave，任意节点宕机不影响整体可用——适合跨多数据中心的容灾
- **线性写入扩展**：加节点即扩容，写入吞吐随节点数线性增长（无主从同步瓶颈），扛得住百万级 QPS 写入
- **多数据中心原生支持**：NetworkTopologyStrategy 跨机房/地域复制，故障切换透明
- **可调一致性**：ONE/QUORUM/ALL 让用户按请求粒度权衡延迟与正确性，灵活适配不同业务

**缺点**

- **不支持跨分区事务与 JOIN**：只能做「已知主键」的查询，复杂分析要走 Spark/Elassandra 等外接系统
- **一致性弱于关系库**：默认是最终一致，强一致（ALL）会牺牲可用性与延迟，不适合金融强一致场景
- **运维复杂**：节点扩缩容要修整（repair/cleanup）、Gossip/compaction 调参门槛高，故障诊断需要懂内部机制
- **读放大与存储开销**：多副本 + SSTable 不可变 + compaction，磁盘与内存占用比原始数据大不少

## 本叶地图

- [入门](./getting-started) —— Cassandra 定义、宽列模型、去中心化拓扑、Gossip 与一致性哈希、可调一致性、CQL、典型场景
- [宽列模型与可调一致性](./guide-line/data-model-and-consistency) —— keyspace/table/partition key/clustering key、复制因子、一致性级别 ONE/QUORUM/ALL、CAP 取舍
- [CQL 与大规模写入扩展](./guide-line/cql-and-scaling) —— CQL 语法、写入路径与 LSM 树、ScyllaDB 对比（C++ 移植）、Apple/Netflix 大规模实践
- [参考](./reference) —— 宽列 vs 文档 vs KV 对比、一致性级别矩阵、CQL 速查、易错点清单

## 幻灯片地址

<a href="/SlideStack/cassandra-slide/" target="_blank">Cassandra</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Cassandra" target="_blank" rel="noopener noreferrer">Cassandra 测试题</a>
