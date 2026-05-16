---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Pi 0.74.x（2026 年 5 月）编写。Pi 仍在快速迭代，API / 命令可能微调。

## 安装

最直接的方式是官方 shell 脚本：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

或走 npm（已加入 `@earendil-works/` scope，部分老资料仍用 `@mariozechner/` 旧名，二者皆可，新装请用前者）：

```bash
npm install -g @earendil-works/pi-coding-agent

# 验证
pi --version
# 0.74.x

pi -h
# 列子命令与 flag
```

::: tip Node 版本

Pi 是 TypeScript 项目，需要 **Node 20+**。Bun / Deno 也支持但官方推荐 Node。

:::

## 认证：配 LLM provider

Pi 不绑定任何家厂商，**必须自配至少一个 provider 凭据**。最常用三种方式：

### 1. 环境变量

```bash
# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
export OPENAI_API_KEY=sk-...

# Google
export GEMINI_API_KEY=...

# DeepSeek（大陆友好）
export DEEPSEEK_API_KEY=sk-...
```

### 2. `auth.json` 配置文件

```bash
pi auth login
# 交互式选 provider + 粘 key，存到 ~/.config/pi/auth.json
```

文件结构：

```json
{
  "anthropic": { "apiKey": "sk-ant-..." },
  "openai": { "apiKey": "sk-..." },
  "ollama": { "baseURL": "http://localhost:11434" }
}
```

### 3. OAuth（Claude Pro / Max / ChatGPT Plus）

```bash
pi auth login --provider claude-pro
# 浏览器跳 OAuth；凭据进 auth.json
```

::: warning 第三方 harness 计费

用 Claude Pro / Max 订阅在 Pi 里跑，**走「额外用量」按 token 单独计费**（Anthropic 官方政策，所有非自家 harness 都同此约束）。Claude Code 自家 harness 才走订阅额度内。

:::

## 第一次对话

进入项目目录直接跑 `pi`：

```bash
cd ~/projects/my-app
pi
```

界面进入 TUI 模式：

```
╭─────────────────────────────────────╮
│  pi  v0.74.x                        │
│  cwd: ~/projects/my-app             │
│  model: claude-sonnet-4-6           │
│  provider: anthropic                │
╰─────────────────────────────────────╯

> 帮我看看 src/index.ts 文件里的 main 函数
```

Pi 会：

1. 调 `read` 工具读 `src/index.ts`
2. 分析代码后回复
3. **所有 tool call 完整可见**——参数、返回、耗时都打印在屏幕

::: tip Pi 的 YOLO 默认

Pi 默认**不弹权限询问**——所有 read / write / edit / bash 直接执行。理由：作者认为询问中断思路且新手反正会全部 yes。

需要安全时：

- 用只读 provider key（如 Anthropic read-only 不存在；只能限制工具）
- 限工具集：`pi --tools read,bash`（仅这几个可用）
- 跑陌生仓库前先看 `AGENTS.md` 有无可疑指令（prompt injection）

:::

## 退出 / 暂停

| 操作 | 快捷键 / 命令 |
| --- | --- |
| 退出 | `Ctrl+C` 两次 / `/quit` |
| 中断当前回复 | `Esc` |
| 清空会话 | `/clear` |
| 压缩对话历史 | `/compact`（自动触发，也可手动） |
| 切模型 | `/model <id>` |
| 看会话 token | `/usage` |

## 项目说明书：`AGENTS.md`

Pi 启动时自动读项目根的 `AGENTS.md`（与 OpenCode / Codex CLI 同名约定）：

```md
# 项目说明

## 技术栈
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

::: tip 三层 AGENTS.md

Pi 分层加载：

- `~/.config/pi/AGENTS.md`（用户全局，跨项目）
- `<project>/AGENTS.md`（项目级，commit 进仓库）
- `<project>/.pi/AGENTS.md`（项目本地，不 commit）

冲突时**项目级 > 用户级**（具体 > 通用）。

:::

::: warning 兼容 `CLAUDE.md`

如果项目已有 `CLAUDE.md`（Claude Code 习惯），Pi 也会读——但优先 `AGENTS.md`。建议项目级用 `AGENTS.md`（跨工具通用）。

:::

## 第一个真实任务

试一个端到端流程：

```
> 帮我加一个 GET /api/health 端点，返回 { status: 'ok', time: ISO 时间戳 }
```

Pi 流程：

1. **bash** `ls src/` 或 `grep -r "app.get"` 找路由结构
2. **read** 已有路由文件理解风格
3. **edit / write** 添加新端点
4. **bash** 跑测试或 curl 验证

每一步参数 + 返回都打印在屏幕。

## 模型切换

Pi 支持 25+ provider，**会话中途也能切**：

```
> 这段代码请用 Opus 重新审视
（pi 提示模型即将切换；上下文保留）

/model claude-opus-4-7
```

| Provider | 模型示例 | 适合 |
| --- | --- | --- |
| `anthropic` | Opus 4.7 / Sonnet 4.6 / Haiku 4.5 | 编码（最强） |
| `openai` | GPT-5 / o-series | 推理 / 数学 |
| `google` | Gemini 2.5 Pro | 长上下文（1M） |
| `deepseek` | DeepSeek V3 / Coder | 大陆友好 + 便宜 |
| `groq` | Llama 3.x 70B | 极快流式 |
| `ollama` | 本地任何开源模型 | 完全本地 |
| `cerebras` | Llama 70B | 最快推理 |

## 下一步

熟悉基本对话后建议看：

- [指南](./guide-line) —— 扩展系统 / Skills / 模式 / 多 provider 深入
- [参考](./reference) —— 所有 CLI flag / 配置文件 / API
- 作者博客：[mariozechner.at/posts/2025-11-30-pi-coding-agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)（必读，讲设计理念）
