---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 scikit-learn 1.9.0 官方 API 文档 + 算法选型经验整理

## 速查

- **算法选型一句话**：表格数据 → 树模型集成（随机森林/梯度提升）打榜；线性可分 → 逻辑回归/SVM 基线；小样本高维 → 朴素贝叶斯/SVM；要可解释 → 决策树/线性模型
- **scikit-learn 版本**：1.9.0（2025），Python ≥ 3.10，NumPy ≥ 1.19，SciPy ≥ 1.6
- **安装**：`pip install scikit-learn`（含 NumPy/SciPy 依赖）；打榜加装 `xgboost lightgbm`
- **6 主力算法族 import**：`linear_model` / `svm` / `neighbors` / `naive_bayes` / `tree` / `ensemble`
- **评估 import**：`sklearn.metrics`（指标）/ `sklearn.model_selection`（划分/CV/调参）/ `sklearn.preprocessing`（标准化）
- **经典数据集**：`load_iris`（分类）/ `load_digits`（多分类）/ `load_wine`（分类）/ `load_boston`→`fetch_california_housing`（回归，boston 因伦理问题 1.2 起移除）

## 算法选型决策表

| 场景 | 首选算法 | 备选 | 理由 |
| --- | --- | --- | --- |
| **表格数据打榜** | 梯度提升（XGBoost/LightGBM） | 随机森林 | 树模型集成是表格任务事实标准 |
| **线性可分 / 强基线** | 逻辑回归（分类）/ 岭回归（回归） | 线性 SVM | 快、稳、可解释，先跑基线再考虑复杂模型 |
| **小样本 + 高维**（文本分类） | 朴素贝叶斯 / 线性 SVM | 逻辑回归 | 小样本不易过拟合，高维表现好 |
| **中小样本 + 非线性** | RBF 核 SVM / 随机森林 | KNN | 万能核/集成，非线性边界 |
| **强可解释性需求** | 决策树 / 线性模型 | — | 规则/系数直接可读，合规审计友好 |
| **大数据（>10 万样本）** | `LinearSVC` / 随机森林 / SGD | 避免核 SVM | 核 SVM `O(n²)`+ 训练慢 |
| **特征量纲不一** | 任何算法（但**必须先标准化**） | — | KNN/SVM/SGD/神经网络对量纲敏感 |

## scikit-learn 17 算法族速查

| 算法族 | 模块 | 代表 | 典型场景 |
| --- | --- | --- | --- |
| 线性模型 | `linear_model` | LinearRegression / Ridge / Lasso / LogisticRegression | 基线、可解释、高维 |
| 线性/二次判别分析 | `discriminant_analysis` | LDA / QDA | 降维 + 分类、高斯假设 |
| 核岭回归 | `kernel_ridge` | KernelRidge | 小样本非线性回归 |
| 支持向量机 | `svm` | SVC / SVR / LinearSVC | 中小样本、非线性边界 |
| 随机梯度下降 | `linear_model` | SGDClassifier / SGDRegressor | 大数据流式训练 |
| 最近邻 | `neighbors` | KNeighborsClassifier | 懒惰学习、推荐原型 |
| 高斯过程 | `gaussian_process` | GaussianProcessRegressor | 贝叶斯、不确定性估计 |
| 交叉分解 | `cross_decomposition` | PLSRegression | 共线性回归 |
| 朴素贝叶斯 | `naive_bayes` | GaussianNB / MultinomialNB | 文本分类、小样本 |
| 决策树 | `tree` | DecisionTreeClassifier | 可解释、规则提取 |
| 集成方法 | `ensemble` | RandomForest / GradientBoosting | **表格数据主力** |
| 多类多输出 | （各模块） | OneVsRestClassifier | 多标签、多输出 |
| 特征选择 | `feature_selection` | SelectKBest | 降维、去噪 |
| 半监督 | `semi_supervised` | LabelSpreading | 标注成本高时 |
| 等渗回归 | `isotonic` | IsotonicRegression | 单调回归（校准） |
| 概率校准 | `calibration` | CalibratedClassifierCV | 概率可信度修正 |
| 神经网络 | `neural_network` | MLPClassifier / MLPRegressor | 小型 MLP（深度学习用 PyTorch/TF） |

## 核心 API 速查

### 估计器统一接口

```python
estimator.fit(X, y)              # 训练
estimator.predict(X)             # 预测标签（分类）/ 数值（回归）
estimator.predict_proba(X)       # 预测每类概率（分类特有）
estimator.score(X, y)            # 评分（分类=accuracy，回归=R²）
estimator.transform(X)           # 转换（预处理器/特征选择）
estimator.fit_transform(X, y)    # 拟合 + 转换（等价 fit 后 transform，但更高效）
```

### 数据划分与交叉验证（`sklearn.model_selection`）

```python
train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
KFold(n_splits=5, shuffle=True, random_state=42)
StratifiedKFold(n_splits=5, shuffle=True, random_state=42)  # 分类必用
cross_val_score(estimator, X, y, cv=kf, scoring='f1_macro')
GridSearchCV(estimator, param_grid, cv=5, scoring='f1', n_jobs=-1)
RandomizedSearchCV(estimator, param_distributions, n_iter=50, cv=5)
```

### 评估指标（`sklearn.metrics`）

```python
# 分类
accuracy_score(y_true, y_pred)
precision_score(y_true, y_pred, average='macro')
recall_score(y_true, y_pred, average='macro')
f1_score(y_true, y_pred, average='macro')
confusion_matrix(y_true, y_pred)
classification_report(y_true, y_pred)  # 一键输出 P/R/F1/support
roc_auc_score(y_true, y_proba[:, 1])

# 回归
mean_squared_error(y_true, y_pred)      # MSE
root_mean_squared_error(y_true, y_pred) # RMSE（1.4+）
mean_absolute_error(y_true, y_pred)     # MAE
r2_score(y_true, y_pred)                # R²
```

### 预处理（`sklearn.preprocessing`）

```python
StandardScaler()    # 标准化：均值 0 标准差 1（Z-score）
MinMaxScaler()      # 归一化：缩放到 [0, 1]
RobustScaler()      # 鲁棒标准化：用中位数和四分位距（对异常值鲁棒）
Normalizer()        # 样本归一化：每行单位范数（文本向量常用）
LabelEncoder()      # 标签编码：类别→0,1,2...
OneHotEncoder()     # 独热编码：类别→二值向量
```

## 经典数据集（`sklearn.datasets`）

```python
# 玩具数据集（小，内置无需下载）
load_iris()                        # 分类：150 样本 4 特征 3 类（鸢尾花）
load_digits()                      # 分类：1797 样本 64 特征 10 类（手写数字）
load_wine()                        # 分类：178 样本 13 特征 3 类（葡萄酒）
load_breast_cancer()               # 二分类：569 样本 30 特征（乳腺癌）
fetch_california_housing()         # 回归：20640 样本 8 特征（加州房价）

# 真实数据集（较大，首次下载）
fetch_openml(name='titanic')       # OpenML 海量数据集入口
```

> ⚠️ `load_boston` 因伦理问题（数据含种族相关特征）在 scikit-learn 1.2 起被移除，用 `fetch_california_housing` 替代做回归入门。

## 官方资源

- [scikit-learn 官方文档首页](https://scikit-learn.org/stable/)
- [监督学习章节（17 算法族）](https://scikit-learn.org/stable/supervised_learning.html)
- [模型选择：交叉验证与调参](https://scikit-learn.org/stable/modules/cross_validation.html)
- [评估指标全集](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [预处理全集](https://scikit-learn.org/stable/modules/preprocessing.html)
- [scikit-learn GitHub](https://github.com/scikit-learn/scikit-learn)
- [XGBoost 文档](https://xgboost.readthedocs.io/)（梯度提升打榜主力）
- [LightGBM 文档](https://lightgbm.readthedocs.io/)（梯度提升，更快）
