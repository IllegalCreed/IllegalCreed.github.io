---
layout: doc
---

# Electron

Electron 是**用 HTML/CSS/JavaScript + Chromium + Node.js 构建 Windows/macOS/Linux 跨平台桌面应用**的框架——它把一份 Chromium 渲染引擎与一份 Node.js 运行时**内置**进应用，让你用 Web 技术栈写界面、用 Node 生态碰系统能力，**一套代码三端一致渲染**。这正是它与「套系统 WebView」方案的根本差异：应用自带引擎，不吃各平台 WebView 的版本与行为差异，还能**独立于操作系统**下发安全与稳定修复。它沿用 Chromium 的**多进程架构**（主进程管窗口与原生、渲染进程跑 UI、preload 当特权桥），并默认收紧三道安全开关（关 Node、开上下文隔离、开沙箱）。由 **OpenJS 基金会**托管，成熟稳定，是当今**桌面应用开发的事实标准**——VS Code、Slack、Discord、Signal、Notion、Docker Desktop、ChatGPT 与 Claude 桌面版皆基于它。代价是体积与内存：安装包常 >100MB、单应用常占 150-300MB。最新稳定线 **Electron 43**（Chromium 150 + Node 24），每 8 周发一个大版本、支持最新 3 个大版本。

## 概述

- **定位**：用 Web 技术栈（HTML/CSS/JS）+ 内置 Chromium + 内置 Node.js 写跨平台桌面应用；渲染引擎自带，故三端渲染一致，且可脱离系统独立升级。适合 UI 复杂、需三端一致、重度依赖 npm 生态、看重成熟签名/更新链路的桌面产品。
- **进程模型（重中之重）**：**主进程 main**（1 个，Node 环境，管窗口 `BrowserWindow`、`app` 生命周期、菜单/托盘/对话框等原生能力）＋ **渲染进程 renderer**（N 个，Chromium 环境，跑 UI，默认无 Node）＋ **预加载脚本 preload**（在网页前运行的特权桥，用 `contextBridge` 安全暴露 API）＋ **工具进程 utility**（可选 Node 子进程）。
- **安全（头号考点）**：三个默认安全开关——`nodeIntegration=false`（v5 起）、`contextIsolation=true`（v12 起）、`sandbox=true`（v20 起）；配官方安全 Checklist（HTTPS-only、定义 CSP、校验 IPC sender、`setWindowOpenHandler` 拦新窗、只暴露窄接口）与构建期 **Fuses** 硬化。
- **IPC 通信**：`ipcMain` / `ipcRenderer` + `contextBridge` 四模式——`send/on`（渲→主单向）、`invoke/handle`（渲→主双向★最常用）、`webContents.send`（主→渲）、`MessageChannelMain`（渲↔渲）；对象走结构化克隆，避免同步的 `sendSync`。
- **分发与更新**：**Electron Forge**（官方，package/make/publish）或 **electron-builder**（社区，自带更新）；**ASAR** 归档打包源码；mac 须签名 + 公证、Win 走 EV 证书 / Azure Trusted Signing；内置 `autoUpdater`（底层 Squirrel），一行 `update-electron-app` 即可接免费更新服务。
- **取舍 / vs Tauri**：换来跨端一致与成熟生态，代价是体积大（>100MB）与内存高（150-300MB）；**Tauri v2** 用系统 WebView + Rust，包体小 10-30 倍、内存省数倍，但渲染一致性弱、生态更年轻。不适合低内存 IoT、纯原生 UI 诉求、高性能 3D/游戏。

## 本叶地图

- [入门](./getting-started) —— Electron 是什么、为什么用、标杆应用与取舍、用 Forge 起步、最小主进程与窗口、进程模型初识
- [进程模型](./guide-line/process-model) —— 主/渲染/preload/utility 四类进程各自职责与运行环境、Chromium 沙箱机制与开关
- [IPC 进程间通信](./guide-line/ipc) —— `ipcMain`/`ipcRenderer`/`contextBridge`、四种通信模式、结构化克隆序列化、不可序列化类型与遗留 API
- [安全](./guide-line/security) —— 三个默认安全开关的历史、上下文隔离 + contextBridge、官方安全 Checklist、校验 IPC sender、构建期 Fuses 硬化
- [打包与分发](./guide-line/packaging) —— Electron Forge vs electron-builder、ASAR 归档、代码签名与公证（mac/Win）、`autoUpdater` 自动更新
- [原生能力与生命周期](./guide-line/native-lifecycle) —— 原生 API 一览、原生通知、`app` 生命周期事件、单实例锁、性能 Checklist、vs Tauri 选型
- [参考](./reference) —— 版本坐标 / 进程模型 / 三开关 / IPC 四模式 / 安全 Checklist / Fuses / 分发更新 / 原生 API / vs Tauri / 易错点 速查表 + 权威链接

## 文档地址

- [Electron 官网](https://www.electronjs.org/) —— API、指南、教程一手文档
- [Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites) —— 官方分步入门（进程模型 → IPC → 打包 → 更新）
- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) —— 主/渲染/preload 进程模型一手说明
- [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc) —— IPC 四模式官方教程
- [Security](https://www.electronjs.org/docs/latest/tutorial/security) —— 官方安全 Checklist（头号必读）
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses) —— 构建期安全硬化
- [Electron Forge](https://www.electronforge.io/) —— 官方推荐打包分发工具链
- [Releases](https://releases.electronjs.org/) —— 版本节奏、Chromium/Node 对应、支持窗口

## 幻灯片地址

- <a href="/SlideStack/electron-slide/" target="_blank">Electron</a>
