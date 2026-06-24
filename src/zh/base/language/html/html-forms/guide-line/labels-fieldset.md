---
layout: doc
outline: [2, 3]
---

# `label` / `fieldset` 与可访问关联

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- **每个表单控件都必须有 `<label>`**——这是无障碍底线，不是可选项
- 显式关联（首选）：`<label for="id">` + 控件 `id`，二者值相同
- 隐式关联：把控件直接**包进** `<label>` 内部，可省 `for` / `id`
- 点击 `<label>` 会聚焦 / 激活其控件，**放大点击命中区**，对触屏与运动障碍用户尤其友好
- 可被标签的元素：`<button>`、`<input>`（除 `hidden`）、`<meter>`、`<output>`、`<progress>`、`<select>`、`<textarea>`
- 一个 `<label>` 只关联**一个**控件；但一个控件可被多个 `<label>` 关联（共享 `for`）
- `<fieldset>` 给一组相关控件分组，`<legend>`（首个子元素）是这组的标题
- 单选 / 复选组**必须**用 `fieldset` + `legend`：屏幕阅读器会把 legend 连同每个选项一起读出
- `<fieldset disabled>` 一键禁用组内所有控件（`<legend>` 内的除外）
- 别把链接、按钮等交互元素塞进 `<label>`

## `<label>`：每个控件的名字

表单控件本身（一个输入框、一个复选框）对屏幕阅读器来说是「没有名字的东西」。`<label>` 的职责就是给它一个**程序化关联**的名字，让所有用户都知道这里该填什么。

### 显式关联：`for` + `id`（首选）

```html
<label for="email">邮箱</label>
<input type="email" id="email" name="email" />
```

`<label>` 的 `for` 属性指向控件的 `id`，二者值必须相同。这是**最推荐**的写法：标签和控件在 DOM 里可以分开放（方便用各种布局），关联依然牢固，且对外部工具、组件化框架最友好。

::: tip for 的 JS 反射名是 htmlFor
因为 `for` 是 JavaScript 保留字，在脚本里读写这个属性要用 `labelEl.htmlFor`，而不是 `labelEl.for`。
:::

### 隐式关联：包裹控件

```html
<label>
  邮箱
  <input type="email" name="email" />
</label>
```

把控件直接放进 `<label>` 内部，也能建立关联，且可省去 `for` / `id`。它在「标签紧贴控件」的简单场景（尤其复选框、单选框）很方便。两种方式可叠加使用以求最大兼容。

### 点击标签 = 点击控件

`<label>` 不只是「读屏友好」，它还带来一个所有用户都受益的交互：**点击 / 轻触标签文字，焦点会落到（或激活）关联的控件**。对复选框、单选框来说，这等于把可点击区域从一个小方块扩大到「方块 + 整段文字」——对触屏和手部不便的用户极其重要。

### 哪些元素能被标签

只有这些「可被标签元素」能与 `<label>` 关联：

`<button>`、`<input>`（**`type="hidden"` 除外**）、`<meter>`、`<output>`、`<progress>`、`<select>`、`<textarea>`。

普通的 `<div>` / `<span>` 不行——如果你用非语义元素自造控件，得靠 ARIA（如 `aria-labelledby`）补上关联。

::: warning 别往 label 里塞交互元素
不要在 `<label>` 内部放链接、按钮、标题等交互 / 导航元素。例如「我已阅读并同意《条款》」里的《条款》链接若包在 label 内，会干扰辅助技术解析。正确做法是把链接**移到 label 外面**，label 内只留纯文本：

```html
<label for="agree">
  <input type="checkbox" id="agree" name="agree" />
  我已阅读并同意服务条款
</label>
<a href="/terms">阅读服务条款</a>
```
:::

## `<fieldset>` 与 `<legend>`：给一组控件分组

当几个控件在语义上属于一组（最典型的是单选 / 复选组），用 `<fieldset>` 把它们框起来，并用 `<legend>` 作为这一组的标题：

```html
<fieldset>
  <legend>选择套餐</legend>

  <label><input type="radio" name="plan" value="free" /> 免费版</label>
  <label><input type="radio" name="plan" value="pro" /> 专业版</label>
  <label><input type="radio" name="plan" value="team" /> 团队版</label>
</fieldset>
```

`<legend>` 必须是 `<fieldset>` 的**第一个子元素**，它渲染在边框上沿，作为这组控件的标题。

### 为什么单选 / 复选组离不开它

单看 `<label>`，屏幕阅读器读到的是「免费版 单选按钮」「专业版 单选按钮」——用户听不出这三个选项**属于同一个问题**。加上 `fieldset` + `legend` 后，辅助技术会把 legend 的「选择套餐」**连同每个选项一起播报**：「选择套餐，免费版，单选按钮，三选一」。这才让「这是一组、要从中选一个」的语义完整。

> 经验法则：**凡是单选按钮组、相关复选框组，都应当包在 `<fieldset>` 里并配 `<legend>`。**

### 一键禁用整组：`disabled`

`<fieldset>` 的 `disabled` 是布尔属性，加上后会**禁用组内所有后代控件**——它们变灰、不可编辑、不提交、不接收事件：

```html
<fieldset disabled>
  <legend>账号信息（暂不可改）</legend>
  <label for="u">用户名</label>
  <input type="text" id="u" value="alice" />
</fieldset>
```

这对「按步骤逐步解锁表单区块」非常方便——切换一个属性就能开关一整组。注意：**`<legend>` 内部的控件不受 `disabled` 影响**（这样你仍能在标题区放一个「编辑」开关）。

### `<fieldset>` 的其余属性与嵌套

- `form`：用 `<form>` 的 `id` 把 fieldset 关联到表单（即使没有嵌套在表单里）；
- `name`：这组的名字（用于脚本，不直接进提交数据）；
- **可嵌套**：复杂表单里 `<fieldset>` 内再套 `<fieldset>` 是标准做法，用于「大区块下分小区块」。

## 小结

`<label>` 给每个控件一个名字（首选 `for` + `id`），`<fieldset>` + `<legend>` 给一组控件一个共同标题——这两件事让表单对屏幕阅读器、对触屏用户都清清楚楚。下一页看看 `<input>` 之外的那些选择类控件：[选择类控件](./select-controls)。
