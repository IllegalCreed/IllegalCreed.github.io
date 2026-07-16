---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 mattpocock/skills 的 `grill-with-docs`、`domain-modeling`、`CONTEXT-FORMAT.md`、`ADR-FORMAT.md` 与 README 编写。

## 速查

- **grill-with-docs = grilling 引擎 + domain-modeling 引擎**：正文一句「Run a `/grilling` session, using the `/domain-modeling` skill.」
- **domain-modeling 五动作**：挑战术语 → 锐化模糊语 → 编造边界场景 → 与代码交叉核对 → 就地更新 CONTEXT.md / 稀疏建 ADR
- **CONTEXT.md**：纯术语表（glossary），只含项目专有词，每词 1-2 句 + `_Avoid_` 同义词，**禁放实现细节**
- **ADR**：`docs/adr/NNNN-slug.md` 顺序编号，可短至一段；三门槛全真才建
- **单/多上下文**：单 `CONTEXT.md`（多数）或 `CONTEXT-MAP.md` + 各上下文自己的 CONTEXT.md
- **治「冗长」**：共享语言让 agent 用 1 个词代替一长串解释，省 thinking token、命名一致

## 架构：盘问引擎 + 建模引擎

grill-with-docs 的 `SKILL.md` 正文只有一句：

```markdown
---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which
  also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.
```

它复用两个 model-invoked 引擎：

- **grilling**——盘问纪律，和 grill-me 完全一致（逐决策树、一次一问、事实自查、共识门禁）
- **domain-modeling**——在盘问过程中主动建/锐化领域模型，就地落文档

## domain-modeling 引擎的五个动作

domain-modeling 是**主动**的建模纪律——「只是读 CONTEXT.md 找词汇」不算这个技能（那是任何技能都能做的一句话习惯）；它是当你**在改变模型**时用的：

| 动作 | 做什么 | 例子 |
| --- | --- | --- |
| **挑战术语** | 你用的词和 CONTEXT.md 已有定义冲突时，当场指出 | 「你的术语表把 cancellation 定义为 X，但你现在像是指 Y——到底哪个？」 |
| **锐化模糊语** | 模糊/多义词，提出精确的规范术语 | 「你说 account——指 Customer 还是 User？这是两个东西」 |
| **编造边界场景** | 用具体场景压测概念边界，逼你说清 | 发明探测边界的场景 |
| **与代码交叉核对** | 你说某功能如何工作时，查代码是否一致 | 「你的代码整单取消，但你说支持部分取消——哪个对？」 |
| **就地更新** | 术语一确定就写进 CONTEXT.md；符合门槛才建 ADR | 不批处理，趁热打铁 |

## CONTEXT.md 格式与铁律

CONTEXT.md 是**纯术语表**，格式简单：

```markdown
# {Context Name}

{一两句话说明这个上下文是什么、为何存在}

## Language

**Order**:
{术语的一两句描述}
_Avoid_: Purchase, transaction

**Customer**:
下单的个人或组织。
_Avoid_: Client, buyer, account
```

铁律：

- **要有主见**：一个概念多个词时，选最好的那个，其余列进 `_Avoid_`
- **定义要紧**：1-2 句封顶，定义它「是什么」，不是「做什么」
- **只收项目专有词**：通用编程概念（超时、错误类型、工具模式）不进——即使项目大量使用
- **纯术语表**：`CONTEXT.md should be totally devoid of implementation details`——不当 spec、不当草稿、不放实现决策

## ADR 格式与三门槛

ADR 存 `docs/adr/`，顺序编号 `0001-slug.md`，**可短至一段**：

```markdown
# {决策的简短标题}

{1-3 句：背景是什么、决定了什么、为什么}
```

只在**三条全真**时才建 ADR：

1. **难逆**——以后改主意的代价很大
2. **无 context 会困惑**——未来读者看代码会想「为啥这么做？」
3. **真实权衡**——确有备选、你为具体理由选了这个

> 任一条不满足就跳过：易逆的决策以后再逆就是；不惊讶的没人会问为什么；无备选的除了「做了显而易见的事」没什么可记。

**够格记 ADR 的**：架构形状（monorepo、事件溯源）、上下文间集成模式、带锁定的技术选型（数据库/消息总线/部署目标）、边界与范围决策、刻意偏离显而易见路径（「用手写 SQL 而非 ORM 因为 X」）、代码里看不见的约束（合规、响应时间）、非显然的被拒备选。

## 单上下文 vs 多上下文

| 结构 | 何时 | 布局 |
| --- | --- | --- |
| **单上下文**（多数仓库） | 一个内聚领域 | 根目录一个 `CONTEXT.md` |
| **多上下文** | 多个子领域 | 根 `CONTEXT-MAP.md` 列出各上下文 + 关系，各上下文有自己的 `CONTEXT.md` 和 `docs/adr/` |

引擎自动推断：有 `CONTEXT-MAP.md` 就读它找上下文；只有根 `CONTEXT.md` 就是单上下文；都没有就在第一个术语确定时**懒创建**根 CONTEXT.md。

## 它治的病：agent 太啰嗦

Matt 四大失败模式的第二个——冗长（verbose）：

> agent 被丢进项目、被要求自己摸清黑话，于是**用 20 个词说清本该 1 个词的事**。修法是一份共享语言，帮 agent 解码项目黑话。

共享语言的连锁好处：

- **变量/函数/文件命名一致**——都用共享语言
- **代码库更好导航**——agent 更容易找路
- **更省 thinking token**——有了更浓缩的语言可用

> **BEFORE**：「一个 lesson 在某 section 里被变得 real（在文件系统里有了位置）时有问题」
> **AFTER**：「materialization cascade 有问题」——一次省词，session 复 session 地省。

## 与 grill-me 的区别

| 维度 | Grill Me | Grill With Docs |
| --- | --- | --- |
| 桶 | productivity（通用） | engineering（代码） |
| 盘问 | grilling 引擎 | grilling 引擎（相同） |
| 额外 | 无 | + domain-modeling：建 CONTEXT.md + ADR |
| 产出 | 共识 | 共识 + 术语表 + 关键决策记录 |
| 治的失败 | misalignment（跑偏） | misalignment + verbose（冗长） |
| 适合 | 一次性/非代码对齐 | 长期维护的代码库、要沉淀共享语言 |

> 只需对齐用 grill-me；想让对齐**沉淀成项目资产**、且长期降冗长用 grill-with-docs。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 往 CONTEXT.md 塞实现细节 | 违背「纯术语表」，它不是 spec/草稿 |
| 什么决策都记 ADR | 三门槛全真才记，否则是噪音 |
| 收录通用编程概念进术语表 | 只收项目专有词 |
| 批处理文档更新（攒着最后写） | 应就地更新，趁热打铁不遗漏 |
| 一次性小改动也用它 | 不涉新术语时用 grill-me 更轻 |

## 下一步

- [参考](./reference) —— SKILL.md 原文、CONTEXT-FORMAT / ADR-FORMAT 全文、ADR 门槛清单、真实样例
- 基础：[Grill Me](../grill-me/) —— 只盘问不建文档的轻量版
- 上游：[Skills For Real Engineers](https://github.com/mattpocock/skills)
