---
layout: doc
outline: [2, 3]
---

# 全局属性精要

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 全局属性 = **对所有 HTML 元素都生效**的属性，无需逐元素声明；标识与样式：`id`（全文唯一）、`class`（空格分隔，多类）
- 自定义数据：`data-*` → JS 用 `element.dataset.xxx`（连字符转驼峰）读写
- 隐藏：`hidden`（布尔，等于 `display:none`）；`hidden="until-found"` 隐藏但「页内查找」可命中并自动展开
- 文本与语言：`title`（提示气泡）、`lang`（BCP 47 语言）、`dir`（`ltr` / `rtl` / `auto`）、`translate`（`yes` / `no`）、`spellcheck`
- 可编辑：`contenteditable`（`true` / `false` / `plaintext-only` 纯文本）；`draggable`（`true` / `false`，配拖放 API）
- 移动键盘：`inputmode`（`numeric` / `tel` / `email` / `url` / `decimal` / `search` / `text` / `none`）、`enterkeyhint`（回车键文案：`done` / `go` / `next` / `search` / `send`…）
- 交互与焦点：`tabindex`、`autofocus`、`inert`、`accesskey`（键盘快捷键）、`popover`
- 可访问性：`role`、`aria-*`（见 [HTML 层可访问性](./html-a11y)）
- 其它：`autocapitalize`、`writingsuggestions`（写作建议开关，较新）、`is`（自定义内置元素）、`nonce`（CSP）、`slot` / `part` / `exportparts`（Shadow DOM）、`itemscope` 等（微数据）
- Baseline：`inert` 2023、`popover` 2025、`hidden="until-found"` / `contenteditable="plaintext-only"` 已广泛可用；`writingsuggestions` 较新

## 什么是「全局属性」

全局属性是**可以加在任何 HTML 元素上**的一组属性——不像 `href` 只属于 `<a>`、`src` 只属于 `<img>`，全局属性对 `<div>`、`<button>`、`<section>`…一视同仁。下面按用途分组讲常用的那些。

## 标识与样式：`id` / `class`

```html
<section id="intro" class="card card--lg">…</section>
```

- **`id`**：元素的唯一标识，**全文档不可重复**。用于 URL 片段（`#intro`）、`<label for>`、`aria-labelledby`、JS `getElementById`、CSS `#intro` 选择器。
- **`class`**：空格分隔的类名列表（可多个），是 CSS 与 JS（`classList`）最常用的钩子。

## 自定义数据：`data-*`

`data-*` 让你在元素上挂任意自定义数据，JS 通过 `dataset` 读写（属性名的连字符自动转驼峰）：

```html
<li data-user-id="42" data-role="admin">Alice</li>

<script>
  const li = document.querySelector("li");
  li.dataset.userId; // "42"
  li.dataset.role = "editor"; // 写回 data-role="editor"
</script>
```

适合「把少量状态/配置存在 DOM 上」，但别滥用它存大量数据或替代真正的数据层。

## 隐藏：`hidden`

```html
<div hidden>暂时不显示</div>
<section hidden="until-found">折叠的长文（Ctrl+F 能搜到并自动展开）</section>
```

- `hidden`（布尔）等价于 `display: none`——元素不渲染、不占位、不可交互；
- **`hidden="until-found"`**：元素**视觉上隐藏**，但浏览器「页内查找」（Ctrl/Cmd+F）能**搜到其中文字并自动把它显示出来**（同时触发 `beforematch` 事件）。适合「默认折叠但希望可被搜索命中」的内容。该值已广泛可用。

## 文本与语言：`title` / `lang` / `dir` / `translate` / `spellcheck`

```html
<abbr title="超文本标记语言">HTML</abbr>
<p lang="fr">Bonjour</p>
<html dir="rtl">
<code translate="no">const x = 1;</code>
<textarea spellcheck="false"></textarea>
```

- **`title`**：悬停提示气泡（也会被读屏器读出）；但不要把关键信息只放 `title`——移动端无悬停、可访问性弱。
- **`lang`**：BCP 47 语言标签（`zh-CN` / `en-US` / `ar`），影响朗读发音、断词、字体匹配、翻译。
- **`dir`**：书写方向，`ltr`（默认）/ `rtl`（阿拉伯语、希伯来语）/ `auto`（由内容首个强方向字符推断，适合用户生成内容）。
- **`translate`**：`yes`（默认，可翻译）/ `no`（翻译工具应跳过，适合代码、品牌名、专有名词）。
- **`spellcheck`**：`true` / `false`，提示是否对可编辑内容做拼写检查。

## 可编辑与拖放：`contenteditable` / `draggable`

```html
<div contenteditable="true">这块可富文本编辑</div>
<div contenteditable="plaintext-only">这块只能输入纯文本</div>
<img src="card.png" draggable="true" alt="可拖拽卡片" />
```

- **`contenteditable`**：`true`（可富文本编辑）/ `false`（不可编辑）/ `plaintext-only`（**仅纯文本**，禁用加粗等富格式，已广泛可用）。注意它是枚举属性，空字符串等价于 `true`。
- **`draggable`**：`true` / `false`，配合 HTML 拖放 API 使用。

## 移动端虚拟键盘：`inputmode` / `enterkeyhint`

这两个属性在移动端体验上极有用——它们不改变校验，只**优化弹出的虚拟键盘**：

```html
<!-- 输手机号：直接弹数字键盘；回车键显示「发送」 -->
<input type="text" inputmode="tel" enterkeyhint="send" />

<!-- 输验证码：纯数字键盘 -->
<input inputmode="numeric" />
```

- **`inputmode`** 取值：`none`、`text`、`decimal`、`numeric`、`tel`、`search`、`email`、`url`——决定弹哪种键盘（数字盘 / 带 `@` 的邮箱盘 / 带 `.com` 的网址盘…）。
- **`enterkeyhint`** 取值：`enter`、`done`、`go`、`next`、`previous`、`search`、`send`——决定回车键上显示的**文案/图标**，给用户「按下会发生什么」的预期。

## 交互与焦点：`tabindex` / `autofocus` / `inert` / `accesskey` / `popover`

这些已在前面各页详述，此处汇总它们都是全局属性：

- **`tabindex`** / **`autofocus`** / **`inert`**：焦点与失活，见 [焦点管理](./focus-management) 与 [dialog 页](./dialog-inert)；
- **`popover`**：把元素变成弹层，见 [popover 页](./popover-command)；
- **`accesskey`**：声明键盘快捷键（如 `accesskey="s"`，多数浏览器用 `Alt+S` / `Alt+Shift+S` 触发）。它存在已久但**坑多**：易与浏览器/读屏器快捷键冲突、不同平台触发键不一、难以发现，实际项目慎用。

## 可访问性与组件化：`role` / `aria-*` / `is` / `slot` / `part`

- **`role`** 与 **`aria-*`**：ARIA 语义，单独成页讲，见 [HTML 层可访问性](./html-a11y)；
- **`is`**：让普通元素表现为「自定义内置元素」（Web Components 的 customized built-in，如 `<button is="my-button">`）；
- **`slot`** / **`part`** / **`exportparts`**：Shadow DOM 相关——`slot` 把光 DOM 节点投影到具名插槽，`part` 暴露内部节点供外部 `::part()` 选择器定制样式。

## 其它常见全局属性

| 属性 | 作用 |
| --- | --- |
| `autocapitalize` | 移动端输入时的自动大写策略（`none` / `sentences` / `words` / `characters`） |
| `writingsuggestions` | 是否启用浏览器「写作建议」（`true` / `false`，**较新**，不支持则忽略） |
| `nonce` | CSP 的一次性随机串，用于放行内联 `<script>` / `<style>` |
| `itemscope` / `itemtype` / `itemprop` / `itemid` / `itemref` | 微数据（Microdata），向页面嵌入 schema.org 结构化数据 |
| `virtualkeyboardpolicy` | 控制虚拟键盘是否随聚焦自动弹出（`auto` / `manual`） |

## 小结

全局属性是「所有元素通用」的工具箱：`id` / `class` / `data-*` 管标识与数据，`hidden` / `contenteditable` / `draggable` 管状态，`inputmode` / `enterkeyhint` 管移动键盘，`tabindex` / `inert` / `popover` 管交互。其中最关乎可访问性的 `role` / `aria-*` 值得单独深入——下一页 [HTML 层可访问性](./html-a11y)。
