---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 scikit-learn 1.9.0 stable API Reference + User Guide 整理

## 速查

- **Estimator 契约**：`fit(X, y)` / `predict(X)` / `transform(X)` / `fit_transform` / `predict_proba` / `score(X, y)` / `get_params` / `set_params`
- **学习后属性**：以下划线结尾（`.coef_`、`.intercept_`、`.classes_`、`.feature_names_in_`）
- **pipeline**：`Pipeline`、`make_pipeline`、`FeatureUnion`、`make_union`
- **compose**：`ColumnTransformer`、`make_column_selector`、`make_column_transformer`、`TransformedTargetRegressor`
- **preprocessing**：`StandardScaler`、`MinMaxScaler`、`RobustScaler`、`MaxAbsScaler`、`OneHotEncoder`、`OrdinalEncoder`、`TargetEncoder`、`PolynomialFeatures`、`KBinsDiscretizer`、`FunctionTransformer`、`Normalizer`、`Binarizer`
- **impute**：`SimpleImputer`、`KNNImputer`、`IterativeImputer`（实验性）
- **ensemble**：`RandomForestClassifier/Regressor`、`GradientBoostingClassifier/Regressor`、`HistGradientBoostingClassifier/Regressor`、`AdaBoost`、`ExtraTrees`、`VotingClassifier`、`StackingClassifier`、`BaggingClassifier`
- **model_selection**：`train_test_split`、`cross_val_score`、`KFold/StratifiedKFold/GroupKFold`、`GridSearchCV`、`RandomizedSearchCV`、`HalvingGridSearchCV`、`learning_curve`、`validation_curve`
- **calibration**：`CalibratedClassifierCV`、`calibration_curve`、`CalibrationDisplay`
- **metrics**：`accuracy_score`、`f1_score`、`precision_score`、`recall_score`、`roc_auc_score`、`log_loss`、`mean_squared_error`、`r2_score`、`confusion_matrix`、`classification_report`
- **decomposition**：`PCA`、`TruncatedSVD`、`NMF`、`LatentDirichletAllocation`
- **cluster**：`KMeans`、`DBSCAN`、`HDBSCAN`、`AgglomerativeClustering`、`MiniBatchKMeans`
- **linear_model**：`LinearRegression`、`LogisticRegression`、`Ridge`、`Lasso`、`ElasticNet`、`SGDClassifier/Regressor`
- **版本**：稳定版 **1.9.0**（2026-06）；Python ≥ 3.9

## Estimator 基类与 Mixin

| 基类 / Mixin | 职责 | 必须实现 |
| --- | --- | --- |
| `BaseEstimator` | 提供 `get_params` / `set_params` / clone | `__init__`（超参原样存储） |
| `ClassifierMixin` | 提供 `score`（accuracy） | `fit` + `predict` |
| `RegressorMixin` | 提供 `score`（R²） | `fit` + `predict` |
| `TransformerMixin` | 提供 `fit_transform` | `fit` + `transform` |
| `ClusterMixin` | 聚类器接口 | `fit` + `predict` |
| `OneToOneFeatureMixin` | 输出列名一一对齐 | 自动 `get_feature_names_out` |

约定：**学习到的属性用下划线结尾**（`coef_`、`classes_`、`feature_names_in_`），区别于构造参数。

## Pipeline 与 ColumnTransformer API

```python
from sklearn.pipeline import Pipeline, make_pipeline, FeatureUnion, make_union
from sklearn.compose import ColumnTransformer, make_column_selector, make_column_transformer

Pipeline(steps, *, memory=None, verbose=False)            # 串联：最后一步是预测器
make_pipeline(*steps, memory=None, verbose=False)          # 名字自动 = 类名小写
FeatureUnion(transformer_list, n_jobs=None)                # 并行：横向拼接输出
ColumnTransformer(transformers, *, remainder='drop',
                  sparse_threshold=0.3, n_jobs=None)       # 按列分派
make_column_selector(pattern=None, *, dtype_include=None,
                     dtype_exclude=None)                    # 列选择器（dtype/正则）
```

### 跨层寻址语法

`&lt;step_name&gt;__<param_name>`（双下划线）穿透任意嵌套：

```python
# full_pipe['prep'] → ColumnTransformer['num'] → Pipeline['scaler'] → with_mean
grid_params = {'prep__num__scaler__with_mean': [True, False]}
```

## 超参搜索 API

```python
GridSearchCV(estimator, param_grid, *, scoring=None,
             n_jobs=None, refit=True, cv=None, verbose=0)
RandomizedSearchCV(estimator, param_distributions, *, n_iter=10,
                   scoring=None, cv=None, n_jobs=None, refit=True)
HalvingGridSearchCV(estimator, param_grid, *, factor=3, resource='n_samples',
                    min_resources='exhaust', max_resources='auto', cv=None)
HalvingRandomizedSearchCV(estimator, param_distributions, *, n_iter=50, factor=3, cv=None)
```

| 类 | 策略 | 适用 |
| --- | --- | --- |
| `GridSearchCV` | 笛卡尔积穷举 | 小离散空间 |
| `RandomizedSearchCV` | 从分布采样 n_iter 组 | 大空间、连续超参 |
| `HalvingGridSearchCV` | successive halving | 实验性、候选多、省时 |
| `HalvingRandomizedSearchCV` | 采样 + halving | 大空间 + 省时 |

`HalvingGridSearchCV` / `HalvingRandomizedSearchCV` 需先 `from sklearn.experimental import enable_halving_search_cv`。

## ensemble 模块速查

| 类 | 算法 | 要点 |
| --- | --- | --- |
| `RandomForestClassifier/Regressor` | Bagging 决策树 | `n_estimators`、`max_features='sqrt'`、OOB 评估 |
| `ExtraTreesClassifier/Regressor` | 极端随机树 | 分裂阈值随机，更快 |
| `GradientBoostingClassifier/Regressor` | 逐树梯度提升 | `n_estimators`、`learning_rate`、需处理 NaN |
| `HistGradientBoostingClassifier/Regressor` | 直方图梯度提升 | 受 LightGBM 启发、原生 NaN + 类别特征、快约 10× |
| `AdaBoostClassifier/Regressor` | 自适应提升 | 关注错分样本 |
| `VotingClassifier` | 多模型投票 | `voting='hard'/'soft'` |
| `StackingClassifier/Regressor` | 二层 stacking | 用 `estimators` + `final_estimator` |
| `BaggingClassifier/Regressor` | Bagging 元框架 | 可套任意基估计器 |

## calibration 模块

```python
CalibratedClassifierCV(estimator, *, method='sigmoid', cv=5, ensemble=True)
calibration_curve(y_true, y_prob, *, pos_label=None, n_bins=5, strategy='uniform')
CalibrationDisplay.from_estimator(estimator, X, y, *, n_bins=10)
```

| method | 原理 | 适用 |
| --- | --- | --- |
| `'sigmoid'` | Platt scaling（Logistic 映射） | 小样本、欠自信、保 AUC |
| `'isotonic'` | 保序回归（非参单调） | 任意单调失真，**需 >1000 样本** |
| `'temperature'` | softmax 温度缩放 | 多分类、需 logits |

## preprocessing 与 impute 速查

| 类 | 作用 | 关键参数 |
| --- | --- | --- |
| `StandardScaler` | z-score 标准化 | `with_mean`、`with_std` |
| `MinMaxScaler` | 缩放到 [0,1] | `feature_range` |
| `RobustScaler` | 用中位数/IQR（抗异常值） | `quantile_range=(25,75)` |
| `MaxAbsScaler` | 缩放到 [-1,1]（稀疏友好） | — |
| `OneHotEncoder` | 独热编码 | `handle_unknown='ignore'`、`sparse_output` |
| `OrdinalEncoder` | 有序编码 | `categories`、`handle_unknown` |
| `TargetEncoder` | 目标编码（1.4+） | `smooth`、`target_type` |
| `PolynomialFeatures` | 多项式特征 | `degree`、`interaction_only` |
| `KBinsDiscretizer` | 分箱 | `n_bins`、`strategy` |
| `FunctionTransformer` | 包装任意函数 | `func`、`feature_names_out` |
| `Normalizer` | 行归一化 | `norm='l2'` |
| `SimpleImputer` | 缺失值填充 | `strategy='mean/median/most_frequent/constant'` |
| `KNNImputer` | KNN 填充 | `n_neighbors` |
| `IterativeImputer` | 多变量迭代填充（实验性） | `estimator`、需 `enable_iterative_imputer` |

## model_selection 划分与 CV

```python
KFold(n_splits=5, shuffle=False)                    # 顺序
StratifiedKFold(n_splits=5, shuffle=True)           # 保类别比例（分类首选）
GroupKFold(n_splits=5)                              # 按 group 划分（防泄漏）
RepeatedStratifiedKFold(n_splits=5, n_repeats=10)
TimeSeriesSplit(n_splits=5)                         # 时序：只用过去预测未来
cross_val_score(est, X, y, cv=StratifiedKFold(5), scoring='f1', n_jobs=-1)
cross_validate(est, X, y, cv=5, return_train_score=True)   # 返回多指标
```

## metrics 速查

| 函数 | 用途 |
| --- | --- |
| `accuracy_score(y_true, y_pred)` | 准确率 |
| `precision_score` / `recall_score` / `f1_score` | 精确/召回/F1（`average='binary/macro/micro/weighted'`） |
| `roc_auc_score` / `average_precision_score` | AUC / PR-AUC |
| `log_loss` | 对数损失（吃概率） |
| `mean_squared_error` / `mean_absolute_error` | 回归 MSE/MAE（`squared=False` 得 RMSE） |
| `r2_score` | 决定系数 |
| `confusion_matrix` / `classification_report` | 混淆矩阵 / 文本报告 |
| `make_scorer(metric, greater_is_better=True)` | 把指标包装成 GridSearch 的 scoring |

## 1.9 模块全景

| 模块 | 职责 |
| --- | --- |
| `sklearn.pipeline` | Pipeline / FeatureUnion（工程化串联） |
| `sklearn.compose` | ColumnTransformer / 列选择器（异构预处理） |
| `sklearn.preprocessing` | 标准化、编码、多项式 |
| `sklearn.impute` | 缺失值填充 |
| `sklearn.ensemble` | 集成方法（RF/GB/HistGB/Stacking） |
| `sklearn.model_selection` | CV、超参搜索、数据划分 |
| `sklearn.calibration` | 概率校准 |
| `sklearn.metrics` | 评估指标 |
| `sklearn.decomposition` | 降维（PCA/NMF/LDA） |
| `sklearn.cluster` | 聚类（KMeans/DBSCAN/HDBSCAN） |
| `sklearn.manifold` | 流形学习（t-SNE/UMAP 接口） |
| `sklearn.linear_model` | 线性模型（含 L1/L2/SGD） |
| `sklearn.svm` | 支持向量机 |
| `sklearn.neighbors` | KNN |
| `sklearn.tree` | 决策树（含 `export_text`/`plot_tree`） |
| `sklearn.feature_extraction` | 文本/图像特征（TF-IDF） |
| `sklearn.feature_selection` | 特征选择 |
| `sklearn.dummy` | 基线（DummyClassifier） |

## 官方资源

- [Stable 文档主页](https://scikit-learn.org/stable/)
- [User Guide（按主题）](https://scikit-learn.org/stable/user_guide.html)
- [API Reference（按模块）](https://scikit-learn.org/stable/modules/classes.html)
- [Combining Estimators](https://scikit-learn.org/stable/modules/compose.html)
- [Tuning hyper-parameters](https://scikit-learn.org/stable/modules/grid_search.html)
- [Release History](https://scikit-learn.org/stable/whats_new.html)
