---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 W&B 官方文档（Artifacts / Sweeps / Tables / Reports / Registry / Automations / Weave 章节）+ 2026 功能发布博客编写，对照稳定版 0.28.1

## 速查

- **Run 进阶**：`wandb.init(config=, tags=, group=, job_type=, notes=, dir=, mode=)`；`run.define_metric(name, step_metric=)` 控制坐标轴
- **分组**：`group=` 把同一实验的 Run 聚成一组；`job_type=` 区分 train/eval/data-prep
- **Artifacts 版本**：`name:v0`/`name:latest`/alias；`add_file` / `add_dir` / `add_reference`（不复制原文件）
- **Artifacts 血缘**：`use_artifact` + `log_artifact` 自动建 lineage graph；UI 可视化任意产物链路
- **Sweeps 策略**：`grid` / `random` / `bayes`；`early_terminate` 配 hyperband 早停差 Run
- **Sweeps 调度**：`wandb.agent(sweep_id, function=, count=, project=)`；可多机并行扫
- **Tables 进阶**：支持多媒体列、`wandb.Image`/`wandb.Video`/`wandb.Audio`/`wandb.Html`；可链式查询过滤
- **Reports**：交互式文档，嵌入图表/Run/Markdown，可分享与评论
- **Registry**：集中管理候选模型与上线版本，跨 Project 统一视图
- **Automations**：事件触发（artifact 版本创建/模型注册等）→ webhook / CI
- **Weave**：scorer + judge + tracing + observability，GenAI 应用持续评测
- **离线/同步**：`WANDB_MODE=offline` → `wandb sync wandb/` 上传

## Run 与 config 进阶

### init 参数全景

```python
run = wandb.init(
    project="my-project",
    entity="my-team",            # 团队/用户命名空间
    name="run-001",
    group="exp-lr-sweep",        # 把同实验的 Run 聚一组
    job_type="train",            # 区分 train/eval/data-prep，便于 lineage 分层
    tags=["baseline", "v2"],
    notes="试试 cosine schedule",
    dir="./wandb",               # 本地缓存目录
    config={"lr": 0.01, "model": "resnet50"},
    mode="online",               # online / offline / disabled
)
```

`group` 与 `job_type` 不只是标签，会直接影响 lineage graph 的分层与 UI 的聚合方式——合理使用能让多阶段流水线（data→train→eval）的血缘清晰。

### define_metric：自定义坐标轴

```python
run.define_metric("train_loss", step_metric="epoch")  # 横轴用 epoch
for epoch in range(E):
    run.log({"epoch": epoch, "train_loss": loss})
```

默认横轴是 `train/step`（自增），`define_metric` 可指定任意指标做横轴，适配 epoch/global_step/sample 数等不同口径。

## Artifacts 进阶

### 版本、别名与引用

```python
# 引用外部存储（不复制原文件，适合大数据集）
art = wandb.Artifact("big-dataset", type="dataset")
art.add_reference("s3://my-bucket/data/v1/")
run.log_artifact(art)

# 打别名
api = wandb.Api()
art_v3 = api.artifact("my-team/proj/model:v3")
art_v3.aliases.append("production")
art_v3.save()

# 版本间 diff
diff = art_v3.diff(art_v2)   # 新增/删除/修改的文件
```

### lineage 实战

```python
# 阶段 1：数据准备
with wandb.init(job_type="data-prep") as run:
    raw = run.use_artifact("raw:latest").download()
    cleaned = preprocess(raw)
    art = wandb.Artifact("cleaned", type="dataset")
    art.add_dir(cleaned)
    run.log_artifact(art)

# 阶段 2：训练（消费 cleaned，产出 model）
with wandb.init(job_type="train") as run:
    data = run.use_artifact("cleaned:latest").download()
    train_model(data)
    m = wandb.Artifact("model", type="model")
    m.add_file("model.pt")
    run.log_artifact(m)
```

`use_artifact`（输入）+ `log_artifact`（输出）配 `job_type` 分层，W&B 自动画出 raw → cleaned → model 的完整 lineage graph，任一节点可点击溯源。

## Sweeps 进阶

### 搜索空间与早停

```python
sweep_config = {
    "method": "bayes",
    "metric": {"name": "val_loss", "goal": "minimize"},
    "parameters": {
        "lr": {"distribution": "log_uniform_values", "min": 1e-5, "max": 1e-1},
        "epochs": {"value": 20},
        "optimizer": {"values": ["adam", "sgd"]},
        "dropout": {"distribution": "uniform", "min": 0.0, "max": 0.5},
    },
    "early_terminate": {"type": "hyperband", "min_iter": 5, "max_iter": 20},  # 早停差 Run
}
```

- **`method`**：`grid`（穷举，参数空间小）/ `random`（随机，通用）/ `bayes`（贝叶斯优化，样本效率高）
- **`distribution`**：`int_uniform` / `uniform` / `log_uniform_values` / `categorical` / `q_uniform` 等
- **`early_terminate`**：hyperband 早停明显劣于其它的 Run，省算力
- **多机并行**：多台机器跑同一 `sweep_id` 的 agent，自动协调

## Tables 进阶

```python
table = wandb.Table(columns=["id", "image", "pred_label", "true_label", "prob"])

for i, (img, pred, true) in enumerate(zip(images, preds, labels)):
    table.add_data(i, wandb.Image(img), pred, true, float(probs[i].max()))

run.log({
    "eval/predictions": table,
    "eval/confusion": wandb.plot.confusion_matrix(...),   # 内置图表
})
```

Tables 在 UI 上可：按列过滤（如只看 `correct=False`）、按媒体预览、导出。配合 `wandb.plot.*`（confusion_matrix / pr_curve / roc_curve 等）开箱即用。

## Reports：协作研究报告

Report 是交互式文档：嵌入 Run 图表、对比面板、Markdown 说明、Run 列表，支持评论与分享链接。常用于：实验阶段性总结、论文复现报告、模型上线评审材料。Report 是 W&B 相对其它追踪工具的协作差异化卖点。

## Registry 与 Automations

- **Registry**：跨 Project 集中管理候选模型与上线版本，统一视图看「哪些模型在生产」
- **Automations**：事件驱动——artifact 版本创建、模型注册到 Registry、Run 完成等事件触发 webhook 或 CI（如自动部署、自动评测）

## Weave：GenAI 评测与可观测

```python
import weave

# 给 LLM 调用加 tracing
@weave.op
def my_llm_app(prompt: str) -> str:
    return llm.generate(prompt)

# 评测数据集 + scorer
dataset = weave.Dataset(name="qa-eval", rows=[...])
weave.evaluate(my_llm_app, dataset=dataset, scorers=[answer_correctness_scorer])
```

Weave 把 GenAI 应用的 **调用追踪（tracing）、评测（scorer/judge）、可观测（observability）、持续改进** 统一在一个工具，已 GA on SaaS 与 AWS。2026 年新增：playground、guardrails、leaderboards、自定义成本追踪、音频支持等。

## 离线与同步

```bash
WANDB_MODE=offline python train.py     # 不联网，数据落本地 ./wandb/latest-run
wandb sync ./wandb/latest-run/         # 事后上传
wandb sync --view                      # 查看待同步的 run
```

离线模式适合：无外网环境（HPC/隔离集群）、CI 中避免污染账号。注意 sync 失败要重试，且多次 init 的 run 目录需分别 sync。

## 陷阱与最佳实践

- **忘 `finish`**：脚本异常退出可能留「crashed」状态 Run，影响 Sweep 判断；用 `with wandb.init(...)` 或 try/finally 兜底
- **config 滥用**：把所有变量塞 config 会让 UI 过滤爆炸；只放想用来分组/筛选的关键超参
- **artifact 大文件 add_dir**：默认会上传，大数据集用 `add_reference` 引用外部存储避免重复存储
- **Sweep 单机串行慢**：`agent(count=N)` 单进程串行跑 N 个 Run；要快需多机/多进程并行
- **离线 sync 冲突**：同 run 多次 sync 会产生重复，sync 前确认本地目录
- **自托管 server 特性差异**：Sweeps/Automations/SSO 在开源 server 上可能缺失或滞后，上线前对照官方特性矩阵
