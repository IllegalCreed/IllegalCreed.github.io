---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 bmad-code-org/BMAD-METHOD V6 的 README、docs 与 `src/` 编写。

## 速查

- **装**：`npx bmad-method install`（Node≥20.12/Python≥3.10/uv）；预发布 `@next`
- **非交互**：`--directory <path> --modules bmm --tools claude-code --yes`；`--set <module>.<key>=<value>`
- **BMM 四阶段**：1-analysis / 2-plan-workflows / 3-solutioning / 4-implementation
- **域专家**：analyst → pm + ux-designer → architect → dev
- **导航**：`bmad-help`；**多角色**：`bmad-party-mode`
- V6；MIT；BMad/BMAD-METHOD 为 BMad Code, LLC 商标

## 模块

| 模块 | 用途 |
| --- | --- |
| **BMM**（BMad Method） | 核心框架，34+ 工作流 |
| **BMB**（BMad Builder） | 建自定义 agent 和工作流 |
| **TEA**（Test Architect） | 基于风险的测试策略与自动化 |
| **BMGD**（Game Dev Studio） | 游戏开发（Unity/Unreal/Godot） |
| **CIS**（Creative Intelligence Suite） | 创新、头脑风暴、设计思维 |

## BMM 四阶段与域专家

| 阶段目录 | 域专家 agent | 产出 |
| --- | --- | --- |
| `1-analysis` | `bmad-agent-analyst` | 需求分析、研究、产品简报、PRFAQ |
| `2-plan-workflows` | `bmad-agent-pm`、`bmad-agent-ux-designer` | PRD、UX 规格 |
| `3-solutioning` | `bmad-agent-architect` | 架构、技术方案 |
| `4-implementation` | `bmad-agent-dev` | 敏捷实现 |

## core-skills（跨模块通用）

| 技能 | 作用 |
| --- | --- |
| `bmad-help` | 智能向导：告诉你下一步、什么可选 |
| `bmad-party-mode` | 多 agent persona 同场协作讨论 |
| `bmad-brainstorming` | 头脑风暴 |
| `bmad-advanced-elicitation` | 高级需求挖掘 |
| `bmad-forge-idea` | 锻造想法 |
| `bmad-spec` | 写规格 |
| `bmad-shard-doc` | 把大文档分片 |
| `bmad-index-docs` | 文档索引 |
| `bmad-review-adversarial-general` | 通用对抗审查 |
| `bmad-review-edge-case-hunter` | 边界情况猎手 |
| `bmad-review-verification-gap` | 验证缺口审查 |
| `bmad-editorial-review-prose` / `-structure` | 文稿/结构编辑审查 |
| `bmad-customize` | 自定义 |

## 安装（含 CI/CD）

```bash
# 交互
npx bmad-method install

# 非交互（CI/CD）
npx bmad-method install --directory /path --modules bmm --tools claude-code --yes

# 覆盖模块配置（可重复）
npx bmad-method install --yes --modules bmm --tools claude-code \
  --set bmm.project_knowledge=research --set bmm.user_skill_level=expert

# 看某模块的可用配置键
npx bmad-method install --list-options bmm
```

先决条件：Node ≥20.12、Python ≥3.10、uv。装完在 AI IDE（Claude Code/Cursor 等）打开项目。

## Web Bundles

把规划技能打包为 **Gemini Gems / ChatGPT Custom GPTs**——在 web 订阅里做规划（brainstorm / product brief / PRFAQ / PRD / UX / market research），再带工件进 IDE 实现。省 metered IDE token。见 [bmadcode.com/web-bundles](https://bmadcode.com/web-bundles/)。

## V6 主要变化

V6 引入：Cross Platform Agent Team、Sub Agent inclusion、**Skills Architecture**（把能力打包为 SKILL.md）、BMad Builder v1、Dev Loop Automation。从旧版升级见 [upgrade-to-v6](https://docs.bmad-method.org/how-to/upgrade-to-v6/)。

## 资源链接

- 仓库：[bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- 文档站：[docs.bmad-method.org](https://docs.bmad-method.org)
- Web Bundles：[bmadcode.com/web-bundles](https://bmadcode.com/web-bundles/)
- 相关叶：[gstack](../gstack/)（角色化）· [GSD Core](../gsd-core/)（阶段循环）
