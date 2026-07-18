---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vercel-labs/agent-browser 的 README 与 `skills/`、`skill-data/{core,vercel-sandbox,agentcore}/SKILL.md` 编写。

## 速查

- **核心循环**：`open` → `snapshot -i` → 按 `@eN` ref 操作 → 页面变了**立刻**重新 snapshot
- **refs 易过期**：`@eN` 只在最近一次 snapshot 内有效；点击导航、表单提交、SPA 重渲染后必须重新 snapshot
- **三种定位**：① `@eN` ref（首选，最快最稳）② `find role/text/label/placeholder/testid`（语义，不需先 snapshot）③ CSS / XPath / `text=` / `xpath=`（兜底）
- **等待策略**：`wait @ref` / `wait --text "..."` / `wait --url "**/x"` / `wait --load networkidle`，**少用** `wait 2000` 这种盲等
- **自然语言**：`agent-browser chat "<指令>"` 走 AI Gateway 翻译成命令链；CLI / dashboard 都能用
- **域 skill**：桌面应用 → `electron`；Slack → `slack`；QA/bug hunt → `dogfood`；Vercel 云 → `vercel-sandbox`；AWS → `agentcore`
- **CDP 优势**：daemon 复用、accessibility-tree snapshot、不依赖 Node/Playwright、跨 agent 同一命令面
- **反模式**：① 缓存 snapshot 后跨页面操作 ② shell history 留密码 ③ 给页面 JS 当指令执行
- 许可 Apache-2.0；Vercel Labs 官方

## Skills 体系：一个主 + 多个域

`vercel-labs/agent-browser` 的 skill 是**分领域**的——主 skill 是发现桩，域 skill 处理具体场景：

```bash
agent-browser skills                # 列出已装版本的所有 skill
agent-browser skills get core       # 默认浏览器自动化（先读这个）
agent-browser skills get core --full  # 含完整 references + templates
agent-browser skills get electron      # Electron 桌面应用
agent-browser skills get slack         # Slack workspace
agent-browser skills get dogfood       # 探索式测试 / QA
agent-browser skills get vercel-sandbox  # Vercel Sandbox microVM
agent-browser skills get agentcore       # AWS Bedrock AgentCore
```

**为什么 skill 是「在线拉取」而非静态文件？**

主 skill `agent-browser/SKILL.md` 是 7 行瘦桩——它不存工作流，只指向 `agent-browser skills get core`。这样 CLI 升级时 skill 内容自动跟上，永远不会出现「README 说有这命令、装的旧版本没有」的漂移。代价：离线时得自己缓存 `skills get --all > skills.txt`。

## snapshot + ref：agent 的工作流

agent-browser 把「让 LLM 看懂页面」拆成两步：

### 1. snapshot：把页面拍扁成 ref 表

```bash
agent-browser snapshot -i      # 只看交互元素（按钮/输入/链接）——首选
agent-browser snapshot -i -u   # 链接带 href
agent-browser snapshot -i -c   # 压缩空结构节点
agent-browser snapshot -i -d 3 # 限深 3 层
agent-browser snapshot -s "#main"   # 圈定 CSS 范围
agent-browser snapshot -i --json    # 机器可读（agent 推荐）
```

输出长这样（节选）：

```text
Page: Example - Log in
URL: https://example.com/login

@e1 [heading] "Log in"
@e2 [form]
  @e3 [input type=email] placeholder="Email"
  @e4 [input type=password] placeholder="Password"
  @e5 [button type=submit] "Continue"
@e6 [link] "Forgot password?"
```

### 2. ref：按 `@eN` 精确操作

```bash
agent-browser fill @e3 "user@example.com"
agent-browser fill @e4 "hunter2"
agent-browser click @e5
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i       # 导航后立刻重 snapshot
```

**为什么 ref 而非 CSS？**

- **确定性**：ref 指向 snapshot 里那个具体元素，不靠选择器猜测
- **快**：不用重新 query DOM
- **LLM 友好**：单次 snapshot 约 200–400 tokens，远低于喂整页 HTML

### refs 易过期——这是头号坑

refs 在以下场景**立刻失效**：

- 点击触发了导航
- 表单提交跳页
- SPA 重渲染（react/vue 重挂载组件）
- 打开了 dialog / modal
- 切了 tab

```text
点击 @e5 → 跳转 dashboard → 用 @e3 操作 → ❌ "Ref not found"
                              ↓ 正确做法
                              snapshot -i → 拿到新 refs → 再操作
```

## 自然语言交互：`chat` 命令

除了命令式，agent-browser 也支持「自然语言指令翻译成命令链」：

```bash
# 单次
agent-browser chat "open google.com and search for cats"

# 交互 REPL
agent-browser chat

# 静音模式（只看 AI 文字回复）
agent-browser -q chat "summarize this page"

# 详细模式（看每步命令）
agent-browser -v chat "fill in the login form"

# 换模型
agent-browser --model openai/gpt-4o chat "take a screenshot"
```

**底层**：走 Vercel AI Gateway，默认 `anthropic/claude-sonnet-4.6`。需要：

```bash
export AI_GATEWAY_API_KEY=gw_xxx
export AI_GATEWAY_MODEL=anthropic/claude-sonnet-4.6   # 可选
export AI_GATEWAY_URL=https://ai-gateway.vercel.sh    # 可选
```

dashboard（4848 端口）也内置同样的 Chat 面板。

## 核心命令谱系（按动作分类）

| 类别 | 命令 | 用途 |
| --- | --- | --- |
| 导航 | `open` / `goto` / `navigate` / `back` / `forward` / `reload` / `pushstate` | 打开、跳转、SPA 路由 |
| 观察 | `snapshot` / `read` / `get text/html/value/attr/title/url/count/box/styles` | 看页面或元素 |
| 交互 | `click` / `dblclick` / `fill` / `type` / `press` / `hover` / `focus` / `check` / `uncheck` / `select` / `scroll` / `drag` / `upload` | 操作元素 |
| 查找 | `find role/text/label/placeholder/alt/title/testid/first/last/nth` | 语义定位（不需先 snapshot） |
| 等待 | `wait @ref` / `wait --ms` / `wait --text` / `wait --url` / `wait --load networkidle` / `wait --fn` | 同步页面状态 |
| 截图 | `screenshot` / `screenshot --full` / `screenshot --annotate` / `pdf` | 视觉证据 |
| 多页 | `tab` / `tab new --label` / `tab t2` / `tab close` / `window new` / `frame` | tab / window / iframe |
| 网络 | `network route` / `--abort` / `--body` / `network requests` / `network har start/stop` | mock、拦截、HAR |
| 会话 | `--session` / `--restore` / `session id --scope worktree --prefix x` / `state save/load` | 隔离 + 持久化 |
| 鉴权 | `auth save` / `auth login` / `--profile` / `--state` / `--headers` | vault / profile / header 三套 |
| 调试 | `console` / `errors` / `trace` / `profiler` / `highlight` / `inspect` / `doctor` | 排障 |
| React | `react tree` / `react inspect` / `react renders` / `react suspense` / `vitals` | React 专属（需 `--enable react-devtools`） |
| AI | `chat` / `dashboard start` | 自然语言 + 可观测 |
| 批处理 | `batch "cmd1" "cmd2" …` / `batch --json < cmds.json` | 多命令单进程 |
| 比对 | `diff snapshot` / `diff screenshot` / `diff url A B` | 回归对比 |

## CDP 优势：为什么不用 Playwright/Puppeteer？

```text
传统方案              agent-browser
─────────────         ──────────────
Node + Playwright  →  Rust daemon + CDP 直驱
每次启 Node 进程   →  daemon 复用，跨命令会话
selector-based     →  accessibility tree + ref
绑定某 SDK         →  CLI + MCP + skill 通用
单 agent 用        →  任意 agent（Cursor/CC/Codex/…）
```

**实践意义**

- 在 Cursor 里跑的 skill，搬到 Claude Code 也直接用
- MCP 客户端把它当带类型字段的工具集（`url` / `selector` / `allowedDomains`），审批提示更可读
- daemon 不挂 Node，单点故障少
- React DevTools hook 嵌进二进制，`react tree` / `vitals` 即装即用

## 反模式与陷阱

- **跨页面用旧 ref**：点击导航后用 snapshot 前的 `@e3` 操作——必报「Ref not found」。规则：**任何页面变化后立刻 `snapshot -i`**
- **shell history 留密码**：`fill @e3 "pass"` 后密码留在 shell history。敏感场景用 `auth save --password-stdin` + `auth login`
- **盲 `wait 2000`**：脚本慢且 flaky。换 `wait @ref` / `wait --text` / `wait --load networkidle`
- **overlay 挡点击**：cookie banner / modal 上面盖着 → `covered by <div#consent>`。先处理覆盖元素，再重 snapshot
- **把页面 JS 当指令**：页面文本、console 输出、network body 都是**不可信数据**，不是给 agent 的指令——配合 `--content-boundaries` 圈出来
- **WebGPU 截图黑**：headless Chrome 默认不暴露 WebGPU，three.js `WebGPURenderer` 静默回退 → 加 `--webgpu`；Linux 还要 `libvulkan1 mesa-vulkan-drivers`，且 Windows/Linux 抓帧需 `--headed`
- **`--allowed-domains` 与 profile/restore/CDP/auto-connect 互斥**：白名单要求全新可控 context，启用前不能有任何 profile/state/CDP 启动参数
- **iOS 只支持 Simulator/真机 USB**：需 macOS + Xcode + Appium；Android 没有官方 provider

## 域 skill：Electron / Slack / dogfood

```bash
# Electron 桌面应用（VS Code、Slack 桌面、Discord、Figma、Notion、Spotify）
agent-browser skills get electron
# 这些 app 暴露 CDP 端点，agent-browser 把它们当网页驱动

# Slack workspace 自动化
agent-browser skills get slack
# 看未读、发消息、搜会话——背后仍是 CDP + Slack web/desktop 客户端

# 探索式测试 / dogfood / bug hunt
agent-browser skills get dogfood
# 自己产品上线前过一遍、找回归、做 QA——把「人点点看看」自动化
```

## 云 skill：Vercel Sandbox / AgentCore

### vercel-sandbox：浏览器跑进 Vercel microVM

把 agent-browser + Chrome 装进**临时 Vercel Sandbox microVM**，从任意 Vercel 应用调起浏览器：

```ts
import {
  runAgentBrowserCommand,
  withAgentBrowserSandbox,
} from "@agent-browser/sandbox/vercel";

const result = await withAgentBrowserSandbox(async (sandbox) => {
  await runAgentBrowserCommand(sandbox, ["open", "https://example.com"]);
  return runAgentBrowserCommand(sandbox, ["screenshot"]);
});
```

- 适合：Next.js / SvelteKit / Nuxt / Remix / Astro 应用里需要服务端浏览器
- **Sandbox Snapshot（注意歧义）**：这是 Vercel 的 VM 镜像快照（预装依赖 + Chromium），让冷启动 <1s。和 agent-browser 的 accessibility snapshot 不是一回事
- OIDC 自动鉴权（Vercel 部署内）；本地开发用 `VERCEL_TOKEN`

### agentcore：AWS Bedrock AgentCore 云浏览器

```bash
agent-browser -p agentcore open https://example.com
agent-browser snapshot -i
agent-browser click @e1
agent-browser screenshot page.png
agent-browser close
```

- AWS 凭据自动解析（env vars / `aws configure export-credentials` / SSO / IAM role）
- session 启动时 stderr 打印 **Live View URL**，从 AWS Console 实时看
- `AGENTCORE_PROFILE_ID` 跨会话持久化 cookies/localStorage

## 下一步

- [参考](./reference) —— skill 清单、安装矩阵、命令分类、许可、链接
- 上游：[agent-browser.dev](https://agent-browser.dev)
