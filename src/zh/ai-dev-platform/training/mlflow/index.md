---
layout: doc
---

# MLflow

MLflow 是 Databricks 主导、Apache 2.0 开源的 **ML/AI 生命周期管理平台**（官方定位「Open Source AI Platform for Agents, LLMs & Models」），围绕「实验可复现、模型可治理、部署可落地」三大诉求提供一套与框架/云厂商解耦的工具。其抽象体系由若干**组件（Components）**构成：**Tracking**（记录实验的参数、指标、产物）、**Projects**（可复现运行的可打包格式）、**Models**（标准化的模型打包格式，由 **flavor** 描述下游如何加载）、**Model Registry**（中央模型仓库，版本+阶段+标签+审批）、**Recipes / Pipelines**（结构化可复用流水线，原 MLflow Pipelines）、**Deployments**（统一推理服务/LLM 网关抽象）、**Evaluate**（模型与 LLM/Agent 的评测框架）。Tracking 的核心数据模型是 **experiment → run → metric / param / artifact**，配合 **autolog**（一行 `mlflow.autolog()` 自动捕获 PyTorch/sklearn/XGBoost/TensorFlow/LightGBM/PySpark 等的训练信息）。Models 通过 **flavor**（`python_function` 是所有 Python 模型的基础 flavor，sklearn/pytorch/tensorflow 等在其上叠加）实现「一次打包、多下游通用」，`mlflow.pyfunc.load_model` 给出统一的 `predict()` 接口。**MLflow 3.x** 把重心扩展到 GenAI：LLM/Agent 评测（`mlflow.genai`）、Tracing、Prompt 管理、AI Observability，并引入 **Databricks Free Tier / Managed MLflow** 与自托管 Tracking Server 两种部署形态。截至 2026 年 7 月，稳定版为 **3.14.0**（2026-06-17 发布）。信源 mlflow.org/docs。

## 评价

**优点**

- **开源、框架无关**：Apache 2.0，sklearn/PyTorch/TF/XGBoost/LightGBM/H2O/ONNX/Spark 等主流框架都有 flavor 与 autolog，不锁框架
- **组件齐全**：Tracking + Projects + Models + Model Registry + Pipelines + Deployments + Evaluate 一条龙，从实验到上线不用拼多个工具
- **Tracking 上手极快**：`mlflow.autolog()` 一行启用，param/metric/model/依赖自动落盘，几乎是零成本接入
- **Model flavor 解耦部署**：`python_function` 基础 flavor 让任何模型都能被统一 `predict()` 加载，下游部署工具不用懂每个框架
- **3.x GenAI 友好**：`mlflow.genai` 评测 LLM/Agent、Tracing、Prompt 管理，把传统 ML 与 GenAI 治理统一在一个平台
- **部署灵活**：自托管 Tracking Server（开源、可上任意云）或用 Databricks 托管 MLflow 免运维，迁移成本可控

**缺点**

- **Tracking Server 自托管重**：要管数据库（PostgreSQL/MySQL）、artifact 存储（S3/GCS/Azure Blob）、反向代理、鉴权，小团队维护成本不低
- **UI 功能分散**：Tracking / Models / Registry / Experiments 多个 Tab，新人对「该去哪儿看」常犯迷糊
- **3.x 变动较大**：API 拆分（genai/deployments/tracing 独立模块）、配置体系（`mlflow.settings`）、注册表语义演进，从 2.x 升级有迁移成本
- **Pipelines/Recipes 定位摇摆**：历经 MLflow Pipelines → Recipes → 又被官方弱化，文档与社区实践不如 Tracking/Registry 稳定
- **企业级特性偏弱**：开源版的细粒度权限、审批工作流、配额治理不如 SageMaker Model Registry / W&B，重治理常需上 Databricks 付费版

## 文档地址

- [MLflow 官方文档](https://mlflow.org/docs/latest/)
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking/)
- [MLflow Models](https://mlflow.org/docs/latest/models/)
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry/)
- [MLflow Autolog](https://mlflow.org/docs/latest/tracking/autolog/)

## GitHub地址

[mlflow/mlflow](https://github.com/mlflow/mlflow)

## 幻灯片地址

<a href="/SlideStack/mlflow-slide/" target="_blank">MLflow</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=MLflow" target="_blank" rel="noopener noreferrer">MLflow 测试题</a>
