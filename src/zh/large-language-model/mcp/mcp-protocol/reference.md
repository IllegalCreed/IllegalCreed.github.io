---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MCP 官方规范（modelcontextprotocol.io/specification）编写，对照 2025-11-25 最新版

## 速查

- 协议基底：**JSON-RPC 2.0** + UTF-8；双层架构 = Data 层 + Transport 层
- 三类参与者：**Host / Client / Server**（1 Host → N Client → N Server）
- 生命周期：`initialize` → `notifications/initialized` → operation → shutdown（无专用消息）
- Transport：**stdio**（本地子进程）/ **Streamable HTTP**（远程单一 endpoint + SSE 流）
- 五原语：Server 端 **Resources / Tools / Prompts**；Client 端 **Sampling / Roots**（+ Elicitation / Tasks 2025-11-25 新增）
- 常见错误码：`-32601 Method not found`（未协商能力）、`-32602 Invalid params`、`-32603 Internal error`
- 当前协议版本：**2025-11-25**；治理：Linux Foundation + SEP 流程
- Tier1 SDK：TypeScript（`@modelcontextprotocol/sdk`）/ Python（`mcp`）/ C# / Go
- 完整说明见 [入门](./getting-started.md) / [协议原语与生命周期](./guide-line.md)

## JSON-RPC 消息格式

| 类型 | 字段 | 示例 |
| --- | --- | --- |
| **请求** | `jsonrpc` + `id` + `method` + `params` | `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{...}}` |
| **响应** | `jsonrpc` + `id` + `result`（成功）/ `error`（失败） | `{"jsonrpc":"2.0","id":1,"result":{...}}` |
| **通知** | `jsonrpc` + `method` + `params`（**无 id，无响应**） | `{"jsonrpc":"2.0","method":"notifications/initialized"}` |
| **错误** | `code` + `message` + 可选 `data` | `{"code":-32601,"message":"Method not found"}` |

> 消息必须用 UTF-8 编码；stdio transport 下消息内**不得包含嵌入换行**（换行作为消息分隔符）。

## JSON-RPC 方法完整清单

### 生命周期

| 方法 / 通知 | 方向 | 用途 |
| --- | --- | --- |
| `initialize` | client → server | 协商 protocolVersion + capabilities + clientInfo |
| `notifications/initialized` | client → server | 初始化完成通知 |
| `ping` | 双向 | 心跳 |

### Server 原语：Resources

| 方法 | 用途 |
| --- | --- |
| `resources/list` | 列出资源 |
| `resources/read` | 读取资源内容 |
| `resources/templates/list` | 列出 URI 模板 |
| `resources/subscribe` / `unsubscribe` | 订阅 / 取消订阅 |
| `notifications/resources/updated` | 内容变更通知 |
| `notifications/resources/list_changed` | 清单变更通知 |

### Server 原语：Tools

| 方法 | 用途 |
| --- | --- |
| `tools/list` | 列出工具 |
| `tools/call` | 调用工具 |
| `notifications/tools/list_changed` | 清单变更通知 |

### Server 原语：Prompts

| 方法 | 用途 |
| --- | --- |
| `prompts/list` | 列出提示模板 |
| `prompts/get` | 取具体提示（带 arguments） |
| `notifications/prompts/list_changed` | 清单变更通知 |

### Client 原语

| 方法 | 用途 |
| --- | --- |
| `sampling/createMessage` | server 反向请求 client 调 LLM |
| `roots/list` | client 返回文件系统边界 |
| `notifications/roots/list_changed` | roots 变更通知 |
| `elicitation/create`（2025-11-25） | server 向用户请求输入 / 确认 |
| `notifications/message`（Logging） | server → client 结构化日志 |

### 通用通知

| 通知 | 用途 |
| --- | --- |
| `notifications/progress` | 长任务进度（双向） |
| `notifications/cancelled` | 取消请求（双向） |

### 实验性（2025-11-25）

| 方法 | 用途 |
| --- | --- |
| `tasks/...`（多方法） | durable 异步执行 / 轮询 / 延迟结果 |

## JSON-RPC 错误码表

| 错误码 | 名称 | 含义 |
| --- | --- | --- |
| `-32700` | Parse error | JSON 解析失败 |
| `-32600` | Invalid Request | 请求结构非法 |
| `-32601` | **Method not found** | 方法不存在或**未在 capabilities 中协商** |
| `-32602` | Invalid params | 参数缺失或类型错误 |
| `-32603` | Internal error | server 内部异常 |
| `-32000` | Server error（保留段起始） | server 自定义错误 |
| `-32001` | Request failed | 请求失败（部分 SDK 用） |
| `-32002` | Resource not found | 资源 / 工具 / 提示不存在 |
| `-32003` | Unknown resource / tool 等 | 兜底未知实体 |

> 业务错误（如工具入参校验失败）不应走 JSON-RPC error——应用 `CallToolResult.isError:true` 返回，让 LLM 自纠正。

## Tool 字段规则

| 字段 | 规则 |
| --- | --- |
| `name` | 1–128 字符；`A–Z` `a–z` `0–9` `_` `-` `.` `/`；**大小写敏感**；server 内唯一 |
| `title` | 可选，UI 展示用人类可读标题 |
| `description` | 可选，给 LLM 看的语义说明 |
| `inputSchema` | **必填**，合法 JSON Schema 2020-12 object；无参写 `{type:"object", additionalProperties:false}` |
| `outputSchema` | 可选；声明后需同时填 `structuredContent` |
| `annotations` | 可选；4 类 hint：`readOnlyHint` / `destructiveHint` / `idempotentHint` / `openWorldHint` |
| `icons` | 可选（2025-11-25 新增） |

## Sampling modelPreferences 字段

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `hints` | `[{ name: "claude" | "sonnet" | ... }]` | 模型名子串匹配（建议性，client 做最终映射） |
| `costPriority` | 0–1 | 越高越偏向低成本模型 |
| `speedPriority` | 0–1 | 越高越偏向高速模型 |
| `intelligencePriority` | 0–1 | 越高越偏向高能力模型 |

## Transport 对照

| 维度 | stdio | Streamable HTTP |
| --- | --- | --- |
| 适用场景 | 本地 server（单 client） | 远程 server（多 client） |
| 进程模型 | client 拉起 server 子进程 | 独立进程，跨网络 |
| 消息格式 | newline-delimited JSON | HTTP POST body / SSE event |
| 鉴权 | 继承用户权限 | OAuth 2.1 + OIDC Discovery |
| 会话标识 | 进程本身 | `Mcp-Session-Id` 头 |
| 流式支持 | 否（单条请求-响应） | 是（SSE event + `Last-Event-ID` 续传） |
| 复用 | 单 client 一条 | 多 client 共享 endpoint |
| 安全要点 | stdout 严禁写非协议内容 | 校验 `Origin` + 绑 `127.0.0.1` 防 DNS rebinding |

## SDK 分级（截至 2025-11-25）

| Tier | 语言 | 包名 / 入口 | 关键 API |
| --- | --- | --- | --- |
| **Tier 1** | TypeScript | `@modelcontextprotocol/sdk` | `McpServer.registerTool()` + `StdioServerTransport` + `server.connect()` |
| **Tier 1** | Python | `mcp`（pip） | `FastMCP` + `@mcp.tool()` + `mcp.run(transport="stdio")` |
| **Tier 1** | C# | `ModelContextProtocol` | `McpServer` + attribute 注册 |
| **Tier 1** | Go | `github.com/mark3labs/mcp-go` | `mcp.NewServer` + `AddTool` |
| Tier 2 | Java / Spring AI | `spring-ai-mcp` | starter 集成 |
| Tier 2 | Rust | `rmcp` crate | trait 实现 |
| Tier 3 | Swift / Ruby / PHP / Kotlin / Elixir | 社区维护 | 见官方 SDK 列表 |

## 版本演进

| 版本 | 时间 | 关键变化 |
| --- | --- | --- |
| **2024-11-05** | 2024-11 | 首发；含旧 HTTP+SSE transport（双端点 GET-SSE + POST） |
| **2025-03-26** | 2025-03 | 引入 **Streamable HTTP** transport 取代旧 HTTP+SSE；旧 transport 标记 `deprecated` |
| **2025-06-18** | 2025-06 | 稳定版；多数 SDK 与文档示例默认协商此版 |
| **2025-11-25** | 2025-11（最新） | Elicitation form/url 模式增强；Sampling 支持 `tools` + `toolChoice`；Tool `outputSchema` / `structuredContent` / `annotations` / `icons` 完善；JSON Schema 2020-12 成默认方言；OAuth 增强（OIDC Discovery、WWW-Authenticate、OAuth Client ID Metadata）；实验性 `Tasks` 原语；治理已交 Linux Foundation |

## 废弃状态（2025-11-25）

| 项 | 状态 | 替代 |
| --- | --- | --- |
| 旧 HTTP+SSE transport（2024-11-05） | `deprecated`（仍可向后兼容） | Streamable HTTP |
| `sampling.includeContext` = `thisServer` / `allServers` | soft-deprecated | sampling capability 声明或省略 |

## 客户端生态

| 客户端 | 厂商 | 配置方式 |
| --- | --- | --- |
| **Claude Desktop** | Anthropic | `claude_desktop_config.json` 的 `mcpServers` |
| **Claude Code** | Anthropic | `.mcp.json` 或 CLI 命令 |
| **Cursor** | Anysphere | 设置面板 → MCP |
| **Cline** | 开源 | VS Code 扩展配置 |
| **VS Code Copilot Chat** | Microsoft | `.vscode/mcp.json` |
| **ChatGPT**（Connectors） | OpenAI | 系统连接器配置 |
| **MCPJam** | 社区 | Web UI |

> `claude_desktop_config.json` 中 `command` + `args` 须用**绝对路径**，否则 server 无法启动。

## 官方资源

- 文档总入口：[https://modelcontextprotocol.io/introduction](https://modelcontextprotocol.io/introduction)
- 规范首页：[https://modelcontextprotocol.io/specification](https://modelcontextprotocol.io/specification)
- 生命周期（2025-11-25）：[/specification/2025-11-25/basic/lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
- Server 原语：[/specification/latest/server/resources](https://modelcontextprotocol.io/specification/latest/server/resources) · [/tools](https://modelcontextprotocol.io/specification/latest/server/tools) · [/prompts](https://modelcontextprotocol.io/specification/latest/server/prompts)
- Client 原语：[/specification/latest/client/sampling](https://modelcontextprotocol.io/specification/latest/client/sampling) · [/roots](https://modelcontextprotocol.io/specification/latest/client/roots) · [/specification/2025-11-25/client/elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
- Changelog：[/specification/2025-11-25/changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog)
- Build Server：[/docs/develop/build-server](https://modelcontextprotocol.io/docs/develop/build-server)
- SDK 列表：[/docs/sdk](https://modelcontextprotocol.io/docs/sdk)
- Transport 概念：[/docs/concepts/transports](https://modelcontextprotocol.io/docs/concepts/transports)
- TypeScript SDK：[github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- Python SDK：[github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- Servers 仓库（参考实现）：[github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
