---
layout: doc
---

# Playwright CLI

Playwright CLI（`microsoft/playwright-cli`，npm 包 `@playwright/cli`）是 **Microsoft 官方**出品的浏览器自动化命令行工具，专为 **coding agent**（Claude Code、GitHub Copilot 等）驱动浏览器而设计。它把 Playwright 的能力暴露成简洁的 CLI 命令 + 一份 SKILL.md 技能说明——agent 通过 `playwright-cli open / click / type / snapshot / route / eval` 等命令驱动浏览器，**不让大段 page 数据和大体积工具 schema 灌进上下文**，从而在有限 token 窗口里同时扛住浏览器自动化 + 大代码库 + 推理。Node 18+，Apache-2.0 许可。

## 评价

**优点**

- **官方出品、与 Playwright 同源**：由 Playwright 团队（Microsoft）维护，能力与 Playwright 主线一致（snapshot、locator、route、tracing、video 都在）
- **Token-efficient 是核心设计**：不把整页可访问性树强灌进 LLM；用 `snapshot` 取 YAML 结构、`find` 搜索、`--raw` 剥离 metadata，按需取信息
- **CLI + SKILL 比 MCP 更省上下文**：避免加载大工具 schema 与冗长的 a11y tree，更适合「既要看代码又要跑浏览器」的 coding agent
- **会话化、多 session**：`-s=name`、`list`、`close-all`、`PLAYWRIGHT_CLI_SESSION` 环境变量，可多项目并发
- **可视化 Dashboard**：`playwright-cli show` 网格化看所有会话的实时预览，可点击接管鼠标键盘
- **可观察、可回放**：`console` / `requests` / `tracing-*` / `video-*` 全套调试能力
- **官方 skills 文档**：`playwright-cli install --skills` 装技能，references 涵盖 element-attributes / playwright-tests / request-mocking 等高频场景

**缺点 / 边界**

- **偏 coding agent 场景**：长跑、自愈式测试、探索式自动化更适合 [Playwright MCP](https://github.com/microsoft/playwright-mcp)（持久状态、富内省）
- **命令粒度较细**：复杂流程要串很多命令；非常规需求往往得 `run-code` 写内联脚本
- **命令行参数语法有细节**：Windows 上 URL 含 `&` 需转义（`^&` 或 `--%`）；正则 `find --regex "/pattern/i"` 加 flag 要包斜杠
- **与 Playwright MCP 功能重叠**：两者底层共用 Playwright，二选一即可（coding agent 选 CLI，自治/探索式 agent 选 MCP）

## 适用场景

- 用 Claude Code / Copilot 等 coding agent 做浏览器自动化（测流程、跑回归、抓数据）
- 给应用做端到端冒烟，让 agent 自动截图 pass/fail 场景
- 调试失败的 Playwright 测试（`npx playwright test --debug=cli` 后 `playwright-cli attach`）
- 拦截 / mock 网络请求验证前端在不同响应下的表现（`route` / `unroute`）
- 给 agent 一个可观察的浏览器环境（headed + `show` Dashboard）

## 边界

- **不是 Playwright 测试框架本身**：测试仍由 `npx playwright test` 跑，CLI 只是「跑测试之外」的浏览器自动化与调试入口
- **不是 MCP**：要持久浏览器上下文 / 富内省 / 自治循环，用 Playwright MCP
- **不强制装 skills**：也能 skills-less 直接跑——agent 读 `playwright-cli --help` 自悟；但装 skills 后命中更稳
- **Node 18+ 是硬要求**；本地没装全局 CLI 时可用 `npx playwright cli` 退化

## 官方文档

[Playwright CLI Skills（playwright.dev/agent-cli/skills）](https://playwright.dev/agent-cli/skills) ｜ [Playwright MCP（对照）](https://github.com/microsoft/playwright-mcp)

## GitHub 地址

[microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)（Apache-2.0，npm：`@playwright/cli`）

## 内容地图

- [入门](./getting-started) —— 定位（Microsoft 官方、token-efficient CLI、面向 coding agent）、安装、skills+references 总览、为何 CLI 而非 SDK/MCP
- [指南](./guide-line) —— skills/playwright-cli + references（element-attributes 元素定位 / playwright-tests 测试调试 / request-mocking 请求 mock）、token-efficient 心智、反模式
- [参考](./reference) —— skills+references 清单、安装、核心命令分类、许可、链接

## 幻灯片地址

<a href="/SlideStack/playwright-cli-slide/" target="_blank">Playwright CLI</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=649" target="_blank" rel="noopener noreferrer">Playwright CLI 测试题</a>

