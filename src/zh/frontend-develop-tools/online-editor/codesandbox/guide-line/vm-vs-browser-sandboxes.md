---
layout: doc
outline: [2, 3]
---

# VM 沙箱 vs 浏览器沙箱

> 基于 codesandbox.io/docs 2025–2026 现状编写

## 速查

- **CodeSandbox 当前 taxonomy = VM Sandboxes + Browser Sandboxes 两类**（不是「Sandboxes / Devboxes / CDE 三产品线」——那是历史营销叙事，别当现状）
- **VM Sandboxes（核心）**：服务端 **Firecracker microVM**，真 Linux 虚拟机，能跑任意语言 / 任意 Dockerfile / 原生二进制 / 连真实 Postgres·Redis·Mongo；可发起任意出站网络
- **Browser Sandboxes**：浏览器内执行环境（client-side），各框架专用 bundler 镜像其默认行为，断网仍可打包；不支持自定义 webpack / eject
- **vs StackBlitz WebContainers**：WebContainers 是**浏览器内 WASM** 微操作系统，受浏览器网络限制，**连不上 MongoDB/Redis/PostgreSQL 等需原始 TCP 的外部进程**（官方原话）；CodeSandbox VM 在服务端，无此限制
- **一句话记忆**：CodeSandbox VM = 「代码送云端真 VM 跑」（server-side）；WebContainers = 「Node.js 搬进浏览器跑」（client-side WASM）
- **性能（VM）**：从模板 fork **1–3s 就绪**；内存/磁盘快照 resume **0.5–2s**，磁盘快照 **5–20s**，归档 **20–60s**；克隆 VM 与快照 **< 2s**
- **持久化**：休眠建内存快照，**磁盘保留至多 7 天**，超时或紧张则**归档到长期存储**（恢复更慢但保留完整状态）
- ⚠️ 别把「CodeSandbox 整体」说成 client-side——只有 Browser Sandboxes / Sandpack 是浏览器内

## 当前 taxonomy：两类沙箱，不是三产品线

写 CodeSandbox 最容易踩的坑，是沿用旧资料里「Sandboxes / Devboxes / CDE 三条产品线」的说法。

::: warning 「Devbox / CDE」是历史营销叙事
当前官网、文档、定价都把所有沙箱**统一分两类**：**VM Sandboxes** 与 **Browser Sandboxes**。早期被大力宣传的 "Devboxes"（每分支自动拉起的协作云开发环境 / CDE）已并入 VM Sandboxes 的能力——持久化、Git/GitHub 集成、Live 协作都还在，只是不再作为独立 SKU 命名。"Instant Cloud Development Environments / CDE" 是历史定位，现整体被「为规模而生的沙箱 + SDK」叙事覆盖。
:::

下文按当前 taxonomy 展开两类沙箱。

## VM Sandboxes：服务端 Firecracker microVM

VM Sandbox 是 CodeSandbox 当前的核心，每个都是一台跑在 **Firecracker microVM**（AWS 开源的轻量级虚拟化技术）上的隔离 Linux 虚拟机。它提供：

- **完整隔离 + 虚拟化环境**：真实 Linux 用户态，不是转译、不是模拟。
- **跨会话持久化文件存储**：文件在会话之间保留。
- **Hibernation（休眠）与 Resume（恢复）并完整保留状态**：基于整机内存快照。
- **安全 host URL**：把沙箱内监听的端口（public 或 private）暴露出来提供服务。
- **广泛语言与框架支持**：因为是真 VM，可跑**任意 Dockerfile**、原生二进制。

正因为它在服务端真 VM 里跑，它能做浏览器内方案做不到的事：

- **连真实数据库**：直接连真实的 Postgres / Redis / MongoDB 进程。
- **发起任意出站网络**：服务端 VM 不受浏览器跨域 / TCP 限制。
- **跑原生二进制**：VM 内即 Linux 用户态，无需先移植到 WASM。

启动特性：从模板 fork → **1–3 秒就绪**；SDK 创建的就是这类沙箱（见「SDK 与 Sandpack」）。

## Browser Sandboxes：浏览器内打包器

Browser Sandbox 是 CodeSandbox 早期「浏览器内打包器」形态的延续：

- 代码在 CodeSandbox **内置的浏览器执行环境**中评估运行（**client-side，浏览器内**），**断网后仍能继续打包**。
- 每个 Browser Sandbox 自带专用 bundler，针对特定框架配置并**模拟其官方 CLI 的行为**。
- 但它**不是一比一实现**——只镜像框架的默认行为，因此**不支持自定义 webpack 配置 / eject** 等高级配置。

适合：快速原型、分享前端代码片段。需要真实后端 / 数据库 / 自定义构建时，要用 VM Sandbox。

::: tip 编辑器对两类沙箱一致
无论 VM 还是 Browser Sandbox，编辑都跑在 **VS Code for the web**（网页版 VS Code）上，另有官方 VS Code 扩展。差异只在「代码在哪里、由什么执行」。
:::

## 核心对比：CodeSandbox VM vs StackBlitz WebContainers

这是两者最核心、最易考、最易被搞混的对比点。CodeSandbox 的 VM Sandboxes 跑在**服务端**，StackBlitz 的 WebContainers 跑在**浏览器内**——一切差异都由此而来。

| 维度         | CodeSandbox（VM Sandboxes / SDK）            | StackBlitz（WebContainers）                       |
| ------------ | -------------------------------------------- | ------------------------------------------------- |
| 执行位置     | **服务端**，远程 Firecracker microVM 内      | **客户端**，完全在浏览器标签页内（WASM 微操作系统）|
| 底层技术     | Firecracker microVM（真 Linux 虚拟机）       | 基于 WebAssembly 的微操作系统，浏览器内 Node 运行时 |
| 能跑什么     | 任意语言 / 任意 Dockerfile / 原生二进制 / 真实数据库进程 | 以 Node.js 为主；经 WASI 可跑 Python、jq 等被移植到 WASM 的工具 |
| 网络能力     | **可发起任意出站网络 / 连真实 Postgres·Redis·Mongo** | **受浏览器网络能力限制**，连不上 MongoDB/Redis/PostgreSQL 等需原始 TCP 的外部进程 |
| 原生二进制   | 支持（VM 内即 Linux 用户态）                 | 不支持，必须先移植到 WASM                         |
| 算力来源     | 云端服务器（按 VM 运行时长 / credits 计费）  | 用户本地 CPU（无远程服务器成本）                  |
| 冷启动       | 从模板 fork ~1–3s；快照 resume 0.5–2s        | 毫秒级 boot（无需联服务器即可跑）                 |
| 浏览器兼容   | 任意浏览器（仅需展示 VS Code Web，算力在云端）| Chrome/Chromium 完整；Firefox/Safari beta/部分支持 |
| 离线/断网    | VM 在云端，断网即断（Browser Sandbox 例外）  | 浏览器内运行，断网后本地仍可跑                    |

::: tip 一句话记忆
**CodeSandbox VM** = 「把代码送到云端**真 VM** 跑」（server-side），能力强、可连真实后端 / 数据库 / 二进制；**WebContainers** = 「把 Node.js 搬进**浏览器**跑」（client-side WASM），快、零服务器成本，但受浏览器沙箱限制。
:::

WebContainers 的网络限制是 StackBlitz 官方原话：「We're limited by the browser's ability to make network requests, so connecting to processes like MongoDB, Redis, PostgreSQL, etc. are not possible.」——这正是「需要真实数据库 / 真后端就选 CodeSandbox」的根本原因。

::: warning WebContainers 也能跑 Python，别说「只能跑 JS」
WebContainers 自 2023 年起经 **WASI** 支持 Python、jq 等原生语言 / 工具，但它们仍是**浏览器内 WASM**、仍受网络限制（连不上外部 Postgres/Redis/Mongo），不是远程 VM。「能跑 Python」和「能连真实数据库」是两回事。
:::

## 性能与持久化分层

VM Sandbox 的性能卖点都围绕「快照」。**恢复速度取决于状态持久化到哪一层**：

| 持久化层级       | 恢复时间   | 说明                           |
| ---------------- | ---------- | ------------------------------ |
| 内存/磁盘快照    | **0.5–2 秒** | 最快，刚休眠不久的沙箱         |
| 磁盘快照         | **5–20 秒**  | 内存快照已释放，从磁盘恢复     |
| 归档             | **20–60 秒** | 已归档到长期存储，恢复最慢     |

其余关键数字：从模板 fork **1–3 秒就绪**；克隆 VM 与快照 **< 2 秒**；快照恢复 **< 1 秒**（内存层）。

**默认持久化策略**：

- 会话结束休眠时建**内存快照**，**休眠沙箱在磁盘保留至多 7 天**。
- 超过 7 天或磁盘紧张时，会**归档到长期存储**——归档恢复更慢，但仍**保留完整状态**。

::: tip 托管持久化：降本提速的推荐做法
官方推荐对高频场景把工作区数据持久化到 **Git / 数据库**：会话结束直接删除沙箱，恢复时从 Template 重建 + 拉回数据。这样减少对长期 VM 快照的依赖，省存储又快——见「SDK 与 Sandpack」的生命周期一节。
:::

## 选型一句话

- **要真实执行不受信任代码、连真实数据库、跑原生二进制 / 任意 Dockerfile，或要编程式高并发管理 VM** → CodeSandbox（VM Sandboxes / SDK）。
- **要极致冷启动、零服务器成本、离线可跑，且主要是前端 / Node.js、不碰真实数据库** → StackBlitz（WebContainers）。
- **只是网页内联一段可运行示例** → CodeSandbox 的开源组件 **Sandpack**（浏览器内，见下一章），或 StackBlitz embed。
