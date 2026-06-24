---
layout: doc
---

# CSS 定位与层叠上下文

正常流（normal flow）把元素一个接一个码好，够用，但不够用的那一刻——要把徽标钉在角落、要让导航条吸顶、要让 tooltip 浮在内容之上、要让两个元素故意重叠——你需要的就是「定位」。`position` 的五个取值（`static` / `relative` / `absolute` / `fixed` / `sticky`）决定一个元素「相对谁、用 `top`/`left` 偏移多少、还占不占原来的位置」；而一旦元素开始重叠，谁压谁的问题就交给 `z-index` 与它背后那套常被误解的「层叠上下文」规则。本叶把这套「让元素离开队列、再决定上下层级」的机制讲透，并一路讲到 2026 年才进 Baseline 的 CSS 锚点定位，以及 `popover` / `<dialog>` 这两个「顶层」新成员如何让定位彻底摆脱 `z-index` 战争。

## 概述

- **它管什么**：让元素脱离或半脱离正常流——相对自己微调（`relative`）、相对祖先精确摆放（`absolute`）、钉死在视口（`fixed`）、滚到边界才吸住（`sticky`）；以及元素重叠时，用 `z-index` 与层叠上下文决定上下层级。
- **两条主线**：一条是**平面内的位置**（`position` + `top`/`right`/`bottom`/`left` + `inset`）；一条是**Z 轴上的层级**（`z-index` + 层叠上下文 + 层叠顺序）。两者交织——同一个 `z-index` 写在不同层叠上下文里，效果天差地别。
- **几个绕不开的坑**：`absolute` 找不对「包含块」、`fixed` 被祖先的 `transform` 偷走、`sticky` 忘了写阈值或被父级 `overflow` 闷死、`z-index: 999` 仍压不过别人（被困在低层级的父上下文里）。本叶逐一拆解。
- **现代化关注点**：CSS 锚点定位（`anchor()` / `position-anchor` / `@position-try`，**Baseline 2026 · 仍需降级**）把「跟随某元素并自动避让溢出」变成纯 CSS；`popover` 属性与 `<dialog>` 的模态把内容送进**顶层（top layer）**，天然越过所有 `z-index` 与 `overflow` 裁剪。

## 本叶地图

- [入门](./getting-started) —— 五分钟认全 `position` 五取值与「包含块 / 层叠」两个核心概念
- [position 五取值](./guide-line/position-values) —— `static`/`relative`/`absolute`/`fixed`/`sticky`、`inset`、包含块、`sticky` 失效陷阱
- [z-index 与层叠上下文](./guide-line/stacking-context) —— 创建条件、七层层叠顺序、`z-index` 困局（面试高频）
- [float / clear 与清除浮动](./guide-line/float-clear) —— 遗留机制、`clear`、用 BFC 清浮动、为何现在改用 Flex/Grid
- [CSS 锚点定位](./guide-line/anchor-positioning) —— `anchor()`/`position-anchor`/`@position-try`/`position-visibility`、**Baseline 状态与降级**
- [定位实战模式](./guide-line/positioning-patterns) —— 角标 / 吸顶 / tooltip / 绝对居中 / 全屏遮罩，配方与坑
- [popover & dialog 与定位](./guide-line/popover-dialog-positioning) —— 顶层渲染、`::backdrop`、与锚点定位配合，告别 `z-index` 战争
- [参考](./reference) —— 速查表 + `position` 表 + 层叠上下文触发表 + Baseline 状态 + 权威链接

## 文档地址

- [web.dev: Learn CSS — z-index and stacking contexts](https://web.dev/learn/css/z-index)
- [MDN: `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: Stacking context（理解 z-index）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- [MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)

## 幻灯片地址

<a href="/SlideStack/css-positioning-slide/" target="_blank">CSS 定位与层叠上下文</a>
