---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 microsoft/playwright-cli 的 README、skills/playwright-cli/SKILL.md 与 references/ 编写（Apache-2.0）。

## 速查

- **是什么**：Microsoft 官方的 token-efficient 浏览器自动化 CLI，面向 coding agent（Claude Code / Copilot 等），npm 包 `@playwright/cli`
- **要求**：Node.js 18+；可选 coding agent（也会无 agent 单跑）
- **装 CLI**：`npm install -g @playwright/cli@latest`，跑 `playwright-cli --help`
- **装 skills**：`playwright-cli install --skills`（Claude Code / Copilot 自动读本地 skills）
- **退化用法**：本地有 playwright 但没全局 CLI，用 `npx playwright cli` 替代所有 `playwright-cli` 命令
- **最小流**：`open` → `goto` → `snapshot` 拿 ref → `click e15` / `type "..."` / `press Enter` → `screenshot` → `close`
- **为何 CLI 省 token**：避免把大工具 schema + 整页 a11y tree 灌进 LLM；按需 `snapshot` 取 YAML、`find` 搜索、`--raw` 剥 metadata
- **3 个高频 reference**：element-attributes（元素定位）/ playwright-tests（测试调试）/ request-mocking（请求 mock）

## 定位：面向 coding agent 的 token-efficient CLI

现代 coding agent（Claude Code、GitHub Copilot 等）越来越偏爱 **CLI + SKILL** 而非 MCP——CLI 调用更省 token：不必把大工具 schema 和冗长 a11y 树加载进上下文，agent 通过简短、专用的命令行动。这让 **CLI + SKILLs** 更适合既要跑浏览器自动化、又要扛大代码库与推理的高吞吐 coding agent。

与之相对，[Playwright MCP](https://github.com/microsoft/playwright-mcp) 适合**自治式 agent 循环**——需要持久浏览器状态、富内省、对页面结构反复推理的场景（探索式自动化、自愈测试、长跑自治 workflow）。

## 安装

```bash
# 全局安装 CLI
npm install -g @playwright/cli@latest
playwright-cli --help

# 安装 skills（让 Claude Code / Copilot 读到本地技能说明）
playwright-cli install --skills
```

退化路径：当全局 `playwright-cli` 不可用，但本地装了 Playwright 时：

```bash
npx --no-install playwright --version   # 检查本地是否有
# 有 → 用 npx playwright cli 替代所有 playwright-cli 命令
npx playwright cli open https://example.com
```

## 最小工作流：开浏览器 → 取 snapshot → 用 ref 交互

```bash
# 开浏览器并导航
playwright-cli open https://demo.playwright.dev/todomvc/
# 取 snapshot，拿到元素 ref（e15、e21...）
playwright-cli snapshot
# 用 ref 交互
playwright-cli click e15
playwright-cli fill e21 "Buy groceries" --submit
playwright-cli check e35
# 截图 / 关闭
playwright-cli screenshot
playwright-cli close
```

> snapshot 返回的是 YAML 结构化页面树，每节点带 ref。**这是 CLI 省 token 的关键**——不全量塞 a11y tree，按需取你需要的那部分（`snapshot e34` 取子树、`snapshot --depth=4` 限深度、`find "Sign in"` 直接搜）。

## 3 种定位元素的方式

```bash
playwright-cli click e15                                  # 1. snapshot 里的 ref（默认推荐）
playwright-cli click "#main > button.submit"              # 2. CSS 选择器
playwright-cli click "getByRole('button', { name: 'Submit' })"   # 3. Playwright locator
playwright-cli click "getByTestId('submit-button')"       #    或 test id
```

snapshot 看不到的属性（`id` / `class` / `data-*`）用 `eval` 取：

```bash
playwright-cli eval "el => el.id" e7
playwright-cli eval "el => el.getAttribute('data-testid')" e7
playwright-cli eval "el => getComputedStyle(el).display" e7
```

## skills + references 总览

装 skills 后，agent 读到 `skills/playwright-cli/SKILL.md`（主）+ 一组 reference：

- **SKILL.md**：核心命令清单（Core / Navigation / Keyboard / Mouse / Save as / Tabs / Storage / Network / DevTools / Open params）+ 快速示例
- **references/playwright-tests.md**：跑/调试 Playwright 测试（`--debug=cli` + `attach`）
- **references/request-mocking.md**：拦截 / mock / 改写 / 屏蔽请求
- **references/element-attributes.md**：snapshot 不显示的属性怎么取（`eval "el => el.id"`）
- 还包含 running-code / session-management / storage-state / test-generation / tracing / video-recording 等其它 reference

## 为何选 CLI 而非 SDK / MCP

| 选项 | 何时选 |
| --- | --- |
| **Playwright CLI + skills** | coding agent（Claude Code、Copilot）—— 要在浏览器自动化 + 大代码库 + 推理间省 token |
| **Playwright MCP** | 自治式 agent 循环—— 持久状态、富内省、探索式/自愈自动化 |
| **Playwright SDK（Node/Python/.NET/Java）** | 你自己在写程序化脚本/测试，不通过 LLM |

CLI 不是替代 SDK 或 MCP，而是**给 coding agent 这条赛道一个更轻的接口**——同样的 Playwright 能力，但走命令行而非工具 schema 注入。

## 下一步

- [指南](./guide-line) —— skills/playwright-cli 深入、3 大 reference 实战、token-efficient 心智、反模式（别在 agent 上下文塞重 SDK）
- [参考](./reference) —— skills+references 清单、安装、核心命令分类、许可、链接
