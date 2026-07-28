---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Hugging Face PEFT 官方文档（huggingface.co/docs/peft，API Reference）与 TRL 官方文档（huggingface.co/docs/trl）整理

## 速查

- **PEFT 核心 API**：`LoraConfig` / `get_peft_model` / `PeftModel` / `AutoPeftModel*` / `prepare_model_for_kbit_training`
- **PEFT 方法**：LoRA / QLoRA / AdaLoRA / Prefix Tuning / Prompt Tuning / P-Tuning / IA³ / VeRA / BOFT
- **TRL 训练器**：`SFTTrainer` / `DPOTrainer` / `PPOTrainer` / `RewardTrainer` / `GRPOTrainer`（另含 RLOO/Nash-MD/XPO/Online DPO 等实验性方法）
- **TRL Config**：`SFTConfig` / `DPOConfig` / `GRPOConfig` / `PPOConfig` / `RewardConfig`
- **后训练阶段**：SFT → Reward Modeling → RLHF(PPO) / DPO / GRPO
- **量化配置**：`BitsAndBytesConfig(load_in_4bit, bnb_4bit_quant_type, bnb_4bit_compute_dtype)`
- **安装**：`pip install peft trl`（配合 transformers/accelerate/bitsandbytes）
- **当前版本**：PEFT v0.x 主线 / TRL v0.x 主线（持续演进，API 变动较频繁）
- **与 Trainer 关系**：所有 TRL 训练器是 `transformers.Trainer` 的子类，继承其全部方法
- **import 名**：`from peft import LoraConfig, get_peft_model, PeftModel` / `from trl import SFTTrainer, DPOTrainer, GRPOTrainer`

## PEFT 方法速查

### Config 类与 Trainer

| 方法 | Config 类 | 适用 |
| --- | --- | --- |
| LoRA | `LoraConfig` | 通用首选 |
| AdaLoRA | `AdaLoraConfig` | 自适应秩 |
| Prefix Tuning | `PrefixTuningConfig` | 生成任务 |
| Prompt Tuning | `PromptTuningConfig` | 超大模型 |
| P-Tuning v2 | `PromptEncoderConfig` | 与 Prefix 类似 |
| IA³ | `IA3Config` | 极省参数 |
| VeRA | `VeraConfig` | 共享随机矩阵 |
| BOFT | `BOFTConfig` | 正交 Butterfly |

### LoraConfig 全字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `r` | int | 8 | LoRA 秩 |
| `lora_alpha` | int | 8 | 缩放系数，有效 = alpha/r |
| `lora_dropout` | float | 0.0 | adapter dropout |
| `target_modules` | str/list/None | None | 注入层；可 `"all-linear"` |
| `bias` | str | "none" | none/all/lora_only |
| `task_type` | str | None | CAUSAL_LM/SEQ_CLS/SEQ_2_SEQ_LM/TOKEN_CLS/QUESTION_ANS |
| `modules_to_save` | list | None | 除 adapter 外还要全训的模块（如分类头） |
| `fan_in_fan_out` | bool | False | 旧 GPT 风格 |
| `layers_to_transform` | list | None | 只训指定层 |
| `layers_pattern` | str | None | 配合 layers_to_transform |

### QLoRA 的 BitsAndBytesConfig

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `load_in_4bit` | False | 4-bit 加载 |
| `load_in_8bit` | False | 8-bit 加载（二选一） |
| `bnb_4bit_quant_type` | "fp4" | "fp4" 或 "nf4"（QLoRA 用 nf4） |
| `bnb_4bit_compute_dtype` | float32 | 反量化计算 dtype（建议 bfloat16） |
| `bnb_4bit_use_double_quant` | False | 二次量化省显存 |
| `llm_int8_enable_fp32_cpu_offload` | False | 8-bit CPU 卸载 |

### PEFT 核心 API

| API | 作用 |
| --- | --- |
| `get_peft_model(model, peft_config)` | 包装基模，注入 adapter 并冻结基模 |
| `PeftModel.from_pretrained(base, adapter_path)` | 加载已保存的 adapter |
| `AutoPeftModelForCausalLM.from_pretrained(path)` | 自动推断任务类加载 |
| `prepare_model_for_kbit_training(model)` | 量化模型训练前准备 |
| `model.merge_and_unload()` | 把 adapter 合并进基模 |
| `model.print_trainable_parameters()` | 打印可训练参数统计 |
| `model.add_adapter/load_adapter/set_adapter` | 多 adapter 管理 |
| `PeftConfig.from_pretrained(path)` | 仅读 adapter 配置 |

## TRL 训练器速查

| 训练器 | Config | 方法类别 | 数据格式 | 关键参数 |
| --- | --- | --- | --- | --- |
| `SFTTrainer` | `SFTConfig` | 监督微调（SFT） | text / prompt-completion / conversational | `packing`/`assistant_only_loss`/`completion_only_loss` |
| `DPOTrainer` | `DPOConfig` | 直接偏好优化（离线） | preference（prompt+chosen+rejected） | `beta`/`loss_type`/`ref_model` |
| `PPOTrainer` | `PPOConfig` | RLHF（在线强化） | prompt + reward model | （经典 RLHF，四模型） |
| `RewardTrainer` | `RewardConfig` | 奖励建模 | preference 对 | 训练打分模型 |
| `GRPOTrainer` | `GRPOConfig` | 组相对策略（在线） | prompt + 奖励函数 | `reward_funcs`/`num_generations` |
| `RLOOTrainer` | `RLOOConfig` | REINFORCE Leave-One-Out | prompt + reward | 在线 RL 变体 |
| `OnlineDPOTrainer` | `OnlineDPOConfig` | 在线 DPO | prompt + 奖励 | 边生成边学 |
| `NashMDTrainer` / `XPOTrainer` | — | Nash 均衡 / 极端策略 | prompt | 实验性 |

### SFT loss_type

| 值 | 说明 |
| --- | --- |
| `"chunked_nll"`（默认） | 与 nll 同数学，但按 chunk 算 cross-entropy 省显存 |
| `"nll"` | 标准 negative log-likelihood |
| `"dft"` | Dynamic Fine-Tuning（提升泛化） |

### DPO loss_type（部分）

| 值 | 来源 |
| --- | --- |
| `"sigmoid"`（默认） | 原 DPO 论文（Bradley-Terry + logsigmoid） |
| `"hinge"` | RSO/SLiC |
| `"ipo"` | IPO（防过拟合） |
| `"sigmoid_norm"` | SimPO（按长度归一化） |
| `"robust"` | Robust DPO（抗标签噪声，配 label_smoothing） |
| `"apo_zero"` / `"apo_down"` | APO（锚定目标） |
| `"discopop"` | DiscoPOP |
| `"sft"` | 退化为 SFT 损失 |

## 数据格式对照

| 任务 | 必需字段 | 示例 |
| --- | --- | --- |
| SFT（language modeling） | `text` 或 `messages` | `{"text": "..."}` / `{"messages":[{role,content}]}` |
| SFT（prompt-completion） | `prompt`, `completion` | `{"prompt":"Q","completion":"A"}` |
| DPO | `prompt`, `chosen`, `rejected` | `{"prompt":"Q","chosen":"好答","rejected":"坏答"}` |
| GRPO | `prompt`（+ 额外列传给奖励） | `{"prompt":"Q","ground_truth":"4"}` |
| Reward | `chosen`, `rejected` | preference 对 |
| KTO | `prompt`, `completion`, `label` | 单样本带好坏标签 |

## 版本与兼容

### 近期要点

| 库 | 版本线 | 状态 | 关键点 |
| --- | --- | --- | --- |
| PEFT | v0.x（2026 主线） | 活跃 | LoRA/QLoRA/AdaLoRA/VeRA；与 transformers bitsandbytes 联动 |
| TRL | v0.x（2026 主线） | 活跃 | SFT/DPO/GRPO；config 字段与默认值随版本调整（loss_type、packing 策略） |

### 兼容性

- **Python**：≥ 3.9（推荐 3.10–3.12）
- **依赖**：`transformers` / `accelerate` / `datasets` / `peft`（TRL）/ `bitsandbytes`（QLoRA）
- **硬件**：QLoRA + bf16 让 7B 单卡可训；更大模型需多卡或 FSDP + PEFT
- **import 名**：`from peft import LoraConfig, get_peft_model, PeftModel`；`from trl import SFTTrainer, DPOTrainer, GRPOTrainer`

## 与同类库对比

| 维度 | PEFT + TRL | Axolotl | Unsloth | Unify（自研） |
| --- | --- | --- | --- | --- |
| 定位 | 参数高效微调 + 对齐训练器 | 训练封装（YAML 配置） | 加速微调（内核优化） | 自研训练框架 |
| 抽象层级 | 库级 API | 配置驱动 | 内核级优化 | — |
| 与前者关系 | 基础库 | 封装 PEFT+TRL+Transformers | 内核 + 兼容 PEFT/TRL 接口 | — |
| 优势 | 方法全、与生态紧耦合 | 一条命令跑通 | 显存/速度更优（2x 速度、70% 省显存） | — |
| 场景 | 灵活开发 | 快速实验 | 资源受限 | — |

TRL 文档明确列出了 Unsloth / Liger Kernel 等集成：可 `use_liger_kernel=True`（提 20% 吞吐、省 60% 显存），或经 Unsloth 提速。

## 官方资源

- [PEFT 官方文档](https://huggingface.co/docs/peft/index)
- [PEFT LoRA 开发指南](https://huggingface.co/docs/peft/main/en/developer_guides/lora)
- [PEFT 方法总览](https://huggingface.co/docs/peft/main/en/package_reference/mapping)
- [TRL 官方文档](https://huggingface.co/docs/trl/index)
- [SFTTrainer](https://huggingface.co/docs/trl/main/en/sft_trainer)
- [DPOTrainer](https://huggingface.co/docs/trl/main/en/dpo_trainer)
- [GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer)
- [TRL 数据格式](https://huggingface.co/docs/trl/main/en/dataset_formats)
- [GitHub huggingface/peft](https://github.com/huggingface/peft)
- [GitHub huggingface/trl](https://github.com/huggingface/trl)
- [LLM 后训练课程](https://huggingface.co/learn/llm-course)
