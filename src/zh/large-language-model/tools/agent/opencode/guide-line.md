---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenCode 2026 版编写

## 速查

- 添加 provider：TUI 输入 `/connect`，凭据存 `~/.local/share/opencode/auth.json`
- 全局配置：`~/.config/opencode/opencode.json`，项目配置：`<project>/opencode.json`
- 切模型：`/models` 选 `provider/model` 格式
- 切 agent：`Tab` 在 Plan / Build 主代理切换
- AGENTS.md：项目根目录，兼容 `CLAUDE.md`
- 自定义命令：`.opencode/commands/<name>.md` → `/<name>` 触发
- 自定义 agent：`.opencode/agents/<name>.md` 或 `opencode.json` 的 `agent` 字段
- MCP 配置：`opencode.json` 的 `mcp` 字段，stdio + 远程都支持
- 撤销改动：`/undo`，分享会话：`/share`
- 退出：`Ctrl+C` 两次 / `:q`

## 模型与 Provider

OpenCode 通过 [Models.dev](https://models.dev/) 注册表接入 75+ provider，是它最大卖点。

### 添加 provider

```bash
# TUI 内
/connect
```

弹出可选 provider 列表，选一个后引导填 API key。常见组合：

| Provider | 用途 |
| --- | --- |
| `anthropic` | Claude 全家桶 |
| `openai` | GPT / o-series |
| `google` | Gemini |
| `openrouter` | 一个 key 接 100+ 模型（含 Anthropic / OpenAI / 开源） |
| `groq` | 快速推理（Llama / Mixtral） |
| `together` | 开源模型托管 |
| `deepseek` | 国内可用 + 便宜 |
| `ollama` | 本地推理 |
| `lmstudio` | 本地 GGUF |
| `azure` | Azure OpenAI |
| `bedrock` | AWS Bedrock |
| `vertex` | Google Vertex AI |
| `opencode-zen` | sst 官方策展（含订阅） |

凭据写入 `~/.local/share/opencode/auth.json`：

```json
{
  "anthropic": { "api_key": "sk-ant-..." },
  "openai": { "api_key": "sk-..." },
  "ollama": { "base_url": "http://localhost:11434" }
}
```

### 在 opencode.json 配 provider

需要自定义 baseURL / 自建 provider 时直接写配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "anthropic": {
      "options": {
        "baseURL": "https://api.anthropic.com/v1"
      }
    },
    "deepseek": {
      "options": {
        "baseURL": "https://api.deepseek.com/v1"
      }
    },
    "my-corp-llm": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://llm.mycorp.com/v1",
        "headers": { "X-Org": "team-a" }
      },
      "models": {
        "gpt-4o-equivalent": {
          "name": "Corp Internal Model"
        }
      }
    }
  }
}
```

::: tip OpenAI 兼容 API 通用接法
任何 OpenAI 兼容 API（智谱 / Kimi / 阶跃星辰 / 自建 vLLM 等）都能走 `@ai-sdk/openai-compatible`，填 `baseURL` 就接好。
:::

### 选模型

```bash
/models
```

模型格式 `provider/model`。在 `opencode.json` 中可设默认：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-6",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

- `model`：主模型（处理推理 / 写代码）
- `small_model`：轻任务用（生成会话标题、总结、补全等）—— 省钱关键

### 模型决策直觉

| 场景 | 推荐 |
| --- | --- |
| 复杂规划 / 重构 | `anthropic/claude-opus-4-7` |
| 日常编码（90%） | `anthropic/claude-sonnet-4-6` / `openai/gpt-5.5` |
| 国内场景 + 性价比 | `deepseek/deepseek-v3` |
| 完全离线 | `ollama/llama-3.3-70b` |
| 速度敏感 | `groq/llama-3.3-70b` |
| 多供应商对比 | `openrouter/<any>` |

## Plan vs Build：两档主代理

按 `Tab` 在两档主代理间切换：

| Agent | 行为 |
| --- | --- |
| **Build** | 全权限——可改文件 / 跑 bash / 调外部工具，**默认** |
| **Plan** | 只读——能读 / 搜索 / 抓网页，但不动文件 |

```
[TUI 顶部状态栏]
agent: plan  →  按 Tab  →  agent: build
```

**典型工作流**：

```
1. Plan 模式 + Opus 规划
   > 帮我设计 Phase 2 用户系统
   （OpenCode 产出详细方案，不动文件）

2. Tab 切 Build + Sonnet 实施
   > 按方案改代码
   （OpenCode 按步骤动手）
```

::: tip Plan 模式禁了什么
Plan 把 `edit` / `write` / `bash`（写命令）等工具 deny 掉，但 `read` / `glob` / `grep` / `webfetch` / `websearch` 仍可用。所以分析 + 检索 + 提议代码段都没问题，只是不会真的落盘。
:::

## Subagents：子代理

OpenCode 除主代理（Plan / Build），还有可由主代理调用的**子代理**：

| 子代理 | 工具 | 用途 |
| --- | --- | --- |
| `general` | 全工具 | 多步任务（替主代理跑独立子任务） |
| `explore` | 只读（read/glob/grep） | 大范围搜索 / 找代码 |
| `scout` | 只读 + webfetch | 依赖 / 文档调研 |

用法（主代理对话里）：

```
> 用 @explore 帮我找出所有 useUser 调用点
> 然后 @scout 看看 react-query v5 的迁移指南
```

主代理调子代理 = spawn 独立上下文，子代理跑完返回总结，不污染主线程。

### 自定义子代理

`.opencode/agents/<name>.md` 或 `~/.config/opencode/agents/<name>.md`：

```md
---
description: TypeScript bug hunter for type narrowing issues
tools:
  read: allow
  grep: allow
  glob: allow
  edit: deny
  bash: deny
model: anthropic/claude-opus-4-7
temperature: 0.2
---

You are an expert TypeScript bug hunter. Focus on:

- Type narrowing issues
- Generic constraint problems
- Missing `as const` / `satisfies`
- Discriminated union exhaustiveness

Output format: { file, line, issue, suggested fix }
```

字段：

| 字段 | 说明 |
| --- | --- |
| `description` | 何时调用（主代理据此判断） |
| `tools` | 工具权限（allow / ask / deny） |
| `model` | 模型覆盖（如主线程 Sonnet，子代理 Opus） |
| `temperature` | 创意度（0.0-1.0） |
| `max_steps` | 最多步数（防失控） |
| `prompt` | 系统提示词（也可写在 markdown body） |

也可在 `opencode.json` 内联：

```json
{
  "agent": {
    "bug-hunter": {
      "description": "...",
      "model": "anthropic/claude-opus-4-7",
      "tools": { "edit": "deny", "bash": "deny" },
      "prompt": "You are..."
    }
  }
}
```

调用：`@bug-hunter 帮我...`。

## 权限系统

OpenCode 的权限粒度比 Claude Code 更细——每个工具单独配。

### 配置位置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
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

三档值：

| 值 | 行为 |
| --- | --- |
| `allow` | 自动执行 |
| `ask` | 询问用户 |
| `deny` | 拒绝（OpenCode 不能调） |

### 匹配规则

bash 用 **glob 模式**匹配命令：

```json
{
  "bash": {
    "*": "ask",
    "git *": "allow",
    "rm *": "deny"
  }
}
```

**最后匹配获胜**——把通配规则放前面，特定规则放后面。

### 默认权限

| 工具 | 默认 |
| --- | --- |
| `read` / `glob` / `grep` | allow |
| `edit` / `write` / `bash` | allow（信任本地仓库） |
| `webfetch` / `websearch` | allow |
| `.env` 读取 | **deny**（安全默认） |
| `doom_loop`（self-loop） | ask |
| `external_directory`（项目外路径） | ask |

::: warning 信任模型
OpenCode 默认更激进——`bash` 默认 `allow`。生产 / 共享机器建议显式改 `"*": "ask"` 全询问，再 allow 几个白名单。
:::

### Per-agent 权限

子代理可单独配权限，覆盖全局：

```json
{
  "agent": {
    "code-reviewer": {
      "tools": {
        "edit": "deny",
        "write": "deny",
        "bash": "deny"
      }
    }
  }
}
```

`code-reviewer` agent 永远只读，即使主代理 Build 模式启动它。

## 内置工具

| 工具 | 用途 |
| --- | --- |
| `read` | 读文件（支持 offset / limit） |
| `write` | 写整个文件（覆盖） |
| `edit` | 精确 string replace |
| `apply_patch` | 应用 patch 文件 |
| `bash` | 跑 shell（支持后台） |
| `glob` | 文件名模式匹配 |
| `grep` | 全文搜索（ripgrep） |
| `lsp` | 语言服务集成（experimental） |
| `webfetch` | 抓 URL（markdown 转换） |
| `websearch` | Web 搜索（Exa AI） |
| `todowrite` | 任务清单 |
| `question` | 交互式问用户 |
| `skill` | 加载 skill 文档 |

::: tip lsp 工具
`lsp` 是 OpenCode 的特色——自动启动语言服务器（tsserver / gopls / rust-analyzer），LLM 可调用「找引用」「跳定义」「重命名」等。比 grep 精准但启动慢，experimental flag 控制是否开启。
:::

## 自定义命令

`.opencode/commands/<name>.md` 或 `~/.config/opencode/commands/<name>.md`：

```md
---
description: Run tests with coverage
agent: build
model: anthropic/claude-sonnet-4-6
---

跑完整测试并显示覆盖率报告，列出所有失败。
```

TUI 内 `/test` 触发。

### 动态内容

命令支持占位符与注入：

```md
---
description: Lint a specific file
---

对 $ARGUMENTS 跑 lint，并修复可自动修复的问题。
```

```bash
/lint src/utils/format.ts
```

`$ARGUMENTS`（全部参数）/ `$1` `$2` `$3`（位置参数）/ `!\`bash 命令\``（注入 bash 输出）/ `@文件名`（引用文件内容）都可用。

### 项目级 vs 用户级

- `.opencode/commands/<name>.md` → 进仓库，团队共享
- `~/.config/opencode/commands/<name>.md` → 个人偏好

## MCP（Model Context Protocol）

OpenCode 一类支持 MCP，配置在 `opencode.json` 的 `mcp` 字段。

### 本地 MCP server

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
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### 远程 MCP server

```json
{
  "mcp": {
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/sse",
      "headers": {
        "Authorization": "Bearer {env:SENTRY_TOKEN}"
      }
    },
    "grep-vercel": {
      "type": "remote",
      "url": "https://mcp.grep.app"
    }
  }
}
```

::: tip OAuth 自动处理
某些远程 MCP server 用 OAuth（如 Sentry），OpenCode 通过 Dynamic Client Registration 自动走流程，不用手贴 token。
:::

### Per-agent MCP

```json
{
  "agent": {
    "research-agent": {
      "mcp": ["context7", "scout"]
    }
  }
}
```

只把指定的 MCP server 给某个 agent——避免无关 tool 污染上下文。

::: warning MCP 加进上下文要谨慎
`@modelcontextprotocol/server-github` 暴露 100+ tool，token 消耗大。原则：「**装少而精**」+ 按需开。
:::

## 变量插值

`opencode.json` 支持环境变量与文件内容插值：

```json
{
  "provider": {
    "anthropic": {
      "options": { "apiKey": "{env:ANTHROPIC_API_KEY}" }
    }
  },
  "instructions": [
    "{file:docs/team-rules.md}",
    "packages/*/AGENTS.md"
  ]
}
```

- `{env:VAR}` → 环境变量
- `{file:path/to/file}` → 文件内容
- `instructions` 字段还支持 glob（自动展开）

适合管理多人共享凭据与团队规则。

## 主题与键位

### 主题

```bash
/theme
```

内置：`opencode`（默认）/ `tokyonight` / `everforest` / `catppuccin` / `gruvbox` / `nord` / `system` 等。

`tui.json` 中：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "tokyonight"
}
```

`system` 主题用终端 ANSI 调色板——跟随系统暗 / 亮色。

### 自定义主题

`~/.config/opencode/themes/<name>.json`：

```json
{
  "defs": {
    "bg": "#1a1b26",
    "fg": "#a9b1d6"
  },
  "background": "@bg",
  "foreground": "@fg"
}
```

支持 hex / ANSI / `defs` 复用 / `"none"` 继承终端。

### 键位

`tui.json` 配 `keybinds`：

```json
{
  "leader": "ctrl+x",
  "leader_timeout": 2000,
  "keybinds": {
    "session_new": "ctrl+x n",
    "session_list": "ctrl+x s",
    "model_select": "ctrl+x m"
  }
}
```

OpenCode 用 **leader key** 避免与终端冲突（默认 `Ctrl+X`）。先按 leader 再按操作键。

## Session 管理

### 列出 / 恢复

```bash
opencode session list
opencode session show <session-id>
opencode session export <session-id> > out.json
opencode session import < out.json

# CLI 继续上次
opencode --continue
opencode --continue "再补一段例子"
```

### Share

```
（TUI 内）
/share
```

生成可读链接（含完整对话历史 + tool 调用），方便：

- 让队友看你做了啥
- 给作者复现 bug
- 教学 / Demo

### 多 session 并行

OpenCode 支持同项目多个 session 同时跑——TUI 顶栏切换或新开终端再 `opencode`，互不干扰。Build 一个写代码，Plan 一个想方案是典型组合。

## opencode.json 与 tui.json

OpenCode 把配置拆成两个文件：

| 文件 | 作用 | 位置 |
| --- | --- | --- |
| `opencode.json` | 模型 / 权限 / agent / MCP / 命令 | 项目根 + 全局 |
| `tui.json` | 主题 / 键位 / 滚动 / 通知 | 全局 |

### 合并优先级（低 → 高）

1. 远程 config（`.well-known/opencode` 组织默认）
2. 用户全局（`~/.config/opencode/opencode.json`）
3. `OPENCODE_CONFIG` 环境变量指定的路径
4. 项目配置（`<project>/opencode.json`）
5. Managed settings（管理员强制，最高）

后者覆盖前者，配置是 **合并** 而非替换。

## 与 Codex / Gemini CLI / Claude Code 对比

| 维度 | OpenCode | Codex CLI | Gemini CLI | Claude Code |
| --- | --- | --- | --- | --- |
| 模型 | **75+ provider** | OpenAI 主 + 少数其他 | Google Gemini | Anthropic Claude |
| 开源 | **✓ MIT** | ✓ Apache-2.0 | 部分 | ✗ |
| 私有部署 | **任意** | 仅 OpenAI 服务 | Vertex | Bedrock / Vertex |
| 中国可用 | **极友好**（DeepSeek / Ollama） | 需自备网络 | 需自备网络 | 需自备网络 |
| Modes | Plan / Build / 自定义 | Plan + sandbox 矩阵 | 受限 | default / accept / bypass / plan |
| Skills 体系 | ✗（用 prompt） | ✗ | ✗ | ✓ |
| Hooks | 简化 | ✓ | 受限 | ✓ |
| MCP | ✓（一类） | ✓ | ✓（部分） | ✓（一类） |
| Subagents | ✓（内置 + 自定义） | ✓ | ✗ | ✓ |
| LSP 内置 | ✓ | ✗ | ✗ | ✗ |
| Session 分享 | **✓ /share** | ✗ | ✗ | ✗ |
| TUI 颜值 | **极高**（多主题） | 一般 | 一般 | 一般 |

::: tip 怎么选
- **想用任意模型（含本地）+ 中国大陆** → **OpenCode**
- **重度 Anthropic 用户 + 要 Skill / Hook / Memory** → Claude Code
- **重度 OpenAI 用户 + 要 sandbox 细粒度** → Codex CLI
- **重度 Google 用户 + 要 1M Gemini** → Gemini CLI
:::

## 大陆访问优势

OpenCode 在大陆是**最容易跑起来**的 Agent CLI，因为不绑模型：

```bash
# 1. DeepSeek 直连（国内可用，便宜）
/connect
> deepseek
> [填 API key]
/models
> deepseek/deepseek-v3

# 2. Ollama 本地（完全离线，无需网络）
ollama pull llama-3.3-70b
/connect
> ollama
> baseURL: http://localhost:11434
/models
> ollama/llama-3.3-70b

# 3. 自家公司的 OpenAI 兼容代理
/connect
> Other
> baseURL: https://llm.mycorp.com/v1
> model: gpt-4o
```

::: tip 混搭最香
日常 `deepseek/deepseek-v3`（便宜快速），复杂规划临时切 `anthropic/claude-opus-4-7`（走 OpenRouter 接 Anthropic 也行），离线时切 `ollama/llama-3.3-70b`——一份 `auth.json` 都装上，`/models` 随时切。
:::

## 调试 OpenCode 自身

```bash
# 详细日志
opencode --debug

# dump 配置
opencode --print-config

# 临时禁用 LSP
opencode --no-lsp

# 不读 file watcher
OPENCODE_EXPERIMENTAL_DISABLE_WATCHER=1 opencode

# 强制走自定义配置
OPENCODE_CONFIG=./profiles/ci.json opencode
```

日志位置：`~/.local/share/opencode/logs/`。

## 性能优化

<v-clicks>

- **`small_model` 必配**：标题生成 / 总结用便宜模型（如 `anthropic/claude-haiku`），主任务用 Sonnet
- **MCP 装少**：每个 MCP server 占上下文，按需启
- **lsp 关闭**：experimental 阶段偶尔慢，复杂仓库可临时 `--no-lsp`
- **plan 模式规划**：复杂任务先 Plan 出方案，再 Build 实施——避免 Build 反复改
- **subagent 跑大搜索**：`@explore` 几十文件搜索后只返回结果，主线程上下文压力小
- **多 provider 备份**：限流时切到 OpenRouter 或本地 Ollama 顶上

</v-clicks>

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `/connect` 后没出现 provider | 检查 `~/.local/share/opencode/auth.json` 写入了吗 |
| 模型选不到 | `/models` 看具体 provider 是否连通，可能 baseURL 错 |
| MCP server 红色未连接 | 终端跑 `command + args` 看 stderr |
| AGENTS.md 不生效 | 路径在项目根吗 + 重启 opencode |
| 自定义 agent 不识别 | `.opencode/agents/<name>.md` 文件名对吗 |
| TUI 渲染乱码 | 换主题（`/theme system`）或换 terminal emulator |
| Plan 模式仍在改文件 | 确认顶栏 agent 显示 `plan` 而非 `build` |
| 大陆连不上 OpenAI | 换 provider 走 OpenRouter / DeepSeek / Ollama |

## 安全考量

<v-clicks>

- **auth.json 别 commit**：默认在 `~/.local/share/opencode/auth.json`（chmod 600）
- **AGENTS.md 是 prompt injection 面**：克隆陌生仓库先看内容
- **MCP server 是代码执行点**：装前看源码 / 用知名包
- **bash 全开很危险**：生产 / 共享机器改 `"*": "ask"` + 白名单
- **远程 MCP token 用变量**：用 `{env:...}` 而非硬编码
- **.env 默认 deny 读取**：保持默认，不要轻易改

</v-clicks>

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.x | 2025 初 | sst 团队启动，TUI 雏形 |
| 1.0 | 2025 中 | TypeScript 重写 / Models.dev 接入 |
| 1.5 | 2025 末 | MCP 一类支持 / Plan-Build agent |
| 2.0 | 2026 初 | Subagents 内置 / OpenCode Zen 上线 |
| 2.x | 2026 | Session 分享 / 桌面 App beta / Web UI |
