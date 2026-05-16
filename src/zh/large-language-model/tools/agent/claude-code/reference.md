---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Claude Code 2.x 编写。完整文档见 [docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code/overview)。

## CLI 全 flag

```bash
claude [prompt] [flags]
```

| Flag | 说明 |
| --- | --- |
| `-h, --help` | 帮助 |
| `-v, --version` | 版本 |
| `-p, --print <prompt>` | 单次执行后退出（脚本场景） |
| `--model <id>` | 指定模型（opus / sonnet / haiku / 完整 ID） |
| `--plan` | 进入 Plan 模式 |
| `--continue` | 继续上次会话 |
| `--resume <session-id>` | 恢复指定会话 |
| `--cwd <dir>` | 指定工作目录 |
| `--no-update-notifier` | 禁用更新提示 |
| `--debug` | 详细日志 |
| `--print-config` | 启动时输出当前配置 |
| `--mcp-config <path>` | 指定 MCP 配置文件 |
| `--allowed-tools <list>` | 仅允许指定工具 |
| `--disallowed-tools <list>` | 禁用指定工具 |
| `--dangerously-skip-permissions` | 等价 bypassPermissions（慎用） |

```bash
# 单次执行
claude -p "总结 README.md 主要内容"

# 脚本模式 + 指定模型
claude -p "lint 检查" --model sonnet --print-config

# 继续上次
claude --continue
```

## 配置文件位置

| 路径 | 作用 | 优先级 |
| --- | --- | --- |
| `~/.claude/settings.json` | 用户全局配置 | 低 |
| `<project>/.claude/settings.json` | 项目共享配置（commit） | 中 |
| `<project>/.claude/settings.local.json` | 项目本地（不 commit） | 高 |
| `<project>/CLAUDE.md` | 项目说明书 | - |
| `~/.claude/CLAUDE.md` | 用户全局说明书 | - |

## settings.json Schema

### 顶层字段

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": { ... },
  "hooks": [ ... ],
  "mcpServers": { ... },
  "env": { ... },
  "model": "claude-sonnet-4-6",
  "permissionMode": "default" | "acceptEdits" | "bypassPermissions" | "plan",
  "outputStyle": "default" | "json",
  "telemetry": { "enabled": false }
}
```

### `permissions` 字段

```json
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Bash(pnpm:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "mcp__context7__*"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)",
      "Edit(/etc/*)"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

**PermissionRule 语法**：`<Tool>(<arg-pattern>)`

| 格式 | 例子 | 匹配 |
| --- | --- | --- |
| `<Tool>` | `Read` | 该工具全部调用 |
| `<Tool>(*)` | `Read(*)` | 等同 `Read` |
| `<Tool>(<pattern>)` | `Bash(pnpm:*)` | Bash 以 `pnpm` 开头 |
| `<Tool>(<exact>)` | `Bash(pnpm test)` | 仅这条命令 |
| `mcp__<server>__<tool>` | `mcp__github__create_pr` | MCP 工具 |
| `mcp__<server>__*` | `mcp__github__*` | server 全部工具 |

### `hooks` 字段

```json
{
  "hooks": [
    {
      "matcher": { "tool": "Edit" },
      "hooks": [
        {
          "type": "command",
          "command": "echo $CLAUDE_TOOL_PATH >> ~/edit.log"
        }
      ]
    },
    {
      "matcher": { "tool": "Bash", "command": "git push" },
      "hooks": [
        {
          "type": "command",
          "command": "echo 'Blocked!' && exit 1"
        }
      ]
    }
  ]
}
```

**matcher 字段**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tool` | string | 工具名（精确） |
| `tool_pattern` | string | 工具名 glob |
| `command` | string | Bash 命令前缀匹配 |
| `path` | string | 文件路径 glob |
| `event` | "pre" / "post" | 调用前 / 后（默认 pre） |

**hook command 环境变量**：

| 变量 | 值 |
| --- | --- |
| `$CLAUDE_TOOL_NAME` | 工具名 |
| `$CLAUDE_TOOL_PATH` | 操作路径（Read/Edit/Write） |
| `$CLAUDE_TOOL_COMMAND` | Bash 命令 |
| `$CLAUDE_TOOL_INPUT` | 完整工具输入 JSON |
| `$CLAUDE_TOOL_OUTPUT` | 完整工具结果 JSON（仅 post 事件） |
| `$CLAUDE_SESSION_ID` | 会话 ID |
| `$CLAUDE_PROJECT_DIR` | 项目根 |
| `$CLAUDE_HOOK_EVENT` | "pre" / "post" |

### `mcpServers` 字段

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "remote-server": {
      "url": "https://my-mcp.example.com",
      "headers": {
        "Authorization": "Bearer ${env:API_KEY}"
      }
    }
  }
}
```

### `env` 字段

```json
{
  "env": {
    "HTTPS_PROXY": "http://localhost:7890",
    "MY_CUSTOM_VAR": "value"
  }
}
```

将变量注入到 Claude Code 启动环境（也传给 hooks / MCP servers）。

## 内置工具列表

| 工具 | 用途 |
| --- | --- |
| `Read` | 读文件 / 图片 / PDF / Jupyter notebook |
| `Write` | 写整个文件（覆盖） |
| `Edit` | 精确 string replace 编辑 |
| `Bash` | 执行 shell 命令 |
| `Glob` | 文件名模式匹配 |
| `Grep` | 正则全文搜索 |
| `WebFetch` | 抓 URL（含 markdown 转换） |
| `WebSearch` | Web 搜索 |
| `Agent` | spawn 子代理 |
| `TodoWrite` | 维护任务清单 |
| `Monitor` | 监控后台进程 stdout |
| `ScheduleWakeup` | 定时唤醒 |
| `AskUserQuestion` | 交互式问用户 |
| `NotebookEdit` | 编辑 Jupyter notebook 单元 |
| `KillShell` | 终止 shell |
| `BashOutput` | 读后台命令输出 |
| `ToolSearch` | 搜索可用工具 |

## Skills 目录结构

```
~/.claude/skills/<skill-name>/
├── SKILL.md           # 主指令（必需）
├── references/        # 引用资源
│   ├── docs.md
│   └── examples.ts
├── scripts/           # 工具脚本
│   └── helper.sh
└── data/              # 静态数据
    └── snippets.json
```

### SKILL.md frontmatter

```md
---
name: my-skill
description: Use when ... [何时触发的描述]
---

# Skill 主体内容

[详细指令]
```

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | ✓ | skill 名，slash 命令 `/<name>` |
| `description` | ✓ | 何时使用（Claude 据此判断是否调用） |

## Subagent 配置

`~/.claude/agents/<name>.md`：

```md
---
name: typescript-bug-hunter
description: Find subtle TypeScript type bugs
tools: ["Read", "Grep", "Glob"]
model: claude-opus-4-7
---

You are a TypeScript bug hunter. Focus on:
- Type narrowing issues
- Generic constraint problems
...
```

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | ✓ | subagent_type 值 |
| `description` | ✓ | 何时调用 |
| `tools` | -    | 工具白名单（默认全部） |
| `model` | -    | 模型覆盖 |
| `permissionMode` | - | 默认权限 |

## 命令行 / Slash 命令完整列表

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示帮助 |
| `/login` | 登录 / 切账号 |
| `/logout` | 登出 |
| `/model` | 选模型 |
| `/permissions` | 看权限 |
| `/hooks` | 看 hook |
| `/mcp` | 看 MCP server 状态 |
| `/agents` | 看 subagent |
| `/init` | 生成 CLAUDE.md |
| `/clear` | 清会话 |
| `/compact <提示>` | 压缩对话 |
| `/cost` | 看费用 |
| `/release-notes` | 看版本变更 |
| `/feedback` | 反馈 |
| `/bug` | 报 bug |
| `/quit` | 退出 |
| `/<custom>` | 用户/项目自定义命令 |
| `/skill <name>` | 触发 skill |

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `ANTHROPIC_API_KEY` | API key（替代 OAuth） |
| `ANTHROPIC_BASE_URL` | API endpoint（自定义 / 代理） |
| `CLAUDE_MODEL` | 默认模型 |
| `CLAUDE_PROJECT_DIR` | 项目根（hooks 内可用） |
| `CLAUDE_SESSION_ID` | 当前会话 ID |
| `CLAUDE_NO_UPDATE` | 1 禁用更新提示 |
| `CLAUDE_NO_HOOKS` | 1 临时禁用所有 hook |
| `CLAUDE_LOG_LEVEL` | debug / info / warn / error |
| `HTTPS_PROXY` / `HTTP_PROXY` | 网络代理 |

## 模型 ID 速查

| ID | 别名 | 上下文 | 用途 |
| --- | --- | --- | --- |
| `claude-opus-4-7` | Opus 4.7 | 200K | 旗舰，复杂规划 |
| `claude-opus-4-7[1m]` | Opus 4.7 1M | 1M | 整本仓库 |
| `claude-sonnet-4-6` | Sonnet 4.6 | 200K | 日常 |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | 200K | 简单 / 快速 |

旧版本：

| ID | 状态 |
| --- | --- |
| `claude-opus-4` | 仍可用 |
| `claude-sonnet-3-5` | 已 retired |
| `claude-haiku-3-5` | 仍可用 |

## API 端点（Agent SDK）

```python
from claude_agent_sdk import Agent

agent = Agent(
    model="claude-opus-4-7",
    tools=[my_tool],
    permission_mode="acceptEdits",
    settings_path="~/.claude/settings.json",  # 复用 Claude Code 配置
)

# 单次跑
result = agent.run("帮我...")

# 流式
async for chunk in agent.stream("帮我..."):
    print(chunk, end="")

# 多轮
session = agent.session()
session.send("...")
session.send("...")
```

详见 [Agent SDK 文档](https://docs.claude.com/en/api/agent-sdk)。

## 错误码

| 现象 | 含义 |
| --- | --- |
| `authentication_error` | OAuth 过期 / API key 无效 |
| `rate_limit_error` | 触发速率限制 |
| `context_length_exceeded` | 上下文窗口满 |
| `tool_use_failed` | 工具调用失败（参数错 / 权限拒） |
| `mcp_connection_failed` | MCP server 启动失败 |

## 价格速查（截至 2026）

按 token 计费（输入 / 输出价格不同），单位 $/1M tokens：

| 模型 | 输入 | 输出 | Prompt cache 读 |
| --- | --- | --- | --- |
| Opus 4.7 | $15 | $75 | $1.50 |
| Opus 4.7 (1M) | $30 | $150 | $3 |
| Sonnet 4.6 | $3 | $15 | $0.30 |
| Haiku 4.5 | $0.80 | $4 | $0.08 |

**Pro / Max 订阅**：月费 $20 / $100 / $200，含一定额度后超出按 token。

## 资源链接

- 官方文档：[docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code/overview)
- GitHub：[anthropics/claude-code](https://github.com/anthropics/claude-code)
- Discord：[anthropic.com/discord](https://www.anthropic.com/discord)
- 社区：[awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- MCP 协议：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- Agent SDK：[docs.claude.com/en/api/agent-sdk](https://docs.claude.com/en/api/agent-sdk)
- 状态页：[status.anthropic.com](https://status.anthropic.com/)
- API 文档：[docs.claude.com/en/api](https://docs.claude.com/en/api/overview)
