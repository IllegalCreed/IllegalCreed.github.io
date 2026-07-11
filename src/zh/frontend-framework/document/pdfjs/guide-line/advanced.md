---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **6.1.200**。把 PDF.js 用进真实项目：文本层（可选中/可搜索）、注解层（链接/表单）、用户本地文件、远程加载与凭据、导出图片、HiDPI 完整处理、加载进度条。

## 速查

- 文本层：`new TextLayer({ textContentSource, container, viewport }).render()`
- 文本/注解层必须与 canvas 共用同一 viewport，并加载 viewer layer CSS
- 搜索应基于 `getTextContent()` 的片段与坐标，不是在 canvas 上做 OCR
- 注解层是低层 API：基础链接/表单还要 link service、download manager、annotation storage
- 本地文件：`file.arrayBuffer()` → `getDocument({ data })`
- 远程文件：CORS 由目标服务器配置；凭据分别用 `withCredentials` / `httpHeaders`
- 导图：先 render 到 canvas，再 `toBlob()`；下载后释放对象 URL
- HiDPI：放大物理画布并通过 `transform` 缩放，CSS 尺寸保持 viewport 大小

## 一、文本层：让文字可选中/可搜索

canvas 只画位图，文字不能选。要可选中/可搜索，需把 `getTextContent` 的文本片段用 **`TextLayer` 类**叠成透明 `<span>`，且与 canvas **共用同一个 viewport**：

```ts
// HTML：textLayer 容器叠在 canvas 之上，绝对定位、同尺寸
const textLayer = new pdfjsLib.TextLayer({
  textContentSource: await page.getTextContent(),
  container: textLayerDiv,
  viewport,
});
await textLayer.render();
```

> 旧的函数式 `renderTextLayer(...)` 已弃用，新版用 `TextLayer` 类。文本层与 canvas **必须用一致的 scale/rotation**，还要加载 `pdfjs-dist/web/pdf_viewer.css`（或实现等价定位样式），否则文字与图错位。

## 二、整本搜索关键字并高亮（思路）

```ts
async function searchAll(pdf: any, keyword: string) {
  const hits: { page: number; index: number }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it: any) => it.str).join("");
    let idx = text.indexOf(keyword);
    while (idx !== -1) {
      hits.push({ page: i, index: idx });
      idx = text.indexOf(keyword, idx + keyword.length);
    }
  }
  return hits;
}
```

> 核心是基于**文本层 + getTextContent 的文本/坐标**，而不是对 canvas 像素做 OCR，也不是在 PDF 二进制里正则。

## 三、注解层：链接与表单

链接、表单控件、批注属于**注解**，需用 `AnnotationLayer` 类叠在 canvas 之上：

```ts
const annotationLayer = new pdfjsLib.AnnotationLayer({
  div: annotationLayerDiv,
  viewport,
  page,
  linkService,
  annotationStorage: pdf.annotationStorage,
});
await annotationLayer.render({
  annotations: await page.getAnnotations({ intent: "display" }),
  downloadManager,
  renderForms: true,
});
```

> 链接可点、表单可填都靠注解层 DOM。`AnnotationLayer` 是低层 display API，`linkService` / `downloadManager` 需由 `pdfjs-dist/web/pdf_viewer.mjs` 或宿主适配；完整 viewer 通常直接复用 `AnnotationLayerBuilder`。三层仍按 canvas → text → annotation 叠放。

## 四、用户本地文件（input/拖拽）

浏览器没有文件系统，把 `File` 读成二进制再用 `data`：

```ts
input.addEventListener("change", async () => {
  const file = input.files![0];
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  // ... 渲染
});
```

> 不能直接 `getDocument({ url: file })`；也别用 `FileReader.readAsText`（会破坏二进制），要 `arrayBuffer()`。

## 五、远程加载与凭据

```ts
const pdf = await pdfjsLib.getDocument({
  url: "https://api.example.com/secure.pdf",
  withCredentials: true, // 带 Cookie/凭据
  httpHeaders: { Authorization: "Bearer xxx" }, // 自定义头
}).promise;
```

::: warning 跨域报错 = 服务端没配 CORS
PDF.js 经 fetch/XHR 拉取，受同源策略约束。跨域失败通常是**目标服务器**未返回 `Access-Control-Allow-Origin`，需服务端放行，PDF.js 端无法绕过。
:::

## 六、导出某页为图片（PNG）

PDF.js 渲染目标是 canvas，导图借助 canvas 原生 API：

```ts
await page.render({ canvas, viewport }).promise;

// 转 DataURL
const dataUrl = canvas.toDataURL("image/png");

// 或转 Blob 下载
canvas.toBlob((blob) => {
  if (!blob) return;
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = "page-1.png";
  a.click();
  URL.revokeObjectURL(objectUrl);
}, "image/png");
```

> 没有 `page.toPNG()` 这类一键方法，导图统一走「render 到 canvas → canvas API」。

## 七、HiDPI 完整处理

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

> 思路：物理像素按 `devicePixelRatio` 放大、CSS 尺寸保持视口大小、render 传对应 `transform`。这正是官方 helloworld 的做法。

## 八、加载进度条

```ts
const loadingTask = pdfjsLib.getDocument({ url });
loadingTask.onProgress = ({ loaded, total }) => {
  if (total) console.log(`${Math.round((loaded / total) * 100)}%`);
};
const pdf = await loadingTask.promise;
```

> 进度回调挂在 **loadingTask** 上，不在文档对象上——这也是 `getDocument` 返回任务而非直接 Promise 的价值。

---

进入 [指南 · 专家](./expert)：CJK/字体资源（cMapUrl）、大文档虚拟化、Node 端抽文本、legacy 构建、打包器 worker 配置、与 jsPDF/pdf-lib 的选型。
