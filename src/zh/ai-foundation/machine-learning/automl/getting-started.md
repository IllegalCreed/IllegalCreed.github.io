---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Auto-sklearn 0.15.0 + TPOT + H2O AutoML + FLAML + Optuna 官方文档编写，对照当前版本行为

## 速查

- **定义**：自动化 ML 流程的「人工经验」环节——超参调优/特征工程/模型选择/模型集成，让非专家能用、专家更高效
- **四大自动化环节**：超参调优（找最优参数）/ 特征工程（构造选择特征）/ 模型选择（挑算法）/ 模型集成（堆叠提升）
- **三档自动化**：超参调优库（Optuna，需手写训练）/ 端到端 AutoML（Auto-sklearn/TPOT/H2O/FLAML，一行 fit）/ NAS（搜索网络结构，AutoKeras/Google AutoML）
- **Auto-sklearn 核心**：贝叶斯优化 + 元学习 + 集成构造，sklearn 生态 drop-in 替换；`AutoSklearnClassifier(time_left_for_this_task=3600)`
- **TPOT 核心**：遗传编程优化 ML 流水线，输出可导出的 Python 代码；`TPOTClassifier(generations=100, population_size=100)`
- **H2O AutoML 核心**：企业级、自动 Stacked Ensemble、支持分布式；`H2OAutoML(max_models=20, max_runtime_secs=3600)`，`leaderboard` 排名
- **FLAML 核心**：微软、低成本快速、LightGBM/XGBoost 集成；`AutoML().fit(X, y, time_budget=60, task='classification')`
- **Optuna 核心**：Define-by-Run API，study.optimize(objective, n_trials=100)，TPESampler 默认采样器、MedianPruner 剪枝
- **NAS（神经架构搜索）**：用 RL/进化算法搜索网络结构，诞生 EfficientNet 等 SOTA，算力门槛数百 GPU-天
- **核心权衡**：自动化便利 vs 黑盒可控——适合快速基线/提速/自助，不适合打榜/合规审计/深度调优
- **统一心智**：AutoML ≠ 免数据清洗——缺失/异常/标签错误仍需人工，垃圾进垃圾出

## AutoML 是什么

AutoML 的「Auto」指把传统 ML 流程中需要数据科学家凭经验手工完成的环节自动化。一条典型 ML 流水线包括：数据清洗 → 特征工程 → 算法选择 → 超参调优 → 模型集成 → 部署，其中后四步高度依赖人工经验，是 AutoML 的主战场。

- **超参调优**：每个算法都有数十个超参（学习率、树深、正则化强度），人工调参耗时且凭直觉；AutoML 用贝叶斯优化/遗传算法系统搜索
- **模型选择**：sklearn 有 17 算法族，选哪个？Auto-sklearn/H2O 自动试遍主流算法挑最优
- **特征工程**：TPOT 自动构造特征组合、选择有用特征
- **模型集成**：H2O 自动把 GBM+XGBoost+DRF 等基模型用 Stacked Ensemble 堆叠

> AutoML 不是「替代数据科学家」，而是「把数据科学家从重复调参中解放，聚焦业务理解和高级建模」。

### 三档自动化

| 档次 | 代表 | 自动化范围 | 用户角色 |
| --- | --- | --- | --- |
| **超参调优库** | Optuna、Hyperopt、Ray Tune | 仅超参搜索 | 写训练代码，框架帮调参 |
| **端到端 AutoML** | Auto-sklearn、TPOT、H2O、FLAML | 算法+超参+特征+集成 | 给数据，一行出模型 |
| **NAS（神经架构搜索）** | AutoKeras、Google AutoML、NASNet | 连网络结构都搜 | 给数据，出架构+权重 |

> 档次越高自动化越深，但计算成本指数级上升：Optuna 几小时、AutoML 几小时到一天、NAS 几百 GPU-天。

## 第一个 AutoML（FLAML 5 行）

```python
from flaml import AutoML
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# 1. 准备数据
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. 一行训练（time_budget=60 秒，task='classification'）
automl = AutoML()
automl.fit(X_train, y_train, time_budget=60, task='classification')

# 3. 预测 + 查看
y_pred = automl.predict(X_test)
print(automl.best_estimator)   # 选中的最佳算法（如 'lgbm'）
print(automl.best_config)      # 最佳超参
print(automl.best_loss)        # 最佳损失
```

> FLAML 是入门最友好的 AutoML——API 简洁、速度快（默认集成 LightGBM/XGBoost）、微软维护。换 H2O/Auto-sklearn 思路一致，只是 API 细节不同。

## Auto-sklearn：sklearn 生态 drop-in

Auto-sklearn 是 sklearn 算法族的自动化包装，三大核心技术：**贝叶斯优化**（高效搜索超参空间）、**元学习**（从历史任务学相似数据集的初始配置）、**集成构造**（自动堆叠多模型）。

```python
from autosklearn.classification import AutoSklearnClassifier

# time_left_for_this_task 控制总搜索时间（秒），默认 1 小时
automl = AutoSklearnClassifier(
    time_left_for_this_task=120,   # 2 分钟演示（生产设 3600+）
    per_run_time_limit=30,         # 单个模型最大训练时间
    ensemble_size=50,              # 集成模型数
    metric='accuracy',
    resampling_strategy='cv',      # 交叉验证
)
automl.fit(X_train, y_train)
print(automl.leaderboard())        # 模型排行榜
print(automl.show_models())        # 详情
```

> Auto-sklearn 2.0（2020 论文）的元学习进一步降低调参需求，「hands-free AutoML」。局限：Linux/macOS only（依赖 SWIG）、对 Windows 支持差。

## TPOT：遗传编程导出 Python

TPOT 用遗传算法（GA）搜索「最优 ML 流水线」——包括特征预处理、特征选择、模型、超参，整个流水线作为一个「基因」进化。

```python
from tpot import TPOTClassifier

tpot = TPOTClassifier(
    generations=100,        # 进化代数
    population_size=100,    # 每代种群规模
    offspring_size=100,     # 每代后代数
    cv=5,                   # 交叉验证折数
    scoring='accuracy',
    random_state=42,
    n_jobs=-1,
    verbosity=2,
)
tpot.fit(X_train, y_train)
# 关键：导出可复现的 Python 代码
tpot.export('best_pipeline.py')   # 输出 sklearn Pipeline 代码
```

> TPOT 的杀手锏是 **export('xxx.py')**——把搜索到的最优流水线导出为标准 sklearn 代码，可直接用于生产，告别黑盒。

## H2O AutoML：企业级集成

H2O AutoML 是企业级 AutoML，支持分布式、自动 Stacked Ensemble，主流算法（GBM/XGBoost/DRF/GLM/DeepLearning）全覆盖。

```python
import h2o
from h2o.automl import H2OAutoML

h2o.init()
train = h2o.H2OFrame(df_train)

# max_models 或 max_runtime_secs 控制停止（默认 1 小时）
aml = H2OAutoML(max_models=20, max_runtime_secs=600, seed=42)
aml.train(x=features, y='target', training_frame=train)

# 关键：leaderboard 排名 + 自动 Stacked Ensemble
lb = aml.leaderboard        # 模型排行榜（按 AUC/RMSE 等排序）
print(lb.head())            # 前 5 名
leader = aml.leader         # 最佳模型（通常是 Stacked Ensemble）
```

> H2O 自动构建两类 Stacked Ensemble：「All Models」（所有基模型）和「Best of Family」（每算法族最优），用正则 GLM 做元学习器堆叠。这是它常比单模型强的原因。

## 下一步

- [指南](./guide-line.md)：工具对比深析 + Optuna Define-by-Run + NAS 详解 + 选型
- [参考](./reference.md)：工具选型决策表 + API 速查 + 官方资源
