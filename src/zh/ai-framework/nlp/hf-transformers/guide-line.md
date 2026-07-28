---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Hugging Face Transformers 官方文档（huggingface.co/docs/transformers，Trainer / pipeline / generate / serialization 章节）+ GitHub 编写

## 速查

- **训练三件套**：`TrainingArguments`（超参配置）+ `Trainer`（训练循环）+ `compute_metrics`（指标）
- **Trainer 必填**：`model` / `args` / `train_dataset` / `data_collator` / `tokenizer`（或 `processing_class`）
- **关键超参**：`output_dir` / `num_train_epochs`（默认 3.0）/ `per_device_train_batch_size`（默认 8）/ `learning_rate`（默认 5e-5）
- **保存策略**：`save_strategy`（`no`/`steps`/`epoch`/`best`）/ `eval_strategy`（`no`/`steps`/`epoch`）
- **混合精度**：`fp16=True`（NVIDIA）/ `bf16=True`（Ampere+，更稳）
- **梯度累积**：`gradient_accumulation_steps=N` 模拟大 batch
- **回调**：`EarlyStoppingCallback` / `PrinterCallback` / 自定义 `TrainerCallback`
- **分布式**：`fsdp` / `deepspeed` 参数 / `accelerate` 启动器
- **Hub 上传**：`TrainingArguments(push_to_hub=True, hub_model_id="user/model")`，或训练后 `trainer.push_to_hub()`
- **hub_strategy**：`end`（仅末尾）/ `every_save`（每次保存，默认）/ `checkpoint`（保留 last-checkpoint 便于续训）
- **generate**：`model.generate(**inputs, max_new_tokens=100, do_sample=True, temperature=0.7, top_p=0.9)`

## Trainer 训练框架

`Trainer` 封装了完整的训练/评估/预测循环，省去手写 epoch、optimizer、scheduler、logging、checkpoint。

```python
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    TrainingArguments, Trainer, DataCollatorWithPadding
)
from datasets import load_dataset
import evaluate

model_id = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForSequenceClassification.from_pretrained(model_id, num_labels=2)

raw = load_dataset("stanfordnlp/imdb")

def preprocess(ex):
    return tokenizer(ex["text"], truncation=True)

tokenized = raw.map(preprocess, batched=True)

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)
accuracy = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(axis=-1)
    return accuracy.compute(predictions=preds, references=labels)

args = TrainingArguments(
    output_dir="./imdb-bert",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    learning_rate=2e-5,
    eval_strategy="epoch",     # v5 名：旧版叫 evaluation_strategy
    save_strategy="epoch",
    load_best_model_at_end=True,
    bf16=True,                 # Ampere+ GPU 推荐
    push_to_hub=False,
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    data_collator=data_collator,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

trainer.train()
```

> **铁律**：`Trainer` 接收的 dataset 列名应与模型期望的输入键（`input_ids`/`attention_mask`/`labels`）对齐；标签列默认叫 `labels`，否则用 `args.label_names` 声明。

## TrainingArguments 关键参数

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `output_dir` | — | 输出/checkpoint 目录（必填） |
| `num_train_epochs` | `3.0` | 训练总轮数 |
| `max_steps` | `-1` | 按步数而非轮数训练（streaming 必填） |
| `per_device_train_batch_size` | `8` | 每卡训练 batch |
| `per_device_eval_batch_size` | `8` | 每卡评估 batch |
| `learning_rate` | `5e-5` | 初始学习率 |
| `weight_decay` | `0.0` | 权重衰减 |
| `warmup_ratio` / `warmup_steps` | `0.0` / `0` | 学习率预热 |
| `logging_steps` | `500` | 每多少步打日志 |
| `eval_strategy` | `"no"` | 评估时机：no/steps/epoch |
| `save_strategy` | `"steps"` | 保存时机：no/steps/epoch/best |
| `save_steps` | `500` | steps 模式下保存间隔 |
| `save_total_limit` | `None` | 最多保留 checkpoint 数 |
| `fp16` / `bf16` | `False` | 混合精度（二选一） |
| `gradient_accumulation_steps` | `1` | 梯度累积步数 |
| `gradient_checkpointing` | `False` | 梯度检查点（省显存换算力） |
| `load_best_model_at_end` | `False` | 训练末载入最优 checkpoint |
| `metric_for_best_model` | `None` | 选「最优」依据的指标 |
| `report_to` | `"all"` | 日志后端：wandb/tensorboard/mlflow/none |
| `seed` | `42` | 随机种子 |
| `dataloader_num_workers` | `0` | DataLoader worker 数 |
| `remove_unused_columns` | `True` | 自动删模型用不到的列 |

## 混合精度与显存优化

```python
args = TrainingArguments(
    output_dir="./model",
    bf16=True,                       # ① Ampere+ GPU：bf16 比 fp16 稳（无需 loss scaling）
    # fp16=True,                    #    Volta/Turing GPU 用 fp16
    gradient_accumulation_steps=4,   # ② 显存不够时：小 batch + 累积模拟大 batch
    gradient_checkpointing=True,     # ③ 重算激活省显存（约省 30-60%，慢约 20-30%）
    per_device_train_batch_size=4,   # ④ 直接调小每卡 batch
    optim="adamw_torch_fused",       # ⑤ fused 优化器更快
)
```

- **bf16 vs fp16**：bf16 数值范围与 fp32 相同，不会溢出，且无需动态 loss scaling，Ampere 及更新卡优先选 bf16
- **gradient_checkpointing**：用时间换空间，大模型训练常开
- **gradient_accumulation_steps**：`有效 batch = per_device_train_batch_size × num_devices × gradient_accumulation_steps`

## 分布式训练

### FSDP（PyTorch 原生，推荐大模型）

```python
args = TrainingArguments(
    output_dir="./llama-fsdp",
    fsdp="full_shard auto_wrap",          # 启用 FSDP 全分片
    fsdp_config={
        "fsdp_transformer_layer_cls_to_wrap": ["LlamaDecoderLayer"],
    },
    bf16=True,
)
```

### DeepSpeed（极致大模型优化）

```python
args = TrainingArguments(
    output_dir="./big-model",
    deepspeed="ds_config.json",   # ZeRO-2/ZeRO-3 配置文件
)
```

实际启动通常用 `accelerate launch` 或 `torchrun`：

```bash
accelerate launch --num_processes=4 train.py
torchrun --nproc_per_node=4 train.py
```

## push_to_hub：训练即上传

```python
args = TrainingArguments(
    output_dir="./my-model",
    push_to_hub=True,
    hub_model_id="my-username/my-model",
    hub_strategy="every_save",   # 每次保存都推（默认）
    hub_private_repo=True,
)
trainer.train()
trainer.push_to_hub("End of training commit message")
```

`hub_strategy` 选项：

| 值 | 行为 |
| --- | --- |
| `end` | 仅训练结束时推送一次 |
| `every_save` | 每次 `save_strategy` 触发都异步推送（默认） |
| `checkpoint` | 同 every_save，且保留 `last-checkpoint` 指针，便于断点续训 |

## generate：文本生成

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct", dtype="bfloat16", device_map="auto")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")

inputs = tokenizer("The capital of France is", return_tensors="pt").to(model.device)

# 贪心解码（确定性）
out = model.generate(**inputs, max_new_tokens=20)

# 采样解码（多样）
out = model.generate(
    **inputs,
    max_new_tokens=50,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
    top_k=50,
    repetition_penalty=1.1,
)

print(tokenizer.decode(out[0], skip_special_tokens=True))
```

generate 常用解码参数：

| 参数 | 作用 |
| --- | --- |
| `max_new_tokens` | 生成的最大 token 数（推荐，区别于旧 `max_length`） |
| `do_sample` | `False`=贪心，`True`=采样 |
| `temperature` | 采样温度，越高越发散（0 退化贪心） |
| `top_k` | 每步只在概率最高的 k 个里采样 |
| `top_p` | nucleus sampling，在累计概率达 p 的最小集合里采样 |
| `num_beams` | 束搜索宽度（>1 启用 beam search） |
| `repetition_penalty` | 抑制重复 token |
| `pad_token_id` / `eos_token_id` | 填充/结束 token |

## 回调（Callbacks）

```python
from transformers import TrainerCallback, EarlyStoppingCallback

class MyCallback(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        print(f"step {state.global_step}: {logs}")

trainer = Trainer(
    model=model,
    args=args,
    callbacks=[
        EarlyStoppingCallback(early_stopping_patience=3),  # 连续 3 次评估无提升则停
        MyCallback(),
    ],
)
# 运行时增删
trainer.add_callback(MyCallback())
trainer.remove_callback(transformers.PrinterCallback)
```

## AutoClass 选用决策

```
要做推理且不在意细节？ → pipeline(task)
要知道具体输入输出？ → AutoTokenizer + AutoModelFor<任务>
取句向量/特征？       → AutoModel（无 head，取 last_hidden_state）
```

任务→AutoModel 映射见入门页「常用 AutoModel 变体」表。

## pipeline 进阶

```python
from transformers import pipeline

# ① 多条输入批量推理
classifier = pipeline("text-classification", model="bert-base-uncased", device=0)  # device=-1 CPU
results = classifier(["good", "bad"], batch_size=32)

# ② 生成任务
gen = pipeline("text-generation", model="Qwen/Qwen2.5-0.5B-Instruct", device_map="auto")
print(gen("Once upon a time", max_new_tokens=50, do_sample=True, temperature=0.7))

# ③ QA（需 context + question）
qa = pipeline("question-answering", model="deepset/roberta-base-squad2")
print(qa(question="Where is Paris?", context="Paris is the capital of France."))
```

`device`/`device_map` 指定运行位置；大模型用 `device_map="auto"` 让 accelerate 自动切分。

## 陷阱与最佳实践

- **tokenizer 与 model 不同源**：必须同 model_id 加载，否则 vocab 不匹配
- **labels 列名**：Trainer 默认找 `labels`，用了别的列名要 `args.label_names=["my_label"]`
- **dtype 默认值变了**：v5 起 `from_pretrained` 不再恒 float32，从 config 推断；显式 `dtype="float32"` 固定
- **参数改名历史**：`evaluation_strategy`→`eval_strategy`、`tokenizer` 参数→`processing_class`、`max_length`→`max_new_tokens`；遇旧脚本报错先查版本变更
- **fp16 与 bf16 同开**：会报错，二选一
- **streaming dataset 无长度**：传 `IterableDataset` 必须设 `max_steps`（无法推算总步数）
- **push_to_hub 未登录**：先 `huggingface-cli login` 或设 `HF_TOKEN` 环境变量
- **大模型直接加载 OOM**：先试 `device_map="auto"` + `dtype="bfloat16"`，仍不行上量化（bitsandbytes）或 FSDP
