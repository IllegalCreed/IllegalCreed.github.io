---
layout: doc
---

# MCP 协议基础

MCP（Model Context Protocol，模型上下文协议）是 Anthropic 于 **2024 年 11 月**发布的**开放协议**，定位为「**AI 应用的 USB-C 接口**」——把大模型与各种外部上下文（文件、数据库、API、工具）之间的连接方式标准化为一份公开规范，让任意 AI 客户端与任意工具服务器只要按协议实现就能互通。协议底层基于 **JSON-RPC 2.0** 与 UTF-8 编码，采用「**Data 层 + Transport 层**」双层架构：Data 层定义消息格式、生命周期与原语；Transport 层定义通信机制（**stdio / Streamable HTTP**）。参与者分三类——**Host**（协调多个 client 的 AI 应用，如 Claude Desktop / Claude Code / VS Code）、**Client**（与单个 server 维持一条专属连接）、**Server**（提供上下文的程序，本地或远程）。

协议核心是五类原语：**Server 端三类**——`Resources`（应用控制，文件 / 数据等被动上下文）、`Tools`（模型控制，可被 LLM 自动调用的函数）、`Prompts`（用户控制，slash command 等显式模板）；**Client 端两类**——`Sampling`（server 反向请求 client 调用 LLM）、`Roots`（定义 server 可操作的文件系统边界）。2025-11-25 最新规范新增 `Elicitation`（server 向用户请求输入）、`Tasks`（durable 异步执行），并完善了 `outputSchema / structuredContent` 结构化输出、`Tool annotations`、`Tool icons`、`Sampling tools + toolChoice` 工具调用循环等。MCP 已捐赠 **Linux Foundation** 开放治理，采用 SEP 提案流程，官方维护 **10 语言 SDK**（TypeScript / Python / C# / Go 为 Tier 1）。生态客户端含 Claude Desktop、Claude Code、Cursor、Cline、VS Code Copilot、ChatGPT、MCPJam。

## 评价

**优点**

- **开放标准 + 中立治理**：捐赠 Linux Foundation，非 Anthropic 私有，跨厂商公平中立
- **一次编写处处接入**：一个 MCP Server 可被任意支持 MCP 的客户端使用，告别 N×M 适配
- **协议层抽象干净**：Data 层（消息原语）与 Transport 层（通信机制）解耦，JSON-RPC 跨 transport 复用
- **原语分类清晰**：Resources / Tools / Prompts 三类按「谁来控制」划分，覆盖典型上下文形态
- **生态起势快**：Claude Desktop / Cursor / Cline / VS Code / ChatGPT 等主流客户端均已接入
- **SDK 完备**：TypeScript / Python / C# / Go 四个 Tier1 语言 SDK，开发成本极低

**缺点**

- **协议演进快、版本碎片**：2024-11-05 → 2025-03-26 → 2025-06-18 → 2025-11-25 多个版本并存，旧 HTTP+SSE transport 已废弃但仍可见
- **安全模型仍偏手动**：tool annotations 不可信、Sampling 需强制 human-in-the-loop，靠开发者自觉
- **Streamable HTTP 部署复杂**：需校验 Origin / 处理 SSE 流 / 实现 OAuth，比 stdio 出错面大
- **Tasks / Elicitation 仍实验性**：2025-11-25 规范尚未稳定，跨 SDK 行为可能不一致
- **远程鉴权尚未收敛**：OAuth 2.1 / OIDC Discovery / Client ID Metadata 等多套机制并存
- **跨 SDK 行为差异**：Tier2/3 SDK（Java / Rust / Swift / Ruby 等）覆盖度与 Tier1 有差距

## 文档地址

- [MCP 官方总入口](https://modelcontextprotocol.io/introduction)
- [规范首页 / 版本与 changelog](https://modelcontextprotocol.io/specification)
- [生命周期与能力协商（2025-11-25）](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
- [Server 原语文档](https://modelcontextprotocol.io/docs/concepts/servers)
- [Transport 概念](https://modelcontextprotocol.io/docs/concepts/transports)
- [Build Server 教程（TS / Python）](https://modelcontextprotocol.io/docs/develop/build-server)

## GitHub 地址

[modelcontextprotocol](https://github.com/modelcontextprotocol) · [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) · [Python SDK](https://github.com/modelcontextprotocol/python-sdk)

## 幻灯片地址

<a href="/SlideStack/mcp-protocol-slide/" target="_blank">MCP 协议基础</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">MCP 协议基础测试题</a>
