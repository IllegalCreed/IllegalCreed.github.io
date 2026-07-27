---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 scikit-learn 1.9.0 官方 API 文档（cluster + decomposition + manifold + outlier_detection）整理

## 速查

- **聚类选型一句话**：球形均匀→**KMeans**；任意形状+噪声→**DBSCAN/HDBSCAN**；层次结构→**Agglomerative**；自动定簇数→**MeanShift/AffinityPropagation**
- **降维选型一句话**：通用线性降维→**PCA**；稀疏文本→**TruncatedSVD**；非负可解释→**NMF**；2D 可视化→**UMAP（首选）/t-SNE**
- **异常检测一句话**：高维工业场景→**IsolationForest**；局部密度异常→**LOF**；近似高斯→**EllipticEnvelope**
- **scikit-learn 版本**：1.9.0（2025），Python ≥ 3.10；UMAP 需独立 `pip install umap-learn`；关联规则用 `pip install mlxtend`
- **聚类 import**：`sklearn.cluster`（KMeans/DBSCAN/Agglomerative/Spectral/Birch）/ `sklearn.mixture`（GMM）
- **降维 import**：`sklearn.decomposition`（PCA/TruncatedSVD/NMF）/ `sklearn.manifold`（TSNE/Isomap/LocallyLinearEmbedding）
- **异常检测 import**：`sklearn.ensemble.IsolationForest` / `sklearn.neighbors.LocalOutlierFactor` / `sklearn.svm.OneClassSVM`
- **评估 import**：`sklearn.metrics.silhouette_score`（聚类）/ `explained_variance_ratio_`（PCA）/ `adjusted_rand_score`（有标签时对比聚类）
- **经典数据集**：`make_blobs`（人造簇）/ `make_moons`（月牙形，测 DBSCAN）/ `make_circles`（环形）/ `load_digits`（64 维降维可视化）

## 聚类选型决策表

| 场景 | 首选算法 | 备选 | 理由 |
| --- | --- | --- | --- |
| **球形均匀簇** | KMeans | MiniBatchKMeans（大数据） | 快、稳，假设簇是凸球形 |
| **任意形状+有噪声** | DBSCAN | HDBSCAN（变密度） | 密度连通，自动识别噪声 |
| **要层次结构/树状图** | AgglomerativeClustering | — | 自底向上合并，可输出 dendrogram |
| **要自动定簇数** | MeanShift / AffinityPropagation | — | 无需指定 k，按密度/消息自动 |
| **图分割/图像分割** | SpectralClustering | — | 图拉普拉斯特征值，非凸边界 |
| **超大数据 + 内存紧** | BIRCH / MiniBatchKMeans | — | CF 树压缩/小批量 |
| **软聚类（要概率）** | GaussianMixture | — | 给每个样本属于每簇的概率 |
| **变密度簇** | HDBSCAN（独立包） | OPTICS | DBSCAN 无法处理密度不均 |

## 降维选型决策表

| 场景 | 首选 | 备选 | 关键参数 |
| --- | --- | --- | --- |
| **通用线性降维/去噪** | PCA | IncrementalPCA（大数据） | `n_components=0.95`（保留 95% 方差） |
| **稀疏文本（TF-IDF）** | TruncatedSVD | NMF | `n_components` 不破坏稀疏性 |
| **非负可解释（话题/部位）** | NMF | — | `init='nndsvda'`, `solver='mu'` |
| **2D/3D 可视化（首选）** | UMAP | t-SNE | `n_neighbors=15`, `min_dist=0.1` |
| **2D/3D 可视化（学术）** | t-SNE | — | `perplexity=30`, `init='pca'` |
| **非线性降维（通用）** | KernelPCA / UMAP | Isomap | `kernel='rbf'` |

## scikit-learn 聚类算法速查

| 算法 | 模块 | 关键参数 | 复杂度 | 特点 |
| --- | --- | --- | --- | --- |
| KMeans | `cluster.KMeans` | `n_clusters`, `init`, `n_init` | `O(n·k·d)` | 球形簇，需指定 k |
| MiniBatchKMeans | `cluster.MiniBatchKMeans` | `n_clusters`, `batch_size` | 极快 | 大数据版 KMeans |
| DBSCAN | `cluster.DBSCAN` | `eps`, `min_samples` | `O(n·log n)` | 密度成簇，自动定噪声 |
| HDBSCAN | `cluster.HDBSCAN`（1.3+） | `min_cluster_size`, `min_samples` | 中 | 变密度簇 |
| Agglomerative | `cluster.AgglomerativeClustering` | `n_clusters`, `linkage`, `metric` | `O(n³)`（无连接约束） | 层次结构 |
| Spectral | `cluster.SpectralClustering` | `n_clusters`, `affinity` | 中 | 图分割，非凸 |
| MeanShift | `cluster.MeanShift` | `bandwidth` | 慢 | 自动定簇数 |
| AffinityPropagation | `cluster.AffinityPropagation` | `damping`, `preference` | `O(n²)` | 消息传递，自动定簇 |
| Birch | `cluster.Birch` | `threshold`, `branching_factor` | 内存高效 | 超大数据压缩 |
| OPTICS | `cluster.OPTICS` | `min_samples`, `max_eps`, `xi` | `O(n·log n)` | DBSCAN 推广，变密度 |
| GMM | `mixture.GaussianMixture` | `n_components`, `covariance_type` | 慢 | 软聚类，密度估计 |

## 降维 API 速查

```python
# PCA
from sklearn.decomposition import PCA
pca = PCA(n_components=2, svd_solver='auto', whiten=False)
X_pca = pca.fit_transform(X)
pca.explained_variance_ratio_   # 每分量方差占比
pca.n_components_                # 实际保留分量数

# TruncatedSVD（稀疏数据/文本）
from sklearn.decomposition import TruncatedSVD
svd = TruncatedSVD(n_components=100, algorithm='randomized')

# NMF
from sklearn.decomposition import NMF
nmf = NMF(n_components=10, init='nndsvda', solver='mu', beta_loss='kullback-leibler')
W = nmf.fit_transform(X); H = nmf.components_

# IncrementalPCA（大数据）
from sklearn.decomposition import IncrementalPCA
ipca = IncrementalPCA(n_components=50, batch_size=100)
for chunk in chunks:
    ipca.partial_fit(chunk)

# t-SNE（仅可视化）
from sklearn.manifold import TSNE
tsne = TSNE(n_components=2, perplexity=30, init='pca', learning_rate='auto', n_iter=1000)

# UMAP（独立包）
import umap
reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, n_components=2, metric='euclidean')
```

## 异常检测 API 速查

```python
# IsolationForest（工业首选）
from sklearn.ensemble import IsolationForest
iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
labels = iso.fit_predict(X)              # 1=正常, -1=异常
scores = iso.decision_function(X)        # 越负越异常

# LocalOutlierFactor
from sklearn.neighbors import LocalOutlierFactor
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
labels = lof.fit_predict(X)              # 异常检测（无监督）
lof.negative_outlier_factor_             # 异常分数（越小越异常）

# 新颖检测（半监督，只对新点 predict）
lof_novel = LocalOutlierFactor(n_neighbors=20, novelty=True)
lof_novel.fit(X_train)                   # 只用正常样本
labels = lof_novel.predict(X_new)

# OneClassSVM
from sklearn.svm import OneClassSVM
ocsvm = OneClassSVM(kernel='rbf', nu=0.05, gamma='scale')

# EllipticEnvelope（近似高斯）
from sklearn.covariance import EllipticEnvelope
ee = EllipticEnvelope(contamination=0.05)
```

## 关联规则（mlxtend）

```python
from mlxtend.frequent_patterns import apriori, association_rules, fpgrowth

# 1. one-hot 交易矩阵（每行一笔交易）
# 2. 挖频繁项集
frequent = apriori(df, min_support=0.05, use_colnames=True)
# 或更快：frequent = fpgrowth(df, min_support=0.05, use_colnames=True)

# 3. 生成规则
rules = association_rules(frequent, metric='lift', min_threshold=1.0)
rules = rules[(rules['lift'] > 1) & (rules['confidence'] > 0.6)]  # 筛选
```

## 聚类评估指标

```python
# 无标签时（内部指标）
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
silhouette_score(X, labels)        # -1 到 1，越大越好（最常用）
calinski_harabasz_score(X, labels) # 越大越好
davies_bouldin_score(X, labels)    # 越小越好

# 有标签时（外部指标，用于对比聚类与真实标签）
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score
adjusted_rand_score(y_true, labels)        # -1 到 1
normalized_mutual_info_score(y_true, labels)
```

## 经典数据集

```python
from sklearn.datasets import make_blobs, make_moons, make_circles, load_digits

# 人造簇（测 KMeans）
X, y = make_blobs(n_samples=300, centers=3, random_state=42)

# 月牙形（测 DBSCAN，KMeans 必失败）
X, y = make_moons(n_samples=300, noise=0.05, random_state=42)

# 环形（测 DBSCAN/Spectral）
X, y = make_circles(n_samples=300, noise=0.05, factor=0.5, random_state=42)

# 手写数字（64 维，测降维可视化）
X, y = load_digits(return_X_y=True)  # 1797 样本，8x8=64 维
```

## 官方资源

- [scikit-learn 聚类](https://scikit-learn.org/stable/modules/clustering.html)（12 算法全解 + 选型对比）
- [scikit-learn 降维（decomposition）](https://scikit-learn.org/stable/modules/decomposition.html)
- [scikit-learn 流形学习（t-SNE 等）](https://scikit-learn.org/stable/modules/manifold.html)
- [scikit-learn 异常检测](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [scikit-learn clustering 对比示例](https://scikit-learn.org/stable/auto_examples/cluster/plot_cluster_comparison.html)
- [UMAP 文档（umap-learn）](https://umap-learn.readthedocs.io/)
- [mlxtend 关联规则文档](https://rasbt.github.io/mlxtend/api_subpackages/mlxtend.frequent_patterns/)
- [scikit-learn GitHub](https://github.com/scikit-learn/scikit-learn)
