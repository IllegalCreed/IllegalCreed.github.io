---
layout: doc
outline: [2, 3]
---

# 入门：文档模型、索引与聚合

> 基于 MongoDB 7.x/8.x · 核于 2026-08

## 速查

- **定义**：MongoDB 是**面向文档的 NoSQL 数据库**，数据存成 **BSON（Binary JSON）文档**。文档 = 类 JSON 对象（嵌套对象 + 数组），同一集合（collection，对应表）的文档**字段可不同**（动态 schema）。2009 年由 MongoDB Inc.（原 10gen）开源。
- **BSON**：二进制编码的 JSON 超集——在 JSON 基础上加类型（Date/ObjectId/Binary/Decimal128/RegExp），解析快、支持更多类型，但**每文档重复存字段名**（比关系库列存储胖）。
- **核心术语映射**：关系库 `database → table → row → column`，MongoDB `database → collection → document → field`。没有 JOIN（用 `$lookup` 左外连接或嵌入），没有 schema 强约束（可加 validator）。
- **Schema 设计：嵌入 vs 引用**：①**嵌入（embedding）**——把关联数据塞进一个文档（如订单嵌入商品项），一次读取，适合一对一/一对少量、读多写少；②**引用（referencing）**——分开存按 `id` 关联（像外键），适合多对多、数据量大、需独立更新。**优先嵌入，必要时引用**。
- **索引**：默认 `_id` 有索引。可建单字段、复合、文本、地理空间（2dsphere）、TTL（自动过期）。**复合索引遵循 ESR 规则**：Equality（等值）字段在前，Sort（排序）字段居中，Range（范围）字段在后。索引建错（如顺序错）会退化全表扫描。
- **聚合管道（Aggregation Pipeline）**：`db.coll.aggregate([{阶段1}, {阶段2}, ...])`，常用阶段：`$match`（过滤，对应 WHERE）、`$group`（分组，对应 GROUP BY）、`$project`（投影）、`$sort`（排序）、`$lookup`（左外连接）、`$unwind`（展开数组）、`$limit`/`$skip`。是 MongoDB 的「SQL GROUP BY + JOIN + 子查询」等价物。
- **副本集（Replica Set）**：一主（primary）多从（secondary），主写从异步复制，主挂自动选举新主（基于 Raft 变体）。提供**高可用**与**读分流**（读偏好 ReadPreference：primary/primaryPreferred/secondary/secondaryPreferred/nearest）。
- **分片（Sharding）**：按 **shard key** 把数据分散到多个 shard（每个 shard 是一个副本集），横向扩展到 PB。shard key 选择决定数据分布与查询路由，**选错难更改**（6.0 起支持 reshardCollection 但开销大）。配合 **mongos** 路由 + **config server** 元数据。
- **Atlas**：MongoDB 官方云托管（DBaaS），免运维、自动备份、多云部署（AWS/GCP/Azure）、内置搜索（Atlas Search，基于 Lucene）。
- **变更流（Change Stream）**：应用用 `db.coll.watch()` 实时订阅数据变更（insert/update/delete），基于 oplog，对标数据库触发器/CDC，常用于同步到 Elasticsearch/缓存、触发业务事件。
- **事务**：4.0 起支持**多文档/多集合分布式事务**（副本集内），4.2 起扩展到分片集群。但开销大，仍不适合高频强一致金融场景。
- **进阶顺序**：[文档模型与索引详解](./guide-line/document-model-and-indexes) → [聚合管道、副本集与分片](./guide-line/aggregation-and-sharding) → [参考](./reference)。

## 一、MongoDB 是什么：文档数据库

MongoDB 的本质是「**存文档而非存行**」的数据库。一个文档就是一个类 JSON 的对象：

```javascript
// 一个「订单」文档
{
  _id: ObjectId("..."),           // 自动生成的唯一 ID
  orderNo: "ORD20260807001",
  user: {                          // 嵌套对象
    id: "u1001",
    name: "alice"
  },
  items: [                         // 数组，每个元素又是对象
    { sku: "A1", name: "书", qty: 2, price: 50 },
    { sku: "B2", name: "笔", qty: 5, price: 10 }
  ],
  total: 150,
  status: "paid",
  createdAt: ISODate("2026-08-07T10:00:00Z")
}
```

- **文档 = 类 JSON 对象**：支持任意嵌套（对象里有对象、对象里有数组、数组里有对象），这契合现代应用的对象模型——你在代码里把订单当对象，存进 MongoDB 也是这个对象，**免去关系数据库 ORM 的对象-关系映射**（关系库要把这个对象拆成订单表 + 订单明细表两张表 + 外键关联）。
- **BSON（Binary JSON）**：MongoDB 内部用 BSON 存储——在 JSON 基础上加类型（Date/ObjectId/Binary/Decimal128），解析快、支持更多类型。代价是**每文档重复存字段名**（`{"name":"alice"}` 和 `{"name":"bob"}` 各存一次 `"name"`），所以 BSON 文档比关系库的列存储胖（关系库字段名只在表头存一次）。
- **动态 schema**：同一 collection 的文档**字段可以不同**——`{name:"a"}` 和 `{name:"b", age:30}` 能存同一集合。这带来灵活性（字段不固定、需求变动加字段不必迁移），也是双刃剑（脏数据易混入，生产要加 validator 约束）。
- **术语映射**：关系库 `table → row → column`，MongoDB `collection → document → field`；关系库 `JOIN`，MongoDB 用 `$lookup`（左外连接）或嵌入；关系库 `schema 强约束`，MongoDB `动态 schema`（可加 validator）。

一句话：**MongoDB 是「存文档对象、查询灵活、能横向扩展」的数据库，适合字段不固定、需求多变、对象模型复杂的场景。**

## 二、Schema 设计：嵌入 vs 引用

MongoDB 没有 JOIN 的强支持，所以**数据如何组织进文档**直接决定性能。两种核心策略：

| 策略 | 做法 | 适合 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| **嵌入（embedding）** | 把关联数据塞进一个文档 | 一对一、一对少量、读多写少、关联数据总一起读 | 一次读取拿到全部（无 JOIN）、原子写一个文档 | 文档不能无限大（16MB 上限）、重复数据更新要改多处 |
| **引用（referencing）** | 分开存，按 `id` 关联 | 多对多、数据量大、需独立更新、被多方引用 | 文档小、更新独立、避免数据重复 | 读取要多次查询或 `$lookup`（性能不如嵌入） |

- **嵌入示例**：订单与其商品项——一个订单的商品项通常一起读，且项数有限，嵌入一个文档，读订单一次拿到全部明细。
- **引用示例**：用户与订单——一个用户有几千个订单，且订单要独立查询/分页，应分开存（用户文档存基本信息，订单文档存 userId 引用），不能把几千订单嵌入用户文档（超 16MB 且更新低效）。
- **决策口诀**：「**一起读的嵌入，独立变的引用；一对一/一对少嵌入，多对多/海量引用**」。关系库的思维是「全部拆开靠 JOIN 拼接」，MongoDB 的思维是「**靠嵌入预先组织好，避免运行时 JOIN**」。

## 三、索引：让查询快起来

MongoDB 默认只在 `_id` 上建索引，其他查询字段要手动建索引，否则全集合扫描（COLLSCAN，慢）。索引类型：

- **单字段索引**：`db.coll.createIndex({name: 1})`（1 升序，-1 降序）。适合单字段等值或范围查询。
- **复合索引**：`db.coll.createIndex({status: 1, createdAt: -1})`。**遵循 ESR 规则**：字段顺序按 Equality（等值过滤）→ Sort（排序）→ Range（范围过滤）排列。如查询 `status="paid"` 且按 `createdAt` 降序且 `createdAt > 某日`，索引应 `{status:1, createdAt:-1}`（status 等值在前，createdAt 同时承担 sort 与 range）。ESR 顺序错会让索引部分失效。
- **文本索引**：`db.coll.createIndex({content: "text"})`，支持全文搜索（`$text` 查询，分词、词干、停用词）。适合简单全文搜索；重度搜索用 Atlas Search（基于 Lucene，更强大）。
- **地理空间索引（2dsphere）**：`db.coll.createIndex({loc: "2dsphere"})`，支持「找附近的点」查询（`$near`/`$geoWithin`）。适合 LBS 应用（附近的店、附近的司机）。
- **TTL 索引**：`db.coll.createIndex({createdAt: 1}, {expireAfterSeconds: 3600})`，文档到期自动删除。适合会话、日志、临时数据。
- **索引代价**：索引加速读但拖慢写（每次写要更新所有索引），占内存与磁盘。**只建查询用得上的索引**，定期用 `$indexStats` 审查无用索引删除。

## 四、聚合管道：MongoDB 的「SQL」

聚合管道（aggregation pipeline）是 MongoDB 表达复杂查询的核心——把多个阶段（stage）串联，每个阶段处理输入文档输出给下一阶段：

```javascript
// 示例：统计每个用户已支付订单的总金额，取 Top 5
db.orders.aggregate([
  { $match: { status: "paid" } },                          // 过滤（WHERE）
  { $group: {                                              // 分组（GROUP BY）
      _id: "$userId",                                      // 按 userId 分组
      total: { $sum: "$total" },                           // 求和
      count: { $sum: 1 }
  }},
  { $sort: { total: -1 } },                                // 排序（ORDER BY）
  { $limit: 5 },                                           // 取前 5（LIMIT）
  { $project: { user: "$_id", total: 1, count: 1, _id: 0 } // 投影（SELECT）
  }
])
```

- **`$match`**：过滤，对应 SQL WHERE。**尽早放管道前面**（减少后续阶段处理量，且能用索引）。
- **`$group`**：分组聚合，对应 GROUP BY。`_id` 是分组键，其余字段用聚合操作符（`$sum`/`$avg`/`$max`/`$min`/`$push`/`$addToSet`）。
- **`$lookup`**：左外连接，对应 LEFT JOIN。把另一个集合的文档按条件拼进来。性能不如关系库 JOIN，能嵌入就别 lookup。
- **`$unwind`**：展开数组——每个数组元素拆成一条文档（如把订单的商品项数组展开，每项一条），常配合 `$group` 做数组内聚合。
- **`$project`**：投影，对应 SELECT，控制输出哪些字段。
- **`$sort`/`$limit`/`$skip`**：排序、限制、跳过，对应 ORDER BY/LIMIT/OFFSET。

聚合管道表达力强，能完成 SQL 的 GROUP BY/JOIN/子查询/窗口函数等价操作，是 MongoDB 数据分析的利器。

## 五、副本集与分片

- **副本集（Replica Set）**：一主（primary）多从（secondary）。所有写都进 primary，primary 把写操作记入 **oplog**，secondary 异步复制 oplog 应用。primary 挂时，secondary 们基于 Raft 变体**选举**新 primary（少数服从多数）。副本集提供：①**高可用**（自动故障转移）；②**读分流**（读偏好 ReadPreference 可让读走 secondary）；③**数据冗余**。
- **分片（Sharding）**：当数据量超单机容量，按 **shard key** 把数据分散到多个 shard（每个 shard 是一个副本集）。架构：应用连 **mongos**（路由），mongos 从 **config server** 查元数据（哪个 shard key 范围在哪个 shard），把请求路由到对应 shard。分片策略：①**范围分片**（按 shard key 范围）；②**哈希分片**（shard key 哈希均匀分布，防热点）。**shard key 一旦选好很难改**（6.0 起 reshardCollection 支持改但开销大），选型要慎重（高基数、低频率、非单调递增）。
- **副本集 vs 分片**：副本集解决**高可用**（数据不丢、服务不中断），不解决容量（数据还在一个 primary 上）。分片解决**容量与吞吐**（数据分散），每个 shard 内部是副本集保证高可用。小规模用副本集，数据量大了加分片。

## 六、Atlas 与变更流

- **MongoDB Atlas**：官方云托管（DBaaS），AWS/GCP/Azure 多云部署，免运维（自动备份、扩缩容、监控告警、安全加固）。内置 **Atlas Search**（基于 Lucene 的全文搜索，比内置 text 索引强大）、Atlas Vector Search（向量搜索，AI 场景）、Atlas Device Sync（移动端同步）。适合不想自己运维 MongoDB 的团队。
- **变更流（Change Stream）**：应用用 `db.coll.watch([{$match:...}])` 实时订阅集合的数据变更（insert/update/delete/replace），基于 oplog 实现。常用于：①数据变更后同步到 Elasticsearch/Redis；②触发业务事件（订单支付后发通知）；③审计日志。对标数据库触发器，但是在应用侧消费，比存储过程触发器更灵活。

## 下一步

理解了文档模型、Schema 设计、索引、聚合、副本集与分片后，下一步深入两个生产关键话题——[文档模型与索引详解](./guide-line/document-model-and-indexes)（BSON 细节、嵌入 vs 引用决策、各类索引与 ESR 规则）与[聚合管道、副本集与分片](./guide-line/aggregation-and-sharding)（聚合阶段细节、副本集选举、分片 shard key 选择、Atlas 与变更流）。
