---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 LangChain 官方 Retrieval 文档（docs.langchain.com）+ LlamaIndex 框架理解 + Pinecone Learning Center + OpenAI Vector embeddings 指南编写，对照 LangChain / LlamaIndex 当前版本行为

## 速查

- **四阶段**：Ingestion（离线 Chunking→Embedding→入向量库）→ Retrieval（查询向量化+检索 top-k）→ Augmentation（拼 CONTEXT prompt）→ Generation（LLM 扎根生成）
- **OpenAI Embeddings**：text-embedding-3-small **1536 维** / text-embedding-3-large **3072 维**，max input **8192 tokens**
- **MRL 降维**：通过 `dimensions` 参数直接生成 256/512/1024 维，**仍胜旧 ada-002（1536 维）**，存储省一半以上
- **BGE-M3**：1024 维 / 8192 token / 100+ 语言，单模型同时支持 dense / sparse / multi-vector 三模检索
- **向量库四选型**：Pinecone（托管）/ Weaviate（自托管，HNSW+LSM）/ Chroma（轻量）/ pgvector（PG 扩展，HNSW+IVFFlat）
- **Chunk 策略**：通用文本首选 **RecursiveCharacterTextSplitter**（默认分隔符 `["\n\n", "\n", " ", ""]`）；语义敏感用 SemanticChunker；Markdown 用 MarkdownHeaderTextSplitter
- **必上 Reranker**：bi-encoder 粗召 → cross-encoder 精排，既提准又压 token、降本降延迟
- **Hybrid Search**：dense（语义）+ sparse（BM25/SPLADE 词法）按 alpha 权重融合——查产品名/缩写/术语必备
- **HyDE**：先让 LLM 生成假设答案文档再嵌入，规避 query-document 语义鸿沟，零样本场景效果显著
- **RAG vs Fine-tuning vs Long Context**：RAG 注入事实、Fine-tuning 改风格、Long Context 适合原型——**生产常组合**

## RAG 是什么

RAG（检索增强生成）是给大语言模型**外挂一个可即时更新的知识库**的工程范式。它解决的核心矛盾是：LLM 训练后知识被冻结，无法即时回答新事件、私有数据、长尾领域知识；而重新训练（Fine-tuning）成本极高且时效性仍差。

- **本质**：把「检索」插在「生成」之前，让 LLM 「看着资料答题」而非「凭记忆答题」
- **离线阶段**：把语料切块、向量化、存进向量库（一次性投入，可增量更新）
- **在线阶段**：查询来了才检索+生成，每次都是最新资料

> RAG 不是模型，是**架构模式**——同一套模型（GPT-4 / Claude / Llama）开 RAG 后知识库可动态更新，不开 RAG 只能用训练截止日期前的知识。

## RAG vs Fine-tuning vs Long Context

| 维度 | RAG | Fine-tuning | Long Context |
| --- | --- | --- | --- |
| **注入内容** | 事实/知识 | 风格/格式/任务能力 | 单次会话的临时上下文 |
| **更新成本** | 改文档即时生效 | 重训（贵） | 塞 prompt（按 token 计费） |
| **生产规模化成本** | 中（Embedding + 检索） | 高（训练 + 推理） | **20–24x** RAG 成本 |
| **时效性** | 实时 | 训练截止 | 实时 |
| **来源可引用** | ✅ | ❌ | ✅（但难追溯） |
| **典型场景** | 知识库问答、文档助手 | 改变语气/输出格式/任务能力 | 自包含单文档深度推理 |

> 2025 年行业共识：**三者互补非互斥**。生产常组合 Fine-tuning（固化行为/格式）+ RAG（动态事实）+ Long Context（按需调用）。

## RAG 四阶段

### Ingestion（离线入库）

把原始语料加工成可检索的向量。一次性投入，可增量更新：

```text
原始文档（PDF/HTML/Markdown）
  ↓ Document Loader / Data Connector
Document 对象（文本 + metadata）
  ↓ Text Splitter / NodeParser
Chunk（语义完整的小段）
  ↓ Embedding 模型（OpenAI / BGE）
向量（1536 / 3072 / 1024 维）
  ↓ 入库
Vector Store（Pinecone / Weaviate / pgvector）
```

关键决策：选 Loader（拿得到原文）→ 选 Splitter（保住语义边界）→ 选 Embedding（决定检索质量上限）→ 选 Vector Store（决定生产规模化的查询延迟与成本）。

### Retrieval（在线检索）

用户提问来了之后：

1. 用同一个 Embedding 模型把 query 向量化
2. 在向量库做相似度检索（cosine / dot product / L2）
3. 取 top-k（典型 3-10）候选 chunk
4. 可选：metadata 预过滤（时间窗口/权限/类别）

> 必须**用同一个 Embedding 模型**——query 和 document 向量空间一致才能比对。改 Embedding 必须重建整个索引。

### Augmentation（拼 prompt）

把检索到的 chunk 拼进 prompt 模板：

```text
你是一个问答助手。请仅基于下方 CONTEXT 回答用户问题。
若 CONTEXT 无答案，请回答「我不知道」。

CONTEXT:
{retrieved_chunks}

用户问题：{query}

回答（引用来源）：
```

> Pinecone 官方模板直接写进 prompt：「基于 CONTEXT 回答，无答案答不知道」——显著降低 hallucination。

### Generation（LLM 扎根生成）

LLM 仅基于 prompt 中的 CONTEXT 生成答案，并按指示引用来源。无答案时回答「我不知道」而非编造。

## Embedding 选型

| 模型 | 维度 | max input | 特点 |
| --- | --- | --- | --- |
| **OpenAI text-embedding-3-small** | 1536 | 8192 token | 性价比首选，MRL 支持 |
| **OpenAI text-embedding-3-large** | 3072（可降） | 8192 token | 性能最强，可用 `dimensions` 降维 |
| **OpenAI ada-002（旧版）** | 1536 | 8192 token | 性能更低，新项目不应再用 |
| **BGE-M3（BAAI）** | 1024 | 8192 token | 100+ 语言，dense/sparse/multi-vector 三模一体 |
| **bge-large-zh-v1.5** | 1024 | 512 token | 中文专用，已被 M3 取代 |

**MRL 降维**（Matryoshka Representation Learning）：text-embedding-3-large 默认 3072 维，但用 `dimensions` 参数可生成 256/512/1024 维向量，性能仍胜旧 ada-002 的 1536 维——存储与检索成本可降一半以上。

> OpenAI 向量已归一化，cosine 可用更快的 **dot product** 等价计算。

## Chunk 策略速览

| 策略 | 工具 | 适用场景 |
| --- | --- | --- |
| **固定字符切分** | CharacterTextSplitter | 简单文本，仅作入门 |
| **递归字符切分（推荐起点）** | RecursiveCharacterTextSplitter | 通用文本，按段落→行→空格递归切 |
| **语义切分** | SemanticChunker（LangChain） | 语义敏感场景，按句嵌入相似度找断点 |
| **结构化切分** | MarkdownHeaderTextSplitter / 代码语法树 | Markdown / 代码 / 表格 |

RecursiveCharacterTextSplitter 默认分隔符顺序：

```text
separators = ["\n\n", "\n", " ", ""]
```

递归逻辑：先按段落切，段落太大再按行，行太大再按空格，最后按字符——保证**优先在语义边界切**。

> 设 `chunk_overlap`（典型 50-200 字符）保留跨块上下文，避免关键信息被切到两半。

## 第一个 RAG（LangChain 30 行）

```ts
// 安装：pnpm add langchain @langchain/openai @langchain/community
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

// 1. Ingestion：切块 + 嵌入 + 入库
const text = "（你的文档全文）";
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const chunks = await splitter.splitText(text);
const vectorStore = await MemoryVectorStore.fromTexts(
  chunks,
  {},
  new OpenAIEmbeddings({ model: "text-embedding-3-small" })
);

// 2. Retrieval：查询向量化 + top-k 检索
const query = "RAG 是什么？";
const docs = await vectorStore.similaritySearch(query, 4);

// 3+4. Augmentation + Generation
const prompt = PromptTemplate.fromTemplate(`
基于 CONTEXT 回答问题。无答案答「我不知道」。
CONTEXT: {context}
问题：{question}
`);
const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const answer = await llm.invoke(
  await prompt.format({
    context: docs.map((d) => d.pageContent).join("\n\n"),
    question: query,
  })
);
```

> 生产环境把 `MemoryVectorStore` 换成 Pinecone / Weaviate / pgvector 即可。LlamaIndex 同理用 `VectorStoreIndex.fromDocuments()` 一行替代。

## 下一步

- [核心架构与检索策略](./guide-line.md)：四阶段深度 + Hybrid Search + Reranker + HyDE + 反模式
- [参考](./reference.md)：Embedding / 向量库 / Chunk 参数表 + 官方资源
