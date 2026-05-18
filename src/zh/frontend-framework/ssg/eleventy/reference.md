---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Eleventy 3.x（v3.1.5 稳定）。本页是 API 速查——CLI 命令、配置选项、模板变量、Filters、Shortcodes、WebC 语法、Plugin 等。

## CLI 命令

主命令是 `npx @11ty/eleventy`——所有功能通过 flag 控制。

### 基本命令

```bash
npx @11ty/eleventy              # 单次构建
npx @11ty/eleventy --serve      # 开发服务器 + live reload
npx @11ty/eleventy --watch      # 仅 watch 不开服务器
npx @11ty/eleventy --help       # 查看所有选项
npx @11ty/eleventy --version    # 查看版本（如 3.1.5）
```

### 完整 CLI 选项

| 选项 | 默认 | 作用 |
|---|---|---|
| `--input=<dir>` | `.` | 输入目录 |
| `--output=<dir>` | `_site` | 输出目录 |
| `--formats=<list>` | 全部内置 | 限定模板格式（逗号分隔） |
| `--quiet` | false | 减少日志输出 |
| `--config=<file>` | 自动检测 | 指定配置文件 |
| `--pathprefix=<prefix>` | `/` | 部署子路径前缀 |
| `--dryrun` | false | 模拟构建，不写文件 |
| `--serve` | false | 启用 dev server |
| `--port=<num>` | 8080 | dev server 端口 |
| `--watch` | false | 仅监听变更 |
| `--incremental` | false | 增量构建 |
| `--incremental=<path>` | - | 强制重建指定路径 |
| `--ignore-initial` | false | 跳过初始全量构建（v2.0+） |
| `--to=<format>` | html | 输出格式（json / ndjson 用于其他工具消费） |
| `--no-tsconfig` | false | （v3.0+）跳过 tsconfig 加载 |

### 输出格式（--to）

```bash
# 默认输出 HTML 文件
npx @11ty/eleventy

# 输出为 JSON（每页一个对象）
npx @11ty/eleventy --to=json

# 输出为 NDJSON（每行一个对象，适合管道处理）
npx @11ty/eleventy --to=ndjson
```

## 配置文件

### 配置文件名（按优先级）

```
1. .eleventy.js              # v1.x 默认
2. eleventy.config.js        # v2.0+
3. eleventy.config.mjs       # v3.0+ 推荐（ESM）
4. eleventy.config.cjs       # v2.0+（CommonJS）
```

### 配置对象（return）

```js
export default function (eleventyConfig) {
  // 各种 addXxx() ...

  return {
    dir: { input, output, includes, layouts, data },
    markdownTemplateEngine,
    htmlTemplateEngine,
    templateFormats,
    pathPrefix,
    dataTemplateEngine,  // ⚠️ 已废弃
  };
}
```

### dir 配置

| 字段 | 默认 | 作用 |
|---|---|---|
| `input` | `.` | 输入目录（相对项目根） |
| `output` | `_site` | 输出目录（相对项目根） |
| `includes` | `_includes` | layouts / partials 目录（相对 input） |
| `layouts` | = `includes` | layouts 子目录（如果想分离） |
| `data` | `_data` | 全局数据目录（相对 input） |

### 模板引擎配置

| 字段 | 默认 | 作用 |
|---|---|---|
| `markdownTemplateEngine` | `liquid` | `.md` 文件的预处理引擎（`njk` / `liquid` / `false`） |
| `htmlTemplateEngine` | `liquid` | `.html` 文件的引擎 |
| `templateFormats` | 全部内置 | 处理的文件类型（数组 / 字符串） |

### 其他根字段

| 字段 | 默认 | 作用 |
|---|---|---|
| `pathPrefix` | `/` | URL 前缀（用 `--pathprefix` 也可） |
| `dataFileSuffixes` | `[".11tydata", ""]` | 数据文件后缀 |
| `dataFileBaseName` | `index` | 目录数据默认名 |

## eleventyConfig API（在配置文件中使用）

### 目录配置

```js
eleventyConfig.setInputDirectory("src");
eleventyConfig.setOutputDirectory("_site");
eleventyConfig.setIncludesDirectory("_includes");
eleventyConfig.setLayoutsDirectory("layouts");      // 可选
eleventyConfig.setDataDirectory("_data");
```

### 模板格式 / 引擎

```js
eleventyConfig.setTemplateFormats(["html", "md", "njk"]);
eleventyConfig.addTemplateFormats(["webc"]);

// Markdown 引擎覆盖
import markdownIt from "markdown-it";
eleventyConfig.setLibrary("md", markdownIt({ html: true, linkify: true }));

// Liquid 引擎覆盖
eleventyConfig.setLiquidOptions({ strictFilters: true });

// Nunjucks 引擎覆盖
eleventyConfig.setNunjucksEnvironmentOptions({ throwOnUndefined: true });
```

### Filters

```js
// 通用 filter（Liquid + Nunjucks + 11ty.js + WebC + MD 都可用）
eleventyConfig.addFilter("name", function (value) { return value; });

// 异步通用 filter（v2.0+）
eleventyConfig.addAsyncFilter("name", async function (value) { return value; });

// 引擎特定 filter
eleventyConfig.addLiquidFilter("name", function (value) { return value; });
eleventyConfig.addNunjucksFilter("name", function (value) { return value; });
eleventyConfig.addNunjucksAsyncFilter("name", function (value, cb) { cb(null, value); });
eleventyConfig.addJavaScriptFunction("name", function (value) { return value; });

// 获取已注册的 filter
const filter = eleventyConfig.getFilter("url");
const result = filter("/about");
```

### Shortcodes

```js
// 通用 shortcode
eleventyConfig.addShortcode("name", function (...args) { return ""; });
eleventyConfig.addPairedShortcode("name", function (content, ...args) { return ""; });

// 异步
eleventyConfig.addAsyncShortcode("name", async function (...args) { return ""; });
eleventyConfig.addPairedAsyncShortcode("name", async function (content, ...args) { return ""; });

// 引擎特定
eleventyConfig.addLiquidShortcode("name", ...);
eleventyConfig.addLiquidPairedShortcode("name", ...);
eleventyConfig.addNunjucksShortcode("name", ...);
eleventyConfig.addNunjucksPairedShortcode("name", ...);
eleventyConfig.addNunjucksAsyncShortcode("name", ...);
```

### Collections

```js
// 自定义 collection
eleventyConfig.addCollection("name", function (collectionApi) {
  return collectionApi.getFilteredByTag("post").reverse();
});

// 异步 collection（v3.0+）
eleventyConfig.addCollection("name", async function (collectionApi) {
  const data = await fetch(...);
  return data;
});
```

### 全局数据

```js
// 静态值
eleventyConfig.addGlobalData("key", "value");
eleventyConfig.addGlobalData("nested.path", "value");  // lodash-set 路径

// 函数（每次构建都执行）
eleventyConfig.addGlobalData("dynamicKey", () => new Date());

// 异步
eleventyConfig.addGlobalData("asyncKey", async () => {
  return await fetch("...").then((r) => r.json());
});
```

### Layouts

```js
// 别名
eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
eleventyConfig.addLayoutAlias("page", "layouts/page.njk");
```

### Passthrough Copy

```js
// 目录 / 文件
eleventyConfig.addPassthroughCopy("src/assets");
eleventyConfig.addPassthroughCopy("src/robots.txt");

// Glob
eleventyConfig.addPassthroughCopy("src/**/*.{png,jpg,gif,svg,webp,avif}");

// 路径映射
eleventyConfig.addPassthroughCopy({
  "src/assets/img": "images",
  "node_modules/lib/dist": "vendor"
});

// dev server 模式
eleventyConfig.setServerPassthroughCopyBehavior("passthrough"); // 或 "copy"
```

### Watch Targets

```js
// 让 dev server 监听额外目录（不参与构建但触发 reload）
eleventyConfig.addWatchTarget("./src/styles/");
eleventyConfig.addWatchTarget("./node_modules/lib/dist/");

// 忽略 watch（v3.0+）
eleventyConfig.watchIgnores.add("./src/temp/");
```

### Plugins

```js
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";

eleventyConfig.addPlugin(pluginRss);
eleventyConfig.addPlugin(pluginNavigation, {
  /* options */
});
```

### Transforms（输出修改）

```js
// 在所有文件写入前转换内容
eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
  if (outputPath?.endsWith(".html")) {
    return minify(content);
  }
  return content;
});

// 异步
eleventyConfig.addTransform("name", async function (content, outputPath) {
  return await processSomething(content);
});
```

### Linters（输出检查）

```js
// 检查内容但不修改
eleventyConfig.addLinter("inclusive-language", function (content) {
  if (this.inputPath?.endsWith(".md")) {
    if (/\b(simply|obviously)\b/i.test(content)) {
      console.warn(`Word check failed: ${this.inputPath}`);
    }
  }
});
```

### Data Extensions（v1.0+）

```js
// 支持 .yaml / .yml 数据文件
import yaml from "js-yaml";

eleventyConfig.addDataExtension("yaml,yml", (contents) => {
  return yaml.load(contents);
});
```

### Bundle（v3.0+ 内置）

```js
// 默认已注册 css / js / html 三个 bundle
// 在模板里用 {% css %} / {% js %} / {% getBundle %}

// 自定义 bundle
eleventyConfig.addBundle("svg", {
  outputFileExtension: "svg",
  hoist: true,
});
```

### 其他常用

```js
// Quiet mode
eleventyConfig.setQuietMode(true);

// 改变默认模板引擎
eleventyConfig.setMarkdownTemplateEngine("njk");
eleventyConfig.setHtmlTemplateEngine("njk");

// Front matter parsing 选项
eleventyConfig.setFrontMatterParsingOptions({
  excerpt: true,
  excerpt_separator: "<!-- excerpt -->",
});

// 路径前缀
eleventyConfig.setPathPrefix("/blog/");

// Dev server 选项（v2.0+）
eleventyConfig.setServerOptions({
  port: 8080,
  liveReload: true,
  domDiff: true,
  showAllHosts: false,
  https: {},  // { key: "...", cert: "..." }
});
```

## Front matter 字段

| 字段 | 类型 | 作用 |
|---|---|---|
| `title` | string | 页面标题 |
| `date` | string \| 关键字 | 日期（影响排序） |
| `layout` | string | 关联 layout（如 `post` 或 `post.njk`） |
| `tags` | string \| string[] | Collections 分组 |
| `permalink` | string \| false | URL（false = 不生成文件） |
| `templateEngineOverride` | string \| false | 强制改模板引擎 |
| `eleventyExcludeFromCollections` | boolean \| string[] | 排除出 collections |
| `eleventyImport` | object | 声明 collection 依赖 |
| `eleventyComputed` | object | 计算属性 |
| `eleventyNavigation` | object | 配合 navigation 插件 |
| `pagination` | object | 分页配置 |
| `dataExtension` | object | 扩展数据文件 |

### date 关键字

| 关键字 | 含义 |
|---|---|
| `Created` | 文件创建时间（ctime） |
| `Last Modified` | 文件修改时间（mtime） |
| `git Created` | Git 首次提交时间 |
| `git Last Modified` | Git 最近提交时间 |

### pagination 字段

```yml
pagination:
  data: collections.post       # 数据源
  size: 10                     # 每页项目数
  alias: posts                 # 重命名（默认是 pagination.items[0]）
  reverse: false               # 反向
  filter: ["draft"]            # 排除值
  before: |                    # 自定义预处理函数
    function (data) { return data.filter(...); }
  generatePageOnEmptyData: false
  addAllPagesToCollections: false
```

### eleventyNavigation 字段

```yml
eleventyNavigation:
  key: 唯一 key
  parent: 父级 key
  order: 数字（同级排序）
  title: 显示文本（默认用 page.title）
  url: 链接（默认用 page.url）
  excerpt: 简介
```

## 模板变量（Eleventy Supplied Data）

### page 对象

| 字段 | 类型 | 说明 |
|---|---|---|
| `page.url` | string | 完整 URL（含 pathPrefix），如 `/blog/hello/` |
| `page.fileSlug` | string | 不带扩展名的文件名，如 `hello` |
| `page.filePathStem` | string | 完整路径（不含扩展），如 `/posts/hello` |
| `page.date` | Date | JS Date 对象 |
| `page.inputPath` | string | 输入路径，如 `./src/posts/hello.md` |
| `page.outputPath` | string | 输出路径，如 `./_site/posts/hello/index.html` |
| `page.outputFileExtension` | string | 输出后缀（默认 `html`） |
| `page.templateSyntax` | string | 处理引擎链（v2.0+），如 `md,njk` |
| `page.rawInput` | string | 原始模板源码（v3.0+） |
| `page.lang` | string | 语言（i18n 启用时） |

### eleventy 对象（v1.0+）

| 字段 | 类型 | 说明 |
|---|---|---|
| `eleventy.version` | string | 如 `3.1.5` |
| `eleventy.generator` | string | 用于 meta，如 `Eleventy v3.1.5` |
| `eleventy.env.root` | string | 项目根目录绝对路径 |
| `eleventy.env.config` | string | 配置文件绝对路径 |
| `eleventy.env.source` | `"cli"` \| `"script"` | 调用方式 |
| `eleventy.env.runMode` | `"serve"` \| `"watch"` \| `"build"` | 运行模式 |
| `eleventy.directories.input` | string | 输入目录（相对路径） |
| `eleventy.directories.includes` | string | includes 目录 |
| `eleventy.directories.layouts` | string | layouts 目录 |
| `eleventy.directories.data` | string | 数据目录 |
| `eleventy.directories.output` | string | 输出目录 |

### collections 对象

| 字段 | 说明 |
|---|---|
| `collections.all` | 所有页面（包括无 tag） |
| `collections.<tag>` | 带 `tags: <tag>` 的页面 |
| 自定义 collection key | 通过 `addCollection` 注册 |

每个 collection item 结构：

```js
{
  page: { url, inputPath, ... },
  data: { /* 所有数据 */ },
  content: "渲染后 HTML（不含 layout）",
  rawInput: "原始源码",   // v3.0+
  url: "/...",
  date: Date,
}
```

### pagination 对象（在分页页面里）

| 字段 | 说明 |
|---|---|
| `pagination.items` | 当前页项目数组 |
| `pagination.pageNumber` | 0-indexed 页号 |
| `pagination.hrefs` | 所有页 URL 数组 |
| `pagination.href.first` | 第一页 URL |
| `pagination.href.last` | 最后一页 URL |
| `pagination.href.next` | 下一页 URL |
| `pagination.href.previous` | 上一页 URL |
| `pagination.pages` | 所有页数据数组 |

### pkg 对象

| 字段 | 说明 |
|---|---|
| `pkg.name` | package.json 的 name |
| `pkg.version` | package.json 的 version |
| `pkg.description` | package.json 的 description |
| ... 其他 | package.json 所有字段 |

## 内置 Filters

### url

规范化 URL，自动加 pathPrefix：

<div v-pre>

```njk
{{ "/about/" | url }}            → /about/（默认）
{{ "/about/" | url }}            → /blog/about/（pathPrefix=/blog/）
```

</div>

### slugify

转 URL 友好字符串：

<div v-pre>

```njk
{{ "Hello World!" | slugify }}   → hello-world
{{ "中文标题" | slugify }}        → 中文标题（保留 unicode）
```

</div>

### slug（兼容旧版）

```njk
{{ "Hello World" | slug }}      → hello-world
```

### log

在模板中 console.log（调试用）：

<div v-pre>

```njk
{{ page | log }}                 → 在终端打印 page 对象
```

</div>

### getCollectionItem / getPreviousCollectionItem / getNextCollectionItem

```njk
{% set current = collections.post | getCollectionItem(page) %}
{% set prev = collections.post | getPreviousCollectionItem(page) %}
{% set next = collections.post | getNextCollectionItem(page) %}
```

### inputPathToUrl

```njk
{{ "./src/posts/hello.md" | inputPathToUrl }}    → /posts/hello/
```

## RSS Plugin Filters

需要 `@11ty/eleventy-plugin-rss`：

| Filter | 作用 |
|---|---|
| `dateToRfc3339` | 日期转 RFC 3339（Atom） |
| `dateToRfc822` | 日期转 RFC 822（RSS 2.0） |
| `getNewestCollectionItemDate` | 获取 collection 中最新日期 |
| `absoluteUrl` | 转绝对 URL |
| `htmlToAbsoluteUrls` | HTML 内所有相对链接转绝对 |

## 内置 Bundle Plugin（v3.0+）

```njk
<!-- 在模板中收集 CSS -->
{% css %}
.alert { color: red; }
{% endcss %}

<!-- 收集 JS -->
{% js %}
console.log("hello");
{% endjs %}

<!-- 在 layout 输出 -->
<style>{% getBundle "css" %}</style>
<script>{% getBundle "js" %}</script>

<!-- 或写入文件 + 链接 -->
<link rel="stylesheet" href="{% getBundleFileUrl "css" %}">
<script src="{% getBundleFileUrl "js" %}"></script>
```

## Permalinks 模板变量

permalink 字符串中可用：

```yml
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}/"
```

| 变量 | 说明 |
|---|---|
| `page.fileSlug` | 文件名（不含扩展） |
| `page.filePathStem` | 完整路径（不含扩展） |
| `page.date` | JS Date 对象 |
| 任何 Data Cascade 变量 | 都可访问 |

### 特殊 permalink 值

| 值 | 行为 |
|---|---|
| `false` | 不输出文件（但保留在 collections） |
| `true` | 默认行为 |
| 字符串以 `/` 结尾 | 自动加 `index.html` |
| 字符串含扩展名 | 按原样输出（如 `/sitemap.xml`） |

## WebC 语法速查

### 属性绑定

| 语法 | 作用 |
|---|---|
| `attr="x"` | 字面量属性 |
| `:attr="expr"` | JS 表达式属性（动态） |
| `@attr="expr"` | 服务端"私有"属性（不出现在 HTML） |
| `@text="expr"` | 文本内容（HTML 转义） |
| `@html="expr"` | HTML 内容（不转义） |
| `@raw="expr"` | 原始输出（特殊） |

### 控制流

| 语法 | 作用 |
|---|---|
| `webc:if="expr"` | 条件渲染 |
| `webc:elseif="expr"` | else if |
| `webc:else` | else |
| `webc:for="item of list"` | 循环 |

### 元素行为

| 语法 | 作用 |
|---|---|
| `webc:keep` | 保留标签（默认无 CSS/JS 的会剥离） |
| `webc:nokeep` | 强制剥离标签（即使有 CSS/JS） |
| `webc:scoped` | scoped CSS（自动生成 class） |
| `webc:bucket="name"` | CSS/JS 输出到指定 bucket |
| `webc:root` | 标记为组件根 |
| `webc:raw` | 不解析内部内容 |
| `webc:import="path"` | 导入组件 |

### 模板嵌入

```html
<!-- 嵌入其他 Eleventy 模板引擎 -->
<template webc:type="11ty" 11ty:type="md">
  # Markdown 内容
</template>

<template webc:type="11ty" 11ty:type="liquid">
  {{ title }}
</template>

<!-- 嵌入服务端 JS -->
<script webc:type="js" webc:root>
  `<p>${data.title}</p>`;
</script>
```

## 11ty.js 模板 API

```js
// src/page.11ty.js
export default class {
  // 1. 数据（front matter 等价物）
  data() {
    return {
      title: "Page",
      layout: "base.njk",
      permalink: "/page/",
      tags: ["page"],
      // 任意 front matter 字段
    };
  }

  // 2. 渲染函数（必需）
  render(data) {
    return `<h1>${data.title}</h1>`;
  }
}

// 或者函数式
export const data = { title: "Page", layout: "base.njk" };
export function render(data) {
  return `<h1>${data.title}</h1>`;
}
```

## Plugin 列表

### 官方插件（`@11ty/*`）

| 插件 | npm | 作用 |
|---|---|---|
| `@11ty/eleventy-img` | `npm install @11ty/eleventy-img` | 图像优化（AVIF / WebP / srcset） |
| `@11ty/eleventy-plugin-rss` | `npm install @11ty/eleventy-plugin-rss` | RSS / Atom feed |
| `@11ty/eleventy-plugin-syntaxhighlight` | `npm install @11ty/eleventy-plugin-syntaxhighlight` | PrismJS 代码高亮 |
| `@11ty/eleventy-navigation` | `npm install @11ty/eleventy-navigation` | 层级导航 / 面包屑 |
| `@11ty/eleventy-plugin-webc` | `npm install @11ty/eleventy-plugin-webc` | WebC 组件 |
| `@11ty/eleventy-fetch` | `npm install @11ty/eleventy-fetch` | 缓存的 HTTP fetch |
| `@11ty/eleventy-plugin-bundle` | 内置 | CSS/JS bundle（v3.x 内置） |
| `I18nPlugin`（内置导入） | `import { I18nPlugin } from "@11ty/eleventy"` | 国际化 |

### 常用社区插件

| 插件 | 作用 |
|---|---|
| `eleventy-plugin-toc` | 自动生成 Table of Contents |
| `eleventy-plugin-svg-contents` | SVG 内联 |
| `@photogabble/eleventy-plugin-interlinker` | Wiki 风格内链 `[[Page]]` |
| `@aloskutov/eleventy-plugin-external-links` | 给外链加 `target="_blank"` + `rel="noopener"` |
| `eleventy-plugin-pwa` | PWA 支持（service worker） |
| `pagefind` | 客户端搜索（非 plugin，单独运行） |

## 部署环境变量

Eleventy 在不同环境会自动设置：

```bash
# 自动检测
ELEVENTY_ENV=production       # 生产环境构建
ELEVENTY_RUN_MODE=build       # build / serve / watch
```

可在配置 / 模板中读：

```js
const isProduction = process.env.ELEVENTY_ENV === "production";

eleventyConfig.addGlobalData("isProduction", isProduction);
```

```njk
{% if isProduction %}
  <script async src="https://analytics.example.com/script.js"></script>
{% endif %}
```

## Data Cascade 优先级（从高到低）

```
1. Computed Data                          ← 最高
2. Front Matter in Templates
3. Template Data Files (xxx.json/.js)
4. Directory Data Files (dir/dir.json)
5. Front Matter in Layouts
6. Configuration API addGlobalData
7. Global Data Files (_data/*)           ← 最低
```

冲突时：

- **基础类型**：高优先级**覆盖**低
- **对象 / 数组**：**深合并**（除非用 `override:` 前缀）

```yml
# 覆盖而非合并
override:tags:
  - only-this
```

## 默认 templateFormats

```
html, liquid, ejs, md, hbs, mustache, haml, pug, njk, 11ty.js, webc
```

可在配置里限定：

```js
eleventyConfig.setTemplateFormats(["html", "md", "njk", "11ty.js"]);
```

或通过 CLI：

```bash
npx @11ty/eleventy --formats=html,md,njk
```

## 版本变迁要点

| 版本 | 关键变化 |
|---|---|
| 3.x（v3.1.5 当前） | ESM 优先 / `eleventyImport` 支持增量构建 / Bundle Plugin 内置 / WebC plugin 一等公民 / 冻结 supplied data |
| 2.x | 异步 filter / shortcode / collection（`addAsyncFilter` 等）/ Dev server 替换 BrowserSync |
| 1.x | 添加 `eleventyConfig.addPlugin()` / Eleventy supplied data（`page` / `eleventy`） |
| 0.x | 初始版本 |

## 学习资源

- [11ty.dev](https://www.11ty.dev/) - 官方站
- [11ty Docs](https://www.11ty.dev/docs/) - 完整文档
- [Eleventy GitHub](https://github.com/11ty/eleventy)
- [Eleventy Discord](https://www.11ty.dev/blog/discord/) - 官方社群
- [Eleventy Meetup](https://www.11ty.dev/blog/eleventy-meetup-9/) - 线上聚会
- [Learn Eleventy from Scratch](https://learneleventyfromscratch.com/) - Andy Bell 的著名教程
- [11ty starter 模板列表](https://www.11ty.dev/docs/starter/)
- [Eleventy Leaderboards](https://www.11ty.dev/leaderboards/) - 案例展示

## 常见报错速查

### `[11ty] Cannot find module ...`

未安装依赖：`npm install`。

### `Invalid template engine: liquid`

引擎拼写错误，或 dependencies 损坏：删 `node_modules/` 重装。

### `Layout 'xxx.njk' not found`

- 检查 `_includes/` 是否有这个文件
- 检查 `dir.includes` 配置
- 检查是否注册了 `addLayoutAlias`

### `ENOENT: no such file or directory, open './_site/xxx'`

构建目录权限问题 / 之前未运行 build：先 `npx @11ty/eleventy` 一次。

### `Could not find a valid configuration file`

配置文件名不对：必须是 `.eleventy.js` / `eleventy.config.js` / `.mjs` / `.cjs` 之一。

### `EBUSY: resource busy or locked`（Windows）

dev server 占用文件：杀掉 Node 进程 `taskkill /F /IM node.exe`。

### Live Reload 不刷新

- 浏览器扩展（uBlock / AdGuard）拦截 `localhost` WebSocket → 临时关闭
- 防火墙拦截 → 改用 `--port=3000`
- 用 `--quiet` 时日志少，确认 build 是否真的成功
