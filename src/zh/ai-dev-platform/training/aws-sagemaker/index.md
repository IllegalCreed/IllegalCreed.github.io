---
layout: doc
---

# AWS SageMaker

Amazon SageMaker（2024-12-03 起 ML 子产品更名 **Amazon SageMaker AI**，下一代 SageMaker 则统一了数据/分析/AI）是 AWS 提供的**全托管机器学习平台**，覆盖「打标 → 准备 → 训练 → 评估 → 部署 → 监控 → 治理」全生命周期。它的抽象体系围绕几条主线展开：**SageMaker Studio**（基于 Web 的统一 IDE，内置 JupyterLab、Code Editor（VS Code 开源版）、RStudio，以及下一代 Studio Classic）；**Training Job / Processing Job**（按需拉起 EC2/GPU 实例的托管训练与数据处理任务）；**Endpoint / Batch Transform / Serverless Endpoint**（推理部署的三种形态）；**Pipelines**（DAG 化的 ML 工作流编排，原生集成各 Job）；**Model Registry / Feature Store / Model Monitor / Model Cards**（模型版本、特征仓库、生产监控与治理文档）。其上叠加了若干「加速器」：**Autopilot**（AutoML 自动训练分类/回归模型）、**JumpStart**（一键部署的预训练模型与解决方案模板）、**Ground Truth**（人机协同标注）、**Clarify**（偏置检测与可解释性）、**HyperPod**（面向 LLM/扩散模型大模型的常驻弹性集群）、**Canvas**（无代码 AutoML）、**Data Wrangler**（可视化数据准备）。`boto3` API 命名空间、CloudFormation 资源类型、IAM 托管策略仍保留旧 `sagemaker` 前缀以保后向兼容。信源 docs.aws.amazon.com/sagemaker。

## 评价

**优点**

- **全栈托管、开箱即用**：标注、特征、训练、推理、监控、注册一站到位，团队不用自己拼一套 MLOps 工具链
- **基础设施完全托管**：Training Job 按秒计费、自动弹缩、Spot 实例最高可省 90% 成本，无需运维 GPU 集群
- **Studio 一体化 IDE**：JupyterLab + Code Editor + RStudio 共享空间，跨账号协作、EMR 联动、Git 扩展齐全
- **JumpStart 模型生态厚**：内置数百个预训练模型（含 Llama、Mistral、Stable Diffusion），Fine-tune/Deploy 都是一键
- **HyperPod 应对大模型**：常驻集群 + Slurm/EKS + NVIDIA NeMo/Neuronx 训练适配器，万卡级预训练有官方背书
- **治理与合规完善**：Model Registry 审批流、Model Cards、Lineage Tracking、Clarify 偏置/可解释性，满足金融/医疗审计

**缺点**

- **AWS 强绑定**：API、数据格式、IAM、CloudFormation 全在 AWS 体系内，跨云/迁出成本高
- **学习曲线陡峭**：组件多达 30+（Studio/Canvas/HyperPod/Pipelines/Feature Store...），新人不知从何入手
- **冷启动与调度慢**：Training Job 拉起、镜像下载、Endpoint 部署动辄数分钟，迭代节奏比本地慢
- **计费颗粒度复杂**：实例费 + 存储 + Pipeline 步骤 + 推理调用多层叠加， Spot 中断还会丢进度，账单难以预估
- **命名分裂**：2024-12 起 ML 部分改名 SageMaker AI，与下一代「统一 SageMaker」（Lakehouse/DataZone 等）容易混淆，文档新旧并存

## 文档地址

- [Amazon SageMaker AI 开发者指南](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html)
- [SageMaker AI 功能总览](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis-features.html)
- [Amazon SageMaker Studio](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-updated.html)
- [SageMaker JumpStart](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jumpstart.html)
- [Amazon SageMaker 定价](https://aws.amazon.com/sagemaker/pricing/)

## GitHub地址

- [aws/amazon-sagemaker-examples](https://github.com/aws/amazon-sagemaker-examples)（官方示例库）
- [aws/sagemaker-python-sdk](https://github.com/aws/sagemaker-python-sdk)（Python SDK）

## 幻灯片地址

<a href="/SlideStack/aws-sagemaker-slide/" target="_blank">AWS SageMaker</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=AWS%20SageMaker" target="_blank" rel="noopener noreferrer">AWS SageMaker 测试题</a>
