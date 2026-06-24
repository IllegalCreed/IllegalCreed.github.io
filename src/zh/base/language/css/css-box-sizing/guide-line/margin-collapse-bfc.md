---
layout: doc
outline: [2, 3]
---

# 外边距合并与 BFC

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 外边距合并：相邻的**块向（垂直）**外边距会合并成**一个**，大小取**较大的那个**；水平外边距**永不**合并
- 三种合并场景：① 相邻兄弟 ② 父与首/末子元素（中间无边框/内边距/内容隔开）③ 空块自身上下 margin
- 负 margin 规则：有正有负时 = 最大正值 − 最大负值的绝对值；全是负值时 = 绝对值最大（最负）的那个
- 阻止合并：**开一个 BFC** / 给父级加 `border` 或 `padding` / 用 Flex / Grid 容器 / 浮动 / 绝对定位 / 给父级设 `height`、`min-height`
- BFC（块格式化上下文）= 一块「自成一体」的布局区域，三大能力：**包住内部浮动**、**挡开外部浮动**、**阻止外边距合并**
- 开 BFC 的现代正解：`display: flow-root`（无副作用）；老办法 `overflow: hidden` / `auto`（有裁切 / 滚动条副作用）
- 其他能开 BFC 的：根元素 `<html>`、浮动、绝对/固定定位、`inline-block`、`table-cell` / `table-caption`、`overflow` 非 `visible`/`clip`、`contain: layout`/`content`/`paint`、Flex / Grid 子项、多列容器

## 外边距合并：最反直觉的间距规则

先看一个几乎人人踩过的现象：

```html
<p style="margin-bottom: 30px">第一段</p>
<p style="margin-top: 20px">第二段</p>
```

你可能以为两段之间的间距是 `30 + 20 = 50px`。**错。实际只有 30px**。

这就是**外边距合并（margin collapsing）**：相邻的**块向（垂直）**外边距不会相加，而是**合并成一个**，大小取**两者中较大的那个**（相等则取其一）。这是 CSS 普通流里一条刻意的规则——避免段落、标题堆叠时间距被反复累加。

::: warning 只有块向（垂直）外边距合并
**水平方向的外边距永不合并**——左右相邻元素的 `margin-left` / `margin-right` 老老实实相加。合并只发生在普通流的块向（横排时即垂直方向）上。Flex / Grid 子项之间也**不会**发生外边距合并。
:::

## 三种合并场景

外边距合并恰好发生在三种情形：

### 场景一：相邻兄弟

最常见，就是上面那个例子——前一个元素的 `margin-bottom` 与后一个元素的 `margin-top` 合并：

```
margin-bottom: 30px ┐
                    ├─ 合并 → 实际间距 = max(30, 20) = 30px
margin-top: 20px    ┘
```

### 场景二：父与首/末子元素（最隐蔽）

如果父元素与它的**第一个子元素**之间**没有任何东西隔开**（没有 `border-top`、没有 `padding-top`、没有行内内容、没有清除浮动），那么**父的 `margin-top` 会和子的 `margin-top` 合并**——子元素的上外边距「穿透」父级，跑到父级外面去了。

```html
<div class="parent">
  <!-- 这个 h2 的 margin-top 会穿透 parent，跑到 parent 上方 -->
  <h2 style="margin-top: 40px">标题</h2>
</div>
```

这正是「我给子元素设了 `margin-top`，结果父容器整体往下掉、父子之间却没间距」的元凶。同理，父的 `margin-bottom` 会和**最后一个子元素**的 `margin-bottom` 合并（除非父级设了 `height` / `min-height` / `border-bottom` / `padding-bottom`）。

### 场景三：空块自身的上下外边距

一个**空块**（没有 `border`、`padding`、行内内容、`height` 或 `min-height` 来把上下隔开）自己的 `margin-top` 和 `margin-bottom` 会**合并成一个**：

```html
<!-- 这个空 div 写了上 20 下 30，最终只占 max(20, 30) = 30px 高 -->
<div style="margin-top: 20px; margin-bottom: 30px"></div>
```

## 负外边距的合并规则

掺入负值后，合并按这套规则算：

- **有正有负**：结果 = **最大的正值** − **最大负值的绝对值**。例如 `margin-bottom: 30px` 与 `margin-top: -20px` 合并为 `30 − 20 = 10px`。
- **全是负值**：结果 = **绝对值最大（即最负）的那个**。例如 `-20px` 与 `-30px` 合并为 `-30px`。

这套规则对相邻兄弟和父子嵌套都成立。

## 怎么阻止外边距合并

很多时候合并不是你想要的（尤其场景二）。打断它的办法（任选其一）：

- 在父与子之间**加一道隔离**：给父级加 `padding-top`（哪怕 `1px`）或 `border-top`；
- 让父级**开一个 BFC**（最干净，下面详解）；
- 把容器换成 **Flex / Grid**——它们的子项之间不发生外边距合并；
- 父级**浮动**或**绝对定位**——浮动元素和绝对定位元素**永远不发生**外边距合并；
- 给父级设 `height` 或 `min-height`（针对末子元素的下外边距穿透）。

实务上最推荐的，是理解并善用 **BFC**。

## BFC：一块「自成一体」的布局区域

**块格式化上下文（Block Formatting Context，BFC）** 是页面里一块**独立的布局区域**——块盒在其中排布、浮动在其中交互，并且**与外界隔离**。一个元素一旦建立了新的 BFC，它会获得三种能力：

1. **包住内部浮动**——里面的浮动元素不会「溢出」它（解决高度塌陷）；
2. **挡开外部浮动**——外面的浮动元素不会侵入它（可做不环绕的并排布局）；
3. **阻止外边距合并**——它与内部子元素的外边距不再合并。

### 用途一：清浮动（包住内部浮动）

浮动元素会脱离普通流，导致父容器「**高度塌陷**」——父级算不进浮动子元素的高度，背景 / 边框收缩成一条线：

```css
/* 父容器开 BFC，就能把浮动的子元素「包」回来，恢复高度 */
.clearfix {
  display: flow-root;
}
```

### 用途二：阻止父子外边距合并

回到场景二的难题——给父级开 BFC，子元素的 `margin-top` 就不再穿透：

```css
.parent {
  display: flow-root; /* 开 BFC：子元素的 margin-top 被关在里面，不再穿透 */
}
```

## 怎么创建一个 BFC

以下任意一条都会让元素建立新的 BFC（MDN 列表，节选最常用的）：

- 文档**根元素** `<html>`（天然是一个 BFC）；
- **浮动**元素（`float` 不为 `none`）；
- **绝对定位**元素（`position: absolute` / `fixed`）；
- `display: inline-block`；
- `display: table-cell` / `table-caption`（以及 `table` 隐式生成的匿名单元格）；
- **`display: flow-root`**；
- `overflow` 取值**不是** `visible` 也不是 `clip`（即 `hidden` / `auto` / `scroll`）；
- `contain: layout` / `content` / `paint`；
- **Flex / Grid 子项**（本身不是 flex / grid / table 容器时）；
- **多列容器**（`column-count` 或 `column-width` 不为 `auto`）。

### 现代正解：`display: flow-root`

历史上，人们靠 `overflow: hidden` 或 `overflow: auto` 来「顺手」开 BFC，但 MDN 明确指出其问题：

> `overflow` 属性的本意是处理溢出内容。用它来创建 BFC，可能导致**意外的滚动条**或**被裁切的阴影**，也会让后来的开发者**看不懂为什么用了 `overflow`**。

`display: flow-root` 是专为此设计的干净写法——**只开 BFC，没有任何副作用**，不裁内容、不生滚动条。名字 `flow-root`（流的根）也点明了意图：让这个盒子像根元素 `<html>` 一样，为内部普通流开一个独立上下文。

```css
/* 推荐：语义明确、零副作用 */
.bfc {
  display: flow-root;
}

/* 不推荐：靠副作用开 BFC，可能裁切 / 多滚动条 / 意图不明 */
.bfc-old {
  overflow: hidden;
}
```

`flow-root` 自 2019 年起即为 Baseline 广泛可用，新代码应优先用它。

## 小结

外边距合并是普通流里刻意的「取较大值」规则，三种场景中最坑的是父子穿透；而 BFC 是同时解决「清浮动」「止合并」「挡浮动」的统一钥匙，`display: flow-root` 是开它的零副作用现代写法。盒子的边界与间距讲完了，下一个核心问题是**盒子的大小由谁决定**——固定值，还是让内容自己说话？下一页讲尺寸与内在尺寸关键字：[尺寸与内在尺寸关键字](./sizing-keywords)。
