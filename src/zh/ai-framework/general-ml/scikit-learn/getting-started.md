---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 scikit-learn 1.9.0 官方文档（Getting Started / Pipeline & ColumnTransformer / GridSearch / User Guide）编写，对照当前 stable 行为

## 速查

- **安装**：`pip install scikit-learn`（依赖 NumPy、SciPy、joblib、threadpoolctl；Python ≥ 3.9）
- **Estimator 契约**：`Estimator(param=...)` → `fit(X, y)` → `predict(X)` / `transform(X)` / `score(X, y)`
- **参数访问**：`get_params()` 看全部超参；`set_params(**kwargs)` 改单个超参（Pipeline 用 `step__param` 跨层寻址）
- **数据格式**：特征 `X` 是 2D（`n_samples × n_features`）、标签 `y` 是 1D；接受 NumPy ndarray / 稀疏矩阵 / pandas DataFrame
- **Pipeline**：`Pipeline([('name', transformer), ..., ('clf', model)])`；`make_pipeline(*steps)` 是简写（名字自动生成）
- **ColumnTransformer**：`ColumnTransformer([('num', StandardScaler(), num_cols), ('cat', OneHotEncoder(), cat_cols)])`，混合列差异化预处理
- **超参搜索**：`GridSearchCV(est, param_grid, cv=5)`；`RandomizedSearchCV(est, param_distributions, n_iter=50)`
- **Halving**：`HalvingGridSearchCV`（successive halving，更快，需 `from sklearn.experimental import enable_halving_search_cv`）
- **HistGB**：`HistGradientBoostingClassifier(max_iter, learning_rate)`——直方图梯度提升，原生 NaN + 类别特征
- **持久化**：`joblib.dump(model, 'x.joblib')` / `joblib.load('x.joblib')`
- **版本**：稳定版 **1.9.0**（2026-06）；开发版 1.10

## 安装

```bash
pip install scikit-learn          # 含 NumPy/SciPy/joblib 依赖
pip install -U scikit-learn       # 升级到 1.9.0
```

需要 pandas 支持列名（ColumnTransformer 推荐）与 matplotlib（绘图）可一并装：

```bash
pip install scikit-learn pandas matplotlib seaborn
```

> scikit-learn 不自带 GPU 后端。需要 GPU 加速请用 [RAPIDS cuML](https://docs.rapids.ai/api/cuml/stable/)（提供 sklearn 兼容 API）。

## Estimator API：一切皆「估计器」

sklearn 的设计哲学是**接口一致性**：分类器、回归器、聚类器、变换器都继承自 `BaseEstimator`（+ 对应 Mixin），呈现统一的方法面：

| 方法 | 适用对象 | 作用 |
| --- | --- | --- |
| `fit(X, y=None)` | 所有估计器 | 从数据学习参数（权重、均值方差、聚类中心等） |
| `predict(X)` | 分类器 / 回归器 | 输出预测标签或数值 |
| `predict_proba(X)` | 分类器（可选） | 输出每类概率（需模型支持） |
| `transform(X)` | 变换器 / 预处理 | 按学习到的规则变换特征 |
| `fit_transform(X, y)` | 变换器 | `fit` 后立即 `transform`（部分实现有优化） |
| `score(X, y)` | 分类器 / 回归器 | 默认分类返回 accuracy、回归返回 R² |
| `get_params()` / `set_params()` | 所有估计器 | 读 / 改超参（网格搜索的基础） |

```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

clf = LogisticRegression(C=1.0, max_iter=1000)   # 超参在构造时传入
clf.fit(X_train, y_train)                         # 学习
y_pred = clf.predict(X_test)                      # 预测
acc = clf.score(X_test, y_test)                   # 评分（默认 accuracy）

clf.get_params()                                  # {'C': 1.0, 'max_iter': 1000, ...}
clf.set_params(C=0.1)                             # 改超参（不重训）
```

> **关键**：估计器实例化只存超参，真正的学习参数（`.coef_`、`.classes_`、`.center_` 等）在 `fit` 之后才出现，且以下划线结尾。这是 sklearn 的命名约定。

## 第一个端到端流程：Pipeline

把「标准化 → 训练」串成一个对象，**避免在交叉验证时把验证集的统计量泄漏进训练**：

```python
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score

# 显式命名（推荐：可读 + 可网格搜索寻址）
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('svc', SVC(C=1.0, kernel='rbf')),
])

# 简写（名字由类名小写自动生成：'standardscaler'、'svc'）
pipe2 = make_pipeline(StandardScaler(), SVC())

pipe.fit(X_train, y_train)         # 内部：scaler.fit_transform → svc.fit
pipe.predict(X_test)               # 内部：scaler.transform → svc.predict
pipe.score(X_test, y_test)

cross_val_score(pipe, X, y, cv=5)  # CV 时每折独立 fit/transform，无泄漏
```

Pipeline 的方法会自动级联：`fit` 对每步 `fit_transform`、最后一步 `fit`；`predict` 对前面所有步 `transform`、最后一步 `predict`。

## 混合列预处理：ColumnTransformer

真实数据常是「数值列 + 类别列 + 文本列」混合，ColumnTransformer 让不同列走不同变换，最后水平拼接：

```python
import pandas as pd
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

df = pd.DataFrame({
    'age': [25, 30, np.nan, 45],
    'income': [50000, 80000, 60000, 90000],
    'city': ['BJ', 'SH', 'BJ', 'GZ'],
})

numeric = ['age', 'income']
categorical = ['city']

preprocessor = ColumnTransformer(transformers=[
    ('num', Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ]), numeric),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical),
], remainder='drop')   # 未列出的列丢弃；'passthrough' 则原样保留

# 与模型拼成最终 Pipeline
full_pipe = Pipeline([
    ('prep', preprocessor),
    ('clf', SVC()),
])
full_pipe.fit(df, y)
```

要点：

- `remainder='drop'`（默认）丢弃未指定列；`'passthrough'` 原样保留；也可传一个 estimator 处理剩余列
- 列选择支持列名、列索引、布尔掩码、`make_column_selector(dtype_include=np.number)`（按 dtype 选）、`make_column_selector(pattern='city')`（按列名正则）
- **OneHotEncoder 期望 2D**（传 `['city']` 列表）；**文本向量化器如 CountVectorizer 期望 1D**（传 `'title'` 字符串）——这是高频踩坑点

## 超参搜索：GridSearchCV / RandomizedSearchCV

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import loguniform

param_grid = {
    'svc__C': [0.1, 1, 10],              # 注意 svc__ 前缀：跨 Pipeline 寻址
    'svc__kernel': ['rbf', 'linear'],
}

grid = GridSearchCV(full_pipe, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid.fit(X_train, y_train)

print(grid.best_params_)                  # {'svc__C': 1, 'svc__kernel': 'rbf'}
print(grid.best_score_)                    # 最优 CV 分数
best_model = grid.best_estimator_          # 已在全集上 refit 的最佳 Pipeline
y_pred = best_model.predict(X_test)
```

- **GridSearchCV**：穷举 `param_grid` 的笛卡尔积，适合小空间
- **RandomizedSearchCV**：从分布采样 `n_iter` 组，适合大空间/连续超参（用 `loguniform`、`uniform` 等 scipy 分布）
- **跨层寻址语法**：`<code v-pre>&lt;step名&gt;__&lt;参数名&gt;</code>`（双下划线），可以穿透 Pipeline、ColumnTransformer 嵌套
- `n_jobs=-1` 用 joblib 并行所有 CPU 核
- `refit=True`（默认）用最佳参数在全训练集重训，得到 `best_estimator_`

## 保存与加载

```python
import joblib

joblib.dump(best_model, 'model.joblib')             # 序列化整个 Pipeline
model = joblib.load('model.joblib')                 # 反序列化
model.predict(new_data)
```

> **坑**：joblib 序列化绑定具体的 Python/sklearn 版本，跨大版本加载可能不兼容——生产环境锁定 `scikit-learn==1.9.0`。sklearn 不保证跨大版本的 pickle 兼容性。

## 下一步

入门到此覆盖了 Estimator 契约、Pipeline、ColumnTransformer、网格搜索、持久化。下一步见「指南」：

- **Pipeline 进阶**：FeatureUnion 并行特征、`memory=` 缓存、`FunctionTransformer` 嵌入自定义逻辑
- **HistGradientBoosting**：受 LightGBM 启发的高速梯度提升，原生支持缺失值与类别特征
- **概率校准**：CalibratedClassifierCV 让 `predict_proba` 的概率可信
- **HalvingGridSearchCV**：successive halving，比 GridSearch 快一个数量级
