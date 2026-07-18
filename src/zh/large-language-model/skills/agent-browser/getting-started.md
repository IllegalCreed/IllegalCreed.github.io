---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vercel-labs/agent-browser 主分支（2026-07）的 README、`skills/agent-browser/SKILL.md`、`skill-data/{core,vercel-sandbox,agentcore}/SKILL.md` 编写。

## 速查

- **定位**：Vercel Labs 出品的浏览器自动化 CLI，**面向 coding agent**；原生 Rust daemon + CDP 驱动 Chrome，无 Playwright/Puppeteer 依赖
- **装**：`npm i -g agent-browser && agent-browser install`（首次跑 `install` 从 Chrome for Testing 下载 Chrome）；也可 `brew install agent-browser` / `cargo install agent-browser`
- **主循环**：`open <url>` → `snapshot -i` → 按 `@eN` ref `click / fill / get text` → 页面变了立刻**重新 snapshot**
- **agent skill**：`npx skills add vercel-labs/agent-browser`（Claude Code / Cursor / Codex / OpenCode / Gemini / Copilot / Goose / Windsurf 通用）
- **域 skill**：`agent-browser skills get core | electron | slack | dogfood | vercel-sandbox | agentcore`
- **自然语言**：`agent-browser chat "open google and search for cats"`（Vercel AI Gateway）
- **跨 agent 标准化**：所有 agent 调同一套 CLI/命令；MCP stdio 服务 `agent-browser mcp` 直接收
- **许可**：Apache-2.0；二进制跨 macOS ARM/x64、Linux ARM/x64、Windows x64

## 定位：CDP CLI，面向 agent

agent-browser 的三层定位：

1. **驱动层**：原生 Chrome / Chromium，通过 **Chrome DevTools Protocol（CDP）** 直连，不走 Playwright/Puppeteer 的 Node 包裹。daemon 是纯 Rust，浏览器跨命令复用
2. **抽象层**：accessibility-tree 快照 + `@eN` ref——把页面变成扁平的「ref → 角色/名称/属性」表，agent 不解析 DOM，单次约 200–400 tokens
3. **agent 层**：CLI 命令 + MCP stdio + skill 系统。任何能跑 shell 命令或起 MCP 子进程的 agent 都能用

> 这三层叠加，使它不绑死某个 agent，也不强制 Chrome 才能用——Lightpanda（`--engine lightpanda`）、Safari/WebDriver（iOS）、远程 CDP（`--cdp <port|url>`）、Browserless/Browserbase/Browser Use/Kernel/AgentCore 云浏览器都接同一套命令。

## 安装

```bash
# 推荐：全局 npm
npm install -g agent-browser
agent-browser install          # 首次：从 Chrome for Testing 下载 Chrome

# 或 Homebrew（macOS）
brew install agent-browser
agent-browser install

# 或 Cargo（Rust）
cargo install agent-browser
agent-browser install

# Linux：顺带装浏览器系统依赖
agent-browser install --with-deps

# 升级（自动识别 npm/brew/cargo）
agent-browser upgrade
```

**前置条件**

- Chrome：`agent-browser install` 自动下载；已装的 Chrome / Brave / Playwright / Puppeteer Chromium 自动识别
- 从源码构建才需要 Node.js 24+、pnpm 11+、Rust

**装到 AI coding assistant**

```bash
npx skills add vercel-labs/agent-browser
```

写一个瘦发现桩到 `.claude/skills/agent-browser/SKILL.md`（或对应 agent 的 skill 目录）。真正的指令要跑 `agent-browser skills get core` 在线拉取——这样指令永远和已装 CLI 版本对齐，不会过期。

## Hello, browser：最小工作流

```bash
# 1. 打开页面
agent-browser open https://example.com

# 2. 看交互元素（按钮/输入/链接）
agent-browser snapshot -i
# @e1 [heading] "Example Domain"
# @e2 [link] "More information..."

# 3. 按 ref 操作
agent-browser click @e2
agent-browser screenshot result.png
agent-browser close
```

`open` 之后浏览器进程不退出（后台 daemon），所以连续命令感觉像同一会话——这是 agent-browser 快的关键之一。

## 多 skill 总览

| Skill | 何时用 | 一句话 |
| --- | --- | --- |
| `agent-browser`（主） | 装到 agent 的发现桩 | 指向 `skills get core`，永远匹配已装版本 |
| `core` | 默认浏览器自动化 | snapshot+ref、navigate、form、extract、screenshot、tab、auth、session |
| `electron` | 桌面 Electron 应用 | VS Code、Slack、Discord、Figma、Notion、Spotify——走 CDP |
| `slack` | Slack workspace 自动化 | 看未读、发消息、搜会话 |
| `dogfood` | 探索式测试 / QA / bug hunt | 自己产品 dogfood、回归前快速过一遍 |
| `vercel-sandbox` | 浏览器跑进 Vercel Sandbox microVM | Next.js/SvelteKit/Nuxt/Remix/Astro 应用里调浏览器 |
| `agentcore` | AWS Bedrock AgentCore 云浏览器 | SigV4 鉴权、Live View、profile 持久化 |

> 用 `agent-browser skills list` 看当前已装版本支持哪些 skill；用 `agent-browser skills get <name> --full` 拉完整内容（含 references 和 templates）。

## CDP 心智模型

为什么是 CDP 而不是 Playwright/Puppeteer？

```text
┌───────────────┐   CLI 命令（open/snapshot/click/…）
│  Rust CLI     │ ──────────────────┐
└───────────────┘                   │
                                    ▼
┌───────────────┐   JSON-RPC    ┌────────────────┐
│  Rust daemon  │ ◀──────────▶  │  Chrome (CDP)  │
└───────────────┘                └────────────────┘
       ▲                                  │
       │ 跨命令复用                        │ accessibility tree / DOM / 网络
       └──────────────────────────────────┘
```

- **daemon 持久**：第一次命令起 daemon，后续命令复用，浏览器不关 = 同一会话
- **CDP 直连**：不经过 Node runtime，daemon 是纯 Rust，启动/响应都快
- **accessibility-tree 优先**：snapshot 输出页面无障碍树 + `@eN` ref，是给 LLM 的接口
- **MCP 双通道**：既能 CLI 调，也能 `agent-browser mcp` 起 stdio MCP 服务——MCP 客户端把它当带类型字段的工具集（`url` / `selector` / `text` / `key` / `allowedDomains` / `extraArgs`）

## 下一步

- [指南](./guide-line) —— skills 体系深入、snapshot+ref 工作流细节、自然语言 chat、CDP 优势、反模式
- [参考](./reference) —— skill 清单、安装矩阵、命令分类、许可、链接
