---
layout: doc
outline: [2, 3]
---

# 伪类与伪元素

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 伪类单冒号 `:hover`——按**状态/位置**选已有元素；伪元素双冒号 `::before`——造一个**虚拟元素**来定型
- 状态伪类：`:hover` / `:focus` / `:focus-visible` / `:active` / `:target` / `:checked` / `:disabled` / `:valid` 等
- 结构伪类：`:root` / `:first-child` / `:last-child` / `:only-child` / `:empty` / `:nth-child()` / `:nth-of-type()`
- `:nth-child(an+b)`：`2n`＝偶数、`2n+1`/`odd`＝奇数、`3`＝第 3 个；Level 4 还有 `:nth-child(2 of .item)`
- `:is(列表)` 分组、容错、取**最高**特异性；`:where(列表)` 同 `:is` 但特异性恒 `0`（Baseline 2021）
- `:not(列表)` 取反，自身不加权但**算入参数最高特异性**——易把权重抬高（Baseline：列表参数 2021）
- `:has(相对选择器)` **父/前兄弟选择器**，取参数最高特异性，不可嵌套、不可含伪元素（Baseline 2023）
- 常用伪元素：`::before` / `::after`（需 `content`）、`::first-letter` / `::first-line` / `::selection` / `::placeholder` / `::marker` / `::backdrop`

## 伪类 vs 伪元素：一冒号之差

- **伪类**（pseudo-class，单冒号 `:`）：根据元素的**状态**（被悬停、被选中、被禁用）或在 DOM 里的**位置**（第一个子元素、根元素）来选中**已经存在**的元素。它不创造新东西，只是「换个条件挑元素」。
- **伪元素**（pseudo-element，双冒号 `::`）：在文档里**凭空造出一个可定型的虚拟元素**（如元素内容前的一段插入文本、首字母、占位符文字），它在 DOM 树里并不真实存在。

```css
a:hover {
  /* 伪类：处于悬停态的 <a> */
}
a::before {
  /* 伪元素：在 <a> 内容前插入的虚拟盒子 */
  content: "→ ";
}
```

::: tip 双冒号是现代写法，单冒号是历史兼容
伪元素规范规定用双冒号 `::` 以区别于伪类。但 `::before` / `::after` / `::first-letter` / `::first-line` 这四个「元老」为兼容老代码，**也接受单冒号**写法（`:before`）。新代码一律用 `::`。
:::

## 状态伪类

响应用户交互或表单/资源状态：

```css
/* 交互态 */
a:hover {
  text-decoration: underline;
} /* 鼠标悬停 */
button:active {
  transform: translateY(1px);
} /* 正在按下 */
input:focus-visible {
  outline: 2px solid royalblue;
} /* 键盘聚焦才显示焦点环 */

/* 表单态 */
input:checked + label {
  font-weight: 700;
} /* 勾选的复选框/单选 */
input:disabled {
  opacity: 0.5;
} /* 禁用 */
input:required {
  border-left: 3px solid orange;
} /* 必填 */
input:valid {
  border-color: green;
} /* 校验通过 */

/* 导航态 */
:target {
  scroll-margin-top: 5rem;
} /* URL #锚点 指向的元素 */
```

::: tip `:focus` 与 `:focus-visible`
`:focus` 在元素获得焦点时一律命中（包括鼠标点击），常导致点击后留下「难看的焦点框」。`:focus-visible` 由浏览器启发式判断「该不该显示焦点指示」——通常只在**键盘**操作时命中，既保住无障碍又不打扰鼠标用户。现代项目优先用 `:focus-visible` 画焦点环。
:::

## 结构伪类

按元素在 DOM 树中的位置匹配，无需加类：

```css
:root {
  /* 文档根元素，等价于 <html>，但特异性更高，常用来放 CSS 变量 */
  --brand: #0066ff;
}

li:first-child {
  /* 父级里第一个 <li> */
}
li:last-child {
  /* 最后一个 <li> */
}
p:only-child {
  /* 父级里唯一的子元素且是 <p> */
}
div:empty {
  /* 没有任何子节点（含文本）的 <div> */
  display: none;
}
```

### `:nth-child()` 与 `:nth-of-type()`

最强大的结构伪类，按序号选子元素。参数支持 `An+B` 公式与关键字：

```css
tr:nth-child(odd) {
  background: #f7f7f7;
} /* 奇数行斑马纹（odd 等价 2n+1） */
tr:nth-child(even) {
  background: #fff;
} /* 偶数行（even 等价 2n） */
li:nth-child(3) {
  color: red;
} /* 第 3 个 */
li:nth-child(3n) {
  /* 第 3、6、9… 个 */
}
li:nth-child(-n + 3) {
  /* 前 3 个 */
}
```

`:nth-child()` 数的是「**在所有兄弟里排第几**」，`:nth-of-type()` 数的是「**在同类型兄弟里排第几**」——这个区别是个常见坑：

```html
<section>
  <h2>标题</h2>
  <p>第一段</p>
  <p>第二段</p>
</section>
```

```css
p:nth-child(1) {
  /* 不命中！因为第 1 个子元素是 <h2> 而非 <p> */
}
p:nth-of-type(1) {
  /* 命中「第一段」：在 <p> 这一类里它排第 1 */
}
```

Level 4 还扩展了「带选择器的 nth」，可以只在匹配某选择器的元素里数序号：

```css
/* 在带 .item 类的子元素里，选第偶数个 */
:nth-child(even of .item) {
  background: #eef;
}
```

## 函数式伪类：`:is()` / `:where()` / `:not()` / `:has()`

这四个接收**选择器作为参数**的伪类，是现代 CSS 选择器表达力的飞跃。它们对特异性的影响各不相同，是下一页 [特异性计算](./specificity) 的重点，这里先讲用法。

### `:is(选择器列表)` —— 分组、容错、取最高特异性

把一串选择器折叠进 `:is()`，等于「匹配其中任意一个」，专治「选择器列表爆炸」：

```css
/* 不用 :is()：组合数爆炸 */
section h1,
article h1,
aside h1,
nav h1 {
  font-size: 1.5rem;
}

/* 用 :is()：一行搞定 */
:is(section, article, aside, nav) h1 {
  font-size: 1.5rem;
}
```

两个关键特性：

- **容错（forgiving）**：参数列表里若有浏览器不认识的选择器，只忽略那一项，其余照常生效——不像传统逗号列表那样「一错全废」。
- **特异性取参数里最高的那个**：`:is(p, #id)` 的特异性等于 `#id`（`1-0-0`）。

> **Baseline 状态**：`:is()` 自 2021 年 1 月起 Baseline「广泛可用」（Chrome/Edge 88、Firefox 78、Safari 14），可放心使用。旧名是 `:matches()` / `:any()`，已弃用。

### `:where(选择器列表)` —— 和 `:is()` 一样，但特异性恒为零

`:where()` 的语法、容错行为与 `:is()` 完全相同，**唯一区别**：它的特异性**永远是 `0-0-0`**，无论参数里塞了多高权重的选择器。

```css
/* 一份「极易被覆盖」的基础样式：特异性归零 */
:where(article a) {
  color: teal;
}

/* 业务里随便一个类型选择器就能覆盖它 */
article a {
  color: crimson; /* 0-0-2 > 0-0-0，胜出 */
}
```

这让它成为写**重置样式、设计系统基础层**的理想工具——你定的默认值「软」到任何人都能轻松覆盖，杜绝特异性内卷。

> **Baseline 状态**：与 `:is()` 同批，2021 年 1 月起广泛可用。

### `:not(选择器列表)` —— 取反

匹配「**不满足**列表中任意一项」的元素。Level 4 起参数可以是逗号分隔的**列表**乃至复杂选择器：

```css
button:not(.primary) {
  /* 所有不带 primary 类的按钮 */
}
li:not(:last-child) {
  /* 除最后一个外的所有 <li> */
  border-bottom: 1px solid #eee;
}
:not(p, .fancy) {
  /* 既不是 <p>、也没有 fancy 类的元素 */
}
```

::: warning `:not()` 会悄悄抬高特异性，还有「全集陷阱」
`:not()` **自身不加权**，但会把**参数里最高特异性**算进来：`p:not(#x)` 的特异性是 `1-0-1`（带上了那个 ID！），常导致意外难以覆盖。另外两个坑：① `:not(*)` 匹配空（任何元素都「是元素」）；② `body :not(table) a` **仍会命中表格内的链接**——因为 `<tr>` `<td>` 等本身就满足 `:not(table)`，链接是它们的后代。需要排除整棵子树时改用 `a:not(table a)` 或 `:has()` 思路。
:::

> **Baseline 状态**：基础 `:not()`（单个简单选择器）支持已久；**接收选择器列表**的 Level 4 能力自 2021/2022 年起进入 Baseline。

### `:has(相对选择器)` —— 期盼已久的「父选择器」

`:has()` 终结了 CSS「只能向下选」的历史限制：它匹配「**自身满足某种关系**」的元素——参数是一段**相对选择器**，锚定在当前元素上判断。

```css
/* 选中「包含 .featured 后代」的 <section>——父选择器！ */
section:has(.featured) {
  border: 2px solid royalblue;
}

/* 只看直接子：用 > */
.card:has(> img) {
  padding: 0;
}

/* 选中「后面紧跟 <p>」的 <h2>——前兄弟选择器！ */
h2:has(+ p) {
  margin-bottom: 0.25rem;
}
```

组合逻辑：

```css
/* 「或」：含 video 或 audio */
article:has(video, audio) {
  /* … */
}

/* 「与」：既含 video 又含 audio，链式书写 */
article:has(video):has(audio) {
  /* … */
}
```

一个真实场景——表单某字段非法时，给整个表单容器变红（过去这要靠 JS）：

```css
form:has(input:invalid) {
  outline: 2px solid #e11;
}
```

::: warning `:has()` 的限制
① **不能嵌套**：`.a:has(.b:has(.c))` 非法；② **参数里不能用伪元素**：`:has(::before)` 非法；③ 特异性取参数里最高的（同 `:is()`）；④ 锚点选 `body` / `:root` / `*` 这种大范围 + 无约束内部选择器时**匹配成本高**，性能注意见 [选择器性能](./selector-performance)。
:::

> **Baseline 状态**：`:has()` 自 **2023 年 12 月**起 Baseline「新近可用」（Chrome/Edge 105、Safari 15.4、Firefox 121）。覆盖现代浏览器；若需兼容更老环境，可包进 `:is()` 做容错降级，或用 JS 兜底。

## 伪元素全谱

伪元素「凭空造盒子」，最常用的几个：

```css
/* ::before / ::after：在元素内容前后插入虚拟内容，必须有 content */
.tag::before {
  content: "#";
  color: #999;
}
blockquote::after {
  content: close-quote;
}

/* ::first-letter / ::first-line：首字母下沉、首行强调 */
p::first-letter {
  font-size: 3em;
  float: left;
}
p::first-line {
  font-variant: small-caps;
}

/* ::selection：用户高亮选中文字的样式 */
::selection {
  background: gold;
  color: #000;
}

/* ::placeholder：输入框占位文字 */
input::placeholder {
  color: #aaa;
  font-style: italic;
}

/* ::marker：列表项的项目符号/序号 */
li::marker {
  color: crimson;
}

/* ::backdrop：<dialog>、全屏元素背后的遮罩层 */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
```

::: tip `::before` / `::after` 离不开 `content`
没有 `content` 属性，`::before` / `::after` **根本不会生成**。要造一个纯装饰盒子时写 `content: "";`（空串）即可。另外这俩伪元素无法用在「替换元素」（如 `<img>`、`<input>`）上。
:::

## 小结

伪类让选择器「感知」状态与结构，伪元素让你「凭空」造盒子。而 `:is()` / `:where()` / `:not()` / `:has()` 不只是语法糖——它们和特异性深度纠缠：`:where()` 归零、`:is()` / `:has()` / `:not()` 取参数最高。下一页就把这套权重账算清楚：[特异性计算](./specificity)。
