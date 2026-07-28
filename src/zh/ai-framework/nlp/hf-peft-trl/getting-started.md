---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Hugging Face PEFT 官方文档（huggingface.co/docs/peft）与 TRL 官方文档（huggingface.co/docs/trl）编写

## 速查

- **PEFT 安装**：`pip install peft`
- **TRL 安装**：`pip install trl`
- **PEFT 核心三件套**：Config（如 `LoraConfig`）+ `get_peft_model(model, config)` + `PeftModel`（包装后的模型）
- **LoRA 配置**：`LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, target_modules="all-linear", task_type="CAUSAL_LM")`
- **QLoRA 三件套**：`BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)` + `LoraConfig(target_modules="all-linear")` + 量化加载基模
- **查看可训练参数**：`peft_model.print_trainable_parameters()`
- **保存/加载适配器**：`model.save_pretrained()` 只存 adapter；`PeftModel.from_pretrained(base, adapter_path)` 加载
- **合并权重**：`model.merge_and_unload()` 把 adapter 融入基模（推理去开销）
- **TRL 训练器**：`SFTTrainer`（监督微调）/ `DPOTrainer`（直接偏好）/ `PPOTrainer`（PPO-RLHF）/ `RewardTrainer`（奖励建模）/ `GRPOTrainer`（组相对策略）
- **SFT 最简**：`SFTTrainer(model=..., train_dataset=...).train()`，自动 tokenize + packing + chat template
- **后训练流水线**：SFT（学会指令）→ Reward Modeling（学偏好）→ DPO/PPO/GRPO（对齐）
- **数据格式**：SFT 用 text 或 prompt-completion；DPO 用 preference（prompt+chosen+rejected）；GRPO 用 prompt + 奖励函数

## 安装

```bash
# PEFT：参数高效微调
pip install peft

# TRL：强化学习/对齐训练器
pip install trl

# 配合 Transformers 与（QLoRA 需要）bitsandbytes
pip install transformers accelerate bitsandbytes
```

验证：

```python
import peft, trl
print(peft.__version__, trl.__version__)
```

## PEFT 第一个例子：LoRA 微调

最小可用流程——构造配置、包装模型、查看可训练参数：

```python
from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")

config = LoraConfig(
    r=8,                              # LoRA 秩
    lora_alpha=16,                    # 缩放系数
    target_modules=["q_proj", "v_proj"],  # 注入哪些线性层
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, config)
model.print_trainable_parameters()
# trainable params: 294,912 || all params: 496,038,400 || trainable%: 0.0594
```

> **铁律**：`get_peft_model(model, config)` 会**冻结基模全部权重**并注入可训练的 adapter。`print_trainable_parameters()` 是确认「只训了零点几」的标配检查。

## LoRA 关键参数

| 参数 | 含义 | 经验 |
| --- | --- | --- |
| `r` | 低秩矩阵的秩（rank） | 越大表达力越强但参数越多；常用 8/16/32/64 |
| `lora_alpha` | 缩放系数，有效缩放 = alpha/r | 常取 r 的 1-2 倍（如 r=8,alpha=16） |
| `target_modules` | 注入哪些层 | 可用具体名（`["q_proj","v_proj"]`）、正则、或 `"all-linear"`（QLoRA 常用） |
| `lora_dropout` | adapter 上的 dropout | 防过拟合，常用 0.05–0.1 |
| `bias` | 是否训练 bias | `"none"`（默认，只训 adapter）/`"all"`/`"lora_only"` |
| `task_type` | 任务类型 | `CAUSAL_LM`/`SEQ_CLS`/`SEQ_2_SEQ_LM`/`TOKEN_CLS` 等 |

## QLoRA：4-bit 量化 + LoRA

QLoRA 让大模型在单卡上微调——把基模用 4-bit nf4 量化加载，再训 LoRA：

```python
import torch
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",                # NormalFloat4，为正态分布权重设计
    bnb_4bit_compute_dtype=torch.bfloat16,    # 反量化后用 bf16 计算
    bnb_4bit_use_double_quant=False,          # 是否对量化常数二次量化
)

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
)

config = LoraConfig(
    r=64,
    lora_alpha=16,
    target_modules="all-linear",              # QLoRA 标配：注入所有线性层
    lora_dropout=0.1,
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, config)
model.print_trainable_parameters()
```

> **铁律**：QLoRA = `BitsAndBytesConfig(4-bit nf4)` 加载基模 + `LoraConfig(target_modules="all-linear")`。基模占显存约为 fp16 的 1/4，是单卡跑 7B+ 的关键。

## 保存、加载、合并 adapter

```python
# ① 保存：只存 adapter（几 MB ~ 几百 MB），不存基模
model.save_pretrained("./my-lora")
# 生成 adapter_config.json + adapter_model.safetensors

# ② 加载：基模 + adapter
from peft import PeftModel
base = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
model = PeftModel.from_pretrained(base, "./my-lora")

# ③ 合并：把 adapter 融入基模，推理无额外开销
merged = model.merge_and_unload()
merged.save_pretrained("./my-merged-model")   # 之后可直接用，不需要 adapter
```

## TRL：SFTTrainer 监督微调

```python
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

dataset = load_dataset("trl-lib/Capybara", split="train")   # 多轮对话数据

trainer = SFTTrainer(
    model="Qwen/Qwen2.5-0.5B-Instruct",
    train_dataset=dataset,
    args=SFTConfig(
        output_dir="./sft-out",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        learning_rate=2e-5,
        bf16=True,
    ),
)
trainer.train()
```

SFTTrainer 自动：tokenize、应用 chat template（对话数据）、padding/packing、计算 loss（默认 chunked_nll，省显存）。也可直接接收字符串模型 id 与 `peft_config`。

## SFT/DPO/GRPO 数据格式

```python
# ① SFT：language modeling（text）或 prompt-completion
{"text": "完整文本"}
{"prompt": "The sky is", "completion": " blue."}

# ② DPO：preference（prompt + chosen + rejected）
{"prompt": "What color is the sky?",
 "chosen": "It is blue.",
 "rejected": "It is green."}

# ③ GRPO：prompt + 奖励函数（数据集只需 prompt + 额外列传给奖励函数）
{"prompt": "Solve: 2+2=?", "ground_truth": "4"}
```

## 后训练（post-training）流水线

现代大模型训练的典型阶段，TRL 各有对应训练器：

| 阶段 | 目的 | 训练器 | 数据 |
| --- | --- | --- | --- |
| 预训练 | 学语言/世界知识 | （Transformers Trainer，非 TRL） | 纯文本 |
| **SFT** | 学会遵循指令 | `SFTTrainer` | prompt-completion |
| **奖励建模** | 学人类偏好打分 | `RewardTrainer` | preference 对 |
| **RLHF/PPO** | 用奖励信号对齐 | `PPOTrainer` | prompt + reward model |
| **DPO** | 无奖励模型对齐 | `DPOTrainer` | preference 对 |
| **GRPO** | 学推理（可验证奖励） | `GRPOTrainer` | prompt + 奖励函数 |

## 下一步

- 入门后请读 **指南**：LoRA/QLoRA 全参数、各 PEFT 方法对比、DPO/PPO/GRPO 原理与 loss、TRL + PEFT 组合、奖励函数设计
- 调通后看 **参考**：PEFT 方法速查表、TRL 训练器对照、loss_type 选项、版本与默认值、与 Transformers Trainer 的关系
- 想做数据处理/训练 tokenizer，转向 **Datasets 与 Tokenizers** 叶子；想用全量训练 API，看 **Transformers** 叶子
