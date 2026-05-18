---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Starlight 0.36.x（跟随 Astro 5.x）。本页是 API 速查——CLI、配置字段、Frontmatter、内置组件 props、CSS 变量、可覆盖组件、Plugin API 等。

## CLI 命令

Starlight 没有独立 CLI——使用 **Astro CLI**。所有命令通过 `astro` 子命令调用。

### 基础命令

```bash
pnpm astro dev          # 启动 dev server（默认 4321 端口）
pnpm astro build        # 生产构建到 dist/
pnpm astro preview      # 本地预览 dist/（生产模式）
pnpm astro check        # 类型 / Zod schema 静态检查
pnpm astro sync         # 重新生成 src/env.d.ts 类型
pnpm astro add <name>   # 添加集成（如 astro add starlight）
pnpm astro telemetry    # 控制匿名遥测
pnpm astro info         # 打印环境信息（用于报 bug）
pnpm astro --help       # 查看所有命令
```

### `astro dev` 选项

| 选项 | 默认 | 作用 |
|---|---|---|
| `--port <num>` | 4321 | 自定义端口 |
| `--host <addr>` | localhost | 自定义 host（`0.0.0.0` 允许局域网访问） |
| `--open` | true | 自动打开浏览器（`--open false` 关闭） |
| `--config <file>` | `astro.config.mjs` | 指定配置文件 |
| `--root <dir>` | `.` | 项目根目录 |
| `--verbose` | false | verbose 日志 |
| `--silent` | false | 静默模式 |

### `astro build` 选项

| 选项 | 默认 | 作用 |
|---|---|---|
| `--outDir <dir>` | `dist` | 输出目录 |
| `--site <url>` | `astro.config.mjs.site` | 覆盖站点 URL |

### `astro add` 集成示例

```bash
pnpm astro add starlight          # 添加 Starlight 集成
pnpm astro add mdx                # 添加 MDX 支持
pnpm astro add markdoc            # 添加 Markdoc 支持
pnpm astro add sitemap            # 添加 sitemap.xml 生成
pnpm astro add react              # 添加 React 集成
pnpm astro add vue                # 添加 Vue 集成
pnpm astro add svelte             # 添加 Svelte 集成
pnpm astro add solid              # 添加 Solid 集成
pnpm astro add tailwind           # 添加 Tailwind v4 集成
pnpm astro add node               # 添加 Node SSR adapter
pnpm astro add vercel             # 添加 Vercel adapter
pnpm astro add netlify            # 添加 Netlify adapter
pnpm astro add cloudflare         # 添加 Cloudflare adapter
```

## `astro.config.mjs` 字段

### Astro 站点级字段

| 字段 | 类型 | 默认 | 作用 |
|---|---|---|---|
| `site` | string | - | 生产 URL（sitemap / canonical / OG 用） |
| `base` | string | `/` | 子路径前缀（GitHub Pages 等） |
| `trailingSlash` | `'always' \| 'never' \| 'ignore'` | `'ignore'` | URL 末尾 / 处理 |
| `output` | `'static' \| 'server'` | `'static'` | 静态构建 / SSR |
| `adapter` | object | - | SSR 适配器（vercel / netlify / node 等） |
| `integrations` | array | `[]` | Astro 集成（starlight 在此） |
| `vite` | object | - | Vite 配置透传 |
| `markdown` | object | - | Markdown 处理选项（remarkPlugins / rehypePlugins / shikiConfig） |
| `srcDir` | string | `./src` | 源码目录 |
| `publicDir` | string | `./public` | 静态资源目录 |
| `outDir` | string | `./dist` | 构建输出目录 |
| `prefetch` | boolean \| object | - | 预取相邻页面 |
| `compressHTML` | boolean | true | 压缩 HTML 输出 |
| `redirects` | Record | - | 静态重定向（`{ '/old': '/new' }`） |

### Starlight 集成字段

调用 `starlight({ ... })` 传入：

| 字段 | 类型 | 默认 | 作用 |
|---|---|---|---|
| `title` | string \| Record | **必填** | 站点标题（可按 locale 多语言对象） |
| `description` | string | - | meta description |
| `tagline` | string | - | 默认 hero tagline |
| `logo` | object | - | Logo（src / light / dark / alt / replacesTitle） |
| `favicon` | string | `/favicon.svg` | Favicon 路径（相对 public/） |
| `head` | array | `[]` | 额外 `<head>` 标签 |
| `lang` | string | `'en'` | 单语言时的语言代码 |
| `defaultLocale` | string | - | 默认语言（多语言时必填） |
| `locales` | Record | - | 多语言配置 |
| `social` | array | `[]` | 社交链接 |
| `sidebar` | array | - | 侧边栏导航配置 |
| `customCss` | string[] | `[]` | 自定义 CSS 文件路径 |
| `pagefind` | boolean \| object | true | 内置搜索（false 禁用） |
| `components` | Record | - | 覆盖内置组件（`{ Header: './path.astro' }`） |
| `plugins` | array | `[]` | Starlight 插件列表 |
| `editLink` | object | - | 编辑链接（`{ baseUrl: '...' }`） |
| `lastUpdated` | boolean | false | 显示页脚 last updated 日期 |
| `pagination` | boolean | true | 显示页脚 prev/next 导航 |
| `expressiveCode` | object \| boolean | true | Expressive Code 配置（false 禁用） |
| `markdown` | object | - | Markdown 配置（headingLinks / processedDirs） |
| `prerender` | boolean | true | 预渲染（SSR 模式下用） |
| `disable404Route` | boolean | false | 禁用默认 404 路由 |
| `credits` | boolean | false | 显示 "Built with Starlight" |
| `tableOfContents` | object \| false | `{ minHeadingLevel: 2, maxHeadingLevel: 3 }` | 右侧目录配置 |
| `routeMiddleware` | string \| string[] | - | Route middleware 文件路径 |
| `titleDelimiter` | string | `'\|'` | 浏览器标签分隔符 |

### Logo 字段

```ts
{
  src?: string;             // 单 logo（不分明暗）
  light?: string;           // 明色模式 logo
  dark?: string;            // 暗色模式 logo
  alt?: string;             // alt 文字
  replacesTitle?: boolean;  // true: 替代标题文字
}
```

### Locales 字段

```ts
locales: {
  // 普通 locale
  en: {
    label: string;     // 必填，下拉选择显示
    lang?: string;     // BCP-47 语言代码（如 'en' / 'zh-CN'）
    dir?: 'ltr' | 'rtl';
  };

  // root locale（无 URL 前缀的默认语言）
  root?: {
    label: string;
    lang: string;      // root locale 时 lang 必填
    dir?: 'ltr' | 'rtl';
  };
}
```

### Sidebar 字段

每个 sidebar 项目是以下三种之一：

**Link**（内部 / 外部链接）：

```ts
{
  label: string;
  slug?: string;          // 内部页面 slug（如 'guides/install'）
  link?: string;          // 外部 URL
  badge?: { text: string; variant?: 'note' | 'tip' | 'success' | 'caution' | 'danger' | 'default'; class?: string };
  attrs?: Record<string, string>;
  translations?: Record<string, string>;
}
```

**Group**（嵌套分组）：

```ts
{
  label: string;
  items: SidebarItem[];
  collapsed?: boolean;
  badge?: { text: string; variant?: ... };
  translations?: Record<string, string>;
}
```

**Autogenerate**（自动生成）：

```ts
{
  label: string;
  autogenerate: {
    directory: string;     // src/content/docs/ 下的子目录
    collapsed?: boolean;
    attrs?: Record<string, string>;
  };
}
```

### Social 字段

```ts
social: Array<{
  label: string;
  icon: SocialIconName;
  href: string;
}>;
```

可用 `SocialIconName`（部分）：

```
github  gitlab  gitea  codeberg  bitbucket
discord  mastodon  bluesky  x.com  twitter  threads
youtube  twitch  instagram  facebook  linkedin
patreon  ko-fi  buy-me-a-coffee
email  rss  blueSky  hackerNews
```

### EditLink 字段

```ts
editLink: {
  baseUrl: string;   // 编辑 URL 基址（自动追加 src/content/docs/... 路径）
}
```

例子：

```ts
{ baseUrl: 'https://github.com/myorg/docs/edit/main/' }
// 自动生成：https://github.com/myorg/docs/edit/main/src/content/docs/guides/install.md
```

### Components 字段（覆盖默认组件）

```ts
components: {
  // 键：被覆盖的组件名
  // 值：自定义 .astro 文件路径
  Header: './src/components/MyHeader.astro';
  Footer: './src/components/MyFooter.astro';
  EditLink: './src/components/MyEditLink.astro';
  // 等...
}
```

### Plugins 字段

```ts
plugins: StarlightPlugin[];

interface StarlightPlugin {
  name: string;
  hooks: {
    'config:setup'?: (options: ConfigSetupOptions) => void | Promise<void>;
    'i18n:setup'?: (options: I18nSetupOptions) => void | Promise<void>;
  };
}
```

## Content Collections schema

### `docsLoader()` + `docsSchema()`

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
};
```

`docsLoader()` 选项：

| 选项 | 类型 | 默认 | 作用 |
|---|---|---|---|
| `generateId` | function | - | 自定义 ID 生成器 |

`docsSchema()` 选项：

| 选项 | 类型 | 作用 |
|---|---|---|
| `extend` | Zod schema | 扩展默认 frontmatter（追加自定义字段） |
| `image` | function | image 处理器（用于 hero.image） |

### `i18nLoader()` + `i18nSchema()`

```ts
import { i18nLoader } from '@astrojs/starlight/loaders';
import { i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema(),
  }),
};
```

`i18nSchema()` 选项：

| 选项 | 类型 | 作用 |
|---|---|---|
| `extend` | Zod schema | 扩展默认翻译字段（追加自定义 UI 字符串） |

## Frontmatter 字段

```yaml
---
# 基础
title: string                   # 必填
description: string             # SEO meta description
slug: string                    # 自定义 URL slug

# 模板 / 布局
template: 'doc' | 'splash'      # 默认 'doc'

# Hero（splash 模板用）
hero:
  title: string
  tagline: string
  image:
    alt: string
    file: string               # 单图（不分明暗）
    light: string              # 明色 logo
    dark: string               # 暗色 logo
    html: string               # 直接 inline HTML（如 SVG）
  actions:
    - text: string
      link: string
      icon: string
      variant: 'primary' | 'secondary' | 'minimal'
      attrs:
        target: '_blank'

# Banner（顶部横幅）
banner:
  content: string              # 支持 HTML

# Table of Contents
tableOfContents: false | { minHeadingLevel: 2, maxHeadingLevel: 3 }

# 编辑链接
editUrl: string | boolean      # 单页覆盖 / 禁用

# Last Updated
lastUpdated: Date | boolean    # 单页覆盖 / 禁用

# 导航
prev: true | false | { link: string; label?: string }
next: true | false | { link: string; label?: string }

# Sidebar
sidebar:
  label: string                # 覆盖 sidebar 显示文字
  order: number                # 排序权重
  hidden: boolean              # autogenerate 时隐藏
  badge:
    text: string
    variant: 'note' | 'tip' | 'success' | 'caution' | 'danger' | 'default'
  attrs:
    target: '_blank'

# Head 注入
head:
  - tag: string                # 标签名（meta / link / script）
    attrs:
      key: value
    content: string            # script 内联内容

# 内容控制
pagefind: boolean              # 是否被搜索索引（默认 true）
draft: boolean                 # 草稿（生产构建跳过）
---
```

## 内置组件 props

> 所有组件从 `@astrojs/starlight/components` 引入。

### Aside

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `type` | `'note' \| 'tip' \| 'caution' \| 'danger'` | `'note'` | 变体 |
| `title` | string | 按类型默认 | 自定义标题 |
| `icon` | IconName | 按类型默认 | 自定义图标 |

### Card

| Prop | 类型 | 必填 | 作用 |
|---|---|---|---|
| `title` | string | ✅ | 卡片标题 |
| `icon` | IconName | ❌ | 图标 |

### CardGrid

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `stagger` | boolean | false | 错落排版 |

### LinkCard

| Prop | 类型 | 必填 | 作用 |
|---|---|---|---|
| `title` | string | ✅ | 标题 |
| `href` | string | ✅ | 链接地址 |
| `description` | string | ❌ | 描述 |

### LinkButton

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `href` | string | - | 链接 |
| `variant` | `'primary' \| 'secondary' \| 'minimal'` | `'primary'` | 按钮样式 |
| `icon` | IconName | - | 图标 |
| `iconPlacement` | `'start' \| 'end'` | `'end'` | 图标位置 |

### Tabs

| Prop | 类型 | 作用 |
|---|---|---|
| `syncKey` | string | 跨页面同步 key（相同 key 的 Tabs 同步选择） |

### TabItem

| Prop | 类型 | 必填 | 作用 |
|---|---|---|---|
| `label` | string | ✅ | 标签页文字 |
| `icon` | IconName | ❌ | 标签页图标 |

### Steps

无 props，包裹 `<ol>` 即可。

### Badge

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `text` | string | - | 文字（必填） |
| `variant` | `'note' \| 'tip' \| 'success' \| 'caution' \| 'danger' \| 'default'` | `'default'` | 变体 |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | 尺寸 |

### Icon

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `name` | IconName | - | 图标名（必填） |
| `label` | string | - | 无障碍标签 |
| `size` | string | `'1em'` | CSS 尺寸 |
| `color` | string | - | CSS color |
| `class` | string | - | 自定义类 |

### FileTree

无 props，内部用嵌套 markdown 列表表达目录结构。

### Code（Expressive Code 包装）

| Prop | 类型 | 作用 |
|---|---|---|
| `code` | string | 代码字符串 |
| `lang` | string | 语言 |
| `title` | string | 顶部文件名 |
| `frame` | `'code' \| 'terminal' \| 'none'` | 外框 |
| `meta` | string | Expressive Code meta（如 `{1,3-5}` 高亮） |
| `mark` | string \| string[] | 高亮 |
| `ins` | string \| string[] | 标记新增 |
| `del` | string \| string[] | 标记删除 |
| `wrap` | boolean | 自动换行 |

## Expressive Code 元信息

代码块语言后追加，控制渲染：

| 语法 | 含义 |
|---|---|
| `js {1,3-5}` | 高亮第 1、3-5 行 |
| `js ins={2}` | 第 2 行标记为新增（绿色 +） |
| `js del={3}` | 第 3 行标记为删除（红色 -） |
| `js "keyword"` | 高亮关键词 |
| `js title="hello.js"` | 顶部显示文件名 |
| `bash frame="terminal"` | 终端样式 |
| `js frame="none"` | 无外框 |
| `js wrap` | 长行自动换行 |
| `js {1-3} ins={4}` | 多个组合 |

## CSS 自定义属性

### 颜色变量

| 变量 | 作用 |
|---|---|
| `--sl-color-accent` | 主品牌色 |
| `--sl-color-accent-low` | 浅 accent（背景用） |
| `--sl-color-accent-high` | 深 accent（深色背景上的文字） |
| `--sl-color-white` | 文字主色 |
| `--sl-color-gray-1` ~ `--sl-color-gray-7` | 灰度阶 |
| `--sl-color-black` | 背景主色 |
| `--sl-color-bg` | 主背景 |
| `--sl-color-bg-nav` | 顶部导航背景 |
| `--sl-color-bg-sidebar` | 侧边栏背景 |
| `--sl-color-bg-inline-code` | 行内代码背景 |
| `--sl-color-text` | 正文文字 |
| `--sl-color-text-accent` | accent 文字 |
| `--sl-color-text-invert` | 反向文字 |
| `--sl-color-hairline` | 分隔线 |
| `--sl-color-hairline-shade` | 阴影分隔线 |
| `--sl-color-hairline-light` | 浅分隔线 |
| `--sl-color-asides-text-accent` | Aside accent 文字 |
| `--sl-color-asides-border-{note/tip/caution/danger}` | Aside 边框 |
| `--sl-color-asides-bg-{note/tip/caution/danger}` | Aside 背景 |

> 暗色模式同名变量在 `[data-theme='dark']` 选择器下重新定义。

### 字体变量

| 变量 | 作用 |
|---|---|
| `--sl-font` | 正文字体栈 |
| `--sl-font-mono` | 等宽字体栈 |

### 布局变量

| 变量 | 作用 |
|---|---|
| `--sl-content-width` | 主内容最大宽度 |
| `--sl-content-pad-x` | 内容左右内边距 |
| `--sl-sidebar-width` | 侧边栏宽度 |
| `--sl-sidebar-pad-x` | 侧边栏内边距 |
| `--sl-nav-height` | 顶部导航高度 |
| `--sl-nav-pad-x` | 顶部导航内边距 |
| `--sl-mobile-toc-height` | 移动 TOC 高度 |

### 字号变量

| 变量 | 默认 | 作用 |
|---|---|---|
| `--sl-text-xs` | 0.8125rem | extra small |
| `--sl-text-sm` | 0.875rem | small |
| `--sl-text-base` | 1rem | base |
| `--sl-text-lg` | 1.125rem | large |
| `--sl-text-xl` | 1.25rem | extra large |
| `--sl-text-2xl` | 1.5rem | 2x large |
| `--sl-text-3xl` | 1.875rem | 3x large |
| `--sl-text-4xl` | 2.25rem | 4x large |
| `--sl-text-5xl` | 3rem | 5x large |
| `--sl-text-h1` ~ `--sl-text-h5` | - | 标题字号 |
| `--sl-text-code` | - | 代码字号 |
| `--sl-text-code-sm` | - | 小代码字号 |

> 完整 props.css 列表：https://github.com/withastro/starlight/blob/main/packages/starlight/style/props.css

## 可覆盖组件清单

`components` 字段可以替换的所有组件：

### Head

| 组件 | 默认行为 |
|---|---|
| `Head` | 渲染 `<head>` 元素内容（meta / link / script） |
| `ThemeProvider` | 主题切换的内联脚本 |

### Header

| 组件 | 默认行为 |
|---|---|
| `Header` | 顶部导航整体 |
| `SiteTitle` | 站点标题 + logo |
| `Search` | 搜索按钮 / 搜索框 |
| `SocialIcons` | 社交图标组 |
| `ThemeSelect` | 主题切换器（明 / 暗 / 自动） |
| `LanguageSelect` | 语言切换器 |

### Layout

| 组件 | 默认行为 |
|---|---|
| `PageFrame` | 整体页面框架（header + sidebar + content） |
| `MobileMenuToggle` | 移动端 sidebar 折叠按钮 |
| `Sidebar` | 全局侧边栏 / 移动 dropdown |
| `MobileMenuFooter` | 移动端菜单页脚 |

### Page Content

| 组件 | 默认行为 |
|---|---|
| `TwoColumnContent` | 主内容 + 右侧栏的两列布局 |
| `PageSidebar` | 右侧 TOC 区域 |
| `TableOfContents` | 桌面端 TOC |
| `MobileTableOfContents` | 移动端 TOC dropdown |

### Sections

| 组件 | 默认行为 |
|---|---|
| `Banner` | 页面顶部公告横幅 |
| `ContentPanel` | 主内容包装 |
| `PageTitle` | 页面 h1 标题 |
| `Hero` | Hero 区域（splash 模板用） |
| `MarkdownContent` | Markdown 内容包装 |
| `DraftContentNotice` | 草稿提示 |
| `FallbackContentNotice` | 缺失翻译提示 |

### Footer

| 组件 | 默认行为 |
|---|---|
| `Footer` | 页面页脚整体 |
| `LastUpdated` | 最后更新日期 |
| `EditLink` | 编辑链接 |
| `Pagination` | 上一页 / 下一页导航 |

### Accessibility

| 组件 | 默认行为 |
|---|---|
| `SkipLink` | 跳到主内容（键盘无障碍） |

### 包装默认组件示例

```astro
---
import Default from '@astrojs/starlight/components/SocialIcons.astro';
---

<a href="mailto:hello@example.com">Email</a>

<Default><slot /></Default>
```

> `<slot />` 必须保留以转发 children；带命名 slot 的组件（如 `PageFrame`）也要把所有 named slot 全部转发。

## Route Data API

### `starlightRoute` 对象

通过 `Astro.locals.starlightRoute` 在 `.astro` 组件 / route middleware 里访问：

```ts
interface StarlightRouteData {
  // 标识
  id: string;                    // 页面 slug
  entry: ContentEntry;           // Content collection entry 完整对象
  isFallback: boolean;           // 是否为 fallback 内容

  // 语言
  locale: string | undefined;    // 当前语言（root locale 时为 undefined）
  lang: string;                  // BCP-47 lang code（如 'en' / 'zh-CN'）
  dir: 'ltr' | 'rtl';            // 文字方向

  // 导航
  sidebar: SidebarItem[];        // 当前页的 sidebar 结构
  hasSidebar: boolean;
  pagination: {
    prev?: { link: string; label: string } | undefined;
    next?: { link: string; label: string } | undefined;
  };

  // 内容
  headings: Array<{ depth: number; slug: string; text: string }>;
  toc: { items: TocItem[] };
  lastUpdated: Date | undefined;

  // 站点
  siteTitle: string;
  siteTitleHref: string;
  editUrl: URL | undefined;
}
```

### `defineRouteMiddleware()` 定义中间件

```ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware(async (context, next) => {
  // 修改 route data
  const data = context.locals.starlightRoute;
  data.entry.data.title = data.entry.data.title + ' (Beta)';

  // 调用下一个 middleware（可选）
  return next();
});
```

### StarlightPage 组件

让非 `src/content/docs/` 路由也用 Starlight 布局：

```astro
---
// src/pages/dashboard.astro
import { StarlightPage } from '@astrojs/starlight/components';
---

<StarlightPage
  frontmatter={{
    title: 'Dashboard',
    template: 'doc',
    pagefind: false,
  }}
  hasSidebar={false}
>
  <h2>非文档页内容</h2>
</StarlightPage>
```

## Plugin API

### Plugin 形状

```ts
interface StarlightPlugin {
  name: string;
  hooks: {
    'config:setup'?: (options: ConfigSetupOptions) => void | Promise<void>;
    'i18n:setup'?: (options: I18nSetupOptions) => void | Promise<void>;
  };
}
```

### `config:setup` Hook

参数：

```ts
interface ConfigSetupOptions {
  config: StarlightUserConfig;        // 用户的 Starlight 配置
  updateConfig: (config: Partial<StarlightUserConfig>) => void;
  addIntegration: (integration: AstroIntegration) => void;
  addRouteMiddleware: (options: {
    entrypoint: string;
    order?: 'pre' | 'post' | 'default';
  }) => void;
  astroConfig: AstroConfig;
  command: 'dev' | 'build' | 'preview';
  logger: AstroIntegrationLogger;
  useTranslations: (lang: string) => (key: string) => string;
  absolutePathToLang: (path: string) => string;
}
```

### `i18n:setup` Hook

参数：

```ts
interface I18nSetupOptions {
  injectTranslations: (translations: Record<string, Record<string, string>>) => void;
}
```

注入翻译示例：

```ts
hooks: {
  'i18n:setup'({ injectTranslations }) {
    injectTranslations({
      en: {
        'myPlugin.label': 'My Plugin',
      },
      'zh-CN': {
        'myPlugin.label': '我的插件',
      },
    });
  },
}
```

### Plugin 完整示例

```ts
// src/plugins/my-plugin.ts
import type { StarlightPlugin } from '@astrojs/starlight/types';

export default function myPlugin(): StarlightPlugin {
  return {
    name: 'starlight-my-plugin',
    hooks: {
      'config:setup'({ updateConfig, addIntegration, logger }) {
        logger.info('My Plugin loaded!');

        updateConfig({
          customCss: ['./src/plugins/my-plugin.css'],
        });
      },
      'i18n:setup'({ injectTranslations }) {
        injectTranslations({
          en: { 'myPlugin.hello': 'Hello' },
          'zh-CN': { 'myPlugin.hello': '你好' },
        });
      },
    },
  };
}
```

`astro.config.mjs` 使用：

```js
import starlight from '@astrojs/starlight';
import myPlugin from './src/plugins/my-plugin.ts';

export default defineConfig({
  integrations: [
    starlight({
      title: '...',
      plugins: [myPlugin()],
    }),
  ],
});
```

## 社区 Plugin 速查

| Plugin | 作用 | 安装包 |
|---|---|---|
| `starlight-blog` | 博客系统（含 RSS / 作者 / 标签） | `starlight-blog` |
| `starlight-openapi` | OpenAPI / Swagger 自动生成 API 文档 | `starlight-openapi` |
| `starlight-image-zoom` | 图片点击放大 | `starlight-image-zoom` |
| `starlight-versions` | 多版本文档（对标 Docusaurus） | `starlight-versions` |
| `starlight-sidebar-topics` | 多 sidebar 主题（文档 + API + 教程分离） | `starlight-sidebar-topics` |
| `starlight-links-validator` | 死链检测 | `starlight-links-validator` |
| `starlight-typedoc` | 从 TypeScript 源码自动生成 API | `starlight-typedoc` |
| `starlight-llms-txt` | llms.txt 标准支持 | `starlight-llms-txt` |
| `starlight-obsidian` | Obsidian vault 发布 | `starlight-obsidian` |
| `starlight-videos` | 视频教程集成 | `starlight-videos` |
| `starlight-heading-badges` | 标题徽章 | `starlight-heading-badges` |
| `starlight-auto-sidebar` | 自动 sidebar 增强 | `starlight-auto-sidebar` |
| `starlight-scroll-to-top` | 滚动到顶部按钮 | `starlight-scroll-to-top` |
| `starlight-tags` | 标签分类系统 | `starlight-tags` |
| `starlight-telescope` | Fuzzy 搜索（键盘优先） | `starlight-telescope` |
| `@astrojs/starlight-docsearch` | Algolia DocSearch 替换 Pagefind | `@astrojs/starlight-docsearch` |
| `@astrojs/starlight-tailwind` | Tailwind v4 集成 | `@astrojs/starlight-tailwind` |
| `@astrojs/starlight-markdoc` | Markdoc 预设 | `@astrojs/starlight-markdoc` |

> 完整列表见 [Starlight Plugins Showcase](https://starlight.astro.build/resources/plugins/)。

## 内置图标参考

通过 `<Icon name="..." />` 使用，常用图标分类：

### UI 控件

```
right-arrow  left-arrow  up-arrow  down-arrow
right-caret  left-caret  up-caret  down-caret
close  bars  setting  search  pen  trash  external
add  subtract  list-format  comment-alt  bookmark
```

### 状态 / 反馈

```
approve-check  approve-check-circle  error  warning
information  question  pencil  star  heart  flag
```

### 操作

```
download  upload  cloud-download  cloud-upload  rocket
copy  open-book  document  laptop  puzzle  random
```

### 品牌（社交）

```
github  gitlab  gitea  codeberg  bitbucket  forgejo
discord  mastodon  bluesky  x.com  twitter  threads
youtube  twitch  instagram  facebook  linkedin
patreon  ko-fi  buy-me-a-coffee  email  rss
```

### 技术品牌

```
node  astro  react  vue  svelte  solid  preact
typescript  javascript  python  rust  go  java
docker  kubernetes  git  npm  pnpm  yarn  bun
```

### 文件类型（seti: 前缀）

```
seti:typescript  seti:react  seti:vue  seti:svelte
seti:python  seti:rust  seti:go  seti:json  seti:yaml
seti:markdown  seti:html  seti:css  seti:scss  seti:image
seti:default  seti:config  seti:lock  seti:font  seti:db
seti:lua  seti:php  seti:ruby  seti:swift  seti:kotlin
```

> 完整可点击列表（含搜索）：https://starlight.astro.build/reference/icons/

## 翻译 key 速查

`src/content/i18n/{locale}.json` 里可重写的常见 UI key：

| Key | 默认（英文） |
|---|---|
| `skipLink.label` | Skip to content |
| `search.label` | Search |
| `search.shortcutLabel` | (Press / to Search) |
| `search.cancelLabel` | Cancel |
| `search.devWarning` | Search is only available in production builds. |
| `themeSelect.accessibleLabel` | Select theme |
| `themeSelect.dark` | Dark |
| `themeSelect.light` | Light |
| `themeSelect.auto` | Auto |
| `languageSelect.accessibleLabel` | Select language |
| `menuButton.accessibleLabel` | Menu |
| `sidebarNav.accessibleLabel` | Main |
| `tableOfContents.onThisPage` | On this page |
| `tableOfContents.overview` | Overview |
| `i18n.untranslatedContent` | This content is not available in your language yet. |
| `page.editLink` | Edit page |
| `page.lastUpdated` | Last updated: |
| `page.previousLink` | Previous |
| `page.nextLink` | Next |
| `page.draft` | This content is a draft and will not be included in production builds. |
| `404.text` | Page not found. |
| `aside.note` | Note |
| `aside.tip` | Tip |
| `aside.caution` | Caution |
| `aside.danger` | Danger |

> 完整 key 列表见 [@astrojs/starlight/translations 源码](https://github.com/withastro/starlight/tree/main/packages/starlight/translations)。

## 配置最小化示例

最简 `astro.config.mjs`：

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
    }),
  ],
});
```

最简 `src/content.config.ts`：

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

`src/content/docs/index.md`：

```md
---
title: 欢迎
---

# 你好，Starlight!
```

## 配置完整示例

下面是一个生产级别的完整 `astro.config.mjs`：

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLinksValidator from 'starlight-links-validator';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mydocs.example.com',
  trailingSlash: 'always',

  integrations: [
    starlight({
      title: {
        en: 'My Docs',
        'zh-cn': '我的文档',
      },
      description: 'My amazing documentation',

      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN' },
      },

      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        alt: 'My Docs',
      },

      favicon: '/favicon.svg',

      social: [
        { label: 'GitHub', icon: 'github', href: 'https://github.com/me/myproject' },
        { label: 'Discord', icon: 'discord', href: 'https://discord.gg/myproject' },
      ],

      editLink: {
        baseUrl: 'https://github.com/me/myproject/edit/main/',
      },

      lastUpdated: true,

      sidebar: [
        {
          label: '入门',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: '指南',
          collapsed: false,
          items: [
            { label: '介绍', slug: 'guides/intro' },
            {
              label: '安装',
              items: [
                { label: 'macOS', slug: 'guides/install/macos' },
                { label: 'Linux', slug: 'guides/install/linux' },
                { label: 'Windows', slug: 'guides/install/windows' },
              ],
            },
            {
              label: '进阶',
              autogenerate: { directory: 'guides/advanced', collapsed: true },
            },
          ],
        },
        {
          label: '参考',
          autogenerate: { directory: 'reference', collapsed: true },
        },
        {
          label: '社区',
          items: [
            { label: 'GitHub', link: 'https://github.com/me/myproject' },
            { label: '更新日志', slug: 'changelog' },
          ],
        },
      ],

      customCss: [
        './src/styles/custom.css',
        '@fontsource/inter/400.css',
        '@fontsource/inter/600.css',
      ],

      pagefind: {
        ranking: {
          pageLength: 0.5,
          termFrequency: 0.7,
        },
      },

      expressiveCode: {
        themes: ['github-light', 'github-dark'],
      },

      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },

      components: {
        Footer: './src/components/MyFooter.astro',
      },

      plugins: [
        starlightImageZoom(),
        starlightLinksValidator(),
      ],
    }),

    sitemap(),
  ],
});
```

## 文件约定速查

| 路径 | 作用 |
|---|---|
| `astro.config.mjs` | Astro + Starlight 主配置 |
| `src/content.config.ts` | Content Collections 配置 |
| `src/content/docs/**/*.{md,mdx,mdoc}` | 文档内容 |
| `src/content/docs/index.md` | 站点首页 |
| `src/content/docs/404.md` | 自定义 404 页 |
| `src/content/i18n/{locale}.{json,yml}` | UI 翻译 |
| `src/assets/**` | Vite 处理的资源（图片 / 字体） |
| `src/components/**.astro` | 自定义 Astro 组件（用于 components 覆盖） |
| `src/styles/**.css` | 自定义 CSS（用 customCss 注入） |
| `public/**` | 静态资源直传（不处理） |
| `public/favicon.svg` | favicon 默认位置 |
| `src/pages/**.{astro,ts,js}` | 非 Starlight 路由（custom pages / API endpoints） |
| `src/env.d.ts` | TypeScript 环境类型（Astro 自动生成） |

## 学习资源

| 资源 | 链接 |
|---|---|
| 官方文档 | https://starlight.astro.build/ |
| 配置参考 | https://starlight.astro.build/reference/configuration/ |
| Frontmatter | https://starlight.astro.build/reference/frontmatter/ |
| Plugins 资源 | https://starlight.astro.build/resources/plugins/ |
| Showcase 案例 | https://starlight.astro.build/resources/showcase/ |
| GitHub 仓库 | https://github.com/withastro/starlight |
| Astro 文档 | https://docs.astro.build/ |
| Expressive Code | https://expressive-code.com/ |
| Pagefind | https://pagefind.app/ |
| Markdoc | https://markdoc.dev/ |
| Discord | https://astro.build/chat |
