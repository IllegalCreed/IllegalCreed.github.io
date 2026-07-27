---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 scikit-learn 1.9.0（preprocessing + impute + feature_selection）+ feature-engine 1.x + category_encoders 官方文档编写

## 速查

- **定义**：把原始数据转化为模型能高效利用的特征，「数据决定上限，算法逼近上限」
- **七大主题**：数值特征 / 类别特征 / 时间特征 / 文本特征 / 缺失值 / 特征选择 / 特征交叉
- **数值缩放**：`StandardScaler`（均值 0 标准差 1，默认首选）/ `MinMaxScaler`（[0,1]）/ `RobustScaler`（抗异常值）/ `MaxAbsScaler`（稀疏）
- **数值变换**：`PowerTransformer`（Box-Cox/Yeo-Johnson 消偏态）/ `QuantileTransformer`（映射到均匀/正态）/ `FunctionTransformer(np.log1p)`（对数）
- **数值分箱**：`KBinsDiscretizer`（uniform/quantile/kmeans 三策略）—— 让线性模型捕获非线性
- **类别编码**：`OneHotEncoder`（低基数）/ `OrdinalEncoder`（有序类别）/ `TargetEncoder`（高基数，sklearn 1.3+）/ `HashingEncoder`（超高速不固定维度）
- **缺失值填补**：`SimpleImputer`（mean/median/most_frequent/constant）/ `KNNImputer`（近邻）/ `IterativeImputer`（建模预测）
- **时间特征**：拆分年/月/日/星期/小时 + `CyclicalFeatures`（sin/cos 编码周期性，如小时 23→0）
- **文本特征**：`CountVectorizer`（词频）/ `TfidfVectorizer`（TF-IDF）/ `HashingVectorizer`（哈希）
- **特征选择三类**：**Filter**（统计检验，`SelectKBest`）/ **Wrapper**（包装模型，`RFE`）/ **Embedded**（嵌入训练，`SelectFromModel`）
- **防泄漏红线**：所有学习参数（缩放/编码/填补）**只在 X_train 上 fit**，再 transform X_test；CV 中用 Pipeline 包裹
- **三大工具**：scikit-learn preprocessing（统一 API）/ feature-engine（按列名操作）/ category_encoders（专注编码）

## 特征工程是什么

特征工程（Feature Engineering）是把「原始字段」转化为「模型能高效学习的特征」的过程。模型不会自动理解「2023-07-28」是日期、「北京」是地名——它只认数字矩阵。特征工程就是把业务含义翻译成数字矩阵的艺术。

- **原始字段**：数据库表里的列（如 `注册时间`、`城市`、`近30天订单数`）
- **特征**：模型实际输入的数值列（如 `注册距今天数`、`城市_北京=1`、`log(近30天订单数+1)`）
- **目标**：让模型用更简单的关系（线性/浅树）就能拟合目标，提升准确率 + 降低过拟合

> 一个反直觉的事实：好的特征工程常比换更复杂的算法提升更大。在线性模型上做精的特征工程，可能超过不加工就直接喂深度的神经网络。

### 特征工程七大主题

| 主题 | 核心问题 | 代表工具 |
| --- | --- | --- |
| **数值特征** | 量纲不一/偏态/异常值/需非线性 | StandardScaler / PowerTransformer / KBinsDiscretizer |
| **类别特征** | 字符串类别无法被数值算法使用 | OneHotEncoder / TargetEncoder / HashingEncoder |
| **时间特征** | 时间戳/日期/周期性 | 拆分 + CyclicalFeatures（sin/cos） |
| **文本特征** | 非结构化文本转向量 | CountVectorizer / TfidfVectorizer |
| **缺失值** | NaN 无法被大多数算法处理 | SimpleImputer / KNNImputer / IterativeImputer |
| **特征选择** | 特征太多有噪声/过拟合 | SelectKBest / RFE / SelectFromModel |
| **特征交叉** | 特征间交互作用需显式表达 | PolynomialFeatures / 业务手工构造 |

## scikit-learn Transformer 统一 API

所有预处理工具都实现 Transformer 接口，这是它能与 Pipeline、GridSearchCV 无缝协作的根基：

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
scaler.fit(X_train)              # 1. 只在训练集上学习参数（均值、标准差）
X_train_scaled = scaler.transform(X_train)  # 2. 应用到训练集
X_test_scaled = scaler.transform(X_test)    # 3. 用相同参数 transform 测试集

# 便捷写法（仅训练集）
X_train_scaled = scaler.fit_transform(X_train)
```

> **fit 与 transform 的区别是数据泄漏防线**：`fit` 学习参数（如均值方差），`transform` 应用参数。绝不能在 X_test 上 fit——否则测试集分布泄漏进训练。

## 第一个特征工程 Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# 区分数值列与类别列
num_cols = ['age', 'income', 'orders_30d']
cat_cols = ['city', 'device']

# 数值列：填补 + 标准化
num_pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
])

# 类别列：填补 + OneHot
cat_pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore')),
])

# 按列分别处理
preprocessor = ColumnTransformer([
    ('num', num_pipe, num_cols),
    ('cat', cat_pipe, cat_cols),
])

# 完整 Pipeline：预处理 + 模型
clf = Pipeline([
    ('pre', preprocessor),
    ('model', RandomForestClassifier(n_estimators=100, random_state=42)),
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf.fit(X_train, y_train)  # Pipeline 自动在训练集上 fit 所有步骤
print(clf.score(X_test, y_test))
```

> `ColumnTransformer` 按列分组用不同预处理——数值列标准化、类别列 OneHot，是表格数据预处理的标配。整个 Pipeline 包进 GridSearchCV，所有预处理会在 CV 折内自动重新 fit，彻底防泄漏。

## 防数据泄漏：特征工程第一红线

数据泄漏（Data Leakage）是测试集信息以隐蔽方式进入训练，导致评估虚高。特征工程中最常见的泄漏：

```python
# ❌ 错误：全量 fit 再划分
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)          # 含测试集分布！
X_train, X_test = train_test_split(X_scaled)  # 泄漏已发生

# ✅ 正确：先划分再 fit
X_train, X_test = train_test_split(X)
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)   # 只在训练集学参数
X_test_s = scaler.transform(X_test)         # 测试集只复用参数
```

**正确做法的两条铁律**：

1. **先划分训练/测试集，再做任何 fit**：所有学习参数的步骤（缩放/编码/填补/PCA/特征选择）都只在训练集上 fit
2. **CV 中用 Pipeline 包裹**：GridSearchCV 会自动在每折训练集上重新 fit 预处理器，确保验证折严格隔离

> TargetEncoder 的陷阱更深：`fit(X, y).transform(X)` 与 `fit_transform(X, y)` 结果不同——后者用交叉拟合（cross-fitting）防泄漏，是推荐用法。这类细节只有用 Pipeline 才能正确处理。

## 下一步

- [核心技术与编码策略](./guide-line.md)：七大主题深析 + 三大工具对比 + 编码策略决策表 + 特征选择
- [参考](./reference.md)：API 速查 + 编码策略矩阵 + 官方资源
