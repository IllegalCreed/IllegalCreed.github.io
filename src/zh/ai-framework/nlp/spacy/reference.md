---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 spaCy 官方文档（spacy.io/usage + API Reference + Models 目录）+ GitHub 整理

## 速查

- **入口**：`spacy.load(name)` 加载训练管线；`spacy.blank(lang)` 创建空管线（仅 tokenizer）
- **三层对象**：`Doc`（文档）/ `Span`（连续切片）/ `Token`（单 token）
- **属性规则**：`xxx` 取 hash，`xxx_` 取可读字符串
- **管线组件**：tokenizer / tok2vec / tagger / morphologizer / parser / lemmatizer / attribute_ruler / ner / transformer
- **匹配器**：`Matcher`（token 模式）/ `PhraseMatcher`（Doc 列表）/ `EntityRuler`（规则实体）/ `SpanRuler`（规则 Span）
- **英文模型**：en_core_web_sm / md / lg / trf
- **中文模型**：zh_core_web_sm / md / trf
- **安装**：`pip install -U spacy` + `python -m spacy download &lt;model&gt;`
- **当前版本**：spaCy 3.8.x（CPython 3.7+，Linux/macOS/Windows）
- **批量**：`nlp.pipe(texts, batch_size=, n_process=)`
- **可视化**：`displacy.serve/render`（dep/ent）
- **训练**：`python -m spacy train config.cfg ...`

## 核心 API

### 加载与创建

```python
import spacy

nlp = spacy.load("en_core_web_sm")        # 加载训练管线
nlp = spacy.load("en_core_web_sm", disable=["ner"])   # 排除组件
nlp = spacy.blank("en")                   # 空管线（仅 tokenizer）

doc = nlp(text)                           # 处理文本，返回 Doc
docs = list(nlp.pipe(texts))              # 批量处理
```

### 管线控制

```python
nlp.pipe_names                            # 当前组件名列表
nlp.add_pipe("name", first=True/last=True/before="x"/after="y")
nlp.disable_pipes(["ner"])                # 返回禁用上下文管理器
nlp.select_pipes(disable=[...], enable=[...])   # 临时禁用/启用
nlp.remove_pipe("name")
```

## Doc / Span / Token 属性

### Doc

| 属性 | 含义 |
| --- | --- |
| `doc.text` | 原始字符串 |
| `doc.ents` | 命名实体列表（Span） |
| `doc.noun_chunks` | 名词短语（部分语言） |
| `doc.sents` | 句子列表（Span，需 parser） |
| `doc.vector` | 文档向量（含词向量的模型） |
| `doc.lang_` | 语言代码 |
| `len(doc)` | token 数 |

### Span

| 属性 | 含义 |
| --- | --- |
| `span.text` | 文本 |
| `span.start` / `span.end` | 起止 token 索引（左闭右开） |
| `span.label_` | 标签（实体类型等） |
| `span.ents` | 该 Span 内的实体 |
| `span.root` | 依存根 token |
| `span.vector` | Span 向量 |

### Token

| 属性（可读） | 含义 |
| --- | --- |
| `token.text` | 原文本 |
| `token.lemma_` | 词元（词形还原） |
| `token.pos_` | 通用词性（NOUN/VERB...） |
| `token.tag_` | 细粒词性（NN/VBD...） |
| `token.dep_` | 依存关系（nsubj/dobj...） |
| `token.head` | 支配词（Token） |
| `token.children` | 从属词（迭代器） |
| `token.ent_type_` | 实体类型（ORG/GPE...） |
| `token.ent_iob_` | 实体边界（B/I/O） |
| `token.morph` | 形态学特征 |
| `token.is_stop` | 是否停用词 |
| `token.like_num` | 是否数字样 |
| `token.vector` | token 向量 |

## 语言模型对照（英文）

| 模型 | 体积 | 类型 | 词向量 | 适用 |
| --- | --- | --- | --- | --- |
| `en_core_web_sm` | ~12MB | CNN 统计 | 否 | 通用、轻量、CPU |
| `en_core_web_md` | ~40MB | CNN 统计 | 是（300 维） | 需词向量 |
| `en_core_web_lg` | ~560MB | CNN 统计 | 是（300 维） | 需高质量词向量 |
| `en_core_web_trf` | ~400MB+ | Transformer | 否 | 高精度（需 GPU 更佳） |

组件构成（sm 示例）：`tok2vec` → `tagger` → `parser` → `ner` → `attribute_ruler` → `lemmatizer`。

## 匹配器 API

### Matcher

```python
from spacy.matcher import Matcher

matcher = Matcher(nlp.vocab)
pattern = [{"LOWER": "apple"}, {"POS": "NOUN", "OP": "?"}]
matcher.add("ID", [pattern], greedy="LONGEST")   # greedy 解决重叠匹配
matches = matcher(doc)
for match_id, start, end in matches:
    span = doc[start:end]   # 取匹配到的 Span
```

`greedy` 选项：`"FIRST"`（最左）/ `"LONGEST"`（最长）。

### PhraseMatcher

```python
from spacy.matcher import PhraseMatcher

matcher = PhraseMatcher(nlp.vocab, attr="LOWER")   # attr 指定匹配属性
patterns = [nlp.make_doc(t) for t in ["Apple", "Google"]]   # 用 make_doc
matcher.add("TECH", patterns)
matches = matcher(doc)
```

`attr` 常用值：`None`（精确）/ `LOWER`（忽略大小写）/ `POS`（按词性序列匹配）。

### EntityRuler（规则实体）

```python
from spacy.pipeline import EntityRuler

ruler = nlp.add_pipe("entity_ruler", before="ner")
patterns = [{"label": "ORG", "pattern": "Apple Inc"}, {"label": "GPE", "pattern": [{"LOWER": "new"}, {"LOWER": "york"}]}]
ruler.add_patterns(patterns)
```

`EntityRuler` 在 ner 之前用规则标注实体，可与统计 NER 结合。

## 常见实体类型（英文）

| 标签 | 含义 | 示例 |
| --- | --- | --- |
| `PERSON` | 人名 | "Elon Musk" |
| `ORG` | 机构/公司 | "Apple" |
| `GPE` | 地缘政治实体（国家/城市/州） | "U.K." |
| `LOC` | 非地缘政治地点 | "Mt. Everest" |
| `DATE` | 日期 | "2024" |
| `MONEY` | 金额 | "$1 billion" |
| `PRODUCT` | 产品 | "iPhone" |
| `EVENT` | 事件 | "Olympics" |
| `FAC` | 设施 | "Golden Gate Bridge" |
| `NORP` | 民族/宗教/政治团体 | "Americans" |

用 `spacy.explain("ORG")` 查任意标签含义。

## 训练命令速查

```bash
# 生成 config
python -m spacy init config config.cfg --lang en --pipeline ner --optimize accuracy

# 转换数据（JSON → .spacy）
python -m spacy convert train.json ./data --converter json

# 训练
python -m spacy train config.cfg --output ./output --paths.train ./train.spacy --paths.dev ./dev.spacy

# 评估
python -m spacy benchmark accuracy ./output/model-best ./dev.spacy
```

config.cfg 关键段：`[nlp]`（管线组件列表）/ `[components.*]`（各组件配置）/ `[training]`（优化器与超参）。

## 版本与兼容

| 版本线 | 状态 | 关键点 |
| --- | --- | --- |
| spaCy 3.8.x | 活跃主线（2026） | 持续 bug fix；config 驱动训练 |
| spaCy 3.7.x | 维护 | 引入部分新管线组件 |
| spaCy 3.x | 当前大版本 | Transformer 原生支持、基于 config 的训练、可序列化自定义组件 |

兼容性：

- **Python**：CPython 3.7+（推荐 3.9–3.12）
- **OS**：Linux / macOS（含 M1 实验性 GPU） / Windows
- **GPU**：可选 CuPy（CUDA 8.0–12.x），统计模型与 Transformer 受益
- **模型**：模型包版本需与 spaCy 主版本对齐（如 spaCy 3.8 配 en_core_web_sm@3.8.0）

## 与同类库对比

| 维度 | spaCy | NLTK | Stanford CoreNLP |
| --- | --- | --- | --- |
| 语言 | Python | Python | Java（有 Python 接口） |
| 定位 | 工业/生产 | 教学/学术 | 研究/工业 |
| 速度 | Cython 加速，快 | 纯 Python，慢 | Java，需起 server |
| 管线 | 统一对象 + add_pipe | 函数式拼接 | 服务端管线 |
| 语言模型 | 训练管线包 | 语料库 download | 内置模型 |
| Transformer | spacy-transformers | 无 | Stanza（Python） |

## 官方资源

- [spaCy 官方文档](https://spacy.io/usage)
- [Linguistic Features](https://spacy.io/usage/linguistic-features)
- [Processing Pipelines](https://spacy.io/usage/processing-pipelines)
- [Rule-based Matching](https://spacy.io/usage/rule-based-matching)
- [Models 目录](https://spacy.io/models)
- [Training](https://spacy.io/usage/training)
- [GitHub explosion/spaCy](https://github.com/explosion/spaCy)
- [Releases](https://github.com/explosion/spaCy/releases)
- [spacy-transformers](https://github.com/explosion/spacy-transformers)
