---
layout: doc
---

# Nextra

由 **Vercel** 工程师 **Shu Ding**（Next.js / SWR 核心维护者）发起、目前由 **The Guild** 团队和社区共同维护的「**基于 Next.js 的 MDX 文档站框架**」，定位是「**React 生态里和 Vue 生态 VitePress 对标的现代文档站方案**」。**Nextra 4.x 已于 2025 年正式发布**——这一代是**架构级重写**：从原来的 Next.js Pages Router + getStaticProps 完全切换到 **Next.js 15 + App Router + React 19 + React Server Components**，搜索引擎从 FlexSearch（客户端 JS）切换到 **Pagefind**（构建期生成静态索引），并新增 `content/` 目录约定让源文件组织更清爽。整体哲学是「**把 Next.js 当文档生成器用**」——你写 MDX，Nextra + 三大内置 theme（**`nextra-theme-docs`** / **`nextra-theme-blog`** / **自定义 theme**）+ Next.js 构建出 SSG 静态站，部署到 Vercel / Netlify / Cloudflare Pages / 自建 Nginx 等。**典型用户**：**SWR**（自家旗舰）/ **Turborepo**（Vercel 自家）/ **Million.js** / **ESLint Next** / **GraphQL Mesh** / **GraphQL-ESLint**（The Guild 自家全套）/ **Refine** 等大量 React 生态库。Nextra **不是通用 SSG**——它的整套优化全部围绕「**React 项目 + Vercel 部署 + Next.js 全栈能力**」展开：Next.js Image 自动优化 / Next.js Link 客户端导航 / RSC 流式渲染 / Edge Runtime / ISR / API Routes / Middleware 全部开箱可用，这是 VitePress / Starlight 望尘莫及的；代价是**整套技术栈强绑 Next.js + React**，Vue / Svelte 用户无法直接参与，且首屏 JS 比 Astro 重一个数量级。

## 评价

**优点**

- **建立在 Next.js 之上**：自动继承 Next.js 全套能力——Image / Link / Middleware / ISR / API Routes / Edge Runtime / RSC 流式渲染，文档站可以无缝扩展为带后端的全栈应用
- **MDX 3 一等公民**：所有内容默认 `.mdx`，直接在 Markdown 里 `import` React 组件 / 写 JSX 表达式 / 嵌入交互 demo，是 React 生态对标 VitePress 的核心差异化
- **三大内置 theme**：`nextra-theme-docs`（文档）/ `nextra-theme-blog`（博客）/ 自定义 theme 全套交付，Docs Theme 视觉风格现代精致（深浅模式 / 大量动效），开箱即用
- **`_meta.ts` 配置直观**：sidebar / navbar / 顺序 / 标题 / 主题选项全部通过 `_meta.ts` 声明，比 Docusaurus 的 `sidebars.ts` 更轻量；支持 ESLint sort-keys / 全局 `_meta.global.js`
- **内置搜索 Pagefind**：4.x 切换到 [Pagefind](https://pagefind.app) 静态索引，构建期生成 `_pagefind/`，零运行时 JS、毫秒级响应；可一键禁用换 Algolia
- **`content/` 目录约定**：4.x 新增——所有 MDX 文件放在 `content/` 下，App Router 用 catch-all `[[...mdxPath]]/page.jsx` 统一路由，避免每个文件都建 `page.mdx` 目录
- **大量精致内置组件**：**Callout**（5 种风格 + GitHub Alert）/ **Cards**（图标 / 图像 / 链接卡片）/ **Steps**（步骤指示）/ **FileTree**（文件树）/ **Tabs**（标签页 / localStorage 持久化）/ **Bleed**（突破容器）/ **Table**（样式化表格）——这是 VitePress 没有的优势
- **GitHub Alert 原生支持**：`> [!NOTE]` / `> [!TIP]` / `> [!IMPORTANT]` / `> [!WARNING]` / `> [!CAUTION]` 5 种 GitHub Markdown 警告语法自动渲染为 Callout
- **Shiki 构建期高亮**：与 VitePress 同款，支持 line / word 高亮 / filename / copy button / showLineNumbers / dual theme（深浅模式两套主题）
- **i18n 国际化**：内置 Next.js i18n 配置——`locales: ['en', 'zh', 'de']` 一行启用，theme 内置语言切换 dropdown，支持 RTL 阿拉伯语
- **LaTeX 数学公式**：`latex: true` 一键启用 KaTeX 或 MathJax 渲染数学公式
- **Mermaid 图表**：```mermaid` 代码块自动转换为图表，无需配置
- **Tailwind CSS 无缝集成**：基于 Next.js Tailwind 配置 + 一行 `@import 'nextra-theme-docs/style.css'`
- **Vercel 部署最优**：Vercel 一键 import，ISR / Edge / 图像 CDN 全部自动配置
- **TypeScript 一等公民**：`DocsThemeConfig` / `NextraConfig` 完整类型，`.tsx` 配置文件 + IDE 类型推断
- **Turbopack 支持**：`next dev --turbopack` 启用，开发期构建大幅提速（限制：仅 JSON-serializable 配置）

**缺点**

- **强绑 Next.js + React**：所有内容必须用 MDX + React 组件，Vue / Svelte 用户无法复用既有组件；且必须熟悉 Next.js App Router 心智模型才能用好
- **首屏 JS 偏重**：Next.js + React + Theme 整体 bundle 约 150-200KB+（gzip），比 VitePress 的 ~80KB、Astro Starlight 的 ~0KB 重不少
- **无多版本文档**：Docusaurus 一行 `docs:version` 就能快照版本，Nextra 不提供——要做多版本必须手动建 `v1/` / `v2/` 子目录
- **`page.mdx` 目录嵌套深**：App Router 约定下每个页面都是 `<route>/page.mdx`，目录层级比 VitePress 的扁平结构深一倍；4.x 新增 `content/` 目录约定缓解了这个问题
- **构建时间随 Next.js 项目膨胀**：大型站点（百级页面 + 大量 RSC）冷构建可能数十秒，比 VitePress / Astro 慢
- **Pages Router 模式已停止演进**：v3 的 Pages Router 模式不再添加新特性，建议新项目直接用 v4 App Router
- **i18n 静态导出限制**：`output: 'export'` + i18n 中间件不兼容——若要静态导出托管，i18n 必须用纯路径前缀方案
- **theme 深度定制曲线**：浅层 `_meta.ts` + `theme.config` 即可；深层需要自定义 theme（自己写 navbar / sidebar / 调用 `getPageMap()` + `normalizePages()`），门槛比 VitePress 的 `vitepress/theme` 高
- **官方主题选择窄**：只有 docs / blog 两个官方 theme，没有 Docusaurus classic 那种"一个 preset 拿下"的多功能选择
- **vs VitePress / Docusaurus / Starlight**：
  - **VitePress**：Vue 生态对标款，Vite 极快构建 / 首屏更轻 / 内置主题更克制，但无博客 theme / 内置组件少
  - **Docusaurus**：React 生态多功能款，docs + blog + versioning + i18n 全套，但 Webpack 构建慢 + 视觉风格陈旧
  - **Starlight**（Astro）：现代设计 + 零 JS（island 架构），但社区小 + 无多版本 + 无博客
  - **Nextra** 仍是「**React 生态 + Next.js 全栈能力 + 现代视觉**」场景的**最佳选择**——尤其当你已经在用 Next.js 时

## 文档地址

[Nextra 官网](https://nextra.site/) | [Docs](https://nextra.site/docs) | [入门指引](https://nextra.site/docs/docs-theme/start) | [Built-in Components](https://nextra.site/docs/built-ins) | [Showcase](https://nextra.site/showcase) | [Blog](https://nextra.site/blog) | [API 速查](https://nextra.site/api)

## GitHub 地址

[shuding/nextra](https://github.com/shuding/nextra) | [nextra-docs-template](https://github.com/shuding/nextra-docs-template)（docs 模板） | [nextra-blog-template](https://github.com/shuding/nextra-blog-template)（博客模板）

## 学习路径

- [入门](./getting-started.md)：`npm i next react react-dom nextra nextra-theme-docs` / `next.config.mjs` 启用 Nextra 插件 / `mdx-components.tsx`（必须文件）/ `app/layout.jsx` 配 `Layout` + `Navbar` + `Footer` / `content/` 目录 + `[[...mdxPath]]/page.jsx` catch-all 路由 / `_meta.ts` 第一篇 sidebar / 第一篇 MDX / dev server / Pagefind 搜索 / 部署到 Vercel
- [指南](./guide-line.md)：**核心**：Nextra 与 Next.js 关系 / 三大 theme（docs / blog / custom）/ `_meta.ts` 完整配置（顺序 / 显示名 / type=page / type=menu / type=separator / theme 子选项 / `_meta.global`）/ MDX 3 能力（GFM / GitHub Alert / 自定义 components / `useMDXComponents`）/ 内置组件（Callout / Cards / Steps / FileTree / Tabs / Bleed / Table）/ Layout Theme 组件（Banner / Head / Search / Navbar / Footer / NotFoundPage）/ 搜索（Pagefind 默认 / Algolia 集成）/ i18n / 主题定制 / LaTeX / Mermaid / Tailwind / Syntax Highlighting / SEO / Vercel 部署 / 静态导出 / Turbopack
- [参考](./reference.md)：**API 速查**：`next.config.mjs` Nextra 插件全部选项 / `_meta.ts` 完整 schema / `DocsThemeConfig` 全部 props / `useMDXComponents` / `getPageMap()` / `generateStaticParamsFor` / `importPage` / `compileMdx` / `evaluate` / `normalizePages` / 内置组件 props 速查表 / 文件约定速查 / 常用 CLI / Plugin 生态
