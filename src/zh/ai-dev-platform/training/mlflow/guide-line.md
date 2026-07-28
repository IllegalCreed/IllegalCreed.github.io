---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MLflow 官方文档（Tracking / Models / Model Registry / Projects / Recipes / Deployments / Evaluate / GenAI 章节）+ 3.x Release Notes 编写，对照稳定版 3.14.0

## 速查

- **八个组件**：Tracking / Projects / Models / Model Registry / Recipes / Pipelines / Deployments / Evaluate
- **autolog 精控**：`mlflow.&lt;framework&gt;.autolog(...)` 比全局 `mlflow.autolog()` 粒度更细，可关 model 记录只留 param/metric
- **嵌套 run**：`mlflow.start_run(nested=True)` 在父 run 内开子 run，适合超参搜索 / k-fold
- **autolog 支持框架**：Keras/TensorFlow、LightGBM、Paddle、PySpark、PyTorch（Lightning）、Scikit-learn、XGBoost 等
- **flavor 体系**：pyfunc 是基础；框架 flavor（sklearn/pytorch/tensorflow/xgboost/lightgbm/h2o/statsmodels/onnx...）叠加 pyfunc
- **自定义 pyfunc**：继承 `mlflow.pyfunc.PythonModel`，实现 `predict`，可封装预处理+多模型+后处理
- **Registry 阶段**：None / Staging / Production / Archived；别名（alias）比 stage 更灵活
- **Registry 版本查询**：`MlflowClient.get_latest_versions(name, stages=["Production"])`
- **Model URI 形态**：`runs:/&lt;id&gt;/<name>` / `models:/&lt;name&gt;/<stage>` / `models:/&lt;name&gt;@v3` / `models:/&lt;name&gt;@champion`
- **Projects 可复现**：`MLproject` 文件定义入口与环境（conda/docker），`mlflow run` 一键复现
- **Deployments Server**：统一推理端点 + LLM 网关，支持 OpenAI/Cohere/自托管模型
- **GenAI 评测**：`mlflow.genai` / `mlflow.evaluate`：数据集 + 评估指标 + judge LLM

## Tracking 进阶

### autolog 精细控制

```python
import mlflow.sklearn

# 只针对一个框架，且关掉模型记录（只想看指标）
mlflow.sklearn.autolog(
    log_models=False,              # 不记录完整模型
    log_input_examples=True,       # 记录输入样例（用于 schema 推断）
    log_model_signatures=True,     # 自动推断输入输出 schema
    max_tuning_runs=5,             # GridSearch/RandomSearch 记录的子 run 数
)
```

autolog 支持的框架（官方）：Keras/TensorFlow、LightGBM、Paddle、PySpark、PyTorch（Lightning）、Scikit-learn、XGBoost。`mlflow.autolog()` 会对所有已安装的上述框架生效；想只对某个框架，用对应的 `mlflow.&lt;fw&gt;.autolog()`。

### 嵌套 run 与搜索

```python
with mlflow.start_run(run_name="hpo-parent"):
    for lr in [0.1, 0.01, 0.001]:
        with mlflow.start_run(run_name=f"lr={lr}", nested=True):
            model = train(lr=lr)
```

父 run 在 UI 里以树形展开子 run，适合超参搜索 / k-fold / 多种子实验。

### 输入输出 Schema 与签名

```python
from mlflow.models import infer_signature

signature = infer_signature(X_tr, clf.predict(X_tr))   # 自动推断
mlflow.sklearn.log_model(
    clf, "model",
    signature=signature,
    input_example=X_tr[:5],          # 记录样例，便于部署时校验
)
```

带 signature 的模型在被 Deployments 加载时会做输入校验，避免线上喂错格式。

## Models 与 Flavor 深入

### 内置 flavor 一览

| flavor | 框架 | 加载入口 |
| --- | --- | --- |
| `python_function`（pyfunc） | 通用基础 | `mlflow.pyfunc.load_model` |
| `sklearn` | scikit-learn | `mlflow.sklearn.load_model` |
| `pytorch` | PyTorch | `mlflow.pytorch.load_model` |
| `tensorflow` | TF/Keras | `mlflow.tensorflow.load_model` |
| `xgboost` | XGBoost | `mlflow.xgboost.load_model` |
| `lightgbm` | LightGBM | `mlflow.lightgbm.load_model` |
| `onnx` | ONNX | `mlflow.onnx.load_model` |
| `h2o` | H2O.ai | `mlflow.h2o.load_model` |
| `statsmodels` | Statsmodels | `mlflow.statsmodels.load_model` |
| `spark` | Spark MLlib | `mlflow.spark.load_model` |

### 自定义 pyfunc：封装完整推理管线

```python
import mlflow.pyfunc

class PreprocessBundle(mlflow.pyfunc.PythonModel):
    def __init__(self, tokenizer, base_model_uri):
        self.tokenizer = tokenizer
        self.base_model_uri = base_model_uri

    def load_context(self, context):
        # 在加载时初始化重对象（模型、词表）
        self.model = mlflow.pyfunc.load_model(self.base_model_uri)

    def predict(self, context, model_input, params=None):
        # 封装：预处理 → 基模型 → 后处理
        tokens = self.tokenizer(model_input)
        raw = self.model.predict(tokens)
        return self.postprocess(raw)

mlflow.pyfunc.log_model(
    artifact_path="bundle",
    python_model=PreprocessBundle(...),
    artifacts={"tokenizer.json": "..."},
)
```

好处：把「预处理 + 模型 + 后处理」封装成一个 pyfunc，下游部署只调一次 `predict`，不暴露内部多模型结构。

## Model Registry 治理模式

### 版本、Stage、Alias

```python
from mlflow.tracking import MlflowClient
client = MlflowClient()

# 注册新版本
client.create_registered_model("MyModel")
client.create_model_version("MyModel", source="runs:/<id>/model")

# Stage 转换（传统）
client.transition_model_version_stage("MyModel", version=3, stage="Production")

# Alias（3.x 推荐，更灵活，可同名指向不同版本）
client.set_registered_model_alias("MyModel", "champion", version=3)
client.set_registered_model_alias("MyModel", "challenger", version=4)

# 查询
prod = client.get_latest_versions("MyModel", stages=["Production"])
champ = client.get_model_version_by_alias("MyModel", "champion")
```

**Alias 相对 Stage 的优势**：Stage 是互斥枚举（一个版本只能在一个 stage），alias 是任意键值（可有 champion/challenger/canary 等多个并行），更适合金丝雀/AB/灰度场景。

### Model URI 形态

| URI | 含义 |
| --- | --- |
| `runs:/&lt;run_id&gt;/<name>` | 指向某次 run 的模型 |
| `models:/&lt;name&gt;/<stage>` | 指向某 stage 的最新版本（如 `models:/MyModel/Production`） |
| `models:/&lt;name&gt;@v3` | 指定版本号 |
| `models:/&lt;name&gt;@champion` | 指定 alias |

## Projects：可复现运行

`MLproject` 文件定义入口与环境：

```yaml
# MLproject
name: my-project
conda_env: conda.yaml        # 或 docker_env
entry_points:
  train:
    parameters:
      lr: {type: float, default: 0.01}
      epochs: {type: int, default: 10}
    command: "python train.py --lr {lr} --epochs {epochs}"
```

```bash
mlflow run . -P lr=0.001 -P epochs=50     # 复现：拉环境 → 跑入口 → 记 run
mlflow run git@github.com:org/repo.git    # 直接跑远程仓库
```

Projects 把「代码 + 环境 + 入口」打包，保证他人能复现你的 run。

## Deployments：统一推理网关

```bash
mlflow deployments start --host 0.0.0.0 --port 7000
```

Deployments Server 既可服务本地 pyfunc 模型（统一 `/invocations` 端点），也可作为 **LLM 网关**——把 OpenAI / Cohere / Anthropic / 自托管模型抽象成统一 API，配合 `mlflow.deployments` SDK 调用与 `mlflow.genai` 评测。

## Evaluate / GenAI：LLM 与 Agent 评测

```python
import mlflow

# 传统模型评测
result = mlflow.evaluate(
    model="runs:/<id>/model",
    data=test_df,
    targets="label",
    model_type="classifier",
    extra_metrics=[...],
)

# LLM 评测（3.x）
evaluate_result = mlflow.evaluate(
    model=llm_predict_fn,
    data=eval_df,                    # 含 prompt / expected 等
    model_type="text-summarizer",    # 或 "question-answering" / "text"
    evaluators="default",
    extra_metrics=[
        mlflow.metrics.toxicity(),
        mlflow.metrics.genai.answer_relevance(...),   # judge LLM 评分
    ],
)
```

3.x 把 LLM/Agent 评测作为一等公民：内置 toxicity、faithfulness、answer_relevance 等 judge 指标，配合 Tracing 把 Agent 的每一步调用都串起来。

## 自托管 Tracking Server 拓扑

生产自托管典型拓扑：

- **Tracking Server**：无状态进程，多副本 + 负载均衡
- **后端存储**：PostgreSQL / MySQL（存 experiment/run/metric/param 元数据）
- **Artifact 存储**：S3 / GCS / Azure Blob（存模型、图片等大文件）
- **鉴权**：反向代理（nginx/istio）+ OIDC，或用 Databricks 托管 MLflow 免鉴权
- **环境变量**：`MLFLOW_TRACKING_URI`、`MLFLOW_S3_ENDPOINT_URL`、`MLFLOW_ARTIFACT_URI`

## 陷阱与最佳实践

- **不要把 param 当 metric**：param 一次性、唯一，重复 `log_param` 同名不同值会被忽略；时序数据用 `log_metric`
- **autolog 关 model 谨慎**：默认会记录完整模型（含依赖），大数据集/大模型可能拖慢；用 `log_models=False` 只留指标
- **Stage 与 Alias 别混用**：3.x 推荐 alias；若团队仍用 stage，统一约定，避免同一版本在两套体系打架
- **`end_run` 必须调用**：`with mlflow.start_run()` 最安全；裸调用 `start_run` 后忘 `end_run` 会留「幽灵 run」
- **依赖大小**：`log_model` 默认记录 `requirements.txt`，但 conda/docker 环境需显式指定，否则复现失败
- **artifact 路径权限**：自托管时 S3 bucket 的 IAM 权限要给到 Server 进程，否则 `log_artifact` 静默失败
