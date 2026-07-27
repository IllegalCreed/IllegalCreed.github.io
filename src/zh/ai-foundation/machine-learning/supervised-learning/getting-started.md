---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 scikit-learn 1.9.0 官方文档（supervised_learning.html + statistical_inference 教程）+ model_selection API 编写，对照 scikit-learn 当前版本行为

## 速查

- **定义**：带标签训练数据 `(X, y)` → 学映射 `f` → 预测新样本 `ŷ = f(x')`
- **两大任务**：**分类**（y 离散类别）vs **回归**（y 连续数值）——评估指标、算法选型完全不同
- **scikit-learn 17 算法族**：线性模型 / LDA·QDA / 核岭回归 / SVM / SGD / 最近邻 / 高斯过程 / 交叉分解 / 朴素贝叶斯 / 决策树 / 集成方法 / 多类多输出 / 特征选择 / 半监督 / 等渗回归 / 概率校准 / 神经网络
- **统一 API**：`estimator.fit(X, y)` 训练 → `estimator.predict(X)` 预测 → `estimator.score(X, y)` 评分 → `estimator.transform(X)` 转换
- **训练/测试划分**：`train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)` —— `random_state` 固定保复现，`stratify=y` 保类别比例
- **交叉验证**：`KFold`（通用）/ `StratifiedKFold`（分类必用，保每折类别比例）/ `cross_val_score` 一行评估
- **过拟合 vs 欠拟合**：训练好测试差 = 过拟合（加数据/正则化/降复杂度）；训练差测试差 = 欠拟合（加特征/换强模型/降正则化）
- **标准化防泄漏**：`StandardScaler` **只在 X_train 上 `fit_transform`**，对 X_test 只 `transform` —— 全量 fit 会泄漏测试集分布
- **分类指标**：`accuracy`（平衡数据）/ `precision`·`recall`·`f1`（不平衡数据必看）
- **回归指标**：`MSE`/`RMSE`（误差大小）/ `R²`（方差解释率，越接近 1 越好）
- **超参调优**：`GridSearchCV`（小空间穷举）/ `RandomizedSearchCV`（大空间采样）

## 监督学习是什么

监督学习（Supervised Learning）的「监督」二字来自**标签（label）**——训练数据里每个样本都带「正确答案」，算法的任务是学出从输入特征到答案的映射，从而对新输入给出预测。

- **输入**：特征矩阵 `X`（shape: `[n_samples, n_features]`）+ 标签向量 `y`（shape: `[n_samples]`）
- **输出**：学到的模型 `f`，可对新样本 `x'` 预测 `ŷ = f(x')`
- **监督信号**：标签 `y` 就是「老师」——每次预测错了，用 `y` 计算损失并修正模型

> 对比无监督学习（只有 `X` 无 `y`，发现数据内在结构如聚类）和强化学习（无固定标签，靠环境奖励信号试错学习）。

### 分类 vs 回归：看标签类型

| 维度 | 分类（Classification） | 回归（Regression） |
| --- | --- | --- |
| **标签 y** | 离散类别（垃圾邮件/正常、猫/狗/鸟） | 连续数值（房价 350 万、温度 23.5℃） |
| **输出空间** | 有限离散集合 | 实数域（或区间） |
| **决策方式** | 决策边界划分区域 | 拟合一条曲线/超平面 |
| **评估指标** | accuracy / precision / recall / F1 | MSE / RMSE / MAE / R² |
| **典型算法** | 逻辑回归、SVM、随机森林分类器 | 线性回归、岭回归、梯度提升回归器 |
| **业务例子** | 垃圾邮件识别、疾病诊断、图像分类 | 房价预测、销量预测、温度预测 |

> 判据：**问自己「标签是数还是类」**。是类别→分类；是数值且取值连续→回归。注意有序类别（评分 1-5 星）边界模糊，既可当回归也可当分类，看业务目标。

## scikit-learn 统一 API

scikit-learn 把所有监督学习算法抽象成统一的「估计器（Estimator）」接口，这是它生态繁荣的根基：

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# 1. 实例化（传超参数，此时还不接触数据）
clf = LogisticRegression(C=1.0, max_iter=1000)

# 2. 训练：fit(X, y) —— 所有估计器统一的训练入口
clf.fit(X_train, y_train)

# 3. 预测：predict(X) —— 返回预测标签
y_pred = clf.predict(X_test)

# 4. 评分：score(X, y) —— 分类返回准确率，回归返回 R²
acc = clf.score(X_test, y_test)

# 5. 概率（分类特有）：predict_proba(X) —— 返回每类概率
y_proba = clf.predict_proba(X_test)  # shape: [n_samples, n_classes]
```

> 换算法只需改 import 和实例化那一行——`fit/predict/score` 完全一致。这是 sklearn 「算法即换插件」的设计哲学，也是 Pipeline、GridSearchCV 能通用的前提。

## 第一个监督学习（鸢尾花分类 15 行）

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 1. 加载数据（sklearn 自带经典数据集）
X, y = load_iris(return_X_y=True)

# 2. 划分训练/测试集（test_size=0.2，stratify 保类别比例）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 3. 特征标准化（只在训练集 fit，防数据泄漏）
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)  # 用训练集的均值方差转换测试集

# 4. 训练随机森林
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train_scaled, y_train)

# 5. 预测 + 评估
y_pred = clf.predict(X_test_scaled)
print(classification_report(y_test, y_pred))
# 输出每个类的 precision / recall / f1 / support
```

> 鸢尾花（Iris）是监督学习的「Hello World」——150 样本、4 特征、3 类别。换数据只需改第 6 行的 `load_iris()` 为自己的 `X, y`。

## 训练集 vs 测试集：为何必须划分

监督学习的终极目标是**泛化（Generalization）**——模型要对**没见过的新数据**预测准，而非对训练数据背得熟。如果用全部数据训练又用全部数据评估，模型可以「死记硬背」拿到虚高分数，但面对新数据一塌糊涂。

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 测试集占 20%（常见 0.2-0.3）
    random_state=42,      # 固定随机种子，保证每次划分一致（复现性）
    stratify=y,           # 分层抽样：训练/测试集类别比例与原数据一致
)
```

**关键参数**：

- `test_size`：测试集比例（浮点）或绝对样本数（整数），默认 0.25
- `random_state`：随机种子。设固定整数（如 42）保证每次运行划分一致——**实验可复现的关键**
- `stratify`：分层抽样。分类任务**必设 `stratify=y`**，否则类别不平衡时测试集可能缺某类

> 三层划分：数据多时用「训练/验证/测试」三份——训练集训模型、验证集调超参、测试集只在中终点评一次。测试集碰得越多，结果越不可信。

## 过拟合 vs 欠拟合

监督学习头号敌人是**过拟合（Overfitting）**——模型复杂度超过数据信息量，把训练集的噪声当规律学了。

| 现象 | 训练集表现 | 测试集表现 | 诊断 | 应对 |
| --- | --- | --- | --- | --- |
| **欠拟合** | 差 | 差 | 模型太简单/特征不足 | 加特征、换更强模型、降正则化 |
| **正好** | 好 | 好 | — | — |
| **过拟合** | 极好 | 差 | 模型太复杂/数据太少 | 加数据、加正则化、降复杂度、交叉验证 |

**学习曲线诊断**：画「训练集大小 vs 训练/验证分数」曲线——两条线差距大=过拟合；两条线都很低=欠拟合。

**过拟合应对手段**：

1. **更多训练数据**：最根本的解法，数据量够大时复杂模型也不易过拟合
2. **正则化（L1/L2）**：在损失函数加惩罚项，限制参数大小。L1（Lasso）产生稀疏解可做特征选择，L2（Ridge）平滑参数防震荡
3. **降低模型复杂度**：决策树剪枝（`max_depth`）、SVM 调大 `C` 边界、随机森林减树深
4. **交叉验证**：用验证集而非测试集指导调参，避免「调到测试集上」的隐性过拟合
5. **Dropout/早停**：神经网络特有（深度学习叶详述）

## 下一步

- [核心算法族与评估体系](./guide-line.md)：17 算法族选讲 + 评估指标深析 + 交叉验证 + 超参调优
- [参考](./reference.md)：算法选型决策表 + API 速查 + 经典数据集 + 官方资源
