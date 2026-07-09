---
layout: doc
---

# Hexo

由台湾开发者 **Tommy Chen（陈嘉栋 / @tommy351）** 在 **2012 年** 开源、运行在 **Node.js** 上的「**博客（Blog）专用静态站点生成器**」，至今已有 **10+ 年**历史——也是 **中文圈博客最主流的 SSG 之一**，长期与 GitHub Pages 教程一起出现在百度搜索结果首位。Hexo 把「**写博客**」这件事拆成几个明确职责：**Markdown 渲染**（默认 `hexo-renderer-marked`，可换 `hexo-renderer-pandoc` 等）/ **模板引擎**（默认 Nunjucks，可换 EJS / Pug）/ **主题系统**（社区维护 440+ 主题，最著名的有 **NexT / Butterfly / Fluid / Icarus / Volantis** 等）/ **插件生态**（`hexo-deployer-git` 一键部署、`hexo-generator-feed` 生成 RSS、`hexo-generator-sitemap` 生成站点地图、`hexo-symbols-count-time` 字数统计 + 阅读时间等）/ **写作流程**（`hexo new` 新建 / `hexo new draft` 草稿 / `hexo publish` 发布草稿）/ **分类 + 标签 + 归档** 三件套自动生成 / **一键生成 + 一键部署**（`hexo g -d`）。**最新版本 Hexo 8.1.0**（2025-10 发布）要求 **Node.js 20.19+**，并默认带 **`syntax_highlighter` 配置**（v7.0 引入，支持 highlight.js / prismjs 切换）。整套体系最大的特色是「**极度专注博客**」——不像 Docusaurus 那样把 docs 作为一等公民、也不像 VitePress 那样把文档站作为核心，Hexo 几乎只服务一件事：**让一个人写博客、发文章、自动归档、生成 RSS、推 GitHub Pages**，并且把这件事做到了极致。

## 评价

**优点**

- **博客场景一站式**：分类 + 标签 + 归档 + RSS + 摘要截断（`<!-- more -->`）+ 草稿系统全部内置，无需任何插件即可拥有完整博客功能
- **生成速度极快**：纯 Node.js 实现，"几百个文件只需数秒构建完成"——这是 Hexo 的核心宣传卖点
- **生态成熟**：440+ 社区主题（NexT / Butterfly / Fluid 最流行），300+ 官方插件覆盖 SEO / 部署 / 评论 / 搜索 / 字数统计等
- **一键部署友好**：`hexo deploy` 命令 + `hexo-deployer-git` 插件就能推 GitHub Pages，不需要懂 Actions
- **中文圈极其流行**：百度搜索"博客 GitHub Pages"几乎必出 Hexo 教程，知乎 / 简书 / CSDN 有大量中文资料和踩坑笔记
- **配置简单**：站点配置 `_config.yml` + 主题配置 `_config.[theme].yml`，YAML 平铺，新手上手 30 分钟可发第一篇博客
- **模板引擎可换**：默认 Nunjucks，可改用 EJS / Pug；Markdown 渲染器也可换（marked / pandoc / Kramed）
- **草稿 + 发布工作流**：`hexo new draft` 写草稿（`source/_drafts/`），`hexo publish` 升为正式文章并自动加日期——比 Jekyll 的"日期写在文件名里"友好得多
- **十年稳定迭代**：2012 至今从未停止维护，社区贡献者数百名，问题回复活跃
- **Markdown 增强**：支持 GFM、内置 codeblock / blockquote / pullquote 等 tag plugin，可嵌入 video / link / img 等富媒体

**缺点**

- **几乎不适合做文档站**：分类 / 标签 / 归档体系是为博客优化的——多版本文档、左侧 sidebar、TOC 等都要靠主题自己实现，不像 Docusaurus / VitePress 那样开箱即用
- **主题质量参差**：440+ 主题中真正在维护的不多，许多 2017-2019 的主题已停更，新主题难脱 NexT / Butterfly 的"博客模板美学"
- **配置文件分散**：站点 `_config.yml` + 每个主题独立 `_config.[theme].yml` + 部分插件单独配置，新手容易混淆
- **Nunjucks 模板有学习成本**：从 Hexo 5 默认改用 Nunjucks（之前是 Swig），模板中的 `&#123;&#123; ... &#125;&#125;` 表达式与 Markdown 内容偶尔冲突，需要 `&#123;% raw %&#125;` 或 `disableNunjucks: true` 转义
- **依赖 Node.js 工具链**：相比 Jekyll（Ruby）/ Hugo（Go 单二进制），Hexo 的 `node_modules` 在中国大陆 npm 速度也较慢
- **无原生多版本 / i18n**：i18n 仅支持主题层文案翻译（`__()` / `_p()`），文档多版本能力为 0——这点与 Docusaurus 差距明显
- **HMR 慢**：`hexo server` 修改文章后需要重新生成全站，没有 Vite 那种秒级 HMR
- **vs VitePress / Hugo / Jekyll / Docusaurus**：
  - **VitePress**：Vue 团队出品，定位"文档站为主、博客为辅"，HMR 极快，但博客功能弱
  - **Hugo**（Go）：单二进制无依赖，构建速度最快，但写主题要学 Go template，门槛高
  - **Jekyll**（Ruby）：GitHub Pages 原生支持，但 Ruby 依赖在 Windows 上坑多，构建慢
  - **Docusaurus**：React 生态文档大杀器，但博客功能不如 Hexo 精细
  - **Hexo** 仍是「**只为博客 + 中文圈最完整文档 + 部署简单**」场景的**首选**

## 文档地址

[Hexo 官网](https://hexo.io/) | [Hexo 中文官网](https://hexo.io/zh-cn/) | [Hexo Docs](https://hexo.io/docs/) | [API 文档](https://hexo.io/api/) | [主题列表](https://hexo.io/themes/) | [插件列表](https://hexo.io/plugins/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=hexo" target="_blank" rel="noopener noreferrer">Hexo 测试题</a>


## GitHub 地址

[hexojs/hexo](https://github.com/hexojs/hexo)

## 学习路径

- [入门](./getting-started.md)：`npm install -g hexo-cli` / `hexo init blog` / 项目结构（`_config.yml` / `themes/` / `source/` / `scaffolds/`）/ `hexo new` 写作 / `hexo server` 预览 / `hexo generate` 构建 / `hexo deploy` 部署 / 第一篇文章 / front matter 速览 / 安装 NexT 主题
- [指南](./guide-line.md)：**核心**：`_config.yml` 站点配置详解 / 写作流程（front matter 全表 / 分类 + 标签 / 摘要 `<!-- more -->` / 草稿 + 发布）/ 模板与主题（NexT 主题深度配置 / 自定义主题）/ 标签插件（`{% asset_img %}` / `{% codeblock %}` / `{% raw %}` 等）/ 数据文件 / 资源文件夹 / Markdown 渲染器替换 / 插件生态（hexo-renderer-pandoc / hexo-deployer-git / hexo-generator-sitemap / hexo-generator-feed / hexo-symbols-count-time）/ 一键部署 GitHub Pages / Vercel / Netlify / 自建服务器
- [参考](./reference.md)：**API 速查**：CLI 命令全表（`init` / `new` / `generate` / `server` / `deploy` / `clean` / `config` / `migrate` / `version` / `publish` / `list`）/ `_config.yml` 字段全表 / 文章 front matter 全表 / Hexo 全局变量（`site` / `page` / `config` / `theme`）/ Helper 函数全集（`url_for` / `paginator` / `truncate` / `date` / `gravatar` / `list_categories` / `list_tags`）/ 内置 tag plugins / 主流主题与插件列表
