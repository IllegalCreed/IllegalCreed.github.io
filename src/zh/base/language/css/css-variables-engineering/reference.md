---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 变量：`--x: 值;`（`--` 开头、大小写敏感）+ `var(--x, 回退)`；默认继承、参与层叠；媒体查询条件里**用不了**
- 换肤：祖先上重定义同名变量（`.dark { --bg }`），整棵子树即时更新，JS 只翻类不碰样式
- `var()` 非法 → **计算值时非法** → 退回继承值 / 初始值（**不是**用回退值，回退只在变量未定义时用）
- `@property --x { syntax; inherits; initial-value }`：加类型解锁**动画**；非 `"*"` 须给 `initial-value`
- 嵌套：`&` 指父选择器；`&.x`/`&:hover` = 复合，`& .x` = 后代；`&__x` **非法**（不能像 Sass 拼字符串）
- 数学：`calc()` 混单位（`+`/`-` 两侧留空格）、`min()` 设上限、`max()` 设下限、`clamp(最小,理想,最大)` 夹区间
- 流式：`font-size: clamp(1rem, 0.5rem + 1.5vw, 1.5rem)`（理想值带 `rem` 保可访问）；`width: min(65ch, 100%)`
- 组织：BEM（`block__element--modifier`）+ `@layer`（层序压特异性）+ `@scope`（圈作用域）
- 调试：CSS 不报错；Styles 面板看删除线、Computed 看最终值、`:hov` 模拟状态、悬停 `var()` 看解析值

## 自定义属性速查

```css
/* 声明：必须 -- 开头，大小写敏感 */
:root {
  --accent: #0066ff;
  --space: 8px;
}

/* 取值 + 回退（回退仅在变量未定义时用） */
.btn {
  background: var(--accent, hotpink);
  padding: calc(var(--space) * 2);
}

/* 换肤：祖先上重定义即整棵子树更新 */
.dark {
  --accent: #58a6ff;
}
```

| 能力 | 写法 | 备注 |
| --- | --- | --- |
| 声明 | `--x: 值;` | `--` 开头，大小写敏感 |
| 取值 | `var(--x)` | 默认继承 |
| 回退 | `var(--x, 默认)` | 仅变量**未定义**时生效 |
| 嵌套回退 | `var(--a, var(--b, #333))` | 降级链 |
| JS 读 | `getComputedStyle(el).getPropertyValue("--x").trim()` | 返回字符串 |
| JS 写 | `el.style.setProperty("--x", v)` | 立即继承生效 |

::: warning 自定义属性两条坑
- 媒体查询的**条件部分用不了** `var()`（`@media (min-width: var(--bp))` 无效）；
- `var()` 值**类型非法**时退回**初始值 / 继承值**，不是用回退值，也不是用同属性上一条声明。
:::

## `@property` 速查

```css
@property --rotation {
  syntax: "<angle>"; /* 必填：类型 */
  inherits: false; /* 必填：是否继承 */
  initial-value: 45deg; /* 非 "*" 时必填，且须计算独立 */
}
```

| `syntax` | 含义 |
| --- | --- |
| `"<color>"` / `"<length>"` / `"<percentage>"` | 颜色 / 长度 / 百分比 |
| `"<length-percentage>"` / `"<number>"` / `"<integer>"` / `"<angle>"` | 长度或百分比 / 数 / 整数 / 角度 |
| `"*"` | 万能（不校验、不可动画，`initial-value` 可省） |
| `"<length> \| <percentage>"` | `\|` 二选一 |
| `"<length>+"` / `"<color>#"` | `+` 空格列表 / `#` 逗号列表 |

- **解锁动画**：注册成 `<color>`/`<angle>`/`<percentage>` 等后，变量才能被 `transition` / `@keyframes` 插值；
- JS 等价：`CSS.registerProperty({ name, syntax, inherits, initialValue })`，且 **JS 注册优先于 CSS**。

## 原生嵌套速查

```css
.card {
  & .title {
    /* = .card .title（后代） */
  }
  &:hover {
    /* = .card:hover（复合） */
  }
  &.featured {
    /* = .card.featured（复合） */
  }
  .sidebar & {
    /* = .sidebar .card（反向） */
  }
  @media (min-width: 40em) {
    /* 可嵌 at 规则 */
  }
}
```

| 写法 | 等价 | 关系 |
| --- | --- | --- |
| `& .x` 或 `.x` | `父 .x` | 后代（自动补空格） |
| `&.x` | `父.x` | 复合（同一元素） |
| `&:hover` | `父:hover` | 复合（状态） |
| `.y &` | `.y 父` | 反向 |
| `p&` | `p.父` | 类型在前合法；`&p` 非法 |

::: warning 与 Sass 的根本区别
原生 `&` 是「父选择器的引用」，**不能字符串拼接**——`&__elem`、`&--mod` 在原生 CSS 里**非法**，必须写完整类名。可嵌套 `@media`/`@container`/`@supports`/`@layer`，但**不含** `@import`。分组父选择器里有 ID 会把整组特异性抬到 ID 高度（`&` 行为同 `:is()`）。
:::

## 数学函数速查

```css
width: calc(100% - 2rem); /* 混合单位（+/- 两侧留空格） */
width: min(20vw, 30rem); /* 取小 = 设上限（封顶） */
height: max(20vh, 20rem); /* 取大 = 设下限（保底） */
font-size: clamp(1rem, 0.5rem + 1.5vw, 1.5rem); /* 夹在区间 + 平滑伸缩 */
```

| 函数 | 语义 | 响应式效果 |
| --- | --- | --- |
| `calc()` | 表达式运算，混合单位 | 固定值 ± 弹性值 |
| `min(a,b)` | 返回最小 | **上限 / 封顶** |
| `max(a,b)` | 返回最大 | **下限 / 保底** |
| `clamp(min,ideal,max)` | `max(min, min(ideal, max))` | 区间内随视口流动 |

> 流式排版口诀：`min()` 封顶、`max()` 保底、`clamp()` 夹中间；`clamp` 理想值混 `rem` 才能在用户缩放时跟随，保证可访问性。

## 组织方法论速查

```css
/* BEM 命名：扁平、低特异性、自带命名空间 */
.card {
}
.card__title {
}
.card--featured {
}

/* @layer：层序压过特异性，先声明的层最弱 */
@layer reset, base, components, utilities;

/* @scope：把样式圈进子树，to 划甜甜圈 */
@scope (.article-body) to (figure) {
  img {
    border: 5px solid black;
  }
}
```

| 工具 | 作用 | 依赖 |
| --- | --- | --- |
| BEM | 类名不打架、特异性恒 `0-1-0`、组件命名空间 | 团队纪律 |
| `@layer` | 层序决定优先级、驯服第三方框架 | 语言机制 |
| `@scope` | 样式不外泄、组件级隔离、作用域邻近裁决 | 语言机制 |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| 自定义属性 `--*` / `var()` | ✅ Baseline 广泛可用（2017-04） | 放心用 |
| `calc()` / `min()` / `max()` / `clamp()` | ✅ Baseline 广泛可用 | 放心用 |
| `@layer` 级联层 | ✅ Baseline 2022（广泛可用） | 放心用 |
| 原生 CSS 嵌套（`&`） | ✅ Baseline 2023（广泛可用） | 放心用；兼容老环境可 PostCSS 展开 |
| `@property` 类型化变量 | 🟡 Baseline 2024（newly available） | 按渐进增强用；动画作锦上添花 |
| `@scope` 作用域 | 🟠 Baseline 2025（newly available，较新） | 渐进增强，关键布局别只靠它，留 BEM 兜底 |

## 权威链接

**标准 / 规范**

- [MDN: 自定义属性 `--*`](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) · [`var()`](https://developer.mozilla.org/en-US/docs/Web/CSS/var) · [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting) · [`@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) · [`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- [MDN: `calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) · [`clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) · [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) · [`max()`](https://developer.mozilla.org/en-US/docs/Web/CSS/max)

**课程 / 指南**

- [web.dev: Learn CSS — Custom properties](https://web.dev/learn/css/custom-properties) · [Functions](https://web.dev/learn/css/functions) · [Nesting](https://web.dev/learn/css/nesting)
- [web.dev: At-rules（含 `@layer` / `@scope`）](https://web.dev/learn/css/at-rules)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Chrome DevTools: View and change CSS](https://developer.chrome.com/docs/devtools/css)

## 相关页

- [入门](./getting-started) · [自定义属性与 var()](./guide-line/custom-properties) · [`@property` 类型化变量](./guide-line/property-typed)
- [原生 CSS 嵌套](./guide-line/nesting) · [数学函数与流式排版](./guide-line/math-functions)
- [组织方法论：BEM·层·@scope](./guide-line/css-methodology) · [CSS 调试与 DevTools 工作流](./guide-line/css-debugging)
