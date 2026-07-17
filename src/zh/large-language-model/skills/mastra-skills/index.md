---
layout: doc
---

# Mastra Skills

Mastra Skills（`mastra-ai/skills`）是 Mastra AI 框架**官方**出品的 agent skill——「Official agent skills for coding agents working with the Mastra framework」。Mastra 是一套现代 TypeScript 技术栈的 AI 应用与 agent 框架，而这个仓库把「如何用当前版本的 Mastra 正确写代码」这件事沉淀成一个**单一、全面**的 `mastra` 技能，用**渐进式披露**（progressive disclosure）配一组 reference 文件，教 coding agent 去找最新文档、验证 API 签名、再动手建 agents 和 workflows。它的核心不是塞给你一堆代码模板，而是一条铁律：**别信你脑子里的 Mastra 记忆，永远对照最新文档验证**——因为 Mastra 演进极快，训练数据里全是废弃 API、过时模式与错误用法。

## 评价

**优点**

- **官方一手**：由 Mastra 团队（Kepler Software, Inc.）维护，模式对照当前 Mastra 源码校验，非泛泛而谈
- **单技能 + 渐进式披露**：不是一堆零散技能，而是一个 `mastra` 主技能按用户问题路由到 reference（create-mastra / core-concepts / embedded-docs / remote-docs / model-selection / common-errors / migration-guide / mastra-api）
- **反幻觉设计**：把「你的记忆很可能过时」写进技能第一条，强制 agent 先查 embedded docs / 源码 / 远程文档再写代码，专治 LLM 用旧 API 硬编的通病
- **文档查找有章法**：embedded docs（`node_modules/@mastra/*/dist/docs/`，与安装版本精确匹配）→ 源码类型定义 → 远程 `https://mastra.ai/llms.txt`（`.md` 后缀取纯 markdown），优先级明确
- **概念清晰**：agents vs workflows、tools、memory、RAG/storage 的取舍讲得干脆
- **自动发现**：支持 RFC 8615 `.well-known` 标准，agent 可从 `https://mastra.ai/.well-known/skills/` 自动发现，无需手配

**缺点 / 边界**

- **绑 Mastra 框架**：只服务 Mastra 生态，不是通用 AI agent 教程
- **教「怎么查」而非「背答案」**：技能本身刻意不写死 API 细节（因为会过时），真正的签名要 agent 去 embedded/remote docs 现查——离线且没装包时价值打折
- **强 TypeScript / ES2022**：Mastra 要求 ES2022 模块，CommonJS 会报错，Node.js 20+
- **许可需留意**：仓库 README 与 LICENSE 明写 **Apache-2.0**（Copyright Kepler Software, Inc.），但 GitHub 许可检测器一度显示 NOASSERTION（因 LICENSE 采用非标准头），以仓库实际声明为准

## 适用场景

- 让 coding agent（Claude Code / Cursor / Codex 等）用**当前版本**的 Mastra 正确写 agents / workflows / tools / memory
- 治 agent「凭记忆写过时 Mastra API」的毛病——强制先查文档再动手
- 新建 Mastra 项目、排查 CommonJS/模型格式/内存持久化等常见错误、跨版本迁移
- 用 `mastra api` CLI 巡检本地 / 平台 / 远程 Mastra 服务的 agents、workflows、traces、logs

## 边界

- **是官方 agent 技能，不是 Mastra 框架本身**：框架源码在 [mastra-ai/mastra](https://github.com/mastra-ai/mastra)，本叶是「怎么让 agent 正确用它」的技能
- **单技能而非技能集**：仓库里只有一个 `mastra` 技能（对比 vercel-labs/agent-skills 的 9 个）
- **不替你决策**：概念参考帮你选 agent 还是 workflow，最终取舍靠你
- **核心资产是「查文档的方法论」**：具体 API 签名以 embedded/remote docs 现查为准，别把技能里的示例当永恒真理

## 官方文档

[Mastra 文档](https://mastra.ai/docs) ｜ [Agent Skills 规范](https://agentskills.io) ｜ [`.well-known` Skills RFC](https://github.com/cloudflare/agent-skills-discovery-rfc) ｜ [Mastra 框架仓库](https://github.com/mastra-ai/mastra)

## GitHub 地址

[mastra-ai/skills](https://github.com/mastra-ai/skills)（Apache-2.0，仓库 README/LICENSE 明写；GitHub 一度显示 NOASSERTION）

## 内容地图

- [入门](./getting-started) —— 官方定位、`npx skills add` 与 `.well-known` 安装、Mastra 是什么、「别信记忆查最新文档」核心理念
- [指南](./guide-line) —— `mastra` 技能教什么、文档查找策略（embedded/remote）、agents vs workflows/tools/memory/RAG、反模式与常见错误
- [参考](./reference) —— 技能与 reference 清单、核心概念速览、安装/well-known、许可、链接

## 幻灯片地址

<a href="/SlideStack/mastra-skills-slide/" target="_blank">Mastra Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=625" target="_blank" rel="noopener noreferrer">Mastra Skills 测试题</a>
