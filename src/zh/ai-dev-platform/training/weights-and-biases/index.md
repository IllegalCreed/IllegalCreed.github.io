---
layout: doc
---

# Weights & Biases

Weights & Biases（W&B，SDK 包名 `wandb`）是以 **SaaS 为主、可自托管** 的 **AI 开发者平台**（被 CoreWeave 收购后亦称「Weights & Biases by CoreWeave」），核心诉求是「让实验看得见、让团队协作得起来」。它的抽象体系围绕 **Run（一次实验运行）** 展开：`wandb.init()` 启动 Run（返回 `wandb.Run` 对象），`run.log()` 记录随训练变化的指标（学习率、loss、自定义图表），`run.finish()`（或 `with` 退出时）结束 Run；多个 Run 归到 **Project**，便于横向对比。其上叠加多个产品模块：**Artifacts**（数据/模型的版本化与血缘追踪——`log_artifact` 标输出、`use_artifact` 标输入，自动连成 lineage graph）、**Sweeps**（超参搜索：定义搜索空间与策略，自动调度多个 Run）、**Tables**（记录与查询任意媒体数据：文本/图像/视频/音频/HTML，做细粒度样本级评估）、**Reports**（可分享的交互式研究报告，把图表、Run、Markdown 串成报告）、**Registry**（模型注册表，集中管理候选模型与上线版本）、**Automations**（事件触发：模型版本/Artifact 变化时自动调 webhook / 触发 CI）、**Weave**（GenAI 评测与可观测工具包：scorer、judge、tracing、production agent 持续改进，已 GA on SaaS 与 AWS）、**Serverless Inference**（一键把模型部署成推理端点）。部署形态上 W&B 以托管 SaaS 为主（开箱即用、免运维），也提供 **Dedicated Cloud** 与自托管 server（`wandb/local` / `wandb/server`，开源版功能受限）。截至 2026 年 7 月，Python SDK 稳定版为 **0.28.1**（2026-07-16）。信源 docs.wandb.ai。

## 评价

**优点**

- **可视化与协作是杀手锏**：图表自动聚合、Run 横向对比、Report 一键分享，团队评审与论文复现体验远超自托管方案
- **SDK 上手极快**：`init` / `log` / `finish` 三行接入，主流框架（PyTorch/TF/Keras/HF/SKlearn/XGBoost）有 autolog 或集成钩子
- **Artifacts 血缘自动**：`log_artifact` + `use_artifact` 把数据→模型→评估表自动连成 lineage graph，追溯任意产物的完整链路
- **Tables 支持任意媒体**：文本/图像/视频/音频/HTML 都能记，样本级调试与错误分析体验好
- **Weave 覆盖 GenAI 全链路**：scorer / judge / tracing / 持续改进，把 LLM 应用评测与可观测统一在一个工具
- **Sweeps + Automations 闭环**：超参搜索自动调度，模型版本变化自动触发 CI/webhook，从实验到上线一条龙

**缺点**

- **SaaS 强依赖**：默认数据上传到 W&B 云，敏感数据/合规场景必须自托管或 Dedicated Cloud，成本陡升
- **自托管 server 功能受限**：开源 `wandb/server` 在 Sweeps、Automations、Organizations、SSO 等高级特性上常落后于 SaaS
- **计费按用量**：免费额度有限，Run/Artifacts/用户数上去后费用不低，且难以精确预估
- **离线/断网体验差**：`WANDB_MODE=offline` 虽支持，但 sync 失败、数据冲突处理繁琐
- **厂商锁定风险**：报告、图表、Sweep 配置都在 W&B 体系内，迁出到 MLflow/其它平台需要重建

## 文档地址

- [W&B 官方文档](https://docs.wandb.ai/)
- [Python SDK（init/log/finish）](https://docs.wandb.ai/models/ref/python/functions/init)
- [Artifacts 概览](https://docs.wandb.ai/models/artifacts)
- [W&B Weave（GenAI 评测）](https://wandb.ai/site/weave/)
- [功能发布博客](https://wandb.ai/fully-connected/blog/feature-releases)

## GitHub地址

- [wandb/wandb](https://github.com/wandb/wandb)（Python SDK）
- [wandb/server](https://github.com/wandb/server)（自托管 server）

## 幻灯片地址

<a href="/SlideStack/weights-and-biases-slide/" target="_blank">Weights & Biases</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Weights%20%26%20Biases" target="_blank" rel="noopener noreferrer">Weights & Biases 测试题</a>
