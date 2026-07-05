---
layout: doc
outline: [2, 3]
---

# 参考：JSON 速查与对照表

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **规范**：RFC 8259（IETF，交换语义/UTF-8/互操作）+ ECMA-404（Ecma，语法），一致互引，语法极稳定。
- **六种值**：对象 `{}`、数组 `[]`、字符串、数值、布尔、`null`。无 `undefined`/日期/函数/`NaN`/`Infinity`。
- **结构字符**：`[ ] { } : ,`；顶层可为任意值；键必双引号；无注释、无尾逗号。
- **转义**：`\"` `\\` `\/` `\b` `\f` `\n` `\r` `\t` `\uXXXX`；BMP 外用代理对。
- **数字**：无前导零、整数部分不可省、无十六进制、无 `NaN`/`Infinity`；安全整数 ±(2^53−1)。
- **编码**：UTF-8 强制；MUST NOT 加 BOM。MIME `application/json`，扩展名 `.json`。
- **JS API**：`JSON.parse(text, reviver?)` / `JSON.stringify(value, replacer?, space?)`。
- **变体**：JSON5（人写超集）/ JSONC（注释+尾逗号，tsconfig）/ NDJSON（每行一值，`.jsonl`）。
- **Schema**：当前 draft 2020-12；`$schema`/`type`/`properties`/`required`/`$ref`/`$defs`/`prefixItems`；Ajv 2020-12 用 `ajv/dist/2020`。

## 一、六种值与语法速查

| 值类型 | 示例 | 说明 |
| --- | --- | --- |
| 对象 | `{"k": 1}` | 无序键值对，键必双引号，`SHOULD` 唯一 |
| 数组 | `[1, "a", true]` | 有序，元素可异构 |
| 字符串 | `"hi\n"` | 双引号，支持转义 |
| 数值 | `-3.14`、`6e23` | 十进制，无前导零/`NaN`/`Infinity` |
| 布尔 | `true` / `false` | 全小写 |
| 空 | `null` | 全小写 |

## 二、字符串转义速查

| 转义 | 含义 | | 转义 | 含义 |
| --- | --- | --- | --- | --- |
| `\"` | 双引号 | | `\n` | 换行 |
| `\\` | 反斜杠 | | `\r` | 回车 |
| `\/` | 斜杠（可选） | | `\t` | 制表 |
| `\b` | 退格 | | `\f` | 换页 |
| `\uXXXX` | 四位十六进制码元 | | `😀` | 代理对（BMP 外，如 😀） |

> 控制字符 U+0000–U+001F 必须转义，不能裸出现。

## 三、数字合法性对照

| 写法 | 合法? | 原因 |
| --- | --- | --- |
| `0` `-1` `3.14` `-0.5` `6.022e23` `1E-10` | ✅ | 标准十进制/指数 |
| `007` | ❌ | 前导零 |
| `.5` | ❌ | 整数部分不可省 |
| `5.` | ❌ | 小数点后须有数字 |
| `0xFF` | ❌ | 无十六进制 |
| `+1` | ❌ | 无显式正号 |
| `NaN` `Infinity` | ❌ | 无法用数字语法表示 |

## 四、JSON.stringify 行为速查

| 值 | 对象属性里 | 数组元素里 | 作为顶层值 |
| --- | --- | --- | --- |
| `undefined` / 函数 / Symbol | **忽略该属性** | 转 **`null`** | 返回**值 `undefined`** |
| `NaN` / `Infinity` | 转 `null` | 转 `null` | `"null"` |
| `BigInt` | **抛 TypeError** | 抛 TypeError | 抛 TypeError |
| 循环引用 | **抛 TypeError** | — | — |
| `Date` | ISO 字符串（经 `toJSON`） | ISO 字符串 | `"..."` |
| `-0` | `0` | `0` | `"0"` |

- 参数：`JSON.stringify(value, replacer?, space?)`
  - `replacer` = 字符串数组（键白名单）或 `(k,v)=>v`（返回 `undefined` 省略属性）
  - `space` = 缩进空格数（≤10）或缩进字符串

## 五、JSON.parse 速查

- `JSON.parse(text, reviver?)`
- `reviver(key, value)`：自底向上转换；**返回 `undefined` 删除该属性**。
- 严格：单引号 / 尾逗号 / 注释 / 无引号键 → `SyntaxError`。
- 大整数（>2^53−1）**静默丢精度**，reviver 救不回 → 用 `json-bigint` / `lossless-json` / reviver 的 `context.source`。
- `Date` 不会自动还原，需 reviver 手动 `new Date()`。

## 六、JSON vs JS 对象字面量

| 维度 | JSON | JS 对象字面量 |
| --- | --- | --- |
| 键 | 双引号字符串 | 无引号 / 单引号 / 计算属性 |
| 字符串 | 双引号 | 单 / 双 / 反引号 |
| 尾逗号 / 注释 | ❌ | ✅ |
| 函数 / `undefined` / `NaN` | ❌ | ✅ |
| 数字 `.5` / `0xFF` / 前导零 | ❌ | ✅ |

## 七、变体对照

| 格式 | 相对 JSON 增加 | 扩展名 | 典型用途 |
| --- | --- | --- | --- |
| **JSON5** | 注释、尾逗号、单引号、无引号键、十六进制、`NaN`/`Infinity` | `.json5` | 人写配置（如 Babel） |
| **JSONC** | 注释 + 尾逗号（仅此） | `.jsonc`/`.json` | tsconfig、VS Code settings |
| **NDJSON** | 每行一个独立 JSON 值 | `.jsonl` | 日志、流式、大数据集 |

> 变体均**不能**直接喂标准 `JSON.parse`：JSON5 用 `JSON5.parse`；JSONC 用容注释解析器；NDJSON **按行**逐条解析。

## 八、JSON Schema（2020-12）关键字速查

| 分组 | 关键字 |
| --- | --- |
| 声明 | `$schema` `$id` `$anchor` |
| 类型/通用 | `type` `enum` `const` |
| 数值 | `minimum` `maximum` `exclusiveMinimum` `exclusiveMaximum` `multipleOf` |
| 字符串 | `minLength` `maxLength` `pattern` `format` |
| 对象 | `properties` `required` `additionalProperties` `patternProperties` `dependentRequired` `minProperties` `maxProperties` |
| 数组 | `items` `prefixItems`（元组，2020-12） `contains` `minItems` `maxItems` `uniqueItems` |
| 组合/条件 | `allOf` `anyOf` `oneOf` `not` `if`/`then`/`else` |
| 复用/引用 | `$defs`（取代 `definitions`） `$ref` `$dynamicRef` `$dynamicAnchor` |

- **draft 顺序**：draft-04 → draft-06 → draft-07 → 2019-09 → **2020-12（当前）**
- **2020-12 URI**：`https://json-schema.org/draft/2020-12/schema`
- **Ajv 入口**：默认 = draft-07；2020-12 = `ajv/dist/2020`（`Ajv2020`）；draft-04 = `ajv-draft-04`；`format` 需 `ajv-formats`

## 九、JSON vs YAML vs TOML

| 维度 | JSON | YAML | TOML |
| --- | --- | --- | --- |
| 定位 | 数据交换 | 人写配置 | 扁平配置 |
| 注释 | ❌ | ✅ `#` | ✅ `#` |
| 与 JSON | — | YAML 1.2 是 JSON 超集 | 独立 |
| 典型坑 | 大整数精度、无注释 | 缩进敏感、Norway 问题 | 深嵌套冗长 |
| 代表 | `package.json`、API | K8s、GitHub Actions | `Cargo.toml`、`pyproject.toml` |

## 十、常见错误对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `SyntaxError` in JSON | 单引号/尾逗号/注释/无引号键 | 改标准 JSON，或用 JSON5/JSONC |
| 大整数变了值 | 超过 2^53−1 精度丢失 | 字符串承载 / `json-bigint` |
| `Date` 变字符串 | JSON 无日期类型 | reviver 里 `new Date()` |
| `TypeError: circular` | 循环引用 | 去环 / `flatted` |
| `TypeError: BigInt` | `stringify` 不支持 BigInt | 先 `toString()` / replacer |
| 字段莫名丢失 | `undefined`/函数属性被忽略 | 序列化前转换 |
| 首键前有怪字符 | 文件带 BOM | 去掉 UTF-8 BOM |
| Ajv 不识别 `prefixItems` | 用了 draft-07 默认入口 | 换 `ajv/dist/2020` |

## 十一、权威链接

- [json.org 官方站](https://www.json.org/json-en.html) —— 语法图与多语言实现
- [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) —— IETF 权威规范
- [ECMA-404](https://ecma-international.org/publications-and-standards/standards/ecma-404/) —— 语法规范
- [JSON Schema](https://json-schema.org/) ｜ [Specification](https://json-schema.org/specification) —— draft 2020-12
- [Ajv](https://ajv.js.org/) —— JS 校验器
- [JSON5](https://json5.org/) ｜ [json5/json5](https://github.com/json5/json5)
- [JSON Lines / NDJSON](https://jsonlines.org/)
- [MDN: JSON](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON) —— `JSON.parse`/`stringify` API
