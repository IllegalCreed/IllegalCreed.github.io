---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Eleventy 3.x（v3.1.5 稳定）。覆盖配置文件、模板语言、Layouts、Permalinks、Collections、Data Cascade、Filters、Shortcodes、官方插件、WebC、Image 优化、Incremental Builds、Pagination、i18n、部署等核心实战内容。

## 配置文件

### 配置文件名（优先级）

Eleventy 按以下顺序查找配置文件：

1. `.eleventy.js`（v1.x 默认）
2. `eleventy.config.js`（v2.0.0+）
3. `eleventy.config.mjs`（v3.0.0+，**推荐**）
4. `eleventy.config.cjs`（v2.0.0+）

**找到第一个即停止**，其他被忽略。**3.x 起官方文档全部使用 `eleventy.config.mjs`**。

### 基础结构

**ESM 风格**（推荐）：

```js
// eleventy.config.mjs
/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
  // 注册 filters / shortcodes / collections / plugins ...

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",     // 如果不设，默认 = includes
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "md", "njk", "11ty.js", "webc"],
    pathPrefix: "/",
  };
}
```

**CommonJS 风格**（兼容老项目）：

```js
// .eleventy.js
module.exports = async function (eleventyConfig) {
  // ... 同上
  return {
    dir: { input: "src", output: "_site" },
  };
};
```

### 用配置方法替代 return（v3.0.0+）

3.x 起推荐用方法替代返回对象：

```js
export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setDataDirectory("_data");
  eleventyConfig.setTemplateFormats(["html", "md", "njk"]);
}
```

两种风格可混用，但**建议项目内统一一种风格**。

## 模板语言深度

### 推荐组合：Markdown + Nunjucks

**90% 项目的最佳选择**：

```js
return {
  markdownTemplateEngine: "njk",  // .md 先用 Nunjucks 预处理，再渲染 Markdown
  htmlTemplateEngine: "njk",      // .html 用 Nunjucks 处理
};
```

为什么 Nunjucks > Liquid：

- **宏（macro）**：Nunjucks 有 `{% macro %}` 可定义可复用模板片段
- **继承**：`{% extends %}` + `{% block %}` 比 Liquid 灵活
- **过滤器更多**：Nunjucks 内置 `safe` / `default` / `escape` / `length` 等
- **JavaScript 友好**：Eleventy 内部就是 Nunjucks（Mozilla 出品）

### Markdown 渲染器

Eleventy 默认用 **markdown-it**——可以注入插件：

```js
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

export default function (eleventyConfig) {
  const md = markdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink(),
    });

  eleventyConfig.setLibrary("md", md);
}
```

### Liquid 引擎

`.liquid` 文件 + Markdown 默认引擎都是 Liquid。语法：

```liquid
<h1>{{ title }}</h1>

{% if user %}
  <p>Hello, {{ user.name }}</p>
{% endif %}

{% for item in items %}
  <li>{{ item }}</li>
{% endfor %}

<!-- 过滤器 -->
{{ name | upcase }}
{{ date | date: "%Y-%m-%d" }}
```

### Nunjucks 引擎

`.njk` 文件 + 推荐用作 layouts：

```njk
{% extends "base.njk" %}

{% block content %}
  <h1>{{ title }}</h1>
  {% for post in collections.post %}
    <article>
      <h2>{{ post.data.title }}</h2>
      {{ post.content | safe }}
    </article>
  {% endfor %}
{% endblock %}
```

**Nunjucks 宏**：

```njk
{# src/_includes/macros.njk #}
{% macro postCard(post) %}
<article class="card">
  <a href="{{ post.url }}">
    <h3>{{ post.data.title }}</h3>
    <p>{{ post.data.excerpt }}</p>
  </a>
</article>
{% endmacro %}
```

使用：

```njk
{% from "macros.njk" import postCard %}
{% for post in collections.post %}
  {{ postCard(post) }}
{% endfor %}
```

### 11ty.js（程序化生成）

任何 `*.11ty.js` 文件都可以**通过 JavaScript 生成内容**——这是最灵活的方式：

```js
// src/dynamic.11ty.js
export default class {
  data() {
    return {
      title: "Dynamic Page",
      layout: "base.njk",
      permalink: "/dynamic/",
    };
  }

  render(data) {
    return `
      <h1>${data.title}</h1>
      <p>构建时间：${new Date().toISOString()}</p>
    `;
  }
}
```

**适用场景**：

- 需要复杂逻辑 / 计算的页面
- 从远程 API fetch 的动态页面
- 程序化生成多个页面（结合 pagination）

### 多引擎混用 / Override

front matter 里用 `templateEngineOverride` 切换：

```md
---
title: 这个 MD 不用 Nunjucks 解析
templateEngineOverride: md
---

{{ 这里 }} 会原样输出
```

或者**完全禁用模板解析**：

```md
---
templateEngineOverride: false
---

{{ 完全不解析 }}
```

## Front matter 全表

### 内置字段

| 字段 | 类型 | 作用 |
|---|---|---|
| `title` | string | 页面标题 |
| `date` | string \| `Created` \| `Last Modified` \| `git Created` \| `git Last Modified` | 日期（影响 collection 排序） |
| `layout` | string | 关联 layout 文件 |
| `tags` | string \| string[] | 用于 collections 分组 |
| `permalink` | string \| false | 自定义 URL（false = 不输出文件） |
| `eleventyExcludeFromCollections` | boolean \| string[] | 排除出 collections（true 全排除 / 数组指定 tag） |
| `eleventyImport` | object | 声明 collection 依赖（用于增量构建） |
| `templateEngineOverride` | string \| false | 覆盖默认模板引擎 |
| `eleventyComputed` | object | 计算属性（基于其他数据动态生成） |
| `dataExtension` | object | （v3.0+）扩展数据文件类型 |

### 自定义字段

任何字段都能自定义，在模板里通过同名变量访问：

```md
---
title: 文章
author: IllegalCreed
tags:
  - vue
  - tutorial
---

<p>作者：{{ author }}</p>
<p>标签：{{ tags | join(", ") }}</p>
```

### 日期字段

`date` 字段支持多种格式：

```yml
date: 2026-05-18                       # YAML 日期对象
date: "2026-05-18"                     # 字符串
date: 2026-05-18T14:30:00              # 带时间
date: Last Modified                    # 文件修改时间（mtime）
date: Created                          # 文件创建时间（ctime）
date: git Created                      # Git 首次提交时间
date: git Last Modified                # Git 最后提交时间
```

> **重要**：YAML 中**模板语法必须用引号**：
>
> ```yml
> # ❌ 错误（YAML 报错）
> permalink: /posts/{{ page.fileSlug }}/
>
> # ✅ 正确
> permalink: "/posts/{{ page.fileSlug }}/"
> ```

## Layouts + 继承

### 基础 layout

```njk
<!-- src/_includes/base.njk -->
<!doctype html>
<html lang="{{ site.lang or 'zh-CN' }}">
<head>
  <meta charset="utf-8">
  <title>{{ title }} - {{ site.title }}</title>
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  <header>
    <nav>
      {% for item in nav.items %}
        <a href="{{ item.url }}">{{ item.text }}</a>
      {% endfor %}
    </nav>
  </header>
  <main>
    {{ content | safe }}
  </main>
  <footer>
    <p>&copy; {{ site.year }} {{ site.author }}</p>
  </footer>
</body>
</html>
```

### Layout 链式继承

`post.njk` 可以继承 `base.njk`——形成嵌套：

```njk
<!-- src/_includes/post.njk -->
---
layout: base.njk
---

<article>
  <h1>{{ title }}</h1>
  <time>{{ page.date | date: "%Y-%m-%d" }}</time>
  <div class="content">
    {{ content | safe }}
  </div>
  <p>标签：{{ tags | join(", ") }}</p>
</article>
```

然后博客文章用：

```md
---
title: 文章
layout: post.njk
tags: post
---

正文……
```

**继承链**：`first.md` → `post.njk` → `base.njk`，三层嵌套。

### Layout aliases

如果不想每次都写完整文件名 `post.njk`，可以加 alias：

```js
// eleventy.config.mjs
export default function (eleventyConfig) {
  eleventyConfig.addLayoutAlias("post", "post.njk");
  eleventyConfig.addLayoutAlias("page", "base.njk");
}
```

然后 front matter 里直接写：

```yml
---
layout: post           # 等价于 layout: post.njk
---
```

### Nunjucks 风格的 extends + block

如果你更熟悉 Django / Jinja 风格——可以用 `{% extends %}` 而非 Eleventy 的 `layout: xxx`：

```njk
<!-- src/_includes/base.njk -->
<!doctype html>
<html>
<head>
  <title>{% block title %}默认{% endblock %}</title>
</head>
<body>
  {% block content %}{% endblock %}
</body>
</html>
```

```njk
<!-- src/post.njk -->
{% extends "base.njk" %}

{% block title %}文章页{% endblock %}

{% block content %}
  <h1>这里是文章</h1>
{% endblock %}
```

> **两种风格可混用**，但建议项目内选一种统一。`layout: xxx` 是 Eleventy 推荐方式（更利于 Data Cascade）。

## Permalinks 深度

### 默认 URL 规则

```
源文件                         → URL              → 输出
src/index.md                  → /                 → _site/index.html
src/about.md                  → /about/           → _site/about/index.html
src/posts/hello.md            → /posts/hello/     → _site/posts/hello/index.html
src/posts/index.md            → /posts/           → _site/posts/index.html
```

「**Cool URI**」：所有非 `index.*` 文件**自动包裹 + `/index.html`**——URL 永远不带 `.html`。

### 自定义 permalink

```md
---
permalink: /custom-path/
---
```

输出到 `_site/custom-path/index.html`，URL `/custom-path/`。

### 输出非 HTML 文件

```md
---
permalink: /sitemap.xml
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset>
...
</urlset>
```

输出到 `_site/sitemap.xml`，**不会**被包裹进 `sitemap.xml/index.html`——文件名带扩展即按原样输出。

### 用模板变量

```md
---
title: My Post
date: 2026-05-18
permalink: "/blog/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}/"
---
```

`page.date` 是 JavaScript Date 对象，`page.fileSlug` 是不带扩展名的文件名（如 `hello`）。

### 用 slugify filter

```md
---
title: My Awesome Post!
permalink: "/posts/{{ title | slugify }}/"
---
```

输出 `/posts/my-awesome-post/`。

### Permalink: false（不输出文件）

```md
---
title: 数据页（仅用于 collections）
permalink: false
---
```

这个文件**不会生成 HTML**，但仍然出现在 `collections.all`、`collections.post` 中——常用于「**只为 collection 提供数据**」的场景。

### 目录数据集中配置 permalink

最常见做法——所有 `posts/` 下文件用同一规则：

```json
// src/posts/posts.json
{
  "layout": "post",
  "tags": "post",
  "permalink": "/posts/{{ page.fileSlug }}/"
}
```

这样 `posts/*.md` 不需要单独写 permalink。

## Collections 高级用法

### Tag-based collection

最简单的方式——给文章打 tag：

```md
---
tags: post
---
```

自动生成 `collections.post`——包含所有带 `tags: post` 的文件。

### 多个 tag

```md
---
tags:
  - post
  - tutorial
  - vue
---
```

这篇文章会同时出现在 `collections.post` / `collections.tutorial` / `collections.vue` 三个 collection 中。

### 排除 collections

```md
---
title: 关于
permalink: /about/
eleventyExcludeFromCollections: true
---
```

不会出现在**任何** collection（包括 `collections.all`）。

只排除特定 tag：

```md
---
tags: post
eleventyExcludeFromCollections: ["post"]
---
```

仍然在 `collections.all` 中，但不在 `collections.post`。

### 自定义 collection（addCollection）

如果 tag-based 不够灵活——用 `addCollection`：

```js
// eleventy.config.mjs
export default function (eleventyConfig) {
  // 按年份分组的 collection
  eleventyConfig.addCollection("postsByYear", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("post");
    const groups = {};
    for (const post of posts) {
      const year = post.date.getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    }
    return groups;
  });

  // 按标签数量排序
  eleventyConfig.addCollection("popularPosts", (collectionApi) => {
    return collectionApi.getFilteredByTag("post")
      .sort((a, b) => (b.data.tags?.length || 0) - (a.data.tags?.length || 0))
      .slice(0, 10);
  });

  // 按目录筛选
  eleventyConfig.addCollection("tutorials", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/tutorials/**/*.md");
  });
}
```

### Collection API 方法

| 方法 | 作用 |
|---|---|
| `getAll()` | 获取所有 collection items（包括无 tag 的） |
| `getAllSorted()` | 按 date 升序排列 |
| `getFilteredByTag(tag)` | 按 tag 筛选 |
| `getFilteredByTags(...tags)` | 多 tag 同时存在 |
| `getFilteredByGlob(glob)` | 按 glob 模式筛选文件路径 |

### Collection item 数据结构

每个 collection item：

```js
{
  page: {
    url: "/posts/hello/",
    inputPath: "./src/posts/hello.md",
    outputPath: "./_site/posts/hello/index.html",
    fileSlug: "hello",
    filePathStem: "/posts/hello",
    date: Date,
    lang: "zh",
  },
  data: {
    title: "...",
    tags: ["post"],
    layout: "post.njk",
    // ... 所有 front matter + Data Cascade
  },
  content: "<p>渲染后的 HTML（不含 layout）</p>",
  rawInput: "原始模板源码",  // v3.0+
  url: "/posts/hello/",
  date: Date,
}
```

### eleventyImport 声明（v3.0+ 增量构建优化）

```md
---
layout: base.njk
eleventyImport:
  collections: ["post"]
---

<!-- 这个页面用了 collections.post，告诉 11ty 当 post collection 变化时重建本页 -->
{% for post in collections.post %}
  ...
{% endfor %}
```

没有这个声明时，**增量构建不知道这个页面依赖 collection**——可能漏更新。

## Data Cascade 5 层

Eleventy 的**核心机制**——同一变量从 7 个来源合并，**优先级从低到高**：

```
1. Global Data Files          → _data/site.json
2. Configuration Global Data  → addGlobalData("key", value)
3. Front Matter in Layouts    → layout 文件的 front matter
4. Directory Data Files       → posts/posts.json
5. Template Data Files        → posts/hello.json（与模板同名）
6. Front Matter in Templates  → 模板自己的 front matter
7. Computed Data              → eleventyComputed
```

**冲突时高优先级覆盖低优先级**——但**深合并**：对象 / 数组**默认合并**（除非用 `override:` 前缀）。

### 1. Global Data Files（`_data/*`）

```json
// src/_data/site.json
{ "title": "我的博客", "url": "https://example.com" }
```

所有模板都能用 <span v-pre>`{% raw %}{{ site.title }}{% endraw %}`</span>。

### 2. Configuration Global Data

```js
// eleventy.config.mjs
export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("site", {
    title: "覆盖了 _data/site.json",
    builtAt: new Date(),
  });

  // 异步数据
  eleventyConfig.addGlobalData("posts", async () => {
    const res = await fetch("https://api.example.com/posts");
    return res.json();
  });

  // 嵌套路径
  eleventyConfig.addGlobalData("site.author", "IllegalCreed");
}
```

### 3. Front Matter in Layouts

```njk
<!-- src/_includes/base.njk -->
---
defaultColor: blue
---
<html>...</html>
```

继承该 layout 的所有页面都能用 <span v-pre>`{% raw %}{{ defaultColor }}{% endraw %}`</span>。

### 4. Directory Data Files

```json
// src/posts/posts.json   ← 文件名 = 目录名
{
  "layout": "post",
  "tags": "post",
  "permalink": "/posts/{{ page.fileSlug }}/"
}
```

应用于 `posts/` 目录下**所有**文件——以及**子目录**（递归继承）。

也可以用 JS：

```js
// src/posts/posts.11tydata.js
export default {
  layout: "post",
  tags: ["post"],
  permalink: function (data) {
    return `/posts/${data.page.fileSlug}/`;
  },
};
```

### 5. Template Data Files

```json
// src/posts/hello.json
{
  "author": "IllegalCreed",
  "specialClass": "featured"
}
```

应用于 `src/posts/hello.md`——**仅这一个文件**。

### 6. Front Matter in Templates

```md
---
title: 文章
tags: post
author: IllegalCreed
---
```

**最常见的数据来源**，优先级很高（但不是最高）。

### 7. Computed Data（最高优先级）

```md
---
title: 文章
date: 2026-05-18
eleventyComputed:
  slug: "{{ title | slugify }}"
  permalink: "/blog/{{ page.date | date: '%Y' }}/{{ slug }}/"
---
```

或在目录数据 / 全局数据中：

```js
// src/posts/posts.11tydata.js
export default {
  eleventyComputed: {
    // 基于 title 计算 slug
    slug: (data) => data.title.toLowerCase().replace(/\s+/g, "-"),
    // 基于 date 计算年份
    year: (data) => data.date.getFullYear(),
  },
};
```

> **注意**：computed data 在所有其他数据合并后运行——所以可以用任何已合并的数据。

### Deep Merge vs Override

默认所有对象 / 数组**深合并**：

```yaml
# directory data
tags:
  - post
```

```yaml
# template front matter
tags:
  - tutorial
```

合并结果：`tags: ["post", "tutorial"]`。

如果要**覆盖**而非合并——用 `override:` 前缀：

```yaml
override:tags:
  - only-this-tag
```

合并结果：`tags: ["only-this-tag"]`（清空了继承的 `post`）。

## Filters

Filters 是「**转换数据**」的函数——可以在 Liquid / Nunjucks / 11ty.js 模板中链式调用。

### addFilter（通用）

```js
// eleventy.config.mjs
export default function (eleventyConfig) {
  eleventyConfig.addFilter("uppercase", (str) => str.toUpperCase());

  eleventyConfig.addFilter("excerpt", (content, length = 200) => {
    return content.slice(0, length) + "...";
  });

  // 异步 filter（v2.0+）
  eleventyConfig.addAsyncFilter("fetchData", async (url) => {
    const res = await fetch(url);
    return res.json();
  });
}
```

使用：

```njk
{{ "hello" | uppercase }}                  → HELLO
{{ post.content | excerpt: 100 }}          → 前 100 字符 + ...
{{ "/api/posts" | fetchData | dump }}      → 异步获取并 dump
```

### 引擎特定 filter

```js
// 仅 Liquid
eleventyConfig.addLiquidFilter("liquidOnly", (s) => s);

// 仅 Nunjucks
eleventyConfig.addNunjucksFilter("njkOnly", (s) => s);

// 仅 JavaScript（11ty.js）
eleventyConfig.addJavaScriptFunction("jsOnly", (s) => s);
```

### 内置 universal filters

| Filter | 作用 | 例子 |
|---|---|---|
| `url` | 规范化 URL（自动加 pathPrefix） | <span v-pre>`{{ "/about" \| url }}`</span> → `/blog/about` |
| `slugify` | URL 友好字符串 | <span v-pre>`{{ "My Title!" \| slugify }}`</span> → `my-title` |
| `slug` | 老版本的 slugify（兼容） | 同上 |
| `log` | 在模板中 console.log | <span v-pre>`{{ data \| log }}`</span> |
| `getCollectionItem` | 获取当前 page 在 collection 中的对象 | <span v-pre>`{{ collections.post \| getCollectionItem(page) }}`</span> |
| `getPreviousCollectionItem` | 上一篇 | <span v-pre>`{{ collections.post \| getPreviousCollectionItem(page) }}`</span> |
| `getNextCollectionItem` | 下一篇 | <span v-pre>`{{ collections.post \| getNextCollectionItem(page) }}`</span> |
| `inputPathToUrl` | 输入路径转 URL | <span v-pre>`{{ "./src/posts/hello.md" \| inputPathToUrl }}`</span> |

### 上下文 this

Filter / shortcode 内部可以用 `this.page` / `this.eleventy`：

```js
eleventyConfig.addFilter("currentUrl", function (str) {
  return `${str} (来自 ${this.page.url})`;
  // ⚠️ 必须用 function 不能用箭头函数——this 才能绑定
});
```

### 文章前后篇导航（实战）

```njk
<!-- 在文章模板里 -->
{% set previousPost = collections.post | getPreviousCollectionItem(page) %}
{% set nextPost = collections.post | getNextCollectionItem(page) %}

<nav class="post-nav">
  {% if previousPost %}
    <a href="{{ previousPost.url }}" rel="prev">← {{ previousPost.data.title }}</a>
  {% endif %}
  {% if nextPost %}
    <a href="{{ nextPost.url }}" rel="next">{{ nextPost.data.title }} →</a>
  {% endif %}
</nav>
```

## Shortcodes

Shortcodes 是**自定义模板标签**——比 filter 更适合返回 HTML。

### 基础 shortcode

```js
eleventyConfig.addShortcode("year", () => new Date().getFullYear());

eleventyConfig.addShortcode("youtube", (id, title) => {
  return `<iframe src="https://www.youtube.com/embed/${id}" title="${title}" allowfullscreen></iframe>`;
});
```

使用（Liquid / Nunjucks 通用）：

```njk
<p>&copy; {% year %}</p>

{% youtube "dQw4w9WgXcQ", "标题" %}
```

### Paired shortcode（带 close 标签）

```js
eleventyConfig.addPairedShortcode("callout", (content, type = "info") => {
  return `<aside class="callout callout--${type}">${content}</aside>`;
});
```

使用：

```njk
{% callout "warning" %}
**重要**：这一段要注意！
{% endcallout %}
```

### 访问 page / eleventy 上下文

```js
eleventyConfig.addShortcode("currentDate", function () {
  return new Date().toLocaleDateString(this.page.lang || "zh-CN");
});
```

### 异步 shortcode

```js
eleventyConfig.addShortcode("fetchTitle", async (url) => {
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/<title>(.*?)<\/title>/);
  return match ? match[1] : "Unknown";
});
```

### 实战：图像 shortcode（无需 plugin）

```js
import { eleventyImagePlugin } from "@11ty/eleventy-img";

eleventyConfig.addShortcode("image", async function (src, alt, sizes = "100vw") {
  const metadata = await Image(src, {
    widths: [300, 600, 900],
    formats: ["avif", "webp", "jpeg"],
  });
  return Image.generateHTML(metadata, { alt, sizes, loading: "lazy", decoding: "async" });
});
```

## Passthrough Copy

Eleventy **不会自动复制非模板文件**（CSS / 图片 / JS / 字体等）——必须显式声明。

### 基础用法

```js
// 复制整个目录
eleventyConfig.addPassthroughCopy("src/assets");

// 复制具体文件
eleventyConfig.addPassthroughCopy("src/favicon.ico");
eleventyConfig.addPassthroughCopy("src/robots.txt");

// Glob 模式
eleventyConfig.addPassthroughCopy("src/**/*.css");
eleventyConfig.addPassthroughCopy("src/**/*.{png,jpg,gif,webp,svg}");
```

### 映射到不同路径

```js
eleventyConfig.addPassthroughCopy({
  "src/assets/img": "images",                                    // src/assets/img → _site/images
  "node_modules/normalize.css/normalize.css": "assets/normalize.css", // node_modules 文件 → _site/assets/normalize.css
});
```

### 在 watch 模式下保持同步

```js
eleventyConfig.setServerPassthroughCopyBehavior("passthrough"); // v2.0+

// 或者明确添加 watch target
eleventyConfig.addWatchTarget("./src/assets/");
```

## 官方插件

Eleventy 有 **7 个官方插件**——`@11ty/` 命名空间下：

### Image（`@11ty/eleventy-img`）

**最重要的插件**——自动生成响应式图像。

```bash
npm install @11ty/eleventy-img
```

#### 方式 1：HTML Transform（推荐，自动处理 `<img>`）

```js
// eleventy.config.mjs
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: ["auto", 400, 800, 1600],

    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
      },
      pictureAttributes: {},
    },
  });
}
```

然后**任何 HTML 里的 `<img>` 都会被自动处理**：

```html
<img src="./src/images/photo.jpg" alt="照片" sizes="(min-width: 1024px) 50vw, 100vw">
```

输出（构建后）：

```html
<picture>
  <source type="image/avif" srcset="/img/photo-400.avif 400w, /img/photo-800.avif 800w, /img/photo-1600.avif 1600w" sizes="...">
  <source type="image/webp" srcset="...">
  <img src="/img/photo-800.jpeg" alt="照片" loading="lazy" decoding="async" width="1600" height="900">
</picture>
```

#### 方式 2：作 shortcode 使用

```js
import Image from "@11ty/eleventy-img";

eleventyConfig.addShortcode("image", async function (src, alt, sizes) {
  const metadata = await Image(src, {
    widths: [300, 600, 900, "auto"],
    formats: ["avif", "webp", "jpeg"],
    outputDir: "./_site/img/",
    urlPath: "/img/",
  });

  return Image.generateHTML(metadata, {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  });
});
```

模板用：

```njk
{% image "./src/images/photo.jpg", "照片", "(min-width: 1024px) 50vw, 100vw" %}
```

### RSS / Atom（`@11ty/eleventy-plugin-rss`）

```bash
npm install @11ty/eleventy-plugin-rss
```

```js
import pluginRss from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
}
```

注册了 `dateToRfc3339` / `dateToRfc822` / `getNewestCollectionItemDate` / `absoluteUrl` / `htmlToAbsoluteUrls` 等 filter。

**模板**：

```xml
<!-- src/feed.xml.njk -->
---
permalink: /feed.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{{ site.title }}</title>
  <subtitle>{{ site.description }}</subtitle>
  <link rel="self" href="{{ site.url }}/feed.xml"/>
  <link href="{{ site.url }}/"/>
  <updated>{{ collections.post | getNewestCollectionItemDate | dateToRfc3339 }}</updated>
  <id>{{ site.url }}/</id>
  <author>
    <name>{{ site.author }}</name>
  </author>
  {% for post in collections.post | reverse %}
  <entry>
    <title>{{ post.data.title }}</title>
    <link href="{{ site.url }}{{ post.url }}"/>
    <updated>{{ post.date | dateToRfc3339 }}</updated>
    <id>{{ site.url }}{{ post.url }}</id>
    <content type="html">{{ post.content | htmlToAbsoluteUrls(site.url + post.url) | escape }}</content>
  </entry>
  {% endfor %}
</feed>
```

### Syntax Highlighting（`@11ty/eleventy-plugin-syntaxhighlight`）

```bash
npm install @11ty/eleventy-plugin-syntaxhighlight
```

```js
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
    init: function ({ Prism }) {
      // 加载额外语言
      // Prism.languages.javascript = ...
    },
  });
}
```

自动处理 Markdown 代码块：

````md
```js
const greeting = "Hello";
```
````

输出带 PrismJS class 的 HTML——**记得在 CSS 里引入主题**：

```html
<link rel="stylesheet" href="/assets/css/prism-themes/prism-tomorrow.css">
```

### Navigation（`@11ty/eleventy-navigation`）

层级导航 + 面包屑：

```bash
npm install @11ty/eleventy-navigation
```

```js
import pluginNavigation from "@11ty/eleventy-navigation";

eleventyConfig.addPlugin(pluginNavigation);
```

**front matter 加 navigation key**：

```md
---
title: 首页
eleventyNavigation:
  key: Home
  order: 1
---
```

```md
---
title: 关于
eleventyNavigation:
  key: About
  parent: Home
  order: 2
---
```

**模板渲染**：

```njk
<nav>
  {{ collections.all | eleventyNavigation | eleventyNavigationToHtml | safe }}
</nav>

<!-- 面包屑 -->
{% set breadcrumbs = collections.all | eleventyNavigationBreadcrumb(page.url) %}
{% for crumb in breadcrumbs %}
  <a href="{{ crumb.url }}">{{ crumb.title }}</a> /
{% endfor %}
```

### Bundle Plugin（`@11ty/eleventy-plugin-bundle`）

**内置在 Eleventy 3.x**——无需单独安装！自动把 CSS / JS 打包成 `<style>` / `<script>` 内联或外链：

```njk
<!-- 在模板中收集 CSS -->
{% css %}
.alert { color: red; }
{% endcss %}

{% css %}
.button { padding: 1rem; }
{% endcss %}

<!-- 在 layout 中输出 -->
<style>{% getBundle "css" %}</style>
```

效果：所有 `{% raw %}{% css %}{% endraw %}` 块的内容被合并、去重后输出一份 `<style>`。

### WebC（`@11ty/eleventy-plugin-webc`）

详见下方 **WebC** 章节。

### I18n（`@11ty/eleventy-plugin-i18n`）

详见下方 **国际化** 章节。

## WebC（3.x 一等公民）

**WebC** 是 11ty 团队自己开发的「**Web Components 模板引擎**」——可以在 Eleventy 中写 SSR Web Components。

### 安装

```bash
npm install @11ty/eleventy-plugin-webc
```

```js
import pluginWebc from "@11ty/eleventy-plugin-webc";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginWebc, {
    components: "src/_components/**/*.webc",
  });
}
```

### 单文件组件

```html
<!-- src/_components/post-card.webc -->
<article>
  <h2 @text="title"></h2>
  <p @text="excerpt"></p>
  <a :href="url">阅读全文 →</a>
</article>

<style webc:scoped>
  article {
    padding: 1rem;
    border: 1px solid #ddd;
  }
  h2 {
    color: blue;
  }
</style>

<script>
  // 这段会在浏览器中执行
  console.log("post-card mounted");
</script>
```

### 使用组件

```html
<!-- src/index.webc -->
---
title: 首页
---
<ul>
  <li webc:for="post of collections.post">
    <post-card
      :title="post.data.title"
      :url="post.url"
      :excerpt="post.data.excerpt">
    </post-card>
  </li>
</ul>
```

### WebC 语法关键字

| 语法 | 作用 |
|---|---|
| `@text="expr"` | 设置元素文本内容（HTML 转义） |
| `@html="expr"` | 设置元素 HTML（不转义） |
| `@raw="expr"` | 输出原文（不转义） |
| `:attr="expr"` | 动态属性（JavaScript 表达式） |
| `webc:if="expr"` | 条件渲染 |
| `webc:elseif="expr"` | 否则 if |
| `webc:else` | 否则 |
| `webc:for="item of list"` | 循环 |
| `webc:scoped` | scoped CSS（自动生成 class 前缀） |
| `webc:keep` | 不剥离当前标签（默认无 CSS/JS 的组件标签会被剥掉） |
| `webc:bucket="name"` | 把 CSS/JS 输出到指定 bucket（如 deferred） |
| `webc:nokeep` | 强制剥离标签 |
| `webc:root` | 标记为根节点 |
| `webc:type="11ty"` | 嵌入其他 Eleventy 模板引擎（Liquid / Njk / MD） |

### Slot

```html
<!-- src/_components/card.webc -->
<div class="card">
  <h2><slot name="title">默认标题</slot></h2>
  <div class="content">
    <slot>默认内容</slot>
  </div>
</div>
```

```html
<card>
  <span slot="title">我的标题</span>
  <p>我的内容</p>
</card>
```

### 自动 CSS/JS Bundling

WebC plugin 默认开启 bundler 模式——**所有 `<style>` 和 `<script>` 被自动收集到 bundle**：

```html
<!-- src/_includes/base.webc -->
<!doctype html>
<html>
<head>
  <title>{{ title }}</title>
  <style @raw="getBundle('css')" webc:keep></style>
</head>
<body>
  <slot></slot>
  <script @raw="getBundle('js')" webc:keep></script>
</body>
</html>
```

**每个页面**自动得到**仅包含该页用到的组件 CSS/JS**——按页缓存友好。

## Pagination

### 基础分页

```md
---
pagination:
  data: collections.post
  size: 10
  alias: posts
layout: base.njk
permalink: "/blog/{% if pagination.pageNumber > 0 %}page/{{ pagination.pageNumber + 1 }}/{% endif %}"
---

# 博客（第 {{ pagination.pageNumber + 1 }} 页）

{% for post in posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    <p>{{ post.data.excerpt }}</p>
  </article>
{% endfor %}

<nav>
  {% if pagination.href.previous %}
    <a href="{{ pagination.href.previous }}">← 上一页</a>
  {% endif %}
  {% if pagination.href.next %}
    <a href="{{ pagination.href.next }}">下一页 →</a>
  {% endif %}
</nav>
```

输出：

- `/blog/`（第 1 页）
- `/blog/page/2/`
- `/blog/page/3/`
- ...

### Pagination 对象

```js
{
  items,              // 当前页的项目数组
  pageNumber,         // 0-indexed 页号
  hrefs,              // 所有页的 URL 数组
  href: {
    next, previous, first, last
  },
  pages,              // 所有页的数据块
  page: { next, previous, first, last } // 数据 alias
}
```

### 按数据分组生成多页

```md
---
# 为每个 tag 生成一个页面
pagination:
  data: collections
  size: 1
  alias: tag
  filter:
    - all
    - posts
permalink: "/tags/{{ tag }}/"
---

# {{ tag }}

{% for post in collections[tag] %}
  <a href="{{ post.url }}">{{ post.data.title }}</a>
{% endfor %}
```

### before 函数（自定义数据预处理）

```md
---
pagination:
  data: collections.post
  size: 10
  alias: posts
  before: |
    function(paginationData) {
      // 反转 + 仅取已发布
      return paginationData
        .filter(p => p.data.published !== false)
        .reverse();
    }
---
```

## 国际化 i18n

### 安装

`@11ty/eleventy-plugin-i18n` **是 Eleventy 内置插件**（无需 npm 安装）：

```js
import { I18nPlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: "zh",
    errorMode: "strict",
  });
}
```

### 目录组织

```
src/
├── zh/
│   ├── zh.json          # { "lang": "zh" }
│   ├── index.md
│   └── about.md
└── en/
    ├── en.json          # { "lang": "en" }
    ├── index.md
    └── about.md
```

`zh.json` 等是**目录数据文件**——给目录下所有文件设 `lang: "zh"`。

### locale_url filter

```njk
<a href="{{ "/about/" | locale_url }}">关于</a>
```

如果当前页是中文（`lang: zh`）→ 输出 `/zh/about/`；英文页 → `/en/about/`。

### locale_links filter（语言切换器）

```njk
<nav>
  {% set translations = page.url | locale_links %}
  {% for translation in translations %}
    <a href="{{ translation.url }}">{{ translation.label }}</a>
  {% endfor %}
</nav>
```

自动列出当前页面的所有语言版本。

## Incremental Builds

```bash
npx @11ty/eleventy --serve --incremental
```

**只重建变更的文件 + 它们的依赖**——百级文件项目的开发体验从「秒级 build」变成「毫秒级 build」。

### 哪些场景触发重建

| 变更 | 重建范围 |
|---|---|
| 单个 md/html 修改 | 仅那一个文件 |
| Layout 修改 | 用了该 layout 的所有文件 |
| 全局数据（`_data/*`）修改 | 所有用了该数据的文件 |
| Tag-based collection 变化 | 用了该 collection 的所有页面（需 `eleventyImport`） |
| 配置文件修改 | 全量重建 |

### eleventyImport 帮助 incremental（v3.0+）

```yml
---
eleventyImport:
  collections: ["post", "tutorial"]
---
```

明确告诉 Eleventy「本页依赖 post 和 tutorial collection」——这样它们变化时**正确重建本页**。

### 跳过初始全量构建

```bash
npx @11ty/eleventy --serve --incremental --ignore-initial
```

直接进入 watch 模式（用已有的 `_site/`），适合长开发会话。

## 自定义模板引擎

如果你想用 Markdown 之外的内容格式——可以**自定义引擎**：

```js
import { promises as fs } from "fs";

eleventyConfig.addExtension("txt", {
  outputFileExtension: "html",
  compile: async (inputContent, inputPath) => {
    return async (data) => {
      // inputContent 是文件原文，data 是 front matter + 数据级联
      return `<pre>${inputContent}</pre>`;
    };
  },
});

// 现在 *.txt 文件会被处理为 HTML
```

## 部署详解

### Netlify

`netlify.toml`：

```toml
[build]
  publish = "_site"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

# 缓存优化（持久化 .cache/）
[[plugins]]
  package = "netlify-plugin-cache"
  [plugins.inputs]
    paths = [".cache"]
```

### Vercel

零配置（自动识别 Eleventy）。如果需要自定义：

```json
// vercel.json
{
  "buildCommand": "npx @11ty/eleventy",
  "outputDirectory": "_site",
  "cleanUrls": true
}
```

### Cloudflare Pages

控制台配置：

| 字段 | 值 |
|---|---|
| Build command | `npm run build` |
| Build output directory | `_site` |
| Root directory | `/`（如果项目在子目录则改） |
| Node version | `20`（环境变量 `NODE_VERSION=20`） |

**Cloudflare 自带 `.cache/` 持久化**（2024 年起默认），增量构建效果明显。

### GitHub Pages

完整 workflow：

```yml
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

      - uses: actions/cache@v4
        with:
          path: .cache
          key: cache-${{ github.run_id }}
          restore-keys: cache-

      - run: npm ci
      - run: npx @11ty/eleventy --pathprefix=/repo-name/

      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

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

> 注意 `--pathprefix=/repo-name/`——如果部署到 `username.github.io/repo-name/` 需要加。**用户主页**（`username.github.io`）不需要。

### Render / 其他

通用配置：

| 字段 | 值 |
|---|---|
| Build command | `npm run build` |
| Output directory | `_site` |
| Node version | `20` 或更高 |

## 性能优化

### 1. 启用 incremental builds

```bash
npx @11ty/eleventy --serve --incremental
```

### 2. 启用 cache persistence

CI 上加 `.cache/` 持久化（GitHub Actions 用 `actions/cache@v4`，Netlify 用 `netlify-plugin-cache`）。

### 3. 使用 Eleventy Image 优化图像

```js
eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  formats: ["avif", "webp", "auto"],
  widths: ["auto", 400, 800, 1200],
});
```

AVIF + WebP 比原 JPEG 体积小 30-60%。

### 4. 启用 Quiet Mode

生产构建时减少日志：

```js
eleventyConfig.setQuietMode(true);
```

或 CLI：

```bash
npx @11ty/eleventy --quiet
```

### 5. 启用 minification（HTML / CSS / JS）

Eleventy 不内置 minifier——用 transform 自加：

```js
import { minify } from "html-minifier-terser";

eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
  if (outputPath && outputPath.endsWith(".html")) {
    return await minify(content, {
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
    });
  }
  return content;
});
```

## 常见模式与最佳实践

### 1. 文章标签云

```js
// eleventy.config.mjs
eleventyConfig.addCollection("tagList", (collectionApi) => {
  const tagSet = new Set();
  collectionApi.getAll().forEach((item) => {
    (item.data.tags || []).forEach((tag) => tagSet.add(tag));
  });
  return [...tagSet].filter((tag) => !["post", "page"].includes(tag));
});
```

```njk
{% for tag in collections.tagList %}
  <a href="/tags/{{ tag | slugify }}/">{{ tag }} ({{ collections[tag].length }})</a>
{% endfor %}
```

### 2. 草稿支持

```js
// eleventy.config.mjs
const isProduction = process.env.NODE_ENV === "production";

eleventyConfig.addFilter("removeDrafts", (items) => {
  if (!isProduction) return items;
  return items.filter((item) => !item.data.draft);
});

eleventyConfig.addGlobalData("eleventyComputed", {
  eleventyExcludeFromCollections: (data) => {
    if (isProduction && data.draft) return true;
    return data.eleventyExcludeFromCollections;
  },
});
```

### 3. 自动生成 sitemap

```njk
<!-- src/sitemap.xml.njk -->
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  {% for page in collections.all %}
  {% if page.data.eleventyExcludeFromCollections !== true %}
  <url>
    <loc>{{ site.url }}{{ page.url }}</loc>
    <lastmod>{{ page.date.toISOString() }}</lastmod>
  </url>
  {% endif %}
  {% endfor %}
</urlset>
```

### 4. 主题切换（dark / light）

```html
<!-- 在 base.njk 里 -->
<script>
  // 在 <body> 渲染前设置 class，避免 FOUC
  const theme = localStorage.getItem("theme") || "auto";
  document.documentElement.dataset.theme = theme;
</script>

<style>
  :root[data-theme="dark"] { background: #1a1a1a; color: white; }
  :root[data-theme="light"] { background: white; color: #1a1a1a; }
</style>
```

### 5. 用 Pagefind 加搜索

```bash
npm install pagefind
```

```js
// 在构建后跑
"scripts": {
  "build": "npx @11ty/eleventy && pagefind --site _site"
}
```

```html
<!-- 在搜索页里 -->
<div id="search"></div>
<script src="/pagefind/pagefind-ui.js"></script>
<script>
  new PagefindUI({ element: "#search" });
</script>
```

## 接下来读什么

- [参考](./reference.md)：CLI 命令全集 / 配置选项速查 / Filters 全表 / Shortcodes API / WebC 语法速查 / Plugin 列表
