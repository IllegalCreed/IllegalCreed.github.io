---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Amazon SageMaker AI 官方开发者指南 + SageMaker Python SDK 文档 + 2024-12 更名公告与 re:Invent 2024 新功能整理

## 速查

- **Python SDK**：`pip install sagemaker`；`import sagemaker`；`sagemaker.Session()` / `sagemaker.get_execution_role()`
- **训练入口**：`sagemaker.estimator.Estimator` / `sagemaker.pytorch.estimator.PyTorch` / `sagemaker.tensorflow.estimator.TensorFlow` / `sagemaker.mxnet.estimator.MXNet` / `sagemaker.xgboost.estimator.XGBoost`
- **处理**：`sagemaker.processing.Processor` / `SKLearnProcessor` / `PySparkProcessor` / `ScriptProcessor`
- **推理**：`estimator.deploy(...)` → `Predictor`；`Transformer`（批）；`Model` + `ServerlessInferenceConfig`
- **Pipeline**：`sagemaker.workflow.pipeline.Pipeline` + 各种 `*Step`
- **AutoML**：`sagemaker.automl.automl.AutoML`
- **特征仓库**：`sagemaker.feature_store.feature_group.FeatureGroup`
- **注册表**：`sagemaker.model.ModelPackage` / `ModelPackageGroup`
- **监控**：`sagemaker.model_monitor.DataCaptureConfig` / `DefaultModelMonitor` / `ModelQualityMonitor`
- **超参调优**：`sagemaker.tuner.HyperparameterTuner`
- **环境变量**：训练容器内 `SM_MODEL_DIR=/opt/ml/model`、`SM_CHANNEL_&lt;CH&gt;`、`SM_HPS` 等

## 组件全景表

| 类别 | 组件 | 一句话 |
| --- | --- | --- |
| IDE | Studio | Web IDE 套件（JupyterLab / Code Editor / RStudio / Studio Classic） |
| IDE | Studio Lab | 免费 JupyterLab，无需 AWS 账号 |
| IDE | Canvas | 无代码 AutoML，内置 Q Developer |
| 数据 | Ground Truth | 人机协同标注 |
| 数据 | Data Wrangler | 可视化数据准备 |
| 数据 | Feature Store | 在线/离线特征仓库 |
| 数据 | Clarify（数据） | 数据偏置检测 |
| 训练 | Training Job | 一次性按需训练 |
| 训练 | Processing Job | 数据处理与评估 |
| 训练 | Autopilot | AutoML，输出可解释 notebook |
| 训练 | HyperPod | 大模型常驻集群 |
| 训练 | HyperPod recipes | 端到端训练配方（NeMo/Neuronx） |
| 训练 | Training Plans | 算力预约 |
| 训练 | Debugger | 训练参数/数据探查，自动告警 |
| 训练 | Training Compiler | GPU 训练加速 |
| 推理 | Endpoint | 实时在线推理 |
| 推理 | Batch Transform | 离线批推理 |
| 推理 | Serverless Endpoint | 按调用计费，缩到 0 |
| 推理 | Neo | 模型编译，云端+端侧通用 |
| 推理 | Edge Manager | 端侧模型舰队管理 |
| 推理 | Inference Recommender | 推理实例选型 |
| 推理 | Shadow Tests | 灰度比对部署 |
| 治理 | Pipelines | DAG 工作流编排 |
| 治理 | Model Registry | 版本+审批 |
| 治理 | Model Cards | 合规文档 |
| 治理 | Model Monitor | 漂移/质量监控 |
| 治理 | Model Dashboard | 账号内模型总览 |
| 治理 | Experiments | 实验追踪 |
| 治理 | ML Lineage Tracking | 血缘追溯 |
| 治理 | Clarify（模型） | 预测可解释性 |
| 治理 | A2I（Augmented AI） | 人工复核工作流 |
| 周边 | Projects | 端到端 MLOps + CI/CD 模板 |
| 周边 | Geospatial | 地理空间 ML |
| 周边 | Role Manager | 角色与权限编排 |
| 周边 | Partner AI Apps | 第三方 GenAI/ML 应用 |

## 核心 API 速查表

### 训练

| API | 说明 |
| --- | --- |
| `Estimator(image_uri, role, instance_type, instance_count, hyperparameters, use_spot_instances, checkpoint_s3_uri)` | 通用估计器 |
| `PyTorch(entry_point, framework_version, py_version, ...)` | PyTorch 估计器 |
| `estimator.fit({"train": "s3://...", "test": "s3://..."})` | 启动 Training Job |
| `estimator.deploy(initial_instance_count, instance_type, endpoint_name)` | 部署实时端点 |
| `estimator.transformer(instance_count, instance_type)` | 生成 Batch Transformer |
| `HyperparameterTuner(estimator, objective_metric_name, hyperparameter_ranges, max_jobs, max_parallel_jobs)` | 超参调优 |
| `estimator.fit(inputs=..., job_name=..., experiment_config=...)` | 关联实验 |

### 处理

| API | 说明 |
| --- | --- |
| `SKLearnProcessor(framework_version, role, instance_type, instance_count)` | sklearn 处理器 |
| `PySparkProcessor(role, instance_type, instance_count)` | Spark 处理器 |
| `ScriptProcessor(image_uri, role, instance_type, command=["python3"])` | 自定义脚本处理器 |
| `processor.run(code="preprocess.py", inputs=[...], outputs=[...])` | 执行 Processing Job |

### Pipeline 步骤

| 步骤 | 用途 |
| --- | --- |
| `ProcessingStep` | 数据处理 / 评估 |
| `TrainingStep` | 训练 |
| `TuningStep` | 超参调优 |
| `TransformStep` | 批推理 |
| `AutoMLStep` | AutoML 一环 |
| `ModelStep` | 创建 Model / 注册 |
| `RegisterModel` | 写入 Model Registry（含审批） |
| `ConditionStep` | 条件分支 |
| `LambdaStep` | 调 Lambda |
| `CallbackStep` | 外部系统回调 |
| `FailStep` | 显式失败 |
| `Pipeline(steps=[...]).upsert(role_arn=)` / `.start()` | 创建/更新与执行 |

### 特征仓库

```python
from sagemaker.feature_store.feature_group import FeatureGroup, FeatureDefinition

fg = FeatureGroup(name="user_features", sagemaker_session=sess)
fg.load_feature_definitions(data_frame=df)         # 从 DataFrame 推断
fg.create(
    s3_uri=f"s3://{bucket}/fs/",
    record_identifier_name="user_id",
    event_time_feature_name="event_time",
    enable_online_store=True,
)
fg.ingest(data_frame=df, max_workers=3)            # 写入

record = fg.get_record(record_identifier_value="u_123")  # 在线读
ds = fg.create_dataset?() or sagemaker.FeatureStore.create_dataset(...).load()  # 离线读
```

### 模型注册与部署

```python
from sagemaker.model import ModelPackage, ModelPackageGroup
from sagemaker.model_metrics import MetricsSource, ModelMetrics

# 注册
model_package = estimator.register(
    model_package_group_name="MyGroup",
    image_uri=...,
    model_metrics=ModelMetrics(...),
    approval_status="PendingManualApproval",
)

# 拉取并部署已审批的版本
mp = ModelPackage(role=role, model_package_arn="arn:...")
mp.create(...)
predictor = mp.deploy(...)
```

### 监控

```python
from sagemaker.model_monitor import DataCaptureConfig, DefaultModelMonitor

estimator.deploy(
    ...,
    data_capture_config=DataCaptureConfig(
        enable_capture=True,
        sampling_percentage=100,
        destination_s3_uri=f"s3://{bucket}/capture/",
    ),
)
monitor = DefaultModelMonitor(role=role)
monitor.create_baseline(baseline_dataset="s3://.../baseline.csv")
monitor.start_monitoring_schedule(
    endpoint_input="my-endpoint",
    output_s3_uri=f"s3://{bucket}/monitor/",
    statistics=monitor.baseline_statistics(),
    constraints=monitor.suggested_constraints(),
)
```

## 训练容器环境变量

| 变量 | 值 |
| --- | --- |
| `SM_MODEL_DIR` | `/opt/ml/model`（写模型产物） |
| `SM_INPUT_DIR` | `/opt/ml/input` |
| `SM_INPUT_DATA_DIR` | `/opt/ml/input/data` |
| `SM_INPUT_CONFIG_DIR` | `/opt/ml/input/config` |
| `SM_OUTPUT_DIR` | `/opt/ml/output` |
| `SM_CHANNEL_&lt;CHANNEL_NAME&gt;` | `/opt/ml/input/data/&lt;channel&gt;` |
| `SM_HPS` | 序列化的超参 JSON |
| `SM_CURRENT_HOST` / `SM_HOSTS` | 分布式训练本机与所有节点 |

## 实例类型速查（训练常用）

| 系列 | 示例 | 用途 |
| --- | --- | --- |
| `ml.m5.*` | `ml.m5.xlarge` | CPU 通用、数据处理 |
| `ml.c5.*` | `ml.c5.2xlarge` | CPU 计算密集 |
| `ml.p4d.24xlarge` | 8×A100 40GB | 大模型分布式训练 |
| `ml.p4de.24xlarge` | 8×A100 80GB | 更大显存 |
| `ml.p5.48xlarge` | 8×H100 80GB | LLM/扩散模型主力 |
| `ml.trn1.*` / `ml.trn1n.*` | AWS Trainium | 自研加速器 |
| `ml.inf2.*` | AWS Inferentia2 | 推理 |

## re:Invent 2024 新功能要点

- **HyperPod recipes**：基于 NeMo / Neuronx Distributed Training 的端到端训练配方，可在 HyperPod 或普通 Training Job 跑
- **HyperPod in Studio**：Studio 内发任务、看集群
- **HyperPod task governance**：EKS 集群跨团队配额与利用率
- **Partner AI Apps**：第三方 GenAI/ML 应用上架，数据不出客户配置
- **Q Developer in Canvas**：自然语言驱动 ML 工作流
- **Training Plans**：算力预约（指定时间窗/时长/容量，自动故障恢复）

## 2024-12-03 命名变更

- **Amazon SageMaker**（ML 子产品）→ **Amazon SageMaker AI**
- 下一代 **Amazon SageMaker** 升级为统一数据/分析/AI 平台：Lakehouse、Data & AI Governance（Catalog 基于 DataZone）、Unified Studio、SQL Analytics（Redshift）、Data Processing（Athena/EMR/Glue）、Bedrock
- 保留旧前缀：`boto3` `sagemaker` 命名空间、CloudFormation `AWS::SageMaker`、IAM `AmazonSageMaker*` 托管策略、控制台 URL、服务端点域名

## 官方资源

- [SageMaker AI 开发者指南](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html)
- [功能总览](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis-features.html)
- [SageMaker Studio](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-updated.html)
- [SageMaker Python SDK](https://sagemaker.readthedocs.io/)
- [SageMaker 示例库（GitHub）](https://github.com/aws/amazon-sagemaker-examples)
- [SageMaker 定价](https://aws.amazon.com/sagemaker/pricing/)
- [SageMaker JumpStart](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jumpstart.html)
