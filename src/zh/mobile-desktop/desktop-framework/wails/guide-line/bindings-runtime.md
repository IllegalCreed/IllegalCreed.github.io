---
layout: doc
outline: [2, 3]
---

# Wails 绑定与 Runtime

> 基于 Wails v2.12（v3 alpha）· 核于 2026-07

## 速查

- **绑定入口（v2）**：`wails.Run(&options.App{ Bind: []interface{}{app} })`；传的是 **struct 实例**（非类型），Wails 扫其**首字母大写的公开方法**生成前端绑定；可绑多个 struct
- **自动生成物**：`wails dev` / `wails generate module` 在前端 `wailsjs/go/main/` 下生成 **`App.js`（JS 包装）+ `App.d.ts`（TS 声明）+ `models.ts`（入参/返回用到的 Go struct 的 TS 定义）**
- **前端调用**：`import { Greet } from '../wailsjs/go/main/App'`，`Greet('Peter').then(...)`——**恒返回 Promise**
- **Promise 语义**：Go 首个返回值 → `resolve`；若 Go **第二返回值是 `error` 且非 nil → `reject`**
- **类型自动转换**：Go↔JS 全自动，struct 也行（前端变成 JS class）；**约束**：struct 字段需合法 `json` tag 才进 TS；**不支持匿名嵌套 struct**
- **事件系统（双向对等）**：Go `runtime.EventsEmit/On/Once/Off`（首参恒 `ctx`）↔ JS `window.runtime.EventsEmit/On(...)`（无 ctx）；`On` 返回取消函数
- **runtime 库分类**：**Window / Menu / Dialog / Events / Browser / Log / Clipboard**；Go 侧 `pkg/runtime`（首参 `ctx`）、JS 侧 `window.runtime.*`
- **ctx 时机坑**：`OnStartup` 能拿 `ctx`，但窗口在另一线程初始化，**runtime 调用建议放 `OnDomReady`**
- **Linux 坑**：WebKit 装的信号处理器缺 `SA_ONSTACK`，需在可能 panic 处、每个 goroutine 里调 `runtime.ResetSignalHandlers()` 才能从 panic 恢复
- **v3 完全不同**：`Services` + `NewService` + `frontend/bindings/...` + `$Call.ByID(hash)`——见 [v2 与 v3](./v2-vs-v3)

## 一、方法绑定：Wails 的灵魂特性

绑定（Bind）是 Wails 最核心的能力——**让前端像调本地函数一样调 Go 方法**。v2 里通过 `wails.Run` 的 `Bind` 选项声明：

```go
// main.go
err := wails.Run(&options.App{
    // ...
    Bind: []interface{}{
        app,          // 传 struct 实例，非类型
        otherService, // 可绑多个
    },
})
```

- **传实例、不传类型**：`Bind` 收的是**已创建的 struct 实例**，Wails 扫描它**首字母大写的公开方法**生成前端绑定；小写（未导出）方法不会暴露。
- **多 struct 共享 ctx**：绑多个服务时，推荐在 `OnStartup` 里给每个实例 `SetContext(ctx)`，让它们都能调 runtime。
- **枚举绑定**：另有 `EnumBind` 选项，配合 `[]struct{ Value; TSName string }` 把 Go 枚举生成到前端 `models.ts`。

## 二、自动生成 TypeScript 绑定

`wails dev`（或手动 `wails generate module`）会在前端目录下生成一个 `wailsjs/` 目录：

```
frontend/wailsjs/
└─ go/
   └─ main/
      ├─ App.js      # 每个绑定方法的 JS 包装
      ├─ App.d.ts    # 对应的 TS 声明
      └─ models.ts   # 入参/返回用到的 Go struct 的 TS 定义
```

生成物包含三类：①所有绑定方法的 **JS 包装**；②对应的 **TS 声明（`.d.ts`）**；③作为入参或返回的 Go struct 的 **TS 定义（`models.ts`）**——返回的 struct 在前端会变成一个 JS class。

前端直接 `import` 调用：

```js
import { Greet } from "../wailsjs/go/main/App";

// 恒返回 Promise
Greet("Peter").then((result) => {
  console.log(result); // "Hello Peter!"
});
```

底层其实是调 `window['go']['main']['App']['Greet'](arg)`，`App.js` 只是它的封装。

**类型转换与约束：**

- **Go↔JS 类型全自动转换**，包括 struct。
- **约束一**：struct 字段必须有合法的 `json` tag 才会进 TS 模型。
- **约束二**：**不支持匿名嵌套 struct**——易踩，需拆成具名类型。

## 三、Promise 语义：错误怎么传到前端

绑定方法**恒返回 Promise**，其解析规则由 Go 方法的返回值决定：

- Go 方法的**第一个返回值** → Promise 的 **`resolve` 值**。
- 若 Go 方法的**第二个返回值是 `error` 且非 `nil`** → Promise **`reject`**（前端 `catch` 到）。

```go
// Go：第二返回值 error 非 nil 时，前端 Promise 会 reject
func (a *App) ReadFile(path string) (string, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return "", err // → 前端 .catch()
    }
    return string(data), nil // → 前端 .then()
}
```

```js
// 前端
import { ReadFile } from "../wailsjs/go/main/App";

try {
  const content = await ReadFile("/etc/hosts");
} catch (err) {
  // Go 返回的 error 到这里
}
```

## 四、事件系统：Go / JS 双向对等

除了「前端主动调 Go」，Wails 还提供一套**双向事件系统**用于「Go 主动通知前端」或反向。Go 侧走 `runtime.*`、JS 侧走 `window.runtime.*`，**方法一一对等**：

| 方法 | 作用 |
| --- | --- |
| `EventsOn(name, cb)` → 返回取消函数 | 注册监听 |
| `EventsOnce(name, cb)` | 只触发一次 |
| `EventsOnMultiple(name, cb, counter)` | 最多触发 counter 次 |
| `EventsEmit(name, ...data)` | 发射事件（可带数据） |
| `EventsOff(name, ...more)` / `EventsOffAll()` | 注销 / 全注销 |

关键差异是 **Go 侧首参恒为 `ctx`，JS 侧无 `ctx`**：

```go
// Go：发射事件，首参是 ctx
runtime.EventsEmit(a.ctx, "backend:tick", time.Now().Unix())
```

```js
// JS：监听 + 发射，无 ctx
import { EventsOn, EventsEmit } from "../wailsjs/runtime";

const cancel = EventsOn("backend:tick", (ts) => {
  /* 收到后端推送 */
});
EventsEmit("frontend:ready"); // 也可反向通知 Go
```

## 五、Runtime 库：调系统能力

runtime 库让你从代码里操作窗口与系统资源，分为 **Window / Menu / Dialog / Events / Browser / Log / Clipboard** 几类。Go 侧 `import "github.com/wailsapp/wails/v2/pkg/runtime"`（方法首参恒 `ctx`），JS 侧 `window.runtime.*`（无 ctx）。

常用方法：

- **窗口**：`WindowSetTitle(title)`、`WindowMinimise()`、`WindowMaximise/Unmaximise()`、`WindowFullscreen()`、`WindowShow/Hide()`、`WindowCenter()`；应用级 `Hide()/Show()/Quit()`。
- **对话框**：`OpenFileDialog(ctx, opts) (string, error)`、`SaveFileDialog(...)`、`MessageDialog(ctx, opts) (string, error)`（返回被点按钮的 label；macOS 最多 4 个按钮，可设 `DefaultButton`/`CancelButton`）。
- **剪贴板**：`ClipboardSetText(text) error` / `ClipboardGetText() (string, error)`。
- **环境**：`Environment()` 返回 `{ BuildType, Platform, Arch }`。

```go
// Go：弹一个消息对话框（首参 ctx）
result, _ := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
    Type:    runtime.QuestionDialog,
    Title:   "退出",
    Message: "确定要退出吗？",
})
```

## 六、两个必知的坑

- **ctx 调用时机**：`OnStartup` 里能拿到 `ctx` 并存下来，但**窗口在另一个线程初始化**，此刻调 runtime 可能过早——**runtime 调用建议放在 `OnDomReady`（等价于 body onload）**。生命周期顺序：`OnStartup`（返回 error 会终止应用）→ `OnDomReady` → `OnBeforeClose`（可拦截关闭）→ `OnShutdown`。
- **Linux 信号处理器**：Linux 上 WebKit 安装的信号处理器**没有 `SA_ONSTACK`**，导致 Go 无法从「nil 解引用」等 panic 中恢复。需在可能 panic 的代码前、**每个 goroutine 里**调用 `runtime.ResetSignalHandlers()`（仅 Linux 生效）。

> v3 的绑定与事件是**另一套 API**（`Services` + `NewService`、`app.Event.*`、`frontend/bindings/...` + `$Call.ByID(hash)`），与本页 v2 写法差异很大，见 [v2 与 v3](./v2-vs-v3)。
