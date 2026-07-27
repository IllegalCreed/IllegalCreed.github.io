---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 scikit-learn 1.9.0 + feature-engine 1.x + category_encoders 官方文档编写

## 速查

- **数值缩放选型**：默认 `StandardScaler`；有异常值用 `RobustScaler`；要固定范围 [0,1] 用 `MinMaxScaler`；稀疏数据用 `MaxAbsScaler`（不动零）
- **树模型免缩放**：随机森林/GBDT 基于阈值分裂不依赖量纲，缩放无意义；KNN/SVM/SGD/神经网络必须缩放
- **偏态变换**：正偏态（右尾长）用 `np.log1p` 或 `PowerTransformer(method='box-cox')`（仅正数）/ `'yeo-johnson'`（含 0 和负数）
- **分箱策略**：`KBinsDiscretizer(strategy='uniform')`（等宽）/ `'quantile'`（等频，抗异常值）/ `'kmeans'`（聚类）
- **类别编码决策**：低基数（<10 类）→ OneHot；高基数 → TargetEncoder/CatBoostEncoder；有序类别 → OrdinalEncoder；无界/在线学习 → HashingEncoder
- **TargetEncoder 防泄漏**：sklearn 1.3+ 的 TargetEncoder 用 `fit_transform`（交叉拟合）而非 `fit().transform()`；平滑参数 `smooth='auto'` 自动平衡类别均值与全局均值
- **缺失值策略**：数值用 median（抗异常值）/ categorical 用 most_frequent 或 'missing' 标志位；高缺失率加 `AddMissingIndicator` 保留「缺失本身是信息」
- **时间特征三件套**：拆分（年/月/日/星期/小时）+ 周期编码（sin/cos 处理 23→0 边界）+ 衍生（距今天数/是否周末/是否节假日）
- **特征选择三类**：Filter（`SelectKBest`+chi2/f_classif/mutual_info）/ Wrapper（`RFE`/`SequentialFeatureSelector`）/ Embedded（`SelectFromModel`+L1/树重要性）
- **特征交叉**：`PolynomialFeatures(interaction_only=True)` 自动生成交互；业务知识手工构造（如 价格×销量=收入）往往更强
- **三大工具分工**：scikit-learn preprocessing（通用、统一 API）/ feature-engine（按列名、可读性强）/ category_encoders（编码最全）

## 数值特征处理

### 缩放（Scaling）

| 工具 | 公式/机制 | 适用 | 注意 |
| --- | --- | --- | --- |
| **StandardScaler** | `(x-μ)/σ`，均值 0 标准差 1 | 默认首选，大多数算法 | 不能处理稀疏（with_mean=True 会破坏稀疏） |
| **MinMaxScaler** | `(x-min)/(max-min)` → [0,1] | 需固定范围（如图像像素、神经网络） | 对异常值极敏感（被压缩） |
| **MaxAbsScaler** | `x/max|x|` → [-1,1] | 稀疏数据（不破坏零） | 仍受异常值影响 |
| **RobustScaler** | `(x-中位数)/IQR`，用中位数和四分位距 | 有异常值的数据 | 不能处理稀疏 |
| **Normalizer** | 每行（样本）归一化到单位范数 | 文本向量、按样本归一 | 注意：是按行不是按列 |

```python
from sklearn.preprocessing import StandardScaler, RobustScaler

scaler = RobustScaler(quantile_range=(25, 75))  # 用 IQR 抗异常值
X_scaled = scaler.fit_transform(X_train)
```

> **谁必须缩放**：KNN（基于距离）、SVM（核函数）、SGD（梯度对量纲敏感）、神经网络。**谁不需要**：树模型（随机森林/GBDT，基于阈值分裂）。线性模型（逻辑回归）虽不强制，但缩放后收敛更快、正则化更公平。

### 变换（Transformation）

偏态分布会让线性模型和神经网络学得差。变换让分布更接近正态：

```python
import numpy as np
from sklearn.preprocessing import PowerTransformer, QuantileTransformer, FunctionTransformer

# 对数变换：处理右偏（如收入、计数）。log1p 处理含 0 的数据
log_tf = FunctionTransformer(func=np.log1p, inverse_func=np.expm1)

# Box-Cox：仅适用正数；Yeo-Johnson：含 0 和负数也能用
power_tf = PowerTransformer(method='yeo-johnson', standardize=True)  # 自动选最优 λ

# 分位数变换：强制映射到均匀/正态，对极端异常值鲁棒
quantile_tf = QuantileTransformer(output_distribution='normal', n_quantiles=100)
```

> Box-Cox 要求严格正数，Yeo-Johnson 是它的推广（支持 0 和负数），是更通用的选择。PowerTransformer 会在内部用最大似然估计最优变换参数 λ，并默认 standardize=True 变换后再标准化。

### 分箱（Binning）

把连续特征切成离散区间，让线性模型也能拟合非线性：

```python
from sklearn.preprocessing import KBinsDiscretizer

kbd = KBinsDiscretizer(
    n_bins=5,
    encode='ordinal',        # 'onehot' / 'onehot-dense' / 'ordinal'
    strategy='quantile',     # 'uniform'(等宽) / 'quantile'(等频) / 'kmeans'
)
X_binned = kbd.fit_transform(X_train[['age']])
```

**策略对比**：`uniform`（等宽）简单但对异常值敏感；`quantile`（等频）每箱样本数相等，抗异常值；`kmeans` 用聚类找自然分界，最智能但最慢。

## 类别特征编码

类别特征（字符串/枚举）必须编码成数值才能喂给模型。编码策略视基数（category 数）和有无序关系而定。

### 低基数：OneHotEncoder

```python
from sklearn.preprocessing import OneHotEncoder

ohe = OneHotEncoder(
    drop='first',            # 丢弃第一类防多重共线性（线性模型必设）
    handle_unknown='ignore', # 测试集出现新类别时全填 0（不报错）
    sparse_output=True,      # 稀疏矩阵省内存
)
X_ohe = ohe.fit_transform(X_train[['city']])
```

> `drop='first'` 对线性模型重要（避免共线性），但对树模型无意义（树不关心共线性）。`handle_unknown='ignore'` 让测试集出现训练集没有的新类别时不崩溃。

### 高基数：TargetEncoder

高基数类别（如用户ID、商品ID、邮编）用 OneHot 会维度爆炸。TargetEncoder 用「该类别的目标均值」替代：

```python
from sklearn.preprocessing import TargetEncoder   # sklearn 1.3+

te = TargetEncoder(smooth='auto')   # smooth 自动平衡类别均值与全局均值
X_te = te.fit_transform(X_train[['user_id']], y_train)  # 用 fit_transform 防泄漏
```

**防泄漏机制**：sklearn 的 TargetEncoder 用 `fit_transform`（交叉拟合 cross-fitting）防泄漏——把数据分 k 折，每折用其余 k-1 折的目标均值编码，避免「用样本自己的标签编码自己」。`fit(X,y).transform(X)` 不做交叉拟合，结果会有泄漏。**这是为什么必须用 fit_transform 的关键细节**。`smooth='auto'` 自动计算平滑因子，低频类别收缩到全局均值，高频类别更信任自身均值。

> category_encoders 库的 TargetEncoder/CatBoostEncoder/JamesSteinEncoder/GLMMEncoder 是 sklearn 的扩展，原理类似但实现细节不同，适合需要更细控制的场景。

### 有序类别：OrdinalEncoder

类别有自然顺序（如 低/中/高、差/中/好）用 OrdinalEncoder 编码为 0/1/2，保留顺序信息：

```python
from sklearn.preprocessing import OrdinalEncoder

oe = OrdinalEncoder(categories=[['low', 'medium', 'high']])  # 显式指定顺序
X_ord = oe.fit_transform(X_train[['level']])
```

> 若类别无序（如城市）误用 OrdinalEncoder 会引入虚假的数值关系（北京=0、上海=1、广州=2 暗示「北京<上海<广州」），树模型尚可容忍，线性模型会严重误导。

### 超高基数/在线学习：HashingEncoder

```python
from sklearn.feature_extraction import FeatureHasher
# 或 category_encoders.HashingEncoder
# 把类别哈希到固定维度，不维护类别表
he = HashingEncoder(n_components=64)   # 固定 64 维，不管多少类别
```

**特点**：无需维护类别映射表（适合在线学习/新类别不断出现的场景），固定维度省内存；但哈希冲突（不同类别映射到同一桶）会损失信息，且编码不可逆。

## 缺失值处理

### 填补策略

```python
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.experimental import enable_iterative_imputer  # 启用实验性
from sklearn.impute import IterativeImputer

# 1. 简单填补：数值用 median（抗异常值），类别用 most_frequent 或 constant
imp_num = SimpleImputer(strategy='median')
imp_cat = SimpleImputer(strategy='constant', fill_value='missing')

# 2. KNN 填补：用最近邻的值填补，更准但慢（O(n²)）
knn_imp = KNNImputer(n_neighbors=5)

# 3. 迭代填补：用其他特征建模预测缺失值（最准最慢）
iter_imp = IterativeImputer(max_iter=10, random_state=42)
```

**策略选型**：`median` 数值填补的首选（抗异常值，比 mean 稳）；`KNNImputer` 适合特征间相关的数据；`IterativeImputer`（类似 MICE）最准但慢，大数据集慎用。

### 保留缺失信息

```python
from feature_engine.imputation import AddMissingIndicator

# 缺失本身可能是信号（如用户不填收入可能暗示低收入）
add_flag = AddMissingIndicator(missing_only=True)  # 加 X_is_na 列
```

> 高缺失率（>30%）的列，填补值本身就失真。此时建议**加缺失指示列**（保留「是否缺失」的信息），再决定填补或直接删除该列。

## 时间特征提取

时间戳（datetime）必须拆解为模型可用的数值特征：

```python
import pandas as pd
from feature_engine.creation import CyclicalFeatures

df['date'] = pd.to_datetime(df['timestamp'])
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['dayofweek'] = df['date'].dt.dayofweek     # 0=周一
df['hour'] = df['date'].dt.hour
df['is_weekend'] = (df['dayofweek'] >= 5).astype(int)
df['days_since'] = (pd.Timestamp.now() - df['date']).dt.days

# 周期性编码：用 sin/cos 让 23点 和 0点 在空间上相邻
cyc = CyclicalFeatures(variables=['hour', 'month'], max_val={'hour': 24, 'month': 12})
df = cyc.fit_transform(df)   # 加 hour_sin, hour_cos, month_sin, month_cos
```

> **周期编码的关键**：小时 23 和 0 在时间上是相邻的，但作为数值 23 和 0 距离最远。用 `sin(2π·h/24)` 和 `cos(2π·h/24)` 编码后，相邻时刻在二维空间也相邻——这对线性模型尤为重要。CyclicalFeatures 自动做这件事。

## 文本特征

文本转向量是 NLP 的基础。传统方法（深度学习前的主流）：

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# 词袋：统计词频
cv = CountVectorizer(max_features=10000, stop_words='english', ngram_range=(1,2))

# TF-IDF：词频 × 逆文档频率，抑制高频虚词
tfidf = TfidfVectorizer(max_features=10000, ngram_range=(1,2), min_df=3)
X_text = tfidf.fit_transform(df['text'])
```

**ngram_range=(1,2)** 同时捕获单字和二字组（如 "not good"），对情感分析重要。**min_df=3** 过滤出现少于 3 次的稀有词。深度学习时代用 word2vec/BERT 做语义向量化，但 TF-IDF 在简单文本分类、作为基线依然有效。

## 特征选择

特征太多会引入噪声、过拟合、训练慢。三大类方法：

### Filter（过滤法）

不依赖模型，用统计检验打分后选 top-k：

```python
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif, chi2

# f_classif: ANOVA F 值，估线性依赖；mutual_info_classif: 任意依赖（非参数）
skb = SelectKBest(mutual_info_classif, k=20)
X_new = skb.fit_transform(X, y)
```

**打分函数**：`f_classif`（分类，估线性依赖）/ `mutual_info_classif`（分类，任意依赖，需更多样本）/ `chi2`（分类，仅非负特征如词频）/ `f_regression`（回归）。

### Wrapper（包装法）

用模型反复评估不同特征子集，最准但最慢：

```python
from sklearn.feature_selection import RFE, RFECV, SequentialFeatureSelector

# RFE: 递归剔除，用模型 feature_importances_ 或 coef_ 剔除最不重要的
rfe = RFE(estimator=RandomForestClassifier(), n_features_to_select=20)

# RFECV: 自动用 CV 找最优特征数
rfecv = RFECV(estimator=RandomForestClassifier(), cv=5)

# SFS: 贪心前向/后向选择，不需 importance（任何模型都能用）
sfs = SequentialFeatureSelector(estimator, n_features_to_select=20, direction='forward')
```

> RFE 需要模型暴露 `coef_` 或 `feature_importances_`；SFS 不需要，但更慢（每加/减一个特征都要重训评估多折 CV）。

### Embedded（嵌入法）

特征选择嵌入在模型训练中：

```python
from sklearn.feature_selection import SelectFromModel
from sklearn.linear_model import LogisticRegression

# L1 正则（Lasso）产生稀疏解，自动剔除特征（系数归零）
l1_sel = SelectFromModel(LogisticRegression(penalty='l1', solver='liblinear'))

# 树模型 feature_importances_
tree_sel = SelectFromModel(RandomForestClassifier(n_estimators=100), threshold='median')
X_new = tree_sel.fit_transform(X, y)
```

**L1 选择原理**：L1 正则化的几何特性使解落在坐标轴上，部分系数精确归零——归零的特征即被剔除。`threshold` 可设 'mean'/'median'/'1.2*mean' 控制选留多少。

## 特征交叉

```python
from sklearn.preprocessing import PolynomialFeatures

# 自动生成交互项：x1, x2 → x1, x2, x1², x1·x2, x2²
poly = PolynomialFeatures(degree=2, interaction_only=False, include_bias=False)

# 只要交互项（不要 x1²、x2²）
poly_inter = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
```

> 自动生成的交互项容易维度爆炸（degree=3 时几十维变几千维），需配合特征选择。**业务知识手工构造的交互更强**（如「价格×销量=收入」「点击数/曝光数=CTR」），这些是有业务含义的特征。

## 反模式（生产坑）

1. **全量 fit 再划分**：`scaler.fit_transform(X)` 全量算参数，测试集分布泄漏。正确：先划分，只在 X_train 上 fit。
2. **TargetEncoder 用 fit().transform()**：不做交叉拟合，泄漏严重。正确：用 `fit_transform`（sklearn TargetEncoder）或 category_encoders 的 LeaveOneOutEncoder/CatBoostEncoder。
3. **OneHot 高基数类别**：用户ID/邮编 OneHot 会产生上万维稀疏矩阵，训练慢且树模型效果差。正确：用 TargetEncoder/CatBoostEncoder。
4. **对树模型做缩放**：树模型基于阈值分裂不依赖量纲，缩放既不提升也浪费时间。正确：树模型直接喂原始数值。
5. **丢弃缺失指示**：直接填补会丢失「是否缺失」这一信号（缺失本身可能是预测信息）。正确：高缺失列加 `AddMissingIndicator` 再填补。
6. **特征选择在划分前**：`SelectKBest.fit(X)` 全量选特征会泄漏。正确：用 Pipeline 包裹让选择在 CV 折内进行。

## 下一步

- [参考](./reference.md)：API 速查 + 编码策略矩阵 + 官方资源
