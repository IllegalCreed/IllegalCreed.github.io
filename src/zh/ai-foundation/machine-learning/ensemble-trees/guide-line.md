---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 scikit-learn 1.9.0 ensemble 模块 + XGBoost 2.x + LightGBM 4.x + CatBoost 官方文档编写

## 速查

- **选型一句话**：表格数据打榜 → GBDT 三巨头（XGBoost/LightGBM/CatBoost）；强基线免调参 → 随机森林；可解释性 → 单棵决策树/线性模型
- **随机森林关键参**：`n_estimators`（树数，大更稳）/ `max_features`（分类默认 'sqrt'，回归默认 1.0）/ `max_depth`（限制防过拟合）/ `oob_score`（袋外评估）
- **GBDT 关键参**：`learning_rate`（shrinkage，0.01-0.1，越小越准但需更多树）/ `n_estimators`（树数）/ `max_depth`（单树深度，3-8）/ `subsample`（行采样，随机梯度提升）
- **XGBoost 创新**：目标函数用**二阶泰勒展开**（一阶梯度 g + 二阶 Hessian h）；正则化 `γ·T + ½λΣw²`（γ 惩罚叶节点数 = 自带剪枝，λ 是 L2）；内置缺失值处理（学默认方向）
- **LightGBM 创新**：**直方图算法**（连续值分桶，分裂复杂度从 O(#data) 降到 O(#bins)）；**leaf-wise** 生长（选增益最大的叶子扩，比 level-wise 更深但更准）；GOSS（按梯度采样）+ EFB（互斥特征捆绑）降维加速
- **CatBoost 创新**：**Ordered Boosting**（解决 target leakage）；**对称树**（每层用相同分裂条件，更快更抗噪）；原生处理类别特征（target statistics 编码）
- **Stacking**：训多个异质模型（如 RF+SVM+GBDT），把它们的预测作为新特征喂给元模型（如 LogisticRegression）学如何组合
- **AdaBoost**：样本加权 + 弱学习器加权投票；错分样本权重↑，对的↓；sklearn 默认 base 是 `DecisionTreeClassifier(max_depth=1)`（decision stump）
- **特征重要性三件套**：`feature_importances_`（基于不纯度下降，偏袒高基数特征）/ **SHAP**（博弈论 Shapley 值，最严谨）/ **permutation importance**（打乱特征看性能下降，模型无关）
- **Boosting 过拟合信号**：验证集指标先降后升 = 过拟合，应减小 `learning_rate` / 减小 `max_depth` / 加 `subsample` 正则 / 早停

## Bagging 与随机森林深析

### Bagging 元估计器

`BaggingClassifier` 允许任意基估计器（如 KNN、逻辑回归）做 Bagging，随机森林是它在决策树上的特化版本。

```python
from sklearn.ensemble import BaggingClassifier
from sklearn.neighbors import KNeighborsClassifier

# 任意基估计器 + Bagging
bag = BaggingClassifier(
    estimator=KNeighborsClassifier(),
    n_estimators=10,
    max_samples=0.8,        # 每个基学习器用 80% 样本
    max_features=0.8,       # 每个基学习器用 80% 特征
    bootstrap=True,         # 样本有放回采样
    bootstrap_features=False,  # 特征不放回
    n_jobs=-1,
)
```

### 随机森林

随机森林 = Bagging + 决策树 + **每次分裂时随机选特征子集**。这第三点是它区别于普通 Bagging 的关键。

```python
from sklearn.ensemble import RandomForestClassifier

clf = RandomForestClassifier(
    n_estimators=100,        # 树数，越多越稳（边际递减）
    criterion='gini',        # 'gini' / 'entropy'
    max_features='sqrt',     # 分类默认 sqrt(n_features)，回归默认 1.0(全部)
    max_depth=None,          # 不限深度——随机森林靠平均降方差，不需剪枝
    min_samples_split=2,
    min_samples_leaf=1,
    bootstrap=True,          # 默认 True，bootstrap 采样
    oob_score=False,         # True 开启袋外评估
    n_jobs=-1,               # 并行训练
    class_weight=None,       # 'balanced' 处理类别不平衡
)
```

**关键参数解读**：

| 参数 | 作用 | 调参方向 |
| --- | --- | --- |
| `n_estimators` | 树的数量 | 越大越稳，但边际递减；100-1000 常用 |
| `max_features` | 每次分裂考虑的特征数 | 小→更多随机性→降方差；分类用 'sqrt'，回归用 1.0 |
| `max_depth` | 树最大深度 | 随机森林通常不限制；但限深度能加速 |
| `oob_score` | 袋外评估 | 数据少时设 True，免费验证集 |

> **随机森林 vs Bagging 的区别**：随机森林**每个节点分裂时**都随机选特征子集（`max_features`），而普通 Bagging 是基学习器整体看全部特征。这让随机森林的树之间更多样化，方差更低。

**为什么随机森林不需剪枝**：单棵深树方差高（过拟合），但随机森林靠「多棵深树平均」降方差——这正是 Bagging 的核心。所以随机森林默认 `max_depth=None`，反而靠增加随机性降方差。

## Boosting 家族深析

### AdaBoost

AdaBoost（Adaptive Boosting）通过**样本加权**让后续弱学习器关注前面分错的样本：

```python
from sklearn.ensemble import AdaBoostClassifier

clf = AdaBoostClassifier(
    estimator=None,          # 默认 DecisionTreeClassifier(max_depth=1) = decision stump
    n_estimators=50,         # 弱学习器数量
    learning_rate=1.0,       # 弱学习器贡献的缩放因子
    algorithm='SAMME',       # 1.6 起默认 SAMME；SAMME.R（real）已废弃
)
```

**机制**：每一轮——①训练弱学习器 → ②计算错误率 → ③提高错分样本权重、降低正确样本权重 → ④给弱学习器本身赋权（准确率高的权重大）→ 最终加权投票。

> AdaBoost 对噪声和异常值敏感——错分样本权重被反复放大，离群点会拖累整个集成。GBDT 用梯度残差替代样本加权，对噪声更鲁棒。

### GBDT（Gradient Boosting Decision Tree）

GBDT 用**负梯度（残差）**作为下一棵树的拟合目标，可套用任意可微损失：

```python
from sklearn.ensemble import GradientBoostingClassifier

clf = GradientBoostingClassifier(
    loss='log_loss',         # 'log_loss'(默认) / 'exponential'(= AdaBoost)
    learning_rate=0.1,       # shrinkage，每棵树贡献乘以 lr；越小越准但需更多树
    n_estimators=100,        # 树数（boosting 轮数）
    max_depth=3,             # 单棵树深度，GBDT 通常用浅树（3-8）
    subsample=1.0,           # <1.0 时为随机梯度提升，降方差
    criterion='friedman_mse',
)
```

**learning_rate 与 n_estimators 的权衡**：

| 策略 | learning_rate | n_estimators | 效果 |
| --- | --- | --- | --- |
| 快速粗调 | 0.1-0.3 | 100-300 | 训练快，但准确率略低 |
| **推荐** | 0.05-0.1 | 500-2000 | 准确率与训练时间的最佳平衡 |
| 极致打榜 | 0.01 | 5000-20000 | 最准但极慢，需早停防过拟合 |

> 经验法则：**learning_rate × n_estimators ≈ 常数**。把 lr 减半、n_estimators 翻倍通常能小幅提升准确率。但树太多会过拟合——用早停（early stopping）监控验证集指标自动决定最优轮数。

**回归损失函数**（`GradientBoostingRegressor`）：`squared_error`（默认，对异常值敏感）/ `absolute_error`（L1，对异常值鲁棒）/ `huber`（两者折中）/ `quantile`（分位数回归）。

### Stacking（堆叠）

Stacking 用一个**元学习器（meta-learner / final_estimator）**学习如何组合多个异质基模型的预测：

```python
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier

stack = StackingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(n_estimators=100)),
        ('svm', SVC(probability=True)),
    ],
    final_estimator=LogisticRegression(),  # 元学习器，学如何组合基模型
    stack_method='predict_proba',          # 用概率（soft）而非硬标签作为元特征
    cv=5,                                  # 用交叉验证生成基模型的训练标签，防泄漏
)
```

**关键点**：基模型的训练标签必须用**交叉验证生成**（`cv` 参数），否则基模型在自己的训练集上预测会很准，元学习器学到的组合方式会有偏。Stacking 默认用 5 折 CV——把训练集分 5 份，每份用其余 4 份训练基模型后预测，拼成「干净」的元特征。

## 现代 Boosting 三巨头

生产实战中 sklearn 的 `GradientBoostingClassifier` 只是基线（慢、不支持缺失值/类别特征），**真打榜用 XGBoost/LightGBM/CatBoost**。三者都提供 sklearn API（`fit/predict`），可直接进 Pipeline。

### XGBoost

XGBoost 的核心创新是**目标函数用二阶泰勒展开** + **显式正则化**。

**目标函数**：`Obj = 训练损失 + 正则化`，其中正则化项 `Ω = γ·T + ½λΣwⱼ²`（T 是叶节点数，wⱼ 是叶权重）。新树在第 t 轮的损失用一阶梯度 `gᵢ` 和二阶 Hessian `hᵢ` 泰勒展开近似：

```
Gain = ½[ G_L²/(H_L+λ) + G_R²/(H_R+λ) - (G_L+G_R)²/(H_L+H_R+λ) ] - γ
```

其中 `G`、`H` 是梯度和与 Hessian 和。**`-γ` 项是内置剪枝**——分裂增益必须超过 γ 才保留该分裂。

```python
import xgboost as xgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

clf = xgb.XGBClassifier(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,              # 单棵树深度，XGBoost 默认 6
    min_child_weight=1,       # 叶节点最小 Hessian 和，大→更保守
    subsample=0.8,            # 每棵树采样 80% 行
    colsample_bytree=0.8,     # 每棵树采样 80% 列
    gamma=0,                  # 分裂最小增益（正则剪枝），大→更保守
    reg_alpha=0,              # L1 正则
    reg_lambda=1,             # L2 正则（默认 1）
    objective='binary:logistic',
    eval_metric='logloss',
    early_stopping_rounds=20, # 早停：20 轮验证集无提升则停止
    tree_method='hist',       # 直方图（2.0 起默认），比 'exact' 快得多
    random_state=42,
)
clf.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
```

**关键参数对照表**：

| 参数 | 含义 | 调参经验 |
| --- | --- | --- |
| `eta`/`learning_rate` | 步长缩放（shrinkage） | 0.01-0.3，小需更多树 |
| `max_depth` | 单棵树最大深度 | 3-10，默认 6；大→复杂易过拟合 |
| `min_child_weight` | 叶节点最小 Hessian 和 | 大→更保守防过拟合 |
| `gamma` | 分裂最小增益（剪枝阈值） | 0-5，大→更保守 |
| `subsample` | 每棵树行采样比 | 0.5-1.0 |
| `colsample_bytree` | 每棵树列采样比 | 0.5-1.0 |
| `reg_alpha`/`reg_lambda` | L1/L2 正则 | 防过拟合 |
| `scale_pos_weight` | 正样本权重（处理不平衡） | 负/正样本数比 |

> **二阶展开的意义**：传统 GBDT 只用一阶梯度（残差），XGBoost 用二阶（Hessian）能更精准地逼近真实最优，收敛更快。这也让 XGBoost 优化任何可微损失都用同一套求解器（只需提供 g 和 h）。

### LightGBM

LightGBM（微软出品）主打**极致速度**，三大核心创新：

1. **直方图算法（Histogram）**：把连续特征分桶成离散 bin，分裂时只需遍历 bin 而非所有取值，复杂度从 `O(#data)` 降到 `O(#bins)`；且用直方图相减（兄弟叶子直方图 = 父 - 当前）进一步加速。
2. **Leaf-wise 生长**：每次选**增益最大的叶子**继续分裂（而非 level-wise 的逐层），在相同叶节点数下损失更低。但容易长出深树，小数据上易过拟合——需 `num_leaves` 或 `max_depth` 限制。
3. **GOSS（梯度单边采样）+ EFB（互斥特征捆绑）**：GOSS 保留梯度大的样本（信息量大），随机采样梯度小的样本；EFB 把稀疏特征空间中互斥（很少同时非零）的特征捆绑成一个，降维。

```python
import lightgbm as lgb

clf = lgb.LGBMClassifier(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=31,            # 最大叶节点数，主控复杂度（不是 max_depth）
    max_depth=-1,             # 不限，由 num_leaves 控制
    min_data_in_leaf=20,      # 叶节点最小样本数
    feature_fraction=0.8,     # 列采样（等价 colsample_bytree）
    bagging_fraction=0.8,     # 行采样
    bagging_freq=5,           # 每 5 轮重采样一次
    reg_lambda=1.0,
    objective='binary',
    metric='binary_logloss',
    random_state=42,
)
clf.fit(
    X_tr, y_tr,
    eval_set=[(X_te, y_te)],
    callbacks=[lgb.early_stopping(20), lgb.log_evaluation(0)],
)
```

> **LightGBM vs XGBoost 选型**：LightGBM 训练快 3-5 倍、内存省，是大数据集（>10 万样本）首选；XGBoost 生态更成熟（GPU/分布式/移动端），中小数据集上两者精度接近。Leaf-wise 让 LightGBM 在小数据上更易过拟合，需谨慎调 `num_leaves`。

### CatBoost

CatBoost（Yandex 出品）主打**类别特征处理** + **抗 target leakage**，核心创新：

1. **Ordered Boosting**：传统 GBDT 在全量数据上算残差会有 target leakage（用当前样本的标签算的残差又用来训练预测它自己）。CatBoost 用排列（permutation）的方式，对每个样本只用「排在它前面」的样本算残差，从根上消除泄漏。
2. **对称树（Oblivious Tree）**：同一层所有节点用**相同的分裂条件**（特征 + 阈值），形成对称结构。这使推断更快、更抗噪，但表达力略弱。
3. **原生类别特征**：用 target statistics（类别的目标均值）编码类别特征，且用 Ordered 方式避免泄漏，无需手动 OneHot。

```python
from catboost import CatBoostClassifier

clf = CatBoostClassifier(
    iterations=500,           # boosting 轮数（等价 n_estimators）
    learning_rate=0.05,
    depth=6,                 # 树深度（对称树，每层同分裂）
    l2_leaf_reg=3.0,         # L2 正则
    loss_function='Logloss',
    eval_metric='Logloss',
    cat_features=['category_col_name'],  # 指定类别列，自动 target encoding
    random_seed=42,
    early_stopping_rounds=20,
)
clf.fit(X_tr, y_tr, eval_set=(X_te, y_te), verbose=False)
```

> **CatBoost 选型**：数据集含大量类别特征（如电商用户行为、广告 CTR）时 CatBoost 几乎免调参就赢；纯数值数据三者精度接近。CatBoost 训练比 LightGBM 慢但比 sklearn GBDT 快。

## 特征重要性三件套

集成训练完后，「哪些特征重要」是核心可解释性问题。三种方法各有优劣：

| 方法 | 原理 | 优点 | 缺点 |
| --- | --- | --- | --- |
| `feature_importances_` | 累加该特征在所有分裂中带来的不纯度下降 | 训练时自动算，零成本 | **偏袒高基数特征**（连续变量重要性虚高） |
| **permutation importance** | 打乱某特征取值看模型性能下降多少 | 模型无关、直观 | 计算慢（每个特征要重新预测） |
| **SHAP**（Shapley 值） | 博弈论 Shapley 值，公平分配每个特征对预测的贡献 | 最严谨、支持局部解释（单样本） | 计算开销大（TreeExplainer 加速） |

```python
import shap
explainer = shap.TreeExplainer(clf)        # 树模型专用，快
shap_values = explainer.shap_values(X_te)
shap.summary_plot(shap_values, X_te)       # 全局特征重要性 + 影响方向
shap.force_plot(explainer.expected_value, shap_values[0], X_te.iloc[0])  # 单样本解释
```

## 反模式（生产坑）

1. **随机森林剪枝**：随机森林靠多棵深树平均降方差，设小 `max_depth` 反而损害性能——除非为了加速，否则不要剪。
2. **Boosting 不用早停**：`n_estimators=1000` 固定训练，很容易过拟合。应配合 `early_stopping_rounds`，让验证集指标决定最优轮数。
3. **learning_rate 不调只调 n_estimators**：默认 lr=0.1 时增 n_estimators 边际收益递减。正确做法是 lr 降到 0.01-0.05 再加大 n_estimators + 早停。
4. **GBDT 跑高维稀疏文本特征**：树模型在词袋几万维稀疏特征上表现远不如线性模型/神经网络，应换算法。
5. **忽视样本权重处理不平衡**：Boosting 默认对多数类过拟合，应用 `scale_pos_weight`（XGBoost）/ `class_weight='balanced'`（sklearn）或调整采样。
6. **树模型做回归却遇外推需求**：树模型叶子输出固定，无法预测训练范围外的新值——若需外推（如时序预测未来），改用线性模型/指数平滑。

## 下一步

- [参考](./reference.md)：算法选型决策表 + API 速查 + 偏差-方差权衡矩阵
