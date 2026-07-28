---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Hugging Face PEFT 官方文档（huggingface.co/docs/peft，LoRA/QLoRA/AdaLoRA/Prefix/Prompt 章节）与 TRL 官方文档（huggingface.co/docs/trl，sft/dpo/grpo/ppo 章节）编写

## 速查

- **PEFT 方法族**：LoRA（低秩）/ QLoRA（4bit+LoRA）/ AdaLoRA（自适应秩）/ Prefix Tuning / Prompt Tuning / P-Tuning v2 / IA³ / VeRA / BOFT
- **PEFT 核心 API**：`LoraConfig` / `get_peft_model` / `PeftModel.from_pretrained` / `prepare_model_for_kbit_training` / `merge_and_unload`
- **LoRA 缩放**：adapter 输出乘以 `lora_alpha / r`（或 rank-stabilized 时用 `alpha / sqrt(r)`）
- **QLoRA 配置**：`BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)`
- **kbit 训练**：量化模型训练前调 `prepare_model_for_kbit_training(model)`（启用梯度检查点等）
- **SFT 默认值**：`learning_rate=2e-5`、`bf16=True`、`gradient_checkpointing=True`、`loss_type="chunked_nll"`、`logging_steps=10`（与 Trainer 不同）
- **DPO 核心**：`DPOConfig(beta=0.1)`、loss_type 默认 sigmoid、需参考模型（ref_model，可省略自动用初始策略）
- **GRPO 核心**：无需 critic，用 `reward_funcs`（普通函数/async/外部工具），按组生成 + 组相对优势
- **RLHF vs DPO vs GRPO**：RLHF(PPO) 需奖励+价值+参考模型；DPO 无需奖励模型用偏好对；GRPO 无需价值模型用组内相对奖励
- **TRL + PEFT 组合**：所有 TRL 训练器都接收 `peft_config=`，QLoRA + SFT/DPO 是消费级 GPU 标配
- **多 adapter**：`add_adapter` / `set_adapter` / `load_adapter` 支持一个基模挂多个适配器

## LoRA 原理与参数

LoRA（Low-Rank Adaptation）冻结原始权重 W，在旁路注入低秩更新 ΔW = B·A（A 是 r×d、B 是 d×r，rank r 远小于 d）。前向变成 `W·x + (lora_alpha/r)·B·A·x`，只训 A、B。

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,                                   # 秩：表达力 vs 参数量的权衡
    lora_alpha=32,                          # 缩放：有效系数 = alpha/r = 2
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(base_model, config)
```

- **r 调多大**：任务越复杂、与基模差异越大，r 越大（16/32/64）；简单任务 r=8 即可。r 翻倍 ≈ 参数翻倍
- **alpha 经验**：常设为 r 的 1-2 倍，使有效缩放（alpha/r）在 1-2 之间
- **target_modules 选法**：`"all-linear"`（QLoRA 推荐，注入所有线性层）、或具体名（如 attention 的 q/k/v/o_proj + MLP 的 gate/up/down_proj）

## QLoRA 全流程

```python
import torch
from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# ① 4-bit nf4 量化加载基模
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",            # NormalFloat4，为正态分布权重优化
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,       # 二次量化，再省一点显存
)
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
)

# ② 量化模型训练前的准备（启用梯度检查点、确保输入嵌入参与梯度）
model = prepare_model_for_kbit_training(model)

# ③ 注入 LoRA（标配 all-linear）
config = LoraConfig(
    r=64, lora_alpha=16, lora_dropout=0.1,
    target_modules="all-linear",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, config)
model.print_trainable_parameters()
```

> **铁律**：`prepare_model_for_kbit_training` 是量化模型做训练的必经步骤，否则反传/梯度检查点会出错。nf4 是为「正态分布的神经网络权重」设计的 4-bit 数据类型，比普通 int4 更准。

## 各 PEFT 方法对比

| 方法 | 思路 | 可训参数位置 | 适用 |
| --- | --- | --- | --- 通用首选 |
| AdaLoRA | 自适应按重要性分配秩 | 同 LoRA 但秩可变 | 预算固定、想自动调秩 |
| Prefix Tuning | 在每层 K/V 前加可训软前缀 | 软前缀向量 | 生成任务、参数极省 |
| Prompt Tuning | 仅在输入加可训软提示 | 输入端软提示 | 大模型（10B+）、参数最省 |
| P-Tuning v2 | Prefix Tuning 的逐层版 | 每层加提示 | 与 Prefix 类似 |
| IA³ | 学向量重缩放激活 | 三个重缩放向量 | 极度参数省、推理开销小 |
| VeRA | 共享一个冻结随机矩阵，只训缩放向量 | 缩放向量 | 比 LoRA 再省 10x 参数 |

## DPOTrainer：直接偏好优化

DPO 把 RLHF 的「奖励模型 + 强化学习」一步化为分类损失：直接最大化 chosen 与 rejected 的对数似然差（相对参考模型），无需显式奖励模型、无需在线采样。

```python
from trl import DPOTrainer, DPOConfig
from datasets import load_dataset

dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")

trainer = DPOTrainer(
    model="Qwen/Qwen2.5-0.5B-Instruct",
    train_dataset=dataset,
    args=DPOConfig(
        output_dir="./dpo-out",
        beta=0.1,                          # 控制偏离参考模型的强度
        loss_type="sigmoid",               # 默认，另有 ipo/hinge/sigmoid_norm 等
        learning_rate=1e-6,                # DPOConfig 默认 1e-6（比 SFT 小）
        bf16=True,
    ),
)
trainer.train()
```

DPO 数据必须是 preference 格式：`{prompt, chosen, rejected}`。

- **beta**：越大越保守（贴近参考模型），默认 0.1
- **loss_type**：`sigmoid`（默认）/`ipo`/`hinge`/`sigmoid_norm`（SimPO 风格）/`robust`（抗噪）等十余种
- **ref_model**：可省略，省略时自动用训练开始前的策略副本作参考

## GRPOTrainer：组相对策略优化

GRPO 是 DeepSeek-R1 等推理模型的核心方法：对每个 prompt 生成一组（G 个）completion，用奖励函数打分，优势用组内（reward - 均值）/ 标准差计算，**无需价值/critic 模型**。

```python
from trl import GRPOTrainer, GRPOConfig
from datasets import load_dataset

dataset = load_dataset("trl-lib/DeepMath-103K", split="train")

def reward_correctness(completions, ground_truth, **kwargs):
    # 比对生成答案与 ground_truth，正确给 1
    import re
    results = []
    for c, gt in zip(completions, ground_truth):
        m = re.search(r"\\boxed\{(.*?)\}", c)
        results.append(1.0 if (m and m.group(1) == gt) else 0.0)
    return results

trainer = GRPOTrainer(
    model="Qwen/Qwen2.5-0.5B-Instruct",
    reward_funcs=reward_correctness,        # 普通函数/async/外部工具均可
    train_dataset=dataset,
    args=GRPOConfig(output_dir="./grpo-out", bf16=True),
)
trainer.train()
```

- **reward_funcs**：可传单个/多个；可以是 Python 函数、async 函数、或外部模型
- **数据集额外列**（如 `ground_truth`）会自动作为 kwargs 传给奖励函数
- **G（num_generations）**：每个 prompt 生成几个，组越大优势估计越稳但更贵

## RLHF（PPO）vs DPO vs GRPO

| 维度 | RLHF/PPO | DPO | GRPO |
| --- | --- | --- | --- |
| 需奖励模型 | 是（需先训） | 否（隐式） | 否（用奖励函数） |
| 需价值/critic 模型 | 是 | 否 | 否 |
| 需参考模型 | 是 | 是（可省略） | 是 |
| 数据 | prompt + reward 信号 | preference 对（chosen/rejected） | prompt + 可验证奖励 |
| 在线采样 | 是（生成 + 打分） | 否（离线） | 是（组生成） |
| 稳定性 | 难调、易 reward hacking | 稳定、易实现 | 介于二者 |
| 典型用途 | 经典对齐 | 偏好对齐 | 推理（数学/代码） |

## TRL + PEFT 组合（QLoRA 微调）

所有 TRL 训练器都原生支持 `peft_config=`，QLoRA + SFT/DPO 是消费级 GPU 微调大模型的事实标准：

```python
from trl import SFTTrainer, SFTConfig
from peft import LoraConfig
from datasets import load_dataset

trainer = SFTTrainer(
    model="Qwen/Qwen2.5-7B-Instruct",
    train_dataset=load_dataset("trl-lib/Capybara", split="train"),
    args=SFTConfig(output_dir="./qlora-sft", bf16=True, learning_rate=1e-4),  # PEFT 用更大 lr
    peft_config=LoraConfig(r=64, lora_alpha=16, target_modules="all-linear", task_type="CAUSAL_LM"),
)
trainer.train()
```

> **铁律**：用 PEFT 训练 adapter 时，学习率通常要比全量微调**高一个数量级**（SFT 约 1e-4，DPO 约 1e-5），因为只学新参数。

## 多 adapter 与切换

```python
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
model = PeftModel.from_pretrained(base, "./lora-math", adapter_name="math")
model.load_adapter("./lora-code", adapter_name="code")   # 挂第二个

model.set_adapter("code")   # 切到 code adapter 推理
model.set_adapter("math")   # 切回 math
```

一个基模挂多个适配器，推理时按需切换，省存储。

## SFTConfig 与 Trainer TrainingArguments 的默认值差异

TRL 的 SFTConfig 继承 TrainingArguments 但改了几个关键默认：

| 参数 | TrainingArguments 默认 | SFTConfig 默认 |
| --- | --- | --- |
| `learning_rate` | `5e-5` | `2e-5` |
| `logging_steps` | `500` | `10` |
| `bf16` | `False` | `True`（若 fp16 未设） |
| `gradient_checkpointing` | `False` | `True` |
| `loss_type`（SFT 特有） | — | `"chunked_nll"`（省显存） |

## 陷阱与最佳实践

- **量化模型没调 prepare_model_for_kbit_training**：反传会报错或梯度异常，QLoRA 必备
- **LoRA r 过小导致欠拟合**：任务复杂时 r=8 可能不够，升到 32/64
- **lora_alpha 与 r 比例离谱**：alpha 远小于 r 会让 adapter 几乎不起作用，建议 alpha≈r~2r
- **DPO 用错数据格式**：DPO 必须有 chosen + rejected（不是 completion），否则报错
- **GRPO 奖励函数返回长度不对**：必须返回与 completions 等长的 list[float]
- **用 PEFT 但学习率没调高**：adapter 训不动，SFT 用 ~1e-4，DPO 用 ~1e-5
- **ref_model 与 policy 不同源**：DPO 省略 ref_model 时用初始策略，别中途改 model
- **合并权重后还想继续训**：merge_and_unload 产出的是普通模型，再训就不是 PEFT 了
- **推理没合并/没加载 adapter**：保存的只是 adapter，推理要么 merge 要么 PeftModel.from_pretrained 加载
