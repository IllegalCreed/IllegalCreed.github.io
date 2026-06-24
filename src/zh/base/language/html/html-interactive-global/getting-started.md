---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 折叠：`<details>` + `<summary>`，加 `open` 默认展开；同 `name` 多个 `details` 组成「手风琴」（互斥，2024 起）
- 对话框：`<dialog>` + JS `dialog.showModal()`（模态）/ `dialog.show()`（非模态）/ `dialog.close(值)`；`::backdrop` 画遮罩
- 表单关闭：`<dialog>` 内 `<form method="dialog">`，提交即关闭并把按钮 `value` 写入 `dialog.returnValue`
- 弹层：任意元素加 `popover` 属性 + `<button popovertarget="弹层id">`，零 JS 即可开合、`Esc` 关闭、点外面关闭
- 背景失活：`inert` 让一片区域不可点、不可聚焦、读屏器跳过（`showModal()` 会自动让其余页面 `inert`）
- 焦点：`tabindex="0"` 入 Tab 序、`tabindex="-1"` 仅可脚本聚焦、正数是**反模式**；`autofocus` 自动聚焦
- 焦点环：用 `:focus-visible`（仅键盘用户显示环），别只用 `:focus`
- 声明式调用：`<button command="show-modal" commandfor="对话框id">`（**很新，2025 起**，需降级）
- 全局属性：`id` / `class` / `data-*` / `hidden` / `title` / `lang` / `dir` / `contenteditable` / `inert` / `popover` 等，对**所有**元素生效
- 第一条 ARIA 规则：能用原生 HTML 元素就别拿 `div` + `role` 硬凑

## 四类原生交互，一个例子串起来

下面这段几乎不写 JavaScript，就同时用上了**折叠、对话框、弹层、焦点与失活**——本叶各页就是逐块拆解它：

```html
<!-- ① 折叠面板：点击 summary 展开/收起 -->
<details>
  <summary>什么是 Baseline？</summary>
  <p>Baseline 表示一项 Web 特性已在主流浏览器中稳定可用的状态。</p>
</details>

<!-- ② 弹层（popover）：零 JS 开合，点外面 / 按 Esc 自动关 -->
<button popovertarget="tips">查看提示</button>
<div id="tips" popover>
  <p>这是一个轻量提示弹层。</p>
</div>

<!-- ③ 对话框（dialog）：用 JS 打开为模态，背景自动失活 -->
<button id="openBtn">打开对话框</button>
<dialog id="dlg">
  <form method="dialog">
    <p>确定要删除吗？此操作不可撤销。</p>
    <!-- 提交即关闭对话框，并把 value 写入 returnValue -->
    <button value="cancel">取消</button>
    <button value="confirm" autofocus>确定</button>
  </form>
</dialog>

<script>
  // dialog 必须用 JS 的 showModal() 才能拿到「模态 + 背景失活 + Esc 关闭」的完整能力
  const dlg = document.getElementById("dlg");
  document.getElementById("openBtn").addEventListener("click", () => dlg.showModal());
  // 关闭后读取用户点了哪个按钮
  dlg.addEventListener("close", () => console.log("返回值：", dlg.returnValue));
</script>
```

::: tip 这段代码的取舍
对话框这里仍写了几行 JS（`showModal()`），是因为 `dialog` 的「模态」能力**必须**经 JS 触发；而弹层（`popover`）和折叠（`details`）则**完全不需要 JS**。把「需要模态、需要焦点陷阱」的交给 `dialog`，把「轻量、点外面就关」的交给 `popover`，是现代写法的基本分工。
:::

## 逐块拆解

### ① 折叠：`details` / `summary`

`<details>` 是浏览器内置的「折叠/展开」控件，第一个子元素必须是 `<summary>`（点击区与标题），其余内容默认隐藏。加 `open` 属性即默认展开；给多个 `details` 设同一个 `name`，它们就组成「同一时刻只开一个」的手风琴（2024 起）。详见 [`details` / `summary` 折叠](./guide-line/details-summary)。

### ② 对话框：`dialog`

`<dialog>` 是原生对话框。`dialog.showModal()` 打开**模态**对话框——自动渲染到「顶层」、自动用 `::backdrop` 画遮罩、自动把其余页面 `inert`、自动支持 `Esc` 关闭、自动把焦点收进对话框。`dialog.show()` 则是非模态（不遮挡背景）。详见 [`dialog` 模态对话框与 `inert`](./guide-line/dialog-inert)。

### ③ 弹层：`popover`

给任意元素加 `popover` 属性，再用 `<button popovertarget="...">` 指向它，就得到一个**零 JS** 的弹层：点按钮开合、点外面关闭（light dismiss）、按 `Esc` 关闭、自动渲染到顶层（不必和 `z-index` 搏斗）。详见 [`popover` 与 `command` 调用](./guide-line/popover-command)。

### ④ 焦点与失活

键盘用户靠 `Tab` 在可聚焦元素间移动。`tabindex` 控制谁能聚焦、按什么顺序；`autofocus` 指定打开时聚焦谁；`inert` 把一片区域整体「失活」。这些是交互可访问性的地基。详见 [焦点管理](./guide-line/focus-management)。

## 为什么优先用原生

自己用 `<div>` + 一堆 JS 重写一个对话框，你需要手动：把焦点困在弹层内、`Esc` 关闭、背景失活、加 `role="dialog"` 与 `aria-modal`、退出时把焦点还给触发按钮……原生 `dialog` 把这些**全部内置**。这正是 [HTML 层可访问性](./guide-line/html-a11y) 里 ARIA 第一条规则的精神：

> 凡是有「语义和行为都已内置」的原生 HTML 元素可用，就别去改造一个普通元素再加 ARIA。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[折叠](./guide-line/details-summary)、[对话框与 inert](./guide-line/dialog-inert)、[popover 与 command](./guide-line/popover-command)、[焦点管理](./guide-line/focus-management)、[全局属性](./guide-line/global-attributes)、[可访问性](./guide-line/html-a11y)。
