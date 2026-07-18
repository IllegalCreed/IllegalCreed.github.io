---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 google-gemini/gemini-skills README 与各 skills/SKILL.md 编写。Apache-2.0。

## 速查

- **装**：`npx skills add google-gemini/gemini-skills` 或 `npx ctx7 skills install /google-gemini/gemini-skills`
- **4 skill**：`gemini-api-dev`（基础）·`gemini-interactions-api`（推荐主 API）·`gemini-live-api-dev`（实时流）·`gemini-omni-flash-api`（视频）
- **每 skill**：`SKILL.md`（带 frontmatter name/description）+ 可选 `scripts/`（omni-flash 自带）+ 可选 `references/`（interactions 的 migration）
- 遵 agentskills.io 格式；Apache-2.0；Google Gemini 团队出品
- **声明**：「This is not an officially supported Google product」，不参与 Google OSS 漏洞奖励

## 4 skill 全表

| Skill | 描述 | 关键模型 / 工具 |
| --- | --- | --- |
| `gemini-api-dev` | 用 Gemini API hosted 模型（Gemini / Gemma 4）构建应用，含多模态、函数调用、结构化输出、模型规格 | `gemini-3.5-flash`、`gemini-3.1-pro-preview`、`gemma-4-*`；4 语言 SDK |
| `gemini-interactions-api` | **推荐主 API**：文本生成、多轮 chat、多模态理解、图像/视频生成、流式、Deep Research、function calling、结构化输出、从 `generateContent` 迁移 | `gemini-3.5-flash`、`antigravity-preview-05-2026`、`deep-research-preview-04-2026`、`gemini-omni-flash-preview` |
| `gemini-live-api-dev` | 实时双向流：WebSocket 音视频/文本、VAD、原生音频、function calling、session 管理、ephemeral tokens、Live Translate | `gemini-3.1-flash-live-preview`、`gemini-3.5-live-translate-preview` |
| `gemini-omni-flash-api` | 生成式视频：文生视频、首帧到视频、图像参考生成、视频编辑、视频插值 | `gemini-omni-flash-preview`；自带 `generate_video.py`/`prep_video.py`/`inspect_video.py`/`upload_file.py` |

## 当前模型清单（节选）

| 模型 | 上下文 | 定位 |
| --- | --- | --- |
| `gemini-3.5-flash` | 1M | 通用、快速、多模态 |
| `gemini-3.1-pro-preview` | 1M | 复杂推理、编码、研究 |
| `gemini-3.1-flash-lite-preview` | — | 高频轻量任务、低成本 |
| `gemini-3-pro-image-preview` (Nano Banana Pro) | 65k/32k | 高质量图生/编辑 |
| `gemini-3.1-flash-image-preview` (Nano Banana 2) | 65k/32k | 快速图生/编辑 |
| `gemini-3.1-flash-lite-image-preview` (Nano Banana 2 Lite) | 65k/32k | 超快图生 |
| `gemini-3.1-flash-tts-preview` | — | 表达式 TTS（Director's Chair） |
| `gemini-omni-flash-preview` | — | 视频生成/编辑 |
| `gemini-3.1-flash-live-preview` | 128k | 实时低延迟对话 |
| `gemini-3.5-live-translate-preview` | — | 实时流式翻译 |
| `gemma-4-31b-it` | — | Gemma 4 dense，31B |
| `gemma-4-26b-a4b-it` | — | Gemma 4 MoE，26B 总/4B active |

**废弃（禁用）**：`gemini-2.5-*`、`gemini-2.0-*`、`gemini-1.5-*`；Live 旧模型 `gemini-2.5-flash-native-audio-preview-12-2025`、`gemini-live-2.5-flash-preview`、`gemini-2.0-flash-live-001`。

## SDK 与安装

| 语言 | 包 | 安装 |
| --- | --- | --- |
| Python | `google-genai` (>=2.3.0 interactions / >=2.10.0 omni-flash) | `pip install -U google-genai` |
| JS/TS | `@google/genai` (>=2.3.0) | `npm install @google/genai` |
| Go | `google.golang.org/genai` | `go get google.golang.org/genai` |
| Java | `com.google.genai:google-genai` | Gradle/Maven 见 [Sonatype](https://central.sonatype.com/artifact/com.google.genai/google-genai/versions) |

**禁用旧 SDK**：Python `google-generativeai`、JS `@google/generative-ai`。

**其它依赖**：omni-flash skill 的 `prep_video.py`/`inspect_video.py`/`generate_video.py --strip-audio` 需系统装 `ffmpeg`/`ffprobe`；Python >= 3.10。

## Interactions API 端点 / 入口

| 入口 | 用途 |
| --- | --- |
| `client.interactions.create()` | 主入口（model/agent/input/stream/tools/system_instruction/previous_interaction_id/background/environment） |
| `client.interactions.get(id)` | 拉取（轮询 background 任务） |
| `client.agents.create()` / `list()` / `get(id=)` / `delete(id=)` | 自定义 managed agent 管理 |
| `.output_text` / `.output_image` / `.output_audio` | 响应 helper，取末段文本/图/音频 |
| `stream=True` | SSE 流（事件：`interaction.created`→`step.start`→`step.delta`→`step.stop`→`interaction.completed`） |

**存储**：默认 `store=True`（付费 55 天 / 免费 1 天）；`store=False` 禁用 `previous_interaction_id` 与 `background=True`。

## Live API 关键配置

| 项 | 值 / 说明 |
| --- | --- |
| 连接 | `client.aio.live.connect(model=..., config=types.LiveConnectConfig(...))`（Py）/ `ai.live.connect({...callbacks})`（JS） |
| 输入音频 | PCM 16-bit 小端 mono，16kHz（`audio/pcm;rate=16000`） |
| 输出音频 | PCM 16-bit 小端 mono，24kHz |
| 发数据 | `session.send_realtime_input(audio=.../video=.../text=...)` —— **所有新输入都走它** |
| 初始历史 | `send_client_content`（需 `history_config.initial_history_in_client_content`） |
| 翻译 | `LiveConnectConfig.translation_config=types.TranslationConfig(target_language_code=..., echo_target_language=True)` |
| 客户端认证 | ephemeral tokens（别在浏览器暴露 API key） |
| 限制 | 单会话 TEXT 或 AUDIO 二选一；纯音频 15min/音视频 2min/连接 ~10min；同步 function calling；不支持 code execution/url context |

## Omni Flash 脚本速查

```bash
# 文生视频
./scripts/video/generate_video.py "A close-up of a cat drinking tea" --output media/cat_tea.mp4

# 图生视频（首帧或参考）
./scripts/video/generate_video.py "Waves crash" --image ref.png --output media/waves.mp4

# 视频插值（两关键帧）
./scripts/video/generate_video.py "Sunrise to sunset timelapse" \
  --image start.png --image end.png --output media/interpolation.mp4

# 视频编辑（保留原音）
./scripts/video/generate_video.py "Make it anime style" --video in.mp4 --output media/anime.mp4

# 视频编辑（全量重生成音频）
./scripts/video/generate_video.py "Make it anime style" --video in.mp4 --strip-audio --output media/anime_new.mp4

# 逐轮编辑（复用上次 interaction）
./scripts/video/generate_video.py "Change to winter wonderland" \
  --previous-interaction-id "abc123..." --output media/winter.mp4

# 并行批处理
./scripts/video/generate_video.py --prompts-file prompts.txt --concurrency 3
./scripts/video/generate_video.py --batch jobs.json --concurrency 3

# 视频规范化（10s/720p/24fps，可剥音）
./scripts/video/prep_video.py src.mp4 --start 0 --duration 10
./scripts/video/prep_video.py src.mp4 --strip-audio --output media/silent.mp4

# 视频检查
./scripts/video/inspect_video.py media/out.mp4 --json
```

**Prompt 角色标签**：`<FIRST_FRAME>`（起始帧）、`<IMAGE_REF_0>`、`<IMAGE_REF_1>`…（参考，从 0 起）。

## 目录结构

```
gemini-skills/
├── skills/
│   ├── gemini-api-dev/SKILL.md
│   ├── gemini-interactions-api/
│   │   ├── SKILL.md
│   │   └── references/migration.md
│   ├── gemini-live-api-dev/SKILL.md
│   └── gemini-omni-flash-api/
│       ├── SKILL.md
│       └── scripts/
│           ├── upload_file.py
│           └── video/{generate_video,prep_video,inspect_video}.py
├── LICENSE                              # Apache-2.0
└── README.md
```

## 资源链接

- 仓库：[google-gemini/gemini-skills](https://github.com/google-gemini/gemini-skills)
- 文档总览：[ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)
- llms.txt 索引：[ai.google.dev/gemini-api/docs/llms.txt](https://ai.google.dev/gemini-api/docs/llms.txt)
- Interactions 概览：[interactions.md.txt](https://ai.google.dev/gemini-api/docs/interactions.md.txt)
- Live API 概览：[live.md.txt](https://ai.google.dev/gemini-api/docs/live.md.txt)
- 团队博客（skill 评估）：[Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- 编码 agent 配置：[ai.google.dev/gemini-api/docs/coding-agents](https://ai.google.dev/gemini-api/docs/coding-agents)
- 相关叶：[Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Antfu Skills](../antfu-skills/) · [Vercel Agent Skills](../vercel-agent-skills/)
