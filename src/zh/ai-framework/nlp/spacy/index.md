---
layout: doc
---

# spaCy

spaCy 是 Explosion 团队（Honnibal 与 Montani 等人）开发维护的**工业级开源自然语言处理库**，当前主线版本为 **3.8.x**（MIT 许可）。它的核心定位是「**生产就绪、面向真实业务、Cython 加速、管线化**」——用一行 `nlp = spacy.load("en_core_web_sm")` 加载训练好的统计语言模型，调用 `doc = nlp(text)` 就得到带全套标注的 `Doc` 对象。spaCy 把 NLP 工作流抽象成**处理管线（processing pipeline）**：文本先经过唯一的 `tokenizer`（不可替换）切分成 `Token`，再依次流经 `tagger`（词性标注）、`morphologizer`（形态学）、`parser`（依存句法 + 句子边界）、`lemmatizer`（词形还原）、`ner`（命名实体识别）等组件，每个组件读 `Doc`、写标注、返回 `Doc`。核心数据对象有三层：`Doc`（整篇文档，token 序列容器）、`Span`（连续的 token 切片，如一个实体/名词短语）、`Token`（单个词，带 `text/lemma_/pos_/dep_/ent_type_` 等属性，下划线后缀取可读字符串）。官方为 20+ 语言提供训练好的管线包，英文有 `en_core_web_sm/md/lg`（CNN 统计模型）与 `en_core_web_trf`（Transformer），中文有 `zh_core_web_sm/md/trf`。规则匹配方面，`Matcher` 用 token 属性模式（`LOWER/POS/IS_DIGIT/OP`）做类正则匹配，`PhraseMatcher` 用 `Doc` 列表高效匹配大词表。通过 `spacy-transformers` 可把 RoBERTa/BERT 等接入管线做 `Transformer` 组件。与 NLTK 相比，spaCy 面向生产、速度更快、API 统一为「对象 + 管线」，而 NLTK 偏教学、提供更丰富的语料库与算法教学接口。信源 spacy.io/usage 官方文档。

## 评价

**优点**

- **工业级管线设计**：`nlp(text)` 一次调用得到分词、词性、依存、实体、词形还原全套标注，组件可插拔（`add_pipe`/`disable_pipes`），适合生产部署
- **Cython 加速性能强**：核心用 Cython 编写，处理速度远超纯 Python 实现，是 spaCy 相对 NLTK 的主要卖点
- **数据对象设计统一**：`Doc`/`Span`/`Token` 三层对象把标注和原文绑定，下划线后缀（`pos_`/`dep_`/`lemma_`）取可读字符串、无后缀取 hash，内存与易用性兼顾
- **官方训练模型覆盖广**：20+ 语言开箱即用的统计/Transformer 管线（en_core_web_sm/lg/trf、zh_core_web_sm 等），作为 Python 包安装，无需手动下载
- **Transformer 集成完善**：`spacy-transformers` 让 Transformer 组件（en_core_web_trf）与下游 tagger/parser/ner 共享表示，兼顾精度与管线一致性
- **规则匹配灵活**：Matcher 支持基于词法/语言学属性的模式匹配，PhraseMatcher 高效匹配大术语表，满足信息抽取需求

**缺点**

- **学习曲线陡于 NLTK**：管线、组件工厂、`Language.component` 装饰器等抽象对新手偏重，不如 NLTK 的函数式调用直观
- **中文支持弱于英文**：中文分词依赖训练模型，词性/依存精度不如英文，且中文 Transformer 模型迭代不如英文频繁
- **大模型体积可观**：`en_core_web_lg` 数百 MB、`en_core_web_trf` 更大，部署成本高于「按需下载语料」的 NLTK
- **自定义训练门槛高**：用 `spacy train` 训练新管线需准备训练数据、配置 config.cfg，流程比 NLTK 的算法接口复杂
- **算法实现不如 NLTK 透明**：spaCy 把模型当黑盒用，NLTK 更适合教学时逐行拆解 Porter 词干器、朴素贝叶斯等算法

## 文档地址

- [spaCy 官方文档（spacy.io/usage）](https://spacy.io/usage)
- [Linguistic Features（词性/依存/实体）](https://spacy.io/usage/linguistic-features)
- [Processing Pipelines（处理管线）](https://spacy.io/usage/processing-pipelines)
- [Rule-based Matching（规则匹配）](https://spacy.io/usage/rule-based-matching)
- [Models（语言模型目录）](https://spacy.io/models)

## GitHub地址

- [explosion/spaCy](https://github.com/explosion/spaCy)
- [Releases（版本事实来源）](https://github.com/explosion/spaCy/releases)

## 幻灯片地址

<a href="/SlideStack/spacy-slide/" target="_blank">spaCy</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=spaCy" target="_blank" rel="noopener noreferrer">spaCy 测试题</a>
