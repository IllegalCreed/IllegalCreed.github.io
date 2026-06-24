---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `position` 五取值：`static`（默认/正常流）、`relative`（原位占位 + 视觉偏移）、`absolute`（脱流/相对最近定位祖先）、`fixed`（脱流/相对视口）、`sticky`（流内 + 越阈值吸住）
- 偏移：`top`/`right`/`bottom`/`left`，简写 `inset`（同 `margin` 顺序），逻辑写法 `inset-block-start` 等；只对非 `static` 生效
- `fixed` 例外：祖先 `transform`/`filter`/`perspective`（非 `none`）夺走包含块
- `sticky` 三大失效：无阈值 → 退化 `relative`；父级 `overflow` 非 `visible` 抢成滚动容器；父级高度不足
- `z-index`：仅定位元素 + Flex/Grid 子项有效；只在**同一层叠上下文内**可比；可负
- 层叠上下文创建：根元素 / 定位+`z-index≠auto` / `fixed`/`sticky` / `opacity<1` / `transform` 等 / `isolation:isolate` / `contain` / `container-type` / 顶层…
- 七层层叠序：上下文背景 → 负 `z-index` → 块级 → 浮动 → 行内 → `z-index:0/auto` 定位 → 正 `z-index`
- 清浮动：`display: flow-root`（首选/零副作用）> clearfix > `overflow`（有副作用）
- 顶层逃逸：`popover` / `<dialog>` 模态进顶层，免疫 `z-index` 与 `overflow`
- Baseline：`position` 远古可用；`<dialog>` 2022 广泛；`popover` 2024 新近；**锚点定位 2026 新近（需降级）**

## `position` 取值速查

| 取值 | 正常流 | 包含块（参照） | `inset` 生效 | 创建层叠上下文 | 关键坑 |
| --- | --- | --- | --- | --- | --- |
| `static` | 是 | — | 否 | 否 | 偏移/`z-index` 全无效 |
| `relative` | 是（占位） | 自身原位 | 是 | 仅 `z-index≠auto` | 原位留「幽灵空白」 |
| `absolute` | 否 | 最近已定位祖先 / 视口 | 是 | 仅 `z-index≠auto` | 找错包含块 |
| `fixed` | 否 | 视口（除非祖先 transform/filter/perspective） | 是 | **总是** | 祖先 `transform` 夺包含块 |
| `sticky` | 是 → 吸 | 最近块级祖先 + 滚动容器 | 是（须设阈值） | **总是** | 无阈值 / 父 `overflow` / 父高不足 |

## 偏移与 `inset` 速查

| 属性 | 说明 |
| --- | --- |
| `top` / `right` / `bottom` / `left` | 物理方向偏移 |
| `inset` | 四向简写（上 右 下 左）；`inset: 0` 撑满包含块 |
| `inset-block-start` / `inset-block-end` | 块向起/终偏移（随书写模式翻转） |
| `inset-inline-start` / `inset-inline-end` | 行向起/终偏移（适配 RTL） |
| `z-index` | 层级（仅定位元素 + Flex/Grid 子项；可负；默认 `auto`） |

::: tip 对向 inset 行为
同写 `top`+`bottom`（`height:auto`）→ 纵向拉伸填满；同写 `left`+`right`（`width:auto`）→ 横向填满；冲突且尺寸固定时 `top` 胜 `bottom`、`left` 胜 `right`（LTR）。
:::

## 层叠上下文触发条件速查

| 触发条件 | 备注 |
| --- | --- |
| 根元素 `<html>` | 最顶层上下文 |
| `position: relative/absolute` + `z-index≠auto` | 经典触发 |
| `position: fixed` / `sticky` | **与 `z-index` 无关，定位即触发** |
| Flex / Grid 子项 + `z-index≠auto` | 无需 `position` |
| `opacity < 1` | 隐形触发（`0.99` 即触发） |
| `mix-blend-mode ≠ normal` | — |
| `transform`/`scale`/`rotate`/`translate`（非 `none`） | 隐形触发（`translateZ(0)` hack） |
| `filter` / `backdrop-filter`（非 `none`） | — |
| `perspective` / `clip-path` / `mask`（非 `none`） | — |
| `isolation: isolate` | **零副作用，主动隔离首选** |
| `will-change`（指定上述属性） | 隐形触发 |
| `contain: layout/paint/strict/content` | — |
| `container-type: size / inline-size` | 容器查询 |
| 顶层元素及其 `::backdrop` | 全屏 / `popover` / 模态 `<dialog>` |

## 上下文内七层层叠顺序（自底向上）

| 层 | 内容 |
| --- | --- |
| 1 | 创建上下文元素的**背景 / 边框** |
| 2 | **负 `z-index`** 子上下文 |
| 3 | 正常流**块级盒**（非定位） |
| 4 | **浮动盒** |
| 5 | 正常流**行内 / 行内块盒** |
| 6 | `z-index: auto / 0` 的**定位元素** |
| 7 | **正 `z-index`** 子上下文 |

> 同层再按**源序**：HTML 中靠后者在上。负 `z-index` 在背景之上、块级内容之下（故能垫到文字背后）。

## `float` / `clear` / BFC 速查

| 项 | 取值 / 写法 | 说明 |
| --- | --- | --- |
| `float` | `left` / `right` / `none` / `inline-start` / `inline-end` | 脱流、内容环绕；今仅用于图文环绕 |
| `clear` | `left` / `right` / `both` / `none` | 移到此前浮动元素下方 |
| 清浮动①（首选） | `display: flow-root` | 开 BFC、零副作用 |
| 清浮动② | `.cf::after{content:"";display:block;clear:both}` | 经典 clearfix |
| 清浮动③ | `overflow: auto / hidden` | 有裁剪/滚动副作用、且会破坏内部 `sticky` |
| BFC 特性 | — | 包含内部浮动 / 阻断 margin 折叠 / 不与外部浮动重叠 |

## 锚点定位速查（Baseline 2026 · 需降级）

| 特性 | 用途 | 示例 |
| --- | --- | --- |
| `anchor-name` | 声明锚点 | `anchor-name: --a;` |
| `position-anchor` | 关联定位元素到锚点 | `position-anchor: --a;` |
| `anchor()` | 取锚点边作 inset 坐标 | `top: anchor(bottom);` |
| `anchor-size()` | 按锚点尺寸定尺寸 | `width: anchor-size(width);` |
| `position-area` | 3×3 网格摆放 | `position-area: bottom;` |
| `@position-try` + `position-try-fallbacks` | 备选位置、溢出自动换 | `flip-block, --custom` |
| `position-try-order` | 初始挑空间最大备选 | `most-height` |
| `position-visibility` | 条件强隐藏 | `anchors-visible` |

## popover / dialog 速查

| 项 | 要点 |
| --- | --- |
| `popover="auto"` | 默认；轻触关闭、同时只显示一个 |
| `popover="manual"` | 不自动关、可多个并存 |
| `popover="hint"` | 提示型；不关 `auto` 弹层 |
| 触发 | `popovertarget="id"` + `popovertargetaction`；`showPopover()`/`hidePopover()`/`togglePopover()` |
| `<dialog>` `showModal()` | **模态**：顶层 + `::backdrop` + 焦点陷阱 + 背景 inert + 自动居中 |
| `<dialog>` `show()` / `open` | 非模态：不进顶层、受 `z-index`/`overflow` 影响（**勿用 `open` 开模态**） |
| `::backdrop` | 模态/popover 背后遮罩，可设变暗/模糊 |
| 顶层共性 | **无视祖先 `z-index` 与 `overflow` 裁剪** |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `position` 五取值 | ✅ Baseline 广泛可用（2015-07） | 放心用 |
| `inset` 简写 / 逻辑 inset | ✅ Baseline 广泛可用 | 放心用 |
| `display: flow-root`（清浮动） | ✅ Baseline 广泛可用 | 清浮动首选 |
| `isolation: isolate` | ✅ Baseline 广泛可用 | 隔离层叠上下文首选 |
| `<dialog>`（含 `showModal`/`::backdrop`） | ✅ Baseline 广泛可用（2022-03） | 放心用，模态首选 |
| `popover` 属性 / Popover API | 🟡 Baseline 新近可用（2024-04） | 较成熟，老浏览器需回退 |
| CSS 锚点定位（`anchor-name`/`anchor()`/`@position-try`…） | 🟠 **Baseline 新近可用（2026-01）** | **新特性，必须 `@supports` 降级** |
| `position-visibility` / `position-try-order` | 🟠 同锚点定位（2026） | 同上，渐进增强 |

> 锚点定位是本叶唯一「2026 才进 Baseline」的能力——`@supports (anchor-name: --x)` 包裹增强样式，不支持时回退传统 `absolute` 或 JS（Floating UI）。

## 权威链接

**标准 / 规范**

- [MDN: `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position) · [`z-index`](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) · [`inset`](https://developer.mozilla.org/en-US/docs/Web/CSS/inset)
- [MDN: Stacking context（理解 z-index）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- [MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using) · [Fallback & 条件隐藏](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Try_options_hiding)
- [MDN: `popover` 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover) · [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

**课程 / 指南**

- [web.dev: Learn CSS — z-index and stacking contexts](https://web.dev/learn/css/z-index)
- [MDN: CSS positioned layout（模块首页）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Floating UI（锚点定位的 JS 兜底方案）](https://floating-ui.com/)

## 相关页

- [入门](./getting-started) · [position 五取值](./guide-line/position-values) · [z-index 与层叠上下文](./guide-line/stacking-context)
- [float / clear 与清除浮动](./guide-line/float-clear) · [CSS 锚点定位](./guide-line/anchor-positioning)
- [定位实战模式](./guide-line/positioning-patterns) · [popover & dialog 与定位](./guide-line/popover-dialog-positioning)
