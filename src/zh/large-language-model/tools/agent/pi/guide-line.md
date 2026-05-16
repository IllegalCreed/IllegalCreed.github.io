---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Pi 0.74.x（2026 年 5 月）编写。

## 速查

- 模型切换：`/model <id>`（mid-session 切换，上下文保留）
- 切 provider：`/provider <name>`
- 长任务暂停：`Esc` 中断 / `Ctrl+C` 两次退出
- 自定义指令：`~/.config/pi/skills/<name>.md` 或 `agentskills.io` 包
- 自定义工具：TypeScript 扩展 `~/.config/pi/extensions/<name>.ts`
- 项目说明：`./AGENTS.md`（兼容 `CLAUDE.md` 但优先 AGENTS.md）
- 多交互模式：TUI（默认） / Print / JSON / RPC / SDK 五种
- 会话分叉：tree-structured JSONL，可从任意节点回到分叉点重试
- 多 provider 同时配：一份 `auth.json` 存所有家凭据

## 极简哲学（Pi Way）

Pi 的设计原则在作者博客（2025-11-30）讲得很清楚：

::: tip 作者原文摘录

> Claude Code has turned into a spaceship with 80% of functionality I have no use for.
>
> If I don't need it，it won't be built.

:::

具体表现：

| 别人做 | Pi 选择 | 理由 |
| --- | --- | --- |
| 20+ 内置工具 | 4 个（read / write / edit / bash） | 「bash is all you need」 |
| 10K+ token 系统提示 | < 1000 token | 给模型留上下文 |
| 内置 Plan Mode | 用 PLAN.md 文件 | 持久化 + 可观察 |
| 内置 TODO 工具 | 用 TODO.md 文件 | 简单可见 |
| Sub-agents | bash spawn pi 自己 | 透明 + 不增复杂度 |
| MCP server | CLI + README | 上下文开销小 |
| 权限询问 | YOLO + 限工具集 | 信任用户 |
| 后台 bash | 用 tmux | 可观察 |

::: warning 不是反对功能，是反对**内置**

Pi 不阻止你用 Plan Mode / TODO / Sub-agents——只是不**内置**。需要时用文件 / bash / 扩展实现，主框架保持精简。

:::

## 四个核心工具详解

### `read`

读文件 / 图片 / 二进制 metadata：

```
- 支持 offset / limit 读大文件分段
- 自动识别图片（PNG / JPG / WebP），返回视觉描述
- PDF / Jupyter notebook 需扩展
```

### `write`

写整个文件（覆盖）。自动创建父目录。

### `edit`

精确 string replace 编辑：

```
- 必须 old_string 在文件中唯一
- 不唯一时报错，要求加更多上下文
- replace_all 标志可全文替换
```

### `bash`

执行 shell 命令：

```
- 默认同步 + 超时
- 长任务建议 tmux：bash "tmux new -d -s dev 'pnpm dev'"
- 后台进程观察：bash "tmux capture-pane -t dev -p"
```

::: tip 为什么只有 4 个

作者论点：现代 frontier 模型（Claude / GPT-5 / Gemini 2.5）经 RL 训练过，**已经懂编码 agent**——给它 read / write / edit / bash 就能完成 80% 任务。grep / find / ls 这些 bash 一行命令就能做，没必要单独工具。

可选只读变体（restrict）：

- `grep`：受限 read（仅搜索，不返回完整文件）
- `find`：受限 ls
- `ls`：受限 read

仅在「明确要限工具」场景启用。

:::

## 系统提示词哲学

Pi 系统提示词全文 < 1000 token：

```
You are pi, a minimal coding agent.

Tools:
- read: Read files. Args: path, offset?, limit?
- write: Write entire file. Args: path, content
- edit: Replace string in file. Args: path, old_string, new_string
- bash: Run shell command. Args: command, timeout?

Guidelines:
- Use bash for grep, find, ls (not separate tools)
- Prefer edit over write for partial changes
- Read AGENTS.md if present
- Be concise. Skip unnecessary explanations.
```

对比 Claude Code 系统提示词（10K+ token，含示例 / 流程 / 边界）：Pi 信任模型已经懂，**不再耳提面命**。

::: warning 为什么不用 MCP

作者实测：MCP server 协议本身要塞**7-9% 的上下文**（工具定义 / 协议样板）。改用「CLI + README」：

- 工具是普通 CLI，agent 通过 bash 调用
- 工具用法写在 README，agent 按需 bash 读
- 总开销可以低到 < 1% 上下文

:::

## 模式切换：5 种交互方式

### 1. TUI（默认）

```bash
pi
```

终端交互，markdown 渲染，差分屏更新（无闪烁）。日常用这个。

### 2. Print 模式

```bash
pi -p "总结 README.md 主要内容"
```

单次执行，输出文本后退出。脚本 / CI 用。

### 3. JSON 模式

```bash
pi --json -p "查 Vue 组件清单"
```

输出结构化 JSON：

```json
{
  "messages": [...],
  "toolCalls": [...],
  "usage": { "inputTokens": 1234, "outputTokens": 567 }
}
```

适合二次处理 / 集成其他系统。

### 4. RPC 模式

```bash
pi rpc --port 9090
```

启动后是 HTTP RPC server，外部应用通过 POST 调：

```bash
curl localhost:9090/run -d '{"prompt": "..."}'
```

适合**嵌入其他 Web 服务**（Slack bot / 内部工具）。

### 5. SDK 模式

```ts
import { Agent } from "@earendil-works/pi-agent-core";

const agent = new Agent({
  model: "claude-sonnet-4-6",
  provider: "anthropic",
  tools: ["read", "write", "edit", "bash"],
});

const result = await agent.run("帮我...");
```

直接 import 库做自家应用。

## Skills：可复用 Markdown 包

Pi 兼容 [agentskills.io](https://agentskills.io/) 标准——Markdown 描述的可复用工作流：

```
~/.config/pi/skills/cypress-skill/
├── SKILL.md             # 主指令
├── examples/
│   ├── good-test.cy.ts
│   └── bad-test.cy.ts
└── snippets/
    └── beforeEach.ts
```

SKILL.md frontmatter：

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

启动时 pi 扫 `skills/*/SKILL.md`，把 `name + description` 放进系统提示。**当用户问题匹配 description 时，pi 自动调用**。

::: tip Skills vs Claude Code Skills

格式几乎一致，所以 Claude Code 写的 skill 直接放 `~/.config/pi/skills/` 就能用。社区有 [superpowers](https://github.com/anthropics/superpowers)（TDD / debug / review） 等开箱即用包。

:::

## TypeScript Extensions：自定义工具 + 行为

需要新工具或修改 agent 行为时用 Extension（TS 模块）：

```
~/.config/pi/extensions/db-query/
├── package.json
├── index.ts
└── README.md
```

```ts
// index.ts
import type { Extension, ToolContext } from "@earendil-works/pi-agent-core";

export default {
  name: "db-query",
  tools: {
    queryDB: {
      description: "查询应用 PostgreSQL DB",
      schema: { sql: { type: "string" } },
      async execute({ sql }, ctx: ToolContext) {
        const conn = await pg.connect(process.env.DATABASE_URL);
        const result = await conn.query(sql);
        return JSON.stringify(result.rows);
      },
    },
  },
  hooks: {
    onSessionStart(ctx) {
      console.log("Session started:", ctx.sessionId);
    },
    onToolCall(name, input, ctx) {
      // 审计 / 日志
      if (name === "bash" && input.command.includes("rm -rf /")) {
        throw new Error("Blocked!");
      }
    },
  },
} satisfies Extension;
```

特性：

- **Hot reload**：保存 `.ts` 自动重载，无需重启 pi
- **完整 API 访问**：tools / hooks / session / messages / 模型调用
- **TypeScript 全类型**：所有 hook / context 有类型签名
- **npm 包形式分发**：`pi install <pkg>` 装别人写的扩展

## Pi Packages：第三层扩展

把多个扩展 + skills + prompts + themes 打成一个包：

```
my-team-pi/
├── package.json
├── extensions/
│   ├── db-tools/
│   └── slack-bot/
├── skills/
│   ├── code-review/
│   └── tdd/
├── prompts/
│   └── system-prefix.md
└── themes/
    └── ocean.json
```

发到 npm 后：

```bash
pi install @your-org/team-pi
```

整套配置全装好。**适合团队/企业一键统一所有人的 Pi 环境**。

## 多 Provider 同时配 + 切换

`auth.json` 存所有家凭据：

```json
{
  "anthropic": { "apiKey": "sk-ant-..." },
  "openai": { "apiKey": "sk-..." },
  "google": { "apiKey": "..." },
  "deepseek": { "apiKey": "sk-..." },
  "ollama": { "baseURL": "http://localhost:11434" },
  "groq": { "apiKey": "gsk-..." }
}
```

会话中切换：

```
/provider anthropic
/model claude-sonnet-4-6

# 切到本地 Ollama
/provider ollama
/model qwen2.5:7b
```

**保留完整上下文**——切模型相当于把对话历史灌给新模型继续聊。

::: tip 跨 provider 套路

- **规划用 Opus**（Anthropic 最聪明）→ **实施切 Sonnet**（便宜快）
- **代码生成用 GPT-5** → **审查切 Claude Opus**（互相挑刺）
- **隐私敏感切 Ollama 本地** → **公开任务回云**
- **大上下文用 Gemini 2.5 Pro**（1M） → **细节 Anthropic / OpenAI**

:::

## 会话格式：JSONL 树

Pi 用 tree-structured JSONL 存会话：

```
~/.config/pi/sessions/<session-id>.jsonl
```

每行一个事件：

```json
{"type": "message", "role": "user", "content": "...", "id": "msg-1"}
{"type": "message", "role": "assistant", "content": "...", "id": "msg-2", "parent": "msg-1"}
{"type": "tool_call", "name": "read", "input": {...}, "id": "tc-1", "parent": "msg-2"}
{"type": "tool_result", "output": "...", "id": "tr-1", "parent": "tc-1"}
{"type": "message", "role": "assistant", "content": "...", "id": "msg-3", "parent": "tr-1"}
```

**`parent` 字段让会话变成树**：可以从任意节点（msg-2）分叉，重新跑同一步用不同提示。原分支保留。

```bash
# 看历史
pi sessions list

# 恢复
pi --resume <session-id>

# 从特定节点分叉
pi --resume <session-id> --from msg-2
```

::: tip 为什么树形

线性历史无法表达「我想试试不同方向」。树形允许：

- 同一起点试 3 种 prompt 看哪种最好
- 失败分支保留，方便对比
- 后处理工具能完整重建决策过程

:::

## Context Compaction

会话长了自动总结老消息：

```
[turn 1-30]  ─── 完整保留 ───
[turn 31-50] ─── 完整保留 ───
[turn 51-100] → 压缩为「在 src/ 目录扫了 50 文件...」
[turn 101+]   ─── 完整保留 ───
```

触发条件：

- 接近模型 context 上限（80% 阈值）
- 手动 `/compact`

::: warning Compaction 注意

压缩会**丢失细节**——把 50 步操作浓缩成几行总结。对长会话末段没影响，但若需要回看 turn 51 的具体改动，要从 JSONL 里捞。

建议：长任务做完后**立即在会话里写 summary.md**（让 pi 自己写），不要依赖 compaction。

:::

## 与 OpenClaw 的关系

OpenClaw 是 Mario 后来基于 Pi 做的「**Personal Assistant**」——把 Pi 接进 WhatsApp / Telegram / Discord / Slack / Signal / iMessage / Google Chat / Microsoft Teams 等通讯平台。

```
WhatsApp ─┐
Slack    ─┼─→ OpenClaw → pi-agent-core → 各种 LLM
Discord  ─┘                    ↓
                            shared memory + sessions
```

OpenClaw 是 Pi 在「**通讯场景**」的产品形态；Pi 本身是「**终端场景**」的工具。技术栈完全共用。

## 与 Anthropic Managed Agents 的关系

::: warning 不是同一个东西

Anthropic 自家有「Managed Agents」服务——提供 session / harness / sandbox 三层托管基础设施，让你直接用 Anthropic 的 agent 系统跑长任务。这是**Anthropic 自家产品**。

Pi 是**第三方开源 harness**，仅把 Anthropic 模型作为多个 provider 之一接入。Pi 不依赖 Managed Agents API。

:::

| 维度 | Pi | Anthropic Managed Agents |
| --- | --- | --- |
| 谁做的 | Mario Zechner / Earendil | Anthropic 官方 |
| 部署 | 本地 / 自托管 | Anthropic 云托管 |
| 模型 | 25+ provider | 仅 Anthropic |
| 协议 | TypeScript SDK | Messages API + beta header |
| 计费 | 你的 provider key 直付 | 走 Anthropic 账单 |
| 开源 | MIT | 闭源服务 |

「Anthropic 的 Pi」是错的；Anthropic 没有叫 Pi 的产品。

## 与 Claude Code 对比

| 维度 | Pi | Claude Code |
| --- | --- | --- |
| 模型 | 25+ provider | 仅 Anthropic |
| 工具数 | 4 个 | 20+ |
| 系统提示 | < 1000 token | 10K+ token |
| 扩展 | TS Extensions / Skills / Pi Packages | Hooks / Skills / MCP / Subagents |
| MCP | ✗（CLI + README 替代） | ✓ 一类支持 |
| 权限询问 | YOLO 默认 | 四档（default / acceptEdits / bypass / plan） |
| 子代理 | bash spawn pi 自己 | Agent 工具内置 |
| Memory | 自管文件（AGENTS.md / MEMORY.md） | 自动 Memory 系统 |
| 开源 | MIT | 闭源 |
| 私有部署 | 任意 | Bedrock / Vertex |
| 大陆访问 | 用 DeepSeek / Ollama 等 | 需自备网络 |
| 适合人群 | 想完全控制 / 多模型 / 反对臃肿 | 想开箱即用 / Anthropic 重度 |

::: tip 选哪个

- **重度 Claude 用户 + 想要稳定开箱即用** → Claude Code
- **想跨多 provider + 自定义重度 + 完全开源** → Pi
- **大陆开发者** → Pi（接 DeepSeek / Ollama / 阿里通义）或 OpenCode

:::

## 与其他 Agent Framework 对比

::: warning Pi 是 harness，不是 framework

「Agent harness」（如 Pi / Claude Code / OpenCode / Codex）= 完整端到端 CLI 工具，直接给开发者用。

「Agent framework」（如 LangChain / LangGraph / AutoGen / CrewAI）= 库，让开发者**写自己的 agent 应用**。

两类不直接竞争。但 Pi 的 SDK 模式可以当 framework 用。

:::

### LangChain / LangGraph

- **定位**：Python / JS agent 应用框架，强调 Chain / Graph 抽象
- **复杂度**：高（学曲陡，抽象多）
- **vs Pi**：Pi 是「**能直接跑**」的 CLI；LangChain 是「**让你构建**」的库

### AutoGen（微软）

- **定位**：多 agent 协作框架（Researcher / Coder / Reviewer 等角色编排）
- **场景**：研究 / 复杂多步任务，常配 GPT-4 / Azure OpenAI
- **vs Pi**：AutoGen 重「**多 agent 编排**」；Pi 主张「**一个 agent + 文件 + bash 就够**」

### CrewAI

- **定位**：基于 LangChain 的多 agent 团队框架
- **特色**：声明式定义 agent 角色 / 任务 / 工具
- **vs Pi**：CrewAI 适合「**模拟一个公司团队**」；Pi 适合「**就是个程序员**」

### Aider

- **定位**：开源终端编码 agent，最早一批（Pi 的精神前辈之一）
- **特色**：Git-aware、强 prompt engineering
- **vs Pi**：Aider 工具简单类似 Pi，但 Pi 在扩展机制 / 多 provider 上更完整

## 商业化路线（截至 2026.5）

作者博客 2026-04-08 的「I've sold out」文章公开：

- **公司归属**：Pi 被 Earendil 公司收编，但 Mario 保留技术决策权
- **核心许可**：MIT 永远不变，**不可协商**
- **三层商业模式**：
  1. **MIT 核心**：永远开源免费（read / write / edit / bash + 核心 SDK）
  2. **Fair Source 增值**：付费但可读源码，2-3 年后转 MIT（暂未推出）
  3. **企业私有特性**：闭源 SaaS（如团队管理 / 审计 / 合规）
- **治理**：保持现有开源贡献流程，无 CLA / DCO

::: tip 为什么作者放心「卖身」

文章细节：作者强调他**对 Armin（Earendil 联合创始人）个人信任**，且**自己保留产品技术方向决定权**。RoboVM 被 Xamarin 收购最终被微软关掉的经历，让他对收购条款极挑剔。

读者注意：商业承诺有变数风险，**MIT 核心是最重要的兜底**——即使公司方向变，社区可 fork。

:::

## 调试 Pi 自身

```bash
# 详细日志
pi --debug

# 启动时 dump 配置
pi --print-config

# 干跑（不调 LLM，仅测试本地配置）
pi --dry-run

# 强制不读 extensions（debug 扩展卡死）
pi --no-extensions

# 指定 session 文件
pi --session ./my-session.jsonl
```

日志：`~/.config/pi/logs/`。

## 性能优化

<v-clicks>

- **大仓库**：用 Gemini 2.5 Pro（1M 上下文）规划，切 Sonnet 实施
- **多文件读取慢**：让 pi 一次发多个 read（一个 turn 多 tool call）
- **Bash 慢**：长跑命令必须 tmux 后台（同步 bash 会卡住 turn）
- **Compaction 频繁**：及时 `/clear` 或主动写 summary.md
- **多 provider 启动慢**：`auth.json` 不要塞过多家，按需配
- **本地 Ollama 慢**：小模型（qwen 7B）做简单任务，复杂切云

</v-clicks>

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `Authentication failed` | `pi auth login` 重做 / 检查 env var |
| 模型响应总被截断 | 接近 context 上限 → `/compact` 或切大上下文模型 |
| Extension 不加载 | `~/.config/pi/extensions/<name>/index.ts` 路径对吗 + 看 `pi --debug` 日志 |
| Skill 不被识别 | SKILL.md 的 `name` + `description` frontmatter 对吗 |
| Bash 卡死 | 长任务必须 tmux 后台；前台 bash 同步等返回 |
| `provider not found` | `auth.json` 没配那个 provider 凭据 |
| Hot reload 失效 | 改 `package.json` 需重启 pi（仅 `.ts` 自动重载） |

## 安全考量

<v-clicks>

- **YOLO 默认要自警**：陌生仓库先看 `AGENTS.md` 内容 / pi `--tools read,bash`（限工具）
- **AGENTS.md 是 prompt injection 面**：克隆陌生仓库时先看一眼
- **Extension 是代码执行点**：装 npm extension 前看源码
- **多 provider key 集中**：`~/.config/pi/auth.json` 默认 chmod 600，别 commit
- **会话 JSONL 可能含敏感数据**：长会话别上传 / 分享前过滤

</v-clicks>

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.1 | 2025-09 | 内部使用版（badlogic 个人项目） |
| 0.20 | 2025-11 | 作者发表设计博客，社区关注 |
| 0.40 | 2025-12 | 扩展系统稳定，多 provider 完善 |
| 0.50 | 2026-01 | OpenClaw 上线，pi 作 backend |
| 0.60 | 2026-02 | RPC / SDK / JSON mode 完善 |
| 0.70 | 2026-04 | 加入 Earendil 公司，scope 改 `@earendil-works/` |
| 0.74 | 2026-05 | 当前版本 |

::: warning 仍在 0.x

Pi 仍是 0.x 版本——API 可能 breaking change。生产用务必 pin 版本，社区生态也年轻。
