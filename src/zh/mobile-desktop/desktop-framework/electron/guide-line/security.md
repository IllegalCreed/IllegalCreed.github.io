---
layout: doc
outline: [2, 3]
---

# Electron 安全

> 基于 Electron 43 · 核于 2026-07

## 速查

- **三个默认安全开关（必背）**：`nodeIntegration=false`（**v5** 起，渲染进程无 Node）｜`contextIsolation=true`（**v12** 起，上下文隔离）｜`sandbox=true`（**v20** 起，渲染进程沙箱）——「一直默认」是错的
- **上下文隔离**：preload 与网页跑在**两个 JS 上下文**、`window` 是两个对象；网站/XSS 碰不到 Electron 内部与 preload 特权 API，也防原型污染；隔离下**必须走 `contextBridge`**，不能 `window.xxx=...`
- **contextBridge**：`exposeInMainWorld(key, api)` 只暴露**窄接口**；只能传可结构化克隆的值/函数（自定义原型、Symbol 会丢）
- **安全 Checklist 主线**：只加载 **HTTPS** ｜ 关 Node、开隔离与沙箱 ｜ 定义 **CSP** ｜ 不关 `webSecurity` ｜ **校验 IPC sender** ｜ `setWindowOpenHandler` 拦新窗、`will-navigate` 限导航 ｜ `shell.openExternal` 不接不受信数据 ｜ **永不透传 `ipcRenderer`** ｜ 用最新版
- **Fuses（构建期硬化）**：`@electron/fuses` 翻转「魔法位」——关 `runAsNode`/`nodeOptions`/`nodeCliInspect`、开 asar 完整性校验（`embeddedAsarIntegrityValidation` + `onlyLoadAppFromAsar`）
- **过时说法警惕**：Windows「OV 证书能免 SmartScreen 警告」已过时（**2023-06 起须 EV**，见[打包与分发](./packaging)）

## 一、三个默认安全开关及其历史

现代 Electron 的安全基线是三道**默认开启**的开关，但它们是**在不同版本才成为默认**的——面试/写题时最容易错在「以为一直默认」：

| 开关 | 安全默认 | 起始版本 | 作用 |
| --- | --- | --- | --- |
| `nodeIntegration` | **false** | **v5.0.0** | 渲染进程无 Node，防 XSS 升级为 RCE |
| `contextIsolation` | **true** | **v12.0.0** | preload 与网页上下文隔离 |
| `sandbox` | **true** | **v20.0.0** | 渲染进程受 OS 沙箱限制 |

三者叠加，让「加载了不受信内容的渲染进程」即便被 XSS 攻破，也拿不到 Node、碰不到 Electron 内部、被 OS 关在沙箱里。

## 二、上下文隔离与 contextBridge

### 上下文隔离 contextIsolation（v12 起默认）

开启后，**preload 脚本与网页跑在彼此独立的 JS 上下文**：preload 拿到的 `window` 和网页拿到的 `window` **是两个不同的对象**。

目的有二：

- 网站（或 XSS 注入的脚本）**碰不到** Electron 内部对象与 preload 里的特权 API。
- 防网站篡改 `Array.prototype` 等全局原型来**污染 preload** 的执行。

代价：隔离下**不能直接 `window.xxx = ...`** 把东西挂给网页，必须通过 `contextBridge`。

### contextBridge 用法与限制

```javascript
// preload.js —— 只暴露「够用」的窄接口
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadPreferences: () => ipcRenderer.invoke('load-prefs'),
  onUpdateCounter: (cb) => ipcRenderer.on('update-counter', (_e, v) => cb(v)), // 包一层，不泄露 event
})
```

- 两个方法：`exposeInMainWorld(key, api)`（主世界）、`exposeInIsolatedWorld(worldId, key, api)`（隔离世界）。
- **跨桥限制**：只能传**可结构化克隆**的值/函数；**不能传自定义原型链、Symbol**（过桥后原型丢失）。

配 `.d.ts` 扩展 `Window` 拿类型提示：

```typescript
export interface IElectronAPI {
  loadPreferences: () => Promise<void>
}
declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
```

## 三、官方安全 Checklist（分组精编）

官方 Checklist 共 20 条，记忆主线：**安全传输 → 关危险 API → 进程隔离 → 校验来源 → 收窄暴露**。大量攻击面来自「渲染进程加载了不受信内容 + 特权没关严」。

**安全传输与内容**

1. **只加载安全内容**：用 `https` / `wss` / `ftps`，别用明文 `http`。
2. **定义 CSP**：用 `onHeadersReceived` 注入响应头，或 `<meta http-equiv="Content-Security-Policy">`；推荐从 `default-src 'none'` / `script-src 'self'` 起步。
3. **不开 `allowRunningInsecureContent`**（默认 false）：防 HTTPS 页混入 HTTP 资源。
4. **不关 `webSecurity`**（默认 true）：关了会丢同源策略。

**关危险 API / 进程隔离**

5. **不给远程内容开 `nodeIntegration`**（默认 false）：防 XSS 升级为 RCE。
6. **开 `contextIsolation`**（默认 true）、**开 `sandbox`**（默认 true）。
7. **不开 `experimentalFeatures`、不用 `enableBlinkFeatures`**：默认关的特性通常有安全/稳定隐患。

**校验来源与导航**

8. **处理会话权限请求** `session.setPermissionRequestHandler()`：默认全放行，需自校验来源与权限类型。
9. **禁用/限制导航**：`will-navigate` 里比对 origin，非白名单 `preventDefault()`。
10. **禁用/限制开新窗**：`setWindowOpenHandler` 返回 `{ action: 'deny' }`；确需外开用 `shell.openExternal`。
11. **`shell.openExternal` 不接不受信数据**：只传硬编码/已校验 URL，否则可被诱导执行任意协议命令。
12. **`<webview>` 不加 `allowpopups`**，并在 `will-attach-webview` 里删 preload、强制 `nodeIntegration=false`、校验 `src`。
13. **避免 `file://`，改用自定义协议**：`file://` 在 Electron 里特权高，自定义协议可受控放文件。

**收窄暴露 / 保持更新**

14. **校验所有 IPC 的 sender**（见下一节）。
15. **别把 Electron API 直接暴露给不受信网页**：`contextBridge` 只暴露窄接口，**永不直接暴露 `ipcRenderer.on` / `ipcRenderer.send`**。
16. **用最新版 Electron**：老版本已知漏洞多。
17. **审查并关不需要的 Fuses**（见第五节）。

## 四、校验 IPC 的 sender（高频考点）

`ipcMain.handle` / `ipcMain.on` 的 handler **必须校验消息来源**，否则页面里嵌的第三方 iframe 也能触发你的特权动作：

```javascript
ipcMain.handle('get-secrets', (event) => {
  // 校验发消息的 frame 的 host，非白名单直接拒绝
  if (new URL(event.senderFrame.url).host !== 'electronjs.org') return null
  return getSecrets()
})
```

**永不透传 `ipcRenderer`** 是与之配套的铁律：

```javascript
// ❌ 危险：把 send 直接暴露给网页
contextBridge.exposeInMainWorld('api', { send: ipcRenderer.send })

// ❌ 仍危险：直接透传 callback，会经 event.sender 泄露整个 ipcRenderer
contextBridge.exposeInMainWorld('api', { on: (cb) => ipcRenderer.on('ch', cb) })

// ✅ 正确：包一层，剥掉 event、只回传需要的实参
contextBridge.exposeInMainWorld('api', {
  on: (cb) => ipcRenderer.on('ch', (_e, value) => cb(value)),
})
```

## 五、Electron Fuses（构建期安全硬化）

**Fuses（保险丝）** 是 Electron 二进制里的一组「魔法位」，**打包时（签名前）翻转**以开关某些底层特性；翻转后由 OS 经代码签名校验强制生效，**无需 fork Electron**。

- **工具**：`@electron/fuses` 包（Forge 用 `@electron-forge/plugin-fuses`）；`npx @electron/fuses read --app /Applications/Foo.app` 查状态。

```javascript
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')

flipFuses(require('electron'), {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false, // 硬化：关掉 ELECTRON_RUN_AS_NODE，防「就地取材」攻击
})
```

**常用硬化项：**

| Fuse | 默认 | 硬化建议 | 作用 |
| --- | --- | --- | --- |
| `runAsNode` | 开 | **关** | 是否认 `ELECTRON_RUN_AS_NODE` 把应用当 Node 跑 |
| `cookieEncryption` | 关 | **开** | Cookie 存储 OS 级加密 |
| `nodeOptions` | 开 | **关** | 是否认 `NODE_OPTIONS` / `NODE_EXTRA_CA_CERTS` |
| `nodeCliInspect` | 开 | **关** | 是否认 `--inspect` 调试 |
| `embeddedAsarIntegrityValidation` | 关 | **开** | 加载时校验 `app.asar` 完整性（macOS/Windows） |
| `onlyLoadAppFromAsar` | 关 | **开** | 只从 `app.asar` 加载应用 |
| `grantFileProtocolExtraPrivileges` | 开 | **关** | 是否给 `file://` 页额外特权 |

> ASAR 完整性校验（后两/三项）配合使用可做**防篡改**，是分发时的重要硬化，详见[打包与分发 · ASAR](./packaging)。

## 六、常见误区

- ❌「三个安全开关一直是默认」——它们分别自 **v5 / v12 / v20** 才成为默认。
- ❌「直接把 `ipcRenderer.on(ch, callback)` 暴露出去没问题」——会经 `event.sender` 泄露整个 `ipcRenderer`，必须包一层剥掉 event。
- ❌「关掉沙箱只是性能取舍」——关沙箱（含 `nodeIntegration:true` 连带关）显著扩大攻击面，非必要不关。
- ❌「Windows 用 OV/普通 Authenticode 证书就能免 SmartScreen 警告」——**2023-06 起已失去该收益**，须 EV（见[打包与分发](./packaging)）。
