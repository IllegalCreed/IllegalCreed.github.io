---
layout: doc
---

# GLM

GLM 是**智谱 AI（Z.ai）**自研的国产大语言模型家族，覆盖 GLM-5.2 / 5.1 / 5 / 4.7 / 4.6 / 4.5-Air 等基座，定位「**Agentic + Reasoning + Coding 三能力原生融合**」。它走「**MoE 混合专家 + 深度思考可控 + MIT 开源**」的差异化路线：GLM-5 总参数 744B、激活 40B，预训练 28.5T tokens，集成 DeepSeek Sparse Attention 与 Slime 异步强化学习；GLM-5.2 把上下文推到 **1M tokens**、最大输出 128K，对标 Claude Opus 4.7~4.8。API 走智谱开放平台 **BigModel**（`open.bigmodel.cn/api/paas/v4/chat/completions`），结构兼容 OpenAI Chat Completions，并保留 `thinking.type` / `reasoning_effort` / `web_search` / `retrieval` / MCP 等 GLM 特色字段；编码场景另有专属端点 `coding/paas/v4` 对接 Claude Code / Cline / Roo Code / Kilo Code。

## 评价

**优点**

- **三能力融合（ARC）**：Agentic + Reasoning + Coding 同一模型原生支持，区别于纯编码或纯推理模型
- **国产合规**：智谱自研，国内调用无墙、合规走国内云，中文场景体验好
- **深度思考可控**：`thinking.type` 开关 + `reasoning_effort` 五档（none/low/medium/high/max）按任务调推理强度
- **长上下文 1M**：GLM-5.2 / GLM-4-Long 承载整工程仓库级上下文，配合 Context Cache 不重复计费
- **MIT 开源**：HuggingFace `zai-org/GLM-4.5/4.5-Air/5/5.2` 全权重放出来，BF16 + FP8 都有，可商用
- **OpenAI 兼容**：`messages` / `tools` / `stream` / `temperature` 结构对齐，迁移成本最低
- **多模态分工细**：GLM-5V-Turbo / 4.6V（视觉）、GLM-OCR（文档）、CogView-4 / GLM-Image（图）、CogVideoX-3 / Vidu（视频）、GLM-TTS / ASR / Realtime（语音）、Embedding-3 / Rerank（检索）
- **编码套餐便宜**：Coding Plan Lite ¥20/月、Pro ¥100/月，对接 Claude Code 等编码框架享优先保障
- **基准对标硬**：GLM-5.1 SWE-Bench Pro 58.4 超 GPT-5.4/Claude Opus 4.6/Gemini 3.1 Pro；GLM-5.2 FrontierSWE 仅落后 Opus 4.8 约 1%、超 GPT-5.5

**缺点**

- **与顶尖仍有差距**：官方明说对标 Claude Opus 4.5~4.8 / Sonnet 4 与 GPT-5.x，**而非最新旗舰**；GLM-4.5 相比 Claude-4-Sonnet 自承仍有提升空间
- **通用 Agent 走次级调度**：非 Coding Agent 场景采用「次级调度 + 尽力交付」，高峰期可能降级
- **中文审核较严**：`finish_reason: sensitive` 表示因敏感内容中止，海外模型那种宽松度做不到
- **GLM 特色字段非标准**：`thinking` / `reasoning_effort` / `web_search` / MCP 不被标准 OpenAI SDK 识别，需 `zai-sdk` 或显式透传
- **本地部署门槛高**：GLM-4.5 BF16 全 128K 上下文需 H100×32、GLM-5（744B）更高，必须 FP8 + 投机解码才经济
- **生命周期复杂**：GLM-4.5 / 4.5-X 即将下线、GLM-Z1 系列 2025-11-15 下线、GLM-4-0520 2025-12-30 下线，生产需主动迁移
- **模态分工即陷阱**：文本模型（glm-5/4.6）无视觉/音频通道，硬接图像或 PDF 会失败

## 文档地址

- [智谱 BigModel 总入口](https://docs.bigmodel.cn/cn/guide/start/model-overview)
- [GLM-5 / 5.1 / 5.2 模型说明](https://docs.bigmodel.cn/cn/guide/models/text/glm-5)
- [API 对话补全](https://docs.bigmodel.cn/cn/api/introduction)
- [HuggingFace 开源权重 zai-org](https://huggingface.co/zai-org/GLM-5)

## GitHub地址

[zai-org/GLM-4.5](https://github.com/zai-org/GLM-4.5) · [zai-org（HuggingFace）](https://huggingface.co/zai-org)

## 幻灯片地址

<a href="/SlideStack/glm-slide/" target="_blank">GLM</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">GLM 测试题</a>

