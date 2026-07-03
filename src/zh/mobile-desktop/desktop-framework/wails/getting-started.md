---
layout: doc
outline: [2, 3]
---

# 入门：Wails 是什么与怎么起步

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- **一句话**：Wails 用 **Go 写后端 + 系统原生 WebView 渲染前端**，把 Go 应用与前端资源打进**单一可执行文件**；定位「**Go 版轻量 Electron 替代**」，与 Tauri 同路线但后端是 Go 不是 Rust
- **不打包浏览器**：复用系统 WebView（Win `WebView2` / macOS `WKWebView` / Linux `WebKitGTK`）→ 体积小、内存低；代价是各平台 WebView 行为可能有差异
- **灵魂特性**：Go struct 的**公开方法自动绑定**到前端 JS（恒返回 Promise）+ **自动生成 TS 声明与模型**；前端框架任选，资源经 `embed.FS` 嵌进二进制
- **装 CLI（v2）**：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`，命令名 `wails`；体检环境 `wails doctor`
- **建项目并跑起来**：`wails init -n myapp -t vue` → `cd myapp` → `wails dev`（热重载，dev server 在 `http://localhost:34115`）→ `wails build`（出单二进制）
- **环境要求**：**Go 1.21+**（新版 macOS 需更高）、Node 15+ / NPM（前端构建用）；Windows 需系统装有 WebView2 运行时
- **版本坐标**：生产选 **v2.12**；**v3 仍 alpha 未 GA**（`v3.0.0-alpha2.111`，2026-07），CLI 是 `wails3`、需 **Go 1.25+**，带来多窗口/系统托盘——**尝鲜可，生产勿用**
- **别混淆**：`wails`（v2）vs `wails3`（v3）是两套 CLI，可共存；包路径 `/v2/` vs `/v3/`
- **进阶顺序**：先读[架构](./guide-line/architecture)吃透单文件模型 → 再读[绑定与 Runtime](./guide-line/bindings-runtime)掌握 Go↔JS 交互 → [构建与工程化](./guide-line/build)把项目发出去

## 一、Wails 解决什么问题

Wails 要回答的问题是：**Go 开发者能不能不学 Rust、不用 Node、也不套一层 Electron，就产出体积小、内存省、能调用系统能力的桌面 GUI？** 它的答案是——**后端用 Go 编译进单一可执行文件，界面交给操作系统自带的 WebView 渲染，前端资源经 `embed.FS` 一起打进二进制**。于是你既能复用 Go 的并发、标准库与整个生态，又能用熟悉的 Web 技术（React/Vue/Svelte/原生 HTML 皆可）写界面。

这条路线可以对照三类方案理解：

- **vs Electron**：Electron **打包整个 Chromium + Node.js**，因此体积常达上百 MB、内存占用高；Wails **复用系统 WebView、不带浏览器**，产物是单个可执行文件，体积与内存是另一个量级（详见[架构](./guide-line/architecture)）。
- **vs Tauri**：两者**同路线**——都复用系统 WebView、都追求小体积。差别是**后端语言**：Tauri 是 Rust，Wails 是 **Go**。选谁主要看团队栈。
- **vs 纯原生（如 Qt/WinUI）**：Wails 用 Web 技术写界面、迭代快、跨端一套代码；代价是受制于各平台 WebView 的渲染/兼容差异。

## 二、Wails 与 Electron / Tauri 是什么关系

如果你了解 Electron，就已经理解 Wails 的一半：**都是「Web 前端 + 后端语言 + 桌面壳」的组合**。区别在于 Wails 把「后端语言」换成 Go、把「打包整个浏览器」换成「复用系统 WebView」。

| 维度 | Wails | Tauri | Electron |
| --- | --- | --- | --- |
| 后端语言 | **Go** | Rust | Node.js |
| 渲染 | 系统 WebView | 系统 WebView | **打包整个 Chromium** |
| 体积/内存 | 小 | 小 | 大 |
| 定位 | Go 团队的轻量桌面解 | 最小体积/能力安全 | 生态最成熟 |

> 体积与内存的具体数字（如「约十几 MB」）多来自厂商自述与第三方零散基准，**只作数量级理解**（Wails / Tauri « Electron），别当权威指标——见[架构](./guide-line/architecture)。

## 三、怎么起步：装 CLI 与建项目

Wails 用一个 Go 写的 CLI 驱动整个开发流程。注意 **v2 命令名是 `wails`、v3 是 `wails3`**，二者可共存；下面均以稳定的 **v2** 为例。

```bash
# 1. 安装 v2 CLI（命令名 wails）
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 2. 体检环境：检查 Go / Node / 平台依赖（如 Windows 的 WebView2）是否齐全
wails doctor

# 3. 从模板建项目（-t 选前端模板：vanilla/vue/react/svelte...，默认 vanilla）
wails init -n myapp -t vue

# 4. 进目录、热重载开发（dev server 起在 http://localhost:34115，可用浏览器 + 扩展调试）
cd myapp
wails dev

# 5. 打生产单二进制
wails build
```

环境前提：

- **Go 1.21+**（较新版本 macOS 需更高，`wails doctor` 会提示）；**Node 15+ / NPM**（用于前端资源构建）。
- **Windows** 需系统装有 **WebView2 运行时**（Win11 自带，Win10 可能需补装），`wails doctor` 可检测。
- Wails 对前端「什么都不做」：`wails build` 只按 `wails.json` 里的 `frontend:install` / `frontend:build` 两个命令去装依赖、打前端（详见[构建与工程化](./guide-line/build)）。

## 四、核心心智：项目长什么样

一个 v2 Wails 项目的后端通常是 **`main.go`（配置与启动）+ `app.go`（业务逻辑）** 双文件范式：

```go
// main.go —— 用 embed.FS 嵌入前端产物，再 wails.Run 启动
//go:embed all:frontend/dist
var assets embed.FS

func main() {
    app := NewApp()
    err := wails.Run(&options.App{
        Title:  "My App",
        Width:  1024, Height: 768,
        AssetServer: &assetserver.Options{Assets: assets}, // 前端资源必填
        OnStartup:   app.startup,       // 拿到 ctx 存下来，供 runtime 调用
        Bind:        []interface{}{app}, // 把要暴露给前端的 struct 实例列出来
    })
    if err != nil {
        log.Fatal(err)
    }
}
```

```go
// app.go —— App 的公开方法会被自动绑定到前端
type App struct{ ctx context.Context }

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx } // 保存 ctx

// 首字母大写 → 自动生成前端 JS 绑定（前端 import 后调用返回 Promise）
func (a *App) Greet(name string) string { return fmt.Sprintf("Hello %s!", name) }
```

前端只需从 Wails 生成的目录 `import` 这个方法即可调用：

```js
// 前端：wails dev 会在 frontend/wailsjs 下自动生成绑定
import { Greet } from "../wailsjs/go/main/App";

Greet("Peter").then((result) => {
  // result === "Hello Peter!"，Go 方法恒返回 Promise
});
```

两条最容易记混的入门规则先记住：

- **`Bind` 传的是 struct 实例（不是类型）**，Wails 只扫描它**首字母大写的公开方法**生成绑定。
- **v2 用 `Bind` + `wailsjs/go/...`；v3 换成 `Services` + `frontend/bindings/...`**，import 路径完全不同——别把两代写法混用（见 [v2 与 v3](./guide-line/v2-vs-v3)）。

## 五、心智地图：接下来读什么

- 想搞懂「单文件怎么打出来、WebView 怎么渲染」→ [架构](./guide-line/architecture)（Go 后端 + 系统 WebView + `embed.FS` + vs Tauri）。
- 想吃透 Go↔前端怎么通信 → [绑定与 Runtime](./guide-line/bindings-runtime)（`Bind`、自动 TS、事件、runtime 库）。
- 想了解 v3 的新东西以及能不能用 → [v2 与 v3](./guide-line/v2-vs-v3)（多窗口/系统托盘/Services，**仍 alpha 未 GA**）。
- 想把项目跑起来、发出去 → [构建与工程化](./guide-line/build)（CLI + `wails.json`）。
- 速记表在 [参考](./reference)。
