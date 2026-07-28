---
layout: doc
---

# Hugging Face Transformers

Hugging Face Transformers 是由 Hugging Face 维护的开源**预训练模型推理与训练框架**，也是整个 HF 生态的模型定义「枢纽」——Hub 上有 100 万+ 个可直接加载的模型 checkpoint。它的核心定位是「**一套 API、横跨数千模型、覆盖推理与训练**」：用 `pipeline()` 一行代码完成文本分类/命名实体识别/问答/摘要/翻译/生成等任务，用 `AutoModel.from_pretrained()` / `AutoTokenizer.from_pretrained()` 按 repo id 自动推断并加载任意架构（BERT、GPT、T5、LLaMA、Qwen、Mistral 等），用 `Trainer` + `TrainingArguments` 提供混合精度（fp16/bf16）、torch.compile、FlashAttention、FSDP/DeepSpeed 分布式的「全家桶」训练循环，再用 `save_pretrained()` / `push_to_hub()` 一键保存与上传。设计上每个模型只由三件套组成：**configuration（配置）+ model（模型）+ preprocessor（tokenizer/processor）**，因此可被 vLLM、TGI、Axolotl、Unsloth、llama.cpp 等上下游生态复用同一份定义。注意边界：本叶聚焦 Transformers 库本身的「训练侧 API」（pipeline/AutoModel/Trainer），与第 19 章 LangChain 的「应用侧编排」区分。信源 huggingface.co/docs/transformers（当前 v5.x 主线）。

## 评价

**优点**

- **模型覆盖碾压级**：Hub 上 100 万+ checkpoint、数千架构（编码器/解码器/编码解码器/多模态），一行 `from_pretrained` 就能加载，是事实上的「模型分发中心」
- **AutoClass 自动化**：`AutoModel*` / `AutoTokenizer` / `AutoProcessor` 按任务自动选对类（SequenceClassification/CausalLM/TokenClassification/QuestionAnswering/Seq2SeqLM），不必记住每个模型的具体实现类名
- **pipeline 一行推理**：`pipeline("text-classification")(...)` 封装 tokenization + 模型 + 后处理，开箱即用，适合原型与脚本
- **Trainer 全家桶训练**：`TrainingArguments` + `Trainer` 内置 fp16/bf16、梯度累积、checkpoint、early stopping、wandb、分布式（FSDP/DeepSpeed）、push_to_hub，省去手写训练循环
- **上下游生态贯通**：模型定义被 vLLM/TGI/Axolotl/llama.cpp 等复用，训练完的权重可在多个推理引擎间无缝迁移
- **任务抽象清晰**：每种任务对应一种 pipeline 与一个 `*ForXxx` head，模型/任务/数据三者解耦，迁移学习成本低

**缺点**

- **API 面太大、学习曲线陡**：AutoModelFor* 有十几个变体、Trainer 参数上百个，新手易迷失在选项里
- **默认行为随大版本变动**：v5 起 `from_pretrained` 的 dtype 默认从 config 推断（而非恒为 float32），`evaluation_strategy` 等参数多次改名，旧脚本易踩坑
- **Trainer 抽象有「天花板」**：高度定制化的训练逻辑（非标准 loss、复杂采样、强化学习）用 Trainer 反而别扭，最终仍要回到原生 PyTorch 循环或转向 TRL
- **推理性能非最优**：Transformers 适合通用推理与训练，但极致吞吐场景（高 QPS、长上下文）仍需 vLLM/TGI 等专用引擎
- **缓存与下载体量**：大模型动辄数十 GB，默认缓存到 `~/.cache/huggingface`，磁盘紧张时需手动管理；离线与镜像配置有学习成本
- **generate 解码参数繁多**：`do_sample`/`temperature`/`top_p`/`top_k`/`num_beams`/`repetition_penalty` 组合复杂，调出稳定输出需经验

## 文档地址

- [Transformers 官方文档](https://huggingface.co/docs/transformers/index)
- [Pipeline 教程](https://huggingface.co/docs/transformers/pipeline_tutorial)
- [Trainer 主类](https://huggingface.co/docs/transformers/main_classes/trainer)
- [AutoClass 概览](https://huggingface.co/docs/transformers/model_doc/auto)
- [Preprocessing（tokenize）](https://huggingface.co/docs/transformers/preprocessing)
- [LLM 生成（generate）](https://huggingface.co/docs/transformers/llm_tutorial)

## GitHub地址

- [huggingface/transformers](https://github.com/huggingface/transformers)
- [Releases（版本事实来源）](https://github.com/huggingface/transformers/releases)

## 幻灯片地址

<a href="/SlideStack/hf-transformers-slide/" target="_blank">Hugging Face Transformers</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Hugging%20Face%20Transformers" target="_blank" rel="noopener noreferrer">Hugging Face Transformers 测试题</a>
