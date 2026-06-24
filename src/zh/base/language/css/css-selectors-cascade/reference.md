---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 选择器三基石：类型 `p`、类 `.x`、ID `#y`；复合（无空格）＝与，列表（逗号）＝或
- 组合器：后代（空格）、子 `>`、相邻兄弟 `+`、后续兄弟 `~`
- 特异性三列 `ID-CLASS-TYPE`，**逐列从左比**：ID `1-0-0` ≫ 类/属性/伪类 `0-1-0` ≫ 类型/伪元素 `0-0-1`；`*` 与组合器与 `:where()` 记 `0`
- `:is()` / `:not()` / `:has()` 取参数**最高**特异性；`:where()` 恒 `0`
- 层叠四步：**来源与重要性 → 层叠层 → 特异性 → 书写顺序**（前一步分不出才看下一步）
- `!important` 反转来源与层序；动画压普通声明、过渡优先级最高
- `@layer`：普通声明「后声明层 > 先声明层，未分层 > 已分层」；`!important` 全反转
- 全局关键字：`inherit` / `initial` / `unset` / `revert` / `revert-layer`（注意 `initial` ≠ 浏览器默认）
- 现代 Baseline：`:is()` / `:where()`（2021）、`@layer`（2022）、`:has()`（2023）

## 选择器速查表

| 选择器 | 写法 | 命中 | 特异性 |
| --- | --- | --- | --- |
| 通用 | `*` | 所有元素 | `0-0-0` |
| 类型 | `p` | 该标签所有元素 | `0-0-1` |
| 类 | `.card` | 含该类的元素 | `0-1-0` |
| ID | `#hero` | 该 id 元素 | `1-0-0` |
| 属性存在 | `[disabled]` | 含该属性 | `0-1-0` |
| 属性全等 | `[type="text"]` | 值完全等于 | `0-1-0` |
| 属性词含 | `[class~="big"]` | 空格词表含某词 | `0-1-0` |
| 属性前缀 | `[href^="https"]` | 值以…开头 | `0-1-0` |
| 属性后缀 | `[href$=".pdf"]` | 值以…结尾 | `0-1-0` |
| 属性子串 | `[class*="btn-"]` | 值含子串 | `0-1-0` |
| 列表（或） | `h1, h2, .t` | 任一命中 | 各算各的 |
| 复合（与） | `a.btn[href]` | 同时满足 | 各列累加 |
| 后代 | `nav a` | 任意层级后代 | 组合器记 `0` |
| 子 | `ul > li` | 直接子元素 | 组合器记 `0` |
| 相邻兄弟 | `h2 + p` | 紧邻下一个兄弟 | 组合器记 `0` |
| 后续兄弟 | `h2 ~ p` | 之后所有同级 | 组合器记 `0` |

## 伪类 / 伪元素速查

| 名称 | 类型 | 作用 |
| --- | --- | --- |
| `:hover` / `:active` / `:focus` / `:focus-visible` | 状态伪类 | 交互态（优先 `:focus-visible` 画焦点环） |
| `:checked` / `:disabled` / `:required` / `:valid` | 状态伪类 | 表单态 |
| `:target` | 状态伪类 | URL `#锚点` 指向的元素 |
| `:root` | 结构伪类 | 文档根（放 CSS 变量） |
| `:first-child` / `:last-child` / `:only-child` / `:empty` | 结构伪类 | 位置 / 空判定 |
| `:nth-child()` / `:nth-of-type()` | 结构伪类 | `An+B` 公式选序号；`nth-child` 数全部兄弟，`nth-of-type` 数同类 |
| `:is(列表)` | 函数式伪类 | 分组 + 容错；取参数最高特异性 |
| `:where(列表)` | 函数式伪类 | 同 `:is`，但特异性恒 `0` |
| `:not(列表)` | 函数式伪类 | 取反；算参数最高特异性 |
| `:has(相对选择器)` | 函数式伪类 | 父 / 前兄弟选择器；取参数最高特异性 |
| `::before` / `::after` | 伪元素 | 插入虚拟内容（需 `content`） |
| `::first-letter` / `::first-line` | 伪元素 | 首字母 / 首行 |
| `::selection` / `::placeholder` / `::marker` / `::backdrop` | 伪元素 | 选区 / 占位符 / 列表符 / 遮罩 |

## 特异性规则

- **三列计分** `ID-CLASS-TYPE`，每条选择器算出一组三元值，**逐列从左往右比**，左列更大者直接赢——**不进位**（1 个 ID 压过任意多个类）。
- 计 ID 列：`#id`。计 CLASS 列：类、属性、伪类。计 TYPE 列：类型、伪元素。
- 记 `0`：通用 `*`、组合器（`>` `+` `~` 空格）、`:where()`、嵌套 `&`。
- `:is()` / `:not()` / `:has()`：自身记 `0`，但**加入参数列表里最高特异性**那一项。
- 行内 `style=""` 概念上更高（`1-0-0-0`），只有 `!important` 能压。
- `!important` **不算特异性**，属「来源 / 重要性」维度，比特异性更先裁决；两条 `!important` 之间才回到比特异性。
- 全平（同来源、同层、同特异性）时，**后写的赢**。

```css
[type="password"] {
} /* 0-1-0 */
input:focus {
} /* 0-1-1 */
:root #app input:required {
} /* 1-2-1 */
:where(#x) h1 {
} /* 0-0-1（:where 归零，只剩 h1） */
p:not(#id) {
} /* 1-0-1（带上参数里的 #id） */
```

## 级联顺序（完整优先级，低 → 高）

| 档位 | 说明 |
| --- | --- |
| 1 | 浏览器（UA）普通声明 |
| 2 | 用户普通声明 |
| 3 | 作者普通声明：分层样式（先声明层 → 后声明层） |
| 4 | 作者普通声明：未分层样式（高于任何分层普通声明） |
| 5 | 行内 `style`（普通） |
| 6 | **动画 `@keyframes`** |
| 7 | 作者 `!important`：未分层 |
| 8 | 作者 `!important`：分层（后声明层 → **先声明层**，反转） |
| 9 | 用户 `!important` |
| 10 | 浏览器（UA）`!important` |
| 11 | 行内 `style`（`!important`） |
| 12 | **过渡 transition**（最高，连 `!important` 都压） |

> 记忆要点：普通声明「越后越强、未分层最强」；`!important` 一切反转（来源反转、层序反转、分层强于未分层）；动画压普通、过渡封顶。

## 继承与全局关键字

- **可继承属性**（未赋值时取父级计算值）：`color`、`font-*`、`line-height`、`letter-spacing`、`visibility`、`list-style` 等（多为文字排版）。
- **非继承属性**（未赋值时取规范初始值）：`margin`、`padding`、`border`、`width`、`height`、`background` 等（多为盒模型 / 布局）。
- **直接命中永远压过继承**——继承值是最弱的值。

| 关键字 | 取值 | 注意 |
| --- | --- | --- |
| `inherit` | 父元素该属性的计算值 | 让非继承属性也继承父级 |
| `initial` | 该属性在 **CSS 规范**里的初始值 | **不是**浏览器默认！`display: initial` → `inline` 而非 `block` |
| `unset` | 可继承 → 同 `inherit`；非继承 → 同 `initial` | 一键回「自然状态」 |
| `revert` | 回退到更低来源（用户 / UA）的值 | 撤销作者样式、保留浏览器默认外观 |
| `revert-layer` | 回退到上一个 `@layer` 的值 | 撤销本层、露出下层 |

## 级联层（`@layer`）速记

```css
@layer reset, base, theme, utilities; /* 定序：先声明者优先级最低 */

@import url("lib.css") layer(reset); /* 第三方导入到低层 */

@layer base {
  body {
    font: 16px/1.5 system-ui;
  }
}

.btn {
  color: var(--brand);
} /* 未分层 → 普通声明里优先级最高，轻松覆盖分层 */
```

- 层间只比层序、不比特异性；层内照常比特异性。
- 普通声明：后声明层 > 先声明层 > 不分层？错——**未分层最高**；分层中后声明者更高。
- `!important`：层序反转，且分层 > 未分层。
- 嵌套：`@layer a.b { … }`；匿名层 `@layer { … }`（不可再追加）。
- `@import ... layer()` 须在样式表最前。

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 说明 |
| --- | --- | --- |
| `:is()` / `:where()` | ✅ Baseline 广泛可用（2021-01） | 放心用；旧名 `:matches()` / `:any()` 已弃用 |
| `:not()`（选择器列表参数） | ✅ Baseline（2021–2022） | 基础 `:not()` 支持更早 |
| `@layer` 级联层 | ✅ Baseline 广泛可用（2022-03） | 驯服第三方 CSS、组织设计系统的首选 |
| `revert-layer` | ✅ 随 `@layer` 一同可用 | 撤销本层 |
| `:has()` 关系选择器 | ✅ Baseline 新近可用（2023-12） | 父 / 前兄弟选择器；老环境可用 `:is()` 包裹降级 |
| `:nth-child(... of S)` | 🟡 渐进可用 | Selectors L4，较新；按需降级 |

## 权威链接

**标准 / 规范**

- [CSS Cascading and Inheritance Level 5（含层叠层）](https://drafts.csswg.org/css-cascade-5/)
- [Selectors Level 4](https://drafts.csswg.org/selectors/)
- [MDN: CSS 选择器总览](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors) · [`:has`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) · [`:is`](https://developer.mozilla.org/en-US/docs/Web/CSS/:is) · [`:where`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where) · [`:not`](https://developer.mozilla.org/en-US/docs/Web/CSS/:not)
- [MDN: 层叠 Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade) · [特异性 Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) · [级联层 `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)

**课程 / 指南**

- [web.dev: Learn CSS — Selectors](https://web.dev/learn/css/selectors) · [Specificity](https://web.dev/learn/css/specificity) · [The cascade](https://web.dev/learn/css/the-cascade)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- 浏览器 DevTools 的 Elements / Styles 面板：查看命中规则、被覆盖声明带删除线、特异性提示

## 相关页

- [入门](./getting-started) · [选择器家族](./guide-line/selector-families) · [伪类与伪元素](./guide-line/pseudo-classes-elements)
- [特异性计算](./guide-line/specificity) · [层叠与继承](./guide-line/cascade-inheritance)
- [`@layer` 级联层实战](./guide-line/cascade-layers) · [选择器性能与最佳实践](./guide-line/selector-performance)
