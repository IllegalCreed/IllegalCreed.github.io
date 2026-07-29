---
layout: doc
---

# DeepSeek

DeepSeek（深度求索）推出的开源大语言模型家族，主打**MoE 架构 + 推理链（CoT）+ 极致性价比 + 开源权重**。代表性产品线两条：DeepSeek-V3 系列（通用大模型，671B 总参 / 37B 激活的 MoE，128K 上下文，对标 GPT-4o / Claude-3.5）和 DeepSeek-R1 系列（首个开源长 CoT 推理模型，对标 OpenAI o1）。当前官方 API 已演进到 V3.1「一模型两模式」（`deepseek-chat` 非思考 / `deepseek-reasoner` 思考，同一权重 `deepseek-ai/DeepSeek-V3.1`）以及 V3.2 / V4 系列（把 thinking 集成进 tool-use，模型 ID `deepseek-v4-flash` / `deepseek-v4-pro`，思考/非思考合并为单一模型 + `thinking` 开关，`reasoning_effort=high|max`）。整套权重在 Hugging Face 以 MIT（R1 代码 + 权重）或自有 Model License（V3 商用允许）开源，并配套 6 个蒸馏版（1.5B / 7B / 8B / 14B / 32B / 70B，800K 样本 SFT），其中 32B Distill 在 AIME 2024 反超 o1-mini。API 设计 100% 兼容 OpenAI SDK（换 `base_url=https://api.deepseek.com` + `api_key` 即用），同时提供 Anthropic 格式端点（`/anthropic`）与 Beta 功能端点（`/beta`，承载 FIM 填空补全与 Strict Function Calling）。特色能力包括：思考模式返回 `reasoning_content` CoT 字段、Context Caching（KV Cache on Disk，默认开启命中价约低 98%）、JSON Output、Function Calling（含 Strict 模式）、FIM 代码补全。R1 在 AIME 2024（79.8）、MATH-500（97.3）、Codeforces（Rating 2029，96.3 百分位）等数学/代码基准对标或略超 OpenAI o1-1217，但通用知识（MMLU/GPQA）与软件工程（SWE-Verified）仍逊于 o1 与 Claude-3.5-Sonnet。

## 评价

**优点**

- **开源权重 + 商用许可**：R1 代码 + 权重 MIT，V3 商用允许，支持私有化部署与再蒸馏（6 个 Distill 已发布）
- **推理能力顶尖**：R1 在数学（AIME 79.8）、代码（Codeforces 2029）对标 o1-1217，首个开源长 CoT 推理模型
- **API 零迁移成本**：100% 兼容 OpenAI SDK，换 `base_url` 即可，DeepSeek 专属参数走 `extra_body`
- **极致性价比**：训练成本 2.788M H800 GPU 小时（V3），API 定价远低于同档闭源；Context Caching 再砍 98%
- **思考链透明**：`reasoning_content` 字段独立返回 CoT，便于调试与可控推理
- **V3.1 Hybrid Inference**：一模型支持「思考 / 非思考」双模式，按场景动态切换
- **V3.2+ Thinking 集成 tool-use**：把推理链与工具调用打通，Agent 场景更稳；V3.2-Speciale 在 IMO/CMO/ICPC/IOI 2025 夺金
- **生态完备**：Hugging Face 权重 + vLLM/SGLang 推理方案 + OpenAI/Anthropic SDK 双兼容 + 蒸馏版覆盖 1.5B~70B

**缺点**

- **通用知识与软件工程并非最强**：R1 的 MMLU(90.8) < o1-1217(91.8)、GPQA(71.5) < o1(75.7)、SWE-Verified(49.2) < Claude-3.5-Sonnet(50.8)
- **思考模式采样参数失效**：`temperature` / `top_p` / `presence_penalty` / `frequency_penalty` 在 thinking 模式下不生效（官方仅为兼容旧软件保留入参）
- **Context Cache 非保证**：best-effort，TTL 几小时到几天，前缀稳定性影响命中率，非 100% 命中
- **JSON Output 偶发空内容**：官方承认已知问题，结构复杂时截断概率上升，需 `max_tokens` 兜底
- **FIM 与 Strict 仍是 Beta**：必须切 `/beta` base_url；FIM 限 `max_tokens` 4K；Strict Function Calling 不支持 `string` 的 `minLength/maxLength`、`array` 的 `minItems/maxItems` 等
- **671B 全量部署门槛高**：HuggingFace `transformers` 不直接支持，需走 DeepSeek-V3 仓库 + vLLM/SGLang 专用方案
- **License 分层不直观**：R1 代码+权重 MIT，但 V3 模型走自有 Model License，蒸馏版须叠加 Qwen2.5 / Llama-3.1 / Llama-3.3 上游 License

## 文档地址

- [DeepSeek 官方 API 文档](https://api-docs.deepseek.com/)
- [DeepSeek 定价](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek 思考模式指南](https://api-docs.deepseek.com/guides/thinking_mode)
- [DeepSeek Context Caching](https://api-docs.deepseek.com/guides/kv_cache)
- [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode)
- [DeepSeek FIM 填空补全](https://api-docs.deepseek.com/guides/fim_completion)
- [DeepSeek Function Calling](https://api-docs.deepseek.com/guides/tool_calls)

## GitHub地址

[deepseek-ai/DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) · [deepseek-ai/DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3) · [DeepSeek 官方主页](https://www.deepseek.com/)

## 幻灯片地址

<a href="/SlideStack/deepseek-slide/" target="_blank">DeepSeek</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">DeepSeek 测试题</a>
