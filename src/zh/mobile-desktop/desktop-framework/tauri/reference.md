---
layout: doc
outline: [2, 3]
---

# Tauri 参考

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- 版本：**Tauri v2（2.0 stable）**；CLI `@tauri-apps/cli` **v2.x**；底层 **WRY ≈0.55.x / TAO ≈0.35.x**；GitHub **≈107–108k star**；MSRV **Rust 1.77.2**
- 架构：**Core（Rust）** + **WRY / TAO** + 系统 WebView；依赖链 `tauri` → `tauri-runtime` → `tauri-runtime-wry` → WRY → TAO
- 最常踩：v1 `allowlist` 已废改 **ACL**；逻辑在 `lib.rs`、`main.rs` 是薄壳；命令 `pub` 规则；async 命令禁借用参数；`Emitter`/`Manager` trait；Channel 用 `new Channel()`

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 主版本 | **Tauri v2（2.0 stable）** |
| CLI | `@tauri-apps/cli` **v2.x** |
| 底层 WRY | **≈0.55.x**（WebView 封装） |
| 底层 TAO | **≈0.35.x**（窗口库，fork 自 winit） |
| GitHub star | **≈107–108k**（2026-07） |
| MSRV | **Rust 1.77.2** |
| 平台 | Linux / macOS / Windows **+ iOS / Android** |

## 二、核心 API 速记

| 场景 | API |
| --- | --- |
| 定义命令 | `#[tauri::command] fn foo(...) -> T {}` |
| 注册命令 | `.invoke_handler(tauri::generate_handler![foo, bar])` |
| 前端调命令 | `import { invoke } from '@tauri-apps/api/core'; invoke('foo', { arg })` |
| 参数命名 | 默认 camelCase；`#[tauri::command(rename_all = "snake_case")]` |
| 错误处理 | 返回 `Result<T, E>`（E 实现 `Serialize`，用 thiserror）→ 前端 `.catch` |
| async 命令 | `async fn`；禁借用参数，可返回 `Result<T, ()>` |
| 大二进制返回 | `tauri::ipc::Response::new(bytes)` |
| Rust 发事件 | `use tauri::Emitter; app.emit("ev", payload)` / `emit_to("label", ...)` |
| 前端听事件 | `import { listen, once } from '@tauri-apps/api/event'; const un = await listen('ev', cb)` |
| 高吞吐流 | `tauri::ipc::Channel<T>`（后端 `.send()`）+ 前端 `new Channel()` |
| 注册状态 | `.manage(Mutex::new(state))` |
| 取状态（命令内） | `state: State<'_, Mutex<T>>` → `state.lock().unwrap()` |
| 取状态（命令外） | `app.state::<Mutex<T>>()`（需 `use tauri::Manager`） |
| 取窗口 | `app.get_webview_window("main")`（需 `use tauri::Manager`） |
| 注册插件 | `.plugin(tauri_plugin_fs::init())` |

## 三、关键 CLI

```bash
npm create tauri-app@latest            # 脚手架（交互式选前端/语言/包管理器）
npm run tauri dev / build              # 桌面开发 / 构建
npm run tauri build --no-bundle        # 只编不打包
npm run tauri android|ios init|dev|build   # 移动端
npm run tauri signer generate -- -w key    # 生成更新签名密钥
rustc --print host-tuple               # 查目标三元组（sidecar 命名用）
```

## 四、权限标识符速记

- **core（内置）**：`core:default`、`core:window:allow-close`、`core:event:default`、`core:path:default`
- **插件**：`fs:default`、`fs:read-files`、`fs:allow-mkdir`、`fs:scope-home`、`shell:allow-execute`、`shell:allow-spawn`、`updater:default`、`dialog:default`、`notification:default`
- **移动**：`biometric:allow-authenticate`、`nfc:allow-scan`
- **规则**：`<插件>:<allow|deny>-<命令>` 或 `<插件>:default`；**deny > allow**；`tauri-plugin-` 前缀自动补全；标识符限 ASCII 小写、长度 ≤116

## 五、配置骨架（tauri.conf.json）

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

## 六、vs Electron 对照

| 维度 | Tauri v2 | Electron |
| --- | --- | --- |
| 后端语言 | **Rust**（移动可 Swift/Kotlin） | Node.js |
| 渲染引擎 | **系统 WebView** | **打包 Chromium** |
| 安装包 | 极小（<600KB~10MB） | 大（100MB+） |
| 内存 | 低（~50MB 级） | 高 |
| 渲染一致性 | 各 OS 有差异 | **一致** |
| 移动端 | **支持 iOS/Android** | 不支持 |
| 生态 | 较新、增长快 | 老牌、最全 |

## 七、高频坑 / 考点

| # | 要点 |
| --- | --- |
| 1 | **v1→v2**：`allowlist` 已废，改 **Permissions/Capabilities ACL**；核心 API 拆成 `tauri-plugin-*` |
| 2 | **入口**：逻辑在 `lib.rs` 的 `run()`，`main.rs` 是薄壳；移动靠 `mobile_entry_point` 宏 |
| 3 | **命令 pub 规则**：`lib.rs` 内命令**不能 pub**；独立模块内**必须 pub** |
| 4 | **async 命令**：不能收借用参数（`&str` / `State<'_>`） |
| 5 | **参数命名**：Rust snake_case ↔ 前端默认 camelCase |
| 6 | **两个 trait**：`app.emit` 需 `use tauri::Emitter`；`app.state()`/`get_webview_window()` 需 `use tauri::Manager` |
| 7 | **Channel**：前端用 `new Channel()` 对象作 `invoke` 参数传入 |
| 8 | **远程 IPC**：默认禁远程调 API；Linux/Android 无法区分 iframe 与主窗口 |
| 9 | **Isolation**：Windows 下不支持 ES Modules，脚本须内联 |
| 10 | **渲染差异**：系统 WebView 版本不同 → 需跨平台测；这是「小体积」的代价 |
| 11 | **sidecar 命名**：必须带 `-$TARGET_TRIPLE` 后缀，否则打包/运行失败 |
| 12 | **updater**：`createUpdaterArtifacts: true` + 签名私钥务必妥存（丢了无法再发更新） |

## 八、权威链接

- [Tauri 官网](https://v2.tauri.app/) · [Start](https://v2.tauri.app/start/) · [Prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Core Concepts](https://v2.tauri.app/concept/) · [Architecture](https://v2.tauri.app/concept/architecture/) · [Process Model](https://v2.tauri.app/concept/process-model/)
- [Inter-Process Communication](https://v2.tauri.app/concept/inter-process-communication/) · [Calling Rust](https://v2.tauri.app/develop/calling-rust/) · [Calling Frontend](https://v2.tauri.app/develop/calling-frontend/)
- [Security](https://v2.tauri.app/security/) · [Permissions](https://v2.tauri.app/security/permissions/) · [Capabilities](https://v2.tauri.app/security/capabilities/) · [Isolation](https://v2.tauri.app/security/isolation/)
- [Develop](https://v2.tauri.app/develop/) · [State Management](https://v2.tauri.app/develop/state-management/) · [Distribute](https://v2.tauri.app/distribute/)
- [Plugins](https://v2.tauri.app/plugin/) · [Updater](https://v2.tauri.app/plugin/updater/) · [Config Reference](https://v2.tauri.app/reference/config/)
- [tauri-apps/tauri](https://github.com/tauri-apps/tauri) · [awesome-tauri](https://github.com/tauri-apps/awesome-tauri)
