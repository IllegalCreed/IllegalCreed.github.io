---
layout: doc
outline: [2, 3]
---

# 变体家族：JSON5 / JSONC / NDJSON

> 基于 RFC 8259 / ECMA-404 · JSON Schema 2020-12 · 核于 2026-07

## 速查

- **为什么有变体**：标准 JSON 无注释、无尾逗号、必须双引号——**做机器交换很好，做人写配置/流式日志就别扭**。变体各自补一块短板。
- **JSON5**：面向**人写手改**的 JSON 超集。加：注释（`//` `/* */`）、尾逗号、单引号、无引号键、多行字符串、十六进制、前导/尾随小数点、`Infinity`/`NaN`、显式 `+`。扩展名 `.json5`，参考实现是 `json5` npm 包（`JSON5.parse`/`JSON5.stringify`）。
- **JSONC**（JSON with Comments）：微软 VS Code 生态约定，**只加注释 + 尾逗号**，比 JSON5 保守。用于 `tsconfig.json`、VS Code `settings.json`、`.vscode/*.json`。**非正式规范**。
- **NDJSON / JSON Lines**：**每行一个独立的合法 JSON 值**，`\n` 分隔，UTF-8、不加 BOM，尾部换行可选。扩展名 `.jsonl`，MIME `application/jsonl`（待定）。用于**日志、流式、大数据集、Unix 管道**。
- **选谁**：手写配置想要注释/宽松 → JSON5；跟随 TS/VS Code 生态 → JSONC；逐行流式/超大数据集 → NDJSON；**对外 API 交换** → 老老实实用**标准 JSON**（变体互操作性差）。
- ⚠️ 变体**不能**直接喂给标准 `JSON.parse`——JSON5 要 `JSON5.parse`，JSONC 要能容注释的解析器，NDJSON 要**按行**逐条 `JSON.parse`。

## 一、为什么需要变体

标准 JSON 的克制（无注释、无尾逗号、双引号、严格数字）对**机器间交换**是优点，但落到两类场景就难受：

1. **人写配置文件**：想加注释说明、改动时不想为尾逗号纠结、想用单引号——催生了 **JSON5** 和 **JSONC**。
2. **流式 / 超大数据**：一个几 GB 的 JSON 数组必须整体读入内存才能解析——催生了**按行独立**的 **NDJSON**。

## 二、JSON5：给人写的 JSON

[JSON5](https://json5.org/) 是「面向人类手写」的 JSON 超集，向 ES5 语法靠拢。它在标准 JSON 上额外支持：

```json5
{
  // 单行注释，也支持 /* 多行注释 */
  unquoted: "键可以不加引号（ES5 标识符）",
  singleQuotes: '字符串可用单引号',
  trailingComma: [1, 2, 3,],   // 尾逗号 OK
  hex: 0xdecaf,                 // 十六进制数字
  leadingDecimalPoint: .8675,   // 前导小数点
  andTrailing: 8675.,           // 尾随小数点
  positiveSign: +1,             // 显式正号
  notANumber: NaN,              // Infinity / NaN 允许
  multiLine: "用反斜杠续行 \
可跨多行",
}
```

| 能力 | 标准 JSON | JSON5 |
| --- | --- | --- |
| 注释 | ❌ | ✅ `//` `/* */` |
| 尾逗号 | ❌ | ✅ |
| 单引号 / 无引号键 | ❌ | ✅ |
| 十六进制 / 前导小数点 / `+` | ❌ | ✅ |
| `Infinity` / `NaN` | ❌ | ✅ |

用法上，它自带一个 `JSON5` 对象（`json5` npm 包），API 对齐原生：

```js
import JSON5 from "json5";
JSON5.parse("{ a: 1, /* 注释 */ b: 'x', }"); // { a: 1, b: 'x' }
JSON5.stringify({ a: 1 });
```

**适用**：Babel 配置、需要大量注释的复杂配置文件。**注意**：JSON5 仍**不支持**函数、循环引用——它只放宽语法，不改数据模型。

## 三、JSONC：只多了注释的 JSON

**JSONC**（JSON with Comments）是微软在 VS Code 生态推广的**约定**（非正式规范）。它在标准 JSON 上**只额外允许**：

- 注释：`//` 单行、`/* */` 多行
- 尾逗号

比 JSON5 保守得多（**不**放开单引号、无引号键、十六进制等）。典型使用者：

```jsonc
{
  // tsconfig.json 官方按 JSONC 解析
  "compilerOptions": {
    "target": "ES2022",   // 可以写注释
    "strict": true,       // 尾逗号也 OK
  }
}
```

- `tsconfig.json` / `jsconfig.json`
- VS Code `settings.json`、`keybindings.json`、`.vscode/*.json`

::: tip JSONC vs JSON5 怎么选
在 **TypeScript / VS Code 生态**里跟随约定用 JSONC；需要**更宽松**（单引号、十六进制、多行字符串）的手写体验才上 JSON5。两者都**不是**对外数据交换格式。
:::

## 四、NDJSON / JSON Lines：按行流式

[NDJSON](https://jsonlines.org/)（Newline-Delimited JSON，也叫 **JSON Lines**）把结构反过来——不是「一个大数组」，而是**每行一个独立的、完整的 JSON 值**（通常是对象）：

```jsonl
{"ts":"2026-07-05T10:00:00Z","level":"info","msg":"started"}
{"ts":"2026-07-05T10:00:01Z","level":"warn","msg":"slow query"}
{"ts":"2026-07-05T10:00:02Z","level":"error","msg":"timeout"}
```

规范三条：

1. **UTF-8** 编码，不加 BOM。
2. **每行是一个合法 JSON 值**（空行非法）；行内不能有未转义的真实换行。
3. **行用 `\n` 分隔**（`\r\n` 也可，因 JSON 解析忽略首尾空白）；末尾换行**推荐但可选**。

扩展名 `.jsonl`（压缩变体 `.jsonl.gz`），MIME `application/jsonl`（尚在标准化中）。

**为什么好用**：

- **流式**：逐行读、逐行 `JSON.parse`，不必把整个文件读进内存——处理 GB 级数据集的关键。
- **可追加**：日志直接 `>>` 追加一行，不用重写整个数组。
- **契合 Unix 管道**：`grep`、`jq -c`、`head` 都能按行处理。

```js
// 按行解析（Node 流式读取）
for await (const line of readLines(file)) {
  if (line.trim()) handle(JSON.parse(line));
}
```

**典型用户**：Elasticsearch `_bulk` API、大模型训练/微调数据集、结构化日志、CLI 工具间消息传递。

::: warning 整个 NDJSON 文件不是合法 JSON
别用 `JSON.parse` 去解析整个 `.jsonl` 文件——它作为整体不是合法 JSON。必须**按行**逐条解析。
:::

## 五、一张表选型

| 需求 | 推荐 |
| --- | --- |
| 对外 API / 跨系统数据交换 | **标准 JSON**（变体互操作性差） |
| 人写配置、想要注释与宽松语法 | **JSON5** |
| TypeScript / VS Code 生态配置 | **JSONC** |
| 逐行流式、超大数据集、日志追加 | **NDJSON** |
| 结构校验数据契约 | 标准 JSON + [JSON Schema](./json-schema) |

---

变体解决「怎么写」，下一页解决「怎么验」——进入 [JSON Schema](./json-schema)：用一份 schema 描述并校验 JSON 的结构与约束。
