---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 docx 并完成第一份文档的「生成 → 导出」。版本基线 **9.x**。核心认知：**Document → Section → Paragraph → TextRun 声明式对象树**，外加一条贯穿全篇的环境差异——**Node 用 `Packer.toBuffer` 写盘、浏览器用 `Packer.toBlob` 下载**。

## 速查

- 安装：`npm install docx`（自带 TS 类型，无需 `@types`）
- 导入：`import { Document, Packer, Paragraph, TextRun } from 'docx'`
- 最小结构：`new Document({ sections: [{ children: [new Paragraph('Hello')] }] })`
- 导出（Node）：`Packer.toBuffer(doc).then(buf => fs.writeFileSync('out.docx', buf))`
- 导出（浏览器）：`Packer.toBlob(doc).then(blob => saveAs(blob, 'out.docx'))`
- 段内混排样式：`new Paragraph({ children: [new TextRun({ text: '粗', bold: true }), new TextRun('普通')] })`
- ⚠️ Packer 方法都是**异步**（返回 Promise），且**字号单位是 half-points**（12pt → `size: 24`）

## 一、docx 是什么

官方定位：「**generate and modify .docx files with JS/TS**」。三个关键点：

1. **生成导向**：用代码「描述」一份 Word 文档，而非解析已有文档（解析转 HTML 是 mammoth 的事）。
2. **不依赖 Word**：纯 JS 直接产出 OOXML（`.docx` 本质是 ZIP 包），服务端/CI/浏览器都能跑。
3. **声明式对象树**：用 `Document`/`Paragraph`/`TextRun` 等类搭结构，最后交给 `Packer` 序列化。

> 边界提醒：docx 主攻「生成」。要把上传的 `.docx` 读出来展示 → 用 mammoth；要往设计师排好的模板里填数据 → 用 docxtemplater（见[专家篇](./guide-line/expert)对比）。

## 二、安装

```bash
npm install docx
# pnpm / yarn 同理
pnpm add docx
yarn add docx
```

> 包名就是 `docx`，与微软官方无关（它是社区库 `dolanmiu/docx`）。库本身用 TypeScript 写成，自带类型声明。

## 三、导入方式

docx 用**具名导出**，按需引入用到的类与枚举：

```ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
```

> `Document`/`Paragraph`/`TextRun` 是结构类，`Packer` 是打包器，`HeadingLevel`/`AlignmentType` 等是枚举。

## 四、第一份文档（Node）

标准三步：搭对象树 → `Packer.toBuffer` → `fs` 写盘。

```ts
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';

// 1. 用对象树描述文档：Document 含 section，section.children 放段落
const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          children: [
            new TextRun('Hello '),
            new TextRun({ text: 'World', bold: true }), // 这片段加粗
          ],
        }),
      ],
    },
  ],
});

// 2. 打包成 Buffer（异步！）3. 写盘
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('My Document.docx', buffer);
});
```

> `sections` 是 Document **唯一必填**的选项；其余（`creator`/`title`/`styles` 等）都可选。

## 五、第一份文档（浏览器）

浏览器**没有 `fs`**，生成逻辑完全一样，只把导出换成 `toBlob` + 下载：

```ts
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';

const doc = new Document({
  sections: [{ children: [new Paragraph('在浏览器里生成')] }],
});

// toBlob 得到 Blob，再用 FileSaver 触发下载
Packer.toBlob(doc).then((blob) => {
  saveAs(blob, 'example.docx');
});
```

::: warning 不要在浏览器 import fs
浏览器无 Node 文件系统，`fs.writeFileSync` 不可用。下载一律走 `toBlob` → `saveAs`（或 `URL.createObjectURL` + `<a download>`）。另注意 `Packer.toBuffer` 在浏览器里返回的是 **`Uint8Array`** 而非 Node `Buffer`，所以浏览器下载首选 `toBlob`。
:::

## 六、段落与文本：简写 vs children

```ts
// 简写：纯文本一行搞定
new Paragraph('一段普通文字');

// children：同一段里混排不同样式的片段
new Paragraph({
  children: [
    new TextRun({ text: '重点', bold: true, color: 'FF0000' }), // 红色加粗
    new TextRun(' 与普通文字'),
  ],
});
```

> **TextRun 是带样式的文本片段**：把多个 TextRun 放进段落 `children`，就能在同一段里局部加粗、变色、加下划线。注意斜体属性名是 `italics`（复数）。

## 七、几个最常用的格式

```ts
new Paragraph({ text: '一级标题', heading: HeadingLevel.HEADING_1 }); // 标题
new Paragraph({ text: '居中', alignment: AlignmentType.CENTER });      // 对齐
new Paragraph({ text: '项目', bullet: { level: 0 } });                 // 无序列表
new TextRun({ text: '小字', size: 18 }); // 字号：half-points，18=9pt
```

::: tip 字号是「半磅」
`size` 的单位是 **half-points（半磅）**，所以「想要的磅数 ×2」：12pt 写 `24`、24pt 写 `48`。颜色 `color` 用**不带 `#`** 的十六进制串，如 `'FF0000'`。
:::

---

跑通生成与导出后，进入 [指南 · 基础](./guide-line/base)：对象模型细节、Paragraph/TextRun 常用属性、单位换算（半磅/twips）、标题与列表。
