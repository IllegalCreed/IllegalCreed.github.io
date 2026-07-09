---
layout: doc
---

# Lynx

Lynx 是**字节跳动 2025 年开源的高性能跨端 UI 框架**，口号 **「Write Once, Render Anywhere」**（官网另有 「Unlock Native for More」）。它让你用**Web 技术栈（React 心智 + 类 Web 的 CSS）** 编写界面，在 **iOS / Android / HarmonyOS / Web / Desktop** 多端渲染。最大的差异化是**双线程架构**——主线程负责首帧渲染与高优先级手势、后台线程跑业务逻辑——配合自研 JS 引擎 **PrimJS**，主打「秒开 + 丝滑」。它由 TikTok 团队推动开源，字节系产品（**TikTok、CapCut** 等）已大规模落地。

> **本叶定位：新兴 / 观察叶。** Lynx 2025-03 才开源，厂内规模化使用，但**厂外生态、三方库与文档仍处早期**，社区规模远小于 React Native / Flutter，2026 年尚非主流主力选型。本叶按「前瞻 / 观察」讲清它的**架构差异化**，帮助你判断何时值得试验，而不把它当成成熟方案推荐。部分实现细节官方资料尚不充分，文中已逐一标注「资料尚不充分」，不臆断为事实。

## 概述

- **定位**：字节 2025 开源的跨端 UI 框架，用 React + 类 Web CSS 写、多端渲染；核心卖点是**双线程架构**与自研 **PrimJS** 引擎带来的启动与响应性能。目标群体是有 Web/React 背景、追求原生级体验又想一套代码多端的团队。
- **双线程架构（差异化核心）**：**主线程 / UI 线程**（PrimJS 驱动，负责首帧渲染与高优先级事件/手势）+ **后台线程**（默认跑用户业务代码、副作用与异步，保持主线程低负载不阻塞）。这是它区别于 RN「单 JS 线程为主」模型的最大特征。
- **上层框架 ReactLynx**：官方的 idiomatic React 方案，完整支持函数组件 / Hooks / Context；但因双线程，代码会在两个线程各跑一次，有专门的线程作用域规则（详见 ReactLynx 页）。Lynx 架构层不与 React 强绑，另有 Vue/Svelte 等上层（成熟度资料尚不充分）。
- **类 Web 的样式**：支持 **linear / flex / grid / relative** 四种布局、CSS 动画/过渡、CSS 变量与选择器；比 RN 更接近 Web 心智（RN 无 Grid、无级联）。注意仍有差异：默认 `box-sizing: border-box`、无 margin 折叠、文本必须包在 `<text>` 里。
- **工具链**：脚手架 `npm create rspeedy@latest`（构建工具 **Rspeedy**，基于 Rspack）；`npm run dev` 出二维码，用 **Lynx Explorer App** 扫码或粘贴 bundle URL 预览。
- **现状与选型**：厂内大规模、厂外早期；值得**关注 / 试验**，一般团队 2026 年**尚不宜当主力**。

## 本叶地图

- [入门](./getting-started) —— Lynx 是什么、为何是「新兴/观察」、用 `npm create rspeedy` 起步、预览与调试、心智地图
- [双线程架构与 PrimJS](./guide-line/dual-thread) —— 主/UI 线程 vs 后台线程、Main-Thread Scripting、Instant First-Frame Rendering、自研引擎 PrimJS、性能口径的正确理解
- [ReactLynx 与开发模型](./guide-line/reactlynx) —— idiomatic React、双线程下的 `'main thread'` 指令与副作用「双跑」、类 Web CSS/Grid、Rspeedy 脚手架、不止 React
- [与 React Native 对比·生态现状](./guide-line/status-vs-rn) —— 线程模型/引擎/样式/成熟度逐项对比、渲染模型的微妙之处、2026 选型建议
- [参考](./reference) —— 版本坐标 / 架构关键词 / CSS 差异 / 起步命令 / 易错点 速查 + 待核清单 + 权威链接

## 文档地址

- [Lynx 官网](https://lynxjs.org/) —— 一手文档、Guide/APIs/Learn/Blog，中英双语
- [Quick Start](https://lynxjs.org/guide/start/quick-start.html) —— 脚手架、起步、预览
- [ReactLynx 文档](https://lynxjs.org/react/) —— idiomatic React、双线程心智、生命周期
- [Why Lynx（博客）](https://lynxjs.org/blog/lynx-unlock-native-for-more) —— 双线程 / MTS / IFR / PrimJS 的设计动机
- [GitHub · lynx-family/lynx](https://github.com/lynx-family/lynx) —— C++ 内核，Apache-2.0

## 幻灯片地址

- <a href="/SlideStack/lynx-slide/" target="_blank">Lynx</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=lynx" target="_blank" rel="noopener noreferrer">Lynx 测试题</a>
