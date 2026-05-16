---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenCode 2026 版编写（sst/opencode 主分支）

## 安装

OpenCode 提供多种安装方式，选一种即可。

### npm 全局装（推荐）

```bash
npm install -g opencode-ai

# 或 pnpm
pnpm add -g opencode-ai

# 验证
opencode --version
```

### curl 一键脚本

```bash
curl -fsSL https://opencode.ai/install | bash
```

脚本自动检测平台 / 架构，下载预编译二进制到 `~/.opencode/bin/`。

### macOS Homebrew

```bash
brew install sst/tap/opencode
```

### Linux 包管理器

```bash
# Arch Linux
yay -S opencode-bin
# 或
paru -S opencode-bin

# Windows Scoop
scoop install opencode

# Mise（跨平台版本管理器）
mise install opencode
```

::: tip Windows 用户
推荐用 **WSL2 + Ubuntu** 装，原生 Windows 也支持但部分终端动效略有差异。Windows 原生用 Scoop / Chocolatey 也可。
:::

## 启动与认证

第一次跑 `opencode` 进入 TUI，需先配 provider：

```bash
opencode

# 进入交互后输入 /connect 添加 provider
/connect
```

`/connect` 会列出 75+ provider 选项——选一个后引导填 API key。常用：

| Provider | 说明 |
| --- | --- |
| **Anthropic** | Claude 全模型矩阵 |
| **OpenAI** | GPT-5 / GPT-4 / o-series |
| **Google** | Gemini |
| **OpenRouter** | 一个 key 接 100+ 模型 |
| **Ollama** | 本地模型 |
| **LM Studio** | 本地 GGUF 模型 |
| **DeepSeek** | 国内可用 + 性价比高 |
| **Groq / Together AI** | 快速推理 |
| **OpenCode Zen** | sst 官方策展模型（含订阅） |

凭据持久化到 `~/.local/share/opencode/auth.json`（不要 commit）。

::: tip 大陆访问
- **DeepSeek** / **OpenAI 兼容 API**（如智谱清言、月之暗面、阶跃星辰）→ 直连
- **Ollama** / **LM Studio** → 本地推理，完全离线
- 也可 `/connect` 选 **Other** 接任何 OpenAI 兼容的 API（填 baseURL + key）
:::

## 选模型

```bash
# TUI 内
/models
```

列出所有已连接 provider 下的可用模型，选一个即生效。模型格式 `provider/model`，例如：

- `anthropic/claude-opus-4-7`
- `openai/gpt-5.5`
- `google/gemini-2.5-pro`
- `ollama/llama-3.3-70b`
- `deepseek/deepseek-v3`

```bash
# CLI flag 启动时指定
opencode --model anthropic/claude-sonnet-4-6
```

## 第一次对话

进入项目目录跑 `opencode` 进 TUI：

```bash
cd ~/projects/my-app
opencode
```

TUI 大致样子：

```
┌─ opencode ──────────────────────────────────┐
│  cwd: ~/projects/my-app                     │
│  agent: build  |  model: claude-sonnet-4-6  │
├─────────────────────────────────────────────┤
│                                             │
│  > 帮我看看 src/index.ts 里的 main 函数     │
│                                             │
└─────────────────────────────────────────────┘
```

OpenCode 会：

1. 调 `read` 工具读 `src/index.ts`
2. 分析后回复
3. 所有 tool 调用 / 结果都展示在屏幕上

::: tip Plan vs Build
- **Build**（默认）：全权限，可改文件、跑命令
- **Plan**：只读，分析方案不动文件

按 `Tab` 在两档主代理间切换。
:::

## 退出 / 暂停

| 操作 | 快捷键 / 命令 |
| --- | --- |
| 退出 | `Ctrl+C` 两次 / `:q` |
| 中断当前回复 | `Esc` |
| 清空当前会话 | `/clear` |
| 撤销最近改动 | `/undo` |
| 重做撤销 | `/redo` |
| 分享会话 | `/share`（生成可读链接） |

## 项目说明书：`AGENTS.md`

OpenCode 启动时自动读项目根目录的 `AGENTS.md`——格式与 Codex CLI 一致，且兼容 Claude Code 的 `CLAUDE.md`（作为 legacy fallback）。

```md
# 项目约定

## 技术栈

Vue 3 + Vite + TS 的电商前台...

## 代码规范

- 注释用中文（函数加 JSDoc）
- 组件 PascalCase，函数 camelCase
- 偏好 SCSS + UnoCSS @apply

## 常用命令

- `pnpm dev`：启动 dev server（端口 10000）
- `pnpm test`：单元测试
- `pnpm lint:fix`：自动修复格式
```

```bash
# 在新项目生成 AGENTS.md 骨架
/init
```

`/init` 扫描 README / package.json / 路由 / 测试目录，自动起草 AGENTS.md。

::: tip 兼容文件
查找顺序：`AGENTS.md` → `CLAUDE.md`（项目根）+ `~/.config/opencode/AGENTS.md`（用户级）。已有 Claude Code 项目可以零成本切过来。
:::

## 常用 Slash 命令

TUI 输入 `/` 触发：

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示所有命令 |
| `/connect` | 添加 provider |
| `/models` | 选模型 |
| `/init` | 生成 AGENTS.md |
| `/clear` | 清空会话 |
| `/undo` | 撤销最近改动 |
| `/redo` | 重做 |
| `/share` | 分享会话链接 |
| `/theme` | 切主题（tokyonight / catppuccin / gruvbox...） |
| `/agents` | 列出可用 agent |
| `@<file>` | 引用文件加进上下文 |

## 第一个真实任务

试一个端到端流程：

```
> 帮我加一个 GET /api/health 端点，返回 { status: 'ok', time: ISO 时间戳 }
```

OpenCode 会：

1. **glob** / **grep** 查找当前路由文件结构
2. **read** 已有路由文件理解风格
3. **edit** / **write** 添加新端点
4. （视情况）**bash** 跑测试确认通过

每一步都在屏幕显示，可随时打断。

::: tip 让 OpenCode 自己测试
任务结束后追问：「跑一下 dev server 看 `/api/health` 是否返回正确」。OpenCode 会启 dev server（后台）+ curl 验证 + 报告结果。
:::

## CLI 模式（非 TUI）

OpenCode 也能纯命令行非交互式跑（脚本场景）：

```bash
# 单次问答
opencode run "解释一下闭包"

# 指定模型 + 输出 JSON
opencode run --model openai/gpt-5.5 --format json "总结 README.md"

# 继续上次会话
opencode run --continue "再补一段例子"

# 列出所有 session
opencode session list

# 列出可用模型
opencode models
```

::: tip 服务化
`opencode serve` 启 HTTP API server，方便外部脚本 / CI 调用。`opencode web` 启浏览器 UI，`opencode attach` 接已存在的远程实例。
:::

## 下一步

熟悉基本对话后建议看：

- [指南](./guide-line) —— 多 provider 配置 / 自定义 agent / MCP / 命令深入
- [参考](./reference) —— 所有 CLI flag / 配置字段 / 权限规则 / 环境变量
- 社区资源：[Models.dev](https://models.dev/) / [OpenCode 仓库](https://github.com/sst/opencode)
