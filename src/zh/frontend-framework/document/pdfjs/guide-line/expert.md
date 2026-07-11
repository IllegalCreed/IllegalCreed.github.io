---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **6.1.200**。深入边界与权衡：CJK/字体资源（cMapUrl / standardFontDataUrl）、大文档虚拟化、Node 端抽文本、现代 vs legacy 构建、打包器里的 worker 配置、版本一致性，以及与 jsPDF / pdf-lib 的选型。

## 速查

- CJK/非内嵌字体问题要区分 CMap、standard font、system font 与字体本身缺字
- 6.1.200 资源目录包括 `cmaps/`、`standard_fonts/`、`iccs/`、`wasm/`
- 大文档只保留可见页附近 canvas，离屏页取消任务并回收资源
- Node engine：`>=22.13.0 || >=24`；导入 `pdfjs-dist/legacy/build/pdf.mjs`
- Node 抽文本不需要 canvas；渲染图片需要可用的 canvas 实现（包有可选 `@napi-rs/canvas`）
- worker 与主库必须精确同版，CDN worker 也不能只写 `latest`
- `intent` 是 display/print/any 用途，不是 DPI；清晰度由 viewport 与 HiDPI transform 决定
- PDF.js 可保存部分 viewer 注解，但不是通用创建/改写库

## 一、CJK 与字体资源：方块/乱码的根因

当 PDF 使用了**未内嵌**的 CJK 字体编码（CMap）时，PDF.js 需要预置的 Adobe CMap 数据才能正确映射字形：

```ts
const pdf = await pdfjsLib.getDocument({
  url,
  cMapUrl: "/pdfjs/cmaps/", // 指向 pdfjs-dist 的 cmaps（含尾斜杠）
  cMapPacked: true, // pdfjs-dist 自带的是二进制打包格式
  standardFontDataUrl: "/pdfjs/standard_fonts/", // 非内嵌标准字体
}).promise;
```

> 中文方块/乱码可能来自缺 CMap、缺标准字体数据、系统字体回退关闭，或 PDF/替代字体本身缺字。不要只凭现象断定一个原因；按控制台 warning 与文件字体信息排查，并按需部署 `cmaps/`、`standard_fonts/`、`iccs/`、`wasm/`。

## 二、大文档：虚拟化/懒渲染

一次性把所有页都 render 成全分辨率 canvas 会爆内存、卡顿。大文档阅读器的性能关键是「**按需渲染 + 取消 + 回收**」：

- 只渲染**视口内及邻近**的页，滚出视口的页释放/降级（用占位骨架）。
- 翻页/滚动时 `cancel()` 未完成的 `RenderTask`。
- 必要时降低非聚焦页的 `scale`。

```ts
// 维护每页的 RenderTask，进入视口才渲染、离开就取消
const tasks = new Map<number, any>();
function renderPageLazily(page: any, canvas: HTMLCanvasElement, viewport: any) {
  tasks.get(page.pageNumber)?.cancel();
  const task = page.render({ canvas, viewport });
  tasks.set(page.pageNumber, task);
  return task.promise.catch(() => {}); // 吞掉取消异常
}
```

## 三、Node.js 端抽取文本

Node 端使用 **legacy 构建**；6.1.200 的 package engine 为 `>=22.13.0 || >=24`。**纯抽文本不需要 canvas**：

```ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const data = new Uint8Array(fs.readFileSync("a.pdf"));
const pdf = await pdfjsLib.getDocument({ data }).promise;

let full = "";
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const tc = await page.getTextContent();
  full += tc.items.map((it: any) => it.str).join("") + "\n";
}
await pdf.destroy();
```

> 只有要在 Node 里**渲染成图片**时才需要可用的 canvas 实现；`pdfjs-dist` 把 `@napi-rs/canvas` 列为可选依赖。抽文本只走 `getTextContent`，不应为此额外创建画布。

## 四、现代构建 vs legacy 构建

| 维度 | 现代构建（`build/...`） | legacy 构建（`legacy/build/...`） |
|---|---|---|
| 目标 | 最新浏览器 | 较老浏览器 + **Node.js 22.13+** |
| 特性 | 用较新 JS | 转译/兼容处理 |
| 体积 | 较小 | 较大（含 polyfill） |
| 何时用 | 现代 Web 应用 | 老环境报语法错、Node 端 |

> 老环境报「语法/特性不支持」时，**首选切到 legacy 构建**（主库与 worker 都用 legacy 版本），而不是把整个 PDF.js 降级到旧版。

## 五、打包器里的 worker 配置

worker 是独立资源文件，**写死相对路径**在构建后常因哈希/目录变化而 404。稳妥做法是用打包器能识别的 URL：

```ts
// Vite / webpack 5 都支持
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();
```

::: warning 两个高频 worker 坑
1. **直接集成却不配 workerSrc/workerPort** → 初始化失败或尝试 fake worker；封装库可能已替你配置。
2. **主库与 worker 版本不一致** → 报「The API version does not match the Worker version」。务必同一个 `pdfjs-dist` 安装。
:::

## 六、render 的 intent 与新旧画布参数

```ts
// 打印场景用 print，屏显用 display（默认）
await page.render({ canvas, viewport, intent: "print" }).promise;
```

- `intent`：声明渲染用途（`display` / `print` / `any`），影响渲染策略，不是 DPI。
- 画布参数：新版推荐 `canvas`（DOM 元素），`canvasContext`（2D 上下文）作向后兼容仍可用，二选一。

## 七、PDF.js vs jsPDF vs pdf-lib：怎么选

| 维度 | **PDF.js** | **jsPDF** | **pdf-lib** |
|---|---|---|---|
| 核心用途 | **解析 / 渲染 / 查看**（含有限注解编辑） | **从零生成** PDF | **修改 / 拼接**现有 PDF |
| 渲染到屏幕 | **强**（canvas） | 不做 | 不做 |
| 抽取既有正文文字 | **支持** | 不适用 | 不支持 |
| 创建新文档 | **不做** | **强** | 强（含表单/合并） |
| 典型场景 | 在线 PDF 阅读器 | 导出报表/票据 | 给已有 PDF 加水印/填表单/合并 |

**经验法则**：

- 要**在页面里看/搜/选 PDF** → **PDF.js**（或其封装 react-pdf / vue-pdf-embed）。
- 要**生成一份新 PDF** → **jsPDF**。
- 要**改/拼现有 PDF**（水印、合并、填表单） → **pdf-lib**。

## 八、边界再强调

最后回到那条贯穿全篇的提醒：**PDF.js 不是通用 PDF 生成/编辑库**。viewer 可写入一部分受支持注解并通过 `saveDocument()` 导出，但这不等于任意改正文、建页或排版。

- canvas 渲染的文字是**位图**，可选中/搜索要另叠**文本层**。
- 链接/表单交互要另叠**注解层**。
- 直接集成时 worker **必须正确接线且与主库同版本**；上层封装已接线时不要重复覆盖。

---

回到 [入门](../getting-started) 复习渲染链路，或查 [参考](../reference) 速览 API、选项与文本/注解层。
