---
layout: doc
outline: [2, 3]
---

# `<link>` 关系全谱

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<link>` 靠 `rel` 表达「这是什么关系」，是 `<head>` 里数量最多的元素
- 样式表：`<link rel="stylesheet" href media>`；用 `media` 条件加载，`disabled` 运行时开关
- 图标：`rel="icon"`（配 `sizes` / `type`）、`apple-touch-icon`、Safari `mask-icon`
- 文档关系：`canonical`、`alternate`（多语言 `hreflang` / RSS / 备用样式）、`author` / `license` / `me` / `search`
- PWA：`rel="manifest"`
- 资源提示（`preload` / `preconnect` / `prefetch` / `dns-prefetch` / `modulepreload`）单独成页 → [资源提示](./resource-hints)
- `rel` 可多值：`<link rel="alternate stylesheet">`
- 非阻塞 CSS 技巧：`media="print" onload="this.media='all'"`

## `<link>` 的角色

`<link>` 建立当前文档与**外部资源**的关系，绝大多数只能放在 `<head>`。核心属性：

| 属性 | 用途 |
| --- | --- |
| `rel` | 关系类型（**必需**，决定这条 link 干什么） |
| `href` | 资源 URL |
| `type` | MIME 类型，如 `text/css`、`image/svg+xml` |
| `media` | 媒体查询，条件加载 |
| `sizes` | 图标尺寸 |
| `crossorigin` | CORS 模式（`anonymous` / `use-credentials`） |
| `integrity` | 子资源完整性校验（SRI 哈希） |
| `disabled` | 仅样式表：禁用 / 启用 |

## 样式表 `stylesheet`

```html
<link rel="stylesheet" href="/css/main.css" />
```

放在 `<head>` 的样式表**阻塞渲染**——浏览器会等它下载解析完再画首帧，以避免无样式内容闪烁（FOUC）。围绕它有几个实用技巧：

### 用 `media` 条件加载

```html
<link rel="stylesheet" href="print.css" media="print" />
<link rel="stylesheet" href="wide.css" media="(min-width: 1024px)" />
<link rel="stylesheet" href="dark.css" media="(prefers-color-scheme: dark)" />
```

不匹配 `media` 的样式表浏览器仍会下载，但**不阻塞渲染**、优先级降低。由此衍生出经典的「非阻塞加载非关键 CSS」技巧：

```html
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'" />
```

先以 `print` 加载（不阻塞），加载完再用一行内联 JS 切回 `all` 生效。

### `disabled` 与备用样式表

```html
<!-- 运行时开关 -->
<link rel="stylesheet" href="theme-dark.css" disabled id="dark" />
<script>
  document.getElementById("dark").disabled = false; // 启用
</script>

<!-- 浏览器「页面样式」菜单里的备用主题（需 title） -->
<link rel="stylesheet" href="default.css" title="默认" />
<link rel="alternate stylesheet" href="high-contrast.css" title="高对比" />
```

## 图标 `icon`

```html
<!-- 经典回退（浏览器默认也会找 /favicon.ico） -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<!-- 矢量图标（现代浏览器优先） -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<!-- iOS 主屏快捷方式 -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<!-- macOS Safari 固定标签（单色 SVG + 颜色） -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#226DAA" />
```

现代极简组合：一个 `favicon.ico`（`sizes="any"` 做老浏览器回退）+ 一个 `favicon.svg`（矢量，自适应明暗）+ 一个 180×180 的 `apple-touch-icon`，基本就够。

## 文档关系类

```html
<!-- 规范 URL（详见「标题与 SEO 元数据」页） -->
<link rel="canonical" href="https://example.com/article" />

<!-- 多语言版本 -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="zh-Hans" href="https://example.com/zh/" />

<!-- RSS / Atom 订阅源 -->
<link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml" />

<!-- 作者 / 许可 / 身份 / 站内搜索 -->
<link rel="author" href="/about" />
<link rel="license" href="/license" />
<link rel="me" href="https://mastodon.social/@you" />
<link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" />
```

`prev` / `next` 曾用于标注分页序列，但 Google 已不再将其作为索引信号，价值有限，了解即可。

## PWA 清单 `manifest`

```html
<link rel="manifest" href="/site.webmanifest" />
```

指向一个 JSON 文件，集中声明 PWA 的应用级元数据——`name`、`short_name`、`icons`、`theme_color`、`background_color`、`display`、`start_url` 等。有了它，浏览器才允许「添加到主屏幕」并以独立窗口运行。它能替代一堆零散的 icon / theme 标签。

## `rel` 全谱速查

| `rel` | 用途 |
| --- | --- |
| `stylesheet` | 外部样式表 |
| `icon` / `apple-touch-icon` / `mask-icon` | 各类图标 |
| `canonical` | 规范 URL |
| `alternate` | 多语言 / RSS / 备用样式表 |
| `manifest` | PWA 清单 |
| `author` / `license` / `me` / `help` | 文档元信息 / 身份 |
| `search` | OpenSearch 描述 |
| `preload` / `preconnect` / `prefetch` / `dns-prefetch` / `modulepreload` | 资源提示 → [下一页](./resource-hints) |

## 小结

`<link>` 用一个 `rel` 属性扛起了样式、图标、SEO、多语言、PWA 等一大片职责。把其中与「性能」相关的那组（`preload` 一族）单独拎出来细讲——[资源提示](./resource-hints)。
