---
layout: doc
---

# PapaParse

::: tip 本篇范围
本篇聚焦 **PapaParse —— 浏览器中最快、最可靠的 CSV 解析器**：把 CSV 文本解析成 JS 数据（`Papa.parse`），以及把 JS 数据反解析回 CSV（`Papa.unparse`）。它解决的是「**前端要读/写 CSV**」这一类场景——用户上传 CSV、导出表格为 CSV、拉远程 CSV 报表。版本基线 **PapaParse 5.x**（自带 TypeScript 类型声明）。
:::

PapaParse 官方定位是「**The powerful, in-browser CSV parser for big boys and girls**」。它的核心价值在于**正确**——CSV 不是「按逗号 split」那么简单：字段可以被引号包裹，引号内可以包含逗号、换行符，引号本身用双写 `""` 转义。PapaParse 实现了一套完整的状态机来正确处理这些 RFC 4180 风格的边界，再叠加**自动分隔符探测、流式解析、Web Worker**，让大文件也能在浏览器里不卡 UI、不爆内存地解析。

最该记牢的几条「现状」：**核心 API 只有两个** —— `Papa.parse(input, config)`（CSV→JS）与 `Papa.unparse(data, config)`（JS→CSV）。`parse` 的 input 可以是**字符串 / 浏览器 File / URL（配 `download:true`）/ Node 可读流 / `Papa.NODE_STREAM_INPUT`**。传**字符串且非流式**时**同步返回** `{ data, errors, meta }`；File、下载、Worker、`step` 流式则**异步走回调**。`header:true` 让首行作字段名、每行变对象；`dynamicTyping:true` 把数字/布尔转成对应类型（**不转日期**、超 ±2^53 不转）；`step`/`chunk` 流式逐行/逐块处理省内存；`worker:true` 把解析放后台线程防卡 UI（但 **Worker 下不能 pause/resume**）。它是**同构**的——浏览器和 Node 都能用，但 `File`、`FileReader`、Web Worker 是浏览器专属。**边界要清楚：它只做 CSV**，不读 `.xlsx`（那是二进制，需 SheetJS）。

## 评价

**优点**

- **解析正确**：完整处理引号字段内的逗号/换行、双写引号转义，远胜手写 `split(',')`
- **API 极简**：核心就 `parse` / `unparse` 两个方法，开箱即用，自带 TS 类型
- **自动分隔符探测**：`delimiter` 留空时从 `delimitersToGuess`（逗号/制表符/竖线/分号等）自动识别，TSV 也能直接读
- **流式省内存**：`step` 逐行、`chunk` 逐块回调，把峰值内存从 O(n) 降到 O(1)，几百 MB 文件不爆内存
- **Web Worker 不卡 UI**：`worker:true` 把解析放后台线程，页面滚动/动画照常
- **远程友好**：`download:true` 拉 URL，支持自定义请求头、POST body、分块下载
- **容错而非崩溃**：解析错误收进 `errors` 数组、不抛异常中断，`data` 仍尽量返回
- **同构可用**：浏览器有 File/Worker，Node 有可读流与 `NODE_STREAM_INPUT` Duplex 流，可 `.pipe()`
- **安全选项**：`unparse` 的 `escapeFormulae` 挡住 Excel/Sheets 的 CSV 公式注入

**缺点**

- **只做 CSV**：不解析 Excel `.xlsx`、不处理 JSON/XML/YAML，超出范围要换库（SheetJS 等）
- **默认值都是字符串**：不开 `dynamicTyping` 时连数字都是字符串，需自己转
- **`dynamicTyping` 有坑**：会把 `007` 这类前导零标识符转成 `7` 而丢前导零，标识符列要排除
- **Worker 限制**：Worker 模式下 `parser.pause()/resume()` 不可用（`abort` 仍可用）
- **`fastMode` 易误用**：数据含引号时强开 `fastMode` 会解析错误
- **「有 errors ≠ 失败」**：容错策略下需主动检查 `result.errors.length`，不能假设没异常就万事大吉

## 文档地址

[Papa Parse Docs](https://www.papaparse.com/docs)

## GitHub 地址

[mholt/PapaParse](https://github.com/mholt/PapaParse)

## 幻灯片地址

<a href="/SlideStack/papaparse-slide/" target="_blank">PapaParse</a>
