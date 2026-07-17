---
layout: doc
---

# Firebase Agent Skills

Firebase Agent Skills（`firebase/agent-skills`）是 Firebase（Google）**官方**出品的一组 AI 编码 agent 技能集，遵循 [Agent Skills](https://agentskills.io/home) 开放格式，Apache-2.0 开源。它把「如何正确地用 Firebase」这件事——从 CLI 版本检查、项目初始化、认证、Firestore、Hosting，到 AI Logic（Gemini API）、SQL Connect（原 Data Connect）、安全规则审计——打包成 11 个可按需调用的技能，让 Claude Code / Cursor / Codex / Gemini CLI / Antigravity / Android Studio 等 agent 不再靠「内部记忆」瞎猜 Firebase 用法，而是照官方沉淀的工作流（CUJ）与最佳实践来做。一条 `npx skills add firebase/agent-skills` 装好，任务匹配时自动激活。

## 评价

**优点**

- **Google 官方沉淀**：规则与工作流来自 Firebase 团队，不是社区二手总结；强调「优先查官方知识、用 Firebase MCP Server 工具而非直接 API」
- **覆盖面广**：11 个技能横跨 setup / auth / Firestore / Hosting / App Hosting / AI Logic / SQL Connect / Crashlytics / Remote Config / 安全规则审计 / Xcode 配置
- **AI 优先**：`firebase-ai-logic-basics` 让客户端 SDK 直接调 Gemini（多模态、流式、结构化输出、Nano Banana 出图），并可接 Genkit（AI SDK，dart/go/js）
- **安全内建**：`firebase-security-rules-auditor` 用红队视角审 Firestore 规则（更新绕过、权威来源、DoS、类型安全），1–5 评分产 JSON 报告
- **CLI 一律 npx**：所有命令统一 `npx -y firebase-tools@latest`，永远拉最新版，避免版本漂移
- **跨 agent**：同一份技能装进 Claude Code / Cursor / Codex / Gemini CLI / Antigravity / Android Studio

**缺点 / 边界**

- **不是运行时**：它是给 agent 看的指令集，真正干活还得靠 Firebase CLI + MCP Server + 你的 Google 账号与项目
- **强绑 Firebase 平台**：内容全部围绕 Firebase / Google Cloud，不通用于其它 BaaS
- **部分能力需 Blaze 计费**：App Hosting、Vertex AI Gemini、Nano Banana 出图都要升级到 Blaze 付费计划
- **审计需人判断**：security-rules-auditor 给出评分与 findings 是输入，最终修不修、怎么修仍靠你
- **与相邻叶分工**：另一个 BaaS 的官方技能集见 [Supabase Agent Skills](../supabase-agent-skills/)

## 适用场景

- 用 agent 从零搭 Firebase：初始化项目、配置 CLI、拉取 `google-services.json` / `GoogleService-Info.plist`
- 给 app 加认证、Firestore、Hosting、Remote Config、Crashlytics
- 在 Web / 移动端集成 Gemini（Firebase AI Logic）或 Genkit 做 AI 功能
- 要一个「安全规则评审器」审 Firestore rules 找漏洞
- 建关系型后端（SQL Connect / Data Connect，Cloud SQL for PostgreSQL + GraphQL）

## 边界

- **不是单个技能，是 11 个技能的官方集**：各有触发条件，按需激活
- **审计不代替判断**：security-rules-auditor 报的 findings 是输入，取舍是你的
- **平台与计费绑定**：App Hosting / Vertex AI / Nano Banana 需 Blaze
- **Genkit 在独立仓库**：`firebase-basics` 会引导你 `npx skills add genkit-ai/skills`

## 官方文档

[Firebase 文档](https://firebase.google.com/docs) ｜ [Agent Skills 格式](https://agentskills.io/home) ｜ [Firebase AI Logic 入门](https://firebase.google.com/docs/ai-logic/get-started)

## GitHub 地址

[firebase/agent-skills](https://github.com/firebase/agent-skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、跨 agent、11 个技能总览
- [指南](./guide-line) —— 各技能分组深入（basics / auth / firestore / hosting / ai-logic / data-connect / security-rules-auditor…）+ 反模式
- [参考](./reference) —— 11 技能清单表 + 安装矩阵 + Genkit + Firebase MCP Server + 许可与链接

## 幻灯片地址

<a href="/SlideStack/firebase-agent-skills-slide/" target="_blank">Firebase Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=631" target="_blank" rel="noopener noreferrer">Firebase Agent Skills 测试题</a>
