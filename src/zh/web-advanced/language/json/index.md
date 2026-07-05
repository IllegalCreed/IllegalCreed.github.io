---
layout: doc
---

# JSON

**JavaScript Object Notation**——当今互联网最通用的**轻量级数据交换格式**。语法从 JavaScript 对象字面量提炼而来，却完全与语言无关：几乎所有主流语言都内置或有成熟的 JSON 解析/生成库。它由 Douglas Crockford 在 2000 年代初提出，如今由两份权威规范共同固化——**RFC 8259**（IETF，管交换语义、UTF-8 编码、互操作性）与 **ECMA-404**（Ecma，管语法本身），二者互为规范性引用、承诺保持一致。JSON 的心智模型极简：一个 JSON 文本就是**一个序列化的值**，值只有六种——对象 `{}`、数组 `[]`、字符串、数值、布尔（`true`/`false`）、`null`。没有注释、没有尾逗号、没有日期/函数/`undefined`，键必须是双引号字符串——正是这种「刻意的克制」让它成为跨系统、跨语言传输结构化数据的最大公约数。围绕它还生长出一整个生态：手写友好的 **JSON5**、带注释的 **JSONC**（tsconfig/VS Code）、按行流式的 **NDJSON**，以及做结构校验的 **JSON Schema**（当前 draft **2020-12**）。

## 评价

**优点**

- **语言无关、无处不在**：从 REST API 响应体、`package.json` 配置，到 localStorage、日志、消息队列，JSON 是事实标准；任何语言都能读写，是异构系统间的通用语
- **规范稳定、心智极简**：六种值、双引号、无注释无尾逗号——语法多年未变，学一次终身受用；`JSON.parse`/`JSON.stringify` 两个 API 覆盖 90% 日常需求
- **人类可读、调试友好**：纯文本、可缩进美化，抓包/看日志/写 mock 都能直接肉眼读懂，比二进制格式（Protobuf/MessagePack）易调试
- **生态完整**：JSON Schema 做校验、JSON5/JSONC 补配置场景、NDJSON 做流式、JSON Pointer/Patch 做定位与增量，工具链成熟
- **原生集成**：浏览器与 Node.js 内置 `JSON` 全局对象，无需第三方库；`fetch().then(r => r.json())` 一行到位

**缺点**

- **不支持注释**：作为配置文件的最大痛点，逼出了 JSONC、JSON5、乃至改用 YAML/TOML
- **数字精度陷阱**：JS 的 number 是 IEEE 754 双精度，大整数（超过 2^53−1）解析即静默丢精度，大整数只能用字符串承载
- **类型贫乏**：没有日期、没有 BigInt、没有二进制——`Date` 往返后退化成字符串，`BigInt` 直接 `stringify` 抛 `TypeError`，需要自己在 reviver/replacer 里补
- **相对冗长**：字段名重复、双引号、大括号带来体积开销，超大数据集不如二进制格式紧凑（可用 NDJSON + gzip 缓解）
- **无 Schema 则弱约束**：JSON 本身不描述结构，跨团队协作需额外引入 JSON Schema / TypeScript 类型来保证契约

## 文档地址

[json.org 官方站](https://www.json.org/json-en.html) ｜ [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) ｜ [ECMA-404](https://ecma-international.org/publications-and-standards/standards/ecma-404/) ｜ [JSON Schema](https://json-schema.org/) ｜ [JSON5](https://json5.org/) ｜ [JSON Lines](https://jsonlines.org/)

## GitHub 地址

[json-schema-org/json-schema-spec](https://github.com/json-schema-org/json-schema-spec) ｜ [json5/json5](https://github.com/json5/json5) ｜ [ajv-validator/ajv](https://github.com/ajv-validator/ajv)

## 幻灯片地址

<a href="/SlideStack/json-slide/" target="_blank">JSON</a>
