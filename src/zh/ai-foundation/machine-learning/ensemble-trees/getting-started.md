---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 scikit-learn 1.9.0（ensemble 模块）+ XGBoost 2.x + LightGBM 4.x 官方文档编写，对照当前版本行为

## 速查

- **集成学习定义**：组合多个弱学习器成一个强学习器，比任何单模型更准更稳
- **偏差-方差分解**：泛化误差 = 偏差² + 方差 + 噪声；Bagging 降方差，Boosting 降偏差
- **两大主线**：**Bagging**（并行/采样/平均，随机森林）vs **Boosting**（串行/修正前一棵错误，GBDT）
- **CART 决策树**：递归二分特征空间形成 if-else 树，分类用 gini/entropy，回归用 squared_error
- **随机森林核心**：bootstrap 采样（行）+ `max_features` 特征子集（列）+ 多棵树投票/平均
- **GBDT 核心**：每棵新树拟合前一棵的**负梯度**（残差），`learning_rate`（shrinkage）与 `n_estimators` 此消彼长
- **AdaBoost**：样本加权 + 弱学习器加权投票，错分样本权重提高，sklearn 1.6 起用 SAMME.R
- **现代 Boosting 三巨头**：XGBoost（二阶展开+正则剪枝）/ LightGBM（直方图+leaf-wise）/ CatBoost（Ordered+对称树）
- **树模型免标准化**：基于阈值分裂而非距离，对量纲不敏感；但 KNN/SVM/神经网络必须标准化
- **OOB 评估**：Bagging 中未抽中的样本（约 37%）可做「免费」验证集，`oob_score=True` 开启
- **sklearn API 统一**：`XGBClassifier`/`LGBMClassifier` 都实现 `fit/predict/predict_proba`，可直接进 Pipeline

## 集成学习是什么

集成学习（Ensemble Learning）的「集成」二字来自**组合**——训练多个弱学习器（weak learner，比随机猜略好），用某种策略把它们的结果合成一个强学习器。它的有效性来自一个反直觉的事实：**即使每个弱学习器单独看都不够准，只要它们「犯错的地方不一样」，组合起来就能显著降低错误率**。

- **弱学习器**：单独准确率略高于随机的模型（如浅决策树 decision stump，深度=1）
- **强学习器**：集成后的模型，准确率远超任何单个弱学习器
- **组合策略**：分类用投票（majority vote）/ 平均概率（soft vote）；回归用算术平均

> 关键前提：弱学习器之间的**多样性**（diversity）比单个强更重要。100 棵完全相同的树集成后毫无提升——这正是 Bagging 用随机采样、随机森林用特征子集制造多样性的原因。

### 偏差-方差分解：集成学习的理论地基

监督学习的泛化误差可分解为三部分：

```
泛化误差 = 偏差²(Bias²) + 方差(Variance) + 不可约噪声(Noise)
```

| 组成 | 含义 | 表现 | 应对（集成角度） |
| --- | --- | --- | --- |
| **偏差** | 模型预测的「平均」与真值的差距 | 训练集就差 = 欠拟合 | **Boosting**（串行修正残差，降偏差） |
| **方差** | 不同训练集训出的模型的「波动」 | 训练好测试差 = 过拟合 | **Bagging**（并行平均，降方差） |
| **噪声** | 数据本身的不确定性 | 无法消除 | 任何算法都无法处理 |

> 这就是选型逻辑：**模型欠拟合（偏差高）用 Boosting；模型过拟合（方差高）用 Bagging**。深度决策树单棵方差高（过拟合），Bagging 把多棵深树平均就能降方差——这就是随机森林的原理。

## 决策树（CART）：集成的基学习器

决策树（Decision Tree）用 CART（Classification and Regression Trees）算法，递归地用特征阈值二分样本空间，形成一棵 if-else 规则树。

```python
from sklearn.tree import DecisionTreeClassifier, plot_tree

clf = DecisionTreeClassifier(
    criterion='gini',         # 'gini'(默认) / 'entropy'
    max_depth=3,              # 树最大深度——防过拟合首选
    min_samples_split=2,      # 节点再分裂所需最小样本数
    min_samples_leaf=1,       # 叶节点最小样本数
    random_state=42,
)
clf.fit(X_train, y_train)
plot_tree(clf)  # 可视化规则
```

**分裂准则**：

- **Gini（基尼不纯度）**：`1 - Σpᵢ²`，默认，计算略快
- **Entropy（信息增益）**：`-Σpᵢ·log(pᵢ)`，信息论基础，效果与 Gini 相近

**致命弱点**：单棵决策树**极易过拟合**——不限深度能把训练集分到 100% 准确率，但泛化崩溃。这正是为什么实际几乎只用它的集成版（随机森林/GBDT）。

> CART 是几乎一切集成方法的**唯一基学习器**：神经网络做基学习器集成效果不显著（神经网络本身已足够强），而浅决策树「弱而多样」的特性最适合集成。

## 第一个集成模型（随机森林 10 行）

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 随机森林：100 棵树，每棵看不同数据/特征子集
clf = RandomForestClassifier(
    n_estimators=100,      # 树的数量，调大更稳但慢
    max_features='sqrt',   # 每次分裂考虑 sqrt(n_features) 个特征（默认）
    oob_score=True,        # 用袋外样本评估，免费的验证集
    random_state=42,
    n_jobs=-1,             # 并行训练所有树
)
clf.fit(X_train, y_train)
print(classification_report(y_test, y_pred := clf.predict(X_test)))
print(f"OOB 准确率: {clf.oob_score_:.3f}")  # 袋外评估，无需测试集
```

> 随机森林是「**几乎免调参的强基线**」——默认参数就能用，调大 `n_estimators` 即可更稳。这是新项目第一步该跑的模型。

## Bagging vs Boosting：核心区别

| 维度 | Bagging（Bootstrap Aggregating） | Boosting |
| --- | --- | --- |
| **训练方式** | **并行**（每棵树独立训练） | **串行**（第 k 棵依赖前 k-1 棵） |
| **数据采样** | bootstrap 有放回采样（每棵看不同子集） | 全量数据，但样本权重迭代调整（AdaBoost）/ 拟合残差（GBDT） |
| **基学习器** | 深决策树（强、高方差） | 浅决策树（弱、高偏差，如 max_depth=3） |
| **组合方式** | 等权平均/投票 | 加权求和（后训练的树贡献通常递减） |
| **主要作用** | **降方差**（防过拟合） | **降偏差**（提准确率） |
| **过拟合风险** | 低（平均天然抗过拟合） | 高（串行拟合训练集会过拟合，需 learning_rate 控制步长） |
| **代表算法** | 随机森林 | AdaBoost / GBDT / XGBoost / LightGBM / CatBoost |

> 一句话区分：Bagging 把「各自都很强但爱抖」的模型**平均掉抖动**；Boosting 把「各自都很弱但能互补」的模型**累加成强模型**。

## OOB（Out-of-Bag）评估：Bagging 的免费验证集

Bootstrap 采样有放回地抽 N 个样本，统计上有约 **36.8%** 的样本**从未被抽中**——这些「袋外样本」可作为天然的验证集。

```python
clf = RandomForestClassifier(oob_score=True)
clf.fit(X_train, y_train)
print(clf.oob_score_)  # 袋外准确率，无需独立测试集即可评估泛化
```

> `1 - (1 - 1/n)^n → 1 - 1/e ≈ 0.368`，n 越大越接近 36.8%。OOB 评估的结果与交叉验证相近，但**完全免费**——不需要划测试集，适合数据少的场景。

## 下一步

- [核心算法族与调参](./guide-line.md)：Bagging/Boosting/Stacking 深析 + XGBoost/LightGBM/CatBoost 三巨头 + 超参调优
- [参考](./reference.md)：算法选型决策表 + API 速查 + 偏差-方差权衡矩阵
