---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 scikit-learn 1.9.0 官方文档（clustering + decomposition + manifold + outlier_detection）编写

## 速查

- **聚类选型一句话**：球形均匀簇→**KMeans**；任意形状+有噪声→**DBSCAN/HDBSCAN**；要层次结构→**AgglomerativeClustering**；要自动定簇数→**MeanShift/AffinityPropagation**
- **KMeans 关键**：最小化 inertia（簇内平方和），`n_clusters` 用肘部法（inertia 拐点）或**轮廓系数**（sklearn 官方推荐，-1 到 1 越大越好）
- **DBSCAN 关键**：`eps`（邻域半径）+ `min_samples`（核心点最少邻居，含自身）；核心点密度连通成簇，孤立点标 -1；`eps` 用 k-距离图（k=`min_samples`）找拐点
- **层次聚类 linkage**：`ward`（最小化方差，球形簇，**只能配欧氏距离**）/ `complete`（最远邻，紧凑）/ `average`（平均，平衡）/ `single`（最近邻，链状但对噪声敏感）
- **PCA 关键**：SVD 分解，`explained_variance_ratio_` 看每分量方差占比，累加到 95% 是常用截断；**center 但不 scale**（要标准化需先 `StandardScaler`）
- **t-SNE 严限**：只用于 2D/3D **可视化**，`perplexity`（5-50，默认 30）控制局部 vs 全局，`init='pca'` 保全局结构，`learning_rate='auto'`；**不能 transform 新点、不能用于聚类/下游**
- **UMAP 通用**：`n_neighbors`（5-50，局部 vs 全局）+ `min_dist`（0-0.99，紧致 vs 分散）；既能可视化又能做聚类前置，比 t-SNE 快且保留全局结构
- **异常检测首选 IsolationForest**：随机划分隔离异常点（路径短=异常），`contamination` 控制异常比例，高维高效，工业事实标准
- **关联规则三指标**：support（X∪Y 频率）→ confidence（P(Y|X)）→ lift（>1 正相关，=1 独立，<1 负相关）

## 聚类算法深析

scikit-learn `cluster` 模块提供 12+ 种聚类算法，按**簇形状假设**分两大阵营：扁平几何（假设簇是凸团）与图/密度几何（任意形状）。

### KMeans：球形簇之王

最小化簇内平方和（inertia），通过 EM 迭代收敛。

```python
from sklearn.cluster import KMeans

km = KMeans(
    n_clusters=3,          # 必须指定簇数
    init='k-means++',      # 智能初始化（默认），避免随机初始化的局部最优
    n_init='auto',         # 1.4+ 默认，自动跑多次取最优（10 次）
    max_iter=300,          # 单次 EM 最大迭代
    random_state=42,       # 固定保复现
)
labels = km.fit_predict(X)
print(km.inertia_)         # 簇内平方和（越小越紧凑，但不能跨 k 比较）
print(km.cluster_centers_) # 簇中心坐标
```

**选 k 的两种方法**：

- **肘部法（Elbow）**：画 `k` vs `inertia_` 曲线，找拐点（下降变缓处）。缺点是拐点常不明显
- **轮廓系数（Silhouette）**（sklearn 官方推荐）：`silhouette_score(X, labels)`，衡量样本与自身簇（a）vs 最近邻簇（b）的紧致分离，公式 `s = (b-a)/max(a,b)`，范围 -1 到 1，越大越好

```python
from sklearn.metrics import silhouette_score

for k in range(2, 11):
    km = KMeans(n_clusters=k, n_init='auto', random_state=42).fit(X)
    score = silhouette_score(X, km.labels_)
    print(f"k={k}, silhouette={score:.3f}")  # 选 score 最大的 k
```

**致命局限**：假设簇是凸球形且方差相近，遇到月牙形/环形/密度不均的数据完全失效；`inertia_` 在高维下失效（距离区分度消失）。

### DBSCAN：密度聚类的救星

基于密度连通性，自动发现任意形状的簇，并标记噪声。

```python
from sklearn.cluster import DBSCAN

db = DBSCAN(
    eps=0.5,           # 邻域半径——最敏感参数，用 k-距离图定
    min_samples=5,     # 核心点所需的最少邻居数（含自身），数据越大调大
    metric='euclidean',
)
labels = db.fit_predict(X)
# labels 中的 -1 = 噪声点；>=0 = 簇编号
n_noise = (labels == -1).sum()
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
```

**核心点定义**：某点的 `eps` 邻域内点数 ≥ `min_samples` 即为核心点；核心点彼此密度连通（链式）构成一簇；边界点是非核心但落在核心邻域内；噪声点是既非核心也非边界。

**参数调优**：

- `min_samples` 经验值：`≥ 数据维度 + 1`，噪声多时调大到 2×维度
- `eps` 用 **k-距离图**：取 `k=min_samples`，算每个点到第 k 近邻的距离，按升序画曲线，拐点处即为 `eps`

**局限**：密度不均（簇有稀有密）时单一 `eps` 无法兼顾，需用 **HDBSCAN**（`hdbscan` 包，参数 `min_cluster_size`，自动处理变密度）。

### 层次聚类（Agglomerative）

自底向上合并，可输出树状图展示层次结构。

```python
from sklearn.cluster import AgglomerativeClustering

agg = AgglomerativeClustering(
    n_clusters=3,            # 或用 distance_threshold 替代
    linkage='ward',          # 簇间距离定义
    metric='euclidean',      # 距离度量（ward 强制欧氏）
)
labels = agg.fit_predict(X)
```

**linkage 四选项**（簇间距离的计算方式，决定簇形状）：

| linkage | 定义 | 簇形状 | 噪声鲁棒 |
| --- | --- | --- | --- |
| **ward**（默认） | 合并使总方差增量最小 | 球形、大小均匀 | 较好 |
| **complete** | 两簇最远点距离 | 紧凑 | 较好 |
| **average** | 两簇平均距离 | 平衡 | 较好 |
| **single** | 两簇最近点距离 | 链状/细长 | **差（链式效应）** |

> `ward` 只能配欧氏距离（`metric='euclidean'`），其他 linkage 可配任意距离（如余弦、曼哈顿）——适合非欧数据。

**优势**：输出 `children_` 可画树状图（dendrogram），业务可解释性强；不必预先定 `n_clusters`，可切任意层级。

### 其他聚类算法速览

| 算法 | 核心机制 | 是否需指定簇数 | 典型场景 |
| --- | --- | --- | --- |
| **MeanShift** | 沿密度梯度滑向众数 | 否（自动） | 自动发现 blob 中心 |
| **AffinityPropagation** | 消息传递选代表点 | 否（用 preference 控制） | 中小数据，自动定簇数 |
| **SpectralClustering** | 图拉普拉斯特征值分解 | 是 | 图分割、图像分割、非凸簇 |
| **BIRCH** | CF 树压缩 + 聚类 | 是 | 超大数据、内存高效 |
| **GMM**（mixture） | 高斯混合 + EM | 是（分量数） | 软聚类（给概率）、密度估计 |

## 降维算法深析

降维分**线性**（PCA/TruncatedSVD/NMF）与**非线性/流形**（t-SNE/UMAP）两阵营，用途和特性天差地别。

### PCA：线性降维主力

通过 SVD 找方差最大的正交方向，按方差贡献排序。

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=0.95)    # 保留 95% 方差（自动定分量数）
X_pca = pca.fit_transform(X)
print(pca.explained_variance_ratio_)  # 每分量方差占比
print(pca.n_components_)               # 实际保留的分量数
print(pca.singular_values_)            # 奇异值（越大越重要）
```

**关键设计**：

- **center 但不 scale**：PCA 内部只去均值（centering），不除标准差。若特征量纲差异大（如身高 cm vs 体重 kg），**必须先 `StandardScaler`** 否则大量纲特征主导
- **`n_components` 三种设法**：整数（指定分量数）/ 浮点 0-1（保留方差比例，自动定分量数）/ `None`（全保留）
- **`svd_solver`**：`'auto'`（默认自动选）/ `'full'`（精确）/ `'randomized'`（近似，超快，适合特征极多如图像）/ `'arpack'`（指定分量数）
- **`whiten=True`**：白化（去相关 + 单位方差），下游用 KMeans/RBF SVM 时有利

**变体**：

- `IncrementalPCA`：大数据无法装入内存时，用 `partial_fit` 分块训练
- `KernelPCA`：核技巧非线性降维（`kernel='rbf'/'poly'`）
- `SparsePCA`：稀疏主成分（增加可解释性）

### TruncatedSVD vs PCA

| 维度 | PCA | TruncatedSVD |
| --- | --- | --- |
| **中心化** | 是（去均值） | **否** |
| **输入** | 密集矩阵 | **稀疏矩阵（如 TF-IDF）** |
| **代表应用** | 一般数值数据 | 文本 LSA（潜在语义分析） |

> 文本场景（TF-IDF 矩阵）必用 `TruncatedSVD`——PCA 会破坏稀疏性。这就是 LSA（Latent Semantic Analysis）的基础。

### NMF：非负矩阵分解

要求数据和分量都非负，常给出「部分」（parts-based）可解释表示。

```python
from sklearn.decomposition import NMF

nmf = NMF(
    n_components=10,         # 主题数（文本场景）
    init='nndsvda',          # 推荐初始化（优于 random）
    solver='mu',             # 乘法更新（支持 KL 散度）
    beta_loss='kullback-leibler',  # 适合文本计数
)
W = nmf.fit_transform(X)     # 文档-主题矩阵
H = nmf.components_          # 主题-词矩阵
```

**典型应用**：话题提取（每个分量是一个话题）、人脸特征分解（眼睛/鼻子等部位）、音频源分离。`init` 强烈推荐 `'nndsvd'` 系列而非 `'random'`。

### t-SNE：可视化专用（严限）

把高维相似度映射为低维概率分布，擅长揭示局部簇结构。

```python
from sklearn.manifold import TSNE

tsne = TSNE(
    n_components=2,            # 只能 2 或 3
    perplexity=30,             # 5-50，越大越关注全局，数据越大调大
    learning_rate='auto',      # 自动（样本数/early_exaggeration）
    init='pca',                # 用 PCA 初始化保全局结构（官方推荐）
    n_iter=1000,               # 最大迭代
    random_state=42,           # 仍非确定性（不同种子结果不同）
)
X_2d = tsne.fit_transform(X)
# 注意：没有 transform 方法，新点无法单独映射
```

**严格限制**（sklearn 官方警告）：

- **只用于可视化，不用于聚类或下游建模**：簇间距离无意义，簇大小被夸大
- **不能 transform 新点**：无显式映射，新点要重新全量跑——无法进 Pipeline
- **非确定性**：多次运行结果不同，需多试几个种子选 KL 散度最小的
- **复杂度 `O(d·N²)`**：百万样本要几小时（PCA 几秒）
- **「可视化不好分≠分类不好」**：sklearn 明确指出，t-SNE 看着混的，监督模型未必分不开

### UMAP：现代流形降维通才

独立包 `umap-learn`，既能可视化又能做聚类前置，比 t-SNE 快且保留全局结构。

```python
import umap

reducer = umap.UMAP(
    n_neighbors=15,    # 5-50，小=关注局部细节，大=关注全局结构
    min_dist=0.1,      # 0-0.99，小=簇紧凑，大=簇分散
    n_components=2,    # 可 > 2 用于通用降维（不限可视化）
    metric='euclidean',
)
X_2d = reducer.fit_transform(X)
# UMAP 有 transform 方法，可扩展到新点
```

**优势**：`transform` 可扩展新点（能进 Pipeline）、保留全局拓扑（t-SNE 只保局部）、速度快（百万样本秒级）、可用于通用降维（不限 2D/3D）。

> 生产实战：可视化首选 UMAP（快、稳、可扩展），教学/学术场景用 t-SNE。两者都**不可作为聚类依据**。

## 异常检测深析

异常检测（Anomaly Detection）找出显著偏离主流分布的点，无需「正常样本标签」。

### IsolationForest：工业首选

随机划分隔离样本——异常点路径短（易隔离），正常点路径长。

```python
from sklearn.ensemble import IsolationForest

iso = IsolationForest(
    n_estimators=100,        # 树数
    contamination=0.05,      # 预期异常比例（控制阈值）
    random_state=42,
    n_jobs=-1,
)
labels = iso.fit_predict(X)  # 1=正常, -1=异常
scores = iso.decision_function(X)  # 越负越异常
```

**优势**：高维高效（线性复杂度）、不需距离计算（无高维灾难）、`contamination` 可调异常比例阈值。**工业事实标准**。

### LocalOutlierFactor（LOF）

基于局部密度偏差——某点密度显著低于邻居即为异常。

```python
from sklearn.neighbors import LocalOutlierFactor

# 异常检测（无监督，默认）
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
labels = lof.fit_predict(X)   # 1=正常, -1=异常

# 新颖检测（半监督，novelty=True 后可 predict 新点）
lof_new = LocalOutlierFactor(novelty=True)
lof_new.fit(X_train)          # 只用正常样本训练
labels = lof_new.predict(X_new)  # 检测新点是否异常
```

**关键**：`n_neighbors` 默认 20，异常比例高（>10%）时调到 35。`novelty=True` 切换为半监督模式——**只能对训练集外的新点 predict，不能对训练集 predict**（sklearn 明确警告会得错结果）。

### OneClassSVM 与 EllipticEnvelope

- **OneClassSVM**：学一个把正常包住的超平面，参数 `nu`（异常上界比例）。**对异常敏感需精调**，大数据用 `SGDOneClassSVM`
- **EllipticEnvelope**：假设正常数据服从高斯，拟合鲁棒协方差画椭圆。**仅当数据近似高斯时用**

## 关联规则

发现「买 A 也买 B」式的共现模式，经典用于购物篮分析。sklearn 不内置，用 `mlxtend`。

```python
from mlxtend.frequent_patterns import apriori, association_rules
import pandas as pd

# 1. 构造 one-hot 交易矩阵（每行一笔交易，每列一个商品 0/1）
df = pd.DataFrame({...})  # 独热编码

# 2. Apriori 挖频繁项集（min_support 是最低支持度）
frequent = apriori(df, min_support=0.05, use_colnames=True)

# 3. 生成关联规则
rules = association_rules(frequent, metric='lift', min_threshold=1.0)
# 关键列：antecedents(前件) / consequents(后件) / support / confidence / lift
```

**三指标**：

| 指标 | 公式 | 含义 |
| --- | --- | --- |
| **support** | `P(X∪Y)` | 规则出现的频率，筛掉低频噪声 |
| **confidence** | `P(Y\|X)` | 买 X 时也买 Y 的概率（规则强度） |
| **lift** | `P(X∪Y) / (P(X)·P(Y))` | >1 正相关，=1 独立，<1 负相关 |

> **lift 是关键**：confidence 高但 lift≈1 的规则无意义（只是因为 Y 本身就很常见）。只保留 lift>1 的规则。

**算法对比**：

- **Apriori**：候选项集生成 + 逐层搜索，多次扫描数据库，简单但慢
- **FP-Growth**：建 FP 树压缩数据，只扫 2 次，比 Apriori 快，适合大数据
- **Eclat**：深度优先，适合密集数据

## 反模式（生产坑）

1. **KMeans 跑高维不降维**：高维下距离区分度消失（curse of dimensionality），inertia 失效，聚类结果随机。正确：先 PCA/UMAP 降到几十维再聚类
2. **t-SNE 结果当聚类依据**：t-SNE 看着分明的簇可能是可视化假象（局部密度夸大）。正确：t-SNE 只用于可视化探索，聚类用 KMeans/DBSCAN/HDBSCAN
3. **DBSCAN 用默认 eps**：`eps=0.5` 是任意值，对每份数据都不同。正确：画 k-距离图（k=min_samples）找拐点定 eps
4. **不标准化就跑 KMeans/PCA**：KMeans 用欧氏距离、PCA 看方差，大量纲特征会主导。正确：先 `StandardScaler`（PCA 虽 center 但不 scale）
5. **LOF 设 novelty=True 后 predict 训练集**：sklearn 明确警告会得错误结果。正确：novelty 模式只对新点 predict
6. **关联规则只看 confidence**：confidence 高但 lift≈1 的规则无意义（Y 本身常见）。正确：必须同时看 lift，只保留 lift>1

## 下一步

- [参考](./reference.md)：聚类选型决策表 + 降维 API 速查 + 经典数据集 + 官方资源
