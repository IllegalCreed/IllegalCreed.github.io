---
layout: doc
---

# Wails

Wails 是**用 Go 写后端、用系统原生 WebView 渲染前端**的跨平台桌面框架——把编译后的 Go 应用与任意前端资源打进**单一可执行文件**。它的定位是「**Go 版的轻量 Electron 替代**」：与 Tauri 思路一致（复用系统 WebView、不打包 Chromium、体积与内存远小于 Electron），差别在于后端语言是 **Go 而非 Rust**，受众正是 Go 开发者。核心卖点是——**Go 的公开方法自动绑定到前端 JS**、**自动生成 TypeScript 模型**、前端框架任选（React/Vue/Svelte/原生皆可）、Windows 上**无需 CGO、无需外部 DLL**。2026 年 Wails 处于**「v2 稳定生产、v3 alpha 预览」双轨期**：生产推荐 **v2.12**（配 Go 1.21+），而架构大改的 **v3**（`application.New` + Services + 多窗口 + 系统托盘）**仍是 alpha、尚未 GA**，最新为 `v3.0.0-alpha2.111`（2026-07-01）。它在 GitHub 约 **35k star**，是 Go 生态里最主流的桌面方案。

## 概述

- **定位**：Go 后端 + 系统 WebView 渲染 + 任意前端，产物是单一可执行文件；面向 Go 团队的「轻量 Electron 替代」，与 Tauri 同路线、异语言（Go vs Rust）。
- **不打包浏览器**：复用平台原生渲染引擎——Windows 用 WebView2（Chromium 内核）、macOS 用 WKWebView（同 Safari）、Linux 用 WebKitGTK。因此体积小、随 OS 安全更新、系统集成好，代价是要面对**各平台 WebView 行为差异**。
- **绑定是灵魂特性**：把 Go struct 实例交给 Wails，其**首字母大写的公开方法**自动生成 JS 包装（恒返回 Promise）与 **TypeScript 声明 + 模型**，前端 `import` 即调；配合 Go/JS 对等的**事件系统**与 **runtime 库**（窗口/对话框/剪贴板/日志）。
- **前端资源零约束**：只要给一个含 `index.html` 的 `embed.FS`，Wails 就把它嵌进二进制；用不用打包、用什么框架都随意。
- **v2 vs v3（务必分清）**：**v2 稳定、生产首选**（`wails` CLI、`wails.Run` + `Bind`）；**v3 仍 alpha 未 GA**（`wails3` CLI、`application.New` + `Services`，带来多窗口/系统托盘/Taskfile 构建），新特性诱人但生产勿用。

## 本叶地图

- [入门](./getting-started) —— Wails 是什么、vs Electron/Tauri、装 CLI 与建项目、核心心智、v2/v3 版本坐标
- [架构](./guide-line/architecture) —— Go 后端 + 系统 WebView + 任意前端 + `embed.FS` 单文件模型、平台 WebView 差异、vs Tauri
- [绑定与 Runtime](./guide-line/bindings-runtime) —— v2 `Bind` 绑 Go 方法、自动 TS 生成、Promise 语义、事件系统、runtime 库
- [v2 与 v3](./guide-line/v2-vs-v3) —— v3 架构大改（`application.New`/Services/多窗口/系统托盘/Taskfile）、逐项对照、**v3 仍 alpha 未 GA**
- [构建与工程化](./guide-line/build) —— `wails init/dev/build` CLI、`wails.json` 配置、dev server 热重载、生产打包
- [参考](./reference) —— 版本坐标 / CLI 命令 / 关键 API / wails.json 字段 / v2↔v3 对照 / 选型 / 易错点 等速查表 + 权威链接

## 文档地址

- [Wails 官网（v2 稳定文档）](https://wails.io/) —— 定位、指南、CLI、runtime 一手文档
- [How Does It Work](https://wails.io/docs/howdoesitwork) —— 架构、Bind、TS 生成、Promise 语义（最核心）
- [Getting Started](https://wails.io/docs/gettingstarted/installation) —— 依赖、Go 版本、`wails doctor`
- [CLI Reference](https://wails.io/docs/reference/cli) —— `init`/`dev`/`build`/`generate`/`doctor` 全 flag
- [Runtime Reference](https://wails.io/docs/reference/runtime/intro) —— 窗口/对话框/事件/剪贴板 API
- [Wails v3 文档（alpha 预览）](https://v3.wails.io/) —— `application.New`/Services/多窗口/系统托盘/Taskfile（**未 GA**）
- [v3 Status](https://v3.wails.io/status) —— v3 alpha 状态与路线图
- [GitHub wailsapp/wails](https://github.com/wailsapp/wails) —— 源码、Releases、Issue

## 幻灯片地址

- <a href="/SlideStack/wails-slide/" target="_blank">Wails</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=wails" target="_blank" rel="noopener noreferrer">Wails 测试题</a>
