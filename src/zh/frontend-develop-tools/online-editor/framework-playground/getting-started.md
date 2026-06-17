---
layout: doc
outline: [2, 3]
---

# 入门

> 基于三家官方 Playground 2025–2026 现状编写

## 速查

- **是什么**：三个**框架 / 语言官方出品**的在线 Playground——TypeScript Playground、Vue SFC Playground、Svelte Playground
- **共性范式（五点）**：①官方出品、跟随官方版本 ②纯客户端编译、编译器在浏览器里跑、**无后端** ③强绑单一框架 / 语言 ④核心价值是**实时看编译产物** ⑤代码状态进 **URL / hash**，一条链接做最小可复现（repro）
- **编译什么**：TS 编 TS/JS（tsc）/ Vue 编 `.vue` SFC（`@vue/compiler-sfc`）/ Svelte 编 `.svelte`（Svelte 编译器）——**都在浏览器里，不连服务器**
- **看产物**：TS 看 `.JS` / `.D.TS`；Vue 看 render 函数 / SSR / CSS；Svelte 看 JS output / CSS output
- **定位**：演示语言特性 + 做最小可复现 + 分享代码片段；**不是全栈编辑器**——不跑后端、不连库、不部署
- **何时转去通用编辑器**：需要真实构建工具链 / Node 服务 / 完整 `npm install` 时，转 StackBlitz / CodeSandbox（TS Playground 甚至直接给「Open in CodeSandbox / StackBlitz」出口）
- ⚠️ **命名陷阱**：Svelte 的 Playground 旧名 **REPL**；Vue 的引擎仓库**也叫** `vuejs/repl`——二者无关，别混
- **入口**：<https://www.typescriptlang.org/play> · <https://play.vuejs.org/> · <https://svelte.dev/playground>

## 什么是「官方 Playground」

这三个工具共享一套清晰的「官方 Playground」范式。它们都不是某个第三方平台搭的在线 IDE，而是**由语言 / 框架的核心团队亲自维护**的在线演示场：你写一段代码，它**立刻在浏览器里用官方编译器编译**，并把编译产物摊开给你看。

把它和你熟悉的通用在线编辑器（StackBlitz / CodePen / CodeSandbox）对照，差别一目了然：通用编辑器是「在云端 / 浏览器里跑一个完整项目」，而官方 Playground 是「在浏览器里演示一种语言 / 框架的编译行为」。前者要的是**真实构建与运行**，后者要的是**透明的编译过程与精确的可复现**。

::: tip 一句话定位
**官方 Playground = 浏览器里跑的、强绑单一框架的、能看编译产物的、用 URL 分享最小可复现的「学习 + repro 工具」。**
:::

## 共性范式（教学主线）

无论用哪一个，这五条特征始终成立，是理解它们的主干：

| 共性                       | 说明                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **官方出品**               | 由各自语言 / 框架核心团队维护，跟随官方版本，是「官方真理来源」                                     |
| **纯客户端编译（无后端）** | 编译器在**浏览器里**直接跑：TS 用 tsc（Monaco 内置）、Vue 用 `@vue/compiler-sfc`、Svelte 用 Svelte 编译器。打开页面即编译，无需 `npm install`、无构建服务器 |
| **强绑各自框架 / 语言**    | 只服务一种技术：TS 只编 TS/JS、Vue 只编 SFC、Svelte 只编 `.svelte`。**不是通用编辑器**             |
| **查看编译产物**           | 核心教学价值——实时看「你写的 → 编译成什么」：TS 看输出 JS / `.d.ts`、Vue 看 render 函数 / SSR、Svelte 看 JS / CSS |
| **URL / hash 分享、最小可复现** | 代码状态压进 URL（多为 hash），一条链接复现完整环境，是 issue repro 的标准做法                  |

### 1. 纯客户端编译：编译器在浏览器里跑

这是最该反复强调的一点：**没有后端**。你不会等一个云容器冷启动，也不存在「代码上传到服务器编译」。三者的编译器都被打包进前端，在你的浏览器标签页里直接执行：

- **TypeScript Playground**：Monaco Editor 内置了 TypeScript 编译器（tsc），输入即编译。
- **Vue SFC Playground**：在浏览器里用 `@vue/compiler-sfc` 把 `.vue` 实时编译成标准 JS + CSS（生产环境这一步通常交给 Vite）。
- **Svelte Playground**：Svelte 编译器在浏览器里实时把 `.svelte` 编成 JS + CSS。

::: warning 别误写成「运行在服务器上」
官方 Playground **不跑在服务器上、不需要部署**。「编译器在浏览器里跑」是它们共同的底层事实，也是和云端 IDE 最本质的区别。
:::

### 2. 看编译产物：编译型技术的「黑盒」变透明

TS、Vue SFC、Svelte 都是**需要预编译**的技术——你写的不是浏览器能直接跑的东西。平时这一步藏在构建工具里（Vite / webpack / tsc），你看不见中间产物。Playground 把这层揭开：

| Playground             | 你写的         | 能实时看到的编译产物                          |
| ---------------------- | -------------- | --------------------------------------------- |
| **TypeScript**         | `.ts` / `.tsx` | 降级后的 **`.JS`**、生成的 **`.D.TS`** 声明    |
| **Vue SFC**            | `.vue`         | **render 函数 / JS**、**SSR 输出**、编译出的 **CSS** |
| **Svelte**             | `.svelte`      | **JS output**、**CSS output**                  |

这对学习语言 / 框架特性极有价值：想搞懂 `<script setup>` 编译成什么、Svelte 的响应式如何落到 JS、TS 的某个语法降级成什么——看产物比读文档直接得多。

### 3. URL / hash 分享：一条链接做最小可复现

三者都把代码状态序列化进 URL（多数放在 hash 段），于是「分享代码」=「复制地址栏」：

- **TypeScript**：代码在 hash（`#code/...`，lz-string 压缩），版本 / flag 在 query（`?ts=`、`?flag=`）。
- **Vue SFC**：整个 REPL 状态序列化进 URL hash。
- **Svelte**：保存后生成 `/playground/{id}` 短链。

这让它们成为**提 issue 时做最小可复现（minimal reproduction）的标准工具**：与其贴一堆代码描述「我这边报错」，不如给一条 Playground 链接，对方点开就是和你一模一样的环境。

## 与通用在线编辑器的区别

官方 Playground 和 StackBlitz / CodePen / CodeSandbox 解决的是不同问题，别拿前者当后者用：

| 对比点       | 官方 Playground                        | 通用在线编辑器（StackBlitz / CodePen / CodeSandbox） |
| ------------ | -------------------------------------- | ---------------------------------------------------- |
| 定位         | **框架 / 语言学习 + bug 最小复现**     | 通用项目开发、原型、托管、协作                       |
| 绑定         | **强绑单一框架 / 语言**                | 任意技术栈、任意依赖                                 |
| 后端 / 全栈  | **不跑后端、不部署**（纯前端编译）     | StackBlitz 用 WebContainers 可跑 Node；CodeSandbox 有云容器，能跑后端 |
| 编译方式     | 浏览器内、官方编译器、看产物为核心     | 真实构建工具链（Vite / webpack / Node），更接近生产 |
| 依赖         | 受限（TS 导类型，Vue / Svelte 走 Import Map / CDN） | 完整 npm 生态                          |
| 分享         | URL / hash 承载代码 + 配置，**精确 repro** | 项目级分享 / Fork / 嵌入                         |
| 谁维护       | 框架核心团队（官方真理）               | 第三方平台                                           |

::: tip 何时该「转过去」
当你需要**完整项目、真实构建、Node 后端或完整依赖安装**时，就该从 Playground 转向 StackBlitz / CodeSandbox。TS Playground 的 Export 菜单甚至直接提供 **Open in CodeSandbox / StackBlitz**，正是「学习 / repro → 完整开发」的过渡出口。
:::

## 一个命名上的坑：两个不相关的「REPL」

这是本主题最容易踩的混淆点，单独点出来：

- **Svelte** 的 Playground **旧名就叫 REPL**（2023 年改版后改名 Playground，旧 `/repl/` 链接重定向到 `/playground/`）。
- **Vue** 的 SFC Playground 引擎仓库**也叫 `vuejs/repl`**（README 自述「Vue SFC REPL as a Vue 3 component」），`play.vuejs.org` 是它的官方部署。

两个「REPL」**毫无关系**——一个是 Svelte 工具的历史名字，一个是 Vue 工具的引擎仓库名。讲到「REPL」时务必看清在说哪一个。
