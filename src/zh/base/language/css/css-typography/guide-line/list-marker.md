---
layout: doc
outline: [2, 3]
---

# 列表样式与 `::marker`

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `list-style-type`：标记符号——`disc`/`circle`/`square`（无序）、`decimal`/`lower-alpha`/`upper-roman`/`cjk-decimal`（有序）、`none`（无）
- `list-style-position`：`outside`（默认，标记在内容盒外）/ `inside`（标记并入内容、随文字折行缩进）
- `list-style-image`：用图片当标记（不灵活，多被 `::marker { content }` 取代）
- `list-style`：简写 = `type` + `position` + `image`，如 `list-style: square inside;`
- `::marker`：直接样式化标记盒（圆点/编号本身），**Baseline 广泛可用**
- `::marker` **只接受有限属性**：`color`、所有 `font-*`、`content`、`white-space`、`animation`/`transition`、`direction`/`unicode-bidi` 等——`background`、`width` 等无效
- 换标记内容：`li::marker { content: "👉 "; }`；换颜色：`li::marker { color: red; }`
- 任何 `display: list-item` 的元素（`<li>`、`<summary>`）都有标记盒，可被 `::marker` 选中
- `list-style: none` 去标记时，若需可访问列表语义，注意某些浏览器/VoiceOver 会「丢失列表语义」——必要时加 `role="list"`

## `list-style-*` 三件套

列表项前面的圆点或编号叫**标记（marker）**。三个 `list-style-*` 属性控制它的「符号、位置、图片」：

```css
ul {
  list-style-type: square; /* 实心方块 */
  list-style-position: outside; /* 标记在内容盒外（默认） */
}
```

### `list-style-type`：标记符号

| 类别 | 常用值 |
| --- | --- |
| 无序 | `disc`（实心圆，默认）、`circle`（空心圆）、`square`（方块）、`none`（无） |
| 有序 | `decimal`（1,2,3）、`decimal-leading-zero`（01,02）、`lower-alpha`（a,b,c）、`upper-alpha`、`lower-roman`（i,ii,iii）、`upper-roman`（I,II,III） |
| 中文 | `cjk-decimal`（一,二,三）、`cjk-ideographic`、`trad-chinese-formal` |
| 字符串 | 直接给字符串，如 `list-style-type: "→ "` |

```css
ol {
  list-style-type: cjk-decimal;
} /* 一、二、三 */
.checklist {
  list-style-type: "✅ ";
} /* 直接用字符串当标记 */
```

### `list-style-position`：标记里外

```css
li {
  list-style-position: outside; /* 默认：标记悬在内容盒左外侧 */
}
.inside {
  list-style-position: inside; /* 标记并入内容，折行时第二行不缩进 */
}
```

- `outside`（默认）——标记在内容盒**外**，多行文字左对齐、标记悬挂在左侧；
- `inside`——标记算进内容**内**，折行的后续行会顶到标记下方（不悬挂）。

### `list-style` 简写

```css
ul {
  list-style: square inside; /* type + position */
}
ol {
  list-style: none; /* 一次清掉符号 */
}
```

简写可任意顺序写 `type` / `position` / `image` 三者，省略的用初始值。

## `::marker`：直接样式化标记

过去想给「圆点变红、编号加粗」很麻烦（只能整体换 `list-style-image` 或伪元素 hack）。`::marker` 伪元素让你**直接选中标记盒**来设样式，已是 **Baseline 广泛可用**：

```css
/* 给无序列表的圆点上色、放大 */
ul li::marker {
  color: #e11d48;
  font-size: 1.3em;
}

/* 给有序列表的编号加粗变色 */
ol li::marker {
  color: #2563eb;
  font-weight: 700;
}
```

任何 `display: list-item` 的元素都有标记盒——除了 `<li>`，`<summary>`（`<details>` 的标题）也能用 `::marker` 调那个展开三角。

### 用 `content` 换标记内容

`::marker` 上的 `content` 能直接替换标记显示的字符：

```css
/* 把无序列表圆点换成箭头 emoji */
li::marker {
  content: "👉 ";
}

/* 有序列表：在编号后加「. 」并保留计数 */
ol li::marker {
  content: counter(list-item) ". "; /* list-item 是 ol 的隐式计数器 */
}

/* 给 details 的展开标记按开合状态换图标 */
details summary::marker {
  content: "▶ ";
}
details[open] summary::marker {
  content: "▼ ";
}
```

::: warning `::marker` 只接受「有限属性集」
`::marker` **不是**普通元素，规范只允许在它上面设一小撮属性，其余声明（如 `background`、`width`、`padding`、`border`）**会被忽略**：

- ✅ 可用：`color`、所有 `font-*`（`font-size` / `font-weight` / `font-family`…）、`content`、`white-space`、所有 `animation-*` / `transition-*`、`direction` / `unicode-bidi`、`text-combine-upright`，以及 `counter-*` / `quotes`；
- ❌ 无效：`background`、`background-color`、盒模型类（`width` / `height` / `margin` / `padding` / `border`）等。

想给标记加背景色/边框这种盒模型效果，得放弃 `::marker`，改用 `list-style: none` + `::before` 伪元素自己画（`::before` 是普通伪元素，不受此限制）。
:::

## 去标记的可访问性注意

```css
nav ul {
  list-style: none; /* 导航常去掉圆点 */
  padding-left: 0;
}
```

用 `list-style: none` 去掉标记是导航/卡片列表的常规操作，但要注意：在 **Safari + VoiceOver** 等组合下，去掉标记可能让屏幕阅读器**不再把它当列表朗读**（丢失「共 N 项」的语义）。需要保留列表语义时，显式补上 `role`：

```html
<ul role="list" style="list-style: none">
  <li>导航项 1</li>
  <li>导航项 2</li>
</ul>
```

> 这是「视觉去样式 vs 语义保留」的经典权衡：纯装饰列表无所谓，承载信息的列表建议补 `role="list"`。

## 小结

`list-style-type` 换标记符号（含中文 `cjk-decimal` 与字符串）、`list-style-position` 决定标记里外、`list-style` 一行简写；`::marker`（Baseline 广泛可用）能直接给圆点/编号设 `color` 与 `font-*`、用 `content` 换内容，但**只接受有限属性集**，要盒模型效果得退回 `::before`；去标记记得按需补 `role="list"`。标记之外，更复杂的「1.1 / 1.2.3 多级编号、给标题自动编号」要靠计数器——下一页[计数器与生成内容](./counters)。
