---
layout: doc
---

# 向量数据库

**专门存储、索引与检索高维向量的数据库系统**——把文本、图像、音频等非结构化数据经嵌入模型转成稠密浮点向量（常见 384/768/1024/1536/3072 维），再以「向量相似度」为核心查询语义，支撑语义搜索、推荐、RAG、去重、聚类等场景。

与 RAG 的边界：本叶聚焦**存储选型与索引原理**——为什么 HNSW 比 IVF_FLAT 召回高、为何 pgvector 适合「已有 PG」的场景、Pinecone serverless 与 Milvus 自托管的取舍。RAG 叶子讲**四阶段流程**（切片→嵌入→检索→生成），本叶讲「向量在库里到底是怎么存、怎么查」。

主流选手分三类：

- **托管 SaaS / Serverless**：Pinecone（2025 起 serverless 为主，pod 已停售新户）、Weaviate Cloud
- **自托管开源**：Milvus（索引矩阵最全）、Qdrant（Rust）、Weaviate（Go）、Chroma（轻量）、pgvector（PG 扩展）
- **数据库扩展**：pgvector（PostgreSQL）、Redis Stack、Elasticsearch

## 评价

**优点**

- **语义检索**：超越关键词，按「意思」匹配（同义词、跨语言、改写都召回）
- **多模态统一**：文本/图/音/代码都变成向量，同一套相似度接口
- **高效 ANN**：HNSW / IVF 等索引让百万级向量毫秒级返回（暴力计算不可能）
- **混合检索**：Weaviate / Qdrant / Milvus 都支持 dense+sparse 同库查询
- **生态成熟**：LangChain / LlamaIndex / Vercel AI SDK 等开箱即接
- **与现有 DB 融合**：pgvector 让 Postgres 一库搞定关系 + 向量

**缺点**

- **维度爆炸**：1536/3072 维 × 百万行 = GB 级内存，HNSW 尤其吃 RAM
- **近似不精确**：除 FLAT 外所有 ANN 索引都是近似结果，召回 < 100%
- **更新成本高**：HNSW 增删后图结构需重新平衡，大批量写入要停服重建
- **调参门槛**：`ef_construction` / `M` / `nlist` / `nprobe` 等参数互相牵制
- **成本**：托管服务按存储 + 计算计费，大规模场景比自建贵数倍
- **选型难**：6+ 主流产品各有侧重，选错迁移成本极高

## 文档地址

- Pinecone：[docs.pinecone.io](https://docs.pinecone.io)
- Milvus：[milvus.io/docs](https://milvus.io/docs/index.md)
- Weaviate：[weaviate.io/developers/weaviate](https://weaviate.io/developers/weaviate)
- Qdrant：[qdrant.tech/documentation](https://qdrant.tech/documentation/)
- Chroma：[docs.trychroma.com](https://docs.trychroma.com)
- pgvector：[github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)

## GitHub地址

- Milvus：[milvus-io/milvus](https://github.com/milvus-io/milvus)
- Qdrant：[qdrant/qdrant](https://github.com/qdrant/qdrant)
- Weaviate：[weaviate/weaviate](https://github.com/weaviate/weaviate)
- Chroma：[chroma-core/chroma](https://github.com/chroma-core/chroma)
- pgvector：[pgvector/pgvector](https://github.com/pgvector/pgvector)

## 幻灯片地址

<a href="/SlideStack/vector-database-slide/" target="_blank">向量数据库</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vector-database" target="_blank" rel="noopener noreferrer">向量数据库测试题</a>
