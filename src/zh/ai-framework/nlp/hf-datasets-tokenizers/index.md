---
layout: doc
---

# Hugging Face Datasets 与 Tokenizers

Hugging Face Datasets 与 Tokenizers 是 HF 生态中「**数据与文本表示**」的两大基础库。**Datasets** 是数据集加载/处理/分享库，底层用 **Apache Arrow** 内存映射（memory-mapping）零拷贝读取，因此能处理远超内存的数据集而几乎不损失速度；核心 API 是 `load_dataset()`（从 Hub/本地/csv/json/parquet 加载）、`dataset.map()`（批量 + 多进程预处理）、`dataset.filter()`（条件过滤）、`streaming=True`（返回 `IterableDataset` 流式逐条处理超大/在线数据）、`push_to_hub()`（一键上传分享）。**Tokenizers** 是用 **Rust 实现**的极速分词库（不到 20 秒 tokenize 1GB 文本），提供完整的分词流水线组件（Normalizer → PreTokenizer → Model → PostProcessor → Decoder），内置三种主流子词算法：**BPE**（Byte-Pair Encoding，GPT 系列）、**WordPiece**（BERT 系列）、**Unigram**（SentencePiece/T5 系列），支持 `Tokenizer.train()` 从语料训练词表、`from_pretrained` 加载已训练词表、`encode`/`decode` 双向转换、特殊 token（`[CLS]`/`[SEP]`/`&lt;unk&gt;` 等）与对齐追踪（alignment tracking）。两者与 Transformers 紧密协作：Datasets 的 `map` + Tokenizers 的 `encode` 是模型训练数据预处理的标准管线，Tokenizers 也是 Transformers `AutoTokenizer` 的快速后端。信源 huggingface.co/docs/datasets + huggingface.co/docs/tokenizers。

## 评价

**优点**

- **Arrow 内存映射是杀手锏**：零拷贝读取，数据集可远超内存而不变慢，RAM 占用恒定——这是 Datasets 区别于 pandas/纯 Python 的核心优势
- **load_dataset 一行加载万种格式**：Hub 20 万+ 数据集、本地 csv/json/parquet/txt/arrow/sql/hdf5/lance/webdataset 全覆盖，自动推断 split 与 features
- **map/filter 高效且灵活**：`map(fn, batched=True, num_proc=4)` 批量 + 多进程并行处理，支持 GPU 并行（with_rank）、async 异步调用 API；`filter` 条件过滤
- **streaming 处理超大数据**：`streaming=True` 返回 IterableDataset 逐条产出，不必整体下载，适合 TB 级或在线数据
- **Tokenizers 用 Rust 极速**：训练与分词都极快（1GB 文本 <20s CPU），对齐追踪精确到字符，生产与研究双适用
- **三算法 + 组件化**：BPE/WordPiece/Unigram 覆盖主流模型，Normalizer/PreTokenizer/Model/PostProcessor/Decoder 五大组件可自由组合构建任意分词器

**缺点**

- **Arrow 内存映射语义需理解**：map/filter 返回新对象、shuffle 后变慢需 flatten_indices、缓存机制等有学习曲线，新手易踩「改了不生效」的坑
- **streaming 模式能力受限**：IterableDataset 无法随机访问、无法 len()、shuffle 是近似的（buffer），与索引式 API 不完全对等
- **缓存目录膨胀**：下载/处理结果默认缓存到 `~/.cache/huggingface`，大数据集易占满磁盘，需手动管理或设 HF_HOME
- **Tokenizers 组件较底层**：手工拼装 Normalizer+PreTokenizer+Model+PostProcessor+Decoder 较繁琐，多数场景直接用 Transformers 的 AutoTokenizer（已封装）更省事
- **中文/多语言处理依赖算法选择**：WordPiece/BPE/Unigram 对中文、emoji、组合字符表现不同，需按语言选算法与预处理（如是否加空格、是否按字切）
- **API 随版本演进**：`tokenizer=` 参数→`processing_class`、streaming 行为细化等，旧脚本需跟进

## 文档地址

- [Datasets 官方文档](https://huggingface.co/docs/datasets/index)
- [Datasets 加载（load_dataset）](https://huggingface.co/docs/datasets/main/en/loading)
- [Datasets 处理（map/filter）](https://huggingface.co/docs/datasets/main/en/process)
- [Datasets 流式（streaming）](https://huggingface.co/docs/datasets/main/en/stream)
- [Tokenizers 官方文档](https://huggingface.co/docs/tokenizers/index)
- [Tokenizers 组件](https://huggingface.co/docs/tokenizers/main/en/components)
- [Tokenizers 快速上手](https://huggingface.co/docs/tokenizers/main/en/quicktour)

## GitHub地址

- [huggingface/datasets](https://github.com/huggingface/datasets)
- [huggingface/tokenizers](https://github.com/huggingface/tokenizers)
- [Datasets Releases](https://github.com/huggingface/datasets/releases)
- [Tokenizers Releases](https://github.com/huggingface/tokenizers/releases)

## 幻灯片地址

<a href="/SlideStack/hf-datasets-tokenizers-slide/" target="_blank">Hugging Face Datasets 与 Tokenizers</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Hugging%20Face%20Datasets%20%E4%B8%8E%20Tokenizers" target="_blank" rel="noopener noreferrer">Hugging Face Datasets 与 Tokenizers 测试题</a>
