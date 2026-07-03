---
layout: doc
outline: [2, 3]
---

# Electron 参考

> 基于 Electron 43 · 核于 2026-07

## 速查

- 版本：**Electron 43** = **Chromium 150** + **Node 24**；每 **8 周**一个大版本、**跟 Chromium 偶数号**、**支持最新 3 个大版本**（滚动）
- 进程：**main**（1，Node，管窗口/生命周期/原生）｜**renderer**（N，Chromium，跑 UI，默认无 Node）｜**preload**（特权桥）｜**utility**（可选 Node 子进程）
- 三默认安全开关：`nodeIntegration=false`(**v5**) ｜ `contextIsolation=true`(**v12**) ｜ `sandbox=true`(**v20**)
- IPC 四模式：`send/on`（渲→主单向）｜`invoke/handle`（渲→主双向★）｜`webContents.send`+`ipcRenderer.on`（主→渲）｜`MessageChannelMain`（渲↔渲）
- 分发：**Forge**（官方，package/make/publish）｜**electron-builder**（社区，自带更新）｜**ASAR** 归档｜mac 签名+公证、Win **EV / Azure Trusted Signing**
- 更新：`autoUpdater`（Squirrel）｜一行 `update-electron-app` 接免费服务｜`update-downloaded` → `quitAndInstall`

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 最新稳定线 | **Electron 43**（2026-06） |
| Chromium | **150** |
| Node.js | **24** |
| 发布节奏 | 每 **8 周** 一个大版本（4 周 alpha + 4 周 beta → stable） |
| Chromium 对齐 | 只跟 Chromium **偶数版本** |
| 支持窗口 | **最新 3 个大版本**（滚动，如 2026-07 为 43/42/41） |
| 补丁策略 | 每个大版本内**只有最新 minor** 收补丁 |

> V8 版本号大致 ≈ Chromium 版本号 / 10，但精确 minor 官方 releases 站不列，写题请回避精确到 patch 的 V8 号。

## 二、进程模型

| 进程 | 数量 | 环境 | 有 Node | 职责 |
| --- | --- | --- | --- | --- |
| **main** | 1 | Node.js | ✅ 全部 | 入口、窗口、`app` 生命周期、原生能力 |
| **renderer** | N | Chromium | ❌ 默认无 | 跑 UI（网页） |
| **preload** | 每窗口 | 受限渲染上下文 | ⚠️ 受限模块 | `contextBridge` 架特权桥 |
| **utility** | 可选 | Node.js | ✅ | 不受信/CPU 密集/易崩的活 |

## 三、三个默认安全开关

| 开关 | 安全默认 | 起始版本 |
| --- | --- | --- |
| `nodeIntegration` | **false** | **v5.0.0** |
| `contextIsolation` | **true** | **v12.0.0** |
| `sandbox` | **true** | **v20.0.0** |

## 四、IPC 四模式

| 模式 | API | 场景 |
| --- | --- | --- |
| 渲→主 单向 | `ipcRenderer.send` / `ipcMain.on` | 触发动作、无返回 |
| 渲→主 双向 ★ | `ipcRenderer.invoke` / `ipcMain.handle` | 请求-响应，`await` 结果 |
| 主→渲 | `webContents.send` / `ipcRenderer.on` | 主进程主动推送 |
| 渲↔渲 | 主进程中转 / `MessageChannelMain` + `MessagePort` | 无直接通道 |

- 对象走 **HTML Structured Clone** 序列化；DOM / Node C++（`process.env`、Stream）/ Electron C++（WebContents、BrowserWindow）**不可序列化**。
- 避免同步阻塞的 `ipcRenderer.sendSync` / `event.returnValue`。

## 五、安全 Checklist（精简）

| 主线 | 要点 |
| --- | --- |
| 安全传输 | 只加载 **HTTPS/wss/ftps**、定义 **CSP**、不关 `webSecurity`、不开 `allowRunningInsecureContent` |
| 关危险 API | 关 `nodeIntegration`、开 `contextIsolation` + `sandbox`、不开 `experimentalFeatures` |
| 校验来源 | `will-navigate` 限导航、`setWindowOpenHandler` 拦新窗、`shell.openExternal` 不接不受信数据、`setPermissionRequestHandler` |
| 收窄暴露 | **校验 IPC sender**、`contextBridge` 只暴露窄接口、**永不透传 `ipcRenderer`** |
| 保持更新 | 用最新版 Electron、审查并关不需要的 Fuses |

## 六、Fuses 硬化建议

| Fuse | 默认 | 硬化 |
| --- | --- | --- |
| `runAsNode` | 开 | **关** |
| `cookieEncryption` | 关 | **开** |
| `nodeOptions` | 开 | **关** |
| `nodeCliInspect` | 开 | **关** |
| `embeddedAsarIntegrityValidation` | 关 | **开** |
| `onlyLoadAppFromAsar` | 关 | **开** |
| `grantFileProtocolExtraPrivileges` | 开 | **关** |

工具：`@electron/fuses`；查状态 `npx @electron/fuses read --app <path>`。

## 七、分发与更新

| 项 | 要点 |
| --- | --- |
| Electron Forge | 官方；`package` → `make` → `publish`；内置 fuses 插件 |
| electron-builder | 社区最流行；一体化、**自带 auto-update**；配置集中 |
| ASAR | 拼成单个 `app.asar` 放 `resources/`；性能 + 简化分发；配 fuse 防篡改 |
| macOS 签名 | Developer ID + hardened runtime + **公证**；未签名连更新/通知都失败 |
| Windows 签名 | **2023-06 起强制 EV**；首选 **Azure Trusted Signing** 消除 SmartScreen |
| autoUpdater | 底层 Squirrel；一行 `require('update-electron-app')()` 接免费服务；无更新返 **HTTP 204** |

## 八、原生 API 清单

- **窗口/系统 UI**：`BrowserWindow`、`Menu`/`MenuItem`、`Tray`、`dialog`、`Notification`、`globalShortcut`、`shell`。
- **系统信息/集成**：`app`、`clipboard`、`nativeTheme`、`powerMonitor`、`screen`、`nativeImage`、`webContents`、`session`、`net`。
- **通知**：主进程 `new Notification({...}).show()`（必须 `show()`）；渲染进程用 Web Notifications API。
- **生命周期**：`whenReady` / `window-all-closed`（非 mac 退出）/ `activate`（mac 重建）/ `before-quit` / `second-instance`。

## 九、Electron vs Tauri

| 维度 | Electron 43 | Tauri v2 |
| --- | --- | --- |
| 引擎 | 自带 Chromium | 系统 WebView |
| 后端 | Node.js | Rust |
| 包体 | 80-150MB | ~5-10MB |
| 内存 | 150-300MB | 30-50MB |
| 一致性 | **强** | 弱 |
| 生态 | **最成熟** | 年轻增长快 |

## 十、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | 三个安全开关分别自 **v5/v12/v20** 才默认，非「一直默认」 |
| 2 | preload 里主→渲监听**必须包一层剥掉 event**，别透传 `ipcRenderer.on` |
| 3 | `contextBridge` **永不直接暴露 `ipcRenderer`**（会经 `event.sender` 泄露） |
| 4 | `ipcMain.handle` 抛错跨进程**只保留 `message`** 字段 |
| 5 | 所有 IPC handler 都要**校验 sender**（`event.senderFrame.url` 的 host） |
| 6 | DOM / Node / Electron 的 C++ 对象**不可序列化**，IPC 传会报错 |
| 7 | 避免同步的 `sendSync` / `event.returnValue`，会冻结渲染进程 |
| 8 | 沙箱 **v20 起默认**；`nodeIntegration:true` 会**连带关沙箱** |
| 9 | `window-all-closed` 非 mac 才退；`activate` 仅 mac 无窗时重建 |
| 10 | 主进程 `Notification` **必须 `show()`**；渲染进程用 Web API 无需 show |
| 11 | macOS **未签名**连自动更新/通知都失败 |
| 12 | Windows **2023-06 起须 EV 证书**，「OV 免警告」已过时 |
| 13 | 原生 C++ 模块须 `@electron/rebuild` 按 Electron 的 Node ABI 重编译 |
| 14 | 别阻塞主进程（同步/长任务会冻结整个应用）——用 utility/worker/异步 |
| 15 | 支持窗口是**最新 3 个大版本**（滚动），别写死当前版本 |

## 十一、权威链接

- [Electron 官网](https://www.electronjs.org/) · [Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)
- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) · [IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Security](https://www.electronjs.org/docs/latest/tutorial/security) · [Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [Sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- [Application Packaging (ASAR)](https://www.electronjs.org/docs/latest/tutorial/asar-archives) · [Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Updating Applications](https://www.electronjs.org/docs/latest/tutorial/updates) · [Performance](https://www.electronjs.org/docs/latest/tutorial/performance)
- [Electron Forge](https://www.electronforge.io/) · [electron-builder](https://www.electron.build/)
- [Releases](https://releases.electronjs.org/) · [API 索引](https://www.electronjs.org/docs/latest/api/app)
