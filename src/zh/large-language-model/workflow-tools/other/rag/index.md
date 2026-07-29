---
layout: doc
---

# RAG

RAG（Retrieval Augmented Generation，检索增强生成）是一种**给大语言模型外挂可即时更新知识库**的工程范式：用户提问后，系统先用查询去检索相关文档片段，再把片段塞进 prompt 让 LLM「扎根上下文」生成答案。它由四阶段构成——Ingestion（离线 Chunking + Embedding + 入向量库）→ Retrieval（查询向量化并检索 top-k）→ Augmentation（拼增强 prompt）→ Generation（LLM 基于上下文作答）。相比 Fine-tuning，RAG 注入的是「事实/知识」而非改变模型风格；相比 Long Context，RAG 在生产规模下成本低一个数量级、且支持来源引用与数据私密可控。LangChain 与 LlamaIndex 是当前两大主流编排框架，配合 Pinecone / Weaviate / Chroma / pgvector 向量库与 OpenAI text-embedding-3 / BGE-M3 等嵌入模型构成完整技术栈。生产级 RAG 通常叠加 Hybrid Search（dense + sparse）+ Reranker（cross-encoder 精排）+ Query Transformation（HyDE / Multi-Query / Sub-Question）三件套，从 Naive RAG 演进到 Advanced / Modular / Agentic RAG。

## 评价

**优点**

- **知识动态可更新**：换文档、加文档、删文档无需重训模型，库一更新即可生效——这是相对 Fine-tuning 最本质的优势
- **来源可引用**：每条答案都能追溯到具体文档片段，满足合规审计与企业级「可解释」要求
- **数据私密可控**：可私有化部署向量库 + LLM，敏感数据不出内网，相对直接调用云端 LLM 显著降低泄露风险
- **成本可控**：Embedding + 检索 + 短上下文生成，单次成本远低于把全量知识塞 Long Context
- **降低幻觉**：明确指示「基于 CONTEXT 回答」+ 来源引用，Pinecone 官方模板直接写进 prompt，显著降低 hallucination
- **生态成熟**：LangChain / LlamaIndex 编排 + Pinecone / Weaviate / pgvector 向量库 + OpenAI / BGE 嵌入 + Cohere / bge reranker，组件链工业化

**缺点**

- **检索质量是天花板**：检索不到的知识模型答不出（garbage in garbage out），Naive RAG 对多跳推理问题力不从心
- **工程链路长**：Chunk 策略、Embedding 选型、索引参数、Reranker、Query Transformation，每个环节都需调参，无银弹
- **改 Embedding 必须重建索引**：不同模型向量空间不兼容，混用或部分迁移会直接破坏检索质量且无明显报错
- **依赖评估集**：没有 ground truth 就只能玄学调参，但建评估集本身成本不低
- **复杂查询仍需 Agentic RAG**：固定流水线扛不住多源/多跳问答，需 agent 自主编排检索——复杂度进一步上升
- **不能扩展模型能力**：只能注入「新事实」，无法让模型学会新语言、新推理范式，能力扩展仍需训练

## 文档地址

- [Pinecone Learning Center — Retrieval-Augmented Generation](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [OpenAI 官方 Vector embeddings 指南](https://developers.openai.com/api/docs/guides/embeddings)
- [LangChain Retrieval 文档](https://docs.langchain.com/oss/python/langchain/retrieval)
- [LlamaIndex 框架理解](https://developers.llamaindex.ai/python/framework/understanding/)
- [pgvector 官方仓库](https://github.com/pgvector/pgvector)

## GitHub地址

[langchain-ai/langchain](https://github.com/langchain-ai/langchain) · [run-llama/llama_index](https://github.com/run-llama/llama_index) · [pgvector/pgvector](https://github.com/pgvector/pgvector)

## 幻灯片地址

<a href="/SlideStack/rag-slide/" target="_blank">RAG</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">RAG 测试题</a>
