---
layout: doc
---

# PptxGenJS

::: tip 本篇范围
本篇聚焦 **PptxGenJS**（npm 包名 `pptxgenjs`）——用一套纯 JavaScript API **生成 PowerPoint（.pptx）文件**。重点在：**`new pptxgen() → addSlide() → addText/addImage/addChart/addTable/addShape` 的对象模型**、**坐标与尺寸单位（英寸 / 百分比）**、母版 `defineSlideMaster` 与布局 `layout`、输出三件套 `writeFile`（Node 写盘 / 浏览器下载）/ `write`（拿数据）/ `stream`、以及浏览器与 Node 的差异。版本基线 **4.0.1**，并在关键处点明一条贯穿全篇的边界——**它只「生成」不「解析」**，要改既有模板得换 pptx-automizer。
:::

PptxGenJS 的官方定位是「**Create PowerPoint presentations with a powerful, concise JavaScript API**」——用代码声明式地拼出幻灯片，最终产出符合 OOXML 标准的 `.pptx` 文件，且「runs everywhere」：Node.js、浏览器、React/Vue/Vite、Electron 都能跑。它的核心价值是**纯 JS、零模板依赖、跨环境**地把数据变成可直接用 PowerPoint 打开的演示文稿。

理解 PptxGenJS 的关键是它的**对象模型**：顶层是 **Presentation（演示文稿，`new pptxgen()`）**，调用 `addSlide()` 得到 **Slide（幻灯片）**，再往 slide 上 `addText` / `addImage` / `addChart` / `addTable` / `addShape` / `addMedia` 添加各类**元素**；演示文稿级还有 `defineSlideMaster`（母版）、`layout`（尺寸）、`author`/`title` 等元数据，以及 `writeFile` / `write` / `stream` 三种**异步输出**。两条最该记牢的规则：**颜色用不带 `#` 的 6 位十六进制**（`'0088CC'`），以及**它只生成不解析**——没有「加载已有 pptx 再编辑」的能力。

## 评价

**优点**

- **纯 JS、跨环境**：Node、浏览器、React/Vite、Electron 同一套 API，服务端批量生成与前端导出都行
- **声明式、上手快**：`new pptxgen()` → `addSlide()` → `addText/...` → `writeFile()`，四步出一份 pptx
- **元素覆盖全**：文本（含词级混排/项目符号/超链接）、图片、图表（柱/线/饼/环/雷达/散点等）、表格、形状、音视频/YouTube
- **母版与布局**：`defineSlideMaster` 做品牌化母版，内置 `LAYOUT_16x9/4x3/WIDE` 与自定义 `defineLayout`
- **输出灵活**：`writeFile`（Node 写盘 / 浏览器下载自适应）、`write`（base64/blob/nodebuffer 等数据形态）、`stream`（服务端流式）
- **依赖轻**：核心依赖 JSZip（打包 .pptx 这个 ZIP 容器），自带 TypeScript 类型声明

**缺点**

- **只生成不解析**：无法读取/编辑既有 .pptx 模板，改模板需改用 **pptx-automizer** 等库（这是最大边界）
- **无渲染/预览**：产出文件后要用 PowerPoint/WPS 打开看效果，纯 JS 渲染 pptx 生态里无成熟方案
- **颜色与命名易踩坑**：颜色须无 `#`；`align`/`valign` 取值、`ChartType.bar3d`(值 `'bar3D'`) 等大小写细节多
- **坐标是英寸思维**：以英寸/百分比定位，习惯像素的前端需要适应
- **样式不是所见即所得**：靠选项对象描述，复杂版式要反复在 PowerPoint 里核对效果
- **输出全异步**：`writeFile`/`write`/`stream` 都返回 Promise，忘了 `await` 是常见错误

## 文档地址

[PptxGenJS Docs](https://gitbrent.github.io/PptxGenJS/)

## GitHub 地址

[gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS)

## 幻灯片地址

<a href="/SlideStack/pptxgenjs-slide/" target="_blank">PptxGenJS</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=pptxgenjs" target="_blank" rel="noopener noreferrer">PptxGenJS 测试题</a>
