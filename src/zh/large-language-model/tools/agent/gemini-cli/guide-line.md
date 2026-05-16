---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Gemini CLI 0.42+（2026 年 5 月版本）编写。

## 速查

- 模型切换：`/model` 选 Gemini 3 Pro / Flash / 2.5 Pro / Flash-Lite
- 长任务后台：`run_shell_command` 长跑命令自动后台化，`/shells` 查看
- 自定义命令：`.toml` 文件 + `/commands reload`
- 自定义 hook：`~/.gemini/settings.json` 的 `hooks` 字段（11 个生命周期事件）
- MCP 配置：`~/.gemini/settings.json` 的 `mcpServers` 字段
- 项目级 memory：`./GEMINI.md` / 用户级：`~/.gemini/GEMINI.md`
- Extensions：`gemini extensions install <github-url>` 一键装
- Checkpointing：默认关，settings 里 `general.checkpointing.enabled=true` 开启；回滚 `/restore`
- 永久退出会话：`Ctrl+C` 两次 / `/quit`

## 模型选择

Gemini CLI 支持 Google 全模型矩阵，`/model` 切换或启动 `--model` 指定：

| 模型 ID | 上下文 | 适合 |
| --- | --- | --- |
| `gemini-3-pro-preview` | 1M | 旗舰，复杂规划 / 大重构 / 难 debug |
| `gemini-3-flash-preview` | 1M | 日常实施，速度优先 |
| `gemini-2.5-pro` | 1M | 稳定版 Pro，免费用户首选 |
| `gemini-2.5-flash` | 1M | 稳定版 Flash，速度 + 价格平衡 |
| `gemini-2.5-flash-lite` | 1M | 轻量任务，最快最便宜 |
| `gemma-3` | - | 实验性本地模型（experimental.gemma） |

**何时切**：

- 复杂方案设计 → Pro（推理强）
- 写实现 / 改 bug → Flash（速度快 + 上下文足够）
- 简单 grep / list / 一行答 → Flash-Lite
- **默认推荐让 CLI 自动路由**（model: auto），让系统按任务自选

```bash
# 启动时指定
gemini --model gemini-3-pro-preview
gemini -m gemini-2.5-flash

# 交互里切
/model
```

::: tip 自动模型路由（Plan Mode 专属）

`plan.modelRouting=true`（默认开）时，规划阶段走 Pro，approve 后切 Flash 实施。可手动关：

```json
{
  "general": {
    "plan": {
      "modelRouting": false
    }
  }
}
```

:::

## 权限审批模式

四种模式，`Shift+Tab` 循环切换：

| 模式 | 行为 |
| --- | --- |
| `default` | 每次写操作（write_file / replace / run_shell_command）都询问 |
| `auto_edit` | 自动接受文件编辑；shell 仍询问 |
| `yolo` | 全部自动（**仅本地受信任仓库** + 沙箱用） |
| `plan` | 仅读不写，规划阶段用 |

```bash
# 启动时指定
gemini --approval-mode=auto_edit
gemini --approval-mode=yolo          # 等价 --yolo（已弃用）
gemini --approval-mode=plan
```

```json
// ~/.gemini/settings.json
{
  "general": {
    "defaultApprovalMode": "auto_edit"
  },
  "tools": {
    "allowed": ["run_shell_command(git)"],
    "confirmationRequired": ["write_file"]
  }
}
```

`tools.allowed` 列出**绕过审批的工具**；`tools.confirmationRequired` 强制要审批（覆盖 allowed）。

::: warning yolo 慎用

YOLO 模式让 Gemini 自动跑任意 shell 命令。建议：

- 仅本地 sandbox 项目用
- 用 `auto_edit` 而非 yolo（仍卡住 shell 询问）
- 全局加 `security.disableYoloMode=true` 完全禁用 YOLO

:::

## Plan Mode：规划阶段

```bash
gemini --approval-mode=plan
# 或交互里
/plan 设计 Phase 2 用户系统
```

**plan 模式行为**：

- **只读工具**：`read_file` / `list_directory` / `glob` / `grep_search` / `google_web_search` / `web_fetch`
- **唯一写权**：只能往 `~/.gemini/tmp/<project>/<session>/plans/` 写 `.md` 计划
- **产物**：详细实施计划（含分步、风险、回滚）
- **模型路由**：规划时自动用 Pro，approve 后切 Flash 实施

```
（plan mode）
> 帮我设计一个用户认证模块（OAuth + JWT）

Gemini：
1. read_file package.json / README 理解项目
2. grep_search 找现有 auth 相关代码
3. ask_user 确认需要支持的 OAuth provider
4. write_file plans/auth-design.md 产出计划

approve plan 后：
Shift+Tab 切到 default → Gemini 按 plan 实施
```

::: tip 协作编辑 plan

plan 产出后 `Ctrl+X` 用外部编辑器（VS Code / vim）打开，加注释 / 改步骤后，Gemini 自动检测变化继续推进。

:::

## Slash 命令深入

### 自定义 slash 命令（.toml）

放 `~/.gemini/commands/<name>.toml`：

```toml
# ~/.gemini/commands/lint.toml
description = "对当前 staged 文件跑 lint 检查"
prompt = """
对当前 staged 文件跑 lint 检查，输出问题列表。
不要自动修复，仅报告。
"""
```

CLI 里 `/lint` 触发。`/commands reload` 重新扫描。

::: tip 项目级命令

`./.gemini/commands/<name>.toml` commit 进仓库，团队共享。常用于「跑测试」「打包发布」流程封装。

:::

### 内置常用命令

| 命令 | 作用 |
| --- | --- |
| `/about` | 看版本 |
| `/bug` | 反馈 bug |
| `/copy` | 复制最后输出 |
| `/directory` | 加/看 workspace 目录 |
| `/docs` | 浏览器打开官方文档 |
| `/editor` | 选编辑器 |
| `/hooks` | 看 / 配 hook |
| `/ide` | 配 IDE 集成 |
| `/permissions` | 看 folder trust |
| `/policies` | 看活跃 policy |
| `/privacy` | 看 / 改隐私选项 |
| `/settings` | 打开 settings 编辑器 |
| `/setup-github` | 配 GitHub Action |
| `/upgrade` | 升级 tier |
| `/vim` | 切 vim 编辑模式 |

## Agent Skills：可复用专长

Skill 是 Gemini CLI 的「**按需加载**」机制——名字 + 描述常驻 system prompt，**激活时**才把完整内容塞进上下文。

```
~/.gemini/skills/cypress-skill/
├── SKILL.md                 # 主指令（必需）
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

四级 skill 优先级（低到高）：

1. **内置 skill**：CLI 自带
2. **Extension skill**：装的 extension 携带
3. **用户 skill**：`~/.gemini/skills/`（或 `~/.agents/skills/`）
4. **Workspace skill**：`.gemini/skills/`（或 `.agents/skills/`，commit 进仓库）

**激活流程**：

1. Gemini 读到用户问题，匹配 description
2. 调 `activate_skill(skill_name)` 工具
3. **用户确认**（一次性 / 永久允许）
4. SKILL.md 完整内容注入上下文
5. Gemini 按 skill 指令执行

::: tip Progressive Disclosure

Gemini 的设计哲学：metadata（name + description）只塞 system prompt 几十 token，激活时才把完整 SKILL.md（可能上千 token）注入——**对比 Claude Code 默认全注入**，Gemini 更省 token。

:::

## Hooks：tool 前后注入逻辑

Hooks 是生命周期事件触发的自定义 shell 命令——审计 / 通知 / lint 都靠它。Gemini CLI 提供 **11 个事件**：

| 事件 | 触发时机 | 用途 |
| --- | --- | --- |
| `SessionStart` | 会话开始 | 注入上下文 |
| `SessionEnd` | 会话结束 | 清理 |
| `BeforeAgent` | Agent loop 开始 | 加上下文 / 拦截 |
| `AfterAgent` | Agent loop 结束 | 复盘输出 |
| `BeforeModel` | LLM 调用前 | 改 prompt / 换模型 |
| `AfterModel` | LLM 返回后 | 过滤 / 脱敏 |
| `BeforeToolSelection` | 工具选择前 | 筛工具 |
| `BeforeTool` | tool 执行前 | 验证 / 安全门 |
| `AfterTool` | tool 执行后 | 后处理 |
| `PreCompress` | 上下文压缩前 | 状态保存 |
| `Notification` | 警告 / 通知 | 转发外部系统 |

```json
// ~/.gemini/settings.json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "audit-writes",
            "type": "command",
            "command": "echo \"$GEMINI_SESSION_ID $TOOL_NAME\" >> ~/audit.log",
            "timeout": 5000
          }
        ]
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "auto-prettier",
            "type": "command",
            "command": "cd $GEMINI_PROJECT_DIR && pnpm exec prettier --write \"$TOOL_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

环境变量：

| 变量 | 含义 |
| --- | --- |
| `GEMINI_PROJECT_DIR` | 项目根 |
| `GEMINI_PLANS_DIR` | plans 目录 |
| `GEMINI_SESSION_ID` | 会话 ID |
| `GEMINI_CWD` | 当前工作目录 |

**Hook 行为约定**：

- 必须**通过 stdout 输出 JSON**（其它内容会破坏解析）
- 用 **stderr** 打 debug 日志
- **Exit 0**：成功；若想拒绝，stdout 写 `{"decision": "deny"}`
- **Exit 2**：直接阻塞，stderr 内容作为拒绝原因
- 其它退出码：警告但放行

::: warning Hook 是 shell 代码执行点

「Hooks execute arbitrary code with your user privileges」——project 级 hook 改动会触发 fingerprint 警告，防 git 拉下来的恶意 hook 自动跑。

:::

## MCP（Model Context Protocol）

MCP 是 Anthropic 推动的「**让 LLM 接外部工具**」开放协议，Gemini CLI 一类支持。

### 配置一个 MCP server

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "remote-server": {
      "httpUrl": "https://my-mcp.example.com",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      },
      "timeout": 5000,
      "trust": false
    }
  }
}
```

启动后 `/mcp` 看连接状态：

```
github            ✓ connected   (15 tools)
context7          ✓ connected   (2 tools)
remote-server     ✗ failed      (timeout)
```

### 常用 MCP server

| Server | 提供工具 |
| --- | --- |
| `@modelcontextprotocol/server-github` | Issue / PR / Repo 操作 |
| `@upstash/context7-mcp` | resolve-library-id / query-docs（最新库文档） |
| `@modelcontextprotocol/server-filesystem` | 受限文件读写 |
| `@modelcontextprotocol/server-postgres` | Postgres 查询 |
| `chrome-devtools-mcp` | 浏览器操作 / 截图 |

### MCP 字段说明

| 字段 | 说明 |
| --- | --- |
| `command` + `args` | stdio MCP（spawn 子进程） |
| `url` | SSE MCP server |
| `httpUrl` | HTTP MCP server |
| `headers` | 远程 server 鉴权头 |
| `env` | 注入环境变量 |
| `cwd` | 子进程工作目录 |
| `timeout` | 启动超时（ms） |
| `trust` | 跳过该 server 工具的审批 |
| `includeTools` / `excludeTools` | 工具白 / 黑名单 |

::: tip 装 MCP server 前看源码

MCP server 在你机器上**有 shell 执行权**——装陌生 server 前看代码 / 用知名包，避免 supply-chain 攻击。

:::

## Extensions：一键装扩展

```bash
# 装一个 extension
gemini extensions install https://github.com/gemini-cli-extensions/workspace

# 列出已装
gemini extensions list
/extensions list

# 启用 / 禁用
/extensions enable workspace
/extensions disable workspace

# 更新
gemini extensions update <name>
```

Extension 可包含：

- 自定义命令（`.toml`）
- MCP server 配置
- Prompts
- Themes
- Hooks
- Subagents
- Agent Skills

::: tip 官方画廊

[geminicli.com/extensions/browse](https://geminicli.com/extensions/browse/) 浏览社区 extension。常见：

- `workspace`（多目录 workspace 管理）
- `cloud-run`（GCP Cloud Run 部署）
- `bigquery`（BigQuery 查询）
- `firebase`（Firebase 集成）

:::

## Subagents：并行任务

Gemini CLI 内置 `codebase_investigator` 等 subagent，可独立上下文跑子任务：

```
> 帮我并行做三件事：
>   1. 用 codebase_investigator 总结组件目录结构
>   2. grep 所有 TODO 注释
>   3. 用 web_fetch 拿 Vue 3.5 changelog
```

`agents.overrides` 在 settings.json 配每个 subagent 的模型 / 工具：

```json
{
  "agents": {
    "overrides": {
      "codebase_investigator": {
        "model": "gemini-3-pro-preview"
      }
    }
  }
}
```

::: tip Browser Agent

`agents.browser.*` 配项可让 Gemini 跑无头浏览器自动化（profile / domain whitelist / 敏感动作审批），适合 e2e 自动操作。

:::

## Checkpointing 与回滚

默认关，settings 开启：

```json
{
  "general": {
    "checkpointing": {
      "enabled": true
    }
  }
}
```

启用后每次 `write_file` / `replace` 前自动：

1. **Shadow Git 提交**：`~/.gemini/history/<project_hash>` 仓库提交一份当前状态
2. **会话快照**：`~/.gemini/tmp/<project_hash>/checkpoints/<timestamp>.json` 存对话历史 + tool 调用

```bash
# 列出所有 checkpoint
/restore

# 回滚到指定
/restore 2026-05-15T10-00-00_000Z-src-index.ts-write_file
```

::: tip 回滚 = 文件 + 对话都恢复

`/restore` 不仅还原文件，对话也回到那时的状态——Gemini「忘记」之后做过什么，重新看到原 tool prompt。

:::

## 沙箱（Sandbox）

高风险任务用沙箱隔离：

```bash
# 启动时开沙箱
gemini --sandbox        # 自动选 Docker / Podman / Seatbelt
gemini -s

# 或环境变量
export GEMINI_SANDBOX=docker
gemini
```

```json
{
  "tools": {
    "sandbox": "docker",
    "sandboxAllowedPaths": ["/workspace"],
    "sandboxNetworkAccess": false
  }
}
```

### 自定义 sandbox 镜像

```dockerfile
# .gemini/sandbox.Dockerfile
FROM gemini-cli-sandbox
USER root
RUN apt-get update && apt-get install -y python3
USER node
COPY ./my-config /app/my-config
```

```bash
BUILD_SANDBOX=1 gemini -s
```

::: tip macOS Seatbelt

macOS 原生支持 Seatbelt 沙箱（无需 Docker）：

```bash
export SEATBELT_PROFILE=strict-proxied
gemini --sandbox
```

profile 可选：`permissive-open` / `restrictive-open` / `strict-open` / `strict-proxied`。

:::

## Headless 模式（脚本 / CI）

```bash
# 单次 prompt 后退出
gemini -p "总结 README.md 主要内容"
gemini --prompt "lint check"

# 结构化输出（JSON 单对象）
gemini -p "查 package.json 的依赖" --output-format json

# 流式 JSON（每行一个事件）
gemini -p "改重构 src/" --output-format stream-json
```

JSON 事件类型：`init` / `message` / `tool_use` / `tool_result` / `error` / `result`。

退出码：

| 码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `1` | 一般错误 / API 失败 |
| `42` | 输入校验错 |
| `53` | 超过 turn 限制 |

```bash
# 在 CI 用
gemini -p "lint 检查并写报告到 lint-report.md" \
  --approval-mode=yolo \
  --output-format json
```

::: tip 交互模式 + 初始 prompt

`-i / --prompt-interactive "..."` 把初始 prompt 投进去后进入交互——适合「先给个起点再继续讨论」。

:::

## IDE 集成

VS Code / IntelliJ 等装 Gemini CLI 配套扩展后：

- 选中代码后右键 → Refactor / Explain / Fix
- 文件树整合：点文件加进上下文
- diff 视图：提议修改可逐 hunk 接受

```bash
/ide
```

启动 IDE 集成（自动检测 VS Code / IntelliJ）。

```json
{
  "ide": {
    "enabled": true
  }
}
```

::: tip Code Assist 集成

Google Cloud Code Assist 与 Gemini CLI 共享认证 / 模型，可在 VS Code 内调 Code Assist 同时在终端开 Gemini CLI 跑长任务。

:::

## GitHub Actions 集成

```bash
/setup-github
```

让 Gemini 自动给当前仓库装好 `.github/workflows/gemini-cli.yml`，开 PR 评审 / Issue 分诊 / `@gemini` 触发命令等能力。

底层用 [google-github-actions/run-gemini-cli](https://github.com/google-github-actions/run-gemini-cli)：

```yaml
- uses: google-github-actions/run-gemini-cli@v0
  with:
    prompt: 帮我评审这次 PR 改动
    approval-mode: yolo
```

## 与 Claude Code / Codex / OpenCode 对比（**重点**）

| 维度 | Gemini CLI | Claude Code | Codex | OpenCode |
| --- | --- | --- | --- | --- |
| 模型 | Gemini 3 / 2.5 全系 | Anthropic Opus / Sonnet / Haiku | OpenAI GPT / o-series | 任意（OpenRouter / 本地） |
| 上下文窗口 | **1M（默认）** | 200K / 1M（需选 `[1m]`） | 200K | 取决于模型 |
| 开源协议 | **Apache 2.0** ✓ | ✗ 闭源 | ✗ 闭源 | ✓ |
| 免费额度 | **60 RPM + 1000 RPD**（OAuth） | 无（按订阅） | 无 | 看模型 |
| 联网搜索 | **Google Search 内建** ✓ | WebFetch 工具 | WebSearch | 看 provider |
| MCP | ✓ 一类 | ✓ 一类 | ✓ | ✓ |
| Hooks | ✓ 11 事件 | ✓ | ✗（受限） | ✓ |
| Skills | ✓ `activate_skill` 按需加载 | ✓ 描述自动匹配 | ✗ | ✗ |
| Plan Mode | ✓ + 自动模型路由 | ✓ | ✗ | ✗ |
| Checkpointing | ✓ Shadow Git 自动快照 | ✗ | ✗ | ✗ |
| 沙箱 | ✓ Docker / Podman / Seatbelt | ✗（依赖 OS） | ✗ | ✗ |
| Extensions | ✓ `gemini extensions install` | ✗（用 skill / hook 替代） | ✗ | ✗ |
| 中国可用 | 需自备网络 | 需自备网络 | 需自备网络 | 看模型 |

**怎么选**：

- **追求开源 + 免费额度** → Gemini CLI（业内最慷慨）
- **追求 Skills 生态成熟度** → Claude Code（社区 skill 多）
- **重度 OpenAI 生态** → Codex
- **想跑本地模型** → OpenCode（搭 Ollama / vLLM）

详见 [Claude Code](../claude-code/) / [Codex](../codex/) / [OpenCode](../opencode/) 各自笔记。

## 大陆访问

Google API 国内不可达，需要：

1. **网络代理**：HTTPS_PROXY / HTTP_PROXY 环境变量
2. **Base URL 代理**：

```bash
export GOOGLE_GEMINI_BASE_URL="https://my-gemini-proxy.example.com"
# 或 Vertex 端
export GOOGLE_VERTEX_BASE_URL="https://my-vertex-proxy.example.com"
```

::: warning 仅 HTTPS

Base URL 只接受 `https://`（localhost 例外）—— 自建代理需带 TLS 证书。

:::

## 常见用法模式

### 1. 接手陌生项目

```
> 我刚 clone 这个仓库。先帮我快速理解：
>   1. 项目用什么技术栈？
>   2. 主要功能有哪些
>   3. 怎么本地起？
```

Gemini 会调 `read_file` 看 `package.json` / `README.md`，`list_directory` 看目录结构，最后总结。

### 2. 紧急 hotfix

```
> 线上报错 "Cannot read property 'name' of undefined" 在 /api/users/[id] 路由。
> 帮我查根因 + 修复 + 加测试
```

Gemini 会 `grep_search` 找路由 → `read_file` 看代码 → `replace` 修复 → 加 test → `run_shell_command` 跑测试。

### 3. 重构 + 1M 上下文

```
> 把整个 src/utils/ 目录的代码风格统一改成 functional style（避免 class）。
> 现有公开 API 保持兼容
```

Gemini 用 1M 上下文一次性读完整个 utils 目录（30+ 文件），统一改完。比传统 200K 模型分批改可靠得多。

### 4. 文档撰写 + 联网

```
> 给 packages/ui 包写一份 README：
>   1. 安装步骤
>   2. 用 google_web_search 拿 Vue 3.5 的最新组件最佳实践
>   3. 三个常用组件示例
```

Gemini 会调 `google_web_search` 拿最新信息（带 citation），结合本地代码产出 README。

### 5. 调试

```
> 我跑 pnpm test:e2e 失败，错误是 "Cannot find module './fixtures'"
> 帮我查根因
```

Gemini 会 `run_shell_command` 复现 → `read_file` 看配置 → `grep_search` 查 alias → 定位 + 修复。

## 与 Git 工作流整合

```
> 看看当前 staged 改动，写个合适的 conventional commit message
（Gemini 调 git diff + 分析 + 提议消息）

> commit 并 push
（Gemini 调 git commit + push）
```

::: tip Git Worktree 集成

`-w <name>` 启动时自动创建 worktree（实验性特性 `experimental.worktrees=true`）：

```bash
gemini -w feat-auth
# 自动 git worktree add ../my-project-feat-auth feat-auth
```

:::

## 调试 Gemini CLI 自身

```bash
# 详细日志
gemini --debug
gemini -d

# 启动后按 F12 打开内置 console
# 看日志路径
ls ~/.gemini/logs/

# 跳过 trust 检查（仅当前 session）
gemini --skip-trust

# 列出所有 extension
gemini -l
gemini --list-extensions
```

环境变量：

```bash
# 看 telemetry 数据
export GEMINI_TELEMETRY_ENABLED=true
export GEMINI_TELEMETRY_TARGET=local
export GEMINI_TELEMETRY_OUTFILE=/tmp/gemini-telemetry.json

# 关闭 trust 检查（CI 用）
export GEMINI_CLI_TRUST_WORKSPACE=true
```

## 性能优化

<v-clicks>

- **大仓库**：1M 上下文默认开，无需切换
- **MCP 启动慢**：`tools.useRipgrep=true`（替代 grep）+ 暂时禁不用的 MCP server
- **token 缓存**：长会话自动开启 prompt cache，命中后费用骤降
- **避免 Skill 全注入**：让 Gemini 按需 `activate_skill`，省 token
- **频繁 read 反复改**：让 Gemini 先用 `read_many_files`（@ 注入）一次性读完所有文件
- **Plan Mode + 模型路由**：规划 Pro 实施 Flash，省 ~70% Pro 费

</v-clicks>

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `Authentication failed` | `/auth` 重新登录 |
| 模型回复总被截断 | 上下文窗口满了 → `/compress` |
| Hook 不触发 | `/hooks` 看配置 / matcher 模式对吗 |
| MCP server 红色未连接 | 终端跑 server 命令看错 / npx 缓存 |
| Skill 不被识别 | `~/.gemini/skills/<name>/SKILL.md` 存在 + 重启 |
| 中国大陆连不上 | 设代理 / `GOOGLE_GEMINI_BASE_URL` |
| 高 token 用量 | `/stats` 看分布 + 切 Flash |
| YOLO 模式被禁 | `security.disableYoloMode=true` 已开 |

## 安全考量

<v-clicks>

- **YOLO 不要全局开**：陌生 / 公开仓库回到 default
- **GEMINI.md 是 prompt injection 面**：克隆陌生仓库先看 GEMINI.md 内容
- **MCP server 是代码执行点**：装 server 前看源码 / 用知名包
- **hook 命令是 shell 注入面**：环境变量在 hook 里要 quote
- **token 不要 commit**：`.gitignore` 加 `.env*`，`environmentVariableRedaction` 默认遮蔽
- **Folder Trust**：首次进入新目录需用户确认信任（防 git 拉下来的恶意 GEMINI.md）

</v-clicks>

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| 0.1 | 2025 中 | 首个 preview 版 |
| 0.10 | 2025 末 | MCP 一类支持 / Plan Mode |
| 0.20 | 2026 初 | Skills 系统 / Checkpointing |
| 0.30 | 2026 初 | Hooks 11 事件 / Extensions |
| 0.42 | 2026 5 月 | 当前稳定版（Gemini 3 默认） |

::: tip 频繁迭代

Gemini CLI 周更频繁，subagents / model routing / extension registry 等特性还在迭代。Star 仓库追 [Releases](https://github.com/google-gemini/gemini-cli/releases)。

:::
