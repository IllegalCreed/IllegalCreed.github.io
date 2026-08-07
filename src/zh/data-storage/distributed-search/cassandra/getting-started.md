---
layout: doc
outline: [2, 3]
---

# 入门：宽列模型、去中心化与可调一致性

> 基于 Cassandra 5.x · 核于 2026-08

## 速查

- **定义**：Apache Cassandra 是**分布式、去中心化、宽列 NoSQL 数据库**，最初由 Facebook 2008 年为收件箱搜索开发，后捐给 Apache。核心目标：**极致写入扩展 + 无单点高可用**。
- **去中心化（无 Master）**：所有节点**对等**（peer-to-peer），无主从之分。任意节点都能接收任意请求，并作为**协调节点（coordinator）**把请求转发到对应的副本节点。任意节点宕机不影响整体可用——这是它「无单点故障」的基础。
- **一致性哈希（Consistent Hashing）**：每个节点在哈希环上占一个区间，分区键（partition key）经哈希落到某个节点，由该节点及其后续 N-1 个节点共同持有副本——加/减节点只影响相邻区间，**数据迁移最小化**。
- **Gossip 协议（八卦协议）**：节点间**周期性（约 1 秒）**互相交换心跳与状态（谁在线、谁宕了、谁的 token 范围是什么），最终所有节点对集群拓扑达成一致——**无需中心配置服务**，是去中心化的核心。
- **复制因子（Replication Factor, RF）**：每条数据在集群中存**几份**。RF=3 表示数据落在 3 个不同节点。配合**一致性级别**（ONE/QUORUM/ALL）决定读写要等几个副本响应。
- **宽列模型**：数据按 **keyspace（命名空间）→ table → 分区（partition，由 partition key 决定）→ 行（clustering key 排序）→ 列（column）** 组织。一个分区可有多行多列，连续存储在磁盘——天然适合**按主键范围/时间窗口**的查询。
- **可调一致性（Tunable Consistency）**：每次读写可独立指定一致性级别——**ONE**（任一副本响应即可，最快但可能读到旧值）、**QUORUM**（多数派响应，平衡）、**ALL**（全部副本，强一致但最慢、最脆）。这是 Cassandra 在 CAP 上的「滑动天平」。
- **CQL（Cassandra Query Language）**：类 SQL 的查询语言（`SELECT * FROM users WHERE user_id = ?`），降低学习门槛——但底层是宽列存储，不支持 JOIN、跨分区事务、复杂子查询。
- **写入路径（LSM 树）**：写先入**内存 MemTable** + **提交日志 CommitLog**（崩溃可恢复），MemTable 满了 flush 成不可变的 **SSTable** 落盘；后台 **compaction** 合并多个 SSTable 删除墓碑（tombstone）——**写永远顺序追加，极快**。
- **典型场景**：时间序列（传感器/日志/监控）、用户活动流（Feed/收件箱）、推荐元数据、订单历史；**写多读少、按主键查询、可容忍最终一致**。代表用户：Apple（数万节点）、Netflix（全球观看行为）、Instagram、Spotify、Discord。
- **不适合**：金融强一致事务（用 MySQL/PG）、复杂 JOIN 分析（用 ClickHouse/Spark）、需要二级索引频繁随机查询的场景。
- **进阶顺序**：[宽列模型与可调一致性](./guide-line/data-model-and-consistency) → [CQL 与大规模写入扩展](./guide-line/cql-and-scaling) → [参考](./reference)。

## 一、为什么有 Cassandra：写入扩展与高可用

传统关系库（MySQL/PostgreSQL）在面对**海量写入**时，常见两条路：①**垂直分片（sharding）**——按 user_id 取模分到多库，但扩容要重新分片（数据大迁移），且跨片事务极难；②**主从复制**——主库扛写、从库扛读，但**主库是单点瓶颈**，写不能线性扩展。

Cassandra 的设计选择是：**去中心化 + 一致性哈希 + 多副本**。

- **去中心化**：没有主库。所有节点对等，写请求可发给任意节点，由它作为协调者把数据写到对应的 N 个副本节点。加节点即扩容，写入吞吐**随节点数线性增长**——这是 MySQL 主从做不到的。
- **高可用**：数据多副本（RF=3），任意节点宕机，其他副本仍可服务。配合 Gossip 自动检测故障、协调者自动切换副本——**无单点故障**，跨数据中心也原生支持。

代价是：**放弃强一致性与跨分区事务**，换取可用性与写入扩展。这正是 CAP 定理在工程上的落地（Cassandra 偏 AP，但通过可调一致性可在请求粒度上接近 CP）。

## 二、宽列模型：keyspace / table / partition

Cassandra 的数据模型与关系库很不一样，它叫**宽列（wide-column）**——介于 KV 与关系表之间：

```
keyspace（命名空间，类似 database，含复制策略）
  └─ table（表，定义列与主键）
       └─ partition（分区，由 partition key 哈希决定落在哪个节点）
            └─ row（行，由 clustering key 唯一标识并排序）
                 └─ column（列，可有任意多列，稀疏存储）
```

- **partition key（分区键）**：主键的第一部分，经哈希决定数据落在哪个节点。**同一分区键的所有行存在同一个节点上**（连续存储），所以按分区键查询极快——这是 Cassandra 「按主键查询」能力的基础。
- **clustering key（聚类键）**：主键的后续部分，决定**分区内行的排序**（升序/降序）。这让 `WHERE user_id = ? AND created_at > ?` 这类「按时间窗口查某个用户」的查询非常高效。
- **宽列**：一个分区可以有**任意多行**（每行可有不同列），且列**稀疏存储**——没有值的列不占空间。这让 Cassandra 适合存储「一个用户海量事件」的稀疏数据。

一个典型 CQL 表定义：

```sql
CREATE TABLE user_events (
    user_id      uuid,         -- partition key
    event_time   timestamp,    -- clustering key
    event_type   text,
    payload      text,
    PRIMARY KEY ((user_id), event_time)  -- 双括号：user_id 是分区键
);
-- 查询：取某用户最近 100 条事件（极快，因为同分区连续存储）
SELECT * FROM user_events
WHERE user_id = ?
ORDER BY event_time DESC LIMIT 100;
```

**关键限制**：查询**必须带上分区键**（否则要全表扫描，禁止生产用）。这就是为什么 Cassandra 不适合「按任意字段查询」——它只擅长「已知主键的查询」。

## 三、去中心化：一致性哈希与 Gossip

Cassandra 没有主节点，靠两个机制让所有节点「知道数据该往哪写、该从哪读」：

- **一致性哈希（Consistent Hashing）**：把节点和数据都映射到一个 0 到 2^127 的**哈希环**上。数据按其分区键哈希落在环上某点，顺时针找到的第一个节点就是它的**主副本节点**，再往后数 RF-1 个节点是其他副本。加/减节点时，只影响相邻节点的数据范围（而非全部重哈希）——这是「线性扩展」的核心。
- **虚拟节点（vnode）**：现代 Cassandra 默认每个物理节点在环上有 256 个虚拟节点（token），数据分布更均匀，加节点时迁移更平滑。
- **Gossip（八卦协议）**：节点间每秒与几个随机节点交换状态信息（谁在线、谁宕了、负载如何）。信息像八卦一样**最终传播到全网**，无需中心服务。Gossip 让集群**自愈**：节点宕机被自动检测，协调者自动避开坏节点用其他副本。

## 四、可调一致性：ONE / QUORUM / ALL

Cassandra 的精妙之处在于：**一致性不是全局配置，而是每次读写请求可独立指定**。这让开发者按业务粒度权衡延迟、可用性与正确性：

| 一致性级别 | 含义（RF=3 为例） | 读写语义 | 适用 |
| --- | --- | --- | --- |
| **ONE** | 任一副本响应即可 | 最快、最可用；但**可能读到旧值**（写还没同步到该副本） | 日志、监控、可容忍最终一致 |
| **LOCAL_ONE** | 本数据中心任一副本 | 同上，且避免跨机房延迟 | 多数据中心低延迟读写 |
| **QUORUM** | 多数派（`floor(RF/2)+1`，RF=3 时为 2） | 读写都过半 → **强一致**（在协调好的前提下） | 大部分业务（订单、用户状态） |
| **LOCAL_QUORUM** | 本数据中心多数派 | 强一致 + 不跨机房 | 多机房强一致业务 |
| **ALL** | 全部副本响应 | 最强一致；但**任一副本宕机就失败**（牺牲可用性） | 极少用，重要且容忍偶尔失败 |

**读写搭配的强弱一致**：读用 QUORUM + 写用 QUORUM，能保证读到最近一次写（因为读多数派和写多数派必有交集）；都用 ONE 则是最终一致；读 ONE + 写 ALL 也强一致但牺牲写可用性。这是 CAP 工程权衡的精髓。

## 五、典型场景与边界

Cassandra 的**甜蜜区**是「**写多读少、按主键查询、可容忍最终一致、需要跨机房高可用**」：

- **时间序列**：物联网传感器数据、应用日志、监控指标（如 Prometheus 长期存储、Netflix 度量）。写海量、按 `device_id + time` 查询。
- **用户活动流**：Twitter/Instagram 的 Feed、Netflix 的观看历史、Spotify 的播放记录。按 `user_id + time` 查最近 N 条。
- **推荐与个性化元数据**：用户画像、商品特征 KV——读多写少但按 key 取。
- **订单/交易历史**：按 `customer_id` 查所有订单（不强求跨用户事务）。

**不适合 Cassandra 的场景**：

- **金融强一致事务**（转账要 ACID）——用关系库。
- **复杂分析查询**（多表 JOIN、聚合）——用 ClickHouse、Spark。
- **按任意字段频繁随机查询**（没有明确的分区键模式）——用 MongoDB 或 Elasticsearch。
- **小数据量**（单机能扛）——用 MySQL/PostgreSQL，运维简单得多。

## 下一步

理解了 Cassandra 的去中心化拓扑、宽列模型与可调一致性后，下一步深入两个核心——[宽列模型与可调一致性](./guide-line/data-model-and-consistency)（分区键设计、复制因子、一致性级别在 CAP 上的精确含义）与[CQL 与大规模写入扩展](./guide-line/cql-and-scaling)（CQL 语法、LSM 写入路径、ScyllaDB 对比、Apple/Netflix 实践）。
