---
layout: doc
outline: [2, 3]
---

# Neutralino 架构

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **两进程模型**：前端（**系统 WebView**）+ 后端（**极薄 C++ 二进制**），中间用**本地 WebSocket** 连接
- **系统 WebView**：Linux WebKitGTK / Windows WebView2 / macOS 系统 WebKit——**不打包 Chromium**，所以体积极小、但要吃「各平台 WebView 行为差异」的坑
- **极薄 C++ 后端**：内嵌一个 **HTTP 静态服务器**交付前端资源（本地 `documentRoot`），并对外提供原生能力；**无 Node.js / Rust / Go 运行时**
- **WebSocket 通信**：前端调 API → 发带 `accessToken` + UUID `id` + `method` + `data` 的 JSON → 后端执行 → 回传 → 客户端库用 **UUID 任务池**把响应配对回原 Promise
- **静态服务器**：内嵌于后端二进制，负责把前端资源当本地站点交付（这也是 `browser` / `cloud` 模式的基础）
- **体积/内存**：Hello World 未压缩约 2MB、压缩后约 0.5MB；内存主要看系统 WebView，整体偏低
- **无额外运行时的代价**：功能/生态弱于 Electron、Tauri；**依赖系统 WebView 一致性**是最常见的坑（与 Tauri 同类问题）
- **访问入口**：原生 JS 用 `Neutralino` / `window.Neutralino`；框架里从 `@neutralinojs/lib` 导入；都需先 `Neutralino.init()`（详见[原生 API 与扩展](./api-extensions)）

## 一、整体架构

Neutralino 应用是**两个独立进程**，用一条**本地 WebSocket** 连接，另加一个内嵌静态服务器交付前端资源，可选再挂任意语言的扩展进程：

```
┌────────────────────────────────────┐
│  系统 WebView（前端 UI）             │
│  HTML / CSS / JS + Neutralino.*      │
│  客户端库 @neutralinojs/lib          │
└──────────────────┬───────────────────┘
                   │  WebSocket（本地 · token 鉴权）
                   │  JSON 请求/响应（UUID 配对）
                   │  ＋ 内嵌 HTTP 静态服务器交付前端资源
┌──────────────────┴───────────────────┐
│  极薄 C++ 后端二进制                  │
│  内嵌静态服务器 ＋ 原生能力           │
└──────────────────┬───────────────────┘
                   │  IPC（WebSocket）
┌──────────────────┴───────────────────┐
│  Extensions（任意语言后端 · 可选）    │
│  Python / Go / Node / C++ …           │
└───────────────────────────────────────┘
```

这套结构的三个关键角色——**系统 WebView、极薄 C++ 后端、WebSocket 通信**——决定了 Neutralino「极小、无运行时」的全部特性，下面逐一拆开。

## 二、系统 WebView：不打包 Chromium

前端 UI 跑在**操作系统自带的 WebView** 里，而不是像 Electron 那样捆绑一整个 Chromium：

- Linux：WebKitGTK（gtk-webkit2）。
- Windows：WebView2（基于 Edge/Chromium 的系统组件）。
- macOS：系统 WebKit。

好处显而易见——**产物里不含浏览器内核，体积极小**（Hello World 未压缩约 2MB）。代价是：应用实际渲染行为**取决于目标机器上的系统 WebView 版本**，各平台之间存在 CSS/JS 行为差异，这也是 WebView 类框架（Neutralino、Tauri、Wails）共同的常见坑。

## 三、极薄 C++ 后端 + 内嵌静态服务器

后端只是**一个极薄的 C++ 二进制**，承担两件事：

1. **内嵌 HTTP 静态服务器**：把前端资源（本地 `documentRoot` 目录）当作一个本地站点交付给 WebView 加载。这也是 `browser`、`cloud` 等模式能成立的基础。
2. **提供原生能力**：文件系统、操作系统交互、窗口管理、硬件信息等，通过 `Neutralino.*` API 暴露给前端。

关键在于：**它不内嵌 Node.js，也不需要 Rust / Go 运行时**。整个后端就是一个自带的 C++ 静态可执行文件，应用开发者**无需编译原生代码**，终端用户**无需安装额外依赖**。

## 四、WebSocket 通信 + UUID 任务池

前端与后端之间**不共享内存、不走 Node 桥**，而是靠**本地 WebSocket** 收发 JSON 消息。以一次 `Neutralino.os.getEnv()` 调用为例：

1. 前端调用客户端库的某个 API。
2. 客户端库经 **WebSocket** 向后端发一条 JSON 消息，携带 `accessToken`（鉴权）、UUID `id`（本次请求标识）、`method`、`data`。
3. C++ 后端执行对应原生操作，把结果经 WebSocket 回传。
4. 客户端库维护一个 **UUID 任务池**，用回传消息里的 `id` 把响应与最初的请求配对，resolve 对应的那个 JS Promise。

```js
// 前端侧看到的只是一个普通 Promise —— 底层是 WebSocket 发消息 + UUID 配对回填
const value = await Neutralino.os.getEnv('PATH');
```

- **`accessToken` 鉴权**：每条消息都带 token，未授权的客户端连不上，这是 Neutralino 安全模型的核心（配 `tokenSecurity` 策略，见 [CLI、配置与运行模式](./cli-config-modes)）。
- **UUID 配对**：因为通信是异步消息流，必须用唯一 `id` 才能把「哪个响应对应哪个请求」对上——这就是任务池的职责。

## 五、无额外运行时：优点与代价

**优点**（架构直接带来的）：

- **产物最小**：无浏览器内核、无 Node/Rust/Go 运行时，Hello World 压缩后约 0.5MB。
- **门槛低**：前端纯 JS/HTML/CSS，无需学 Rust（Tauri）或 Go（Wails）。
- **可扩展**：后端能力不够时，用 **Extensions** 以任意语言补齐（见[原生 API 与扩展](./api-extensions)），不必重编框架。

**代价 / 现状**（如实）：

- **功能与生态弱于 Electron、Tauri**，社区较小众（GitHub ≈8.5k star）。
- **依赖系统 WebView 一致性**：各平台 WebView 版本/行为差异是常见坑（与 Tauri 同类问题）。
- **权限模型偏弱**：没有 Tauri 那种「默认拒绝」的显式 capability 体系，安全靠 `tokenSecurity` + 白/黑名单**手动收紧**（见 [CLI、配置与运行模式](./cli-config-modes)）。
- **无原生 UI 组件**：界面完全由前端在 WebView 里画。

横向对比见 [对比 Electron / Tauri / Wails](./vs-others)。

## 六、访问原生能力的入口

无论哪种模式，前端都通过统一入口访问后端：

- 原生 JS：直接用全局 `Neutralino` / `window.Neutralino`。
- 前端框架：从 npm 包 `@neutralinojs/lib` 导入。
- **都必须先 `Neutralino.init()`**——它负责建立 WebSocket 连接、加载 `NL_*` 全局变量。

具体的 `Neutralino.*` 命名空间与 `NL_*` 全局变量见[原生 API 与扩展](./api-extensions)。
