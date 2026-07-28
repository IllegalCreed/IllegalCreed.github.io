---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Amazon SageMaker AI 官方开发者指南（Training / Distributed Training / Pipelines / HyperPod / Model Deployment / Model Monitor / MLOps 章节）+ 2024-12 更名公告与 re:Invent 2024 新功能编写

## 速查

- **训练脚本约定**：入口 `train.py`，数据读 `/opt/ml/input/data/&lt;channel&gt;/`，模型产物写 `/opt/ml/model/`，超参经 `hyperparameters` 传入
- **分布式**：`instance_count>1` 数据并行；`distribution={"torch_distributed": {...}}` 走 SMDataParallel/ Torchrun；大模型转 HyperPod
- **Spot 训练**：`use_spot_instances=True` + `max_run` + `max_wait`，配 `checkpoint_s3_uri` 续训
- **Processing Job**：用于预处理/特征工程/评估，自带 SKLearn/Spark 容器
- **Pipeline 步骤**：`ProcessingStep` / `TrainingStep` / `TuningStep` / `AutoMLStep` / `TransformStep` / `ModelStep` / `RegisterModel` / `ConditionStep` / `LambdaStep` / `CallbackStep` / `FailStep`
- **端点类型**：实时 Endpoint（持久实例）/ 多模型端点 / 多容器端点 / 异步端点 / Serverless Endpoint / Shadow Tests
- **模型注册**：`ModelPackageGroup` 管理一组版本；`RegisterModel` 把模型写入注册表并触发审批
- **特征仓库**：Online Store（低延迟实时推理）+ Offline Store（S3，训练用）；`Ingest` 写、`get_record`/`create_dataset` 读
- **大模型**：HyperPod（常驻集群 + Slurm/EKS + NeMo/Neuronx）；Training Plans 预约算力
- **监控**：Model Monitor 自动调度漂移检测；Shadow Tests 灰度比对；Inference Recommender 选实例
- **治理**：Model Cards / Lineage Tracking / Experiments / Clarify（偏置+可解释）

## 训练深入：脚本契约与分布式

### 训练容器路径契约

SageMaker 拉起训练 EC2 后，容器内路径是固定契约：

| 路径 | 用途 |
| --- | --- |
| `/opt/ml/input/data/&lt;channel&gt;/` | 各 channel 数据（train/test/validation），SDK 自动从 S3 下载 |
| `/opt/ml/input/config/hyperparameters.json` | 超参 dict |
| `/opt/ml/input/config/inputdataconfig.json` | 各 channel 的 S3 路径与 ContentType |
| `/opt/ml/model/` | 训练产物，结束自动打包为 `model.tar.gz` 上传 S3 |
| `/opt/ml/output/` | 日志、failure 文件 |
| `/opt/ml/checkpoints/` | checkpoint（如开启 `checkpoint_s3_uri`） |

自定义脚本按这套约定读写即可，无需关心实例细节。

### 分布式训练三档

```python
# ① 数据并行：单机多卡或多机，SDK 内置 SMDataParallel（MPI/Horovod 风格）
estimator = PyTorch(
    ...,
    instance_count=4,
    instance_type="ml.p4d.24xlarge",
    distribution={"smdistributed": {"dataparallel": {"enabled": True}}},
)

# ② 模型并行：超大模型放不下单卡，切分到多卡（SageMaker Model Parallel）
estimator = PyTorch(
    ...,
    distribution={
        "smdistributed": {"modelparallel": {
            "enabled": True,
            "parameters": {"partitions": 4, "micro_batches": 4, "placement_strategy": "spread"},
        }}
    },
)

# ③ 原生 PyTorch DDP（推荐新项目）
estimator = PyTorch(
    ...,
    distribution={"torch_distributed": {"enabled": True}},
)
```

LLM 量级（几十亿至上千亿参数）建议直接转 **HyperPod**：常驻集群 + Slurm 或 EKS，配 NVIDIA NeMo / Neuronx Distributed Training 适配器，HyperPod recipes 给出端到端训练配方。

### Spot 实例续训

```python
estimator = PyTorch(
    ...,
    use_spot_instances=True,
    max_run=86400,            # 最长跑 24 小时
    max_wait=172800,          # Spot 最多等 48 小时
    checkpoint_s3_uri=f"s3://{bucket}/ckpt/",  # 必须配才能续训
    checkpoint_local_path="/opt/ml/checkpoints",
)
```

Spot 中断时容器被回收，下次启动从 S3 拉回 checkpoint 续训。计费上 Spot 最高可省 90%，但 `max_wait` 必须给——否则被中断的任务会一直挂着。

## Processing Job：不止预处理

```python
from sagemaker.sklearn.processing import SKLearnProcessor
from sagemaker.processing import ProcessingInput, ProcessingOutput

processor = SKLearnProcessor(
    framework_version="1.2-1",
    role=role,
    instance_type="ml.m5.xlarge",
    instance_count=1,
)
processor.run(
    code="preprocess.py",
    inputs=[ProcessingInput(source="s3://.../raw/", destination="/opt/ml/processing/input")],
    outputs=[
        ProcessingOutput(source="/opt/ml/processing/train", output_name="train"),
        ProcessingOutput(source="/opt/ml/processing/test",  output_name="test"),
    ],
)
```

Processing Job 也常用 Spark（`PySparkProcessor`）跑大数据 ETL，或用作模型评估 step（产出 metrics.json 供 ConditionStep 判断是否注册）。

## Pipelines 实战：完整 MLOps 流水线

```python
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import ProcessingStep, TrainingStep, TransformStep, ConditionStep
from sagemaker.workflow.step_collections import RegisterModel
from sagemaker.workflow.conditions import ConditionLessThanOrEqualTo
from sagemaker.workflow.functions import JsonGet

# 1. 数据预处理
step_process = ProcessingStep(name="Preprocess", processor=processor, ...)

# 2. 训练
step_train = TrainingStep(name="Train", estimator=estimator, inputs={...})

# 3. 评估（Processing 产出 metrics.json）
step_eval = ProcessingStep(name="Evaluate", processor=eval_processor, ...)

# 4. 条件：rmse < 阈值才注册
step_cond = ConditionStep(
    name="CheckRMSE",
    conditions=[ConditionLessThanOrEqualTo(
        left=JsonGet(step_name="Evaluate", property_file="metrics", json_path="rmse"),
        right=0.5,
    )],
    if_steps=[RegisterModel(
        name="Register",
        estimator=estimator,
        model_data=step_train.properties.ModelArtifacts.S3ModelArtifacts,
        content_types=["text/csv"],
        response_types=["text/csv"],
        model_package_group_name="MyModelGroup",
        approval_status="Approved",
    )],
    else_steps=[FailStep(name="RMSETooHigh")],
)

pipeline = Pipeline(name="MLOpsPipeline", steps=[step_process, step_train, step_eval, step_cond])
pipeline.upsert(role_arn=role)
execution = pipeline.start()
```

要点：

- 每一步的输出可被下一步用 `properties` 引用（`step_train.properties.ModelArtifacts.S3ModelArtifacts`），无需硬编码 S3 路径
- **ConditionStep** 是 Model Registry 审批的常见配套：质量达标才注册，未达标进 `FailStep` 或回滚
- `RegisterModel` 的 `approval_status="Approved"` 可自动放行，否则需人工在 Studio Model Registry 面板点 Approve
- Pipeline 跨账号部署：模型注册到 A 账号，B 账号 `create_model` + `deploy` 拉镜像部署

## HyperPod：大模型常驻集群

HyperPod 不是按需 Job，而是**常驻的弹性集群**，专门服务 LLM/扩散模型这类长周期训练：

- 集群基础：Slurm（HPC 风格）或 Amazon EKS（K8s 风格）
- 框架适配器：基于 **NVIDIA NeMo** 与 **Neuronx Distributed Training**
- **HyperPod recipes**：端到端训练配方，可在 HyperPod 或普通 Training Job 内跑
- **HyperPod task governance**：EKS 集群跨团队/项目的算力配额与利用率可视化
- **HyperPod in Studio**：Studio 内直接发任务、看集群详情与硬件指标
- **Training Plans**：算力预约——指定时间窗/时长/最大算力，自动管基础设施与故障恢复

故障恢复是 HyperPod 的核心卖点：节点宕机会自动替换并从最近 checkpoint 续训，避免几十小时训练白跑。

## 推理部署：六种形态

| 形态 | API | 适用场景 |
| --- | --- | --- |
| 实时 Endpoint | `estimator.deploy(...)` | 在线低延迟，持久实例 |
| 多模型端点 | MultiModelEndpoint | 一台实例托管多个模型，按需加载 |
| 多容器端点 | MultiContainerEndpoint | 一台实例跑多个容器，按流量路由 |
| 异步端点 | Async Endpoint | 大模型长尾推理，请求入队列 |
| Serverless Endpoint | ServerlessInferenceConfig | 突发/稀疏流量，按调用计费，缩到 0 |
| Batch Transform | Transformer | 大批量离线，无持久端点 |

**Shadow Tests** 把候选部署与当前线上并行跑，对比性能再决定是否切流；**Inference Recommender** 跑负载测试给出最优实例类型与配置；**Neo** 编译模型一次，云端 + 端侧通用，**Edge Manager** 管端侧舰队。

## 模型治理四件套

- **Model Registry**：`ModelPackageGroup` 管版本，`approval_status` 控审批，跨账号部署时 A 注册、B 拉取
- **Feature Store**：`FeatureGroup` 定义特征 schema，Online Store 写入毫秒级、读取微秒级；Offline Store 自动落 S3 供训练 `create_dataset`
- **Model Monitor**：默认每小时采一批线上请求与预测，与基线数据比对，发现数据漂移/质量偏差触发告警
- **Model Cards**：把模型用途、训练数据、性能、风险等元信息固化成文档，满足审计与合规汇报

## 与 Bedrock 的边界

SageMaker AI 负责「自己训、自己部署」（包括 Fine-tune FM），**Amazon Bedrock** 才是「直接调用托管 FM API」（Claude、Titan、Llama 等）的入口。GenAI 应用的常规分工：Bedrock 出 FM 推理 API，SageMaker AI 出训练/Fine-tune/自定义模型部署；下一代 SageMaker 已把 Bedrock 纳入统一平台。

## 陷阱与最佳实践

- **冷启动慢**：Training Job 拉镜像几十秒到几分钟，迭代前先用本地小数据走通逻辑再上 SageMaker
- **Spot 中断丢进度**：必须配 `checkpoint_s3_uri`，且训练脚本里要实现「检测 checkpoint → load → 续训」
- **Endpoint 计费持续**：实时端点不删就一直计费，长期不用切 Batch Transform 或 Serverless
- **目录契约别写错**：模型不写 `/opt/ml/model/` 会导致 `deploy` 时 `model.tar.gz` 为空
- **Pipelines 输出引用**：尽量用 `step.properties.X`，不要硬编码 S3 key（Pipeline 重跑会生成新路径）
- **命名分裂**：注意区分「SageMaker AI」（ML，旧 SageMaker）与下一代「SageMaker」（含 Lakehouse/Catalog/Unified Studio），文档搜索时旧文档标题仍是 SageMaker
