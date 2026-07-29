---
layout: doc
---

# 基础提示设计

基础提示设计是**与 LLM 交互的「提示侧」基础工程**——它把「求模型办件事」这件自然语言动作，拆成可复用、可版本化、可观测的结构化制品。它覆盖四块核心：**提示范式**（Zero-shot / Few-shot / Chain-of-Thought / 角色设定）、**消息结构**（developer / user / assistant 三态与 system prompt）、**结构化输出**（JSON Mode → Structured Outputs → Function Calling 的三层演进）、**Token 经济与模板工程**（prompt caching、上下文窗口、代码内版本化提示）。OpenAI 与 Anthropic 两家官方指南在底层逻辑上一致——**清晰、具体、有结构、用例子说话**——但在落地 API 上各有偏好：OpenAI 把格式约束下沉为 `response_format` / `tool strict` 等强类型参数，Anthropic 推崇 XML 标签划定逻辑边界与 prompt caching 的细粒度控制。本主题是 Prompt Engineering 的最权威统一入口，后续 RAG / Agent / 多模态等高级主题都建立在这些基础之上。当前（2026-07）两家趋势一致：从「手写自然语言约束」走向「结构化 API 参数（strict / adaptive thinking / cache_control）下沉控制」。

## 评价

**优点**

- **杠杆比最高**：同一模型，提示从模糊改到清晰，效果提升常常大过换一代模型——是性价比最高的工程手段
- **可版本化**：提示放进代码模块、过 code review 与测试，配合 feature flag 灰度，能走正常 CI/CD 流程
- **结构化输出可靠**：`strict: true` 把 schema 校验下沉到解码层，可靠性接近 100%，省掉重试与 parse 兜底
- **可缓存省钱**：稳定前缀打 `cache_control` 断点，多轮对话 / 批处理可省 80–92% 输入费用
- **跨模型迁移性强**：四段式（Identity → Instructions → Examples → Context）+ XML 标签的结构，在两家厂商模型上都基本通用
- **降本增效组合拳**：Zero-shot 优先 → 不足加 Few-shot → 仍不行才 fine-tuning，避免无谓消耗上下文

**缺点**

- **效果不稳定**：同一提示在不同模型、不同温度、不同上下文长度下表现差异巨大，需要 A/B 测试
- **手写约束会被违反**：纯自然语言写「You MUST return JSON」总会有少量响应不合规，必须配合 Structured Outputs
- **Token 计量容易失控**：长 system prompt 不打 cache、CoT 无限拉长、把已知参数交给模型瞎填，账单会失控
- **厂商 API 演进快**：OpenAI 已弃用 Saved Prompts（2026-11-30 关停）、`role: 'system'` 改为 `developer`；Anthropic 的 `budget_tokens` 在 4.6 deprecated、4.7+ 直接 400——提示工程师必须持续跟版本
- **过拟合陷阱**：堆几十个相似 Few-shot 示例，模型会学到表面模式（如统一的开头词）而非任务本质
- **反懒人提示翻车**：把「CRITICAL: You MUST...」这种激进措辞搬给 4.6+ 模型，会从「触发不足」翻转为「过度触发」

## 文档地址

- [OpenAI Prompt Engineering Guide](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [OpenAI Structured Outputs Guide](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI Function Calling Guide](https://developers.openai.com/api/docs/guides/function-calling)
- [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Anthropic Extended Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

## 幻灯片地址

<a href="/SlideStack/basic-prompt-design-slide/" target="_blank">基础提示设计</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">基础提示设计 测试题</a>
