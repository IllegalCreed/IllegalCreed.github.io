---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **6.0.x**。深入边界与权衡：CJK/字体资源（cMapUrl / standardFontDataUrl）、大文档虚拟化、Node 端抽文本、现代 vs legacy 构建、打包器里的 worker 配置、版本一致性，以及与 jsPDF / pdf-lib 的选型。

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

> 中文显示成方块，多半是缺 `cMapUrl`/`standardFontDataUrl`，与 `scale`、渲染目标无关。把 `pdfjs-dist` 里的 `cmaps/`、`standard_fonts/` 作为静态资源部署，再指给它即可。

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

Node 端应使用 **legacy 构建**（现代构建假定最新浏览器特性）。**纯抽文本不需要 canvas**：

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

> 只有要在 Node 里**渲染成图片**时才需额外的 canvas 实现；抽文本只走 `getTextContent`。

## 四、现代构建 vs legacy 构建

| 维度 | 现代构建（`build/...`） | legacy 构建（`legacy/build/...`） |
|---|---|---|
| 目标 | 最新浏览器 | 较老浏览器 + **Node.js** |
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
1. **不配 workerSrc** → 退化成 fake worker 在主线程跑，卡 UI。
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
| 核心用途 | **解析 / 渲染 / 查看** | **从零生成** PDF | **修改 / 拼接**现有 PDF |
| 渲染到屏幕 | **强**（canvas） | 不做 | 不做 |
| 抽文本/元数据 | **支持** | 不适用 | 部分 |
| 创建新文档 | **不做** | **强** | 强（含表单/合并） |
| 典型场景 | 在线 PDF 阅读器 | 导出报表/票据 | 给已有 PDF 加水印/填表单/合并 |

**经验法则**：

- 要**在页面里看/搜/选 PDF** → **PDF.js**（或其封装 react-pdf / vue-pdf-embed）。
- 要**生成一份新 PDF** → **jsPDF**。
- 要**改/拼现有 PDF**（水印、合并、填表单） → **pdf-lib**。

## 八、边界再强调

最后回到那条贯穿全篇的提醒：**PDF.js 只解析与渲染，不生成 PDF**。

- canvas 渲染的文字是**位图**，可选中/搜索要另叠**文本层**。
- 链接/表单交互要另叠**注解层**。
- worker **必须配置且与主库同版本**。

---

回到 [入门](../getting-started) 复习渲染链路，或查 [参考](../reference) 速览 API、选项与文本/注解层。
