---
layout: doc
---

# 常用 MCP Server 集成

「常用 MCP Server 集成」是把 Model Context Protocol（MCP）从规范落到生产的关键一环：在 LLM 客户端（Claude Desktop / Cursor / Cline 等）里通过 `claude_desktop_config.json` 配置一个或多个 **MCP Server**，让模型获得「联网搜索、读 GitHub、查最新文档、操作浏览器、读写本地文件、查数据库」等开箱能力。MCP 协议当前最新版为 **2025-11-25**，定义了 **stdio**（本地子进程）与 **Streamable HTTP**（远程端点，2025-03-26 起取代旧 HTTP+SSE）两种传输；三大原语 Tools / Resources / Prompts 由各 server 自行暴露。社区主流 server 可分四类：**搜索类**（Brave Search）、**代码与文档类**（GitHub / Context7 / Filesystem / SQLite）、**浏览器自动化类**（Playwright / Chrome DevTools）、**数据与设计类**（Notion / Sentry / Supabase / Figma / Blender）。每个 server 都有自己的一套安装方式（`npx` / `uvx` / Docker / 远程 URL）、认证机制（API Key / PAT / OAuth）与安全权衡——因为官方明确「**MCP Server 不是安全边界**」，本地 stdio server 与 client 同权限运行、远程 HTTP server 必须做 OAuth + Origin 校验。本主题覆盖 12 个常用 server 的安装配置、能力范围、认证模型与安全权衡，并介绍 MCP Inspector 调试工具与社区目录站（mcp.so / glama.ai / Smithery）的性质差异。

## 评价

**优点**

- **协议统一**：一份规范、两种传输，所有 server 共用 JSON-RPC + Tools/Resources/Prompts 三原语，客户端接入一次即可复用
- **生态丰富**：搜索、代码、浏览器、数据库、设计、办公、监控全覆盖，主流 SaaS（GitHub / Notion / Sentry / Supabase / Figma）官方维护
- **本地优先可控**：stdio 传输把 server 当子进程跑，数据不出本机；敏感操作可保留 human-in-the-loop
- **远程端点省心**：Streamable HTTP + OAuth Dynamic Client Registration（如 Notion / Sentry / GitHub），无需手动建 OAuth app、无需管本地进程
- **Inspector 调试闭环**：`npx @modelcontextprotocol/inspector` 浏览器 UI 直连，配置错误一眼可见
- **官方servers仓库活跃**：Filesystem / Git / Memory / Fetch / Sequential Thinking / Time 持续维护

**缺点**

- **非安全边界**：本地 stdio server 等同 client 权限运行，恶意/被注入的 server 等于任意代码执行；浏览器自动化类（`browser_evaluate` / `browser_run_code_unsafe`）等同 RCE
- **配置易出错**：Windows 下 `npx` 必须用 `cmd /c` 包裹；API Key 误写进 `claude_desktop_config.json` 提交 git 是高频事故
- **社区目录站参差**：mcp.so / glama.ai / Smithery / MCPFind 均为社区维护、非官方审核，恶意 startup command 可藏 `curl` 外传 `~/.ssh`
- **归档风险**：Slack / Google Drive / Puppeteer / PostgreSQL 等已归档至 `servers-archived`（read-only），照搬老教程会踩坑
- **远程传输有迁移成本**：旧 HTTP+SSE 在 2025-03-26 起被 Streamable HTTP 取代，老 server 探测需 POST 失败再降级
- **数据类 server 误操作风险**：Notion / Supabase / Sentry 直接对生产数据可写，LLM 误删页面/库的案例已多次出现

## 文档地址

- [MCP 官方规范总入口](https://modelcontextprotocol.io/specification/2025-11-25)
- [Transports 规范（stdio / Streamable HTTP）](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP 安全最佳实践](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [MCP Inspector 文档](https://modelcontextprotocol.io/docs/tools/inspector)

## GitHub地址

[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) · [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) · [github/github-mcp-server](https://github.com/github/github-mcp-server) · [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp)

## 幻灯片地址

<a href="/SlideStack/mcp-servers-slide/" target="_blank">常用 MCP Server 集成</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">常用 MCP Server 集成 测试题</a>
