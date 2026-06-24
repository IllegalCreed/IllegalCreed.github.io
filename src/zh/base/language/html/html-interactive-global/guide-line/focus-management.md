---
layout: doc
outline: [2, 3]
---

# 焦点管理

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 默认可聚焦：交互元素天生可用 `Tab` 聚焦——`<a href>`、`<button>`、`<input>` / `<select>` / `<textarea>`、`contenteditable` 元素；其余元素默认不可聚焦
- `tabindex="0"`：把元素加入**自然 Tab 序**（按 DOM 顺序），用于自定义交互组件
- `tabindex="-1"`：可用 `.focus()` **脚本聚焦**或点击聚焦，但**不进 Tab 序**（键盘 `Tab` 跳过）
- `tabindex="正数"`：**反模式**——制造一条优先 Tab 序，极难维护、易乱，**不要用**
- `autofocus`：布尔属性，页面载入（或 `<dialog>` 打开）时自动聚焦该元素；滥用会让用户错过前文，慎用
- `inert`：让一片区域整体退出 Tab 序并移出可访问性树（见 [dialog 页](./dialog-inert)）
- 焦点顺序铁律：**Tab 顺序应与视觉顺序一致**＝ DOM 顺序；别用 CSS（flex `order` / grid / 绝对定位）打乱视觉顺序却不改 DOM
- `:focus`：任何方式获焦都命中；`:focus-visible`：**仅在该让用户看到焦点时**命中（主要是键盘）——焦点环优先用它；`:focus-within`：自身或后代获焦时高亮父元素（整组表单行）
- 永远要有可见焦点指示；`element.focus()` 编程聚焦；`document.activeElement` 查当前焦点
- 跳转链接（skip link）：页首一个「跳到主内容」的链接，平时藏、获焦时显，方便键盘用户跳过导航

## 谁默认可聚焦

键盘用户靠 `Tab` / `Shift+Tab` 在「可聚焦元素」间移动。**默认可聚焦**的是交互元素：

- 链接 `<a href>`（注意：没有 `href` 的 `<a>` 不可聚焦）；
- 表单控件 `<button>` / `<input>` / `<select>` / `<textarea>`；
- `contenteditable` 元素。

其余元素（`<div>` / `<span>` / `<p>`…）默认**不可聚焦**——它们是「惰性」的。想让它们参与键盘交互，就得靠 `tabindex`。

## `tabindex`：三类取值

`tabindex` 是全局属性，按取值分三类，含义截然不同：

```html
<!-- ① tabindex="0"：加入自然 Tab 序，按 DOM 位置排 -->
<div role="button" tabindex="0">我是自定义按钮，可被 Tab 聚焦</div>

<!-- ② tabindex="-1"：可脚本/点击聚焦，但 Tab 跳过 -->
<section id="results" tabindex="-1">搜索结果（提交后用 JS 聚焦到这里）</section>

<!-- ③ tabindex="1" 及以上：反模式，制造优先序，别用 -->
<input tabindex="1" />
```

| 取值 | 可 `Tab` 到？ | 可 `.focus()` / 点击聚焦？ | 用途 |
| --- | --- | --- | --- |
| `0` | 是（按 DOM 顺序） | 是 | 让自定义组件可键盘聚焦 |
| `-1` | 否 | 是 | 仅供脚本聚焦的目标（如「跳到结果区」） |
| 正数（`1`+） | 是（按数字优先序） | 是 | ⚠️ 反模式，避免 |

### 为什么正数是反模式

`tabindex="1"`、`tabindex="2"`…会创建一条**凌驾于 DOM 顺序之上**的优先 Tab 序：浏览器先按数字从小到大跳完所有正数元素，再回到 `tabindex="0"` 和默认可聚焦的元素。这带来两个问题：

- **极难维护**：只要新增一个元素，就可能要重排一长串数字；漏一个就让焦点「跳来跳去」；
- **顺序错乱**：正数元素无论在页面什么位置都被优先聚焦，焦点轨迹与视觉、与 DOM 全脱节。

正确做法永远是：**用 DOM 顺序表达 Tab 顺序**，只在 `0` / `-1` 间选择，把正数 `tabindex` 当作「不存在的选项」。

## `autofocus`：自动聚焦

`autofocus` 是布尔属性，让元素在**页面载入**（或所在 `<dialog>` **打开**）时自动获得焦点：

```html
<input name="q" autofocus />
```

它确实方便（搜索页、登录页让光标直接落在输入框），但**容易帮倒忙**：

- 它会把页面**滚动**到该元素，用户可能因此**错过**上方的标题、说明或重要内容；
- 它会**跳过**焦点序中更靠前的元素，打乱预期。

经验法则：**仅在「这个元素显然就是用户来此唯一要做的事」时用**（如纯搜索框页面）。在 `<dialog>` 内则相对安全——对话框本就要求用户立即处理，用 `autofocus` 指定首个落点（如「确定」按钮）是推荐做法。

## 焦点顺序：DOM 即顺序

::: warning 别用 CSS 打乱焦点顺序
焦点导航顺序**默认等于 DOM 源码顺序**，而它也应当**等于视觉顺序**。但 CSS 的 flexbox `order`、grid 布局、`position` 绝对定位、多列等，能让元素**看起来**换了位置却**不改 DOM**。结果：键盘焦点按 DOM 跳，眼睛看到的却是另一个顺序，二者错位，键盘用户彻底迷失。

务必保证：**视觉顺序 = DOM 顺序**。在所有视口尺寸下都用 `Tab` / `Shift+Tab` 实测一遍，别用 CSS 重排可聚焦元素的视觉位置。
:::

## `:focus` vs `:focus-visible`

给焦点元素加可见样式是**无障碍硬要求**——键盘用户必须随时知道「焦点在哪」。但用哪个伪类有讲究：

```css
/* ❌ 只用 :focus：鼠标点击按钮后也会留下焦点环，常被认为「碍眼」 */
button:focus {
  outline: 2px solid royalblue;
}

/* ✅ 优先 :focus-visible：仅在「该提示焦点」时显示环（主要是键盘聚焦） */
button:focus-visible {
  outline: 2px solid royalblue;
  outline-offset: 2px;
}

/* 兜底：去掉默认 outline 后，务必用 :focus-visible 补回，别让焦点「裸奔」 */
button:focus {
  outline: none;
}
```

- **`:focus`**：只要元素获焦就命中，**无论**焦点来自键盘、鼠标点击还是脚本；
- **`:focus-visible`**：浏览器**启发式判断「此刻应当让用户看到焦点」时**才命中——典型就是键盘 `Tab` 聚焦时显示、鼠标点击按钮时不显示。

这正好满足「键盘用户要焦点环、鼠标用户不想要」的诉求。`:focus-visible` 自 **2022 年 3 月**起 Baseline 广泛可用，可放心使用。

### `:focus-within`

`:focus-within` 在**自身或任意后代**获焦时命中元素，常用于高亮「当前正在填的整行/整组」：

```css
.form-row:focus-within {
  background: var(--row-active);
}
```

## 编程式焦点

- `element.focus()`：把焦点移到某元素（浏览器会把它滚动进视口）；想聚焦一个非交互容器（如「搜索结果」区供读屏器朗读），给它 `tabindex="-1"` 再 `.focus()`；
- `document.activeElement`：只读，返回当前获焦元素；
- 慎用 `element.focus({ preventScroll: true })`——聚焦到不可见内容会让用户「焦点丢失」。

## 跳转链接（skip link）

页面顶部一个「跳到主内容」链接，平时视觉隐藏、获得焦点时显现，让键盘用户一键越过冗长的导航：

```html
<a href="#main" class="skip-link">跳到主内容</a>
<!-- … 导航 … -->
<main id="main">…</main>
```

```css
.skip-link {
  position: absolute;
  left: -9999px; /* 平时移出视口 */
}
.skip-link:focus {
  left: 1rem;
  top: 1rem; /* 获焦时显现 */
}
```

注意：skip link 这种「获焦即可见」的内容**不要**设为 `inert`——否则它永远聚焦不到、也就失去了意义。

## 小结

焦点是键盘可访问性的命脉：用 `tabindex` 的 `0` / `-1`（远离正数）控制可聚焦性、让 DOM 顺序 = 视觉顺序、用 `:focus-visible` 给键盘用户清晰的焦点环。这些行为很多由全局属性驱动——下一页系统盘点 [全局属性精要](./global-attributes)。
