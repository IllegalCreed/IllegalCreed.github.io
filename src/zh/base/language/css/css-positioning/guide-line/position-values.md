---
layout: doc
outline: [2, 3]
---

# position 五取值

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `static`：默认值，元素在正常流里，`top`/`right`/`bottom`/`left`/`z-index` **全部无效**
- `relative`：在正常流里占位**不变**，仅视觉上按 `top`/`left` 偏移；不影响兄弟；常用作 `absolute` 子元素的参照系
- `absolute`：**脱离正常流**（原位不占空间），相对**最近的已定位祖先**（`position` 非 `static`）的内边距盒定位；无定位祖先则相对**初始包含块（视口）**
- `fixed`：脱流，相对**视口**定位、滚动不动；**例外**：祖先有 `transform` / `filter` / `perspective`（非 `none`）会夺走包含块，使 `fixed` 相对该祖先
- `sticky`：正常流内，滚动到**阈值**前同 `relative`，越过后吸在滚动容器边界；必须设至少一个 `top`/`bottom`/`left`/`right`
- `inset` 简写 = `top right bottom left`（同 `margin` 顺序）；`inset: 0` 撑满包含块；逻辑写法 `inset-block-start` 等适配 RTL
- 同时写对向 inset（`top`+`bottom` 且 `height:auto`）→ 元素被拉伸填满；冲突且尺寸固定 → `top`/`left` 胜（LTR）
- 层叠上下文：`relative`/`absolute` 仅 `z-index≠auto` 时创建；`fixed`/`sticky` **只要定位就创建**
- `sticky` 三大失效：①忘写阈值；②父级 `overflow` 非 `visible` 抢成滚动容器；③父级高度不足无可吸空间
- Baseline：`position` 五取值均 **Widely available（2015-07 起广泛可用）**，放心用

## `static`：默认的正常流

每个元素的初始 `position` 都是 `static`——它老老实实待在正常流里，`top`/`right`/`bottom`/`left` 和 `z-index` 写了也**完全没用**。所以「我设了 `z-index` 怎么不生效」第一件事就是检查：这个元素定位了吗？

```css
.box {
  /* position: static 是默认值 */
  top: 50px;     /* ← 无效 */
  z-index: 10;   /* ← 无效 */
}
```

只有当 `position` 变成 `relative` / `absolute` / `fixed` / `sticky` 之一（统称「定位元素」），偏移与 `z-index` 才开始工作。

## `relative`：相对自己，原位仍占

`relative` 是最温和的定位：元素**仍在正常流里**、原来的位置**仍然占着**，只是视觉上按 `top`/`left` 等偏移挪动，**不影响任何其他元素**。

```css
.tweak {
  position: relative;
  top: -2px; /* 视觉上抬高 2px，但它原来的格子还空在那 */
}
```

它有两个核心用途：

1. **微调**：让某元素相对原位轻微位移（如对齐图标基线）；
2. **当参照系**：给它加上 `position: relative` 但**不写任何偏移**，把它变成内部 `absolute` 子元素的「定位锚」——这是定位里最高频的用法。

```css
.card {
  position: relative; /* 不偏移，只为把坐标系交给子元素 */
}
.card__close {
  position: absolute;
  top: 8px;
  right: 8px;
}
```

::: warning relative 仍占位带来的「幽灵空白」
因为 `relative` 偏移后原位仍占空间，把元素挪开后，原处会留下一块「看不见但占着」的空白，后面元素**不会**顶上来。需要元素挪走且后续元素补位时，应该用 `absolute`（脱流）而非 `relative`。
:::

## `absolute`：脱流，相对最近定位祖先

`absolute` 把元素**彻底移出正常流**——原来的位置不再保留，后续元素会顶上来，仿佛它不存在。它的定位参照是**最近的「已定位」祖先**（`position` 计算值为 `relative`/`absolute`/`fixed`/`sticky` 的祖先）的内边距盒；若一路向上找不到任何已定位祖先，则相对**初始包含块（ICB）**，也就是视口大小的根。

```css
.menu {
  position: relative; /* 关键：给下拉一个参照 */
}
.menu__dropdown {
  position: absolute;
  top: 100%; /* 紧贴菜单底部 */
  left: 0;
  width: 200px;
}
```

几个要点：

- **尺寸**：`width`/`height` 为 `auto` 时按内容收缩（shrink-to-fit），而非撑满父级；
- **撑满技巧**：同时写 `top:0; bottom:0`（保持 `height:auto`）可纵向填满包含块，`left:0; right:0` 则横向填满；`inset: 0` 一次撑满四边；
- **外边距不折叠**：绝对定位盒的 margin **不与**其他元素的 margin 合并；
- **层叠上下文**：仅当 `z-index` 不为 `auto` 时才创建新层叠上下文。

::: tip 找错包含块是 absolute 第一大坑
如果忘了给最近的预期父级加 `position: relative`，浏览器会**继续往上找**，可能一路找到 `<body>` 甚至视口——于是你的角标跑到了页面左上角。排查 `absolute` 位置不对时，先确认「我想让它相对谁，那个谁定位了吗」。
:::

## `fixed`：相对视口，滚动不动

`fixed` 同样脱离正常流，但参照物通常是**视口**——页面怎么滚，它都钉在屏幕同一处。吸顶导航、右下角「回到顶部」、全屏遮罩都靠它。

```css
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
}
```

它在打印时会**出现在每一页的同一位置**（视为分页媒介的固定块）。

### `fixed` 的致命例外：被祖先的 `transform` 夺走

这是面试与实战的双料高频坑。MDN 明确：

> 若任一祖先的 `transform`、`perspective` 或 `filter` 属性被设为非 `none` 的值，**该祖先会取代视口成为 `fixed` 元素的包含块**。

也就是说，下面这段里 `.modal` 不再相对视口，而是相对 `.page`，`top: 0` 指的是 `.page` 的顶部而非屏幕顶部：

```css
.page {
  transform: translateZ(0); /* 哪怕只是「触发 GPU 层」这种无害写法 */
}
.modal {
  position: fixed;
  inset: 0; /* 本想铺满屏幕，结果只铺满了 .page */
}
```

能夺走 `fixed` 包含块的属性还包括 `will-change: transform`、`filter`、`backdrop-filter`、`contain: paint/layout/strict/content` 等。排查「`fixed` 怎么跟着滚 / 怎么没铺满屏幕」时，沿 DOM 往上找有没有祖先设了这些属性。**它始终创建层叠上下文**（与 `z-index` 无关）。

## `sticky`：流内吸附，越界即停

`sticky` 是「`relative` 与 `fixed` 的混血」：默认像 `relative` 一样待在正常流里随页面滚动；一旦滚动到你指定的**阈值**（如 `top: 0`），它就「吸住」、像 `fixed` 一样停在滚动容器的边上；直到它的**包含块（父级）**整体滚出视野，它又随父级一起离开。经典用途是吸顶表头、分组标题、侧栏吸附。

```css
.section-heading {
  position: sticky;
  top: 0; /* 滚到顶时吸住；没有这一行，sticky 形同 relative */
  background: var(--bg); /* 吸住时盖住下方内容，记得给背景 */
}
```

### `sticky` 三大「静默失效」

`sticky` 不报错，失效时只是「没吸住」，排查靠经验。三大主因：

1. **忘了写阈值**。`position: sticky` 必须在需要吸附的轴上设至少一个 `top`/`bottom`/`left`/`right`（非 `auto`）作为「触发线」。该轴上四个偏移全 `auto` 时，`sticky` 退化为普通 `relative`，永远不吸。

2. **父级 `overflow` 抢成了滚动容器**。MDN 原文：

   > 粘性元素「吸附」于其最近的、带有「滚动机制」的祖先（当 `overflow` 为 `hidden`、`scroll`、`auto` 或 `overlay` 时产生），**即便该祖先并非最近的实际滚动祖先**。

   这意味着：只要某个父级设了 `overflow: hidden`（哪怕只是为了清浮动或裁圆角），`sticky` 就会以**那个父级**为参照——而那个父级往往自身不滚动，于是 `sticky` 像被钉死，看起来「没生效」。这是最隐蔽的一种失效。

3. **父级高度不足**。`sticky` 只能在**它的包含块（父级）范围内**吸附。如果父级高度恰好等于（或小于）粘性元素自身高度，就没有「可供滑动吸附」的空间，元素从头到尾都贴着，看不出吸附效果。要让吸顶表头一路跟随，须保证它的父容器足够高。

::: warning sticky 自查清单
吸不住时，依次核对：①该轴上写阈值了吗（`top`/`bottom`/…）？②从它到滚动区之间，有没有父级设了 `overflow: hidden/auto/scroll`？③它的直接父级是否足够高？④是不是想吸附在 `<thead>`/`<tr>` 上但表格布局限制了它（给 `th`/`td` 而非 `tr` 设 `sticky` 更稳）？`sticky` 始终创建层叠上下文。
:::

## `inset` 与逻辑偏移

四个物理方向可用 `inset` 简写（顺序同 `margin`：上、右、下、左）：

```css
.fill { position: absolute; inset: 0; }              /* 撑满 */
.corner { position: fixed; inset: 12px 12px auto auto; } /* 钉右上 */
```

需要随书写方向自适应时，用逻辑属性 `inset-block-start`（块向起点）、`inset-inline-end`（行向终点）等——它们在 RTL 语言或竖排文字下会自动翻转，比写死 `left`/`right` 更稳健。

## 小结

`static` 不可定位，`relative` 原位微调兼作参照，`absolute` 脱流找最近定位祖先，`fixed` 钉视口但怕祖先 `transform`，`sticky` 流内吸附却怕没阈值和父级 `overflow`。摆好了位置，下一个问题就是元素重叠时谁压谁——进入最常被误解的 [z-index 与层叠上下文](./stacking-context)。
