---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Kanban 方法（David Anderson 体系，kanbanize.com/kanban-resources）与丰田生产方式编写

## 速查

- **本质**：Kanban 是渐进式演进的工作管理方法，从现状起步，用可视化 + WIP 限制推动改进
- **4 核心实践**：可视化工作流 / 限制在制品（WIP Limit）/ 管理流动 / 显式化流程规则
- **WIP 限制**：每个流程阶段的在制品数量上限，是 Kanban 的灵魂
- **拉系统**：只有当下游有空闲容量（WIP 未满）时，才从上游拉入工作
- **连续流 vs 时间盒**：Kanban 是连续流（无固定迭代），Scrum 是时间盒（Sprint）
- **核心箴言**：「Stop starting, start finishing」——停止启动，开始完成
- **6 一般原则**：从现状开始 / 追求渐进式演进 / 尊重当前流程与角色 / 各级领导力 / 客户需求导向 / 管理工作而非管理人
- **流动指标**：前置时间（Lead Time）、吞吐率（Throughput）、周期时间（Cycle Time）
- **vs Scrum**：Kanban 无强制迭代与角色、连续流；Scrum 有 Sprint 与 3 accountability
- **Scrumban**：Scrum 角色/回顾 + Kanban 流式/WIP 的融合
- **适用**：运维/支持（需求随机到达）、持续发布团队、不便固定迭代的场景
- **常见误解**：「分三列的白板」≠ Kanban，缺 WIP 限制就不算

## Kanban 是什么

### 一句话定义

```text
Kanban = 从现状起步、通过「可视化 + WIP 限制」推动渐进式演进的工作管理方法，
         用拉系统驱动知识工作的连续流。
```

Kanban 不要求你重组团队、改变流程或采用新角色——它从你**现在**的工作方式起步，叠加可视化和 WIP 限制，让问题暴露，从而触发渐进式改进。这与 Scrum「先定义框架再裁剪」的思路相反。

### 起源：从丰田到软件

Kanban 源自大野耐一（Taiichi Ohno）在丰田创立的**丰田生产方式（TPS）**中的「看板」（日语「看板」=广告牌/信号板）——一种用卡片传递生产信号的拉动系统，实现**准时制（JIT）**生产。David Anderson 在 2010 年《Kanban》一书中把它系统化为软件开发方法，保留了「可视化」「WIP 限制」「拉动」的内核，但适配了知识工作的不可见性。

### 4 核心实践

```text
1. 可视化工作流（Visualize the workflow）
   把工作项画在板上，按流程阶段分列，让价值流透明可见。

2. 限制在制品（Limit Work In Progress, WIP Limit）
   给每个流程阶段设一个在制品数量上限，阻止过载。

3. 管理流动（Manage flow）
   优化工作在系统中的流动，观察瓶颈，让工作快速、顺畅地流过。

4. 显式化流程规则（Make process policies explicit）
   把「一个工作项如何进入下一阶段」的规则写清楚，让协作有共识。
```

辅助实践还包括：实现反馈环（Feedback loops，如每日站会、评审）、协作式改进（Improve collaboratively）。

### WIP 限制与拉系统

WIP 限制是 Kanban 的灵魂。当一个流程阶段的在制品达到上限，**不允许再拉入新工作**，团队必须先完成现有的。这形成**拉系统（Pull System）**：

```text
工作只有在下游有空闲容量（WIP 未满）时，才被「拉」入下一阶段。
这与「推系统」（上游做完就推给下游，不管下游是否过载）相反。
```

拉系统的好处：①暴露瓶颈（瓶颈前的列会堆积）；②防止过载；③减少多任务并行的上下文切换浪费。

### Kanban vs Scrum

| 维度 | Kanban | Scrum |
|---|---|---|
| 工作模型 | 连续流 | 时间盒（Sprint） |
| 迭代 | 无固定迭代 | 固定长度 Sprint（≤1 月） |
| 角色 | 无强制角色 | 3 accountability（PO/SM/Developers） |
| 变更窗口 | 随时可拉入（容量允许时） | Sprint 内尽量不变 |
| 承诺机制 | 流动指标（前置时间） | Sprint Goal |
| 度量 | 前置时间、吞吐率 | Velocity |
| 起步方式 | 从现状开始 | 先定义框架 |
| 适用 | 运维/支持/持续发布 | 复杂产品开发 |

### Scrumban：融合

Scrumban 在 Scrum 上叠加 Kanban：保留 Scrum 的角色（PO/SM）、回顾、Review，但放弃固定 Sprint，改用 Kanban 的流式与 WIP 限制。适合「想要 Scrum 的协作结构，但工作流不适合固定迭代」的团队（如运维 + 产品混合团队）。

### 流动指标三件套

| 指标 | 含义 |
|---|---|
| 前置时间 Lead Time | 从需求提出到交付的总时间 |
| 周期时间 Cycle Time | 从开始处理到完成的时间 |
| 吞吐率 Throughput | 单位时间完成的项数 |

用累积流图（CFD）和前置时间分布图可做交付预测。

## 下一步

- 4 核心实践深度 / 拉系统与 WIP 调优 / 流动指标分析 / Scrumban 实践见 [指南](./guide-line.md)
- 6 一般原则 / 实践对照表 / 选型决策 / 与 Scrum/Lean 关系见 [参考](./reference.md)
