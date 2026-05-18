---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Nextra 4.x（Next.js 15 App Router + React 19 + MDX 3）。本页是 API 速查——`next.config.mjs` 选项、`_meta.ts` 完整 schema、`<Layout>` 全部 props、内置组件 props、Nextra API 全集、文件约定速查。

## 必需文件清单

Nextra 4.x 项目的**必需文件**：

| 文件 | 位置 | 作用 |
|---|---|---|
| `next.config.mjs` | 项目根 | Nextra 插件 + Next.js 配置 |
| `mdx-components.tsx` | 项目根或 `src/` | **强制要求**——MDX 渲染入口 |
| `app/layout.jsx` | `app/` | 根 Layout（挂 Navbar / Footer 等） |
| `app/[[...mdxPath]]/page.jsx` | `app/[[...mdxPath]]/` | catch-all 渲染 `content/` 下 MDX |
| `package.json` | 项目根 | 含 `next` / `react` / `react-dom` / `nextra` / `nextra-theme-docs` |

可选文件：

| 文件 | 作用 |
|---|---|
| `content/_meta.ts` | 当前目录 sidebar 配置 |
| `_meta.global.js` | 全站 sidebar 配置（与目录级 `_meta` 互斥） |
| `app/not-found.jsx` | 自定义 404 |
| `middleware.ts` | i18n 自动检测 |
| `app/globals.css` | 全局样式 |
| `tailwind.config.js` | Tailwind 配置 |
| `tsconfig.json` | TypeScript 配置 |

## CLI 命令

Nextra **没有独立 CLI**——所有命令通过 `next` CLI 执行：

```bash
next dev              # 开发服务器（默认 port 3000）
next dev --turbopack  # 启用 Turbopack
next dev -p 4000      # 改端口
next dev -H 0.0.0.0   # 监听所有网卡

next build            # 生产构建（输出 .next/，或 output:'export' 时输出 out/）

next start            # 启动生产 Node 服务器
next start -p 4000    # 改端口

next lint             # 跑 ESLint
next info             # 输出当前版本环境信息

next telemetry status # 查看遥测状态
next telemetry disable # 关闭遥测
```

Pagefind 索引（postbuild）：

```bash
# 默认 .next 部署（Node server）
pagefind --site .next/server/app --output-path public/_pagefind

# 静态导出
pagefind --site out --output-path out/_pagefind
```

## `next.config.mjs` 配置

### 完整 Nextra 选项

```js
// next.config.mjs
import nextra from 'nextra'

const withNextra = nextra({
  // ====== 基础 ======

  // 搜索引擎（Pagefind）
  search: true,           // 默认 true；false 完全禁用
  // 或精细配置：
  // search: {
  //   codeblocks: false,   // 不索引代码块
  // }

  // 默认显示代码块 copy 按钮
  defaultShowCopyCode: false,

  // 代码高亮（Shiki）
  codeHighlight: true,    // 默认 true；false 禁用

  // LaTeX 支持
  latex: false,           // 默认 false；true = KaTeX
  // 或：
  // latex: { renderer: 'katex', options: { macros: {} } }
  // latex: { renderer: 'mathjax' }

  // content/ 目录映射的 URL 前缀
  contentDirBasePath: '/',    // 默认 '/'

  // 是否生成 sitemap.xml
  // 需要在 app/sitemap.ts 配合使用

  // ====== MDX 选项 ======
  mdxOptions: {
    remarkPlugins: [],    // remark 插件链
    rehypePlugins: [],    // rehype 插件链
    recmaPlugins: [],     // recma 插件链
    format: 'detect',     // 'detect' | 'mdx' | 'md'
    rehypePrettyCodeOptions: {
      // Shiki theme
      theme: 'github-dark',
      // 或双主题：
      // theme: { dark: 'github-dark', light: 'github-light' }
      // 自定义 getHighlighter
      // getHighlighter: () => ...
    }
  },

  // ====== 高级 ======

  // 跳过页面在搜索中（front matter searchable: false 等价）
  // 自定义 unstable_flexsearch（v3 兼容，v4 不需要）

  // staticImage：默认 true 自动包 next/image
  staticImage: true,

  // readingTime：自动添加阅读时间到 metadata
  readingTime: false,
})

// ====== Next.js 选项 ======
export default withNextra({
  reactStrictMode: true,

  // 静态导出（部署到 GitHub Pages / Nginx）
  // output: 'export',
  // images: { unoptimized: true },
  // distDir: 'build',
  // basePath: '/my-docs',

  // i18n（仅 Pages Router 兼容，App Router 用路径前缀方案）
  // i18n: {
  //   locales: ['en', 'zh', 'de'],
  //   defaultLocale: 'en',
  // },

  // Turbopack 配置（Next.js 15+）
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './src/mdx-components.tsx',
    }
  },

  // Webpack 自定义
  webpack: (config) => {
    return config
  },

  // 自定义 headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ]
      }
    ]
  },
})
```

### 主要 Nextra 选项速查

| 选项 | 类型 | 默认 | 作用 |
|---|---|---|---|
| `search` | `boolean \| { codeblocks }` | `true` | Pagefind 搜索 |
| `defaultShowCopyCode` | `boolean` | `false` | 全局启用代码块复制按钮 |
| `codeHighlight` | `boolean` | `true` | Shiki 高亮 |
| `latex` | `boolean \| { renderer, options }` | `false` | LaTeX 渲染 |
| `contentDirBasePath` | `string` | `'/'` | `content/` 映射的 URL 前缀 |
| `staticImage` | `boolean` | `true` | 自动包 `<Image>` |
| `readingTime` | `boolean` | `false` | 阅读时间元数据 |
| `mdxOptions` | `MdxOptions` | `{}` | MDX 编译选项 |
| `mdxOptions.remarkPlugins` | `Plugin[]` | `[]` | remark 插件 |
| `mdxOptions.rehypePlugins` | `Plugin[]` | `[]` | rehype 插件 |
| `mdxOptions.format` | `'detect' \| 'mdx' \| 'md'` | `'detect'` | 强制格式 |
| `mdxOptions.rehypePrettyCodeOptions.theme` | `string \| { dark, light }` | `'github-dark'` | Shiki 主题 |

## `_meta.ts` 完整 Schema

```ts
// 顶层
type MetaRecord = Record<string, MetaRecordValue>
type MetaRecordValue =
  | TitleSchema
  | PageItemSchema
  | SeparatorSchema
  | MenuSchema

// 简单标题
type TitleSchema = string | ReactElement

// 页面项
type PageItemSchema = {
  type?: 'page' | 'doc'                       // 默认 'doc'
  display?: 'normal' | 'hidden' | 'children'  // 默认 'normal'
  title?: TitleSchema
  theme?: PageThemeSchema
  href?: string                               // 外部 / 内部链接（type=page 时）
  items?: Record<string, MetaRecordValue>     // 仅 _meta.global.js 内使用
}

// 分隔符
type SeparatorSchema = {
  type: 'separator'
  title?: TitleSchema
}

// navbar 下拉菜单
type MenuSchema = {
  type: 'menu'
  title?: TitleSchema
  items: Record<string, MenuItemSchema>
}

type MenuItemSchema = {
  title: TitleSchema
  href: string
}

// 主题选项（可在 _meta 单页或目录级别覆盖）
type PageThemeSchema = {
  breadcrumb?: boolean                        // 默认 true
  collapsed?: boolean                         // 默认 false
  copyPage?: boolean                          // 默认 true
  footer?: boolean                            // 默认 true
  layout?: 'default' | 'full'                 // 默认 'default'
  navbar?: boolean                            // 默认 true
  pagination?: boolean                        // 默认 true
  sidebar?: boolean                           // 默认 true
  timestamp?: boolean                         // 默认 true
  toc?: boolean                               // 默认 true
  typesetting?: 'default' | 'article'         // 默认 'default'
}
```

### `_meta.ts` 用法举例

```ts
import type { MetaRecord } from 'nextra'

export default {
  // 1. 简单字符串
  index: '首页',

  // 2. JSX 标题
  intro: <b>📘 介绍</b>,

  // 3. 完整页面对象
  guide: {
    type: 'doc',
    title: '指南',
    display: 'normal',
    theme: {
      typesetting: 'article',
      breadcrumb: false,
    }
  },

  // 4. 隐藏页面
  changelog: { display: 'hidden' },

  // 5. 顶部 navbar 项
  about: { type: 'page', title: '关于' },

  // 6. 外部链接
  github: {
    title: 'GitHub ↗',
    href: 'https://github.com/your-org'
  },

  // 7. 分隔符
  '---basic': {
    type: 'separator',
    title: '基础'
  },

  // 8. navbar 下拉菜单
  more: {
    type: 'menu',
    title: '更多',
    items: {
      blog: { title: '博客', href: '/blog' },
      contact: { title: '联系', href: 'mailto:hi@example.com' },
    }
  },

  // 9. 通配符 - 对所有未声明项应用
  '*': {
    type: 'page',
    theme: { breadcrumb: false }
  },
} satisfies MetaRecord
```

### Front Matter 字段速查

```mdx
---
title: 页面标题
description: SEO 描述
sidebarTitle: sidebar 简短标题
asIndexPage: false
searchable: true
date: 2026-05-18           # 博客文章用
author: Your Name           # 博客文章用
tag: [tutorial, nextra]     # 博客文章用
openGraph:
  images: ['/og.png']
---
```

## `<Layout>` 完整 Props（Docs Theme）

```tsx
import type { LayoutProps } from 'nextra-theme-docs'

type LayoutProps = {
  // ====== 必填 ======
  pageMap: PageMapItem[]    // await getPageMap() 的结果
  children: ReactNode

  // ====== 区块 ======
  banner?: ReactNode
  navbar?: ReactNode
  footer?: ReactNode
  search?: ReactNode | false

  // ====== sidebar 配置 ======
  sidebar?: {
    defaultMenuCollapseLevel?: number      // 默认 2
    autoCollapse?: boolean                  // 默认 false
    toggleButton?: boolean                  // 默认 true
    defaultOpen?: boolean                   // 默认 true
  }

  // ====== TOC 配置 ======
  toc?: {
    float?: boolean                         // 默认 true（浮动）
    title?: ReactNode                       // 默认 'On This Page'
    backToTop?: ReactNode | false           // 默认 'Scroll to top'
    extraContent?: ReactNode                // TOC 底部附加内容（赞助商位等）
  }

  // ====== 导航 ======
  navigation?: boolean | {
    prev?: boolean
    next?: boolean
  }

  // ====== Edit on GitHub ======
  docsRepositoryBase?: string               // GitHub 仓库根路径
  editLink?: ReactNode | false              // 默认 'Edit this page'

  // ====== Feedback ======
  feedback?: {
    content?: ReactNode | null              // 默认 'Question? Give us feedback'
    labels?: string                         // GitHub issue labels
    useLink?: () => string                  // 自定义链接生成
  }

  // ====== Last Updated ======
  lastUpdated?: ReactNode | false

  // ====== i18n ======
  i18n?: Array<{
    locale: string
    name: string
    direction?: 'ltr' | 'rtl'
  }>

  // ====== Dark Mode ======
  darkMode?: boolean                        // 默认 true
  themeSwitch?: {
    dark?: string                           // 默认 'Dark'
    light?: string                          // 默认 'Light'
    system?: string                         // 默认 'System'
  }

  // ====== next-themes ======
  nextThemes?: {
    defaultTheme?: 'dark' | 'light' | 'system'
    storageKey?: string
    forcedTheme?: 'dark' | 'light'
    themes?: string[]
    disableTransitionOnChange?: boolean
  }
}
```

## `<Navbar>` Props

```tsx
type NavbarProps = {
  logo: ReactNode
  logoLink?: string | boolean              // 默认 true → '/'
  projectLink?: string
  projectIcon?: ReactNode                  // 默认 GitHub icon
  chatLink?: string
  chatIcon?: ReactNode                     // 默认 Discord icon
  align?: 'left' | 'right'                 // 默认 'right'
  className?: string
  children?: ReactNode
}
```

## `<Footer>` Props

```tsx
type FooterProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode
}
```

## `<NotFoundPage>` Props

```tsx
type NotFoundPageProps = {
  content?: ReactNode                      // 默认 'Submit an issue about broken link →'
  labels?: string                          // 默认 'bug'
  children?: ReactNode                     // 默认 <h1>404: Page Not Found</h1>
  className?: string
}
```

## 内置组件 Props 速查

所有从 `nextra/components` 导入。

### `<Callout>`

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `type` | `'default' \| 'info' \| 'warning' \| 'error' \| 'important' \| null` | `'default'` | 风格 |
| `emoji` | `string \| ReactNode` | 类型决定 | 图标 |
| `children` | `ReactNode` | - | 内容 |

### `<Cards>`

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `num` | `number` | `3` | 网格列数 |
| `children` | `ReactNode` | - | `<Cards.Card>` 列表 |

### `<Cards.Card>`

| Prop | 类型 | 作用 |
|---|---|---|
| `title` | `string` | 标题 |
| `href` | `string` | 链接 |
| `icon` | `ReactNode` | 左侧图标 |
| `image` | `boolean` | 图像卡片模式 |
| `arrow` | `boolean` | 右上箭头 |
| `children` | `ReactNode` | 自定义内容 |

### `<Steps>`

| Prop | 类型 | 作用 |
|---|---|---|
| `children` | `ReactNode` | 含 `h2`-`h6` 的内容 |
| 其他 HTMLDivAttributes | - | 标准属性 |

### `<FileTree>` / `<FileTree.Folder>` / `<FileTree.File>`

`<FileTree.Folder>`：

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `name` | `string` | - | 文件夹名 |
| `defaultOpen` | `boolean` | `false` | 初始展开 |
| `active` | `boolean` | `false` | 高亮 |

`<FileTree.File>`：

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `name` | `string` | - | 文件名 |
| `active` | `boolean` | `false` | 高亮 |

### `<Tabs>` / `<Tabs.Tab>`

`<Tabs>`：

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `items` | `string[] \| { label: string, disabled?: boolean }[] \| ReactElement[]` | - | 标签 |
| `defaultIndex` | `number` | `0` | 默认显示 |
| `storageKey` | `string` | - | localStorage key |
| `selectedIndex` | `number` | - | 受控选中 |
| `onChange` | `(idx: number) => void` | - | 切换回调 |
| `tabClassName` | `string` | - | tab 样式 |
| `selectedTabClassName` | `string` | - | 选中 tab 样式 |
| `disabledTabClassName` | `string` | - | 禁用 tab 样式 |

### `<Bleed>`

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `full` | `boolean` | `false` | 是否完全填满浏览器宽度 |
| 其他 HTMLDivAttributes | - | - | - |

### `<Table>` / `<Table.Tr>` / `<Table.Th>` / `<Table.Td>`

接受所有标准 HTML table 元素属性。无特殊 props。

### `<Banner>`

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `storageKey` | `string` | `'nextra-banner'` | localStorage key |
| `dismissible` | `boolean` | `true` | 可关闭 |
| `children` | `ReactNode` | - | 内容 |

### `<Head>`

| Prop | 类型 | 作用 |
|---|---|---|
| `color.hue` | `number \| { dark, light }` | 主题色相 0-360 |
| `color.saturation` | `number` | 饱和度 0-100 |
| `color.lightness` | `number \| { dark, light }` | 亮度 0-100 |
| `backgroundColor` | `{ dark: string, light: string }` | 背景色 |
| `faviconGlyph` | `string` | 单个 emoji 做 favicon |
| `children` | `ReactNode` | 自定义 `<head>` 内容 |

### `<Search>`

| Prop | 类型 | 默认 | 作用 |
|---|---|---|---|
| `placeholder` | `string` | `'Search documentation…'` | 占位符 |
| `emptyResult` | `ReactNode` | `'No results found.'` | 无结果文案 |
| `errorText` | `string` | `'Failed to load search index.'` | 错误文案 |
| `loading` | `ReactNode` | `'Loading…'` | 加载中文案 |
| `searchOptions` | `PagefindSearchOptions` | - | Pagefind 参数 |
| `onSearch` | `(query: string) => void` | - | 搜索回调 |
| `className` | `string` | - | 容器样式 |

### `<ImageZoom>`

```jsx
import { ImageZoom } from 'nextra/components'

<ImageZoom src="/img.png" alt="可缩放" />
```

接受所有 Next.js `<Image>` 的 props。

## Nextra 主 API（从 `nextra` 包导出）

### `nextra(config)`

主入口——`next.config.mjs` 用：

```js
import nextra from 'nextra'

const withNextra = nextra({
  search: true,
  latex: false,
  // ... NextraConfig 选项
})

export default withNextra({ /* Next.js 配置 */ })
```

返回值：一个 HOC，接受 Next.js 配置并增强。

### `MdxOptions` 类型

```ts
type MdxOptions = {
  remarkPlugins?: Pluggable[]
  rehypePlugins?: Pluggable[]
  recmaPlugins?: Pluggable[]
  format?: 'detect' | 'mdx' | 'md'
  rehypePrettyCodeOptions?: RehypePrettyCodeOptions
}
```

## Nextra Page Map API（从 `nextra/page-map` 导出）

### `getPageMap()`

获取整站结构——`app/layout.jsx` 必用：

```jsx
import { getPageMap } from 'nextra/page-map'

const pageMap = await getPageMap()
// 返回 PageMapItem[]
```

可指定路径限制：

```jsx
const blogPageMap = await getPageMap('/blog')
```

### `PageMapItem` 类型

```ts
type PageMapItem = MdxFile | Folder | MetaJsonFile

type MdxFile = {
  kind: 'MdxPage'
  name: string
  route: string
  frontMatter?: any
}

type Folder = {
  kind: 'Folder'
  name: string
  route: string
  children: PageMapItem[]
}
```

## Nextra Pages API（从 `nextra/pages` 导出）

### `generateStaticParamsFor(paramKey)`

生成 catch-all 路由的静态参数：

```jsx
// app/[[...mdxPath]]/page.jsx
import { generateStaticParamsFor } from 'nextra/pages'

export const generateStaticParams = generateStaticParamsFor('mdxPath')
```

### `importPage(mdxPath)`

动态导入 MDX 页面：

```jsx
import { importPage } from 'nextra/pages'

const { default: MDXContent, toc, metadata } = await importPage(['guide', 'advanced'])
```

返回：

| 字段 | 类型 | 作用 |
|---|---|---|
| `default` | `Component` | 渲染 MDX 内容的 React 组件 |
| `toc` | `Heading[]` | 目录结构 |
| `metadata` | `Metadata` | 页面元数据（含 title / description / front matter） |

## Nextra Compile API（用于远程 MDX）

### `compileMdx(source, options)`

编译 MDX 字符串为可执行代码：

```ts
import { compileMdx } from 'nextra/compile'

const compiled = await compileMdx('# Hello', {
  mdxOptions: {
    remarkPlugins: [],
    rehypePlugins: [],
  }
})
```

### `evaluate(compiled, components)`

执行编译后的 MDX：

```ts
import { evaluate } from 'nextra/evaluate'
import { useMDXComponents } from '../mdx-components'

const { default: MDXContent } = evaluate(compiled, useMDXComponents())
```

## Nextra Normalize Pages API

### `normalizePages({ list, route })`

把 `pageMap` 转换成 navbar / sidebar 可用结构（**自定义 theme 必用**）：

```jsx
'use client'
import { normalizePages } from 'nextra/normalize-pages'
import { usePathname } from 'next/navigation'

const pathname = usePathname()
const result = normalizePages({
  list: pageMap,
  route: pathname,
})
```

返回结构：

```ts
{
  activeType: 'doc' | 'page' | 'menu'
  activeIndex: number              // 在 flatDocsDirectories 中的位置
  activeThemeContext: PageThemeSchema
  activePath: PageMapItem[]
  topLevelNavbarItems: PageMapItem[]   // 顶部 navbar
  docsDirectories: PageMapItem[]       // sidebar 树
  flatDirectories: PageMapItem[]       // 扁平所有页面
  flatDocsDirectories: PageMapItem[]   // 扁平所有 doc 页面
  directories: PageMapItem[]
}
```

## `useMDXComponents` API

### 从 `nextra/mdx-components` 导出

获取 Nextra 默认 MDX 组件映射（不带主题）：

```jsx
import { useMDXComponents as getDefaultComponents } from 'nextra/mdx-components'
```

### 从 `nextra-theme-docs` 导出

获取 Docs Theme 的 MDX 组件映射：

```jsx
import { useMDXComponents as getDocsComponents } from 'nextra-theme-docs'
```

### 从 `nextra-theme-blog` 导出

获取 Blog Theme 的 MDX 组件映射：

```jsx
import { useMDXComponents as getBlogComponents } from 'nextra-theme-blog'
```

### 推荐用法（项目根 `mdx-components.tsx`）

```tsx
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'

const docsComponents = getDocsMDXComponents()

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    ...components,
    // 自定义覆盖
  }
}
```

返回的组件映射包含所有 HTML 标签的渲染函数（h1-h6 / p / a / img / blockquote / pre / code / table / ul / ol / li / hr / strong / em / del / wrapper 等）。

## 中间件 API（i18n）

### `nextra/locales`

```ts
// middleware.ts
export { middleware } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|_pagefind).*)',
  ],
}
```

根据 `Accept-Language` header 重定向到对应 locale。

## 文件约定速查

### 目录约定

| 路径 | 作用 |
|---|---|
| `content/**/*.mdx` | MDX 内容文件（4.x 推荐） |
| `content/**/_meta.{js,jsx,ts,tsx}` | 当前目录配置 |
| `app/[[...mdxPath]]/page.jsx` | catch-all 渲染 content/ |
| `app/layout.jsx` | 根 Layout |
| `app/not-found.jsx` | 自定义 404 |
| `app/sitemap.ts` | 自动 sitemap |
| `app/robots.ts` | robots.txt |
| `public/_pagefind/` | Pagefind 索引（postbuild 生成） |
| `mdx-components.tsx` | MDX 渲染入口（必需） |
| `next.config.mjs` | Next.js + Nextra 配置 |
| `_meta.global.{js,jsx,ts,tsx}` | 全站配置（与目录级互斥） |

### URL 映射规则

| MDX 文件 | URL |
|---|---|
| `content/index.mdx` | `/` |
| `content/about.mdx` | `/about` |
| `content/guide/index.mdx` | `/guide` |
| `content/guide/basics.mdx` | `/guide/basics` |
| `content/blog/[slug].mdx` | `/blog/:slug`（动态路由，需 `generateStaticParams`） |

### 标题优先级（sidebar）

从高到低：
1. `_meta.ts` 里的非空 title（如 `'guide': '指南'`）
2. front matter `sidebarTitle`
3. front matter `title`
4. 文件里第一个 `<h1>`
5. 文件名（格式化处理）

## Plugin 生态

### MDX 插件（可在 `mdxOptions` 注入）

```js
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const withNextra = nextra({
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  }
})
```

> Turbopack 不支持函数式插件——开发期需禁用 Turbopack 或仅在 `next build` 时启用插件。

### 常用插件

| 插件 | 作用 |
|---|---|
| `remark-gfm` | GFM 扩展（任务列表 / 表格 / 删除线） |
| `remark-math` + `rehype-katex` | 数学公式（已内置 `latex: true`） |
| `remark-mermaid` / `@theguild/remark-mermaid` | Mermaid 图（已内置） |
| `remark-frontmatter` | YAML front matter（已内置） |
| `rehype-pretty-code` | Shiki 代码高亮（已内置） |
| `rehype-slug` | 自动 heading id（已内置） |

## 环境变量

Nextra 自身无特殊环境变量，遵循 Next.js 约定：

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX      # 客户端可访问
DATABASE_URL=postgres://...           # 仅服务端
```

## TypeScript 类型导出速查

### `nextra` 包

```ts
import type {
  NextraConfig,
  MdxOptions,
  MetaRecord,
  MetaRecordValue,
  PageThemeSchema,
} from 'nextra'
```

### `nextra-theme-docs` 包

```ts
import type {
  DocsThemeConfig,    // v3 兼容
  LayoutProps,
  NavbarProps,
  FooterProps,
} from 'nextra-theme-docs'
```

### `nextra/page-map` 包

```ts
import type {
  PageMapItem,
  MdxFile,
  Folder,
} from 'nextra/page-map'
```

## 常用 Helper 模板

### Sitemap

```ts
// app/sitemap.ts
import { getPageMap } from 'nextra/page-map'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageMap = await getPageMap()
  return flatten(pageMap).map(page => ({
    url: `https://my-docs.com${page.route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))
}

function flatten(items, acc = []) {
  for (const item of items) {
    if (item.kind === 'MdxPage') acc.push(item)
    if (item.kind === 'Folder') flatten(item.children, acc)
  }
  return acc
}
```

### Robots

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://my-docs.com/sitemap.xml',
  }
}
```

### RSS Feed（博客）

```ts
// app/feed.xml/route.ts
import { getPageMap } from 'nextra/page-map'

export async function GET() {
  const blogPageMap = await getPageMap('/blog')
  const items = flatten(blogPageMap).filter(p => p.frontMatter?.date)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://my-docs.com/blog</link>
    ${items.map(item => `
      <item>
        <title>${item.frontMatter.title}</title>
        <link>https://my-docs.com${item.route}</link>
        <pubDate>${new Date(item.frontMatter.date).toUTCString()}</pubDate>
      </item>
    `).join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  })
}

function flatten(items, acc = []) {
  for (const item of items) {
    if (item.kind === 'MdxPage') acc.push(item)
    if (item.kind === 'Folder') flatten(item.children, acc)
  }
  return acc
}
```

## 版本兼容性

| Nextra | Next.js | React | Node.js | Router |
|---|---|---|---|---|
| **4.x** | 15+ | 19+ | 20+ | **仅 App Router** |
| 3.x | 13-14 | 18 | 18+ | Pages Router（主推）+ App Router 实验 |
| 2.x | 12-13 | 18 | 16+ | Pages Router |
| 1.x | 10-11 | 17 | 12+ | Pages Router |

## 故障排查速查

| 现象 | 排查 |
|---|---|
| `Cannot find module 'mdx-components'` | 项目根创建 `mdx-components.tsx` |
| Turbopack 报 plugin 不可序列化 | 移除函数式 remarkPlugins，或不用 Turbopack |
| 静态导出图片失败 | 加 `images: { unoptimized: true }` |
| Pagefind 搜索没结果 | 检查 postbuild 是否跑 + `_pagefind/` 输出路径 |
| sidebar 顺序错乱 | 检查 `_meta.ts` key 不能是数字 |
| 深浅模式闪烁（FOUC） | `<html suppressHydrationWarning>` |
| `getPageMap` 报错 | `app/layout.jsx` 必须是 async Server Component |
| 自定义 Theme 出现 hydration 错误 | normalizePages 用法在 client component 中 + `'use client'` |
| i18n middleware 不工作 | `output: 'export'` 不兼容 middleware |
| MDX `{` 解析错误 | 用 `\{` 转义或反引号包裹（MDX 3 严格） |

## 相关链接

- [Nextra 官网](https://nextra.site/)
- [GitHub - shuding/nextra](https://github.com/shuding/nextra)
- [Docs 模板](https://github.com/shuding/nextra-docs-template)
- [Blog 模板](https://github.com/shuding/nextra-blog-template)
- [Showcase 案例](https://nextra.site/showcase)
- [Pagefind 官网](https://pagefind.app/)
- [MDX 3 官方文档](https://mdxjs.com/)
- [Next.js App Router 文档](https://nextjs.org/docs/app)
