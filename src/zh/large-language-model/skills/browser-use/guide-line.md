---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 browser-use/browser-use 官方仓库（MIT，主分支 2026-07）的 README 与 `skills/`（browser-use / cloud / open-source / qa / remote-browser / x402）编写。

## 速查

- **6 skills**：核心 `browser-use`（本地 CDP）·`cloud`（REST/SDK）·`open-source`（Python 库）·`qa`（1–5 评分）·`remote-browser`（沙箱 CLI）·`x402`（钱包付费）
- **核心 skill**：`browser-use <<'PY'` heredoc 喂 Python，helpers 已预导入；本地连 Chrome CDP（`chrome://inspect/#remote-debugging`）
- **cloud skill**：v2 REST 30 端点 + v3 BU Agent 会话；`X-Browser-Use-API-Key` header；Python/TS 双 SDK
- **qa skill**：按规模选——单流程直连 / 多流程 fan-out；文本模型统一走 v2 cloud agent（带 `judge` + 1–5 评分）
- **remote-browser**：`open/state/click/input`，`--connect` 多 agent 共享浏览器分标签
- **x402**：仅 SDK，无 CLI；USDC on Base，每次请求付费；先建钱包→充值→`.env`→~$1 测试
- **统一心智**：找元素用 AX 树而非截图；登录墙停下问人；云浏览器跑完要关（计费到停为止）

## 核心 skill：browser-use（本地 CDP）

本地形态：agent 用 `browser-use` 命令通过 **CDP（Chrome DevTools Protocol）** 接管你**已经在用的 Chrome**——共享你的登录态、扩展、Cookie。

```bash
browser-use <<'PY'
print(page_info())
PY
```

约定：

- `browser-use <<'PY'` heredoc 喂多行 Python；helpers（`page_info`、`new_tab`、`click_at_xy`、`cdp`、`js`、`wait_for_load`、`start_remote_daemon`…）**已预导入**
- 首次导航 `new_tab(url)`，**不是** `goto_url(url)`
- 连不上跑 `browser-use --doctor`；Chrome 远程调试要在 `chrome://inspect/#remote-debugging` 打开
- 找元素**优先 AX 树**：`cdp("Accessibility.getFullAXTree")["nodes"]` 给 role/name/`backendDOMNodeId`，Python 端过滤再打印（默认几千节点）
- 坐标点击：`cdp("DOM.getBoxModel", backendNodeId=n)` 取盒子中心 → `click_at_xy(x, y)` → 用 `js(...)`/`page_info()` 验证
- **截图是兜底**（布局/图像信息才用）；**原始 HTML 只在 AX 缺元素时**（canvas、奇异控件）
- 登录墙停下问人；CDP 可用 `cdp("Domain.method", ...)`

## LLM 驱动浏览器：开源库心智

```python
from browser_use import Agent, ChatBrowserUse, Tools

@tools.action(description='查询内部 API')
def fetch_order(order_id: str) -> str:
    return f"订单 {order_id} 状态：已发货"

agent = Agent(
    task="打开订单页，把每个待发货订单的物流单号填回内部系统",
    llm=ChatBrowserUse(model='bu-2-0'),
    tools=tools,
)
await agent.run()
```

- `Agent` 默认驱动 Chromium；`Browser` 是 `BrowserSession` 的别名（同一类）
- **async Python ≥ 3.11**，入口 `asyncio.run()`
- `ChatBrowserUse` 是默认推荐——专门为浏览器任务优化，平均比通用模型快 3–5x、SOTA 准确率
- `ChatBrowserUse('openai/gpt-5.5')` / `('anthropic/claude-sonnet-4-6')` / `('google/gemini-3-pro')`——一个 `BROWSER_USE_API_KEY` 通吃多 provider
- 自定义 tools 用 `@tools.action(description=...)` 装饰器，扩展 agent 能力
- 部署用 `@sandbox` 装饰器（生产隔离）；监控用 Laminar/OpenLIT；集成用 MCP server

## cloud skill：官方云 REST/SDK

适用：扩展规模化、stealth、并发、过验证码、托管文件系统/记忆、1000+ 集成。

- **Base URL**：`https://api.browser-use.com/api/v2/`（v2，30 端点）/ `https://api.browser-use.com/api/v3`（v3，BU Agent 会话）
- **认证**：`X-Browser-Use-API-Key: <key>`；env `BROWSER_USE_API_KEY`
- **CDP 直连**：`wss://connect.browser-use.com?apiKey=KEY&proxyCountryCode=us`（可挂 Playwright/Puppeteer/Selenium）
- **SDK**：Python `uv pip install browser-use-sdk`（`from browser_use_sdk import AsyncBrowserUse`，v3 `from browser_use_sdk.v3 import AsyncBrowserUse`）；TS `npm install browser-use-sdk`（`import { BrowserUse } from "browser-use-sdk"`，v3 加 `/v3`）
- **集成形态**：chat UI（带 live view）、subagent（任务进结果出）、给已有 agent 加浏览器 tools
- 还接 n8n/Make/Zapier、1Password vault、webhooks、workspaces、skills marketplace

> 反模式：开源 Python 库（`Agent`/`Browser`/`Tools`）的问题归 `open-source` skill；cloud API/SDK/计费归 `cloud` skill——两者不要混。

## qa skill：给网站打 1–5 分

「QA test my local website」→ 输出 **1（崩）–5（完美）评分 + 证据**，不是截图堆。

按规模选策略：

| 情况 | 做法 |
| --- | --- |
| 文本模型（看不见图） | **统一走 v2 cloud agent**，每个流程一个 task，服务端 LLM 看页面回 `judge` + 1–5 `structuredOutput` |
| 有视觉 + 单流程 | 直接驱动 `browser-harness`，开销最低 |
| 有视觉 + 多流程 | fan-out 每流程一个 subagent（推荐 v2 cloud agent，并发 + 截图证据；~$0.01/task + ~$0.006/step + $0.02/hr browser） |

- **必装 browser-harness**：QA 跑在 Browser Use **云**浏览器上，不用用户本地 Chrome
- **localhost 自动 tunnel**：`localhost:5173` 这种目标要打通隧道给云浏览器
- **总要 teardown**：停掉 tunnel、停掉云浏览器（公共 URL 的 v2 task 自动关）
- 报告：每流程一行 `Score: N/5`，总分取**最弱关键路径**（不平均掩盖崩掉的流程）

## remote-browser skill：沙箱 CLI

适用：agent 跑在**无 GUI 沙箱**（云 VM/CI/coding agent），需要控 headless 浏览器。

```bash
browser-use open https://example.com && browser-use state
browser-use input 5 "user@example.com" && browser-use input 6 "pw" && browser-use click 7
```

- 流程：`open <url>` → `state`（拿元素 index）→ `click/input/type/keys` → `state`/`screenshot` 验证 → 循环 → `close`
- 浏览器模式：默认 headless Chromium；`cloud connect` 开云浏览器；`--connect` 自动发现已跑 Chrome（CDP）；`--cdp-url ws://…` 指 CDP
- **多 agent 共享**：`browser-use register` 拿 index → 每条命令带 `--connect $INDEX`；改标签的 agent 锁定该标签，其他只读
- **Tunnel**：`browser-use tunnel <port>`（Cloudflare）暴露 localhost；与 session 独立、跨 `close` 存活、幂等
- agent 会话 5 分钟不活动过期；再 `register` 拿新 index

## x402 skill：钱包付费，免 API key

x402 是 Coinbase 的协议——**不交 API key，用加密钱包按请求付费**（USDC on Base 主网），免注册/信用卡。

- **仅 SDK，无 CLI**——每步跑一段 SDK 脚本
- 两条路：**「直接用」**（终端里给 Claude Code 跑，钱包付费，写一次性脚本）／**「嵌进代码」**（装 SDK、写 key 与代码进项目）
- 账户：找到已有 `BROWSER_USE_API_KEY` → 充值到该账号；没找到 → accountless 钱包（首次付款即建项目）
- 钱包：自有/手把手/新建；私钥进 `.env` 的 `BROWSER_USE_X402_PRIVATE_KEY`，**先确保 `.env` 在 `.gitignore`**
- 测试 ~$1（`max_value=$1.5` 强制选 $1 档而非 SDK 默认 $5）；上链凭据：basescan 看 $1.000000 USDC 转出
- x402 要 **async** client，sync `BrowserUse` 在 x402 环境变量存在时不跑

## 反模式与边界

- **不要本地跑生产并发**：本地 Chrome 单实例，多 agent 抢标签/焦点——并发要云浏览器（每任务一个隔离实例）
- **不要截图找元素**：AX 树才稳，截图是兜底
- **不要绕登录墙**：开源版默认停下；要 stealth 过验证码、或用 profile 复用登录态、或用云
- **不要混淆 skill**：开源库问题（Agent/Browser/Tools）→ `open-source`；云 API/SDK → `cloud`；CLI 直控 → `browser-use`/`remote-browser`
- **不要忘 teardown**：云浏览器计费到停为止，问完「关掉吗」要真关
- **不要用 sync client 跑 x402**：x402 要 async

## 下一步

- [参考](./reference) —— skills 清单、安装、许可、关键链接
- [入门](./getting-started) —— 安装、第一个 agent、CLI vs 库
