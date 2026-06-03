---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **markdown-it v14.x**（npm 包 `markdown-it`，GitHub markdown-it/markdown-it；Node + 浏览器通用）。

## 速查

- 定位：**高速、100% CommonMark 的 Markdown 解析器/渲染器**，token 流模型（非 AST），插件化
- 安装：`npm i markdown-it`
- 创建：`import markdownit from 'markdown-it'` → `const md = markdownit()`（默认导出即构造器，可不加 `new`）
- 渲染：`md.render(src)` → 完整 HTML；`md.renderInline(src)` → 行内（不裹 `<p>`）
- 拿 token：`md.parse(src, env)` → `Token[]`
- 预设：`markdownit('commonmark')` 严格 / `markdownit()` default 全开 / `markdownit('zero')` 全禁
- 关键选项：`html`（默 false 转义，**true 不安全**）、`linkify`、`typographer`、`breaks`、`highlight`
- 插件：`md.use(plugin, opts)` 链式
- 安全：处理不可信输入且 `html:true` 时**必须**配 DOMPurify 等 sanitizer

## markdown-it 是什么

markdown-it 是 **Vitaly Puzrin 与 Alex Kocharin** 维护的 **Markdown 解析器/渲染器**，一句话定位：「**高速、规范、可深度定制的 Markdown→HTML 引擎**」。

```js
import markdownit from 'markdown-it'

const md = markdownit()
const html = md.render('# markdown-it rulezz!')
// → <h1>markdown-it rulezz!</h1>
```

理解 markdown-it 的**核心定位**：

- **100% CommonMark + 扩展**：严格遵循 CommonMark，可选开启 GFM 风格扩展（表格、删除线）与排版糖
- **Token 流，不是 AST**：先 parse 成扁平 Token 数组，再逐 token 渲染——定制渲染靠覆盖 `renderer.rules`
- **插件化**：`.use()` 加载海量 `markdown-it-*` 插件
- **安全默认**：`html: false` 默认转义原始 HTML

### 与 marked / remark 的区别

| 维度 | markdown-it | marked | remark / unified |
|---|---|---|---|
| 模型 | **Token 流** | Token/直接渲染 | **AST（mdast）** |
| 规范 | **100% CommonMark** | CommonMark/GFM | CommonMark + 生态 |
| 扩展 | **插件丰富、定制强** | 较少 | **AST 转换最强** |
| 速度 | 快 | **更快更小** | 较重 |
| 适合 | 转 HTML + 深度定制渲染 | 简单快速转 HTML | Markdown→AST→转换/lint |

**含义**：要「转 HTML + 丰富插件 + 定制渲染」选 markdown-it（VitePress 底层）；只要简单快速可用 marked；要 AST 级转换/lint 用 remark/unified。

## 安装

```bash
npm i markdown-it
# 浏览器也可 CDN：<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js">
```

## 基本用法

### 创建实例与预设

```js
import markdownit from 'markdown-it'

const md = markdownit()                 // default：全开（GFM 风格扩展）
const strict = markdownit('commonmark') // 严格 CommonMark
const minimal = markdownit('zero')      // 全禁，自己挑规则开
const custom = markdownit('zero', { html: true }) // 预设 + 选项组合
```

### render vs renderInline

```js
md.render('**bold**')        // → <p><strong>bold</strong></p>（块级，裹 <p>）
md.renderInline('**bold**')  // → <strong>bold</strong>（行内，不裹 <p>）
```

### 核心选项

```js
const md = markdownit({
  html: false,        // 默认 false：转义源码里的原始 HTML（安全）。true=原样输出（不安全！）
  linkify: true,      // 自动把 URL 文本变成链接
  typographer: true,  // 智能引号、破折号等排版糖
  breaks: false,      // true: 段落内 \n 转 <br>
  langPrefix: 'language-', // 代码块 class 前缀
  quotes: '“”‘’',     // 智能引号字符（仅 typographer 开启时生效）
})
```

> ⚠️ `quotes` **只在 `typographer: true` 时生效**；只设 `quotes` 不开 typographer 是空操作。

### 接入语法高亮

```js
import hljs from 'highlight.js'

const md = markdownit({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(str, { language: lang }).value } catch {}
    }
    return '' // 返回 '' → 用 markdown-it 默认转义
  },
})
```

> 若 `highlight` 返回的字符串**以 `<pre` 开头**，markdown-it 会**跳过自己的 `<pre><code>` 包裹**；否则它会再包一层。

## 加载插件

```js
import markdownit from 'markdown-it'
import anchor from 'markdown-it-anchor'
import container from 'markdown-it-container'

const md = markdownit()
  .use(anchor, { permalink: anchor.permalink.headerLink() }) // 标题锚点
  .use(container, 'warning')                                  // ::: warning 容器
```

> 插件签名是 `function(md, ...params) {}`，**直接修改传入的 md 实例**并返回它，所以可链式 `.use().use()`。

## 在 VitePress / Node 里用

```js
// VitePress 底层就是 markdown-it + mdit-vue，可在 config 里扩展：
export default {
  markdown: {
    config(md) {
      md.use(myPlugin)   // 注入自定义 markdown-it 插件
    },
  },
}
```

## 安全：html 与 sanitizer

```js
// 处理不可信输入：要么保持 html:false（默认转义，安全），
// 要么 html:true + 外部 sanitizer
import DOMPurify from 'dompurify'

const md = markdownit({ html: true })   // ⚠️ 原样输出 HTML，markdown-it 不 sanitize
const dirty = md.render(userInput)
const safe = DOMPurify.sanitize(dirty)  // 必须再清理
```

> **markdown-it 本身不做 XSS 过滤**。默认 `html: false` 已转义原始 HTML 标签是安全的；一旦 `html: true`，处理用户内容**必须**配 DOMPurify 等。

## 下一步

- [指南](./guide-line.md)：**核心 API**（预设 / `parse`·`parseInline` 拿 token / `set`·`enable`·`disable`·`configure` / `highlight` 包裹规则） / **插件**（`.use` 机制 / 常用插件清单 / mdit-vue） / **Token 流与渲染器**（Token 字段 `nesting`·`attrs`·`content` / `attrGet`·`attrSet`·`attrPush`·`attrJoin` / `renderer.rules[type]` 覆盖 / `renderToken` 兜底 / 默认规则） / **架构**（core/block/inline 三级 Ruler 的 `before`·`after`·`push` / `env` 沙箱） / **安全 & 常见坑**
