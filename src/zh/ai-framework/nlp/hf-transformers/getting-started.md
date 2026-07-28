---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Hugging Face Transformers 官方文档（huggingface.co/docs/transformers，v5.x 主线）+ GitHub README 编写

## 速查

- **安装**：`pip install transformers`（推理）/ `pip install "transformers[torch]"`（含 PyTorch 后端）
- **三件套**：tokenizer（文本→token ids）+ model（神经网络）+ config（架构参数）
- **一行推理**：`from transformers import pipeline; pipe = pipeline("text-classification")`
- **自动类**：`AutoTokenizer` / `AutoModel` / `AutoModelForSequenceClassification` / `AutoModelForCausalLM` / `AutoModelForTokenClassification` / `AutoModelForQuestionAnswering`
- **加载**：`model = AutoModel.from_pretrained("bert-base-uncased")`，参数可为 repo id 或本地目录
- **保存**：`model.save_pretrained("./my-model")` → 生成 config.json + 权重文件
- **上传**：`model.push_to_hub("user/my-model")`（需已登录 `huggingface-cli login`）
- **tokenizer 调用**：`tokenizer(text, padding=True, truncation=True, return_tensors="pt")`
- **任务→pipeline 名**：text-classification / token-classification（ner）/ question-answering / summarization / translation / text-generation / zero-shot-classification / fill-mask
- **后端**：PyTorch（默认）/ TensorFlow / JAX（部分），通过 `from_pretrained(..., framework="tf")` 切换
- **默认 dtype**：v5 起 `from_pretrained` 的 dtype 从 config 推断（旧版恒 float32）
- **缓存**：`~/.cache/huggingface/hub`，设 `HF_HOME` 改路径，`HF_HUB_OFFLINE=1` 离线

## 安装

```bash
# 仅推理（轻量，不含训练后端）
pip install transformers

# 含 PyTorch 后端（训练/推理都可用，推荐）
pip install "transformers[torch]"

# 含 TensorFlow 后端
pip install "transformers[tf-cpu]"

# 含 JAX/Flax 后端
pip install "transformers[flax]"
```

额外依赖按需装：`accelerate`（分布式/设备调度）、`sentencepiece`（部分模型 tokenizer）、`tokenizers`（快速分词）、`bitsandbytes`（量化）。验证安装：

```python
import transformers
print(transformers.__version__)   # 形如 5.x.x
```

## 第一个例子：一行推理（pipeline）

最小可用流程——不指定模型，pipeline 自动选该任务的默认模型：

```python
from transformers import pipeline

# 不传 model 参数 → 用任务默认 checkpoint（联网下载到缓存）
classifier = pipeline("text-classification")
print(classifier("I love Hugging Face!"))
# [{'label': 'POSITIVE', 'score': 0.9998}]
```

指定模型 + 一次处理多条：

```python
classifier = pipeline("text-classification", model="bert-base-uncased")
results = classifier(["Great!", "Terrible..."], top_k=None)
# top_k=None 返回所有标签的概率
```

> **铁律**：`pipeline(task)` 第一个位置参数是**任务名**（不是模型名）。模型用 `model=` 传。任务名与 pipeline 返回结构一一对应。

## 常用任务 pipeline 名对照

| 任务 | pipeline 名 | 典型 head | 输出结构 |
| --- | --- | --- | --- |
| 文本分类 | `text-classification` | `*ForSequenceClassification` | `[{label, score}]` |
| 命名实体识别 | `token-classification`（`ner`） | `*ForTokenClassification` | `[{entity, score, word, start, end}]` |
| 抽取式问答 | `question-answering` | `*ForQuestionAnswering` | `{answer, start, end, score}` |
| 摘要 | `summarization` | `*ForConditionalGeneration` | `[{summary_text}]` |
| 翻译 | `translation_xx_to_yy` | `*ForConditionalGeneration` | `[{translation_text}]` |
| 文本生成 | `text-generation` | `*ForCausalLM` | `[{generated_text}]` |
| 掩码填充 | `fill-mask` | `*ForMaskedLM` | `[{sequence, score, token_str}]` |
| 零样本分类 | `zero-shot-classification` | `*ForSequenceClassification` | `{labels, scores}` |

## AutoModel / AutoTokenizer：自动推断架构

不必记住每个模型的具体类名，用 AutoClass 让库按 config 自动选：

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_id = "bert-base-uncased"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForSequenceClassification.from_pretrained(model_id, num_labels=2)

inputs = tokenizer("Hello, transformers!", return_tensors="pt", padding=True, truncation=True)
outputs = model(**inputs)
print(outputs.logits.shape)   # [1, 2]
```

> **铁律**：模型与 tokenizer 必须用**同一个 model_id** 加载，否则 token→id 映射不一致会得到无意义结果。

### 常用 AutoModel 变体

| AutoClass | 适用任务 | 对应 head |
| --- | --- | --- |
| `AutoModel` | 取隐藏态（特征） | 无 head（纯 backbone） |
| `AutoModelForSequenceClassification` | 文本分类 / 零样本 | 顶部线性分类头 |
| `AutoModelForTokenClassification` | NER / 词性标注 | token 级分类头 |
| `AutoModelForQuestionAnswering` | 抽取式 QA | start/end logits 头 |
| `AutoModelForCausalLM` | GPT 风格自回归生成 | LM head |
| `AutoModelForMaskedLM` | BERT 风格掩码语言模型 | MLM head |
| `AutoModelForSeq2SeqLM` | T5/BART 编码解码生成 | seq2seq LM head |
| `AutoModelForImageClassification` | 图像分类 | 视觉分类头 |
| `AutoModelForCausalLM`（大模型） | LLaMA/Qwen/Mistral 等大模型 | CausalLM head |

## from_pretrained 加载语义

`from_pretrained` 是 AutoClass 与具体模型类共用的加载入口，参数是 **repo id**（联网下载）或**本地目录**（读已 save 的）：

```python
# ① Hub repo id（自动下载并缓存）
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")

# ② 本地目录（save_pretrained 产物）
model = AutoModelForCausalLM.from_pretrained("./my-model/")

# ③ 指定 dtype / revision / token
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-1B",
    dtype="bfloat16",     # v5：dtype 从 config 推断，可显式覆盖
    revision="main",      # 指定 git 分支/tag/commit
    token="hf_xxx",       # 私有仓库需 token
    device_map="auto",    # 配合 accelerate 自动分卡
)
```

加载进度的「文件名」即缓存 key；同一 repo id + revision 第二次加载直接命中 `~/.cache/huggingface`。

## save_pretrained / push_to_hub

训练或推理后保存与分享：

```python
# ① 保存到本地目录（生成 config.json + 权重 + tokenizer 文件）
model.save_pretrained("./my-finetuned-model")
tokenizer.save_pretrained("./my-finetuned-model")

# ② 上传到 Hub（需 huggingface-cli login）
model.push_to_hub("my-username/my-model")
tokenizer.push_to_hub("my-username/my-model")

# ③ 之后任何人都能一行加载
model = AutoModel.from_pretrained("my-username/my-model")
```

`save_pretrained` 与 `from_pretrained` 互为逆操作，目录结构是跨框架、跨工具通用的标准格式。

## 模型架构覆盖

Transformers 内置数千架构，按编码方式分三类：

| 类型 | 代表架构 | 典型任务 |
| --- | --- | --- |
| 编码器（Encoder-only） | BERT、RoBERTa、DistilBERT、DeBERTa | 分类、NER、QA、句向量 |
| 解码器（Decoder-only） | GPT-2、LLaMA、Qwen、Mistral、Gemma、Phi | 文本生成、对话、指令 |
| 编码解码（Encoder-Decoder） | T5、BART、Marian、MT5 | 翻译、摘要、seq2seq |
| 多模态 | CLIP、LLaVA、Qwen-VL、Whisper | 图文、语音、视频 |

加载方式完全统一——`AutoModelFor*` + `from_pretrained`，库按 config 字段自动选实现类。

## 集成 PyTorch Dataset（推理前处理）

```python
import torch
from torch.utils.data import DataLoader

class TextDataset(torch.utils.data.Dataset):
    def __init__(self, texts, tokenizer, max_length=128):
        self.enc = tokenizer(texts, padding="max_length",
                             truncation=True, max_length=max_length)
    def __len__(self): return len(self.enc["input_ids"])
    def __getitem__(self, i):
        return {k: torch.tensor(v[i]) for k, v in self.enc.items()}

ds = TextDataset(["a sentence", "another one"], tokenizer)
loader = DataLoader(ds, batch_size=2)
for batch in loader:
    out = model(**batch)   # 模型直接吃 dict of tensors
```

## 下一步

- 入门后请读 **指南**：Trainer/TrainingArguments 全参数、AutoModel 选用、generate 解码、混合精度与分布式、push_to_hub 细节
- 训练跑通后看 **参考**：AutoClass 速查表、pipeline 任务对照、版本与默认值变更、与同类库对比
- 想做参数高效微调/RLHF，转向 **PEFT 与 TRL** 叶子；想做大规模数据处理/训练 tokenizer，转向 **Datasets 与 Tokenizers** 叶子
