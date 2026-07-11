---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **9.7.1**。把 docx 用进真实文档：表格 `Table`、图片 `ImageRun`、页眉页脚与页码、命名样式 `styles`（像 CSS 一样复用）、多 section 分区排版、目录 TOC。

## 速查

- 表格层级：`Table → TableRow → TableCell → Paragraph`，单元格不能直接放字符串
- 图片：`new ImageRun({ type, data, transformation })`；`data` 支持 Buffer、字符串、Uint8Array、ArrayBuffer，不支持 Blob
- SVG 必须提供 `fallback` 栅格图；远程图片要先自行 `fetch(...).arrayBuffer()`
- 页眉页脚放在 section 的 `headers` / `footers`；页码用 `PageNumber` 字段，由 Word 排版时计算
- 自定义命名样式：在 `Document.styles` 定义、段落用 `style: id` 引用；常用 Heading/List 内置样式无需重定义
- TOC 依赖 `HeadingLevel` 与域更新，`features.updateFields: true` 只请求阅读器打开时更新

## 一、表格：Table → Row → Cell → Paragraph

表格是四层结构，单元格里放的是**段落**（不能直接塞字符串）：

```ts
import { Table, TableRow, TableCell, Paragraph, WidthType } from 'docx';

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, // 整表占页宽 100%
  rows: [
    new TableRow({
      tableHeader: true, // 表头行（跨页时重复）
      children: [
        new TableCell({ children: [new Paragraph('姓名')] }),
        new TableCell({ children: [new Paragraph('年龄')] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('张三')] }),
        new TableCell({ children: [new Paragraph('20')] }),
      ],
    }),
  ],
});
```

> 把它当作 section 的一个 child 放进 `children` 即可。**数据驱动**时常用 `rows.map(...)` 按数组生成行——这正是 docx 的长处。

### 合并单元格与宽度

```ts
new TableCell({ columnSpan: 2, children: [new Paragraph('横跨两列')] }); // 类似 colspan
new TableCell({ rowSpan: 3, children: [new Paragraph('纵跨三行')] });    // 类似 rowspan

// 宽度：百分比 / twips（DXA）
new TableCell({ width: { size: 4535, type: WidthType.DXA }, children: [/*...*/] });
```

> `WidthType` 取 `PERCENTAGE`（百分比）、`DXA`（twips，1/20 磅）、`AUTO`、`NIL`。单元格背景用 `shading: { fill: 'DDDDDD' }`（不带 `#` 的 hex）。

## 二、图片：ImageRun 放进段落

图片用 `ImageRun`，**必须装在某个 Paragraph 的 children 里**：

```ts
import { Paragraph, ImageRun } from 'docx';
import * as fs from 'fs';

new Paragraph({
  children: [
    new ImageRun({
      type: 'png',                // 显式声明格式：png/jpg/gif/bmp/svg
      data: fs.readFileSync('logo.png'), // Buffer / Uint8Array / ArrayBuffer / Base64 字符串
      transformation: { width: 120, height: 120 }, // 像素尺寸
    }),
  ],
});
```

> `data` 必须是**已读入的二进制或 Base64**，库不会替你下载 URL。浏览器里用 `await (await fetch(url)).arrayBuffer()` 先取数据。SVG 需 `type:'svg'` 且额外提供回退位图（见专家篇）。

### 浮动图片（带文字环绕）

```ts
import { TextWrappingType, TextWrappingSide } from 'docx';

new ImageRun({
  type: 'png',
  data: buffer,
  transformation: { width: 200, height: 100 },
  floating: {
    horizontalPosition: { offset: 1014400 }, // 偏移单位是 EMU（1in=914400）
    verticalPosition: { offset: 1014400 },
    wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
  },
});
```

## 三、页眉页脚与页码

页眉页脚是**节级**配置，用 `Header`/`Footer` 对象：

```ts
import { Document, Header, Footer, Paragraph, TextRun, PageNumber, AlignmentType } from 'docx';

const doc = new Document({
  sections: [
    {
      headers: {
        default: new Header({ children: [new Paragraph('公司机密')] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  // 页码与总页数是「字段」，由 Word 打开时计算
                  children: ['第 ', PageNumber.CURRENT, ' 页 / 共 ', PageNumber.TOTAL_PAGES, ' 页'],
                }),
              ],
            }),
          ],
        }),
      },
      children: [new Paragraph('正文')],
    },
  ],
});
```

> `headers`/`footers` 支持 `default`（默认/奇数页）、`first`（需节属性 `titlePage: true`）、`even`（需文档级 `evenAndOddHeaderAndFooters: true`）。页码不能用 JS 自己算——生成时还不知道分页，必须用 `PageNumber.CURRENT`/`TOTAL_PAGES` 字段。

## 四、命名样式：像 CSS 一样复用

把重复样式集中在 `Document.styles` 定义、段落用 `style: id` 引用：

```ts
const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: 'myHeading',           // 用来引用的 id
        name: 'My Heading',        // UI 里的显示名
        basedOn: 'Normal',         // 继承自
        next: 'Normal',            // 下一段默认样式
        quickFormat: true,
        run: { size: 32, bold: true, color: '2E74B5' }, // 字符级
        paragraph: { spacing: { after: 120 } },          // 段落级
      },
    ],
  },
  sections: [
    { children: [new Paragraph({ text: '用命名样式的标题', style: 'myHeading' })] },
  ],
});
```

> 思路同外部 CSS：样式与内容分离、一处定义多处复用。9.7.1 已提供 `Heading1`~`Heading6`、`Title`、`ListParagraph` 等常用内置定义；这里的 `styles` 主要用于注册业务自己的样式 ID 或覆盖默认表现。

## 五、多 section：分区排版

不同 section 可有各自的页面布局/页眉页脚/页码——典型如「封面一种页眉、正文换页眉并重启页码、附录横向」：

```ts
import { PageOrientation } from 'docx';

const doc = new Document({
  sections: [
    { children: [new Paragraph('封面')] }, // 第 1 节
    {
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } }, // 第 2 节横向
      children: [new Paragraph('横向的附录表格')],
    },
  ],
});
```

> 每个 section 都能带自己的 `properties`（页面）、`headers`、`footers`。所有节仍打包进**同一个** `.docx`。

## 六、目录（TOC）

```ts
import { Document, TableOfContents, Paragraph, HeadingLevel } from 'docx';

const doc = new Document({
  features: { updateFields: true }, // 关键：让 Word 打开时更新域
  sections: [
    {
      children: [
        new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-5' }),
        new Paragraph({ text: '第一章', heading: HeadingLevel.HEADING_1 }),
        new Paragraph('章节正文……'),
      ],
    },
  ],
});
```

::: warning 目录内容由 Word 生成
TOC 是「字段」，docx 只放占位；**真实目录条目与页码由 Word 打开时更新域才生成**（会弹「是否更新域」提示）。且标题必须用 `HeadingLevel` 才能被收录。
:::

---

进入 [指南 · 专家](./expert)：浏览器/Node 导出全解、流式写大文件、内嵌字体、SVG、`patchDocument` 模板补丁、`.docx` 内部结构，以及与 docxtemplater / mammoth 的选型。
