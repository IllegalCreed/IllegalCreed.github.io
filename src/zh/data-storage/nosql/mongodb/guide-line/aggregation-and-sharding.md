---
layout: doc
outline: [2, 3]
---

# 聚合管道、副本集与分片

> 基于 MongoDB 7.x/8.x · 核于 2026-08

## 速查

- **聚合管道**：`db.coll.aggregate([{阶段1}, {阶段2}])`，多个 stage 串联，每个处理输入文档输出给下一个，是 MongoDB 的「SQL GROUP BY/JOIN/子查询」等价物。
- **核心阶段**：`$match`（过滤，WHERE，尽早前置用索引）/ `$group`（分组聚合，GROUP BY）/ `$project`（投影，SELECT）/ `$sort`（排序）/ `$lookup`（左外连接，LEFT JOIN）/ `$unwind`（展开数组）/ `$limit`/`$skip`/`$count`/`$facet`（多分支并行）。
- **`$match` 尽早放前面**：减少后续处理量，且能利用索引（只有 `$match` 在管道最前面才走索引）。
- **`$lookup`（左外连接）**：`{$lookup: {from:"users", localField:"userId", foreignField:"_id", as:"user"}}`。性能不如关系库 JOIN，能嵌入就别 lookup。
- **`$unwind`**：把数组每个元素拆成一条文档，常配合 `$group` 做数组内聚合。注意空数组会丢失文档（要 `preserveNullAndEmptyArrays`）。
- **副本集（Replica Set）**：一主（primary）多从（secondary）。写进 primary，记 oplog，secondary 异步复制 oplog。primary 挂，secondary 们基于 Raft 变体选举新 primary（少数服从多数）。提供高可用 + 读分流 + 数据冗余。最少 3 个投票成员（奇数，防脑裂）。
- **读偏好（ReadPreference）**：`primary`（默认，强一致读主）/ `primaryPreferred`（主优先，挂了读从）/ `secondary`（只读从）/ `secondaryPreferred`（从优先）/ `nearest`（延迟最低）。读从会有**复制延迟**（最终一致）。
- **oplog**：primary 的操作日志（capped collection，固定大小循环覆盖），secondary 持续拉取应用。也是**变更流（Change Stream）**的数据源。
- **分片（Sharding）**：按 shard key 把数据分散到多个 shard（每个 shard 是副本集）。架构：应用 → mongos（路由）→ config server（元数据）+ shards。横向扩展到 PB。shard key 难改（6.0 起 reshardCollection 支持但开销大）。
- **shard key 选择三原则**：①**高基数**（取值多，能均匀分散）；②**低频率**（每个值出现的文档数差不多，防热点）；③**非单调递增**（自增 ID/时间戳会导致所有写集中到最后一个 shard 形成热点，除非用哈希分片）。还要考虑查询模式（常用查询要带 shard key 才能路由到单 shard，否则广播所有 shard）。
- **范围分片 vs 哨希分片**：范围分片按 shard key 范围划分（利于范围查询，但单调 key 易热点）；哈希分片对 shard key 取哈希分散（均匀无热点，但范围查询要广播）。
- **Atlas**：官方云托管 DBaaS，多云（AWS/GCP/Azure）、免运维、自动备份扩缩容、内置 Atlas Search（Lucene 全文）/ Vector Search（向量）/ Device Sync。
- **变更流（Change Stream）**：`db.coll.watch([{$match:{...}}])` 实时订阅文档变更（insert/update/delete/replace），基于 oplog。用于同步 ES/缓存、触发业务事件、审计。
- **事务**：4.0 起副本集内多文档事务；4.2 起分片集群多文档事务。开销大，强一致金融场景慎用。

## 一、聚合管道阶段详解

聚合管道是 MongoDB 表达复杂查询与数据分析的核心。把多个 stage 串联，文档流经每个 stage 被变换：

```javascript
// 示例：统计每个用户已支付订单总金额 Top 5，并关联用户名
db.orders.aggregate([
  { $match: { status: "paid" } },                              // 1. 过滤（尽早前置用索引）
  { $group: {                                                  // 2. 分组聚合
      _id: "$userId",
      total: { $sum: "$total" },
      count: { $sum: 1 }
  }},
  { $sort: { total: -1 } },                                    // 3. 排序
  { $limit: 5 },                                               // 4. 限制
  { $lookup: {                                                 // 5. 左外连接（取用户名）
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
  }},
  { $unwind: "$user" },                                        // 6. 展开 user 数组（$lookup 返回数组）
  { $project: { userId: "$_id", name: "$user.name",            // 7. 投影
                total: 1, count: 1, _id: 0 } }
])
```

### 关键阶段

- **`$match`**：过滤，对应 SQL WHERE。**必须放管道最前面**——只有第一个 `$match` 能利用索引（让查询先用索引缩小结果集，后续阶段处理量骤减）。
- **`$group`**：分组聚合，对应 GROUP BY。`_id` 是分组键（`$userId` 表示按 userId 字段分组），其余字段用聚合操作符：`$sum`（求和）、`$avg`（均值）、`$max`/`$min`、`$push`（收集成数组）、`$addToSet`（去重收集）、`$first`/`$last`（配合 `$sort` 取首尾）。
- **`$lookup`**：左外连接，对应 LEFT JOIN。把另一个集合的文档按字段匹配拼进来，结果是一个数组（即使只匹配一个）。性能不如关系库的 JOIN（MongoDB 的 `$lookup` 是嵌套循环实现），**能嵌入就别 lookup**。
- **`$unwind`**：展开数组。`{$unwind: "$items"}` 把 `{items:[a,b,c]}` 拆成三条文档（item 分别为 a/b/c）。常配合 `$group` 做数组内聚合（如统计每个商品的销量）。注意空数组会让文档丢失，用 `preserveNullAndEmptyArrays: true` 保留。
- **`$project`**：投影，控制输出字段（`1` 包含、`0` 排除），也支持重命名与表达式（`{$project: {fullName: {$concat: ["$first"," ","$last"]}}}`）。
- **`$sort`/`$limit`/`$skip`/`$count`**：排序、限制、跳过、计数，对应 ORDER BY/LIMIT/OFFSET/COUNT。
- **`$facet`**：在一个阶段内并行执行多个子管道，常用于一次查询返回多个聚合结果（如分页数据 + 总数 + 分面统计）。

## 二、副本集：高可用与读分流

副本集是一主多从的架构，保证数据不丢与服务不中断：

```
      客户端（写）              客户端（读，可分流）
          │                        │
          ▼                        ▼
      ┌──────────┐  oplog 复制  ┌──────────┐  oplog 复制  ┌──────────┐
      │ Primary  │ ───────────▶│Secondary1│ ◀─────────── │Secondary2│
      │ （主）   │             │  （从）  │              │  （从）  │
      └──────────┘             └──────────┘              └──────────┘
          │  故障时由 Secondary 们选举新 Primary（Raft 变体）
          └────────────────────────────────────┘
```

- **oplog（operation log）**：primary 把每个写操作（insert/update/delete）记入 oplog（一个 capped collection，固定大小循环覆盖）。secondary 持续拉取 oplog 并按顺序应用，保持与 primary 一致。oplog 也是**变更流（Change Stream）**的数据源。
- **异步复制的代价**：secondary 复制是异步的，primary 写完立即返回，secondary 可能有毫秒到秒级延迟。所以读 secondary 是**最终一致**（不是强一致）。
- **选举（基于 Raft 变体）**：primary 挂时，有投票权的 secondary 们发起选举，候选者拉票，**少数服从多数**（majority）选出新 primary。这就是为什么副本集**至少 3 个投票成员**（奇数，防脑裂——两个票数相同的候选者各持一半选票）。常见部署：3 节点（1 主 2 从）或 5 节点（1 主 2 从 2 仲裁 arbiter）。
- **读偏好（ReadPreference）**：决定读走 primary 还是 secondary：
  - `primary`（默认）：读主，强一致。
  - `primaryPreferred`：主优先，主挂了读从。
  - `secondary`：只读从（承担读负载）。
  - `secondaryPreferred`：从优先（读多写少分流）。
  - `nearest`：延迟最低的节点。
  - 读从要接受**最终一致**（secondary 复制延迟）。

## 三、分片：横向扩展到 PB

当数据量超单机内存或磁盘，或写吞吐超单 primary 上限，用分片横向扩展：

```
      应用
       │
       ▼
   ┌────────┐
   │ mongos │  （路由，无状态，可多实例负载均衡）
   └───┬────┘
       │ 查 config server 得知 shard key 范围 → 哪个 shard
   ┌───┴────────────────┬──────────────────┐
   ▼                    ▼                  ▼
┌──────┐            ┌──────┐          ┌──────┐
│Shard1│            │Shard2│          │Shard3│   ← 每个 shard 是一个副本集
│(副本集)│          │(副本集)│        │(副本集)│
└──────┘            └──────┘          └──────┘
```

- **shard key**：分片键，决定文档落到哪个 shard。文档的 shard key 经哈希或范围映射到 chunk，chunk 分配到 shard。
- **mongos**：路由进程，无状态，从 **config server** 读取元数据（哪些 chunk 在哪个 shard），把请求路由到对应 shard。客户端连 mongos（不直连 shard）。
- **config server**：存集群元数据（shard 列表、chunk 分布、shard key 范围）。生产 3 节点副本集部署。

### shard key 选择（最关键的决策）

shard key 一旦定下来**很难改**（6.0 起 `reshardCollection` 支持改但开销极大），选错会导致数据倾斜或性能崩。三原则：

1. **高基数（cardinality）**：shard key 取值要足够多，能均匀分散。用 `userId`（百万取值）好，用 `status`（只有 paid/unpaid 几个值）糟——几个值没法分散到多 shard。
2. **低频率（frequency）**：每个取值出现的文档数要均匀，防止某个值对应巨量文档集中在一个 shard（热点）。如 `userId` 每个用户的订单数差不多好，用 `isVip`（true/false）糟。
3. **非单调递增（avoid monotonic）**：自增 ID、时间戳这类单调递增的 key，所有新写都集中到最后一个 shard（因为新值总是最大），形成**写热点**。除非用**哈希分片**（对单调 key 取哈希打散）。

还要考虑**查询模式**：常用查询要带 shard key 才能精准路由到单 shard（targeted query），否则要广播所有 shard（scatter-gather，慢）。

### 范围分片 vs 哈希分片

- **范围分片**：按 shard key 的值范围划分 chunk（如 userId 0-1000 在 shard1，1001-2000 在 shard2）。利于范围查询（`userId > 500` 可路由到对应 shard），但单调递增 key 会热点。
- **哈希分片**：对 shard key 取哈希再按哈希范围划分（`{userId: "hashed"}`）。均匀分散无热点（即使单调 key），但范围查询要广播（哈希打散了顺序）。

## 四、Atlas 与变更流

- **MongoDB Atlas**：官方云托管（DBaaS）。优势：①免运维（自动备份、扩缩容、监控告警、安全加固、版本升级）；②多云部署（AWS/GCP/Azure，可跨云容灾）；③内置 Atlas Search（基于 Lucene 的全文搜索，支持高亮、纠错、同义词，比内置 text 索引强大）；④Atlas Vector Search（向量搜索，AI/RAG 场景）；⑤Atlas Device Sync（移动端离线优先同步）。适合不想自建运维 MongoDB 的团队。
- **变更流（Change Stream）**：应用用 `db.coll.watch([{$match: {operationType: "update"}}])` 实时订阅集合的变更事件。基于 oplog 实现，副本集或分片集群都支持。常见用途：①数据变更同步到 Elasticsearch/Redis（CDC）；②触发业务事件（订单支付后发通知、库存扣减）；③审计日志。相比数据库触发器（在数据库内执行），变更流在应用侧消费，更灵活、不拖累数据库性能。

## 五、事务（4.0+）

- **4.0 起副本集内多文档事务**：一个事务可跨多个 collection/文档，ACID 保证（基于两阶段提交）。
- **4.2 起分片集群事务**：跨 shard 事务（基于两阶段提交，开销更大）。
- **代价**：分布式事务有协调开销（prepare/commit 多轮网络往返），吞吐远低于单文档写。MongoDB 的设计哲学仍是「**优先用文档嵌入让一个文档原子写，避免多文档事务**」。强一致高频金融场景仍推荐关系库。

## 下一步

掌握了文档模型、索引、聚合、副本集、分片、Atlas 与变更流后，下一步看[参考](../reference)——命令速查、Schema 设计决策表、索引类型对比、聚合阶段速查、副本集/分片配置要点、易错点清单，作为日常查阅与面试复习的速查手册。
