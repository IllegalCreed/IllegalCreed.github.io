---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **PapaParse 5.x**。本篇深入：Node.js 流式 `.pipe()`、内存模型、`fastMode` 取舍、与 SheetJS 的边界协作、TypeScript 用法、大文件三件套最佳实践。

## 一、Node.js 流式：NODE_STREAM_INPUT 与 .pipe()

PapaParse 是**同构**的——Node 端没有 File/Worker，但支持可读流。两种用法：

```ts
import Papa from "papaparse";
import fs from "node:fs";

// 用法 1：NODE_STREAM_INPUT 返回 Duplex 流，可 .pipe() 链式组合
const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
  header: true,
  dynamicTyping: true,
});
fs.createReadStream("data.csv")
  .pipe(parseStream)
  .on("data", (row) => console.log("行:", row))
  .on("end", () => console.log("完成"))
  .on("error", (err) => console.error(err));

// 用法 2：直接把可读流当 input，配 step/complete
Papa.parse(fs.createReadStream("large.csv"), {
  header: true,
  step: (results) => process(results.data),
  complete: () => console.log("流式解析完成"),
});
```

::: warning Node 端的常见误区
`download:true` 是**浏览器**端拉 URL（XHR），**不会读本地文件路径**。Node 读本地文件请用 `fs.createReadStream` + 上面两种方式。
:::

## 二、内存模型：流式为何省内存

| 方式 | data 内容 | 内存峰值 | 适用 |
|---|---|---|---|
| 非流式（`complete`） | 全部行累积进 `result.data` | ≈ 整个数据集，**O(n)** | 小文件 |
| `step` 流式 | 每次只给当前一行，不保留 | ≈ 单行，**O(1)** | 大文件 |
| `chunk` 流式 | 每次给一块的行 | ≈ 一块大小 | 大文件批处理 |

```ts
// ❌ 大文件这样会 OOM：把几百万行全堆进内存
Papa.parse(hugeFile, { complete: (res) => save(res.data) });

// ✅ 流式：内存恒定
let n = 0;
Papa.parse(hugeFile, {
  step: (res) => { saveRow(res.data); n++; },
  complete: () => console.log(n, "行已处理"),
});
```

> 这就是大文件**必须**用 `step`/`chunk` 的根本原因——把峰值内存从 O(n) 降到 O(1)。

## 三、fastMode 取舍

`fastMode` 是针对**完全不含引号字段**的数据的速度优化（走无需处理引号状态的快路径），通常**自动启用**。但若数据**确实含引号字段**却强制 `fastMode:true`，解析会**出错**——快路径不处理引号内的分隔符/换行：

```ts
// 数据无引号 → 通常自动走快路径，无需手动开
// 数据含引号 → 绝不要强开 fastMode，否则字段被错切
Papa.parse(quotedCsv, { fastMode: true }); // ❌ 含引号时会解析错误
```

## 四、边界：PapaParse 不读 Excel

`.xlsx` 是 **ZIP + XML 二进制**（OOXML），不是纯文本 CSV。把 `.xlsx` 喂给 PapaParse 只会得到乱码：

```ts
// ❌ 错误想法：加个 excel:true 就能读 xlsx —— 没有这个选项
// ✅ 正确路线：
//   方案 A：让用户在 Excel 里「另存为 CSV」再上传
//   方案 B：用 SheetJS(xlsx) 读 .xlsx，必要时转 CSV 再交给 PapaParse
```

```ts
// SheetJS 读 xlsx → 转 CSV → PapaParse 解析（如需统一 CSV 管线）
import * as XLSX from "xlsx";
const wb = XLSX.read(arrayBuffer, { type: "array" });
const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
const result = Papa.parse(csv, { header: true });
```

> 记牢边界：**PapaParse 只做 CSV/分隔符文本**，不是万能数据层。

## 五、TypeScript 用法

PapaParse 5.x 自带类型声明（或装 `@types/papaparse`）。用泛型给行数据标注类型：

```ts
import Papa, { type ParseResult } from "papaparse";

interface User {
  name: string;
  age: number;
  email: string;
}

const result = Papa.parse<User>(csv, {
  header: true,
  dynamicTyping: true,
});
result.data.forEach((u) => console.log(u.name, u.age)); // u 是 User

// File 异步同样可标注
Papa.parse<User>(file, {
  header: true,
  complete: (res: ParseResult<User>) => {
    res.data; // User[]
  },
});
```

> 注意：`dynamicTyping` 的转换是**运行时**行为，泛型只是编译期标注——若实际数据不符（如该转数字的列含非数字），类型与运行时可能不一致，仍要校验。

## 六、大文件「三件套」最佳实践

要同时满足「**不卡 UI + 不爆内存 + 实时进度**」，三手段叠加：

```ts
let processed = 0;
Papa.parse(hugeFile, {
  header: true,
  worker: true, // 不卡 UI（注意：Worker 下无 pause/resume）
  step: (results, parser) => {
    handleRow(results.data); // 流式 → 不爆内存
    processed++;
    if (processed % 1000 === 0) {
      updateProgress(processed); // 实时进度（也可借 meta.cursor 估算）
    }
  },
  complete: () => console.log("全部完成:", processed),
});
```

| 目标 | 手段 |
|---|---|
| 不爆内存 | `step` / `chunk` 流式，不保留全部行 |
| 不卡 UI | `worker: true`，解析放后台线程 |
| 实时进度 | 在回调里累加行数 / 借 `meta.cursor` 估算 |

## 七、容错策略的工程含义

PapaParse「**收集错误而不中断**」是它的设计哲学。工程上意味着：

- **永远检查 `result.errors`**——「没抛异常」不代表「数据干净」。
- 对脏数据可按 `error.row` 定位、按 `error.code`（`TooManyFields` 等）分类处理。
- 严格场景下，可在 `step` 里发现致命错误就 `parser.abort()` 提前止损。

```ts
Papa.parse(file, {
  step: (results, parser) => {
    if (results.errors.length) {
      logBadRow(results.errors);
      if (tooManyErrors()) parser.abort(); // 错误过多，停
    } else {
      handleRow(results.data);
    }
  },
});
```

---

回到 [参考](../reference) 查全部选项，或回 [概览](../index) 复盘 PapaParse 的定位与边界。
