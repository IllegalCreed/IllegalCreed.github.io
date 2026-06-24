---
layout: doc
outline: [2, 3]
---

# float / clear 与清除浮动

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `float`：取值 `left` / `right` / `none`（默认）/ `inline-start` / `inline-end`（逻辑值）；元素**脱离正常流**、向左或向右靠，**文字与行内内容环绕**它
- 历史定位：`float` 本为**图文环绕**而生；2010 年代曾被滥用于整页**多列布局**——如今该用 Flexbox / Grid，`float` 退回它的本职
- **高度坍塌**：父元素只含浮动子元素时，父级高度会**坍塌为 0**（浮动脱流，不撑开父级）——这是 `float` 最经典的坑
- `clear`：取值 `left` / `right` / `both` / `none`；让元素**移到此前浮动元素的下方**，不再与之并排
- **清浮动三法**：①经典 clearfix（`::after { content:""; display:block; clear:both }`）；②给父级创建 **BFC**（`display: flow-root` —— 现代首选、零副作用）；③父级 `overflow: auto/hidden`（老办法，有裁剪/滚动副作用）
- **BFC（块级格式化上下文）**：一个独立的布局区域——会**包含内部浮动**（撑开高度）、**阻止外边距穿透折叠**、**不与外部浮动重叠**
- `display: flow-root` = **专门用来开 BFC** 的现代写法，无副作用，**优先用它**取代 clearfix
- 浮动元素会被当作**块级**处理（`display` 计算值变 block）；浮动 + `position: absolute/fixed` 时 `float` 失效（计算为 `none`）
- Baseline：`float` / `clear` 远古可用；`display: flow-root` **Baseline Widely available**，放心用

## `float` 本来是干什么的

`float` 诞生于「让文字环绕图片」这一排版需求——把一张图 `float: left`，它会脱离正常流、靠到左边，**后续的文字和行内内容自动环绕**在它右侧，就像报纸杂志的图文混排：

```css
.article__figure {
  float: left;
  width: 200px;
  margin: 0 1rem 1rem 0; /* 给环绕文字留出间距 */
}
```

取值：`left`（靠左、内容绕右）、`right`（靠右、内容绕左）、`none`（默认，不浮动），以及逻辑值 `inline-start` / `inline-end`（随书写方向翻转）。浮动元素会被当作**块级盒**处理（其 `display` 计算值变为 `block`）。

::: tip 这才是 float 今天仍然该用的场景
图文环绕——尤其是「文字绕着一张图/一个引用块流动」——是 Flexbox 和 Grid **都做不到**的效果（它们会把图和文当作两个独立网格项，不会让文字贴着图的轮廓流）。所以 `float` 没有过时，只是回到了它的本职。
:::

## 一段历史：float 曾被拿来搭整页布局

在 Flexbox（2015 前后普及）与 Grid 之前，CSS 缺少正经的多列布局工具，于是开发者**把 `float` 当布局引擎**——侧栏 `float: left`、主内容 `float: right`，硬凑出两栏三栏。这套做法能用，但脆弱：高度坍塌、清浮动样板、等高列难做、源序与视觉序耦合……催生了 clearfix、`overflow: hidden` 等一系列「补丁」。

**结论先行**：2026 年做页面级布局，用 [Flexbox](../../css-flexbox/) 或 [Grid](../../css-grid/)，**不要再用 `float` 排版**。下面讲清浮动，主要是为了**读懂遗留代码**、以及理解 BFC 这个仍然有用的概念。

## 高度坍塌：float 最经典的坑

浮动元素脱离正常流，于是**父元素「看不到」它**——当一个容器里**只有浮动子元素**时，容器高度会**坍塌为 0**，背景、边框、后续布局全乱：

```html
<div class="parent">     <!-- 高度坍塌为 0！ -->
  <div class="child" style="float: left">浮动子元素</div>
</div>
```

直观表现：给 `.parent` 设了背景色却看不到、它后面的元素跑上来与浮动子元素重叠。解决它，就是「清除浮动 / 包含浮动」。

## `clear`：移到浮动下方

`clear` 作用在**被环绕方**：让某个元素**移动到此前浮动元素的下方**，不再与它并排。取值 `left`（避开左浮动）、`right`（避开右浮动）、`both`（左右都避开）、`none`（默认）：

```css
.below {
  clear: both; /* 我不要环绕，老老实实排在所有浮动元素下面 */
}
```

`clear` 本身解决的是「**让某元素不再环绕**」，它是经典 clearfix 的核心零件。

## 清除浮动三种办法

### ① 现代首选：`display: flow-root`（开 BFC，零副作用）

```css
.parent {
  display: flow-root; /* 父级创建 BFC，自动包含内部浮动，高度不再坍塌 */
}
```

`display: flow-root` 是**专为「创建一个干净的块级格式化上下文」而生**的值——没有任何副作用（不裁剪、不滚动、不改变其他行为），是今天清浮动 / 包含浮动的**第一选择**。能用它就别用下面两种。

### ② 经典 clearfix（读老代码会遇到）

在父级伪元素里插一个清除点：

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

原理是让 `::after` 这个块级伪元素 `clear: both`，从而把父级「撑」到所有浮动子元素之下。它是 `display: flow-root` 出现前的标准答案，现存代码里随处可见。

### ③ `overflow: auto / hidden`（老办法，有副作用）

```css
.parent {
  overflow: auto; /* 触发 BFC，顺带包含浮动 */
}
```

给父级设 `overflow` 非 `visible` 也会创建 BFC、包含浮动。但它有**副作用**：`hidden` 会裁掉溢出内容（阴影、tooltip 被切），`auto` 可能意外出现滚动条。能用 `display: flow-root` 时不要用这招。

::: warning overflow 清浮动的隐藏代价
还记得上一节 [position 五取值](./position-values) 里 `sticky` 的失效坑吗？给父级加 `overflow: hidden` 清浮动，会把它变成**滚动容器**，导致内部 `position: sticky` 子元素莫名其妙吸附失效。这正是「老办法的副作用反咬一口」的典型——又一个改用 `display: flow-root` 的理由。
:::

## BFC：块级格式化上下文

上面三招里，①和③的本质都是「创建一个 **BFC（Block Formatting Context，块级格式化上下文）**」。BFC 是一块**独立的布局区域**，对内自成一套排版规则，对外与世隔绝。它有三个最有用的特性：

1. **包含内部浮动**——BFC 会把内部浮动子元素算进自己的高度，高度不再坍塌（这就是清浮动的原理）；
2. **阻止外边距穿透折叠**——BFC 边界会挡住「父子 / 相邻块」的 margin 合并；
3. **不与外部浮动重叠**——BFC 盒子会避开浮动元素，可用来做「自适应宽度的右栏」。

创建 BFC 的常见方式：`display: flow-root`（首选）、`overflow` 非 `visible`、`display: inline-block` / `flex` / `grid` / `table-cell`、`position: absolute/fixed`、`contain: layout/paint` 等。**需要一个「干净」BFC 时，永远优先 `display: flow-root`**。

::: tip BFC 与层叠上下文别搞混
「块级格式化上下文（BFC）」管的是**二维布局**（浮动、外边距、避让），「[层叠上下文](./stacking-context)（stacking context）」管的是**Z 轴层级**。两者名字像、概念不同——不过有意思的是，触发 BFC 的某些属性（如 `contain: paint`）也会触发层叠上下文，容易让人混淆。
:::

## float 的失效与边界

- 浮动元素同时设了 `position: absolute` 或 `fixed` 时，`float` 计算为 `none`（绝对定位优先，浮动作废）；
- 浮动元素的 `display` 计算值被「块级化」（除少数例外），所以给浮动元素写 `display: inline` 不会真生效；
- 行内元素一旦浮动，也会按块级盒参与布局。

## 小结

`float` 回归图文环绕本职，整页布局交给 Flex/Grid；高度坍塌用 `display: flow-root` 优雅化解（别再用有副作用的 `overflow` 或繁琐的 clearfix）；BFC 是理解清浮动与外边距折叠的关键概念。遗留机制讲完，把目光投向最前沿——2026 年才进 Baseline 的 [CSS 锚点定位](./anchor-positioning)。
