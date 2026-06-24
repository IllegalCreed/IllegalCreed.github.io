---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `position` 五取值：`static`（默认，正常流）、`relative`（相对自己偏移、原位仍占位）、`absolute`（脱流、相对最近定位祖先）、`fixed`（脱流、相对视口）、`sticky`（流内 + 越过阈值后吸住）
- 偏移属性：`top` / `right` / `bottom` / `left`，简写 `inset`；逻辑写法 `inset-block-start` 等；**只对非 `static` 元素生效**
- 包含块（containing block）：`absolute` 找**最近的「已定位」祖先**（`position` 非 `static`），找不到就用初始包含块（视口）；`fixed` 用**视口**
- `fixed` 例外：祖先有 `transform` / `filter` / `perspective`（非 `none`）会**夺走包含块**——`fixed` 变成相对该祖先
- `sticky` 三要素：①必须设至少一个 `top`/`bottom`/`left`/`right` 阈值，否则退化为 `relative`；②父级若 `overflow` 非 `visible` 会成为滚动容器；③父级要足够高才有「可吸」空间
- `z-index` 只对**定位元素**（及 Flex/Grid 子项）生效；可正可负；默认 `auto`
- 层叠上下文（stacking context）：一组「一起沿 Z 轴升降」的元素；`z-index` 只在**同一个层叠上下文内**可比——这是「`z-index: 9999` 仍压不过别人」的根因
- 顶层逃逸：`popover` 属性 / `<dialog>` 模态把元素送进**顶层（top layer）**，越过所有 `z-index` 与 `overflow` 裁剪
- 现代特性：CSS 锚点定位（`anchor()` 等）**Baseline 2026 · 新近可用**，必须能降级

## 第一个定位例子

正常流里，块级元素自上而下堆叠，`top`/`left` 写了也没用——因为默认 `position: static`。把它改成 `relative`，偏移就生效了，**而且原来的位置仍然占着**（不影响兄弟）：

```css
.box {
  position: relative; /* 仍在正常流，只是视觉上挪一挪 */
  top: 20px;
  left: 20px;
}
```

如果改成 `absolute`，元素会**彻底脱离正常流**（原位不再占空间，后面的元素会顶上来），并相对「最近的已定位祖先」摆放。最常见的配方就是「父 `relative` + 子 `absolute`」：

```css
.card {
  position: relative; /* 把自己变成子元素的「定位参照系」 */
}
.card__badge {
  position: absolute; /* 脱流，相对 .card 的内边距盒摆放 */
  top: 8px;
  right: 8px;
}
```

这套「父 relative、子 absolute」是定位里最高频的组合——它把子元素的坐标系从「视口」收回到「这张卡片」，详见 [position 五取值](./guide-line/position-values)。

## 五个取值，一句话区分

| 取值 | 在正常流？ | 相对谁偏移 | 典型用途 |
| --- | --- | --- | --- |
| `static` | 是 | 不可偏移（默认） | 普通文档流 |
| `relative` | 是（原位占位） | 相对**自己原来的位置** | 微调；或作为 `absolute` 子元素的参照 |
| `absolute` | 否（脱流） | 相对**最近的已定位祖先** | 角标、下拉、tooltip |
| `fixed` | 否（脱流） | 相对**视口**（滚动不动） | 吸顶导航、回到顶部按钮 |
| `sticky` | 是 → 吸住 | 滚到阈值前同 `relative`，之后吸在滚动容器边 | 吸顶表头、侧栏吸附 |

## 两个核心概念：包含块与层叠

理解定位，绕不开两个词。

**包含块（containing block）**——脱流元素的 `top`/`left` 百分比、`width: 100%` 都是相对「包含块」算的。`absolute` 的包含块是**最近的已定位祖先**的内边距盒（找不到则是初始包含块＝视口）；`fixed` 的包含块通常是**视口**——但只要某个祖先设了 `transform`、`filter` 或 `perspective`（非 `none`），它就**夺走** `fixed` 的包含块。这条例外是无数「`fixed` 怎么不固定了」的元凶，详见 [position 五取值](./guide-line/position-values)。

**层叠上下文（stacking context）**——当元素重叠，谁在上由「层叠顺序」决定。`z-index` 只在**同一个层叠上下文内部**才可比较：一个 `z-index: 9999` 的子元素，如果它所在的父层叠上下文整体排在别人后面，照样被压在下面。这正是「我都写到 9999 了为什么还盖不住」的标准答案，详见 [z-index 与层叠上下文](./guide-line/stacking-context)。

## 偏移属性与 `inset` 简写

四个物理方向 `top` / `right` / `bottom` / `left`，可用简写 `inset`（顺序同 `margin`：上、右、下、左）：

```css
.overlay {
  position: absolute;
  inset: 0; /* 等价 top:0; right:0; bottom:0; left:0 —— 撑满包含块 */
}
.panel {
  position: fixed;
  inset: 16px 16px auto auto; /* 上 16、右 16，下/左 auto —— 钉在右上角 */
}
```

`inset: 0` 配合 `position: absolute`（或 `fixed`）是「铺满父容器 / 视口」的现代写法，比逐条写四个方向更简洁。还有一套逻辑属性 `inset-block-start` / `inset-inline-end` 等，会随书写模式与 `direction` 自动适配 RTL。

::: tip 一个反直觉点：同时写对向 inset
对绝对定位元素同时写 `top` 和 `bottom`（且 `height: auto`），元素会被**上下拉伸填满**这段空间；同写 `left` 和 `right` 则左右填满。这是「用定位实现自适应尺寸」的小技巧。若两者冲突而元素尺寸固定，则 `top` 胜过 `bottom`、`left` 胜过 `right`（LTR 下）。
:::

## 定位元素会创建层叠上下文吗？

这一点常被忽略，却很关键：

- `relative` / `absolute` 元素**仅当 `z-index` 不是 `auto`** 时，才创建新层叠上下文；
- `fixed` / `sticky` 元素**只要定位就创建**新层叠上下文（与 `z-index` 无关）。

换句话说，你给一个 `position: relative` 的容器随手加上 `z-index: 0`，就悄悄给它的所有后代「圈了一个层叠上下文」——后代的 `z-index` 从此被困在这个容器内部。理解这条，才能解释下一页那个经典的「`z-index` 困局」。

## 下一步

先把 `position` 五取值与包含块吃透——[position 五取值](./guide-line/position-values)；再去攻克最容易出错也最常考的 [z-index 与层叠上下文](./guide-line/stacking-context)。
