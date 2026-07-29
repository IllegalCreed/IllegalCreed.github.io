---
layout: doc
outline: [2, 3]
---

# 协议原语与生命周期

> 基于 MCP 官方规范（modelcontextprotocol.io/specification）编写，对照 2025-11-25 最新版

## 速查

- **Server 三原语**：Resources（应用控制）/ Tools（模型控制）/ Prompts（用户控制），按「谁来触发」划分
- **Resources**：`resources/list` / `read` / `templates/list`（RFC 6570 URI 模板）/ `subscribe` + `updated` 通知；内容为 text 或 base64 blob
- **Tools**：`tools/list` / `call`；`inputSchema`（JSON Schema 2020-12 默认）；`outputSchema` + `structuredContent` 结构化输出
- **Tool annotations**：`readOnlyHint` / `destructiveHint` / `idempotentHint` / `openWorldHint`——**视为不可信**
- **Tool 业务错误**：用 `CallToolResult.isError:true` 返回（让 LLM 自纠正），**不要**用 JSON-RPC error
- **Prompts**：`prompts/list` / `get`（带 arguments）；返回 `PromptMessage`（role + content）；常作 slash command
- **Client 三原语**：Sampling（server 反向调 LLM）/ Roots（文件系统边界）/ Elicitation（向用户请求输入）
- **Sampling**：`sampling/createMessage`，必含 `messages` + `modelPreferences`（hints + cost/speed/intelligence 三维 0–1）
- **强制 human-in-the-loop**：Sampling / Tools 调用都须让用户审查与确认
- **生命周期**：`initialize` → `notifications/initialized` → operation → shutdown（transport 关闭）
- **能力协商是硬前提**：未声明的 capability 调用会返回 `-32601 Method not found`
- **stdio 安全**：stdout 严禁写非协议内容；HTTP 须校验 Origin 头 + 绑 127.0.0.1 防 DNS rebinding

## Server 原语：Resources

**控制方：应用控制（application-driven）**——由 Host 的 UI 显式选择 / 搜索 / 自动注入，**不**让模型自动决定。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `resources/list` | 列出 server 提供的所有资源（含 uri / name / description / mimeType） |
| `resources/read` | 读取指定 uri 的内容（返回 text 或 base64 blob） |
| `resources/templates/list` | 列出 RFC 6570 URI 模板（如 `file:///projects/{path}`） |
| `resources/subscribe` | 订阅资源变更（需 client 声明 `subscribe` capability） |
| `notifications/resources/updated` | server 推送：某资源内容已变 |
| `notifications/resources/list_changed` | server 推送：资源清单已变 |

**常见 URI scheme**：`file://`（本地文件）、`https://`（远端 URL）、`git://`（仓库）、自定义（如 `postgres://`）。

> Resources 适合「给模型读的上下文」——文件内容、数据库行、issue 列表。模型可以读到，但要不要读、读哪个，由 Host 或用户决定。

## Server 原语：Tools

**控制方：模型控制（model-controlled）**——LLM 根据上下文自动发现与调用，需 **human-in-the-loop** 批准。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `tools/list` | 列出工具（含 name / title / description / inputSchema / outputSchema / annotations） |
| `tools/call` | 调用工具，传 `name` + `arguments`；返回 `content` 数组与可选 `structuredContent` |

**字段规则**

- **工具名**：1–128 字符；只能含 `A–Z` `a–z` `0–9` `_` `-` `.` `/`；**大小写敏感**；server 内唯一
- **`inputSchema`**：必须是一个合法 JSON Schema 对象（默认方言 JSON Schema 2020-12）；无参工具写 `{type:"object", additionalProperties:false}`，**不能写 null 或省略**
- **`outputSchema`**：可选；声明后需在结果里同时填 `structuredContent` 字段
- **`annotations`**：四类提示位（**客户端须视为不可信**，除非来自可信 server）
  - `readOnlyHint`：只读，无副作用
  - `destructiveHint`：破坏性
  - `idempotentHint`：幂等
  - `openWorldHint`：与外部世界交互（默认 true）

**工具执行错误（业务错误） vs 协议错误**

- 工具执行错误（输入校验失败、API 限流、值越界）→ `CallToolResult.isError:true` + 文本反馈，让 **LLM 自我纠正**后重试
- 协议错误（请求结构本身有问题）→ JSON-RPC error（`-32xxx`），LLM 难以修复

> 把业务错误当 JSON-RPC error 返回是常见反模式——LLM 拿不到可纠正的文本反馈，直接失去重试机会。

## Server 原语：Prompts

**控制方：用户控制（user-controlled）**——用户显式触发（如 slash command），不让模型自动决定。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `prompts/list` | 列出提示模板（含 name / description / arguments） |
| `prompts/get` | 取具体提示，传 `name` + `arguments`；返回 `PromptMessage[]` |

**PromptMessage 结构**：`{ role: "user" | "assistant", content: TextContent | ImageContent | AudioContent }`。

> Prompts 的典型用法是「快捷指令模板」——比如 `/summarize-pr`、`/explain-error`，用户在输入框敲斜杠时由 Host 弹出菜单。

## Client 原语：Sampling

**控制方：server 反向请求**——server 让 Host 帮它调用 LLM（用于 server 内嵌套的生成任务）。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `sampling/createMessage` | server → client：帮我用你的 LLM 生成一段响应 |

**关键参数**

- `messages`：消息序列（与 LLM API 类似）
- `systemPrompt`：可选系统提示
- `modelPreferences`：选模型偏好，**不要硬编码模型名**
  - `hints`：模型名子串（如 `"claude"` `"sonnet"`），client 做最终映射
  - `costPriority` / `speedPriority` / `intelligencePriority`：三维优先级，各 0–1
- `maxTokens` / `stopSequences`：长度与停止控制
- `tools` + `toolChoice`（2025-11-25 新增）：支持工具调用循环（`auto` / `required` / `none`）

**结果**：`{ role: "assistant", content, model, stopReason: "endTurn" | "toolUse" | ... }`。

> **强制 human-in-the-loop**：Sampling 是 server 发起的嵌套 LLM 调用，无审查会构成提示注入 / 数据外泄风险——官方 Warning 级要求。Host 必须提供 UI 让用户审查 prompt、审查响应、确认工具调用。

> `includeContext` 的取值 `thisServer` / `allServers` 已 **soft-deprecated**，应改用 sampling 的 capability 声明或省略。

## Client 原语：Roots

**控制方：server 反向请求**——server 拿到 Host 可操作的文件系统边界。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `roots/list` | client 返回 `[{ uri: "file://...", name: "..." }]` |
| `notifications/roots/list_changed` | client 推送：roots 已变 |

**典型场景**：用户在 Host 里打开某个项目目录 → server 通过 roots/list 知道边界 → 后续 resources / tools 调用都在该边界内活动。

## Client 原语：Elicitation（2025-11-25 增强）

**控制方：server 反向请求**——server 向用户请求输入或确认。

| JSON-RPC 方法 | 作用 |
| --- | --- |
| `elicitation/create` | server → client → 弹出表单 / 链接让用户输入 |

**两种模式**

- `form`：结构化表单（支持单选 / 多选 / 带 title 的枚举）
- `url`：打开一个外部 URL 让用户操作

> Elicitation 是 2025-11-25 规范的重要增强，让 server 能在工具执行过程中向用户询问澄清问题（如「要保留哪些字段？」），而不是猜或硬编码。

## 通知与错误

**通知**：JSON-RPC notification 无 id、无响应——单方向通知。

| 通知 | 方向 | 含义 |
| --- | --- | --- |
| `notifications/initialized` | client → server | 初始化完成 |
| `notifications/tools/list_changed` | server → client | 工具清单变了 |
| `notifications/resources/list_changed` | server → client | 资源清单变了 |
| `notifications/resources/updated` | server → client | 某资源内容变了 |
| `notifications/prompts/list_changed` | server → client | 提示清单变了 |
| `notifications/roots/list_changed` | client → server | roots 变了 |
| `notifications/progress` | 双向 | 长任务进度 |
| `notifications/cancelled` | 双向 | 取消请求 |
| `notifications/message`（Logging） | server → client | 结构化日志 |

**常见 JSON-RPC 错误码**

| 错误码 | 含义 | 典型场景 |
| --- | --- | --- |
| `-32700` | Parse error | JSON 解析失败 |
| `-32600` | Invalid Request | 请求结构非法 |
| `-32601` | **Method not found** | **未在 capabilities 中协商此原语** |
| `-32602` | Invalid params | 参数缺失或类型错误 |
| `-32603` | Internal error | server 内部异常 |
| `-32002` | Resource not found | 指定资源 / 工具不存在 |

## 安全要点

### Streamable HTTP 防 DNS rebinding

远程网站可借 DNS 重绑定与本机本地 server 交互，盗读数据。三件套防护：

- **本地绑 `127.0.0.1`**，不要绑 `0.0.0.0`
- **校验 `Origin` 头**，拒绝跨域
- **实现 OAuth / 鉴权**（推荐 OAuth 2.1 + OIDC Discovery）

### stdio server 严禁污染 stdout

`stdout` 是 JSON-RPC 消息通道——任何非协议字节（`console.log` / `print` / `System.out.println` / `fmt.Println` / `puts`）都会让整个 server 失联。各语言的日志写法：

| 语言 | 日志写法 |
| --- | --- |
| TypeScript / JavaScript | `console.error(...)` |
| Python | `print(..., file=sys.stderr)` |
| Java | `System.err.println(...)` |
| Go | `fmt.Fprintln(os.Stderr, ...)` |
| Rust | `eprintln!(...)` |

### Tool annotations 视为不可信

`readOnlyHint:true` 不能用作自动批准依据——annotations 来自可能不可信的 server，必须由用户或 host 的策略做最终决策。

### Sampling / Tools 都要 human-in-the-loop

- Tools：模型自动调用，但每次都应有用户审查（或显式批准 / 显式策略）
- Sampling：server 发起的嵌套 LLM 调用，无审查 = 提示注入 / 数据外泄面

## 反模式（避坑）

- **stdio server 用 `console.log` / `print` / `println!` / `System.out.println` / `puts` 写日志**——直接污染 stdout，server 崩坏
- **未声明 capability 就调用 sampling / roots / elicitation / tools**——返回 `-32601 Method not found`，能力协商是硬前提
- **把工具业务错误（输入校验 / API 限流）当 JSON-RPC protocol error 返回**——LLM 拿不到可自纠正的反馈
- **直接信任 tool annotations（如 `readOnlyHint:true`）做自动批准**——annotations 不可信
- **Sampling 里把 `tool_result` 与 `text` / `image` 混在同一条 user message**——违反约束（`tool_result` 消息只能含 `tool_result`），与 OpenAI `tool` role / Gemini `function` role 不兼容
- **Sampling 无 human-in-the-loop、自动批准所有 LLM 调用**——提示注入 / 数据外泄面
- **本地 Streamable HTTP server 绑 `0.0.0.0` 且不校验 `Origin` 头**——可被 DNS rebinding 攻击
- **新写的 server 仍用 2024-11-05 的旧 HTTP+SSE transport**——已被 Streamable HTTP 取代并标记 `deprecated`，应迁移
- **把 `structuredContent` 当成 LLM 的 schema-constrained generation**——它只是 server 产出的结果数据，与模型侧结构化生成是两回事
- **Tool 的 `inputSchema` 写成 null 或省略**——必须是一个合法 JSON Schema object
- **依赖 `sampling.includeContext` 的 `thisServer` / `allServers`**——已 soft-deprecated，未来版本可能移除
- **跨 provider 硬编码模型名**——应用 `modelPreferences` 的 hints + 三维优先级，让 client 做最终映射

## 下一步

- [参考](./reference.md)：JSON-RPC 方法完整清单、错误码表、版本演进、官方资源
