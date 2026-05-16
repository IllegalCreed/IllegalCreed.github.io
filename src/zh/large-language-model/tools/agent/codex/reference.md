---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Codex CLI 0.130.x 编写。完整文档见 [developers.openai.com/codex](https://developers.openai.com/codex)。

## CLI 全 flag

```bash
codex [prompt] [flags]
codex <subcommand> [flags]
```

| Flag | 简写 | 说明 |
| --- | --- | --- |
| `--help` | `-h` | 帮助 |
| `--version` | `-v` | 版本 |
| `--model <id>` | `-m` | 指定模型 |
| `--cd <dir>` | `-C` | 指定工作目录 |
| `--image <path>` | `-i` | 附加图片到首条提示 |
| `--sandbox <mode>` | `-s` | sandbox 模式（read-only / workspace-write / danger-full-access） |
| `--ask-for-approval <mode>` | `-a` | 审批模式（untrusted / on-request / never） |
| `--full-auto` | | 等价 `--sandbox workspace-write --ask-for-approval on-request` |
| `--dangerously-bypass-approvals-and-sandbox` | | 完全跳过（容器内用） |
| `--profile <name>` | | 切换 profile |
| `--print-config` | | 启动时输出当前配置 |
| `--debug` | | 详细日志 |

### 子命令

| 命令 | 作用 |
| --- | --- |
| `codex` | 启动交互 TUI |
| `codex exec <prompt>` | 非交互单次执行 |
| `codex login` | OAuth / API key 认证 |
| `codex login --device-auth` | 设备授权码（SSH 等） |
| `codex resume` | 列出历史会话 |
| `codex resume --last` | 恢复上次会话 |
| `codex resume <session-id>` | 恢复指定会话 |
| `codex mcp` | 管理 MCP server |
| `codex cloud` | Codex Cloud 任务 |
| `codex sandbox` | 在 sandbox 内跑命令 |
| `codex app` | 启动桌面 App |
| `codex proto` | 调试协议（开发者用） |

```bash
# 单次执行
codex exec "总结 README.md 主要内容"

# 指定模型 + 模式
codex exec --model o3 -s workspace-write -a never "重构这个文件"

# 恢复上次
codex resume --last

# 用 --image 给图片
codex --image ./design.png "按图实现"
```

## 配置文件位置

| 路径 | 作用 | 优先级 |
| --- | --- | --- |
| `~/.codex/config.toml` | 用户全局配置 | 低 |
| `<project>/.codex/config.toml` | 项目共享（commit） | 中 |
| `<project>/.codex/config.local.toml` | 项目本地（不 commit） | 高 |
| `~/.codex/auth.json` | OAuth 凭据 | - |
| `~/.codex/AGENTS.md` | 用户全局说明书 | - |
| `<project>/AGENTS.md` | 项目说明书 | - |
| `<dir>/AGENTS.override.md` | 子目录覆盖 | - |
| `~/.codex/requirements.toml` | 企业强制配置 | 最高 |

## config.toml Schema

### 顶层字段

```toml
#:schema https://developers.openai.com/codex/config-schema.json

model = "gpt-5.5"
model_provider = "openai"
model_reasoning_effort = "medium"
model_context_window = 200000
service_tier = "fast"

sandbox_mode = "workspace-write"
approval_policy = "on-request"

project_doc_max_bytes = 32768
project_doc_fallback_filenames = ["TEAM_GUIDE.md"]
```

### `[features]` 字段

```toml
[features]
shell_tool = true
web_search = true
multi_agent = true
memories = false
codex_git_commit = true
unified_exec = true
hooks = true
```

### `[model_providers.<name>]` 字段

```toml
[model_providers.openai]
name = "OpenAI"
base_url = "https://api.openai.com/v1"
env_key = "OPENAI_API_KEY"
http_headers = { "X-Custom" = "value" }

[model_providers.azure]
name = "Azure OpenAI"
base_url = "https://<resource>.openai.azure.com/"
env_key = "AZURE_OPENAI_API_KEY"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"

[model_providers.anthropic]
name = "Anthropic"
base_url = "https://api.anthropic.com"
env_key = "ANTHROPIC_API_KEY"
```

### `[sandbox_workspace_write]` 字段

```toml
[sandbox_workspace_write]
network_access = true
writable_roots = ["/workspace", "/tmp"]
exclude_slash_tmp = false
exclude_tmpdir_env_var = false
```

### `[shell_environment_policy]` 字段

```toml
[shell_environment_policy]
inherit = "core"   # none / core / all
exclude = ["*KEY*", "*TOKEN*", "*SECRET*"]
include = ["PATH", "HOME", "USER"]
```

### `[mcp_servers.<name>]` 字段

```toml
[mcp_servers.github]
command = "npx -y @modelcontextprotocol/server-github"
enabled = true
required = false
startup_timeout_sec = 10
tool_timeout_sec = 60
enabled_tools = ["repos/list", "search"]
env = { GITHUB_TOKEN = "$GITHUB_TOKEN" }

# 远程 HTTP MCP
[mcp_servers.remote_server]
url = "https://my-mcp.example.com"
bearer_token_env_var = "MCP_TOKEN"
http_headers = { "X-Custom" = "value" }
```

### `[permissions.<policy>]` 字段

```toml
default_permissions = ":workspace"

[permissions.strict]

[permissions.strict.filesystem]
"/home/user/projects" = "write"
"/etc" = "read"
"**/*.env" = "none"

[permissions.strict.network]
enabled = true
mode = "limited"
domains = { "github.com" = "allow", "*.internal" = "deny" }
```

### `[profiles.<name>]` 字段

```toml
[profiles.development]
model = "gpt-5.5"
sandbox_mode = "danger-full-access"
approval_policy = "never"
web_search = "live"

[profiles.production]
model = "gpt-5.5"
sandbox_mode = "read-only"
approval_policy = "untrusted"
service_tier = "flex"
```

### `[tui]` 字段

```toml
[tui]
animations = true
notifications = true
theme = "dracula"   # default / dracula / solarized / 自定义
```

### `[memories]` 字段

```toml
[memories]
generate_memories = true
use_memories = true
max_rollout_age_days = 30
min_rollout_idle_hours = 6
extract_model = "gpt-5.5"
```

### `[tools.web_search]` 字段

```toml
web_search = "cached"   # disabled / cached / live

[tools.web_search]
context_size = "small"   # small / medium / large
allowed_domains = ["github.com", "stackoverflow.com"]
location = { country = "US", region = "CA" }
```

## 内置工具列表

| 工具 | 用途 |
| --- | --- |
| `shell` | 执行 shell 命令（受 sandbox 约束） |
| `apply_patch` | 应用 unified diff |
| `read` | 读文件 |
| `read_file` | 同上（别名） |
| `file_search` | 文件名模式匹配 |
| `grep` | 全文搜索 |
| `web_search` | Web 搜索 |
| `web_fetch` | 抓 URL |
| `image_input` | 解析图片 |
| `subagent` | spawn 子代理 |
| `mcp_tool` | 调 MCP server 提供的工具 |

## Slash 命令完整列表

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示帮助 |
| `/login` / `/logout` | 切账号 |
| `/model` | 切换模型 |
| `/approvals` | 切换审批模式 |
| `/sandbox` | 切换 sandbox 模式 |
| `/clear` | 清会话 |
| `/compact` | 压缩对话历史 |
| `/cost` | 看费用 |
| `/mcp` | 看 MCP server 状态 |
| `/review` | PR 风格代码评审 |
| `/init` | 生成 AGENTS.md |
| `/release-notes` | 看版本变更 |
| `/quit` | 退出 |

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | OpenAI API endpoint（自定义 / 代理） |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key |
| `OPENROUTER_API_KEY` | OpenRouter key |
| `ANTHROPIC_API_KEY` | Anthropic key（走 anthropic provider 时） |
| `CODEX_HOME` | 替代 `~/.codex` 路径 |
| `CODEX_LOG_LEVEL` | trace / debug / info / warn / error |
| `HTTPS_PROXY` / `HTTP_PROXY` | 网络代理 |
| `NO_PROXY` | 不走代理的主机 |

## 模型 ID 速查

### OpenAI 自家

| ID | 别名 | 上下文 | 用途 |
| --- | --- | --- | --- |
| `gpt-5.5` | GPT-5.5 | ~200K | 默认 / 旗舰 |
| `gpt-5.4` | GPT-5.4 | ~200K | 平衡 |
| `gpt-5.3-codex` | Codex 专用 | ~400K | 长上下文代码 |
| `o3` | o3 | ~200K | 深度推理 |
| `o4-mini` | o4-mini | ~128K | 快速 / 便宜 |

### 通过 provider 接入

| ID 示例 | provider | 用途 |
| --- | --- | --- |
| `anthropic/claude-opus-4-7` | OpenRouter | Anthropic 旗舰 |
| `google/gemini-2.5-pro` | OpenRouter | Google 长上下文 |
| `meta-llama/llama-3.1-405b` | OpenRouter | 开源大模型 |

## AGENTS.md 完整规范

### 发现顺序

1. `~/.codex/AGENTS.override.md`
2. `~/.codex/AGENTS.md`
3. 从 Git root 到当前目录每一层：先 `AGENTS.override.md` 再 `AGENTS.md`

### 大小限制

- 默认总大小 32 KiB（`project_doc_max_bytes`）
- 超过则停止加载后续文件

### 备用文件名

```toml
project_doc_fallback_filenames = ["TEAM_GUIDE.md", "PROJECT_GUIDE.md"]
```

### 验证生效

```bash
codex --ask-for-approval never \
  "Summarize the current instructions"
```

输出当前已加载的所有 AGENTS.md 合并摘要。

## 错误码

| 现象 | 含义 |
| --- | --- |
| `authentication_error` | OAuth 过期 / API key 无效 |
| `rate_limit_error` | 触发速率限制 |
| `context_length_exceeded` | 上下文窗口满 |
| `sandbox_denied` | 文件 / 命令超出 sandbox 范围 |
| `approval_required` | 用户拒绝某个工具调用 |
| `patch_apply_failed` | apply_patch 应用失败（冲突 / 路径错） |
| `mcp_connection_failed` | MCP server 启动失败 |
| `model_not_available` | 模型 ID 在当前 provider 不存在 |
| `provider_error` | provider API 报错 |

### 对应处理

- `authentication_error` → `codex login` 重 OAuth
- `rate_limit_error` → 切小模型 / 等几分钟
- `context_length_exceeded` → `/compact` 或换长上下文模型
- `sandbox_denied` → 切 `workspace-write` 或加 `writable_roots`
- `patch_apply_failed` → 让 Codex 重读文件后再 patch

## 价格速查（截至 2026）

按 token 计费（输入 / 输出价格不同），单位 $/1M tokens：

| 模型 | 输入 | 输出 | 缓存读 |
| --- | --- | --- | --- |
| GPT-5.5 | $10 | $30 | $1 |
| GPT-5.4 | $5 | $20 | $0.50 |
| GPT-5.3-Codex | $8 | $24 | $0.80 |
| o3 | $15 | $60 | $1.50 |
| o4-mini | $1 | $4 | $0.10 |

**ChatGPT 订阅**：Plus $20 / Pro $200 / Business $25 per seat / Enterprise 联系销售，订阅内含一定 Codex 额度。

::: tip 价格仅供参考
具体价格随版本可能调整，以 [openai.com/api/pricing](https://openai.com/api/pricing) 为准。
:::

## Agents SDK 嵌入

Codex 内核可通过 Agents SDK 嵌入自家应用：

```python
from openai import Agent

agent = Agent(
    model="gpt-5.5",
    instructions="You are a coding assistant.",
    tools=["shell", "apply_patch", "read"],
    sandbox_mode="workspace-write",
    approval_policy="on-request",
)

result = agent.run("帮我重构 utils.py")
```

详见 [Use Codex with the Agents SDK](https://developers.openai.com/codex/guides/agents-sdk)。

## 资源链接

- 官方文档：[developers.openai.com/codex](https://developers.openai.com/codex)
- CLI 参考：[developers.openai.com/codex/cli/reference](https://developers.openai.com/codex/cli/reference)
- AGENTS.md 指南：[developers.openai.com/codex/guides/agents-md](https://developers.openai.com/codex/guides/agents-md)
- 最佳实践：[developers.openai.com/codex/learn/best-practices](https://developers.openai.com/codex/learn/best-practices)
- Prompting 指南：[Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)
- GitHub：[openai/codex](https://github.com/openai/codex)
- 状态页：[status.openai.com](https://status.openai.com/)
- 桌面 / Web 入口：[chatgpt.com/codex](https://chatgpt.com/codex)
