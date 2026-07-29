---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 modelcontextprotocol.io 官方规范（2025-11-25 当前最新版）+ modelcontextprotocol/servers 仓库 README 编写

## 速查

- 两种传输：**stdio**（本地子进程，client 启动 server，stdin/stdout 走 JSON-RPC）与 **Streamable HTTP**（远程端点，POST 发请求 + GET 开 SSE 流，2025-03-26 起取代旧 HTTP+SSE）
- 三大原语：**Tools**（模型可调用函数）/ **Resources**（模型可读数据）/ **Prompts**（提示模板）；`ToolAnnotations` 含 `readOnlyHint` / `idempotentHint` / `destructiveHint` / `openWorldHint` 声明副作用
- 配置文件：**`claude_desktop_config.json`** 顶层 `mcpServers` 对象，每个 server 含 `command` / `args` / `env` 三字段
- Windows 坑：`npx` 命令必须用 `cmd /c npx ...` 包裹（`uvx` 不需要）
- 12 个常用 server 分四类：搜索（Brave Search）/ 代码文档（GitHub / Context7 / Filesystem / SQLite）/ 浏览器（Playwright / Chrome DevTools）/ 数据设计（Notion / Sentry / Supabase / Figma / Blender）
- API Key 三原则：走 `env` 字段、入 `.gitignore`、**绝不硬编码**进被提交的 config
- 调试：`npx @modelcontextprotocol/inspector` 浏览器 UI 跑 stdio / HTTP 两种传输
- 安全基线：**stdio 不是安全边界**，本地 server 与 client 同权限运行；远程 HTTP 必须做 OAuth + 校验 Origin + 只绑 `127.0.0.1`
- 协议版本：2024-11-05（HTTP+SSE）→ 2025-03-26（Streamable HTTP 取代 SSE）→ 2025-06-18 → **2025-11-25（当前）**

## MCP Server 是什么

MCP Server 是 Model Context Protocol 生态里的「能力提供方」——一个独立进程（本地子进程或远程 HTTP 服务），按 MCP 规范暴露一组 **Tools**（模型可调用函数）、**Resources**（模型可读数据）、**Prompts**（可复用提示模板），让接入的 LLM 客户端获得原本没有的能力。它的核心定位有三：

- **协议统一**：所有 server 共用 JSON-RPC + 三原语，客户端接入一次即可复用任意 server
- **本地与远程并存**：stdio 把 server 当子进程跑（数据不出本机）；Streamable HTTP 走远程端点 + OAuth
- **官方servers仓库 + 各厂官方维护**：Filesystem / Git / Memory 等在 modelcontextprotocol/servers；GitHub / Notion / Sentry / Supabase 各有官方仓库

> MCP Server ≠ 安全边界。本地 stdio server 与 MCP client 同权限运行；远程 HTTP server 必须做 OAuth + Origin 校验。任何敏感/破坏性操作都应保留 human-in-the-loop。

## 两种传输

| 维度 | stdio | Streamable HTTP |
| --- | --- | --- |
| **谁启动** | client 把 server 当**子进程**启动 | server 独立进程，可多 client 连接 |
| **消息通道** | stdin 读 / stdout 写，stderr 仅日志 | 单一 endpoint，POST 发请求 + GET 开 SSE 流 |
| **认证** | 进程级（无协议级 auth） | OAuth / Bearer Token |
| **典型场景** | 本地工具（Filesystem / SQLite / Playwright） | 远程 SaaS（GitHub / Notion / Sentry / Context7） |
| **协议版本** | 全版本支持 | 2025-03-26 起取代旧 HTTP+SSE |

> 旧 HTTP+SSE 在 2025-03-26 版起被 Streamable HTTP 取代，旧端点仅作向后兼容保留。客户端探测时先 POST InitializeRequest，返回 400/404/405 才降级走老 SSE。

## 三大原语

| 原语 | 含义 | 典型例子 |
| --- | --- | --- |
| **Tools** | 模型可调用的函数（带副作用） | `brave_web_search` / `read_text_file` / `browser_click` |
| **Resources** | 模型可读的数据 / 文件（只读） | `memo://insights`（SQLite 备忘录）、`file:///project/README.md` |
| **Prompts** | 可复用的提示模板 | `mcp-demo`（SQLite 演示）、`code-review` |

`ToolAnnotations` 四个 hint 声明副作用，让客户端决定是否需人类确认：

| hint | 默认 | 含义 |
| --- | --- | --- |
| `readOnlyHint` | false | 是否纯读无副作用 |
| `destructiveHint` | true | 是否有破坏性（删文件 / 改库） |
| `idempotentHint` | false | 是否幂等（重复调用等价单次） |
| `openWorldHint` | true | 是否与外部世界交互（防路径逃逸的关键） |

> Filesystem MCP 所有工具 `openWorldHint=false`，是防路径逃逸的核心机制——一旦设为 false，工具只能在 client 授权的目录内操作。

## 配置文件结构

`claude_desktop_config.json` 是 Claude Desktop 接入 MCP Server 的入口（Cursor / Cline / Windsurf 各有自己等价配置）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/me/projects"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    }
  }
}
```

**三字段速查**

| 字段 | 作用 | 典型值 |
| --- | --- | --- |
| `command` | 启动命令 | `npx` / `uvx` / `node` / `cmd` / `docker` |
| `args` | 命令参数数组 | `["-y", "@modelcontextprotocol/server-filesystem", "/path"]` |
| `env` | 环境变量（API Key / Token） | `{ "BRAVE_API_KEY": "..." }` |

**Windows 平台坑**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\me\\projects"]
    }
  }
}
```

> Windows 下 `npx` 必须用 `cmd /c npx ...` 包裹，否则 Claude Desktop 找不到可执行文件；`uvx`（Python 包）无此问题。

## 12 个常用 Server 速览

| Server | 包名 / 端点 | 传输 | 认证 |
| --- | --- | --- | --- |
| **Brave Search** | `@brave/brave-search-mcp-server` | stdio | `BRAVE_API_KEY` |
| **GitHub** | `ghcr.io/github/github-mcp-server` 或 `https://api.githubcopilot.com/mcp/` | stdio / HTTP | PAT（PAT 优先于 OAuth） |
| **Context7** | `@upstash/context7-mcp` 或 `https://mcp.context7.com/mcp` | stdio / HTTP | `CONTEXT7_API_KEY`（可选） |
| **Playwright** | `@playwright/mcp@latest` | stdio | 无（本地浏览器） |
| **Chrome DevTools** | `chrome-devtools-mcp@latest` | stdio | 无（本地 Chrome） |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | stdio + Roots | 本地路径 allowlist |
| **SQLite** | `mcp-server-sqlite`（uvx） | stdio | `--db-path` |
| **Notion** | `mcp.notion.com`（推荐）或 `makenotion/notion-mcp-server` | HTTP / stdio | OAuth（远程）或 `NOTION_TOKEN`（本地） |
| **Sentry** | `https://mcp.sentry.dev/` 或 `getsentry/sentry-mcp` | HTTP / stdio | OAuth 或 `SENTRY_AUTH_TOKEN` |
| **Supabase** | `@supabase/mcp-server-supabase` | stdio | Supabase PAT |
| **Figma** | Figma Dev Mode MCP（本地 3845）或 `figma-developer-mcp` | HTTP / stdio | 桌面会话或 `FIGMA_API_KEY` |
| **Blender** | `blender.org/lab/mcp-server` 或 `ahujasid/blender-mcp` | stdio | 无（本地 Blender） |

> 官方 servers 仓库（modelcontextprotocol/servers）当前活跃维护：Filesystem / Git / Memory / Fetch / Sequential Thinking / Time / Everything；Brave Search / GitHub / SQLite / Sentry / Slack / PostgreSQL 等已于 2025-05 归档至 `servers-archived`（read-only），但各厂官方仓库接力维护。

## Inspector 调试

```bash
# 启动 Inspector（默认开浏览器）
npx @modelcontextprotocol/inspector

# 直接连某个 server
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem /tmp
```

Inspector 在浏览器 UI 里：

- 选 stdio 或 Streamable HTTP 传输
- 直接发起 `tools/list` / `tools/call` / `resources/list` 等 JSON-RPC 调用
- 实时看 server 日志、定位配置错误（Windows 漏 `cmd /c`、路径错、token 错等）

> 上线前用 Inspector 交互式验证 server 行为，再接入客户端——能避免 80% 的配置类问题。

## 下一步

- [常用 Server 深度对比](./guide-line.md)：12 个 server 的能力边界、认证模型、安全权衡、官方安全最佳实践（5 大攻击向量）
- [参考](./reference.md)：完整 server 配置清单、协议版本演进、官方资源链接
