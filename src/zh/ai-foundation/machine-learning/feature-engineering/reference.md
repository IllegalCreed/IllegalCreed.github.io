---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 scikit-learn 1.9.0 + feature-engine 1.x + category_encoders 官方文档整理

## 速查

- **缩放选型一句话**：默认 StandardScaler；有异常值用 RobustScaler；要 [0,1] 用 MinMaxScaler；稀疏用 MaxAbsScaler；按样本归一用 Normalizer
- **谁需缩放**：KNN / SVM / SGD / 神经网络（基于距离或梯度）；树模型（随机森林/GBDT）不需缩放
- **类别编码一句话**：低基数（<10）OneHot；有序类别 OrdinalEncoder；高基数 TargetEncoder；超高基数/在线 HashingEncoder
- **TargetEncoder 防泄漏**：用 `fit_transform`（交叉拟合），不用 `fit().transform()`；`smooth='auto'` 自动平滑
- **版本**：scikit-learn 1.9.0（2025，TargetEncoder 1.3+ 引入）/ feature-engine 1.x / category_encoders 2.x
- **安装**：`pip install scikit-learn feature-engine category_encoders`
- **Pipeline 防泄漏**：所有预处理 + 模型用 Pipeline 包裹，GridSearchCV 自动在 CV 折内 fit
- **三大工具分工**：scikit-learn preprocessing（通用统一 API）/ feature-engine（按列名、可读性强）/ category_encoders（编码最全）

## 缩放工具对照表

| 工具 | 机制 | 公式 | 适用 | 稀疏支持 |
| --- | --- | --- | --- | --- |
| **StandardScaler** | 标准化 | `(x-μ)/σ` | 默认首选 | with_mean=False 才行 |
| **MinMaxScaler** | 归一化到 [0,1] | `(x-min)/(max-min)` | 神经网络、固定范围 | 是 |
| **MaxAbsScaler** | 缩放到 [-1,1] | `x/max|x|` | 稀疏数据（不动零） | 是 |
| **RobustScaler** | 鲁棒标准化 | `(x-中位数)/IQR` | 有异常值 | 否 |
| **Normalizer** | 样本归一化（按行） | `x/‖x‖` | 文本向量 | 是 |

## 类别编码策略矩阵

| 编码器 | 基数 | 有序 | 监督 | 防泄漏 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **OneHotEncoder** | 低 | 否 | 否 | 无需 | 低基数（<10 类），线性/树皆可 |
| **OrdinalEncoder** | 低 | 是 | 否 | 无需 | 有序类别（低/中/高） |
| **TargetEncoder** | 高 | 否 | 是 | fit_transform 交叉拟合 | 高基数（sklearn 1.3+） |
| **CatBoostEncoder** | 高 | 否 | 是 | Ordered 机制 | 高基数（category_encoders） |
| **LeaveOneOutEncoder** | 高 | 否 | 是 | 留一法 | 高基数，相对简单 |
| **JamesSteinEncoder** | 高 | 否 | 是 | 收缩估计 | 高基数，贝叶斯收缩 |
| **GLMMEncoder** | 高 | 否 | 是 | 广义线性混合模型 | 高基数，最严谨 |
| **WOEEncoder** | 二分类 | 否 | 是 | 需 CV | 信用评分（Weight of Evidence） |
| **HashingEncoder** | 超高 | 否 | 否 | 无需 | 在线学习、新类别不断出现 |
| **CountEncoder** | 高 | 否 | 否 | 无需 | 高基数，用频次替代 |
| **BaseNEncoder** | 中 | 否 | 否 | 无需 | OneHot 的紧凑版（二进制） |

## 特征选择方法对照

| 类别 | 方法 | 原理 | 速度 | 模型依赖 | sklearn |
| --- | --- | --- | --- | --- | --- |
| **Filter** | `VarianceThreshold` | 剔除低方差特征 | 极快 | 否 | ✓ |
| **Filter** | `SelectKBest` / `SelectPercentile` | 统计检验打分 | 快 | 否 | ✓ |
| **Wrapper** | `RFE` / `RFECV` | 递归剔除最不重要 | 慢 | 需 coef_/importances_ | ✓ |
| **Wrapper** | `SequentialFeatureSelector` | 贪心前向/后向 | 最慢 | 任意模型 | ✓ |
| **Embedded** | `SelectFromModel`（L1） | L1 正则系数归零 | 中 | 需 L1 模型 | ✓ |
| **Embedded** | `SelectFromModel`（树） | 树 feature_importances_ | 中 | 需树模型 | ✓ |

**Filter 打分函数**：`f_classif`（分类，线性依赖）/ `mutual_info_classif`（分类，任意依赖，非参数）/ `chi2`（分类，仅非负特征）/ `f_regression`（回归）/ `mutual_info_regression`（回归）。

## 核心 API 速查

### scikit-learn preprocessing

```python
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, MaxAbsScaler, RobustScaler, Normalizer,
    KBinsDiscretizer, Binarizer,
    OneHotEncoder, OrdinalEncoder, TargetEncoder,   # TargetEncoder 1.3+
    PowerTransformer, QuantileTransformer, FunctionTransformer,
    PolynomialFeatures, SplineTransformer,
)

# 缩放
StandardScaler().fit_transform(X)
MinMaxScaler(feature_range=(0,1)).fit_transform(X)
RobustScaler(quantile_range=(25,75)).fit_transform(X)

# 变换
PowerTransformer(method='yeo-johnson', standardize=True)   # method: 'box-cox'(仅正) / 'yeo-johnson'(通用)
QuantileTransformer(output_distribution='normal', n_quantiles=100)
FunctionTransformer(func=np.log1p, inverse_func=np.expm1)

# 分箱
KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='quantile')  # strategy: uniform/quantile/kmeans

# 类别
OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=True)
OrdinalEncoder(categories=[['low','medium','high']])
TargetEncoder(smooth='auto')   # 必用 fit_transform 防泄漏

# 交叉
PolynomialFeatures(degree=2, interaction_only=False, include_bias=False)
```

### scikit-learn impute

```python
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.experimental import enable_iterative_imputer  # 必须导入启用
from sklearn.impute import IterativeImputer

SimpleImputer(strategy='median')                          # mean/median/most_frequent/constant
SimpleImputer(strategy='constant', fill_value='missing')
KNNImputer(n_neighbors=5)
IterativeImputer(max_iter=10, random_state=42)            # 类似 MICE
```

### scikit-learn feature_selection

```python
from sklearn.feature_selection import (
    VarianceThreshold, SelectKBest, SelectPercentile, SelectFromModel,
    RFE, RFECV, SequentialFeatureSelector,
    chi2, f_classif, f_regression, mutual_info_classif, mutual_info_regression,
)

VarianceThreshold(threshold=0.0)                                   # 剔除零方差
SelectKBest(mutual_info_classif, k=20)                             # top-k
SelectFromModel(RandomForestClassifier(), threshold='median')      # 树重要性
SelectFromModel(LogisticRegression(penalty='l1', solver='liblinear'))  # L1 稀疏
RFE(estimator, n_features_to_select=20)                            # 递归剔除
RFECV(estimator, cv=5)                                             # 自动定特征数
SequentialFeatureSelector(estimator, direction='forward')          # 贪心选择
```

### feature-engine（按列名操作）

```python
from feature_engine.encoding import (
    OneHotEncoder, OrdinalEncoder, MeanEncoder, CountFrequencyEncoder,
    RareLabelEncoder, WoEEncoder, DecisionTreeEncoder,
)
from feature_engine.imputation import (
    MeanMedianImputer, ArbitraryNumberImputer, EndTailImputer,
    CategoricalImputer, RandomSampleImputer, AddMissingIndicator, DropMissingData,
)
from feature_engine.discretisation import (
    EqualFrequencyDiscretiser, EqualWidthDiscretiser, DecisionTreeDiscretiser,
)
from feature_engine.transformation import (
    LogTransformer, LogCpTransformer, BoxCoxTransformer, YeoJohnsonTransformer, PowerTransformer,
)
from feature_engine.outliers import Winsorizer, OutlierTrimmer, ArbitraryOutlierCapper
from feature_engine.creation import (
    MathFeatures, RelativeFeatures, CyclicalFeatures, DecisionTreeFeatures,
)
from feature_engine.selection import (
    DropFeatures, DropConstantFeatures, DropDuplicateFeatures,
    DropCorrelatedFeatures, SmartCorrelatedSelection,
    RecursiveFeatureElimination, RecursiveFeatureAddition,
    SelectByShuffling, SelectBySingleFeaturePerformance,
)

# 按列名操作示例（feature-engine 的核心优势）
MeanMedianImputer(imputation_method='median', variables=['age', 'income'])
OneHotEncoder(top_categories=10, variables=['city'])   # 只编码 top-10 类别
RareLabelEncoder(tol=0.05, n_categories=5, variables=['city'])  # 合并稀有类
Winsorizer(capping_method='iqr', tail='both', variables=['income'])
CyclicalFeatures(variables=['hour', 'month'], max_val={'hour': 24, 'month': 12})
```

> feature-engine 的优势：按列名（variables）精确指定处理的列，输出仍是 DataFrame（保留列名），与 sklearn Pipeline 完全兼容。sklearn 的转换器默认输出 ndarray，列名丢失（需 `set_config(transform_output='pandas')` 恢复）。

### category_encoders（编码最全）

```python
import category_encoders as ce

ce.OneHotEncoder(use_cat_names=True)
ce.OrdinalEncoder()
ce.TargetEncoder(smoothing=1.0)        # 监督编码
ce.CatBoostEncoder()                    # Ordered 思路
ce.LeaveOneOutEncoder()                 # 留一法防泄漏
ce.JamesSteinEncoder()                  # 贝叶斯收缩
ce.GLMMEncoder()                        # 广义线性混合模型
ce.WOEEncoder()                         # Weight of Evidence（二分类）
ce.HashingEncoder(n_components=64)      # 哈希
ce.CountEncoder()                       # 频次
ce.BaseNEncoder(base=2)                 # Base-N（二进制即 Base2）
ce.BinaryEncoder()                      # BaseNEncoder(base=2) 别名
```

## 完整防泄漏 Pipeline 模板

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, TargetEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, StratifiedKFold

num_cols = ['age', 'income', 'orders_30d']
cat_low = ['device', 'channel']          # 低基数
cat_high = ['city', 'user_segment']      # 高基数

preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imp', SimpleImputer(strategy='median')),
        ('scl', StandardScaler()),
    ]), num_cols),
    ('cat_low', Pipeline([
        ('imp', SimpleImputer(strategy='constant', fill_value='missing')),
        ('ohe', OneHotEncoder(handle_unknown='ignore')),
    ]), cat_low),
    ('cat_high', TargetEncoder(smooth='auto'), cat_high),  # fit_transform 防泄漏
])

pipe = Pipeline([
    ('pre', preprocessor),
    ('sel', SelectFromModel(RandomForestClassifier(n_estimators=100), threshold='median')),
    ('clf', RandomForestClassifier(random_state=42)),
])

grid = GridSearchCV(
    pipe,
    {'clf__n_estimators': [200, 500]},
    cv=StratifiedKFold(5),
    scoring='f1_macro',
    n_jobs=-1,
)
grid.fit(X_train, y_train)   # 所有预处理在 CV 折内自动重新 fit，零泄漏
```

## 官方资源

- [scikit-learn 预处理（preprocessing）](https://scikit-learn.org/stable/modules/preprocessing.html)
- [scikit-learn 缺失值填补（impute）](https://scikit-learn.org/stable/modules/impute.html)
- [scikit-learn 特征选择（feature_selection）](https://scikit-learn.org/stable/modules/feature_selection.html)
- [scikit-learn 文本特征提取](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)
- [scikit-learn Pipeline 与 ColumnTransformer](https://scikit-learn.org/stable/modules/compose.html)
- [feature-engine 官方文档](https://feature-engine.trainindata.com/en/latest/)
- [feature-engine GitHub](https://github.com/feature-engine/feature_engine)
- [category_encoders 官方文档](https://contrib.scikit-learn.org/category_encoders/)
- [category_encoders GitHub](https://github.com/scikit-learn-contrib/category_encoders)
