---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 browser-use/browser-use 官方仓库（MIT，主分支 2026-07）的 README 与 `skills/` 编写。

## 速查

- **装**：`uv add browser-use`（库）/ `uvx browser-use install`（CLI）；Python ≥ 3.11
- **Key**：`.env` 设 `BROWSER_USE_API_KEY`；取得 https://cloud.browser-use.com/new-api-key
- **默认 LLM**：`ChatBrowserUse(model='bu-2-0')`（官方优化，最快最省最准）
- **6 skills**：browser-use（核心/本地 CDP）·cloud（REST/SDK）·open-source（Python 库参考）·qa（1–5 评分）·remote-browser（沙箱 CLI）·x402（USDC 钱包付费）
- **许可**：MIT；服务条款与隐私见 legal 页
- **基线**：★105k；Odysseys 200 长程 web 任务 #1（87.4%）

## 6 skills 清单

| Skill | 形态 | 关键 API / 命令 |
| --- | --- | --- |
| `browser-use`（核心） | 本地 CLI（CDP） | `browser-use <<'PY'`、`page_info()`、`new_tab()`、`click_at_xy()`、`cdp()`、`js()`、`start_remote_daemon()`、`--doctor` |
| `cloud` | REST + SDK | v2 `https://api.browser-use.com/api/v2/`（30 端点）/ v3 `.../api/v3`（BU Agent 会话）；header `X-Browser-Use-API-Key`；CDP `wss://connect.browser-use.com?apiKey=KEY` |
| `open-source` | Python 库参考 | `Agent`/`Browser`(=`BrowserSession`)/`Tools`/`@sandbox`；hooks；MCP；Laminar/OpenLIT |
| `qa` | CLI + 云浏览器 | `/qa <url>` → 1–5 评分；单流程直连 / 多流程 fan-out；文本模型统一走 v2 |
| `remote-browser` | 沙箱 CLI | `open/state/click/input/type/keys/screenshot/eval`；`tunnel <port>`；`--connect`/`--cdp-url`/`--headed` |
| `x402` | SDK（无 CLI） | `browser-use-sdk[x402]`；`BROWSER_USE_X402_PRIVATE_KEY`；`max_value=$1.5`；async client |

## 安装

```bash
# 1) Python 库（推荐 uv）
uv add browser-use
# 或
pip install browser-use

# 2) CLI 形态（一次性任务交给别的 agent）
uvx browser-use install

# 3) Cloud SDK（按需）
uv pip install browser-use-sdk         # Python
npm install browser-use-sdk            # TypeScript

# 4) x402（按需）
pip install "browser-use-sdk[x402]"    # Python ≥ 3.10
npm install browser-use-sdk @x402/fetch @x402/evm viem   # TS

# 5) browser-harness（qa skill 必装）
uv tool install "git+https://github.com/browser-use/browser-harness"
```

`.env`：

```bash
BROWSER_USE_API_KEY=...                # ChatBrowserUse + 云
BROWSER_USE_X402_PRIVATE_KEY=...       # 仅 x402
# 或自带 provider key：
# OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY
```

## 核心 API 速查

```python
from browser_use import Agent, Browser, BrowserSession, ChatBrowserUse, Tools

# 基本用法
agent = Agent(task=..., llm=ChatBrowserUse(model='bu-2-0'))
history = await agent.run()              # → AgentHistoryList

# 自定义 tools
tools = Tools()
@tools.action(description='查内部 API')
def fetch_order(order_id: str) -> str:
    return ...

agent = Agent(task=..., llm=llm, tools=tools)

# ChatBrowserUse 通吃多 provider
ChatBrowserUse(model='openai/gpt-5.5')
ChatBrowserUse(model='anthropic/claude-sonnet-4-6')
ChatBrowserUse(model='google/gemini-3-pro')
```

## CLI 速查（核心 skill）

```bash
browser-use <<'PY'               # heredoc 喂 Python（helpers 已预导入）
print(page_info())
PY

browser-use --doctor             # 连不上先跑诊断
browser-use auth login           # 云登录
browser-use recordings enable    # 本地后台录制
```

## Cloud SDK 速查

```python
# v3 BU Agent（异步，推荐）
from browser_use_sdk.v3 import AsyncBrowserUse
client = AsyncBrowserUse(api_key=os.environ["BROWSER_USE_API_KEY"])
result = await client.run(task="...")
print(result.output)
```

```typescript
// TypeScript v3
import { BrowserUse } from "browser-use-sdk/v3";
const client = new BrowserUse();
const result = await client.run({ task: "..." });
```

## x402 速查

```python
# 强制 $1 测试（而非 SDK 默认 $5）
async with x402HttpxClient(client, max_value=Decimal("1.5"), timeout=180.0) as http:
    resp = await http.post("https://x402.api.browser-use.com/api/v3/sessions",
                           json={"task": "Go to example.com and tell me the heading text."})
```

- USDC on Base 合约：`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base RPC：`https://mainnet.base.org`；浏览器：https://basescan.org
- 路径 A（直接用）写一次性脚本到 `/tmp`、跑完删；路径 B（嵌进项目）按语言加 client

## 基准与表现

- **BU Bench V1**：100 真实 web 任务，全开源于 [browser-use/benchmark](https://github.com/browser-use/benchmark)
- **Odysseys**：200 长程 web 任务，**#1 平均 87.4%**，领先 OpenAI/Anthropic/Google/Microsoft computer-use agent

## 许可与引用

- **License**：MIT（开源库）；服务条款见 https://browser-use.com/legal/terms-of-service
- **Citation**：`Müller, Magnus and Žunič, Gregor. Browser Use: Enable AI to control your browser. 2024.`

## 关键链接

- 文档（开源）：https://docs.browser-use.com/open-source/introduction
- Cloud 文档：https://docs.cloud.browser-use.com
- GitHub：https://github.com/browser-use/browser-use
- Cloud 控制台：https://cloud.browser-use.com
- 新建 API key：https://cloud.browser-use.com/new-api-key
- Benchmark：https://github.com/browser-use/benchmark
- Odysseys 排行：https://odysseysbench.com/leaderboard
- x402 用户文档：https://docs.browser-use.com/cloud/guides/x402
- browser-harness：https://github.com/browser-use/browser-harness
