---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **1.17.1**。把 pdf-lib 用进真实项目：**修改既有 PDF**（叠加水印/盖章）、**copyPages 合并**、**表单 AcroForm**（填写 / 扁平化 / 中文字段）、浏览器与 Node 的读写差异、嵌图与缩放。

## 一、修改既有 PDF：加水印

`load` 进来，遍历每页用 `drawText` 叠加半透明、倾斜的水印。

```ts
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

const pdfDoc = await PDFDocument.load(existingBytes);
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

for (const page of pdfDoc.getPages()) {
  const { width, height } = page.getSize();
  page.drawText('CONFIDENTIAL', {
    x: width / 2 - 150,
    y: height / 2,
    size: 50,
    font,
    color: rgb(0.6, 0.6, 0.6),
    opacity: 0.3,            // 半透明
    rotate: degrees(45),     // 倾斜
  });
}

const out = await pdfDoc.save();
```

> 水印是**叠加**在原内容之上，不会改动原文字。这正是 pdf-lib 与「只能新建」的 jsPDF 的本质差异。

## 二、合并多个 PDF：copyPages

pdf-lib 没有一键 merge，标准做法是循环 `copyPages` + `addPage`。关键点：跨文档不能直接 addPage 别人的页，**必须先 copyPages「过户」**（连同字体/图像资源）。

```ts
const merged = await PDFDocument.create();

for (const bytes of [bytesA, bytesB, bytesC]) {
  const src = await PDFDocument.load(bytes);
  // getPageIndices() 返回 [0,1,...,n-1]，复制全部页
  const pages = await merged.copyPages(src, src.getPageIndices());
  pages.forEach((p) => merged.addPage(p));
}

const out = await merged.save();
```

> 只想要某几页就把 indices 换成 `[0, 2]` 等。`copyPages` 返回的页**已属于 merged**，但还需 `addPage`/`insertPage` 才真正进入文档。

## 三、拆分 PDF：抽取部分页

新建一个文档，只把需要的页复制过来：

```ts
const src = await PDFDocument.load(bytes);
const sub = await PDFDocument.create();

// 抽取第 1、3、5 页（索引 0,2,4）
const pages = await sub.copyPages(src, [0, 2, 4]);
pages.forEach((p) => sub.addPage(p));

const out = await sub.save();
```

## 四、表单：填写已有 AcroForm

`getForm` 后按字段名取具体字段，按类型写值。

```ts
const pdfDoc = await PDFDocument.load(formBytes);
const form = pdfDoc.getForm();

form.getTextField('CharacterName').setText('Mario');
form.getTextField('Age').setText('24');
form.getCheckBox('agree').check();
form.getRadioGroup('gender').select('male');
form.getDropdown('country').select('China');
form.getOptionList('hobbies').select('Coding');

const out = await pdfDoc.save();
```

| 字段类型 | 写值方法 |
|---|---|
| 文本框 | `setText(s)` |
| 复选框 | `check()` / `uncheck()` |
| 单选组 | `select(value)` |
| 下拉 / 列表 | `select(value)` |

> 取可能不存在的字段用 `form.getFieldMaybe(name)`（返回 undefined，不抛错）；`getField` 找不到会抛错。

## 五、表单中文：updateFieldAppearances

字段默认用 Helvetica（WinAnsi）生成外观，**写不出中文**。需嵌入 CJK 字体并用它重绘所有字段外观。

```ts
import fontkit from '@pdf-lib/fontkit';

const pdfDoc = await PDFDocument.load(formBytes);
pdfDoc.registerFontkit(fontkit);
const cnFont = await pdfDoc.embedFont(cnFontBytes, { subset: true });

const form = pdfDoc.getForm();
form.getTextField('name').setText('张三');
form.getTextField('city').setText('北京');

// 关键：用中文字体重绘字段外观，否则中文不显示
form.updateFieldAppearances(cnFont);

const out = await pdfDoc.save();
```

## 六、表单：扁平化（固化为不可编辑）

`flatten()` 把字段外观烘焙成页面静态内容、移除控件，PDF 不再可填写——适合生成最终交付件、防止他人改动。

```ts
const form = pdfDoc.getForm();
form.getTextField('name').setText('张三');
form.getCheckBox('agree').check();

form.flatten();              // 扁平化（含中文记得先 updateFieldAppearances）
const out = await pdfDoc.save();
```

## 七、从零创建表单字段

用 `form.createXxx` 工厂建字段，再 `addToPage` 放置。

```ts
const page = pdfDoc.addPage([550, 750]);
const form = pdfDoc.getForm();

const nameField = form.createTextField('user.name');
nameField.setText('默认值');
nameField.enableMultiline();                 // 多行
nameField.addToPage(page, { x: 50, y: 640, width: 200, height: 24 });

const agree = form.createCheckBox('user.agree');
agree.addToPage(page, { x: 50, y: 600 });
agree.check();

const out = await pdfDoc.save();
```

## 八、浏览器实战：读取上传 + 导出下载

```ts
// 读取 <input type="file"> 选中的 PDF
const file = input.files[0];
const pdfDoc = await PDFDocument.load(await file.arrayBuffer());

// ……修改……

// 导出下载
const bytes = await pdfDoc.save();
const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
const a = document.createElement('a');
a.href = url;
a.download = 'edited.pdf';
a.click();
URL.revokeObjectURL(url);
```

> 远程 PDF 必须取 `arrayBuffer()`（二进制），**不能**用 `res.text()`（会破坏数据）：`await (await fetch(url)).arrayBuffer()`。

## 九、Node 实战：作为 HTTP 响应返回

服务端通常不落地磁盘，直接把 `save()` 的字节作为响应体：

```ts
// Express 示例
app.get('/report', async (req, res) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  pdfDoc.addPage().drawText('Report', { x: 50, y: 700, size: 24, font });

  const bytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
  res.end(Buffer.from(bytes));   // Uint8Array → Buffer 写入响应
});
```

## 十、嵌图与缩放

```ts
const jpg = await pdfDoc.embedJpg(jpgBytes);
const png = await pdfDoc.embedPng(pngBytes);

// 等比缩放到 25%
const d = jpg.scale(0.25);
page.drawImage(jpg, { x: 50, y: 400, width: d.width, height: d.height });

// 适配到一个框内（不超过 200x150）
const fit = png.scaleToFit(200, 150);
page.drawImage(png, { x: 50, y: 200, width: fit.width, height: fit.height });
```

> 同一张图只需 `embed` **一次**，可在循环里对多页 `drawImage` 复用——嵌入资源是文档级共享的，不会重复存储。

---

进入 [指南 · 专家](./guide-line/expert)：embedPage 整页复用与 N-up 拼版、加密 PDF 的边界、save/parse 性能调优、维护停滞与 `@cantoo/pdf-lib`、与 jsPDF 的选型。
