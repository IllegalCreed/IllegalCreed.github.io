---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **0.20.3**。把 SheetJS 用进真实项目：浏览器读写（ArrayBuffer/Blob/fetch）、Node 服务端把文件作为响应返回、`sheet_add_*` 追加、CSV/HTML/DOM 互转、格式选择与压缩。

## 速查

- 浏览器本地文件：`XLSX.read(await file.arrayBuffer(), { type:'array' })`
- 远程文件：`XLSX.read(await response.arrayBuffer(), { type:'array' })`，不要用 `text()`
- 浏览器下载：`XLSX.writeFile(wb, 'report.xlsx')`
- 内存字节：`XLSX.write(wb, { bookType:'xlsx', type:'array' })`
- Node 响应：`XLSX.write(wb, { bookType:'xlsx', type:'buffer' })`
- 追加：`sheet_add_json(..., { origin:-1, skipHeader:true })`
- 格式互转：`sheet_to_csv` / `sheet_to_html` / `table_to_sheet`
- 限定解析：`sheets` 选表、`sheetRows` 限行；`raw:false` 取格式化文本

## 一、浏览器：读取本地文件

浏览器没有文件系统，先把 `File` 转二进制再 `read`：

```ts
input.addEventListener('change', async () => {
  const file = input.files[0];
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
});
```

> `type: 'array'` 表示输入是 ArrayBuffer/Uint8Array。也可用 `FileReader.readAsArrayBuffer`，但 `file.arrayBuffer()` 更简洁。

## 二、浏览器：拉取远程表格

xlsx 是二进制 ZIP，必须取 `arrayBuffer()`（**不能**用 `text()`，会破坏二进制）：

```ts
const buf = await (await fetch(url)).arrayBuffer();
const wb = XLSX.read(buf, { type: 'array' });
```

## 三、浏览器：导出下载

```ts
XLSX.writeFile(wb, 'report.xlsx', { compression: true });
```

`writeFile` 在浏览器内部做的事（等价代码，帮助理解）：

```ts
const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([u8]);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.download = 'report.xlsx';
a.href = url;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
```

> 只需导出 xlsx 时，用 `XLSX.writeFileXLSX(wb, name)` 能让打包器摇掉其它格式写出代码，减小生产包体积。

## 四、Node：把文件作为 HTTP 响应返回

服务端通常**不落地磁盘**，而是用 `write` 拿 Buffer 直接作为响应体：

```ts
// Express 示例
app.get('/export', (req, res) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.send(buf);
});
```

> 要 Node Buffer 用 `type:'buffer'`；`type:'array'` 给的是 Uint8Array 风格数组。

## 五、追加数据：sheet_add_json / sheet_add_aoa

往**已有**工作表写数据，并用 `origin` 定位起点：

```ts
const ws = XLSX.utils.json_to_sheet(rows);

// 用 AOA 覆盖表头（origin: 'A1'）
XLSX.utils.sheet_add_aoa(ws, [['姓名', '年龄']], { origin: 'A1' });

// 追加到现有数据底部（origin: -1）
XLSX.utils.sheet_add_json(ws, moreRows, { origin: -1, skipHeader: true });
```

> `origin` 可传 A1 字符串、`{ r, c }` 对象、行号（0 基，从该行 A 列起）或 `-1`（追加到底部）。

## 六、CSV / HTML / DOM 互转

```ts
// 表 → CSV 字符串（自定义分隔符）
const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });

// 表 → HTML 表格字符串（直接塞进页面）
container.innerHTML = XLSX.utils.sheet_to_html(ws);

// 页面 <table> → 工作表（把网页表格导出 Excel）
const ws2 = XLSX.utils.table_to_sheet(document.querySelector('table'));
```

## 七、选择输出格式

`bookType` 决定格式；`writeFile` 不传时按文件名后缀推断：

```ts
XLSX.writeFile(wb, 'out.csv');   // 推断为 CSV
XLSX.writeFile(wb, 'out.ods');   // 推断为 ODS（社区版支持）
XLSX.writeFile(wb, 'out.xlsb');  // 推断为 XLSB

// write 必须显式给 bookType + type
const data = XLSX.write(wb, { bookType: 'ods', type: 'array' });
```

> CSV/TXT 是单表格式，只导出一个工作表（用 `sheet` 选项指定）；xlsx/ods/xlsb 支持多表。

## 八、读取时只取需要的部分

```ts
// 只解析名为 'Sheet2' 的工作表
XLSX.read(buf, { type: 'array', sheets: 'Sheet2' });

// 只读每表前 100 行（解析期截断，省时省内存）
XLSX.read(buf, { type: 'array', sheetRows: 100 });

// 取格式化文本而非原始值
XLSX.utils.sheet_to_json(ws, { raw: false });
```

---

进入 [指南 · 专家](./expert)：大文件与 Web Worker、dense 模式、加密/密码、公式与样式的边界、与 ExcelJS 的取舍。
