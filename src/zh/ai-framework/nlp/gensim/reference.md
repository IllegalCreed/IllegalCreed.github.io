---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gensim 官方文档（radimrehurek.com/gensim docs + tutorials + API）整理

## 速查

- **核心抽象**：Document / Corpus（可流式）/ Vector / Model
- **词袋**：`corpora.Dictionary` + `dictionary.doc2bow(text)`
- **词向量**：`Word2Vec`（sg/vector_size/window/min_count/epochs/workers）
- **向量查询**：`model.wv`（KeyedVectors）的 `most_similar`/`similarity`/`doesnt_match`
- **文档向量**：`Doc2Vec`（TaggedDocument + infer_vector）
- **子词向量**：`FastText`（min_n/max_n，支持未登录词）
- **主题模型**：`TfidfModel` / `LsiModel` / `LdaModel`
- **相似度**：`similarities.SparseMatrixSimilarity` / `MatrixSimilarity`
- **安装**：`pip install gensim`
- **import 名**：`import gensim`
- **当前版本**：Gensim 4.4.0（Python 3.8+，依赖 numpy/scipy/smart_open）
- **许可**：LGPL-2.1

## 核心 API

### 词典与词袋

```python
from gensim import corpora

dictionary = corpora.Dictionary(texts)            # 建：词 ↔ id
dictionary.token2id                                # 词 → id 字典
dictionary.doc2bow(text)                           # 词列表 → [(id, count), ...]
dictionary.filter_extremes(no_below=5, no_above=0.5)  # 去低频/高频词
dictionary.save("dict.dict"); corpora.Dictionary.load("dict.dict")
```

### Word2Vec

```python
from gensim.models import Word2Vec

model = Word2Vec(
    sentences=None,        # 可迭代器，每项一个词列表
    sg=0,                  # 0 CBOW / 1 Skip-gram
    vector_size=100,       # 词向量维度
    window=5,              # 上下文窗口
    min_count=5,           # 忽略总频次 < 此值的词
    epochs=5,              # 训练轮数
    workers=3,             # 并行线程（需 Cython）
    negative=5,            # 负采样数
    alpha=0.025,           # 初始学习率
)
model.wv["king"]                       # 取向量
model.save("w2v.model"); Word2Vec.load("w2v.model")
```

### KeyedVectors

```python
from gensim.models import KeyedVectors

kv = model.wv
kv["king"]                                       # 向量
kv.most_similar("king", topn=10)                 # 近义词
kv.most_similar(positive=[...], negative=[...])  # 类比
kv.similarity("a", "b")                          # 相似度
kv.doesnt_match([...])                           # 找不同类
kv.distance("a", "b")                            # 距离
kv.save("v.kv"); KeyedVectors.load("v.kv")
KeyedVectors.load_word2vec_format("file.bin", binary=True)  # 装预训练
```

### Doc2Vec

```python
from gensim.models.doc2vec import Doc2Vec, TaggedDocument

docs = [TaggedDocument(words=t, tags=[f"D{i}"]) for i, t in enumerate(texts)]
model = Doc2Vec(docs, vector_size=100, window=5, min_count=2, epochs=40, dm=1)
model.dv["D0"]                                    # 文档向量
model.infer_vector(tokens, epochs=50, alpha=0.025)  # 推断新文档
```

`dm=1` PV-DM（类似 CBOW）/ `dm=0` PV-DBOW（类似 Skip-gram）。

### FastText

```python
from gensim.models import FastText

model = FastText(sentences, vector_size=100, window=5, min_count=1,
                 min_n=3, max_n=6, epochs=10)
model.wv["running"]            # 训练词
model.wv["unseenword"]         # 未登录词（子词 n-gram 合成，不报错）
```

### 主题模型

```python
from gensim import models

tfidf = models.TfidfModel(corpus)                 # 词袋 → TF-IDF
lsi = models.LsiModel(corpus, id2word=dictionary, num_topics=50)  # LSI 降维
lda = models.LdaModel(corpus, id2word=dictionary, num_topics=10, passes=20)

lda.print_topics(num_topics=5, num_words=10)      # 主题词分布
lda.get_document_topics(bow)                       # 文档主题分布
```

### 相似度索引

```python
from gensim import similarities

index = similarities.SparseMatrixSimilarity(corpus_lsi, num_features=50)
index = similarities.MatrixSimilarity(corpus_lsi)   # 稠密版（小语料）
sims = index[query_vec]                             # → 相似度数组
index.save("index.index"); similarities.SparseMatrixSimilarity.load("index.index")
```

## Word2Vec 参数全表

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `sentences` | None | 训练语料（可迭代器） |
| `sg` | 0 | 0 CBOW / 1 Skip-gram |
| `vector_size` | 100 | 词向量维度 |
| `window` | 5 | 上下文窗口大小 |
| `min_count` | 5 | 忽略频次低于此的词 |
| `epochs` | 5 | 训练轮数 |
| `workers` | 3 | 并行线程 |
| `negative` | 5 | 负采样数（>0 用负采样） |
| `hs` | 0 | 1 用分层 softmax |
| `alpha` | 0.025 | 初始学习率 |
| `min_alpha` | 0.0001 | 末尾学习率 |
| `cbow_mean` | 1 | CBOW 用均值（1）还是求和（0） |
| `sample` | 1e-3 | 高频词下采样阈值 |

## 模型对比

### 词向量模型

| 模型 | 未登录词 | 形态感知 | 速度 | 适用 |
| --- | --- | --- | --- | --- |
| `Word2Vec` | 不支持 | 否 | 快 | 通用词向量 |
| `FastText` | 支持 | 是（子词） | 较慢 | 形态丰富语种/未登录词 |
| `Doc2Vec` | — | — | 中 | 文档/段落向量 |
| `KeyedVectors` | — | — | — | 向量容器（非训练模型） |

### 主题模型

| 模型 | 输出 | 特点 |
| --- | --- | --- |
| `TfidfModel` | 加权词袋 | 罕见词权重升 |
| `LsiModel` | 低维连续向量 | SVD 降维，快，线性 |
| `LdaModel` | 主题概率分布 | 概率模型，主题可解释 |

## 预训练向量加载

```python
from gensim.models import KeyedVectors

# GoogleNews 原生格式（二进制）
kv = KeyedVectors.load_word2vec_format("GoogleNews-vectors-negative300.bin", binary=True)

# 文本格式（如 GloVe 转 word2vec 格式）
kv = KeyedVectors.load_word2vec_format("glove.6B.100d.txt", binary=False, no_header=True)

# 转换后可限制词数省内存
kv = KeyedVectors.load_word2vec_format("file.bin", binary=True, limit=500000)
```

## 版本与兼容

| 版本线 | 状态 | 关键点 |
| --- | --- | --- |
| Gensim 4.4.0 | 活跃主线（2026） | 修复 SciPy 兼容；持续优化 |
| Gensim 4.3.x | 旧版 | 4.3.3 与新版 SciPy 冲突，需锁旧版 |
| Gensim 4.0+ | 当前大版本 | API 大改：size→vector_size、model→model.wv |
| Gensim 3.x | 已淘汰 | API 与 4.x 不兼容，迁移成本高 |

兼容性：

- **Python**：3.8+（4.4.0 要求）
- **依赖**：`numpy` / `scipy` / `smart_open`（SciPy 版本需匹配，否则报错）
- **Cython**：可选但强烈推荐，没有它 `workers` 多线程失效、训练极慢

## 与同类库对比

| 维度 | Gensim | spaCy | NLTK | sklearn 文本 |
| --- | --- | --- | --- | --- |
| 定位 | 主题模型/词向量 | 标注 NLP 管线 | 教学 NLP | 通用 ML |
| 词向量 | Word2Vec/FastText/Doc2Vec | 内置词向量（md/lg） | 无 | 无（配外部） |
| 主题模型 | LDA/LSI 原生 | 无 | 无 | LDA/NMF |
| 流式大语料 | 核心优势 | 不擅长 | 不擅长 | 不擅长 |
| 速度 | C/Cython 加速 | Cython 加速 | 纯 Python 慢 | C 加速 |
| 适合场景 | 语义检索/推荐/词聚类 | 实体抽取/句法 | 教学/原型 | 文本分类 |

## 官方资源

- [Gensim 官网](https://radimrehurek.com/gensim/)
- [Core Concepts](https://radimrehurek.com/gensim/auto_examples/core/run_core_concepts.html)
- [Word2Vec Tutorial](https://radimrehurek.com/gensim/auto_examples/tutorials/run_word2vec.html)
- [Topics and Transformations](https://radimrehurek.com/gensim/auto_examples/core/run_topics_and_transformations.html)
- [API Reference](https://radimrehurek.com/gensim/apiref.html)
- [GitHub piskvorky/gensim](https://github.com/piskvorky/gensim)
- [Releases](https://github.com/piskvorky/gensim/releases)
