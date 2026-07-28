---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Recommender Systems 经典文献（Ricci/Koren/Sarwar）、Wikipedia 与工业实践（2026 年）编写

## 速查

- **本质**：用户-物品匹配，估计偏好分 $\hat{r}_{ui}$，排序取 Top-K
- **三大经典范式**：协同过滤 CF（行为相似）、内容推荐（特征相似）、混合推荐
- **矩阵分解 MF**：稀疏评分矩阵分解为低秩 $U \cdot V^T$（ALS / SVD / SGD），Netflix Prize 标志
- **深度学习**：Neural CF（用 MLP 替代内积）、Wide & Deep、DeepFM、DIN（注意力）
- **Two-Tower / DSSM**：用户塔+物品塔各自输出 Embedding，内积相似，工业召回标配
- **两阶段架构**：召回（百万→几百，重 Recall）+ 排序（几百→几十，重 Precision）
- **向量检索召回**：离线算好物品 Embedding 入 ANN 索引（Faiss/HNSW），在线用用户向量查近邻
- **冷启动**：新用户/新物品无行为，用内容特征 / 多臂老虎机 / 跨域迁移
- **核心指标**：NDCG@K（考虑位置折扣，最常用）、Precision@K、Recall@K、Hit Rate@K、AUC
- **超越准确度**：Coverage 覆盖率、Diversity 多样性、Novelty 新颖性、Serendipity 惊喜度
- **强化学习**：优化长期留存，平衡探索（exploration）与利用（exploitation）
- **生成式推荐**：P5（LLM 统一推荐）、TIGER（生成式检索 Semantic ID）
- **与 RAG 区别**：推荐是「猜你喜欢」（无显式 query），RAG 是「问答检索」（有 query）

## 推荐系统要解决什么

互联网平台物品量动辄亿级，用户不可能逐一浏览。推荐系统的任务是：**给定一个用户，从海量物品库中筛出他最可能感兴趣的 Top-K 个**。形式化：学习函数 $f(u, i) \to \hat{r}$，预测用户 $u$ 对物品 $i$ 的偏好分，按分降序取前 K。

典型场景：电商（淘宝/亚马逊「猜你喜欢」）、短视频（抖音/YouTube 信息流）、新闻（今日头条）、音乐（Spotify）、广告（CTR 预估）。

## 协同过滤（Collaborative Filtering）

核心思想：**「和你品味相似的人喜欢的，你大概率也喜欢」**。分两类：

- **基于用户（User-based）**：找和目标用户历史行为相似的「邻居用户」，推荐他们喜欢而目标用户没看过的
- **基于物品（Item-based）**：找和用户已交互物品相似的物品推荐（亚马逊经典方案，更稳定）

相似度常用余弦相似度或 Pearson 相关：

```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# 评分矩阵：行=用户，列=物品，0 表示未交互
R = np.array([
    [5, 3, 0, 1],
    [4, 0, 0, 1],
    [1, 1, 0, 5],
    [1, 0, 0, 4],
    [0, 1, 5, 4],
])

# Item-based：物品间相似度
item_sim = cosine_similarity(R.T)

# 给用户 0 推荐物品 2（他还没看过）
def predict(user, item, R, sim):
    rated = np.where(R[user] > 0)[0]
    if len(rated) == 0:
        return 0
    sims = sim[item, rated]
    scores = R[user, rated]
    return (sims * scores).sum() / (np.abs(sims).sum() + 1e-8)

print(predict(0, 2, R, item_sim))  # 预测分
```

CF 的缺点：数据稀疏（矩阵 99% 是 0）、冷启动差、可扩展性弱（用户量上去后邻居计算爆炸）。

## 矩阵分解（Matrix Factorization）

Netflix Prize（2006-2009）的标志技术。把稀疏评分矩阵 $R_{m \times n}$ 分解为两个低秩矩阵：

$$R \approx U \cdot V^T$$

其中 $U_{m \times k}$ 是用户隐因子矩阵，$V_{n \times k}$ 是物品隐因子矩阵，$k$ 是隐维度（如 64/128）。用户 $u$ 对物品 $i$ 的预测分即 $\mathbf{u}_u \cdot \mathbf{v}_i$（向量内积）。

```python
import numpy as np

def als(R, k=2, steps=100, lam=0.1):
    m, n = R.shape
    U = np.random.rand(m, k)
    V = np.random.rand(n, k)
    mask = (R > 0).astype(float)
    for _ in range(steps):
        # 固定 V 更新 U（最小二乘）
        for i in range(m):
            idx = np.where(mask[i] == 1)[0]
            if len(idx) == 0:
                continue
            V_sub = V[idx]
            A = V_sub.T @ V_sub + lam * np.eye(k)
            b = V_sub.T @ R[i, idx]
            U[i] = np.linalg.solve(A, b)
        # 固定 U 更新 V
        for j in range(n):
            idx = np.where(mask[:, j] == 1)[0]
            if len(idx) == 0:
                continue
            U_sub = U[idx]
            A = U_sub.T @ U_sub + lam * np.eye(k)
            b = U_sub.T @ R[idx, j]
            V[j] = np.linalg.solve(A, b)
    return U, V

U, V = als(R, k=2)
pred = U @ V.T  # 补全后的完整矩阵
```

ALS（交替最小二乘）适合大规模并行；SGD 版本（Koren 的 SVD++）精度更高但慢。隐因子向量就是最早的「Embedding」。

## 深度学习推荐

### Neural Collaborative Filtering（NCF）

用多层感知机替代矩阵分解的内积，学习非线性交互：

```python
import torch
import torch.nn as nn

class NCF(nn.Module):
    def __init__(self, n_users, n_items, dim=32):
        super().__init__()
        self.user_emb = nn.Embedding(n_users, dim)
        self.item_emb = nn.Embedding(n_items, dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim * 2, 64), nn.ReLU(),
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 1), nn.Sigmoid(),
        )

    def forward(self, u, i):
        x = torch.cat([self.user_emb(u), self.item_emb(i)], dim=-1)
        return self.mlp(x).squeeze()
```

### 经典工业模型谱系

| 模型 | 特点 |
| --- | --- |
| **Wide & Deep**（Google 2016） | Wide 记忆 + Deep 泛化 |
| **DeepFM**（华为 2017） | FM 二阶交叉 + DNN，免人工特征工程 |
| **DIN**（阿里 2017） | 引入目标注意力，建模「用户对候选物品的兴趣」 |
| **DIEN**（阿里 2018） | 序列 + GRU 捕捉兴趣演化 |
| **MMoE**（Google 2018） | 多任务学习，共享专家 + 门控 |

## Two-Tower 召回模型

工业级 Embedding 召回的事实标准。两个独立塔分别编码用户和物品，输出同维 Embedding，相似度即推荐分：

```python
class TwoTower(nn.Module):
    def __init__(self, user_feat_dim, item_feat_dim, emb_dim=64):
        super().__init__()
        self.user_tower = nn.Sequential(
            nn.Linear(user_feat_dim, 128), nn.ReLU(),
            nn.Linear(128, emb_dim),
        )
        self.item_tower = nn.Sequential(
            nn.Linear(item_feat_dim, 128), nn.ReLU(),
            nn.Linear(128, emb_dim),
        )

    def forward(self, user_feat, item_feat):
        u = self.user_tower(user_feat)
        v = self.item_tower(item_feat)
        u = nn.functional.normalize(u, dim=-1)
        v = nn.functional.normalize(v, dim=-1)
        return (u * v).sum(dim=-1)  # 余弦相似度
```

关键优势：**物品 Embedding 可离线预算**，灌入 ANN 索引（Faiss / HNSW / ScaNN），在线只需一次用户向量 + 近邻查询，延迟毫秒级，可处理亿级物料库。Uber、YouTube、Pinterest 等均采用。

## 召回-排序两阶段架构

```
亿级物料库
    │
    ▼
[召回 Retrieval] ── 多路召回（Embedding/规则/热门/标签）──> 几百候选
    │
    ▼
[粗排 Pre-ranking] ── 轻量模型（双塔/简单 DNN）──> 几十
    │
    ▼
[精排 Ranking] ── 复杂模型（DeepFM/DIN，多目标）──> 打分排序
    │
    ▼
[重排 Re-ranking] ── 多样性/去重/业务规则/探索 ──> 最终 Top-K 给用户
```

- **召回重 Recall**：宁可多召回别漏，从百万降到几百，用 ANN + 多路混合
- **排序重 Precision**：精细建模，常用 GBDT（LightGBM）或 DNN，多目标加权（点击+转化+停留）
- **重排**：保证多样性（MMR）、打散同类、插入新内容探索、强插业务内容

多路召回示例：

```python
candidates = []
candidates += embedding_recall(user_vec, top_k=200)   # Two-Tower ANN
candidates += cf_recall(user_id, top_k=100)            # 协同过滤
candidates += hot_recall(category=user_cate, k=50)     # 热门
candidates += tag_recall(user_tags, k=50)              # 标签
candidates = dedup(candidates)                          # 去重
```

## 冷启动问题

新用户（无历史行为）或新物品（无人交互）无法用 CF/MF。对策：

| 类型 | 策略 |
| --- | --- |
| 新用户 | 引导选兴趣标签、用人口属性、热门兜底、跨域迁移 |
| 新物品 | 用内容特征（文本/图像 Embedding）、多臂老虎机探索曝光 |
| 通用 | Contextual Bandit（LinUCB）、Bootstrap、元学习 |

```python
# epsilon-greedy 探索：大部分用最优推荐，小部分探索新物品
import random
def recommend_with_explore(user, model, items, epsilon=0.1):
    if random.random() < epsilon:
        return random.sample(items, 10)  # 探索
    return model.topk(user, items, 10)   # 利用
```

## 评估指标

设推荐列表 $L$（长度 K），用户实际喜欢的集合 $G$。

| 指标 | 公式 | 说明 |
| --- | --- | --- |
| **Precision@K** | $\|L \cap G\| / K$ | 推荐中相关的比例 |
| **Recall@K** | $\|L \cap G\| / \|G\|$ | 相关物品被召回的比例 |
| **Hit Rate@K** | 1 若 $L \cap G \ne \emptyset$ 否则 0 | 是否命中至少一个 |
| **MRR** | $1/\text{rank}$ 第一个相关项的位置倒数 | 相关项排得越靠前分越高 |
| **MAP** | 各相关项 Precision 的平均 | 综合多相关项 |
| **NDCG@K** | $DCG@K / IDCG@K$ | **考虑位置折扣，最常用** |

NDCG 计算：

$$DCG@K = \sum_{i=1}^{K} \frac{rel_i}{\log_2(i+1)}$$

其中 $rel_i$ 是位置 $i$ 的相关性分（二值或分级）。$IDCG@K$ 是理想排序下的 DCG（归一化用）。NDCG 越接近 1 越好。

```python
import numpy as np

def dcg(rels):
    return sum(r / np.log2(i + 2) for i, r in enumerate(rels))

def ndcg_at_k(recommended_rels, k):
    dcg_k = dcg(recommended_rels[:k])
    idcg_k = dcg(sorted(recommended_rels, reverse=True)[:k])
    return dcg_k / idcg_k if idcg_k > 0 else 0

# recommended_rels: 推荐列表每项的相关性（如 [3,0,2,1,0]）
print(ndcg_at_k([3, 0, 2, 1, 0], k=5))
```

NDCG 之所以最常用，是因为它**考虑位置**：排第 1 和排第 10 的相关项贡献不同（靠前更重要），符合「用户主要看前几条」的真实行为。

## 推荐系统 vs 搜索引擎 vs RAG

| 维度 | 推荐系统 | 搜索引擎 | RAG |
| --- | --- | --- | --- |
| 输入 | 用户（无显式 query） | 显式 query | 显式 query |
| 匹配 | 用户 ↔ 物品 | query ↔ 文档 | query ↔ 文档 |
| 目标 | 猜你喜欢（个性化） | 找到相关信息 | 检索喂 LLM 生成答案 |
| 触发 | 主动推送 | 用户搜索 | 用户提问 |
| 时效 | 长期兴趣 | 即时需求 | 即时需求 |
| 评估 | NDCG/Recall@K/留存 | NDCG/MAP | 答案准确性 |

推荐是**无 query 的个性化匹配**，RAG/搜索是**有 query 的相关性检索**。两者底层都用向量检索，但目标不同。

## 前沿：生成式推荐

- **P5**（2023）：用统一 LLM「预训练 + 个性化 prompt + 预测」范式，把推荐任务（评分预测、序列推荐、解释生成）都转成文本生成
- **TIGER**（NeurIPS 2023）：给物品分配「Semantic ID」（分层量化编码），训练生成式模型直接**生成**要推荐的 item ID，即「生成式检索」
- **LLM 特征增强**：用 LLM 给物品/用户生成语义特征，丰富 Embedding

## 下一步

- [指南](./guide-line) —— 召回排序工程实战 / Embedding 召回 + ANN / 冷启动策略 / 在线 A/B / 多目标 / 特征工程
- [参考](./reference) —— 全部范式 / 模型 / 指标公式 / 框架 / 论文索引
