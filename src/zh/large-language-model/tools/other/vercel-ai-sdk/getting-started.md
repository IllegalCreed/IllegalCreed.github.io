---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vercel AI SDK v7（ai-sdk.dev/docs，2026 年）编写

## 速查

- 主包：`ai`（核心），UI 包：`@ai-sdk/react`、`@ai-sdk/svelte`、`@ai-sdk/vue`、`@ai-sdk/solid`
- Provider 包：`@ai-sdk/openai`、`@ai-sdk/anthropic`、`@ai-sdk/google`、`@ai-sdk/mistral`、`@ai-sdk/xai` 等 25+
- 核心函数：`generateText` / `streamText` / `embedMany` / `generateImage`
- 结构化输出：v7 用 `generateText({ output: Output.object({ schema }) })`，替代旧 `generateObject`
- 模型实例：`openai('gpt-5')` / `anthropic('claude-sonnet-4.6')` / `google('gemini-2.5-pro')`
- UI Hook：`useChat` / `useCompletion` / `useObject` / `useAgent`
- 流式响应：`result.toUIMessageStreamResponse()`（Next.js Route Handler）
- Tool Calling：`tool({ description, inputSchema: z.object(...), execute: async (args) => {...} })`
- RSC：`streamUI` / `createStreamableUI`（v7 中趋于稳定）
- 主仓库：[github.com/vercel/ai](https://github.com/vercel/ai)

## 安装

```bash
# 主包 + 一个或多个 provider
npm install ai @ai-sdk/openai zod
# React UI
npm install @ai-sdk/react
```

Node 18+ / TypeScript 5+。框架无关——Next.js / Nuxt / Vite / Express / Hono 都能用。

## 第一个 Provider

```typescript
import { openai } from '@ai-sdk/openai';

// 模型实例：传模型名即可
const model = openai('gpt-5');
// 其他厂商同样模式
// import { anthropic } from '@ai-sdk/anthropic';
// const model = anthropic('claude-sonnet-4.6');
```

环境变量按厂商要求：

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## 第一次调用：generateText

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text, usage, finishReason } = await generateText({
  model: openai('gpt-5'),
  prompt: '用 TypeScript 写一个 quicksort',
});

console.log(text);
console.log(usage); // { promptTokens, completionTokens, totalTokens }
```

关键参数：

| 参数 | 用途 |
| --- | --- |
| `model` | 模型实例，必填 |
| `prompt` / `messages` / `system` | 输入（三选一或组合） |
| `temperature` | 采样温度 |
| `maxOutputTokens` | 输出上限 |
| `tools` | 工具定义（tool calling） |
| `output` | 结构化输出（v7 起） |
| `providerOptions` | 厂商特有参数透传 |
| `stopSequences` | 提前停止 |

## 切换模型：改一行

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';

// 把上面 generateText 的 model 改成下面任一即可
anthropic('claude-sonnet-4.6')
google('gemini-2.5-pro')
mistral('mistral-large-latest')
```

这就是 AI SDK 的核心价值——**调用代码完全不变，只换 model 实例**。

## 流式：streamText

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-5'),
  prompt: '讲个程序员笑话',
});

// result.textStream 既是 ReadableStream 也是 AsyncIterable
for await (const delta of result.textStream) {
  process.stdout.write(delta);
}

// 也可以等结束后拿元信息
const { usage, finishReason } = await result;
```

返回对象同时提供：

- `result.textStream`：纯文本 chunk 流
- `result.fullStream`：完整事件流（`text-delta` / `tool-call` / `reasoning-delta` / `finish-step` / `error`）
- `result.toUIMessageStreamResponse()`：直接给前端 hook 用的 HTTP 响应
- `result.toTextStreamResponse()`：纯文本 SSE 响应

## Next.js Route Handler + useChat

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai('gpt-5'),
    messages,
  });
  return result.toUIMessageStreamResponse();
}
```

```tsx
// 客户端
'use client';
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, sendMessage, status } = useChat({ api: '/api/chat' });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.role}: {m.parts.map((p) => p.text).join('')}</div>
      ))}
      <button onClick={() => sendMessage('你好')}>发送</button>
    </div>
  );
}
```

`useChat` 自动处理：流式渲染、状态管理、错误恢复、停止生成（`stop()`）。

## 结构化输出（v7 写法）

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { output } = await generateText({
  model: openai('gpt-5'),
  prompt: '生成一个番茄炒蛋食谱',
  output: Output.object({
    schema: z.object({
      name: z.string(),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
      })),
      steps: z.array(z.string()),
    }),
  }),
});

// output 已类型推断为 { name: string; ingredients: {...}[]; steps: string[] }
console.log(output.name);
```

`Output` 还提供：

| 方法 | 含义 |
| --- | --- |
| `Output.object({ schema })` | 单个对象 |
| `Output.array({ schema })` | 对象数组 |
| `Output.text()` | 纯文本（默认） |
| `Output.choice({ choices })` | 从字符串枚举里选一个 |
| `Output.json()` | 解析自由 JSON，不强制 schema |

::: warning 5.x → v7 迁移

旧版（5.x 及之前）使用 `generateObject` / `streamObject` 独立函数。v7 把结构化输出统一收敛到 `generateText` / `streamText` 的 `output` 参数——更易组合，但需重写调用代码。

:::

## Tool Calling

```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-5'),
  prompt: '上海今天多少度？',
  tools: {
    getWeather: tool({
      description: '查询某城市天气',
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => {
        // 实际调用天气 API
        return { city, temp: 28, condition: 'sunny' };
      },
    }),
  },
});

console.log(result.text);
// 模型会自动调 getWeather、把结果填进回答
```

支持多轮 tool calling（`maxSteps`）：

```typescript
generateText({
  // ...
  maxSteps: 5,  // 最多 5 步工具循环
});
```

每步可在 `result.steps` 数组中查到。

## Provider 列表速览

| 包 | 厂商 |
| --- | --- |
| `@ai-sdk/openai` | OpenAI（GPT-5 / o-系列） |
| `@ai-sdk/anthropic` | Anthropic Claude |
| `@ai-sdk/google` | Google Gemini（AI Studio） |
| `@ai-sdk/google-vertex` | Google Vertex AI |
| `@ai-sdk/azure` | Azure OpenAI |
| `@ai-sdk/amazon-bedrock` | AWS Bedrock |
| `@ai-sdk/mistral` | Mistral |
| `@ai-sdk/xai` | xAI Grok |
| `@ai-sdk/cohere` | Cohere |
| `@ai-sdk/deepseek` | DeepSeek |
| `@ai-sdk/togetherai` / `@ai-sdk/fireworks` / `@ai-sdk/groq` / `@ai-sdk/cerebras` | 开源模型托管 |
| `@ai-sdk/perplexity` | Perplexity Sonar |
| `@ai-sdk/elevenlabs` / `@ai-sdk/lmnt` | TTS |
| `@ai-sdk/deepgram` / `@ai-sdk/assemblyai` | STT |

完整列表见 [Providers & Models](https://ai-sdk.dev/docs/ai-sdk-core/providers-and-models)。

## 与 OpenRouter / OpenAI SDK 配合

OpenRouter 是 OpenAI 兼容，直接用 `@ai-sdk/openai` 的 `createOpenAI`：

```typescript
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter('anthropic/claude-sonnet-4.6');
```

## 下一步

- [指南](./guide-line) —— v7 迁移 / 多轮 Agent / RSC / 自定义 stream part
- [参考](./reference) —— Core 函数签名 / Output API / UI Hooks 全表 / Provider 列表
