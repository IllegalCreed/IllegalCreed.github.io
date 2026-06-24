---
layout: doc
outline: [2, 3]
---

# 媒体查询与 range 语法

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 语法骨架：`@media <类型> and (<特征>) { 规则 }`，类型可省（默认 `all`）
- 三种类型：`all`（默认）、`screen`（屏幕）、`print`（打印 / 打印预览）；其余类型已废弃
- 现代 range 语法：`@media (width >= 600px)` 等价 `(min-width: 600px)`，运算符 `<` `<=` `>` `>=` `=`
- 双端区间：`@media (400px <= width <= 700px)` 一行写出闭区间（替代 `min-` + `max-` 两段）
- 操作符：`and`（全真）、`,` 或 `or`（任一真）、`not`（取反整条）、`only`（屏蔽老浏览器，须带类型）
- 常用特征：`width` / `height` / `aspect-ratio` / `orientation`（portrait/landscape）/ `resolution`
- 交互特征：`hover`（hover/none）、`pointer`（fine/coarse/none）、`any-hover` / `any-pointer`
- 嵌套：媒体查询可嵌入 `@supports`、CSS 嵌套语法内，也可被它们嵌套
- 断点单位：优先 `em` / `rem`（跟随用户字号），裸 `px` 不随用户缩放
- Baseline：`@media` 核心自 2015 广泛可用；range 语法自 2023 起 Baseline 广泛可用

## 媒体查询的结构

一条媒体查询由「媒体类型 + 媒体特征 + 逻辑操作符」三部分拼成，命中时其中的规则才生效：

```css
@media screen and (width >= 900px) {
  article {
    padding: 1rem 3rem;
  }
}
```

- **媒体类型**：`screen`（屏幕）、`print`（打印）、`all`（全部，默认）。省略类型时即 `all`。Level 4 起 `tv`、`handheld`、`projection` 等类型全部废弃，不要再用。
- **媒体特征**：放在括号里的条件，如 `(width >= 900px)`、`(orientation: landscape)`，**必须带括号**。
- **逻辑操作符**：`and`、`not`、`only` 与逗号，把多个条件组合起来。

## 现代 range 语法

这是本页的重点。Media Queries Level 4 引入了**比较运算符**，让宽高这类「范围型」特征可以直接写区间，比 `min-width` / `max-width` 直观得多：

```css
/* 旧写法：min-/max- 前缀 */
@media (min-width: 600px) { /* 视口 ≥ 600px */ }
@media (max-width: 599px) { /* 视口 ≤ 599px */ }

/* 现代 range 语法：比较运算符 */
@media (width >= 600px) { /* 视口 ≥ 600px */ }
@media (width < 600px)  { /* 视口 < 600px */ }
```

最大的便利是**双端闭区间**——过去要 `and` 拼两段，现在一行搞定：

```css
/* 旧写法 */
@media (min-width: 400px) and (max-width: 700px) { /* … */ }

/* 现代写法：一行闭区间 */
@media (400px <= width <= 700px) { /* … */ }
```

range 语法与传统写法的对照如下：

| range 语法 | 传统等价 |
| --- | --- |
| `(width >= 900px)` | `(min-width: 900px)` |
| `(width > 900px)` | `(min-width: 901px)` |
| `(width <= 500px)` | `(max-width: 500px)` |
| `(width < 500px)` | `(max-width: 499px)` |
| `(400px <= width <= 700px)` | `(min-width: 400px) and (max-width: 700px)` |

::: tip 注意 `>` 与 `>=` 不是同一回事
`(width > 900px)` 对应的是 `(min-width: 901px)`——边界整 1px 之差。在过去用 `min-width: 900px` 和 `max-width: 900px` 同时命中 900px 会导致样式打架，range 语法用 `<` / `<=` 能精确避开这个边界重叠问题。
:::

range 语法自 2023 年起在主流浏览器 Baseline 广泛可用。若需兼容更老的浏览器，仍可退回 `min-/max-` 写法——两者可以在同一份样式表里共存。

## 逻辑操作符

### `and`——同时满足

```css
@media screen and (width >= 900px) and (orientation: landscape) {
  /* 屏幕、且宽 ≥ 900px、且横向，三者都满足才生效 */
}
```

### `,`（逗号）或 `or`——满足其一

逗号是「或」的意思，任一子查询命中就生效：

```css
@media screen, print {
  body { line-height: 1.4; }
}

/* Level 4 起也可用 or 关键字，语义等价 */
@media screen or print {
  body { line-height: 1.4; }
}
```

### `not`——取反整条

`not` 对**整条查询**取反，而非单个特征：

```css
@media not all and (hover: hover) {
  /* 没有 hover 能力的设备（如纯触屏） */
  .tooltip-host::after {
    content: " (轻触查看)";
  }
}
```

### `only`——屏蔽老浏览器

`only` 让不认识 Level 3+ 语法的远古浏览器整条跳过，**必须搭配媒体类型**：

```css
@media only screen and (width <= 500px) {
  /* 现代浏览器正常处理；不识别 only 的老浏览器忽略整条 */
}
```

## 常用媒体特征

### 尺寸与方向

```css
@media (width >= 768px) { /* 视口宽度（含滚动条） */ }
@media (height < 600px) { /* 视口高度，矮屏可收起非必要区域 */ }
@media (orientation: landscape) { /* 横向 */ }
@media (aspect-ratio >= 16/9) { /* 视口宽高比 */ }
@media (resolution >= 2dppx) { /* 高密度屏（Retina），可换 2x 图 */ }
```

### 交互能力：`hover` 与 `pointer`

这两组特征探测的是**输入设备的精度与悬停能力**，对「触屏 vs 鼠标」差异化体验很关键：

```css
/* 主输入支持精确悬停（鼠标 / 触控板）才启用 hover 效果 */
@media (hover: hover) and (pointer: fine) {
  .menu:hover .submenu { display: block; }
}

/* 主输入是粗指针（手指），加大可点区域 */
@media (pointer: coarse) {
  .btn { min-height: 44px; }
}
```

- `hover`：`hover` / `none`——主输入能否悬停。
- `pointer`：`fine`（鼠标 / 触控笔，精确）/ `coarse`（手指，粗略）/ `none`（无指针）。
- `any-hover` / `any-pointer`：把「主输入」换成「**任一**可用输入」来判断——例如笔记本既有触屏又有触控板时更宽松。

## 嵌套与组织

媒体查询可以和 `@supports`、CSS 原生嵌套互相套，写出更内聚的样式：

```css
.card {
  padding: 1rem;

  /* CSS 嵌套语法里直接写媒体查询 */
  @media (width >= 40em) {
    padding: 2rem;
  }
}

/* 媒体查询嵌进特性查询（先确认能力，再按视口分情况） */
@supports (display: grid) {
  @media (width >= 60em) {
    .gallery { grid-template-columns: repeat(3, 1fr); }
  }
}
```

## 无障碍：断点用相对单位

把断点写成 `em` / `rem` 而非裸 `px`，断点就会**跟随用户的浏览器字号设置**缩放——放大字体的用户能更早进入宽松布局：

```css
/* 推荐：跟随用户字号 */
@media (width >= 40em) { /* … */ }

/* 不推荐：固定像素，无视用户缩放偏好 */
@media (width >= 640px) { /* … */ }
```

## 小结

媒体查询按**视口与设备**决策，现代 range 语法（`width >= 600px`、`400px <= width <= 700px`）让区间断点更直观、边界更精确。但媒体查询只能读「全局环境」——下一页的用户偏好特征，把决策依据从「设备多大」推进到「用户想要什么」：[用户偏好查询](./user-preferences)。
