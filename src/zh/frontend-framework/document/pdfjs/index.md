---
layout: doc
---

# PDF.js（pdfjs-dist）

::: tip 本篇范围
本篇聚焦 **PDF.js**（npm 包名 `pdfjs-dist`，Mozilla 出品）——浏览器优先的 **PDF 解析 / 渲染引擎**。重点在：**`getDocument` → `PDFDocumentProxy` → `getPage` → `render` 到 canvas** 的核心链路、**worker 配置**（`GlobalWorkerOptions.workerSrc`）这一必做项、`viewport`/`scale` 与高分屏处理、**文本层**（`getTextContent` + `TextLayer`）实现可选中/搜索、**注解层**（`AnnotationLayer`）渲染链接与表单，以及它与 react-pdf / vue-pdf-embed 的关系。版本基线 **6.0.x**（ESM 优先）。并反复强调一条最关键的边界——**PDF.js 只解析与渲染，不生成 PDF**。
:::

PDF.js 的官方定位是「**a general-purpose, web standards-based platform for parsing and rendering PDFs**」——基于 Web 标准、用 HTML5（主要是 Canvas）在浏览器里解析并渲染 PDF。它同时是 **Firefox 内置 PDF 阅读器**的底层引擎，工程上久经考验。

理解 PDF.js 的关键是它的**分层**与**渲染链路**。分层上分三层：**core**（解析二进制 PDF，API 不稳定，少直接用）、**display**（易用的渲染 API：`getDocument`/`render`/`getTextContent`，应用通常用这层）、**viewer**（建立在 display 之上的完整 UI，即 Firefox 阅读器）。渲染链路上：`getDocument()` 返回一个**加载任务**，`await loadingTask.promise` 得到 `PDFDocumentProxy`；`pdf.getPage(n)`（**页码 1 基**）拿到 `PDFPageProxy`；`page.getViewport({ scale })` 算出该页的像素尺寸与坐标变换；最后 `page.render({ canvas, viewport })` 把它画到 `<canvas>`。**一个绕不开的前置步骤**：必须先设 `GlobalWorkerOptions.workerSrc` 指向 `pdf.worker.mjs`，否则会因 worker 缺失而报错或退化到主线程跑（卡 UI）。

## 评价

**优点**

- **久经考验、标准化**：Firefox 内置阅读器同源，覆盖各种真实世界的「脏」PDF，兼容性强
- **纯前端渲染**：把 PDF 画到 canvas，不依赖浏览器插件，跨平台一致
- **worker 架构**：繁重解析在后台线程，主线程只绘制，页面流畅
- **能力完整**：渲染之外还能抽文本（`getTextContent`）、读元数据（`getMetadata`）、渲染文本层与注解层（链接、表单）
- **按需加载**：页面 `getPage` 懒取、支持范围请求（range）分块加载大文件
- **生态繁荣**：react-pdf、vue-pdf-embed、ng2-pdf-viewer 等都基于它

**缺点**

- **worker 配置是高频坑**：不配 `workerSrc`、或主库与 worker 版本不一致都会报错；打包器里路径易错位
- **可选中文字要自己叠文本层**：canvas 是位图，选择/搜索需 `getTextContent` + `TextLayer` 额外实现
- **CJK / 非内嵌字体需配资源**：缺 `cMapUrl`/`standardFontDataUrl` 时中文可能显示成方块
- **大文档需自管性能**：连续滚动阅读要做虚拟化/懒渲染，否则全渲染会爆内存
- **不是 PDF 生成器**：要创建/编辑 PDF 得用 jsPDF / pdf-lib，常被误用
- **API 偏底层**：直接用 display API 需手动处理画布、HiDPI、文本层、生命周期

## 文档地址

[PDF.js 官方站点](https://mozilla.github.io/pdf.js/)

## GitHub 地址

[mozilla/pdf.js](https://github.com/mozilla/pdf.js)

## 幻灯片地址

<a href="/SlideStack/pdfjs-slide/" target="_blank">PDF.js（pdfjs-dist）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=pdf-js-pdfjs-dist" target="_blank" rel="noopener noreferrer">PDF.js（pdfjs-dist） 测试题</a>
