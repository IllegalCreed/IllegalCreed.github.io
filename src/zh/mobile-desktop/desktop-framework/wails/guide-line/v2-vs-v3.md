---
layout: doc
outline: [2, 3]
---

# Wails v2 与 v3

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- **一句话**：v3 把 v2 的「**单窗口 + 声明式 API**」大改为「**多窗口 + 过程式 API**」；入口从 `wails.Run(options)` 变为 `application.New(options)` + `app.Run()`
- **⚠️ v3 仍 alpha、未 GA**：最新 `v3.0.0-alpha2.111`（2026-07），所有 release 标 `prerelease`，**无 Beta/正式版时间表**；**生产请用 v2.12**，v3 仅尝鲜
- **CLI**：v2 是 **`wails`**、v3 是 **`wails3`**（可共存）；包路径 `/v2/` vs `/v3/`
- **Go 版本**：v2 需 **Go 1.21+**，v3 需 **Go 1.25+**
- **暴露 Go**：v2 `Bind: []interface{}{app}` → v3 `Services: []application.Service{ application.NewService(&Svc{}) }`
- **窗口**：v2 单窗口 → v3 **多窗口** `app.Window.NewWithOptions(...)`（头号新特性）
- **新增**：v3 带**系统托盘**（`app.SystemTray`）、Manager API（`app.Window/Menu/Event/Dialog...`）、**事件 Hook 可取消**、WML（HTML 属性调 runtime）
- **绑定生成**：v2 `wails generate module` → `wailsjs/go/...`；v3 `wails3 generate bindings` → `frontend/bindings/...`，按 **`$Call.ByID(hash)`** 调用，前端 import 路径不同
- **构建**：v2 黑盒 CLI → v3 **Taskfile 编排**（`Taskfile.yml`），`wails3 build` 只是薄封装
- **实验特性（成熟度待核）**：v3 的 Mobile(iOS/Android)、LLM Control(MCP)、Server Build 等均 alpha 期，API 会变

## 一、v3 是什么，现在能用吗

v3 是 Wails 的下一代大版本，**架构与 API 全面重写**。最重要的前提先说清楚：

> **v3 截至 2026-07 仍是 alpha、尚未 GA**。最新版本为 `v3.0.0-alpha2.111`（2026-07-01），GitHub 上所有 v3 release 都标记为 `prerelease`。官方口径是「API 已相对稳定、已有应用跑在生产，但仍在打磨文档与工具链」，路线图目标是**先到 Beta**，**没有公开的正式版时间表**。

结论：**生产项目请用稳定的 v2.12**；v3 适合尝鲜、预研、跟进新特性，但不要押生产。

> 版本号小坑：v3 的 alpha 编号在 2026-06 从 `alpha.102` 起步了 `alpha2` 子序列（如 `alpha2.111`），别把 `alpha.96` 和 `alpha2.111` 当成同一序列比大小。

## 二、核心变化：声明式 → 过程式

v2 的心智是「**填一个 options 结构体，`wails.Run` 一把启动单窗口**」；v3 改为「**`application.New` 建 app，再用一组 Manager 过程式地建窗口、菜单、托盘**」。

```go
// v2：声明式、单窗口
err := wails.Run(&options.App{
    Title: "My App", Width: 1024, Height: 768,
    AssetServer: &assetserver.Options{Assets: assets},
    Bind:        []interface{}{app}, // 暴露 Go
})
```

```go
// v3：过程式、多窗口（alpha，API 可能再变）
import "github.com/wailsapp/wails/v3/pkg/application"

app := application.New(application.Options{
    Name: "My App",
    Services: []application.Service{ // 取代 v2 的 Bind
        application.NewService(&GreetService{}),
    },
    Assets: application.AssetOptions{Handler: application.AssetFileServerFS(assets)},
})
// 可建任意多个独立窗口
app.Window.NewWithOptions(application.WebviewWindowOptions{
    Title: "Win1", Width: 1024, Height: 768,
})
app.Run()
```

`app` 下挂一组 **Manager**：`app.Window`、`app.Menu`、`app.SystemTray`、`app.Event`、`app.Dialog`、`app.Clipboard` 等（官方称「Manager API」）。

## 三、Services：取代 Bind 的一等公民

v3 用 **Service** 取代 v2 的 `Bind`。Service 就是普通 Go struct，公开方法自动暴露给前端，但多了**生命周期接口**：

```go
type GreetService struct{ prefix string }

func (g *GreetService) Greet(name string) string { return g.prefix + name + "!" }

// 可选实现生命周期：ServiceStartup 返回 error 会中止整个应用启动
func (g *GreetService) ServiceStartup(ctx context.Context, o application.ServiceOptions) error { return nil }
func (g *GreetService) ServiceShutdown() error { return nil }

// 注册（也可运行时 app.RegisterService(svc)）
application.New(application.Options{
    Services: []application.Service{
        application.NewService(&GreetService{prefix: "Hello, "}),
    },
})
```

Service **按注册顺序启动、逆序关闭**；`ServiceStartup` 返回 error 则整个应用启动中止。

## 四、多窗口与系统托盘（v3 新增）

- **多窗口（头号新特性）**：`app.Window.NewWithOptions(...)` 可建任意多个独立窗口，各自配大小/位置/内容；`win.SetURL('/')` 载内嵌页、`win.SetURL('https://...')` 载外部 URL、`win.Center()` 居中。v2 是单窗口，这是最大架构差异。
- **系统托盘（System Tray）**：`app.SystemTray.New()` → `SetIcon/SetDarkModeIcon/SetTemplateIcon`（macOS 模板图标）、`SetMenu(menu)`、`AttachWindow(win).WindowOffset(5)`（点托盘弹出窗口、失焦自动隐藏）；配 `MacOptions.ActivationPolicy: ActivationPolicyAccessory` 可做纯托盘应用。

## 五、事件系统增强

v3 的事件更成体系，且新增**可取消的 Hook**：

- 自定义事件：`app.Event.On('myevent', func(e *application.CustomEvent){...})`。
- 应用/系统事件：`app.Event.OnApplicationEvent(events.Mac.ApplicationDidFinishLaunching, ...)`；**跨平台通用事件** `events.Common.ApplicationStarted` / `events.Common.WindowFocus` 让你写一套跨平台逻辑。
- 窗口事件：`win.OnWindowEvent(events.Common.WindowFocus, ...)`。
- **事件 Hook（可取消，`On` 做不到）**：

```go
// 关窗前弹确认框——Hook 能同步取消，普通 On 不能
win.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
    e.Cancel()
})
```

## 六、绑定生成与构建系统

- **绑定生成**：v3 用**静态分析器** `wails3 generate bindings`，速度更快且**保留注释与参数名**；生成物在 `frontend/bindings/<完整 go import 路径>/`，方法按**哈希 ID** 调用（`$Call.ByID(...)`）。前端 import 路径与 v2 完全不同：

```js
// v3：具名 import service（对比 v2 的 wailsjs/go/main/App）
import { GreetService } from "../bindings/changeme";
const result = await GreetService.Greet(name); // 仍是 Promise + try/catch
```

- **构建系统**：v2 构建是黑盒、难定制；v3 改用 **Taskfile（`Taskfile.yml`）**编排图标生成、manifest、前端构建等步骤，`wails3 build` 只是薄封装，可完全自定义流程（详见[构建与工程化](./build)）。

## 七、逐项对照表

| 维度 | v2（稳定） | v3（alpha，未 GA） |
| --- | --- | --- |
| 入口 | `wails.Run(&options.App{...})` | `application.New(...)` + `app.Run()` |
| 包路径 | `wails/v2/...` | `wails/v3/pkg/application` |
| CLI | `wails` | `wails3` |
| Go 版本 | 1.21+ | 1.25+ |
| 暴露 Go | `Bind: []interface{}{app}` | `Services: []application.Service{NewService(&Svc{})}` |
| 窗口 | 单窗口（options 里配） | **多窗口** `app.Window.NewWithOptions(...)` |
| 菜单 | `menu.NewMenu()` + `menu.Append(...)` | `app.NewMenu()` + `AddSubmenu(...).Add(...).OnClick(...)` |
| 对话框 | `runtime.OpenFileDialog(ctx, opts)` | `app.Dialog.OpenFileWithOptions(opts).PromptForSingleSelection()` |
| 退出 | `runtime.Quit(ctx)` | `app.Quit()` |
| 绑定生成 | `wails generate module` → `wailsjs/go/...` | `wails3 generate bindings` → `frontend/bindings/...`（ByID） |
| 构建 | 黑盒 CLI | Taskfile 编排 |
| 系统托盘 | 无 | **`app.SystemTray`** |

迁移主线：改 `go.mod` 依赖 → 重写 `main.go`（`New` + `Services` + `Window`）→ 迁移 menu/dialog/runtime 调用 → `wails3 generate bindings` 重生成前端绑定。

## 八、v3 实验特性（成熟度待核）

v3 还带来一批实验能力，**均处 alpha 期、API 与稳定性会变，尝鲜前请查官方最新状态**：

- **WML（Wails Markup Language）**：用纯 HTML 属性调 runtime（类 htmx），如 `<button wml-window="Minimise">`、`wml-confirm="确定？"`，页面可零 JS。
- **移动端**：v3 文档含 Mobile（iOS/Android）板块——与桌面是否同级成熟**待核**。
- **实验区**：`Wake`、**LLM Control（MCP）**（让 LLM 控制应用）、`Server Build`。

> 一句话收尾：**v3 很值得关注，但今天做生产桌面应用，答案仍是 v2.12。**
