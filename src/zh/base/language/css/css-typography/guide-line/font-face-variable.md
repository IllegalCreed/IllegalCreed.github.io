---
layout: doc
outline: [2, 3]
---

# 字体族与 `@font-face`

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `font-family`：逗号分隔的**优先级列表**，浏览器逐字符从左往右挑第一款可用且含该字形的字体，末尾必带通用族兜底
- 通用字体族：`serif` / `sans-serif` / `monospace` / `cursive` / `fantasy`，以及现代的 `system-ui` / `ui-serif` / `ui-sans-serif` / `ui-monospace` / `ui-rounded`
- 系统字体栈：`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`——零下载拿到各平台原生 UI 字体
- `@font-face`：声明规则（**不能写进选择器内**），`font-family` + `src` 为必填描述符
- `src` 格式：`url("x.woff2") format("woff2")`，`local("名")` 优先用本机字体，**2026 只需 WOFF2**
- 字重 `font-weight`：`400`=normal、`700`=bold；可变字体可取连续值如 `550`，并支持 `lighter`/`bolder` 相对值
- 可变字体：单文件覆盖全部字重/字宽/斜度；`@font-face` 里用**范围**声明 `font-weight: 100 900`
- 五个注册轴：`wght`（重）`wdth`（宽）`slnt`（斜角）`ital`（斜体）`opsz`（光学尺寸），注册轴用**小写** 4 字母标签
- 优先用标准属性（`font-weight` / `font-stretch` / `font-style` / `font-optical-sizing`），`font-variation-settings` 是底层兜底
- 可变字体 Baseline 广泛可用；自定义轴（如 `GRAD`）用**大写**标签，只能经 `font-variation-settings` 设置

## 通用字体族与系统字体栈

`font-family` 是一个**优先级列表**，浏览器对**每个字符**独立地从左往右找第一款「已安装且包含该字形」的字体，缺字才退到下一款。因此列表末尾必须以一个**通用字体族**结尾——它由操作系统映射到一款实际存在的字体，保证总有字可显示：

```css
body {
  font-family: "Inter", system-ui, sans-serif;
}
```

CSS 定义的通用字体族分两类：

| 通用族 | 含义 | 典型映射 |
| --- | --- | --- |
| `serif` | 衬线（笔画末端有装饰） | Times、宋体 |
| `sans-serif` | 无衬线 | Arial、黑体 |
| `monospace` | 等宽（代码） | Consolas、Courier |
| `cursive` | 手写体 | Comic Sans 等 |
| `fantasy` | 装饰性字体 | 各平台不一 |
| `system-ui` | 当前系统**默认 UI 字体** | macOS 用 SF、Windows 用 Segoe |
| `ui-serif` / `ui-sans-serif` / `ui-monospace` / `ui-rounded` | 系统的衬线/无衬线/等宽/圆角 UI 字体 | 各平台原生 |

::: tip 系统字体栈（system font stack）
想零下载、零 CLS 地拿到「和操作系统一致」的字体观感，用系统字体栈是事实标准。最简洁的写法就是 `system-ui`；为兼容老浏览器常展开成一长串：

```css
font-family:
  system-ui,
  -apple-system, /* 旧版 Safari */
  "Segoe UI", /* Windows */
  Roboto, /* Android / ChromeOS */
  "Helvetica Neue",
  Arial,
  sans-serif; /* 兜底通用族 */
```

GitHub、Bootstrap 5 等都采用类似栈。它的代价是「每个平台字体不同」，但换来的是零网络开销与原生手感。
:::

## `@font-face`：加载自定义字体

当你需要一款系统没有的字体（品牌字体、特定中文字体），用 `@font-face` 把字体文件「注册」成一个可用名字。它是一条**声明规则**，必须写在样式表顶层，**不能**嵌在选择器里：

```css
@font-face {
  font-family: "MyBrand"; /* 自定义名字（必填） */
  src: url("/fonts/mybrand.woff2") format("woff2"); /* 文件来源（必填） */
  font-weight: 400; /* 这个文件代表的字重 */
  font-style: normal; /* 这个文件代表的样式 */
  font-display: swap; /* 加载期策略（见下一页） */
}

/* 之后像系统字体一样使用 */
h1 {
  font-family: "MyBrand", sans-serif;
}
```

### `src` 与回退链

`src` 可以列多个来源，浏览器**按声明顺序**取第一个能用的。两个常用函数：

- `local("字体名")`——先找用户**本机已装**的同名字体，命中就不必下载；
- `url(...) format(...)`——从服务器下载，`format()` 声明格式让浏览器跳过不支持的项。

```css
@font-face {
  font-family: "MyHelvetica";
  src:
    local("Helvetica Neue"), /* 本机有就直接用 */
    url("/fonts/helvetica.woff2") format("woff2"); /* 否则下载 WOFF2 */
}
```

`format()` 取值有 `woff2` / `woff` / `truetype` / `opentype` 等。**2026 年的实践是只提供 WOFF2**——它压缩率比 WOFF 高约 30%、现代浏览器全面支持，多写老格式回退链已无必要。彩色字体/可变字体可加 `tech()` 提示（如 `tech(color-COLRv1)`），并把更具体的源排在前面。

::: warning 跨域与 CORS
字体文件若放在不同域名，必须服务端配置 CORS（响应带 `Access-Control-Allow-Origin`），否则浏览器拒绝加载。这也是 `<link rel="preload" as="font">` 必须带 `crossorigin` 的原因——字体请求一律按匿名 CORS 模式发出。
:::

## `font-weight` 与字重

`font-weight` 控制笔画粗细：

- 关键字：`normal`（=400）、`bold`（=700）；相对值 `lighter` / `bolder`（在继承到的字重上增减一档）；
- 数值：100～900，非可变字体只认 100 的整数倍（100/200/.../900）；
- **可变字体**可取任意连续值，如 `font-weight: 550`，并可能支持到 1000。

```css
.thin {
  font-weight: 100;
}
.normal {
  font-weight: 400;
} /* = normal */
.bold {
  font-weight: 700;
} /* = bold */
.custom {
  font-weight: 550;
} /* 仅可变字体有效 */
```

::: tip `font-synthesis`：别让浏览器「假装」加粗
若某字重/斜体的字形文件不存在，浏览器会**合成**——把常规字形机械加粗或倾斜，效果往往很糟。`font-synthesis: none` 可禁止合成，强制只用真实字形：

```css
body {
  font-synthesis: none; /* 关掉合成的粗体/斜体/小型大写 */
}
```
:::

## 可变字体（Variable Fonts）

传统字体每个字重/字宽/斜体都是**一个独立文件**（Regular、Bold、Light…），可变字体把这些变化压进**一个文件**，并允许在各「轴」上取**连续值**——既省下多次请求，又解锁了「321 这种中间字重」之类的精细排版。可变字体已是 **Baseline 广泛可用**。

### 五个注册轴与对应标准属性

OpenType 规范了五个**注册轴**，它们都有对应的标准 CSS 属性——**应优先用标准属性**：

| 轴 | 标签 | 范围 | 标准 CSS 属性 |
| --- | --- | --- | --- |
| 字重 Weight | `wght` | 1–1000 | `font-weight` |
| 字宽 Width | `wdth` | 百分比（常 75–125%） | `font-stretch` / `font-width` |
| 斜角 Slant | `slnt` | -90°–90° | `font-style: oblique <角度>` |
| 斜体 Italic | `ital` | 0–1（关/开） | `font-style: italic` |
| 光学尺寸 Optical Size | `opsz` | 随字体 | `font-optical-sizing: auto` |

**注册轴用小写 4 字母标签**；字体厂商还能定义**自定义轴**（如 `GRAD` 字阶、`SOFT` 圆润度），**自定义轴用大写标签**，只能通过 `font-variation-settings` 设置。

### 在 `@font-face` 里声明范围

可变字体在 `@font-face` 中用**范围**告诉浏览器它支持的轴区间：

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2");
  font-weight: 100 900; /* 支持 100～900 全部字重 */
  font-stretch: 75% 125%; /* 支持 75%～125% 字宽 */
  font-style: oblique 0deg 10deg; /* 支持 0～10 度倾斜 */
}
```

### `font-variation-settings`：底层兜底

标准属性覆盖不到的轴（尤其自定义轴），才用底层的 `font-variation-settings`：

```css
.fancy {
  /* 注册轴小写、自定义轴大写；轴名大小写敏感 */
  font-variation-settings:
    "wght" 550,
    "wdth" 110,
    "opsz" 28,
    "GRAD" 88; /* 自定义轴：字阶 */
}
```

::: warning 为什么优先用标准属性
`font-variation-settings` 有几个不便：

1. **必须一次写全**——改一个轴要把所有轴重新声明一遍（否则没写的轴会被重置为默认值）；
2. **不像标准属性那样平滑动画/继承**——动画与级联行为不如 `font-weight` 自然；

所以能用 `font-weight: 550` 就别写 `font-variation-settings: "wght" 550`。若确实要动态调多个轴，用 CSS 自定义属性缓冲「必须写全」的痛点：

```css
:root {
  --wght: 400;
  --wdth: 100;
}
body {
  font-variation-settings: "wght" var(--wght), "wdth" var(--wdth);
}
/* 改一个轴只需改变量 */
h1 {
  --wght: 800;
}
```
:::

用 `@supports` 给老浏览器做特性查询回退：

```css
h1 {
  font-family: sans-serif; /* 老浏览器 */
}
@supports (font-variation-settings: "wght" 400) {
  h1 {
    font-family: "Inter", sans-serif; /* 支持可变字体的现代浏览器 */
  }
}
```

## 小结

`font-family` 是逐字符回退的优先级列表，末尾必带通用族；`@font-face` 把自定义字体注册成可用名字（只给 WOFF2 即可）；可变字体单文件覆盖全字重/字宽/斜度，优先用 `font-weight` / `font-stretch` / `font-style` 这些标准属性，`font-variation-settings` 仅作兜底。字体装好了，下一步是让它**快速且不抖动地显示**——进入[字体加载与性能](./font-loading)。
