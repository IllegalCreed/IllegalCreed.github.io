---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Starlight 0.36.x（跟随 Astro 5.x）。覆盖内容编写、Frontmatter 字段、Sidebar 配置、i18n、CSS / Tailwind 定制、内置组件、Pagefind 搜索、Plugin 生态、Astro Islands 嵌入、Markdown 增强、部署等核心实战内容。

## 配置文件

### `astro.config.mjs` 主配置

所有 Starlight 配置都写在 `astro.config.mjs` 的 `starlight()` 集成里：

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  // Astro 站点级配置
  site: 'https://mydocs.example.com',  // 生产 URL（生成 sitemap / canonical / OG 用）
  base: '/',                            // 子路径部署时用（如 GitHub Pages '/repo-name/'）
  trailingSlash: 'always',              // 'always' | 'never' | 'ignore'

  // Vite 配置（透传给 Vite）
  vite: {
    resolve: {
      alias: { '@': '/src' },
    },
  },

  // Astro 集成（Starlight 是其中一个）
  integrations: [
    starlight({
      title: '我的文档站',
      description: '这是我的 Starlight 文档站',
      // ... 大量 Starlight 字段
    }),
  ],
});
```

### `src/content.config.ts` 内容集合

`docsLoader()` 扫描 `src/content/docs/`，`docsSchema()` 提供 Zod 校验：

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
  // 可选：UI 翻译集合
  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema(),
  }),
};
```

### 扩展 Frontmatter schema

如果想加自定义 frontmatter 字段（比如 `author` / `tags`），用 `extend`：

```ts
import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        author: z.string().optional(),
        tags: z.array(z.string()).default([]),
        // 也可以重写默认字段
        // title: z.string().min(3),  // 强制 title 至少 3 字符
      }),
    }),
  }),
};
```

后续在组件 / 模板里可以用 `entry.data.author` 访问。

## Markdown / MDX / Markdoc 内容编写

### Markdown（.md）

最简单——直接写标准 Markdown：

```md
---
title: 安装指南
description: 学习如何安装我们的工具
---

# 安装

## 系统要求

- macOS 13+
- Linux

## 步骤

1. 下载
2. 解压
3. 运行 `./install`
```

支持的标准 Markdown 特性：

- 段落 / 强调 / 列表 / 链接 / 图片
- 表格（GFM 风格）
- 代码块 / 内联代码
- 引用块 / 横线
- 任务列表（`- [ ]` / `- [x]`）
- 删除线（`~~text~~`）
- 自动链接（裸 URL 自动转链接）
- 脚注（`[^1]` + `[^1]: ...`）

### MDX（.mdx）

把 `.md` 改成 `.mdx` 后可以：

- `import` Astro / React / Vue / Svelte 组件
- 写 JSX 表达式（如 `{2 + 2}`）
- `export` 变量给布局使用

```mdx
---
title: 安装
---

import { Card } from '@astrojs/starlight/components';
import MyChart from '../../components/MyChart.astro';

# 安装

<Card title="提示" icon="information">
  注意 Node.js 版本必须 >= 18。
</Card>

<MyChart data={[1, 2, 3]} />

## 数学表达式

JavaScript 表达式：{1 + 2 + 3} = 6
```

### Markdoc（.mdoc）

Markdoc 是 Stripe 出的 Markdown 超集，用 `{% %}` 标签语法（不需要 import），需要先安装：

```bash
pnpm astro add markdoc
pnpm add @astrojs/markdoc @astrojs/starlight-markdoc
```

然后在 `astro.config.mjs` 启用：

```js
import markdoc from '@astrojs/markdoc';
import starlightMarkdoc from '@astrojs/starlight-markdoc';

export default defineConfig({
  integrations: [
    markdoc({ extends: [starlightMarkdoc()] }),
    starlight({ title: '...' }),
  ],
});
```

Markdoc 用法：

```mdoc
---
title: 安装
---

# 安装

{% card title="提示" icon="information" %}
注意 Node.js 版本必须 >= 18。
{% /card %}

{% tabs %}
  {% tabitem label="macOS" %}
    brew install mytool
  {% /tabitem %}
{% /tabs %}
```

**MDX vs Markdoc 选择**：

| 维度 | MDX | Markdoc |
|---|---|---|
| 语法 | JSX 风格（`<Card>`） | tag 风格（`{% card %}`） |
| 需要 import | ✅ 每页 import | ❌ 自动可用 |
| 编辑器支持 | 主流 IDE 支持 | 较弱（VSCode 有官方插件） |
| 类型安全 | ✅ TypeScript 推断组件 props | ⚠️ 运行时校验 |
| 推荐场景 | 开发者文档 | 内容创作者团队 / 大量非技术人员写文档 |

## Frontmatter 字段全集

### 基础字段

```yaml
---
# 必填
title: 安装指南

# SEO
description: 用于 search engine meta description

# URL 控制
slug: custom-url-segment

# 内容控制
draft: false              # 标记草稿（生产构建跳过）
pagefind: true            # 是否被 Pagefind 索引（默认 true）
---
```

### 模板选择

```yaml
---
title: 首页
template: splash   # 'doc'（默认，含 sidebar / TOC）| 'splash'（满宽，无 sidebar）
---
```

`splash` 模板适合首页 / 落地页：满宽布局、无 sidebar、无 TOC。

### Hero 配置

`hero` 用于落地页大标题区域（通常配合 `template: splash`）：

```yaml
---
title: My Starlight Docs
template: splash
hero:
  title: '欢迎使用 MyTool'
  tagline: 一句话描述你的产品
  image:
    alt: Logo
    file: ../../assets/hero.png
    # 或者 light / dark 两套图片：
    # light: ../../assets/hero-light.png
    # dark: ../../assets/hero-dark.png
  actions:
    - text: 快速开始
      link: /getting-started/
      icon: right-arrow
      variant: primary
    - text: GitHub
      link: https://github.com/myproject
      icon: external
      variant: secondary
---
```

### 编辑链接

```yaml
---
# 关闭单页的编辑链接
editUrl: false

# 自定义单页的编辑链接
editUrl: https://github.com/myproject/docs/edit/main/src/content/docs/install.md
---
```

也可以在 `astro.config.mjs` 全局配置：

```js
starlight({
  editLink: {
    baseUrl: 'https://github.com/myproject/docs/edit/main/',
  },
}),
```

### 最后更新时间

```yaml
---
lastUpdated: 2026-05-18
# 或者 false 隐藏（即使全局开启了 lastUpdated）
---
```

全局配置：

```js
starlight({
  lastUpdated: true,   // 全局显示（从 Git 历史读取）
}),
```

### 上一页 / 下一页

```yaml
---
prev: true              # 显示自动生成的上一页（默认）
prev: false             # 隐藏

# 自定义
prev:
  link: /intro/
  label: 介绍
next:
  link: /reference/
  label: API 参考
---
```

### Sidebar 单页配置

```yaml
---
title: 安装指南
sidebar:
  label: 安装      # 覆盖 sidebar 显示文字（不影响页面 h1）
  order: 1         # 排序权重（数字越小越靠前）
  hidden: false    # 从 autogenerate 中排除
  badge:
    text: New
    variant: tip   # 'note' | 'tip' | 'caution' | 'danger' | 'success' | 'default'
  attrs:
    target: _blank
---
```

### Banner（顶部公告）

```yaml
---
title: 安装
banner:
  content: '⚠️ 这是 v2 beta 文档，<a href="/v1/">查看 v1 稳定版</a>'
---
```

Banner 支持 HTML（可以放链接 / emoji）。

### Table of Contents（右侧目录）

```yaml
---
title: 长文档
tableOfContents:
  minHeadingLevel: 2   # 默认 2
  maxHeadingLevel: 4   # 默认 3
---

# 关闭 TOC
tableOfContents: false
```

### Head 自定义标签

为单个页面注入额外 `<head>` 标签：

```yaml
---
title: 高级配置
head:
  - tag: meta
    attrs:
      property: og:image
      content: /og/advanced.png
  - tag: script
    attrs:
      src: /js/special-page.js
      defer: true
---
```

## Sidebar 高级配置

### 嵌套 group

```js
sidebar: [
  {
    label: '入门',
    items: [
      { label: '介绍', slug: 'intro' },
      {
        label: '安装',
        // 嵌套子 group
        items: [
          { label: 'macOS', slug: 'install/macos' },
          { label: 'Linux', slug: 'install/linux' },
          { label: 'Windows', slug: 'install/windows' },
        ],
      },
    ],
  },
],
```

### autogenerate 自动扫描

```js
sidebar: [
  {
    label: '指南',
    autogenerate: { directory: 'guides' },
  },
  {
    label: '参考',
    autogenerate: {
      directory: 'reference',
      collapsed: true,   // 默认折叠
    },
  },
],
```

autogenerate 会：

- 扫描 `src/content/docs/guides/` 下所有文件
- 按文件名字母排序
- 支持子目录（自动生成嵌套 group）
- 读取每个文件的 `sidebar.order` 调整顺序
- 读取 `sidebar.label` 覆盖显示文字
- 跳过 `sidebar.hidden: true` 的页面

### 子目录自动嵌套

```
src/content/docs/guides/
├── intro.md
├── install/
│   ├── macos.md
│   └── linux.md
└── advanced/
    ├── plugins.md
    └── theming.md
```

`autogenerate: { directory: 'guides' }` 会生成：

```
指南
├── intro
├── install
│   ├── macos
│   └── linux
└── advanced
    ├── plugins
    └── theming
```

### 子目录用 `index.md` 作为 group 链接

```
src/content/docs/guides/
├── intro.md
└── install/
    ├── index.md      # 这个文件用 frontmatter.sidebar 自定义
    ├── macos.md
    └── linux.md
```

`install/index.md` 的 frontmatter：

```yaml
---
title: 安装
sidebar:
  label: 安装
  order: 2
---
```

### Badge（徽章）

给 sidebar 项目加状态标记：

```js
sidebar: [
  {
    label: '指南',
    badge: { text: 'New', variant: 'tip' },
    items: [
      {
        label: 'API',
        slug: 'reference/api',
        badge: { text: 'Beta', variant: 'caution' },
      },
    ],
  },
],
```

### 外部链接

```js
sidebar: [
  {
    label: '资源',
    items: [
      { label: 'GitHub', link: 'https://github.com/myproject' },
      {
        label: '文档（外部）',
        link: 'https://external.example.com',
        attrs: { target: '_blank', rel: 'noopener' },
      },
    ],
  },
],
```

### 多语言 sidebar 翻译

`label` 可以是字符串（所有 locale 共享）或对象（按 locale 区分）：

```js
sidebar: [
  {
    label: '指南',
    translations: {
      en: 'Guides',
      ja: 'ガイド',
    },
    items: [
      {
        label: '安装',
        slug: 'guides/install',
        translations: {
          en: 'Installation',
          ja: 'インストール',
        },
      },
    ],
  },
],
```

## i18n 国际化

### 基础配置

`astro.config.mjs`：

```js
starlight({
  title: 'My Docs',
  defaultLocale: 'en',
  locales: {
    en: { label: 'English', lang: 'en' },
    'zh-cn': { label: '简体中文', lang: 'zh-CN' },
    ja: { label: '日本語', lang: 'ja' },
    ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
  },
}),
```

字段说明：

| 字段 | 必填 | 作用 |
|---|---|---|
| `label` | ✅ | 语言切换器中显示的文字 |
| `lang` | ⚠️ | BCP-47 语言代码（用作 `<html lang>`）；不传则用 key |
| `dir` | ❌ | `'ltr'` 或 `'rtl'`（阿拉伯语 / 希伯来语用） |

### 目录结构

```
src/content/docs/
├── en/
│   ├── index.md
│   └── guides/install.md
├── zh-cn/
│   ├── index.md
│   └── guides/install.md
└── ja/
    ├── index.md
    └── guides/install.md
```

URL 变成 `/en/guides/install/` / `/zh-cn/guides/install/` 等。

### Root locale（默认语言无前缀）

```js
locales: {
  root: { label: 'English', lang: 'en' },
  'zh-cn': { label: '简体中文', lang: 'zh-CN' },
},
```

root locale 的内容直接放在 `src/content/docs/`（不带子目录前缀），URL 变成：

- 英文：`/guides/install/`（无 `/en/` 前缀）
- 中文：`/zh-cn/guides/install/`

### Fallback 内容

如果某个 locale 缺失某页文件，Starlight 自动用 `defaultLocale` 的内容渲染，并在页面顶部显示"This page hasn't been translated"提示。

### 翻译 UI 字符串

Starlight 内置了「Search」「Skip to content」「On this page」等 UI 字符串的翻译（覆盖 50+ 语言）。

如果想自定义某个 UI 字符串，在 `src/content/i18n/{locale}.json` 写：

```json
// src/content/i18n/zh-cn.json
{
  "search.label": "搜索文档",
  "tableOfContents.onThisPage": "在此页面",
  "page.editLink": "在 GitHub 上编辑此页面"
}
```

也支持 YAML：

```yaml
# src/content/i18n/zh-cn.yml
search.label: 搜索文档
tableOfContents.onThisPage: 在此页面
```

可用的翻译 key 完整列表见 [官方文档 i18n 章节](https://starlight.astro.build/guides/i18n/)。

### 在组件中访问翻译

自定义 `.astro` 组件可以用 `Astro.locals.t`：

```astro
---
const t = Astro.locals.t;
---

<p>{t('search.label')}</p>

<!-- 带参数插值 -->
<p>{t('greeting', { name: 'Alice' })}</p>
```

## CSS Customization

### 全局 CSS 文件

在 `src/styles/custom.css` 写自定义 CSS：

```css
/* 自定义品牌色 */
:root {
  --sl-color-accent-low: #fff3e0;
  --sl-color-accent: #ff9800;
  --sl-color-accent-high: #5a3000;

  --sl-color-bg-nav: #fafafa;
  --sl-color-bg-sidebar: #ffffff;
}

:root[data-theme='dark'] {
  --sl-color-accent-low: #3a2400;
  --sl-color-accent: #ff9800;
  --sl-color-accent-high: #fff3e0;

  --sl-color-bg-nav: #1a1a1a;
  --sl-color-bg-sidebar: #0f0f0f;
}

/* 自定义字体 */
:root {
  --sl-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --sl-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

/* 自定义布局宽度 */
:root {
  --sl-content-width: 50rem;
  --sl-sidebar-width: 18rem;
}
```

在 `astro.config.mjs` 注入：

```js
starlight({
  title: '...',
  customCss: [
    './src/styles/custom.css',
    // 也可以注入 npm 包的 CSS
    '@fontsource/inter/400.css',
    '@fontsource/inter/600.css',
  ],
}),
```

### Cascade Layers（CSS 优先级）

Starlight 内部用 CSS Cascade Layers（`@layer`）—— 推荐自定义 CSS 也用 `@layer` 控制优先级：

```css
@layer starlight, project;

@layer project {
  :root {
    --sl-color-accent: #ff9800;
  }

  /* 覆盖某个组件样式 */
  .sl-link-card {
    border-radius: 12px;
  }
}
```

### Tailwind CSS v4 集成

Starlight 提供官方 Tailwind 集成 `@astrojs/starlight-tailwind`。新项目用模板：

```bash
pnpm create astro@latest -- --template starlight/tailwind
```

已有项目添加：

```bash
pnpm astro add tailwind
pnpm add @astrojs/starlight-tailwind
```

在 `src/styles/global.css`（Tailwind v4 风格）：

```css
@layer base, starlight, theme;

@import '@astrojs/starlight-tailwind';
@import 'tailwindcss';

/* 自定义 Tailwind theme */
@theme {
  --color-accent-50: #fff3e0;
  --color-accent-200: #ffb74d;
  --color-accent-600: #ff9800;
  --color-accent-900: #5a3000;

  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

在 `astro.config.mjs` 注入：

```js
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: '...',
      customCss: ['./src/styles/global.css'],
    }),
  ],
});
```

之后在 `.mdx` / `.astro` 文件里直接用 Tailwind 类：

```mdx
<div class="rounded-lg bg-accent-50 p-4 dark:bg-accent-900">
  这是一个 Tailwind 风格的卡片
</div>
```

## 内置组件

> **导入路径**：所有 Starlight 内置组件从 `@astrojs/starlight/components` 引入。MDX 文件需要顶部 import；Markdoc 文件直接用标签。

### Aside（提示框）

四种变体：`note` / `tip` / `caution` / `danger`。

**写法 A：Markdown 三冒号语法**（推荐，在 `.md` 也能用）：

```md
:::note
这是一条普通提示。
:::

:::tip[自定义标题]
这是一条小贴士。
:::

:::caution
注意事项。
:::

:::danger
危险操作！
:::
```

**写法 B：MDX 组件**（在 `.mdx` 文件）：

```mdx
import { Aside } from '@astrojs/starlight/components';

<Aside type="tip" title="提示">
  这是一条小贴士。
</Aside>

<Aside type="caution" icon="approve-check">
  自定义图标的注意事项。
</Aside>
```

### Card（卡片）

```mdx
import { Card } from '@astrojs/starlight/components';

<Card title="快速开始" icon="rocket">
  几分钟内启动你的项目。
</Card>
```

支持的 props：

- `title`（必填）—— 卡片标题
- `icon` —— Starlight 内置图标名称

### CardGrid（卡片网格）

把多个 Card 排列成响应式网格：

```mdx
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="安装" icon="download">下载并安装</Card>
  <Card title="配置" icon="setting">基础配置</Card>
  <Card title="使用" icon="rocket">开始使用</Card>
  <Card title="部署" icon="cloud-upload">部署到云端</Card>
</CardGrid>
```

加 `stagger` prop 让卡片错落分布（视觉更动感）：

```mdx
<CardGrid stagger>
  <Card title="A">...</Card>
  <Card title="B">...</Card>
</CardGrid>
```

### LinkCard（链接卡片）

```mdx
import { LinkCard } from '@astrojs/starlight/components';

<LinkCard
  title="安装指南"
  href="/guides/install/"
  description="学习如何在 macOS / Linux / Windows 上安装"
/>
```

LinkCard 整个卡片都是可点击链接——比 Card + Markdown 链接更适合"列表索引页"。

### LinkButton（链接按钮）

适合 CTA / 落地页大按钮：

```mdx
import { LinkButton } from '@astrojs/starlight/components';

<LinkButton href="/getting-started/" icon="right-arrow">
  开始使用
</LinkButton>

<LinkButton href="https://github.com/x" variant="secondary" icon="external" iconPlacement="end">
  GitHub
</LinkButton>

<LinkButton href="/docs/" variant="minimal">
  浏览文档
</LinkButton>
```

`variant` 选项：

- `primary`（默认）—— 主按钮（强 accent 色背景）
- `secondary` —— 次按钮（边框 + accent 文字）
- `minimal` —— 极简（仅文字，无边框）

### Tabs（标签页）

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="npm">
    `npm install starlight-tool`
  </TabItem>
  <TabItem label="pnpm">
    `pnpm add starlight-tool`
  </TabItem>
  <TabItem label="yarn">
    `yarn add starlight-tool`
  </TabItem>
</Tabs>
```

#### Tabs 跨页面同步

多个 Tabs 设置相同的 `syncKey` 后，用户选择会同步——读者选过一次 macOS，全站所有 OS Tabs 都默认 macOS：

```mdx
<Tabs syncKey="os">
  <TabItem label="macOS">brew install ...</TabItem>
  <TabItem label="Linux">apt install ...</TabItem>
  <TabItem label="Windows">choco install ...</TabItem>
</Tabs>
```

#### TabItem 加图标

```mdx
<Tabs>
  <TabItem label="macOS" icon="apple">...</TabItem>
  <TabItem label="Linux" icon="linux">...</TabItem>
  <TabItem label="Windows" icon="seti:windows">...</TabItem>
</Tabs>
```

### Steps（步骤列表）

包裹有序列表，渲染为带连接线的步骤指示器。基本结构（伪代码描述）：

- 顶部 `import { Steps } from '@astrojs/starlight/components';`
- 用 `Steps` 标签包裹一个有序列表（`1. `... `2. `... `3. `...）
- 每个列表项可以包含任意 Markdown：标题 / 段落 / 代码块 / 图片 / 链接 / 子列表
- 比如三个步骤：「下载安装包」（含 releases 链接）/「解压并 cd」（含 `tar -xzf` 命令的 bash 代码块）/「运行安装」（`./install.sh`）/「验证版本」（运行 `mytool --version`）

代码块（如 `tar -xzf mytool-v1.0.tar.gz` / `./install.sh`）直接在列表项缩进里写常规 ` ```bash ` 围栏即可——Markdown 解析会自动归属于步骤项。

每个步骤里可以放任意 Markdown 内容（标题 / 代码 / 列表 / 图片都行）。

### Badge（徽章）

行内小标签：

```mdx
import { Badge } from '@astrojs/starlight/components';

<Badge text="New" variant="tip" />
<Badge text="Deprecated" variant="caution" />
<Badge text="Removed" variant="danger" />
<Badge text="Stable" variant="success" />
```

支持的 variant：`note`（蓝）/ `tip`（紫）/ `success`（绿）/ `caution`（橙）/ `danger`（红）/ `default`（accent 色）。

支持的 size：`small`（默认）/ `medium` / `large`。

### Icon（图标）

```mdx
import { Icon } from '@astrojs/starlight/components';

<Icon name="rocket" />
<Icon name="github" size="2rem" color="var(--sl-color-accent)" />
<Icon name="seti:typescript" />
```

Starlight 内置 200+ 图标，分类：

- **UI 图标**：`right-arrow` / `down-caret` / `close` / `setting` / `search`
- **状态图标**：`approve-check` / `error` / `warning` / `information`
- **品牌图标**：`github` / `discord` / `gitlab` / `astro` / `x.com` / `youtube`
- **技术品牌**：`node` / `react` / `vue` / `svelte` / `typescript` / `python` / `rust`
- **文件类型**：`seti:typescript` / `seti:react` / `seti:vue` / `seti:json` / `seti:markdown`

完整列表见 [Starlight Icons Reference](https://starlight.astro.build/reference/icons/) 页面（可点击 copy 名称）。

### FileTree（文件树）

显示项目目录结构：

```mdx
import { FileTree } from '@astrojs/starlight/components';

<FileTree>
- src/
  - content/
    - docs/
      - **index.md**          指向首页
      - guides/
        - install.md          安装指南
        - getting-started.md  快速开始
    - i18n/
      - zh-cn.json
  - assets/
    - logo.svg
- astro.config.mjs            主配置
- package.json
</FileTree>
```

特性：

- 末尾加 `/` 表示目录
- 用 `**...**` 加粗高亮重要文件
- 文件名后空格 + 文字 = 注释
- 用 `...` 或 `…` 表示"还有其他文件"

### Code（代码块组件）

适合从外部源（文件 / 字符串）渲染代码：

```mdx
import { Code } from '@astrojs/starlight/components';

export const sample = `console.log('Hello, Starlight!');`;

<Code code={sample} lang="js" title="hello.js" />
```

Props 全集：

| Prop | 类型 | 作用 |
|---|---|---|
| `code` | string | 代码字符串 |
| `lang` | string | 语言（如 `js` / `ts` / `bash`） |
| `title` | string | 顶部文件名 |
| `frame` | `'code' \| 'terminal' \| 'none'` | 外框样式 |
| `mark` | string \| string[] | 高亮指定行/词 |
| `ins` | string \| string[] | 标记为"新增"（绿色 +） |
| `del` | string \| string[] | 标记为"删除"（红色 -） |
| `meta` | string | Expressive Code 完整元信息 |
| `wrap` | boolean | 长行自动换行 |

### 用 `?raw` 导入外部文件作为代码块

```mdx
import { Code } from '@astrojs/starlight/components';
import sourceCode from '../../../package.json?raw';

<Code code={sourceCode} lang="json" title="package.json" />
```

## Expressive Code 增强

Starlight 默认用 Expressive Code 渲染代码块。`.md` / `.mdx` 里写普通代码块，自动加各种增强：

### 高亮行

在代码块语言后加 `{1,3-5}`：

```js title="example.js" {1,3-5}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
const e = 5;
```

### Diff 标记

用 `del` / `ins`：

```js del={2} ins={3}
function greet(name) {
  console.log('Hi, ' + name);
  console.log(`Hi, ${name}`);
}
```

或在代码行尾加注释：

```diff
- old line
+ new line
```

### 终端样式

```bash frame="terminal" title="install"
pnpm install
pnpm dev
```

frame 选项：

- `code`（默认）—— 顶部带文件名标签的窗口
- `terminal` —— macOS 终端样式（红黄绿三圆点）
- `none` —— 无外框

### 词高亮

用 `"word"` 高亮关键词：

```js title="hello.js" "Starlight" "config"
const name = 'Starlight';
const config = { /* ... */ };
```

### Twoslash（TypeScript 类型提示）

启用后，TypeScript 代码 hover 会显示类型推断：

```bash
pnpm add expressive-code-twoslash
```

`astro.config.mjs`：

```js
import twoslash from 'expressive-code-twoslash';

starlight({
  expressiveCode: {
    plugins: [twoslash()],
  },
}),
```

之后在代码块加 `twoslash`：

```ts twoslash
const x = 'hello';
//    ^?
```

`//    ^?` 行会显示上一行 `x` 的推断类型 `const x: "hello"`。

## Pagefind 内置搜索

### 开箱即用

Starlight 默认启用 Pagefind——**构建后自动生成 `dist/pagefind/` 目录**，包含搜索 UI + wasm 索引文件。dev 模式有简化搜索，**生产模式才是完整搜索**。

```bash
pnpm build && pnpm preview
# 访问 http://localhost:4321 试搜索
```

### 排除内容

**整页排除**（不被搜到）：

```yaml
---
title: 草稿
pagefind: false
---
```

**部分内容排除**（页面其他部分仍可搜）：

```html
<div data-pagefind-ignore>
  这部分内容不会被索引。
</div>
```

### 自定义 Pagefind 配置

`astro.config.mjs`：

```js
starlight({
  pagefind: {
    ranking: {
      pageLength: 0.5,    // 长页面排名权重（默认 0.1）
      termFrequency: 0.7, // 词频权重（默认 0.5）
      termSaturation: 1,
      termSimilarity: 0,
    },
    indexWeight: 1.0,
    mergeIndex: [
      // 合并多个 Pagefind 索引（multi-site 用）
    ],
  },
}),
```

### 完全禁用 Pagefind

```js
starlight({
  pagefind: false,
}),
```

### 替换成 Algolia DocSearch

安装：

```bash
pnpm add @astrojs/starlight-docsearch
```

`astro.config.mjs`：

```js
import starlight from '@astrojs/starlight';
import docSearch from '@astrojs/starlight-docsearch';

export default defineConfig({
  integrations: [
    starlight({
      title: '...',
      plugins: [
        docSearch({
          appId: 'YOUR_APP_ID',
          apiKey: 'YOUR_PUBLIC_API_KEY',
          indexName: 'your-index',
        }),
      ],
    }),
  ],
});
```

> Algolia DocSearch 对开源项目免费，但需要 [申请审批](https://docsearch.algolia.com/apply/)（通常 2-7 天）。

## 覆盖默认组件

如果想完全替换某个 Starlight 内置组件——比如自定义 Header / Footer / Search——做以下步骤：

### 1. 创建自定义组件

`src/components/MyFooter.astro`：

```astro
---
const year = new Date().getFullYear();
---

<footer class="custom-footer">
  <p>© {year} My Project. Built with Starlight.</p>
  <p>
    <a href="/privacy/">隐私政策</a> · <a href="/terms/">服务条款</a>
  </p>
</footer>

<style>
  .custom-footer {
    padding: 2rem;
    text-align: center;
    border-top: 1px solid var(--sl-color-gray-5);
  }
</style>
```

### 2. 在 `astro.config.mjs` 注册

```js
starlight({
  title: '...',
  components: {
    Footer: './src/components/MyFooter.astro',
  },
}),
```

### 3. 想保留默认行为时包装

`src/components/MyHeader.astro`：

```astro
---
import Default from '@astrojs/starlight/components/Header.astro';
---

<div class="custom-banner">公告：v2 即将发布！</div>

<Default><slot /></Default>
```

`<Default><slot /></Default>` 必须保留——否则原组件的 children 会丢失。

### 可覆盖组件清单

完整清单：

| 类别 | 组件名 |
|---|---|
| **Head** | `Head` / `ThemeProvider` |
| **Header** | `Header` / `SiteTitle` / `Search` / `SocialIcons` / `ThemeSelect` / `LanguageSelect` |
| **Layout** | `PageFrame` / `MobileMenuToggle` / `Sidebar` / `MobileMenuFooter` |
| **Content** | `TwoColumnContent` / `PageSidebar` / `TableOfContents` / `MobileTableOfContents` |
| **Sections** | `Banner` / `ContentPanel` / `PageTitle` / `Hero` / `MarkdownContent` / `DraftContentNotice` / `FallbackContentNotice` |
| **Footer** | `Footer` / `LastUpdated` / `EditLink` / `Pagination` |
| **A11y** | `SkipLink` |

> 完整列表见 [reference.md](./reference.md#可覆盖组件清单) 或 [官方 Overrides Reference](https://starlight.astro.build/reference/overrides/)。

## Astro Islands 嵌入

Starlight 最大的差异化是**可以在 Markdown 里嵌入任意框架的组件**。安装框架集成：

```bash
# React
pnpm astro add react

# Vue
pnpm astro add vue

# Svelte
pnpm astro add svelte

# Solid
pnpm astro add solid

# Preact
pnpm astro add preact
```

### React 组件示例

`src/components/Counter.tsx`：

```tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数：{count}
    </button>
  );
}
```

在 `.mdx` 里使用：

```mdx
---
title: 交互示例
---

import Counter from '../../components/Counter.tsx';

<Counter client:load />
```

### Vue 组件示例

`src/components/Chart.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue';
const data = ref([10, 20, 30, 40]);
</script>

<template>
  <ul>
    <li v-for="item in data" :key="item">{{ item }}</li>
  </ul>
</template>
```

> 注意：<span v-pre>`{{ item }}`</span> 是 Vue 模板的占位符——在 `.vue` 文件中由 Vue 编译器在 SFC 内部处理，跟 Markdown 解析无关。

```mdx
import Chart from '../../components/Chart.vue';

<Chart client:visible />
```

### `client:*` 指令选择

| 指令 | 何时 hydrate |
|---|---|
| `client:load` | 立即（页面加载完成时） |
| `client:idle` | 主线程空闲时（`requestIdleCallback`） |
| `client:visible` | 进入视口时（`IntersectionObserver`） |
| `client:media="(max-width: 768px)"` | 媒体查询匹配时 |
| `client:only="react"` | 仅客户端渲染（不 SSR） |

**默认**（不加 `client:*`）—— 组件只在 SSR / 构建时渲染，输出纯 HTML（**零客户端 JS**）。

### 同一页混用多种框架

```mdx
import ReactCounter from '../../components/Counter.tsx';
import VueChart from '../../components/Chart.vue';
import SvelteForm from '../../components/Form.svelte';

# 各种 demo

React 计数器：<ReactCounter client:load />

Vue 图表：<VueChart client:visible />

Svelte 表单：<SvelteForm client:idle />
```

这是 Starlight **独家**能力—— VitePress / Nextra / Docusaurus 都做不到。

## Plugin 生态

Starlight Plugin 通过 `plugins: [...]` 字段注入，可以修改配置 / 注入翻译 / 添加路由中间件。

### starlight-blog（博客）

为文档站添加博客系统（含 RSS / 作者 / 标签）：

```bash
pnpm add starlight-blog
```

```js
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

export default defineConfig({
  integrations: [
    starlight({
      title: '...',
      plugins: [
        starlightBlog({
          title: '博客',
          authors: {
            alice: { name: 'Alice', title: 'CTO', picture: '/authors/alice.png' },
          },
        }),
      ],
    }),
  ],
});
```

博客文章放在 `src/content/docs/blog/`，frontmatter 加 `authors: alice` 等。

### starlight-openapi（OpenAPI 自动生成）

从 OpenAPI / Swagger JSON 自动生成 API 文档页：

```bash
pnpm add starlight-openapi
```

```js
import starlightOpenAPI from 'starlight-openapi';

starlight({
  title: '...',
  plugins: [
    starlightOpenAPI([
      {
        base: 'api',
        schema: './schemas/openapi.json',   // 本地文件
        // 或 URL：schema: 'https://example.com/openapi.json',
      },
    ]),
  ],
  sidebar: [
    {
      label: 'API',
      items: openAPISidebarGroups,   // 由 plugin 提供
    },
  ],
}),
```

### starlight-image-zoom（图片缩放）

给所有 Markdown 图片自动加 zoom 行为（点击放大）：

```bash
pnpm add starlight-image-zoom
```

```js
import starlightImageZoom from 'starlight-image-zoom';

starlight({
  plugins: [starlightImageZoom()],
}),
```

### starlight-versions（多版本文档）

Docusaurus 多版本的等价物——支持 `v1` / `v2` / `v3` 并行：

```bash
pnpm add starlight-versions
```

```js
import starlightVersions from 'starlight-versions';

starlight({
  plugins: [
    starlightVersions({
      versions: [
        { slug: '2.x' },
        { slug: '1.x', label: 'v1（已停止维护）' },
      ],
    }),
  ],
}),
```

目录结构：

```
src/content/docs/
├── (current 默认版本)
│   └── ...
├── 2.x/
│   └── ...
└── 1.x/
    └── ...
```

### starlight-sidebar-topics（多 sidebar 主题）

不同 URL 段下展示不同 sidebar（适合"文档 + API 参考 + 教程"分离）：

```bash
pnpm add starlight-sidebar-topics
```

```js
import starlightSidebarTopics from 'starlight-sidebar-topics';

starlight({
  plugins: [
    starlightSidebarTopics([
      {
        label: '文档',
        link: '/docs/',
        icon: 'open-book',
        items: [/* docs sidebar */],
      },
      {
        label: 'API',
        link: '/api/',
        icon: 'rocket',
        items: [/* api sidebar */],
      },
    ]),
  ],
}),
```

### starlight-links-validator（死链检测）

构建时校验所有内部链接：

```bash
pnpm add starlight-links-validator
```

```js
import starlightLinksValidator from 'starlight-links-validator';

starlight({
  plugins: [starlightLinksValidator()],
}),
```

构建时如果发现死链，会终止构建并打印链接位置——非常适合 CI。

### starlight-typedoc（TypeDoc 自动生成）

从 TypeScript 源码自动生成 API 文档（用 TypeDoc 解析 JSDoc）：

```bash
pnpm add starlight-typedoc typedoc typedoc-plugin-markdown
```

```js
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

starlight({
  plugins: [
    starlightTypeDoc({
      entryPoints: ['../my-lib/src/index.ts'],
      tsconfig: '../my-lib/tsconfig.json',
    }),
  ],
  sidebar: [
    typeDocSidebarGroup,
  ],
}),
```

### starlight-llms-txt（LLMs txt 支持）

按 [llmstxt.org](https://llmstxt.org/) 标准生成 `/llms.txt` 端点，便于 LLM 抓取：

```bash
pnpm add starlight-llms-txt
```

```js
import starlightLlmsTxt from 'starlight-llms-txt';

starlight({
  plugins: [starlightLlmsTxt()],
}),
```

## Route Middleware

如果你想在渲染前修改任何 route data（如改 title / 注入额外数据），用 Route Middleware：

### 1. 创建 middleware 文件

`src/routeData.ts`：

```ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
  const { entry, lang } = context.locals.starlightRoute;

  // 给所有页面 title 加感叹号
  entry.data.title = entry.data.title + '!';

  // 为日语版加特殊后缀
  if (lang === 'ja') {
    entry.data.description = entry.data.description + '（日本語版）';
  }
});
```

### 2. 在 `astro.config.mjs` 注册

```js
starlight({
  title: '...',
  routeMiddleware: './src/routeData.ts',
}),
```

### 多个 middleware 串联

```js
starlight({
  routeMiddleware: [
    './src/middleware1.ts',
    './src/middleware2.ts',
  ],
}),
```

## Markdown 增强

### Mermaid 图表

Mermaid 需要装 remark-mermaid 类的插件：

```bash
pnpm add rehype-mermaid
```

`astro.config.mjs`：

```js
export default defineConfig({
  markdown: {
    rehypePlugins: [
      ['rehype-mermaid', { strategy: 'img-svg' }],
    ],
  },
  integrations: [starlight({ /* ... */ })],
});
```

之后在 Markdown 里用一个语言为 `mermaid` 的围栏代码块，内容直接写 Mermaid 图表语法即可。例如：用 `graph LR` 开头声明左→右流程图，写 `A[开始] --> B{条件?}` 表示节点 A 流向决策节点 B，再用 `B -->|是| C[执行]` 和 `B -->|否| D[结束]` 表示 yes/no 分支。Starlight 的 rehype-mermaid 会在构建时把整个代码块转成 inline SVG 或 `<img>`。

### LaTeX / KaTeX

安装：

```bash
pnpm add remark-math rehype-katex katex
```

```js
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      title: '...',
      customCss: ['katex/dist/katex.min.css'],
    }),
  ],
});
```

写法：

- 行内公式：`$E = mc^2$`
- 块公式：`$$\frac{a}{b} = c$$`

### 图片优化

`src/assets/` 下的图片可以用 Markdown 相对路径引用，Astro 会自动优化（生成 webp / 多尺寸 / lazy loading）：

```md
![Logo](../../assets/logo.png)
```

或者用 Astro 的 `<Image>` 组件（更精细控制）：

```mdx
import { Image } from 'astro:assets';
import logo from '../../assets/logo.png';

<Image src={logo} alt="Logo" width={200} height={50} />
```

### 自定义 HTML

Markdown 里可以直接写 HTML（块级标签需要前后空行）：

```md
<details>
<summary>点击展开</summary>

这是隐藏的内容，支持 **Markdown** 语法。

</details>
```

## 高级技巧

### 多个 Starlight 子站合并

如果想在同一个 Astro 项目里有多个 Starlight 子站（如 `/docs/v1/` + `/docs/v2/`），可以用 `starlight-versions` 或 `starlight-sidebar-topics` 实现。也可以用 Astro 的 [Multi-zone](https://docs.astro.build/en/concepts/why-astro/) 部署。

### 在 Starlight 项目里加非文档页面

Starlight 项目仍然是 Astro 项目——你完全可以在 `src/pages/` 加任意 `.astro` / `.tsx` 路由：

```astro
---
// src/pages/dashboard.astro
import { StarlightPage } from '@astrojs/starlight/components';
---

<StarlightPage
  frontmatter={{
    title: 'Dashboard',
    template: 'doc',
  }}
>
  <h2>这是一个不在 src/content/docs/ 里的页面</h2>
  <p>但仍然用 Starlight 的布局和样式渲染</p>
</StarlightPage>
```

`<StarlightPage>` 包装让自定义页面继承 Starlight 的整体布局（sidebar / header / theme）。

### 自定义 404 页

简单：在 `src/content/docs/` 加 `404.md`：

```md
---
title: 404 - 页面未找到
---

很遗憾，你访问的页面不存在。

[返回首页](/)
```

或者完全自定义（不用 Starlight 布局）：

```js
starlight({
  disable404Route: true,
}),
```

然后在 `src/pages/404.astro` 写自定义内容。

### 草稿模式

`pnpm dev` 时草稿可以正常访问，但 `pnpm build` 会跳过。frontmatter：

```yaml
---
title: 还在编辑
draft: true
---
```

页面会显示一个"DRAFT"提示横幅。

### Site Map

Astro 内置 sitemap 集成：

```bash
pnpm astro add sitemap
```

`astro.config.mjs`：

```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mydocs.example.com',
  integrations: [
    starlight({ /* ... */ }),
    sitemap(),
  ],
});
```

构建后会生成 `dist/sitemap-index.xml` 和 `dist/sitemap-0.xml`。

### RSS Feed

通过 Astro 的 `@astrojs/rss` 实现：

```bash
pnpm add @astrojs/rss
```

`src/pages/rss.xml.ts`：

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const docs = await getCollection('docs');
  return rss({
    title: '我的文档站',
    description: '...',
    site: context.site,
    items: docs.map((doc) => ({
      title: doc.data.title,
      description: doc.data.description,
      pubDate: doc.data.lastUpdated || new Date(),
      link: `/${doc.id}/`,
    })),
  });
}
```

访问 `/rss.xml` 即可获取 RSS。

## 部署进阶

### 配置 `site` 字段

部署前务必在 `astro.config.mjs` 设置 `site`——影响 sitemap / canonical / OG image：

```js
export default defineConfig({
  site: 'https://mydocs.example.com',
  integrations: [starlight({ /* ... */ })],
});
```

### 配置 `base` 子路径

如果部署到 `https://example.com/docs/`（不是根路径），用 `base`：

```js
export default defineConfig({
  site: 'https://example.com',
  base: '/docs/',
  integrations: [starlight({ /* ... */ })],
});
```

> ⚠️ Sidebar 的 `link` 字段需要包含 base：`{ link: '/docs/guides/install/' }`（不带 base 会 404）。

### Trailing slash

Starlight 默认 `trailingSlash: 'ignore'`——可以根据托管平台调整：

```js
export default defineConfig({
  trailingSlash: 'always',  // 强制末尾 /（推荐 Vercel / Netlify）
  // 或 'never'（强制无 /，推荐 Cloudflare Pages）
  // 或 'ignore'（默认，两种都接受）
});
```

### CI / CD 构建

GitHub Actions 示例（部署到 Netlify）：

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
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
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: dist
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 常见问题

### Q: dev server 启动慢？

A: Astro 5 的首次启动包含 Vite 依赖预构建（`.vite/deps/`），第二次启动会快很多。如果一直慢：

- 删除 `node_modules/.vite/` 缓存
- 检查是否有大量 Markdown 文件（`src/content/docs/` 几千页时启动会慢）
- 检查 `customCss` 是否有大文件

### Q: 搜索结果不准确？

A: Pagefind 中文分词较弱。改善方法：

- 在 frontmatter 加更详细的 `description`
- 用 `data-pagefind-weight` 自定义权重
- 替换成 Algolia DocSearch（支持中文搜索）

### Q: 暗色模式背景颜色不对？

A: Starlight 暗色背景由 `--sl-color-bg` 控制。在 `customCss` 里：

```css
:root[data-theme='dark'] {
  --sl-color-bg: #0a0a0a;       /* 主背景 */
  --sl-color-bg-nav: #0f0f0f;   /* 导航栏 */
  --sl-color-bg-sidebar: #050505; /* 侧边栏 */
}
```

### Q: 如何禁用 sidebar？

A: 单页用 `template: splash`（无 sidebar 也无 TOC）：

```yaml
---
title: 落地页
template: splash
---
```

### Q: 跨语言文章用同一文件名时翻译怎么对应？

A: 用相同的 slug（相对路径）。比如：

```
src/content/docs/en/guides/install.md
src/content/docs/zh-cn/guides/install.md
```

Starlight 自动识别——切换语言时会跳到对应版本。

### Q: 如何在 sidebar 加分隔线 / 标题？

A: 用空 group：

```js
sidebar: [
  { label: '入门', items: [/* ... */] },
  { label: '', items: [] },  // 视觉分隔（label 留空）
  { label: '高级', items: [/* ... */] },
],
```

或者用 CSS 自定义 group 标题样式。

## 下一步

指南到此结束——你已经掌握：

- Markdown / MDX / Markdoc 内容编写
- Frontmatter 字段全集
- Sidebar 高级配置（autogenerate / 嵌套 / Badge）
- i18n 多语言（locales / root locale / fallback / UI 翻译）
- CSS / Tailwind 定制
- 内置组件（Card / Tabs / Aside / LinkCard / Steps / Badge / Icon / FileTree / Code）
- Pagefind 搜索 + Algolia DocSearch 替换
- 覆盖默认组件（components 字段）
- Astro Islands 嵌入 React / Vue / Svelte / Solid
- Plugin 生态（starlight-blog / starlight-openapi / starlight-image-zoom / starlight-versions 等）
- Route Middleware
- Markdown 增强（Mermaid / LaTeX / 图片优化）

继续阅读：

- [参考](./reference.md) —— `astro.config.mjs` 字段速查 / Frontmatter 字段表 / 组件 props 表 / CSS 变量表 / 可覆盖组件清单
