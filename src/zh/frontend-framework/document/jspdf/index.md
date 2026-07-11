---
layout: doc
---

# jsPDF

::: tip 本篇范围
本篇聚焦 **jsPDF**——在**客户端（浏览器）用纯 JavaScript 生成 PDF** 的主力库。重点在：**命令式绘图模型**（按坐标 `text` / `line` / `rect` / `addImage` 把内容「画」上去）、构造器的 `orientation` / `unit` / `format`、`addPage` / `setPage` 多页、`save` / `output`（blob / datauristring / bloburl）的导出形态、**字体**（内置 14 标准字体仅限 ASCII，中文须 `addFileToVFS` + `addFont` 嵌入）、`jspdf-autotable` 5.0.8 表格插件、以及 `.html()` 的真实机制与 CSS 取舍。版本基线 **4.2.1**；该版本修复了多项 4.x 安全问题，处理不可信输入时不应停留在 4.0/4.1。
:::

jsPDF 的官方定位是「**Client-side JavaScript PDF generation**」——在浏览器本地把绘制指令直接编排成 PDF 字节，**全程无需后端**，最终用 `save()` 触发下载或用 `output()` 拿到 Blob / DataURI 再上传/预览。它也能在 Node 运行（dist 含 `jspdf.node.*.js`），但主战场是客户端。

理解 jsPDF 的关键是它的**命令式绘图范式**：一份文档就是一块从左上角 `(0,0)` 到 `(pageWidth, pageHeight)` 的画布，你给的坐标即绝对位置，**没有自动页边距、不自动换行、不自动分页**——这些都要自己算。这与声明式的 pdfmake（写 `docDefinition` JSON）/ @react-pdf（写 React 组件）形成鲜明对比：jsPDF 换来的是**像素级精确控制**与**轻量、零框架依赖**。

另一条必须分清的主线是**「直接绘制 vs HTML 解释」**：原生 `text()` / `autotable` 的布局最可控；`.html()` 则让 html2canvas 遍历 DOM，但输出目标是 jsPDF 自己的 `context2d`，其中 `fillText` 会映射为 PDF 文本指令，不能把整个结果一概说成位图。图片、渐变、滤镜和部分复杂 CSS 仍可能栅格化或降级，分页与字体映射也比手写绘制更难预测。结构化、要求稳定打印的文档优先原生绘制；快速迁移现成 DOM 时再用 `.html()` 并实测。

## 评价

**优点**

- **纯客户端生成**：浏览器本地产出并下载，零后端依赖，数据不出浏览器，利于隐私与部署成本
- **像素级精确控制**：命令式按坐标绘制 `text`/`line`/`rect`/`circle`/`image`，适合布局固定的票据、证书、标签
- **矢量文字**：原生 `text()` 产出可选中、可搜索、打印锐利的文本，体积小
- **生态成熟**：`jspdf-autotable` 一键生成带样式、自动分页的表格；`svg2pdf.js` 矢量 SVG；多构建（ESM/Node/UMD）+ TS 类型
- **多种导出形态**：`save()` 下载、`output('blob'/'arraybuffer')` 拿数据、`output('bloburl')` iframe 预览，前后端都好接
- **可处理 DOM**：`.html()` 通过 html2canvas + jsPDF context2d 复用现成页面结构，受支持的文本仍可成为 PDF 文本

**缺点**

- **无自动布局**：没有页边距、内容流、自动换行/分页概念，长文本要 `splitTextToSize`、分页要自己 `addPage`，复杂排版心智负担重
- **中文需嵌入字体**：内置 14 标准字体仅限 ASCII，中文/非拉丁字符必须 `addFileToVFS` + `addFont` 嵌入，且完整中文 TTF 常达数 MB，PDF 显著变大（需子集化）
- **`.html()` 不是浏览器打印引擎**：CSS 支持、字体映射和分页有边界，图片/部分效果可能栅格化；依赖 DOM，纯 Node 不可用
- **不解析/编辑已有 PDF**：jsPDF 只管生成；读取渲染用 PDF.js，编辑现有 PDF 用 pdf-lib
- **复杂自动排版不如声明式库**：大量自动流式排版选 pdfmake / @react-pdf 更省事
- **不可信输入要严防**：4.2.1 才包含最新 output/annotation 注入修复，官方仍要求调用前自行净化输入

## 文档地址

[jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/jsPDF.html)

## GitHub 地址

[parallax/jsPDF](https://github.com/parallax/jsPDF)

## 幻灯片地址

<a href="/SlideStack/jspdf-slide/" target="_blank">jsPDF</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=jspdf" target="_blank" rel="noopener noreferrer">jsPDF 测试题</a>
