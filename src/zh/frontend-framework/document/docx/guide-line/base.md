---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **9.7.1**。本篇把「会生成」用到「懂模型」：Document/Section/Paragraph/TextRun 对象树、Document 的常用选项、TextRun 文本样式全家桶、单位换算（半磅 / twips / EMU）、标题与对齐、列表与编号。

## 速查

- 对象树：`Document.sections[] → Paragraph/Table → TextRun/ImageRun`
- `new Document({ sections })` 中 `sections` 必填；页面、页眉页脚等属性属于各个 section
- 段落级：`heading`、`alignment`、`spacing`、`bullet`、`numbering`；字符级：`bold`、`italics`、`size`、`color`
- 单位：字号用 half-point（12pt = 24），间距/宽度常用 twip（1in = 1440），绘图偏移用 EMU（1in = 914400）
- `HeadingLevel.HEADING_1`、`TITLE`、`ListParagraph` 等常用内置样式由库提供；只有自定义样式才需要在 `Document.styles` 定义
- 有序列表先在 `Document.numbering.config` 定义方案，再由段落用 `{ reference, level }` 引用

## 一、对象模型：四层结构

docx 用一棵声明式对象树描述文档，外层包内层：

```text
Document（文档）
└── sections: [                       // 一个或多个「节」
      {
        properties: { page: {...} },  // 节级页面属性：纸张/页边距/页码
        headers / footers: {...},     // 节级页眉页脚
        children: [                   // 块级内容
          Paragraph（段落）
          └── children: [             // 行内内容
                TextRun（带样式文本）
                ImageRun（图片）
                ExternalHyperlink（超链接）
              ]
          Table（表格）
          TableOfContents（目录）
        ]
      }
    ]
```

记牢三句话：**文档含节、节含段落、段落含文本片段**；样式分两级——**段落级**（对齐、标题、间距、列表）落在 Paragraph，**字符级**（粗斜体、字号、颜色）落在 TextRun。

## 二、Document 的常用选项

`new Document({ ... })` 里只有 `sections` 必填，其余皆可选：

```ts
const doc = new Document({
  creator: '张三',           // 作者元数据
  title: '季度报告',
  description: '自动生成',
  styles: { /* 命名样式，见进阶 */ },
  numbering: { config: [/* 编号方案 */] },
  features: { updateFields: true }, // 让 Word 打开时更新目录等字段
  sections: [{ children: [new Paragraph('正文')] }], // 必填
});
```

> `creator`/`title`/`description` 等是写进文档属性（右键「属性」可见）的元数据；`styles`/`numbering` 是文档级样式与编号定义；`features.updateFields` 与目录相关。

## 三、TextRun：字符级样式全家桶

TextRun 是「带样式的文本片段」，常用属性：

```ts
new TextRun({
  text: '示例',
  bold: true,            // 粗体
  italics: true,         // 斜体（注意复数 italics！）
  strike: true,          // 删除线
  underline: { type: UnderlineType.SINGLE, color: 'FF0000' }, // 下划线
  size: 24,              // 字号：half-points，24 = 12pt
  color: '2E74B5',       // 字色：不带 # 的十六进制
  font: 'Arial',         // 字体名
  highlight: 'yellow',   // 记号笔高亮（预设色名）
  allCaps: true,         // 全大写
  superScript: true,     // 上标（subScript 为下标）
});
```

| 属性 | 说明 | 易错点 |
|---|---|---|
| `italics` | 斜体 | 是复数，不是 `italic` |
| `size` | 字号 | half-points，pt×2 |
| `color` | 字色 | 不带 `#` 的 hex |
| `highlight` | 突出显示 | 只认预设色名（yellow/green…），任意色用 `shading` |
| `underline` | 下划线 | 是对象 `{ type, color }`，type 取 `UnderlineType` |

## 四、单位换算：三套要分清

docx 沿用 OOXML 的单位，不同场景不同：

| 单位 | 用于 | 换算 |
|---|---|---|
| **half-point（半磅）** | 字号 `size` | 1pt = 2；12pt → 24 |
| **twip（DXA）** | 段间距 `spacing`、表格/段落宽度 | 1pt = 20；1 inch = 1440 |
| **EMU** | 图片/绘图/浮动定位 offset | 1 inch = 914400；1 cm = 360000 |

```ts
// 段前 12pt、段后 6pt（twips）
new Paragraph({ spacing: { before: 240, after: 120 }, text: '段落' });
```

> 记忆法：**字号半磅、间距/宽度 twips、绘图 EMU**。混用单位是新手最常见的「尺寸不对」来源。

## 五、标题与对齐

```ts
import { Paragraph, HeadingLevel, AlignmentType } from 'docx';

new Paragraph({ text: '一级标题', heading: HeadingLevel.HEADING_1 });
new Paragraph({ text: '副标题',   heading: HeadingLevel.TITLE });
new Paragraph({ text: '两端对齐', alignment: AlignmentType.JUSTIFIED });
```

- `heading` 取 **HeadingLevel** 枚举：`HEADING_1`~`HEADING_6`、`TITLE`。它不仅套用标题样式，也是后续生成目录（TOC）识别层级的依据。
- `alignment` 取 **AlignmentType** 枚举：`START`/`LEFT`、`CENTER`、`END`/`RIGHT`、`BOTH`/`JUSTIFIED`。

::: tip 内置样式与自定义样式
9.7.1 会把 `Title`、`Heading1`~`Heading6`、`ListParagraph` 等常用内置样式写入文档，直接使用 `HeadingLevel` 或 `bullet` 不必重复定义。只有业务自己的样式 ID（如 `myHeading`）才需要在 `Document.styles` 中注册，详见[进阶 · 命名样式](./advanced)。
:::

## 六、无序列表：bullet

```ts
new Paragraph({ text: '第一层', bullet: { level: 0 } });
new Paragraph({ text: '第二层', bullet: { level: 1 } }); // 缩进一级
```

> `bullet.level` 从 0（顶层）到 8（第 9 级），控制嵌套缩进。**有序/多级编号**（1./1.1/a)）不用 bullet，要用 `numbering`，见下。

## 七、有序与多级编号：numbering

编号方案在**文档级**定义、段落级引用：

```ts
import { Document, Paragraph, LevelFormat, AlignmentType } from 'docx';

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'my-numbering',           // 方案名
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2)', alignment: AlignmentType.START },
        ],
      },
    ],
  },
  sections: [
    {
      children: [
        new Paragraph({ text: '一', numbering: { reference: 'my-numbering', level: 0 } }),
        new Paragraph({ text: '子项', numbering: { reference: 'my-numbering', level: 1 } }),
      ],
    },
  ],
});
```

> `LevelFormat` 提供 `DECIMAL`、`UPPER_ROMAN`、`LOWER_LETTER` 等；`text: '%1.'` 里的 `%1` 是「本级序号占位」。段落用 `numbering: { reference, level }` 挂到方案上。

---

进入 [指南 · 进阶](./advanced)：表格、图片、页眉页脚与页码、命名样式（styles）、多 section 分区排版。
