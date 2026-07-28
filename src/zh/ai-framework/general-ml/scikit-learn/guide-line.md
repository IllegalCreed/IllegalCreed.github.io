---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 scikit-learn 1.9.0 官方文档（Pipeline / ColumnTransformer / FeatureUnion / HistGradientBoosting / Calibration / Successive Halving / User Guide）编写

## 速查

- **Pipeline 进阶**：`memory=joblib.Memory(cachedir)` 缓存中间变换；`final_estimator` 必须是预测器
- **FeatureUnion**：并行跑多个变换器、把输出**横向拼接**（特征更宽）；Pipeline 是**纵向串联**（数据流过）
- **make_column_selector**：按 dtype / 列名正则自动选列（`dtype_include=np.number`、`pattern='^num_'`）
- **FunctionTransformer**：把任意 Python 函数包装成 sklearn 变换器（`func=`、`validate=`）
- **HistGradientBoosting**：`HistGradientBoostingClassifier(max_iter=100, learning_rate=0.1)`，原生 NaN + 类别特征（`categorical_features=`），比 GradientBoosting 快约一个数量级
- **原版 GradientBoosting**：`GradientBoostingClassifier(n_estimators=100, learning_rate=0.1)`，需手动处理缺失值
- **CalibratedClassifierCV**：`method='sigmoid'`（Platt，小样本稳）或 `'isotonic'`（非参，需 >1000 样本）；`'temperature'`（多分类）
- **HalvingGridSearchCV**：successive halving——少量资源评估全部候选，逐轮淘汰，需 `from sklearn.experimental import enable_halving_search_cv`
- **target encoding**：`TargetEncoder`（1.4+）直接在 Pipeline 里做目标编码，替代手动 category-encoders
- **imbalanced-learn**：第三方 `from imblearn.pipeline import Pipeline` 兼容 sklearn 且支持 SMOTE 等采样步骤
- **持久化**：`joblib.dump`；跨大版本不保证 pickle 兼容

## Pipeline 进阶

### 缓存中间结果

长 Pipeline 多次 fit（如反复 GridSearch）时，缓存 transformer 计算可省大量时间：

```python
from joblib import Memory
from tempfile import mkdtemp
from shutil import rmtree

cachedir = mkdtemp()
memory = Memory(location=cachedir, verbose=0)
pipe = Pipeline([...], memory=memory)     # 同参数重 fit 时复用缓存

# 用完清理
rmtree(cachedir)
```

### FunctionTransformer：嵌入自定义逻辑

把任意函数变 sklearn 变换器，融入 Pipeline（这样自定义预处理也能进 GridSearch 和 CV）：

```python
from sklearn.preprocessing import FunctionTransformer
import numpy as np

log_transform = FunctionTransformer(np.log1p, validate=False, feature_names_out='one-to-one')
pipe = Pipeline([('log', log_transform), ('scaler', StandardScaler()), ('clf', SVC())])
```

> `feature_names_out='one-to-one'` 让输出保留原列名（pandas 输出场景重要）。

### 嵌套 Pipeline 与列寻址

跨多层嵌套寻址用双下划线逐层展开：

```python
# 结构：full_pipe → 'prep'(ColumnTransformer) → 'num'(子 Pipeline) → 'scaler'
param_grid = {'prep__num__scaler__with_mean': [True, False]}
```

## FeatureUnion：并行特征拼接

FeatureUnion 让多个变换器**各自对全量数据 fit**，然后把它们的输出**横向拼接**（feature 维变宽），与 Pipeline 的纵向串联互补：

```python
from sklearn.pipeline import FeatureUnion
from sklearn.decomposition import PCA
from sklearn.kernel_ridge import KernelPCA

union = FeatureUnion([
    ('pca', PCA(n_components=5)),
    ('kpca', KernelPCA(n_components=3, kernel='rbf')),
])

pipe = Pipeline([
    ('features', union),     # 输出 5+3=8 维
    ('clf', LogisticRegression()),
])
```

> FeatureUnion 不检查各变换器是否产生重复特征，去重是用户责任。

## ColumnTransformer 实战模式

### 按类型自动选列

```python
from sklearn.compose import make_column_selector as selector

numeric_cols = selector(dtype_include=np.number)
categorical_cols = selector(dtype_include=[object, 'category', 'string'])

pre = ColumnTransformer([
    ('num', StandardScaler(), numeric_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols),
], remainder='passthrough')      # 既非数值也非类别的列原样保留
```

### 文本列与数值列混合（1D vs 2D 陷阱）

```python
# CountVectorizer / TfidfVectorizer 吃 1D 字符串，必须传单列名（字符串而非列表）
pre = ColumnTransformer([
    ('tfidf', TfidfVectorizer(), 'title'),           # 1D：传字符串
    ('num', StandardScaler(), ['views', 'likes']),   # 2D：传列表
])
```

## HistGradientBoosting：直方图梯度提升

受 LightGBM 启发，把连续特征分桶成整数直方图，**训练速度比原版 `GradientBoostingClassifier` 快约一个数量级**，且原生支持：

- **缺失值**：无需 imputer，自动学缺失值往哪个分支走
- **类别特征**：通过 `categorical_features=` 指定列，无需 OneHot
- **大样本**：`n_samples >= 10k` 时优势最明显

```python
from sklearn.ensemble import HistGradientBoostingClassifier

clf = HistGradientBoostingClassifier(
    max_iter=300,                 # 提升轮数（树的数量）
    learning_rate=0.1,
    max_leaf_nodes=31,            # 每棵树最大叶节点
    min_samples_leaf=20,
    l2_regularization=0.0,
    categorical_features=[0, 3],  # 指定哪些列是类别（列索引或列名）
    early_stopping=True,          # 自动用验证子集提前停止
    validation_fraction=0.1,
    random_state=42,
)
```

| 对比项 | GradientBoosting（原版） | HistGradientBoosting |
| --- | --- | --- |
| 实现思路 | 逐树、全排序分裂 | 直方图分桶、向量化 |
| 缺失值 | 需手动填充 | 原生支持 |
| 类别特征 | 需 OneHot | 原生支持 |
| 大样本速度 | 慢 | 快约 10× |
| 多线程 | 否 | OpenMP 并行节点分裂 |

> 生产结构化数据首选 HistGB；若需要极致工程化（GPU、海量调参生态）再考虑 LightGBM / XGBoost。

## 概率校准：让 predict_proba 可信

许多分类器（SVM、RandomForest、朴素贝叶斯）的 `predict_proba` 输出**不是真概率**——只是相对置信度。校准把它映射到真实频率：

```python
from sklearn.calibration import CalibratedClassifierCV, CalibrationDisplay
from sklearn.svm import LinearSVC

base = LinearSVC()                       # SVM 默认无 predict_proba
calibrated = CalibratedClassifierCV(base, method='sigmoid', cv=5)   # Platt scaling
calibrated.fit(X_train, y_train)
calibrated.predict_proba(X_test)         # 现在是可信概率

# 画可靠性图诊断
CalibrationDisplay.from_estimator(calibrated, X_test, y_test, n_bins=10)
```

| method | 别名 | 原理 | 适用 |
| --- | --- | --- | --- |
| `'sigmoid'` | Platt scaling | 拟合 Logistic 回归映射分数→概率 | 小样本、欠自信模型、保序单调（不损 AUC） |
| `'isotonic'` | 保序回归 | 非参数阶梯非递减函数 | 任意单调失真，**需 >1000 样本**否则过拟合 |
| `'temperature'` | 温度缩放 | 调 softmax 温度（需 logits） | 多分类、深度网络输出 |

> `ensemble=True`（默认）：交叉验证训练 k 个 (分类器, 校准器) 对，输出取平均，更稳但更慢；`ensemble=False`：单分类器 + 单校准器，快。

## HalvingGridSearchCV：successive halving

把超参搜索做成「锦标赛」：第一轮用少量资源（默认样本数 `min_resources`）评估所有候选，每轮淘汰差的、给存活候选加资源：

```python
from sklearn.experimental import enable_halving_search_cv  # noqa: F401  必须先 import
from sklearn.model_selection import HalvingGridSearchCV

search = HalvingGridSearchCV(
    estimator=pipe,
    param_grid={'clf__C': [0.1, 1, 10, 100]},
    factor=3,                    # 每轮资源×3、候选÷3
    cv=5,
    n_jobs=-1,
    scoring='accuracy',
).fit(X_train, y_train)
```

- **比 GridSearchCV 快得多**：坏参数组合在小数据上就被淘汰，省下大样本评估开销
- **`factor`**（>1）：资源增长与候选淘汰的比率，越大淘汰越狠
- **`resource`**：默认 `'n_samples'`，可换成 `RandomForestRegressor().n_estimators` 这类
- **仍实验性**：需显式 `from sklearn.experimental import enable_halving_search_cv`，API 可能变更
- 同族还有 `HalvingRandomizedSearchCV`（从分布采样候选）

## 自定义估计器：融入 Pipeline

继承 `BaseEstimator` + 对应 Mixin，即可成为 Pipeline、GridSearch、joblib 序列化的一等公民：

```python
from sklearn.base import BaseEstimator, TransformerMixin

class DebugTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, verbose=False):
        self.verbose = verbose          # 所有超参必须在 __init__ 里出现并原样赋值

    def fit(self, X, y=None):
        return self                     # 没什么学的，直接返回

    def transform(self, X):
        if self.verbose:
            print(f"shape={X.shape}")
        return X
```

规则：`__init__` 只做 `self.param = param` 存储（不做校验，校验放 `fit`）；实现 `fit` + `transform`（变换器）或 `fit` + `predict`（分类/回归器）。

## 版本与生态

- **稳定版**：1.9.0（2026-06）；Python ≥ 3.9；依赖 NumPy ≥ 1.22、SciPy ≥ 1.8
- **重大版本节点**：1.0（API 稳定声明）→ 1.2（_metadata_routing 引入）→ 1.4（`TargetEncoder`、Array API 后端实验）→ 1.6（ fixes 增强元数据路由）→ 1.9（当前）
- **互操作**：imbalanced-learn（SMOTE 采样）、category-encoders（更多编码）、scikit-optimize（贝叶斯调参）、RAPIDS cuML（GPU 兼容 API）
- **持久化兼容性**：跨大版本不保证 pickle 兼容——生产锁版本
