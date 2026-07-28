---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gensim 官方文档（radimrehurek.com/gensim Tutorials + Core + docs API）+ GitHub README 编写

## 速查

- **流式语料**：实现 `__iter__` 的类逐文档 yield，模型按需读取，内存恒定
- **CBOW vs Skip-gram**：sg=0 CBOW（大语料快）/ sg=1 Skip-gram（小语料、低频词好）
- **min_count 取舍**：太小含噪声，太大丢低频词，默认 5
- **epochs**：训练轮数，太少欠拟合，参考 5–15
- **workers**：并行线程，需 Cython，否则 GIL 下极慢
- **增量训练**：`model.build_vocab(more_sentences, update=True)` + `model.train(more_sentences, total_examples=, epochs=)`
- **KeyedVectors 脱离模型**：`model.wv` 可独立保存，部署时不带训练逻辑
- **FastText 子词**：`min_n`/`max_n` 控制 n-gram 范围，决定未登录词合成能力
- **LDA 调参**：`num_topics`/`passes`/`iterations`/`alpha`，用 coherence 评估主题质量
- **TF-IDF→LSI 串接**：先加权再降维，比纯词袋效果好
- **预处理自拼**：Gensim 不分词，配 jieba/spaCy/NLTK 出词列表
- **4.0 迁移**：`size`→`vector_size`、`model[...]`→`model.wv[...]`、`LdaModel.update` 等改名

## 流式处理大语料

Gensim 的核心优势——语料可以是「逐文档 yield」的迭代器，不必全部载入内存：

```python
from gensim import utils
from gensim.models import Word2Vec

class MyCorpus:
    """逐行读文件、预处理、yield 词列表"""
    def __iter__(self):
        for line in open("large_corpus.txt", encoding="utf-8"):
            yield utils.simple_preprocess(line)   # 小写 + 去标点 + 分词

sentences = MyCorpus()
model = Word2Vec(sentences, vector_size=100, window=5, min_count=5, workers=8)
# 不管文件多大，内存恒定（每次只在内存里留一行）
```

要点：
- 类实现 `__iter__`，每次 yield **一个文档的词列表**
- 用 `utils.simple_preprocess` 快速做小写化/去标点（英文）
- 中文需先用 jieba 分词再 yield

## Word2Vec 调参与取舍

### sg：CBOW 还是 Skip-gram

| 算法 | 速度 | 小语料 | 低频词 | 适用 |
| --- | --- | --- | --- | --- |
| CBOW（sg=0） | 快 | 一般 | 差 | 大语料、高频词 |
| Skip-gram（sg=1） | 慢 | 好 | 好 | 小语料、重视低频词 |

### 关键参数取舍

- **vector_size**：维度高表达力强但需更多数据、更慢，常用 100–300
- **window**：小窗口（2–5）偏句法近邻，大窗口（5–10）偏主题语义
- **min_count**：默认 5，过小含噪声（拼写错误），过大丢专业低频词
- **epochs**：3.x 默认 5，大语料 5–10，小语料可 10–15
- **negative**（负采样）：Skip-gram 常用 5–20，越大越慢但更准
- **alpha**：初始学习率，随训练线性衰减，一般不动

### 增量训练（持续喂新数据）

```python
model = Word2Vec(old_sentences, vector_size=100, min_count=5)
# 后续有新数据
new_sentences = [["fresh", "tokens"], ...]
model.build_vocab(new_sentences, update=True)   # 增量更新词表
model.train(new_sentences, total_examples=model.corpus_count, epochs=model.epochs)
```

## KeyedVectors 进阶

`KeyedVectors`（`model.wv`）是「纯向量容器」，可脱离训练模型保存，部署更轻：

```python
from gensim.models import KeyedVectors

# 保存/加载词向量（不含训练逻辑）
model.wv.save("vectors.kv")
kv = KeyedVectors.load("vectors.kv")

# 语义运算
kv.most_similar(positive=["woman", "king"], negative=["man"])   # 类比
kv.similarity("king", "queen")
kv.doesnt_match(["breakfast", "lunch", "dinner", "computer"])

# 向量运算
vec = kv["king"] - kv["man"] + kv["woman"]

# 装载预训练向量（如 GoogleNews / GloVe 转换后）
kv = KeyedVectors.load_word2vec_format("GoogleNews-vectors-negative300.bin", binary=True)
```

## FastText 子词与未登录词

```python
from gensim.models import FastText

model = FastText(
    sentences,
    vector_size=100,
    window=5,
    min_count=1,
    min_n=3,        # 子词 n-gram 最小长度
    max_n=6,        # 子词 n-gram 最大长度
    epochs=10,
)

# 未登录词也能合成向量
model.wv["unseenword"]   # 不报错，由子词 n-gram 合成
```

要点：
- `min_n`/`max_n` 控制子词 n-gram 范围（默认 3–6）
- 子词让向量含形态信息（"run"/"running"/"runs" 互相接近）
- 训练比 Word2Vec 慢（要算子词），适合形态丰富语种/需未登录词支持的场景

## Doc2Vec 文档向量

```python
from gensim.models.doc2vec import Doc2Vec, TaggedDocument

docs = [TaggedDocument(words=tokens, tags=[f"D{i}"]) for i, tokens in enumerate(texts)]
model = Doc2Vec(docs, vector_size=100, window=5, min_count=2, epochs=40, dm=1)
# dm=1 PV-DM（分布式记忆，类似 CBOW）/ dm=0 PV-DBOW（类似 Skip-gram）

# 推断新文档向量（注意 epochs 调高，alpha 调小）
vec = model.infer_vector(["new", "document", "tokens"], epochs=50, alpha=0.025)
```

## 主题模型实战

### TF-IDF → LSI 文档相似度

```python
from gensim import corpora, models, similarities

dictionary = corpora.Dictionary(texts)
corpus = [dictionary.doc2bow(t) for t in texts]

tfidf = models.TfidfModel(corpus)
corpus_tfidf = tfidf[corpus]

lsi = models.LsiModel(corpus_tfidf, id2word=dictionary, num_topics=50)
corpus_lsi = lsi[corpus_tfidf]   # 文档降到 50 维语义空间

index = similarities.MatrixSimilarity(corpus_lsi)
query = lsi[tfidf[dictionary.doc2bow(query_tokens)]]
sims = sorted(enumerate(index[query]), key=lambda x: -x[1])   # 按相似度排序
```

### LDA 主题挖掘

```python
lda = models.LdaModel(
    corpus,
    id2word=dictionary,
    num_topics=10,
    passes=20,        # 整个语料训练轮数，越大越收敛但慢
    iterations=400,   # 单次迭代次数
    alpha="auto",     # 主题分布的先验，auto 自动学
)
for topic in lda.print_topics(10):
    print(topic)   # 每个主题的高频词分布
```

LDA 调参要点：
- `num_topics`：主题数，需结合 coherence（`CoherenceModel`）评估
- `passes`：大语料用 5–20，太小不收敛
- 主题质量强依赖预处理（去停用词、词干/词形还原、去低频词）

## 4.0 迁移要点

| 3.x | 4.x |
| --- | --- |
| `Word2Vec(size=)` | `Word2Vec(vector_size=)` |
| `model["king"]` | `model.wv["king"]` |
| `model.most_similar(...)` | `model.wv.most_similar(...)` |
| `Word2Vec.load()` 直接含向量 | 训练状态与向量分离，注意存 wv |
| 部分 `LdaModel.update` 等 | API 调整，查 changelog |

## 陷阱与最佳实践

- **把整个语料读成 list 再喂**：违背流式设计，大语料爆内存；用 `__iter__` 类
- **workers 设大却没装 Cython**：没 Cython 时 GIL 限制单核，训练「miserably slow」
- **Word2Vec 直接取向量未登录词**：报 KeyError，需 FastText 或 `min_count` 调小
- **infer_vector 结果不稳定**：`Doc2Vec.infer_vector` 默认随机初始化，需固定 `alpha` 与 `epochs`、多次取平均
- **LDA 主题数乱定**：用 `CoherenceModel` 评估，别拍脑袋
- **中文不分词就喂**：中文需先 jieba 分词，否则字符级无意义
- **SciPy 版本不锁**：4.3.x 曾与新版 SciPy 冲突，生产锁依赖版本
