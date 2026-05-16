---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Claude Code 2.x 编写

## 安装

最直接的方式是 npm 全局装：

```bash
npm install -g @anthropic-ai/claude-code

# 或 pnpm
pnpm add -g @anthropic-ai/claude-code

# 或 brew（macOS）
brew install --cask claude-code
```

对 Node.js 版本有要求：**Node 18+**（Node 22 LTS 推荐）。

```bash
claude --version
# 2.x.x

claude -h
# 列出全部子命令与 flag
```

::: tip Windows 用户

Windows 上推荐用 **WSL2 + Ubuntu** 安装，原生 Windows 也能跑但 shell / 文件路径会略有摩擦。

:::

## 认证

首次启动 `claude` 会弹出认证向导，三种方式选一：

| 方式 | 适合 | 计费 |
| --- | --- | --- |
| `claude.ai` 账号（Pro / Max 订阅） | 个人 + 中度使用 | 月费定额 |
| Anthropic Console（API key） | 团队 + 重度 | 按 token |
| Vertex AI / AWS Bedrock | 企业有 GCP / AWS 账号 | 走云厂商账单 |

```bash
claude
# 首次：浏览器跳转 OAuth 授权
# 之后：~/.config/claude/credentials.json 持久化

# 切换登录账号
/login   # 在 Claude Code 内输入

# 看当前账号 / 模型
/model
```

## 第一次对话

进入项目目录后直接跑 `claude`：

```bash
cd ~/projects/my-app
claude
```

界面进入交互模式：

```
╭─────────────────────────────────╮
│  Claude Code  v2.x.x            │
│  cwd: ~/projects/my-app         │
│  model: Sonnet 4.6              │
╰─────────────────────────────────╯

> 帮我看看 src/index.ts 文件里的 main 函数
```

Claude 会：

1. 调 `Read` 工具读 `src/index.ts`
2. 分析代码后回复说明
3. 把所有 tool 调用与结果留在屏幕上，供用户审查

::: tip 权限模式

首次每个 tool 都会询问授权。两种模式：

- **default**：每个写操作（Edit / Write / Bash）都询问
- **acceptEdits**：自动接受 Edit / Write，仅 Bash 询问
- **bypassPermissions**：全部自动（仅本地受信任仓库用，不要全局开）

按 `Shift+Tab` 在模式间循环切换。

:::

## 退出 / 暂停

| 操作 | 快捷键 / 命令 |
| --- | --- |
| 退出 | `Ctrl+C` 两次 / `/quit` |
| 中断当前回复 | `Esc` |
| 暂停后台任务 | 任务自动后台跑，UI 提示「running in background」 |
| 清空会话 | `/clear` |
| 压缩对话历史 | `/compact <提示>`（生成总结后释放 token） |

## 项目级配置：`CLAUDE.md`

Claude Code 启动时会自动读项目根目录的 `CLAUDE.md`——这是给 Claude 看的「项目说明书」。

```md
# AI 开发指南

## 项目概述
本仓库是 Vue 3 + Vite + TS 的电商前台...

## 代码规范
- 注释用中文
- 组件 PascalCase
- 函数 JSDoc

## 常用命令
- `pnpm dev`：启动 dev server
- `pnpm test`：单元测试
- `pnpm lint:fix`：自动修复格式
```

每次启动 / `cd` 时 Claude Code 都会重新加载该文件。**这是教 Claude 项目约定最有效的方式**。

::: tip CLAUDE.md vs 用户全局指令

- `CLAUDE.md`（项目级）：commit 进仓库，团队共享
- `~/.claude/CLAUDE.md`（用户级）：本人偏好（如「永远用 pnpm」「报错先看 logs/」）

冲突时项目级优先（特定 > 通用）。

:::

## 常用 Slash 命令

在交互界面里输入 `/` 触发：

| 命令 | 作用 |
| --- | --- |
| `/help` | 显示所有 slash 命令 |
| `/clear` | 清空当前会话 |
| `/compact` | 总结后压缩对话 |
| `/model` | 查看/切换模型（Opus / Sonnet / Haiku） |
| `/login` | 切换账号 |
| `/init` | 在新项目生成 `CLAUDE.md` 骨架 |
| `/cost` | 显示当前会话 token 用量 + 费用 |
| `/permissions` | 管理工具权限 |
| `/hooks` | 查看 hook 配置 |
| `/mcp` | 查看 MCP server 连接状态 |
| `/<skill-name>` | 触发用户/社区 skill |

## 第一个真实任务

试一个端到端流程：

```
> 帮我加一个 GET /api/health 端点，返回 { status: 'ok', time: ISO 时间戳 }
```

Claude 会：

1. **Glob / Grep** 查找当前路由文件结构
2. **Read** 已有路由文件理解风格
3. **Edit / Write** 添加新端点
4. （视情况）**Bash** 跑测试确认通过

每一步都在屏幕显示，可随时打断纠正。

::: tip 让 Claude 自己测试

任务结束后追问：「跑一下 dev server 看 `/api/health` 是否返回正确」。Claude 会启动 dev server（background）+ curl 验证 + 报告结果。

:::

## 下一步

熟悉基本对话后建议看：

- [指南](./guide-line) —— hooks / skills / subagents / MCP 深入
- [参考](./reference) —— 所有 CLI flag / 设置项 / 配置文件
- 社区资源：[awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
