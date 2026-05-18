---
layout: doc
---

# Eleventy

由 **Zach Leatherman** 在 **2018 年** 开源的「**极简 JavaScript 静态站点生成器**」（项目代号 **11ty**，谐音 "Eleventy"），定位是"**比 Jekyll 简单、比 Hugo 灵活、比 Next.js 轻量**"的 Node.js SSG。Eleventy 最大的差异化在于「**模板引擎自由**」——同一个项目里可以**同时**使用 **HTML / Markdown / Liquid / Nunjucks / WebC / 11ty.js / Handlebars / Mustache / EJS / HAML / Pug / TypeScript / JSX / MDX / Sass** 等 **15+ 种** 模板语言，每个文件按扩展名自动选择对应引擎；slogan 直接写在首页上：**"Use any (or all) of: HTML, Markdown, JavaScript, Liquid, Nunjucks..."**。**另一个核心理念**是「**Zero client-side JavaScript by default**」——Eleventy 只输出纯静态 HTML，**默认不绑任何前端框架 / SPA / 客户端 bundle**，这点和 Astro 哲学一致但比 Astro 更极致（Astro 还有 island 概念，11ty 连 island 都没有）。**最新 3.x 版本**（**v3.1.5** 稳定 + **v4.0.0-alpha** Canary）做了几个大动作：**ESM 优先**（默认配置文件可以是 `eleventy.config.mjs`，所有 docs 例子默认 `export default`）/ **冻结 Eleventy supplied data**（`page` / `eleventy` 等保留字在 v3 不能被覆盖）/ **WebC 一等公民**（自家 Web Components 框架，支持 SSR 渲染 + 范围 CSS）/ **Bundle Plugin**（`@11ty/eleventy-plugin-bundle` 内置 CSS / JS 打包，无需 Webpack / Vite）/ **Image Plugin 转换模式**（`eleventyImageTransformPlugin` 直接处理 HTML 中的 `<img>` 标签，自动生成 AVIF / WebP / 多分辨率 srcset）。整套体系最大的特色是「**无任何技术栈预设**」——不强迫你用 React、不强迫你用 Vue、不强迫你用 TS、甚至**不强迫你写 JavaScript**：你完全可以用「Markdown + Liquid + 几个 YAML 配置」做出一个完整的博客 / 文档站。**典型用户群**：**MDN 学习区**（mozilla 旗下）/ **Smashing Magazine** / **web.dev**（Google）/ **tailwindcss.com**（早期）/ **css-tricks** 等大型内容网站，以及大量**性能优先的独立博客 / 设计师作品集 / 文档站**。

## 评价

**优点**

- **模板引擎自由**：同一项目可混用 HTML / Markdown / Nunjucks / Liquid / WebC / 11ty.js 等 15+ 种语言，每个文件按后缀自动路由；这是 Hugo / Jekyll / Hexo / Astro 都不具备的能力
- **Zero JS by default**：输出 100% 纯静态 HTML，零客户端 bundle——TTFB / FCP / LCP 等核心指标天然优秀，Lighthouse 默认满分
- **配置极简**：零配置即可运行（`npx @11ty/eleventy` 直接处理当前目录所有 `.md` / `.html`），需要定制时一个 `eleventy.config.mjs` 文件搞定
- **Data Cascade 强大**：5 层数据合并优先级（全局 → 配置全局 → 布局 front matter → 目录数据 → 模板数据 → 模板 front matter → 计算属性），覆盖了几乎所有数据共享场景
- **Filters / Shortcodes 跨引擎统一**：`addFilter` / `addShortcode` 注册后在 Liquid / Nunjucks / 11ty.js / WebC / Markdown 全部生效，无需重复注册
- **Plugin 生态精炼**：`@11ty/eleventy-img`（图像优化）/ `@11ty/eleventy-plugin-rss`（RSS / Atom）/ `@11ty/eleventy-plugin-syntaxhighlight`（PrismJS）/ `@11ty/eleventy-plugin-navigation`（层级导航 / 面包屑）/ `@11ty/eleventy-plugin-bundle`（CSS / JS 打包）/ `@11ty/eleventy-plugin-webc`（WebC 组件）/ `@11ty/eleventy-plugin-i18n`（国际化）—— 7 个官方插件覆盖绝大多数需求
- **构建速度快**：纯 Node.js + 增量构建（`--incremental` flag），中型站点（百级页面）通常 1-3 秒，比 Webpack-based 的 Gatsby / Docusaurus 快一个数量级
- **WebC 内置**：3.x 的自家 Web Components 框架，写组件零运行时、支持 SSR、自动 scoped CSS，类似 Astro components 但更轻
- **Image Plugin 优秀**：`@11ty/eleventy-img` 自动生成 AVIF / WebP / JPEG 多格式 + 多分辨率 + lazy loading，是社区公认的最佳实践
- **官方文档详尽**：11ty.dev 站本身就用 Eleventy 构建，docs 覆盖每个 API 细节 + 大量 starter 模板
- **Zach Leatherman 是 web 标准布道者**：作者本人是 web fonts / CSS / a11y 领域著名工程师，长期为 web 性能 / 标准发声，社区氛围非常技术导向

**缺点**

- **没有"约定"**：自由度高的反面是**新手不知道怎么开始**——目录结构没有强制约定（除了 `_includes` / `_data`），路由没有约定，主题系统不存在，每个项目都要自己组织一切
- **没有官方主题系统**：相比 Hexo（NexT / Butterfly）/ Docusaurus（classic）的开箱即用，11ty 只有几个"starter 模板"——`eleventy-base-blog` 是社区维护的最大那一个
- **学习曲线**：模板引擎自由 = 必须学多种模板引擎（Liquid / Nunjucks / WebC）；Data Cascade 5 层优先级需要时间消化；新手往往不知道选哪个引擎
- **没有 HMR**：dev server 修改后浏览器自动刷新（live reload），但**不是 HMR**（不保留组件状态）——比 VitePress / Astro 体验差
- **没有"开发者体验"组件**：搜索（Algolia / Pagefind 要自接）/ TOC（要自写 plugin）/ 多版本文档（没有概念）/ i18n（plugin 较弱）/ admin 后台（无）—— 对比 Docusaurus 都是空白
- **3.x ESM 升级有阵痛**：v2 → v3 切换到 ESM 默认，老配置（CommonJS）需要改 `module.exports` → `export default`；很多教程 / 第三方插件还停在 v2
- **TypeScript 支持靠 JSDoc**：配置文件可以加 `@param {import("@11ty/eleventy").UserConfig}` 注释获得类型提示，但不是原生 TS 支持
- **不擅长大型应用**：定位是"内容站"，如果要做 SPA / 复杂交互应用，应该选 Next.js / Nuxt / Astro，而不是 11ty
- **vs Hexo / Hugo / Jekyll / Astro / VitePress**：
  - **Hexo**：博客一站式（分类 / 标签 / 归档 / RSS 全内置 + 440 主题），但只为博客 + 中文圈生态最完整；11ty 灵活但需自配
  - **Hugo**：Go 单二进制 + 极快构建（千页秒级），但模板语法 Go template 门槛高；11ty Node 生态更友好
  - **Jekyll**：GitHub Pages 原生 + Ruby 生态，但构建慢 + Ruby 在 Windows 上坑多；11ty 跨平台 + 现代化
  - **Astro**：现代 island 架构 + 多框架支持（React / Vue / Svelte 互通），定位类似但 Astro 体量更大；11ty 更轻
  - **VitePress**：文档站为主 + Vue 生态，HMR 极快但博客功能弱；11ty 内容定位更广
  - **Eleventy** 仍是「**极简 + 模板自由 + 零客户端 JS + 高度定制**」场景的**最佳选择**——对追求"工程师工艺"的独立开发者吸引力极强

## 文档地址

[Eleventy 官网](https://www.11ty.dev/) | [Docs](https://www.11ty.dev/docs/) | [快速上手](https://www.11ty.dev/docs/getting-started/) | [Plugin 列表](https://www.11ty.dev/docs/plugins/) | [Starter 模板](https://www.11ty.dev/docs/starter/) | [Eleventy Leaderboard 案例展示](https://www.11ty.dev/leaderboards/) | [Image Plugin](https://www.11ty.dev/docs/plugins/image/) | [WebC](https://www.11ty.dev/docs/languages/webc/)

## GitHub 地址

[11ty/eleventy](https://github.com/11ty/eleventy) | [11ty/eleventy-img](https://github.com/11ty/eleventy-img) | [11ty/eleventy-base-blog](https://github.com/11ty/eleventy-base-blog)（官方维护的基础博客 starter）

## 学习路径

- [入门](./getting-started.md)：`npx @11ty/eleventy` 零安装跑起来 / `npm init` + `npm install @11ty/eleventy` 标准安装 / 第一个 `.md` 文件 → 自动输出 HTML / 项目结构（`_site/` / `_includes/` / `_data/`）/ 11 种模板引擎一览 / `eleventy.config.mjs` 配置文件 / 第一个 layout / 第一个 collection / dev server（`--serve`）/ 部署
- [指南](./guide-line.md)：**核心**：模板引擎深度（Nunjucks 推荐 / 多引擎混用 / 引擎覆盖）/ Front matter / Layouts 链式继承 / Permalinks（自定义 URL 规则）/ Collections（tag-based + 自定义 + 排序 / 过滤）/ Data Cascade 5 层优先级 / Filters + Shortcodes（跨引擎注册）/ Plugins（image / rss / syntaxhighlight / navigation / bundle / webc / i18n）/ WebC 单文件组件 / Bundle Plugin / Image 优化 / Incremental Builds / Pagination / Internationalization / 部署到 Netlify / Vercel / Cloudflare Pages / GitHub Pages
- [参考](./reference.md)：**API 速查**：CLI 命令全表 / `eleventy.config.mjs` 配置选项 / Front matter 字段 / Filters 内置全表（`url` / `slugify` / `log` / `get*CollectionItem`）/ Shortcodes API / Eleventy 模板变量（`page` / `eleventy` / `collections` / `pagination`）/ Data Cascade 优先级 / Permalinks 变量 / Plugin 列表 / WebC 语法速查（`webc:if` / `webc:for` / `webc:scoped` / `webc:bucket` 等）
