---
layout: doc
---

# MongoDB

**MongoDB** 是 2009 年由 MongoDB Inc.（原 10gen）开源的**面向文档的 NoSQL 数据库**——它把数据存成 **BSON（Binary JSON）文档**而非行/列，一个文档就是一个类 JSON 对象（`{name: "alice", age: 30, tags: ["db","nosql"]}`），支持嵌套对象与数组，天然契合现代应用的对象模型，**免去关系数据库 ORM 的对象-关系阻抗失配**。MongoDB 的核心价值在于「**灵活的文档模型 + 丰富的查询 + 横向扩展**」：文档 schema 动态（同一集合的文档可有不同字段），适合需求频繁变动、字段不固定的场景；查询语言（MQL）比 SQL 表达力更强（支持嵌套字段、数组谓词、聚合管道）；通过**副本集（Replica Set）**保证高可用，通过**分片（Sharding）**横向扩展到 PB 级数据。理解 MongoDB 的关键是理解「**文档模型如何设计（嵌入 vs 引用）、索引如何建（单字段/复合/文本/地理空间）、聚合管道如何工作、副本集与分片如何协作**」——这是它与 MySQL（关系）、Redis（KV）、Neo4j（图）的根本分野。

MongoDB 的全部考点围绕「**建模、查询、扩展**」展开：①**文档模型与 BSON**——文档是类 JSON 的 BSON（带类型、二进制），字段动态，嵌套对象与数组一等公民；②**Schema 设计**——**嵌入（embedding）**（把关联数据塞进一个文档，一次读取，适合一对一/一对少量、读多写少）vs **引用（referencing）**（像关系库的外键，分开存按 id 关联，适合多对多、数据量大、需独立更新），选错会拖垮性能；③**索引**——单字段索引、**复合索引**（遵循 ESR 规则：Equality/Sort/Range）、文本索引（全文搜索）、地理空间索引（2dsphere，找附近的点）、TTL 索引（自动过期文档）；④**聚合管道（Aggregation Pipeline）**——`$match`/`$group`/`$project`/`$sort`/`$lookup`（左外连接）/`$unwind`（展开数组）等阶段串联，是 MongoDB 的「**SQL GROUP BY + JOIN + 子查询**」等价物；⑤**副本集**——一主两从，主写从复制，自动选举故障转移，保证高可用与读分流；⑥**分片**——按 shard key 把数据分散到多个 shard，每个 shard 是一个副本集，横向扩展；⑦**Atlas 与变更流**——Atlas 是官方云托管（免运维），变更流（Change Stream）让应用实时订阅数据变更（对标数据库触发器/CDC）。本叶从文档模型与索引讲起，串联聚合管道、副本集与分片，帮你既会建模也会扩展 MongoDB。

## 评价

**优点**

- **灵活的文档模型**：BSON 文档支持嵌套对象与数组，schema 动态，契合现代应用对象模型，免 ORM 阻抗失配
- **丰富的查询与聚合**：MQL 支持嵌套字段与数组谓词，聚合管道（pipeline）表达力强，能完成 GROUP BY/JOIN/子查询
- **横向扩展**：分片（sharding）按 shard key 把数据分散到多节点，原生支持 PB 级数据
- **生态成熟**：副本集自动故障转移、Atlas 云托管、变更流（Change Stream）、多语言驱动，被 Uber/Adobe/ea 等大规模使用

**缺点**

- **无事务到多文档（4.0 前）**：4.0 起才支持多文档/多集合分布式事务，但性能开销大，仍不适合强一致的金融核心
- **内存占用大**：BSON 文档带字段名（每文档重复存字段名），占内存与磁盘，比关系库的列存储胖
- **JOIN 弱**：`$lookup` 是左外连接，性能不如关系库的 JOIN，重度关联场景应嵌入或选关系库
- **schema 太灵活是双刃**：无强约束，脏数据易混入，生产需配合校验器（validator）约束

## 本叶地图

- [入门](./getting-started) —— MongoDB 定义、BSON 文档模型、Schema 设计（嵌入 vs 引用）、索引、聚合管道、副本集与分片、Atlas 与变更流
- [文档模型与索引](./guide-line/document-model-and-indexes) —— BSON 与动态 schema、嵌入 vs 引用取舍、单字段/复合索引 ESR 规则、文本索引、地理空间索引、TTL 索引
- [聚合管道、副本集与分片](./guide-line/aggregation-and-sharding) —— 聚合管道阶段（$match/$group/$lookup/$unwind）、副本集选举与读偏好、分片 shard key 选择、Atlas 与变更流
- [参考](./reference) —— 命令速查、Schema 设计决策表、索引类型对比、聚合阶段速查、易错点清单、权威链接

## 幻灯片地址

<a href="/SlideStack/mongodb-slide/" target="_blank">MongoDB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=MongoDB" target="_blank" rel="noopener noreferrer">MongoDB 测试题</a>
