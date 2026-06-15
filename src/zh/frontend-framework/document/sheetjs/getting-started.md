---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 SheetJS 并完成第一次「读」与「写」。版本基线 **0.20.3**。核心认知：**Workbook → Worksheets → Cells 三层模型**，外加一条贯穿全篇的安装提醒——**最新版从官方 CDN 装**，别直接 `npm i xlsx`。

## 速查

- 安装（Node，**官方推荐 CDN**）：`npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- 导入：`import * as XLSX from 'xlsx'`（CJS：`const XLSX = require('xlsx')`）
- 读（Node）：`const wb = XLSX.readFile('data.xlsx')`
- 读（浏览器）：`const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })`
- 取第一个工作表：`const ws = wb.Sheets[wb.SheetNames[0]]`
- 表 → 对象数组：`const rows = XLSX.utils.sheet_to_json(ws)`
- 对象数组 → 表：`const ws = XLSX.utils.json_to_sheet(rows)`
- 建簿加表：`const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data')`
- 写（Node 写盘 / 浏览器下载）：`XLSX.writeFile(wb, 'out.xlsx')`
- ⚠️ `npm i xlsx` 装到的是 npm 上滞后的 **0.18.5**（known registry bug）

## 一、SheetJS 是什么

官方定位：「**unified interface to every Excel file format**」。三个关键点：

1. **格式广**：一套 API 读写 xlsx/xls/xlsb/csv/ods 等十多种格式。
2. **环境无关**：浏览器与 Node 通用，只是「拿数据」和「落地」方式不同。
3. **数据模型统一**：所有格式都被解析成同一套 **CSF**（Workbook/Worksheet/Cell）。

> 边界提醒：SheetJS 处理的是表格**数据的读写与转换**，不负责图表渲染；社区版也不擅长写出复杂样式（见[专家篇](./guide-line/expert)与 ExcelJS 对比）。

## 二、安装：务必从官方 CDN

```bash
# 先移除可能存在的旧 npm 版本，再从 CDN tarball 安装最新版
npm rm --save xlsx
npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

# pnpm / yarn 同理
pnpm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
yarn add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

::: warning 为什么不直接 npm i xlsx
公共 npm registry 上的 `xlsx` 长期停在 **0.18.5**，官方称这是 a known registry bug。**authoritative source 是 `https://cdn.sheetjs.com/`**，最新版只在 CDN 发布，所以要用上面的 tarball URL 安装。
:::

浏览器也可直接用 `<script>` 引入（挂全局 `XLSX`）：

```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
```

## 三、导入方式

SheetJS 用**命名空间**组织 API，所有函数都挂在顶层对象上：

```ts
import * as XLSX from 'xlsx';

XLSX.read(/* ... */);
XLSX.utils.sheet_to_json(/* ... */);
```

> 顶层有 `read`/`readFile`/`write`/`writeFile`/`writeFileXLSX`；数据转换工具都在 `XLSX.utils.*` 下。

## 四、第一次「读」

```ts
import * as XLSX from 'xlsx';

// Node：直接读磁盘
const wb = XLSX.readFile('data.xlsx');

// 取第一个工作表（SheetNames 是名数组，Sheets 是名→表的映射）
const ws = wb.Sheets[wb.SheetNames[0]];

// 转成对象数组：默认首行作为各列的键
const rows = XLSX.utils.sheet_to_json(ws);
// [{ 姓名: '张三', 年龄: 20 }, ...]
```

浏览器里没有文件系统，要先把 `File` 转成二进制再 `read`：

```ts
const file = input.files[0];
const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
```

## 五、第一次「写」

标准三步：建空簿 → 生成工作表 → 加进工作簿，最后落地。

```ts
const rows = [
  { 姓名: '张三', 年龄: 20 },
  { 姓名: '李四', 年龄: 25 },
];

// 1. 对象数组 → 工作表
const ws = XLSX.utils.json_to_sheet(rows);

// 2. 新建工作簿并加表（工作表名 ≤ 31 字符且唯一）
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '名单');

// 3. 落地：Node 写磁盘 / 浏览器触发下载（按后缀推断格式）
XLSX.writeFile(wb, 'out.xlsx');
```

> 浏览器里 `writeFile` 会在内部生成 `Blob` + `URL.createObjectURL` + 一个 `<a download>` 元素 `click()` 来触发下载——你不必手动处理。

## 六、两个最常用的转换

```ts
// 表 → 二维数组（自己处理表头）
const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 });
// [['姓名','年龄'], ['张三', 20], ...]

// 二维数组 → 表
const ws2 = XLSX.utils.aoa_to_sheet([
  ['姓名', '年龄'],
  ['王五', 30],
]);
```

> `header: 1` 切到「数组的数组」模式，**首行不再作键**；默认（不传 header）才是「首行作键的对象数组」。两者的区别见[指南 · 基础](./guide-line/base)。

## 七、一个易忘点：空单元格

默认稀疏模型下，**没有值的单元格根本不存在**，`sheet_to_json` 也会省略这些键，导致对象「字段时有时无」。想统一补默认值：

```ts
const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
// 缺失/空位都填 null，保证每个对象字段齐全
```

---

读写跑通后，进入 [指南 · 基础](./guide-line/base)：CSF 数据模型、单元格对象 `v`/`t`/`w`/`z`、A1 地址与 `!ref`、`sheet_to_json` 的 `header`/`range`/`defval`。
