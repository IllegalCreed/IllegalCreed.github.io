---
layout: doc
---

# 看板方法（Kanban）

看板方法（Kanban）是一种**渐进式演进**的工作管理方法，源自丰田生产方式（TPS），由 David Anderson 于 2010 年在《Kanban》一书中系统化为软件开发方法。它通过 **4 个核心实践**——**可视化工作流**、**限制在制品（WIP Limit）**、**管理流动**、**显式化流程规则**——让知识工作（软件开发、运维、设计）的价值流透明，并以**拉动系统（Pull System）**驱动持续改进。与 Scrum 的**时间盒（Sprint）**模式不同，Kanban 是**连续流（Continuous Flow）**模型：没有固定迭代、没有强制角色，工作一完成就拉入下一条，强调「**停止启动，开始完成（Stop starting, start finishing）**」。WIP 限制是 Kanban 的灵魂——它强制暴露瓶颈与问题，避免多任务并行导致的上下文切换浪费，形成「**需求驱动的拉系统**」。Kanban 与 Scrum 同属敏捷伞下，可融合为 **Scrumban**（保留 Scrum 的角色与回顾 + Kanban 的流式与 WIP）。适用场景：运维/支持型工作（需求随机到达）、持续发布的产品团队、不便设固定迭代的场景。信源 kanbanize.com/kanban-resources（现 businessmap.io）。核心共识：**Kanban 不要求改变现有流程，而是从当前状态起步，通过可视化与 WIP 限制推动渐进式演进——它「 старт с того, что есть（从现状开始）」**。

> 注意：本叶以 Kanban 方法（David Anderson 体系，kanbanize.com/kanban-resources）为准。市面上「看板」常被简化为「一块分 To Do / Doing / Done 三列的白板」——这只是可视化，缺少 WIP 限制与流动管理就不算真正的 Kanban 方法。

## 评价

**优点**

- **渐进式、低侵入**：不要求重组团队或改变流程，从现状起步，阻力小、易落地
- **可视化暴露问题**：价值流透明后，瓶颈、阻塞、堆积一目了然，无法被掩盖
- **WIP 限制提升完成率**：阻止多任务并行，减少上下文切换浪费，加速单件流动
- **拉系统适应随机需求**：工作完成才拉入下一条，天然适配运维/支持类随机到达的工作
- **无强制迭代与角色**：灵活，可与现有 Scrum/瀑布流程共存，门槛低
- **持续改进闭环**：通过反馈环（评审、运营评审）与流动指标（前置时间、吞吐率）驱动数据化改进

**缺点**

- **缺乏节奏感**：无固定迭代，长期目标与计划节奏弱，PO/利益相关者可能感到方向模糊
- **预测交付难**：连续流下「某功能何时完成」不如 Scrum 的 Sprint 承诺直观，需依赖统计预测
- **容易被简化为「白板」**：只画列不设 WIP 限制，丢失核心机制，沦为装饰
- **改进依赖团队主动性**：Kanban 不强制回顾事件，若团队不主动反思流动指标，改进停滞
- **不适合强依赖协调的大型新项目**：多团队强协调、强里程碑的场景，Scrum 的节奏更有效
- **WIP 限制执行难**：压力下团队易突破 WIP 上限，需纪律与文化支撑

## 文档地址

- [Kanban Resources（Kanbanize / Business Map）](https://kanbanize.com/kanban-resources/getting-started/what-is-kanban/)
- [David Anderson《Kanban: Successful Evolutionary Change for Your Technology Business》](https://www.djaa.com/)

## GitHub 地址

- Kanban 方法无代码仓库。工具实现见各 Kanban 板工具（Kanbanize/Trello/Jira Kanban）文档。

## 幻灯片地址

<a href="/SlideStack/kanban-slide/" target="_blank">看板方法（Kanban）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E7%9C%8B%E6%9D%BF%E6%96%B9%E6%B3%95%EF%BC%88Kanban%EF%BC%89" target="_blank" rel="noopener noreferrer">看板方法（Kanban）测试题</a>
