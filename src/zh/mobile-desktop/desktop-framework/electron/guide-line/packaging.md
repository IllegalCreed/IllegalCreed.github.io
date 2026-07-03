---
layout: doc
outline: [2, 3]
---

# Electron 打包与分发

> 基于 Electron 43 · 核于 2026-07

## 速查

- **两大工具**：**Electron Forge**（官方推荐，三命令 `package` → `make` → `publish`，脚手架 `npm create electron-app@latest`）｜**electron-builder**（社区最流行，一体化、**自带 auto-update**，配置集中在 `package.json` 的 `build` 段或 `electron-builder.yml`）
- **ASAR 归档**：把源码拼成单个 `app.asar` 放 `resources/` 自动识别；改善读取性能、简化分发；配 fuse 做完整性校验
- **代码签名（分发必做）**：**macOS** ＝ 签名 + **公证 notarization** 两步（`@electron/osx-sign` + `@electron/notarize`；**未签名连自动更新/通知都失败**）；**Windows** ＝ **2023-06 起强制 EV 证书**，首选 **Azure Trusted Signing** 消除 SmartScreen 警告（`@electron/windows-sign`）
- **自动更新**：内置 `autoUpdater`（底层 **Squirrel**）；最省事 = 一行 `require('update-electron-app')()` 接 update.electronjs.org 免费服务（须公开 GitHub 仓库 + 发 Releases + 已签名）；`update-downloaded` → `quitAndInstall`
- **原生模块**：C++ 原生模块须用 `@electron/rebuild` 针对 Electron 的 Node ABI 重编译（Forge 内置处理）
- **过时说法**：Windows「OV 证书免警告」已过时（2023-06 起须 EV）；官方 tutorial 的 `package.json` 里 Electron 版本是旧占位、非最新

## 一、Electron Forge（官方推荐）

Forge 把整套构建工具统一到一个可扩展接口，三大命令是主线：

```bash
# 脚手架
npm create electron-app@latest my-app

# 三大命令
npm run package    # package：把应用打成平台目录（未生成安装包）
npm run make       # make：生成各平台安装包 / 可执行
npm run publish    # publish：发布到线上（GitHub Releases、S3 等）
```

- 内部整合 `@electron/packager`、`@electron/osx-sign`、`@electron/notarize`、`@electron/windows-sign`，并含 **fuses 插件**（构建期硬化，见[安全 · Fuses](./security)）。
- **Makers**（生成什么包）：Squirrel.Windows、WiX MSI（Win）；dmg、zip（mac）；deb、rpm（Linux）。
- **Publishers**（发到哪）：GitHub、S3 等。

## 二、electron-builder（社区最流行）

`electron-builder` 是一体化的「打包 + 构建可分发应用」方案，社区使用最广，特点是**自带 auto-update 支持**、配置集中：

```jsonc
// package.json 的 build 段（也可用 electron-builder.yml）
{
  "build": {
    "appId": "com.example.app",
    "mac": { "target": "dmg" },
    "win": { "target": "nsis" },
    "linux": { "target": "AppImage" }
  }
}
```

- 与 Forge 二选一即可：想要「官方链路 + 插件化 + fuses 内置」选 Forge；想要「配置集中 + 内置更新器 + 社区示例多」选 electron-builder。
- 另有商业的 **Hydraulic Conveyor**（开源免费）：跨平台构建 + 自定义更新，无需改代码。

## 三、ASAR 归档

- **是什么**：`asar`（Electron Archive）把应用源码**拼接成单个归档文件**，重命名为 `app.asar` 放到 `resources/` 即被自动识别并执行。
- **为什么**：在 Windows 等平台**改善文件读取性能**；也简化分发（尤其未用 Parcel/Webpack 打包时避免海量小文件）。
- **完整性防篡改**：配 `embeddedAsarIntegrityValidation` + `onlyLoadAppFromAsar` 两个 [Fuse](./security) 做加载期校验。

## 四、代码签名与公证（分发必做）

不签名时，Windows / macOS 会拦截应用或弹安全警告，甚至连自动更新都用不了。

### macOS：签名 + 公证两步

- 需 **Apple Developer 账号**、**Developer ID 证书**、开启 **hardened runtime**、配 entitlements。
- 工具：`@electron/osx-sign`（签名）+ `@electron/notarize`（公证）。
- ⚠️ **未签名的 macOS 应用无法自动更新，通知事件也会失败**——签名不是可选项。

### Windows：EV 证书 / Azure Trusted Signing

- **2023-06 起强制 EV 证书**：旧的 OV / 普通 Authenticode 证书**不再有 SmartScreen 收益**（「OV 能免警告」是过时说法）。
- EV 证书需 **FIPS 140 L2 硬件存储**或云签名（如 DigiCert KeyLocker）。
- **首选 Azure Trusted Signing（现 Azure Artifact Signing）**——最便宜、能消除 SmartScreen 警告。
- 工具统一到 `@electron/windows-sign`（可经 jsign 对接 Azure）。

## 五、自动更新 autoUpdater

Electron 内置 `autoUpdater` 模块，底层是 **Squirrel**（Win 用 Squirrel.Windows，mac 用 Squirrel.Mac）。开发期务必用 `app.isPackaged` 守卫，**只在打包后运行**。

### 最省事：接官方免费更新服务

```javascript
// 一行接入 update.electronjs.org 免费服务
require('update-electron-app')()
```

要求：mac/Win 应用、**公开 GitHub 仓库**、发布到 **GitHub Releases**、**已代码签名**（macOS 强制）。默认启动时 + 每 10 分钟检查、后台下载。

### 自建 / 静态存储更新

手动指定 feed 并监听更新事件：

```javascript
const { autoUpdater, dialog } = require('electron')

autoUpdater.setFeedURL({
  url: `${server}/update/${process.platform}/${app.getVersion()}`,
})

autoUpdater.on('update-downloaded', (event, notes, name) => {
  dialog
    .showMessageBox({ type: 'info', buttons: ['Restart', 'Later'] })
    .then((r) => {
      if (r.response === 0) autoUpdater.quitAndInstall()
    })
})

autoUpdater.on('error', (message) => console.error(message))
```

- **服务端响应差异**：Win 返 `/RELEASES` 文件；mac 返 JSON（含 `url` / `name` / `notes` / `pub_date`）；**无更新一律返 HTTP 204**。
- 也可用静态存储：`updateElectronApp({ updateSource: { type: UpdateSourceType.StaticStorage, baseUrl } })`。
- **替代方案**：electron-builder 自带更新器；自建服务端 Hazel / Nuts / electron-release-server / Nucleus。

## 六、原生 Node 模块的重编译

如果应用（主进程）用到 C++ 原生 Node 模块，需用 **`@electron/rebuild`** 针对 **Electron 内置 Node 的 ABI** 重新编译（直接用 npm 装的是给系统 Node 编的，ABI 不匹配会报错）。Forge 会内置处理这一步。

> 打包前也建议按[原生能力与生命周期 · 性能 Checklist](./native-lifecycle) 用 Webpack/Parcel/rollup 合并代码，减少运行时多次 `require()` 的开销。
