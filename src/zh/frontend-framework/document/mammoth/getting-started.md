---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 mammoth 并完成第一次「docx → HTML」转换。版本基线 **1.12.0**。核心认知：**mammoth 按语义样式名映射、忽略直接格式**；返回 `{ value, messages }`；**浏览器用 `{ arrayBuffer }`、Node 用 `{ path }`/`{ buffer }`**。

## 速查

- 安装：`npm i mammoth`
- 导入（Node）：`const mammoth = require("mammoth")`（ESM：`import mammoth from "mammoth"`）
- 导入（浏览器）：`const mammoth = require("mammoth/mammoth.browser")`
- 转 HTML（Node 读盘）：`const { value, messages } = await mammoth.convertToHtml({ path: "doc.docx" })`
- 转 HTML（浏览器）：`await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })`
- 抽纯文本：`await mammoth.extractRawText({ path: "doc.docx" })`
- 自定义映射：`convertToHtml(input, { styleMap: ["p[style-name='Title'] => h1:fresh"] })`
- ⚠️ mammoth **不做消毒**：输出注入页面前务必 `DOMPurify.sanitize(value)`
- ⚠️ 它**忽略直接格式**（手动字号/颜色），只认**样式名**

## 一、mammoth 是什么

官方定位：把 .docx「**convert to simple and clean HTML**」。三个关键点：

1. **重语义、轻外观**：依据样式名（如 “Heading 1”）映射成 `<h1>`，而不照搬 Word 里手动设的字号/颜色。
2. **环境无关**：浏览器与 Node 通用，只是「喂数据」的方式不同（arrayBuffer vs path/buffer）。
3. **可定制**：用 styleMap 这套小语言精确控制「哪个样式 → 哪个标签」。

> 边界提醒：mammoth 处理的是**内容到语义 HTML 的转换**，不负责像素级还原 Word 排版（那是 [docx-preview](../../document/) 的领域，见[专家篇](./guide-line/expert)对比）。

## 二、安装

```bash
npm i mammoth
# 或 pnpm add mammoth / yarn add mammoth
```

mammoth 同时提供 Node 与浏览器两个构建：默认入口是 Node 版（依赖文件系统），浏览器要引 `mammoth/mammoth.browser`（也有打包好的 `mammoth.browser.min.js`，会把 `mammoth` 挂到 `window` 全局）。

## 三、导入方式

```ts
// Node（CommonJS）
const mammoth = require("mammoth");

// Node（ESM）
import mammoth from "mammoth";

// 浏览器（打包器里）
const mammoth = require("mammoth/mammoth.browser");
```

> 顶层 API：`convertToHtml` / `extractRawText` / `convertToMarkdown`（已弃用）/ `embedStyleMap` / `readEmbeddedStyleMap`；图片转换器在 `mammoth.images.*`，变换辅助在 `mammoth.transforms.*`。

## 四、第一次「转 HTML」

```ts
import mammoth from "mammoth";

// Node：直接读磁盘
const result = await mammoth.convertToHtml({ path: "doc.docx" });

console.log(result.value);    // 生成的 HTML 字符串
console.log(result.messages); // 警告/错误数组（如未识别的样式）
```

所有转换函数都返回 `Promise<{ value, messages }>`：`value` 是结果字符串，`messages` 收集转换过程中的 warning / error。**别忽略 messages**——它会告诉你哪些样式没被识别。

## 五、浏览器里转换上传的文件

浏览器没有文件系统、也没有 Node Buffer，要先把 `File` 转成 `ArrayBuffer`：

```ts
const mammoth = require("mammoth/mammoth.browser");

input.addEventListener("change", async () => {
  const file = input.files[0];
  const { value } = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  // ⚠️ 注入页面前先消毒
  container.innerHTML = DOMPurify.sanitize(value);
});
```

> Node 端是 `{ path }` 或 `{ buffer }`（Node Buffer）；浏览器端是 `{ arrayBuffer }`。三者只是输入形态不同，转换逻辑一致。

## 六、只要纯文本：extractRawText

如果你只想做全文检索、摘要或内容迁移，不需要任何格式：

```ts
const { value } = await mammoth.extractRawText({ path: "doc.docx" });
// value 是纯文本，每个段落后跟两个换行，没有任何 HTML 标签
```

> `extractRawText` 丢弃所有格式与结构，比 `convertToHtml` 更轻量；它不接受 styleMap（没有格式可映射）。

## 七、第一次自定义映射

默认映射已覆盖 Heading 1~6、Normal、列表等。若你的文档用了自定义样式名（如 “Section Title”），补一条映射即可：

```ts
const result = await mammoth.convertToHtml(
  { path: "doc.docx" },
  {
    styleMap: [
      "p[style-name='Section Title'] => h1:fresh",
      "p[style-name='Subsection Title'] => h2:fresh",
    ],
  },
);
```

> 自定义映射会与内置默认映射**合并且优先**。`:fresh` 表示每个匹配段落都新开一个元素（标题几乎都要它，详见[指南 · 进阶](./guide-line/advanced)）。

## 八、一个必记点：mammoth 不做消毒

```ts
import DOMPurify from "dompurify";

const { value } = await mammoth.convertToHtml({ arrayBuffer });
el.innerHTML = DOMPurify.sanitize(value); // 处理不受信任的 docx 时务必这样
```

::: warning 安全
官方明确：mammoth **不对源文档做任何 sanitisation**。源文档可能含 `javascript:` 链接、外部文件引用等。处理用户上传的 docx 时，**必须对输出 HTML 消毒**，并保持 `externalFileAccess` 默认关闭。
:::

---

跑通转换后，进入 [指南 · 基础](./guide-line/base)：样式映射机制、默认 style map、`:fresh` 与元素复用、`messages` 的解读。
