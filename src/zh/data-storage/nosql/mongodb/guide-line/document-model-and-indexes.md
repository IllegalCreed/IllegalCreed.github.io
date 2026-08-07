---
layout: doc
outline: [2, 3]
---

# 文档模型与索引详解

> 基于 MongoDB 7.x/8.x · 核于 2026-08

## 速查

- **BSON**：Binary JSON，二进制编码的 JSON 超集。支持 JSON 全部类型 + Date/ObjectId/Binary/Decimal128/RegExp/Long/Double 等。解析快、类型丰富，但**每文档重复存字段名**（比关系库列存储胖）。单文档**上限 16MB**。
- **ObjectId**：MongoDB 默认主键，12 字节 = 4 字节时间戳 + 5 字节随机值 + 3 字节递增计数器。**按时间单调递增**（用 ObjectId 做 _id 天然按创建时间排序），全局唯一，客户端可生成（不必等服务端）。
- **动态 schema**：同一 collection 文档字段可不同。灵活（加字段不必迁移）但易混入脏数据。生产用 **validator**（JSON Schema）约束必填字段与类型：`db.createCollection("user", {validator: {$jsonSchema: {...}}})`。
- **嵌入（embedding）**：把关联数据塞进一个文档。适合：一对一、一对少量、读多写少、关联数据总一起读、子数据有限（如订单-商品项、用户-地址）。优点：一次读拿全（无 JOIN）、单文档原子写。缺点：文档不能超 16MB、子数据增长要迁移、重复数据多处更新。
- **引用（referencing）**：分开存按 id 关联（像外键）。适合：多对多、数据量大、需独立更新/分页、被多方引用（如用户-订单、文章-评论）。优点：文档小、更新独立、避免重复。缺点：读取要多次查询或 `$lookup`（性能不如嵌入）。
- **决策口诀**：**一起读嵌入，独立变引用；一对一/一对少嵌入，多对多/海量引用；宁可嵌入也别 lookup**。
- **单字段索引**：`createIndex({field: 1})`（1 升序，-1 降序）。支持等值、范围、排序。
- **复合索引与 ESR 规则**：`createIndex({E1:1, E2:1, S:1, R:1})`——**Equality（等值）字段在前，Sort（排序）字段居中，Range（范围）字段在后**。顺序错会让索引部分失效退化扫描。复合索引支持「最左前缀」。
- **文本索引**：`createIndex({content: "text"})`，全文搜索（`$text` 查询，分词、词干、停用词）。每集合只能一个文本索引。重度搜索用 Atlas Search。
- **地理空间索引**：`createIndex({loc: "2dsphere"})`，支持 `$near`/`$geoWithin`/`$geoIntersects`「找附近/区域内」查询。适合 LBS。
- **TTL 索引**：`createIndex({createdAt:1}, {expireAfterSeconds: 3600})`，后台每 60 秒删过期文档。适合会话、日志、验证码。
- **索引代价**：加速读但拖慢写（每次写更新所有索引）、占内存磁盘。只建查询用得上的，用 `$indexStats` 审查无用索引删除。

## 一、BSON 与文档结构

MongoDB 存的不是 JSON 而是 BSON——二进制编码的 JSON 超集：

```javascript
// 一个典型文档（_id 自动生成）
{
  _id: ObjectId("65b8f2a1..."),        // 12 字节 ObjectId
  name: "alice",                        // string
  age: 30,                              // int
  score: 95.5,                          // double
  tags: ["db", "nosql"],                // array
  profile: {                            // 嵌套对象
    email: "a@x.com",
    verified: true                      // bool
  },
  createdAt: ISODate("2026-08-07..."),  // Date（BSON 类型，JSON 没有）
  data: BinData(0, "..."),              // 二进制（JSON 没有）
  balance: NumberDecimal("100.50")      // Decimal128（高精度，JSON 没有）
}
```

- **BSON 比 JSON 多的类型**：Date（ISODate）、ObjectId、Binary（BinData）、Decimal128（NumberDecimal，金融级高精度）、RegExp、Long/Double/Int32 细分。这让 MongoDB 能精确表达 JSON 表达不了的领域（时间、二进制、精确小数）。
- **代价：字段名重复存**：关系库字段名只在表头存一次，数据行只存值；BSON 每个文档都把字段名存一遍（`{"name":"a"}` 和 `{"name":"b"}` 各存一次 `"name"`）。所以 BSON 文档比关系库行胖，**字段名应简短**（用 `nm` 而非 `userName` 在极端省内存场景，但可读性差，权衡）。
- **单文档上限 16MB**：防止文档过大拖垮内存与网络。超 16MB 的关联数据不能嵌入，必须拆开引用或用 GridFS（专门存大文件的协议）。
- **ObjectId 的精妙**：12 字节 = 4 字节时间戳（秒）+ 5 字节随机值（机器/进程唯一）+ 3 字节递增计数器。它**按时间单调递增**（同一秒内按计数器递增），所以用 ObjectId 做 `_id` 时，文档天然按创建时间排序，索引 B 树的插入都在末尾（不会频繁分裂）。客户端可生成（不依赖服务端），分布式下唯一。

## 二、嵌入 vs 引用：Schema 设计的核心抉择

MongoDB 没有 JOIN 的强支持，**数据如何组织进文档直接决定性能**。两种策略：

### 嵌入（embedding）

把关联数据塞进一个文档：

```javascript
// 订单嵌入商品项（一对少，一起读）
{
  _id: ObjectId("..."),
  orderNo: "ORD001",
  items: [                              // 嵌入数组
    { sku: "A1", name: "书", qty: 2, price: 50 },
    { sku: "B2", name: "笔", qty: 5, price: 10 }
  ],
  total: 150
}
```

- **适合**：一对一（用户-资料）、一对少（订单-商品项、用户-地址）、读多写少、关联数据总一起读、子数据有限（不超 16MB）。
- **优点**：一次读拿全（无 JOIN）；单文档写是原子的（事务保证到单文档级别）。
- **缺点**：子数据增长到超 16MB 要迁移；同一子数据被多处嵌入时更新要改多处（数据冗余）。

### 引用（referencing）

分开存，按 id 关联：

```javascript
// 用户与订单分开（一对多，订单量大且独立查询）
// user 文档
{ _id: "u1001", name: "alice" }
// order 文档（存 userId 引用）
{ _id: ObjectId("..."), userId: "u1001", total: 150, createdAt: ... }
// 查 alice 的订单：db.orders.find({userId: "u1001"}).sort({createdAt:-1}).limit(10)
```

- **适合**：多对多（用户-角色）、一对海量（用户-成千订单）、需独立更新/分页、被多方引用。
- **优点**：文档小（不超 16MB 无压力）；更新独立（改订单不影响用户文档）；避免数据重复。
- **缺点**：读取要多次查询或 `$lookup`（左外连接，性能不如嵌入）。

### 决策口诀

**一起读的嵌入，独立变的引用；一对一/一对少嵌入，多对多/海量引用；宁可嵌入也别 `$lookup`**。关系库的思维是「全部拆开靠 JOIN 拼」，MongoDB 的思维是「**靠嵌入预先组织好，避免运行时 JOIN**」。

## 三、单字段索引与复合索引

### 单字段索引

```javascript
db.users.createIndex({ name: 1 })   // 1 升序，-1 降序
db.users.createIndex({ age: -1 })
```

支持等值（`name: "alice"`）、范围（`age: {$gt: 18}`）、排序（`sort({age: 1})` 用升序索引，`sort({age: -1})` 用降序索引）。

### 复合索引与 ESR 规则

复合索引的字段顺序至关重要，遵循 **ESR 规则**：

- **E（Equality，等值）**：用 `{field: value}` 等值过滤的字段，放最前。
- **S（Sort，排序）**：用于 `sort()` 的字段，居中。
- **R（Range，范围）**：用 `$gt`/`$lt`/`$in` 等范围过滤的字段，放最后。

```javascript
// 查询：status="paid"（等值）且按 createdAt 降序（排序）且 createdAt > 7 天前（范围）
db.orders.find({ status: "paid", createdAt: { $gt: ISODate("...") } })
         .sort({ createdAt: -1 })

// 正确索引（ESR：status 等值在前，createdAt 同时承担 sort 与 range）
db.orders.createIndex({ status: 1, createdAt: -1 })

// 错误索引（range 在 sort 前会失效）
db.orders.createIndex({ status: 1, createdAt: 1, /* 别的字段 */ })
```

- **最左前缀**：复合索引 `{a:1, b:1, c:1}` 能服务 `{a}`、`{a,b}`、`{a,b,c}` 的查询，但 `{b}` 或 `{b,c}` 用不上（缺最左 a）。
- **顺序错的代价**：把 range 字段放在 sort 前，索引只能用到 range 部分，sort 要在内存里做（超 100MB 报错）。ESR 顺序对，索引能同时支持过滤 + 排序。

## 四、文本、地理空间与 TTL 索引

- **文本索引**：`db.articles.createIndex({ title: "text", content: "text" })`，查询 `db.articles.find({$text: {$search: "mongodb nosql"}})`。支持分词、词干（stemming）、停用词、加权（`{weights: {title: 10, content: 1}}`）。每集合只能一个文本索引。**重度搜索用 Atlas Search**（基于 Lucene，支持高亮、纠错、同义词，比内置 text 强大）。
- **地理空间索引（2dsphere）**：存 GeoJSON 点/线/面，`db.shops.createIndex({ loc: "2dsphere" })`，查询「找附近 1km 内的店」：`db.shops.find({loc: {$near: {$geometry: {type:"Point", coordinates:[116.4,39.9]}, $maxDistance: 1000}}})`。也支持 `$geoWithin`（区域内）、`$geoIntersects`（相交）。LBS 应用核心。
- **TTL 索引**：`db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })`，后台每 60 秒删过期文档（基于一个 Date 字段 + 过期秒数）。适合会话（session）、日志、验证码、缓存数据。注意删除有延迟（后台周期跑），不是精确到期立刻删。

## 五、索引的代价与维护

索引不是越多越好——**加速读但拖慢写**：

- **写代价**：每次 insert/update/delete 都要同步更新所有相关索引。索引越多写越慢。
- **存储与内存代价**：索引占磁盘（有时索引比数据还大）与内存（MongoDB 尽量把索引放内存，内存不够会频繁磁盘 IO 慢）。
- **维护建议**：①只建查询用得上的索引；②用 `db.coll.aggregate([{$indexStats:{}}])` 查每个索引的使用频率，删除无用索引；③构建索引用后台模式（`background: true`，6.0 起默认非阻塞）避免锁库；④定期 `db.coll.reIndex()` 重建碎片化索引。

## 下一步

文档模型与索引讲完后，下一步进入聚合管道、副本集与分片——[聚合管道、副本集与分片](./aggregation-and-sharding)，讲清聚合各阶段的细节、副本集的选举与读偏好、分片 shard key 的选择、Atlas 与变更流。
