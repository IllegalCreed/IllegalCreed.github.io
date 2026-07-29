---
layout: doc
---

# MiniMax

MiniMax 是**国内头部通用大模型厂商**（MiniMax 爱稀音 / 海螺 AI 母公司）自研的多模态大模型家族，主打「**超长上下文 + 闪电注意力 + 全模态 + 海螺 AI/MiniMax 开放平台双产品**」。当前旗舰 **MiniMax-M3（2026-06）** 提供 **1M token 上下文**，原生支持 Agent 推理、Tool Use、Interleaved Thinking（交错思考）、代码与多模态；开源旗舰 **MiniMax-Text-01（2025-01）** 为 456B 总参 / 45.9B 激活 MoE，配合自研 **Lightning Attention（闪电注意力）**，训练 1M、推理可外推至 4M。模型体系覆盖「**语言（M 系列）/ 语音（Speech 系列）/ 视频（Hailuo 系列）/ 图像（image 系列）/ 音乐（Music 系列）**」五大模态，B 端通过 **MiniMax 开放平台**（国内版 `platform.minimaxi.com` / 国际版 `platform.minimax.io`）对外输出 API，C 端产品品牌为「**海螺 AI**」。

## 评价

**优点**

- **超长上下文 1M**：MiniMax-M3 原生支持 **1,000,000 token** 上下文，承载整工程仓库 / 长会话 / 多步 Agent 任务
- **Lightning Attention**：MiniMax-01 自研混合注意力机制，超长序列推理显著加速，4M 推理外推不崩
- **MoE 架构经济**：MiniMax-Text-01 为 456B 总参 / 每 token 激活 **45.9B**，推理算力远低于 Dense 同规模
- **全模态覆盖**：语言 + 语音（T2A / Realtime）+ 视频（Hailuo）+ 图像 + 音乐，单一厂商一站式
- **超拟人语音**：Speech-2.8 系列独有 22 种语气词标签（`(laughs)` / `(sighs)` / `(crying)` 等），TTS 自然度行业前列
- **Realtime API 端到端**：HTTP + WebSocket 双协议，**全双工对话延迟 < 250ms**，端到端语音方案
- **Anthropic 兼容**：M3 提供 `/anthropic/v1/messages` 兼容端点，原生支持 `thinking` 块与 Interleaved Thinking
- **开源可自部署**：MiniMax-Text-01 / VL-01 在 HuggingFace / GitHub 全权重开源，可商用
- **国产合规**：国内调用无墙、合规走国内云，中文场景体验好
- **性价比突出**：第三方基准显示 M3 价格约为 Claude Opus 的 **1/8~1/10**，benchmark 略低但高并发场景性价比突出（具体定价以官方计费页为准）

**缺点**

- **闭源旗舰仅 API**：M 系列商业版（M1~M3）不开源，仅能通过开放平台 API 调用，无法自部署
- **生态弱于海外头部**：相比 GPT / Claude，第三方 SDK / 工具链 / 教程相对少，社区偏中文圈
- **音色克隆门槛**：临时音色 7 天内未调用即被系统删除，且需个人/企业认证才有复刻权限
- **同步 TTS 有字符上限**：t2a_v2 同步 HTTP/WebSocket 单次上限 10000 字符，超长文本必须切到异步接口
- **M3 客户端显示 bug**：Anthropic 兼容端点会显示 200K 上下文（实际 1M，需请求中正确设置，见 GitHub Issue #46）
- **官方未直接对比 GPT/Claude**：SWE-Bench Pro 等基准数据多来自第三方测评，无官方对比报告
- **abab 命名遗留**：旧 abab6.5 命名仍出现在第三方云（阿里云百炼等）中，易与 M 系列混淆
- **多模态分工细即陷阱**：Hailuo / image / Music 等模态独立接口，跨模态串联需自行编排

## 文档地址

- [MiniMax 开放平台（国内版）](https://platform.minimaxi.com/)
- [API 接口概览](https://platform.minimaxi.com/docs/api-reference/api-overview)
- [MiniMax API Docs（国际版）](https://platform.minimax.io/docs/api-reference/api-overview)
- [Tool Use 指南](https://platform.minimax.io/docs/guides/text-m3-function-call)

## GitHub 地址

- [MiniMax-AI/MiniMax-01](https://github.com/MiniMax-AI/MiniMax-01)（456B 总参 / 45.9B 激活 MoE / Lightning Attention / 开源）
- [MiniMax-01 技术论文 arXiv:2501.08313](https://arxiv.org/abs/2501.08313)《MiniMax-01: Scaling Foundation Models with Lightning Attention》

## 访问方式

| 方式 | 适合 | 入口 |
| --- | --- | --- |
| **MiniMax 开放平台 API（国内）** | 开发者 / 应用集成 / 国内合规 | `platform.minimaxi.com`（端点 `api.minimaxi.com`） |
| **MiniMax API（国际版）** | 海外开发者 / 跨境业务 | `platform.minimax.io`（端点 `api.minimax.io`） |
| **海螺 AI（C 端）** | 网页 / App 对话 | `hailuoai.com` / 海螺 AI App |
| **Anthropic 兼容端点** | Agent 推理 / Tool Use（官方推荐 M3 走此路） | `/anthropic/v1/messages` |
| **OpenAI 兼容端点** | 从 OpenAI SDK 平迁 | `/v1/chat/completions` |
| **官方 MCP 服务器** | Claude Code / MCP 客户端 | Python / JS 版模型上下文协议服务 |
| **HuggingFace 自部署** | 离线 / 私有部署（仅 01 系列） | `huggingface.co/MiniMaxAI` |

## 推荐资源

- [MiniMax 官网 / 海螺 AI](https://www.minimaxi.com/)
- [开放平台文档中心](https://platform.minimaxi.com/docs)
- [MiniMax-01 GitHub](https://github.com/MiniMax-AI/MiniMax-01)
- [技术论文 arXiv](https://arxiv.org/abs/2501.08313)
- [HuggingFace 开源权重](https://huggingface.co/MiniMaxAI/MiniMax-Text-01)
- [计费 / 价格](https://platform.minimaxi.com/user-center/billing)

## 幻灯片地址

<a href="/SlideStack/minimax-slide/" target="_blank">MiniMax</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">MiniMax 测试题</a>
