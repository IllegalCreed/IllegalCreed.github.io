---
layout: doc
---

# 监督学习

监督学习（Supervised Learning）是机器学习中最成熟、应用最广的范式：给定一组带**标签**的训练样本 `(X, y)`，学习一个从特征 `X` 到标签 `y` 的映射函数 `f`，使新样本 `x'` 能被预测为 `ŷ = f(x')`。它按标签类型分为两大任务——**分类**（离散类别，如垃圾邮件识别、图像识别）与**回归**（连续数值，如房价预测、温度预测）。scikit-learn 是 Python 生态的事实标准库，统一所有估计器为 `fit(X, y) → predict(X)` 的 API 契约，覆盖线性模型、SVM、最近邻、决策树、集成方法（随机森林/梯度提升）、朴素贝叶斯、神经网络等 17 大算法族。监督学习的工程核心不在选「最强算法」，而在**数据质量、特征工程、防止过拟合、合理评估**四件事：用 `train_test_split` 划分训练/测试集、用交叉验证评估泛化能力、用 `StandardScaler` 做特征标准化（且只能在训练集上 fit 以防数据泄漏）、用 `GridSearchCV` 调超参数。**过拟合**（训练好测试差）是监督学习头号敌人，应对手段包括更多数据、正则化（L1/L2）、降低模型复杂度、交叉验证。它是后续深度学习、强化学习等所有有监督训练范式的概念地基。

## 评价

**优点**

- **目标明确、可评估**：有标签即有 ground truth，准确率/精确率/召回率/F1/MSE/R² 等指标可直接量化模型好坏，调优方向清晰
- **算法生态最成熟**：scikit-learn 统一 API，17 大算法族开箱即用，sklearn/XGBoost/LightGBM 三件套覆盖绝大多数表格数据任务
- **可解释性强**：线性模型系数、决策树路径、特征重要性都能给出「为什么这样预测」的依据，满足合规审计
- **数据效率高**：相比深度学习，传统监督学习（SVM/树模型）在小样本（几百到几千条）场景仍有效，不需海量数据
- **任务边界清晰**：分类与回归的输出空间明确，业务对接直接（预测类别→决策、预测数值→阈值判断）

**缺点**

- **依赖人工标注**：标签质量决定模型上限，标注成本高（医学影像、专业领域），错误标签（label noise）会直接拖累性能
- **过拟合风险高**：模型复杂度超过数据信息量时，会记住训练集噪声而非学到规律，测试集泛化崩溃
- **特征工程重**：传统算法（非深度学习）的效果强依赖人工特征构造，领域知识门槛高
- **标签空间固定**：训练时的类别集合固定，新类别出现需重新标注+重训（开放世界问题）
- **不能发现未知结构**：只能学已标注的映射，无法像无监督学习那样发现数据内在聚类/分布

## 文档地址

- [scikit-learn 官方监督学习指南](https://scikit-learn.org/stable/supervised_learning.html)
- [scikit-learn 统计推断教程（监督学习篇）](https://scikit-learn.org/stable/tutorial/statistical_inference/supervised_learning.html)
- [scikit-learn 模型选择（交叉验证/网格搜索）](https://scikit-learn.org/stable/modules/cross_validation.html)
- [scikit-learn 评估指标](https://scikit-learn.org/stable/modules/model_evaluation.html)

## GitHub地址

[scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn)

## 幻灯片地址

<a href="/SlideStack/supervised-learning-slide/" target="_blank">监督学习</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">监督学习测试题</a>
