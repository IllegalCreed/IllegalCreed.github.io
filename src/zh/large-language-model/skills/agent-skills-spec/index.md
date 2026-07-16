---
layout: doc
---

# Agent Skills 规范与生态

Agent Skills 是由 Anthropic 发起并开源的**轻量开放标准**：一个技能就是一个包含 `SKILL.md` 的文件夹，靠 YAML frontmatter 的 `name` / `description` 声明「是什么、何时用」，正文写指令，可附带 `scripts/` / `references/` / `assets/`。Agent 通过**渐进披露**在需要时才把完整指令读进上下文——它不是某个具体工具，而是 Superpowers、gstack、find-skills 等一切技能生态所依据的**共同格式**。

## 评价

**优点**

- **格式极简**：一个目录 + 一个 Markdown 文件即成技能，无需 SDK、无需注册中心、无需构建步骤
- **渐进披露省上下文**：启动时只加载 ~100 token 的 `name`/`description`，激活后才读完整正文，大量技能常驻也几乎不占窗口
- **跨产品可移植**：同一份 `SKILL.md` 在 Claude Code / Codex / Gemini CLI / Copilot / Cursor 等多家 agent 通用（可移植字段部分）
- **版本可控、可审计**：技能是普通文件夹，进 git 仓库、走 PR 审查、可 diff、可回滚
- **由官方给出创作方法论**：不止定义格式，还配套「从真实专长起步 / gotchas 段 / 校验循环 / plan-validate-execute」等最佳实践
- **有参考实现和校验器**：`skills-ref validate` 可离线校验 frontmatter 与命名规范

**缺点**

- **规范只管「格式」，不保证「质量」**：一个合法的 `SKILL.md` 可能是废话——好技能靠工艺，不靠 schema
- **可移植字段窄**：跨工具通用的只有 `name`/`description`/`license`/`compatibility`/`metadata`/`allowed-tools`，各家扩展字段（如 Claude Code 的 `disable-model-invocation`/`context: fork`）不跨平台
- **触发靠 description 的自然语言匹配**：写不好就不触发或误触发，需反复评测调优
- **正文常驻上下文**：激活后每一行都是逐轮的 token 成本，长技能拖慢、拖贵
- **生态早期、约定分散**：目录/命名/触发机制在不同 agent 间仍有差异，「一次编写处处运行」尚不完全成立

## 适用场景

- 你在反复粘贴同一套指令 / 清单 / 多步流程给 agent——把它固化成技能
- CLAUDE.md 里某段从「事实」长成了「流程」——迁进技能，按需加载而非常驻
- 团队想沉淀「我们的」API 约定、评审清单、部署流程，让每个 agent 会话自动遵循
- 想理解 Superpowers / gstack / mattpocock skills 为何「装上就变风格」——先懂它们底层的这套标准

## 边界

- **不是插件系统**：Skills 只喂「指令 + 参考文件」，不提供运行时、不注册工具；需要 hooks / MCP / 子代理时那是各 agent 的扩展，不是本规范
- **不是 prompt 模板库**：模板是死文本，技能靠 `description` 让 agent **自行判断何时激活**
- **不等于 Claude Code**：Claude Code 是 Agent Skills 的一个实现（并做了扩展），规范本身厂商中立
- **具体技能集合另立叶**：Superpowers、gstack、find-skills、mattpocock 的 Grill 系列都是**建立在本规范之上**的产品，各有专页

## 官方文档

[Agent Skills 文档站 · agentskills.io](https://agentskills.io) ｜ [规范原文 · Specification](https://agentskills.io/specification) ｜ [Claude Code Skills 文档](https://code.claude.com/docs/en/skills) ｜ [Anthropic 工程博客：Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

## GitHub 地址

[agentskills/agentskills](https://github.com/agentskills/agentskills)（规范与文档） ｜ [anthropics/skills](https://github.com/anthropics/skills)（官方示例技能）

## 内容地图

- [入门](./getting-started) —— 写出并跑通你的第一个 `SKILL.md`，理解渐进披露三阶段
- [指南](./guide-line) —— 规范解剖 + 官方创作最佳实践 + 让技能「可预测」的工艺词汇
- [参考](./reference) —— frontmatter 全字段（可移植 vs Claude Code 扩展）、目录约定、校验 CLI、生态清单

## 幻灯片地址

<a href="/SlideStack/agent-skills-spec-slide/" target="_blank">Agent Skills 规范与生态</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Agent Skills 规范与生态 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
