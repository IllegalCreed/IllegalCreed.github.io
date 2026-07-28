---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 NLTK 官方文档（nltk.org/book 第 1–7 章 + HowTo）+ GitHub README 编写

## 速查

- **三种词干器对比**：Porter（温和稳定）/ Lancaster（激进易过度切）/ Snowball（多语言，Porter 改进）
- **WordNetLemmatizer**：默认按名词还原，动词/形容词必须传 `pos='v'/'a'/'r'`，否则不还原
- **POS 映射**：Penn Treebank 标签（VB/NN/JJ）需映射到 WordNet 词性（v/n/a）才能正确 lemmatize
- **朴素贝叶斯**：`NaiveBayesClassifier.train(labeled_featuresets)`，特征是 `{name: bool/val}`
- **特征工程**：用词袋/词长/词尾等构造 featureset，决定分类上限
- **语料库访问**：`nltk.corpus.gutenberg.fileids()` → `.words()`/`.sents()`/`.raw()`
- **FreqDist 进阶**：`most_common`/`hapaxes`/`tabulate`/`plot`
- **Bigrams/Collocations**：`nltk.bigrams(tokens)` / `nltk.collocations`
- **Chunking**：正则 `nltk.RegexpParser` 做浅层句法组块（名词短语等）
- **Stemmer 复现**：词干器无随机性，结果确定；Lemmatizer 依赖 WordNet 版本
- **数据包**：punkt/averaged_perceptron_tagger/stopwords/wordnet/omw-1.4 是常用集
- **中文支持弱**：NLTK 主战场是英文，中文分词通常配合 jieba

## Porter vs Lancaster vs Snowball 词干器

```python
from nltk.stem import PorterStemmer, LancasterStemmer, SnowballStemmer

words = ["running", "happiness", "relational", "crying", "fairly"]
porter, lancaster = PorterStemmer(), LancasterStemmer()
snowball = SnowballStemmer("english")

for w in words:
    print(w, "->", porter.stem(w), "|", lancaster.stem(w), "|", snowball.stem(w))
# running  -> run | run | run
# happiness -> happi | happy | happi
# relational -> relat | rel | relat
# crying   -> cri | cry | cri
# fairly   -> fairli | fair | fairli
```

对比要点：

- **Porter**：经典，规则温和，结果稳定但偶尔非真词（happi）
- **Lancaster**：规则激进，切得狠（relat→rel），易过度
- **Snowball**：Porter 作者的改进版，支持多语言（`SnowballStemmer("french")`），是现代推荐

选择：生产用 Snowball（更准且多语言），教学讲原理用 Porter，需切得更狠用 Lancaster。

## WordNetLemmatizer 与 POS 映射

`WordNetLemmatizer` 默认把词当名词，动词/形容词需显式传 `pos`。实际工程常把 `pos_tag` 的输出映射成 WordNet 词性：

```python
from nltk.corpus import wordnet
from nltk.stem import WordNetLemmatizer

def get_wordnet_pos(treebank_tag):
    if treebank_tag.startswith("J"):   return wordnet.ADJ
    elif treebank_tag.startswith("V"): return wordnet.VERB
    elif treebank_tag.startswith("N"): return wordnet.NOUN
    elif treebank_tag.startswith("R"): return wordnet.ADV
    else:                              return wordnet.NOUN   # 默认名词

wnl = WordNetLemmatizer()
sentence = "The cars are running faster"
tokens = nltk.word_tokenize(sentence)
tagged = nltk.pos_tag(tokens)   # [('The','DT'),('cars','NNS'),...]

lemmas = [wnl.lemmatize(w, get_wordnet_pos(t)) for w, t in tagged]
print(lemmas)   # ['The', 'car', 'be', 'run', 'fast']
```

Penn Treebank → WordNet 词性映射：

| Treebank 前缀 | WordNet 词性 | 含义 |
| --- | --- | --- |
| `J` (JJ/JJR/JJS) | `wordnet.ADJ` | 形容词 |
| `V` (VB/VBD/VBG/VBP/VBZ) | `wordnet.VERB` | 动词 |
| `N` (NN/NNS/NNP) | `wordnet.NOUN` | 名词 |
| `R` (RB/RBR/RBS) | `wordnet.ADV` | 副词 |
| 其他 | `wordnet.NOUN` | 默认当名词 |

> **铁律**：不传 `pos` 的 `lemmatize` 等于只还原名词复数。要正确还原动词/形容词，必须先 `pos_tag` 再映射。

## 朴素贝叶斯分类（NaiveBayesClassifier）

NLTK 的朴素贝叶斯接口适合教学，特征是字典：

```python
import nltk
from nltk.classify import NaiveBayesClassifier

# ① 定义特征函数（把文本转成 featureset）
def word_features(words):
    return {word: True for word in words}   # 最简：词袋特征

# ② 构造标注好的训练集
positive = ["great", "wonderful", "good", "amazing", "love"]
negative = ["terrible", "awful", "bad", "hate", "worst"]
train_set = [(word_features(w.split()), "pos") for w in positive] + \
            [(word_features(w.split()), "neg") for w in negative]

# ③ 训练
classifier = NaiveBayesClassifier.train(train_set)

# ④ 预测
test = word_features(["great", "love"])
print(classifier.classify(test))   # 'pos'

# ⑤ 看最有判别力的特征
classifier.show_most_informative_features(5)
```

工程实践要点：
- 特征是 `{name: True/False 或 数值}`，决定分类上限
- 文本常用词袋（`{w: True}`）/ TF-IDF / 词长 / 标点比例 等
- `nltk.classify.accuracy(classifier, test_set)` 评估准确率
- 生产情感分类通常改用 sklearn/transformers，NLTK 主要用于教学

## 语料库访问

NLTK 内置丰富语料，统一接口：

```python
import nltk
nltk.download("gutenberg", quiet=True)
from nltk.corpus import gutenberg

print(gutenberg.fileids())                # ['austen-emma.txt', 'bible-kjv.txt', ...]
emma = gutenberg.words("austen-emma.txt") # 词列表（含标点）
sents = gutenberg.sents("austen-emma.txt")# 句子列表
raw = gutenberg.raw("austen-emma.txt")    # 原始字符串

# 频率分析
fdist = nltk.FreqDist(w.lower() for w in emma if w.isalpha())
print(fdist.most_common(10))
```

常用语料：

| 语料 | 内容 | 下载名 |
| --- | --- | --- |
| `gutenberg` | 古腾堡经典文学 | `gutenberg` |
| `brown` | Brown 语料库（按体裁分类） | `brown` |
| `reuters` | 路透社新闻（分类标注） | `reuters` |
| `inaugural` | 美国总统就职演说 | `inaugural` |
| `stopwords` | 多语言停用词 | `stopwords` |
| `wordnet` | WordNet 义词典 | `wordnet` |
| `names` | 英文人名 | `names` |
| `words` | 英语基本词表 | `words` |

## Collocations 与 Bigrams

```python
import nltk
from nltk.collocations import BigramCollocationFinder, BigramAssocMeasures

tokens = nltk.word_tokenize(text)
finder = BigramCollocationFinder.from_words(tokens)
finder.apply_freq_filter(2)   # 至少出现 2 次
bigram_measures = BigramAssocMeasures()
print(finder.nbest(bigram_measures.pmi, 5))   # PMI 最高的 bigram
```

## Chunking（浅层句法组块）

用正则在词性序列上抽短语：

```python
grammar = "NP: {<DT>?<JJ>*<NN>+}"   # 名词短语：可选限定词 + 任意形容词 + 名词
cp = nltk.RegexpParser(grammar)
result = cp.parse(nltk.pos_tag(nltk.word_tokenize("the quick brown fox")))
print(result)
# (S (NP the/DT quick/JJ brown/JJ fox/NN))
```

## 陷阱与最佳实践

- **首次报 `Resource not found`**：按提示 `nltk.download("名字")`；CI 里写死 `nltk.download([...])`
- **Lemmatizer 不传 pos**：动词/形容词不还原，必须先 `pos_tag` 再映射词性
- **3.9.x 数据包改名**：`punkt` 拆出 `punkt_tab`、`averaged_perceptron_tagger` 拆出 `_eng`，旧脚本可能要补下载
- **Lancaster 过度切词**：激进模式结果常非真词，生产慎用
- **pos_tag 精度有限**：默认 averaged perceptron，复杂文本精度不如 spaCy，要高精度换工具
- **中文支持弱**：NLTK 中文分词不如 jieba，词性/句法中文模型稀疏，中文场景配 jieba 或 spaCy
- **大规模批处理慢**：纯 Python，百万级文本用 spaCy 或 HuggingFace
