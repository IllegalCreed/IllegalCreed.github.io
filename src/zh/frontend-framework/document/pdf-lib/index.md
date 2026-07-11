---
layout: doc
---

# pdf-lib

::: tip 本篇范围
本篇聚焦 **pdf-lib —— 用纯 JavaScript 创建并「修改既有」PDF 的库**，可在浏览器、Node、Deno、React Native 等 JavaScript 运行时工作。重点在：**`PDFDocument.create`（新建）vs `PDFDocument.load`（载入既有）** 的双入口、**修改既有 PDF**（加删页 / 合并 copyPages / 整页复用 embedPage）、**表单 AcroForm** 的填写与扁平化 flatten、`drawText`/`drawImage`/`drawRectangle` 等绘制、**嵌入字体**（标准 14 字体只支持 Latin，中文需 `@pdf-lib/fontkit` + `embedFont`）、`save()` → `Uint8Array`、以及与 jsPDF 的取舍。版本基线为原库 **1.17.1**；另核验社区 fork **`@cantoo/pdf-lib` 2.7.1**，但两者不是可盲换的同一发行线。
:::

pdf-lib 的官方定位是「**Create and modify PDF documents in any JavaScript environment**」——它最大的卖点不是「新建 PDF」（那很多库能做），而是**修改一份既有 PDF**：`load` 进来后加页、画字、盖章、填表单、合并，再 `save` 出去。这使它在纯 JavaScript 库中很有辨识度：jsPDF 更偏从零生成，PDF.js 则负责解析与渲染。pdf-lib 是**纯 JS、零原生依赖**，浏览器、Node、Deno、React Native 使用同一套核心 API。

理解 pdf-lib 的关键是它的 **「绘制式」心智模型**：你不是在「编辑文档对象树」，而是在**页面坐标系上叠加绘制**——`page.drawText`/`drawImage`/`drawRectangle` 把新内容画在既有内容**之上**。坐标系沿用 PDF 规范：**原点在左下角、y 轴向上**（与 canvas/CSS 相反，是头号新手坑）。**一个必须记牢的现状**：原仓库 `Hopding/pdf-lib` 的 npm 最新稳定版仍是 **1.17.1（2021 年底）**；社区 fork **`@cantoo/pdf-lib` 2.7.1** 延续了主要 API，并增加密码、增量保存和整段 SVG 等能力，但维护目标与兼容风险要独立评估。

## 评价

**优点**

- **能修改既有 PDF**：`load` 后加删页、合并、盖章、填表单——这是它区别于 jsPDF 的核心，也是 JS 生态里的稀缺能力
- **环境无关、零原生依赖**：浏览器（`fetch().arrayBuffer()` + Blob 下载）与 Node（`fs` 读写）同一套 API，还支持 Deno / React Native
- **表单能力完整**：`getForm` 后可读写文本框/复选框/单选/下拉/列表，支持**填写**与 **flatten 扁平化**（固化为不可编辑）
- **整页复用独特**：`embedPage`/`embedPdf` 把整页变成可重复绘制的对象，`drawPage` 叠加，天然适合图章、水印、N-up 拼版
- **自带 TypeScript 类型**：API 有完整提示，无需额外 @types
- **绘制 API 直观**：`drawText({ x, y, size, font, color })` 一行到位，颜色用 `rgb`/`cmyk`/`grayscale` 辅助函数

**缺点**

- **原库长期未发新版**：稳定版仍是 1.17.1（2021）；需要新能力时可评估社区 fork `@cantoo/pdf-lib`，迁移前应跑回归测试
- **不抽取文本、不渲染**：读不出 PDF 里已有的文字（那是 PDF.js 的活），也不把 PDF 画到屏幕
- **不能就地改写原文字**：drawText 只能叠加新内容，无法定位并修改既有文本对象
- **不支持加密 PDF**：load 加密文件抛 `EncryptedPDFError`，`ignoreEncryption` 也不解密
- **中文需自备字体**：标准 14 字体只覆盖 WinAnsi(Latin)，写中文必须 `registerFontkit` + 嵌入 CJK 字体，且建议 `subset:true` 控体积
- **不渲染 HTML/CSS**：它是底层绘制库，「HTML → PDF」要用 Puppeteer(`page.pdf()`) 等无头浏览器方案
- **图片格式有限**：原库直接嵌入 PNG/JPEG（包括常见 baseline/progressive JPEG），不负责 GIF/WebP 转码，也不能直接嵌入完整 SVG 文档

## 文档地址

[pdf-lib 官方文档](https://pdf-lib.js.org/)

## GitHub 地址

[Hopding/pdf-lib](https://github.com/Hopding/pdf-lib)（活跃 fork：[cantoo-scribe/pdf-lib](https://github.com/cantoo-scribe/pdf-lib)）

## 幻灯片地址

<a href="/SlideStack/pdf-lib-slide/" target="_blank">pdf-lib</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=pdf-lib" target="_blank" rel="noopener noreferrer">pdf-lib 测试题</a>
