---
layout: doc
outline: [2, 3]
---

# popover & dialog 与定位

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **顶层（top layer）**：一个浏览器维护的、凌驾于整个文档之上的渲染层。进顶层的元素**完全无视祖先的 `z-index` 与 `overflow` 裁剪**——这是它们对定位的最大价值
- **`popover` 属性**：`auto`（默认，可「轻触关闭」点外部/`Esc`/开新弹层即关，同时只显示一个）、`manual`（不自动关，可多个并存）、`hint`（提示型，不关 `auto` 弹层）
- **触发**：按钮加 `popovertarget="id"`，可选 `popovertargetaction="show|hide|toggle"`；JS：`showPopover()` / `hidePopover()` / `togglePopover()`
- **Popover Baseline**：✅ **Baseline 2024 · 新近可用（自 2024-04）**——比锚点定位成熟，但仍非「广泛可用」很久
- **`<dialog>` 元素**：`showModal()` 开**模态**（进顶层、有 `::backdrop`、焦点陷阱、背景 `inert`、`Esc` 关）；`show()` 开**非模态**（不进顶层、无背景、不困焦点）
- **别用 `open` 属性开模态**：`open` 只能开**非模态**、不进顶层；模态务必用 `showModal()`
- **`<dialog>` Baseline**：✅ **Baseline Widely available（自 2022-03 广泛可用）**——最成熟，放心用
- **`::backdrop`**：模态 `<dialog>` 与 `popover` 背后的遮罩层，可单独设样式（变暗/模糊）
- **与锚点定位配合**：`popover` 的触发按钮是**隐式锚点**，可直接 `position-area: bottom` 把弹层摆到按钮下方（锚点定位 Baseline 2026，需降级）
- **模态默认居中**：`showModal()` 打开的对话框由浏览器**自动居中**，无需手写定位

## 核心概念：顶层（top layer）

前两页反复出现一句话——「进顶层就免疫 `z-index` 与 `overflow`」。这里讲清它。

**顶层（top layer）** 是浏览器在普通文档之上额外维护的一个渲染层。被「提升」到顶层的元素，绘制时**位于所有常规内容之上**，并且：

- **无视 `z-index`**：不参与页面的[层叠上下文](./stacking-context)博弈，再大的 `z-index: 99999` 也跟它无关；
- **无视祖先 `overflow`**：不会被任何祖先的 `overflow: hidden` 裁掉，也不被滚动容器困住。

能进顶层的有三类：用 `popover` 属性的弹层、用 `showModal()` 打开的模态 `<dialog>`、全屏（Fullscreen API）元素。这从根本上终结了「弹窗被父级裁掉 / `z-index` 永远不够大」的世代难题。

## `popover` 属性：声明式轻量弹层

给任意元素加 `popover` 属性，再用一个按钮的 `popovertarget` 指向它，就有了一个进顶层的弹层——**无需任何 JS**：

```html
<button popovertarget="menu">打开菜单</button>
<div id="menu" popover>
  <ul>
    <li><a href="#">新建</a></li>
    <li><a href="#">打开</a></li>
  </ul>
</div>
```

MDN 对其定位特性的描述是关键：

> 打开时，popover 元素会出现在顶层、位于所有其他元素之上，**且不受父元素 `position` 或 `overflow` 样式的影响**。

### 三种 `popover` 值

| 值 | 轻触关闭 | 同类互斥 | 典型场景 |
| --- | --- | --- | --- |
| `auto`（默认） | 是（点外部 / `Esc` / 开新 `auto`） | 是，同时只显示一个 | 菜单、下拉 |
| `manual` | 否，须显式关 | 否，可多个并存 | 常驻面板、Toast |
| `hint` | 是 | 关其他 `hint`，但**不关 `auto`** | tooltip、提示 |

### 控制与 JS API

- 按钮属性：`popovertarget="id"`，配 `popovertargetaction="show" | "hide" | "toggle"`（默认 `toggle`）；
- JS 方法：`element.showPopover()` / `hidePopover()` / `togglePopover()`；
- CSS：`:popover-open` 选中打开态，`::backdrop` 设背后遮罩。

**Baseline**：`popover` 属性是 **「Baseline 2024 · Newly available」——自 2024 年 4 月起**在主流浏览器打通。它比下一节会配合的锚点定位成熟得多，但仍属新近能力，老浏览器需 polyfill 或回退。

## `<dialog>`：原生对话框，模态首选

`<dialog>` 是语义化的原生对话框元素，**打开方式决定一切**：

```html
<dialog id="confirm">
  <form method="dialog">
    <p>确定删除吗？</p>
    <button value="cancel">取消</button>
    <button value="ok" autofocus>确定</button>
  </form>
</dialog>
```

```js
const dlg = document.getElementById("confirm");
dlg.showModal(); // 模态打开
```

### `showModal()` vs `show()` vs `open`

| 打开方式 | 进顶层 | `::backdrop` | 焦点陷阱 | 背景 inert | `Esc` 关闭 | 受祖先 z-index/overflow 影响 |
| --- | --- | --- | --- | --- | --- | --- |
| `showModal()`（模态） | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 不受影响 |
| `show()`（非模态） | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 受影响 |
| `open` 属性 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 受影响 |

::: warning 别用 `open` 属性开模态
`<dialog open>` 或切换 `open` 属性，得到的是**非模态**对话框——不进顶层、无背景遮罩、不困焦点、`Esc` 不关。MDN 明确建议「用 `.show()` 或 `.showModal()` 方法来渲染对话框，而非 `open` 属性」。要真正的模态（带遮罩、焦点管理、顶层），**必须** `showModal()`。
:::

模态 `<dialog>` 进顶层后，与 `popover` 一样**不受祖先 `z-index` 与 `overflow` 影响**，且**浏览器自动把它居中**——这正是 [定位实战模式](./positioning-patterns) 里推荐「弹窗居中直接用 `<dialog>`」的原因：省掉 `inset:0 + margin:auto` 或 `translate(-50%,-50%)` 那套手工活，也绕开 `transform` 夺包含块的坑。

**Baseline**：`<dialog>` 是 **「Baseline Widely available」——自 2022 年 3 月起广泛可用**，三者中最成熟，可放心用。

### `::backdrop` 与关闭

模态对话框（和 popover）背后那层遮罩是 `::backdrop` 伪元素，可单独设样式：

```css
dialog::backdrop {
  background: rgb(0 0 0 / 50%);
  backdrop-filter: blur(2px);
}
```

关闭方式：`dlg.close("returnValue")`、`Esc` 键（模态默认）、`<form method="dialog">` 提交（自动关闭并把按钮 `value` 写入 `returnValue`）。还可用 `closedby` 属性控制：`none`（仅程序关）、`closerequest`（`Esc` 等，`showModal()` 默认）、`any`（点外部「轻触关闭」+ `Esc`）。

## 顶层弹层 + 锚点定位：天作之合

`popover` / `<dialog>` 解决了「层级与裁剪」，但**默认不会自动贴着触发按钮**（模态 `<dialog>` 是居中，`popover` 默认也居中显示）。要让弹层精准跟随按钮，就把它和上一页的 [CSS 锚点定位](./anchor-positioning) 组合——而且 `popover` 还省了 `anchor-name`：**用 `popovertarget` 关联的按钮自动成为隐式锚点**：

```css
#menu {
  /* #menu 是 popover，其触发按钮已是隐式锚点 */
  position-area: bottom; /* 直接摆到按钮正下方 */
  margin-top: 0.4rem;
}
```

这样就同时拿下「进顶层免 `z-index`/`overflow`」与「锚点跟随 + 自动避让」两件事——现代下拉菜单的理想形态。

::: tip 组合方案的 Baseline 现实
`popover`（2024）与 `<dialog>`（2022）已较成熟，但与之配合的**锚点定位是 Baseline 2026 新特性**。所以「popover + `position-area`」这套**整体仍需降级**：不支持锚点定位的浏览器里，弹层会落到默认（居中）位置而非按钮下方——功能不坏，只是位置退化。生产中按 [anchor-positioning 那页](./anchor-positioning) 的 `@supports` 思路兜底。
:::

## 小结

顶层是终结 `z-index` 战争的终极武器：`popover`（Baseline 2024）做轻量弹层、模态 `<dialog>`（Baseline 2022，用 `showModal()`、别用 `open`）做对话框，两者都进顶层、自动免疫祖先 `z-index` 与 `overflow`，再叠加 CSS 锚点定位（Baseline 2026，需降级）实现跟随与避让。至此本叶的定位、层叠、浮动、锚点、实战、顶层全部串起——回到 [参考](../reference) 速查全部要点与 Baseline 状态表。
