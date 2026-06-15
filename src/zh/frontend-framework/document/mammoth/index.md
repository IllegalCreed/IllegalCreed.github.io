---
layout: doc
---

# mammoth（docx → 干净 HTML）

::: tip 本篇范围
本篇聚焦 **mammoth.js**（npm 包名 `mammoth`）——把 **`.docx` 转成干净、语义化的 HTML / Markdown**。重点在：**「按语义样式映射」而非还原外观**的核心理念、`convertToHtml` / `extractRawText` 两大入口、**styleMap 自定义映射语法**（`p[style-name='…'] => h1:fresh`、`:fresh`、`=>!`、`>` 嵌套、`separator`）、**图片处理 `convertImage`**、**消息 `messages`（warning/error）**、**浏览器（`arrayBuffer`）与 Node（`path`/`buffer`）入参差异**，以及与 **docx-preview（保真渲染）的取舍**。版本基线 **1.12.0**，并在关键处点明 **「mammoth 不做消毒，输出需自行 sanitize」这个高频安全坑**。
:::

mammoth 的官方定位是把 .docx「**convert to simple and clean HTML**」。它最核心的设计取向是：**只依据文档里的语义样式名（style name，如 “Heading 1”）做映射，基本忽略 Word 里的直接格式（手动设的字号、颜色、缩进）**。所以它产出的是适合二次处理、能套你自己网站 CSS 的干净 HTML，而**不是**像素级还原 Word 外观（那是 docx-preview 这类保真渲染库的事）。

理解 mammoth 的关键是它的 **「样式映射（style map）」机制**：每条规则形如「文档元素匹配器 `=>` HTML 路径」，例如 `p[style-name='Section Title'] => h1:fresh` 把样式名为 “Section Title” 的段落转成 `<h1>`。mammoth 内置了一份**默认映射**（Heading 1~6 → h1~h6、Normal → p、列表 → ul/ol、脚注/尾注、Strong → strong 等），你的自定义映射会与之**合并且优先**。**一个高频坑**：mammoth **明确不对源文档做任何消毒**——输出可能含 `javascript:` 链接等，处理不受信任的上传时**必须自行 sanitize**（如配合 DOMPurify）。

## 评价

**优点**

- **产出干净语义 HTML**：按样式名映射成 `<h1>`/`<p>`/`<ul>` 等，天然适配你自己的 CSS，无 Word 内联样式噪声
- **映射高度可定制**：styleMap 一套小语言（`:fresh` / `=>!` / `>` 嵌套 / `separator` / 前缀 `^=`）能精确控制输出结构
- **开箱即用的默认映射**：标题、列表、脚注/尾注、加粗斜体等常见结构无需配置即可正确转换
- **环境无关**：浏览器（`{ arrayBuffer }` + `mammoth.browser`）与 Node（`{ path }`/`{ buffer }`）同一套 API
- **图片可控**：默认内嵌 base64 data URI，也可用 `convertImage` 自定义（如上传后引用 URL）
- **轻量专注**：只做 docx → HTML 单向转换，职责清晰，易集成进 CMS / 富文本导入流程

**缺点**

- **不还原外观**：刻意丢弃直接格式与表格边框/底纹/分页版式——要保真预览得用 docx-preview
- **不做消毒**：官方明确不 sanitize，输出可能含恶意链接，需自行清洗，否则有 XSS 风险
- **依赖作者用好样式**：文档若全靠手动排版、不用样式名，mammoth 很难映射出理想结构
- **Markdown 已弃用**：`convertToMarkdown` 标记 deprecated，官方建议先转 HTML 再用专门库转 Markdown
- **transform API 不稳定**：`transformDocument` 等高级变换被官方标注 unstable，版本间可能变化
- **只进不出**：不能把 HTML 回写成 docx（生成 docx 需 docx / docxtemplater 等库）

## 文档地址

[mammoth.js README](https://github.com/mwilliamson/mammoth.js#readme)

## GitHub 地址

[mwilliamson/mammoth.js](https://github.com/mwilliamson/mammoth.js)

## 幻灯片地址

<a href="/SlideStack/mammoth-slide/" target="_blank">mammoth（docx → 干净 HTML）</a>
