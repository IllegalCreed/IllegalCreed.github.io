---
layout: doc
outline: [2, 3]
---

# 参考

> 基于三家官方 Playground 2025–2026 现状编写

## 三者横向对比

| 维度       | TypeScript Playground                     | Vue SFC Playground                       | Svelte Playground（原 REPL）          |
| ---------- | ----------------------------------------- | ---------------------------------------- | ------------------------------------- |
| 地址       | typescriptlang.org/play                    | play.vuejs.org                           | svelte.dev/playground（旧 `/repl/` 重定向） |
| 编译什么   | TS/JS（tsc 浏览器内）                       | `.vue` SFC（`@vue/compiler-sfc`）         | `.svelte`（Svelte 编译器）             |
| 编辑器     | Monaco                                     | CodeMirror 或 Monaco（带 Volar）          | CodeMirror 6                          |
| 看编译产物 | `.JS` / `.D.TS`                            | render 函数 / JS、SSR、CSS                | JS output / CSS output                |
| 错误 / 日志 | Errors / Logs 标签 + Run                   | 预览即报错                                | Result 预览                           |
| 多文件     | `// @filename:`（twoslash，虚拟文件）       | 文件标签（`App.vue` + `import-map.json`…） | 多文件 / 多组件标签                    |
| 版本切换   | `?ts=5.x` / `next` / `dev`                  | 顶栏切 Vue 版本                           | `?version=5.x`                        |
| 分享机制   | hash（`#code/` lz-string）+ query 配置       | URL hash（状态序列化）                    | `/playground/{id}` 短链（gist）        |
| 插件       | ✅ Plugins sidebar（npm 发布）              | ❌（但可换 CDN、`:showCompileOutput` 等 props） | ❌                                 |
| 特色       | compiler flags 可视化 + Examples + AST / Bug Workbench + 导出到 CodeSandbox / StackBlitz | Import Map 可编辑 + SSR 产物 + CDN 可切 npmmirror | REPL→Playground 改名 + 合并 Examples |

## 分享 URL 机制对照

| 工具                | 代码放哪              | 配置 / 版本放哪                 | 短链 / 持久化               |
| ------------------- | --------------------- | ------------------------------- | --------------------------- |
| **TypeScript**      | **hash**：`#code/...`（lz-string `compressToEncodedURIComponent` 压缩）；旧格式 `#src=...`；`#example/xxx` 加载示例 | **query**：`?ts=`（版本）、`?flag=value`（编译 flag）、`?filetype=js|ts|dts` | URL 随编辑实时更新（`replaceState`），后退键可用 |
| **Vue SFC**         | **hash**：整个 REPL 状态序列化进 hash | 版本通常在顶栏 UI 切；Import Map 在文件里 | 复制地址即分享完整可复现示例 |
| **Svelte**          | 保存后由短链承载       | **query**：`?version=`           | 保存生成 **`/playground/{id}`** 短链（关联 GitHub gist），登录可存 |

> 关键差异：TS 把「代码（hash）」和「配置 / 版本（query）」**明确分两套**放——别笼统说成「都在 hash 里」。Vue 主要靠 hash 序列化整份状态。Svelte 靠保存后的 `/playground/{id}` 短链。

## 「看编译产物」能力对照

| 工具                | 看什么产物                                              | 教学价值                                  |
| ------------------- | ------------------------------------------------------- | ----------------------------------------- |
| **TypeScript**      | **`.JS`**（降级后的 JS）、**`.D.TS`**（生成的声明）       | 看语法降级（downleveling）、看类型如何对外暴露 |
| **Vue SFC**         | **render 函数 / JS**、**SSR 输出**、**CSS**              | 看 `<template>` / `<script setup>` 编译成什么、SSR 产物 |
| **Svelte**          | **JS output**、**CSS output**                            | 看编译型框架的「编译时魔法」落成怎样的 JS |

## 多文件机制对照（易混点）

| 工具                | 多文件怎么做                                  | 是不是真文件标签         |
| ------------------- | --------------------------------------------- | ------------------------ |
| **TypeScript**      | 单编辑器内用 **`// @filename: foo.ts`** twoslash 注释切分虚拟文件 | ❌ 虚拟文件，非标签   |
| **Vue SFC**         | 顶部真实文件标签（`App.vue`、`import-map.json`、`tsconfig.json`…） | ✅ 真·多文件标签     |
| **Svelte**          | 顶部真实文件标签，可建多个文件 / 组件          | ✅ 真·多文件标签     |

## 共性 / 差异速记

**共性（五条主线）**

1. **官方出品**——各自语言 / 框架核心团队维护，跟随官方版本，是官方真理来源。
2. **纯客户端编译、无后端**——编译器在浏览器里跑（TS 用 tsc、Vue 用 `@vue/compiler-sfc`、Svelte 用 Svelte 编译器），打开即编译。
3. **强绑单一框架 / 语言**——不是通用编辑器。
4. **看编译产物是核心价值**——实时看「你写的 → 编译成什么」。
5. **URL / hash 分享、最小可复现**——一条链接复现完整环境，是 issue repro 的标准工具。

**主要差异**

- **多文件**：TS 是 `// @filename:` 虚拟文件；Vue / Svelte 是真文件标签。
- **分享**：TS 分 hash（代码）+ query（配置）两套；Vue 靠 hash 序列化整份状态；Svelte 靠保存后的 `/playground/{id}` 短链。
- **插件**：只有 TS 有 Plugins sidebar（npm 发布）；Vue / Svelte 没有插件体系。
- **依赖**：TS 自动拉 `.d.ts`；Vue 靠可编辑 Import Map（CDN 可切 npmmirror）；Svelte 内置 npm 包解析。

**两个不相关的「REPL」（务必分清）**

- **Svelte** 的 Playground **旧名 REPL**（2023 改版后改名，`/repl/` 重定向到 `/playground/`）。
- **Vue** 的 SFC Playground **引擎仓库叫 `vuejs/repl`**（`play.vuejs.org` 是其官方部署）。
- 两者**毫无关系**——一个是历史名字，一个是引擎仓库名。

## 何时从 Playground 转向通用编辑器

| 你的需求                            | 该用                                       |
| ----------------------------------- | ------------------------------------------ |
| 演示语言 / 框架特性、看编译产物      | **官方 Playground**                        |
| 做 issue 最小可复现、分享代码片段    | **官方 Playground**（一条 URL 即复现）      |
| 完整项目、真实构建工具链、完整 `npm install` | **StackBlitz / CodeSandbox**          |
| 跑 Node 后端 / 连数据库 / 部署       | **StackBlitz（WebContainers）/ CodeSandbox** |

> TS Playground 的 Export 菜单直接提供 **Open in CodeSandbox / StackBlitz**，是「学习 / repro → 完整开发」最顺滑的过渡出口。

## 官方文档 / 仓库链接

| 工具                | 资源                       | URL                                                               |
| ------------------- | -------------------------- | ----------------------------------------------------------------- |
| TS Playground       | 入口                       | <https://www.typescriptlang.org/play>                             |
| TS Playground       | Playground Handbook（URL 结构） | <https://www.typescriptlang.org/_playground-handbook/url-structure.html> |
| TS Playground       | JS + .D.TS Sidebars        | <https://www.typescriptlang.org/_playground-handbook/js---dts-sidebars.html> |
| TS Playground       | Twoslash 注释（多文件 / flag） | <https://www.typescriptlang.org/_playground-handbook/twoslash-annotations.html> |
| TS Playground       | Plugins 开发               | <https://www.typescriptlang.org/dev/playground-plugins/>          |
| TS Playground       | 源码仓库                   | <https://github.com/microsoft/TypeScript-Website>（`packages/playground`） |
| Vue SFC Playground  | 入口                       | <https://play.vuejs.org/>                                         |
| Vue SFC Playground  | 官方说明（SFC 指南）       | <https://vuejs.org/guide/scaling-up/sfc.html>                     |
| Vue SFC Playground  | 引擎仓库                   | <https://github.com/vuejs/repl>                                   |
| Svelte Playground   | 入口（新）                 | <https://svelte.dev/playground>                                   |
| Svelte Playground   | 改版 / 改名博客            | <https://svelte.dev/blog/svelte-dev-overhaul>                     |
| Svelte Playground   | 文档                       | <https://svelte.dev/docs>                                         |
| Svelte Playground   | 站点 + REPL 仓库           | <https://github.com/sveltejs/svelte.dev>                          |
