---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 codesandbox.io/docs 2025–2026 现状编写

## 速查

- **SDK 初始化**：`new CodeSandbox(process.env.CSB_API_KEY)`；API key 从 CodeSandbox token 页面创建，不应下发到浏览器。
- **核心链路**：`sdk.sandboxes.create/get/list` 管理沙箱，`sandbox.connect()` 取得 client，`client.commands.run()` 在 VM 内执行命令。
- **生命周期**：Sandbox 可创建、连接、休眠、恢复和删除；恢复速度取决于内存快照、磁盘快照或归档层级。
- **两类沙箱**：VM Sandbox 提供完整 Linux/持久工作区；Browser Sandbox 适合轻量前端预览，不等同于远程 VM。
- **Sandpack**：面向 React 的嵌入组件，常用 `template`、`files`、`customSetup` 与 `options`；它不是 CodeSandbox SDK 的 VM 控制接口。
- **单个沙箱优先 `get(id)`**：已知 ID 时不要先 `list()` 再过滤，避免多余网络与列表开销。
- **套餐与时效会变**：并发、存储和休眠策略以 CodeSandbox 官方定价与文档为准。

## SDK 方法速查

`@codesandbox/sdk`，先 `const sdk = new CodeSandbox(process.env.CSB_API_KEY)`。

| 方法 / 成员                      | 返回                 | 行为                                      |
| -------------------------------- | -------------------- | ----------------------------------------- |
| `new CodeSandbox(CSB_API_KEY)`   | SDK 实例             | 用 API key 初始化 SDK                     |
| `sdk.sandboxes.create()`         | `Promise<Sandbox>`   | 从默认 / 自定义模板 fork 出新沙箱（1–3s） |
| `sdk.sandboxes.get(id)`          | `Promise<Sandbox>`   | 按 ID 高效取单个沙箱（优于 `list` 过滤）  |
| `sdk.sandboxes.list()`           | `Promise<Sandbox[]>` | 列举沙箱                                  |
| `sandbox.connect()`              | `Promise<Client>`    | 连接进入沙箱，拿到 client                 |
| `client.commands.run(cmd)`       | `Promise<string>`    | 在沙箱内执行命令并返回输出                |
| `sandbox.title` / `sandbox.tags` | 数据                 | 沙箱元信息                                |

> 生命周期动作（由 SDK 触发）：创建 / 连接 / 暴露 host / **hibernate（休眠）** / **resume（恢复）** / **delete（删除）**。鉴权环境变量为 `CSB_API_KEY`，token 在 <https://codesandbox.io/t/api> 创建。

## 沙箱生命周期与恢复速度

| 阶段                    | 时间 / 说明                                |
| ----------------------- | ------------------------------------------ |
| 从模板 fork 创建        | **1–3 秒**就绪                             |
| 克隆 VM 与快照          | **< 2 秒**                                 |
| Resume（内存/磁盘快照） | **0.5–2 秒**（快照恢复 < 1s）              |
| Resume（磁盘快照）      | **5–20 秒**                                |
| Resume（归档）          | **20–60 秒**                               |
| 休眠快照磁盘保留        | 至多 **7 天**，超时 / 紧张则归档到长期存储 |

## VM Sandbox vs Browser Sandbox

| 维度       | VM Sandboxes（核心）                                 | Browser Sandboxes                   |
| ---------- | ---------------------------------------------------- | ----------------------------------- |
| 运行位置   | 服务端 **Firecracker microVM**                       | **浏览器内**执行环境（client-side） |
| 能跑什么   | 任意语言 / 任意 Dockerfile / 原生二进制 / 真实数据库 | 各框架专用 bundler，镜像其默认行为  |
| 网络       | 任意出站，连真实 Postgres·Redis·Mongo                | 受浏览器限制                        |
| 自定义构建 | 完整（真 Linux 用户态）                              | 不支持自定义 webpack / eject        |
| 断网       | 断网即断                                             | 断网仍可继续打包                    |
| 持久化     | 跨会话持久化 + 内存快照休眠/恢复                     | 适合临时原型 / 分享                 |
| 计费       | 耗 **VM credits**                                    | **不耗 credits**                    |
| 由谁创建   | SDK / 网页 / 导入仓库                                | 网页新建                            |
| 编辑器     | VS Code for the web                                  | VS Code for the web                 |

## CodeSandbox VM vs StackBlitz WebContainers

| 维度        | CodeSandbox（VM / SDK）          | StackBlitz（WebContainers）     |
| ----------- | -------------------------------- | ------------------------------- |
| 执行位置    | 服务端 microVM                   | 客户端浏览器（WASM）            |
| 数据库      | 连真实 Postgres·Redis·Mongo      | **连不上**外部 DB（需原始 TCP） |
| 原生二进制  | 支持                             | 需先移植到 WASM                 |
| 算力 / 计费 | 云端服务器 / 按 VM 时长          | 本地 CPU / 无服务器成本         |
| 冷启动      | fork 1–3s，快照 resume 0.5–2s    | 毫秒级 boot                     |
| 离线        | 断网即断（Browser Sandbox 例外） | 可离线                          |

## Sandpack 常用 prop

`@codesandbox/sandpack-react`，开箱组件 `<Sandpack />`（浏览器内运行）。

| Prop          | 作用                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| `template`    | 选内置模板（自带 `files` + `dependencies`），最小起步                          |
| `customSetup` | 加依赖 / 改文件结构                                                            |
| `options`     | 切内置 UI（`showNavigator` / `showLineNumbers` / `showTabs` / `closableTabs`） |
| `theme`       | 预设或自定义主题                                                               |

> 底层可拆组件：`SandpackProvider` / `SandpackThemeProvider` / `SandpackCodeEditor` / `SandpackTranspiledCode`；编辑器底层 **CodeMirror**；浏览器内 Node 运行时 **Nodebox**（内置支持 Next.js / Remix / Vite / Astro）；框架无关封装 `sandpack-client`。

## 套餐功能对照

> 计费骨架 = **VM credits**（仅 VM Sandboxes 耗用，把 VM 运行时长换算成成本；Browser Sandboxes 不耗 credits）。**所有金额以官网 <https://codesandbox.io/pricing> 为准，可能随时调整。**

| 档位                  | 定位                 | VM credits / 并发 / SDK                                                                                                      | 金额（以官网为准）                                 |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Build（免费）**     | 学习与试验           | 每月一定额度 VM credits；**SDK lite**（限并发 VM Sandboxes，约 10）；无限 Browser & VM Sandboxes；私有沙箱；较小 VM 规格     | 免费                                               |
| **Scale（付费起步）** | 按量订阅，规模化使用 | 更多每月 VM credits + 可买 on-demand credits；**完整 SDK**（非 lite）；更高每小时新建沙箱 / 并发 VM / 请求上限；更多 VM 档位 | 约 $170 / 月起，credit 约 $0.015（**以官网为准**） |
| **Enterprise**        | 大规模 / 合规        | 自定义并发 / 请求上限；批量 credit 折扣；最高 VM 规格；SOC 2 Type II；可选 SSO / 专属集群                                    | 联系销售（Custom）                                 |

::: warning 档位结构与金额会变，别写死
KB 抓取时底部对比表里多出一列 "Pro"（页面卡片只有 Build / Scale / Enterprise 三档），疑为遗留 / 过渡列。写作 / 答题以**三档卡片**为准，且所有金额、credit 单价、并发数都以官网实时数据为准——CodeSandbox 收购后定价重构频繁，老数字极易过时。
:::

## 易错点

- **当前 taxonomy 是「VM Sandboxes + Browser Sandboxes」两类**，不是「Sandboxes / Devboxes / CDE 三产品线」——后者是历史营销叙事。
- **CodeSandbox ≠ 浏览器内运行**：核心 VM Sandboxes / SDK 是**服务端 Firecracker microVM**，只有 Browser Sandboxes 与 Sandpack 是浏览器内；别把「整体」说成 client-side。
- **WebContainers 也能跑 Python**（2023 起经 WASI），但仍是浏览器内 WASM、连不上外部数据库；别说它「只能跑 JS」。
- **SDK 与 Sandpack 是两个层**：SDK 拉起服务端真 VM 执行代码；Sandpack 在浏览器内嵌入实时示例。
- **credit 单价 ~$0.015/credit 与 on-demand ~$0.15/小时是两个不同数字**，别混；所有金额以官网为准。
