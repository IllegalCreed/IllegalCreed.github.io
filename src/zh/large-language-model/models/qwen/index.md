---
layout: doc
---

# Qwen

阿里通义千问（Qwen）是阿里巴巴达摩院 / 通义实验室推出的**开源大语言模型家族**，2025-04 发布第三代主线 **Qwen3**（Dense 6 款 + MoE 旗舰 235B-A22B），同年 7 月扩展编程旗舰 **Qwen3-Coder-480B-A35B-Instruct**（原生 256K，YaRN 外推至 1M），并迭代 2507 版（Thinking-2507 / Instruct-2507）。**开源权重全系列 Apache 2.0**，可自由商用与二次微调；与之并行的**闭源旗舰 Qwen3-Max / Qwen3.7-Max / Plus / Flash** 仅通过阿里云百炼 DashScope API 调用。Qwen3 三大差异化标签：**混合思考模式（thinking on/off 一档开关 + thinking_budget 精控）**、**119 种语言原生支持（覆盖九大语系）**、**Qwen-Agent 框架内置函数调用 + MCP 集成**。开发态主力接入方式为阿里云百炼平台的 **OpenAI 兼容接口**（`compatible-mode/v1/chat/completions`），直接复用 OpenAI SDK 生态，迁移成本接近 0。

::: tip 与 GPT / Claude / Gemini 对比的核心差异

- **Qwen 强在开源旗舰 + 商用友好**：Apache 2.0 + MoE 235B-A22B 可本地部署，权重可下载微调（GPT / Claude / Gemini 闭源）
- **Qwen 强在混合思考模式开关**：`enable_thinking` + `thinking_budget` 一档参数精控思维链成本（GPT o-series 不可调；Claude / Gemini 思考不可关）
- **Qwen 强在多语言**：原生 119 种语言，中文 / 阿拉伯 / 印度语系表现优秀（GPT 强在英文主导）
- **Qwen 弱在闭源旗舰**：Qwen3-Max / Qwen3.7-Max 万亿级闭源仅 API，需走百炼国际版 / 国内版鉴权
- **Qwen 弱在生态**：第三方教程 / 工具数量仍少于 OpenAI，但 Qwen-Agent + MCP 补齐 Agent 主链路

:::

## 评价

**优点**

- **开源旗舰 + Apache 2.0**：Qwen3-235B-A22B 全量权重开源，可商用 / 可微调，业界最强势开源 MoE 之一
- **混合思考模式一档开关**：`enable_thinking` 全局开 / 关 + `/think` `/no_think` 逐轮软切换 + `thinking_budget` token 预算精控——成本与质量可按场景精细平衡
- **MoE 性价比高**：Qwen3-30B-A3B（总参 300 亿 / 激活 30 亿）推理成本接近 8B Dense，质量逼近 30B Dense
- **多语言 119 种**：原生覆盖印欧 / 汉藏 / 闪含 / 南岛 / 达罗毗荼 / 突厥 / 壮侗 / 乌拉尔 / 南亚九大语系
- **OpenAI 兼容**：`compatible-mode/v1/chat/completions` 端点直接复用 OpenAI SDK，迁移成本接近 0
- **Qwen-Agent 框架**：内置 BaseChatModel / BaseTool / Assistant 三层抽象 + MCP 集成 + nous 模板，省去手写 ReAct prompt
- **Qwen3-Coder 编程旗舰**：480B MoE（35B 激活）+ 256K 原生上下文 + YaRN 1M 扩展，SWE-bench 开源 SOTA
- **国内合规友好**：阿里云百炼平台国内可直连，无需翻墙，符合国内备案要求

**缺点**

- **过度思考通病**：Qwen3.5 系列（thinking 子代）思维链有过度发散倾向，需用 `thinking_budget` 显式限制
- **API 命名分裂**：OpenAI 兼容 / Responses / Anthropic 兼容 / DashScope 原生四种端点，参数语义不完全一致
- **百炼国际版 / 国内版双轨**：`DASHSCOPE_API_KEY` 国际站与国内站不通用，模型 ID 也有差异（如 `qwen3-coder-480b-a35b-instruct` 国际专用）
- **闭源旗舰不开放权重**：Qwen3-Max / Qwen3.7-Max 万亿级闭源，仅 API，区别于开源 235B-A22B
- **生态资源少于海外厂商**：第三方教程 / 案例数量少于 OpenAI / Anthropic，国内文档为主
- **思考模式参数组合敏感**：贪婪解码（`temperature=0`）会卡死，必须按官方推荐 `temperature=0.6 / top_p=0.95 / top_k=20`，错配即崩
- **Function Calling 限制严**：工具名仅允许字母 / 数字 / 下划线 / 短划线，长度 ≤ 64 token，中文 / 点号 / 空格会被拒

## 文档地址

- [Qwen3 官方博客](https://qwenlm.github.io/blog/qwen3/)
- [阿里云百炼帮助中心 · 首次调用千问 API](https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen)
- [阿里云百炼 · OpenAI 兼容 Chat Completions](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)
- [Qwen-Agent GitHub](https://github.com/QwenLM/Qwen-Agent)
- [Qwen3-Coder HuggingFace 模型卡](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct)

## GitHub 地址

[QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) · [QwenLM/Qwen3](https://github.com/QwenLM/Qwen3) · [QwenLM/Qwen2.5-Math](https://github.com/QwenLM/Qwen2.5-Math)

## 主力模型矩阵（2026）

### 开源 Dense（Apache 2.0）

| 模型 | 上下文 | 用途 |
| --- | --- | --- |
| `Qwen3-0.6B` | 32K | 边缘设备 / 极简任务 |
| `Qwen3-1.7B` | 32K | 移动端 / 低延迟 |
| `Qwen3-4B` | 32K | 嵌入式 / 客户端推理 |
| `Qwen3-8B` | 128K | 通用入门生产 |
| `Qwen3-14B` | 128K | 通用中阶 |
| `Qwen3-32B` | 128K | 通用高阶（开源 Dense 旗舰） |

### 开源 MoE（Apache 2.0）

| 模型 | 总参 / 激活 | 上下文 | 用途 |
| --- | --- | --- | --- |
| `Qwen3-30B-A3B` | 300 亿 / 30 亿（128 专家 8 激活） | 128K | 性价比首选 |
| `Qwen3-235B-A22B` | 2350 亿 / 220 亿（94 层 / 128 专家 8 激活） | 128K | 开源旗舰 |
| `Qwen3-Coder-480B-A35B-Instruct` | 4800 亿 / 350 亿 | 256K（YaRN→1M） | 编程 SOTA |
| `Qwen3-Next-80B-A3B` | 800 亿 / 30 亿（Hybrid Attention + 极致稀疏 MoE） | 128K | 稀疏架构实验 |

### 闭源旗舰（仅 API）

| 模型 | 定位 |
| --- | --- |
| `qwen3.7-max` | 2026 最新旗舰（订阅 / 按 token） |
| `qwen3.7-plus` / `qwen3.7-flash` | 中阶 / 高并发 |
| `qwen3-max` / `qwen3-max-thinking` | 万亿级（上一代主力） |
| `qwen3.5-omni-plus` | 全模态（图 / 音 / 视频） |
| `qwen3-coder-480b-a35b-instruct` | 编程旗舰（百炼专属） |

## 幻灯片地址

<a href="/SlideStack/qwen-slide/" target="_blank">Qwen</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Qwen 测试题</a>
