---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Codex CLI 0.130.x 编写（2026 年 5 月）

## 历史背景：与旧 Codex 区分

::: warning Codex CLI ≠ 2021 旧 Codex API

| | 2021 旧 Codex | 现 Codex CLI |
| --- | --- | --- |
| 形态 | API 模型（`code-davinci-002`） | 本地 CLI Agent |
| 模型 | 单一专用模型 | GPT-5.5 / GPT-5.4 / GPT-5.3-Codex / o-series |
| 状态 | 2023 年废弃 | 2025 年发布，**活跃维护** |
| 仓库 | - | [openai/codex](https://github.com/openai/codex) |

下文所有 Codex 都指**新版 CLI Agent**，不要混淆。

:::

## 安装

最直接的方式是 npm 全局装：

```bash
npm install -g @openai/codex

# 或 pnpm
pnpm add -g @openai/codex

# 或 macOS brew
brew install --cask codex

# 或直接下二进制
# https://github.com/openai/codex/releases
```

验证：

```bash
codex --version
# codex 0.130.0

codex --help
# 列出全部子命令与 flag
```

::: tip 平台支持
macOS（Apple Silicon / x86_64）、Linux（x86_64 / arm64）、Windows（原生 PowerShell 或 WSL2）。Rust 写成，启动速度比 Node 实现的 CLI 快几倍。
:::

## 认证

首次启动 `codex` 会引导认证。三种方式：

| 方式 | 适合 | 凭据位置 |
| --- | --- | --- |
| ChatGPT 账号（Plus / Pro / Business / Edu / Enterprise） | 个人 + 已订阅 | `~/.codex/auth.json` |
| OpenAI API key（`OPENAI_API_KEY`） | 团队 + 重度 / 不想订阅 | 环境变量 |
| 第三方 Provider（Azure / OpenRouter / Anthropic） | 已有其他渠道 | `~/.codex/config.toml` |

```bash
# 首次跑：浏览器跳 OAuth
codex login

# 或：device auth（适合远程 SSH 环境）
codex login --device-auth

# 切账号
codex login --logout && codex login

# 查看当前账号
codex --print-config
```

凭据写入 `~/.codex/auth.json`，模型 / provider 设置在 `~/.codex/config.toml`。

## 第一次对话

进入项目目录后直接跑 `codex`：

```bash
cd ~/projects/my-app
codex
```

进入交互模式：

```
╭───────────────────────────────────╮
│  Codex CLI v0.130.0               │
│  cwd: ~/projects/my-app           │
│  model: gpt-5.5                   │
│  sandbox: workspace-write         │
│  approval: on-request             │
╰───────────────────────────────────╯

> 帮我看看 src/index.ts 文件里的 main 函数
```

Codex 会：

1. 调 `file_search` / `read` 工具查找并读 `src/index.ts`
2. 分析代码后回复说明
3. 把所有 tool 调用与结果留在屏幕上

::: tip 审批模式

首次每个写操作（shell / apply_patch）都会询问授权。三种 approval 模式：

- **untrusted**：所有命令都问
- **on-request**：仅高风险命令问（默认）
- **never**：从不问（配合 sandbox 用）

按交互内 `/approvals` 或启动时 `--ask-for-approval <mode>` 切换。

:::

## 退出 / 暂停

| 操作 | 快捷键 / 命令 |
| --- | --- |
| 退出 | `Ctrl+C` 两次 / `/quit` |
| 中断当前回复 | `Esc` |
| 清空会话 | `/clear` |
| 恢复上次会话 | `codex resume --last` |
| 恢复指定会话 | `codex resume <session-id>` |
| 看历史会话 | `codex resume` |

## 项目级配置：`AGENTS.md`

Codex 启动时会自动读项目根目录的 `AGENTS.md`——这是给 Agent 看的「项目说明书」。

```md
# 项目说明（AGENTS.md）

## 项目概述
本仓库是 Vue 3 + Vite + TS 的电商前台...

## 代码规范
- 注释用中文
- 组件 PascalCase
- 函数 JSDoc

## 常用命令
- `pnpm dev`：启动 dev server（端口 10000）
- `pnpm test`：单元测试
- `pnpm lint:fix`：自动修复格式
```

发现规则：

| 路径 | 范围 | 优先级 |
| --- | --- | --- |
| `~/.codex/AGENTS.override.md` | 全局覆盖 | 最高 |
| `~/.codex/AGENTS.md` | 全局默认 | 高 |
| `<project>/AGENTS.override.md` | 项目覆盖 | 中 |
| `<project>/AGENTS.md` | 项目默认 | 中 |
| 子目录 `AGENTS.md` | 该目录及以下 | 最特定 |

合并策略：**离当前目录越近的文件越后追加，覆盖之前的指南**。

::: tip AGENTS.md vs Claude Code 的 CLAUDE.md

两者本质相同——都是项目级的 Agent 说明书。差异：

| 对比 | AGENTS.md（Codex） | CLAUDE.md（Claude Code） |
| --- | --- | --- |
| 发现位置 | 项目根 / 子目录 / 用户目录均可 | 项目根 / 用户目录 |
| 子目录覆盖 | ✓（`AGENTS.override.md`） | ✗ |
| 大小限制 | 默认 32 KiB（`project_doc_max_bytes`） | 无硬限 |
| 业界影响 | 已成多个 Agent CLI 共同约定 | Anthropic 独有 |

混用工程：两个文件都写（内容相近），让两个 Agent 都能识别。

:::

## 常用 Slash 命令

在交互界面里输入 `/` 触发：

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示所有 slash 命令 |
| `/clear` | 清空当前会话 |
| `/model` | 查看/切换模型 |
| `/login` | 切账号 |
| `/init` | 在新项目生成 `AGENTS.md` 骨架 |
| `/approvals` | 切换审批模式 |
| `/sandbox` | 切换 sandbox 模式 |
| `/mcp` | 查看 MCP server 状态 |
| `/review` | PR 风格的代码评审 |
| `/cost` | 显示当前会话 token 用量 + 费用 |
| `/compact` | 压缩对话历史 |
| `/quit` | 退出 |

## 第一个真实任务

试一个端到端流程：

```
> 帮我加一个 GET /api/health 端点，返回 { status: 'ok', time: ISO 时间戳 }
```

Codex 会：

1. **file_search / read** 查找当前路由文件结构
2. **read** 已有路由文件理解风格
3. **apply_patch** 添加新端点
4. （视情况）**shell** 跑测试确认通过

每一步都在屏幕显示，可随时打断纠正。

::: tip 让 Codex 自己测试
任务结束后追问：「跑一下 dev server 看 `/api/health` 是否返回正确」。Codex 会启动 dev server + curl 验证 + 报告结果。
:::

## 非交互模式：`codex exec`

用于脚本 / CI：

```bash
codex exec "总结 README.md 主要内容"

codex exec --sandbox workspace-write --ask-for-approval never \
  "把 src/utils/format.ts 所有 console.log 改成自家 logger"
```

适合一次性任务、自动化、与 CI 集成。

## IDE 集成

CLI 是核心，但 IDE 扩展也支持：

- **VS Code**：搜 `Codex`（OpenAI 发布的官方扩展）
- **Cursor**：内置整合
- **Windsurf**：内置整合
- **JetBrains**：第三方扩展（社区维护）

IDE 扩展共享 `~/.codex/config.toml` + `AGENTS.md`，使用体验与 CLI 一致。

## 下一步

熟悉基本对话后建议看：

- [指南](./guide-line) —— sandbox / approval / profiles / MCP 深入
- [参考](./reference) —— 所有 CLI flag / config.toml 字段 / 错误码
- 官方资源：[Codex Documentation](https://developers.openai.com/codex)
