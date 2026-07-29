---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 智谱 AI 官方文档（docs.bigmodel.cn）+ HuggingFace zai-org 开源仓库编写，对照 2026-07 主推的 GLM-5.2 行为

## 速查

- 主推旗舰：**GLM-5.2**（1M 上下文 / 128K 输出，介于 Claude Opus 4.7 与 4.8 之间）
- 上一代：**GLM-5.1**（200K，SWE-Bench Pro 58.4 超 GPT-5.4 / Opus 4.6 / Gemini 3.1 Pro）
- 中端在售：**GLM-4.7**（SWE-bench 73.8）/ **GLM-4.6**（对齐 Claude Sonnet 4，200K/128K）
- 普惠 / 调试：免费层 **glm-4.7-flash / glm-4-flash-250414 / glm-4v-flash / cogview-3-flash / cogvideox-flash**
- API 双端点：通用 `https://open.bigmodel.cn/api/paas/v4/chat/completions` vs Coding Plan 专属 `/api/coding/paas/v4`
- 认证：`Authorization: Bearer YOUR_API_KEY`，API Key 在 `bigmodel.cn/usercenter/proj-mgmt/apikeys`
- 模型 ID：`glm-5.2` / `glm-5.1` / `glm-5` / `glm-5-turbo` / `glm-4.7` / `glm-4.7-flash` / `glm-4.6` / `glm-4.5-air(x)` / `glm-4-long(1M)` / `glm-4-flash-250414`
- 特色字段：`thinking.type` = enabled|disabled、`reasoning_effort` = none|low|medium|high|max
- 内置工具：`web_search` / `retrieval` / MCP 工具调用、`tools` + `tool_choice`（OpenAI 风格 Function Calling）
- SDK：`pip install zai-sdk`（新，`ZhipuAiClient`）/ `zhipuai`（旧）/ Java `ai.z.openapi:zai-sdk:0.3.5`
- 开源部署：vLLM `--tool-call-parser glm47 --reasoning-parser glm45 --enable-auto-tool-choice` + SGLang EAGLE 投机解码
- 上下文阶梯：Air 128K → 4.6/4.7/5/5.1 200K → GLM-4-Long / GLM-5.2 **1M**

## GLM 是什么

GLM 是智谱 AI（Z.ai）自研的大语言模型家族，走 **MoE 混合专家 + 深度思考可控 + MIT 开源** 的差异化路线。它的核心定位有三：

- **国产合规基座**：智谱自研、国内合规调用，中文场景体验好
- **ARC 三能力融合**：Agentic + Reasoning + Coding 在同一模型原生支持
- **OpenAI 兼容 + 特色字段**：迁移成本最低，`thinking` / `reasoning_effort` / MCP 提供 GLM 差异化能力

> GLM ≠ OpenAI 1:1 等价。`thinking.type` / `reasoning_effort` / `web_search` / `retrieval` / MCP 等是 GLM 特色字段，标准 OpenAI SDK 不一定识别。

## 模型矩阵速览

| 类型 | 代表模型 | 用途 |
| --- | --- | --- |
| **文本（旗舰）** | glm-5.2 / 5.1 / 5 / 5-turbo | 长任务 / Agent / 编码 |
| **文本（中端）** | glm-4.7 / 4.7-flash / 4.6 | 日常生产、性价比 |
| **文本（普惠）** | glm-4.5-air(x) / glm-4-long(1M) / glm-4-flash-250414 | 高并发、调试 |
| **视觉多模态** | glm-5v-turbo / 4.6v / 4.6v-flash | 图像理解、多模态 Coding |
| **OCR / 文档** | glm-ocr | PDF / 文档识别（单图 ≤10MB / PDF ≤100 页） |
| **文生图** | glm-image / cogview-4 | 图像生成 |
| **视频** | cogvideox-3 / vidu-q1 | 视频生成 |
| **语音** | glm-tts / glm-tts-clone / glm-asr-2512 / glm-realtime / glm-4-voice | 语音合成 / 识别 / 实时 |
| **Agent 浏览器** | autoglm-phone | 手机 / 浏览器自动化 |
| **向量与检索** | embedding-3 / embedding-2(8K) / rerank(4K) | RAG / 检索增强 |
| **角色 / 情感** | charglm-4 / emohaa | 角色扮演、情感陪伴 |

> GLM 全模型矩阵**按模态分工**，不存在「一模型打天下」。文本模型无视觉通道，硬接图像或 PDF 会失败。

## MoE 参数规模

| 模型 | 总参数 | 激活参数 | 备注 |
| --- | --- | --- | --- |
| GLM-4.5 | 355B | 32B | 开源 MIT，2025 旗舰 |
| GLM-4.5-Air | 106B | 12B | 轻量版，FP8 部署仅需 H100×2 |
| GLM-4.7-Flash | 30B | 3B | 免费层主力 |
| **GLM-5** | **744B** | **40B** | 预训练 28.5T，集成 DeepSeek Sparse Attention + Slime 异步 RL |
| GLM-5.1 | 744B | 40B | 单次任务可自主工作 8 小时 |
| GLM-5.2 | 744B | 40B | **1M 上下文 / 128K 输出**，长任务时代旗舰 |

## 上下文与输出阶梯

| 模型档位 | 上下文 | 最大输出 |
| --- | --- | --- |
| Air 系列 | 128K | 96K |
| 4.6 / 4.7 / 5 / 5.1 | 200K | 128K |
| GLM-4-Long / GLM-5.2 | **1M** | 128K |

> 启用 Context Cache 承载长对话 / 项目级工程上下文，重复长前缀不缓存会重复计费且延迟翻倍。

## API base URL 双端点

- **标准 PaaS**：`https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **Coding Plan 专属**：`https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`（Claude Code / Cline / Roo Code / Kilo Code 接入端点，享优先保障）

> 通用 Agent 场景（非 Coding Agent）走标准 PaaS，官方明确采用「次级调度 + 尽力交付」策略，高峰期可能降级。

## 一次最小调用

```bash
curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer $BIGMODEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.2",
    "messages": [
      {"role": "system", "content": "你是资深前端工程师"},
      {"role": "user", "content": "用三句话介绍 GLM"}
    ],
    "thinking": {"type": "enabled"},
    "reasoning_effort": "medium",
    "temperature": 0.7,
    "stream": false
  }'
```

## Python SDK 三件套

```bash
# 推荐：新 SDK
pip install zai-sdk
```

```python
# zai-sdk（新，推荐）
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="YOUR_API_KEY")
resp = client.chat.completions.create(
    model="glm-5.2",
    messages=[{"role": "user", "content": "用 TypeScript 写一个防抖函数"}],
    thinking={"type": "enabled"},
    reasoning_effort="high",
)
print(resp.choices[0].message.content)
```

```python
# zhipuai（旧 SDK，仍可用）
from zhipuai import ZhipuAI
client = ZhipuAI(api_key="YOUR_API_KEY")
```

## Coding Plan 套餐

| 套餐 | 价格 | 配额 | 并发 |
| --- | --- | --- | --- |
| **Lite** | ¥20/月 | 约 120 prompts/天 | 10 |
| **Pro** | ¥100/月 | 约 600 prompts/天 | 30 |

> Coding Plan 直接对接 Claude Code / Cline / Roo Code / Kilo Code；这些 Coding Agent 任务享优先保障，通用 Agent 工具走次级调度。

## finish_reason 取值

| 取值 | 含义 |
| --- | --- |
| `stop` | 正常结束 |
| `tool_calls` | 触发工具调用 |
| `length` | 达到 max_tokens |
| `sensitive` | 因敏感内容中止（**GLM 特色**） |
| `network_error` | 网络错误 |

> 别期待 GLM 完全绕过中文内容审核，涉政 / 违规内容会被 `finish_reason: sensitive` 截断。

## 下一步

- [模型矩阵与对比](./guide-line.md)：各代基座深度对比、Coding/Agent 场景选型、反模式
- [参考](./reference.md)：完整模型表、API 字段清单、SDK 速查、开源部署、官方资源
