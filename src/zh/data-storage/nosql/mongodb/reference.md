---
layout: doc
outline: [2, 3]
---

# 参考：命令速查、Schema 决策与易错点

> 基于 MongoDB 7.x/8.x · 核于 2026-08

## 速查

- **MongoDB 定义**：面向文档的 NoSQL 数据库，数据存成 BSON 文档（类 JSON + 类型），动态 schema，副本集高可用，分片横向扩展。
- **术语映射**：关系库 table→row→column，MongoDB collection→document→field；JOIN→`$lookup` 或嵌入；schema 强约束→动态 schema（可加 validator）。
- **Schema 设计**：一起读嵌入，独立变引用；一对一/一对少嵌入，多对多/海量引用；宁可嵌入别 lookup。
- **索引**：单字段、复合（ESR 规则）、文本、地理空间（2dsphere）、TTL。默认 `_id` 有索引。
- **聚合管道**：`$match`（过滤，前置用索引）/`$group`（分组）/`$project`（投影）/`$sort`/`$lookup`（左连接）/`$unwind`（展开数组）。
- **副本集**：一主多从，oplog 异步复制，Raft 选举故障转移，至少 3 投票成员。读偏好决定读主还是读从。
- **分片**：shard key 分散数据，mongos 路由 + config server 元数据。key 要高基数/低频率/非单调。
- **事务**：4.0+ 副本集多文档事务，4.2+ 分片事务，开销大慎用。
- **Atlas**：官方云托管 DBaaS，免运维 + Atlas Search/Vector Search。
- **变更流**：`watch()` 订阅数据变更，基于 oplog，对标触发器/CDC。

## 一、常用命令速查

| 操作 | 命令 |
| --- | --- |
| 插入 | `db.coll.insertOne({name:"a"})`/`insertMany([...])` |
| 查询 | `db.coll.find({status:"paid"}).sort({createdAt:-1}).limit(10)` |
| 更新 | `db.coll.updateOne({_id:...}, {$set:{status:"paid"}})`/`updateMany`/`replaceOne` |
| 删除 | `db.coll.deleteOne({_id:...})`/`deleteMany({status:"expired"})` |
| 计数 | `db.coll.countDocuments({status:"paid"})` |
| 建索引 | `db.coll.createIndex({field:1})`/`createIndex({a:1,b:-1})`（复合） |
| 文本搜索 | `db.coll.find({$text:{$search:"mongodb"}})` |
| 聚合 | `db.coll.aggregate([{$match:...},{$group:...}])` |
| 变更流 | `db.coll.watch([{$match:{operationType:"update"}}])` |

## 二、Schema 设计决策表

| 场景 | 策略 | 示例 |
| --- | --- | --- |
| 一对一 | 嵌入 | 用户-资料（profile 嵌入 user） |
| 一对少（读多） | 嵌入 | 订单-商品项（items 嵌入 order） |
| 一对少（独立更新） | 引用 | 用户-地址（多地址时引用 address 集合） |
| 一对海量 | 引用 | 用户-订单（订单分页查询） |
| 多对多 | 引用 | 用户-角色（双向引用或中间文档） |
| 被多方引用 | 引用 | 商品（被多订单引用） |
| 子数据无限增长 | 引用 | 文章-评论（评论可无数条） |

**口诀**：一起读嵌入，独立变引用；宁可嵌入别 lookup。

## 三、索引类型对比

| 类型 | 创建 | 用途 |
| --- | --- | --- |
| 单字段 | `createIndex({name:1})` | 等值/范围/排序 |
| 复合 | `createIndex({status:1,createdAt:-1})` | 多字段，遵循 ESR 规则 |
| 文本 | `createIndex({content:"text"})` | 全文搜索（`$text`） |
| 地理空间 | `createIndex({loc:"2dsphere"})` | 找附近/区域内（`$near`/`$geoWithin`） |
| TTL | `createIndex({createdAt:1},{expireAfterSeconds:3600})` | 自动过期（会话/日志） |
| 唯一 | `createIndex({email:1},{unique:true})` | 唯一约束 |
| 哈希 | `createIndex({userId:"hashed"})` | 分片均匀分散 |

## 四、聚合阶段速查

| 阶段 | 作用 | SQL 对应 |
| --- | --- | --- |
| `$match` | 过滤（**前置用索引**） | WHERE |
| `$group` | 分组聚合（`$sum`/`$avg`/`$push`） | GROUP BY |
| `$project` | 投影/重命名 | SELECT |
| `$sort` | 排序 | ORDER BY |
| `$limit`/`$skip` | 限制/跳过 | LIMIT/OFFSET |
| `$lookup` | 左外连接（性能弱） | LEFT JOIN |
| `$unwind` | 展开数组 | （展开为多行） |
| `$count` | 计数 | COUNT |
| `$facet` | 多分支并行 | （多个聚合一次返回） |

## 五、副本集与分片要点

| 维度 | 副本集（Replica Set） | 分片（Sharding） |
| --- | --- | --- |
| 解决问题 | 高可用 + 读分流 | 容量 + 写吞吐 |
| 数据分布 | 全部数据在每个节点 | 数据分散到多 shard |
| 架构 | 1 主 N 从（≥3 投票） | mongos + config + N shard |
| 选举 | Raft 变体选主 | 每个 shard 内部副本集选举 |
| 一致性 | primary 强一致，secondary 最终一致 | shard key 路由 |
| 何时用 | 生产标配（永远） | 数据超单机 / 写吞吐超单机 |

## 六、易错点清单

- **「MongoDB 不支持事务」**：错。4.0 起副本集多文档事务，4.2 起分片事务。但开销大，仍不是高频强一致的首选。
- **「文档越大越好」**：错。单文档上限 16MB，且大文档拖累内存与网络。超限要拆引用或用 GridFS。
- **「嵌入总是比引用好」**：错。一对海量/多对多场景嵌入会撑爆文档且低效，应引用。
- **「复合索引字段顺序无所谓」**：错。必须遵循 ESR（Equality→Sort→Range）规则，顺序错索引失效。
- **「`$lookup` 等价于关系库 JOIN」**：不完全。`$lookup` 是左外连接且嵌套循环实现，性能弱于关系库 JOIN，能嵌入就别 lookup。
- **「读 secondary 是强一致」**：错。secondary 异步复制有延迟，读 secondary 是最终一致。
- **「副本集 2 节点就够了」**：错。至少 3 个投票成员（奇数），否则选举时可能脑裂（两边票数相同）。
- **「shard key 可以随便改」**：错。shard key 难改（6.0 起 reshardCollection 支持但开销极大），选型要慎重（高基数/低频率/非单调）。
- **「单调递增 ID 适合做 shard key」**：错。自增 ID/时间戳单调递增会让所有写集中到最后一个 shard 形成热点，要用哈希分片打散。
- **「ObjectId 是随机生成的」**：错。ObjectId 含时间戳，按时间单调递增（天然按创建时间排序），全局唯一，客户端可生成。
- **「MongoDB 没有 schema 所以不约束」**：错。可用 validator（JSON Schema）约束字段类型与必填，生产建议加约束防脏数据。

## 七、进阶方向

- [内存模型与数据结构](../../redis/guide-line/data-structures-and-persistence) —— Redis KV 对比文档模型
- [图模型与 Cypher](../../neo4j/guide-line/graph-model-and-cypher) —— Neo4j 关系密集场景对比
- [宽列模型与可调一致性](../../distributed-search/cassandra/guide-line/data-model-and-consistency) —— Cassandra 对比

## 权威链接

- [MongoDB 官方文档](https://www.mongodb.com/docs/) —— 权威手册
- [MongoDB CRUD Operations](https://www.mongodb.com/docs/manual/crud/) —— 增删改查
- [Aggregation Pipeline](https://www.mongodb.com/docs/manual/aggregation/) —— 聚合管道
- [Indexes](https://www.mongodb.com/docs/manual/indexes/) —— 索引详解
- [Replica Sets](https://www.mongodb.com/docs/manual/replication/) —— 副本集
- [Sharding](https://www.mongodb.com/docs/manual/sharding/) —— 分片
- [MongoDB Atlas](https://www.mongodb.com/atlas) —— 云托管
- [BSON Specification](https://bsonspec.org/) —— BSON 规范
- 本站幻灯片：<a href="/SlideStack/mongodb-slide/" target="_blank">MongoDB</a>
