---
layout: doc
outline: [2, 3]
---

# 参考

> PDF.js（`pdfjs-dist`）常用 API、`getDocument` 选项、渲染参数、对象方法与文本/注解层速查。版本基线 **6.0.x**。

## 一、顶层 API（pdfjsLib.*）

| 成员 | 作用 | 备注 |
|---|---|---|
| `getDocument(src)` | 加载 PDF | 返回 `PDFDocumentLoadingTask`，取 `.promise` 得文档 |
| `GlobalWorkerOptions.workerSrc` | 指定 worker 脚本路径 | **使用前必设**；与主库同版本 |
| `version` | 当前 PDF.js 版本号 | 用于核对主库/worker 一致 |
| `TextLayer` | 文本层类 | 渲染可选中文字（替代旧 `renderTextLayer`） |
| `AnnotationLayer` | 注解层类 | 渲染链接/表单等交互注解 |
| `AnnotationMode` | 注解模式常量 | 控制渲染哪些注解 |
| `PasswordResponses` | 口令回调常量 | 配合 `onPassword` 使用 |

## 二、getDocument 参数（DocumentInitParameters，节选）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `url` | string \| URL | — | PDF 的 URL |
| `data` | Uint8Array \| ArrayBuffer | — | 内存中的二进制 PDF（推荐 Uint8Array，会转移给 worker） |
| `httpHeaders` | object | — | 自定义请求头（如 Authorization） |
| `withCredentials` | boolean | `false` | 跨站请求是否带 Cookie/凭据 |
| `password` | string | — | 解密受口令保护的 PDF |
| `cMapUrl` | string | — | Adobe CMap 资源目录（CJK 字体需要，含尾斜杠） |
| `cMapPacked` | boolean | `true` | CMap 是否二进制打包 |
| `standardFontDataUrl` | string | — | 标准字体资源目录（非内嵌字体需要） |
| `wasmUrl` | string | — | wasm 资源目录（图像解码/ICC 等） |
| `disableRange` | boolean | `false` | 禁用范围请求分块加载 |
| `disableStream` | boolean | `false` | 禁用流式加载 |
| `worker` | PDFWorker | — | 复用一个自建 worker 实例 |
| `verbosity` | number | — | 日志级别（VerbosityLevel） |

> 加载远程 URL 跨域时，需**目标服务器**返回正确的 CORS 头；PDF.js 端无法绕过同源策略。

## 三、PDFDocumentLoadingTask（getDocument 的返回）

| 成员 | 作用 |
|---|---|
| `.promise` | resolve 为 `PDFDocumentProxy`；无效/损坏文件会 reject（如 `InvalidPDFException`） |
| `.onProgress = ({loaded,total}) => {}` | 加载进度回调（做进度条） |
| `.onPassword = (updatePassword, reason) => {}` | 需要口令时回调 |
| `.destroy()` | 取消加载并释放资源 |

## 四、PDFDocumentProxy（文档对象）

| 成员 | 作用 |
|---|---|
| `numPages` | 总页数（同步属性） |
| `getPage(n)` | 取第 n 页（**1 基**），返回 `PDFPageProxy` |
| `getMetadata()` | 取元数据：`{ info, metadata }`（Title/Author/… 与 XMP） |
| `getOutline()` | 取大纲/书签树 |
| `getAttachments()` | 取附件 |
| `getData()` | 取原始 PDF 字节 |
| `destroy()` | 释放文档资源、解除与 worker 关联 |

## 五、PDFPageProxy（页面对象）

| 成员 | 作用 |
|---|---|
| `getViewport({ scale, rotation })` | 算出渲染视口（尺寸 + 变换） |
| `render(params)` | 渲染到画布，返回 `RenderTask` |
| `getTextContent(opts)` | 取文本内容（`items` 为 TextItem 数组） |
| `getAnnotations({ intent })` | 取注解数据（链接/表单等） |
| `getOperatorList()` | 取底层绘制指令（高级用法） |
| `cleanup()` | 清理该页缓存的资源 |
| `rotate` | 页面固有旋转角 |

## 六、getViewport 参数

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `scale` | number | — | 线性缩放因子（2 = 宽高翻倍、更清晰） |
| `rotation` | number | `page.rotate` | 旋转角（0/90/180/270）；**替换**固有旋转，非叠加 |
| `offsetX` / `offsetY` | number | `0` | 偏移 |
| `dontFlip` | boolean | `false` | 是否不翻转 Y 轴 |

返回的 `PageViewport` 有 `width` / `height`（像素）、`transform` 等。

## 七、render 参数（RenderParameters，节选）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `canvas` | HTMLCanvasElement | — | 目标画布（**推荐**） |
| `canvasContext` | 2D context | — | 目标画布上下文（向后兼容；与 canvas 二选一） |
| `viewport` | PageViewport | — | 由 `getViewport` 得到（**必需**） |
| `transform` | number[] | `null` | 视口前再叠加的变换（HiDPI 用） |
| `intent` | string | `"display"` | 渲染用途：`display` / `print` / `any` |
| `annotationMode` | number | — | 渲染哪些注解（AnnotationMode） |
| `background` | string | `"rgb(255,255,255)"` | 画布背景填充 |
| `optionalContentConfigPromise` | Promise | — | 可选内容（图层）配置 |
| `pageColors` | object | — | 高对比模式的前/背景色覆盖 |

## 八、RenderTask（render 的返回）

| 成员 | 作用 |
|---|---|
| `.promise` | 渲染完成时 resolve |
| `.cancel()` | 取消渲染（会抛 `RenderingCancelledException`，捕获忽略） |

> 同一个 canvas **不能并发** render；翻页时先 `cancel()` 旧任务再渲染新页。

## 九、TextItem（getTextContent().items 的元素）

| 字段 | 含义 |
|---|---|
| `str` | 该片段的文本字符串 |
| `transform` | 6 元素变换矩阵（位置/缩放，用于文本层定位） |
| `width` / `height` | 该片段的宽高 |
| `dir` | 书写方向（`ltr` / `rtl`） |
| `fontName` | 字体名（对应 `styles` 字典） |
| `hasEOL` | 是否片段末尾换行 |

## 十、文本层 / 注解层（类式 API，v4+）

```ts
// 文本层：可选中/可搜索文字
const textLayer = new pdfjsLib.TextLayer({
  textContentSource: await page.getTextContent(),
  container: textLayerDiv, // 叠在 canvas 上、同 viewport 尺寸
  viewport,
});
await textLayer.render();

// 注解层：链接、表单等交互
const annotationLayer = new pdfjsLib.AnnotationLayer({
  div: annotationLayerDiv,
  viewport,
  page,
});
await annotationLayer.render({
  annotations: await page.getAnnotations(),
  viewport,
});
```

> 旧的函数式 `renderTextLayer(...)` 已**弃用**，改用 `TextLayer` 类。

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解渲染链路与对象模型，或 [指南 · 进阶](./guide-line/advanced) 看文本层/注解层/本地文件等实战。
