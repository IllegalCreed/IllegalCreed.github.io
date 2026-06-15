---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **1.12.0**。把 mammoth 用进真实项目：浏览器上传转换、Node 服务端处理、嵌套结构与 `separator`、前缀/ID 匹配、图片自定义 `convertImage`、以及与 DOMPurify 的安全组合。

## 一、浏览器：转换上传的 docx

```ts
const mammoth = require("mammoth/mammoth.browser");
import DOMPurify from "dompurify";

input.addEventListener("change", async () => {
  const file = input.files[0];
  const { value, messages } = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  preview.innerHTML = DOMPurify.sanitize(value); // 必须消毒
  if (messages.length) console.warn(messages);
});
```

> 浏览器只能用 `{ arrayBuffer }`；记得引 `mammoth/mammoth.browser`（不带 Node 的 fs/Buffer 依赖）。

## 二、Node：从 buffer 转换（如来自上传中间件）

服务端拿到的常是 Buffer（Multer 等），直接用 `{ buffer }`，不必落地磁盘：

```ts
import mammoth from "mammoth";

app.post("/import", upload.single("doc"), async (req, res) => {
  const { value } = await mammoth.convertToHtml({ buffer: req.file.buffer });
  res.json({ html: value }); // 前端拿到后再消毒渲染
});
```

> Node 端 `{ path }`（读盘）与 `{ buffer }`（内存）二选一；浏览器端才是 `{ arrayBuffer }`。

## 三、嵌套结构：把多段聚合进一个容器

用 `>` 表示嵌套、靠「只给内层加 `:fresh`」让相邻段共享外层容器。经典「侧边栏（aside）」：

```ts
styleMap: [
  "p[style-name='Aside Heading'] => div.aside > h2:fresh",
  "p[style-name='Aside Text']    => div.aside > p:fresh",
];
// 连续的 Aside 段落 → 共享同一个 <div class="aside">，内部各自 h2/p
```

> 外层 `div.aside` 不加 `:fresh`，所以相邻的 aside 段落会落进**同一个** div；内层 `h2`/`p` 加 `:fresh`，各自独立。

## 四、代码块：separator 折叠

把连续多段折叠进**一个** `<pre>`、段间插换行：

```ts
styleMap: ["p[style-name='Code Block'] => pre:separator('\\n')"];
```

::: warning 别加 :fresh
代码块要的是「合并」，所以**不能**加 `:fresh`（那会让每段各开一个 `<pre>`）。`separator('\n')` 指定折叠时在相邻段之间插入的字符。
:::

## 五、前缀匹配与样式 ID

```ts
styleMap: [
  "p[style-name^='Heading'] => h2:fresh", // 所有以 Heading 开头的样式
  "p.Quote => blockquote:fresh",          // 按样式 ID（点号）匹配
];
```

> `^=` 是前缀匹配，适合批量处理一类命名规律的样式。按样式 ID（`.Id`）匹配多用于样式名不确定时；官方更推荐用 style-name（更直观、跨语言文档更稳）。

## 六、自定义图片：convertImage

默认图片内嵌为 base64 data URI（`mammoth.images.dataUri`）。要改成「上传后引用 URL」：

```ts
const options = {
  convertImage: mammoth.images.imgElement(async (image) => {
    const buffer = await image.readAsBuffer();          // Node 端
    const url = await uploadToOSS(buffer, image.contentType);
    return { src: url };                                 // 作为 <img src>
  }),
};
```

保持默认（内嵌 base64）的等价写法：

```ts
mammoth.images.imgElement(async (image) => {
  const b64 = await image.readAsBase64String();
  return { src: `data:${image.contentType};base64,${b64}` };
});
```

> 浏览器端优先 `readAsBase64String()` / `readAsArrayBuffer()`（跨环境）；`readAsBuffer()` 返回 Node Buffer，浏览器没有。

## 七、安全：永远先消毒

mammoth **不做任何 sanitisation**。处理不受信任的 docx 时：

```ts
import DOMPurify from "dompurify";

const { value } = await mammoth.convertToHtml({ arrayBuffer });
el.innerHTML = DOMPurify.sanitize(value);
```

并保持 `externalFileAccess` 默认 `false`（禁止文档访问外部文件，防 SSRF/读本地文件）。仅在**信任**文档时才显式开启。

## 八、空段落与 id 前缀

```ts
// 保留空段落（默认是忽略的）
await mammoth.convertToHtml(input, { ignoreEmptyParagraphs: false });

// 同页嵌入多份转换结果时，给每份不同前缀避免 id（脚注锚点等）冲突
await mammoth.convertToHtml(input, { idPrefix: "docA-" });
```

## 九、把映射做成外部文件（CLI）

```bash
# map.txt 里每行一条规则
mammoth report.docx report.html --style-map=map.txt

# 图片导出为独立文件而非内嵌
mammoth report.docx --output-dir=out-dir
```

---

进入 [指南 · 专家](./guide-line/expert)：默认映射的精确顺序与优先级、transformDocument 按字体识别代码、embedStyleMap 内嵌映射、与 docx-preview / docx 的选型。
