---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 scikit-learn 1.9.0 官方文档（算法族章节 + model_selection + metrics）+ sklearn 教程编写，对照当前版本行为

## 速查

- **算法选型决策**：表格数据首选**树模型集成**（随机森林/梯度提升）；线性可分离选**逻辑回归/SVM**；小样本高维选**朴素贝叶斯/SVM**；可解释性优先选**决策树/线性模型**
- **17 算法族**：线性模型 / SVM / 最近邻 / 朴素贝叶斯 / 决策树 / 集成方法（六大主力）+ 其余 11 族按需
- **线性模型正则化**：L2（Ridge 岭回归）平滑防震荡 / L1（Lasso）稀疏做特征选择 / ElasticNet 两者的混合
- **SVM 核技巧**：线性核（大样本）/ RBF 核（默认万能）/ 多项式核；`C` 控制惩罚（大=严拟合易过拟合）/ `gamma` 控制影响范围
- **决策树分裂准则**：分类用 gini（默认）/ entropy；回归用 squared_error；`max_depth` 防过拟合首选参数
- **集成三巨头**：**Bagging**（随机森林=并行降方差）/ **Boosting**（梯度提升=串行降偏差）/ **Stacking**（堆叠异质模型）
- **评估分类**：不平衡数据**禁用 accuracy**，看 precision/recall/F1 + 混淆矩阵 + ROC-AUC
- **交叉验证**：`StratifiedKFold`（分类保比例）/ `KFold`（回归）；`GridSearchCV` 内置 CV 调超参
- **数据泄漏红线**：标准化/特征选择/降维**必须在 CV 折内做**（用 Pipeline 包裹），全量 fit 再 CV = 泄漏

## 算法族选讲

scikit-learn 1.9.0 监督学习模块共 17 大算法族。实际项目高频用的是其中 6 大主力族，其余按场景调用。

### 线性模型（Linear Models）

最简单也最该优先尝试的基线——速度快、可解释、不易过拟合。

```python
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression

# 回归
LinearRegression()              # 普通最小二乘（OLS），无正则化
Ridge(alpha=1.0)                # L2 正则化，防多重共线性震荡
Lasso(alpha=1.0)                # L1 正则化，产生稀疏解（部分系数归零=特征选择）
ElasticNet(alpha=1.0, l1_ratio=0.5)  # L1+L2 混合

# 分类（二分类本质是回归 + 阈值）
LogisticRegression(C=1.0, penalty='l2')  # C 是正则化强度的倒数，大=弱正则
```

**正则化三式**：

| 类型 | 损失附加项 | 效果 | 适用 |
| --- | --- | --- | --- |
| **L2（Ridge）** | `λ·Σw²` | 参数平滑变小，防震荡 | 特征多、多重共线性 |
| **L1（Lasso）** | `λ·Σ|w|` | 部分参数归零，稀疏解 | 特征选择（自动剔无关特征） |
| **ElasticNet** | `λ₁·Σ|w| + λ₂·Σw²` | L1+L2 混合 | 既要稀疏又要稳定 |

> `LogisticRegression` 的 `C` 是正则化强度的**倒数**：`C` 大=正则化弱=更拟合训练集（易过拟合）；`C` 小=正则化强=更平滑。

### 支持向量机（SVM）

找最大间隔分类超平面，核技巧可处理非线性。

```python
from sklearn.svm import SVC, SVR

SVC(C=1.0, kernel='rbf', gamma='scale')  # 分类
# kernel: 'linear'(线性可分/大样本) / 'rbf'(默认万能) / 'poly'(多项式)
# C: 惩罚参数，大=严拟合训练点(易过拟合)，小=宽容(更平滑)
# gamma: RBF 核影响范围，大=只管近处(易过拟合)，小=管得远(欠拟合)
```

**核函数选择**：

- **线性核**：样本量远大于特征数（如 10 万样本 100 特征），线性可分场景
- **RBF 核**（默认）：万能核，中小样本非线性首选
- **多项式核**：特征间有明显多项式关系时

> SVM 的代价是 `O(n_samples²)` 到 `O(n_samples³)` 训练复杂度——**样本过万时慎用 RBF 核**，改用线性核或 `LinearSVC`。

### 最近邻（K-Nearest Neighbors）

「物以类聚」——新样本看最近的 K 个邻居，多数表决（分类）或平均（回归）。

```python
from sklearn.neighbors import KNeighborsClassifier

KNeighborsClassifier(n_neighbors=5, weights='uniform')
# n_neighbors: K 值，小=过拟合(噪声敏感)，大=欠拟合(边界模糊)
# weights: 'uniform'(等权) / 'distance'(近邻权重大)
```

**特点**：无需训练（懒惰学习）、决策边界天然非线性；但对特征量纲敏感（**必须标准化**）、高维灾难（维度越高「最近」越无意义）、预测慢（每次都要算距离）。

### 朴素贝叶斯（Naive Bayes）

基于贝叶斯定理 + 「特征条件独立」假设——虽假设强但小样本高维场景（文本分类）出奇好用。

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB

GaussianNB()            # 特征连续，假设高斯分布
MultinomialNB()         # 特征是计数（词频），文本分类经典
BernoulliNB()           # 特征是 0/1 二值
```

### 决策树（Decision Trees）

CART 算法递归二分特征空间，形成 if-else 规则树——可解释性最强。

```python
from sklearn.tree import DecisionTreeClassifier, plot_tree

clf = DecisionTreeClassifier(
    criterion='gini',       # 'gini'(默认，基尼不纯度) / 'entropy'(信息增益)
    max_depth=None,         # 树最大深度——防过拟合首选参数
    min_samples_split=2,    # 节点分裂所需最小样本数
    min_samples_leaf=1,     # 叶节点最小样本数
)
clf.fit(X_train, y_train)
plot_tree(clf)  # 可视化决策规则
```

**分裂准则**：

- **Gini（默认）**：`gini = 1 - Σpᵢ²`，计算略快
- **Entropy**：`-Σpᵢ·log(pᵢ)`，信息论基础，略慢但效果相近

**致命弱点**：单棵决策树极易过拟合（可把训练集分到 100% 准确）——这就是为什么实际几乎只用它的集成版（随机森林/梯度提升）。

### 集成方法（Ensemble Methods）

把多棵弱树聚成强模型——**现代表格数据任务的事实标准**。

| 范式 | 代表 | 机制 | 解决 | sklearn |
| --- | --- | --- | --- | --- |
| **Bagging** | 随机森林 | 并行训多棵树，每棵看不同数据/特征子集，投票/平均 | 降方差（防过拟合） | `RandomForestClassifier` |
| **Boosting** | 梯度提升 | 串行训多棵树，每棵修正前一棵的错误残差 | 降偏差（提准确率） | `GradientBoostingClassifier` |
| **Stacking** | 堆叠 | 训多个异质模型，再用一个元模型学如何组合 | 融合互补 | `StackingClassifier` |

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

# 随机森林：并行，不易过拟合，但准确率有上限
RandomForestClassifier(n_estimators=100, max_features='sqrt')

# 梯度提升：串行，准确率更高，但易过拟合需调学习率
GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3)
```

> 生产实战：sklearn 的梯度提升只是基线，**真打榜用 XGBoost / LightGBM / CatBoost**（更快更强，支持缺失值/类别特征）——这是 Kaggle 表格赛的常胜将军。

## 评估指标深析

### 分类指标

| 指标 | 公式 | 适用 | 陷阱 |
| --- | --- | --- | --- |
| **accuracy（准确率）** | 预测正确数 / 总数 | 类别平衡 | **不平衡数据会骗人**（99% 负样本，全猜负也有 99% 准确率） |
| **precision（精确率）** | TP / (TP+FP) | 关注「预测为正的有多准」（垃圾邮件：误杀正常邮件代价高） | — |
| **recall（召回率）** | TP / (TP+FN) | 关注「真正的正例有多少被找出」（疾病筛查：漏诊代价高） | — |
| **F1** | 2·P·R/(P+R) | precision 与 recall 的调和平均，不平衡数据首选 | — |
| **ROC-AUC** | ROC 曲线下面积 | 二分类整体排序能力（0.5 随机，1.0 完美） | 多分类需 OvR 平均 |

**混淆矩阵**是所有分类指标的基础：

```text
              预测正    预测负
实际正    TP       FN    ← recall = TP/(TP+FN)
实际负    FP       TN    ← precision = TP/(TP+FP)
```

**业务对齐**：先问「**漏报（FN）和误报（FP）哪个代价高**」——疾病筛查重 recall（宁误报不漏诊），垃圾邮件重 precision（宁放过不误杀）。

### 回归指标

| 指标 | 公式 | 特点 |
| --- | --- | --- |
| **MSE** | `mean((y-ŷ)²)` | 对大误差敏感（平方放大），单位是 y 的平方 |
| **RMSE** | `sqrt(MSE)` | 与 y 同单位，最直观 |
| **MAE** | `mean(|y-ŷ|)` | 对异常值鲁棒（不平方） |
| **R²** | `1 - SS_res/SS_tot` | 方差解释率，≤1，越接近 1 越好；≤0 比均值预测还差 |

## 交叉验证（Cross-Validation）

单次 `train_test_split` 的评估方差大（划分不同结果不同），交叉验证用多折平均更稳健。

```python
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score

# K 折（回归用）
kf = KFold(n_splits=5, shuffle=True, random_state=42)

# 分层 K 折（分类必用——保每折类别比例）
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 一行评估：5 折 CV 取平均
scores = cross_val_score(clf, X, y, cv=skf, scoring='f1_macro')
print(f"F1: {scores.mean():.3f} ± {scores.std():.3f}")
```

**为何分类必须分层**：普通 `KFold` 划分可能让某折完全没有少数类——模型在那折无法学习。`StratifiedKFold` 保证每折的类别比例与全集一致。

## 超参数调优

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.pipeline import Pipeline

# 用 Pipeline 包裹：防数据泄漏（标准化在每折 CV 内做）
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC()),
])

# 网格搜索：穷举所有参数组合
param_grid = {
    'svm__C': [0.1, 1, 10],
    'svm__kernel': ['rbf', 'linear'],
    'svm__gamma': ['scale', 'auto'],
}

grid = GridSearchCV(pipe, param_grid, cv=5, scoring='f1_macro', n_jobs=-1)
grid.fit(X_train, y_train)  # 注意：只在训练集上调参，测试集最后评一次
print(grid.best_params_, grid.best_score_)
```

**GridSearchCV vs RandomizedSearchCV**：

- `GridSearchCV`：参数空间小时用，穷举找全局最优
- `RandomizedSearchCV`：参数空间大时用，采样 `n_iter` 组合，效率更高且常能找到相近解

> **数据泄漏红线**：标准化、特征选择、降维**必须在 CV 折内做**——用 `Pipeline` 包裹即可自动处理。若先全量 `fit_transform` 再 CV，测试折的信息已泄漏进标准化参数，评估会虚高。

## 反模式（生产坑）

1. **全量标准化再划分**：`scaler.fit(X)` 在全数据上算均值方差，测试集分布泄漏进训练。正确：`fit` 只在 `X_train`，`transform` 应用到 `X_test`
2. **调参调到测试集**：用测试集反馈反复调超参，等于把测试集当验证集用过——最终测试分数不可信。正确：训练集训模型、验证集（或 CV）调参、测试集只终评一次
3. **不平衡数据用 accuracy**：99% 负样本数据全猜负也有 99% 准确率。正确：看 precision/recall/F1，或用 `class_weight='balanced'`、过采样（SMOTE）、欠采样
4. **决策树不限深度**：单棵深树能把训练集分到 100% 准确但严重过拟合。正确：设 `max_depth` 或直接用随机森林
5. **SVM 用 RBF 核跑大数据**：10 万样本 RBF 核训练几小时。正确：大样本用 `LinearSVC` 或线性核

## 下一步

- [参考](./reference.md)：算法选型决策表 + API 速查 + 经典数据集
