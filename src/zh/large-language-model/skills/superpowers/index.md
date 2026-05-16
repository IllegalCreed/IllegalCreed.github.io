---
layout: doc
---

# Superpowers

由 Jesse Vincent（Prime Radiant）维护、面向编码 Agent（Claude Code / Codex / Gemini CLI / Cursor 等）的 **可组合 skills 框架**——把头脑风暴 → 规划 → TDD → 实现 → 代码审查的全流程沉淀成一组**自动触发**的 skill。安装后 Claude Code 看到当前任务的描述符合某 skill 的「**触发场景**」时，**强制**先加载该 skill 的指令再开始干活。

## 评价

**优点**

- 解决「Agent 凭直觉走捷径、跳过测试、不验证就说完成」的常见痛点
- 沉淀的方法论实战打磨过：TDD / 根因调试 / 完工前验证 / 计划先行 / 子代理派发
- Skill 之间相互引用、可组合（如 `executing-plans` 调用 `subagent-driven-development`）
- 跨 Agent 平台一致（Claude Code / Codex / Gemini / Cursor 同一份 skill）
- 一键安装：`/plugin install superpowers@claude-plugins-official`
- 社区持续迭代，比个人维护 SKILL.md 更新快
- meta skill `using-superpowers` 强制对话开始时教 Agent「如何发现并用 skills」，防止 Agent 跳过 skill 直接答题

**缺点**

- Agent 被「强制流程」拘束后偶尔显得过度——简单任务（如「改一行 typo」）也会触发 brainstorming
- 部分 skill 假定特定工作流（如 git worktree），与本人习惯不符时要调整
- 大量 skill 一次性注入会占用 system prompt 空间（影响上下文）
- 中文资源少，所有 skill 文档为英文
- 「mandatory workflows」立场强烈，与「让 Agent 灵活判断」的哲学有张力

## 文档地址

[superpowers GitHub](https://github.com/obra/superpowers) / [primeradiant.com/superpowers](https://primeradiant.com/superpowers/)

## GitHub 地址

[obra/superpowers](https://github.com/obra/superpowers)

## 推荐资源

- [Skills 编写规范](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
- [Anthropic Skills 文档](https://docs.claude.com/en/docs/claude-code/skills)
