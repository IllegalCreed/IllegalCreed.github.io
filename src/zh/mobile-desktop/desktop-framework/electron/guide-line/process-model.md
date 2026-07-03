---
layout: doc
outline: [2, 3]
---

# Electron 进程模型

> 基于 Electron 43 · 核于 2026-07

## 速查

- **多进程架构**（沿用 Chromium）：一个进程崩溃/被攻破不拖垮整个应用
- **主进程 main**（1 个，Node 环境）：应用**入口**；三大职责＝**窗口管理**（`BrowserWindow`，每个窗口派生一个渲染进程）、**应用生命周期**（`app` 模块）、**原生能力**（菜单/对话框/托盘只能在主进程调）
- **渲染进程 renderer**（N 个，Chromium 环境）：每窗口一个，跑 UI；**默认无 Node、上下文隔离开、沙箱开**；碰系统能力必须经 preload + IPC 委托主进程
- **预加载 preload**：网页加载**前**在渲染进程上下文运行，能访问受限 Node/Electron 模块；用 `contextBridge` 把精选 API 挂到 `window`——**安全暴露特权的唯一正道**
- **工具进程 utility**（可选，Node 环境）：主进程 `utilityProcess.fork()` 派生；放不受信/CPU 密集/易崩的活，能与渲染进程直建 `MessagePort` 通道
- **沙箱 sandbox**（**v20 起默认**）：除主进程外都被 OS 限到「只能用 CPU 和内存」；沙箱化渲染进程无 Node，特权走 IPC
- **关沙箱**：`webPreferences.sandbox:false`（或 `nodeIntegration:true` 会连带关）；强制全局开 `app.enableSandbox()`（须 ready 前）——关沙箱有安全风险

## 一、为什么是多进程

Electron 直接沿用 **Chromium 的多进程架构**：把不同职责拆进独立进程，靠操作系统隔离。好处是**容错**——某个渲染进程崩溃或被恶意页面攻破，只影响那一个窗口，不会拖垮主进程与其他窗口；坏处是进程间不能共享内存，跨进程协作必须走 [IPC](./ipc)。

理解「哪段代码跑在哪个进程、有没有 Node、有没有沙箱」，是写对、写安全 Electron 的前提。

## 二、主进程 main（1 个 · Node 环境）

主进程是应用的**入口**（`package.json` 的 `main` 字段指向的文件），跑在完整的 **Node.js 环境**，可 `require()`、用全部 Node API。它有三大职责：

1. **窗口管理**：用 `BrowserWindow` 创建/管理应用窗口，**每个 `BrowserWindow` 派生一个独立的渲染进程**。
2. **应用生命周期**：通过 `app` 模块控制启动、退出、激活等（`whenReady` / `window-all-closed` / `activate` / `before-quit` 等，详见[原生能力与生命周期](./native-lifecycle)）。
3. **原生能力**：菜单、对话框、托盘、全局快捷键等**只能在主进程调用**。

```javascript
// 主进程：创建窗口
const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 })
  win.loadURL('https://github.com')
})
```

> 主进程是应用里权限最高的地方——所有特权动作最终都在这里发生，因此 [IPC 的 sender 校验](./security)尤为关键。

## 三、渲染进程 renderer（N 个 · Chromium 环境）

每个窗口对应一个渲染进程，跑在 **Chromium** 里，负责界面——**它本质就是一个网页**，你用 HTML/CSS/JS 写 UI，和写 Web 前端几乎一样。

关键在于它的**默认限制**（现代 Electron 的安全基线）：

- **默认无 Node**：`nodeIntegration:false`——网页里不能直接 `require('fs')`。
- **上下文隔离开**：`contextIsolation:true`——preload 与网页跑在不同 JS 上下文。
- **沙箱开**：`sandbox:true`——被 OS 限制权限。

因此渲染进程要读文件、弹原生对话框、访问系统，**都不能自己来**，必须经 preload 用 [IPC](./ipc) 把请求**委托给主进程**执行。这套「渲染进程不碰系统」的设计正是 Electron 安全模型的核心。

## 四、预加载脚本 preload（特权桥）

preload 在**网页内容加载之前**、于该渲染进程的上下文中运行，但**能访问受限的 Node / Electron 模块**——它是连接「无权限的网页」与「有权限的主进程」的桥。

它的正确用法是：用 `contextBridge` 把**精选、够用的窄接口**挂到网页的 `window` 上，而**不是**把 `ipcRenderer` 整个暴露出去。

```javascript
// preload.js —— 只暴露够用的窄接口
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // 主→渲染的监听要包一层，剥掉 event，切勿直接把 callback 交给 ipcRenderer.on
  onUpdateCounter: (cb) => ipcRenderer.on('update-counter', (_e, value) => cb(value)),
})
```

- **在上下文隔离下不能 `window.xxx = ...`**，必须走 `contextBridge`。
- 跨桥只能传**可结构化克隆**的值/函数；自定义原型链、Symbol 过桥会丢。
- 详见[安全 · 上下文隔离与 contextBridge](./security)。

## 五、工具进程 utility（可选 · Node 环境）

当你需要一个额外的 **Node 环境子进程**——跑不受信的服务、CPU 密集任务、或容易崩的活——用主进程的 `utilityProcess.fork()` 派生**工具进程**：

```javascript
// 主进程：派生一个工具进程
const { utilityProcess } = require('electron')
const child = utilityProcess.fork('service.js')
```

相较 Node 原生的 `child_process.fork()`，`UtilityProcess` 的优势是**能与渲染进程直接建立 `MessagePort` 通道**（点对点通信，不必事事经主进程中转，见 [IPC 的渲染↔渲染模式](./ipc)）。把易崩/不受信的逻辑放进独立工具进程，崩了也不会拖垮主进程。

## 六、进程沙箱 sandbox（深度）

**Chromium 沙箱**把除主进程外的进程（渲染进程、工具进程）限制到**「只能用 CPU 和内存」**——不能碰文件系统、系统资源或派生子进程。**Electron 20 起默认开启**。

- 沙箱化的渲染进程**无 Node 环境**，一切特权操作只能走 [IPC](./ipc) 交给主进程。
- **沙箱下 preload 仍可用的能力（polyfill）**：`electron` 的 `contextBridge` / `ipcRenderer` / `crashReporter` / `nativeImage` / `webFrame` / `webUtils`；Node 的 `events` / `timers` / `url`（含 `node:` 前缀）；全局 `Buffer` / `process` / `setImmediate`。因能力受限，preload 拆分需借打包器（webpack/Parcel）。

**开关方式：**

| 操作 | 做法 | 说明 |
| --- | --- | --- |
| 关单窗口沙箱 | `webPreferences.sandbox:false` | 有安全风险，仅在渲染进程必须用原生 Node 模块时 |
| 连带关沙箱 | `nodeIntegration:true` | 开 Node 集成会**连带关掉**沙箱 |
| 强制全局开 | `app.enableSandbox()` | 须在 `app.whenReady()` **之前**调；覆盖单窗口的 `sandbox:false` |

> 沙箱是纵深防御的重要一环，非必要不要关。何时该关、关了要补什么，见[安全](./security)。

## 七、一图速记

| 进程 | 数量 | 环境 | 有 Node？ | 典型职责 |
| --- | --- | --- | --- | --- |
| **main** | 1 | Node.js | ✅ 全部 | 入口、窗口、生命周期、原生能力 |
| **renderer** | N | Chromium | ❌ 默认无 | 跑 UI（网页） |
| **preload** | 每窗口 | 受限渲染上下文 | ⚠️ 受限模块 | 用 `contextBridge` 架特权桥 |
| **utility** | 可选 | Node.js | ✅ | 不受信/CPU 密集/易崩的活 |

记忆主线：**主进程有全部权限、渲染进程默认没有、preload 是唯一受控的桥、utility 是可选的 Node 后台**。
