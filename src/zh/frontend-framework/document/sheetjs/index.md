---
layout: doc
---

# SheetJS（xlsx）

::: tip 本篇范围
本篇聚焦 **SheetJS 社区版**（npm 包名 `xlsx`）——用一套统一 JS API **读写多种电子表格格式**（xlsx / xls / xlsb / csv / ods 等）。重点在：**`Workbook → Worksheets → Cells` 数据模型**、`XLSX.read`/`readFile` 与 `write`/`writeFile`/`writeFileXLSX`、`utils.sheet_to_json`/`json_to_sheet`/`aoa_to_sheet` 在「表格 ↔ JS 数据」间转换、A1 地址与 `!ref` 范围、单元格对象（`v`/`t`/`w`/`f`/`z`）、浏览器（ArrayBuffer/Blob 下载）与 Node 的差异，以及与 ExcelJS 的取舍。版本基线 **0.20.3**，并在关键处点明 **「从官方 CDN 安装」这个高频坑**。
:::

SheetJS 的官方定位是「**a unified interface to every Excel file format as well as Lotus 1-2-3, Numbers, and Quattro Pro**」——用统一 API 抹平各种电子表格格式的差异，且「runs everywhere」：浏览器、服务器、桌面/移动 App 乃至 Excel 插件里都能跑。它的核心价值是**格式覆盖广 + 解析能力强 + 环境无关**。

理解 SheetJS 的关键是它的 **Common Spreadsheet Format（CSF）数据模型**：最外层是 **Workbook（工作簿）**，含 `SheetNames`（有序工作表名数组）与 `Sheets`（名→工作表的映射）；每个 **Worksheet（工作表）** 默认以 **A1 风格地址**作键存放 **Cell（单元格）对象**（如 `ws['A1']`），并用 `!ref` 标记有效范围；**Cell 对象**用 `v`（原始值）/`t`（类型）/`w`（格式化文本）/`f`（公式）/`z`（数字格式）等字段把「内容」与「呈现」分离。**一个高频坑**：公共 npm 上的 `xlsx` 长期停在旧版（0.18.5，官方称 known registry bug），**最新版需从官方 CDN**（`https://cdn.sheetjs.com/`）以 tarball URL 安装。

## 评价

**优点**

- **格式覆盖最广**：xlsx/xlsm/xlsb/xls/xlml/ods/csv/dbf 乃至 Lotus 1-2-3、Numbers 等十多种，导入异构数据几乎一站搞定
- **解析能力强、容错好**：能稳健读取来源杂乱的旧表格，抽数据是其最强场景
- **环境无关**：浏览器（`read` + ArrayBuffer / `writeFile` 触发下载）与 Node（`readFile`/`writeFile` 直接读写磁盘）同一套 API
- **数据转换顺手**：`sheet_to_json` / `json_to_sheet` / `aoa_to_sheet` 在「表格 ↔ JS 对象/数组」之间无缝转换
- **零运行时依赖、体积可控**：自带类型，且提供 `writeFileXLSX` 等可摇树变体减小生产包
- **细粒度可控**：`header`/`range`/`defval`/`raw`/`cellDates`/`sheetRows`/`dense` 等选项覆盖绝大多数读写需求

**缺点**

- **安装来源易踩坑**：`npm i xlsx` 装到的是滞后的 0.18.5，需改用 CDN tarball URL（这是新手最常见的困惑）
- **社区版样式弱**：字体/颜色/边框等单元格样式的**写出**能力有限，精美报表需 SheetJS Pro 或改用 ExcelJS
- **不内置公式引擎**：读取给缓存结果、写出原样写公式，但**不替你重算**，需在 JS 里求值得另接库
- **大文件需自管**：解析是同步 CPU 密集操作，浏览器大文件易阻塞主线程，需 `sheetRows`/指定 sheet/Web Worker 缓解
- **稀疏模型的「字段缺失」**：空单元格默认被省略，不加 `defval` 会出现对象字段时有时无
- **API 命名偏底层**：`!ref`/`!cols`/`encode_cell` 等贴近文件格式，初见有上手成本

## 文档地址

[SheetJS Community Edition Docs](https://docs.sheetjs.com/)

## GitHub 地址

[SheetJS/sheetjs](https://github.com/SheetJS/sheetjs)

## 幻灯片地址

<a href="/SlideStack/sheetjs-slide/" target="_blank">SheetJS（xlsx）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=sheetjs-xlsx" target="_blank" rel="noopener noreferrer">SheetJS（xlsx） 测试题</a>
