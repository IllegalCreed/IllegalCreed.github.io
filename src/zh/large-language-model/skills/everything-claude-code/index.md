---
layout: doc
---

# Everything Claude Code（ECC）

由 Affaan Mustafa 维护、Anthropic × Forum Ventures hackathon 优胜作品，**Claude Code / Codex / Cursor / OpenCode 等 agent harness 的「全家桶」增强层**——把 230+ skills、60 agents、15+ 类 hook、跨语言 rules、AgentShield 安全扫描封装成 plugin，一行命令安装。GitHub 上 100K+ stars，是 agent 工程基础设施事实标准之一。

::: tip 命名说明

社区里 **ECC** 主要指 Everything Claude Code（这一个）。另有一个 `chemany/easy-claude-code` 是 provider 切换 GUI（面向大陆用户）。两者不同。本笔记主写 Everything Claude Code。

:::

## 评价

**优点**

- 60 个专用 agent（planning / review / debugging / security 等）一键就位
- **230+ skills** 覆盖 TDD / 安全 / ML / 多语言模式
- **15+ 类 hook 事件**自动化（commit / PR / build 等）
- **AgentShield**：1282 测试 + 102 规则的安全扫描器，扫 CLAUDE.md / .cursorrules 防 prompt injection
- **跨 harness 兼容**：Claude Code / Cursor / OpenCode / Codex / Antigravity 同一份配置
- **多语言 rules**：TypeScript / Python / Go / Java / Rust / PHP / Kotlin 各自最佳实践
- 「instinct-based」持续学习 v2，agent 行为越用越准
- 一行装：`/plugin install ecc@ecc`
- MIT 开源，社区迭代活跃

**缺点**

- 体量大：230+ skills 全装会撑系统提示（建议按 profile 选 core / minimal / full）
- 学习曲线：先看官网 [ecc.tools](https://ecc.tools/) 才能挑出适合自己的子集
- 大陆访问：仓库未提及国内代理，按 Claude Code 官方走需自备网络
- 与 superpowers 等其它 skill 框架可能 skill 名冲突
- 部分 skill 假定特定工作流（如要求 git worktree / TDD），自由度低

## 文档地址

[ecc.tools](https://ecc.tools/) 官网 / [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) GitHub README

## GitHub 地址

[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)

## 推荐资源

- 官网：[ecc.tools](https://ecc.tools/)
- 解读：[Augment Code: Everything Claude Code](https://www.augmentcode.com/learn/everything-claude-code-github)
- 易混淆同名工具：[chemany/easy-claude-code](https://github.com/chemany/easy-claude-code)（provider GUI，与本笔记主体不同）


## 幻灯片地址

<a href="/SlideStack/everything-claude-code-slide/" target="_blank">Everything Claude Code</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=everything-claude-code-ecc" target="_blank" rel="noopener noreferrer">Everything Claude Code（ECC） 测试题</a>
