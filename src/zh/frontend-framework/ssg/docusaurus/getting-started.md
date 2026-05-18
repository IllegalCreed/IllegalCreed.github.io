---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Docusaurus 3.x（最新主线，要求 Node.js 20+ / React 18+ / MDX 3+ / TypeScript 5.1+）编写。

## 速查

- 系统要求：**Node.js 20.0+** + 任意包管理器（npm / yarn / pnpm / bun）
- 创建项目：`npx create-docusaurus@latest my-website classic --typescript`
- 启动 dev server：`npm run start`（默认端口 3000，Webpack Dev Server）
- 生产构建：`npm run build`（输出到 `build/` 目录）
- 本地预览生产：`npm run serve`
- 部署 GitHub Pages：`GIT_USER=<USERNAME> npm run deploy`
- 多版本：`npm run docusaurus docs:version 1.0.0`
- 翻译：`npm run write-translations -- --locale fr`
- 主题定制：`npm run swizzle @docusaurus/theme-classic ComponentName -- --wrap`
- 核心包：`@docusaurus/core` + `@docusaurus/preset-classic`（自带 docs / blog / pages / theme / sitemap）
- 必备目录：`docs/`（文档）+ `blog/`（博客）+ `src/pages/`（独立页面）+ `static/`（静态资源）
- 配置入口：`docusaurus.config.ts`（站点元数据 + 主题 + 插件）+ `sidebars.ts`（侧边栏）

## Docusaurus 适合什么场景

理解 Docusaurus 必须先理解它的**定位边界**——它是「**文档驱动**」站点框架，不是通用 SSG：

| 维度 | Docusaurus 3.x | VitePress 1.x | Starlight (Astro) | Nextra 3.x | MkDocs (Material) |
|---|---|---|---|---|---|
| 渲染框架 | React 18 + SSR | Vue 3 + Vite | Astro Island | Next.js 15 | Python + Jinja |
| 内容格式 | **MDX 3**（默认） | Markdown + Vue 组件 | Markdown + Astro/MDX | MDX 3 | Markdown |
| 多版本文档 | **✅ 一等公民** | ❌ 无 | ❌ 无（需手工） | ❌ 无 | 部分（mike 插件） |
| i18n | ✅ 完整工作流 | ✅ 配置型 | ✅ Astro i18n | ✅ Next.js 路由 | ✅ |
| 博客系统 | **✅ 内置（RSS / 作者 / 标签）** | ❌ 无 | ✅ blog plugin | ❌ 无 | ❌ 需插件 |
| 搜索 | Algolia DocSearch / local-search | Algolia / local minisearch | pagefind | Flexsearch | lunr.js |
| 构建速度 | 中（Webpack 5，3.x faster 可用 Rspack） | **极快**（Vite） | 快（Vite） | 中（Next.js） | 快 |
| 首屏 JS | ~200KB+ gzip（React + Router） | ~80KB | ~0KB（island） | ~150KB | ~30KB |
| 主题生态 | classic（事实唯一） | default + 自定义 | 默认主题 | 内置 + Tailwind | Material 等 |
| 典型用户 | React Native / Jest / Babel | Vue / Vite / Pinia | Astro / Tauri | tRPC | FastAPI / Pydantic |

**核心适合**：

- **大型开源项目文档**（要 docs + blog + 多版本 + i18n 全套）
- **React 生态项目**（自带 React 18，MDX 中可直接复用项目组件）
- **企业产品文档**（要 versioning + Algolia 搜索 + Edit on GitHub 等）
- **需要博客的项目**（自带 RSS / 作者档案 / 标签 / 截断 marker）

**不适合**：

- **极简博客**（用 Astro / Hugo 更轻）
- **Vue / Svelte 项目**（MDX 强绑定 React）
- **性能极致首屏**（200KB+ JS 起步，比 Astro Island 重一个数量级）
- **完全静态营销页**（Docusaurus 偏重「文档」结构）

## 创建项目

### 前置条件

```bash
node -v   # 必须 ≥ 20.0.0
```

如果版本不够，建议用 nvm / fnm 安装：

```bash
nvm install --lts && nvm use --lts
```

### 一行命令初始化

最简单的方式（**推荐用 TypeScript 模板**）：

```bash
npx create-docusaurus@latest my-website classic --typescript
```

参数说明：

- `my-website`：项目目录名（也是站点的 `projectName`）
- `classic`：模板名——目前几乎唯一的官方模板，包含 `@docusaurus/preset-classic`（docs + blog + pages + theme + sitemap 全套）
- `--typescript`：**强烈推荐**——生成 `.ts` 配置文件 + 完整类型支持

如果你不要 TypeScript：

```bash
npx create-docusaurus@latest my-website classic
# 会生成 .js 配置
```

### 其他模板

```bash
# 用社区模板
npx create-docusaurus@latest my-website https://github.com/some-org/template

# 从已有 git repo 复制
npx create-docusaurus@latest my-website ./local-template

# 不安装依赖（手动 install）
npx create-docusaurus@latest my-website classic --skip-install

# 用 yarn / pnpm / bun
npx create-docusaurus@latest my-website classic --package-manager pnpm
```

### 启动

```bash
cd my-website
npm run start
# 浏览器自动打开 http://localhost:3000
```

> Docusaurus dev server 用的是 **Webpack 5 Dev Server**——比 Vite 慢，但兼容性更好。首次启动需要约 5-10 秒；后续 HMR 一般 < 1 秒。

## 项目结构

`create-docusaurus@latest ... classic --typescript` 生成的标准结构：

```
my-website/
├── blog/                              # 📝 博客系统
│   ├── 2026-05-18-welcome/
│   │   └── index.mdx                  # 含目录（co-located）
│   ├── 2026-04-10-hello.mdx           # 平铺
│   ├── authors.yml                    # 作者档案
│   └── tags.yml                       # 标签声明
├── docs/                              # 📚 文档系统
│   ├── intro.md                       # /docs/intro
│   ├── tutorial-basics/               # 自动生成 category
│   │   ├── _category_.json            # 配置 category 元数据
│   │   ├── create-a-page.md
│   │   ├── create-a-document.md
│   │   └── markdown-features.mdx
│   └── tutorial-extras/
│       └── ...
├── src/                               # 🔧 React / 资源
│   ├── components/                    # 自定义 React 组件
│   │   └── HomepageFeatures/
│   │       ├── index.tsx
│   │       └── styles.module.css
│   ├── css/
│   │   └── custom.css                 # 全局样式 + Infima 变量
│   └── pages/                         # 独立页面（React / MDX）
│       ├── index.tsx                  # 首页 (/)
│       └── markdown-page.md           # /markdown-page
├── static/                            # 📦 静态资源（直接拷贝到 build/）
│   └── img/
│       ├── favicon.ico
│       ├── logo.svg
│       └── docusaurus-social-card.jpg
├── docusaurus.config.ts               # ⚙️ 站点配置
├── sidebars.ts                        # 📑 文档侧边栏配置
├── tsconfig.json                      # @docusaurus/tsconfig
├── babel.config.js
├── package.json
└── README.md
```

### 各目录用途

| 目录 / 文件 | 作用 |
|---|---|
| `docs/` | **文档系统**——`@docusaurus/plugin-content-docs` 读取，每个 `.md` / `.mdx` 自动成为一个 `/docs/...` 路由 |
| `blog/` | **博客系统**——`@docusaurus/plugin-content-blog` 读取，每个文件自动按日期排序，生成 `/blog/...` 路由 + RSS / Atom feed |
| `src/pages/` | **独立页面**——`@docusaurus/plugin-content-pages` 读取，文件路径直接映射 URL（`/index.tsx` → `/`，`/about.tsx` → `/about`） |
| `src/components/` | 自定义 React 组件（不自动成为路由） |
| `src/css/custom.css` | 全局样式 + Infima 主题变量覆盖（`--ifm-color-primary` 等） |
| `static/` | 静态资源——构建时**原样拷贝**到 `build/`，引用时用 `/img/...` 路径 |
| `docusaurus.config.ts` | **站点入口配置**（必需） |
| `sidebars.ts` | **文档侧边栏配置**（被 `docs` plugin 读取） |

## 第一份配置：`docusaurus.config.ts`

这是整个项目的总入口——站点元数据 / 主题 / 插件全部在这里声明。

```ts
// docusaurus.config.ts
import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  /** ========= 站点元数据 ========= */
  title: '我的文档站',
  tagline: '一个用 Docusaurus 3 搭建的文档站',
  favicon: 'img/favicon.ico',

  /** 部署地址（无尾斜杠） */
  url: 'https://my-site.com',
  /** baseUrl 必须以 / 结尾 */
  baseUrl: '/',

  /** GitHub Pages 部署用 */
  organizationName: 'my-org',
  projectName: 'my-site',

  /** 文档 / 链接 / 锚点出错时的行为：throw | warn | log | ignore */
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  onBrokenMarkdownLinks: 'warn',

  /** ========= 国际化（即使只用一种语言也必须配） ========= */
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': { label: '简体中文', htmlLang: 'zh-CN' },
      en: { label: 'English', htmlLang: 'en-US' },
    },
  },

  /** ========= 预设（一行启用 docs + blog + theme + sitemap） ========= */
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          /** GitHub 上的「Edit this page」链接 */
          editUrl: 'https://github.com/my-org/my-site/edit/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} My Site.`,
          },
          editUrl: 'https://github.com/my-org/my-site/edit/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  /** ========= 主题配置 ========= */
  themeConfig: {
    /** 默认社交分享图 */
    image: 'img/social-card.jpg',

    /** 顶部导航 */
    navbar: {
      title: '我的文档站',
      logo: { alt: 'Logo', src: 'img/logo.svg' },
      items: [
        {
          type: 'docSidebar',       // 自动关联 sidebars.ts 的 sidebar
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '文档',
        },
        { to: '/blog', label: '博客', position: 'left' },
        {
          href: 'https://github.com/my-org/my-site',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    /** 底部 footer */
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [{ label: '入门', to: '/docs/intro' }],
        },
        {
          title: '社区',
          items: [
            { label: 'GitHub', href: 'https://github.com/my-org/my-site' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Site.`,
    },

    /** 代码块主题 */
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
```

### 字段速览

| 字段 | 必需 | 说明 |
|---|---|---|
| `title` | ✅ | 站点标题（浏览器标签 / 元数据） |
| `tagline` | ❌ | 副标题 |
| `favicon` | ❌ | 浏览器图标，相对 `static/` |
| `url` | ✅ | 部署域名（无尾斜杠） |
| `baseUrl` | ✅ | 子路径（必须以 `/` 结尾，根域为 `/`） |
| `organizationName` | 部署 GH Pages | GitHub 用户/组织 |
| `projectName` | 部署 GH Pages | GitHub 仓库名 |
| `onBrokenLinks` | ❌ | `throw` / `warn` / `log` / `ignore` |
| `i18n` | ✅ | 即使单语言也要配（至少给 `defaultLocale`） |
| `presets` | 通常 ✅ | classic preset 是绝大多数项目的起点 |
| `themeConfig` | ❌ | navbar / footer / prism / colorMode 等 |
| `plugins` | ❌ | preset 外的独立插件 |
| `themes` | ❌ | preset 外的独立主题 |

## 第一篇文档

文档系统由 `@docusaurus/plugin-content-docs` 提供——`docs/` 下每个 `.md` / `.mdx` 自动成为一个 `/docs/<path>` 路由。

### 创建 `docs/intro.md`

```md
---
sidebar_position: 1
sidebar_label: 介绍
slug: /
---

# 欢迎来到 Docusaurus

这是用 **Docusaurus 3** 搭建的文档站。

## 一级标题

普通段落，可以有 [链接](https://docusaurus.io)、**加粗**、_斜体_、`行内代码`。

## 代码块

​```ts title="hello.ts"
const message: string = 'Hello, Docusaurus!'
console.log(message)
​```

> 也可以引用区块。
```

访问 `http://localhost:3000/docs/intro` 即可看到。

> 上面代码中的反引号 `​```` 实际是连续 3 个反引号；为避免 Markdown 解析错误，正文展示用了零宽空格分隔。下文同理。

### Frontmatter 常用字段

| 字段 | 类型 | 用途 |
|---|---|---|
| `id` | string | 文档唯一标识（默认为文件名） |
| `title` | string | 文档标题（覆盖第一个 `# h1`） |
| `sidebar_label` | string | 侧边栏显示文本（默认为 title） |
| `sidebar_position` | number | 排序权重（小的在前） |
| `slug` | string | 自定义 URL 路径（`/` 表示文档根） |
| `description` | string | SEO 描述 |
| `tags` | string[] | 标签 |
| `hide_title` | boolean | 隐藏页面 h1 |
| `hide_table_of_contents` | boolean | 隐藏右侧 TOC |
| `draft` | boolean | 生产构建跳过（dev 仍渲染） |
| `unlisted` | boolean | 不出现在 sidebar / 搜索，但可访问 |
| `pagination_prev` / `pagination_next` | string | 自定义底部上一篇/下一篇 |
| `custom_edit_url` | string | 自定义「Edit this page」链接 |
| `last_update` | object | `{ author, date }` 显式覆盖最后更新 |

### `_category_.json`：目录配置

`docs/tutorial-basics/_category_.json` 控制该目录在 sidebar 中的显示：

```json
{
  "label": "基础教程",
  "position": 2,
  "link": {
    "type": "generated-index",
    "title": "基础教程",
    "description": "从这里开始学习 Docusaurus 的核心特性",
    "slug": "/category/tutorial-basics"
  },
  "collapsible": true,
  "collapsed": false,
  "className": "tutorial-category"
}
```

`link.type` 三种：

- `generated-index`：自动生成包含子文档卡片的索引页
- `doc`：指定一个 docs id 作为 category 主页
- 省略：点 category 不跳转

## 第二份配置：`sidebars.ts`

控制文档左侧导航——读取 `docs/` 目录结构，可手动定义，也可全自动。

### 全自动模式（推荐）

```ts
// sidebars.ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  /** 一个名为 tutorialSidebar 的 sidebar，自动扫描 docs/ 所有内容 */
  tutorialSidebar: [
    { type: 'autogenerated', dirName: '.' },
  ],
}

export default sidebars
```

`autogenerated` 会按以下规则生成：

1. 每个目录 → 一个 category（label 取 `_category_.json.label` 或目录名）
2. 每个 `.md` / `.mdx` → 一个 doc 链接
3. 排序按 frontmatter `sidebar_position` → `_category_.json.position` → 文件名字典序

### 手写模式

```ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',                                  // 直接引用 docs/intro.md（id 为 "intro"）
    {
      type: 'category',
      label: '基础教程',
      collapsed: false,
      items: [
        'tutorial-basics/create-a-page',
        'tutorial-basics/create-a-document',
        'tutorial-basics/markdown-features',
      ],
    },
    {
      type: 'category',
      label: '进阶',
      link: { type: 'generated-index' },     // 点 category 跳转到自动生成的索引
      items: [
        { type: 'autogenerated', dirName: 'tutorial-extras' },
      ],
    },
    {
      type: 'link',
      label: '外部链接',
      href: 'https://docusaurus.io',
    },
  ],
}

export default sidebars
```

### 多 sidebar

可以为不同 url 路径配置不同 sidebar：

```ts
const sidebars: SidebarsConfig = {
  tutorialSidebar: [{ type: 'autogenerated', dirName: 'tutorial' }],
  apiSidebar: [{ type: 'autogenerated', dirName: 'api' }],
}
```

然后在 `themeConfig.navbar.items` 用 `sidebarId: 'apiSidebar'` 关联。

## 第一篇博客

博客系统由 `@docusaurus/plugin-content-blog` 提供——`blog/` 下每个 `.md` / `.mdx` 自动按 frontmatter `date` 倒序生成 `/blog/<slug>` 路由。

### 创建 `blog/2026-05-18-welcome/index.mdx`

```mdx
---
slug: welcome
title: 欢迎来到我们的博客
authors: [yangerxiao]
tags: [hello, docusaurus]
date: 2026-05-18T10:00
description: 这是我们的第一篇博客文章
image: /img/blog/welcome-cover.jpg
---

这是博客摘要——会出现在 `/blog` 列表页和 RSS 中。

{/* truncate */}

这部分内容**只在详情页显示**，不会出现在列表页摘要中。

## 一级标题

正文内容……
```

> 「truncate marker」：
>
> - `.md` 文件用 `<!-- truncate -->`
> - `.mdx` 文件用 `{/* truncate */}`
>
> 之前的内容会作为摘要显示在 `/blog` 列表和 RSS feed 中。

### 作者档案 `blog/authors.yml`

```yaml
yangerxiao:
  name: 杨二小
  title: 全栈开发
  url: https://github.com/yangerxiao
  image_url: https://github.com/yangerxiao.png
  email: yangerxiao@example.com
  page: true              # 生成作者归档页 /blog/authors/yangerxiao
  socials:
    x: yangerxiao
    github: yangerxiao
    linkedin: yangerxiao

guest-author:
  name: 来宾作者
  title: 客座撰稿人
  page: false             # 不生成归档页
```

frontmatter 用 `authors: [yangerxiao, guest-author]` 引用，多作者用数组。

### 标签声明 `blog/tags.yml`（可选）

```yaml
hello:
  label: 问候
  permalink: /hello
  description: 与新功能相关的问候帖

docusaurus:
  label: Docusaurus
  permalink: /docusaurus
  description: 关于 Docusaurus 工具本身的文章
```

如果 `onInlineTags` 配置为 `'throw'`，frontmatter 中没在 `tags.yml` 声明的标签会构建失败——这是大型项目避免标签泛滥的关键配置。

### 文件命名约定

`blog/` 下的文件支持以下三种命名（**任选其一**）：

```
blog/2026-05-18-hello.mdx                          # 平铺，前缀提取日期
blog/2026/05/18/hello.mdx                          # 嵌套目录
blog/2026-05-18-hello/index.mdx                    # ✨ 推荐：含目录，可放图片
                          ├── cover.jpg            # 同目录资源
                          └── diagram.svg
```

**推荐目录形式**——可以把图片 / 视频等附件**和文章放一起**（co-located），引用时 `![](./cover.jpg)`。

## 第一个独立页面

`src/pages/` 用于「不属于 docs / blog」的独立页面——可以是 React 组件（`.tsx`）或 Markdown（`.md` / `.mdx`）。

### React 页面（`src/pages/about.tsx`）

```tsx
// src/pages/about.tsx
import React from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'

/**
 * 关于页（自定义 React 页面）
 * - 必须用 <Layout> 包装才有 navbar / footer
 * - 可以用任何 React 组件
 */
export default function About(): React.ReactNode {
  return (
    <Layout
      title="关于我们"
      description="关于这个文档站的故事"
    >
      <main className="container margin-vert--lg">
        <h1>关于我们</h1>
        <p>这是用 React 写的独立页面。</p>
        <Link to="/docs/intro" className="button button--primary">
          查看文档
        </Link>
      </main>
    </Layout>
  )
}
```

访问 `http://localhost:3000/about` 即可看到。

### Markdown 页面（`src/pages/contact.md`）

```md
---
title: 联系我们
description: 联系方式
hide_table_of_contents: true
---

# 联系我们

邮箱：hello@example.com

GitHub：[my-org](https://github.com/my-org)
```

`.md` / `.mdx` 页面会自动套用主题的 Layout，无需手动 import。

### 路由规则

| 文件路径 | 生成 URL |
|---|---|
| `src/pages/index.tsx` | `/`（首页） |
| `src/pages/about.tsx` | `/about` |
| `src/pages/blog/index.tsx` | ⚠️ 与 blog plugin 冲突 |
| `src/pages/products/index.tsx` | `/products/` |
| `src/pages/products/foo.md` | `/products/foo` |
| `src/pages/_internal/util.tsx` | ❌ 下划线前缀**不生成路由**（用于工具文件） |

## MDX 入门

Docusaurus 3.x 默认用 **MDX 3**——`.md` 和 `.mdx` 都通过 MDX 编译器处理，**默认两者均允许 JSX**。可在 `config.markdown.format` 中分别控制：

```ts
markdown: {
  format: 'mdx',     // 'mdx' | 'md' | 'detect'
}
```

- `'mdx'`（默认）：所有文件按 MDX 编译——支持 JSX
- `'md'`：所有按 CommonMark 编译——禁用 JSX
- `'detect'`：按扩展名决定（`.md` → CommonMark，`.mdx` → MDX）

### 在 Markdown 中嵌入 React 组件

```mdx
---
title: MDX 示例
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

# MDX 完整示例

普通 Markdown 段落。

<Tabs>
  <TabItem value="npm" label="npm" default>
    ​```bash
    npm install docusaurus
    ​```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ​```bash
    pnpm add docusaurus
    ​```
  </TabItem>
</Tabs>

也可以直接在 MDX 里 `export` 变量：

export const author = '杨二小'

本文作者：**{author}**
```

> MDX 3 严格规则：
>
> - `{` 会被识别为 **JSX 表达式开始**——若要显示字面 `{` 字符，用 `&#123;` 或反引号包裹：`` `{value}` ``
> - `<` 会被识别为 **JSX 标签开始**——若要显示字面 `<`，用 `&lt;` 或反引号
> - 大写组件名（如 `<Highlight>`）才会被识别为 React 组件，小写名（`<div>`）当原生 HTML

### `@site` 路径别名

MDX / TSX 中导入项目内文件用 `@site` 别名（指向项目根）：

```tsx
import HelloComponent from '@site/src/components/Hello'
import config from '@site/docusaurus.config'
```

## 本地开发

### 启动 dev server

```bash
npm run start
```

常用选项：

```bash
npm run start -- --port 4000        # 改端口
npm run start -- --host 0.0.0.0     # 局域网可访问
npm run start -- --no-open          # 不自动打开浏览器
npm run start -- --locale en        # 指定语言（多语言项目）
npm run start -- --no-minify        # 关闭压缩（调试用）
```

### 文件监听

Dev server 监听：

- `docusaurus.config.ts` / `sidebars.ts`：**修改后会自动重启 server**
- `docs/` / `blog/` / `src/pages/`：HMR 热更新
- `src/components/` / `src/css/custom.css`：HMR
- `static/`：刷新页面才生效

### 清理缓存

如果遇到 HMR 异常或构建错误：

```bash
npm run clear
# 清除 .docusaurus/ 缓存目录
```

## 构建与部署

### 生产构建

```bash
npm run build
# 输出到 build/ 目录
```

常用选项：

```bash
npm run build -- --out-dir public      # 改输出目录
npm run build -- --bundle-analyzer     # 启动 Webpack Bundle Analyzer
npm run build -- --locale en           # 只构建一种语言
npm run build -- --no-minify           # 不压缩（调试用）
```

### 本地预览生产构建

```bash
npm run serve
# 启动 http://localhost:3000（默认）
```

### 部署到 GitHub Pages

最简单的方式——用官方 `deploy` 命令：

```ts
// docusaurus.config.ts
export default {
  url: 'https://my-org.github.io',
  baseUrl: '/my-site/',                  // 仓库名（如果用 user/org 主页则 '/'）
  organizationName: 'my-org',
  projectName: 'my-site',
  trailingSlash: false,
}
```

执行部署：

```bash
GIT_USER=my-username npm run deploy
# 会构建 + 推送到 gh-pages 分支
```

### GitHub Actions 自动化部署

更推荐用 GitHub Actions——每次 push 自动构建 + 部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 部署到 Vercel / Netlify

- **Vercel**：直接导入 GitHub 仓库——零配置，自动识别 Docusaurus
- **Netlify**：在 `netlify.toml` 配置 `build.command = "npm run build"` 和 `build.publish = "build"`；并在站点设置中**关闭 Pretty URLs**（否则会和 Docusaurus 的 `trailingSlash` 冲突）

## 项目脚本一览

`create-docusaurus` 生成的 `package.json` 默认脚本：

| 脚本 | 命令 | 说明 |
|---|---|---|
| `start` | `docusaurus start` | 启动 dev server（默认 3000） |
| `build` | `docusaurus build` | 生产构建 |
| `swizzle` | `docusaurus swizzle` | 主题组件定制 |
| `deploy` | `docusaurus deploy` | 部署 GitHub Pages |
| `clear` | `docusaurus clear` | 清理 `.docusaurus/` 缓存 |
| `serve` | `docusaurus serve` | 预览 `build/` 产物 |
| `write-translations` | `docusaurus write-translations` | 提取翻译文件 |
| `write-heading-ids` | `docusaurus write-heading-ids` | 给所有标题加显式 ID |
| `typecheck` | `tsc` | TypeScript 类型检查 |

## TypeScript 支持

`--typescript` 模板已经把 TS 配齐——以下是关键文件：

### `tsconfig.json`

```json
{
  "extends": "@docusaurus/tsconfig",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src/", "docs/", "blog/"]
}
```

`@docusaurus/tsconfig` 已经包含 React JSX / ESM / strict 等默认配置。

### `@docusaurus/module-type-aliases`

让 `@theme/*` / `@site/*` / `@docusaurus/*` 等路径别名有完整类型推断：

```tsx
import Link from '@docusaurus/Link'              // ✅ 完整类型
import Layout from '@theme/Layout'                // ✅ 完整类型
import config from '@site/docusaurus.config'      // ✅ 完整类型
```

### `docusaurus.config.ts` 类型

```ts
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  // ...
  presets: [
    [
      'classic',
      { /* ... */ } satisfies Preset.Options,   // ⭐ 用 satisfies 获得提示
    ],
  ],
  themeConfig: { /* ... */ } satisfies Preset.ThemeConfig,
}
```

### Swizzle TypeScript 组件

```bash
npm run swizzle @docusaurus/theme-classic Footer -- --wrap --typescript
# 生成 .tsx 文件
```

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：文档系统 / 博客系统 / MDX 完整能力 / 多版本文档 / i18n / Swizzle / Plugin / Algolia 搜索 / Markdown 增强 / 客户端 API / 部署
- [参考](./reference.md)：`docusaurus.config.ts` 字段全表 / `sidebars.ts` 完整语法 / Frontmatter 速查 / CLI 命令全集 / MDX 内置组件 / Hooks 全集 / 文件约定
