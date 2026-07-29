---
layout: doc
outline: [2, 3]
---

# 常用 Server 深度对比

> 基于 modelcontextprotocol.io 官方规范（2025-11-25）+ 各 server 官方仓库 README + MCP 安全最佳实践编写

## 速查

- **Brave Search**（7 工具）：web / local / news / image / video / place / summarizer；非 Pro 计划 `brave_local_search` 回退到 web
- **GitHub**：远程 `api.githubcopilot.com/mcp/`，PAT 优先于 OAuth；`--toolsets` 按 context/repos/issues/pull_requests/users/actions 切工具集
- **Context7**：两步工作流（先 `resolve-library-id` 拿 `/org/project`，再 `query-docs`）；`CONTEXT7_API_KEY` 可选（仅提速率）
- **Playwright**：默认走 accessibility tree（`browser_snapshot` 优于截图），坐标模式需 `--caps=vision`；`browser_run_code_unsafe` 等同 RCE
- **Chrome DevTools**（52 工具）：Chrome 专用，核心价值在 `performance_start_trace` + `lighthouse_audit` + `take_heapsnapshot` + CrUX 真实用户数据
- **Filesystem**：13 个工具，`openWorldHint=false` 防路径逃逸；允许目录两套——CLI 参数（静态）vs Roots 协议（运行时动态）
- **SQLite**：`read_query` / `write_query` / `create_table` / `list_tables` / `append_insight` + `memo://insights` 资源；已归档，仅 BI 演示定位
- **Notion**（v2.0 共 22 工具）：远程 `mcp.notion.com` OAuth + Dynamic Client Registration（推荐）；本地用 `NOTION_TOKEN`；v2.0 database-centric → data source 抽象
- **Sentry**：远程 `mcp.sentry.dev` OAuth；本地设 `SENTRY_AUTH_TOKEN` + org/project slug
- **Supabase**：用 PAT，可建库 / 管理表 / 拉配置 / 查数据
- **Figma**：官方 Dev Mode MCP（桌面会话本地 3845，无需独立 key）；社区 Framelink（`--figma-api-key`）
- **Blender**：官方 Lab + 社区 ahujasid/blender-mcp；Blender 官方明说「无 guard 执行 LLM 代码，可能删 / 外传数据」，**必须隔离运行**
- 五大安全攻击向量：**Confused Deputy** / **Token Passthrough**（规范禁止）/ **SSRF**（OAuth metadata 指向 169.254.169.254）/ **Session Hijacking** / **Local MCP Server Compromise**
- 社区目录站：mcp.so / glama.ai / Smithery / MCPFind 均为社区维护，**非官方审核**

## 搜索类：Brave Search

**包名**：`@brave/brave-search-mcp-server`（MIT，7 工具）

| 工具 | 用途 |
| --- | --- |
| `brave_web_search` | 通用网页搜索 |
| `brave_local_search` | 本地搜索（自动位置过滤，Pro 计划才完整，否则回退 web） |
| `brave_news_search` | 新闻搜索（默认近 24h） |
| `brave_image_search` | 图像搜索 |
| `brave_video_search` | 视频搜索 |
| `brave_place_search` | 按坐标 / 地点 POI |
| `brave_summarizer` | 摘要（需 web search 返回的 summary key） |

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server"],
      "env": { "BRAVE_API_KEY": "BSAxxx_xxxxxxxxxxxxx" }
    }
  }
}
```

> `BRAVE_API_KEY` 必填（或 `BRAVE_API_KEY_FILE` 指向文件路径）。免费层有月度配额，超限降级为限速响应。

## 代码与文档类

### GitHub MCP

官方仓库 `github/github-mcp-server`（Go），双形态部署：

- **远程端点**：`https://api.githubcopilot.com/mcp/`，OAuth 浏览器流或 `Authorization: Bearer <PAT>`（PAT 优先于 OAuth）
- **本地 Docker**：`ghcr.io/github/github-mcp-server`，env `GITHUB_PERSONAL_ACCESS_TOKEN`

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx" }
    }
  }
}
```

**`--toolsets` 按需启用工具集**：`context` / `repos` / `issues` / `pull_requests` / `users` / `actions` / `code_security` / `notifications` / `projects` / `discussions`。默认 `context + repos + issues + pull_requests + users`，最小授权原则下应只开需要的几个。

> PAT scope 越小越好：仅读用 `repo:status` + `read:org`；要建 PR 才加 `repo`； Actions 操作才加 `workflow`。定期轮换。

### Context7 MCP

远程 `https://mcp.context7.com/mcp`（`CONTEXT7_API_KEY` 头）或本地 `npx @upstash/context7-mcp`。两步工作流：

1. **`resolve-library-id`**：传 `query` + 可选 `libraryName`，返回 `/org/project` 形式的 `libraryId`
2. **`query-docs`**：传 `libraryId` + `query`，返回匹配文档片段

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": { "CONTEXT7_API_KEY": "cmk_xxxxxxxx" }
    }
  }
}
```

> `CONTEXT7_API_KEY` 可选——不带也能用，只是 rate limit 低、容易被限速。

### Filesystem MCP

`@modelcontextprotocol/server-filesystem`（13 工具）：`read_text_file` / `read_media_file` / `read_multiple_files` / `list_directory` / `directory_tree` / `search_files` / `get_file_info` / `write_file` / `edit_file`（支持 `dryRun` + git 风格 diff）/ `create_directory` / `move_file` / `list_allowed_directories`。

**允许目录两套机制**

| 机制 | 来源 | 修改时机 |
| --- | --- | --- |
| CLI 参数 | `args` 末尾的位置参数 | 重启 server 才能改 |
| Roots 协议 | client 运行时 `roots/list_changed` 通知 | 动态替换，无需重启 |

> 所有工具 `openWorldHint=false`——这是防路径逃逸的核心机制。即使用户在 prompt 里写「读 `/etc/passwd`」，server 也只能在 allowlist 内操作。

### SQLite MCP

`mcp-server-sqlite`（via `uvx`，`--db-path`）：`read_query` / `write_query` / `create_table` / `list_tables` / `describe-table` / `append_insight`；含动态资源 `memo://insights`（BI 备忘录）+ `mcp-demo` 演示 prompt。

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/Users/me/test.db"]
    }
  }
}
```

> SQLite MCP **已归档至 servers-archived**，定位仅 BI 演示。绝不要把生产 MySQL / Postgres 直接挂可写 MCP——应只读 + 副本。

## 浏览器自动化类

### Playwright MCP

`@playwright/mcp@latest`（Microsoft）。默认走 accessibility tree（`browser_snapshot` 优于截图，截图不能用于操作）；坐标模式需 `--caps=vision` 显式开启。核心工具：`browser_navigate` / `browser_snapshot` / `browser_click` / `browser_type` / `browser_fill_form` / `browser_press_key` / `browser_hover` / `browser_drag` / `browser_take_screenshot` / `browser_find` / `browser_wait_for` / `browser_evaluate` / `browser_console_messages` / `browser_network_requests` / `browser_tabs` / `browser_close`。

**`--caps` 按需开**：`vision`（坐标点击）/ `pdf` / `devtools` / `storage` / `network`。

> `browser_run_code_unsafe` / `browser_evaluate` 等同 RCE——浏览器自动化类 server 必须认清「非安全边界」属性。`--allow-unrestricted-file-access`、网络 allowlist 都可被绕过，secrets 屏蔽只是便利非安全特性。

### Chrome DevTools MCP

`chrome-devtools-mcp@latest`（Google，52 工具）：`navigate_page` / `click` / `take_snapshot` / `take_screenshot`（png/jpeg/webp）/ `fill` / `fill_form` / `press_key` / `hover` / `evaluate_script` / `list_console_messages` / `list_network_requests` / `performance_start_trace` / `performance_analyze_insight` / `lighthouse_audit` / `take_heapsnapshot` / `list_pages` / `emulate` / `resize_page`。

**与 Playwright 的差异化定位**

| 维度 | Playwright MCP | Chrome DevTools MCP |
| --- | --- | --- |
| **浏览器支持** | chromium / firefox / webkit / msedge | Chrome 专用 |
| **核心价值** | 通用自动化、跨浏览器、强 accessibility tree | 性能 trace + Lighthouse + heap snapshot + CrUX |
| **default 交互** | accessibility tree（坐标模式需 `--caps=vision`） | 兼具 snapshot + screenshot |
| **特殊能力** | 多浏览器、storage state | `performance_start_trace` + `lighthouse_audit` + `take_heapsnapshot` |

> 性能 / 内存调试场景才选 Chrome DevTools MCP；通用自动化优先 Playwright MCP。`--browser-url=http://127.0.0.1:9222` 可连已开 Chrome；Chrome 144+ 支持 `--autoConnect` 直连。

## 数据与设计类

### Notion MCP

官方仓库 `makenotion/notion-mcp-server`（v2.0.0 共 22 工具）。

- **远程**（推荐）：`mcp.notion.com`，OAuth + **Dynamic Client Registration**（无需手动建 OAuth app）
- **本地**：stdio / HTTP 用 `NOTION_TOKEN`（内部集成令牌）

**v2.0 关键变化**

- 从 Notion API 旧版迁移到 **2025-09-03** 版
- database-centric 工具换成 **data source 抽象**：`query-data-source` / `create-a-data-source` / `move-page`
- 新增 token 友好的 `retrieve-page-markdown` / `update-page-markdown`（`replace_content` / `update_content`）

> Notion 官方明确「LLM 接入对工作区数据有非零风险」，建议先用 Read content 权限做只读 token 验证流程，再按需升级读写。旧教程的 `post-database-query` 等已删除，照抄会踩坑。

### Sentry MCP

官方仓库 `getsentry/sentry-mcp`。远程 `https://mcp.sentry.dev/` 走 OAuth 流；本地 / 自托管设 `SENTRY_AUTH_TOKEN` + org / project slug。作为 Sentry 上游 API 的中间件，提供 `search_issues` / `get_issue_details` / `list_projects` / 查询 releases 等。

### Supabase MCP

`@supabase/mcp-server-supabase`（via `npx`）：用 Supabase 个人访问令牌（PAT），可建库 / 管理表 / 拉配置 / 查数据。

### Figma MCP

- **官方 Dev Mode MCP**：远程，经 Figma 桌面会话本地 `3845` 端口，无需独立 API key
- **社区 Framelink**：`figma-developer-mcp`，`--figma-api-key=YOUR-KEY` 或 env `FIGMA_API_KEY`

### Blender MCP

- **Blender 基金会官方 Lab**：`blender.org/lab/mcp-server`
- **社区 ahujasid/blender-mcp**：addon + server 进程，暴露 Blender Python API

> Blender 官方明确「MCP server 会无 guard 执行 LLM 生成的代码，可能删除或外传你的数据」。社区 ahujasid/blender-mcp 同理，**必须在隔离环境运行**（容器 / 临时用户 / 限制文件系统权限）。

## 安全最佳实践（5 大攻击向量）

### 1. Confused Deputy（混淆代理）

server 持静态 `client_id` + 动态注册 + 同意 cookie，被诱导以合法 server 身份调用下游 API。

**缓解**：动态注册时校验 redirect_uri；同意页加 CSRF token + SameSite cookie。

### 2. Token Passthrough（规范明令禁止）

server 把 client 传来的 token 不校验 audience 直接转发给下游第三方 API——会绕过限流 / 审计 / 信任边界。

**缓解**：只接受明确发给本 server 的 token（校验 audience）；绝不透传。

### 3. SSRF（服务端请求伪造）

OAuth metadata URL 指向 `169.254.169.254`（AWS / GCP 元数据端点），server 去拉 metadata 拿云凭据。

**缓解**：metadata IP allowlist；URL 解析后校验非内网 / 元数据段。

### 4. Session Hijacking（会话劫持）

可预测 / 顺序 session ID，或用 `MCP-Session-Id` 做认证——攻击者借提示注入或冒充两条链劫持会话。

**缓解**：session ID 用密码学安全随机（UUID / JWT / 加密哈希），绑定 `user_id`（`<user_id>:<session_id>`），**绝不把 session 当认证用**。

### 5. Local MCP Server Compromise（本地 server 失陷）

恶意 startup command 藏 `curl` 外传 `~/.ssh` 或 `sudo rm -rf`——社区目录站配置直接复制粘贴启动即中招。

**缓解**：只跑可信源 server；逐条核对 `command` / `args` 来源与包名；用最小权限用户跑。

## 反模式（避坑）

- **明文密钥入 git**：把 `BRAVE_API_KEY` / `GITHUB_PERSONAL_ACCESS_TOKEN` / `SENTRY_AUTH_TOKEN` / `FIGMA_API_KEY` / `NOTION_TOKEN` 写进 `claude_desktop_config.json` 并提交——密钥应走 `env` + `.gitignore`
- **通配 scope**：用 `*` / `all` / `full-access` 或一次性申请全部 scopes——被盗后爆炸半径无限放大，审计无法区分操作意图
- **远程 server 不认证 + 绑 0.0.0.0 + 不校验 Origin**：经典 DNS rebinding 入口，远程恶意网页可直调本地 server
- **Token passthrough**：把 client 传来的 token 不校验 audience 直接转发下游——规范明令禁止
- **Session ID 当认证**：用可预测 / 顺序 session ID 或拿 `MCP-Session-Id` 做认证依据——Session Hijacking 直接冒充
- **本地 HTTP server 留 localhost 不加认证**：同机其他进程或经 DNS rebinding 的网页可任意调用（应要求 auth token 或改用 unix domain socket / stdio）
- **SQLite MCP 当生产数据库网关**：已归档、仅 BI 演示定位；生产库应只读 + 副本
- **混淆 Playwright 与 Chrome DevTools 定位**：前者跨浏览器通用自动化、强 accessibility tree；后者 Chrome 专用、核心在 performance trace + Lighthouse + heap snapshot + CrUX
- **Blender MCP 当生产工具无脑信任**：官方明说「无 guard 执行 LLM 代码，可能删 / 外传数据」，必须隔离环境运行
- **Notion MCP 第一天就用全读写 integration token**：应先 read-only 验证；v2.0 工具从 database-centric 迁到 data source 抽象，旧教程照抄会踩坑
- **盲目信任 mcp.so / glama.ai / Smithery 配置**：目录站均为社区维护（非官方审核），恶意 startup command 可藏 `curl` 外传 `~/.ssh`，必须逐条核对 `command` / `args` 来源与包名
- **Windows 漏 `cmd /c`**：`npx` 类 server 在 Windows 必须用 `cmd /c npx ...` 包裹（`uvx` 不需要）
- **Windows 路径反斜杠未转义**：JSON 字符串里 `C:\Users\me` 必须写 `C:\\Users\\me`

## 下一步

- [参考](./reference.md)：完整 server 配置清单、协议版本演进、官方资源链接
