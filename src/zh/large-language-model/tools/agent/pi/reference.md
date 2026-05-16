---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Pi 0.74.x（2026 年 5 月）编写。完整文档见 [pi.dev](https://pi.dev/) 及作者博客 [mariozechner.at](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。

## CLI 全 flag

```bash
pi [prompt] [flags]
```

| Flag | 说明 |
| --- | --- |
| `-h, --help` | 帮助 |
| `-v, --version` | 版本 |
| `-p, --print <prompt>` | Print 模式（单次执行后退出） |
| `--json` | JSON 输出（结构化） |
| `--model <id>` | 指定模型 |
| `--provider <name>` | 指定 provider |
| `--tools <list>` | 限定可用工具集（如 `read,bash`） |
| `--session <path>` | 加载指定 session 文件 |
| `--resume <session-id>` | 恢复指定会话 |
| `--from <message-id>` | 从指定节点分叉 |
| `--cwd <dir>` | 指定工作目录 |
| `--dry-run` | 不调 LLM，仅测试本地配置 |
| `--debug` | 详细日志 |
| `--print-config` | 启动时输出当前配置 |
| `--no-extensions` | 跳过加载扩展 |
| `--no-skills` | 跳过加载 skills |

```bash
# 单次执行
pi -p "总结 README.md 主要内容"

# JSON 输出
pi --json -p "查 Vue 组件清单"

# 仅允许 read + bash
pi --tools read,bash

# 恢复会话
pi --resume abc-123

# 从特定节点分叉
pi --resume abc-123 --from msg-5

# 指定 model + provider
pi --provider anthropic --model claude-opus-4-7
```

## 子命令

```bash
pi auth login [--provider <name>]   # 登录/添加凭据
pi auth list                         # 列已配 provider
pi auth remove <provider>            # 移除凭据

pi sessions list                     # 列会话
pi sessions show <id>                # 看会话
pi sessions delete <id>              # 删

pi install <package>                 # 装扩展或 Pi Package
pi uninstall <package>
pi list                              # 列已装扩展

pi rpc [--port <port>]               # RPC mode 启动
pi serve                             # Web UI（实验）
```

## 配置文件位置

| 路径 | 作用 | 优先级 |
| --- | --- | --- |
| `~/.config/pi/config.json` | 用户全局配置 | 低 |
| `<project>/.pi/config.json` | 项目共享（commit） | 中 |
| `<project>/.pi/config.local.json` | 项目本地（不 commit） | 高 |
| `~/.config/pi/auth.json` | provider 凭据 | - |
| `<project>/AGENTS.md` | 项目说明书 | - |
| `~/.config/pi/AGENTS.md` | 用户全局说明书 | - |

::: warning macOS / Linux / Windows 路径

- macOS / Linux: `~/.config/pi/`
- Windows: `%APPDATA%\pi\`

:::

## config.json Schema

```json
{
  "$schema": "https://pi.dev/schema/config.json",
  "model": "claude-sonnet-4-6",
  "provider": "anthropic",
  "tools": ["read", "write", "edit", "bash"],
  "skills": ["~/.config/pi/skills/*"],
  "extensions": ["~/.config/pi/extensions/*"],
  "theme": "default",
  "telemetry": { "enabled": false },
  "compaction": {
    "enabled": true,
    "threshold": 0.8
  }
}
```

### `tools` 字段

工具白名单，默认全部允许：

```json
{
  "tools": ["read", "write", "edit", "bash"]
}
```

仅启用读取：

```json
{
  "tools": ["read", "grep", "find", "ls"]
}
```

### `compaction` 字段

```json
{
  "compaction": {
    "enabled": true,
    "threshold": 0.8,
    "preserveLastN": 20
  }
}
```

| 字段 | 含义 |
| --- | --- |
| `enabled` | 启用自动压缩 |
| `threshold` | 触发阈值（占 context 比例） |
| `preserveLastN` | 末尾保留 N 条消息不压 |

## auth.json Schema

```json
{
  "anthropic": {
    "apiKey": "sk-ant-...",
    "baseURL": "https://api.anthropic.com"
  },
  "openai": {
    "apiKey": "sk-..."
  },
  "google": {
    "apiKey": "..."
  },
  "ollama": {
    "baseURL": "http://localhost:11434"
  },
  "claude-pro": {
    "oauthToken": "...",
    "refreshToken": "..."
  }
}
```

::: tip 凭据优先级

CLI flag > 环境变量 > `auth.json` > 自定义 provider 配置。

:::

## 内置工具

| 工具 | 用途 | 入参 |
| --- | --- | --- |
| `read` | 读文件 / 图片 | `path` + 可选 `offset` / `limit` |
| `write` | 写整个文件（覆盖） | `path` + `content` |
| `edit` | 精确 string replace | `path` + `old_string` + `new_string` + 可选 `replace_all` |
| `bash` | 执行 shell 命令 | `command` + 可选 `timeout` |

### 可选受限工具

通过 `--tools` 启用，提供 bash 子集：

| 工具 | 等价 bash |
| --- | --- |
| `grep` | `rg <pattern>` 或 `grep -r <pattern>` |
| `find` | `find . -name <pattern>` |
| `ls` | `ls <path>` |

## Skill 目录结构

```
~/.config/pi/skills/<skill-name>/
├── SKILL.md              # 主指令（必需）
├── references/           # 引用资源
│   ├── docs.md
│   └── examples.ts
├── scripts/              # 工具脚本
│   └── helper.sh
└── data/
    └── snippets.json
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

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | ✓ | skill 名 |
| `description` | ✓ | 何时使用（pi 据此判断是否自动调） |
| `version` | - | 版本 |
| `author` | - | 作者 |

兼容 [agentskills.io](https://agentskills.io/) 标准——Claude Code 的 skill 直接放 `~/.config/pi/skills/` 即可用。

## Extension API

```ts
import type { Extension, ToolContext } from "@earendil-works/pi-agent-core";

export default {
  name: "my-extension",
  version: "1.0.0",
  tools: {
    [toolName]: {
      description: string,
      schema: JSONSchema,
      async execute(input, ctx: ToolContext): Promise<string> { ... }
    }
  },
  hooks: {
    onSessionStart(ctx) { ... },
    onSessionEnd(ctx) { ... },
    onMessage(message, ctx) { ... },
    onToolCall(name, input, ctx) { ... },
    onToolResult(name, output, ctx) { ... },
    beforeCompact(messages, ctx) { ... },
  },
  commands: {
    [commandName]: {
      description: string,
      async execute(args: string[], ctx): Promise<void> { ... }
    }
  },
} satisfies Extension;
```

### ToolContext

```ts
interface ToolContext {
  sessionId: string;
  workingDir: string;
  model: string;
  provider: string;
  messages: Message[];
  metadata: Record<string, any>;

  // 用于扩展间通信
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
}
```

### Hook 触发顺序

```
session start
  → onSessionStart
  ↓
user message
  → onMessage
  ↓
LLM response with tool calls
  → for each tool call:
      → onToolCall(name, input)
      → execute tool
      → onToolResult(name, output)
  ↓
session end
  → onSessionEnd
```

## Slash 命令

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示所有 slash 命令 |
| `/model <id>` | 切换模型 |
| `/provider <name>` | 切换 provider |
| `/clear` | 清空当前会话 |
| `/compact` | 手动压缩历史 |
| `/usage` | 看 token 用量 + 费用 |
| `/sessions` | 看会话列表 |
| `/resume <id>` | 恢复会话 |
| `/skills` | 列已加载 skills |
| `/extensions` | 列已加载 extensions |
| `/<custom>` | 用户/扩展自定义命令 |
| `/quit` | 退出 |

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Anthropic key |
| `OPENAI_API_KEY` | OpenAI key |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Google key |
| `DEEPSEEK_API_KEY` | DeepSeek key |
| `GROQ_API_KEY` | Groq key |
| `XAI_API_KEY` | xAI key |
| `OPENROUTER_API_KEY` | OpenRouter key |
| `OLLAMA_BASE_URL` | Ollama 地址 |
| `PI_CONFIG_DIR` | 配置目录覆盖 |
| `PI_LOG_LEVEL` | debug / info / warn / error |
| `PI_NO_TELEMETRY` | 1 禁用遥测 |
| `HTTPS_PROXY` / `HTTP_PROXY` | 代理 |

## 支持的 Provider 速查

| Provider | 标识 | 类型 |
| --- | --- | --- |
| Anthropic | `anthropic` | API key |
| OpenAI | `openai` | API key |
| Google | `google` | API key |
| Azure OpenAI | `azure` | API key |
| Amazon Bedrock | `bedrock` | IAM |
| Mistral | `mistral` | API key |
| Groq | `groq` | API key |
| Cerebras | `cerebras` | API key |
| xAI | `xai` | API key |
| Cloudflare Workers AI | `cloudflare` | API key |
| DeepSeek | `deepseek` | API key（大陆友好） |
| Together AI | `together` | API key |
| Fireworks | `fireworks` | API key |
| OpenRouter | `openrouter` | API key（多模型聚合） |
| Vercel AI Gateway | `vercel` | API key |
| GitHub Copilot | `github-copilot` | OAuth |
| Hugging Face | `huggingface` | API key |
| Claude Pro/Max | `claude-pro` | OAuth |
| ChatGPT Plus/Pro | `chatgpt-plus` | OAuth |
| Ollama | `ollama` | URL |
| vLLM | `vllm` | URL |
| LM Studio | `lm-studio` | URL |
| 通义千问 | `qwen` | API key |
| MiniMax | `minimax` | API key |
| Kimi（月之暗面） | `kimi` | API key |
| 自定义 OpenAI 兼容 | `<custom>` | URL + key |

合计 25+ 主流 + 任意 OpenAI 兼容 API。完整列表见 `pi auth login` 交互菜单。

## SDK 接口

```ts
import { Agent, type AgentOptions } from "@earendil-works/pi-agent-core";

const agent = new Agent({
  model: "claude-sonnet-4-6",
  provider: "anthropic",
  tools: ["read", "write", "edit", "bash"],
  extensions: [...],
  workingDir: process.cwd(),
  systemPrompt: "...",  // 可覆盖默认
} satisfies AgentOptions);

// 单次跑
const result = await agent.run("帮我...");
// { messages, toolCalls, usage }

// 流式
for await (const event of agent.stream("帮我...")) {
  console.log(event);
}

// 多轮 session
const session = agent.session();
await session.send("first turn");
await session.send("second turn");

// 树形分叉
const branch = session.branch("msg-3");
await branch.send("alternative approach");
```

## JSON Mode 输出格式

```bash
pi --json -p "..."
```

输出：

```json
{
  "sessionId": "...",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "...", "toolCalls": [...] }
  ],
  "toolCalls": [
    { "name": "read", "input": {...}, "output": "..." }
  ],
  "usage": {
    "inputTokens": 1234,
    "outputTokens": 567,
    "cacheReadTokens": 800,
    "cacheWriteTokens": 0
  },
  "model": "claude-sonnet-4-6",
  "provider": "anthropic",
  "duration": 12345
}
```

适合二次处理 / CI 集成 / 测试 fixture。

## RPC Mode 端点

```bash
pi rpc --port 9090
```

| 端点 | 作用 |
| --- | --- |
| `POST /run` | 同步跑一次 |
| `POST /stream` | SSE 流式跑 |
| `POST /session/create` | 创建会话 |
| `POST /session/<id>/send` | 给会话发消息 |
| `GET /session/<id>` | 看会话内容 |
| `GET /sessions` | 列所有会话 |
| `DELETE /session/<id>` | 删会话 |
| `GET /health` | 健康检查 |

示例：

```bash
curl -X POST localhost:9090/run \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "总结 README.md",
    "model": "claude-sonnet-4-6"
  }'
```

## 错误码

| 现象 | 含义 |
| --- | --- |
| `authentication_error` | API key / OAuth 无效 |
| `provider_not_configured` | 该 provider 未配凭据 |
| `model_not_found` | 模型 ID 不存在或 provider 不支持 |
| `tool_not_allowed` | 工具被 `--tools` 限制 |
| `context_length_exceeded` | 上下文窗口满 |
| `rate_limit_error` | 触发 provider 速率限制 |
| `extension_load_failed` | 扩展加载失败（看 `--debug`） |

## 价格（截至 2026.5）

Pi **本身免费 + 开源**，仅消耗 LLM provider token：

| Provider | 模型示例 | 输入价格 ($/M tokens) | 输出价格 |
| --- | --- | --- | --- |
| Anthropic | Sonnet 4.6 | $3 | $15 |
| Anthropic | Opus 4.7 | $15 | $75 |
| OpenAI | GPT-5 | $15 | $60 |
| Google | Gemini 2.5 Pro | $1.25 | $10 |
| DeepSeek | V3 | $0.27 | $1.10 |
| Groq | Llama 70B | $0.59 | $0.79 |
| Ollama | 本地 | $0 | $0 |

::: tip 省钱套路

- 规划用 Sonnet / DeepSeek，仅复杂方案切 Opus
- 长上下文用 Gemini 2.5 Pro（1M 上下文 + 便宜）
- 本地有 GPU 跑 Ollama 替代云端简单任务
- `--print` 单次执行 + `/compact` 频繁压缩

:::

## 资源链接

- 官网：[pi.dev](https://pi.dev/)
- GitHub：[earendil-works/pi](https://github.com/earendil-works/pi)
- npm 包：[`@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- 作者博客：[mariozechner.at](https://mariozechner.at/)
  - [What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)（设计哲学）
  - [I've sold out](https://mariozechner.at/posts/2026-04-08-ive-sold-out/)（加入 Earendil 公告）
- Skills 标准：[agentskills.io](https://agentskills.io/)
- 第三方评测：[agenticengineer.com: The Only Claude Code Competitor](https://agenticengineer.com/the-only-claude-code-competitor)
- 相关项目：[OpenClaw](https://openclaw.dev/)（Pi 在通讯平台的产品形态）
- 对比阅读：[Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)（Anthropic 自家 harness，与 Pi 不同产品）
- libGDX（作者另一项目）：[libgdx.com](https://libgdx.com/)
