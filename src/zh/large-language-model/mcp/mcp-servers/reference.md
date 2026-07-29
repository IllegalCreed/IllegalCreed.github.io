---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 modelcontextprotocol.io 官方规范（2025-11-25 当前最新版）+ 各 server 官方仓库 README 编写

## 速查

- 当前协议版本：**2025-11-25**（旧 HTTP+SSE 在 2025-03-26 起被 Streamable HTTP 取代）
- 两种传输：**stdio**（本地子进程）/ **Streamable HTTP**（远程端点）
- 三大原语：**Tools / Resources / Prompts**；`ToolAnnotations` 含 `readOnlyHint` / `idempotentHint` / `destructiveHint` / `openWorldHint`
- 配置文件：`claude_desktop_config.json`，顶层 `mcpServers`，每条 `command` / `args` / `env`
- Windows 坑：`npx` 用 `cmd /c npx ...` 包裹（`uvx` 不需要）
- 12 常用 server：Brave Search / GitHub / Context7 / Playwright / Chrome DevTools / Filesystem / SQLite / Notion / Sentry / Supabase / Figma / Blender
- 调试：`npx @modelcontextprotocol/inspector`
- 社区目录站：mcp.so / glama.ai / Smithery / MCPFind（均为社区维护）
- 完整说明见 [入门](./getting-started.md) / [常用 Server 深度对比](./guide-line.md)

## 协议版本演进

| 版本 | 关键变化 |
| --- | --- |
| **2024-11-05** | 初始公开版，定义 HTTP+SSE 旧传输 |
| **2025-03-26** | 引入 **Streamable HTTP** 取代 SSE；旧 SSE 仅作向后兼容 |
| **2025-06-18** | 中间稳定版 |
| **2025-11-25** | **当前最新版**，Streamable HTTP 主线 |

> 客户端向后兼容探测：先 POST `InitializeRequest`，若返回 400/404/405 再改 GET 拉 endpoint 事件降级走老 HTTP+SSE。

## 两种传输核心差异

| 维度 | stdio | Streamable HTTP |
| --- | --- | --- |
| 进程模型 | client 把 server 当子进程 | server 独立进程，可多 client |
| 消息通道 | stdin 读 / stdout 写 / stderr 日志 | 单一 endpoint，POST + GET（SSE 流） |
| 消息分隔 | 换行分隔，**不能含嵌入换行** | `MCP-Session-Id` + `MCP-Protocol-Version` 头 |
| 认证 | 进程级（无协议级 auth） | OAuth / Bearer Token |
| 典型场景 | 本地工具 | 远程 SaaS |

## 配置文件最小模板

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    },
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## 12 个常用 Server 速查

### Brave Search（搜索）

| 项 | 值 |
| --- | --- |
| 包名 | `@brave/brave-search-mcp-server` |
| 传输 | stdio |
| 认证 | `BRAVE_API_KEY`（必填）或 `BRAVE_API_KEY_FILE` |
| 工具数 | 7 |
| 关键工具 | `brave_web_search` / `brave_local_search` / `brave_news_search` / `brave_image_search` / `brave_video_search` / `brave_place_search` / `brave_summarizer` |

### GitHub（代码）

| 项 | 值 |
| --- | --- |
| 远程端点 | `https://api.githubcopilot.com/mcp/` |
| 本地镜像 | `ghcr.io/github/github-mcp-server` |
| 认证 | OAuth 或 `GITHUB_PERSONAL_ACCESS_TOKEN`（PAT 优先） |
| 工具集 | `context` / `repos` / `issues` / `pull_requests` / `users` / `actions` / `code_security` / `notifications` / `projects` / `discussions` |
| 默认开启 | `context + repos + issues + pull_requests + users` |

### Context7（文档）

| 项 | 值 |
| --- | --- |
| 远程端点 | `https://mcp.context7.com/mcp` |
| 本地包 | `@upstash/context7-mcp` |
| 认证 | `CONTEXT7_API_KEY`（可选，仅提速率） |
| 工作流 | `resolve-library-id` → `query-docs`（两步） |

### Playwright（浏览器自动化）

| 项 | 值 |
| --- | --- |
| 包名 | `@playwright/mcp@latest` |
| 传输 | stdio |
| 浏览器 | `chromium` / `firefox` / `webkit` / `msedge`（`--browser`） |
| 关键 flag | `--headless` / `--caps=vision`（坐标点击）/ `pdf` / `devtools` / `storage` / `network` |
| 默认交互 | accessibility tree（`browser_snapshot` 优于截图） |
| 危险工具 | `browser_run_code_unsafe`（等同 RCE） |

### Chrome DevTools（浏览器调试）

| 项 | 值 |
| --- | --- |
| 包名 | `chrome-devtools-mcp@latest` |
| 传输 | stdio |
| 工具数 | 52 |
| 关键 flag | `--headless` / `--isolated` / `--browser-url=http://127.0.0.1:9222` |
| 特殊能力 | `performance_start_trace` / `lighthouse_audit` / `take_heapsnapshot` / CrUX |
| Chrome 版本 | 144+ 支持 `--autoConnect` 直连 |

### Filesystem（本地文件）

| 项 | 值 |
| --- | --- |
| 包名 | `@modelcontextprotocol/server-filesystem` |
| 传输 | stdio + Roots 协议 |
| 工具数 | 13 |
| 允许目录 | CLI 参数（静态）或 Roots 协议（运行时动态） |
| 安全机制 | 所有工具 `openWorldHint=false`（防路径逃逸） |
| 关键工具 | `read_text_file` / `write_file` / `edit_file`（`dryRun` + diff）/ `search_files` / `directory_tree` |

### SQLite（数据库演示）

| 项 | 值 |
| --- | --- |
| 包名 | `mcp-server-sqlite`（via `uvx`） |
| 传输 | stdio |
| 数据库参数 | `--db-path` |
| 资源 | `memo://insights` |
| Prompt | `mcp-demo` |
| 状态 | **已归档**（仅 BI 演示定位） |

### Notion（知识库）

| 项 | 值 |
| --- | --- |
| 远程端点 | `mcp.notion.com`（推荐） |
| 本地包 | `makenotion/notion-mcp-server` |
| 认证 | OAuth + Dynamic Client Registration（远程）/ `NOTION_TOKEN`（本地） |
| 工具数 | 22（v2.0） |
| v2.0 变化 | database-centric → data source 抽象；新增 `retrieve-page-markdown` / `update-page-markdown` |

### Sentry（监控）

| 项 | 值 |
| --- | --- |
| 远程端点 | `https://mcp.sentry.dev/` |
| 本地包 | `getsentry/sentry-mcp` |
| 认证 | OAuth（远程）或 `SENTRY_AUTH_TOKEN` + org/project slug（本地） |

### Supabase（后端即服务）

| 项 | 值 |
| --- | --- |
| 包名 | `@supabase/mcp-server-supabase`（via `npx`） |
| 传输 | stdio |
| 认证 | Supabase 个人访问令牌（PAT） |

### Figma（设计稿）

| 项 | 值 |
| --- | --- |
| 官方 | Dev Mode MCP（远程，Figma 桌面会话本地 `3845` 端口，无需独立 key） |
| 社区 | `figma-developer-mcp`（Framelink），`--figma-api-key=YOUR-KEY` 或 env `FIGMA_API_KEY` |

### Blender（3D）

| 项 | 值 |
| --- | --- |
| 官方 | `blender.org/lab/mcp-server`（Blender 基金会 Lab） |
| 社区 | `ahujasid/blender-mcp`（addon + server 进程） |
| 风险 | 官方明说「无 guard 执行 LLM 代码」，**必须隔离环境运行** |

## 官方 servers 仓库活跃状态

| 状态 | server |
| --- | --- |
| **活跃维护** | Filesystem / Git / Memory / Fetch / Sequential Thinking / Time / Everything |
| **归档（servers-archived，read-only）** | Brave Search / GitHub / SQLite / Sentry / Slack / PostgreSQL / Puppeteer / Google Drive / Google Maps / GitLab / AWS KB |
| **接力维护** | Brave Search（`brave/brave-search-mcp-server`）/ GitHub（`github/github-mcp-server`）/ Sentry（`getsentry/sentry-mcp`） |

> 2025-05 起归档至 `servers-archived`，照搬老教程前先确认目标 server 是否已迁出。

## 五大安全攻击向量速查

| 攻击 | 入口 | 缓解 |
| --- | --- | --- |
| **Confused Deputy** | 静态 client_id + 动态注册 + 同意 cookie | 动态注册校验 redirect_uri；同意页 CSRF token |
| **Token Passthrough** | server 把 client token 不校验 audience 直接转发下游 | 只接受发给本 server 的 token；不透传 |
| **SSRF** | OAuth metadata URL 指向 `169.254.169.254` 元数据 | metadata IP allowlist；URL 解析校验 |
| **Session Hijacking** | 可预测 session ID 或拿 `MCP-Session-Id` 当认证 | session ID 用密码学随机，绑定 user_id，不当认证用 |
| **Local Server Compromise** | 恶意 startup command 藏 `curl` 外传 | 只跑可信源；逐条核对 command / args；最小权限用户 |

## 调试与目录站

- **MCP Inspector**：`npx @modelcontextprotocol/inspector`（浏览器 UI 调试 stdio / HTTP server）
- **社区目录站**：mcp.so、glama.ai/mcp、Smithery、MCPFind（**均为社区维护、非官方审核**）
- **官方 Registry**：在 modelcontextprotocol.io 体系内，servers 仓库 README 指向

## 官方资源

- 规范总入口：[https://modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- Transports 规范：[https://modelcontextprotocol.io/specification/2025-11-25/basic/transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- 安全最佳实践：[https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- MCP Inspector 文档：[https://modelcontextprotocol.io/docs/tools/inspector](https://modelcontextprotocol.io/docs/tools/inspector)
- 官方 servers 仓库：[https://github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- Inspector 仓库：[https://github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)
- GitHub MCP：[https://github.com/github/github-mcp-server](https://github.com/github/github-mcp-server)
- Notion MCP：[https://github.com/makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server)
- Sentry MCP：[https://github.com/getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp)
