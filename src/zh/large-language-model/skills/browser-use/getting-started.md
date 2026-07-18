---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 browser-use/browser-use 官方仓库（MIT，主分支 2026-07）的 README 与 `skills/`（browser-use / cloud / open-source / qa / remote-browser / x402）编写。

## 速查

- **装**：`uv add browser-use`（Python ≥ 3.11）或 `pip install browser-use`；CLI 形态 `uvx browser-use install`
- **跑**：`Agent(task=..., llm=ChatBrowserUse(model='openai/gpt-5.5'))` → `await agent.run()`
- **Key**：`.env` 设 `BROWSER_USE_API_KEY`（get one from cloud.browser-use.com）；可换 OpenAI/Anthropic/Google/本地 Ollama
- **6 skills**：`browser-use`（核心/本地 CDP）·`cloud`（官方云 REST/SDK）·`open-source`（Python 库参考）·`qa`（网站 1–5 评分）·`remote-browser`（沙箱远程浏览器 CLI）·`x402`（USDC on Base 付费，免 API key）
- **CLI vs 库**：一次性任务（给 Claude Code/Cursor 做）→ CLI；可重复自动化（爬虫/QA/嵌产品）→ Python 库
- **基线**：★105k，Odysseys 200 长程 web 任务 #1（87.4%）

## 定位

Browser Use 是「**让 LLM agent 自主操作浏览器**」的官方 Python 库——开放任务，不是固定脚本。给 agent 一个自然语言任务，它自己打开页面、看 DOM/可访问性树、推理下一步、点击/填表、回收结果。区别于 Playwright/Puppeteer/Selenium（人写脚本），它由 LLM 实时决策。

## 安装

```bash
# Python 库（推荐 uv）
uv add browser-use
# 或
pip install browser-use

# CLI 形态（一次性任务交给别的 agent 用）
uvx browser-use install
```

环境变量 `.env`：

```bash
BROWSER_USE_API_KEY=your-key          # 用于 ChatBrowserUse + 云特性
# 或自带 provider key
# GOOGLE_API_KEY=...
# ANTHROPIC_API_KEY=...
# OPENAI_API_KEY=...
```

## 第一个 Agent

```python
import asyncio
from browser_use import Agent, ChatBrowserUse

async def main():
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=ChatBrowserUse(model='openai/gpt-5.5'),
        # llm=ChatBrowserUse(model='bu-2-0'),        # 官方优化模型，最快最省
        # llm=ChatOpenAI(model='gpt-5.5'),
        # llm=ChatAnthropic(model='claude-opus-4-8'),
    )
    history = await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

要点：库是 **async**，入口用 `asyncio.run()`；`Agent` 默认驱动一个 Chromium；`run()` 返回 `AgentHistoryList`（步骤、结果、错误）。

## 6 个 skills 总览

| Skill | 何时用 | 一句话 |
| --- | --- | --- |
| `browser-use`（核心） | 本地 agent 通过 CDP 控制你正在用的 Chrome | `browser-use <<'PY'` heredoc 喂 Python；helpers 已预导入 |
| `cloud` | 用 Browser Use Cloud REST/SDK | `X-Browser-Use-API-Key` header，v2（30 端点）/v3（BU Agent 会话） |
| `open-source` | 写 Python 代码用开源库 | Agent/Browser/Tools 配置、模型、hooks、MCP、Laminar/OpenLIT |
| `qa` | 给网站/本地 dev server 打分 | 1–5 评分 + 证据，云端浏览器跑，自动 tunnel localhost |
| `remote-browser` | 沙箱（无 GUI）远程机器控浏览器 | `browser-use open/state/click/input`，Cloudflare tunnel 暴露 localhost |
| `x402` | 不要 API key、用加密钱包付费 | USDC on Base，每次请求付费，SDK 触发 |

## CLI vs Python 库

**CLI**：你已经有一个 agent（Claude Code / Codex / Cursor / Hermes / OpenClaw…），想让它在浏览器里干活。

```text
（在 agent 对话里）
Upload this video to YouTube
Compare these three laptops and give me a table with prices
Fill in this job application with my resume
```

**Python 库**：你在写自己的自动化代码。

- 定时/并发跑很多任务（爬虫、监控、QA）
- 把 agent 嵌进自己产品
- 自定义 tools、自定义系统提示、结构化输出、细粒度浏览器控制

> 经验法则：**一次性任务给 agent → CLI；可重复自动化入代码 → Python 库**。

## Agent 心智

- **看页面优先用可访问性树（AX），不用截图**：`cdp("Accessibility.getFullAXTree")` 给每个元素 role/name/`backendDOMNodeId`，比像素稳
- **坐标点击默认**：CDP 鼠标事件穿透 iframe/shadow/跨域
- **首次导航用 `new_tab(url)`，不是 `goto_url(url)`**（核心 skill 约定）
- **登录墙停下问人**——例外是 Chrome 已登 SSO 可自动用；密码/MFA/同意/账号选择仍要停下
- **任务完成、云浏览器还在跑 → 主动问「关掉吗」**：远程 daemon 一直计费到停或超时

## 下一步

- [指南](./guide-line) —— 6 skills 深入、LLM 驱动浏览器机制、反模式
- [参考](./reference) —— skills 清单、安装、许可、关键链接
