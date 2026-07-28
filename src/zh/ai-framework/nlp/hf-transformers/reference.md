---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Hugging Face Transformers 官方文档（huggingface.co/docs/transformers，main_classes / API Reference）+ GitHub 整理

## 速查

- **核心入口**：`pipeline` / `AutoTokenizer` / `AutoModel*` / `Trainer` / `TrainingArguments`
- **加载/保存**：`from_pretrained` ↔ `save_pretrained` ↔ `push_to_hub`
- **三件套**：configuration（`config.json`）+ model（`.safetensors`/`.bin`）+ tokenizer（`tokenizer.json` 等）
- **任务 head**：`*ForSequenceClassification` / `*ForTokenClassification` / `*ForQuestionAnswering` / `*ForCausalLM` / `*ForMaskedLM` / `*ForSeq2SeqLM`
- **训练循环**：`Trainer.train()` / `.evaluate()` / `.predict()` / `.save_model()` / `.push_to_hub()`
- **后端**：PyTorch（默认）/ TensorFlow / JAX
- **量化**：`BitsAndBytesConfig`（4bit/8bit，配合 bitsandbytes）
- **当前版本**：v5.x 主线（v5 起 dtype 从 config 推断、参数多次改名）
- **缓存**：`~/.cache/huggingface/hub`，`HF_HOME` 改路径，`HF_HUB_OFFLINE=1` 离线
- **安装**：`pip install transformers` / `pip install "transformers[torch]"`
- **import 名**：`import transformers` / `from transformers import ...`

## AutoClass 速查表

| AutoClass | 用途 | 典型调用 |
| --- | --- | --- |
| `AutoTokenizer` | 文本→token ids | `AutoTokenizer.from_pretrained(id)` |
| `AutoProcessor` | 多模态输入（图像+文本+音频） | `AutoProcessor.from_pretrained(id)` |
| `AutoImageProcessor` | 图像预处理 | `AutoImageProcessor.from_pretrained(id)` |
| `AutoFeatureExtractor` | 音频/视觉特征 | `AutoFeatureExtractor.from_pretrained(id)` |
| `AutoConfig` | 仅加载配置 | `AutoConfig.from_pretrained(id)` |
| `AutoModel` | backbone（取隐藏态） | `AutoModel.from_pretrained(id)` |
| `AutoModelForSequenceClassification` | 文本分类 | `from_pretrained(id, num_labels=N)` |
| `AutoModelForTokenClassification` | NER/词性 | `from_pretrained(id, num_labels=N)` |
| `AutoModelForQuestionAnswering` | 抽取式 QA | `from_pretrained(id)` |
| `AutoModelForCausalLM` | GPT 风格生成 | `from_pretrained(id)` |
| `AutoModelForMaskedLM` | BERT 掩码 | `from_pretrained(id)` |
| `AutoModelForSeq2SeqLM` | T5/BART seq2seq | `from_pretrained(id)` |
| `AutoModelForImageClassification` | 图像分类 | `from_pretrained(id, num_labels=N)` |
| `AutoModelForSpeechSeq2Seq` | 语音识别（Whisper） | `from_pretrained(id)` |

## pipeline 任务对照

| 任务名 | 别名 | 输入 | 输出 |
| --- | --- | --- | --- |
| `text-classification` | `sentiment-analysis` | 字符串/list | `[{label, score}]` |
| `token-classification` | `ner` | 字符串 | `[{entity, score, word, start, end, index}]` |
| `question-answering` | — | `{question, context}` | `{answer, start, end, score}` |
| `summarization` | — | 字符串 | `[{summary_text}]` |
| `translation_xx_to_yy` | — | 字符串 | `[{translation_text}]` |
| `text-generation` | — | 字符串/list | `[{generated_text}]` |
| `text2text-generation` | — | 字符串 | `[{generated_text}]`（seq2seq） |
| `fill-mask` | — | 带 `&lt;mask&gt;` 的字符串 | `[{sequence, score, token, token_str}]` |
| `zero-shot-classification` | — | `(text, candidate_labels)` | `{labels, scores, sequence}` |
| `image-classification` | — | 图像/PIL | `[{label, score}]` |
| `object-detection` | — | 图像 | `[{score, label, box}]` |
| `automatic-speech-recognition` | `asr` | 音频 | `{text}` |
| `feature-extraction` | — | 字符串 | 向量 |
| `conversational` | — | `Conversation` | `Conversation` |

## from_pretrained 常用参数

| 参数 | 类型 | 作用 |
| --- | --- | --- |
| `pretrained_model_name_or_path` | str | repo id 或本地目录（必填） |
| `dtype` | str/torch.dtype | v5 从 config 推断，可显式覆盖（`"float32"`/`"bfloat16"`/`"float16"`） |
| `revision` | str | 指定 git 分支/tag/commit |
| `token` | str | 私有仓库访问令牌 |
| `cache_dir` | str | 自定义缓存目录 |
| `force_download` | bool | 强制重新下载 |
| `local_files_only` | bool | 仅用本地缓存（离线） |
| `device_map` | str/dict | `auto`/`balanced`/具体映射，配合 accelerate |
| `low_cpu_mem_usage` | bool | 低内存加载（大模型） |
| `trust_remote_code` | bool | 允许执行仓库自定义代码 |
| `quantization_config` | `BitsAndBytesConfig` | 4bit/8bit 量化加载 |
| `torch_dtype` | torch.dtype | 旧参数名，等价于 `dtype` |
| `attn_implementation` | str | `eager`/`sdpa`/`flash_attention_2` |

## Trainer 主要方法

| 方法 | 作用 |
| --- | --- |
| `trainer.train(resume_from_checkpoint=...)` | 启动训练，可断点续训 |
| `trainer.evaluate(eval_dataset=...)` | 在 eval 集跑指标 |
| `trainer.predict(test_dataset=...)` | 在测试集出预测 |
| `trainer.save_model(output_dir=...)` | 保存当前模型+tokenizer |
| `trainer.push_to_hub(commit_message=...)` | 上传到 Hub |
| `trainer.add_callback(cb)` / `remove_callback(cb)` | 增删回调 |
| `trainer.create_model_card()` | 生成模型卡片 |
| `trainer.log(logs)` | 手动记日志 |

## 默认值变更（v5 关键迁移点）

| 项 | 旧（≤ v4） | 新（v5） |
| --- | --- | --- |
| `from_pretrained` dtype | 恒 float32 | 从 config 推断 |
| 评估策略参数 | `evaluation_strategy` | `eval_strategy` |
| Trainer 的 tokenizer 参数 | `tokenizer=` | `processing_class=`（旧名兼容） |
| `max_length`（generate） | 含输入长度 | 推荐用 `max_new_tokens` |
| `torch_dtype` | 主参数 | 仍可用，推荐 `dtype` |
| 缓存结构 | `transformers/` 目录 | `hub/` 目录（huggingface_hub 统一） |

## 架构族与命名

| 架构族 | 类名前缀 | 类型 | 代表任务 |
| --- | --- | --- | --- |
| BERT | `Bert` | Encoder | 分类、NER、QA |
| RoBERTa | `Roberta` | Encoder | 同 BERT |
| DistilBERT | `DistilBert` | Encoder | 轻量分类 |
| DeBERTa | `DebertaV2` | Encoder | 分类、NER |
| GPT-2 / GPT-NeoX | `GPT2` / `GPTNeoX` | Decoder | 生成 |
| LLaMA / Qwen / Mistral / Gemma / Phi | `Llama` / `Qwen2` / `Mistral` / `Gemma` / `Phi3` | Decoder | 生成、对话 |
| T5 / mT5 | `T5` | Encoder-Decoder | 翻译、摘要 |
| BART / Marian | `Bart` / `Marian` | Encoder-Decoder | 翻译、摘要 |
| Whisper | `Whisper` | Encoder-Decoder | 语音识别 |
| CLIP / LLaVA / Qwen-VL | `CLIP` / `Llava` / `Qwen2VL` | 多模态 | 图文 |

## 版本与兼容

### 近期版本要点

| 版本线 | 状态 | 关键点 |
| --- | --- | --- |
| v5.x | 主线（2026） | dtype 默认从 config 推断；`eval_strategy` 改名；统一用 `processing_class`；缓存走 hub/ |
| v4.x | 旧主线 | `evaluation_strategy`、`torch_dtype`、`tokenizer=` 等旧参数；`max_length` 用法 |
| v3.x | 归档 | 早期 Keras/TF 支持更全 |

### 兼容性

- **Python**：≥ 3.9（推荐 3.10–3.12）
- **PyTorch**：≥ 2.0
- **依赖**：`tokenizers`（快速分词）/ `huggingface_hub`（Hub 交互）/ `safetensors`（安全权重）/ `accelerate`（分布式，可选）/ `sentencepiece`（部分 tokenizer）
- **权重格式**：`.safetensors`（默认，安全）/ `.bin`（旧，pickle）
- **import 名**：`from transformers import AutoModel, AutoTokenizer, pipeline, Trainer, TrainingArguments`

## 与同类库对比

| 维度 | Transformers | LangChain | vLLM | Axolotl |
| --- | --- | --- | --- | --- |
| 定位 | 模型定义/推理/训练 | 应用编排/Agent | 高吞吐推理 | 训练封装 |
| 重点 | 训练侧 API（Trainer/AutoModel） | 应用侧（链/记忆/工具） | 推理服务化 | 微调工作流 |
| 是否依赖前者 | — | 依赖 Transformers 加载模型 | 复用 Transformers 模型定义 | 封装 Transformers + PEFT + TRL |
| 模型覆盖 | 100 万+ | 调用前者 | 同前者 | 同前者 |
| 场景 | 通用 NLP/CV/Audio | RAG/Agent | 生产推理 | LLM 微调 |

## 官方资源

- [Transformers 官方文档](https://huggingface.co/docs/transformers/index)
- [Pipeline 教程](https://huggingface.co/docs/transformers/pipeline_tutorial)
- [Trainer 主类](https://huggingface.co/docs/transformers/main_classes/trainer)
- [AutoClass](https://huggingface.co/docs/transformers/model_doc/auto)
- [Preprocessing](https://huggingface.co/docs/transformers/preprocessing)
- [LLM 生成教程](https://huggingface.co/docs/transformers/llm_tutorial)
- [GitHub huggingface/transformers](https://github.com/huggingface/transformers)
- [Releases](https://github.com/huggingface/transformers/releases)
- [Hub 模型库（100 万+）](https://huggingface.co/models)
