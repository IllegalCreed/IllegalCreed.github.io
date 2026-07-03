---
layout: doc
outline: [2, 3]
---

# Tauri 架构与进程模型

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **两大层**：**Tauri Core（Rust）** 编排一切 + 上游 **WRY / TAO** 对接**系统 WebView**；依赖链 `tauri` → `tauri-runtime` → `tauri-runtime-wry` → **WRY** → **TAO**
- **WRY**（WebView Rendering librarY）：跨平台 WebView 渲染抽象，决定各 OS 用哪个原生 WebView、管理 WebView 与宿主交互
- **TAO**：窗口管理库，**fork 自 winit**，补充菜单栏、系统托盘；支持 Win/mac/Linux/iOS/Android
- **系统 WebView**：Windows=**WebView2**（Chromium）/ macOS·iOS=**WKWebView**（WebKit）/ Linux=**WebKitGTK** / Android=**System WebView**
- **进程模型**：类浏览器**多进程**——**Core 进程**（Rust，单一特权入口，编排窗口/路由 IPC/持全局状态）+ **WebView 进程**（可多个，渲染前端）
- **多进程三理由**：响应性（算力与 UI 分离）、健壮性（隔离、崩溃不连锁）、安全（**最小权限原则**）
- **vs Electron 的信任边界**：Electron renderer 可开 Node 集成直接摸文件系统；Tauri **业务逻辑全留 Rust Core**，前端只能经 IPC
- **小体积根因**：不打包 Chromium/Node，直接用系统 WebView；**代价**＝各 OS 渲染一致性有差异，需跨端测
- **体积优化**：`Cargo.toml` 的 `[profile.release]` 开 `lto`/`opt-level="s"`/`strip`/`panic="abort"`；配置开 `removeUnusedCommands`

## 一、两大层：Core + 上游 WebView/窗口库

Tauri 的架构可以拆成两层：

1. **Tauri Core（Rust）**：Tauri 自己维护的一组 crate，负责编译期读配置、注入脚本、暴露系统 API、路由 IPC、驱动 updater——是整个应用的**特权中枢**。
2. **上游 WebView/窗口库（WRY + TAO）**：Tauri 依赖的两个更底层的库，把「渲染网页」和「管理窗口」这两件跨平台的脏活抽象掉。

依赖链自上而下是：

```
tauri  →  tauri-runtime  →  tauri-runtime-wry  →  WRY  →  TAO
（主 crate）  （运行时抽象）    （把 WRY 接进运行时）  （WebView）（窗口）
```

## 二、Tauri Core 生态 crate

Core 层由多个各司其职的 crate 组成：

| crate | 职责 |
| --- | --- |
| **tauri** | 主 crate：编译期读配置、注入脚本、暴露系统 API、驱动 updater |
| **tauri-runtime** | Tauri 与底层 WebView 库之间的**抽象层** |
| **tauri-runtime-wry** | 把 **WRY** 接到 runtime，提供打印、显示器检测等系统级交互 |
| **tauri-macros / tauri-codegen** | 编译期宏 + 资源处理（内嵌/哈希/压缩图标资源、把配置解析成 Rust struct） |
| **tauri-build** | Cargo 构建期应用宏与特性 |
| **tauri-utils** | 共享工具（配置解析、平台检测、CSP 注入、资源管理） |

## 三、WRY 与 TAO（考点）

Tauri 不自己实现 WebView 和窗口，而是站在两个上游库肩膀上：

- **WRY（WebView Rendering librarY）**：跨平台的 **WebView 渲染抽象**。它决定在每个操作系统上用哪个原生 WebView，并管理 WebView 与宿主程序的交互（注入脚本、拦截协议等）。
- **TAO**：**窗口管理库**，**fork 自 Rust 生态知名的 winit**，在其基础上补充了菜单栏、系统托盘等桌面应用必需能力；覆盖 Win/mac/Linux 以及 iOS/Android。

一句话记忆：**WRY 管「网页怎么渲染」，TAO 管「窗口怎么开」**。

## 四、各平台系统 WebView

Tauri「小体积」的关键，就是不自带浏览器内核，而是复用系统预装 WebView：

| 平台 | WebView 引擎 | 内核 |
| --- | --- | --- |
| Windows | **WebView2** | Chromium / Edge |
| macOS / iOS | **WKWebView** | WebKit |
| Linux | **WebKitGTK** | WebKit |
| Android | **System WebView** | Chromium |

> **代价**：不同 OS 的 WebView 内核与版本不一致（WebKit vs Chromium、系统更新节奏不同），跨平台渲染一致性不如自带 Chromium 的 Electron，**必须多端测试**。这是「小体积」的对价，也是选型时要权衡的第一点（详见[对比 Electron 与 Wails](./vs-electron)）。

## 五、进程模型（Process Model）

Tauri 采用类现代浏览器的**多进程**模型：

- **Core 进程（Rust，单一特权入口）**：创建/编排窗口、管理系统托盘与通知、**路由所有 IPC**、持有全局状态（设置、DB 连接）。选 Rust 是因为其所有权模型保证内存安全 + 高性能。
- **WebView 进程（可多个）**：渲染前端，跑 HTML/CSS/JS，各用平台 WebView 引擎；彼此隔离。

**为什么要多进程？**

1. **响应性**：把重计算放 Core，UI 线程不被拖住，避免卡顿。
2. **健壮性**：进程隔离，一个 WebView 崩溃不连累整体，可独立重启。
3. **安全**：贯彻**最小权限原则**——每个进程只拿它需要的权限。

**与 Electron 的信任边界对比**：Electron 的 renderer 可以开启 Node 集成，让前端直接摸文件系统；而 Tauri 把**业务逻辑全部留在 Rust Core**，前端 WebView 只能通过 IPC 发请求——Core 可以判定并拒绝恶意请求，信任边界更硬。

## 六、小体积的根因与代价

- **根因**：不打包 Chromium/Node，直接复用系统 WebView；Rust 编译成原生二进制，无运行时。
- **典型量级**：最小应用 <600KB，普遍 2–10MB；常驻内存 ~50MB 级。
- **代价**：① 渲染一致性差异（见上）；② 后端要用 Rust，纯前端团队有上手成本；③ 依赖系统 WebView 的能力边界（老系统 WebView 缺特性时需降级）。

## 七、体积优化

在 `src-tauri/Cargo.toml` 用 release profile 进一步压缩体积：

```toml
[profile.release]
codegen-units = 1     # 更好的 LLVM 优化（牺牲编译速度换体积/性能）
lto = true            # 链接期优化，跨 crate 内联/裁剪
opt-level = "s"       # 体积优先（要极致速度改 "3"）
panic = "abort"       # 去掉 panic unwind 开销
strip = true          # 去掉调试符号
```

再配合 `tauri.conf.json` 的开关：

```json
{
  "build": { "removeUnusedCommands": true }
}
```

> `removeUnusedCommands` 让打包时**不包含 ACL 未授权的命令处理器**——「不为用不到的功能付费」。权限体系见[权限系统 ACL](./permissions)。
