---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 spaCy 官方文档（spacy.io/usage + Linguistic Features + Pipelines）编写，对照 spaCy 3.8.x 当前行为

## 速查

- **安装**：`pip install -U spacy`（GPU 加速可选 `spacy[cuda-autodetect]`，Transformer 用 `spacy[transformers]`）
- **加载模型**：`nlp = spacy.load("en_core_web_sm")`，模型本身是 Python 包，`python -m spacy download en_core_web_sm`
- **核心调用**：`doc = nlp(text)` 一次跑完整管线，得到带全套标注的 `Doc`
- **三层对象**：`Doc`（整篇）→ `Span`（连续切片，如实体）→ `Token`（单个词）
- **属性后缀规则**：`token.pos` 是 hash、`token.pos_` 是可读字符串（「NOUN」），凡是可读都用下划线
- **默认管线**：tokenizer（不可替换）→ tagger → morphologizer → parser → lemmatizer → ner
- **访问标注**：`token.pos_`（词性）/ `token.dep_`（依存关系）/ `token.lemma_`（词元）/ `doc.ents`（实体列表）
- **规则匹配**：`Matcher` 用 token 模式（`LOWER`/`POS`/`IS_DIGIT`/`OP`），`PhraseMatcher` 用 `Doc` 列表匹配大词表
- **英文模型**：`en_core_web_sm/md/lg`（统计）+ `en_core_web_trf`（Transformer），中文 `zh_core_web_sm/md/trf`
- **禁用组件提速**：`nlp = spacy.load(..., disable=["ner"])` 或 `nlp.select_pipes(disable=[...])` 临时禁用
- **批量处理**：`docs = list(nlp.pipe(texts))` 比循环 `nlp(text)` 快得多（支持 `n_process` 多进程）
- **当前版本**：spaCy 3.8.x（CPython 3.7+，Linux/macOS/Windows）

## 安装

```bash
# ① 安装库本身
pip install -U spacy

# ② 下载训练好的语言模型（模型是独立的 Python 包）
python -m spacy download en_core_web_sm   # 英文小模型（~12MB）
python -m spacy download en_core_web_lg   # 英文大模型（含词向量）
python -m spacy download zh_core_web_sm   # 中文小模型
```

GPU 加速与 Transformer 可选装：

```bash
pip install "spacy[cuda-autodetect]"   # CUDA 加速（统计模型受益）
pip install "spacy[transformers]"      # 接入 Transformer 管线（en_core_web_trf）
```

```python
import spacy
print(spacy.__version__)   # 如 3.8.x
```

## 第一个例子：处理一段文本

最小可用流程——加载模型、处理文本、遍历标注：

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple is looking at buying a U.K. startup for $1 billion.")

# ① 词性 + 词形还原
for token in doc:
    print(token.text, token.lemma_, token.pos_, token.dep_)
# Apple Apple PROPN nsubj
# is be AUX aux
# ...

# ② 命名实体
for ent in doc.ents:
    print(ent.text, ent.label_)
# Apple ORG
# U.K. GPE
# $1 billion MONEY
```

> **铁律**：`nlp(text)` 是入口，返回的 `Doc` 已经带好全套标注。不要自己分词再喂给 spaCy——tokenizer 是管线的固定第一步。

## 三层核心对象：Doc / Span / Token

```python
doc = nlp("I like red apples")

# Token：单个词，最细粒度
token = doc[3]          # apples
token.text              # 'apples'
token.lemma_            # 'apple'
token.pos_              # 'NOUN'

# Span：连续的 token 切片（实体、名词短语都是 Span）
span = doc[2:4]         # "red apples"（左闭右开，和 Python 切片一致）
span.text               # 'red apples'

# Doc：整篇文档，token 序列容器
len(doc)                # 4（token 数）
doc.text                # 原始字符串
doc.ents                # 实体列表（每个是 Span）
```

### 属性后缀规则（关键）

spaCy 把字符串编码成 hash 存储以省内存。取值规则：

| 写法 | 返回 | 示例 |
| --- | --- | --- |
| `token.pos` | hash（int） | `95` |
| `token.pos_` | 可读字符串 | `'NOUN'` |
| `token.dep` | hash | `429` |
| `token.dep_` | 可读字符串 | `'nsubj'` |
| `token.lemma` | hash | `...` |
| `token.lemma_` | 可读字符串 | `'apple'` |

> **铁律**：凡是要给人看的可读值，**末尾加下划线**。忘加下划线拿到的是一串 hash 整数，是新手第一坑。

## 处理管线（Pipeline）

`nlp(text)` 实际做的事：先 tokenize 生成 `Doc`，再让 `Doc` 依次流过每个管线组件，每个组件读 `Doc`、写标注、返回 `Doc`。

```python
nlp = spacy.load("en_core_web_sm")
print(nlp.pipe_names)
# ['tok2vec', 'tagger', 'parser', 'ner', 'attribute_ruler', 'lemmatizer']
```

注意 tokenizer 不在 `pipe_names` 里——它是管线的固定第一步，不可替换。

### 查看与控制管线

```python
# 查看管线组件名
nlp.pipe_names          # 当前组件列表

# 禁用组件（加载时排除，提速）
nlp = spacy.load("en_core_web_sm", disable=["ner"])

# 临时禁用（用完恢复）
with nlp.select_pipes(disable=["parser", "ner"]):
    doc = nlp(text)     # 这次只跑 tagger + lemmatizer

# 添加自定义组件
nlp.add_pipe("my_component", last=True)
```

## 词性标注与依存句法

```python
doc = nlp("Autonomous cars shift insurance liability toward manufacturers")

# 词性（POS）：token.pos_ 是通用词性（NOUN/VERB/ADJ...）
for token in doc:
    print(f"{token.text:<15} {token.pos_:<8} {token.dep_:<12} head={token.head.text}")

# 依存（dependency）：token.dep_ 是依存关系（nsubj/dobj/prep...），token.head 是支配词
```

依存树可视化（jupyter 内）：

```python
from spacy import displacy
displacy.render(doc, style="dep", options={"compact": True})
```

## 命名实体识别（NER）

```python
doc = nlp("San Francisco considers banning sidewalk delivery robots")

for ent in doc.ents:
    print(ent.text, ent.start, ent.end, ent.label_)
# San Francisco 0 2 GPE

# 实体类型可读化
spacy.explain("GPE")    # 'Countries, cities, states'
```

常见英文实体类型：`PERSON`（人名）/ `ORG`（机构）/ `GPE`（地缘政治实体：国家/城市/州）/ `DATE`（日期）/ `MONEY`（金额）/ `PRODUCT`（产品）。

## 词形还原（Lemmatizer）

```python
doc = nlp("I was reading the papers")
for token in doc:
    print(token.text, token.lemma_)
# I I
# was be
# reading read
# papers paper
```

`lemmatizer` 用规则 + 字典查表，比 NLTK 的 WordNetLemmatizer 更依赖管线上下文（POS 标注）。

## 规则匹配：Matcher 与 PhraseMatcher

### Matcher：基于 token 属性的模式

```python
from spacy.matcher import Matcher

nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)

# 模式：每个 dict 描述一个 token
pattern = [{"LOWER": "hello"}, {"IS_PUNCT": True, "OP": "?"}, {"LOWER": "world"}]
matcher.add("HelloWorld", [pattern])

doc = nlp("Hello, world! Hello world.")
matches = matcher(doc)
for match_id, start, end in matches:
    print(doc[start:end].text)
```

常用 token 属性键（大写）：`LOWER`（小写文本）/ `TEXT`（原文本）/ `POS`（词性）/ `IS_DIGIT`（是否数字）/ `IS_PUNCT`（是否标点）/ `ENT_TYPE`（实体类型）/ `OP`（量词 `?`/`+`/`*`/`!`）。

### PhraseMatcher：匹配大术语表

```python
from spacy.matcher import PhraseMatcher

matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
patterns = [nlp.make_doc("Apple"), nlp.make_doc("Google")]   # 用 make_doc 省 pipeline
matcher.add("TECH", patterns)

doc = nlp("I prefer apple over GOOGLE")
matches = matcher(doc)   # 匹配到 "apple" 和 "GOOGLE"（attr=LOWER 忽略大小写）
```

> **铁律**：PhraseMatcher 的模式用 `nlp.make_doc(text)` 生成（只 tokenize 不跑全管线），不要用 `nlp(text)`，否则慢几十倍。

## 批量处理

```python
texts = ["First document.", "Second document.", ...]
# 推荐：nlp.pipe 一次批处理，比 [nlp(t) for t in texts] 快得多
docs = list(nlp.pipe(texts, batch_size=100, n_process=4))   # n_process 多进程
```

## 下一步

- 入门后请读 **指南**：自定义管线组件、spacy-transformers 集成、训练自定义 NER、Matcher 模式进阶、displacy 可视化
- 推理跑通后看 **参考**：管线组件速查、Token/Doc 全属性表、语言模型对照、与 NLTK 对比
- 想做领域实体识别，参考 spacy train 训练流程与 Prodigy 标注工具
