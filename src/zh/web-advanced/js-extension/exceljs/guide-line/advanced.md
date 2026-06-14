---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **ExcelJS 4.x**。把样式能力延伸到「交互与富内容」：富文本、渐变填充、数据校验（下拉/区间）、条件格式、图片、冻结窗格、自动筛选、行的插入/删除/剪切。

## 一、富文本：一格多样式

给 `cell.value` 赋含 `richText` 数组的对象，每段独立设 `font`：

```javascript
ws.getCell('A1').value = {
  richText: [
    { font: { bold: true, color: { argb: 'FFFF0000' } }, text: '警告：' },
    { font: { italic: true }, text: '此操作不可撤销' },
  ],
};
// 此时 cell.type === ExcelJS.ValueType.RichText
// cell.text === '警告：此操作不可撤销'（拼接后的纯文本）
```

每段 `font` 可用 `{ theme: 0 }` 主题色或 `{ argb }` 精确色。

## 二、渐变填充

```javascript
// 角度渐变：degree 0 = 从左到右，顺时针
ws.getCell('A1').fill = {
  type: 'gradient', gradient: 'angle', degree: 0,
  stops: [
    { position: 0, color: { argb: 'FF0000FF' } },
    { position: 0.5, color: { argb: 'FFFFFFFF' } },
    { position: 1, color: { argb: 'FF0000FF' } },
  ],
};

// 路径渐变：从中心点辐射
ws.getCell('A2').fill = {
  type: 'gradient', gradient: 'path', center: { left: 0.5, top: 0.5 },
  stops: [
    { position: 0, color: { argb: 'FFFF0000' } },
    { position: 1, color: { argb: 'FF00FF00' } },
  ],
};
```

`stops` 每项是 `{ position(0~1), color }`。注意 `type` 是 `'gradient'`，没有 `'linearGradient'`。

## 三、数据校验

数据校验通过 `cell.dataValidation` 设置，限制输入并可弹提示。

### 下拉列表（list）

```javascript
// 离散候选：整体作为一个带引号的字符串
ws.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['"待办,进行中,已完成"'],
};

// 引用区域作为候选
ws.getCell('A2').dataValidation = {
  type: 'list',
  formulae: ['$D$1:$D$5'],
};
```

::: warning list 的 formulae 写法
离散值要写成 **数组里的一个字符串**，且字符串内用双引号包住逗号分隔值：`['"待办,进行中,已完成"']`。写成多个数组元素 `['待办','进行中']` 是错的。
:::

### 数值/日期/文本长度

```javascript
// 整数 whole / 小数 decimal，区间用 operator 'between'
ws.getCell('B1').dataValidation = {
  type: 'decimal', operator: 'between',
  formulae: [1.5, 7],
  showErrorMessage: true, errorTitle: '超范围', error: '请输入 1.5~7 之间的数',
};

// 日期比较
ws.getCell('B2').dataValidation = {
  type: 'date', operator: 'lessThan',
  formulae: [new Date(2026, 0, 1)], showErrorMessage: true, allowBlank: true,
};

// 文本长度
ws.getCell('B3').dataValidation = {
  type: 'textLength', operator: 'lessThan', formulae: [15], showErrorMessage: true,
};
```

- **type**：`list` / `whole` / `decimal` / `textLength` / `date` / `custom`
- **operator**：`between` / `notBetween` / `equal` / `notEqual` / `greaterThan` / `lessThan` / `greaterThanOrEqual` / `lessThanOrEqual`
- 提示相关：`showErrorMessage` / `errorStyle` / `errorTitle` / `error`、`showInputMessage` / `promptTitle` / `prompt`

## 四、条件格式

```javascript
// 斑马纹（隔行变色）
ws.addConditionalFormatting({
  ref: 'A2:D100',
  rules: [
    {
      type: 'expression',
      formulae: ['MOD(ROW(),2)=0'],
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF2F2F2' } } },
    },
  ],
});
```

规则 `type` 可选：`expression` / `cellIs` / `top10` / `aboveAverage` / `colorScale` / `iconSet` / `dataBar` / `containsText` / `timePeriod`。

## 五、插入图片

两步：先在**工作簿**注册拿 `imageId`，再在**工作表**贴到区域：

```javascript
const imageId = workbook.addImage({
  filename: 'logo.png',
  extension: 'png',          // 也支持 buffer / base64
});

ws.addImage(imageId, 'B2:D6');               // 贴到区域
// 或精确定位：
ws.addImage(imageId, {
  tl: { col: 1, row: 1 },                    // 左上锚点
  ext: { width: 200, height: 80 },           // 像素尺寸
});
```

## 六、冻结窗格

```javascript
// 冻结首行（表头固定）：ySplit 冻结行数，xSplit 冻结列数
ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

// 同时冻结前两列 + 前三行
ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
```

> `state: 'frozen'` 下 `xSplit`/`ySplit` 是**行列计数**；`state: 'split'`（可独立滚动的分割窗格）下它们是磅值坐标，二者语义不同。

## 七、自动筛选

```javascript
ws.autoFilter = 'A1:D1';                          // 范围字符串
ws.autoFilter = { from: 'A1', to: 'D1' };          // 对象形式
```

`autoFilter` 是可赋值**属性**，不是方法。

## 八、行的插入、删除、剪切

```javascript
ws.insertRow(3, ['新值1', '新值2']);               // 在第 3 行前插入，后续行下移
ws.insertRow(3, rowValues, 'i');                  // 第三参 'i' 继承上一行样式

ws.spliceRows(4, 3);                              // 删除第 4 起的 3 行，后续上移
ws.spliceRows(4, 0, ['a'], ['b']);               // 在第 4 行处插入两行（删 0 行）

ws.duplicateRow(1, 2, false);                    // 复制第 1 行 2 次
```

`addRow` 只能在**末尾**追加；要插队用 `insertRow`，删除/剪切用 `spliceRows`。

---

进入 [指南 · 专家](./expert)：流式读写大文件、样式引用与克隆、工作表保护、列宽自适应技巧、ExcelJS 与 SheetJS 选型。
