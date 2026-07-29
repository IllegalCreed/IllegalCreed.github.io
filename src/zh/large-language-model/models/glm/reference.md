---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 智谱 AI 官方文档（docs.bigmodel.cn）+ HuggingFace zai-org 开源仓库编写，对照 2026-07 GLM-5.2 行为

## 速查

- 当前旗舰：**GLM-5.2**（2026-06-16 上线，1M 上下文 / 128K 输出，介于 Opus 4.7 与 4.8 之间）
- 中端在售：**GLM-4.7**（SWE-bench 73.8）/ **GLM-4.6**（对齐 Claude Sonnet 4）
- 即将下线：**GLM-4.5 / 4.5-X**（迁 4.7）；已下线：GLM-Z1 系列（2025-11-15）、GLM-4-0520（2025-12-30）
- API base URL：通用 `https://open.bigmodel.cn/api/paas/v4/chat/completions`；Coding `/api/coding/paas/v4`
- 认证：`Authorization: Bearer YOUR_API_KEY`
- 特色字段：`thinking.type` = enabled|disabled、`reasoning_effort` = none|low|medium|high|max
- 内置工具：`web_search` / `retrieval` / MCP；`tools` + `tool_choice`（OpenAI Function Calling）
- SDK：`pip install zai-sdk`（新）/ `zhipuai`（旧）/ Java `ai.z.openapi:zai-sdk:0.3.5`
- 开源部署：vLLM `--tool-call-parser glm47 --reasoning-parser glm45 --enable-auto-tool-choice`
- 开源许可：MIT（权重）/ Apache-2.0（代码），HuggingFace `zai-org/GLM-4.5/4.5-Air/5/5.2`
- 完整说明见 [入门](./getting-started.md) / [模型矩阵与场景选型](./guide-line.md)

## 完整模型矩阵

### 文本模型

| 模型 ID | 上下文 | 最大输出 | 状态 / 用途 |
| --- | --- | --- | --- |
| `glm-5.2` | **1M** | 128K | 旗舰，长任务时代 |
| `glm-5.1` | 200K | 128K | SWE-Bench Pro 58.4 |
| `glm-5` | 200K | 128K | 744B / 40B 激活，对标 Opus 4.5 |
| `glm-5-turbo` | 128K | 16K | 5 系提速版 |
| `glm-4.7` | 200K | 128K | SWE-bench 73.8 |
| `glm-4.7-flash` | 128K | 4K | **免费**，2026-01-19 上线 |
| `glm-4.6` | 200K | 128K | 对齐 Claude Sonnet 4 |
| `glm-4.5-air` / `glm-4.5-airx` | 128K | 96K | **即将下线**，迁 4.7 |
| `glm-4-long` | **1M** | 16K | 长文档处理 |
| `glm-4-flash-250414` | 128K | 4K | **免费** |

### 视觉 / 多模态

| 模型 ID | 用途 |
| --- | --- |
| `glm-5v-turbo` | 多模态 Coding 基座 |
| `glm-4.6v` / `glm-4.6v-flash` | 图像理解（含免费层） |
| `glm-ocr` | PDF / 文档识别（单图 ≤10MB / PDF ≤100 页） |
| `autoglm-phone` | 手机 / 浏览器自动化 |

### 图 / 视频 / 语音

| 类型 | 模型 ID |
| --- | --- |
| 文生图 | `glm-image` / `cogview-4` / `cogview-3-flash`（免费） |
| 视频 | `cogvideox-3` / `vidu-q1` / `cogvideox-flash`（免费） |
| 语音合成 | `glm-tts` / `glm-tts-clone` |
| 语音识别 | `glm-asr-2512` |
| 实时语音 | `glm-realtime` / `glm-4-voice` |

### 向量 / 检索 / 角色

| 类型 | 模型 ID |
| --- | --- |
| 向量 | `embedding-3`（默认）/ `embedding-2`（8K） |
| 重排 | `rerank`（4K） |
| 角色 | `charglm-4` |
| 情感 | `emohaa` |

## MoE 参数规模对照

| 模型 | 总参数 | 激活 | 预训练 tokens | 备注 |
| --- | --- | --- | --- | --- |
| GLM-4.5 | 355B | 32B | 15T | MIT 开源 |
| GLM-4.5-Air | 106B | 12B | - | FP8 部署 H100×2 |
| GLM-4.7-Flash | 30B | 3B | - | 免费层 |
| GLM-5 / 5.1 / 5.2 | **744B** | **40B** | **28.5T** | DeepSeek Sparse Attention + Slime 异步 RL |

## API 字段速查

### 请求体（Chat Completions）

| 字段 | 类型 | 取值 | 备注 |
| --- | --- | --- | --- |
| `model` | string | `glm-5.2` 等 | 必填 |
| `messages` | array | OpenAI 风格 | system / user / assistant / tool |
| `temperature` | number | 0–1 | 默认 0.7 |
| `top_p` | number | 0–1 | 默认 0.7 |
| `max_tokens` | int | - | 最大输出 |
| `stream` | bool | true/false | 流式 |
| `tools` | array | OpenAI Function Calling 风格 | 工具定义 |
| `tool_choice` | string/object | `auto` / `none` / 指定 | 工具选择策略 |
| `thinking` | object | `{"type":"enabled"}` / `{"type":"disabled"}` | **GLM 特色**，深度思考开关 |
| `reasoning_effort` | string | `none` / `low` / `medium` / `high` / `max` | **GLM 特色**，推理强度档位 |
| `web_search` | bool/object | true/false | **GLM 特色**，内置联网搜索 |
| `retrieval` | object | - | **GLM 特色**，内置检索 |

### 响应体（finish_reason）

| 取值 | 含义 |
| --- | --- |
| `stop` | 正常结束 |
| `tool_calls` | 触发工具调用 |
| `length` | 达到 max_tokens |
| `sensitive` | **GLM 特色**，因敏感内容中止 |
| `network_error` | 网络错误 |

## 认证与端点

- **API Key 管理**：`bigmodel.cn/usercenter/proj-mgmt/apikeys`
- **认证方式**：HTTP Bearer Token，`Authorization: Bearer YOUR_API_KEY`
- **通用 PaaS**：`https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **Coding Plan 专属**：`https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`
- **结构兼容**：OpenAI Chat Completions（messages / tools / stream / temperature）

> 结构兼容降低迁移成本，但 `thinking` / `reasoning_effort` / `web_search` / `retrieval` / MCP 才是 GLM 的差异化能力来源。

## SDK 速查

### Python：zai-sdk（新，推荐）

```bash
pip install zai-sdk
```

```python
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="YOUR_API_KEY")
resp = client.chat.completions.create(
    model="glm-5.2",
    messages=[{"role": "user", "content": "用 TypeScript 写一个防抖函数"}],
    thinking={"type": "enabled"},
    reasoning_effort="high",
    stream=True,
)
for chunk in resp:
    print(chunk.choices[0].delta.content, end="")
```

### Python：zhipuai（旧）

```python
from zhipuai import ZhipuAI
client = ZhipuAI(api_key="YOUR_API_KEY")
```

### Java

```xml
<dependency>
  <groupId>ai.z.openapi</groupId>
  <artifactId>zai-sdk</artifactId>
  <version>0.3.5</version>
</dependency>
```

### OpenAI SDK 兼容接入

```python
from openai import OpenAI
client = OpenAI(
    api_key="YOUR_BIGMODEL_API_KEY",
    base_url="https://open.bigmodel.cn/api/paas/v4",
)
# 注意：thinking / reasoning_effort 等 GLM 特色字段需手动透传
```

## 开源部署速查

### vLLM（推荐）

```bash
vllm serve zai-org/GLM-4.5-FP8 \
  --tool-call-parser glm47 \
  --reasoning-parser glm45 \
  --enable-auto-tool-choice \
  --max-model-len 131072
```

### SGLang（高吞吐）

```bash
# 启用 EAGLE 投机解码提速
python -m sglang.launch_server \
  --model-path zai-org/GLM-4.5-FP8 \
  --spec-algorithm EAGLE
```

### 显存预估

| 权重 | GLM-4.5 全 128K | GLM-4.5-Air FP8 |
| --- | --- | --- |
| BF16 | H100 × 32 | H100 × 4 |
| **FP8** | **H100 × 16** | **H100 × 2** |

### 微调

| 工具 | 适用 |
| --- | --- |
| **LLaMA-Factory** | LoRA / QLoRA / 全参 |
| **Swift**（ms-swift） | LoRA / DPO |

## 开源许可

- **MIT**（模型权重）：HuggingFace `zai-org/GLM-4.5` / `GLM-4.5-Air` / `GLM-5` / `GLM-5.2`
- **Apache-2.0**（代码部分）
- 含 BF16 + FP8 版本
- 支持商用

## 生命周期与版本变化

### 当前主推（2026-07）

- **GLM-5.2**（2026-06-16 上线，1M 上下文，介于 Opus 4.7 与 4.8 之间）
- **GLM-5.1**（200K，SWE-Bench Pro 58.4）
- **GLM-5**（200K，对标 Opus 4.5）
- **GLM-4.7**（SWE-bench 73.8）/ **GLM-4.6**（对齐 Sonnet 4）

### 即将下线

- **GLM-4.5** / **GLM-4.5-X** → 迁移到 **GLM-4.7** 或 GLM-5.x
- **GLM-Z1 系列**（2025-11-15 已下线）
- **GLM-4-0520**（2025-12-30 已下线）

### 免费层

- `glm-4.7-flash`（2026-01-19 上线）
- `glm-4-flash-250414`
- `glm-4v-flash`
- `glm-4.6v-flash`
- `cogview-3-flash`
- `cogvideox-flash`

### 基准对标阶梯

| 模型 | 对标 | 关键基准 |
| --- | --- | --- |
| GLM-4.6 | Claude Sonnet 4 | 200K / 128K |
| GLM-5 | Claude Opus 4.5 | 744B / 40B 激活，预训练 28.5T |
| GLM-5.1 | Opus 4.6 | SWE-Bench Pro 58.4（超 GPT-5.4 / Opus 4.6 / Gemini 3.1 Pro） |
| GLM-5.2 | 介于 Opus 4.7 / 4.8 | FrontierSWE 落后 Opus 4.8 ~1%、超 GPT-5.5 ~1% |

## Coding Plan 套餐

| 套餐 | 价格 | 配额 | 并发 |
| --- | --- | --- | --- |
| **Lite** | ¥20/月 | 约 120 prompts/天 | 10 |
| **Pro** | ¥100/月 | 约 600 prompts/天 | 30 |

> Coding Agent（Claude Code / Cline / Roo Code / Kilo Code）享优先保障；通用 Agent 工具走次级调度与尽力交付。

## 官方资源

- 文档总入口：[https://docs.bigmodel.cn/cn/guide/start/model-overview](https://docs.bigmodel.cn/cn/guide/start/model-overview)
- GLM-5 模型说明：[https://docs.bigmodel.cn/cn/guide/models/text/glm-5](https://docs.bigmodel.cn/cn/guide/models/text/glm-5)
- API 对话补全：[https://docs.bigmodel.cn/cn/api/introduction](https://docs.bigmodel.cn/cn/api/introduction)
- API Key 管理：[https://bigmodel.cn/usercenter/proj-mgmt/apikeys](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)
- GitHub 开源：[https://github.com/zai-org/GLM-4.5](https://github.com/zai-org/GLM-4.5)
- HuggingFace 权重：[https://huggingface.co/zai-org/GLM-5](https://huggingface.co/zai-org/GLM-5)
- zai-sdk（Python 新）：`pip install zai-sdk`
- Java SDK：`ai.z.openapi:zai-sdk:0.3.5`
- Coding Plan 套餐：[https://open.bigmodel.cn/pricing](https://open.bigmodel.cn/pricing)

## 与主流大模型对比

| 维度 | GLM-5.2 | Claude Opus 4.8 | GPT-5.5 | Gemini 3.x |
| --- | --- | --- | --- | --- |
| 国产合规 | ✅ | ❌ | ❌ | ❌ |
| 上下文 | **1M** | 200K~1M | 256K~1M | 1M~2M |
| FrontierSWE | 落后 Opus 4.8 ~1% | 基准 | 落后 GLM-5.2 ~1% | - |
| 中文场景 | ✅ 强 | 一般 | 一般 | 一般 |
| 内容审核 | 较严（`sensitive`） | 适中 | 适中 | 适中 |
| 开源 | ✅ MIT | ❌ | ❌ | ❌ |
| Coding Plan | ¥20~100/月 | $20~200/月 | $20~200/月 | $20~200/月 |

> GLM ≠ OpenAI 1:1 等价。`thinking` / `reasoning_effort` / `web_search` / MCP 等 GLM 特色字段是迁移时必须保留的差异化能力。
