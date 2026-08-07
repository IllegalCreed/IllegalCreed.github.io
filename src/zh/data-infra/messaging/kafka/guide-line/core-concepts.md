---
layout: doc
outline: [2, 3]
---

# 核心概念：Topic/Partition/Offset 与消费者组

> 基于 Kafka 3.9（KRaft 模式） · 核于 2026-08

## 速查

- **Topic（主题）**：逻辑消息流，类似数据库的表。生产者发往 Topic，消费者订阅 Topic。物理上拆为多个 Partition 分布在 broker 上。
- **Partition（分区）**：Topic 的物理分片，是**并行与有序的基本单位**。单分区内消息严格有序（按 offset），跨分区不保证顺序。分区数=消费并发上限，**只能加不能减**。
- **Offset（位移）**：分区内消息的单调递增整数（从 0 开始）。消费者用它标记「读到哪」，提交到 `__consumer_offsets` 内部 Topic（key=group+topic+partition）实现故障恢复。
- **副本（Replica）**：每个分区有 N 个副本（`replication.factor`），其中一个是 **Leader**（处理所有读写），其余是 **Follower**（从 Leader 拉取同步）。
- **ISR（In-Sync Replicas）**：与 Leader 同步进度差距在 `replica.lag.time.max.ms` 内的副本集合。**只有 ISR 内的副本才有资格当选 Leader**。
- **生产者 ack 三档**：`acks=0`（不等确认，可能丢）/ `acks=1`（Leader 写入即返回，Leader 挂可能丢）/ **`acks=all`（所有 ISR 副本确认才返回，最安全）**。
- **幂等生产者**：`enable.idempotence=true`，基于 PID + seq number 自动去重，防止网络重试导致重复。
- **事务**：`transactional.id` 让跨分区写入原子化（精确一次），配合消费者 `isolation.level=read_committed` 只读已提交事务。
- **消费者组（Consumer Group）**：组内瓜分分区（一分区一组内一消费者），组间独立消费（发布订阅）。组内成员变动触发 **rebalance**。
- **offset 提交**：自动（每 5s，可能丢消息）vs 手动（处理完再提交，至少一次）。**精确一次**需事务 + read-process-write。
- **可靠性配方**：`acks=all` + `min.insync.replicas≥2` + `replication.factor=3` + `unclean.leader.election.enable=false` —— broker 故障不丢已 ack 消息。
- **消息保留**：按 `retention.ms`（默认 7 天）/ `retention.bytes` 删除；或 `cleanup.policy=compact`（按 key 留最新值，做状态快照）。

## 一、Topic 与 Partition：并行与有序的取舍

Topic 是逻辑流，Partition 是物理分片。设计 Topic 时最关键的决策是**分区数**：

```
分区数少（如 1）：                分区数多（如 24）：
- 全局有序（同 Topic 严格有序）     - 高并行（24 个消费者并发）
- 吞吐低（单 leader 写入瓶颈）      - 跨分区无序
- 消费并发 = 1                    - 吞吐高
```

- **分区数怎么定**：预估「目标吞吐 / 单分区吞吐」取上界，再加冗余。单分区生产约 10MB/s，要 100MB/s 至少 10 个分区。常见取 6/12/24/48。
- **只能加不能减**：减少分区会让 offset 映射混乱（数据已分布，重映射不可能），故 Kafka 禁止减分区。要「减」只能新建 Topic 迁移。
- **key 与分区亲和**：生产者带 key 时，`hash(key) % partition_count` 决定分区——**同 key 永远进同分区**，保证同实体（如同 user_id）的事件有序。**改分区数会让 key 重新分布**，破坏已有亲和关系，故分区数要一次定够。

## 二、Offset：消费者的「读到哪」

Offset 是消费者进度管理的核心：

```
分区日志：     [0][1][2][3][4][5][6][7][8][9]
                              ↑
                     消费者已提交 committed_offset=5
                     下次从 5 开始拉取（log-start-offset=0, log-end-offset=10）
```

- **offset 存储**：消费者组的 offset 不存 broker 内存，而是写进内部 Topic `__consumer_offsets`（key=`group+topic+partition`，value=offset）——这让它**天然支持故障恢复与扩缩容**，broker 重启不丢进度。
- **提交语义**：
  - **自动提交**（`enable.auto.commit=true`，`auto.commit.interval.ms=5000`）：每 5 秒自动提交当前拉到的最大 offset。**风险**：拉到消息但还没处理完，自动提交了 offset，崩溃后这部分「拉了未处理」的消息会丢。
  - **手动提交**（`enable.auto.commit=false`）：业务处理完再 `commitSync()`（同步阻塞，可靠）或 `commitAsync()`（异步，快但可能失败）。保证**至少一次**。
- **重复与丢失**：手动提交 + 至少一次意味着**崩溃重试会重复消费**，故消费端必须**幂等**（数据库唯一键、Redis SETNX、状态机）。
- **精确一次（EOS）**：生产者事务 + 消费者「read-process-write」（在 Kafka 事务内消费并产出下游 Topic）才能达成。跨外部系统（如写 MySQL）只能靠业务幂等。

## 三、生产者：ack、幂等与事务

生产者写消息的可靠性由 `acks` 控制：

| acks | 行为 | 丢消息风险 | 性能 | 适用 |
| --- | --- | --- | --- | --- |
| `0` | 发出去就认为成功，不等任何确认 | 高（网络丢/ broker 挂） | 最高 | 日志采集容忍丢 |
| `1` | Leader 写入本地即返回 | 中（Leader 挂且未同步） | 高 | 一般业务 |
| **`all`/`-1`** | **所有 ISR 副本都确认才返回** | 低（需配合 min.insync.replicas） | 中 | **金融/订单** |

- **幂等生产者**（`enable.idempotence=true`，0.11+）：开启后 Kafka 给生产者分配 PID，每条消息带 seq number，broker 检测重复 seq 自动去重——**网络重试不会产生重复消息**（单分区内）。**生产环境默认开**。
- **事务**（`transactional.id`）：跨 Topic/Partition 的写入原子化——`initTransactions` → `beginTransaction` → 发多条 → `commitTransaction`。配合下游消费者 `isolation.level=read_committed`（只读已提交事务消息），实现「**精确一次**」（exactly-once semantic，EOS）。
- **压缩**：生产者批量压缩（`compression.type=snappy|lz4|zstd|gzip`），broker 直接存压缩后的数据，消费者解压——大幅降网络与存储。**lz4** 性价比最高，**zstd** 压缩率与速度俱佳。

## 四、消费者组与 Rebalance

消费者组实现「负载均衡 + 多订阅」：

```
消费者组 order-processors（3 个成员）订阅 orders（6 分区）：
  C1 ← P0, P1      ← rebalance 后可能变为 C1 ← P0,P1,P2
  C2 ← P2, P3
  C3 ← P4, P5

成员变动（C2 挂）→ 触发 rebalance → 重新分配：C1 ← P0,P1,P2,P3 / C3 ← P4,P5
```

- **组协调器（Group Coordinator）**：broker 上的一个组件，管理组内成员与分区分配。成员通过**心跳**保活，超时（`session.timeout.ms`）被认为死亡，触发 rebalance。
- **分配策略**：Range（按分区范围均分）/ RoundRobin（轮流）/ **StickyAssignor**（尽量保持原分配，减少变动）/ **CooperativeStickyAssignor**（增量重分配，KIP-429，**推荐**）。
- **Rebalance 代价**：Eager 策略下 rebalance 期间**所有成员停止消费**（stop-the-world），大集群分钟级。**Cooperative Rebalance** 改为增量——只 revoke 涉及的分区，其他分区继续消费，把 stop-the-world 降到秒级。
- **Static Membership**（`group.instance.id`）：成员身份固定，broker 重启短时不触发 rebalance——适合「消费者启动慢」（如加载大缓存）的场景。

## 五、可靠性配方：不丢消息

生产级 Kafka 不丢消息的标准配置（**金融级**都遵循）：

```yaml
# broker 端
default.replication.factor: 3              # 每分区 3 副本
min.insync.replicas: 2                      # 至少 2 个副本同步成功才算写入
unclean.leader.election.enable: false       # 禁止非 ISR 副本当 Leader（防丢已 ack 数据）

# Topic 端
replication.factor: 3                       # 同上
min.insync.replicas: 2

# 生产者端
acks: all                                   # 等所有 ISR 确认
enable.idempotence: true                    # 幂等防重试重复
retries: 2147483647                         # 无限重试（幂等保证不重复）
max.in.flight.requests.per.connection: 5    # 幂等开启时可 >1

# 消费者端
enable.auto.commit: false                   # 手动提交
```

- **`unclean.leader.election.enable=false` 是关键**：默认 false（2.0+）。如果允许 true，当 ISR 全挂、选一个落后副本当 Leader 时，会**丢掉已 ack 的消息**（落后副本没有这些数据）。
- **`min.insync.replicas` 与 `acks=all` 配合**：`acks=all` 指「所有 ISR 副本确认」。如果 ISR 缩到 1（其他副本掉队），那 `all` 实际等于 `acks=1`——`min.insync.replicas=2` 保证 ISR 不足时**拒绝写入**（抛 NotEnoughReplicasException），宁可不可用也不丢数据。

## 下一步

掌握了核心模型与可靠性后，下一步进入 [Kafka Streams 与 KRaft](./streams-and-kraft)——在 Kafka 上做流处理，以及从 ZooKeeper 迁移到 KRaft 元数据自管理、与 Pulsar 的存算分离对比。
