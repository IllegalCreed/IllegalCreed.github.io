---
layout: doc
---

# Tauri

Tauri 是**用 Rust 写后端、复用操作系统自带 WebView 渲染前端**的跨平台应用框架——你用任意前端框架（Vue/React/Svelte/Leptos…）写界面，用 Rust 写业务逻辑，最终打包成桌面与移动应用。它的关键取舍是**不打包 Chromium/Node**，而是直接调用各系统预装的 WebView（Windows 的 WebView2、macOS/iOS 的 WKWebView、Linux 的 WebKitGTK、Android 的 System WebView），因此安装包极小（最小可 <600KB、典型 2–10MB，Electron 动辄 100MB+）、常驻内存低（~50MB 级）。安全上靠 **Rust 内存安全 + 细粒度权限系统（ACL）+ 全部业务逻辑留在 Rust 侧、前端只能经 IPC 请求** 三重保障，主打「比 Electron 更小、更快、更安全」。**v2（2.0 stable）是分水岭**：把桌面（Win/mac/Linux）扩展到**移动端（iOS/Android）**，实现「单代码库五端」，同时用全新的 ACL 权限体系取代 v1 的扁平 `allowlist`，并把大量核心 API 拆成按需引入的 `tauri-plugin-*` 插件。GitHub 约 **107–108k star**（2026-07），是 Electron 之外最受关注的跨平台桌面/移动方案。

## 概述

- **定位**：任意 HTML/CSS/JS 前端 + Rust（移动端可选 Swift/Kotlin 原生扩展）后端，打包成桌面与移动应用；**前端无关**，Vite / Next.js / Nuxt / SvelteKit / Leptos / Trunk 等均有官方适配。
- **架构（重中之重）**：**Tauri Core（Rust）** 编排一切 + 上游 **WRY**（WebView 渲染抽象）与 **TAO**（窗口库，fork 自 winit）+ 各平台**系统 WebView** 渲染前端；依赖链 `tauri` → `tauri-runtime` → `tauri-runtime-wry` → WRY → TAO。
- **核心卖点**：**小体积**（不打包浏览器引擎）、**低内存**（无独立 Chromium 进程）、**安全**（Rust + ACL + IPC 隔离）、**前端无关**。
- **v2 头号特性**：**移动五端**（Win/mac/Linux + iOS/Android，单入口 `lib.rs` 共享）+ **ACL 权限体系**（Permissions/Scopes/Capabilities 取代 v1 allowlist）+ **插件化**（核心 API 拆成 `tauri-plugin-*`）。
- **代价与选型**：复用系统 WebView → 各 OS 渲染一致性不如自带 Chromium 的 Electron，需跨平台测试；后端要用 Rust，纯前端团队有上手成本。要极致体积/安全/移动端选 Tauri，要渲染绝对一致/纯 JS 后端/最全生态选 Electron。

## 本叶地图

- [入门](./getting-started) —— Tauri 是什么、卖点、环境准备、create-tauri-app 起步、项目结构、第一个 invoke 命令
- [架构与进程模型](./guide-line/architecture) —— Core/WRY/TAO 三层、各平台系统 WebView、多进程模型、小体积根因与代价、体积优化
- [命令与 IPC](./guide-line/commands-ipc) —— `#[tauri::command]` + `invoke`、错误处理、async 限制、Event、Channel、State 状态管理
- [权限系统 ACL](./guide-line/permissions) —— v2 三件套 Permissions/Scopes/Capabilities、TOML/JSON 写法、标识符规则、插件接入、v1→v2 迁移坑
- [分发与安全加固](./guide-line/distribute) —— `tauri build` 打包产物、代码签名、updater 自动更新、Sidecar、CSP、Isolation Pattern、配置骨架
- [对比 Electron 与 Wails](./guide-line/vs-electron) —— 与 Electron 全维度对照、与 Wails（Go 系）差异、选型决策、标杆应用
- [参考](./reference) —— 版本坐标 / API 速记 / CLI / 权限标识符 / 配置骨架 / vs Electron / 高频坑 等速查表 + 权威链接

## 文档地址

- [Tauri 官网](https://v2.tauri.app/) —— v2 一手文档
- [Start](https://v2.tauri.app/start/) —— 环境准备、create-tauri-app、前端框架适配
- [Core Concepts](https://v2.tauri.app/concept/) —— 架构、进程模型、IPC 概念
- [Inter-Process Communication](https://v2.tauri.app/concept/inter-process-communication/) —— Commands / Events / Channel
- [Security](https://v2.tauri.app/security/) —— Permissions / Scopes / Capabilities / CSP / Isolation
- [Develop](https://v2.tauri.app/develop/) —— 调用 Rust/前端、状态管理、Sidecar
- [Distribute](https://v2.tauri.app/distribute/) —— 各平台打包、签名、更新
- [Plugins](https://v2.tauri.app/plugin/) —— 30+ 官方插件目录
- [tauri-apps/tauri](https://github.com/tauri-apps/tauri) —— 源码与 issue

## 幻灯片地址

- <a href="/SlideStack/tauri-slide/" target="_blank">Tauri</a>
