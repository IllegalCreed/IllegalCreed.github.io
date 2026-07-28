---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Pinecone / Milvus / pgvector / Qdrant / Weaviate / Chroma 官方文档 2026 编写。完整 API 见各库文档。

## 各库核心特性对比

| 库 | 语言 | 部署 | 默认索引 | 混合检索 | 元数据过滤 |
| --- | --- | --- | --- | --- | --- |
| **Pinecone** | 闭源 | 托管 SaaS / serverless | 内部托管 | 原生 | 强（namespaces + filter） |
| **Milvus** | Go | 自托管 + 托管(Zilliz) | FLAT/IVF/HNSW/DISKANN | dense+sparse | partition + expr |
| **Weaviate** | Go | 自托管 + 云 | HNSW | 原生 hybrid (RRF) | 强（where filter） |
| **Qdrant** | Rust | 自托管 + 云 | HNSW | dense+sparse (RRF) | 强（payload filter） |
| **Chroma** | Python | 嵌入式 / 服务器 | HNSW | 全文+向量（v0.5+） | where |
| **pgvector** | C (PG ext) | 复用 Postgres | HNSW / IVFFlat | 需手动配 tsvector | SQL WHERE |

## 距离度量与对应操作符

| 度量 | 公式 | Pinecone | Milvus | Qdrant | pgvector 操作符 |
| --- | --- | --- | --- | --- | --- |
| 余弦 cosine | `1 - cos(θ)` | `cosine` | `COSINE` | `Cosine` | `<=>`（`vector_cosine_ops`） |
| L2 欧氏 | `sqrt(Σ(Δ)²)` | `euclidean` | `L2` | `Euclid` | `<->`（`vector_l2_ops`） |
| 内积 | `A·B` | `dotproduct` | `IP` | `Dot` | `<#>`（`vector_ip_ops`，负内积） |

## Milvus 索引矩阵

| 索引 | 类型 | 内存 | 召回 | 构建速度 | 最佳场景 |
| --- | --- | --- | --- | --- | --- |
| **FLAT** | 精确 | 最高 | 100% | 快 | < 10 万，要求精确 |
| **IVF_FLAT** | 近似 | 高 | 高 | 中 | 大规模，速度召回均衡 |
| **IVF_SQ8** | 近似（标量量化） | 中 | 良 | 中 | 内存吃紧 |
| **IVF_PQ** | 近似（乘积量化） | 最低 | 较低 | 中 | 极致省内存 |
| **HNSW** | 近似（图） | 高 | 很高 | 慢 | 低延迟高召回 |
| **DISKANN** | 近似（磁盘图） | 低（RAM） | 高 | 慢 | 海量（超 RAM） |

## HNSW 参数

| 库 | 参数名 | 默认 | 说明 |
| --- | --- | --- | --- |
| Milvus | `M` | 16 | 邻居数 |
| Milvus | `efConstruction` | 200 | 建图候选 |
| Milvus | `ef`（查询） | 64 | 查询候选 |
| pgvector | `m` | 16 | 邻居数 |
| pgvector | `ef_construction` | 64 | 建图候选 |
| pgvector | `hnsw.ef_search`（GUC） | 40 | 查询候选 |
| Qdrant | `m` | 16 | 邻居数 |
| Qdrant | `ef_construct` | 100 | 建图候选 |
| Qdrant | `ef`（查询 `search_params`） | 128 | 查询候选 |

## IVF / IVFFlat 参数

| 库 | 参数 | 经验值 |
| --- | --- | --- |
| Milvus `nlist` | 聚类桶数 | `sqrt(N)`-`4*sqrt(N)` |
| Milvus `nprobe`（查询） | 探测桶数 | nlist 的 1%-5% |
| pgvector `lists` | 聚类桶数 | `N/1000`，至少 10 |
| pgvector `ivfflat.probes`（GUC） | 探测桶数 | 1（默认，常需调高） |

## Pinecone

### 创建 serverless 索引

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
pc.create_index(
    name="docs",
    dimension=1536,
    metric="cosine",          # cosine | dotproduct | euclidean
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)
```

### 查询

```python
index = pc.Index("docs")
res = index.query(
    vector=[0.1, ...],
    top_k=10,
    include_metadata=True,
    filter={"category": {"$eq": "faq"}, "year": {"$gte": 2024}},
    namespace="tenant_a",   # 多租户隔离
)
```

### 特性

- serverless：按存储 + 查询付费，自动扩缩
- pod（s1/p1/p2）：2025-08 停售新户，老户仍可用，p99 ~30ms
- namespaces：逻辑隔离，适合多租户
- hybrid search：dense + sparse 同查

## Milvus

### 创建集合

```python
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")  # 或 "milvus.db" (Lite)
client.create_collection(
    collection_name="docs",
    dimension=1536,
    metric_type="COSINE",
    index_type="HNSW",
    index_params={"M": 16, "efConstruction": 200},
)
```

### 部署形态

| 形态 | 说明 |
| --- | --- |
| Milvus Lite | 嵌入 Python 进程，本地开发 |
| Milvus Standalone | 单机 Docker |
| Milvus Distributed | K8s 集群 |
| Zilliz Cloud | 托管版 |

## pgvector

### 安装

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 索引语法

```sql
-- HNSW（推荐）
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

-- IVFFlat（构建快，省内存）
CREATE INDEX ON docs USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 在线重建（不停服）
CREATE INDEX CONCURRENTLY ON docs USING hnsw (embedding vector_cosine_ops);
```

### 查询操作符

| 操作符 | 含义 | 配对 opclass |
| --- | --- | --- |
| `<->` | L2 欧氏距离 | `vector_l2_ops` |
| `<#>` | 负内积 | `vector_ip_ops` |
| `<=>` | 余弦距离 | `vector_cosine_ops` |

```sql
-- 余弦最近邻
SELECT id, embedding <=> '[0.1,...]'::vector AS dist
FROM docs ORDER BY embedding <=> '[0.1,...]'::vector LIMIT 10;

-- 验证走索引
EXPLAIN SELECT id FROM docs ORDER BY embedding <=> '[0.1,...]'::vector LIMIT 10;
```

### 关键 GUC

| GUC | 默认 | 说明 |
| --- | --- | --- |
| `hnsw.ef_search` | 40 | HNSW 查询召回 |
| `ivfflat.probes` | 1 | IVFFlat 探测桶数 |
| `maintenance_work_mem` | 64MB | 建索引内存，建议提到 1GB+ |

## Weaviate

### 混合检索

```python
result = collection.query.hybrid(
    query="如何重置密码",
    alpha=0.5,            # 0=纯BM25，1=纯dense
    limit=10,
    filters=Filter.by_property("category").equal("faq"),
)
```

### 索引

- 默认 HNSW（dense）
- 倒排索引（BM25 / sparse）
- hybrid = BM25 + dense + RRF 融合

## Qdrant

### 创建集合

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(":memory:")
client.create_collection("docs",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE))
```

### Payload 过滤

```python
client.search("docs", query_vector=[...], limit=5,
    query_filter={
        "must": [
            {"key": "category", "match": {"value": "faq"}},
            {"key": "year", "range": {"gte": 2024}},
        ]
    })
```

### 混合检索

```python
client.query_points("docs",
    prefetch=[
        models.PrefetchQuery(query=[...], using="dense", limit=20),
        models.PrefetchQuery(query=sparse_vec, using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

## Chroma

```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("docs")

# 不传 embeddings 自动用默认模型
collection.add(documents=["..."], ids=["1"], metadatas=[{"src": "a"}])

# 查询
res = collection.query(query_texts=["相关问题"], n_results=5,
    where={"src": "a"})
```

## 选型决策矩阵

| 维度 | Pinecone | Milvus | Weaviate | Qdrant | Chroma | pgvector |
| --- | --- | --- | --- | --- | --- | --- |
| 托管 | serverless | Zilliz | Cloud | Cloud | 有 | 有(各云) |
| 自建 | ✗ | ✓ | ✓ | ✓ | ✓（嵌入式） | ✓ |
| 规模上限 | 大 | 极大 | 大 | 大 | 中 | 中 |
| 索引丰富度 | 内部托管 | 最全 | HNSW+倒排 | HNSW | HNSW | HNSW/IVFFlat |
| 混合检索 | 原生 | dense+sparse | 原生 hybrid | dense+sparse | 全文+向量 | 手动配 |
| 多租户 | namespaces | partition | 类 | collection | collection | schema |
| 复用现有 DB | ✗ | ✗ | ✗ | ✗ | ✗ | **Postgres** |
| 上手难度 | 低 | 中 | 中 | 低 | 极低 | 低（懂 PG） |

## 资源链接

- Pinecone 文档：[docs.pinecone.io](https://docs.pinecone.io)
- Milvus 文档：[milvus.io/docs](https://milvus.io/docs/index.md)
- Weaviate 文档：[weaviate.io/developers/weaviate](https://weaviate.io/developers/weaviate)
- Qdrant 文档：[qdrant.tech/documentation](https://qdrant.tech/documentation/)
- Chroma 文档：[docs.trychroma.com](https://docs.trychroma.com)
- pgvector 仓库：[github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- Milvus GitHub：[github.com/milvus-io/milvus](https://github.com/milvus-io/milvus)
- Qdrant GitHub：[github.com/qdrant/qdrant](https://github.com/qdrant/qdrant)
- Weaviate GitHub：[github.com/weaviate/weaviate](https://github.com/weaviate/weaviate)
- Chroma GitHub：[github.com/chroma-core/chroma](https://github.com/chroma-core/chroma)
