---
layout: doc
---

# Grok

xAI 推出的大语言模型家族，主打**实时搜索（X 平台 + Web）+ 多智能体（Heavy 架构）+ Imagine 图像视频生成 + 不羁风格**。当前主力 Grok 4.5 / 4.3 / 4.20 系列，完全兼容 OpenAI SDK，base_url 指向 `https://api.x.ai/v1` 即可零迁移接入。

::: tip 与 Claude / GPT / Gemini 对比的核心差异

- **Grok 独占 X 平台实时数据**：内置 X Search 工具直接搜推文（keyword/semantic/user/thread 4 种搜索）
- **Grok 独占多智能体 Heavy 架构**：`grok-4.20-multi-agent-0309` 原生支持多 agent 并行思考-辩论-共识
- **Grok 兼容 OpenAI SDK 零迁移**：仅改 base_url=`https://api.x.ai/v1` + api_key，现有 openai 库代码全可复用
- **Grok 风格不羁**：训练时保留 "rebellious streak"，回答 "spicy questions" 更少 guardrail
- **Claude 强在编码 / Agent / MCP**
- **GPT 强在多模态全栈（Realtime API）/ Structured Output strict**
- **Gemini 强在超长上下文 / 原生视频音频 / Implicit Cache**

:::

## 评价

**优点**

- **OpenAI SDK 完全兼容**：复用现有 openai 库代码，base_url 一行切换，跨厂商 A/B 对比成本极低
- **实时搜索原生集成**：Chat Completions 内置 `search_parameters`（mode: off/on/auto + sources: ['web','x']），无需自建 RAG
- **X 平台独家数据源**：可抓 verified 用户推文 + thread + 用户时间线，时效性领先所有闭源模型
- **多智能体 Heavy 架构**：`grok-4.20-multi-agent-0309` 原生多 agent 并行推理，效果优于手工 orchestrate
- **Imagine 图像/视频生成**：`grok-imagine-image` $0.02/张、`grok-imagine-video` $0.05/sec，一站式多模态
- **Prompt 缓存大幅省钱**：cached input 仅 $0.30 vs 标准 $2.00（grok-4.5），省 85%
- **成本透明精细**：响应 usage 含 `cost_in_usd_ticks`（10^10 ticks/美元）和 `num_sources_used`
- **GPQA Diamond 88%**：Grok 4 Heavy 在 GPQA Diamond 取 88% 优于 Gemini 2.5 Pro 的 84%

**缺点**

- **风格不可控**：rebellious streak 训练偏不羁，业务场景需用 system prompt 强约束，与 ChatGPT prompt 不互通
- **Fun Mode 已移除**：2024-12 已下线，当前 API 无对应开关，靠 system prompt 模拟
- **X 数据真实性**：verified 用户传谣也曾被采纳（伊朗打以色列假新闻事件），需 `return_citations` + 人工核查
- **知识 cutoff**：grok-4.5 截止 2026-02-01，实时信息必须显式启用搜索
- **部分参数不支持**：grok-4.20+ 不支持 logprobs；logit_bias 全系不支持；推理模型不支持 frequency/presence_penalty
- **价格阶梯翻倍**：prompt ≥200k 时全量 token 翻倍（grok-4.5 从 $2/$6 跳到 $4/$12）
- **大陆不可直连**：需 OpenRouter / 代理 / 自建网关
- **政治立场非营销宣称**：独立测试显示其早期回答偏左翼自由意志主义，与 Musk 营销话术相反，业务场景勿依赖其立场

## 文档地址

[docs.x.ai](https://docs.x.ai/) （开发者文档） / [console.x.ai](https://console.x.ai/)（API 控制台） / [x.ai](https://x.ai/)（官网）

## 主力模型列表（2026-07）

| 模型 | 上下文 | 输出 | 用途 |
| --- | --- | --- | --- |
| `grok-4.5` | 500K | 128K | 旗舰，coding / agentic / knowledge work |
| `grok-4.3` | 1M | 128K | 长上下文成本敏感场景，reasoning 可调 |
| `grok-4.20-0309-reasoning` | 1M | 128K | 推理专用 |
| `grok-4.20-0309-non-reasoning` | 1M | 128K | 高并发快速响应 |
| `grok-build-0.1` | 256K | 128K | 编码专用（Grok Build CLI） |
| `grok-4.20-multi-agent-0309` | 1M | 128K | 多智能体 Heavy 架构 |
| `grok-imagine-image` | - | - | 图像生成（$0.02/张） |
| `grok-imagine-image-quality` | - | - | 高质量图像（$0.05/张） |
| `grok-imagine-video` | - | - | 视频生成（$0.05/sec） |
| `grok-imagine-video-1.5` | - | - | 视频生成升级版（$0.08/sec） |

别名规则：`<name>`（最新稳定）/ `<name>-latest`（含最新功能）/ `<name>-<date>`（锁定版本不更新）。**生产环境锁 `<name>-<date>`** 防回归。

## 访问方式

| 方式 | 适合 |
| --- | --- |
| **xAI API（api.x.ai）** | 开发者首选，OpenAI SDK 兼容 |
| **Grok App（grok.com / X 内嵌）** | 聊天客户端，SuperGrok / Premium+ 订阅 |
| **OpenRouter / Vercel AI SDK / Cloudflare AI Gateway** | 多厂商对比 / 大陆代理 |
| **Cursor / Grok Build CLI / Office 插件** | 编码工作流（grok-build-0.1） |

## 推荐资源

- [xAI 官方文档](https://docs.x.ai/)
- [xAI API 快速上手](https://docs.x.ai/developers/quickstart)
- [xAI 模型列表](https://docs.x.ai/developers/models)
- [Chat Completions API Reference](https://docs.x.ai/developers/rest-api-reference/inference/chat)
- [X Search 文档](https://docs.x.ai/developers/tools/x-search)
- [Web Search 文档](https://docs.x.ai/developers/tools/web-search)
- [定价](https://docs.x.ai/developers/pricing)

## 演进时间线

| 模型 | 时间 | 主要变化 |
| --- | --- | --- |
| Grok-1 | 2023-11 | 首发，314B MoE，2024-03 开源 |
| Grok-1.5 | 2024-05 | 128K 上下文 |
| Grok-2 | 2024-08 | 130K + Flux 图像生成 |
| Grok-3 | 2025-02 | 1M 上下文 + Think 推理模式，2025-04 上 API |
| Grok-4 / 4 Heavy | 2025-07 | 多智能体并行推理 / native tool use / real-time search |
| Grok-4.3 / 4.5 | 2026 | 旗舰升级，coding / agentic 主打 |

## 幻灯片地址

<a href="/SlideStack/grok-slide/" target="_blank">Grok</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Grok 测试题</a>
