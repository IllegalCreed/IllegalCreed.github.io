---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Shiki v4.x**（npm 包 `shiki`，官网 [shiki.style](https://shiki.style/)；可用于 Node / 浏览器 / 构建期）。

## 速查

- 定位：**精确语法高亮器**——TextMate 语法（同 VS Code）+ VS Code 主题，输出内联样式 HTML，零运行时
- 安装：`npm i -D shiki`
- 最简用法：`import { codeToHtml } from 'shiki'` → `await codeToHtml(code, { lang: 'ts', theme: 'vitesse-dark' })`
- 复用单例：`const hl = await createHighlighter({ themes, langs })`（**v1 起由 `getHighlighter` 改名**），缓存复用
- 双主题：`{ themes: { light: 'min-light', dark: 'nord' } }` → 输出 CSS 变量 `--shiki-dark`
- 转换器：`@shikijs/transformers`（diff / 行高亮 / focus，**只加 class 需自写 CSS**）
- 引擎：Oniguruma（WASM，默认最准）/ JavaScript RegExp 引擎（更轻、可同步）
- 维护：Pine Wu 创建、Anthony Fu 维护；VitePress / Astro / Slidev 内置

## Shiki 是什么

Shiki 是 **Pine Wu** 创建、**Anthony Fu** 维护的**语法高亮器**，一句话定位：「**用 VS Code 同款引擎，把代码高亮成精确又好看的 HTML**」。

```ts
import { codeToHtml } from 'shiki'

const html = await codeToHtml('const a = 1', {
  lang: 'javascript',
  theme: 'nord',
})
// → <pre class="shiki nord" style="..."><code>...内联样式的 token...</code></pre>
```

理解 Shiki 的**核心定位**：

- **TextMate 语法 + VS Code 主题**：用真实语法做 scope 着色，结果与 VS Code 一致——比 Prism/highlight.js 精确
- **零运行时**：可在构建期/服务端高亮成静态 HTML + 内联样式，**前端无需 Shiki 的 JS**
- **代价是较重**：grammar 体积大、需异步加载——纯客户端实时高亮要权衡（或用 JS 引擎）

### 与 Prism.js / highlight.js 的区别

| 维度 | Shiki | Prism.js | highlight.js |
|---|---|---|---|
| 高亮引擎 | **TextMate 语法（同 VS Code）** | 自有正则规则 | 自有正则规则 |
| 精度 | **高（媲美 VS Code）** | 中 | 中 |
| 输出 | **内联样式 HTML** | CSS class（需主题 CSS） | CSS class |
| 运行时 | **可零运行时（构建期）** | 客户端运行时 | 客户端运行时 |
| 体积 | 较重（grammar 大、异步） | **轻** | 轻 |
| 适合 | 文档/博客构建期高亮 | 客户端实时、极小体积 | 同 Prism |

**含义**：要「VS Code 级精确 + 零运行时」选 Shiki（VitePress/Astro/博客）；要「极小体积 + 纯客户端实时」可能仍选 Prism。

## 安装

```bash
npm i -D shiki
# 或：pnpm add -D shiki
```

## 基本用法

### 方式一：简写函数（最简单，自动按需加载）

```ts
import { codeToHtml } from 'shiki'

// 自动加载并缓存所需 grammar/主题（内部用单例），async
const html = await codeToHtml(code, { lang: 'ts', theme: 'vitesse-dark' })
```

> `codeToHtml` / `codeToHast` / `codeToTokens` 是简写——内部通过 `getSingletonHighlighter` 复用一个缓存的高亮器，按需懒加载 grammar。

### 方式二：显式单例（推荐用于多次高亮）

```ts
import { createHighlighter } from 'shiki'

// 创建一次，长期复用（v1 起由 getHighlighter 改名）
const highlighter = await createHighlighter({
  themes: ['nord', 'min-light'],
  langs: ['javascript', 'typescript'],
})

// 实例方法是同步的
const html = highlighter.codeToHtml(code, { lang: 'ts', theme: 'nord' })

// 之后动态加载更多语言/主题
await highlighter.loadLanguage('css')
await highlighter.loadTheme('vitesse-dark')
```

> ⚠️ **必须把 `createHighlighter` 的实例当长生命周期单例复用**——每次创建都重新加载 WASM + grammar，在渲染里反复创建会内存泄漏/浪费。

## 双主题（明暗切换）

```ts
const html = await codeToHtml(code, {
  lang: 'js',
  themes: { light: 'min-light', dark: 'nord' }, // 用 themes 代替 theme
})
// token 输出：style="color:#1976D2;--shiki-dark:#D8DEE9"
```

双主题**不会自动切换**，需配 CSS（默认 inline 是 light，`--shiki-dark` 存暗色）：

```css
/* 用 html.dark class 切换；!important 覆盖内联色 */
html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

> `defaultColor: false` 则**只输出 CSS 变量**（无内联色，全靠自定义 CSS）；`defaultColor: 'light-dark()'` 用原生 CSS `light-dark()`（新浏览器）；`cssVariablePrefix` 改变量前缀。

## 在 markdown-it / 浏览器里用

```ts
// markdown-it（默认导出是 Shiki，async）
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
const md = MarkdownIt()
md.use(await Shiki({ theme: 'vitesse-dark' }))
```

```ts
// VitePress 内置 Shiki —— 直接在 .vitepress/config 配 markdown.theme 即可，无需手动装
```

> 浏览器实时高亮可用 `shiki/bundle/web` 或细粒度 `createHighlighterCore` + JS 引擎以减小体积。

## bundle 取舍

| 入口 | 说明 |
|---|---|
| `shiki`（完整 bundle） | 所有主题/语言（懒加载），~6.4MB min / ~1.2MB gz，最省心 |
| `shiki/bundle/web` | 面向 Web 的精简 bundle |
| `shiki/core` + 显式 import | **细粒度按需**：`createHighlighterCore` + import `@shikijs/themes/*`·`@shikijs/langs/*` + 指定 engine，bundle 最小 |

## 下一步

- [指南](./guide-line.md)：**核心 API**（单例 / 简写 / `loadLanguage`·`loadTheme` / `bundledLanguages`） / **主题与语言**（双主题 CSS 变量深度 / 自定义 JSON / `langAlias` / `text`） / **转换器**（notation `[!code ++/--/highlight/focus]` + meta `{1,3-4}` / 只加 class 需自写 CSS / hook 顺序 / `matchAlgorithm`） / **两种正则引擎**（Oniguruma vs JS RegExp + 同步高亮 `createHighlighterCoreSync`） / **细粒度打包** / **集成包**（rehype / markdown-it / twoslash / monaco / cli） / **常见坑**
