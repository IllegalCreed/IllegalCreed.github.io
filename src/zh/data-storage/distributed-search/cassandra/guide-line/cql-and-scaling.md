---
layout: doc
outline: [2, 3]
---

# CQL 与大规模写入扩展：LSM、ScyllaDB 与工程实践

> 基于 Cassandra 5.x · 核于 2026-08

## 速查

- **CQL（Cassandra Query Language）**：类 SQL 的查询语言，`SELECT/INSERT/UPDATE/DELETE` 语法接近关系库——但底层是宽列存储，**不支持 JOIN、跨分区事务、复杂子查询**。CQL 的目标是降低学习门槛，而非复刻 SQL 的全部能力。
- **CQL 限制**：查询**必须带分区键**（否则禁用全表扫描）；`ORDER BY` 只能按聚类键（且方向固定建表时指定）；`IN` 查询分区键会扇出到多节点，慎用；聚合（`COUNT/SUM/AVG`）只在分区内有效，非全表。
- **写入路径（LSM 树）**：写 → **MemTable**（内存）+ **CommitLog**（顺序写日志，崩溃可恢复）→ MemTable 满 flush 成不可变 **SSTable**（Sorted String Table）落盘 → 后台 **compaction** 合并去墓碑。**写永远顺序追加，无随机 IO**，所以写极快。
- **读取路径**：先查 **MemTable**（最新数据），再查 **Bloom Filter**（快速判断 SSTable 是否可能有 key），命中则查 SSTable + **行缓存/键缓存**。读比写慢——要合并多个 SSTable + 跳墓碑。这是 LSM 的固有代价（用读放大换写快）。
- **Compaction 策略**：`STCS`（Size-Tiered，写多读少）、`LCS`（Leveled，读多写少）、`TWCS`（Time-Window，时间序列）。选错会导致 SSTable 堆积或写放大。
- **ScyllaDB 对比**：ScyllaDB 是 Cassandra 的**C++ 重写**（2014，原 KVM 作者团队），兼容 CQL 协议，但**用 shared-nothing + 每核分片（shard-per-core）+ 无锁线程模型**，单机吞吐是 Cassandra 的数倍、延迟更稳（P99 抖动小）。Cassandra 是 Java（JVM，受 GC 影响），ScyllaDB 是 C++（无 GC，延迟可预测）。两者 CQL/数据模型兼容，迁移成本低。
- **大规模写入实践**：**Apple**（数万节点，承载 Apple Music/iCloud 元数据）、**Netflix**（全球观看行为，亿级用户）、**Instagram**（Feed/通知）、**Discord**（万亿级消息）。共同特点：写多读少、按主键查询、跨机房多活。
- **运维三件套**：`nodetool repair`（定期对比修复副本漂移）、`nodetool cleanup`（扩容后清理冗余副本）、`nodetool compact`（手动触发 compaction）。配合 **hinted handoff** 与 **read repair** 保证最终一致。
- **轻量事务（LWT）**：`IF` 条件写用 **Paxos** 协议实现compare-and-set，能做「不存在才插入」（防重复）——但**吞吐低 4-30 倍**，仅用于关键去重，不要当通用事务用。

## 一、CQL 语法：类 SQL 但有边界

CQL 让熟悉 SQL 的开发者快速上手 Cassandra，但必须清楚它的**能力边界**：

```sql
-- 建表：分区键 user_id，聚类键 event_time
CREATE TABLE events (
    user_id     uuid,
    event_time  timestamp,
    event_type  text,
    payload     text,
    PRIMARY KEY ((user_id), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC)  -- 聚类键默认降序
  AND compaction = {'class': 'TimeWindowCompactionStrategy',
                    'compaction_window_unit': 'DAYS',
                    'compaction_window_size': '7'};

-- 写入（自动分布式）
INSERT INTO events (user_id, event_time, event_type, payload)
VALUES (uuid(), toTimestamp(now()), 'click', '{...}')
USING TTL 2592000;  -- 30 天后自动过期（避免手动删产生墓碑）

-- 查询：必须带分区键，可按聚类键范围
SELECT * FROM events
WHERE user_id = ?
  AND event_time > ? AND event_time < ?
LIMIT 100;

-- 轻量事务：不存在才插入（防重复，用 Paxos）
INSERT INTO users (id, email) VALUES (?, ?)
IF NOT EXISTS;
```

**CQL 的硬限制**：

- **必须带分区键**：`SELECT * FROM events` 不带 `WHERE user_id=?` 直接报错（或允许但全表扫描禁用）。这是「分布式存储 + 哈希分区」的必然——没有分区键不知道去哪个节点查。
- **不支持 JOIN**：要做用户 + 订单的关联，得在写时冗余（反范式）到一张表，或读两次应用层关联。
- **不支持跨分区事务**：只能保证单分区的原子性（单分区内的多行写在 Cassandra 里是原子的）。跨分区要 LWT 或放弃强一致。
- **`ORDER BY` 只能按聚类键**：且方向由建表的 `CLUSTERING ORDER BY` 决定，不能运行时反转。
- **`IN` 查询分区键慎用**：`WHERE user_id IN (a,b,c)` 会扇出到多节点，增加协调开销。

## 二、写入路径：为什么写这么快

Cassandra 的写入性能来自 **LSM 树（Log-Structured Merge-Tree）**——所有写都是**顺序追加**，没有随机更新：

```
客户端写 ──► 协调节点 ──► 写到 RF 个副本节点，每个副本：
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                                 ▼
          1. CommitLog（顺序追加日志）      2. MemTable（内存结构）
             —— 崩溃可恢复                     —— 后续读能看到
                                                  ▼
                              3. MemTable 满（约 1/4 of memtable）
                                  → flush 成不可变 SSTable 落盘
                                                  ▼
                              4. 后台 compaction 合并多个 SSTable
                                  —— 去除重复、物理删除墓碑
```

- **顺序写极快**：磁盘/SSD 的顺序写带宽远高于随机写（机械盘差 100 倍，SSD 也差数倍）。Cassandra 把所有写变成顺序追加 CommitLog + 写 MemTable，所以**写入吞吐极高**。
- **SSTable 不可变**：一旦 flush 就只读不写，这让并发读极简单（无锁）。更新同一 key 是写新版本的 SSTable，旧版本由 compaction 合并清除。
- **CommitLog 保证持久性**：MemTable 在内存，宕机会丢——所以每条写先落 CommitLog（顺序写盘，快），重启时重放 CommitLog 恢复 MemTable。可以选同步刷盘（durability）或异步（更快但可能丢最后几秒）。

## 三、读取路径：为什么读比写慢

读比写复杂——要在**多个 SSTable + MemTable**中找最新版本，并跳过墓碑：

```
读 key=k
  → 查 MemTable（内存，最新写）
  → 查 Row Cache（可选，热点行缓存）
  → 用 Bloom Filter 快速判断每个 SSTable「可能没有 k」则跳过
  → 在可能命中的 SSTable 查找（用 Key Cache + 索引）
  → 合并多个版本的值，取最新，跳过墓碑
  → 返回结果
  → 若多副本版本不一致，触发 read repair
```

- **读放大**：一次逻辑读可能要查 N 个 SSTable（取决于 compaction 状态）。SSTable 越多读越慢，所以 compaction 要及时跑。
- **墓碑代价**：被删的 key 留着墓碑，读时要扫描跳过——墓碑过多会让读变慢（tombstone over-read）。
- **优化手段**：行缓存（热点行）、键缓存（SSTable 索引）、Bloom Filter（快速排除）、合理的 compaction 策略。即便如此，**读仍比写慢一个数量级**——这是 LSM 的根本取舍（写优化存储引擎的共性）。

## 四、Compaction 策略选择

Compaction 决定 SSTable 如何合并，直接影响写放大、读放大、空间放大：

| 策略 | 特点 | 适用 |
| --- | --- | --- |
| **SizeTieredCompactionStrategy（STCS）** | 把大小相近的 SSTable 合并；写放大小，但小 SSTable 多时读慢 | **写多读少**（默认推荐起点） |
| **LeveledCompactionStrategy（LCS）** | 分层（L0→L1→...），每层有序；读快但写放大高 | **读多写少** |
| **TimeWindowCompactionStrategy（TWCS）** | 按时间窗口（如每天）合并；窗口内 STCS | **时间序列**（监控、日志） |

- **时间序列首选 TWCS**：传感器/日志数据天然按时间分区，旧数据不再更新，TWCS 把同一时间窗口合成一个大 SSTable，减少读放大与空间占用。窗口大小按查询模式定（如查最近 7 天，就用 `DAYS:7`）。
- **墓碑物理清除**：墓碑存活 `gc_grace_seconds`（默认 10 天）后 compaction 才物理删，防止跨副本复活旧值。大量删除场景要配合定期 `nodetool repair` + 调小 `gc_grace_seconds`（单机房可调小到 1 天）。

## 五、ScyllaDB：C++ 重写的高性能分支

ScyllaDB（2014，由原 KVM 作者 Avi Kivity 团队创立）是 Cassandra 的**兼容重写**——同样用 CQL 协议、同样的宽列模型、同样的 Gossip + 一致性哈希，但实现语言与并发模型不同：

| 维度 | Cassandra（Java/JVM） | ScyllaDB（C++） |
| --- | --- | --- |
| 实现语言 | Java（受 GC 影响） | C++（无 GC） |
| 线程模型 | JVM 线程，锁竞争 | **每核一个分片（shard-per-core）**，无锁消息传递 |
| 延迟稳定性 | GC 偶发停顿（P99 抖动） | 微秒级 P99，**延迟可预测** |
| 单机吞吐 | 基准 | 数倍于 Cassandra |
| 协议兼容 | 原生 | 兼容 CQL、Cassandra 驱动 |
| 适用 | 生态成熟、JVM 团队 | 极致性能、低延迟、云原生 |

- **shard-per-core**：ScyllaDB 把每个 CPU 核心当独立分片，数据按核哈希，处理全程**无锁**（Seastar 框架，future/promise 异步）。这让单机性能榨干，无需 GC。
- **迁移**：ScyllaDB 兼容 CQL，用同样的驱动，schema 可直接搬。但运维工具、生态系统不如 Cassandra 成熟——选型要权衡性能收益与团队熟悉度。

## 六、大规模写入实践：Apple、Netflix、Discord

- **Apple**：数万节点 Cassandra 集群，承载 Apple Music 曲目元数据、iCloud 设备状态、Apple News 等。跨多数据中心，写入 QPS 百万级。
- **Netflix**：用 Cassandra 存全球观众的观看历史（亿级用户、万亿级行）。按 `user_id` 分区，读「最近观看」极快。配合 EVCache（Redis）做热点缓存。
- **Discord**：万亿级消息用 Cassandra（早期）+ 后期迁移 ScyllaDB。按 `channel_id` 分区，单分区按时间聚类——查频道历史就是按主键范围查。
- **共同经验**：①**分区键设计决定成败**（Discord 用 channel_id 而非 server_id，避免单服务器消息分区过大）；②**TTL 自动过期**避免墓碑；③**多数据中心 + LOCAL_QUORUM** 实现多活；④**监控墓碑数、分区大小、compaction 队列**是运维核心。

## 七、运维要点

```bash
# 定期修复副本漂移（建议每周，避免墓碑过期前数据不一致）
nodetool repair -pr my_keyspace

# 扩容后清理旧副本（新节点接管部分范围后，旧节点的冗余副本要清）
nodetool cleanup my_keyspace

# 查看集群状态、数据分布、负载
nodetool status
nodetool ring          # 看 token 环分布
nodetool tpstats       # 线程池与积压
nodetool tablestats    # 各表的读写量、墓碑数、SSTable 数
```

**关键监控指标**：写入延迟、读延迟（P99）、墓碑扫描数（tombstones_scanned）、compaction 积压、协调错误（协调节点宕机导致的失败）、副本不一致（pending repair）。

## 下一步

CQL 与写入扩展讲完后，建议回到[参考](../reference)速查宽列 vs 文档 vs KV 对比、一致性级别矩阵、CQL 速查表与易错点清单。
