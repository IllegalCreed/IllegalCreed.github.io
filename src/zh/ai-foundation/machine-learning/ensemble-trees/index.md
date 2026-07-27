---
layout: doc
---

# 集成学习与树模型

集成学习（Ensemble Learning）的核心思想是「三个臭皮匠，顶个诸葛亮」——把多个弱学习器组合成一个强学习器，比任何单一模型都更准确、更稳健。它的两大主线是 **Bagging**（并行训练多棵树，对数据/特征采样后**平均**，代表是随机森林，主要**降低方差**防过拟合）与 **Boosting**（串行训练多棵树，每一棵**修正前一棵的错误**，代表是 AdaBoost/GBDT，主要**降低偏差**提准确率），再加 **Stacking**（堆叠异质模型，用一个元模型学如何组合）。树模型是集成的几乎唯一基学习器：决策树（CART）以递归二分特征空间形成 if-else 规则，可解释性最强但单棵树极易过拟合，集成正好弥补这一点。现代 Boosting 三巨头——**XGBoost**（二阶泰勒展开+正则化剪枝）、**LightGBM**（直方图+leaf-wise 生长+GOSS/EFB）、**CatBoost**（Ordered Boosting+对称树+原生类别特征）——是表格数据（结构化数据）打榜的事实标准，常年霸榜 Kaggle。理论基石是**偏差-方差分解**：泛化误差 = 偏差² + 方差 + 噪声，Bagging 降方差、Boosting 降偏差。理解偏差-方差权衡，是选型与调参的底层逻辑。

## 评价

**优点**

- **准确率上限高**：GBDT 系（XGBoost/LightGBM/CatBoost）在表格数据上是公认最强基线，很多业务问题它们就是最优解
- **鲁棒性强**：树模型天然处理混合类型特征、对缺失值鲁棒、对异常值不敏感、无需特征标准化（基于阈值分裂而非距离）
- **可解释性可调**：单棵决策树可直接可视化规则；集成后可用特征重要性、SHAP、permutation importance 解释全局与局部贡献
- **Bagging 几乎免调参**：随机森林默认参数就能用，`n_estimators` 调大即更稳，是极佳的强基线
- **生态成熟**：scikit-learn 内置 ensemble 全家桶，XGBoost/LightGBM/CatBoost 都提供 sklearn API（`XGBClassifier.fit/predict`），无缝接入 Pipeline
- **支持类别特征**：LightGBM/CatBoost 原生处理类别特征，无需 OneHot，避免高基数特征维度爆炸

**缺点**

- **Boosting 调参复杂**：GBDT 系有 learning_rate/n_estimators/max_depth/subsample/colsample/正则化等十几个关键参数，调参成本高
- **训练慢于线性模型**：尤其串行 Boosting 无法并行（Bagging 可并行），大数据集训练时间显著长于逻辑回归
- **内存占用大**：多棵树存储成本高，随机森林上千棵树模型体积可达数百 MB
- **高维稀疏特征不擅长**：树模型在文本/词袋等极稀疏高维场景表现差，不如线性模型/神经网络
- **外推能力弱**：树模型只能预测训练集特征取值范围内的值（叶子节点固定输出），回归任务遇到新范围直接失败
- **可解释性随集成退化**：随机森林上千棵树的内部逻辑无法直接可视化，只能靠特征重要性近似解释

## 文档地址

- [scikit-learn 集成方法（ensemble）](https://scikit-learn.org/stable/modules/ensemble.html)
- [XGBoost 官方文档](https://xgboost.readthedocs.io/en/stable/)
- [LightGBM 官方文档](https://lightgbm.readthedocs.io/en/latest/)
- [CatBoost 官方文档](https://catboost.ai/docs/)
- [scikit-learn 决策树（CART）](https://scikit-learn.org/stable/modules/tree.html)

## GitHub地址

[scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn)

[dmlc/xgboost](https://github.com/dmlc/xgboost)

[microsoft/LightGBM](https://github.com/microsoft/LightGBM)

## 幻灯片地址

<a href="/SlideStack/ensemble-trees-slide/" target="_blank">集成学习与树模型</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">集成学习与树模型测试题</a>
