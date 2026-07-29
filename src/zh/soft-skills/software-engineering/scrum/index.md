---
layout: doc
---

# Scrum

Scrum 是一个**轻量级框架**，用于在不确定性下通过**自适应解决方案**创造价值。它由 Schwaber & Sutherland 创建，权威定义是 **《Scrum Guide》**（scrumguides.org），现行版本为 **2020 版**。Scrum 建立在**经验主义**（Empiricism：透明、检视、适应）与**精益思维**之上，由 **3 个 accountability（问责）**、**5 个事件（Events）**、**3 个工件（Artifacts）+ 3 个 commitment（承诺）**、**5 个价值观**构成完整骨架。3 个 accountability 是 Product Owner（最大化产品价值）、Scrum Master（确立 Scrum 并提升团队效能，是「真正的服务型领导」true leader）、Developers（每个 Sprint 创造可用 Increment）。5 个事件：Sprint（容器，≤1 个月）、Sprint Planning、Daily Scrum（15 分钟，仅 Developers）、Sprint Review、Sprint Retrospective。3 个工件各有 commitment：Product Backlog→Product Goal、Sprint Backlog→Sprint Goal、Increment→Definition of Done。**2020 版相对 2017 版的关键变化**：用「accountability（问责）」取代「role（角色）」以削弱层级感；团队从 self-organizing（自组织）升级为 **self-managing（自管理，内部决定谁做什么、何时、如何）**；Scrum Master 从 servant leader（仆人式领导）改为 **true leader who serves（真正的服务型领导）**；引入 artifact commitment 概念。5 价值观：承诺（Commitment）、专注（Focus）、开放（Openness）、尊重（Respect）、勇气（Courage）。核心共识：**Scrum 不是方法论或流程，而是一个让团队现有实践的相对效能和差距透明可见的框架——它本身不产生价值，价值由团队在框架内创造**。

> 注意：本叶以《Scrum Guide 2020》（scrumguides.org/scrum-guide.html）为准。市面上许多「Scrum」材料混杂了 2017 版术语（如「roles」「servant leader」「Development Team」），需以 2020 版校准。

## 评价

**优点**

- **轻量且自洽**：整个框架不到 20 页，规则少而清晰，易于上手又难于精通
- **经验主义落地**：通过短周期事件（Sprint/Retro）强制「透明→检视→适应」闭环，把抽象的经验主义变成具体动作
- **职责清晰无层级**：3 个 accountability 把「做什么（PO）」「怎么做（Developers）」「如何更有效（SM）」分开，self-managing 团队内部无子层级
- **工件 + commitment 增强透明**：每个工件对应一个 commitment（Product Goal/Sprint Goal/DoD），让「目标」与「完成标准」客观可见
- **可伸缩**：单团队跑顺后可扩展到 Nexus/LeSS，框架内核不变
- **生态成熟**：工具（Jira/Azure DevOps）、社区、认证（PSM/CSM）完备，招聘与协作有共同语言

**缺点**

- **「难于精通」门槛高**：规则简单但落地需团队成熟度，self-managing 与跨职能要求高，新人多的团队硬上易翻车
- **被简化为仪式**：许多团队只做「站会 + 迭代」却忽略价值观与经验主义，沦为「Scrum 但不敏捷」
- **对 PO 要求极高**：PO 既要有愿景又要在 Backlog 决策中果断，PO 失职直接拖垮团队，而合格 PO 稀缺
- **不解决工程能力**：Scrum 框架不含 TDD/CI/重构等工程实践，无 XP 底座的 Scrum 易堆技术债
- **规模放大复杂**：多团队场景需扩展框架，跨团队依赖与集成是真实痛点
- **Sprint 边界僵化**：时间盒对持续发布/运维型工作不友好（这类场景 Kanban 更合适）

## 文档地址

- [Scrum Guide 2020（官方权威版）](https://scrumguides.org/scrum-guide.html)
- [Scrum Guides 历史版本（含 2017/2020 对照）](https://scrumguides.org/)

## GitHub 地址

- Scrum Guide 无代码仓库。框架实现工具见各 Atlassian/Azure DevOps 文档。

## 幻灯片地址

<a href="/SlideStack/scrum-slide/" target="_blank">Scrum</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Scrum" target="_blank" rel="noopener noreferrer">Scrum 测试题</a>
