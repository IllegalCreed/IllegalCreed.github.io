---
layout: doc
outline: [2, 3]
---

# 组件映射：components / MDXProvider / 布局

> 基于 MDX v3 · 核于 2026-07

## 速查

- **components 映射**：一个「元素名 → 组件实现」的对象，是定制 MDX 渲染的核心入口。作用于：HTML 元素（`{h1: 'h2'}` 或 `{h1: MyHeading}`）、Markdown 生成的元素（`{em: CustomEm}`）、JSX 组件（`{Planet: MyPlanet}`）、嵌套对象（`{theme: {text: Comp}}`）。
- **覆盖原生元素**：把 `{p: MyParagraph}`、`{a: MyLink}`、`{code: MyCode}` 放进映射，即可用自定义组件统一渲染所有对应元素——给内容套设计系统的关键手段。
- **两种注入方式**：① 直接给内容组件传 `components` prop（简单场景够用）；② 用 `MDXProvider` 经上下文注入（多个嵌套 MDX 共享一套组件时省样板）。
- **Provider 前提**：编译时必须设 `providerImportSource`（如指向 `@mdx-js/react`），产物才会 `import` 一个 `useMDXComponents` 去读上下文。
- **嵌套合并**：多层 `MDXProvider` 的组件映射会**合并**，**内层覆盖外层**同名项；给内层 `components` 传函数可精细控制合并。
- **布局（layout）**：文件内 `export default function Layout({children}) {...}` 会包裹内容渲染；也可用 `components.wrapper`。**文件内 local layout 优先**于 `components.wrapper`。
- ⚠️ **v3 变化**：`MDXContext` / `withMDXComponents` 已弃用，统一改用 `useMDXComponents`。
- **框架 hook**：`@mdx-js/react`（React）、`@mdx-js/preact`（Preact）等提供 `MDXProvider` 与 `useMDXComponents`。

## 一、components 映射对象

定制 MDX 渲染的核心是一个 **`components` 映射对象**：键是元素/组件名，值是要用来渲染它的实现。它覆盖四类目标：

```js
const components = {
  // 1) 内置 HTML 元素：值可为字符串标签名，或组件
  h1: 'h2',                 // 所有一级标题改用 h2 渲染
  a: MyLink,                // 所有链接用 MyLink 渲染
  // 2) Markdown 生成的元素
  em: CustomEmphasis,       // 所有 *斜体* 用自定义组件
  code: MyCode,             // 行内/块代码
  // 3) MDX 里用到的 JSX 组件
  Planet: MyPlanet,         // <Planet /> 解析到 MyPlanet
  // 4) 嵌套对象（供 <theme.text /> 这类成员表达式）
  theme: {text: ThemeText},
}
```

值既可以是**组件**，也可以是**字符串标签名**（`{h1: 'h2'}` 表示用 `h2` 渲染原 `h1`，是最轻量的覆盖）。

## 二、覆盖原生元素：给内容套设计系统

MDX 会把 Markdown 生成的每个元素都交给 `components` 映射查一遍。这意味着你能**一次性**把 `h1`~`h6`、`a`、`p`、`ul`、`li`、`code`、`pre`、`blockquote` 等原生元素，全部替换成自己设计系统里的组件：

```js
import {MyH1, MyLink, MyCode} from './design-system.js'

const components = {
  h1: MyH1,       // 带锚点/样式的标题
  a: MyLink,      // 内外链区分、新窗口图标
  code: MyCode,   // 高亮 + 复制按钮
}

// 传给内容组件即可
<Post components={components} />
```

这套机制是「给整站 MDX 内容做统一视觉」的核心手段：作者写标准 Markdown，渲染层统一换皮，内容与呈现解耦。CSS 只能改样式，而组件覆盖能注入**结构与逻辑**（锚点、复制按钮、埋点等）。

## 三、传 components prop vs MDXProvider

有两种把 `components` 交给 MDX 的方式：

**方式一：直接传 `components` prop**——简单直接，适合单个/少量 MDX：

```js
import Post from './post.mdx'

<Post components={{h1: MyHeading, a: MyLink}} />
```

**方式二：用 `MDXProvider` 经上下文注入**——当应用里**嵌套渲染很多 MDX**、且都想共享同一套映射时，逐个传 prop 很啰嗦；在外层用一次 `MDXProvider`，内部所有 MDX 都能从上下文拿到组件：

```jsx
import {MDXProvider} from '@mdx-js/react'
import Post from './post.mdx'

<MDXProvider components={{h1: MyHeading, a: MyLink}}>
  <Post />   {/* 无需再单独传 components */}
</MDXProvider>
```

::: tip 选择口径
简单场景传 `components` prop 就够；有大量嵌套 MDX 需共享映射时，用 `MDXProvider` 省样板。二者可混用，prop 优先级更贴近具体内容。
:::

## 四、Provider 的前提：providerImportSource

要让编译产物从 **Provider 上下文**里取组件，必须在**编译时**设置 `providerImportSource`——它让产物 `import` 一个 `useMDXComponents` 去读上下文。不配它，产物不会去读 Provider，只能靠传入的 `components` prop：

```js
import {compile} from '@mdx-js/mdx'

await compile(file, {
  providerImportSource: '@mdx-js/react', // React 用这个；Preact 用 @mdx-js/preact
})
```

配好后，`@mdx-js/react` 的 `MDXProvider` / `useMDXComponents` 才能真正把组件注入到内容里。

## 五、嵌套 Provider 的合并规则

多层 `MDXProvider` 时，各层的组件映射会**合并**，且**内层（更靠近内容）覆盖外层**同名项：

```jsx
<MDXProvider components={{h1: OuterH1, a: Link}}>
  <MDXProvider components={{h1: InnerH1}}>
    <Post />   {/* h1 用 InnerH1，a 仍用外层 Link */}
  </MDXProvider>
</MDXProvider>
```

若想精细控制合并（例如基于外层组件做增量），给内层 `components` 传一个**函数**，它接收外层组件并返回最终映射：

```jsx
<MDXProvider components={(outer) => ({...outer, h1: InnerH1})}>
  <Post />
</MDXProvider>
```

`MDXProvider` 还有 `disableParentContext` 属性（默认 `false`），设 `true` 可忽略外层上下文、只用本层组件。

## 六、布局：layout 与 wrapper

给 MDX 内容套一个页面外层布局有两种方式：

**方式一：文件内 default 布局**——在 MDX 里直接默认导出一个布局组件，它会包裹渲染出的内容：

```mdx
export default function Layout({children}) {
  return <main className="prose">{children}</main>
}

# 标题

正文会被 Layout 的 <main> 包住。
```

**方式二：`components.wrapper`**——在映射里提供一个特殊键 `wrapper` 作为包裹组件。

规则：**文件内的 local layout 优先**于 `components.wrapper`。逐文件定制外层结构时用前者，全站统一包裹时用后者。

## 七、v3 的 API 收敛

MDX v3 把组件上下文相关 API 收敛到 `useMDXComponents`：

- 旧的 `MDXContext`、高阶组件 `withMDXComponents` **已弃用**，统一改用 `useMDXComponents` hook 从上下文读取组件。
- 很多情况下升级 v3 后甚至不再需要 `@mdx-js/react` 的 context 方案——直接传 `components` prop 更简单。

---

组件映射与布局搞定后，下一步进入 [编译流程与插件](./compile-pipeline)：`@mdx-js/mdx` 的编译管线（mdast→hast→estree）、`compile`/`evaluate`/`run` 三组 API、核心 options，以及 remark/rehype/recma 三层插件生态。
