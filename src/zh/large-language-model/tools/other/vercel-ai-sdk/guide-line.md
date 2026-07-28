---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Vercel AI SDK v7（ai-sdk.dev/docs，2026 年）编写

## 速查

- 主线版本：**v7**（5.x / 6.x 已是历史版本）
- v7 关键变化：`generateObject` / `streamObject` 合并到 `generateText` / `streamText` + `Output.*`
- Provider：`@ai-sdk/&lt;vendor&gt;`，模型实例化 `openai('gpt-5')`
- 多步 Agent：`generateText({ tools, maxSteps })`
- RSC：`streamUI` / `createStreamableUI`
- 自定义 stream part：`createUIMessageStream` + `writeMessageStreamPart`
- 评估：`generateText` 返回的 `steps` 数组每步都有 `text` / `toolCalls` / `toolResults`
- 嵌入：`embed` / `embedMany`；图像：`generateImage`
- Telemetry：`experimental_telemetry: { isEnabled: true }` 接 OpenTelemetry

## v7 迁移要点

从 5.x / 6.x 升级到 v7 的常见破坏点：

| 5.x / 6.x | v7 |
| --- | --- |
| `generateObject({ model, schema })` | `generateText({ model, output: Output.object({ schema }) })` |
| `streamObject(...)` | `streamText({ ..., output: Output.object({ schema }) })` |
| `tool({ inputSchema })` | `tool({ parameters })`（参数改名） |
| `result.object` | `result.output` |
| `Message` / `CoreMessage` | `UIMessage` / `ModelMessage`（消息类型拆分） |
| `useChat` 返回 `input` / `handleSubmit` | 返回 `sendMessage` / `messages[].parts` |

::: tip 升级路径

升级前先跑一遍官方 [v7 Migration Guide](https://ai-sdk.dev/docs/migration) + codemod：

```bash
npx @ai-sdk/migrate@latest
```

:::

## 多步 Agent

```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-5'),
  system: '你是个研究助手，遇到不确定的就查资料。',
  prompt: '统计 GitHub 上 TypeScript 仓库数最多的前 3 个组织。',
  maxSteps: 8,
  tools: {
    searchWeb: tool({
      description: '搜索网页',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => await mySearch(query),
    }),
    fetchUrl: tool({
      description: '抓取某 URL 内容',
      parameters: z.object({ url: z.string() }),
      execute: async ({ url }) => await fetch(url).then((r) => r.text()),
    }),
  },
});

// steps 是每一步的痕迹
for (const [i, step] of result.steps.entries()) {
  console.log(`Step ${i + 1}:`, step.toolCalls, step.toolResults, step.text);
}

console.log(result.text);  // 最终汇总答案
```

`maxSteps` 控制 Agent 循环上限，避免无限调用。

## Streaming 进阶

### 自定义 stream part

```typescript
import { createUIMessageStream, writeMessageStreamPart } from 'ai';

const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    // 边生成文本边推送
    const result = streamText({ model: openai('gpt-5'), prompt: '讲个故事' });
    writer.merge(result.toUIMessageStream());

    // 同时推送自定义数据（如进度条、数据库查询结果）
    writer.write({
      type: 'data',
      id: 'progress',
      data: { percent: 50 },
    });
  },
});

return stream.toUIMessageStreamResponse();
```

前端用 `useChat` 的 `messages[].parts` 里能拿到 `data` 类型的 part。

### 取消生成

```tsx
const { sendMessage, stop, status } = useChat({ api: '/api/chat' });
// status: 'submitted' | 'streaming' | 'ready' | 'error'

<button onClick={() => stop()} disabled={status !== 'streaming'}>
  停止
</button>
```

`stop()` 会发 AbortRequest，服务端 `streamText` 自动感知并停止生成。

## 结构化输出实战

### 流式部分对象

```typescript
import { streamText, Output } from 'ai';

const result = streamText({
  model: openai('gpt-5'),
  prompt: '生成 5 条产品评论',
  output: Output.array({
    schema: z.object({
      product: z.string(),
      rating: z.number().min(1).max(5),
      text: z.string(),
    }),
  }),
});

// 部分对象流：边生成边出（如「3.5 条评论」这种半成品）
for await (const partial of result.partialOutputStream) {
  console.clear();
  console.log(partial);
}
```

### mode：tool vs json

```typescript
Output.object({
  schema,
  mode: 'tool',  // 模型不支持 JSON mode 时用 tool calling 实现
  // 或 mode: 'json'（要求模型原生 JSON mode）
})
```

默认 `auto`——SDK 按模型能力自动选。

## Tool Calling 深入

### 工具结果作为用户消息

某些模型（如部分 Gemini 版本）要求 tool result 是 `user` 角色。SDK 自动处理，无需关心。

### 限制特定工具

```typescript
generateText({
  // ...
  tools: { a, b, c },
  toolChoice: { type: 'tool', toolName: 'a' },  // 强制调 a
  // 或 toolChoice: { type: 'auto' } / { type: 'none' }
});
```

### stopWhen

```typescript
generateText({
  // ...
  tools,
  stopWhen: ({ steps }) => steps.length >= 5 || steps.at(-1)?.toolCalls.length === 0,
});
```

比 `maxSteps` 更灵活——按条件终止 Agent 循环。

## React Server Components

```tsx
// app/page.tsx（Server Component）
import { streamUI } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

async function WeatherCard({ city }: { city: string }) {
  const data = await fetchWeather(city);
  return <Card>{data.temp}°C</Card>;
}

export default async function Page() {
  const result = await streamUI({
    model: openai('gpt-5'),
    prompt: '上海天气怎么样',
    text: ({ content }) => <p>{content}</p>,
    tools: {
      getWeather: {
        description: '查天气',
        parameters: z.object({ city: z.string() }),
        execute: async ({ city }) => ({ city }),
      },
    },
    // 模型调 getWeather 时，用结果渲染组件（流式）
    generateComponent: async ({ toolCall, toolResult }) => (
      <WeatherCard city={toolResult.city} />
    ),
  });

  return result.component;  // 直接渲染流式组件
}
```

这是 AI SDK 与 Next.js App Router 的招牌集成——**让 LLM 决定 UI**。

## Embedding

```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

// 单条
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-large'),
  value: 'hello world',
});

// 批量（自动 batch）
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-large'),
  values: ['doc1', 'doc2', 'doc3'],
});
```

## Image Generation

```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: '一只赛博朋克猫',
});

const base64 = image.base64;
```

## Provider 特性透传

```typescript
import { anthropic } from '@ai-sdk/anthropic';

generateText({
  model: anthropic('claude-sonnet-4.6'),
  prompt: '...',
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 5000 },  // Extended Thinking
    },
  },
});
```

各家独有特性（Claude thinking、Gemini responseSchema、OpenAI reasoning_effort）都从这里透传。

## Telemetry / 可观测

```typescript
generateText({
  // ...
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'chat-completion',
    metadata: { userId: '123' },
  },
});
```

接 OpenTelemetry——Langfuse / Helicone / Arize / Datadog 都已适配。

## 与 LangChain 对比

| 维度 | Vercel AI SDK | LangChain |
| --- | --- | --- |
| 定位 | SDK（抽象 + UI） | 框架（编排 + 记忆 + RAG + Agent） |
| 语言 | TypeScript-only | Python + JS/TS |
| 抽象层级 | 浅（贴近模型） | 深（多套 Chain / Agent / Memory 抽象） |
| UI 集成 | 一流（React / Svelte / Vue / Solid / RSC） | 弱（需自己接） |
| RAG | 不提供，需自配 | 内置大量 retriever / vectorstore |
| Agent 编排 | `generateText + maxSteps` 自管 | LangGraph 等专门工具 |
| 学习曲线 | 低 | 中-高 |
| 适合 | Web 应用前端 + 简单后端 | 复杂 pipeline / 多 Agent |

## 性能优化

### 自动 batching

`embedMany` / `generateText` 多调用时，部分 provider 支持自动 batching，省请求数。

### Caching

```typescript
import { cache } from 'ai';

const cachedModel = cache(openai('gpt-5'), {
  ttl: 3600,           // 1 小时
  maxSize: 1000,
});
```

相同 prompt 命中 cache 直接返回，省 token。

### 并发控制

```typescript
import { generateText } from 'ai';

// 用 p-limit 等控制
import pLimit from 'p-limit';
const limit = pLimit(5);
await Promise.all(prompts.map((p) => limit(() => generateText({ prompt: p, model }))));
```

## 常见陷阱

| 陷阱 | 解决 |
| --- | --- |
| `generateObject` is not exported | 已在 v7 移除，改用 `generateText + Output.object` |
| `useChat` 没有 `handleSubmit` | v7 改用 `sendMessage` |
| `messages[0].content` 是字符串错 | v7 用 `message.parts`（数组） |
| 流式中断后状态不一致 | 用 `onError` + `regenerate()` |
| Tool 调用无限循环 | 设 `maxSteps` 或 `stopWhen` |
| Claude thinking 没生效 | 用 `providerOptions.anthropic.thinking` |
| 中文乱码 | 设 Response `Content-Type: text/plain; charset=utf-8` |

## 版本里程碑

| 时间 | 主要变化 |
| --- | --- |
| 2023 Q3 | AI SDK 1.0（前身 `ai` 包，与 Next.js Edge 深度集成） |
| 2024 | 3.x / 4.x，UI hooks 稳定，`generateObject` 引入 |
| 2025 | 5.x，Mistral / Google Vertex / Bedrock 等大量 provider，RSC 完善 |
| 2025 末 | v6，Message 类型拆分为 UIMessage / ModelMessage |
| 2026 | **v7**——结构化输出统一到 `Output.*`，`generateObject` / `streamObject` 弃用，文档迁至 ai-sdk.dev |
