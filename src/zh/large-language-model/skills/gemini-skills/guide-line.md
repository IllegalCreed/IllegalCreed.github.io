---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 google-gemini/gemini-skills 各 skills/SKILL.md 编写。Apache-2.0。

## 速查

- **4 skill 分层**：api-dev = 通用基础 / interactions-api = **推荐主 API**（文本+Agent+图像+视频统一入口）/ live-api-dev = 实时双向流（WebSocket）/ omni-flash-api = 视频生成编辑专精
- **interactions-api 是日常首选**：`client.interactions.create()` 一个方法覆盖文本、多轮、流式、function calling、结构化输出、图像/语音/视频生成、Deep Research、Antigravity managed agent
- **live-api-dev 边界**：当前仅 WebSocket（无 WebRTC）、单会话只能 TEXT 或 AUDIO 二选一、原生音频上下文 128k / 标准 32k、函数调用同步（异步未支持）
- **omni-flash-api**：模型 `gemini-omni-flash-preview`，视频最长 10 秒、720p/24fps，需 Files API 先上传素材；EEA/瑞士/英国/部分美国州不可视频编辑
- **共同反模式**：禁用 `gemini-2.0-*`/`gemini-1.5-*`/`gemini-2.5-*` 旧模型；禁用 `google-generativeai`/`@google/generative-ai` 旧 SDK；Live API 别用 `send_client_content` 发新消息（用 `send_realtime_input`）

## gemini-api-dev：基础模型与 SDK 速查

最轻量的入口 skill——告诉 agent「当前该用哪个模型、装哪个 SDK、4 种语言的 Quick Start 长什么样」。覆盖：

- **当前模型**：`gemini-3.5-flash`（1M tokens、快速、多模态）/ `gemini-3.1-pro-preview`（复杂推理、编码、研究）/ `gemini-3.1-flash-lite-preview`（高频轻量任务）/ `gemini-3-pro-image-preview`（Nano Banana Pro）/ `gemini-3.1-flash-image-preview`（Nano Banana 2）/ `gemma-4-31b-it`、`gemma-4-26b-a4b-it`（开源 Gemma 4）
- **4 语言 SDK**：Python `pip install google-genai`、JS/TS `npm install @google/genai`、Go `go get google.golang.org/genai`、Java `com.google.genai:google-genai`
- **多模态、函数调用、结构化输出**的入口示例
- **明确禁用**：`gemini-2.0-*`、`gemini-1.5-*` 已废弃；旧 SDK `google-generativeai`（Py）/`@google/generative-ai`（JS）废弃

适用：跨语言起步、查模型名/SDK 包名/简单代码骨架。需要更高级能力（Agent、流式、实时、视频）时跳到对应 skill。

## gemini-interactions-api：推荐主 API

Interactions API 是 Gemini 团队**推荐的现代主调用方式**（取代旧的 `generateContent`），把文本、多轮、流式、工具、Agent、多模态生成统一到 `client.interactions.create()` 一个方法。

### 核心能力

| 能力 | 用法 |
| --- | --- |
| 文本生成 | `client.interactions.create(model=..., input=...)` → `.output_text` |
| 多轮上下文 | `previous_interaction_id=prev.id` 链接（服务端默认 `store=True`） |
| 流式 | `stream=True` → SSE 事件流（`interaction.created`→`step.start`→`step.delta`→`step.stop`→`interaction.completed`） |
| 函数调用 | `tools=[...]` 声明，step 类型 `function_call`/`function_result` |
| 结构化输出 | `response_schema` / `response_json_schema` |
| 多模态生成 | `output_image` / `output_audio` helper 直接取最后一张图/段音频 |
| Deep Research | `agent="deep-research-preview-04-202-26"` + `background=True`，轮询直到 `status=="completed"` |
| Antigravity agent | `agent="antigravity-preview-05-2026"` + `environment="remote"`，托管 Linux 沙箱里跑代码/读写文件/搜网 |
| 自定义 agent | `client.agents.create(id=..., base_agent=..., system_instruction=...)` |

### 重要约束

- **interactions 默认存储**（`store=true`，付费层 55 天 / 免费层 1 天）；设 `store=false` 会**禁用** `previous_interaction_id` 和 `background=true`
- `tools`、`system_instruction`、`generation_config` 是**会话级**，每轮都要重传
- **Managed agent 必须配 `environment="remote"`**（或环境 ID/配置对象）才能开沙箱
- 从 `generateContent` 迁移：读 `references/migration.md` 的清单与前后对比，**改前与用户确认范围**

### 适用 vs 不适用

- 适用：文本对话、多轮、流式、Agent（Deep Research/Antigravity/自定义）、图像/语音生成、文档/视频理解、结构化输出
- 不适用：实时低延迟语音对话（→ live-api-dev）；纯视频生成编辑（→ omni-flash-api）

## gemini-live-api-dev：实时双向流

Live API 通过 **WebSocket** 提供**低延迟实时音视频对话**——mic 进 speaker 出、人类级口语回应。当前**不支持 WebRTC**，需要 WebRTC 时用第三方（LiveKit / Pipecat / Fishjam / Vision Agents / Voximplant / Firebase AI SDK）。

### 关键能力

- **双向音频流** + **视频流**（摄像头/屏幕帧） + **文本输入输出**
- **音频转录**：input/output 双向 transcript
- **VAD**（语音活动检测）：自动处理用户打断（`interrupted` 信号）
- **原生音频**：支持 thinking（`thinkingLevel`：minimal/low/medium/high）
- **Function calling**（**同步**，异步未支持）
- **Google Search grounding** 实时搜索
- **会话管理**：context compression、session resumption、GoAway 信号
- **Ephemeral tokens**：浏览器/移动端的安全客户端认证（别在浏览器暴露 API key）
- **Live Translate**：`gemini-3.5-live-translate-preview`，70+ 语言实时流式翻译

### 模型与音频格式

- **推荐模型**：`gemini-3.1-flash-live-preview`（128k 上下文、原生音频、低延迟）
- **翻译模型**：`gemini-3.5-live-translate-preview`
- 输入：PCM 16-bit 小端 mono，16kHz（`audio/pcm;rate=16000`）
- 输出：PCM 16-bit 小端 mono，24kHz

### 关键陷阱

- **用 `send_realtime_input` 发所有新输入**（音频/视频/**文本**）；`send_client_content` **仅**用于播种初始历史（需在 `history_config` 设 `initial_history_in_client_content`），用它发新消息是错的
- **不要在 `sendRealtimeInput` 里用 `media`**——用具体键 `audio` / `video` / `text`
- **每个服务端事件可能含多个 parts**（音频 + transcript 同时），必须处理**全部** parts 才不丢内容
- **打断**：收到 `interrupted` 要停播放、清空音频队列
- **测试用耳机**：避免回声/自打断

### 限制

- 单会话响应模态只能 TEXT 或 AUDIO 二选一
- 纯音频会话 15 分钟无压缩上限；音视频 2 分钟；连接寿命 ~10 分钟（用 session resumption 续）
- 原生音频上下文 128k / 标准 32k
- 不支持：异步 function calling、proactive audio、affective dialogue（Gemini 3.1 Flash Live）、code execution、URL context

## gemini-omni-flash-api：视频生成与编辑

用 `gemini-omni-flash-preview` 做**生成式视频**——文生视频、图生视频（首帧或参考）、视频编辑（风格转换/局部修改/扩画）。

### 核心能力

| 能力 | 描述 |
| --- | --- |
| 文生视频 | 文本 prompt → 视频 |
| 首帧到视频 | 单张图作起始帧 |
| 图像参考生成 | 多张图作风格/角色/对象参考 |
| 视频编辑 | 改风格、增删元素、换台词/标志 |
| 视频插值 | 两张关键帧之间生成过渡视频 |
| 逐轮编辑 | `--previous-interaction-id` 复用上一次结果，不重传素材 |
| 并行批处理 | `--prompts-file`/`--batch jobs.json` + `--concurrency N` |

### 工作流

1. **分析请求**：确定任务类型与输入素材（图/视频）
2. **跑脚本**：`scripts/video/generate_video.py`（端到端）或 `scripts/upload_file.py`（仅上传）
3. **取回输出**：保存到本地（如 `media/`）

### 配套脚本

| 脚本 | 作用 |
| --- | --- |
| `scripts/upload_file.py` | Files API 上传素材，轮询直到 `ACTIVE`；>25MB 视频给出 prep 建议 |
| `scripts/video/generate_video.py` | 端到端生成/编辑 + 下载；支持 `--image`/`--video`/`--strip-audio`/`--previous-interaction-id`/`--batch` |
| `scripts/video/inspect_video.py` | ffprobe 检查时长/分辨率/帧率/音频 |
| `scripts/video/prep_video.py` | 规范化到 720p/24fps/≤10s，可选 `--strip-audio` |

### Prompt 技巧

- **角色标签**：`<FIRST_FRAME>`（起始帧）、`<IMAGE_REF_N>`（参考，N 从 0 起）
- **单场景**：明写「in a single unbroken scene」「no scene cuts」，否则默认多镜头叙事
- **音频**：默认会生成音频；想要音乐明写「include calm background music」
- **编辑用简单 prompt**：「Make this video anime」「Add a cat that jumps onto his lap」；复杂 prompt 易引意外变化，可加「Keep everything else the same」
- **时间点**：自然语言或 `[0-3s]...[3-6s]...[6-10s]` 时间码语法
- **文字渲染强**：可直接指定屏幕字、街牌、车牌内容

### 关键约束

- **最长 10 秒**、建议 720p/24fps（`prep_video.py` 自动规范化）
- **音视频处理选择**：保留原音 = 默认；要全量重新生成音频必须**上传时剥音轨**（`--strip-audio`），否则模型会尝试保留/改编
- **区域限制**：视频编辑上传在 **EEA、瑞士、英国、部分美国州** 不可用——若编辑秒返空输出（`total_output_tokens: 0`）很可能是这个原因
- **依赖**：Python `google-genai >= 2.10.0` + Python `>= 3.10` + 系统装 `ffmpeg`/`ffprobe`

## 反模式清单

- 用 `gemini-2.0-*`/`gemini-1.5-*`/`gemini-2.5-*`（interactions 视角）—— 全废弃
- 装旧 SDK `google-generativeai` / `@google/generative-ai` —— 已废弃
- Live API 用 `send_client_content` 发新用户消息 —— 只能播种初始历史
- Live API 在 `sendRealtimeInput` 用 `media` —— 用 `audio`/`video`/`text` 具体键
- Live API 单会话既要 TEXT 又要 AUDIO —— 二选一
- Omni Flash 编辑要全新音频却没剥音轨 —— 模型会保留/改编原音
- Omni Flash 编辑超过 10 秒视频 —— 先 `prep_video.py` 截到 10s
- Interactions 设 `store=false` 后还想用 `previous_interaction_id` —— 互斥

## 与相邻 skill 的边界

- **Vertex AI**：`vertex-ai-api-dev` skill 已迁出到 `google/skills` 主仓的 `skills/cloud/gemini-api`，本叶不覆盖 Vertex
- **interactions vs live**：interactions 是「请求-响应」式（含流式 SSE）；live 是「常连接双向流」（WebSocket），适用低延迟实时对话
- **interactions vs omni-flash**：omni-flash 走的也是 Interactions API（`gemini-omni-flash-preview` 模型 + interactions 调用），但 omni-flash skill 把视频生成的端到端脚本与 prompt 技巧打包成了独立技能

## 下一步

- [参考](./reference) —— 4 skill 全表 + 模型清单 + 安装 + 许可 + 链接
- 上游：[Gemini API 文档](https://ai.google.dev/gemini-api/docs) ｜ [skills 仓库](https://github.com/google-gemini/gemini-skills)
