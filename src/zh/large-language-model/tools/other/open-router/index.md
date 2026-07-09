---
layout: doc
---

# OpenRouter

**统一聚合 LLM API 的中间层平台**——通过同一个 OpenAI 兼容接口，访问 400+ 模型（Claude / GPT / Gemini / Llama / DeepSeek / Qwen / GLM / Grok ...）。一个 API key 用全市场，免去为每家厂商单独注册账号 / 维护 SDK。

对中国大陆用户尤其友好：

- 部分代理节点境内可达
- 多卡支持（信用卡 / 加密货币）
- 自动选最便宜 / 最快 provider 路由

## 评价

**优点**

- **统一 API**：OpenAI 兼容 schema，已用 OpenAI SDK 的项目改 base URL 即用
- **400+ 模型**：所有主流 + 开源模型一站接入
- **价格透明**：每个模型每个 provider 实时价格对比
- **智能路由**：可设 `provider.sort: "throughput"` / `"latency"` / `"price"` 自动选最优
- **Fallback**：主 provider 故障自动切其它，提升 SLA
- **大陆友好**：信用卡 + 加密货币 + 部分代理节点
- **免费 tier**：注册即送少量 credit，零成本试模型
- **数据隐私**：可关「training opt-in」，模型厂家无法用你的数据训练

**缺点**

- 加 10-30% 中间费（与官方 API 直接对比）
- 部分模型功能受限（如不支持 Claude MCP / Gemini 视频文件等特有特性）
- 延迟高于直连（多一跳路由）
- 不支持厂商独有 API（如 Anthropic Files API / Gemini Live）
- 部分模型 context window 略低于官方（被路由策略截断）
- 出现问题排查多一层（OpenRouter vs provider 谁错）

## 文档地址

[openrouter.ai/docs](https://openrouter.ai/docs)

## 主要资源

- [模型列表](https://openrouter.ai/models)
- [价格对比](https://openrouter.ai/models)
- [API 文档](https://openrouter.ai/docs/quickstart)
- [Privacy 设置](https://openrouter.ai/settings/privacy)
- [Activity Dashboard](https://openrouter.ai/activity)

## 推荐场景

| 场景 | OpenRouter 是否合适 |
| --- | --- |
| 个人 / 中小项目 + 大陆访问 | ✅ |
| 想对比多家模型选型 | ✅ |
| 需要 fallback / 高可用 | ✅ |
| 需要 Claude MCP / Gemini 视频 / GPT Realtime 等独有 | ❌ 用官方 |
| 企业级 SLA / 合规 | ❌ 用 Bedrock / Vertex / Azure |
| 极致价格敏感 | △（多了 10-30% 中间费） |


## 幻灯片地址

<a href="/SlideStack/open-router-slide/" target="_blank">OpenRouter</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=openrouter" target="_blank" rel="noopener noreferrer">OpenRouter 测试题</a>
