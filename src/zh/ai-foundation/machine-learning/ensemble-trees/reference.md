---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 scikit-learn 1.9.0 + XGBoost 2.x + LightGBM 4.x + CatBoost 官方文档整理

## 速查

- **算法选型一句话**：表格数据打榜 → GBDT 三巨头；免调参强基线 → 随机森林；可解释 → 单棵决策树；高维稀疏（文本）→ 换线性/神经网络
- **三大 Boosting 版本**：sklearn `GradientBoostingClassifier`（基线、无缺失值支持）→ XGBoost（二阶展开+正则）→ LightGBM（直方图+leaf-wise，最快）→ CatBoost（类别特征+抗泄漏）
- **版本**：scikit-learn 1.9.0（2025）/ XGBoost 2.x（2024）/ LightGBM 4.x（2024）/ CatBoost 1.x
- **安装**：`pip install scikit-learn xgboost lightgbm catboost shap`
- **核心 import**：`sklearn.ensemble`（RF/GBDT/AdaBoost/Stacking）/ `xgboost`/`lightgbm`/`catboost`（三巨头）
- **并行性**：Bagging 可并行（`n_jobs=-1`）；Boosting 串行（无法并行，但单棵树分裂可并行）
- **统一 sklearn API**：`XGBClassifier`/`LGBMClassifier`/`CatBoostClassifier` 都实现 `fit/predict/predict_proba`，可直接进 Pipeline
- **特征重要性**：`clf.feature_importances_`（不纯度下降）/ `shap.TreeExplainer`（最严谨）/ `sklearn.inspection.permutation_importance`（模型无关）

## 算法选型决策表

| 场景 | 首选算法 | 备选 | 理由 |
| --- | --- | --- | --- |
| **表格数据打榜** | LightGBM / XGBoost | CatBoost | GBDT 三巨头是表格任务事实标准 |
| **大数据集（>10 万样本）** | LightGBM | XGBoost | 直方图算法，训练快 3-5 倍 |
| **大量类别特征**（高基数） | CatBoost | LightGBM | 原生 target encoding + Ordered Boosting 防泄漏 |
| **含缺失值** | XGBoost / LightGBM | CatBoost | 内置缺失值处理（学默认方向），sklearn GBDT 不支持 |
| **免调参强基线** | 随机森林 | GBDT | 默认参数就能用，n_estimators 调大即更稳 |
| **可解释性需求** | 单棵决策树 | 线性模型 | 规则直接可视化，随机森林用 SHAP 近似解释 |
| **小数据集（<1 万）** | 随机森林 | CatBoost | LightGBM leaf-wise 小数据易过拟合 |
| **类别不平衡** | XGBoost + `scale_pos_weight` | 随机森林 + `class_weight='balanced'` | 调整正负样本权重 |
| **高维稀疏（文本/词袋）** | 逻辑回归 / LinearSVC | 神经网络 | 树模型在高维稀疏上表现差 |
| **需要外推（时序预测）** | 线性模型 / 指数平滑 | Prophet | 树模型叶子输出固定，无法外推新范围 |

## 偏差-方差权衡矩阵

| 集成方法 | 基学习器 | 主要降 | 机制 | 过拟合风险 |
| --- | --- | --- | --- | --- |
| **Bagging / 随机森林** | 深决策树 | **方差** | 并行训练 + 平均 | 低 |
| **AdaBoost** | 浅决策树（stump） | **偏差** | 样本加权 + 弱学习器加权 | 中（对噪声敏感） |
| **GBDT** | 浅决策树（depth 3-8） | **偏差** | 拟合负梯度（残差） | 中-高（需早停） |
| **XGBoost** | 浅决策树 + 直方图 | **偏差** | 二阶泰勒 + 显式正则 + 剪枝 | 中（正则化强） |
| **LightGBM** | leaf-wise 树 | **偏差** | 直方图 + GOSS/EFB | 中-高（小数据易过拟合） |
| **CatBoost** | 对称树 | **偏差** | Ordered Boosting + target encoding | 低（抗泄漏设计） |
| **Stacking** | 异质模型 | **偏差 + 方差** | 元学习器学最优组合 | 中 |

## 核心 API 速查

### scikit-learn ensemble

```python
from sklearn.ensemble import (
    RandomForestClassifier,       # Bagging + 决策树
    RandomForestRegressor,
    GradientBoostingClassifier,   # GBDT 基线
    GradientBoostingRegressor,
    HistGradientBoostingClassifier,  # 直方图版 GBDT（sklearn 自研，对标 LightGBM）
    AdaBoostClassifier,
    BaggingClassifier,            # 任意基估计器 Bagging
    StackingClassifier,           # 堆叠
    VotingClassifier,             # 投票（最简单的集成）
    ExtraTreesClassifier,         # 极随机树（分裂阈值也随机）
)

RandomForestClassifier(n_estimators=100, max_features='sqrt', oob_score=True, n_jobs=-1)
GradientBoostingClassifier(learning_rate=0.1, n_estimators=100, max_depth=3, subsample=1.0)
HistGradientBoostingClassifier(learning_rate=0.1, max_iter=100, max_leaf_nodes=31, categorical_features=...)
AdaBoostClassifier(n_estimators=50, learning_rate=1.0)
StackingClassifier(estimators=[...], final_estimator=LogisticRegression(), cv=5)
```

> **HistGradientBoostingClassifier**（sklearn 0.21+）是 sklearn 自研的直方图 GBDT，速度接近 LightGBM，支持缺失值和类别特征（`categorical_features` 参数），是 sklearn 生态内的现代 Boosting 选项。

### XGBoost

```python
import xgboost as xgb

xgb.XGBClassifier(
    n_estimators=500, learning_rate=0.05, max_depth=6,
    min_child_weight=1, subsample=0.8, colsample_bytree=0.8,
    gamma=0, reg_alpha=0, reg_lambda=1,
    objective='binary:logistic',  # 多分类: 'multi:softprob'
    eval_metric='logloss',
    tree_method='hist',           # 直方图（2.0 起默认）
    early_stopping_rounds=20,
)
# 内置原生 API（更底层，支持 DMatrix）
dtrain = xgb.DMatrix(X_tr, label=y_tr)
bst = xgb.train(params, dtrain, num_boost_round=500)
```

### LightGBM

```python
import lightgbm as lgb

lgb.LGBMClassifier(
    n_estimators=500, learning_rate=0.05,
    num_leaves=31,                # 主控复杂度（不是 max_depth）
    max_depth=-1,
    min_data_in_leaf=20,
    feature_fraction=0.8,         # 列采样
    bagging_fraction=0.8,         # 行采样
    bagging_freq=5,
    boosting_type='gbdt',         # 'gbdt'(默认) / 'goss' / 'dart'
    objective='binary',
    categorical_feature=['cat_col'],  # 自动类别编码
)
```

### CatBoost

```python
from catboost import CatBoostClassifier, Pool

CatBoostClassifier(
    iterations=500, learning_rate=0.05, depth=6,
    l2_leaf_reg=3.0,
    loss_function='Logloss',
    cat_features=['cat_col'],     # 自动 target encoding + Ordered
    early_stopping_rounds=20,
)
# Pool 封装数据（支持类别特征、权重、组等）
pool = Pool(X, y, cat_features=['cat_col'])
```

## 关键参数对照表（三巨头）

| 含义 | XGBoost | LightGBM | CatBoost |
| --- | --- | --- | --- |
| boosting 轮数 | `n_estimators` | `n_estimators` | `iterations` |
| 学习率 | `learning_rate`（eta） | `learning_rate` | `learning_rate` |
| 树深度 | `max_depth` | `max_depth`（-1 不限） | `depth` |
| 叶复杂度 | `min_child_weight` | `num_leaves` / `min_data_in_leaf` | `min_data_in_leaf` |
| 分裂增益阈值 | `gamma` | `min_gain_to_split` | — |
| L1 正则 | `reg_alpha` | `lambda_l1` | `l1_leaf_reg`（弱） |
| L2 正则 | `reg_lambda` | `lambda_l2` | `l2_leaf_reg` |
| 行采样 | `subsample` | `bagging_fraction` | `subsample` |
| 列采样 | `colsample_bytree` | `feature_fraction` | `rsm` |
| 类别不平衡 | `scale_pos_weight` | `scale_pos_weight` / `is_unbalance` | `class_weights` / `auto_class_weights` |
| 早停 | `early_stopping_rounds` | `callbacks=[lgb.early_stopping]` | `early_stopping_rounds` |

## 决策树分裂准则速查

| 任务 | criterion 选项 | 默认 | 公式 |
| --- | --- | --- | --- |
| 分类 | `gini` / `entropy` / `log_loss` | `gini` | gini: `1-Σpᵢ²`；entropy: `-Σpᵢlog(pᵢ)` |
| 回归 | `squared_error` / `friedman_mse` / `absolute_error` / `poisson` | `squared_error` | squared_error: MSE |

> Gini 与 Entropy 实践中效果几乎无差异，Gini 略快（无 log 计算）。`friedman_mse` 是 GBDT 默认（用于改进回归树分裂）。

## 官方资源

- [scikit-learn 集成方法](https://scikit-learn.org/stable/modules/ensemble.html)
- [scikit-learn 决策树](https://scikit-learn.org/stable/modules/tree.html)
- [XGBoost 文档首页](https://xgboost.readthedocs.io/en/stable/)
- [XGBoost 参数说明](https://xgboost.readthedocs.io/en/stable/parameter.html)
- [XGBoost 树模型原理](https://xgboost.readthedocs.io/en/stable/tutorials/model.html)
- [LightGBM 文档首页](https://lightgbm.readthedocs.io/en/latest/)
- [LightGBM 特性（直方图/leaf-wise）](https://lightgbm.readthedocs.io/en/latest/Features.html)
- [CatBoost 文档首页](https://catboost.ai/docs/)
- [SHAP（模型解释）](https://shap.readthedocs.io/en/latest/)
- [XGBoost GitHub](https://github.com/dmlc/xgboost)
- [LightGBM GitHub](https://github.com/microsoft/LightGBM)
- [CatBoost GitHub](https://github.com/catboost/catboost)
