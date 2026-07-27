---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 scikit-learn 1.9.0 官方文档（clustering.html + decomposition.html + manifold.html + outlier_detection.html）编写，对照当前版本行为

## 速查

- **定义**：只有特征 `X`、无标签 `y`，从数据自身发现结构——聚类（分组）、降维（压缩）、异常检测（找离群）、关联规则（共现）
- **四大任务**：**聚类**（KMeans/DBSCAN/层次）/ **降维**（PCA/t-SNE/UMAP）/ **异常检测**（IsolationForest/LOF）/ **关联规则**（Apriori/FP-Growth）
- **统一 API**：`model.fit(X)` 训练（无 y）→ `model.predict(X)` 或 `model.fit_predict(X)`（聚类）→ `model.transform(X)`（降维）
- **KMeans 核心**：`KMeans(n_clusters=k, init='k-means++', n_init='auto')`，最小化 inertia（簇内平方和）；`n_clusters` 靠肘部法/轮廓系数定
- **DBSCAN 核心**：`DBSCAN(eps=0.5, min_samples=5)`，密度可达成簇，自动识别噪声点（标签 -1），无需指定簇数，能发现任意形状
- **层次聚类**：`AgglomerativeClustering(n_clusters=k, linkage='ward')`，linkage 选 ward（球形）/complete（紧凑）/single（链状）
- **PCA 核心**：`PCA(n_components=2)` 或 `n_components=0.95`（保留 95% 方差），看 `explained_variance_ratio_` 判断保留几个分量
- **t-SNE 限可视化**：`TSNE(n_components=2, perplexity=30, init='pca', learning_rate='auto')`，**只用于 2D/3D 可视化，不能用于聚类或下游建模**
- **UMAP 通用降维**：`umap.UMAP(n_neighbors=15, min_dist=0.1)`，既能可视化又能做聚类前置，比 t-SNE 快且保留全局结构
- **异常检测首选**：`IsolationForest(contamination=0.05, n_estimators=100)`——高维高效、工业事实标准；`LocalOutlierFactor(n_neighbors=20)` 适合局部密度异常
- **关联规则**：`mlxtend.frequent_patterns.apriori(df, min_support=0.05)` + `association_rules()`，看 support/confidence/lift 三指标
- **评估难**：无标签无准确率，聚类用 `silhouette_score`（-1 到 1，越大越好）、降维看方差解释率、异常检测靠业务复核

## 无监督学习是什么

无监督学习的「无监督」指**没有标签**——训练数据只有特征矩阵 `X`（shape `[n_samples, n_features]`），没有「正确答案」`y`。算法必须自己从数据的统计规律中发现结构。

- **输入**：仅特征矩阵 `X`
- **输出**：因任务而异——聚类给簇标签、降维给低维坐标、异常检测给离群标记、关联规则给「如果 A 则 B」
- **对比监督学习**：监督学习是「老师教」（有标签修正），无监督学习是「自学」（找数据自身规律）

> 它解决的核心问题是：当你有海量数据但标注不起时，仍能从中提取价值——客户分群、异常检测、数据压缩、可视化探索。

### 四大任务一览

| 任务 | 目标 | 代表算法 | 典型业务 |
| --- | --- | --- | --- |
| **聚类** | 相似样本归一组 | KMeans / DBSCAN / 层次聚类 | 客户分群、文档主题 |
| **降维** | 高维→低维保信息 | PCA / t-SNE / UMAP | 可视化、特征工程、加速训练 |
| **异常检测** | 标记离群点 | IsolationForest / LOF / OneClassSVM | 欺诈检测、故障预警 |
| **关联规则** | 发现共现模式 | Apriori / FP-Growth | 购物篮分析、推荐前置 |

> 判据：**问自己「想发现什么」**——想分组→聚类；想压缩/可视化→降维；想找异常→异常检测；想找「买 A 也买 B」→关联规则。

## scikit-learn 统一 API

无监督算法沿用 sklearn 的估计器接口，只是 `fit` 不传 `y`：

```python
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

# 聚类：fit(X) 训练，predict(X) 给新点分配簇，fit_predict(X) 一步到位
km = KMeans(n_clusters=3, n_init='auto', random_state=42)
labels = km.fit_predict(X)          # 训练并返回每个样本的簇标签
new_labels = km.predict(X_new)      # 给新样本分配簇

# 降维：fit(X) 学变换，transform(X) 应用，fit_transform(X) 一步到位
pca = PCA(n_components=2)
X_2d = pca.fit_transform(X)         # 训练并降维
X_new_2d = pca.transform(X_new)     # 用学到的变换降维新数据
```

> 关键差异：**聚类有 `predict` 可扩展到新点，降维有 `transform` 可扩展**；但 t-SNE **没有 `transform`**（没有显式映射函数），新点只能重新跑全量，这是它不能用于流水线的原因。

## 第一个聚类（KMeans 客户分群 15 行）

```python
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# 1. 造数据（3 个簇的客户特征：消费频次、客单价等）
X, _ = make_blobs(n_samples=300, centers=3, random_state=42)

# 2. 标准化（KMeans 对量纲敏感——距离计算）
X_scaled = StandardScaler().fit_transform(X)

# 3. 训练 KMeans（n_clusters=3，n_init='auto' 自动选最优初始化）
km = KMeans(n_clusters=3, n_init='auto', random_state=42)
labels = km.fit_predict(X_scaled)

# 4. 评估（轮廓系数：-1 到 1，越大说明簇越紧凑分离）
score = silhouette_score(X_scaled, labels)
print(f"轮廓系数: {score:.3f}")  # > 0.5 通常说明聚类合理
```

> KMeans 是聚类的「Hello World」，但它假设簇是凸球形且大小相近——遇到月牙形数据会彻底失败，这时换 DBSCAN。

## K vs DBSCAN：形状决定算法

聚类算法的选用**完全由数据形状决定**，选错等于白做：

| 维度 | KMeans | DBSCAN |
| --- | --- | --- |
| **簇形状假设** | 凸球形（圆形） | 任意形状（密度连通） |
| **是否需指定簇数** | 必须给 `n_clusters` | 不需要（按密度自动成簇） |
| **处理噪声** | 强行归到某簇 | 标记为 -1（噪声点） |
| **密度不均** | 失败（小簇被吞） | 失败（HDBSCAN 才行） |
| **复杂度** | `O(n·k·d)` 快 | `O(n·log n)` 中 |
| **代表场景** | 客户分群（簇较均匀） | 地理点位、月牙形数据 |

```python
from sklearn.cluster import DBSCAN

# DBSCAN：eps 是邻域半径，min_samples 是核心点最少邻居数
db = DBSCAN(eps=0.5, min_samples=5)
labels = db.fit_predict(X_scaled)
# labels 中的 -1 表示噪声点（不被任何簇接纳）
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
```

> DBSCAN 的 `eps` 极其敏感：太大所有点成一簇，太小全是噪声。常用做法是画 k-距离图（k=min_samples）找拐点。

## 下一步

- [指南](./guide-line.md)：聚类算法深析 + 降维对比 + 异常检测 + 关联规则
- [参考](./reference.md)：算法选型决策表 + API 速查 + 经典数据集 + 官方资源
