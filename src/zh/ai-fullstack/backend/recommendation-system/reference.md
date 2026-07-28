---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Recommender Systems 经典文献与工业实践（2026 年）编写

## 范式总览

| 范式 | 核心思想 | 代表方法 | 适用 |
| --- | --- | --- | --- |
| **协同过滤 CF** | 「和你相似的人也喜欢」 | User-based / Item-based k-NN | 有行为数据，中小规模 |
| **矩阵分解 MF** | 稀疏矩阵分解为低秩隐因子 | ALS / SVD / SVD++ / BPR | 评分预测，Netflix Prize |
| **内容推荐** | 物品特征相似 | TF-IDF / Embedding 相似 | 冷启动、新物品 |
| **知识推荐** | 显式领域知识/规则 | 本体、约束推理 | 结构化领域 |
| **混合推荐** | 多范式组合 | 加权 / 级联 / 元层级 | 工业主流 |
| **深度学习** | 神经网络学复杂交互 | NCF / Wide&Deep / DeepFM / DIN | 大规模精排 |
| **Two-Tower / DSSM** | 双塔 Embedding 召回 | YouTube DNN / DSSM | 工业召回标配 |
| **图神经网络** | 用户-物品二部图传播 | LightGCN / GraphSAGE / PinSage | 关系丰富场景 |
| **序列建模** | 用户行为序列 | GRU4Rec / SASRec / BERT4Rec | 短视频/电商序列 |
| **强化学习** | 长期收益 EE | Contextual Bandit / DQN | 冷启动探索、长期留存 |
| **生成式推荐** | 生成式检索/LLM | P5 / TIGER / LLM-Ranker | 前沿方向 |

## 矩阵分解方法

| 方法 | 特点 |
| --- | --- |
| **SVD** | 奇异值分解，需补全缺失值 |
| **ALS** | 交替最小二乘，可并行，工业常用 |
| **SGD** | 随机梯度下降，精度高 |
| **SVD++** | Koren，融合隐式反馈 |
| **BPR** | Bayesian Personalized Ranking，优化 pairwise 排序 |
| **TimeSVD++** | 加入时间因子 |

目标函数（带正则的 MSE）：

$$\min_{U,V} \sum_{(u,i) \in R} (r_{ui} - \mathbf{u}_u \cdot \mathbf{v}_i)^2 + \lambda(\|\mathbf{u}_u\|^2 + \|\mathbf{v}_i\|^2)$$

## 深度学习模型谱系

| 模型 | 年份 | 贡献 |
| --- | --- | --- |
| **NCF** | 2017 | MLP 替代内积 |
| **Wide & Deep** | 2016（Google） | 记忆 + 泛化 |
| **Deep & Cross** | 2017 | 显式高阶交叉 |
| **DeepFM** | 2017（华为） | FM + DNN 免手工交叉 |
| **xDeepFM** | 2018 | 压缩交互网络 |
| **DIN** | 2017（阿里） | 目标注意力 |
| **DIEN** | 2018（阿里） | 兴趣演化 GRU |
| **DSIN** | 2019 | 会话兴趣 |
| **MMoE** | 2018（Google） | 多任务门控专家 |
| **PLE** | 2020（腾讯） | 分层多任务 |
| **CAN / FiBiNet** | - | 特征组合新结构 |

## Two-Tower / 召回

| 模型 | 特点 |
| --- | --- |
| **DSSM** | 微软，query-doc 双塔（搜索起家，迁移到推荐） |
| **YouTube DNN** | Google 2016，召回经典 |
| **Mind** | 多兴趣召回（一个用户多个兴趣向量） |
| **EBR**（Facebook） | 社交召回 |
| **PinSage** | Pinterest，图+随机游走 |

训练 loss：

- **InfoNCE / Contrastive**：正样本拉近，batch 内负样本推远
- **Sampled Softmax**：近似 softmax 多分类
- **Triplet Loss**：anchor-pos vs anchor-neg

## 评估指标公式

### 排序质量

设推荐列表 $L = [i_1, i_2, ..., i_K]$，相关集合 $G$，位置 $i$ 相关性 $rel_i$。

**Precision@K**：

$$P@K = \frac{|\{i \in L : i \in G\}|}{K}$$

**Recall@K**：

$$R@K = \frac{|\{i \in L : i \in G\}|}{|G|}$$

**Hit Rate@K**：

$$HR@K = \mathbb{1}[|L \cap G| > 0]$$

**MRR（Mean Reciprocal Rank）**：第一个相关项位置 $p$ 的倒数均值

$$MRR = \frac{1}{|Q|}\sum_{q} \frac{1}{p_q}$$

**MAP（Mean Average Precision）**：

$$AP@K = \frac{1}{|G_q|}\sum_{k=1}^{K} P@k \cdot rel_k, \quad MAP = \frac{1}{|Q|}\sum_q AP_q$$

**NDCG@K**：

$$DCG@K = \sum_{i=1}^{K} \frac{rel_i}{\log_2(i+1)}, \quad IDCG@K = DCG@\text{K (理想排序)}, \quad NDCG@K = \frac{DCG@K}{IDCG@K}$$

**AUC**：ROC 曲线下面积，衡量正样本分高于负样本的概率（二分类排序能力）。

### 超越准确度

| 指标 | 含义 |
| --- | --- |
| **Coverage** | 被推荐物品占总物料库比例（覆盖率） |
| **Diversity** | 推荐列表内部物品差异度（如平均两两距离） |
| **Novelty** | 推荐物品的「冷门度」（信息熵） |
| **Serendipity** | 惊喜度（既相关又出乎意料） |
| **Fairness** | 长尾物品/不同用户群体的公平曝光 |

## 召回-排序架构阶段

| 阶段 | 输入 | 输出 | 模型 | 优化目标 |
| --- | --- | --- | --- | --- |
| 召回 Retrieval | 亿级物料 | 几百候选 | Two-Tower / CF / 图 | Recall@K |
| 粗排 Pre-ranking | 几百 | 几十 | 双塔/简单 DNN | 与精排对齐 |
| 精排 Ranking | 几十 | 打分 | DeepFM/DIN/GBDT | NDCG/AUC/CTR |
| 重排 Re-ranking | 打分列表 | Top-K | MMR/DPP/规则 | Diversity+业务 |

## ANN 向量检索库

| 库 | 算法 | 特点 |
| --- | --- | --- |
| **Faiss**（Meta） | IVF / HNSW / PQ | GPU，工业标配 |
| **HNSWLIB** | HNSW 图 | 单机快 |
| **ScaNN**（Google） | 各向异性量化 | 高精度 |
| **Annoy**（Spotify） | 树 | 静态、内存友好 |
| **Milvus** | 多算法 | 分布式向量数据库 |
| **Vespa** | 综合 | 含排序服务 |
| **Elasticsearch kNN** | HNSW | 与倒排融合 |
| **pgvector** | HNSW/IVF | PostgreSQL 扩展 |

## 工业框架

| 框架 | 出处 | 用途 |
| --- | --- | --- |
| **NVIDIA Merlin** | NVIDIA | 端到端召回-排序，GPU 加速 |
| **Microsoft Recommenders** | 微软 | 算法集（CF/MF/DL） |
| **DeepCTR / DeepMatch** | 开源 | TensorFlow 排序/召回模型库 |
| **TensorFlow Recommenders**（TFRS） | Google | TF 推荐库 |
| **PyTorch BigGraph** | Meta | 大规模图 Embedding |
| **Vespa** | Yahoo | 在线检索+排序引擎 |

## 冷启动策略

| 场景 | 策略 |
| --- | --- |
| 新用户 | 兴趣引导 / 人口特征 / 热门兜底 / 跨域迁移 |
| 新物品 | 内容 Embedding / 多臂老虎机探索 / 流量扶持 |
| 新冷门 | EE 探索（ε-greedy / LinUCB / Thompson Sampling） |
| 通用 | 元学习 / Bootstrap / 对比学习预训练 |

## 论文索引

| 论文 | 年份 | 贡献 |
| --- | --- | --- |
| Koren《Matrix Factorization Techniques for Recsys》 | 2009 | MF/SVD++ 经典综述 |
| Sarwar《Item-based CF》 | 2001 | Item-CF 奠基 |
| Google《Wide & Deep Learning for Recsys》 | 2016 | 记忆+泛化 |
| Google《Deep Neural Networks for YouTube Recommendations》 | 2016 | DNN 召回 |
| 华为《DeepFM》 | 2017 | FM+DNN |
| 阿里《Deep Interest Network》 | 2017 | 目标注意力 |
| 阿里《Behavior Sequence Transformer》 | 2019 | 序列 Transformer |
| Google《Recommending What Video to Watch Next》 | 2019 | MMoE 多任务 |
| P5《Recommendation as Language Generation》 | 2023 | LLM 统一推荐 |
| TIGER《Recommender Systems with Generative Retrieval》 | 2023（NeurIPS） | 生成式检索 Semantic ID |
| ContextGNN | 2024 | 图模型超越 Two-Tower |

## 资源链接

- Recommender Systems（Wikipedia）：[en.wikipedia.org/wiki/Recommender_system](https://en.wikipedia.org/wiki/Recommender_system)
- IR 评估指标：[en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval))
- Two-Tower 解析：[shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive](https://www.shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive)
- NVIDIA Merlin：[nvidia-merlin.github.io](https://nvidia-merlin.github.io/models/main/overview.html)
- Microsoft Recommenders：[github.com/microsoft/recommenders](https://github.com/microsoft/recommenders)
- Faiss：[github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)
- Awesome-LLM-for-RecSys：[github.com/CHIANGEL/Awesome-LLM-for-RecSys](https://github.com/CHIANGEL/Awesome-LLM-for-RecSys)
- TIGER（NeurIPS 2023）：[neurips.cc/virtual/2023/poster/72488](https://neurips.cc/virtual/2023/poster/72488)
