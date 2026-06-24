---
layout: doc
outline: [2, 3]
---

# 用户偏好查询

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `prefers-color-scheme`：`light` / `dark`——读取系统明暗偏好，配 `color-scheme` + CSS 变量做暗色
- `prefers-reduced-motion`：`reduce` / `no-preference`——用户要求减弱动效（前庭失调 / 晕动症），**必须尊重**
- `prefers-contrast`：`more` / `less` / `custom` / `no-preference`——用户对对比度的偏好
- `prefers-reduced-data`：`reduce`——用户要求省流量，可换低清图 / 关字体
- `prefers-reduced-transparency`：`reduce`——用户要求减少半透明 / 毛玻璃效果
- 推荐范式：用 `no-preference` 把动效写进「加分项」，默认无动效——而非默认有动效再去关
- 暗色三件套：`color-scheme`（控件 / 滚动条）+ `prefers-color-scheme`（页面色）+ CSS 变量（集中切换）
- 这些是**无障碍**而非美观——忽略 `prefers-reduced-motion` 可能让用户头晕
- Baseline：`prefers-color-scheme` / `prefers-reduced-motion` 早已广泛可用；`prefers-contrast` / `prefers-reduced-data` 较新，按渐进增强用

## 从「适配设备」到「尊重用户」

前一页的媒体特征问的是「屏幕多大、是不是触屏」；这一页的特征问的是「**用户在系统里勾选了什么偏好**」。它们读取操作系统 / 浏览器层面的设置，与无障碍直接挂钩——这不是锦上添花的视觉效果，而是「不照做就可能伤害到部分用户」的底线。

## `prefers-color-scheme`——暗色模式

读取用户系统的明暗偏好，是实现暗色模式最正统的方式：

```css
/* 默认（浅色）放在外面 */
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
}

/* 系统为暗色时覆盖变量 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
  }
}

body {
  background: var(--bg);
  color: var(--fg);
}
```

取值为 `light` 或 `dark`。配合 CSS 变量集中管理颜色，暗色模式就只是「换一组变量值」，无需重复写选择器。

::: tip 别忘了 `color-scheme`
`prefers-color-scheme` 只切**你自己写的页面颜色**；浏览器的默认 UI（表单控件、滚动条、根背景）要靠 CSS 的 `color-scheme` 属性来切。两者配合才完整：

```css
:root {
  color-scheme: light dark; /* 让浏览器原生控件也跟随明暗 */
}
```

这就是「暗色三件套」——`color-scheme`（原生控件）+ `prefers-color-scheme`（页面色）+ CSS 变量（集中切换）。
:::

## `prefers-reduced-motion`——减弱动效

这是**最该认真对待**的偏好。部分用户有前庭功能障碍 / 晕动症，大幅位移、缩放、视差动画会让他们头晕甚至不适。当用户在系统里开启「减弱动态效果」时，这个查询命中 `reduce`：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

更推荐的范式是**反过来写**——默认无动效，只在用户「没有要求减弱」时才把动效作为加分项加上：

```css
/* 默认：静态，人人安全 */
.card {
  transform: none;
}

/* 仅当用户未要求减弱动效时，才启用过渡 */
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 0.3s ease;
  }
  .card:hover {
    transform: translateY(-4px);
  }
}
```

这样做的好处：偏好「减弱」是默认安全态，不依赖 `!important` 去覆盖，逻辑也更清晰。

## `prefers-contrast`——对比度偏好

读取用户对对比度的偏好，可据此加粗边框、加深文字、去掉低对比的装饰：

```css
@media (prefers-contrast: more) {
  .btn {
    border: 2px solid currentColor;
    text-decoration: underline;
  }
}
```

取值：`more`（要求更高对比）、`less`（要求更低对比）、`custom`（用户自定义了配色方案）、`no-preference`。这是较新的特征，按渐进增强使用——不命中时回退到默认样式即可。

## `prefers-reduced-data`——省流量

读取用户「希望减少数据消耗」的偏好（如手机流量模式），可据此换低清图、停掉自定义字体：

```css
.hero {
  background-image: url("hero-2x.jpg");
}

@media (prefers-reduced-data: reduce) {
  .hero {
    background-image: url("hero-small.jpg"); /* 省流量版 */
  }
}
```

`prefers-reduced-data` 支持度还在铺开，属于纯渐进增强——不命中就照常加载高清资源，不会影响功能。

## 在 JavaScript 里读取偏好

这些偏好也能用 `matchMedia` 在脚本里读取，并监听变化（例如用户切换系统主题时实时响应）：

```js
// 检测当前是否偏好暗色
const dark = window.matchMedia("(prefers-color-scheme: dark)");
console.log(dark.matches); // true / false

// 监听系统偏好变化
dark.addEventListener("change", (e) => {
  console.log(e.matches ? "切到了暗色" : "切到了浅色");
});
```

## 小结

用户偏好查询把「响应」从设备维度推进到了人的维度——暗色、减弱动效、对比度都该跟随系统设置，其中 `prefers-reduced-motion` 是无障碍底线。这些查询读的仍是「全局环境」；下一页换一个完全不同的维度：让组件按**自己所在容器的尺寸**自适应，这就是容器查询：[容器查询](./container-queries)。
