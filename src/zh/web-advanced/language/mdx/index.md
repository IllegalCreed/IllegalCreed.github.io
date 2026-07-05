---
layout: doc
---

# MDX

**Markdown + JSX** 的融合格式——让你在 Markdown 内容里直接写 JSX：`import` 一个组件（交互式图表、告警框、可复用标签页），然后像写标签一样把它嵌进正文。它是 Markdown 的**超集**：绝大多数合法的 CommonMark 都能直接当 MDX 处理，MDX 只是在此之上叠加了 **JSX 元素**、**`{表达式}` 插值** 与 **ESM 的 import/export**。当前主线是 **v3**（`@mdx-js/mdx` npm 实测 `3.1.1`），官方包全部 **ESM only**、要求 Node.js 16+。它的本质心智是「**文件即 ES module**」：一个 `.mdx` 文件编译后就是一个模块，默认导出一个渲染内容的组件（`MDXContent`），还能具名导出常量/函数。编译走一条清晰的多层管线——MDX → mdast（Markdown 树）→ hast（HTML 树）→ estree（JS 树）→ JavaScript，每一层都能挂 remark / rehype / recma 插件扩展。正因为产物是标准组件，MDX 成了 Docusaurus、Astro、Next.js、Nextra 等文档/内容生态的主力写作格式：作者继续用熟悉的 Markdown，需要交互时无缝嵌组件。

## 评价

**优点**

- **内容与组件无缝融合**：在 Markdown 里 `import` 并使用可复用、可传 props 的组件，把静态文档升级成可交互内容——这是它相对「Markdown + 裸 HTML」的本质飞跃（裸 HTML 只是静态字符串，无法传状态、难以统一设计系统）
- **Markdown 超集、迁移平滑**：几乎所有现有 `.md` 都能直接改名 `.mdx` 运行，学习成本集中在少数几处（缩进代码块、`{` `<` 转义、注释语法）
- **文件即 ES module**：默认导出内容组件、具名导出元数据，天然接入现代打包器与组件体系；`import Post from './post.mdx'` 一行即用
- **插件生态成熟分层**：remark（Markdown 层）、rehype（HTML 层）、recma（JS 层）三层插件各司其职，GFM、语法高亮、数学公式、frontmatter、目录等能力都有现成插件
- **组件映射统一可控**：通过 `components` 映射或 `MDXProvider`，可把 `h1`~`h6`、`a`、`code` 等原生元素一次性替换成设计系统组件，给整站内容做统一样式
- **框架无关**：默认 React，但 `jsxImportSource` 可切到 Preact / Vue / Solid 等；Next.js、Astro、Docusaurus 均有一等集成

**缺点**

- **它是一门编程语言，有安全边界**：MDX 会被编译成可执行 JS，渲染**不可信来源**（如用户提交）的 MDX 等于让对方在你的环境里执行任意代码——只有信任作者才可用
- **需要 JSX runtime**：产物依赖 React/Preact/Vue 等渲染库，即便内容全静态也要框架参与；纯零 JS 静态站需靠 SSR/预渲染，或评估是否用更轻的 Markdown 更合适
- **有一批「像 Markdown 却不是」的坑**：缩进代码块失效、裸 `<` `{` 需转义、HTML 注释不被支持、块级 JSX 内部 Markdown 默认不解析——从纯 Markdown 迁来容易踩
- **工程配置有门槛**：`.mdx` 需构建工具集成（loader/插件）才能识别，TypeScript 还要 `@types/mdx` 补类型；比「丢个 md 文件就能渲染」重
- **v2 → v3 有破坏性变化**：自动 JSX runtime、`baseUrl` 必传、`useDynamicImport` 移除、`MDXContext` 弃用等，跨大版本升级需按迁移指南逐条核对

## 文档地址

[mdxjs.com 官方站](https://mdxjs.com) ｜ [What is MDX](https://mdxjs.com/docs/what-is-mdx/) ｜ [Using MDX](https://mdxjs.com/docs/using-mdx/) ｜ [@mdx-js/mdx](https://mdxjs.com/packages/mdx/) ｜ [Guides](https://mdxjs.com/guides/) ｜ [v3 迁移](https://mdxjs.com/migrating/v3/)

## GitHub 地址

[mdx-js/mdx](https://github.com/mdx-js/mdx) ｜ [npm · @mdx-js/mdx](https://www.npmjs.com/package/@mdx-js/mdx)

## 幻灯片地址

<a href="/SlideStack/mdx-slide/" target="_blank">MDX</a>
