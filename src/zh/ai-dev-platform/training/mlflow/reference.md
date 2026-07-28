---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MLflow 官方文档 + GitHub Releases（3.x）+ Python SDK API 整理，对照稳定版 3.14.0

## 速查

- **安装**：`pip install mlflow` / `pip install "mlflow[extras]"`
- **启动 UI**：`mlflow ui --host 0.0.0.0 --port 5000`
- **核心 API**：`mlflow.start_run` / `log_param` / `log_metric` / `log_artifact` / `autolog`
- **模型**：`mlflow.&lt;flavor&gt;.log_model` / `mlflow.&lt;flavor&gt;.load_model` / `mlflow.pyfunc.load_model`
- **Registry**：`mlflow.register_model` / `MlflowClient` / `transition_model_version_stage` / `set_registered_model_alias`
- **Projects**：`MLproject` 文件 + `mlflow run`
- **Deployments**：`mlflow deployments start`
- **Evaluate**：`mlflow.evaluate(model, data, model_type=, extra_metrics=)`
- **环境变量**：`MLFLOW_TRACKING_URI` / `MLFLOW_S3_ENDPOINT_URL` / `MLFLOW_ARTIFACT_URI` / `MLFLOW_EXPERIMENT_NAME`
- **版本**：稳定版 **3.14.0**（2026-06-17）；Python ≥ 3.9

## 组件全景

| 组件 | 职责 | 关键 API |
| --- | --- | --- |
| **Tracking** | 记录实验（param/metric/artifact） | `start_run` / `log_*` / `autolog` |
| **Projects** | 可复现运行的可打包格式 | `MLproject` / `mlflow run` |
| **Models** | 标准化模型打包（flavor） | `log_model` / `load_model` |
| **Model Registry** | 中央模型仓库（版本/阶段/标签） | `register_model` / `MlflowClient` |
| **Recipes / Pipelines** | 结构化可复用流水线 | `mlflow.recipes.*` |
| **Deployments** | 统一推理服务 / LLM 网关 | `mlflow deployments` |
| **Evaluate** | 模型与 LLM/Agent 评测 | `mlflow.evaluate` |
| **GenAI**（3.x） | LLM/Agent 评测 + Tracing + Prompt | `mlflow.genai` |

## Tracking API 速查

| API | 说明 |
| --- | --- |
| `mlflow.set_experiment("name")` | 设置/创建实验 |
| `mlflow.start_run(run_name=, nested=, experiment_id=)` | 创建 run（推荐用 `with`） |
| `mlflow.log_param(key, value)` / `log_params(dict)` | 记录参数（标量） |
| `mlflow.log_metric(key, value, step=)` | 记录指标（可时序） |
| `mlflow.log_artifact(local_path)` / `log_artifacts(dir)` | 记录产物文件 |
| `mlflow.log_input(dataset, context=)` | 记录输入数据集（血缘） |
| `mlflow.autolog()` / `mlflow.&lt;fw&gt;.autolog(...)` | 自动记录 |
| `mlflow.end_run()` | 结束 run（`with` 自动调用） |
| `mlflow.search_runs(experiment_ids, filter_string=, order_by=)` | 查询 run |

## Models API 速查

| API | 说明 |
| --- | --- |
| `mlflow.&lt;flavor&gt;.log_model(model, artifact_path, registered_model_name=, signature=, input_example=)` | 记录模型（自动含 pyfunc） |
| `mlflow.&lt;flavor&gt;.save_model(model, path, ...)` | 保存到本地目录 |
| `mlflow.&lt;flavor&gt;.load_model(model_uri)` | 按具体 flavor 加载 |
| `mlflow.pyfunc.load_model(model_uri)` | 通用 pyfunc 加载（统一 `predict`） |
| `mlflow.models.infer_signature(input, output)` | 推断输入输出 schema |
| `mlflow.pyfunc.PythonModel`（继承） | 自定义 pyfunc（实现 `predict` / `load_context`） |

## Model URI 形态

| URI | 含义 |
| --- | --- |
| `runs:/&lt;run_id&gt;/<artifact_path>` | 指向某次 run 的模型 |
| `models:/&lt;name&gt;/<stage>` | 某 stage 的最新版本 |
| `models:/&lt;name&gt;@v<N>` | 指定版本号 |
| `models:/&lt;name&gt;@<alias>` | 指定别名 |

## Model Registry API

| API | 说明 |
| --- | --- |
| `mlflow.register_model(model_uri, name)` | 注册模型版本 |
| `client.create_registered_model(name)` | 创建模型组 |
| `client.create_model_version(name, source, run_id=)` | 创建版本 |
| `client.transition_model_version_stage(name, version, stage)` | 切换 stage（None/Staging/Production/Archived） |
| `client.set_registered_model_alias(name, alias, version)` | 设置别名 |
| `client.delete_registered_model_alias(name, alias)` | 删除别名 |
| `client.get_latest_versions(name, stages=)` | 取某 stage 最新版本 |
| `client.get_model_version_by_alias(name, alias)` | 按别名取版本 |
| `client.set_registered_model_tag` / `set_model_version_tag` | 打标签 |
| `client.search_model_versions(filter_string=)` | 搜索版本 |

## autolog 支持的框架

| 框架 | 模块 |
| --- | --- |
| Scikit-learn | `mlflow.sklearn` |
| PyTorch（Lightning） | `mlflow.pytorch` |
| TensorFlow / Keras | `mlflow.tensorflow` / `mlflow.keras` |
| XGBoost | `mlflow.xgboost` |
| LightGBM | `mlflow.lightgbm` |
| Paddle | `mlflow.paddle` |
| PySpark | `mlflow.pyspark` |
| FastAI | `mlflow.fastai` |
| CatBoost | `mlflow.catboost` |
| 其它（H2O/MXNet/ONNX/Prophet/Statsmodels/Spacy） | 各自模块 |

## Model Flavor 列表

| flavor | 框架 | 是否含 pyfunc |
| --- | --- | --- |
| `python_function`（pyfunc） | 通用基础 | 是（本身即基础） |
| `sklearn` | scikit-learn | 是 |
| `pytorch` | PyTorch | 是 |
| `tensorflow` | TF/Keras | 是 |
| `xgboost` | XGBoost | 是 |
| `lightgbm` | LightGBM | 是 |
| `onnx` | ONNX | 是 |
| `h2o` | H2O.ai | 是 |
| `statsmodels` | Statsmodels | 是 |
| `spark` | Spark MLlib | 是 |
| 自定义 | 继承 `PythonModel` | 是 |

## Projects（MLproject）字段

| 字段 | 说明 |
| --- | --- |
| `name` | 项目名 |
| `conda_env` / `docker_env` | 环境（conda yaml 或 docker image） |
| `entry_points.&lt;name&gt;.parameters` | 入口参数（type + default） |
| `entry_points.&lt;name&gt;.command` | 执行命令（支持 `{param}` 占位） |

## Deployments / Evaluate

| API | 说明 |
| --- | --- |
| `mlflow deployments start --host --port` | 启动 Deployments Server |
| `mlflow.deployments.set_endpoint / get_endpoint_client` | 管理 endpoint |
| `mlflow.evaluate(model, data, targets=, model_type=, extra_metrics=, evaluators=)` | 评测传统模型 / LLM |
| `mlflow.metrics.toxicity()` / `genai.answer_relevance(...)` | 内置 LLM judge 指标 |
| `mlflow.genai.*`（3.x） | GenAI 评测、Tracing、Prompt 管理 |

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `MLFLOW_TRACKING_URI` | Tracking Server 地址（`http://` / `databricks` / `file://`） |
| `MLFLOW_EXPERIMENT_NAME` | 默认实验名 |
| `MLFLOW_ARTIFACT_URI` | 默认 artifact 根路径 |
| `MLFLOW_S3_ENDPOINT_URL` | 自定义 S3 兼容端点（MinIO 等） |
| `MLFLOW_TRACKING_INSECURE_TLS` | 跳过 TLS 校验（调试用） |
| `MLFLOW_RUN_ID` | 复用已有 run（少用） |

## 近期版本要点

| 版本 | 关键变化 |
| --- | --- |
| 2.x（长期） | Tracking / Models / Registry 成熟；autolog 框架扩充 |
| 3.0 | 重心扩展到 GenAI：`mlflow.genai`、Tracing、Prompt 管理、AI Observability；注册表语义演进 |
| 3.6 | AI Observability、Experiment UI、Agent Evaluation、Deployment 增强 |
| 3.14（2026-06） | **Registry versions** 改进、新 settings 工具、structured output 支持 |

## 与竞品对照

| 维度 | MLflow | W&B | SageMaker |
| --- | --- | --- | --- |
| 开源 / 商业 | 开源（Apache 2.0），可自托管 | SaaS 为主，有自托管 server | AWS 闭源托管 |
| 强项 | Tracking + Registry + flavor 部署 | 实验可视化 + 协作 Report | 端到端 ML（训练→部署→监控） |
| LLM 评测 | `mlflow.genai` / `evaluate` | Weave | Bedrock 评测 |
| 自托管成本 | 中（要管 DB + artifact） | 低（SaaS）/ 中（自托管 server） | 不适用（AWS 托管） |

## 官方资源

- [MLflow 官方文档](https://mlflow.org/docs/latest/)
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking/)
- [MLflow Models](https://mlflow.org/docs/latest/models/)
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry/)
- [MLflow Autolog](https://mlflow.org/docs/latest/tracking/autolog/)
- [GitHub Releases](https://github.com/mlflow/mlflow/releases)
- [MLflow 示例](https://github.com/mlflow/mlflow/tree/master/examples)
