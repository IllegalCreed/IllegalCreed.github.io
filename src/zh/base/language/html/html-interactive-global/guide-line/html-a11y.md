---
layout: doc
outline: [2, 3]
---

# HTML 层可访问性

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- **ARIA 第一条规则**：凡是有「语义和行为都已内置」的原生 HTML 元素可用，就别去改造一个普通元素再加 ARIA
- **隐式角色**：大多数语义元素自带 ARIA 角色——`<button>`→`button`、`<a href>`→`link`、`<nav>`→`navigation`、`<main>`→`main`，无需再写 `role`；`role` 仅在原生无对应元素或支持不足时才用
- 可访问名（accessible name）：每个交互元素都得有；来源优先级大致是 `aria-labelledby` > `aria-label` > 原生 `<label>` / 内容文本
- `aria-label`：直接给一个不可见的可访问名（如纯图标按钮）；`aria-labelledby`：用其它元素的 `id` 作名字
- `aria-describedby`：补充描述（如输入框的格式说明）；`aria-hidden="true"`：从可访问性树移除（装饰性图标）
- `aria-expanded`：折叠/展开控件的开合状态；`aria-current`：当前项（`page` / `step`…）；`aria-live`：动态区域播报（`polite` / `assertive`）
- 「**No ARIA is better than bad ARIA**」——错误的 ARIA 比没有更糟
- 五条 ARIA 规则：①优先原生 ②别改原生语义 ③所有交互 ARIA 控件须键盘可用 ④别在可聚焦元素上用 `aria-hidden="true"` / `role="presentation"` ⑤所有交互元素须有可访问名
- ARIA in HTML 规范：规定**哪些角色/属性允许加在哪些 HTML 元素上**，别乱配
- 别忘了：`<html lang>`、`alt`、`<label>`、标题层级、键盘可达——这些「原生可访问性」比 ARIA 更基础

## 先讲清：可访问性树与 ARIA

浏览器在渲染 DOM 的同时，会构建一棵**可访问性树**（accessibility tree）：把每个元素映射为「角色（role）+ 名字（name）+ 状态（state）」，供读屏器等辅助技术读取。例如一个 `<button>Save</button>` 在可访问性树里是「角色=button，名字=Save」。

**ARIA**（Accessible Rich Internet Applications）是一组 `role` 与 `aria-*` 属性，作用是**修正或补充**这棵树——当原生 HTML 表达不了某种语义时，用 ARIA 补上。关键认知：**ARIA 只改变「辅助技术怎么理解」，不改变任何视觉、不添加任何行为**（不会让 `<div role="button">` 自动能按回车、能聚焦）。

## ARIA 第一条规则：能用原生就别用 ARIA

这是整个 HTML 可访问性最重要的一句话，请原样记住：

> 如果你能用一个「语义和行为都已内置」的原生 HTML 元素或属性，就用它；不要去改造（re-purpose）一个普通元素、再加 ARIA 角色 / 状态 / 属性来让它「变得可访问」。

对照看就明白为什么：

```html
<!-- ❌ 用 div 硬搓按钮：要手动补 role、tabindex、键盘事件，极易漏 -->
<div role="button" tabindex="0" onclick="save()" onkeydown="…">保存</div>

<!-- ✅ 原生 button：role=button、可聚焦、可按 Enter/Space、可读屏，全都自带 -->
<button onclick="save()">保存</button>
```

原生 `<button>` 自带：可聚焦、`Tab` 可达、`Enter` / `Space` 触发、`role="button"`、`disabled` 支持、表单提交……这些用 `div` 全得自己补，补全的工作量大且容易出错。本叶前面讲的 `<details>` / `<dialog>` / `popover` 同理——优先用原生，正是「写得更少、做得更对」。

## 隐式角色：大多数元素自带语义

正因为原生元素自带语义，**绝大多数情况你根本不需要写 `role`**：

| HTML 元素 | 隐式 ARIA 角色 |
| --- | --- |
| `<button>` | `button` |
| `<a href="…">` | `link` |
| `<nav>` | `navigation` |
| `<main>` | `main` |
| `<header>`（文档级） | `banner` |
| `<footer>`（文档级） | `contentinfo` |
| `<aside>` | `complementary` |
| `<article>` | `article` |
| `<input type="checkbox">` | `checkbox` |
| `<ul>` / `<li>` | `list` / `listitem` |

给这些元素再加同名 `role`（如 `<nav role="navigation">`）是**多余**的；加**不同**的 `role` 去覆盖（如 `<button role="link">`）则通常是**错误**的——会让语义自相矛盾。

## 可访问名（accessible name）

**每个交互元素都必须有「可访问名」**——读屏器要靠它告诉用户「这是什么」。一个只有图标、没有文字的按钮，读屏器读出来就是「按钮」，毫无信息。给它名字的几种方式（大致优先级从高到低）：

```html
<!-- ① aria-labelledby：引用其它元素的 id 作为名字（可拼多个） -->
<h2 id="dlgTitle">删除确认</h2>
<dialog aria-labelledby="dlgTitle">…</dialog>

<!-- ② aria-label：直接给一个不可见的名字（纯图标按钮的标配） -->
<button aria-label="关闭"><svg>…</svg></button>

<!-- ③ 原生关联 / 内容文本：最优先考虑 -->
<label for="email">邮箱</label>
<input id="email" />
<button>提交</button> <!-- 内容文本「提交」即名字 -->
```

经验：**能用可见的原生 `<label>` 或元素文本，就别用 `aria-label`**——可见文本对所有人都有帮助，而 `aria-label` 只有读屏器能感知，且不被翻译工具处理。

## 常用 `aria-*` 属性

| 属性 | 作用 | 典型场景 |
| --- | --- | --- |
| `aria-label` | 直接给可访问名 | 纯图标按钮 |
| `aria-labelledby` | 用其它元素 `id` 作名字 | 对话框标题、复杂组件 |
| `aria-describedby` | 补充说明（在名字之外） | 输入框的格式/错误提示 |
| `aria-hidden="true"` | 从可访问性树移除 | 纯装饰图标（读屏器应忽略） |
| `aria-expanded` | 折叠控件的开/合 | 自定义下拉、菜单按钮 |
| `aria-current` | 当前项 | 导航里的当前页 `aria-current="page"` |
| `aria-live` | 动态内容播报 | 异步结果、Toast（`polite` / `assertive`） |
| `aria-pressed` | 切换按钮的按下态 | 工具栏的「加粗」开关 |

注意 `aria-hidden="true"` **不要**加在**可聚焦**元素上——那会造成「键盘能聚焦到它、读屏器却读不到」的割裂。

## ARIA 的其余四条规则

除「优先原生」外，还有四条（合称 ARIA 五律）：

1. **不要改变原生语义**——别写 `<h2 role="button">`，而应在 `<h2>` 里放 `<button>`；
2. **所有交互 ARIA 控件都必须键盘可用**——加了 `role="button"` 的 `div`，就得自己补 `tabindex="0"` + `Enter`/`Space` 处理；
3. **不要在可聚焦元素上用 `role="presentation"` 或 `aria-hidden="true"`**——会让它从可访问性树消失却仍能被 `Tab` 到；
4. **所有交互元素都必须有可访问名**——见上一节。

加上第一条「优先原生」，这五条就是日常写 ARIA 的全部底线。

## 「No ARIA is better than bad ARIA」

ARIA 用错比不用更糟：一个 `role` 写错、一个 `aria-*` 状态忘了随交互更新，读屏器就会告诉用户**错误**的信息（明明展开了却报「折叠」、明明是链接却报「按钮」）。统计也显示，带 ARIA 的页面可访问性问题反而常更多——往往是误用所致。所以：**没把握就先别加 ARIA**，先把原生 HTML、`alt`、`<label>`、标题层级、键盘可达这些「基本功」做对。

## ARIA in HTML 规范

「ARIA in HTML」是一份 W3C 规范，规定了**哪些 ARIA 角色和属性允许加在哪些 HTML 元素上**——不是任意组合都合法。例如：

- 给 `<a href>` 加 `role="button"` 是允许的（虽然多数时候不该这么做）；
- 但很多元素只允许特定子集的角色，乱加（如给 `<ul>` 配一个矛盾的角色）属于无效用法，浏览器可能忽略或行为不可预期。

实务上你不必背全表——只要遵守「优先原生 + 五条规则」，再在拿不准时查 MDN 对应元素页的「ARIA」小节即可。

## 别忽视「原生可访问性」

ARIA 之外，这些**原生**手段才是可访问性的地基，且往往更有效：

- `<html lang>`：声明语言（影响读屏发音）；
- `<img alt>`：替代文本；装饰图用 `alt=""`；
- `<label for>`：表单控件关联标签；
- 正确的**标题层级**（`<h1>`→`<h2>`…，不跳级）；
- **键盘可达**：所有功能都能只用键盘完成。

把这些做对，可访问性已经成功大半——ARIA 只是「原生表达不了时」的补充工具。

## 小结

HTML 层可访问性的核心就一句：**能用原生就别用 ARIA**，原生元素的隐式角色与内置行为已覆盖绝大多数需求；ARIA 是补充而非替代，且「坏 ARIA 比没有更糟」。把本叶的 `details` / `dialog` / `popover` 与全局属性都按「优先原生、补足可访问名、键盘可达」来用，交互就既现代又可访问。完整速查见 [参考](../reference)。
