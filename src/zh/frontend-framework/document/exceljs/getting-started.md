---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **ExcelJS 的基本读写**：创建工作簿、加工作表/列/行、写单元格、读已有文件、浏览器导出。版本基线 **ExcelJS 4.4.0**。样式细节见[指南 · 基础](./guide-line/base)，流式/保护见[指南 · 进阶](./guide-line/advanced)与[专家](./guide-line/expert)。

## 速查

- 安装：`npm install exceljs`（或 `pnpm add exceljs`）
- 建工作簿：`const workbook = new ExcelJS.Workbook()`
- 加工作表：`const ws = workbook.addWorksheet('数据')`
- 定义列：`ws.columns = [{ header: '姓名', key: 'name', width: 20 }]`（`header` 自动写入第一行）
- 追加行：`ws.addRow({ name: '张三' })`（按列 key）或 `ws.addRow(['张三'])`（按位置）
- 写单元格：`ws.getCell('B2').value = 123`
- 写文件（Node）：`await workbook.xlsx.writeFile('out.xlsx')`
- 读文件（Node）：`await workbook.xlsx.readFile('data.xlsx')`
- 浏览器导出：`const buf = await workbook.xlsx.writeBuffer()` → `new Blob([buf])` → 下载
- 浏览器构建只支持普通 `Workbook`；`stream.xlsx.WorkbookReader/Writer` 是 Node 专用
- ⚠️ 颜色用 ARGB 对象 `{ argb: 'FFFF0000' }`（首两位是透明度）
- ⚠️ 纯色填充看 `fgColor`，不是 `bgColor`

## 一、ExcelJS 是什么

官方定位：「**Read, manipulate and write spreadsheet data and styles to XLSX and JSON**」。三个关键点：

1. **读写 xlsx**：既能生成新文件，也能解析已有文件，且读写时都能携带样式。
2. **强在样式**：字体、填充、边框、对齐、数字格式、条件格式、数据校验等，全是对象化 API。
3. **同构**：核心 API 在 Node 与浏览器通用，差别只在 IO 入口（文件/流 vs Buffer/Blob）。

> 边界提醒：ExcelJS **不是计算引擎**（公式不自动求值），也**不渲染** UI。它专注「文件的读、改、写」。

## 二、对象模型：四层结构

ExcelJS 自上而下是四层对象：

| 层级 | 对象 | 由谁创建 |
|---|---|---|
| 工作簿 | `Workbook` | `new ExcelJS.Workbook()` |
| 工作表 | `Worksheet` | `workbook.addWorksheet(name, options?)` |
| 行 | `Row` | `worksheet.addRow(...)` / `getRow(n)` |
| 单元格 | `Cell` | `worksheet.getCell('A1')` / `row.getCell(...)` |

此外有 `Column`（`worksheet.getColumn(...)`），用于整列设宽与样式。

## 三、写出第一个 xlsx（Node）

```javascript
const ExcelJS = require('exceljs');

async function run() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '我';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('员工');

  // 定义列：header 自动写入第一行，key 供按键写入数据
  ws.columns = [
    { header: '工号', key: 'id', width: 10 },
    { header: '姓名', key: 'name', width: 20 },
    { header: '入职日期', key: 'hired', width: 16 },
  ];

  // 按列 key 追加数据（不必关心列顺序）
  ws.addRow({ id: 1, name: '张三', hired: new Date(2020, 0, 1) });
  ws.addRow({ id: 2, name: '李四', hired: new Date(2021, 5, 15) });

  // 写到磁盘（返回 Promise，必须 await）
  await workbook.xlsx.writeFile('员工.xlsx');
}

run();
```

`addRow` 也接收数组（`ws.addRow([3, '王五', new Date()])`），此时按 A/B/C 列顺序对应。

## 四、读取已有 xlsx（Node）

```javascript
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('data.xlsx');

const ws = workbook.getWorksheet('员工');   // 按名取表
ws.eachRow((row, rowNumber) => {            // 遍历有数据的行
  console.log(rowNumber, JSON.stringify(row.values));
});
```

> 取表方式：`getWorksheet('名字')` 按名、`getWorksheet(id)` 按 id（注意 id 可能不连续）、`workbook.worksheets[0]` 按下标。详见[专家篇](./guide-line/expert)。

## 五、写/读单元格

```javascript
// 写
ws.getCell('B2').value = '文本';
ws.getCell('C2').value = 123.45;
ws.getCell('D2').value = new Date();              // Date 值
ws.getCell('E2').value = { formula: 'C2*2', result: 246.9 };   // 公式
ws.getCell('F2').value = { text: '官网', hyperlink: 'https://exceljs.github.io/' }; // 超链接

// 读
const cell = ws.getCell('C2');
console.log(cell.value);   // 原始值（可能是数字/Date/对象）
console.log(cell.text);    // 渲染后的字符串
console.log(cell.type);    // ValueType 枚举（Number/String/Date/Formula...）
```

::: warning Date 显示成一串数字？
ExcelJS 正确地把 `Date` 存为日期值，但**显示格式**由 `numFmt` 决定。没设时可能按序列号显示，加一行即可：

```javascript
ws.getCell('D2').numFmt = 'yyyy-mm-dd';
```
:::

## 六、浏览器里导出下载

浏览器没有文件系统写权限，**不能用 `writeFile`**。流程是 `writeBuffer` → `Blob` → 触发下载：

```javascript
const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = '导出.xlsx';
a.click();
URL.revokeObjectURL(url);
```

读取上传文件则用 `await workbook.xlsx.load(arrayBuffer)`（`FileReader` 读出 `ArrayBuffer` 后载入）。

## 七、CSV 读写

CSV 挂在与 `xlsx` 平行的 `workbook.csv` 命名空间：

```javascript
await workbook.csv.writeFile('out.csv');
const ws2 = await workbook.csv.readFile('in.csv', {
  parserOptions: { delimiter: ',' },   // 底层基于 fast-csv
});
```

---

掌握基本读写后，进入 [指南 · 基础](./guide-line/base)：字体、填充、边框、对齐、数字格式与合并单元格。
