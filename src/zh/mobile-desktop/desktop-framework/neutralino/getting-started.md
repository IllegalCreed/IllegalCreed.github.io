---
layout: doc
outline: [2, 3]
---

# 入门：Neutralino 是什么与怎么起步

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **一句话**：极轻量跨平台桌面框架——**系统 WebView** 渲前端（**不打包 Chromium**）+ **极薄 C++ 后端二进制**，前端纯 JS/HTML/CSS；产物极小（Hello World 未压缩约 2MB、压缩后约 0.5MB）
- **最大卖点**：**无需 Node.js / Rust / Go 等任何额外运行时**（Electron/NW.js 捆 Node+Chromium、Tauri 需 Rust、Wails 需 Go）；应用开发者无需编译、终端用户无需额外依赖
- **平台**：Linux / Windows / macOS + **浏览器模式**；兼容任意前端框架（React/Vue/Angular/Svelte/原生 JS）
- **通信机制**：前端 ↔ 后端走**本地 WebSocket**（token 鉴权），JSON 消息经 **UUID 任务池**配对 resolve Promise（详见[架构](./guide-line/architecture)）
- **起步 CLI**：`npm i -g @neutralinojs/neu` → `neu create myapp` → `neu run`（开发热重载）→ `neu build --release`（产出便携二进制到 `dist/`）
- **第一段代码**：`Neutralino.init()` 后即可调 `Neutralino.os.getEnv(...)` 等原生 API（前端用 `Neutralino` / `window.Neutralino`，框架里从 `@neutralinojs/lib` 导入）
- **四种模式**：`window`（默认，原生窗口）/ `browser` / `cloud` / `chrome`（详见 [CLI、配置与运行模式](./guide-line/cli-config-modes)）
- **社区体量**：GitHub ≈8.5k star，较小众；定位「更轻但更简」，弱于 Electron/Tauri 的生态与成熟度（详见[对比](./guide-line/vs-others)）
- **进阶顺序**：先读[架构](./guide-line/architecture)吃透 WebView + C++ 后端模型 → 再读[原生 API 与扩展](./guide-line/api-extensions)与 [CLI、配置与运行模式](./guide-line/cli-config-modes)

## 一、Neutralino 解决什么问题

跨平台桌面框架里，Electron 用「捆绑一整套 Chromium + Node.js」换来了一致性和生态，代价是**动辄上百 MB 的体积和不低的内存占用**。Neutralino 走相反方向，只问一件事：**能不能不打包浏览器、也不引入任何额外运行时，就做出一个跨平台桌面应用？**

它的答案是：

- **用系统自带的 WebView 渲染前端**——Linux 用 WebKitGTK、Windows 用 WebView2、macOS 用系统 WebKit，**不打包 Chromium**。
- **后端只是一个极薄的 C++ 二进制**，内嵌一个 HTTP 静态服务器负责交付前端资源，并提供原生能力。
- 前端纯用 **JS/HTML/CSS**，可搭配任意前端框架。

结果就是**产物极小**：Hello World 未压缩约 2MB、压缩后约 0.5MB。而它最核心的差异化在于**不依赖任何额外运行时**：

- Electron / NW.js：捆绑 **Node.js + Chromium**。
- Tauri：需要 **Rust** 工具链。
- Wails：需要 **Go**。
- **Neutralino：只有一个 C++ 内核 + 系统能力**，应用开发者无需编译原生代码，终端用户也无需装额外依赖。

支持 Linux / Windows / macOS 以及**浏览器模式**，兼容 React / Vue / Angular / Svelte / 原生 JS。

## 二、核心架构一眼过

Neutralino 把应用拆成**两个进程**，用**本地 WebSocket** 连起来：

```
┌────────────────────────────────┐
│  系统 WebView（前端 UI）         │
│  HTML / CSS / JS + Neutralino.* │
└───────────────┬────────────────┘
                │  WebSocket（本地 · token 鉴权）
                │  JSON 请求/响应（UUID 配对）
┌───────────────┴────────────────┐
│  极薄 C++ 后端二进制             │
│  内嵌静态服务器 + 原生能力       │
└─────────────────────────────────┘
```

调用一次原生 API（如 `Neutralino.os.getEnv()`）的流程：前端客户端库经 WebSocket 发一条带 `accessToken` + UUID 的 JSON 消息 → C++ 后端执行原生操作并回传结果 → 客户端库用 **UUID 任务池**把响应与请求配对，resolve 对应的 JS Promise。完整机制见[架构](./guide-line/architecture)。

## 三、怎么起步：`neu` CLI

官方工具链是 `neu` CLI，最短上手路径：

```bash
# 全局安装（或用 npx @neutralinojs/neu <cmd> 免全装）
npm i -g @neutralinojs/neu

# 从模板创建应用（二进制名由目录名推导）
neu create myapp
cd myapp

# 开发：默认改资源自动重载
neu run

# 产出便携二进制到 dist/（各平台二进制 + resources）
neu build --release
```

- `neu run` 默认**热重载**（改前端资源自动刷新），可用 `--disable-auto-reload` 关掉。
- `neu build --release` 会为各平台生成二进制 + 打包资源到 `dist/`；`--embed-resources` 可产出单文件可执行。
- 各命令与常用 flag 见 [CLI、配置与运行模式](./guide-line/cli-config-modes)。

## 四、第一段代码

Neutralino 应用启动后必须先 `Neutralino.init()`，之后即可调用原生 API：

```js
// main.js —— 原生 JS 里直接用全局 Neutralino / window.Neutralino
Neutralino.init();

// 取当前用户名（不同系统环境变量名不同）并显示
async function showUser() {
  const name =
    (await Neutralino.os.getEnv('USER')) || // Linux / macOS
    (await Neutralino.os.getEnv('USERNAME')); // Windows
  document.getElementById('app').innerText = `你好，${name}`;
}
showUser();
```

在前端框架（React/Vue…）里，则从 npm 包导入：

```js
// 框架工程里：从 @neutralinojs/lib 导入
import { init, os } from '@neutralinojs/lib';

init();
const user = await os.getEnv('USER');
```

> 默认模板已在配置里放行基础调用（`nativeAllowList` 含 `app.*` / `os.*` / `debug.log` 一类），因此上面的 `os.getEnv` 无需额外改权限即可用。权限白名单机制见 [CLI、配置与运行模式](./guide-line/cli-config-modes)。

## 五、四种运行模式（初识）

同一份代码可跑在四种模式下（`neutralino.config.json` 的 `defaultMode`）：

- **window**（默认）：原生 OS 窗口，跟随系统主题，桌面应用首选。
- **browser**：在用户默认浏览器里打开，做「能调原生操作的 Web 应用」。
- **cloud**：作为后台服务进程运行，可暴露到网络（**务必用白/黑名单收紧权限**）。
- **chrome**：以 Chrome/Chromium/Edge 的 app 模式运行（需预装其一）。

细节与安全注意见 [CLI、配置与运行模式](./guide-line/cli-config-modes)。

## 六、心智地图：接下来读什么

- 想搞懂「为什么这么轻、底层怎么连的」→ [架构](./guide-line/architecture)（系统 WebView + C++ 后端 + WebSocket/任务池）。
- 想调原生能力、或用其他语言补后端 → [原生 API 与扩展](./guide-line/api-extensions)。
- 想把工程配好、发出去 → [CLI、配置与运行模式](./guide-line/cli-config-modes)。
- 想知道该不该选它、和谁比 → [对比 Electron / Tauri / Wails](./guide-line/vs-others)。
- 速记表在 [参考](./reference)。
