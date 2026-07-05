---
layout: doc
outline: [2, 3]
---

# 入门：定位、语法骨架与两个核心 API

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **定位**：JSON 是**语言无关的轻量级数据交换格式**，语法源自 JS 对象字面量，但只描述数据、不带行为。规范 = RFC 8259（IETF）+ ECMA-404（Ecma），二者一致。
- **一个 JSON 文本 = 一个序列化的值**；顶层可以是任意合法值（对象、数组、字符串、数值、布尔、`null`），不再限定必须是对象/数组（RFC 8259 已放宽）。
- **六种值**：对象 `{}`、数组 `[]`、字符串、数值 number、布尔 `true`/`false`、`null`。**没有** `undefined`、日期、函数、`NaN`/`Infinity`。
- **对象**：无序键值对，`{ "键": 值 }`，键**必须是双引号字符串**，`:` 分隔键值，`,` 分隔对。
- **数组**：有序值序列，`[值, 值]`，`,` 分隔。
- **字符串**：**必须双引号**（不接受单引号），支持转义 `\"` `\\` `\/` `\b` `\f` `\n` `\r` `\t` 与 `\uXXXX`。
- **数值**：十进制，**无前导零**、**无省略整数部分的 `.5`**、无十六进制、**无 `NaN`/`Infinity`**；可带负号、小数、指数（`1e10`）。
- **字面量**：`true` / `false` / `null`，**全小写**，大小写敏感。
- ⚠️ **JSON ≠ JS 对象字面量**：JSON 键必双引号、字符串必双引号、无尾逗号、无注释、无函数/`undefined`——它是 JS 字面量的**受限子集**。
- **两个核心 API**：`JSON.parse(text[, reviver])` 文本 → 值；`JSON.stringify(value[, replacer[, space]])` 值 → 文本。
- **美化输出**：`JSON.stringify(obj, null, 2)`，第三参 `space` 传缩进空格数（≤10）或缩进字符串。
- **MIME 类型**：`application/json`（不带 charset，交换默认且只用 **UTF-8**）；文件扩展名 `.json`。
- **进阶顺序**：本页 → [语法与六种值](./guide-line/syntax-and-types) → [JS 中的 JSON API](./guide-line/js-json-api) → [变体：JSON5 / JSONC / NDJSON](./guide-line/variants) → [JSON Schema](./guide-line/json-schema) → [生态与选型](./guide-line/ecosystem-and-selection) → [参考](./reference)。

## 一、JSON 是什么：定位与规范

JSON（**J**ava**S**cript **O**bject **N**otation）是一种**文本化的数据交换格式**。名字里的 JavaScript 只是历史渊源——它的语法从 JS 对象字面量提炼而来——但它本身**与语言无关**，Python、Java、Go、Rust 等几乎所有主流语言都能原生读写 JSON。

它由 Douglas Crockford 提出并推广，如今由两份权威规范共同定义：

| 规范 | 组织 | 管什么 |
| --- | --- | --- |
| **RFC 8259** | IETF | JSON 文本的交换语义、UTF-8 编码、互操作性建议、`application/json` 媒体类型 |
| **ECMA-404** | Ecma International | JSON 的**语法**（grammar）本身 |

两者互为规范性引用、明确承诺保持一致，不存在方言冲突。JSON 语法**极其稳定**，多年未变——这正是它能成为跨系统通用语的基础。

一句话心智：**一个 JSON 文本就是「一个序列化的值」**。

## 二、语法骨架：六种值

JSON 的值只有六种（RFC 8259 归为「四种基本类型 + 两种结构类型」）：

```json
{
  "string": "双引号字符串，支持 \n \t \uXXXX 转义",
  "number": 3.14,
  "integer": 42,
  "boolean": true,
  "nothing": null,
  "array": [1, 2, 3, "混合类型允许"],
  "nested": { "对象可以嵌套": true }
}
```

- **对象** `{}`：无序的键值对集合，键**必须是双引号字符串**，`:` 分隔键与值，`,` 分隔多个键值对。
- **数组** `[]`：有序的值序列，`,` 分隔，元素类型可以不同。
- **字符串**：双引号包裹的 Unicode 字符序列。
- **数值**：十进制数字（详见[语法页](./guide-line/syntax-and-types)的严格规则）。
- **布尔**：`true` / `false`。
- **`null`**：表示「空」。

::: tip 顶层可以是任意值
`{"a":1}`、`[1,2,3]`、`"hello"`、`42`、`true` 都是合法的完整 JSON 文档。早期 RFC 4627 曾要求顶层必须是对象或数组，RFC 8259 已放宽为「任意值」。
:::

## 三、JSON ≠ JavaScript 对象字面量

这是最高频的混淆点。JSON 看起来像 JS 对象字面量，实际上是它的**受限子集**：

```js
// ✅ 合法的 JavaScript 对象字面量，但 ❌ 不是合法 JSON
const obj = {
  name: "Ada",        // 键无引号 → JSON 要求双引号
  'city': 'London',   // 单引号 → JSON 只接受双引号
  age: 36,            // 尾逗号 ↓
  greet() {},         // 方法/函数 → JSON 无函数
  score: .5,          // 省略整数部分 → JSON 需写 0.5
  // 这是注释          // JSON 无注释
};

// ✅ 对应的合法 JSON
{ "name": "Ada", "city": "London", "age": 36, "score": 0.5 }
```

| 维度 | JSON | JavaScript 对象字面量 |
| --- | --- | --- |
| 对象键 | 必须双引号字符串 | 可无引号标识符 / 单引号 / 计算属性 |
| 字符串引号 | 只能双引号 | 单引号 / 双引号 / 反引号均可 |
| 尾逗号 | ❌ 禁止 | ✅ 允许 |
| 注释 | ❌ 无 | ✅ `//` `/* */` |
| 函数 / 方法 | ❌ 不是合法值 | ✅ 允许 |
| `undefined` / `NaN` / `Infinity` | ❌ 不允许 | ✅ 允许 |
| 数字 `.5` / `0xFF` / 前导零 | ❌ 不允许 | ✅ 允许 |

## 四、两个核心 API

在 JavaScript / Node.js 里，全局对象 `JSON` 提供两个方法，覆盖绝大多数日常需求：

```js
// 1) 序列化：JS 值 → JSON 文本（发请求、存储前）
const text = JSON.stringify({ name: "Ada", age: 36 });
// '{"name":"Ada","age":36}'

// 2) 美化输出：第三参 space 控制缩进
JSON.stringify({ name: "Ada" }, null, 2);
// '{\n  "name": "Ada"\n}'

// 3) 解析：JSON 文本 → JS 值（收到响应后）
const obj = JSON.parse('{"name":"Ada","age":36}');
// { name: 'Ada', age: 36 }
```

- `JSON.stringify(value, replacer?, space?)`：`replacer` 可过滤/转换字段，`space` 美化缩进。
- `JSON.parse(text, reviver?)`：`reviver` 可在解析时转换值（如把日期字符串还原成 `Date`）。

⚠️ 这两个 API 有一批「坑」——`undefined`/函数被丢弃、循环引用抛错、`Date` 变字符串、大整数丢精度、`BigInt` 抛错——它们是面试与实战的高频雷区，详见 [JS 中的 JSON API](./guide-line/js-json-api) 一页。

## 五、典型应用场景

- **API 数据交换**：REST 请求/响应体，`Content-Type: application/json`。
- **配置文件**：`package.json`、`.eslintrc.json`；带注释需求则用 JSONC（`tsconfig.json`、VS Code `settings.json`）。
- **前端存储**：`localStorage.setItem('k', JSON.stringify(obj))`。
- **日志 / 流式**：每行一条记录用 NDJSON（`.jsonl`），适合大数据集与 Unix 管道。
- **结构校验**：用 JSON Schema 描述并校验数据契约（配合 Ajv）。

---

打好地基后，下一步进入 [语法与六种值](./guide-line/syntax-and-types)：逐条拆解字符串转义、`\u` 与代理对、数字的严格规则、编码与 BOM、重复键等规范细节。
