---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MLflow 官方文档（mlflow.org/docs/latest，Tracking / Models / Model Registry / Autolog 章节）编写，对照当前稳定版 3.14.0（2026-06-17）

## 速查

- **安装**：`pip install mlflow`（带 UI：`pip install mlflow[extras]`）
- **启动 Tracking Server**：`mlflow ui`（默认 `http://127.0.0.1:5000`），数据落 `./mlruns`
- **核心数据模型**：**experiment**（实验）→ **run**（一次执行）→ **param**（参数）/ **metric**（指标，可时序）/ **artifact**（任意文件：模型、图、配置）
- **autolog**：`mlflow.autolog()` 一行，自动捕获 sklearn/PyTorch/XGBoost/TensorFlow/Keras/LightGBM/PySpark 等的训练信息
- **手动记录**：`mlflow.log_param` / `log_metric` / `log_artifact` / `log_params` / `log_metrics`
- **运行上下文**：`with mlflow.start_run(run_name=...) as run:` 自动管理 run 生命周期
- **模型 flavor**：`python_function`（pyfunc）是基础 flavor；sklearn/pytorch/tensorflow 等在其上叠加，均含 pyfunc
- **记录模型**：`mlflow.&lt;flavor&gt;.log_model(model, "name")`，例如 `mlflow.sklearn.log_model`
- **加载模型**：`mlflow.&lt;flavor&gt;.load_model("runs:/<run_id>/name")` 或通用 `mlflow.pyfunc.load_model(...)`
- **Model Registry**：`mlflow.register_model("runs:/&lt;id&gt;/model", "MyModel")`，版本化 + Stage + 标签
- **版本**：稳定版 **3.14.0**（2026-06-17）；Python ≥ 3.9

## 安装与启动 Tracking Server

```bash
pip install mlflow                # 或 pip install "mlflow[extras]" 带额外依赖
mlflow ui --host 0.0.0.0 --port 5000   # 启动 UI，默认数据存 ./mlruns
```

本地实验默认数据落盘到 `./mlruns/`（experiment → run → artifacts 的目录结构）。生产环境通常自托管 Tracking Server，配 PostgreSQL（元数据）+ S3/GCS/Azure Blob（artifact）。

## 第一个实验：autolog 三行

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

mlflow.autolog()                    # ① 一行开启自动记录

X, y = load_iris(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=42)

with mlflow.start_run(run_name="rf-iris"):   # ② 自动创建 run
    clf = RandomForestClassifier(n_estimators=100, max_depth=3)
    clf.fit(X_tr, y_tr)              # ③ fit 触发 autolog：param/metric/model 全部落盘
    # mlflow.autolog 已自动 log 了 accuracy、模型、依赖等
```

打开 `http://127.0.0.1:5000` 即可看到这次 run 的参数、指标、模型产物。

## 手动记录：精确控制

autolog 抓不到的自定义内容用手动 API：

```python
with mlflow.start_run(run_name="manual-run"):
    # 参数（一次性的标量）
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_params({"batch_size": 64, "optimizer": "adam"})

    # 指标（可多次记录，自动按时序绘图）
    for step in range(100):
        mlflow.log_metric("train_loss", compute_loss(step), step=step)

    # 产物（任意文件）
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.log_artifacts("./outputs/")   # 整个目录

    # 模型
    mlflow.sklearn.log_model(clf, "model", registered_model_name="IrisClf")
```

要点：

- **param vs metric**：param 是配置（一次性、唯一），metric 是测量值（可多次记，带 step 形成时序曲线）
- **artifact 任意**：图片、JSON、CSV、二进制都行，UI 直接预览常见格式
- **run 生命周期**：`with mlflow.start_run()` 自动 `end_run()`；不显式 `end_run` 的 run 会标记为活跃

## Models 与 Flavor

MLflow Model 是一个**标准目录结构**（`MLmodel` 元数据 + 权重 + 依赖），由 **flavor** 描述如何加载：

```python
# 记录（带 pyfunc 基础 flavor）
mlflow.sklearn.log_model(clf, "model")

# 用具体 flavor 加载（保留原生对象）
clf = mlflow.sklearn.load_model("runs:/<run_id>/model")

# 用通用 pyfunc 加载（统一 predict，不关心底层框架）
pyfunc_model = mlflow.pyfunc.load_model("runs:/<run_id>/model")
preds = pyfunc_model.predict(X_te)
```

**`python_function`（pyfunc）是所有 Python 模型的基础 flavor**——任何被记录的 Python 模型都必须可被 `mlflow.pyfunc.load_model` 加载。框架 flavor（sklearn/pytorch/tensorflow...）在其上叠加，记录时自动带上 pyfunc。这让下游部署工具只需懂 pyfunc 一个接口，不必为每个框架写适配。

## Model Registry：版本与治理

```python
# 把一次 run 的模型注册到 Registry
mv = mlflow.register_model(
    model_uri="runs:/<run_id>/model",
    name="IrisClassifier",
)
print(mv.version)   # 1, 2, 3... 自增

# 转换阶段
from mlflow.tracking import MlflowClient
client = MlflowClient()
client.transition_model_version_stage(
    name="IrisClassifier",
    version=1,
    stage="Production",     # None / Staging / Production / Archived
)
client.set_registered_model_tag("IrisClassifier", "task", "classification")
```

Registry 提供：**版本化**（model version 自增）、**Stage**（None/Staging/Production/Archived）、**标签与别名**（alias 如 `champion`/`challenger`）、**审批**（Databricks 托管版有工作流，开源版靠约定）。

## 下一步

入门掌握 Tracking + autolog + Models + Registry 后，按方向深入：

- **要可复现运行**：读 Projects 章节，把代码 + 环境打成可复现包
- **要做 LLM 评测**：转 `mlflow.genai` / `mlflow.evaluate`，写评测数据集与 scorer
- **要结构化流水线**：看 Recipes / Pipelines（注意官方定位在演进）
- **要部署**：用 Deployments Server 做统一推理网关，或把 pyfunc 模型扔到 SageMaker / KServe / Ray Serve
