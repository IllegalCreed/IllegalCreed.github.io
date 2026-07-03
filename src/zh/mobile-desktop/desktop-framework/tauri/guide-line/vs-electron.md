---
layout: doc
outline: [2, 3]
---

# Tauri 对比 Electron 与 Wails

> 基于 Tauri 2.x · 核于 2026-07

## 速查

- **vs Electron 一句话**：Tauri **不打包 Chromium/Node、复用系统 WebView + Rust 后端**，包更小（<600KB~10MB vs 100MB+）、内存更低、攻击面更小；Electron **自带 Chromium**，渲染一致、生态最全、纯 JS 后端上手快
- **渲染引擎**：Tauri=系统 WebView（Win=WebView2 / mac·iOS=WKWebView / Linux=WebKitGTK）；Electron=**打包 Chromium**（各端一致）
- **后端语言**：Tauri=**Rust**（移动可 Swift/Kotlin）；Electron=**Node.js**（纯 JS/TS）
- **安全信任边界**：Tauri **业务逻辑全留 Rust Core**、前端只能经 IPC + ACL 细粒度权限；Electron 的 renderer 可开 Node 集成，攻击面更大
- **移动端**：Tauri v2 **支持 iOS/Android**；Electron **不支持**
- **vs Wails**：Wails 也走「系统 WebView + 原生后端」轻量路线，但后端是 **Go**、**桌面为主（无官方移动端）**、生态较 Tauri/Electron 小
- **选型**：要极小体积/低内存/移动端/纵深安全 → **Tauri**；要渲染绝对一致/最全生态/纯前端团队 → **Electron**；已是 Go 技术栈、只做桌面 → **Wails**
- **标杆应用**：Tauri —— **Hoppscotch、AppFlowy**（及 awesome-tauri 生态）

## 一、Tauri vs Electron 全维度对照

| 维度 | Tauri v2 | Electron |
| --- | --- | --- |
| 后端语言 | **Rust**（+ 移动可 Swift/Kotlin） | Node.js（纯 JS/TS） |
| 渲染引擎 | **系统 WebView**（Win=WebView2 / mac=WKWebView / Linux=WebKitGTK） | **打包 Chromium** |
| 安装包 | 极小（<600KB~10MB） | 大（100MB+） |
| 内存 | 低（~50MB 级） | 高 |
| 渲染一致性 | 各 OS 有差异（WebView 内核不同） | **一致**（自带 Chromium） |
| 安全 | Rust 内存安全 + ACL 细粒度权限 + IPC 隔离 | 成熟但 Node 集成扩大攻击面 |
| 生态/成熟度 | 较新，增长快 | 老牌，生态最全 |
| 移动端 | **支持 iOS/Android** | 不支持 |
| 上手门槛 | 需懂 Rust（后端复杂逻辑） | 纯前端即可 |

## 二、核心差异详解

- **体积与内存**：Tauri 不把 Chromium/Node 塞进包里，直接用系统 WebView，所以安装包和内存都远小于 Electron——这是它最大的卖点，也是根本区别。
- **渲染一致性（反向权衡）**：正因为复用系统 WebView，Tauri 在不同 OS 上会遇到 WebView2（Chromium）与 WKWebView/WebKitGTK（WebKit）的差异，**必须多端测试**；Electron 自带同一版 Chromium，各端渲染一致——这是 Electron 的相对优势。
- **安全信任边界**：Electron 的 renderer 可开启 Node 集成，让前端直接摸文件系统，攻击面大；Tauri 把**业务逻辑全部留在 Rust Core**，前端只能经 IPC 请求，再叠加 **ACL 细粒度权限**（见[权限系统 ACL](./permissions)），信任边界更硬。
- **后端语言与团队**：Tauri 要求后端写 Rust（复杂逻辑），对纯前端团队有上手成本；Electron 纯 JS/TS，前端团队零迁移。

## 三、Tauri vs Wails

Wails 是**用 Go 写后端**的桌面应用框架，和 Tauri 走的是同一条「**复用系统 WebView + 原生编译后端**」的轻量路线——同样不打包 Chromium，因此也能产出体积很小的桌面应用，并把 Go 方法绑定给前端调用（概念上类似 Tauri 的 command）。

与 Tauri 的主要区别：

| 维度 | Tauri | Wails |
| --- | --- | --- |
| 后端语言 | **Rust** | **Go** |
| 渲染引擎 | 系统 WebView | 系统 WebView（同思路） |
| 体积 | 极小 | 同样很小 |
| 移动端 | **支持 iOS/Android** | **桌面为主，无官方移动端** |
| 生态/社区 | 较大、增长快 | 相对较小 |

一句话：**已是 Go 技术栈、只做桌面**，Wails 是自然选择；**要移动端、要更大生态或偏好 Rust**，选 Tauri。

## 四、如何选型

- **选 Tauri**：追求极小体积 / 低内存 / 需要 iOS·Android / 看重纵深安全（Rust + ACL）；团队能接受写 Rust。
- **选 Electron**：需要各平台**渲染绝对一致**（复杂图形/富文本编辑器）/ 想要最成熟最全的生态 / 团队是纯前端、要最低上手成本。
- **选 Wails**：团队已用 Go、只做桌面、想要轻量包体。

## 五、标杆应用

- **Tauri**：**Hoppscotch**（API 调试）、**AppFlowy**（Notion 替代）等，更多见 awesome-tauri 生态。
- **Electron**：VS Code、Slack、Discord 等重量级桌面应用，验证了其成熟度与一致性优势。

> 回到 Tauri 自身的架构原理，见[架构与进程模型](./architecture)；速查对照表见[参考](../reference)。
