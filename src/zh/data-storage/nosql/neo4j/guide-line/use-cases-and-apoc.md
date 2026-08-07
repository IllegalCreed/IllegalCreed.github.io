---
layout: doc
outline: [2, 3]
---

# 使用场景与 APOC

> 基于 Neo4j 5.x · 核于 2026-08

## 速查

- **何时该用图库**：数据**关系密集**且查询需要**多跳遍历**（朋友的朋友、共同购买链、团伙关联）。关系库多层 JOIN 性能随深度恶化，图库指针遍历每跳 O(1)。反之，简单 KV、关系清晰的订单、大规模聚合分析不必用图库。
- **推荐系统图模式**：用户-商品-评价图。「买了 A 的人还买了 B」= 用户→购买→A、用户→购买→B 的共同购买路径；「朋友推荐」= 共同好友多的人。Cypher 几跳搞定，关系库多层 JOIN 难表达。
- **欺诈检测图模式**：人-手机-地址-IP-账户图。多个不同人共用同一手机号/地址/IP/银行卡=团伙特征。图能发现「隐藏的关系网络」，循环转账洗钱=环路检测。关系库难表达这类多实体关联。
- **知识图谱图模式**：实体（人/地/组织/概念）+ 关系（出生地/就职于/投资了/属于）。问答系统、搜索引擎、AI 推理的基础。RDF/SPARQL 在此领域标准化强。
- **社交网络图模式**：朋友的朋友（2-3 跳）、影响力传播（PageRank）、社群发现（Louvain）。
- **属性图 vs RDF 取舍**：业务应用（推荐/欺诈/IAM）选属性图（Neo4j/Cypher，边可带属性、易用）；语义网/Linked Data/政府开放数据选 RDF（W3C 标准、SPARQL、URI 命名便于语义互操作）。两者可互转。
- **APOC（Awesome Procedures On Cypher）**：标配过程库。核心用途：①数据导入（`apoc.load.json/csv/jdbc`）；②批量处理（`apoc.periodic.iterate` 分批避免大事务）；③路径工具（`apoc.path.expand` 带过滤的可控展开）；④图算法桥接；⑤字符串/日期/集合工具。
- **Graph Data Science（GDS）**：图算法库（PageRank/Louvain/最短路径/中心性/相似度），把图投影到内存图做高效计算，用于 ML 特征、欺诈评分、推荐排序。
- **Neo4j 局限**：①**分布式扩展有限**（社区版单机，企业版 Fabric 跨库联邦但不如 Cassandra/MongoDB 分片成熟）；②**全图扫描慢**（无索引邻接让遍历快但全扫慢，要靠索引定位起点）；③**不适合大规模聚合分析**（GROUP BY/列式聚合不如 ClickHouse/关系库）。

## 一、推荐系统：图的天然主场

推荐系统是 Neo4j 最经典的场景——「关系本身就是查询重点」：

```cypher
// 「买了 A 的人还买了 B」：与 alice 购买过同一商品的人，还买了什么
MATCH (alice:User {id:'u1'})-[:BOUGHT]->(p:Product)<-[:BOUGHT]-(other:User)
MATCH (other)-[:BOUGHT]->(rec:Product)
WHERE NOT (alice)-[:BOUGHT]->(rec)  // 排除 alice 已买的
RETURN rec.name, count(*) AS score
ORDER BY score DESC LIMIT 5

// 「朋友推荐」：共同好友多但还不是朋友的人
MATCH (me:User {id:'u1'})-[:FRIEND]-(friend)-[:FRIEND]-(candidate)
WHERE NOT (me)-[:FRIEND]-(candidate) AND me <> candidate
RETURN candidate.name, count(DISTINCT friend) AS commonFriends
ORDER BY commonFriends DESC LIMIT 5
```

- **协同过滤的图表达**：传统协同过滤要算用户-商品矩阵的相似度，图库把「共同购买」表达为路径，几跳搞定。
- **多维度融合**：用户-商品-标签-评价-朋友，多类关系融合在一个图里，推荐时自然结合（朋友买的、同类人买的、标签相似的）。
- **可解释性**：图查询能直接给出「为什么推荐」（因为朋友 X 也买了、共同购买 Y 次），比深度学习黑盒推荐更可解释。

## 二、欺诈检测：发现隐藏网络

欺诈检测的核心是发现「**多实体间的隐藏关联**」：

```cypher
// 多人共用同一手机号/地址/IP —— 团伙特征
MATCH (p1:Person)-[:HAS_PHONE]->(phone:Phone)<-[:HAS_PHONE]-(p2:Person)
WHERE p1 <> p2
MATCH (p1)-[:HAS_ADDRESS]->(addr:Address)<-[:HAS_ADDRESS]-(p2)
RETURN p1, p2, phone, addr

// 循环转账洗钱 —— 环路检测
MATCH p = (a:Account)-[:TRANSFERRED*1..5]->(a)
WHERE ALL (x IN relationships(p) WHERE x.amount > 10000)
RETURN p LIMIT 10
```

- **多实体关联**：人 + 手机 + 地址 + IP + 银行卡 + 设备，任意两个实体共享都可能指示团伙。关系库要 JOIN 多张表，图库一个图模式搞定。
- **环路检测**：洗钱常表现为 A→B→C→A 的循环转账，图库用变长路径 `*1..5` 找环，关系库极难表达。
- **图算法加持**：GDS 的社区发现（Louvain）能自动识别紧密关联的团伙，中心性（度中心性）找出团伙核心。

## 三、知识图谱：实体与关系的语义网

知识图谱用图表达「实体-关系-实体」的语义：

```cypher
// 知识图谱片段
(:Person {name:'乔布斯'})-[:BORN_IN]->(:Place {name:'旧金山'})
(:Person {name:'乔布斯'})-[:FOUNDED]->(:Company {name:'Apple'})
(:Company {name:'Apple'})-[:HEADQUARTERED_IN]->(:Place {name:'库比蒂诺'})
(:Company {name:'Apple'})-[:PRODUCES]->(:Product {name:'iPhone'})

// 问答：「Apple 创始人出生在哪里？」——多跳推理
MATCH (c:Company {name:'Apple'})<-[:FOUNDED]-(p:Person)-[:BORN_IN]->(place:Place)
RETURN p.name, place.name
```

- **语义网与 RDF**：知识图谱在语义网/Linked Data 领域多用 RDF（W3C 标准）。RDF 用三元组（主-谓-宾）+ URI 命名，便于跨数据集语义互操作（如 DBpedia/Wikidata）。SPARQL 是 RDF 的查询语言。
- **属性图 vs RDF**：业务知识图谱（企业内部实体关系）常用属性图（边带属性、易用）；开放语义网（跨组织互联）常用 RDF（标准化）。Neo4j 也支持 RDF 导入（`n10s` 插件）和 SPARQL。

## 四、社交网络与图算法

```cypher
// 朋友的朋友（二度人脉）
MATCH (me:User {id:'u1'})-[:FRIEND*2..2]-(fof)
WHERE NOT (me)-[:FRIEND]-(fof)
RETURN DISTINCT fof

// 影响力（用 GDS 跑 PageRank）
CALL gds.pageRank.stream('friendGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS name, score
ORDER BY score DESC LIMIT 10
```

- **社群发现（Louvain）**：把紧密连接的用户聚类成社群，用于精准营销、推荐分组。
- **影响力传播**：PageRank/中心性找出 KOL（关键意见领袖），营销投放优先这些节点。
- **最短路径**：信息传播路径、社交距离。

## 五、属性图 vs RDF：深度对比

两种图模型的根本差异：

| 维度 | 属性图（Neo4j） | RDF |
| --- | --- | --- |
| **数据单元** | 节点 + 关系（边）+ 属性 | 三元组（主语 subject-谓语 predicate-宾语 object） |
| **边带属性** | ✅ 直接支持（关系是一等公民，可挂多个属性） | ❌ 边不能直接带属性，要 reification（把边变成节点再描述） |
| **查询语言** | Cypher（openCypher 标准化中） | SPARQL（W3C 标准，成熟） |
| **标识** | 内部 ID + 标签 | URI（统一资源标识，全局唯一，便于语义互操作） |
| **schema** | 动态（可加约束） | 可选（RDFS/OWL 本体描述，强语义推理） |
| **易用性** | 高（属性灵活、Cypher 直观） | 中（三元组繁琐、URI 命名冗长） |
| **标准化** | 厂商主导（openCypher/PGQL） | W3C 国际标准（RDF/SPARQL/OWL） |
| **典型场景** | 业务图（推荐/欺诈/IAM/企业知识图谱） | 语义网、Linked Data、政府开放数据、学术研究 |

**选型建议**：业务应用（需要快速开发、边带属性、可视化）选 Neo4j（属性图）；需要跨组织语义互操作、与 Wikidata/DBpedia 等 LOD 数据集互联、需要 OWL 本体推理的选 RDF/SPARQL。Neo4j 通过 `n10s`（RDF 插件）支持 RDF 互转，兼顾两者。

## 六、APOC：Cypher 的标配扩展

APOC 提供 Cypher 不内置的工具，生产 Neo4j 几乎都装：

```cypher
// 数据导入：从 JSON 文件加载节点
CALL apoc.load.json('file:///users.json')
YIELD value
CREATE (u:User) SET u = value

// 批量处理：分批避免大事务（大事务会撑爆内存/超时）
CALL apoc.periodic.iterate(
  'MATCH (n:OldLabel) RETURN n',           // 外循环：取数据
  'SET n:NewLabel SET n.processed = true', // 内循环：处理
  {batchSize: 1000, parallel: true}        // 每批 1000，并行
)

// 可控路径展开：限制深度 + 关系类型 + 过滤
MATCH (start:User {id:'u1'})
CALL apoc.path.expand(start, 'FRIEND>|WORKS_WITH>', null, 1, 3)
YIELD path
RETURN path

// 图算法桥接 / 字符串 / 日期工具
RETURN apoc.text.capitalize(name), apoc.date.format(timestamp())
```

- **`apoc.periodic.iterate`**：批量处理的利器。Cypher 单事务处理百万节点会撑爆事务日志与内存，iterate 分批提交（每批独立事务），稳定处理大数据量。
- **`apoc.load.*`**：从 JSON/CSV/JDBC/REST API 加载数据到图。
- **`apoc.path.expand`**：比 Cypher 的 `*N..M` 更可控的路径展开（可限定关系类型序列、深度、节点过滤）。

## 七、Neo4j 的局限与何时不用

图库不是银弹，以下场景不适合：

- **简单 KV / 缓存**：用 Redis，图库大材小用。
- **关系清晰的订单/事务系统**：订单-用户-商品关系简单，关系库（MySQL）+ 外键更合适。强一致金融事务用关系库。
- **大规模聚合分析（OLAP）**：GROUP BY、求和、统计用列式存储（ClickHouse）或关系库，图库不擅长。
- **超大规模全图遍历**：图库无索引邻接让定点遍历快，但「无起点」的全图遍历（如统计全图 PageRank）在超大规模图上要靠 GDS 投影到内存图，仍受单机内存限制（分布式分片不如 Cassandra/MongoDB 成熟）。
- **强 schema 需求**：图库 schema 动态，要强约束用关系库。

**用图库的信号**：你会反复写多层 JOIN、查询里有「朋友的朋友」「关联的关联」「路径」「环路」「最短路径」、关系本身就是业务核心——这时上 Neo4j。

## 下一步

掌握了图模型、Cypher、典型场景与 APOC 后，下一步看[参考](../reference)——Cypher 命令速查、图模型术语、场景决策表、易错点清单，作为日常查阅与面试复习的速查手册。
