---
layout: doc
---

# Neo4j

**Neo4j** 是 2007 年由 Neo Technology 开源的**原生图数据库（native graph database）**——它把数据存成「**节点（Node）+ 关系（Relationship）+ 属性（Property）**」的**属性图（Property Graph）**，并用**无索引邻接（index-free adjacency）**让关系遍历是 O(1) 的指针跳转，而非关系数据库的表 JOIN 那样的 O(N) 笛卡尔积扫描。这让 Neo4j 在「**关系本身就是查询重点**」的场景下表现出碾压性的优势——社交网络（朋友的朋友）、推荐系统（买了 A 的人还买了 B）、欺诈检测（多人共用同一设备/手机的团伙）、知识图谱（实体与关系的语义网）——这些用 SQL 要写多层嵌套 JOIN、性能随深度指数恶化的查询，在 Neo4j 里是几跳的图遍历，毫秒级返回。查询语言 **Cypher** 用「**圆括号画节点、方括号画关系**」的 ASCII 艺术语法（`(alice)-[:KNOWS]->(bob)`），让图查询可读性极高。理解 Neo4j 的关键是理解「**属性图模型为什么比关系库的 JOIN 更适合关系密集数据、Cypher 如何表达图模式、无索引邻接为什么快、何时该用图库何时不该用**」——这是它与 MySQL（关系）、MongoDB（文档）、Redis（KV）的根本分野。

Neo4j 的全部考点围绕「**模型、查询、场景**」展开：①**图模型**——属性图三要素：节点（实体，带标签 Label 和属性）、关系（实体间有向连接，带类型 Type 和属性，必须有起止节点）、属性（key-value，挂在节点或关系上）；与 **RDF（Resource Description Framework）** 三元组模型的对比——属性图更易用（属性可挂在边上），RDF 更标准化（W3C 标准、SPARQL 查询、语义网/Linked Data 用）；②**Cypher 查询语言**——`(node)-[relationship]->(node)` 的模式匹配，`MATCH` 查找模式、`CREATE` 创建节点/关系、`MERGE` 幂等创建（不存在才建）、`WHERE` 过滤、`RETURN` 返回；③**索引**——节点属性上建索引加速查找起点（图遍历本身靠邻接无需索引，但定位遍历起点的「点查」要索引）；④**使用场景**——推荐系统、欺诈检测、知识图谱、社交网络、网络/IT 管理、身份与访问管理（IAM），核心是「**关系密集 + 多跳遍历**」；⑤**APOC（Awesome Procedures On Cypher）**——社区/官方的过程库，提供 Cypher 不内置的工具函数（数据导入、图算法桥接、路径工具、字符串处理等），是 Neo4j 实战的「**标配扩展**」。本叶从图模型与 Cypher 讲起，串联使用场景与 APOC，帮你判断什么场景该上 Neo4j 以及怎么用。

## 评价

**优点**

- **关系是一等公民**：关系预先连接（无索引邻接），多跳遍历是 O(1) 指针跳转，不随数据量增长恶化——关系密集场景碾压关系库 JOIN
- **Cypher 可读性极高**：`(a)-[:KNOWS]->(b)` 的 ASCII 艺术语法直观，图模式匹配表达力强
- **属性图灵活**：节点/关系都能挂属性，schema 动态，适合频繁演进的图模型
- **生态成熟**：ACID 事务、APOC 过程库、Graph Data Science（GDS）图算法库、可视化（Neo4j Browser/Bloom），被 LinkedIn/沃尔玛/eBay/ Cisco 等大规模使用

**缺点**

- **不适合大规模聚合分析**：图库优势在关系遍历，GROUP BY/聚合分析不如关系库/列式存储
- **全图扫描慢**：无索引邻接让遍历快，但「不知道起点」的全图扫描要遍历全部节点，要靠索引定位起点
- **分布式扩展有限**：Neo4j 社区版单机；企业版有因果集群（读写分离）和 Fabric（跨库联邦），但真正的横向分片不如 Cassandra/MongoDB 成熟（4.x 起 Fabric 改善）
- **学习曲线**：图思维与关系思维差异大，建模（什么做节点、什么做关系）需重新学习

## 本叶地图

- [入门](./getting-started) —— Neo4j 定义、属性图模型（节点/关系/属性）、Cypher（MATCH/CREATE/MERGE）、无索引邻接为什么快、典型场景（推荐/欺诈/知识图谱）、与 RDF 对比、APOC
- [图模型与 Cypher](./guide-line/graph-model-and-cypher) —— 属性图三要素与建模原则、Cypher 模式匹配（MATCH/WHERE/RETURN）、CREATE/MERGE/DELETE、索引与约束、无索引邻接原理
- [使用场景与 APOC](./guide-line/use-cases-and-apoc) —— 推荐系统/欺诈检测/知识图谱/社交网络的图查询模式、属性图 vs RDF 取舍、APOC 过程库实战、Graph Data Science 简介
- [参考](./reference) —— Cypher 速查、图模型术语、场景决策表、易错点清单、权威链接

## 幻灯片地址

<a href="/SlideStack/neo4j-slide/" target="_blank">Neo4j</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Neo4j" target="_blank" rel="noopener noreferrer">Neo4j 测试题</a>
