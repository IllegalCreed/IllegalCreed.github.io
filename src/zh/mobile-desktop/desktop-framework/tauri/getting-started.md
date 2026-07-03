---
layout: doc
outline: [2, 3]
---

# 入门：Tauri 是什么与怎么起步

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **一句话**：Tauri 用 **Rust 写后端 + 复用系统自带 WebView 渲染前端**，不打包 Chromium/Node，故安装包极小（<600KB~10MB）、内存低（~50MB 级），主打「比 Electron 更小更快更安全」
- **前端无关**：任意 HTML/CSS/JS 框架（Vue/React/Svelte/Vite/Leptos…）都能当界面层；Rust 写业务逻辑
- **v2 分水岭**：桌面（Win/mac/Linux）+ **移动（iOS/Android）单代码库五端**；ACL 权限取代 v1 `allowlist`；核心 API 拆成 `tauri-plugin-*`
- **环境**：**Rust**（`rustup`，MSRV 1.77.2）必装；**Node.js** 仅前端用 JS 框架时需要；各平台系统依赖（Linux 装 `libwebkit2gtk-4.1-dev`、Win 装 C++ Build Tools + WebView2、mac 装 Xcode CLT）
- **起步**：`npm create tauri-app@latest`（交互式选前端框架 / TS·JS·Rust / 包管理器）
- **命令**：`npm run tauri dev`（热重载）/ `npm run tauri build`（打包，`--no-bundle` 只编不打包）；移动 `tauri android|ios init|dev|build`
- **项目结构**：前端在 `src/`；Rust 后端 + 配置在 `src-tauri/`（`lib.rs` 放逻辑、`main.rs` 是薄壳、`tauri.conf.json` 核心配置、`capabilities/` 权限）
- **第一个命令**：Rust 侧 `#[tauri::command] fn greet(...)` + `.invoke_handler(generate_handler![greet])`；前端 `invoke('greet', { name })`
- **进阶顺序**：先读[架构与进程模型](./guide-line/architecture)吃透 WRY/TAO/多进程 → 再读[命令与 IPC](./guide-line/commands-ipc) 与[权限系统 ACL](./guide-line/permissions)

## 一、Tauri 解决什么问题

Tauri 要回答的问题是：**能不能用 Web 前端技术写界面，却不背上 Electron 那样上百 MB 的包体和高内存？** 它的答案是——**不打包浏览器引擎，直接复用操作系统预装的 WebView** 渲染前端，后端逻辑则交给 **Rust**。

由此带来三个直接收益：

- **小体积**：因为不把 Chromium/Node 塞进安装包，最小应用可 <600KB，普遍 2–10MB（Electron 动辄 100MB+）。
- **低内存**：没有独立的 Chromium 进程，常驻内存约为 Electron 的 1/3~1/2（~50MB 级）。
- **安全**：Rust 的内存安全 + 细粒度权限系统（ACL）+ 系统 WebView 由 OS 厂商及时打补丁；且**业务逻辑全留在 Rust 侧，前端只能经 IPC 请求**，信任边界更硬。

**代价**在于渲染一致性：不同 OS 的 WebView 内核（WebView2/WKWebView/WebKitGTK）版本不同，跨平台渲染会有差异，需要多端测试——这是「小体积」的对价（详见[架构与进程模型](./guide-line/architecture)）。

**v2 是分水岭**：在桌面（Win/mac/Linux）之外扩展到**移动端 iOS/Android**，实现「单代码库五端」；同时用全新的 **ACL 权限体系**取代 v1 的扁平 `allowlist`，并把大量原核心 API 拆成按需引入的 `tauri-plugin-*` 插件。

## 二、环境准备（Prerequisites）

Tauri 编译 Rust，所以 **Rust 工具链必装**；是否装 Node.js 取决于前端选型。

- **Rust**：用 `rustup` 安装（`curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh`）；Windows 用 MSVC 工具链。最低支持 Rust **1.77.2**。
- **Node.js**：**仅当前端用 JS 框架时才需要**（装 LTS 版）；纯 Rust 前端（Leptos/Trunk）可不装。
- **系统依赖**（各平台不同）：
  - **Linux**：`libwebkit2gtk-4.1-dev`、`build-essential`、`curl`/`wget`、`libayatana-appindicator3-dev`、`librsvg` 等。
  - **Windows**：Microsoft C++ Build Tools（勾选「使用 C++ 的桌面开发」）；**WebView2** 在 Win10 1803+/Win11 已预装，老系统装 Evergreen Bootstrapper。
  - **macOS**：Xcode，或仅装 Command Line Tools（`xcode-select --install`，纯桌面开发足够）。
- **移动端**（可选）：
  - **Android**：Android Studio + 设 `JAVA_HOME`/`ANDROID_HOME`/`NDK_HOME`，并 `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`。
  - **iOS**（仅 macOS）：Xcode + `brew install cocoapods` + 加 iOS rustup targets。

## 三、创建项目（create-tauri-app）

官方脚手架 `create-tauri-app` 会交互式让你选前端框架、语言（TS/JS/Rust）、包管理器：

```bash
# 各包管理器等价命令，任选其一
npm create tauri-app@latest
pnpm create tauri-app
yarn create tauri-app
bun create tauri-app
deno run -A npm:create-tauri-app

# 纯 Rust 路线（用 Cargo）
cargo install create-tauri-app --locked && cargo create-tauri-app
```

## 四、项目结构（关键）

```
my-app/
├─ src/                    # 前端源码（Vue/React/…）
├─ src-tauri/              # Rust 后端 + Tauri 配置
│  ├─ src/
│  │  ├─ main.rs           # 桌面二进制入口，通常只调用 lib.rs 的 run()
│  │  └─ lib.rs            # 真正逻辑；含 #[cfg_attr(mobile, tauri::mobile_entry_point)] pub fn run()
│  ├─ Cargo.toml           # Rust 依赖（tauri / tauri-build 版本须与 CLI 对齐）
│  ├─ tauri.conf.json      # 核心配置
│  ├─ capabilities/        # 能力文件（JSON/TOML）——权限授予
│  └─ permissions/         # 应用自定义权限（TOML）
└─ package.json            # 前端依赖 + beforeDevCommand/beforeBuildCommand 钩子
```

> **v2 关键结构变化**：逻辑放在 `lib.rs` 的 `run()` 里，`main.rs` 只是薄壳。目的是**桌面与移动共用同一入口**——移动端由 `mobile_entry_point` 宏生成入口，用 `#[cfg(desktop)]` / `#[cfg(mobile)]` 条件编译区分平台特定代码。

## 五、开发 / 构建命令

```bash
# 桌面
npm run tauri dev            # 起 devUrl + 编译 Rust + 热重载
npm run tauri build          # 生产构建 + 打包安装包
npm run tauri build --no-bundle   # 只编译，不生成安装包

# 移动
npm run tauri android init   # 生成 Android 工程
npm run tauri android dev    # 首次需数分钟下载/编译
npm run tauri ios init
npm run tauri ios dev
npm run tauri ios dev --open # 用 Xcode/Android Studio 打开（此时 CLI 进程不能杀）
```

- `tauri dev` 监听 `src-tauri` 变更自动重建；用 `.taurignore` 排除文件。
- 真机调试时 CLI 会注入 `TAURI_DEV_HOST` 环境变量，让前端 dev server 监听可访问地址。
- Web Inspector：iOS 走 Safari 开发菜单，Android 走 `chrome://inspect`。

## 六、第一个命令：invoke 打通前后端

Tauri 前后端通信的核心是 **Command**——前端用 `invoke` 调 Rust 函数并拿返回值（详见[命令与 IPC](./guide-line/commands-ipc)）。

```rust
// src-tauri/src/lib.rs
// #[tauri::command] 把普通 Rust 函数暴露给前端调用
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// 桌面与移动共用的入口；mobile_entry_point 宏为移动端生成入口
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 注册命令：generate_handler! 收集所有暴露给前端的命令
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```javascript
// 前端：从 @tauri-apps/api/core 导入 invoke
import { invoke } from '@tauri-apps/api/core';

// invoke('命令名', { 参数 })，参数默认 camelCase，返回 Promise
const msg = await invoke('greet', { name: 'Alice' }); // "Hello, Alice!"
```

## 七、接下来读什么

- 想搞懂 Tauri「为什么小、底层怎么跑」→ [架构与进程模型](./guide-line/architecture)（Core/WRY/TAO + 多进程 + 体积优化）。
- 想写前后端通信 → [命令与 IPC](./guide-line/commands-ipc)（Command/Event/Channel/State）。
- 想让应用「有权限做事」→ [权限系统 ACL](./guide-line/permissions)（Permissions/Scopes/Capabilities）。
- 想把应用发出去 → [分发与安全加固](./guide-line/distribute)（打包/签名/updater/Sidecar/CSP/Isolation）。
- 纠结选 Tauri 还是 Electron → [对比 Electron 与 Wails](./guide-line/vs-electron)。
- 速记表在 [参考](./reference)。
