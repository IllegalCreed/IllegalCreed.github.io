---
layout: doc
outline: [2, 3]
---

# Neutralino vs Electron / Tauri / Wails

> 基于 Neutralino v6.x · 核于 2026-07

## 速查

- **一句话定位**：几者中**后端最简、产物最小**（纯 C++ 内核 + 系统 WebView，无 Node/Rust/Go 运行时），但功能/生态/成熟度最弱
- **渲染**：Neutralino / Tauri / Wails 都用**系统 WebView**；**Electron 捆绑 Chromium**（换一致性，代价是体积）
- **后端运行时**：Neutralino **极薄 C++ 内核（无额外运行时）** / Electron Node.js / Tauri **Rust** / Wails **Go**
- **体积**：Neutralino **最小（Hello World <2MB）** ＜ Tauri ≈ Wails ≪ Electron（150–200MB 级）
- **权限模型**：Tauri **最强（显式 capability、默认拒绝）**；Neutralino 靠 `tokenSecurity` + 白/黑名单**手动收紧**（弱于 Tauri）
- **学习门槛**：Neutralino 前端纯 JS、门槛最低；Tauri 要碰 Rust、Wails 要碰 Go
- **共同坑**：凡用系统 WebView 的（含 Tauri/Wails）都要吃**各平台 WebView 一致性**差异
- **选型**：极简/小工具/内部工具/体积敏感 → Neutralino；生态/桌面重应用 → Electron；性能+安全+新项目综合首选 → Tauri（2026 主流评测多列它首选）

## 一、横向对比

| 维度 | **Neutralino** | Electron | Tauri | Wails |
| --- | --- | --- | --- | --- |
| 渲染 | 系统 WebView | **捆绑 Chromium** | 系统 WebView | 系统 WebView |
| 后端/运行时 | **极薄 C++ 内核，无额外运行时** | Node.js + Chromium | Rust | Go |
| 后端语言 | C++（核心） | JS / C++ / ObjC | Rust | Go |
| 典型体积 | **最小，HelloWorld <2MB** | 150–200MB | 比 Electron 小得多 | 类 Tauri（Go） |
| 空闲内存 | 低（依系统 WebView） | 较高（200–400MB） | 低 | 低 |
| 权限模型 | allow/block list（手动收紧） | 无强制 | **显式 capability，默认拒绝** | 有 |
| 生态/成熟度 | 较小众（≈8.5k star） | **最成熟、生态最大** | 快速增长、社区大 | 中等 |
| 前端门槛 | **纯 JS，最低** | 纯 JS | 需碰 Rust | 需碰 Go |

## 二、vs Electron

- **Electron 捆绑 Chromium + Node.js**：渲染行为跨平台高度一致、生态与文档最成熟、能力最全——但产物 **150–200MB 级**、空闲内存偏高。
- **Neutralino 走反方向**：用系统 WebView、极薄 C++ 后端，产物 **<2MB**、无 Node 运行时。代价是能力/生态远不及 Electron，且要吃系统 WebView 差异。
- **怎么选**：要生态、要「装了就跟开发机一模一样」的一致性、做重型桌面应用 → Electron；要极致小体积、简单工具、能接受系统 WebView 差异 → Neutralino。

## 三、vs Tauri

Tauri 是 Neutralino 最直接的对照——**同样用系统 WebView，同样主打小体积**，区别在后端与安全：

- **后端运行时**：Tauri 用 **Rust**（性能强、内存安全，但要学 Rust）；Neutralino 是**纯 C++ 内核、无额外运行时**，前端开发者**不用碰 Rust**。
- **权限模型**：Tauri 有**显式 capability、默认拒绝**的强安全模型；Neutralino 只有 `tokenSecurity` + 白/黑名单，靠**手动收紧**，安全上限低于 Tauri。
- **生态与定位**：Tauri 社区更大、增长更快；**2026 年主流评测多把 Tauri 列为新项目综合首选**，Neutralino 是「更轻但更简」的补充选项。
- **怎么选**：要更强的安全模型/性能、且团队能接受 Rust → Tauri；要更低门槛、更小产物、纯 JS 心智 → Neutralino。

## 四、vs Wails（及 NW.js）

- **Wails**：用 **Go** 作后端 + 系统 WebView，体积与内存与 Tauri 同量级；适合 Go 团队。相比之下 Neutralino 后端更薄（C++ 内核、无运行时），且**前端开发者无需学 Go**。
- **NW.js**：与 Electron 同路线（捆绑 Chromium + Node.js），体积大；Neutralino 在体积/运行时上全面更轻。

## 五、优点总结

- **后端最简、产物最小**：无 Rust/Go/Node，纯 C++ 内核 + 系统能力，Hello World 压缩后约 0.5MB。
- **门槛最低**：前端纯 JS/HTML/CSS，兼容任意前端框架。
- **可扩展**：Extensions 允许用**任意语言**补后端（见[原生 API 与扩展](./api-extensions)），不必重编框架。

## 六、代价与现状（如实）

- **功能/生态/成熟度弱于 Electron、Tauri**；社区较小众（GitHub ≈8.5k star）。
- **依赖系统 WebView 一致性**：各平台 WebView 版本/行为差异是常见坑（Tauri/Wails 同样有）。
- **安全模型偏弱**：无「默认拒绝」的显式权限体系，靠 `tokenSecurity=one-time` + 白/黑名单手动收紧（见 [CLI、配置与运行模式](./cli-config-modes)）。
- **无原生 UI 组件**：界面全在 WebView 里画。

## 七、适用场景 / 选型建议

- **选 Neutralino**：极简工具、内部工具、对包体积极度敏感、团队只想写 JS、不需要原生 UI 组件的场景。
- **选 Tauri**：既要小体积又要强安全/性能、团队能接受 Rust——2026 新项目综合首选。
- **选 Electron**：需要最成熟生态、跨平台渲染绝对一致、做重型桌面应用。
- **选 Wails**：后端团队是 Go，想要类 Tauri 的体积与内存。

> 一句话：**Neutralino 是「更轻但更简」的那一档**——用最小的产物和最低的门槛换取相对有限的能力与安全上限。
