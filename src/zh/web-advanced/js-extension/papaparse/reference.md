---
layout: doc
outline: [2, 3]
---

# 参考

> Papa Parse 5.5.4 的 API、配置选项、结果对象与常量速查。两个核心方法：`Papa.parse(input, config)` 与 `Papa.unparse(data, config)`。

## 速查

- `Papa.parse()` 做 CSV → JS；`Papa.unparse()` 做 JS → CSV，后者始终同步返回字符串
- 字符串非流式解析同步返回 `ParseResult`；File、URL、Worker、Node 流通过回调 / 事件消费
- `header: true` 生成对象行；重复表头自动加 `_1 / _2`，映射记录在 `meta.renamedHeaders`
- `dynamicTyping` 会转换 number / boolean / `null` / ISO Date；标识符列应按列关闭
- `transform` 在 `dynamicTyping` 之前运行；`transformHeader` 只处理表头名称
- `step` 每行回调，`chunk` 只用于本地 / 远程文件且不要和 `step` 同时使用
- Worker 下可 `abort()`，不可 `pause()` / `resume()`；`complete` 在流式模式不提供累计全量数据
- 导出用户可控数据时启用 `escapeFormulae`；TypeScript 需要另装 `@types/papaparse`

## 一、两个核心方法

| 方法 | 方向 | input / data | 返回 |
|---|---|---|---|
| `Papa.parse(input, config)` | CSV → JS | 字符串 / File / URL(`download`) / Node 流 / `NODE_STREAM_INPUT` | 字符串非流式时同步返回 `ParseResult`；否则走回调 |
| `Papa.unparse(data, config)` | JS → CSV | 数组的数组 / 对象数组 / `{ fields, data }` | CSV 字符串（同步） |

## 二、parse 解析配置（config）

| 选项 | 默认 | 含义 |
|---|---|---|
| `delimiter` | `""`（自动探测） | 分隔符；可为字符串或函数；支持多字符 |
| `newline` | `""`（自动探测） | 换行序列：`\r`、`\n` 或 `\r\n` |
| `quoteChar` | `'"'` | 字段引号字符 |
| `escapeChar` | `'"'` | 引号内转义引号的字符（默认双写引号） |
| `header` | `false` | 首行作字段名，每行变对象，字段名记入 `meta.fields` |
| `transformHeader` | `undefined` | `(header, index) => string` 规范每个表头名（需 `header:true`） |
| `dynamicTyping` | `false` | 数字、布尔、空值、ISO 日期转型；可传对象/函数按列控制 |
| `preview` | `0` | >0 时只解析前 N 行 |
| `encoding` | `""` | 本地文件编码（FileReader 支持的值） |
| `worker` | `false` | 在 Web Worker 线程解析，避免阻塞 UI |
| `comments` | `false` | 注释前缀字符串（如 `"#"`），匹配的整行跳过 |
| `step` | `undefined` | `(results, parser) => void` 逐行流式回调；可 abort / 非 Worker 时暂停 |
| `complete` | `undefined` | 解析完成回调；流式模式不在这里累计返回全部 data |
| `error` | `undefined` | `(error, file?) => void` 错误回调 |
| `download` | `false` | 把首参当 URL 下载后解析 |
| `downloadRequestHeaders` | `undefined` | 下载请求的自定义 HTTP 头 |
| `downloadRequestBody` | `undefined` | 设了则改用 POST，作为请求体 |
| `withCredentials` | `undefined` | XHR 的 `withCredentials` |
| `skipEmptyLines` | `false` | 跳空行；`'greedy'` 连只含空白的行也跳 |
| `chunk` | `undefined` | 本地 / 远程文件逐块回调；不要与 `step` 同时配置 |
| `chunkSize` | `undefined` | 覆盖默认块大小 |
| `fastMode` | `undefined` | 无引号数据走快路径（通常自动；含引号别强开） |
| `beforeFirstChunk` | `undefined` | `(chunk) => string?` 在首块解析前修改原始文本 |
| `transform` | `undefined` | `(value, colIndexOrHeader) => any` 逐值清洗/转换 |
| `delimitersToGuess` | `[',', '\t', '|', ';', RECORD_SEP, UNIT_SEP]` | 自动探测候选分隔符 |
| `skipFirstNLines` | `0` | 跳过开头 N 行再解析 |

## 三、ParseResult 结果对象

```ts
interface ParseResult<T> {
  data: T[];          // 行数据：header:false 为数组的数组；header:true 为对象数组
  errors: ParseError[]; // 错误数组（容错收集，不抛异常）
  meta: ParseMeta;    // 元信息
}
```

- **`data`**：`header:false` → `string[][]`；`header:true` → 对象数组。多出表头的字段进 `__parsed_extra`。
- **`meta`** 常见字段：`delimiter`、`linebreak`、`aborted`、`truncated`、`cursor`，以及 `header:true` 时的 `fields`、`renamedHeaders`（新表头 → 原表头）。

## 四、ParseError 错误对象

```ts
interface ParseError {
  type: "Quotes" | "Delimiter" | "FieldMismatch";
  code: "MissingQuotes" | "UndetectableDelimiter" | "TooFewFields" | "TooManyFields" | ...;
  message: string;
  row?: number; // 出错行号
}
```

> 字段数、引号、分隔符等**解析问题**通常进入 `errors`，`data` 仍尽量返回；I/O 错误走 `error` 回调，无效入参或配置仍可能抛异常。两条通道都要处理。

## 五、parser 流式控制（step/chunk 回调第二参）

| 方法 | 作用 | Worker 下 |
|---|---|---|
| `parser.abort()` | 立即停止解析（触发 complete，`meta.aborted = true`） | ✅ 可用 |
| `parser.pause()` | 暂停解析（可恢复） | ❌ 不可用 |
| `parser.resume()` | 恢复暂停的解析 | ❌ 不可用 |

## 六、unparse 反解析配置（config）

| 选项 | 默认 | 含义 |
|---|---|---|
| `quotes` | `false` | 加引号策略：`true` 全加 / 布尔数组按列 / 函数按值；默认仅必要时加 |
| `quoteChar` | `'"'` | 引号字符 |
| `escapeChar` | `'"'` | 转义引号的字符 |
| `delimiter` | `","` | 分隔符（支持多字符） |
| `header` | `true` | 是否输出表头行 |
| `newline` | `"\r\n"` | 换行序列（默认 CRLF，符合 RFC 4180） |
| `skipEmptyLines` | `false` | 跳空行；`'greedy'` 连只含空白的也跳 |
| `columns` | `null` | 对象数组时显式指定输出哪些列及顺序（字符串数组） |
| `escapeFormulae` | `false` | 给以 `= + - @ Tab CR` 开头的值加 `'`；也可传自定义正则 |

## 七、Papa 常量

| 常量 | 值 | 用途 |
|---|---|---|
| `Papa.BAD_DELIMITERS` | `["\r","\n",'"',"﻿"]` | 禁止用作分隔符的字符 |
| `Papa.RECORD_SEP` | ASCII 30 | 记录分隔符（不可见） |
| `Papa.UNIT_SEP` | ASCII 31 | 单元分隔符（不可见） |
| `Papa.WORKERS_SUPPORTED` | boolean | 当前环境是否支持 Web Worker |
| `Papa.LocalChunkSize` | 10485760（10 MiB） | 本地 File 流式解析的默认块大小 |
| `Papa.RemoteChunkSize` | 5242880（5 MiB） | 远程下载流式解析的默认块大小 |
| `Papa.DefaultDelimiter` | `","` | 自动探测失败时的回退分隔符 |
| `Papa.NODE_STREAM_INPUT` | 哨兵值 | 作为 input 传入时，`parse` 返回 Node Duplex 流供 `.pipe()` |

## 八、返回值 vs 回调 / 事件速记

| 输入 / 模式 | 行为 |
|---|---|
| 字符串 + 非流式 | **同步返回** `ParseResult` |
| 字符串 + `step` | 使用回调；5.5.4 当前会在调用栈内执行，不能把它当 Promise |
| File 对象 | 异步走 `complete`/`step` 回调 |
| URL（`download:true`） | 异步走回调 |
| `worker:true` | 异步走回调（不支持 pause/resume） |
| Node 可读流 / `NODE_STREAM_INPUT` | 流式/异步 |

---

需要实战机制（流式、Worker、安装策略对比），见 [指南 · 基础](./guide-line/base)；高阶用法见 [指南 · 进阶](./guide-line/advanced)、[指南 · 专家](./guide-line/expert)。
