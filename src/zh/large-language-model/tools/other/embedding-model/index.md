---
layout: doc
---

# 嵌入模型

**把文本（或图像、音频）映射为高维稠密向量的模型**——是 RAG、语义搜索、推荐、聚类等系统的「语义骨架」。同样的查询语句，「重置密码」「忘记密码」经嵌入后向量非常接近，从而让向量数据库能按「意思」而非「字面」召回。

与 RAG 的边界：RAG 叶子讲**四阶段流程**（切片→嵌入→检索→生成），嵌入只是其中一环。本叶讲**模型本身选型与原理**——为什么 OpenAI text-embedding-3-small 是 1536 维、MRL 怎么降维、BGE-M3 为何「三模一体」、对称检索和非对称检索何时该换不同模型、MTEB 排行榜怎么读。

主流选手分四类：

- **闭源 API**：OpenAI text-embedding-3（small/large）、Cohere Embed v3、Voyage AI（voyage-3-large）、Jina Embeddings v3
- **开源 SOTA**：BGE-M3（BAAI，三模一体）、Nomic Embed（开源+长上下文）、bge-large、E5
- **多模态**：CLIP、Jina CLIP、Voyage multimodal
- **评测基准**：MTEB / MMTEB（HuggingFace 排行榜）

## 评价

**优点**

- **语义召回**：超越关键词，理解同义、改写、跨语言
- **统一表征**：文本/图/音都变向量，一套相似度接口通用
- **开源选项强**：BGE-M3 / Nomic 等可本地部署，零 API 成本
- **维度可调**：MRL 让同一模型输出 256/512/1024 多种维度，按需取舍
- **多语言**：BGE-M3 / Jina v3 支持 100+ 语言，跨语言检索开箱可用
- **生态成熟**：所有向量库、LangChain、LlamaIndex 都原生支持

**缺点**

- **维度爆炸**：3072 维 × 百万条 = GB 级存储与内存
- **截断有损**：MRL 截断虽便宜，但召回确有下降（尤其截到 256 维）
- **任务特化**：对称模型（STS）不擅长非对称检索，选错召回骤降
- **时效性**：嵌入模型「固化」在训练时刻，新词/新概念需重训
- **闭源依赖**：OpenAI / Cohere 等 API 一旦下线，全量重 embed 成本高
- **评测局限**：MTEB 高分 ≠ 你的业务场景好（分布不同）

## 文档地址

- OpenAI Embeddings：[developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- BGE-M3：[huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- Cohere Embed v3：[cohere.com/blog/introducing-embed-v3](https://cohere.com/blog/introducing-embed-v3)
- Voyage AI：[docs.voyageai.com](https://docs.voyageai.com)
- Jina Embeddings v3：[jina.ai/models/jina-embeddings-v3](https://jina.ai/models/jina-embeddings-v3/)
- Nomic Embed：[docs.nomic.ai](https://docs.nomic.ai)
- MTEB Leaderboard：[huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

## GitHub地址

- BGE-M3：[FlagOpen/FlagEmbedding](https://github.com/FlagOpen/FlagEmbedding)
- Nomic Embed：[nomic-ai/contrastors](https://github.com/nomic-ai/contrastors)
- Jina Embeddings：[jina-ai/jina](https://github.com/jina-ai/jina)
- MTEB：[embeddings-benchmark/mteb](https://github.com/embeddings-benchmark/mteb)

## 幻灯片地址

<a href="/SlideStack/embedding-model-slide/" target="_blank">嵌入模型</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=embedding-model" target="_blank" rel="noopener noreferrer">嵌入模型测试题</a>
