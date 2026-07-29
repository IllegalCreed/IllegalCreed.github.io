---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MCP 官方文档（modelcontextprotocol.io）编写，对照 2025-11-25 最新规范版

## 速查

- **本质**：Anthropic 2024-11 开放的「AI 应用 USB-C」协议，基于 **JSON-RPC 2.0** + UTF-8
- **治理**：已捐赠 **Linux Foundation**，SEP 提案流程；非 Anthropic 私有
- **三层参与者**：Host（协调多 client 的 AI 应用）/ Client（1 对 1 连 server）/ Server（提供上下文的程序）
- **双层架构**：Data 层（JSON-RPC + 生命周期 + 原语 + 通知）+ Transport 层（stdio / Streamable HTTP）
- **生命周期**：`initialize`（含 protocolVersion + capabilities + clientInfo/serverInfo）→ `notifications/initialized` → operation → shutdown（靠 transport 关闭，无专用消息）
- **版本协商**：client 发最新版，server 同版回同版，否则回 server 最新版，client 不支持则断开
- **Transport A：stdio**：拉起子进程，stdin/stdout 传 newline-delimited JSON，stderr 仅日志，**stdout 严禁写非协议内容**
- **Transport B：Streamable HTTP**：单一 endpoint（/mcp），POST+GET，`Mcp-Session-Id` 会话头，SSE event id + Last-Event-ID 断线续传，取代旧 HTTP+SSE
- **五原语**：Resources（应用控制）/ Tools（模型控制）/ Prompts（用户控制）/ Sampling（client 端，server 反向调 LLM）/ Roots（client 端，文件系统边界）
- **常见错误码**：`-32601 Method not found`（未协商能力）、`-32602 Invalid params`、`-32603 Internal error`
- **Tier1 SDK**：TypeScript（`@modelcontextprotocol/sdk`，`McpServer.registerTool`）/ Python（`mcp`，`FastMCP` + `@mcp.tool()`）

## MCP 是什么

MCP（Model Context Protocol）是 Anthropic 2024 年 11 月发布的**开放协议**，把大模型与外部上下文之间的连接标准化为一份公开规范——任何 AI 客户端只要按协议实现，就能接入任何按协议实现的工具服务器。它的核心定位有三：

- **开放标准**：捐赠 Linux Foundation 中立治理，采用 SEP（Specification Enhancement Proposal）流程
- **协议层抽象**：定义的是「上下文如何交换」，不规定 AI 应用如何使用 LLM 或如何管理已提供的上下文
- **跨厂商生态**：Claude Desktop / Claude Code / Cursor / Cline / VS Code Copilot / ChatGPT 等主流客户端均已接入

> MCP ≠ 某个框架，也 ≠ 某个模型的 function calling。它是协议层的开放标准，类比「AI 应用的 USB-C」。

## 三层参与者

| 角色 | 职责 | 例子 |
| --- | --- | --- |
| **Host** | 协调多个 client 的 AI 应用，承载用户交互与权限 | Claude Desktop / Claude Code / VS Code |
| **Client** | 与**单个** server 维持一条专属连接（1 Host 可有 N Client） | Host 内部为每个 server 创建的连接实例 |
| **Server** | 提供上下文的程序，本地或远程均可 | 文件系统 server、数据库 server、GitHub server |

> 一个 Host 同时连多个 Server 时，会为每个 Server 创建独立的 Client 实例，彼此隔离。

## 双层架构

MCP 协议在结构上分两层，二者解耦：

- **Data 层**：定义 JSON-RPC 消息格式、生命周期、原语与通知——同一套消息跨所有 transport 复用
- **Transport 层**：定义字节如何传输、如何鉴权——目前两类：`stdio`（本地）与 `Streamable HTTP`（远程）

> 同一份 Server 代码，理论上可以同时挂到 stdio（本地用）和 Streamable HTTP（远程用）两个 transport 上。

## 生命周期

协议生命周期分三阶段：

1. **Initialization**：Client 发 `initialize` 请求，含 `protocolVersion`、`capabilities`、`clientInfo`；Server 回其选定的 `protocolVersion` 与 `serverInfo`、`capabilities`
2. **Operation**：Client 发 `notifications/initialized` 通知后进入正式操作阶段，按协商的能力互调原语
3. **Shutdown**：无专用关闭消息——靠 transport 关闭（stdio：close stdin → SIGTERM → SIGKILL；HTTP：DELETE 会话）

**版本协商规则**

- Client 发其支持的最新版
- Server 若支持则回同版；否则回 Server 自己的最新版
- Client 不支持回退版本则断开连接
- HTTP 请求须带 `MCP-Protocol-Version` 头

> 调用未在 `capabilities` 中协商过的原语，对端会返回 `-32601 Method not found`。

## 五类核心原语

| 原语 | 端 | 控制方 | 一句话 |
| --- | --- | --- | --- |
| **Resources** | Server | 应用控制（application-driven） | 文件 / 数据等被动上下文，由 Host UI 显式选择 |
| **Tools** | Server | 模型控制（model-controlled） | 可被 LLM 自动调用的函数，需 human-in-the-loop |
| **Prompts** | Server | 用户控制（user-controlled） | slash command 等显式模板 |
| **Sampling** | Client | server 反向请求 | Server 让 Host 帮它调 LLM（嵌套生成） |
| **Roots** | Client | server 反向请求 | Server 拿到 Host 可操作的文件系统边界 |

> 2025-11-25 新增 `Elicitation`（server 向用户请求输入）与实验性 `Tasks`（durable 执行）。

## Transport：stdio

**特点**：本地通信首选，零网络开销。

- Client 拉起 Server 子进程（`command` + `args`）
- stdin/stdout 传 **newline-delimited JSON**（每条消息一行，**消息内不得含嵌入换行**）
- stderr 仅用于日志
- **stdout 严禁写任何非协议内容**——`console.log` / `print` / `System.out.println` 会直接破坏 JSON-RPC 流

> 在 TS SDK 里用 `console.error`，Python SDK 里用 `print(file=sys.stderr)` 写日志。

## Transport：Streamable HTTP

**特点**：远程连接首选，取代 2024-11-05 旧 HTTP+SSE transport。

- 单一 MCP endpoint（如 `/mcp`），支持 POST 与 GET
- 请求头 `Accept` 须同时含 `application/json` 与 `text/event-stream`
- 响应可走 SSE 流，server 可发 `event id`；客户端用 `Last-Event-ID` 头实现**断线续传**
- 用 `Mcp-Session-Id` 会话头标识会话；HTTP DELETE 终止会话
- 推荐叠加 OAuth / OIDC 鉴权

> 旧 HTTP+SSE transport（双端点 GET-SSE + POST）已在 2025-03-26 标记 `deprecated`，新写的 server 应直接用 Streamable HTTP。

## 第一个 MCP Server（TypeScript）

```bash
# 1. 初始化工程
mkdir my-mcp-server && cd my-mcp-server
pnpm init
pnpm add @modelcontextprotocol/sdk zod

# 2. 写 server.ts（见下方代码块）
# 3. 用 stdio 启动
node server.js
```

最小可跑 server（仅注册一个 echo 工具）：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 创建 server 实例，声明名称与版本
const server = new McpServer({
  name: "echo-server",
  version: "0.1.0",
});

// 注册一个工具：原样回显输入文本
server.registerTool(
  "echo",
  {
    title: "Echo",
    description: "原样回显输入的文本",
    inputSchema: { text: { type: "string" } },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: `echo: ${text}` }],
  }),
);

// 挂到 stdio transport 并启动
await server.connect(new StdioServerTransport());
```

挂到 Claude Desktop 的配置示例（`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "echo": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"]
    }
  }
}
```

> `args` 必须用绝对路径；Claude Desktop 启动后会以子进程方式拉起 server，通过 stdio 通信。

## 下一步

- [协议原语与生命周期](./guide-line.md)：五原语细节、生命周期与能力协商、安全要点、反模式
- [参考](./reference.md)：JSON-RPC 方法清单、错误码表、版本变化、官方资源
