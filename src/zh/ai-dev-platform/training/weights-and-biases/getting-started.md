---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 W&B 官方文档（docs.wandb.ai，Python SDK / Artifacts / Sweeps / Tables / Weave 章节）编写，对照当前稳定版 0.28.1（2026-07-16）

## 速查

- **安装**：`pip install wandb`
- **登录**：`wandb login`（输入 API key），或设环境变量 `WANDB_API_KEY`
- **Run 生命周期**：`wandb.init(project=, name=, config=)` → `wandb.log({...})` → `wandb.finish()`
- **上下文管理**：`with wandb.init(...) as run:` 退出自动 `finish`
- **核心概念**：**Run**（一次运行）→ **Project**（一组 Run）→ **Entity**（用户/团队）
- **config**：存超参与输入参数，用于分组/过滤/排序 Run
- **autolog / 集成**：PyTorch Lightning、HF Transformers、Keras、Fastai、SKlearn、XGBoost 等有集成
- **Artifacts**：`run.log_artifact(artifact)` 标输出，`run.use_artifact(name)` 标输入，自动连 lineage
- **离线模式**：`WANDB_MODE=offline`，事后 `wandb sync` 上传
- **Sweeps**：定义搜索空间 + 策略，自动调度多个 Run 做超参搜索
- **Tables**：`wandb.Table(data=..., columns=...)` 记录任意媒体做样本级评估
- **Weave**：GenAI 评测与可观测（scorer/judge/tracing）

## 安装与首次登录

```bash
pip install wandb
wandb login        # 粘贴 API key（来自 wandb.ai/authorize）
# 或环境变量
export WANDB_API_KEY=xxxx
```

## 第一个 Run：init / log / finish 三行

```python
import wandb

wandb.init(
    project="my-project",
    name="run-001",
    config={"lr": 0.01, "epochs": 10, "batch_size": 64},   # 超参/配置
)

for epoch in range(wandb.config.epochs):
    loss = train_one_epoch(wandb.config.lr)
    wandb.log({"epoch": epoch, "loss": loss, "lr": wandb.config.lr})

wandb.finish()      # 显式结束（推荐）；或用 with 自动结束
```

打开 W&B 网页即可看到 `my-project` 下的 `run-001`，loss/lr 曲线自动聚合，config 在侧栏可过滤。

要点：

- **`config` 是分组依据**：把想用来筛选 Run 的超参都塞 config，UI 上可按 config 维度 group/sort
- **`log` 接收 dict**：一次可记多个指标，同名指标自动形成时序曲线；step 默认自增，也可显式 `wandb.log({...}, step=)`
- **`finish` 必须调**：不调会在脚本退出时自动结束，但显式 `finish` 能确保数据完整上传

## autolog / 框架集成

```python
import wandb
wandb.init(project="hf")
wandb.init()  # 已 init 可省

# HuggingFace Transformers Trainer 自动集成
from transformers import Trainer, TrainingArguments
args = TrainingArguments(..., report_to="wandb")
trainer = Trainer(..., args=args)
trainer.train()   # 自动记录 loss/lr/eval 指标/模型

# PyTorch Lightning
from pytorch_lightning.loggers import WandbLogger
logger = WandbLogger(project="lit")
trainer = pl.Trainer(logger=logger)
```

主流框架都有官方集成钩子，无需手写 `log`。

## Artifacts：数据与模型版本

```python
import wandb

with wandb.init(project="data-pipeline") as run:
    # ① 标记输入数据集（已存在版本）
    art = run.use_artifact("my-dataset:latest")
    data_dir = art.download()

    # 训练...

    # ② 记录模型产物为新版本
    model_art = wandb.Artifact("my-model", type="model")
    model_art.add_file("model.pt")
    run.log_artifact(model_art)
```

要点：

- **`use_artifact` = 输入**，**`log_artifact` = 输出**——W&B 据此自动连成 **lineage graph**（哪个数据集训出了哪个模型）
- **版本与别名**：`my-model:latest` / `my-model:v3` / 自定义 alias
- **type 分类**：`dataset` / `model` / `result` 等，UI 按 type 分组
- **diff**：不同版本间可 `art.diff(other)` 看文件差异

## Sweeps：超参搜索

```python
sweep_config = {
    "method": "bayes",            # grid / random / bayes
    "metric": {"name": "val_loss", "goal": "minimize"},
    "parameters": {
        "lr": {"min": 0.0001, "max": 0.1},
        "epochs": {"values": [5, 10, 20]},
    },
}
sweep_id = wandb.sweep(sweep_config, project="hpo")

def train():
    wandb.init()
    lr = wandb.config.lr
    val_loss = train_model(lr, wandb.config.epochs)
    wandb.log({"val_loss": val_loss})

wandb.agent(sweep_id, function=train, count=20)
```

Sweeps 自动调度多个 Run，支持 grid / random / **bayes（贝叶斯优化）** 三种策略，UI 上可对比所有 Run 并选最优。

## Tables：样本级评估

```python
import wandb

with wandb.init(project="eval") as run:
    table = wandb.Table(
        columns=["image", "pred", "label", "correct"],
        data=[[wandb.Image(img), pred, label, pred == label] for ...],
    )
    run.log({"predictions": table})
```

Tables 支持任意媒体（文本/图像/视频/音频/HTML/分子），可在 UI 上过滤、查询、做错误分析——比纯指标曲线更适合细粒度调试。

## 下一步

入门掌握 init/log/finish + Artifacts + Sweeps 后，按方向深入：

- **要 LLM 评测**：转 Weave，写 scorer、接 judge LLM、用 tracing 看 agent 调用链
- **要团队协作**：用 Report 把图表与 Run 串成可分享研究报告
- **要模型治理**：用 Registry 集中管理候选模型与上线版本，配 Automations 触发 CI
- **要自托管**：评估 Dedicated Cloud 或 `wandb/server`，注意高级特性（Sweeps/Automations/SSO）的差异
