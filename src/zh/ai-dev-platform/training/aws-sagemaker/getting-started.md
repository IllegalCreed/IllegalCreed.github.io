---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Amazon SageMaker AI 官方开发者指南（docs.aws.amazon.com/sagemaker/latest/dg，2024-12 更名后的 What is SageMaker AI / Features / Studio / Training / Deploy 章节）编写，对照当前服务行为

## 速查

- **服务定位**：全托管 ML 平台，覆盖打标→准备→训练→评估→部署→监控→治理全生命周期
- **2024-12-03 改名**：ML 子产品更名为 **Amazon SageMaker AI**；下一代「Amazon SageMaker」统一数据/分析/AI（Lakehouse/Catalog/Unified Studio）。`boto3` 等 API 命名空间保留旧前缀不变
- **开发环境**：**SageMaker Studio**（Web IDE，含 JupyterLab / Code Editor / RStudio / Studio Classic）+ Canvas（无代码 AutoML）
- **训练三件套**：Training Job（一次性训练）、Processing Job（数据预处理/评估）、HyperPod（常驻大模型集群）
- **推理三件套**：实时 Endpoint、Batch Transform（无持久端点批处理）、Serverless Endpoint（按调用计费自动弹缩）
- **工作流编排**：SageMaker Pipelines（DAG，原生集成各 Job 与 AutoML step）
- **AutoML**：Autopilot（自动训分类/回归，输出 notebook 可解释）+ Canvas（无代码）
- **预训练模型**：JumpStart（一键 Deploy/Fine-tune，含 Llama/Mistral/Stable Diffusion）
- **数据标注**：Ground Truth（人机协同，自动标注 + 人工复核）
- **治理**：Model Registry（版本+审批）、Feature Store（在线/离线特征）、Model Monitor（漂移检测）、Model Cards（合规文档）、Lineage Tracking（血缘）、Clarify（偏置/可解释）
- **Python SDK**：`pip install sagemaker`，`sagemaker.estimator.Estimator` 是训练入口

## 服务架构与组件地图

SageMaker AI 不是单一功能，而是一组围绕 ML 生命周期的托管服务：

```
打标        Ground Truth / A2I（人工复核）
准备        Data Wrangler / Feature Store / Processing Job / Clarify（数据偏置）
训练        Training Job / Autopilot / HyperPod（大模型）/ Canvas（无代码）
评估        Processing Job / Clarify（模型可解释）/ Model Cards
部署        Endpoint / Batch Transform / Serverless Endpoint / Neo（端侧优化）/ Edge Manager
监控        Model Monitor / Shadow Tests / Inference Recommender
治理        Pipelines / Model Registry / Lineage Tracking / Experiments
IDE        Studio（JupyterLab/Code Editor/RStudio）/ Studio Classic / Studio Lab
```

**2024-12-03 命名变更要点**：仅 ML 子产品改名 SageMaker AI；`boto3` 命令、CloudFormation `AWS::SageMaker` 资源、IAM `AmazonSageMaker*` 托管策略、控制台 URL（含 `/sagemaker`）一律保留旧名以保后向兼容。下一代 SageMaker 另含 Lakehouse、Data & AI Governance（Catalog，基于 DataZone）、Unified Studio、Bedrock 等。

## Studio：一体化 IDE

Studio 是 SageMaker AI 的主入口，新一代基于 Web，套件式提供：

| 应用 | 用途 |
| --- | --- |
| **JupyterLab in Studio** | 改进延迟与可靠性的 Notebook 环境 |
| **Code Editor** | 基于 Code-OSS（VS Code 开源版）的代码编辑器，扩展 Studio 能力 |
| **RStudio** | R 语言 IDE，含 console/调试/绘图 |
| **Studio Classic** | 原始一体化 ML 环境 |
| **Studio Lab** | 免费服务，无需 AWS 账号即可用 JupyterLab |

Studio 提供「共享空间」（shared spaces）：域内所有用户共享 JupyterServer 与目录，便于协作；与 Amazon EMR 单/跨账号直连，处理大数据无需搬运。

## 第一个训练任务：Estimator 三行

SageMaker Python SDK 的核心抽象是 `Estimator`：

```python
import sagemaker, boto3
from sagemaker.estimator import Estimator

role   = sagemaker.get_execution_role()
sess   = sagemaker.Session()
region = boto3.Session().region_name

# ① 建估计器：指定镜像、实例类型、Spot
estimator = Estimator(
    image_uri=f"763104351884.dkr.ecr.{region}.amazonaws.com/pytorch-training:2.3.0-cpu-py311",
    role=role,
    instance_count=1,
    instance_type="ml.m5.xlarge",
    use_spot_instances=True,          # Spot 实例最高省 90%
    max_run=3600, max_wait=7200,      # Spot 等待上限
    hyperparameters={"epochs": 10, "batch-size": 64},
)

# ② 喂数据（S3 路径）
estimator.fit({"train": "s3://my-bucket/train/", "test": "s3://my-bucket/test/"})

# ③ 部署成实时端点
predictor = estimator.deploy(initial_instance_count=1, instance_type="ml.t2.medium")
```

关键点：

- `fit()` 触发一次 **Training Job**——SDK 自动下载数据、启动 EC2、上传模型产物到 S3
- **Spot 实例**：`use_spot_instances=True` 配合 `max_wait`，被中断会自动续训（需 checkpoint）
- **分布式训练**：`instance_count > 1` 自动数据并行；大模型用 `distribution={"torch_distributed": {...}}` 或 HyperPod
- 训练脚本约定：入口 `train.py`，读 `/opt/ml/input/data/`，模型写 `/opt/ml/model/`

## 推理三种形态

| 形态 | 场景 | 特点 |
| --- | --- | --- |
| **实时 Endpoint** | 在线低延迟推理 | 持久实例，支持自动扩缩、多模型/多容器端点、Shadow Tests |
| **Batch Transform** | 大批量离线推理 | 无持久端点，按数据集计费，自动关联输入记录 |
| **Serverless Endpoint** | 突发/稀疏流量 | 自动扩缩到 0，无需选实例类型，按调用计费 |

`Inference Recommender` 帮你选合适的实例类型与配置；`Neo` 把模型编译一次到处跑（云端 + 端侧），`Edge Manager` 管理端侧模型舰队。

## Autopilot：AutoML

无 ML 背景也能自动训出分类/回归模型：

```python
from sagemaker.automl.automl import AutoML

automl = AutoML(
    role=role,
    target_attribute_name="label",
    max_candidates=100,
    problem_type="BinaryClassification",
)
auto_ml_job = automl.fit({"train": "s3://.../train.csv"}, job_name="automl-1")
```

Autopilot 会生成 **Candidate Definitions notebook**，把试过的每种 pipeline 配置完全展开——这是它相对其它 AutoML 的最大卖点：**完全可解释、可干预**。Pipelines 里也有 `AutoMLStep` 把 AutoML 当作一环。

## JumpStart：一键预训练模型

Studio 内 JumpStart 提供 1-click 部署：

- 数百个预训练模型（CV/NLP/表格），含 Llama、Mistral、Falcon、Stable Diffusion 等 FM
- 支持 Fine-tune（在 JumpStart UI 内点几下）与 Deploy（实时端点）
- 也提供解决方案模板（end-to-end notebooks）与 Studio Classic 入口

## Pipelines：DAG 工作流

```python
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import ProcessingStep, TrainingStep

step_process = ProcessingStep(name="Preprocess", processor=processor, ...)
step_train   = TrainingStep(name="Train", estimator=estimator, inputs=...)
step_eval    = ProcessingStep(name="Eval", processor=processor, ...)

pipeline = Pipeline(
    name="MyPipeline",
    steps=[step_process, step_train, step_eval],
)
pipeline.create(role_arn=role)
pipeline.start(execution_display_name="run-001")
```

Pipelines 原生集成各 Job 类型，支持条件分支（条件 step 触发审批/失败）、`AutoMLStep`、`LambdaStep`、`CallbackStep`（外部系统回调）、`ModelStep`（注册到 Model Registry）、`RegisterModel`。

## 治理与监控

- **Model Registry**：版本化、artifact/lineage 跟踪、审批工作流、跨账号部署
- **Feature Store**：在线 Store（低延迟实时推理）+ 离线 Store（训练与批量推理）
- **Model Monitor**：监控 endpoint 的数据漂移与模型质量偏差，自动调度
- **Model Cards**：单点记录模型信息用于治理与合规汇报
- **Lineage Tracking**：追溯任意产物的完整血缘（数据→训练→模型→端点）
- **Clarify**：训练前测数据偏置，训练后做预测可解释性（SHAP）

## re:Invent 2024 新功能

- **HyperPod recipes**：在 HyperPod 或 Training Job 内跑训练配方（基于 NeMo/Neuronx Distributed Training）
- **HyperPod in Studio**：Studio 内直接发 HyperPod 任务、查看集群信息
- **HyperPod task governance**：EKS 集群资源分配与利用率治理
- **SageMaker Partner AI Apps**：第三方 GenAI/ML 开发应用上架
- **Q Developer in Canvas**：自然语言与 Q 对话做 ML 工作流
- **SageMaker training plans**：大模型训练算力预约（指定时间窗/时长/容量）

## 下一步

入门掌握 Studio + Training Job + Endpoint 三件套后，按方向深入：

- **要自动化编排**：读 Pipelines 文档，搭一条 Processing→Train→Eval→Register 流水线
- **要大模型**：转 HyperPod + JumpStart FM，配合 Training plans 预约算力
- **要 AutoML**：试 Autopilot 与 Canvas，对照生成的 Candidate notebook 理解可解释性
- **要数据治理**：Feature Store + Data Wrangler + Clarify 三件套，再上 Model Registry/Model Cards/Model Monitor 闭环
