---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Hugging Face Datasets 官方文档（huggingface.co/docs/datasets）与 Tokenizers 官方文档（huggingface.co/docs/tokenizers）编写

## 速查

- **安装**：`pip install datasets` / `pip install tokenizers`
- **加载 Hub 数据集**：`load_dataset("squad")` / `load_dataset("stanfordnlp/imdb", split="train")`
- **加载本地文件**：`load_dataset("csv", data_files="f.csv")`（json/parquet/txt 同理）
- **核心三方法**：`dataset.map(fn)` / `dataset.filter(fn)` / `dataset.select(indices)`
- **批量处理**：`dataset.map(fn, batched=True, batch_size=1000)`（fn 接收列字典）
- **多进程**：`dataset.map(fn, num_proc=4)` 并行加速
- **流式**：`load_dataset(..., streaming=True)` 返回 `IterableDataset`，逐条产出
- **底层**：Apache Arrow 内存映射，零拷贝、可超内存
- **上传**：`dataset.push_to_hub("user/dataset")`
- **保存本地**：`dataset.save_to_disk(path)` ↔ `load_from_disk(path)`
- **Tokenizers 算法**：BPE（GPT）/ WordPiece（BERT）/ Unigram（T5/SentencePiece）/ WordLevel
- **Tokenizer 五组件**：Normalizer → PreTokenizer → Model → PostProcessor → Decoder
- **训练词表**：`tokenizer.train(files, trainer)`；加载已训练：`Tokenizer.from_pretrained(id)`

## 安装

```bash
pip install datasets        # 数据集加载与处理
pip install tokenizers      # Rust 极速分词
# 通常配合 transformers
pip install transformers
```

验证：

```python
import datasets, tokenizers
print(datasets.__version__, tokenizers.__version__)
```

## Datasets 第一个例子：加载与查看

```python
from datasets import load_dataset

# 从 Hub 加载（自动下载并缓存）
ds = load_dataset("stanfordnlp/imdb", split="train")
print(ds)
# Dataset({ features: ['text', 'label'], num_rows: 25000 })

print(ds[0])              # 取第 0 行（dict）
print(ds["text"][0][:50]) # 取某列
print(ds.features)        # 查看列类型
```

底层是 Apache Arrow 表，`ds[i]` 是零拷贝读取，数据集可远大于内存。

## load_dataset 加载来源

```python
# ① Hub 数据集（repo id）
ds = load_dataset("rajpurkar/squad")                          # 返回 DatasetDict（多 split）
ds = load_dataset("stanfordnlp/imdb", split="train")          # 指定 split

# ② 本地文件（按扩展名推断）
ds = load_dataset("csv", data_files="train.csv")              # CSV
ds = load_dataset("json", data_files="data.json")             # JSON/JSONL
ds = load_dataset("parquet", data_files="train.parquet")      # Parquet
ds = load_dataset("text", data_files="corpus.txt")            # 纯文本

# ③ 多 split 映射
ds = load_dataset("namespace/ds", data_files={"train":"tr.csv","test":"te.csv"})

# ④ 切片（按行或百分比）
ds = load_dataset("imdb", split="train[:10%]")                # 前 10%
ds = load_dataset("imdb", split="train[10:20]")               # 第 10-19 行
ds = load_dataset("imdb", split="train+test")                 # 拼接
```

> **铁律**：不指定 `data_files` 时，加载大数据集（如 C4 约 13TB）会下载全部文件——务必用 `data_files`/`data_dir`/`split` 限定范围，或用 `streaming=True`。

## map / filter / select

```python
# map：对每条（或每批）应用函数，返回新 Dataset
def add_prefix(ex):
    ex["text"] = "REVIEW: " + ex["text"]
    return ex
ds2 = ds.map(add_prefix)

# 批量 map（fn 接收「列→值列表」的字典）
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("bert-base-uncased")
ds_tok = ds.map(lambda ex: tok(ex["text"], truncation=True), batched=True)

# filter：保留满足条件的行
ds_pos = ds.filter(lambda ex: ex["label"] == 1)

# select：按下标取行
ds_small = ds.select([0, 10, 100])
```

> **铁律**：map/filter/select **都返回新 Dataset，不原地修改**。记得接收返回值：`ds = ds.map(...)`。

## 流式（streaming）模式

```python
# streaming=True 返回 IterableDataset，逐条产出，不必整体下载
ds = load_dataset("allenai/c4", "en", streaming=True, split="train")
for ex in ds:                 # 逐条迭代，TB 级也能跑
    print(ex["text"][:30])
    break

# 也可 take / map / filter，但返回的仍是 IterableDataset
for ex in ds.take(3):
    print(ex)
```

streaming 适合：超大数据集、在线数据、磁盘/内存吃紧。代价是**无法随机访问、无 len()、shuffle 近似**（用 buffer）。

## Tokenizers：三种子词算法

| 算法 | 思路 | 代表模型 | Trainer |
| --- | --- | --- | --- |
| BPE（Byte-Pair Encoding） | 从字符开始，迭代合并最高频相邻对 | GPT-2/3/4、LLaMA、Qwen | `BpeTrainer` |
| WordPiece | 贪心构建最长 token，用 `##` 前缀表续接 | BERT、DistilBERT | `WordPieceTrainer` |
| Unigram | 最大化句子概率的子词集合（概率式，非确定性） | T5、mT5、ALBERT（配合 SentencePiece） | `UnigramTrainer` |
| WordLevel | 纯词表映射（无子词，OOV 多） | 教学/简单场景 | `WordLevelTrainer` |

## Tokenizers 第一个例子：加载已训练词表

```python
from tokenizers import Tokenizer

# 加载已训练的 tokenizer（如从 Hub 或本地）
tokenizer = Tokenizer.from_pretrained("bert-base-uncased")

# 编码（文本 → token ids）
enc = tokenizer.encode("Hello, transformers!")
print(enc.ids)        # [101, 7592, 1010, 19081, 999, 102]
print(enc.tokens)     # ['[CLS]', 'hello', ',', 'transformers', '!', '[SEP]']

# 解码（ids → 文本）
print(tokenizer.decode(enc.ids))   # "hello, transformers!"
```

`encode` 输出的 `Encoding` 对象含 `ids`/`tokens`/`offsets`/`attention_mask` 等，且支持对齐追踪（可还原 token 对应原文位置）。

## 训练一个 BPE tokenizer

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

tokenizer = Tokenizer(BPE(unk_token="<unk>"))
tokenizer.pre_tokenizer = Whitespace()
trainer = BpeTrainer(
    vocab_size=30000,
    special_tokens=["<unk>", "<pad>", "<bos>", "<eos>"],
)
tokenizer.train(["corpus.txt"], trainer)

# 保存
tokenizer.save("my-bpe.json")
# 加载
tokenizer = Tokenizer.from_file("my-bpe.json")
```

## 下一步

- 入门后请读 **指南**：Arrow 内存映射原理、map 进阶（batched/GPU/async）、streaming 完整用法、Tokenizer 五组件详解、三算法对比、特殊 token 与 PostProcessor
- 调通后看 **参考**：load_dataset 来源对照、Dataset/DatasetDict API 速查、Tokenizer 组件速查表、版本与兼容、与 pandas/Transformers 的关系
- 想把数据喂给模型训练，转向 **Transformers** 叶子的 Trainer；想做大模型微调，看 **PEFT 与 TRL** 叶子
