---
layout: doc
outline: [2, 3]
---

# 核心架构与检索策略

> 基于 LangChain 官方 Retrieval 文档 + LlamaIndex 框架理解 + Pinecone Learning Center + BGE / Cohere / HyDE 论文（Gao 2022）编写，对照 LangChain / LlamaIndex 当前版本行为

## 速查

- **四阶段**：Ingestion / Retrieval / Augmentation / Generation——离线阶段产物是向量库，在线阶段产物是答案
- **Embedding MRL**：text-embedding-3-large 默认 3072 维，`dimensions=1024` 降维存储省 ⅔，性能仍胜 ada-002
- **距离度量四类**：cosine（夹角）/ dot product（OpenAI 归一化向量等价 cosine）/ L2（欧氏）/ inner product——选错直接崩
- **向量库四选型**：Pinecone 托管 / Weaviate HNSW+LSM 自托管 / Chroma 轻量 / pgvector PG 扩展
- **pgvector HNSW 三参**：`m`（连接数，默认16）/ `ef_construction`（构建候选，默认64）/ `ef_search`（查询候选，默认40）
- **Chunk 四类**：固定 / Recursive / Semantic / 结构化（Markdown-Header / 代码语法树）
- **必上 Hybrid Search**：dense（语义）+ sparse（BM25/SPLADE 词法）融合——查产品名/缩写/术语的最低门槛
- **必上 Reranker**：bi-encoder 召回（快便宜）→ cross-encoder 精排（慢准贵），既提准又压 token
- **HyDE**：LLM 生成假设答案文档再嵌入，规避 query-document 语义鸿沟，零样本利器
- **Query Transformation 家族**：HyDE / Rewriting / Multi-Query / Step-Back / Sub-Question
- **范式演进**：Naive → Advanced → Modular → **Agentic RAG**（agent 自主编排检索）
- **反模式**：dense only、不 Rerank、chunk 过大塞爆、改 Embedding 不重建索引、把 RAG 当 Fine-tuning 用

## 四阶段深度

### Ingestion（离线入库）

把原始语料加工成可检索向量。一次性投入，可增量更新。

**Loader / Data Connector**

- **LangChain Document Loaders**：100+ 种 loader（PDF / HTML / Notion / GitHub / Confluence…）
- **LlamaIndex Data Connectors**：LlamaHub 是同构概念，`SimpleDirectoryReader` 是最常用入口
- 产物：`Document`（`pageContent` + `metadata`），metadata 后续可用来过滤（时间/权限/类别）

**Splitter / NodeParser**

详见下节「Chunk 策略四类」。要点是按数据形态匹配切分策略——通用文本首选 Recursive，结构化数据用对应专用 splitter。

**Embedding**

详见参考章节「Embedding 模型表」。OpenAI text-embedding-3-small（1536 维）是性价比起点，BGE-M3 是开源多语种首选。

**Vector Store 入库**

详见下节「向量库四选型」。入库时记得带上 metadata，方便后续过滤。

> **关键约束**：改 Embedding 模型必须**重建整个索引**。新旧模型向量空间不兼容，混用或部分迁移会直接破坏检索质量，且无明显报错。

### Retrieval（在线检索）

**单次 Naive Retrieval 的局限**

```text
query → Embedding → similaritySearch(query, top_k=4)
```

固定 top_k、单路 dense、不重排——这就是 Naive RAG，对简单查询够用，对稍复杂场景会丢召回（产品名/缩写）和精度（噪声文档混入）。

**生产级 Retrieval 三件套**

```text
query
  ↓ Query Transformation（HyDE / Multi-Query / Rewriting）
增强后的查询
  ↓ Hybrid Search（dense + sparse 按 alpha 融合）
top-k × N 候选
  ↓ Reranker（cross-encoder 精排）
top-k 精排结果
  ↓ metadata 过滤（权限/时间窗口）
最终 chunk
```

> 三件套叠加才能从 Naive RAG 升到 Advanced RAG。再往上是 Modular RAG（可替换组件）和 Agentic RAG（agent 自主决定何时检索）。

### Augmentation（拼 prompt）

**Pinecone 官方模板**

```text
你是一个严谨的问答助手。请严格基于下方 CONTEXT 回答用户问题：
- 若 CONTEXT 包含答案：直接作答，并标注引用的 chunk id
- 若 CONTEXT 不包含答案：仅回答「我不知道」，不要编造
- 不要使用 CONTEXT 之外的知识

CONTEXT:
[Chunk #1] (source: doc_a.md, page 3)
RAG（Retrieval Augmented Generation）是一种…
[Chunk #2] (source: doc_b.md, page 1)
四阶段流程包括 Ingestion、Retrieval…

用户问题：{query}
```

**关键约束**

- **扎根**：显式指示「基于 CONTEXT 回答」「无答案答不知道」——显著降低 hallucination
- **引用**：要求 LLM 标注 chunk id 或 source——满足合规审计
- **token 预算**：top-k × chunk_size 不能超过 LLM 上下文窗口，留足输出空间
- **顺序**：相关 chunk 放 prompt 前部或后部，避开「中间迷失」（lost in the middle）

### Generation（LLM 扎根作答）

LLM 仅基于 prompt 中的 CONTEXT 生成答案。可叠加：

- **流式输出**：边生成边返回，提升首字节延迟
- **Response Synthesizer**（LlamaIndex）：`compact`（合并 chunk）/ `tree_summarize`（树状归并）/ `refine`（迭代精炼）
- **答案验证**：Hybrid RAG 模式加 Answer Validation——检查答案是否真的来自 CONTEXT

## 向量库四选型

| 维度 | Pinecone | Weaviate | Chroma | pgvector |
| --- | --- | --- | --- | --- |
| **部署形态** | 托管 SaaS | 自托管 / 云托管 | 自托管轻量 | PostgreSQL 扩展 |
| **存储模型** | serverless / pod | LSM-Tree + 倒排 | Collections | 复用 PG 表 |
| **索引算法** | 闭源（HNSW 风格） | HNSW + 倒排 | HNSW | **HNSW / IVFFlat** 任选 |
| **过滤时机** | 后过滤 + 优化 | **预过滤**（保证返回数量） | 后过滤 | 0.8.0+ 内联过滤 |
| **Hybrid Search** | ✅（dense+sparse+rerank） | ✅ | ✅ | 需配合 BM25 表 |
| **模块化** | 内置 rerank | Modules（text2vec-* / generative-*） | 轻量 API | 复用 PG 生态 |
| **典型场景** | 不想运维、全球部署 | 多租户 / 自托管生产 | 原型 / 小规模 | 已有 PG / 关系数据 |

**pgvector HNSW 三参数**

| 参数 | 默认 | 调参方向 |
| --- | --- | --- |
| `m` | 16 | 每层最大连接数——加大提升召回但内存涨 |
| `ef_construction` | 64 | 构建候选列表——加大提升索引质量但建库慢 |
| `ef_search` | 40 | 查询候选列表——加大提升召回但查询慢（可用 `SET LOCAL` 单事务调） |

**pgvector IVFFlat 两参数**

| 参数 | 默认 | 调参方向 |
| --- | --- | --- |
| `lists` | rows/1000（≤1M）或 sqrt(rows)（>1M） | 聚类中心数 |
| `probes` | 1 | 探查聚类数——建议 sqrt(lists)，加大提召回但慢 |

> HNSW 整体召回与性能优于 IVFFlat，**新项目首选 HNSW**。IVFFlat 仅在内存吃紧时考虑。

**pgvector 距离操作符**

| 操作符 | 距离 | 类型 |
| --- | --- | --- |
| `<->` | L2（欧氏） | vector / halfvec |
| `<#>` | 负内积 | vector / halfvec |
| `<=>` | 余弦 | vector / halfvec |
| `<+>` | L1（曼哈顿） | vector / halfvec |
| `<~>` | 汉明 | bit |
| `<%>` | Jaccard | bit |

## 距离度量四类

| 度量 | 含义 | 何时用 |
| --- | --- | --- |
| **cosine** | 向量夹角 | OpenAI / BGE 默认，关心方向而非模长 |
| **dot product** | 内积 | OpenAI 向量已归一化时**等价 cosine 但更快** |
| **L2**（欧氏） | 直线距离 | 部分图像 / 音频嵌入 |
| **inner product** | 未归一化内积 | 模长含信息时（如 MRL 截断后需重新归一化） |

> **坑**：手动截取向量降维后必须 L2 归一化，否则 dot product 不等价 cosine。应优先用模型原生 `dimensions` 参数（内部已做 MRL 训练）。

## Chunk 策略四类

### 固定字符切分（CharacterTextSplitter）

按字符数硬切，最简单但语义易碎——仅作入门理解，生产慎用。

### RecursiveCharacterTextSplitter（推荐起点）

按分隔符优先级递归切，**LangChain 通用文本首选**。

```ts
new RecursiveCharacterTextSplitter({
  chunkSize: 1000,         // 单 chunk 最大字符
  chunkOverlap: 200,       // 相邻 chunk 重叠
  lengthFunction: len,     // 默认字符数，可换 tiktoken 算 token
  separators: ["\n\n", "\n", " ", ""],  // 默认顺序
});
```

**为何 separators 默认是 `["\n\n", "\n", " ", ""]`**

- `\n\n`（段落）优先：保留最大语义单元
- 段落太大降级到 `\n`（行）：依然是结构边界
- 行太大降级到 ` `（空格）：英文词级
- 最后 `""`（字符）：兜底

逻辑：**先在语义边界切，越切越细**。

### SemanticChunker（语义切分）

按句嵌入余弦相似度找断点——相邻句相似度跌至阈值就切。

```ts
new SemanticChunker(embeddings, {
  breakpointThresholdType: "percentile",  // percentile/stddev/interquartile/gradient
  breakpointThreshold: 95,                // 配 percentile 用
});
```

适合：学术论文、长篇技术文档（语义敏感）。代价：每句都要 Embedding，**离线成本高**。

### 结构化切分

| 工具 | 数据形态 | 保留什么 |
| --- | --- | --- |
| `MarkdownHeaderTextSplitter` | Markdown 文档 | 标题层级→metadata |
| `PythonCodeTextSplitter` | Python 代码 | 函数/类语法边界 |
| 代码语法树通用 | 各语言代码 | 不切半个函数 |

**chunk_size 经验**

- 通用文本：500–1500 字符（≈ 100–300 token）
- 代码：按语法树，单 chunk = 一个完整函数
- 表格：尽量保持整张表，不切分
- max input 对齐：单 chunk token 不超过 Embedding 模型上限（OpenAI/BGE 均 8192）

> **chunk_overlap** 设 50–200 字符——避免关键信息被切到两半。

## Hybrid Search（dense + sparse）

**为何不能只用 dense**

纯语义检索遇到以下查询会丢召回：

- **产品名 / 缩写**：GPT-4、BGE-M3、K8s（向量空间里这些专有名词和通用词挤在一起）
- **代码标识符**：`getUserById`、`useState`
- **专有术语**：HNSW、BM25、Splade
- **数字 / 版本号**：v0.8.0、pgvector-0.7.0

**sparse vector 解决什么**

| 类型 | 来源 | 强项 |
| --- | --- | --- |
| **BM25** | 经典全文检索 | 词频 + IDF |
| **SPLADE** | 神经网络稀疏化 | 学到同义词 / 上下文扩展 |
| **BGE-M3 sparse** | M3 三模输出之一 | 与 dense 同源，对齐 |

**融合方式**：按 `alpha` 权重融合 dense 与 sparse 的相似度分数，再过 Reranker 去重排序。

```text
final_score = (1 - alpha) * sparse_score + alpha * dense_score
```

> alpha 通常 0.5–0.7 起步，根据评估集调。EnsembleRetriever（LangChain）或多 retriever 合并可达到同样效果。

## Reranker（cross-encoder 精排）

**两阶段架构**

```text
第一阶段：bi-encoder（召回）
  query → 向量；doc → 向量（独立编码）
  相似度 = cosine(query_vec, doc_vec)
  返回 top-k 候选（快、便宜）
  ↓
第二阶段：cross-encoder（精排）
  [query + doc] → 联合编码 + cross-attention
  直接输出相关性分数
  重排 top-k（慢、贵但准）
```

**为何 cross-encoder 更准**

bi-encoder 把 query 与 doc **分别**压成单向量——语义细节被压平；cross-encoder 把 query 与 doc **拼一起**联合编码，每个 token 都能 cross-attention 到对方 token——保留全部交互信息。

**主流 Reranker**

| 模型 | 输入上限 | 部署 |
| --- | --- | --- |
| **Cohere Rerank 3.5 / 4.0** | 4096 token | 商用 API |
| **bge-reranker-v2-m3** | 8192 token（取代 v1 的 512） | 开源可自托管 |
| bge-reranker-v2-gemma | 8192 token | gemma-2b 大杯版 |

> **必上 Reranker**：cross-encoder 精排几乎是免费收益——既提升准确率又压缩送入 LLM 的 token、降本降延迟。

## Query Transformation 家族

| 方法 | 原理 | 适用 |
| --- | --- | --- |
| **HyDE** | LLM 生成假设答案文档→嵌入假设文档→检索 | 零样本场景，规避 query-doc 语义鸿沟 |
| **Query Rewriting** | 重写查询更清晰 | 用户表达模糊 |
| **Multi-Query** | 生成多变体并行检索后合并 | 召回率提升 |
| **Step-Back Prompting** | 退一步问更抽象的问题 | 需要原则性知识 |
| **Sub-Question Decomposition** | 拆子问题分别检索 | 多跳推理 |

### HyDE 详解（Gao 2022）

**核心思想**：query 与 document 在嵌入空间分布不一致（语义鸿沟）——query 是「问什么」，document 是「陈述什么」。HyDE 先让 LLM 生成一个**假设的答案文档**，再对这个假设文档做嵌入。

```text
query: "Pinecone 与 Weaviate 哪个支持 Hybrid Search？"
  ↓ LLM 生成 hypothetical answer
"Both Pinecone and Weaviate support hybrid search combining
 dense and sparse vectors, with built-in reranking capabilities…"
  ↓ Embedding(hypothetical_answer)
假设文档的向量
  ↓ 在 document embedding 空间检索 top-k
相关 chunk
```

**为何有效**：假设文档与真实文档**都是陈述句**，分布更近——规避了 query-doc 语义鸿沟。零样本场景效果显著（论文：HyDE 在 WebQuestions 上zero-shot 性能接近有监督方法）。

> 局限：需要先调 LLM 生成，**多一次 LLM 调用延迟**。如果 query 简单、检索已够好就不必上 HyDE。

## 范式演进

| 范式 | 特征 | 局限 |
| --- | --- | --- |
| **Naive RAG** | 单次检索 + 生成，固定 top_k | 复杂查询召不回、精度差 |
| **Advanced RAG** | 加 Query Transformation / Reranking / 前后处理 | 流水线固定，不够灵活 |
| **Modular RAG** | 模块化可替换组件（检索器、生成器、后处理） | 仍是预定义流程 |
| **Agentic RAG** | agent 自主决定何时检索、检索哪个工具、评估检索质量 | 复杂度高、token 消耗大 |

**Agentic RAG 落地**

LangChain 当前推荐用 `create_agent` + `init_chat_model` + `@tool` 装饰器把检索器暴露为工具，让 agent 自主判断：

- 这个问题要不要检索？
- 检索结果质量够不够？要不要重新检索？
- 是否需要拆子问题分别检索？

> 研究助手 / 多跳问答 / 多源数据场景，Agentic RAG 显著优于固定流水线。

## LangChain vs LlamaIndex 组件对应

| LangChain | LlamaIndex | 职责 |
| --- | --- | --- |
| Document Loaders | Data Connectors（LlamaHub） | 拿原文 |
| Text Splitters | NodeParser / SentenceSplitter / IngestionPipeline | 切块 |
| Embeddings | Embeddings | 向量化 |
| Vector Stores | Index（VectorStoreIndex / SummaryIndex / PropertyGraphIndex） | 存储与检索 |
| Retrievers | Retrievers（含 AutoMerging / BM25 / Ensemble / Router） | 检索 |
| —（LCEL 自拼） | Query Engine（`index.as_query_engine()`） | 检索 + 生成一体化 |
| —（LCEL 自拼） | Response Synthesizer（compact / tree_summarize / refine） | 答案合成 |

> LangChain 经典 `RetrievalQA` / `load_qa_chain` 已被标记为 legacy，当前推荐 **LCEL（Runnable 接口）/ `create_agent` / Deep Agents** 模式。LlamaIndex 推荐 `IngestionPipeline` 组合 Transformation 替代直接调用 NodeParser。

## 反模式（避坑）

- **只用 dense 检索**：跳过 BM25/sparse——查产品名/缩写/代码标识符召回率暴跌，**Hybrid Search 是行业最低门槛**
- **不做 Reranking**：bi-encoder 召回的噪声文档直接塞 prompt——既浪费 token 又拉低准确率
- **chunk 过大塞爆上下文窗口**：或过小切断语义单元，且不设 overlap——跨块关键信息丢失
- **用固定字符切分处理结构化数据**：Markdown 标题 / 代码函数 / 表格——块语义破碎，检索命中的是半个函数
- **没有评估集就反复调 chunk_size / top_k / 模型**：无法判断改动是真改进还是噪声，玄学调参
- **事后手动截断向量降维（不归一化）**：破坏向量分布；应直接用 `dimensions` 参数（内部已做 MRL 训练）
- **把 RAG 当 Fine-tuning 用**：RAG 注入「事实/知识」，不改变模型风格/语气/输出格式/任务能力
- **把所有知识塞 Long Context 替代 RAG**：生产规模 20–24x 成本，且文档越多越「中间迷失」
- **改了 Embedding 模型却不重建索引**：新旧向量空间不一致，检索质量直接崩塌且无报错
- **top_k 设过大**（prompt 膨胀+噪声淹没）**或过小**（召回不足），不做相关性过滤就全量喂 LLM
- **忽略元数据过滤**：在不该语义比对的字段（时间窗口/权限/类别）上浪费向量检索——先用 metadata filter 缩范围
- **用 Naive RAG 硬扛多源/多跳问答**：不做 query decomposition / routing / 子问题拆解，必然答非所问

## 下一步

- [参考](./reference.md)：Embedding / 向量库 / Chunk 参数表 + 官方资源
