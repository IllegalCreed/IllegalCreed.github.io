---
layout: doc
---

# Neutralino

Neutralino（Neutralinojs）是一个**极轻量、可移植的跨平台桌面应用框架**：它用**系统自带的 WebView** 渲染前端（**不打包 Chromium**），配一个**极薄的 C++ 后端二进制**（内嵌静态服务器 + 原生能力），前端纯用 JS/HTML/CSS。它最大的差异化在于**不需要 Node.js / Rust / Go 等任何额外运行时**——Electron/NW.js 要捆绑 Node + Chromium，Tauri 需要 Rust，Wails 需要 Go，而 Neutralino 只有一个 C++ 内核 + 系统能力。代价是产物极小：Hello World 未压缩约 2MB、压缩后约 0.5MB。它兼容任意前端框架（React/Vue/Angular/Svelte/原生 JS），支持 Linux/Windows/macOS 以及浏览器模式。项目较小众（GitHub ≈8.5k star），定位是「更轻但更简」的补充选项，而非要与 Electron/Tauri 全面竞争。

## 概述

- **定位**：极轻量的桌面（+ Web）应用框架，用**系统 WebView + 极薄 C++ 后端**跑纯 JS/HTML/CSS 前端；主打**小体积、零额外运行时**。
- **核心架构**：前端（系统 WebView）与后端（C++ 二进制）之间用**本地 WebSocket** 通信，JSON 消息经 **UUID 任务池**配对；后端内嵌 **HTTP 静态服务器**交付前端资源。详见[架构](./guide-line/architecture)。
- **原生 API**：前端通过 `Neutralino.*` 命名空间（`os` / `filesystem` / `window` / `computer` / `storage` / `events` …）调用原生能力，运行时另有 `NL_*` 只读全局变量。详见[原生 API 与扩展](./guide-line/api-extensions)。
- **Extensions（差异化能力）**：基于 WebSocket 的扩展系统，可用**任意语言**（Python/Go/Node/C++…）写后端逻辑，不必从源码重编框架。
- **工程化**：`neu` CLI（`create` / `run` / `build` / `update`）+ `neutralino.config.json` 配置 + 四种运行模式（window / browser / cloud / chrome）。详见 [CLI、配置与运行模式](./guide-line/cli-config-modes)。
- **安全**：靠 `tokenSecurity`（WebSocket 令牌策略）+ `nativeAllowList` / `nativeBlockList`（原生方法白/黑名单）手动收紧，**没有 Tauri 那种「默认拒绝」的强权限模型**。
- **选型**：适合极简小工具、内部工具、对包体积敏感且不需要原生 UI 组件的场景；生态与成熟度弱于 Electron/Tauri。详见[对比 Electron / Tauri / Wails](./guide-line/vs-others)。

## 本叶地图

- [入门](./getting-started) —— Neutralino 是什么、为何极轻量、`neu` CLI 起步、第一段代码、心智地图
- [架构](./guide-line/architecture) —— 系统 WebView + 极薄 C++ 后端、WebSocket + UUID 任务池、内嵌静态服务器、无额外运行时的取舍
- [原生 API 与扩展](./guide-line/api-extensions) —— `Neutralino.*` 命名空间、`NL_*` 全局变量、Extensions 任意语言后端与消息协议
- [CLI、配置与运行模式](./guide-line/cli-config-modes) —— `neu` 命令、`neutralino.config.json`、`tokenSecurity` / `nativeAllowList` 安全、window/browser/cloud/chrome 四模式
- [对比 Electron / Tauri / Wails](./guide-line/vs-others) —— 渲染/运行时/体积/权限横向对比、优点与代价、适用场景
- [参考](./reference) —— 命名空间 / 全局变量 / CLI / 配置 / 模式 / 对比 / 易错点 速查表 + 权威链接

## 文档地址

- [Neutralino 官网](https://neutralino.js.org/) —— 一手文档入口
- [Getting Started](https://neutralino.js.org/docs/getting-started/your-first-neutralinojs-app) —— 安装、创建第一个应用
- [API Overview](https://neutralino.js.org/docs/api/overview) —— `Neutralino.*` 命名空间总览
- [Global Variables](https://neutralino.js.org/docs/api/global-variables) —— `NL_*` 运行时全局变量
- [Configuration](https://neutralino.js.org/docs/configuration/neutralino.config.json) —— `neutralino.config.json` 字段说明
- [Modes](https://neutralino.js.org/docs/configuration/modes) —— 四种运行模式
- [Extensions Overview](https://neutralino.js.org/docs/how-to/extensions-overview) —— 任意语言扩展系统
- [GitHub: neutralinojs](https://github.com/neutralinojs/neutralinojs) —— 框架内核仓库

## 幻灯片地址

- <a href="/SlideStack/neutralino-slide/" target="_blank">Neutralino</a>
