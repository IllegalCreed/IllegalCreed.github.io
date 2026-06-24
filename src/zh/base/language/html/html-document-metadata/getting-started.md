---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 文档声明：`<!DOCTYPE html>` —— 触发**标准模式**，必须在文档最前
- 根元素：`<html lang="zh-CN">` —— `lang` 必填，影响屏幕阅读器 / SEO / 翻译
- 编码：`<meta charset="utf-8">` —— 必须在 `<head>` **前 1024 字节**内；HTML5 只认 `utf-8`
- 视口：`<meta name="viewport" content="width=device-width, initial-scale=1">` —— 响应式地基
- 标题：`<title>` 每页**唯一**且语义明确（标签页 / 收藏 / 搜索结果 / 分享卡片都用它）
- 描述：`<meta name="description" content="…">` —— 搜索结果摘要（非排名因素，但影响点击）
- 暗色：`<meta name="color-scheme" content="light dark">` + `<meta name="theme-color">`（可带 `media`）
- 社交：Open Graph（`og:title` / `og:type` / `og:image` / `og:url`）+ Twitter（`twitter:card`）
- 图标：`<link rel="icon">` + `<link rel="apple-touch-icon" sizes="180x180">`
- 规范页：`<link rel="canonical" href="绝对URL">` —— 防重复内容
- `<head>` 七类合法子元素：`<meta>`、`<title>`、`<link>`、`<style>`、`<base>`、`<script>`、`<noscript>`
- 顺序铁律：`charset` → `viewport` → `title` → 其余 `meta` → CSS / `preload`

## 一份「正确且现代」的 `<head>`

下面这份模板覆盖了绝大多数项目真正需要的东西，本叶其余各页就是逐块拆解它：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <!-- 1. 编码：必须最先，前 1024 字节内 -->
    <meta charset="utf-8" />

    <!-- 2. 视口：移动端响应式地基 -->
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- 3. 标题与描述：搜索与分享的门面 -->
    <title>页面标题 · 站点名</title>
    <meta name="description" content="一句话讲清这个页面讲什么，约 70～150 字。" />

    <!-- 4. 暗色模式：让浏览器 UI 与表单控件跟随主题 -->
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />

    <!-- 5. 规范链接：防止多 URL 重复内容 -->
    <link rel="canonical" href="https://example.com/page" />

    <!-- 6. 社交分享卡片（Open Graph + Twitter） -->
    <meta property="og:title" content="页面标题" />
    <meta property="og:description" content="分享时显示的描述" />
    <meta property="og:image" content="https://example.com/og.png" />
    <meta property="og:url" content="https://example.com/page" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- 7. 图标 -->
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- 8. PWA 清单（可选） -->
    <link rel="manifest" href="/site.webmanifest" />

    <!-- 9. 性能：预连接 + 关键资源预加载 -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

    <!-- 10. 样式表（阻塞渲染，放 head） -->
    <link rel="stylesheet" href="/css/main.css" />
  </head>
  <body>
    <!-- 可见内容 -->
    <script type="module" src="/js/app.js"></script>
  </body>
</html>
```

::: tip 这份模板的取舍
真实项目里 `<meta name="keywords">` 已无 SEO 价值（可省）；`X-UA-Compatible`（IE 兼容）在 2026 年也无意义（IE 早已退役）。模板只保留「现在仍有效」的部分。
:::

## 逐块拆解

### ① 文档类型与根元素

`<!DOCTYPE html>` 不是 HTML 标签，而是给浏览器的一条指令：**用标准模式渲染**。省略它会落入「怪异模式」（quirks mode），让盒模型等行为退回上世纪的怪异实现。`<html lang>` 声明文档主语言——屏幕阅读器据此选发音、搜索引擎据此判断受众、浏览器据此提示翻译。详见 [文档骨架与渲染模式](./guide-line/document-skeleton)。

### ② 字符编码：第一个 `<meta>`

```html
<meta charset="utf-8" />
```

它必须出现在 `<head>` 的**前 1024 字节**内——否则浏览器可能已用默认编码（`windows-1252`）解析了部分字节，导致中文乱码。HTML5 实际只接受 `utf-8`。详见 [字符编码与视口](./guide-line/charset-viewport)。

### ③ 视口：移动端的地基

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

没有它，移动浏览器会假装自己有约 980px 宽、再把整页缩小，响应式布局全部失效。刘海屏还需 `viewport-fit=cover` 配合 CSS 的 `env(safe-area-inset-*)`。详见 [字符编码与视口](./guide-line/charset-viewport)。

### ④ 标题与描述

`<title>` 是页面在标签页、收藏夹、搜索结果、社交卡片里的名字，每页都该唯一。`<meta name="description">` 不直接影响排名，但常被搜索引擎用作结果摘要，写得好能显著提升点击率。详见 [标题与 SEO 元数据](./guide-line/title-seo-meta)。

### ⑤ 暗色模式

`color-scheme` 让浏览器把默认 UI（表单控件、滚动条、根背景）切到暗色；`theme-color` 给移动浏览器地址栏 / PWA 标题栏上色，且可用 `media` 分别给亮暗模式不同值。详见 [标题与 SEO 元数据](./guide-line/title-seo-meta)。

### ⑥ 社交分享卡片

当链接被贴到微信 / X / Slack / Discord 时，对方抓取的是 Open Graph（`og:*`）与 Twitter Card（`twitter:*`）标签来生成预览卡。`og:image` 必须是**绝对 URL**（含 `https://`）。详见 [社交分享元数据](./guide-line/social-metadata)。

### ⑦ 图标、规范链接与性能

`<link>` 承担了 `<head>` 里大半的活：图标、`canonical`、PWA `manifest`、样式表，以及 `preload` / `preconnect` 等性能提示。详见 [`<link>` 关系全谱](./guide-line/link-relations) 与 [资源提示](./guide-line/resource-hints)。

## `<head>` 里只能放这 7 类元素

| 元素 | 作用 |
| --- | --- |
| `<meta>` | 字符编码、视口、SEO、社交、主题色等元数据 |
| `<title>` | 文档标题（**有且仅一个**） |
| `<link>` | 外部资源关系：样式表、图标、canonical、preload… |
| `<style>` | 内联 CSS |
| `<base>` | 相对 URL 的基准（每页最多一个） |
| `<script>` | 脚本（含 `type="application/ld+json"` 结构化数据） |
| `<noscript>` | 禁用脚本时的回退内容 |

把任何「可见内容」元素（如 `<div>`、`<p>`）放进 `<head>`，浏览器会**自动结束 `<head>`、开始 `<body>`**，常导致其后的 meta 失效。

## 顺序为什么重要

浏览器是**自上而下边下载边解析**的，`<head>` 的顺序直接影响行为：

1. `charset` 必须最先，否则前面的字节可能已被错误解码；
2. `viewport` 早一点，避免移动端先按错误宽度排版再回流；
3. `preconnect` / `preload` 越早，越能与 HTML 解析并行抢跑；
4. 阻塞渲染的 `<link rel="stylesheet">` 放 `<head>`，让首帧就带样式，避免无样式内容闪烁（FOUC）。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[文档骨架](./guide-line/document-skeleton)、[视口](./guide-line/charset-viewport)、[SEO](./guide-line/title-seo-meta)、[社交卡片](./guide-line/social-metadata)、[link](./guide-line/link-relations)、[资源提示](./guide-line/resource-hints)。
