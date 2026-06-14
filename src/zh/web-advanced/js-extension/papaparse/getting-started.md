---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **PapaParse 5.x** 的最小可用知识：装包 → 解析字符串 → 表头与类型转换 → 反解析回 CSV → 解析用户上传文件。核心 API 只有 `Papa.parse`（CSV→JS）和 `Papa.unparse`（JS→CSV）两个。

## 速查

- 安装：`npm i papaparse`（TS 类型：`npm i -D @types/papaparse`，或直接用自带声明）
- 解析字符串：`const r = Papa.parse(text)` → `{ data, errors, meta }`（同步返回）
- 首行作表头：`Papa.parse(text, { header: true })` → 每行变对象
- 自动转类型：`{ dynamicTyping: true }` → 数字/布尔转为对应类型
- 跳空行：`{ skipEmptyLines: true }`（或 `'greedy'` 连只含空白的行也跳）
- 反解析：`Papa.unparse(arrayOrObjects)` → CSV 字符串
- 解析 File：`Papa.parse(file, { complete: res => ... })`（异步回调）
- 拉远程：`Papa.parse(url, { download: true, complete: ... })`
- ⚠️ 默认所有值都是**字符串**，要数字需开 `dynamicTyping`
- ⚠️ **不要**用 `text.split(',')` 手撕 CSV（引号内逗号/换行会被切错）

## 一、PapaParse 是什么

官方一句话定位：「**The powerful, in-browser CSV parser**」。两个核心方法：

1. **`Papa.parse(input, config)`**：把 CSV **解析**成 JS 数据。
2. **`Papa.unparse(data, config)`**：把 JS 数据**反解析**回 CSV 字符串。

它的价值是**正确**：CSV 允许「引号字段内含逗号、换行，引号双写转义」，简单 `split` 处理不了，PapaParse 用状态机正确解析。

```bash
npm i papaparse
```

```ts
import Papa from "papaparse";
```

## 二、解析一段 CSV 字符串

传字符串、且不开 `step`/`worker` 时，`Papa.parse` **同步返回**结果对象：

```ts
const csv = `name,age
Ada,30
Bob,25`;

const result = Papa.parse(csv);
// result.data   → [["name","age"], ["Ada","30"], ["Bob","25"]]
// result.errors → []
// result.meta   → { delimiter: ",", linebreak: "\n", aborted: false, ... }
```

::: warning 默认两件事
① 默认 `header:false`，每行是**数组**，整个 `data` 是「数组的数组」；
② 默认所有值都是**字符串**（`"30"` 而非 `30`）。
:::

## 三、把首行当表头（header）

设 `header: true`，首行作字段名，每行解析成对象，字段名记录在 `meta.fields`：

```ts
const result = Papa.parse(csv, { header: true });
// result.data        → [{ name: "Ada", age: "30" }, { name: "Bob", age: "25" }]
// result.meta.fields → ["name", "age"]
```

## 四、自动类型转换（dynamicTyping）

`dynamicTyping: true` 把「看起来是数字/布尔」的字段转成真正的类型：

```ts
const result = Papa.parse(csv, { header: true, dynamicTyping: true });
// result.data → [{ name: "Ada", age: 30 }, { name: "Bob", age: 25 }]  // age 现在是 number
```

::: warning 三个注意
① **不转日期**（日期仍是字符串，需自己处理）；
② 超出 `±2^53` 的数为保精度**不转**；
③ `007` 这类**前导零标识符**会被转成 `7` 丢前导零——这类列别开（见[进阶篇](./guide-line/advanced)按列控制）。
:::

## 五、清理空行（skipEmptyLines）

```ts
Papa.parse(csv, { skipEmptyLines: true });    // 跳过完全空的行
Papa.parse(csv, { skipEmptyLines: "greedy" }); // 连「只剩空白」的行（如 `,,, `）也跳
```

## 六、反解析：JS → CSV（unparse）

```ts
// 对象数组（默认带表头）
Papa.unparse([
  { name: "Ada", age: 30 },
  { name: "Bob", age: 25 },
]);
// → "name,age\r\nAda,30\r\nBob,25"

// 数组的数组
Papa.unparse([
  ["name", "age"],
  ["Ada", 30],
]);

// 不要表头
Papa.unparse(rows, { header: false });
```

> `unparse` 默认 `header:true`、换行 `\r\n`（CRLF，符合 RFC 4180）。含逗号/引号/换行的字段会**自动加引号并转义**，保证能被正确解析回来。

## 七、解析用户上传的文件（File）

把 `File` 对象**直接**传给 `Papa.parse`，结果**异步**走回调（无需先 FileReader 读文本）：

```ts
// <input type="file" id="csv">
document.getElementById("csv")!.addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files![0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (res) => {
      console.log("行数:", res.data.length, "错误:", res.errors);
    },
    error: (err) => console.error("读取失败:", err),
  });
});
```

## 八、为什么不能 split(',') 手撕

```ts
const line = '"Hello, World",foo';
line.split(","); // ❌ ['"Hello', ' World"', 'foo']  —— 引号内逗号被错切

Papa.parse(line).data[0]; // ✅ ["Hello, World", "foo"]  —— 正确识别为两列
```

CSV 允许引号字段内含逗号、换行，还有双写引号转义；`split` 全不懂。**永远用解析器，别手撕。**

---

掌握基础后，进入 [参考](./reference)：全部 config 选项 / ParseResult / 常量速查；或直接看 [指南 · 基础](./guide-line/base) 学流式与 Worker。
