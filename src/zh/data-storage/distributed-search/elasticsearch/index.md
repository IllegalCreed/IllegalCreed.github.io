---
layout: doc
---

# Elasticsearch

**Elasticsearch**（简称 ES）是一个基于 **Apache Lucene** 构建的**分布式、RESTful、近实时（NRT）全文搜索与分析引擎**。它的核心能力来自 Lucene 的**倒排索引（inverted index）**——把文档中的每个词映射到包含它的文档列表，让「找出包含某关键词的所有文档」从 O(文档数) 降到 O(命中数)，这是关系库 B+ 树索引做不到的。ES 把数据按 **索引（index）→ 分片（shard）→ 副本（replica）** 分布到多节点：**分片**横向切分数据（解决单机容量与吞吐上限），**副本**提供高可用与读扩展。查询用 **DSL（Domain Specific Language）**——一套 JSON 格式的查询语法（query DSL），涵盖全文检索、布尔组合、聚合（aggregation，类 GROUP BY）、地理查询等。ES 不仅是搜索引擎，也是**分析引擎**：聚合（aggregation）能对海量数据做实时分组统计，配合 Kibana 形成 ELK 日志分析栈。ES 的**许可变更**值得警惕：2021 年 Elastic 公司把 Elasticsearch 从 Apache 2.0 改为**非开源的 SSPL/ELv2**（引发争议），**AWS 随即 fork 出 OpenSearch**（Apache 2.0）作为开源替代；2024 年 Elastic 又把许可从 SSPL 改为 **AGPL**（回归 OSI 认可的开源）。近年来 ES 加入了 **`dense_vector`（稠密向量）字段类型**与 kNN 搜索，从「关键词搜索」扩展到「**语义/向量搜索**」，应对 LLM 时代的 RAG（检索增强生成）场景。理解 ES 的核心是理解**倒排索引为什么快**、**分片与副本如何平衡扩展与高可用**、**DSL 查询的层级结构**以及**与 OpenSearch 的分叉关系**——这是它与 Solr（同为 Lucene）、与关系库、与向量数据库的根本分野。

## 评价

**优点**

- **全文搜索极快**：倒排索引让关键词检索从线性扫描变成近乎 O(1) 的命中查找，支持复杂相关性打分（TF-IDF/BM25）
- **分布式原生**：分片横向扩展容量与吞吐、副本保证高可用与读扩展，PB 级数据可查
- **近实时（NRT）**：文档写入约 1 秒（默认 refresh interval）后即可被搜到，平衡了实时性与索引开销
- **聚合分析**：实时对海量数据做分组、统计、直方图——既是搜索引擎也是分析引擎（ELK 栈核心）
- **RESTful + JSON**：HTTP API 易用，跨语言；DSL 表达力强，涵盖布尔/范围/地理/嵌套查询

**缺点**

- **不适合 OLTP 事务**：无 ACID 事务（单文档原子，多文档不保证）、不适合频繁按主键更新
- **资源消耗大**：JVM 内存占用高、索引与副本导致存储放大、堆内存与堆外内存要分开管
- **近实时非真实时**：写入到可查有约 1 秒延迟（refresh），强实时要强行 refresh 代价大
- **运维复杂**：分片数、副本数、映射（mapping）、refresh interval、节点角色都要调；集群脑裂、磁盘水位是常见故障

## 本叶地图

- [入门](./getting-started) —— ES 定义、倒排索引、分片/副本、近实时、DSL 查询、聚合、Lucene、典型场景
- [倒排索引与 DSL 查询](./guide-line/inverted-index-and-search) —— Lucene 倒排索引原理、分片/副本/路由、refresh/flush、query DSL 层级、聚合
- [OpenSearch 分叉与向量搜索](./guide-line/opensearch-and-vector) —— 2021 AWS fork 历史、SSPL→ELv2→AGPL 许可变更、dense_vector 与 kNN、RAG 场景
- [参考](./reference) —— 倒排索引结构、DSL 速查、分片策略、易错点清单

## 幻灯片地址

<a href="/SlideStack/elasticsearch-slide/" target="_blank">Elasticsearch</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Elasticsearch" target="_blank" rel="noopener noreferrer">Elasticsearch 测试题</a>
