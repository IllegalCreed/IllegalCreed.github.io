---
layout: doc
outline: [2, 3]
---

# CSS 锚点定位

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **是什么**：用纯 CSS 把一个定位元素「拴」在另一个「锚点」元素上——尺寸、位置都跟随锚点，并能在快溢出时**自动换位避让**。过去这要靠 JS（监听 resize/scroll 重算坐标）
- `anchor-name: --foo`：把元素声明为锚点，名字是 `<dashed-ident>`（必须以 `--` 开头）
- `position-anchor: --foo`：让一个 `absolute`/`fixed` 元素关联到某锚点（仅关联，还需配合 `anchor()` / `position-area` 才真正定位）
- `anchor()` 函数：用在 `top`/`left` 等 inset 属性里，取锚点的某条边——`anchor(bottom)`、`anchor(start)`、`anchor(50%)` 等；可 `calc(anchor(bottom) + 8px)` 加间距
- `anchor-size()`：按锚点尺寸定尺寸——`width: anchor-size(width)`
- `position-area`：3×3 网格摆放——`position-area: top`、`bottom right`、`top span-all` 等，最直观
- `@position-try --name { … }` + `position-try-fallbacks`：定义备选位置，溢出视口时浏览器按序尝试，第一个放得下的胜出；内置 `flip-block` / `flip-inline` / `flip-start`
- `position-try-order`：`normal` / `most-width` / `most-height` 等，初始就挑空间最大的备选
- `position-visibility`：`always` / `no-overflow`（自身溢出就强隐藏）/ `anchors-visible`（锚点全隐时强隐藏）
- **Baseline 状态**：🟡 **Baseline 2026 · 新近可用（自 2026-01 起）**——尚未「广泛可用」，**老设备 / 旧浏览器不支持，必须降级**
- **降级**：用 `@supports (anchor-name: --x) { … }` 包裹增强样式；不支持时回退到传统 `absolute` 定位或 JS 方案（如 Floating UI）

## 它解决什么问题

「让一个浮层跟着某个按钮，并在屏幕边缘自动翻到另一侧」——tooltip、下拉菜单、popover 的定位需求，长期以来只能靠 JavaScript：监听滚动和缩放、读取锚点的 `getBoundingClientRect()`、计算坐标、再判断会不会溢出视口然后翻面。MDN 点明了这个历史痛点：

> 过去，把一个元素关联到另一个元素、并根据锚点位置动态改变定位元素的位置与尺寸，需要 JavaScript，这带来了复杂度与性能问题。

CSS 锚点定位把这一整套搬进了**纯 CSS 声明**。

::: warning 先看清 Baseline：这是 2026 年的新东西
CSS 锚点定位的核心属性（`anchor-name`、`position-anchor`、`@position-try` 等）的 Baseline 状态是 **「Baseline 2026 · Newly available」——自 2026 年 1 月起**才在最新浏览器间打通。MDN 原文：「Since January 2026, this feature works across the latest devices and browser versions. This feature might not work in older devices or browsers.」

这意味着它**还没到「广泛可用（Widely available）」**，老设备和未更新的浏览器**不支持**。生产环境使用**必须配合 `@supports` 降级**（见文末）。本页把它当作「渐进增强」来教，而非「随便用」。
:::

## 三步把元素拴到锚点

### ① 用 `anchor-name` 声明锚点

锚点元素用 `anchor-name` 起个名字，值是 `<dashed-ident>`（必须 `--` 开头）：

```css
.trigger {
  anchor-name: --trigger;
}
```

### ② 用 `position-anchor` 关联定位元素

被定位的元素必须是 `absolute` 或 `fixed`，用 `position-anchor` 指向那个名字：

```css
.tooltip {
  position: fixed;
  position-anchor: --trigger;
}
```

注意：光写 `position-anchor` **只建立关联、不会真的摆好位置**——还要用下面的 `anchor()` 或 `position-area` 指定「摆在锚点的哪一侧」。

### ③ 用 `anchor()` 或 `position-area` 定位

**方式 A：`anchor()` 函数**，用在 inset 属性里，取锚点的某条边作为坐标：

```css
.tooltip {
  position: fixed;
  position-anchor: --trigger;
  top: anchor(bottom);          /* 顶边贴着锚点的底边 */
  left: anchor(left);           /* 左边对齐锚点左边 */
  margin-top: 8px;              /* 留点间距 */
}
```

`anchor()` 可取的「锚点边」：物理值 `top`/`bottom`/`left`/`right`，逻辑值 `start`/`end`/`self-start`/`self-end`/`center`，以及百分比 `0%~100%`。可配合 `calc()` 精确留白：`inset-block-end: calc(anchor(start) + 10px)`。若取的边与当前 inset 属性的轴不兼容，则用回退值。

**方式 B：`position-area`（更直观）**，把锚点视作 3×3 网格中心，直接说「放哪个格」：

```css
.tooltip {
  position: fixed;
  position-anchor: --trigger;
  position-area: bottom;        /* 放在锚点正下方 */
}
```

`position-area` 取值是行（`top`/`center`/`bottom`）× 列（`left`/`center`/`right`）的组合：`top right`（右上）、`bottom span-all`（底部横跨整行）、`block-end span-inline-start` 等。它是日常摆 tooltip / 菜单**最省心**的写法。

## 按锚点尺寸定尺寸：`anchor-size()`

`anchor-size()` 让定位元素的尺寸跟随锚点——例如让下拉面板和触发按钮**等宽**：

```css
.dropdown {
  position: absolute;
  position-anchor: --trigger;
  top: anchor(bottom);
  width: anchor-size(width); /* 与锚点同宽 */
}
```

可取 `width`/`height`/`inline`/`block`/`self-inline`/`self-block`，也能 `calc(anchor-size(width) * 4)` 做倍数。注意：在 inset 属性里用 `anchor-size()` **只跟踪锚点尺寸、不跟踪其位置**。

## 自动避让溢出：`@position-try` 与备选位置

锚点定位最强的一招，是浏览器能在「默认位置会溢出视口」时**自动换到备选位置**——这正是过去 JS 翻面逻辑的纯 CSS 替代。

### 内置翻转策略（最简单）

`position-try-fallbacks` 直接给内置策略，浏览器按序尝试，挑第一个「能完整放进视口/包含块」的：

```css
.tooltip {
  position: fixed;
  position-anchor: --trigger;
  position-area: top;
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
}
```

- `flip-block`：沿块轴翻转（上 ↔ 下）；
- `flip-inline`：沿行轴翻转（左 ↔ 右）；
- `flip-start`：沿对角线翻转。

上例的含义：默认在上方；贴近视口顶部就 `flip-block` 翻到下方；贴近某条边再 `flip-inline`；两轴同时溢出时用组合的 `flip-block flip-inline` 翻到对角。若所有备选都放不下，元素**回退到最初定义的位置**。

### 自定义备选位置 `@position-try`

更复杂的换位用 `@position-try` 预先定义一组「备选样式」，再在 `position-try-fallbacks` 里按名字引用：

```css
@position-try --to-bottom {
  position-area: bottom;
  margin-top: 8px;
}
@position-try --to-left {
  position-area: left;
  margin-right: 8px;
}

.tooltip {
  position: fixed;
  position-anchor: --trigger;
  position-area: top;
  position-try-fallbacks: --to-bottom, --to-left;
}
```

`@position-try` 内部**只允许**有限的描述符：`position-anchor`、`position-area`、inset 属性、`margin-*`、尺寸属性、自对齐属性。命中某个备选时，这些值会**覆盖**元素上原有的对应属性。

### 初始就挑空间最大：`position-try-order`

`position-try-order` 让浏览器在**初始显示时**就优先选「可用空间最大」的备选，而非等到溢出才换：取值 `normal`（默认）、`most-width`、`most-height`、`most-block-size`、`most-inline-size`。简写 `position-try` 可一行写完顺序 + 备选：

```css
.tooltip {
  position-try: most-height --to-bottom, --to-top;
}
```

## 锚点不可见时怎么办：`position-visibility`

当锚点被滚出视口或被遮住，你通常希望浮层也跟着消失。`position-visibility` 管这件事：

- `always`（默认）：始终显示；
- `no-overflow`：浮层**自身**一旦开始溢出，就被「强隐藏」；
- `anchors-visible`：锚点**完全**不可见（滚出或被盖住）时强隐藏浮层；只要锚点露一点就保持可见。

```css
.tooltip {
  position-visibility: anchors-visible; /* 锚点没了，tooltip 也别孤零零留着 */
}
```

「强隐藏（strongly hidden）」相当于强制 `visibility: hidden`，无视元素自身的 `visibility` 设定。

## 降级：`@supports` 与回退方案

因为是 **Baseline 2026 新特性**，生产代码必须为不支持的浏览器兜底。标准做法是用 `@supports` 检测、把锚点定位作为「增强层」：

```css
/* 1. 先写一份「人人可用」的传统定位兜底 */
.tooltip {
  position: absolute;
  top: 100%;
  left: 0;
}

/* 2. 支持锚点定位的浏览器，用更聪明的版本覆盖 */
@supports (anchor-name: --x) {
  .trigger { anchor-name: --trigger; }
  .tooltip {
    position: fixed;
    position-anchor: --trigger;
    position-area: bottom;
    position-try-fallbacks: flip-block;
  }
}
```

若需要「所有浏览器都能自动避让溢出」，目前仍得请出 JS 方案（如 Floating UI）作为 polyfill 思路——但随着锚点定位铺开，纯 CSS 会逐步接管。**记住：本特性现在是渐进增强，不是默认能力。**

## 隐式锚点：`popover` 与 `<select>`

有些场景会**自动**建立锚点关系，无需手写 `anchor-name`：用 `popovertarget` 关联的 `popover` 元素，其触发按钮就是隐式锚点；可定制的 `<select>`（`appearance: base-select`）的下拉选择器也是。这让 [popover & dialog 与定位](./popover-dialog-positioning) 能直接 `position-area: bottom` 把弹层摆到按钮下方。

## 小结

CSS 锚点定位用 `anchor-name` / `position-anchor` / `anchor()` / `position-area` 把「拴住并跟随」搬进纯 CSS，`@position-try` + `position-try-fallbacks` 把「溢出自动翻面」也变成声明式——但它是 **Baseline 2026 的新成员，必须用 `@supports` 降级**。理论铺垫够了，下一页把定位的各种知识拼成真实组件——[定位实战模式](./positioning-patterns)。
