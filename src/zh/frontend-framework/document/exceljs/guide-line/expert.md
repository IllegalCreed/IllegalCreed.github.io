---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **ExcelJS 4.4.0**。深入工程实践：流式读写大文件、样式引用与克隆陷阱、工作表保护、列宽自适应、解析提速、以及与 SheetJS 的选型边界。

## 速查

- 流式写：`WorkbookWriter({ filename|stream })`；每行 `commit()`，最后 `await workbook.commit()`
- 流式读：`WorkbookReader(filenameOrStream, options?)` + `for await`；不要传 `{ filename }`
- 流式 API 仅 Node 可用；不支持图片，已提交行不可回头修改，`unMergeCells()` 不可用
- 样式引用会共享；需要独立修改时创建新对象或克隆
- 保护：先解锁可编辑单元格，再 `await ws.protect(...)`；默认 `spinCount` 会带来 CPU 开销
- 自适应列宽没有内置 `autoFit`，需遍历单元格估算
- 解析提速：`xlsx.load(buffer, { ignoreNodes:[...] })`
- `getWorksheet(id)` 按内部 id，不等于 `worksheets[0]`

## 一、流式写入大文件（WorkbookWriter）

普通 `Workbook` 把整个文档保留在内存，数据量很大时可能 OOM。流式写入用 `stream.xlsx.WorkbookWriter`，配 `commit()` 边写边释放：

```javascript
const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
  filename: 'large.xlsx',
  useStyles: true,           // 让流式输出也带样式
  useSharedStrings: true,    // 重复字符串去重，减小文件体积
});

const ws = workbook.addWorksheet('数据');
ws.columns = [
  { header: 'ID', key: 'id', width: 10 },
  { header: '值', key: 'value', width: 15 },
];

for (let i = 1; i <= 500000; i++) {
  ws.addRow({ id: i, value: Math.random() }).commit();  // 每行 commit
}

ws.commit();              // 提交工作表（同步）
await workbook.commit();  // 完成文件
```

::: warning commit 的代价
一旦某行被 `commit`，它会被写入输出流并**从内存丢弃，不再可访问**——这正是流式不爆内存的原因，代价是无法回头修改已提交的行。所以流式写入要「数据备齐再逐行写」。
:::

`useSharedStrings: true` 让重复文本走共享字符串表（只存一份、用索引引用），重复文本多时显著减小体积；`useStyles: true` 让流式写入也输出样式（默认关闭以省开销）。

> 流式模式只在 Node 中提供，浏览器构建没有 `WorkbookReader/Writer`。流式模式不支持图片；行提交后不可访问，`unMergeCells()` 也不可用。

## 二、流式读取大文件（WorkbookReader）

```javascript
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('large.xlsx', {
  sharedStrings: 'cache',
  hyperlinks: 'ignore',
  styles: 'ignore',
});

for await (const worksheet of workbook) {
  for await (const row of worksheet) {
    // 边读边处理，不把整个文件载入内存
    console.log(row.values);
  }
}
```

也可监听事件：`workbook.on('worksheet', ws => ws.on('row', row => {...}))`。

## 三、样式引用与克隆陷阱

ExcelJS 的样式对象（`font`/`fill`/`border` 等）**按引用共享**。把同一个对象赋给多格后再改它，会牵连所有引用它的单元格：

```javascript
const base = { name: 'Arial', size: 12 };
ws.getCell('A1').font = base;
ws.getCell('A2').font = base;
base.size = 20;          // ❌ A1、A2 同时变成 20 号！
```

需要独立时**克隆**后再赋值：

```javascript
const make = (over) => ({ name: 'Arial', size: 12, ...over });
ws.getCell('A1').font = make({ bold: true });    // 各自独立
ws.getCell('A2').font = make({ italic: true });
```

> 反过来，若你**故意**想「一改全改」，复用同一引用就是特性。关键是分清「何时复用、何时克隆」。

## 四、工作表保护与单元格锁定

单元格 `protection.locked` **只有在工作表被保护后才生效**：

```javascript
// 默认所有单元格 locked=true；先把可编辑区放开
ws.getCell('B2').protection = { locked: false };

// 再保护工作表（口令可选）
await ws.protect('your-password', {
  selectLockedCells: true,
  selectUnlockedCells: true,
});
```

只设 `locked` 而不调用 `ws.protect(...)`，编辑不受任何限制。`protection` 还有 `hidden`（隐藏公式）。

## 五、列宽自适应（无内置 autoFit）

ExcelJS **没有内置列宽自适应**，需手动按最长文本估算：

```javascript
ws.columns.forEach((column) => {
  let max = 10;
  column.eachCell({ includeEmpty: true }, (cell) => {
    const len = (cell.value ?? '').toString().length;
    if (len > max) max = len;
  });
  column.width = max + 2;   // 留点余量
});
```

> 中文字符视觉宽度约为西文两倍，精细场景可对中文字符按 1.6~2 倍加权。

## 六、解析提速：ignoreNodes

读取超大、含大量数据校验/超链接的文件时，可让解析跳过不关心的 XML 节点：

```javascript
await workbook.xlsx.load(buffer, {
  ignoreNodes: ['dataValidations', 'hyperlinks'],
});
```

只关心数据、不需要这些元素时，能明显降低解析开销与内存。

## 七、getWorksheet(id) ≠ worksheets[0]

官方特意提醒这条易错点：

```javascript
workbook.getWorksheet(1);     // 按工作表 id（删表后 id 可能不连续！）
workbook.worksheets[0];       // 按数组下标，永远是第一张
workbook.getWorksheet('名字'); // 按名取，最稳妥
```

删除过某张表后，`id=1` 可能取不到你以为的首表——按位置取请用数组下标，按业务取请用名字。

## 八、ExcelJS vs SheetJS 选型

| 维度 | **ExcelJS** | **SheetJS（xlsx）** |
|---|---|---|
| 强项 | 带样式/格式的**写出**（报表导出） | 广泛格式的**解析**与数据转换 |
| 样式写入 | 精细（font/fill/border/条件格式/校验/图片） | 社区版有限 |
| 支持格式 | xlsx / csv | xlsx/xls/csv/ods 等众多 |
| 流式 | Node 下 `stream.xlsx` 增量读写 XLSX | 无 ExcelJS 式 XLSX 增量 writer |
| 公式计算 | 不求值（需缓存 result） | 不求值 |
| 典型场景 | 生成漂亮的带样式报表 | 解析各种来源的杂格式 / 纯数据进出 |

一句话：**要好看的样式导出选 ExcelJS，要解析多种来源格式或纯数据进出选 SheetJS**。两者是独立实现，无封装关系，必要时也可组合使用。

---

回到 [入门](../getting-started) 复习读写，或查 [参考](../reference) 速览 API 与枚举值。
