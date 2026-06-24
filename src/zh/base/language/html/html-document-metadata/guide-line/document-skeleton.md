---
layout: doc
outline: [2, 3]
---

# 文档骨架与渲染模式

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<!DOCTYPE html>`：现代唯一写法，触发**标准模式**（no-quirks）；省略或用旧 DOCTYPE 会落入**怪异模式**
- 三种模式：标准（no-quirks）、准标准（limited-quirks，仅影响表格内图片底部间隙）、怪异（quirks，复刻 1990s 行为）
- 检测：`document.compatMode` —— `"CSS1Compat"`（标准 / 准标准）或 `"BackCompat"`（怪异）
- 怪异模式典型坑：怪异盒模型（`width` 含 padding/border）、百分比高度失效、行内图片底部间隙
- `<html lang>`：BCP 47 语言标签（`zh-CN` / `zh-Hans` / `en-US`），影响朗读 / SEO / 翻译 / 断词 / 字体匹配
- `dir`：`ltr` / `rtl` / `auto`（阿拉伯语、希伯来语等从右到左书写）
- `<head>` = 元数据容器（不渲染）；`<body>` = 可见内容；把可见元素放进 `<head>` 会被浏览器强制结束 `<head>`
- 注释 `<!-- … -->`：不可嵌套，不能用于 `<script>` / `<style>` 内；IE 条件注释已随 IE 退役失效

## DOCTYPE 与三种渲染模式

`<!DOCTYPE html>` 不是 HTML 元素，而是文档**第一行的模式开关**。它的唯一作用是让浏览器用**标准模式**解析后续内容。

这是一段历史包袱：上世纪浏览器各行其是，等规范统一后，为了不让按旧规则写的老页面排版崩坏，浏览器保留了一套「怪异模式」复刻旧行为，并用 DOCTYPE 区分新老页面。

| 模式 | 触发条件 | `document.compatMode` |
| --- | --- | --- |
| 标准（no-quirks） | `<!DOCTYPE html>` | `"CSS1Compat"` |
| 准标准（limited-quirks） | 个别旧的过渡型 DOCTYPE | `"CSS1Compat"` |
| 怪异（quirks） | 无 DOCTYPE 或无法识别的 DOCTYPE | `"BackCompat"` |

::: warning 怪异模式会改变什么
- **盒模型**：`width` / `height` 把 padding、border 算进去（相当于强制 `box-sizing: border-box` 的历史版），与现代默认的 `content-box` 不同；
- **百分比高度**：很多场景下 `height: 100%` 失效；
- **行内图片底部间隙**：图片按基线对齐，下方留出约 4px 缝隙；
- 还有 `<table>` 字体不继承、`margin: 0 auto` 居中异常等一连串差异。

排查「为什么本地和线上盒模型不一样」时，先确认是不是漏了 DOCTYPE。
:::

准标准模式（almost standards / limited-quirks）与标准模式**只差一点**：表格单元格里图片的底部间隙处理。日常基本可视同标准模式，了解名字即可。

```js
// 运行时检测当前文档模式
console.log(document.compatMode);
// "CSS1Compat" = 标准/准标准；"BackCompat" = 怪异
```

## `<html>` 根元素与语言

`<html>` 是文档的根，最重要的属性是 `lang`：

```html
<html lang="zh-CN">
```

`lang` 的值是 [BCP 47](https://www.rfc-editor.org/info/bcp47) 语言标签，常见形态是 `语言-地区`（`zh-CN`、`en-US`、`fr-CA`）或 `语言-书写系统`（`zh-Hans` 简体、`zh-Hant` 繁体）。它绝不只是「填个 en 应付一下」：

- **可访问性**：屏幕阅读器据此选择正确的语音引擎和发音；
- **SEO 与翻译**：搜索引擎判断目标受众，浏览器决定是否弹出「翻译此页」；
- **排版**：影响断词（hyphenation）、引号样式，以及中日韩等场景下的字体匹配（同一码位的汉字，中日字形不同）。

局部语言切换可在任意元素上再标 `lang`：

```html
<p>这句话里有一个法语词 <span lang="fr">croissant</span>。</p>
```

### 书写方向 `dir`

```html
<html lang="ar" dir="rtl">
```

`dir` 取值 `ltr`（从左到右，默认）、`rtl`（从右到左，阿拉伯语 / 希伯来语）、`auto`（由内容首个强方向字符推断，适合用户生成内容）。

## `<head>` 与 `<body>` 的分工

一个 HTML 文档恰好分两部分：

- **`<head>`**：元数据容器，里面的东西**不直接渲染**——编码、标题、SEO、图标、样式表与脚本的引用等；
- **`<body>`**：用户实际看到的可见内容。

浏览器解析很宽容：`<html>`、`<head>`、`<body>` 标签本身甚至都能省略（浏览器会自动补全 DOM）。但**不建议**依赖这种容错——显式写出结构更可读、更可控。

::: tip 一个常见事故
如果你不小心把 `<div>`、`<p>` 这类可见元素写进了 `<head>`，浏览器会认为「元数据结束了」，**自动闭合 `<head>` 并开启 `<body>`**。结果是：写在那个可见元素之后的 `<meta>` / `<link>` 全部落到 `<body>` 里而**失效**。`<head>` 里只允许 7 类元素（见 [入门](../getting-started) 表格）。
:::

## HTML 注释

```html
<!-- 这是注释，不会被解析也不会显示 -->
```

要点：

- 注释**不能嵌套**（`<!-- 外 <!-- 内 --> -->` 会提前结束）；
- 注释语法不适用于 `<script>` / `<style>` 内部，那里要用 JS / CSS 自己的注释；
- 历史上的 IE 条件注释（`<!--[if IE]>`）随 IE 退役已**完全失效**，新代码不要再写。

## 小结

DOCTYPE 决定「按哪套规则渲染」，`<html lang>` 决定「这是什么语言」，`<head>` / `<body>` 划分「元数据 vs 可见内容」。这三件事是每个页面的地基——下一页进入 `<head>` 里最先必须出现的两个元素：[字符编码与视口](./charset-viewport)。
