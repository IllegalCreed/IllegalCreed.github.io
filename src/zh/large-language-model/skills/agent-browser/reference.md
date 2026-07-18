---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vercel-labs/agent-browser README、`skills/`、`skill-data/` 编写。

## 速查

- **装**：`npm i -g agent-browser && agent-browser install`（其他：`brew` / `cargo` / 源码）
- **升级**：`agent-browser upgrade`（自动识别安装方式）
- **体检**：`agent-browser doctor`（环境、Chrome、daemon、config、provider、网络、launch test）
- **skill 列表**：`agent-browser skills list`；**拉内容**：`agent-browser skills get <name> [--full]`
- **MCP**：`agent-browser mcp [--tools core|network|state|debug|tabs|react|mobile|all]`
- **平台**：macOS ARM/x64、Linux ARM/x64、Windows x64（原生 Rust 二进制）
- **许可**：Apache-2.0；Vercel Labs 官方

## 安装矩阵

| 方式 | 命令 | 备注 |
| --- | --- | --- |
| npm（推荐） | `npm i -g agent-browser` | 装原生 Rust 二进制 |
| 项目依赖 | `npm i agent-browser` | pin 版本到 `package.json` |
| Homebrew | `brew install agent-browser` | macOS |
| Cargo | `cargo install agent-browser` | Rust 用户 |
| 源码 | `git clone … && pnpm install && pnpm build && pnpm build:native && pnpm link --global` | 需 Node.js 24+ / pnpm 11+ / Rust |
| Linux 系统依赖 | `agent-browser install --with-deps` | 顺带装 Chromium 库 |

首次必跑 `agent-browser install`——从 **Chrome for Testing**（Google 官方自动化渠道）下载 Chrome。已装的 Chrome / Brave / Playwright / Puppeteer Chromium 自动识别。

## Skills 清单

| Skill | 内容 | 触发场景 |
| --- | --- | --- |
| `agent-browser`（主） | 7 行发现桩，指向 `skills get core` | 装到 agent 的入口 |
| `core` | snapshot+ref、navigate、form、extract、screenshot、tab、auth、session、React/Vitals、MCP | 默认浏览器自动化 |
| `electron` | 桌面 Electron 应用（VS Code、Slack、Discord、Figma、Notion、Spotify） | 控制 Electron app（暴露 CDP） |
| `slack` | Slack workspace 自动化（未读、发消息、搜会话） | Slack 工作流 |
| `dogfood` | 探索式测试 / QA / bug hunt | 自己产品过回归、dogfood |
| `vercel-sandbox` | agent-browser + Chrome 跑进 Vercel Sandbox microVM | Next.js/SvelteKit/Nuxt/Remix/Astro 应用里调浏览器 |
| `agentcore` | AWS Bedrock AgentCore 云浏览器（SigV4、Live View） | AWS 托管浏览器 |

> `agent-browser skills get <name> --full` 拉 references 和 templates；`agent-browser skills get --all` 一次拉全部。

## 命令分类

### 核心

```text
open / goto / navigate / read / back / forward / reload / pushstate
click / dblclick / focus / type / fill / press / keyboard type / keyboard inserttext
keydown / keyup / hover / select / check / uncheck / scroll / scrollintoview / drag / upload
screenshot [--full|--annotate|--screenshot-dir|--screenshot-format|--screenshot-quality]
pdf / snapshot / eval / connect / stream enable|status|disable / close / close --all
chat "<instruction>"
```

### Get Info

```text
get text|html|value|attr|title|url|cdp-url|count|box|styles
```

### Read（agent-friendly 文本）

```text
read [url] [--filter|--outline|--llms index|full|--require-md|--raw|--json|--timeout]
```

### Check State

```text
is visible|enabled|checked
```

### Find（语义定位）

```text
find role|text|label|placeholder|alt|title|testid|first|last|nth
  [--name|--exact] <action> [value]
  动作：click / fill / type / hover / focus / check / uncheck / text
```

### Wait

```text
wait <selector> | wait <ms> | wait --text | wait --url | wait --load load|domcontentloaded|networkidle | wait --fn
```

### Batch（单进程多命令）

```text
batch "cmd1" "cmd2" … [--bail]
echo '[["open","https://x.com"],["click","@e1"]]' | agent-browser batch --json
```

### Clipboard / Mouse

```text
clipboard read|write|copy|paste
mouse move|down|up|wheel
```

### Browser Settings

```text
set viewport|device|geo|offline|headers|credentials|media
```

### Cookies & Storage

```text
cookies [set|clear] [--curl <file>]
storage local|session [set|clear]
```

### Network

```text
network route <url> [--abort|--body <json>|--resource-type]
network unroute / requests [--filter|--type|--method|--status] / request <id>
network har start|stop
```

### Tabs & Windows & Frames

```text
tab [new [--label]|<t<N>|label>|close]
window new
frame <sel> | frame main
```

### Dialogs

```text
dialog accept [text] | dismiss | status
```

### Diff（回归对比）

```text
diff snapshot [--baseline|--selector|--compact]
diff screenshot [--baseline|-o|-t]
diff url A B [--screenshot|--wait-until|--selector]
```

### Debug

```text
trace start|stop
profiler start|stop
console [--json|--clear]
errors [--clear]
highlight / inspect
state save|load|list|show|rename|clear|clean
```

### Navigation & Init Scripts

```text
pushstate <url>
open --init-script <path>
addinitscript <js>
removeinitscript <id>
```

### React / Web Vitals（需 `--enable react-devtools`）

```text
react tree / inspect <fiberId> / renders start|stop / suspense [--only-dynamic]
vitals [url] [--json]
```

### Setup / Skills / MCP

```text
install [--with-deps] / upgrade / doctor [--fix|--offline|--quick] / mcp [--tools all|core,network,react|…]
skills [list] / get <name> [--full] / get --all / path [name]
```

### Auth / Session / Profile

```text
auth save|login [--credential-provider|--item|--url|--username-selector|--password-selector|--submit-selector]
session [list|id --scope worktree --prefix <p>|info --json]
profiles
state save|load|list|show|rename|clear|clean
--session <id> --restore / --restore-save auto|always|never
--profile <name|path> / --state <path>
```

### Plugins

```text
plugin add <ref> [--name|--capability]
plugin list|show
plugin run <name> <capability> --payload '<json>'
--provider <name>   # browser provider plugin
```

### Dashboard

```text
dashboard start [--port 4848]
dashboard stop
```

## MCP Profiles

| Profile | 工具范围 |
| --- | --- |
| `core`（默认） | navigation / snapshot / 交互 / wait / read / screenshot / eval / close / tab 基础 |
| `network` | route / requests / HAR / headers / credentials / offline |
| `state` | cookies / storage / auth / saved state / sessions / profiles / skills |
| `debug` | console/errors / tracing / profiling / recording / clipboard / plugins / doctor / dashboard / install / upgrade / chat / diff / batch / confirm-deny |
| `tabs` | back/forward/reload、tabs、windows、frames、dialogs |
| `react` | react tree/inspect/renders/suspense、vitals、pushstate |
| `mobile` | viewport/device/geo/media、touch、swipe、mouse、keyboard |
| `all` | 全量 CLI parity |

MCP 客户端配置：

```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "agent-browser",
      "args": ["mcp", "--tools", "core,network,react"]
    }
  }
}
```

## 浏览器 Provider

| Provider | 命令 | 鉴权 |
| --- | --- | --- |
| 本地 Chrome（默认） | `agent-browser open …` | — |
| Lightpanda | `--engine lightpanda` | — |
| CDP 远程 | `--cdp <port\|wss-url>` / `connect <port>` | — |
| Auto-connect | `--auto-connect` | — |
| iOS Simulator | `-p ios --device "iPhone 16 Pro"` | macOS + Xcode + Appium |
| Browserless | `-p browserless` | `BROWSERLESS_API_KEY` |
| Browserbase | `-p browserbase` | `BROWSERBASE_API_KEY` |
| Browser Use | `-p browseruse` | `BROWSER_USE_API_KEY` |
| Kernel | `-p kernel` | `KERNEL_API_KEY` |
| AgentCore | `-p agentcore` | AWS 凭据链（SigV4） |
| Plugin provider | `--provider <name>` | plugin 自定义 |

## 安全开关（全 opt-in）

| 特性 | 标志 / env | 作用 |
| --- | --- | --- |
| Auth Vault | `auth save / auth login`；密钥 `AGENT_BROWSER_ENCRYPTION_KEY` | 凭据加密本地存、按名引用；LLM 看不到密码 |
| 域名白名单 | `--allowed-domains` / `AGENT_BROWSER_ALLOWED_DOMAINS` | 限制导航 + 子资源 + WebRTC（Chromium 关 RTCPeerConnection）+ worker |
| 输出边界 | `--content-boundaries` / `AGENT_BROWSER_CONTENT_BOUNDARIES` | 包裹页面输出防注入 |
| 输出限长 | `--max-output` / `AGENT_BROWSER_MAX_OUTPUT` | 防 context 洪泛 |
| 动作策略 | `--action-policy <path>` | JSON 静态策略门禁危险动作 |
| 动作确认 | `--confirm-actions eval,download` | 敏感类目要确认 |
| 插件能力门禁 | `--confirm-actions plugin:<p>:<cap>` | 按 capability 控插件 |
| State 加密 | `AGENT_BROWSER_ENCRYPTION_KEY`（64-char hex） | AES-256-GCM 加密 session state |

## 配置文件

`agent-browser.json` 设持久默认（camelCase 键）；优先级：`~/.agent-browser/config.json` < `./agent-browser.json` < `AGENT_BROWSER_*` env < CLI flag。

```json
{
  "$schema": "https://agent-browser.dev/schema.json",
  "headed": true,
  "profile": "./browser-data",
  "userAgent": "my-agent/1.0",
  "hideScrollbars": false,
  "plugins": [
    { "name": "vault", "command": "agent-browser-plugin-vault", "capabilities": ["credential.read"] }
  ]
}
```

## 默认超时

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `AGENT_BROWSER_DEFAULT_TIMEOUT` | `25000` (25s) | 标准操作超时；刻意 < 30s IPC 读超时 |
| `AGENT_BROWSER_AUTOSAVE_INTERVAL_MS` | `30000` | restore 周期自动保存；`0` 仅关闭时存 |
| `AGENT_BROWSER_IDLE_TIMEOUT_MS` | 无 | daemon 空闲超时自动退出 |
| `AGENT_BROWSER_STATE_EXPIRE_DAYS` | `30` | state 过期清理 |

> `AGENT_BROWSER_DEFAULT_TIMEOUT > 30000` 可能触发 EAGAIN——daemon 还没回 CLI 读超时先到。

## 目录结构（仓库）

```
agent-browser/
├── skills/
│   └── agent-browser/SKILL.md   # 发现桩（瘦）
├── skill-data/
│   ├── core/         SKILL.md + references/ + templates/
│   ├── electron/     SKILL.md
│   ├── slack/        SKILL.md + references/ + templates/
│   ├── dogfood/      SKILL.md + references/ + templates/
│   ├── vercel-sandbox/ SKILL.md
│   └── agentcore/    SKILL.md
├── bin/ cli/ docker/ docs/ examples/ evals/ benchmarks/ packages/
├── agent-browser.schema.json   # config JSON Schema
├── AGENTS.md CHANGELOG.md LICENSE README.md
└── package.json pnpm-workspace.yaml
```

## 资源链接

- 仓库：[vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)
- 官网：[agent-browser.dev](https://agent-browser.dev)（[security](https://agent-browser.dev/security) · [webgpu](https://agent-browser.dev/webgpu)）
- skills.sh：[vercel-labs/agent-browser](https://skills.sh/vercel-labs/agent-browser)
- Vercel Labs：[vercel.com/labs](https://vercel.com/labs)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Antfu Skills](../antfu-skills/)
