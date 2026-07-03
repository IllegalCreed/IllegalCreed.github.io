---
layout: doc
outline: [2, 3]
---

# Tauri 权限系统 ACL

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **v2 用 ACL 取代 v1 `allowlist`**：三件套 **Permissions / Scopes / Capabilities**，粒度更细，可按窗口/平台/远程来源区分
- **Permission（权限）**：最小授予单元，描述「某命令的显式特权」，可含 scope 与 allow/deny——写在 TOML，放 `src-tauri/permissions/`（插件自带在插件内）
- **Scope（作用域）**：权限内对参数/路径的允许/拒绝细则（如允许 `$HOME/*`、拒绝 `$HOME/secret`）
- **Capability（能力）**：把一组 permission **映射到具体窗口/webview**（可限平台、限远程 URL）——写在 JSON/TOML，放 `src-tauri/capabilities/`，默认全部自动加载
- **标识符**：`<插件>:<权限名>` 或 `<插件>:default`，如 `fs:read-files`、`core:window:allow-close`、`core:default`；`tauri-plugin-` 前缀自动补全
- **命名惯例**：`allow-*` / `deny-*`，**deny 优先级高于 allow**；标识符限 ASCII 小写、长度 ≤116
- **Permission Set**：`[[set]]` 把多个权限打包成新标识符，便于按 OS/功能复用
- **插件接入三步**：`cargo add tauri-plugin-xxx` + `npm i @tauri-apps/plugin-xxx` + Builder `.plugin(tauri_plugin_xxx::init())`，再给 capability 加对应权限
- **`core:` 命名空间**：内置能力（window/event/path/app/webview），无需装插件但仍需 capability 授权
- **迁移大坑**：v1 的 `allowlist`（tauri.conf.json 里开关 API）在 v2 **完全被 ACL 取代**；远程调 API 默认禁止，需在 capability 的 `remote.urls` 显式配

## 一、为什么要 ACL（取代 v1 allowlist）

Tauri v1 用一个扁平的 `allowlist`（写在 `tauri.conf.json` 里）来开关各类 API——粒度粗、无法区分「哪个窗口能用」「哪个平台能用」「哪个远程来源能用」。

v2 用一套 **ACL（Access Control List，访问控制列表）** 取代它，由三个概念组成，粒度细到「**谁（窗口）在什么条件下（平台/远程）能用哪些命令（权限），作用在什么范围（scope）**」。

## 二、三个概念的关系

- **Permission（权限）**：描述「某命令的显式特权」，可包含 scope（路径/资源范围）与 allow/deny 列表。是**最小授予单元**。
- **Scope（作用域）**：权限内部对参数/路径的允许/拒绝细则（如 `$HOME/*` 允许、`$HOME/secret` 拒绝）。
- **Capability（能力）**：把一组 permission **映射到具体窗口/webview**，可限定平台、限定远程 URL。是「谁能用哪些权限」的绑定。

一句话串起来：**Permission 定义「能做什么 + 范围」，Capability 定义「哪个窗口/平台/来源拥有这些 Permission」**。

## 三、Permission（TOML，放 `src-tauri/permissions/`）

应用自定义权限写成 TOML；插件自带的权限在插件的 `permissions/` 里。

```toml
[[permission]]
identifier = "read-files"
description = "启用文件读取相关命令"
commands.allow = ["read_file", "read", "read_text_file"]

# scope：对路径参数做允许/拒绝细则，deny 优先
[[scope.allow]]
path = "$HOME/*"
[[scope.deny]]
path = "$HOME/secret"
```

标识符与命名规则：

- 格式：`<插件名>:<权限名>` 或 `<插件名>:default`，如 `fs:read-files`、`fs:allow-mkdir`、`core:window:allow-close`、`core:default`。
- 前缀 `tauri-plugin-` 自动补全，引用时只写基名（写 `fs` 而非 `tauri-plugin-fs`）。
- 命名惯例 `allow-*` / `deny-*`，**deny 优先级高于 allow**。
- `<名>:default` 默认权限会被 CLI 自动加入配置。
- 标识符限 ASCII 小写字母，长度 ≤116。

## 四、Permission Set：打包复用

用 `[[set]]` 把多个权限打包成一个新标识符，便于按 OS 或功能整体复用：

```toml
[[set]]
identifier = "allow-home-read-extended"
description = "组合权限集"
permissions = ["fs:read-files", "fs:scope-home", "fs:allow-mkdir"]
```

## 五、Capability（JSON，放 `src-tauri/capabilities/`）

Capability 把权限**绑定到窗口**，并可限定平台与远程来源；`capabilities/` 下的文件默认全部自动加载。

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "主窗口能力",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "remote": { "urls": ["https://*.tauri.app"] },
  "permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:window:allow-set-title",
    "fs:default"
  ]
}
```

字段与规则：

- `windows`：目标窗口（支持 `"*"` 通配）；`platforms`：`linux|macOS|windows|iOS|android`；`remote.urls`：远程来源白名单；`permissions`：授予的权限列表。
- 一个窗口参与多个 capability 时，权限取**并集**。
- 在 `tauri.conf.json` 引用：`app.security.capabilities: ["main-capability", ...]`（也可内联对象）；一旦显式列出，构建时**只用**列出的这些。
- **平台差异化**：桌面 capability 给 `global-shortcut:allow-register`，移动 capability 给 `nfc:allow-scan` / `biometric:allow-authenticate`。

## 六、插件系统与权限接入

v2 把大量原核心 API 拆成**独立插件** `tauri-plugin-*`（前端包 `@tauri-apps/plugin-*`），按需引入以减小体积。**接入三步**：

```bash
# 1. Rust 依赖
cargo add tauri-plugin-fs
# 2. 前端包（如需前端 API）
npm i @tauri-apps/plugin-fs
```

```rust
// 3. 在 Builder 注册插件
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init());
// 别忘了：再到 capability 里加对应权限（如 "fs:default"）
```

- **官方插件（30+）**：`fs`/`dialog`/`shell`/`http`/`notification`/`store`/`sql`/`updater`/`log`/`os`/`opener` 等；移动专属 `barcode-scanner`/`biometric`/`nfc`/`haptics`。
- **`core:` 命名空间**：window/event/path/app/webview 等**内置能力无需装插件**，但仍要在 capability 里授权（如 `core:default`、`core:window:allow-close`）。

## 七、v1→v2 迁移与远程访问坑

- **迁移大坑**：v1 的 `allowlist`（在 `tauri.conf.json` 里开关 API）在 v2 **完全被 ACL 取代**；能力/权限文件 + 插件化 API 是全新体系，v1 配置无法直接沿用。
- **远程访问坑**：默认**只有本地打包代码能调 API**；要让远程页面调用，必须在 capability 的 `remote.urls` 显式配白名单。且 **Linux/Android 无法区分 `<iframe>` 与主窗口的请求**（安全上要额外小心）。

> 进一步的安全加固（CSP、Isolation Pattern、代码签名）见[分发与安全加固](./distribute)。
