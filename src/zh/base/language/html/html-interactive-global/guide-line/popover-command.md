---
layout: doc
outline: [2, 3]
---

# `popover` 与 `command` 调用

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `popover` 属性：给任意元素加上即成弹层，默认隐藏（`display: none`），显示时进入**顶层**（无需 `z-index`）
- `popover="auto"`（默认）：支持 light dismiss（点外面 / `Esc` 关闭）、且**同类互斥**（开新的自动关旧的）
- `popover="manual"`：不自动关闭，必须显式触发；可同时开多个；`popover="hint"`：提示类（如 tooltip），不关闭其它 `auto`
- 触发：`<button popovertarget="弹层id">` 配 `popovertargetaction="show|hide|toggle"`（默认 `toggle`，**零 JS**）；JS 则用 `el.showPopover()` / `hidePopover()` / `togglePopover()`
- 样式：`::backdrop` 画背后遮罩；`:popover-open` 仅在弹层显示时命中
- 事件：`beforetoggle`（变化前，可阻止）/ `toggle`（变化后）；均为 `ToggleEvent`，带 `newState` / `oldState`
- `popover` 弹层**永远非模态**（不接管焦点、不失活背景）；要模态用 `<dialog>`（`<dialog popover>` 也合法）
- `command` / `commandfor`：声明式调用者，比 `popovertarget` 更通用，可控对话框 + 弹层
- 内置 `command` 值：对话框 `show-modal` / `close` / `request-close`；弹层 `show-popover` / `hide-popover` / `toggle-popover`；自定义以 `--` 开头
- Baseline：`popover` API 自 2025 年 1 月起新近可用；`command` / `commandfor` **更新**（2025 年各浏览器才陆续支持），需降级

## `popover`：零 JS 弹层

给任意元素加 `popover` 属性，再用一个带 `popovertarget` 的按钮指向它，就得到一个**完全不写 JavaScript** 的弹层：

```html
<button popovertarget="menu">操作菜单</button>

<div id="menu" popover>
  <button>重命名</button>
  <button>复制</button>
  <button>删除</button>
</div>
```

只凭这两段标签，你就免费得到：

- 点按钮**开合**（`popovertargetaction` 默认是 `toggle`）；
- 点弹层**外面**自动关闭（light dismiss）；
- 按 `Esc` 关闭；
- 弹层渲染到**顶层**（top layer）——它永远盖在普通内容之上，**不必再和 `z-index` 较劲**，也不会被祖先的 `overflow: hidden` 裁掉。

### 三种 `popover` 状态

| 取值 | light dismiss | 互斥 | 典型用途 |
| --- | --- | --- | --- |
| `auto`（默认） | 是（点外面 / `Esc` 关） | 是（开新的关旧的同类） | 菜单、下拉、对话气泡 |
| `manual` | 否（必须显式关） | 否（可同时开多个） | 常驻提示、Toast 通知 |
| `hint` | 是 | 不影响 `auto` 弹层 | 悬浮提示（tooltip）类 |

`hint` 较新，用于「不应关掉已打开的菜单」的轻提示场景；不支持时可退回 `auto` 或 `manual`。

### `popovertargetaction`

按钮上的 `popovertargetaction` 指定动作：`show`（仅开）、`hide`（仅关）、`toggle`（开合，默认）。一个常见组合是「弹层内部放一个关闭按钮」：

```html
<div id="card" popover>
  <p>提示内容</p>
  <button popovertarget="card" popovertargetaction="hide">知道了</button>
</div>
```

### JS 控制与样式钩子

需要脚本介入时，`HTMLElement` 上有三个方法：`showPopover()`、`hidePopover()`、`togglePopover()`。配套的 CSS 钩子：

```css
/* 弹层显示时的样式 */
[popover]:popover-open {
  opacity: 1;
}

/* 弹层背后的遮罩（可模糊背景） */
[popover]::backdrop {
  background: rgb(0 0 0 / 0.2);
}
```

状态变化时派发 `beforetoggle`（**变化前**，可 `preventDefault()` 阻止打开）与 `toggle`（**变化后**）事件，均携带 `newState`（`"open"` / `"closed"`）：

```js
const menu = document.getElementById("menu");
menu.addEventListener("toggle", (e) => {
  if (e.newState === "open") console.log("菜单打开了");
});
```

::: warning popover 不是 dialog
`popover` 弹层**永远是非模态的**：它**不**接管焦点、**不**失活背景页面。需要「遮挡 + 焦点陷阱」的真模态，仍要用 [`<dialog>`](./dialog-inert) 的 `showModal()`。两者可以组合——`<dialog popover>` 是合法写法，把对话框语义与弹层的 light dismiss 结合起来。
:::

::: tip Baseline 现状
Popover API 自 **2025 年 1 月**起达到 Baseline（新近可用），Chrome / Edge 114、Safari 17、Firefox 125 一线起支持。在更老的浏览器里，带 `popover` 的元素会因为默认的 `display: none` 而**完全不显示**——这是个「不可忽视的降级」。如果你的受众可能用老浏览器，要么提供 JS 兜底，要么确认目标浏览器都已支持。
:::

## `command` / `commandfor`：声明式调用者

`popovertarget` 只能开合弹层。更通用的 `command` / `commandfor`（Invoker Commands）把这种「按钮声明式地操作目标元素」的能力扩展到**对话框**乃至自定义动作——同样**零 JavaScript**：

```html
<!-- 用按钮以声明方式打开模态对话框，无需写 showModal() -->
<button command="show-modal" commandfor="dlg">打开对话框</button>

<dialog id="dlg">
  <p>确认删除？</p>
  <!-- 关闭对话框，并把 value 写入 returnValue -->
  <button command="close" commandfor="dlg" value="confirm">确定</button>
  <button command="close" commandfor="dlg" value="cancel">取消</button>
</dialog>
```

- **`commandfor`**：指向被控元素的 `id`（它是 `popovertarget` 的「通用版」）；
- **`command`**：要执行的动作。

### 内置 `command` 值

| 目标 | `command` 值 | 等价 JS |
| --- | --- | --- |
| `<dialog>` | `show-modal` | `dialog.showModal()` |
| `<dialog>` | `close` | `dialog.close()`（带 `value` 时写入 `returnValue`） |
| `<dialog>` | `request-close` | `dialog.requestClose()`（先发可取消的 `cancel`） |
| 弹层 | `show-popover` | `el.showPopover()` |
| 弹层 | `hide-popover` | `el.hidePopover()` |
| 弹层 | `toggle-popover` | `el.togglePopover()` |

### 自定义命令与 `CommandEvent`

以**两个连字符 `--`** 开头的值是自定义命令。点击这类按钮会在目标元素上派发 `CommandEvent`，你监听它来执行任意逻辑：

```html
<button command="--archive" commandfor="post-42">归档</button>
<article id="post-42">…</article>

<script>
  document.getElementById("post-42").addEventListener("command", (e) => {
    if (e.command === "--archive") {
      console.log("归档，触发按钮是", e.source); // source 指向那个按钮
    }
  });
</script>
```

`CommandEvent` 带两个关键属性：`command`（命令字符串）与 `source`（发起命令的按钮）。

::: danger Baseline 现状 —— 很新，务必降级
`command` / `commandfor` 是本叶**最新**的特性：Chrome / Edge 135、Safari 26.2、Firefox 144 才支持，全部集中在 **2025 年**落地，**目前尚非 Baseline「广泛可用」，最多算刚刚进入新近可用区间**。

降级策略（**生产环境必做**）：

- **不支持的浏览器会把它当普通按钮**——`command` / `commandfor` 被忽略，点了**没有任何效果**。这不像 `popover` 那样「至少能看到 fallback 内容」，而是交互彻底失灵。
- 因此当前阶段更稳妥的做法是：要么仍用 JS 绑定点击（`btn.addEventListener("click", () => dlg.showModal())`）作为主逻辑，把 `command` 当锦上添花；要么用特性检测 `'command' in HTMLButtonElement.prototype` 决定是否启用声明式路径，对老浏览器回退到脚本。
- 简单的弹层控制，现阶段优先用支持度更高的 `popovertarget`。
:::

## 三者怎么选

| 需求 | 推荐 |
| --- | --- |
| 轻量弹层（菜单 / 提示），点外面就关 | `popover` + `popovertarget` |
| 需要遮挡背景、收拢焦点的真模态 | `<dialog>` + `showModal()` |
| 声明式控对话框 / 自定义动作，且能接受降级 | `command` / `commandfor`（配 JS 兜底） |

## 小结

`popover` 用一个属性换来顶层渲染与 light dismiss，`command` / `commandfor` 把声明式调用推广到对话框——但后者很新，务必带降级。这些交互都离不开焦点能否被键盘正确触达，下一页系统讲 [焦点管理](./focus-management)。
