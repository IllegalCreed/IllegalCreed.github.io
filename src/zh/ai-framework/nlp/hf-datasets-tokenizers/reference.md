---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Hugging Face Datasets 官方文档（huggingface.co/docs/datasets，API Reference）与 Tokenizers 官方文档（huggingface.co/docs/tokenizers，components）整理

## 速查

- **Datasets 核心 API**：`load_dataset` / `Dataset.map` / `Dataset.filter` / `Dataset.select` / `Dataset.shuffle` / `Dataset.save_to_disk` / `load_from_disk` / `push_to_hub`
- **Datasets 数据结构**：`Dataset`（单 split）/ `DatasetDict`（多 split）/ `IterableDataset`（流式）
- **Tokenizers 核心 API**：`Tokenizer` / `Tokenizer.train` / `Tokenizer.from_pretrained` / `Tokenizer.encode` / `Tokenizer.encode_batch` / `Tokenizer.decode` / `Tokenizer.save` / `Tokenizer.from_file`
- **Tokenizer 组件**：`Normalizer` / `PreTokenizer` / `Model` / `PostProcessor` / `Decoder`（+ `Trainer`）
- **三 Model**：`BPE` / `WordPiece` / `Unigram` / `WordLevel`
- **三 Trainer**：`BpeTrainer` / `WordPieceTrainer` / `UnigramTrainer`
- **底层**：Datasets=Apache Arrow；Tokenizers=Rust（<20s/GB tokenize）
- **安装**：`pip install datasets tokenizers`
- **当前版本**：Datasets v3.x 主线 / Tokenizers v0.2x 主线
- **import 名**：`from datasets import load_dataset, Dataset` / `from tokenizers import Tokenizer`

## load_dataset 来源对照

| 来源 | 写法 | 说明 |
| --- | --- | --- |
| Hub 数据集 | `load_dataset("namespace/ds")` | 返回 DatasetDict |
| Hub 指定 split | `load_dataset("ds", split="train")` | 返回 Dataset |
| Hub 切片 | `load_dataset("ds", split="train[:10%]")` | 按百分比/行 |
| CSV | `load_dataset("csv", data_files="f.csv")` | 表格 |
| JSON/JSONL | `load_dataset("json", data_files="f.json")` | 嵌套用 `field=` |
| Parquet | `load_dataset("parquet", data_files="f.parquet")` | 列式、高效 |
| 文本 | `load_dataset("text", data_files="f.txt")` | 每行一条 |
| Arrow | `load_dataset("arrow", data_files="f.arrow")` | 内部格式 |
| Lance | `load_dataset("lance", ...)` | 多模态表格式 |
| HDF5 | `load_dataset("hdf5", data_files="f.h5")` | 数值数据 |
| WebDataset | `load_dataset("webdataset", data_files="*.tar", streaming=True)` | TAR 归档，大图集 |
| SQL | `Dataset.from_sql(query, con=uri)` | 数据库 |
| Python dict | `Dataset.from_dict({...})` | 内存 |
| Python list | `Dataset.from_list([{...}])` | 内存 |
| Generator | `Dataset.from_generator(gen)` | 支持超内存 |
| Pandas | `Dataset.from_pandas(df)` | DataFrame |
| 远程 | `data_files=["https://..."]` 或 `["hf://..."]` | HTTP/HF URL |

## Dataset 主要方法

| 方法 | 作用 |
| --- | --- |
| `ds[i]` / `ds[i:j]` / `ds["col"]` | 索引/切片/取列（零拷贝） |
| `ds.map(fn, batched, num_proc, ...)` | 应用函数（返回新 Dataset） |
| `ds.filter(fn, with_indices)` | 过滤行 |
| `ds.select(indices)` | 按下标取行 |
| `ds.shuffle(seed)` | 随机打乱（产生 indices mapping） |
| `ds.sort(col)` | 按列排序 |
| `ds.flatten_indices()` | 重写磁盘恢复顺序读速度 |
| `ds.train_test_split(test_size)` | 切训练/测试 |
| `ds.shard(num_shards, index)` | 分片 |
| `ds.rename_column(old, new)` | 重命名列 |
| `ds.remove_columns(cols)` / `select_columns(cols)` | 删/选列 |
| `ds.cast(features)` / `cast_column(col, feat)` | 改类型 |
| `ds.flatten()` | 展平嵌套列 |
| `ds.with_format("torch"/"numpy"/"pandas")` | 设张量格式 |
| `ds.with_transform(fn)` | 即时变换 |
| `ds.save_to_disk(path)` / `load_from_disk(path)` | 本地 Arrow |
| `ds.push_to_hub(repo)` | 上传 Hub |
| `ds.to_csv/to_json/to_parquet/to_pandas` | 导出 |

## IterableDataset vs Dataset

| 维度 | Dataset | IterableDataset |
| --- | --- | --- |
| 随机访问 `ds[i]` | 支持 | 不支持 |
| `len(ds)` | 有 | 无 |
| shuffle | 全局（产生 mapping） | 近似（buffer） |
| map/filter/select | 返回 Dataset | 返回 IterableDataset |
| 内存映射 | 是（Arrow） | 流式产出 |
| 适用 | 大多场景 | 超大/在线数据 |
| Trainer 需 max_steps | 否 | 是 |

## Tokenizer 组件速查

### Normalizer（可选）

| 类 | 作用 |
| --- | --- |
| `Lowercase` | 转小写 |
| `NFD`/`NFKD`/`NFC`/`NFKC` | Unicode 归一化 |
| `StripAccents` | 去重音符号 |
| `Strip` | 去首尾空白 |
| `Replace(pattern, content)` | 正则替换 |
| `BertNormalizer` | BERT 风格（clean_text/handle_chinese_chars/strip_accents/lowercase） |
| `Sequence([...])` | 组合多个 |

### PreTokenizer

| 类 | 作用 | 典型 |
| --- | --- | --- |
| `Whitespace` | 按词边界（`\w+\|[^\w\s]+`） | 通用 |
| `WhitespaceSplit` | 按空白切 | 通用 |
| `ByteLevel` | 字节级（256 字符，无 OOV） | GPT/LLaMA |
| `Punctuation` | 隔离标点 | 多种 |
| `Metaspace` | 用 ▁(U+2581) 替代空格 | SentencePiece/T5 |
| `CharDelimiterSplit(c)` | 按指定字符切 | 自定义 |
| `Digits` | 隔离数字 | 多种 |
| `Split(pattern, behavior)` | 通用切分（正则/字符串） | 灵活 |
| `Sequence([...])` | 组合 | — |

### Model（必填）

| 类 | 算法 | unk/续接 | 代表 |
| --- | --- | --- | --- |
| `BPE` | 字节对编码 | `unk_token` | GPT、LLaMA |
| `WordPiece` | 贪心最长匹配 | `unk_token` + `##` 续接 | BERT |
| `Unigram` | 概率最大化子词集 | `unk_token`（可无） | T5、ALBERT |
| `WordLevel` | 纯词表映射 | `unk_token`（OOV 多） | 教学 |

### Trainer

| 类 | 对应 Model | 关键参数 |
| --- | --- | --- |
| `BpeTrainer` | BPE | `vocab_size`/`special_tokens`/`min_frequency`/`show_progress` |
| `WordPieceTrainer` | WordPiece | 同上 + `continuing_subword_prefix`/`end_of_word_suffix` |
| `UnigramTrainer` | Unigram | `vocab_size`/`special_tokens`/`shrinking_factor`/`unk_token` |

### PostProcessor

| 类 | 作用 |
| --- | --- |
| `TemplateProcessing` | 模板化插特殊 token（`[CLS] $A [SEP]`），设 type_id |
| `BertProcessing` | BERT 风格（`[CLS]`/`[SEP]`） |
| `RobertaProcessing` | RoBERTa 风格（`&lt;s&gt;`/`&lt;/s&gt;` + 前缀空格） |
| `ByteLevelProcessing` | GPT 字节级 |

### Decoder

| 类 | 作用 |
| --- | --- |
| `ByteLevel` | 还原 ByteLevel PreTokenizer |
| `WordPiece` | 还原 `##` 续接 |
| `Metaspace` | 还原 ▁ 替代 |
| `BPEDecoder` | BPE 还原（前缀空格处理） |
| `Sequence` | 组合 |

## Tokenizer 主要方法

| 方法 | 作用 |
| --- | --- |
| `Tokenizer(model)` | 用 Model 构造 |
| `tokenizer.train(files, trainer)` | 从语料训练词表 |
| `tokenizer.from_pretrained(id)` | 加载已训练（Hub/本地） |
| `tokenizer.encode(seq)` / `encode(seq, pair)` | 文本→Encoding |
| `tokenizer.encode_batch(list)` | 批量编码 |
| `tokenizer.decode(ids)` / `decode_batch(list)` | ids→文本 |
| `tokenizer.token_to_id(tok)` / `id_to_token(id)` | 双向查词表 |
| `tokenizer.get_vocab()` | 取词表 dict |
| `tokenizer.save(path)` / `from_file(path)` | 保存/加载 |
| `tokenizer.add_tokens([...])` | 增加 token |

`Encoding` 对象含：`ids`/`tokens`/`offsets`/`attention_mask`/`type_ids`/`special_tokens_mask`/`overflowing`。

## 版本与兼容

### 近期要点

| 库 | 版本线 | 状态 | 关键点 |
| --- | --- | --- | --- |
| Datasets | v3.x（2026 主线） | 活跃 | Arrow 内存映射；streaming 强化；push_to_hub 用 Parquet |
| Tokenizers | v0.2x（2026 主线） | 活跃 | Rust 实现；BPE/WordPiece/Unigram；对齐追踪 |

### 兼容性

- **Python**：≥ 3.9（推荐 3.10–3.12）
- **依赖（Datasets）**：`pyarrow`（Arrow 后端）/ `huggingface_hub`（Hub 交互）/ `multiprocess`/ `fsspec`（远程文件）/ `pandas`（可选）/ `numpy`
- **依赖（Tokenizers）**：Rust 编译产物（pip 装预编译 wheel），无 Python 编译依赖
- **import 名**：`from datasets import load_dataset, Dataset, DatasetDict`；`from tokenizers import Tokenizer`

## 与同类库对比

| 维度 | Datasets | pandas | Tokenizers | jieba/sacrebleu |
| --- | --- | --- | --- | --- |
| 定位 | ML 数据集加载/处理 | 表格分析 | 子词分词（Rust） | 规则分词/评测 |
| 规模 | 超内存（Arrow mmap） | 受限于内存 | 极速（Rust） | Python 速度 |
| 格式 | Arrow/Parquet/csv/json/... | DataFrame | BPE/WordPiece/Unigram | 词/字切分 |
| 与 Hub 集成 | 一行 load 20 万+ 数据集 | 无 | 一行 from_pretrained | 无 |
| 场景 | 训练数据管线 | 通用分析 | 模型分词 | 中文分词/指标 |

## 官方资源

- [Datasets 官方文档](https://huggingface.co/docs/datasets/index)
- [Datasets 加载](https://huggingface.co/docs/datasets/main/en/loading)
- [Datasets 处理](https://huggingface.co/docs/datasets/main/en/process)
- [Datasets 流式](https://huggingface.co/docs/datasets/main/en/stream)
- [Datasets 存储](https://huggingface.co/docs/datasets/main/en/storage)
- [Tokenizers 官方文档](https://huggingface.co/docs/tokenizers/index)
- [Tokenizers 组件](https://huggingface.co/docs/tokenizers/main/en/components)
- [Tokenizers 快速上手](https://huggingface.co/docs/tokenizers/main/en/quicktour)
- [GitHub huggingface/datasets](https://github.com/huggingface/datasets)
- [GitHub huggingface/tokenizers](https://github.com/huggingface/tokenizers)
- [Hub 数据集库（20 万+）](https://huggingface.co/datasets)
