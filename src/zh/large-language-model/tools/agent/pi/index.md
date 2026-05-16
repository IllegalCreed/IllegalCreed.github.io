---
layout: doc
---

# Pi

Mario Zechner（libGDX 框架创始人）开源的极简 AI 编码 Agent ——「**Minimal coding agent harness**」。最大亮点是**少**：仅 4 个核心工具（read / write / edit / bash）+ 不到 1000 token 的系统提示词，反对「臃肿一切」的 Agent 设计哲学。MIT 开源，**25+ LLM provider** 任选（Anthropic / OpenAI / Google / DeepSeek / 本地 Ollama 均可），通过 TypeScript 扩展系统而非内置功能堆叠满足多样需求。2026 年 4 月被 [Earendil](https://earendil.works/) 公司收编但**核心保持 MIT 永远不变**。

::: warning 命名歧义说明

「Pi」这个名字在 AI / 科技领域指代很多东西，本笔记**仅指 Mario Zechner 创建的 Pi coding agent**（github.com/earendil-works/pi，npm `@earendil-works/pi-coding-agent`）。

容易混淆的同名物：

- **Inflection AI 的 Pi**（pi.ai）：聊天助手，2023 年由 Mustafa Suleyman 创立的对话产品，与本笔记无关。
- **Raspberry Pi**：开源单板电脑，硬件项目，与本笔记无关。
- **Pi Network**：移动端加密货币应用，与本笔记无关。
- **Anthropic Managed Agents / harness engineering**：Anthropic 官方的 managed agent 基础设施（session / harness / sandbox 三层架构）。Pi 仅是把 Anthropic 模型作为多个 provider 之一接入，**不属于 Anthropic 内部工程**。

如果你听到「Anthropic 的 Pi」或「Pi-Agent」想到 Anthropic 内部 harness，那是误传——Anthropic 自家叫 [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)，没有「Pi」这个产品名。

:::

::: tip 谁是 Mario Zechner

[Mario Zechner](https://mariozechner.at/)（GitHub 昵称 `badlogic`）是奥地利游戏开发者，2009 年创建 [libGDX](https://libgdx.com/) Java 跨平台游戏框架（24K+ stars，曾是 Android 上最流行的游戏框架），后参与 RoboVM（iOS Java）项目。RoboVM 被 Xamarin 收购、再被微软关掉的经历让他对商业化谨慎。Pi 是他 2025 年下半年因「不堪 Claude Code 越来越胀」而写的极简替代品。

:::

## 评价

**优点**

- **极简哲学**：4 个工具 + < 1000 token 系统提示 ≈ Claude Code 的 1/10，给模型留出更多上下文跑实际工作
- **全透明**：所有 tool call / 系统注入都可见，无「黑盒中的黑盒」
- **多 provider**：25+ LLM provider（OpenAI / Anthropic / Google / xAI / Groq / Cerebras / DeepSeek / Mistral / Ollama 等），mid-session 可切换模型保留完整上下文
- **MIT 开源**：核心永久 MIT；可自托管 / 内嵌 / 商用
- **可扩展**：三层扩展机制（Skills Markdown / TypeScript Extensions / Pi Packages）
- **Tree-structured Sessions**：JSONL 树形会话格式，可从任意节点分叉重试
- **Context Compaction**：会话过长自动总结老消息
- **多交互模式**：TUI / Print / JSON / RPC / SDK 嵌入五种
- **AGENTS.md 标准**：与 OpenCode、Codex CLI 共享同名约定，分层加载（global → user → project）
- **大陆访问友好**：用 DeepSeek / Ollama / Cerebras / 阿里通义 等国内可用 provider 即可

**缺点**

- **资料相对少**：相比 Claude Code 文档铺天盖地，Pi 资料分散在作者博客 + GitHub README + 第三方评测
- **学习曲线陡**：4 个工具看着简单，但扩展机制 / 自定义全要自己写 TS
- **无 MCP 支持**：作者主张「CLI + README」替代 MCP server（理由：上下文开销小）
- **无 Plan Mode / Sub-agents / 内置 TODO**：作者认为这些都该用文件（PLAN.md / TODO.md）+ bash spawn pi 解决，不应内置
- **YOLO 默认**：默认无权限询问（信任用户）。这对新手或公开仓库不友好
- **生态年轻**：插件 / 主题 / 模板远不如 Claude Code 丰富
- **不擅长 GUI 整合**：TUI 优先，IDE 扩展尚弱

## 文档地址

[pi.dev](https://pi.dev/) / [作者博客介绍文](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)

## GitHub 地址

[earendil-works/pi](https://github.com/earendil-works/pi)（主仓，曾在 `badlogic/pi-mono`，2026 年 4 月迁移到 Earendil 公司 org，**仓库代码 / 协议 / 治理不变**）

## 推荐资源

- [Mario Zechner: What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)（作者原文，必读）
- [Mario Zechner: I've sold out](https://mariozechner.at/posts/2026-04-08-ive-sold-out/)（加入 Earendil 公告）
- [agenticengineer.com: The Only Claude Code Competitor](https://agenticengineer.com/the-only-claude-code-competitor)（独立第三方对比评测）
- [self.md: Mario Zechner's Minimal Coding Agent](https://self.md/people/mario-zechner-pi-coding-agent/)
- [npm @earendil-works/pi-coding-agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)（曾名 `@mariozechner/pi-coding-agent`）
- [Anthropic Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview)（澄清：Anthropic 自家 harness，与 Pi 是不同产品）

## 幻灯片地址

<a href="/SlideStack/pi-slide/" target="_blank">Pi</a>
