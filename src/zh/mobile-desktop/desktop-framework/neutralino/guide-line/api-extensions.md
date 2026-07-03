---
layout: doc
outline: [2, 3]
---

# Neutralino 原生 API 与扩展

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **原生 API 入口**：前端调 `Neutralino.*` 命名空间访问原生能力；原生 JS 用 `Neutralino` / `window.Neutralino`，框架里从 `@neutralinojs/lib` 导入；**都需先 `Neutralino.init()`**
- **主要命名空间**：`app`（应用管理）、`window`（窗口，仅 window 模式）、`filesystem`（文件/目录/watcher）、`os`（执行命令/环境变量/对话框/通知/托盘）、`computer`（硬件信息）、`storage`（键值持久化）、`events`（前后端事件）、`clipboard`、`updater`（自更新）、`extensions` / `custom`（扩展）
- **全局变量 `NL_*`**：运行时注入的只读全局，如 `NL_OS`（Linux/Windows/Darwin）、`NL_ARCH`、`NL_APPID`、`NL_PORT`、`NL_MODE`、`NL_PATH`（扩展命令常用 `${NL_PATH}`）
- **异步 Promise**：几乎所有 `Neutralino.*` 调用返回 Promise（底层 WebSocket + UUID 配对，见[架构](./architecture)）
- **Extensions（差异化能力）**：基于 WebSocket 的扩展系统，可用**任意语言**（Python/Go/Node/C++…）写后端逻辑，**不必从源码重编框架**
- **扩展通信**：扩展进程启动时经 **stdin** 收到连接信息（port、token、扩展 id），再主动连回 Neutralino 服务器走 IPC/WebSocket；前端用 `Neutralino.extensions.dispatch(id, event, data)` 发消息
- **权限前提**：能调哪些 `Neutralino.*` 方法由 `nativeAllowList` / `nativeBlockList` 决定（见 [CLI、配置与运行模式](./cli-config-modes)）

## 一、`Neutralino.*` 命名空间

前端通过一组命名空间访问后端原生能力。主要命名空间：

| 命名空间 | 作用 |
| --- | --- |
| `Neutralino.app` | 应用管理：退出、重启、广播事件、读配置、打开外部 URL 等 |
| `Neutralino.window` | 窗口管理：大小/位置/标题/最大最小化/全屏/托盘等（**仅 window 模式**） |
| `Neutralino.filesystem` | 文件与目录：读写、目录操作、文件监视 watcher、权限等 |
| `Neutralino.os` | 操作系统交互：执行命令（`execCommand`/`spawnProcess`）、环境变量、对话框、通知、托盘 |
| `Neutralino.computer` | 计算机/硬件信息：内存、CPU、显示器、鼠标位置、电池等 |
| `Neutralino.storage` | 键值数据持久化（应用级 storage） |
| `Neutralino.events` | 事件系统：`on` / `off` / `dispatch` / `broadcast`（前后端事件） |
| `Neutralino.extensions` | 扩展管理：向扩展 `dispatch` / `broadcast`、查询已连接扩展 |
| `Neutralino.custom` | 自定义原生方法（由扩展/自建后端注册） |
| `Neutralino.clipboard` | 剪贴板（文本，较新版本支持 HTML） |
| `Neutralino.updater` | 应用自更新（从远程 manifest 拉取新资源） |
| `Neutralino.debug` | 调试日志（`debug.log`） |
| `Neutralino.resources` | 读取打包进 `resources.neu` 的资源 |

> 完整命名空间与逐方法签名以官方 [API Overview](https://neutralino.js.org/docs/api/overview) 为准；不同小版本会持续增补方法（如文件权限、系统信息、回收站等）。

## 二、调用方式

所有调用都建立在 `Neutralino.init()` 之上（它建立 WebSocket 连接、加载全局变量）：

```js
// 原生 JS：直接用全局 Neutralino
Neutralino.init();

// 写文件、读环境变量、弹通知 —— 都是 Promise
await Neutralino.filesystem.writeFile('./hello.txt', 'Hi Neutralino');
const path = await Neutralino.os.getEnv('PATH');
await Neutralino.os.showNotification('标题', '正文');
```

```js
// 前端框架：从 npm 包按需导入
import { init, filesystem, os } from '@neutralinojs/lib';

init();
await filesystem.writeFile('./hello.txt', 'Hi Neutralino');
```

监听事件也走 `events` 命名空间：

```js
// 监听后端/扩展广播的事件
Neutralino.events.on('ready', () => {
  console.log('应用就绪');
});
```

## 三、`NL_*` 全局变量

运行时会注入一批**只读全局变量**，前端可直接读：

| 变量 | 含义 |
| --- | --- |
| `NL_OS` | 系统：`Linux` / `Windows` / `Darwin` |
| `NL_ARCH` | CPU 架构：`x64` / `arm` / `ia32` … |
| `NL_APPID` | 应用 ID |
| `NL_APPVERSION` | 应用版本 |
| `NL_PORT` | 应用端口 |
| `NL_MODE` | 运行模式：`window` / `browser` / `cloud` / `chrome` |
| `NL_VERSION` / `NL_CVERSION` | 框架版本 / 客户端库版本 |
| `NL_PATH` | 应用路径（扩展命令里常用 `${NL_PATH}`） |
| `NL_CWD` | 当前工作目录 |
| `NL_RESMODE` | 资源模式：`bundle` / `directory` |
| `NL_EXTENABLED` | 扩展是否启用（布尔） |

```js
// 按系统分支处理
if (NL_OS === 'Darwin') {
  // macOS 专属逻辑
}
```

> 自定义全局变量可在配置的 `globalVariables` 里定义，前端同样能读到。完整清单见官方 [Global Variables](https://neutralino.js.org/docs/api/global-variables)。

## 四、Extensions：任意语言后端（关键差异化能力）

Neutralino 内置的原生能力有限，但它提供了一个**基于 WebSocket 的扩展系统**，让你**不用从源码重编框架**就能扩展后端——而且**后端可以用任意语言写**：Python、Go、C++、Node.js…… 只要能连 WebSocket + 收发 JSON 即可。

这是 Neutralino 相对「后端只能用固定语言」的框架的独特之处：需要一段重活（图像处理、机器学习、系统级操作）时，用你最顺手的语言写个扩展进程即可。

**通信机制**：

- 扩展进程启动时，经 **stdin** 收到一段连接信息（应用的 `port`、`accessToken`、扩展 `id`）。
- 扩展据此**主动连回** Neutralino 服务器，走 IPC / WebSocket 与应用双向通信。
- 前端用 `Neutralino.extensions.dispatch(extensionId, event, data)` 向扩展可靠地发消息。

## 五、Extensions 配置与消息协议

在 `neutralino.config.json` 里启用并注册扩展（各平台给出对应的启动命令，`${NL_PATH}` 指向应用路径）：

```json
{
  "enableExtensions": true,
  "extensions": [
    {
      "id": "js.neutralino.myext",
      "commandLinux": "${NL_PATH}/extensions/myext",
      "commandWindows": "${NL_PATH}/extensions/myext.exe",
      "commandDarwin": "${NL_PATH}/extensions/myext"
    }
  ]
}
```

前后端之间的 JSON 消息大致长这样：

```js
// App → 扩展：前端 dispatch 一个事件
Neutralino.extensions.dispatch('js.neutralino.myext', 'runTask', { input: 42 });
```

```json
// 扩展 → App：扩展侧回发（携带 accessToken 与要调用的 method）
{
  "id": "<uuid>",
  "method": "app.broadcast",
  "accessToken": "<token>",
  "data": { "event": "taskDone", "data": { "result": 84 } }
}
```

- App → 扩展的消息形如 `{ "event": "runTask", "data": { ... } }`。
- 扩展 → App 通过携带 `accessToken` + `method`（如 `app.broadcast`）调用应用方法或广播事件，前端再用 `Neutralino.events.on(...)` 收。
- 由扩展注册的自定义方法可经 `Neutralino.custom.*` 调用。

> 配置字段与协议细节以官方 [Extensions Overview](https://neutralino.js.org/docs/how-to/extensions-overview) 为准。能调用哪些原生方法仍受 `nativeAllowList` / `nativeBlockList` 约束，见 [CLI、配置与运行模式](./cli-config-modes)。
