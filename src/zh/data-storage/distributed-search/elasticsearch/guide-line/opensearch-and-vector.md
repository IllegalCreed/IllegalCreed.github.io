---
layout: doc
outline: [2, 3]
---

# OpenSearch 分叉与向量搜索：许可变更与 dense_vector

> 基于 Elasticsearch 8.x / OpenSearch 2.x · 核于 2026-08

## 速查

- **2021 许可变更**：2021 年 1 月，Elastic 公司宣布 Elasticsearch（与 Kibana）从 **Apache 2.0** 改为**双许可 SSPL（Server Side Public License）+ ELv2（Elastic License 2.0）**。SSPL 是 MongoDB 起草的「源码可用但限制云厂商」许可证，**不被 OSI（开源促进会）认可为开源**——这引发了巨大争议。
- **AWS fork 出 OpenSearch**：作为对许可变更的回应，**AWS 联合其他厂商在 2021 年 4 月 fork 出 OpenSearch**（Apache 2.0 真开源），并贡献给新成立的 OpenSearch Software Foundation（Linux Foundation 托管）。OpenSearch 兼容 ES 的 API 和 DSL，初期基于 ES 7.10 分支，之后独立演化。
- **2024 AGPL 回归**：2024 年 10 月，Elastic 又把 Elasticsearch 的许可从 SSPL 改为**加入 AGPL（GNU Affero GPL）作为第三个选项**（Apache 2.0 + SSPL + ELv2 + AGPL 四选一）。AGPL 是 OSI 认可的开源许可——这意味着 ES 又「回归开源」，但 AGPL 的传染性（网络使用也要开源）对商业用户仍是顾虑。
- **OpenSearch 与 ES 的现状**：两者 API 高度兼容（早期迁移几乎无改），但已分道扬镳：ES 推出 Stack 新功能（如 ES Relevance Workbench、向量能力领先），OpenSearch 则强调「真正开源、社区治理、无单一厂商控制」。云服务上 AWS OpenSearch Service 是托管 OpenSearch，Elastic Cloud 是托管 ES。
- **向量搜索（Vector Search）**：ES 从 7.x 起加入 **`dense_vector`（稠密向量）字段类型**，支持存浮点数组（如 768 维的 BERT embedding）。配合 **kNN（k 近邻）查询**，能用向量距离（cosine/dot_product/l2_norm）找语义相似的文档——从「关键词匹配」扩展到「语义匹配」。
- **kNN 搜索算法**：ES 用 **HNSW（Hierarchical Navigable Small World）** 算法做近似最近邻搜索（ANN）。HNSW 是图结构，查询快（毫秒级找近邻）但内存占用大（向量全在内存）。精确 kNN（script_score）慢，只适合小数据集。
- **RAG（检索增强生成）**：LLM 时代的典型场景——用 embedding 模型把文档和查询都转成向量，存 ES 的 dense_vector，用 kNN 检索语义相关的文档片段，喂给 LLM 生成答案。ES 从「搜索」扩展到「LLM 的知识库」。
- **混合搜索（Hybrid Search）**：结合 BM25 全文检索（关键词精确）+ kNN 向量检索（语义模糊），用 RRF（Reciprocal Rank Fusion）或加权融合排序——这是当前生产推荐的检索策略，兼顾精确与语义。
- **Embedding 模型**：用机器学习模型（如 BERT、text-embedding-3、bge）把文本转成稠密向量。ES 内置 inference processor 可在写入时自动 embedding（要部署模型），或应用层预计算后写入。

## 一、2021 许可变更：从 Apache 2.0 到 SSPL/ELv2

Elasticsearch 从 2010 年诞生到 2021 年一直是 **Apache 2.0**（最宽松的开源许可之一，允许商用、修改、闭源分发）。变更的导火索是 **AWS 与 Elastic 的商业冲突**：

- **背景**：AWS 在 2019 年未经 Elastic 授权推出 **Amazon Elasticsearch Service**（托管 ES），并注册了 "Elasticsearch" 商标用于该服务。Elastic 认为 AWS 「搭便车」损害其商业利益（Elastic Cloud 是 Elastic 的托管服务收入来源）。
- **变更**：2021 年 1 月，Elastic 宣布从 7.11 版本起，ES 和 Kibana 改为 **SSPL + ELv2 双许可**。SSPL（MongoDB 起草）要求「如果你把该软件作为服务提供给他人，必须开源你的整个服务栈（包括配套基础设施代码）」——这直接针对 AWS 等云厂商。ELv2 限制更细：禁止把软件作为托管服务提供、禁止绕过许可证密钥。
- **争议**：SSPL **不被 OSI 认可为开源**（OSI 认为它的条款过于宽泛）。所以严格说，2021-2024 间的 Elasticsearch 不是「开源软件」，而是「源码可用（source-available）」。这引发了社区对「开源变节」的批评。

### AWS 的回应：fork 出 OpenSearch

- **fork**：2021 年 4 月，AWS 联合 Netflix、SAP 等 fork 出 **OpenSearch**，基于 ES 7.10（最后一个 Apache 2.0 版本），继续 Apache 2.0 许可。
- **治理**：OpenSearch 贡献给 **OpenSearch Software Foundation**（2024 年起由 Linux Foundation 托管），强调社区治理、无单一厂商控制。
- **兼容**：早期 OpenSearch 兼容 ES 的 API、DSL、客户端，迁移几乎无改。但两者已分道扬镳：OpenSearch 推出自己的功能（如 OpenSearch Dashboards、Flow Framework），ES 推出自己的（Stack、向量能力领先）。
- **托管服务**：AWS 把 Amazon Elasticsearch Service 改名 **Amazon OpenSearch Service**；Elastic 自己运营 Elastic Cloud。

## 二、2024 AGPL 回归开源

2024 年 10 月，Elastic 第三次变更许可：在原 SSPL/ELv2 基础上**加入 AGPL**，形成「Apache 2.0 + SSPL + ELv2 + AGPL」**四选一**。用户可任选其一遵守。

- **为什么加 AGPL**：AGPL 是 **OSI 认可的开源许可**。Elastic 此举是回应「ES 不再开源」的批评，重新让 ES 进入 OSI 认可的开源名单。
- **AGPL 的特点**：GPL 的网络版——「如果你把该软件作为网络服务提供给用户使用，你必须向这些用户开放你的全部源码（包括你的修改）」。这保护了 Elastic（云厂商用 ES 提供服务要开源自己的栈），但对商业用户仍是顾虑（传染性）。
- **现状**：用户四选一。自用内网、不提供网络服务、不在意传染性的可用 AGPL；商业云服务可用 ELv2（付费豁免）；不想被传染的可继续用 OpenSearch。

### 三选一的实践建议

| 场景 | 推荐 |
| --- | --- |
| 自部署内网、不对外提供服务 | AGPL 或 Apache 2.0（旧版本）无忧 |
| 提供商业 SaaS、不想开源自己的栈 | 用 Elastic 商业许可（ELv2 + 付费豁免） |
| 想完全规避许可风险、强调开源治理 | 用 OpenSearch（Apache 2.0，Linux Foundation 托管） |

## 三、dense_vector 与 kNN：向量搜索

ES 从 7.x 起加入向量能力，应对 LLM 与语义搜索：

```json
// 1. 建索引：定义 dense_vector 字段
PUT /docs {
  "mappings": {
    "properties": {
      "title":   { "type": "text" },
      "content": { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 768,                          // 维度，与 embedding 模型一致
        "index": true,                         // 启用 HNSW 索引（支持 kNN）
        "similarity": "cosine"                 // 相似度：cosine / dot_product / l2_norm
      }
    }
  }
}

// 2. 写入：应用层先用 embedding 模型把 content 转成向量，再写入
PUT /docs/_doc/1 {
  "title": "Cassandra",
  "content": "Cassandra 是分布式宽列数据库...",
  "embedding": [0.12, -0.34, ..., 0.56]   // 768 维浮点数组
}

// 3. kNN 查询：用查询向量找语义相似的文档
POST /docs/_search {
  "knn": {
    "field": "embedding",
    "query_vector": [0.11, -0.32, ..., 0.55],   // 查询文本的 embedding
    "k": 10,
    "num_candidates": 100                         // HNSW 候选数（越大越准越慢）
  }
}
```

- **dense_vector 字段**：存稠密浮点数组（embedding）。`dims` 指定维度（与模型一致），`similarity` 指定距离度量（cosine 最常用，dot_product 速度最快但要预先归一化）。
- **HNSW 算法**：ES 用 HNSW（分层导航小世界图）做近似最近邻（ANN）搜索。查询时从图顶层粗粒度导航到底层精确查找，毫秒级返回 k 个近邻。代价是向量全在内存（堆外），内存占用大。
- **num_candidates**：HNSW 每个分片探索的候选数。越大召回越准但越慢。典型 100-1000。
- **query_vector_builder**：可让 ES 内部调用 inference 模型生成 query_vector（要部署模型），简化应用层。

## 四、RAG 与混合搜索

向量搜索的主要应用是 **RAG（检索增强生成）**——让 LLM 基于私有知识库回答：

```
用户问题 → embedding 模型 → 查询向量
                              ↓
            ES kNN 检索 dense_vector → 语义相关文档片段
                              ↓
            拼成 prompt（问题 + 检索到的片段）→ LLM → 答案
```

- **混合搜索（Hybrid Search）**：生产推荐结合 **BM25 全文 + kNN 向量**。BM25 擅长精确关键词（产品名、专有名词），向量擅长语义（同义词、近义表达）。用 **RRF（Reciprocal Rank Fusion）** 把两路结果融合排序：

```json
POST /docs/_search {
  "size": 10,
  "query": { "match": { "content": "分布式数据库" } },   // BM25
  "knn":   { "field": "embedding", "query_vector": [...], "k": 10, "num_candidates": 100 },  // 向量
  "rank":  { "rrf": { "window_size": 50, "rank_constant": 20 } }   // RRF 融合
}
```

- **RRF 原理**：对每路结果按排名打分（`1 / (rank_constant + rank)`），相加作为最终分。无需调权重，鲁棒性好。
- **重排（rerank）**：用更重的模型（如 Cohere Rerank、bge-reranker）对召回的 top-N 重排，进一步提升精度。两阶段检索（召回 + 重排）是当前生产最佳实践。

## 五、OpenSearch 的对应能力

OpenSearch 也提供对应能力，命名略有差异：

- **k-NN 插件**：OpenSearch 的向量搜索通过 **k-NN plugin** 实现，支持 HNSW、IVF 等算法。字段类型 `knn_vector`（对应 ES 的 dense_vector）。
- **神经搜索（Neural Search）**：OpenSearch 的 neural-search 插件封装了 embedding + kNN 流程，可用一句 query 完成文本→向量→检索。
- **ML Commons**：OpenSearch 的机器学习插件，可部署 embedding 模型在集群内做 inference。
- **功能差异**：ES 的向量能力略领先（性能优化、混合搜索 API 更成熟），OpenSearch 紧随但社区治理更开放。选型看许可与生态。

## 六、选型建议：ES vs OpenSearch

| 维度 | Elasticsearch | OpenSearch |
| --- | --- | --- |
| 许可 | AGPL/SSPL/ELv2/Apache 2.0 四选一 | Apache 2.0（OSI 认可） |
| 治理 | Elastic 公司主导 | Linux Foundation 托管，多厂商 |
| API 兼容 | 原生 | 高度兼容（早期迁移无改） |
| 向量能力 | 略领先（混合搜索 API 成熟） | 紧随（k-NN plugin + neural-search） |
| 托管服务 | Elastic Cloud、各云市场 | Amazon OpenSearch Service |
| 适用 | 想用最新功能、接受 AGPL/商业许可 | 强调真开源、规避许可风险、AWS 生态 |

## 交互演示

本叶无专门可视化。建议结合[参考](../reference)速查倒排索引结构、DSL 速查表、易错点清单。

## 下一步

向量搜索与分叉历史讲完后，建议回到[参考](../reference)速查倒排索引结构、DSL 查询速查、分片策略与易错点清单。
