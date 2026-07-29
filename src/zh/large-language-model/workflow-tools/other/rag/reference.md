---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 LangChain 官方 Retrieval 文档 + LlamaIndex 框架理解 + Pinecone Learning Center + OpenAI Vector embeddings 指南编写，对照 LangChain / LlamaIndex 当前版本行为

## 速查

- **四阶段**：Ingestion / Retrieval / Augmentation / Generation
- **OpenAI Embeddings**：text-embedding-3-small **1536 维** / text-embedding-3-large **3072 维**（可 MRL 降到 256/512/1024）
- **BGE-M3**：1024 维 / 8192 token / 100+ 语言，dense+sparse+multi-vector 三模
- **max input**：OpenAI 与 BGE 均为 **8192 token**
- **向量库四选型**：Pinecone（托管）/ Weaviate（自托管）/ Chroma（轻量）/ pgvector（PG 扩展）
- **pgvector 索引**：HNSW（默认推荐）/ IVFFlat，PG 13+
- **距离操作符**：`<->`(L2) / `<#>`(负内积) / `<=>`(余弦) / `<+>`(L1) / `<~>`(汉明) / `<%>`(Jaccard)
- **Chunk 推荐**：RecursiveCharacterTextSplitter + chunkSize 1000 + chunkOverlap 200
- **必上 Hybrid**：dense + sparse(BM25/SPLADE)，alpha 0.5–0.7 起步
- **必上 Reranker**：Cohere Rerank 3.5/4.0（商用）/ bge-reranker-v2-m3（开源，8192 token）
- **HyDE**：LLM 生成假设答案文档→嵌入假设文档→检索
- **改 Embedding 必须重建索引**（不同模型向量空间不兼容）
- 完整说明见 [入门](./getting-started.md) / [核心架构与检索策略](./guide-line.md)

## Embedding 模型表

| 模型 | 维度 | max input | 语言 | 特点 |
| --- | --- | --- | --- | --- |
| **OpenAI text-embedding-3-small** | 1536 | 8192 token | 多语 | 性价比首选，MRL 支持 |
| **OpenAI text-embedding-3-large** | 3072（可降） | 8192 token | 多语 | 性能最强，`dimensions` 可降到 256/512/1024 |
| OpenAI text-embedding-ada-002 | 1536 | 8192 token | 多语 | **旧版**，新项目不应再用 |
| **BGE-M3** | 1024 | 8192 token | 100+ 语言 | dense/sparse/multi-vector 三模一体 |
| bge-large-zh-v1.5 | 1024 | 512 token | 中文 | 中文专用，已被 M3 取代 |
| bge-reranker-v2-m3 | — | 8192 token | 多语 | reranker（非 embedding），取代 v1 的 512 限制 |
| Cohere Rerank 3.5 / 4.0 | — | 4096 token | 多语 | 商用 cross-encoder |

> **MRL 降维**（Matryoshka Representation Learning）：text-embedding-3-large 默认 3072 维，用 `dimensions=1024` 降维后**性能仍胜 ada-002 的 1536 维**——存储与检索成本可降一半以上。OpenAI 向量已归一化，cosine 可用更快的 dot product 等价计算。

## 距离度量对照

| 度量 | 含义 | 操作符（pgvector） | 何时用 |
| --- | --- | --- | --- |
| **cosine** | 向量夹角 | `<=>` | OpenAI / BGE 默认 |
| **dot product** | 内积（归一化等价 cosine） | `<#>`（负内积） | OpenAI 向量更快选择 |
| **L2**（欧氏） | 直线距离 | `<->` | 部分图像 / 音频嵌入 |
| **L1**（曼哈顿） | 分量差绝对值和 | `<+>` | 高维稀疏场景 |
| **inner product** | 未归一化内积 | — | MRL 截断后需重新归一化 |

## 向量库参数表

### pgvector HNSW

| 参数 | 默认 | 作用 | 调参方向 |
| --- | --- | --- | --- |
| `m` | 16 | 每层最大连接数 | 加大→召回↑内存↑ |
| `ef_construction` | 64 | 构建候选列表 | 加大→索引质量↑建库慢 |
| `ef_search` | 40 | 查询候选列表 | 加大→召回↑查询慢（`SET LOCAL` 单事务调） |

### pgvector IVFFlat

| 参数 | 默认 | 作用 |
| --- | --- | --- |
| `lists` | rows/1000（≤1M）或 sqrt(rows)（>1M） | 聚类中心数 |
| `probes` | 1（建议 sqrt(lists)） | 探查聚类数 |

> **HNSW 召回与性能整体优于 IVFFlat**，新项目首选 HNSW。IVFFlat 仅在内存吃紧时考虑。pgvector 自 0.5.0 引入 HNSW，自 0.8.0+ 引入 iterative index scans（HNSW 内联过滤），支持 PG 13+。

### Weaviate 关键版本

- v1.5.0：采用 LSM-Tree 存储对象与倒排索引
- v1.31：HNSW 快照加速超大索引启动
- v1.36：默认启用快照 + 懒加载分片（多租户≥1000 分片或≥100GB 自动触发）

## Chunk 策略速查

| 策略 | 工具 | 适用 | 参数 |
| --- | --- | --- | --- |
| 固定字符 | CharacterTextSplitter | 入门理解 | `chunkSize` / `chunkOverlap` |
| **递归字符（推荐起点）** | RecursiveCharacterTextSplitter | 通用文本 | `chunkSize:1000` / `chunkOverlap:200` / `separators:["\n\n","\n"," ",""]` |
| 语义切分 | SemanticChunker | 学术、长技术文档 | `breakpointThresholdType: percentile/stddev/interquartile/gradient` |
| Markdown 结构 | MarkdownHeaderTextSplitter | Markdown 文档 | 保留标题层级→metadata |
| 代码语法 | PythonCodeTextSplitter / 通用语法树 | 代码 | 按函数/类边界 |

**经验**

- 通用文本：500–1500 字符（≈ 100–300 token）
- 代码：按语法树，单 chunk = 完整函数
- 表格：整张表不切分
- 单 chunk token 不超过 Embedding max input（8192）

## Reranker 对比

| 模型 | 输入上限 | 部署 | 备注 |
| --- | --- | --- | --- |
| **Cohere Rerank 3.5 / 4.0** | 4096 token | 商用 API | 多语，rerank-english-v3.0 为英文专版 |
| **bge-reranker-v2-m3** | 8192 token | 开源 | 取代 v1 的 512 限制，多语 |
| bge-reranker-v2-gemma | 8192 token | 开源 | gemma-2b 大杯版 |

> **两阶段**：bi-encoder 召回 top-k → cross-encoder 精排。cross-encoder 把 query+doc 拼一起联合编码 + cross-attention，比 bi-encoder 的独立编码保留更多交互信息。

## Query Transformation 速查

| 方法 | 原理 | 适用 |
| --- | --- | --- |
| **HyDE**（Gao 2022） | LLM 生成假设答案文档→嵌入假设文档→检索 | 零样本场景，规避 query-doc 语义鸿沟 |
| **Query Rewriting** | 重写查询更清晰 | 表达模糊 |
| **Multi-Query** | 生成多变体并行检索合并 | 召回↑ |
| **Step-Back Prompting** | 退一步问更抽象的问题 | 需原则性知识 |
| **Sub-Question Decomposition** | 拆子问题分别检索 | 多跳推理 |

## 框架组件对应

| LangChain | LlamaIndex | 职责 |
| --- | --- | --- |
| Document Loaders | Data Connectors（LlamaHub） | 拿原文 |
| Text Splitters | NodeParser / SentenceSplitter / IngestionPipeline | 切块 |
| Embeddings | Embeddings | 向量化 |
| Vector Stores | Index（VectorStoreIndex 等） | 存储与检索 |
| Retrievers | Retrievers（AutoMerging / BM25 / Ensemble / Router） | 检索 |
| —（LCEL 自拼） | Query Engine（`index.as_query_engine()`） | 检索 + 生成一体化 |
| —（LCEL 自拼） | Response Synthesizer（compact / tree_summarize / refine） | 答案合成 |

> LangChain 经典 `RetrievalQA` / `load_qa_chain` 已标记为 **legacy**，当前推荐 LCEL（Runnable 接口）/ `create_agent` / Deep Agents。LlamaIndex 推荐 `IngestionPipeline` 组合 Transformation 替代直接 NodeParser。

## 范式演进

| 范式 | 特征 |
| --- | --- |
| **Naive RAG** | 单次检索 + 生成，固定 top_k |
| **Advanced RAG** | 加 Query Transformation / Reranking / 前后处理 |
| **Modular RAG** | 模块化可替换组件 |
| **Agentic RAG** | agent 自主决定何时检索 / 选哪个工具 / 评估检索质量 |

## RAG vs Fine-tuning vs Long Context

| 维度 | RAG | Fine-tuning | Long Context |
| --- | --- | --- | --- |
| **注入内容** | 事实/知识 | 风格/格式/任务能力 | 单次会话临时上下文 |
| **更新成本** | 改文档即时 | 重训（贵） | 塞 prompt（按 token） |
| **生产规模化** | 中 | 高 | **20–24x** RAG |
| **时效性** | 实时 | 训练截止 | 实时 |
| **来源可引用** | ✅ | ❌ | ✅（难追溯） |
| **典型场景** | 知识库问答、文档助手 | 改变语气/格式/任务 | 自包含单文档深度推理 |

> 2025 年共识：**三者互补非互斥**。生产常组合 Fine-tuning（固化行为）+ RAG（动态事实）+ Long Context（按需调用）。

## CLI 速跑

```bash
# LangChain Python：30 行 RAG（pip install langchain langchain-openai）
python -c "
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import MemoryVectorStore

text = open('doc.md').read()
chunks = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_text(text)
vs = MemoryVectorStore.from_texts(chunks, OpenAIEmbeddings(model='text-embedding-3-small'))
docs = vs.similarity_search('RAG 是什么', k=4)
prompt = '基于 CONTEXT 回答：\n' + '\n'.join(d.page_content for d in docs) + '\n问题：RAG 是什么'
print(ChatOpenAI(model='gpt-4o-mini').invoke(prompt).content)
"
```

```bash
# LlamaIndex：3 行 RAG（pip install llama-index llama-index-embeddings-openai）
python -c "
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
index = VectorStoreIndex.from_documents(SimpleDirectoryReader('./data').load_data())
print(index.as_query_engine().query('RAG 是什么').response)
"
```

## 反模式清单

- 只用 dense 检索（跳过 BM25/sparse）
- 不做 Reranking 直接喂 LLM
- chunk 过大塞爆 / 过小切断语义单元 / 不设 overlap
- 用固定字符切分处理结构化数据
- 没有评估集反复调参
- 手动截断向量降维不归一化
- 把 RAG 当 Fine-tuning 用
- 把所有知识塞 Long Context 替代 RAG
- 改了 Embedding 模型不重建索引
- top_k 设过大或过小不做相关性过滤
- 忽略元数据过滤（时间窗口/权限/类别）
- 用 Naive RAG 硬扛多源/多跳问答

## 官方资源

- Pinecone RAG 入门：[https://www.pinecone.io/learn/retrieval-augmented-generation/](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- OpenAI Embeddings 指南：[https://developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- LangChain Retrieval：[https://docs.langchain.com/oss/python/langchain/retrieval](https://docs.langchain.com/oss/python/langchain/retrieval)
- LangChain Text Splitters：[https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter)
- LlamaIndex 框架：[https://developers.llamaindex.ai/python/framework/understanding/](https://developers.llamaindex.ai/python/framework/understanding/)
- pgvector 仓库：[https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- BGE-M3 模型卡：[https://huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- bge-reranker-v2-m3：[https://huggingface.co/BAAI/bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3)
- HyDE 论文：[https://arxiv.org/abs/2212.10496](https://arxiv.org/abs/2212.10496)
- AWS RAG 用例：[https://aws.amazon.com/what-is/retrieval-augmented-generation/](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
- Google Cloud RAG 用例：[https://cloud.google.com/use-cases/retrieval-augmented-generation](https://cloud.google.com/use-cases/retrieval-augmented-generation)
- LangChain GitHub：[https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)
- LlamaIndex GitHub：[https://github.com/run-llama/llama_index](https://github.com/run-llama/llama_index)
