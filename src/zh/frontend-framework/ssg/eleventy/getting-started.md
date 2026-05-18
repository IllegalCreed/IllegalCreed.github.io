---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Eleventy 3.x（最新 **v3.1.5** 稳定 / 2026-05 状态；**v4.0.0-alpha** Canary，要求 **Node.js 18+**）编写。

## 速查

- 系统要求：**Node.js 18+**（推荐 20 LTS）+ 任意包管理器（npm / pnpm / yarn）
- 零安装试运行：`npx @11ty/eleventy`（在任意目录下直接执行）
- 标准安装：`npm install @11ty/eleventy`（推荐项目本地依赖，不全局装）
- 启动 dev server：`npx @11ty/eleventy --serve`（默认 8080 端口 + live reload）
- 增量构建：`npx @11ty/eleventy --incremental`（仅重建变更文件）
- 生产构建：`npx @11ty/eleventy`（默认输出到 `_site/`）
- 配置文件名（优先级）：`.eleventy.js` → `eleventy.config.js` → `eleventy.config.mjs` → `eleventy.config.cjs`
- 默认目录：`.`（输入）/ `_site`（输出）/ `_includes`（layouts/partials）/ `_data`（全局数据）
- 默认模板格式：`html, liquid, ejs, md, hbs, mustache, haml, pug, njk, 11ty.js`
- 核心包：`@11ty/eleventy`（主程序）—— **不需要装 CLI，所有命令通过 npx 即可**

## Eleventy 适合什么场景

理解 Eleventy 必须先理解它的**定位**——它是「**模板引擎自由 + 零客户端 JS**」的极简 SSG，**不预设技术栈**（不绑 React / Vue / Svelte）：

| 维度 | Eleventy 3.x | Hexo 8.x | Hugo 0.x | Jekyll 4.x | Astro 5.x | VitePress 1.x | Docusaurus 3.x |
|---|---|---|---|---|---|---|---|
| 运行时 | **Node.js 18+** | Node.js 20.19+ | Go 单二进制 | Ruby 3.0+ | Node.js 18+ | Node.js 18+ | Node.js 20+ |
| 默认模板引擎 | **自由（11 种）** | Nunjucks | Go template | Liquid | Astro（自家） | Vue 3 | React 18 + MDX |
| 内容格式 | **MD / HTML / Liquid / Njk / WebC / 11ty.js 任选** | Markdown | Markdown | Markdown | MD + 多框架组件 | MD + Vue | MDX 3 |
| 客户端 JS | **零（除非自加）** | 取决于主题 | 取决于主题 | 取决于主题 | Island（按需） | Vue Runtime | React Runtime |
| 配置约定 | 极少（`_includes` / `_data`） | 重（站点 + 主题） | 重（archetypes / params） | 中 | 中（pages 路由） | 中（VitePress 约定） | 重（preset） |
| 主题系统 | **无内置 / 全自定义** | 440+ 主题 | 300+ 主题 | 100+ 主题 | 100+ 主题 | 1 默认主题 | 1 classic |
| 博客系统 | 自配 collections 实现 | ✅ 一等公民 | ✅ 内置 | ✅ 内置 | 自配 | ❌ 弱 | ✅ 内置 |
| 多版本文档 | ❌ 无 | ❌ | ⚠️ 自配 | ❌ | ❌ | ❌ | ✅ 一等公民 |
| 构建速度 | **中-快**（百级页面秒级） | 中-快 | **极快**（千页秒级） | 慢 | 中 | **极快**（Vite） | 中（Webpack） |
| HMR / Live Reload | Live Reload | Live Reload | Live Reload | 无 | Vite HMR | **Vite HMR** | 较快 |
| 中文资料 | 少 | **极丰富** | 较多 | 较多 | 较少 | 较多 | 较少 |

**核心适合**：

- **追求"工程师工艺"的独立博客**（高度可定制，不被主题束缚）
- **高性能内容站**（零客户端 JS = Lighthouse 满分天然达成）
- **设计师 / 独立开发者作品集**（HTML / CSS 主导，最大化排版自由度）
- **Smashing Magazine / web.dev 这类大型内容网站**（Eleventy 实际用户群）
- **不喜欢 React / Vue 强绑定的开发者**（11ty 不绑任何前端框架）
- **想混用多种模板引擎的项目**（同一项目 Liquid + Nunjucks + WebC 并存）

**不适合**：

- **想要"开箱即用主题"**（11ty 没有 Hexo NexT / Docusaurus classic 那种现成主题）
- **多版本文档站**（11ty 没有版本概念，应选 Docusaurus）
- **极速大型站构建**（千页以上不如 Hugo 单二进制）
- **复杂交互 SPA**（11ty 是 SSG，不是应用框架）
- **新手 / 时间紧**（自由度高 = 起步需要做很多决策）

## 系统准备

### Node.js 版本

Eleventy 3.x 要求 **Node.js 18 或更高**——必须先检查：

```bash
node -v
# v18.0.0 或更高才算合格，推荐 v20+ LTS
```

如果版本不够，**强烈推荐用 nvm / fnm** 管理 Node 版本：

```bash
# 安装最新 LTS
nvm install --lts && nvm use --lts

# 或用 fnm（速度更快）
fnm install --lts && fnm use lts-latest
```

> Eleventy 历史版本的 Node 要求：
>
> | Eleventy 版本 | Node.js 最低要求 |
> |---|---|
> | 3.x | 18+ |
> | 2.x | 14+ |
> | 1.x | 12+ |
> | 0.x | 8+ |

### 包管理器

任选其一（推荐 npm，最广泛兼容）：

```bash
npm -v       # Node 自带
pnpm -v      # 推荐（速度快、磁盘省）
yarn -v      # 也可
```

## 零安装试运行

Eleventy 最大的"反炫技"就是——**根本不需要任何配置**就能跑：

```bash
mkdir my-site
cd my-site
echo "# Hello Eleventy" > index.md

npx @11ty/eleventy
```

第一次执行会下载 `@11ty/eleventy`（约 5MB），然后输出：

```
[11ty] Writing ./_site/index.html from ./index.md
[11ty] Wrote 1 file in 0.04 seconds (v3.1.5)
```

打开 `_site/index.html` 就能看到生成的 HTML——**没有任何 `package.json`、没有 `eleventy.config.mjs`、不需要任何 dependency**。这是 11ty 哲学的核心：**Markdown / HTML 文件就是项目本体**。

## 标准项目初始化

零安装适合试跑，正式项目建议本地安装：

### 创建项目目录

```bash
mkdir eleventy-blog
cd eleventy-blog
```

### 初始化 package.json

```bash
npm init -y
```

### 启用 ESM（推荐）

Eleventy 3.x **官方文档全部用 ESM** 示例，强烈建议项目用 ESM：

```bash
npm pkg set type="module"
```

这一句会在 `package.json` 加入 `"type": "module"`——之后所有 `.js` 文件默认按 ESM 解析。

### 安装 Eleventy

```bash
npm install @11ty/eleventy
```

校验：

```bash
npx @11ty/eleventy --version
# 3.1.5
```

## 第一个页面

### 创建一个 Markdown 文件

```bash
echo "# Hello Eleventy" > index.md
```

### 运行 build

```bash
npx @11ty/eleventy
```

输出：

```
[11ty] Writing ./_site/index.html from ./index.md
[11ty] Wrote 1 file in 0.05 seconds (v3.1.5)
```

打开 `_site/index.html`：

```html
<h1>Hello Eleventy</h1>
```

### 创建一个 HTML 文件

```bash
echo '<!doctype html><title>Home</title><p>Hi</p>' > about.html
```

再次 build：

```bash
npx @11ty/eleventy
```

会得到：

- `_site/index.html`（来自 `index.md`）
- `_site/about/index.html`（来自 `about.html`）—— **注意自动生成的子目录 + index.html**

这是 Eleventy 默认的「**Cool URI**」策略：所有非 `index.*` 文件都会被包裹进**同名目录**，输出 `index.html`，从而获得`/about/` 这样的干净 URL（不带 `.html` 扩展名）。

## 启动 dev server

```bash
npx @11ty/eleventy --serve
```

输出：

```
[11ty] Writing ./_site/index.html from ./index.md
[11ty] Writing ./_site/about/index.html from ./about.html
[11ty] Wrote 2 files in 0.05 seconds (v3.1.5)
[11ty] Server at http://localhost:8080/
```

浏览器打开 `http://localhost:8080/` 即可看到首页。

### dev server 特性

- **Live Reload**：保存任意源文件 → 自动重新生成 + 浏览器刷新（**不是 HMR**，不保留 JS 状态）
- **默认端口**：8080（可用 `--port=3000` 改）
- **CORS / 静态资源**：自带 `@11ty/eleventy-dev-server`（v3.x 默认）

### 常用 CLI 选项

```bash
npx @11ty/eleventy --serve --port=3000     # 改端口
npx @11ty/eleventy --serve --incremental   # 增量构建
npx @11ty/eleventy --watch                 # 仅 watch，不开服务器
npx @11ty/eleventy --formats=md,njk        # 限定模板格式
npx @11ty/eleventy --input=src             # 修改输入目录
npx @11ty/eleventy --output=dist           # 修改输出目录
npx @11ty/eleventy --pathprefix=/blog/     # 子路径部署
npx @11ty/eleventy --quiet                 # 减少日志输出
npx @11ty/eleventy --dryrun                # 模拟运行，不生成文件
```

## 项目结构

Eleventy **没有强制约定**——你可以把所有文件放在根目录。但社区惯例是用 `src/` 作输入目录：

```
eleventy-blog/
├── eleventy.config.mjs               # ⚙️ 主配置文件（ESM）
├── package.json
├── src/                              # 👈 输入目录（自定义）
│   ├── index.md                      # 首页
│   ├── about.md                      # 关于页
│   ├── _includes/                    # 📦 layouts / partials（命名固定）
│   │   ├── base.njk                  # 基础 layout
│   │   └── post.njk                  # 文章 layout
│   ├── _data/                        # 📊 全局数据（命名固定）
│   │   ├── site.json
│   │   └── nav.js
│   ├── posts/                        # 文章目录
│   │   ├── posts.json                # 目录数据（共享给该目录所有文件）
│   │   ├── first.md
│   │   └── second.md
│   └── assets/                       # 静态资源
│       ├── css/
│       └── img/
└── _site/                            # 📤 构建输出目录（默认）
```

### 关键命名约定

| 路径 | 作用 | 是否强制 |
|---|---|---|
| `_includes/` | **Layouts + partials 目录**——`{% include %}` / `layout: xxx` 在这里找 | 名字可改（`dir.includes` 配置） |
| `_data/` | **全局数据目录**——下面所有 `.json` / `.js` 文件都成为 `data.xxx` | 名字可改（`dir.data` 配置） |
| `_site/` | **输出目录** | 名字可改（`dir.output` 配置） |
| `_drafts/` | 草稿目录（约定） | 非强制，需配 `ignores:` |
| `eleventy.config.mjs` | 主配置文件 | 文件名固定（4 选 1） |

### 隐藏文件规则

- **以 `_` 开头**的目录（如 `_includes` / `_data`）**不会被当作输出**（被识别为配置目录）
- 其他文件按 `templateFormats` 列表自动处理

## 第一个配置文件

虽然零配置能跑，但任何正式项目都需要 `eleventy.config.mjs`。**Eleventy 3.x 推荐 ESM**：

```js
// eleventy.config.mjs
/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  // 静态资源直接拷贝到 _site/
  eleventyConfig.addPassthroughCopy("src/assets");

  // 注册一个自定义 filter
  eleventyConfig.addFilter("uppercase", (str) => str.toUpperCase());

  // 监听 CSS 变更
  eleventyConfig.addWatchTarget("./src/assets/css/");

  // 返回配置对象（dir / templateFormats / pathPrefix 等）
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // Markdown / HTML 用 Nunjucks 引擎处理（强烈推荐）
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "md", "njk", "11ty.js"],
  };
}
```

### CommonJS 版本（兼容老项目）

如果 `package.json` 没有 `"type": "module"`，配置文件用 CJS：

```js
// .eleventy.js (CommonJS)
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  return {
    dir: { input: "src", output: "_site" },
  };
};
```

> 3.x 之后**官方建议优先 ESM**——所有新教程、starter 模板都用 `eleventy.config.mjs`。

## 11 种模板引擎一览

Eleventy 最大特色——**同一项目可以任意混用以下引擎**，每个文件按后缀路由：

| 引擎 | 文件扩展 | 是否内置 | 典型用途 |
|---|---|---|---|
| **HTML** | `*.html` | ✅ 内置 | 静态页面（默认会先用 Liquid 预处理） |
| **Markdown** | `*.md` | ✅ 内置 | 内容页 / 博客文章 |
| **Liquid** | `*.liquid` | ✅ 内置（Jekyll / Shopify 同款） | 模板逻辑 |
| **Nunjucks** | `*.njk` | ✅ 内置（**推荐**） | 复杂模板 / 宏 / 继承 |
| **WebC** | `*.webc` | ✅ 内置（3.x 一等公民） | Web Components SSR |
| **JavaScript** | `*.11ty.js` | ✅ 内置 | 程序化生成内容 |
| **JSX / TSX** | `*.jsx` / `*.tsx` | ⚠️ 需 plugin | React 风格组件 |
| **TypeScript** | `*.ts` | ⚠️ 需 plugin | 程序化生成 + 类型 |
| **MDX** | `*.mdx` | ⚠️ 需 plugin | Markdown + React 组件 |
| **Handlebars** | `*.hbs` | ⚠️ 需 plugin（`@11ty/eleventy-plugin-handlebars`） | Mustache 风格 |
| **Mustache** | `*.mustache` | ⚠️ 需 plugin | Logic-less 模板 |
| **EJS** | `*.ejs` | ⚠️ 需 plugin | Embedded JS |
| **HAML** | `*.haml` | ⚠️ 需 plugin | Ruby 风格简写 |
| **Pug** | `*.pug` | ⚠️ 需 plugin | 缩进风格 HTML |
| **Sass** | `*.scss` | ⚠️ 需 plugin（`eleventy-sass`） | CSS 预处理 |

### 推荐引擎组合

**90% 用户的选择**：**Markdown + Nunjucks**（Markdown 写内容，Nunjucks 写 layouts / partials）—— Eleventy 默认就是这样配置的，`{% raw %}{% %}{% endraw %}` 是 Nunjucks 语法（Liquid 也兼容，所以 `.md` 用 `.njk` 处理基本无坑）。

```js
return {
  markdownTemplateEngine: "njk",   // .md 先用 Nunjucks 预处理，再渲染 Markdown
  htmlTemplateEngine: "njk",       // .html 用 Nunjucks 处理（默认是 liquid）
};
```

### 不同引擎的输出对比

**Liquid**（默认）：

```liquid
<h1>{{ title }}</h1>
<ul>
{% for item in items %}
  <li>{{ item.name }}</li>
{% endfor %}
</ul>
```

**Nunjucks**：

```njk
<h1>{{ title }}</h1>
<ul>
{% for item in items %}
  <li>{{ item.name }}</li>
{% endfor %}
</ul>
```

> Nunjucks 和 Liquid 在简单场景下**语法几乎一样**（都用 <span v-pre>`{% raw %}{{ }}{% endraw %}`</span> 插值 + <span v-pre>`{% raw %}{% %}{% endraw %}`</span> 标签），所以可以"自由切换"。差异主要在宏 / 过滤器 / 继承上。

**WebC**：

```html
<!-- post-card.webc -->
<article>
  <h2 @text="title"></h2>
  <p @text="excerpt"></p>
</article>

<style webc:scoped>
  article { padding: 1rem; }
</style>
```

**11ty.js**（程序化生成）：

```js
// gallery.11ty.js
export default function () {
  return {
    title: "Gallery",
    layout: "base.njk",
  };
}

export function render(data) {
  return data.images.map((img) => `<img src="${img}">`).join("");
}
```

## 第一个 layout

在 `src/_includes/` 下建 Nunjucks layout：

```njk
<!-- src/_includes/base.njk -->
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>{{ title or site.title }}</title>
</head>
<body>
  <header>
    <a href="/">{{ site.title }}</a>
  </header>
  <main>
    {{ content | safe }}
  </main>
</body>
</html>
```

然后让 `index.md` 使用这个 layout——在 front matter 写：

```md
---
layout: base.njk
title: 首页
---

# 欢迎来到我的博客

这是我的第一篇文章。
```

构建后 `_site/index.html` 会被 layout 包裹。

### Layout 关键概念

- **`content` 变量**：layout 中用 <span v-pre>`{% raw %}{{ content | safe }}{% endraw %}`</span> 渲染子模板内容（`| safe` 防止 HTML 转义）
- **嵌套 layout**：layout 文件自身也可以指定 `layout:` 形成链式继承
- **Layout 路径**：`layout: base.njk` 会去 `_includes/base.njk` 找
- **Layout aliases**：可在配置中加 `eleventyConfig.addLayoutAlias("post", "layouts/post.njk")`，文章里就能写 `layout: post`

## 第一个 collection

Eleventy 的 collection 是「**给一组文章分组**」——基于 `tags` 字段自动生成。

### 给文章打 tag

```md
---
title: 我的第一篇文章
date: 2026-05-18
tags: post
layout: post.njk
---

文章内容……
```

```md
---
title: 我的第二篇文章
date: 2026-05-19
tags:
  - post
  - tutorial
layout: post.njk
---

教程内容……
```

### 在模板中访问

```njk
<!-- src/index.md -->
---
layout: base.njk
title: 首页
---

# 最新文章

<ul>
{% for post in collections.post | reverse %}
  <li>
    <a href="{{ post.url }}">{{ post.data.title }}</a>
    <time>{{ post.date | date: "%Y-%m-%d" }}</time>
  </li>
{% endfor %}
</ul>
```

### 内置的 `collections.all`

Eleventy 自动生成 `collections.all`——包含**所有页面**（不论是否有 tag）。常用于网站地图：

```njk
{% for page in collections.all %}
  <url><loc>{{ site.url }}{{ page.url }}</loc></url>
{% endfor %}
```

### 排除特定页面

front matter 加 `eleventyExcludeFromCollections: true` 即可（首页、关于页通常需要排除）：

```md
---
title: 关于
permalink: /about/
eleventyExcludeFromCollections: true
---
```

## 全局数据 `_data/`

`_data/` 目录下的所有 JSON / JS 文件都会变成**全局数据**——文件名即变量名。

### 静态 JSON 数据

```json
// src/_data/site.json
{
  "title": "我的博客",
  "description": "记录技术与生活",
  "url": "https://yourdomain.com",
  "author": "IllegalCreed"
}
```

在任意模板里直接用：

```njk
<title>{{ site.title }}</title>
<meta name="description" content="{{ site.description }}">
```

### 动态 JS 数据

```js
// src/_data/nav.js
export default {
  items: [
    { text: "首页", url: "/" },
    { text: "博客", url: "/posts/" },
    { text: "关于", url: "/about/" },
  ],
};
```

```njk
<nav>
{% for item in nav.items %}
  <a href="{{ item.url }}">{{ item.text }}</a>
{% endfor %}
</nav>
```

### 异步数据（fetch 第三方 API）

```js
// src/_data/github.js
export default async function () {
  const res = await fetch("https://api.github.com/users/IllegalCreed");
  return res.json();
}
```

```njk
<p>GitHub 关注者：{{ github.followers }}</p>
```

### 目录级数据

在 `posts/` 目录建 `posts.json`——里面的字段会**自动应用于该目录所有文件**：

```json
// src/posts/posts.json
{
  "layout": "post.njk",
  "tags": "post",
  "permalink": "/posts/{{ page.fileSlug }}/"
}
```

这样所有 `posts/*.md` 文件**不需要再单独写 `layout` / `tags`**——自动继承。

## 永久链接 `permalink`

默认情况下，`posts/hello.md` 会输出到 `_site/posts/hello/index.html`，URL 是 `/posts/hello/`。

### 自定义 permalink

```md
---
title: 文章
permalink: /custom-path/
---
```

输出到 `_site/custom-path/index.html`。

### 用动态变量

```md
---
title: My Post
date: 2026-05-18
permalink: "/blog/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}/"
---
```

输出到 `_site/blog/2026/05/18/my-post/index.html`，URL `/blog/2026/05/18/my-post/`。

> **YAML 注意**：模板语法（含 <span v-pre>`{% raw %}{{ }}{% endraw %}`</span>）**必须用引号包裹**，否则 YAML parser 会报错。

## 添加静态资源

CSS / 图片 / JS 文件**不会被 Eleventy 自动复制**到 `_site/`——必须显式声明 passthrough copy：

```js
// eleventy.config.mjs
export default function (eleventyConfig) {
  // 把 src/assets 整个目录复制到 _site/assets
  eleventyConfig.addPassthroughCopy("src/assets");

  // 只复制 CSS 文件
  eleventyConfig.addPassthroughCopy("src/**/*.css");

  // 映射到不同路径
  eleventyConfig.addPassthroughCopy({
    "node_modules/normalize.css/normalize.css": "assets/normalize.css",
  });

  return { /* ... */ };
}
```

在 layout 中引用：

```njk
<link rel="stylesheet" href="/assets/css/main.css">
```

## 构建与部署

### 生产构建

```bash
npx @11ty/eleventy
```

会做的事：

1. 读取 `dir.input`（默认 `.`）下所有匹配 `templateFormats` 的文件
2. 应用 Data Cascade（合并 front matter / 目录数据 / 全局数据）
3. 通过对应模板引擎渲染
4. 写入 `dir.output`（默认 `_site/`）
5. Passthrough copy 静态资源

### 本地预览生产构建

```bash
npx @11ty/eleventy --serve
# 默认会先 build 再起服务器，无需单独再 build
```

### package.json scripts

```json
{
  "scripts": {
    "build": "npx @11ty/eleventy",
    "start": "npx @11ty/eleventy --serve",
    "dev": "npx @11ty/eleventy --serve --incremental"
  }
}
```

然后用 `npm start` 启动。

## 部署到 Netlify / Vercel / Cloudflare Pages

这类 Jamstack 平台**零配置识别 Eleventy**：

### Netlify

`netlify.toml`：

```toml
[build]
  publish = "_site"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
```

或在 Netlify 控制台 → Site settings 配置同样字段。

### Vercel

`vercel.json`（一般不需要，自动识别）：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "_site"
}
```

### Cloudflare Pages

控制台配置：

- **Build command**: `npm run build`
- **Build output directory**: `_site`
- **Node version**: `20`

**好消息**：Cloudflare Pages 2024 年起默认保留 `.cache/` 目录——重复构建大幅加速。

## 部署到 GitHub Pages

`.github/workflows/deploy.yml`：

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
      - run: npx @11ty/eleventy

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

GitHub 仓库 → Settings → Pages → Source 选 **GitHub Actions** 即可。

> 如果部署到项目仓库（如 `username.github.io/blog/`），需要在 build 步加 `--pathprefix`：
>
> ```yml
> - run: npx @11ty/eleventy --pathprefix=/blog/
> ```
>
> 同时 layout 里所有内部链接用 `| url` filter（11ty 内置）自动加前缀。

## TypeScript 支持

Eleventy 3.x **原生不支持 TS 配置文件**，但可以用 **JSDoc** 获得 IDE 类型提示：

```js
// eleventy.config.mjs
/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
  // 现在 eleventyConfig.addFilter / addCollection 都有类型提示
  eleventyConfig.addFilter("upper", (s) => s.toUpperCase());
}
```

如果要用 `.ts` 模板（`*.ts` 文件作内容），需要安装 plugin：

```bash
npm install @11ty/eleventy-plugin-tsbundle
```

## 常用 starter 模板

新项目不想从零搭，可以基于官方 starter：

### `eleventy-base-blog`（官方）

```bash
npx degit 11ty/eleventy-base-blog my-blog
cd my-blog
npm install
npm start
```

特性：

- 完整博客 + RSS + sitemap
- 文章 / 标签 / 归档页
- Nunjucks layouts
- @11ty/eleventy-img 图像优化
- 自动语法高亮（PrismJS）
- Netlify / Vercel 部署友好

### 其他 starter

| 名字 | 特点 | 仓库 |
|---|---|---|
| `eleventy-base-blog` | 官方博客 starter | `11ty/eleventy-base-blog` |
| `11ty-starter` | 极简博客 | 各种社区版本 |
| `eleventy-duo` | 双语博客 | `maxboeck/eleventy-duo` |
| `pristine` | 设计精美的个人站 | `maxboeck/pristine` |
| `eleventy-excellent` | 中型站综合方案 | `madrilene/eleventy-excellent` |

## 常见陷阱

### Node 版本不对

```
ERROR Node.js v16 is not supported. Eleventy 3 requires Node.js v18+.
```

升级 Node：`nvm install 20 && nvm use 20`。

### `npx @11ty/eleventy` 一直在用旧版本

`npx` 会缓存 package——更新到最新版：

```bash
npm install @11ty/eleventy@latest
npx @11ty/eleventy --version  # 确认是 3.1.5
```

### 配置文件改了但没生效

- **检查文件名**：必须是 `.eleventy.js` / `eleventy.config.js` / `eleventy.config.mjs` / `eleventy.config.cjs` 之一
- **检查导出**：ESM 用 `export default`，CJS 用 `module.exports =`
- **必须重启 dev server**：修改配置后 Ctrl+C → 重新 `npm start`

### 模板里 <span v-pre>`{% raw %}{{ var }}{% endraw %}`</span> 显示成原文，没渲染

**原因**：`.html` 默认引擎是 **Liquid**，而 <span v-pre>`{% raw %}{{ var }}{% endraw %}`</span> 在 HTML 中可能没被识别为模板语法。

**解法**：改 `htmlTemplateEngine`：

```js
return {
  htmlTemplateEngine: "njk",   // 改用 Nunjucks
};
```

### <span v-pre>`{% raw %}{{ }}{% endraw %}`</span> 在 Markdown 里被错误转义

如果想在 Markdown 中显示 <span v-pre>`{% raw %}{{ var }}{% endraw %}`</span> 原文（而不是被模板解析），用 `{% raw %}` 包裹：

```md
{% raw %}
{{ 这段不会被解析 }}
{% endraw %}
```

或者整个文件禁用模板解析：

```md
---
templateEngineOverride: md
---
```

### 静态资源（CSS / 图片）404

CSS / 图片**不会自动复制**——必须 `addPassthroughCopy`：

```js
eleventyConfig.addPassthroughCopy("src/assets");
```

### Live reload 不工作

- 检查端口是否被占用：默认 8080
- 用 `--port=3000` 指定其他端口
- 浏览器开发者工具网络面板看是否被 ad blocker 干掉

### 大型项目构建慢

加 `--incremental`：

```bash
npx @11ty/eleventy --serve --incremental
```

只重建变更文件，开发体验大幅提升。

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：模板引擎深度 / Data Cascade 5 层 / Collections 高级用法 / Filters + Shortcodes / 7 个官方插件 / WebC / 部署到各平台
- [参考](./reference.md)：CLI 命令全集 / 配置选项速查 / Front matter 字段 / Eleventy 内置变量 / 模板变量速查
