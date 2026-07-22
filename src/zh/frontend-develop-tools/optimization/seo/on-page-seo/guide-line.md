---
layout: doc
outline: [2, 3]
---

# 核心指南

> 基于 Google Search Central（developers.google.com/search/docs）与 Open Graph 协议（ogp.me）官方文档编写，对照 2026 年活跃版本

## 速查

- **title**：每页唯一、主关键词前置、经验值 50–60 字符；Google 无硬上限按设备宽度截断；不佳 title 会被改写
- **meta description**：每页唯一、自然句子、经验值 150–160 字符；写成关键词列表几乎不被采用
- **heading**：第一个可见 `<h1>` 是主标题（每页唯一 H1），`<h2>`–`<h6>` 组织层级；非严格排名因素但利于 a11y
- **关键词**：自然覆盖语义相关词（同义词 / 共现实体），围绕搜索意图组织；「LSI 关键词」已被 Google 否认
- **URL slug**：连字符 `-` 分词（非下划线 `_`），简短、描述性、含词、统一大小写（大小写敏感）
- **internal linking**：描述性锚文本（约 2–5 词），避免「点击这里 / read more」
- **image alt**：描述性 + 结合上下文；装饰图用 `alt=""`；内容图用 `<img src>`（CSS background-image 不被索引）
- **Open Graph 必需**：`og:title` / `og:type` / `og:image` / `og:url`；推荐 `og:image` 1200×630
- **Twitter Card**：`twitter:card`（summary / summary_large_image）+ title / description / image
- **snippet 控制**：`nosnippet`、`max-snippet:[number]`、`data-nosnippet`
- **反模式**：关键词堆砌、模板化 title、URL 下划线、CSS background-image、锚文本「点击这里」

## 一、title 标签（HTML `<title>` / title link）

### 是什么

`<title>` 是 HTML 头部的标题元素，是用户在 SERP 判断是否点击的**首要信息**。Google 把搜索结果中显示的标题称为「title link」，它**不一定**与 `<title>` 一一对应——Google 会综合以下来源生成：

- 页面 `<title>` 元素（首选）
- 页面主视觉标题（通常是第一个可见 `<h1>`）
- `<meta property="og:title">`
- 指向该页的**锚文本**
- WebSite 结构化数据中的 `name`

### 最佳实践

- **每页唯一且描述性**：避免全站复用同一 title，或多个页面 title 仅差一个字段（micro-boilerplate）
- **主关键词前置**：核心信息放前面，避免被 SERP 截断丢掉
- **经验值 50–60 字符（≈600px）**：行业 CTR 数据表明超长在 SERP 截断会丢失品牌词可见度
- **品牌词放后面**：`主标题 - 品牌名` 或 `主标题 | 品牌名`
- **匹配搜索意图**：title 应明确告诉用户这页解决什么问题

### Google 何时会改写 title

Google 2021 年起对 title link 生成策略做了重大调整，会更积极基于页面内容改写不佳的 `<title>`。触发改写的问题：

- 半空标题（title 缺失或过短）
- 过时标题（内容已更新但 title 没改）
- 不准确（title 与内容不符）
- micro-boilerplate（多页面 title 仅微小差异）
- 无明确主标题（多个视觉权重相同的大标题）
- 书写系统 / 语言不匹配（title 用拉丁字母但内容是西里尔字母等）

### 重要事实：无字符硬上限

> Google 官方对 `<title>` **没有字符硬上限**——系统按设备宽度截断显示。50–60 字符是**行业 CTR 经验**而非官方排名规则。

### 示例

```html
<!-- 好：主关键词前置 + 品牌词 + 经验长度 -->
<title>页面 SEO 完全指南：title 与 meta description 最佳实践 - Example</title>

<!-- 坏：关键词堆砌 -->
<title>SEO, 页面SEO, On-page SEO, 网站优化, 搜索引擎优化 - Example</title>

<!-- 坏：模板化（全站复用） -->
<title>Example - 首页</title>
```

## 二、meta description（`<meta name="description">`）

### 是什么

meta description 是 HTML 头部描述页面内容的 meta 标签，Google 用它生成 SERP 中的 snippet（摘要）。但 **Google 主要用页面内容生成 snippet，仅在 meta description 更准确时采用**——可以把 meta description 理解为「SERP 上的广告文案」。

### 最佳实践

Google 官方四条最佳实践：

1. **每页唯一**：不同页面用不同描述
2. **包含关键信息**：价格、作者、日期、卖点等用户关心的具体信息
3. **可程序化生成高质量描述**：站点规模大时可用模板生成（如电商商品页），但仍需保证可读性
4. **避免关键词列表**：写成 `SEO, 页面SEO, On-page SEO` 这种关键词罗列几乎不被采用

- 经验值 **150–160 字符**：超长在 SERP 截断
- 自然句子：像给朋友介绍这页讲什么一样写

### snippet 控制三机制

| 机制 | 作用 |
| --- | --- |
| `<meta name="robots" content="nosnippet">` | 整页不显示 snippet |
| `<meta name="robots" content="max-snippet:0">` | 限制 snippet 字符数（0 = 不显示） |
| `<span data-nosnippet>` | 元素级：该段不出现在 snippet 中 |

### 示例

```html
<!-- 好：自然句子 + 关键信息 + 经验长度 -->
<meta name="description" content="页面 SEO 完全指南：title 标签、meta description、heading 层级、URL slug、image alt、Open Graph 的官方最佳实践，附反模式与示例。">

<!-- 坏：关键词列表 -->
<meta name="description" content="SEO, 页面SEO, On-page SEO, 网站优化, 搜索引擎优化教程">
```

## 三、heading 层级（`<h1>`–`<h6>`）

### 是什么

HTML 标题元素 `<h1>`–`<h6>` 表示内容层级。第一个可见的 `<h1>` 通常被 Google 视为页面**主标题**，是 title link 的来源之一。

### 最佳实践

- **每页唯一 H1**：第一个可见 `<h1>` 是主标题，避免多个视觉权重相同的大标题
- **用 `<h2>`–`<h6>` 组织层级**：像目录一样分层，不要跳级（`<h1>` 直接到 `<h3>`）
- **主标题放第一个可见 `<h1>`**：而不是埋在 hero 图深处
- **heading 文本要描述性**：概括这一段讲什么

### 官方态度：非关键排名因素

> Google 官方表示「严格 H1–H6 层级顺序」**非关键排名因素**——但合理的语义层级利于无障碍（屏幕阅读器导航）与搜索引擎理解内容结构。主流做法仍是保持清晰层级。

### 反模式

```html
<!-- 坏：多个 H1 无明确主标题 -->
<h1>最新文章</h1>
<h1>2026 年 7 月</h1>
<h1>页面 SEO 指南</h1>

<!-- 坏：用 <b> 或 <strong> 假装标题 -->
<b>页面 SEO 指南</b>  <!-- 应该用 <h1> -->

<!-- 好：唯一 H1 + 清晰层级 -->
<h1>页面 SEO 完全指南</h1>
<h2>title 标签</h2>
<h3>最佳实践</h3>
```

## 四、关键词策略与搜索意图

### 搜索意图四分类

| 意图 | 用户在找什么 | 典型查询 |
| --- | --- | --- |
| **informational**（求知） | 学习 / 了解某概念 | `什么是页面 SEO` |
| **navigational**（导航） | 找特定站点 / 页面 | `moz seo guide` |
| **commercial**（比较） | 比较多个选项 | `best seo tools 2026` |
| **transactional**（交易） | 准备购买 / 下载 | `buy ahrefs subscription` |

页面内容应围绕其目标意图组织——informational 页用教程体，commercial 页用对比表，transactional 页突出 CTA。

### 语义相关词 vs LSI 关键词

- **「LSI 关键词」已被 Google John Mueller 公开否认**：Google 不使用 LSI（Latent Semantic Indexing）技术
- 正确做法：**自然覆盖语义相关词**（同义词、共现实体）——Google 用语义与实体理解主题
- 写作时问自己：用户搜这个主题时还会搜哪些相关词？把这些词自然融入即可

### 反模式

- **关键词堆砌**：在 title / alt / meta description 中重复塞满关键词变体，Google 视为垃圾体验
- **机械堆砌「LSI 关键词」**：把工具列出的「LSI 词」硬塞进内容，破坏可读性
- **忽视搜索意图**：用 transactional 页面去抢 informational 查询，转化率低

## 五、URL slug

### 是什么

URL slug 是 URL 中描述页面身份的最后一段，如 `/zh/frontend-develop-tools/optimization/seo/on-page-seo/` 中的 `on-page-seo`。

### 最佳实践

- **用连字符 `-` 分词**：Google 官方明确推荐连字符而非下划线（`_`）
- **描述性**：让用户和搜索引擎从 URL 就能猜到内容
- **简短**：冗长 ID / 参数型 URL 难以理解且浪费抓取预算
- **含目标关键词**：但不要堆砌
- **统一大小写**：Google 把 URL 视为**大小写敏感**（`/APPLE` 与 `/apple` 是不同 URL）
- **用 `rel="canonical"` 合并重复**：带 / 不带 www、参数变体、tracking 参数

### 连字符 vs 下划线（官方理由）

> Google 推荐连字符因为下划线 `_` 在编程语言里表示「不可分概念」（如 `my_variable`），连字符 `-` 则帮助用户和搜索引擎识别概念边界（如 `my-variable`）。

### 反模式

```text
# 坏：下划线
/zh/seo/on_page_seo

# 坏：冗长数字 ID
/index.php?topic=42&area=3a5ebc9

# 坏：大小写混用
/zh/SEO/OnPageSEO

# 好：连字符 + 简短 + 含词
/zh/seo/on-page-seo
```

## 六、内部链接（internal linking）与锚文本

### 是什么

内部链接是站点内页面之间的 `<a href>` 链接。**锚文本**（anchor text）是 `<a>` 元素内的可见文本，是 Google 理解目标页主题与生成 title link 的来源之一。

### 最佳实践

- **描述性锚文本**：约 2–5 词，概括目标页主题
- **避免「点击这里 / 更多 / read more」**：搜索引擎无法从锚文本理解目标页主题
- **合理的内链深度**：重要页面应在 2–3 次点击内可达
- **让链接可抓取**：用普通 `<a href>`，不用 JS onclick 跳转（Google 可能不执行）

### 示例

```html
<!-- 好：描述性锚文本 -->
<a href="/zh/seo/meta-description/">meta description 最佳实践</a>

<!-- 坏：无信息量锚文本 -->
<a href="/zh/seo/meta-description/">点击这里</a>
<a href="/zh/seo/meta-description/">了解更多</a>
```

## 七、image alt 与图片 SEO

### 是什么

`alt` 属性是 `<img>` 元素的替代文本，Google 称 alt 是**图片最重要的元数据**，同时服务图片搜索 SEO 与无障碍（屏幕阅读器 / 低带宽用户）。

### 最佳实践

- **描述性 + 结合上下文**：alt 应描述图片在当前上下文中的作用，不是孤立地命名图片
- **纯装饰图用空 `alt=""`**：告诉屏幕阅读器跳过该图
- **内容图用 `<img src>`**：Google **不索引 CSS `background-image`**
- **提供 `width` / `height`**：避免布局偏移（CLS）
- **图片文件名描述性**：`on-page-seo-title-tag.png` 而非 `IMG_42.png`
- **贴近相关正文**：图片周围的文本帮助 Google 理解图片主题

### 反模式

```html
<!-- 坏：关键词堆砌 -->
<img src="dog.jpg" alt="dog puppy puppies dog photos cute dogs">

<!-- 坏：用 CSS background-image 展示内容图 -->
<div style="background-image: url('hero.jpg')"></div>

<!-- 坏：缺失 alt -->
<img src="chart.png">

<!-- 好：描述性 alt + 尺寸 -->
<img src="title-tag-anatomy.png" alt="title 标签在 SERP 中的显示位置示意图" width="1200" height="630">

<!-- 好：纯装饰图空 alt -->
<img src="divider.png" alt="">
```

## 八、Open Graph 与 Twitter Card

### Open Graph 协议（ogp.me）

Open Graph 协议由 Facebook 提出，现已是 Facebook / LinkedIn / WhatsApp 等社交平台预览的**事实标准**。

**四个必需属性**：

| 属性 | 作用 |
| --- | --- |
| `og:title` | 分享卡片标题 |
| `og:type` | 内容类型（`website` / `article` / `video.movie` / `profile` / `book`） |
| `og:image` | 分享卡片图片 URL |
| `og:url` | 页面规范 URL（canonical） |

**可选 / 结构化属性**：

| 属性 | 作用 |
| --- | --- |
| `og:description` | 简短描述 |
| `og:site_name` | 站点名 |
| `og:locale` | 语言区域（如 `zh_CN`） |
| `og:image:url` | 图片 URL（同 `og:image`） |
| `og:image:secure_url` | HTTPS 图片 URL |
| `og:image:type` | 图片 MIME（如 `image/png`） |
| `og:image:width` / `og:image:height` | 图片尺寸（避免社交平台异步 fetch 测尺寸） |
| `og:image:alt` | 图片描述 |

**推荐尺寸**：1200×630（1.91:1），≤5MB。

### Twitter Card（X Card）

X（前 Twitter）Card 标签控制分享到 X 的链接预览。`twitter:*` 标签名与卡类型是事实标准（Card Validator 已失效，X 仍据此渲染预览）。

**主要标签**：

| 标签 | 作用 |
| --- | --- |
| `twitter:card` | 卡类型：`summary`（小图）或 `summary_large_image`（大图） |
| `twitter:title` | 卡片标题 |
| `twitter:description` | 卡片描述 |
| `twitter:image` | 卡片图片 |
| `twitter:image:alt` | 图片描述 |

**推荐尺寸**：`summary_large_image` 约 1200×628（部分文档 1200×675），约 2:1，≤5MB。

### 完整示例

```html
<head>
  <!-- Open Graph -->
  <meta property="og:title" content="页面 SEO 完全指南">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/zh/seo/on-page-seo/">
  <meta property="og:image" content="https://example.com/og/on-page-seo.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="页面 SEO 三支柱示意图">
  <meta property="og:description" content="title、meta description、heading、URL slug、image alt、Open Graph 的官方最佳实践">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="页面 SEO 完全指南">
  <meta name="twitter:description" content="title、meta description、heading、URL slug、image alt、Open Graph 的官方最佳实践">
  <meta name="twitter:image" content="https://example.com/og/on-page-seo.png">
</head>
```

### 指定首选预览图

避免 Google Discover / 社交平台选错图或用站点 logo 的两种途径：

1. **`og:image` meta 标签**：社交平台预览
2. **schema.org `primaryImageOfPage` 或 `mainEntityOfPage`**：JSON-LD 指定首选图（属结构化数据章，本章只点到接口）

## 反模式（避坑）

- **关键词堆砌**：在 title / alt / meta description 中重复塞满关键词变体（如 `Foobar, foo bar, foobars` 或 alt 里罗列 `dog/puppy/pups`），Google 视为垃圾体验会改写 title 或降权
- **模板化 / 样板 title**：全站复用同一标题，或多个页面 title 仅差一个字段（micro-boilerplate），用户无法区分页面
- **meta description 复用或写成关键词列表**：同一描述用于所有页面，或仅列关键词而非句子，几乎不被采用为 snippet
- **URL 用下划线 / 拼接连词 / 冗长数字 ID**：如 `summer_clothing` 或 `index.php?topic=42&area=3a5ebc9`
- **用 CSS `background-image` 展示内容图**：Google 明确不索引 CSS 图片，应改用 `<img src>`
- **用 robots.txt 阻止爬取以为能阻止索引**：被链接到的页面仍可能被索引；要阻止索引应用 `noindex`
- **锚文本写「点击这里 / 更多 / read more」**：搜索引擎无法从锚文本理解目标页主题
- **页面有多个视觉权重相同的 `<h1>`**：Google 不清楚哪个是主标题，可能误选 title link
- **为同一页面指定不同 canonical**，或用 robots.txt / URL 移除工具做 canonicalization：违反 Google canonical 最佳实践
- **og:image 用站点 logo 或极端宽高比、低分辨率图**：被视为通用图，社交 / Discover 预览效果差
- **误把 title 50–60 字符当作 Google 硬性排名规则**：官方对 `<title>` 无字符上限，截断只为显示宽度
- **盲目堆砌「LSI 关键词」**：Google John Mueller 公开否认使用 LSI 技术

## 下一步

- [参考](./reference.md)：标签规范表（title 长度 / meta 长度 / heading）、OG 完整属性表、官方资源链接
