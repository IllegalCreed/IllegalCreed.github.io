---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Recommender Systems 经典文献与工业实践（Netflix/YouTube/阿里/Uber，2026 年）编写

## 速查

- 工程三段式：召回（多路混召回回率）→ 排序（精模型精度）→ 重排（多样性+业务）
- 召回首选 Two-Tower + ANN：物品 Embedding 离线预算入索引，在线毫秒级
- 排序首选 GBDT（LightGBM）或 DNN（DeepFM/DIN），多目标加权
- 特征分三类：用户特征、物品特征、上下文特征（时间/位置/设备）
- 负采样是召回关键：简单负样本太简单，需 hard negative 提升区分度
- 在线评估靠 A/B 测试，离线 NDCG 提升不一定带来 GMV 提升
- 冷启动：新物品用多臂老虎机探索，新用户用内容/人口特征兜底
- 多样性：MMR（Maximal Marginal Relevance）或 DPP 打散同类
- 实时性：用户最近行为（last-N）实时入特征，重算向量查 ANN
- Embedding 维度：召回通常 64-256，太高 ANN 慢，太低区分度差
- 召回率 vs 精确率：召回阶段宁滥勿缺，排序阶段宁缺勿滥
- 长尾治理：给冷门物品流量倾斜，防马太效应

## 系统架构全景

```
┌─────────────── 数据层 ───────────────┐
│ 用户行为日志 / 物品元数据 / 特征仓库  │
└───────────────┬──────────────────────┘
                │
┌─────────────── ▼ 训练层（离线）─────┐
│ 召回模型训练(Two-Tower)  物品 Embedding 预算 │
│ 排序模型训练(DeepFM/GBDT)  ANN 索引构建     │
└───────────────┬──────────────────────┘
                │
┌─────────────── ▼ 在线服务 ──────────┐
│ 用户请求 → 特征拼装(实时+离线)       │
│   → 多路召回(Embedding/CF/热门/标签) │
│   → 粗排(轻量模型) → 精排(复杂模型)  │
│   → 重排(多样性/业务规则) → 返回 Top-K│
└──────────────────────────────────────┘
```

## Embedding 召回工程实战

### 训练 Two-Tower（负采样）

```python
import torch
import torch.nn as nn

class TwoTowerRetrieval(nn.Module):
    def __init__(self, n_users, n_items, user_feat_dim, item_feat_dim, dim=128):
        super().__init__()
        self.user_emb = nn.Embedding(n_users, dim)
        self.item_emb = nn.Embedding(n_items, dim)
        self.user_mlp = nn.Sequential(
            nn.Linear(dim + user_feat_dim, 256), nn.ReLU(),
            nn.Linear(256, dim),
        )
        self.item_mlp = nn.Sequential(
            nn.Linear(dim + item_feat_dim, 256), nn.ReLU(),
            nn.Linear(256, dim),
        )

    def user_tower(self, uid, ufeat):
        x = torch.cat([self.user_emb(uid), ufeat], dim=-1)
        return torch.nn.functional.normalize(self.user_mlp(x), dim=-1)

    def item_tower(self, iid, ifeat):
        x = torch.cat([self.item_emb(iid), ifeat], dim=-1)
        return torch.nn.functional.normalize(self.item_mlp(x), dim=-1)

    def forward(self, uid, iid, ufeat, ifeat):
        u = self.user_tower(uid, ufeat)
        v = self.item_tower(iid, ifeat)
        return (u * v).sum(dim=-1)  # logit
```

训练用 InfoNCE / sampled softmax loss（正样本拉近，负样本推远），而非逐点 BCE：

```python
def info_nce_loss(u, v_pos, v_neg, tau=0.07):
    # u: [B,D], v_pos: [B,D], v_neg: [B,N,D]
    pos = (u * v_pos).sum(-1, keepdim=True)          # [B,1]
    neg = torch.bmm(v_neg, u.unsqueeze(-1)).squeeze(-1)  # [B,N]
    logits = torch.cat([pos, neg], dim=1) / tau
    labels = torch.zeros(len(u), dtype=torch.long)    # 第 0 个是正
    return nn.functional.cross_entropy(logits, labels)
```

负采样策略：
- **随机负采样**：从全库随机，太简单
- **batch 内负采样**：用同 batch 其他正样本做负，常用
- **hard negative mining**：挖难区分样本（同分类、曝光未点击）提升精度

### 物品 Embedding 离线入 ANN

```python
import faiss
import numpy as np

# 离线预算所有物品 Embedding
item_vectors = model.item_tower(all_iid, all_ifeat).detach().cpu().numpy()

# 建 HNSW 索引（亿级友好）
dim = 128
index = faiss.IndexHNSWFlat(dim, 32)
index.metric_type = faiss.METRIC_INNER_PRODUCT
index.add(item_vectors.astype('float32'))
faiss.write_index(index, "item.index")

# 在线查询
user_vec = model.user_tower(uid, ufeat).detach().cpu().numpy().astype('float32')
D, I = index.search(user_vec, k=200)   # 召回 200
```

ANN 库对比：

| 库 | 特点 |
| --- | --- |
| **Faiss**（Meta） | GPU 友好，工业标配，支持 IVF/HNSW/PQ |
| **HNSWLIB** | 单机快，图算法 |
| **ScaNN**（Google） | 各向异性量化，精度高 |
| **Milvus / Vespa** | 分布式向量数据库，含过滤 |

### 多路召回融合

```python
def multi_recall(user):
    cands = {}
    for src, fn in [
        ("emb", lambda: ann_search(user.vec, 200)),
        ("cf",  lambda: cf_neighbors(user.id, 100)),
        ("hot", lambda: hot_items(user.category, 50)),
        ("tag", lambda: tag_match(user.tags, 50)),
        ("graph", lambda: graph_walk(user.id, 50)),
    ]:
        for item_id, score in fn():
            cands[item_id] = max(cands.get(item_id, 0), score)
    return list(cands.items())[:500]  # 融合去重取 500
```

## 排序模型实战

### GBDT（CTR 预估经典）

```python
import lightgbm as lgb

# 特征：用户/物品/上下文 + 交叉
train = lgb.Dataset(X_train, label=y_train)  # y: 0/1 是否点击
params = {
    "objective": "binary",
    "metric": "auc",
    "num_leaves": 63,
    "learning_rate": 0.05,
    "feature_fraction": 0.8,
}
model = lgb.train(params, train, num_boost_round=500)
ctr_pred = model.predict(X_test)
```

GBDT 优点：训练快、特征无需归一化、可解释（特征重要度）；缺点：难增量更新、不便多目标。

### DeepFM（特征交叉）

```python
# 结构：FM 部分做二阶交叉 + DNN 部分做高阶，共享 embedding
# 输入：sparse 特征 one-hot/id + dense 特征
# 输出：CTR sigmoid 概率
```

DeepFM 等模型要点：
- **Embedding 层共享**：稀疏特征先 embedding 再交叉
- **FM 部分**：自动学二阶特征交叉，免手工组合
- **DNN 部分**：学高阶非线性交互
- **多目标**：MMoE / PLE 共享底层 + 多个塔头（点击/转化/停留）

### 多目标加权

```python
def final_score(item):
    p_ctr = click_model.predict(item)
    p_cvr = convert_model.predict(item)
    p_stay = stay_model.predict(item)
    # 业务加权
    return 1.0 * p_ctr + 5.0 * (p_ctr * p_cvr) + 0.1 * p_stay
```

## 特征工程

| 类别 | 示例 |
| --- | --- |
| 用户特征 | 年龄/性别/地域、历史点击序列、长期兴趣标签、活跃度 |
| 物品特征 | 类目/标签、价格、发布时间、统计量（CTR/曝光）、文本/图像 Embedding |
| 上下文 | 时间段、星期、设备、网络、地理位置 |
| 交叉特征 | 用户类目偏好 × 物品类目、用户价格段 × 物品价格 |

实时特征服务：

```python
# 用户最近 N 次行为实时入 Redis，拼特征时拉取
redis.lpush(f"recent:{user_id}", item_id)
redis.ltrim(f"recent:{user_id}", 0, 49)  # 保留 50 条
```

## 冷启动策略

### 新物品冷启动（EE 探索）

```python
import numpy as np

class ContextualBandit:
    """LinUCB：上下文多臂老虎机，平衡探索与利用"""
    def __init__(self, n_arms, dim):
        self.A = [np.eye(dim) for _ in range(n_arms)]  # 每臂 A 矩阵
        self.b = [np.zeros(dim) for _ in range(n_arms)]

    def select(self, contexts, alpha=1.0):
        scores = []
        for a, ctx in enumerate(contexts):
            theta = np.linalg.solve(self.A[a], self.b[a])
            p = theta @ ctx + alpha * np.sqrt(ctx @ np.linalg.solve(self.A[a], ctx))
            scores.append(p)
        return np.argmax(scores)

    def update(self, arm, ctx, reward):
        self.A[arm] += np.outer(ctx, ctx)
        self.b[arm] += reward * ctx
```

### 新用户冷启动

- **引导兴趣选择**：注册时选标签 → 用标签做内容召回
- **人口特征**：年龄/性别/地域映射到人群包
- **热门兜底**：先推全局热门，积累行为再个性化
- **跨域迁移**：用用户在另一产品的 Embedding（联邦/对齐）

## 重排与多样性

### MMR（Maximal Marginal Relevance）

```python
def mmr(candidates, sim_item_item, sim_user_item, k=10, lam=0.5):
    """候选与用户相关性 - 与已选相似度，平衡相关与多样"""
    selected = []
    rest = list(candidates)
    while len(selected) < k and rest:
        scores = []
        for i in rest:
            rel = sim_user_item[i]
            diversity = max((sim_item_item[i][j] for j in selected), default=0)
            scores.append(lam * rel - (1 - lam) * diversity)
        best = rest[int(np.argmax(scores))]
        selected.append(best)
        rest.remove(best)
    return selected
```

### 业务规则重排

- **打散**：同类目/同作者最多连续 N 条
- **强插**：运营内容/广告位
- **去重**：跨刷新不重复
- **保量**：冷门类目最低曝光配额（流量公平）

## 在线评估：A/B 测试

离线指标（NDCG）提升不一定带来业务收益，必须在线验证：

```python
# 流量分桶：10% 实验组（新模型）vs 90% 对照组（旧模型）
# 观测 7-14 天：CTR / 转化率 / 人均停留 / 留存 / GMV
# 统计显著性：t 检验 / bootstrap，p<0.05 才可信
```

坑点：
- 新奇效应：实验初期用户新鲜感带来短期提升，需观察长期
- 指标互斥：CTR 升但停留降，需综合看北极星指标
- 辛普森悖论：分桶不均导致整体结论反转

## 与搜索引擎的差异

推荐与搜索底层都用向量检索，但：

| 维度 | 推荐 | 搜索 |
| --- | --- | --- |
| Query | 无（隐式用户意图） | 显式关键词 |
| 排序依据 | 用户长期兴趣 + 物品匹配 | query-document 相关性 |
| 个性化 | 强（千人千面） | 弱（同 query 结果接近） |
| 典型指标 | 留存/GMV/CTR | 点击满意度/零结果率 |
| 召回 | 兴趣向量 ANN | query 向量 ANN（+倒排） |

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| 离线 NDCG 涨但在线没效果 | 评估指标与业务目标错位，重看 A/B |
| 召回全是热门 | 负采样偏置，加热门降权 / popularity debiasing |
| 信息茧房 | 加多样性重排、探索新类目 |
| 特征穿越 | 严格防 future leak，离线特征用历史时间点快照 |
| 长物品 Embedding 漂移 | 定期增量更新物品塔 |
| 冷启动一直推热门 | 加 EE 探索流量位 |
| 召回-排序不一致 | 用排序模型蒸馏召回（rank distillation） |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2003 | Amazon Item-based CF；GroupLens 协同过滤奠基 |
| 2006-2009 | Netflix Prize，矩阵分解（Koren SVD++/ALS）成主流 |
| 2010s | 隐语义模型；Yehuda Koren《Matrix Factorization Techniques for Recsys》 |
| 2016 | Google Wide & Deep；YouTube DNN 召回论文 |
| 2017 | 阿里 DIN（目标注意力）；华为 DeepFM |
| 2018 | Google MMoE 多任务；Two-Tower/DSSM 工业召回普及 |
| 2020s | 向量检索召回（Faiss/Milvus）成标配；序列建模（SASRec/BERT4Rec） |
| 2023 | 生成式推荐兴起：P5（LLM 统一推荐）、TIGER（生成式检索 Semantic ID，NeurIPS） |
| 2024-2025 | LLM 赋能推荐（特征/解释/对话式推荐）；ContextGNN 等图模型探索；端到端生成式检索 |
| 2026 | 多模态 Embedding 召回、LLM-as-Ranker、生成式推荐走向工业落地 |
