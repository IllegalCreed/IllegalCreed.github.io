---
layout: doc
outline: [2, 3]
---

# 参考：Cypher 速查、场景决策与易错点

> 基于 Neo4j 5.x · 核于 2026-08

## 速查

- **Neo4j 定义**：原生图数据库，属性图（节点+关系+属性）+ 无索引邻接，关系遍历每跳 O(1)。
- **三要素**：节点（带标签 Label 与属性）、关系（有向、带类型 Type 与属性、必有起止）、属性（key-value 挂节点或关系）。
- **Cypher**：`(node)-[rel]->(node)` ASCII 艺术语法。MATCH 查找模式、CREATE 新建、MERGE 幂等、DETACH DELETE 连带删。
- **无索引邻接**：节点存关系指针、关系存起止节点指针，遍历不查索引表。定位起点的点查才要索引。
- **场景**：关系密集 + 多跳遍历（推荐/欺诈/知识图谱/社交）。简单 KV/订单/OLAP 不用图库。
- **属性图 vs RDF**：属性图边可带属性、易用、Cypher；RDF 三元组、SPARQL、W3C 标准、语义网用。
- **APOC**：标配过程库（数据导入、批量 iterate、路径工具）。GDS 是图算法库（PageRank/Louvain）。

## 一、Cypher 命令速查

| 操作 | 命令 |
| --- | --- |
| 查找节点 | `MATCH (n:Person {name:'a'}) RETURN n` |
| 查找关系 | `MATCH (a)-[:KNOWS]->(b) RETURN a,b` |
| 变长路径 | `MATCH (a)-[:KNOWS*2..3]-(x) RETURN x` |
| 最短路径 | `MATCH p = shortestPath((a)-[:KNOWS*]-(b)) RETURN p` |
| 创建节点 | `CREATE (n:Person {name:'a', age:30})` |
| 创建关系 | `CREATE (a)-[:KNOWS {since:2020}]->(b)` |
| 幂等创建 | `MERGE (n:Person {email:'a@x.com'}) ON CREATE SET n.created=timestamp()` |
| 改属性 | `MATCH (n) WHERE id(n)=1 SET n.age = 40` |
| 删节点（有关系到连删） | `MATCH (n {name:'temp'}) DETACH DELETE n` |
| 建索引 | `CREATE INDEX FOR (n:Person) ON (n.email)` |
| 唯一约束 | `CREATE CONSTRAINT FOR (n:Person) REQUIRE n.email IS UNIQUE` |
| 聚合 | `MATCH (n:Person) RETURN n.city, count(*) AS cnt ORDER BY cnt DESC` |

## 二、图模型术语对照

| 概念 | 属性图（Neo4j） | 关系库 | RDF |
| --- | --- | --- | --- |
| 实体 | 节点（Node）+ 标签（Label） | 行（row）+ 表（table） | 资源（URI） |
| 关系 | 关系（Relationship）+ 类型（Type） | 外键（FK）/ JOIN 表 | 谓语（predicate） |
| 属性 | 属性（Property） | 列（column） | 属性（但要 reification 挂边） |
| 标识 | 内部 id + 标签 | 主键（PK） | URI（全局唯一） |
| 查询 | Cypher | SQL | SPARQL |

## 三、场景决策表

| 场景 | 用图库吗 | 原因 |
| --- | --- | --- |
| 推荐系统（共同购买/朋友推荐） | ✅ | 关系密集，几跳搞定，关系库多层 JOIN |
| 欺诈检测（团伙/环路） | ✅ | 多实体关联、环路检测，关系库难表达 |
| 知识图谱（实体-关系语义） | ✅ | 图天然表达，多跳推理 |
| 社交网络（朋友的朋友/影响力） | ✅ | 多跳遍历是核心 |
| IAM（用户-角色-权限-资源） | ✅ | 授权继承是图遍历 |
| 网络拓扑/故障影响分析 | ✅ | 依赖关系图遍历 |
| 简单 KV 缓存 | ❌ | 用 Redis |
| 订单/事务系统 | ❌ | 关系清晰，用关系库（MySQL）+ 外键 |
| 大规模聚合分析（OLAP） | ❌ | 用列式（ClickHouse）/关系库 |
| 全文搜索 | ❌ | 用 Elasticsearch |

## 四、属性图 vs RDF 对比

| 维度 | 属性图 | RDF |
| --- | --- | --- |
| 数据单元 | 节点+关系+属性 | 三元组（主-谓-宾） |
| 边带属性 | ✅ 直接 | ❌ reification 绕道 |
| 查询语言 | Cypher | SPARQL |
| 标识 | 内部 id/标签 | URI |
| schema | 动态（可加约束） | RDFS/OWL 本体推理 |
| 标准化 | 厂商主导 | W3C 国际标准 |
| 典型场景 | 业务图（推荐/欺诈/IAM） | 语义网/Linked Data |

## 五、易错点清单

- **「图库一定比关系库快」**：错。图库只在「关系遍历」快（无索引邻接），全图扫描、聚合分析不一定快，简单点查关系库索引可能更快。选型看场景。
- **「关系可以没有起止节点」**：错。Neo4j 的关系必须有 startNode 和 endNode，删除节点的所有关系会连带处理。不能有「悬空关系」。
- **「关系是无向的」**：错。Neo4j 关系**有方向**（建时指定 `->`），查询时可忽略方向（`--`），但存储有向。
- **「CREATE 和 MERGE 一样」**：错。CREATE 总是新建（重复执行建多个副本），MERGE 是幂等（不存在才建）。防重复用 MERGE + 唯一约束。
- **「图遍历需要建索引」**：错。遍历本身靠无索引邻接的指针，**不需要索引**。只有「定位遍历起点的点查」才需要索引。
- **「属性图边不能带属性」**：错。属性图的边（关系）能带属性——这是它相对 RDF 的核心优势（RDF 边不能直接带属性）。
- **「Neo4j 适合大规模分布式」**：错。社区版单机，企业版 Fabric 跨库联邦但分布式分片不如 Cassandra/MongoDB 成熟，超大规模要评估。
- **「Cypher 的 `*`（任意跳）随便用」**：错。稠密图上 `*` 会遍历海量路径爆炸，要限定跳数或加 LIMIT。
- **「图库适合做全文搜索」**：错。全文搜索用 Elasticsearch/Atlas Search，图库专注于关系遍历。
- **「RDF 和属性图完全等价」**：不完全。两者可互转，但 RDF 边不能直接带属性（要 reification），查询语言（SPARQL vs Cypher）、标识（URI vs 内部 id）、标准化（W3C vs 厂商）都不同。

## 六、进阶方向

- [文档模型与索引](../../mongodb/guide-line/document-model-and-indexes) —— MongoDB 文档模型对比图模型
- [宽列模型与可调一致性](../../distributed-search/cassandra/guide-line/data-model-and-consistency) —— Cassandra 对比
- [分布式与搜索（Elasticsearch）](../../distributed-search/)（占位） —— 全文搜索与图分工

## 权威链接

- [Neo4j 官方文档](https://neo4j.com/docs/) —— 权威手册
- [Cypher Manual](https://neo4j.com/docs/cypher-manual/current/) —— Cypher 查询语言
- [Neo4j GraphAcademy](https://graphacademy.neo4j.com/) —— 官方免费课程
- [APOC 文档](https://neo4j.com/docs/apoc/current/) —— APOC 过程库
- [Graph Data Science](https://neo4j.com/docs/graph-data-science/) —— GDS 图算法库
- [Property Graph Model - Wikipedia](https://en.wikipedia.org/wiki/Graph_database#Property_graph) —— 属性图模型
- [RDF - W3C](https://www.w3.org/RDF/) —— RDF 标准
- [openCypher](http://opencypher.org/) —— Cypher 开放标准
- 本站幻灯片：<a href="/SlideStack/neo4j-slide/" target="_blank">Neo4j</a>
