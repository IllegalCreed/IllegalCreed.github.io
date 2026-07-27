---
layout: doc
---

# AutoML

AutoML（Automated Machine Learning，自动化机器学习）是把机器学习流程中「需要人工经验」的环节自动化的技术总称，目标是让非专家也能用、让专家更高效。它自动化四大环节：**超参调优**（网格/贝叶斯搜索找最优超参，如 Optuna）、**特征工程**（自动构造/选择特征，如 TPOT）、**模型选择**（在多算法族间挑最优，如 Auto-sklearn/H2O AutoML）、**模型集成**（自动堆叠多模型提升效果，如 H2O 的 Stacked Ensemble）。按自动化深度分三档：**超参调优库**（Optuna，需手写训练代码，只自动化调参环节）、**端到端 AutoML**（Auto-sklearn/TPOT/H2O AutoML/FLAML，给数据自动出模型，一行 fit）、**NAS（神经架构搜索）**（自动搜索神经网络结构，如 Google AutoML/AutoKeras，计算成本极高）。主流工具各有定位：**Auto-sklearn**（sklearn 生态、贝叶斯优化+元学习+集成）、**TPOT**（遗传编程优化流水线、输出 Python 代码）、**H2O AutoML**（企业级、自动堆叠集成、支持分布式）、**FLAML**（微软、低成本快速）、**Optuna**（Define-by-Run 超参优化框架、与任何训练代码集成）、**Google AutoML/Vertex AI**（云原生、无代码视觉/表格/NLP）。AutoML 的核心权衡是**自动化便利 vs 黑盒可控性**——开箱即用但难以深度调优，适合快速基线、数据科学提速、非专家自助场景。NAS 是 AutoML 的前沿分支，用强化学习/进化算法搜索网络结构，诞生了 EfficientNet 等 SOTA 架构，但算力门槛极高（数百 GPU-天）。

## 评价

**优点**

- **降低 ML 门槛**：非专家（业务/产品）给数据就能出可用模型，无需懂算法细节，民主化 AI
- **加速专家工作流**：数据科学家用 AutoML 跑基线（几分钟出首个合理模型），再针对性精调，省去 80% 重复劳动
- **减少人为偏见**：不依赖个人经验偏好，系统搜索往往能发现人工想不到的算法/超参组合
- **自动集成提升效果**：H2O AutoML 等自动堆叠多模型（GBM+XGBoost+DRF），常比单模型提升 1-3 个百分点
- **可复现**：TPOT 导出 Python 代码、Optuna 记录所有 trial，结果可复现可审计
- **云原生无代码**：Google AutoML Vision/Tables 提供图形界面，零代码上传数据即出模型

**缺点**

- **黑盒难解释**：选了什么算法、为何这么调参不透明，业务审计和合规场景难用
- **计算成本高**：试错式搜索耗时长——H2O AutoML 默认跑 1 小时，TPOT 遗传算法需数小时到数天，NAS 需数百 GPU-天
- **调优上限有限**：自动化很难超过资深专家的精调水平，Kaggle 顶级方案仍是人工设计；AutoML 适合基线不适合打榜
- **特征工程难全自动化**：领域知识驱动的特征（如「用户活跃度衰减率」）AutoML 难以构造，仍需人工介入
- **对数据质量敏感**：AutoML 不会自动修复数据问题（缺失/异常/标签错误），垃圾进垃圾出，前置清洗仍需人工
- **NAS 算力门槛极高**：神经架构搜索成本远超普通项目预算，只有大厂/科研能负担，且搜索出的结构难迁移
- **过度依赖导致能力退化**：长期用 AutoML 跳过基础训练，团队对算法原理的理解会退化

## 文档地址

- [Auto-sklearn 官方文档](https://automl.github.io/auto-sklearn/master/)
- [TPOT 官方文档](https://epistasislab.github.io/tpot/)
- [H2O AutoML 文档](https://docs.h2o.ai/h2o/latest-stable/h2o-docs/automl.html)
- [FLAML 官方文档](https://microsoft.github.io/FLAML/)
- [Optuna 官方文档](https://optuna.readthedocs.io/en/stable/)

## GitHub地址

- [automl/auto-sklearn](https://github.com/automl/auto-sklearn)
- [epistasislab/tpot](https://github.com/epistasislab/tpot)
- [microsoft/FLAML](https://github.com/microsoft/FLAML)
- [optuna/optuna](https://github.com/optuna/optuna)

## 幻灯片地址

<a href="/SlideStack/automl-slide/" target="_blank">AutoML</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">AutoML测试题</a>
