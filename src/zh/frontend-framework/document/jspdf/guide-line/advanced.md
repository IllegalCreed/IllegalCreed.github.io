---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **4.x**。把 jsPDF 用进真实项目：`addImage` 嵌图、`jspdf-autotable` 自动分页表格、`.html()` 栅格化导出、多页页眉页脚与全页页码、导出形态（下载/上传/预览）。

## 一、嵌入图片：addImage

```ts
addImage(imageData, format, x, y, w, h, alias?, compression?, rotation?);
```

`imageData` 可以是 Base64 DataURL、`HTMLImageElement`、`HTMLCanvasElement` 或 `Uint8Array`：

```ts
// 来自 <img> 元素
const img = document.querySelector('img');
doc.addImage(img, 'PNG', 10, 10, 50, 30);

// 来自 DataURL（如 canvas.toDataURL()）
doc.addImage(dataUrl, 'JPEG', 10, 50, 50, 30, undefined, 'FAST');
```

> `addImage` 不会自动 `fetch` URL——需自己先拿到 DataURL/元素/字节。`compression` 取 `'NONE'`/`'FAST'`/`'MEDIUM'`/`'SLOW'` 控制图片压缩。

## 二、矢量 SVG：用 svg2pdf

`addImage` 处理的是**栅格**位图。要让 SVG 保持矢量（缩放不糊），用 `svg2pdf.js` 配合高级 API：

```ts
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

const doc = new jsPDF();
const svgEl = document.querySelector('svg');
await doc.svg(svgEl, { x: 10, y: 10, width: 80, height: 60 });
doc.save('vector.pdf');
```

> 若只想把 SVG 当图片栅格化，可用 canvg 先画到 canvas 再 `addImage`（但那就变位图了）。

## 三、表格：jspdf-autotable

手画表格繁琐，社区标准方案是 `jspdf-autotable`，支持自动分页、主题、列样式、单元格钩子。

```ts
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const doc = new jsPDF();
autoTable(doc, {
  head: [['ID', '姓名', '城市']],
  body: [
    [1, '张三', '北京'],
    [2, '李四', '上海'],
  ],
  startY: 20,
  theme: 'striped', // 'striped' | 'grid' | 'plain'
  headStyles: { fillColor: [41, 128, 185] },
});
doc.save('table.pdf');
```

用对象数组 + `columns`：

```ts
autoTable(doc, {
  columns: [
    { header: 'ID', dataKey: 'id' },
    { header: '姓名', dataKey: 'name' },
  ],
  body: [{ id: 1, name: '张三' }],
});
```

直接读页面 DOM 表（仍是矢量可选文字，区别于 `.html()` 截图）：

```ts
autoTable(doc, { html: '#my-table', theme: 'grid' });
```

## 四、表格衔接：lastAutoTable.finalY

画完一张表后，下一块内容用 `doc.lastAutoTable.finalY` 定位起点：

```ts
autoTable(doc, { head, body: rows1 });
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 10, // 接在上表下方
  head,
  body: rows2,
});
```

单元格级定制用钩子：

```ts
autoTable(doc, {
  head, body,
  didParseCell(data) {        // 绘制前：改文本/样式
    if (data.section === 'body' && data.column.dataKey === 'amount') {
      data.cell.styles.halign = 'right';
    }
  },
  didDrawCell(data) {         // 画完后：叠加图片/链接
    // doc.addImage(...) 叠在该单元格上
  },
});
```

## 五、html()：把 DOM 栅格化进 PDF

`.html()` 借 **html2canvas 把 DOM 截图成位图**再嵌入。**注意：产出的文字是图片像素，不可选、不可搜、缩放会糊**——这与原生 `text()` 的矢量文字本质不同。

```ts
const doc = new jsPDF('p', 'mm', 'a4');
await doc.html(document.getElementById('content'), {
  callback: (doc) => doc.save('from-html.pdf'), // 异步：必须在 callback 里导出
  x: 10,
  y: 10,
  width: 180,        // PDF 中目标宽度
  windowWidth: 800,  // 渲染时的源窗口宽度（CSS 像素）
  autoPaging: 'text',// 'text' 尽量不切断文字 | 'slice'/true 硬切 | false 不分页
  html2canvas: { scale: 2, useCORS: true }, // 提清晰度 / 允许跨域图片
});
```

> html2canvas 渲染是**异步**的，必须在 `callback`（首参是 doc 实例）里或 `await` 后再 `save`/`output`；HTML **字符串**输入还会用到 dompurify 净化（务必先 sanitize 不可信内容）。

## 六、多页：页眉、页脚、全页页码

内容画完后统一加全页页码（先画完才知道总页数）：

```ts
// ……前面画了若干内容、addPage()……
const total = doc.getNumberOfPages();
const w = doc.internal.pageSize.getWidth();
const h = doc.internal.pageSize.getHeight();

for (let i = 1; i <= total; i++) {
  doc.setPage(i);                 // 切到第 i 页
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`${i} / ${total}`, w / 2, h - 10, { align: 'center' });
}
doc.save('paged.pdf');
```

> 用 autotable 时，页眉页脚更适合放进 `didDrawPage(data)` 钩子，逐页绘制。

## 七、导出：下载 / 上传 / 预览

```ts
// ① 下载
doc.save('report.pdf');

// ② 上传后端（拿 Blob 塞进 FormData）
const blob = doc.output('blob');
const fd = new FormData();
fd.append('file', blob, 'report.pdf');
await fetch('/api/upload', { method: 'POST', body: fd });

// ③ iframe 预览（不下载）
iframe.src = doc.output('bloburl');
```

> 大文件预览优先 `bloburl`（对象 URL），别用 `datauristring`（超长 base64，受 URL 长度/性能限制）。

---

进入 [指南 · 专家](./guide-line/expert)：中文字体嵌入与子集化、矢量 vs html() 取舍、Node 服务端生成、`compress`/`putOnlyUsedFonts` 瘦身、与 pdfmake/@react-pdf/pdf-lib 的选型。
