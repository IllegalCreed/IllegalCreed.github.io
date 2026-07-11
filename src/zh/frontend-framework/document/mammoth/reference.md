---
layout: doc
outline: [2, 3]
---

# 参考

> mammoth.js 常用 API、转换选项、styleMap 语法、图片转换器与 messages 速查。版本基线 **1.12.0**。

## 速查

- Node 输入：`{ path }` / `{ buffer }`；浏览器输入：`{ arrayBuffer }`
- HTML：`await mammoth.convertToHtml(input, options)`；纯文本：`await mammoth.extractRawText(input)`
- 返回 `{ value, messages }`；HTML 的 `value` 是片段，不是完整页面，生产中要记录 `messages`
- 自定义映射优先级：调用方 `styleMap` → 文档内嵌映射 → 内置默认映射
- 图片读取优先 `readAsBase64String` / `readAsArrayBuffer` / Node 的 `readAsBuffer`；旧 `read()` 已弃用
- 不可信文档：保持 `externalFileAccess: false`，转换设置大小/时间/内存边界，HTML 注入前消毒
- `convertToMarkdown` 已弃用；`transformDocument` 不稳定，使用时锁版本并加回归测试

## 一、顶层 API

| 函数 | 作用 | 返回 |
|---|---|---|
| `convertToHtml(input, options?)` | .docx → HTML | `Promise<{ value, messages }>` |
| `extractRawText(input)` | .docx → 纯文本（丢格式） | `Promise<{ value, messages }>` |
| `convertToMarkdown(input, options?)` | .docx → Markdown（**已弃用**） | `Promise<{ value, messages }>` |
| `embedStyleMap(input, styleMap)` | 把样式映射写进 docx | `Promise<{ toBuffer(), toArrayBuffer() }>` |
| `readEmbeddedStyleMap(input)` | 读取文档已内嵌的样式映射 | `Promise<...>` |
| `images.imgElement(fn)` | 构造自定义图片转换器 | ImageConverter |
| `images.dataUri` | 默认图片转换器（内嵌 base64） | ImageConverter |
| `transforms.paragraph(fn)` / `transforms.run(fn)` | 段落/run 变换辅助（**unstable**） | transform |

## 二、input 形态（环境差异）

| 写法 | 环境 | 含义 |
|---|---|---|
| `{ path: "doc.docx" }` | **仅 Node** | 从磁盘路径读取 |
| `{ buffer: nodeBuffer }` | **仅 Node** | Node Buffer |
| `{ arrayBuffer: ab }` | **浏览器** | ArrayBuffer（`await file.arrayBuffer()`） |

> 浏览器无文件系统、无 Buffer，只能用 `arrayBuffer`；且需引 `mammoth/mammoth.browser`。

## 三、convertToHtml 选项（Options）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `styleMap` | string \| string[] | — | 自定义样式映射（与默认合并、优先） |
| `includeDefaultStyleMap` | boolean | `true` | 是否纳入内置默认映射 |
| `includeEmbeddedStyleMap` | boolean | `true` | 是否纳入文档内嵌映射 |
| `convertImage` | ImageConverter | `images.dataUri` | 图片处理方式 |
| `ignoreEmptyParagraphs` | boolean | `true` | 是否忽略空段落 |
| `idPrefix` | string | `""` | 给生成的 id（书签/脚注锚点）加前缀 |
| `externalFileAccess` | boolean | `false` | 是否允许访问文档引用的外部文件（安全） |
| `transformDocument` | (el) => el | identity | 转 HTML 前对文档 AST 变换（**unstable**） |

## 四、result 与 messages

```ts
interface Result { value: string; messages: Message[]; }
type Message =
  | { type: "warning"; message: string }
  | { type: "error"; message: string; error: unknown };
```

> 最常见的是 warning：「遇到未被 styleMap 识别的样式」。生产中应检查/记录 messages。

## 五、styleMap：文档元素匹配器（`=>` 左侧）

| 写法 | 匹配 |
|---|---|
| `p` / `r` / `table` | 任意段落 / run（字符级文字游程）/ 表格 |
| `p[style-name='Heading 1']` | 样式**名**为 Heading 1 的段落 |
| `p[style-name^='Heading']` | 样式名以 Heading **开头**（前缀 `^=`） |
| `p.Heading1` / `r.Strong` | 按样式 **ID** 匹配（点号） |
| `b` / `i` / `u` / `strike` | 直接（显式）加粗 / 斜体 / 下划线 / 删除线 |
| `p:unordered-list(1)` / `p:ordered-list(1)` | 第 1 级无序 / 有序列表项 |
| `comment-reference` | 批注引用 |

## 六、styleMap：HTML 路径（`=>` 右侧）

| 写法 | 含义 |
|---|---|
| `h1` / `p` / `div` | 生成对应元素 |
| `h2.section-title` | 带 class：`<h2 class="section-title">` |
| `:fresh` | 每个匹配段落都新开一个元素（不复用） |
| `div.aside > p:fresh` | 嵌套：外层 div.aside，内层 p（`>` 表层级） |
| `ul\|ol > li` | `\|` 表备选（任一），用于多级列表 |
| `pre:separator('\n')` | 折叠多段进同一元素，段间插分隔符 |
| `!`（如 `p[...] => !`） | 忽略该元素及其内容，不输出 |
| 右侧留空（如 `r[...] =>`） | 不为该匹配生成任何包裹元素 |

## 七、字符级格式的默认输出

| 源格式 | 默认输出 | 覆盖示例 |
|---|---|---|
| 加粗（b） | `<strong>` | `b => em` |
| 斜体（i） | `<em>` | `i => strong` |
| 下划线（u） | **忽略**（避免与链接混淆） | `u => em` |
| 删除线（strike） | `<s>` | `strike => del` |
| 超链接 | `<a href>`（默认保留） | — |
| 批注 | **忽略** | `comment-reference => sup` |
| 图片 | 内嵌 base64 `<img>` | 用 `convertImage` |

## 八、内置默认 style map（节选）

```text
p[style-name='Heading 1'] => h1:fresh   （Heading 2~6 同理 → h2~h6）
p[style-name='Normal']    => p:fresh
r[style-name='Strong']    => strong
p:unordered-list(1)       => ul > li:fresh
p:ordered-list(1)         => ol > li:fresh
p[style-name='footnote text'] => p:fresh
r[style-name='Hyperlink'] =>            （清空 Hyperlink 字符样式，链接仍转 a）
```

> 还兼容 LibreOffice（Footnote/Endnote）、Apple Pages（Heading/Body）等样式名。

## 九、图片转换器（image 对象）

| 成员 | 说明 |
|---|---|
| `image.contentType` | 如 `image/png` |
| `image.readAsBase64String()` | → `Promise<base64 字符串>`（跨环境，最常用） |
| `image.readAsArrayBuffer()` | → `Promise<ArrayBuffer>`（跨环境） |
| `image.readAsBuffer()` | → `Promise<Buffer>`（**仅 Node**） |
| `image.read([encoding])` | **已弃用**；改用上述显式方法 |
| 回调返回 | `{ src, ... }` 作为 `<img>` 属性；alt 自动补 |

## 十、CLI

```bash
mammoth doc.docx output.html               # 转换（无输出文件则打到 stdout）
mammoth doc.docx --output-dir=out-dir      # 图片导出为独立文件
mammoth doc.docx output.html --style-map=map.txt   # 外部样式映射文件
mammoth doc.docx --output-format=markdown  # 输出 Markdown（已弃用）
```

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解映射机制，或 [指南 · 进阶](./guide-line/advanced) 看实战与选项组合。
