---
layout: doc
outline: [2, 3]
---

# 集成：MLflow、Spark 商业化与开源对比

> 基于 Databricks Runtime 16 / MLflow 3.x · 核于 2026-08

## 速查

- **MLflow 四件套**：①**Tracking**（实验追踪——记录参数/指标/模型/产物，对比与复现）；②**Projects**（可复现打包——把代码+环境+依赖打包成可运行单元）；③**Models**（模型打包——标准格式 + 多框架部署，model flavor）；④**Model Registry**（模型注册表——版本/stage/审批的全生命周期管理）。开源（Apache 2.0），与 Databricks 深度集成。
- **Tracking 核心 API**：`mlflow.log_params()` / `log_metrics()` / `log_artifacts()` / `start_run()`。每次 run 自动记录代码版本、运行时长、输出。
- **Model flavor**：MLflow Model 是带 `MLmodel` 元文件的目录，可注册多种「flavor」（如 keras/sklearn/pytorch/python_function），部署时按目标环境选 flavor 加载。
- **Model Registry 阶段**：None → Staging → Production → Archived。配合审批（promotion）、版本管理、回滚。
- **Databricks Runtime = 开源 Spark + 增量**：每次发布一个 Runtime 版本（如 16.x），底层对应一个 Spark 版本，叠加 Photon、自适应查询优化、Delta 集成、ML/AI 库（MLflow/PyTorch/XGBoost/Hugging Face）、GPU 驱动。
- **Serverless**：Databricks Serverless SQL/Compute——无固定集群，按查询/作业计费，自动扩缩。免去 all-purpose cluster 的闲置成本，是云原生趋势。
- **定价模型**：①All-Purpose Cluster（交互，DBU 费率高）；②Job Cluster（作业，费率低）；③Serverless（按查询，无固定成本）。DBU（Databricks Unit）是计费单位 = 1 个计算能力单元每小时。
- **与 Snowflake 对照**：Snowflake 是**纯云数仓**（闭源格式、SQL 为主、强 BI/ELT），Databricks 是**Lakehouse**（开放格式 Delta/Parquet、Spark + SQL、强 ML/AI）。两者都做对方领域（Snowflake 加 Snowpark/Iceberg，Databricks 加 SQL 仓库），边界模糊。
- **开源 vs Databricks**：开源路线（Delta Lake OSS + 开源 Spark + 自建 MLflow + 对象存储）零许可费，但无 Photon（性能差）、需自运维、ML/AI 库要自装。Databricks 省心 + 快 + 一体化，但计费 + Photon 厂商锁定。

## 一、MLflow：ML 生命周期四件套

MLflow 是 Databricks 主导的开源 ML 生命周期平台（Apache 2.0），四个组件覆盖 ML 全流程：

### Tracking：实验追踪

```python
import mlflow

mlflow.set_experiment("fraud-detection")
with mlflow.start_run():
    mlflow.log_params({"lr": 0.01, "epochs": 100})
    mlflow.log_metric("auc", 0.92)
    mlflow.sklearn.log_model(model, "model")
    # 自动记录：代码 git 版本、运行时长、依赖版本
```

- **run**：一次模型训练运行，记录 params/metrics/artifacts/tags。
- **experiment**：一组相关 run（如一个研究问题）。
- **UI**：对比多次 run 的指标曲线，选最佳模型——告别「记在记事本里找不到」。
- **自动 log**：集成 sklearn/pytorch/tensorflow 等自动记录，无需手写。

### Projects：可复现打包

MLflow Project = 代码 + 环境（conda/docker）+ 入口命令，打包成可复现运行单元。`mlflow.run("git+repo")` 拉代码 + 装环境 + 跑——让别人的实验一键复现。

### Models：多 flavor 模型打包

```text
my_model/
  ├── MLmodel          ← 元文件（列出 flavors）
  ├── model.pkl        ← sklearn pickle
  ├── conda.yaml       ← 环境定义
  └── requirements.txt
```

- **flavor**：一种「如何加载运行该模型」的方式——如 `sklearn` flavor（`mlflow.sklearn.load_model`）、`python_function` flavor（通用 python 部署）、`onnx` flavor（推理引擎）。
- **部署**：同一模型注册多种 flavor，部署到不同目标（REST API、Spark batch、流式）按需选。

### Model Registry：模型注册表

```text
模型注册到 Registry
  → 版本 1 (Staging) → 审批 → 版本 1 (Production)
  → 版本 2 (Staging) → 审批 → 版本 2 (Production) → 版本 1 归档
```

- **stage**：None → Staging（预发布）→ Production（生产）→ Archived（归档）。
- **审批**：promotion 需人工审批（合规要求）。
- **版本管理**：每次新模型注册是新版本，可回滚。
- **与 CI/CD 集成**：训练 → Registry → 自动部署到 Staging → 测试 → 审批到 Production。

## 二、Databricks Runtime：Spark 商业发行版

Databricks Runtime 是装在每个 cluster 上的「Spark 发行版」，是开源 Spark 的超集：

| 组成 | 说明 |
| --- | --- |
| **开源 Spark** | 核心 Spark（与 Apache 版本对应） |
| **Photon**（可选） | C++ 向量化引擎（闭源） |
| **自适应优化** | AQE（自适应查询执行）、动态分区合并 |
| **Delta 深度集成** | 默认 Delta 表，原生 Z-order/Liquid |
| **ML/AI 库** | MLflow、PyTorch、TensorFlow、XGBoost、Hugging Face Transformers、Ray |
| **GPU 支持** | CUDA 驱动、NCCL、分布式训练 |
| **GenAI 库** | LangChain、向量搜索、模型服务端点（Mosaic AI） |

- **版本号**：Runtime 16.3 LTS（LTS = 长期支持，生产推荐）、16.4（最新功能但可能不稳）。每个版本对应一个 Spark 版本（如 Runtime 16 = Spark 3.5）。
- **ML/Runtime for ML**：Databricks 提供「标准 Runtime」与「Runtime for ML」（预装 ML 库 + GPU）两种镜像。
- **升级**：换 Runtime 版本即换 Spark + 库版本，无需自己装依赖——这是托管的核心便利。

## 三、Serverless 与定价

Databricks 的计算形态与计费：

| 形态 | 说明 | 计费 | 适用 |
| --- | --- | --- | --- |
| **All-Purpose Cluster** | 多人共享交互分析 | DBU 费率**高** | 探索、notebook 开发 |
| **Job Cluster** | 单作业专用，跑完即销 | DBU 费率**低** | 定时 ETL、训练 |
| **Serverless SQL/Compute** | 无固定集群，按查询/作业 | 按查询计费，无闲置 | 突发、不规则负载 |

- **DBU（Databricks Unit）**：计费单位，1 DBU/小时 = 一个计算能力单元。Photon/Serverless 的 DBU 单价更高。
- **成本优化**：①优先用 Job Cluster（费率低）跑生产作业；②用 Serverless 处理突发；③自动终止（autotermination）闲置 cluster；④用 Spot 实例混部降底价。
- **Serverless 趋势**：Databricks 全力推 Serverless（SQL Warehouse Serverless、Compute Serverless），让用户无需关心集群——是云原生的方向。

## 四、与 Snowflake / BigQuery 对照

Databricks 与 Snowflake/BigQuery 都是「云数据平台」，但路线不同：

| 维度 | Databricks（Lakehouse） | Snowflake（云数仓） | BigQuery（云数仓） |
| --- | --- | --- | --- |
| 存储 | 对象存储 + **开放 Delta/Parquet** | **闭源**格式 | **闭源**格式 |
| 计算 | Spark + Photon + SQL Warehouse | 专用虚拟仓库 | 无服务器查询 |
| 强项 | ML/AI/Spark + 开放湖 | SQL 数仓 + ELT + 数据共享 | Serverless SQL + ML（BQML） |
| 跨云 | AWS/Azure/GCP | AWS/Azure/GCP | GCP 原生（跨云 via BigQuery Omni） |
| 生态 | 开源 Spark/Delta/MLflow | Snowpark（Py/Scala） | BQML / Vertex AI |

- **Databricks vs Snowflake** 是当前数据平台的两大路线之争：Databricks 从「湖 + ML」走向数仓（加 Photon/Delta）；Snowflake 从「数仓」走向湖（加 Snowpark/Iceberg 支持）。两者边界越来越模糊。
- **关键差异**：开放 vs 闭源存储格式。Databricks 押注 Delta（开放），Snowflake 押注闭源 + 支持 Iceberg（开放表格式），BigQuery 闭源 + Omni。

## 五、开源 vs Databricks：何时选哪个

- **选开源（自建）**：①预算敏感（零许可费，只付云资源）；②需要完全控制（自定义集群/库版本）；③小规模 / 团队有能力运维；④避免厂商锁定（只用开放 Spark/Delta OSS）。
- **选 Databricks**：①要性能（Photon 比开源 Spark 快数倍）；②要省心（托管 + Serverless + 一体化 ML/AI）；③团队大、跨 BI/ML/AI 协作（Unity Catalog 统一治理）；④愿意为便利付许可费。

开源路线的技术栈：开源 Spark（on K8s/YARN）+ Delta Lake OSS + 开源 MLflow（自部署）+ 对象存储。能用但无 Photon、需自运维、ML/AI 库要自装。

## 下一步

掌握了 MLflow 与商业化对比后，可进入 [参考](../reference) 速查 Delta Lake 特性、Photon 性能、MLflow API、Databricks vs 开源 Spark vs Snowflake 对比与易错点。
