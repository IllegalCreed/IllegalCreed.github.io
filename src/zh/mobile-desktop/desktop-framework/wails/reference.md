---
layout: doc
outline: [2, 3]
---

# Wails 参考

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- 版本：生产 **v2.12**（Go 1.21+）；**v3 仍 alpha 未 GA**（`v3.0.0-alpha2.111`，Go 1.25+）
- CLI：v2 = **`wails`**（`init`/`dev`/`build`/`generate`/`doctor`），v3 = **`wails3`**，可共存
- 核心：Go 方法 `Bind` → 前端自动 TS 绑定（**恒 Promise**）；系统 WebView 渲染；`embed.FS` 打单文件
- 最常踩：`Bind` 传实例非类型、struct 字段需 `json` tag、runtime 调用放 `OnDomReady`、Windows 需 WebView2 运行时、体积数字只作数量级

## 一、版本坐标（2026-07）

| 项 | 值 |
| --- | --- |
| v2 最新稳定 | **v2.12.0**（2026-03） |
| v3 最新 | **v3.0.0-alpha2.111**（2026-07，**alpha/prerelease，未 GA**） |
| 生产推荐 | **v2.12** |
| v2 Go 版本 | **Go 1.21+**（新版 macOS 需更高） |
| v3 Go 版本 | **Go 1.25+** |
| Node 要求 | Node 15+ / NPM（前端构建用） |
| GitHub | 约 **35k star**（`wailsapp/wails`，默认分支 `master`） |

## 二、CLI 命令（v2 = `wails`）

| 命令 | 作用 | 关键 flag |
| --- | --- | --- |
| `wails init -n name -t vue` | 从模板建项目 | `-t` 模板（默认 vanilla）、`-g` git、`-ide vscode` |
| `wails dev` | 热重载开发 | `-frontenddevserverurl`（接 Vite）、`-s`（跳前端构建） |
| `wails build` | 打生产单二进制 | `-clean`、`-upx`、`-nsis`、`-obfuscated`、`-platform windows/arm64` |
| `wails generate module` | 生成 `wailsjs` 绑定 | |
| `wails doctor` / `wails version` / `wails update` | 体检 / 版本 / 升级 | |

> dev server 默认起在 `http://localhost:34115`。v3 命令名是 `wails3`，构建改由 Taskfile 驱动。

## 三、安装与环境

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest   # 装 v2 CLI
go install github.com/wailsapp/wails/v3/cmd/wails3@latest  # 装 v3 CLI（alpha）
wails doctor                                                # 体检（v3 用 wails3 doctor）
```

## 四、关键 API 速记

| 项 | v2 | v3（alpha） |
| --- | --- | --- |
| 入口 | `wails.Run(&options.App{...})` | `application.New(...)` + `app.Run()` |
| 暴露 Go | `Bind: []interface{}{app}` | `Services: []application.Service{NewService(&Svc{})}` |
| Go runtime | `import ".../v2/pkg/runtime"`（首参 `ctx`） | `app.Window/Menu/Event/Dialog...`（Manager API） |
| JS runtime | `window.runtime.*` | `/wails/runtime.js` |
| 前端调 Go | `import { Greet } from '../wailsjs/go/main/App'` | `import { GreetService } from '../bindings/<pkg>'` |
| 绑定生成 | `wails generate module` → `wailsjs/go/...` | `wails3 generate bindings` → `frontend/bindings/...`（ByID） |

## 五、Promise 语义（绑定方法）

| Go 返回 | 前端 Promise |
| --- | --- |
| 第一个返回值 | `resolve` 值 |
| 第二个返回值是 `error` 且非 `nil` | `reject`（`catch` 到） |

## 六、事件系统（Go ↔ JS 对等）

| 方法 | 作用 |
| --- | --- |
| `EventsOn(name, cb)` → 取消函数 | 注册监听 |
| `EventsOnce` / `EventsOnMultiple` | 一次 / 最多 N 次 |
| `EventsEmit(name, ...data)` | 发射事件 |
| `EventsOff` / `EventsOffAll` | 注销 / 全注销 |

> Go 侧首参恒 `ctx`（`EventsEmit(ctx, ...)`），JS 侧无 `ctx`。

## 七、Runtime 库分类（v2）

| 分类 | 常用方法 |
| --- | --- |
| Window | `WindowSetTitle` / `WindowMinimise` / `WindowMaximise` / `WindowFullscreen` / `WindowShow/Hide` / `WindowCenter` |
| Dialog | `OpenFileDialog` / `SaveFileDialog` / `MessageDialog`（返回按钮 label） |
| Clipboard | `ClipboardSetText` / `ClipboardGetText` |
| Events | `EventsEmit` / `EventsOn` / `EventsOff` |
| 其他 | `Environment()` → `{BuildType, Platform, Arch}`、Menu、Browser、Log |

## 八、生命周期钩子（v2）

| 钩子 | 时机 |
| --- | --- |
| `OnStartup(ctx)` | 启动，存 `ctx`；返回 error 会终止应用 |
| `OnDomReady(ctx)` | 等价 body onload，**runtime 调用建议放这里** |
| `OnBeforeClose(ctx)` | 关闭前，可拦截 |
| `OnShutdown(ctx)` | 退出 |

## 九、wails.json 关键字段

| 字段 | 作用 |
| --- | --- |
| `name` / `outputfilename` | 项目名 / 产物名 |
| `frontend:install` / `frontend:build` | 装依赖 / 打前端命令（不给则不碰前端） |
| `frontend:dev:serverUrl` | 接 dev server（`auto` 自动探测 Vite） |
| `wailsjsdir` | 绑定生成位置 |
| `info.*` | `productName`/`productVersion`/`copyright`/`fileAssociations`/`protocols` |
| `obfuscated` / `bindings.ts_generation` | 混淆 / TS 生成（`outputType: classes|interfaces`） |

## 十、平台与 WebView

| 平台 | WebView | 内核 |
| --- | --- | --- |
| Windows 10/11 | **WebView2** | Chromium（需装运行时；免 CGO / 免外部 DLL） |
| macOS | **WKWebView** | WebKit（同 Safari） |
| Linux | **WebKitGTK** | WebKit |

## 十一、vs Tauri / Electron

| | Wails | Tauri | Electron |
| --- | --- | --- | --- |
| 后端语言 | **Go** | Rust | Node.js |
| 渲染 | 系统 WebView | 系统 WebView | **打包 Chromium** |
| 体积/内存 | 小 | 小 | 大 |
| 一句话 | Go 团队的轻量桌面解 | 最小体积 / 能力安全 | 生态最成熟 |

> 体积/内存具体 MB 多为厂商自述或零散基准，**只作数量级**（Wails / Tauri « Electron）。

## 十二、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | **v3 仍 alpha 未 GA**，生产用 v2.12；别写 v3「已发布/推荐生产」 |
| 2 | CLI 命令名：v2 = `wails`、v3 = `wails3`，包路径 `/v2/` vs `/v3/`，别混 |
| 3 | Go 版本随版本升：v2 需 1.21+、v3 需 1.25+ |
| 4 | `Bind` 传的是 **struct 实例**（非类型），只暴露首字母大写的公开方法 |
| 5 | 绑定方法**恒返回 Promise**；Go 第二返回值 `error` 非 nil → `reject` |
| 6 | struct 字段需合法 `json` tag 才进 TS；**不支持匿名嵌套 struct** |
| 7 | runtime 调用放 `OnDomReady`（`OnStartup` 时窗口在别的线程初始化） |
| 8 | Windows 需目标机装 **WebView2 运行时**；`wails doctor` 可查 |
| 9 | 三平台 WebView 内核不同（Chromium vs WebKit），跨端渲染需实测 |
| 10 | Linux 需 `runtime.ResetSignalHandlers()`（每 goroutine）才能从 panic 恢复 |
| 11 | v2↔v3 绑定机制/import 路径完全不同（`wailsjs/go/...` vs `frontend/bindings/...`） |
| 12 | 体积/内存数字只作数量级，别引具体 MB 当权威 |

## 十三、权威链接

- [Wails 官网](https://wails.io/) · [How Does It Work](https://wails.io/docs/howdoesitwork) · [Getting Started](https://wails.io/docs/gettingstarted/installation)
- [CLI Reference](https://wails.io/docs/reference/cli) · [Project Config (wails.json)](https://wails.io/docs/reference/project-config) · [Runtime Reference](https://wails.io/docs/reference/runtime/intro)
- [Wails v3 文档（alpha）](https://v3.wails.io/) · [v3 What's New](https://v3.wails.io/whats-new/) · [v3 Status](https://v3.wails.io/status)
- [v2 → v3 Migration](https://v3.wails.io/migration/v2-to-v3) · [GitHub wailsapp/wails](https://github.com/wailsapp/wails)
