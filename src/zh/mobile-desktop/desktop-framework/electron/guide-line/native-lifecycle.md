---
layout: doc
outline: [2, 3]
---

# Electron 原生能力与生命周期

> 基于 Electron 43 · 核于 2026-07

## 速查

- **窗口/系统 UI**（主进程）：`BrowserWindow`、`Menu`/`MenuItem`（应用/右键菜单）、`Tray`（托盘）、`dialog`（文件/消息框）、`Notification`（原生通知）、`globalShortcut`（全局快捷键）、`shell`（`openExternal`/`openPath`/`showItemInFolder`/`trash`）
- **系统信息/集成**：`app`（路径、单实例锁、`setAppUserModelId`）、`clipboard`、`nativeTheme`（暗色）、`powerMonitor`、`screen`、`nativeImage`、`webContents`、`session`、`net`
- **通知**：主进程 `new Notification({title, body}).show()`（**必须调 `show()`**）；渲染进程用标准 Web Notifications API（无需 show）；mac **须签名**否则通知失败、body 有 256 字节上限；Win 需 `setAppUserModelId`
- **app 生命周期**：`ready`（`app.whenReady()`）｜`window-all-closed`（**非 mac 退出**）｜`activate`（**mac 无窗时重建**）｜`before-quit`/`will-quit`/`quit`｜`second-instance`
- **单实例锁**：`app.requestSingleInstanceLock()`——没抢到就 `app.quit()`，抢到的进程监听 `second-instance`
- **原生模块**：主进程可用 C++ 原生模块，须 `@electron/rebuild` 按 Electron 的 Node ABI 重编译
- **性能 8 条**：别乱引模块 / 别过早加载 / 别阻塞主进程 / 别阻塞渲染进程 / 去多余 polyfill / 少发网络 / 打包代码 / 不用默认菜单就 `Menu.setApplicationMenu(null)`
- **vs Tauri**：Electron 自带 Chromium + Node（三端一致、生态成熟、体积大）；Tauri v2 系统 WebView + Rust（体积小 10-30×、内存省数倍、一致性弱）

## 一、原生能力 API 一览

Electron 提供几十个原生模块，**大多只能在主进程调用**，渲染进程通过 [IPC](./ipc) 委托：

**窗口与系统 UI**

| 模块 | 用途 |
| --- | --- |
| `BrowserWindow` | 创建/管理窗口 |
| `Menu` / `MenuItem` | 应用菜单、右键上下文菜单 |
| `Tray` | 系统托盘图标 |
| `dialog` | 文件选择框、消息框 |
| `Notification` | 原生系统通知 |
| `globalShortcut` | 全局快捷键（应用未聚焦也生效） |
| `shell` | `openExternal`（外部打开 URL）/ `openPath` / `showItemInFolder` / `trash` |

**系统信息与集成**

`app`（应用路径、单实例锁、`setAppUserModelId`）、`clipboard`（剪贴板）、`nativeTheme`（暗色模式）、`powerMonitor`（电源/休眠）、`screen`（显示器/分辨率）、`nativeImage`（图像）、`webContents`、`session`、`net`（网络请求）。

## 二、原生通知 Notification

主进程与渲染进程用法不同，是常见考点：

```javascript
// 主进程：用 Electron 的 Notification 类，必须调 show()
const { Notification } = require('electron')
new Notification({ title: 'Title', body: 'Message' }).show()
```

```javascript
// 渲染进程：用标准 Web Notifications API，无需 show()
new Notification('Title', { body: 'Message' })
```

**平台差异：**

- **Windows**：需 `app.setAppUserModelId()` + 开始菜单快捷方式（Squirrel 在生产环境自动处理）。
- **macOS**：**须签名**，否则通知事件失败；`body` 有 **256 字节**上限。
- **Linux**：走 `libnotify`，遵循 Desktop Notifications Spec。

## 三、app 生命周期事件

`app` 模块的生命周期事件是**跨平台差异的集中地**，务必处理好 macOS 与 Win/Linux 的不同：

| 事件 | 触发时机 | 要点 |
| --- | --- | --- |
| `ready` / `app.whenReady()` | 初始化完成 | 建窗口、注册快捷键要等它 |
| `window-all-closed` | 所有窗口关闭 | **非 macOS 应 `app.quit()`**；mac 惯例是保留应用 |
| `activate` | 应用被激活 | **macOS 无窗口时点 Dock 应重建窗口** |
| `before-quit` / `will-quit` / `quit` | 退出流程 | 收尾、阻止退出 |
| `second-instance` | 第二个实例启动 | 配合单实例锁把焦点给已有窗口 |

```javascript
// 处理 mac 与其他平台的退出/激活差异
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

## 四、单实例锁（常用模式）

多数桌面应用只应开一个实例。用 `requestSingleInstanceLock()` 实现：没抢到锁的进程直接退出，抢到的进程监听 `second-instance` 把焦点给已有窗口。

```javascript
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit() // 已有实例在跑，本进程退出
} else {
  app.on('second-instance', () => {
    // 有人再次启动应用：聚焦已有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
```

## 五、原生 Node 模块

主进程可使用 C++ 原生 Node 模块，但要用 **`@electron/rebuild`** 针对 **Electron 内置的 Node ABI** 重编译（直接 `npm i` 装的是给系统 Node 编的，ABI 不匹配会加载失败）。Electron Forge 会内置处理这一步（见[打包与分发](./packaging)）。

## 六、性能 Checklist（官方 8 条）

1. **别乱引模块**：引入前看体积/加载与运行开销，npm 热门 ≠ 最轻。
2. **别过早加载/执行**：贵操作延后、模块懒加载、按用户流程分批。
3. **别阻塞主进程**：长任务/同步操作会**冻结整个应用**——用 worker 线程 / [utility 进程](./process-model) / 异步。
4. **别阻塞渲染进程**：低优先级活用 `requestIdleCallback()`，重活用 Web Worker，保 60fps。
5. **去掉多余 polyfill**：Chromium 已支持的别再 polyfill（查 caniuse）。
6. **少发/别阻塞网络请求**：少变的资源打进包里，用 DevTools 审计。
7. **打包代码**：用 Webpack/Parcel/rollup 合并成单文件，减少多次 `require()` 开销。
8. **不用默认菜单就 `Menu.setApplicationMenu(null)`**（在 `ready` 前调）省启动开销。

## 七、生态与取舍 · vs Tauri（常考对比）

| 维度 | **Electron 43** | **Tauri v2** |
| --- | --- | --- |
| 渲染引擎 | **自带 Chromium**（三端一致） | **系统原生 WebView**（Win=WebView2 / mac=WKWebView / Linux=WebKitGTK） |
| 后端语言 | **Node.js**（JS/TS） | **Rust** |
| 安装包 | 80-150MB | **~5-10MB（约小 10-30×）** |
| 内存 | 150-300MB | 30-50MB（约省 3-5×） |
| 渲染一致性 | **强**（同一引擎） | 弱（各平台 WebView 有差异，需调兼容） |
| 生态/工具链 | **最成熟**（签名/更新/打包最完善） | 年轻但增长快；构建较慢（Rust 编译） |
| 选型 | UI 重、须三端一致、重度依赖 Node、看重成熟分发 | 追求小体积/低内存/移动端、UI 简单 |

> 2026 大众建议：**新项目可默认从 Tauri v2 起步**，除非命中「**渲染一致性 / Node 生态 / 成熟分发**」三条硬需求 → 选 Electron。**不适合 Electron 的场景**：低内存 IoT、纯原生 UI 诉求、高性能 3D/游戏。
