---
layout: doc
outline: [2, 3]
---

# 图模型与 Cypher 详解

> 基于 Neo4j 5.x · 核于 2026-08

## 速查

- **节点（Node）**：实体单位，可带多个**标签（Label）**分类（`:Person:Actor`）和属性。标签用于索引、约束、查询过滤。节点不存关系详情，只存指向关系的指针（无索引邻接）。
- **关系（Relationship）**：节点间**有向**连接。必须有：①**类型（Type）**（如 `:ACTED_IN`）；②**起止节点**（关系不能悬空，必须有 startNode 和 endNode）。可带属性。关系类型在查询里用 `[:TYPE]` 指定。关系是图库的「**一等公民**」——预先连接存储，遍历 O(1)。
- **属性（Property）**：key-value，挂在节点或关系上。支持 string/int/float/bool/date/datetime/point/array（同质数组）。schema 动态，不同节点可有不同属性。
- **建模原则**：①**实体做节点**（人/电影/商品）；②**实体间的关系做边**（认识/演出/购买）；③**属性挂节点或边**（数量少且固定）；④**类别做标签/类型，不做节点**（把「类型」抽成独立节点连接会过度规范化，查询变深变慢）；⑤**属性 vs 关系**——值固定且只用于过滤/返回的做属性，需要被遍历或带属性的做关系/节点。
- **Cypher 模式匹配**：`MATCH (pattern)` 声明图模式，Neo4j 找所有匹配子图。`(node)` 节点、`-[rel]->` 关系、`{prop:val}` 属性、`:Label/:TYPE` 类型。模式是「**声明式**」——你说要什么形状，不说怎么找。
- **核心命令**：`MATCH`（查找）/ `CREATE`（新建，重复执行建多个）/ `MERGE`（幂等，不存在才建）/ `SET`（改属性）/ `DELETE`（删，节点有关系会报错）/ `DETACH DELETE`（删节点连带关系）/ `REMOVE`（删标签/属性）。
- **`MERGE` 防重复**：`MERGE` 整个模式（节点或关系的全属性），存在则匹配、不存在才建。配合唯一约束（`CREATE CONSTRAINT ... REQUIRE ... IS UNIQUE`）保证幂等性。`MERGE (n {name:'a'}) SET n.created = timestamp()` 这种用法设置只在新建时的属性。
- **变长路径**：`-[:KNOWS*2..3]-` 表示 2 到 3 跳的 KNOWS 路径；`*` 表示 1 到任意跳；`*0..` 表示 0 跳起（含自身）。常用于「朋友的朋友」「N 度人脉」。
- **索引**：定位遍历起点的点查要索引（`CREATE INDEX FOR (n:Person) ON (n.name)`）。遍历本身靠邻接无需索引。**唯一约束**（`REQUIRE n.email IS UNIQUE`）自动建索引并保证唯一。
- **无索引邻接原理**：节点物理存指向其入边/出边的指针，关系存起止节点指针。遍历 = 跟指针，每跳 O(1)，不随数据总量恶化，只随遍历经过的边数增长。

## 一、属性图三要素与建模原则

属性图模型用三要素表达世界：节点、关系、属性。

### 节点（Node）

```cypher
// 一个带 Person 标签和属性的节点
(:Person {name: 'alice', born: 1985, email: 'alice@x.com'})
```

- **标签（Label）**：节点的分类，可多个（`:Person:Director` 表示既是人又是导演）。标签用于查询过滤（`MATCH (n:Person)`）和索引/约束。
- **属性**：key-value 对，挂在节点上。schema 动态，不同 `:Person` 节点可有不同属性。

### 关系（Relationship）

```cypher
// alice 演出了 Matrix，关系带 roles 属性
(:Person {name:'alice'})-[:ACTED_IN {roles:['Neo']]}]->(:Movie {title:'Matrix'})
```

- **有向**：关系必须有方向（建时指定 `->`），查询时可忽略方向（`--`）。
- **类型（Type）**：必须有，如 `:ACTED_IN`/`:KNOWS`/`:BOUGHT`/`:REVIEWED`。
- **起止节点**：关系不能悬空，删除起止节点会连带删除其关系。
- **带属性**：关系的属性（如 `roles`/`since`/`rating`/`weight`）是属性图的核心优势——RDF 的边不能直接带属性。

### 建模原则（什么做节点、什么做关系）

- **实体做节点**：人、电影、商品、订单、地点——世界里的「名词」。
- **实体间的关系做边**：认识、演出、购买、居住——「动词」连接实体。
- **类别做标签/类型，不做节点**：常见错误是把「类型」抽成独立节点（如 `(movie)-[:OF_TYPE]->(:Genre {name:'Sci-Fi'})`），这会让查询变深变慢。除非类型有自身属性或要被独立遍历，否则用属性或标签（`(m:Movie {genre:'Sci-Fi'})` 或多个标签）。
- **属性 vs 关系/节点**：值固定且只用于过滤/返回的做属性（如年龄、邮箱）；需要被遍历或自身带属性的做关系或节点（如「演出」带角色、「购买」带数量）。
- **避免过度规范化**：图建模追求「**查询路径短**」，不像关系库追求「**消除冗余到第三范式**」。适度冗余让查询更直接是图库的常态。

## 二、Cypher 模式匹配

Cypher 是声明式图查询语言——你声明要找的图模式（形状），Neo4j 在图里找所有匹配：

```cypher
// 模式：alice 认识的人里，谁是 bob 也认识的
MATCH (alice:Person {name:'alice'})-[:KNOWS]->(common)
MATCH (bob:Person {name:'bob'})-[:KNOWS]->(common)
WHERE common <> alice AND common <> bob
RETURN common.name
```

- **`(node)`**：圆括号画节点。`:Label` 指定标签，`{prop:val}` 指定属性（可作为定位条件）。
- **`-[rel]->`**：方括号画关系。`-[]->` 有向，`--` 无向，`<-[]-` 反向。`:TYPE` 指定类型，`{prop:val}` 属性，`*2..3` 变长路径。
- **变量**：`(a)`/`-[r]-` 给节点/关系起变量名，后续 `WHERE`/`RETURN` 引用。
- **多个 MATCH**：用共同变量连接（如上例的 `common`），相当于模式间的连接。
- **WHERE**：过滤条件，比 `MATCH` 里的 `{}` 更灵活（支持不等、范围、逻辑组合、`EXISTS` 子查询）。

## 三、CREATE / MERGE / DELETE

```cypher
// CREATE：总是新建（重复执行建多个）
CREATE (a:Person {name:'alice', born:1985})

// MERGE：幂等（不存在才建，存在则匹配）——防重复
MERGE (a:Person {name:'alice'})  // 按 name 唯一定位
  ON CREATE SET a.created = timestamp()  // 只在新建时设
  ON MATCH SET a.lastSeen = timestamp()   // 只在已存在时设

// 关系也要 MERGE（两端节点先 MERGE 再 MERGE 关系）
MERGE (a:Person {name:'alice'})
MERGE (m:Movie {title:'Matrix'})
MERGE (a)-[:ACTED_IN {roles:['Neo']}]->(m)

// SET：修改属性
MATCH (a:Person {name:'alice'}) SET a.age = 40

// DELETE：删节点（若有关系会报错）
MATCH (n {name:'temp'}) DELETE n
// DETACH DELETE：删节点连带关系
MATCH (n {name:'temp'}) DETACH DELETE n
```

- **`MERGE` 防重复的关键**：用能唯一标识的属性（配合唯一约束）做 MERGE 条件。如果用非唯一属性 MERGE，可能匹配到多个节点导致不确定行为。
- **删除节点的关系**：节点有关系时直接 `DELETE` 会报错，必须先删关系或用 `DETACH DELETE`（连带删）。

## 四、变长路径与图遍历

图查询的威力在变长路径——表达「N 跳」「最短路径」「所有路径」：

```cypher
// 朋友的朋友（恰好 2 跳）
MATCH (a:Person {name:'alice'})-[:KNOWS*2..2]-(fof)
RETURN DISTINCT fof.name

// 1 到 3 跳内的认识链
MATCH (a:Person {name:'alice'})-[:KNOWS*1..3]-(chain)
RETURN chain

// 任意跳（慎用，可能爆炸）
MATCH (a:Person {name:'alice'})-[:KNOWS*]-(reachable)
RETURN reachable

// 最短路径（两个节点间）
MATCH p = shortestPath(
  (a:Person {name:'alice'})-[:KNOWS*]-(b:Person {name:'bob'})
)
RETURN p

// 所有最短路径
MATCH p = allShortestPaths(
  (a:Person {name:'alice'})-[:KNOWS*]-(b:Person {name:'bob'})
)
RETURN p
```

- **`*N..M`**：N 到 M 跳。`*N` 表示 N 跳及以上。`*..M` 表示最多 M 跳。`*` 表示 1 到任意跳。
- **无向 `--` vs 有向 `->`**：朋友关系通常无向（`-[:KNOWS*2]-`），有向关系（如「关注」）用 `->`。
- **变长路径爆炸**：`*`（任意跳）在稠密图上会遍历海量路径，要加 `LIMIT` 或限定跳数防止爆炸。

## 五、索引与约束

```cypher
// 节点属性索引（定位遍历起点）
CREATE INDEX FOR (n:Person) ON (n.name)
CREATE INDEX FOR (n:Person) ON (n.email)

// 复合索引（Neo4j 4.3+）
CREATE INDEX FOR (n:Person) ON (n.lastname, n.firstname)

// 唯一约束（自动建索引 + 保证唯一）
CREATE CONSTRAINT FOR (n:Person) REQUIRE n.email IS UNIQUE

// 存在约束（属性必填）
CREATE CONSTRAINT FOR (n:Person) REQUIRE n.name IS NOT NULL

// 关系属性索引（5.0+）
CREATE INDEX FOR ()-[r:REVIEWED]-() ON (r.rating)
```

- **索引的作用边界**：**只在定位遍历起点的「点查」有用**（`MATCH (n:Person {email:'a@x.com'})`）。一旦定位到起点，后续遍历靠无索引邻接的指针，不走索引。
- **无索引的代价**：不给属性建索引，按属性定位节点要**全节点扫描**（千万节点级慢）。所以常用查询条件都要建索引。
- **约束**：唯一约束（防重复，配合 MERGE）、存在约束（属性必填）。约束自动建索引。

## 六、无索引邻接的物理原理

Neo4j 在关系遍历上快的根本，是物理存储层的**无索引邻接**：

- **节点存关系指针**：每个节点物理上存指向其所有入边和出边的指针列表。要找「A 的朋友」，直接读 A 的出边指针列表，O(1)。
- **关系存起止节点指针**：每条关系存 startNode 和 endNode 的指针。跟随到下一节点也是 O(1)。
- **不依赖索引**：遍历不需要查索引表（关系库 JOIN 要查外键索引），所以叫「无索引」邻接。
- **对比关系库 JOIN**：关系库的朋友表是 `(from_id, to_id)` 行，查「A 的朋友」要 `SELECT to_id FROM friend WHERE from_id = A.id`——靠 from_id 上的 B 树索引查找，每跳一次索引查找 + 行读取。多跳 = 多次索引查找，复杂度随深度恶化。
- **代价**：无索引邻接让遍历快，但**全图扫描慢**（无全局索引），且**写入维护指针有开销**（关系库加一行就行，图库要更新两端节点的指针列表）。所以图库适合「读多写少、关系密集、遍历为主」的场景。

## 下一步

图模型与 Cypher 讲完后，下一步进入实际场景与工具——[使用场景与 APOC](./use-cases-and-apoc)，讲清推荐/欺诈/知识图谱/社交网络的典型图查询模式、属性图 vs RDF 的取舍、APOC 实战与 GDS 图算法。
