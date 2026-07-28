---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Pinecone / Milvus / pgvector / Qdrant / Weaviate / Chroma 官方文档 2026 编写

## 速查

- 向量数据库核心三件事：**存向量 / 建索引 / 算相似度**
- 距离度量三选一：**余弦距离**（文本）/ **L2 欧氏**（几何）/ **内积**（归一化后等同余弦）
- 索引分两类：**精确**（FLAT，暴力比对，100% 召回）vs **近似 ANN**（IVF / HNSW / DiskANN，召回换速度）
- 选型三问：托管还是自建？规模多大？要不要混合检索？
- Pinecone：serverless 托管，pod 已于 2025-08 停售新户
- Milvus：自托管，索引矩阵最全（FLAT / IVF_FLAT / IVF_SQ8 / IVF_PQ / HNSW / DISKANN）
- Weaviate（Go）：HNSW + 倒排，原生 hybrid（BM25+dense 用 RRF 融合）
- Qdrant（Rust）：内存安全 + payload 过滤强
- Chroma：轻量嵌入式，30 秒上手，Python/JS SDK
- pgvector：PG 扩展，HNSW / IVFFlat 两种索引，`<->` `<#>` `<=>` 三个操作符
- ANN 索引参数要调：HNSW 的 `M` / `ef_construction` / `ef_search`，IVF 的 `nlist` / `nprobe`

## 三类距离度量

| 度量 | 公式 | 适用 | pgvector 操作符 |
| --- | --- | --- | --- |
| 余弦距离 cosine | `1 - (A·B)/(\|A\|\|B\|)` | 文本嵌入（方向相似） | `<=>` |
| L2 / 欧氏距离 | `sqrt(Σ(A_i-B_i)²)` | 图像 / 几何 | `<->` |
| 负内积 | `-A·B` | 归一化向量（等同余弦） | `<#>` |

::: tip 归一化后余弦 = 内积

OpenAI / BGE 等模型输出**已归一化**向量（模长为 1），此时 `A·B = cos(θ)`，用更快的**内积**代替余弦即可。pgvector 里归一化向量可用 `<#>` 配 `vector_ip_ops`，避免每次重算模长。

:::

## 精确 vs 近似检索

### FLAT（暴力）

逐一计算查询向量与库内每条向量的距离，排序取 top-k。

- **召回 100%**，但 O(N) 复杂度
- 适合 < 10 万条 + 要求精确（如法律、医疗去重）

### ANN（近似最近邻）

牺牲少量召回换巨大速度提升。两类思路：

- **基于聚类**：IVF 系列（把空间分桶，只查最近的几个桶）
- **基于图**：HNSW（多层小世界图，沿图跳着找）

## Milvus 索引矩阵（核心知识）

| 索引 | 原理 | 内存 | 召回 | 构建速度 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **FLAT** | 暴力比对 | 高 | 100% | 快 | 小数据，要求精确 |
| **IVF_FLAT** | 聚类分桶 + 桶内暴力 | 高 | 高 | 中 | 大规模，速度召回均衡 |
| **IVF_SQ8** | IVF + 标量量化（float→int8） | 中 | 良 | 中 | 内存吃紧，召回可接受降 |
| **IVF_PQ** | IVF + 乘积量化 | 最低 | 较低 | 中 | 极致省内存，容忍召回损失 |
| **HNSW** | 多层小世界图 | 高 | 很高 | 慢 | 低延迟高召回，写多需谨慎 |
| **DISKANN** | 磁盘图索引 | 低（RAM） | 高 | 慢 | 海量数据（超 RAM 容量） |

::: tip 量化（Quantization）是什么

把 float32 向量**有损压缩**成更小表示：

- **SQ8（标量量化）**：每维 float32 → int8，省 4 倍，召回略降
- **PQ（乘积量化）**：把向量切段，每段聚类成码本，省 8-16 倍，召回降更多

适合「内存装不下但要快速查询」的场景。

:::

## 主流选手速览

### Pinecone（托管 SaaS）

- **serverless** 为主（2025-08 起 pod 停售新户），底层用对象存储，按用量付费
- 支持 cosine / dotproduct / euclidean 三种 metric
- 原生支持 namespaces（多租户）、metadata 过滤、hybrid search
- p99 延迟：pod ~30ms，serverless 略高但便宜数倍

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="xxx")
pc.create_index(
    name="docs",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)
index = pc.Index("docs")
index.upsert(vectors=[{"id": "d1", "values": [0.1, ...], "metadata": {"src": "doc1"}}])
res = index.query(vector=[0.1, ...], top_k=5, filter={"src": {"$eq": "doc1"}})
```

### Milvus（自托管）

- 索引矩阵最全（见上表）
- 支持多种部署：Milvus Lite（本地）/ Standalone（单机）/ Distributed（集群）
- Zilliz Cloud 是其托管版

```python
from pymilvus import MilvusClient

client = MilvusClient("milvus.db")  # Lite 本地
client.create_collection(
    collection_name="docs",
    dimension=1536,
    metric_type="COSINE",
    index_type="HNSW",
    index_params={"M": 16, "efConstruction": 200},
)
client.insert("docs", [{"id": 1, "vector": [0.1, ...], "text": "..."}])
res = client.search("docs", data=[[0.1, ...]], limit=5, search_params={"params": {"ef": 64}})
```

### pgvector（PG 扩展）

- **复用现有 Postgres**，关系数据 + 向量一库搞定
- 两种索引：HNSW（默认推荐，高召回）和 IVFFlat（构建快，省内存）
- **必须**用对应操作符才会走索引：

```sql
CREATE EXTENSION vector;

CREATE TABLE docs (id serial PRIMARY KEY, content text, embedding vector(1536));

-- 建索引（必须指定 opclass 匹配查询操作符）
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);

-- 查询：用 <=> 才命中上面的 cosine 索引
SELECT id, content, embedding <=> '[0.1,...]'::vector AS distance
FROM docs ORDER BY embedding <=> '[0.1,...]'::vector LIMIT 5;
```

::: warning 操作符必须匹配 opclass

`<=>` 配 `vector_cosine_ops`、`<->` 配 `vector_l2_ops`、`<#>` 配 `vector_ip_ops`。用错操作符会导致 `EXPLAIN` 显示 Seq Scan（全表扫描），索引完全不生效。

:::

### Weaviate（Go，混合检索强）

- HNSW + 倒排索引双引擎
- **原生 hybrid search**：一次调用同时跑 BM25（关键词）+ dense（语义），用 RRF（Reciprocal Rank Fusion）融合

```python
import weaviate

client = weaviate.connect_to_local()
collection = client.collections.get("Doc")
result = collection.query.hybrid(
    query="如何重置密码",
    vector=[0.1, ...],   # 可选，不传则自动 embed
    alpha=0.5,            # 0=纯 BM25，1=纯向量
    limit=5,
)
```

### Qdrant（Rust）

- Rust 实现，内存安全 + 高并发
- payload 过滤能力强（类似 MongoDB 的查询语法）

```python
from qdrant_client import QdrantClient

client = QdrantClient(":memory:")  # 本地
client.create_collection("docs", vectors_config={"size": 1536, "distance": "Cosine"})
client.upsert("docs", points=[
    {"id": 1, "vector": [0.1, ...], "payload": {"category": "faq"}},
])
res = client.search("docs", query_vector=[0.1, ...],
    query_filter={"must": [{"key": "category", "match": {"value": "faq"}}]}, limit=5)
```

### Chroma（轻量嵌入式）

- 30 秒上手，零配置
- Python / JS SDK，本地嵌入式或客户端-服务器

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("docs")
collection.add(
    documents=["文档1内容", "文档2内容"],
    metadatas=[{"src": "a"}, {"src": "b"}],
    ids=["1", "2"],
    # 不传 embeddings 则用默认 Sentence Transformers
)
res = collection.query(query_texts=["相关问题"], n_results=2)
```

## 选型决策表

| 你的情况 | 推荐 |
| --- | --- |
| 已有 Postgres，向量规模 < 100 万 | **pgvector** |
| 不想运维，规模中等到大 | **Pinecone** serverless |
| 海量数据 + 自建 + 需要最全索引 | **Milvus** |
| 重视混合检索（关键词+语义） | **Weaviate** 或 **Qdrant** |
| 高并发 + 内存安全 + 强过滤 | **Qdrant** |
| 原型验证 / 学习 / 单机小项目 | **Chroma** |
| 数据量超 RAM 容量 | **Milvus DISKANN** |

## 下一步

- [指南](./guide-line) —— HNSW 调参 / IVF 选 `nlist`/`nprobe` / 混合检索权重 / 大规模迁移
- [参考](./reference) —— 各库 API 全表 / 索引参数 / 距离公式 / 选型矩阵
