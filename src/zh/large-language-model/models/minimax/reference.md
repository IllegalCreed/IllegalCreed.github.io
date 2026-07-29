---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MiniMax 官方开放平台文档（2026 当前主力 MiniMax-M3 + Speech-2.8 + Hailuo-2.3 + Music-3.0）编写。完整文档见 [platform.minimaxi.com/docs](https://platform.minimaxi.com/docs/api-reference/api-overview)。本页**重点列接口与能力**，与 GPT / Claude / GLM 横向对比见下。

## 速查

- 国内端点：`https://api.minimaxi.com`
- 国际端点：`https://api.minimax.io`
- M3 双路径：`/v1/chat/completions`（OpenAI 兼容）/ `/anthropic/v1/messages`（Anthropic 兼容，推荐）
- Token 计数：`/anthropic/v1/messages/count_tokens`
- 文本 TTS：`/v1/t2a_v2`（同步 10000 字符）/ `/v1/t2a_v2`（WSS 流式 10000 字符）/ `/v1/t2a_async_v2`（异步 100 万字符）
- 音色复刻：`/v1/voice_clone`（音频 10s~5min / ≤20MB）
- 视频生成：`/v1/video_generation`（Hailuo-2.3）
- 音乐生成：`/v1/music_generation`（Music-3.0）
- 认证：HTTP Bearer Token（`Authorization: Bearer $MINIMAX_API_KEY`）

## API Endpoint

### 文本生成（M3 OpenAI 兼容）

```text
POST https://api.minimaxi.com/v1/chat/completions
Authorization: Bearer ${MINIMAX_API_KEY}
Content-Type: application/json
```

### 文本生成（M3 Anthropic 兼容，推荐）

```text
POST https://api.minimaxi.com/anthropic/v1/messages
Authorization: Bearer ${MINIMAX_API_KEY}
Content-Type: application/json
anthropic-version: 2023-06-01
```

### Token 计数（Anthropic 路径独有）

```text
POST https://api.minimaxi.com/anthropic/v1/messages/count_tokens
Authorization: Bearer ${MINIMAX_API_KEY}
```

### 语音合成

```text
同步 HTTP：  POST https://api.minimaxi.com/v1/t2a_v2
同步 WSS：   wss://api.minimaxi.com/v1/t2a_v2
异步长文本： POST https://api.minimaxi.com/v1/t2a_async_v2
音色复刻：   POST https://api.minimaxi.com/v1/voice_clone
```

### 视频与音乐

```text
视频生成： POST https://api.minimaxi.com/v1/video_generation
音乐生成： POST https://api.minimaxi.com/v1/music_generation
图像生成： POST https://api.minimaxi.com/v1/image_generation
```

## Request Schema（M3 OpenAI 兼容）

```ts
interface ChatCompletionsParams {
  model: string;                       // 必填，如 "MiniMax-M3"
  messages: Message[];                 // 必填
  max_tokens?: number;                 // 输出上限
  stream?: boolean;                    // 流式
  temperature?: number;                // 0-2，默认 1.0
  top_p?: number;                      // 与 temperature 二选一
  tools?: Tool[];                      // function calling
  tool_choice?: "auto" | "none" | "required" | { type: "function", function: { name: string } };
  response_format?: { type: "text" | "json_object" };
  user?: string;
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentBlock[];
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };   // 多模态
```

## Request Schema（M3 Anthropic 兼容）

```ts
interface MessagesCreateParams {
  model: string;                       // 必填，如 "MiniMax-M3"
  max_tokens: number;                  // 必填
  messages: Message[];                 // 必填
  system?: string | SystemBlock[];
  metadata?: { user_id?: string };
  stop_sequences?: string[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  tools?: Tool[];
  tool_choice?: ToolChoice;
  thinking?: { type: "enabled" | "disabled"; budget_tokens?: number };  // Interleaved Thinking
}
```

## Response Schema（OpenAI 兼容）

```ts
interface ChatCompletion {
  id: string;
  choices: Choice[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  base_resp?: { status_code: number; status_msg: string };
}

interface Choice {
  index: number;
  message: { role: "assistant"; content: string; tool_calls?: ToolCall[] };
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
}
```

## Response Schema（Anthropic 兼容）

```ts
interface Message {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: ContentBlock[];
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  usage: Usage;
}

interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string; signature: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };
```

## 全模型矩阵（按模态分工）

| 类型 | 代表模型 | 用途 | 上下文 / 上限 |
| --- | --- | --- | --- |
| **文本旗舰** | MiniMax-M3 | Agent / 长上下文 / 代码 | **1M** |
| **文本高速** | MiniMax-M2.7 / M2.7 highspeed | 极速响应 / 高频编码 | 204800（~60 tps / ~100 tps） |
| **文本标准** | MiniMax-M2.5 / M2.1 | 通用问答 / 多语言编程 | 204800 |
| **文本开源** | MiniMax-Text-01 / VL-01 | 自部署 / 离线 | 训练 1M / 推理 4M |
| **同步 TTS** | speech-2.8-hd / turbo | 短文本语音合成 | 10000 字符 |
| **异步 TTS** | speech-2.8-hd（async） | 长文本 / 字幕对齐 | **100 万字符** |
| **音色复刻** | voice_clone | 个性化音色 | 10s~5min / ≤20MB |
| **实时对话** | Realtime API | 全双工语音助手 | 端到端 < 250ms |
| **视频生成** | MiniMax-Hailuo-2.3 / Fast | 文生 / 图生视频 | 异步任务 |
| **图像生成** | image-01 / image-01-live | 文生图 / 图生图 | 异步任务 |
| **音乐生成** | Music-3.0 | 灵感 + 歌词 AI 音乐 | 异步任务 |

> 不存在「一模型打天下」——文本模型无语音 / 视频通道，硬接会失败。

## 关键接口能力（MiniMax 特色）

### 1. 双协议接入（M3 独有特色）

M3 同时提供 OpenAI 兼容与 **Anthropic 兼容**两套端点——这是 MiniMax 区别于其他国产模型（GLM / DeepSeek / Qwen 等仅 OpenAI 兼容）的独有能力。**官方推荐 Anthropic 路径**用于 Agent 推理与 Tool Use。

### 2. Interleaved Thinking（交错思考）

M3 在工具调用多轮之间原生推理，Anthropic 路径返回 `thinking` 类型响应块：

```python
response = client.messages.create(
    model="MiniMax-M3",
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=tools,
    messages=messages,
)
```

与 Claude Extended Thinking 区别：M3 在 **tool_use 轮次间自动思考**，Claude 仅单次回复前思考。

### 3. Lightning Attention（闪电注意力）

MiniMax-01 自研混合注意力，长序列推理 ~O(n) 复杂度，推理外推至 4M token。

### 4. 异步长文本 TTS（核心特色）

```bash
# 单次最大 100 万字符 + 句级时间戳
curl -X POST https://api.minimaxi.com/v1/t2a_async_v2 \
  -d '{"model":"speech-2.8-hd", "text":"...(≤100 万字符)...", "subtitle":{"format":"srt"}}'
```

- 文本上限 **100 万字符**（同步仅 10000）
- 句级时间戳（便于字幕对齐）
- 结果 URL 有效期 **9 小时**（需及时下载）

### 5. 音色快速复刻

```bash
curl -X POST https://api.minimaxi.com/v1/voice_clone \
  -F "file=@sample.wav" -F "voice_id=my-voice-01"
```

- 音频 10 秒 ~ 5 分钟 / ≤ 20MB
- `voice_id` 长度 8~256、首字符必须英文字母、末位不可为 `-` 或 `_`
- 临时音色 **7 天**内须调用一次合成，否则删除

### 6. Speech-2.8 语气词标签（独有）

22 种标签（`(laughs)` / `(sighs)` / `(crying)` / `(gasps)` / `(humming)` / `(coughs)` / `(sneezes)` / `(whispers)` / `(yawns)` 等），仅 `speech-2.8` 系列支持，旧模型会忽略。

### 7. Realtime API（端到端语音）

HTTP + WebSocket 双协议，全双工流式，端到端延迟 < 250ms。事件流：

| 事件 | 含义 |
| --- | --- |
| `task_started` | 任务开始 |
| `task_continue` | 流式音频增量 |
| `task_stopped` | 任务停止 |
| `task_failed` | 任务失败 |

### 8. MCP 服务器（官方支持）

官方提供 Python / JavaScript 两版 MCP 服务器，封装语音 / 音色 / 视频 / 音乐生成能力。挂在 Claude Code / Cline / Continue 等 MCP 客户端上即可调用。

## SDK 列表

| 语言 | 包 | 接入方式 | 维护 |
| --- | --- | --- | --- |
| **Python（Anthropic）** | `anthropic` | Anthropic SDK + 自定义 `base_url` | 第三方兼容 |
| **Python（OpenAI）** | `openai` | OpenAI SDK + 自定义 `base_url` | 第三方兼容 |
| **TypeScript / JS（Anthropic）** | `@anthropic-ai/sdk` | Anthropic SDK + 自定义 `base_url` | 第三方兼容 |
| **TypeScript / JS（OpenAI）** | `openai` | OpenAI SDK + 自定义 `base_url` | 第三方兼容 |
| **Go** | 社区 | 原始 HTTP | 社区 |
| **Java** | 社区 | 原始 HTTP | 社区 |
| **MCP Python** | 官方 | MCP 客户端 | 官方 |
| **MCP JavaScript** | 官方 | MCP 客户端 | 官方 |

::: tip MiniMax 不发布自有 SDK

MiniMax **不发布自有品牌 SDK**，全部通过 Anthropic SDK / OpenAI SDK 的 `base_url` 切换实现兼容接入。这是与 GLM（`zai-sdk`）/ DeepSeek（`deepseek-sdk` 等社区）的显著区别。

:::

## 错误码

| HTTP | status_code | 含义 |
| --- | --- | --- |
| 200 | 0 | 成功 |
| 400 | 1001~1027 | 参数错（model ID / voice_id / 文本超限 / 格式不支持） |
| 401 | 1004 / 1039 | API key 错 / 过期 / 未授权 |
| 403 | 2033 | 内容审核拦截（敏感内容） |
| 403 | 2038 | 无音色复刻权限（未完成个人/企业认证） |
| 429 | 1029 / 1030 | 限速（QPS / 并发超限） |
| 500 | 1037 / 1038 | 服务内部错（重试） |
| 504 | 1042 | 网关超时（重试） |

`base_resp` 字段示例：

```json
{
  "base_resp": {
    "status_code": 1004,
    "status_msg": "invalid api key"
  }
}
```

## Rate Limits

按账号 + 模型独立计：

| 维度 | 默认上限 |
| --- | --- |
| QPS（每秒请求） | Tier 阶梯，从 1 QPS 起步 |
| 并发 TTS | 5（默认） |
| 异步任务并发 | 视任务类型 |
| 长上下文 token | 按账号月配额 |

升级 Tier 需联系销售或完成企业认证。

## 价格速查（2026）

| 模型 | 输入（¥/M token） | 输出（¥/M token） | 备注 |
| --- | --- | --- | --- |
| MiniMax-M3（标准） | 中 | 中 | 1M 上下文，定价见官方计费页 |
| MiniMax-M2.7 highspeed | 略高 | 略高 | 极速版（~100 tps） |
| MiniMax-Text-01（自部署） | 仅算力 | 仅算力 | 开源 MIT 权重，免模型费 |
| speech-2.8-hd（同步） | 按字符 / 字数 | 按字符 / 字数 | 10000 字符内 |
| t2a_async_v2（异步） | 按字符 / 字数 | 按字符 / 字数 | 100 万字符内 |
| voice_clone（音色复刻） | 按次 | 按次 | 单次复刻 |
| Hailuo-2.3 视频生成 | 按秒 / 按次 | 按秒 / 按次 | 异步任务 |
| Music-3.0 音乐生成 | 按次 | 按次 | 异步任务 |

::: tip 第三方基准对比

第三方基准对比显示 M3 价格约为 **Claude Opus 的 1/8~1/10**，benchmark 略低但**性价比突出**，适合高频 Agent / 工具调用场景。具体定价以官方计费页为准。

:::

## 与 GPT / Claude / GLM 接口差异（核心）

| 能力 | MiniMax（M3） | Claude | GPT（OpenAI） | GLM-5.2 |
| --- | --- | --- | --- | --- |
| **协议兼容** | **Anthropic + OpenAI 双兼容（独有）** | Anthropic | OpenAI | OpenAI |
| **Interleaved Thinking** | ✓（M3 工具调用间原生） | ✓（单次 Extended Thinking） | ✓（o-series 内置） | ✓（`thinking.type` + `reasoning_effort`） |
| **Lightning Attention** | ✓（MiniMax-01 自研） | - | - | DeepSeek Sparse Attention |
| **超长上下文** | M3 **1M** / 01 推理外推 **4M** | Opus `[1m]` 1M | 256K（看 model） | 1M |
| **MoE 架构** | ✓（456B 总参 / 45.9B 激活） | Dense | Dense | MoE（744B / 40B 激活） |
| **同步 TTS** | ✓（10000 字符 / 22 种语气词） | ✗ | ✓（OpenAI TTS） | ✓（GLM-TTS） |
| **异步长文本 TTS** | ✓（**100 万字符** / 句级时间戳） | ✗ | ✗ | 部分 |
| **Realtime API** | ✓（HTTP+WSS，<250ms） | ✗ | ✓（Realtime API） | ✓（GLM Realtime） |
| **音色复刻** | ✓（10s~5min，7 天保活） | ✗ | ✗ | ✓ |
| **视频生成** | ✓（Hailuo-2.3） | ✗ | ✓（Sora） | ✓（CogVideoX-3 / Vidu） |
| **音乐生成** | ✓（Music-3.0） | ✗ | ✗ | ✓（CogView 等） |
| **MCP 集成** | ✓（官方 MCP 服务器） | ✓ 一类（Anthropic 推） | -（社区） | ✓（GLM 特色字段） |
| **Prompt Caching** | 部分 | ✓ 一类（4 breakpoints） | 自动 | Context Cache |
| **Batches（异步批）** | 部分 | ✓（50% 折扣） | ✓（50% 折扣） | ✓ |
| **PDF 原生** | ✓（M3 多模态） | ✓（32MB / 100 页） | -（需 vision OCR） | ✓（GLM-OCR） |
| **图像生成** | ✓（image-01） | ✗（Claude 不生图） | ✓（GPT-Image） | ✓（CogView-4） |
| **流式** | SSE | SSE | SSE | SSE |
| **System Prompt** | 顶层 `system`（Anthropic）/ `role: system`（OpenAI） | 顶层 `system` 字段 | `role: system` message | `role: system` message |
| **国产合规** | ✓（国内云 / 无墙直连） | ✗（中国大陆不直接服务） | ✗ | ✓ |
| **开源旗舰** | ✓（MiniMax-Text-01 / VL-01 MIT 风格） | ✗（全闭源） | ✗（GPT 全闭源） | ✓（GLM-4.5 / 5 / 5.2 MIT） |

::: tip 谁强在哪

- **MiniMax 强在**：双协议兼容（独有 Anthropic 路径）· 全模态一站式（语音 / 视频 / 音乐）· Lightning Attention 长序列 · 国产合规 · 性价比高
- **Claude 强在**：编码 / Agent 长任务 / Tool Use 灵活 / MCP 一类 / Constitutional 安全
- **GPT 强在**：多模态全栈（图/音/视频） / 内置工具（web/code/image） / 结构化输出
- **GLM 强在**：ARC 三能力融合 · MIT 开源 · Coding Plan ¥20 起

:::

## 资源链接

- 国内开放平台：[platform.minimaxi.com](https://platform.minimaxi.com/)
- 国际 API Docs：[platform.minimax.io/docs](https://platform.minimax.io/docs/api-reference/api-overview)
- 海螺 AI（C 端）：[hailuoai.com](https://www.minimaxi.com/)
- MiniMax-01 GitHub：[github.com/MiniMax-AI/MiniMax-01](https://github.com/MiniMax-AI/MiniMax-01)
- 技术论文：[arxiv.org/abs/2501.08313](https://arxiv.org/abs/2501.08313)
- HuggingFace：[huggingface.co/MiniMaxAI](https://huggingface.co/MiniMaxAI/MiniMax-Text-01)
- Tool Use 指南：[platform.minimax.io/docs/guides/text-m3-function-call](https://platform.minimax.io/docs/guides/text-m3-function-call)

## 下一步

- [入门](./getting-started) —— 第一次调用 / SDK 选型 / 双协议路径
- [指南](./guide-line) —— Interleaved Thinking / 语音 TTS 三档 / Realtime / Lightning Attention
- 海螺 AI 体验：[hailuoai.com](https://www.minimaxi.com/)
