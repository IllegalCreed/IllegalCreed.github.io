---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Search Central（developers.google.com/search/docs）与 Open Graph 协议（ogp.me）官方文档编写，对照 2026 年活跃版本

## 速查

- **title**：经验值 50–60 字符；Google 无硬上限按设备宽度截断；不佳 title 会被改写
- **meta description**：经验值 150–160 字符；Google 主要用页面内容生成 snippet
- **heading**：每页唯一 `<h1>`，`<h2>`–`<h6>` 组织层级；非关键排名因素但利于 a11y
- **URL slug**：连字符 `-` 分词（非下划线 `_`）；大小写敏感
- **image alt**：描述性 alt + 装饰图空 `alt=""`；CSS background-image 不被索引
- **OG 必需四件套**：`og:title` / `og:type` / `og:image` / `og:url`
- **OG 推荐**：`og:image` 1200×630，提供 `og:image:width` / `height` / `alt`
- **Twitter Card**：`twitter:card`（`summary` / `summary_large_image`）+ title / description / image
- **snippet 控制**：`nosnippet` / `max-snippet:[number]` / `data-nosnippet`
- **搜索意图**：informational / navigational / commercial / transactional
- 完整说明见 [入门](./getting-started.md) / [核心指南](./guide-line.md)

## 标签规范速查表

| 元素 | 经验长度 | 官方硬上限 | 关键约束 |
| --- | --- | --- | --- |
| `<title>` | 50–60 字符（≈600px） | **无**（按设备宽度截断） | 每页唯一、主关键词前置、避免模板化 |
| `<meta name="description">` | 150–160 字符 | **无**（Google 按内容截断） | 每页唯一、自然句子、避免关键词列表 |
| `<h1>` | 不限 | 不限 | **每页唯一**（第一个可见 H1 是主标题） |
| `<h2>`–`<h6>` | 不限 | 不限 | 用层级组织内容，避免跳级 |
| URL slug | 简短（建议 ≤ 5 词） | 无 | 连字符 `-` 分词、统一大小写 |
| `alt` | 描述性（建议 ≤ 125 字符） | 无 | 描述性 + 结合上下文；装饰图空 `alt=""` |
| `og:title` | 同 `<title>` 经验 | 无 | 与 `<title>` 可不同（社交专用） |
| `og:description` | 同 meta description 经验 | 无 | 社交专用描述 |
| `twitter:title` | 同 `<title>` 经验 | 无 | 与 `<title>` / `og:title` 可不同 |
| `twitter:description` | 同 meta description 经验 | 无 | 社交专用描述 |

## heading 层级规则

| 规则 | 说明 |
| --- | --- |
| 每页唯一 `<h1>` | 第一个可见 H1 是主标题；多个视觉权重相同的 H1 会让 Google 困惑 |
| 用 `<h2>`–`<h6>` 组织 | 像目录一样分层，不跳级（`<h1>` 直接到 `<h3>` 是反模式） |
| heading 文本描述性 | 概括这一段讲什么 |
| 非严格排名因素 | Google 官方表示严格层级不是关键排名因素，但利于 a11y |
| 主标题位置 | 放第一个可见 `<h1>`，不要埋在 hero 图深处 |

## URL slug 规则

| 规则 | 官方依据 |
| --- | --- |
| 连字符 `-` 分词 | Google 官方明确推荐连字符而非下划线 `_` |
| 描述性 | 让用户和搜索引擎从 URL 猜到内容 |
| 简短 | 冗长 ID / 参数型 URL 难理解且浪费抓取预算 |
| 统一大小写 | Google 视 URL 为**大小写敏感**（`/APPLE` ≠ `/apple`） |
| 含目标关键词 | 但不要堆砌 |
| 用 `rel="canonical"` 合并重复 | 带 / 不带 www、参数变体、tracking 参数 |

## image alt 规则

| 场景 | 处理 |
| --- | --- |
| 内容图（图表 / 截图 / 示意图） | 描述性 alt + 结合上下文 + 提供 `width` / `height` |
| 装饰图（分隔线 / 背景） | 空 `alt=""`（屏幕阅读器跳过） |
| 内容图嵌入方式 | `<img src>` 或 `<picture>` + `<source>` + `srcset` |
| **禁止** CSS `background-image` | Google 明确不索引 CSS 图片 |
| 图片文件名 | 描述性（`on-page-seo-title-tag.png` 而非 `IMG_42.png`） |

## Open Graph 完整属性表

### 必需属性（四件套）

| 属性 | 作用 | 示例 |
| --- | --- | --- |
| `og:title` | 分享卡片标题 | `页面 SEO 完全指南` |
| `og:type` | 内容类型 | `website` / `article` / `video.movie` / `profile` / `book` |
| `og:image` | 分享卡片图片 URL | `https://example.com/og/on-page-seo.png` |
| `og:url` | 页面规范 URL（canonical） | `https://example.com/zh/seo/on-page-seo/` |

### 可选 / 结构化属性

| 属性 | 作用 |
| --- | --- |
| `og:description` | 简短描述 |
| `og:site_name` | 站点名（如 `Example`） |
| `og:locale` | 语言区域（如 `zh_CN`、`en_US`） |
| `og:image:url` | 图片 URL（同 `og:image`） |
| `og:image:secure_url` | HTTPS 图片 URL |
| `og:image:type` | 图片 MIME（如 `image/png`、`image/jpeg`） |
| `og:image:width` | 图片宽度（px），避免社交平台异步测尺寸 |
| `og:image:height` | 图片高度（px） |
| `og:image:alt` | 图片描述（a11y） |

### og:type 取值

| 取值 | 适用 |
| --- | --- |
| `website` | 默认 / 通用网站 |
| `article` | 文章 / 博客 |
| `video.movie` | 电影 |
| `video.episode` | 剧集 |
| `video.tv_show` | 电视节目 |
| `video.other` | 其他视频 |
| `profile` | 个人主页 |
| `book` | 书籍 |
| `music.song` / `music.album` / `music.playlist` | 音乐 |

### og:image 推荐规格

| 项 | 推荐值 |
| --- | --- |
| 尺寸 | 1200×630 |
| 宽高比 | 1.91:1 |
| 文件大小 | ≤ 5 MB |
| 格式 | JPG / PNG / WebP |
| 提供 `og:image:width` / `height` | 是（避免社交平台异步 fetch 测尺寸） |

## Twitter Card 完整属性表

| 标签 | 作用 | 必需性 |
| --- | --- | --- |
| `twitter:card` | 卡类型 | **必需** |
| `twitter:title` | 卡片标题 | summary_large_image 必需 |
| `twitter:description` | 卡片描述 | 推荐 |
| `twitter:image` | 卡片图片 | summary_large_image 必需 |
| `twitter:image:alt` | 图片描述 | 推荐 |
| `twitter:site` | 站点 `@username` | 可选 |
| `twitter:creator` | 作者 `@username` | 可选 |

### twitter:card 取值

| 取值 | 说明 |
| --- | --- |
| `summary` | 小图（正方形，约 144×144） |
| `summary_large_image` | 大图（约 1200×628 / 1200×675，2:1） |
| `player` | 视频 / 音频播放器 |
| `app` | 移动应用 |

### summary_large_image 推荐图规格

| 项 | 推荐值 |
| --- | --- |
| 尺寸 | 1200×628（部分文档 1200×675） |
| 宽高比 | 约 2:1 |
| 文件大小 | ≤ 5 MB |
| 格式 | JPG / PNG / WebP |

## snippet 控制机制

| 机制 | 作用 | 示例 |
| --- | --- | --- |
| `<meta name="robots" content="nosnippet">` | 整页不显示 snippet | 全页无摘要 |
| `<meta name="robots" content="max-snippet:160">` | 限制 snippet 字符数 | 最多 160 字符 |
| `<meta name="robots" content="max-image-preview:large">` | 限制预览图尺寸 | none / standard / large |
| `<meta name="robots" content="max-video-preview:30">` | 限制视频预览秒数 | 30 秒 |
| `<span data-nosnippet>` | 元素级不出现在 snippet | 该段被跳过 |

## 搜索意图分类

| 意图 | 用户在找什么 | 典型查询 | 页面策略 |
| --- | --- | --- | --- |
| **informational**（求知） | 学习 / 了解某概念 | `什么是页面 SEO` | 教程体 + 定义 + 示例 |
| **navigational**（导航） | 找特定站点 / 页面 | `moz seo guide` | 品牌词落地页 |
| **commercial**（比较） | 比较多个选项 | `best seo tools 2026` | 对比表 + 评测 |
| **transactional**（交易） | 准备购买 / 下载 | `buy ahrefs subscription` | 突出 CTA + 价格 |

## 指定首选预览图的两种途径

| 途径 | 作用范围 | 官方依据 |
| --- | --- | --- |
| `og:image` meta 标签 | 社交平台预览 | ogp.me 协议 |
| schema.org `primaryImageOfPage` | Google Discover / 搜索预览 | schema.org / JSON-LD |
| schema.org `mainEntityOfPage` | 页面主体首选图 | schema.org / JSON-LD |

> Google 官方同时支持 OG 与 schema.org 两种元数据来源，二者并用提高命中率。

## Google title link 改写触发条件

| 触发条件 | 说明 |
| --- | --- |
| 半空标题 | `<title>` 缺失或过短 |
| 过时标题 | 内容已更新但 title 没改 |
| 不准确 | title 与内容不符 |
| micro-boilerplate | 多页面 title 仅微小差异 |
| 无明确主标题 | 多个视觉权重相同的大标题 |
| 书写系统 / 语言不匹配 | title 用拉丁字母但内容是西里尔字母等 |

## 完整 `<head>` 模板

```html
<head>
  <!-- 基础 -->
  <title>页面 SEO 完全指南：title 与 meta description 最佳实践 - Example</title>
  <meta name="description" content="页面 SEO 完全指南：title、meta description、heading、URL slug、image alt、Open Graph 的官方最佳实践，附反模式与示例。">
  <link rel="canonical" href="https://example.com/zh/seo/on-page-seo/">

  <!-- Open Graph -->
  <meta property="og:title" content="页面 SEO 完全指南">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/zh/seo/on-page-seo/">
  <meta property="og:image" content="https://example.com/og/on-page-seo.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="页面 SEO 三支柱示意图">
  <meta property="og:description" content="title、meta description、heading、URL slug、image alt、Open Graph 的官方最佳实践">
  <meta property="og:site_name" content="Example">
  <meta property="og:locale" content="zh_CN">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="页面 SEO 完全指南">
  <meta name="twitter:description" content="title、meta description、heading、URL slug、image alt、Open Graph 的官方最佳实践">
  <meta name="twitter:image" content="https://example.com/og/on-page-seo.png">
  <meta name="twitter:image:alt" content="页面 SEO 三支柱示意图">
  <meta name="twitter:site" content="@example">
</head>
```

## 版本与状态

| 项 | 状态 |
| --- | --- |
| Google Search Central title-link 页 | 2025-12-10 更新 |
| Google Search Central snippet 页 | 2026-04-20 更新 |
| Google Search Central url-structure 页 | 2025-12-10 更新 |
| Google Search Central google-images 页 | 2026-03-02 更新 |
| Open Graph 协议（ogp.me） | 核心四属性长期稳定 |
| X (Twitter) Card | Card Validator 已失效，`twitter:*` 标签仍是事实标准 |
| 「LSI 关键词」 | Google John Mueller 公开否认使用 LSI 技术 |
| title 50–60 字符 | 行业 CTR 经验，非 Google 硬性规则 |

## 官方资源

- 控制搜索结果中的摘要（meta description）：[https://developers.google.com/search/docs/appearance/snippet](https://developers.google.com/search/docs/appearance/snippet)
- 影响搜索结果中的标题链接（title link）：[https://developers.google.com/search/docs/appearance/title-link](https://developers.google.com/search/docs/appearance/title-link)
- URL 结构最佳实践：[https://developers.google.com/search/docs/crawling-indexing/url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- Google 图片 SEO：[https://developers.google.com/search/docs/appearance/google-images](https://developers.google.com/search/docs/appearance/google-images)
- 让链接可抓取（内部链接 / 锚文本）：[https://developers.google.com/search/docs/crawling-indexing/links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- Open Graph 协议（ogp.me）：[https://ogp.me/](https://ogp.me/)
- X (Twitter) Cards：[https://docs.x.com/](https://docs.x.com/)
- schema.org primaryImageOfPage：[https://schema.org/primaryImageOfPage](https://schema.org/primaryImageOfPage)
- schema.org mainEntityOfPage：[https://schema.org/mainEntityOfPage](https://schema.org/mainEntityOfPage)
