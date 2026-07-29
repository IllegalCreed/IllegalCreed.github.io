---
layout: doc
outline: [2, 3]
---

# 参考

> 基于《敏捷宣言》原文（agilemanifesto.org，2001）与 12 条原则（agilemanifesto.org/principles.html）编写

## 敏捷宣言原文（中英对照）

### 4 价值观

| 英文原文 | 中文 | 优先级 |
|---|---|---|
| Individuals and interactions over processes and tools | 个体和互动 高于 流程和工具 | 左 > 右 |
| Working software over comprehensive documentation | 工作的软件 高于 详尽的文档 | 左 > 右 |
| Customer collaboration over contract negotiation | 客户合作 高于 合同谈判 | 左 > 右 |
| Responding to change over following a plan | 响应变化 高于 遵循计划 | 左 > 右 |

免责声明原文：*"That is, while there is value in the items on the right, we value the items on the left more."*（也就是说，尽管右项有其价值，我们更重视左项的价值。）

### 12 原则（要点速览）

| # | 原则要点 |
|---|---|
| 1 | 最高优先级是早并持续交付有价值软件满足客户 |
| 2 | 即使开发后期也欢迎需求变更以获取竞争优势 |
| 3 | 频繁交付可用软件，数周到数月，倾向更短 |
| 4 | 业务人员与开发者必须每日协作 |
| 5 | 围绕有动力的个体建项目，给支持，信任他们 |
| 6 | 面对面沟通是最有效的信息传递方式 |
| 7 | 可用软件是进度的首要度量 |
| 8 | 敏捷过程倡导可持续开发，恒定节奏 |
| 9 | 持续关注技术卓越与良好设计增强敏捷 |
| 10 | 简洁——最大化未完成工作的艺术 |
| 11 | 最好的架构/需求/设计由自组织团队涌现 |
| 12 | 团队定期反思如何更有效，并调整行为 |

## 雪鸟会议（2001）关键事实

| 维度 | 事实 |
|---|---|
| 时间 | 2001 年 2 月 11-13 日 |
| 地点 | 美国犹他州瓦萨奇山脉雪鸟（Snowbird）滑雪场 The Lodge |
| 人数 | 17 位软件实践者 |
| 催化 | 此前 Kent Beck 在俄勒冈 Rogue River Lodge 召集的 XP 聚会孵化了这次会议 |
| 背景 | 各种「轻量级方法」（XP/Scrum/DSDM/ASD/Crystal/FDD）实践者寻找共同价值观 |
| 命名 | 术语 "Agile" 在会议中被采纳（多方建议，包括 Mike Beedle） |
| 产出 | 《敏捷宣言》：4 价值观 + 12 原则 |
| 后续 | 不久成立 Agile Alliance |

17 位签署人代表的方法包括：Kent Beck（XP）、Ken Schwaber & Jeff Sutherland（Scrum）、Alistair Cockburn（Crystal）、Jim Highsmith（ASD）、Arie van Bennekum（DSDM）、Martin Fowler（OO 设计）、Robert C. Martin 等。

## 敏捷伞下框架对比

| 框架 | 起源 | 核心机制 | 角色/约束 | 典型适用 |
|---|---|---|---|---|
| Scrum | 1995 Schwaber & Sutherland | 时间盒 Sprint + 事件 + 工件 | 严格（PO/SM/Developers） | 复杂产品开发 |
| Kanban | 源自丰田 TPS | 可视化 + WIP 限制 + 流式 | 灵活（无强制角色） | 运维/支持/持续发布 |
| XP（极限编程） | 1999 Kent Beck | TDD + 结对 + CI + 重构 | 工程实践密集 | 质量优先、需求多变 |
| Lean（精益） | 源自丰田 TPS / Poppendieck | 消除浪费 + 尽晚决策 + 尽快交付 | 原则导向 | 产品探索、价值流优化 |
| Crystal | Alistair Cockburn | 按项目规模/关键度调色 | 自适应 | 不同规模团队 |
| FDD | Peter Codd | 特性驱动 | 领域建模 + 特性列表 | 大型对象模型项目 |

## 敏捷 vs 瀑布 vs 看板 vs 精益

| 维度 | 瀑布 | 敏捷（伞） | Scrum | Kanban | Lean |
|---|---|---|---|---|---|
| 流程模型 | 线性阶段 | 价值观/原则 | 时间盒迭代 | 连续流 | 价值流优化 |
| 计划方式 | 一次性详尽 | 滚动式 | 每迭代重新规划 | 按需拉入 | 按价值流拉 |
| 变更处理 | 变更控制 | 欢迎 | 迭代内冻结、迭代间调整 | 随时拉入 | 尽晚决策适应 |
| 节奏 | 无固定 | 短迭代 | 1-4 周 Sprint | 连续 | 看价值流 |
| 适用 | 需求稳定/高合规 | 需求不确定 | 复杂产品 | 持续运维 | 探索/优化 |

## 反模式速查表

| 反模式 | 危害 |
|---|---|
| Water-Scrum-Fall（前端瀑布、中间 Scrum、后端瀑布） | 敏捷只在中间，前后仍是瓶颈 |
| Agile-in-name-only（Aino） | 有仪式无价值观 |
| 估算当承诺 | 估算失准被追责，团队开始保守虚高 |
| 无 DoD | 「完成」无客观标准，质量参差 |
| 零回顾 | 问题反复发生，无改进闭环 |
| 工具崇拜 | Jira/工具定义了工作方式，本末倒置 |
| 微观管理伪装成敏捷 | 每日追问进度，扼杀自组织 |

## 选型决策表

| 场景 | 推荐路径 |
|---|---|
| 需求不确定的创新产品 | 敏捷 + Scrum（节奏）+ XP（工程） |
| 需求稳定的高合规系统（航天/医疗） | 瀑布或瀑布+敏捷混合 |
| 运维/支持团队，需求随机到达 | Kanban |
| 大型多团队产品 | 单团队 Scrum 跑顺 → Nexus/LeSS |
| 超大型强合规组织 | SAFe（慎用，先评估团队成熟度） |
| 产品从 0 到 1 探索 | Lean Startup + Kanban |
| 工程质量短板 | 先补 XP/TDD/CI，再谈敏捷 |

## 常见术语对照

| 术语 | 含义 |
|---|---|
| Sprint | Scrum 的固定时间盒迭代（1-4 周） |
| Increment | 一个迭代产出的可用增量 |
| Backlog | 待办列表（Product Backlog / Sprint Backlog） |
| Story Point | 故事点，相对复杂度估算单位 |
| Velocity | 团队每迭代完成的故事点，用于容量规划 |
| DoD（Definition of Done） | 「完成」的客观标准 |
| Retro（Retrospective） | 回顾会，迭代末改进流程 |
| WIP Limit | 在制品上限（Kanban） |
| Timebox | 时间盒，固定时长的活动 |
| Empiricism | 经验主义，Scrum 的基础（透明/检视/调整） |

## 信源

- [Agile Manifesto（敏捷宣言）](https://agilemanifesto.org/)
- [12 Principles behind the Agile Manifesto](https://agilemanifesto.org/principles.html)
- [Agile Manifesto History（雪鸟会议历史）](https://agilemanifesto.org/history.html)
