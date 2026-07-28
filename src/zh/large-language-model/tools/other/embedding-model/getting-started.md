---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenAI / BGE-M3 / Cohere / Voyage / Jina 官方文档 + MTEB 2026 编写

## 速查

- 嵌入模型 = 把文本映射成稠密向量的神经网络
- 维度常见档：384（轻量）/ 768 / 1024 / 1536（OpenAI small 默认）/ 3072（OpenAI large 默认）
- OpenAI text-embedding-3-small=1536 维，large=3072 维，都支持 `dimensions` 参数降维（MRL）
- BGE-M3 = 1024 维 + 「三模一体」：dense / sparse / multi-vector 一次产出
- MRL（Matryoshka Representation Learning）= 把信息前载到前几维，可截断降维
- 对称检索（STS、相似句）vs 非对称检索（短 query → 长文档），模型选型不同
- 评测看 MTEB：8 类任务（Retrieval / STS / Clustering / Reranking / Classification / Pair / Bitext / Summarization）
- 归一化向量：用余弦或内积都行（OpenAI / BGE 默认已归一化）
- 闭源 API：OpenAI / Cohere / Voyage / Jina；开源：BGE-M3 / Nomic / E5
- 中文场景：BGE-M3 / Cohere multilingual / Voyage 表现普遍好于纯英文模型
- 上下文长度：Jina v3 / BGE-M3 都支持 8192 token，适合长文档

## 嵌入模型是什么

输入一段文本，输出一个固定维度的浮点向量。**语义相近的文本，向量距离也近**。

```python
# OpenAI
from openai import OpenAI
client = OpenAI()
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input="如何重置密码",
)
vec = resp.data[0].embedding   # 长度 1536 的 list[float]
```

```python
# BGE-M3（开源，本地推理）
from FlagEmbedding import BGEM3FlagModel
model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
emb = model.encode(["如何重置密码"])['dense_vecs'][0]   # 长度 1024 的 numpy 数组
```

## 维度与存储

| 维度 | 单条大小（float32） | 100 万条大小 | 代表模型 |
| --- | --- | --- | --- |
| 384 | 1.5 KB | 1.5 GB | Cohere v3 (384)、MiniLM |
| 768 | 3 KB | 3 GB | Nomic Embed、bge-base |
| 1024 | 4 KB | 4 GB | BGE-M3、Cohere v3 |
| 1536 | 6 KB | 6 GB | OpenAI 3-small、ada-002 |
| 3072 | 12 KB | 12 GB | OpenAI 3-large |

::: tip 维度不是越大越好

3072 维比 1024 维多 3 倍存储和内存，但召回提升常常只有 1-2%。对成本敏感的场景，1024 维 + MRL 截断往往性价比最高。

:::

## OpenAI text-embedding-3

### 两个版本默认维度

| 模型 | 默认维度 | 最小维度 | MRL 支持 |
| --- | --- | --- | --- |
| text-embedding-3-small | **1536** | 256 | ✓ |
| text-embedding-3-large | **3072** | 256 | ✓ |

### 用 dimensions 参数降维

```python
# 把 large 截到 1024 维（MRL 训练保证前 1024 维信息充分）
resp = client.embeddings.create(
    model="text-embedding-3-large",
    input="...",
    dimensions=1024,   # MRL 降维
)
```

::: tip MRL 是什么

**Matryoshka Representation Learning**（俄罗斯套娃表征学习）——训练时让信息**前载**到前几维，截断后保留大部分语义。可一个模型输出多种维度，无需重训。OpenAI 3 系列、Voyage voyage-context-3、Nomic 都用这技术。

:::

## BGE-M3：三模一体

BAAI（北京智源）出品，一个模型同时输出三种向量：

| 输出 | 维度 | 用途 |
| --- | --- | --- |
| **dense** | 1024 | 语义检索（默认） |
| **sparse** | 词表大小 | 词法匹配（类 BM25） |
| **multi-vector** | token 级 | 细粒度匹配（ColBERT 风格） |

```python
from FlagEmbedding import BGEM3FlagModel
model = BGEM3FlagModel('BAAI/bge-m3')
out = model.encode(["文档1", "文档2"], return_dense=True, return_sparse=True, return_colbert_vecs=True)
out['dense_vecs']       # (N, 1024)
out['lexical_weights']  # sparse 词权重
out['colbert_vecs']     # token 级向量
```

其他关键参数：支持 **100+ 语言**、上下文 **8192 token**、训练数据覆盖 170+ 语言。

## 对称 vs 非对称检索

这是选型的核心分水岭。

| 类型 | 输入形态 | 典型任务 | 代表模型 |
| --- | --- | --- | --- |
| **对称** | 两段同质文本（句 vs 句） | STS、聚类、去重 | Sentence-BERT、SimCSE |
| **非对称** | 短 query → 长文档 | RAG、文档检索 | DPR、E5、BGE、Cohere Embed v3 |

::: warning 选错模型召回骤降

用对称模型（如纯 STS 训练）做非对称检索，召回会明显下降——因为它们没学过「短问题匹配长答案」。RAG 场景务必选非对称/检索专用模型（带 `input_type` 区分 query/document 的）。

:::

### input_type 信号

Cohere / Voyage 等支持 `input_type` 参数，明确告诉模型这是 query 还是 document：

```python
# Cohere
co.embed(texts=["重置密码步骤"], model="embed-multilingual-v3.0",
         input_type="search_document")   # 入库时
co.embed(texts=["怎么改密码"], model="embed-multilingual-v3.0",
         input_type="search_query")      # 查询时
```

模型据此用不同前缀/处理，提升非对称匹配。

## 主流选手速览

| 模型 | 类型 | 默认维度 | 上下文 | 多语言 | 特色 |
| --- | --- | --- | --- | --- | --- |
| OpenAI 3-small | API | 1536 | 8191 | ✓ | 生态默认，便宜 |
| OpenAI 3-large | API | 3072 | 8191 | ✓ | 闭源 SOTA 之一 |
| Cohere Embed v3 | API | 1024/384 | 512 | ✓（multilingual） | input_type 信号 |
| Voyage voyage-3-large | API | 可变 | 32k | ✓ | 多个领域 SOTA |
| Jina Embeddings v3 | API/开源 | ≤1024 | 8192 | ✓ | 570M 参数，Task LoRA |
| BGE-M3 | 开源 | 1024 | 8192 | ✓（100+） | 三模一体 |
| Nomic Embed | 开源 | 768 | 8192 | 部分 | 开源+长上下文 |

## MTEB 排行榜

**MTEB（Massive Text Embedding Benchmark）** 是嵌入模型的事实标准评测，覆盖 **8 类任务**：

| 任务 | 说明 |
| --- | --- |
| Retrieval | 检索（RAG 核心） |
| STS | 语义文本相似度 |
| Clustering | 聚类 |
| Reranking | 重排 |
| Classification | 分类 |
| Pair Classification | 句对分类 |
| Bitext Mining | 双语对齐 |
| Summarization | 摘要 |

::: tip 怎么读 MTEB

1. **先看 Retrieval 子榜**（RAG 场景最相关）
2. **看你的语言**（英文榜 ≠ 中文榜，有专门中文/多语言榜）
3. **对比维度**（同样分数，1024 维比 3072 维性价比高）
4. **开源 vs 闭源**分榜对比

排行榜地址：[huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

:::

::: warning MTEB 高分 ≠ 业务好

MTEB 数据集分布与你的业务数据可能差异很大。**务必在自己的小样本上做 A/B**：取 100-500 条 query + 人工标注相关文档，对比各模型 recall@5 / recall@10。

:::

## 选型决策表

| 你的情况 | 推荐 |
| --- | --- |
| 通用 RAG，闭源省心 | OpenAI text-embedding-3-small（1536） |
| 极致召回，预算够 | OpenAI 3-large 或 Voyage voyage-3-large |
| 多语言 / 中文 | BGE-M3 或 Cohere multilingual v3 |
| 要混合检索（dense+sparse） | BGE-M3（一次产出两种） |
| 本地部署 / 隐私 | BGE-M3、Nomic Embed |
| 长文档（> 8k token） | Voyage（32k）或 Jina v3（8192） |
| 成本敏感 | 1024 维 + MRL 截断 |

## 下一步

- [指南](./guide-line) —— MRL 截断取舍 / input_type 用法 / 中文模型对比 / 重 embed 策略
- [参考](./reference) —— 各模型参数全表 / 维度-价格-召回矩阵 / MTEB 子榜
