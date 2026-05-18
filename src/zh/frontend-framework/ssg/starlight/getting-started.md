---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Starlight 0.x 最新稳定版（**Starlight 0.36.x** / 2026-05 状态，跟随 **Astro 5.x** 大版本，要求 **Node.js 18.20.8+ / 20.3.0+ / 22+**）编写。

## 速查

- 系统要求：**Node.js v18.20.8 / v20.3.0 / v22.0.0 及以上**（Astro 5 要求）
- 推荐包管理器：**pnpm**（速度快、磁盘省，monorepo 友好）
- 脚手架命令：`pnpm create astro@latest -- --template starlight`
- 启动 dev server：`pnpm dev`（默认 `http://localhost:4321`）
- 生产构建：`pnpm build`（输出到 `dist/`）
- 本地预览：`pnpm preview`（预览 `dist/` 静态文件）
- Astro 集成添加：`pnpm astro add starlight`（在已有 Astro 项目里追加）
- 内容目录：`src/content/docs/`（`.md` / `.mdx` / `.mdoc`）
- 配置文件：`astro.config.mjs`（核心）+ `src/content.config.ts`（内容集合）
- 核心包：`astro`（运行时）+ `@astrojs/starlight`（主题）

## Starlight 适合什么场景

理解 Starlight 必须先理解它的**底层是 Astro**——所以它不仅是文档主题，更是一个**完整的 Astro 项目**：

| 维度 | Starlight 0.36 | VitePress 2 | Nextra 4 | Docusaurus 3 | Eleventy 3 | Hexo 8 |
|---|---|---|---|---|---|---|
| 底层运行时 | **Astro 5** | Vite + Vue 3 | Next.js 15 | Webpack + React | Node.js | Node.js |
| 默认渲染 | **零客户端 JS（Islands 按需）** | Vue Runtime | React 18 | React + SSR | 纯 HTML | 纯 HTML |
| MDX / Markdoc | **MDX 3 + Markdoc 双支持** | Vue 组件 | MDX | MDX 3 | 自配 | Markdown |
| 多框架组件混搭 | **✅ React / Vue / Svelte / Solid / Preact** | ❌ 仅 Vue | ❌ 仅 React | ❌ 仅 React | 自配 | ❌ |
| 默认搜索 | **Pagefind 内置** | 客户端 mini search / Algolia | Flexsearch | Algolia | 自配 | local-search 插件 |
| 多版本文档 | ⚠️ 第三方 `starlight-versions` | ❌ | ❌ | **✅ 一等公民** | ❌ | ❌ |
| i18n | **✅ 完整 + RTL** | ⚠️ 较弱 | ⚠️ 较弱 | ✅ 完整 | ⚠️ plugin | ❌ |
| 默认主题数 | 1（可深度定制） | 1 | 1 | 1 | 0 | 440+ |
| 构建速度 | **快**（Astro 5 / Vite） | **极快**（Vite HMR） | 中（Next.js） | 慢（Webpack） | 快 | 中 |
| 配置文件 | `astro.config.mjs` 单文件 | `.vitepress/config.ts` | `theme.config.tsx` + `_meta.json` | `docusaurus.config.ts` + `sidebars.ts` | `eleventy.config.mjs` | `_config.yml` |
| 适用规模 | 中小型文档 + 内嵌应用 | 中小型 Vue 文档 | Next.js 项目文档 | 大型多版本文档 | 性能优先内容站 | 个人博客 |

**核心适合**：

- **Astro 已经在用 / 团队熟 Astro** 的项目（无缝集成在同一个 monorepo / 同一个项目）
- **想在 Markdown 里混用 React + Vue + Svelte 组件** 的"框架不可知"团队
- **追求零客户端 JS + 完美 Lighthouse**（默认零 hydration）
- **现代设计风格**（出厂自带优雅的暗色 / 浅色主题，比 Docusaurus classic 视觉新）
- **i18n 文档站**（locales 配置一行，比 VitePress / Nextra 完整）
- **开箱即用的全文搜索**（Pagefind 零配置，无需 Algolia 审核）
- **嵌入交互组件**（在文档里塞一个 React 表单 / 一个 Vue 图表 / 一个 Svelte demo）

**不适合**：

- **重度多版本文档站**（要 Docusaurus 那样的 `docs:version` 命令，应选 Docusaurus；Starlight 要装第三方插件）
- **完全不想接触 Astro**（Starlight 本质是 Astro 项目，跟着 Astro 走）
- **想要 440 主题选项**（Hexo / Hugo 主题数量级远超 Starlight）
- **超大型站（万级页面）**（Astro 构建在万级页面规模不如 Hugo 单二进制）
- **博客一站式（分类 / 标签 / 归档）**（Starlight 没内置博客，要装 `starlight-blog` 插件）

## 系统准备

### Node.js 版本

Starlight 0.36（基于 Astro 5）要求 **Node.js v18.20.8 / v20.3.0 / v22.0.0 及以上**（v19 / v21 等奇数版本不被官方支持）：

```bash
node -v
# 必须 >= v18.20.8 / v20.3.0 / v22.0.0
```

历史版本兼容关系：

| Starlight 版本 | Astro 版本 | Node.js 最低要求 |
|---|---|---|
| 0.36.x | Astro 5.x | 18.20.8 / 20.3.0 / 22+ |
| 0.30.x | Astro 4.x | 18.14.1+ / 20.x+ |
| 0.20.x | Astro 4.x | 18.14.1+ |
| 0.10.x | Astro 3.x | 18.14.1+ |

**强烈推荐用 nvm / fnm 管理 Node 版本**：

```bash
# nvm（最广泛）
nvm install 22 && nvm use 22

# fnm（速度更快）
fnm install 22 && fnm use 22
```

### 包管理器

任选其一，推荐 **pnpm**（Astro 文档推荐）：

```bash
npm -v       # Node 自带
pnpm -v      # 推荐
yarn -v      # 也可（注意 Yarn 4 PnP 模式可能有问题）
bun -v       # Bun runtime 也支持
```

> 本笔记示例统一用 **pnpm**。把 `pnpm` 换成 `npm` / `yarn` / `bun` 命令均可。

## 脚手架创建项目

### 用 Starlight 模板创建

最简单的开始方式——一行命令：

```bash
pnpm create astro@latest -- --template starlight
```

命令会启动交互式向导，依次询问：

1. **项目目录名**（默认 `./my-starlight-project`）
2. **是否安装依赖**（推荐 Yes）
3. **是否初始化 Git 仓库**（推荐 Yes）
4. **是否使用 TypeScript strict 模式**（推荐 strict）

完整选项：

```bash
# 跳过所有提问，直接用默认值
pnpm create astro@latest my-docs -- --template starlight --install --git --typescript strict

# 不安装依赖（之后自己 pnpm install）
pnpm create astro@latest my-docs -- --template starlight --no-install
```

### 其他模板变体

Starlight 还提供几个预设模板：

```bash
# 默认模板（基础 Starlight）
pnpm create astro@latest -- --template starlight

# Tailwind v4 模板（含 starlight-tailwind 集成）
pnpm create astro@latest -- --template starlight/tailwind

# 博客模板（含 starlight-blog 插件）
pnpm create astro@latest -- --template starlight/blog
```

### 在已有 Astro 项目里追加 Starlight

如果你已经有一个 Astro 项目，想把 Starlight 添加进去：

```bash
# 1. 进入已有 Astro 项目根目录
cd my-astro-project

# 2. 用 astro add 命令一键添加（自动安装 + 修改 astro.config.mjs）
pnpm astro add starlight

# 3. 手动添加 content collections 配置（见下文）
```

`astro add` 命令会做以下事情：

- 安装 `@astrojs/starlight` 到 `dependencies`
- 修改 `astro.config.mjs`，添加 `starlight()` 集成
- 提示是否更新 `astro.config.mjs`（按 Y 确认）

> ⚠️ `astro add` 不会自动创建 `src/content.config.ts` 和 `src/content/docs/` 目录，需要手动加（见 [手动配置](#手动配置) 章节）。

## 项目结构

`pnpm create astro@latest -- --template starlight` 生成的项目结构：

```
my-starlight-project/
├── astro.config.mjs          # Astro 主配置 + Starlight 集成
├── package.json
├── tsconfig.json             # TypeScript 配置（默认 strict）
├── public/                   # 静态资源（直接复制到 dist，不处理）
│   └── favicon.svg
├── src/
│   ├── assets/               # 由 Vite 处理的图片 / 资源
│   │   └── houston.webp
│   ├── content/
│   │   └── docs/             # 所有文档 Markdown / MDX 文件
│   │       ├── index.mdx     # 首页（用 splash template）
│   │       ├── guides/
│   │       │   └── example.md
│   │       └── reference/
│   │           └── example.md
│   └── content.config.ts     # Content Collections 配置
└── .gitignore
```

### 各目录用途

| 路径 | 作用 |
|---|---|
| `src/content/docs/` | **核心目录**——每个 `.md` / `.mdx` / `.mdoc` 自动变成一个页面 |
| `src/content/i18n/` | （可选）UI 翻译 JSON / YAML 文件 |
| `src/assets/` | 由 Vite 处理的图片（自动优化 / 哈希）—— Markdown 用相对路径引用 |
| `src/components/` | 自定义 `.astro` 组件（用于覆盖 Starlight 默认组件） |
| `src/styles/` | 自定义 CSS（通过 `customCss` 注入） |
| `public/` | 静态资源直传（favicon / robots.txt / 字体文件 / PDF 等）—— **不被 Vite 处理** |
| `astro.config.mjs` | Astro 主配置 + Starlight 集成配置（sidebar / locales / customCss 全部在此） |
| `src/content.config.ts` | Content Collections 配置（指定 `docsLoader()` + `docsSchema()`） |

### URL 路由规则

`src/content/docs/` 下的文件自动映射成 URL：

```
src/content/docs/index.md          → /
src/content/docs/about.md          → /about/
src/content/docs/guides/quick.md   → /guides/quick/
src/content/docs/reference/api.mdx → /reference/api/
```

> 注意：Starlight 默认启用 **trailing slash**（URL 末尾有 `/`），跟 Vercel / Netlify / Cloudflare Pages 默认行为一致。

## 手动配置

如果你想完全手动从零搭建（不用脚手架），步骤如下：

### 1. 初始化 Astro 项目

```bash
mkdir my-docs && cd my-docs
pnpm init
pnpm add astro
```

### 2. 安装 Starlight

```bash
pnpm add @astrojs/starlight
```

### 3. 编辑 `astro.config.mjs`

在项目根目录创建：

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: '我的文档站',
      description: 'Starlight 中文笔记示例',
      // 后续会添加 sidebar / locales / customCss
    }),
  ],
});
```

### 4. 配置 Content Collections

Astro 5 通过 Content Collections 加载内容——必须在 `src/content.config.ts` 里注册 Starlight 的 schema：

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

> 上面的 `docsLoader()` 会自动扫描 `src/content/docs/` 下的 `.md` / `.mdx` / `.mdoc` 文件；`docsSchema()` 提供 Starlight 全套 frontmatter 字段（`title` / `description` / `template` / `hero` / `sidebar` 等）的 Zod 校验。

### 5. 添加首个文档

```md
<!-- src/content/docs/index.md -->
---
title: 欢迎
description: 我的 Starlight 文档站首页
---

# 你好，Starlight!

这是首页内容，用标准 **Markdown** 编写。
```

### 6. 添加 `package.json` 脚本

```json
{
  "name": "my-docs",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/starlight": "^0.36.0"
  }
}
```

### 7. 启动 dev server

```bash
pnpm dev
# 访问 http://localhost:4321
```

如果一切正常，浏览器打开会看到默认的 Starlight 首页。

## 第一篇文档

### 创建 `.md` 文件

在 `src/content/docs/` 下新建文件——比如 `src/content/docs/guides/install.md`：

```md
---
title: 安装指南
description: 学习如何安装我们的工具
---

# 安装

按以下步骤完成安装：

1. 下载安装包
2. 解压
3. 运行 `./install.sh`

## 系统要求

- macOS 13+
- Linux（Ubuntu 22.04+ / Debian 12+）
- Windows 11
```

保存后，**dev server 自动热重载**——浏览器会立即更新到 `http://localhost:4321/guides/install/`。

### Frontmatter 基础

Starlight 文档至少需要一个 `title`：

```yaml
---
title: 页面标题（必填）
description: 用于 SEO meta description
slug: custom-url        # 可选：覆盖默认 URL
editUrl: false          # 可选：禁用编辑链接
lastUpdated: 2026-05-18 # 可选：手动指定更新日期
draft: true             # 可选：标记为草稿，生产构建会跳过
pagefind: false         # 可选：从搜索索引中排除
template: doc           # 'doc'（默认）或 'splash'（首页/落地页）
---
```

> 更完整的 frontmatter 字段在 [参考](./reference.md#frontmatter-字段) 章节。

### 用 MDX 嵌入组件

如果想在 Markdown 里用 Starlight 内置组件（Card / Tabs / Aside），必须把文件扩展名改为 `.mdx`：

```bash
# 重命名
mv src/content/docs/guides/install.md src/content/docs/guides/install.mdx
```

然后在文件顶部 `import` 组件：

```mdx
---
title: 安装指南
---

import { Card, Tabs, TabItem } from '@astrojs/starlight/components';

<Card title="提示" icon="information">
  请确保你的 Node.js 版本 >= 18。
</Card>

<Tabs>
  <TabItem label="macOS">
    使用 Homebrew：`brew install mytool`
  </TabItem>
  <TabItem label="Linux">
    使用 apt：`sudo apt install mytool`
  </TabItem>
</Tabs>
```

> 更多组件用法在 [指南](./guide-line.md#内置组件) 章节。

## Sidebar 配置

`astro.config.mjs` 的 `sidebar` 字段决定左侧导航。最常见的两种配置方式：

### 方式 1：手动列出

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: '我的文档站',
      sidebar: [
        {
          label: '入门',
          items: [
            { label: '介绍', slug: 'guides/intro' },
            { label: '安装', slug: 'guides/install' },
          ],
        },
        {
          label: '参考',
          items: [
            { label: 'CLI', slug: 'reference/cli' },
            { label: 'API', slug: 'reference/api' },
          ],
        },
        // 外部链接
        {
          label: '社区',
          items: [
            { label: 'GitHub', link: 'https://github.com/myproject' },
          ],
        },
      ],
    }),
  ],
});
```

每个 `items` 元素可以是：

- **内部链接**：`{ label: '...', slug: 'guides/install' }`（注意 slug 不含 `src/content/docs/` 前缀）
- **外部链接**：`{ label: '...', link: 'https://...' }`
- **嵌套 group**：`{ label: '子分类', items: [...] }`
- **自动生成**：`{ label: '...', autogenerate: { directory: 'guides' } }`

### 方式 2：自动生成

`autogenerate` 会扫描指定目录，根据文件名（字母排序）自动生成：

```js
sidebar: [
  {
    label: '入门',
    autogenerate: { directory: 'guides' },   // 扫描 src/content/docs/guides/
  },
  {
    label: '参考',
    autogenerate: { directory: 'reference', collapsed: true },
  },
],
```

> 想自定义顺序的话，在每个 `.md` 文件 frontmatter 加 `sidebar.order: 1`：
> ```yaml
> ---
> title: 介绍
> sidebar:
>   order: 1
> ---
> ```

## 启动 dev server

### 基础命令

```bash
pnpm dev
```

默认行为：

- 启动 Vite dev server 在 `http://localhost:4321`
- 自动打开浏览器（可关闭）
- **HMR 热模块更新**——`.md` / `.mdx` / `.astro` / `.css` 修改后浏览器自动更新（不刷新整页）

### 常用 flag

```bash
# 自定义端口
pnpm dev --port 3000

# 自定义 host（让局域网设备能访问）
pnpm dev --host 0.0.0.0

# 不自动打开浏览器
pnpm dev --open false

# 调试 verbose 模式
pnpm dev --verbose
```

### 项目脚本

`package.json` 默认有这些脚本：

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动 dev server（HMR + Source Map） |
| `pnpm build` | 生产构建，输出到 `dist/` |
| `pnpm preview` | 本地预览 `dist/`（生产模式预览） |
| `pnpm astro add ...` | 添加 Astro 集成（如 `astro add mdx`） |
| `pnpm astro check` | 类型检查（`.astro` 文件 + `.ts` + frontmatter Zod） |

## 主题切换（暗色 / 浅色）

Starlight **开箱即用支持暗色 / 浅色 / 自动跟随系统**——**完全无需任何配置**：

- 默认头部右上角有「主题切换」按钮（Light / Dark / Auto）
- 用户选择会持久化到 `localStorage`
- 服务端渲染时优先用 `prefers-color-scheme` media query 避免 flash

### 自定义主题色

只需要覆盖 CSS 自定义属性。在 `src/styles/custom.css`：

```css
:root {
  /* 浅色模式 accent 色（主色） */
  --sl-color-accent-low: #fff5e0;
  --sl-color-accent: #f1a500;
  --sl-color-accent-high: #5a3e00;
}

:root[data-theme='dark'] {
  /* 深色模式 accent 色 */
  --sl-color-accent-low: #3a2900;
  --sl-color-accent: #f1a500;
  --sl-color-accent-high: #fff5e0;
}
```

然后在 `astro.config.mjs` 注入：

```js
starlight({
  title: '...',
  customCss: [
    './src/styles/custom.css',
  ],
}),
```

> 完整的 CSS 自定义属性列表在 [指南](./guide-line.md#css-customization) 和 [参考](./reference.md#css-自定义属性) 章节。

## 添加 Logo

把 logo 图片放到 `src/assets/`，然后在 `astro.config.mjs`：

```js
starlight({
  title: '我的文档站',
  logo: {
    src: './src/assets/logo.svg',
    alt: '我的文档站 Logo',
  },
}),
```

### Logo 替换标题

如果只想显示 logo 不显示文字标题：

```js
starlight({
  title: '我的文档站',
  logo: {
    src: './src/assets/logo.svg',
    alt: '...',
    replacesTitle: true,
  },
}),
```

### 暗色 / 浅色不同 logo

```js
starlight({
  title: '...',
  logo: {
    light: './src/assets/logo-light.svg',
    dark: './src/assets/logo-dark.svg',
    alt: '...',
  },
}),
```

## 添加 Favicon

把 `favicon.svg` 放到 `public/` 目录（Astro 不处理 `public/`，原样复制到 `dist/`），然后：

```js
starlight({
  title: '...',
  favicon: '/favicon.svg',  // 路径以 / 开头，相对 public/
}),
```

### 多 favicon 格式

如果想同时支持 `.svg` + `.png` + `.ico`：

```js
starlight({
  title: '...',
  favicon: '/favicon.svg',
  head: [
    {
      tag: 'link',
      attrs: {
        rel: 'icon',
        href: '/favicon-32.png',
        type: 'image/png',
      },
    },
    {
      tag: 'link',
      attrs: {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    },
  ],
}),
```

## 社交链接

在头部右上角显示 GitHub / Discord / Twitter 等图标：

```js
starlight({
  title: '...',
  social: [
    {
      label: 'GitHub',
      icon: 'github',
      href: 'https://github.com/myproject',
    },
    {
      label: 'Discord',
      icon: 'discord',
      href: 'https://discord.gg/myproject',
    },
    {
      label: 'X (Twitter)',
      icon: 'x.com',
      href: 'https://x.com/myproject',
    },
  ],
}),
```

支持的 icon 名称包括：`github` / `gitlab` / `gitea` / `codeberg` / `discord` / `mastodon` / `x.com` / `youtube` / `twitch` / `instagram` / `facebook` / `linkedin` / `email` / `rss` 等（完整列表见 [参考](./reference.md#social-图标)）。

## 构建生产版本

### 单次构建

```bash
pnpm build
```

输出：

```
dist/
├── index.html
├── guides/
│   └── install/
│       └── index.html
├── reference/
│   └── api/
│       └── index.html
├── _astro/                  # JS / CSS hashed assets
│   └── ...
└── pagefind/                # Pagefind 搜索索引（开箱即用）
    ├── pagefind.js
    ├── pagefind-ui.js
    ├── wasm/
    └── index/
```

### 本地预览

```bash
pnpm preview
# 默认 http://localhost:4321
```

预览模式跟生产环境一致——可以测试搜索（Pagefind）、跨页面导航、404 页等。

## 部署

Starlight 站点默认是 **100% 静态站点**——可以部署到任何静态托管平台。

### 部署到 Vercel

最简单：

1. 把代码推到 GitHub / GitLab
2. 在 [vercel.com](https://vercel.com) 导入项目
3. Vercel 自动识别 Astro 项目，使用默认构建命令 `astro build` + 输出目录 `dist/`
4. 点击 Deploy

或者用 Vercel CLI：

```bash
pnpm add -D vercel
pnpm vercel
```

### 部署到 Netlify

1. 把代码推到 GitHub / GitLab
2. 在 [netlify.com](https://netlify.com) 导入项目
3. Build command: `astro build`
4. Publish directory: `dist`
5. Deploy

或者用 Netlify CLI：

```bash
pnpm add -D netlify-cli
pnpm netlify deploy --prod
```

### 部署到 Cloudflare Pages

1. 把代码推到 GitHub
2. 在 Cloudflare Pages 创建项目，连接 GitHub
3. Build command: `pnpm build`
4. Build output directory: `dist`
5. **Environment variables**: 添加 `NODE_VERSION=22`（Cloudflare Pages 默认 Node 版本可能过低）

### 部署到 GitHub Pages

1. `astro.config.mjs` 设置 `site` 和 `base`：

   ```js
   export default defineConfig({
     site: 'https://yourname.github.io',
     base: '/your-repo-name/',
     integrations: [starlight({ /* ... */ })],
   });
   ```

2. 创建 `.github/workflows/deploy.yml`：

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v3
           with:
             version: 9
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: pnpm
         - run: pnpm install
         - run: pnpm build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. GitHub 仓库设置：**Settings → Pages → Source: GitHub Actions**

### 部署到 Deno Deploy（SSR 模式）

如果想用按需渲染（SSR），需要先添加 Node / Deno adapter：

```bash
pnpm astro add node
# 或
pnpm astro add deno
```

然后 `astro.config.mjs` 加 `output: 'server'`：

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import deno from '@deno/astro-adapter';

export default defineConfig({
  output: 'server',
  adapter: deno(),
  integrations: [
    starlight({
      prerender: true,   // Starlight 仍然预渲染（性能更好）
      title: '...',
    }),
  ],
});
```

> ⚠️ Starlight 推荐保持 `prerender: true`——Pagefind 内置搜索依赖预渲染产物，关闭后搜索失效。

## 升级 Starlight

Starlight 跟着 Astro 升级。最简单的方式：

```bash
pnpm astro check          # 先检查是否有破坏性变更
pnpm dlx @astrojs/upgrade  # 自动升级 Astro + 所有 @astrojs/* 包
```

或者手动：

```bash
pnpm update astro @astrojs/starlight --latest
```

### 升级前的检查

每次升级前看一下 Starlight 的 [CHANGELOG.md](https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md)，重点关注：

- **Breaking changes**：配置字段重命名 / 删除
- **Minimum versions**：Node.js / Astro 最低版本提升
- **Component changes**：内置组件 props 变更
- **CSS variables**：自定义属性新增 / 重命名

## 调试技巧

### 检查 Zod schema 报错

frontmatter 不符合 schema 时，dev server 会报错：

```
ZodError: Required at "title"
```

解决方法：

- 确认 frontmatter 顶部有 `title:`
- 用 `pnpm astro check` 静态检查所有内容文件

### 检查路由

`pnpm dev` 启动时控制台会打印生成的路由。如果某个文件没出现，检查：

1. 文件是否在 `src/content/docs/` 下
2. 文件扩展名是 `.md` / `.mdx` / `.mdoc`
3. frontmatter 没有 `draft: true`（dev 模式仍可访问，生产构建会跳过）

### 清缓存

如果遇到诡异问题（HMR 不工作 / 组件不更新），删 `.astro/` 缓存目录：

```bash
rm -rf .astro/ node_modules/.vite/ dist/
pnpm install
pnpm dev
```

## 下一步

入门到此结束——你已经能：

- 创建一个 Starlight 项目
- 写第一篇 Markdown / MDX 文档
- 配置 sidebar / logo / favicon / social
- 启动 dev server / 构建 / 部署

接下来推荐：

- [指南](./guide-line.md) —— 深入内容编写 / Frontmatter 全集 / Sidebar 高级配置 / i18n / CSS 定制 / 内置组件 / Plugin 生态
- [参考](./reference.md) —— `astro.config.mjs` 字段速查 / Frontmatter 字段表 / 组件 props 表
