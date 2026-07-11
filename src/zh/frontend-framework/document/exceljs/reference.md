---
layout: doc
outline: [2, 3]
---

# 参考

> ExcelJS **常用 API、样式对象、枚举值** 速查。版本基线 **ExcelJS 4.4.0**（MIT，Node 引擎 `>=8.3.0`）。

## 速查

- 文档模式：`new ExcelJS.Workbook()`；Node 用 `readFile/writeFile`，浏览器用 `load/writeBuffer`
- 工作表：`addWorksheet` / `getWorksheet` / `columns` / `addRow` / `getCell`
- 样式：`font` / `fill` / `border` / `alignment` / `numFmt`；纯色填充看 `fgColor`
- 公式：`{ formula:'A1+B1', result:3 }`；ExcelJS 不计算公式
- 流式写：`new ExcelJS.stream.xlsx.WorkbookWriter({ filename })`，逐行 `commit()`
- 流式读：`new ExcelJS.stream.xlsx.WorkbookReader(pathOrStream, options?)`，输入不是 `{ filename }`
- 浏览器不包含流式 Reader/Writer；流式模式也不支持图片
- 工作表保护：`await ws.protect(password, options)`；单元格 `locked` 只有保护后才生效

## 一、对象层级与创建

| 对象 | 创建/获取 |
|---|---|
| `Workbook` | `new ExcelJS.Workbook()` |
| `Worksheet` | `workbook.addWorksheet(name, options?)` |
| `Row` | `ws.addRow(...)` / `ws.getRow(n)` / `ws.insertRow(pos, v, style?)` |
| `Column` | `ws.getColumn(key\|letter\|number)` |
| `Cell` | `ws.getCell('A1')` / `ws.getCell(row, col)` / `row.getCell(...)` |

## 二、文件 IO

| 操作 | API |
|---|---|
| 写文件（Node） | `await workbook.xlsx.writeFile(path)` |
| 读文件（Node） | `await workbook.xlsx.readFile(path)` |
| 写到流 | `await workbook.xlsx.write(stream)` |
| 从流读 | `await workbook.xlsx.read(stream)` |
| 写到 Buffer | `const buf = await workbook.xlsx.writeBuffer()` |
| 从 Buffer 读 | `await workbook.xlsx.load(buffer, { ignoreNodes? })` |
| CSV 读写 | `workbook.csv.writeFile/readFile(path, options?)` |
| 流式写 | `new ExcelJS.stream.xlsx.WorkbookWriter({ filename, useStyles, useSharedStrings })` |
| 流式读 | `new ExcelJS.stream.xlsx.WorkbookReader(filenameOrStream, options?)` |

## 三、Worksheet 常用

| 用途 | API |
|---|---|
| 取表 | `workbook.getWorksheet(name\|id)` / `workbook.worksheets[i]` |
| 遍历表 | `workbook.eachSheet((ws, id) => {})` |
| 删表 | `workbook.removeWorksheet(ws.id)` |
| 定义列 | `ws.columns = [{ header, key, width, hidden?, outlineLevel? }]` |
| 取列 | `ws.getColumn('key'\|'B'\|3)` |
| 加行 | `ws.addRow(arrayOrObject, style?)` / `ws.addRows(rows, style?)` |
| 取行 | `ws.getRow(n)` / `ws.lastRow` |
| 遍历行 | `ws.eachRow({ includeEmpty? }, (row, n) => {})` |
| 插入行 | `ws.insertRow(pos, value, style?)` / `ws.insertRows(...)` |
| 删除行 | `ws.spliceRows(start, count, ...newRows?)` |
| 合并 | `ws.mergeCells('A1:C1')` / `ws.mergeCells(sR,sC,eR,eC)` |
| 取消合并 | `ws.unMergeCells('A1')` |
| 冻结/分割 | `ws.views = [{ state: 'frozen'\|'split', xSplit, ySplit }]` |
| 自动筛选 | `ws.autoFilter = 'A1:D1'` |
| 条件格式 | `ws.addConditionalFormatting({ ref, rules })` |
| 保护 | `await ws.protect(password?, options?)` / `ws.unprotect()` |
| 标签色 | `ws.properties.tabColor = { argb }` |

## 四、Cell 值类型

| 值类型 | 写法 |
|---|---|
| 数字/文本 | `cell.value = 123` / `cell.value = '文本'` |
| 日期 | `cell.value = new Date()`（配 `numFmt` 显示） |
| 公式 | `cell.value = { formula: 'A1+B1', result: 3 }` |
| 超链接 | `cell.value = { text: '官网', hyperlink: 'https://...', tooltip? }` |
| 富文本 | `cell.value = { richText: [{ font, text }, ...] }` |
| 读取 | `cell.value`（原始） / `cell.text`（字符串） / `cell.type`（ValueType 枚举） |

## 五、样式对象速查

```javascript
// 字体
cell.font = { name, size, bold, italic, underline, strike, color: { argb }, vertAlign };
//   underline: true/'single'/'double'/'singleAccounting'/'doubleAccounting'
//   vertAlign: 'superscript' / 'subscript'

// 对齐
cell.alignment = { horizontal, vertical, wrapText, shrinkToFit, indent, readingOrder, textRotation };
//   horizontal: left/center/right/fill/justify/centerContinuous/distributed
//   vertical:   top/middle/bottom/distributed/justify   （居中是 middle）
//   textRotation: 0~90 / -1~-90 / 'vertical'

// 边框
cell.border = { top, left, bottom, right, diagonal };  // 每项 { style, color }
//   style: thin/dotted/dashDot/hair/medium/mediumDashed/double/thick ...
//   diagonal 额外: { up, down }

// 填充（纯色看 fgColor！）
cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb }, bgColor? };
//   渐变: { type: 'gradient', gradient: 'angle'|'path', degree?/center?, stops: [{position,color}] }

// 数字格式
cell.numFmt = '0.00%';   // '#,##0.00' / 'yyyy-mm-dd' / 货币 ...

// 保护（需配合 ws.protect 才生效）
cell.protection = { locked, hidden };
```

## 六、颜色

| 写法 | 含义 |
|---|---|
| `{ argb: 'FFFF0000' }` | ARGB：Alpha-Red-Green-Blue，首两位 `FF` = 不透明红 |
| `{ theme: 0 }` | 主题色索引 |
| `{ theme: 0, tint: -0.2 }` | 主题色 + 明暗微调 |

## 七、数据校验

```javascript
cell.dataValidation = {
  type,        // list / whole / decimal / textLength / date / custom
  operator,    // between/notBetween/equal/notEqual/greaterThan/lessThan/...（list 无需）
  allowBlank,
  formulae,    // list: ['"A,B,C"'] 或 ['$D$1:$D$5']；区间: [min, max]
  showErrorMessage, errorStyle, errorTitle, error,
  showInputMessage, promptTitle, prompt,
};
```

## 八、条件格式规则 type

`expression` · `cellIs` · `top10` · `aboveAverage` · `colorScale` · `iconSet` · `dataBar` · `containsText` · `timePeriod`

## 九、图片

```javascript
const id = workbook.addImage({ filename\|buffer\|base64, extension });  // 'png'/'jpeg'/'gif'
ws.addImage(id, 'B2:D6');                                  // 区域字符串
ws.addImage(id, { tl: { col, row }, br: { col, row } });   // 锚点
ws.addImage(id, { tl: { col, row }, ext: { width, height } });  // 像素尺寸
```

## 十、工作簿元数据

```javascript
workbook.creator = '我';
workbook.lastModifiedBy = 'Her';
workbook.created = new Date();
workbook.modified = new Date();
workbook.properties.date1904 = false;   // 日期基准
```

---

API 查完，回 [指南 · 基础](./guide-line/base) 看样式实操，或 [指南 · 专家](./guide-line/expert) 看流式与选型。
