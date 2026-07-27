---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Auto-sklearn 0.15 + TPOT + H2O AutoML + FLAML + Optuna 官方文档编写

## 速查

- **工具选型一句话**：写训练代码只调参→**Optuna**；sklearn 端到端→**Auto-sklearn**；要导出 Python 代码→**TPOT**；企业级分布式+集成→**H2O AutoML**；快速低成本→**FLAML**；零代码云→**Google AutoML/Vertex AI**
- **Auto-sklearn 三件套**：贝叶斯优化（高效超参搜索）+ 元学习（相似数据集初始化）+ 集成构造（自动堆叠）
- **TPOT 杀手锏**：遗传编程搜索流水线 + `export('pipeline.py')` 导出可复现 sklearn 代码
- **H2O AutoML 核心优势**：自动 Stacked Ensemble（All Models + Best of Family），正则 GLM 元学习器
- **FLAML 调优系统**：CFO（成本_frugal 优化）+ BlendSearch（CFO+贝叶斯混合），低成本快收敛
- **Optuna Define-by-Run**：imperative API，用 `trial.suggest_*` 在 objective 内动态构造搜索空间，灵活度最高
- **Optuna Samplers**：`TPESampler`（默认，树结构 Parzen 估计器）/ `CMAESampler`（协方差矩阵自适应，连续空间强）/ `GridSampler`（穷举）
- **Optuna Pruners**：`MedianPruner`（中位数剪枝）/ `SuccessiveHalvingPruner`（连续减半）/ `HyperbandPruner`（Hyperband 算法）
- **NAS 核心方法**：强化学习（NASNet，controller RNN）/ 进化算法（AmoebaNet）/ 梯度（DARTS，可微架构搜索）
- **NAS SOTA 产出**：EfficientNet（Google）、NASNet、AmoebaNet——都超越了人工设计，但搜索成本数百 GPU-天
- **核心反模式**：用 AutoML 替代数据清洗（垃圾进垃圾出）、用 NAS 做表格数据（过度，NAS 适合图像/搜索）、盲目信任 leaderboard（可能过拟合验证集）

## 工具对比深析

### Auto-sklearn：贝叶斯优化 + 元学习 + 集成

Auto-sklearn 把 sklearn 的 17 算法族、十余种预处理、超参空间全自动化，三大核心技术：

```python
from autosklearn.classification import AutoSklearnClassifier

automl = AutoSklearnClassifier(
    time_left_for_this_task=3600,   # 总预算（秒）
    per_run_time_limit=360,          # 单模型最大训练时间
    ensemble_size=50,                # 集成规模
    ensemble_nbest=50,               # 候选模型数
    metric='accuracy',
    resampling_strategy='cv',        # 'cv'/'holdout'/'repeated-cross-validation'
    resampling_strategy_arguments={'folds': 5},
    initial_configurations_via_metalearning=25,  # 元学习初始化数
)
```

**贝叶斯优化**：用高斯过程/TPE 建模超参到性能的映射，相比网格/随机搜索用更少试验找到好配置——尤其超参空间大时优势明显。

**元学习**：从历史任务（meta-feature）学「数据集特征 → 好配置」的映射，新任务用相似数据集的配置初始化，跳过冷启动。Auto-sklearn 2.0 的「Hands-free AutoML」论文核心。

**集成构造**：不止选最佳单模型，而是把多个好模型（不同算法/超参）用 bagging 式集成，降低过拟合风险、提升泛化。

**局限**：依赖 SWIG，Windows 支持差；对深度学习支持弱（聚焦表格数据）。

### TPOT：遗传编程 + 代码导出

TPOT 把整个 ML 流水线（预处理→特征选择→模型→超参）编码为一个「基因」，用遗传算法（选择/交叉/变异）进化搜索最优流水线。

```python
from tpot import TPOTClassifier, TPOTRegressor

tpot = TPOTClassifier(
    generations=100,           # 进化代数（越多越优但越慢）
    population_size=100,       # 种群规模
    offspring_size=100,        # 后代数
    mutation_rate=0.9,         # 变异概率
    crossover_rate=0.1,        # 交叉概率
    scoring='accuracy',        # 适应度
    cv=5,                      # 交叉验证
    n_jobs=-1,
    random_state=42,
    config_dict='TPOT light',  # 'TPOT light'(快)/'TPOT MDR'/'TPOT sparse'/自定义
    verbosity=2,
)
tpot.fit(X_train, y_train)

# 杀手锏：导出可复现的 sklearn Pipeline 代码
tpot.export('best_pipeline.py')
# 输出形如：
# from sklearn.pipeline import make_pipeline
# from sklearn.ensemble import GradientBoostingClassifier
# exported_pipeline = make_pipeline(GradientBoostingClassifier(...))
```

**遗传算法流程**：

1. 随机生成初始种群（多个随机流水线）
2. 评估每个个体的交叉验证分数（适应度）
3. 选择高分个体，通过交叉/变异生成下一代
4. 重复直到代数耗尽或收敛

**config_dict 预设**：

- `'TPOT light'`：轻量，速度快，适合大数据
- `'TPOT MDR'`：含 Multifactor Dimensionality Reduction，适合基因数据
- `'TPOT sparse'`：稀疏数据（文本 TF-IDF）
- 自定义：用户限定算法范围

**优势**：导出 Python 代码，告别黑盒——搜索结果可直接审查、修改、部署。

**局限**：遗传算法耗时（generations=100 常需数小时）；流水线可能过于复杂（嵌套多层预处理）。

### H2O AutoML：企业级 + Stacked Ensemble

H2O AutoML 是企业级分布式 AutoML，覆盖 GBM/XGBoost/DRF（随机森林）/GLM/DeepLearning，自动构建 Stacked Ensemble。

```python
import h2o
from h2o.automl import H2OAutoML

h2o.init(nthreads=-1)                      # 启动 H2O 集群
train = h2o.H2OFrame(df_train)
test = h2o.H2OFrame(df_test)

aml = H2OAutoML(
    max_models=20,                         # 最大模型数（建议设，保可复现）
    max_runtime_secs=600,                  # 或设总时间（秒）
    seed=42,
    # exclude_algos=['DeepLearning'],      # 排除某算法
    # include_algos=['GBM', 'XGBoost'],    # 或白名单
    nfolds=5,                              # 交叉验证折数
    balance_classes=False,                 # 类别平衡
)
aml.train(x=feature_cols, y='target', training_frame=train, leaderboard_frame=test)

# 三大核心产出
lb = aml.leaderboard                       # 模型排行榜（按 metric 排序）
leader = aml.leader                         # 最佳模型对象
print(lb.as_data_frame().head())            # 前 5 名详情

# 预测
pred = leader.predict(test)
```

**leaderboard 排序指标**（按问题类型自动）：二分类用 AUC、多分类用 logloss/mean_per_class_error、回归用 RMSE/R²/MAE。

**Stacked Ensemble 两大类型**：

- **All Models**：把所有基模型堆叠（最高精度但最复杂）
- **Best of Family**：每算法族（GBM/XGB/DRF/...）选最优一个堆叠（平衡精度与复杂度）

元学习器是正则化 GLM（L2），避免堆叠过拟合。leader 通常是 Stacked Ensemble 而非单模型——这是 H2O AutoML 常比单模型强 1-3 个百分点的原因。

**优势**：分布式（支持 Spark/Hadoop）、支持 Java/Scala/R/Python 多语言、生产部署成熟（POJO/MOJO 导出）。

**局限**：需启动独立 H2O 集群（h2o.init）；数据需转 H2OFrame，与 sklearn/numpy 工作流有摩擦。

### FLAML：低成本快速

微软 FLAML（Fast and Lightweight AutoML）主打低成本——在快收敛的同时保持高精度，默认集成 LightGBM/XGBoost/catboost/random_forest 等。

```python
from flaml import AutoML

automl = AutoML()
automl.fit(
    X_train, y_train,
    task='classification',          # 'classification'/'regression'/'ts_forecast'/'rank'
    time_budget=60,                  # 时间预算（秒）
    metric='accuracy',               # 或 'roc_auc'/'f1'/'auto'
    estimator_list=['lgbm', 'xgboost', 'rf', 'catboost'],  # 候选算法
    ensemble=True,                   # 是否集成
    n_jobs=-1,
)
print(automl.best_estimator)         # 最佳算法
print(automl.best_config)            # 最佳超参
print(automl.best_loss)              # 最佳损失
```

**调优系统**：

- **CFO（Cost-Frugal Optimization）**：从低成本配置开始，逐步增成本，成本友好
- **BlendSearch**：CFO（局部）+ 贝叶斯优化（全局）混合，兼顾效率与探索

**特色**：

- 支持 `ts_forecast` 时间序列预测（其他 AutoML 较少）
- 支持 `rank` 排序学习（推荐/搜索场景）
- 内置 AutoGen 适配大模型（LLM）调优

**优势**：速度快（秒级到分钟级）、内存占用低、微软持续维护。

### Optuna：Define-by-Run 调参框架

Optuna 是纯超参优化框架（不端到端），需用户写训练代码，但灵活度最高。核心是 Define-by-Run API——搜索空间在 objective 函数内动态构造。

```python
import optuna

def objective(trial):
    # 动态建议超参（搜索空间在函数内定义）
    n_layers = trial.suggest_int('n_layers', 1, 3)
    layers = []
    for i in range(n_layers):
        units = trial.suggest_int(f'n_units_{i}', 32, 256)
        layers.append(units)

    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd', 'rmsprop'])

    # 训练模型（用户代码）
    model = build_model(layers, lr, optimizer)
    score = train_and_evaluate(model)

    return score  # 最小化/最大化

study = optuna.create_study(
    direction='maximize',
    sampler=optuna.samplers.TPESampler(seed=42),       # 默认 TPE
    pruner=optuna.pruners.MedianPruner(),               # 中位数剪枝
)
study.optimize(objective, n_trials=100, n_jobs=-1)

print(study.best_params)       # 最优超参
print(study.best_value)        # 最优值
print(study.best_trial)        # 最优 trial 详情
```

**核心概念**：

- **Study**：一次优化任务（含多个 Trial）
- **Trial**：objective 函数的一次执行（一组超参）
- **Objective**：要优化的目标函数（返回标量）

**Samplers（采样器，决定下一组超参怎么选）**：

| Sampler | 机制 | 适用 |
| --- | --- | --- |
| `TPESampler`（默认） | 树结构 Parzen 估计器，贝叶斯优化 | 通用、大多数场景 |
| `CMAESampler` | 协方差矩阵自适应进化策略 | 连续超参空间强 |
| `RandomSampler` | 随机搜索 | 基线对比 |
| `GridSampler` | 穷举网格 | 离散小空间 |
| `NSGAIISampler` | 多目标进化 | 多目标优化 |

**Pruners（剪枝器，提前终止无望 trial）**：

| Pruner | 机制 |
| --- | --- |
| `MedianPruner` | 比中位数差则剪 |
| `SuccessiveHalvingPruner` | 连续减半分配资源 |
| `HyperbandPruner` | Hyperband 算法 |
| `NopPruner` | 不剪枝 |

**优势**：Define-by-Run 灵活（条件参数、动态空间）、与 PyTorch/TF/sklearn 任意框架集成、可视化 dashboard 优秀。

**对比 GridSearchCV**：Optuna 用 TPE 贝叶斯优化比网格搜索高效得多；支持条件参数（GridSearchCV 难处理「if 优化器是 adam 则调 beta」）；可剪枝提前终止差 trial。

## NAS（神经架构搜索）简述

NAS 是 AutoML 最前沿分支——自动搜索神经网络架构（层类型、连接、通道数），诞生了多个 SOTA。

### 三大方法

| 方法 | 代表 | 机制 | 成本 |
| --- | --- | --- | --- |
| **强化学习** | NASNet（Google 2017） | Controller RNN 生成架构，用验证精度作奖励 | 1800 GPU-天 |
| **进化算法** | AmoebaNet（Google）、Regularized Evolution | 种群变异选择，适应度=精度 | 数百 GPU-天 |
| **梯度（DARTS）** | DARTS（2018） | 把架构参数化为连续变量，端到端可微优化 | 1-4 GPU-天 |

### 著名产出

- **EfficientNet**（Google）：系统化缩放（depth/width/resolution 平衡），图像分类 SOTA，广泛用作 backbone
- **NASNet**：早期 NAS 里程碑，搜索 cell 再堆叠
- **AmoebaNet**：进化算法，性能与 NASNet 持平
- **EfficientDet**：EfficientNet 思路用于目标检测

### 工具

- **AutoKeras**：开源 NAS 工具，Keras 生态，适合中小项目
- **Google Cloud AutoML Vision/NL/Tables**：云原生 NAS 服务，零代码
- **Nni（微软）**：开源 NAS + 超参调优综合工具

> NAS 的核心限制是算力——数百 GPU-天只有大厂能负担。DARTS 把成本降到 GPU-天级，使 NAS 民主化。但表格数据用 NAS 是过度（树模型已够强），NAS 主要价值在图像/NLP 的网络结构搜索。

## 反模式（生产坑）

1. **用 AutoML 跳过数据清洗**：缺失/异常/标签错误不会自动修复，垃圾进垃圾出。应对：先做完整 EDA + 清洗，再喂 AutoML
2. **NAS 用于表格数据**：树模型（XGBoost/LightGBM）在表格上已够强，NAS 成本远超收益。应对：表格用 Auto-sklearn/H2O/FLAML，NAS 仅用于图像/NLP
3. **盲目信任 leaderboard 第一名**：可能是验证集过拟合。应对：留独立测试集终评，或用更严格的 CV（repeated-cross-validation）
4. **Optuna 不用 prune**：无剪枝时浪费大量算力在差 trial 上。应对：配合 `MedianPruner`/`HyperbandPruner` 提前终止
5. **TPOT 导出代码后不审查**：流水线可能过于复杂（嵌套多层预处理）。应对：审查 export 的 Python 代码，简化冗余步骤
6. **H2O AutoML 不设 max_models**：只用 max_runtime_secs 时结果不可复现。官方建议设 max_models 保证可复现

## 下一步

- [参考](./reference.md)：工具选型决策表 + API 速查 + 官方资源
