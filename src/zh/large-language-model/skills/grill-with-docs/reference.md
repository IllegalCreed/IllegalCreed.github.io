---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 mattpocock/skills 的 `grill-with-docs`、`domain-modeling`、`CONTEXT-FORMAT.md`、`ADR-FORMAT.md` 编写。

## 速查

- **命令**：`/grill-with-docs`（用户手动触发）
- **委托**：`Run a /grilling session, using the /domain-modeling skill.`
- **产物**：根 `CONTEXT.md`（术语表）+ `docs/adr/NNNN-slug.md`（ADR）
- **CONTEXT.md**：`## Language` 术语块，每词 1-2 句 + `_Avoid_`，纯 glossary
- **ADR 门槛**：难逆 + 无 context 会困惑 + 真实权衡（三条全真）
- **多上下文**：根 `CONTEXT-MAP.md` + 各上下文 `CONTEXT.md`/`docs/adr/`

## grill-with-docs SKILL.md 原文

```markdown
---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which
  also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.
```

## CONTEXT.md 格式

```markdown
# {Context Name}

{一两句说明这个上下文是什么、为何存在}

## Language

**Order**:
{术语的一两句描述}
_Avoid_: Purchase, transaction

**Invoice**:
交付后发给客户的付款请求。
_Avoid_: Bill, payment request

**Customer**:
下单的个人或组织。
_Avoid_: Client, buyer, account
```

**规则**：

- **要有主见**——一概念多词时选最好的，其余进 `_Avoid_`
- **定义要紧**——1-2 句，定义「是什么」不是「做什么」
- **只收项目专有词**——通用编程概念（超时、错误类型）不进
- **自然聚类用子标题**——多个术语成簇时分组，单一内聚区域平铺即可
- **纯术语表**——`totally devoid of implementation details`，不当 spec/草稿

## ADR 格式

```markdown
# {决策的简短标题}

{1-3 句：背景、决定了什么、为什么}
```

- 存 `docs/adr/`，顺序编号 `0001-slug.md`、`0002-slug.md`……
- **可短至一段**——价值在记录「做了决策 + 为什么」，不在填满章节
- 懒创建 `docs/adr/`——第一条 ADR 需要时才建
- 可选章节（多数不需要）：`Status` frontmatter、`Considered Options`、`Consequences`——仅在确有价值时加

## ADR 三门槛（全真才建）

| # | 门槛 | 不满足则 |
| --- | --- | --- |
| 1 | **难逆**——改主意代价大 | 易逆的以后再逆就是 |
| 2 | **无 context 会困惑**——读者会问「为啥这么做」 | 不惊讶的没人会问 |
| 3 | **真实权衡**——有备选、为具体理由选了这个 | 无备选的没什么可记 |

**够格的决策类型**：架构形状（monorepo / 事件溯源）、上下文间集成模式、带锁定的技术选型、边界与范围决策、刻意偏离显而易见路径、代码里看不见的约束、非显然的被拒备选。

## 多上下文：CONTEXT-MAP.md

多个子领域时，根目录 `CONTEXT-MAP.md` 列出各上下文与关系：

```markdown
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — 接收与追踪客户订单
- [Billing](./src/billing/CONTEXT.md) — 生成发票、处理付款
- [Fulfillment](./src/fulfillment/CONTEXT.md) — 仓库拣货与发货

## Relationships

- Ordering 发 OrderPlaced 事件；Fulfillment 消费它开始拣货
- Fulfillment 发 ShipmentDispatched；Billing 消费它生成发票
- Ordering 与 Billing 共享 CustomerId 和 Money 类型
```

引擎推断：有 `CONTEXT-MAP.md` 读它找上下文；只有根 `CONTEXT.md` 是单上下文；都没有则第一个术语确定时懒创建根 CONTEXT.md。

## 真实样例（Matt 自己的仓库）

```markdown
# Matt Pocock Skills

## Language

**Issue tracker**:
托管仓库 issue 的工具——GitHub Issues、Linear、本地 .scratch/ 约定。
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
Issue tracker 里被追踪的一个工作单元——bug、任务、spec、to-tickets 产出的切片。
_Avoid_: ticket（仅引用外部系统时用）

## Flagged ambiguities

- backlog 曾同时指「托管 issue 的工具」和「里面的工作体」——已解决：
  工具叫 Issue tracker，backlog 不再作术语。
```

> `## Flagged ambiguities` 段记录已解决的措辞混淆，是可选但有用的实践。

## domain-modeling 五动作

| 动作 | 触发 |
| --- | --- |
| 挑战术语 | 用词与 CONTEXT.md 冲突 |
| 锐化模糊语 | 出现模糊/多义词 |
| 编造边界场景 | 讨论领域关系时 |
| 与代码交叉核对 | 陈述某功能如何工作时 |
| 就地更新 | 术语确定 / 决策定案时 |

## 相关技能

| 技能 | 关系 |
| --- | --- |
| `grill-me` | 轻量版——只盘问，不建文档 |
| `grilling` | 共用的盘问引擎 |
| `domain-modeling` | 建 CONTEXT.md/ADR 的引擎（本技能挂它） |
| `to-spec` / `implement` | 对齐后转 spec、按 spec 用 TDD 实现 |

## 资源链接

- 仓库：[mattpocock/skills](https://github.com/mattpocock/skills)
- grill-with-docs：[skills/engineering/grill-with-docs](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)
- domain-modeling：[skills/engineering/domain-modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling)
- 轻量版：[Grill Me](../grill-me/)
- 领域驱动设计（术语来源）：Eric Evans, Domain-Driven Design
