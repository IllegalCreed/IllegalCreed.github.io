---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 声明变量：`--brand: #0066ff;`（名字必须以 `--` 开头，**大小写敏感**），用 `var(--brand)` 取值
- 回退：`var(--brand, #333)`——变量没定义时用第二参数；可嵌套 `var(--a, var(--b))`
- 作用域：变量**默认继承**，写在 `:root` 即全局；写在某选择器内只对它和后代生效——换肤就靠重定义
- 类型化：`@property --x { syntax: "<color>"; inherits: false; initial-value: red; }`——加类型后**才能动画**（Baseline 2024）
- 嵌套：规则里直接写子规则，用 `&` 指代父选择器；`&.active` = 复合，`& .child` = 后代（Baseline 2023）
- 流式排版：`font-size: clamp(1rem, 0.5rem + 2vw, 1.5rem)`——一行搞定「最小/理想/最大」，免媒体查询
- 数学：`calc()` 混合单位运算、`min()` 取小（设上限）、`max()` 取大（设下限）、`clamp()` 夹在区间
- 组织：BEM 命名（`block__element--modifier`）+ `@layer` 排座次 + `@scope` 圈作用域
- 调试：CSS 不报错，打开 DevTools 看 Styles 面板——被覆盖的声明带**删除线**
- JS 交互：读 `getComputedStyle(el).getPropertyValue("--x")`，写 `el.style.setProperty("--x", v)`

## 一份「现代」的样式表

下面这段样式集齐了本叶的核心特性——变量换肤、类型化、原生嵌套、流式排版。本叶其余各页就是逐块拆解它：

```css
/* 1. 类型化变量：加了 syntax 才能被动画 */
@property --accent {
  syntax: "<color>";
  inherits: true;
  initial-value: #0066ff;
}

/* 2. 全局令牌：写在 :root，整页可用且可被局部覆盖 */
:root {
  --accent: #0066ff;
  --bg: #ffffff;
  --fg: #1a1a1a;
  --space: 8px;
}

/* 3. 运行时换肤：给 <html> 加 .dark 即整页变暗，零 JS 改样式 */
.dark {
  --bg: #0d1117;
  --fg: #e6edf3;
}

body {
  background: var(--bg);
  color: var(--fg);

  /* 4. 原生嵌套：& 指代 body，.card 是后代 */
  & .card {
    padding: calc(var(--space) * 2);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg));
    border-radius: 12px;

    /* 5. 嵌套交互状态：&:hover 等价于 .card:hover */
    &:hover {
      --accent: #0052cc;
    }
  }
}

/* 6. 流式排版：字号随视口在 1.5rem~2.5rem 间平滑伸缩，无需媒体查询 */
h1 {
  font-size: clamp(1.5rem, 1rem + 3vw, 2.5rem);
  /* 内容宽度封顶：永远不超过 65ch，小屏时跟随容器 */
  max-inline-size: min(65ch, 100%);
}
```

```js
// 7. 与 JS 双向交互：把鼠标位置写进变量，CSS 即可消费
document.addEventListener("pointermove", (e) => {
  document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
});
```

::: tip 这份样式表的取舍
它刻意混用了多个现代特性来展示「CSS 可工程化」的全貌。真实项目里你不必一次全上：变量与 `clamp()` 几乎可无脑用（广泛可用）；`@property` 与原生嵌套 2024 年后也已稳妥；只有 `@scope`（见 [组织方法论](./guide-line/css-methodology)）较新，需考虑降级。
:::

## 逐块拆解

### ① 自定义属性：把值变量化

```css
:root {
  --accent: #0066ff;
}
a {
  color: var(--accent);
}
```

`--accent` 是一个**自定义属性**（俗称 CSS 变量）。它和 Sass 变量有本质区别：Sass 变量在编译期就被替换掉、运行时不存在；CSS 自定义属性是**活在浏览器里**的真实值，能被层叠、被继承、被 JS 在运行时改写。这正是「运行时换肤」的基础。详见 [自定义属性与 var()](./guide-line/custom-properties)。

### ② 作用域与换肤

变量默认**继承**：写在 `:root`（即 `<html>`）上就全页可用。而在更具体的选择器里**重新声明**同名变量，会就近覆盖——给 `<html>` 切换一个 `.dark` 类，整棵子树里所有 `var(--bg)` 就一起变了，**完全不用 JS 去逐个改样式**。这是自定义属性最实用的杀手锏。详见 [自定义属性与 var()](./guide-line/custom-properties)。

### ③ `@property`：给变量加类型

```css
@property --accent {
  syntax: "<color>";
  inherits: true;
  initial-value: #0066ff;
}
```

普通自定义属性对浏览器而言只是「一串不透明的文本」，没法在两个值之间插值，**所以不能被 `transition` / `animation` 动画**。用 `@property` 声明它是个 `<color>` 之后，浏览器就懂得怎么在颜色间过渡了——这解锁了「渐变色平滑过渡」「角度旋转动画」等过去做不到的效果。详见 [`@property` 类型化变量](./guide-line/property-typed)。

### ④ 原生嵌套

```css
.card {
  &:hover {
    /* = .card:hover */
  }
  & .title {
    /* = .card .title */
  }
}
```

现在不装 Sass，CSS 自己就能嵌套。`&` 指代「父选择器」：贴着写 `&:hover`、`&.active` 是**复合**（同一元素的状态/附加类）；留空格 `& .title` 是**后代**。它能显著减少重复的选择器前缀。详见 [原生 CSS 嵌套](./guide-line/nesting)。

### ⑤ 数学函数与流式排版

```css
h1 {
  font-size: clamp(1.5rem, 1rem + 3vw, 2.5rem);
}
```

`clamp(最小, 理想, 最大)` 把字号**夹**在一个区间里，理想值带上 `vw` 就能随视口宽度平滑伸缩——一行代码顶过去好几个媒体查询断点。配套的 `calc()`（混合单位算式）、`min()`（取小，常用来设上限）、`max()`（取大，设下限）共同构成「流式排版」工具箱。详见 [数学函数与流式排版](./guide-line/math-functions)。

### ⑥ 组织与调试

样式一多就要谈「工程化」：用 **BEM** 命名约定避免类名打架、用 `@layer` 让样式按层排座次、用 `@scope` 把组件样式圈进作用域防止外泄；样式出问题时，记住 **CSS 从不报错**，得靠 DevTools 的删除线和 Computed 面板查真相。详见 [组织方法论](./guide-line/css-methodology) 与 [CSS 调试与 DevTools 工作流](./guide-line/css-debugging)。

## 自定义属性 vs Sass 变量

很多人初学时会把两者混为一谈，但它们处在完全不同的阶段：

| 维度 | CSS 自定义属性 `--x` | Sass 变量 `$x` |
| --- | --- | --- |
| 存在时机 | 运行时活在浏览器里 | 编译期被替换，产物里不存在 |
| 能否被 JS 读写 | 能（`getPropertyValue` / `setProperty`） | 不能 |
| 能否继承 / 级联 | 能，遵循 CSS 层叠 | 不能，只是文本替换 |
| 运行时主题切换 | 重定义一次即整页生效 | 做不到（需重新编译） |
| 能否用于 `@media` 条件 | **不能**（媒体查询条件里用不了 `var()`） | 能（编译期） |

一句话：**Sass 变量管「写代码时的复用」，CSS 自定义属性管「运行时的动态」**——二者并不互斥，但现代项目越来越多场景能只靠 CSS 自定义属性搞定。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[自定义属性与 var()](./guide-line/custom-properties)、[`@property`](./guide-line/property-typed)、[原生嵌套](./guide-line/nesting)、[数学函数](./guide-line/math-functions)、[组织方法论](./guide-line/css-methodology)、[调试](./guide-line/css-debugging)。
