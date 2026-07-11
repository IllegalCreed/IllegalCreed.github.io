---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 pdf-lib 并完成两件事：**从零新建**一份 PDF、**载入并修改**一份既有 PDF。版本基线 **1.17.1**。核心认知：**create / load 双入口** + **左下角原点、y 向上** 的坐标系 + **save() 返回 Uint8Array** 自己落地。

## 速查

- 安装：`npm install --save pdf-lib`（自带 TS 类型；中文再装 `npm i @pdf-lib/fontkit`）
- 导入：`import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'`
- 新建：`const doc = await PDFDocument.create()`
- 载入既有：`const doc = await PDFDocument.load(existingBytes)`
- 加页：`const page = doc.addPage([595.28, 841.89])`（A4，单位 point）
- 取字体：`const font = await doc.embedFont(StandardFonts.Helvetica)`
- 写字：`page.drawText('Hi', { x: 50, y: 700, size: 24, font, color: rgb(0,0,0) })`
- 输出：`const bytes = await doc.save()` → Node `fs.writeFileSync('out.pdf', bytes)` / 浏览器 Blob 下载
- ⚠️ 坐标原点在**左下角**、y **向上**：放顶部用 `y: height - margin`
- ⚠️ 标准字体不含中文；中文见[基础篇](./guide-line/base)的 fontkit 嵌字体

## 一、pdf-lib 是什么

官方定位：「**Create and modify PDF documents in any JavaScript environment**」。三个关键点：

1. **能改既有**：`load` 一份现成 PDF 后加页、画字、填表单——这是区别于 jsPDF（只能新建）的核心。
2. **环境无关**：浏览器、Node、Deno、React Native 同一套 API，纯 JS、零原生依赖。
3. **绘制式模型**：你在**页面坐标系上叠加绘制**，而不是编辑文档对象树。

> 边界提醒：pdf-lib **不**抽取 PDF 里已有的文字（那是 PDF.js），**不**渲染到屏幕，也**不**把 HTML 转成 PDF。它只负责「构造与修改 PDF 内容」。

## 二、安装

```bash
npm install --save pdf-lib
# 需要显示中文等非 Latin 字符时，再装字体子模块
npm install --save @pdf-lib/fontkit
```

浏览器也可用 CDN 的 UMD 构建直接 `<script>` 引入（挂全局 `PDFLib`）：

```html
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
```

::: warning 维护现状要知道
原仓库 `Hopding/pdf-lib` 的 npm 稳定版仍是 **1.17.1（2021 年底）**。社区 fork **`@cantoo/pdf-lib` 2.7.1** 延续了主要 API，并提供密码、增量保存和整段 SVG 等新能力；它不是原库官方续作，升级也不应只换包名后直接上线。详见[专家篇](./guide-line/expert)。
:::

## 三、第一次「新建」

标准四步：建文档 → 加页 → 取字体 → 画字，最后 `save`。

```ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// 1. 新建空文档
const pdfDoc = await PDFDocument.create();

// 2. 取一个标准字体（标准字体也要先 embed 拿到 PDFFont 对象）
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

// 3. 加一页，拿到尺寸
const page = pdfDoc.addPage([595.28, 841.89]); // A4
const { width, height } = page.getSize();

// 4. 写字：注意 y 用 height - margin 把文字放到顶部
page.drawText('Creating PDFs in JS is awesome!', {
  x: 50,
  y: height - 50,
  size: 24,
  font,
  color: rgb(0, 0.53, 0.71),
});

// 5. 落地：save() 返回 Uint8Array
const pdfBytes = await pdfDoc.save();
```

## 四、第一次「修改既有 PDF」

这是 pdf-lib 的招牌能力：`load` 进来，在第一页上叠加一行字。

```ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// existingPdfBytes 来自 fs.readFileSync（Node）或 fetch().arrayBuffer()（浏览器）
const pdfDoc = await PDFDocument.load(existingPdfBytes);
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

// 取第一页，在其既有内容之上叠加新文字
const [firstPage] = pdfDoc.getPages();
const { height } = firstPage.getSize();

firstPage.drawText('Added with pdf-lib!', {
  x: 50,
  y: height - 100,
  size: 30,
  font,
  color: rgb(0.95, 0.1, 0.1),
});

const pdfBytes = await pdfDoc.save();
```

> `drawText` 是**叠加**绘制——画在原内容之上，不替换、也无法编辑原有文字（pdf-lib 不能就地改写既有文本）。批注、盖章、补字段都靠这种叠加。

## 五、把结果落地

`save()` 只返回字节，**落地要你自己来**：

```ts
// Node：写磁盘
import fs from 'node:fs';
fs.writeFileSync('out.pdf', pdfBytes); // writeFileSync 接受 Uint8Array

// 浏览器：构造 Blob 触发下载
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'out.pdf';
a.click();
URL.revokeObjectURL(url); // 用完释放
```

> 想直接拿 base64（塞进 `<iframe src>` 预览）用 `await pdfDoc.saveAsBase64({ dataUri: true })`。

## 六、坐标系：左下角原点、y 向上

这是头号新手坑。PDF（含 pdf-lib）的坐标原点在**页面左下角**，**y 轴向上为正**——y 越大越靠顶部。

```ts
const { width, height } = page.getSize();

// 放到左上角附近：y 要用 height 减去边距
page.drawText('Top-left', { x: 40, y: height - 40, size: 12, font });

// 放到底部：y 取小值
page.drawText('Bottom-left', { x: 40, y: 40, size: 12, font });
```

> 这与 canvas / CSS「左上角原点、y 向下」相反。把它记牢，定位就不会上下颠倒。

## 七、画一张图片

图片要先 `embed` 再 `drawImage`：

```ts
const pngImage = await pdfDoc.embedPng(pngBytes); // JPEG 用 embedJpg
const dims = pngImage.scale(0.5); // 等比缩放到 50%

page.drawImage(pngImage, {
  x: 50,
  y: 300,
  width: dims.width,
  height: dims.height,
});
```

> `embedPng`/`embedJpg` 接受 `Uint8Array` / `ArrayBuffer` / base64 字符串。URL 要你自己 `fetch().arrayBuffer()`，库不替你发请求。

---

跑通新建与修改后，进入 [指南 · 基础](./guide-line/base)：坐标系细节、字体与中文（fontkit + subset）、颜色、加删页与基础排版。
