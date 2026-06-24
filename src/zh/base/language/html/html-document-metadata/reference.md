---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<head>` 七类合法子元素：`<meta>`、`<title>`、`<link>`、`<style>`、`<base>`、`<script>`、`<noscript>`
- 三条铁律：`<!DOCTYPE html>` 触发标准模式；`<meta charset="utf-8">` 在前 1024 字节内；`<meta name="viewport">` 必写
- 顺序：`charset` → `viewport` → `title` → 其余 `meta` → CSS / `preload`
- 描述非排名因素但作摘要；`keywords` 已废；`canonical` 用绝对 URL
- 社交：Open Graph 四件套（`og:title/type/image/url`）+ 一行 `twitter:card`，图 1200×630 带 `alt`
- 资源提示：`preload` 必带 `as`、字体加 `crossorigin`；`preconnect` 连第三方源
- 暗色：`color-scheme`（默认 UI）+ `theme-color`（浏览器 UI）+ CSS `prefers-color-scheme`（页面）
- 无障碍红线：别 `user-scalable=no`；别 `http-equiv="refresh"`

## 完整 `<head>` 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

    <title>页面标题 · 站点名</title>
    <meta name="description" content="约 150 字的页面摘要。" />
    <link rel="canonical" href="https://example.com/page" />

    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />

    <meta property="og:title" content="页面标题" />
    <meta property="og:description" content="分享描述" />
    <meta property="og:image" content="https://example.com/og.png" />
    <meta property="og:url" content="https://example.com/page" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/css/main.css" />
  </head>
  <body>
    <script type="module" src="/js/app.js"></script>
  </body>
</html>
```

## `<meta name>` 速查

| `name` | 用途 |
| --- | --- |
| `viewport` | 响应式视口 |
| `description` | 搜索摘要 |
| `robots` | 爬虫指令（`index`/`noindex`、`follow`/`nofollow`…） |
| `theme-color` | 浏览器 UI 颜色（可带 `media`） |
| `color-scheme` | 默认 UI 明暗 |
| `author` / `generator` | 作者 / 生成工具 |
| `referrer` | `Referer` 头策略 |
| `format-detection` | `telephone=no` 关闭自动电话链接 |
| `keywords` | 已被主流引擎忽略（不必写） |

## `<meta http-equiv>` 速查

| `http-equiv` | 用途 | 现状 |
| --- | --- | --- |
| `content-security-policy` | CSP | 能力弱于 HTTP 头，优先用真头 |
| `refresh` | 定时刷新 / 跳转 | 伤无障碍，避免 |
| `x-ua-compatible` | IE 兼容 | IE 退役，删除 |

## `<link rel>` 速查

| `rel` | 用途 |
| --- | --- |
| `stylesheet` | 样式表（`media` 条件、`disabled` 开关） |
| `icon` / `apple-touch-icon` / `mask-icon` | 图标 |
| `canonical` | 规范 URL |
| `alternate` | 多语言（`hreflang`）/ RSS / 备用样式 |
| `manifest` | PWA 清单 |
| `preload` / `preconnect` / `prefetch` / `dns-prefetch` / `modulepreload` | 资源提示 |
| `author` / `license` / `me` / `search` / `help` | 文档元信息 / 身份 |

## Open Graph / Twitter 速查

| 属性 | 说明 |
| --- | --- |
| `og:title` / `og:type` / `og:image` / `og:url` | OG 四件套（必需） |
| `og:description` / `og:site_name` / `og:locale` | OG 可选 |
| `og:image:width` / `:height` / `:alt` | 图片结构化（1200×630，带 alt） |
| `article:*` / `profile:*` / `video:*` | 按 `og:type` 的扩展属性 |
| `twitter:card` | `summary` / `summary_large_image` / `player` / `app` |
| `twitter:site` / `twitter:creator` | 站点 / 作者账号；其余缺省回退 OG |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `color-scheme`（meta / CSS） | ✅ Baseline 广泛可用 | 放心用 |
| `viewport-fit=cover` | ✅ 广泛可用 | 放心用 |
| `modulepreload` | ✅ Baseline（2023 起广泛） | 放心用 |
| `theme-color`（含 `media`） | 🟡 渐进增强 | 移动端 + Safari 15+ 支持，桌面 Firefox 忽略 |
| `fetchpriority` | 🟡 Baseline 新近可用（2024） | 锦上添花，老浏览器忽略 |
| `interactive-widget` | 🟡 Chromium，渐进增强 | 渐进增强 |
| `blocking="render"` | 🟠 Chromium-only | 非 Baseline，谨慎依赖 |
| Speculation Rules API | 🟠 仅 Chromium，**非 Baseline** | 纯渐进增强，必须能降级 |

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Document metadata](https://html.spec.whatwg.org/multipage/semantics.html#document-metadata)
- [MDN: `<meta>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta) · [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link) · [`<base>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base)
- [Open Graph protocol](https://ogp.me/)

**课程 / 指南**

- [web.dev: Learn HTML — Document structure](https://web.dev/learn/html/document-structure) · [Metadata](https://web.dev/learn/html/metadata)
- [web.dev: Speculation Rules / Speculative loading](https://web.dev/learn/html/document-structure)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) · LinkedIn Post Inspector（社交卡片预览 / 清缓存）

## 相关页

- [入门](./getting-started) · [文档骨架与渲染模式](./guide-line/document-skeleton) · [字符编码与视口](./guide-line/charset-viewport)
- [标题与 SEO 元数据](./guide-line/title-seo-meta) · [社交分享元数据](./guide-line/social-metadata)
- [`<link>` 关系全谱](./guide-line/link-relations) · [资源提示](./guide-line/resource-hints)
