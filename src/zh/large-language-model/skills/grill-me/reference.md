---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 mattpocock/skills 的 `grill-me`、`grilling` SKILL.md 与 README 编写。

## 速查

- **命令**：`/grill-me`（用户手动触发）
- **依赖**：内部 `Run a /grilling session`；grilling 是 model-invoked 引擎
- **安装**：`npx skills@latest add mattpocock/skills`（可编辑）或 `/plugin install mattpocock-skills@mattpocock`（托管）
- **首次配置**：`/setup-matt-pocock-skills`（配 issue tracker / 标签 / 文档位置，每仓库一次）
- **升级**：需要文档产物 → [grill-with-docs](../grill-with-docs/)（顺带建 CONTEXT.md + ADR）
- **下游**：对齐后可接 `/to-spec`（转 spec）、`/to-tickets`（拆票）、`/implement`（TDD 实现）

## grill-me SKILL.md 原文

```markdown
---
name: grill-me
description: A relentless interview to sharpen a plan or design.
disable-model-invocation: true
---

Run a `/grilling` session.
```

- `disable-model-invocation: true` → 仅用户手动触发
- 正文一句话，把逻辑委托给可复用的 `grilling` 引擎

## grilling 引擎规则原文

```
Interview me relentlessly about every aspect of this until we reach a
shared understanding. Walk down each branch of the decision tree,
resolving dependencies between decisions one-by-one. For each question,
provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question
before continuing. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the environment (filesystem, tools,
etc.), look it up rather than asking me. The *decisions*, though, are
mine — put each one to me and wait for my answer.

Do not act on it until I confirm we have reached a shared understanding.
```

## 安装两法对比

| 维度 | `npx skills add`（skills.sh） | Claude Code 插件 |
| --- | --- | --- |
| 命令 | `npx skills@latest add mattpocock/skills` | `/plugin install mattpocock-skills@mattpocock` |
| 落地 | 拷进你的项目/技能目录 | 托管 bundle |
| 可编辑 | 是（改成你自己的） | 否（只读） |
| 更新 | 手动重装 | 随作者版本自更新 |
| 适合 | 想 hack、想跨 agent（Codex 等） | 想开箱即用、跟着更新 |

安装后运行 `/setup-matt-pocock-skills` 配置本仓库（issue tracker、triage 标签、文档存放位置），每仓库一次。

## mattpocock/skills 里的相关技能

grill-me 属 **productivity** 桶。相关技能：

| 技能 | 桶 / 触发 | 关系 |
| --- | --- | --- |
| `grilling` | productivity / model-invoked | grill-me 与 grill-with-docs 共用的引擎 |
| `grill-with-docs` | engineering / user-invoked | grill-me + 建 CONTEXT.md/ADR（升级版） |
| `domain-modeling` | engineering / model-invoked | grill-with-docs 用来建文档的引擎 |
| `ask-matt` | engineering / user-invoked | 路由器——帮你选该用哪个技能 |
| `to-spec` | engineering / user-invoked | 把对齐后的讨论转成 spec |
| `to-tickets` | engineering / user-invoked | 把计划拆成带依赖的 tracer-bullet 票 |
| `implement` | engineering / user-invoked | 按 spec/票用 TDD 实现 |

> 典型链路：`/grill-me`（对齐）→ `/to-spec`（成 spec）→ `/to-tickets`（拆票）→ `/implement`（TDD 实现）。

## user-invoked vs model-invoked 约定

Matt 仓库的分工规则：

- **user-invoked**（如 grill-me）：只你手动调；职责是**编排**；零上下文负载但你要记得它存在
- **model-invoked**（如 grilling）：你或 agent 都可调、可被其它技能复用；持有**可复用纪律**
- **铁律**：user-invoked 可调 model-invoked，但**绝不调另一个 user-invoked**

## 对比 Superpowers brainstorming

| 维度 | Grill Me | Superpowers brainstorming |
| --- | --- | --- |
| 触发 | 手动 | 自动（新需求即触发） |
| 定位 | 小、可组合、不接管流程 | mandatory workflow 一环 |
| 特色 | 决策树逐分支 + 每问给推荐 + 事实自查 + 共识门禁 | 问范围/约束/优先级/验收 |
| 落文档 | 否（用 grill-with-docs） | 否（接 writing-plans） |

## 资源链接

- 仓库：[mattpocock/skills](https://github.com/mattpocock/skills)
- grill-me：[skills/productivity/grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)
- grilling 引擎：[skills/productivity/grilling](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling)
- 升级版：[Grill With Docs](../grill-with-docs/)
- 作者 newsletter：[aihero.dev/s/skills-newsletter](https://www.aihero.dev/s/skills-newsletter)
