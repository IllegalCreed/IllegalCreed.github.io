---
layout: doc
---

# Gensim

Gensim 是 Radim Řehůřek 创建、piskvorky/gensim 团队维护的**主题模型与文档语义相似度开源库**，当前主线版本为 **4.4.0**（LGPL-2.1 许可）。它的核心定位是「**无监督语义建模、流式处理大语料、生产级词向量与主题模型**」——专为「语料大到内存装不下」的场景设计，所有模型都接受**迭代器（流式输入）**而非一次性载入内存的列表。核心能力分两大块：**词向量与文档向量**——`Word2Vec`（`sg=0` CBOW / `sg=1` Skip-gram，参数 `vector_size`/`window`/`min_count`/`epochs`/`workers`）、`Doc2Vec`（段落向量）、`FastText`（子词 n-gram，能为未登录词生成向量），训练好的向量存在 `KeyedVectors`（`model.wv`）里，提供 `most_similar`/`similarity`/`doesnt_match` 等语义查询；**主题模型与相似度**——用 `corpora.Dictionary` + `doc2bow` 构建词袋，再叠加 `TfidfModel`（TF-IDF 加权）、`LsiModel`（潜在语义索引，降维）、`LdaModel`（潜在狄利克雷分布，主题概率分布），配合 `similarities.SparseMatrixSimilarity` 做文档相似度查询。Gensim 强调「**Document（文档）→ Corpus（语料，可流式）→ Vector（向量）→ Model（变换模型）**」的核心抽象，训练无需人工标注（无监督），适合搜索引擎、推荐系统、语义检索、词聚类等场景。与 spaCy/NLTK 偏标注 NLP 不同，Gensim 专注向量空间模型与主题挖掘，三者常互补使用。信源 radimrehurek.com/gensim 官方文档。

## 评价

**优点**

- **流式处理大语料**：所有模型接受迭代器，按需逐文档读取，不必把整个语料塞进内存，天然适合 TB 级文本
- **Word2Vec/FastText 工业实现成熟**：原生支持多线程（`workers`）、增量训练、模型保存加载，是训练词向量的事实标准之一
- **KeyedVectors 语义查询丰富**：`most_similar`/`similarity`/`doesnt_match` 一行做词类比与近义查询，经典「king - man + woman ≈ queen」即出自此
- **主题模型齐全**：TF-IDF/LSI/LDA 一条管线串接，做文档降维、主题挖掘、相似度检索非常顺手
- **无监督、无需标注**：直接喂原始文本流即可训练，省去昂贵的人工标注
- **FastText 解决未登录词**：子词 n-gram 让模型能为训练时没见过的词生成向量，弥补 Word2Vec 的硬伤

**缺点**

- **API 在 4.0 大改、迁移成本高**：3.x 到 4.0 大量重命名（如 `model.wv` 取代 `model`、`size`→`vector_size`），老代码迁移需逐行改
- **主题模型调参难、可解释性一般**：LDA 主题数 `num_topics`、`passes`/`iterations` 需反复试，主题质量依赖数据与预处理
- **SciPy/NumPy 版本耦合敏感**：4.3.x 与新版 SciPy 曾不兼容，依赖环境需谨慎锁版本
- **文本预处理需自己拼**：Gensim 不做分词/词性，需配 jieba/spaCy/NLTK 先处理成词列表
- **文档偶有滞后**：部分高级用法（如自定义回调、分布式训练）文档较薄，需查 issue

## 文档地址

- [Gensim 官方文档（radimrehurek.com/gensim）](https://radimrehurek.com/gensim/)
- [Core Concepts（核心概念）](https://radimrehurek.com/gensim/auto_examples/core/run_core_concepts.html)
- [Word2Vec 教程](https://radimrehurek.com/gensim/auto_examples/tutorials/run_word2vec.html)
- [Topics and Transformations（主题与变换）](https://radimrehurek.com/gensim/auto_examples/core/run_topics_and_transformations.html)

## GitHub地址

- [piskvorky/gensim](https://github.com/piskvorky/gensim)
- [Releases（版本事实来源）](https://github.com/piskvorky/gensim/releases)

## 幻灯片地址

<a href="/SlideStack/gensim-slide/" target="_blank">Gensim</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Gensim" target="_blank" rel="noopener noreferrer">Gensim 测试题</a>
