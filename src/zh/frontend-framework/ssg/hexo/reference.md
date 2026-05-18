---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Hexo 8.x —— API 速查 / CLI 全集 / 配置字段 / 模板变量 / Helper 函数 / 主流主题与插件清单

## 包结构

| 包 | 用途 | 通常装在 |
|---|---|---|
| `hexo` | **核心引擎**（生成、模板、命令） | dependencies |
| `hexo-cli` | **命令行工具**（提供 `hexo` 命令） | 全局 / dependencies |
| `hexo-server` | 本地 dev server | dependencies |
| `hexo-renderer-marked` | Markdown 渲染器（默认） | dependencies |
| `hexo-renderer-pandoc` | Pandoc 渲染器（替代 marked） | dependencies |
| `hexo-renderer-kramed` | Kramed 渲染器（含数学） | dependencies |
| `hexo-renderer-stylus` | Stylus CSS 预处理 | dependencies |
| `hexo-renderer-nunjucks` | Nunjucks 模板引擎（默认） | dependencies |
| `hexo-renderer-ejs` | EJS 模板引擎 | dependencies |
| `hexo-renderer-pug` | Pug 模板引擎 | dependencies |
| `hexo-generator-index` | 首页生成器 | dependencies |
| `hexo-generator-archive` | 归档页生成器 | dependencies |
| `hexo-generator-category` | 分类页生成器 | dependencies |
| `hexo-generator-tag` | 标签页生成器 | dependencies |
| `hexo-generator-feed` | RSS / Atom feed 生成器 | dependencies |
| `hexo-generator-sitemap` | sitemap.xml 生成器 | dependencies |
| `hexo-generator-searchdb` | 搜索数据库生成器 | dependencies |
| `hexo-deployer-git` | Git 部署器 | dependencies |
| `hexo-deployer-rsync` | rsync 部署器 | dependencies |
| `hexo-deployer-sftp` | SFTP 部署器 | dependencies |
| `hexo-deployer-netlify` | Netlify 部署器 | dependencies |
| `hexo-symbols-count-time` | 字数统计 + 阅读时间 | dependencies |
| `hexo-tag-embed` | 嵌入媒体（YouTube/Vimeo/Gist 等） | dependencies |
| `hexo-fs` | 文件 IO 工具（插件开发用） | dependencies |
| `hexo-util` | 通用工具（插件开发用） | dependencies |
| `hexo-i18n` | i18n 工具（插件开发用） | dependencies |
| `hexo-pagination` | 分页生成工具（插件开发用） | dependencies |

## CLI 命令全集

通过 `hexo <command>` 调用——以下为完整命令清单。

### `hexo init`

初始化项目（克隆 hexo-starter 模板）。

```bash
hexo init [folder]
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `folder` | 当前目录 | 项目目录名 |
| `--no-install` | false | 跳过 npm install |
| `--clone` | false | 用 git clone 而非下载压缩包 |

```bash
hexo init blog                       # 初始化到 blog/
hexo init blog --no-install          # 不自动装依赖
```

### `hexo new`

创建新文章 / 页面 / 草稿。

```bash
hexo new [layout] <title>
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `layout` | `post` | 布局类型（`post` / `page` / `draft` / 自定义） |
| `title` | 必填 | 文章标题 |
| `--path` / `-p` | - | 自定义文章路径 |
| `--slug` / `-s` | - | 自定义文章 slug |
| `--replace` / `-r` | false | 同名时替换 |

```bash
hexo new "我的第一篇文章"             # post（默认）
hexo new page about                  # 独立页面 source/about/index.md
hexo new draft "正在写"               # 草稿 source/_drafts/正在写.md
hexo new post "文章" -p custom-path  # 自定义路径
```

### `hexo generate`

生成静态文件（简写 `hexo g`）。

```bash
hexo generate
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `--deploy` / `-d` | false | 生成后立即部署 |
| `--watch` / `-w` | false | 监听变更，增量构建 |
| `--force` / `-f` | false | 强制全量重建（无视 db.json 缓存） |
| `--bail` / `-b` | false | 遇错立即停止（CI 推荐） |
| `--concurrency` / `-c` | - | 并发数 |

```bash
hexo g                               # 普通构建
hexo g -d                            # 构建后部署
hexo g -wf                           # 监听 + 强制（开发用）
hexo g --bail                        # CI 中遇错停止
```

### `hexo server`

启动本地 dev server（简写 `hexo s`）。

```bash
hexo server
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `--port` / `-p` | 4000 | 端口 |
| `--ip` / `-i` | 0.0.0.0 | 绑定 IP |
| `--open` / `-o` | false | 自动打开浏览器 |
| `--log` / `-l` | - | 启用日志 |
| `--static` / `-s` | false | 仅服务 public/（生产模式） |
| `--draft` | false | 渲染草稿 |
| `--debug` | false | 调试模式 |

```bash
hexo s                               # 默认 4000
hexo s -p 5000                       # 改端口
hexo s -i 0.0.0.0 --open             # 局域网可访问 + 自动开浏览器
hexo s --draft                       # 临时启用草稿
hexo s -s                            # 静态模式（不监听变更）
```

### `hexo deploy`

部署网站（简写 `hexo d`）。

```bash
hexo deploy
```

| 参数 | 默认 | 说明 |
|---|---|---|
| `--generate` / `-g` | false | 部署前先生成 |
| `--silent` / `-S` | false | 隐藏 deployer 输出 |

```bash
hexo d                               # 部署 public/（必须先 g）
hexo d -g                            # 生成 + 部署
hexo clean && hexo d -g              # 万能组合
```

### `hexo clean`

清理缓存 + 生成文件。

```bash
hexo clean
# 删除 db.json + public/
```

**遇到怪问题时通用招式**——主题不显示 / 配置不生效 / 旧内容残留时都先 `hexo clean`。

### `hexo list`

列出所有路由 / 文章 / 页面等。

```bash
hexo list <type>
```

| `type` | 含义 |
|---|---|
| `post` | 所有文章 |
| `page` | 所有页面 |
| `route` | 所有生成的路由 |
| `tag` | 所有标签 |
| `category` | 所有分类 |

```bash
hexo list post                       # 列出所有文章
hexo list route                      # 列出所有路由（调试 URL 用）
```

### `hexo publish`

发布草稿（从 `_drafts/` 移到 `_posts/`，自动加日期）。

```bash
hexo publish [layout] <title>
```

```bash
hexo publish draft "正在写的草稿"
# 等价 mv source/_drafts/正在写的草稿.md source/_posts/正在写的草稿.md
# + 在 front matter 加当前 date
```

### `hexo render`

渲染单个文件（不通过完整生成流程）。

```bash
hexo render <file>
```

```bash
hexo render path/to/file.md --output output.html
```

参数：

| 参数 | 说明 |
|---|---|
| `--output` / `-o` | 输出文件路径 |
| `--engine` / `-e` | 指定渲染引擎 |
| `--pretty` / `-p` | 美化输出 |

### `hexo migrate`

从其他博客系统迁移。

```bash
hexo migrate <type> <source>
```

| `type` | 来源 | 需要装 |
|---|---|---|
| `wordpress` | WordPress XML 导出 | `hexo-migrator-wordpress` |
| `rss` | RSS feed | `hexo-migrator-rss` |
| `jekyll` | Jekyll | （手动迁移 + 改 `new_post_name`） |
| `joomla` | Joomla J2XML | `hexo-migrator-joomla` |
| `ghost` | Ghost JSON 导出 | `hexo-migrator-ghost` |
| `csv` | CSV 文件 | `hexo-migrator-csv` |

```bash
hexo migrate rss https://example.com/feed.xml
hexo migrate wordpress export.xml
```

### `hexo config`

操作 `_config.yml`。

```bash
hexo config [key]              # 查询
hexo config [key] [value]      # 设置
```

```bash
hexo config title              # 输出 title 字段
hexo config theme next         # 设置 theme: next
```

### `hexo version`

显示版本信息。

```bash
hexo version
# 或
hexo --version
# 输出：
# hexo: 8.1.0
# hexo-cli: 4.3.x
# os: ...
# node: 20.19.0
# v8: ...
# uv: ...
# ...
```

### 全局选项

任何命令都支持：

| 参数 | 说明 |
|---|---|
| `--config <files>` | 自定义配置文件（逗号分隔多个） |
| `--cwd <path>` | 自定义工作目录 |
| `--debug` | 启用调试日志 |
| `--draft` | 显式启用草稿渲染 |
| `--safe` | 安全模式（不加载插件） |
| `--silent` | 静默模式 |

```bash
hexo g --config _config.prod.yml,_config.cn.yml
# 用两个配置文件合并（后者覆盖前者）

hexo s --safe
# 不加载插件（调试主题问题时用）
```

## `_config.yml` 字段速查

### Site

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | string | - | 站点标题 |
| `subtitle` | string | `''` | 副标题 |
| `description` | string | `''` | SEO 描述 |
| `keywords` | string[] | `[]` | SEO 关键词 |
| `author` | string | - | 作者 |
| `language` | string \| string[] | `''` | 语言（多语言用数组） |
| `timezone` | string | 本机 | 时区（IANA 名） |

### URL

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `url` | string | - | 部署 URL（必填） |
| `root` | string | `/` | 根路径 |
| `permalink` | string | `:year/:month/:day/:title/` | URL 格式 |
| `permalink_defaults` | object | - | 占位符默认值 |
| `pretty_urls.trailing_index` | boolean | true | 保留 index.html |
| `pretty_urls.trailing_html` | boolean | true | 保留 .html 后缀 |

### Directory

| 字段 | 类型 | 默认 |
|---|---|---|
| `source_dir` | string | `source` |
| `public_dir` | string | `public` |
| `tag_dir` | string | `tags` |
| `archive_dir` | string | `archives` |
| `category_dir` | string | `categories` |
| `code_dir` | string | `downloads/code` |
| `i18n_dir` | string | `:lang` |
| `skip_render` | string[] | - |

### Writing

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `new_post_name` | string | `:title.md` | 新文章文件名 |
| `default_layout` | string | `post` | 默认 layout |
| `titlecase` | boolean | false | 标题转 Title Case |
| `external_link.enable` | boolean | true | 外链 target="_blank" |
| `external_link.field` | string | `site` | `site` / `all` |
| `external_link.exclude` | string \| string[] | - | 排除域名 |
| `filename_case` | number | 0 | 0 不变 / 1 小写 / 2 大写 |
| `render_drafts` | boolean | false | 渲染草稿 |
| `post_asset_folder` | boolean | false | 启用文章资源文件夹 |
| `relative_link` | boolean | false | 用相对链接 |
| `future` | boolean | true | 渲染未来日期文章 |
| `syntax_highlighter` | string | `highlight.js` | v7+：`highlight.js` / `prismjs` / `''` |
| `highlight` | object | - | highlight.js 配置 |
| `prismjs` | object | - | prismjs 配置 |

### Home Page

| 字段 | 类型 | 默认 |
|---|---|---|
| `index_generator.path` | string | `''` |
| `index_generator.per_page` | number | 10 |
| `index_generator.order_by` | string | `-date` |

### Category & Tag

| 字段 | 类型 | 默认 |
|---|---|---|
| `default_category` | string | `uncategorized` |
| `category_map` | object | - |
| `tag_map` | object | - |

### Date / Time

| 字段 | 类型 | 默认 |
|---|---|---|
| `date_format` | string | `YYYY-MM-DD` |
| `time_format` | string | `HH:mm:ss` |
| `updated_option` | string | `mtime`（`mtime` / `date` / `empty`） |

### Pagination

| 字段 | 类型 | 默认 |
|---|---|---|
| `per_page` | number | 10 |
| `pagination_dir` | string | `page` |

### Extensions

| 字段 | 类型 | 说明 |
|---|---|---|
| `theme` | string | 主题名 |
| `theme_config` | object | 内联主题配置（不推荐） |
| `deploy` | object \| object[] | 部署配置 |

### Metadata

| 字段 | 类型 | 默认 |
|---|---|---|
| `meta_generator` | boolean | true |

### Include / Exclude

| 字段 | 类型 | 说明 |
|---|---|---|
| `include` | string[] | 强制包含（覆盖默认 ignore 规则） |
| `exclude` | string[] | 排除（不渲染但保留） |
| `ignore` | string[] | 完全忽略（连读都不读） |

## Front Matter 字段速查

### Post（文章）

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | string | 文件名 | 标题 |
| `date` | datetime | 文件创建时间 | 发布时间 |
| `updated` | datetime | 文件 mtime | 修改时间 |
| `comments` | boolean | true | 启用评论 |
| `tags` | string[] | `[]` | 标签 |
| `categories` | string[] \| string[][] | `[]` | 分类（嵌套 = 层级） |
| `permalink` | string | 全局 `permalink` | 自定义 URL |
| `description` | string | - | SEO description |
| `keywords` | string | - | SEO keywords |
| `excerpt` | string | - | 手动摘要（最高优先级） |
| `layout` | string | `post` | 布局 |
| `lang` | string | 站点 language | i18n 语言 |
| `disableNunjucks` | boolean | false | 关闭 Nunjucks 解析 |
| `photos` | string[] | - | 关联图集 |
| `link` | string | - | 外链文章 |
| `toc` | boolean | 主题默认 | 显示 TOC |
| `mathjax` | boolean | 主题默认 | 启用数学公式 |
| `sticky` | number | - | 置顶权重（需插件） |
| `password` | string | - | 文章密码（需插件） |

### Page（独立页面）

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 页面标题 |
| `date` | datetime | 创建时间 |
| `updated` | datetime | 修改时间 |
| `permalink` | string | 自定义 URL |
| `description` | string | SEO |
| `keywords` | string | SEO |
| `layout` | string | 布局（默认 `page`） |
| `comments` | boolean | 启用评论 |

### Draft（草稿）

与 post 相同，但保存在 `source/_drafts/`，**默认不渲染**。

## Hexo 全局变量（模板内）

模板（`.njk` / `.ejs` / `.pug`）中可用的全局变量：

### `site`

| 字段 | 类型 | 说明 |
|---|---|---|
| `site.posts` | Query | 所有文章（链式 `.find()` / `.sort()` / `.toArray()`） |
| `site.pages` | Query | 所有独立页面 |
| `site.categories` | Query | 所有分类 |
| `site.tags` | Query | 所有标签 |
| `site.data.<filename>` | any | `source/_data/<filename>.yml/.json` 内容 |

Query 对象方法：

```js
site.posts.toArray()                   // 转数组
site.posts.find({ title: 'Hello' })    // 查询
site.posts.sort('date', -1)            // 排序（-1 降序）
site.posts.limit(5)                    // 限制数量
site.posts.skip(2)                     // 跳过前 N 条
site.posts.filter(p => p.title.includes('Vue'))
```

### `page`

按 layout 不同字段不同：

**所有页面**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `page.title` | string | 标题 |
| `page.date` | Moment | 发布时间 |
| `page.updated` | Moment | 修改时间 |
| `page.content` | string | HTML 正文 |
| `page.source` | string | 源文件路径 |
| `page.permalink` | string | 完整 URL |
| `page.path` | string | 相对路径 |
| `page.excerpt` | string | 摘要 |
| `page.more` | string | `<!-- more -->` 之后内容 |
| `page.prev` / `page.next` | object | 上/下篇 |

**文章 (post) 额外**：

| 字段 | 类型 |
|---|---|
| `page.published` | boolean |
| `page.categories` | Query |
| `page.tags` | Query |
| `page.photos` | string[] |
| `page.layout` | string |
| `page.comments` | boolean |

**首页 (index) 额外**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `page.per_page` | number | 每页文章数 |
| `page.total` | number | 总页数 |
| `page.current` | number | 当前页 |
| `page.current_url` | string | 当前 URL |
| `page.posts` | Query | 当前页文章 |
| `page.prev_link` | string | 上一页 URL |
| `page.next_link` | string | 下一页 URL |

**归档 (archive) 额外**：

| 字段 | 类型 |
|---|---|
| `page.year` | number |
| `page.month` | number |

**分类页 (category)**：

| 字段 | 类型 |
|---|---|
| `page.category` | string |

**标签页 (tag)**：

| 字段 | 类型 |
|---|---|
| `page.tag` | string |

### `config`

整个 `_config.yml` 的内容，所有字段都可访问：

```html
{{ config.title }}
{{ config.url }}
{{ config.language }}
{{ config.author }}
```

### `theme`

主题配置（`_config.[theme].yml` 或 `theme_config` 字段）：

```html
{{ theme.scheme }}
{{ theme.menu.home }}
```

### 其他

| 变量 | 含义 |
|---|---|
| `path` | 当前页面相对路径 |
| `url` | 当前页面完整 URL |
| `env` | Hexo 环境对象（含版本等） |

## Helper 函数全集

模板内可用的辅助函数。

### URL Helper

| 函数 | 用途 | 示例 |
|---|---|---|
| `url_for(path)` | 加 root 前缀的 URL | `&#123;&#123; url_for('/about') &#125;&#125;` → `/blog/about`（若 root=/blog/） |
| `full_url_for(path)` | 完整 URL（含域名） | → `https://example.com/blog/about` |
| `relative_url(from, to)` | 相对 URL | - |
| `gravatar(email, size)` | Gravatar 头像 URL | - |

### HTML 标签 Helper

| 函数 | 用途 |
|---|---|
| `css(path)` | 生成 `<link rel="stylesheet">` |
| `js(path)` | 生成 `<script src="...">` |
| `link_to(path, text, options)` | 生成 `<a>` |
| `mail_to(email, text)` | 生成 `<a href="mailto:...">` |
| `image_tag(path, attrs)` | 生成 `<img>` |
| `favicon_tag(path)` | 生成 favicon link |
| `feed_tag(path, attrs)` | 生成 RSS / Atom link |

### 条件 Helper

| 函数 | 用途 |
|---|---|
| `is_current(path)` | 是否当前页 |
| `is_home()` | 是否首页 |
| `is_post()` | 是否文章 |
| `is_page()` | 是否独立页面 |
| `is_archive()` | 是否归档页 |
| `is_year()` / `is_month()` | 年/月归档 |
| `is_category(name?)` | 是否分类页 |
| `is_tag(name?)` | 是否标签页 |

### 字符串 Helper

| 函数 | 用途 |
|---|---|
| `trim(string)` | 删除首尾空白 |
| `strip_html(string)` | 删除 HTML 标签 |
| `titlecase(string)` | 转 Title Case |
| `markdown(string)` | 渲染 Markdown |
| `truncate(text, options)` | 截断字符串 |
| `word_wrap(text, len)` | 换行 |
| `escape_html(string)` | HTML 转义 |

```html
{{ truncate(post.content, { length: 100, omission: '...' }) }}
```

### 日期 Helper

| 函数 | 用途 |
|---|---|
| `date(date, format?)` | 格式化日期 |
| `date_xml(date)` | XML 日期格式 |
| `time(date, format?)` | 格式化时间 |
| `full_date(date, format?)` | 完整日期时间 |
| `relative_date(date)` | 相对时间（如 "3 天前"） |
| `time_tag(date, format?)` | 生成 `<time>` 标签 |
| `moment` | 完整 moment.js 对象 |

```html
{{ date(post.date, 'YYYY-MM-DD') }}
{{ date(post.date, config.date_format) }}
{{ relative_date(post.date) }}
```

### 列表 Helper

| 函数 | 用途 |
|---|---|
| `list_categories(options?)` | 生成分类列表 |
| `list_tags(options?)` | 生成标签列表 |
| `list_archives(options?)` | 生成归档列表 |
| `list_posts(options?)` | 生成文章列表 |
| `tagcloud(tags?, options?)` | 标签云 |

```html
{{ list_categories({ orderby: 'name', show_count: false }) | safe }}
{{ tagcloud(site.tags, { min_font: 12, max_font: 30 }) | safe }}
```

### 分页 Helper

| 函数 | 用途 |
|---|---|
| `paginator(options)` | 生成分页器 HTML |

```html
{{ paginator({
  prev_text: '上一页',
  next_text: '下一页',
  mid_size: 2,
  show_all: false
}) | safe }}
```

### Number Helper

| 函数 | 用途 |
|---|---|
| `number_format(num, options)` | 千分位格式化 |

```html
{{ number_format(1234567.89, { precision: 2 }) }}
<!-- → 1,234,567.89 -->
```

### Open Graph / SEO Helper

| 函数 | 用途 |
|---|---|
| `open_graph(options?)` | 生成 OG / Twitter Card meta |
| `meta_generator()` | 生成 `<meta name="generator">` |
| `toc(string, options?)` | 生成 TOC |

```html
<head>
  {{ open_graph({
    image: 'https://example.com/og.png',
    site_name: config.title,
    twitter_card: 'summary_large_image'
  }) | safe }}
</head>
```

### Partial Helper

| 函数 | 用途 |
|---|---|
| `partial(name, locals?, options?)` | 渲染 partial 模板 |
| `fragment_cache(id, fn)` | 缓存片段 |

```html
{{ partial('_partial/header', { customTitle: '首页' }) }}

{{ fragment_cache('sidebar', () => {
  // 复杂计算
  return '<div class="sidebar">...</div>'
}) }}
```

### i18n Helper

| 函数 | 用途 |
|---|---|
| `__(path, ...args)` | 翻译字符串 |
| `_p(path, count, ...args)` | 复数翻译 |

```html
{{ __('menu.home') }}
{{ _p('post.comments', 5) }}
```

## 内置 Tag Plugins 速查

| 标签 | 用途 |
|---|---|
| `&#123;% blockquote author, source title %&#125;...&#123;% endblockquote %&#125;` | 带作者引用 |
| `&#123;% quote %&#125;...&#123;% endquote %&#125;` | 引用简写 |
| `&#123;% codeblock lang:js %&#125;...&#123;% endcodeblock %&#125;` | 代码块 |
| `&#123;% code %&#125;...&#123;% endcode %&#125;` | 代码块（别名） |
| `&#123;% include_code [args] file %&#125;` | 嵌入外部代码 |
| `&#123;% pullquote %&#125;...&#123;% endpullquote %&#125;` | 着重引用 |
| `&#123;% iframe url width height %&#125;` | iframe 嵌入 |
| `&#123;% img [class] url [width] [height] [alt] [title] %&#125;` | 图片 |
| `&#123;% link text url [external] [title] %&#125;` | 链接 |
| `&#123;% asset_img name [title] %&#125;` | 文章资源图片 |
| `&#123;% asset_link name [title] %&#125;` | 文章资源链接 |
| `&#123;% asset_path name %&#125;` | 文章资源路径 |
| `&#123;% raw %&#125;...&#123;% endraw %&#125;` | 跳过 Nunjucks 解析 |
| `&#123;% url_for path %&#125;` | URL 辅助（v6+） |
| `&#123;% full_url_for path %&#125;` | 完整 URL 辅助（v6+） |

**v7.0 已废弃**（迁移到 `hexo-tag-embed`）：

- `&#123;% youtube %&#125;`
- `&#123;% vimeo %&#125;`
- `&#123;% jsfiddle %&#125;`
- `&#123;% gist %&#125;`

## 主流主题清单

按 GitHub star 数 + 中文圈活跃度排序：

| 主题 | 风格 | 特点 | GitHub |
|---|---|---|---|
| **NexT** | 简约 / 现代 | **中文圈第一选择**，4 个 scheme，搜索 / 评论 / 数学公式 / 暗黑模式齐全 | [next-theme/hexo-theme-next](https://github.com/next-theme/hexo-theme-next) |
| **Butterfly** | 美观 / 多功能 | 卡片化设计，自定义高度高，社区维护积极 | [jerryc127/hexo-theme-butterfly](https://github.com/jerryc127/hexo-theme-butterfly) |
| **Fluid** | 现代 / 流体 | Material Design 风格，配色优美 | [fluid-dev/hexo-theme-fluid](https://github.com/fluid-dev/hexo-theme-fluid) |
| **Icarus** | 多栏 | Bulma CSS，强大定制能力 | [ppoffice/hexo-theme-icarus](https://github.com/ppoffice/hexo-theme-icarus) |
| **Volantis** | 简洁 | 动效流畅，开发者友好 | [volantis-x/hexo-theme-volantis](https://github.com/volantis-x/hexo-theme-volantis) |
| **Landscape** | 极简 | Hexo **官方默认**主题，简洁但不太美观 | [hexojs/hexo-theme-landscape](https://github.com/hexojs/hexo-theme-landscape) |
| **Anatole** | 文艺 | 灵感来自 Farbox Theme Pure | [Ben02/hexo-theme-Anatole](https://github.com/Ben02/hexo-theme-Anatole) |
| **Yilia** | 单页 | 国人开发，单页响应式 | [litten/hexo-theme-yilia](https://github.com/litten/hexo-theme-yilia) |
| **Stellar** | 现代 | Astro-like 设计，文档与博客兼顾 | [xaoxuu/hexo-theme-stellar](https://github.com/xaoxuu/hexo-theme-stellar) |
| **Cards** | 卡片 | 极简卡片流 | - |

## 主流插件清单

### 渲染器

| 包 | 用途 |
|---|---|
| `hexo-renderer-marked` | Markdown（默认） |
| `hexo-renderer-pandoc` | Pandoc（学术写作） |
| `hexo-renderer-kramed` | Kramed（marked 派生） |
| `hexo-renderer-markdown-it` | markdown-it（更多扩展） |
| `hexo-renderer-stylus` | Stylus CSS |
| `hexo-renderer-sass` | Sass / SCSS |
| `hexo-renderer-nunjucks` | Nunjucks（默认） |
| `hexo-renderer-ejs` | EJS |
| `hexo-renderer-pug` | Pug |

### 生成器

| 包 | 用途 |
|---|---|
| `hexo-generator-index` | 首页（默认装） |
| `hexo-generator-archive` | 归档（默认装） |
| `hexo-generator-category` | 分类（默认装） |
| `hexo-generator-tag` | 标签（默认装） |
| `hexo-generator-feed` | RSS / Atom |
| `hexo-generator-sitemap` | sitemap.xml |
| `hexo-generator-searchdb` | 搜索数据库（NexT 等主题用） |
| `hexo-generator-search` | 类似 searchdb，不同格式 |
| `hexo-generator-index-pin-top` | 文章置顶（`sticky` 字段） |
| `hexo-generator-json-content` | JSON 数据（供 SPA / 搜索用） |
| `hexo-generator-baidu-sitemap` | 百度专用 sitemap |

### 部署器

| 包 | 用途 |
|---|---|
| `hexo-deployer-git` | **GitHub Pages / GitLab Pages**（最常用） |
| `hexo-deployer-rsync` | rsync 到自建服务器 |
| `hexo-deployer-sftp` | SFTP |
| `hexo-deployer-ftpsync` | FTP |
| `hexo-deployer-netlify` | Netlify |
| `hexo-deployer-heroku` | Heroku |
| `hexo-deployer-openshift` | OpenShift |
| `hexo-deployer-cos` | 腾讯云 COS |
| `hexo-deployer-oss` | 阿里云 OSS |

### 过滤器 / 增强

| 包 | 用途 |
|---|---|
| `hexo-filter-nofollow` | 外链自动 rel="nofollow" |
| `hexo-filter-cleanup-html` | 清理 HTML 空白 |
| `hexo-filter-mathjax` | 数学公式支持 |
| `hexo-filter-flowchart` | 流程图 |
| `hexo-filter-mermaid-diagrams` | Mermaid 流程图 |
| `hexo-filter-prismjs-all-line-numbers` | PrismJS 行号增强 |

### 统计 / SEO

| 包 | 用途 |
|---|---|
| `hexo-symbols-count-time` | 字数 + 阅读时间 |
| `hexo-wordcount` | 字数统计 |
| `hexo-related-popular-posts` | 相关 / 热门文章 |
| `hexo-abbrlink` | 短链接（避免中文 URL 编码） |
| `hexo-permalink-pinyin` | 中文转拼音 URL |
| `hexo-helper-live2d` | Live2D 看板娘 |

### 评论 / 互动

| 包 | 用途 |
|---|---|
| `valine` | LeanCloud 评论 |
| `@waline/client` | Waline（Valine 升级版） |
| `twikoo` | 腾讯云函数评论 |
| `gitalk` | GitHub Issues 评论 |
| `utterances` | GitHub Issues 评论 |

### 图床 / CDN

| 包 | 用途 |
|---|---|
| `hexo-yam` | gzip + brotli 预压缩 |
| `hexo-renderer-imagemin` | 图片自动压缩 |
| `hexo-lazyload-image` | 图片懒加载 |
| `hexo-asset-image` | 图片相对路径（v8 已被原生支持替代） |

### 迁移工具

| 包 | 用途 |
|---|---|
| `hexo-migrator-wordpress` | WordPress |
| `hexo-migrator-rss` | RSS feed |
| `hexo-migrator-joomla` | Joomla |
| `hexo-migrator-ghost` | Ghost |
| `hexo-migrator-csv` | CSV |

### 开发工具

| 包 | 用途 |
|---|---|
| `hexo-fs` | 文件 IO 工具（插件开发） |
| `hexo-util` | 通用工具（插件开发） |
| `hexo-i18n` | i18n（插件开发） |
| `hexo-pagination` | 分页工具（插件开发） |
| `hexo-cli` | 命令行工具 |
| `hexo-server` | 本地 dev server |

## 文件约定

| 路径 | 用途 | 必需 |
|---|---|---|
| `_config.yml` | 站点核心配置 | ✅ |
| `_config.[theme].yml` | 主题独立配置（v6.0+ 推荐） | 可选 |
| `package.json` | 依赖 | ✅ |
| `scaffolds/` | 文章脚手架模板 | ✅ |
| `scaffolds/post.md` | 文章模板 | ✅ |
| `scaffolds/page.md` | 页面模板 | ✅ |
| `scaffolds/draft.md` | 草稿模板 | ✅ |
| `source/` | 源内容目录 | ✅ |
| `source/_posts/` | 正式文章 | ✅ |
| `source/_drafts/` | 草稿（默认不渲染） | 可选 |
| `source/_data/` | 数据文件（YAML / JSON） | 可选 |
| `source/images/` | 全局图片（约定，非强制） | 可选 |
| `source/CNAME` | GitHub Pages 自定义域名 | 可选 |
| `themes/<theme>/` | 主题目录 | ✅ |
| `public/` | 构建输出（gitignore） | 自动生成 |
| `db.json` | 数据库缓存（gitignore） | 自动生成 |
| `node_modules/` | 依赖（gitignore） | 自动生成 |

## Permalink 占位符速查

| 占位符 | 含义 | 示例 |
|---|---|---|
| `:year` | 4 位年 | 2026 |
| `:month` | 2 位月（零填充） | 05 |
| `:day` | 2 位日（零填充） | 18 |
| `:hour` | 2 位时 | 14 |
| `:minute` | 2 位分 | 30 |
| `:second` | 2 位秒 | 25 |
| `:title` | 文章 title（slugified） | hello-world |
| `:post_title` | 原标题（不 slugified） | Hello World |
| `:name` | 文件名（不含扩展） | hello-world |
| `:category` | 分类层级（多层用 `/`） | tech/frontend |
| `:id` | 文章自增 ID | 5 |
| `:hash` | 文件名 + 日期的 SHA1 前 12 位 | abc1234... |
| `:timestamp` | UNIX 时间戳 | 1715000000 |
| `:i18n` | i18n 语言 | zh / en |
| `:lang` | i18n 语言（同 `:i18n`） | zh |

**保留**（不可用）：

- `:path`
- `:permalink`

## 模板引擎对照

| 引擎 | 后缀 | 变量语法 | 控制流 | 包 |
|---|---|---|---|---|
| **Nunjucks**（默认） | `.njk` / `.html` | `&#123;&#123; var &#125;&#125;` | `&#123;% if %&#125;...&#123;% endif %&#125;` | `hexo-renderer-nunjucks` |
| EJS | `.ejs` | `<%= var %>` | `<% if (x) { %>` | `hexo-renderer-ejs` |
| Pug | `.pug` | `#{var}` | 缩进控制 | `hexo-renderer-pug` |

## Deployer 配置全表

### Git

```yml
deploy:
  type: git
  repo: <repo_url>                   # 必填
  branch: gh-pages                    # 默认 gh-pages（用户主页用 main）
  message: 'Update'                   # 提交消息
  name: 'John Doe'                    # commit author
  email: 'john@example.com'           # commit email
  token: ''                           # PAT（替代 SSH key）
  extend_dirs: []                     # 额外提交的目录
  ignore_hidden:                      # 是否提交隐藏文件
    public: true
  ignore_pattern:                     # 忽略文件 glob
    public:
      - .DS_Store
```

### Rsync

```yml
deploy:
  type: rsync
  host: example.com
  user: deploy
  root: /var/www/blog/
  port: 22
  delete: true                        # --delete
  args: '--rsh "ssh -p 22"'
  verbose: true
  ignore_errors: false
```

### SFTP

```yml
deploy:
  type: sftp
  host: example.com
  user: deploy
  pass: ''                            # 或用 privateKey
  remotePath: /var/www/blog/
  port: 22
  privateKey: ~/.ssh/id_rsa
  passphrase: ''
  agent: ''
```

### FTPSync

```yml
deploy:
  type: ftpsync
  host: ftp.example.com
  user: user
  pass: password
  remote: /
  port: 21
  ignore: []
  connections: 1
  verbose: false
```

### Heroku

```yml
deploy:
  type: heroku
  repo: <heroku_git_url>
  message: 'Site updated'
```

### Netlify

```yml
deploy:
  type: netlify
  token: <netlify_personal_access_token>
  site_id: <site_id>                  # 或 site_name
  dir: public
  draft: false
```

## 升级路径

### Hexo 7.x → 8.x

主要变更：

- **Node.js 16/18 → 20.19+**
- ESM 完整支持
- 多个内部包升级
- 部分 API 废弃

升级步骤：

```bash
# 1. 升级 Node
nvm install 20 && nvm use 20

# 2. 升级 hexo-cli
npm install -g hexo-cli@latest

# 3. 升级项目依赖
npm install --save hexo@latest
npm update                            # 升级其他插件
```

### Hexo 6.x → 7.x

- 移除内置 `youtube` / `vimeo` / `jsfiddle` / `gist` 标签（迁到 `hexo-tag-embed`）
- 新增 `syntax_highlighter` 配置字段（替代 `highlight.enable` / `prismjs.enable`）

### Hexo 5.x → 6.x

- 默认模板引擎 Swig → Nunjucks（语法兼容度高，多数主题无需改）

### Hexo 4.x → 5.x

- 移除全局 Lodash 变量
- moment.js 升级
- 多个 deprecated API 移除

## 调试技巧

### 详细日志

```bash
hexo s --debug
hexo g --debug
# 输出所有内部步骤
```

### 安全模式

```bash
hexo s --safe
# 不加载插件，方便定位问题来源
```

### 查看路由

```bash
hexo list route
# 列出所有生成的 URL
```

### 查看变量

模板里临时输出：

```html
<pre>{{ page | dump | safe }}</pre>
<!-- 输出 page 对象的 JSON -->
```

或：

```html
{{ JSON.stringify(page, null, 2) }}
```

### 强制重建

```bash
hexo clean && hexo g
# 或
hexo g --force
```

### Bench（性能分析）

```bash
NODE_ENV=production time hexo g
# 看构建总耗时
```

## 命名约定

| 实体 | 约定 |
|---|---|
| 站点目录 | `kebab-case`（`my-blog`） |
| 文章文件名 | `kebab-case.md` 或 `YYYY-MM-DD-title.md` |
| 分类 / 标签 | 任意（含中文） |
| 主题名 | `kebab-case`（`next` / `butterfly`） |
| 插件名 | `hexo-<type>-<name>`（`hexo-deployer-git`） |
| Front matter 字段 | `camelCase` 或 `snake_case`（标准字段用 snake_case） |
| 数据文件 | `kebab-case.yml` / `.json` |
| 模板文件 | `kebab-case.njk` / `index.njk` |
| Partial | `_kebab-case.njk` 或 `_partial/header.njk` |

## 性能基准（参考）

| 文章数 | Hexo 8.x（默认 marked） | Hugo 0.x | VitePress 1.x |
|---|---|---|---|
| 100 | ~3-5 秒 | <1 秒 | ~2 秒 |
| 500 | ~15-30 秒 | ~2 秒 | ~10 秒 |
| 1000 | ~60-120 秒 | ~5 秒 | ~30 秒 |
| 5000 | ~10-15 分钟 | ~30 秒 | ~3-5 分钟 |

> 数据为粗略估算，受文章长度 / 图片数量 / 插件数量影响极大。**500 篇以下**任何 SSG 都很快，**1000 篇以上**才有明显差异。
