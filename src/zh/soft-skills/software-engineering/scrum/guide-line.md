---
layout: doc
outline: [2, 3]
---

# 指南

> 基于《Scrum Guide 2020》（scrumguides.org/scrum-guide.html）编写

## 速查

- **经验主义三柱**：透明（工件可见 + DoD 共识）、检视（5 事件强制节奏）、适应（偏离及时调整）
- **PO 核心**：最大化产品价值，对 Product Backlog 的有效管理负责，是一人非委员会
- **SM 核心**：确立 Scrum 定义，服务团队（清除障碍、确保事件举行）+ 服务 PO（辅导 Backlog 管理）+ 服务组织
- **Developers 核心**：每 Sprint 创造满足 DoD 的可用 Increment，self-managing 内部决定分工
- **Sprint Planning 三问**：Why（Sprint Goal）/ What（选哪些 Backlog 项）/ How（如何完成）
- **Daily Scrum**：15 分钟、仅 Developers、目的是检视 Sprint Goal 进展并调整当日计划
- **Sprint Review**：协作式工作会，检视 Increment + 共同规划下一步
- **Sprint Retrospective**：聚焦「团队如何协作」「做了什么」「如何改进」，非技术评审
- **commitment 机制**：Product Goal（长期目标）/ Sprint Goal（本期唯一目标）/ DoD（完成标准）
- **DoD 是 commitment**：Increment 必须「满足 DoD」才能算完成，DoD 由团队制定
- **2020 关键变化**：role→accountability、self-organizing→self-managing、servant leader→true leader、引入 commitment
- **核心共识**：Scrum 让团队现有实践透明，本身不产生价值，价值由团队在框架内创造

## Scrum Team 深入

### 一个自管理的整体

Scrum Team 是一个**自管理（self-managing）**的整体：内部决定**谁**做**什么**、**何时**、**如何**。它通常 **10 人或更少**（含 PO 与 SM），无子层级、无头衔（不区分「前端 Developer」「后端 Developer」）、无小组。小而跨职能的目的是减少沟通损耗、提升自管理能力。

### Product Owner（PO）

PO 对**最大化产品价值**负责，具体通过有效管理 Product Backlog：

| 职责 | 说明 |
|---|---|
| 制定并沟通 Product Goal | 让团队知道长期方向 |
| 创建并清晰表达 Product Backlog 项 | 让 Developers 理解 |
| 对 Backlog 项排序 | 按价值与依赖 |
| 确保透明 | Backlog 对所有人可见 |
| 确保 Developers 理解到所需程度 | 达到 Sprint Planning 所需 |

关键：**PO 是一个人**，不是委员会。PO 可以把部分决策委托出去，但最终问责在 PO 一人。PO 失职（无愿景、Backlog 混乱、不在场）是 Scrum 团队失败的头号原因。

### Scrum Master（SM）

SM 对**确立 Scrum 定义**与**团队效能**负责，是 **true leader who serves（真正的服务型领导）**。SM 不是项目经理、不是团队的老板、不分配任务。SM 服务的对象有三个：

| 服务对象 | SM 做什么 |
|---|---|
| Scrum Team | 辅导、清除障碍、确保事件举行且正向、提升效能 |
| Product Owner | 辅导有效 Backlog 管理、理解产品价值、跨团队协作 |
| 组织 | 领导并辅导 Scrum 采纳、规划实施、帮员工与利益相关者理解 |

2020 把 servant leader 改为 true leader who serves，强调 SM 是「领导」——主动推动 Scrum 与组织变革，而非被动「服务」。SM 应是变革推动者。

### Developers

Developers 对**每个 Sprint 创造可用的 Increment** 负责。他们 self-managing，内部决定分工。Developers 的职责包括：

- 为 Sprint Planning 创建计划（Sprint Backlog）
- 把质量与 DoD 内建到 Increment 中
- 每个 Sprint 至少把一个 Increment（或其一部分）调整为可用
- 向 PO 与利益相关者对齐进展

注意：Scrum 不在 Developers 内部分「前端/后端/测试」头衔——团队是跨职能的、扁平的。

## 5 个事件深入

### Sprint：容器事件

Sprint 是所有其他事件的**容器**，固定长度 **≤1 个月**。短 Sprint（2 周）反馈快，长 Sprint（4 周）规划稳。Sprint 期间：**不做危害 Sprint Goal 的范围变更**、**不降低质量**、**Product Goal 保持稳定**。Sprint 取消只有 PO 可决定，且极罕见——取消会浪费已投入工作、打乱节奏。

### Sprint Planning：回答 Why / What / How

```text
Why  —— 这次 Sprint 的目标是什么？（Sprint Goal）
What —— 选哪些 Product Backlog 项？（进入 Sprint Backlog）
How  —— 如何完成这些项？（计划，进入 Sprint Backlog）
```

Planning 的产物是 **Sprint Backlog**（含 Sprint Goal + 选中的项 + 完成计划）。主题（Topic）：Sprint Goal 决定方向，Why 优先于 What。

### Daily Scrum：15 分钟，仅 Developers

Daily Scrum 的目的是 **检视 Sprint Goal 的进展** 并 **调整当日计划**。它不是状态汇报、不是给经理看的。只有 Developers 参与（SM/PO 可旁听但不主导）。每天同一时间、同一地点，15 分钟内完成。它是检视与适应的微节奏。

### Sprint Review：协作式工作会

Review 是**协作式**的，不是单向演示：团队与利益相关者共同检视 Increment、讨论进展、协作下一步要做什么。产物是把 Product Backlog 调整为最新状态。它替代了「需求评审 + 验收」的对立式会议。

### Sprint Retrospective：聚焦「如何工作」

Retrospective 检视**过去 Sprint 的过程**：团队如何协作、沟通、工具、DoD 是否有效。它聚焦改进，而非技术评审。产物是**可执行的改进项**（进入下个 Sprint Backlog）。

## 3 个工件 + 3 个 commitment

### Product Backlog → Product Goal

Product Backlog 是团队所有工作的**单一来源**，按优先级排序，由 PO 管理。它的 commitment 是 **Product Goal**——Scrum Team 的长期目标，每个 Sprint 都应朝 Product Goal 推进。Product Goal 一次只有一个——完成当前 Goal 才设下一个。

### Sprint Backlog → Sprint Goal

Sprint Backlog = Sprint Goal + 选中的 Product Backlog 项 + 完成它们的计划。它的 commitment 是 **Sprint Goal**——单个 Sprint 的**唯一**目标，提供专注与连贯性。Developers 可在 Sprint 内调整 Sprint Backlog（增删项），只要不偏离 Sprint Goal。

### Increment → Definition of Done

Increment 是朝 Product Goal 迈进的**可用阶梯**。一个 Increment 必须**满足 Definition of Done（DoD）**才算「完成」。DoD 是 Increment 满足质量要求的**正式描述**，由 Scrum Team 制定（若组织级有标准则作为最低底线）。每个 Increment 都**累加**到既有 Increment 上，并一同保持可用。

```text
Increment 的核心属性：
  - 可用（usable）
  - 满足 DoD
  - 累加到既有 Increment
  - 朝 Product Goal 推进
```

## 2020 vs 2017：影响分析

### role → accountability（问责）

2017 称 PO/SM/Development Team 为「roles（角色）」，2020 改为「accountabilities（问责）」。这不只是术语变化：**角色暗示层级与边界**（「这是我的角色不是你的」），**问责强调「这件事谁负责」**。改术语意在减少「这不是我的工作」的推诿，强调 Scrum Team 是整体。

### self-organizing → self-managing（自管理）

2017 的 self-organizing（自组织）指团队自行选择**如何**完成工作；2020 的 self-managing（自管理）更进一步：团队内部决定**谁做什么、何时、如何**。这是把决策权更彻底地下放——管理者与 SM 不再分配任务，团队自行分工。

### servant leader → true leader who serves

2017 称 SM 为 servant leader（仆人式领导），2020 改为 **true leader who serves（真正的服务型领导）**。原因：servant leader 常被误解为「唯唯诺诺的服务者」「只做杂事」。2020 强调 SM 是**真正的领导**——主动推动 Scrum 采纳、组织变革、清除系统性障碍，同时以服务姿态做这些事。

### 引入 artifact commitment

2017 各工件无统一「承诺」概念，DoD 是流程描述。2020 引入 commitment：每个工件对应一个承诺（Product Goal/Sprint Goal/DoD），让「目标」与「完成标准」客观可见，增强透明。

## 工程实践：Scrum 不解决的部分

Scrum Guide 不含 TDD、CI、重构、结对等工程实践——这些是 Developers 自己的实践。但 **DoD 强制质量内建**，若 DoD 写「代码须有单元测试并通过 CI」，则工程实践被 DoD 拉进框架。无工程底座的 Scrum 易堆技术债，常需配合 XP 实践。

## 规模扩展

单 Scrum Team（≤10 人）跑顺后，多团队场景用扩展框架：

| 框架 | 特点 |
|---|---|
| Nexus | Scrum 官方扩展，多团队共用 Product Backlog + 集成 Sprint |
| LeSS | 保持 Scrum 简洁，多团队一个 PO |
| SAFe | 重型，层级化，适合超大型强合规 |

共识：**单团队 Scrum 都跑不顺，扩展框架救不了**。
