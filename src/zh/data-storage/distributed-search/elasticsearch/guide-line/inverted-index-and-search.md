---
layout: doc
outline: [2, 3]
---

# 倒排索引与 DSL 查询：Lucene、分片与聚合

> 基于 Elasticsearch 8.x · 核于 2026-08

## 速查

- **Lucene segment（段）**：ES 每个分片是一个 Lucene 索引，由多个**不可变 segment**组成。每个 segment 是独立的倒排索引。写入生成新 segment，后台 **merge** 合并小 segment 减少碎片。segment 不可变让并发读无锁，但更新要重新索引整个文档。
- **倒排索引三件套**：①**词条字典（term dictionary）**：所有词元的有序表，用 FST（有限状态转换）压缩内存；②**倒排表（postings list）**：每个词对应的文档列表（含词频、位置、偏移）；③**doc values**：正排结构（文档→字段值），用于排序和聚合（因为倒排索引不适合「取文档某字段值排序」）。
- **分词（Analysis）**：写入用 **index analyzer** 分词建索引，查询用 **search analyzer** 分词后查倒排索引。中文要用 IK 等分词器。分词质量直接决定搜索质量——分词错则召回错。
- **BM25 打分**：ES 默认相关性算法（比 TF-IDF 更好）。考虑词频（TF，某文档中词越多越相关）、逆文档频率（IDF，越稀有的词越相关）、文档长度归一化（短文档更易相关）。
- **query vs filter**：query 上下文**算分**（BM25，按相关性排序）；filter 上下文**不算分**（只判断匹配与否），结果**可缓存**（位图 bitmap），速度更快。能用 filter 就用 filter。
- **match vs term**：`match` 对文本**先分词再查倒排索引**（全文检索）；`term` 对精确值**不分词直接查**（keyword、数字、IP）。常见坑：对 text 字段用 `term` 查不到（因为 text 存的是分词后的小写词元）。
- **bool 查询四子句**：`must`（必须匹配，算分）、`should`（至少 N 个匹配，可配 minimum_should_match，算分）、`must_not`（必须不匹配）、`filter`（必须匹配，不算分，可缓存）。
- **聚合（aggregation）**：实时分组统计，类似 SQL `GROUP BY + 聚合函数`。分桶聚合（terms/histogram/date_histogram）、指标聚合（avg/sum/max/percentiles）、管道聚合。基于 **doc values**（正排）而非倒排索引。
- **refresh/flush**：refresh（buffer→segment，约 1 秒，可被搜到）、flush（segment→磁盘 + 清 translog，持久化）、translog（WAL 日志，崩溃可恢复）。三者构成写入持久性链路。
- **分片数预估**：主分片数建索引定、不可改。建议单分片 30-50GB；数据量 = 分片数 × 单分片大小。预估错了要 reindex 或 split API。

## 一、Lucene segment 与倒排索引

ES 的每个分片是一个 Lucene 索引，由多个**不可变 segment**组成。理解 segment 才能理解 ES 的写入、查询、合并：

```
分片（Lucene 索引）
├── segment_1（不可变倒排索引）  ← 写入时追加，后台 merge 合并
├── segment_2
├── segment_3
└── ...
    每个 segment 内部：
    ├── 词条字典（term dictionary，FST 压缩）：词 → postings list 指针
    ├── 倒排表（postings list）：词 → [doc_id, 词频, 位置, 偏移]
    ├── doc values（正排）：doc_id → 字段值（用于排序/聚合）
    └── stored fields（原始字段值，用于 _source 返回）
```

- **segment 不可变**：一旦生成只读不写。这让并发读无锁（极快），但「更新文档」要标记旧文档删除 + 写入新文档版本，旧版本由 merge 清理。
- **merge（段合并）**：后台把多个小 segment 合并成大 segment，清除已删文档，减少查询时要扫描的 segment 数。merge 策略（tiered 等）要平衡 IO 开销与查询性能。
- **refresh**：把内存 buffer 转成新 segment（堆外内存，可被搜到）。默认每 1 秒一次 → 这就是「近实时」的来源。

### 倒排索引三件套

| 结构 | 作用 | 查询用途 |
| --- | --- | --- |
| **词条字典（term dictionary）** | 所有词元的有序表，FST 压缩存内存 | 快速定位词是否存在 |
| **倒排表（postings list）** | 词 → 文档列表（doc_id + 词频 + 位置） | 全文检索（match） |
| **doc values（正排）** | 文档 → 字段值 | 排序、聚合、script |

- 为什么排序聚合要 **doc values**？倒排索引是「词→文档」，要取某文档的字段值排序很慢。doc values 是正排（文档→字段值），列式存储，排序聚合极快。ES 默认对所有字段启用（除 text）。
- **FST（Finite State Transducer）**：词条字典的压缩结构，前缀共享内存占用极低。这让 ES 能在内存装下海量词条。

## 二、分词（Analysis）决定搜索质量

分词是把文本拆成词元（token）的过程。分词质量直接决定召回质量：

```
文本 "Elasticsearch is AMAZING!"
analyzer = standard + lowercase
  → tokenizer: ["elasticsearch", "is", "amazing"]   ← standard 分词
  → lowercase filter: ["elasticsearch", "is", "amazing"]  ← 小写化
  → stop filter（可选）: ["elasticsearch", "amazing"]     ← 去停用词
```

- **analyzer 三组件**：①**character filter**（字符过滤，如去 HTML 标签）；②**tokenizer**（分词，standard/whitespace/keyword）；③**token filter**（词元过滤，lowercase/stop/stemmer/synonym）。
- **index analyzer vs search analyzer**：写入时用 index analyzer 分词建索引；查询时用 search analyzer 分词后查倒排。两者要一致（否则查不到）。可用 `analyzer` 字段在 mapping 指定。
- **中文分词**：standard 对中文是逐字分词（"分布式" → "分","布","式"），效果差。要用 **IK**（ik_smart/ik_max_word）或 **pinyin** 分词器。
- **常见坑**：text 字段默认有 `.keyword` 子字段（不分词，类型 keyword，用于精确匹配和聚合）。对 text 用 `term` 查原始值查不到，要用 `.keyword`：`term: { "category.keyword": "数据库" }`。

## 三、query vs filter：算分与缓存

DSL 查询分两个上下文，性能差异大：

```json
// query 上下文（算分，按相关性排序）
{ "query": { "match": { "title": "分布式数据库" } } }

// filter 上下文（不算分，只判断是否匹配，结果可缓存）
{ "query": { "bool": { "filter": [{ "term": { "status": "published" } }] } } }
```

- **query**：算 BM25 分数，按相关性排序。用于「找最相关的文档」。每次查询都重新算分，不缓存。
- **filter**：只判断是否匹配（是/否），不算分。结果用**位图（bitmap）缓存**，相同 filter 二次查询极快。用于范围、精确值、存在性判断。
- **最佳实践**：能用 filter 就用 filter。典型模式：`bool { must: [全文检索], filter: [精确过滤] }`——用 filter 快速缩小范围，再对剩余用 query 算分排序。
- **缓存（query cache）**：filter 的命中（哪些文档匹配）被缓存为位图，约 5-10% 堆内存。频繁过滤的场景受益大。

## 四、match vs term 与 bool 组合

```json
// match：全文检索（先分词再查倒排索引）
{ "match": { "title": "分布式数据库" } }
// → 分词为 ["分布式","数据库"] → 查倒排 → 任一命中即返回，按 BM25 打分

// term：精确匹配（不分词，用于 keyword/数字/IP/bool）
{ "term": { "status.keyword": "published" } }
// ⚠️ 对 text 字段用 term 通常查不到（text 存的是分词后小写词元）

// bool：布尔组合
{ "bool": {
    "must":     [{ "match": { "title": "分布式" } }],     // 必须，算分
    "should":   [{ "match": { "tag": "NoSQL" } }],        // 可选，加分
    "must_not": [{ "term": { "deleted": true } }],         // 必须不
    "filter":   [{ "range": { "date": { "gte": "2026-01-01" } } }]  // 必须匹配，不算分
}}
```

- **match_phrase**：短语匹配（词的顺序和位置都要接近），比 match 更严格。`"分布式 数据库"` 要相邻才算命中。
- **multi_match**：跨多字段检索，可设字段权重（`title^3` 表示 title 权重 3 倍）。
- **minimum_should_match**：should 子句至少要匹配几个。常用于提高召回质量。

## 五、聚合（Aggregation）：实时分析

聚合类似 SQL 的 `GROUP BY + 聚合函数`，让 ES 兼具分析能力：

```json
GET /orders/_search
{
  "size": 0,                          // 不返回文档，只要聚合结果
  "aggs": {
    "by_region": {                    // 分桶聚合（按地区分组）
      "terms": { "field": "region.keyword", "size": 10 },
      "aggs": {                       // 嵌套聚合（桶内再算指标）
        "avg_amount": { "avg": { "field": "amount" } },
        "amount_histogram": { "histogram": { "field": "amount", "interval": 100 } },
        "date_trend": { "date_histogram": { "field": "order_date", "calendar_interval": "month" } }
      }
    }
  }
}
```

- **分桶聚合（bucket）**：terms（按词元分桶）、histogram（按数值区间）、date_histogram（按时间）、range（自定义区间）、filter/filter（按条件分桶）。
- **指标聚合（metric）**：avg/sum/max/min/cardinality（去重计数）/percentiles（百分位）。
- **基于 doc values**：聚合不用倒排索引（倒排是「词→文档」，不适合「取字段值统计」），而用 **doc values**（正排，文档→字段值）。所以聚合字段要确保 doc_values 启用（默认开）。
- **基数（cardinality）**：用 HyperLogLog 算法近似去重计数，内存固定、快但略有误差（可调 precision_threshold）。

## 六、分片策略与路由

- **主分片数定死**：`number_of_shards` 建索引时定，之后不可改（底层是文档路由 `hash(routing) % shards`，改了文档会找不到）。预估错要 reindex 到新索引（用 alias 切换无停机）或 split API（只能增加，且原索引要够空）。
- **单分片大小**：建议 30-50GB。太大（超 100GB）查询和 merge 慢、节点平衡难；太小（几 GB）则分片开销（每个分片是独立 Lucene 索引，有固定开销）超过收益。
- **副本可动态调**：`number_of_replicas` 可随时改。加副本提升读吞吐与可用性，但增加存储和写入同步成本。
- **路由（routing）**：默认 `hash(_id) % shards`。可指定 routing（如 `routing=user_id`）让相关文档落到同分片，便于按 routing 查询减少扇出。
- **索引生命周期（ILM）**：管理时序索引（如日志按天建索引），rollover 滚动新建、shrink 减分片、force-merge 合并段、delete 过期。这是 ELK 日志场景的核心。

## 交互演示

本叶无专门可视化。建议结合[OpenSearch 分叉与向量搜索](./opensearch-and-vector)理解 ES 的演化与向量能力。

## 下一步

倒排索引与 DSL 查询讲完后，下一步深入[OpenSearch 分叉与向量搜索](./opensearch-and-vector)——2021 AWS fork 的来龙去脉、SSPL→ELv2→AGPL 许可变更、dense_vector 与 kNN 搜索、RAG 场景。
