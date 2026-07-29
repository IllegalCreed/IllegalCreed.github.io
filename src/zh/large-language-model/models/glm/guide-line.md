---
layout: doc
outline: [2, 3]
---

# 模型矩阵与场景选型

> 基于 智谱 AI 官方文档（docs.bigmodel.cn）+ HuggingFace zai-org 开源仓库编写，对照 2026-07 GLM-5.2 行为

## 速查

- 选型第一问：**Agent / Coding 任务 → GLM-5.x（200K~1M）**；**高频并发 → 4.5-Air/AirX 或 4.7-Flash**；**调试 → 免费 4.7-Flash / 4-Flash**
- 编码场景走 **Coding Plan 专属端点** `coding/paas/v4` 而非通用 `paas/v4`
- 用 `thinking.type` + `reasoning_effort` **显式调档**：简单问答/抽取用 `none`，数学/工程规划用 `max`
- 启用 **Context Cache** 承载长对话 / 项目级工程上下文，避免重复长前缀重复计费
- 多模态按专用模型分工：图理解 → GLM-5V-Turbo / 4.6V；PDF / 文档 → GLM-OCR；文生图 → GLM-Image / CogView-4；视频 → CogVideoX-3 / Vidu；语音 → GLM-TTS / ASR / Realtime
- API 结构复用 OpenAI Chat Completions（messages/tools/stream），保留 GLM 特色字段（thinking/reasoning_effort）
- 自部署优先 **FP8 权重**（zai-org/GLM-4.5-FP8 / 4.6-FP8 / 4.7-FP8）+ vLLM / SGLang
- Agent 工具链：`tools` + Function Calling + MCP 三件套
- 反模式：当 OpenAI 1:1 替换、文本模型处理图像、保留即将下线模型、Coding 端点跑通用 Agent、期待绕过审核、BF16 硬部署、thinking 全开

## 各代基座定位

### GLM-5.2（2026-06-16 上线）

- **长任务时代旗舰**，对标 Claude Opus 4.7~4.8
- **1M 上下文 / 128K 最大输出**
- FrontierSWE 仅落后 Opus 4.8 约 1%、超 GPT-5.5 约 1%
- 主打「整工程仓库级上下文 + 长程任务自主工作」

### GLM-5.1

- **200K 上下文**，单次任务可自主工作 8 小时
- SWE-Bench Pro **58.4**，超 GPT-5.4 / Claude Opus 4.6 / Gemini 3.1 Pro
- 复杂工程任务首选

### GLM-5

- **200K 上下文**，编程对齐 Claude Opus 4.5
- MoE 总参数 **744B / 激活 40B**，预训练 **28.5T tokens**
- 集成 **DeepSeek Sparse Attention** + **Slime 异步 RL**
- ARC 三能力（Agentic + Reasoning + Coding）原生融合

### GLM-4.7（中端主力）

- SWE-bench **73.8**
- 200K 上下文 / 128K 输出
- 配 Flash 免费层（2026-01-19 上线）

### GLM-4.6（对齐 Claude Sonnet 4）

- 200K 上下文 / 128K 输出
- 思考开启时相比上一代省 30%+ token（官方称）
- 配 4.6v / 4.6v-flash 视觉变体

### GLM-4.5 / GLM-4.5-Air（即将下线）

- 355B/32B（旗舰）与 106B/12B（Air）
- MIT 开源，HuggingFace `zai-org/GLM-4.5` 与 `GLM-4.5-Air`
- **官方标注即将下线**，生产应迁移到 GLM-4.7 或 GLM-5.x

### GLM-4-Long / GLM-4-Flash-250414

- GLM-4-Long：**1M 上下文**，长文档处理
- GLM-4-Flash-250414：**免费普惠层**，调试与高并发低成本场景

## 基准对标阶梯（一句话记忆）

| 模型 | 对标对象 | 关键基准 |
| --- | --- | --- |
| GLM-4.6 | Claude Sonnet 4 | 200K / 128K |
| GLM-5 | Claude Opus 4.5 | 744B / 40B 激活，预训练 28.5T |
| GLM-5.1 | Opus 4.6 | SWE-Bench Pro 58.4（超 GPT-5.4 / Opus 4.6 / Gemini 3.1 Pro） |
| GLM-5.2 | 介于 Opus 4.7 / 4.8 | FrontierSWE 落后 Opus 4.8 ~1%、超 GPT-5.5 ~1% |

> 别拿 GLM-4.5（2025）参数规模当 GLM-5/5.2（2026）事实。GLM-5 已扩到 744B / 预训练 28.5T，与 GLM-4.5 的 355B / 15T 是两代架构。

## 场景选型（按任务）

### 编码 / Agentic Coding

- **首选 GLM-5.2**（1M 上下文承载整工程）或 **GLM-5.1**（200K 单次 8 小时自主工作）
- 走 **Coding Plan 专属端点** `coding/paas/v4`
- 直接对接 Claude Code / Cline / Roo Code / Kilo Code
- 开 `thinking.type=enabled` + `reasoning_effort=high` 或 `max`

### 高频并发 / 性价比

- **GLM-4.5-Air / AirX**（128K，速度 >100 tokens/秒）
- 或 **GLM-4.7-FlashX**（更高吞吐）
- 关闭 thinking，省 token 与延迟

### 普惠 / 调试

- **GLM-4.7-Flash**（免费，2026-01-19 上线）
- **GLM-4-Flash-250414**（免费）
- **CogView-3-Flash** / **CogVideoX-Flash**（图 / 视频免费层）

### 多模态

- 图像理解 → **GLM-5V-Turbo**（多模态 Coding 基座）/ **GLM-4.6V** / **GLM-4.6V-Flash**
- PDF / 文档 → **GLM-OCR**（单图 ≤10MB / PDF ≤100 页）
- 文生图 → **GLM-Image** / **CogView-4**
- 视频 → **CogVideoX-3** / **Vidu-Q1**
- 语音合成 → **GLM-TTS** / **GLM-TTS-Clone**
- 语音识别 → **GLM-ASR-2512**
- 实时语音 → **GLM-Realtime** / **GLM-4-Voice**
- 浏览器 / 手机自动化 → **AutoGLM-Phone**

### 检索增强（RAG）

- 向量 → **Embedding-3**（默认）/ **Embedding-2**（8K）
- 重排 → **Rerank**（相关性打分，4K 上下文）
- 内置工具 → `retrieval`（直接在 Chat Completions 调用）

## thinking 参数族详解

| 参数 | 取值 | 用途 |
| --- | --- | --- |
| `thinking.type` | `enabled` / `disabled` | 开关深度思考（GLM-4.5+） |
| `reasoning_effort` | `none` / `low` / `medium` / `high` / `max` | 按任务调推理强度 |
| Interleaved Thinking | 自动 | 每次工具调用前先思考 |
| Preserved Thinking | 自动 | GLM-4.7+ 多轮保留思考上下文 |
| Turn-level Thinking | 自动 | 按对话轮次开关思考 |

> 默认 thinking 全开跑所有请求是**反模式**。简单问答 / 分类全开 thinking 会成倍增加 token 与延迟，需按 `reasoning_effort` 收敛。

## Agent 工具链

### Function Calling（OpenAI 风格）

```json
{
  "model": "glm-5.2",
  "messages": [{"role": "user", "content": "查上海今天天气"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "parameters": {
        "type": "object",
        "properties": {"city": {"type": "string"}}
      }
    }
  }],
  "tool_choice": "auto"
}
```

### 内置工具

- `web_search`：联网搜索（GLM 特色，OpenAI SDK 不识别）
- `retrieval`：检索内置知识库
- **MCP 工具调用**：直接接 MCP server

### 编码 Agent 框架对接

| 框架 | 接入方式 |
| --- | --- |
| **Claude Code** | Coding Plan + `ANTHROPIC_BASE_URL` 指向 `coding/paas/v4` |
| **Cline** | 选 OpenAI Compatible，填 GLM 端点 |
| **Roo Code** | 同 Cline |
| **Kilo Code** | 同 Cline |

> Coding Agent 任务享优先保障；通用 Agent 工具走次级调度 + 尽力交付，高峰期可能降级。

## 自部署（开源权重）

### 部署栈选型

| 部署方式 | 适用 | 关键参数 |
| --- | --- | --- |
| **vLLM**（推荐） | 通用生产 | `--tool-call-parser glm47 --reasoning-parser glm45 --enable-auto-tool-choice` |
| **SGLang** | 高吞吐 | EAGLE 投机解码 |
| **华为昇腾** | 国产芯片 | xLLM |
| **AMD GPU** | 异构 | 官方支持 |
| **LLaMA-Factory / Swift** | 微调 | LoRA / 全参 |

### 显存预估（关键）

| 权重 | GLM-4.5 全 128K 上下文 | GLM-4.5-Air FP8 |
| --- | --- | --- |
| BF16 | H100 × 32 | H100 × 4 |
| FP8 | **H100 × 16** | **H100 × 2** |

> 生产环境硬部署 BF16 是**反模式**。GLM-4.5 BF16 全上下文需 H100×32、GLM-5（744B）更高，应默认 FP8 量化 + 投机解码。

## 反模式（避坑）

- **把 GLM API 当 OpenAI 1:1 等价直接替换**：`thinking.type` / `reasoning_effort` / `web_search` / `retrieval` / MCP 等 GLM 特色字段，标准 OpenAI SDK 不一定识别，需要 `zai-sdk` 或显式透传
- **用文本模型处理图像或 PDF**：GLM-5 等文本模型输入 / 输出均为纯文本模态，图像需走 GLM-5V-Turbo / 4.6V，文档需走 GLM-OCR
- **继续接入即将下线的模型到生产**：GLM-4.5 / GLM-4.5-X 已标注即将下线，GLM-Z1 系列 2025-11-15 下线，GLM-4-0520 2025-12-30 下线，迁移到 GLM-4.6/4.7 或 GLM-5.x
- **在通用 Agent 场景期待 Coding Plan 优先级**：官方明确通用 Agent 工具采用次级调度与尽力交付，高峰期可能降级
- **期待 GLM 完全绕过中文内容审核**：`finish_reason: sensitive` 表示因敏感内容中止
- **生产环境硬部署 BF16 权重**：GLM-4.5 BF16 全上下文需 H100×32、GLM-5（744B）更高，应默认 FP8 + 投机解码
- **默认 thinking 全开跑所有请求**：复杂推理才有收益，简单问答 / 分类全开 thinking 会成倍增加 token 与延迟
- **拿 GLM-4.5（2025）参数规模当 GLM-5/5.2（2026）事实**：GLM-5 已扩到 744B（激活 40B）、预训练 28.5T，与 GLM-4.5 的 355B / 15T 是两代架构
- **Coding 端点跑通用 Agent**：Coding Plan 专属端点为 Claude Code / Cline 等 Coding Agent 优化，通用 Agent 走次级调度
- **混用通用 PaaS 与 Coding 端点**：编码场景走 `coding/paas/v4`，混用易被限流

## 下一步

- [参考](./reference.md)：完整模型表、API 字段清单、SDK 速查、开源部署、官方资源
