---
layout: doc
outline: [2, 3]
---

# 入门：属性图模型与 Cypher

> 基于 Neo4j 5.x · 核于 2026-08

## 速查

- **定义**：Neo4j 是**原生图数据库**，数据存成「**节点 + 关系 + 属性**」的**属性图（Property Graph）**，用**无索引邻接**让关系遍历是 O(1) 指针跳转。2007 年开源。查询语言 **Cypher**。
- **属性图三要素**：①**节点（Node）**——实体，可带多个**标签（Label）**分类（如 `:Person`、`:Movie`）和属性（key-value）；②**关系（Relationship）**——节点间的**有向**连接，必须有类型（如 `:ACTED_IN`、`:KNOWS`）和起止节点，也能带属性；③**属性（Property）**——key-value，挂在节点或关系上（如 `{name:"alice", age:30}`）。
- **无索引邻接（index-free adjacency）**：Neo4j 把每个节点的关系以指针直接存在节点上，遍历「A 的朋友」是直接跟随指针，**O(1) 每跳**。关系库要 JOIN 朋友表（O(N) 笛卡尔积 + 索引查找），多跳随深度恶化。这是图库在关系遍历上的根本优势。
- **Cypher**：声明式图查询语言。`(node)-[relationship]->(node)` 的 ASCII 艺术语法画图模式。`MATCH` 查找匹配模式的子图，`WHERE` 过滤，`RETURN` 返回。
- **核心命令**：`MATCH`（查找）/ `CREATE`（创建节点/关系）/ `MERGE`（幂等创建，不存在才建）/ `SET`（改属性）/ `DELETE`/`DETACH DELETE`（删节点/连带关系删）/ `WHERE`/`RETURN`/`ORDER BY`/`LIMIT`。
- **索引**：图遍历本身靠邻接无需索引，但**定位遍历起点**的点查（如「找 name='alice' 的节点」）要建索引（`CREATE INDEX FOR (n:Person) ON (n.name)`），否则全节点扫描。也支持唯一约束（`CREATE CONSTRAINT ... REQUIRE n.id IS UNIQUE`）。
- **典型场景**：推荐系统（买了 A 的人还买了 B、朋友推荐）、欺诈检测（多人共用同一手机/地址/IP 的团伙）、知识图谱（实体-关系语义网）、社交网络（朋友的朋友、二度人脉）、网络/IT 拓扑、IAM（身份与访问关系）。核心是「**关系密集 + 多跳遍历**」。
- **属性图 vs RDF**：属性图（Neo4j）——关系可带属性、易用、Cypher 直观；RDF（W3C 标准）——三元组（主-谓-宾）、SPARQL 查询、标准化好、语义网/Linked Data 用。两者可互转，选型看生态与场景。
- **APOC（Awesome Procedures On Cypher）**：社区/官方的过程（procedure）库，提供 Cypher 不内置的工具——数据导入（`apoc.load.json`）、批量操作、路径工具、图算法桥接、字符串/日期处理。Neo4j 实战的**标配扩展**。
- **Graph Data Science（GDS）**：Neo4j 的图算法库（PageRank、社区发现 Louvain、最短路径、中心性），用于机器学习特征、欺诈评分、推荐。
- **进阶顺序**：[图模型与 Cypher 详解](./guide-line/graph-model-and-cypher) → [使用场景与 APOC](./guide-line/use-cases-and-apoc) → [参考](./reference)。

## 一、Neo4j 是什么：原生图数据库

Neo4j 的本质是「**把关系当一等公民存储**」的数据库。传统关系库把实体存表、关系存外键，查询关系要 JOIN（运行时按外键扫描匹配）。Neo4j 把节点和关系都存为图的原生结构——节点存属性 + 指向关系的指针，关系存属性 + 起止节点指针。遍历关系就是跟随指针，无需运行时扫描匹配：

```cypher
// 属性图示例：alice 评价了 movie，role 是 "Alice"
(:Person {name:"alice", born:1985})
   -[:ACTED_IN {roles:["Alice"]}]->
(:Movie {title:"Matrix", released:1999})
```

- **节点（Node）**：实体，如人、电影、商品。可带多个**标签（Label）**做分类（`:Person:Actor` 表示既是人又是演员），标签也用于索引与约束。节点带属性（key-value）。
- **关系（Relationship）**：节点间的**有向连接**（必须有方向，查询时可忽略方向）。关系必须有**类型（Type）**（如 `:ACTED_IN`、`:KNOWS`、`:BOUGHT`）和起止节点。关系也能带属性（如 `roles`、`since`、`weight`）——这是属性图相对 RDF 的核心优势（RDF 的边不能直接带属性，要绕道 reification）。
- **属性（Property）**：key-value 对，挂在节点或关系上。支持类型（string/int/float/bool/date/array）。schema 动态（不同节点可有不同属性）。
- **为什么用图库**：当「**关系本身就是查询重点**」且关系密集、需要多跳遍历时，关系库的 JOIN 随深度指数恶化（朋友的朋友的朋友 = 3 层 JOIN，笛卡尔积爆炸），而图库的指针遍历每跳 O(1)，不随数据量增长恶化。

一句话：**Neo4j 是「把关系存为指针、遍历 O(1)、用 Cypher 画图查询」的数据库，适合关系密集且要多跳遍历的场景。**

## 二、无索引邻接：图库为什么快

Neo4j 在关系遍历上碾压关系库的根本是**无索引邻接（index-free adjacency）**：

```
   关系库：找 alice 的朋友的朋友的朋友
   ┌─────────────────────────────────────────┐
   │ SELECT ... FROM friend f1                │
   │ JOIN friend f2 ON f1.b = f2.a            │  ← 3 层 JOIN
   │ JOIN friend f3 ON f2.b = f3.a            │     笛卡尔积 + 索引查找
   │ JOIN friend f4 ON f3.b = f4.a            │     复杂度随深度恶化
   │ WHERE f1.a = 'alice'                     │
   └─────────────────────────────────────────┘

   Neo4j：找 alice 的朋友的朋友的朋友
   ┌─────────────────────────────────────────┐
   │ MATCH (a:Person {name:'alice'})          │
   │       -[:KNOWS*3]-> (fof)                │  ← 跟随指针 3 跳
   │ RETURN fof                               │     每跳 O(1)
   └─────────────────────────────────────────┘
```

- **关系库的 JOIN**：运行时按外键字段扫描 + 索引查找匹配行。多跳 = 多次 JOIN，中间结果笛卡尔积膨胀，复杂度随深度恶化。深度 3-4 跳在百万级数据上可能几秒到几十秒。
- **Neo4j 的无索引邻接**：每个节点直接存指向其关系的指针，关系存起止节点指针。遍历「A 的朋友」就是跟随 A 的出边指针，**每跳 O(1)**。3 跳、5 跳、10 跳都是线性累加，不随数据总量恶化（只随遍历经过的边数增长）。
- **代价**：无索引邻接让遍历快，但**全图扫描慢**（不知道起点的查询要遍历全部节点）。所以定位遍历起点的「点查」（`{name:'alice'}`）必须在属性上建索引，否则退化全节点扫描。

## 三、Cypher：画图查询

Cypher 是 Neo4j 的声明式图查询语言，用 ASCII 艺术语法画图模式：

```cypher
// 查找 alice 演过且评分高于 8 的电影
MATCH (a:Person {name: 'alice'})-[:ACTED_IN]->(m:Movie)
WHERE m.rating > 8
RETURN m.title, m.released
ORDER BY m.released DESC
LIMIT 10

// 创建节点和关系
CREATE (a:Person {name: 'alice', born: 1985})
CREATE (m:Movie {title: 'Matrix', released: 1999})
CREATE (a)-[:ACTED_IN {roles: ['Alice']}]->(m)

// 幂等创建（不存在才建，存在则匹配）——防重复
MERGE (a:Person {name: 'alice'})
MERGE (m:Movie {title: 'Matrix'})
MERGE (a)-[:ACTED_IN]->(m)

// 变长路径：朋友的朋友（2 跳）
MATCH (a:Person {name:'alice'})-[:KNOWS*2..2]-(fof)
RETURN fof.name

// 最短路径
MATCH p = shortestPath((a:Person {name:'alice'})-[*]-(b:Person {name:'bob'}))
RETURN p
```

- **`(node)`**：圆括号画节点，`:Label` 是标签，`{prop:value}` 是属性。
- **`-[rel]->`**：方括号画关系，`-` 表示有向（`--` 无向、`<-[]-` 反向），`:TYPE` 是类型，`*2..3` 是变长路径（2 到 3 跳）。
- **`MATCH`**：声明要查找的图模式，Neo4j 在图里找所有匹配的子图。
- **`MERGE` vs `CREATE`**：`CREATE` 总是新建（重复执行会建多个）；`MERGE` 是「存在则匹配、不存在才建」（幂等），防重复数据，常配合唯一约束用。
- **`DETACH DELETE`**：删节点必须先删其关系（否则报错），`DETACH DELETE n` 连带关系一起删。

## 四、索引与约束

图遍历靠邻接无需索引，但定位遍历起点的**点查**要索引：

- **索引**：`CREATE INDEX FOR (n:Person) ON (n.name)`——在节点属性上建索引，加速 `MATCH (n:Person {name:'alice'})` 这类按属性定位节点的查询。无索引则全节点扫描（慢）。
- **唯一约束**：`CREATE CONSTRAINT FOR (n:Person) REQUIRE n.email IS UNIQUE`——保证某属性唯一，自动建索引。配合 `MERGE` 防重复。
- **关系索引（5.0+）**：`CREATE INDEX FOR ()-[r:REVIEWED]-() ON (r.rating)`——在关系属性上建索引（早期版本只支持节点属性索引）。

## 五、典型使用场景

Neo4j 不是万能药，它在「**关系密集 + 多跳遍历**」场景才发挥优势：

- **推荐系统**：「买了 A 的人还买了 B」（协同过滤的图表达）、朋友推荐（共同好友多的人）、内容推荐（你关注的人点赞了什么）。图查询几跳搞定，关系库要多层 JOIN。
- **欺诈检测**：多人共用同一手机号/地址/IP/设备的团伙识别、循环转账洗钱路径。图能发现「隐藏的关系网络」，关系库难表达。
- **知识图谱**：实体（人/地/组织）与关系（出生地/就职于/投资了）的语义网，问答系统、搜索引擎、AI 推理的基础。
- **社交网络**：朋友的朋友、二度人脉、影响力传播、社群发现。
- **网络/IT 拓扑**：数据中心设备依赖、故障影响范围分析（一台交换机挂了影响哪些服务）。
- **IAM（身份与访问管理）**：用户-角色-权限-资源的授权关系图，复杂权限继承计算。

## 六、属性图 vs RDF

两种主流图模型：

| 维度 | 属性图（Neo4j） | RDF（W3C 标准） |
| --- | --- | --- |
| 数据单元 | 节点 + 关系 + 属性 | 三元组（主语-谓语-宾语） |
| 边带属性 | ✅ 直接支持 | ❌ 要 reification 绕道 |
| 查询语言 | Cypher | SPARQL |
| 标准化 | 厂商主导（openCypher） | W3C 国际标准 |
| 易用性 | 直观、属性灵活 | 较繁琐、URI 命名 |
| 典型场景 | 业务图（推荐/欺诈/IAM） | 语义网、Linked Data、本体 |

属性图更易用（属性可挂边），RDF 更标准化（SPARQL/W3C，语义互操作）。两者可互转。业务应用多选 Neo4j（属性图），学术/语义网/政府数据多用 RDF。

## 七、APOC 与 Graph Data Science

- **APOC（Awesome Procedures On Cypher）**：社区/官方的过程库，Cypher 的「**标配扩展**」。提供：①数据导入（`apoc.load.json`/`apoc.load.csv` 从外部加载）；②批量操作（`apoc.periodic.iterate` 大批量分批处理）；③路径工具（`apoc.path.expand` 可控的路径展开）；④图算法桥接；⑤字符串/日期/集合工具。生产 Neo4j 几乎都装 APOC。
- **Graph Data Science（GDS）**：Neo4j 的图算法库，内置 PageRank（影响力）、Louvain（社区发现）、最短路径、中心性、相似度等算法，用于机器学习特征工程、欺诈评分、推荐排序。把图投影到内存图（in-memory graph）做高效计算。

## 下一步

理解了属性图、Cypher、无索引邻接、场景与 APOC 后，下一步深入两个生产关键话题——[图模型与 Cypher 详解](./guide-line/graph-model-and-cypher)（建模原则、Cypher 各命令细节、索引约束）与[使用场景与 APOC](./guide-line/use-cases-and-apoc)（各场景的图查询模式、属性图 vs RDF 取舍、APOC 实战）。
