---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 NLTK 官方文档（nltk.org/book + nltk.org/howto）编写，对照 NLTK 3.9.x 当前行为

## 速查

- **安装**：`pip install nltk`
- **下载数据**：`nltk.download()`（图形界面）或 `nltk.download("punkt")`（单个包），首次必做
- **分词**：`word_tokenize(text)`（词级）/ `sent_tokenize(text)`（句级）
- **词性标注**：`pos_tag(tokens)`，返回 `[(word, tag), ...]`，tag 是 Penn Treebank 标签（NN/VBD/JJ...）
- **词干提取**：`PorterStemmer().stem(word)`（温和）/ `LancasterStemmer().stem(word)`（激进）/ `SnowballStemmer("english")`
- **词形还原**：`WordNetLemmatizer().lemmatize(word, pos='v')`，默认按名词、传 pos 更准
- **频率统计**：`FreqDist(tokens)`，`fdist.most_common(n)`/`fdist.hapaxes()`
- **停用词**：`nltk.corpus.stopwords.words("english")`，需 `nltk.download("stopwords")`
- **WordNet**：`nltk.corpus.wordnet.synsets(word)`，需 `nltk.download("wordnet")`
- **分类**：`nltk.classify.NaiveBayesClassifier.train(train_set)`，需自备 featureset
- **import 名**：`import nltk`
- **当前版本**：NLTK 3.9.x（Python 3.9–3.13）

## 安装

```bash
pip install nltk
```

NLTK 本身是纯 Python，但部分功能（如分词、词性标注）依赖**数据包**，需单独下载：

```python
import nltk

# ① 图形界面（可选全部数据）
nltk.download()

# ② 命令行下载单个包（推荐，CI 友好）
nltk.download("punkt")           # 分词器
nltk.download("punkt_tab")       # punkt 的新版数据（3.9.x）
nltk.download("averaged_perceptron_tagger")  # 词性标注
nltk.download("averaged_perceptron_tagger_eng")  # 3.9.x 英文 tagger
nltk.download("stopwords")       # 停用词语料
nltk.download("wordnet")         # WordNet
nltk.download("omw-1.4")         # Open Multilingual WordNet（多语言）
```

```python
import nltk
print(nltk.__version__)   # 如 3.9.x
```

## 第一个例子：分词与词性标注

最小可用流程——下载数据、分词、标注词性：

```python
import nltk
nltk.download(["punkt", "averaged_perceptron_tagger_eng"], quiet=True)

text = "NLTK is a leading platform for building Python programs."

# ① 分词（词级）
tokens = nltk.word_tokenize(text)
print(tokens)
# ['NLTK', 'is', 'a', 'leading', 'platform', ...]

# ② 词性标注
tagged = nltk.pos_tag(tokens)
print(tagged)
# [('NLTK', 'NNP'), ('is', 'VBZ'), ('a', 'DT'), ('leading', 'VBG'), ...]
```

> **铁律**：第一次运行某功能报 `Resource ... not found` 几乎都是数据没下载，按提示 `nltk.download("名字")` 即可。

## 句子切分

```python
import nltk
nltk.download("punkt", quiet=True)

text = "Hello world. This is a test. Let's tokenize sentences!"
sents = nltk.sent_tokenize(text)
print(sents)
# ["Hello world.", "This is a test.", "Let's tokenize sentences!"]
```

`sent_tokenize` 用 `punkt` 模型识别句子边界（处理缩写如 "U.S." 不会误切）。

## 词性标注（POS Tagging）

`pos_tag` 输出 Penn Treebank 标签集：

```python
tagged = nltk.pos_tag(nltk.word_tokenize("They refuse to permit us to obtain the permit"))
print(tagged)
# [('They', 'PRP'), ('refuse', 'VBP'), ('to', 'TO'), ('permit', 'VB'), ...
#  ('permit', 'NN')]   # 同形词 refuse/permit 按上下文判不同词性
```

常见 Penn Treebank 标签：

| 标签 | 含义 | 示例 |
| --- | --- | --- |
| `NN` | 单数名词 | dog |
| `NNS` | 复数名词 | dogs |
| `VB` / `VBD` / `VBG` | 动词原形/过去式/动名词 | run/ran/running |
| `JJ` | 形容词 | quick |
| `RB` | 副词 | quickly |
| `DT` | 限定词 | the/a |
| `PRP` | 人称代词 | they/I |
| `IN` | 介词/从属连词 | in/that |

## 词干提取（Stemming）

词干用规则粗暴去词缀，结果可能不是真词：

```python
from nltk.stem import PorterStemmer, LancasterStemmer

porter = PorterStemmer()
lancaster = LancasterStemmer()

print(porter.stem("running"))     # run
print(porter.stem("happiness"))   # happi （非真词）
print(lancaster.stem("running"))  # run
print(lancaster.stem("happiness"))# happy （Lancaster 更激进/不同结果）
```

- **PorterStemmer**：最常用，规则温和，结果稳定
- **LancasterStemmer**：规则更激进，过度切词概率高
- **SnowballStemmer("english")**：Porter 改进版，支持多语言（传语言名）

## 词形还原（Lemmatization）

`WordNetLemmatizer` 用 WordNet 字典，结果一定是真词，但需指定词性：

```python
from nltk.stem import WordNetLemmatizer
nltk.download("wordnet", quiet=True)

wnl = WordNetLemmatizer()

print(wnl.lemmatize("dogs"))              # dog（默认按名词）
print(wnl.lemmatize("running"))           # running（默认名词，没还原！）
print(wnl.lemmatize("running", pos="v"))  # run（按动词还原才对）
print(wnl.lemmatize("better", pos="a"))   # good（按形容词）
```

> **铁律**：`WordNetLemmatizer` 默认把词当名词还原，动词/形容词必须传 `pos`，否则像 "running" 不会还原成 "run"。`pos` 取 WordNet 词性 `n`(noun)/`v`(verb)/`a`(adj)/`r`(adv)。

## 频率统计（FreqDist）

```python
from nltk.probability import FreqDist

tokens = nltk.word_tokenize("the cat sat on the mat the cat ran")
fdist = FreqDist(tokens)
print(fdist["the"])              # 3
print(fdist.most_common(3))      # [('the', 3), ('cat', 2), ...]
print(fdist.hapaxes())           # 只出现一次的词（['sat', 'on', 'mat', 'ran']）
fdist.plot(5, cumulative=False)  # 频率分布图（需 matplotlib）
```

## 停用词

```python
from nltk.corpus import stopwords
nltk.download("stopwords", quiet=True)

stop_en = set(stopwords.words("english"))
print(len(stop_en))            # 179（英文停用词数）
tokens = [w for w in nltk.word_tokenize(text) if w.lower() not in stop_en]
# 过滤掉 the/is/a 等高频虚词
```

## WordNet 语料库

```python
from nltk.corpus import wordnet
nltk.download("wordnet", quiet=True)

# 同义词集（synsets）
synsets = wordnet.synsets("motorcar")
print(synsets)                          # [Synset('car.n.01')]
print(synsets[0].lemma_names())         # ['car', 'auto', 'automobile', 'motorcar']

# 上位词（更抽象）/ 下位词（更具体）
car = wordnet.synset("car.n.01")
print([h.name() for h in car.hypernyms()])   # 上位：motor_vehicle
print([h.name() for h in car.hyponyms()])    # 下位：ambulance, cab...
```

## 下一步

- 入门后请读 **指南**：Porter vs Lancaster 词干差异、WordNetLemmatizer 的 pos 映射技巧、NaiveBayesClassifier 特征工程、语料库访问（gutenberg/brown/reuters）
- 推理跑通后看 **参考**：API 速查表、Penn Treebank 标签全集、语料库一览、与 spaCy 对比
- 想学分类与情感分析，参考 NLTK Book 第 6 章
