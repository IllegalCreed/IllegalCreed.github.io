---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MiniMax 官方开放平台文档（2026-06 当前主力 MiniMax-M3 + Speech-2.8 + Realtime API）编写

## 速查

- M3 推荐路径：`/anthropic/v1/messages`（Anthropic 兼容，支持 thinking 块）
- M3 OpenAI 兼容路径：`/v1/chat/completions`
- M3 上下文：**1M token**（Anthropic 端点 200K 是客户端显示 bug，实际 1M）
- Interleaved Thinking：M3 在工具调用多轮之间原生推理（Anthropic 路径返回 `thinking` 块）
- Tool Use：`tools` 数组 + `tool_choice` 控制行为
- 流式：`stream: true`（OpenAI 路径）/ `client.messages.stream(...)`（Anthropic 路径）
- T2A 同步上限：**10000 字符**（HTTP + WebSocket 共享）
- T2A 异步上限：**100 万字符**（`t2a_async_v2`，返回句级时间戳，URL 有效期 9 小时）
- 音色克隆 `voice_clone`：音频 10 秒~5 分钟 / ≤ 20MB
- voice_id 命名规则：长度 8~256、首字符必须英文字母、允许 `数字/字母/-/_`、末位不可为 `-` 或 `_`
- 临时音色有效期：**7 天**（未调用即删除，错误码 2038 表示无复刻权限）
- 语气词标签：仅 **`speech-2.8`** 系列支持，22 种（`(laughs)` / `(sighs)` / `(crying)` / `(gasps)` / `(humming)` 等）

## Model 选择决策

```
你的问题
   ↓
[需要 Agent 推理 / Tool Use / 复杂规划？]
   │
   ├─ 是 → 上下文够？
   │       ├─ <200K → MiniMax-M3（标准）
   │       └─ ≥200K → MiniMax-M3（1M 上下文）
   │
   └─ 否 → 极速响应 / 高频编码？
            │
            ├─ 是 → MiniMax-M2.7 highspeed（~100 tps）
            └─ 否 → MiniMax-M3（默认，单模型打天下）
```

M3 是 2026-06 当前 Frontier Coding 旗舰，**90% 场景 M3 已足够**。M2.x 仅在「单次延迟敏感 + 简单问答」场景做 highspeed 替代。

## 双协议接入：OpenAI vs Anthropic

M3 同时提供两套兼容端点，**官方推荐走 Anthropic 兼容**：

| 维度 | OpenAI 兼容 | Anthropic 兼容（推荐） |
| --- | --- | --- |
| 端点 | `/v1/chat/completions` | `/anthropic/v1/messages` |
| Token 计数 | 不支持 | `/anthropic/v1/messages/count_tokens` |
| `thinking` 块 | 不支持 | ✓ 原生支持 |
| Interleaved Thinking | 不支持 | ✓ 工具调用轮次间原生推理 |
| 流式 | SSE | SSE（事件粒度更细） |
| SDK | `openai` 官方 | `anthropic` 官方 |
| 迁移成本 | 从 OpenAI 平迁最低 | 从 Claude 平迁最低 |

::: tip 为何官方推荐 Anthropic 路径

M3 专为 Agent 推理 / Tool Use / 代码与长上下文优化，Anthropic 协议原生支持 `thinking` 块与 Interleaved Thinking，工具调用与多步推理表现更优。OpenAI 路径仅做兼容保留，部分高级能力缺失。

:::

## Interleaved Thinking（交错思考）

M3 在**工具调用多轮之间**原生推理——每收到 tool_result 后，先内部「思考」再决定下一步动作。Anthropic 兼容路径会返回 `thinking` 类型响应块：

```python
import anthropic

client = anthropic.Anthropic(
    api_key="...",
    base_url="https://api.minimaxi.com/anthropic",
)

response = client.messages.create(
    model="MiniMax-M3",
    max_tokens=2048,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=tools,
    messages=[{"role": "user", "content": "查上海今天天气然后写封英文邮件给 alice"}],
)

# response.content 包含 thinking + text + tool_use 多种 block
for block in response.content:
    if block.type == "thinking":
        print(f"[内部推理]\n{block.thinking}\n")
    elif block.type == "tool_use":
        print(f"[调用工具] {block.name}({block.input})")
    elif block.type == "text":
        print(f"[最终回答]\n{block.text}")
```

与 Claude Extended Thinking 的区别：

| 维度 | Claude Extended Thinking | MiniMax Interleaved Thinking |
| --- | --- | --- |
| 触发 | 用户显式开 `thinking: enabled` | M3 工具调用场景**原生自动** |
| 时机 | 单次回复前思考 | **工具调用多轮间**连续思考 |
| 可见性 | `thinking` block（可读） | `thinking` block（可读） |
| 计费 | 按 output token | 按 output token |

::: tip 何时开 budget_tokens

- 数学 / 逻辑证明 / 多步规划：开 `budget_tokens: 16000+`
- 简单事实问答 / 翻译：保持默认（M3 自主决定）
- 流式 UI 等不及：开 `thinking.type: disabled` 关闭

:::

## Tool Use 完整

```python
tools = [
    {
        "name": "search_db",
        "description": "Search internal knowledge base",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keywords"},
                "limit": {"type": "integer", "default": 10},
            },
            "required": ["query"],
        },
    },
    {
        "name": "send_email",
        "description": "Send email to user",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
    },
]

messages = [{"role": "user", "content": "查一下账单问题然后邮件回复客户 alice@example.com"}]

while True:
    response = client.messages.create(
        model="MiniMax-M3",
        max_tokens=2048,
        tools=tools,
        messages=messages,
    )

    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason == "end_turn":
        break

    # 收集所有 tool_use block 并执行
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = call_my_function(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

    messages.append({"role": "user", "content": tool_results})
```

### `tool_choice` 控制

```python
# 1. auto（默认）：M3 决定是否调
tool_choice = {"type": "auto"}

# 2. any：必须调一个工具（不能直接回答）
tool_choice = {"type": "any"}

# 3. tool：必须调指定工具
tool_choice = {"type": "tool", "name": "search_db"}

# 4. none：禁用工具（仅文本回复）
tool_choice = {"type": "none"}
```

## Lightning Attention（闪电注意力）

MiniMax-01（开源 456B MoE）的核心创新——**混合注意力机制**，让超长序列推理显著加速。

### 关键技术要点

- **混合架构**：部分层用 Lightning Attention（线性注意力），部分用标准 softmax attention
- **训练 1M / 推理外推 4M**：训练时 1M token 上下文，推理时可外推至 **4M token** 不崩
- **复杂度**：从 O(n²) 降至接近 O(n)，长序列算力大幅降低
- **MoE 配合**：456B 总参 / 每 token 激活 45.9B，进一步降低推理算力

### 与其他长上下文方案对比

| 方案 | 代表模型 | 复杂度 | 训练长度 | 推理外推 |
| --- | --- | --- | --- | --- |
| **Lightning Attention** | MiniMax-01 | ~O(n) | 1M | 4M |
| **Sparse Attention** | GLM-5（DeepSeek Sparse Attention） | ~O(n log n) | 200K+ | 1M |
| **Ring Attention** | Llama-4 | O(n²) 分片 | 10M | 10M |
| **Native Long** | Gemini 2.5 | O(n²) 优化 | 2M | 2M |

详见 [arXiv:2501.08313](https://arxiv.org/abs/2501.08313)《MiniMax-01: Scaling Foundation Models with Lightning Attention》。

## 语音合成（T2A）三档接口

按文本长度与实时性要求选档：

| 接口 | 协议 | 文本上限 | 实时性 | 适用 |
| --- | --- | --- | --- | --- |
| **`t2a_v2`** | HTTP | 10000 字符 | 同步（一次性返回） | 短文本 / 单句 TTS |
| **`t2a_v2`（WSS）** | WebSocket | 10000 字符 | 流式（全双工） | 中短文本 / 边合成边播放 |
| **`t2a_async_v2`** | HTTP | **100 万字符** | 异步（轮询/回调） | 长文本 / 有声书 / 字幕对齐 |

### 异步长文本 TTS

```bash
# 1. 创建异步任务（最大 100 万字符）
curl -X POST https://api.minimaxi.com/v1/t2a_async_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "speech-2.8-hd",
    "text": "...（≤100 万字符的长文本）...",
    "voice_setting": {"voice_id": "female-tianmei"},
    "output_format": "mp3",
    "subtitle": {"format": "srt", "verbosity": 1}
  }'

# 返回 { "task_id": "xxx", "base_resp": {...} }

# 2. 轮询任务状态
curl -X GET "https://api.minimaxi.com/v1/query_t2a_async_v2?task_id=xxx" \
  -H "Authorization: Bearer $MINIMAX_API_KEY"

# 3. 完成后下载（音频 URL 有效期 9 小时）
# 返回 { "status": "Success", "audio_file": "https://...", "subtitle_files": [...] }
```

::: warning 同步接口跑长文本是反模式

同步 `t2a_v2`（HTTP/WebSocket 共享）单次上限 **10000 字符**，超限直接报错。> 1 万字符的有声书 / 长新闻必须切到 `t2a_async_v2`。

:::

## 音色快速复刻（voice_clone）

```bash
curl -X POST https://api.minimaxi.com/v1/voice_clone \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.wav" \
  -F "voice_id=my-custom-voice-01" \
  -F "need_noise_reduction=false" \
  -F "need_volume_normalization=false"
```

### 硬性规则

| 维度 | 规则 |
| --- | --- |
| 音频时长 | **10 秒 ~ 5 分钟** |
| 音频大小 | ≤ **20 MB** |
| `voice_id` 长度 | **8 ~ 256** 字符 |
| `voice_id` 首字符 | **必须英文字母**（不可数字开头） |
| `voice_id` 允许字符 | 数字 / 字母 / `-` / `_` |
| `voice_id` 末位 | **不可为 `-` 或 `_`** |
| `voice_id` 唯一性 | 不可与已有 ID 重复 |
| 临时音色有效期 | **7 天**（期内须调用一次合成，否则系统删除） |
| 复刻权限 | 需**个人 / 企业认证**（无认证错误码 2038） |

::: danger 临时音色 7 天删除坑

克隆生成的 `voice_id` 是**临时音色**——生成后 **7 天内必须调用一次该 voice_id 的 TTS 合成**，否则系统自动删除。生产部署需在「复刻 → 立即跑一次空合成 → 业务调用」之间增加保活步骤。

:::

## Speech-2.8 语气词标签

仅 `speech-2.8-hd` / `speech-2.8-turbo` 支持，旧系列（`speech-02` / `speech-01`）会忽略或报错。

22 种标签（部分）：

| 标签 | 含义 | 标签 | 含义 |
| --- | --- | --- | --- |
| `(laughs)` | 笑 | `(chuckle)` | 轻笑 |
| `(sighs)` | 叹气 | `(crying)` | 哭 |
| `(gasps)` | 倒吸一口气 | `(humming)` | 哼唱 |
| `(coughs)` | 咳嗽 | `(sneezes)` | 打喷嚏 |
| `(whispers)` | 耳语 | `(yawns)` | 打哈欠 |
| ...(共 22 种) | | | |

```json
{
  "model": "speech-2.8-hd",
  "text": "哎呀，这事儿嘛 (sighs)... 让我想想 (humming)... 好的，就这么办 (laughs)！",
  "voice_setting": {"voice_id": "female-tianmei", "language_boost": "auto"}
}
```

## Realtime API（实时语音对话）

端到端语音对话方案，HTTP + WebSocket 双协议：

| 维度 | 指标 |
| --- | --- |
| **延迟** | **端到端 < 250ms** |
| 协议 | HTTP（信令）+ WebSocket（流式音频） |
| 模式 | 全双工流式 |
| 音色 | 超拟人音色库（含语气词） |
| 适用 | 实时语音助手 / 客服对话 / AI 陪伴 |

::: tip 别用同步 T2A 轮询做对话

实时对话场景**禁止用同步 `t2a_v2` 轮询**——ASR → LLM → TTS 串行链路延迟远超 500ms，无法满足对话级实时性。Realtime API 端到端方案延迟 < 250ms，是唯一正确选择。

:::

## 多模态：图像 / 视频输入

M3 支持多模态文本 / 图片 / 视频输入（OpenAI 兼容路径）：

```typescript
const response = await client.chat.completions.create({
  model: "MiniMax-M3",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "描述这张截图里的错误" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/screenshot.png" },
        },
      ],
    },
  ],
});
```

视频生成走 Hailuo 系列（独立接口）：

```bash
curl -X POST https://api.minimaxi.com/v1/video_generation \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MiniMax-Hailuo-2.3",
    "prompt": "一只柴犬在樱花树下奔跑，电影感镜头"
  }'
```

## MCP 集成

MiniMax 官方提供 Python / JavaScript 两版 MCP 服务器，封装：

- 语音合成（同步 / 异步）
- 音色克隆
- 视频生成（Hailuo）
- 音乐生成（Music-3.0）

挂在 Claude Code / Cline 等 MCP 客户端上即可调用，无需手写 `tools` 数组。

## System Prompt 最佳实践

```python
system = """你是 MiniMax 开放平台的技术支持助手。

## 角色
- 关注 API 接入、错误码、模型选择、性能优化
- 不评论通用 AI 哲学问题

## 输出格式
按以下结构：
1. **问题定位**（一句话）
2. **解决方案**（步骤化）
3. **参考链接**（官方文档锚点）

## 约束
- 总长 < 500 字
- 用中文
- 代码块用 ```bash / ```python / ```json 标记
"""
```

要点：

- **明确角色**（你是 X）
- **明确输出格式**（结构化）
- **明确约束**（长度 / 语言 / 风格）
- **少 negative**：「不要 X」不如「请 Y」

## 成本控制

```python
# 每次调用前估 token（Anthropic 兼容路径有 count_tokens）
count = client.messages.count_tokens(
    model="MiniMax-M3",
    messages=messages,
)
if count.input_tokens > BUDGET_TOKENS:
    raise BudgetExceededError()

# 实际响应后记 usage
response = client.messages.create(...)
cost = compute_minimax_cost(response.usage)  # 按官方计费页算
log_cost(user_id, cost)
```

::: tip M3 性价比优势

第三方基准对比显示 M3 价格约为 **Claude Opus 的 1/8~1/10**，SWE-Bench Pro 等基准略低但**性价比突出**，适合：

- 高频 Agent / 工具调用负载
- 长上下文场景（1M token 不翻倍计价，与 Claude `[1m]` 后缀翻倍不同）
- 国内合规要求

具体定价以官方计费页为准。

:::

## 故障排查

| 现象 | 排查 |
| --- | --- |
| `401 unauthorized` | API key 错 / 过期 / 未 set env |
| `429 rate_limit` | 超并发 / token 限速，看 retry-after header |
| `400 invalid_request` | 参数错（max_tokens 太大 / model ID 错 / voice_id 命名违规） |
| `2033 content_sensitive` | 触发内容审核（中文场景常见），调整 prompt 或换说法 |
| `2038 no_clone_permission` | 未完成个人/企业认证，无音色复刻权限 |
| 同步 T2A 报字符超限 | 切到 `t2a_async_v2`（100 万字符上限） |
| 音色 7 天后失效 | 临时音色未保活被删，重新复刻 + 立即调用一次 |
| M3 Anthropic 端点显示 200K | 已知客户端 bug（GitHub Issue #46），实际 1M，请求中正确设置即可 |
| 旧模型忽略语气词标签 | 仅 `speech-2.8` 系列支持，升 model 版本 |
| 长上下文响应慢 | 1M 上下文首响应延迟上升，按需设置 `max context length` |

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| abab5 / abab6 | 2023-2024 | 早期千亿参数 MoE，历史命名 |
| **abab6.5** | 2024 | 万亿参数 / 245K 上下文，后升级命名为 M 系列 |
| **MiniMax-Text-01 / VL-01**（开源） | 2025-01 | 456B 总参 / 45.9B 激活 / Lightning Attention / 训练 1M 推理外推 4M |
| **MiniMax-M1** | 2025-06 | 推理模型，80K 思维链 × 1M 输入 |
| **M2 / M2.1 / M2.5 / M2.7** | 2025 下半年 | 高速版（~100 tps）+ 标准版（~60 tps）双轨 |
| **Speech-2.8 hd/turbo** | 2026-01 | 22 种语气词标签 / 自然语气词 / 通透音质 |
| **MiniMax-Hailuo-2.3 / Fast** | 2025-10 | 文生 / 图生视频 |
| **MiniMax-M3** | 2026-06 | 1M 上下文 / Interleaved Thinking / Anthropic 兼容 / 当前旗舰 |
| **Music-3.0** | 2026-07 | 灵感 + 歌词生成 AI 音乐 |

::: tip 命名演进线

`abab6.5`（万亿参数/245K，历史）→ 开源 `MiniMax-01` → 商业化 `M` 系列（`M1` 推理 → `M2/M2.1/M2.5/M2.7` 高速+标准双轨 → **`M3`**）。**`abab` 已不再是当前主推命名**，仅作为第三方云（阿里云百炼等）遗留 ID 存在。

:::

## 下一步

- [入门](./getting-started) —— 第一次调用 / SDK 选型 / 双协议路径
- [参考](./reference) —— API 全字段 / 模型矩阵 / 价格 / SDK 全平台
- 开源仓库：[MiniMax-AI/MiniMax-01](https://github.com/MiniMax-AI/MiniMax-01)
