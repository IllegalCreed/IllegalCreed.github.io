---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 microsoft/playwright-cli 的 README、skills/playwright-cli/SKILL.md 与 references/ 编写。

## 速查

- **包**：`@playwright/cli`（npm），命令 `playwright-cli`，仓库 microsoft/playwright-cli
- **许可**：Apache License 2.0（Copyright Microsoft Corporation）
- **要求**：Node.js 18+
- **装 CLI**：`npm install -g @playwright/cli@latest`
- **装 skills**：`playwright-cli install --skills`
- **退化**：本地有 playwright 但无全局 CLI → `npx playwright cli` 替代所有命令
- **skills 文件**：`SKILL.md` + references（element-attributes / playwright-tests / request-mocking / running-code / session-management / storage-state / test-generation / tracing / video-recording）
- **会话**：`-s=name`、`list`、`close-all`、`kill-all`、`PLAYWRIGHT_CLI_SESSION=xxx`
- **可视化**：`show`、`show --annotate`

## skills 与 references 清单

| 文件 | 覆盖 |
| --- | --- |
| `skills/playwright-cli/SKILL.md` | 主技能文件：核心命令清单 + 快速示例 |
| `references/element-attributes.md` | 取 snapshot 不显示的属性（`eval "el => el.id"`） |
| `references/playwright-tests.md` | 跑/调试 Playwright 测试（`--debug=cli` + `attach`） |
| `references/request-mocking.md` | 拦截 / mock / 改写 / 屏蔽请求 |
| `references/running-code.md` | 执行任意 Playwright 脚本（`run-code`） |
| `references/session-management.md` | 多 session 管理 |
| `references/storage-state.md` | cookies / localStorage 持久化 |
| `references/test-generation.md` | 测试生成（plan / generate / heal） |
| `references/tracing.md` | 录制与查看 trace |
| `references/video-recording.md` | 录制浏览器视频 |

## 安装与最小用法

```bash
# 1. 全局装 CLI
npm install -g @playwright/cli@latest
playwright-cli --help

# 2. 装 skills（Claude Code / Copilot 自动读本地技能）
playwright-cli install --skills

# 3. 退化路径
npx --no-install playwright --version   # 本地是否有 playwright
npx playwright cli open https://example.com   # 有则替代 playwright-cli

# 4. skills-less 用法（不装 skills 也行）
#    指向 CLI，让 agent 读 --help 自悟
```

```bash
# 最小工作流
playwright-cli open https://demo.playwright.dev/todomvc/
playwright-cli snapshot                  # 拿 ref
playwright-cli fill e21 "Buy groceries" --submit
playwright-cli check e35
playwright-cli screenshot
playwright-cli close
```

## 核心命令分类

### Core / 元素交互

```bash
playwright-cli open [url]
playwright-cli goto <url>
playwright-cli close
playwright-cli type <text>
playwright-cli click <ref> [button]
playwright-cli dblclick <ref> [button]
playwright-cli fill <ref> <text> [--submit]
playwright-cli drag <startRef> <endRef>
playwright-cli drop <ref> --path=<file> | --data="k=v"
playwright-cli hover <ref>
playwright-cli select <ref> <val>
playwright-cli upload <file>
playwright-cli check <ref>
playwright-cli uncheck <ref>
playwright-cli snapshot [--filename=f] [--depth=N] [--boxes] [<ref>]
playwright-cli find <text> | --regex <pattern>
playwright-cli eval <func> [ref]
playwright-cli dialog-accept [prompt]
playwright-cli dialog-dismiss
playwright-cli resize <w> <h>
```

### Navigation / Keyboard / Mouse

```bash
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload

playwright-cli press <key>
playwright-cli keydown <key>
playwright-cli keyup <key>

playwright-cli mousemove <x> <y>
playwright-cli mousedown [button]
playwright-cli mouseup [button]
playwright-cli mousewheel <dx> <dy>
```

### Save as / Tabs

```bash
playwright-cli screenshot [ref] [--filename=f] [--hires]
playwright-cli pdf [--filename=page.pdf]

playwright-cli tab-list
playwright-cli tab-new [url]
playwright-cli tab-close [index]
playwright-cli tab-select <index>
```

### Storage（state / cookies / localStorage / sessionStorage）

```bash
playwright-cli state-save [filename]
playwright-cli state-load <filename>

playwright-cli cookie-list [--domain]
playwright-cli cookie-get <name>
playwright-cli cookie-set <name> <val> [--domain=example.com --httpOnly --secure]
playwright-cli cookie-delete <name>
playwright-cli cookie-clear

playwright-cli localstorage-list
playwright-cli localstorage-get <key>
playwright-cli localstorage-set <k> <v>
playwright-cli localstorage-delete <k>
playwright-cli localstorage-clear

playwright-cli sessionstorage-list
playwright-cli sessionstorage-get <k>
playwright-cli sessionstorage-set <k> <v>
playwright-cli sessionstorage-delete <k>
playwright-cli sessionstorage-clear
```

### Network（mock 请求）

```bash
playwright-cli route <pattern> [--status=N] [--body=...] [--content-type=...] [--header="K: V"] [--remove-header=a,b]
playwright-cli route-list
playwright-cli unroute [pattern]
```

### DevTools

```bash
playwright-cli console [min-level]
playwright-cli requests
playwright-cli request <index>
playwright-cli run-code <code> | --filename=f
playwright-cli tracing-start
playwright-cli tracing-stop
playwright-cli video-start [filename]
playwright-cli video-chapter <title>
playwright-cli video-show-actions
playwright-cli video-hide-actions
playwright-cli video-stop
playwright-cli show [--annotate]
playwright-cli generate-locator <ref>
playwright-cli highlight <ref> [--style=...] [--hide]
```

### Open params / 会话

```bash
playwright-cli open --browser=chrome|firefox|webkit|msedge
playwright-cli open --mobile
playwright-cli open --device="iPhone 15"
playwright-cli open --persistent
playwright-cli open --profile=<path>
playwright-cli open --config=file.json

playwright-cli attach --extension=chrome | --cdp=chrome | --cdp=<url>
playwright-cli detach
playwright-cli delete-data

playwright-cli -s=name <cmd>
playwright-cli list
playwright-cli close-all
playwright-cli kill-all
```

## 全局选项

| 选项 | 作用 |
| --- | --- |
| `--raw` | 剥 page status / 生成代码 / snapshot metadata，只留结果值（便于管道与对比） |
| `--json` | 把回复包成 JSON（如 `list --json`） |
| `--config <file>` | 指定 JSON 配置；默认读 `.playwright/cli.config.json` |
| `-s=<name>` | 命名 session |
| `--headed` | 给 `open` 用，可视化浏览器（默认 headless） |

## 配置文件（`.playwright/cli.config.json`）

支持 `browser`（`browserName` / `isolated` / `userDataDir` / `launchOptions` / `contextOptions` / `cdpEndpoint` / `cdpHeaders` / `cdpTimeout` / `remoteEndpoint` / `initPage` / `initScript`）、`saveVideo`、`outputDir`、`outputMode`（`file`｜`stdout`）、`console.level`、`network.allowedOrigins`/`blockedOrigins`、`testIdAttribute`（默认 `data-testid`）、`timeouts.action`（默认 5000ms）、`timeouts.navigation`（默认 60000ms）、`allowUnrestrictedFileAccess`、`codegen`（`typescript`｜`none`）。

也可走环境变量（前缀 `PLAYWRIGHT_MCP_*`，CLI 与 MCP 共用一组）：`PLAYWRIGHT_MCP_BROWSER`、`PLAYWRIGHT_MCP_DEVICE`、`PLAYWRIGHT_MCP_HEADLESS`、`PLAYWRIGHT_MCP_CDP_ENDPOINT`、`PLAYWRIGHT_MCP_ALLOWED_ORIGINS`、`PLAYWRIGHT_MCP_BLOCKED_ORIGINS`、`PLAYWRIGHT_MCP_CONFIG`、`PLAYWRIGHT_MCP_OUTPUT_DIR`、`PLAYWRIGHT_MCP_SAVE_VIDEO`、`PLAYWRIGHT_MCP_SAVE_TRACE`、`PLAYWRIGHT_MCP_STORAGE_STATE`、`PLAYWRIGHT_MCP_TEST_ID_ATTRIBUTE`、`PLAYWRIGHT_MCP_TIMEOUT_ACTION`、`PLAYWRIGHT_MCP_TIMEOUT_NAVIGATION`、`PLAYWRIGHT_MCP_USER_DATA_DIR`、`PLAYWRIGHT_MCP_VIEWPORT_SIZE` 等。

## 与 Playwright MCP 的边界

| 维度 | Playwright CLI + skills | Playwright MCP |
| --- | --- | --- |
| 目标用户 | coding agent（Claude Code、Copilot） | 自治/探索式 agent 循环 |
| token | 省——命令行调用，不灌大 schema/a11y tree | 重——工具 schema 与 a11y tree 入上下文 |
| 状态 | 命令间靠 session 与文件（snapshot/state） | 持久浏览器上下文、富内省 |
| 擅长 | 大代码库 + 浏览器自动化 + 推理并存 | 长跑、自愈测试、探索式自动化 |

两者**底层共用 Playwright**，能力重叠；选哪条看 agent 类型。

## 资源链接

- 仓库：[microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)
- skills 文档：[playwright.dev/agent-cli/skills](https://playwright.dev/agent-cli/skills)
- 对照：[Playwright MCP](https://github.com/microsoft/playwright-mcp)
- 许可：Apache License 2.0（Copyright Microsoft Corporation）
- 相关叶：[Playwright](../../testing/playwright/)（如存在）· [Skills CLI 与 find-skills](../skills-cli-find-skills/)
