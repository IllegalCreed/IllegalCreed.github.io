---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenAI / BGE-M3 / Cohere / Voyage / Jina 官方文档 + MTEB 2026 编写

## 速查

- MRL 截断：降到原维度 1/2 召回损失 ~1-2%，1/4 损失 ~3-5%，1/8 损失 ~8-12%
- 入库与查询必须用**同一模型同一维度**，否则距离无意义
- Cohere / Voyage 用 `input_type=search_query/search_document` 提升非对称匹配
- 中文场景：BGE-M3、bge-large-zh、Cohere multilingual 普遍优于纯英文模型
- 重 embed 成本：百万文档 × 3072 维 ≈ 几十美元 + 数小时，迁移前评估
- 批量 embed：OpenAI 一次最多 2048 输入，BGE-M3 本地 batch=32-64
- 归一化向量：用余弦或内积都行，省一次模长计算
- 多语言统一：跨语言检索用 BGE-M3 / Jina v3，别一种语言一个模型
- MTEB 看 Retrieval 子榜 + 你的语言，别只看总分
- 长文档：超上下文（如 8192 token）要切片，别硬塞

## MRL 截断的取舍

MRL 让一个模型输出多种维度，但截断不是免费的。

### 经验损失（OpenAI 3-large，3072 → N）

| 截到 | 相对原维度 | 召回损失（MTEB Retrieval） |
| --- | --- | --- |
| 3072 | 100% | 基线 |
| 1536 | 1/2 | ~1-2% |
| 1024 | 1/3 | ~2-3% |
| 768 | 1/4 | ~3-5% |
| 512 | 1/6 | ~5-8% |
| 256 | 1/12 | ~8-12% |

### 选择策略

```text
1. 先用全维度建基线 recall
2. 逐步截断（3072 → 1536 → 1024 → 768）
3. 在自己数据上测 recall@10，掉到 95% 基线就停
4. 选「召回可接受的最小维度」省钱省内存
```

```python
# OpenAI：一次 API 调用直接指定维度
resp = client.embeddings.create(model="text-embedding-3-large", input=text, dimensions=1024)
```

::: warning 截断后无法「升级」

如果入库时存了 1024 维（截断版），之后想用 3072 维只能**全量重 embed**——存的是截断向量，补不回后面维度。规划时若不确定，宁可先存全维度，查询时再截断（动态截断）。

:::

## input_type：非对称检索的关键

Cohere / Voyage 等模型用 `input_type` 区分 query 和 document，内部用不同前缀训练：

### Cohere Embed v3

```python
import cohere
co = cohere.Client()

# 入库：document
doc_emb = co.embed(
    texts=["...长文档..."],
    model="embed-multilingual-v3.0",
    input_type="search_document",
    embedding_types=["float"],
).embeddings.float[0]

# 查询：query
query_emb = co.embed(
    texts=["怎么改密码"],
    model="embed-multilingual-v3.0",
    input_type="search_query",
    embedding_types=["float"],
).embeddings.float[0]
```

### Voyage

```python
import voyageai
vo = voyageai.Client()

# 入库
doc_emb = vo.embed(texts=["..."], model="voyage-3", input_type="document").embeddings
# 查询
query_emb = vo.embed(texts=["..."], model="voyage-3", input_type="query").embeddings
```

::: tip 用错 input_type 召回掉几个点

入库时标 `document`、查询时标 `query`，模型才会用训练时的非对称匹配。两边都标同一个（或都不标）会损失召回。

:::

## 中文场景模型对比

中文检索有特殊性（分词、字符级语义、成语等），纯英文训练的模型表现差。

| 模型 | 中文表现 | 备注 |
| --- | --- | --- |
| BGE-M3 | 强 | 开源，100+ 语言，三模一体 |
| bge-large-zh-v1.5 | 强 | 中文专项，1024 维 |
| Cohere embed-multilingual-v3 | 强 | API，100+ 语言 |
| OpenAI text-embedding-3 | 中上 | 多语言但非中文专项 |
| Voyage voyage-3-large | 强 | 多领域 SOTA |
| m3e-large | 中 | 早期中文开源，已被 BGE 超越 |

::: tip 中文分词影响

部分模型对未分词的中文长句表现不稳。可在 embed 前做轻量预处理（去停用词、标点归一），但别过度——嵌入模型本身能处理原始文本。

:::

## 批量 Embed

### OpenAI

```python
# 单次最多 2048 条 input
texts = ["doc1", "doc2", ...]  # ≤ 2048
resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
embs = [d.embedding for d in resp.data]
```

### BGE-M3 本地

```python
from FlagEmbedding import BGEM3FlagModel
model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
# batch_size 依显存调，A100 可 64
embs = model.encode(texts, batch_size=32)['dense_vecs']
```

### 速率与成本

- OpenAI：按 token 计费，3-small 极便宜（$0.02/M token）
- 重 embed 百万文档：3072 维约几十美元 + 几十分钟
- 本地 BGE-M3：单卡 A100 约 1-2 小时跑完百万条

## 重 Embed 策略

换模型或换维度都要重 embed，流程：

1. **评估必要性**：新模型 recall 提升几个点？值得迁移成本吗
2. **双写过渡**：新模型结果写新 collection，旧 collection 保留
3. **影子查询**：新旧两路查询对比，确认新模型确实更好
4. **全量重算**：批量 embed 入新库
5. **切流验证**：流量逐步切到新库，监控业务指标
6. **下线旧库**：稳定 N 天后删除

::: warning 别忘了改查询侧

入库用了 `input_type=search_document`，查询必须用 `search_query`。换模型时两端同步改，否则召回崩塌。

:::

## 多语言统一

跨国 / 多语种业务，**别一种语言一个模型**：

- 选多语言模型（BGE-M3 / Cohere multilingual / Jina v3）
- 不同语言的 query 和 document 直接跨语匹配
- MTEB 有专门的多语言榜（MMTEB）

```python
# BGE-M3：中英文 query 直接查英文文档
model.encode(["如何重置密码"])  # 中文 query
model.encode(["How to reset password: step 1..."])  # 英文 doc
# 两者向量距离会很近
```

## 多模态嵌入

文本之外的模态：

| 模型 | 模态 |
| --- | --- |
| CLIP / Jina CLIP | 图像 + 文本统一空间 |
| Voyage multimodal | 图 + 表格 + 文本 |
| Audio embeddings | 语音片段 |

适合「以图搜图」「跨模态检索」（如用文字搜产品图）。

## 长文档处理

嵌入模型有上下文上限：

| 模型 | 上下文 |
| --- | --- |
| Cohere Embed v3 | 512 token |
| OpenAI 3-small/large | 8191 token |
| BGE-M3 | 8192 token |
| Jina v3 | 8192 token |
| Voyage | 32k token |

超限要**切片**（chunk），每片独立 embed。切片策略（固定长度 / 按语义 / 重叠）属 RAG 流程范畴，本叶不展开。

## 常见陷阱

| 陷阱 | 原因 | 解决 |
| --- | --- | --- |
| 召回突然变差 | 入库和查询用了不同模型/维度 | 两端严格一致 |
| 中文召回差 | 用了纯英文模型 | 换 BGE-M3 / Cohere multilingual |
| 截断后召回崩 | 截到 256 维太狠 | 提到 1024+ |
| input_type 没区分 | query 和 document 同前缀 | 用 search_query/search_document |
| 长文档向量不准 | 超上下文被截断 | 切片后 embed |
| 重 embed 后指标没提升 | 评测集太小或分布偏 | 扩大标注集，覆盖真实 query |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2022 | MTEB 发布 / Sentence-BERT 系列 / text-embedding-ada-002 |
| 2023 | BGE / E5 开源崛起 / Cohere Embed v3 / 多语言成熟 |
| 2024 | OpenAI text-embedding-3 + MRL / BGE-M3 三模一体 / Voyage voyage-3 |
| 2025 | Jina v3（Task LoRA）/ MMTEB 多语言榜 / NV-Embed 等 SOTA 竞争 |
| 2026 | 多模态嵌入普及 / 长上下文（32k+）成标配 / 截断动态化 |
