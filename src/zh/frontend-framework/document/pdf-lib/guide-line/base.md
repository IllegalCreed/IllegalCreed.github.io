---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **1.17.1**。本篇把「会画」用到「画对」：左下角坐标系、标准字体与**中文字体（fontkit + subset）**、颜色辅助函数、加删页与基础排版（居中、换行、底框）。

## 速查

- 坐标：左下角为原点，单位 point，A4 约 `595 × 842`；向下排版要递减 y
- 标准字体：先 `embedFont(StandardFonts.Helvetica)`，再把返回的 `PDFFont` 传给 `drawText`
- 中文：`registerFontkit(fontkit)` + 嵌入覆盖 CJK 的 TTF/OTF；`subset: true` 是体积优化，不是所有字体都兼容
- 测量：`font.widthOfTextAtSize()` / `heightAtSize()`，可用于居中和底框
- 换行：显式 `\n`，或使用 `maxWidth` + `lineHeight`
- 页操作：`addPage`、`insertPage`、`removePage`；批量删除时从后向前

## 一、坐标系：左下角原点、y 向上

PDF 把页面原点定在**左下角**，**y 轴向上为正**，单位是 **point**（72pt = 1 英寸，A4 ≈ 595×842pt）。这与 canvas/CSS 相反，是最容易翻车的地方。

```ts
const { width, height } = page.getSize();

// 顶部：y 大 → 用 height - margin
page.drawText('顶部', { x: 40, y: height - 40, size: 12, font });
// 底部：y 小
page.drawText('底部', { x: 40, y: 40, size: 12, font });
```

> 记忆法：**y 越大越往上**。要往下排版，就让 y 递减（或用 `page.moveDown(n)`）。

## 二、字体：标准 14 字体

即使是内置字体，drawText 也要先 `embed` 拿到 **PDFFont 对象**——`font` 选项要的是对象，不是字符串名。

```ts
import { StandardFonts } from 'pdf-lib';

const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
// 等价：await pdfDoc.embedStandardFont(StandardFonts.Helvetica)
```

标准 14 字体：`Helvetica`、`TimesRoman`、`Courier`（各含 Bold/Italic 变体）、`Symbol`、`ZapfDingbats`。

::: warning 标准字体只支持 Latin
这 14 个字体只覆盖 **WinAnsi（Windows-1252）约 218 个 Latin 字符**，**不含中文/西里尔/阿拉伯**。用 Helvetica 写中文会乱码或报错——根因是**缺字形**，不是编码问题。
:::

## 三、中文：fontkit + 嵌入字体

写中文必须嵌入支持 CJK 的自定义字体（如思源黑体 Noto Sans SC），且嵌入**自定义**字体前要先注册 `@pdf-lib/fontkit`。

```ts
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const pdfDoc = await PDFDocument.create();

// 关键：注册 fontkit（否则 embedFont 自定义字节会抛错）
pdfDoc.registerFontkit(fontkit);

// fontBytes 来自 fs.readFileSync('NotoSansSC.ttf') 或 fetch().arrayBuffer()
const cnFont = await pdfDoc.embedFont(fontBytes, { subset: true });

const page = pdfDoc.addPage();
page.drawText('你好，pdf-lib！', {
  x: 50,
  y: 700,
  size: 24,
  font: cnFont,
  color: rgb(0, 0, 0),
});
```

::: tip subset 是重要的体积优化
中文字体动辄数 MB，全量嵌入会让 PDF 很大。`embedFont(bytes, { subset: true })` 只嵌入文档实际用到的字形，通常能明显缩小文件；子集化依赖 fontkit，但官方也提示它并非适配所有字体。生成后要用目标阅读器检查字形，遇到缺字或损坏时去掉 `subset` 再验证。
:::

## 四、颜色：用辅助函数，分量 0~1

颜色不是 CSS 字符串，要用辅助函数构造，且分量是 **0~1**（不是 0~255）。

```ts
import { rgb, cmyk, grayscale } from 'pdf-lib';

rgb(1, 0, 0);          // 红
rgb(0, 0.53, 0.71);    // 一种蓝
cmyk(0, 1, 1, 0);      // CMYK 红（印刷）
grayscale(0.5);        // 50% 灰
```

> drawText 不传 `color` 默认黑色 `rgb(0,0,0)`。想改某页默认色用 `page.setFontColor(color)`。

## 五、加 / 删 / 插 页

```ts
import { PageSizes } from 'pdf-lib';

const a4 = pdfDoc.addPage(PageSizes.A4);   // 末尾加 A4 页
pdfDoc.insertPage(0, [400, 600]);          // 在最前插一页 400x600
pdfDoc.removePage(2);                       // 删除第 3 页（索引 2）

console.log(pdfDoc.getPageCount());         // 页数
const pages = pdfDoc.getPages();            // PDFPage[]
```

> 连续删多页要注意索引位移，**从后往前删**最稳：`for (let i = n-1; i >= 0; i--) doc.removePage(i)`。

## 六、排版技巧一：水平居中

用 `widthOfTextAtSize` 测宽，再算居中 x：

```ts
const text = '居中标题';
const size = 28;
const textWidth = font.widthOfTextAtSize(text, size);
const { width } = page.getSize();

page.drawText(text, {
  x: (width - textWidth) / 2,  // 居中
  y: 720,
  size,
  font,
});
```

## 七、排版技巧二：多行与自动换行

字符串里的 `\n` 会被识别为换行；超长段落用 `maxWidth` 自动按词换行，`lineHeight` 控行距。

```ts
// 显式换行
page.drawText('第一行\n第二行\n第三行', {
  x: 50, y: 650, size: 16, font, lineHeight: 22,
});

// 自动换行：到 220pt 宽就折行
const para = 'This is a long paragraph that will wrap automatically based on maxWidth.';
page.drawText(para, {
  x: 50, y: 560, size: 14, font, maxWidth: 220, lineHeight: 18,
});
```

## 八、排版技巧三：给文字加底框

测出文本宽高，再 `drawRectangle` 画一个等大的框：

```ts
const text = '带框文字';
const size = 20;
const tw = font.widthOfTextAtSize(text, size);
const th = font.heightAtSize(size);
const x = 60, y = 450;

page.drawText(text, { x, y, size, font });
page.drawRectangle({
  x, y, width: tw, height: th,
  borderColor: rgb(1, 0, 0),
  borderWidth: 1.5,
  // 不传 color 就只有边框、无填充
});
```

## 九、画基础图形

```ts
// 矩形（填充 + 边框）
page.drawRectangle({ x: 50, y: 300, width: 120, height: 60,
  color: rgb(0.9, 0.9, 0.95), borderColor: rgb(0.4,0.4,0.5), borderWidth: 1 });

// 直线（端点是 {x,y} 对象，线宽是 thickness）
page.drawLine({ start: { x: 50, y: 280 }, end: { x: 300, y: 280 },
  thickness: 1, color: rgb(0,0,0) });

// 圆（x/y 是圆心，size 是半径）
page.drawCircle({ x: 100, y: 200, size: 30, color: rgb(0.2,0.7,0.4) });
```

---

进入 [指南 · 进阶](./advanced)：修改既有 PDF、copyPages 合并、表单填写与扁平化、浏览器/Node 实战、嵌图与缩放。
