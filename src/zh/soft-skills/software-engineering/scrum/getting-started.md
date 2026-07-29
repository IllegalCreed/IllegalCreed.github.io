---
layout: doc
outline: [2, 3]
---

# 入门

> 基于《Scrum Guide 2020》（scrumguides.org/scrum-guide.html）编写

## 速查

- **定义**：Scrum 是轻量级框架，通过自适应解决方案在不确定性下创造价值，基于经验主义与精益思维
- **经验主义三柱**：透明（Transparency）、检视（Inspection）、适应（Adaptation）
- **3 accountability**：Product Owner（最大化产品价值）、Scrum Master（确立 Scrum + 提升效能）、Developers（每 Sprint 创造可用 Increment）
- **5 事件**：Sprint（≤1 月容器）、Sprint Planning、Daily Scrum（15 分钟，仅 Developers）、Sprint Review、Sprint Retrospective
- **3 工件 + 3 commitment**：Product Backlog→Product Goal；Sprint Backlog→Sprint Goal；Increment→Definition of Done
- **5 价值观**：承诺 Commitment、专注 Focus、开放 Openness、尊重 Respect、勇气 Courage
- **self-managing**：2020 版团队内部决定谁做什么、何时、如何（2017 是 self-organizing）
- **true leader who serves**：2020 版 Scrum Master 定位（2017 是 servant leader）
- **accountability 而非 role**：2020 版用「问责」取代「角色」削弱层级感
- **Definition of Done**：Increment 满足质量要求的正式描述，是 commitment 不是流程步骤
- **Sprint Goal**：单个 Sprint 的唯一目标，提供专注与连贯性
- **核心共识**：Scrum 让团队现有实践的效能与差距透明可见，本身不产生价值

## Scrum 是什么

### 一句话定义

```text
Scrum = 一个让「经验主义」可操作的轻量级框架：
        用短周期事件强制「透明 → 检视 → 适应」闭环，
        由 3 accountability + 5 事件 + 3 工件 + 5 价值观 构成。
```

Scrum 不教你「如何写代码」「如何测试」——这些是团队的工程实践，Scrum 不规定。它做的是把这些实践的**相对效能**与**差距**透明化：通过短 Sprint、明确的工件、强制检视事件，让「我们到底做得好不好」「哪里卡住了」无法被掩盖，从而触发改进。

### 经验主义：Scrum 的地基

Scrum 建立在经验主义之上，三个支柱：

| 支柱 | 含义 | Scrum 如何支撑 |
|---|---|---|
| 透明 Transparency | 决策所依据的过程与产物对相关人可见 | 工件公开（Backlog/Increment）、DoD 共识 |
| 检视 Inspection | 定期查看工件以发现偏差 | 5 个事件强制检视节奏 |
| 适应 Adaptation | 偏离可接受标准时及时调整 | 每个 Sprint 可重新规划、Retro 改进流程 |

适应有个前提：偏离被发现的时机不能太晚——这正是 Sprint 必须「≤1 个月」的原因。

### 3 个 Accountability（2020：取代 role）

```text
Product Owner（PO）   —— 最大化产品价值，管理 Product Backlog
Scrum Master（SM）    —— 确立 Scrum 定义，提升团队与组织效能（true leader）
Developers            —— 每个 Sprint 创造可用的 Increment
```

三者构成一个**自管理的 Scrum Team**（通常 10 人或更少），内部无子层级。要点：

- **PO** 对「做什么、什么顺序」负责，通过 Product Backlog 表达。PO 是一个人，不是委员会
- **SM** 对「Scrum 是否被正确理解与实践」负责，是 true leader who serves（真正的服务型领导），不是项目经理，不是团队的老板
- **Developers** 对「如何创造 Increment」负责，内部决定谁做什么、何时、如何（self-managing）

### 5 个事件

| 事件 | 时长上限 | 参与者 | 目的 |
|---|---|---|---|
| Sprint | ≤1 个月（容器事件） | 全团队 | 所有其他事件的容器 |
| Sprint Planning | ≤8 小时（1 月 Sprint） | 全团队 | 确定 Why（Sprint Goal）/What（Backlog 项）/How（计划） |
| Daily Scrum | 15 分钟 | Developers | 检视进度、调整当日计划 |
| Sprint Review | ≤4 小时（1 月 Sprint） | 全团队 + 利益相关者 | 检视 Increment、协作下一步 |
| Sprint Retrospective | ≤3 小时（1 月 Sprint） | 全团队 | 反思流程、计划改进 |

事件的目的：**减少其他未定义会议**。Scrum 把必要的沟通压缩进这些时间盒。

### 3 个工件 + 3 个 commitment

| 工件 | 谁管理 | commitment | commitment 含义 |
|---|---|---|---|
| Product Backlog | PO | Product Goal | 团队的长期目标 |
| Sprint Backlog | Developers | Sprint Goal | 单个 Sprint 的唯一目标 |
| Increment | 全团队 | Definition of Done | Increment 满足质量要求的正式描述 |

**commitment 的作用是增强透明**：让「我们要去哪（Product Goal）」「这期专注什么（Sprint Goal）」「怎样算完成（DoD）」对所有人清晰可见。

### 5 个价值观

```text
承诺 Commitment —— 个人致力于达成目标、互相支持
专注 Focus      —— 聚焦当前 Sprint 的工作与目标
开放 Openness   —— 对工作与挑战保持透明
尊重 Respect    —— 把彼此当作有能力、独立的人
勇气 Courage    —— 做正确的事、处理棘手问题
```

价值观是 Scrum 能否「活」起来的关键：有规则无价值观的 Scrum 是僵化的。

### 2020 vs 2017 关键变化

| 维度 | 2017 | 2020 |
|---|---|---|
| 称谓 | roles（角色） | accountabilities（问责） |
| 团队自管理 | self-organizing（自组织） | self-managing（自管理，内部决定谁做/何时/如何） |
| SM 定位 | servant leader（仆人式领导） | true leader who serves（真正的服务型领导） |
| 工件承诺 | 无统一概念 | 引入 commitment（Product Goal/Sprint Goal/DoD） |
| Development Team | 称「Development Team」 | 称「Developers」 |
| 团队规模 | 「Development Team 3-9 人」 | 整个 Scrum Team「10 人或更少」 |

## 下一步

- accountability 职责详解 / 事件流程深入 / artifact commitment 机制 / 2020 变化影响见 [指南](./guide-line.md)
- Scrum Guide 2020 全要素速查表 / 2020 vs 2017 完整对照 / 反模式清单 / 与 Kanban/XP 关系见 [参考](./reference.md)
