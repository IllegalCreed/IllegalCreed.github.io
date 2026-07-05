---
layout: doc
outline: [2, 3]
---

# 编译流程：@mdx-js/mdx 与插件生态

> 基于 MDX v3 · 核于 2026-07

## 速查

- **核心包**：`@mdx-js/mdx` 是编译器，各打包器集成包都是对它的封装。
- **编译管线**：MDX → **mdast**（Markdown 树，remark 层）→ **hast**（HTML 树，rehype 层）→ **estree**（JS 树，recma 层）→ 序列化成 JavaScript。
- **三组 API**：`compile()`/`compileSync()` 只编译出 JS；`evaluate()`/`evaluateSync()` 编译并**就地运行**得到组件（需内容可信）；`run()`/`runSync()` 执行 `outputFormat: 'function-body'` 编译出的代码。
- **插件三层**：`remarkPlugins`（mdast/Markdown 层）、`rehypePlugins`（hast/HTML 层）、`recmaPlugins`（estree/JS 层）——选层决定能拿到的节点。
- **核心 options**：`jsx`（默认 `false`）、`jsxImportSource`（默认 `'react'`）、`jsxRuntime`（默认 `'automatic'`）、`providerImportSource`、`development`（默认 `false`）、`outputFormat`（`'program'` 默认 / `'function-body'`）、`format`（`'detect'` 默认 / `'md'` / `'mdx'`）、`baseUrl`、`elementAttributeNameCase`（默认 `'react'`）。
- **常用插件**：GFM → `remark-gfm`；frontmatter → `remark-frontmatter` + `remark-mdx-frontmatter`；数学 → `remark-math` + `rehype-katex`；语法高亮 → `rehype-highlight` / `rehype-starry-night`（rehype 层）。
- **输出结构**：默认导出 `MDXContent`（对外包装、处理 wrapper 布局），内部委托 `_createMdxContent` 渲染主体。

## 一、编译管线：三层 AST

MDX 的编译是一条清晰的多层 AST 转换链，理解它才能对号入座地选对插件：

```
MDX 源文本
  │  remark-parse + remark-mdx
  ▼
mdast（Markdown 语法树）   ← remarkPlugins 在这里工作
  │  remark-rehype
  ▼
hast（HTML 语法树）        ← rehypePlugins 在这里工作
  │  rehype-recma
  ▼
estree（JavaScript 语法树） ← recmaPlugins 在这里工作
  │  序列化
  ▼
JavaScript 模块（默认导出组件）
```

- **remark 插件**工作在 **mdast**（Markdown 层），适合处理 Markdown 级语法：GFM 表格/删除线、frontmatter、数学公式解析。
- **rehype 插件**工作在 **hast**（HTML 层），适合更接近 HTML 输出的变换：语法高亮（处理 `pre`/`code` 节点）、给标题加锚点。
- **recma 插件**工作在 **estree**（JS 层，管线最后一段），适合直接改写生成的 JavaScript：注入额外 `export`、改写组件函数。

选错层会拿不到期望的节点——比如想给代码块加高亮却挂到 remark 层，就拿不到 HTML 结构。

## 二、三组 API：compile / evaluate / run

`@mdx-js/mdx` 暴露三组函数，对应不同使用方式：

```js
import {compile, evaluate, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

// 1) compile：只编译出 JS 代码（字符串/VFile），交给打包器或写文件
const code = String(await compile('# Hi {1 + 1}'))

// 2) evaluate：编译 + 就地运行，直接拿到组件（需内容可信）
const {default: Content} = await evaluate('# Hi', {...runtime})

// 3) run：执行 outputFormat:'function-body' 编译出的代码
const compiled = String(
  await compile(file, {outputFormat: 'function-body'})
)
const {default: C} = await run(compiled, {...runtime, baseUrl: import.meta.url})
```

- **`compile`**（有同步版 `compileSync`）：只做编译，产出可运行的 JS，你负责后续运行——**最推荐**，安全可缓存。
- **`evaluate`**（`evaluateSync`）：编译并在当前进程执行，方便但**要求内容可信**（等于执行任意代码）。
- **`run`**（`runSync`）：执行 `function-body` 代码，是「MDX on demand」的运行侧。

::: warning 安全优先
官方建议：能用 `compile` 就用 `compile`（编译后落文件再运行）。`evaluate`/`run` 只用于**信任的内容**——MDX 是编程语言，运行不可信内容等于开后门。
:::

## 三、核心编译选项

`compile`/`evaluate` 接受一组关键 options：

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `jsx` | `false` | `false` 把 JSX 编译成 `jsx()` 调用；`true` **保留** JSX，交下游打包器再转 |
| `jsxImportSource` | `'react'` | 自动 runtime 的导入来源（Preact `'preact'`、Vue `'vue'`、Solid `'solid-js/h'`） |
| `jsxRuntime` | `'automatic'` | 自动/经典 runtime；v3 默认并推荐 automatic |
| `providerImportSource` | — | 设它（如 `@mdx-js/react`）才能从 Provider 上下文取组件 |
| `development` | `false` | `true` 用开发版 runtime + 注入调试信息（报错定位到 MDX 行列） |
| `outputFormat` | `'program'` | `program` 完整 ESM 程序；`function-body` 函数体（配合 `run`/`evaluate`） |
| `format` | `'detect'` | `mdx` 启用 JSX/表达式；`md` 按纯 Markdown；`detect` 按 `.md`/`.mdx` 后缀判断 |
| `baseUrl` | — | 解析相对导入并设 `import.meta.url`；v3 在 `evaluate`/`run`/`function-body` 且含 import/export 时**必传** |
| `elementAttributeNameCase` | `'react'` | 属性名按 React（`className`/`htmlFor`）或 `'html'` 命名 |

```js
await compile(file, {
  remarkPlugins: [/* ... */],
  rehypePlugins: [/* ... */],
  recmaPlugins: [/* ... */],
  jsxImportSource: 'react',
  development: process.env.NODE_ENV !== 'production',
})
```

## 四、三层插件生态

三类插件分别传入对应数组，各在其 AST 层工作：

- **`remarkPlugins`**（mdast/Markdown 层）
- **`rehypePlugins`**（hast/HTML 层）
- **`recmaPlugins`**（estree/JS 层）

官方指南推荐的常用插件按层归位：

| 需求 | 插件 | 层 |
| --- | --- | --- |
| GFM（表格/删除线/任务列表/自动链接） | `remark-gfm` | remark |
| frontmatter（YAML 元数据） | `remark-frontmatter` + `remark-mdx-frontmatter` | remark |
| 数学公式（LaTeX） | `remark-math` + `rehype-katex` | remark + rehype |
| 语法高亮 | `rehype-highlight` / `rehype-starry-night` | rehype |
| 标题锚点 / slug | `rehype-slug` / `rehype-autolink-headings` | rehype |

⚠️ MDX 默认只支持 **CommonMark**，表格、删除线、任务列表等 GFM 特性**不内置**，需显式加 `remark-gfm`。

```js
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

await compile(file, {
  remarkPlugins: [remarkGfm],       // Markdown 层：GFM
  rehypePlugins: [rehypeHighlight], // HTML 层：代码高亮
})
```

## 五、输出模块结构

编译产物是一个 JS 模块，默认导出的 `MDXContent` 与内部的 `_createMdxContent` 分工明确：

- **`_createMdxContent`**：真正渲染 MDX 内容主体的内部函数。
- **`MDXContent`**（默认导出）：对外包装——检查 `components.wrapper`（布局），有布局就用布局包住内容再渲染，没有就直接渲染 `_createMdxContent`。

理解这层包装，就明白 layout/wrapper 是如何生效的：

```js
// 简化示意（自动 runtime 下）
export default function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || {}
  return MDXLayout
    ? _jsx(MDXLayout, {...props, children: _jsx(_createMdxContent, {...props})})
    : _createMdxContent(props)
}
```

---

编译流程与插件掌握后，最后进入 [框架集成与迁移](./integrations-and-migration)：Vite/webpack/esbuild 集成、Next.js/Astro/Docusaurus 接入、多框架 JSX runtime、TypeScript 支持，以及 v2 → v3 迁移清单与常见坑。
