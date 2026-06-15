---
layout: doc
---

# jsPDF

::: tip 本篇范围
本篇聚焦 **jsPDF**——在**客户端（浏览器）用纯 JavaScript 生成 PDF** 的主力库。重点在：**命令式绘图模型**（按坐标 `text` / `line` / `rect` / `addImage` 把内容「画」上去）、构造器的 `orientation` / `unit` / `format`、`addPage` / `setPage` 多页、`save` / `output`（blob / datauristring / bloburl）的导出形态、**字体**（内置 14 标准字体仅限 ASCII，中文须 `addFileToVFS` + `addFont` 嵌入）、`jspdf-autotable` 表格插件、`.html()`（内部走 **html2canvas 栅格化**，文字不可选）的取舍，以及与 **pdfmake（声明式）/ @react-pdf（React）** 的选型。版本基线 **4.x**，并贯穿强调 **「矢量文本 vs html() 栅格化」** 这条主线。
:::

jsPDF 的官方定位是「**Client-side JavaScript PDF generation**」——在浏览器本地把绘制指令直接编排成 PDF 字节，**全程无需后端**，最终用 `save()` 触发下载或用 `output()` 拿到 Blob / DataURI 再上传/预览。它也能在 Node 运行（dist 含 `jspdf.node.*.js`），但主战场是客户端。

理解 jsPDF 的关键是它的**命令式绘图范式**：一份文档就是一块从左上角 `(0,0)` 到 `(pageWidth, pageHeight)` 的画布，你给的坐标即绝对位置，**没有自动页边距、不自动换行、不自动分页**——这些都要自己算。这与声明式的 pdfmake（写 `docDefinition` JSON）/ @react-pdf（写 React 组件）形成鲜明对比：jsPDF 换来的是**像素级精确控制**与**轻量、零框架依赖**。

另一条必须分清的主线是**「文字的两种来源」**：用原生 `text()` 画的字是**矢量、可选中、可搜索、清晰锐利、体积小**；而 `.html()` 借助 **html2canvas 把 DOM 栅格化成位图**再嵌入，PDF 里的「文字」其实是**图片像素，不可选、不可搜、缩放会糊**。结构化、要可选文字的文档（发票/证书/报表）优先原生绘制；要还原复杂现成网页样式且不在意可选时才用 `.html()`。

## 评价

**优点**

- **纯客户端生成**：浏览器本地产出并下载，零后端依赖，数据不出浏览器，利于隐私与部署成本
- **像素级精确控制**：命令式按坐标绘制 `text`/`line`/`rect`/`circle`/`image`，适合布局固定的票据、证书、标签
- **矢量文字**：原生 `text()` 产出可选中、可搜索、打印锐利的文本，体积小
- **生态成熟**：`jspdf-autotable` 一键生成带样式、自动分页的表格；`svg2pdf.js` 矢量 SVG；多构建（ESM/Node/UMD）+ TS 类型
- **多种导出形态**：`save()` 下载、`output('blob'/'arraybuffer')` 拿数据、`output('bloburl')` iframe 预览，前后端都好接
- **可处理 DOM**：`.html()` 能把现成页面区域快速转 PDF（栅格化），快速出图省事

**缺点**

- **无自动布局**：没有页边距、内容流、自动换行/分页概念，长文本要 `splitTextToSize`、分页要自己 `addPage`，复杂排版心智负担重
- **中文需嵌入字体**：内置 14 标准字体仅限 ASCII，中文/非拉丁字符必须 `addFileToVFS` + `addFont` 嵌入，且完整中文 TTF 常达数 MB，PDF 显著变大（需子集化）
- **`.html()` 是栅格化**：经 html2canvas 截图，文字不可选/搜、可能糊，且依赖 DOM（纯 Node 不可用）、异步需 callback
- **不解析/编辑已有 PDF**：jsPDF 只管生成；读取渲染用 PDF.js，编辑现有 PDF 用 pdf-lib
- **复杂自动排版不如声明式库**：大量自动流式排版选 pdfmake / @react-pdf 更省事

## 文档地址

[jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/jsPDF.html)

## GitHub 地址

[parallax/jsPDF](https://github.com/parallax/jsPDF)

## 幻灯片地址

<a href="/SlideStack/jspdf-slide/" target="_blank">jsPDF</a>
