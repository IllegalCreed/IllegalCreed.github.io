---
layout: doc
outline: [2, 3]
---

# 参考：宽列模型、一致性级别与 CQL 速查

> 基于 Cassandra 5.x · 核于 2026-08

## 速查

- **定义**：分布式、去中心化、宽列 NoSQL 数据库，写入线性扩展、无单点高可用。
- **数据模型**：keyspace → table → partition（partition key 哈希定位）→ row（clustering key 排序）→ column。**同分区连续存储**，查询必须带分区键。
- **去中心化**：所有节点对等（无 Master），一致性哈希 + Gossip 协议自组织，加节点即线性扩容。
- **复制**：RF（默认 3），NetworkTopologyStrategy 按机房/rack 分散副本（生产标配）。
- **可调一致性**：ONE/LOCAL_ONE/QUORUM/LOCAL_QUORUM/ALL，每次读写独立指定。读+写都用 QUORUM → 强一致（`读CL+写CL > RF`）。
- **写入路径**：MemTable + CommitLog → SSTable → compaction（LSM 树，写永远顺序追加）。
- **CAP 定位**：偏 AP（高可用优先），可调一致性可在请求粒度逼近 CP。
- **CQL**：类 SQL，但不支持 JOIN、跨分区事务、不带分区键的查询。
- **ScyllaDB**：C++ 重写、shard-per-core、无 GC，吞吐数倍、延迟更稳，CQL 兼容可迁移。
- **典型场景**：时间序列、用户活动流、推荐元数据（写多读少 + 按主键查 + 可容忍最终一致）。

## 一、NoSQL 数据模型对比

| 维度 | Cassandra（宽列） | MongoDB（文档） | Redis（KV） | MySQL（关系） |
| --- | --- | --- | --- | --- |
| 数据单元 | 宽列行（partition） | 文档（BSON） | KV/Hash/List | 行（表） |
| Schema | 灵活（列稀疏） | 灵活（文档异构） | 无 | 严格 |
| 主键查询 | 极快（分区连续存储） | 快（索引） | 极快（内存） | 快（B+树索引） |
| 复杂查询 | 只能按主键 | 支持二级索引/聚合 | 只能按 key | 支持 JOIN/事务/子查询 |
| 横向扩展 | 原生线性（一致性哈希） | 分片（需配置） | 集群分片 | 分库分表（复杂） |
| 一致性 | 可调（最终一致为主） | 强一致（副本集） | 单线程强一致 | 强一致（ACID） |
| 持久化 | 磁盘（SSTable） | 磁盘（WiredTiger） | 内存为主（可持久化） | 磁盘（InnoDB） |
| 适用 | 海量写入 + 按主键 + 跨机房 | 文档型业务、灵活 schema | 缓存、计数器、排行榜 | 强一致事务 |

## 二、一致性级别矩阵（RF=3）

| 一致性级别 | 响应副本数 | 读写语义 | 容错（可宕机副本数） | 延迟 |
| --- | --- | --- | --- | --- |
| **ONE** | 1 | 最快，可能读到旧值 | 2 | 最低 |
| **LOCAL_ONE** | 本机房 1 | 同上，不跨机房 | 2 | 最低 |
| **QUORUM** | 2（多数派） | 强一致（配 QUORUM 写） | 1 | 中 |
| **LOCAL_QUORUM** | 本机房多数派 | 强一致，不跨机房 | 1（本机房） | 中 |
| **ALL** | 3 | 最强一致，任一宕机即失败 | 0 | 最高 |

**强一致判定**：`读CL + 写CL > RF`。RF=3：QUORUM(2)+QUORUM(2)=4>3 强一致；ONE(1)+ONE(1)=2<3 最终一致。

## 三、CQL 语法速查

```sql
-- Keyspace（命名空间 + 复制策略）
CREATE KEYSPACE my_app WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3, 'dc2': 2
};

-- 建表（分区键 + 聚类键 + 选项）
CREATE TABLE events (
    user_id     uuid,
    event_time  timestamp,
    event_type  text,
    payload     text,
    PRIMARY KEY ((user_id), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC)
  AND compaction = {'class': 'TimeWindowCompactionStrategy',
                    'compaction_window_unit': 'DAYS',
                    'compaction_window_size': '7'}
  AND gc_grace_seconds = 864000;  -- 默认 10 天

-- 写入（带 TTL 自动过期）
INSERT INTO events (user_id, event_time, event_type)
VALUES (?, ?, ?) USING TTL 2592000;

-- 查询（必须带分区键）
SELECT * FROM events WHERE user_id = ? AND event_time > ? LIMIT 100;

-- 轻量事务（Paxos，吞吐低，慎用）
INSERT INTO users (id, email) VALUES (?, ?) IF NOT EXISTS;

-- 分区内计数（非全表）
SELECT count(*) FROM events WHERE user_id = ?;
```

**CQL 不支持**：JOIN、子查询、跨分区事务、`ORDER BY` 任意列、`GROUP BY` 跨分区、外键约束。

## 四、写入路径组件

| 组件 | 作用 | 性能影响 |
| --- | --- | --- |
| **CommitLog** | 顺序追加日志，崩溃可恢复 | 增加写延迟（同步刷盘） |
| **MemTable** | 内存结构，最新写可见 | 满了 flush 成 SSTable |
| **SSTable** | 不可变磁盘文件 | 多了要合并，否则读慢 |
| **Bloom Filter** | 快速判断 SSTable 是否可能有 key | 减少无用磁盘读 |
| **Compaction** | 合并 SSTable、清墓碑 | 后台 IO，需调度 |
| **Row/Key Cache** | 行/键缓存 | 加速热点读 |

## 五、运维命令速查

```bash
# 集群状态
nodetool status                    # 节点在线/离线、负载、token
nodetool ring                      # token 环分布（看是否均匀）
nodetool describecluster           # 集群信息、schema 版本

# 修复（定期对比副本，建议每周）
nodetool repair -pr my_keyspace    # -pr 只修主范围，加速

# 清理（扩容后清旧副本）
nodetool cleanup my_keyspace

# compaction
nodetool compact my_keyspace my_table   # 手动全量
nodetool compactionstats                 # 查看 compaction 进度

# 监控
nodetool tpstats           # 线程池积压
nodetool tablestats        # 各表读写量、墓碑数、SSTable 数
nodetool netstats          # 网络流量、流式任务
```

## 六、易错点清单

- **「Cassandra 是 CP 系统」**：错。它默认偏 AP（高可用优先），通过可调一致性（QUORUM/ALL）能在请求粒度逼近 CP。说它是「CP 或 AP」都过于绝对——它是个**滑动天平**。
- **「CQL 等于 SQL，可以 JOIN」**：错。CQL 只借了语法，底层是宽列存储，**不支持 JOIN、跨分区事务、不带分区键的查询**。
- **「读 ONE + 写 ONE 是强一致」**：错。`读CL+写CL=2 < RF=3`，最终一致。强一致要 `读CL+写CL > RF`。
- **「ALL 是最安全的选择」**：错。ALL 任一副本宕机即失败，**牺牲可用性**。生产用 QUORUM/LOCAL_QUORUM。
- **「Cassandra 适合所有大数据场景」**：错。它适合「写多读少、按主键查、可容忍最终一致」。复杂分析（JOIN/聚合）用 ClickHouse/Spark，强一致事务用关系库。
- **「分区键随便选」**：错。分区键决定数据分布——低基数（如 country）导致热点与大分区；高基数（如 user_id）才能均匀分散。单分区建议小于 100MB、10 万行。
- **「删除立即释放空间」**：错。删除写墓碑，要等 compaction（且过 `gc_grace_seconds`）才物理清除。大量删除会拖慢读。
- **「ScyllaDB 完全替代 Cassandra」**：部分错。CQL/数据模型兼容，但运维工具、生态、社区不如 Cassandra 成熟；性能虽强但选型要权衡团队熟悉度。
- **「LWT 轻量事务性能与普通写一样」**：错。LWT 用 Paxos，吞吐低 4-30 倍，仅用于关键去重（IF NOT EXISTS），不能当通用事务用。
- **「跨数据中心必须用 ALL 保证一致」**：错。跨机房用 LOCAL_QUORUM 既强一致又不跨机房往返；ALL 在跨机房下任一机房故障即写失败。

## 七、进阶方向（链接其他叶）

- [关系型数据库](../)（MySQL/PostgreSQL）—— 强一致事务与 Cassandra 的边界
- [Elasticsearch](../elasticsearch/) —— 倒排索引与全文搜索，与 Cassandra 互补
- [ClickHouse / DuckDB](../)（分析型）—— 大规模分析场景的对比

## 权威链接

- [Apache Cassandra 官方文档](https://cassandra.apache.org/doc/latest/)
- [Cassandra Architecture - DataStax](https://docs.datastax.com/en/cassandra-oss/3.x/cassandra/architecture/archTOC.html)
- [ScyllaDB 官方文档](https://docs.scylladb.com/)
- [Cassandra Wikipedia](https://en.wikipedia.org/wiki/Apache_Cassandra)
- [Netflix 的 Cassandra 实践（技术博客）](https://netflixtechblog.com/)
- 本站幻灯片：<a href="/SlideStack/cassandra-slide/" target="_blank">Cassandra</a>
