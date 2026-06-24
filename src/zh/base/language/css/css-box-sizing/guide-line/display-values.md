---
layout: doc
outline: [2, 3]
---

# display 全谱

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `display` 同时设两件事：**外显示类型**（怎么参与父级的流）+ **内显示类型**（子元素怎么排）
- 外显示类型：`block`（块盒，前后换行、默认占满行向空间）/ `inline`（行内盒，随文字流、不换行）
- 内显示类型：`flow`（普通流）/ `flow-root`（普通流 + 开 BFC）/ `flex` / `grid` / `table` / `ruby`
- 现代双值语法：`display: block flow`、`display: inline flow-root`、`display: block flex`……
- 单值简写对照：`block` = `block flow`、`inline` = `inline flow`、`inline-block` = `inline flow-root`、`flow-root` = `block flow-root`、`flex` = `block flex`、`grid` = `block grid`
- `inline-block`：像行内盒一样随文字排，但**尊重宽高与上下外边距**，且自己开 BFC
- `display: none`：从盒树**彻底移除**，不占空间，子孙全部隐藏，也从无障碍树移除
- `display: contents`：**移除自己这一层盒子**，子元素「上浮」当作父级的直接子元素——给「多余包装层」脱壳用
- `display: flow-root`：生成块盒并**开一个新 BFC**（清浮动 / 止合并的现代答案，见下页）
- 只写内显示类型时外类型默认 `block`（`ruby` 例外，默认 `inline`）；`display` 整体 Baseline 广泛可用

## `display` 其实设两件事

很多人把 `display` 当成「一个值切一种布局」，但规范里它**同时**设定两个维度：

- **外显示类型（`<display-outside>`）**：这个盒子对**外**怎么参与父级的布局——是独占一行的**块盒**（`block`），还是混在文字里的**行内盒**（`inline`）。
- **内显示类型（`<display-inside>`）**：这个盒子对**内**怎么安排它的子元素——普通流（`flow`）、弹性布局（`flex`）、网格（`grid`）等。

理解了这个「外 + 内」的二维结构，`display` 的一长串取值就不再需要死记。

### 现代双值语法

CSS Display Module Level 3 引入了把两个维度**显式分开写**的双值语法：

```css
.a { display: block flow; }       /* 块盒，子元素走普通流 */
.b { display: inline flow; }      /* 行内盒，子元素走普通流 */
.c { display: inline flow-root; } /* 行内盒，但自己开 BFC */
.d { display: block flow-root; }  /* 块盒，自己开 BFC */
.e { display: block flex; }       /* 块级 flex 容器 */
.f { display: inline grid; }      /* 行内级 grid 容器 */
```

只写一个内显示类型时，外类型默认补 `block`（`ruby` 例外，默认 `inline`）。

### 单值简写：你天天在写的那些

平时写的全是上面双值的**预合成简写**，对照表如下：

| 单值（你写的） | = 双值（它真正的意思） | 含义 |
| --- | --- | --- |
| `block` | `block flow` | 块盒 + 普通流 |
| `inline` | `inline flow` | 行内盒 + 普通流 |
| `inline-block` | `inline flow-root` | 行内盒 + 自己开 BFC |
| `flow-root` | `block flow-root` | 块盒 + 自己开 BFC |
| `flex` | `block flex` | 块级 flex 容器 |
| `inline-flex` | `inline flex` | 行内级 flex 容器 |
| `grid` | `block grid` | 块级 grid 容器 |
| `inline-grid` | `inline grid` | 行内级 grid 容器 |
| `list-item` | `block flow list-item` | 块盒 + 普通流 + 生成项目符号 |

::: tip 双值语法的 Baseline
现代浏览器都已支持双值语法。但实务上单值简写更短、更通用，仍是主流写法；双值语法的价值在于**帮你理解** `display` 的二维本质——比如一眼看穿 `inline-block` 其实是「行内盒 + flow-root」。
:::

## block / inline / inline-block：流里的三种身份

普通流里最常打交道的是这三个，区别在于「怎么参与排版」：

```css
.block        { display: block; }        /* 独占一行，默认占满行向宽度 */
.inline       { display: inline; }       /* 随文字排，宽高 / 上下 margin 无效 */
.inline-block { display: inline-block; } /* 随文字排，但宽高 / 上下 margin 生效 */
```

- **`block`（块盒）**：前后自带换行，**默认填满父级的行向（inline）空间**——所以一个 `<div>` 不设宽度也会撑满一整行。`<div>`、`<p>`、`<section>` 默认都是块盒。
- **`inline`（行内盒）**：像一个词一样嵌在文字流里，**不换行**。关键限制：`width` / `height` 对它无效，**上下（块向）外边距也不被其他元素「尊重」**——你给一个 `<span>` 设 `margin-top`，周围元素不会因此让位。`<span>`、`<a>`、`<strong>` 默认都是行内盒。
- **`inline-block`（行内块）**：兼具两者——**像行内盒一样**和文字排在一行，但**像块盒一样尊重 `width` / `height` 和上下外边距**。它本质是 `inline flow-root`，所以**自己还开了一个 BFC**。需要「一排小方块、每块能设固定尺寸」时常用它（不过今天这类需求多半交给 Flex / Grid 了）。

::: warning 行内盒的外边距「不被尊重」是什么意思
web.dev 的原话：`inline` 元素「有块向外边距，但其他元素不尊重它」。也就是说外边距值存在，却不会真的把上下的元素推开。`inline-block` 则修好了这点——「其他元素会尊重它的块向外边距」。需要垂直间距时，别用纯 `inline`。
:::

## flow-root：专为「开 BFC」而生

`display: flow-root` 生成一个**块盒**，并让它**建立一个新的块格式化上下文（BFC）**。它没有任何别的副作用——名字里的 `flow-root`（流的根）正是这个意思：让这个盒子像文档根 `<html>` 一样，**为内部的普通流开一个独立上下文**。

它最经典的两个用途——**包住内部浮动（清浮动）**和**阻止父子外边距合并**——是下一页的主角：[外边距合并与 BFC](./margin-collapse-bfc)。在 `flow-root`（2019 起 Baseline）之前，人们只能用 `overflow: hidden`、`overflow: auto` 等「副作用开 BFC」的黑魔法，现在有了语义明确、无副作用的正解。

## none vs contents：两种「消失」，天差地别

这两个值都让元素「不见了」，但机制完全相反，混用会出大问题。

### `display: none`：彻底移除

```css
.hidden {
  display: none;
}
```

元素被**从盒树里彻底删除**：不渲染、不占任何空间、**所有子孙一并消失**，并且**从无障碍树移除**——屏幕阅读器读不到它。需要「真正藏起来、连位置都不留」时用它。

::: tip 想留下占位空间？用 `visibility: hidden`
`display: none` 不留空间；如果你要的是「看不见但位置还在」（比如占位防跳动），用 `visibility: hidden`——它保留布局空间，只是不可见。两者别混淆。
:::

### `display: contents`：盒子脱壳，子元素上浮

```css
.unwrap {
  display: contents;
}
```

`contents` 只**移除元素自己这一层盒子**，但**保留它的子元素**——子元素「上浮」，表现得就像是父级的**直接子元素**。

它的杀手级场景：你有个纯粹为了组织代码而存在的**包装 `<div>`**，但它挡了布局的路。比如一个 Flex / Grid 容器里，你想让某个包装层里的子元素**直接参与父级的 Flex / Grid 排布**，又不想删掉这层 HTML：

```html
<ul style="display: flex">
  <li>A</li>
  <!-- 这个包装 div 用 contents 脱壳，让里面的 li 直接成为 flex item -->
  <div style="display: contents">
    <li>B</li>
    <li>C</li>
  </div>
</ul>
```

::: warning `display: contents` 的无障碍历史坑
早期浏览器实现有 bug：会把 `display: contents` 元素**连同语义一起**从无障碍树移除（规范规定不该如此）。这导致用在 `<ul>` / `<table>` 等带语义的元素上时，列表 / 表格语义会丢失。现代浏览器已基本修复，但用在**带语义的元素**上时仍建议实测读屏；用在纯 `<div>` / `<span>` 包装层上则安全。
:::

## table 系列：用 CSS 模拟表格布局

`display` 还有一整套 `table-*` 值，让任意元素表现得像 `<table>` 的各个部分：

| `display` 值 | 等价的 HTML 元素 |
| --- | --- |
| `table` | `<table>` |
| `table-row` | `<tr>` |
| `table-cell` | `<td>` |
| `table-row-group` | `<tbody>` |
| `table-header-group` | `<thead>` |
| `table-caption` | `<caption>` |

在 Flex / Grid 普及前，`display: table` + `table-cell` 是实现「等高列」「垂直居中」的经典手段。今天这些需求大多交给 Flex / Grid，但 `table-*` 值在某些「需要真正表格对齐行为」的场景仍有用武之地（注意：`table-cell` / `table-caption` 也会**开 BFC**）。

## 小结

`display` 的本质是「外显示类型（怎么参与流）+ 内显示类型（子元素怎么排）」二维组合，理解了这点，`block` / `inline-block` / `flow-root` 这些值就不再是死记。其中 `flow-root` 专为开 BFC 而生，`none` 彻底移除、`contents` 让盒子脱壳。说到 BFC——它正是解决「外边距为什么合并了」「浮动怎么清」这两个经典难题的钥匙，下一页详解：[外边距合并与 BFC](./margin-collapse-bfc)。
