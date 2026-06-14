---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **0.20.3**。本篇把「会读写」用到「懂模型」：CSF 数据模型（Workbook/Worksheet/Cell）、A1 地址与 `!ref`、单元格对象 `v`/`t`/`w`/`z`、`sheet_to_json` 的 `header`/`range`/`defval`、日期处理。

## 一、CSF 数据模型：三层结构

SheetJS 把所有格式解析成统一的 **Common Spreadsheet Format**：

```text
Workbook（工作簿）
├── SheetNames: ['Sheet1', 'Sheet2']   // 有序的工作表名数组
├── Sheets: { Sheet1: {...}, ... }     // 名 → Worksheet 的映射
└── Props: { Title, Author, ... }      // 文档属性

Worksheet（工作表）
├── 'A1': { t:'s', v:'姓名' }          // 以 A1 地址作键的 Cell 对象
├── 'A2': { t:'n', v: 20 }
├── '!ref': 'A1:B3'                    // 有效范围
└── '!cols' / '!rows' / '!merges'      // 列宽/行高/合并等
```

取数据的标准姿势：

```ts
const ws = wb.Sheets[wb.SheetNames[0]];  // 先取名、再取表
const a1 = ws['A1'];                     // 单元格对象
```

> 注意 `wb.Sheets` 以**名字**作键，不能用 `wb.Sheets[0]`；`wb.SheetNames[0]` 只是名字字符串，不是工作表对象。

## 二、A1 地址与 `!ref`

- **A1 地址**：列字母 + 行号，如 `C4`（列 C、第 4 行）。
- **SheetJS 地址对象**：`{ c, r }`，列行均 **0 基**，`C4` → `{ c:2, r:3 }`。
- **范围**：`'A1:D10'`；对象形式 `{ s:{c,r}, e:{c,r} }`（含起止）。
- **`!ref`**：工作表的有效范围字符串，多数工具（含 `sheet_to_json`）据此遍历——**缺失或不对就读不到数据**。

地址转换用 `utils`：

```ts
XLSX.utils.decode_cell('C4');   // { c: 2, r: 3 }
XLSX.utils.encode_cell({ c: 2, r: 3 }); // 'C4'
XLSX.utils.decode_range('A1:B3'); // { s:{c:0,r:0}, e:{c:1,r:2} }
```

## 三、单元格对象：内容与呈现分离

一个单元格是普通 JS 对象，核心字段：

| 字段 | 例子 | 含义 |
|---|---|---|
| `v` | `3.5` | 原始底层值 |
| `t` | `'n'` | 类型 |
| `z` | `'$0.00'` | 数字格式串 |
| `w` | `'$3.50'` | 按格式渲染的显示文本 |

```ts
const cell = ws['B2']; // { t:'n', v:3.5, z:'$0.00', w:'$3.50' }
```

> 数据处理读 `v`，展示给人看用 `w`。`t` 的取值：`b`布尔 / `n`数字 / `e`错误 / `s`字符串 / `d`日期 / `z`空白存根。

::: tip 写入时 t 很重要
手动构造单元格时必须正确设 `t`：想写数字却写成 `t:'s'`，会被当文本，Excel 里无法参与计算。用 `json_to_sheet`/`aoa_to_sheet` 时会**自动推断** `t`，一般不必手设。
:::

## 四、sheet_to_json：两种输出模式

```ts
// 默认：对象数组，首行作键
XLSX.utils.sheet_to_json(ws);
// [{ 姓名:'张三', 年龄:20 }, ...]

// header:1：二维数组，首行不作键
XLSX.utils.sheet_to_json(ws, { header: 1 });
// [['姓名','年龄'], ['张三',20], ...]
```

| 模式 | 适用 | 空行默认 |
|---|---|---|
| 默认对象模式 | 有规整表头、想直接拿对象 | **跳过**空行（`blankrows:true` 保留） |
| `header:1`（AOA） | 自己处理表头、表头不规整 | **保留**空行（`blankrows:false` 跳过） |

> `header` 还可传 `'A'`（用列字母作键）或字符串数组（自定义键，且首行也作数据、不消歧）。默认对象模式遇**重名表头**会自动加后缀消歧（`金额`、`金额_1`…）。

## 五、range 与 defval

```ts
// 跳过顶部 2 行说明，从第 3 行（0 基的 2）开始读
XLSX.utils.sheet_to_json(ws, { range: 2 });

// 精确限定一个 A1 区域
XLSX.utils.sheet_to_json(ws, { range: 'A2:C100' });

// 缺失/空单元格统一填默认值，避免对象字段缺失
XLSX.utils.sheet_to_json(ws, { defval: null });
```

::: warning 字段「时有时无」
默认稀疏模型下空单元格不存在、结果对象会**省略该键**。这不是 bug，加 `defval` 即可让字段齐全。
:::

## 六、日期：默认是数字

Excel 底层把日期存成**数字序列号**。SheetJS 默认不转换：日期单元格 `t:'n'`、`v` 是数字（`w` 才是看得懂的日期文本）。要得到 JS `Date`：

```ts
const wb = XLSX.readFile('data.xlsx', { cellDates: true });
// 此后日期单元格 t:'d'、v 是 Date 对象
```

## 七、建表三步与列宽

```ts
const ws = XLSX.utils.json_to_sheet(rows); // 或 aoa_to_sheet(aoa)
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '数据'); // 名 ≤31 字符、需唯一

// 顺手设列宽（字符宽 wch / 像素宽 wpx）
ws['!cols'] = [{ wch: 12 }, { wch: 20 }];

XLSX.writeFile(wb, 'out.xlsx');
```

---

进入 [指南 · 进阶](./guide-line/advanced)：浏览器读写（ArrayBuffer/Blob/fetch）、Node 服务端返回文件、`sheet_add_*` 追加、CSV/HTML 导出、格式选择。
