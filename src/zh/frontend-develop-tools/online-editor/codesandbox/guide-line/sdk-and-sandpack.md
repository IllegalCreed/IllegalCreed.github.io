---
layout: doc
outline: [2, 3]
---

# SDK 与 Sandpack

> 基于 codesandbox.io/docs 2025–2026 现状编写

## 速查

- **CodeSandbox SDK**（`@codesandbox/sdk`）：编程式拉起 VM 沙箱、运行**不受信任代码**，底层是 CodeSandbox 的 microVM 基础设施；为 AI agent / 代码解释器 / CI/CD 设计
- **核心 API**：`new CodeSandbox(CSB_API_KEY)` → `sdk.sandboxes.create()` / `.get(id)` / `.list()` → `sandbox.connect()` → `client.commands.run("...")`
- **鉴权**：在 <https://codesandbox.io/t/api> 建 token（建议 all scopes），设为环境变量 `CSB_API_KEY`；沙箱与计费归属你的 workspace
- **性能**：快照恢复 **< 1s**、克隆 VM 与快照 **< 2s**、从模板 fork **1–3s**；可运行任意 Dockerfile
- **2024-12 Together AI 收购** → 推出 **Together Code Interpreter (TCI)** + CodeSandbox SDK，重心转向「**AI agent 代码执行基础设施**」
- **Sandpack**（`@codesandbox/sandpack-react`）：**开源** React 嵌入组件，浏览器内 bundler，底层 **CodeMirror** 编辑器 + **Nodebox** 浏览器内 Node 运行时；React 官方文档采用
- **Sandpack 最小用法**：`<Sandpack template="react" />`；`customSetup` 加依赖、`options` 切 UI、`theme` 换主题；可拆成 `SandpackProvider` 等底层组件自建 UI
- ⚠️ **SDK（服务端 VM）与 Sandpack（浏览器内）是两个不同层**：SDK 拉起远程真 VM 执行代码；Sandpack 在浏览器内嵌入实时示例，别混为一谈

## CodeSandbox SDK：编程式拉起沙箱执行代码

CodeSandbox SDK 的一句话是「The power of CodeSandbox in a library」——把 CodeSandbox 的能力做成一个库，让你**编程式拉起开发环境、运行不受信任代码（untrusted code）**。底层用 CodeSandbox 的 **microVM 基础设施** 拉起沙箱（即上一章的 VM Sandboxes）。

官方列出的目标用例：

- **Browser based IDEs**（浏览器内 IDE）
- **Code interpretation**（代码解释 / 执行）
- **AI Agent runtime environments**（AI agent 运行时环境）
- **A/B testing**（A/B 测试）
- **CI/CD**（测试跑完即休眠，需要时秒级恢复）

SDK 的关键能力（来自官方 README）：VM 任意时刻**快照 / 恢复（checkpointing）**且恢复 **< 1 秒**；**克隆 VM 与快照 < 2 秒**；源码管理走 git / GitHub / CodeSandbox SCM；可**运行任意 Dockerfile**。

### 鉴权与安装

```bash
npm install @codesandbox/sdk
```

- 在 <https://codesandbox.io/t/api> 点 **Create API Token**（建议开启 all scopes）。
- 把 token 以环境变量 **`CSB_API_KEY`** 暴露。
- 沙箱创建在你的 workspace 内，资源也计费到该 workspace。

### 核心 API

```ts
import { CodeSandbox } from "@codesandbox/sdk";

// 用 API key 初始化 SDK
const sdk = new CodeSandbox(process.env.CSB_API_KEY);

// 创建沙箱（从默认或自定义模板 fork）
const sandbox = await sdk.sandboxes.create();

// 连接进入沙箱，拿到 client
const client = await sandbox.connect();

// 在沙箱内执行命令
const output = await client.commands.run("echo 'Hello World'");
console.log(output); // Hello World

// 按 ID 高效取单个沙箱（比 list() 再过滤高效得多，组织有上千沙箱时尤甚）
const sb = await sdk.sandboxes.get("sandbox-id");
console.log(sb.title, sb.tags);
```

已确认的命名空间 / 方法：`sdk.sandboxes.create()`、`sdk.sandboxes.get(id)`、`sdk.sandboxes.list()`、`sandbox.connect()`、`client.commands.run(...)`。

::: tip 为什么按 ID 取比 list 高效
`sdk.sandboxes.get(id)` 直接定位单个沙箱，而 `list()` 要拉全量再过滤。大组织上千沙箱时，按 ID 取的开销远低于列举，是官方推荐做法。
:::

### Sandbox 生命周期与持久化

SDK 驱动的沙箱生命周期（官方 Core Concepts）大致是：

1. **模板创建**：用 CLI 或 SDK 预先创建 Template，分发到多集群以便扩展。
2. **Sandbox 创建**：从已有 Template fork → **1–3 秒就绪**。
3. **用户 / agent 交互**：SDK 建连，Sandbox Agent 在后台管理会话与通信。
4. **Host 交互**：从暴露的端口提供服务；**Hosts 默认 public**，受限访问用 SDK 生成 **private access token**。
5. **Hibernation（休眠）**：会话结束时 SDK 触发，保存整机 VM 快照。
6. **Resume（恢复）**：时间取决于持久化层级（内存/磁盘 0.5–2s、磁盘 5–20s、归档 20–60s，详见上一章）。
7. **删除**：先把状态持久化到 Git / 数据库，再用 SDK 删除沙箱省存储。
8. **从删除恢复**：用 SDK 从原 Template 新建沙箱 + 拉回数据 → 同样 1–3 秒。

**Templates（模板）** 是预配置的环境快照（"golden images"）：含预装依赖、Devcontainers / Docker 配置、自定义 setup 任务、预启动进程，从而秒级拉起一致环境。

::: tip 托管持久化降本
默认持久化下休眠沙箱**磁盘保留至多 7 天**、超时归档。高频场景推荐改为把工作区数据持久化到 **Git / 数据库**：会话结束删沙箱、恢复时从 Template 重建 + 拉数据，减少对长期 VM 快照的依赖。
:::

## Together AI 收购：转向 AI agent 代码执行

理解 SDK 为什么存在，要看它的来历。

::: tip 2024-12-12：Together AI 收购 CodeSandbox
动机很直接：LLM 擅长**生成**代码但**不能执行**代码，需要人工测试调试。CodeSandbox 的隔离 microVM 沙箱正好补上「执行 + 把结果回传给 LLM」这一环。CodeSandbox 现为「a Together AI company」，产品继续独立运营。
:::

收购带来两个产物：

- **Together Code Interpreter (TCI)**：集成进 Together Inference Platform 的原生代码执行能力——接收 LLM 生成的代码 → 在隔离安全环境执行 → 把输出回传 LLM，支撑数据分析、可视化、复杂问题求解、agentic 工作流。
- **CodeSandbox SDK**：本次收购后推出（beta → GA），即上文的编程式创建 / 运行 VM 沙箱的库。

由此 CodeSandbox 的整体定位从「开发者云 IDE / 前端原型」**转向「AI agent 代码执行基础设施」**，首页 H1 也改成了「Sandboxes built for scale」。

## Sandpack：浏览器内的可嵌入实时代码组件

**Sandpack** 是另一条线，和服务端 SDK 完全不同——它是**开源的浏览器内嵌入组件库**：「Component toolkit for creating live-running code editing experiences」，powered by CodeSandbox，用来**在网页里嵌入实时运行的代码编辑 / 预览体验**（文档站、博客、教学示例）。

::: warning SDK 与 Sandpack 不是一回事
**SDK**（`@codesandbox/sdk`）在**服务端真 microVM** 里执行代码，给 AI agent / CI 用。**Sandpack**（`@codesandbox/sandpack-react`）在**浏览器内**运行（bundler + Nodebox），给文档 / 博客内联示例用。两者分属服务端与客户端两个层，常被搞混。
:::

### 关键特性

- React 包 **`@codesandbox/sandpack-react`**，开箱组件 `<Sandpack />`。
- 底层编辑器用 **CodeMirror**（语法高亮等），也可换成自己的编辑器。
- **Nodebox**：Sandpack 自带的 **Node.js 运行时，可在任意浏览器内跑服务端代码**，内置支持 Next.js / Remix / Vite / Astro 等。
- 内置：npm 依赖、HMR 热更新、错误浮层（error overlay）、缓存、Node.js 支持。
- 「一键在 CodeSandbox 打开」：内联片段可随时跳到完整 CodeSandbox，便于分享 bug 复现。

### 最小用法与定制

```tsx
import { Sandpack } from "@codesandbox/sandpack-react";

// 最少代码：只设 template，每个 template 自带 files + dependencies
export default function Demo() {
  return <Sandpack template="react" />;
}
```

进一步定制靠几个 prop：

| Prop          | 作用                                                         |
| ------------- | ------------------------------------------------------------ |
| `template`    | 选内置模板（自带 `files` + `dependencies`），最小起步        |
| `customSetup` | 加依赖 / 改文件结构（如加 `react-markdown`）                 |
| `options`     | 切换内置 UI（`showNavigator` / `showLineNumbers` / `showTabs` / `closableTabs` 等） |
| `theme`       | 预设主题或自定义主题                                         |

要更深度定制，可拆成底层组件 + hooks 自建 UI：`SandpackProvider` / `SandpackThemeProvider` / `SandpackCodeEditor` / `SandpackTranspiledCode` 等。框架无关的 **`sandpack-client`** 封装了 bundler 协议，可在非 React 环境接入。

::: tip React 官方文档就用 Sandpack
React 官方文档里那些「可即时编辑运行」的代码块正是 Sandpack。它的取舍是「轻量、可拆解组件、深度定制 UI、文档内联」；若要把**完整 IDE 体验**直接嵌入，则更适合 StackBlitz embed。两者都是浏览器内运行，与 CodeSandbox 服务端 VM Sandboxes 不在同一层。
:::
