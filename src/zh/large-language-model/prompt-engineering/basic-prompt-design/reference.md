---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenAI + Anthropic 官方文档编写，对照 2026-07 一手文档；API 形态以官方最新为准

## 速查

- **范式升级**：Zero-shot → Few-shot（3–5 个）→ fine-tune
- **消息角色**：OpenAI `developer`（取代 legacy `system`）/ `user` / `assistant`；Anthropic `system` / `user` / `assistant`
- **三种 CoT**：Zero-shot CoT / Few-shot CoT / Extended Thinking（adaptive + effort）
- **结构化输出三层**：JSON Mode（`json_object`）< Structured Outputs（`json_schema` + `strict:true`）< Function Calling（`tools` + `tool_choice`）
- **Structured Outputs 硬限制**：`additionalProperties:false` / 全 key 入 `required` / ≤100 属性 / 首 8192 token / `$ref` 递归
- **tool_choice**：`auto` / `required` / `none` / 指定 function
- **Anthropic thinking**：`adaptive` + `output_config.effort`（low / medium / high），`budget_tokens` 已 deprecated
- **Prompt Caching**：`cache_control:{type:ephemeral, ttl:1h}`；读 0.1×、写 1.25×（5min）/ 2×（1h）；4 断点
- **Token 估算**：1 token ≈ 4 字符；中文每字 1–2 token；窗口 ~100K – 1M
- **代码内 prompt builder** 取代弃用的 Saved Prompts（`v1/prompts` 2026-11-30 关停）
- 完整说明见 [入门](./getting-started.md) / [核心范式与结构化输出](./guide-line.md)

## 消息角色对比

| 维度 | OpenAI（Chat Completions / Responses） | Anthropic（Messages API） |
| --- | --- | --- |
| 高阶指令角色 | `developer`（取代 legacy `system`） | `system`（顶层参数） |
| 用户输入 | `user` | `user` |
| 模型回复 | `assistant` | `assistant` |
| 工具结果 | `tool`（带 `tool_call_id`） | `user`（带 `tool_result` content block） |
| 权威层级 | `developer > user > assistant` | `system > user > assistant` |
| 高阶指令参数 | `instructions`（Responses API） | 顶层 `system` |
| 跨轮持久化 | `instructions` 不跨 `previous_response_id` | 每次重传 |

> OpenAI：legacy `system` 角色仍兼容但推荐迁移到 `developer`。Responses API 的 `instructions` 是「当次响应」级别，不持久化。

## 提示范式速查

| 范式 | 触发方式 | 适用 | 反模式 |
| --- | --- | --- | --- |
| **Zero-shot** | 直接下指令 | 通用任务（翻译、改写、分类、总结） | 任务复杂却硬撑 Zero-shot |
| **One-shot** | 1 个示例 | 简单格式迁移 | 边界覆盖不足 |
| **Few-shot** | 3–5 个多样示例 | 格式迁移、风格对齐、边缘情况 | 堆几十个相似示例（过拟合） |
| **Zero-shot CoT** | 「Let's think step by step」 | 通用触发推理 | 简单分类任务也加 CoT |
| **Few-shot CoT** | 示例带推理过程 | 推理范式迁移 | 推理步骤不一致 |
| **Extended Thinking** | `thinking` 参数 / 推理模型 | 数学、代码、多跳推理 | 在 4.7+ 用 `budget_tokens` |

## OpenAI 结构化输出三种能力对比

| 能力 | 写法 | 保证 | 适用 |
| --- | --- | --- | --- |
| **JSON Mode** | `response_format: {type: 'json_object'}` | 合法 JSON（不保证 schema） | legacy 兼容 |
| **Structured Outputs** | `response_format: {type: 'json_schema', json_schema: {strict: true, schema}}` | schema 严格校验（~100%） | 需要 schema 严格约束 |
| **Function Calling** | `tools: [...]` + `tool_choice` | 触发外部动作 + 参数 schema 校验 | Agent、工具调用 |

### Structured Outputs 硬限制

| 限制 | 取值 |
| --- | --- |
| `additionalProperties` | 必须 `false` |
| `required` | 所有 key 必须列出 |
| 属性数上限 | 100 |
| 输出 token 上限 | 首 8192 内生效 |
| 递归 | 支持 `$ref` |
| 转义关键字 | 加 `_`（如 `class` → `class_`） |

## Function Calling 参数

### tools 数组结构

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
  ]
}
```

### tool_choice 四种值

| 值 | 行为 |
| --- | --- |
| `auto`（默认） | 模型自主决定 |
| `required` | 强制调用某个工具 |
| `none` | 禁止调用 |
| `{type:'function', function:{name:'xxx'}}` | 强制调用指定函数 |

### 响应结构

```json
{
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Beijing\"}"
      }
    }
  ]
}
```

> `function.arguments` 是 **JSON 字符串**，应用层需 `JSON.parse`。

## Anthropic Extended Thinking 演进

### 旧版（已 deprecated）

```json
{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 4096
  }
}
```

- `budget_tokens` 最小 1024、必须小于 `max_tokens`
- 4.6 deprecated、4.7+ 返回 400

### 新版（adaptive）

```json
{
  "thinking": {"type": "adaptive"},
  "output_config": {"effort": "medium"}
}
```

**effort 三档**：

| effort | 行为 |
| --- | --- |
| `low` | 轻量思考，省 token |
| `medium`（默认） | 平衡 |
| `high` | 深度推理，质量最高 |

> Opus 4.5 关闭 thinking 时对「think」字眼敏感，改用「consider / evaluate / reason through」。

## Anthropic Prompt Caching 速查

### 写法

```json
{
  "system": [
    {
      "type": "text",
      "text": "稳定前缀...",
      "cache_control": {"type": "ephemeral", "ttl": "1h"}
    }
  ]
}
```

| 参数 | 取值 |
| --- | --- |
| `type` | `ephemeral` |
| `ttl` | `5min`（默认）/ `1h`（beta） |
| 断点上限 | 4 个 |
| 最低可缓存 token | 512 ~ 4096（因模型而异） |

### 计费折扣

| 操作 | 折扣（相对基础输入价） |
| --- | --- |
| Cache 读（5min / 1h） | 0.1× |
| Cache 写（5min） | 1.25× |
| Cache 写（1h） | 2× |

> 多轮对话 / 批处理可省 80–92% 输入费用。

### usage 字段

| 字段 | 含义 |
| --- | --- |
| `input_tokens` | 未缓存的新输入 |
| `cache_read_input_tokens` | 命中缓存的输入 |
| `cache_creation_input_tokens` | 写入缓存的输入 |
| `output_tokens` | 模型输出 token |
| `output_tokens_details.reasoning_tokens` | thinking 消耗 |

## Token 经济速查

| 估算维度 | 数值 |
| --- | --- |
| 1 token | ≈ 4 字符 / 0.75 英文词 |
| 中文每字 | 约 1–2 token |
| 上下文窗口 | GPT-4o ~128K / Claude 200K / GPT-4.1 ~1M |
| 最低可缓存 token | 512 ~ 4096 |

### 上下文窗口对比（典型模型）

| 模型 | 窗口 | 最大输出 |
| --- | --- | --- |
| GPT-4o / 4o-mini | 128K | 16K |
| GPT-4.1 | 1M | 32K |
| Claude Sonnet 5 / Opus 5 | 200K | 64K（含 thinking） |
| Claude Haiku 4.5 | 200K | 8K |
| Fable 5 / Mythos 5 | 200K | 64K |

## Prompt 模板工程

### OpenAI 代码内 prompt builder

```ts
// schemas/classify.ts
export interface ClassifySchema {
  category: "A" | "B" | "C";
  confidence: number;
}

// prompts/classify.ts
export function buildClassifyPrompt(text: string) {
  return {
    system: "你是文本分类器。输出 JSON：{category, confidence}。",
    user: text,
  };
}

// 用法
const {system, user} = buildClassifyPrompt(input);
const result = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {role: "system", content: system},
    {role: "user", content: user},
  ],
  response_format: {
    type: "json_schema",
    json_schema: {name: "classify", strict: true, schema: {...}},
  },
});
```

**优势**：

- 类型化入参 + schema 注入动态值
- 过 code review、走 CI/CD
- 配合 feature flag 灰度
- diff、回滚正常化
- 利用 prompt caching 把稳定前缀放在请求体最前

### Anthropic XML + 变量占位

```xml
<identity>你是数据分析师。</identity>
<instructions>基于 {{PATIENT_SYMPTOMS}} 回答问题。</instructions>
<context>{{MEDICAL_RECORD}}</context>
```

应用层做字符串替换。

## 版本变化与迁移

### OpenAI

| 时间 | 变化 |
| --- | --- |
| 2024-08-06 | Structured Outputs 在 gpt-4o 系列可用 |
| 2025+ | 扩展到 GPT-5 系列（gpt-5.6 等） |
| 2026-06-03 | Saved Prompts（`v1/prompts`）开始弃用 |
| 2026-11-30 | Saved Prompts 完全关停 |
| 当前 | Responses API 主推、Chat Completions 为 legacy；`role: 'developer'` 取代 `system'` |

### Anthropic

| 时间 | 变化 |
| --- | --- |
| 早期 | Extended Thinking 引入（`budget_tokens`） |
| 4.5+ | Prompt Caching 上线 |
| 4.6 | `budget_tokens` deprecated；prefill 最后一条 assistant 消息不再支持 |
| 4.7+ | `thinking:{type:enabled, budget_tokens}` 直接返回 400；全面切到 `adaptive` + `effort` |
| 当前 | 主力模型 Claude Opus 5 / Sonnet 5 / Fable 5 / Mythos 5、Haiku 4.5 |

### 共同趋势

从「手写约束 + 自然语言控制格式」→「结构化 API 参数（strict / adaptive / cache_control）下沉控制」。

## 官方资源

- OpenAI Prompt Engineering Guide：[developers.openai.com/api/docs/guides/prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- OpenAI Structured Outputs Guide：[developers.openai.com/api/docs/guides/structured-outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- OpenAI Function Calling Guide：[developers.openai.com/api/docs/guides/function-calling](https://developers.openai.com/api/docs/guides/function-calling)
- Anthropic Prompting Best Practices：[platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Anthropic Extended Thinking：[platform.claude.com/docs/en/build-with-claude/extended-thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- Anthropic Prompt Caching：[platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
