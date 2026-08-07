---
layout: doc
outline: [2, 3]
---

# 参考：倒排索引、DSL 速查与易错点

> 基于 Elasticsearch 8.x / OpenSearch 2.x · 核于 2026-08

## 速查

- **定义**：基于 Apache Lucene 的分布式、RESTful、近实时（NRT）全文搜索与分析引擎。
- **倒排索引**：词 → 文档列表，全文检索近乎 O(1)。配合 BM25 打分、doc values 排序聚合。
- **分片/副本**：主分片数建索引定、不可改（建议单分片 30-50GB）；副本可动态改，提供高可用 + 读扩展。
- **近实时**：默认每 1 秒 refresh（buffer→segment），所以新写文档 1 秒后可搜。translog 保证持久，flush 持久化到磁盘。
- **DSL 查询**：query 上下文算分（BM25），filter 上下文不算分可缓存。match（全文，分词）vs term（精确，不分词）。
- **聚合**：类似 GROUP BY，基于 doc values 正排结构，实时分组统计。
- **许可历史**：Apache 2.0（至 7.10）→ SSPL/ELv2（2021，AWS fork 出 OpenSearch）→ 加 AGPL（2024，回归 OSI 开源）。
- **向量搜索**：dense_vector 字段 + HNSW kNN，从关键词扩展到语义检索，支撑 RAG。生产用 BM25 + kNN 混合搜索 + RRF 融合。
- **典型场景**：电商搜索、ELK 日志分析、文档站搜索、地理查询、LLM RAG 知识库。

## 一、倒排索引结构速查

```
Lucene segment（不可变）
├── 词条字典（term dictionary，FST 压缩）：词元 → postings list 指针
├── 倒排表（postings list）：词元 → [doc_id, 词频, 位置, 偏移]
├── doc values（正排，列式）：doc_id → 字段值（排序、聚合用）
├── stored fields：原始字段值（_source 返回用）
└── norms：文档长度归一化（打分用）
```

| 结构 | 用途 | 查询类型 |
| --- | --- | --- |
| 倒排表（postings） | 词 → 文档 | match 全文检索 |
| doc values（正排） | 文档 → 字段值 | sort、aggregation、script |
| stored fields | 原始值 | _source 返回 |
| FST 词条字典 | 词压缩定位 | term/match 快速查找 |

## 二、DSL 查询速查

```json
// match：全文检索（先分词再查倒排）
{ "match": { "title": "分布式数据库" } }

// term：精确匹配（不分词，用于 keyword/数字/IP）
{ "term": { "status.keyword": "published" } }

// range：范围
{ "range": { "date": { "gte": "2026-01-01", "lt": "2026-02-01" } } }

// bool：布尔组合
{ "bool": {
    "must":     [{ "match": { "title": "分布式" } }],          // 必须，算分
    "should":   [{ "match": { "tag": "NoSQL" } }],            // 可选，加分
    "must_not": [{ "term": { "deleted": true } }],            // 必须不
    "filter":   [{ "range": { "views": { "gte": 100 } } }]    // 必须，不算分，可缓存
}}

// match_phrase：短语（顺序 + 位置接近）
{ "match_phrase": { "title": "分布式 数据库" } }

// multi_match：多字段（可加权）
{ "multi_match": { "query": "Cassandra", "fields": ["title^3", "content"] } }

// 聚合（类 GROUP BY）
{ "size": 0, "aggs": {
    "by_cat": { "terms": { "field": "category.keyword", "size": 10 } },
    "price_stats": { "stats": { "field": "price" } }      // min/max/avg/sum/count
}}

// kNN 向量搜索
{ "knn": { "field": "embedding", "query_vector": [...], "k": 10, "num_candidates": 100 } }

// 混合搜索 + RRF 融合
{ "query": { "match": { "content": "..." } },
  "knn":   { "field": "embedding", "query_vector": [...], "k": 10, "num_candidates": 100 },
  "rank":  { "rrf": { "window_size": 50, "rank_constant": 20 } } }
```

## 三、分片与节点策略

| 维度 | 建议 |
| --- | --- |
| **主分片数** | 建索引定，不可改；按 `数据量 / 30~50GB` 预估 |
| **副本数** | 可动态改；生产至少 1，读密集可加 |
| **单分片大小** | 30-50GB 最佳；超 100GB 查询与 merge 慢 |
| **节点角色** | master-eligible / data / coordinating / ingest 分离 |
| **堆内存** | 物理内存的 50% 以下（留一半给 Lucene 堆外文件缓存） |
| **索引生命周期（ILM）** | 时序数据按天建索引、rollover、shrink、delete |

## 四、写入持久性链路

| 阶段 | 动作 | 频率/触发 | 结果 |
| --- | --- | --- | --- |
| 写入 | 写 translog + 内存 buffer | 每次写 | 已确认、可恢复、暂不可搜 |
| **refresh** | buffer → 新 segment（堆外，可搜） | 默认每 1 秒 | **1 秒后可被搜到**（近实时） |
| **flush** | segment 持久化到磁盘 + 清 translog | 定期（translog 大小/时间） | 持久化、崩溃不丢已 flush 的 |
| merge | 合并小 segment、清删除标记 | 后台持续 | 减少 segment 数、回收空间 |

## 五、ES vs OpenSearch vs Solr vs 关系库

| 维度 | Elasticsearch | OpenSearch | Solr | MySQL（关系库） |
| --- | --- | --- | --- | --- |
| 底层 | Lucene | Lucene | Lucene | InnoDB |
| 分布式 | 原生 | 原生 | SolrCloud（复杂） | 分库分表 |
| 全文搜索 | 强（倒排 + BM25） | 强（同 ES） | 强（同 Lucene） | 弱（LIKE 全表扫描） |
| 聚合分析 | 强（aggregation） | 强 | 强（faceting） | 弱（GROUP BY 慢） |
| 事务 | 单文档原子 | 单文档原子 | 无 | ACID |
| 许可 | AGPL/SSPL/ELv2/Apache | Apache 2.0 | Apache 2.0 | GPL/商业 |
| 治理 | Elastic 公司 | Linux Foundation | Apache 社区 | Oracle/社区 |

## 六、易错点清单

- **「Elasticsearch 是开源软件」**：2021-2024 间不算（SSPL/ELv2 非 OSI 认可）。2024 加 AGPL 后才「回归开源」（但 AGPL 有传染性顾虑）。
- **「ES 查询是实时的」**：错。是**近实时（NRT）**，写入约 1 秒后（refresh）才能被搜到。强实时要手动 refresh（代价大）。
- **「对 text 字段用 term 能查到原始值」**：错。text 字段存的是分词后的小写词元，要用 `match` 或对 `.keyword` 子字段用 `term`。
- **「主分片数可以随时改」**：错。`number_of_shards` 建索引定死，改了文档找不到。要 reindex 或 split。
- **「filter 比 query 慢因为要遍历」**：错。filter 不算分且结果**可缓存**（位图），相同过滤二次查询极快，应优先用 filter。
- **「ES 适合做主数据库做事务」**：错。ES 单文档原子、多文档无 ACID 事务、频繁更新代价大。它是搜索/分析引擎，主存要用关系库或 NoSQL。
- **「聚合用倒排索引」**：错。聚合用 **doc values（正排结构）**，不是倒排索引。关掉 doc_values 的字段不能聚合。
- **「向量搜索能完全替代 BM25」**：错。向量擅长语义（同义词、近义），但精确关键词（产品名、专有名词、代码标识）BM25 更准。生产用混合搜索（BM25 + kNN + RRF）。
- **「OpenSearch 就是改了名字的 ES」**：部分错。早期 fork 自 ES 7.10 兼容，但已独立演化（k-NN plugin、neural-search、ML Commons 是自己的），新功能不再同步。
- **「AGPL 许可对所有人无影响」**：错。AGPL 有网络传染性（提供网络服务要开源自己栈），商业 SaaS 要评估，或用 ELv2 + 付费豁免，或选 OpenSearch。

## 七、进阶方向（链接其他叶）

- [Cassandra](../cassandra/) —— 宽列 NoSQL，与 ES 互补（Cassandra 存原始数据，ES 做搜索索引）
- [关系型数据库](../)（MySQL/PostgreSQL）—— OLTP 事务与 ES 的边界
- [ClickHouse](../)（分析型）—— 大规模聚合分析的对比

## 权威链接

- [Elasticsearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Apache Lucene 官方文档](https://lucene.apache.org/core/)
- [OpenSearch 官方文档](https://opensearch.org/docs/latest/)
- [Elastic 许可变更公告（2024 AGPL）](https://www.elastic.co/blog/elasticsearch-is-open-source-again)
- [Elasticsearch Wikipedia](https://en.wikipedia.org/wiki/Elasticsearch)
- 本站幻灯片：<a href="/SlideStack/elasticsearch-slide/" target="_blank">Elasticsearch</a>
