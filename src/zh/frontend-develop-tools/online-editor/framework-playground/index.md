---
layout: doc
---

# 框架官方 Playground

三个由语言 / 框架核心团队官方出品的在线 Playground 合集——**纯客户端编译**（编译器直接在浏览器里跑、无后端）、**强绑各自框架**、核心价值在于**实时看编译产物**、并用 **URL / hash 分享**做最小可复现（repro）的「学习 + repro 工具」。覆盖 **TypeScript Playground**（看输出 JS / `.d.ts`）、**Vue SFC Playground**（看 render 函数 / SSR / CSS）、**Svelte Playground**（看 JS / CSS output，原名 REPL）。

## 评价

**优点**

- **官方真理来源**：三者都跟随各自语言 / 框架的官方版本发布，是「这段代码会被编译成什么」最权威的演示场
- **纯客户端、零安装**：打开链接即编译，无需 `npm install`、无构建服务器、无后端，体感即开即用
- **看编译产物是杀手锏**：TS 看降级后的 JS 与生成的 `.d.ts`、Vue 看 SFC 编译出的 render 函数 / SSR / CSS、Svelte 看编译出的 JS / CSS——编译型框架的「黑盒」就此透明
- **一条 URL 即完整复现**：代码状态压进 URL（多为 hash），别人点开就是同一份环境，是提 issue 做最小可复现的标准工具
- **可平滑过渡**：TS Playground 直接提供「Open in CodeSandbox / StackBlitz」出口，学习完一键转去通用编辑器做完整项目

**缺点**

- **定位窄**：只服务单一框架 / 语言，不是通用编辑器，不能任意组合技术栈
- **不跑后端、不部署**：纯前端编译，需要真实构建工具链 / Node 服务 / 数据库时必须转向 StackBlitz / CodeSandbox
- **依赖能力受限**：不是完整 `npm install`——TS 靠自动拉类型、Vue / Svelte 走 Import Map / CDN 解析
- **命名易混**：Svelte 的 Playground 旧称 REPL，Vue 引擎仓库也叫 `vuejs/repl`，二者毫不相关，初学者常搞混

## 文档地址

[TS Playground](https://www.typescriptlang.org/play) / [Vue SFC Playground](https://play.vuejs.org/) / [Svelte Playground](https://svelte.dev/playground)

## GitHub地址

[TypeScript-Website](https://github.com/microsoft/TypeScript-Website) / [vuejs/repl](https://github.com/vuejs/repl) / [svelte](https://github.com/sveltejs/svelte)

## 幻灯片地址

<a href="/SlideStack/framework-playground-slide/" target="_blank">框架官方 Playground</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%A1%86%E6%9E%B6%E5%AE%98%E6%96%B9-playground" target="_blank" rel="noopener noreferrer">框架官方 Playground 测试题</a>
