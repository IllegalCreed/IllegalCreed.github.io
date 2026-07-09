---
layout: doc
---

# Shiki

**一个精确又好看的语法高亮器（A beautiful yet powerful syntax highlighter）**——用 **VS Code 同款的 TextMate 语法**驱动、配合 **VS Code 主题**，把代码渲染成**带内联样式的 HTML**，高亮效果与你在 VS Code 里看到的**完全一致**。由 **Pine Wu（2021 年创建）** 与 **Anthony Fu（antfu，2023 年起接手维护，同时是 Vite/Vitest/UnoCSS/Slidev/VueUse 作者）** 维护，**当前 v4.x**。**核心定位认知**：与 Prism.js / highlight.js 这类「**运行时跑正则规则 + 输出 CSS class**」的传统高亮器不同，Shiki 走「**精确（accurate）+ 零运行时（zero-runtime）**」路线——基于真实 TextMate 语法做 scope 着色（精度媲美 VS Code），可在**构建期/服务端**把代码高亮成静态 HTML + 内联样式，**前端无需任何 Shiki 运行时 JS**；代价是 grammar 体积较大、传统上需**异步加载**。**历史**：曾被分叉重写为 **shikiji**（带来 ESM、细粒度按需打包、双主题等改进），后又**合并回 Shiki 主线**（官方提供「从 shikiji 迁移」指南，现直接用 `shiki` 即可）。**被广泛采用**：**VitePress / Astro / Nuxt（文档）/ Slidev** 等的代码高亮默认都是 Shiki 驱动。**核心 API**：`createHighlighter({ themes, langs })`（**v1 起由 `getHighlighter` 改名**，异步、应作长生命周期单例复用）+ 简写函数 `codeToHtml` / `codeToHast` / `codeToTokens`（自动按需加载并缓存 grammar/主题）；`codeToHtml` 输出形如 `<pre class="shiki"><code>…</code></pre>` 的内联样式 HTML。**主题与语言**：内置大量 VS Code 主题（nord、vitesse、catppuccin、min-light…）与上百种语言；**双主题** `themes: { light, dark }` 自动输出 CSS 变量（`--shiki-dark`）配合 `.dark` class 或 `prefers-color-scheme` 切换；可传自定义 TextMate/VS Code 主题与语法 JSON。**转换器** `@shikijs/transformers`：通过 `transformers: [...]` 增强高亮——`transformerNotationDiff`（`// [!code ++]`）、`transformerNotationHighlight`（`// [!code highlight]`）、`transformerNotationFocus`、`transformerMetaHighlight`（` ```js {1,3-4} `）等（**注意转换器只加 class/data 属性、不附带视觉 CSS，需自己写样式**）。**两种正则引擎**：**Oniguruma（WASM，默认、最准）** 与新的 **JavaScript RegExp 引擎**（`createJavaScriptRegexEngine`，更轻、可同步、适合浏览器/Cloudflare Workers，但部分复杂语法不兼容）。**集成包**：`@shikijs/rehype` / `@shikijs/markdown-it` / `@shikijs/twoslash`（类型悬浮）/ `@shikijs/monaco` / `@shikijs/cli`。**典型用户群**：**静态站点、文档、博客、技术幻灯片**——任何想要「VS Code 级精确高亮 + 构建期零运行时」的项目。

## 评价

**优点**

- **VS Code 级精确高亮**：用真实 TextMate 语法做 scope 着色，结果与 VS Code 编辑器一致——远比 Prism/highlight.js 的正则规则准确
- **零运行时**：可在构建期/服务端高亮成静态 HTML + 内联样式，**前端无需 Shiki 的 JS**，对性能/首屏友好
- **复用 VS Code 主题生态**：内置 nord / vitesse / catppuccin / min-light 等大量主题，也能直接用任意 VS Code 主题 JSON
- **双主题/多主题开箱**：`themes: { light, dark }` 输出 CSS 变量，配合 `.dark` class 或 `prefers-color-scheme` 一键明暗切换
- **强大的转换器生态**：`@shikijs/transformers` 提供 diff / 行高亮 / focus / 词高亮等注释式增强（VitePress 的代码块特性正基于此）
- **细粒度按需打包**：`createHighlighterCore`（`shiki/core`）+ 显式 import `@shikijs/themes/*` / `@shikijs/langs/*` 可把 bundle 压到最小
- **两种引擎可选**：默认 Oniguruma（WASM 最准）；新 JS RegExp 引擎更轻、可**同步**高亮、适合浏览器/Workers
- **生态集成丰富**：rehype / markdown-it / twoslash（类型悬浮）/ monaco / cli，被 VitePress / Astro / Slidev 等内置
- **输出 HAST 可定制**：`codeToHast` 输出 hast 树，便于 unified/rehype 管线二次加工

**缺点**

- **传统上体积较重**：完整 `shiki` bundle 很大（grammar/主题多），grammar 需**异步加载**——纯客户端实时高亮大量代码要权衡（或用 JS 引擎 + 细粒度打包）
- **`createHighlighter` 必须复用为单例**：每次创建都重新加载 WASM + grammar，**在渲染里反复 `createHighlighter` 会内存泄漏/浪费**——必须缓存复用
- **转换器不附带 CSS**：`@shikijs/transformers` 只给元素加 class / data 属性，**视觉样式（diff 的绿红底、focus 的模糊）要自己写 CSS**
- **JS 引擎不完全兼容**：新的 `createJavaScriptRegexEngine` 更轻但**部分复杂语法的正则不兼容**，需 `forgiving` 容错或回退 Oniguruma
- **API 随版本演进**：`getHighlighter` 在 v1 改名 `createHighlighter`（旧名已弃用）；从 shikiji 迁移需对照指南
- **`postprocess` 钩子仅 `codeToHtml` 触发**：用 `codeToHast` 时 `postprocess` 不执行——写转换器需注意
- **vs Prism/highlight.js 的取舍**：要「极小体积 + 客户端实时」可能仍选 Prism；要「精确 + 零运行时」选 Shiki

## 文档地址

[Shiki 官网](https://shiki.style/) | [安装与上手](https://shiki.style/guide/install) | [双主题](https://shiki.style/guide/dual-themes) | [转换器](https://shiki.style/packages/transformers) | [正则引擎](https://shiki.style/guide/regex-engines) | [Bundles 细粒度打包](https://shiki.style/guide/bundles)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=shiki" target="_blank" rel="noopener noreferrer">Shiki 测试题</a>


## GitHub 地址

[shikijs/shiki](https://github.com/shikijs/shiki)（主仓库，MIT 许可）| [Anthony Fu](https://github.com/antfu)（维护者）| [@shikijs/transformers](https://github.com/shikijs/shiki/tree/main/packages/transformers)（转换器包）

## 学习路径

- [入门](./getting-started.md)：Shiki 是什么（TextMate 语法 + VS Code 主题，对比 Prism/highlight.js，零运行时） / 安装 `npm i shiki` / 基本用法（简写 `codeToHtml` vs `createHighlighter` 单例、内联样式输出） / 双主题明暗切换 / 在 VitePress / markdown-it / 浏览器里用 / 异步与单例注意 / 完整 bundle vs 细粒度 core
- [指南](./guide-line.md)：**核心 API**（`createHighlighter` 单例 / 简写 `codeToHtml`·`codeToHast`·`codeToTokens` / `loadLanguage`·`loadTheme` / `getSingletonHighlighter` / `bundledLanguages`） / **主题与语言**（双主题 CSS 变量 + `defaultColor` + `cssVariablePrefix` + `light-dark()` / 自定义 JSON / `langAlias` / `text` 不高亮） / **转换器 `@shikijs/transformers`**（notation 系 `[!code ++/--/highlight/focus/word]` + meta 系 `{1,3-4}` / 转换器只加 class 需自写 CSS / hook 执行顺序 / `matchAlgorithm`） / **两种正则引擎**（Oniguruma WASM vs JS RegExp 引擎 + 同步高亮 `createHighlighterCoreSync`） / **细粒度打包 `createHighlighterCore`** / **集成包**（rehype / markdown-it / twoslash / monaco / cli） / **常见坑**（单例复用、转换器无 CSS、JS 引擎兼容、`postprocess` 仅 codeToHtml、getHighlighter 改名）
