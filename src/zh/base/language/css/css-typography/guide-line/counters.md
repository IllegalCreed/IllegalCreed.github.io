---
layout: doc
outline: [2, 3]
---

# 计数器与生成内容

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 计数器三步：`counter-reset`（建/归零）→ `counter-increment`（每次出现自增）→ `content: counter(名)`（在 `::before`/`::after` 显示）
- `counter-reset: section`：新建并置 0；`counter-reset: section 3`：置初值 3；`counter-reset: reversed(section)`：倒数计数器
- `counter-increment: section`：+1；`counter-increment: section 2`：+2；`-1`：减 1
- `counter-set`：更新已存在的计数器（不新建作用域），与 `counter-reset` 的区别在「是否开新计数器」
- `counter(名)`：显示单个计数器；`counter(名, upper-roman)`：带样式
- `counters(名, ".")`：显示**整条嵌套链**用分隔符连接——多级编号（1.1、2.3.1）靠它
- `<ol>` 自带隐式 `list-item` 计数器，可 `counter-reset: list-item 5` 改起始值
- `@counter-style` 定义自定义编号样式（`system` + `symbols` + `suffix` 等）
- 只对生成盒子的元素生效，`display: none` 的元素不计数；计数器作用域随 DOM 嵌套继承

## 计数器是什么

CSS 计数器是一组由 CSS 维护的「变量」，能自增/自减/置值，配合 `content` 在伪元素里显示出来——用来给标题、列表、图表**自动编号**，不必在 HTML 里手写「1.」「2.」。核心是三个属性 + 两个函数。

## 三步：reset → increment → display

```css
/* ① 在容器上建一个计数器并归零 */
body {
  counter-reset: section;
}

/* ② 每个 h2 出现时让计数器 +1，并在标题前显示它 */
h2 {
  counter-increment: section; /* section += 1 */
}
h2::before {
  content: "第 " counter(section) " 章　"; /* 显示当前值 */
}
```

```html
<h2>引言</h2>
<!-- 第 1 章　引言 -->
<h2>正文</h2>
<!-- 第 2 章　正文 -->
<h2>结论</h2>
<!-- 第 3 章　结论 -->
```

三步缺一不可：`counter-reset` 决定计数器「在哪个范围内从几开始」，`counter-increment` 决定「每次遇到 +几」，`counter()` 在 `content` 里把当前值取出来显示。

## 三个属性详解

### `counter-reset`：新建 / 归零 / 倒数

```css
counter-reset: section; /* 新建并置 0 */
counter-reset: section 3; /* 新建并置初值 3 */
counter-reset: chapter page 1 note; /* 一次建多个，可分别给初值 */
counter-reset: reversed(section); /* 倒数计数器：从元素总数往下数 */
```

`reversed()` 建一个**倒数**计数器：配合 `counter-increment: section -1`，可实现「从 N 倒数到 1」的编号（如排行榜倒序）。

### `counter-increment`：自增 / 自减

```css
counter-increment: section; /* +1（默认步长） */
counter-increment: section 2; /* +2 */
counter-increment: section -1; /* -1（配合 reversed 倒数） */
```

### `counter-set`：更新已存在的计数器

```css
counter-set: section 20; /* 把 section 设为 20 */
```

`counter-set` 与 `counter-reset` 的关键区别：**`counter-reset` 总是开一个新计数器（新作用域）**，而 `counter-set` 是**更新当前作用域里已有的计数器**（不存在则在当前元素新建）。需要「中途跳号」而不重置嵌套层级时用它。

## 两个函数：`counter()` 与 `counters()`

### `counter()`：单层编号

```css
content: counter(section); /* 1, 2, 3… */
content: counter(section, upper-roman); /* I, II, III…（带样式） */
content: counter(section, lower-alpha); /* a, b, c… */
```

第二个参数是样式，取任意 `list-style-type` 值（`decimal` / `lower-roman` / `cjk-decimal` …），不写则默认 `decimal`。

### `counters()`：多级嵌套编号

`counters(名, 分隔符)` 会把**从外到内同名的整条计数器链**用分隔符连起来——这正是「1.1、1.2.3」式多级编号的实现方式：

```css
/* 多级有序列表：自动生成 1 / 1.1 / 1.1.1 */
ol {
  counter-reset: item; /* 每层 ol 各开一个同名计数器 */
  list-style: none; /* 关掉默认编号，改用自定义 */
}
li {
  counter-increment: item;
}
li::before {
  content: counters(item, ".") " "; /* 把各层 item 用「.」串起来 */
}
```

```html
<ol>
  <li>一级</li>
  <!-- 1 -->
  <li>
    一级
    <!-- 2 -->
    <ol>
      <li>二级</li>
      <!-- 2.1 -->
      <li>
        二级
        <!-- 2.2 -->
        <ol>
          <li>三级</li>
          <!-- 2.2.1 -->
          <li>三级</li>
          <!-- 2.2.2 -->
        </ol>
      </li>
    </ol>
  </li>
  <li>一级</li>
  <!-- 3 -->
</ol>
```

::: tip `counter()` vs `counters()`
- **`counter(名)`** 取**最内层**那一个值——适合单层编号（章号、图号）；
- **`counters(名, 分隔符)`** 取**整条链**并用分隔符连接——适合**层级编号**（目录、法律条款 1.2.3）。

多级嵌套编号一定用 `counters()`（带 s）。
:::

## 给标题自动编号（实战）

给整篇文档的 `h2`/`h3` 自动生成「1 / 1.1 / 1.2 / 2 / 2.1」式章节号：

```css
body {
  counter-reset: h2; /* 顶层章计数器 */
}
h2 {
  counter-reset: h3; /* 进入新章，重置子节计数器 */
  counter-increment: h2;
}
h2::before {
  content: counter(h2) "　";
}
h3 {
  counter-increment: h3;
}
h3::before {
  content: counter(h2) "." counter(h3) "　"; /* 1.1, 1.2… */
}
```

关键技巧：在 `h2` 上 `counter-reset: h3`——每开一个新章就把子节计数器清零，于是每章的子节都从 `.1` 重新开始。

## `<ol>` 的隐式 `list-item` 计数器

有序列表 `<ol>` 自带一个名为 `list-item` 的隐式计数器，可直接操控它，比如改起始值：

```css
ol.start-at-5 {
  counter-reset: list-item 4; /* 下一项从 5 开始（4+1） */
}
```

也可在 `::marker` 里用它自定义编号外观（见[列表样式与 `::marker`](./list-marker)）。

## `@counter-style`：自定义编号样式

内置 `list-style-type` 不够用时，`@counter-style` 能定义全新的编号系统（符号、进位规则、前后缀）：

```css
@counter-style circled {
  system: fixed; /* 固定符号表 */
  symbols: "①" "②" "③" "④" "⑤"; /* 依次用这些符号 */
  suffix: " "; /* 编号后缀 */
}

ol {
  list-style-type: circled; /* 用自定义样式 */
}
/* 或在计数器里用 */
li::before {
  content: counter(item, circled);
}
```

`system` 常见取值：`cyclic`（循环用符号，如自定义项目符号）、`fixed`（用完即止）、`numeric`（位置进制，如自定义数字系统）、`alphabetic`、`additive`（加法式，如罗马数字）。`@counter-style` 已是各现代浏览器 Baseline 可用的特性。

## 注意事项

- 计数器**只对生成盒子的元素生效**：`display: none` 的元素**不参与计数**（`visibility: hidden` 仍计数）；
- 计数器名不能是 `none` / `inherit` / `initial`；
- 计数器作用域随 DOM**嵌套继承**：子元素看得到祖先建的计数器，同名时内层遮蔽外层（`counters()` 才取全链）；
- `content` 生成的内容是**装饰性**的，会被部分屏幕阅读器忽略，**不要**把关键信息只放在计数器/伪元素里。

## 小结

计数器三步走——`counter-reset` 建、`counter-increment` 自增、`counter()`/`counters()` 在伪元素显示；单层编号用 `counter()`、多级嵌套（1.2.3）用 `counters()`；给标题自动编号的诀窍是在父级标题上重置子级计数器；`<ol>` 自带 `list-item` 计数器、`@counter-style` 能造全新编号系统。至此本叶六大主题（字体族、加载、行距字距、折行、列表标记、计数器）讲完，最后到[参考](../reference)汇总速查表与 Baseline 状态。
