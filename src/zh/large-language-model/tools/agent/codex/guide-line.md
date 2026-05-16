---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Codex CLI 0.130.x 编写（2026 年 5 月）

## 速查

- 模型切换：`/model` 或 `codex --model gpt-5.5`
- 配置文件：`~/.codex/config.toml` + `~/.codex/auth.json`
- 项目说明：`AGENTS.md`（根目录），`AGENTS.override.md`（子目录覆盖）
- Sandbox：`read-only` / `workspace-write` / `danger-full-access`
- 审批：`untrusted` / `on-request` / `never`
- 一键全自动：`codex --full-auto`（等价 `--sandbox workspace-write --ask-for-approval on-request`）
- 完全跳过：`--dangerously-bypass-approvals-and-sandbox`（仅 sandbox 容器用）
- profiles：`[profiles.dev]` / `--profile dev`
- 恢复会话：`codex resume --last`
- 非交互：`codex exec "<prompt>"`

## 模型选择

Codex CLI 支持完整 OpenAI 模型矩阵 + 第三方 provider 模型。

### OpenAI 自家模型

| 模型 ID | 别名 | 适合 |
| --- | --- | --- |
| `gpt-5.5` | GPT-5.5（默认） | 日常编码 / 复杂规划 |
| `gpt-5.4` | GPT-5.4 | 平衡性能 / 速度 |
| `gpt-5.3-codex` | Codex 专用变体 | 长上下文代码场景 |
| `o3` | o-series 旗舰 | 高难度推理 / 多步规划 |
| `o4-mini` | 轻量 o-series | 快速 / 便宜 |

**何时切**：

- 复杂方案设计 → `o3`
- 写实现 / 改 bug → `gpt-5.5`（90% 时间用它）
- 简单 grep / 一行答 → `o4-mini`
- 大代码理解 → `gpt-5.3-codex`

```bash
# 启动时指定
codex --model gpt-5.5
codex --model o3
codex --model o4-mini

# 交互里切
/model
```

### reasoning_effort 参数

部分模型支持调推理深度：

```toml
# ~/.codex/config.toml
model = "gpt-5.5"
model_reasoning_effort = "high"   # low / medium / high / extra-high
```

低复杂度任务用 `low` 省钱，高难度调试用 `high` / `extra-high`。

## 配置文件：config.toml

完整字段：

```toml
# ~/.codex/config.toml

# === 模型 ===
model = "gpt-5.5"
model_provider = "openai"
model_reasoning_effort = "medium"
model_context_window = 200000
service_tier = "fast"   # fast / flex

# === Sandbox 与审批 ===
sandbox_mode = "workspace-write"
approval_policy = "on-request"

# === 功能开关 ===
[features]
shell_tool = true
web_search = true
multi_agent = true
memories = false
codex_git_commit = true
unified_exec = true
hooks = true

# === Shell 环境策略 ===
[shell_environment_policy]
inherit = "core"
exclude = ["*KEY*", "*TOKEN*", "*SECRET*"]

# === TUI 风格 ===
[tui]
animations = true
notifications = true
theme = "dracula"
```

::: tip 项目级 config

可在项目根放 `.codex/config.toml`，覆盖用户级配置。优先级：项目级 > 用户级。

:::

### Provider 配置

#### OpenAI（默认）

```toml
model = "gpt-5.5"
model_provider = "openai"

[model_providers.openai]
base_url = "https://api.openai.com/v1"
env_key = "OPENAI_API_KEY"
```

#### Azure OpenAI

```toml
model_provider = "azure"

[model_providers.azure]
base_url = "https://<resource>.openai.azure.com/"
env_key = "AZURE_OPENAI_API_KEY"
http_headers = { "api-key" = "$AZURE_OPENAI_API_KEY" }
```

#### OpenRouter（接 Anthropic / Google / 本地模型）

```toml
model = "anthropic/claude-opus-4-7"
model_provider = "openrouter"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"
```

#### Anthropic 直连

```toml
model = "claude-opus-4-7"
model_provider = "anthropic"

[model_providers.anthropic]
name = "Anthropic"
base_url = "https://api.anthropic.com"
env_key = "ANTHROPIC_API_KEY"
```

## Sandbox：三层文件系统隔离

| Mode | 行为 | 适合 |
| --- | --- | --- |
| `read-only` | 仅读，不能写 / 执行命令 | 探索陌生仓库 / 审计 |
| `workspace-write` | 在当前工作目录写 / 执行；不可触外部 | 日常开发（**默认**） |
| `danger-full-access` | 全机器随便写 / 执行 | sandbox 容器 / Docker 内 |

### workspace-write 配置

```toml
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true               # 允许联网
writable_roots = ["/workspace", "/tmp"]   # 允许写的路径
exclude_slash_tmp = false           # 是否排除 /tmp
exclude_tmpdir_env_var = false      # 是否排除 $TMPDIR
```

启动时切换：

```bash
codex --sandbox read-only        # 只读
codex --sandbox workspace-write  # 默认
codex --sandbox danger-full-access  # 危险（仅容器内）
```

::: warning danger-full-access 慎用

只在 **Docker / 一次性 VM** 内使用。Codex 可能跑任意 shell 命令——本地直接开等于把机器交给模型。

:::

## Approval：何时打断问用户

| Policy | 行为 |
| --- | --- |
| `untrusted` | 所有命令都问 |
| `on-request` | 模型自决「该问就问」（默认） |
| `never` | 从不问（适合 CI / `--full-auto`） |

```bash
codex --ask-for-approval untrusted
codex -a never
```

### granular 模式

更细粒度控制：

```toml
approval_policy = { granular = {
    sandbox_approval = true,         # 切 sandbox 模式
    rules = true,                    # 修改规则
    mcp_elicitations = false,        # MCP 询问
    request_permissions = true,      # 权限提升
    skill_approval = true            # 触发 skill
} }
```

适合企业内多 reviewer 场景。

## --full-auto vs --dangerously-bypass

两种「自动跑」的模式：

| Flag | sandbox | approval | 适合 |
| --- | --- | --- | --- |
| `--full-auto` | `workspace-write` | `on-request` | 日常自动化 |
| `--dangerously-bypass-approvals-and-sandbox` | `danger-full-access` | `never` | 容器 / CI |

```bash
# 日常：相对安全的自动模式
codex --full-auto "重构这个文件"

# 容器：完全放开（慎用！）
codex --dangerously-bypass-approvals-and-sandbox \
  "跑所有测试 + 自动修复 + commit"
```

## Profiles：多套配置切换

```toml
[profiles.development]
model = "gpt-5.5"
sandbox_mode = "workspace-write"
approval_policy = "on-request"
web_search = "live"

[profiles.production]
model = "gpt-5.5"
sandbox_mode = "read-only"
approval_policy = "untrusted"
service_tier = "flex"

[profiles.enterprise]
sandbox_mode = "workspace-write"
approval_policy = { granular = { sandbox_approval = true } }
approvals_reviewer = "auto_review"
```

启动时切 profile：

```bash
codex --profile development
codex --profile production
codex --profile enterprise
```

适合：本地探索 / 生产 review / 企业合规三套不同策略。

## AGENTS.md：项目说明书

Codex 启动时按以下顺序加载所有 AGENTS.md 文件：

1. `~/.codex/AGENTS.override.md`（全局覆盖）
2. `~/.codex/AGENTS.md`（全局默认）
3. Git 根 → 当前目录每层的 `AGENTS.override.md`
4. Git 根 → 当前目录每层的 `AGENTS.md`

**合并策略**：离当前目录越近的越后追加，自然覆盖之前的指南。

### 默认大小限制

```toml
# ~/.codex/config.toml
project_doc_max_bytes = 32768   # 默认 32 KiB
project_doc_fallback_filenames = ["TEAM_GUIDE.md", "PROJECT_GUIDE.md"]
```

超过总大小后 Codex 会停止加载——大型仓库建议拆到子目录里写专项 `AGENTS.md`。

### AGENTS.md 内容建议

> 来自官方 best-practices：「短而精确的 AGENTS.md 比长而模糊的更有用」

四要素：

```md
# 项目说明

## 仓库布局
- `apps/web/`：前端 Vue 3
- `apps/api/`：后端 NestJS
- `packages/ui/`：共享组件

## 构建命令
- `pnpm dev`：启动开发
- `pnpm test`：单元测试
- `pnpm build`：生产构建

## 工程约定
- TS 严格模式
- 提交用 conventional commit
- 不要 commit `.env`

## 验证方法
- 改动后必须 `pnpm lint && pnpm test`
- E2E 改动还需 `pnpm test:e2e`
```

### 验证 AGENTS.md 生效

```bash
codex --ask-for-approval never "Summarize the current instructions"
```

Codex 会输出**当前已加载的所有 AGENTS.md 内容合并后的摘要**，方便检查覆盖路径。

## 内置工具

| 工具 | 用途 |
| --- | --- |
| `shell` | 执行 shell 命令（受 sandbox 约束） |
| `apply_patch` | 应用 unified diff 风格的代码修改 |
| `read` / `read_file` | 读文件 |
| `file_search` | 文件名 / 路径模式搜索 |
| `grep` | 全文搜索 |
| `web_search` | Web 搜索 |
| `web_fetch` | 抓 URL |
| `image_input` | 读图片 / 截图 |
| `subagent` | spawn 子代理（独立上下文） |

### apply_patch：核心编辑工具

Codex 不直接调 `write_file` 覆盖文件，而是用 **unified diff**：

```diff
*** Begin Patch
*** Update File: src/utils/format.ts
@@
-export function formatDate(date: Date): string {
-  return date.toISOString();
+export function formatDate(date: Date, locale = "zh-CN"): string {
+  return new Intl.DateTimeFormat(locale).format(date);
 }
*** End Patch
```

apply_patch 工具会：

1. 验证 patch 语法
2. 检查待改文件存在 + 未冲突
3. 应用 + 报告结果

::: tip 为什么用 patch 而非全文件写
对大文件来说，**只传 diff 比传完整内容省 90% 的 token**。Claude Code 的 `Edit` 工具同理。
:::

## MCP（Model Context Protocol）

Codex 一类支持 MCP，配置在 `config.toml` 中：

```toml
# Stdio MCP（最常见）
[mcp_servers.github]
command = "npx -y @modelcontextprotocol/server-github"
enabled = true
required = false
startup_timeout_sec = 10
tool_timeout_sec = 60
enabled_tools = ["repos/list", "search", "create_pr"]

[mcp_servers.context7]
command = "npx -y @upstash/context7-mcp"

# 远程 HTTP MCP
[mcp_servers.anthropic_remote]
url = "https://example.com/mcp"
bearer_token_env_var = "MCP_TOKEN"
http_headers = { "X-Custom" = "value" }
```

启动后 `/mcp` 看连接状态：

```
github                ✓ connected   (3 tools enabled)
context7              ✓ connected   (2 tools)
anthropic_remote      ✓ connected   (5 tools)
```

### 常用 MCP server

| Server | 提供工具 |
| --- | --- |
| `@modelcontextprotocol/server-github` | Issue / PR / Repo 操作 |
| `@modelcontextprotocol/server-filesystem` | 受限文件读写 |
| `@modelcontextprotocol/server-postgres` | Postgres 查询 |
| `@upstash/context7-mcp` | 最新库文档查询 |
| `chrome-devtools-mcp` | 浏览器操作 |
| `brave-search-mcp` | Brave Search |

::: tip MCP 工具白名单

`enabled_tools = [...]` 字段可指定**只启用部分工具**，减少模型选择空间，提升准确率。

:::

## Permissions：细粒度权限

```toml
default_permissions = ":workspace"

[permissions.custom_policy]

[permissions.custom_policy.filesystem]
"/home/user/projects" = "write"
"/etc" = "read"
"**/*.env" = "none"   # 拒绝读 .env

[permissions.custom_policy.network]
enabled = true
mode = "limited"
domains = { "github.com" = "allow", "*.internal" = "deny" }
unix_sockets = { "/var/run/docker.sock" = "allow" }
```

可定义多套 policy，按 profile 切换。

## Subagents：并行任务

Codex 支持 spawn 子代理：

```toml
[features]
multi_agent = true
```

在交互里：

```
> 帮我并行做三件事：
>   1. 用子代理查找所有 React 组件
>   2. 用子代理总结测试覆盖率
>   3. 用子代理评审 PR #123
```

子代理独立上下文跑，主线程只看最终报告——避免上下文爆炸。

## Web Search

```toml
web_search = "cached"   # disabled / cached / live

[tools.web_search]
context_size = "medium"
allowed_domains = ["github.com", "stackoverflow.com"]
location = { country = "US", region = "CA" }
```

- `cached`：用预索引快照（便宜 + 快）
- `live`：实时网搜（贵 + 信息新）
- `disabled`：关闭

## Hooks：生命周期注入

::: tip Hooks 功能

Codex 的 hooks 在 `[hooks]` 配置块中，但相比 Claude Code 的成熟度略低。具体行为以最新版本文档为准。

:::

```toml
[features]
hooks = true

[hooks]
# 生命周期事件触发的命令
# pre_shell / post_shell / pre_patch / post_patch 等
```

适合：审计 / 自动 lint / 通知。

## Memory（持久化记忆）

```toml
[features]
memories = true

[memories]
generate_memories = true
use_memories = true
max_rollout_age_days = 30
min_rollout_idle_hours = 6
extract_model = "gpt-5.5"
```

Codex 会从历史会话中提取知识，下次自动复用。**注意：默认关闭**，需手动开启。

## /review 命令：代码评审

```
> /review
```

或在 PR 风格审查：

```bash
codex exec --sandbox read-only \
  "Review the diff between main and HEAD"
```

GitHub 集成后可触发 PR 自动评审。

## 与 Claude Code 对比

::: tip 重点对比（多 Agent 共用场景）

如果你**同时用 Claude Code 和 Codex**，下表帮你定位差异：

:::

| 维度 | Codex CLI | Claude Code |
| --- | --- | --- |
| 模型 | GPT-5.5 / o-series（默认）+ 任意 provider | Anthropic Opus / Sonnet / Haiku |
| 上下文 | ~200K（取决于模型） | 200K / 1M |
| 项目说明 | `AGENTS.md` | `CLAUDE.md` |
| 子目录覆盖 | ✓（`AGENTS.override.md`） | ✗ |
| Sandbox | 三层 + 配置丰富 | 权限规则（PermissionRule） |
| 审批 | `untrusted` / `on-request` / `never` | `default` / `acceptEdits` / `bypassPermissions` / `plan` |
| Profiles | ✓（多套配置） | ✗（单一 settings.json） |
| Skills | ✗（无等价机制） | ✓（社区生态） |
| Hooks | 配置块存在，功能受限 | ✓（成熟） |
| MCP | ✓（一类） | ✓（一类） |
| 多 Provider | ✓（OpenAI / Azure / Anthropic / OpenRouter） | ✗（仅 Anthropic + Bedrock / Vertex） |
| 开源 | ✓（Apache-2.0，Rust） | ✗ |
| 编辑机制 | `apply_patch`（unified diff） | `Edit`（string replace） |
| IDE | VS Code / Cursor / Windsurf | VS Code / JetBrains |
| 中国可用 | 需自备网络 | 需自备网络 |

### 双工具共用建议

- **AGENTS.md 与 CLAUDE.md 并存**：两个文件内容相同，分别由两个 Agent 识别
- **`.gitignore` 加 `~/.codex/auth.json`**：别误提交凭据
- **profiles 对应 settings.json**：Codex profiles 可类比 Claude Code 的多套 settings
- **MCP 配置可复用**：MCP 协议是开放的，同一个 server 两边都能接

## 大陆访问

Codex CLI 调 OpenAI / 第三方 API，**国内直连均不通**。三种方案：

| 方案 | 适合 | 操作 |
| --- | --- | --- |
| 代理（VPN / 机场） | 个人 | `HTTPS_PROXY=http://localhost:7890 codex` |
| OpenRouter 中转 | 团队 | 配置 OpenRouter provider |
| Azure 国际版 | 企业 | 配置 Azure provider（**香港/新加坡区**） |

```toml
# 通过 OpenRouter 访问 OpenAI 模型（OpenRouter 在多地有节点）
model = "openai/gpt-5.5"
model_provider = "openrouter"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"
```

::: warning Azure 国内合规
微软在大陆有 Azure 实例，但 **Azure OpenAI 在国内 region 暂未开放**。需配置 Azure 国际 region（如 East US）。
:::

## 性能优化

<v-clicks>

- **大仓库**：用支持长上下文的模型（如 `gpt-5.3-codex`），或先 `/compact` 压缩
- **多文件读取慢**：一次 message 批量调多个 read 工具
- **MCP 启动慢**：`enabled_tools` 限制工具数 + `startup_timeout_sec` 调短
- **shell 命令拖慢**：sandbox 越严越慢；信任的命令加 `allowed_commands` 白名单
- **频繁 patch 失败**：让 Codex 先 read 全文再 patch，减少冲突
- **reasoning_effort**：简单任务降到 `low`，省 token + 快

</v-clicks>

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `authentication_error` | `codex login` 重 OAuth / 检查 `OPENAI_API_KEY` |
| 模型回复总是被截断 | 上下文窗口满了 → `/compact` 或切大上下文模型 |
| MCP server 红色未连接 | 终端跑 server 命令看错 / `enabled = false` 单独禁 |
| patch 应用失败 | 文件被改过 → 让 Codex 重读后再 patch |
| sandbox 拒绝写入 | 路径不在 `writable_roots` 内 / 切 `workspace-write` |
| 中国大陆连不上 | 自备网络 / OpenRouter / Azure |
| 高 token 用量 | `/cost` 看分布 + 降 `reasoning_effort` + 用小模型 |
| AGENTS.md 未生效 | 检查总大小是否超 `project_doc_max_bytes` |

## 安全考量

<v-clicks>

- **`--dangerously-bypass-approvals-and-sandbox` 仅容器内用**：本地直接开等于交出机器
- **`~/.codex/auth.json` 不要提交**：里面有凭据
- **`shell_environment_policy` 屏蔽敏感环境变量**：`exclude = ["*KEY*", "*TOKEN*"]`
- **`enabled_tools` 白名单 MCP 工具**：减少模型可调用的攻击面
- **AGENTS.md 是 prompt injection 面**：克隆陌生仓库先看 AGENTS.md 内容
- **sandbox 默认 workspace-write**：不要降到 danger-full-access

</v-clicks>

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.1 | 2025 初 | 首个公测版（Rust 重写） |
| 0.5 | 2025 中 | Sandbox / Approval 三档体系 |
| 0.10 | 2025 末 | MCP 一类支持 / profiles |
| 0.50 | 2026 Q1 | AGENTS.md `override` 机制 / multi-agent |
| 0.130 | 2026 Q2 | 当前版本 / 完整 features 体系 / unified_exec |
