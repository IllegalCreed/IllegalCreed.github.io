---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Claude Code 2.x 编写

## 速查

- 模型切换：`/model` 选 Opus / Sonnet / Haiku 或带 `[1m]` 后缀的 1M 上下文版
- 长任务暂停：Claude Code 自动后台跑，UI 提示 "running in background"
- 自定义指令：`~/.claude/skills/<name>/SKILL.md` → `/<name>` 调用
- 自定义 hook：`~/.claude/settings.json` 的 `hooks` 字段
- MCP 配置：`~/.claude/settings.json` 或 `.claude/settings.local.json`
- 项目级 memory：`./CLAUDE.md` / 用户级：`~/.claude/CLAUDE.md`
- 跨会话状态：`auto memory` 写入 `~/.claude/projects/<encoded-path>/memory/`
- 子代理 spawn：用 Agent 工具，subagent_type 可选 Explore / general-purpose / 自定义
- 永久退出会话：`Ctrl+C` 两次

## 模型选择

Claude Code 支持 Anthropic 全模型矩阵。在交互里用 `/model` 切换：

| 模型 ID | 别名 | 适合 |
| --- | --- | --- |
| `claude-opus-4-7` | Opus 4.7 | 复杂规划 / 大项目重构 / 难 debug |
| `claude-opus-4-7[1m]` | Opus 4.7 1M 上下文 | 整本仓库 / 长会话 |
| `claude-sonnet-4-6` | Sonnet 4.6 | 日常编码（性能/速度平衡） |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | 简单脚本 / 快速回答 |

**何时切**：

- 复杂方案设计 → Opus
- 写实现 / 改 bug → Sonnet（90% 时间用它）
- 需要把整个仓库塞进上下文 → Opus[1m]
- 简单 grep / list / 一行答 → Haiku

```bash
# 启动时指定
claude --model opus
claude --model sonnet
claude --model haiku
```

::: tip Plan / Fast 模式

- `claude --plan`：进入 **Plan Mode**——读写文件但不执行修改；适合先用 Opus 规划，approve plan 后再切 Sonnet 实施
- `/fast` 切到 fast 模式（Opus 4.7 支持）：流式输出更快

:::

## 权限模式

按 `Shift+Tab` 在四种模式间循环：

| 模式 | 行为 |
| --- | --- |
| `default` | 每次写操作（Edit / Write / Bash）都询问 |
| `acceptEdits` | 自动接受 Edit / Write；Bash 仍询问 |
| `bypassPermissions` | 全部自动（仅本地受信任仓库用） |
| `plan` | 仅读不写，规划阶段用 |

```json
// ~/.claude/settings.json
{
  "permissions": {
    "allow": ["Bash(pnpm:*)", "Bash(git status:*)", "Read(*)"],
    "deny": ["Bash(rm -rf:*)", "Bash(git push --force:*)"]
  }
}
```

`allow` / `deny` 用 **PermissionRule** 格式：`<Tool>(<arg-pattern>)`。匹配规则比模式优先，永远先匹配 deny 再匹配 allow。

::: warning bypassPermissions 慎用

公共仓库 + bypassPermissions = Claude 可能自动跑任何 Bash 命令。建议：

- 仅个人本地 sandbox 项目用
- 用 acceptEdits 而非 bypass（仍卡住 Bash 询问）
- `~/.claude/settings.json` 全局加 deny 规则保护 `rm -rf` / `git push --force` 等高危

:::

## Slash 命令深入

### 自定义 slash 命令

把任意 markdown 放 `~/.claude/commands/<name>.md`，文件内容即 prompt：

```md
<!-- ~/.claude/commands/lint.md -->
对当前 staged 文件跑 lint 检查，输出问题列表。
不要自动修复，仅报告。
```

之后在 CLI 里 `/lint` 触发——Claude 会按文件内容理解任务并执行。

::: tip 项目级命令

`./.claude/commands/<name>.md` 提交进仓库，团队共享。常用于「跑测试」「打包发布」等流程封装。

:::

### 内置常用命令

| 命令 | 作用 |
| --- | --- |
| `/cost` | 显示当前会话 token 与费用 |
| `/release-notes` | 看本版本更新 |
| `/bug` | 反馈 bug 到 GitHub |
| `/feedback` | 反馈使用建议 |
| `/init` | 生成 CLAUDE.md 骨架 |
| `/agents` | 列出已配置的 subagent |
| `/skill <name>` | 触发指定 skill |
| `/hooks` | 查看 hook |
| `/permissions` | 管理工具权限 |
| `/mcp` | 查看 MCP server 状态 |

## Skills：可复用指令包

Skill 是 Claude Code 的「插件机制」——一个 SKILL.md 文件 + 关联资源，可被 `/<name>` 触发自动加载。

```
~/.claude/skills/cypress-skill/
├── SKILL.md                 # 主指令
├── examples/                # 引用资源
│   ├── good-test.cy.ts
│   └── bad-test.cy.ts
└── snippets/
    └── beforeEach.ts
```

SKILL.md 的 frontmatter：

```md
---
name: cypress-skill
description: Use when writing Cypress E2E tests for this project
---

# Cypress 测试规范

E2E 测试必须：

1. 用 test 服务器（端口 10060，test DB）
2. ...
```

Claude Code 启动时读 `~/.claude/skills/*/SKILL.md`，把 `name` + `description` 放进系统提示。当用户问题匹配 description 时，Claude 自动调用。

### 流行 skills

- **superpowers**：通用工程实践（TDD / 调试 / 评审）
- **easy-claude-code (ECC)**：简化 Claude Code 使用流程
- 项目自家 skill：`apps/quiz-admin/.claude/skills/cypress-skill/`（项目级）

详见 [Superpowers](../../../skills/superpowers/) 与 [Easy Claude Code](../../../skills/easy-claude-code/)。

## Hooks：tool 前后注入逻辑

Hooks 是 tool 调用前/后跑的自定义 shell 命令——常用于审计 / 通知 / lint。

```json
// ~/.claude/settings.json
{
  "hooks": [
    {
      "matcher": { "tool": "Edit" },
      "hooks": [
        {
          "type": "command",
          "command": "echo \"[edit] $CLAUDE_TOOL_PATH at $(date)\" >> ~/edit.log"
        }
      ]
    },
    {
      "matcher": { "tool": "Bash" },
      "hooks": [
        {
          "type": "command",
          "command": "echo \"[bash] $CLAUDE_TOOL_COMMAND\" >> ~/bash.log"
        }
      ]
    }
  ]
}
```

环境变量：

| 变量 | 含义 |
| --- | --- |
| `$CLAUDE_TOOL_NAME` | Edit / Write / Bash / ... |
| `$CLAUDE_TOOL_PATH` | 操作的文件路径（Edit/Write/Read） |
| `$CLAUDE_TOOL_COMMAND` | Bash 命令 |
| `$CLAUDE_SESSION_ID` | 当前会话 ID |
| `$CLAUDE_PROJECT_DIR` | 项目根目录 |

### 常用 hook 场景

- **审计**：所有 Edit / Bash 记日志
- **通知**：长任务完成后系统通知 / Slack
- **lint**：Edit 后跑 lint-staged 自动格式化
- **保护**：Bash 前用脚本拦截高危命令

```json
{
  "hooks": [
    {
      "matcher": { "tool": "Edit" },
      "hooks": [
        {
          "type": "command",
          "command": "cd $CLAUDE_PROJECT_DIR && pnpm exec prettier --write $CLAUDE_TOOL_PATH"
        }
      ]
    }
  ]
}
```

::: tip 阻塞 hook

hook 返回非 0 退出码会**阻塞 tool 调用**——可用于「Bash 前必须 lint 通过」等强约束。慎用以免卡死。

:::

## MCP（Model Context Protocol）

MCP 是 Anthropic 推动的「**让 LLM 接外部工具**」开放协议。Claude Code 一类支持，配置极简。

### 配置一个 MCP server

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    },
    "filesystem-readonly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/etc"]
    }
  }
}
```

启动后 `/mcp` 看连接状态：

```
context7              ✓ connected   (2 tools)
chrome-devtools       ✓ connected   (24 tools)
filesystem-readonly   ✓ connected   (5 tools)
```

### 常用 MCP server

| Server | 提供工具 |
| --- | --- |
| `@upstash/context7-mcp` | resolve-library-id / query-docs（最新库文档） |
| `chrome-devtools-mcp` | 浏览器操作 / 截图 / Console / 网络监控 |
| `@modelcontextprotocol/server-filesystem` | 受限文件读写 |
| `@modelcontextprotocol/server-github` | Issue / PR / Repo 操作 |
| `@modelcontextprotocol/server-postgres` | Postgres 查询 |
| `brave-search-mcp` | Brave Search API |

### MCP vs 内置工具

| 维度 | 内置工具 | MCP |
| --- | --- | --- |
| 数量 | 固定 | 可装无限多 |
| 启动 | 即时 | 需 spawn 子进程 |
| 范围 | 通用（Read / Bash 等） | 专项（每个 server 一类） |
| 鉴权 | 项目级 | server 自管 |
| 更新 | 跟 Claude Code | 独立 |

::: tip 一类 vs 二类

Claude Code 区分「**built-in tool**」（Read / Edit / Write / Bash 等）与「**MCP tool**」（`mcp__server-name__tool-name` 命名）。

- 内置工具：一直可用
- MCP tool：default permission 是 `mcpServers` 全允许，可在 `permissions.deny` 单独禁用

:::

## Subagents：并行任务

Claude Code 内置 Agent 工具，可 spawn 子代理处理独立任务：

```
（在 CLI 里）
> 帮我并行做三件事：
>   1. 用 Explore 查找所有 React 组件
>   2. 用 general-purpose 总结测试覆盖率
>   3. 用 code-reviewer 评审 PR #123
```

Claude 会调 Agent 工具三次，每个子代理独立上下文跑。

### 内置 subagent 类型

| 类型 | 工具 | 适合 |
| --- | --- | --- |
| `Explore` | 只读（无 Edit / Write） | 大范围搜索 / 找代码 |
| `general-purpose` | 全工具 | 复杂多步任务 |
| `Plan` | 只读 | 规划实施步骤 |
| `feature-dev:code-explorer` | 只读 | 深入分析现有代码 |
| `feature-dev:code-architect` | 只读 + 写设计 | 设计新功能 |
| `feature-dev:code-reviewer` | 只读 | 代码评审 |

### 自定义 subagent

`~/.claude/agents/<name>.md`：

```md
---
name: typescript-bug-hunter
description: Specialized agent for finding subtle TS bugs
tools: ["Read", "Grep", "Glob"]
---

You are an expert TypeScript bug hunter. Focus on:
- Type narrowing issues
- Generic constraint problems
- Missing `as const` / `satisfies`
...
```

之后用 Agent 工具 `subagent_type: "typescript-bug-hunter"` 调用。

::: tip 何时 spawn subagent

- **独立大任务**：分给子代理跑，主线程继续别的事
- **避免污染主上下文**：搜索几十个文件后只要结果，不要把所有内容塞主历史
- **领域专家**：需要特定 prompt + tool 子集

:::

## Memory 系统

Claude Code 2.x 引入持久化 Memory——跨会话累积用户偏好 / 项目知识 / 反馈。

```
~/.claude/projects/<encoded-cwd>/memory/
├── MEMORY.md          # 索引（一行一个 memory 条目，前 200 行常驻上下文）
├── user_role.md
├── feedback_quiz_quantity.md
├── project_release_freeze.md
└── reference_grafana.md
```

每条 memory 是独立 markdown 含 frontmatter：

```md
---
name: feedback-tdd-required
description: integration tests must hit real DB, not mocks
metadata:
  type: feedback
---

集成测试必须连真实数据库。

**Why**: 上季度 mock 测试通过但 prod migration 挂了。

**How to apply**: 看到 `vi.mock('@/lib/db')` 立即提醒。
```

类型：

| type | 用途 |
| --- | --- |
| `user` | 用户角色 / 偏好 |
| `feedback` | 用户纠正过的事（避免重犯） |
| `project` | 项目动向（计划 / 决策 / 里程碑） |
| `reference` | 外部资源指针（Linear / Grafana / Slack 链接） |

Claude 在「**user 显式要求 / 学到新事实 / 收到纠正**」时自动写 memory。下次会话开场把 `MEMORY.md` 索引塞进 system prompt。

## 后台任务

长跑命令（dev server / 测试 / build）Claude 自动放后台：

```
> 启动 dev server，跑测试
（Claude 启动 pnpm dev，标记 run_in_background: true）

You can now do other things. Notifications arrive when ready.

> 怎么 dev server 加 --host 0.0.0.0 ？
（Claude 改命令重启）
```

监控用 `Monitor` 工具——观察日志，按需停或继续。

::: tip 多任务同时跑

单会话能后台跑多个进程（dev / test / lint 并存）。`pgrep` / Task ID 管理。

:::

## VS Code / JetBrains 扩展

CLI 是核心，但 IDE 扩展提供更好的交互：

- **VS Code**：装 `Claude` 扩展（搜 publisher: Anthropic），右键 / 命令面板 / 侧栏对话
- **JetBrains（IDEA / WebStorm / PyCharm 等）**：Plugin Marketplace 搜 `Claude Code`

IDE 扩展的优势：

- 选中代码后右键直接 Refactor / Explain / Fix
- 文件树整合（点文件加进上下文）
- diff 视图（提议的修改可逐 hunk 接受）
- 内嵌 Markdown 渲染对话

但**部分高级特性（hook / MCP 配置）仍要 CLI 配**——IDE 扩展共享 `~/.claude/settings.json`。

## Web 版（claude.ai/code）

[claude.ai/code](https://claude.ai/code) 是「无需安装」的 Web 版：

- 浏览器即开即用
- 与桌面 Claude.ai 共享对话历史
- 支持 GitHub 仓库直连（Pro+）

**限制**：

- 无本地文件 / shell
- MCP 仅支持远程 MCP（Anthropic 托管）
- hooks 不可用
- 适合「**轻量场景 / 出差 / 不想装本地工具**」

## SDK（Agent SDK）

[Anthropic Agent SDK](https://docs.claude.com/en/api/agent-sdk) 是「**让你的应用嵌入 Claude Code 内核**」的库：

```python
from claude_agent_sdk import Agent, tool

@tool
def search_db(query: str) -> str:
    return db.query(query)

agent = Agent(
    model="claude-opus-4-7",
    tools=[search_db],
    permission_mode="acceptEdits",
)

result = agent.run("帮我查一下昨天注册的用户")
```

适合：

- 自家 CLI / Web 工具集成 Claude Code 能力
- Slack bot / Discord bot
- 内部工具自动化

详见 [Anthropic Agent SDK 文档](https://docs.claude.com/en/api/agent-sdk)。

## 与 Codex / Gemini CLI / OpenCode 对比

| 维度 | Claude Code | Codex | Gemini CLI | OpenCode |
| --- | --- | --- | --- | --- |
| 模型 | Anthropic（Opus / Sonnet / Haiku） | OpenAI（GPT / o-series） | Google（Gemini） | 任意（OpenRouter / 本地） |
| 上下文窗口 | 200K / 1M | 200K | 1M（Gemini 2.5+） | 取决于模型 |
| Hooks | ✓ | -（受限） | -（受限） | ✓ |
| MCP | ✓（一类） | ✓ | ✓（部分） | ✓ |
| Skills | ✓ | -（用 prompt） | -（用 prompt） | -（用 prompt） |
| 开源 | ✗ | ✗ | 部分 | ✓ |
| 私有部署 | 仅 Bedrock / Vertex | 仅 OpenAI 服务 | Vertex | 任意 |
| 中国可用 | 需自备网络 | 需自备网络 | 需自备网络 | 看用什么模型 |

详见 [Codex](../codex/) / [Gemini CLI](../gemini-cli/) / [OpenCode](../opencode/) 各自笔记。

## 常见用法模式

### 1. 接手陌生项目

```
> 这是个新仓库我刚 clone。先帮我快速理解：
>   1. 项目用什么技术栈？
>   2. 主要功能有哪些（看 README + 路由 + 主入口）
>   3. 怎么本地起？
```

Claude 调 Read + Glob 看 `package.json` / `README.md` / 路由文件，回总结。

### 2. 紧急 hotfix

```
> 线上报错 "Cannot read property 'name' of undefined" 在 /api/users/[id] 路由。
> 帮我查根因 + 修复 + 加测试
```

Claude 会读路由代码 / 复现 / 修复 / 加 unit test，并跑测试确认。

### 3. 重构

```
> 把 src/utils/format.ts 里的 formatDate 函数重构：
>   1. 支持 i18n（接 locale 参数）
>   2. 抽出常量
>   3. 加 JSDoc
> 现有调用点不能改，保持 API 兼容
```

Claude 先 grep 所有调用点确认 API，然后改实现 + 测试。

### 4. 文档撰写

```
> 给 packages/ui 包写一份 README：
>   1. 安装步骤
>   2. 三个最常用组件的代码示例（看 src/index.ts 导出哪些）
>   3. 链接到 Storybook
```

### 5. 调试

```
> 我跑 pnpm test:e2e 失败，错误是 "Cannot find module './fixtures'"
> 帮我查根因
```

Claude 会读 e2e 配置 + 错误堆栈 + 文件结构，定位通常是路径 alias / build 步骤漏。

## 与 Git 工作流整合

```
> 看看当前 staged 改动，写个合适的 conventional commit message
（Claude 调 git diff + 分析 + 提议消息）

> commit 并 push
（Claude 调 git commit + push）

> 给最近的 commit 开 PR
（Claude 调 gh pr create）
```

::: warning 默认不 push

Claude Code 内置 hook 阻止 `git push origin main`（避免误操作 master）。需要时显式说「push 这一次」。

:::

## 调试 Claude Code 自身

```bash
# 详细日志
claude --debug

# 启动时 dump 配置
claude --print-config

# 跳过 update notifier（CI 用）
CLAUDE_NO_UPDATE=1 claude

# 强制不读 hooks（debug hook 卡死时用）
CLAUDE_NO_HOOKS=1 claude
```

日志位置：`~/.claude/logs/`。

## 性能优化

<v-clicks>

- **大仓库**：用 Opus[1m] 1M 上下文，或先 `/compact` 压缩历史
- **多文件读取慢**：批量 Read 一次（一个 message 多个 Read tool call）
- **MCP 启动慢**：`mcpServers` 中暂时禁用不用的，只保留当下需要的
- **hook 拖慢**：复杂 hook 放后台 / 改异步通知
- **频繁 Edit 反复 Read**：让 Claude 先把所有需要的文件读完再开始改

</v-clicks>

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `Authentication failed` | `/login` 重新 OAuth |
| 模型回复总是被截断 | 上下文窗口满了 → `/compact` |
| Hook 不触发 | `/hooks` 看配置 / `~/.claude/settings.json` 路径对吗 |
| MCP server 红色未连接 | 终端跑 server 命令看错 / npx 缓存 |
| Skill 不被识别 | `~/.claude/skills/<name>/SKILL.md` 名字对吗 + 重启 Claude Code |
| 中国大陆连不上 | 自备网络（无国内代理） |
| 高 token 用量 | `/cost` 看分布 + 关 1M 上下文 / 用 Sonnet |

## 安全考量

<v-clicks>

- **bypassPermissions 不要全局开**：让陌生仓库 / 公开仓库回到 default
- **CLAUDE.md 是 prompt injection 面**：克隆陌生仓库时先看 CLAUDE.md 内容
- **MCP server 是代码执行点**：装 server 前看源码 / 用知名包
- **hook 命令是 shell 注入面**：`$CLAUDE_TOOL_COMMAND` 等变量在 hook 里要 quote
- **token 不要 commit**：`~/.claude/credentials.json` 默认 chmod 600

</v-clicks>

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 1.0 | 2024 | 首个稳定版 |
| 1.5 | 2024 | Hooks 引入 |
| 1.8 | 2025 初 | MCP 支持 |
| 2.0 | 2025 | Skills 系统 / Subagents / Memory |
| 2.x | 2025-2026 | 1M 上下文 / fast 模式 / IDE 扩展增强 |
