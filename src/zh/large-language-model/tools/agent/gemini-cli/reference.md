---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Gemini CLI 0.42+（2026 年 5 月版本）编写。完整文档见 [google-gemini.github.io/gemini-cli](https://google-gemini.github.io/gemini-cli/docs/)。

## CLI 全 flag

```bash
gemini [prompt] [flags]
```

| Flag | 简写 | 说明 |
| --- | --- | --- |
| `--help` | `-h` | 帮助 |
| `--version` | `-v` | 版本 |
| `--prompt <text>` | `-p` | 非交互单次执行后退出 |
| `--prompt-interactive <text>` | `-i` | 初始 prompt 后进交互 |
| `--model <id>` | `-m` | 指定模型（默认 `auto`） |
| `--debug` | `-d` | 详细日志（F12 开内置 console） |
| `--sandbox` | `-s` | 启用沙箱（Docker / Podman / Seatbelt） |
| `--yolo` | `-y` | 全自动审批（已弃用，等价 `--approval-mode=yolo`） |
| `--approval-mode <mode>` | - | `default` / `auto_edit` / `yolo` / `plan` |
| `--output-format <fmt>` | `-o` | `text` / `json` / `stream-json` |
| `--extensions <names>` | `-e` | 指定加载的 extension（`-e none` 禁全部） |
| `--list-extensions` | `-l` | 列出可用 extension |
| `--include-directories <dirs>` | - | 额外加 workspace 目录（最多 5 个） |
| `--allowed-tools <list>` | - | 绕过审批的工具列表 |
| `--allowed-mcp-server-names <list>` | - | MCP server 白名单 |
| `--resume [id]` | `-r` | 恢复会话（默认 latest） |
| `--list-sessions` | - | 列出所有会话 |
| `--delete-session <id>` | - | 删除指定会话 |
| `--worktree <name>` | `-w` | 启动时建 git worktree |
| `--skip-trust` | - | 跳过 folder trust 检查 |
| `--screen-reader` | - | 屏幕阅读器无障碍模式 |
| `--acp` | - | Agent Communication Protocol 模式 |
| `--experimental-acp` | - | ACP 实验模式 |
| `--experimental-zed-integration` | - | Zed 编辑器集成 |
| `--fake-responses <file>` | - | 测试用（加载假响应） |
| `--record-responses <file>` | - | 测试用（录响应） |

```bash
# 单次执行
gemini -p "总结 README.md 主要内容"

# 脚本 + 指定模型 + JSON 输出
gemini -p "lint 检查" --model gemini-2.5-flash --output-format json

# 恢复上次
gemini --resume
gemini -r latest

# CI 全自动
gemini -p "跑测试并报告" --approval-mode=yolo --output-format stream-json
```

## 配置文件位置

| 优先级（低 → 高） | 路径 | 作用 |
| --- | --- | --- |
| 1 | 内置默认值 | 出厂默认 |
| 2 | `/etc/gemini-cli/system-defaults.json`（Linux） | 系统默认 |
| 3 | `~/.gemini/settings.json` | 用户全局 |
| 4 | `<project>/.gemini/settings.json` | 项目共享（commit） |
| 5 | `/etc/gemini-cli/settings.json`（Linux） | 系统强制覆盖 |
| 6 | 环境变量 | 运行时 |
| 7 | CLI 参数 | 最高 |

Windows / macOS 路径前缀不同：

| 平台 | system-defaults 路径 |
| --- | --- |
| Linux | `/etc/gemini-cli/system-defaults.json` |
| Windows | `C:\ProgramData\gemini-cli\system-defaults.json` |
| macOS | `/Library/Application Support/GeminiCli/system-defaults.json` |

## settings.json Schema

### 顶层 categories

```json
{
  "general": { ... },
  "ui": { ... },
  "ide": { ... },
  "privacy": { ... },
  "billing": { ... },
  "model": { ... },
  "modelConfigs": { ... },
  "agents": { ... },
  "context": { ... },
  "tools": { ... },
  "mcp": { ... },
  "mcpServers": { ... },
  "security": { ... },
  "advanced": { ... },
  "experimental": { ... },
  "skills": { ... },
  "hooksConfig": { ... },
  "hooks": { ... },
  "contextManagement": { ... },
  "admin": { ... },
  "telemetry": { ... },
  "output": { ... }
}
```

### `general` 重点字段

```json
{
  "general": {
    "preferredEditor": "code",
    "vimMode": false,
    "defaultApprovalMode": "auto_edit",
    "enableAutoUpdate": true,
    "enableNotifications": true,
    "checkpointing": { "enabled": true },
    "plan": {
      "enabled": true,
      "directory": "~/.gemini/plans",
      "modelRouting": true
    },
    "sessionRetention": {
      "enabled": true,
      "maxAge": "30d",
      "maxCount": 100
    },
    "retryFetchErrors": true,
    "maxAttempts": 3
  }
}
```

### `model` 字段

```json
{
  "model": {
    "name": "gemini-3-pro-preview",
    "maxSessionTurns": -1,
    "compressionThreshold": 0.8,
    "disableLoopDetection": false
  }
}
```

`maxSessionTurns: -1` 表示无限。`compressionThreshold` 是 context 占用达到几成（0-1）触发自动 `/compress`。

### `tools` 字段

```json
{
  "tools": {
    "sandbox": "docker",
    "sandboxAllowedPaths": ["/workspace"],
    "sandboxNetworkAccess": false,
    "shell": {
      "enableInteractiveShell": true,
      "pager": "less",
      "inactivityTimeout": 300
    },
    "allowed": ["run_shell_command(git status)", "run_shell_command(pnpm test)"],
    "confirmationRequired": ["write_file", "replace"],
    "exclude": ["run_shell_command(rm)"],
    "useRipgrep": true,
    "truncateToolOutputThreshold": 10000
  }
}
```

- `allowed`：列出**绕过审批的工具调用**
- `confirmationRequired`：强制要审批（覆盖 allowed）
- `exclude`：完全禁用的工具

### `context` 字段

```json
{
  "context": {
    "fileName": ["GEMINI.md", "AGENTS.md"],
    "importFormat": "markdown",
    "includeDirectories": ["/path/to/external/lib"],
    "includeDirectoryTree": true,
    "discoveryMaxDirs": 200,
    "memoryBoundaryMarkers": [".git", ".hg"],
    "fileFiltering": {
      "respectGitIgnore": true,
      "respectGeminiIgnore": true,
      "enableRecursiveFileSearch": true,
      "enableFuzzySearch": true
    }
  }
}
```

`fileName` 数组 → 同时认 `GEMINI.md` 和 `AGENTS.md`（兼容其它工具约定）。

### `mcpServers` 字段

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" },
      "timeout": 5000,
      "trust": false
    },
    "remote": {
      "httpUrl": "https://my-mcp.example.com",
      "headers": { "Authorization": "Bearer ${API_KEY}" }
    },
    "sse-server": {
      "url": "https://sse-server.example.com",
      "headers": { "X-API-Key": "${KEY}" }
    }
  }
}
```

字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `command` | string | stdio MCP 启动命令 |
| `args` | string[] | 命令参数 |
| `url` | string | SSE MCP server URL |
| `httpUrl` | string | HTTP MCP server URL |
| `headers` | object | 远程 server 鉴权头 |
| `env` | object | 注入环境变量 |
| `cwd` | string | 子进程工作目录 |
| `timeout` | number | 启动超时（ms） |
| `trust` | boolean | 跳过该 server 工具审批 |
| `description` | string | 描述 |
| `includeTools` | string[] | 工具白名单 |
| `excludeTools` | string[] | 工具黑名单 |

### `hooks` 字段

```json
{
  "hooksConfig": {
    "enabled": true,
    "notifications": true
  },
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_.*",
        "hooks": [
          {
            "name": "audit",
            "type": "command",
            "command": "/usr/local/bin/audit-script.sh",
            "timeout": 5000,
            "description": "审计写操作"
          }
        ]
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "prettier",
            "type": "command",
            "command": "prettier --write \"$TOOL_FILE_PATH\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command", "command": "echo 'session start' >> ~/sess.log" }
        ]
      }
    ]
  }
}
```

**11 个生命周期事件**：

| 事件 | 触发时机 | 可阻塞 |
| --- | --- | --- |
| `SessionStart` | 会话开始 | ✗ |
| `SessionEnd` | 会话结束 | ✗ |
| `BeforeAgent` | Agent loop 开始 | ✓ |
| `AfterAgent` | Agent loop 结束 | ✓ |
| `BeforeModel` | LLM 调用前 | ✓ |
| `AfterModel` | LLM 返回后 | ✓ |
| `BeforeToolSelection` | 工具选择前 | ✓ |
| `BeforeTool` | tool 执行前 | ✓ |
| `AfterTool` | tool 执行后 | ✓ |
| `PreCompress` | 上下文压缩前 | ✗ |
| `Notification` | 警告 / 通知 | ✗ |

**Matcher 语法**：

- `BeforeTool` / `AfterTool`：**正则**（如 `"write_.*"`）
- 生命周期事件：**精确字符串**（如 `"startup"`）
- 通配：`"*"` 或 `""`

**Hook 行为约定**：

- stdout 输出 **JSON**（其它内容破坏解析）
- stderr 打 debug 日志
- **Exit 0**：成功；想拒绝写 `{"decision": "deny"}` 到 stdout
- **Exit 2**：直接阻塞，stderr 内容是拒绝原因
- 其它退出码：警告但放行

**Hook 环境变量**：

| 变量 | 值 |
| --- | --- |
| `GEMINI_PROJECT_DIR` | 项目根 |
| `GEMINI_PLANS_DIR` | plans 目录 |
| `GEMINI_SESSION_ID` | 会话 ID |
| `GEMINI_CWD` | 当前工作目录 |

### `security` 字段

```json
{
  "security": {
    "toolSandboxing": true,
    "disableYoloMode": false,
    "disableAlwaysAllow": false,
    "enablePermanentToolApproval": true,
    "autoAddToPolicyByDefault": false,
    "blockGitExtensions": false,
    "allowedExtensions": ["^@google/.*", "^gemini-cli-extensions/.*"],
    "folderTrust": { "enabled": true },
    "environmentVariableRedaction": {
      "enabled": true,
      "blocked": ["GITHUB_TOKEN", "API_KEY"]
    },
    "auth": {
      "selectedType": "oauth-personal",
      "enforcedType": "oauth-personal"
    }
  }
}
```

### `experimental` 字段

```json
{
  "experimental": {
    "gemma": false,
    "voiceMode": false,
    "voice": {
      "activationMode": "push-to-talk",
      "backend": "gemini-live"
    },
    "enableAgents": true,
    "worktrees": true,
    "extensionManagement": true,
    "useOSC52Copy": true,
    "autoMemory": true,
    "directWebFetch": false
  }
}
```

### `agents` + browser

```json
{
  "agents": {
    "browser": {
      "sessionMode": "persistent",
      "headless": false,
      "profilePath": "~/.gemini/browser-profile",
      "visualModel": "gemini-3-pro-preview",
      "allowedDomains": ["example.com", "github.com"],
      "maxActionsPerTask": 50,
      "confirmSensitiveActions": true,
      "blockFileUploads": true
    },
    "overrides": {
      "codebase_investigator": {
        "model": "gemini-2.5-pro"
      }
    }
  }
}
```

### `telemetry` 字段

```json
{
  "telemetry": {
    "enabled": true,
    "traces": true,
    "target": "local",
    "otlpEndpoint": "https://otlp.example.com",
    "otlpProtocol": "grpc",
    "logPrompts": false,
    "outfile": "/tmp/gemini-telemetry.json"
  }
}
```

`target: "gcp"` 时会发到 GCP 项目（需配 `OTLP_GOOGLE_CLOUD_PROJECT`）。

## 环境变量

### 认证 / API

| 变量 | 作用 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key（替代 OAuth） |
| `GOOGLE_API_KEY` | Google Cloud API key |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account JSON 路径 |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID（Vertex / Workspace 用） |
| `GOOGLE_CLOUD_LOCATION` | GCP region（如 `us-central1`） |
| `GOOGLE_GENAI_USE_VERTEXAI` | `true` 强制走 Vertex AI |
| `GOOGLE_GENAI_API_VERSION` | API 版本（如 `v1`） |

### Gemini CLI 行为

| 变量 | 作用 |
| --- | --- |
| `GEMINI_MODEL` | 默认模型覆盖 |
| `GEMINI_CLI_TRUST_WORKSPACE` | 跳过 folder trust 检查 |
| `GEMINI_CLI_TRUSTED_FOLDERS_PATH` | 自定义 `trustedFolders.json` 路径 |
| `GEMINI_CLI_HOME` | CLI 配置根目录 |
| `GEMINI_SANDBOX` | 沙箱模式（`true` / `docker` / `podman` / `lxc`） |
| `GEMINI_SYSTEM_MD` | 自定义 system prompt 路径 |
| `GEMINI_WRITE_SYSTEM_MD` | 把内置 system prompt 写到文件 |
| `GEMINI_CLI` | hook / shell 子进程内为 `1`（脚本检测用） |

### Base URL 代理

| 变量 | 作用 |
| --- | --- |
| `GOOGLE_GEMINI_BASE_URL` | Gemini API proxy URL（HTTPS） |
| `GOOGLE_VERTEX_BASE_URL` | Vertex AI proxy URL（HTTPS） |
| `CODE_ASSIST_ENDPOINT` | Code Assist 服务器 endpoint |

### Telemetry

| 变量 | 作用 |
| --- | --- |
| `GEMINI_TELEMETRY_ENABLED` | `true` 开启 |
| `GEMINI_TELEMETRY_TRACES_ENABLED` | 详细 trace |
| `GEMINI_TELEMETRY_TARGET` | `local` / `gcp` |
| `GEMINI_TELEMETRY_OTLP_ENDPOINT` | OTLP exporter URL |
| `GEMINI_TELEMETRY_LOG_PROMPTS` | 是否记录用户 prompt |
| `GEMINI_TELEMETRY_OUTFILE` | 本地输出文件 |
| `OTLP_GOOGLE_CLOUD_PROJECT` | GCP project for telemetry |

### 系统 / 显示

| 变量 | 作用 |
| --- | --- |
| `NO_COLOR` | 禁所有彩色输出 |
| `CLI_TITLE` | 自定义 CLI 标题 |
| `SEATBELT_PROFILE` | macOS Seatbelt profile |
| `DEBUG` / `DEBUG_MODE` | 详细日志（默认从 project .env 排除） |
| `HTTPS_PROXY` / `HTTP_PROXY` | 网络代理 |

### settings.json 变量展开

字符串值支持变量展开：

```json
{
  "apiKey": "$MY_API_TOKEN",
  "fallback": "${MY_API_TOKEN:-default-token}",
  "env": {
    "TOKEN": "${GITHUB_TOKEN}"
  }
}
```

默认遮蔽含这些关键字的变量：`TOKEN` / `SECRET` / `PASSWORD` / `KEY` / `AUTH` / `CREDENTIAL` / `PRIVATE` / `CERT`。

## 内置工具列表

### File System

| 工具 | 用途 |
| --- | --- |
| `read_file` | 读单文件（文本 / 图片 / 音频 / PDF） |
| `read_many_files` | 读多文件（`@` 语法触发） |
| `list_directory` | 列出目录 |
| `glob` | glob 模式匹配文件名 |
| `grep_search` | 正则全文搜索（默认用 ripgrep） |
| `write_file` | 创建 / 覆盖文件（要审批） |
| `replace` | 精确字符串替换（要审批） |

### Execution

| 工具 | 用途 |
| --- | --- |
| `run_shell_command` | 执行 shell 命令（要审批） |

### Web

| 工具 | 用途 |
| --- | --- |
| `google_web_search` | Google 搜索（自带 citation） |
| `web_fetch` | 抓 URL（自动 markdown 转换） |

### Memory & Context

| 工具 | 用途 |
| --- | --- |
| `activate_skill` | 激活 agent skill |
| `get_internal_docs` | 查 Gemini CLI 自身文档 |
| `ask_user` | 主动问用户（卡点决策） |

### Planning & Tasks

| 工具 | 用途 |
| --- | --- |
| `write_todos` | 维护任务清单 |
| `update_plan` | 更新当前 plan |

### MCP

| 工具 | 用途 |
| --- | --- |
| `list_mcp_resources` | 列 MCP server 资源 |
| `read_mcp_resource` | 读 MCP 资源 |
| `mcp__<server>__<tool>` | 具体 MCP 工具 |

## Skills 目录结构

```
~/.gemini/skills/<skill-name>/
├── SKILL.md            # 主指令（必需）
├── references/         # 引用资源
├── scripts/            # 工具脚本
└── data/               # 静态数据
```

### SKILL.md frontmatter

```md
---
name: my-skill
description: Use when ... [何时触发的描述]
---

# Skill 主体

[详细指令]
```

激活流程：

1. CLI 启动时扫所有 SKILL.md，把 `name + description` 注入 system prompt
2. 用户问题匹配 description → Gemini 调 `activate_skill(name)` 工具
3. 用户确认（一次性 / 永久）
4. SKILL.md 全文 + 资源注入对话历史
5. 后续按 skill 指令执行

四级优先级：内置 < extension < 用户（`~/.gemini/skills/`）< workspace（`.gemini/skills/`）。

## Custom Commands（.toml）

```toml
# ~/.gemini/commands/release.toml
description = "做一次 patch 版本发布"
prompt = """
做一次 patch 版本发布：
1. 用 changelogen 生成 CHANGELOG
2. bump package.json
3. git tag + push
4. npm publish
"""
```

CLI 里 `/release` 触发。`/commands reload` 重新扫描。

## 退出码（headless）

| 码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `1` | 一般错误 / API 失败 |
| `42` | 输入校验错 |
| `53` | 超过 turn 限制 |

## 模型 ID 速查

| ID | 上下文 | 状态 |
| --- | --- | --- |
| `gemini-3-pro-preview` | 1M | 旗舰 preview |
| `gemini-3-flash-preview` | 1M | 速度优化 preview |
| `gemini-2.5-pro` | 1M | 稳定版 Pro |
| `gemini-2.5-flash` | 1M | 稳定版 Flash |
| `gemini-2.5-flash-lite` | 1M | 轻量 |
| `auto` | - | 自动路由（默认） |

实验性：

| ID | 状态 |
| --- | --- |
| `gemma-3` | 实验性本地（`experimental.gemma=true`） |

## Output Format（headless）

`--output-format text`（默认）：纯文本。

`--output-format json`：单 JSON 对象：

```json
{
  "response": "总结：...",
  "usage": { "input_tokens": 1234, "output_tokens": 567 },
  "model": "gemini-3-pro-preview",
  "sessionId": "..."
}
```

`--output-format stream-json`：JSONL 流，每行一个事件：

```jsonl
{"type":"init","sessionId":"...","model":"gemini-3-pro-preview"}
{"type":"tool_use","tool":"read_file","input":{"path":"README.md"}}
{"type":"tool_result","output":"..."}
{"type":"message","content":"我看到 README ..."}
{"type":"result","response":"...","usage":{...}}
```

## 资源链接

- 官方文档：[google-gemini.github.io/gemini-cli](https://google-gemini.github.io/gemini-cli/docs/)
- GitHub：[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
- 扩展画廊：[geminicli.com/extensions](https://geminicli.com/extensions/browse/)
- AI Studio（API key）：[aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Google AI for Developers：[ai.google.dev](https://ai.google.dev)
- MCP 协议：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- Cloud Code Assist：[cloud.google.com/gemini/docs/codeassist](https://cloud.google.com/gemini/docs/codeassist/gemini-cli)
- GitHub Action：[run-gemini-cli](https://github.com/google-github-actions/run-gemini-cli)
- Releases：[github.com/google-gemini/gemini-cli/releases](https://github.com/google-gemini/gemini-cli/releases)
