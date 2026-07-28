---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Pinecone / Milvus / pgvector / Qdrant / Weaviate / Chroma 官方文档 2026 编写

## 速查

- HNSW 三参数：`M`（邻居数，16-64）/ `ef_construction`（建图候选数，200-500）/ `ef_search`（查询候选数，64-256）
- IVF 两参数：`nlist`（聚类桶数，通常 `sqrt(N)`-`4*sqrt(N)`）/ `nprobe`（查询桶数，召回↑速度↓）
- 召回率优先调 `ef_search` / `nprobe`，速度优先调小它们
- HNSW 内存约是 IVFFlat 的 2-5 倍（图连接开销）
- pgvector 必须 `EXPLAIN` 确认走索引，否则 Seq Scan 全表扫
- 混合检索用 RRF（Reciprocal Rank Fusion）融合 dense + sparse 排名
- 元数据过滤：先过滤再查 vs 查完再过滤，影响召回（Weaviate/Qdrant 用前者）
- 批量插入：upsert 一次 100-1000 条，别一条条插
- 归一化向量用内积代替余弦，省一次模长计算
- 重建索引要在线（pgvector 支持 `CONCURRENTLY`）

## HNSW 调参详解

HNSW（Hierarchical Navigable Small World）是多层小世界图：上层稀疏快跳，下层密集精确找。

### 三个核心参数

| 参数 | 作用 | 典型值 | 影响 |
| --- | --- | --- | --- |
| `M` | 每个节点的最大邻居数 | 16-64 | ↑ 召回↑ 内存↑ 构建慢 |
| `ef_construction` | 建图时探索的候选数 | 200-500 | ↑ 召回↑ 构建慢 |
| `ef_search` | 查询时探索的候选数 | 64-256 | ↑ 召回↑ 查询慢 |

### 调参策略

```text
1. 先用默认值建库跑基线（M=16, ef_construction=200）
2. 测出当前召回率（拿 ground truth 对比）
3. 召回不够 → 提 ef_search（最便宜，查询时调）
4. 还不够 → 重建索引提 ef_construction
5. 极致召回 → 提 M（内存代价最大）
```

```python
# Milvus
index_params = {"index_type": "HNSW", "M": 32, "efConstruction": 256}
search_params = {"params": {"ef": 128}}  # 查询时 ef
```

```sql
-- pgvector
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
SET hnsw.ef_search = 100;  -- 会话级调
```

::: tip 别盲目调大 M

`M` 翻倍内存也接近翻倍。多数场景 `M=16` 够用，只在召回瓶颈且 `ef` 已调满时才提。

:::

## IVF 索引调参

IVF（Inverted File）先用 k-means 把向量聚成 `nlist` 个桶，查询时只在最近 `nprobe` 个桶内暴力查。

### 参数

| 参数 | 作用 | 经验 |
| --- | --- | --- |
| `nlist` | 聚类桶数 | `sqrt(N)` 到 `4*sqrt(N)`；百万级用 1024-4096 |
| `nprobe` | 查询时探测的桶数 | 越大召回越高、越慢；通常 `nlist` 的 1%-5% |

```text
N = 1,000,000
nlist = sqrt(N) ≈ 1000（取 1024）
nprobe = 10-50（先试 32 测召回）
```

### IVF_SQ8 / IVF_PQ 取舍

| 索引 | 内存（相对 FLAT） | 召回损失 | 适合 |
| --- | --- | --- | --- |
| IVF_FLAT | 100% | 0%（桶外的不算） | 默认 |
| IVF_SQ8 | ~25% | 1-3% | 内存吃紧 |
| IVF_PQ | ~6-12% | 5-15% | 极致省内存，能接受召回降 |

## 混合检索（Hybrid Search）

把**关键词检索**（BM25 / sparse vector）和**语义检索**（dense vector）结果融合。

### 融合方法：RRF

```text
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

每条文档在每个检索器里有个排名，倒数加权求和。`k` 通常 60。简单、无需分数归一化，是 Weaviate / Qdrant 默认。

### 各库实现

#### Weaviate（原生）

```python
result = collection.query.hybrid(
    query="reset password",
    alpha=0.5,   # 0=纯关键词，1=纯向量，0.5=均衡
    limit=5,
)
# 内部同时跑 BM25 + dense，RRF 融合
```

#### Qdrant（dense + sparse）

```python
client.query_points(
    "docs",
    prefetch=[
        models.PrefetchQuery(query=[0.1, ...], using="dense", limit=20),
        models.PrefetchQuery(query=sparse_vec, using="sparse", limit=20),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=5,
)
```

#### pgvector（需手动拼）

pgvector 本身只管 dense，要 hybrid 得配合 PG 全文检索（`tsvector`）+ 应用层 RRF：

```sql
-- 两路查询，应用层融合
SELECT id, ts_rank_cd(tsv, q) AS r FROM docs, plainto_tsquery('chinese', '重置密码') q
  WHERE tsv @@ q ORDER BY r DESC LIMIT 20;
SELECT id, embedding <=> '[...]'::vector AS d FROM docs ORDER BY d LIMIT 20;
```

::: warning alpha 不是权重

Weaviate 的 `alpha` 控制融合偏向，但**不等于简单加权**——内部仍是 RRF。要严格加权得用 weighted fusion。

:::

## 元数据过滤

检索时常需「在某个 category 内查」或「时间在 2024 后」。两种实现：

| 策略 | 做法 | 召回 | 代表 |
| --- | --- | --- | --- |
| Pre-filtering | 先按 metadata 缩小范围，再向量搜索 | 准 | Qdrant、Weaviate |
| Post-filtering | 先向量 top-k，再过滤 | 可能不足 | 早期实现 |

```python
# Qdrant pre-filter
client.search("docs", query_vector=[...],
    query_filter={"must": [{"key": "year", "range": {"gte": 2024}}]}, limit=5)
```

`must` / `should` / `must_not` 语法类似 ES / MongoDB。

## 批量插入与更新

### 批量 upsert

```python
# Pinecone：一次 100 条
batch = [{"id": f"d{i}", "values": vecs[i], "metadata": metas[i]} for i in range(100)]
index.upsert(vectors=batch)

# Milvus：一次 1000-5000
client.insert("docs", records, batch_size=1000)
```

单条插效率极低（网络往返开销）。批量大小通常 100-1000，依网络 RTT 调。

### HNSW 写入陷阱

HNSW 增删后图要重新平衡，**大批量更新应重建索引**而非增量 upsert：

```sql
-- pgvector 并发重建（不停服）
DROP INDEX CONCURRENTLY docs_embedding_idx;
CREATE INDEX CONCURRENTLY ON docs USING hnsw (embedding vector_cosine_ops);
```

## 数据归一化

OpenAI / BGE / Nomic 等模型默认输出**已归一化**向量（L2 模长 = 1）。此时：

```text
cosine(A, B) = A·B   （因 |A|=|B|=1）
```

可用更快的**内积**代替余弦：

```python
# Pinecone：归一化向量用 dotproduct metric
pc.create_index(name="docs", dimension=1536, metric="dotproduct")
```

```sql
-- pgvector：归一化向量用 vector_ip_ops
CREATE INDEX ON docs USING hnsw (embedding vector_ip_ops);
SELECT ... ORDER BY embedding <#> '[...]'::vector LIMIT 5;
```

::: tip 验证是否归一化

```python
import numpy as np
norm = np.linalg.norm(embedding)
print(norm)  # 应接近 1.0（误差 < 1e-5）
```

若不是 1，用 `embedding / np.linalg.norm(embedding)` 归一化后再入库。

:::

## pgvector 性能调优

### 确认走索引

```sql
EXPLAIN SELECT id FROM docs ORDER BY embedding <=> '[...]'::vector LIMIT 5;
```

- 看到 `Index Scan using docs_embedding_idx` → 走索引
- 看到 `Seq Scan` → 全表扫，检查操作符 / opclass 是否匹配

### 关键 GUC

```sql
SET hnsw.ef_search = 100;        -- 查询召回
SET maintenance_work_mem = '1GB'; -- 建索引内存，越大建得越快
SET max_parallel_workers = 8;    -- 并行建索引
```

### IVFFlat 选 lists

```sql
-- 经验：N / 1000，但至少 10
CREATE INDEX ON docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- 查询时设 probes
SET ivfflat.probes = 10;
```

## 大规模迁移

从 A 库迁到 B 库，流程：

1. **导出原始向量**（A 库 dump）
2. **确定目标 metric / 维度**（必须一致，否则距离语义变）
3. **重建索引**（按目标库语法）
4. **灰度切流**：双写 + 影子查询对比

::: warning 维度必须一致

1536 维向量迁到只支持 1024 维的库，要么重新 embed（贵），要么用 MRL 截断（有损）。规划时先确定 embedding 模型。

:::

## 常见陷阱

| 陷阱 | 原因 | 解决 |
| --- | --- | --- |
| pgvector Seq Scan | 操作符与 opclass 不匹配 | `EXPLAIN` 看是否 Index Scan |
| HNSW 召回突然变低 | ef_search 设太小 | 提到 100+ |
| 内存暴涨 | HNSW 图连接 + PQ 没开 | 评估 IVF_SQ8 / IVF_PQ |
| 混合检索 alpha 无效 | 内部 RRF 不是线性加权 | 理解 RRF 语义 |
| 写入越来越慢 | HNSW 图碎片化 | 定期重建索引 |
| 距离结果为负 | 用了 `<#>`（负内积）但按升序排 | 负内积升序 = 真实相似度降序 |
| 多租户串数据 | 没用 namespace / partition | Pinecone 用 namespaces，Milvus 用 partition |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2021 | Milvus 2.0 / Weaviate 1.0 / pgvector 诞生 |
| 2022-2023 | HNSW 成为事实标准 / Qdrant 1.0 / Chroma 兴起 |
| 2024 | 混合检索（dense+sparse）普及 / DISKANN 大规模场景 |
| 2025-08 | Pinecone pod 停售新户，全面 serverless / Matryoshka 降维普及 |
| 2026 | 各库 hybrid search 默认化 / 多向量（ColBERT 风格）支持增强 |
