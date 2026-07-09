---
layout: doc
---

# Markdown-it

**高速、100% 遵循 CommonMark 规范的 JavaScript Markdown 解析器/渲染器**——由 **Vitaly Puzrin 与 Alex Kocharin（markdown-it 组织）** 维护，**当前 v14.x**。它把「**严格的 CommonMark**」与「**可选扩展**（表格 table、删除线 strikethrough 等 GFM 风格）」「**语言中立的排版糖**（typographer + 智能引号）」「**强大的插件系统**（`.use()`）」结合在一起。**最关键的架构认知**：markdown-it **不构建嵌套的 AST，而是先把 Markdown 解析成一串扁平的 Token 流（Token stream），再由渲染器逐 token 输出 HTML**——这正是它与 **remark/unified（基于 AST 的生态）** 的根本区别，也与 **marked（更快更简、但扩展点少）** 不同：markdown-it 在「**可扩展性 + 规范严格度 + 性能**」之间取得平衡。**核心 API 极简**：`markdownit([preset][, options])` 创建实例（**默认导出即构造器，可不加 `new`**；预设有 `commonmark` 严格模式 / `default` 全开 / `zero` 全禁），`.render(src)` 渲染成完整 HTML、`.renderInline(src)` 渲染行内（不裹 `<p>`）、`.parse(src, env)` 拿 Token 数组、`.use(plugin, ...params)` 链式加载插件、`.enable()/.disable()` 开关规则。**选项默认都偏保守/关闭**：`html: false`（**默认转义原始 HTML——安全**；设 `true` 才输出原始 HTML，**不安全、需外部 sanitizer**）、`linkify: false`（自动链接 URL）、`typographer: false`（智能引号/破折号）、`breaks: false`（`\n` 转 `<br>`）、`highlight: null`（代码高亮回调，可接 Shiki/highlight.js/Prism）。**插件生态庞大**：官方 `markdown-it-emoji` / `markdown-it-container`（`:::` 容器，VitePress 风格）/ `markdown-it-table-of-contents`，三方 `markdown-it-attrs`（`{.class #id}`）/ `markdown-it-anchor`（标题锚点）/ `markdown-it-task-lists` / `markdown-it-highlightjs` 等，以及 **VitePress 使用的 `mdit-vue` / `@mdit/plugin-*` 系列**。**底层架构**：三级解析器 **core / block / inline**，各带一条 **Ruler**（`md.core.ruler` / `md.block.ruler` / `md.inline.ruler`，可 `before` / `after` / `push` 插入自定义规则）；**`env` 沙箱对象**在一次渲染内跨组件传数据（如脚注、引用）；渲染通过 `md.renderer.rules[type]` 自定义。**典型用户群**：**需要把 Markdown 转 HTML 的一切场景**——静态站点（VitePress 底层就是 markdown-it + mdit-vue）、博客、评论系统、文档工具、富文本预览；尤其是需要**深度定制语法/渲染**的项目。

## 评价

**优点**

- **100% CommonMark 合规 + 可配严格度**：`commonmark` 预设严格遵循规范，`default` 开启 GFM 风格扩展，`zero` 全禁后自己挑——规范性与灵活性兼得
- **插件系统强大、生态庞大**：`.use()` 链式加载，npm 上 `markdown-it-*` 插件海量（锚点、容器、属性、任务列表、脚注、TOC、emoji…），几乎想要的扩展都有现成
- **Token 流模型便于定制**：扁平 token + `renderer.rules` 覆盖，**精确控制任意 token 的 HTML 输出**，比改 AST 更直接
- **高速**：经过性能优化的解析器，渲染大量 Markdown 仍快
- **安全默认**：`html: false` 默认转义原始 HTML，开箱不易 XSS（要原始 HTML 才显式开 `html: true`）
- **可接任意高亮器**：`options.highlight` 回调可接 Shiki / highlight.js / Prism，灵活
- **被广泛采用**：VitePress、众多 SSG 与文档工具的 Markdown 引擎；社区成熟、资料多
- **API 流畅**：几乎所有配置方法返回实例 `this`，可链式调用

**缺点**

- **`html: true` 不安全**：开启后**原样输出源码里的 HTML，markdown-it 本身不做 sanitize**——处理不可信输入必须配 **DOMPurify** 等外部清理（最常见的安全坑）
- **token 流不是 AST**：复杂的「按结构遍历/转换」场景（如把 Markdown 转成另一种结构化格式）不如 **remark/unified 的 AST** 顺手——markdown-it 强在「转 HTML」、弱在「转其它结构」
- **覆盖 `renderer.rules` 有坑**：很多 token 类型（`paragraph_open` / `link_open` / `heading_open` 等）**没有默认渲染规则**（走通用 `renderToken`），覆盖时需自己调 `self.renderToken` 兜底
- **`enable` / `disable` 对未知规则名抛错**：除非传第二参 `ignoreInvalid: true`
- **`quotes` 需配 `typographer`**：只设 `quotes` 不开 `typographer` 是空操作（常见困惑）
- **`env` 易混淆**：`env` 是「一次渲染内的共享数据沙箱」，**不是选项对象**——传错位置会出问题
- **vs marked**：marked 更快更小、上手更简，但扩展点远不如 markdown-it——只要简单转 HTML 可用 marked
- **vs remark/unified**：要做 Markdown→AST→深度转换/lint/跨格式，unified 生态更专业

## 文档地址

[markdown-it README](https://github.com/markdown-it/markdown-it#readme) | [API 参考](https://markdown-it.github.io/markdown-it/) | [在线 Demo](https://markdown-it.github.io/) | [架构与设计](https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md) | [npm: markdown-it](https://www.npmjs.com/package/markdown-it)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=markdown-it" target="_blank" rel="noopener noreferrer">Markdown-it 测试题</a>


## GitHub 地址

[markdown-it/markdown-it](https://github.com/markdown-it/markdown-it)（主仓库，MIT 许可）| [markdown-it 组织](https://github.com/markdown-it)（官方插件 emoji / container / footnote 等）

## 学习路径

- [入门](./getting-started.md)：markdown-it 是什么（CommonMark 解析器，token 流非 AST，对比 marked / remark） / 安装 `npm i markdown-it` / 基本用法（`markdownit()` + `.render` / `.renderInline`，预设 commonmark·default·zero） / 核心选项（`html` 安全默认、`linkify`、`typographer`、`breaks`、`highlight`） / 加载插件 `.use()` / 在 VitePress / Node 里用 / 安全（`html:true` 配 sanitizer）
- [指南](./guide-line.md)：**核心 API**（构造器/预设 / `render`·`renderInline` / `parse`·`parseInline` 拿 token / `set`·`enable`·`disable`·`configure` / `highlight` 回调的包裹规则） / **插件**（`.use(plugin, ...params)` / 常用插件清单 / VitePress 的 mdit-vue） / **Token 流与渲染器**（Token 字段 `type`·`tag`·`nesting`·`attrs`·`content` / `attrGet`·`attrSet`·`attrPush`·`attrJoin` / `renderer.rules[type]` 自定义 / `renderToken`·`renderAttrs` / 默认规则 fence·code_inline·image） / **架构**（core/block/inline 三级 Ruler 的 `before`·`after`·`push` / `env` 沙箱） / **安全**（`html` 默认转义、`html:true` 需 DOMPurify、linkify） / **常见坑**（html 不安全、覆盖 rules 需 renderToken、enable/disable 抛错、quotes 需 typographer、env 非选项）
