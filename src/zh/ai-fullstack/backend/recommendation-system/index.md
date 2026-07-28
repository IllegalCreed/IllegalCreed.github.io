---
layout: doc
---

# 推荐系统

**预测用户对物品偏好的系统**——在海量物品中为每个用户筛选出「最可能感兴趣」的少数几个，是电商、内容、广告、社交平台的核心增长引擎。本质是**用户-物品匹配**：给定用户 u 和候选物品 i，估计偏好分 $\hat{r}_{ui}$，按分排序取 Top-K 推荐。

推荐系统按范式演进：**协同过滤 CF**（基于「和你相似的人也喜欢」）、**矩阵分解 MF**（把稀疏评分矩阵分解为低维隐因子，Netflix Prize 的 ALS/SVD）、**内容推荐**（基于物品元数据特征相似）、**深度学习**（Neural CF、Wide & Deep、DeepFM）、**Two-Tower/DSSM**（用户塔+物品塔输出 Embedding，工业召回标配）、**向量检索召回**（ANN 近似最近邻）、**强化学习**（长期收益/探索利用）、**生成式推荐**（P5、TIGER 用 LLM/生成式检索直接生成 item ID）。

工业级系统普遍采用**召回-排序两阶段（甚至多阶段）架构**：召回阶段从百万/亿级物料库快速筛出几百候选（重召回率、低延迟，常用 Embedding + ANN），排序阶段用精细模型对候选精排（重精度，用 GBDT/DNN/多目标），再加重排（去重、多样性、业务规则）。核心难题是**冷启动**（新用户/新物品无行为数据），常用多臂老虎机探索、内容特征、跨域迁移缓解。

评估指标分两类：**排序质量**（Precision@K / Recall@K / NDCG / MAP / Hit Rate@K / AUC），其中 NDCG 因考虑位置折扣被最广泛使用；**超越准确度**（覆盖率 Coverage、多样性 Diversity、新颖性 Novelty、惊喜度 Serendipity）。注意区分：推荐是「猜你喜欢」（用户-物品匹配，无显式 query），与 RAG「问答检索」（显式 query-文档匹配）目标不同。

## 评价

**优点**

- **规模化筛选**：从亿级物料库为每用户筛出个性化 Top-K，解决信息过载
- **长尾激活**：让冷门物品获得曝光，提升平台 GMV/停留时长
- **自动个性化**：无需用户显式填写兴趣，从行为隐式学习偏好
- **多目标协同**：可同时优化点击、转化、留存、多样性
- **数据飞轮**：推荐越好→用户行为越多→模型越准，正向循环
- **范式丰富**：从经典 CF 到生成式推荐，适配不同数据规模与场景

**缺点**

- **冷启动困难**：新用户/新物品缺行为数据，初期推荐质量差
- **数据稀疏**：用户-物品交互矩阵通常极度稀疏（<1%），建模困难
- **信息茧房**：过度优化相关性导致同质化，用户视野收窄
- **评估复杂**：离线指标（NDCG）与在线业务指标（GMV/留存）常不一致
- **资源消耗大**：工业级 Embedding 召回需大规模 ANN 索引与实时特征服务
- **可解释性弱**：深度模型/Embedding 召回结果难以给出「为什么推荐」
- **反馈循环偏差**：模型决定曝光→影响后续行为→强化既有偏差（马太效应）

## 文档地址

- Recommender Systems 综述（Wikipedia）：[en.wikipedia.org/wiki/Recommender_system](https://en.wikipedia.org/wiki/Recommender_system)
- Netflix Prize（矩阵分解经典）：[netflixprize.com](https://www.netflixprize.com/)
- Two-Tower 召回（Shaped.ai 解析）：[shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive](https://www.shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive)
- TIGER 生成式检索（NeurIPS 2023）：[neurips.cc/virtual/2023/poster/72488](https://neurips.cc/virtual/2023/poster/72488)
- NVIDIA Merlin（工业框架）：[nvidia-merlin.github.io](https://nvidia-merlin.github.io/models/main/overview.html)
- 评估指标综述（IR measures）：[en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval))

## GitHub地址

- NVIDIA Merlin：[github.com/NVIDIA-Merlin/Merlin](https://github.com/NVIDIA-Merlin/Merlin)
- Microsoft Recommenders：[github.com/microsoft/recommenders](https://github.com/microsoft/recommenders)
- Amazon Meta 的 DeepCTR：[github.com/shenweichen/DeepCTR](https://github.com/shenweichen/DeepCTR)
- Facebook faiss（ANN 向量检索）：[github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)
- Awesome-LLM-for-RecSys：[github.com/CHIANGEL/Awesome-LLM-for-RecSys](https://github.com/CHIANGEL/Awesome-LLM-for-RecSys)

## 幻灯片地址

<a href="/SlideStack/recommendation-system-slide/" target="_blank">推荐系统</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=recommendation-system" target="_blank" rel="noopener noreferrer">推荐系统测试题</a>
