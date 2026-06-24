---
layout: doc
outline: [2, 3]
---

# 社交分享元数据

> 基于 Open Graph protocol + X Cards 文档 · 核于 2026-06

## 速查

- 链接被贴到微信 / X / Slack / Discord 时，对方爬虫读 `<head>` 里的 Open Graph / Twitter 标签生成预览卡
- Open Graph 用 `property` 属性（不是 `name`）；四个必需：`og:title`、`og:type`、`og:image`、`og:url`
- `og:image`：**绝对 URL**、推荐 **1200×630**（1.91:1）、配 `og:image:alt`
- `og:type`：`website`（默认）/ `article` / `profile` / `video.*` / `music.*`，各有扩展属性
- Twitter Card 用 `name="twitter:*"`；`twitter:card` 取 `summary` / `summary_large_image` / `player` / `app`
- Twitter 缺省会回退读 Open Graph，所以**通常只需补 `twitter:card`** 一行
- 改了标签平台不更新？是缓存——用各家调试器强制重抓
- 别忘 `og:image:alt`：社交卡片也要无障碍

## 为什么需要它

HTML 没有「分享预览」这种元素。社交平台是靠**自己的爬虫**去抓你页面的 `<head>`，找约定好的 meta 标签来拼出那张带标题、描述、大图的卡片。不写，分享出去就是一条干巴巴的纯链接。

两套约定占了绝大多数场景：**Open Graph**（Facebook 发起，如今微信、LinkedIn、Slack、Discord 等几乎都认）和 **Twitter/X Card**。

## Open Graph 基础四件套

Open Graph 的 meta 用 `property` 属性（注意不是 `name`），`content` 放值：

```html
<meta property="og:title" content="HTML 文档结构与元数据" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://example.com/og/html-meta.png" />
<meta property="og:url" content="https://example.com/html/metadata" />
```

这四个是**必需**的：

| 属性 | 含义 |
| --- | --- |
| `og:title` | 卡片标题（可与 `<title>` 不同，去掉站名更干净） |
| `og:type` | 对象类型，最常用 `website` / `article` |
| `og:image` | 预览大图，必须**绝对 URL** |
| `og:url` | 此内容的规范 URL（充当唯一 ID） |

可在 `<html>` 上声明命名空间前缀（多数平台容忍省略）：

```html
<html lang="zh-CN" prefix="og: https://ogp.me/ns#">
```

## `og:image` 的讲究

图片是卡片的视觉重心，最容易出问题：

```html
<meta property="og:image" content="https://example.com/og/cover.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="一张写着「HTML 文档结构与元数据」的封面图" />
```

- **绝对 URL**：必须带 `https://`，相对路径抓不到；
- **尺寸**：大卡推荐 **1200×630 px**（比例 1.91:1）；给出 `og:image:width` / `og:image:height` 能让平台先占位、少一次抖动；
- **`og:image:alt`**：图片的替代文本，社交卡片同样需要无障碍；
- 其余子属性：`og:image:secure_url`（HTTPS 版）、`og:image:type`（MIME，如 `image/png`）。

## `og:type` 与扩展属性

`og:type` 决定这条内容「是什么」，不同类型可追加结构化属性：

```html
<!-- 一篇文章 -->
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2026-06-24T08:00:00Z" />
<meta property="article:author" content="https://example.com/authors/zhang" />
<meta property="article:section" content="前端基础" />
```

| `og:type` | 常见扩展属性 |
| --- | --- |
| `website` | 仅基础四件套 |
| `article` | `article:published_time`、`article:author`、`article:section`、`article:tag` |
| `profile` | `profile:first_name`、`profile:last_name`、`profile:username` |
| `book` | `book:author`、`book:isbn`、`book:release_date` |
| `video.*` / `music.*` | `video:actor`、`video:duration`、`music:musician` 等 |

### 可选基础属性

`og:description`（一两句描述）、`og:site_name`（站点名）、`og:locale`（如 `zh_CN`，默认 `en_US`）、`og:locale:alternate`（其他可用语言）。

## Twitter / X Card

X 的卡片用 `name="twitter:*"`：

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="HTML 文档结构与元数据" />
<meta name="twitter:description" content="讲清 head 里该写什么、为什么。" />
<meta name="twitter:image" content="https://example.com/og/cover.png" />
<meta name="twitter:image:alt" content="封面图替代文本" />
<meta name="twitter:site" content="@yoursite" />
<meta name="twitter:creator" content="@author" />
```

`twitter:card` 的四种类型：

| 取值 | 效果 |
| --- | --- |
| `summary` | 小图 + 标题 + 描述 |
| `summary_large_image` | 大图卡（最常用） |
| `player` | 内嵌音视频播放器 |
| `app` | 移动应用下载卡 |

::: tip 通常只写一行 `twitter:card`
X 在缺少 `twitter:title` / `twitter:description` / `twitter:image` 时会**回退读对应的 Open Graph 标签**。所以只要你写好了 Open Graph，Twitter 这边往往**只需补一个 `twitter:card`** 指定卡片样式即可，不必整套重复。
:::

## 调试：为什么改了不生效

社交平台会**缓存**抓取结果，改完标签常常不会立刻更新。用各家官方调试器强制重新抓取并预览：

- **Facebook / 通用**：Sharing Debugger（`developers.facebook.com/tools/debug/`）
- **LinkedIn**：Post Inspector
- **通用预览**：第三方工具（如 opengraph.xyz）可一次看多平台效果

::: warning X 的卡片校验工具几经变动
旧的 `cards-dev.twitter.com/validator` 已下线。验证 X 卡片现在多依赖实际发推预览或第三方 OG 预览工具——把 Open Graph 写规范，X 的卡片基本就能正确回退生成。
:::

## 小结

Open Graph 四件套 + 一张 1200×630 的 `og:image` + 一行 `twitter:card`，就覆盖了社交分享的主体；记得给图配 `alt`、用绝对 URL、改后用调试器清缓存。`og:*` / `twitter:*` 标签数量多，但模式高度统一。下一页转向 `<head>` 里另一主力元素——[`<link>` 关系全谱](./link-relations)。
