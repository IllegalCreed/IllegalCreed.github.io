---
layout: doc
outline: [2, 3]
---

# 宽列模型与可调一致性：分区键、复制因子与 CAP

> 基于 Cassandra 5.x · 核于 2026-08

## 速查

- **四层数据模型**：`keyspace`（命名空间，含复制策略）→ `table`（表）→ `partition`（分区，由 partition key 哈希定位）→ `row`（行，由 clustering key 排序）。**同一分区的行存在同一节点，连续存储**——这是「按主键范围查询快」的物理基础。
- **主键两段式**：`PRIMARY KEY ((partition_key), clustering_key1, clustering_key2)`。**双括号内**是分区键（决定落到哪个节点）；**括号外**是聚类键（决定分区内行的排序）。分区键哈希定位节点，聚类键定义排序与范围查询能力。
- **分区键设计是命脉**：数据按分区键哈希**全局分散**到节点。好的分区键让负载均匀（避免热点），且让「一起查的数据」落到同一分区（避免跨节点）。**同一用户的事件用 `user_id` 做分区键**，则该用户所有事件同分区，按时间查极快。
- **分区大小红线**：单分区建议**小于 100MB**、**少于 10 万行**。超大分区（如用 `country` 做分区键，单国数亿行）会导致热点与 compaction 灾难——这是 Cassandra 最常见的设计坑。
- **复制因子（RF）**：每条数据存几份。RF=3 是业界默认。配合 `SimpleStrategy`（单数据中心）或 `NetworkTopologyStrategy`（多数据中心，按机房分副本，**生产推荐**）。
- **可调一致性级别（CL）**：每次读写独立指定——`ONE`（任一副本）/ `LOCAL_ONE`（本机房任一）/ `QUORUM`（多数派 `floor(RF/2)+1`）/ `LOCAL_QUORUM`（本机房多数派）/ `ALL`（全部）。**读写都用 QUORUM → 强一致**（读写多数派必有交集）；都用 ONE → 最终一致最快。
- **CAP 定位**：Cassandra 默认偏 **AP**（高可用 + 分区容错），但通过**可调一致性**能在请求粒度上接近 CP（QUORUM/ALL）。分区（P）是必然选的，C 与 A 在天平两端可滑动——这是它与传统 CP 库（如 HBase）的根本区别。
- **墓碑（tombstone）**：Cassandra 删除不是真删，而是写一个「墓碑」标记。读时要跳过墓碑，**墓碑过多会拖慢读**；compaction 才物理清除墓碑。这是 LSM 存储的代价——大量删除的场景要慎用或定期修整。
- **读修复（read repair）**：读时发现副本间数据不一致，后台异步把最新版本同步给旧副本——最终一致的自愈机制。

## 一、四层数据模型详解

Cassandra 的数据组织是**层层嵌套**的，理解每一层的物理含义才能设计好 schema：

```
Cluster（集群，多个数据中心 DC）
└─ Keyspace（命名空间，类似 database）
    │  含复制策略：SimpleStrategy / NetworkTopologyStrategy
    │  含复制因子：RF=3
    └─ Table（表，定义列与主键）
        │  CREATE TABLE events (uid uuid, ts timestamp, ..., PRIMARY KEY((uid), ts))
        └─ Partition（分区，由 uid 哈希定位到某节点）
            │  同一分区的行物理连续存储（SSTable）
            └─ Row（行，由 ts 聚类排序）
                └─ Column（列，稀疏，无值不占空间）
```

**为什么这样设计**：关系库的「表」是逻辑概念，物理上同一张表的行可能散在磁盘各处。Cassandra 的「分区」是**物理概念**——同一分区的行**连续存储在一个节点上**。这让「查某个用户的全部事件」只需访问一个节点、连续 IO，极快。代价是：**查询必须带分区键**（否则要扫描所有节点，即全表扫描，生产禁用）。

### 主键的两种角色

```sql
-- 例 1：单列分区键 + 单列聚类键
CREATE TABLE user_events (
    user_id     uuid,
    event_time  timestamp,
    event_type  text,
    payload     text,
    PRIMARY KEY ((user_id), event_time)   -- user_id 分区，event_time 排序
);
-- 例 2：复合分区键（两个列共同决定分区）+ 复合聚类键
CREATE TABLE group_messages (
    group_id    uuid,
    channel     text,
    msg_time    timestamp,
    seq         bigint,
    sender      uuid,
    PRIMARY KEY ((group_id, channel), msg_time, seq)
);
```

- **分区键**（双括号内）：经 Murmur3 哈希决定落在哪个节点。`group_id + channel` 共同分区，让「某群某频道的消息」聚在一起。
- **聚类键**（括号外）：决定分区内行的排序。`msg_time, seq` 让消息按时间升序、同时间按 seq 升序——支持 `WHERE msg_time > ? AND msg_time < ?` 范围查询。

### 分区键设计的两条铁律

1. **基数要够高**（避免热点）：用 `user_id`（百万级）而非 `country`（200 个）。`country` 做分区键会让「中国」这一个分区承载数亿行，导致该节点热点。
2. **一起查的数据要同分区**：想查「某用户最近 100 条事件」，就把 `user_id` 做分区键。如果用 `event_id` 做分区键，查某用户事件就要扫描全表。

## 二、复制因子与复制策略

```sql
-- 创建 keyspace 时指定复制
CREATE KEYSPACE my_app WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3,    -- 数据中心 dc1 存 3 副本
  'dc2': 2     -- 数据中心 dc2 存 2 副本
};
```

- **复制因子（RF）**：每个数据中心的副本数。`dc1: 3` 表示在 dc1 内每条数据存 3 份（落在 3 个不同节点）。业界默认 RF=3，能容忍 1 个节点宕机且仍满足 QUORUM。
- **SimpleStrategy**：把副本顺序放在环上的后续节点，不区分机房——**只适合单数据中心开发**，生产禁用（跨机房复制不可控）。
- **NetworkTopologyStrategy（NTS）**：按数据中心独立配置副本数，且**把同一分区的副本尽量分散到不同机架（rack）**——避免整个机架断电丢全部副本。**生产标配**。
- **RF 与一致性的关系**：RF=3 时，QUORUM=2（容忍 1 节点宕机）、ALL=3（零容忍）。RF=5 时 QUORUM=3（容忍 2 节点宕机）。RF 越高可用性越好但存储成本线性上升。

## 三、可调一致性：CAP 的工程化

CAP 定理说：分布式系统在 C（一致性）、A（可用性）、P（分区容错）中**只能选两个**。由于网络分区（P）无法避免，实际是在 C 与 A 之间权衡。Cassandra 的做法是**不固定选 C 或 A，而是每次请求滑动**：

```
                  写可用性 ←────────────────────→ 写一致性
   ONE/LOCAL_ONE     ·    QUORUM/LOCAL_QUORUM     ·     ALL
   （最快最可用，         （多数派，平衡）          （全部副本，最强一致
    可能读到旧值）                                    但任一宕机即失败）
```

### 读写的强弱一致组合（RF=3）

| 读 \ 写 | ONE | QUORUM | ALL |
| --- | --- | --- | --- |
| **ONE** | 最终一致 | 最终一致（读可能落后） | 强一致（写已到全部，读任一都是最新） |
| **QUORUM** | 最终一致 | **强一致**（读写多数派必有交集） | 强一致 |
| **ALL** | 强一致 | 强一致 | 强一致（最严，零容错） |

- **强一致公式**：`读 CL + 写 CL > RF` 则强一致。RF=3 时读 QUORUM(2) + 写 QUORUM(2) = 4 > 3，强一致；读 ONE(1) + 写 ONE(1) = 2 < 3，最终一致。
- **典型搭配**：业务默认 `读 LOCAL_QUORUM + 写 LOCAL_QUORUM`（强一致 + 不跨机房）；日志监控 `读 ONE + 写 ONE`（吞吐优先）；

### LOCAL_* 系列的多数据中心价值

跨机房读写延迟高（同区毫秒级、跨区几十毫秒、跨洲上百毫秒）。`LOCAL_ONE`/`LOCAL_QUORUM` 只等**本数据中心**的副本，避免跨机房往返——既快又容忍其他机房网络分区。这是 `NetworkTopologyStrategy` 配合 `LOCAL_*` 实现多活（multi-active）的基础。

## 四、墓碑与读修复：最终一致的自愈

Cassandra 用**最终一致**换取可用性，但如何保证副本最终趋同？两个机制：

- **墓碑（tombstone）**：删除不是物理擦除（SSTable 不可变），而是写一条「此数据已删」的墓碑。读时跳过被标记的版本。后台 **compaction** 合并 SSTable 时才真正物理删除（墓碑存活 `gc_grace_seconds`，默认 10 天，防止跨副本复活旧值）。
  - **坑**：频繁删除会产生大量墓碑，读时要扫描跳过，拖慢查询（tombstone over-read）。监控 `tombstones_scanned` 超过 `tombstone_warn_threshold`（默认 1000）要警惕。
- **读修复（read repair）**：读多个副本发现版本不一致时，协调者后台异步把最新版本同步给旧副本。这是「读触发修复」的自愈。另有 `nodetool repair` 主动全量对比修复（建议定期跑，防止墓碑过期前副本间漂移）。
- **提示（hinted handoff）**：写时某副本宕机，协调者把该写「暂存」为 hint，副本恢复后回放——保证短暂宕机不丢写。

## 五、设计反模式与最佳实践

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| 用低基数列做分区键（如 country） | 单分区过大 → 热点 + compaction 灾难 | 用高基数列（user_id），单分区小于 100MB |
| 查询不带分区键 | 全表扫描 → 超时禁用 | 按查询反推分区键设计 |
| 无限增长的单分区（如按月分区但跨月查） | 单分区膨胀 | 时间桶分区（`user_id + bucket`） |
| 大量删除（如清空表） | 墓碑堆积 → 读变慢 | 用 TTL 自动过期，或按时间分区整段丢弃 |
| 用 ALL 做生产一致性 | 任一副本宕机即写失败 | 用 QUORUM/LOCAL_QUORUM |
| 把 Cassandra 当关系库用（JOIN/事务） | 不支持，强行模拟极慢 | 接受反范式，写时冗余、读时按主键 |

## 交互演示

本叶无专门可视化。建议结合[CQL 与大规模写入扩展](./cql-and-scaling)理解 LSM 写入路径与 compaction 如何支撑海量写入。

## 下一步

宽列模型与一致性讲完后，下一步深入[CQL 与大规模写入扩展](./cql-and-scaling)——CQL 语法、LSM 写入路径（MemTable/CommitLog/SSTable）、ScyllaDB 的 C++ 重写对比、Apple/Netflix 的大规模实践。
