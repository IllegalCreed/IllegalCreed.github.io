---
layout: doc
outline: [2, 3]
---

# 框架集成与 v2 → v3 迁移

> 基于 MDX v3 · 核于 2026-07

## 速查

- **打包器集成**：Vite/Rollup → `@mdx-js/rollup`；webpack → `@mdx-js/loader`；esbuild/Bun → `@mdx-js/esbuild`；Node 直跑 `.mdx` → `@mdx-js/node-loader`。
- **框架集成**：Next.js → `@next/mdx`（内部走 webpack loader）；**Astro**、**Docusaurus** 内建 MDX；Gatsby → `gatsby-plugin-mdx`；Parcel → `@parcel/transformer-mdx`。
- **JSX runtime**：`jsxImportSource` 默认 `'react'`；Preact `'preact'`、Vue `'vue'`、Solid `'solid-js/h'`、Emotion `'@emotion/react'`。
- **TypeScript**：装 `@types/mdx` 并做 JSX 命名空间增强，`import Post from './post.mdx'` 才有类型。
- **v2 → v3 关键变化**：① Node 16+；② classic runtime → **automatic**（classic 告警、趋于废弃）；③ `evaluate`/`run`/`function-body` 且含 import/export 时**必传 `baseUrl`**；④ `useDynamicImport` **移除**；⑤ `MDXContext`/`withMDXComponents` → `useMDXComponents`；⑥ `@mdx-js/register` → `@mdx-js/node-loader`；⑦ rehype/remark 插件需更新。
- **常见坑**：`.mdx` 无集成→无法解析；组件名忘大写；`<img>` 忘自闭合；缩进代码块失效；HTML 注释无效；块级 JSX 内 Markdown 不解析；RSC 下默认 server 组件、交互组件需 `'use client'`。

## 一、打包器集成

`.mdx` 不是 JS 原生识别的后缀，必须由构建工具注册处理器。按打包器选集成包：

```js
// Vite（基于 Rollup 插件体系）：vite.config.js
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'

export default {
  plugins: [
    {enforce: 'pre', ...mdx({/* remarkPlugins, rehypePlugins... */})},
    react({include: /\.(jsx|js|mdx|md|tsx|ts)$/}),
  ],
}
```

| 打包器 | 集成包 |
| --- | --- |
| Rollup / **Vite** | `@mdx-js/rollup` |
| **webpack** | `@mdx-js/loader` |
| **esbuild** / Bun | `@mdx-js/esbuild` |
| **Node.js**（直接运行 `.mdx`） | `@mdx-js/node-loader` |

编程式场景（服务端按需编译、构建脚本）则直接用核心的 `@mdx-js/mdx` 的 `compile`/`evaluate`。

## 二、框架集成

主流框架都有一等 MDX 支持：

- **Next.js**：官方 `@next/mdx`，在 `next.config` 里配置后即可让 `.mdx` 页面/组件被识别（内部仍用 `@mdx-js/loader`）。
- **Astro**：官方 `@astrojs/mdx` 集成，`.mdx` 可当页面或内容集合，天然配合 Astro 组件。
- **Docusaurus**：原生以 MDX 作为文档格式，站点内所有 `.md`/`.mdx` 都按 MDX 处理。
- **Gatsby**：`gatsby-plugin-mdx`。
- **Parcel**：`@parcel/transformer-mdx`。

```js
// Next.js：next.config.mjs
import createMDX from '@next/mdx'

const withMDX = createMDX({
  options: {remarkPlugins: [], rehypePlugins: []},
})

export default withMDX({
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
})
```

## 三、多框架 JSX runtime

MDX 产物依赖某个 JSX runtime，通过 `jsxImportSource` 指定来源。默认 React，其他框架显式配置：

| 目标框架 | `jsxImportSource` |
| --- | --- |
| React（默认） | `'react'` |
| Preact | `'preact'` |
| Vue | `'vue'` |
| Solid | `'solid-js/h'` |
| Emotion | `'@emotion/react'` |

设错来源会导致产物 `import` 不到正确的 `jsx` 函数。用 Provider 时，`providerImportSource` 也要换成对应框架的包（React 用 `@mdx-js/react`，Preact 用 `@mdx-js/preact`）。

## 四、TypeScript 支持

TypeScript 默认不认识 `.mdx` 后缀，`import Post from './post.mdx'` 会报「找不到模块」。解决：

```bash
npm install -D @types/mdx
```

装上 `@types/mdx` 并在项目里做相应的类型声明/JSX 命名空间增强后，TS 就知道 `.mdx` 模块默认导出是一个组件。这是 MDX + TS 工程化的标配步骤（改后缀、关类型检查都是错误做法）。

## 五、v2 → v3 迁移清单

跨大版本升级按官方迁移指南逐条核对：

| 变化 | 说明 |
| --- | --- |
| **Node 16+** | v3 要求至少 Node 16 |
| **classic → automatic runtime** | 还在用经典 runtime 的切换到自动 runtime（classic 告警、趋于废弃；主流框架都支持 automatic） |
| **`baseUrl` 必传** | 用 `evaluate`/`run`/`outputFormat:'function-body'` 且内容含 import/export 或 `import.meta.url` 时，须传 `baseUrl`（通常 `import.meta.url`） |
| **`useDynamicImport` 移除** | 该选项在 v3 删除，运行时相对导入改由 `baseUrl` 解析 |
| **`MDXContext`/`withMDXComponents` 弃用** | 统一改用 `useMDXComponents` |
| **`@mdx-js/register` 弃用** | 改用 `@mdx-js/node-loader` |
| **更新 remark/rehype 插件** | 内部类型/解析变化，`remark-gfm`、`remark-math` 等需升到兼容版本 |

## 六、常见坑 Top 8

1. **`.mdx` 无法解析**：没在构建工具里配置 MDX 集成（loader/插件），而非文件写错。
2. **组件名忘大写**：`<planet />` 被当字面 HTML 元素而非你的 `Planet` 组件，静默渲染错误。
3. **空元素忘自闭合**：`<img>` 报未闭合，须写 `<img />`。
4. **缩进代码块失效**：缩进被 MDX 用于排布 JSX，代码块须用围栏（```）。
5. **HTML 注释无效**：`<!-- -->` 不被支持，用 `{/* ... */}`。
6. **块级 JSX 内 Markdown 不解析**：组件内部想用 Markdown，须用空行分隔成独立块。
7. **裸 `<` `{` 报错**：字面量须转义 `\<` `\{` 或放进代码块。
8. **RSC 下的 server/client 边界**：Next.js App Router 里 MDX 默认渲染为**服务端组件**，不能直接用 `useState`/事件；交互组件要单独放到带 `'use client'` 的文件里再 `import` 使用。

::: warning 安全红线
MDX 是编程语言，会被编译成可执行 JS。**绝不可**把不可信来源（如用户提交）的 MDX 直接编译执行——那等于让对方在你的环境里运行任意代码。只有信任作者时才可用。
:::

---

至此 MDX 的语法、组件映射、编译流程、集成与迁移已成体系。速查与对照表见 [参考页](../reference)。
