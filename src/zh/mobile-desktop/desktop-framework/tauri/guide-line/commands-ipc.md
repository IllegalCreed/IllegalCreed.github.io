---
layout: doc
outline: [2, 3]
---

# Tauri 命令与 IPC 通信

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **IPC 基石**：**异步消息传递**——前后端序列化收发请求/响应，比共享内存安全（Core 可判定并丢弃恶意请求）
- **两种原语**：**Commands**（前端→Rust，**有返回值**，像 `fetch`）和 **Events**（一次性、fire-and-forget、单向广播、双向可发）
- **定义命令**：`#[tauri::command] fn foo(...) -> T {}`；注册 `.invoke_handler(tauri::generate_handler![foo, bar])`
- **前端调用**：`import { invoke } from '@tauri-apps/api/core'; await invoke('foo', { arg })`；错误进 `.catch`
- **参数命名**：Rust `snake_case` ↔ 前端默认 `camelCase`；可 `#[tauri::command(rename_all = "snake_case")]` 改
- **错误处理**：返回 `Result<T, E>`（E 实现 `Serialize`，常用 `thiserror`）→ 前端 `.catch`
- **async 命令**：`async fn` 在独立线程跑不阻塞 UI；**禁用借用参数**（`&str`/`State<'_,T>`），返回可包 `Result<T, ()>`
- **上下文注入**：直接写进参数——`AppHandle`、`WebviewWindow`、`State<'_, T>`、`Channel<T>`
- **pub 规则**：`lib.rs` 内命令**不能 `pub`**；拆到独立模块（`commands.rs`）时**必须 `pub`**
- **Event**：Rust `use tauri::Emitter; app.emit("ev", payload)` / `emit_to("label", ...)`；前端 `listen`/`once`，**务必 `unlisten` 清理**
- **Channel**（高吞吐/有序流）：Rust `Channel<T>.send(...)`；前端 `new Channel()` 作 `invoke` 参数传入
- **State**：`.manage(Mutex::new(state))` 注册；命令内 `State<'_, Mutex<T>>` 取，命令外 `app.state::<...>()`（需 `use tauri::Manager`）

## 一、IPC 概览：为什么是异步消息传递

Tauri 的前后端通信（IPC）建立在**异步消息传递（Asynchronous Message Passing）** 之上：前端与 Rust Core 之间收发的是**序列化后的请求/响应**，而不是共享内存。这样做更安全——Core 收到消息后可以先判定，恶意或非法请求可以**直接丢弃不执行**。

IPC 提供两种原语，用途泾渭分明：

| | Commands | Events |
| --- | --- | --- |
| 模型 | 类 FFI / JSON-RPC，前端调后端**并拿返回值** | 一次性、fire-and-forget、单向广播 |
| API | `invoke('cmd', args)`（像 `fetch`） | `emit` / `listen` |
| 方向 | 前端 → Rust | 双向（前端和 Core 都能 emit） |
| 约束 | 参数/返回须 **JSON 可序列化** | 适合小数据、生命周期/状态变更 |
| 高吞吐 | 大数据用 `ipc::Response`（跳过 JSON）或 **Channel** | 大数据/流式用 **Channel** |

## 二、Command：前端调 Rust 拿返回值

**Rust 侧**用 `#[tauri::command]` 把普通函数暴露给前端：

```rust
// 参数默认 camelCase；用 rename_all 可改成 snake_case
#[tauri::command(rename_all = "snake_case")]
fn process_data(user_input: String) {
    // ...
}
```

**前端侧**用 `invoke` 调用，返回 Promise：

```javascript
import { invoke } from '@tauri-apps/api/core';

// invoke('命令名', { 参数对象 })，参数键默认 camelCase
invoke('process_data', { userInput: 'hello' });
```

命令必须在 Builder 里注册才能被调用：

```rust
tauri::Builder::default()
    // generate_handler! 收集所有暴露给前端的命令
    .invoke_handler(tauri::generate_handler![process_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## 三、错误处理与 async 命令

**错误处理**：命令返回 `Result<T, E>`，其中错误类型 `E` 需实现 `Serialize`（实践中常用 `thiserror`）；前端在 `.catch` 里拿到：

```rust
#[tauri::command]
fn login(user_name: String, pass_word: String) -> Result<String, String> {
    if user_name == "tauri" && pass_word == "tauri" {
        Ok("logged_in".into())
    } else {
        Err("invalid credentials".into()) // 前端 .catch 收到
    }
}
```

```javascript
import { invoke } from '@tauri-apps/api/core';

invoke('login', { userName: 'tauri', passWord: 'tauri' })
  .then((r) => console.log(r))
  .catch((e) => console.error(e)); // 错误在这里
```

**async 命令**：标 `async fn` 会在独立线程执行，**不阻塞 UI**，适合网络/IO：

```rust
#[tauri::command]
async fn fetch_remote(url: String) -> Result<String, String> {
    reqwest::get(&url).await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())
}
```

> **async 命令的关键限制**：**不能用借用类型作参数**（如 `&str`、`State<'_, T>`）——要么改用 owned 类型（`String`），要么把返回包成 `Result<T, ()>` 以满足生命周期要求。

## 四、上下文注入、注册与 pub 规则

命令函数可以**直接把 Tauri 上下文写进参数**，Tauri 会自动注入：

- `tauri::AppHandle`——应用句柄，可发事件、取状态、开窗口。
- `tauri::WebviewWindow`——调用来源的窗口。
- `tauri::State<'_, T>`——托管的全局状态。
- `tauri::ipc::Channel<T>`——高吞吐流式通道（见第六节）。

两个高频坑：

- **大二进制返回**：走 JSON 序列化很慢，改用 `tauri::ipc::Response::new(bytes)` 直接返回字节，跳过 JSON。
- **命令的 `pub` 规则**：写在 `lib.rs` 里的命令**不能标 `pub`**；一旦拆到独立模块（如 `commands.rs`）里，就**必须标 `pub`**，否则 `generate_handler!` 找不到。

## 五、Event：Rust 向前端广播

Event 适合**单向、一次性、小数据**的通知（进度、生命周期、状态变更）。Rust 侧发事件需要引入 `Emitter` trait：

```rust
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn download(app: AppHandle, url: String) {
    app.emit("download-started", &url).unwrap();          // 全局广播
    for p in [1, 15, 50, 80, 100] {
        app.emit("download-progress", p).unwrap();
    }
    app.emit_to("main", "download-finished", &url).unwrap(); // 定向某 webview
}
```

前端监听，**组件卸载时务必 `unlisten` 清理**：

```typescript
import { listen, once } from '@tauri-apps/api/event';

const unlisten = await listen<{ url: string }>('download-started', (e) => {
  console.log(e.payload.url);
});
once('ready', (e) => {}); // 只触发一次
// 组件卸载时： unlisten();
```

> `emit` 是全局广播，`emit_to` / `emit_filter` 是定向；**定向事件不会触发全局监听器**。复杂场景也可用 `WebviewWindow::eval("js code")` 直接执行 JS。

## 六、Channel：高吞吐、有序的流式通道

当需要**高频、大数据、保序**地从 Rust 推送到前端（如下载进度流、逐帧数据）时，用 **Channel**——它比 Event 更快且有序。

```rust
use tauri::ipc::Channel;
use serde::Serialize;

// 用带 tag 的枚举描述流式事件
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum DownloadEvent<'a> {
    Started { url: &'a str, download_id: usize, content_length: usize },
    Progress { download_id: usize, chunk_length: usize },
    Finished { download_id: usize },
}

#[tauri::command]
fn download(url: String, on_event: Channel<DownloadEvent>) {
    on_event.send(DownloadEvent::Started {
        url: &url, download_id: 1, content_length: 1000,
    }).unwrap();
    // ... 循环 send Progress / Finished
}
```

前端**创建 `new Channel()` 对象、作为参数传入 `invoke`**：

```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onEvent = new Channel();
onEvent.onmessage = (m) => console.log(m.event);

// Channel 对象作为普通参数传给命令
await invoke('download', { url: '...', onEvent });
```

## 七、State：状态管理

跨命令共享数据（配置、DB 连接、计数器）用 Tauri 的**托管状态**：`.manage(T)` 注册，命令内用 `State<'_, T>` 取。

```rust
use std::sync::Mutex;
use tauri::{Builder, Manager, State};

#[derive(Default)]
struct AppState { counter: u32 }

// 可变状态用 Mutex 包住
#[tauri::command]
fn increase(state: State<'_, Mutex<AppState>>) -> u32 {
    let mut s = state.lock().unwrap();
    s.counter += 1;
    s.counter
}

fn main() {
    Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default())); // 注册状态
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![increase])
        .run(tauri::generate_context!())
        .unwrap();
}
```

- `.manage(T)` 每种类型只能注册一个实例；命令内用 `State<'_, T>` 取。
- **可变状态**：用 `std::sync::Mutex`（同步）或 `tokio::sync::Mutex`（async 场景 `state.lock().await`，命令须返回 `Result`）。
- **命令外访问**（事件处理器、子线程等）：`app_handle.state::<Mutex<AppState>>()`，需 `use tauri::Manager`。

> 同理，取窗口用 `app.get_webview_window("main")`（也需 `use tauri::Manager`）。**记住两个 trait**：发事件要 `Emitter`，取状态/取窗口要 `Manager`。

## 八、两种 IPC 模式与下一步

IPC 之上还有两种**模式（Pattern）**：

- **Brownfield（默认）**：无额外隔离，依赖少、信任供应链时用，性能最好。
- **Isolation（隔离，官方推荐尽量用）**：在前端与 Core 之间注入沙箱 iframe 拦截并校验 IPC——详见[分发与安全加固](./distribute)。

命令能被调用，前提是对应权限被授予——这正是 v2 的 **ACL 权限体系**要解决的，见[权限系统 ACL](./permissions)。
