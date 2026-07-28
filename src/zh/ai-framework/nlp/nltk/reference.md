---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 NLTK 官方文档（nltk.org/book + nltk.org/howto + API Reference）整理

## 速查

- **安装**：`pip install nltk`，数据 `nltk.download("name")`
- **分词**：`nltk.word_tokenize` / `nltk.sent_tokenize`（需 punkt）
- **词性**：`nltk.pos_tag(tokens)`（Penn Treebank 标签）
- **词干**：`PorterStemmer().stem` / `LancasterStemmer().stem` / `SnowballStemmer(lang).stem`
- **词元**：`WordNetLemmatizer().lemmatize(word, pos='n'/'v'/'a'/'r')`
- **频率**：`nltk.probability.FreqDist`
- **语料**：`nltk.corpus.{gutenberg,brown,reuters,stopwords,wordnet,...}`
- **分类**：`nltk.classify.NaiveBayesClassifier` / `DecisionTreeClassifier`
- **组块**：`nltk.RegexpParser(grammar)`
- **import 名**：`import nltk`
- **当前版本**：NLTK 3.9.x（Python 3.9–3.13）
- **许可**：Apache 2.0

## 核心 API

### 分词

```python
import nltk
nltk.word_tokenize(text)    # → list[str]，词级
nltk.sent_tokenize(text)    # → list[str]，句级
```

依赖数据：`punkt`（旧）/ `punkt_tab`（3.9.x 新）。

### 词性标注

```python
nltk.pos_tag(tokens)   # → [(word, tag), ...]
```

依赖 `averaged_perceptron_tagger` / `averaged_perceptron_tagger_eng`（3.9.x）。

### 词干提取

| 类 | 特点 | 调用 |
| --- | --- | --- |
| `PorterStemmer` | 经典、温和 | `.stem(word)` |
| `LancasterStemmer` | 激进、易过度 | `.stem(word)` |
| `SnowballStemmer(lang)` | 多语言、Porter 改进 | `.stem(word)` |

```python
from nltk.stem import PorterStemmer, SnowballStemmer
PorterStemmer().stem("running")              # run
SnowballStemmer("english").stem("running")   # run
SnowballStemmer("french").stem("manger")     # 多语言
```

### 词形还原

```python
from nltk.stem import WordNetLemmatizer
wnl = WordNetLemmatizer()
wnl.lemmatize("dogs")                  # dog（默认名词）
wnl.lemmatize("running", pos="v")      # run
wnl.lemmatize("better", pos="a")       # good
wnl.lemmatize("quickly", pos="r")      # quickly（副词）
```

`pos` 取值：`'n'`(noun)/`'v'`(verb)/`'a'`(adj)/`'r'`(adv)（WordNet 词性）。

### 频率分布

```python
from nltk.probability import FreqDist
fdist = FreqDist(tokens)
fdist["word"]              # 某词计数
fdist.most_common(n)       # 前 n 高频
fdist.hapaxes()            # 只出现一次的词
fdist.tabulate(n)          # 表格
fdist.plot(n, cumulative=True)   # 图（需 matplotlib）
```

## 语料库 API

```python
from nltk.corpus import stopwords, wordnet, gutenberg, brown

# 停用词
stopwords.words("english")          # → list[str]
stopwords.words("chinese")          # 中文停用词

# WordNet
wordnet.synsets("dog")              # 同义词集列表
wordnet.synset("dog.n.01").lemma_names()   # 义词典词面
wordnet.synset("dog.n.01").hypernyms()     # 上位词
wordnet.synset("dog.n.01").hyponyms()      # 下位词
wordnet.lemmas("happy")             # 词面列表

# 文本语料（统一接口）
gutenberg.fileids()                 # 文件名列表
gutenberg.words("austen-emma.txt")  # 词迭代器
gutenberg.sents("austen-emma.txt")  # 句子迭代器
brown.categories()                  # 体裁列表（news/fiction/...）
brown.words(categories="news")      # 按体裁取词
```

## 分类 API

```python
from nltk.classify import NaiveBayesClassifier, accuracy

classifier = NaiveBayesClassifier.train(labeled_featuresets)
classifier.classify(featureset)             # 预测标签
classifier.classify_many([f1, f2])          # 批量
classifier.prob_classify(featureset).prob("pos")   # 概率
accuracy(classifier, test_set)              # 准确率
classifier.show_most_informative_features(n)
```

特征约定：featureset 是 `{name: True/False 或 数值}`。

## Penn Treebank 常用标签

| 标签 | 含义 | 标签 | 含义 |
| --- | --- | --- | --- |
| `CC` | 并列连词 | `CD` | 基数词 |
| `DT` | 限定词 | `EX` | 存在性 there |
| `IN` | 介词/从属连词 | `JJ` | 形容词 |
| `JJR`/`JJS` | 比较级/最高级形容词 | `MD` | 情态动词 |
| `NN` | 单数名词 | `NNS` | 复数名词 |
| `NNP`/`NNPS` | 专有名词 单/复 | `PDT` | 前位限定词 |
| `POS` | 所有格结尾 | `PRP` | 人称代词 |
| `PRP$` | 物主代词 | `RB` | 副词 |
| `RBR`/`RBS` | 比较级/最高级副词 | `RP` | 小品词 |
| `TO` | to | `UH` | 感叹词 |
| `VB` | 动词原形 | `VBD` | 过去式 |
| `VBG` | 动名词/现在分词 | `VBN` | 过去分词 |
| `VBP`/`VBZ` | 动词 非三单/三单 | `WDT` | wh-限定词 |
| `WP`/`WP$` | wh-代词/物主 | `WRB` | wh-副词 |

## 数据包速查

| 数据包 | 用途 |
| --- | --- |
| `punkt` / `punkt_tab` | 分词器模型 |
| `averaged_perceptron_tagger` / `_eng` | 英文词性标注 |
| `stopwords` | 多语言停用词 |
| `wordnet` | WordNet 义词典 |
| `omw-1.4` | Open Multilingual WordNet |
| `gutenberg` / `brown` / `reuters` / `inaugural` | 文本语料 |
| `names` / `words` | 人名 / 基本词表 |
| `maxent_ne_chunker` | 命名实体组块 |
| `averaged_perceptron_tagger_ru` 等 | 其他语言标注器 |

一键下载教学常用集：

```python
import nltk
nltk.download(["punkt", "punkt_tab", "averaged_perceptron_tagger_eng",
               "stopwords", "wordnet", "omw-1.4", "gutenberg"], quiet=True)
```

## 版本与兼容

| 版本线 | 状态 | 关键点 |
| --- | --- | --- |
| NLTK 3.9.x | 活跃主线（2026） | Python 3.9–3.13；移除 pickle 模型（安全）；punkt/tagger 拆出 `_tab`/`_eng` 包 |
| NLTK 3.8.x | 旧版 | 3.8.1 广泛使用 |
| NLTK 3.x | 当前大版本 | 兼容 Python 3，重写大量接口 |

兼容性：

- **Python**：3.9–3.13（3.9.x 要求）
- **依赖**：纯 Python；可视化需 `matplotlib`，部分高级功能可选 `numpy`/`scikit-learn`
- **数据**：独立下载，与库版本基本解耦，但 3.9.x 部分需新数据包名

## 与同类库对比

| 维度 | NLTK | spaCy | sklearn（文本部分） |
| --- | --- | --- | --- | 
| 定位 | 教学/学术 | 工业/生产 | 通用机器学习 |
| 接口 | 函数式 | 管线 + 对象 | 估计器 fit/predict |
| 速度 | 纯 Python，慢 | Cython 加速，快 | C 加速，较快 |
| 语料 | 内置 50+ | 训练管线包 | 无（需自备） |
| 管线 | 手动拼接 | `nlp(text)` 一次到位 | Pipeline 组装 |
| Transformer | 无 | spacy-transformers | 配 transformers |
| 词形还原 | WordNetLemmatizer | 上下文相关（用管线 POS） | 无内置 |
| 适合场景 | 教学、原型、语料分析 | 生产 NLP | 文本分类等任务 |

## 官方资源

- [NLTK 官网](https://www.nltk.org/)
- [NLTK Book（在线书）](https://www.nltk.org/book/)
- [NLTK HowTo](https://www.nltk.org/howto.html)
- [NLTK API Reference](https://www.nltk.org/api/nltk.html)
- [安装指南](https://www.nltk.org/install.html)
- [GitHub nltk/nltk](https://github.com/nltk/nltk)
- [Releases](https://github.com/nltk/nltk/releases)
