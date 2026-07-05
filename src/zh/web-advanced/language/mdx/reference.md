---
layout: doc
outline: [2, 3]
---

# 参考：MDX 速查与对照表

> 基于 MDX v3 · 核于 2026-07

## 速查

- **定位**：MDX = Markdown + JSX 融合格式，Markdown 超集；核心包 `@mdx-js/mdx`（v3，实测 `3.1.1`），ESM only、Node 16+。
- **四类内容**：Markdown / JSX 元素（`<Chart />`）/ `{表达式}` / ESM（import/export）。
- **文件即模块**：默认导出内容组件 `MDXContent`；具名导出常量/函数；`import Post from './post.mdx'` 即组件。
- **命名规则**：大写=组件引用、小写=字面元素、点号=成员表达式、连字符=字面元素；空元素自闭合 `<img />`。
- **注释**：`{/* */}`（非 HTML 注释）；**转义** `\<` `\{`；缩进代码块/autolink 不支持。
- **管线**：mdast（remark）→ hast（rehype）→ estree（recma）→ JS。
- **API**：`compile`（编译）/ `evaluate`（编译+运行）/ `run`（执行 function-body）。
- **组件映射**：`components` prop 或 `MDXProvider`（需 `providerImportSource`）；覆盖 `h1`~`h6`/`a`/`code` 等原生元素。
- **常用插件**：`remark-gfm`、`remark-frontmatter`、`remark-math`+`rehype-katex`、`rehype-highlight`。
- **集成**：Vite→`@mdx-js/rollup`、webpack→`@mdx-js/loader`、Next→`@next/mdx`、Astro/Docusaurus 内建。

## 一、四类内容与命名规则

| 构成 | 语法 | 说明 |
| --- | --- | --- |
| Markdown | `# 标题`、`**加粗**`、`- 列表` | CommonMark，原样可用 |
| JSX 元素 | `<Chart />`、`<lib.Btn />` | 组件/元素，需闭合 |
| 表达式 | `{year}`、`{Math.PI*2}` | 花括号里放**表达式**（非语句） |
| ESM | `import ... from '...'`、`export const ...` | 引入组件/值、导出元数据 |

| 标签写法 | 判定 | 含义 |
| --- | --- | --- |
| `<Planet />` | 大写 | 组件引用（需提供） |
| `<section />` | 小写 | 字面 HTML 元素 |
| `<lib.Button />` | 点号 | 成员表达式 |
| `<a-b />` | 连字符 | 字面元素 |

## 二、转义 / 注释 / 失效清单

| 场景 | 规则 | 正确做法 |
| --- | --- | --- |
| 字面 `<` / `{` | 被当标签/表达式起始 | `\<` `\{` 或放代码块 |
| 注释 | HTML 注释不支持 | `{/* ... */}` |
| 缩进代码块 | 缩进用于排布 JSX，失效 | 用围栏（```） |
| 自动链接 | 裸 URL 不成链 | 写完整 `[text](url)` |
| 空元素 | JSX 要求闭合 | 自闭合 `<img />` |
| 块级 JSX 内 Markdown | 跨行默认不解析 | 空行分隔成独立块 |

## 三、核心 API 速查

| 函数 | 作用 | 备注 |
| --- | --- | --- |
| `compile(file, opts?)` | MDX → JS 代码 | 有同步版 `compileSync`；**最推荐** |
| `evaluate(file, opts)` | 编译 + 就地运行得组件 | `evaluateSync`；需内容**可信** |
| `run(code, opts)` | 执行 `function-body` 代码 | `runSync`；MDX on demand 运行侧 |

```js
import {compile, evaluate, run} from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

const code = String(await compile('# Hi {1 + 1}'))
const {default: C1} = await evaluate('# Hi', {...runtime})
```

## 四、编译 options 速查

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `jsx` | `false` | `true` 保留 JSX 交下游转 |
| `jsxImportSource` | `'react'` | runtime 来源（preact/vue/solid-js/h） |
| `jsxRuntime` | `'automatic'` | v3 推荐 automatic |
| `providerImportSource` | — | 启用 Provider 上下文取组件 |
| `development` | `false` | 开发 runtime + 调试信息 |
| `outputFormat` | `'program'` | 或 `'function-body'`（配合 run） |
| `format` | `'detect'` | `md` / `mdx` / 按后缀 detect |
| `baseUrl` | — | 解析相对导入；v3 运行时含 import 必传 |
| `elementAttributeNameCase` | `'react'` | 或 `'html'` |

插件三层：`remarkPlugins`（mdast）、`rehypePlugins`（hast）、`recmaPlugins`（estree）。

## 五、插件分层与常用插件

| 层 | AST | 适合 | 常用插件 |
| --- | --- | --- | --- |
| remark | mdast（Markdown） | Markdown 级语法 | `remark-gfm`、`remark-frontmatter`、`remark-mdx-frontmatter`、`remark-math` |
| rehype | hast（HTML） | 接近 HTML 输出的变换 | `rehype-highlight`、`rehype-starry-night`、`rehype-katex`、`rehype-slug`、`rehype-autolink-headings` |
| recma | estree（JS） | 改写生成的 JS | 自定义 estree 变换 |

> MDX 默认仅 **CommonMark**；表格/删除线/任务列表等 GFM 特性需 `remark-gfm`。

## 六、集成方案速查

| 目标 | 包 |
| --- | --- |
| Rollup / Vite | `@mdx-js/rollup` |
| webpack | `@mdx-js/loader` |
| esbuild / Bun | `@mdx-js/esbuild` |
| Node.js 直跑 | `@mdx-js/node-loader` |
| Next.js | `@next/mdx` |
| Astro | `@astrojs/mdx`（内建） |
| Docusaurus | 原生支持 |
| Gatsby | `gatsby-plugin-mdx` |
| Parcel | `@parcel/transformer-mdx` |
| TypeScript 类型 | `@types/mdx` |

## 七、v2 → v3 变化速查

| 分类 | v2 | v3 |
| --- | --- | --- |
| Node | 更低 | **16+** |
| JSX runtime | 可 classic | 推荐 **automatic**（classic 告警/趋废） |
| 运行时导入 | `useDynamicImport` | **移除**，改 `baseUrl` |
| 运行时 baseUrl | 可选 | `evaluate`/`run`/`function-body` 含 import 时**必传** |
| 组件上下文 | `MDXContext`/`withMDXComponents` | `useMDXComponents` |
| Node loader | `@mdx-js/register` | `@mdx-js/node-loader` |
| 插件 | 旧版 | 更新 `remark-gfm`/`remark-math` 等 |

## 八、常见错误对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `import './x.mdx'` 无法解析 | 未配 MDX 集成 | 装并启用对应 loader/插件 |
| 自定义组件没生效 | 组件名小写→当字面元素 | 首字母大写 |
| `<img>` 报未闭合 | JSX 要求闭合 | 写 `<img />` |
| 代码块不显示 | 用了缩进代码块 | 改围栏代码块 |
| 注释被渲染出来 | 用了 HTML 注释 | 改 `{/* */}` |
| 组件内 `**加粗**` 原样输出 | 块级 JSX 内不解析 md | 空行分隔成独立块 |
| `evaluate` 含 import 报错 | 缺 `baseUrl` | 传 `import.meta.url` |
| Next App Router 交互组件报错 | MDX 默认 server 组件 | 交互组件加 `'use client'` |

## 九、MDX vs Markdown 取舍

| 维度 | Markdown | MDX |
| --- | --- | --- |
| 能力 | 静态文本结构 | + JSX 组件 / 表达式 / ESM |
| 产物 | HTML | JS 组件（依赖 JSX runtime） |
| 交互 | 无（除非嵌裸 HTML/脚本） | 可复用、可传 props 的组件 |
| 工程成本 | 极低 | 需构建集成、TS 需 `@types/mdx` |
| 安全 | 相对安全 | 会执行代码，不可信内容不安全 |
| 适用 | 纯静态文档 | 内容站/文档站、需交互与设计系统 |

## 十、权威链接

- [mdxjs.com 官方站](https://mdxjs.com) —— 首页与导航
- [What is MDX](https://mdxjs.com/docs/what-is-mdx/) —— 定义与语法
- [Using MDX](https://mdxjs.com/docs/using-mdx/) —— components / 布局 / props
- [Getting started](https://mdxjs.com/docs/getting-started/) —— 安装与集成
- [@mdx-js/mdx](https://mdxjs.com/packages/mdx/) —— 编译器 API 与 options
- [@mdx-js/react](https://mdxjs.com/packages/react/) —— MDXProvider / useMDXComponents
- [Guides](https://mdxjs.com/guides/) —— GFM / 高亮 / 数学 / frontmatter / on demand
- [v3 迁移指南](https://mdxjs.com/migrating/v3/) —— 破坏性变更清单
- [GitHub · mdx-js/mdx](https://github.com/mdx-js/mdx) —— 源码与 Issue
- [npm · @mdx-js/mdx](https://www.npmjs.com/package/@mdx-js/mdx) —— 版本实测：`3.1.1`
