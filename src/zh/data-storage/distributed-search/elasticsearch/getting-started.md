---
layout: doc
outline: [2, 3]
---

# 入门：倒排索引、分片与 DSL 查询

> 基于 Elasticsearch 8.x · 核于 2026-08

## 速查

- **定义**：Elasticsearch（ES）是基于 **Apache Lucene** 的**分布式、RESTful、近实时（NRT）全文搜索与分析引擎**。核心能力是全文检索（倒排索引）+ 聚合分析，既是搜索引擎也是分析引擎（ELK 栈核心）。
- **倒排索引（Inverted Index）**：ES 快的根本原因。把文档经分词后，建立「词 → 包含该词的文档列表」的映射。检索时直接查词对应的文档列表，近乎 O(1)——这是关系库 B+ 树索引做不到的（B+ 树适合等值/范围，不适合「包含某词」的全文检索）。
- **分片（Shard）**：索引（index）的水平切分单元。每个分片是一个独立的 Lucene 索引，分布在节点上。**主分片数（number_of_shards）建索引时定、不可改**（要改得 reindex）。分片解决单机容量与吞吐上限——数据量越大，分片越多。
- **副本（Replica）**：主分片的拷贝，提供**高可用**（主分片节点宕机，副本升主）与**读扩展**（查询可并行打到副本）。副本数（number_of_replicas）可动态调整。
- **近实时（NRT, Near Real-Time）**：文档写入后约 **1 秒**（默认 `refresh_interval`）后可被搜到——因为 ES 默认每秒把内存 buffer 刷新（refresh）成新的 Lucene segment 才能被检索。强实时要手动 `_refresh`（代价大，慎用）。
- **DSL 查询（Query DSL）**：JSON 格式的查询语法，分两大类——**query（全查询，参与算分）**与**filter（过滤，不算分，结果可缓存）**。支持 match（全文）、term（精确）、bool（布尔组合 must/must_not/should/filter）、range、聚合（aggregation）等。
- **聚合（Aggregation）**：类似 SQL 的 GROUP BY + 聚合函数，能实时对海量数据做分组统计、直方图、百分位——让 ES 既是搜索引擎也是分析引擎。
- **Lucene**：ES 底层的全文检索库（Apache 顶级项目）。ES 的每个分片本质上是一个 Lucene 索引。Lucene 提供 segment、倒排索引、打分（BM25）等核心能力；ES 在其上加了分布式、RESTful、集群管理。
- **索引（index）→ 映射（mapping）→ 文档（document）**：index 类似数据库的表，mapping 定义字段类型（类似 schema），document 是一条 JSON 记录（类似行）。
- **典型场景**：电商商品搜索、应用日志检索（ELK）、监控指标分析、维基百科/文档站搜索、地理位置查询。代表用户：维基百科、GitHub（代码搜索）、Netflix、Uber。
- **不适合**：OLTP 事务（无 ACID）、频繁按主键更新、强实时、小数据量（关系库更简单）。
- **进阶顺序**：[倒排索引与 DSL 查询](./guide-line/inverted-index-and-search) → [OpenSearch 分叉与向量搜索](./guide-line/opensearch-and-vector) → [参考](./reference)。

## 一、为什么有 Elasticsearch：全文搜索的痛点

传统关系库做「找出 title 包含『分布式』的所有文章」要靠 `LIKE '%分布式%'`——这会触发**全表扫描**（B+ 树索引对 `LIKE '%x%'` 无效，因为前缀通配），数据量大时极慢。更糟的是无法按相关性排序（哪个文档更匹配？）、无法分词（"distributed system" 应该匹配 "distributed" 和 "system"）。

全文搜索引擎的核心是**倒排索引**：先对文档**分词**（"分布式数据库" → ["分布式", "数据库"]），再建立「词 → 文档列表」的映射。检索时直接查这个词对应的文档列表，近乎 O(1) 命中，还能按词频（TF）、文档稀有度（IDF）算相关性打分（BM25），按匹配度排序。这正是 Lucene 与 ES 的核心价值。

ES 在 Lucene 之上加了**分布式**：把数据按分片分散到多节点，横向扩展容量与吞吐；副本提供高可用与读扩展。配合 **RESTful HTTP + JSON** 接口和 **Kibana** 可视化，形成了易用的「搜索 + 分析」平台（ELK 栈：Elasticsearch + Logstash + Kibana）。

## 二、倒排索引：ES 为什么这么快

倒排索引是全文搜索的物理基础。对比关系库的「正向索引」（文档 ID → 内容），倒排索引是反向的（词 → 文档列表）：

```
文档 1: "分布式数据库 Cassandra"
文档 2: "Cassandra 是宽列数据库"
文档 3: "MongoDB 文档数据库"

分词后建立倒排索引：
  词           → 文档列表（带词频/位置）
  ────────────────────────────────
  分布式       → [1]
  数据库       → [1, 2, 3]   ← 3 个文档都包含
  Cassandra   → [1, 2]
  宽列        → [2]
  MongoDB     → [3]
  文档        → [3]

检索 "Cassandra 数据库"：
  → 查 "Cassandra" 得 [1,2]，查 "数据库" 得 [1,2,3]
  → 交集/并集 → [1,2]（1 两个词都有，打分更高）
  → 按 BM25 打分排序返回
```

- **分词（Analysis）**：写入时用 **analyzer** 把文本拆成词元（token），小写化、去停用词（the/a/an）、词干化（running→run）。中文要用 IK/pinyin 分词器。分词质量决定搜索质量。
- **打分（Scoring）**：用 **BM25**（默认，比 TF-IDF 更好）算每个文档的相关性分数。词频越高（TF）、词越稀有（IDF）、文档越短，分数越高。
- **segment（段）**：Lucene 把倒排索引存成不可变的 segment，写入时追加新 segment，后台 merge 合并小 segment。refresh 把内存 buffer 写成新 segment 才能被搜到——这就是「近实时」的来源（约 1 秒延迟）。

## 三、分片与副本：分布式扩展

ES 用分片和副本实现横向扩展与高可用：

```
索引 "products"
  ├── 主分片 0（节点 A）── 副本 0（节点 B）  ← 副本提供高可用 + 读扩展
  ├── 主分片 1（节点 B）── 副本 1（节点 C）
  └── 主分片 2（节点 C）── 副本 2（节点 A）

查询 "手机" → 协调节点把请求分发到各分片 → 各自分片本地查询
            → 汇总排序 → 返回结果
```

- **主分片（primary shard）**：数据水平切分的单元。**数量建索引时定，之后不可改**（要改得 reindex 或 split）。所以建索引要预估容量（建议单分片 30-50GB）。
- **副本分片（replica shard）**：主分片的拷贝。**数量可动态改**。主分片宕机，副本升主，保证可用。副本还能分担读请求（读可打到副本）。
- **路由（routing）**：文档按 `hash(routing) % number_of_primary_shards` 落到某主分片。默认 routing 是文档 _id。这决定了「同一文档永远在同一主分片」。
- **节点角色**：现代 ES 区分 **master-eligible**（主节点候选，管集群状态）、**data**（存数据、执行查询）、**coordinating**（协调节点，接收请求分发汇总）、**ingest**（数据预处理）。生产建议角色分离。

## 四、DSL 查询：JSON 格式的强大语法

ES 的查询用 **Query DSL**（JSON），分两大类：

- **query 上下文**：参与算分（「这个文档有多匹配」），用 BM25。如 `match`（全文检索）、`multi_match`（多字段）、`bool`（布尔组合）。
- **filter 上下文**：只判断「匹配/不匹配」，**不算分**，结果可缓存。如 `term`（精确值）、`range`（范围）、`exists`。能用 filter 就用 filter（更快且缓存）。

```json
// 查询：title 含"分布式"且 status 为 published，按时间倒序，聚合每个分类的文档数
GET /articles/_search
{
  "query": {
    "bool": {
      "must":     [{ "match": { "title": "分布式" } }],          // 算分
      "filter":   [{ "term":  { "status": "published" } }],      // 不算分，缓存
      "must_not": [{ "term":  { "deleted": true } }]
    }
  },
  "sort": [{ "publish_date": "desc" }],
  "aggs": {                                    // 聚合（类似 GROUP BY）
    "by_category": { "terms": { "field": "category", "size": 10 } }
  }
}
```

- **match vs term**：`match` 用于全文文本（先分词再查），`term` 用于精确值（不分词，如状态码、ID）。常见坑：对 text 字段用 `term` 查不到——因为 text 字段存的是分词后的词元，要用 `match` 或对 `.keyword` 子字段用 `term`。
- **bool 组合**：`must`（必须匹配，算分）、`should`（至少一个匹配，可设 minimum_should_match）、`must_not`（必须不匹配）、`filter`（必须匹配，不算分）。filter 比 must 快（不算分、可缓存）。
- **聚合（aggregation）**：类似 SQL 的 `GROUP BY + COUNT/SUM/AVG`，能实时分组统计、直方图（histogram）、百分位（percentiles）、嵌套聚合。这是 ES 作为「分析引擎」的核心。

## 五、近实时（NRT）：写入到可查的 1 秒

ES 不是真实时——文档写入后约 1 秒才能被搜到，原因在写入路径：

```
写文档 → 写 translog（持久日志，崩溃可恢复）+ 内存 buffer
       → 默认每 1 秒 refresh：把 buffer 写成新的 Lucene segment（内存中，可被搜到）
       → translog 定期 flush：把内存 segment 持久化到磁盘 + 清 translog
```

- **refresh**：把内存 buffer 转成可搜索的 segment。默认每 1 秒一次，所以新写文档 1 秒后可搜。强实时场景可手动 `_refresh`，但代价是大量小 segment + 后台 merge 压力，慎用。
- **flush**：把 segment 持久化到磁盘 + 清 translog。比 refresh 重得多，定期执行保证持久性。
- **translog**：类似数据库的 WAL，写入先落 translog（顺序追加，快），崩溃后重放恢复。这保证已确认的写不丢。

## 六、典型场景与边界

ES 的甜蜜区是「**全文搜索 + 实时分析 + 海量数据 + 模糊/相关性匹配**」：

- **电商商品搜索**：按标题/描述/标签搜索，按相关性 + 销量排序，按价格/品牌聚合过滤。
- **应用日志检索（ELK）**：Logstash 采集、ES 存储、Kibana 可视化。海量日志按关键词、时间范围、字段聚合排查问题。
- **文档/维基搜索**：维基百科用 ES 搜索全文，GitHub 用 ES 搜索代码。
- **监控指标分析**：时序指标存储 + 聚合（虽不如专用时序库如 InfluxDB，但胜在统一栈）。
- **地理位置**：附近的人、配送范围、门店定位（geo_point + geo_distance 查询）。

**不适合 ES**：

- **OLTP 事务**（转账要 ACID）——用关系库。ES 单文档原子，多文档不保证事务。
- **频繁按主键更新**——ES 更新要重新索引整个文档 + 刷新 segment，代价大。
- **强实时**（写入立即查）——ES 近实时 1 秒延迟，强实时要用强行 refresh（代价大）或专用实时库。
- **小数据量**——关系库 + LIKE 可能就够，ES 运维复杂度高不划算。

## 下一步

理解了 ES 的倒排索引、分片/副本、DSL 查询后，下一步深入两个核心——[倒排索引与 DSL 查询](./guide-line/inverted-index-and-search)（Lucene segment、refresh/flush、query/filter 区别、聚合原理）与[OpenSearch 分叉与向量搜索](./guide-line/opensearch-and-vector)（AWS fork 历史、许可变更、dense_vector 与 kNN、RAG 场景）。
