---
layout: doc
---

# NLTK

NLTK（Natural Language Toolkit）是 Steven Bird、Ewan Klein 与 Edward Loper 编写、由 NLTK 项目维护的**学术教学型自然语言处理库**，当前主线版本为 **3.9.x**（Apache 2.0 许可）。它的核心定位是「**教学优先、算法可拆解、语料丰富、函数式接口**」——每个 NLP 任务都暴露成独立函数（`word_tokenize`/`sent_tokenize`/`pos_tag`），方便学习者逐个理解算法。NLTK 把工作流组织成「**语料 + 模块**」：先用 `nltk.download()` 按需下载语料与模型（如 `punkt` 分词器、`averaged_perceptron_tagger` 词性器、`wordnet`/`stopwords` 语料库），再调用对应函数处理文本。核心能力覆盖分词（`word_tokenize`/`sent_tokenize`）、词性标注（`pos_tag`，输出 Penn Treebank 标签如 NN/VBD）、词干提取（`PorterStemmer` 规则温和、`LancasterStemmer` 规则激进）、词形还原（`WordNetLemmatizer`，需传 `pos` 参数）、频率统计（`FreqDist`，含 `most_common`/`hapaxes`）、语料库访问（`nltk.corpus.stopwords.words`、`nltk.corpus.wordnet.synsets`）以及机器学习分类（`nltk.classify.NaiveBayesClassifier`、决策树等）。NLTK 还内置大量教学语料（Project Gutenberg 古腾堡文本、Brown 语料库、Reuters 新闻、inaugural 总统就职演说等），是 NLP 入门教学的事实标准。与 spaCy 相比，NLTK 更适合教学与原型（算法透明、可逐行拆解），但速度慢、不做端到端管线、生产部署通常用 spaCy 或 HuggingFace。信源 nltk.org/book（《Natural Language Processing with Python》）。

## 评价

**优点**

- **教学首选、算法透明**：分词、词干、朴素贝叶斯等算法实现可逐行读，是理解 NLP 原理的最佳教材配套
- **函数式接口直观**：`word_tokenize(text)`/`pos_tag(tokens)`/`FreqDist(tokens)` 一个函数一个任务，新手友好
- **语料库极其丰富**：内置 Gutenberg/Brown/Reuters/WordNet/Stopwords 等 50+ 语料，无需自备数据即可上手
- **词形/词干方案齐全**：PorterStemmer（温和）、LancasterStemmer（激进）、SnowballStemmer（多语言）、WordNetLemmatizer（字典还原）任选
- **WordNet 深度集成**：synsets/lemmas/hypernyms 同义词层级查询，做语义扩展/消歧很方便
- **机器学习模块教学友好**：NaiveBayesClassifier、DecisionTreeClassifier 接口简单，配合 featureset 教分类原理

**缺点**

- **速度慢**：纯 Python 实现，无 Cython 加速，批处理大规模文本远不如 spaCy
- **无端到端管线**：每个任务是独立函数，要自己拼「分词→词性→句法」流程，不像 spaCy 的 `nlp(text)` 一次到位
- **需手动下载数据**：第一次用必须 `nltk.download()` 拉取 punkt/tagger/wordnet 等，CI/部署需额外处理
- **词性标注精度一般**：默认 averaged perceptron tagger 精度不如 spaCy 的统计模型，也不含依存句法
- **生产定位弱**：缺乏工业级管线、序列化、Transformer 集成，真实业务多用 spaCy/HuggingFace

## 文档地址

- [NLTK 官方文档（nltk.org）](https://www.nltk.org/)
- [NLTK Book（《Natural Language Processing with Python》在线书）](https://www.nltk.org/book/)
- [NLTK HowTo（API 用法专题）](https://www.nltk.org/howto.html)
- [NLTK 安装指南](https://www.nltk.org/install.html)

## GitHub地址

- [nltk/nltk](https://github.com/nltk/nltk)
- [Releases（版本事实来源）](https://github.com/nltk/nltk/releases)

## 幻灯片地址

<a href="/SlideStack/nltk-slide/" target="_blank">NLTK</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=NLTK" target="_blank" rel="noopener noreferrer">NLTK 测试题</a>
