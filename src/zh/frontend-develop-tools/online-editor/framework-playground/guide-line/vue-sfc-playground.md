---
layout: doc
outline: [2, 3]
---

# Vue SFC Playground

> 基于三家官方 Playground 2025–2026 现状编写

## 速查

- **地址**：<https://play.vuejs.org/>；官方说明在 SFC 指南页 <https://vuejs.org/guide/scaling-up/sfc.html>
- **引擎**：开源仓库 **`vuejs/repl`**（README 自述「Vue SFC REPL as a Vue 3 component」，即一个可复用的 Vue 3 组件）；`play.vuejs.org` 是它的**官方部署实例**
- **客户端编译**：浏览器里用 **`@vue/compiler-sfc`** 实时把 `.vue` 编成标准 **JS + CSS**（生产里这步通常交给 Vite）
- **界面**：左 = SFC 编辑器（多文件标签）；右 = 默认 **Preview**，可切看**编译产物**
- **多文件标签**：默认 `App.vue`，外加可编辑的 **`import-map.json`**、`tsconfig.json` 等；支持 `<script setup>`
- **看产物**：编译出的 **render 函数 / JS**、**SSR 输出**、编译出的 **CSS**
- **编辑器**：可选 **CodeMirror**（轻量）或 **Monaco**（带 Volar、补全 / 类型推断 → TS 支持）
- **版本切换**：可动态切 Vue 版本（含 `@vue/compiler-sfc`）
- **Import Map**：内置可编辑 `import-map.json`，自定义依赖解析（CDN 可在 jsdelivr / unpkg / **npmmirror** 间切，便于国内访问）
- **分享**：REPL 状态序列化进 **URL hash**，复制地址即分享完整可复现示例
- ⚠️ 仓库名带 "REPL"，但与 **Svelte 的 REPL 无关**，别混

## 引擎：vuejs/repl

Vue SFC Playground 背后的引擎是开源仓库 **`vuejs/repl`**。它的 README 一句话点明定位：**「Vue SFC REPL as a Vue 3 component」**——也就是说，它本身是一个**可复用的 Vue 3 组件**，你可以把它嵌进自己的页面；而 `play.vuejs.org` 就是 Vue 官方拿这个组件部署出来的**官方实例**。

::: warning 注意：这个 "REPL" 不是 Svelte 那个
`vuejs/repl` 的仓库名里有 "REPL"，但它和 Svelte 历史上叫 "REPL" 的 Playground **完全无关**——一个是 Vue 工具的引擎仓库名，一个是 Svelte 工具的旧称。看到 "REPL" 先分清在说谁。
:::

## 客户端编译：@vue/compiler-sfc

Vue 单文件组件（`.vue`，即 SFC）是 **Vue 专属的文件格式，必须先被预编译**成标准 JavaScript 和 CSS 才能跑——官方文档原话：

> *"Vue SFC is a framework-specific file format and must be pre-compiled by `@vue/compiler-sfc` into standard JavaScript and CSS."*

生产环境里这一步通常交给 Vite / Vue CLI。而 Playground 把这件事搬到了浏览器：**在浏览器里直接用 `@vue/compiler-sfc` 把你写的 `.vue` 实时编成 JS + CSS**。官方对它的描述也很直白：

> *"You can play with SFCs and explore how they are compiled in the Vue SFC Playground."*

## 界面：左编辑器 / 右预览 + 编译产物

### 左侧：多文件 SFC 编辑器

左侧是带**多文件标签**的编辑器：

- 默认 **`App.vue`**——支持 `<script setup>` 等现代语法。
- **`import-map.json`**——可编辑的导入映射（见下文 Import Map）。
- `tsconfig.json` 等其他可编辑文件标签。

::: tip 这是「真·多文件标签」
和 TS Playground 用 `// @filename:` 注释切分虚拟文件不同，Vue Playground 顶部是一排**真实的文件标签**，可新增、切换、编辑。
:::

### 右侧：预览 + 看编译产物

右侧默认是 **Preview（实时预览）**，并可切换查看**编译产物**——这正是「看编译产物」教学价值的落点：

| 视图               | 看什么                                          |
| ------------------ | ----------------------------------------------- |
| **Preview**        | SFC 实时运行的预览                              |
| **render 函数 / JS** | SFC 被编译成的渲染函数 / JS——看 `<template>`、`<script setup>` 到底编译成了什么 |
| **SSR 输出**       | 服务端渲染（SSR）产物                            |
| **CSS**            | 编译出的样式                                    |

> 在引擎层面，`vuejs/repl` 通过 `:showCompileOutput` prop 控制是否展示编译产物，`server-renderer` 选项支持 SSR 输出；另提供独立的 `Sandbox` 组件做「只预览、不带编辑器」。

### 编辑器内核：CodeMirror 或 Monaco

编辑器内核可选：

- **CodeMirror**：轻量，无智能提示。
- **Monaco Editor**：带 **Volar** 支持，提供自动补全、类型推断——即完整的 **TypeScript 支持**。

## 版本切换、Import Map 与分享

### Vue 版本切换

可**动态切换 Vue 版本**（`vuejs/repl` 支持 version switching，UI 上通常在顶栏选择），也能切换 `@vue/compiler-sfc` 等。这让你能直接对比「同一段 SFC 在不同 Vue 版本下编译产物的差异」。

### Import Map：自定义依赖解析

内置可编辑的 **`import-map.json`**，用来自定义依赖如何解析。一个实用场景是切换 CDN：

```json
{
  "imports": {
    "vue": "https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.js"
  }
}
```

CDN 可在 jsdelivr / unpkg / **npmmirror** 之间切换。

::: tip npmmirror 便于国内访问
默认 CDN 在国内可能较慢。把 Import Map 里的依赖地址换成 **npmmirror** 镜像，能显著改善国内的加载速度。
:::

### 分享

REPL 的整个状态会**序列化进 URL hash**（持久化 + 恢复）。复制地址栏即把当前这份完整、可复现的示例分享出去——和 TS / Svelte 一样，这让 Vue Playground 成为提 SFC 相关 issue 时做最小可复现的标准工具。
