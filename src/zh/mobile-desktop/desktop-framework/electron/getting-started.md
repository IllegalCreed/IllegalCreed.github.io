---
layout: doc
outline: [2, 3]
---

# 入门：Electron 是什么与怎么起步

> 基于 Electron 43 · 核于 2026-07

## 速查

- **一句话**：用 **HTML/CSS/JS + 内置 Chromium + 内置 Node.js** 构建 **Windows/macOS/Linux 跨平台桌面应用**；应用自带一份引擎，**三端渲染一致**，且可脱离系统独立升级
- **为什么用**：Web 技术栈通用、生态大（npm）；同一引擎跨端一致（不吃系统 WebView 差异）；可独立于系统下发修复；Web 与原生混搭、几十个原生 API。由 **OpenJS 基金会**托管，是桌面开发**事实标准**
- **标杆应用**：VS Code、Slack、Discord、Signal、Notion、Docker Desktop、ChatGPT、Claude 桌面版
- **取舍**：安装包常 **>100MB**、单应用内存 **150-300MB**；不适合低内存 IoT、纯原生 UI 诉求、高性能 3D/游戏
- **起步（官方推荐 Forge）**：`npm create electron-app@latest my-app`；或手动 `npm i --save-dev electron` 再配 `main` 入口与 `start` 脚本
- **进程模型初识**：**主进程**（1，Node，管窗口/生命周期/原生）｜**渲染进程**（N，Chromium，跑 UI，默认无 Node）｜**preload**（特权桥，`contextBridge` 暴露 API）｜**utility**（可选 Node 子进程）
- **最小应用**：主进程用 `app.whenReady()` 后 `new BrowserWindow()` 再 `loadFile`/`loadURL`
- **版本坐标**：**Electron 43** = Chromium 150 + Node 24；每 **8 周**一个大版本，**跟 Chromium 偶数号**，**支持最新 3 个大版本**（滚动，如 2026-07 为 43/42/41）
- **进阶顺序**：先读[进程模型](./guide-line/process-model)吃透四类进程与沙箱 → [IPC](./guide-line/ipc) 打通通信 → [安全](./guide-line/security)守住底线 → [打包与分发](./guide-line/packaging)出包上线

## 一、Electron 解决什么问题

Electron 要回答的问题是：**能不能用前端团队已有的 Web 技术栈，产出一套代码、三端一致的桌面应用？** 它的答案是——**把 Chromium 与 Node.js 一起打进应用**：界面用 HTML/CSS/JS 由内置 Chromium 渲染，碰系统能力（文件、菜单、托盘、通知）由内置 Node.js 与 Electron 原生模块完成。

因为引擎是**自带**的，Electron 与两类方案有本质差异：

- **vs 系统 WebView 套壳（如 Tauri、旧 Cordova）**：那些方案用**各平台自带的 WebView**（Win 的 WebView2、mac 的 WKWebView、Linux 的 WebKitGTK），包体小但**渲染行为随系统差异**；Electron 自带同一份 Chromium，**三端渲染一致**、可控可预测，还能独立于系统更新引擎。
- **vs 纯原生（WinUI/SwiftUI/AppKit）**：原生观感与体积最优，但要为每个平台各写一套；Electron 一套 Web 代码跨三端，迭代快、复用前端技能。

代价也很直接：应用里塞了一整份 Chromium + Node，**安装包常 >100MB、单应用内存常 150-300MB**。

## 二、为什么选 Electron（以及何时不选）

**选它的理由：**

- **Web 技术栈通用可靠、生态最大**：直接吃 npm 与整个前端工具链。
- **渲染一致**：同一份 Chromium，跨三端像素级一致，无需为各平台 WebView 差异做兼容。
- **可独立更新引擎**：安全/稳定修复随应用下发，不必等用户升级操作系统。
- **Web 与原生混搭**：几十个原生 API（窗口、菜单、托盘、对话框、通知、剪贴板……）随手可用。
- **分发链路最成熟**：签名、公证、自动更新的工具与文档在同类里最完善。

**不选它的场景：**

- **低内存/受限设备**（IoT、瘦客户端）——内置引擎太重。
- **追求极致体积/内存**——该看 Tauri v2（系统 WebView + Rust，包体小 10-30 倍）。
- **纯原生 UI 诉求**——要 WinUI/SwiftUI/AppKit 的原生观感就别套 Web。
- **高性能 3D/游戏**——该用 Unity/Unreal/DirectX。

> 详细对比见[原生能力与生命周期 · vs Tauri](./guide-line/native-lifecycle)。2026 年大众建议：新项目可默认从 Tauri v2 起步，除非命中「渲染一致性 / Node 生态 / 成熟分发」三条硬需求 → 选 Electron。

## 三、怎么起步：官方推荐用 Electron Forge

最省心的起步方式是官方脚手架 **Electron Forge**，它把打包、生成安装包、发布整条链路都配好：

```bash
# 官方推荐：用 Forge 脚手架起步
npm create electron-app@latest my-app
cd my-app
npm start            # 启动应用
```

如果想从零手动搭，核心就三步：装依赖、配入口、加脚本。

```jsonc
// package.json（手动起步的关键字段）
{
  "main": "main.js", // 主进程入口
  "scripts": {
    "start": "electron ." // 用 electron 跑当前目录
  }
}
```

```bash
npm i --save-dev electron   # 把 Electron 作为开发依赖安装
```

> 注意：官方 tutorial 里的 `package.json` 示例把 Electron 版本写成了较旧的号（模板占位），**不代表最新版**——实际请以 `npm view electron version` 或 [releases 站](https://releases.electronjs.org/)为准。

## 四、最小应用：主进程创建窗口

主进程是应用入口，跑在 Node 环境。最小闭环是「等应用就绪 → 建窗口 → 加载页面」，并处理好各平台的退出/激活差异：

```javascript
// main.js —— 主进程
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 特权能力只通过 preload + contextBridge 暴露（见「安全」页）
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  win.loadFile('index.html') // 也可 win.loadURL('https://...')
}

// 应用就绪后才能建窗口
app.whenReady().then(() => {
  createWindow()
  // macOS：无窗口时点 Dock 图标应重建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 非 macOS：所有窗口关闭即退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- `app.whenReady()`：Electron 初始化完成后才能创建 `BrowserWindow`。
- `window-all-closed` / `activate`：处理 macOS 与 Win/Linux 的生命周期差异（详见[原生能力与生命周期](./guide-line/native-lifecycle)）。
- `webPreferences.preload`：指定预加载脚本——这是渲染进程碰系统能力的**唯一正道**。

## 五、进程模型初识

Electron 沿用 Chromium 的**多进程架构**，先记住四类进程的分工，细节见[进程模型](./guide-line/process-model)：

| 进程 | 数量 | 运行环境 | 职责 |
| --- | --- | --- | --- |
| **主进程 main** | 1 | Node.js | 应用入口；管窗口、`app` 生命周期、菜单/托盘/对话框等原生能力 |
| **渲染进程 renderer** | N | Chromium | 每个窗口一个，跑 UI（就是网页），**默认无 Node** |
| **预加载 preload** | 每窗口 | 受限渲染上下文 | 网页加载前运行的「特权桥」，用 `contextBridge` 安全暴露 API |
| **工具进程 utility** | 可选 | Node.js | 主进程派生的 Node 子进程，放不受信/CPU 密集/易崩的活 |

两条最需要先建立的认知：

- **渲染进程默认碰不到系统**：`nodeIntegration=false` + `contextIsolation=true` + `sandbox=true` 三道默认开关下，网页要读文件、弹对话框，都得经 preload 用 IPC **委托给主进程**。
- **一个崩不拖垮全部**：某个渲染进程崩溃或被攻破，不会连累主进程与其他窗口。

## 六、心智地图：接下来读什么

- 想吃透「四类进程、沙箱怎么回事」→ [进程模型](./guide-line/process-model)。
- 想打通「网页怎么和系统说话」→ [IPC 进程间通信](./guide-line/ipc)。
- 想守住底线「别把桌面应用写成漏洞」→ [安全](./guide-line/security)（头号考点）。
- 想把项目「打成包、签好名、能自动更新」→ [打包与分发](./guide-line/packaging)。
- 想用「原生能力、跑好生命周期、和 Tauri 比一比」→ [原生能力与生命周期](./guide-line/native-lifecycle)。
- 速记表在 [参考](./reference)。
