---
layout: doc
outline: [2, 3]
---

# 核心范式与结构化输出

> 基于 OpenAI Prompt Engineering / Structured Outputs / Function Calling 三份官方指南 + Anthropic Prompting Best Practices / Extended Thinking / Prompt Caching 三份官方指南编写，对照 2026-07 文档

## 速查

- **范式升级链**：Zero-shot → 不足加 Few-shot（3–5 个多样示例）→ 仍不行才 fine-tune
- **四段式结构**：Identity → Instructions → Examples → Context；XML 标签 `<instructions>` / `<context>` / `<example>` / `<documents>` 划边界
- **消息角色层级**：OpenAI `developer > user > assistant`（developer 取代 legacy system）；Anthropic `system > user > assistant`
- **三种 CoT**：Zero-shot CoT 触发短语 / Few-shot CoT 示例带推理 / Extended Thinking（adaptive + effort）
- **结构化输出三层**：JSON Mode（仅合法 JSON）< Structured Outputs（schema 校验，strict:true）< Function Calling（触发外部动作）
- **Structured Outputs 硬限制**：`additionalProperties:false`、所有 key 入 `required`、≤100 属性、首 8192 输出 token 内生效、`$ref` 支持递归
- **Function Calling**：`tool_choice` 四种值（auto / required / none / specific）；`strict:true` 内部走 Structured Outputs；初始工具 ≤ 20 个
- **Anthropic thinking 迁移**：`budget_tokens` 4.6 deprecated / 4.7+ 报 400 → 改用 `thinking:{type:adaptive}` + `output_config:{effort}`
- **Prompt Caching**：`cache_control:{type:ephemeral, ttl:'1h'}`；读 0.1× / 写 1.25×；4 断点上限
- **上下文布局**：长文档「数据置顶 + 提问置尾」可提升 ~30%；让模型先 `<quotes>` 引用再作答
- **反模式**：禁止式提示 / 靠自然语言强制 JSON / 过载 Few-shot / 滥用 budget_tokens / 忽略 token 经济 / 混合 Saved Prompts 对象

## 四种提示范式深度对比

### Zero-shot：直接下指令

**定义**：不提供任何示例，仅靠任务描述触发模型预训练知识。

**何时用**：模型预训练阶段已见过大量同类样本的通用任务——翻译、改写、分类、总结、问答。GPT-5 系列 / Claude 4.x / Sonnet 5 等现代模型在 Zero-shot 上能力极强。

**关键技巧**：

- **明确输出格式**：写清「输出一段话 / 列表 / JSON / 表格」
- **明确步骤顺序**：复杂任务可显式列出「第一步... 第二步...」
- **明确约束**：长度、风格、禁用词、目标读者

> Anthropic：想要「超越基础」的效果就显式说「include as many relevant features as possible」——模型不会从模糊提示推断你的隐性预期。

### Few-shot：示例驱动

**定义**：在 prompt 中提供 3–5 个输入/输出示例，让模型从示例中学习任务模式。

**示例数量**：Anthropic 推荐 **3–5 个**——少了不够、多了过拟合。OpenAI 类似建议「few but diverse」。

**示例质量原则**：

- **多样性**：覆盖任务边界（最长 / 最短 / 边缘情况 / 反例）
- **一致性**：所有示例格式严格统一（同样的字段顺序、同样的标点）
- **代表性**：示例应反映真实输入分布，不要全是简单情况
- **不重复**：示例之间应有差异，避免模型学到「统一的开头词」这种表面模式

**包裹方式**：

- Anthropic：`<examples><example>...</example></examples>`
- OpenAI：Markdown 列表或代码块，配合 `Examples:` 段标题

> 过载 Few-shot（堆几十个相似示例）会让模型过拟合到表面模式。Anthropic 实测 3–5 个高质量示例优于 20 个相似示例。

### Chain-of-Thought：分步推理

**三种实现形态**：

| 形态 | 触发方式 | 适用场景 |
| --- | --- | --- |
| **Zero-shot CoT** | prompt 末尾追加「Let's think step by step」 | 通用触发，所有模型可用 |
| **Few-shot CoT** | 示例里带推理过程 | 推理范式迁移（让模型模仿推理步骤） |
| **Extended Thinking** | API 参数 `thinking`（Anthropic）或推理模型（OpenAI o-series） | 复杂多步推理、数学、代码生成 |

**Anthropic Extended Thinking 演进**：

- 旧版：`thinking: {type: 'enabled', budget_tokens: N}`——4.6 deprecated、4.7+ 直接返回 400
- 新版：`thinking: {type: 'adaptive'}` + `output_config: {effort: 'low'|'medium'|'high'}`
- `budget_tokens` 最小 1024、必须小于 `max_tokens`

**何时用 CoT**：数学、代码、多跳问答、逻辑推理、复杂规则判断。

**反模式**：

- 给 Adaptive Thinking 模型写「第一步... 第二步...」的死板推理脚本——会限制模型自身推理能力，Anthropic 实测「think thoroughly」这类通用指令往往优于人工步骤
- 在 Opus 4.5 上用「think」字眼——会触发非预期行为，改用「consider / evaluate / reason through」
- 简单分类任务加 CoT——徒增 token、降低吞吐

> Anthropic 自检技巧：让模型在出答案前先「verify your answer against [test criteria]」——对代码与数学尤其有效。

### 角色设定（System Prompt）

**OpenAI 写法**：用 `role: 'developer'` 消息（取代 legacy `system'`），或 Responses API 的 `instructions` 参数。

**Anthropic 写法**：顶层 `system` 参数（可传字符串或 content blocks 数组）。

**核心原则**：

- 角色设定承载**全局规则**：tone、视角、不可违反的约束、few-shot 示例
- 用户输入放 `user` 消息
- 消息角色权威层级递减：`developer > user > assistant`——把规则抬到 developer 层能提高遵守度

**OpenAI 注意**：`instructions` 参数只对当次响应生效、不跨 `previous_response_id` 持久化——需要在每次请求里重传。

## 消息结构：四段式 + XML 标签

Anthropic 实测：在多段混合提示里，模型容易混淆「指令 vs 上下文」。XML 标签把「这是什么」标清楚，可显著降低误解。

### 四段式布局

```xml
<identity>你是「车险理赔审核专家」，10 年经验。</identity>

<instructions>
请审阅用户提交的理赔材料，输出是否赔付 + 理由。
规则：
1. 只基于用户提供的材料，不可臆造事实
2. 赔付金额四舍五入到 2 位小数
</instructions>

<examples>
<example>
<input>事故：追尾，我方全责，维修费 5000 元。</input>
<output>赔付。金额：5000.00 元。理由：我方全责，全赔。</output>
</example>
<example>
<input>事故：对方闯红灯撞我，无责。</input>
<output>不赔付。理由：我方无责，应由对方保险公司赔付。</output>
</example>
</examples>

<context>
<document index="1">客户提交：事故 2026-07-15，追尾，我方全责，维修费 5000.55 元。</document>
</context>

<question>是否赔付？赔付多少？</question>
```

### Anthropic 推荐标签

| 标签 | 用途 |
| --- | --- |
| `<instructions>` | 任务指令与规则 |
| `<context>` | 背景数据 |
| `<example>` / `<examples>` | 示例 |
| `<documents>` / `<document index="n">` | 长文档集合 |
| `<quotes>` | 让模型先引用相关片段再作答 |
| `<thinking>` / `<answer>` | 分离思考与答案 |

### OpenAI 等价方案

Markdown 标题 + 列表，配合 `Identity` / `Instructions` / `Examples` / `Context` 段标题——两家方案可互换，但 XML 边界更明确。

### 长文档布局

**核心原则**（Anthropic 实测）：

- **数据置顶**：把 20K+ token 的文档放在提示最前面
- **提问置尾**：把问题和示例放在最后——可提升质量最高 **30%**
- **引用锚定**：先让模型 `<quotes>` 引用相关片段再作答，能聚焦关键内容减少幻觉

## 结构化输出：三层演进

### Layer 1：JSON Mode（最弱，仅向后兼容）

**写法**：`response_format: {type: 'json_object'}`。

**保证**：响应是**合法 JSON**——但**不保证 schema**。

**适用**：legacy 兼容；新项目不要用。

> 已被 Structured Outputs 取代。

### Layer 2：Structured Outputs（强 schema 校验）

**写法**（Chat Completions）：`response_format: {type: 'json_schema', json_schema: {name: 'xxx', strict: true, schema: {...}}}`。

**写法**（Responses API）：`text.format: {type: 'json_schema', name, strict, schema}`。

**关键约束**（`strict: true` 必填）：

- `additionalProperties: false`——所有对象强制
- 所有 key 必须出现在 `required` 数组里
- ≤ 100 个属性
- 首 8192 输出 token 内生效
- 支持 `$ref` 递归 schema（如树形结构）

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "math_reasoning",
    "strict": true,
    "schema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "steps": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "explanation": {"type": "string"},
              "output": {"type": "string"}
            },
            "required": ["explanation", "output"]
          }
        },
        "final_answer": {"type": "string"}
      },
      "required": ["steps", "final_answer"]
    }
  }
}
```

**可靠性**：接近 100%——把 schema 校验下沉到解码层，省掉重试逻辑与 parse 兜底。

### Layer 3：Function Calling（触发外部动作）

**写法**：`tools` 数组 + `tool_choice` 参数。

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "strict": true,
        "parameters": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "location": {"type": "string"}
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**tool_choice 四种值**：

| 值 | 含义 |
| --- | --- |
| `auto`（默认） | 模型自主决定是否调用 |
| `required` | 强制必须调用某个工具 |
| `none` | 禁止调用任何工具 |
| 指定 function | 强制调用某个具体函数 `{type:'function', function:{name:'xxx'}}` |

**parallel_tool_calls**：`true` / `false`——控制单轮是否并行多函数调用。

**响应结构**：每个 `tool_calls` 含 `id` / `function.name` / `function.arguments`（JSON 字符串）。执行后用 `role: 'tool'` + `tool_call_id` 回传结果。

**关键关系**：`strict: true` 内部走 Structured Outputs——参数校验同样可靠。

**最佳实践**：

- `description` 写清「何时用」——模型靠这个判断选择
- `parameters` 用 `enum` 让「非法状态不可表达」
- 开 `strict: true`
- 初始暴露工具不超过 ~20 个，多了用 `tool_search`（gpt-5.4+）延迟检索

## Token 经济与 Prompt Caching

### Prompt Caching（Anthropic）

**写法**：在 tools / system / messages 的 content block 上加 `cache_control`。

```json
{
  "model": "claude-opus-5-...",
  "system": [
    {
      "type": "text",
      "text": "你是数据分析师。规则：...（很长的稳定前缀）",
      "cache_control": {"type": "ephemeral", "ttl": "1h"}
    }
  ],
  "messages": [...]
}
```

**TTL 两种**：

- `5min`（默认）：读 0.1×、写 1.25×
- `1h`（beta，`ttl: '1h'`）：读 0.1×、写 2×

**断点上限**：4 个——合理切分稳定段与变化段。

**最低可缓存 token**：512 ~ 4096（因模型而异），低于阈值不缓存。

**usage 字段追踪**：

- `input_tokens`：未缓存的新输入
- `cache_read_input_tokens`：命中缓存的输入（0.1× 计费）
- `cache_creation_input_tokens`：写入缓存的输入（1.25× 或 2× 计费）
- `output_tokens_details.reasoning_tokens`：thinking 消耗

> 总输入 = `cache_read_input_tokens` + `cache_creation_input_tokens` + `input_tokens`。

### 长上下文布局

**核心反模式**：把已知参数交给模型瞎填——应用层注入更省 token、更可靠。

**最佳实践**：

- **稳定前缀置顶**：system / tool 定义 / 长文档放在请求最前面，打 cache_control 断点
- **数据置顶 + 提问置尾**：长文档任务把数据放顶部、问题放底部（提升 ~30%）
- **简单任务关 thinking**：分类、改写等不需要推理的任务关闭 thinking 省 token
- **预热缓存**：`max_tokens: 0` 跑一次空响应，把前缀写入缓存（5min 内有效）

### Prompt 模板工程

**OpenAI 主张**：用代码内 `prompt builder` 模块——类型化函数参数 + schema 注入动态值。

```ts
// prompts/classify.ts —— 代码内 prompt builder
import type { ClassifySchema } from "../schemas/classify";

export function buildClassifyPrompt(text: string): {system: string; user: string} {
  return {
    system: "你是文本分类器。输出 JSON：{category: 'A'|'B'|'C', confidence: 0-1}",
    user: text,
  };
}
```

**优势**：

- 过 code review、走 CI/CD
- 配合 feature flag 灰度
- diff、回滚正常化
- 能利用 prompt caching 把稳定前缀放在请求体最前

**Anthropic 等价方案**：XML + 变量占位（如 `{{PATIENT_SYMPTOMS}}`），应用层做字符串替换。

**反模式**：还在用 OpenAI 的 `v1/prompts` 可复用对象——2026-06-03 起弃用、2026-11-30 关停，且无法走 code review。

## 反模式（避坑）

- **禁止式提示**：用「Do not use markdown」/「NEVER use ellipses」这种否定式约束——模型对「不要做什么」的服从度低于「要做什么」。改为正向描述或解释原因（如「会被 TTS 引擎读取」）
- **靠自然语言强制 JSON schema**：用「You MUST return JSON with fields name, age」代替 Structured Outputs——总会有少量响应违反约束导致 parse 崩溃
- **过载 Few-shot**：堆几十个相似示例或缺乏多样性——会过拟合到表面模式。Anthropic 建议 3–5 个、覆盖边界、足够多样
- **Prefill 续写依赖**：在最后一条 assistant 消息里塞「`{`」强制 JSON 开头——Claude 4.6+/Mythos 已不支持并返回 400；应迁移到 Structured Outputs
- **滥用 budget_tokens 硬上限**：4.7+ 模型设 `thinking:{type:enabled, budget_tokens}` 直接 400；应迁到 adaptive thinking + output_config.effort
- **手写 CoT 步骤清单**：给 Adaptive Thinking 模型写「第一步... 第二步...」的死板推理脚本——会限制模型自身推理能力
- **在 Opus 4.5 上用「think」字眼**：会触发非预期行为——改用「consider / evaluate / reason through」
- **过度反懒人提示**：把「CRITICAL: You MUST use this tool when...」搬给 4.6+ 模型——会从「触发不足」翻转为「过度触发」
- **忽略 token 经济**：长 system prompt 每次重发不计 cache、CoT 无限拉长、把已知参数交给模型瞎填——账单失控
- **混合 Saved Prompts 对象**：还在用 OpenAI 的 `v1/prompts`——2026-06-03 起弃用、2026-11-30 关停，且无法走 code review
- **忽略上下文窗口**：把 200K token 的文档塞进 100K 窗口的模型——会静默截断，需切换大窗口模型或分段
- **指令与上下文混在一起**：长文档任务把问题埋在文档中间——Anthropic 实测提问置尾可提升 ~30%

## 下一步

- [参考](./reference.md)：完整 API 参数表、版本变化、官方资源、迁移指南
