---
layout: doc
outline: [2, 3]
---

# Neutralino 参考

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **定位**：系统 WebView + 极薄 C++ 后端，**无 Node/Rust/Go 运行时**；Hello World 未压缩约 2MB、压缩后约 0.5MB；GitHub ≈8.5k star
- **平台**：Linux / Windows / macOS + 浏览器模式；兼容任意前端框架
- **通信**：本地 WebSocket + `accessToken` + UUID 任务池配对
- **CLI**：`neu create` / `run` / `build --release` / `update`
- **安全三抓手**：`tokenSecurity=one-time` + `nativeAllowList` + `nativeBlockList`
- **四模式**：window（默认）/ browser / cloud / chrome

## 一、定位与坐标

| 项 | 值 |
| --- | --- |
| 渲染 | 系统 WebView（Linux WebKitGTK / Win WebView2 / macOS WebKit），**不打包 Chromium** |
| 后端 | 极薄 C++ 二进制 + 内嵌 HTTP 静态服务器 |
| 运行时依赖 | **无**（不需 Node / Rust / Go） |
| 产物体积 | Hello World 未压缩 ≈2MB、压缩后 ≈0.5MB |
| 平台 | Linux / Windows / macOS / 浏览器模式 |
| 前端框架 | React / Vue / Angular / Svelte / 原生 JS |
| 社区 | GitHub ≈8.5k star（较小众） |
| 通信 | 本地 WebSocket + `accessToken` + UUID 任务池 |

## 二、`Neutralino.*` 命名空间

| 命名空间 | 作用 |
| --- | --- |
| `app` | 应用管理（退出/重启/广播/读配置/开外部 URL） |
| `window` | 窗口管理（仅 window 模式） |
| `filesystem` | 文件/目录/watcher/权限 |
| `os` | 执行命令 / 环境变量 / 对话框 / 通知 / 托盘 |
| `computer` | 硬件信息（内存/CPU/显示器/电池…） |
| `storage` | 键值持久化 |
| `events` | 事件（`on`/`off`/`dispatch`/`broadcast`） |
| `extensions` / `custom` | 扩展消息 / 自定义方法 |
| `clipboard` | 剪贴板 |
| `updater` | 应用自更新 |
| `debug` | `debug.log` |
| `resources` | 读 `resources.neu` |

## 三、常用 `NL_*` 全局变量

| 变量 | 含义 |
| --- | --- |
| `NL_OS` | `Linux` / `Windows` / `Darwin` |
| `NL_ARCH` | `x64` / `arm` / `ia32` … |
| `NL_APPID` / `NL_APPVERSION` | 应用 ID / 版本 |
| `NL_PORT` | 应用端口 |
| `NL_MODE` | `window` / `browser` / `cloud` / `chrome` |
| `NL_VERSION` / `NL_CVERSION` | 框架 / 客户端库版本 |
| `NL_PATH` | 应用路径（扩展命令用 `${NL_PATH}`） |
| `NL_RESMODE` | `bundle` / `directory` |
| `NL_EXTENABLED` | 扩展是否启用 |

## 四、`neu` CLI 命令

| 命令 | 作用 |
| --- | --- |
| `neu create <path>` | 从模板创建应用（`--template <acc>/<repo>`） |
| `neu run` | 开发运行，默认热重载（`--disable-auto-reload`） |
| `neu build` | 出 `dist/`（`--release` / `--embed-resources`） |
| `neu update` | 升级二进制与客户端库（`--latest`） |
| `neu version` | 显示版本 |
| `neu plugins` | 管理 CLI 插件 |

```bash
npm i -g @neutralinojs/neu
neu create myapp && cd myapp
neu run
neu build --release
```

## 五、`neutralino.config.json` 关键字段

| 字段 | 说明 |
| --- | --- |
| `applicationId` | 应用唯一 ID |
| `defaultMode` | `window` / `browser` / `cloud` / `chrome` |
| `port` | `0` = 随机（推荐） |
| `url` / `documentRoot` | 入口 / 静态资源根 |
| `enableServer` / `enableNativeAPI` | 内嵌服务器 / 原生 API 开关 |
| `tokenSecurity` | `one-time`（推荐）/ `none`（危险） |
| `nativeAllowList` | **白名单**，支持通配（`'os.*'`） |
| `nativeBlockList` | **黑名单**（`cloud` 模式尤重要） |
| `globalVariables` | 自定义全局变量 |

> 子字段名随版本演进，细节以官方 [Configuration](https://neutralino.js.org/docs/configuration/neutralino.config.json) 为准。

## 六、四种运行模式

| 模式 | 形态 | 备注 |
| --- | --- | --- |
| **window**（默认） | 原生 OS 窗口 | `window.*` 仅此可用 |
| **browser** | 默认浏览器打开 | 能调原生的 Web 应用 |
| **cloud** | 后台服务进程 | **务必收紧权限**（权限传导给 Web 端） |
| **chrome** | Chrome app 模式 | 需预装 Chrome/Chromium/Edge |

## 七、vs Electron / Tauri / Wails

| 维度 | Neutralino | Electron | Tauri | Wails |
| --- | --- | --- | --- | --- |
| 渲染 | 系统 WebView | 捆绑 Chromium | 系统 WebView | 系统 WebView |
| 运行时 | **无（C++ 内核）** | Node.js | Rust | Go |
| 体积 | **最小（<2MB）** | 150–200MB | 远小于 Electron | 类 Tauri |
| 权限 | 白/黑名单（手动） | 无强制 | **默认拒绝** | 有 |
| 门槛 | **纯 JS** | 纯 JS | 需 Rust | 需 Go |

## 八、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | 任何 API 前必须先 `Neutralino.init()`（否则 WS 未连、全局变量未加载） |
| 2 | `Neutralino.window.*` 仅 `window` 模式可用 |
| 3 | 原生方法默认受 `nativeAllowList` 限制——没放行会调用失败 |
| 4 | `tokenSecurity: 'none'` 危险，生产用 `one-time` |
| 5 | `cloud` 模式权限会传导给 Web 端，务必配 `nativeBlockList` |
| 6 | 依赖系统 WebView → 各平台 CSS/JS 行为差异是常见坑 |
| 7 | 扩展进程要读 **stdin** 拿连接信息（port/token/id）再连回 |
| 8 | 无原生 UI 组件、无 Tauri 式强权限模型 |
| 9 | `port: 0` 用随机端口，别硬编码端口 |
| 10 | 代码里用 `${NL_PATH}` 等全局变量拼扩展命令路径 |

## 九、权威链接

- [Neutralino 官网](https://neutralino.js.org/) · [Getting Started](https://neutralino.js.org/docs/getting-started/your-first-neutralinojs-app)
- [API Overview](https://neutralino.js.org/docs/api/overview) · [Global Variables](https://neutralino.js.org/docs/api/global-variables)
- [Configuration](https://neutralino.js.org/docs/configuration/neutralino.config.json) · [Modes](https://neutralino.js.org/docs/configuration/modes)
- [Extensions Overview](https://neutralino.js.org/docs/how-to/extensions-overview)
- [GitHub: neutralinojs](https://github.com/neutralinojs/neutralinojs) · [neutralino.js（客户端库）](https://github.com/neutralinojs/neutralino.js)
