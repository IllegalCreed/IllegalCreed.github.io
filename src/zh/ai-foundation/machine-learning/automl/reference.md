---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Auto-sklearn 0.15 + TPOT + H2O AutoML + FLAML + Optuna 官方文档整理

## 速查

- **工具选型一句话**：写代码只调参→**Optuna**；sklearn 端到端→**Auto-sklearn**；要导出 Python→**TPOT**；企业级分布式+集成→**H2O AutoML**；快速低成本→**FLAML**；零代码云→**Google AutoML/Vertex AI**
- **Auto-sklearn 版本**：0.15.0（master 分支文档），Python ≥ 3.8，依赖 SWIG，Linux/macOS only
- **TPOT 核心类**：`TPOTClassifier` / `TPOTRegressor`，杀手锏 `export('pipeline.py')`
- **H2O AutoML 核心类**：`H2OAutoML(max_models, max_runtime_secs)`，`leaderboard`/`leader`
- **FLAML 核心类**：`AutoML().fit(X, y, time_budget, task)`，`best_estimator`/`best_config`
- **Optuna 核心三件套**：`study` / `trial` / `objective`，`create_study().optimize()`
- **Optuna 默认 Sampler**：`TPESampler`（树结构 Parzen 估计器，贝叶斯优化）
- **Optuna 默认 Pruner**：`MedianPruner`（中位数剪枝）
- **NAS 三方法**：RL（NASNet）/ 进化（AmoebaNet）/ 梯度（DARTS，最便宜）
- **NAS SOTA 产出**：EfficientNet（图像分类）、EfficientDet（检测）

## 工具选型决策表

| 场景 | 首选工具 | 备选 | 理由 |
| --- | --- | --- | --- |
| **写训练代码只调超参** | Optuna | Ray Tune / Hyperopt | Define-by-Run 灵活，TPE 高效 |
| **sklearn 生态端到端** | Auto-sklearn | — | 贝叶斯+元学习+集成，drop-in 替换 |
| **要导出可复现 Python 代码** | TPOT | — | 遗传编程 + export 杀手锏 |
| **企业级分布式 + 强集成** | H2O AutoML | — | Stacked Ensemble + 多语言 + 分布式 |
| **快速低成本基线** | FLAML | — | 微软，秒级，CFO/BlendSearch |
| **零代码云服务** | Google AutoML / Vertex AI | AWS AutoPilot | 图形界面，无代码 |
| **NAS（图像/NLP 网络搜索）** | AutoKeras / DARTS | Google AutoML | 搜索网络架构 |
| **多目标优化** | Optuna (NSGAIISampler) | — | 多目标帕累托前沿 |
| **表格数据打榜** | 不用 AutoML，手动 XGBoost/LightGBM 精调 | FLAML 出基线 | AutoML 适合基线不适合打榜 |

## 主流工具对比

| 工具 | 自动化范围 | 核心技术 | 杀手锏 | 局限 |
| --- | --- | --- | --- | --- |
| **Optuna** | 超参调优 | TPE/贝叶斯 + Define-by-Run | 灵活、剪枝、可视化 | 需写训练代码 |
| **Auto-sklearn** | 算法+超参+集成 | 贝叶斯+元学习+集成 | sklearn drop-in、2.0 hands-free | Windows 差、聚焦表格 |
| **TPOT** | 流水线+特征+模型+超参 | 遗传编程 | `export` 导出 Python 代码 | 慢、流水线可能复杂 |
| **H2O AutoML** | 算法+超参+集成 | 多算法 + Stacked Ensemble | 企业级、分布式、自动集成 | 需 H2O 集群、H2OFrame 摩擦 |
| **FLAML** | 算法+超参 | CFO/BlendSearch | 快、低成本、支持时序/排序 | 算法族相对少 |
| **AutoKeras** | NAS（架构+超参） | 神经架构搜索 | 自动搜网络结构 | 算力需求高 |
| **Google AutoML** | NAS + 端到端 | 云原生 NAS | 零代码、SOTA 架构 | 付费云、数据上云 |

## API 速查

### Optuna（超参调优）

```python
import optuna

# 1. 定义 objective（搜索空间在函数内）
def objective(trial):
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)  # 对数尺度
    n_units = trial.suggest_int('n_units', 32, 256)
    optimizer = trial.suggest_categorical('opt', ['adam', 'sgd'])
    dropout = trial.suggest_float('dropout', 0.0, 0.5)
    return train_and_eval(lr, n_units, optimizer, dropout)

# 2. 创建 study + 优化
study = optuna.create_study(
    direction='maximize',
    sampler=optuna.samplers.TPESampler(seed=42),
    pruner=optuna.pruners.MedianPruner(),
)
study.optimize(objective, n_trials=100, n_jobs=-1, timeout=3600)

# 3. 结果
study.best_params      # 最优超参
study.best_value       # 最优值
study.best_trial       # 最优 trial 详情
study.trials_dataframe()  # 所有 trial 的 DataFrame

# 4. 可视化
optuna.visualization.plot_optimization_history(study)
optuna.visualization.plot_param_importances(study)
optuna.visualization.plot_contour(study)
```

### Auto-sklearn（端到端）

```python
from autosklearn.classification import AutoSklearnClassifier, AutoSklearnRegressor

automl = AutoSklearnClassifier(
    time_left_for_this_task=3600,
    per_run_time_limit=360,
    ensemble_size=50,
    metric='accuracy',
    resampling_strategy='cv',
    resampling_strategy_arguments={'folds': 5},
)
automl.fit(X_train, y_train)
automl.predict(X_test)
automl.leaderboard()       # 模型排行榜
automl.show_models()       # 详情
automl.sprint_statistics() # 统计摘要
```

### TPOT（遗传编程导出代码）

```python
from tpot import TPOTClassifier, TPOTRegressor

tpot = TPOTClassifier(
    generations=100,
    population_size=100,
    offspring_size=100,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42,
    config_dict='TPOT light',  # 'TPOT light'/'TPOT MDR'/'TPOT sparse'/自定义
    verbosity=2,
)
tpot.fit(X_train, y_train)
tpot.score(X_test, y_test)
tpot.export('best_pipeline.py')   # 导出 sklearn Pipeline 代码
tpot.fitted_pipeline_             # 内存中的 Pipeline 对象
```

### H2O AutoML（企业级集成）

```python
import h2o
from h2o.automl import H2OAutoML

h2o.init(nthreads=-1, max_mem_size='8G')
train = h2o.H2OFrame(df_train)
test = h2o.H2OFrame(df_test)

aml = H2OAutoML(
    max_models=20,                # 建议设，保可复现
    max_runtime_secs=600,         # 或总时间
    seed=42,
    nfolds=5,
    # exclude_algos=['DeepLearning', 'GLM'],
    # include_algos=['GBM', 'XGBoost', 'DRF'],
    # balance_classes=True,        # 类别不平衡
    # sort_metric='AUC',           # leaderboard 排序指标
)
aml.train(x=feature_cols, y='target', training_frame=train, leaderboard_frame=test)

lb = aml.leaderboard               # 模型排行榜
leader = aml.leader                 # 最佳模型
lb.as_data_frame().head()           # 转 DataFrame

pred = leader.predict(test)
model_id = leader.model_id          # 模型 ID
leader.download_mojo(path='./')     # 导出 MOJO（生产部署）
```

### FLAML（快速低成本）

```python
from flaml import AutoML

automl = AutoML()
automl.fit(
    X_train, y_train,
    task='classification',          # 'classification'/'regression'/'ts_forecast'/'rank'
    time_budget=60,
    metric='accuracy',              # 或 'auto'/'roc_auc'/'f1'
    estimator_list=['lgbm', 'xgboost', 'rf', 'catboost', 'knn'],
    ensemble=True,
    n_jobs=-1,
    log_file_name='flaml.log',
    verbose=1,
)
automl.best_estimator               # 'lgbm' 等
automl.best_config                  # 最佳超参字典
automl.best_loss                    # 最佳损失
automl.feature_importances_         # 特征重要性

# 时间序列预测专用
from flaml import AutoML
automl.fit(dataframe, task='ts_forecast', time_budget=60,
           period=12, estimator_list=['auto_arima', 'prophet', 'ets'])
```

## Optuna Samplers 速查

| Sampler | 机制 | 适用 | 参数 |
| --- | --- | --- | --- |
| `TPESampler`（默认） | 树结构 Parzen 估计器 | 通用、大多数场景 | `n_startup_trials=10` |
| `CMAESampler` | 协方差矩阵自适应进化 | 连续超参空间 | `sigma0=0.1` |
| `RandomSampler` | 随机搜索 | 基线对比 | `seed` |
| `GridSampler` | 穷举网格 | 离散小空间 | `search_space` 字典 |
| `NSGAIISampler` | 多目标进化 | 多目标帕累托 | `population_size` |
| `QMCSampler` | 准蒙特卡洛 | 低差异采样 | 包装其他 sampler |

## Optuna Pruners 速查

| Pruner | 机制 | 适用 |
| --- | --- | --- |
| `MedianPruner`（默认） | 比中位数差则剪 | 通用、多数迭代训练 |
| `SuccessiveHalvingPruner` | 连续减半分配资源 | 早期终止 |
| `HyperbandPruner` | Hyperband 算法 | 大规模高效剪枝 |
| `ThresholdPruner` | 低于/高于阈值剪 | 已知好坏范围 |
| `NopPruner` | 不剪 | 调试/对比 |
| `PatientPruner` | 耐心等待几步再剪 | 避免误剪慢启动 |

## NAS 工具速查

| 工具/服务 | 类型 | 核心方法 | 适用 |
| --- | --- | --- | --- |
| **AutoKeras** | 开源 NAS | 神经架构搜索（梯度/RL） | 中小项目，Keras 生态 |
| **NNI（微软）** | 开源 NAS + 调参 | 多种 NAS + 超参算法 | 综合，研究友好 |
| **Google AutoML Vision/NL** | 云服务 | RL-based NAS | 零代码图像/NLP |
| **Vertex AI** | 云平台 | AutoML Tables + NAS | 综合云 ML 平台 |
| **DARTS** | 算法/实现 | 可微架构搜索 | 成本最低的 NAS |

## 官方资源

- [Auto-sklearn 官方文档](https://automl.github.io/auto-sklearn/master/)（API + 示例 + Auto-sklearn 2.0 论文）
- [TPOT 官方文档](https://epistasislab.github.io/tpot/)（遗传编程流水线优化）
- [H2O AutoML 文档](https://docs.h2o.ai/h2o/latest-stable/h2o-docs/automl.html)（企业级 AutoML + Stacked Ensemble）
- [FLAML 官方文档](https://microsoft.github.io/FLAML/)（微软，低成本 AutoML + LLM 调优）
- [Optuna 官方文档](https://optuna.readthedocs.io/en/stable/)（Define-by-Run + TPE + 剪枝）
- [Optuna GitHub](https://github.com/optuna/optuna)
- [AutoKeras 文档](https://autokeras.com/)（开源 NAS）
- [微软 NNI 文档](https://nni.readthedocs.io/)（NAS + 超参调优综合工具）
- [Google Cloud Vertex AI AutoML](https://cloud.google.com/vertex-ai/docs)（云原生 NAS）
