---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Hugging Face Datasets 官方文档（loading/process/stream/storage 章节）与 Tokenizers 官方文档（components/quicktour）编写

## 速查

- **Arrow 内存映射**：Dataset 底层是 Arrow 表，`ds[i]` 零拷贝，数据集可超内存而 RAM 占用恒定
- **map 三件套**：`batched=True`（批处理）/ `num_proc=N`（多进程）/ `remove_columns=`（删旧列）
- **map + GPU**：`with_rank=True` + `num_proc=num_gpus` + `set_start_method("spawn")` 跨卡并行
- **map + async**：函数用 async/await，map 自动并发（最高 1000 并行，配 Semaphore 限流）
- **shuffle 代价**：shuffle 后产生 indices mapping，访问变慢约 10x，用 `flatten_indices()` 重写磁盘恢复速度
- **streaming**：`streaming=True` 返回 `IterableDataset`，`take`/`map`/`filter`/`shuffle(buffer_size=)` 都返回 IterableDataset
- **DatasetDict**：`load_dataset` 不指定 split 返回多 split 的 DatasetDict，`.map` 一次处理所有 split
- **save/load**：`save_to_disk` ↔ `load_from_disk`（本地 Arrow）；`push_to_hub` ↔ `load_dataset`（Hub Parquet）
- **Tokenizer 五组件**：Normalizer（可选）/ PreTokenizer / Model（必填）/ PostProcessor / Decoder
- **特殊 token**：TemplateProcessing 模板化插入 `[CLS]`/`[SEP]` 等，并设 type_id
- **对齐追踪**：Encoding.offsets 给出每个 token 对应原文的字符区间，即使经过归一化也能还原

## Arrow 内存映射原理

Dataset 底层是 Apache Arrow 列式内存格式，数据落盘为 `.arrow` 文件，访问时用内存映射（mmap）按需读页：

```python
ds = load_dataset("allenai/c4", "en", split="train")   # 数百 GB
print(ds[1000000])   # 零拷贝读第 100 万行，RAM 占用恒定
```

- **零拷贝**：不必把整个数据集载入内存，按行按列按需 mmap
- **可超内存**：数据集可比 RAM 大，速度几乎不受影响
- **缓存**：首次 `load_dataset` 把原始文件转成 Arrow 缓存到 `~/.cache/huggingface`，后续秒级加载

## map 进阶

### 批量处理（batched）

```python
# batched=True：fn 接收「列→值列表」的字典，返回同结构
def tokenize_fn(batch):
    return tok(batch["text"], truncation=True, max_length=128)
ds = ds.map(tokenize_fn, batched=True, batch_size=1000, remove_columns=["text"])
```

批量 map 比逐条快得多（尤其 tokenize），且支持「一对多」拆分（如长文本切成多块，行数会增加）。

### 多进程（num_proc）

```python
ds = ds.map(tokenize_fn, batched=True, num_proc=8)   # 8 进程并行
```

`num_proc` 显著加速 CPU 密集预处理；shard 化的数据集效果最好。

### GPU 并行（with_rank）

```python
import torch
from multiprocess import set_start_method
def gpu_fn(batch, rank):
    device = f"cuda:{rank % torch.cuda.device_count()}"
    # ... GPU 计算 ...
    return batch
set_start_method("spawn")   # GPU 多进程必须 spawn，不能 fork
ds = ds.map(gpu_fn, batched=True, batched_size=16, with_rank=True, num_proc=torch.cuda.device_count())
```

> **铁律**：GPU 多进程必须 `set_start_method("spawn")`，否则报 `Cannot re-initialize CUDA in forked subprocess`。

### 异步（async）

```python
import asyncio, aiohttp
sem = asyncio.Semaphore(20)   # 限制并发，避免限流
async def call_api(ex):
    async with sem, aiohttp.ClientSession() as s:
        # ... 调 API ...
        return {"result": ...}
ds = ds.map(call_api)   # map 自动并发跑 async 函数
```

async map 适合调外部 API/下载，自动并发（默认上限 1000，用 Semaphore 控制）。

## filter / select / shuffle / sort

```python
# filter：按条件保留
ds_pos = ds.filter(lambda ex: ex["label"] == 1)
ds_long = ds.filter(lambda ex, idx: len(ex["text"]) > 100, with_indices=True)

# select：按下标
ds_small = ds.select([0, 10, 100, 1000])

# shuffle：随机打乱（产生 indices mapping，访问会变慢）
ds_shuf = ds.shuffle(seed=42)
ds_fast = ds_shuf.flatten_indices()   # 重写磁盘恢复速度

# sort：按列数值排序
ds_sorted = ds.sort("label")

# train_test_split：切训练/测试集
split = ds.train_test_split(test_size=0.1)
split["train"], split["test"]
```

> **铁律**：shuffle/select/filter 后会产生 indices mapping，访问速度可能下降约 10x。需要时调 `flatten_indices()` 把数据按新顺序重写到磁盘，恢复顺序读速度。

## streaming 完整用法

```python
# 流式加载（不整体下载）
ds = load_dataset("allenai/c4", "en", streaming=True, split="train")

# 全部返回 IterableDataset，链式处理
ds = ds.shuffle(buffer_size=10_000).map(tokenize_fn, batched=True).filter(lambda ex: ex["label"]==1)

# 逐条迭代 + take
for ex in ds.take(5):
    print(ex["text"][:30])

# 多数据集混合（interleave）
from datasets import interleave_datasets
ds_mix = interleave_datasets([ds1, ds2], probabilities=[0.7, 0.3])
```

streaming 的限制：

- **无 `len()`**：无法知道总行数
- **无随机访问**：不能 `ds[i]`，只能迭代
- **shuffle 近似**：用固定大小 buffer 洗牌，不是全局洗牌
- **Trainer 需配 max_steps**：streaming dataset 无长度，训练必须设 `max_steps`（无法推算总步数）

## DatasetDict：多 split 统一处理

```python
from datasets import load_dataset
raw = load_dataset("nyu-mll/glue", "mrpc")   # DatasetDict: train/validation/test

# 一次 map 所有 split
tokenized = raw.map(lambda ex: tok(ex["sentence1"], ex["sentence2"], truncation=True), batched=True)
tokenized["train"][0]
```

## save_to_disk / push_to_hub

```python
# ① 本地 Arrow（快、 uncompressed、适合本地缓存）
ds.save_to_disk("./my-dataset")
ds = load_from_disk("./my-dataset")

# ② Hub Parquet（压缩、可分享、适合长期存储与下载）
ds.push_to_hub("user/my-dataset")
ds = load_dataset("user/my-dataset")          # 任何人一行加载
ds.push_to_hub("user/my-dataset", num_proc=8) # 多进程上传加速
```

| 方式 | 格式 | 适用 |
| --- | --- | --- |
| `save_to_disk` | Arrow（uncompressed） | 本地缓存、快速重载 |
| `push_to_hub` | Parquet（压缩） | 分享、长期存储、跨机器 |

## Tokenizer 五组件详解

```
原始文本
   │
   ▼ ① Normalizer（可选）：归一化（lowercase/NFD/StripAccents/BertNormalizer）
   │
   ▼ ② PreTokenizer：预切分（Whitespace/ByteLevel/Punctuation/Metaspace）
   │
   ▼ ③ Model（必填）：核心算法（BPE/WordPiece/Unigram/WordLevel）→ token ids
   │
   ▼ ④ PostProcessor：后处理（TemplateProcessing 插特殊 token）
   │
   ▼ ⑤ Decoder：解码（ids → 可读文本，还原 ① ② 的特殊标记）
```

### 各组件示例

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.normalizers import Sequence, Lowercase, NFD, StripAccents
from tokenizers.pre_tokenizers import ByteLevel, Whitespace
from tokenizers.processors import TemplateProcessing
from tokenizers.decoders import ByteLevel as ByteLevelDecoder

tokenizer = Tokenizer(BPE(unk_token="<unk>"))

# ① Normalizer
tokenizer.normalizer = Sequence([NFD(), Lowercase(), StripAccents()])

# ② PreTokenizer
tokenizer.pre_tokenizer = ByteLevel(add_prefix_space=True)

# ③ Model（BPE）已在构造时指定

# ④ PostProcessor：插特殊 token
tokenizer.post_processor = TemplateProcessing(
    single="$A [SEP]",
    pair="$A [SEP] $B:1 [SEP]:1",
    special_tokens=[("[SEP]", 1)],
)

# ⑤ Decoder
tokenizer.decoder = ByteLevelDecoder()
```

### Normalizer 常用

| 类 | 作用 |
| --- | --- |
| `Lowercase` | 转小写 |
| `NFD`/`NFKD`/`NFC`/`NFKC` | Unicode 归一化 |
| `StripAccents` | 去重音（配 NFD 用） |
| `Strip` | 去首尾空白 |
| `Replace` | 正则替换 |
| `BertNormalizer` | BERT 风格归一化（clean_text/lowercase/strip_accents/handle_chinese_chars） |
| `Sequence` | 组合多个归一化器 |

### PreTokenizer 常用

| 类 | 作用 | 典型模型 |
| --- | --- | --- |
| `Whitespace` | 按词边界切 | 通用 |
| `ByteLevel` | 字节级映射（256 基本字符，无 OOV） | GPT-2/LLaMA |
| `Punctuation` | 隔离标点 | 多种 |
| `Metaspace` | 用 ▁ 替代空格 | SentencePiece/T5 |
| `Digits` | 隔离数字 | 多种 |
| `Sequence` | 组合 | — |

### PostProcessor：特殊 token

```python
from tokenizers.processors import TemplateProcessing
# 给 BERT 风格加 [CLS] ... [SEP]
tokenizer.post_processor = TemplateProcessing(
    single="[CLS] $A [SEP]",
    pair="[CLS] $A [SEP] $B:1 [SEP]:1",
    special_tokens=[("[CLS]", 1), ("[SEP]", 2)],
)
```

`$A`/`$B` 是单/双序列占位，`:1`/`:2` 是 type_id，special_tokens 声明 token→id 映射。

## 三算法对比

| 维度 | BPE | WordPiece | Unigram |
| --- | --- | --- | --- |
| 方向 | 自底向上（字符→合并最高频对） | 贪心（最长匹配） | 自顶向下（最大化句子概率） |
| 确定性 | 是（按频率顺序合并） | 是（贪心） | 否（多种分词选概率最高） |
| 续接标记 | 无（靠子词拼接） | `##` 前缀（如 `##ing`） | 无（靠 ▁ 表词首） |
| OOV | 子词组合，几乎无 OOV | 子词组合 | 子词组合 |
| 代表 | GPT、LLaMA、Qwen | BERT、DistilBERT | T5、ALBERT（+SentencePiece） |

## 与 Transformers 的关系

Transformers 的 `AutoTokenizer` 是 Tokenizers 的「高层封装」：AutoTokenizer.from_pretrained 从模型 repo 加载已配好的 tokenizer.json（Tokenizers 格式），并附带模型特定的特殊 token、chat template 等。因此：

- 用现成模型 → 直接 `AutoTokenizer.from_pretrained`（已封装好）
- 从零训练 tokenizer → 用 `tokenizers` 库拼组件 + train，再转成 `PreTrainedTokenizerFast` 接入 Transformers

```python
# 从 tokenizers 转成 Transformers 可用
from transformers import PreTrainedTokenizerFast
fast = PreTrainedTokenizerFast(tokenizer_object=tokenizer, ...)
```

## 陷阱与最佳实践

- **map/filter 返回新对象不接收**：`ds.map(...)` 不原地改，必须 `ds = ds.map(...)`
- **shuffle 后变慢**：产生 indices mapping 访问慢 10x，用 `flatten_indices()` 恢复
- **streaming 无 len()**：Trainer 配 streaming dataset 必须设 `max_steps`
- **大数据集不限定 data_files**：load_dataset 全量下载（C4 13TB！），务必限定范围或 streaming
- **GPU 多进程没 spawn**：报 CUDA fork 错误，必须 `set_start_method("spawn")`
- **Tokenizer 漏配 PostProcessor**：没加特殊 token（[CLS]/[SEP]），模型输入与预训练不一致
- **Model 与 Decoder/PreTokenizer 不匹配**：如 ByteLevel PreTokenizer 配非 ByteLevel Decoder 会解码乱码
- **中文用错算法**：WordPiece 默认按空格切，中文无空格需配 PreTokenizer 或选支持无空格的 BPE/Unigram
- **缓存目录爆炸**：设 `HF_HOME` 改路径，定期清理 `~/.cache/huggingface`
