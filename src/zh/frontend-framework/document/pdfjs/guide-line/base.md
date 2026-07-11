---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **6.1.200**。本篇把「会渲染」用到「懂模型」：渲染链路与三个核心对象（loadingTask / PDFDocumentProxy / PDFPageProxy）、worker 的角色、viewport 与 scale、RenderTask 的取消、页码 1 基这些易错点。

## 速查

- `getDocument()` 与 `render()` 都返回任务对象，分别等待 `.promise`
- `PDFDocumentProxy.getPage(n)` 的页码从 **1** 开始，没有同步 `pages[]`
- `getViewport({ scale, rotation })` 同时给出尺寸与 PDF → canvas 坐标变换
- TypedArray 作为 `data` 时通常会转移给 worker，提交后不要继续依赖原 buffer
- 同一 canvas 不能并发渲染；快速翻页先取消旧 `RenderTask`
- `rotation` 参数替换页面固有旋转；要叠加需自行 `(page.rotate + delta) % 360`
- 用完等待 `pdf.destroy()`；单页缓存可 `page.cleanup()`
- 密码可通过 `password` 或 `loadingTask.onPassword` 提供

## 一、渲染链路：四步对象流

PDF.js 的核心是一条对象链路：

```text
pdfjsLib.getDocument(src)
   │  返回 PDFDocumentLoadingTask（加载任务）
   ▼  await loadingTask.promise
PDFDocumentProxy（文档）
   │  pdf.getPage(n)  ← 页码 1 基
   ▼
PDFPageProxy（页面）
   │  page.getViewport({ scale })  → PageViewport（尺寸+变换）
   ▼  page.render({ canvas, viewport })
RenderTask  → await .promise（完成） / .cancel()（取消）
```

记住三件事：① `getDocument` 给的是**任务**不是文档；② 页码**从 1 开始**；③ `render` 给的是**任务**，要 `await .promise`。

## 二、worker 的角色

PDF 的解析（解压、字体、构建绘制指令）是 CPU 密集的同步活儿。PDF.js 把它放进 **Web Worker** 后台线程，主线程只负责把指令画到 canvas，从而不卡 UI。

```ts
// 浏览器直接集成 display build 时设置；封装已接管则沿用封装配置
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();
```

> 这就是为什么 worker 是核心机制。主库与 worker **必须完全同版本**；若 react-pdf 等上层封装已注入 worker URL / port，不要再用另一版本覆盖。

## 三、加载：url 还是 data

```ts
// 远程 URL
const pdf = await pdfjsLib.getDocument({ url: "/files/a.pdf" }).promise;

// 内存二进制（如用户选的本地文件，先转 ArrayBuffer/Uint8Array）
const buf = await file.arrayBuffer();
const pdf2 = await pdfjsLib.getDocument({ data: buf }).promise;
```

| 来源 | 适用 | 注意 |
|---|---|---|
| `url` | 服务器上的 PDF | 跨域要服务端配 CORS |
| `data` | 内存里的二进制 | 推荐 `Uint8Array`，会被转移给 worker（之后主线程别再用它） |

> base64 字符串需先 `atob` 解成二进制再传；不能直接把 `File`/`Blob` 当 `url`。

## 四、viewport 与 scale

`getViewport({ scale })` 按缩放算出该页的像素尺寸与坐标变换：

```ts
const v1 = page.getViewport({ scale: 1 });   // 原始尺寸
const v2 = page.getViewport({ scale: 2 });   // 宽高翻倍、更清晰、更耗资源
console.log(v2.width, v2.height);
```

- `scale` 是**线性缩放因子**，整页等比放大（不是只放大字体）。
- canvas 的宽高就按 `viewport.width/height` 来设。
- `rotation`（0/90/180/270）默认取页面**固有旋转** `page.rotate`，且是**替换**而非叠加。

## 五、渲染：RenderTask 与取消

```ts
const renderTask = page.render({ canvas, viewport });
await renderTask.promise; // 等渲染完成

// 翻页时取消上一次未完成的渲染
renderTask.cancel(); // 会抛 RenderingCancelledException，捕获忽略即可
```

::: warning 同一 canvas 不能并发渲染
对同一个 canvas 同时跑两个 `render` 会报「Cannot use the same canvas during multiple render operations」。SPA 快速翻页务必先 `cancel()` 旧任务。
:::

## 六、页码 1 基与遍历

```ts
console.log(pdf.numPages); // 总页数

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i); // 从 1 开始
  // ... 处理每页
}
```

> `pdf.getPage(0)` 是非法页码；没有同步的 `pdf.pages[]` 数组，页面一律 `getPage` 按需取。

## 七、读元数据

```ts
const { info, metadata } = await pdf.getMetadata();
console.log(info.Title, info.Author); // 标准信息字典
// metadata 是 XMP 元数据对象
```

## 八、错误处理与释放

```ts
try {
  const pdf = await pdfjsLib.getDocument({ url }).promise;
  // ...
  await pdf.destroy(); // 用完释放资源、解除与 worker 关联
} catch (e) {
  // 无效/损坏文件会在此被捕获（如 InvalidPDFException）
  console.error("加载失败", e);
}
```

> 受口令保护的 PDF 缺密码会抛 `PasswordException`；可用 `getDocument({ url, password })` 或 `loadingTask.onPassword` 处理。

---

进入 [指南 · 进阶](./advanced)：文本层（可选中/搜索）、注解层（链接/表单）、本地文件与远程加载、导出图片、HiDPI 完整处理。
