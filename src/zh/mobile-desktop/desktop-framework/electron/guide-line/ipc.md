---
layout: doc
outline: [2, 3]
---

# Electron IPC 进程间通信

> 基于 Electron 43 · 核于 2026-07

## 速查

- **核心模块**：`ipcMain`（主进程收）｜`ipcRenderer`（渲染进程收发，经 preload 暴露）｜`contextBridge`（安全暴露到 `window`）
- **通道 channel**：任意命名、双向；对象传递走 **HTML Structured Clone 结构化克隆**算法
- **四种模式**：
  - ① **渲→主 · 单向**：`ipcRenderer.send` / `ipcMain.on`——触发动作、不要返回值
  - ② **渲→主 · 双向**★最常用：`ipcRenderer.invoke` / `ipcMain.handle`——`await` 拿 Promise 结果
  - ③ **主→渲**：`webContents.send` / `ipcRenderer.on`——主进程主动推送
  - ④ **渲↔渲**：无直接通道，经主进程中转 或 `MessageChannelMain` 建 `MessagePort` 点对点直连
- **坑**：`handle` 里抛错跨进程时**只序列化 `message` 字段**；主→渲的监听 preload 里**必须包一层剥掉 event**，别直接透传 `ipcRenderer.on`
- **不可序列化**：DOM 对象、Node C++ 对象（`process.env`/Stream）、Electron C++ 对象（WebContents/BrowserWindow）——传了会报错
- **避免**：同步阻塞的 `ipcRenderer.sendSync` / `event.returnValue`

## 一、IPC 是什么 · 核心三模块

渲染进程默认没有系统权限（见[进程模型](./process-model)），要读文件、弹对话框、访问原生能力，只能把请求**发给主进程**去做——这条跨进程通道就是 **IPC（Inter-Process Communication）**。

三个核心模块：

- **`ipcMain`**：主进程侧，注册/接收来自渲染进程的消息。
- **`ipcRenderer`**：渲染进程侧，收发消息；**不直接给网页用**，而是经 preload 用 `contextBridge` 暴露成窄接口。
- **`contextBridge`**：把 preload 里的 API 安全地挂到网页 `window` 上（见[安全](./security)）。

通道（channel）名可**任意命名、双向**；跨进程传对象走 **HTML Structured Clone（结构化克隆）** 算法。

## 二、四种通信模式

### ① 渲染 → 主 · 单向（`send` / `on`）

用于**触发主进程动作、不需要返回值**（如「设置窗口标题」）。

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
})
```

```javascript
// main.js
ipcMain.on('set-title', (event, title) => {
  // 用 event.sender 找到发消息的窗口
  BrowserWindow.fromWebContents(event.sender).setTitle(title)
})
```

### ② 渲染 → 主 · 双向（`invoke` / `handle`）★最常用

用于**调用主进程函数并等待结果**——渲染进程 `invoke` 返回 Promise，主进程 `handle` 的返回值/resolve 会传回。这是最推荐的请求-响应模式。

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
})
```

```javascript
// main.js
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (!canceled) return filePaths[0]
})
```

```javascript
// renderer.js
const filePath = await window.electronAPI.openFile()
```

> 坑：`handle` 的 handler **抛错时，跨进程只会序列化 error 的 `message` 字段**（见 electron#24427），其他字段（自定义属性、堆栈）会丢——需要结构化错误信息就自己在返回值里带。

### ③ 主 → 渲染（`webContents.send` / `ipcRenderer.on`）

用于**主进程主动推送**（如菜单点击后通知渲染进程更新计数）。主进程通过某个窗口的 `webContents.send` 发，渲染进程侧在 preload 里监听。

```javascript
// main.js
mainWindow.webContents.send('update-counter', 1)
```

```javascript
// preload.js —— 必须包一层，切勿把 callback 直接交给 ipcRenderer.on
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (cb) => ipcRenderer.on('update-counter', (_e, value) => cb(value)),
})
```

> 安全铁律：直接 `ipcRenderer.on('ch', callback)` 把 callback 透传出去，会通过回调的 `event.sender` **把整个 `ipcRenderer` 泄露给网页**——必须像上面那样包一层、只回传需要的实参。详见[安全](./security)。

### ④ 渲染 ↔ 渲染

Electron **没有**渲染进程之间的直接 IPC 通道，两条路：

- **(a) 经主进程中转**：一个渲染进程发给主进程，主进程再 `webContents.send` 给另一个。
- **(b) `MessageChannelMain` 建端口**：主进程建一对端口，`postMessage` 分发给两端，之后两个渲染进程**点对点 `MessagePort` 直连**，不再经主进程。

```javascript
// main.js —— 建通道，把两个端口分别发给两个渲染进程
const { port1, port2 } = new MessageChannelMain()
renderer1.webContents.postMessage('port', null, [port1])
renderer2.webContents.postMessage('port', null, [port2])
```

## 三、序列化：结构化克隆与不可序列化类型

IPC 传对象走 **HTML Structured Clone** 算法，能传纯数据对象、数组、`Map`/`Set`、`ArrayBuffer` 等，但**不能传下面这些**（传了会报错）：

| 类别 | 例子 |
| --- | --- |
| **DOM 对象** | `Element`、`Location`、`DOMMatrix` |
| **Node C++ 对象** | `process.env`、`Stream` |
| **Electron C++ 对象** | `WebContents`、`BrowserWindow`、`WebFrame` |

需要跨进程传这些「句柄」时，改传**可序列化的标识**（如窗口 id、文件路径字符串），在对端再还原。

## 四、遗留 / 不推荐

- **`ipcRenderer.send` + `event.reply` 手动配对做双向**：能实现请求-响应，但不如 `invoke/handle` 清晰，新代码用后者。
- **`ipcRenderer.sendSync` / `event.returnValue`**：**同步阻塞渲染进程**直到主进程返回，会冻结 UI——**尽量避免**。

## 五、易错点小结

| # | 易错点 |
| --- | --- |
| 1 | preload 里监听主→渲消息**必须包一层剥掉 event**，别直接透传 `ipcRenderer.on` |
| 2 | `ipcMain.handle` 抛错跨进程**只保留 `message`**，其余字段丢失 |
| 3 | 传 DOM / Node / Electron 的 C++ 对象会**序列化失败报错** |
| 4 | 避免同步的 `sendSync` / `event.returnValue`，会阻塞渲染进程 |
| 5 | 请求-响应优先 `invoke/handle`；单向动作才用 `send/on` |
| 6 | 所有 `handle`/`on` 都应**校验 sender**（见[安全](./security)），防第三方 iframe 触发特权动作 |
