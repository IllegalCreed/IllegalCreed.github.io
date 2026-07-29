---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenAI Prompt Engineering Guide（developers.openai.com）+ Anthropic Prompting Best Practices（platform.claude.com）编写，对照 2026-07 官方文档

## 速查

- **总入口策略**：先 **Zero-shot** 直接下指令 → 效果不足加 **Few-shot（3–5 个示例）** → 仍不行才 fine-tuning
- **四段式结构**：Identity（角色/目标）→ Instructions（规则/禁令）→ Examples（示例）→ Context（数据）
- **消息角色三态**：OpenAI `developer` / `user` / `assistant`（developer 取代 legacy `system`）；Anthropic `system` / `user` / `assistant`
- **角色权威层级**：`developer`（或 `system`）> `user` > `assistant`——把规则抬到最高层能提高遵守度
- **三种 CoT**：Zero-shot CoT（"Let's think step by step"）/ Few-shot CoT（示例带推理）/ 模型内建 reasoning + Extended Thinking
- **结构化输出三层演进**：JSON Mode（仅合法 JSON）→ Structured Outputs（`json_schema` + `strict: true`，schema 校验）→ Function Calling（`tools` + `tool_choice`，触发外部动作）
- **Token 估算**：1 token ≈ 4 字符 / 0.75 英文词；中文每字约 1–2 token；上下文窗口 ~100K 到 1M 不等
- **Prompt Caching**：稳定前缀打 `cache_control` 断点，读 0.1× / 写 1.25×（5min TTL），多轮场景省 80–92%
- **Anthropic 黄金法则**：把提示给一个零背景同事看，他若困惑模型也会困惑——清晰具体优于模糊强求

## 提示工程的核心心智

提示工程的本质是**用自然语言给模型下「规格说明」**——和给同事写需求文档没本质区别。OpenAI 与 Anthropic 官方指南都把这条原则放在最前面：

- **清晰直接**：把任务、输入、输出格式、约束写具体，不要让模型「猜」你的隐性预期
- **加上下文**：相关数据、领域知识、边界条件，越具体越好
- **用例子说话**：3–5 个多样、覆盖边界的示例，比写一堆规则更有效
- **结构化**：用 Markdown 标题、XML 标签把「这是什么」标清楚
- **自检**：让模型在出答案前先 `verify against [test criteria]`

> Anthropic 黄金法则：**把提示给一个零背景同事看，他若困惑模型也会困惑。**

## 提示范式：从 Zero-shot 到 CoT

### Zero-shot：什么都不给

**定义**：不提供任何示例，仅靠任务描述触发模型预训练知识。

```text
请把下面这句话翻译成英文：
今天天气真好。
```

**适用**：通用任务（翻译、改写、分类、总结），模型预训练阶段已见过大量同类样本。

> OpenAI GPT-5 系列宣称「no examples needed」的零到一能力——简单任务默认 Zero-shot 就够。

### Few-shot：给 3–5 个示例

**定义**：在 developer / system / user 消息内提供 3–5 个输入/输出示例，让模型从示例中学习任务模式。

```text
请把单词分类为「水果」或「蔬菜」：

苹果 → 水果
胡萝卜 → 蔬菜
香蕉 → 水果
土豆 →
```

**适用**：格式迁移、风格对齐、边缘情况——示例是迁移任务格式最稳的杠杆。

**Anthropic 推荐**：用 `<example>` / `<examples>` 标签包裹示例，让模型明确「这是例子，不是新指令」。

### Chain-of-Thought（CoT）：分步推理

**三种实现形态**：

| 形态 | 做法 | 适用 |
| --- | --- | --- |
| **Zero-shot CoT** | 在 prompt 末尾追加「Let's think step by step」 | 通用触发 |
| **Few-shot CoT** | 示例里带推理过程 | 推理范式迁移 |
| **Extended Thinking** | API 参数 `thinking`（Anthropic）或推理模型（OpenAI o-series） | 复杂多步推理 |

**适用**：数学、代码、多跳问答、逻辑推理——分步推理显著降低错误率。

**反模式**：简单分类任务别加 CoT——徒增 token、降低吞吐。

> 4.7+ 模型应使用 `thinking: {type: 'adaptive'}` + `output_config: {effort: 'low/medium/high'}`，旧版 `budget_tokens` 已 deprecated。

## 角色设定与 System Prompt

角色设定（System Prompt）是**给模型套上一层「人格 / 行为框架」**——它定义模型在整个对话中的 tone、视角、约束。

**OpenAI 写法**：用 `role: 'developer'`（取代 legacy `system'`）消息，或 Responses API 的 `instructions` 参数。

```text
你是「车险理赔审核专家」，拥有 10 年经验。
你的工作：审阅用户提交的理赔材料，输出是否赔付 + 理由。
约束：只基于用户提供的材料，不可臆造事实。
```

**Anthropic 写法**：顶层 `system` 参数（可传字符串或 content blocks 数组）。

> 角色设定的本质是**提高 developer/system 消息的权威层级**，把规则从 user 层抬到最高层，模型遵守度显著提高。OpenAI 明确：`instructions` 参数只对当次响应生效、不跨 `previous_response_id` 持久化。

## 结构化提示：四段式 + XML 标签

Anthropic 实测：在多段混合提示里，模型容易混淆「指令 vs 上下文」。XML 标签把「这是什么」标清楚，可显著降低误解。

```xml
<identity>你是一位资深数据分析师。</identity>

<instructions>
请基于下方数据回答问题。规则：
1. 数字四舍五入到 2 位小数
2. 缺失值显示为 N/A
</instructions>

<examples>
<example>
<input>Q1 销售额？</input>
<output>1234.56 万元</output>
</example>
</examples>

<context>
Q1 销售额 1234.555 万、Q2 2345.6 万、用户数 80 万。
</context>

<question>Q1 销售额是多少？人均销售额是多少？</question>
```

**OpenAI 等价方案**：Markdown 标题 + 列表，配合 `Identity → Instructions → Examples → Context` 四段式布局。两家方案可互换，但 XML 边界更明确。

## Token 经济基础

| 概念 | 数值 |
| --- | --- |
| 1 token | ≈ 4 字符 / 0.75 英文词 |
| 中文每字 | 约 1–2 token |
| 上下文窗口 | ~100K（GPT-4o）/ 200K（Claude）/ 1M（GPT-4.1） |
| Prompt Caching 读 | 0.1× 基础价（5min TTL） |
| Prompt Caching 写 | 1.25×（5min）/ 2×（1h） |
| Cache 断点上限 | 4 个 |
| 最低可缓存 token | 512 ~ 4096（因模型而异） |

**核心反模式**：长 system prompt 每次重发不计 cache、CoT 无限拉长、把已知参数交给模型瞎填——账单会失控。

**最佳实践**：稳定前缀置顶打 cache、长文档数据置顶 + 提问置尾（Anthropic 实测可提升 ~30%）、简单任务关闭 thinking、已知值应用层注入而非让模型生成。

## 下一步

- [核心范式与结构化输出](./guide-line.md)：四种范式深度对比、Structured Outputs 与 Function Calling 三层演进、消息角色层级、Token 经济实战、反模式
- [参考](./reference.md)：完整 API 参数表、版本变化、官方资源、迁移指南
