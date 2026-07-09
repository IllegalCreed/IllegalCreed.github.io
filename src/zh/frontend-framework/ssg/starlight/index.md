---
layout: doc
---

# Starlight

由 **Astro 核心团队**（withastro/starlight，**Chris Swithinbank** 等维护）官方出品的「**Astro 原生文档站主题**」，定位是「**在 Astro 上跑、把 Astro Islands 直接嵌进文档**」的现代 SSG——和 VitePress（Vue + Vite）/ Nextra（Next.js + React）/ Docusaurus（React + Webpack）属于同一档对手，但**唯一**继承了 Astro 的全部能力：**Astro Islands**（在 Markdown 里直接 `import` React / Vue / Svelte / Solid / Preact 任意框架组件 + 按需 hydrate）、**Zero JS by default**（默认输出纯静态 HTML，比 VitePress / Docusaurus 都更接近 Eleventy 的极简哲学）、**Content Collections**（基于 Zod schema 的类型安全 frontmatter）、**MDX / Markdoc 双内容格式**、**完整 i18n**（含 RTL）、**Pagefind 内置全文搜索**（开箱即用，零配置，离线索引）、**Expressive Code**（带 Twoslash 的代码块）、**Tailwind CSS v4 一等公民**支持。整套体系跟着 Astro 大版本走——**Astro 5.x + Starlight 0.36.x**（2026-05 当前稳定）——配置文件只有一个 `astro.config.mjs`，所有定制全部 in-place（**不像 Docusaurus 那样需要 `docusaurus.config.ts` + `sidebars.ts` 双文件 + plugins + preset 三层结构**）。最大的差异化在于：**Astro 是一个真正的「应用框架」而非"文档框架"**——所以 Starlight 不止能做文档站，还能在同一个 Astro 项目里同时塞一个登录页 / 一个 dashboard / 一个 API endpoint，Markdown 与 `.astro` / `.tsx` 自由混搭。最知名的用户是 **Astro 自家文档**（docs.astro.build 用 Starlight 重写）/ **Cloudflare Workers 文档**（developers.cloudflare.com）/ **Biome 文档** / **Bun 文档**（部分）/ **xterm.js 文档** 等。

## 评价

**优点**

- **Astro Islands 一等公民**：MDX 里直接 `import` React / Vue / Svelte / Solid / Preact 任意框架组件，按需 hydrate（`client:load` / `client:idle` / `client:visible` / `client:media`）—— VitePress 只能用 Vue，Nextra 只能用 React，Docusaurus 只能用 React，**Starlight 全都能**
- **Zero JS by default**：默认输出 100% 静态 HTML，组件仅在标记 `client:*` 时才打包客户端 JS——首屏体积接近 Eleventy / Hugo / 11ty，Lighthouse 默认满分
- **Pagefind 内置全文搜索**：零配置开箱即用，完全离线索引（不依赖 Algolia / Typesense 服务），构建后 `dist/pagefind/` 自带搜索 wasm + 索引文件，可换 Algolia DocSearch
- **Expressive Code**：代码块默认带 **line markers**（高亮指定行）/ **diff highlighting**（`+` / `-` 标注）/ **file titles**（顶部文件名）/ **frame=terminal**（终端样式）/ **Twoslash**（TypeScript 类型 hover 提示）—— 比 VitePress / Docusaurus 默认体验都好
- **Content Collections + Zod schema**：`src/content/docs/*.mdx` frontmatter 全部 Zod 校验，IDE 自动补全 + 编译时报错；`docsSchema()` 默认提供 `title` / `description` / `template` / `hero` / `sidebar` / `lastUpdated` / `prev` / `next` / `pagefind` / `draft` / `banner` 全套字段
- **i18n 完整**：`locales: { 'zh-cn': { label: '简体中文', lang: 'zh-CN' }, ar: { label: 'العربية', dir: 'rtl' } }`，自动 locale switcher、自动 fallback、`src/content/i18n/{locale}.json` 自定义 UI 翻译、`Astro.locals.t('key')` 在组件里访问
- **Tailwind CSS v4 原生支持**：`@astrojs/starlight-tailwind` 一行接入，颜色 / 字体 / 间距全用 Tailwind 配置；不喜欢 Tailwind 也可以纯 CSS（`customCss: ['./src/custom.css']` + 覆盖 `--sl-color-accent-*`）
- **Components 可覆盖**：所有内置组件（Header / SocialIcons / SiteTitle / Search / ThemeSelect / TableOfContents / Hero / Footer / EditLink / Pagination 等 20+ 个）都可以 `components: { Header: './src/components/MyHeader.astro' }` 整个替换，自定义组件里还能 `import Default from '@astrojs/starlight/components/Header.astro'` 包装增强
- **Plugin 生态**：`starlight-blog`（博客）/ `starlight-openapi`（OpenAPI 自动生成）/ `starlight-image-zoom`（图片缩放）/ `starlight-versions`（多版本，**对标 Docusaurus 的核心卖点**）/ `starlight-sidebar-topics`（多 sidebar 主题）/ `starlight-links-validator`（死链检测）/ `starlight-typedoc`（TypeDoc 自动生成）/ `starlight-llms-txt`（llms.txt 标准支持）—— 社区插件丰富
- **Astro 团队官方维护**：和 Astro 大版本同步发布，跟随 Astro 升级（5.x 一切受益，包括 Vite 8 / Rolldown / Image Service / Server Islands 等新特性）
- **跑在 Astro 上 = 部署到任何平台**：Vercel / Netlify / Cloudflare Pages / GitHub Pages / Deno Deploy / 静态服务器 / Node 服务器（SSR）全部支持

**缺点**

- **必须接受 Astro 生态**：项目本质是 Astro 项目，需要熟悉 `astro.config.mjs` / Astro 组件语法（`.astro` 文件）/ Astro 内容集合——已有 VitePress / Docusaurus 经验的开发者要重新学习
- **没有官方多版本**：Docusaurus 的 `docs:version` 是开箱即用，Starlight 需要装第三方 `starlight-versions` 插件——对比相对弱
- **配置集中在 `astro.config.mjs`**：sidebar / locales / customCss / plugins 全在一个文件，复杂项目时可能 300+ 行；不像 Docusaurus 把 sidebar 拆到独立 `sidebars.ts`
- **生态比 Docusaurus 小**：插件数量 / 社区话题 / 中文资料明显少于 Docusaurus，遇到罕见需求时往往要自己写组件
- **`<Tabs>` / `<Steps>` 这些组件需要 import**：MDX 里每次用都要 `import { Tabs, TabItem } from '@astrojs/starlight/components';`——不像 Docusaurus 把 admonition / Tabs 全局注入（Markdoc 模式下不需要 import，但 Markdoc 是另一套语法）
- **Tailwind v4 升级阵痛**：starlight-tailwind 跟着 Tailwind v4 的 `@theme` / CSS-first 配置走，老 Tailwind v3 项目升级路径需要重新学习
- **PageFind 搜索准确度一般**：开箱即用但中文分词较弱（无 jieba），文档量大时召回率不如 Algolia / Typesense
- **vs VitePress / Nextra / Docusaurus**：
  - **VitePress**：Vue 一等公民 / Vite HMR 极快 / 中文资料最多 / 但只能用 Vue 组件、i18n / 多版本 / 搜索都比 Starlight 弱（搜索需 Algolia）
  - **Nextra**：Next.js 生态 / Tailwind 风格 / 但 React 强绑定、构建偏重、`_meta.json` sidebar 不直观
  - **Docusaurus**：多版本 + 博客 + i18n 一体化最完整 / React 生态最稳健 / 但 Webpack 构建慢、首屏 JS 体积大、设计较老
  - **Starlight** 仍是「**Astro 生态 + 多框架混搭 + 零客户端 JS + 现代设计**」场景的**最佳选择**——尤其适合 Astro 项目添加文档子站，或想在 Markdown 里同时用 React + Vue + Svelte 组件的"框架不可知"团队

## 文档地址

[Starlight 官网](https://starlight.astro.build/) | [Starlight 文档](https://starlight.astro.build/getting-started/) | [配置参考](https://starlight.astro.build/reference/configuration/) | [Frontmatter 参考](https://starlight.astro.build/reference/frontmatter/) | [Plugins 列表](https://starlight.astro.build/resources/plugins/) | [Site Showcase 案例](https://starlight.astro.build/resources/showcase/) | [Astro 官方文档](https://docs.astro.build/) | [Expressive Code](https://expressive-code.com/) | [Pagefind](https://pagefind.app/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=starlight" target="_blank" rel="noopener noreferrer">Starlight 测试题</a>


## GitHub 地址

[withastro/starlight](https://github.com/withastro/starlight) | [withastro/astro](https://github.com/withastro/astro)（Astro 主仓库）

## 学习路径

- [入门](./getting-started.md)：环境要求（Node.js 18+ / Astro 5+）/ `pnpm create astro@latest -- --template starlight` 脚手架 / 项目结构（`src/content/docs/` / `astro.config.mjs` / `content.config.ts`）/ 第一篇文档 / sidebar 配置 / dev server / 主题切换 / 部署 Vercel / Netlify / Cloudflare Pages
- [指南](./guide-line.md)：**核心**：Markdown / MDX / Markdoc 内容编写 / Content Collections + Zod schema / Frontmatter 字段全集（template / hero / banner / sidebar / pagefind / draft）/ Sidebar 配置（autogenerate / 嵌套 group / badge）/ i18n（locales / defaultLocale / root locale / fallback / UI 翻译 JSON）/ CSS & Tailwind 定制（customCss / `--sl-color-*` 变量 / Tailwind v4 接入）/ Logo / Favicon / Head / Social Links / Components 覆盖 / 内置组件全集（Card / CardGrid / LinkCard / LinkButton / Tabs / Steps / Aside / Badge / Icon / FileTree / Code）/ Pagefind 搜索 / Algolia DocSearch 替换 / Plugins 生态（starlight-blog / starlight-openapi / starlight-image-zoom / starlight-versions）/ Astro Islands 嵌入 React/Vue/Svelte / Site Map / RSS / Sitemap / Markdown 增强（Mermaid / Latex / footnote）/ 部署 Vercel / Netlify / Cloudflare Pages / GitHub Pages
- [参考](./reference.md)：**API 速查**：`astro.config.mjs` starlight 配置字段全表 / Content Collections schema / Frontmatter 字段速查 / 内置组件 props（Card / Tabs / Aside / Badge / LinkCard / LinkButton / Icon / Steps / FileTree / Code）/ CSS 自定义属性 / 可覆盖组件清单 / Route Data API / Plugin API（i18n:setup / config:setup hooks）/ Astro CLI 常用命令 / Plugin 列表速查
