---
layout: doc
---

# docx

::: tip 本篇范围
本篇聚焦 **docx（`dolanmiu/docx`）—— 用 JS/TS 以声明式对象树「生成（并可修改）」Word `.docx` 文件的库**，是「代码生成 Word」的事实标准。重点在：**`Document → Section → Paragraph → TextRun` 对象模型**、样式（粗斜体/字号/颜色/对齐）、表格 `Table`、图片 `ImageRun`、页眉页脚、列表/编号、`Packer.toBuffer/toBlob/...` 的环境差异（浏览器 vs Node），以及与 **docxtemplater（模板填充）/ mammoth（解析读取）** 的分工。版本基线 **9.x**（npm latest `9.7.1`，MIT 许可）。
:::

docx 的官方定位是「**Easily generate and modify .docx files with JS/TS. Works for Node and on the Browser**」。它**不依赖也不调用 Microsoft Word**——纯用 JavaScript 直接构造 OOXML（Office Open XML）并打包成 `.docx`（本质是一个 ZIP/OPC 容器，内含 `word/document.xml`、`styles.xml`、`[Content_Types].xml` 等部件）。因此在没装 Office 的服务器、CI、甚至浏览器里都能跑。

理解 docx 的关键是它的**声明式对象树**：最外层是 **Document**，含若干 **section（节）**；每个 section 的 `children` 放 **Paragraph（段落）** 等块级元素；Paragraph 的 `children` 放 **TextRun（带样式的文本片段）**、`ImageRun`、`ExternalHyperlink` 等行内元素。你用这些类「描述」一份文档长什么样，最后交给与 Document **完全解耦**的 **Packer**，序列化成真正的 `.docx` 字节。**一条贯穿全篇的环境差异**：Node 用 `Packer.toBuffer` 拿 Buffer 再 `fs` 写盘；浏览器没有 `fs`，要用 `Packer.toBlob` 拿 Blob 再 `saveAs` 下载——生成逻辑两端通用，只有「落地」方式不同。

## 评价

**优点**

- **代码声明式生成，动态结构无压力**：用普通 `map`/循环/条件即可按数据程序化拼出章节数、表格行数都不固定的复杂文档，是「数据驱动生成 Word」的首选
- **跨 Node 与浏览器**：同一套 `Document`/`Paragraph`/`TextRun` 生成 API 两端通用，只在导出端用 `toBuffer`（Node）/ `toBlob`（浏览器）区分
- **不依赖 Office**：纯 JS 直接生成 OOXML，服务端/CI/前端都能跑，无需安装 Word
- **能力覆盖全面**：样式、表格、图片、页眉页脚、列表与多级编号、目录 TOC、书签超链接、脚注尾注、分栏、修订追踪、数学公式、自定义内嵌字体……几乎覆盖 Word 常用功能
- **TypeScript 友好**：库本身用 TS 编写、自带类型声明，构造选项接口齐全，无需装 `@types`
- **示例丰富**：官方 `demo/` 目录有 90+ 可运行示例，覆盖几乎每个特性

**缺点**

- **不是解析库**：它主攻「生成/修改」，**把已有 `.docx` 读出来转 HTML/纯文本**是 mammoth 的活，方向相反
- **复刻复杂既有版式成本高**：若设计师已在 Word 里排好精美模板、只想填数据，用 **docxtemplater** 往 `{{占位符}}` 填更省心（docx 也有 `patchDocument` 但体验不及）
- **单位与命名有学习成本**：字号是 **half-points（半磅）**、表格宽度/段间距常用 **twips**、绘图/浮动图片用 **EMU**（1in=914400），斜体属性名是 `italics`（复数），初见易踩
- **样式需配套定义**：用了 `heading`/列表却没在 `styles` 里定义对应 `HeadingX`/`ListParagraph`，会显示成「未套样式」的默认样子
- **字段类内容靠 Word 计算**：目录、页码总数等是「字段（field）」，docx 只放占位，**真实内容由 Word 打开时更新域**才生成
- **无内置高层图表 API**：要在文档里放图表，常见做法是先把图表渲成图片再用 `ImageRun` 插入

## 文档地址

[docx Documentation](https://docx.js.org/)

## GitHub 地址

[dolanmiu/docx](https://github.com/dolanmiu/docx)

## 幻灯片地址

<a href="/SlideStack/docx-slide/" target="_blank">docx</a>
