---
layout: doc
---

# Cloudflare Skills

Cloudflare Skills（`cloudflare/skills`）是 Cloudflare **官方**出品的一组 Agent Skills，定位是「教 AI agent 如何在 Cloudflare 上构建」（Skills for teaching agents how to build on Cloudflare），Apache-2.0 开源，约 ★2.2k。它把 Workers、Pages、存储（KV/D1/R2）、AI（Workers AI/Vectorize/Agents SDK）、安全（WAF/DDoS/Turnstile）、Zero Trust（Cloudflare One）、基础设施即代码（Terraform/Pulumi）等整个 Cloudflare 开发者平台的构建知识，打包成十余个可按需调用的技能。核心理念是**检索优先**（biases towards retrieval over pre-trained knowledge）——每个技能都提醒 agent「你对 Cloudflare API、限额、定价的记忆可能过时，优先去查官方文档」，因为 Cloudflare 平台演进极快。技能**上下文自动加载**（对话匹配触发），跨 Claude Code / OpenCode / OpenAI Codex / Pi / Cursor 通用。

## 评价

**优点**

- **官方 + 全平台**：Cloudflare 官方沉淀，一套技能覆盖 Workers/Pages/存储/AI/安全/网络/IaC/Zero Trust，不是零散第三方
- **检索优先（最大特色）**：每个技能 frontmatter 都写「Biases towards retrieval from Cloudflare docs over pre-trained knowledge」，明确 references 只是起点、docs 才是真理，规避模型对限额/定价/API 签名的过时记忆
- **决策树导航**：`cloudflare` 总技能用大量决策树（「我要跑代码 / 存数据 / AI / 网络 / 安全」→ 指向正确产品），把「该用哪个 Cloudflare 产品」这一难题结构化
- **上下文自动加载**：无需记技能名，对话匹配到触发词就加载对应技能
- **命令 + MCP 打包**：装 Claude Code 插件时连带 `/cloudflare:build-agent`、`/cloudflare:build-mcp` 两个斜杠命令 + 5 个官方 MCP server（cloudflare-api / docs / bindings / builds / observability）
- **生产级最佳实践**：`workers-best-practices` 把流式、悬空 Promise、全局态、密钥、`ctx` 解构等反模式清单化，可当代码评审器用
- **跨 agent**：`npx skills add` 装进 Claude Code / Cursor / Codex / Pi 等

**缺点 / 边界**

- **绑 Cloudflare 平台**：只针对 Cloudflare 生态，不是通用云开发技能
- **检索优先依赖联网**：references 不是 source of truth，最佳效果需 docs/MCP 可达
- **Cloudflare One 系列偏企业**：`cloudflare-one` / `cloudflare-one-migrations` 面向 Zero Trust/SASE 运维与迁移，受众与开发者 Workers 技能不同
- **是「指令 + 检索指引」，非 SDK**：技能教 agent 怎么用平台，真正的 API 仍在 `agents`、`@cloudflare/sandbox` 等包里

## 适用场景

- 用 AI agent 在 Cloudflare 上开发 Workers/Pages/Durable Objects/Agents SDK 应用
- 想让 agent 写符合生产最佳实践的 Workers 代码（`workers-best-practices` 当评审器）
- 建 MCP server 或 AI agent（`/cloudflare:build-mcp`、`/cloudflare:build-agent`）
- 审计页面 Core Web Vitals（`web-perf`）、给表单加 Turnstile（`turnstile-spin`）
- 设计 / 排障 / 迁移 Zero Trust 与 SASE 部署（`cloudflare-one` 系列）

## 边界

- **是官方技能集，不是单个技能**：十余个技能各有触发条件，按需激活
- **检索优先**：reference 文件是起点，与 docs 冲突时**信 docs**（限额、定价、类型签名尤甚）
- **平台绑定**：deploy/存储/AI/安全全部围绕 Cloudflare
- **与相邻 vendor 技能并列**：和 [Vercel Agent Skills](../vercel-agent-skills/)、[AWS Agent Toolkit](../aws-agent-toolkit/) 等同属「Agent Skills」章，各自绑各自平台

## 官方文档

[Cloudflare Agents 文档](https://developers.cloudflare.com/agents/) ｜ [Cloudflare MCP 指南](https://developers.cloudflare.com/agents/model-context-protocol/) ｜ [Agent 安装（Claude Code）](https://developers.cloudflare.com/agent-setup/claude-code/)

## GitHub 地址

[cloudflare/skills](https://github.com/cloudflare/skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位、安装（插件 / npx / Cursor / clone）、技能总览、上下文自动加载机制
- [指南](./guide-line) —— 各技能逐讲（cloudflare / workers-best-practices / agents-sdk / durable-objects / sandbox-sdk / web-perf / cloudflare-one / turnstile）、平台覆盖面、反模式
- [参考](./reference) —— 技能清单 + 命令 + MCP server + 平台覆盖 + 安装 + 许可 + 链接

## 幻灯片地址

<a href="/SlideStack/cloudflare-skills-slide/" target="_blank">Cloudflare Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=639" target="_blank" rel="noopener noreferrer">Cloudflare Skills 测试题</a>
