---
layout: doc
outline: [2, 3]
---

# Tauri 分发与安全加固

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **打包**：`tauri build` 自动编译 + 打包；`--no-bundle` 只编不打包。产物按平台：Win=**MSI/NSIS**、mac=**.app/.dmg/.pkg**、Linux=**.deb/.rpm/AppImage**、Android=**APK/AAB**、iOS=**.ipa**
- **代码签名**：macOS 需签名 + **公证（notarization）**；Windows 安装器需签名；Android/iOS 强制签名
- **updater（自动更新插件）**：`createUpdaterArtifacts: true` + `pubkey` + `endpoints`；构建期用 `TAURI_SIGNING_PRIVATE_KEY` 生成 `.sig`；前端 `check()` → `downloadAndInstall()` → `relaunch()`
- **Sidecar**：随包携带外部二进制（`bundle.externalBin`）；文件名必须带**目标三元组后缀** `名字-$TARGET_TRIPLE`（查：`rustc --print host-tuple`）
- **CSP**（防 XSS）：`app.security.csp` 配置；**编译期自动加 nonce/hash**（外部脚本补 nonce、本地脚本算 hash）；Rust/WASM 前端要加 `'wasm-unsafe-eval'`
- **Isolation Pattern**（官方推荐尽量用）：前端与 Core 之间注入**沙箱 iframe** 拦截并 **AES-GCM 加密**校验 IPC；**Windows 下不支持 ES Modules、脚本须内联**
- **模式选型**：依赖多/要纵深防御 → **Isolation**；依赖极少、极致性能 → **Brownfield（默认）**
- **配置**：核心配置 `tauri.conf.json`（`productName`/`version`/`identifier`/`build`/`app`/`bundle`/`plugins`）；支持平台覆盖文件 + JSON Merge Patch

## 一、tauri build 与打包产物

`tauri build` 会自动完成「编译 Rust + 打包安装包」两步（`--no-bundle` 可只编译不打包）。产物按平台不同：

| 平台 | 格式 |
| --- | --- |
| Windows | **MSI（WiX）**、**NSIS（.exe 安装器）** |
| macOS | **.app**、**.dmg**、App Store（.pkg） |
| Linux | **.deb**、**.rpm**、**AppImage**、Snap、AUR |
| Android | **APK / AAB**（Google Play） |
| iOS | App Store（.ipa） |

版本号取 `tauri.conf.json` 的 `version`（缺省回落 `Cargo.toml` 的 `package.version`）。

## 二、代码签名与分发渠道

- **代码签名**：macOS 需签名 + **公证（notarization）**；Windows 安装器需签名；Android/iOS 强制签名。不签名会被系统拦截或告警。
- **分发渠道**：App Store / Microsoft Store / Google Play / Linux 包管理器 / 直接下载 / CrabNebula Cloud（自动更新 + 全球分发）。

## 三、updater：自动更新

`tauri-plugin-updater` 让桌面应用自检更新并静默升级。先生成签名密钥对（私钥务必妥存，丢了无法再发更新）：

```bash
cargo add tauri-plugin-updater --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
npm i @tauri-apps/plugin-updater
npm run tauri signer generate -- -w ~/.tauri/myapp.key   # 生成密钥对
```

在 `tauri.conf.json` 配置公钥与端点：

```json
{
  "bundle": { "createUpdaterArtifacts": true },
  "plugins": {
    "updater": {
      "pubkey": "内容来自 .pub 文件",
      "endpoints": ["https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"]
    }
  }
}
```

- 端点支持三个占位变量（Tauri 请求时自动替换）：`current_version`（当前版本）、`target`（linux/windows/darwin）、`arch`（x86_64/aarch64…），在 URL 里以双花括号包裹（见上方代码块）。
- **更新清单 JSON** 含 `version`、`notes`、`pub_date`、`platforms.<target-arch>.{url, signature}`（url 与 signature 必填）。
- 构建时导出环境变量 `TAURI_SIGNING_PRIVATE_KEY`，Tauri 自动生成 `.sig` 签名文件。
- 前端触发（权限 `updater:default`）：

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  await update.downloadAndInstall(); // 可传回调显示进度
  await relaunch();                  // 重启应用
}
```

## 四、Sidecar：打包外部二进制

随包携带外部可执行文件（Python CLI、独立 API server 等），让用户无需自装依赖。

```json
// tauri.conf.json（相对路径从 src-tauri 解析）
{ "bundle": { "externalBin": ["binaries/my-sidecar"] } }
```

- **命名要求**：每个二进制须带**目标三元组后缀** `名字-$TARGET_TRIPLE`，如 `my-sidecar-aarch64-apple-darwin`、`my-sidecar-x86_64-unknown-linux-gnu`。查本机三元组：`rustc --print host-tuple`（旧版 rustc 用 `rustc -Vv` 看 host 行）。
- Rust 侧（经 shell 插件）：

```rust
use tauri_plugin_shell::ShellExt;

// sidecar() 只写文件名，Tauri 自动补三元组后缀
let cmd = app.shell().sidecar("my-sidecar").unwrap();
let (mut rx, mut child) = cmd.spawn().unwrap();
```

- 前端：`import { Command } from '@tauri-apps/plugin-shell'; Command.sidecar('binaries/my-sidecar')`。
- 权限：capability 加 `shell:allow-execute`（或 `shell:allow-spawn`），并在 `allow` 列表标 `{ name, sidecar: true }`。

## 五、CSP：内容安全策略（防 XSS）

在 `tauri.conf.json` 的 `app.security.csp` 配置 CSP，Tauri 会在**编译期自动加 nonce/hash**——外部脚本/样式自动补 nonce，本地脚本编译期算 hash，无需手动管理 nonce。

```json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self' customprotocol: asset:",
        "connect-src": "ipc: http://ipc.localhost",
        "img-src": "'self' asset: http://asset.localhost blob: data:",
        "style-src": "'unsafe-inline' 'self' https://fonts.googleapis.com"
      }
    }
  }
}
```

- Rust 前端（WASM）需在 `script-src` 加 `'wasm-unsafe-eval'`。
- 相关旋钮：`devCsp`（开发期 CSP）、`dangerousDisableAssetCspModification`（危险，关闭自动改写）。

## 六、Isolation Pattern：隔离模式

Isolation 在**前端与 Core 之间注入一个沙箱 iframe（Isolation 应用）**，拦截所有 IPC 消息，验证/修改后再放行——用于防不可信的前端依赖（供应链攻击）。**官方推荐尽量用**。

消息流：前端发 IPC → Isolation 沙箱的 `window.__TAURI_ISOLATION_HOOK__(payload)` 钩子处理 → **AES-GCM 加密**（**每次运行生成新密钥**，防跨版本重放）→ 回到 IPC handler → Core 解密执行。

```json
{
  "app": {
    "security": {
      "pattern": { "use": "isolation", "options": { "dir": "../dist-isolation" } }
    }
  }
}
```

`dir` 指向编译好的 Isolation 应用（含 `index.html`）。

- 开销小（AES-GCM 快）；**限制**：Windows 下沙箱 iframe 不加载外部文件，脚本须构建期内联，**不支持 ES Modules**。
- **模式选型**：依赖多、要纵深防御 → **Isolation**；依赖极少、极致性能 → **Brownfield（默认）**。

## 七、配置文件骨架（tauri.conf.json）

核心配置集中在 `tauri.conf.json`（默认 JSON；加 feature `config-json5`/`config-toml` 可用 JSON5/`Tauri.toml`）：

```json
{
  "productName": "MyApp",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{ "title": "Main" }],
    "security": { "csp": "default-src 'self'", "capabilities": ["main-capability"] }
  },
  "bundle": { "active": true, "targets": "all", "icon": ["icons/icon.png"] },
  "plugins": { "updater": { "pubkey": "...", "endpoints": ["..."] } }
}
```

- **平台覆盖**：`tauri.windows.conf.json` / `.linux.` / `.macos.` / `.android.` / `.ios.` 用 **JSON Merge Patch（RFC 7396）** 合并到基础配置。
- `Cargo.toml` 里 `tauri` / `tauri-build` 版本须与 CLI 对齐。

> 权限相关的 `app.security.capabilities` 见[权限系统 ACL](./permissions)；体积优化的 `removeUnusedCommands` 与 release profile 见[架构与进程模型](./architecture)。
