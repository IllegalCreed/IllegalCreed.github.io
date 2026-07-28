---
layout: doc
---

# DVC

DVC（Data Version Control，仓库 iterative/dvc）是开源（Apache 2.0）的 **「Git for data」**——一套构建在 Git 之上的**数据/模型版本控制与可复现 ML 流水线工具**。它本身**不是独立的版本控制系统**，而是 Git 的扩展：用 Git 跟踪轻量的人类可读元数据（`.dvc` 占位文件、`dvc.yaml`、`dvc.lock`），把真正的大文件（数据集、模型权重）存到 DVC 本地缓存（`.dvc/cache`）并按内容哈希链接回工作区；原始大文件被自动加入 `.gitignore`。其核心抽象有三条主线：**数据版本控制**——`dvc init`（在 Git 仓库内初始化）、`dvc add`（把数据/模型纳入跟踪，生成 `.dvc` 文件与缓存链接）、`dvc push` / `dvc pull`（与**远程存储**——S3/GCS/Azure Blob/SSH/HDFS/本地路径等同步），切换版本用 `git checkout <.dvc 文件>` + `dvc checkout` 同步对应数据；**可复现流水线**——在 `dvc.yaml` 里用 `stages`（`deps`/`outs`/`cmds`/`metrics`/`params`）声明数据如何被加工成模型，`dvc.lock` 锁定依赖与输出的精确状态，`dvc repro` 增量只重跑变化影响的阶段（类似 Makefile），`dvc dag` 可视化依赖图；**实验评测**——`dvc params` / `dvc metrics show|diff` / `dvc plots` 把参数、指标、图表作为一等公民，配合 `dvc exp` 做实验分支管理。DVC 与 Git 协同：代码进 Git，大文件进 DVC 缓存，二者通过元数据文件绑定，团队协作只需 `git clone` + `dvc pull`。它与 MLflow 互补——DVC 管「数据/模型/流水线的版本与复现」，MLflow 管「实验运行的追踪与模型注册」，常组合使用。截至 2026 年 7 月，稳定版为 **3.67.1**（2026-03-31，PyPI）。信源 dvc.org/doc（重定向至 doc.dvc.org）。

## 评价

**优点**

- **Git 原生、学习曲线平缓**：命令与 Git 同构（init/add/push/pull/checkout/diff），数据团队无需学新工作流
- **数据与代码版本统一**：用 Git 跟踪 `.dvc` 元数据，大文件进缓存，团队 `git clone + dvc pull` 即可还原完整项目
- **远程存储解耦**：支持 S3/GCS/Azure Blob/SSH/HDFS/本地/HTTP 等多种后端，不锁厂商，自托管成本低
- **流水线可复现且增量**：`dvc.yaml` + `dvc.lock` + `dvc repro` 增量只重跑受影响阶段，省算力，类似 Makefile 的依赖驱动
- **指标/参数/图表一等公民**：`dvc metrics/params/plots` + `dvc exp` 把实验对比内建到 Git 工作流，无需额外平台
- **与 MLflow 互补**：DVC 管数据/流水线版本，MLflow 管运行追踪，组合即可覆盖完整 MLOps

**缺点**

- **大文件哈希同步有成本**：`dvc push/pull` 走内容寻址，超大仓库首次同步慢，且依赖网络与远端配额
- **缓存冲突与清理繁琐**：多人协作时缓存引用、`.dvc` 文件冲突需手动 `dvc checkout` 修复；孤立缓存项需定期 `dvc gc`
- **流水线表达力有限**：`dvc.yaml` 适合线性/DAG 流水线，复杂条件分支、循环、动态调度不如 Airflow/Kubeflow
- **实验管理不如专用平台**：`dvc exp` 对比能力不及 W&B/MLflow 的可视化，重度实验追踪仍需另接工具
- **依赖 Git 工作流纪律**：忘记 commit `.dvc`/`dvc.lock` 或先 `git pull` 再 `dvc pull` 顺序错乱，会导致版本错位

## 文档地址

- [DVC 官方文档](https://dvc.org/doc)（重定向至 doc.dvc.org）
- [Get Started](https://doc.dvc.org/start)
- [数据版本控制](https://doc.dvc.org/start/data-management)
- [数据流水线](https://doc.dvc.org/start/data-pipelines)
- [命令参考](https://doc.dvc.org/command-reference)

## GitHub地址

[iterative/dvc](https://github.com/iterative/dvc)

## 幻灯片地址

<a href="/SlideStack/dvc-slide/" target="_blank">DVC</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=DVC" target="_blank" rel="noopener noreferrer">DVC 测试题</a>
