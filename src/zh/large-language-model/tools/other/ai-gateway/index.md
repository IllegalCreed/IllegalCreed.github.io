---
layout: doc
---

# AI 网关

**统一管理多模型 API 调用的中间层**——在应用与各家 LLM 厂商（OpenAI / Anthropic / Google / Bedrock / Vertex / 自建模型）之间架一层代理，把「多模型接入、负载均衡、fallback、重试、可观测、成本控制、缓存」等横切关注点集中处理。应用只对接网关一个 endpoint，不再为每家厂商单独写适配代码。

与 OpenRouter 的边界：OpenRouter 是**托管 SaaS 聚合层**（自带模型供应 + 加价转售，详见 OpenRouter 叶子）。本叶讲**自建/可控的网关层**——你用自己的各家 API key，网关只做路由与治理，不赚模型差价。LiteLLM、Portkey、Helicone 是这一类。

主流选手分三类：

- **开源自建**：LiteLLM（Python，最流行，6 种路由策略）、Helicone（可观测为主）
- **商业网关**：Portkey（企业级控制面，SaaS + 自托管）、Helicone（OSS + SaaS）
- **聚合 SaaS**：OpenRouter（属另一类，见专叶，本叶作为对比项提及）

核心能力清单：Proxy 模式（透明转发 OpenAI 兼容请求）、负载均衡（多 deployment 分流）、fallback（主模型故障自动切备）、retry（指数退避）、可观测（日志/成本/延迟监控）、缓存（语义/精确）、限流、Guardrails。

## 评价

**优点**

- **统一接入**：一个 SDK 接 100+ 模型，换模型只改配置不改代码
- **高可用**：fallback + retry 让单家故障不影响业务
- **负载均衡**：多 deployment / 多 key 轮询，突破单 key 速率限制
- **成本可控**：统一记账、按 team/project 分摊、预算告警
- **可观测**：每次调用的 token / 延迟 / 成本 / 错误全记录
- **缓存省钱**：相同请求命中缓存，长 prompt 场景节省显著
- **解耦厂商**：模型迭代或下线时，网关层切换应用无感

**缺点**

- **多一跳延迟**：所有请求经网关，增加几毫秒到几十毫秒
- **运维负担**：自建网关要部署、监控、升级、高可用保障
- **功能受限**：部分厂商独有特性（如 Claude MCP / Gemini Files）网关不一定透传
- **调试更复杂**：出错要分清是网关还是上游厂商的问题
- **缓存风险**：缓存命中错的数据（如时间敏感查询）需谨慎配置
- **选型成本**：LiteLLM / Portkey / Helicone 各有侧重，选错迁移成本高

## 文档地址

- LiteLLM：[docs.litellm.ai](https://docs.litellm.ai/docs/proxy/quick_start)
- Portkey：[docs.portkey.ai](https://docs.portkey.ai)
- Helicone：[docs.helicone.ai](https://docs.helicone.ai)
- OpenRouter（对比项）：[openrouter.ai/docs](https://openrouter.ai/docs)

## GitHub地址

- LiteLLM：[BerriAI/litellm](https://github.com/BerriAI/litellm)
- Helicone：[Helicone/helicone](https://github.com/Helicone/helicone)
- Portkey Gateway（开源核心）：[Portkey-AI/gateway](https://github.com/Portkey-AI/gateway)

## 幻灯片地址

<a href="/SlideStack/ai-gateway-slide/" target="_blank">AI 网关</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ai-gateway" target="_blank" rel="noopener noreferrer">AI 网关测试题</a>
