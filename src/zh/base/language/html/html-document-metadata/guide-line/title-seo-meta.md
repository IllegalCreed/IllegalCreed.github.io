---
layout: doc
outline: [2, 3]
---

# 标题与 SEO 元数据

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<title>`：每页唯一、语义明确，约 50～60 字符；标签页 / 收藏 / 搜索结果 / 分享卡片都用它
- `<meta name="description">`：约 150～160 字符；**非排名因素**，但常作搜索摘要、影响点击率
- `<meta name="keywords">`：主流搜索引擎**已忽略**，可省
- `<meta name="robots" content="…">`：`index`/`noindex`、`follow`/`nofollow`、`noarchive`、`nosnippet`、`max-snippet:-1`、`max-image-preview:large`
- `<link rel="canonical" href="绝对URL">`：指定权威 URL，防重复内容
- `<meta name="theme-color">`：浏览器 UI 上色，可带 `media`（渐进增强）
- `<meta name="color-scheme" content="light dark">`：让默认 UI（表单 / 滚动条 / 根背景）跟随明暗
- 其他：`author` / `generator` / `referrer` / `format-detection=telephone=no`
- `http-equiv`：`refresh`（避免）、`content-security-policy`（优先用 HTTP 头）、`x-ua-compatible`（IE 退役，无意义）

## `<title>`：页面的名字

```html
<title>HTML 文档结构与元数据 · IllegalCreed</title>
```

`<title>` 是 `<head>` 里唯一**必需**的非 `meta` 元素，出现在：浏览器标签页、收藏夹、历史记录、搜索结果标题、社交分享卡片标题。要点：

- **每页唯一**：别整站一个标题；用「页面主题 · 站点名」的格式兼顾可读与品牌；
- **长度**：搜索结果一般在 ~60 字符后截断，把最重要的词放前面；
- **不要塞关键词**：堆砌关键词既难看又可能被判作弊。

## 描述与关键词

```html
<meta name="description" content="讲清 HTML <head> 里的字符编码、视口、SEO 与社交元数据该怎么写。" />
```

`description` **不直接参与排名**，但搜索引擎常拿它当结果摘要（snippet）。写一段 150～160 字符、准确概括本页的话，能显著提升点击率。若不写，搜索引擎会从正文里自己截一段，往往不如手写的好。

`keywords` 这个 meta 早已被 Google 等主流引擎忽略（因为历史上被滥用），**新页面不必写**。

## 爬虫指令 `robots`

```html
<!-- 不收录此页，也不跟随其链接 -->
<meta name="robots" content="noindex, nofollow" />
```

控制搜索引擎爬虫对**本页**的行为（全站规则用根目录的 `robots.txt`）。常用取值：

| 取值 | 含义 |
| --- | --- |
| `index` / `noindex` | 是否收录此页 |
| `follow` / `nofollow` | 是否跟随页面内链接 |
| `noarchive` | 不提供网页快照 |
| `nosnippet` | 不显示摘要 / 视频预览 |
| `noimageindex` | 不索引页面里的图片 |
| `max-snippet:-1` | 摘要长度不限（`-1`）或限定字符数 |
| `max-image-preview:large` | 允许大图预览 |

默认就是 `index, follow`，无需显式声明。可用 `<meta name="googlebot">` 对特定爬虫单独下指令。

::: warning `noindex` 必须能被爬到
靠 `<meta name="robots" content="noindex">` 让页面不被收录的前提是——别同时在 `robots.txt` 里 `Disallow` 它。爬虫被 `robots.txt` 挡在门外就读不到这条 meta，反而可能凭外链收录该 URL。
:::

## 规范链接 `canonical`

```html
<link rel="canonical" href="https://example.com/article" />
```

当同一份内容能通过多个 URL 访问（带 `?utm_*` 参数、`http`/`https`、带不带 `www`、带不带尾斜杠），`canonical` 告诉搜索引擎「哪个是权威版本」，把排名信号集中过去，避免重复内容稀释。务必用**绝对 URL**。

## 主题色与配色方案

### `theme-color`

```html
<meta name="theme-color" content="#226DAA" />
<!-- 按系统明暗给不同值 -->
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />
```

给浏览器 UI（移动端地址栏、PWA 标题栏、任务切换器）上色。支持 `media` 属性按明暗模式给不同颜色。这是**渐进增强**：移动浏览器与 Safari 15+ 支持，不支持的（如桌面 Firefox）直接忽略，无副作用。

### `color-scheme`

```html
<meta name="color-scheme" content="light dark" />
```

声明页面支持哪些配色，让浏览器把**默认 UI**——表单控件、滚动条、未设背景时的根背景——渲染成对应明暗。`light dark` 表示两者都支持、跟随系统。它已广泛可用（Baseline）。等价的 CSS 写法是 `:root { color-scheme: light dark; }`。

::: tip 配色双保险
`color-scheme` 管「浏览器自带的那部分」，你自己的页面配色仍要靠 CSS 的 `prefers-color-scheme` 媒体查询。两者配合，暗色模式才完整。
:::

## 其他常用 `name`

| `name` | 用途 | 示例 |
| --- | --- | --- |
| `author` | 文档作者 | `<meta name="author" content="张三">` |
| `generator` | 生成工具 | `<meta name="generator" content="VitePress">` |
| `referrer` | 控制 `Referer` 头发送策略 | `content="strict-origin-when-cross-origin"` |
| `format-detection` | 关掉移动端自动识别 | `content="telephone=no"` |

## `http-equiv`：模拟 HTTP 头

`http-equiv` 让 `<meta>` 模拟一个 HTTP 响应头。今天仍偶尔有用的只剩少数：

```html
<!-- 内容安全策略（能力弱于 HTTP 头，优先用真头） -->
<meta http-equiv="content-security-policy" content="default-src 'self'" />

<!-- 定时刷新 / 跳转：伤可访问性与体验，避免使用 -->
<meta http-equiv="refresh" content="5; url=https://example.com" />
```

- **`content-security-policy`**：可用 meta 设 CSP，但**功能受限**（不支持 `frame-ancestors`、`report-uri` 等），能用服务器 HTTP 头就别用 meta；
- **`refresh`**：自动刷新 / 跳转会打断屏幕阅读器、夺走用户控制权，**不要用**，重定向交给服务器 3xx；
- **`x-ua-compatible`（`IE=edge`）**：只为老 IE 服务，IE 早已退役，**删掉即可**。

## 小结

`<title>` 和 `description` 是搜索结果的门面，`robots` 与 `canonical` 控制收录，`theme-color` / `color-scheme` 让 UI 跟随主题。把这些写对，页面在搜索引擎和系统里的「第一印象」就稳了。下一页讲它在社交平台上的「第一印象」——[社交分享元数据](./social-metadata)。
