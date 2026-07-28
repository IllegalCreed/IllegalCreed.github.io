---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenAI / BGE-M3 / Cohere / Voyage / Jina 官方文档 + MTEB 2026 编写。完整 API 见各官方文档。

## 主流嵌入模型参数表

| 模型 | 类型 | 默认维度 | 最小维度 | 上下文(token) | 多语言 | 特色 |
| --- | --- | --- | --- | --- | --- | --- |
| OpenAI text-embedding-3-small | API | 1536 | 256 | 8191 | ✓ | 生态默认，便宜 |
| OpenAI text-embedding-3-large | API | 3072 | 256 | 8191 | ✓ | 闭源 SOTA |
| OpenAI text-embedding-ada-002 | API | 1536 | 1536(固定) | 8191 | ✓ | 旧版 |
| Cohere Embed v3 (English) | API | 1024 | 1024 | 512 | 部分 | input_type |
| Cohere Embed v3 (Multilingual) | API | 1024 | 1024 | 512 | ✓(100+) | input_type |
| Cohere Embed v3 (384 变体) | API | 384 | 384 | 512 | 视版本 | 压缩友好 |
| Voyage voyage-3-large | API | 可变 | 256 | 32000 | ✓ | 多领域 SOTA |
| Voyage voyage-3 | API | 1024 | 1024 | 32000 | ✓ | 通用 |
| Voyage voyage-code-3 | API | 1024 | 1024 | 32000 | 英文 | 代码检索 |
| Jina Embeddings v3 | API/开源 | ≤1024 | 256 | 8192 | ✓(89) | 570M 参数，Task LoRA |
| BGE-M3 | 开源 | 1024 | 1024 | 8192 | ✓(100+) | dense+sparse+multi-vector |
| bge-large-en-v1.5 | 开源 | 1024 | 1024 | 512 | 英文 | 英文专项 |
| bge-large-zh-v1.5 | 开源 | 1024 | 1024 | 512 | 中文 | 中文专项 |
| Nomic Embed | 开源 | 768 | 768 | 8192 | 部分 | 开源+长上下文 |
| E5-large-v2 | 开源 | 1024 | 1024 | 512 | ✓ | 早期 SOTA |

## 维度-存储-成本速查（float32）

| 维度 | 单条 | 100 万条 | 1 亿条 |
| --- | --- | --- | --- |
| 384 | 1.5 KB | 1.5 GB | 150 GB |
| 768 | 3 KB | 3 GB | 300 GB |
| 1024 | 4 KB | 4 GB | 400 GB |
| 1536 | 6 KB | 6 GB | 600 GB |
| 3072 | 12 KB | 12 GB | 1.2 TB |

::: tip 量化省存储

实际入库常用 SQ8 / PQ 量化（见向量数据库叶），float32 → int8 省 4 倍。3072 维量化后约 3 GB/百万条。

:::

## OpenAI Embeddings API

### 基本调用

```python
from openai import OpenAI
client = OpenAI()

resp = client.embeddings.create(
    model="text-embedding-3-small",
    input="要嵌入的文本",
    # 可选：dimensions=1024  (MRL 降维，仅 3 系列支持)
    # 可选：encoding_format="float" | "base64"
)
vec = resp.data[0].embedding  # list[float]
```

### 批量

```python
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=["doc1", "doc2", ...],  # ≤ 2048 条
)
for d in resp.data:
    print(d.index, len(d.embedding))
```

### 计费

- 按输入 token 计费
- text-embedding-3-small：约 $0.02 / 1M token
- text-embedding-3-large：约 $0.13 / 1M token

## BGE-M3

### 三种输出

```python
from FlagEmbedding import BGEM3FlagModel
model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

out = model.encode(
    ["文档1", "文档2"],
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True,
    batch_size=32,
)
out['dense_vecs']        # (N, 1024) 语义向量
out['lexical_weights']   # sparse 词权重（类 BM25）
out['colbert_vecs']      # token 级向量（multi-vector）
```

### 关键参数

| 参数 | 说明 |
| --- | --- |
| `use_fp16` | 半精度推理，省显存 |
| `max_length` | 最大 8192 token |
| `batch_size` | 依显存调，A100 可 64 |

## Cohere Embed v3

```python
import cohere
co = cohere.Client()

resp = co.embed(
    texts=["doc1", "doc2"],
    model="embed-english-v3.0",        # 或 embed-multilingual-v3.0
    input_type="search_document",      # search_query / search_document / classification / clustering
    embedding_types=["float"],        # 也可 "int8" / "uint8" / "binary" / "ubinary"
)
embs = resp.embeddings.float
```

### embedding_types

| 类型 | 大小 | 用途 |
| --- | --- | --- |
| float | 全精度 | 默认 |
| int8 | 1/4 | 量化省内存 |
| binary | 1/32 | 极致压缩，召回损失大 |

### input_type 取值

| 值 | 用途 |
| --- | --- |
| `search_query` | 查询时用 |
| `search_document` | 入库时用 |
| `classification` | 分类任务 |
| `clustering` | 聚类任务 |
| `image` | 多模态 |

## Voyage AI

```python
import voyageai
vo = voyageai.Client()

resp = vo.embed(
    texts=["doc1", "doc2"],
    model="voyage-3-large",
    input_type="document",   # document / query
    # output_dtype="int8" 等可选
)
embs = resp.embeddings
```

### 模型矩阵

| 模型 | 维度 | 上下文 | 适用 |
| --- | --- | --- | --- |
| voyage-3-large | 1024(可变) | 32000 | 通用 SOTA |
| voyage-3 | 1024 | 32000 | 通用 |
| voyage-3-lite | 512 | 32000 | 省内存 |
| voyage-code-3 | 1024 | 32000 | 代码 |
| voyage-finance-2 | 1024 | 32000 | 金融 |
| voyage-law-2 | 1024 | 32000 | 法律 |

## Jina Embeddings v3

```python
# API
from openai import OpenAI
client = OpenAI(base_url="https://api.jina.ai/v1", api_key="jina_xxx")
resp = client.embeddings.create(
    model="jina-embeddings-v3",
    input="...",
    extra_body={"dimensions": 1024, "task": "text-matching"},
)
```

### task（Task LoRA）

| task | 用途 |
| --- | --- |
| `text-matching` | 对称（STS、去重） |
| `retrieval.passage` | 非对称，入库 |
| `retrieval.query` | 非对称，查询 |
| `separation` | 聚类 |
| `classification` | 分类 |

类似 Cohere 的 input_type，但更细。

## MTEB 任务分类

| 任务 | 评测内容 | 典型数据集 |
| --- | --- | --- |
| Retrieval | 检索 | MS MARCO, NFCorpus |
| STS | 语义相似度 | STS12-22, SickR |
| Clustering | 聚类 | Reddit, StackExchange |
| Reranking | 重排 | AskUbuntu, StackOverflow |
| Classification | 分类 | Amazon, IMDb |
| Pair Classification | 句对 | SprintDuplicate, PawsX |
| Bitext Mining | 双语对齐 | Tatoeba, BUCC |
| Summarization | 摘要 | SummEval |

## MTEB 排行榜阅读指南

地址：[huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

阅读步骤：

1. **选任务**：RAG 场景看 Retrieval
2. **选语言**：有英文 / 中文 / 多语言分榜
3. **选模型类型**：开源 / 闭源分榜
4. **对比维度**：同分比维度，低维性价比高
5. **MMTEB**：多语言综合榜

::: warning 排行榜局限

- 数据集分布可能与你业务不符
- 模型在 MTEB 上「过拟合」刷分
- 总分高不代表 Retrieval 子项高

务必在自己数据上验证。

:::

## 选型决策矩阵

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| 通用 RAG，闭源省心 | OpenAI 3-small | Voyage-3 |
| 极致召回 | OpenAI 3-large | Voyage-3-large |
| 多语言 / 中文 | BGE-M3 | Cohere multilingual v3 |
| 混合检索（dense+sparse） | BGE-M3 | - |
| 本地部署 / 隐私 | BGE-M3 | Nomic Embed |
| 长文档（> 8k） | Voyage (32k) | Jina v3 (8k) |
| 代码检索 | Voyage-code-3 | Jina v3 |
| 成本敏感 | 1024 维 + MRL 截断 | Cohere int8 |
| 对称任务（去重/STS） | Jina v3 (text-matching) | Sentence-BERT |

## 资源链接

- OpenAI Embeddings 指南：[developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- BGE-M3 模型页：[huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- BGE-M3 论文：[arxiv.org/abs/2402.03216](https://arxiv.org/abs/2402.03216)
- Cohere Embed v3 介绍：[cohere.com/blog/introducing-embed-v3](https://cohere.com/blog/introducing-embed-v3)
- Voyage AI 文档：[docs.voyageai.com](https://docs.voyageai.com)
- Jina Embeddings v3：[jina.ai/models/jina-embeddings-v3](https://jina.ai/models/jina-embeddings-v3/)
- Jina v3 论文：[arxiv.org/abs/2409.10173](https://arxiv.org/abs/2409.10173)
- MTEB Leaderboard：[huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- MTEB 论文：[arxiv.org/abs/2210.07316](https://arxiv.org/abs/2210.07316)
- Matryoshka（Pinecone 解读）：[pinecone.io/learn/openai-embeddings-v3](https://www.pinecone.io/learn/openai-embeddings-v3/)
- Supabase MRL 实战：[supabase.com/blog/matryoshka-embeddings](https://supabase.com/blog/matryoshka-embeddings)
