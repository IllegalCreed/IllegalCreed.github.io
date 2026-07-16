---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 mattpocock/skills 的 `grill-me`、`grilling` 与 README 编写。

## 速查

- **grill-me = 薄封装 + grilling 引擎**：封装只有一句「Run a `/grilling` session」，逻辑全在 grilling
- **grilling 五规则**：① 不留情面盘问每个方面直到共识 → ② 沿决策树逐分支、逐个解决决策间依赖 → ③ 一次一问、每问给推荐答案 → ④ 事实自查环境、决策抛给你 → ⑤ 共识前不动手
- **user-invoked**（`disable-model-invocation: true`）：只你能手动调，agent 不自动触发，零上下文负载
- **治的失败模式**：misalignment（agent 没做我想要的）——四大失败模式之首
- **定位**：小、可改、可组合，对比 GSD/BMAD/Spec-Kit「接管流程」
- **对比 Superpowers brainstorming**：都苏格拉底式反问；grill-me 更强调「决策树逐分支 + 每问给推荐 + 共识门禁」

## grill-me 的架构：薄封装 + 可复用引擎

grill-me 的 `SKILL.md` 全文只有一句话：

```markdown
---
name: grill-me
description: A relentless interview to sharpen a plan or design.
disable-model-invocation: true
---

Run a `/grilling` session.
```

真正的盘问逻辑在 `grilling` 技能里（一个 model-invoked 引擎）。这是「用户触发的薄封装编排 + 模型可触发的可复用引擎」范式的教科书例子——同一个 `grilling` 引擎既被 `grill-me` 复用，也被 [`grill-with-docs`](../grill-with-docs/) 复用。

## grilling 引擎的五条规则

引擎的 `SKILL.md` 只有五句，但每一句都在治一种具体病：

| # | 规则 | 治什么 |
| --- | --- | --- |
| 1 | **不留情面地盘问每个方面，直到达成共识** | 治「浅尝辄止、没问透就动手」 |
| 2 | **沿决策树逐分支走，逐个解决决策之间的依赖** | 治「只问表面、不理清决策相互牵制」 |
| 3 | **一次一个问题、每问给推荐答案，等反馈再继续** | 治「一股脑抛十个问题令人困惑」 |
| 4 | **能从环境查到的事实自己查，只把决策抛给我** | 治「拿本可自查的事实来烦你」 |
| 5 | **达成共识前不要动手** | 治「盘问到一半就猜着开写」 |

::: tip 规则 4 是 grilling 与普通「多问几句」的关键差别
它明确区分**事实**（filesystem/tools 能查的，自己查）与**决策**（你的，必须问你）。这让盘问聚焦在真正需要你拍板的地方，而不是浪费回合确认代码里写着的现状。
:::

## user-invoked：为什么它只能手动触发

grill-me 设了 `disable-model-invocation: true`，意味着：

- **只有你手动 `/grill-me` 才启动**，agent 不会自作主张盘问你
- **零上下文负载**：它的 description 不常驻窗口（代价是你要记得它存在）
- 相对地，底层的 `grilling` 是 **model-invoked**（带 description、可被 agent 自动触发，也可被其它技能复用）

Matt 的仓库对这条分工有明确约定：**一个 user-invoked 技能可以调用 model-invoked 技能，但绝不调用另一个 user-invoked 技能**。grill-me（user-invoked）→ grilling（model-invoked）正是这个模式。

## 它治的病：AI 编码四大失败模式之首

Matt 的 README 把 AI 编码的失败归为四类，grill-me 直击第一类：

| # | 失败模式 | 对应修法 |
| --- | --- | --- |
| **1** | **The Agent Didn't Do What I Want**（misalignment） | **grill-me / grill-with-docs**（盘问对齐） |
| 2 | The Agent Is Way Too Verbose（冗长） | grill-with-docs 的共享语言 |
| 3 | The Code Doesn't Work（不工作） | tdd / diagnosing-bugs |
| 4 | We Built A Ball Of Mud（一团泥） | to-spec / improve-codebase-architecture |

> 「最常见的失败模式是 misalignment。你以为开发者懂你要什么，等看到成品才发现它根本没理解你。AI 时代一模一样——修法就是一场盘问。」

## 定位：小而可组合，不接管流程

README 开宗明义地和「重流程框架」划清界限：

> 「开发真实应用很难。GSD、BMAD、Spec-Kit 这类方法想通过**接管流程**来帮忙，但代价是夺走你的控制权、让流程里的 bug 难以排查。这些技能设计成**小、易改、可组合**。它们适配任何模型。基于数十年工程经验。随便 hack，改成你自己的。」

所以 grill-me 不是一个「你必须照走的仪式」，而是一块你可以随手拿起、也可以随手改的积木。

## 对比 Superpowers 的 brainstorming

两者都在「动工前苏格拉底式反问需求」，但侧重不同：

| 维度 | Grill Me（mattpocock） | brainstorming（Superpowers） |
| --- | --- | --- |
| 触发 | 用户手动 `/grill-me` | 自动（任何「加新功能/设计」类需求） |
| 强度 | 「relentless」逐决策树分支 | 苏格拉底式，问范围/约束/优先级/验收 |
| 特色 | 每问给推荐答案 + 事实自查 + 共识门禁 | 强制流程（mandatory workflow）的一环 |
| 升级 | grill-with-docs 顺带建 CONTEXT.md/ADR | 接 writing-plans → executing-plans |
| 哲学 | 小、可组合、不接管流程 | 全流程 mandatory workflow |

> 想要「自动、强制、全流程」选 Superpowers；想要「手动、轻量、可 hack、聚焦对齐」选 Grill Me。两者不冲突，可并存。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 需求已明确还硬跑 grill-me | 盘问变多余；此时直接做 |
| 一股脑回答一堆问题 | 破坏「逐决策」节奏；顺着一次一问走 |
| 把它当写代码/出方案的工具 | 它只做对齐，产出是共识不是实现 |
| 盘问到一半就催 agent 开写 | 违背「共识前不动手」，失去对齐价值 |
| 拿它建文档 | 那是 grill-with-docs 的活，grill-me 不落文档 |

## 下一步

- [参考](./reference) —— 规则原文、安装两法、相关技能链、grill-with-docs 升级路径
- 升级：[Grill With Docs](../grill-with-docs/) —— 同样的盘问，额外建共享语言（CONTEXT.md + ADR）
- 上游：[Skills For Real Engineers](https://github.com/mattpocock/skills)
