---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 Shiki 的核心 API、主题/语言、转换器、正则引擎与集成，并汇总常见坑。基于 v4.x。

## 核心 API

| API | 说明 |
|---|---|
| `createHighlighter({ themes, langs })` | 异步创建高亮器（**v1 起由 `getHighlighter` 改名**）；实例方法同步；**应作长生命周期单例复用** |
| `codeToHtml(code, opts)` | → 内联样式 HTML（`<pre class="shiki">…`）；简写版 async、实例版 sync |
| `codeToHast(code, opts)` | → HAST 树（供 unified/rehype 管线二次加工；`codeToHtml` = `codeToHast` + 字符串化） |
| `codeToTokens(code, opts)` | → token 数组（自定义渲染用）；底层 `codeToTokensBase` / `codeToTokensWithThemes` |
| `highlighter.loadLanguage()` / `loadTheme()` | 创建后动态加载更多语言/主题（v1 起需显式加载） |
| `getLoadedLanguages()` / `getLoadedThemes()` / `dispose()` | 查询已加载 / 释放资源（长任务防泄漏） |
| `getSingletonHighlighter()` | 简写函数内部用的共享单例；想共享又要直接方法访问时用它 |
| `bundledLanguages` / `bundledThemes` | 所有语言/主题 ID → 动态 import 的映射（完整 bundle 的懒加载来源） |

```ts
import { createHighlighter } from 'shiki'
const hl = await createHighlighter({ themes: ['nord'], langs: ['ts'] }) // 单例
const html = hl.codeToHtml('const a=1', { lang: 'ts', theme: 'nord' })  // 同步
```

> ⚠️ `createHighlighter` **每次都新建实例**（重新加载 WASM + grammar）；要共享缓存用 `getSingletonHighlighter` 或自己缓存 `createHighlighter` 的结果。

## 主题与语言

### 双主题 / 多主题 + CSS 变量

```ts
codeToHtml(code, { lang: 'js', themes: { light: 'min-light', dark: 'nord' } })
// 默认色内联 + 其它主题写成 CSS 变量：style="color:#1976D2;--shiki-dark:#D8DEE9"
// <pre class="shiki shiki-themes min-light nord">
```

- `defaultColor`（默认 `'light'`）：哪个主题作内联默认色；**`false`** = 只出 CSS 变量、无内联色；**`'light-dark()'`** = 用原生 CSS `light-dark()`（需新浏览器 + light/dark 两主题）
- `cssVariablePrefix`（默认 `--shiki-`）：改变量前缀
- 切换：CSS 针对 `.shiki span` 用 `!important` 覆盖为 `var(--shiki-dark)`，触发条件可用 `html.dark` / `[data-theme=dark]` / `@media (prefers-color-scheme: dark)`
- 多于两个主题：再加 `dim` 等键即可

### 自定义主题/语法、别名、特殊语言

- 自定义主题/grammar = 传 JSON 对象到 `themes` / `langs` 或 `loadTheme` / `loadLanguage`
- `createCssVariablesTheme()`：生成基于 CSS 变量的主题
- `langAlias`：给语言起别名（如把 `vue-html` 映射到 `html`）
- 不高亮：`lang: 'text'`（或 `plaintext` / `plain`）

## 转换器 @shikijs/transformers

通过 `transformers: [...]` 传给 `codeToHtml` / `createHighlighter`，修改 HAST 输出。`npm i -D @shikijs/transformers`。

### Notation 系（写在代码注释里）

| 转换器 | 注释语法 |
|---|---|
| `transformerNotationDiff` | `// [!code ++]` / `// [!code --]`（增/删行） |
| `transformerNotationHighlight` | `// [!code highlight]`（可 `[!code highlight:3]`） |
| `transformerNotationFocus` | `// [!code focus]` / `[!code focus:3]` |
| `transformerNotationErrorLevel` | `// [!code error]` / `// [!code warning]` |
| `transformerNotationWordHighlight` | `// [!code word:Hello]` |

### Meta 系（写在代码围栏 meta 串里）

| 转换器 | 围栏语法 |
|---|---|
| `transformerMetaHighlight` | ` ```js {1,3-4} ` |
| `transformerMetaWordHighlight` | ` ```js /Hello/ ` |

其它：`transformerCompactLineOptions`（兼容旧 `lineOptions`）、`transformerRemoveLineBreak`、`transformerRenderWhitespace`（空白渲染成 `tab`/`space` span）。

> ⚠️ **转换器只给元素加 class / data 属性，不附带视觉 CSS**——diff 的红绿底、focus 的模糊效果**得自己写 CSS**。

### 自定义转换器（ShikiTransformer hook）

hook 执行顺序：**`preprocess`（改 code）→ `tokens`（改 token）→ `span` → `line` → `code` → `postprocess`**。

> ⚠️ `postprocess`（及 HTML 字符串阶段）**只在 `codeToHtml` 下执行**，用 `codeToHast` 时不触发。多数 notation 转换器有 `matchAlgorithm: 'v1' | 'v3'`（默认 `'v1'`）。

## 两种正则引擎

| 引擎 | 导入 | 特点 |
|---|---|---|
| **Oniguruma**（默认，WASM） | `createOnigurumaEngine(import('shiki/wasm'))` | **最大兼容性、最准**；需 WASM |
| **JavaScript RegExp** | `createJavaScriptRegexEngine()` | 更轻、浏览器/Workers 友好、**可完全同步**；**部分复杂语法不兼容**（`forgiving: true` 容错） |
| **JavaScript Raw**（预编译） | `createJavaScriptRawEngine()` | 跳过运行时正则转换，更快 |

```ts
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import nord from '@shikijs/themes/nord'

const hl = await createHighlighterCore({
  themes: [nord],
  langs: [import('@shikijs/langs/javascript')],
  engine: createJavaScriptRegexEngine(),
})
```

### 同步高亮

`createHighlighterCoreSync()`：要求所有 `themes` / `langs` 以**普通对象**传入 + 用 JS 引擎，得到**完全同步**的高亮（适合不能 await 的环境）。

## 细粒度打包

```ts
// 只打包用到的：createHighlighterCore + 显式 import + 指定 engine
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import nord from '@shikijs/themes/nord'

const hl = await createHighlighterCore({
  themes: [nord],
  langs: [import('@shikijs/langs/typescript')],
  engine: createOnigurumaEngine(import('shiki/wasm')),
})
```

## 集成包

| 包 | 用途 |
|---|---|
| `@shikijs/rehype`（`rehypeShiki`） | rehype/unified 管线高亮 |
| `@shikijs/markdown-it`（默认导出 `Shiki`，async） | `md.use(await Shiki({ theme }))` |
| `@shikijs/twoslash`（`transformerTwoslash`） | TypeScript **类型悬浮**（鼠标悬停看类型） |
| `@shikijs/monaco`（`shikiToMonaco`） | 把 Shiki 主题/语法接到 Monaco 编辑器 |
| `@shikijs/cli`（`shiki` / `skat` 命令） | 命令行高亮文件 |

> VitePress 内置 Shiki——直接配 `markdown.theme` / `markdown.codeTransformers` 即可，无需手动装。

## 常见坑

- **`createHighlighter` 必须复用单例**：反复创建重新加载 WASM/grammar，内存泄漏/浪费——缓存复用或用 `getSingletonHighlighter`
- **转换器不附带 CSS**：`@shikijs/transformers` 只加 class/data 属性，视觉样式自己写
- **`postprocess` 仅 `codeToHtml`**：用 `codeToHast` 时不触发
- **JS 引擎不完全兼容**：`createJavaScriptRegexEngine` 更轻但部分语法不兼容，需 `forgiving` 或回退 Oniguruma
- **`getHighlighter` 已改名**：v1 起用 `createHighlighter`（旧名弃用别名仍在）
- **双主题不自动切换**：需自己写 CSS 用 `!important` 覆盖 `.shiki span` 的 `--shiki-dark`
- **完整 bundle 较大**：纯客户端/Workers 用细粒度 `createHighlighterCore` + 按需 import + JS 引擎
- **简写 async、实例方法 sync**：`codeToHtml`（简写）要 await；`highlighter.codeToHtml` 创建后同步
