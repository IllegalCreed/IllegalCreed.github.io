---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Gensim 官方文档（radimrehurek.com/gensim Core Concepts + Word2Vec Tutorial + Topics）编写，对照 Gensim 4.4.0 当前行为

## 速查

- **安装**：`pip install gensim`（依赖 numpy/scipy/smart_open）
- **核心抽象**：Document（文档）→ Corpus（语料，可流式）→ Vector（向量）→ Model（变换模型）
- **词袋两件套**：`corpora.Dictionary(texts)` 建词典；`dictionary.doc2bow(text)` 转词袋向量
- **词向量**：`Word2Vec(sentences, sg=0/1, vector_size=, window=, min_count=, epochs=, workers=)`
- **sg 参数**：`sg=0` CBOW（用上下文预测中心词）/ `sg=1` Skip-gram（用中心词预测上下文）
- **向量访问**：训练后用 `model.wv`（KeyedVectors），`model.wv["king"]`、`model.wv.most_similar(...)`
- **文档向量**：`Doc2Vec`；子词向量：`FastText`（能为未登录词生成向量）
- **主题模型**：`TfidfModel`（加权）/ `LsiModel`（降维）/ `LdaModel`（主题概率分布）
- **相似度**：`similarities.SparseMatrixSimilarity(corpus, num_features=)`
- **流式输入**：模型接受「逐文档 yield 的迭代器」，不必一次性载入内存
- **import 名**：`import gensim`
- **当前版本**：Gensim 4.4.0（Python 3.8+）

## 安装

```bash
pip install gensim   # 自动装 numpy/scipy/smart_open
```

注意 SciPy 版本兼容：4.3.x 曾与新版 SciPy 冲突，4.4.0 已修复，建议用最新版并锁依赖。

```python
import gensim
print(gensim.__version__)   # 如 4.4.0
```

## 第一个例子：词袋与相似度

最小可用流程——建词典、转词袋、查相似度：

```python
from gensim import corpora

texts = [
    ["human", "interface", "computer"],
    ["survey", "user", "computer", "system", "response"],
    ["eps", "user", "interface", "system"],
]

dictionary = corpora.Dictionary(texts)          # 建词典（词 → id）
corpus = [dictionary.doc2bow(text) for text in texts]  # 转词袋（id, count）

print(corpus[0])   # [(0, 1), (1, 1), (2, 1)]  即 id=0 出现 1 次...
```

> **铁律**：Gensim 的语料是「每文档一个 `[(id, count), ...]` 列表」的迭代器。`Dictionary` 管「词↔id」映射，`doc2bow` 把词列表转成稀疏词袋。

## 训练 Word2Vec 词向量

```python
from gensim.models import Word2Vec

# sentences 是「每文档一个词列表」的迭代器（流式，可超大语料）
sentences = [["human", "computer"], ["dog", "barks", "loudly"], ["cat", "meows"]]
model = Word2Vec(
    sentences=sentences,
    sg=1,            # 1=Skip-gram（小语料更稳）；0=CBOW（默认，大语料快）
    vector_size=100, # 词向量维度
    window=5,        # 上下文窗口大小
    min_count=1,     # 出现次数 < 此值的词忽略（默认 5）
    epochs=10,       # 训练轮数
    workers=4,       # 并行线程（需 Cython，否则受 GIL 限制很慢）
)

# 取向量与语义查询（都在 model.wv，即 KeyedVectors）
vec = model.wv["human"]
print(model.wv.most_similar("human", topn=3))    # 最相似的词
print(model.wv.similarity("dog", "cat"))         # 两词相似度
print(model.wv.doesnt_match(["dog", "cat", "computer"]))  # 找不同类
```

经典词类比对（需大语料才准）：

```python
model.wv.most_similar(positive=["king", "woman"], negative=["man"])
# 经典结果接近 [('queen', 0.7...), ...]
```

## 核心参数详解（Word2Vec）

| 参数 | 含义 | 典型值 |
| --- | --- | --- |
| `sg` | 算法：0=CBOW，1=Skip-gram | 小语料用 1，大语料用 0 |
| `vector_size` | 词向量维度 | 100–300 |
| `window` | 上下文窗口（中心词两边各 window 个词） | 5 |
| `min_count` | 忽略总频次 < 此值的词 | 5（默认） |
| `epochs` | 训练轮数 | 5–15 |
| `workers` | 并行训练线程数 | CPU 核数 |
| `negative` | 负采样数（Skip-gram 常用） | 5–15 |
| `alpha` | 初始学习率 | 0.025 |

### CBOW vs Skip-gram

- **CBOW（sg=0）**：用上下文窗口的词**平均**预测中心词，训练快，适合大语料
- **Skip-gram（sg=1）**：用中心词预测每个上下文词，对小语料/低频词更友好，但训练慢

## KeyedVectors 语义查询

训练好的词向量存在 `model.wv`（`KeyedVectors` 对象）：

```python
kv = model.wv

kv["king"]                          # 取向量（numpy 数组）
kv.most_similar("king", topn=5)     # 最相似词
kv.similarity("king", "queen")      # 相似度（0–1）
kv.doesnt_match(["king", "queen", "banana"])  # 找不同类（banana）
kv.most_similar(positive=["king","woman"], negative=["man"])  # 类比

# KeyedVectors 可单独保存/加载（脱离训练模型）
kv.save("wordvectors.kv")
kv = KeyedVectors.load("wordvectors.kv")
```

## Doc2Vec 与 FastText

### Doc2Vec：文档级向量

```python
from gensim.models.doc2vec import Doc2Vec, TaggedDocument

documents = [TaggedDocument(words=tokens, tags=[str(i)]) for i, tokens in enumerate(texts)]
model = Doc2Vec(documents, vector_size=100, window=5, min_count=2, epochs=40)

vec = model.dv["0"]                  # 取某文档向量
new_vec = model.infer_vector(["new","doc","tokens"])  # 推断新文档向量
```

### FastText：子词向量（解决未登录词）

```python
from gensim.models import FastText

model = FastText(sentences, vector_size=100, window=5, min_count=1, epochs=10)
vec = model.wv["running"]
vec_oov = model.wv["runnable_unseen"]   # 未登录词也能生成向量（靠子词 n-gram）
```

> **铁律**：`Word2Vec` 对训练时没见过的词取向量会报 `KeyError`；`FastText` 靠子词 n-gram 能为未登录词合成向量，这是两者的核心差异。

## 主题模型：TF-IDF / LSI / LDA

```python
from gensim import corpora, models, similarities

dictionary = corpora.Dictionary(texts)
corpus = [dictionary.doc2bow(t) for t in texts]

# ① TF-IDF（词袋 → 加权向量，罕见词权重升）
tfidf = models.TfidfModel(corpus)
corpus_tfidf = tfidf[corpus]

# ② LSI（潜在语义索引，降维到 num_topics 维）
lsi = models.LsiModel(corpus_tfidf, id2word=dictionary, num_topics=2)
corpus_lsi = lsi[corpus_tfidf]

# ③ LDA（主题概率分布）
lda = models.LdaModel(corpus, id2word=dictionary, num_topics=10, passes=10)
print(lda.print_topics(3))   # 打印前 3 个主题的词分布
```

管线可串接：词袋 → TF-IDF → LSI/LDA，每步是「模型包装语料」返回新语料。

## 文档相似度查询

```python
index = similarities.SparseMatrixSimilarity(corpus_lsi, num_features=2)
sims = index[corpus_lsi[0]]   # 第 0 篇与全部文档的相似度
print(list(enumerate(sims)))  # [(0, 1.0), (1, 0.3), ...]
```

## 下一步

- 入门后请读 **指南**：流式语料迭代器、Word2Vec 调参与增量训练、LDA 主题质量评估、KeyedVectors 高级用法、4.0 迁移
- 推理跑通后看 **参考**：API 速查表、参数全表、模型保存格式、与同类库对比
- 想做语义检索，参考 similarities 模块与 LSI/LDA 组合实战
