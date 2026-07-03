---
layout: doc
outline: [2, 3]
---

# Wails 架构

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- **三层模型**：**Go 应用（业务 + Wails runtime 库）** —（绑定层 / 内存桥）→ **系统原生 WebView 渲染前端**；全部编译进**单一可执行文件**
- **系统 WebView（不打包浏览器）**：Windows `WebView2`（Chromium 内核）/ macOS `WKWebView`（同 Safari 的 WebKit）/ Linux `WebKitGTK` → 体积小、随 OS 安全更新、系统集成好
- **前端资源零约束**：只要一个含 `index.html` 的 `embed.FS`；生产时资源**全部嵌进二进制**，无外部文件；用不用打包、用什么框架都随意
- **两个交互面**：①调用**绑定的 Go 方法**；②调用 **runtime 方法**（窗口/对话框/事件/剪贴板/日志/浏览器）——见[绑定与 Runtime](./bindings-runtime)
- **Windows 特性**：**无需 CGO、无需外部 DLL**，但目标机需装 **WebView2 运行时**（`wails doctor` 可查）
- **可选 AssetsHandler**：给 AssetServer 挂一个 `http.Handler` 动态生成文件 / 处理 POST/PUT；GET 先走 `embed.FS`，miss 再转 handler
- **vs Tauri**：同路线（都复用系统 WebView、小体积），差**后端语言**——Wails 是 **Go**、Tauri 是 Rust
- **共性坑**：Wails/Tauri 都用系统 WebView（**非同一个 Chromium**）→ 跨平台渲染/兼容性需实测；体积内存数字**只作数量级**

## 一、整体结构：三层 + 单文件

Wails 应用在运行时是「Go 进程 + 一个内嵌的系统 WebView 窗口」，编译产物则是**一个可执行文件**：

```
┌─────────────────────────────────────────────┐
│  Go 应用（业务逻辑 + Wails runtime 库）        │  ← 编译进单一可执行文件
│      │  绑定层 / 内存桥(in-memory bridge)      │
│      ▼                                        │
│  系统原生 WebView（渲染前端）                  │
│   ├ Windows: WebView2（Chromium 内核）        │
│   ├ macOS:   WKWebView / WebKit（同 Safari）  │
│   └ Linux:   WebKitGTK                        │
│      前端资源：任意框架 React/Vue/Svelte/...   │  ← embed.FS 打进二进制
└─────────────────────────────────────────────┘
```

- **上层**：你的 Go 代码 + Wails 提供的 runtime 库，负责业务逻辑与调窗口/对话框等系统能力。
- **中间**：**绑定层 / 内存桥**——Go 与 WebView 里的 JS 通过进程内内存通信（非网络、非序列化 IPC 那种重量级），把 Go 方法暴露给前端、把事件双向打通。
- **下层**：操作系统自带的 WebView 组件渲染前端页面。

## 二、为什么用系统 WebView 而不打包浏览器

这是 Wails（以及 Tauri）区别于 Electron 的根本设计：**不把 Chromium 塞进产物，而是复用操作系统已有的渲染引擎。**

| 平台 | WebView 组件 | 内核 |
| --- | --- | --- |
| Windows | **WebView2** | Chromium（Edge） |
| macOS | **WKWebView** | WebKit（同 Safari） |
| Linux | **WebKitGTK** | WebKit |

带来的收益与代价：

- **收益**：产物体积小（不含浏览器）、内存占用低、WebView 随操作系统自动安全更新、与系统集成更自然。
- **代价**：**三平台的 WebView 内核不同**（Chromium vs WebKit），同一段前端代码在不同平台可能有渲染或 API 兼容差异——**跨端务必实测**。这是 Wails 与 Tauri 共有的通病；官方也承认极少数前端库在某些 WebView 下不可用。
- **Windows 前提**：需目标机装有 **WebView2 运行时**（Win11 自带，Win10 可能需补装），但**打包本身无需 CGO、无需附带外部 DLL**。

支持平台大致为：Windows 10/11（AMD64/ARM64）、macOS（较新版本，AMD64 与 ARM64）、Linux（AMD64/ARM64）。

## 三、前端资源：embed.FS 与零约束

Wails 对前端「几乎什么都不做」——它只要一个 **`embed.FS`**（Go 1.16+ 的标准库嵌入机制），里面含一个 `index.html` 即可：

```go
// 把前端构建产物整个目录嵌进二进制；all: 前缀确保包含以 . 开头的文件
//go:embed all:frontend/dist
var assets embed.FS

// 交给 AssetServer
AssetServer: &assetserver.Options{Assets: assets},
```

- **零约束**：普通 HTML/CSS/JS 也行，不强制用任何打包器或框架；内置模板覆盖 Svelte/React/Vue/Preact/Lit/Vanilla（JS + TS 两版）。
- **生产即单文件**：构建后前端资源**全部嵌入二进制**，运行时无外部文件依赖，便于分发。
- **可选 AssetsHandler**：可给 AssetServer 额外挂一个 `http.Handler`——GET 请求先查 `embed.FS`，找不到再转交 handler（可用于动态生成文件、处理 POST/PUT）；甚至可把 `Assets` 设为 `nil` 只用 handler。

## 四、两个交互面：绑定 + Runtime

前端与 Go 的所有互动，归为两类（详见[绑定与 Runtime](./bindings-runtime)）：

1. **调用绑定的 Go 方法**：`Bind` 进去的 struct，其公开方法在前端可直接 `import` 调用（恒返回 Promise），入参/返回值的 Go 类型自动转换、struct 自动生成 TS 模型。
2. **调用 runtime 方法**：操作**窗口 / 菜单 / 对话框 / 事件 / 浏览器 / 日志 / 剪贴板**等系统能力——Go 侧 `pkg/runtime`、JS 侧 `window.runtime.*`，两侧方法对等。

这套「内存桥 + 双交互面」正是 Wails 把 Go 生态与 Web 界面缝合起来的关键。

## 五、vs Tauri：同路线、异语言

Wails 与 Tauri 常被放在一起比较，因为它们**架构思路几乎一致**：

- **相同**：都复用系统 WebView（不打包 Chromium）、都追求小体积/低内存、都把后端逻辑编译进原生二进制、都面临跨平台 WebView 差异。
- **不同**：**后端语言**——Wails 是 **Go**（受众是 Go 开发者，能复用 Go 并发与标准库、Windows 免 CGO），Tauri 是 **Rust**（能力安全默认、体积可更极致，但有 Rust 学习曲线）。

> **数字警告**：网上流传的「Wails 约十几 MB 产物 / 约十几 MB 空闲内存」多来自官方架构文档自述，第三方独立基准较少，且随应用不同差异很大。**只用来建立数量级认知**（Wails / Tauri « Electron），不要把某个具体 MB 当权威结论。选型更应看团队语言栈与所需系统能力，而非小数点后的体积。
