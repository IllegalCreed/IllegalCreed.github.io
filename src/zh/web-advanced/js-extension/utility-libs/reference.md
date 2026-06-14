---
layout: doc
outline: [2, 3]
---

# 参考

> 7 个小库的 API 速查。版本基线：mitt 3.x、qs 6.x、JSZip 3.10.x、FileSaver 2.0.x、qrcode 1.5.x、chroma.js 3.x、marked 18.x。

## 一、mitt

```ts
import mitt from "mitt";
const bus = mitt<Events>();
```

| 成员 | 说明 |
|---|---|
| `mitt(all?)` | 创建发射器，可传入初始 `all`（`Map`） |
| `on(type, handler)` | 订阅事件；`type` 为 `'*'` 时监听所有，回调签名 `(type, payload)` |
| `off(type, handler?)` | 取消订阅；省略 `handler` 移除该事件全部监听 |
| `emit(type, payload?)` | 触发事件；先类型化 handler、后 `'*'` 通配 |
| `all` | `Map<事件名 | '*', handler[]>`；`all.clear()` 清空全部 |

> 无 `once`；方法不依赖 `this`，可解构使用。

## 二、qs

```ts
import qs from "qs";
qs.parse(str, options?);
qs.stringify(obj, options?);
```

**parse 常用选项**

| 选项 | 默认 | 含义 |
|---|---|---|
| `depth` | `5` | 最大嵌套深度 |
| `parameterLimit` | `1000` | 最大参数数 |
| `arrayLimit` | `20` | 超过则数组转对象 |
| `allowDots` | `false` | 支持 `a.b=c` |
| `ignoreQueryPrefix` | `false` | 剥离前导 `?` |
| `delimiter` | `'&'` | 分隔符（可正则） |
| `strictDepth` | `false` | 超深度抛错 |
| `throwOnLimitExceeded` | `false` | 超限抛错 |

**stringify 常用选项**

| 选项 | 默认 | 含义 |
|---|---|---|
| `arrayFormat` | `'indices'` | `indices`/`brackets`/`repeat`/`comma` |
| `encode` | `true` | URI 编码输出 |
| `encodeValuesOnly` | `false` | 只编码值、不编码键 |
| `allowDots` | `false` | 用点号表达嵌套 |
| `addQueryPrefix` | `false` | 前置 `?` |
| `skipNulls` | `false` | 跳过 null |
| `strictNullHandling` | `false` | 区分 null 与空串 |
| `format` | `'RFC3986'` | 空格编码：`%20` / `RFC1738` 用 `+` |

## 三、JSZip

```ts
import JSZip from "jszip";
const zip = new JSZip();
```

| 方法 | 说明 |
|---|---|
| `zip.file(name, data, opts?)` | 加/改文件（`data`: string/Blob/ArrayBuffer/Uint8Array/Promise…） |
| `zip.file(name)` | 取 ZipObject |
| `zip.folder(name)` | 创建/进入目录，返回子 JSZip |
| `zip.remove(name)` | 删除文件/目录 |
| `zip.forEach((path, entry) => {})` | 遍历条目 |
| `zip.filter((path, entry) => boolean)` | 筛选 |
| `zip.files` | `{ [path]: ZipObject }` |
| `zip.generateAsync({ type })` | 生成，返回 Promise |
| `JSZip.loadAsync(data)` | 读取已有 zip，返回 `Promise<JSZip>` |
| `zipObject.async(type)` | 读出单文件内容 |

**type 取值**：`blob` / `nodebuffer` / `base64` / `uint8array` / `arraybuffer` / `string` / `binarystring`

**generateAsync 其它选项**：`compression`（`STORE`/`DEFLATE`）、`compressionOptions.level`（1~9）

## 四、FileSaver.js

```ts
import { saveAs } from "file-saver";
saveAs(Blob | File | url, filename?, { autoBom });
```

| 参数 | 说明 |
|---|---|
| 第一参 | `Blob` / `File` / URL 字符串 |
| `filename` | 保存的文件名 |
| `options.autoBom` | `blob` 含 `charset=utf-8` 时加 UTF-8 BOM |

> 只触发下载，不产生内容；跨源 URL 需服务端 CORS。

## 五、qrcode

```ts
import QRCode from "qrcode";
```

| 方法 | 输出 | 环境 |
|---|---|---|
| `toCanvas(canvas, text, opts?)` | 画到 canvas | 浏览器 / Node |
| `toDataURL(text, opts?)` | base64 Data URL | 浏览器 / Node |
| `toString(text, opts?)` | 字符串（`utf8`/`svg`/`terminal`） | 浏览器 / Node |
| `toFile(path, text, opts?)` | 写文件（`png`/`svg`/`utf8`） | **仅 Node** |
| `toBuffer(text, opts?)` | Buffer | Node |
| `create(text, opts?)` | QR 数据对象（不渲染） | 通用 |

**常用 options**

| 选项 | 默认 | 含义 |
|---|---|---|
| `errorCorrectionLevel` | `M` | `L`~7% / `M`~15% / `Q`~25% / `H`~30% |
| `version` | 自动 | 1~40 |
| `margin` | `4` | 静默区宽度 |
| `scale` | `4` | 每模块像素数 |
| `width` | — | 总宽（覆盖 scale） |
| `color.dark` / `color.light` | `#000` / `#fff` | RGBA hex |

> 所有渲染方法均支持回调与 Promise 两种风格。

## 六、chroma.js

```ts
import chroma from "chroma-js";
```

**构造 / 转换**

| API | 说明 |
|---|---|
| `chroma(input)` | hex / CSS 名 / 数组 |
| `chroma.rgb/hsl/lab/lch(...)` | 按空间构造 |
| `.rgb()/.hsl()/.lab()/.lch()` | 取对应数组 |
| `.hex()/.css()/.num()` | 取字符串/数值 |
| `.alpha(v?)` | 读/设透明度 |
| `.luminance()` | 相对亮度 |
| `.darken()/.brighten()/.saturate()/.desaturate()` | 调整（链式） |

**混合 / 色阶 / 工具**

| API | 说明 |
|---|---|
| `chroma.mix(a, b, ratio=0.5, mode='lrgb')` | 两色插值 |
| `chroma.average(colors, mode='lrgb')` | 平均色 |
| `chroma.blend(a, b, mode)` | 图层混合（multiply/screen…） |
| `chroma.scale([colors])` | 色阶函数；`(0~1)` 取色 |
| `scale.domain([min,max])` | 设输入数值范围（连续） |
| `scale.classes(n)` | 切 n 个离散分级 |
| `scale.mode('lab')` | 插值空间（默认 `rgb`） |
| `scale.colors(n)` | 取 n 个等距色 |
| `chroma.contrast(a, b)` | WCAG 对比度（1~21） |
| `chroma.deltaE(a, b)` | CIE2000 色差（0~100） |
| `chroma.brewer` | ColorBrewer 调色板 |
| `chroma.valid(c)` | 校验颜色 |

## 七、marked

```ts
import { marked, Marked } from "marked";
marked.parse(md, options?); // 或 marked(md)
marked.parseInline(md); // 仅行内
```

| 选项 | 默认 | 含义 |
|---|---|---|
| `gfm` | `true` | GitHub Flavored Markdown |
| `breaks` | `false` | 单换行 → `<br>` |
| `pedantic` | `false` | 严格 markdown.pl |
| `async` | `false` | 返回 `Promise<string>` |
| `renderer` | — | 自定义渲染（`marked.use`） |
| `tokenizer` | — | 自定义分词 |
| `walkTokens` | — | 遍历每个 token |

| API | 说明 |
|---|---|
| `marked.use({ renderer/extensions/...})` | 注册渲染器/扩展/选项（全局） |
| `new Marked(options)` | 独立实例，避免污染全局 |
| `marked.lexer(md)` / `marked.parser(tokens)` | 底层分词 / 解析 |

> ⚠️ `sanitize` / `sanitizer` 已移除；防 XSS 用 [DOMPurify](../dompurify/)：`DOMPurify.sanitize(marked.parse(md))`。

---

速查完毕。回 [入门](./getting-started) 看示例，或进 [指南 · 基础](./guide-line/base) 理解机制。
