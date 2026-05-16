---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenCode 2026 版编写。完整文档见 [opencode.ai/docs](https://opencode.ai/docs)。

## CLI 子命令

```bash
opencode [command] [flags]
```

| 命令 | 说明 |
| --- | --- |
| `opencode` | 启动 TUI（默认） |
| `opencode run "<prompt>"` | 单次非交互执行 |
| `opencode auth login` | 登录 provider |
| `opencode auth list` | 列出已配 provider |
| `opencode session list` | 列出 session |
| `opencode session show <id>` | 查看指定 session |
| `opencode session delete <id>` | 删除 session |
| `opencode session export <id>` | 导出 session 为 JSON |
| `opencode session import` | 导入 session JSON |
| `opencode models` | 列出可用模型 |
| `opencode agent list` | 列出可用 agent |
| `opencode agent create` | 引导创建自定义 agent |
| `opencode serve` | 启 HTTP API server |
| `opencode web` | 启浏览器 Web UI |
| `opencode attach <url>` | 接已存在的远程实例 |
| `opencode github install` | 安装 GitHub Action |
| `opencode github run` | 在 PR 跑 OpenCode |
| `opencode upgrade` | 升级到最新版 |

## CLI flag

| Flag | 说明 |
| --- | --- |
| `-h, --help` | 帮助 |
| `-v, --version` | 版本 |
| `-c, --continue` | 继续上次 session |
| `-m, --model <provider/model>` | 指定模型 |
| `--agent <name>` | 指定 agent |
| `--cwd <dir>` | 工作目录 |
| `--config <path>` | 指定配置文件 |
| `--format <text|json>` | 输出格式（run / session show 用） |
| `--debug` | 详细日志 |
| `--print-config` | 启动时输出当前配置 |
| `--no-lsp` | 禁用 lsp 工具 |
| `--port <n>` | serve / web 端口 |
| `--password <pwd>` | serve 鉴权密码 |

```bash
# 脚本模式
opencode run "lint 检查" --model anthropic/claude-sonnet-4-6 --format json

# 继续上次 + 新提示
opencode --continue "再补一段例子"

# 启 API server（CI 用）
opencode serve --port 8080 --password secret123
```

## 配置文件位置

| 路径 | 作用 | 优先级 |
| --- | --- | --- |
| `.well-known/opencode`（远程） | 组织默认 | 1（最低） |
| `~/.config/opencode/opencode.json` | 用户全局 | 2 |
| `$OPENCODE_CONFIG` | 自定义路径 | 3 |
| `<project>/opencode.json` | 项目共享 | 4 |
| Managed settings（admin） | 强制 | 5（最高） |

| 路径 | 作用 |
| --- | --- |
| `~/.local/share/opencode/auth.json` | provider 凭据（不 commit） |
| `~/.config/opencode/tui.json` | TUI 主题 / 键位 |
| `<project>/AGENTS.md` | 项目说明书 |
| `~/.config/opencode/AGENTS.md` | 全局说明书 |
| `<project>/.opencode/commands/<name>.md` | 项目级命令 |
| `~/.config/opencode/commands/<name>.md` | 用户级命令 |
| `<project>/.opencode/agents/<name>.md` | 项目级 agent |
| `~/.local/share/opencode/logs/` | 日志 |

## opencode.json schema

### 顶层字段

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-6",
  "small_model": "anthropic/claude-haiku-4-5",
  "provider": { /* provider 配置 */ },
  "permission": { /* 权限规则 */ },
  "agent": { /* 自定义 agent */ },
  "command": { /* 内联命令 */ },
  "mcp": { /* MCP server */ },
  "plugin": [ /* 插件 */ ],
  "instructions": [ /* 引用规则文件 */ ],
  "snapshot": { "enabled": true },
  "server": {
    "port": 8080,
    "hostname": "0.0.0.0",
    "cors": true,
    "mdns": false
  }
}
```

### provider 字段

```json
{
  "provider": {
    "anthropic": {
      "options": {
        "baseURL": "https://api.anthropic.com/v1",
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    },
    "openai": {
      "options": { "baseURL": "https://api.openai.com/v1" }
    },
    "ollama": {
      "options": { "baseURL": "http://localhost:11434" }
    },
    "custom-provider": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://api.example.com/v1",
        "headers": { "X-Custom": "value" }
      },
      "models": {
        "custom-model-id": { "name": "Display Name" }
      }
    }
  }
}
```

### permission 字段

```json
{
  "permission": {
    "*": "ask",
    "read": "allow",
    "edit": "ask",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "pnpm *": "allow",
      "rm -rf*": "deny",
      "git push --force*": "deny"
    },
    "webfetch": "allow",
    "websearch": "allow"
  }
}
```

**三档值**：`allow` / `ask` / `deny`。

**匹配规则**：

| 工具 | 匹配 |
| --- | --- |
| `*` | 全 catch-all |
| `read` / `edit` / `write` / `glob` / `grep` / `lsp` / `task` / `skill` / `question` / `webfetch` / `websearch` / `external_directory` / `doom_loop` | 单工具 |
| `bash` | 支持 object 形式按命令模式匹配 |

**bash glob 模式**：

| 模式 | 匹配 |
| --- | --- |
| `*` | 任意命令 |
| `git *` | git 子命令 |
| `pnpm test` | 仅这条 |
| `rm -rf*` | rm -rf 开头 |

**最后匹配获胜**——通配规则放前，特定规则放后。

### agent 字段

```json
{
  "agent": {
    "code-reviewer": {
      "description": "Review code for bugs and style issues",
      "model": "anthropic/claude-opus-4-7",
      "temperature": 0.3,
      "max_steps": 30,
      "tools": {
        "edit": "deny",
        "write": "deny",
        "bash": "deny",
        "read": "allow",
        "grep": "allow"
      },
      "mcp": ["context7"],
      "prompt": "You are a code reviewer..."
    }
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `description` | string | 何时调用 |
| `model` | string | 模型覆盖 |
| `small_model` | string | 小任务模型 |
| `temperature` | number | 0.0-1.0 |
| `max_steps` | number | 最大步数 |
| `tools` | object | 工具权限 |
| `mcp` | string[] | 允许的 MCP server |
| `prompt` | string | 系统提示词 |

### mcp 字段

```json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"]
    },
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": { "GITHUB_TOKEN": "{env:GITHUB_TOKEN}" }
    },
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/sse",
      "headers": { "Authorization": "Bearer {env:SENTRY_TOKEN}" }
    }
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `"local"` / `"remote"` | 必填 |
| `command` | string[] | local 必填 |
| `url` | string | remote 必填 |
| `environment` | object | local 启动环境 |
| `headers` | object | remote HTTP 头 |
| `enabled` | boolean | 默认 true |

### command 字段（内联）

```json
{
  "command": {
    "test": {
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-sonnet-4-6",
      "template": "跑完整测试并显示覆盖率报告"
    }
  }
}
```

### instructions 字段

```json
{
  "instructions": [
    "docs/team-rules.md",
    "packages/*/AGENTS.md",
    "https://example.com/global-rules.md"
  ]
}
```

支持本地路径 / glob / 远程 URL。

### plugin 字段

```json
{
  "plugin": [
    "@some-npm-package/plugin",
    "./plugins/local-plugin.js"
  ]
}
```

加载来自 npm 或本地的插件。

## tui.json schema

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "tokyonight",
  "leader": "ctrl+x",
  "leader_timeout": 2000,
  "keybinds": {
    "session_new": "ctrl+x n",
    "session_list": "ctrl+x s",
    "model_select": "ctrl+x m",
    "agent_switch": "tab"
  },
  "scroll": {
    "smooth": true,
    "speed": 3
  },
  "attention": {
    "notify": true,
    "sound": true
  }
}
```

### keybinds 配置

| 值类型 | 例子 |
| --- | --- |
| 单串 | `"ctrl+x n"` |
| 逗号分隔多串 | `"ctrl+x n,ctrl+n"` |
| 数组 | `["ctrl+x n", "ctrl+n"]` |
| 对象 | `{ "key": "ctrl+n", "event": "session_new", "preventDefault": true }` |
| 禁用 | `"none"` 或 `false` |

## 内置工具列表

| 工具 | 用途 |
| --- | --- |
| `read` | 读文件（含 offset / limit） |
| `write` | 写整个文件 |
| `edit` | 精确 string replace |
| `apply_patch` | 应用 patch |
| `bash` | shell 命令（支持后台） |
| `glob` | 文件名匹配 |
| `grep` | 全文搜索（ripgrep） |
| `lsp` | LSP 集成（experimental） |
| `webfetch` | 抓 URL |
| `websearch` | Web 搜索（Exa AI） |
| `todowrite` | 任务清单 |
| `question` | 交互问用户 |
| `skill` | 加载 skill 文档 |
| `task` | spawn 子代理（替代 subagent_type） |

## 内置 Agent

### 主代理

| 名称 | 切换 | 行为 |
| --- | --- | --- |
| `build` | 默认 | 全权限 |
| `plan` | `Tab` | 只读分析 |

### 子代理

| 名称 | 工具 | 用途 |
| --- | --- | --- |
| `general` | 全 | 多步任务 |
| `explore` | 只读 | 大范围搜索 |
| `scout` | 只读 + webfetch | 依赖 / 文档调研 |

## 命令文件 frontmatter

```md
---
description: Brief command purpose
agent: build
model: anthropic/claude-sonnet-4-6
---

prompt 模板（支持 $ARGUMENTS / $1 / !`bash` / @file）
```

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `description` | - | 简短描述 |
| `agent` | - | 用哪个 agent 跑 |
| `model` | - | 模型覆盖 |
| `template` | - | 也可写在 frontmatter（覆盖 body） |

## Agent 文件 frontmatter

```md
---
description: When to invoke this agent
model: anthropic/claude-opus-4-7
temperature: 0.3
max_steps: 30
tools:
  read: allow
  edit: deny
  bash: deny
mcp:
  - context7
---

你是一个 ... 系统提示词写这里
```

## 内置 Slash 命令

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示帮助 |
| `/connect` | 添加 provider |
| `/models` | 选模型 |
| `/agents` | 列出 agent |
| `/init` | 生成 AGENTS.md |
| `/clear` | 清会话 |
| `/undo` | 撤销最近改动 |
| `/redo` | 重做 |
| `/share` | 分享会话 |
| `/theme` | 切主题 |
| `/<custom>` | 用户 / 项目自定义命令 |
| `:q` | 退出 TUI |

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `OPENCODE_CONFIG` | 指定配置文件 |
| `OPENCODE_SERVER_PASSWORD` | serve 模式鉴权 |
| `OPENCODE_EXPERIMENTAL_DISABLE_WATCHER` | 1 禁用文件 watcher |
| `OPENCODE_EXPERIMENTAL_DISABLE_LSP` | 1 禁用 LSP |
| `OPENCODE_LOG_LEVEL` | debug / info / warn / error |
| `OPENCODE_NO_TELEMETRY` | 1 关闭遥测 |
| `HTTPS_PROXY` / `HTTP_PROXY` | 网络代理 |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` 等 | provider 凭据（替代 auth.json） |

## Provider ID 速查

| ID | 说明 |
| --- | --- |
| `anthropic` | Claude（Opus / Sonnet / Haiku） |
| `openai` | GPT-5 / GPT-4 / o-series |
| `google` | Gemini |
| `openrouter` | 100+ 模型聚合 |
| `groq` | 快速推理 |
| `together` | 开源模型托管 |
| `deepseek` | DeepSeek 自家 API |
| `ollama` | 本地推理 |
| `lmstudio` | 本地 GGUF |
| `azure` | Azure OpenAI |
| `bedrock` | AWS Bedrock |
| `vertex` | Google Vertex AI |
| `opencode-zen` | sst 官方策展 |

完整列表见 [Models.dev](https://models.dev/)。

## 变量插值

| 形式 | 含义 |
| --- | --- |
| `{env:NAME}` | 环境变量 |
| `{file:path}` | 文件内容 |

适用：`opencode.json` 全字段 / MCP `headers` / `instructions` 等。

## 命令占位符

命令文件 body 内：

| 占位符 | 含义 |
| --- | --- |
| `$ARGUMENTS` | 全部参数 |
| `$1` `$2` `$3` | 位置参数 |
| `` !`cmd` `` | 注入 bash 输出 |
| `@filename` | 引用文件内容 |

## 资源链接

- 官方文档：[opencode.ai/docs](https://opencode.ai/docs)
- GitHub：[sst/opencode](https://github.com/sst/opencode)
- 模型注册表：[Models.dev](https://models.dev/)
- OpenCode Zen：[opencode.ai/zen](https://opencode.ai/zen)
- MCP 协议：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- SST 团队：[sst.dev](https://sst.dev/)
- 状态页：[opencode.ai/status](https://opencode.ai/status)
