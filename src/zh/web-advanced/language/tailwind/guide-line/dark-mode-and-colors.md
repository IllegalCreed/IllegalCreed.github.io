---
layout: doc
outline: [2, 3]
---

# 深色模式与颜色系统

> 基于 Tailwind CSS 4.3 · 核于 2026-07

## 速查

- **`dark:` 默认策略**：基于 `prefers-color-scheme` 媒体查询，跟随系统明暗偏好，无需任何配置。
- **手动切换（class 策略）**：`@custom-variant dark (&:where(.dark, .dark *));`，在 `<html>` 加/去 `.dark` 类控制（取代 v3 的 `darkMode: 'class'`）。
- **手动切换（data 策略）**：`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`，用 `data-theme="dark"` 控制。
- **JS 切换**：`document.documentElement.classList.toggle('dark')`；配合 `localStorage` + 系统偏好做「跟随系统/手动」三态。
- **写法**：`bg-white dark:bg-gray-800`、`text-black dark:text-white`——无前缀是浅色默认，`dark:` 覆盖为深色。
- **调色板**：v4 默认用 **OKLCH（P3 广色域）**；**22 个颜色家族**（slate/gray/zinc/neutral/stone + red…rose 共 17 彩色）+ `black`/`white`；每家族 **11 档**（50…950）。
- **透明度修饰符**：`bg-blue-500/50`（50% 不透明度，底层 `color-mix()`）；支持 `/[71.37%]`、`/(--my-alpha)`。
- **颜色可用于多种属性**：`bg-`/`text-`/`border-`/`ring-`/`outline-`/`decoration-`/`fill-`/`stroke-`/`accent-`/`caret-`/`shadow-`/`from-`/`via-`/`to-`。
- **颜色即 CSS 变量**：`var(--color-blue-500)`；自定义色在 `@theme` 里加 `--color-brand: …`。

## 一、深色模式：默认跟随系统

`dark:` 变体在**默认配置下**基于 CSS 的 `prefers-color-scheme`，跟随操作系统/浏览器的明暗偏好自动切换，什么都不用配：

```html
<div class="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
  <h3 class="text-gray-900 dark:text-white">标题</h3>
  <p class="text-gray-500 dark:text-gray-400">描述</p>
</div>
```

写法约定：**无前缀 = 浅色默认，`dark:` 覆盖为深色**。这样浅色是基线、深色是增量，符合移动优先式的「默认 + 覆盖」思路。

## 二、手动切换：class 策略与 data 策略

产品常需要「让用户手动切换」而非只跟随系统。v4 用 `@custom-variant` 重定义 `dark` 变体（取代 v3 的 `darkMode: 'class'` 配置）：

```css
/* class 策略：用 .dark 类控制 */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <body><div class="bg-white dark:bg-black">…</div></body>
</html>
```

也可改用属性策略（更贴合「多主题」体系）：

```css
/* data 策略：用 data-theme="dark" 控制 */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```html
<html data-theme="dark">…</html>
```

## 三、JS 里落地「跟随系统 / 手动」三态

真实项目通常要支持：默认跟随系统、用户可手动切换、刷新后记住选择，且**避免首屏闪烁**（在页面渲染前就定好主题）：

```html
<!-- 放在 <head> 里尽早执行，避免闪烁 -->
<script>
  const stored = localStorage.getItem('theme');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', stored === 'dark' || (!stored && prefersDark));
</script>
```

```js
// 切换按钮
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

::: tip 首屏闪烁（FOUC）
如果等页面加载完再用 JS 加 `.dark`，会先闪一下浅色再变深。把判定脚本放到 `<head>` 里、在 body 渲染前同步执行，是消除深色模式闪烁的通用做法。
:::

## 四、颜色系统：OKLCH 广色域

v4 把默认调色板从 v3 的 `rgb` 升级为 **OKLCH**（面向 P3 广色域），在支持的屏幕上更鲜艳，同时保持与 v3 相近的整体观感。OKLCH 相比 HSL **感知更均匀**，便于程序化生成同色系深浅。

- **22 个颜色家族**：中性色 `slate` `gray` `zinc` `neutral` `stone`（5 组灰）；彩色 `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`（17 组）；外加 `black`、`white`。
- **每家族 11 档**：`50 100 200 300 400 500 600 700 800 900 950`——50 最浅、950 最深、500 常作基准。

```html
<div class="bg-sky-50"></div>   <!-- 最浅 -->
<div class="bg-sky-500"></div>  <!-- 基准 -->
<div class="bg-sky-950"></div>  <!-- 最深 -->
```

## 五、透明度修饰符：`/` 语法

用斜杠加数字调不透明度，底层是 CSS `color-mix()`：

```html
<div class="bg-sky-500/10"></div>   <!-- 10% -->
<div class="bg-sky-500/50"></div>   <!-- 50% -->
<div class="text-black/70"></div>
<div class="bg-pink-500/[71.37%]"></div>       <!-- 任意百分比 -->
<div class="bg-cyan-400/(--my-alpha)"></div>   <!-- 用 CSS 变量 -->
```

这比 v3 里已废弃的 `bg-opacity-50` 更直观、也更省一个类。

## 六、颜色能用在哪些属性上

同一套颜色令牌可作用于大量属性，前缀不同而已：

| 前缀 | 作用 | | 前缀 | 作用 |
| --- | --- | --- | --- | --- |
| `bg-` | 背景色 | | `ring-` | 轮廓环色 |
| `text-` | 文字色 | | `outline-` | 描边色 |
| `border-` | 边框色 | | `decoration-` | 文字装饰线色 |
| `fill-` | SVG 填充 | | `accent-` | 表单控件强调色 |
| `stroke-` | SVG 描边 | | `caret-` | 光标色 |
| `shadow-` | 阴影色 | | `from-`/`via-`/`to-` | 渐变色标 |

## 七、自定义颜色与「颜色即变量」

在 `@theme` 里加颜色令牌，即同时得到工具类与 CSS 变量：

```css
@import "tailwindcss";
@theme {
  --color-brand-500: oklch(0.62 0.19 260);
  --color-brand-600: oklch(0.55 0.20 262);
}
```

```html
<button class="bg-brand-500 hover:bg-brand-600 text-white">Brand</button>
<!-- 也可直接引用变量 -->
<div style="border-color: var(--color-brand-500)">…</div>
```

::: warning v4 默认色改动别踩坑
从 v3 迁移时注意：v4 里裸 `border`/`ring`/`divide` 的默认色由 `gray-200`/`blue-500` 改成了 **`currentColor`**（跟随文字色），`placeholder` 默认色也改为 `currentColor` 的 50%。依赖旧默认灰色的地方，升级后要**显式写颜色**（如 `border-gray-200`）。
:::

---

主题与配色打通后，最后一步进入 [v3→v4 迁移与生态](./migration-and-ecosystem)：破坏性变更清单、Oxide 引擎、安装矩阵，以及与组件库/UnoCSS/PostCSS 的关系。
