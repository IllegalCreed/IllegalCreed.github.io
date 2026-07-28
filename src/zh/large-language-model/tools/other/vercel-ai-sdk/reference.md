---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vercel AI SDK v7（ai-sdk.dev/docs，2026 年）编写。完整 API 见 [ai-sdk.dev/docs](https://ai-sdk.dev/docs)。

## 包列表

| 包 | 用途 |
| --- | --- |
| `ai` | 核心（Core + 工具函数 + 类型） |
| `@ai-sdk/react` | React UI hooks（`useChat` 等） |
| `@ai-sdk/svelte` | Svelte UI hooks |
| `@ai-sdk/vue` | Vue UI hooks |
| `@ai-sdk/solid` | Solid UI hooks |
| `@ai-sdk/openai` / `anthropic` / `google` / `mistral` / `xai` 等 | Provider |
| `@ai-sdk/provider-utils` | 自建 provider 用 |
| `@ai-sdk/openai-compatible` | 自建 OpenAI 兼容 provider |

## Core 函数

### `generateText`

```typescript
function generateText(options: {
  model: LanguageModel;
  system?: string;
  prompt?: string;
  messages?: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  tools?: ToolSet;
  toolChoice?: ToolChoice;
  output?: Output<unknown>;
  maxSteps?: number;
  stopWhen?: StopCondition;
  providerOptions?: Record<string, unknown>;
  headers?: Record<string, string>;
  abortSignal?: AbortSignal;
  experimental_telemetry?: TelemetrySettings;
}): Promise<GenerateTextResult>
```

返回对象关键字段：

| 字段 | 含义 |
| --- | --- |
| `text` | 最终文本（拼接所有 step） |
| `output` | 结构化输出（如 `Output.object` 时为对象） |
| `toolCalls` | 所有 tool 调用 |
| `toolResults` | 所有 tool 结果 |
| `usage` | `{ promptTokens, completionTokens, totalTokens }` |
| `finishReason` | `stop` / `length` / `tool-calls` / `error` |
| `steps` | 多步执行每步细节 |
| `warnings` | 模型/SDK 警告 |

### `streamText`

同 `generateText` 参数，但返回 stream 对象：

| 字段 | 含义 |
| --- | --- |
| `textStream` | AsyncIterable&lt;string&gt; + ReadableStream |
| `fullStream` | AsyncIterable&lt;StreamPart&gt;，含 `text-delta` / `tool-call` / `reasoning-delta` / `finish-step` / `error` |
| `text` | Promise&lt;string&gt;，等流结束拿全文 |
| `usage` | Promise&lt;TokenUsage&gt; |
| `toUIMessageStreamResponse()` | Next.js Route 直接返回（给 useChat） |
| `toTextStreamResponse()` | 纯文本 SSE |
| `pipeUIMessageStreamToResponse()` | 写入 Node Response |
| `toUIMessageStream()` | 拿原始 UIMessageStream |

### `embed` / `embedMany`

```typescript
embed({ model: EmbeddingModel, value: string }): Promise<{ embedding: number[] }>
embedMany({ model, values: string[] }): Promise<{ embeddings: number[][] }>
```

### `generateImage`

```typescript
generateImage({
  model: ImageModel;
  prompt: string;
  n?: number;
  size?: `${number}x${number}`;
  aspectRatio?: string;
  providerOptions?: Record<string, unknown>;
}): Promise<{ image: GeneratedImage }>
```

`GeneratedImage` 有 `base64` / `uint8Array`。

## Output API（v7）

```typescript
import { Output } from 'ai';

Output.object({ schema: z.object({...}), mode?: 'auto'|'json'|'tool' })
Output.array({ schema, mode? })
Output.text()
Output.choice({ choices: string[] })
Output.json()
```

## Tool 定义

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: '说明文字（给模型看）',
  parameters: z.object({
    city: z.string().describe('城市名'),
  }),
  execute: async (args, { toolCallId, messages, abortSignal }) => {
    return await fetchWeather(args.city);
  },
  // 可选：onInputAvailable（流式时输入参数完整后立即触发）
  // 可选：onOutputAvailable
});
```

参数 schema 支持 Zod / Valibot / ArkType / 标准 JSON Schema。

## UI Hooks（React）

### `useChat`

```typescript
const {
  messages,         // UIMessage[]（每条有 parts 数组）
  sendMessage,      // (message: string | Message) => Promise
  status,           // 'submitted' | 'streaming' | 'ready' | 'error'
  stop,             // 停止
  regenerate,       // 重发最后一条
  setMessages,      // 手动改 messages
  error,            // Error | null
  addToolResult,    // 给 tool 提供结果（interactive tool）
} = useChat({
  api: '/api/chat',
  id: 'chat-1',
  onFinish: ({ message }) => {...},
  onError: (error) => {...},
  maxSteps: 5,
  sendExtraMessageFields: false,
});
```

### `useCompletion`

```typescript
const { completion, input, setInput, handleSubmit, isLoading, stop } = useCompletion({
  api: '/api/completion',
});
```

适合「单次补全」场景（如自动完成 / 生成标题），不需要对话历史。

### `useObject`

```typescript
import { useObject } from '@ai-sdk/react';
import { Output } from 'ai';
import { z } from 'zod';

const { object, submit, stop, error, isLoading } = useObject({
  api: '/api/object',
  output: Output.object({ schema: z.object({...}) }),
});
```

服务端用 `streamText + Output.object`，前端拿到的 `object` 是流式部分对象（边生成边更新）。

## Message 类型（v7）

```typescript
type UIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: UIMessagePart[];
};

type UIMessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-<name>'; toolCallId, input, state, output }
  | { type: 'reasoning'; text }
  | { type: 'file'; mediaType, url }
  | { type: 'data', data };
```

服务端用 `ModelMessage`（更接近 provider 原始 schema），通过 `convertToModelMessages(uiMessages)` 转换。

## Provider 列表（官方维护）

| 包 | 厂商 | 示例 |
| --- | --- | --- |
| `@ai-sdk/openai` | OpenAI | `openai('gpt-5')`, `openai.embedding('text-embedding-3-large')` |
| `@ai-sdk/azure` | Azure OpenAI | `azure('gpt-5')` |
| `@ai-sdk/anthropic` | Anthropic | `anthropic('claude-sonnet-4.6')` |
| `@ai-sdk/google` | Gemini (AI Studio) | `google('gemini-2.5-pro')` |
| `@ai-sdk/google-vertex` | Gemini (Vertex) | `vertex('gemini-2.5-pro')` |
| `@ai-sdk/amazon-bedrock` | AWS Bedrock | `bedrock('anthropic.claude-sonnet-4.6')` |
| `@ai-sdk/mistral` | Mistral | `mistral('mistral-large-latest')` |
| `@ai-sdk/cohere` | Cohere | `cohere('command-r-plus')` |
| `@ai-sdk/xai` | xAI Grok | `xai('grok-4')` |
| `@ai-sdk/perplexity` | Perplexity Sonar | `perplexity('sonar-pro')` |
| `@ai-sdk/deepseek` | DeepSeek | `deepseek('deepseek-chat')` |
| `@ai-sdk/togetherai` | Together.ai | `togetherai('meta-llama/Llama-3.3-70B-Instruct-Turbo')` |
| `@ai-sdk/fireworks` | Fireworks | `fireworks('...')` |
| `@ai-sdk/groq` | Groq | `groq('llama-3.3-70b-versatile')` |
| `@ai-sdk/cerebras` | Cerebras | `cerebras('llama3.1-70b')` |
| `@ai-sdk/deepinfra` | DeepInfra | `deepinfra('...')` |
| `@ai-sdk/elevenlabs` | ElevenLabs TTS | `elevenlabs('eleven_multilingual_v2')` |
| `@ai-sdk/lmnt` | LMNT TTS | `lmnt('...')` |
| `@ai-sdk/deepgram` | Deepgram STT | `deepgram.transcribe(...)` |
| `@ai-sdk/assemblyai` | AssemblyAI STT | `assemblyai(...)` |
| `@ai-sdk/hume` | Hume（情感） | `hume('...')` |
| `@ai-sdk/revai` | Rev.ai STT | `revai(...)` |
| `@ai-sdk/gladia` | Gladia STT | `gladia(...)` |
| `@ai-sdk/baseten` | Baseten | `baseten(...)` |

完整 + 实时：[ai-sdk.dev/docs/ai-sdk-core/providers-and-models](https://ai-sdk.dev/docs/ai-sdk-core/providers-and-models)

## 自定义 Provider

### OpenAI 兼容

```typescript
import { createOpenAI } from '@ai-sdk/openai';

const myProvider = createOpenAI({
  baseURL: 'https://my-api.com/v1',
  apiKey: process.env.MY_API_KEY,
  name: 'my-provider',
});

const model = myProvider('my-model-id');
```

### 完全自定义

实现 `LanguageModelV2` 接口（`doGenerate` / `doStream`）。详见 [Custom Provider](https://ai-sdk.dev/docs/ai-sdk-core/custom-providers)。

## Stream Part 协议

`toUIMessageStreamResponse()` 输出的 SSE 数据格式：

```
0:"Hello"          // text-delta
2:{"toolCallId":"...","toolName":"...","input":{...}}   // tool-call
a:{"toolCallId":"...","output":{...}}                    // tool-result
g:{"text":"..."}                                          // reasoning-delta
d:{"finishReason":"stop","usage":{...}}                  // finish-step
e:{"text":"..."}                                          // error
```

前缀字符是类型标识，详见 [UI Message Stream](https://ai-sdk.dev/docs/ai-sdk-ui/streaming)。

## Middleware

```typescript
import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: anthropic('claude-sonnet-4.6'),
  middleware: extractReasoningMiddleware({}),
});
```

常用 middleware：

- `extractReasoningMiddleware`：分离 thinking 内容（DeepSeek R1 等）
- `simulateStreamingMiddleware`：把非流式模型包装成流式
- 自定义：实现 `transformParams` / `wrapStream` / `transformOutput`

## 错误处理

```typescript
import { generateText } from 'ai';

try {
  const { text } = await generateText({...});
} catch (error) {
  if (APICallError.isInstance(error)) {
    console.log(error.url, error.responseBody, error.isRetryable);
  }
}
```

错误类型：

| 类型 | 含义 |
| --- | --- |
| `APICallError` | Provider HTTP 错误（含 statusCode / responseBody） |
| `EmptyResponseBodyError` | Provider 返回空 |
| `AbortError` | abortSignal 触发 |
| `NoSuchToolError` | 模型调了未定义的 tool |
| `ToolExecutionError` | tool execute 抛错 |
| `InvalidToolArgumentsError` | tool args 不符合 schema |

## 资源链接

- 主文档：[ai-sdk.dev/docs](https://ai-sdk.dev/docs)
- GitHub：[github.com/vercel/ai](https://github.com/vercel/ai)
- 示例库：[github.com/vercel/ai/tree/main/examples](https://github.com/vercel/ai/tree/main/examples)
- v7 迁移指南：[ai-sdk.dev/docs/migration](https://ai-sdk.dev/docs/migration)
- Changelog：[ai-sdk.dev/changelog](https://ai-sdk.dev/changelog)
- Discord：[discord.gg/X5urSUMqA2](https://discord.gg/X5urSUMqA2)
