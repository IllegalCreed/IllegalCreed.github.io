---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Hexo 8.x（最新 8.1.0 / 2025-10 发布，要求 Node.js 20.19+ / Git 必备）编写。

## 速查

- 系统要求：**Node.js 20.19+** + **Git**（任意发行版）+ 任意包管理器（npm / yarn / pnpm）
- 全局安装 CLI：`npm install -g hexo-cli`
- 创建项目：`hexo init blog && cd blog && npm install`
- 启动 dev server：`hexo server`（默认 4000 端口，简写 `hexo s`）
- 生成静态文件：`hexo generate`（简写 `hexo g`，输出到 `public/`）
- 清理缓存：`hexo clean`（删除 `db.json` + `public/`，疑难杂症通用招式）
- 一键部署：`hexo deploy`（简写 `hexo d`，需先装 `hexo-deployer-git`）
- 常用组合：`hexo clean && hexo g -d`（清理 → 生成 → 部署）
- 新建文章：`hexo new "我的第一篇文章"`（默认 layout 为 `post`，写入 `source/_posts/`）
- 新建草稿：`hexo new draft "草稿标题"`（写入 `source/_drafts/`，默认不发布）
- 发布草稿：`hexo publish draft "草稿标题"`（从 `_drafts/` 移到 `_posts/`，自动加日期）
- 核心包：`hexo`（主程序） + `hexo-cli`（命令行） + `hexo-server`（本地服务器） + `hexo-renderer-marked`（Markdown 渲染）
- 配置入口：`_config.yml`（站点配置） + `_config.[theme].yml`（主题配置）

## Hexo 适合什么场景

理解 Hexo 必须先理解它的**定位**——它是「**博客驱动**」静态站点生成器，不是通用 SSG 也不是文档站工具：

| 维度 | Hexo 8.x | VitePress 1.x | Docusaurus 3.x | Hugo 0.x | Jekyll 4.x |
|---|---|---|---|---|---|
| 运行时 | **Node.js 20.19+** | Node.js 18+ | Node.js 20+ | Go 单二进制 | Ruby 3.0+ |
| 默认模板引擎 | Nunjucks（可换 EJS/Pug） | Vue 3 | React 18 + MDX | Go template | Liquid |
| 内容格式 | **Markdown**（GFM） | Markdown + Vue | MDX 3 | Markdown | Markdown |
| 博客系统 | **✅ 一等公民**（核心定位） | ❌ 无 | ✅ 内置（不及 Hexo 细） | ✅ 内置 | ✅ 内置（原生） |
| 文档站能力 | ⚠️ 弱（需主题自行实现） | **✅ 一等公民** | **✅ 一等公民** | 中等 | 弱 |
| 主题数量 | **440+**（社区） | 1 默认 + 自定义 | 1 classic | 300+（社区） | 100+ |
| 中文资料 | **极丰富** | 丰富 | 较多 | 一般 | 较少 |
| 一键部署 | `hexo deploy` 命令 | 需 CI/CD | `docusaurus deploy` | 需 CI/CD | GitHub Pages 原生 |
| 构建速度 | 中-快（百级文章秒级） | **极快**（Vite） | 中（Webpack） | **极快**（Go） | 慢（Ruby） |
| HMR | 有但慢（全量重建） | **极快** | 较快 | 较快 | 无 |
| 典型用户 | 个人技术博主 / 中文圈 | Vue 项目 / 文档 | React 项目 / 文档 | 个人 / 极客 | GitHub Pages 用户 |

**核心适合**：

- **个人技术博客**（最经典场景——单作者 + 中长篇文章 + 分类标签）
- **GitHub Pages 上的静态博客**（`hexo-deployer-git` 一键推 gh-pages 分支）
- **不想搞 CI/CD**（命令行直接发布，比 Docusaurus / VitePress 简单）
- **中文圈博主**（百度 / 知乎 / 简书有大量教程，遇到问题搜索友好）
- **Markdown 重度用户**（GFM 完整支持 + 大量 tag plugin 简化富媒体嵌入）

**不适合**：

- **多版本文档站**（无版本概念，VitePress / Docusaurus 更合适）
- **团队 Wiki / API 文档**（侧重博客发布而非协作）
- **要求极速构建**（千篇以上文章时不如 Hugo）
- **不想配 Node.js**（Hugo 单二进制更省心）
- **要 SPA 体验 / Vue 组件**（VitePress 更合适）

## 系统准备

### Node.js 版本

Hexo 8.0 起要求 **Node.js 20.19.0 或更高**——必须先检查：

```bash
node -v
# v20.19.0 或更高才算合格
```

如果版本不够，**强烈推荐用 nvm / fnm** 管理 Node 版本：

```bash
# 安装最新 LTS
nvm install --lts && nvm use --lts

# 或用 fnm（速度更快）
fnm install --lts && fnm use lts-latest
```

> Hexo 历史版本的 Node 要求：
>
> | Hexo 版本 | Node.js 最低要求 |
> |---|---|
> | 8.x | 20.19+ |
> | 7.x | 14+ |
> | 6.x | 12+ |
> | 5.x | 10+ |

### Git

Hexo 自身不强制 Git，但**部署必备**（`hexo-deployer-git` 依赖 Git）。检查：

```bash
git --version
# git version 2.x.x 任何 2.x 都可以
```

### 包管理器

任选其一（推荐 npm，最广泛兼容）：

```bash
npm -v       # Node 自带
pnpm -v      # 推荐（速度快、磁盘省）
yarn -v      # 也可
```

## 安装 Hexo CLI

Hexo 的命令行工具是 **独立的 `hexo-cli` 包**——必须全局安装：

```bash
npm install -g hexo-cli
```

校验安装：

```bash
hexo --version
# hexo-cli: 4.3.x
# os: ...
```

> 国内用户如果 npm 太慢：
>
> ```bash
> npm config set registry https://registry.npmmirror.com
> ```

### 不想全局安装？

可以用 `npx`：

```bash
npx hexo-cli init blog
```

但**频繁操作**（每天 `hexo new` / `hexo s`）下，全局安装体验更好。

## 创建项目

### 一行命令初始化

```bash
hexo init blog
cd blog
npm install
```

`hexo init <folder>` 会做这几件事：

1. 克隆 `hexo-starter` 模板到 `blog/`
2. 拉取默认主题 `landscape`（Hexo 官方默认主题）
3. 创建标准目录结构 + 默认 `_config.yml`
4. **不会自动安装依赖**——必须手动 `npm install`

### 启动

```bash
hexo server
# 或简写
hexo s
```

浏览器打开 `http://localhost:4000/` 即可看到默认 Landscape 主题的首页 + 一篇示例文章「Hello World」。

> Hexo 的 dev server 会监听 `source/` 和主题文件变更，**修改后自动重新生成 + 浏览器刷新**。但需要注意：**修改 `_config.yml` 必须重启 server**（Ctrl+C 关闭后再 `hexo s`）。

## 项目结构

`hexo init` 生成的标准结构：

```
blog/
├── _config.yml                        # ⚙️ 站点核心配置
├── _config.landscape.yml              # ⚙️ 默认主题 Landscape 的配置
├── package.json                       # 📦 依赖（hexo + hexo-renderer-* + hexo-server）
├── scaffolds/                         # 📝 文章模板（hexo new 用）
│   ├── post.md                        #   - 普通文章模板
│   ├── page.md                        #   - 独立页面模板
│   └── draft.md                       #   - 草稿模板
├── source/                            # ✍️ 你写的内容
│   ├── _posts/                        #   - 正式发布的文章
│   │   └── hello-world.md
│   └── _drafts/                       #   - 草稿（默认不渲染）
├── themes/                            # 🎨 主题目录
│   └── landscape/                     #   - 默认主题
└── node_modules/                      # 📦 依赖（npm install 后生成）
```

### 各目录用途

| 路径 | 作用 |
|---|---|
| `_config.yml` | **站点核心配置**——title / URL / 主题选择 / 分类标签 / 部署 / 永久链接 / 分页等 |
| `_config.[theme].yml` | **主题独立配置**——Hexo 6.0+ 推荐用这种方式覆盖主题默认值，不污染主题源码 |
| `package.json` | 依赖管理，含 `hexo` `hexo-renderer-marked` `hexo-server` 等 |
| `scaffolds/` | **文章脚手架**——`hexo new <layout>` 时按这里的模板生成 |
| `source/` | **你写的所有内容**——Markdown / HTML / 图片等 |
| `source/_posts/` | **正式文章**——会被生成到 `public/` 并出现在归档 |
| `source/_drafts/` | **草稿**——不会渲染（除非加 `--draft` 或 `render_drafts: true`） |
| `source/_data/` | **数据文件**——YAML / JSON，可在模板中通过 `site.data.xxx` 引用 |
| `themes/` | 所有主题目录，每个主题一个文件夹 |
| `public/` | **构建输出**（`hexo g` 后生成）——可直接部署到任何静态服务器 |
| `db.json` | **数据库缓存**（`hexo g` 后生成）——加速增量构建，遇到怪问题先 `hexo clean` |

> **隐藏文件规则**：
>
> - `source/` 下**以下划线开头**的目录（`_drafts`、`_data` 等）**默认不会**被直接生成到 `public/`（但 `_posts` 是特例，会渲染为文章）
> - **以点开头**的隐藏文件（如 `.gitignore`）也会被忽略
> - 想强制包含，用 `include:` 配置项（详见指南篇）

## 第一份配置：`_config.yml`

刚 init 的项目自带一份 `_config.yml`——这是整个站点的总入口。打开看一眼：

```yml
# Site
title: Hexo                            # 站点标题（浏览器标签 + 默认 SEO）
subtitle: ''                            # 副标题
description: ''                         # SEO 描述
keywords:                               # SEO 关键词
author: John Doe                        # 作者
language: en                            # 语言（zh-CN 中文）
timezone: ''                            # 时区（默认本机）

# URL
url: http://example.com                 # 部署后访问 URL（必须带 http:// 或 https://）
permalink: :year/:month/:day/:title/    # 文章 URL 格式
permalink_defaults:                     # 默认值（如某文章未设置 :category 时的填充）
pretty_urls:
  trailing_index: true                  # /foo/index.html 是否保留 index.html
  trailing_html: true                   # 是否保留 .html 扩展名

# Directory
source_dir: source                      # 源目录（默认 source）
public_dir: public                      # 输出目录
tag_dir: tags                           # 标签页路径
archive_dir: archives                   # 归档路径
category_dir: categories                # 分类路径
code_dir: downloads/code
i18n_dir: :lang                         # i18n 路径占位符

# Writing
new_post_name: :title.md                # 新建文章的文件名格式
default_layout: post                    # 默认布局
titlecase: false                        # 标题转 Title Case
external_link:
  enable: true                          # 自动给外链加 target="_blank"
  field: site                           # 'site' 仅站外 / 'all' 所有外链
  exclude: ''
filename_case: 0                        # 0 不变 / 1 小写 / 2 大写
render_drafts: false                    # 是否渲染草稿
post_asset_folder: false                # ⚠️ 强烈建议改 true（启用文章资源文件夹）
relative_link: false
future: true                            # 是否渲染未来日期文章
syntax_highlighter: highlight.js        # ⭐ v7.0+ 字段：'highlight.js' | 'prismjs' | ''

# Home page
index_generator:
  path: ''
  per_page: 10                          # 每页文章数
  order_by: -date

# Category & Tag
default_category: uncategorized
category_map:
tag_map:

# Metadata
meta_generator: true

# Date / Time
date_format: YYYY-MM-DD
time_format: HH:mm:ss
updated_option: 'mtime'                 # 'mtime'=文件修改时间 / 'date' / 'empty'

# Pagination
per_page: 10                            # 每页文章数
pagination_dir: page

# Include / Exclude
include:
exclude:
ignore:

# Extensions
theme: landscape                        # ⭐ 主题（默认 landscape）

# Deployment
deploy:
  type: ''                              # 留空，安装 deployer 后配置
```

### 必改字段速览

新项目至少要改这几个：

```yml
title: 我的博客
subtitle: 记录技术与生活
description: 一个独立开发者的 Hexo 博客
author: 你的名字
language: zh-CN                         # ⭐ 改成简体中文
timezone: Asia/Shanghai                 # ⭐ 中国时区

url: https://yourdomain.com             # ⭐ 部署后真实 URL

post_asset_folder: true                 # ⭐ 启用每文章独立资源文件夹

theme: next                             # ⭐ 想换主题在这里改
```

### URL 与 baseUrl

部署到根域名：

```yml
url: https://yourdomain.com
# root 默认 '/'
```

部署到子路径（如 GitHub Pages 项目仓库 `username.github.io/blog`）：

```yml
url: https://username.github.io/blog
root: /blog/                            # 必须以 / 结尾
```

## 第一篇文章

### 创建

```bash
hexo new "我的第一篇文章"
```

`hexo new` 会：

1. 用 `scaffolds/post.md` 作为模板
2. 生成到 `source/_posts/我的第一篇文章.md`
3. 自动填充 `title` / `date` / `tags`

生成后的文件：

```md
---
title: 我的第一篇文章
date: 2026-05-18 14:30:00
tags:
---
```

### 写正文

在 `---` 之后开始写：

```md
---
title: 我的第一篇文章
date: 2026-05-18 14:30:00
tags:
  - Hexo
  - 入门
categories:
  - 技术博客
description: 这是我用 Hexo 写的第一篇文章
---

## 一级标题

普通段落，可以有 [链接](https://hexo.io)、**加粗**、_斜体_、`行内代码`。

## 代码块

​```ts title="hello.ts"
const message: string = 'Hello, Hexo!'
console.log(message)
​```

> 也可以引用区块。
```

启动 `hexo s` 后访问 `http://localhost:4000/2026/05/18/我的第一篇文章/`（默认永久链接格式）即可看到。

> 上面代码中的反引号 ``` ` ``` 实际是连续 3 个；为避免 Markdown 嵌套解析错误，正文展示用了零宽空格分隔。下文同理。

### Front Matter 速览

文章顶部 `---` 之间的 YAML 块叫 **front matter**，常用字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 标题（必填） |
| `date` | datetime | 发布时间 |
| `updated` | datetime | 修改时间（默认 = 文件 mtime） |
| `comments` | boolean | 是否启用评论（取决于主题） |
| `tags` | string[] | 标签数组 |
| `categories` | string[] | 分类（数组形式表示**层级**） |
| `permalink` | string | 自定义 URL 路径 |
| `excerpt` | string | 摘要（覆盖正文里的 `<!-- more -->` 摘要） |
| `description` | string | SEO 描述 |
| `keywords` | string | SEO 关键词 |
| `layout` | string | 布局（默认 `post`） |
| `lang` | string | 语言（i18n 用） |
| `disableNunjucks` | boolean | 关闭 Nunjucks 模板语法解析 |

### 分类与标签的区别（关键概念）

| 维度 | categories（分类） | tags（标签） |
|---|---|---|
| 层级 | **有层级**（树状） | **无层级**（平面） |
| 数量 | 通常 1-3 个 | 可以很多 |
| 写法 | 数组表层级 | 数组并列 |

**单分类**：

```yml
categories: 技术
# 等价于
categories:
  - 技术
```

**多层级**（嵌套 → 子分类）：

```yml
categories:
  - 技术
  - 前端
  - Vue
# 生成路径 /categories/技术/前端/Vue/
```

**多个独立分类**（每个独立树）：

```yml
categories:
  - [技术, 前端]
  - [生活, 旅行]
# 生成 /categories/技术/前端/ 和 /categories/生活/旅行/ 两个独立树
```

**标签**：

```yml
tags:
  - Hexo
  - 静态站点
  - 博客
# 生成 /tags/Hexo/ /tags/静态站点/ /tags/博客/ 三个并列页
```

## 摘要截断 `<!-- more -->`

在文章中插入 HTML 注释 `<!-- more -->`，**之前的内容**会作为摘要显示在首页 / 归档页：

```md
---
title: 文章
---

这是摘要部分——会显示在首页列表中。

<!-- more -->

详情页才显示的正文……
```

> 不写 `<!-- more -->` 时，Hexo 会取前 N 个字符作摘要（取决于主题）。

## 第一个独立页面

不是博客文章、而是「**关于我**」「**友链**」这类独立页面：

```bash
hexo new page about
```

会生成 `source/about/index.md`——访问 `/about/` 即可。

```md
---
title: 关于我
date: 2026-05-18 15:00:00
---

# 关于我

我是一名前端工程师，喜欢 Vue 和 Rust。
```

> 注意 `hexo new page <name>` 默认会生成 `source/<name>/index.md`，而不是 `source/<name>.md`——这样可以把图片等资源放在该目录下，类似 Docusaurus 的 co-located 资源模式。

## 草稿与发布

写一半还不想公开？用草稿：

```bash
hexo new draft "正在写的草稿"
# 生成 source/_drafts/正在写的草稿.md
```

预览草稿（默认不渲染）：

```bash
hexo server --draft
# 临时启用草稿渲染
```

或者改 `_config.yml`：

```yml
render_drafts: true
```

写完想发布？

```bash
hexo publish draft "正在写的草稿"
# 自动从 _drafts/ 移到 _posts/，并加上当前日期
```

## 安装第一个主题：NexT

默认 `landscape` 主题界面较老，**90% 中文用户会换 [NexT](https://theme-next.js.org/)**（GitHub star 数最高的 Hexo 主题）。

### 方式 1：通过 npm（推荐，Hexo 5.0+）

```bash
npm install hexo-theme-next
```

修改 `_config.yml`：

```yml
theme: next
```

### 方式 2：通过 git clone（老方式）

```bash
git clone https://github.com/next-theme/hexo-theme-next themes/next
```

修改 `_config.yml`：

```yml
theme: next
```

### 主题独立配置（Hexo 6.0+ 推荐）

不要直接改 `themes/next/_config.yml`——这样在主题升级时会被覆盖。应该在**项目根目录**新建 `_config.next.yml`：

```yml
# _config.next.yml
scheme: Gemini                          # NexT 有 4 个 scheme: Muse / Mist / Pisces / Gemini

menu:
  home: / || fa fa-home
  archives: /archives/ || fa fa-archive
  tags: /tags/ || fa fa-tags
  categories: /categories/ || fa fa-th
  about: /about/ || fa fa-user

darkmode: true                          # 暗色模式（NexT 8.27.0 默认开启）

social:
  GitHub: https://github.com/你的用户名 || fab fa-github
  Email: mailto:you@example.com || fa fa-envelope
```

重启 server：

```bash
hexo clean && hexo s
```

刷新页面即可看到新主题。

## 本地开发

### 启动 dev server

```bash
hexo server
# 或简写
hexo s
```

常用选项：

```bash
hexo s -p 5000                          # 改端口（默认 4000）
hexo s -i 0.0.0.0                       # 改 IP（默认 0.0.0.0）
hexo s --draft                          # 临时启用草稿
hexo s --static                         # 仅服务 public/，不监听变更（生产模式）
hexo s --debug                          # 调试模式
```

### 文件监听规则

Dev server 会监听：

- `source/` 全部变更 → 自动重新生成 + 浏览器刷新
- `themes/` 全部变更 → 自动重新生成
- `_config.yml` → **不会自动重启**（需要手动 Ctrl+C + `hexo s`）
- `_config.[theme].yml` → 同上

### 清理缓存

修改了主题 / 配置但页面没刷新？或者出现奇怪的旧内容？**Hexo 通用万能招式**：

```bash
hexo clean
# 删除 db.json + public/
```

然后 `hexo s` 重新启动。

## 构建与部署

### 生产构建

```bash
hexo generate
# 或简写
hexo g
```

会做的事：

1. 读取 `source/` 所有 Markdown + 模板
2. 用主题渲染
3. 写入 `public/` 目录
4. 同步 `db.json` 缓存

常用选项：

```bash
hexo g --watch                          # 监听变更，自动增量构建
hexo g --deploy                         # 构建后直接部署（等价 hexo g -d）
hexo g --force                          # 全量重建（无视 db.json 缓存）
hexo g --bail                           # 遇到错误立即停止（CI 推荐）
```

### 本地预览生产构建

```bash
hexo s -s
# -s = --static，仅服务 public/
```

### 部署到 GitHub Pages（一键命令）

最简单方式——`hexo-deployer-git` 插件。

**步骤 1：安装插件**

```bash
npm install --save hexo-deployer-git
```

**步骤 2：配置 `_config.yml`**

```yml
deploy:
  type: git
  repo: https://github.com/你的用户名/你的用户名.github.io.git
  branch: main                          # 用户主页用 main / 项目页用 gh-pages
  message: 'Site updated: {{ now("YYYY-MM-DD HH:mm:ss") }}'
```

**步骤 3：执行**

```bash
hexo clean && hexo deploy --generate
# 或简写
hexo clean && hexo g -d
```

Hexo 会：

1. 清理 `public/` + `db.json`
2. 重新生成静态文件
3. 在 `public/` 内 `git init` + commit + push

> 部署后 1-2 分钟，访问 `https://你的用户名.github.io/` 即可看到。

### GitHub Actions 自动化部署（推荐）

更现代的方式——把源码推到 main 分支，CI 自动构建 + 部署。

**`.github/workflows/pages.yml`**：

```yml
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
      - run: npx hexo generate

      - uses: actions/upload-pages-artifact@v3
        with:
          path: public

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

GitHub 仓库 → Settings → Pages → Source 选 **GitHub Actions** 即可。

### 部署到 Vercel / Netlify / Cloudflare Pages

这类平台**零配置识别 Hexo**：

- **Vercel**：导入 GitHub 仓库——Build Command 自动 `npx hexo generate`，Output 自动 `public`
- **Netlify**：同上，或在 `netlify.toml` 显式：
  ```toml
  [build]
    publish = "public"
    command = "hexo generate"
  ```
- **Cloudflare Pages**：导入仓库，Build Command `npx hexo generate`，Output `public`

每个 PR 还会自动生成 Preview Deployment——不需要自建 CI。

### 自定义域名

`source/CNAME` 文件（无扩展名）写入域名：

```
yourdomain.com
```

GitHub Pages / Netlify 都会识别并设置自定义域名。

## 项目脚本一览

`hexo init` 生成的 `package.json` 默认 scripts 较空——常用脚本通常自己加：

```json
{
  "scripts": {
    "build": "hexo generate",
    "clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server",
    "new": "hexo new"
  }
}
```

然后用 `npm run build` 替代 `hexo g` 等命令。

## TypeScript 支持

Hexo 本身用 **TypeScript** 重写（8.x 起核心包发布 `.d.ts`），但**写博客本身不需要 TS**——只有写主题 / 插件时才用得上。

如果要给主题加 TS：

```bash
npm install --save-dev typescript @types/node
```

然后在主题目录写 `.ts` 文件，配 `tsconfig.json` 编译到 `.js` 即可。详见指南篇「自定义主题」章节。

## 常见陷阱

### Node 版本不对

```
ERROR Node.js v18.0.0 is not supported. Hexo 8 requires Node.js v20.19+.
```

升级 Node：`nvm install 20 && nvm use 20`。

### 端口被占用

```
ERROR Port 4000 has been used.
```

```bash
hexo s -p 5000
```

或杀掉占用进程：

```bash
lsof -i :4000               # 找出 PID
kill -9 <PID>
```

### `hexo clean` 后页面变成空白

正常——`hexo clean` 删了 `public/`，必须 `hexo g` 重新生成。或者直接 `hexo s`（dev server 启动时自动生成）。

### 修改主题配置没生效

- 改的是 `themes/next/_config.yml`？升级时会被覆盖——应该改项目根的 `_config.next.yml`
- 改完没重启？`Ctrl+C` 后 `hexo s` 重启
- 还是不行？`hexo clean && hexo s`

### YAML 缩进错误

```
YAMLException: bad indentation
```

YAML 严格按空格缩进——**不能用 Tab**。配置文件里冒号后**必须有空格**：

```yml
# ❌ 错误
title:Hello

# ✅ 正确
title: Hello
```

### 文章中 `&#123;&#123; ... &#125;&#125;` 报错

Hexo 5+ 默认用 Nunjucks 模板引擎处理 Markdown——**`&#123;&#123; var &#125;&#125;` 会被当作模板变量**。两种解法：

**方法 1**：用 `&#123;% raw %&#125;` 包裹：

```md
{% raw %}
原始内容 {{ 不会被解析 }}
{% endraw %}
```

**方法 2**：在 front matter 关闭 Nunjucks：

```yml
---
title: 文章
disableNunjucks: true
---
```

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：`_config.yml` 字段详解 / Front matter 全表 / 标签插件深度 / 主题与模板 / 插件生态 / 一键部署多平台
- [参考](./reference.md)：CLI 命令全集 / 配置字段速查 / 模板变量 / Helper 函数 / 主流主题与插件清单
