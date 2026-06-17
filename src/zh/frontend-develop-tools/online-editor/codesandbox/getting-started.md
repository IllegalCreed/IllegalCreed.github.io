---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 codesandbox.io/docs 2025–2026 现状编写

## 速查

- **本质**：为规模而生的云沙箱平台，核心是服务端 **Firecracker microVM**，能编程式即时拉起隔离虚拟机执行代码
- **两类沙箱**：**VM Sandboxes**（虚拟机，核心，跑任意语言 / Dockerfile / 真实数据库）/ **Browser Sandboxes**（浏览器内打包器，原型与分享）
- **编辑器**：两类沙箱都跑在 **VS Code for the web**（网页版 VS Code），另有官方 VS Code 扩展
- **访问**：浏览器打开 <https://codesandbox.io> → 选模板 / 导入 GitHub 仓库即可新建
- **SDK**：`npm install @codesandbox/sdk`，在 <https://codesandbox.io/t/api> 建 token 设为 `CSB_API_KEY` → `new CodeSandbox(...)` 编程式管理沙箱
- **嵌入组件**：开源 **Sandpack**（`@codesandbox/sandpack-react`），网页内联实时代码示例（React 官方文档采用）
- **vs StackBlitz 一句话**：CodeSandbox = 「把代码送到云端**真 VM** 跑」（服务端，能连真实后端）；StackBlitz WebContainers = 「把 Node.js 搬进**浏览器**跑」（客户端 WASM，连不上外部数据库）
- ⚠️ **别搞混**：只有 Browser Sandboxes / Sandpack 是浏览器内运行；核心 VM Sandboxes / SDK 是**服务端 microVM**
- **文档**：<https://codesandbox.io/docs>

## 什么是 CodeSandbox

CodeSandbox 是一个**为规模而生的云沙箱平台**。官网首页一句话是「Sandboxes built for scale」，副标题点明了它今天的重心：**为 AI agent 与代码 playground 编程式拉起隔离沙箱、即时执行代码**。

它的核心不在浏览器里，而在云端：每个 **VM Sandbox** 都是一台跑在 **Firecracker microVM**（AWS 开源的轻量级虚拟化技术）上的隔离 Linux 虚拟机。这意味着它能做浏览器内方案做不到的事——跑任意语言、跑任意 Dockerfile、跑原生二进制、连真实的 Postgres / Redis / MongoDB。

::: tip 一句话定位
传统在线 IDE 把代码送到云端容器执行，CodeSandbox 也是这一路——但它把这台云端机器做成了「秒级拉起、秒级休眠恢复、可编程式批量管理」的 microVM，专为 **AI agent 执行不受信任代码**与高并发调用而生。
:::

CodeSandbox 2017 年于阿姆斯特丹成立，早期是「在浏览器里跑的打包器」，主打前端代码的快速分享（与 CodePen 类比）。这一形态今天仍以 **Browser Sandboxes** 保留。2024-12 它被 **Together AI 收购**，现为「a Together AI company」，产品继续独立运营，并推出了面向 AI 场景的 **CodeSandbox SDK**。

## 两类沙箱

理解 CodeSandbox 当前形态，关键是记住它把所有沙箱分成两类。

| 类型                | 运行位置             | 能跑什么                                       | 适用场景                       |
| ------------------- | -------------------- | ---------------------------------------------- | ------------------------------ |
| **VM Sandboxes**    | **服务端 microVM**   | 任意语言 / 任意 Dockerfile / 原生二进制 / 真实数据库进程 | 云开发环境、AI agent 执行、CI/CD、协作 |
| **Browser Sandboxes** | **浏览器内**（客户端） | 各前端框架专用 bundler，模拟其 CLI 默认行为    | 快速原型、分享前端代码片段     |

- **VM Sandboxes** 是当前核心：完整隔离虚拟化、跨会话持久化文件、内存快照休眠/恢复、安全 host URL 暴露端口，从模板 fork **1–3 秒就绪**。SDK 创建的就是这类沙箱。
- **Browser Sandboxes** 是早期形态的延续：代码在内置浏览器执行环境里评估运行，**断网后仍能继续打包**；每个自带专用 bundler 镜像某框架的默认行为，但**不是一比一实现**，因此不支持自定义 webpack 配置 / eject 等高级用法。

::: warning 「Devbox / CDE 三产品线」是历史叙事
早期资料常把 CodeSandbox 说成「Sandboxes / Devboxes / CDE 三条产品线」。当前官网、文档、定价都已统一为 **VM Sandboxes + Browser Sandboxes** 两类，"Devboxes" 的能力（持久化、Git 集成、Live 协作）已并入 VM Sandboxes。写作 / 答题以两类 taxonomy 为准。
:::

## 访问与新建

最直接的用法是浏览器打开 <https://codesandbox.io>：

- **选模板新建**：官网提供数十个模板（templates）起步，点一下就进编辑器。
- **导入 GitHub 仓库 / 已有 Sandbox**：把自己的仓库导入成 VM Sandbox，享受完整 CLI 与持久化。
- **编辑器**：无论 VM 还是 Browser Sandbox，都跑在 **VS Code for the web**（网页版 VS Code）上，体验与本地 VS Code 一致；也可装官方 VS Code 扩展。

如果你的目标是**编程式批量拉起沙箱**（例如给 AI agent 执行代码），则走 **CodeSandbox SDK** 而非网页新建——见「SDK 与 Sandpack」一章。

## 基本用法

一个典型的「在 VM Sandbox 里起项目」流程，和本地开发几乎一样：

```bash
# VM Sandbox 提供真实终端，可用任意包管理器
pnpm install

# 启动开发服务器
pnpm dev

# Sandbox 把监听的端口暴露成安全 host URL（默认 public），即可预览 / 分享
```

- VM Sandbox 内是真实 Linux 用户态，可装系统依赖、连真实数据库、跑任意 CLI。
- 会话结束后 Sandbox 可**休眠（hibernate）**保存整机快照，下次**恢复（resume）**完整保留状态。
- 要把实时代码示例嵌进自己的文档 / 博客，用开源组件 **Sandpack**（见「SDK 与 Sandpack」一章），而不是嵌整台 VM。

## 与 StackBlitz 的一句话区分

CodeSandbox 与 StackBlitz 最容易被搞混，记住一个本质差异即可：

::: tip 服务端 VM vs 浏览器内 WASM
**CodeSandbox**（核心 VM Sandboxes / SDK）= 把代码送到**云端真 microVM** 跑（server-side），能连真实数据库、跑原生二进制、跑任意 Dockerfile，算力在云端、按 VM 时长计费。

**StackBlitz**（WebContainers）= 把 Node.js 搬进**浏览器标签页**跑（client-side WASM），毫秒启动、零服务器成本、可离线，但受浏览器网络限制、连不上外部 Postgres/Redis/Mongo。
:::

注意：CodeSandbox 也有浏览器内的部分（**Browser Sandboxes** 与嵌入组件 **Sandpack**），但那只是它的一部分，不能把「CodeSandbox 整体」说成 client-side。两者的细致对比见「VM 沙箱 vs 浏览器沙箱」一章。
