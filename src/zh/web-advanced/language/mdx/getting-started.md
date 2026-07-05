---
layout: doc
outline: [2, 3]
---

# 入门：MDX 是什么、语法骨架与 ESM 本质

> 基于 MDX v3 · 核于 2026-07

## 速查

- **定位**：MDX = **Markdown + JSX** 的融合格式，让你在 md 内容里写并 `import` 组件。它是 Markdown 的**超集**，绝大多数合法 CommonMark 可直接当 MDX。
- **版本**：主线 **v3**，核心编译器 `@mdx-js/mdx` npm 实测 `3.1.1`；官方包 **ESM only**、需 **Node.js 16+**。
- **四类内容构成**：① Markdown 正文；② JSX 元素（`<Chart />`）；③ `{表达式}`（花括号里的 JS）；④ ESM `import`/`export`。
- **文件即 ES module**：`.mdx` 编译成一个模块，**默认导出**渲染内容的组件（`MDXContent`），可**具名导出**常量/函数。
- **导入即组件**：构建工具配好后 `import Post from './post.mdx'`，`Post` 是函数组件，可 `<Post />` 渲染、传 props。
- **表达式插值**：`{Math.PI * 2}`——花括号包 JS 表达式，编译时求值渲染（沿用 JSX 语法）。
- **注释**：只能用 `{/* ... */}`（JSX 风格），**HTML 注释 `<!-- -->` 在 MDX 中不被支持**。
- **转义**：正文里字面的 `<` 和 `{` 必须转义为 `\<` `\{`，或放进代码块——否则被当标签/表达式起始报错。
- **命名规则**：首字母**大写** = 组件引用（需 import/提供）；**小写** = 字面 HTML 元素；带**点号** `<lib.Btn />` = 成员表达式；带**连字符** `<a-b />` = 字面元素。
- **自闭合**：JSX 要求标签闭合，空元素写 `<img />`，不能写 `<img>`。
- ⚠️ **缩进代码块失效**：MDX 用缩进排布 JSX，代码块须用围栏（三反引号），不能用缩进 4 空格。
- **安装（核心）**：`npm i @mdx-js/mdx`（核心编译器）；接入打包器另装集成包（见下）。
- **接入打包器**：Vite/Rollup → `@mdx-js/rollup`；webpack → `@mdx-js/loader`；esbuild/Bun → `@mdx-js/esbuild`；Node → `@mdx-js/node-loader`。
- **接入框架**：Next.js → `@next/mdx`；Astro / Docusaurus 内建；Gatsby → `gatsby-plugin-mdx`；Parcel → `@parcel/transformer-mdx`。
- **JSX runtime**：`jsxImportSource` 默认 `'react'`；Preact `'preact'`、Vue `'vue'`、Solid `'solid-js/h'`。
- **TypeScript**：装 `@types/mdx` 并做 JSX 命名空间增强，TS 才认识 `.mdx` 模块类型。
- ⚠️ **安全**：MDX 是编程语言，**不可信内容不可直接编译执行**（等于任其运行任意 JS）。
- **进阶顺序**：本页 → [语法详解](./guide-line/syntax) → [组件映射与 Provider](./guide-line/components-and-provider) → [编译流程与插件](./guide-line/compile-pipeline) → [框架集成与迁移](./guide-line/integrations-and-migration) → [参考](./reference)。

## 一、MDX 是什么：定位与超集

MDX 的官方一句话定义是「**在 Markdown 里使用 JSX**」。它不是要替代 Markdown 的全新语言，而是 Markdown 的**超集**：你原来怎么写标题、列表、链接、代码块，MDX 里照旧；只是**额外**允许在同一份文件里 `import` 组件、写 JSX 标签、插入 `{JS 表达式}`。

它解决的核心痛点是：纯 Markdown 只能表达静态文本结构，无法嵌入可交互、可复用、可传状态的组件。很多 Markdown 处理器允许内嵌**裸 HTML**，但那只是静态字符串。MDX 用 **JSX 组件**取代裸 HTML，让文档真正接入前端组件体系——这正是它区别于「Markdown + 裸 HTML」的本质。

正因如此，MDX 成了 **Docusaurus、Astro、Next.js、Nextra** 等文档/内容生态的主力写作格式：作者用熟悉的 Markdown 写正文，需要演示、可视化、可复用告警框时直接嵌组件。

## 二、一个 MDX 文件长什么样

下面是一份典型 MDX，四类内容一次看全：

```mdx
import {Chart} from './chart.js'
export const year = 2026

# 今年销售报告

这是**普通 Markdown** 段落，可以有 [链接](https://mdxjs.com) 和 `行内代码`。

下面直接嵌入一个交互组件（JSX 元素），并用表达式插值：

<Chart data={salesData} year={year} />

当前年份是 {year}，圆周率两倍是 {Math.PI * 2}。

{/* 这是 MDX 注释，不会渲染出来 */}
```

- `import` / `export` 是标准 **ESM** 语句；
- `# 今年销售报告`、`**普通 Markdown**`、`[链接]`、`` `行内代码` `` 是 **Markdown**；
- `<Chart ... />` 是 **JSX 元素**；
- `{year}`、`{Math.PI * 2}` 是 **`{表达式}` 插值**；
- `{/* ... */}` 是 **注释**。

## 三、四类内容构成

MDX 文件里能出现的内容，归为四类：

| 构成 | 语法 | 说明 |
| --- | --- | --- |
| Markdown | `# 标题`、`- 列表`、`**加粗**` | CommonMark 基础语法，原样可用 |
| JSX 元素 | `<Chart />`、`<lib.Btn />` | 像写标签一样使用组件，需闭合 |
| 表达式插值 | `{year}`、`{Math.PI * 2}` | 花括号里放能**求值**的 JS 表达式 |
| ESM | `import {...} from '...'`、`export const ... = ...` | 引入组件/值、对外导出元数据 |

::: tip 超集意味着平滑迁移
把现有 `.md` 改名 `.mdx`，绝大多数内容原样工作。你只需要留意少数几处「像 Markdown 却不同」的地方（缩进代码块、`<` `{` 转义、注释语法），详见[语法详解](./guide-line/syntax)。
:::

## 四、MDX 文件即 ES module（本质心智）

理解 MDX 最关键的一句话：**一个 `.mdx` 文件编译后就是一个 ES module**。

- 它可以有顶层 `import` / `export`；
- 它的**默认导出**是一个渲染该内容的组件（官方生成名为 `MDXContent` 的函数组件）；
- 它的**具名导出**（`export const author = 'Alice'`）会成为该模块的具名导出，外部可 `import {author} from './post.mdx'` 读取——常用于在 MDX 里声明标题、日期等元数据。

所以在应用里使用一份 MDX，就是「导入一个组件」：

```js
// 前提：构建工具已通过 MDX 集成插件处理 .mdx 后缀
import Post, {author} from './post.mdx'

function Page() {
  // Post 是函数组件，可直接渲染并传 props / components
  return <Post components={{h1: MyHeading}} />
}
```

⚠️ 如果 `import './post.mdx'` 报「无法解析该模块」，多半是**没在构建工具里配置 MDX 集成**（`.mdx` 不是 JS 原生识别的后缀），而非文件写错。

## 五、安装与集成概览

核心编译器是 `@mdx-js/mdx`，各打包器/框架集成包都是对它的封装：

```bash
# 核心编译器（编程式 compile/evaluate 时直接用）
npm install @mdx-js/mdx

# 接入打包器（按需选一）
npm install @mdx-js/rollup       # Rollup / Vite
npm install @mdx-js/loader       # webpack
npm install @mdx-js/esbuild      # esbuild / Bun
npm install @mdx-js/node-loader  # Node.js 直接运行 .mdx
```

框架侧：**Next.js** 用官方 `@next/mdx`；**Astro**、**Docusaurus** 内建 MDX 集成；**Gatsby** 用 `gatsby-plugin-mdx`；**Parcel** 用 `@parcel/transformer-mdx`。TypeScript 项目还要 `npm i -D @types/mdx` 才认识 `.mdx` 类型。完整集成清单见[框架集成与迁移](./guide-line/integrations-and-migration)。

## 六、与 Markdown 的取舍

不是所有场景都该上 MDX：

- **纯静态文档、无交互需求**：普通 Markdown 更轻，无需 JSX runtime、无需构建集成——上 MDX 是过度工程。
- **需要嵌交互组件 / 复用设计系统 / 内容驱动站点**：MDX 的组件化能力无可替代，Docusaurus/Astro 等正是为此内建它。
- **渲染不可信内容**：MDX 会执行代码，**绝不可**把用户提交内容直接当 MDX 编译；此类场景应回退到受控的 Markdown 渲染器。

---

打好地基后，下一步进入 [语法详解](./guide-line/syntax)：逐条拆解 import/export、JSX 元素与命名规则、`{表达式}`、Markdown 与 JSX 混排规则、注释与转义等全部语法细节。
