---
layout: doc
---

# 无监督学习

无监督学习（Unsupervised Learning）是机器学习第二大范式：训练数据只有特征矩阵 `X`、**没有标签 `y`**，算法的任务是从数据自身发现内在结构、分布或关系。它解决三类问题——**聚类**（把相似样本分组，如客户分群、文档主题归类）、**降维**（把高维数据压缩到低维，如 PCA/t-SNE/UMAP，用于可视化与特征工程）、**异常检测**（找出离群点，如 IsolationForest/LOF），外加**关联规则**（购物篮「啤酒与尿布」式的共现模式）。scikit-learn 是 Python 生态主力库，`cluster` 模块提供 KMeans/DBSCAN/层次聚类等 12 种算法，`decomposition` 提供 PCA/NMF/TruncatedSVD，`manifold` 提供 t-SNE，`ensemble.IsolationForest` 做异常检测；UMAP 需独立安装 `umap-learn` 包，关联规则用 `mlxtend`。无监督的核心挑战是**没有 ground truth 验证**：聚类结果好不好靠轮廓系数（Silhouette）或业务可解释性判断，降维保真度靠 `explained_variance_ratio_` 或目视检查。它是探索性数据分析（EDA）、推荐系统前置、欺诈检测、特征工程的关键工具，也是自监督学习、对比学习等深度学习前沿的概念根基。

## 评价

**优点**

- **无需人工标注**：直接喂原始数据，绕开监督学习最贵的标注成本，适合海量无标签数据（日志、点击流、文本语料）
- **发现未知结构**：能揭示数据内在聚类、流形、异常，常带来业务洞察（客户分群驱动精准营销、异常检测抓欺诈）
- **降维降本**：PCA/UMAP 把高维数据压到低维，加速下游训练、减少内存、便于 2D/3D 可视化
- **异常检测天然适配**：IsolationForest/LOF 不需「正常样本标签」，只用密度/隔离度即可标记离群点，适合标签稀缺的欺诈/故障场景
- **可作为监督学习前置**：聚类生成新特征、降维去噪、关联规则做特征交叉，常能提升下游模型效果
- **可解释性场景友好**：层次聚类的树状图、关联规则的「如果买 A 则买 B」、PCA 的主成分权重都能直接讲给业务方

**缺点**

- **无客观评估标准**：没有标签就没有准确率，聚类好坏靠轮廓系数/业务判断，主观性强且不可证伪
- **结果难复现不稳定**：KMeans 对初始中心敏感、t-SNE 随机性极强（多次运行结果不同）、DBSCAN 对 `eps` 参数极其敏感，调参无方向
- **高维灾难**：维度越高，「距离」「密度」「相似度」都失效（所有点彼此等距），聚类和异常检测在高维下严重退化，必须先降维
- **超参数难定**：KMeans 的 `n_clusters` 要靠肘部法/轮廓系数猜、DBSCAN 的 `eps` 要画 k-距离图、t-SNE 的 `perplexity` 要试 5-50，每个都是玄学
- **簇假设强**：KMeans 假设簇是凸球形且大小相近，遇到月牙形/环形/密度不均的数据完全失效，选错算法等于白做
- **关联规则假阳性多**：低 support 阈值会爆炸式产出规则，lift 接近 1 的规则无意义，需大量人工筛选

## 文档地址

- [scikit-learn 聚类（Clustering）](https://scikit-learn.org/stable/modules/clustering.html)
- [scikit-learn 降维（Decomposition）](https://scikit-learn.org/stable/modules/decomposition.html)
- [scikit-learn 流形学习（Manifold / t-SNE）](https://scikit-learn.org/stable/modules/manifold.html)
- [scikit-learn 异常检测（Outlier Detection）](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [UMAP 文档（umap-learn）](https://umap-learn.readthedocs.io/)

## GitHub地址

- [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn)
- [lmcinnes/umap](https://github.com/lmcinnes/umap)
- [rasbt/mlxtend](https://github.com/rasbt/mlxtend)（关联规则 Apriori/FP-Growth）

## 幻灯片地址

<a href="/SlideStack/unsupervised-learning-slide/" target="_blank">无监督学习</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">无监督学习测试题</a>
