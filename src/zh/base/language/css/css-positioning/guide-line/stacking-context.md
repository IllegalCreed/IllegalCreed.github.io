---
layout: doc
outline: [2, 3]
---

# z-index 与层叠上下文

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `z-index` 只对**定位元素**（`position` 非 `static`）及 **Flex/Grid 子项**生效；默认 `auto`；可正可负
- **无 `z-index` 时**：层叠由**文档源序**决定——后写的盖在先写的之上（web.dev 原文：文档中靠后的元素压在靠前的元素上）
- **层叠上下文（stacking context）**：一组「一起沿 Z 轴升降」的元素；`<html>` 本身就是一个，且没有任何东西能排到它后面
- **关键定律**：`z-index` **只在同一个层叠上下文内可比**；子上下文被当作「一个整体」参与父上下文的层叠——这是「`z-index: 9999` 仍被压住」的根因（z-index 困局）
- **创建层叠上下文的常见条件**：根元素；定位 + `z-index≠auto`；`fixed`/`sticky`；Flex/Grid 子项 + `z-index≠auto`；`opacity<1`；`transform`/`filter`/`backdrop-filter`/`perspective`/`clip-path`/`mask`（非 `none`）；`mix-blend-mode≠normal`；`isolation:isolate`；`will-change` 指定上述属性；`contain:layout/paint/strict/content`；`container-type` 非 `normal`；顶层元素及其 `::backdrop`
- **上下文内七层层叠顺序**（自底向上）：①创建上下文元素的背景/边框 → ②负 `z-index` 子上下文 → ③块级盒 → ④浮动盒 → ⑤行内/行内块盒 → ⑥`z-index:auto`/`0` 的定位元素 → ⑦正 `z-index` 子上下文
- 破局工具：`isolation: isolate` 主动开一个干净的层叠上下文，把内部 `z-index` 战争关进笼子
- 顶层逃逸：`popover` / `<dialog>` 模态进**顶层**，完全无视 `z-index` 与祖先 `overflow`

## `z-index` 的前提：先定位

`z-index` 控制元素在 Z 轴（指向用户的方向）上的层级，数值大的在上、小的在下，可以是负数。但它有前提——**只对定位元素生效**：

```css
.up-front {
  position: relative; /* 没有这一行，z-index 在普通流里无效 */
  z-index: 2;
}
```

唯一例外：**Flex 容器或 Grid 容器的直接子项**，即使不写 `position`，`z-index` 也生效（web.dev 明确指出 flexbox/grid 语境下不需要 `position`）。除此之外，给 `static` 元素写 `z-index` 一律无效。

## 没有 z-index 时：源序决定一切

很多人以为「不写 `z-index` 就没有层叠顺序」，其实浏览器有一套默认规则。web.dev 的总结最直白：

> 如果你没有给元素设 `z-index`，默认行为就是由**文档源序**决定 Z 轴顺序——这意味着文档中靠后的元素会盖在靠前的元素之上。

所以两个重叠的定位元素，谁都不写 `z-index` 时，**HTML 里写在后面的那个在上面**。完整的「同一上下文内」层叠顺序见后文七层模型。

## 层叠上下文：一起升降的一组元素

理解 `z-index` 的钥匙是「层叠上下文」。web.dev 的定义：

> 层叠上下文是**一组拥有共同父级、并作为一个整体沿 Z 轴一起升降的元素**。

关键推论：**子元素的 `z-index` 永远是相对于「它所在那个层叠上下文里、父级的当前次序」而言的**。`<html>` 元素自身就是最顶层的层叠上下文，没有任何东西能排到它后面。

一旦某个元素「创建了层叠上下文」，它内部所有后代的层叠就被**封进这个上下文**：后代之间可以用 `z-index` 互相比较，但**它们无论写多大的 `z-index`，都无法越过这个上下文整体在父级里的排位**。这就是下面那个困局的根源。

## z-index 困局：9999 为什么还压不住

这是面试最爱、实战最常踩的一题。看这段结构：

```html
<div class="ctx-a">
  <div class="overlay">我 z-index: 9999</div>
</div>
<div class="ctx-b">普通内容</div>
```

```css
.ctx-a {
  position: relative;
  z-index: 1;       /* ← ctx-a 创建了一个层叠上下文，排位 1 */
}
.overlay {
  position: absolute;
  z-index: 9999;    /* ← 这个 9999 只在 ctx-a 内部有意义 */
}
.ctx-b {
  position: relative;
  z-index: 2;       /* ← ctx-b 排位 2，整体高于 ctx-a 的 1 */
}
```

结果：`.overlay` 的 `z-index: 9999` **压不过** `.ctx-b`。因为 `.overlay` 被困在 `.ctx-a` 这个排位为 `1` 的上下文里，而 `.ctx-b` 排位 `2`——**父上下文整体的排位先比，子元素的 `z-index` 只在自己的上下文里有效**。MDN 把这形容为「版本号」：子元素的 `z-index` 是父级大版本号下的小版本号，`1.9999` 永远小于 `2.0`。

::: warning 破解困局的正确姿势
不要无脑加大 `z-index`——那是在错误的上下文里加。正确做法是**调整「创建上下文的那一层」的 `z-index`**（把 `.ctx-a` 的 `z-index` 提到比 `.ctx-b` 高），或者**干脆不让中间层创建多余的上下文**（去掉那个随手写的 `z-index: 1` 或 `transform` / `opacity<1`）。很多「`z-index` 失控」其实是某个祖先无意中创建了层叠上下文。
:::

## 什么会创建层叠上下文

记不住没关系，但要知道「创建层叠上下文的条件比想象中多得多」——很多看似与层级无关的属性都会悄悄开一个新上下文。常见触发条件（据 MDN）：

- **根元素** `<html>`；
- **定位 + `z-index≠auto`**：`position: relative`/`absolute` 且 `z-index` 非 `auto`；
- **`fixed` 或 `sticky`**：只要定位就创建（与 `z-index` 无关）；
- **Flex / Grid 子项 + `z-index≠auto`**；
- **`opacity` 小于 1**；
- **`mix-blend-mode` 非 `normal`**；
- **以下属性取非 `none` 值**：`transform`、`scale`、`rotate`、`translate`、`filter`、`backdrop-filter`、`perspective`、`clip-path`、`mask` / `mask-image` / `mask-border`；
- **`isolation: isolate`**；
- **`will-change`** 指定了任何「会创建层叠上下文」的属性；
- **`contain: layout` / `paint` / `strict` / `content`**；
- **`container-type`** 为 `size` 或 `inline-size`（容器查询）；
- **顶层元素**及其 `::backdrop`（全屏、`popover`、模态 `<dialog>`）；
- 用 `@keyframes` 动画了 `opacity` 等属性且 `animation-fill-mode: forwards`。

::: tip 最坑的三个「隐形」触发器
`opacity: 0.99`、`transform: translateZ(0)`（常被用作「GPU 加速 hack」）、`will-change: transform`——它们都**不改变外观或位置**，却都会创建层叠上下文，让内部 `z-index` 与外界隔绝。当 `z-index` 行为诡异时，沿 DOM 往上 grep 这几个属性，往往就是元凶。
:::

## 上下文内部的七层层叠顺序

在**同一个层叠上下文内部**，元素从底到顶按这个固定顺序绘制（MDN 的七层模型）：

| 层 | 内容 |
| --- | --- |
| 1（最底） | 创建该上下文的元素的**背景与边框** |
| 2 | **负 `z-index`** 的子层叠上下文（`z-index < 0`） |
| 3 | 正常流中的**块级盒**（非定位） |
| 4 | **浮动盒**（非定位） |
| 5 | 正常流中的**行内 / 行内块盒**（非定位） |
| 6 | `z-index: auto` 或 `z-index: 0` 的**定位元素** |
| 7（最顶） | **正 `z-index`** 的子层叠上下文（`z-index > 0`） |

几个由此得出的常识：

- **负 `z-index` 能钻到背景之上、但在普通块级内容之下**（第 2 层在第 3 层下方）——这就是「把装饰元素用 `z-index: -1` 垫到文字背后」的原理；
- **定位元素（哪怕 `z-index:0`）默认压在普通块级、浮动、行内内容之上**（第 6 层 > 第 3~5 层）——所以一个 `position: absolute` 的元素天然会盖住旁边没定位的文字；
- 同层内部再按**源序**决定先后。

```css
.hero {
  position: relative;
}
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: -1; /* 钻到 .hero 文字背后，但仍在 .hero 背景之上 */
}
```

## 主动隔离：`isolation: isolate`

当你写一个可复用组件，又不想让它内部的 `z-index` 跟外部「打架」，可以用 `isolation: isolate` **主动创建一个干净的层叠上下文**——它不改变任何视觉效果，只是把内部的层叠战争关进笼子：

```css
.widget {
  isolation: isolate; /* 内部 z-index 从此与页面其余部分隔离 */
}
```

这是**唯一**一个「专门用来创建层叠上下文、且零副作用」的属性，比用 `transform` 或 `opacity` 去「凑」一个上下文要干净得多。

## 终极逃逸：顶层（top layer）

有一类元素根本不参与 `z-index` 游戏——进入**顶层（top layer）**的元素：用 `popover` 属性的弹层、用 `showModal()` 打开的模态 `<dialog>`、全屏元素。它们渲染在所有普通内容之上，**完全无视祖先的 `z-index` 与 `overflow: hidden` 裁剪**，从根本上绕开了层叠上下文的所有困局。这正是现代「弹层不再需要 `z-index: 99999`」的底气，详见 [popover & dialog 与定位](./popover-dialog-positioning)。

## 小结

`z-index` 只对定位元素生效、只在同一层叠上下文内可比；满屏 `z-index: 9999` 治不了「被困在低排位父上下文」的病，调对「创建上下文那一层」或用 `isolation: isolate` 隔离才是正解。讲完层级，回头补一块定位之前的遗留地基——[float / clear 与清除浮动](./float-clear)。
