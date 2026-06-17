---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 blog.codepen.io/documentation 2025–2026 现状编写

## 速查

- **本质**：面向前端 / 设计的社区型在线 Playground，把 HTML/CSS/JS（预处理后）拼成预览文档，在 **iframe** 里渲染——**纯前端沙箱，不跑 Node / 无后端**
- **能力边界**：要装包跑构建、起 dev server、连数据库 → 用 StackBlitz / CodeSandbox；CSS 动效、组件片段、设计 demo、文档嵌入 → 用 CodePen
- **核心单位**：**Pen**（经典三面板 HTML / CSS / JS，自动实时预览）；2.0 升级为多文件 Pen（见「编辑器与预处理器」）
- **新建 Pen**：登录后顶部 **Create → Pen**，或直接访问 `codepen.io/pen`
- **预处理器**：每个面板齿轮（gear）里选——HTML: Markdown/Pug；CSS: SCSS/Sass/Less/Stylus/PostCSS；JS: Babel(JSX)/TypeScript
- **引库**：面板齿轮 → Settings 里搜 **CDNjs**（quick-add）选版本注入，或填外部 URL
- **标配特性**：Auto-Updating Preview、Autosave、Emmet、Console、Fork、Templates
- ⚠️ **Classic Pen 限制**：相对路径不可用（资源用完整 URL）；约 **1MB / 100 万字符**禁用保存
- **社区定位**：评论 / love / 关注 / Collections / CodePen TV，社交属性远超 JSFiddle
- **两套编辑器并存**：Classic（1.0，Rails）与 CodePen 2.0（Next.js + SSR，公开 Beta，入口 `codepen.io/beta`）
- **文档**：<https://blog.codepen.io/documentation/>

## 什么是 CodePen

CodePen 是一个**在浏览器里写前端代码、即时看渲染结果**的在线 Playground。它把你在三个面板里写的 HTML、CSS、JS（经预处理器编译后）拼成一份「预览文档」，放进一个 **iframe** 实时渲染。你改一个字符，预览就跟着刷新——全程不需要本地安装任何东西。

它最常见的两个场景：

1. **前端片段的快速实验与分享**——一段 CSS 动画、一个布局技巧、一个 React/Vue 小组件，写完即跑、随手分享链接。
2. **文档 / 教程里的可运行示例**——通过 Prefill Embed API 把示例代码嵌进网页，读者点开即跑、即改（本系列「嵌入与 CodePen 2.0」一章专讲）。

::: tip 一句话定位
CodePen 的本质是「浏览器内的前端 iframe 沙箱 + 社区」。它不在云端给你一台机器，而是把你的代码在**你自己的浏览器标签页里**渲染成一个预览页面。所以它跑得飞快，但也只能跑「浏览器原生能直接运行的东西」。
:::

## 能力边界：纯前端沙箱（vs StackBlitz / CodeSandbox）

理解 CodePen「能做什么、不能做什么」，关键在于它的渲染模型——**没有服务器运行时**：

- 所有 JS 都在浏览器端执行，CodePen 只处理「浏览器能直接跑的东西」+ 编译期预处理器。
- **不跑 Node、无后端、无数据库、无服务端语言**（PHP / Ruby / Python 全都不行）。

把它和另外两家放在一起，能力边界一目了然：

| 平台            | 运行技术                          | 能跑 Node / 后端？    | 定位                                       |
| --------------- | --------------------------------- | --------------------- | ------------------------------------------ |
| **CodePen**     | 浏览器 **iframe** 沙箱            | ❌ 否（纯前端）       | 前端 / 设计 demo、片段、社区展示、文档嵌入 |
| **StackBlitz**  | **WebContainers**（浏览器内跑 Node，WASM） | ✅ 是（浏览器内、可离线、秒启动） | 全栈 / 框架项目，`npm install` 真跑        |
| **CodeSandbox** | **云容器 / microVM**             | ✅ 是（云端，强协作 + GitHub/Vercel 集成） | 完整项目结构、团队实时协作                 |

::: tip 怎么选
**「React 片段 / CSS 动画 / 设计 demo → CodePen；要装包跑构建、起服务器、连数据库 → StackBlitz 或 CodeSandbox」**。CodePen 胜在轻、快、社区强；另外两家胜在真能跑后端。
:::

## 新建一个 Pen

**Pen** 是 CodePen 的基本工作单位——经典的「三面板」编辑器：HTML、CSS、JS 各一块，下方（或一侧）是自动刷新的预览。

新建方式：

- 登录后点顶部导航的 **Create → Pen**；
- 或直接访问 `codepen.io/pen`（未登录也能写，但要保存 / 分享需登录）。

进入后就能在三个面板里直接写代码，预览会**自动实时更新**（Auto-Updating Preview）。写完点 **Save** 保存，CodePen 会给这个 Pen 分配一个 URL（形如 `codepen.io/<用户名>/pen/<hash>`）。

::: warning 免费 Pen 全部公开
免费账号创建的 Pen **都是公开的**（任何人可见、可被搜索到、可被 Fork）。需要私有 Pen（仅自己 + 拿到私链者可见）必须升级 **PRO**。
:::

## 基本用法

一个最典型的「写 → 看 → 分享」流程：

1. **写代码**：在 HTML / CSS / JS 三个面板里直接写。需要更顺手的语法，就在面板齿轮里选预处理器（SCSS、Pug、TypeScript…，见下一章）。
2. **引库**：要用第三方库，点面板齿轮进 Settings，用内置搜索框搜 **CDNjs** 上的库、选版本注入；或直接填外部资源 URL。
3. **看预览**：预览随键入实时刷新；点 **Console** 看 `console.log` 输出，点 **Debug / Full Page View** 看不带编辑器的整页效果。
4. **分享 / 嵌入**：点 **Save** 后复制 URL 分享；要嵌进自己的网页 / 文档，用 Embed 菜单或 Prefill Embed API（见「嵌入与 CodePen 2.0」）。

编辑器还有一批标配特性，日常会经常用到：

- **Autosave**（自动保存）、**Emmet / Tab Triggers**（HTML/CSS 缩写展开）、**Autocomplete**（补全）；
- **Fork**（把任何 Pen——包括别人的——复制一份到自己账号继续改）、**Templates**（用模板起新 Pen）。

::: warning Classic Pen 的两个硬限制
1. **相对路径不可用**：`<img src="./pic.png">` 这类相对路径在 Classic Pen 里**不工作**，资源必须用完整 URL（`https://...`）。（CodePen 2.0 的多文件 Pen 支持相对路径，见下一章。）
2. **大小上限**：单个 Pen 超过约 **100 万字符 / 1MB 代码**会**禁用保存**（编辑器变慢、保存失败甚至崩溃）。更大的项目应改用 2.0 多文件 Pen。
:::

## 社区与展示定位

CodePen 不只是个编辑器，更是一个**前端 / 设计社区**——这也是它和 JSFiddle 这类「纯片段测试器」最大的区别。

- **社交互动**：每个 Pen 可被评论、点 love（类似点赞）、被收进 Collections、被关注的人看到；首页与 **CodePen TV** 持续展示社区精选作品。
- **作品集与灵感**：很多前端 / 设计师把 CodePen 当作品集和灵感来源——搜一个效果（如「CSS hover 卡片」），能直接 Fork 别人的实现来学习改造。
- **教学场景**：配合可编辑嵌入、Live View、Presentation Mode（多为 PRO，详见后续章节），CodePen 也常用于课堂演示与跨设备同步预览。

::: tip 社区是 CodePen 的护城河
能力上 CodePen 比不过能跑后端的 StackBlitz / CodeSandbox，但它的**社区规模与社交氛围**是独一份的。当你想「看看别人怎么实现这个效果」时，CodePen 往往是第一站。
:::
