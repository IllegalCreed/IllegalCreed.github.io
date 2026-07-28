---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 spaCy 官方文档（spacy.io/usage Pipelines / Linguistic Features / Rule-based Matching / Training）+ GitHub README 编写

## 速查

- **管线组件**：tokenizer（固定）→ tok2vec → tagger → morphologizer → parser → lemmatizer → attribute_ruler → ner
- **组件工厂**：`@Language.component("name")` 注册无状态组件；`@Language.factory("name")` 注册带配置组件
- **添加位置**：`nlp.add_pipe("name", first=True/last=True/before="x"/after="y")`
- **禁用/排除**：`disable`（加载时排除）、`select_pipes`（临时禁用）、`nlp.pipe(disable=[...])`（单次禁用）
- **Transformer 管线**：`spacy-transformers` 提供 `Transformer` 组件，下游共享其输出
- **NER 实体**：`doc.ents`（Span 列表），`ent.label_`（类型）、`ent.start/end`（token 位置）
- **依存句法**：`token.dep_`（关系）、`token.head`（支配词）、`token.children`（从属词）
- **名词短语**：`doc.noun_chunks`（英文等语言提供）
- **Matcher 量词**：`OP` 取 `?`（0/1）、`+`（≥1）、`*`（≥0）、`!`（否定匹配 1 次）
- **训练**：`spacy train config.cfg --output ./output`，config 描述管线结构与超参
- **可视化**：`displacy.serve/render`（dep 依存树、ent 实体高亮）
- **性能**：`nlp.pipe(texts, batch_size=, n_process=)` 批量多进程，`disable` 跳过无用组件

## 自定义管线组件

### 无状态组件：@Language.component

```python
from spacy.language import Language

@Language.component("print_length")
def print_length(doc):
    print(f"Doc length: {len(doc)}")
    return doc   # 必须返回 Doc

nlp = spacy.load("en_core_web_sm")
nlp.add_pipe("print_length", last=True)
doc = nlp("Hello world")   # 打印 Doc length: 2
```

> **铁律**：组件函数必须接收 `Doc`、返回 `Doc`。在 `Doc` 上写标注（如 `doc.ents` / `token._.custom`），不要返回新对象。

### 带配置组件：@Language.factory

```python
@Language.factory("custom_entity")
class CustomEntity:
    def __init__(self, nlp, name, entity_list):
        self.entity_list = entity_list
    def __call__(self, doc):
        # 在 doc 上添加实体...
        return doc

nlp.add_pipe("custom_entity", config={"entity_list": ["Apple", "Google"]})
```

## 禁用与排除组件

```python
# ① 加载时排除（组件根本不进管线）
nlp = spacy.load("en_core_web_sm", exclude=["ner"])

# ② 临时禁用（用上下文恢复）
with nlp.select_pipes(disable=["parser", "ner"]):
    doc = nlp(text)   # 只跑 tagger + lemmatizer，快很多

# ③ 单次调用禁用
docs = list(nlp.pipe(texts, disable=["parser"]))
```

何时禁用：只需分词 + 词性时禁 parser/ner；只需 NER 时禁 parser（parser 是较重组件）。

## spacy-transformers 集成

`en_core_web_trf`（英文）/ `zh_core_web_trf`（中文）是 Transformer 管线，把 RoBERTa/BERT 等作为 `Transformer` 组件，下游 tagger/parser/ner 共享其上下文向量：

```bash
pip install "spacy[transformers]"
python -m spacy download en_core_web_trf
```

```python
nlp = spacy.load("en_core_web_trf")
doc = nlp("Apple bought a startup")
# Transformer 组件为每个 token 生成上下文向量，下游组件精度通常优于 sm/lg
```

- **统计模型（sm/md/lg）**：CNN 架构，快、轻；md/lg 含词向量
- **Transformer 模型（trf）**：精度更高但慢、占资源大，适合对精度要求高的场景
- 自定义训练 Transformer 管线时，config.cfg 的 `[components.transformer]` 指定 HuggingFace 模型名

## 训练自定义管线

核心命令行流程（用 config 驱动）：

```bash
# ① 生成初始 config（如训练 NER）
python -m spacy init config config.cfg --lang en --pipeline ner --optimize accuracy

# ② 准备训练数据（.spacy 格式，含实体标注）

# ③ 训练
python -m spacy train config.cfg --output ./output --paths.train ./train.spacy --paths.dev ./dev.spacy

# ④ 用训练好的模型
nlp = spacy.load("./output/model-best")
```

config.cfg 描述管线结构、优化器、超参，是 spaCy 训练的单一事实来源。

## Matcher 模式进阶

### token 属性键全表（大写）

| 键 | 含义 | 示例值 |
| --- | --- | --- |
| `ORTH` / `TEXT` | 原文本精确匹配 | `"Apple"` |
| `LOWER` | 小写文本 | `"apple"` |
| `LENGTH` | token 字符长度 | `5` |
| `IS_ALPHA` / `IS_DIGIT` | 是否字母 / 数字 | `True` |
| `IS_PUNCT` / `IS_SPACE` | 是否标点 / 空白 | `True` |
| `POS` | 通用词性 | `"NOUN"` |
| `TAG` | 细粒词性 | `"NN"` |
| `DEP` | 依存关系 | `"nsubj"` |
| `ENT_TYPE` | 实体类型 | `"ORG"` |

### OP 量词

| OP | 含义 | 等价正则 |
| --- | --- | --- |
| `!` | 否定，匹配 0 次 | 取反 |
| `?` | 0 次或 1 次 | `?` |
| `+` | 1 次或多次 | `+` |
| `*` | 0 次或多次 | `*` |

```python
# 匹配「数字-数字」（如 10-20），用 IS_DIGIT + OP
pattern = [{"IS_DIGIT": True}, {"TEXT": "-"}, {"IS_DIGIT": True}]
# 匹配「可选的形容词 + 名词」
pattern = [{"POS": "ADJ", "OP": "*"}, {"POS": "NOUN"}]
```

## 名词短语与句子切分

```python
doc = nlp("The quick brown fox jumps over the lazy dog")

# 名词短语（英文等语言）
for chunk in doc.noun_chunks:
    print(chunk.text)
# The quick brown fox / the lazy dog

# 句子切分（由 parser 设置句子边界）
for sent in doc.sents:
    print(sent.text)
```

## displacy 可视化

```python
from spacy import displacy

doc = nlp("Apple bought a U.K. startup for $1 billion")

# 实体高亮（在 Jupyter 直接 render；脚本用 serve 起服务）
displacy.render(doc, style="ent", jupyter=True)

# 依存树
displacy.render(doc, style="dep", jupyter=True, options={"compact": True})
```

## 中文处理

```python
nlp = spacy.load("zh_core_web_sm")
doc = nlp("我爱北京天安门")

for token in doc:
    print(token.text, token.pos_)
# 我 PRON / 爱 VERB / 北京 PROPN / 天安门 PROPN

for ent in doc.ents:
    print(ent.text, ent.label_)   # 北京 GPE / 天安门 FAC
```

中文 tokenizer 需处理分词（模型内置），精度依赖训练数据，复杂文本（如古文/混合语种）效果会打折。

## 与 NLTK 对比

| 维度 | spaCy | NLTK |
| --- | --- | --- |
| 定位 | 工业/生产 | 教学/学术 |
| 调用风格 | 管线 + 对象（`nlp(text)`） | 函数式（`word_tokenize`/`pos_tag`） |
| 速度 | Cython 加速，快 | 纯 Python，慢 |
| 标注一次完成 | 是（管线输出全套） | 否（每个函数单独调） |
| 语言模型 | 训练好的管线包（Python 包安装） | 语料库（`nltk.download`） |
| 词形还原 | 上下文相关（用管线 POS） | WordNetLemmatizer 需手动传 pos |
| Transformer | spacy-transformers 原生集成 | 无 |
| 适合场景 | 生产 NLP、信息抽取 | 教学、算法原型、语料分析 |

## 陷阱与最佳实践

- **忘加下划线取属性**：`token.pos` 给 hash，`token.pos_` 给字符串；可读值一律下划线
- **自己分词再喂 spaCy**：tokenizer 是固定第一步，直接传 `nlp(text)`，别预先 split
- **PhraseMatcher 用 `nlp()` 当模式**：用 `nlp.make_doc` 只分词，跑全管线慢几十倍
- **循环 `nlp(t)` 而非 `nlp.pipe`**：批处理用 `nlp.pipe`，可快数倍且支持多进程
- **加载大模型跑简单任务**：只需分词可用 `spacy.blank("en")`（空管线），不必加载 sm/lg
- **训练后忘留 config**：config.cfg 是复现训练的钥匙，务必随模型一起保存
- **中文实体类型照搬英文**：中文模型实体标签集与英文不同，按 `spacy.explain` 核对
