---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 PDF.js（`pdfjs-dist`）并完成第一次「加载 → 渲染一页到 canvas」。版本基线 **6.1.200**。核心认知：**getDocument → getPage → getViewport → render 四步链路**，外加一条贯穿全篇的前置提醒——直接使用 display build 时先配同版本 worker；若框架封装已接管 worker，则沿用其配置。

## 速查

- 安装：`npm i pdfjs-dist`（包名是 `pdfjs-dist`，不是 `pdf.js`）
- 导入：`import * as pdfjsLib from "pdfjs-dist"`
- 配 worker（直接集成时）：`pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString()`
- 加载：`const pdf = await pdfjsLib.getDocument({ url }).promise`
- 取页（**1 基**）：`const page = await pdf.getPage(1)`
- 算尺寸：`const viewport = page.getViewport({ scale: 1.5 })`
- 渲染：`await page.render({ canvas, viewport }).promise`
- 总页数：`pdf.numPages`；释放：`await pdf.destroy()`
- Node：6.1.200 要求 `>=22.13.0 || >=24`，从 `pdfjs-dist/legacy/build/pdf.mjs` 导入
- ⚠️ PDF.js 不是通用生成器；有限注解保存不等于任意创建/修改 PDF

## 一、PDF.js 是什么

官方定位：「**a general-purpose, web standards-based platform for parsing and rendering PDFs**」。三个关键点：

1. **解析 + 渲染**：把已有 PDF 画到 canvas、抽文本、读元数据；**不创建** PDF。
2. **worker 架构**：CPU 密集的解析放后台线程，主线程只绘制。
3. **分层设计**：core（解析）/ display（渲染 API，最常用）/ viewer（完整 UI）。

> 边界提醒：PDF.js viewer 能编辑并保存一部分注解，但不提供通用建页与排版 API。要从零生成用 jsPDF，要改/拼既有 PDF 用 pdf-lib。

## 二、安装与导入

```bash
npm i pdfjs-dist
# pnpm add pdfjs-dist / yarn add pdfjs-dist 同理
```

```ts
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.getDocument(/* ... */);
pdfjsLib.GlobalWorkerOptions.workerSrc = /* ... */;
```

> `pdfjs-dist` 6.1.200 以 **ES Module** 为主：入口 `build/pdf.mjs`、worker `build/pdf.worker.mjs`。**较老浏览器或 Node** 用 legacy 构建（`pdfjs-dist/legacy/build/...`）；该版本 package engine 要求 Node `>=22.13.0 || >=24`。

## 三、配置 worker（绕不开的一步）

PDF.js 把解析放进 Web Worker。直接使用 display build 时，应明确告诉它 worker 脚本在哪：

```ts
// 推荐：交给打包器（Vite/webpack）解析资源 URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();
```

::: warning 不配会怎样
若既没有设置 `workerSrc` / `workerPort`，上层封装也没有接管 worker，初始化会报错或尝试 fake worker。**主库与 worker 必须是完全相同的版本**，否则会报「The API version does not match the Worker version」。react-pdf 等封装可能自行管理 worker，先遵循其集成文档。
:::

## 四、第一次「加载」

`getDocument` 返回的是**加载任务**，文档要从它的 `.promise` 拿：

```ts
const url = "/files/demo.pdf";
const loadingTask = pdfjsLib.getDocument({ url });
const pdf = await loadingTask.promise; // PDFDocumentProxy

console.log(pdf.numPages); // 总页数
```

> 这种「先给任务、再 await promise」的设计，是为了支持进度回调（`loadingTask.onProgress`）、取消等。

## 五、第一次「渲染一页」

标准四步：取页 → 算 viewport → 备 canvas → render。

```ts
// 1. 取第 1 页（页码 1 基！）
const page = await pdf.getPage(1);

// 2. 按缩放算出该页像素尺寸与变换
const scale = 1.5;
const viewport = page.getViewport({ scale });

// 3. 用 viewport 尺寸准备 canvas
const canvas = document.getElementById("the-canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;
canvas.width = Math.floor(viewport.width);
canvas.height = Math.floor(viewport.height);

// 4. 渲染（render 返回 RenderTask，await 其 .promise）
await page.render({ canvas, viewport }).promise;
```

> 新版推荐直接传 `canvas` 元素；旧写法传 `canvasContext`（2D 上下文）仍兼容。`render()` 返回 `RenderTask`，其 `.promise` 完成、`.cancel()` 取消。

## 六、高分屏（Retina）不糊

官方示例用 `devicePixelRatio` 提升画布物理像素，CSS 尺寸保持视口大小：

```ts
const viewport = page.getViewport({ scale: 1.5 });
const outputScale = window.devicePixelRatio || 1;

canvas.width = Math.floor(viewport.width * outputScale);
canvas.height = Math.floor(viewport.height * outputScale);
canvas.style.width = Math.floor(viewport.width) + "px";
canvas.style.height = Math.floor(viewport.height) + "px";

const transform =
  outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

await page.render({ canvas, viewport, transform }).promise;
```

## 七、一个易忘点：纯 render 的文字不能选

canvas 渲染产出的是**位图像素**，文字是「画上去的图」，无法被鼠标选中或搜索。要可选中/可搜索，需另建**文本层**（`getTextContent` + `TextLayer`，见[指南 · 进阶](./guide-line/advanced)）。

```ts
const textContent = await page.getTextContent();
// textContent.items[].str 是文本片段；transform 是其位置
```

---

跑通加载与渲染后，进入 [指南 · 基础](./guide-line/base)：渲染链路与对象模型（loadingTask / PDFDocumentProxy / PDFPageProxy）、viewport 与 scale、RenderTask 的取消。
