---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **ExcelJS 4.4.0**。本篇把「会读写」升级到「会排版」：样式总览、字体、填充、边框、对齐、数字格式、合并单元格、列与行的整体样式。样式精细控制是 ExcelJS 的核心卖点。

## 速查

- 五类核心样式：`font` / `fill` / `border` / `alignment` / `numFmt`
- 颜色：`{ argb:'FFFF0000' }`，前两位是 Alpha；纯色填充使用 `fgColor`
- 对齐：水平 `center`，垂直 `middle`；长文本配 `wrapText:true`
- 数字格式：百分比 `0.00%`、日期 `yyyy-mm-dd`、千分位 `#,##0.00`
- 合并：`mergeCells('A1:C1')`；值与样式由左上角 master 单元格承载
- 样式对象按引用共享；需要隔离时创建或克隆新对象
- 行列样式冲突：同一属性行优先；不同属性会合并继承
- 手动写 `Date` 后通常还要设置 `numFmt` 才能按日期显示

## 一、样式总览

单元格、行、列都支持这五种样式属性：

| 属性 | 作用 | 取值形态 |
|---|---|---|
| `numFmt` | 数字/日期显示格式 | Excel 格式代码字符串，如 `'0.00%'` |
| `font` | 字体 | 对象：`name`/`size`/`bold`/`color` 等 |
| `alignment` | 对齐与换行 | 对象：`horizontal`/`vertical`/`wrapText` 等 |
| `border` | 边框 | 对象：`top`/`left`/`bottom`/`right`/`diagonal` |
| `fill` | 填充 | 对象：`type`/`pattern`/`fgColor` 等 |

::: warning 两条贯穿全篇的铁律
① **颜色一律是 ARGB 对象** `{ argb: 'FFFF0000' }`，8 位十六进制依次为 Alpha-Red-Green-Blue，首两位 `FF` = 完全不透明。也可用主题色 `{ theme: 0 }`。
② **样式对象按引用共享**：把同一个对象赋给多格后再修改它，会牵连所有引用它的单元格——需独立时先克隆（详见[专家篇](./expert)）。
:::

## 二、字体 font

```javascript
ws.getCell('A1').font = {
  name: '微软雅黑',
  size: 14,
  bold: true,
  italic: false,
  underline: 'single',          // true/false/'single'/'double'/'singleAccounting'/'doubleAccounting'
  strike: false,                // 删除线
  color: { argb: 'FF0000FF' },  // ARGB 对象，非字符串
  vertAlign: 'superscript',     // 'superscript' / 'subscript'
};
```

常见错误：`color: 'red'`（必须是对象）、`cell.bold = true`（无此扁平属性）。

## 三、填充 fill

纯色填充用 `pattern` + `solid`，**可见色取 `fgColor`**：

```javascript
ws.getCell('A1').fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' },   // 实际显示的黄色
};
```

::: warning 最常见的填充坑
`solid` 模式下显示的是 `fgColor`，**不是** `bgColor`。只写 `bgColor` 不会变色。`bgColor` 只在非 solid 的纹理图案里作为底色。
:::

纹理图案与渐变填充（渐变细节见[进阶篇](./advanced)）：

```javascript
// 纹理图案
ws.getCell('A2').fill = {
  type: 'pattern', pattern: 'darkTrellis',
  fgColor: { argb: 'FFFF0000' }, bgColor: { argb: 'FF0000FF' },
};
```

## 四、边框 border

按方向设置，每个方向是 `{ style, color }`：

```javascript
ws.getCell('A1').border = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'double', color: { argb: 'FFFF0000' } },
  right: { style: 'medium' },
  diagonal: { up: true, down: true, style: 'thick', color: { argb: 'FF00FF00' } },
};
```

`style` 是枚举字符串，常用：`thin` / `dotted` / `dashDot` / `hair` / `medium` / `mediumDashed` / `double` / `thick` 等。`diagonal` 用 `up`/`down` 控制斜线方向。

## 五、对齐 alignment

```javascript
ws.getCell('A1').alignment = {
  horizontal: 'center',   // left/center/right/fill/justify/centerContinuous/distributed
  vertical: 'middle',     // top/middle/bottom/distributed/justify  ← 居中是 middle 不是 center
  wrapText: true,         // 自动换行
  shrinkToFit: false,     // 缩小字体填充
  indent: 0,              // 缩进
  readingOrder: 'ltr',    // 'ltr' / 'rtl'
  textRotation: 0,        // 0~90（向上）/ -1~-90（向下）/ 'vertical'（竖排）
};
```

::: tip 两个易错点
① 垂直居中是 `vertical: 'middle'`，写 `'center'` 无效。
② 竖排文字是 `textRotation: 'vertical'`（字符堆叠），与 `textRotation: 90`（整体旋转 90 度）不同。
:::

## 六、数字格式 numFmt

`numFmt` 只改变**显示**，不改变存储的真实数值，遵循 Excel 格式代码：

```javascript
ws.getCell('A1').value = 0.456;
ws.getCell('A1').numFmt = '0.00%';                 // 显示 45.60%

ws.getCell('A2').value = 1234567.89;
ws.getCell('A2').numFmt = '#,##0.00';              // 1,234,567.89

ws.getCell('A3').value = 1234.5;
ws.getCell('A3').numFmt = '"¥"#,##0.00;[Red]\\-"¥"#,##0.00';  // 货币，负数红色

ws.getCell('A4').value = new Date();
ws.getCell('A4').numFmt = 'yyyy-mm-dd hh:mm:ss';   // 日期时间
```

> 把值直接写成 `'45.60%'` 字符串会变成文本，丢失数值与可计算性——应保留数值 + 设 `numFmt`。

## 七、合并单元格

```javascript
ws.mergeCells('A1:C1');           // 范围字符串
ws.mergeCells('K10', 'M12');      // 起止单元格
ws.mergeCells(10, 11, 12, 13);    // 起始行,起始列,结束行,结束列 → K10:M12
```

合并后，**值与样式以左上角单元格（master）为准**：

```javascript
ws.getCell('A1').value = '标题';          // ✅ 写左上角
// ws.getCell('B1').value = '标题'        // ❌ 从属单元格，无效
ws.getCell('B1').master === ws.getCell('A1');  // true
```

取消合并：`ws.unMergeCells('A1')`，之后各格样式恢复独立。

## 八、行与列的整体样式

样式不仅能设在单元格，也能设在整行/整列：

```javascript
ws.getRow(1).font = { bold: true };               // 表头整行加粗
ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

ws.getColumn('amount').numFmt = '"¥"#,##0.00';     // 整列货币格式
ws.getColumn(3).alignment = { horizontal: 'right' };
```

> 行样式与列样式同时存在时：**同一属性以行为准**；行与列定义的是**不同**属性时，单元格**同时继承两者**。这条优先级规则能解释「为什么我设了列样式没生效」。

---

进入 [指南 · 进阶](./advanced)：富文本、数据校验、条件格式、图片、冻结窗格、自动筛选。
