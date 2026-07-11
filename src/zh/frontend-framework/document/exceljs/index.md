---
layout: doc
---

# ExcelJS

::: tip 本篇范围
本篇聚焦 **ExcelJS —— 一个在 Node.js 与浏览器中读取、操作、写入 XLSX 电子表格数据与样式的 JavaScript 库**。它与 SheetJS（xlsx）同属「电子表格读写」选型方向，本篇在对比与定位时一笔带过另一者。版本基线 **ExcelJS 4.4.0**（npm latest，MIT 许可）。
:::

ExcelJS 的官方定位是「**Read, manipulate and write spreadsheet data and styles to XLSX and JSON**」。它最大的特点是把 Excel 的**样式与格式**做成了完整的对象模型——字体（`font`）、填充（`fill`）、边框（`border`）、对齐（`alignment`）、数字格式（`numFmt`）、条件格式、数据校验、合并单元格、图片，乃至流式读写大文件，全都能用 JavaScript 精细控制。它是**同构**的：同一套核心 API 既能在 Node.js 用文件/流读写，也能在浏览器用 `writeBuffer` → `Blob` 导出、用 `load` 解析上传文件。

它最该被记牢的几条「现状」与易错点：**纯色填充的可见色取 `fgColor`（不是 `bgColor`）**，这是新手第一坑；**颜色一律用 ARGB 对象 `{ argb: 'FFFF0000' }`**，8 位十六进制首两位是 Alpha 透明度；**样式对象按引用共享**，把同一个 `font`/`fill` 赋给多格后再改它会牵连所有格，需独立时要先克隆；**`worksheet.getCell` 写入 `Date` 后要配 `numFmt` 才显示成日期**；**大数据导出用 `new ExcelJS.stream.xlsx.WorkbookWriter` + `commit()`** 而非普通 `Workbook`，否则内存会爆；**ExcelJS 不是计算引擎**——写入公式不会自动求值，需自带 `result` 缓存或交给 Excel。

## 评价

**优点**

- **样式/格式精细到位**：`font`/`fill`/`border`/`alignment`/`numFmt`、条件格式、数据校验、合并单元格、富文本、图片，对象化全覆盖，是「生成带样式报表」的首选
- **同构、一套核心 API 跑两端**：Node 用 `readFile`/`writeFile`/流，浏览器用 `load`/`writeBuffer` + Blob 下载，样式能力一致
- **流式读写省内存（仅 Node）**：`stream.xlsx.WorkbookWriter` / `WorkbookReader` 配 `commit()` 与 `for await`，适合大数据；浏览器构建只包含 document workbook
- **列模型友好**：`worksheet.columns` 定义 `header`/`key`/`width` 后，可用 `addRow({key:value})` 按键写入、`getColumn('key')` 按键取列
- **值类型丰富**：单元格支持数字、字符串、Date、公式 `{ formula, result }`、超链接 `{ text, hyperlink }`、富文本 `{ richText: [...] }` 等
- **CSV 一并支持**：`workbook.csv` 命名空间底层基于 fast-csv，可配 `dateFormats` / `parserOptions`
- **TypeScript 友好**：自带类型声明，配置对象有完整提示

**缺点**

- **不是计算引擎**：写入公式不会求值，结果需 `result` 缓存或打开 Excel 重算
- **样式按引用共享易踩坑**：同一对象赋多格后修改会连动，需自行克隆才能独立
- **无内置列宽自适应**：没有 `autoFit`，自适应列宽要手动遍历单元格按最长文本估算
- **填充取色反直觉**：`solid` 填充看的是 `fgColor` 而非 `bgColor`，极易设错
- **格式解析广度不及 SheetJS**：聚焦 xlsx / csv，不读 `.xls` 旧二进制 / `.ods` / `.numbers` 等
- **不渲染 UI**：只负责文件读写，表格界面渲染是 AG Grid 等组件库的事

## 文档地址

[ExcelJS GitHub README](https://github.com/exceljs/exceljs)

## GitHub 地址

[exceljs/exceljs](https://github.com/exceljs/exceljs)

## 幻灯片地址

<a href="/SlideStack/exceljs-slide/" target="_blank">ExcelJS</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=exceljs" target="_blank" rel="noopener noreferrer">ExcelJS 测试题</a>
