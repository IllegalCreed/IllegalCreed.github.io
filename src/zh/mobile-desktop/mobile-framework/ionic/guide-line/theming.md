---
layout: doc
outline: [2, 3]
---

# Ionic 主题与暗色

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **机制**：主题全靠 **CSS 变量（CSS custom properties）**，运行时可改、**无需 Sass**
- **9 个应用色**：`primary` / `secondary` / `tertiary` / `success` / `warning` / `danger` / `light` / `medium` / `dark`
- **每个色成套 6 变量**：`base` / `-rgb` / `-contrast` / `-contrast-rgb` / `-shade`（更深）/ `-tint`（更浅）——**改色要成套改**，否则组件表现不一致
- **命名前缀**：应用色统一 `--ion-color-*`；另有全局 `--ion-background-color` / `--ion-text-color` 等
- **改 Shadow DOM 内部**：优先用组件暴露的 **CSS 变量**；变量不够时用 **CSS Shadow Parts** `ion-xxx::part(name)`（8.8 起暴露更多 part 与 class）
- **暗色 3 palette**（从 `@ionic/{framework}/css/palettes/` 导入其一）：`dark.always.css`（永远暗）/ `dark.system.css`（**默认推荐**，跟随系统）/ `dark.class.css`（手动，`.ion-palette-dark` 类）
- **暗色坑**：暗色变量按 mode 分设（`:root.ios` 与 `:root.md`），自定义覆盖需**同等或更高特异性**选择器；建议加 `<meta name="color-scheme" content="light dark" />`
- **工具**：官方 Color Generator 可一键生成整套色板变量

## 一、主题机制：CSS 变量，不需要 Sass

Ionic 的主题系统建立在**标准 CSS 变量**之上——不需要 Sass 预处理器，改变量即换肤，**运行时也能动态改**（用 JS 改 `--ion-*` 即可）。这与旧 UI 库靠编译期 Sass 变量的做法不同，是 Ionic 换肤灵活的根本原因。

主题文件通常放在 `src/theme/variables.css`（CLI 模板已生成），在 `:root` 下声明变量即可全局生效。

## 二、9 个应用色与成套变量

Ionic 预设 **9 个语义应用色**：

`primary`、`secondary`、`tertiary`、`success`、`warning`、`danger`、`light`、`medium`、`dark`。

**关键坑**：每个应用色不是一个变量，而是**一组 6 个变量**，必须**成套定义**，否则组件在不同状态（按下、对比文字、阴影）下表现会不一致：

| 变量后缀 | 含义 |
| --- | --- |
| `base` | 基础色（如 `--ion-color-primary`） |
| `-rgb` | 基础色的 RGB 三元组（供 `rgba()` 用透明度） |
| `-contrast` | 该色之上的对比文字色 |
| `-contrast-rgb` | 对比文字色的 RGB 三元组 |
| `-shade` | 更深的变体（用于按下 / 阴影） |
| `-tint` | 更浅的变体（用于高亮） |

```css
/* src/theme/variables.css —— 一个应用色要成套 6 个变量 */
:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;   /* 更深，用于按下/阴影 */
  --ion-color-primary-tint: #4c8dff;     /* 更浅，用于高亮 */
}
```

> 手动凑这 6 个值容易出错——官方 **Color Generator** 工具输入一个基础色就能生成整套变量，直接拷进 `variables.css` 即可。

## 三、全局背景 / 文字变量

除应用色外，还有一批全局变量控制整体基调，最常用的是：

- `--ion-background-color`：App 背景色。
- `--ion-text-color`：默认文字色。
- 以及步进色 `--ion-color-step-*`（在背景与文字之间插值出的一系列灰阶，供边框/分隔线等用）。

```css
:root {
  --ion-background-color: #ffffff;
  --ion-text-color: #000000;
}
```

## 四、定制 Shadow DOM 内部：CSS 变量优先，Shadow Parts 兜底

多数 `ion-*` 组件用 **Shadow DOM** 封装，**外部普通选择器穿不进内部**。定制内部样式有两条正路，按优先级：

1. **首选：组件暴露的 CSS 变量**——大量内部尺寸/颜色都开了变量口子，直接设即可。

```css
ion-button {
  --background: #6030ff;
  --border-radius: 8px;
}
```

2. **兜底：CSS Shadow Parts（`::part()`）**——当变量不够时，用组件暴露的 `part` 名穿透 Shadow DOM 改内部元素样式：

```css
/* 改 ion-select 内部图标的颜色 */
ion-select::part(icon) {
  color: var(--ion-color-primary);
}
```

> Ionic **8.8** 的方向正是「让定制更灵活」：暴露了更多 CSS class 与 CSS Shadow Parts，并为 Modal / Refresher 等新增事件。具体某组件暴露了哪些 part/变量，查官方 `docs/api/<component>` 的 CSS 章节。

## 五、暗色模式：3 种预置 palette

Ionic 内置 **3 种暗色调色板**，从 `@ionic/{framework}/css/palettes/`（或 `@ionic/core/css/palettes/`）**导入其一**即可：

| 文件 | 行为 |
| --- | --- |
| `dark.always.css` | **永远暗色**（无视系统设置） |
| `dark.system.css` | **默认推荐**：跟随系统 `prefers-color-scheme` 自动切换 |
| `dark.class.css` | **手动**：给 `<html>` 加/去 `.ion-palette-dark` 类才生效（做 App 内开关用） |

```ts
// 三选一（示例为 core；框架包把 core 换成 angular/react/vue）
// import '@ionic/core/css/palettes/dark.always.css';
// import '@ionic/core/css/palettes/dark.class.css';
import '@ionic/core/css/palettes/dark.system.css';
```

## 六、暗色的特异性坑与手动开关

**特异性坑**：Ionic 的暗色变量是**按 mode 分别设定**的（`:root.ios` 与 `:root.md`）。你要覆盖它们时，**自定义选择器必须有同等或更高的特异性**（比如也写 `:root.ios`），否则改不动：

```css
/* 覆盖暗色下的 primary，需匹配 mode 的特异性 */
:root.ios,
:root.md {
  --ion-color-primary: #a0b4ff;
}
```

**系统 UI 适配**：建议在 `index.html` 加一行，让滚动条等系统 UI 一并跟随明暗：

```html
<meta name="color-scheme" content="light dark" />
```

**手动开关**（配 `dark.class.css`，做 App 内主题切换）：

```ts
// 监听系统偏好 + 切换 .ion-palette-dark 类
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const toggleDark = (on: boolean) =>
  document.documentElement.classList.toggle('ion-palette-dark', on);

toggleDark(prefersDark.matches); // 初始跟随系统
prefersDark.addEventListener('change', (e) => toggleDark(e.matches));
```
