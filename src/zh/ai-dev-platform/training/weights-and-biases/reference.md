---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 W&B 官方文档 + 2026 功能发布博客 + GitHub wandb/wandb 整理，对照稳定版 0.28.1

## 速查

- **安装/登录**：`pip install wandb` / `wandb login` / `WANDB_API_KEY`
- **Run 核心**：`wandb.init(project, name, config, group, job_type, tags, mode)` / `wandb.log(dict, step=)` / `wandb.finish()`
- **Artifacts**：`wandb.Artifact(name, type)` / `run.log_artifact` / `run.use_artifact` / `art.add_file/dir/reference`
- **Sweeps**：`wandb.sweep(config, project)` / `wandb.agent(sweep_id, function, count)`
- **Tables**：`wandb.Table(columns, data)` / `wandb.Image/Video/Audio/Html`
- **绘图**：`wandb.plot.confusion_matrix/pr_curve/roc_curve/...`
- **API 查询**：`wandb.Api()` / `api.run(...)` / `api.artifact(...)`
- **Weave**：`@weave.op` / `weave.Dataset` / `weave.evaluate(fn, dataset, scorers)`
- **环境变量**：`WANDB_API_KEY` / `WANDB_MODE` / `WANDB_PROJECT` / `WANDB_ENTITY` / `WANDB_DIR` / `WANDB_DISABLED`
- **版本**：Python SDK **0.28.1**（2026-07-16）

## 产品模块全景

| 模块 | 职责 | 关键 API |
| --- | --- | --- |
| **Tracking（Run）** | 实验追踪 | `init` / `log` / `finish` |
| **Projects** | Run 容器与横向对比 | `project=` 参数 |
| **Artifacts** | 数据/模型版本与血缘 | `Artifact` / `log_artifact` / `use_artifact` |
| **Sweeps** | 超参搜索 | `wandb.sweep` / `wandb.agent` |
| **Tables** | 样本级媒体评估 | `wandb.Table` / `wandb.Image` 等 |
| **Reports** | 协作研究报告 | UI 构建 |
| **Registry** | 模型注册表 | UI / API |
| **Automations** | 事件触发 CI | UI 配置 |
| **Weave** | GenAI 评测与可观测 | `weave.op` / `weave.evaluate` |
| **Serverless Inference** | 一键推理部署 | UI |

## 核心 API 速查

### Run 与 log

| API | 说明 |
| --- | --- |
| `wandb.init(project=, name=, config=, group=, job_type=, tags=, notes=, dir=, mode=)` | 启动 Run，返回 `Run` |
| `run.log(dict, step=, commit=)` | 记录指标（dict，可时序） |
| `run.define_metric(name, step_metric=, summary=)` | 自定义坐标轴与汇总（min/max/last/none） |
| `run.config.update(dict)` | 更新 config |
| `run.summary["key"] = value` | 设置单值汇总（如最终 accuracy） |
| `run.finish()` | 结束 Run |
| `wandb.config.lr` | 访问 config |

### Artifacts

| API | 说明 |
| --- | --- |
| `wandb.Artifact(name, type, description=, metadata=)` | 创建 artifact 对象 |
| `art.add_file(path)` / `art.add_dir(dir)` / `art.add_reference(uri)` | 添加内容 |
| `run.log_artifact(art, aliases=)` | 记录为输出（建版本） |
| `run.use_artifact("name:version")` | 标记为输入（建 lineage），返回可 `download()` 的对象 |
| `art.download(root=)` | 下载到本地 |
| `art.aliases` / `art.metadata` | 别名与元数据 |
| `api.artifact("entity/proj/name:v3")` | 通过 Api 查询 |

### Sweeps

| API | 说明 |
| --- | --- |
| `wandb.sweep(sweep_config, project=, entity=)` | 创建 sweep，返回 sweep_id |
| `wandb.agent(sweep_id, function=, count=, project=, entity=)` | 启动 agent 跑 N 个 Run |
| `wandb.controller(sweep_id)` | 高级：手动控制 sweep |

### Tables 与媒体

| API | 说明 |
| --- | --- |
| `wandb.Table(columns=[], data=[[]])` | 创建表格 |
| `table.add_data(*cols)` / `table.add_column(name, data)` | 增行/增列 |
| `wandb.Image(img_or_path, caption=)` | 图像列 |
| `wandb.Video(path_or_array)` | 视频列 |
| `wandb.Audio(path_or_array, sample_rate=)` | 音频列 |
| `wandb.Html(html, height=)` | HTML 列 |
| `wandb.Object3D(path_or_array)` | 3D 列 |

### 内置图表（wandb.plot）

| API | 说明 |
| --- | --- |
| `wandb.plot.confusion_matrix(y_true, preds, class_names)` | 混淆矩阵 |
| `wandb.plot.pr_curve(y_true, probs, labels)` | PR 曲线 |
| `wandb.plot.roc_curve(...)` | ROC 曲线 |
| `wandb.plot.histogram(data, title)` | 直方图 |
| `wandb.plot.scatter_table(table, x, y)` | 散点 |
| `wandb.plot.line(series, keys, steps)` | 折线 |

### Api 查询

```python
api = wandb.Api()
run = api.run("entity/project/run_id")
runs = api.runs("entity/project", filters={"config.lr": 0.01}, order="-summary_metrics.val_acc")
art = api.artifact("entity/project/name:v3")
```

### Weave（GenAI）

| API | 说明 |
| --- | --- |
| `@weave.op` | 给函数加 tracing，自动记录输入输出 |
| `weave.Dataset(name, rows)` | 定义评测数据集 |
| `weave.evaluate(fn, dataset, scorers)` | 评测 + judge |
| `weave.scorer.*` | 内置 scorer |

## Sweeps 配置字段

| 字段 | 说明 |
| --- | --- |
| `method` | `grid` / `random` / `bayes` |
| `metric` | `{name, goal: minimize/maximize}` |
| `parameters.&lt;name&gt;` | `{value}` / `{values:[...]}` / `{min,max,distribution}` |
| `distribution` | `int_uniform` / `uniform` / `log_uniform_values` / `q_uniform` / `categorical` |
| `early_terminate` | `{type: "hyperband", min_iter, max_iter, s}` |
| `run_cap` | 最大 Run 数（W&B 贝叶斯优化推荐用） |

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `WANDB_API_KEY` | 认证 key |
| `WANDB_MODE` | `online` / `offline` / `disabled` |
| `WANDB_PROJECT` | 默认 project |
| `WANDB_ENTITY` | 默认 entity（团队/用户） |
| `WANDB_DIR` | 本地缓存目录 |
| `WANDB_RUN_ID` | 指定 run id（resume 时用） |
| `WANDB_RESUME` | `allow` / `must` / `never` / `auto` |
| `WANDB_SILENT` | `true` 静默日志 |
| `WANDB_DISABLED` | `true` 完全关闭（等价 mode=disabled） |

## 部署形态

| 形态 | 说明 |
| --- | --- |
| **SaaS（wandb.ai）** | 默认，开箱即用，功能最全 |
| **Dedicated Cloud** | W&B 托管的专属云部署（数据隔离） |
| **自托管 server（wandb/server）** | 开源版，可上自有 K8s，高级特性（Sweeps/Automations/SSO）有差异 |
| **离线（offline）** | `WANDB_MODE=offline`，事后 sync |

## 2026 近期功能要点

- **ARIA**（2026-06）：新 ML 研究助手
- **W&B Weave GA**：playground、guardrails、leaderboards、自定义成本追踪、音频支持、新 scorers、自定义命名、chat tab
- **Serverless Inference**：新模型上线
- **wandb-core**：Rust 内核，降低内存/CPU、更快启停与离线 sync
- **CoreWeave 沙箱**（2026-05）：算力沙箱试用
- **2026-07「What's New Wednesdays」**：自主模型与 agent 改进工具

## 与竞品对照

| 维度 | W&B | MLflow | SageMaker |
| --- | --- | --- | --- |
| 部署 | SaaS 为主（可自托管） | 开源自托管（或 Databricks 托管） | AWS 闭源托管 |
| 强项 | 可视化+协作 Report+Artifacts 血缘 | Tracking+Registry+flavor 部署链 | 端到端 ML（训练→部署→监控） |
| LLM 评测 | Weave | `mlflow.genai`/`evaluate` | Bedrock |
| 自托管成本 | 低（SaaS）/中（自托管 server） | 中（要管 DB+artifact） | 不适用 |

## 官方资源

- [W&B 官方文档](https://docs.wandb.ai/)
- [Python SDK 参考](https://docs.wandb.ai/models/ref/python/functions/init)
- [Artifacts 概览](https://docs.wandb.ai/models/artifacts)
- [W&B Weave](https://wandb.ai/site/weave/)
- [wandb/wandb（GitHub）](https://github.com/wandb/wandb)
- [wandb/server（自托管）](https://github.com/wandb/server)
- [功能发布博客](https://wandb.ai/fully-connected/blog/feature-releases)
- [示例库 wandb/examples](https://github.com/wandb/examples)
