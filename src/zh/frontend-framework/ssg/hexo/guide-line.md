---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Hexo 8.x —— `_config.yml` 站点配置 / 写作流程 / 模板与主题 / 标签插件 / 数据文件 / 资源文件夹 / 插件生态 / 一键部署多平台

## `_config.yml` 站点配置详解

站点配置文件，位于项目根目录——**所有非主题相关的配置都在这里**。

### Site（站点元数据）

```yml
title: 我的博客                          # 浏览器标签 / 默认 SEO title
subtitle: 一行 tagline                  # 副标题
description: 一段长描述                  # SEO description
keywords:                              # SEO keywords（数组）
  - Vue
  - 前端
  - 博客
author: 你的名字                        # 作者
language: zh-CN                        # ⭐ 简体中文（多语言用数组）
timezone: Asia/Shanghai                # ⭐ 时区（IANA 名）
```

`language` 支持多语言：

```yml
language:
  - zh-CN
  - en
# 第一个为默认 locale
```

### URL（URL 配置）

```yml
url: https://yourdomain.com            # ⭐ 部署后真实 URL（必须 http(s)://）
root: /                                # 根路径（部署到子目录时改为 /blog/）
permalink: :year/:month/:day/:title/   # ⭐ 文章 URL 格式
permalink_defaults:                    # permalink 占位符默认值
  lang: zh
pretty_urls:
  trailing_index: true                 # /foo/index.html 保留 index.html
  trailing_html: true                  # 保留 .html 后缀
```

**Permalink 占位符**全集：

| 占位符 | 含义 | 示例 |
|---|---|---|
| `:year` | 4 位年 | 2026 |
| `:month` | 2 位月 | 05 |
| `:day` | 2 位日 | 18 |
| `:hour` / `:minute` / `:second` | 时分秒 | 14 / 30 / 25 |
| `:title` | 文章 title（slugified） | hello-world |
| `:post_title` | 文章原标题 | Hello World |
| `:name` | 文件名（不含扩展） | hello-world |
| `:category` | 分类层级 | tech/frontend |
| `:id` | 文章 ID（自动） | 5 |
| `:hash` | 文件名 + 日期的 SHA1 | abc1234... |
| `:timestamp` | UNIX 时间戳 | 1715000000 |
| `:i18n` | i18n 语言 | zh / en |

**常用 permalink 模板**：

```yml
# 默认（按日期）
permalink: :year/:month/:day/:title/
# → /2026/05/18/hello-world/

# 按分类
permalink: :category/:title/
# → /tech/frontend/hello-world/

# 简洁（仅标题）
permalink: posts/:title/
# → /posts/hello-world/

# 含 ID（避免重名冲突）
permalink: :year/:title-:id/
# → /2026/hello-world-5/
```

### Directory（目录配置）

```yml
source_dir: source                     # 源目录
public_dir: public                     # 输出目录
tag_dir: tags                          # 标签页 URL（/tags/）
archive_dir: archives                  # 归档页 URL（/archives/）
category_dir: categories               # 分类页 URL（/categories/）
code_dir: downloads/code               # include_code 标签插件源目录
i18n_dir: :lang                        # i18n 占位符（用于多语言路径）
skip_render:                           # 跳过渲染但拷贝的文件
  - "mypage/**/*"                      # 比如想保留某个原生 HTML 页面
```

### Writing（写作配置）

```yml
new_post_name: :title.md               # 新文章文件名模板
default_layout: post                   # 默认 layout
titlecase: false                       # 自动 Title Case 化标题
external_link:
  enable: true                         # 自动给外链加 target="_blank"
  field: site                          # 'site' 全站外链 / 'all' 含 self
  exclude:
    - 'twitter.com'                    # 这些域名不处理
filename_case: 0                       # 0 不变 / 1 小写 / 2 大写
render_drafts: false                   # 是否渲染草稿
post_asset_folder: true                # ⭐ 强烈推荐 true，启用每文章独立资源
relative_link: false                   # 用相对链接还是绝对
future: true                           # 是否生成未来日期的文章
syntax_highlighter: highlight.js       # ⭐ v7+ 字段
highlight:                             # highlight.js 配置
  line_number: true
  auto_detect: false
  tab_replace: '  '                    # 替换 Tab 为 2 空格
  wrap: true
  hljs: false
  exclude_languages:
prismjs:                               # prismjs 配置（若 syntax_highlighter: prismjs）
  preprocess: true
  line_number: true
  tab_replace: '  '
```

**syntax_highlighter 配置**（v7.0+）：

| 值 | 含义 |
|---|---|
| `highlight.js`（默认） | 服务端构建时高亮 |
| `prismjs` | 服务端 + 客户端均可 |
| `''`（空） | 关闭，让 Markdown 渲染器自己处理（适合用 hexo-renderer-marked 内建高亮） |

### Home Page（首页配置）

```yml
index_generator:
  path: ''                             # 首页路径（'' = 根 /）
  per_page: 10                         # 每页文章数
  order_by: -date                      # 排序（- 为降序，date / updated / title）
```

### Category & Tag（分类标签）

```yml
default_category: uncategorized        # 文章未指定分类时的默认值

category_map:                          # 分类映射（中文 → URL slug）
  技术: tech
  生活: life

tag_map:                               # 标签映射
  前端: frontend
```

### Metadata（元数据）

```yml
meta_generator: true                   # 是否生成 <meta name="generator" content="Hexo">
```

### Date / Time（日期格式）

```yml
date_format: YYYY-MM-DD                # Moment.js 格式
time_format: HH:mm:ss
updated_option: 'mtime'                # 'mtime' = 文件修改时间 / 'date' = 同 date / 'empty'
```

### Pagination（分页）

```yml
per_page: 10                           # 全局每页文章数
pagination_dir: page                   # 分页 URL 段（/page/2/）
```

### Include / Exclude（包含排除）

```yml
include:                               # 强制包含（默认会被忽略的下划线开头文件）
  - '**/_*/**'                         # 包含所有 _foo/ 目录
exclude:                               # 排除（不渲染）
  - 'source/_drafts/secret.md'
ignore:                                # 完全忽略（连读都不读）
  - '**/.git/**'
```

### Extensions（扩展）

```yml
theme: next                            # ⭐ 主题（指定 themes/next/）
theme_config:                          # 内联主题配置（不推荐，建议用 _config.next.yml）
  scheme: Gemini

deployment:                            # 部署（详见后文）
  type: git
  repo: ...
```

## 写作流程

### Front Matter 完整字段

文章顶部 `---` 之间的 YAML（或 JSON 用 `;;;` 结尾）：

```md
---
title: 我的文章标题
date: 2026-05-18 14:30:00
updated: 2026-05-19 10:00:00
tags:
  - Hexo
  - 入门
categories:
  - 技术
  - 前端
permalink: hello-hexo/
description: SEO 描述
keywords: hexo,博客,静态站点
comments: true
layout: post
lang: zh
disableNunjucks: false
toc: true
mathjax: true
sticky: 100
excerpt: 手动指定摘要
---

正文……
```

**所有字段含义**：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | string | 文件名 | 文章标题 |
| `date` | datetime | 文件创建时间 | 发布时间 |
| `updated` | datetime | 文件 mtime | 修改时间（由 `updated_option` 决定） |
| `comments` | boolean | true | 是否启用评论（取决于主题） |
| `tags` | string[] | `[]` | 标签数组 |
| `categories` | string[] / string[][] | `[]` | 分类（嵌套 = 层级；多数组 = 多树） |
| `permalink` | string | 按 `permalink` 配置 | 自定义 URL |
| `description` | string | - | SEO description |
| `keywords` | string | - | SEO keywords |
| `excerpt` | string | - | 手动摘要（覆盖 `<!-- more -->` 提取） |
| `layout` | string | `post` | 布局（`post` / `page` / `draft`） |
| `lang` | string | 站点 language | i18n 语言代码 |
| `disableNunjucks` | boolean | false | 关闭 Nunjucks 模板解析 |
| `photos` | string[] | - | 文章关联图集（图床等） |
| `link` | string | - | 外链文章（点击直接跳转） |
| `toc` | boolean | 主题默认 | 是否显示 TOC（NexT 等主题支持） |
| `mathjax` | boolean | 主题默认 | 是否启用数学公式 |
| `sticky` | number | - | 置顶权重（需 `hexo-generator-index-pin-top` 插件） |
| `password` | string | - | 文章密码（需主题或插件支持） |

### 分类与标签深入

#### 单层级分类

```yml
categories: 技术
```

生成 URL：`/categories/技术/`。

#### 多层级分类（嵌套）

```yml
categories:
  - 技术
  - 前端
  - Vue
```

生成：`/categories/技术/前端/Vue/`（**注意**：这表示「Vue 是 前端的子分类，前端是 技术的子分类」）。

#### 多个独立分类（多个根节点）

```yml
categories:
  - [技术, 前端]
  - [生活, 旅行]
```

生成两个独立的分类树：

- `/categories/技术/前端/`
- `/categories/生活/旅行/`

#### 标签（永远扁平）

```yml
tags:
  - Hexo
  - 静态站点
  - 博客
```

生成 3 个并列：

- `/tags/Hexo/`
- `/tags/静态站点/`
- `/tags/博客/`

### 摘要 `<!-- more -->`

```md
---
title: 文章
---

这是摘要——会显示在首页 + 归档 + RSS。

<!-- more -->

详情页才显示的正文……
```

> 不写 `<!-- more -->` 时，Hexo 会自动取前 N 个字符（具体由主题决定）。

也可以用 front matter 显式指定：

```yml
excerpt: 这是手动指定的摘要文本
```

`excerpt` **优先级最高**。

### 草稿与发布工作流

```bash
# 1. 写草稿
hexo new draft "正在写的草稿"

# 2. 本地预览（默认不渲染草稿）
hexo s --draft

# 3. 发布
hexo publish draft "正在写的草稿"
# 自动移到 source/_posts/ 并加上当前日期
```

或者改 `_config.yml` 让草稿默认渲染：

```yml
render_drafts: true
```

### 文件名格式定制

默认 `new_post_name: :title.md` 让文件名等于标题——但中文标题会出现编码问题。常见替代：

```yml
# 1. 日期前缀（推荐）
new_post_name: :year-:month-:day-:title.md
# → 2026-05-18-hello-world.md

# 2. 时间戳
new_post_name: :timestamp-:title.md
# → 1715000000-hello-world.md
```

> `new_post_name` 只影响**文件名**，文章 URL 由 `permalink` 控制。

## 模板与主题

Hexo 主题系统是它最强大也最复杂的部分。

### 主题目录结构

每个主题位于 `themes/<theme-name>/`：

```
themes/next/
├── _config.yml                        # 主题默认配置
├── languages/                         # i18n
│   ├── zh-CN.yml
│   └── en.yml
├── layout/                            # ⭐ 布局模板
│   ├── index.njk                      # 首页
│   ├── post.njk                       # 文章详情
│   ├── page.njk                       # 独立页面
│   ├── archive.njk                    # 归档
│   ├── category.njk                   # 分类
│   ├── tag.njk                        # 标签
│   ├── 404.njk                        # 404 页
│   └── _partial/                      # 部分模板（partial）
│       ├── header.njk
│       ├── footer.njk
│       └── sidebar.njk
├── scripts/                           # 主题加载时自动运行的 JS
└── source/                            # 主题静态资源（CSS/JS/图片）
    ├── css/
    └── js/
```

### 模板引擎选择

Hexo 5+ 默认 **Nunjucks**（`.njk` 后缀），也支持 **EJS** / **Pug** / **Stylus** 等。文件后缀决定引擎：

| 后缀 | 引擎 | 安装包 |
|---|---|---|
| `.njk` / `.html` | **Nunjucks**（默认） | `hexo-renderer-nunjucks` |
| `.ejs` | EJS | `hexo-renderer-ejs` |
| `.pug` / `.jade` | Pug | `hexo-renderer-pug` |
| `.haml` | Haml | `hexo-renderer-haml` |

### Nunjucks 模板示例

`layout/index.njk`（首页）：

```html
<!DOCTYPE html>
<html lang="{{ config.language }}">
<head>
  <meta charset="UTF-8" />
  <title>{{ config.title }}</title>
  <meta name="description" content="{{ config.description }}" />
</head>
<body>
  <header>
    <h1>{{ config.title }}</h1>
    <p>{{ config.subtitle }}</p>
  </header>

  <main>
    {% for post in page.posts.toArray() %}
      <article>
        <h2>
          <a href="{{ url_for(post.path) }}">{{ post.title }}</a>
        </h2>
        <time>{{ date(post.date, config.date_format) }}</time>
        <div>{{ post.excerpt | safe }}</div>
      </article>
    {% endfor %}

    {% if page.prev %}
      <a href="{{ url_for(page.prev_link) }}">上一页</a>
    {% endif %}
    {% if page.next %}
      <a href="{{ url_for(page.next_link) }}">下一页</a>
    {% endif %}
  </main>

  <footer>
    Copyright © {{ date(Date.now(), 'YYYY') }} {{ config.author }}
  </footer>
</body>
</html>
```

> 上面 `&#123;&#123; ... &#125;&#125;` 是 Nunjucks 变量语法——在 VitePress 文档中展示时已转义。实际 `.njk` 文件中直接写花括号即可。

### Partial（部分模板）

让多个布局共用同一段：

```html
<!-- layout/_partial/header.njk -->
<header>
  <h1>{{ config.title }}</h1>
  <nav>
    <a href="/">首页</a>
    <a href="/archives/">归档</a>
  </nav>
</header>
```

在其他模板中 include：

```html
<!-- layout/index.njk -->
{% include '_partial/header.njk' %}

<main>...</main>
```

也可以用 `partial()` 函数（更灵活，支持传参）：

```html
{{ partial('_partial/header', { customTitle: '首页' }) }}
```

### NexT 主题深度配置

NexT 是中文圈最流行的 Hexo 主题——以下是几乎所有项目都会改的配置项。

**Scheme 切换**（NexT 有 4 个内置主题风格）：

```yml
# _config.next.yml
scheme: Gemini    # Muse / Mist / Pisces / Gemini
```

| Scheme | 风格 |
|---|---|
| Muse | 左对齐 + 黑白简约 |
| Mist | 紧凑型 |
| Pisces | 双栏 + 侧边栏 |
| Gemini | Pisces + 顶部菜单（最现代） |

**菜单**：

```yml
menu:
  home: / || fa fa-home
  archives: /archives/ || fa fa-archive
  tags: /tags/ || fa fa-tags
  categories: /categories/ || fa fa-th
  about: /about/ || fa fa-user
  link: /link/ || fa fa-link

menu_settings:
  icons: true
  badges: true                          # 显示数量徽章
```

格式：`menu_name: URL || icon`，icon 用 [Font Awesome](https://fontawesome.com/) class。

**社交链接**：

```yml
social:
  GitHub: https://github.com/你的用户名 || fab fa-github
  Twitter: https://twitter.com/handle || fab fa-twitter
  Email: mailto:you@example.com || fa fa-envelope
  RSS: /atom.xml || fa fa-rss

social_icons:
  enable: true
  icons_only: false
  transition: false
```

**侧边栏**：

```yml
sidebar:
  position: left                        # left | right
  display: post                         # always | hide | post（默认）| remove
  padding: 18
  offset: 12
```

**评论系统**（NexT 8.x 支持 Gitalk / Utterances / Disqus / Valine / Waline 等）：

```yml
# Gitalk（GitHub Issues 评论）
gitalk:
  enable: true
  github_id: 你的GitHub用户名
  repo: 评论仓库名                       # 用专门仓库存评论 issue
  client_id: GitHub_OAuth_App_ID
  client_secret: GitHub_OAuth_App_Secret
  admin_user: 你的GitHub用户名
  distraction_free_mode: true
```

**搜索**：

```yml
local_search:
  enable: true
  trigger: auto                         # auto | manual
  top_n_per_article: 1
  unescape: false
```

需要先安装 `hexo-generator-searchdb`：

```bash
npm install hexo-generator-searchdb
```

**数学公式**：

```yml
math:
  every_page: false                     # 仅在 front matter mathjax: true 时启用
  mathjax:
    enable: true
  katex:
    enable: false
```

**代码高亮**：

NexT 自带主题选择：

```yml
codeblock:
  copy_button:
    enable: true                        # 代码块右上角复制按钮
    show_result: true                   # 显示复制成功提示
  fold:
    enable: false                       # 折叠超长代码块
    height: 500
  highlight_theme: night-bright         # 高亮主题（约 10 个内置）
```

**字数 + 阅读时间**：

需要装 `hexo-symbols-count-time`：

```bash
npm install hexo-symbols-count-time
```

`_config.yml`：

```yml
symbols_count_time:
  symbols: true
  time: true
  total_symbols: true
  total_time: true
  exclude_codeblock: false              # 是否排除代码块
  awl: 4                                # 平均字长
  wpm: 275                              # 阅读速度（中文用 300-500）
```

`_config.next.yml`：

```yml
symbols_count_time:
  separated_meta: true
  item_text_post: true
  item_text_total: false
```

**暗黑模式**（NexT 8.27.0+ 默认开启）：

```yml
darkmode: true
```

**自定义 CSS / JS**：

```yml
custom_file_path:
  style: source/_data/styles.styl
```

然后新建 `source/_data/styles.styl`：

```stylus
.site-title {
  color: #ff6b6b !important
}
```

### 自定义主题入门

写一个最小的主题——`themes/mytheme/`：

```
themes/mytheme/
├── _config.yml
├── layout/
│   ├── layout.njk         # 全局布局
│   ├── index.njk          # 首页
│   └── post.njk           # 文章
└── source/
    └── css/
        └── style.css
```

**`layout/layout.njk`**（共享外壳）：

```html
<!DOCTYPE html>
<html lang="{{ config.language }}">
<head>
  <meta charset="UTF-8" />
  <title>{{ page.title || config.title }}</title>
  <link rel="stylesheet" href="{{ url_for('/css/style.css') }}" />
</head>
<body>
  <header>
    <h1><a href="{{ url_for('/') }}">{{ config.title }}</a></h1>
  </header>

  <main>
    {{ body }}
  </main>

  <footer>
    © {{ date(Date.now(), 'YYYY') }} {{ config.author }}
  </footer>
</body>
</html>
```

<span v-pre>`{{ body }}`</span> 是关键——表示当前页面的内容会被注入这里。

**`layout/index.njk`**：

```html
{% for post in page.posts.toArray() %}
  <article>
    <h2><a href="{{ url_for(post.path) }}">{{ post.title }}</a></h2>
    <time>{{ date(post.date, 'YYYY-MM-DD') }}</time>
    {{ post.excerpt | safe }}
  </article>
{% endfor %}
```

**`layout/post.njk`**：

```html
<article>
  <h1>{{ page.title }}</h1>
  <time>{{ date(page.date, 'YYYY-MM-DD') }}</time>
  {{ page.content | safe }}
</article>
```

`_config.yml` 切到自己的主题：

```yml
theme: mytheme
```

## 标签插件（Tag Plugins）

Hexo 内置一组**比标准 Markdown 更强**的标签语法——形如 `&#123;% xxx %&#125;`。

### Block Quote（带作者的引用）

```md
{% blockquote 作者名, 出处链接 标题 %}
内容
{% endblockquote %}
```

简写：

```md
{% quote 鲁迅, 故乡 %}
希望本是无所谓有，无所谓无的。
{% endquote %}
```

### Code Block（代码块）

```md
{% codeblock lang:js %}
function hello() {
  return 'Hi'
}
{% endcodeblock %}
```

参数：

```md
{% codeblock lang:js mark:1,3-5 first_line:10 caption:"<a href='...'>example.js</a>" %}
// 代码
{% endcodeblock %}
```

| 参数 | 说明 |
|---|---|
| `lang:xxx` | 语言（js / ts / py / ...） |
| `mark:1,3-5` | 高亮第 1, 3-5 行 |
| `first_line:N` | 起始行号 |
| `line_number:false` | 关闭行号 |
| `wrap:false` | 不换行 |
| `highlight:false` | 关闭高亮 |
| `caption:"..."` | 标题（支持 HTML） |

### Include Code（外部代码文件）

```md
{% include_code lang:js example.js %}
```

读取 `source/downloads/code/example.js`（由 `code_dir` 配置决定）。

只取某几行：

```md
{% include_code from:10 to:30 lang:py demo.py %}
```

### Pull Quote（着重引用）

```md
{% pullquote %}
重点提示内容
{% endpullquote %}
```

### iFrame

```md
{% iframe https://example.com/embed 600 400 %}
```

参数：URL / 宽度 / 高度。

### Image

```md
{% img class="my-img" /images/foo.png 600 400 "Alt 文本" "Title 文本" %}
```

参数：

```
class / url / 宽 / 高 / alt / title
```

### Link（外链）

```md
{% link 显示文本 https://example.com 是否target=_blank title %}
```

简写：

```md
{% link Hexo官网 https://hexo.io true %}
```

生成 `<a href="..." target="_blank">Hexo官网</a>`。

### Asset Tags（文章资源）

启用 `post_asset_folder: true` 后，`source/_posts/foo.md` 配套有 `source/_posts/foo/` 目录——里面的图片可以这样引用：

```md
{% asset_img cover.jpg "封面图" %}
{% asset_link demo.zip "下载示例" %}
{% asset_path icon.svg %}
```

| 标签 | 用途 |
|---|---|
| `asset_img` | 图片（自动生成 `<img>`） |
| `asset_link` | 文件链接 |
| `asset_path` | 仅返回 URL（用于 markdown 语法内） |

详见后文「资源文件夹」章节。

### Raw（原始内容，关键）

如果你的 Markdown 里包含与 Nunjucks 冲突的字符（如 `&#123;&#123; ... &#125;&#125;`），用 `raw` 包裹：

```md
{% raw %}
这里 {{ var }} 不会被 Nunjucks 解析
{% endraw %}
```

> **这是写 Hexo 博客最常用的标签插件之一**——只要正文有任何 Mustache 风格变量（Vue / Angular / Handlebars 等），都要用 raw 包裹。

### URL Helpers（v6.0+ 加入）

```md
{% url_for "../about" %}
{% full_url_for "/posts/foo" %}
```

返回带 root 前缀的完整 URL。

### 已废弃标签（v7.0+ 移除）

以下标签在 Hexo 7.0 中**被移除**，迁移到独立的 `hexo-tag-embed` 插件：

- `{% youtube %}`
- `{% vimeo %}`
- `{% jsfiddle %}`
- `{% gist %}`

如需保留：

```bash
npm install hexo-tag-embed
```

## 数据文件（Data Files）

Hexo 3+ 引入——在 `source/_data/` 下放 YAML / JSON 文件，**任意模板**都能通过 `site.data.xxx` 读取。

### 使用场景

- 菜单 / 侧边栏 / footer 链接
- 友链列表
- 团队成员
- 任何不属于"文章"的结构化数据

### 示例：友链

**`source/_data/links.yml`**：

```yml
- name: VitePress
  url: https://vitepress.dev
  description: Vite 团队的文档框架
  avatar: /img/vitepress.png

- name: Docusaurus
  url: https://docusaurus.io
  description: Meta 的文档框架
  avatar: /img/docusaurus.png

- name: Hugo
  url: https://gohugo.io
  description: Go 的极速 SSG
  avatar: /img/hugo.png
```

**在模板中使用**：

```html
<!-- layout/links.njk -->
<ul class="friend-links">
  {% for link in site.data.links %}
    <li>
      <a href="{{ link.url }}" target="_blank">
        <img src="{{ link.avatar }}" alt="{{ link.name }}" />
        <h3>{{ link.name }}</h3>
        <p>{{ link.description }}</p>
      </a>
    </li>
  {% endfor %}
</ul>
```

### JSON 数据文件

也可以用 JSON：

**`source/_data/site_links.json`**：

```json
[
  { "label": "首页", "url": "/" },
  { "label": "归档", "url": "/archives/" }
]
```

```html
{% for item in site.data.site_links %}
  <a href="{{ item.url }}">{{ item.label }}</a>
{% endfor %}
```

## 资源文件夹（Asset Folders）

### 全局资源（推荐配合 Markdown 标准语法）

直接放在 `source/images/`：

```
source/
  images/
    cover.jpg
    diagram.svg
```

引用：

```md
![](/images/cover.jpg)
```

构建后这些文件会原样拷贝到 `public/images/`。

### 每文章独立资源（推荐）

启用：

```yml
# _config.yml
post_asset_folder: true
```

然后 `hexo new "文章"` 会**自动创建**同名目录：

```
source/
  _posts/
    我的文章.md
    我的文章/                            # ⭐ 自动创建
      cover.jpg
      diagram.svg
```

引用方式（用 asset 标签）：

```md
{% asset_img cover.jpg "封面" %}
{% asset_link demo.zip "下载示例" %}
```

### 标准 Markdown 语法支持（v3.1.0+）

`hexo-renderer-marked` 3.1.0+ 支持自动解析 post asset folder——配置：

```yml
post_asset_folder: true
marked:
  prependRoot: true
  postAsset: true
```

然后可以直接用 Markdown 语法：

```md
![封面](cover.jpg)
```

构建时 Hexo 会自动转换为 `/2026/05/18/我的文章/cover.jpg`。

> **推荐组合**：`post_asset_folder: true` + `marked.postAsset: true`——这样既能用 Markdown 语法、又能享受 co-located 资源管理。

## 永久链接深入

### Permalink 自定义

```yml
permalink: posts/:title.html
# → /posts/hello-world.html

permalink: :year/:month/:title/
# → /2026/05/hello-world/

permalink: :category/:title/
# → /tech/frontend/hello-world/

permalink: posts/:id/                   # 用文章 ID（升序自增）
# → /posts/5/
```

### 文章独立 permalink

front matter 可覆盖全局配置：

```yml
---
title: 我的文章
permalink: special-url/
---
```

最终 URL 为 `/special-url/`。

### 多语言 URL

```yml
new_post_name: :lang/:title.md
permalink: :lang/:title/
```

front matter：

```yml
---
title: 中文标题
lang: zh
---
```

URL → `/zh/中文标题/`。

## Markdown 渲染器

Hexo 默认用 `hexo-renderer-marked`——但有更强大的选择。

### 默认 marked

```bash
# 已经在 init 时安装
```

配置：

```yml
marked:
  gfm: true                              # GitHub Flavored Markdown
  pedantic: false
  breaks: true                           # 单换行转 <br>
  smartLists: true
  smartypants: true                      # 智能引号
  modifyAnchors: 0                       # 0 不改 / 1 小写 / 2 大写
  autolink: true                         # 自动识别 URL
  mangle: true                           # 邮箱地址混淆
  sanitizeUrl: false
  external_link:                         # 外链处理
    enable: true
    field: site
  prependRoot: true                      # 图片路径加 root 前缀
  postAsset: true                        # ⭐ 支持 post_asset_folder
  anchorAlias: false
  descriptionLists: true                 # 描述列表 dl/dt/dd
  lazyload: false                        # 图片 loading="lazy"
```

### Pandoc（学术写作首选）

```bash
npm uninstall hexo-renderer-marked
npm install hexo-renderer-pandoc
```

需要系统安装 [pandoc](https://pandoc.org/) 二进制。优势：

- 支持 LaTeX 数学公式（无需额外 MathJax）
- 脚注 / 引文 / 多种高级 Markdown 扩展
- 输出更精确

### Kramed（带数学）

```bash
npm uninstall hexo-renderer-marked
npm install hexo-renderer-kramed
```

支持 `$$...$$` 块公式 + `$...$` 行内。

## 插件生态

Hexo 的灵魂——300+ 官方插件覆盖几乎所有需求。

### 必装清单

```bash
# 1. 一键部署 Git
npm install --save hexo-deployer-git

# 2. 站点地图（SEO）
npm install --save hexo-generator-sitemap

# 3. RSS Feed
npm install --save hexo-generator-feed

# 4. 字数 + 阅读时间
npm install --save hexo-symbols-count-time

# 5. 搜索数据库（配合主题搜索）
npm install --save hexo-generator-searchdb

# 6. 文章置顶
npm install --save hexo-generator-index-pin-top
```

### sitemap 配置

`_config.yml`：

```yml
sitemap:
  path:
    - sitemap.xml
    - sitemap.txt
  template: ./sitemap_template.xml
  template_txt: ./sitemap_template.txt
  rel: false
  tags: true
  categories: true
```

构建后 `public/sitemap.xml` + `public/sitemap.txt`——提交给 Google / 百度站长平台。

### RSS Feed 配置

`_config.yml`：

```yml
feed:
  enable: true
  type:
    - atom
    - rss2
  path:
    - atom.xml
    - rss2.xml
  limit: 20                              # 0 = 全部
  hub:
  content: true                          # 是否包含正文
  content_limit: 140
  content_limit_delim: ' '
  order_by: -date
  icon: icon.png
  autodiscovery: true                    # <link rel="alternate"> 自动发现
  template:
```

构建后 `public/atom.xml` + `public/rss2.xml`——支持 RSS 阅读器订阅。

### 评论系统

| 系统 | 包 | 适合 |
|---|---|---|
| Disqus | 主题内置 | 国际，国内可能墙 |
| Gitalk | NexT 主题内置 | GitHub 用户，依赖 OAuth |
| Utterances | 主题内置 | GitHub Issues 评论 |
| Valine | `valine` | LeanCloud 后端 |
| Waline | `@waline/client` | Valine 升级版，社区活跃 |
| Twikoo | `twikoo` | 腾讯云函数后端 |

### 搜索

| 包 | 类型 |
|---|---|
| `hexo-generator-searchdb` | 生成 search.xml / search.json 数据，主题自己实现 UI |
| `hexo-generator-search` | 类似但格式不同 |
| Algolia DocSearch | 第三方服务，免费申请 |

NexT 主题自带 local-search，配合 `hexo-generator-searchdb` 即可。

### SEO / Meta

```bash
npm install --save hexo-filter-nofollow      # 外链自动 rel="nofollow"
npm install --save hexo-filter-cleanup-html  # 清理 HTML（去多余空白）
```

### 图床 / CDN

```bash
npm install --save hexo-yam                    # gzip + brotli 压缩
npm install --save hexo-renderer-imagemin      # 图片压缩
```

## 一键部署

### GitHub Pages

**步骤 1**：装插件

```bash
npm install --save hexo-deployer-git
```

**步骤 2**：配置 `_config.yml`

```yml
deploy:
  type: git
  repo: git@github.com:你的用户名/你的用户名.github.io.git
  branch: main
  message: 'Site updated: {{ now("YYYY-MM-DD HH:mm:ss") }}'
```

**步骤 3**：部署

```bash
hexo clean && hexo deploy --generate
# 简写 hexo clean && hexo g -d
```

> 用户主页（`username.github.io`）必须推 `main` 分支；项目页（`username.github.io/blog`）推 `gh-pages` 分支，并改 `url: https://username.github.io/blog` + `root: /blog/`。

### 多个 deployer（同时部署多处）

```yml
deploy:
  - type: git
    repo: git@github.com:user/user.github.io.git
    branch: main
  - type: git
    repo: git@gitee.com:user/user.git
    branch: master
  - type: rsync
    host: example.com
    user: deploy
    root: /var/www/blog/
    port: 22
    key: /path/to/key
```

`hexo deploy` 会**按顺序依次执行**。

### GitHub Actions 自动化

完整工作流：

```yml
# .github/workflows/pages.yml
name: Deploy Hexo to GitHub Pages

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
        with:
          submodules: true                # 主题为 git submodule 时

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

GitHub 仓库 Settings → Pages → Source 选 **GitHub Actions**。

### Vercel

直接导入 GitHub 仓库——Vercel 自动识别 Hexo：

- Build Command：`npx hexo generate`（或 `npm run build`）
- Output Directory：`public`
- Install Command：`npm install`
- Framework Preset：`Other` 即可

每个 PR 自动生成 Preview Deployment。

### Netlify

`netlify.toml`：

```toml
[build]
  publish = "public"
  command = "hexo generate"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/old-page"
  to = "/new-page"
  status = 301
```

### Cloudflare Pages

类似 Vercel：

- Framework preset：选 `Hexo`（已内置识别）
- Build command：`npx hexo generate`
- Output directory：`public`

### 自建服务器（nginx）

```bash
# 本地构建
hexo clean && hexo generate

# 上传 public/ 到服务器
rsync -avz --delete public/ user@example.com:/var/www/blog/
```

nginx 配置：

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/blog;
  index index.html;

  location / {
    try_files $uri $uri/ =404;
  }

  # gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

  # 长缓存 + 不变文件名
  location ~* \.(jpg|jpeg|png|gif|svg|css|js|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

或者用 `hexo-deployer-rsync` 自动化：

```bash
npm install --save hexo-deployer-rsync
```

```yml
deploy:
  type: rsync
  host: example.com
  user: deploy
  root: /var/www/blog/
  port: 22
  delete: true
  verbose: true
  ignore_errors: false
```

## 国际化（i18n）

Hexo 的 i18n 仅做**主题层文案翻译**——文章内容多语言需要自己组织目录。

### 主题翻译

**`themes/next/languages/zh-CN.yml`**：

```yml
menu:
  home: 首页
  archives: 归档
  tags: 标签
  categories: 分类

post:
  read_more: 阅读全文
  prev: 上一篇
  next: 下一篇
```

**`themes/next/languages/en.yml`**：

```yml
menu:
  home: Home
  archives: Archives
  tags: Tags
  categories: Categories

post:
  read_more: Read More
  prev: Previous
  next: Next
```

**模板中使用**：

```html
<a href="/">{{ __('menu.home') }}</a>
<!-- 渲染为 中文站：首页 / 英文站：Home -->
```

`__()` 函数自动按当前 locale 查表。

### 复数支持 `_p()`

```yml
# zh-CN.yml
post:
  comments: "{n} 条评论"
```

模板：

```html
{{ _p('post.comments', 5) }}
<!-- → "5 条评论" -->
```

### 文章 i18n

需要在 front matter 标注语言 + 用 `i18n_dir`：

```yml
# _config.yml
language:
  - zh
  - en
i18n_dir: :lang
```

**文件结构**：

```
source/
  _posts/
    zh/
      hello.md         # lang: zh
    en/
      hello.md         # lang: en
```

URL：`/zh/hello/` 与 `/en/hello/`。

## 性能优化

### 构建加速

文章超 500 篇时，构建会明显变慢——常见优化：

```bash
# 增量构建（监听变更，只重新生成变化的）
hexo g --watch

# 跳过特定渲染（CI 中）
hexo g --bail              # 遇错停止
```

`_config.yml` 加缓存：

```yml
# 注意：v8.x 改进了缓存机制，老配置可能已废弃
# db.json 缓存默认启用，遇到怪问题再 hexo clean
```

### 图片压缩

```bash
npm install --save hexo-renderer-imagemin
```

构建时自动压缩 `source/` 下所有 PNG / JPG / SVG。

### Gzip / Brotli 预压缩

```bash
npm install --save hexo-yam
```

`_config.yml`：

```yml
neat_enable: true
neat_html:
  enable: true
neat_css:
  enable: true
neat_js:
  enable: true
neat_gzip:
  enable: true
neat_brotli:
  enable: true
```

构建后会同时生成 `.gz` / `.br` 版本——nginx 可直接送预压缩文件。

## 常见陷阱

### Nunjucks 与 Markdown 冲突

正文中含 `&#123;&#123; var &#125;&#125;` 时会被 Nunjucks 解析。修复：

```md
{% raw %}
代码示例：{{ user.name }}
{% endraw %}
```

或 front matter 关闭：

```yml
disableNunjucks: true
```

### 文章中包含 `&#123;% xxx %&#125;` 字符

写 Jinja / Vue template 文章时常遇到——必须 `&#123;% raw %&#125;` 包裹。

### 中文 URL 出现 %E4%B8%AD%E6%96%87...

Hexo 默认不做 slug 化中文标题——可以：

1. 用 `permalink: :id/` 用纯数字
2. 装 `hexo-permalink-pinyin` 自动转拼音
3. 文章中 `permalink: english-title/` 手动指定

### `_drafts` 渲染了

`render_drafts: true` 会发布草稿——生产环境**务必**设 `false`。

### 主题升级后配置丢失

不要改 `themes/next/_config.yml`，应改项目根的 `_config.next.yml`——这样主题升级不影响。

### Deploy 时报 Authentication failed

GitHub 不允许 HTTPS 密码登录——必须用：

1. SSH key（推荐）：`repo: git@github.com:user/repo.git`
2. Personal Access Token：`repo: https://TOKEN@github.com/user/repo.git`

### EMFILE / 文件过多

```
Error: EMFILE: too many open files
```

macOS / Linux：

```bash
ulimit -n 10000
```

或永久改：`/etc/security/limits.conf`。

### 内存不足

文章太多时 Node 默认堆内存不够：

```bash
NODE_OPTIONS=--max-old-space-size=8192 hexo g
```

## 接下来读什么

- [参考](./reference.md)：CLI 命令全集 / `_config.yml` 字段速查 / Front matter 全表 / 模板变量 / Helper 函数 / 主流主题与插件清单
