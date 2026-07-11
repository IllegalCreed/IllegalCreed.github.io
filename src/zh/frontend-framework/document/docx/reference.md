---
layout: doc
outline: [2, 3]
---

# 参考

> docx **常用类、构造选项、枚举与单位** 速查。版本基线 **9.7.1**（MIT）。

## 速查

- Node 导出：`await Packer.toBuffer(doc)`；浏览器下载：`await Packer.toBlob(doc)`
- Web 二进制接口：`await Packer.toArrayBuffer(doc)`；通用底层出口：`await Packer.pack(doc, outputType)`
- `toBuffer`、`toBlob`、`toArrayBuffer`、`toBase64String`、`toString` 返回 Promise；只有 `toStream` 立即返回 Stream
- 9.7.1 的 `toStream` 仍先生成完整 Buffer 再发出，不是增量 OOXML/ZIP 生成器
- `ImageRun.data` 支持 Buffer、字符串、Uint8Array、ArrayBuffer，不接受 Blob；SVG 另需 `fallback`
- 模板补丁默认识别 <code v-pre>{{tag}}</code>；可先用 `await patchDetector({ data })` 枚举占位符

## 一、核心类与对象层级

| 类 | 作用 | 嵌套位置 |
|---|---|---|
| `Document` | 文档根，`new Document({ sections, ... })` | 最外层 |
| section（普通对象） | 节：页面/页眉脚 + `children` | `Document.sections[]` |
| `Paragraph` | 段落 | `section.children[]` / 单元格 |
| `TextRun` | 带样式文本片段 | `Paragraph.children[]` |
| `ImageRun` | 图片 | `Paragraph.children[]` |
| `ExternalHyperlink` / `InternalHyperlink` | 外链 / 站内跳转 | `Paragraph.children[]` |
| `Table` / `TableRow` / `TableCell` | 表格三件套 | `section.children[]` |
| `Header` / `Footer` | 页眉 / 页脚 | `section.headers/footers` |
| `TableOfContents` | 目录 | `section.children[]` |
| `Bookmark` | 书签锚点 | `Paragraph.children[]` |
| `Math` / `MathRun` | 数学公式 | `Paragraph.children[]` |
| `Packer` | 打包导出（静态方法） | — |

## 二、Packer 导出方法

| 方法 | 返回 | 场景 |
|---|---|---|
| `Packer.pack<T>(doc, type, prettify?, overrides?)` | `Promise<OutputByType[T]>` | 按输出类型统一调用 |
| `Packer.toBuffer(doc, prettify?, overrides?)` | `Promise<Buffer>` | Node 写盘 / HTTP 响应 |
| `Packer.toBlob(doc, ...)` | `Promise<Blob>` | 浏览器下载（配 `saveAs`） |
| `Packer.toArrayBuffer(doc, ...)` | `Promise<ArrayBuffer>` | 浏览器 Web API / 跨线程传输 |
| `Packer.toBase64String(doc, ...)` | `Promise<string>` | 内嵌 / 传输 |
| `Packer.toString(doc, ...)` | `Promise<string>`（ZIP 二进制字符串） | 兼容旧接口；不是 OOXML 源文本 |
| `Packer.toStream(doc, ...)` | `Stream`（同步返回） | 对接 Node 流接口 |

> 除 `toStream` 外均异步返回 Promise。9.7.1 的 `toStream` 内部仍先 `generateAsync({ type: 'nodebuffer' })`，完成后一次发出 Buffer，因此不能据此推断内存峰值更低。`prettify` 控制包内 XML 缩进；`overrides` 覆写包内子文件。

## 三、Document 常用选项

| 选项 | 类型 | 说明 |
|---|---|---|
| `sections` | array | **唯一必填**，节数组 |
| `creator`/`title`/`subject`/`description`/`keywords` | string | 文档属性元数据 |
| `styles` | object | 命名样式（`paragraphStyles`/`characterStyles`/`default`） |
| `numbering` | object | 编号方案（`config[]`） |
| `fonts` | array | 内嵌字体（`{ name, data }`） |
| `features` | object | 如 `updateFields`（目录字段更新） |
| `evenAndOddHeaderAndFooters` | boolean | 启用奇偶页不同页眉脚 |

## 四、section 常用属性

| 属性 | 说明 |
|---|---|
| `children` | 块级内容（Paragraph/Table/TOC…） |
| `properties.page.size` | 纸张：`{ width, height, orientation }`（`PageOrientation`） |
| `properties.page.margin` | 页边距（twips） |
| `properties.page.pageNumbers` | 页码：`{ start, formatType }` |
| `properties.column` | 分栏 |
| `headers` / `footers` | `{ default, first, even }`（值为 Header/Footer） |

## 五、Paragraph 常用选项

| 选项 | 类型 | 说明 |
|---|---|---|
| `text` | string | 纯文本简写 |
| `children` | array | TextRun/ImageRun/Hyperlink 等 |
| `heading` | `HeadingLevel` | `HEADING_1`~`6`、`TITLE` |
| `alignment` | `AlignmentType` | `START`/`CENTER`/`END`/`BOTH` 等 |
| `spacing` | object | `{ before, after, line, lineRule }`（twips） |
| `indent` | object | `{ left, right, firstLine, hanging }`（twips） |
| `bullet` | object | `{ level }`（无序列表 0~8，共 9 级） |
| `numbering` | object | `{ reference, level, instance? }`（有序/多级） |
| `style` | string | 引用命名样式 id |
| `border` | object | 段落边框 |
| `pageBreakBefore` | boolean | 段前分页 |

## 六、TextRun 常用选项

| 选项 | 类型 | 说明 |
|---|---|---|
| `text` | string | 文本内容 |
| `bold` / `italics` / `strike` | boolean | 粗 / 斜（**复数**）/ 删除线 |
| `underline` | object | `{ type: UnderlineType, color }` |
| `size` | number | 字号 **half-points**（pt×2） |
| `color` | string | 字色，不带 `#` 的 hex |
| `font` | string | 字体名 |
| `highlight` | string | 突出显示（预设色名 yellow/green…） |
| `shading` | object | 底纹 `{ type, fill, color }`（任意 hex） |
| `superScript` / `subScript` | boolean | 上标 / 下标 |
| `allCaps` / `smallCaps` | boolean | 全大写 / 小型大写 |
| `break` | number | 同段内换行次数 |
| `children` | array | 可含 `PageNumber.CURRENT`/`TOTAL_PAGES` |

## 七、Table / Cell 常用

| 项 | 写法 |
|---|---|
| 建表 | `new Table({ rows: [...], width })` |
| 行 | `new TableRow({ children: [Cell...], tableHeader?, height? })` |
| 单元格 | `new TableCell({ children: [Paragraph...] })` |
| 横向合并 | 单元格 `columnSpan: N` |
| 纵向合并 | 单元格 `rowSpan: N` |
| 宽度 | `width: { size, type: WidthType.XXX }` |
| 单元格背景 | `shading: { fill: 'DDDDDD' }` |
| 边框 | `borders: { top/bottom/left/right: { style: BorderStyle, size, color } }` |

## 八、ImageRun 选项

| 选项 | 说明 |
|---|---|
| `type` | `'png'` / `'jpg'` / `'gif'` / `'bmp'` / `'svg'` |
| `data` | Buffer / 字符串（如 Base64）/ Uint8Array / ArrayBuffer；**不含 Blob** |
| `transformation` | `{ width, height }`（像素） |
| `floating` | 浮动定位（offset 单位 **EMU**） + `wrap` 环绕 |
| `fallback` | SVG 必备的回退位图 |
| `altText` | `{ name, title, description }` |

## 九、常用枚举

| 枚举 | 取值（部分） |
|---|---|
| `HeadingLevel` | `HEADING_1`~`HEADING_6`、`TITLE` |
| `AlignmentType` | `START`/`LEFT`、`CENTER`、`END`/`RIGHT`、`BOTH`/`JUSTIFIED` |
| `WidthType` | `DXA`(twips)、`PERCENTAGE`、`AUTO`、`NIL` |
| `UnderlineType` | `SINGLE`、`DOUBLE`、`DOTTED`、`DASH`、`WAVE` … |
| `BorderStyle` | `SINGLE`、`DOUBLE`、`DASHED`、`DOTTED`、`THICK` … |
| `LevelFormat` | `DECIMAL`、`UPPER_ROMAN`、`LOWER_LETTER`、`BULLET` … |
| `PageOrientation` | `PORTRAIT`、`LANDSCAPE` |
| `ShadingType` | `CLEAR`、`SOLID` … |
| `PatchType` | `PARAGRAPH`、`DOCUMENT` |

## 十、单位换算速查

| 单位 | 用于 | 换算 |
|---|---|---|
| **half-point（半磅）** | 字号 `size` | 1pt = 2；12pt → 24 |
| **twip（DXA）** | 间距 / 宽度 / 页边距 | 1pt = 20；1 inch = 1440 |
| **EMU** | 图片 / 绘图 / 浮动偏移 | 1 inch = 914400；1 cm = 360000 |
| 颜色 | `color`/`fill` | 不带 `#` 的 6 位 hex（如 `'FF0000'`） |

## 十一、patchDocument（模板补丁）

```ts
const keys = await patchDetector({ data: templateBuffer });

await patchDocument({
  outputType: 'nodebuffer',   // 或 'uint8array' / 'blob' / 'base64'
  data: templateBuffer,       // 已有 .docx 模板
  patches: {
    name: { type: PatchType.PARAGRAPH, children: [new TextRun('Ada')] },
    intro: { type: PatchType.DOCUMENT, children: [new Paragraph('整段内容')] },
  },
  keepOriginalStyles: true,
  placeholderDelimiters: { start: '{{', end: '}}' },
  recursive: false,
});
```

> 模板默认用 <code v-pre>{{tag}}</code> 占位；`patchDetector` 返回模板中的 key。`PARAGRAPH` 在原段内替换，`DOCUMENT` 替换整个段落级元素；`placeholderDelimiters` 可改分隔符，`recursive` 控制补丁产生的新占位符是否继续处理。

---

速查完毕，回 [指南 · 基础](./guide-line/base) 理解对象模型，或 [指南 · 进阶](./guide-line/advanced) 看表格/图片/页眉脚实战。
