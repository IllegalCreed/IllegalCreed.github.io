---
layout: doc
outline: [2, 3]
---

# 类型、Schema 与著名的坑

> 基于 YAML 1.2.2 · 核于 2026-07

## 速查

- **隐式类型推断**：不加引号的标量按 **schema 的正则**推断类型（null/bool/int/float/str），这是 YAML 灵活也是坑多的根源。
- **三种推荐 schema**（由窄到宽）：Failsafe（仅 map/seq/str）⊂ JSON（加 null/bool/int/float）⊂ **Core**（放宽正则，最常用默认）。
- **Core schema 布尔**：**只认** `true`/`True`/`TRUE`/`false`/`False`/`FALSE`；`yes`/`no`/`on`/`off` 是**字符串**。
- **Core schema null**：`null`/`Null`/`NULL`/`~`/空值。
- **Core schema 八进制**：`0o` 前缀（如 `0o10`=8）；十六进制 `0x`；`010` 是**十进制 10**（非八进制）。
- **Norway problem**：YAML 1.1 把 `no`/`yes`/`on`/`off` 当布尔，导致挪威代码 `NO`→false；解法是加引号 `"NO"`。
- **1.1 vs 1.2 差异**：布尔（1.1 认 yes/no）、八进制（1.1 用前导零 `010`=8，1.2 用 `0o`）——同一份 YAML 数值/类型可能不同。
- **解析器默认不一**：**js-yaml 默认 1.2 core**（`no`→字符串）；**PyYAML 默认近 1.1**（`no`→False）——跨语言协作要警惕。
- **形似其他类型的字符串**（版本号 `1.20`、邮编 `010010`、日期、`NO`、大整数）**务必加引号**，否则被隐式转换损坏。
- **安全加载**：PyYAML 用 `safe_load`（`yaml.load` 会实例化任意对象、有 RCE 风险）；不受信输入一律走安全接口。

## 一、隐式类型推断与三种 schema

YAML 对**不加引号的标量**做隐式类型推断——`42` 变整数、`true` 变布尔、`~` 变 null。具体哪些写法被识别成什么类型，取决于解析用的 **schema**（一组标签解析规则）。YAML 1.2 推荐了三种，识别的类型由少到多：

| schema | 识别的类型 | 说明 |
| --- | --- | --- |
| **Failsafe** | map / seq / **str** | 最保守，任何标量都当字符串，保证绝不误判 |
| **JSON** | 加 null / bool / int / float | 与 JSON 数据模型对齐，正则严格（对应 JSON 字面量） |
| **Core** | 同上但**放宽正则** | 最常用的默认 schema，识别更多写法（`~`、`0o`、`.inf` 等） |

同一个值在不同 schema 下结果可能不同。例如 `.5` 和 `TRUE`：在 **JSON schema** 下不匹配其严格正则、退化为**字符串**；在 **Core schema** 下分别匹配浮点/布尔、解析为 `float` / `bool`。选哪个 schema 直接改变解析结果。

## 二、Core schema 的类型正则（要点）

YAML 1.2.2 Core schema 的标签解析规则（简化版）：

| 类型 | 匹配（Core schema） | 例 |
| --- | --- | --- |
| null | `null \| Null \| NULL \| ~`，或空 | `~`、`null`、（留空） |
| bool | `true \| True \| TRUE \| false \| False \| FALSE` | `true`、`FALSE` |
| int（十进制） | `[-+]? [0-9]+` | `42`、`-7` |
| int（八进制） | `0o [0-7]+` | `0o10`（=8） |
| int（十六进制） | `0x [0-9a-fA-F]+` | `0xFF`（=255） |
| float | `[-+]? ( \. [0-9]+ \| [0-9]+ ( \. [0-9]* )? ) ( [eE] [-+]? [0-9]+ )?` | `3.14`、`.5`、`6e23` |
| float（无穷/NaN） | `[-+]? ( \.inf \| \.Inf \| \.INF )`、`\.nan \| \.NaN \| \.NAN` | `.inf`、`.nan` |
| str（默认） | 以上都不匹配时 | `hello`、`no`、`2026-07-05` |

关键结论：**Core schema 里 `yes`/`no`/`on`/`off` 都不匹配 bool，是字符串**；`010` 匹配的是十进制 int 正则（=10），不是八进制（八进制要写 `0o10`）。

## 三、Norway problem：最著名的坑

运维想在配置里列国家代码，写了 `- NO`（挪威 Norway），结果在某些解析器里 `NO` 变成了布尔 `false`——这就是著名的 **Norway problem（挪威问题）**：

```yaml
countries:
  - GB   # 英国 → 字符串 "GB"
  - NO   # 挪威 → 在 YAML 1.1 里被当布尔 false！
  - SE   # 瑞典 → 字符串 "SE"
```

根源是 **YAML 1.1** 把 `y/yes/n/no/on/off/true/false`（不分大小写）都当布尔，所以 `NO`→false。**YAML 1.2 core schema 已收紧**，只认 `true`/`false`，`NO` 是字符串。但很多解析器（尤其 PyYAML）默认仍沿用 1.1 行为，这个坑至今存在。**解法：给值加引号 `"NO"`**，强制成字符串。

同类的隐式转换坑还有一批：

```yaml
version: 1.20        # ❌ 被当浮点 → 1.2（尾零丢失，版本号被破坏）
zip: 010010          # ❌ 被当数字 → 前导零丢失 / 八进制误判
port: "8080"         # 想要字符串端口就要加引号
date: 2026-07-05     # 可能被当时间戳类型，而非字符串
enabled: yes         # ❌ 1.1 里是布尔 true；想要字符串要加引号
```

一条经验：**凡是「看着像别的类型、但语义上是字符串」的值（版本号、邮编、电话、国家/货币代码、纯数字 ID、日期字符串），一律加引号**，或用 `!!str` 显式标签锁定。

## 四、1.1 vs 1.2 版本差异

YAML 1.1（2005）与 1.2（2009，1.2.2 为 2021 修订）在类型解析上有几处关键差异，是「同一份 YAML 不同结果」的根源：

| 写法 | YAML 1.1 | YAML 1.2 core |
| --- | --- | --- |
| `no` / `yes` / `on` / `off` | 布尔 | **字符串** |
| `010`（前导零） | 八进制 → **8** | 十进制 → **10** |
| 八进制正确写法 | `010` | `0o10` |
| `~` / `null` | null | null（一致） |
| `true` / `false` | 布尔 | 布尔（一致） |

所以 `mode: 010` 在 1.1 里是 8、在 1.2 core 里是 10——处理文件权限这类场景时是个隐蔽的数值坑。

## 五、解析器默认不一致：跨语言协作的暗礁

即便同一份 YAML，不同语言的库因**默认 schema/版本不同**，结果可能不一样：

| 解析器 | 默认行为 | `debug: no` 的结果 |
| --- | --- | --- |
| **js-yaml**（JS） | 默认 core schema（≈1.2） | 字符串 `"no"` |
| **PyYAML**（Python） | `safe_load` 默认近 1.1 | 布尔 `False` |
| **ruamel.yaml**（Python） | 默认 1.2（可切 1.1） | 字符串 `"no"` |

跨语言传 YAML（比如前端 js-yaml 写、后端 PyYAML 读）时，一个没加引号的 `no` 就可能一边是字符串、一边是布尔，引发难查的 bug。**统一约定「布尔只写 `true`/`false`，其余一律加引号」是最省心的团队规约。**

## 六、安全：别用全功能加载器解析不受信数据

某些语言的「全功能」YAML 加载器会根据标签**实例化任意对象**，解析不受信的 YAML 会有远程代码执行（RCE）风险。最典型的是 Python 的 PyYAML：

```python
import yaml

# ❌ 危险：yaml.load 可实例化任意对象（历史上有 RCE 利用）
data = yaml.load(untrusted_text, Loader=yaml.FullLoader)

# ✅ 安全：只解析基本类型，不实例化任意对象
data = yaml.safe_load(untrusted_text)
```

原则：**解析任何来源不完全可信的 YAML，一律用安全接口**（PyYAML 的 `safe_load`、其他库的等价安全加载器）。这与「YAML 表达力强」是一体两面——能力越大，越要收敛攻击面。

---

至此 YAML 的核心语法、结构、复用与坑都过了一遍。速查与完整对照表见 [参考](../reference)。
