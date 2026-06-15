---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **1.12.0**。本篇把「会转换」用到「懂机制」：样式映射（style map）模型、内置默认映射、`:fresh` 与元素复用、字符级格式的默认处理、`messages` 的解读。

## 一、核心心智模型：按样式名映射

mammoth 不照搬 Word 的直接格式（手动设的字号、颜色、缩进），而是**只看段落/文字应用了哪个「样式名」**，据此决定输出的 HTML。

```text
Word 段落（样式名 = "Heading 1"，且作者手动调成 20px 红色）
        │  mammoth 忽略「20px 红色」这类直接格式
        ▼  只认样式名 "Heading 1"
<h1>…</h1>      ← 由默认映射 p[style-name='Heading 1'] => h1:fresh 得到
```

> 这套机制的副作用是「**倒逼语义化**」：作者越规范地用样式（而非手动排版），mammoth 的输出就越干净。反之，全靠手动格式的文档会退化成一堆 `<p>`。

## 二、样式映射的结构

一条 style mapping = 「**文档元素匹配器** `=>` **HTML 路径**」：

```text
p[style-name='Section Title']  =>  h1:fresh
└──────── 匹配器 ────────┘      └─ HTML 路径 ─┘
```

- **匹配器**：`p` 段落 / `r` run（字符级文字游程）/ `table` 表格；用 `[style-name='…']` 按样式名、`.Id` 按样式 ID、`b`/`i`/`u`/`strike` 按直接格式。
- **HTML 路径**：目标标签（可带 `.class`、`:fresh`、`>` 嵌套等修饰）。

styleMap 可写成数组（每个元素一条），也可写成字符串（每行一条，空行与 `#` 注释行被忽略）：

```ts
// 数组形式
styleMap: ["p[style-name='Title'] => h1:fresh", "r[style-name='Code'] => code"]

// 字符串形式（等价）
styleMap: "# 标题\np[style-name='Title'] => h1:fresh\nr[style-name='Code'] => code"
```

## 三、内置默认映射

即使不传任何 styleMap，mammoth 也内置了一份默认映射，覆盖最常见的结构：

| 源样式 | 输出 |
|---|---|
| Heading 1 ~ 6 | `<h1>` ~ `<h6>`（均 `:fresh`） |
| Normal / Body | `<p>` |
| 无序 / 有序列表（1~5 级） | `<ul>`/`<ol>` + `<li>` |
| footnote/endnote text | `<p>`（脚注/尾注文本） |
| Strong（字符样式） | `<strong>` |

你的自定义映射会与默认**合并、且优先匹配**。要完全只用自己的映射，设 `includeDefaultStyleMap: false`。

```ts
await mammoth.convertToHtml(input, {
  styleMap: ["p[style-name='Title'] => h1:fresh"],
  includeDefaultStyleMap: false, // 关掉所有内置默认规则
});
```

## 四、:fresh 与「元素复用」

mammoth 生成 HTML 时**只在必要时才关闭元素**，否则会复用上一个。这意味着：

```text
两个相邻的 "Heading 1" 段落，若映射成 h1（不加 :fresh）：
→ <h1>第一段\n第二段</h1>   ← 被合并进同一个 h1！

加上 :fresh（h1:fresh）：
→ <h1>第一段</h1><h1>第二段</h1>   ← 每段各开一个
```

> 所以标题、独立段落几乎都要 `:fresh`。反过来，**列表项的外层容器**（`ul`）故意**不加** `:fresh`，好让相邻列表项共享同一个 `<ul>`——这正是默认列表映射的写法。

## 五、字符级格式的默认处理

| 源格式 | 默认 | 说明 |
|---|---|---|
| 加粗 | `<strong>` | 语义化强调 |
| 斜体 | `<em>` | 语义化强调 |
| 下划线 | **忽略** | 易与链接混淆，故默认不输出 |
| 删除线 | `<s>` | — |
| 超链接 | `<a href>` | 默认保留 |

要改变默认，用直接格式匹配器覆盖（左侧是**源格式关键字**，不是目标标签）：

```ts
styleMap: [
  "b => em",        // 加粗改成 em
  "u => u",         // 让下划线输出为 <u>（默认是忽略）
  "strike => del",  // 删除线改成语义化 del
]
```

## 六、读懂 messages

```ts
const { value, messages } = await mammoth.convertToHtml({ path: "doc.docx" });

for (const m of messages) {
  // m.type: "warning" | "error"
  console.warn(`[${m.type}] ${m.message}`);
}
```

最常见的 warning 是「**An unrecognised paragraph style was ignored: 'Foo'**」——说明文档里用了样式 “Foo”，但没有任何规则匹配它。**不会丢内容**（文本仍输出为普通段落），但提示你也许该补一条映射。

## 七、忽略某些样式

把右侧写成 `!` 即彻底丢弃该元素及其内容（如不想要某种「批注/修订说明」段落）：

```ts
styleMap: ["p[style-name='Comment'] => !"]
```

---

进入 [指南 · 进阶](./guide-line/advanced)：浏览器/Node 实战、嵌套结构与 `separator`、图片自定义 `convertImage`、与 DOMPurify 的安全组合。
